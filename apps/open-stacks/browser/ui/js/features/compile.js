// Compiling profiles in idle time (docs/profiles/spec.md, section 6.3).
//
// While the reader rests, this works through the current item and the next
// ones in the lane, one small unit per idle callback, and stores what it finds
// on the server (server/profile.mjs): each page's shape, ink box, blank pages,
// gutters, words, headings and printed labels (the "core" level, finalized by
// profile-core.js into crop groups, spreads, contents and ranges), the page-
// marked text, and a sprite sheet of every page. Pages the feed rendered with
// pdf.js are written back as display images, so the next visit decodes an
// image instead of drawing the page. render.js, feed.js and prefetch.js use
// the result through profile.js.
//
// Rules: a unit starts only with more than 8 ms of idle time left; any 'nav'
// (and hovering the track) pauses compiling, cancelling a render under way,
// until 300 ms after the next 'spread:settled'. Its own pdf.js document on its
// own worker, so it never queues behind the feed's renders. Settings (store):
// compile (true), compileAhead (10, up to 50), writeBack (true).
//
// Also: window.__stacksCompile(id, {assets}) for compile.mjs (?compile=batch),
// the benchmark (?bench=profile, profile-bench.js), the 'profile' track layer
// (front matter, references and appendix as faint bands) and compileTimes.
import { on, store, P } from '../util.js';
import { items } from '../corpus.js';
import { state } from '../state.js';
import { pdfjs, PDF_ASSETS, peekDoc, openDoc, isFlow, scanUrl, pdfOutline } from '../docs.js';
import { RENDER_H, renderedNow } from '../render.js';
import { profileOf, storedProfile, loadProfile, loadProfiles, setProfile, cropOf, spreadAt, snapStart, DEFAULT_PAD } from '../profile.js';
import * as core from '../profile-core.js';
import { registerTrackLayer } from '../feed.js';

const Q = new URL(location.href).searchParams;
const BATCH = Q.get('compile') === 'batch';
const opt = (k, d) => store.get(k, d);
/** Diagnostics: {id, level, k, ms} per unit, the last 400. */
export const compileTimes = [];
/** Diagnostics: what the compiler is doing (jobs and their phases, failures). */
export const compileState = () => ({ jobs: S.jobs.map((j) => ({ id: j.it.id, depth: j.depth, phase: j.phase, k: j.k, n: j.n, busy: j.busy })), failed: [...S.failed], paused: paused(), looping: S.looping, writeQ: writeQ.length });
const note = (id, level, k, ms) => { compileTimes.push({ id, level, k, ms: Math.round(ms) }); if (compileTimes.length > 400) compileTimes.shift(); };
const enc = encodeURIComponent;

// ------------------------------------------------------------- scheduling ----
const S = { pausedFor: null, resumeAt: 0, looping: false, task: null, hover: false, jobs: [], gen: 0, failed: new Set(), done: new Set() };
const ric = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(() => fn({ timeRemaining: () => 12, didTimeout: false }), 60));
const paused = () => BATCH || !opt('compile', true) || S.pausedFor != null || S.hover || document.hidden || state.view !== 'feed' || performance.now() < S.resumeAt;
on('nav', () => {
  S.pausedFor = state.gen; S.gen++;
  try { S.task?.cancel(); } catch { /* finished */ }
});
on('spread:settled', () => {
  if (S.pausedFor != null) { S.pausedFor = null; S.resumeAt = performance.now() + 300; }
  setTimeout(kick, 320);
});
document.getElementById('track')?.addEventListener('pointerenter', () => { S.hover = true; try { S.task?.cancel(); } catch { /* done */ } });
document.getElementById('track')?.addEventListener('pointerleave', () => { S.hover = false; setTimeout(kick, 300); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(kick, 500); });
function kick() { if (!S.looping && !paused()) { S.looping = true; ric(step); } }
async function step(deadline) {
  if (paused()) { S.looping = false; return; }
  if (deadline.timeRemaining() <= 8) { ric(step); return; }
  const unit = nextUnit();
  if (!unit) { S.looping = false; return; }
  const gen = S.gen;
  try { await unit(); } catch (e) { if (gen === S.gen && !/cancel/i.test(e?.message || e?.name || '')) console.warn('compile:', e?.message || e); }
  if (paused()) { S.looping = false; return; }
  ric(step);
}

