// Your own folders, read in place, as the 'local' lane (server/local.mjs does the work).
//
//   GET  /local/items.json        {v, label, roots, items}: the items in corpus.json's format
//                                 (lane 'local', path, ord, kind, url, why, src 'local')
//   GET  /local/v                 {v, scanning}: poll this; fetch the items when v changes
//   GET  /local/file/<id>         the file's bytes (Range requests; only indexed files)
//   GET  /local/doc/<id>          HTML for the reader: EPUB, Markdown, web page, Word (textutil
//                                 on a Mac), a folder of pictures or sound, or a page that says
//                                 why the file cannot be shown (not downloaded from iCloud, a zip…)
//   GET  /local/epub/<id>/<path>  a file inside an EPUB (its pictures)
//   GET  /local/rel/<id>/<path>   a file beside a document (a Markdown file's pictures), inside
//                                 the configured folders only
//   GET  /local/settings          the folders and what was found; POST {dirs, order, autoAI}
//   POST /local/rescan, POST /local/reveal {id} (show the file in Finder)
//
// Folders: Settings › Local folders (kept in CACHE/local/settings.json), else
// STACKS_LOCAL_DIRS (':' or new lines between paths; ~ allowed), else
// ~/Library/Mobile Documents/com~apple~CloudDocs/Recent Things to Read when it exists.
// Changes are seen through fs.watch (recursive), debounced, with a rescan every two
// minutes (every 15 s where watching does not work).
//
// These routes answer only this machine's own pages: the Host must be this server
// (unless STACKS_HOST opens it up), cross-site requests are refused (Sec-Fetch-Site,
// Origin) and nothing here sends Access-Control-Allow-Origin, so another web site
// cannot list or read your files through the browser.
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, realpathSync, createReadStream, watch, readdirSync, unlinkSync, renameSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, dirname, basename, sep, resolve, relative, isAbsolute } from 'path';
import { homedir } from 'os';
import { execFile, spawn } from 'child_process';
import { HOST } from '../config.mjs';
import * as L from '../local.mjs';

const DOC_MAX = 40 * 1024 * 1024; // a Markdown or HTML file read whole
const enc = (p) => String(p).split('/').map(encodeURIComponent).join('/');

