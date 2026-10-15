// Text on raster pages, find in item, quote to note, printed page numbers.
//
// Text layer: PDF pages get a pdf.js TextLayer, Internet Archive scans get
// OCR word boxes from /ocr (server/routes/50-ocr.mjs); both are invisible
// until selected and split into one span per word (`.w[data-wi]`, the word's
// index on its page) so other features can highlight words. A layer is laid
// out once in the coordinate space of the whole source page, kept as a DOM
// template and cloned onto each panel with one CSS transform that maps it
// through the panel's crop box. Layers are built after the spread is on
// screen, so they never delay a page turn, and the next spread's layers are
// prepared in idle time.
//
// Text source (text.js): for PDFs and scans, the words of the pages on screen
// plus the next spread, in reading order, as { text, page, el } with `el`
// looked up live (null while its page is not on screen). After a turn, ask
// currentWords() again to continue. Find: F or Cmd/Ctrl+F. Quote: select
// text, then q (or the floating button). Emits 'textlayer:ready' {i, it, k, el}
// when a page's layer is attached.
import { $, h, P, on, emit, registerKey, toast, lru } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, isFlow, pdfjs, scanUrl } from '../docs.js';
import { loadImg } from '../render.js';
import { registerTextSource, currentWords, highlight, reveal } from '../text.js';
import { appendQuote } from '../notes.js';
import { live } from '../flow.js';
import { goPage } from '../nav.js';
import { startOf } from '../prefetch.js';

const LS = 2; // pdf.js layers are laid out at 2x PDF points; panels scale them to fit
const raster = (it) => !!it && (it.kind === 'pdf' || it.kind === 'scan');
const getJson = (u, priority = 'auto') => fetch(u, { priority }).then((r) => { if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); });
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 60));
export const layerTimes = []; // ms from 'spread:rendered' to a layer on screen (diagnostics)

// ---------- page text ----------
// A page model is the page's text T plus its words, each with its [a, b)
// range in T, so search hits in T map back to word spans.
const wordsOf = (T) => [...T.matchAll(/\S+/g)].map((m) => ({ t: m[0], a: m.index, b: m.index + m[0].length }));
/** pdf.js text items to T; runs[j] is the range of the j-th text item (= the j-th text div). */
function pdfText(tc) {
  let T = ''; const runs = [];
  for (const x of tc.items) {
    if (x.str === undefined) continue;
    const a = T.length; T += x.str; runs.push([a, T.length]);
    if (x.hasEOL) T += '\n';
  }
  return { T, runs };
}
/** OCR words to T: words of a line joined by spaces, lines by newlines. */
function ocrText(o) {
  let T = ''; const words = [];
  o.words.forEach((w, j) => {
    if (j) T += o.words[j - 1].l === w.l ? ' ' : '\n';
    words.push({ t: w.t, a: T.length, b: T.length + w.t.length }); T += w.t;
  });
  return { T, words };
}
const models = new Map();
/** The text model of page k (0-based) of a PDF or scan. `soon` marks a
 *  prefetch: its request yields to page images and visible pages' text. */
export function pageModel(it, k, soon = false) {
  return lru(models, it.id + '|' + k, async () => {
    if (it.kind === 'scan') {
      const o = await getJson(`/ocr?ia=${encodeURIComponent(it.ia)}&k=${k}`, soon ? 'low' : 'high');
      o.words = splitWords(o.words, o.lines);
      await trimBoxes(it, k, o);
      return { kind: 'ocr', k, o, ...ocrText(o) };
    }
    const d = await openDoc(it);
    if (k >= d.n) throw new Error('no such page');
    const page = await d.pdf.getPage(k + 1);
    const tc = await page.getTextContent();
    const { T, runs } = pdfText(tc);
    return { kind: 'pdf', k, tc, vp: page.getViewport({ scale: LS }), T, runs, words: wordsOf(T) };
  }, 48);
}

