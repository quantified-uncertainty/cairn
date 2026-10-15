// Page overview: every page of the item on screen at once, 6 to 120 pages a
// screen, in a grid sized to the stage. O (or a click on the position line)
// opens it over the pages; the item head, the side panel and the track stay.
//
// - Zoom: + bigger pages, - more pages (as on the wall), or pinch inside the
//   grid; the level is remembered. Short items fill the screen with all pages.
// - Hover a page to see it large on the other half of the stage (peek.js when
//   the Feeds work provides it, else a built-in enlarge). Click a page, or
//   Enter on the keyboard cursor (arrows; digits type a page number), to read
//   there; Esc, O or Backspace return to the spread you came from.
// - Space scrolls a screen; at the bottom, the next item's pages (so a lane can
//   be skimmed a grid at a time). j/k and every other feed key work as usual.
// - Marks: the spread you are on (outlined), pages seen (a bar under the page,
//   features/memory.js), the summary's key points (dot), the reading guide's
//   stops (numbers) and skip ranges (dimmed, features/augment.js), figures
//   from the profile, and sections as labels in the gaps between rows (in long
//   items, a whole row opens each long section, with its one-line summary).
// - The track is the grid's minimap while it is open: its bright part is the
//   spread you are on, a band shows the pages in view, hovering it scrolls the
//   grid to that page and enlarges it, and clicking it reads there. Hovering a
//   page in the grid shows its place on the track.
//
// Sources, fastest first: the profile's sprite sheet (one image for every page,
// docs/profiles/spec.md 6) as an instant first picture; pages the feed already
// rendered; then, only for the cells in or near view, small pdf.js renders
// (two at a time, cancelled when they scroll away, held back while the grid
// scrolls), the Internet Archive's small page images for scans (the server
// fetches the rest in the background, nearest first), and posts' stable pages
// laid out as miniature text pages.
//
// Cost when closed: nothing (each listener returns on one flag). Diagnostics:
// ovTimes (ms from opening to the grid, the first picture, a full screen and
// a sharp full screen), also on window.__ov.
import { $, h, on, emit, store, keymap, registerKey, registerStepper, P } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, isFlow, scanUrl, pdfOutline } from '../docs.js';
import { renderPage, renderedNow } from '../render.js';
import { serverPrefetch } from '../prefetch.js';
import { live, flowRange } from '../flow.js';
import { goPage, go, toggleZoom } from '../nav.js';
import { profileOf, cropOf, itemAspect, spriteCell, spriteAspect } from '../profile.js';

// Pages a screen at each zoom level (the reader asked for 20-80, about 30 most often).
const LEVELS = [6, 12, 20, 30, 42, 56, 80, 120];
const GAP = 10, RGAP = 22, PADX = 18, MINI_W = 380;
// Margins trimmed from PDF thumbnails when there is no profile to say where the text is.
const TRIM = { x: 0.07, y: 0.055 }, TRIM_LAND = { x: 0.02, y: 0.02 };
const enc = encodeURIComponent;
const dpr = () => Math.min(3, window.devicePixelRatio || 1);
const clampLvl = (l) => Math.max(0, Math.min(LEVELS.length - 1, Number.isFinite(l) ? l : 3));

export const ovTimes = []; // {id, kind, n, per, cells, grid, first, full, sharp} in ms from opening

const S = {
  open: false, gen: 0, i: null, it: null, kind: null, n: 0, P: null, doc: null, sprite: false,
  a: 0.72, lvl: clampLvl(store.get('ovLevel', 3)), g: null, cells: [], st: [], secs: [], heads: [], groups: null,
  cursor: 0, hot: -1, inView: new Set(), near: new Set(), center: 0, built: false, t: null, digits: '', digitT: 0,
};

// ---------- optional modules (only those the app loaded: /features.json) ----------
const opt = {};
let optP = null, optReady = false;
function loadOpt() {
  return (optP ||= fetch('/features.json').then((r) => r.json()).catch(() => ({ js: [] })).then((f) => {
    const has = (m) => (f.js || []).includes(`js/features/${m}.js`);
    const get = (m, key) => (has(m) ? import(`./${m}.js`).then((x) => { opt[key] = x; }, () => {}) : null);
    return Promise.all([get('memory', 'memory'), get('augment', 'aug'), get('textlayer', 'tl'), get('peek', 'peek')]);
  }).then(() => { optReady = true; }));
}
// Found in idle time after boot, so opening never waits for it.
on('boot', () => (window.requestIdleCallback || setTimeout)(() => loadOpt(), { timeout: 4000 }));

// ---------- the elements ----------
const stage = $('#stage');
const root = h('div', { id: 'ov', hidden: true });
const sc = h('div', { className: 'ov-sc' });
const grid = h('div', { className: 'ov-grid' });
const hudN = h('span', { className: 'ov-n' });
const hud = h('div', { className: 'ov-hud' },
  h('button', { className: 'ghost', textContent: '−', title: 'More pages a screen (-)', onclick: () => zoomBy(1) }),
  hudN,
  h('button', { className: 'ghost', textContent: '+', title: 'Bigger pages (+)', onclick: () => zoomBy(-1) }),
  h('button', { className: 'ghost ov-x', textContent: 'Esc', title: 'Back to the spread you were on (Esc)', onclick: () => closeOv() }));
const msg = h('div', { className: 'ov-msg', hidden: true });
sc.append(grid);
root.append(sc, hud, msg);
stage.append(root);
const peekEl = h('div', { id: 'ov-peek', hidden: true }, h('div', { className: 'ovp-pg' }), h('div', { className: 'ovp-l' }));
document.body.append(peekEl);
const winEl = h('div', { className: 'tr-ovwin' });

/** Cover the pages (and the pinned strip) between the item head and the track. */
function place() {
  const sp = $('#spread'), tr = $('#track');
  const top = sp.offsetTop, bottom = tr ? tr.offsetTop : sp.offsetTop + sp.offsetHeight;
  Object.assign(root.style, { top: top + 'px', height: Math.max(80, bottom - top) + 'px' });
}

// ---------- geometry ----------
/** Rows and columns for `target` pages a screen in W x H, cells of aspect a (w/h);
 *  an item shorter than that fills the screen with all its pages. */