export default async function (app) {
  const DIR = join(app.CACHE, 'local'), DOCS = join(DIR, 'docs'), SETTINGS = join(DIR, 'settings.json');
  mkdirSync(DOCS, { recursive: true });
  const readSettings = () => { try { return JSON.parse(readFileSync(SETTINGS, 'utf-8')); } catch { return {}; } };
  let saved = readSettings();
  const ORDERS = ['name', 'newest'];
  const conf = () => {
    const { dirs, from } = L.effectiveDirs(Array.isArray(saved.dirs) ? saved.dirs : null);
    return { dirs, from, order: ORDERS.includes(saved.order) ? saved.order : ORDERS.includes(process.env.STACKS_LOCAL_ORDER) ? process.env.STACKS_LOCAL_ORDER : 'name', autoAI: saved.autoAI === true };
  };

  let index = null, watchers = [], watching = false, tick = null;
  function start() {
    const c = conf();
    index?.close();
    // A folder that went away and came back (renamed back, a drive plugged in again) is watched again.
    index = new L.LocalIndex({ dirs: c.dirs, cacheDir: DIR, order: c.order, autoAI: c.autoAI, onChange: () => { if (watched !== okDirs()) rewatch(); } });
    index.scan().then(rewatch);
    return index;
  }
  // ---- watching: fs.watch on each folder (recursive), debounced; a slow rescan as a backstop ----
  let soon = null, first = 0;
  const schedule = () => {
    const now = Date.now();
    if (!soon) first = now;
    clearTimeout(soon);
    soon = setTimeout(() => { soon = null; index.scan(); }, now - first > 2000 ? 0 : 400);
  };
  let watched = '';
  const okDirs = () => index.roots.filter((r) => r.ok).map((r) => r.dir).join('\n');
  function rewatch() {
    watched = okDirs();
    for (const w of watchers) try { w.close(); } catch { /* closed */ }
    watchers = [];
    let ok = 0;
    for (const r of index.roots) {
      if (!r.ok) continue;
      try {
        const w = watch(r.dir, { recursive: true, persistent: false }, (ev, f) => { if (!f || !/(^|[\\/])\.DS_Store$/.test(String(f))) schedule(); });
        w.on('error', () => { try { w.close(); } catch { /* closed */ } watchers = watchers.filter((x) => x !== w); watching = watchers.length > 0; resetTick(); });
        watchers.push(w); ok++;
      } catch (e) { console.warn(`local: cannot watch ${r.name} (${e.code || e.message}); rescanning every 15 s instead`); }
    }
    watching = ok > 0 && ok === index.roots.filter((r) => r.ok).length;
    resetTick();
  }
  function resetTick() {
    clearInterval(tick);
    tick = setInterval(() => index.scan(), watching && index.roots.every((r) => r.ok) ? 120e3 : 15e3); // a folder not there (yet): look every 15 s
    tick.unref?.();
  }
  start();

  // Profiles (server/profile.mjs) know corpus items; local ones are looked up here, so a
  // local PDF gets a compiled profile in the cache like any other.
  // Reading guides (server/augment.mjs) likewise; the client asks for one only when you do.
  const lookup = (id) => (String(id ?? '').startsWith('local:') ? index.get(id)?.it || null : null);
  for (const m of ['../profile.mjs', '../augment.mjs']) { try { (await import(m)).registerItems?.(lookup); } catch (e) { console.warn(`local: ${m}:`, e.message); } }

  app.local = {
    get index() { return index; },
    /** [first, frac] for /ready, or null when the id is not a local item. */
    ready: (id) => (String(id).startsWith('local:') ? index.ready(id) : null),
    /** True for a local file URL whose file is on disk (POST /cached). */
    has: (u) => { const m = /^\/local\/file\/(local:[0-9a-f]+)/.exec(String(u)); const x = m && index.get(m[1]); return !!x && !x.gone && !x.e.cloud; },
  };

  // ---- who may ask ----
  const open = !['127.0.0.1', 'localhost', '::1'].includes(HOST);
  const hostOk = (h) => open || /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(h || '');
  function guard(req, res, post = false) {
    const host = req.headers.host || '';
    let why = null;
    if (!hostOk(host)) why = 'host';
    const site = req.headers['sec-fetch-site'];
    if (!why && site && site !== 'same-origin' && site !== 'none') {
      // A page of ours in a sandbox (a local HTML file opened with o) loads its own pictures.
      let ref = null; try { ref = new URL(req.headers.referer).host; } catch { /* none */ }
      if (post || ref !== host) why = 'cross-site';
    }
    const origin = req.headers.origin;
    if (!why && origin) { let oh = null; try { oh = new URL(origin).host; } catch { /* 'null' */ } if (post ? oh !== host : oh && oh !== host) why = 'origin'; }
    if (!why && post && !/^application\/json\b/i.test(req.headers['content-type'] || '')) why = 'content-type';
    if (!why) return true;
    res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('forbidden: ' + why);
    return false;
  }
  const json = (res, obj, code = 200, extra = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...extra }); res.end(JSON.stringify(obj)); };
  const fail = (res, code, msg) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(msg); };
  const SANDBOX = { 'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-forms allow-modals' };
  const safeHeaders = (type) => (/html|xml|svg/i.test(type) ? (/svg/.test(type) ? { 'Content-Security-Policy': 'sandbox' } : SANDBOX) : {});

  /** A file with Range support (pdf.js, audio seeking, the browser's own viewer). */
  function sendFile(req, res, file, type, extra = {}) {
    let st; try { st = statSync(file); } catch { return fail(res, 404, 'not found'); }
    if (!st.isFile()) return fail(res, 404, 'not found');
    const etag = `"${st.size.toString(36)}-${Math.round(st.mtimeMs).toString(36)}"`;
    const h = { 'Content-Type': type, 'Accept-Ranges': 'bytes', ETag: etag, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', ...safeHeaders(type), ...extra };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, h); return res.end(); }
    let start = 0, end = st.size - 1, code = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || '').trim());
    if (m && (m[1] || m[2]) && (!req.headers['if-range'] || req.headers['if-range'] === etag)) {
      if (!m[1]) start = Math.max(0, st.size - Number(m[2]));
      else { start = Number(m[1]); if (m[2]) end = Math.min(Number(m[2]), st.size - 1); }
      if (start >= st.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
      code = 206; h['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
    h['Content-Length'] = end - start + 1;
    res.writeHead(code, h);
    if (req.method === 'HEAD' || !h['Content-Length']) return res.end();
    createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
  }

  const rootsInfo = () => index.roots.map((r) => ({ dir: r.dir, name: r.name, n: r.n, ok: r.ok, error: r.error, skipped: r.skipped, truncated: r.truncated }));
  const firstScan = () => (index.scans ? null : index.scanning);

  app.route('GET', '/local/items.json', async (req, res, url) => {
    if (!guard(req, res)) return;
    const pending = firstScan();
    if (pending) await Promise.race([pending, new Promise((r) => setTimeout(r, 4000))]);
    if (url.searchParams.get('wait') === '1') await index.settled(20000);
    const etag = `"${index.v}"`;
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ETag: etag, 'Cache-Control': 'no-cache' }); return res.end(); }
    json(res, { v: index.v, label: 'Local', roots: rootsInfo(), items: index.items }, 200, { ETag: etag });
  });
  app.route('GET', '/local/v', (req, res) => { if (guard(req, res)) json(res, { v: index.v, scanning: !!index.scanning || index.queue.length > 0 || index.working > 0 }); });

  const itemFrom = (m) => { const x = index.get(decodeURIComponent(m[1])); return x || null; };
  app.route('*', /^\/local\/file\/(local(?::|%3A)[0-9a-f]{20})$/i, (req, res, url, m) => {
    if (!guard(req, res)) return;
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'GET only');
    const x = itemFrom(m);
    if (!x || x.gone || x.e.kind !== 'file' || x.e.stubAbs) return fail(res, 404, 'not found');
    const real = within(x.e.abs); // not a link put in its place since the folder was read
    if (!real) return fail(res, 404, 'not found');
    sendFile(req, res, real, L.mimeOf(x.e.abs), { 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(basename(x.e.abs))}` });
  });

  // ---- a file beside a document, or a member of a gallery: inside the configured folders only ----
  const rootReals = () => index.roots.filter((r) => r.ok).map((r) => { try { return realpathSync(r.dir); } catch { return null; } }).filter(Boolean);
  function within(file) {
    let real; try { real = realpathSync(file); } catch { return null; }
    return rootReals().some((r) => real === r || real.startsWith(r.endsWith(sep) ? r : r + sep)) ? real : null;
  }
  const baseOf = (x) => (x.e.kind === 'file' ? dirname(x.e.abs) : join(x.e.root.dir, x.e.dirRel));
  app.route('*', /^\/local\/rel\/(local(?::|%3A)[0-9a-f]{20})\/(.+)$/i, (req, res, url, m) => {
    if (!guard(req, res)) return;
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'GET only');
    const x = itemFrom(m);
    if (!x || x.gone) return fail(res, 404, 'not found');
    let parts; try { parts = m[2].split('/').map(decodeURIComponent); } catch { return fail(res, 400, 'bad path'); }
    let base = baseOf(x);
    if (parts[0] === '~') { base = x.e.root.dir; parts = parts.slice(1); } // relative to the folder you configured (a link up and over: ../other/x.png)
    if (!parts.length || parts.some((p) => !p || p === '.' || p === '..' || p.startsWith('.') || p.includes('\0') || p.includes('\\'))) return fail(res, 404, 'not found');
    const real = within(resolve(base, ...parts));
    if (!real) return fail(res, 404, 'not found');
    sendFile(req, res, real, L.mimeOf(real));
  });

  app.route('GET', /^\/local\/epub\/(local(?::|%3A)[0-9a-f]{20})\/(.+)$/i, (req, res, url, m) => {
    if (!guard(req, res)) return;
    const x = itemFrom(m);
    if (!x || x.gone || x.e.type !== 'epub' || x.e.stubAbs || !within(x.e.abs)) return fail(res, 404, 'not found');
    let name; try { name = decodeURIComponent(m[2]); } catch { return fail(res, 400, 'bad path'); }
    let z = null;
    try {
      z = L.openZip(x.e.abs);
      if (!z.entries.has(name)) return fail(res, 404, 'not found');
      const buf = z.read(name, 64 * 1024 * 1024);
      const type = L.mimeOf(name);
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': buf.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', ...safeHeaders(type) });
      res.end(buf);
    } catch (e) { fail(res, 500, 'cannot read the EPUB: ' + e.message); } finally { z?.close(); }
  });

  // ---- documents as HTML ----
  const page = (title, body, cls = '') => `<!doctype html><html><head><meta charset="utf-8"><title>${L.esc(title)}</title></head><body${cls ? ` class="${cls}"` : ''}>${body}</body></html>`;
  const note = (lines) => `<div class="lc-note">${lines.map((l) => `<p>${l}</p>`).join('')}</div>`;
  const shq = (p) => `'${String(p).replace(/'/g, `'\\''`)}'`;
  const fetching = new Map(); // id → when brctl download was last asked
  function relUrl(x, v, isImg) {
    if (!v) return v;
    if (/^#/.test(v)) return v;
    if (/^(https?|mailto|ftp):/i.test(v)) return v;
    if (/^data:image\//i.test(v)) return isImg ? v : '#';
    if (/^[a-z][a-z0-9+.-]*:/i.test(v) || v.startsWith('/') || v.startsWith('\\')) return '#';
    let p = v.split(/[?#]/)[0];
    try { p = decodeURIComponent(p); } catch { /* as written */ }
    if (!p) return '#';
    const base = baseOf(x), target = resolve(base, p);
    const inRoot = relative(x.e.root.dir, target);
    if (!inRoot || inRoot.startsWith('..') || isAbsolute(inRoot)) return '#'; // outside the folder: not served
    const fromBase = relative(base, target);
    return fromBase.startsWith('..') ? `/local/rel/${x.it.id}/~/${enc(inRoot)}` : `/local/rel/${x.it.id}/${enc(fromBase)}`;
  }
  const CONV = 2; // converted documents made before a converter change are made again (2: UTF-16 and Latin-1 chapters, SVG animation)
  function cachePath(x) { return join(DOCS, `${x.it.id.slice(6)}-${Math.round(x.e.mtimeMs).toString(36)}-${x.e.size.toString(36)}-${CONV}.html`); }
  function keep(x, html) {
    const f = cachePath(x), pre = x.it.id.slice(6) + '-';
    try { for (const old of readdirSync(DOCS)) if (old.startsWith(pre) && join(DOCS, old) !== f) unlinkSync(join(DOCS, old)); writeFileSync(f + '.tmp', html); renameSync(f + '.tmp', f); } catch (e) { console.warn('local: doc cache:', e.message); }
    return html;
  }
  const cached = (x) => { try { return readFileSync(cachePath(x), 'utf-8'); } catch { return null; } };
  const textutil = (file) => new Promise((res, rej) => execFile('textutil', ['-convert', 'html', '-stdout', '-noload', file], { timeout: 60e3, maxBuffer: 64 * 1024 * 1024, encoding: 'utf-8' }, (e, out) => (e && !out ? rej(e) : res(out))));

  async function docOf(x) {
    const { e, it } = x;
    if (x.gone) return page(it.t, note(['This file is no longer in your folder: it was moved, renamed or deleted.', 'Reload the page to see the folder as it is now.']));
    if (e.stubAbs) {
      const can = index.tools.brctl;
      if (can && Date.now() - (fetching.get(it.id) || 0) > 60e3) { fetching.set(it.id, Date.now()); try { spawn('brctl', ['download', e.abs], { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch { /* not a Mac */ } }
      return page(it.t, note([
        `<b>${L.esc(basename(e.abs))}</b> is in iCloud but not downloaded to this Mac yet.`,
        can ? 'Downloading it now: it opens here by itself when it arrives.' : 'To download it, run this in Terminal (or open the folder in Finder and click the cloud icon):',
        `<code>brctl download ${L.esc(shq(e.abs))}</code>`,
      ]));
    }
    if (e.kind === 'gallery' || e.type === 'image') {
      const files = e.kind === 'gallery' ? e.files : [{ name: basename(e.abs) }];
      return page(it.t, `<div class="lc-gallery">${files.map((f) => `<figure><img src="/local/rel/${it.id}/${encodeURIComponent(f.name)}" alt="${L.esc(L.cleanTitle(f.name))}"><figcaption>${L.esc(f.name)}</figcaption></figure>`).join('\n')}</div>`);
    }
    if (e.kind === 'playlist' || e.type === 'audio') {
      const files = e.kind === 'playlist' ? e.files : [{ name: basename(e.abs) }];
      return page(it.t, `<ol class="lc-playlist">${files.map((f) => `<li><p>${L.esc(L.cleanTitle(f.name))}</p><audio controls preload="none" src="/local/rel/${it.id}/${encodeURIComponent(f.name)}"></audio></li>`).join('\n')}</ol>`);
    }
    if (e.cloud === 'evicted' && ['epub', 'word'].includes(e.type)) { /* reading it below downloads it (macOS fetches on read) */ }
    switch (e.type) {
      case 'md': {
        const buf = await readFile(e.abs);
        if (buf.length > DOC_MAX) throw new Error('too large to show');
        const r = L.mdToHtml(L.decodeText(buf), { url: (v, img) => relUrl(x, v, img) });
        return page(it.t, `<article class="lc-md">${r.html}</article>`);
      }
      case 'html': {
        const buf = await readFile(e.abs);
        if (buf.length > DOC_MAX) throw new Error('too large to show');
        const r = L.htmlDoc(buf, (v, img) => relUrl(x, v, img));
        return page(it.t, `<article class="lc-html">${r.html}</article>`);
      }
      case 'txt': {
        const t = L.decodeText((await readFile(e.abs)).subarray(0, DOC_MAX));
        return page(it.t, t.split(/\n\s*\n/).map((p) => `<p>${L.esc(p.trim())}</p>`).join('\n'));
      }
      case 'epub': {
        const c = cached(x); if (c) return c;
        const b = L.epubBook(e.abs, { asset: (p) => `/local/epub/${it.id}/${enc(p)}` });
        return keep(x, page(it.t, `<article class="lc-epub">${b.html}</article>`));
      }
      case 'word': {
        const c = cached(x); if (c) return c;
        if (!index.tools.textutil) return page(it.t, note(['Word documents are converted with macOS’s textutil, which is not on this machine.']));
        const out = await textutil(e.abs);
        const r = L.htmlDoc(out, (v, img) => relUrl(x, v, img));
        return keep(x, page(it.t, `<article class="lc-word">${r.html}</article>`));
      }
      default: {
        const what = L.KIND_LABEL[e.type] || ('.' + e.ext + ' file');
        const hint = {
          archive: 'Stacks does not open archives. Unpack it (double-click it in Finder) and what is inside appears here by itself.',
          comic: 'Comic book archives are not supported yet.',
          kindle: 'Kindle books are not supported yet; Calibre can convert one to EPUB, which opens here.',
          djvu: 'DjVu files are not supported yet; converting one to PDF (for example with ddjvu) makes it readable here.',
          pages: 'Pages documents are not supported yet; export it as PDF or EPUB from Pages.',
        }[e.type] || 'This kind of file is not supported yet.';
        return page(it.t, note([`<b>${L.esc(basename(e.abs))}</b>: ${L.esc(what)}, ${L.sizeText(e.size)}.`, L.esc(hint)]));
      }
    }
  }
  app.route('GET', /^\/local\/doc\/(local(?::|%3A)[0-9a-f]{20})$/i, async (req, res, url, m) => {
    if (!guard(req, res)) return;
    const x = itemFrom(m);
    if (!x || (!x.gone && x.e.kind === 'file' && !x.e.stubAbs && !within(x.e.abs))) return fail(res, 404, 'not found');
    let html;
    try { html = await docOf(x); } catch (e) { html = page(x.it.t, note([`This file could not be read: ${L.esc(e.message)}`])); }
    const buf = Buffer.from(html, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': buf.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', ...SANDBOX });
    res.end(buf);
  });

  // ---- settings ----
  const settingsInfo = () => {
    const c = conf();
    const def = L.parseDirs(L.ICLOUD_DEFAULT)[0];
    return { dirs: c.dirs, from: c.from, saved: Array.isArray(saved.dirs) ? saved.dirs : null, env: process.env.STACKS_LOCAL_DIRS ?? null, def: L.ICLOUD_DEFAULT, defExists: existsSync(def), order: c.order, autoAI: c.autoAI, roots: rootsInfo(), watching, items: index.items.length, platform: process.platform, tools: index.tools };
  };
  app.route('GET', '/local/settings', (req, res) => { if (guard(req, res)) json(res, settingsInfo()); });
  app.route('POST', '/local/settings', async (req, res) => {
    if (!guard(req, res, true)) return;
    let b; try { b = await app.body(req); } catch { return json(res, { error: 'bad JSON' }, 400); }
    const next = { ...readSettings() };
    if ('dirs' in b) {
      if (b.dirs == null) delete next.dirs;
      else {
        const list = L.parseDirs(b.dirs);
        const bad = list.find((d) => d === '/' || d === homedir() || d === resolve(homedir(), '..'));
        if (bad) return json(res, { error: `${bad} is too broad: pick a folder inside it` }, 400);
        if (list.length > 20) return json(res, { error: 'at most 20 folders' }, 400);
        next.dirs = list;
      }
    }
    if ('order' in b) { if (!ORDERS.includes(b.order)) return json(res, { error: 'order must be name or newest' }, 400); next.order = b.order; }
    if ('autoAI' in b) next.autoAI = b.autoAI === true;
    const before = conf();
    saved = next;
    try { writeFileSync(SETTINGS, JSON.stringify(next, null, 1)); } catch (e) { return json(res, { error: 'cannot save: ' + e.message }, 500); }
    const now = conf();
    if (now.dirs.join('\n') !== before.dirs.join('\n')) { start(); await Promise.race([index.scanning, new Promise((r) => setTimeout(r, 5000))]); }
    else if (now.order !== before.order || now.autoAI !== before.autoAI) { index.order = now.order; index.autoAI = now.autoAI; index.build(); }
    json(res, settingsInfo());
  });
  app.route('POST', '/local/rescan', async (req, res) => {
    if (!guard(req, res, true)) return;
    await index.scan();
    json(res, settingsInfo());
  });
  app.route('POST', '/local/reveal', async (req, res) => {
    if (!guard(req, res, true)) return;
    let b; try { b = await app.body(req); } catch { return json(res, { error: 'bad JSON' }, 400); }
    const x = index.get(String(b?.id || ''));
    if (!x || x.gone) return json(res, { error: 'unknown item' }, 404);
    const target = x.e.kind === 'file' ? (x.e.stubAbs || x.e.abs) : join(x.e.root.dir, x.e.dirRel);
    const [cmd, args] = process.platform === 'darwin' ? ['open', ['-R', target]] : process.platform === 'win32' ? ['explorer', ['/select,', target]] : ['xdg-open', [x.e.kind === 'file' ? dirname(target) : target]];
    try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch (e) { return json(res, { error: e.message }, 500); }
    json(res, { ok: true });
  });

  app.status(() => ({ local: { folders: index.roots.length, items: index.items.length, v: index.v, watching, scanning: !!index.scanning, meta: index.queue.length + index.working } }));
}