// ---------- layers ----------
const mctx = document.createElement('canvas').getContext('2d');
mctx.font = '100px sans-serif'; // OCR words are measured once at 100px and scaled
const SPACE = mctx.measureText(' ').width;
const tpls = new Map();
function template(it, k) {
  return lru(tpls, it.id + '|' + k, async () => {
    const m = await pageModel(it, k);
    return m.kind === 'pdf' ? pdfLayer(m) : ocrLayer(m);
  }, 30);
}
async function pdfLayer(m) {
  const lib = await pdfjs();
  const node = h('div', { className: 'tl pdf' });
  node.style.setProperty('--scale-factor', String(LS));
  const tl = new lib.TextLayer({ textContentSource: m.tc, container: node, viewport: m.vp });
  await tl.render();
  // One span per word: cut each text run at word boundaries (a word broken
  // across two runs gets a span in each, with the same index).
  let w = 0;
  tl.textDivs.forEach((div, j) => {
    const [s, e] = m.runs[j] || [0, 0];
    if (s === e) return;
    while (w < m.words.length && m.words[w].b <= s) w++;
    const kids = []; let pos = s;
    for (let x = w; x < m.words.length && m.words[x].a < e; x++) {
      const a = Math.max(s, m.words[x].a), b = Math.min(e, m.words[x].b);
      if (a > pos) kids.push(m.T.slice(pos, a));
      const sp = h('span', { className: 'w', textContent: m.T.slice(a, b) }); sp.dataset.wi = x;
      kids.push(sp); pos = b;
    }
    if (pos < e) kids.push(m.T.slice(pos, e));
    div.classList.add('run');
    div.replaceChildren(...kids);
  });
  node.append(h('div', { className: 'eoc' }));
  const { pageWidth, pageHeight } = m.vp.rawDims;
  return { node, m, LW: pageWidth * LS, LH: pageHeight * LS, rot: m.vp.rotation || 0 };
}
function ocrLayer(m) {
  const { o } = m;
  const node = h('div', { className: 'tl ocr' });
  node.style.width = o.w + 'px'; node.style.height = o.h + 'px';
  const kids = [];
  // One run per OCR line, its words inline; letter-spacing stretches each word
  // and each gap to its exact OCR box, so highlights sit on the words and a
  // selection reads as continuous text with spaces.
  for (let j = 0; j < o.words.length;) {
    let e = j; while (e < o.words.length && o.words[e].l === o.words[j].l) e++;
    const ws = o.words.slice(j, e);
    const top = Math.min(...ws.map((w) => w.y0)), hgt = Math.max(4, Math.max(...ws.map((w) => w.y1)) - top);
    const fs = hgt * 0.86, k = fs / 100;
    const run = document.createElement('span'); run.className = 'run';
    run.style.cssText = `left:${ws[0].x0}px;top:${top}px;font-size:${fs.toFixed(1)}px;line-height:${hgt}px;height:${hgt}px`;
    ws.forEach((w, x) => {
      const sp = document.createElement('span'); sp.className = 'w'; sp.dataset.wi = j + x; sp.textContent = w.t;
      sp.style.letterSpacing = ((w.x1 - w.x0 - mctx.measureText(w.t).width * k) / Math.max(1, [...w.t].length)).toFixed(2) + 'px';
      run.append(sp);
      const nx = ws[x + 1];
      if (nx) { const g = document.createElement('span'); g.textContent = ' '; g.style.letterSpacing = (nx.x0 - w.x1 - SPACE * k).toFixed(2) + 'px'; run.append(g); }
    });
    kids.push(run, document.createElement('br'));
    j = e;
  }
  node.append(...kids, h('div', { className: 'eoc' }));
  return { node, m, LW: o.w, LH: o.h, rot: 0 };
}
/** ABBYY-made boxes (hOCR converted from ABBYY, djvu.xml) run on to the next
 *  word, gap included. Pull each right edge back to the last ink in the page
 *  image (the 1000-px page the reader sees, already loaded) so highlights sit
 *  on the word. Tight boxes (Tesseract) are left alone. */
async function trimBoxes(it, k, o) {
  let pairs = 0, touching = 0;
  for (let j = 1; j < o.words.length; j++) if (o.words[j].l === o.words[j - 1].l) { pairs++; if (o.words[j].x0 - o.words[j - 1].x1 <= 2) touching++; }
  if (!pairs || touching < pairs * 0.6) return;
  let im; try { im = await loadImg(P(scanUrl(it, k, 1000))); } catch { return; }
  const W = im.naturalWidth, H = im.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
  const px = g.getImageData(0, 0, W, H).data;
  const sx = W / o.w, sy = H / o.h;
  const ink = (x, y0, y1) => { let n = 0; for (let y = y0; y <= y1; y++) { const i = (y * W + x) * 4; if (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11 < 150 && ++n > 1) return true; } return false; };
  for (const w of o.words) {
    const X0 = Math.max(0, Math.floor(w.x0 * sx)), Y0 = Math.max(0, Math.floor(w.y0 * sy)), Y1 = Math.min(H - 1, Math.ceil(w.y1 * sy) - 1);
    let x = Math.min(W - 1, Math.ceil(w.x1 * sx) - 1);
    while (x > X0 + 1 && !ink(x, Y0, Y1)) x--;
    if (x > X0 + 1) w.x1 = Math.min(w.x1, Math.round((x + 2) / sx));
  }
}
/** Some OCR "words" hold several: ABBYY files the end of a word hyphenated
 *  across lines with the next word ("lady indignantly"), boxed as that next
 *  word only, while the line's box starts at the true line start. Split them;
 *  such a carried-over part goes at the line start, the rest share the box. */