function geometry(W, H, a, n, target) {
  const w = W - 2 * PADX, hh = H - RGAP - 26;
  let best = null;
  for (let r = 1; r <= 30; r++) {
    const rowH = (hh - (r - 1) * RGAP) / r;
    if (rowH < 36) break;
    let ch, cw, c;
    if (n <= target) {
      // All pages on one screen, as large as they can be.
      c = Math.ceil(n / r);
      cw = Math.min((w - (c - 1) * GAP) / c, rowH * a); ch = cw / a;
      if (cw < 24) continue;
      if (!best || ch > best.ch + 0.5) best = { r, c, cw, ch, fit: true };
      continue;
    }
    ch = rowH; cw = ch * a;
    c = Math.max(1, Math.floor((w + GAP) / (cw + GAP)));
    if (cw > w) { cw = w; ch = cw / a; }
    const score = Math.abs(Math.log((r * c) / target));
    if (!best || score < best.score - 1e-9) best = { r, c, cw, ch, score, fit: false };
  }
  best ||= { r: 1, c: 1, cw: Math.min(w, hh * a), ch: Math.min(w, hh * a) / a, fit: true };
  best.cw = Math.floor(best.cw); best.ch = Math.floor(best.ch);
  return best;
}

// ---------- opening and closing ----------
export async function openOv() {
  if (S.open || state.view !== 'feed') return;
  const i = current(); if (i == null) return;
  S.open = true;
  S.t = { t0: performance.now(), id: items[i].id };
  place();
  root.hidden = false; stage.classList.add('ov-on');
  $('#track .tr-bar')?.append(winEl);
  emit('overview', { open: true });
  if (!optReady) await loadOpt();
  attachPeekOnce();
  if (S.open && current() === i) await prepare(i, items[i]);
}
/** Close; with k, read from page k. */
export function closeOv(k) {
  if (!S.open) return;
  S.open = false; S.gen++;
  root.hidden = true; stage.classList.remove('ov-on');
  io?.disconnect(); ioIn?.disconnect();
  for (const j of jobs.values()) j.cancel?.();
  jobs.clear(); want.clear(); S.inView.clear(); S.near.clear();
  hidePeek(); opt.peek?.closePeek?.(); setHot(-1); grid.classList.remove('kb');
  winEl.remove(); $('#track')?.classList.remove('ov-hover');
  const pk = $('#peek'); if (pk && pkOurs) { pk.hidden = true; pkOurs = false; }
  emit('overview', { open: false });
  if (k != null) readAt(k);
}
const toggle = () => (S.open ? closeOv() : openOv());
function readAt(k) {
  const i = current(); const it = items[i]; if (!it) return;
  if (isFlow(it)) { goPage(k); return; }
  const per = state.zoom ? 1 : Math.max(1, state.shown || state.per);
  goPage(Math.max(0, Math.min(k, (it.n || S.n) - per)));
}

/** Build (or reuse) the grid for item i and show it around the spread on screen. */
async function prepare(i, it) {
  const gen = ++S.gen;
  const kind = isFlow(it) ? 'flow' : it.kind;
  const same = S.built && S.it === it;
  if (!same) {
    S.built = false; S.it = it; S.i = i; S.kind = kind; S.groups = null; S.doc = null;
    for (const j of jobs.values()) j.cancel?.();
    jobs.clear(); want.clear(); S.inView.clear(); S.near.clear();
    grid.replaceChildren(); S.cells = []; S.heads = [];
    msg.hidden = false; msg.textContent = 'Opening…';
    try {
      let n = it.n;
      if (kind === 'flow' || (kind === 'pdf' && !n && !profileOf(it)?.n)) { S.doc = await openDoc(it); n = S.doc.n; }
      if (gen !== S.gen) return;
      S.P = kind === 'flow' ? null : profileOf(it) || null;
      n ||= S.P?.n;
      if (!n) throw new Error('no pages');
      S.n = n;
      S.sprite = !!(S.P?.assets?.sprite && spriteAspect(S.P));
      S.a = await aspectFor(it, kind);
      if (gen !== S.gen) return;
      S.secs = await sectionsOf(it, kind);
      if (gen !== S.gen) return;
      S.st = new Array(n).fill(0); // 0 nothing, 1 placeholder (sprite), 2 shown, 3 sharp
      build();
      S.built = true;
    } catch (e) {
      if (gen === S.gen) msg.textContent = 'Could not show the pages: ' + (e.message || e);
      return;
    }
  }
  S.i = i;
  msg.hidden = true;
  layout();
  paintMarks();
  const [a] = currentRange();
  S.cursor = a; paintCursor();
  scrollToK(a, 'third');
  if (kind === 'scan') prefetchScan(a);
  if (S.t && !S.t.grid) S.t.grid = Math.round(performance.now() - S.t.t0);
  observeAll();
  hudN.textContent = S.g.fit ? `all ${S.n}` : `${S.g.r * S.g.c} a screen`;
  hudN.title = `${S.n} ${kind === 'flow' ? 'stable pages (about 280 words each)' : 'pages'} · ${S.g.c} across · + − to change`;
}

/** Width / height of a cell: the sprite's cells, the profile's body box, or the page shape. */
async function aspectFor(it, kind) {
  if (kind === 'flow') return 0.72;
  if (S.sprite) return spriteAspect(S.P);
  const pa = itemAspect(S.P);
  if (pa) return pa;
  if (kind === 'scan') {
    const r = renderedNow(it, state.start.get(S.i) ?? 0)?.find((x) => x.srcW);
    return r ? r.srcW / r.srcH : 0.66;
  }
  try {
    const d = S.doc || (S.doc = await openDoc(it));
    const k = Math.min(d.n - 1, Math.max(1, state.start.get(S.i) ?? 1));
    const v = (await d.pdf.getPage(k + 1)).getViewport({ scale: 1 });
    const t = trimOf(v.width, v.height);
    return state.crop === false ? v.width / v.height : (v.width * (1 - 2 * t.x)) / (v.height * (1 - 2 * t.y));
  } catch { return 0.74; }
}
const trimOf = (w, hh) => (w > hh ? TRIM_LAND : TRIM);