// ------------------------------------------------------------------ jobs ----
// A job is one item at one depth: 'all' (current item: core, sprite, figures),
// 'sprite' (next 3: core and sprite) or 'core'. Units come from the first job
// that has work left; write-backs go first (their renders may be evicted).
const writeQ = [];
function plan() {
  const order = state.order;
  const ahead = Math.max(0, Math.min(50, opt('compileAhead', 10)));
  const list = [];
  const cur = items[order[state.pos]];
  if (cur) list.push({ it: cur, depth: 'all' });
  order.slice(state.pos + 1, state.pos + 1 + ahead).forEach((ii, d) => {
    const it = items[ii]; if (!it) return;
    if (d >= 10 && it.kind !== 'pdf') return;
    if (it.kind === 'scan' && d >= 3) return;
    list.push({ it, depth: d < 3 ? 'sprite' : 'core', far: d >= 10 });
  });
  const keep = new Map(S.jobs.map((j) => [j.it.id, j]));
  S.jobs = list.map((x) => { const j = keep.get(x.it.id); if (j) { j.depth = x.depth; return j; } return new Job(x.it, x.depth, x.far); });
  for (const [id, j] of keep) if (!S.jobs.includes(j)) j.drop();
  loadProfiles(list.map((x) => x.it)).catch(() => {});
}
on('item:settled', ({ it }) => {
  plan();
  writeBackAhead();
  if (isFlow(it)) setTimeout(() => flowProfile(it).catch(() => {}), 400);
  setTimeout(kick, 400);
});
function nextUnit() {
  if (writeQ.length) return writeQ.shift();
  for (const j of S.jobs) { const u = j.next(); if (u) return u; }
  return null;
}