function splitWords(words, lines) {
  const out = [];
  words.forEach((w, j) => {
    const parts = w.t.split(/\s+/).filter(Boolean);
    if (parts.length < 2) { out.push(w); return; }
    const lx = lines[w.l]?.[0];
    if ((j === 0 || words[j - 1].l !== w.l) && lx != null && lx < w.x0 - 8) {
      out.push({ ...w, t: parts.shift(), x0: lx, x1: w.x0 - 4 });
      if (parts.length === 1) { out.push({ ...w, t: parts[0] }); return; }
    }
    const ws = parts.map((t) => mctx.measureText(t).width);
    const f = (w.x1 - w.x0) / (ws.reduce((a, b) => a + b, 0) + SPACE * (parts.length - 1));
    let x = w.x0;
    parts.forEach((t, i) => { out.push({ ...w, t, x0: Math.round(x), x1: Math.round(x + ws[i] * f) }); x += (ws[i] + SPACE) * f; });
  });
  return out;
}
const ROT = { 90: 'rotate(90deg) translateY(-100%)', 180: 'rotate(180deg) translate(-100%, -100%)', 270: 'rotate(270deg) translateX(-100%)' };
/** Map a whole-page layer onto a panel: scale to the panel, shift by its crop box. */
function placeLayer(node, el, p, t) {
  const c = p.canvas;
  // The panel's size as layoutPanels set it: reading clientWidth would force a
  // layout of the layers just inserted next to it.
  const W = parseFloat(el.style.width) || el.clientWidth, H = parseFloat(el.style.height) || el.clientHeight;
  const fullW = (W * p.srcW) / c.width, fullH = (H * p.srcH) / c.height;
  const [rw, rh] = t.rot % 180 ? [t.LH, t.LW] : [t.LW, t.LH];
  const ox = (Math.round(p.box.x0 * p.srcW) / p.srcW) * rw, oy = (Math.round(p.box.y0 * p.srcH) / p.srcH) * rh;
  node.style.transform = `scale(${fullW / rw}, ${fullH / rh}) translate(${-ox}px, ${-oy}px) ${ROT[t.rot] || ''}`;
}
async function attach(i, it, el, gen, t0) {
  const p = el._pnl;
  let t;
  try { t = await template(it, p.k); } catch { return; } // no text for this page
  if (gen !== layerGen || !el.isConnected || el.querySelector(':scope > .tl')) return;
  const node = t.node.cloneNode(true);
  placeLayer(node, el, p, t);
  node._m = t.m; node._eoc = node.querySelector(':scope > .eoc');
  el.insertBefore(node, el.querySelector(':scope > .pno'));
  el.classList.add('has-tl');
  // A split page shows one column per panel: drop the words of the other one.
  if (p.part) {
    const r = el.getBoundingClientRect();
    for (const x of node.querySelectorAll('.run')) {
      const b = x.getBoundingClientRect(); const cx = (b.left + b.right) / 2;
      if (cx < r.left || cx > r.right) x.remove();
    }
  }
  node._wi = new Map();
  for (const w of node.querySelectorAll('.w')) { const j = Number(w.dataset.wi); (node._wi.get(j) || node._wi.set(j, []).get(j)).push(w); }
  layerTimes.push(Math.round(performance.now() - t0)); if (layerTimes.length > 200) layerTimes.shift();
  paintFindOn(el, node);
  emit('textlayer:ready', { i, it, k: p.k, el });
}
let layerGen = 0;
// Layers attach once the reader stops on a spread (core's debounced
// 'spread:settled'), so building them never delays a page turn.
on('spread:settled', ({ i, it, els, flow }) => {
  hideQuote();
  const gen = ++layerGen;
  if (flow) { if (find.open && find.id === it.id) refreshFlowFind(); return; }
  if (!raster(it)) return;
  paintPrinted(); labelStrip(it); markStrip();
  const t0 = performance.now();
  // Let the spread paint first; then attach the cached or freshly built layers.
  requestAnimationFrame(() => setTimeout(() => {
    if (gen !== layerGen) return;
    for (const el of els) if (el._pnl?.canvas) attach(i, it, el, gen, t0);
    warmAhead(i, it, gen);
  }, 0));
});
/** Prepare the next spread's layers while the reader reads: fetch the text
 *  now, build the DOM in idle time, one page at a time. */