// ---------- sections ----------
async function sectionsOf(it, kind) {
  let out = [];
  const a = opt.aug?.augOf?.(it);
  if (a?.sections?.length) out = a.sections.map((x) => ({ t: x.t, k: x.k, d: x.d || 0, sum: x.sum }));
  else if (S.P?.toc?.length) out = S.P.toc.filter((x) => x.k != null).map((x) => ({ t: x.t, k: x.k, d: x.d || 0 }));
  else if (kind === 'flow') out = (S.doc?.outline || []).map((x) => ({ t: x.title, k: x.page, d: x.depth }));
  else if (kind === 'pdf') {
    try {
      const d = S.doc || (S.doc = await openDoc(it));
      const ol = await Promise.race([pdfOutline(d), new Promise((r) => setTimeout(() => r(null), 250))]);
      out = (ol || []).filter((x) => x.page != null).map((x) => ({ t: x.title, k: x.page, d: x.depth }));
    } catch { /* none */ }
  }
  out = out.filter((x) => x.k >= 0 && x.k < S.n && x.t);
  const d0 = Math.min(...out.map((x) => x.d), 9);
  const seen = new Set();
  return out.map((x) => ({ ...x, d: Math.min(2, x.d - d0) })).sort((x, y) => x.k - y.k || x.d - y.d)
    .filter((x) => { const key = x.k + '|' + x.d; if (seen.has(key)) return false; seen.add(key); return true; });
}

// ---------- building ----------
function build() {
  const n = S.n, frag = document.createDocumentFragment();
  S.cells = new Array(n);
  for (let k = 0; k < n; k++) {
    const pg = h('div', { className: 'ov-pg' }, h('span', { className: 'ov-no', textContent: String(k + 1) }));
    const el = h('div', { className: 'ov-cell' }, pg);
    el.dataset.k = k;
    if (S.P?.pages?.[k]?.blank) { el.classList.add('blank'); S.st[k] = 3; }
    S.cells[k] = el;
    frag.append(el);
  }
  grid.replaceChildren(frag);
  grid.classList.toggle('flow', S.kind === 'flow');
  paintTags();
}
/** Section labels in the gap above the page where each starts. */
function paintTags() {
  grid.querySelectorAll('.ov-tag').forEach((x) => x.remove());
  const at = new Map();
  for (const s of S.secs) if (!at.has(s.k) || s.d < at.get(s.k).d) at.set(s.k, s);
  for (const [k, s] of at) {
    const el = S.cells[k]; if (!el) continue;
    el.append(h('span', { className: 'ov-tag d' + s.d, textContent: s.t, title: `${s.t} · p. ${k + 1}${s.sum ? '\n' + s.sum : ''}` }));
  }
}
/** In long items, a long top-level section starts a new row headed by its title. */
function paintHeads() {
  for (const x of S.heads) x.remove();
  S.heads = [];
  const { c, fit } = S.g;
  if (fit || S.n < 1.3 * LEVELS[S.lvl] || c < 3) return;
  const top = S.secs.filter((s) => s.d === 0);
  if (top.length < 2) return;
  top.forEach((s, j) => {
    const span = (top[j + 1]?.k ?? S.n) - s.k;
    if (s.k === 0 || span < Math.ceil(c / 2)) return;
    const el = h('div', { className: 'ov-head', title: `p. ${s.k + 1}` },
      h('b', { textContent: s.t }), h('span', { className: 'p', textContent: `p. ${s.k + 1}` }), s.sum ? h('span', { className: 's', textContent: s.sum }) : null);
    el.onclick = () => closeOv(s.k);
    S.cells[s.k].before(el); S.heads.push(el);
  });
}

function layout() {
  const W = sc.clientWidth || root.clientWidth, H = sc.clientHeight || root.clientHeight;
  const g = geometry(W, H, S.a, S.n, LEVELS[S.lvl]);
  const old = S.g;
  S.g = g;
  grid.style.cssText = `--c:${g.c};--cw:${g.cw}px;--ch:${g.ch}px;--g:${GAP}px;--rg:${RGAP}px;--fs:${(g.cw / MINI_W).toFixed(4)};--mh:${Math.round(MINI_W / S.a)}px`;
  paintHeads();
  // Pictures drawn much smaller than the new cells are drawn again.
  if (old && g.ch > old.ch * 1.3) for (let k = 0; k < S.n; k++) if (S.st[k] === 3 && S.kind !== 'flow' && !S.cells[k].classList.contains('blank')) S.st[k] = 2;
  for (let k = 0; k < S.n; k++) { const m = S.cells[k]._m; if (m) sizeMedia(k, m.a); }
}

// ---------- which cells are near the view ----------
let io = null, ioIn = null;
function observeAll() {
  io?.disconnect(); ioIn?.disconnect();
  const H = sc.clientHeight || 600;
  io = new IntersectionObserver((es) => {
    for (const e of es) { const k = Number(e.target.dataset.k); if (e.isIntersecting) { S.near.add(k); need(k); } else { S.near.delete(k); drop(k); } }
    pump();
  }, { root: sc, rootMargin: `${Math.round(H * 0.6)}px 0px` });
  ioIn = new IntersectionObserver((es) => {
    for (const e of es) { const k = Number(e.target.dataset.k); if (e.isIntersecting) S.inView.add(k); else S.inView.delete(k); }
    onView();
  }, { root: sc });
  for (const el of S.cells) { io.observe(el); ioIn.observe(el); }
}
function onView() {
  if (!S.inView.size) return;
  let lo = Infinity, hi = -1;
  for (const k of S.inView) { if (k < lo) lo = k; if (k > hi) hi = k; }
  S.center = (lo + hi) >> 1;
  S.view = [lo, hi];
  winEl.style.left = (100 * lo) / S.n + '%'; winEl.style.width = (100 * (hi - lo + 1)) / S.n + '%';
  checkFull();
  pump();
}
let lastScroll = 0, pfT = 0, progAt = 0;
/** Scroll the grid from code (the peek stays up). */
const scrollTo = (y) => { progAt = performance.now(); sc.scrollTop = y; };
sc.addEventListener('scroll', () => {
  lastScroll = performance.now();
  if (lastScroll - progAt > 150) hidePeek();
  if (S.kind === 'scan') { clearTimeout(pfT); pfT = setTimeout(() => S.open && prefetchScan(S.center), 250); }
}, { passive: true });