class Job {
  constructor(it, depth, far = false) { Object.assign(this, { it, depth, far, phase: 'check', k: 0, pages: [], keep: [], busy: false, missed: 0 }); }
  drop() { this.phase = 'dropped'; this.pdf?.destroy?.(); this.pdf = null; this.keep = []; }
  /** The next unit of work, or null (nothing left, or waiting for one under way). */
  next() {
    if (this.busy || this.phase === 'done' || this.phase === 'dropped' || S.failed.has(this.it.id)) return null;
    const run = (fn) => async () => { this.busy = true; const t0 = performance.now(); try { await fn(); } catch (e) { if (!/cancel/i.test(e?.name || e?.message || '')) { S.failed.add(this.it.id); this.drop(); throw e; } } finally { this.busy = false; note(this.it.id, this.phase, this.k, performance.now() - t0); } };
    switch (this.phase) {
      case 'check': return run(() => this.check());
      case 'open': return run(() => this.open());
      case 'page': return run(() => this.page());
      case 'final': return run(() => this.final());
      case 'sprite': return run(() => this.sprite());
      case 'figures': return run(() => this.figures());
      default: return null;
    }
  }
  wants(level) { return this.depth === 'all' || (level === 'sprite' && this.depth === 'sprite'); }
  async check() {
    const it = this.it;
    if (isFlow(it)) { this.phase = 'done'; return; }
    await loadProfile(it);
    const Pst = storedProfile(it);
    const fresh = Pst && Pst.gen >= core.GEN && Pst.stale !== 'src' && Pst.kind === it.kind;
    if (fresh) {
      this.P = Pst;
      this.phase = this.wants('sprite') && !Pst.assets?.sprite && Pst.n > 0 ? 'sprite' : this.wants('figures') && Pst.kind === 'pdf' && Pst.figures == null ? 'figures' : 'done';
      return;
    }
    if (it.kind === 'pdf' && this.far) {
      const bits = await (await fetch('/cached', { method: 'POST', body: JSON.stringify({ urls: [it.url] }) })).text().catch(() => '0');
      if (bits !== '1') { this.phase = 'done'; return; }
    }
    this.phase = 'open';
  }
  async open() {
    const it = this.it, t0 = performance.now();
    this.t0 = t0;
    if (it.kind === 'scan') {
      const n = it.n || 0;
      if (!n) { this.phase = 'done'; return; }
      // The small page images the analysis reads: on the server's queue, behind anything the reader needs.
      fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls: Array.from({ length: Math.min(n, 1500) }, (_, k) => scanUrl(it, k, 200)), pri: 25, group: 'compile' }) }).catch(() => {});
      const [lab, txt] = await Promise.all([
        fetch('/ocr/labels?ia=' + enc(it.ia)).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/ocr/text?ia=' + enc(it.ia)).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      this.labels = lab?.labels || null; this.texts = txt?.pages || null;
      this.n = n; this.phase = 'page'; return;
    }
    const [lib, r] = await Promise.all([pdfjs(), fetch(P(it.url))]);
    if (!r.ok) throw new Error('PDF ' + r.status);
    const buf = await r.arrayBuffer();
    this.size = buf.byteLength;
    worker ||= new lib.PDFWorker({ name: 'compile' });
    this.pdf = await lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, worker, ...PDF_ASSETS }).promise;
    this.n = this.pdf.numPages;
    this.labels = await this.pdf.getPageLabels().catch(() => null);
    this.outline = (await pdfOutline({ pdf: this.pdf, outline: null })).map((o) => ({ t: o.title, k: o.page, d: o.depth }));
    this.phase = 'page';
  }
  async page() {
    const k = this.k, it = this.it;
    const keep = this.n <= 400;
    const one = () => (it.kind === 'scan' ? scanPage(it, k, this.texts?.[k]) : pdfPage(this.pdf, k, keep));
    let p;
    try { p = await one(); } catch (e) {
      if (/cancel/i.test(e?.name || e?.message || '')) throw e;
      // One page that will not load (an archive.org hiccup, a broken PDF page) is
      // shown whole rather than failing the item; many of them stop the job.
      await new Promise((r) => setTimeout(r, 1500));
      try { p = await one(); } catch (e2) {
        if (/cancel/i.test(e2?.name || e2?.message || '')) throw e2;
        if (++this.missed > Math.max(3, this.n * 0.1)) throw e2;
        const prev = this.pages[k - 1];
        p = { w: prev?.w || 1000, h: prev?.h || 1400, blank: false, ink: [0, 0, 1, 1], gut: null, dens: 0, words: it.kind === 'scan' && this.texts?.[k] != null ? core.countWords(this.texts[k]) : -1, lines: [], text: this.texts?.[k] || '' };
      }
    }
    if (this.phase === 'dropped') return;
    if (this.labels?.[k]) p.lab = String(this.labels[k]);
    this.pages[k] = p;
    if (keep && p.keep) this.keep[k] = p.keep;
    delete p.keep;
    this.k++;
    if (this.k >= this.n) this.phase = 'final';
  }
  async final() {
    const it = this.it;
    const body = it.kind === 'pdf' ? core.bodySize(this.pages.map((p) => p.lines || [])) : 0;
    const heads = this.pages.flatMap((p, k) => core.headsOf(p.lines || [], k, body));
    const ixf = this.pages.map((p) => core.indexFrac((p.lines || []).map((l) => l.t)));
    // Figures found earlier (same analysis generation) are kept.
    const old = storedProfile(it);
    const figs = old?.gen === core.GEN && old.figures != null && old.n === this.n ? old.pages.map((p) => p.fig) : null;
    const raw = {
      id: it.id, kind: it.kind, by: BATCH ? 'playwright' : 'browser', at: new Date().toISOString(), ms: performance.now() - this.t0,
      src: it.kind === 'scan' ? { ia: it.ia } : { url: it.url, size: this.size },
      pages: this.pages.map((p, k) => ({ w: p.w, h: p.h, rot: p.rot, ink: p.ink, blank: p.blank, gut: p.gut, dens: p.dens, words: p.words, lab: p.lab, ...(figs?.[k] ? { fig: figs[k] } : {}) })),
      heads, ixf, outline: this.outline || [],
      labels: this.labels ? (it.kind === 'scan' ? 'ia' : 'pdf') : null,
      ...(figs ? { figures: figs.reduce((s, f) => s + (f?.length || 0), 0) } : {}),
    };
    const Pn = core.finalize(raw);
    const text = this.pages.map((p, k) => `[p. ${k + 1}] ${(p.text || '').replace(/\s+/g, ' ').trim()}`).join('\n');
    this.P = await upload(it, Pn);
    if (this.P && text.replace(/\[p\. \d+\]\s*/g, '').trim().length > 40) await postText(it, text.slice(0, 3e6), it.kind === 'scan' ? 'ocr' : 'pdf');
    for (const p of this.pages) { delete p.lines; delete p.text; }
    this.phase = this.P && this.wants('sprite') ? 'sprite' : 'done';
    if (this.phase === 'done') this.release();
  }
  async sprite() {
    const it = this.it, Pf = this.P || storedProfile(it);
    if (!Pf || !Pf.n) { this.phase = 'done'; return; }
    const sheets = await drawSprite(it, Pf, this);
    for (const sh of sheets) {
      const r = await fetch(`/profile/asset?id=${enc(it.id)}&size=sprite&j=${sh.j}&w=${sh.w}&h=${sh.h}&cw=${sh.cw}&ch=${sh.ch}&cols=${sh.cols}`, { method: 'POST', body: sh.blob });
      if (!r.ok) break;
    }
    await loadProfile(it, { force: true });
    this.P = storedProfile(it);
    this.phase = this.wants('figures') && it.kind === 'pdf' && this.P?.figures == null ? 'figures' : 'done';
    if (this.phase === 'done') this.release();
  }
  /** Figure regions from figpeek's own detector, a page per unit, for the current item only. */
  async figures() {
    const it = this.it;
    const fp = await import('./figpeek.js').catch(() => null);
    const Pf = storedProfile(it);
    if (!fp?.regionsOf || !Pf || items[state.order[state.pos]] !== it) { this.phase = 'done'; this.release(); return; }
    this.figKs ||= Pf.pages.filter((p) => (p.role === 'body' || p.role === 'appendix') && p.dens >= 0.02).map((p) => p.k).slice(0, 60);
    this.figs ||= {};
    const k = this.figKs.shift();
    if (k != null) {
      const res = await fp.regionsOf(it, k);
      this.figs[k] = (res?.regions || []).map((r) => ({ b: core.toArr(r), kind: ['figure', 'table', 'plate', 'algorithm'].includes(r.kind) ? r.kind : 'figure', ...(r.cap?.label ? { lab: String(r.cap.label).slice(0, 40) } : {}), ...(r.cap?.text ? { cap: String(r.cap.text).slice(0, 200) } : {}) })).filter((f) => f.b && f.b[0] < f.b[2] && f.b[1] < f.b[3]);
      return;
    }
    const Pn = JSON.parse(JSON.stringify(Pf));
    for (const f of ['rev', 'pid', 'assets', 'stale']) delete Pn[f];
    let count = 0;
    for (const p of Pn.pages) { p.fig = this.figs[p.k] || []; count += p.fig.length; }
    Pn.figures = count;
    await upload(it, Pn);
    this.phase = 'done'; this.release();
  }
  release() { this.pdf?.destroy?.(); this.pdf = null; this.keep = []; S.done.add(this.it.id); }
}
let worker = null;

