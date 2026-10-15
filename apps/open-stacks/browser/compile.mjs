#!/usr/bin/env node
/**
 * Compile profiles for many items at once, say overnight (docs/profiles/spec.md,
 * section 6.3). The app compiles in idle time anyway; this does the corpus
 * ahead of you. Nothing here is required, and nothing is installed:
 *
 *   node compile.mjs [--lanes ai-safety,llm] [--items 200] [--ids id1,id2]
 *                    [--engine auto|playwright|poppler] [--assets core|full] [--all-pages]
 *                    [--height 1800] [--jobs 3] [--port 4747] [--force] [--dry]
 *
 * --engine playwright (auto picks it when the playwright package resolves):
 *   headless Chromium runs the app's own compiler (features/compile.js) through
 *   window.__stacksCompile: the same analysis, sprite and display images as
 *   the browser makes. Browsers come from `npx playwright install chromium`;
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE points at another Chromium.
 * --engine poppler (auto picks it when pdftoppm is on the PATH): PDFs only.
 *   pdfinfo for page sizes, pdftoppm (400 px, greyscale) for the analysis,
 *   pdftotext in reading order (it keeps two columns apart) for words,
 *   headings and the page-marked text, and pdftoppm JPEGs for display images
 *   with --assets full. No sprite and no figures (the browser adds them later).
 * --assets full adds display images: the opening spread, the best pages and
 *   pages with figures (with --all-pages, every page, within each profile's
 *   budget), rendered --height px tall (default 1800).
 *
 * It talks to a running server (--port, default 4747) so budgets, the index
 * and eviction apply; when none answers it starts one for the run.
 */
import { spawn, execFileSync, execSync } from 'child_process';
import { createRequire } from 'module';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as core from './ui/js/profile-core.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, d = null) => { const i = argv.indexOf('--' + name); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const opts = {
  lanes: arg('lanes') ? String(arg('lanes')).split(',') : null, items: Number(arg('items', 0)) || 0, ids: arg('ids') ? String(arg('ids')).split(',') : null,
  engine: String(arg('engine', 'auto')), assets: String(arg('assets', 'core')), all: !!arg('all-pages'), height: Number(arg('height', 1800)) || 1800,
  jobs: Math.max(1, Number(arg('jobs', 3)) || 3), port: Number(arg('port', process.env.STACKS_PORT || 4747)), force: !!arg('force'), dry: !!arg('dry'),
};
let BASE = `http://127.0.0.1:${opts.port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const enc = encodeURIComponent;

// ------------------------------------------------------------------ engines ----
async function findPlaywright() {
  try { return await import('playwright'); } catch { /* not local */ }
  try { const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); return createRequire(join(root, 'noop.js'))('playwright'); } catch { return null; }
}
const hasPoppler = () => { try { execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' }); execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); return true; } catch { return false; } };

// ------------------------------------------------------------------- server ----
async function status() { try { const r = await fetch(BASE + '/status', { signal: AbortSignal.timeout(3000) }); return r.ok ? r.json() : null; } catch { return null; } }
let child = null;
async function ensureServer() {
  if (await status()) return;
  const port = opts.port + 100 + Math.floor(Math.random() * 400);
  BASE = `http://127.0.0.1:${port}`;
  log(`No server on port ${opts.port}: starting one on ${port} for this run.`);
  child = spawn(process.execPath, [join(HERE, 'server.mjs'), '--port', String(port)], { stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, STACKS_WARM_MB: '0' } });
  for (let i = 0; i < 60 && !(await status()); i++) await sleep(250);
  if (!(await status())) throw new Error('the server did not start');
}
process.on('exit', () => child?.kill());
process.on('SIGINT', () => { child?.kill(); process.exit(130); });

