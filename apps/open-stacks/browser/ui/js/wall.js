// The wall: the queue laid out like a bookshop table. Every item gets a cover
// that suits it (book covers with library labels, typeset title pages for
// papers, post cards with lead images and opening lines, cloth bindings for
// texts). A depth slider moves every visible tile through its pages at once;
// hovering a tile scrubs it like a video thumbnail; contact sheets show pages
// from across each item. Heavy work (page images, pdf.js renders, post text)
// happens only for tiles near the viewport, nearest first, and is dropped as
// soon as it is no longer wanted.
import { $, h, P, PI, on, store, lru, fmtDate, registerView, registerKey, keyHelp, evictCanvas } from './util.js';
import { items, LANES, LANE_COLORS, laneMax } from './corpus.js';
import { itemIcon } from './icons.js';
import { state } from './state.js';
import { openDoc, peekDoc, isFlow, scanUrl, pdfjs, extractors, prepareFlow } from './docs.js';
import { setView } from './chrome.js';
import { showFeed } from './feed.js';
import { goPage } from './nav.js';
import { summaries } from './summary.js';

// ---------- settings ----------
const SIZES = [130, 160, 200, 250, 310, 380]; // tile widths (px), - and + step through them
const STEP = 0.05;                              // , and . move the depth by 5%
// pc: paper covers, 'figure' (the paper's top figure, below) or 'page' (the typeset title page).
const W = { size: 2, sheet: false, f: 0, pc: 'figure', ...store.get('wall', {}) };
const saveW = () => store.set('wall', { size: W.size, sheet: W.sheet, f: W.f, pc: W.pc });
const DPR = Math.min(2, window.devicePixelRatio || 1);
const STALE = new Error('stale');
// Where the time goes (wallStats().perf): [count, total ms] per kind of work.
const perf = { fetch: [0, 0], open: [0, 0], render: [0, 0], digest: [0, 0], figDecode: [0, 0], figBake: [0, 0] };
const timed = async (k, p) => { const t = performance.now(); try { return await p; } finally { perf[k][0]++; perf[k][1] += performance.now() - t; } };

// Small per-item facts kept between sessions so covers come up complete at
// once: page counts, and for posts the lead image and opening lines.
const META = store.get('wallMeta', {});
let metaT = null;
function setMeta(id, m) {
  META[id] = { ...META[id], ...m };
  clearTimeout(metaT);
  metaT = setTimeout(() => {
    const keys = Object.keys(META);
    for (const k of keys.slice(0, Math.max(0, keys.length - 900))) delete META[k];
    store.set('wallMeta', META);
  }, 1500);
}

// ---------- item helpers ----------
const hash = (s) => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return x >>> 0; };
const iaOf = (it) => it.ia || (/archive\.org\/download\/([^/]+)\//.exec(it.url || '') || [])[1] || null;
const isPost = (it) => it.kind === 'html' && /lesswrong|alignmentforum|effectivealtruism/.test(it.url || it.page || '');
/** What kind of cover an item gets: book (cover scan), paper, post or cloth (a bound text). */
function kindOf(it) {
  if (it.kind === 'scan' || (it.kind === 'pdf' && iaOf(it))) return 'book';
  if (it.kind === 'pdf') return 'paper';
  return isPost(it) || it.cover ? 'post' : 'cloth'; // it.cover: a Local bundle's cover picture (docs/authoring.md)
}
const nOf = (it) => digested(it)?.n || it.n || META[it.id]?.n || 0;
/** Can this tile show pages right now? Posts need their text in memory; PDFs and scans only a page count. */
const canShow = (it) => (isFlow(it) ? !!digested(it) : !!nOf(it));
/** "Houston, Edwin James, 1847-1914. [from old catalog]" -> "Edwin James Houston". */
function cleanAu(a) {
  let s = String(a || '').split(/\s*;\s*/)[0].replace(/\s*[([][^)\]]*[)\]]/g, '')
    .replace(/,?\s*(?:b\.|d\.|fl\.|ca\.)?\s*\d{3,4}\??(?:\s*-\s*\d{0,4}\??)?\.?\s*$/, '').replace(/[,;]\s*$/, '').trim();
  const m = /^([A-Z][\p{L}'’-]+), ((?:[A-Z][\p{L}'’.-]*\.?\s?){1,3})$/u.exec(s); // "Last, First M." (a person, not a firm)
  if (m) s = `${m[2].trim().replace(/\b([A-Z])(?![\p{L}.])/gu, '$1.')} ${m[1]}`;
  return s;
}
const tsize = (t) => { const n = t.length; return n <= 16 ? 't-xl' : n <= 30 ? 't-l' : n <= 54 ? 't-m' : n <= 84 ? 't-s' : 't-xs'; };
const minutes = (it) => (it.words ? Math.max(1, Math.round(it.words / 230)) : 0);
const karma = (it) => (it.score ? Math.min(1, Math.log1p(it.score) / Math.log1p(laneMax[it.lane] || it.score)) : 0);
const subject = (it) => (/shelved under "([^"]+)"/.exec(it.why || '') || [])[1] || '';
/** The page at fraction f of an item with n pages. */
const kAt = (n, f) => Math.max(0, Math.min(n - 1, Math.round(f * (n - 1))));

// Featured posts (the top eighth of their lane by karma) span two columns.
const pct = new Map();
function topShare(it) {
  if (!pct.has(it.lane)) {
    const s = items.filter((x) => x.lane === it.lane && isPost(x)).map((x) => x.score || 0).sort((a, b) => b - a);
    pct.set(it.lane, s);
  }
  const s = pct.get(it.lane);
  return s.length ? s.indexOf(it.score || 0) / s.length : 1;
}

// ---------- a work queue: nearest tile first, stale work dropped ----------
class Queue {
  constructor(max) { this.max = max; this.jobs = []; this.running = new Set(); }
  /** level 0 is wanted now; higher levels (prefetching) run only when nothing lower is waiting. */
  add(key, T, fn, alive = () => T.vis, level = 0) {
    const dup = this.jobs.find((j) => j.key === key) || [...this.running].find((j) => j.key === key);
    if (dup) return dup.promise;
    let res, rej;
    const promise = new Promise((a, b) => { res = a; rej = b; });
    promise.catch(() => {});
    this.jobs.push({ key, T, fn, alive, level, promise, res, rej });
    this.pump();
    return promise;
  }
  pump() {
    while (this.running.size < this.max && this.jobs.length) {
      this.jobs = this.jobs.filter((j) => j.alive() || (j.rej(STALE), false));
      if (!this.jobs.length) return;
      // Nearest the middle of the screen first (by position in the grid, so no layout is forced).
      const mid = centre();
      let best = 0, bd = Infinity;
      this.jobs.forEach((j, x) => { const d = j.level * 1e6 + Math.abs(j.T.idx - mid); if (d < bd) { bd = d; best = x; } });
      const job = this.jobs.splice(best, 1)[0];
      this.running.add(job);
      Promise.resolve().then(() => job.fn(job)).then(job.res, job.rej).finally(() => { this.running.delete(job); this.pump(); });
    }
  }
  /** Drop queued jobs nobody wants; cancel running renders nobody wants. */
  sweep() {
    this.jobs = this.jobs.filter((j) => j.alive() || (j.rej(STALE), false));
    for (const j of this.running) if (!j.alive()) j.cancel?.();
  }
  clear() { for (const j of this.jobs) j.rej(STALE); this.jobs = []; for (const j of this.running) j.cancel?.(); }
}
/** Index of the tile in the middle of the screen, refreshed on scroll. */
let mid = null;
function centre() {
  if (mid == null) {
    const r = wallEl.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest?.('#grid .tile');
    mid = byEl.get(el)?.idx ?? tiles.find((T) => T.vis)?.idx ?? 0;
  }
  return mid;
}
const netQ = new Queue(5); // post text and pdf downloads
const cpuQ = new Queue(2); // pdf.js renders (partly on the main thread): two at a time keeps scrolling smooth

function serverPrefetch(urls, pri, group) {
  fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls, pri, group }) }).catch(() => {});
}