// ----------------------------------------------------------- page analysis ----
/** Luminance of a canvas drawn 240 px wide: what profile-core.js's analyzeLum reads. */
function lumOf(src, sw, sh) {
  const W = 240, H = Math.max(1, Math.round(sh * (W / sw)));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(src, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
  return { lum, W, H, c };
}
async function pdfPage(pdf, k, keep) {
  const page = await pdf.getPage(k + 1);
  const vp1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: 400 / vp1.height });
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(vp.width)); c.height = Math.max(1, Math.round(vp.height));
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  const tcP = page.getTextContent().catch(() => null);
  S.task = page.render({ canvasContext: g, viewport: vp });
  try { await S.task.promise; } finally { S.task = null; }
  const { lum, W, H, c: small } = lumOf(c, c.width, c.height);
  const a = core.analyzeLum(lum, W, H);
  const tc = await tcP;
  const fontOf = (name) => { try { if (!page.commonObjs.has(name)) return null; const f = page.commonObjs.get(name); return f ? { name: f.name, bold: f.bold, black: f.black } : null; } catch { return null; } };
  const lines = tc ? core.textLines(tc.items, fontOf) : [];
  const words = tc ? tc.items.reduce((s, x) => s + core.countWords(x.str || ''), 0) : -1;
  page.cleanup();
  return { w: +vp1.width.toFixed(2), h: +vp1.height.toFixed(2), rot: page.rotate || 0, ...a, words, lines, text: lines.map((l) => l.t).join(' '), keep: keep ? small : null };
}
async function scanPage(it, k, text) {
  const r = await fetch(P(scanUrl(it, k, 200)));
  if (!r.ok) throw new Error('page image ' + r.status);
  const bm = await createImageBitmap(await r.blob());
  const { lum, W, H } = lumOf(bm, bm.width, bm.height);
  const a = core.analyzeLum(lum, W, H);
  const w = 1000, h = Math.round((1000 * bm.height) / bm.width); // the shape of the w1000 image the feed shows
  bm.close?.();
  const lines = text ? String(text).split(/\n+/).map((t) => ({ t: t.trim() })).filter((l) => l.t) : [];
  return { w, h, ...a, words: text != null ? core.countWords(text) : -1, lines, text: text || '' };
}

