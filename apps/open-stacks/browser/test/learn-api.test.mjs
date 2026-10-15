// The learning routes (server/routes/47-learn.mjs) and the memory additions
// (45-memory.mjs), against a real server on a temp cache and a temp copy of the app
// (so a few corpus items can carry `added`, as agent jobs leave them).
// Run: node --test test/learn-api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { makeRoot, startServer, until, realCorpus } from './stacks-root.mjs';
import { readOps, quickOps } from './learn-ops.mjs';
import { localDay } from '../server/learn.mjs';

const DAY = 864e5;
const C = realCorpus();
const today = localDay(Date.now());
const FINDS = C.items.filter((it) => it.lane === 'ai-safety').slice(0, 4).map((it) => it.id);
for (const it of C.items) if (FINDS.includes(it.id)) Object.assign(it, { added: today, job: 'discover-0001', via: { source: 'arxiv', query: 'test', seeds: ['arxiv:2402.03300'] } });
let root, srv, off;

before(async () => {
  root = makeRoot({ corpus: C, data: false, prefix: 'stacks-learn-api-' });
  srv = await startServer(root, { STACKS_JOBS_DIR: join(root, 'jobs-test') });
  await until(async () => (await srv.get('/status')).learn?.at > 0, 15000);
});
after(() => { srv?.stop(); off?.stop(); if (root) rmSync(root, { recursive: true, force: true }); });

const rank = (since) => srv.get('/learn/profile.json?part=rank' + (since != null ? '&since=' + since : ''));
const memOps = (ops) => srv.post('/memory', { ops }).then((r) => r.json());

test('/status.learn and the cold profile', async () => {
  const s = await srv.get('/status');
  assert.equal(s.learn.on, true);
  assert.ok(s.learn.features >= 0 && s.corpusAt > 0);
  const r = await rank();
  assert.equal(r.on, true); assert.equal(r.B, 0.8); assert.equal(r.exposures, 0);
  assert.deepEqual(r.pred, {});
  assert.deepEqual(r.new.sort(), [...FINDS].sort(), 'new finds are listed');
  for (const id of FINDS) assert.ok(r.phi[id] > 0.25, 'a new find gets the fresh bonus');
  assert.deepEqual(await rank(r.at), { same: true, at: r.at });
});

test('reading statistics: days, totals, streak', async () => {
  // Five days of 12-minute reads in one lane, ending today.
  const lane = C.items.filter((it) => it.lane === 'information-theory');
  const now = Date.now(), ops = [], perDay = {};
  for (let k = 0; k < 5; k++) {
    const it = lane[k], s = now - k * DAY - 15 * 60e3;
    ops.push(...readOps(it.id, { mins: 12, frac: 0.5, at: s, it }));
    perDay[localDay(s)] = (perDay[localDay(s)] || 0) + 12 * 60e3;
  }
  assert.deepEqual((await memOps(ops)).ok, true);
  const r = await srv.get('/learn/reading.json?days=10');
  assert.equal(r.days.length, 10);
  assert.equal(r.days.at(-1).d, today);
  for (const d of r.days) assert.equal(d.ms, perDay[d.d] || 0, d.d);
  assert.ok(r.days.filter((d) => d.items === 1).length >= 4);
  assert.ok(r.streak.current >= 4 && r.streak.best >= r.streak.current, JSON.stringify(r.streak));
  assert.equal(r.totals.week.items, 5);
  assert.equal(r.totals.week.ms, 5 * 12 * 60e3);
  assert.ok(r.lanes30['information-theory'] === 5 * 12 * 60e3);
  assert.ok(r.best.length >= 1 && r.best[0].V > 0);
});

