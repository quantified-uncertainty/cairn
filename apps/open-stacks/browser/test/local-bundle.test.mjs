// Bundles in the Local lane (docs/authoring.md): a folder named *.stack, or holding an
// index.md / index.html at its top, is one item. Pure parts (bundleOf, bundleMeta,
// frontMatter, imageSizeOf, sizeImages, Markdown math), the index (one item, subfolders
// hidden, metadata, cover) and the routes (its text, its pictures with sizes, safety).
//   node --test test/local-bundle.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, symlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LocalIndex, bundleOf, bundleMeta, frontMatter, imageSizeOf, sizeImages, mdToHtml, safeRel, idOf } from '../server/local.mjs';
import { makeBundles, makePng, PNG } from './local-fixtures.mjs';

const HERE = join(dirname(fileURLToPath(import.meta.url)), '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reader = (buf) => (len, pos) => buf.subarray(pos, pos + len);

// ---------------------------------------------------------------- pure parts

test('bundleOf: *.stack or an index file makes a bundle; index.md first; a cover and stack.json', () => {
  assert.equal(bundleOf('notes', ['a.md', 'b.html']), null, 'an ordinary folder');
  assert.deepEqual(bundleOf('site', ['index.html', 'index.md', 'Cover.JPG', 'stack.json']), { index: 'index.md', itype: 'md', cover: 'Cover.JPG', sidecar: 'stack.json' });
  assert.deepEqual(bundleOf('site', ['INDEX.HTM']), { index: 'INDEX.HTM', itype: 'html', cover: null, sidecar: null });
  assert.deepEqual(bundleOf('Report.stack', ['z.md', 'a 10.html', 'a 2.md', 'x.png']), { index: 'a 2.md', itype: 'md', cover: null, sidecar: null }, 'no index: the first Markdown or HTML file, natural order');
  assert.deepEqual(bundleOf('Report.STACK', ['x.png']), { index: null, itype: null, cover: null, sidecar: null });
  assert.equal(bundleOf('site', ['.index.html']), null, 'a dotfile is not an index');
});

test('frontMatter: scalars, [inline, lists] and block lists', () => {
  const { data, body } = frontMatter('---\ntitle: "T: a title"\nauthors:\n  - A One\n  - B Two\ntags: [x, "y z"]\ndate: 2025-01-02\n---\n# Body\n');
  assert.deepEqual(data, { title: 'T: a title', authors: ['A One', 'B Two'], tags: ['x', 'y z'], date: '2025-01-02' });
  assert.equal(body, '# Body\n');
  assert.deepEqual(frontMatter('# No front matter').data, {});
  assert.equal(mdToHtml('---\nauthor: [A, B]\n---\ntext').meta.author, 'A, B', 'mdToHtml keeps strings in meta');
});

test('bundleMeta: Markdown front matter, the HTML head, stack.json on top; only http(s) sources, safe covers', () => {
  const md = bundleMeta({ type: 'md', text: '---\ntitle: The Title\nauthor: Ann Author and Ben Author\ndate: 2023-04-05\nurl: https://example.org/x\nsummary: "One line."\ntags: [Big Ideas, small]\n---\n# Heading\n' });
  assert.deepEqual(md, { title: 'The Title', author: 'Ann Author, Ben Author', year: 2023, date: '2023-04-05', url: 'https://example.org/x', summary: 'One line.', tags: ['big-ideas', 'small'], cover: null });
  assert.equal(bundleMeta({ type: 'md', text: '# Only A Heading\n' }).title, 'Only A Heading');
  const html = bundleMeta({ type: 'html', text: '<html><head><title>Page &amp; Title</title><meta content="Cy, Di" name="author"><meta name="date" content="2022"><meta name="description" content="Desc."><link href="https://example.org/c" rel="canonical"></head><body><h1>x</h1></body></html>' });
  assert.deepEqual(html, { title: 'Page & Title', author: 'Cy, Di', year: 2022, date: null, url: 'https://example.org/c', summary: 'Desc.', tags: [], cover: null });
  const side = bundleMeta({ type: 'md', text: '---\ntitle: Old\n---\n', sidecar: Buffer.from(JSON.stringify({ title: 'New', authors: ['Ed'], source: 'https://example.org/s', tags: 'a, b', cover: 'img/c.webp' })) });
  assert.deepEqual([side.title, side.author, side.url, side.tags, side.cover], ['New', 'Ed', 'https://example.org/s', ['a', 'b'], 'img/c.webp']);
  for (const bad of ['../x.png', '/etc/passwd', 'img/../../x.png', '.hidden/x.png', 'file:///x.png', 'a\\b.png']) assert.equal(bundleMeta({ sidecar: JSON.stringify({ cover: bad }) }).cover, null, bad);
  assert.equal(bundleMeta({ type: 'md', text: '---\nsource: javascript:alert(1)\n---\n' }).url, null);
  assert.equal(bundleMeta({ sidecar: '{not json' }).title, null, 'a broken stack.json is ignored');
  assert.equal(safeRel('assets/cover.jpg'), 'assets/cover.jpg');
});

/** A JPEG header: SOI, an Exif APP1 with this orientation, SOF0 of w × h. */
function jpegHead(w, h, orientation = 1) {
  const tiff = Buffer.alloc(26); tiff.write('II', 0, 'latin1'); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(1, 8); tiff.writeUInt16LE(0x0112, 10); tiff.writeUInt16LE(3, 12); tiff.writeUInt32LE(1, 14); tiff.writeUInt16LE(orientation, 18);
  const app1 = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
  const a = Buffer.alloc(4); a[0] = 0xff; a[1] = 0xe1; a.writeUInt16BE(app1.length + 2, 2);
  const sof = Buffer.from([0xff, 0xc0, 0, 17, 8, h >> 8, h & 255, w >> 8, w & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), a, app1, sof, Buffer.alloc(64)]);
}
test('imageSizeOf: PNG, JPEG (EXIF turn), GIF, WebP (3 kinds), AVIF, BMP, SVG', () => {
  assert.deepEqual(imageSizeOf(reader(makePng(37, 21))), [37, 21]);
  assert.deepEqual(imageSizeOf(reader(jpegHead(1200, 800))), [1200, 800]);
  assert.deepEqual(imageSizeOf(reader(jpegHead(1200, 800, 6))), [800, 1200], 'a phone photo stored sideways');
  const gif = Buffer.alloc(32); gif.write('GIF89a', 0, 'latin1'); gif.writeUInt16LE(70, 6); gif.writeUInt16LE(30, 8);
  assert.deepEqual(imageSizeOf(reader(gif)), [70, 30]);
  const riff = (chunk, body) => { const b = Buffer.alloc(40); b.write('RIFF', 0, 'latin1'); b.write('WEBP', 8, 'latin1'); b.write(chunk, 12, 'latin1'); body(b); return b; };
  assert.deepEqual(imageSizeOf(reader(riff('VP8 ', (b) => { b.writeUInt16LE(300, 26); b.writeUInt16LE(150, 28); }))), [300, 150]);
  assert.deepEqual(imageSizeOf(reader(riff('VP8X', (b) => { b.writeUIntLE(1999, 24, 3); b.writeUIntLE(999, 27, 3); }))), [2000, 1000]);
  const w = 513, h = 257, bits = (w - 1) | ((h - 1) << 14); // VP8L: 14 bits each after the 0x2f signature
  assert.deepEqual(imageSizeOf(reader(riff('VP8L', (b) => { b[20] = 0x2f; b.writeUInt32LE(bits >>> 0, 21); }))), [w, h]);
  const avif = Buffer.alloc(64); avif.write('ftypavif', 4, 'latin1'); avif.write('ispe', 30, 'latin1'); avif.writeUInt32BE(640, 38); avif.writeUInt32BE(480, 42);
  assert.deepEqual(imageSizeOf(reader(avif)), [640, 480]);
  const bmp = Buffer.alloc(54); bmp.write('BM', 0, 'latin1'); bmp.writeInt32LE(90, 18); bmp.writeInt32LE(-45, 22);
  assert.deepEqual(imageSizeOf(reader(bmp)), [90, 45]);
  assert.deepEqual(imageSizeOf(reader(Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="120px" height="80"></svg>'))), [120, 80]);
  assert.deepEqual(imageSizeOf(reader(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 400 300"><rect/></svg>'))), [400, 300]);
  assert.equal(imageSizeOf(reader(Buffer.from('not an image at all, just some text here'))), null);
});

test('sizeImages: width and height where neither is given; given sizes stay', () => {
  const out = sizeImages('<p><img src="/a.png" alt="x"> <img src="/b.png" width="5" height="5"> <img src="/c.png"/> <img src="/none.png"></p>', (s) => ({ '/a.png': [10, 20], '/c.png': [3, 4] }[s] || null));
  assert.equal(out, '<p><img src="/a.png" alt="x" width="10" height="20"> <img src="/b.png" width="5" height="5"> <img src="/c.png" width="3" height="4"/> <img src="/none.png"></p>');
});

test('Markdown math: $…$, $$…$$, \\(…\\) and \\[…\\] become span.math-tex; prices and code stay text', () => {
  const { html } = mdToHtml('Euler: $e^{i\\pi} + 1 = 0$, costs $5 and $10, US$3.\n\n$$\\sum_k k$$\n\nAlso \\(x\\) and \\[y\\] and \\$4.\n\n```\n$not math$\n```\n');
  assert.match(html, /<span class="math-tex">\\\(e\^\{i\\pi\} \+ 1 = 0\\\)<\/span>/);
  assert.match(html, /costs \$5 and \$10, US\$3\./);
  assert.match(html, /<span class="math-tex">\\\[\\sum_k k\\\]<\/span>/);
  assert.match(html, /<span class="math-tex">\\\(x\\\)<\/span> and <span class="math-tex">\\\[y\\\]<\/span> and \$4\./);
  assert.match(html, /<pre><code>\$not math\$<\/code><\/pre>/);
});

// ---------------------------------------------------------------- the index

function setup(t) {
  const d = mkdtempSync(join(tmpdir(), 'stacks-local-bundle-'));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  const root = makeBundles(join(d, 'Shelf'));
  const ix = new LocalIndex({ dirs: [root], cacheDir: join(d, 'cache'), tools: { pdfinfo: false, mdls: false, textutil: false, brctl: false } });
  return { d, root, ix };
}
const byTitle = (ix) => Object.fromEntries(ix.items.map((it) => [it.t, it]));

test('index: each bundle is one item in the folder above; its subfolders, pictures and notes are not listed', async (t) => {
  const { ix } = setup(t);
  await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.deepEqual(Object.keys(T).sort(), ['A Field Report on Synthetic Stacks', 'Empty', 'Plain Notes', 'The Exported Site, Retitled', 'The Loose Article']);
  for (const k of ['A Field Report on Synthetic Stacks', 'Empty', 'The Exported Site, Retitled', 'The Loose Article']) {
    assert.deepEqual(T[k].path, ['Shelf'], k + ': in the folder above, not a folder of its own');
    assert.equal(T[k].kind, 'html'); assert.equal(T[k].ext, 'bundle'); assert.match(T[k].url, /^\/local\/doc\/local:[0-9a-f]{20}\?v=/);
    assert.ok(!String(T[k].page || '').startsWith('/local/file/'), 'no raw file link: its pictures would not load there');
  }
  assert.deepEqual(T['Plain Notes'].path, ['Shelf', 'plain'], 'an ordinary folder stays a folder');
  assert.ok(!ix.items.some((it) => it.path.length > 1 && it.path[1] !== 'plain'), 'nothing from inside a bundle is a Library folder');
  assert.ok(!ix.items.some((it) => it.ext === 'gallery'), 'the pictures in assets/ and images/ are not a gallery');
  assert.equal(T['A Field Report on Synthetic Stacks'].id, idOf('Shelf', 'Field Report.stack/#bundle'));
  assert.equal(ix.roots[0].n, 5);
});

test('index: metadata from front matter, the HTML head and stack.json; the cover', async (t) => {
  const { ix } = setup(t);
  await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  const r = T['A Field Report on Synthetic Stacks'];
  assert.deepEqual({ a: r.a, y: r.y, d: r.d, page: r.page, ab: r.ab, tags: r.tags }, { a: 'Ada Example, Bo Sample', y: 2025, d: '2025-07-14', page: 'https://example.org/field-report', ab: 'What happens when a folder is one document.', tags: ['synthetic-testing', 'bundles'] });
  assert.match(r.cover, new RegExp(`^/local/rel/${r.id}/cover\\.png\\?v=\\w+$`));
  const s = T['The Exported Site, Retitled'];
  assert.deepEqual({ a: s.a, y: s.y, d: s.d, page: s.page, ab: s.ab, tags: s.tags }, { a: 'Cy Writer, Di Editor', y: 2024, d: '2024-11-02', page: 'https://example.org/exported', ab: 'A page exported with its pictures.', tags: ['forecasting', 'ai-safety'] });
  assert.match(s.cover, new RegExp(`^/local/rel/${s.id}/images/chart\\.png\\?v=`), 'stack.json names the cover');
  assert.equal(T.Empty.cover, undefined); assert.equal(T['The Loose Article'].a, undefined);
});

test('index: editing stack.json or the index changes the item; a folder that loses its index is a folder again', async (t) => {
  const { root, ix } = setup(t);
  await ix.scan(); await ix.settled();
  const v0 = ix.v;
  writeFileSync(join(root, 'site-export', 'stack.json'), JSON.stringify({ title: 'Retitled Again' }));
  await ix.scan(); await ix.settled();
  assert.notEqual(ix.v, v0);
  assert.ok(byTitle(ix)['Retitled Again']);
  rmSync(join(root, 'site-export', 'index.html'));
  await ix.scan(); await ix.settled();
  const T = byTitle(ix);
  assert.equal(T['Retitled Again'], undefined);
  assert.ok(ix.items.some((it) => it.path.join('/') === 'Shelf/site-export'), 'its pictures now show as a folder of their own');
});

// ---------------------------------------------------------------- the routes

let S, dir, root, secret;
before(async () => {
  dir = mkdtempSync(join(tmpdir(), 'stacks-local-bundle-api-'));
  root = makeBundles(join(dir, 'Shelf'));
  secret = join(dir, 'secret.png'); writeFileSync(secret, PNG);
  // A .stack whose index file is a link out of the folder: never read.
  mkdirSync(join(root, 'Linked.stack')); try { symlinkSync(join(dir, 'outside.md'), join(root, 'Linked.stack', 'index.md')); } catch { /* no links */ }
  writeFileSync(join(dir, 'outside.md'), '# NOT YOURS TO SERVE\n');
  const port = 20000 + Math.floor(Math.random() * 20000);
  const proc = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(port)], {
    env: { ...process.env, STACKS_LOCAL_DIRS: root, STACKS_CACHE: join(dir, 'cache'), STACKS_WARM_MB: '0', STACKS_JOBS_DIR: join(dir, 'jobs'), STACKS_JOBS_EVERY: '0', STACKS_MOCK_AI: '1' }, stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(base + '/status')).ok) break; } catch { /* starting */ } await sleep(100); }
  S = { base, proc };
});
after(() => { S?.proc.kill(); rmSync(dir, { recursive: true, force: true }); });
const get = (p, h = {}) => fetch(S.base + p, { headers: h });
const find = async (t) => (await (await get('/local/items.json?wait=1')).json()).items.find((x) => x.t === t);
const raw = (p) => new Promise((res) => import('http').then(({ request }) => {
  const u = new URL(S.base);
  request({ host: u.hostname, port: u.port, path: p }, (r) => { r.resume(); res(r.statusCode); }).on('error', () => res(0)).end();
}));

test('a Markdown bundle: its text, every picture through /local/rel with its size, math, the cover', async () => {
  const it = await find('A Field Report on Synthetic Stacks');
  const html = await (await get(it.url)).text();
  assert.match(html, /<article class="lc-md lc-bundle">/);
  assert.match(html, /Opening paragraph of the field report[\s\S]*Closing paragraph of the field report/);
  const imgs = [...html.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  assert.equal(imgs.length, 3);
  const want = [['assets/fig-1.png', 640, 360], ['assets/fig-2.png', 400, 400], ['images/deep/fig-3.png', 300, 200]];
  for (const [k, [p, w, h]] of want.entries()) {
    assert.ok(imgs[k].includes(`src="/local/rel/${it.id}/${p}"`) && imgs[k].includes(`width="${w}" height="${h}"`), imgs[k]);
    const r = await get(`/local/rel/${it.id}/${p}`);
    assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/png');
  }
  assert.match(html, /<span class="math-tex">\\\(a\^2 \+ b\^2 = c\^2\\\)<\/span>/);
  assert.ok(!/draft|A Draft Inside/.test(html), 'only the index file is the text');
  assert.equal((await get(it.cover)).status, 200, 'the cover is served');
  assert.equal((await get(it.url.replace('/doc/', '/file/').replace(/\?.*$/, ''))).status, 404, 'a bundle has no single file to send');
});

test('an HTML bundle: scripts, styles, handlers and javascript: links gone; MathML and pandoc math kept; given sizes stay', async () => {
  const it = await find('The Exported Site, Retitled');
  const r = await get(it.url);
  assert.match(r.headers.get('content-security-policy') || '', /sandbox/);
  const html = await r.text();
  assert.ok(!/window\.bad|color: red|onerror|javascript:/i.test(html), 'nothing that runs');
  assert.match(html, new RegExp(`<img src="/local/rel/${it.id}/images/chart.png" alt="A chart" width="800" height="500">`));
  assert.match(html, /<figcaption>Figure 1\. A chart\.<\/figcaption>/);
  assert.match(html, /src="[^"]*images\/b\.png" alt="A second picture" width="50" height="25"/, 'the author’s own size is kept');
  assert.match(html, /<math><mi>x<\/mi><mo>=<\/mo><mn>2<\/mn><\/math>/);
  assert.match(html, /<span class="math inline">\\\(y\^2\\\)<\/span>/);
  assert.match(html, /href="https:\/\/example\.org\/"/);
});

test('bundles keep the Local lane’s safety: no way out of the folder, no links followed, no dotfiles', async () => {
  const it = await find('A Field Report on Synthetic Stacks');
  for (const p of [
    `/local/rel/${it.id}/../../../../etc/passwd`, `/local/rel/${it.id}/assets/..%2F..%2F..%2Fsecret.png`, `/local/rel/${it.id}/assets/escape.png`,
    `/local/rel/${it.id}/~/../secret.png`, `/local/rel/${it.id}/.hidden`, `/local/rel/${it.id}/assets/%2e%2e/%2e%2e/%2e%2e/secret.png`,
  ]) assert.equal(await raw(p), 404, p);
  assert.equal(await raw(`/local/rel/${it.id}/notes/draft.md`), 200, 'a file inside the bundle is its own');
  const linked = await find('Linked');
  assert.ok(linked, 'a .stack folder is listed even when its index is a link');
  const html = await (await get(linked.url)).text();
  assert.ok(!/NOT YOURS/.test(html), 'a linked index file is not read'); assert.match(html, /without an index/);
  const empty = await find('Empty');
  assert.match(await (await get(empty.url)).text(), /without an index\.md or index\.html/);
});

test('a Google Docs web-page export, unzipped (one .html beside images/), is one bundle; anything more stays a folder', async (t) => {
  assert.deepEqual(bundleOf('Trip Notes', ['TripNotes.html', '.DS_Store'], ['images']), { index: 'TripNotes.html', itype: 'html', cover: null, sidecar: null });
  assert.equal(bundleOf('Trip Notes', ['TripNotes.html'], []), null, 'no images/ folder: an ordinary folder');
  assert.equal(bundleOf('two', ['a.html', 'b.html'], ['images']), null, 'two pages: a folder');
  assert.equal(bundleOf('mixed', ['page.html', 'paper.pdf'], ['images']), null, 'another file beside it: a folder');
  assert.equal(bundleOf('more', ['page.html'], ['images', 'drafts']), null, 'another subfolder: a folder');
  const d = mkdtempSync(join(tmpdir(), 'stacks-local-gdocs-'));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  const doc = join(d, 'Shelf', 'Trip Notes');
  mkdirSync(join(doc, 'images'), { recursive: true });
  writeFileSync(join(doc, 'TripNotes.html'), '<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type"></head><body><p>Day one.</p><p><img src="images/image1.png"></p><p>Day two, with more words than a line.</p></body></html>');
  writeFileSync(join(doc, 'images', 'image1.png'), PNG); writeFileSync(join(doc, 'images', 'image2.png'), PNG);
  const ix = new LocalIndex({ dirs: [join(d, 'Shelf')], cacheDir: join(d, 'cache'), tools: { pdfinfo: false, mdls: false, textutil: false, brctl: false } });
  await ix.scan(); await ix.settled();
  assert.equal(ix.items.length, 1, 'one item, not a page and a gallery');
  const [it] = ix.items;
  assert.equal(it.t, 'Trip Notes'); assert.equal(it.ext, 'bundle'); assert.deepEqual(it.path, ['Shelf']);
});