function warmAhead(i, it, gen) {
  const s = state.start.get(i) ?? 0, c = Math.max(1, state.shown || state.per);
  const ks = []; for (let k = s + c; k < Math.min(it.n || 0, s + 2 * c); k++) ks.push(k);
  for (const k of ks) pageModel(it, k, true).catch(() => {});
  const step = () => { if (gen !== layerGen || !ks.length) return; template(it, ks.shift()).catch(() => {}).finally(() => idle(step)); };
  idle(step);
}
// Ask for the text of the pages being turned to as soon as the turn starts,
// in parallel with their images.
on('item:settled', ({ i, it }) => {
  if (!raster(it) || i !== current()) return;
  const s = state.start.get(i) ?? 0;
  for (let k = s; k < Math.min(it.n || 0, s + Math.max(1, state.per)); k++) pageModel(it, k).catch(() => {});
});

// ---------- text source: words on screen plus the next spread ----------
const wordEl = (k, j) => document.querySelector(`#spread .pg[data-k="${k}"] > .tl [data-wi="${j}"]`);
registerTextSource(async ({ i, it }) => {
  if (!raster(it) || isFlow(it)) return null;
  const s = state.start.get(i) ?? 0, c = Math.max(1, state.shown || state.per), n = it.n || s + c;
  const ks = []; for (let k = s; k < Math.min(n, s + 2 * c); k++) ks.push(k);
  // Pages on screen are awaited; the next spread joins if it is ready within 1.5 s.
  const late = new Promise((r) => setTimeout(r, 1500, null));
  const ms = await Promise.all(ks.map((k, j) => (j < c ? pageModel(it, k).catch(() => null) : Promise.race([pageModel(it, k).catch(() => null), late]))));
  const words = [];
  ms.forEach((m, j) => {
    if (!m) return;
    const k = ks[j];
    m.words.forEach((w, x) => words.push({ text: w.t, page: k, get el() { return wordEl(k, x); } }));
  });
  return words.length ? { words, start: 0 } : null;
});

// ---------- printed page numbers (scans) ----------
const labels = new Map(); // ia -> labels array, or null when there are none
function loadLabels(it) {
  if (it.kind !== 'scan' || labels.has(it.ia)) return;
  labels.set(it.ia, null);
  getJson('/ocr/labels?ia=' + encodeURIComponent(it.ia)).then((j) => {
    if (!j.labels?.some(Boolean)) return;
    labels.set(it.ia, j.labels);
    if (items[current()]?.ia === it.ia) { paintPrinted(); labelStrip(it); }
  }).catch(() => labels.delete(it.ia));
}
/** The printed page label of page k of a scan, when the scan has one. */
export const printedLabel = (it, k) => (it?.kind === 'scan' ? labels.get(it.ia)?.[k] || null : null);
on('item:shown', ({ it }) => {
  loadLabels(it);
  // Have the server fetch the next scans' OCR for their opening pages now, so
  // their text is ready when the reader gets there.
  for (const ii of state.order.slice(state.pos + 1, state.pos + 3)) {
    const x = items[ii];
    if (x?.kind === 'scan') fetch(`/ocr?ia=${encodeURIComponent(x.ia)}&k=${startOf(ii)}&bg=1`, { priority: 'low' }).catch(() => {});
  }
});
function paintPrinted() {
  const pos = $('#pos'); const i = current(); const it = items[i];
  if (!pos || !it || it.kind !== 'scan') return;
  const L = labels.get(it.ia);
  const s = state.start.get(i) ?? 0, c = Math.max(1, state.shown || state.per);
  const vis = L ? L.slice(s, s + c).filter(Boolean) : [];
  const txt = vis.length ? `printed ${vis[0]}${vis.length > 1 ? '–' + vis.at(-1) : ''}` : '';
  let sp = pos.querySelector('.plabel');
  if (!txt) { sp?.remove(); return; }
  if (!sp) { sp = h('span', { className: 'plabel', title: 'Page numbers printed on the pages (from the Internet Archive)' }); pos.append(sp); }
  if (sp.textContent !== txt) sp.textContent = txt;
}
// paintPos rewrites the position line on every turn; put the label back at
// once (and keep the find bar beside it).
new MutationObserver(() => { paintPrinted(); placeBar(); }).observe($('#item-head'), { childList: true, subtree: true, characterData: true });
function labelStrip(it) {
  const L = labels.get(it.ia); const box = $('#scrub');
  if (!L || !box?.firstElementChild || box.firstElementChild._pl === it.id) return;
  for (const t of box.children) { const k = Number(t.dataset.k); if (L[k]) t.title = `p. ${k + 1} · printed ${L[k]}`; }
  box.firstElementChild._pl = it.id;
}

// ---------- find in item ----------
const LIG = { 'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl', 'ﬅ': 'st', 'ﬆ': 'st', '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-' };
/** Fold text for matching: lower case, no accents or ligatures, single spaces,
 *  line-end hyphens joined. map[j] is the index in T of folded char j. */
