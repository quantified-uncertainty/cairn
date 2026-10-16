// The render routes (server/routes/16-render.mjs) against a real server with a fresh cache holding the
// geometry PDF (docs/performance/prerender.md, Appendix C) under an arXiv-shaped URL, so nothing is fetched.
//   node --test test/render-api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as native from '../server/pdfnative.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GEO = 'https://arxiv.org/pdf/0000.00001'; // the geometry PDF, seeded into the cache
const MISSING = 'https://arxiv.org/pdf/0000.00002'; // allowed, not on disk
const can = (await native.has('pdftoppm')) && (await native.has('pdfinfo'));
const servers = [];

function seed(cache, url, body, type = 'application/pdf') {
  const k = createHash('sha1').update(url).digest('hex'), d = join(cache, k.slice(0, 2));
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, k), body);
  writeFileSync(join(d, k + '.json'), JSON.stringify({ url, type, size: body.length, at: Date.now() }));
}
async function start(env = {}) {
  const cache = mkdtempSync(join(tmpdir(), 'stacks-render-api-'));
  seed(cache, GEO, native.geometryPdf());
  const port = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_CACHE: cache, STACKS_JOBS_DIR: join(cache, 'jobs-out'), STACKS_WARM_MB: '0', STACKS_MOCK_AI: '1', STACKS_LOCAL_DIRS: join(cache, 'no-local'), ...env },
    stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  const s = { base, cache, proc };
  servers.push(s);
  for (let i = 0; i < 100; i++) {
    try { const j = await (await fetch(base + '/render/state')).json(); if (!j.pending) return s; } catch { /* starting */ }
    await sleep(100);
  }
  throw new Error('server did not start');
}
after(() => { for (const s of servers) { s.proc.kill(); rmSync(s.cache, { recursive: true, force: true }); } });
const page = (S, u, k, w = 1400, extra = '') => fetch(`${S.base}/render/page?u=${encodeURIComponent(u)}&k=${k}&w=${w}${extra}`);
const post = (S, path, body) => fetch(S.base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

let S;
before(async () => { if (can) S = await start({ STACKS_RENDER_ENGINE: 'poppler', STACKS_RENDER_WORKERS: '2' }); });

test('GET /render/page renders a page on demand, then serves it from the store', { skip: !can && 'poppler not installed' }, async () => {
  const st = await (await fetch(S.base + '/render/state')).json();
  assert.equal(st.engine, 'poppler'); assert.equal(st.workers, 2); assert.deepEqual(st.classes, [1400, 1800, 2200]);
  const r = await page(S, GEO, 2, 1300); // the crop-box page; 1300 rounds up to the 1400 class
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/jpeg');
  assert.equal(r.headers.get('access-control-allow-origin'), '*'); // the browser loads it from the second origin
  assert.match(r.headers.get('access-control-expose-headers'), /X-Render/);
  const x = JSON.parse(r.headers.get('x-render'));
  assert.equal(x.n, 5); assert.equal(x.pw, 468); assert.equal(x.ph, 648); assert.equal(x.w, 1400); assert.equal(x.by, 'poppler');
  const f = native.fitPage(468, 648, 1400);
  assert.deepEqual(native.jpegSize(Buffer.from(await r.arrayBuffer())), { w: f.W, h: f.H });
  const again = await page(S, GEO, 2, 1400);
  assert.equal(again.status, 200);
  assert.equal(JSON.parse(again.headers.get('x-render')).ms, 0); // from the store
  const etag = again.headers.get('etag'); await again.arrayBuffer();
  assert.equal((await fetch(`${S.base}/render/page?u=${encodeURIComponent(GEO)}&k=2&w=1400`, { headers: { 'If-None-Match': etag } })).status, 304);
  // The rotated page comes out landscape, as pdf.js shows it.
  const rot = await page(S, GEO, 1, 1400);
  const g = native.fitPage(792, 612, 1400);
  assert.deepEqual(native.jpegSize(Buffer.from(await rot.arrayBuffer())), { w: g.W, h: g.H });
});

test('every refusal is quick: no page, a host off the allowlist, a PDF not on disk, a bad request', { skip: !can && 'poppler not installed' }, async () => {
  const t0 = Date.now();
  const nope = await page(S, GEO, 7);
  assert.equal(nope.status, 404); assert.match((await nope.json()).error, /no page 8 \(5 pages\)/);
  const host = await page(S, 'https://example.com/a.pdf', 0); assert.equal(host.status, 403); await host.arrayBuffer();
  const local = await page(S, '/local/file/local:0123456789abcdef0123', 0); assert.equal(local.status, 403); await local.arrayBuffer(); // the Local lane is not rendered here
  const miss = await page(S, MISSING, 0);
  assert.equal(miss.status, 503); assert.equal(miss.headers.get('retry-after'), '1'); await miss.arrayBuffer();
  const bad = await page(S, GEO, -1); assert.equal(bad.status, 400); await bad.arrayBuffer();
  assert.ok(Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
});

test('POST /render/hint plans the open document; GET /render/state reports the pages ready', { skip: !can && 'poppler not installed' }, async () => {
  // MISSING fourth: in the ahead lane, which waits for downloads without asking for them (no network here).
  const next = [{ u: GEO, k: 2 }, { u: GEO, k: 3 }, { u: 'https://example.com/x.pdf', k: 0 }, { u: GEO, k: 4 }, { u: MISSING, k: 0 }];
  const h = await (await post(S, '/render/hint', { open: { u: GEO, k: 0, w: 1800, per: 2 }, next })).json();
  assert.equal(h.ok, true); assert.equal(h.engine, 'poppler'); assert.equal(h.n[GEO], 5);
  assert.equal(h.n['https://example.com/x.pdf'], undefined);
  let st;
  for (let i = 0; i < 100; i++) { st = await (await fetch(`${S.base}/render/state?u=${encodeURIComponent(GEO)}&w=1800`)).json(); if (st.bits === '11111') break; await sleep(100); }
  assert.equal(st.bits, '11111'); assert.equal(st.n, 5); assert.equal(st.w, 1800); assert.equal(st.src, 'disk');
  const status = await (await fetch(S.base + '/status')).json();
  assert.equal(status.render.engine, 'poppler');
  assert.ok(status.render.done >= 5);
  assert.ok(status.render.bytes > 0);
  assert.equal(status.render.queued.src, 2); // the missing PDF's spread waits for its download, without a worker
  // forget drops the document's pages.
  const fg = await (await post(S, '/render/forget', { u: GEO })).json();
  assert.equal(fg.ok, true); assert.ok(fg.freed > 0);
  st = await (await fetch(`${S.base}/render/state?u=${encodeURIComponent(GEO)}&w=1800`)).json();
  assert.equal(st.bits, '00000');
  assert.equal((await post(S, '/render/forget', { u: 'https://example.com/x.pdf' })).status, 403);
});

test('STACKS_RENDER_ENGINE=none: the service is off and answers 204 at once', async () => {
  const off = await start({ STACKS_RENDER_ENGINE: 'none' });
  const st = await (await fetch(off.base + '/render/state')).json();
  assert.equal(st.engine, null); assert.equal(st.pending, false);
  const r = await page(off, GEO, 0);
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  const h = await (await post(off, '/render/hint', { open: { u: GEO, k: 0, w: 1800 } })).json();
  assert.equal(h.engine, null);
  assert.equal((await (await fetch(off.base + '/status')).json()).render.engine, null);
});