// ---------- posts and texts: a digest of the text, page by page ----------
const digests = new Map();
const digested = (it) => digests.get(it.id)?.done;
async function fetchFlow(it) {
  const r = await fetch(P(it.url));
  if (!r.ok) throw new Error('fetch ' + r.status);
  const backup = r.clone();
  let html;
  try { html = await (extractors[it.kind] || extractors.web)(it, r); } catch { html = await extractors.web(it, backup); }
  return prepareFlow(it, html);
}
// Opening lines that are housekeeping, not the piece: asides in brackets, crosspost notes, status lines.
const SKIP = /^([([]|(epistemic|confidence) status|cross-?post|this (post|essay|piece) (was|is) (cross|also|originally)|this is a (cross-?post|linkpost)|thanks to|acknowledg|edit\b|update\b|note:|content warning|cw:|tw:|written (with|by)|also (available|posted)|audio version|originally (posted|published)|summary of|link ?post)/i;
/** Text of each stable page (as feed.js cuts them), the lead image candidates and the opening lines. */
function digest(it) {
  const p = lru(digests, it.id, async () => {
    const peek = peekDoc(it);
    const d = peek ? await peek : await timed('digest', fetchFlow(it));
    const doc = new DOMParser().parseFromString(d.html, 'text/html');
    const pages = Array.from({ length: d.n }, () => []);
    const imgs = [];
    const addImg = (pg, im) => {
      const src = im?.getAttribute('src');
      if (!src || src.startsWith('data:')) return;
      imgs.push(src);
      if (pg.length < 18) pg.push({ t: 'img', src });
    };
    for (const b of doc.body.querySelectorAll('[data-vp]')) {
      const pg = pages[Number(b.dataset.vp)]; if (!pg) continue;
      if (b.tagName === 'IMG') { addImg(pg, b); continue; }
      const x = b.textContent.replace(/\s+/g, ' ').trim();
      if (x && pg.length < 18) {
        const t = /^H[1-6]$/.test(b.tagName) ? 'h' : { LI: 'li', DT: 'li', DD: 'li', BLOCKQUOTE: 'q', PRE: 'pre', TABLE: 'tb' }[b.tagName] || 'p';
        pg.push({ t, x: x.slice(0, 900) });
      }
      for (const im of b.querySelectorAll('img')) addImg(pg, im);
    }
    let first = '';
    for (const pg of pages.slice(0, 3)) for (const b of pg) {
      if (first || (b.t !== 'p' && b.t !== 'li') || b.x.length < 60 || SKIP.test(b.x)) continue;
      first = b.x.replace(/^(tl;?dr|summary|in short|short version)\s*[:.\-–—]\s*/i, '');
    }
    let pull = '';
    for (const s of doc.body.querySelectorAll('strong, b')) {
      const x = s.textContent.replace(/\s+/g, ' ').trim();
      const vp = Number(s.closest('[data-vp]')?.dataset.vp ?? 99);
      if (vp < 4 && x.length >= 45 && x.length <= 210 && /\s/.test(x) && !/:$/.test(x) && !SKIP.test(x)) { pull = x; break; }
    }
    const out = { n: d.n, pages, imgs: [...new Set(imgs)], first: clip(first, 300), pull };
    setMeta(it.id, { n: d.n, first: out.first, pull, nimg: out.imgs.length });
    return out;
  }, 160);
  p.then((v) => { p.done = v; }, () => {});
  return p;
}
const clip = (s, n) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n) > n * 0.6 ? s.lastIndexOf(' ', n) : n) + '…');

/** The first image in a post big enough to lead with (checked by loading it). */
const leads = new Map();
function leadImage(it, D) {
  if (META[it.id]?.lead !== undefined) return Promise.resolve(META[it.id].lead);
  return lru(leads, it.id, async () => {
    for (const src of D.imgs.filter((s) => !/\.svg(\?|$)|gravatar|emoji|latex|codecogs|badge|favicon/i.test(s)).slice(0, 4)) {
      const ok = await new Promise((res) => {
        const im = new Image(); im.referrerPolicy = 'no-referrer';
        const t = setTimeout(() => { im.src = ''; res(false); }, 6000);
        im.onload = () => { clearTimeout(t); const r = im.naturalWidth / Math.max(1, im.naturalHeight); res(im.naturalWidth >= 240 && im.naturalHeight >= 110 && r > 0.45 && r < 3.4); };
        im.onerror = () => { clearTimeout(t); res(false); };
        im.src = src;
      });
      if (ok) { setMeta(it.id, { lead: src }); return src; }
    }
    setMeta(it.id, { lead: '' });
    return '';
  }, 300);
}

// ---------- PDFs: small renders through a shared pair of pdf.js workers ----------
const pdocs = new Map();
let workers = null, wn = 0;
function pdfDoc(it) {
  // Always the wall's own copy, even when the feed has the file open: see disableFontFace below.
  return lru(pdocs, it.id, async () => {
    const [lib, buf] = await Promise.all([pdfjs(), timed('fetch', fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); }))]);
    workers ||= ['a', 'b', 'c'].map((x) => new lib.PDFWorker({ name: 'wall-' + x }));
    // Three workers parse and build pages in parallel; only drawing is on the main thread.
    // No FontFaces: each one added to the document makes Chrome relayout every
    // line of text on the page; glyphs drawn as paths look the same at this size.
    const pdf = await timed('open', lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, worker: workers[wn++ % 3] }).promise);
    it.n ||= pdf.numPages;
    setMeta(it.id, { n: pdf.numPages });
    return { n: pdf.numPages, pdf };
  }, 40); // every visible PDF stays open, so moving the slider only renders
}
const thumbs = new Map(); // `${id}|${k}|${w}` -> Promise<canvas>, margins trimmed
async function renderThumb(d, it, k, w, job, cancellable = true) {
  const key = `${it.id}|${k}|${w}`;
  const make = async () => {
    const t0 = performance.now();
    const page = await d.pdf.getPage(k + 1);
    const v0 = page.getViewport({ scale: 1 });
    const mx = v0.width * 0.075, my = v0.height * 0.06; // trim most of the margin
    const scale = w / (v0.width - 2 * mx);
    const vp = page.getViewport({ scale, offsetX: -mx * scale, offsetY: -my * scale });
    const c = document.createElement('canvas');
    c.width = w; c.height = Math.round((v0.height - 2 * my) * scale);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    const task = page.render({ canvasContext: g, viewport: vp });
    if (cancellable) job.cancel = () => task.cancel();
    try { await task.promise; } finally { if (cancellable) job.cancel = null; }
    page.cleanup();
    perf.render[0]++; perf.render[1] += performance.now() - t0;
    return c;
  };
  return lru(thumbs, key, make, 260, evictCanvas);
}
/** A cached render, or a copy of it when it is already on screen elsewhere. */
const useCanvas = (c) => { if (!c.isConnected) return c; const x = document.createElement('canvas'); x.width = c.width; x.height = c.height; x.getContext('2d').drawImage(c, 0, 0); return x; };

// ---------- summaries: a verdict pill when one is cached ----------
const asked = new Set();
function verdict(T) {
  const s = summaries.get(T.it.id);
  if (s && !s.error) { paintPill(T, s); return; }
  if (asked.has(T.it.id)) return;
  asked.add(T.it.id);
  fetch('/summary?id=' + encodeURIComponent(T.it.id)).then((r) => r.json()).then((x) => { if (x && !x.error) paintPill(T, x); }).catch(() => {});
}
function paintPill(T, s) {
  if (!s?.verdict) return;
  T.pill.className = 'pill ' + s.verdict;
  T.pill.textContent = s.verdict;
  T.pill.title = [s.why_care, s.minutes ? `${s.minutes} min` : ''].filter(Boolean).join(' · ');
}
on('summary:updated', ({ id, summary }) => { for (const T of tiles) if (T.it.id === id) paintPill(T, summary); });