// ---------- the work queue: pictures for cells near the view ----------
const want = new Set();
const jobs = new Map(); // k -> {cancel}
function need(k) {
  const el = S.cells[k];
  if (!el) return;
  if (S.st[k] === 0 && S.sprite) spriteInto(k);
  if (S.st[k] < 3 && !jobs.has(k)) want.add(k);
}
function drop(k) {
  want.delete(k);
  const j = jobs.get(k);
  if (j && !S.inView.has(k)) { j.cancel?.(); jobs.delete(k); }
}
let pumpT = 0;
function pump() {
  if (pumpT || !S.open) return;
  pumpT = requestAnimationFrame(() => { pumpT = 0; run(); });
}
function run() {
  if (!S.open || !S.built) return;
  const conc = S.kind === 'pdf' ? 2 : S.kind === 'scan' ? 10 : 1;
  // pdf.js draws on the main thread: hold back while the grid is scrolling.
  if (S.kind === 'pdf' && performance.now() - lastScroll < 110) { setTimeout(pump, 120); return; }
  const list = [...want].sort((a, b) => (S.inView.has(b) - S.inView.has(a)) || Math.abs(a - S.center) - Math.abs(b - S.center));
  if (S.kind === 'flow') {
    // Miniature text pages: as many as fit in 8 ms of each frame.
    const t0 = performance.now();
    for (const k of list) { if (performance.now() - t0 > 8) break; want.delete(k); flowInto(k); }
    if (want.size) pump();
    return;
  }
  for (const k of list) {
    if (jobs.size >= conc) break;
    want.delete(k);
    const job = { k, gen: S.gen, dead: false, cancel: null };
    jobs.set(k, job);
    const p = S.kind === 'pdf' ? pdfInto(k, job) : scanInto(k, job);
    p.catch(() => false).then((ok) => {
      if (jobs.get(k) === job) jobs.delete(k);
      if (!ok && !job.dead && S.st[k] < 2) S.cells[k]?.classList.add('err');
      pump();
    });
  }
}

/** Show a picture (a canvas or an image, aspect a) in cell k. */
function show(k, node, a, sharp = true) {
  const el = S.cells[k]; if (!el) return;
  const pg = el.querySelector('.ov-pg');
  pg.querySelector('.ov-m')?.remove();
  node.classList.add('ov-m');
  pg.prepend(node);
  pg.style.backgroundImage = ''; el.classList.remove('err', 'spr');
  el._m = { a };
  sizeMedia(k, a);
  el.classList.add('ld');
  S.st[k] = sharp ? 3 : Math.max(S.st[k], 2);
  if (S.t && !S.t.first) S.t.first = Math.round(performance.now() - S.t.t0);
  checkFull();
}
/** The page box takes the picture's own shape, centred in the cell. */
function sizeMedia(k, a) {
  const pg = S.cells[k]?.querySelector('.ov-pg'); if (!pg || !S.g) return;
  let w = S.g.cw, hh = w / a;
  if (hh > S.g.ch) { hh = S.g.ch; w = hh * a; }
  pg.style.width = Math.floor(w) + 'px'; pg.style.height = Math.floor(hh) + 'px';
}
function checkFull() {
  const t = S.t; if (!t || (t.full && t.sharp) || !S.inView.size) return;
  let all = true, sharp = true;
  for (const k of S.inView) { if (S.st[k] < 2 && S.st[k] !== 1) all = false; if (S.st[k] < 3) sharp = false; }
  const ms = Math.round(performance.now() - t.t0);
  if (all && !t.full) t.full = ms;
  if (sharp && !t.sharp) {
    t.sharp = ms;
    ovTimes.push({ id: t.id, kind: S.kind, n: S.n, per: S.g.fit ? S.n : S.g.r * S.g.c, cells: S.inView.size, grid: t.grid, first: t.first, full: t.full, sharp: t.sharp });
    if (ovTimes.length > 50) ovTimes.shift();
    S.t = null;
  }
}

// The profile's sprite: every page in one small image, drawn at once.
function spriteInto(k) {
  const el = S.cells[k];
  const cell = spriteCell(S.P, k, S.g.ch);
  if (!cell) return;
  const pg = el.querySelector('.ov-pg');
  Object.assign(pg.style, cell, { width: S.g.cw + 'px', height: S.g.ch + 'px' });
  el.classList.add('ld', 'spr');
  S.st[k] = 1;
  if (S.t && !S.t.first) S.t.first = Math.round(performance.now() - S.t.t0);
  // Sharp enough as it is when the cell is about the sprite's size.
  if (S.g.ch * dpr() <= S.P.assets.sprite.ch * 1.35) S.st[k] = 3;
}