function fold(T) {
  let s = ''; const map = [];
  for (let i = 0; i < T.length; i++) {
    const c = T[i];
    if (c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\u00a0') { if (s && s[s.length - 1] !== ' ') { s += ' '; map.push(i); } continue; }
    if (c === '\u00ad') continue;
    if (c === '-' && (T[i + 1] === '\n' || (T[i + 1] === ' ' && T[i + 2] === '\n'))) {
      let j = i + 1; while (j < T.length && /\s/.test(T[j])) j++;
      if (/\p{Ll}/u.test(T[j] || '')) { i = j - 1; continue; }
    }
    let x = LIG[c] || c;
    if (x.charCodeAt(0) > 127) x = x.normalize('NFD').replace(/\p{M}/gu, '');
    x = x.toLowerCase();
    for (let j = 0; j < x.length; j++) { s += x[j]; map.push(i); }
  }
  return { s, map };
}
/** Ranges [a, b) in T where the folded query occurs. */
function matches(T, q) {
  if (!q || !T) return [];
  const { s, map } = fold(T); const out = [];
  for (let at = s.indexOf(q); at >= 0; at = s.indexOf(q, at + q.length)) out.push([map[at], map[at + q.length - 1] + 1]);
  return out;
}
/** Indices of the words overlapping [a, b). */
function wordsIn(words, a, b) {
  let lo = 0, hi = words.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (words[mid].b <= a) lo = mid + 1; else hi = mid; }
  const out = []; for (let j = lo; j < words.length && words[j].a < b; j++) out.push(j);
  return out;
}

// find.hits: [{ page, n }] for rasters (n-th match on that page), [{ page, ws }] for flow docs.
const find = { open: false, q: '', id: null, hits: [], cur: -1, busy: false, run: 0, flow: null };
const pdfTexts = new Map(); // item id -> T of each page, filled as find reads the PDF

let bar = null;
function buildBar() {
  const input = h('input', { type: 'text', placeholder: 'Find in this item', spellcheck: false, autocomplete: 'off', ariaLabel: 'Find in this item' });
  const count = h('span', { className: 'fb-count' });
  const btn = (txt, title, fn) => h('button', { className: 'ghost', textContent: txt, title, onmousedown: (e) => e.preventDefault(), onclick: fn });
  bar = h('div', { id: 'findbar', hidden: true, role: 'search' }, h('span', { className: 'fb-icon', ariaHidden: 'true' }), input, count,
    btn('↑', 'Previous (Shift+Enter)', () => step(-1)), btn('↓', 'Next (Enter)', () => step(1)), btn('×', 'Close (Esc)', closeFind));
  bar._input = input; bar._count = count;
  let t = null;
  input.oninput = () => { clearTimeout(t); t = setTimeout(() => runFind(input.value), 140); };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); if (fold(input.value.trim()).s !== find.q) { clearTimeout(t); runFind(input.value); } else step(e.shiftKey ? -1 : 1); }
    else if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
  };
  document.body.append(bar);
}
/** The bar sits in the item's header line, just left of the position, so it
 *  never covers the pages. */
function placeBar() {
  if (!bar || bar.hidden) return;
  const head = $('#item-head')?.getBoundingClientRect(), pos = $('#pos')?.getBoundingClientRect();
  if (!head) return;
  bar.style.top = Math.round(head.top + (head.height - bar.offsetHeight) / 2) + 'px';
  bar.style.right = Math.round(innerWidth - (pos?.width ? pos.left : head.right) + 14) + 'px';
}
export function openFind() {
  if (state.view !== 'feed') return;
  if (!bar) buildBar();
  const sel = getSelection().toString().trim();
  if (sel && sel.length < 80 && !sel.includes('\n')) bar._input.value = sel;
  find.open = true; bar.hidden = false; placeBar();
  bar._input.focus(); bar._input.select();
  if (bar._input.value.trim()) runFind(bar._input.value);
}
function closeFind() {
  find.open = false; find.run++; if (bar) bar.hidden = true;
  find.q = ''; find.hits = []; find.cur = -1;
  clearMarks();
  if (document.activeElement === bar?._input) bar._input.blur();
}
function clearMarks() {
  for (const el of document.querySelectorAll('#spread .hl-find, #spread .hl-find-cur')) el.classList.remove('hl-find', 'hl-find-cur');
  highlight('find', []); highlight('find-cur', []);
  for (const t of document.querySelectorAll('#scrub .th.fh')) t.classList.remove('fh');
}
function paintCount() {
  if (!bar) return;
  const n = find.hits.length;
  bar._count.textContent = !find.q ? '' : n ? `${find.cur + 1 || '–'}/${n}${find.busy ? '+' : ''}` : find.busy ? '…' : find.note || 'none';
  bar._count.title = n ? `${n} match${n > 1 ? 'es' : ''} on ${new Set(find.hits.map((x) => x.page)).size} page(s)` : '';
  bar.classList.toggle('miss', !!find.q && !n && !find.busy);
}
function markStrip() {
  const box = $('#scrub'); if (!box) return;
  const pages = find.open && find.id === items[current()]?.id ? new Set(find.hits.map((x) => x.page)) : new Set();
  for (const t of box.children) t.classList.toggle('fh', pages.has(Number(t.dataset.k)));
}