// ---------------------------------------------------------------- uploads ----
async function upload(it, Pn) {
  const r = await fetch('/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Pn) });
  if (r.ok) { const j = await r.json(); setProfile(it.id, j.profile); return j.profile; }
  if (r.status === 409) return loadProfile(it, { force: true });
  const j = await r.json().catch(() => ({}));
  console.warn('compile: profile rejected', it.id, r.status, j.detail || j.error);
  return null;
}
const postText = (it, text, from) => fetch(`/profile/text?id=${enc(it.id)}&from=${from}`, { method: 'POST', headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body: text }).catch(() => null);
/** WebP when the browser can encode it, else JPEG. */
function encode(canvas, q) {
  return new Promise((res) => canvas.toBlob((b) => {
    if (b && b.type === 'image/webp') return res(b);
    canvas.toBlob((j) => res(j), 'image/jpeg', Math.min(0.85, q + 0.1));
  }, 'image/webp', q));
}

// ----------------------------------------------------------------- sprite ----
/** Sheets of 120 px cells, every page through its crop at the default pad, letterboxed on white. */
async function drawSprite(it, Pf, job) {
  const ch = 120, cw = Math.max(16, Math.round(120 * (Pf.aspect?.body || Pf.aspect?.page || 0.75)));
  const per = 1024, n = Pf.n, cols = n <= 32 ? Math.max(1, n) : 32;
  const out = [];
  for (let j = 0; j * per < n; j++) {
    const count = Math.min(per, n - j * per), rows = Math.ceil(count / cols);
    const sheet = document.createElement('canvas'); sheet.width = cols * cw; sheet.height = rows * ch;
    const g = sheet.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, sheet.width, sheet.height);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    for (let i = 0; i < count; i++) {
      const k = j * per + i;
      const b = cropOf(Pf, k, DEFAULT_PAD);
      if (!b) continue; // blank: a white cell
      const src = job?.keep?.[k] || await smallPage(it, Pf, k, job);
      if (!src) continue;
      const sw0 = src.width, sh0 = src.height;
      const sx = b.x0 * sw0, sy = b.y0 * sh0, sw = (b.x1 - b.x0) * sw0, sh = (b.y1 - b.y0) * sh0;
      const s = Math.min(cw / sw, ch / sh), dw = sw * s, dh = sh * s;
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.drawImage(src, sx, sy, sw, sh, x + (cw - dw) / 2, y + (ch - dh) / 2, dw, dh);
      src.close?.();
      if (i % 16 === 15) await new Promise((r) => setTimeout(r, 0)); // let input through on long books
    }
    out.push({ j, w: sheet.width, h: sheet.height, cw, ch, cols, blob: await encode(sheet, 0.6) });
  }
  return out;
}
/** A page about 240 px wide for the sprite when the analysis did not keep one. */
async function smallPage(it, Pf, k, job) {
  if (it.kind === 'scan') {
    const r = await fetch(P(scanUrl(it, k, 200))).catch(() => null);
    return r?.ok ? createImageBitmap(await r.blob()).catch(() => null) : null;
  }
  if (!job.pdf) { const lib = await pdfjs(); const buf = await (await fetch(P(it.url))).arrayBuffer(); worker ||= new lib.PDFWorker({ name: 'compile' }); job.pdf = await lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, worker, ...PDF_ASSETS }).promise; }
  const page = await job.pdf.getPage(k + 1);
  const vp1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 300 / vp1.height });
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(vp.width)); c.height = Math.max(1, Math.round(vp.height));
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  page.cleanup();
  return c;
}