// -------------------------------------------------------------------- items ----
async function pickItems() {
  const { loadCorpus } = await import('./server/routes/60-warm.mjs');
  const { CACHE } = await import('./server/config.mjs');
  const all = loadCorpus();
  const byId = new Map(all.map((it) => [it.id, it]));
  let list;
  if (opts.ids) list = opts.ids.map((id) => byId.get(id)).filter(Boolean);
  else {
    const laneMax = {};
    for (const it of all) laneMax[it.lane] = Math.max(laneMax[it.lane] || 1, it.score || 0);
    const rank = (it) => 0.8 * Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]) + 0.8 * ((it.rel ?? 0.5) - 0.5) + (it.kind === 'pdf' ? 0.35 : 0);
    // The reader's own order first (the warm hint the app sends), then by relevance.
    let hint = null; try { hint = JSON.parse(readFileSync(join(CACHE, 'warm-hint.json'), 'utf-8')); } catch { /* none yet */ }
    const first = [];
    for (const rows of Object.values(hint?.lanes || {})) for (const [id] of rows) if (byId.has(id)) first.push(byId.get(id));
    const seen = new Set(first.map((x) => x.id));
    list = first.concat(all.filter((x) => !seen.has(x.id)).sort((a, b) => rank(b) - rank(a)));
    if (opts.lanes) list = list.filter((it) => opts.lanes.includes(it.lane));
  }
  list = list.filter((it) => it.kind === 'pdf' || it.kind === 'scan');
  if (opts.items) list = list.slice(0, opts.items);
  if (opts.force) return list;
  // Skip items whose profile is current.
  const out = [];
  for (let i = 0; i < list.length; i += 200) {
    const chunk = list.slice(i, i + 200);
    const briefs = await (await fetch(`${BASE}/profiles?ids=${chunk.map((x) => enc(x.id)).join(',')}`)).json().catch(() => ({}));
    for (const it of chunk) { const b = briefs[it.id]; if (!b || b.gen < core.GEN || b.stale || (opts.assets === 'full' && it.kind === 'pdf' && !b.display?.length)) out.push(it); }
  }
  return out;
}