async function runFind(raw) {
  const i = current(); const it = items[i];
  const q = fold(raw.trim()).s;
  const run = ++find.run;
  clearMarks();
  Object.assign(find, { q, id: it.id, hits: [], cur: -1, busy: false, note: '', flow: null });
  if (q.length < 2) { paintCount(); return; }
  const s = state.start.get(i) ?? 0;
  if (isFlow(it)) {
    const m = await flowModel();
    if (run !== find.run) return;
    if (!m) { find.note = 'no text'; paintCount(); return; }
    find.flow = m;
    for (const [a, b] of matches(m.T, q)) { const ws = wordsIn(m.words, a, b); if (ws.length) find.hits.push({ page: m.words[ws[0]].w.page, ws }); }
    const vp = live?.first[s] ?? 0;
    const j = find.hits.findIndex((x) => x.page >= vp);
    find.cur = find.hits.length ? Math.max(0, j) : -1;
    paintFlowFind(true); markStrip(); paintCount();
    return;
  }
  if (!raster(it)) { paintCount(); return; }
  find.busy = true; paintCount();
  const found = (page, T) => {
    const n = matches(T, q).length;
    // The first match from the pages on screen onwards becomes current.
    if (n && find.cur < 0 && page >= s) { find.cur = find.hits.length; queueMicrotask(showHit); }
    for (let x = 0; x < n; x++) find.hits.push({ page, n: x });
  };
  try {
    if (it.kind === 'scan') {
      const j = await getJson('/ocr/text?ia=' + encodeURIComponent(it.ia));
      if (run !== find.run) return;
      j.pages.forEach((T, k) => found(k, T));
    } else {
      const d = await openDoc(it);
      const texts = pdfTexts.get(it.id) || []; pdfTexts.set(it.id, texts);
      let last = performance.now();
      for (let k = 0; k < d.n; k++) {
        if (texts[k] == null) texts[k] = pdfText(await (await d.pdf.getPage(k + 1)).getTextContent()).T;
        if (run !== find.run) return;
        found(k, texts[k]);
        if (performance.now() - last > 120) { last = performance.now(); paintCount(); markStrip(); }
      }
    }
  } catch { find.note = 'no text'; }
  if (run !== find.run) return;
  find.busy = false;
  if (find.cur < 0 && find.hits.length) { find.cur = 0; showHit(); }
  markStrip(); paintCount();
}
function step(d) {
  if (!find.hits.length) return;
  find.cur = (find.cur + d + find.hits.length) % find.hits.length;
  showHit();
}
/** Bring the current hit on screen and repaint the marks. */
function showHit() {
  paintCount();
  const i = current(); const it = items[i]; const hit = find.hits[find.cur];
  if (!hit || it.id !== find.id) return;
  if (find.flow) { paintFlowFind(true); return; }
  const s = state.start.get(i) ?? 0, c = Math.max(1, state.shown || state.per);
  if (hit.page < s || hit.page >= s + c) { goPage(hit.page); return; } // the new layers paint the marks
  for (const node of document.querySelectorAll('#spread .pg > .tl')) paintFindOn(node.parentElement, node);
}
/** Mark the matches on one raster page's layer. */
function paintFindOn(el, node) {
  if (!find.q || find.id !== items[current()]?.id || find.flow) return;
  const k = Number(el.dataset.k); const m = node._m; const hit = find.hits[find.cur];
  node.querySelectorAll('.hl-find, .hl-find-cur').forEach((x) => x.classList.remove('hl-find', 'hl-find-cur'));
  let curEl = null;
  matches(m.T, find.q).forEach(([a, b], n) => {
    const isCur = hit && hit.page === k && hit.n === n;
    for (const j of wordsIn(m.words, a, b)) for (const w of node._wi.get(j) || []) {
      w.classList.add('hl-find'); if (isCur) { w.classList.add('hl-find-cur'); curEl ||= w; }
    }
  });
  if (curEl) { curEl.classList.remove('flash'); void curEl.offsetWidth; curEl.classList.add('flash'); }
}
// Flow documents: every word is in the DOM, so search and mark them directly.
const flowModels = new WeakMap();
async function flowModel() {
  if (!live || live.id !== items[current()]?.id) return null; // not laid out yet
  if (flowModels.has(live)) return flowModels.get(live);
  const L = live; const r = await currentWords();
  if (!r || L !== live) return null;
  let T = '';
  const words = r.words.map((w, j) => { if (j) T += ' '; const a = T.length; T += w.text; return { t: w.text, a, b: T.length, w }; });
  const m = { T, words };
  flowModels.set(L, m);
  return m;
}
function paintFlowFind(go) {
  const m = find.flow; if (!m) return;
  highlight('find', find.hits.flatMap((x) => x.ws.map((j) => m.words[j].w)));
  const hit = find.hits[find.cur];
  const cur = hit ? hit.ws.map((j) => m.words[j].w) : [];
  highlight('find-cur', cur);
  if (CSS.highlights?.get('find-cur')) CSS.highlights.get('find-cur').priority = 1;
  if (go && cur[0]) reveal(cur[0]);
}
async function refreshFlowFind() {
  // A relayout (font, zoom, resize) builds new DOM: search it again.
  if (find.flow && flowModels.get(live) === find.flow) { markStrip(); return; }
  const cur = find.cur; await runFind(bar._input.value);
  if (cur >= 0 && cur < find.hits.length) { find.cur = cur; paintFlowFind(false); paintCount(); }
}
on('item:shown', ({ it }) => { if (find.open && find.id !== it.id) { find.id = it.id; setTimeout(() => find.open && runFind(bar._input.value), 0); } });
on('view:changed', ({ view }) => { if (view !== 'feed' && find.open) closeFind(); hideQuote(); });
window.addEventListener('resize', () => { if (find.open) placeBar(); });