// ------------------------------------------------------------- write-back ----
// The feed's own pdf.js renders become display images: encoding runs off the
// main thread (toBlob), one page per idle unit.
const sent = new Set();
function openingPages(it, Pf) {
  const per = state.per || 2;
  let s = Array.isArray(it.best) && it.best.length ? it.best[0] : Pf.ranges?.front ? Pf.ranges.body[0] : 0;
  s = Math.max(0, Math.min(s, Pf.n - 1));
  return new Set(spreadAt(Pf, snapStart(Pf, s, per), per));
}
function queueWrite(it, pnl, pri) {
  const Pf = profileOf(it);
  if (!Pf || !opt('writeBack', true) || pnl.src !== 'pdfjs' || pnl.part || !pnl.canvas || state.crop === false) return;
  const k = pnl.k, have = Pf.assets?.display?.[k];
  const key = `${it.id}|${k}|${Pf.pid}`;
  if (sent.has(key) || (have && have.pri >= pri && have.H >= 0.9 * RENDER_H)) return;
  const c = cropOf(Pf, k, DEFAULT_PAD), b = pnl.box, e = 2e-3;
  if (!c || !(b.x0 <= c.x0 + e && b.y0 <= c.y0 + e && b.x1 >= c.x1 - e && b.y1 >= c.y1 - e)) return; // cropped some other way
  sent.add(key);
  writeQ.push(async () => {
    if (!pnl.canvas?.width) return;
    const t0 = performance.now();
    const blob = await encode(pnl.canvas, 0.8);
    if (!blob) return;
    const q = `id=${enc(it.id)}&size=display&k=${k}&w=${pnl.canvas.width}&h=${pnl.canvas.height}&box=${core.toArr(b).join(',')}&H=${pnl.srcH}&pri=${pri}`;
    const r = await fetch('/profile/asset?' + q, { method: 'POST', body: blob });
    note(it.id, 'write', k, performance.now() - t0);
    if (r.ok) { const j = await r.json(); Pf.assets.display[k] = { f: j.f, v: j.v, w: pnl.canvas.width, h: pnl.canvas.height, box: core.toArr(b), H: pnl.srcH, pri, bytes: j.bytes }; }
  });
}
on('spread:settled', ({ it, els }) => {
  const Pf = profileOf(it); if (!Pf || !els) return;
  const open = openingPages(it, Pf), best = new Set(it.best || []);
  for (const el of els) if (el._pnl) queueWrite(it, el._pnl, open.has(el._pnl.k) ? 90 : best.has(el._pnl.k) ? 70 : 60);
});
/** The next items' first spreads, prepared by planAround: keep that work. */
function writeBackAhead() {
  for (const ii of state.order.slice(state.pos + 1, state.pos + 4)) {
    const x = items[ii], Pf = profileOf(x); if (!Pf) continue;
    for (const k of openingPages(x, Pf)) for (const pnl of renderedNow(x, k) || []) queueWrite(x, pnl, 90);
  }
}

// ------------------------------------------------------------------- flow ----
/** Posts, web pages and texts: pages, words, outline and text from the open document. */
async function flowProfile(it) {
  if (!opt('compile', true) || BATCH) return;
  const old = await loadProfile(it);
  if (old && old.gen >= core.GEN) return;
  const d = peekDoc(it) ? await peekDoc(it) : null;
  if (!d?.texts) return;
  const Pn = core.finalize({ id: it.id, kind: it.kind, by: 'browser', src: { url: it.url, vpWords: 280 }, n: d.n, flowWords: d.texts.map((t) => core.countWords(t)), outline: (d.outline || []).map((o) => ({ t: o.title, k: o.page, d: o.depth })) });
  if (await upload(it, Pn)) await postText(it, d.texts.map((t, k) => `[p. ${k + 1}] ${t.replace(/\s+/g, ' ').trim()}`).join('\n').slice(0, 3e6), 'flow');
}

// ------------------------------------------------------------ track layer ----
// The front matter, references, appendix and index as faint bands on the track.
registerTrackLayer('profile', ({ it, n, el }) => {
  // Under the bright part (the spread), not over it.
  const fill = el.parentNode?.querySelector(':scope > .tr-fill');
  if (fill && fill.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) el.parentNode.insertBefore(el, fill);
  const Pf = profileOf(it);
  const sig = Pf ? `${Pf.pid}.${Pf.gen}.${n}` : '';
  if (el.dataset.sig === sig) return;
  el.dataset.sig = sig;
  el.replaceChildren();
  if (!Pf?.ranges || isFlow(it)) return;
  for (const [name, label] of [['front', 'front matter'], ['refs', 'references'], ['appendix', 'appendix'], ['index', 'index']]) {
    const r = Pf.ranges[name]; if (!r) continue;
    const b = document.createElement('i');
    b.className = 'pr-' + name; b.title = `${label}: pp. ${r[0] + 1}–${r[1] + 1}`;
    b.style.left = `${(100 * r[0]) / n}%`; b.style.width = `${(100 * (r[1] - r[0] + 1)) / n}%`;
    el.append(b);
  }
});
on('profile:updated', ({ id }) => { if (items[state.order[state.pos]]?.id === id) import('../feed.js').then((m) => m.repaintTrack?.()).catch(() => {}); });