// ---------- covers ----------
const div = (cls, text) => h('div', { className: cls, textContent: text || '' });
function coverPost(T) {
  const { it } = T; const m = META[it.id] || {};
  const lead = it.cover && T.lead !== '' ? it.cover : T.lead ?? m.lead;
  const style = lead ? 'photo' : ['paper', 'ink', 'tint'][hash(it.id) % 3];
  const line = it.hook || (style === 'paper' || style === 'photo' ? m.first || m.pull : m.pull || m.first) || '';
  const quote = !it.hook && line && line === m.pull;
  const tt = div('tt ' + tsize(it.t), it.t);
  const ex = h('div', { className: 'ex' + (quote ? ' quote' : '') });
  if (line && style === 'paper' && !quote) {
    // Small-caps lead-in, like the opening of a magazine piece.
    const w = line.split(' '); ex.append(h('span', { className: 'lead', textContent: w.slice(0, 3).join(' ') }), ' ' + w.slice(3).join(' '));
  } else ex.textContent = line;
  const k = karma(it), mins = minutes(it);
  const ft = h('div', { className: 'ft' },
    k ? h('span', { className: 'kb', title: `${it.score} karma` }, h('i', { style: `width:${Math.round(k * 100)}%` })) : null,
    h('span', { className: 'kn', textContent: [it.score ? it.score : '', mins ? mins + ' min' : ''].filter(Boolean).join(' · ') }));
  const src = div('src', it.src || LANES[it.lane]);
  if (style === 'photo') {
    const im = h('img', { className: 'ph', alt: '', decoding: 'async', src: lead, referrerPolicy: 'no-referrer' });
    im.onerror = () => { T.lead = ''; setMeta(it.id, { lead: '' }); repaintCover(T); };
    return h('div', { className: 'cv post s-photo' }, im, h('div', { className: 'tx' }, src, tt, ex, ft));
  }
  return h('div', { className: 'cv post s-' + style }, src, tt, ex, ft);
}
function coverPaper(T) {
  const { it } = T;
  const style = ['classic', 'swiss', 'journal', 'series', 'mono'][hash(it.id) % 5];
  const dt = fmtDate(it), yr = it.y ? String(it.y) : dt.slice(-4);
  // The month when it is known ("ARXIV · APR 2025"); Swiss covers print the year large below.
  const venue = [it.src || 'paper', style === 'swiss' && dt === yr ? '' : dt].filter(Boolean).join(' · ');
  const n = nOf(it);
  return h('div', { className: 'cv paper p-' + style },
    div('hd', venue),
    div('tt ' + tsize(it.t), it.t),
    style === 'classic' || style === 'mono' ? h('div', { className: 'rule' }) : null,
    div('ab', it.hook || it.why || ''),
    style === 'swiss' ? div('yr', yr) : null,
    n ? div('pp', n + ' pp') : null);
}
function coverBook(T) {
  const { it } = T; const ia = iaOf(it);
  const im = h('img', { className: 'cov', alt: '', decoding: 'async', loading: 'lazy', crossOrigin: 'anonymous', src: PI(`https://archive.org/services/img/${ia}`) });
  const cv = h('div', { className: 'cv book' }, im,
    h('div', { className: 'lbl' }, subject(it) ? div('sj', subject(it)) : null, div('tt', it.t.replace(/\s*\.\.+\s*$/, '')), div('yr', [fmtDate(it), nOf(it) ? nOf(it) + ' pp' : ''].filter(Boolean).join(' · '))));
  im.onerror = () => { const c = coverCloth(T); cv.replaceWith(c); T.cv = c; };
  return cv;
}
function coverCloth(T) {
  const { it } = T;
  return h('div', { className: `cv cloth c${hash(it.id) % 5}` },
    h('div', { className: 'fr' }, div('tt ' + tsize(it.t), it.t), h('div', { className: 'rule' }), div('au', cleanAu(it.a)), div('src', it.src || '')));
}
const COVERS = { post: coverPost, paper: coverPaper, book: coverBook, cloth: coverCloth };