// --------------------------------------------------------------- playwright ----
async function runPlaywright(pw, items) {
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await pw.chromium.launch(exe ? { executablePath: exe } : {});
  const ctx = await browser.newContext({ viewport: { width: 1600, height: Math.round(opts.height / 0.85) } });
  let next = 0, done = 0, pages = 0;
  const t0 = Date.now();
  const worker = async () => {
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?compile=batch`);
    await page.waitForFunction(() => !!window.__stacksCompile, null, { timeout: 60000 });
    while (next < items.length) {
      const it = items[next++];
      const r = await page.evaluate(([id, o]) => window.__stacksCompile(id, o), [it.id, { assets: opts.assets, height: opts.height, all: opts.all }]).catch((e) => ({ id: it.id, error: e.message }));
      done++; pages += r.n || 0;
      log(`${done}/${items.length}  ${it.id}  ${r.error ? 'error: ' + r.error : `${r.n} pp., ${(r.ms / 1000).toFixed(1)} s${r.sprite ? ', sprite' : ''}${r.display ? `, ${r.display} display images` : ''}${r.failed ? ' (failed)' : ''}`}`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.min(opts.jobs, items.length) }, worker));
  await browser.close();
  return { done, pages, s: (Date.now() - t0) / 1000 };
}

// ------------------------------------------------------------------ poppler ----
/** Box-average a binary greyscale PGM (P5) to 240 px wide: the grid analyzeLum reads. */
export function pgmLum(buf) {
  let pos = 0; const tok = [];
  while (tok.length < 4) {
    while (/\s/.test(String.fromCharCode(buf[pos]))) pos++;
    if (buf[pos] === 35) { while (buf[pos] !== 10) pos++; continue; } // comment
    let s = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]);
    tok.push(s);
  }
  pos++;
  const [magic, w, h, max] = [tok[0], Number(tok[1]), Number(tok[2]), Number(tok[3])];
  if (magic !== 'P5' || max > 255) throw new Error('not an 8-bit PGM');
  const W = 240, H = Math.max(1, Math.round((h * W) / w));
  const lum = new Float32Array(W * H), cnt = new Float32Array(W * H);
  for (let y = 0; y < h; y++) {
    const gy = Math.min(H - 1, Math.floor((y * H) / h));
    for (let x = 0; x < w; x++) { const gx = Math.min(W - 1, Math.floor((x * W) / w)); lum[gy * W + gx] += buf[pos + y * w + x]; cnt[gy * W + gx]++; }
  }
  for (let i = 0; i < W * H; i++) lum[i] = cnt[i] ? (lum[i] / cnt[i]) * (255 / max) : 255;
  return { lum, W, H };
}
function pdfinfo(file, n) {
  const out = execFileSync('pdfinfo', ['-f', '1', '-l', String(n), file], { maxBuffer: 64e6 }).toString();
  const pages = [];
  for (const m of out.matchAll(/^Page\s+(\d+)\s+size:\s+([\d.]+) x ([\d.]+)/gm)) pages[Number(m[1]) - 1] = { w: Number(m[2]), h: Number(m[3]) };
  for (const m of out.matchAll(/^Page\s+(\d+)\s+rot:\s+(\d+)/gm)) { const p = pages[Number(m[1]) - 1]; const rot = Number(m[2]) % 360; if (p && rot) { p.rot = rot; if (rot % 180) [p.w, p.h] = [p.h, p.w]; } }
  return pages;
}
async function popplerItem(it) {
  const t0 = Date.now();
  const dir = mkdtempSync(join(tmpdir(), 'stacks-compile-'));
  try {
    let r = await fetch(`${BASE}/proxy?u=${enc(it.url)}`).catch(() => null);
    if (!r?.ok) { await sleep(3000); r = await fetch(`${BASE}/proxy?u=${enc(it.url)}`); } // one retry: arXiv paces downloads
    if (!r.ok) throw new Error('PDF ' + r.status);
    const file = join(dir, 'doc.pdf');
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    const n = Number((execFileSync('pdfinfo', [file]).toString().match(/^Pages:\s+(\d+)/m) || [])[1]) || 0;
    if (!n) throw new Error('no pages');
    const sizes = pdfinfo(file, n);
    execFileSync('pdftoppm', ['-gray', '-scale-to-y', '400', '-scale-to-x', '-1', file, join(dir, 'p')], { maxBuffer: 64e6 });
    const pgms = readdirSync(dir).filter((f) => /^p-\d+\.pgm$/.test(f)).sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    const text = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { maxBuffer: 256e6 }).toString().split('\f');
    const pages = [], heads = [], ixf = [];
    for (let k = 0; k < n; k++) {
      const { lum, W, H } = pgmLum(readFileSync(join(dir, pgms[k])));
      const a = core.analyzeLum(lum, W, H);
      const t = text[k] || '';
      const lines = t.split('\n').map((l) => ({ t: l.trim() })).filter((l) => l.t);
      heads.push(...core.headsOf(lines, k, 0));
      ixf.push(core.indexFrac(lines.map((l) => l.t)));
      pages.push({ ...(sizes[k] || { w: 612, h: 792 }), ...a, words: core.countWords(t) });
    }
    const P = core.finalize({ id: it.id, kind: 'pdf', by: 'poppler', at: new Date().toISOString(), ms: Date.now() - t0, src: { url: it.url }, pages, heads, ixf, outline: [] });
    const res = await fetch(`${BASE}/profile`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(P) });
    if (res.status === 409) return { id: it.id, n, skipped: 'a browser profile is already there' };
    if (!res.ok) throw new Error('upload ' + res.status + ' ' + (await res.text()));
    const stored = (await res.json()).profile;
    await fetch(`${BASE}/profile/text?id=${enc(it.id)}&from=pdftotext`, { method: 'POST', body: text.slice(0, n).map((t, k) => `[p. ${k + 1}] ${t.replace(/\s+/g, ' ').trim()}`).join('\n').slice(0, 3e6) });
    let display = 0;
    if (opts.assets === 'full') display = await popplerDisplay(it, stored, file, dir);
    return { id: it.id, n, ms: Date.now() - t0, display };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
async function popplerDisplay(it, P, file, dir) {
  const pri = new Map();
  let s = Array.isArray(it.best) && it.best.length ? it.best[0] : P.ranges?.front ? P.ranges.body[0] : 0;
  s = core.snapStart(P, Math.min(s, P.n - 1), 3);
  for (const k of core.spreadAt(P, s, 3)) pri.set(k, 90);
  for (const k of it.best || []) if (k < P.n && !pri.has(k)) pri.set(k, 70);
  if (opts.all) for (const p of P.pages) if (!p.blank && !pri.has(p.k)) pri.set(p.k, 10);
  let made = 0;
  for (const [k, p] of [...pri].sort((a, b) => b[1] - a[1] || a[0] - b[0])) {
    const pg = P.pages[k], c = core.cropOf(P, k, core.DEFAULT_PAD); if (!c) continue;
    const b = { x0: Math.max(0, c.x0 - 0.02), y0: Math.max(0, c.y0 - 0.02), x1: Math.min(1, c.x1 + 0.02), y1: Math.min(1, c.y1 + 0.02) };
    const dpi = (opts.height / pg.h) * 72, FW = Math.round((pg.w * dpi) / 72), FH = Math.round((pg.h * dpi) / 72);
    const x = Math.round(b.x0 * FW), y = Math.round(b.y0 * FH), w = Math.round((b.x1 - b.x0) * FW), h = Math.round((b.y1 - b.y0) * FH);
    const out = join(dir, `d${k}`);
    execFileSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=80', '-r', dpi.toFixed(3), '-x', String(x), '-y', String(y), '-W', String(w), '-H', String(h), '-f', String(k + 1), '-l', String(k + 1), '-singlefile', file, out]);
    const img = readFileSync(out + '.jpg');
    const box = [x / FW, y / FH, (x + w) / FW, (y + h) / FH].map((v) => Math.round(v * 1e4) / 1e4);
    const r = await fetch(`${BASE}/profile/asset?id=${enc(it.id)}&size=display&k=${k}&w=${w}&h=${h}&box=${box.join(',')}&H=${FH}&pri=${p}`, { method: 'POST', body: img });
    if (r.status === 409) break;
    if (r.ok) made++;
  }
  return made;
}
async function runPoppler(items) {
  const pdfs = items.filter((it) => it.kind === 'pdf');
  if (pdfs.length < items.length) log(`poppler reads PDFs only: ${items.length - pdfs.length} scans left for the browser.`);
  let next = 0, done = 0, pages = 0;
  const t0 = Date.now();
  const worker = async () => {
    while (next < pdfs.length) {
      const it = pdfs[next++];
      const r = await popplerItem(it).catch((e) => ({ id: it.id, error: e.message }));
      done++; pages += r.n || 0;
      log(`${done}/${pdfs.length}  ${it.id}  ${r.error ? 'error: ' + r.error : r.skipped ? r.skipped : `${r.n} pp., ${(r.ms / 1000).toFixed(1)} s${r.display ? `, ${r.display} display images` : ''}`}`);
    }
  };
  // Each poppler call is its own process; the awaits on the server interleave the jobs.
  await Promise.all(Array.from({ length: Math.min(opts.jobs, pdfs.length) }, worker));
  return { done, pages, s: (Date.now() - t0) / 1000 };
}

// --------------------------------------------------------------------- main ----
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pw = opts.engine === 'auto' || opts.engine === 'playwright' ? await findPlaywright() : null;
  const engine = opts.engine === 'auto' ? (pw ? 'playwright' : hasPoppler() ? 'poppler' : null) : opts.engine;
  if (!engine || (engine === 'playwright' && !pw) || (engine === 'poppler' && !hasPoppler())) {
    log('Nothing to do: the app compiles in idle time. Optional: npm i -g playwright && npx playwright install chromium, or brew install poppler.');
    process.exit(0);
  }
  await ensureServer();
  const items = await pickItems();
  log(`${items.length} items to compile with ${engine}${opts.assets === 'full' ? ' (with display images)' : ''}.`);
  if (opts.dry) { for (const it of items.slice(0, 50)) log('  ' + it.id); process.exit(0); }
  const r = engine === 'playwright' ? await runPlaywright(pw, items) : await runPoppler(items);
  log(`Done: ${r.done} items, ${r.pages} pages in ${r.s.toFixed(0)} s (${(r.pages / Math.max(1, r.s)).toFixed(1)} pages a second).`);
  child?.kill();
  process.exit(0);
}
