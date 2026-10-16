// The render service's pool and store (server/render.mjs) with a stand-in engine and cache: lanes and
// priorities, foreground never waiting behind background work, hints replacing the plan, and the LRU cap.
//   node --test test/render-queue.test.mjs
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createService, laneCaps } from '../server/render.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tick = () => sleep(5);
/** A valid-enough JPEG (SOI, SOF0 with the size, padding, EOI) of `bytes` bytes. */
function jpeg(w, h, bytes = 300) {
  const b = Buffer.alloc(Math.max(bytes, 40));
  Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x03]).copy(b);
  b[b.length - 2] = 0xff; b[b.length - 1] = 0xd9;
  return b;
}
/** An engine whose renders wait until the test lets them go (or finish at once with auto). */
function fakeEngine(name = 'fake', { auto = false, bytes = 300, fail = () => false } = {}) {
  const e = {
    name, calls: [], held: [], auto,
    async info() { return { n: 40, pages: Array.from({ length: 40 }, () => ({ w: 612, h: 792 })) }; },
    render(o) {
      e.calls.push({ k: o.k, lane: o.lane, file: o.file });
      const go = () => { if (fail(o)) throw new Error(name + ' cannot'); writeFileSync(o.out, jpeg(1391, 1800, bytes)); return { pw: 612, ph: 792 }; };
      if (e.auto) return Promise.resolve().then(go);
      return new Promise((res, rej) => e.held.push({ o, go: () => { try { res(go()); } catch (x) { rej(x); } } }));
    },
    releaseAll() { for (const h of e.held.splice(0)) h.go(); },
    release(pred) { const i = e.held.findIndex((h) => pred(h.o)); if (i >= 0) e.held.splice(i, 1)[0].go(); },
    close() {},
  };
  return e;
}
const dirs = [], svcs = [];
afterEach(() => { for (const s of svcs.splice(0)) s.stop(); for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });
function setup({ workers = 3, max = 1e9, engines = [fakeEngine()], onDisk = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'stacks-render-q-')); dirs.push(dir);
  const disk = new Set(onDisk || []);
  const cache = {
    allowed: (u) => /^https:\/\/arxiv\.org\//.test(u),
    cached: (u) => onDisk == null || disk.has(u),
    paths: (u) => ({ body: join(dir, 'src-' + encodeURIComponent(u)) }),
    ensure: async (u) => { disk.add(u); },
  };
  const svc = createService({ dir: join(dir, 'render'), cache, workers, max, engines, log: () => {} });
  svcs.push(svc);
  return { svc, dir, engine: engines[0], disk };
}
const U = (n) => `https://arxiv.org/pdf/2401.0000${n}`;
const lanesOf = (svc) => ({ ...svc.running });

test('lane caps: background never holds the last worker', () => {
  assert.deepEqual(laneCaps(1), { slots: 2, bg: 1, near: 1, ahead: 1 });
  assert.deepEqual(laneCaps(3), { slots: 3, bg: 2, near: 2, ahead: 1 });
  assert.deepEqual(laneCaps(9), { slots: 9, bg: 8, near: 8, ahead: 7 });
});

test('a hint fills near before ahead, within the caps; a foreground page starts at once', async () => {
  const { svc, engine } = setup();
  await svc.start();
  const r = await svc.hint({ open: { u: U(1), k: 0, w: 1800, per: 2 }, next: [{ u: U(2), k: 0 }, { u: U(3), k: 0 }, { u: U(4), k: 0 }, { u: U(5), k: 0 }] });
  assert.equal(r.n[U(1)], 40);
  await tick();
  assert.deepEqual(lanesOf(svc), { fg: 0, near: 2, ahead: 0 }); // 3 workers: background may hold 2
  assert.equal(engine.calls.length, 2);
  assert.ok(engine.calls.every((c) => c.lane === 'near'));
  assert.deepEqual(engine.calls.map((c) => c.k), [0, 1]); // the spread on screen first
  // The reader turns to page 30, which nothing has planned: it starts now, beside the background work.
  const q = svc.request(U(1), 30, 1800, 'fg');
  assert.ok(q.job);
  await tick();
  assert.deepEqual(lanesOf(svc), { fg: 1, near: 2, ahead: 0 });
  assert.equal(engine.calls.at(-1).k, 30); assert.equal(engine.calls.at(-1).lane, 'fg');
  engine.release((o) => o.k === 30);
  const out = await q.job.promise;
  assert.equal(out.ok, true); assert.ok(existsSync(out.file));
  assert.equal(svc.have(U(1), 30, 1800), out.file);
  // Drain: every near job runs before any ahead job.
  const seen = [];
  for (let i = 0; i < 200 && (engine.held.length || svc.queues.near.length || svc.queues.ahead.length); i++) { for (const h of engine.held) seen.push(h.o.lane); engine.releaseAll(); await tick(); }
  const firstAhead = seen.indexOf('ahead'), lastNear = seen.lastIndexOf('near');
  assert.ok(firstAhead > lastNear, `near after ahead: ${seen.join(',')}`);
  assert.equal(svc.stateOf(U(1), 1800).bits, '1'.repeat(40)); // the rest of the open document, at ahead
  assert.equal(svc.summary().failed, 0);
});