// ---------- paper covers: the top figure (Settings › Wall › Paper covers) ----------
// An arXiv paper's tile shows the top of its Pictures lead (GET /extract/leads,
// routes/68-wallfigs.mjs: GET /extract's lead, ranked by score or picked in the
// highlights file) over its title, or the top two or three as a collage when the
// figures are small. The typeset cover stays underneath until every image has
// loaded and decoded, so a paper with no figure, one still being extracted or one
// whose image fails keeps it, and nothing moves (the tile's shape is fixed by CSS).
// Asked for only when a tile settles near the viewport, a batch per request (the
// server answers from its extract cache on disk and builds the rest in the
// background); answers are kept in store 'wallFigs' (the last 1,500 papers, 30 days)
// so a cover seen once comes back without asking. Images the disk cache has come
// through the proxy; the rest straight from arXiv, as the Feeds cards load them.
const FIG_DAYS = 30, day = () => Math.floor(Date.now() / 864e5);
const FIGS = store.get('wallFigs', {}); // id -> {show, pics, t} or {t}: nothing to lead with
let figsT = null;
function setFigs(id, v) {
  delete FIGS[id]; FIGS[id] = { ...(v || {}), t: day() };
  clearTimeout(figsT);
  figsT = setTimeout(() => {
    const keys = Object.keys(FIGS);
    for (const k of keys.slice(0, Math.max(0, keys.length - 1500))) delete FIGS[k];
    (window.requestIdleCallback || setTimeout)(() => store.set('wallFigs', FIGS));
  }, 2000);
}
const figOk = (T) => T.kind === 'paper' && W.pc === 'figure' && /^arxiv:/.test(T.it.id);
const figNo = new Set();   // this session: a failed answer or image; not asked again
const figWant = new Set(); // ids of settled tiles waiting for an answer
let figBusy = false, figT = null;
/** A settled paper tile: its figure cover from what is known, or ask the server. */
function figFor(T) {
  if (!figOk(T) || T.fig || figNo.has(T.it.id)) return;
  const v = FIGS[T.it.id];
  if (v && day() - (v.t || 0) <= FIG_DAYS) { if (v.pics) showFig(T, v); return; }
  figWant.add(T.it.id);
  if (!figBusy) { clearTimeout(figT); figT = setTimeout(pullFigs, 60); }
}
async function pullFigs(wait = 0) {
  if (figBusy) return;
  // The 40 nearest the middle of the screen (the server takes 60); the rest wait for the next round.
  const mid = centre();
  const want = tiles.filter((T) => T.vis && figWant.has(T.it.id)).sort((a, b) => Math.abs(a.idx - mid) - Math.abs(b.idx - mid));
  figWant.clear(); // tiles that left are asked about again when they settle
  for (const T of want.slice(40)) figWant.add(T.it.id);
  const vis = new Map(want.slice(0, 40).map((T) => [T.it.id, T]));
  if (!vis.size || W.pc !== 'figure') return;
  figBusy = true;
  let r = null;
  try { r = await (await fetch(`/extract/leads?build=1&wait=${wait}&ids=` + [...vis.keys()].map(encodeURIComponent).join(','))).json(); } catch { /* the server is away */ }
  figBusy = false;
  if (!r || r.error) { for (const id of vis.keys()) figNo.add(id); return; }
  for (const [id, v] of Object.entries(r.leads || {})) { setFigs(id, v); const T = vis.get(id); if (v && T?.vis) showFig(T, FIGS[id]); }
  for (const id of r.failed || []) figNo.add(id);
  // Still being extracted: ask again while their tiles are in view (the server holds
  // the request until one is done, at most 1.5 s).
  for (const id of r.pending || []) if (vis.get(id)?.vis) figWant.add(id);
  if (figWant.size) figT = setTimeout(() => pullFigs(1500), 150);
}
/** Width over height of a picture (a multi-image figure: of its arrangement). */
function arOf(p, n = p.lay) {
  if (!p.parts) return p.w && p.h ? p.w / p.h : 4 / 3;
  if (n == null) n = ['r', ...p.parts.map((_, j) => j)];
  if (typeof n === 'number') return p.parts[n].w / p.parts[n].h;
  const a = n.slice(1).map((x) => arOf(p, x));
  return n[0] === 'r' ? a.reduce((s, x) => s + x, 0) : 1 / a.reduce((s, x) => s + 1 / x, 0);
}
const clampAr = (a) => Math.max(0.3, Math.min(5, a));
const FIG_BOX = 1.1; // the figure area's width over height, about (a .772 face less the label)
/** The pictures a cover shows: the top one, or the top two or three when they are small. */
function figPick(v) {
  const ps = v.pics || [];
  const small = (p) => Math.max(p.w || 0, p.h || 0) > 0 && Math.max(p.w, p.h) <= 400;
  return v.show === 'few' && ps.length > 1 && small(ps[0]) ? ps.slice(0, 3) : ps.slice(0, 1);
}
/** A collage's grid: of the arrangements for 2 or 3 pictures, the one whose shape is nearest the box's. */
function figGrid(ars) {
  const fit = (a) => Math.abs(Math.log(a / FIG_BOX));
  const fr = (xs) => { const m = Math.max(...xs); return xs.map((x) => Math.max(0.45, x / m).toFixed(3) + 'fr').join(' '); };
  const [a, b, c] = ars;
  if (ars.length === 2) {
    const side = a + b, stack = 1 / (1 / a + 1 / b);
    return fit(side) <= fit(stack) ? { cls: 'g2r', cols: fr([a, b]), rows: '1fr' } : { cls: 'g2c', cols: '1fr', rows: fr([1 / a, 1 / b]) };
  }
  const top = 1 / (1 / a + 1 / (b + c)), left = a + 1 / (1 / b + 1 / c); // a over b|c, or a beside b/c
  return fit(top) <= fit(left)
    ? { cls: 'g3t', cols: fr([b, c]), rows: fr([1 / a, 1 / (b + c)]) }
    : { cls: 'g3l', cols: fr([a, 1 / (1 / b + 1 / c)]), rows: fr([1 / b, 1 / c]) };
}
const figSrc = (u, c) => (c ? PI(u) : u);
/** One picture: an image, or a multi-image figure's parts in their arrangement (as features/figures.js figArt). */
function figArt(p, ims) {
  const img = (u, c) => { const im = h('img', { alt: '', decoding: 'async', draggable: false }); im.referrerPolicy = 'no-referrer'; im.src = figSrc(u, c); ims.push(im); return im; };
  if (!p.parts) return h('div', { className: 'fc' }, img(p.img, p.c));
  const node = (n) => {
    if (typeof n === 'number') return h('div', { className: 'fp' }, img(p.parts[n].img, p.parts[n].c));
    const kids = n.slice(1), a = kids.map((x) => arOf(p, x)), row = n[0] === 'r';
    const tot = row ? a.reduce((s, x) => s + x, 0) : a.reduce((s, x) => s + 1 / x, 0);
    const el = h('div', { className: row ? 'fr' : 'fcol' });
    kids.forEach((k, j) => { const c = node(k); c.style[row ? 'width' : 'height'] = ((100 * (row ? a[j] : 1 / a[j])) / tot).toFixed(2) + '%'; el.append(c); });
    return el;
  };
  return h('div', { className: 'fc' }, h('div', { className: 'fa', style: `--ar:${arOf(p).toFixed(3)}` }, node(p.lay ?? ['r', ...p.parts.map((_, j) => j)])));
}
/** Put the figure cover over the typeset one; it shows once every image is decoded. */
function showFig(T, v, only1 = false) {
  if (T.fig || !figOk(T) || figNo.has(T.it.id)) return;
  const { it } = T;
  const pics = only1 ? v.pics.slice(0, 1) : figPick(v);
  const ims = [];
  const box = h('div', { className: 'fg' }, ...pics.map((p) => figArt(p, ims)));
  if (pics.length > 1) {
    const g = figGrid(pics.map((p) => clampAr(arOf(p))));
    box.classList.add(g.cls);
    box.style.gridTemplate = `${g.rows} / ${g.cols}`;
  }
  const dt = fmtDate(it);
  const el = h('div', { className: 'cv paper p-fig' }, box,
    h('div', { className: 'lb' }, div('hd', [it.src || 'paper', dt].filter(Boolean).join(' · ')), div('tt ' + tsize(it.t), it.t)));
  T.fig = el; T.figIms = ims;
  T.cv.after(el);
  const loaded = (im) => (im.complete && im.naturalWidth ? Promise.resolve() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; })).then(() => timed('figDecode', im.decode().catch(() => {})));
  const ars = pics.flatMap((p) => (p.parts ? p.parts.map((x) => x.w / x.h) : [arOf(p)]));
  Promise.allSettled(ims.map(loaded)).then((rs) => {
    if (T.fig !== el) return;
    if (rs.every((r) => r.status === 'fulfilled')) {
      // Each image drawn once into a canvas of about the tile's size, in idle time: a large
      // PNG or a busy SVG drawn scaled at every paint made scrolling stutter (STATUS.md).
      const k = pics.length > 1 ? 0.7 : 1, bw = Math.round(faceW(T) * DPR * 0.9 * k), bh = Math.round(bw / FIG_BOX);
      bake(async () => {
        if (T.fig !== el) return;
        const cs = await Promise.all(ims.map((im, j) => toCanvas(im, bw, bh, ars[j])));
        if (T.fig !== el) return;
        ims.forEach((im, j) => { if (cs[j]) { im.replaceWith(cs[j]); im.src = ''; } });
        el.classList.add('shown'); T.figIms = null;
        setTimeout(() => { if (T.fig === el) T.face.classList.add('figd'); }, 300); // the typeset cover under it stops painting
      });
      return;
    }
    dropFig(T);
    // A collage with a broken picture falls back to the top one alone; a broken top one to the typeset cover.
    if (pics.length > 1 && rs[0].status === 'fulfilled' && (!pics[0].parts || rs.slice(0, pics[0].parts.length).every((r) => r.status === 'fulfilled'))) showFig(T, v, true);
    else figNo.add(it.id);
  });
}
// Baking: one cover at a time, in idle time and never while the wall scrolls (like page loads).
const bakeQ = []; let baking = false;
const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 500 }) : (fn) => setTimeout(fn, 30);
function bake(fn) { bakeQ.push(fn); if (!baking) { baking = true; idle(pumpBake); } }
function pumpBake() {
  if (scrolling) { setTimeout(() => idle(pumpBake), 160); return; }
  const fn = bakeQ.shift();
  Promise.resolve().then(fn).catch(() => {}).finally(() => { if (bakeQ.length) idle(pumpBake); else baking = false; });
}
/** An image drawn into a canvas that fits bw × bh px (raster images never enlarged; SVGs drawn sharp at that
 *  size). Raster images are scaled by createImageBitmap (off the main thread where the browser can), SVGs by drawImage. */
async function toCanvas(im, bw, bh, ar) {
  let nw = im.naturalWidth, nh = im.naturalHeight;
  if (!nw || !nh) { nw = bw; nh = Math.round(bw / (ar || 4 / 3)); }
  const vector = /\.svg(\?|$)|\/figures\/svg/.test(im.src);
  const s = vector ? Math.min(bw / nw, bh / nh) : Math.min(1, bw / nw, bh / nh);
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(nw * s)); c.height = Math.max(1, Math.round(nh * s));
  if (!vector && window.createImageBitmap) {
    try {
      const bmp = await createImageBitmap(im, { resizeWidth: c.width, resizeHeight: c.height, resizeQuality: 'high' });
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close(); // a browser that ignores the resize options still gets it scaled
      return c;
    } catch { /* no resize options here: drawImage below */ }
  }
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  const t0 = performance.now();
  try { g.drawImage(im, 0, 0, c.width, c.height); } catch { return null; }
  const ms = performance.now() - t0; perf.figBake[0]++; perf.figBake[1] += ms; figMax = Math.max(figMax, ms);
  return c;
}
let figMax = 0;
function dropFig(T) {
  if (!T.fig) return;
  for (const im of T.figIms || []) im.src = ''; // still loading: stop it
  T.fig.remove(); T.fig = T.figIms = null;
  T.face.classList.remove('figd');
}
/** Settings › Wall › Paper covers. */
function setPaperCovers(v) {
  if (v === W.pc) return;
  W.pc = v; saveW();
  for (const T of tiles) if (T.kind === 'paper') { if (v === 'page') dropFig(T); else if (T.vis && !T.later) figFor(T); }
}
on('boot', () => import('./features/settings.js').then((m) => m.registerSettings?.((ui) => ({
  id: 'wall', title: 'Wall', note: 'the covers view (w)',
  reset: () => { setPaperCovers('figure'); ui.sync(); },
  rows: [ui.row('Paper covers', 'Top figure: an arXiv paper shows its best figure (or its top two or three, when they are small) over its title, once its figures are known; other papers, and those without a figure, keep the typeset title page.',
    ui.seg([['page', 'First page'], ['figure', 'Top figure']], () => W.pc, setPaperCovers))],
}))).catch(() => { /* no Settings sheet */ }));

function repaintCover(T) {
  const c = COVERS[T.kind](T);
  c.classList.add('fresh');
  T.cv.replaceWith(c); T.cv = c;
}