// ------------------------------------------------------------------ batch ----
/** compile.mjs drives this in headless Chromium: compile one item now (not in idle time). */
window.__stacksCompile = async (id, { assets = 'core', height = RENDER_H, all = false } = {}) => {
  const it = items.find((x) => x.id === id);
  if (!it) return { id, error: 'unknown id' };
  if (isFlow(it)) return { id, skipped: 'flow' };
  const t0 = performance.now();
  const job = new Job(it, 'sprite');
  for (let guard = 0; guard < 20000 && job.phase !== 'done' && job.phase !== 'dropped'; guard++) {
    const u = job.next(); if (!u) break;
    try { await u(); } catch (e) { return { id, error: e?.message || String(e), ms: Math.round(performance.now() - t0) }; }
  }
  const Pf = storedProfile(it);
  let display = 0;
  if (assets === 'full' && Pf?.n && it.kind === 'pdf') display = await batchDisplay(it, Pf, job, height, all);
  job.release();
  return { id, ok: !!Pf, n: Pf?.n || 0, ms: Math.round(performance.now() - t0), display, sprite: !!Pf?.assets?.sprite, failed: S.failed.has(id) };
};
/** Display images for the pages most likely to be seen: the opening spread and the best pages. */
async function batchDisplay(it, Pf, job, H, all = false) {
  const pri = new Map();
  for (const k of openingPages(it, Pf)) pri.set(k, 90);
  for (const k of it.best || []) if (!pri.has(k) && k < Pf.n) pri.set(k, 70);
  for (const p of Pf.pages) if (!pri.has(p.k) && p.fig?.length) pri.set(p.k, 50);
  if (all) for (const p of Pf.pages) if (!pri.has(p.k) && !p.blank) pri.set(p.k, 10 - p.k / Pf.n); // --all-pages: the rest, front first
  if (!job.pdf) { const lib = await pdfjs(); const buf = await (await fetch(P(it.url))).arrayBuffer(); worker ||= new lib.PDFWorker({ name: 'compile' }); job.pdf = await lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, worker, ...PDF_ASSETS }).promise; }
  let made = 0;
  for (const [k, p] of [...pri].sort((a, b) => b[1] - a[1])) {
    if (Pf.assets?.display?.[k]?.H >= 0.9 * H) continue; // have it already
    const c = cropOf(Pf, k, DEFAULT_PAD); if (!c) continue;
    const b = { x0: Math.max(0, c.x0 - 0.02), y0: Math.max(0, c.y0 - 0.02), x1: Math.min(1, c.x1 + 0.02), y1: Math.min(1, c.y1 + 0.02) };
    const page = await job.pdf.getPage(k + 1);
    const vp1 = page.getViewport({ scale: 1 });
    const scale = Math.min((H * 0.85) / vp1.width, H / vp1.height), vp = page.getViewport({ scale });
    const full = document.createElement('canvas'); full.width = Math.floor(vp.width); full.height = Math.floor(vp.height);
    const g = full.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, full.width, full.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    page.cleanup();
    const sx = Math.round(b.x0 * full.width), sy = Math.round(b.y0 * full.height), sw = Math.round((b.x1 - b.x0) * full.width), sh = Math.round((b.y1 - b.y0) * full.height);
    const cut = document.createElement('canvas'); cut.width = sw; cut.height = sh;
    cut.getContext('2d').drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
    const box = [sx / full.width, sy / full.height, (sx + sw) / full.width, (sy + sh) / full.height].map((v) => Math.round(v * 1e4) / 1e4);
    const blob = await encode(cut, 0.8);
    const r = await fetch(`/profile/asset?id=${enc(it.id)}&size=display&k=${k}&w=${sw}&h=${sh}&box=${box.join(',')}&H=${full.height}&pri=${Math.max(1, Math.round(p))}`, { method: 'POST', body: blob });
    if (r.status === 409) break; // the budget is full at this priority
    if (r.ok) made++;
  }
  if (made) await loadProfile(it, { force: true });
  return made;
}

if (Q.get('bench') === 'profile') import('../profile-bench.js').then((m) => m.run?.()).catch((e) => console.warn('bench:', e));