registerKey('F', openFind, { help: ['F ⌘F', 'find in this item (Enter / Shift+Enter: next / previous)'], order: 15 });
document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || state.view !== 'feed') return;
  const k = e.key.toLowerCase();
  if (k === 'f') { e.preventDefault(); openFind(); } // instead of the browser's find, which cannot see page images
  else if (k === 'g' && find.open && find.hits.length) { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
}, true);

// ---------- selection: smooth drags, copy, quote to note ----------
// Chrome jumps a selection to the start of the page when a drag crosses a gap
// between words; like pdf.js, keep an end-of-content block right after the
// moving end of the selection so gaps resolve there instead.
let prevRange = null, dragging = false;
function resetLayer(L) { L.classList.remove('selecting'); if (L._eoc && L._eoc.parentNode !== L) L.append(L._eoc); }
document.addEventListener('selectionchange', () => {
  const sel = getSelection();
  const layers = document.querySelectorAll('#spread .tl');
  if (!sel.rangeCount || sel.isCollapsed) { layers.forEach(resetLayer); prevRange = null; if (!dragging) hideQuote(); return; }
  const range = sel.getRangeAt(0);
  for (const L of layers) if (range.intersectsNode(L)) L.classList.add('selecting'); else resetLayer(L);
  const modifyStart = prevRange && (range.compareBoundaryPoints(Range.END_TO_END, prevRange) === 0 || range.compareBoundaryPoints(Range.START_TO_END, prevRange) === 0);
  let anchor = modifyStart ? range.startContainer : range.endContainer;
  if (anchor.nodeType === 3) anchor = anchor.parentNode;
  if (!modifyStart && range.endOffset === 0 && anchor.closest?.('.tl')) {
    do { while (anchor && !anchor.previousSibling) anchor = anchor.parentNode; anchor = anchor?.previousSibling; } while (anchor && !anchor.childNodes.length);
  }
  if (anchor?.classList?.contains('w') && anchor.parentElement.classList.contains('run')) anchor = anchor.parentElement;
  const L = anchor?.parentElement?.closest('.tl');
  if (L?._eoc && anchor !== L._eoc) {
    L._eoc.style.width = L.style.width; L._eoc.style.height = L.style.height;
    anchor.parentElement.insertBefore(L._eoc, modifyStart ? anchor : anchor.nextSibling);
  }
  prevRange = range.cloneRange();
  if (!dragging) showQuoteSoon();
});
document.addEventListener('pointerdown', (e) => { if (e.button === 0 && e.target.closest?.('#spread')) { dragging = true; hideQuote(); } });
document.addEventListener('pointerup', () => {
  document.querySelectorAll('#spread .tl.selecting').forEach(resetLayer);
  if (dragging) { dragging = false; showQuoteSoon(); }
});