// ---------- page layers (depth and contact sheets share one; scrubbing has its own) ----------
function layer(T, name) {
  const rt = div('rt', T.it.t), pn = div('pn'), bar = h('i');
  const body = div('pb');
  const el = h('div', { className: 'pv ' + name }, h('div', { className: 'rh' }, rt, pn), body, h('div', { className: 'bar' }, bar));
  T.face.append(el);
  return { name, el, body, pn, bar, cells: [], keys: [], loads: [], gen: 0, ready: -1, ks: null, w: 0 };
}
/** Show pages ks in layer L. Old pages stay up until the new ones are ready, so nothing flashes. */
function showPages(T, L, ks, n, cols) {
  const w = cellWidth(T, cols);
  if (L.ks && L.ks.join() === ks.join() && L.w === w && (L.ready === L.gen || L.busy)) return;
  const gen = ++L.gen; L.ks = ks; L.w = w; L.n = n; L.busy = true; L.got = new Set();
  if (L.cells.length !== ks.length) {
    L.cells = ks.map(() => div('cell')); L.keys = ks.map(() => null);
    for (const ld of L.loads) if (ld) ld.im.src = '';
    L.loads = [];
    L.body.replaceChildren(...L.cells);
  }
  const rows = Math.ceil(ks.length / cols);
  L.body.style.gridTemplate = `repeat(${rows}, minmax(0, 1fr)) / repeat(${cols}, minmax(0, 1fr))`;
  L.el.classList.toggle('many', ks.length > 2);
  L.pn.textContent = ks.length > 2 ? `${n} pp` : `${ks.length > 1 && ks[1] < n ? `${ks[0] + 1}–${ks[1] + 1}` : ks[0] + 1} / ${n}`;
  L.bar.style.width = (n > 1 ? (ks[0] / (n - 1)) * 100 : 0) + '%';
  ks.forEach((k, j) => { L.cells[j].dataset.k = k; });
  const done = (j, key, node) => fill(T, L, gen, j, key, node);
  const it = T.it;
  if (it.kind === 'scan') {
    const sw = scanW(w);
    ks.forEach((k, j) => {
      if (k >= n) return done(j, 'x', div('end'));
      const url = PI(scanUrl(it, k, sw));
      if (L.keys[j] === url) return done(j);
      L.cells[j].classList.add('wait');
      const prev = L.loads[j];
      if (prev?.url === url) { prev.gen = gen; return; }
      if (prev) prev.im.src = '';
      const im = new Image(); im.decoding = 'async'; im.alt = ''; im.crossOrigin = 'anonymous';
      const ld = L.loads[j] = { im, url, gen };
      // ld.gen, not gen: a newer request for the same page adopts this load.
      im.onload = () => { if (L.loads[j] === ld) L.loads[j] = null; im.decode().catch(() => {}).then(() => fill(T, L, ld.gen, j, url, im)); };
      im.onerror = () => { if (L.loads[j] === ld) { L.loads[j] = null; fill(T, L, ld.gen, j, 'err', div('err', 'page unavailable')); } };
      ld.gen = gen; im.src = url;
    });
    return;
  }
  if (isFlow(it)) {
    const D = digested(it);
    ks.forEach((k, j) => { const key = 'f' + k; if (L.keys[j] === key) done(j); else done(j, key, k < n ? mini(D, k) : div('end')); });
    return;
  }
  // PDF: one job renders this layer's pages, nearest tiles first; a newer request makes it stale.
  ks.forEach((k, j) => { if (L.keys[j] !== `p${k}|${w}`) L.cells[j].classList.add('wait'); });
  const alive = () => T.vis && L.gen === gen;
  cpuQ.add(`${it.id}|${L.name}|${gen}`, T, async (job) => {
    const d = await pdfDoc(it);
    for (const [j, k] of ks.entries()) {
      if (!alive()) throw STALE;
      const key = `p${k}|${w}`;
      if (L.keys[j] === key) { done(j); continue; }
      if (k >= d.n) { done(j, 'x', div('end')); continue; }
      try {
        // A render cancelled for someone else (it was shared through the cache) is simply redone.
        const c = await renderThumb(d, it, k, w, job).catch((e) => { if (e?.name === 'RenderingCancelledException' && alive()) return renderThumb(d, it, k, w, job); throw e; });
        done(j, key, useCanvas(c));
      } catch (e) { if (!alive()) throw STALE; done(j, 'err', div('err', 'page unavailable')); }
    }
    if (L.name === 'gl' && ks.length === 1) preRender(T, d.n, w);
  }, alive).catch((e) => { if (e !== STALE && gen === L.gen) ks.forEach((k, j) => { if (L.cells[j].classList.contains('wait')) done(j, 'err', div('err', 'could not open')); }); });
  setTimeout(() => cpuQ.sweep(), 0);
}
/** Put a page into cell j of layer L, if L still wants what it asked for in generation g. */
function fill(T, L, g, j, key, node) {
  if (g !== L.gen || L.got.has(j)) return;
  L.got.add(j);
  if (node) { L.cells[j].replaceChildren(node); L.keys[j] = key; L.el.classList.add('loaded'); if (L.name === 'gl') T.face.classList.add('paged'); }
  L.cells[j].classList.remove('wait');
  if (L.got.size === L.ks.length) { L.ready = g; L.busy = false; }
}
/** While idle, render the next depth (in the direction you are moving) so , and . feel instant. */
function preRender(T, n, w) {
  if (mode() !== 'depth') return;
  const f0 = W.f;
  [[lastDir, 1], [-lastDir, 2]].forEach(([d, level]) => {
    const f = Math.round((f0 + d * STEP) * 100) / 100;
    if (f <= 0 || f > 1) return;
    const k = kAt(n, f); const key = `${T.it.id}|${k}|${w}`;
    if (thumbs.has(key)) return;
    // Not cancellable once started: you may step onto this depth while it renders.
    cpuQ.add('pre|' + key, T, async (job) => renderThumb(await pdfDoc(T.it), T.it, k, w, job, false), () => T.vis && W.f === f0 && mode() === 'depth', level);
  });
}
// Tile widths, measured once per layout (all columns are equal; wide tiles span two).
let colW = 0;
const faceW = (T) => { if (!colW) colW = tiles.find((x) => !x.wide && x.face.clientWidth)?.face.clientWidth || SIZES[W.size]; return T.wide ? colW * 2 + 22 : colW; };
window.addEventListener('resize', () => { colW = 0; mid = null; });
function cellWidth(T, cols) {
  const fw = faceW(T);
  return Math.max(60, Math.round(((fw / cols) * DPR) / 40) * 40); // buckets, so caches hit
}
const scanW = (w) => (w > 130 ? 200 : 120);
const sheetW = (T, cols) => scanW(cellWidth(T, cols));
/** A stable page of a post as a small printed page. */
function mini(D, k) {
  const el = div('mini');
  for (const b of D?.pages[k] || []) {
    if (b.t === 'img') el.append(h('img', { src: b.src, alt: '', decoding: 'async', referrerPolicy: 'no-referrer' }));
    else el.append(h({ h: 'h5', q: 'blockquote', pre: 'pre' }[b.t] || 'p', { className: b.t === 'li' ? 'li' : b.t === 'tb' ? 'tb' : '', textContent: b.x }));
  }
  return el;
}

// ---------- tiles ----------
let tiles = [];
const byEl = new Map();
let built = null; // what the grid shows: {order, pos, lane}
let added = 0;
const wallEl = $('#wall');
const grid = $('#grid');

function makeTile(i, canWide) {
  const it = items[i];
  const kind = kindOf(it);
  const wideOk = canWide && kind === 'post' && topShare(it) < 0.12;
  const wide = wideOk && W.size <= 3;
  const zone = h('div', { className: 'zone' }, h('i'));
  const face = h('div', { className: 'face' }, zone);
  const pill = h('span', { className: 'pill-slot' });
  const date = fmtDate(it);
  const meta = h('div', { className: 'meta' }, h('i', { className: 'dot', title: LANES[it.lane] || '' }), itemIcon(it, 11),
    h('span', { className: 'au', textContent: cleanAu(it.a) || it.src || '' }), date ? h('span', { className: 'dt', textContent: date }) : null, pill);
  const el = h('div', { className: `tile k-${kind}${wide ? ' wide' : ''}`, tabIndex: 0, title: it.t }, face, meta);
  el.style.setProperty('--c', LANE_COLORS[it.lane] || '#7a6f60');
  el.dataset.i = i;
  const T = { i, it, kind, wide, wideOk, el, face, zone, pill, vis: false, gl: null, sl: null };
  T.cv = COVERS[kind](T);
  face.prepend(T.cv);
  byEl.set(el, T);
  wire(T);
  return T;
}