test('one worker: background still leaves a slot for the foreground', async () => {
  const { svc, engine } = setup({ workers: 1 });
  await svc.start();
  await svc.hint({ open: { u: U(1), k: 0, w: 1400 }, next: [] });
  await tick();
  assert.deepEqual(lanesOf(svc), { fg: 0, near: 1, ahead: 0 });
  svc.request(U(1), 20, 1400, 'fg');
  svc.request(U(1), 21, 1400, 'fg');
  await tick();
  assert.equal(svc.running.fg, 1); // the reserved slot; the second fg page waits for it, not for background
  assert.equal(svc.queues.fg.length, 1);
  engine.releaseAll(); await tick();
  assert.equal(engine.calls.filter((c) => c.lane === 'fg').length, 2);
  engine.releaseAll();
});

test('a new hint drops queued background jobs it no longer names; running ones finish; fg stays', async () => {
  const { svc, engine } = setup({ workers: 2 }); // background 1 slot
  await svc.start();
  await svc.hint({ open: { u: U(1), k: 0, w: 1800 }, next: [{ u: U(2), k: 0 }] });
  await tick();
  assert.equal(svc.running.near, 1);
  const running = engine.calls[0];
  const waiting = svc.request(U(1), 35, 1800, 'near'); // the browser's prefetch is waiting on this one
  assert.ok(svc.queues.near.length > 3);
  // The reader jumps to another document.
  await svc.hint({ open: { u: U(7), k: 4, w: 1800 }, next: [{ u: U(8), k: 0 }] });
  const keys = [...svc.jobs.values()].filter((j) => j.state !== 'running');
  assert.ok(keys.every((j) => j.u === U(7) || j.u === U(8) || j.waiters), keys.map((j) => j.u + ' ' + j.k).join('; '));
  assert.ok(keys.some((j) => j.u === U(1) && j.k === 35 && j.waiters === 1), 'a job someone waits for is kept');
  assert.ok(svc.summary().dropped > 30);
  // The running job of the old plan finishes and is stored.
  engine.release((o) => o.k === running.k && o.file.includes(encodeURIComponent(U(1))));
  await tick();
  assert.ok(svc.have(U(1), running.k, 1800));
  // Next to run: the new document's spread on screen.
  await tick();
  assert.ok(engine.calls.at(-1).file.includes(encodeURIComponent(U(7))));
  assert.equal(engine.calls.at(-1).k, 4);
  engine.releaseAll(); await tick(); engine.releaseAll(); svc.release(waiting.job);
});

test('a waiting request promotes a queued job; one nobody waits for any more drops to near', async () => {
  const { svc, engine } = setup({ workers: 2 });
  await svc.start();
  await svc.hint({ open: { u: U(1), k: 0, w: 1800 }, next: [] });
  await tick();
  const job = [...svc.jobs.values()].find((j) => j.k === 30);
  assert.equal(job.lane, 'ahead');
  const r = svc.request(U(1), 30, 1800, 'fg');
  assert.equal(r.job, job);
  await tick();
  assert.equal(job.state, 'running'); assert.equal(job.runLane, 'fg');
  // Queue a foreground page behind it (both slots busy), then give up waiting: it goes to near.
  const r2 = svc.request(U(1), 31, 1800, 'fg');
  await tick();
  assert.equal(r2.job.state, 'queued'); assert.equal(r2.job.lane, 'fg');
  svc.release(r2.job);
  assert.equal(r2.job.lane, 'near');
  engine.releaseAll(); await tick(); engine.releaseAll();
});