/** The region of PDF page k to show: the profile's crop, else a margin trim. */
function boxOf(k, w, hh) {
  if (state.crop === false) return { x0: 0, y0: 0, x1: 1, y1: 1 };
  const c = S.P && cropOf(S.P, k);
  if (c) return c;
  const t = trimOf(w, hh);
  return { x0: t.x, y0: t.y, x1: 1 - t.x, y1: 1 - t.y };
}
async function pdfInto(k, job) {
  const it = S.it;
  // A page the feed already rendered (with the profile's crop, so it matches its neighbours).
  if (S.P) {
    const r = renderedNow(it, k);
    const pnl = r?.length === 1 && r[0].canvas ? r[0] : null;
    if (pnl) { const c = scaled(pnl.canvas, S.g.ch * dpr()); show(k, c, c.width / c.height); return true; }
  }
  const d = S.doc || (S.doc = await openDoc(it));
  if (job.dead || job.gen !== S.gen) return false;
  const page = await d.pdf.getPage(k + 1);
  if (job.dead || job.gen !== S.gen) return false;
  const v0 = page.getViewport({ scale: 1 });
  const b = boxOf(k, v0.width, v0.height);
  const bw = (b.x1 - b.x0) * v0.width, bh = (b.y1 - b.y0) * v0.height;
  const a = bw / bh;
  const H = Math.min(1100, Math.ceil(Math.min(S.g.ch, S.g.cw / a) * dpr()));
  const scale = H / bh;
  const vp = page.getViewport({ scale, offsetX: -b.x0 * v0.width * scale, offsetY: -b.y0 * v0.height * scale });
  const c = h('canvas', { width: Math.max(1, Math.round(bw * scale)), height: Math.max(1, Math.round(bh * scale)) });
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  const task = page.render({ canvasContext: g, viewport: vp });
  job.cancel = () => { job.dead = true; task.cancel(); };
  try { await task.promise; } catch (e) { if (job.dead) return false; throw e; }
  if (job.dead || job.gen !== S.gen) return false;
  show(k, c, a);
  return true;
}
/** A canvas copy scaled to about H px tall. */
function scaled(src, H) {
  const s = Math.min(1, H / src.height);
  const c = h('canvas', { width: Math.max(1, Math.round(src.width * s)), height: Math.max(1, Math.round(src.height * s)) });
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// Scans: the Internet Archive's page images, at the width the cell needs
// (200 or 400 px wide: the sizes the track and the feed's placeholders use, so
// they are often cached already).
const scanW = () => (S.g.cw * dpr() <= 230 ? 200 : 400);
function scanInto(k, job) {
  return new Promise((resolve) => {
    const im = new Image();
    im.decoding = 'async'; im.alt = '';
    job.cancel = () => { job.dead = true; im.src = ''; resolve(false); };
    im.onload = () => {
      if (job.dead || job.gen !== S.gen) return resolve(false);
      im.decode().catch(() => {}).then(() => {
        if (job.dead || job.gen !== S.gen) return resolve(false);
        const b = S.P && state.crop !== false ? cropOf(S.P, k) : null;
        if (b) {
          const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
          const box = h('div', { className: 'ov-crop' }, im);
          im.style.cssText = `width:${(100 / bw).toFixed(3)}%;height:${(100 / bh).toFixed(3)}%;left:${((-100 * b.x0) / bw).toFixed(3)}%;top:${((-100 * b.y0) / bh).toFixed(3)}%`;
          show(k, box, (bw * im.naturalWidth) / (bh * im.naturalHeight));
        } else show(k, im, im.naturalWidth / im.naturalHeight);
        resolve(true);
      });
    };
    im.onerror = () => resolve(false);
    im.src = P(scanUrl(S.it, k, scanW()));
  });
}
/** The server fetches the item's small page images, nearest the view first. */
function prefetchScan(at) {
  const it = S.it, n = Math.min(S.n, 1500), w = scanW();
  const ks = Array.from({ length: n }, (_, k) => k).sort((a, b) => Math.abs(a - at) - Math.abs(b - at)).slice(0, 600);
  serverPrefetch(ks.map((k) => scanUrl(it, k, w)), 52, 'overview');
}

// Posts: each stable page (about 280 words) as a miniature page of text.
function groupsOf() {
  if (S.groups) return S.groups;
  const t = document.createElement('template');
  t.innerHTML = S.doc.html;
  const gs = Array.from({ length: S.n }, () => []);
  const title = t.content.querySelector('.flow-title');
  if (title) gs[0].push(title);
  for (const b of t.content.querySelectorAll('[data-vp]')) {
    const v = Number(b.dataset.vp);
    if (v >= 0 && v < S.n) gs[v].push(b);
  }
  for (const g of gs) for (const b of g) {
    b.querySelectorAll?.('iframe, video, audio, object, embed').forEach((x) => x.replaceWith(h('div', { className: 'ov-embed', textContent: '▶' })));
    for (const im of b.tagName === 'IMG' ? [b] : b.querySelectorAll?.('img') || []) { im.loading = 'lazy'; im.decoding = 'async'; }
    b.removeAttribute?.('id'); b.querySelectorAll?.('[id]').forEach((x) => x.removeAttribute('id'));
  }
  return (S.groups = gs);
}
function flowInto(k) {
  const el = S.cells[k]; if (!el || S.st[k] >= 3) return;
  const mini = h('div', { className: 'ov-mini' });
  for (const b of groupsOf()[k]) mini.append(b.cloneNode(true));
  const pg = el.querySelector('.ov-pg');
  pg.prepend(mini);
  el.classList.add('ld');
  S.st[k] = 3;
  if (S.t && !S.t.first) S.t.first = Math.round(performance.now() - S.t.t0);
  checkFull();
}

// ---------- marks ----------
function currentRange() {
  const i = S.i, it = S.it;
  const s = state.start.get(i) ?? 0;
  if (S.kind === 'flow') return live?.id === it.id ? flowRange(s) : [0, 0];
  const c = state.zoom ? 1 : Math.max(1, state.shown || state.per);
  return [s, Math.min(S.n - 1, s + c - 1)];
}
function inRanges(rs, k) { for (const [a, b] of rs || []) if (k >= a && k <= b) return true; return false; }
function paintMarks() {
  if (!S.built) return;
  const it = S.it, [a, b] = currentRange();
  const seen = opt.memory?.memoryOf?.(it.id)?.seen || [];
  const kp = new Set((state.marks?.get(it.id) || []).map((p) => p - 1));
  const aug = opt.aug?.augOf?.(it);
  const skips = (aug?.skip || []).map((x) => [x.a, x.b]);
  const figs = new Set((aug?.figs || []).map((f) => f.k));
  const tl = opt.tl?.printedLabel;
  grid.querySelectorAll('.ov-stop').forEach((x) => x.remove());
  for (let k = 0; k < S.n; k++) {
    const el = S.cells[k], cl = el.classList;
    cl.toggle('cur', k >= a && k <= b);
    cl.toggle('seen', inRanges(seen, k));
    cl.toggle('kp', kp.has(k));
    cl.toggle('skip', inRanges(skips, k));
    const pf = S.P?.pages?.[k];
    cl.toggle('fig', !!pf?.fig?.length || figs.has(k));
    const lab = pf?.lab || (tl && S.kind === 'scan' ? tl(it, k) : null);
    el.dataset.info = `${lab && lab !== String(k + 1) ? ` (printed ${lab})` : ''}${pf?.fig?.length ? ' · ' + pf.fig.map((f) => f.lab || f.kind).join(', ') : ''}`;
  }
  (aug?.plan || []).forEach((st, j) => {
    const el = S.cells[st.k]?.querySelector('.ov-pg'); if (!el) return;
    el.append(h('span', { className: 'ov-stop', textContent: String(j + 1), title: `Reading guide stop ${j + 1}: ${st.why || ''}` }));
  });
  for (const [x, y] of skips) for (let k = Math.max(0, x); k <= y && k < S.n; k++) S.cells[k].dataset.info += ' · skippable (reading guide)';
}
function paintCursor() {
  grid.querySelector('.ov-cell.kc')?.classList.remove('kc');
  S.cells[S.cursor]?.classList.add('kc');
}

// ---------- scrolling and zoom ----------
function scrollToK(k, how = 'nearest') {
  const el = S.cells[k]; if (!el) return;
  const top = el.offsetTop - RGAP, bottom = el.offsetTop + el.offsetHeight + 6;
  if (how === 'third') { scrollTo(Math.max(0, top - Math.max(0, (sc.clientHeight - el.offsetHeight) / 3))); return; }
  if (how === 'center') { scrollTo(Math.max(0, el.offsetTop - (sc.clientHeight - el.offsetHeight) / 2)); return; }
  if (top < sc.scrollTop) scrollTo(top);
  else if (bottom > sc.scrollTop + sc.clientHeight) scrollTo(bottom - sc.clientHeight);
}
/** Change the level by d (+1 more pages, -1 bigger pages), keeping the page under the pointer (or the cursor) in place. */
function zoomBy(d, anchorK) {
  const l = clampLvl(S.lvl + d);
  if (l === S.lvl || !S.built) return;
  const k = anchorK ?? (S.hot >= 0 ? S.hot : S.inView.has(S.cursor) ? S.cursor : S.view?.[0] ?? S.cursor);
  const el = S.cells[k];
  const off = el ? el.offsetTop - sc.scrollTop : 0;
  S.lvl = l; store.set('ovLevel', l);
  hidePeek();
  layout();
  if (el) scrollTo(Math.max(0, el.offsetTop - off));
  hudN.textContent = S.g.fit ? `all ${S.n}` : `${S.g.r * S.g.c} a screen`;
  hud.classList.remove('bump'); void hud.offsetWidth; hud.classList.add('bump');
  observeAll();
}
// Pinch (ctrl+wheel) zooms the grid; plain wheel scrolls it natively (never the feed's steps).
let pinchAcc = 0, pinchAt = 0, pinchSteps = 0;
root.addEventListener('wheel', (e) => {
  e.stopPropagation();
  if (!e.ctrlKey) return;
  e.preventDefault();
  const now = performance.now();
  if (now - pinchAt > 300) { pinchAcc = 0; pinchSteps = 0; }
  pinchAt = now;
  pinchAcc += e.deltaMode ? e.deltaY * 30 : e.deltaY;
  // One level as a pinch starts; a long pinch goes on, a level per further stretch.
  if (Math.abs(pinchAcc) < (pinchSteps ? 140 : 24)) return;
  const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.ov-cell');
  zoomBy(pinchAcc > 0 ? 1 : -1, cell ? Number(cell.dataset.k) : undefined);
  pinchAcc = 0; pinchSteps++;
}, { passive: false });

// ---------- hover: enlarge, and the page's place on the track ----------
let peekT = 0, lastXY = '', pkOurs = false, peekK = -1;
grid.addEventListener('pointermove', (e) => {
  const xy = e.clientX + ',' + e.clientY;
  if (xy === lastXY) return; // the grid scrolled under a still pointer
  lastXY = xy;
  const cell = e.target.closest('.ov-cell');
  const k = cell ? Number(cell.dataset.k) : -1;
  if (k === S.hot) return;
  setHot(k);
  if (opt.peek?.attachPeek) return; // peek.js handles enlarging
  clearTimeout(peekT);
  if (k < 0) { peekT = setTimeout(hidePeek, 150); return; }
  if (!peekEl.hidden) showPeek(k, e.clientX);
  else peekT = setTimeout(() => S.hot === k && showPeek(k, e.clientX), 110);
});
grid.addEventListener('pointerleave', () => { clearTimeout(peekT); setHot(-1); peekT = setTimeout(hidePeek, 120); lastXY = ''; });
grid.addEventListener('click', (e) => {
  const cell = e.target.closest('.ov-cell'); if (!cell) return;
  closeOv(Number(cell.dataset.k));
});
function setHot(k) {
  if (S.hot >= 0) S.cells[S.hot]?.classList.remove('hot');
  S.hot = k;
  if (k >= 0) S.cells[k]?.classList.add('hot');
  const tr = $('#track');
  if (!tr) return;
  tr.classList.toggle('ov-hover', k >= 0);
  if (k >= 0) tr.querySelector('.tr-hover').style.left = (100 * (k + 0.5)) / S.n + '%';
}

/** Fill `body` (W x H px) with page k: the cell's picture at once, then a sharp one; `cap` adds a caption line. */
function fillPeek(body, k, W, H, cap = false) {
  const el = S.cells[k]; if (!el) return;
  const a = el._m?.a || S.a;
  if (cap) H -= 24;
  let w = W, hh = w / a;
  if (hh > H) { hh = H; w = hh * a; }
  const pg = h('div', { className: 'ovp-page' });
  Object.assign(pg.style, { width: Math.floor(w) + 'px', height: Math.floor(hh) + 'px' });
  const wrap = h('div', { className: 'ovp-wrap' }, cap ? h('div', { className: 'ovp-cap', textContent: captionOf(k) }) : null, pg);
  body.replaceChildren(wrap);
  const gen = S.gen;
  const fresh = () => S.open && S.gen === gen && pg.isConnected;
  if (S.kind === 'flow') {
    const t = h('div', { className: 'ovp-text' });
    for (const b of groupsOf()[k] || []) t.append(b.cloneNode(true));
    pg.append(t);
    return;
  }
  const m = el.querySelector('.ov-m');
  if (m?.tagName === 'CANVAS') pg.append(scaled(m, m.height));
  else if (m) pg.append(m.cloneNode(true));
  else if (el.classList.contains('spr')) { const cell = spriteCell(S.P, k, hh); if (cell) Object.assign(pg.style, cell); }
  if (el.classList.contains('blank')) return;
  // The sharp picture only once the pointer rests on the page.
  setTimeout(() => { if (fresh()) sharpPeek(pg, k, W, H, hh, fresh); }, 140);
}
function sharpPeek(pg, k, W, H, hh, fresh) {
  const it = S.it;
  if (S.kind === 'scan') {
    const im = new Image(); im.decoding = 'async'; im.alt = '';
    im.src = P(scanUrl(it, k, 1000));
    im.decode().then(() => {
      if (!fresh()) return;
      const b = S.P && state.crop !== false ? cropOf(S.P, k) : null;
      if (b) {
        const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
        im.style.cssText = `position:absolute;max-width:none;width:${(100 / bw).toFixed(3)}%;height:${(100 / bh).toFixed(3)}%;left:${((-100 * b.x0) / bw).toFixed(3)}%;top:${((-100 * b.y0) / bh).toFixed(3)}%`;
      }
      pg.replaceChildren(im);
    }, () => {});
    return;
  }
  // PDFs: the feed's own render of the page (kept, so a click shows it at once).
  renderPage(it, k).then((panels) => {
    if (!fresh()) return;
    const cs = (panels || []).filter((x) => x.canvas);
    if (!cs.length) return;
    const row = h('div', { className: 'ovp-row' }, ...cs.map((x) => scaled(x.canvas, hh * dpr())));
    const ra = cs.reduce((s, x) => s + x.canvas.width / x.canvas.height, 0);
    let w2 = W, h2 = w2 / ra; if (h2 > H) { h2 = H; w2 = h2 * ra; }
    Object.assign(pg.style, { width: Math.floor(w2) + 'px', height: Math.floor(h2) + 'px', backgroundImage: '' });
    pg.replaceChildren(row);
  }, () => {});
}
/** The built-in enlarge: over the half of the stage away from the page. */
function showPeek(k, x) {
  const R = root.getBoundingClientRect();
  const el = S.cells[k]; if (!el) return;
  const cr = el.getBoundingClientRect();
  const a = el._m?.a || S.a;
  let H = R.height - 28, W = H * a;
  const maxW = R.width / 2 - 28;
  if (W > maxW) { W = maxW; H = W / a; }
  const cx = cr.left + cr.width / 2;
  let side = peekEl.dataset.side || (x < R.left + R.width / 2 ? 'r' : 'l');
  const left = (s) => (s === 'r' ? R.right - W - 14 : R.left + 14);
  // Never over the page it shows.
  if (cx > left(side) - 10 && cx < left(side) + W + 10) side = side === 'r' ? 'l' : 'r';
  peekEl.dataset.side = side;
  Object.assign(peekEl.style, { left: left(side) + 'px', top: R.top + (R.height - H) / 2 + 'px', width: W + 'px', height: H + 'px' });
  peekEl.hidden = false;
  if (peekK === k) return;
  peekK = k;
  fillPeek(peekEl.querySelector('.ovp-pg'), k, W, H);
  peekEl.querySelector('.ovp-l').textContent = captionOf(k);
}
function captionOf(k) {
  const sec = [...S.secs].reverse().find((s) => s.k <= k);
  return `p. ${k + 1}${S.cells[k]?.dataset.info || ''} of ${S.n}${sec ? ' · ' + sec.t : ''}`;
}
/** peek.js compares cards by identity: one per cell. */
const cardOf = (el) => (S.open && el?.isConnected ? (el._card ||= { k: Number(el.dataset.k), ov: true }) : null);
function hidePeek() { clearTimeout(peekT); peekEl.hidden = true; delete peekEl.dataset.side; peekK = -1; }
let peekAttached = false;
function attachPeekOnce() {
  if (peekAttached || !opt.peek?.attachPeek) return;
  peekAttached = true;
  try {
    opt.peek.attachPeek(grid, {
      selector: '.ov-cell', delay: 120,
      cardOf,
      render: (card, body, ctx) => fillPeek(body, card.k, ctx.width - 44, ctx.height - 48, true),
    });
  } catch (e) { console.warn('overview: peek.js', e); delete opt.peek; }
}

// ---------- the track is the grid's minimap while it is open ----------
// Its handlers in feed.js would scrub the hidden spread; these take its events first.
function trackEvt(e) {
  if (!S.open || !S.built) return;
  const tr = e.target.closest?.('#track'); if (!tr) return;
  e.stopPropagation();
  const pk = $('#peek');
  if (e.type === 'pointerleave' || e.type === 'pointerout') {
    if (e.type === 'pointerleave' && e.target === tr) { if (pk && pkOurs) { pk.hidden = true; pkOurs = false; } setHot(-1); hidePeek(); opt.peek?.closePeek?.(); tr.classList.remove('ov-hover'); }
    return;
  }
  const r = tr.getBoundingClientRect();
  const f = Math.min(0.9999, Math.max(0, (e.clientX - r.left) / r.width));
  const k = Math.floor(f * S.n);
  if (e.type === 'click') { closeOv(k); return; }
  if (e.type !== 'pointermove') return;
  if (pk) {
    pk.classList.add('textonly'); pk.hidden = false; pkOurs = true;
    pk.querySelector('.pk-label').textContent = `p. ${k + 1} / ${S.n}`;
    pk.style.left = Math.min(innerWidth - 140, Math.max(8, e.clientX - 60)) + 'px';
    pk.style.top = r.top - 30 + 'px';
  }
  if (k !== S.hot) {
    setHot(k);
    scrollToK(k, S.inView.has(k) ? 'nearest' : 'center');
    if (peekAttached) opt.peek.showPeek(grid, cardOf(S.cells[k]), S.cells[k]);
    else showPeek(k, S.cells[k].getBoundingClientRect().left);
  }
  tr.querySelector('.tr-hover').style.left = f * 100 + '%';
}
for (const type of ['pointerenter', 'pointermove', 'pointerleave', 'pointerout', 'pointerover', 'pointerdown', 'click']) stage.addEventListener(type, trackEvt, true);

// ---------- keys ----------
// The registry holds one binding per key and the feed owns the arrows, Enter,
// + and -, so while the grid is open its keys are taken first (as the wall does).
function moveCursor(key) {
  const c = S.g.c;
  let k = S.cursor;
  if (key === 'ArrowRight') k++;
  else if (key === 'ArrowLeft') k--;
  else {
    // The page above or below: the nearest by position (section rows break the columns).
    const el = S.cells[k], x = el.offsetLeft, dir = key === 'ArrowDown' ? 1 : -1;
    let best = null;
    for (let j = k + dir; j >= 0 && j < S.n && Math.abs(j - k) <= 2 * c + 1; j += dir) {
      const o = S.cells[j];
      if (o.offsetTop === el.offsetTop) continue;
      if (best && o.offsetTop !== best.offsetTop) break;
      if (!best || Math.abs(o.offsetLeft - x) < Math.abs(best.offsetLeft - x)) best = o;
    }
    k = best ? Number(best.dataset.k) : k + dir * c;
  }
  S.cursor = Math.max(0, Math.min(S.n - 1, k));
  grid.classList.add('kb');
  paintCursor();
  scrollToK(S.cursor);
}
function typeDigit(d) {
  clearTimeout(S.digitT);
  S.digits = (S.digits + d).replace(/^0+/, '').slice(0, 5);
  const v = Number(S.digits);
  if (v >= 1) { S.cursor = Math.min(S.n, v) - 1; grid.classList.add('kb'); paintCursor(); scrollToK(S.cursor, 'center'); }
  hudN.textContent = `p. ${S.digits || '…'} ↵`;
  S.digitT = setTimeout(() => { S.digits = ''; hudN.textContent = S.g.fit ? `all ${S.n}` : `${S.g.r * S.g.c} a screen`; }, 2000);
}
addEventListener('keydown', (e) => {
  if (!S.open || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  if (!$('#keys')?.hidden || ($('#search') && !$('#search').hidden)) return;
  const k = e.key;
  let done = true;
  if (k === 'Escape' || k === 'O') { if (!e.repeat) closeOv(); }
  else if (!S.built) done = false;
  else if (k === '+' || k === '=') zoomBy(-1);
  else if (k === '-' || k === '_') zoomBy(1);
  else if (/^Arrow/.test(k)) moveCursor(k);
  else if (k === 'Enter') { if (!e.repeat) closeOv(S.cursor); }
  else if (k === 'z' && S.kind !== 'flow') { if (!e.repeat) { const c = S.cursor; closeOv(); toggleZoom(true, c); } }
  else if (k === 'Home') { S.cursor = 0; paintCursor(); scrollTo(0); }
  else if (k === 'End') { S.cursor = S.n - 1; paintCursor(); scrollTo(sc.scrollHeight); }
  else if (/^[0-9]$/.test(k)) typeDigit(k);
  else done = false;
  if (done) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
// Advance scrolls a screen, then (on a fresh press) the next item's pages; Back returns to the spread.
registerStepper((dir, e) => {
  if (!S.open || state.view !== 'feed') return false;
  if (dir > 0) {
    const room = sc.scrollHeight - sc.clientHeight - sc.scrollTop;
    if (room > 8) { sc.scrollTop += Math.min(room, Math.round(sc.clientHeight * 0.88)); return true; }
    if (e?.repeat || e?.fresh === false) return true;
    if (state.pos < state.order.length - 1) go(state.pos + 1);
    return true;
  }
  if ((e?.key === 'PageUp' || (e?.key === ' ' && e.shiftKey)) && sc.scrollTop > 8) { sc.scrollTop -= Math.round(sc.clientHeight * 0.88); return true; }
  closeOv();
  return true;
}, 3);
if (!keymap.has('O')) registerKey('O', toggle, { help: ['O', 'all pages of this item at once: hover to enlarge, click to read there, + − size, Esc returns'], order: 13 });
else console.warn('overview: O is taken; open the page overview from the position line');
// The position line ("pp. 4–6 of 30") opens it too.
$('#item-head')?.addEventListener('click', (e) => { if (e.target.closest?.('#pos') && state.view === 'feed') toggle(); });

// ---------- following the feed ----------
on('item:shown', ({ i, it }) => { if (S.open) { hidePeek(); prepare(i, it); } });
on('spread:rendered', ({ i }) => {
  if (!S.open || !S.built || items[i] !== S.it) return;
  paintMarks();
  const [a] = currentRange();
  if (!S.inView.has(a)) scrollToK(a, 'nearest');
});
on('view:changed', ({ view }) => { if (view !== 'feed') closeOv(); });
for (const ev of ['memory:updated', 'summary:updated']) on(ev, () => { if (S.open) paintMarks(); });
on('augment:updated', ({ id }) => {
  if (!S.open || S.it?.id !== id) return;
  sectionsOf(S.it, S.kind).then((x) => { if (S.open && S.it?.id === id) { S.secs = x; paintTags(); paintMarks(); } });
});
// A sprite or crop that arrives while the grid is open: cells not drawn yet use it.
on('profile:updated', ({ id }) => {
  if (!S.open || S.kind === 'flow' || S.it?.id !== id) return;
  const Pn = profileOf(S.it);
  if (!Pn || S.sprite || !Pn.assets?.sprite || Math.abs(spriteAspect(Pn) - S.a) > 0.04) return;
  S.P = Pn; S.sprite = true;
  for (const k of S.near) if (S.st[k] === 0) spriteInto(k);
});
// The window, the side panel (i) or the pinned strip (p) changed the stage.
let rzT = 0, rzW = 0, rzH = 0;
new ResizeObserver(() => {
  if (!S.open) return;
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    if (!S.open || !S.built) return;
    place();
    if (sc.clientWidth === rzW && sc.clientHeight === rzH) return;
    rzW = sc.clientWidth; rzH = sc.clientHeight;
    const k = S.view?.[0] ?? S.cursor;
    layout(); scrollToK(k, 'third'); observeAll();
  }, 150);
}).observe(stage);

window.__ov = { times: ovTimes, open: openOv, close: closeOv, state: () => ({ open: S.open, kind: S.kind, n: S.n, lvl: S.lvl, per: LEVELS[S.lvl], g: S.g, inView: S.inView.size, jobs: jobs.size, want: want.size, sprite: S.sprite, a: S.a, secs: S.secs.length }) };