function addTiles(n) {
  const order = state.order;
  const from = state.pos + added;
  const slice = order.slice(from, from + n);
  if (!slice.length) return;
  let lastWide = tiles.findLastIndex((T) => T.wide);
  const frag = document.createDocumentFragment();
  const flows = [];
  for (const i of slice) {
    const idx = tiles.length;
    const T = makeTile(i, idx - lastWide > 5 && idx > 0);
    T.idx = idx;
    if (T.wide) lastWide = idx;
    tiles.push(T); frag.append(T.el); io.observe(T.el);
    if (isFlow(T.it) && !META[T.it.id]?.first && flows.length < 40) flows.push(T.it.url);
  }
  grid.append(frag);
  added += slice.length;
  // Have the server fetch the posts' text ahead of the covers that need it.
  if (flows.length) serverPrefetch(flows, 45, 'wall-docs');
  paintInfo();
}

// While the wall is scrolling, tiles passing by get only their covers; page
// loads and post text wait until scrolling rests, so a fling stays smooth and
// fetches nothing for tiles that only flashed past.
let scrollRaf = false, scrolling = false, restT = null;
wallEl.addEventListener('scroll', () => {
  if (!scrollRaf) { scrollRaf = true; requestAnimationFrame(() => { scrollRaf = false; mid = null; }); }
  scrolling = true; clearTimeout(restT);
  restT = setTimeout(() => { scrolling = false; for (const T of tiles) if (T.vis && T.later) settle(T); schedulePrefetch(); }, 140);
}, { passive: true });
const sentinel = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) addTiles(60); }, { root: wallEl, rootMargin: '900px' });
const io = new IntersectionObserver((es) => {
  for (const e of es) { const T = byEl.get(e.target); if (!T) continue; if (e.isIntersecting) enter(T); else leave(T); }
  schedulePrefetch();
}, { root: wallEl, rootMargin: '250px 0px 450px 0px' });

function enter(T) {
  if (T.vis) return;
  T.vis = true;
  clearTimeout(T.dropT);
  if (scrolling) T.later = true; else settle(T);
}
/** The work a tile needs once it is in view: verdict, post text and cover details, pages for the mode. */
function settle(T) {
  T.later = false;
  verdict(T);
  if (T.kind === 'post') {
    const m = META[T.it.id];
    if (!m?.first || m.lead === undefined) {
      netQ.add('d|' + T.it.id, T, () => digest(T.it)).then((D) => {
        const had = META[T.it.id]?.lead;
        repaintCover(T);
        return leadImage(T.it, D).then((src) => { if (src && src !== had) { T.lead = src; repaintCover(T); } });
      }).catch(() => {});
    }
  }
  if (T.kind === 'paper') figFor(T);
  apply(T);
}
function leave(T) {
  if (!T.vis) return;
  T.vis = false; T.later = false;
  if (T.figIms) dropFig(T); // a figure cover still loading: stop it (it starts again on settling)
  for (const L of [T.gl, T.sl]) if (L) { for (const ld of L.loads) if (ld) ld.im.src = ''; L.loads = []; L.gen++; L.busy = false; L.ks = null; }
  // Free the page renders once the tile has been away for a while.
  T.dropT = setTimeout(() => {
    if (T.vis) return;
    for (const L of [T.gl, T.sl]) if (L) { L.el.remove(); } T.gl = T.sl = null; T.face.classList.remove('paged');
    if (T.fig && tiles.filter((x) => x.fig).length > 60) dropFig(T); // keep about 60 figure covers' canvases
  }, 6000);
}

// ---------- the global mode: covers, depth or contact sheets ----------
const mode = () => (W.sheet ? 'sheet' : W.f > 0 ? 'depth' : 'cover');
function sheetDims(T) {
  const big = faceW(T) / (T.wide ? 2 : 1) >= 230;
  return T.wide ? (big ? [6, 3] : [4, 2]) : (big ? [3, 3] : [2, 2]);
}
/** Bring a visible tile in line with the global mode. */
function apply(T) {
  const md = mode();
  T.el.dataset.mode = md;
  if (md === 'cover' || !T.vis) return;
  if (!canShow(T.it)) { ensureN(T).then(() => { if (T.vis) apply(T); }).catch(() => { T.el.dataset.mode = 'cover'; }); return; }
  const n = nOf(T.it);
  T.gl ||= layer(T, 'gl');
  if (md === 'sheet') {
    const [c, r] = sheetDims(T); const N = c * r;
    const ks = [...new Set(Array.from({ length: N }, (_, j) => kAt(n, (j + 0.5) / N)))];
    // Short items have fewer distinct pages than cells: fit the grid to them.
    const cols = ks.length >= N ? c : Math.min(c, ks.length <= 2 ? ks.length : Math.ceil(Math.sqrt(ks.length * (T.wide ? 2 : 1))));
    showPages(T, T.gl, ks, n, cols);
  } else {
    const k = kAt(n, W.f);
    showPages(T, T.gl, T.wide && n > 1 ? [Math.min(k, n - 2), Math.min(k, n - 2) + 1] : [k], n, T.wide && n > 1 ? 2 : 1);
  }
}
/** Learn the page count: posts need their text, PDFs need opening. */
function ensureN(T) {
  const it = T.it;
  if (isFlow(it)) return netQ.add('d|' + it.id, T, () => digest(it));
  if (it.kind === 'pdf') return netQ.add('o|' + it.id, T, () => pdfDoc(it));
  return Promise.resolve();
}
function applyAll() {
  for (const T of tiles) if (T.vis && !T.later) apply(T); else T.el.dataset.mode = mode();
  cpuQ.sweep(); netQ.sweep();
  schedulePrefetch();
}

// Dragging the slider: posts update every frame (their pages are in memory),
// page numbers and position bars too; page images and PDF renders wait until
// the hand rests for a moment or lets go, so a drag does not start hundreds of
// downloads for pages nobody stops at.
let dragging = false, applyT = null, rafP = false, lastDir = 1;
function setDepth(f, how = 'step') {
  const nf = Math.max(0, Math.min(1, Math.round(f * 100) / 100));
  if (nf !== W.f) lastDir = nf > W.f ? 1 : -1;
  W.f = nf;
  if (W.sheet) { W.sheet = false; paintBar(); }
  paintDepth();
  saveW();
  clearTimeout(applyT);
  if (!(how === 'drag' && dragging)) { applyAll(); return; }
  if (!rafP) {
    rafP = true;
    requestAnimationFrame(() => {
      rafP = false;
      for (const T of tiles) if (T.vis && (isFlow(T.it) || mode() === 'cover')) apply(T);
      for (const T of tiles) if (T.vis && T.gl && mode() === 'depth') { const n = nOf(T.it); if (n) { const k = kAt(n, W.f); T.gl.pn.textContent = `${k + 1} / ${n}`; T.gl.bar.style.width = (n > 1 ? (k / (n - 1)) * 100 : 0) + '%'; } }
      if (mode() === 'cover') for (const T of tiles) T.el.dataset.mode = 'cover';
    });
  }
  applyT = setTimeout(applyAll, 250);
}
const stepDepth = (d) => setDepth(Math.round((W.f + d * STEP) / STEP) * STEP);
function toggleSheet() { W.sheet = !W.sheet; saveW(); paintBar(); applyAll(); }
function setSize(d) {
  const s = Math.max(0, Math.min(SIZES.length - 1, W.size + d));
  if (s === W.size) return;
  const anchor = document.activeElement?.closest?.('#grid .tile') || tiles.find((T) => T.vis && T.el.getBoundingClientRect().top >= 0)?.el;
  W.size = s; saveW(); paintBar(); colW = 0; mid = null;
  // Wide (featured) tiles only at the smaller sizes.
  for (const T of tiles) { T.wide = T.wideOk && s <= 3; T.el.classList.toggle('wide', T.wide); }
  anchor?.scrollIntoView({ block: 'center' });
  requestAnimationFrame(() => { for (const T of tiles) if (T.gl) T.gl.ks = null; applyAll(); });
}