/** The selected text in the spread, with its page: { text, k, label } or null. */
function selectionQuote() {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!$('#spread').contains(range.commonAncestorContainer)) return null;
  const it = items[current()];
  if (live && live.flow.contains(range.commonAncestorContainer)) {
    const node = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : range.startContainer.childNodes[range.startOffset] || range.startContainer;
    let vpEl = node.closest?.('[data-vp]');
    if (!vpEl) vpEl = [...live.flow.querySelectorAll('[data-vp]')].find((b) => sel.containsNode(b, true));
    // Whole words, as on raster pages.
    const r = range.cloneRange();
    if (r.startContainer.nodeType === 3) { const t = r.startContainer.data; let o = r.startOffset; while (o > 0 && /\S/.test(t[o - 1])) o--; r.setStart(r.startContainer, o); }
    if (r.endContainer.nodeType === 3) { const t = r.endContainer.data; let o = r.endOffset; while (o < t.length && /\S/.test(t[o])) o++; r.setEnd(r.endContainer, o); }
    const text = r.toString().replace(/\s+/g, ' ').trim();
    const k = vpEl ? Number(vpEl.dataset.vp) : null;
    return text ? { text, k, label: k != null ? k + 1 : null } : null;
  }
  // Raster pages: the selected word spans, in page order; whole words only.
  const pages = new Map();
  for (const node of document.querySelectorAll('#spread .pg > .tl')) {
    if (!range.intersectsNode(node)) continue;
    const k = Number(node.parentElement.dataset.k);
    const set = pages.get(k) || { m: node._m, wis: new Set() }; pages.set(k, set);
    for (const w of node.querySelectorAll('.w')) if (sel.containsNode(w, true)) set.wis.add(Number(w.dataset.wi));
  }
  const parts = []; let first = null;
  for (const [k, { m, wis }] of [...pages].sort((a, b) => a[0] - b[0])) {
    if (!wis.size) continue;
    first ??= k;
    let out = ''; let prev = -1;
    for (const j of [...wis].sort((a, b) => a - b)) {
      const w = m.words[j];
      if (prev >= 0) {
        const gap = m.T.slice(m.words[prev].b, w.a);
        if (j === prev + 1 && gap.includes('\n') && /[-\u00ad]$/.test(out) && /^\p{Ll}/u.test(w.t)) out = out.slice(0, -1); // re-join a hyphenated line end
        else out += ' ';
      }
      out += w.t; prev = j;
    }
    parts.push(out);
  }
  if (!parts.length) return null;
  return { text: parts.join(' '), k: first, label: printedLabel(it, first) || first + 1 };
}
export function quoteSelection() {
  const q = selectionQuote();
  if (!q) { toast('Select some text on the page first, then q'); return; }
  appendQuote(items[current()], q.text, q.label);
  getSelection().removeAllRanges(); hideQuote();
}
registerKey('q', quoteSelection, { help: ['q', 'quote the selected text into your note'], order: 33 });
// Copying from a raster page gives the words in reading order, not span soup.
document.addEventListener('copy', (e) => {
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  if (![...document.querySelectorAll('#spread .pg > .tl')].some((L) => range.intersectsNode(L))) return;
  const q = selectionQuote(); if (!q) return;
  e.clipboardData.setData('text/plain', q.text); e.preventDefault();
});

let qbtn = null, qT = null;
function hideQuote() { clearTimeout(qT); if (qbtn) qbtn.hidden = true; }
function showQuoteSoon() { clearTimeout(qT); qT = setTimeout(showQuote, 90); }
function showQuote() {
  if (state.view !== 'feed') return;
  const sel = getSelection();
  if (!sel.rangeCount || sel.isCollapsed || !sel.toString().trim()) { hideQuote(); return; }
  const range = sel.getRangeAt(0);
  if (!$('#spread').contains(range.commonAncestorContainer)) { hideQuote(); return; }
  const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
  const r = rects.at(-1); if (!r) { hideQuote(); return; }
  if (!qbtn) {
    qbtn = h('button', { id: 'tl-quote', hidden: true, title: 'Append the selection, with its page, to your note', onmousedown: (e) => e.preventDefault(), onclick: quoteSelection },
      'Quote → note', h('kbd', { textContent: 'q' }));
    document.body.append(qbtn);
  }
  qbtn.hidden = false;
  const bw = qbtn.offsetWidth, bh = qbtn.offsetHeight;
  const below = r.bottom + 8 + bh < innerHeight - 30;
  qbtn.style.left = Math.round(Math.min(innerWidth - bw - 8, Math.max(8, r.right - bw / 2))) + 'px';
  qbtn.style.top = Math.round(below ? r.bottom + 8 : r.top - bh - 8) + 'px';
}
on('item:shown', hideQuote);
on('nav', hideQuote);
addEventListener('wheel', () => { if (qbtn && !qbtn.hidden) hideQuote(); }, { passive: true });