test('pages whose PDF is not on disk wait without a worker, then run when it lands', async () => {
  const { svc, engine, disk } = setup({ onDisk: [U(1)] });
  await svc.start();
  assert.equal(svc.request(U(2), 0, 1800, 'fg').now.code, 204); // never a slow error for the reader
  await svc.hint({ open: { u: U(1), k: 0, w: 1800 }, next: [{ u: U(2), k: 0 }] });
  await tick();
  assert.ok(disk.has(U(2)), 'a near document is fetched'); // cache.ensure in the background
  for (let i = 0; i < 50 && !engine.calls.some((c) => c.file.includes(encodeURIComponent(U(2)))); i++) { engine.releaseAll(); await tick(); }
  assert.ok(engine.calls.some((c) => c.file.includes(encodeURIComponent(U(2)))));
  engine.releaseAll();
});

test('an engine that fails falls through to the next; five in a row and it steps aside', async () => {
  const bad = fakeEngine('bad', { auto: true, fail: () => true }), good = fakeEngine('good', { auto: true });
  const { svc } = setup({ engines: [bad, good] });
  await svc.start();
  for (let k = 0; k < 6; k++) {
    const r = svc.request(U(1), k, 1400, 'fg');
    const out = await r.job.promise;
    assert.equal(out.ok, true); assert.equal(out.r.by, 'good');
  }
  assert.equal(svc.engine, 'good');
  assert.ok(svc.summary().fellThrough >= 5);
  // Both failing: the page fails (422 to the browser, which draws it with pdf.js) and is not retried at once.
  const worse = fakeEngine('worse', { auto: true, fail: () => true });
  const s2 = setup({ engines: [worse] }).svc; await s2.start();
  const out = await s2.request(U(1), 3, 1400, 'fg').job.promise;
  assert.equal(out.ok, false);
  assert.equal(s2.request(U(1), 3, 1400, 'fg').now.code, 422);
});

test('the store keeps to its cap, least recently used first, and survives a restart', async () => {
  const max = 3000; // ten 300-byte pages fit, at 90% after an eviction
  const { svc, dir } = setup({ max, engines: [fakeEngine('fake', { auto: true, bytes: 300 })] });
  await svc.start();
  for (let k = 0; k < 10; k++) assert.equal((await svc.request(U(1), k, 1800, 'fg').job.promise).ok, true);
  assert.equal(svc.bytes, 3000);
  await sleep(10);
  assert.ok(svc.have(U(1), 0, 1800)); // page 0 used again: it is now the most recent
  for (let k = 10; k < 14; k++) { assert.equal((await svc.request(U(1), k, 1800, 'fg').job.promise).ok, true); assert.ok(svc.bytes <= max, `${svc.bytes} > ${max}`); await sleep(2); }
  assert.ok(svc.have(U(1), 0, 1800), 'the page used last stays');
  assert.equal(svc.have(U(1), 1, 1800), null, 'the least recently used goes first');
  assert.ok(svc.have(U(1), 13, 1800));
  // The index matches the files on disk.
  const sha = svc.keyOf(U(1));
  const files = readdirSync(join(dir, 'render', sha)).filter((f) => /^\d+_\d+\.jpg$/.test(f));
  assert.equal(files.length * 300, svc.bytes);
  assert.equal(files.reduce((m, f) => m + statSync(join(dir, 'render', sha, f)).size, 0), svc.bytes);
  // A new service on the same folder finds them, and info.json (page count) without the engine.
  const again = createService({ dir: join(dir, 'render'), cache: { allowed: () => true, cached: () => false, paths: () => ({ body: '/none' }), ensure: async () => {} }, engines: [fakeEngine()], max, log: () => {} });
  svcs.push(again);
  await again.start();
  assert.equal(again.bytes, svc.bytes);
  assert.equal(again.stateOf(U(1), 1800).n, 40);
  assert.ok(again.have(U(1), 13, 1800));
  // forget() drops a document.
  assert.equal(again.forget(U(1)), files.length * 300);
  assert.equal(again.bytes, 0);
});