// Prefetch on the server: the pages visible tiles need now (so the server
// fetches them all in parallel, not six at a time as the browser would), and
// after a pause the neighbouring depths, so stepping with , and . is instant.
let pfT = null;
function schedulePrefetch() {
  clearTimeout(pfT);
  pfT = setTimeout(() => {
    if (mode() === 'cover') return;
    const vis = tiles.filter((T) => T.vis && T.it.kind === 'scan');
    const pdfs = tiles.filter((T) => T.vis && T.it.kind === 'pdf' && !pdocs.has(T.it.id)).map((T) => T.it.url);
    if (pdfs.length) serverPrefetch(pdfs, 70, 'wall-pdfs');
    const now = [], next = [], back = [];
    for (const T of vis) {
      const n = T.it.n; if (!n) continue;
      if (W.sheet) { const [c, r] = sheetDims(T); const N = c * r; for (let j = 0; j < N; j++) now.push(scanUrl(T.it, kAt(n, (j + 0.5) / N), sheetW(T, c))); continue; }
      now.push(scanUrl(T.it, kAt(n, W.f), 200));
      // The next depth in the direction you are moving first, then one back and two ahead.
      for (const [d, to] of [[lastDir, next], [-lastDir, back], [2 * lastDir, back]]) { const f = W.f + d * STEP; if (f > 0 && f <= 1) to.push(scanUrl(T.it, kAt(n, f), 200)); }
    }
    serverPrefetch(now, 80, 'wall-now');
    serverPrefetch(next, 56, 'wall-next');
    serverPrefetch(back, 48, 'wall-near');
  }, 60);
}

// ---------- hover scrubbing ----------
function wire(T) {
  const { el, face } = T;
  let warmT = null;
  face.addEventListener('pointerenter', () => { warmT = setTimeout(() => warm(T), 350); });
  face.addEventListener('pointermove', (e) => { T.lastX = e.clientX; T.lastY = e.clientY; scrub(T, e); });
  face.addEventListener('pointerleave', () => {
    T.inStrip = false; clearTimeout(warmT);
    el.classList.remove('scrubbing');
    if (T.sl) { T.sl.el.classList.remove('on'); T.scrubK = null; }
  });
  el.addEventListener('click', (e) => {
    const cell = e.target.closest('.gl .cell');
    const k = T.scrubK ?? (cell && mode() === 'sheet' ? Number(cell.dataset.k) : mode() === 'depth' && T.gl?.ks ? T.gl.ks[0] : null);
    openAt(T, k);
  });
  el.addEventListener('focus', () => { clearTimeout(warmT); warmT = setTimeout(() => warm(T), 250); });
}
function bisect(S) {
  const out = [], seen = new Set();
  for (let step = S; step >= 1; step = Math.floor(step / 2)) for (let j = 0; j < S; j += step) if (!seen.has(j)) { seen.add(j); out.push(j); }
  for (let j = 0; j < S; j++) if (!seen.has(j)) out.push(j);
  return out;
}
// Only the bottom strip of a tile scrubs (it shows as a faint track on hover), so
// moving the mouse across the wall never flips pages; the last page scrubbed to
// stays up, and a click anywhere on the tile opens the item there.
const zoneH = (h) => Math.max(34, Math.min(72, h * 0.26));
function scrub(T, e) {
  const r = T.face.getBoundingClientRect();
  if (e.clientY < r.bottom - zoneH(r.height)) return;
  if (!T.inStrip) { T.inStrip = true; prepScrub(T); }
  if (!canShow(T.it)) return;
  const n = nOf(T.it);
  const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  T.el.classList.add('scrubbing');
  T.zone.firstChild.style.width = x * 100 + '%';
  // Scans snap to the 40 pages prefetched on hover; others go page by page.
  const S = T.it.kind === 'scan' ? Math.min(n, 40) : n;
  const k = kAt(n, Math.round(x * (S - 1)) / Math.max(1, S - 1));
  if (k === T.scrubK) return;
  T.scrubK = k;
  T.sl ||= layer(T, 'sl');
  T.sl.el.classList.add('on');
  showPages(T, T.sl, [k], n, 1);
}
/** On reaching the strip: fetch pages across a scan (coarse to fine: middle,
 *  quarters, eighths, ...), so a quick scrub finds pages already fetched; or
 *  learn a post's or PDF's page count. */
function prepScrub(T) {
  if (T.it.kind === 'scan') {
    const n = T.it.n; const S = Math.min(n, 40);
    serverPrefetch(bisect(S).map((j) => scanUrl(T.it, kAt(n, j / Math.max(1, S - 1)), 200)), 75, 'wall-scrub');
  } else if (!canShow(T.it)) ensureN(T).then(() => { if (T.inStrip) T.face.dispatchEvent(new PointerEvent('pointermove', { clientX: T.lastX, clientY: T.lastY })); }).catch(() => {});
}
/** Get the item ready for the feed: the document opened, the first spread fetched. */
function warm(T) {
  const it = T.it;
  if (it.kind === 'scan') { const s = T.scrubK ?? 0; serverPrefetch([0, 1, 2].map((j) => scanUrl(it, Math.min(it.n - 1, s + j), 1000)), 70, 'wall-open'); }
  else openDoc(it).catch(() => {});
}

// ---------- opening in the feed ----------
let pendingFlow = null;
function openAt(T, k) {
  let pos = state.order.indexOf(T.i);
  if (pos < 0) { state.order.splice(state.pos + 1, 0, T.i); pos = state.pos + 1; }
  state.pos = pos; state.zoom = false;
  if (k != null && k >= 0) {
    state.hist.set(T.i, []);
    if (isFlow(T.it)) { pendingFlow = { id: T.it.id, k }; state.start.delete(T.i); } else state.start.set(T.i, k);
  }
  setView('feed');
}
// A post opens at its first column; once laid out, move to the stable page asked for.
on('spread:rendered', ({ it, flow }) => {
  if (!pendingFlow || !flow || it.id !== pendingFlow.id) return;
  const { k } = pendingFlow; pendingFlow = null;
  if (k > 0) goPage(k);
});

// ---------- keyboard ----------
function focused() { return byEl.get(document.activeElement?.closest?.('#grid .tile')) || null; }
function moveFocus(key) {
  const cur = focused();
  if (!cur) { const T = tiles.find((x) => x.vis && x.el.getBoundingClientRect().top >= 40) || tiles[0]; T?.el.focus(); return; }
  const at = tiles.indexOf(cur);
  const near = tiles.slice(Math.max(0, at - 60), at + 60).filter((T) => T !== cur);
  const r = cur.el.getBoundingClientRect(); const cx = r.left + r.width / 2;
  const rows = new Map(); // tiles stand on a common baseline per row
  for (const T of near) { const q = T.el.getBoundingClientRect(); const b = Math.round(q.bottom / 6); (rows.get(b) || rows.set(b, []).get(b)).push({ T, q }); }
  const same = Math.round(r.bottom / 6);
  const row = (b) => [...rows.entries()].filter(([x]) => Math.abs(x - b) <= 1).flatMap(([, v]) => v);
  const below = [...rows.keys()].filter((b) => b > same + 1).sort((a, b) => a - b)[0];
  const above = [...rows.keys()].filter((b) => b < same - 1).sort((a, b) => b - a)[0];
  let pick = null;
  if (key === 'ArrowRight' || key === 'ArrowLeft') {
    const dir = key === 'ArrowRight' ? 1 : -1;
    const side = row(same).filter(({ q }) => (q.left - r.left) * dir > 4).sort((a, b) => (a.q.left - b.q.left) * dir)[0];
    const wrap = dir > 0 ? (below != null ? row(below).sort((a, b) => a.q.left - b.q.left)[0] : null) : (above != null ? row(above).sort((a, b) => b.q.left - a.q.left)[0] : null);
    pick = (side || wrap)?.T;
  } else {
    const b = key === 'ArrowDown' ? below : above;
    if (b != null) pick = row(b).sort((x, y) => Math.abs(x.q.left + x.q.width / 2 - cx) - Math.abs(y.q.left + y.q.width / 2 - cx))[0]?.T;
    if (!pick && key === 'ArrowDown') { addTiles(60); requestAnimationFrame(() => moveFocus(key)); return; }
  }
  if (pick) { pick.el.focus({ preventScroll: true }); pick.el.scrollIntoView({ block: 'nearest' }); }
}
const KEYS = {
  ',': () => stepDepth(-1), '.': () => stepDepth(1), g: toggleSheet,
  '+': () => setSize(1), '=': () => setSize(1), '-': () => setSize(-1),
  ArrowLeft: moveFocus, ArrowRight: moveFocus, ArrowUp: moveFocus, ArrowDown: moveFocus,
  Enter: () => { const T = focused(); openAt(T, mode() === 'depth' && T.gl?.ks ? T.gl.ks[0] : null); },
  Escape: () => setView('feed'),
};
// The key registry holds one binding per key, and the feed already binds the
// arrows, Enter, + and -; so the wall takes its keys first, in the capture
// phase, and only while it is showing.
window.addEventListener('keydown', (e) => {
  if (state.view !== 'wall' || e.metaKey || e.ctrlKey || e.altKey || !$('#keys').hidden || !$('#search').hidden) return;
  const t = e.target;
  const st = document.getElementById('st'); // the Settings sheet (features/settings.js): keys in it, and Esc while it is open, are its own
  if (st && !st.hidden && (e.key === 'Escape' || st.contains(t))) return;
  if (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || (t.tagName === 'INPUT' && t.type !== 'range')) return;
  if (t.type === 'range' && /^(Arrow|Home|End|Page)/.test(e.key)) return;
  const fn = KEYS[e.key];
  if (!fn || (e.key === 'Enter' && !focused())) return;
  e.preventDefault(); e.stopPropagation();
  fn(e.key);
}, true);
registerKey([',', '.'], (e) => stepDepth(e.key === '.' ? 1 : -1), { view: 'wall', help: [', .', 'wall: move every tile through its pages (depth)'], order: 64 });
keyHelp.push(
  { label: 'g', text: 'wall: contact sheets, pages from across each item', order: 65 },
  { label: '+ - ← → ↑ ↓', text: 'wall: tile size / move between tiles; Enter opens, Esc returns', order: 66 });