test('session A: the rank part changes within 2 s; why chips add up', async () => {
  const at = Date.now() - DAY;
  const r0 = await rank();
  const ops = [
    ...readOps('arxiv:2402.03300', { mins: 18, frac: 0.9, at }),
    ...readOps('arxiv:2501.12948', { mins: 35, frac: 0.8, days: 2, judge: ['save'], at }),
    ...readOps('arxiv:2501.19393', { mins: 14, frac: 0.9, at }),
    ...readOps('arxiv:2408.03314', { mins: 20, frac: 0.7, judge: ['more'], at }),
    ...readOps('arxiv:2503.11926', { mins: 9, frac: 0.5, at }),
  ];
  for (const it of C.items.filter((x) => x.lane === 'ttrpg').slice(0, 6)) ops.push(...quickOps(it.id, { secs: 3, at, it }));
  const t0 = Date.now();
  await memOps(ops);
  const r1 = await until(async () => { const r = await rank(r0.at); return r.same ? null : r; }, 2000, 50);
  assert.ok(Date.now() - t0 <= 2000);
  assert.ok(r1.exposures >= 10 && r1.pred['arxiv:2201.11903'] > 0.2, JSON.stringify({ e: r1.exposures, p: r1.pred['arxiv:2201.11903'] }));
  assert.ok(r1.laneFactor.llm > 1 && r1.laneFactor.ttrpg < 1);
  assert.equal(r1.phi['arxiv:2402.03300'], -0.8, 'a finished read sinks');
  const w = await srv.get('/learn/why?id=arxiv:2201.11903');
  assert.equal(w.state, 'unread');
  const sum = w.chips.reduce((s, c) => s + c.d, 0) + w.rest;
  assert.ok(Math.abs(sum - 0.8 * w.I) <= 0.01, `${sum} vs ${0.8 * w.I}`);
  assert.ok(w.chips.some((c) => c.label === 'LLM papers › Reasoning' && /^you read \d deeply/.test(c.text)), JSON.stringify(w.chips));
  const read = await srv.get('/learn/why?id=arxiv:2501.12948');
  assert.deepEqual({ label: read.read.label, j: read.read.j }, { label: 'deep', j: 'save' });
  const many = await srv.get('/learn/why?ids=arxiv:2201.11903,nope:x');
  assert.ok(many.items['arxiv:2201.11903'] && many.items['nope:x'] === null);
  assert.equal((await fetch(srv.base + '/learn/why?id=nope:x')).status, 404);
  const full = await srv.get('/learn/profile.json');
  assert.ok(full.feat['path:llm/Reasoning'].l > 0.5 && full.seeds.includes('arxiv:2501.12948'));
  const feats = await srv.get('/learn/features?limit=5');
  assert.equal(feats.items.length, 5);
  const q = await srv.get('/learn/features?q=forecast&limit=50');
  assert.ok(q.items.some((x) => x.f === 'lane:forecasting'), 'search reaches features never read');
  const hist = await srv.get('/learn/history.json?days=30');
  assert.ok(hist.days.length >= 1 && hist.days.at(-1).d === today);
  // The first open of an item each day goes to opens.jsonl (the calibration data).
  assert.ok(existsSync(join(srv.cache, 'learn', 'opens.jsonl')));
  assert.ok(readFileSync(join(srv.cache, 'learn', 'opens.jsonl'), 'utf-8').includes('"id":"arxiv:2402.03300"'));
});

test('a boost changes pred within 1 s; null clears it', async () => {
  const r0 = await rank();
  const target = C.items.find((it) => it.lane === 'cybernetics');
  assert.ok(!(r0.pred[target.id] > 0.3));
  const c = await (await srv.post('/learn/control', { f: 'lane:cybernetics', mode: 'boost' })).json();
  assert.equal(c.ok, true); assert.equal(c.ctl['lane:cybernetics'].mode, 'boost');
  const t0 = Date.now();
  const r1 = await until(async () => { const r = await rank(r0.at); return !r.same && r.pred[target.id] > (r0.pred[target.id] || 0) ? r : null; }, 1000, 50);
  assert.ok(Date.now() - t0 <= 1000 && r1.laneFactor.cybernetics > 1);
  assert.equal((await srv.post('/learn/control', { f: 'bad', mode: 'boost' })).status, 400);
  assert.equal((await srv.post('/learn/control', { f: 'lane:cybernetics', mode: 'nonsense' })).status, 400);
  await srv.post('/learn/control', { f: 'lane:cybernetics', mode: null });
  await until(async () => ((await rank()).laneFactor.cybernetics === 1 ? true : null), 1500, 50);
});

