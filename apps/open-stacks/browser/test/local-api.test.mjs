// The local-folder routes (server/routes/17-local.mjs) against a real server on a
// synthetic folder: the items, file bytes with ranges, documents as HTML, path safety,
// who may ask, /ready, settings, and a file added while it runs.
//   node --test test/local-api.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { makeFolder, makePdf, PNG } from './local-fixtures.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let S, dir, root, other;
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'stacks-local-api-'));
  root = makeFolder(join(dir, 'My Reading'));
  other = join(dir, 'Second'); mkdirSync(other); writeFileSync(join(other, 'only.pdf'), makePdf({ pages: 1, title: 'The Only Paper' }));
  const cache = join(dir, 'cache'), jobs = join(dir, 'jobs');
  const port = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_LOCAL_DIRS: root, STACKS_CACHE: cache, STACKS_WARM_MB: '0', STACKS_JOBS_DIR: jobs, STACKS_JOBS_EVERY: '0', STACKS_MOCK_AI: '1' }, stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
  S = { base, proc, cache, jobs };
});
after(() => { S?.proc.kill(); rmSync(dir, { recursive: true, force: true }); });

const get = (p, h = {}) => fetch(S.base + p, { headers: h });
const post = (p, body, type = 'application/json') => fetch(S.base + p, { method: 'POST', headers: { 'Content-Type': type }, body: JSON.stringify(body) });
const items = async () => (await (await get('/local/items.json?wait=1')).json()).items;
const find = async (t) => (await items()).find((x) => x.t === t);

test('items.json: corpus.json’s item format, as the local lane', async () => {
  const r = await get('/local/items.json?wait=1');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('access-control-allow-origin'), null, 'no CORS: other sites cannot read your list');
  const j = await r.json();
  assert.equal(j.label, 'Local');
  assert.match(j.v, /^[0-9a-f]{12}$/);
  assert.equal(j.roots.length, 1); assert.equal(j.roots[0].name, 'My Reading'); assert.equal(j.roots[0].n, 12);
  const it = j.items.find((x) => x.t === 'Root Level Paper');
  assert.deepEqual({ lane: it.lane, kind: it.kind, src: it.src, path: it.path, why: it.why, n: it.n, a: it.a, y: it.y }, { lane: 'local', kind: 'pdf', src: 'local', path: ['My Reading'], why: 'Your folder', n: 2, a: 'Test Author', y: 2021 });
  const etag = r.headers.get('etag');
  assert.equal((await get('/local/items.json', { 'If-None-Match': etag })).status, 304);
  assert.equal((await (await get('/local/v')).json()).v, j.v);
  const st = await (await get('/status')).json();
  assert.equal(st.local.items, 12);
});

test('file bytes: whole, ranges, a suffix, past the end, HEAD, revalidation', async () => {
  const it = await find('Root Level Paper');
  const bytes = readFileSync(join(root, 'Root.pdf'));
  let r = await get(it.url);
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'application/pdf'); assert.equal(r.headers.get('accept-ranges'), 'bytes');
  assert.deepEqual(Buffer.from(await r.arrayBuffer()), bytes);
  r = await get(it.url, { Range: 'bytes=0-7' });
  assert.equal(r.status, 206); assert.equal(r.headers.get('content-range'), `bytes 0-7/${bytes.length}`); assert.equal(await r.text(), '%PDF-1.4');
  r = await get(it.url, { Range: 'bytes=-6' });
  assert.equal(r.status, 206); assert.equal(await r.text(), '%%EOF\n');
  r = await get(it.url, { Range: `bytes=${bytes.length + 10}-` });
  assert.equal(r.status, 416);
  r = await fetch(S.base + it.url, { method: 'HEAD' });
  assert.equal(r.status, 200); assert.equal(r.headers.get('content-length'), String(bytes.length));
  assert.equal((await get(it.url, { 'If-None-Match': r.headers.get('etag') })).status, 304);
  const txt = await find('A Plain Text');
  assert.equal(txt.kind, 'text');
  assert.match(await (await get(txt.url)).text(), /First paragraph of plain text/);
});