// ---------- the toolbar ----------
const slider = h('input', { type: 'range', min: 0, max: 100, step: 1, value: Math.round(W.f * 100), className: 'depth', title: 'Depth: move every tile through its pages (, and .)' });
slider.setAttribute('aria-label', 'Depth through every item');
slider.addEventListener('pointerdown', () => { dragging = true; });
slider.addEventListener('input', () => setDepth(slider.value / 100, 'drag'));
const endDrag = () => { if (!dragging) return; dragging = false; setDepth(slider.value / 100); slider.blur(); };
slider.addEventListener('change', endDrag);
window.addEventListener('pointerup', endDrag);
const readout = h('span', { className: 'ro' });
const sheetBtn = h('button', { className: 'ghost', title: 'Contact sheets: pages from across each item (g)', onclick: toggleSheet }, h('span', { className: 'gi' }), 'Contact sheet');
const sizeOut = h('span', { className: 'sz' });
const info = h('span', { className: 'info' });
const bar = h('div', { id: 'wall-bar' },
  h('div', { className: 'dw' },
    h('button', { className: 'ghost cov-btn', title: 'Covers (depth 0)', onclick: () => { if (W.sheet) toggleSheet(); setDepth(0); }, textContent: 'Covers' }),
    h('div', { className: 'track' }, slider, h('div', { className: 'ticks' }, ...[0, 25, 50, 75, 100].map((x) => h('i', { style: `left:${x}%` })))),
    readout, h('span', { className: 'hint' }, h('kbd', { textContent: ',' }), h('kbd', { textContent: '.' }))),
  sheetBtn,
  h('div', { className: 'szc' },
    h('button', { className: 'ghost', title: 'Smaller tiles (-)', textContent: '−', onclick: () => setSize(-1) }), sizeOut,
    h('button', { className: 'ghost', title: 'Larger tiles (+)', textContent: '+', onclick: () => setSize(1) })),
  info);
wallEl.prepend(bar);
function paintDepth() {
  slider.value = Math.round(W.f * 100);
  slider.style.setProperty('--p', W.f * 100 + '%');
  readout.textContent = W.sheet ? 'whole item' : W.f === 0 ? 'covers' : W.f >= 1 ? 'last page' : `${Math.round(W.f * 100)}% in`;
  bar.classList.toggle('deep', W.f > 0 && !W.sheet);
}
function paintBar() {
  paintDepth();
  sheetBtn.classList.toggle('on', W.sheet);
  bar.classList.toggle('sheet', W.sheet);
  slider.title = W.sheet ? 'Contact sheets show the whole item; move the slider to go back to one page per tile' : 'Depth: move every tile through its pages (, and .)';
  grid.style.setProperty('--tw', SIZES[W.size] + 'px');
  grid.dataset.size = W.size;
  sizeOut.textContent = `${SIZES[W.size]}`;
}
function paintInfo() {
  const left = Math.max(0, state.order.length - state.pos);
  info.textContent = `${state.lane === 'all' ? 'All lanes' : LANES[state.lane] || state.lane} · ${left} ahead · scrub along a tile's bottom edge · click to open`;
}

// ---------- the view ----------
export function showWall() {
  paintBar();
  // Coming back from the feed: if the item you were reading is on the wall, keep
  // the wall as it was (scroll position included) and put the focus on that item.
  const here = state.order[state.pos];
  const keep = built && tiles.length && built.order === state.order && built.lane === state.lane && state.pos >= built.pos && tiles.some((T) => T.i === here);
  if (keep) {
    paintInfo(); applyAll();
    const T = tiles.find((x) => x.i === here);
    if (T && built.pos !== state.pos) {
      requestAnimationFrame(() => {
        T.el.focus({ preventScroll: true });
        const r = T.el.getBoundingClientRect(), w = wallEl.getBoundingClientRect();
        if (r.top < w.top + 50 || r.bottom > w.bottom) T.el.scrollIntoView({ block: 'center' });
      });
    }
    built.pos = state.pos;
    return;
  }
  for (const T of tiles) { io.unobserve(T.el); clearTimeout(T.dropT); }
  netQ.clear(); cpuQ.clear();
  tiles = []; byEl.clear(); added = 0; colW = 0; mid = null;
  grid.replaceChildren();
  built = { order: state.order, pos: state.pos, lane: state.lane };
  addTiles(72);
  sentinel.observe($('#grid-more'));
  wallEl.scrollTop = 0;
}
function hideWall() {
  netQ.clear(); cpuQ.clear();
  for (const T of tiles) for (const L of [T.gl, T.sl]) if (L) { for (const ld of L.loads) if (ld) ld.im.src = ''; L.loads = []; L.gen++; L.busy = false; L.ks = null; }
}
registerView('wall', { label: 'Wall', key: 'w', order: 1, roots: () => [wallEl], show: showWall, hide: hideWall });

/** For tests and other modules: what the wall is doing. */
export function wallStats() {
  const vis = tiles.filter((T) => T.vis);
  const inView = vis.filter((T) => { const r = T.el.getBoundingClientRect(); return r.bottom > 0 && r.top < wallEl.clientHeight; });
  const pending = mode() === 'cover' ? 0 : inView.filter((T) => !T.gl || T.gl.ready !== T.gl.gen || T.gl.busy).length;
  return { tiles: tiles.length, visible: vis.length, inView: inView.length, pending, mode: mode(), f: W.f, size: SIZES[W.size], queued: netQ.jobs.length + cpuQ.jobs.length, running: netQ.running.size + cpuQ.running.size,
    perf: Object.fromEntries(Object.entries(perf).map(([k, [c, ms]]) => [k, c ? `${c} × ${Math.round(ms / c)} ms` : '-'])), figBakeMax: Math.round(figMax) };
}
export { setDepth, toggleSheet, setSize };

/** A plain typographic cover (kept for other modules that want one). */
export function typoFace(it) {
  return h('div', { className: 'typo', style: `--c:${LANE_COLORS[it.lane] || '#6b5a3a'}` },
    h('div', { className: 'tt', textContent: it.t }),
    h('div', { className: 'aa', textContent: [it.a, fmtDate(it)].filter(Boolean).join(' · ') }),
    h('div', { className: 'xx', textContent: it.hook || it.why || '' }));
}
/** Item i's wall cover, for use outside the wall (features/upnext.js): the same
 *  designs as the tiles (book cover scans, typeset papers, post cards, cloth),
 *  from what is known now. It starts no post-text fetch; its only image is a
 *  book's cover scan or a post's lead image already found. The .cv fills its
 *  nearest positioned ancestor, which needs container-type: inline-size (the
 *  type scales with its width) and --c (the lane colour). data-kind: book,
 *  paper, post or cloth. */
export function coverFor(i) {
  const it = items[i]; if (!it) return null;
  const T = { i, it, kind: kindOf(it), wide: false };
  T.cv = COVERS[T.kind](T);
  T.cv.dataset.kind = T.kind;
  return T.cv;
}
export { showFeed };