test('the one-time import is idempotent', async () => {
  const body = { aff: { lane: { forecasting: 1.5, ttrpg: -2, nolane: 3 }, tok: { forecasting: 0.8, zzzz: 2, tiny: 0.1 } }, saved: ['arxiv:1606.06565', 'arxiv:2501.12948'] };
  const a = await (await srv.post('/learn/import', body)).json();
  assert.deepEqual(a, { ok: true, imported: { saves: 1, lanes: 2, toks: 1 } });
  assert.deepEqual(await (await srv.post('/learn/import', body)).json(), { ok: true, already: true });
  const m = await srv.get('/memory');
  assert.equal(m.items['arxiv:1606.06565'].saved, 1, 'a save from state.saved');
});

test('memory: x/via are kept; unless retracts a less', async () => {
  const id = C.items.find((it) => it.lane === 'oddities').id, at = Date.now() - 3600e3;
  await memOps([{ o: 'visit', id, t: at + 1000, s: at, e: at + 1000, a: 1000, via: 'jump' }, { o: 'visit', id, t: at + 4000, s: at, e: at + 4000, a: 4000, x: 'less' }, { o: 'judge', id, t: at + 4000, j: 'less' }]);
  let m = await srv.get('/memory');
  assert.ok(m.items[id].less);
  const rec = await srv.get('/memory/item?id=' + encodeURIComponent(id));
  assert.deepEqual(rec.v[0].slice(3), ['less', 'jump']);
  await memOps([{ o: 'judge', id, t: at + 5000, j: 'unless' }]);
  m = await srv.get('/memory');
  assert.equal(m.items[id].less, undefined);
});

test('finds: the list, marks, and a dismissed find', async () => {
  let f = await srv.get('/learn/finds.json');
  assert.equal(f.items.length, 4);
  assert.equal(f.counts.new, 4);
  assert.deepEqual(f.byJob['discover-0001'], { new: 4, seen: 0, kept: 0, dismissed: 0 });
  assert.ok(f.items.every((x) => x.added === today && x.via.source === 'arxiv'));
  const w = await srv.get('/learn/why?id=' + encodeURIComponent(FINDS[0]));
  assert.deepEqual({ job: w.find.job, st: w.find.st }, { job: 'discover-0001', st: 'new' });
  assert.deepEqual(await (await srv.post('/learn/finds/mark', { ids: [FINDS[0]], st: 'seen' })).json(), { ok: true, n: 1 });
  await memOps([{ o: 'judge', id: FINDS[1], t: Date.now(), j: 'less' }]);
  f = await until(async () => { const x = await srv.get('/learn/finds.json'); return x.counts.dismissed === 1 ? x : null; }, 2000, 50);
  assert.deepEqual(f.counts, { new: 2, seen: 1, kept: 0, dismissed: 1 });
  const r = await until(async () => { const x = await rank(); return x.new.length === 2 ? x : null; }, 2000, 50);
  assert.equal(r.phi[FINDS[1]], -0.8, 'a dismissed find sinks');
  await srv.post('/learn/finds/mark', { all: true, st: 'seen' });
  assert.equal((await srv.get('/learn/finds.json')).counts.new, 0);
  assert.equal((await srv.post('/learn/finds/mark', { all: true, st: 'gone' })).status, 400);
});

test('STACKS_LEARN=0 turns learning off', async () => {
  off = await startServer(root, { STACKS_LEARN: '0', STACKS_JOBS_DIR: join(root, 'jobs-test-off') });
  assert.deepEqual(await off.get('/learn/profile.json?part=rank'), { on: false });
  assert.deepEqual((await off.get('/status')).learn, { on: false });
});