test('documents: EPUB with its pictures, Markdown with its pictures, a gallery, a placeholder, an archive, a web page', async () => {
  const book = await find('The Synthetic Book');
  let html = await (await get(book.url)).text();
  assert.match(html, /Opening of chapter 1[\s\S]*Opening of chapter 2[\s\S]*Opening of chapter 3/);
  assert.ok(!/<script|onclick/i.test(html));
  const img = /<img src="([^"]+)"/.exec(html)[1];
  assert.match(img, /^\/local\/epub\/local:[0-9a-f]{20}\/OEBPS\/images\/fig\.png$/);
  let r = await get(img);
  assert.equal(r.headers.get('content-type'), 'image/png'); assert.deepEqual(Buffer.from(await r.arrayBuffer()), PNG);
  assert.equal((await get(img.replace('fig.png', 'nope.png'))).status, 404);
  assert.ok(readdirSync(join(S.cache, 'local', 'docs')).some((f) => f.startsWith(book.id.slice(6))), 'the converted book is kept under the cache folder');

  const notes = await find('Notes on Synthetic Things');
  html = await (await get(notes.url)).text();
  assert.match(html, /<table>/); assert.match(html, /<em>emphasis<\/em>/);
  const pic = /<img src="([^"]+)"/.exec(html)[1];
  assert.equal(pic, `/local/rel/${notes.id}/pics/dot.png`);
  assert.deepEqual(Buffer.from(await (await get(pic)).arrayBuffer()), PNG);

  const maps = await find('Maps');
  html = await (await get(maps.url)).text();
  assert.equal((html.match(/<figure>/g) || []).length, 2);
  for (const src of [...html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1])) assert.equal((await get(src)).status, 200);

  html = await (await get((await find('Later')).url)).text();
  assert.match(html, /not downloaded/); assert.match(html, /brctl download/);
  html = await (await get((await find('Lone')).url)).text();
  assert.match(html, /does not open archives/);

  const page = await find('A Local Page');
  html = await (await get(page.url)).text();
  assert.ok(!/window\.bad|onmouseover|javascript:/.test(html), 'scripts, handlers and javascript: links are gone');
  assert.match(html, new RegExp(`<img src="/local/rel/${page.id}/Papers/pics/dot.png" width="16" height="16">`), 'a picture keeps its box: width and height from the file');
  r = await get(page.url);
  assert.match(r.headers.get('content-security-policy') || '', /sandbox/, 'opened directly, a document runs in a sandbox');
});

test('path safety: only indexed files and files beside them inside the folder; no dotfiles, links or traversal', async () => {
  const notes = await find('Notes on Synthetic Things');
  const page = await find('A Local Page');
  const raw = (p) => new Promise((res) => { // no URL normalisation: the path as written
    import('http').then(({ request }) => {
      const u = new URL(S.base);
      const q = request({ host: u.hostname, port: u.port, path: p, method: 'GET' }, (r) => { r.resume(); res(r.statusCode); });
      q.on('error', () => res(0)); q.end();
    });
  });
  for (const p of [
    `/local/rel/${notes.id}/../../../../../../etc/passwd`, `/local/rel/${notes.id}/..%2F..%2F..%2Fetc%2Fpasswd`, `/local/rel/${notes.id}/%2e%2e/%2e%2e/%2e%2e/etc/passwd`,
    `/local/rel/${notes.id}/%2Fetc%2Fpasswd`, `/local/rel/${notes.id}/..%5C..%5Cetc%5Cpasswd`, `/local/rel/${notes.id}/../Root.pdf`, `/local/rel/${notes.id}/~/../../etc/passwd`,
    `/local/rel/${notes.id}/~/.hidden.pdf`, `/local/rel/${page.id}/.DS_Store`, `/local/rel/${page.id}/escape/passwd`, `/local/rel/${page.id}/escape`,
    `/local/rel/${notes.id}/pics%00/dot.png`, '/local/file/local:00000000000000000000', '/local/file/../../etc/passwd', '/local/doc/local:00000000000000000000',
    `/local/epub/${notes.id}/x`, `/local/file/${(await find('Later')).id}`, `/local/file/${(await find('Maps')).id}`,
  ]) assert.equal(await raw(p), 404, p);
  assert.equal(await raw(`/local/rel/${page.id}/Root.pdf`), 200, 'a file beside the document');
  assert.equal(await raw(`/local/rel/${notes.id}/~/Root.pdf`), 200, 'a file elsewhere in the folder, from the folder’s top (../ in a link)');
});

