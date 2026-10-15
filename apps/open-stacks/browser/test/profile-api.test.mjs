// The profile routes against a real server with a fresh cache (spec section 11, C7, C10, C11):
//   node --test test/profile-api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, readdirSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as core from '../ui/js/profile-core.js';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const ID = 'arxiv:2304.06528';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const servers = [];
async function start(env = {}) {
  const cache = mkdtempSync(join(tmpdir(), 'stacks-profile-test-'));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(port)], { env: { ...process.env, STACKS_CACHE: cache, STACKS_WARM_MB: '0', STACKS_MOCK_AI: '1', ...env }, stdio: 'ignore' });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 80; i++) { try { if ((await fetch(base + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
  const s = { base, cache, proc };
  servers.push(s);
  return s;
}
after(() => { for (const s of servers) { s.proc.kill(); rmSync(s.cache, { recursive: true, force: true }); } });

function analysis(n = 7, by = 'browser') {
  const pages = Array.from({ length: n }, (_, k) => ({ w: 612, h: 792, ink: [0.15, 0.1, 0.85, 0.9], blank: false, gut: null, dens: 0.1, words: 400 }));
  return core.finalize({ id: ID, kind: 'pdf', by, src: { url: 'https://arxiv.org/pdf/2304.06528' }, pages, heads: [], outline: [] });
}
const webp = (bytes) => { const b = Buffer.alloc(bytes); b.write('RIFF', 0, 'latin1'); b.writeUInt32LE(bytes - 8, 4); b.write('WEBP', 8, 'latin1'); return b; };
const box = '0.1,0.05,0.9,0.95';
const post = (base, path, body, type = 'application/json') => fetch(base + path, { method: 'POST', headers: { 'Content-Type': type }, body: typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body) });
const asset = (base, q, buf) => post(base, `/profile/asset?id=${encodeURIComponent(ID)}&${q}`, buf, 'image/webp');

let S;
before(async () => { S = await start(); });

test('C11: every status code of the profile routes', async () => {
  const b = S.base;
  assert.equal((await fetch(b + '/profile?id=nope')).status, 400);
  assert.equal((await fetch(b + `/profile?id=${ID}`)).status, 404);
  assert.equal((await post(b, '/profile', { ...analysis(), n: 9 })).status, 400);
  const r1 = await post(b, '/profile', analysis());
  assert.equal(r1.status, 200);
  const j1 = await r1.json();
  assert.equal(j1.rev, 1);
  const g = await fetch(b + `/profile?id=${ID}`);
  assert.equal(g.status, 200);
  const etag = g.headers.get('etag');
  assert.match(etag, /^"[0-9a-f]{40}\.1"$/);
  assert.equal((await fetch(b + `/profile?id=${ID}`, { headers: { 'If-None-Match': etag } })).status, 304);
  // A poppler analysis does not replace a browser one of the same generation.
  const r2 = await post(b, '/profile', analysis(7, 'poppler'));
  assert.equal(r2.status, 409);
  assert.equal((await r2.json()).error, 'older');
  assert.equal((await post(b, '/profile', { ...analysis(7, 'poppler'), force: true })).status, 200);
  assert.equal((await post(b, '/profile', analysis())).status, 200);
  assert.equal((await post(b, `/profile/text?id=${ID}`, '[p. 1] hello\n[p. 2] world', 'text/plain')).status, 200);
  // Assets
  assert.equal((await asset(b, `size=display&k=0&w=10&h=10&box=${box}&H=1800&pri=90`, Buffer.from('\x89PNG\r\n\x1a\n0000000000'))).status, 415);
  assert.equal((await asset(b, `size=thumb&k=0&w=10&h=10&box=${box}`, webp(70 * 1024))).status, 413);
  const a1 = await asset(b, `size=display&k=0&w=10&h=10&box=${box}&H=1800&pri=90`, webp(1000));
  assert.equal(a1.status, 200);
  const v = (await a1.json()).v;
  const im = await fetch(b + `/profile/asset?id=${ID}&size=display&k=0&v=${v}`);
  assert.equal(im.status, 200);
  assert.match(im.headers.get('cache-control'), /immutable/);
  assert.equal((await im.arrayBuffer()).byteLength, 1000);
  assert.match((await fetch(b + `/profile/asset?id=${ID}&size=display&k=0`)).headers.get('cache-control'), /no-cache/);
  assert.match((await fetch(b + `/profile/asset?id=${ID}&size=display&k=0&v=0000000000`)).headers.get('cache-control'), /no-cache/);
  assert.equal((await fetch(b + `/profile/asset?id=${ID}&size=display&k=5`)).status, 404);
  // Sprite
  assert.equal((await asset(b, 'size=sprite&j=0&w=560&h=120&cw=80&ch=120&cols=7', webp(2000))).status, 200);
  const brief = await (await fetch(b + `/profiles?ids=${ID},nope`)).json();
  assert.equal(brief[ID].sprite.cw, 80);
  assert.deepEqual(brief[ID].display, [0]);
  assert.equal(brief.nope, null);
});

test('C11: the budget admits display images by priority', async () => {
  const b = S.base;
  const budget = core.budgetFor(7); // 1.48 MiB
  const big = webp(Math.floor(budget / 3));
  for (const k of [1, 2]) assert.equal((await asset(b, `size=display&k=${k}&w=10&h=10&box=${box}&H=1800&pri=20`, big)).status, 200);
  const low = await asset(b, `size=display&k=3&w=10&h=10&box=${box}&H=1800&pri=10`, big);
  assert.equal(low.status, 409);
  const j = await low.json();
  assert.equal(j.error, 'budget');
  // A higher priority makes room by dropping the lowest.
  assert.equal((await asset(b, `size=display&k=4&w=10&h=10&box=${box}&H=1800&pri=60`, big)).status, 200);
  const P = await (await fetch(b + `/profile?id=${ID}`)).json();
  assert.ok(P.assets.display[4] && P.assets.display[0]);
  assert.ok(Object.keys(P.assets.display).length <= 3);
  assert.ok(P.assets.bytes <= budget);
});

test('C7: a display image gone from disk is a 404, and the profile stops listing it', async () => {
  const b = S.base;
  const P = await (await fetch(b + `/profile?id=${ID}`)).json();
  unlinkSync(join(S.cache, 'profiles', P.pid, P.assets.display[0].f));
  assert.equal((await fetch(b + `/profile/asset?id=${ID}&size=display&k=0&v=${P.assets.display[0].v}`)).status, 404);
  const Q = await (await fetch(b + `/profile?id=${ID}`)).json();
  assert.equal(Q.assets.display[0], undefined);
  assert.ok(Q.rev > P.rev);
});

test('C8: an older analysis generation is served as stale', async () => {
  const b = S.base;
  const old = { ...analysis(), gen: Math.max(1, core.GEN) };
  assert.equal((await post(b, '/profile', old)).status, 200);
  const P = await (await fetch(b + `/profile?id=${ID}`)).json();
  assert.equal(P.stale, core.GEN > old.gen ? 'gen' : null);
});

test('forget', async () => {
  const b = S.base;
  assert.equal((await post(b, '/profile/forget', { id: ID })).status, 200);
  assert.equal((await fetch(b + `/profile?id=${ID}`)).status, 404);
  const st = await (await fetch(b + '/status')).json();
  assert.equal(st.profiles.count, 0);
});

test('C10: over the cache cap, heavy assets go before any core', { timeout: 30000 }, async () => {
  const T = await start({ STACKS_CACHE_MAX: '400000' });
  const b = T.base;
  assert.equal((await post(b, '/profile', analysis())).status, 200);
  assert.equal((await asset(b, 'size=sprite&j=0&w=560&h=120&cw=80&ch=120&cols=7', webp(20000))).status, 200);
  for (const k of [0, 1, 2]) assert.equal((await asset(b, `size=display&k=${k}&w=10&h=10&box=${box}&H=1800&pri=90`, webp(150000))).status, 200);
  // Entries touched in the last 5 s are never evicted; the pass comes 1.5 s after a write.
  let P;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const r = await fetch(b + `/profile?id=${ID}`);
    assert.notEqual(r.status, 500);
    P = await r.json();
    if (!Object.keys(P.assets.display).length) break;
  }
  assert.deepEqual(Object.keys(P.assets.display), []);
  assert.ok(P.assets.sprite, 'the core (JSON, sprite, text) stays');
  assert.equal(core.validate({ ...P, assets: undefined }), null);
  const pid = P.pid;
  assert.deepEqual(readdirSync(join(T.cache, 'profiles', pid)).filter((f) => f.startsWith('d')), []);
});