test('who may ask: this machine’s own pages only', async () => {
  const it = await find('Root Level Paper');
  const withHost = (host) => new Promise((res) => import('http').then(({ request }) => { // fetch() will not send another Host
    const u = new URL(S.base);
    request({ host: u.hostname, port: u.port, path: '/local/items.json', headers: { Host: host } }, (r) => { r.resume(); res(r.statusCode); }).on('error', () => res(0)).end();
  }));
  assert.equal(await withHost('evil.example'), 403, 'DNS rebinding: a page on another name that resolves here');
  assert.equal(await withHost('localhost:' + new URL(S.base).port), 200);
  assert.equal((await get(it.url, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await get(it.url, { 'Sec-Fetch-Site': 'cross-site', Referer: S.base + '/local/rel/x/y.html' })).status, 200, 'our own sandboxed page loading its pictures');
  assert.equal((await get('/local/items.json', { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await get(it.url, { 'Sec-Fetch-Site': 'same-origin' })).status, 200);
  assert.equal((await post('/local/settings', { dirs: '/tmp' }, 'text/plain')).status, 403, 'a form post from elsewhere cannot change the folders');
  assert.equal((await fetch(S.base + '/local/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: '{"dirs":"/tmp"}' })).status, 403);
});

test('the rest of the app: /ready, /cached, profiles and guides know local items; jobs never see them', async () => {
  const pdf = await find('Root Level Paper'), later = await find('Later');
  const ready = await (await get(`/ready?ids=${encodeURIComponent(pdf.id)},${encodeURIComponent(later.id)}`)).json();
  assert.deepEqual(ready, { [pdf.id]: [1, 1], [later.id]: [0, 0] });
  assert.equal(await (await post('/cached', { urls: [pdf.url, later.url] })).text(), '10');
  assert.equal((await get('/profile?id=' + encodeURIComponent(pdf.id))).status, 404, 'a known item without a profile yet (not 400)');
  assert.deepEqual(await (await get('/profiles?ids=' + encodeURIComponent(pdf.id))).json(), { [pdf.id]: null });
  const g = await get(`/augment?id=${encodeURIComponent(pdf.id)}&model=claude-haiku-5-5`);
  assert.equal(g.status, 200); assert.equal(await g.json(), null);
  const f = await post('/jobs/flag', { id: pdf.id, kind: 'other', note: 'x' });
  assert.equal(f.status, 400, 'a job file (in the repository) never names your files');
  assert.ok(!existsSync(join(S.jobs, 'open')) || !readdirSync(join(S.jobs, 'open')).length);
});

test('a file replaced by a link to somewhere else after the folder was read is not served', async () => {
  const it = await find('Inner Paper');
  const f = join(root, 'Books', 'Deep', 'Deeper', 'inner.pdf'), secret = join(dir, 'secret.txt');
  writeFileSync(secret, 'NOT YOURS TO SERVE');
  rmSync(f); symlinkSync(secret, f);
  for (const u of [it.url, it.url.replace('/file/', '/doc/')]) {
    const r = await get(u);
    assert.equal(r.status, 404, u); assert.ok(!/NOT YOURS/.test(await r.text()));
  }
});

test('watching: a file added while running appears within seconds; one removed goes', async () => {
  const v0 = (await (await get('/local/v')).json()).v;
  writeFileSync(join(root, 'Papers', 'Arrived.pdf'), makePdf({ pages: 3, title: 'Arrived While Running' }));
  rmSync(join(root, 'Books', 'plain.txt'));
  const t0 = Date.now();
  let it = null;
  while (Date.now() - t0 < 10000) { const v = (await (await get('/local/v')).json()).v; if (v !== v0) { it = await find('Arrived While Running'); if (it) break; } await sleep(150); }
  assert.ok(it, 'the new file is listed'); assert.equal(it.n, 3);
  assert.ok(Date.now() - t0 < 5000, `within seconds (${Date.now() - t0} ms)`);
  assert.equal(await find('A Plain Text'), undefined);
});

test('settings: other folders, the default again, too broad, the order, AI', async () => {
  let s = await (await get('/local/settings')).json();
  assert.equal(s.from, 'env'); assert.deepEqual(s.dirs, [root]);
  s = await (await post('/local/settings', { dirs: `${root}\n${other}` })).json();
  assert.equal(s.from, 'settings'); assert.equal(s.roots.length, 2);
  assert.ok(await find('The Only Paper'));
  assert.ok(existsSync(join(S.cache, 'local', 'settings.json')), 'kept in the cache folder');
  let r = await post('/local/settings', { dirs: '/' });
  assert.equal(r.status, 400);
  s = await (await post('/local/settings', { order: 'newest', autoAI: true })).json();
  assert.equal(s.order, 'newest'); assert.equal(s.autoAI, true);
  assert.equal((await find('The Only Paper')).private, false);
  r = await post('/local/settings', { order: 'sideways' });
  assert.equal(r.status, 400);
  s = await (await post('/local/settings', { dirs: null, order: 'name', autoAI: false })).json();
  assert.equal(s.from, 'env'); assert.equal(await find('The Only Paper'), undefined);
  assert.equal((await post('/local/reveal', { id: 'local:00000000000000000000' })).status, 404);
  // One folder per line: a ':' is part of a name (Finder's '/'); a path relative to the server's folder is refused.
  const colon = join(dir, 'Books: 2024'); mkdirSync(colon); writeFileSync(join(colon, 'c.pdf'), makePdf({ pages: 1, title: 'In A Colon Folder' }));
  s = await (await post('/local/settings', { dirs: colon })).json();
  assert.deepEqual(s.dirs, [colon]); assert.ok(await find('In A Colon Folder'));
  r = await post('/local/settings', { dirs: 'notes' });
  assert.equal(r.status, 400); assert.match((await r.json()).error, /full path/);
  r = await post('/local/settings', { dirs: `${root}\n${join(root, 'Papers')}` });
  assert.equal(r.status, 400, 'a folder inside another: its files would be there twice'); assert.match((await r.json()).error, /inside another/);
  await post('/local/settings', { dirs: null });
});
