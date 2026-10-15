// Figure river (R): the figures of the arXiv papers in the current lane order,
// as a masonry wall that loads as you scroll. Click a figure (or Enter) to open
// its paper in the feed at the figure's page; hover for the full caption; z
// enlarges. A side-panel section shows the current paper's figures as a strip.
//
// Figure lists come from /figures (server/routes/65-figures.mjs, read from
// arXiv's HTML). A figure's PDF page is found by searching the first words of
// its caption in the PDF text, nearest the figure's position in the HTML first.
import { $, h, P, on, store, toast, sleep, lru, registerView, registerSection, keyHelp } from '../util.js';
import { items, LANES, LANE_COLORS } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, isFlow, pdfjs } from '../docs.js';
import { goPage, jumpTo } from '../nav.js';
import { setView } from '../chrome.js';

// ---------- figure lists ----------
const AID = /arxiv\.org\/(?:abs|pdf|html)\/((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?\/\d{7}))(?:v\d+)?(?:\.pdf)?(?:[?#].*)?$/;
export function arxivId(it) {
  if (it.id.startsWith('arxiv:')) return it.id.slice(6).replace(/v\d+$/, '');
  return AID.exec(it.url || '')?.[1] || AID.exec(it.page || '')?.[1] || null;
}
const lists = new Map(); // item id -> Promise<figure[]>
const ready = new Map(); // item id -> figure[] once loaded (for synchronous painting)
// A small priority queue, 4 requests at a time: the river and the panel go
// before prefetches. Prefetches (pri 0) are background work on the server
// too; asking again with a higher priority promotes them there.
const fq = []; const jobs = new Map(); let factive = 0;
const listUrl = (aid, bg) => '/figures?id=' + encodeURIComponent('arxiv:' + aid) + (bg ? '&bg=1' : '');
function pumpLists() {
  while (factive < 4 && fq.length) {
    fq.sort((a, b) => b.pri - a.pri);
    const job = fq.shift(); factive++; job.started = true;
    job.run().finally(() => { factive--; pumpLists(); });
  }
}
/** The figures of an arXiv item ([] for anything else or on failure). */
export function figuresOf(it, pri = 1) {
  const aid = arxivId(it);
  if (!aid) return Promise.resolve([]);
  const job = jobs.get(it.id);
  if (job) {
    if (pri > job.pri) {
      if (job.started && job.pri === 0 && !job.done) fetch(listUrl(aid, false)).catch(() => {}); // promote on the server
      job.pri = pri;
    }
    return lists.get(it.id);
  }
  const j = { id: it.id, pri };
  const p = new Promise((resolve) => { j.run = () => fetch(listUrl(aid, j.pri === 0))
    .then((r) => { if (!r.ok) throw new Error('figures ' + r.status); return r.json(); })
    .then((x) => { const out = Array.isArray(x) ? x : []; ready.set(it.id, out); j.done = true; resolve(out); })
    .catch(() => { lists.delete(it.id); jobs.delete(it.id); resolve([]); }); });
  jobs.set(it.id, j); fq.push(j); lists.set(it.id, p);
  pumpLists();
  return p;
}

// ---------- the figure's page in the PDF ----------
const norm = (s) => String(s).normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, '');
// PDFs get a second, text-only pdf.js document: its own worker thread, so
// searching never waits behind (or slows) the feed's page rendering. The
// bytes come from the browser cache.
const textDocs = new Map();
const textDoc = (it) => (it.kind !== 'pdf' ? openDoc(it) : lru(textDocs, it.id, async () => {
  const [lib, buf] = await Promise.all([pdfjs(), fetch(P(it.url)).then((r) => { if (!r.ok) throw new Error('PDF ' + r.status); return r.arrayBuffer(); })]);
  const pdf = await lib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise;
  return { n: pdf.numPages, pdf };
}, 3));
const texts = new Map(); // item id -> { d, pages: Promise<string>[] }
function pageText(it, d, k) {
  let c = texts.get(it.id);
  if (!c || c.d !== d) {
    c = { d, pages: [] }; texts.set(it.id, c);
    while (texts.size > 12) texts.delete(texts.keys().next().value);
  }
  c.pages[k] ||= d.pdf
    ? d.pdf.getPage(k + 1).then((pg) => pg.getTextContent()).then((tc) => norm(tc.items.map((x) => x.str).join(' ')))
    : Promise.resolve(norm(d.texts?.[k] || ''));
  return c.pages[k];
}
/** Search strings from the caption: runs of words with the math cut out, normalized
 *  to letters and digits (so spacing, hyphenation and ligatures do not matter). */
function needles(f) {
  const runs = []; let run = [];
  for (const w of (f.caption || '').split(/\s+/).slice(0, 40)) {
    if (/[\\^_{}=<>|∑∫√∈≤≥±×]/.test(w)) { if (run.length) runs.push(run); run = []; } else run.push(w);
  }
  if (run.length) runs.push(run);
  const out = runs.map((r) => norm(r.join(' ')).slice(0, 40)).filter((s) => s.length >= 14).slice(0, 2);
  if (!out.length) { const best = runs.map((r) => norm(r.join(' '))).sort((a, b) => b.length - a.length)[0]; if (best && best.length >= 8) out.push(best); }
  // The end of the first sentence too, for when the PDF's wording starts differently.
  const words = (f.caption || '').split(/[.!?]\s/)[0].split(/\s+/);
  if (words.length > 8) { const tail = norm(words.slice(-6).join(' ')); if (tail.length >= 16 && !out.some((o) => o.includes(tail))) out.push(tail); }
  return out;
}
const memo = new Map();
const saved = store.get('figpg', {});
const figKey = (it, f) => it.id + '#' + (f.id || f.n || f.label);
/** 0-based page (stable page for flow documents) of a figure, or null if not found. */
export function findPage(it, f) {
  const key = figKey(it, f);
  if (memo.has(key)) return memo.get(key);
  if (saved[key] != null) { const p = Promise.resolve(saved[key]); memo.set(key, p); return p; }
  const p = (async () => {
    const d = await textDoc(it);
    const ns = needles(f);
    if (!ns.length || !d.n) return null;
    const est = Math.round((f.at || 0) * (d.n - 1));
    const order = [...Array(d.n).keys()].sort((a, b) => Math.abs(a - est) - Math.abs(b - est) || a - b);
    // Best: the caption right after its own label ("Figure 3: …"); then after
    // some figure label (numbering can differ between the HTML and the PDF);
    // then anywhere. Pages nearest the figure's place in the HTML come first.
    const own = f.n ? new RegExp('(fig|figure|table|tab)' + norm(f.n) + '$') : null;
    const any = /(fig|figure|table|tab)[a-z]?\d+[a-z]?$/;
    let some = null, weak = null;
    for (const k of order) {
      const t = await pageText(it, d, k);
      for (const nd of ns) {
        for (let at = t.indexOf(nd); at >= 0; at = t.indexOf(nd, at + 1)) {
          const before = t.slice(Math.max(0, at - 14), at);
          if (own && own.test(before)) return k;
          if (any.test(before)) some ??= k;
          weak ??= k;
        }
      }
    }
    return some ?? weak;
  })();
  memo.set(key, p);
  p.then((k) => {
    if (k == null) return;
    saved[key] = k;
    const keys = Object.keys(saved); if (keys.length > 3000) for (const x of keys.slice(0, 500)) delete saved[x];
    store.set('figpg', saved);
  }, () => memo.delete(key));
  return p;
}

// Flow documents take stable pages through goPage once laid out.
let afterRender = null;
on('spread:rendered', ({ i }) => { if (afterRender?.i === i) { const fn = afterRender.fn; afterRender = null; fn(); } });

/** Open the item in the feed at the figure's page (the first page if it is not found). */
async function openFigure(i, f) {
  const it = items[i];
  hidePop(); closeLb();
  const p = findPage(it, f).catch(() => null);
  const k = await Promise.race([p, sleep(350).then(() => undefined)]); // wait briefly; never long
  const flow = isFlow(it);
  state.hist.set(i, []); state.zoom = false;
  state.start.set(i, k && !flow ? k : 0);
  const pos = state.order.indexOf(i);
  if (pos >= 0) { state.pos = pos; setView('feed'); } else jumpTo(i);
  const land = (kk) => {
    if (kk == null) { toast(`${f.label} not found`, 2200, { icon: 'search-x', sub: 'Not in the text; opened at the start' }); return; }
    if (flow || kk !== (state.start.get(i) ?? 0)) goPage(kk);
    toast(f.label, { icon: 'image', sub: `p. ${kk + 1}` });
  };
  if (k !== undefined) { if (flow && k != null) afterRender = { i, fn: () => land(k) }; else land(k); return; }
  toast(`Finding ${f.label}…`, 4000, { icon: 'search', kind: 'busy' });
  const kk = await p;
  // Only move if the reader is still where we put them.
  if (state.view !== 'feed' || current() !== i || (state.hist.get(i) || []).length || (state.start.get(i) ?? 0) !== 0) return;
  land(kk);
}

// ---------- drawing a figure ----------
const MIN_AR = 0.62, MAX_AR = 3.2, TABLE_AR = 1.3;
/** The figure's images in their arrangement (`lay`: rows and columns of
 *  parts, from the server), sized in px to fit w × h. */
function figArt(f, w, hgt, onFail) {
  const parts = f.parts || [{ img: f.img, w: f.w || 4, h: f.h || 3 }];
  const lay = f.lay ?? (parts.length > 1 ? ['r', ...parts.map((_, j) => j)] : 0);
  const arOf = (n) => {
    if (typeof n === 'number') return parts[n].w / parts[n].h;
    const a = n.slice(1).map(arOf);
    return n[0] === 'r' ? a.reduce((s, x) => s + x, 0) : 1 / a.reduce((s, x) => s + 1 / x, 0);
  };
  const ar = arOf(lay);
  const W = Math.min(w, hgt * ar), H = W / ar;
  let failed = 0;
  const node = (n) => {
    if (typeof n === 'number') {
      const im = h('img', { src: parts[n].img, alt: '', loading: 'lazy', decoding: 'async', draggable: false });
      const cell = h('div', { className: 'fg-part' }, im);
      im.onload = () => cell.classList.add('ok');
      im.onerror = () => { cell.classList.add('ok', 'broken'); if (++failed === parts.length) onFail?.(); };
      return cell;
    }
    const kids = n.slice(1); const a = kids.map(arOf);
    const row = n[0] === 'r';
    const tot = row ? a.reduce((s, x) => s + x, 0) : a.reduce((s, x) => s + 1 / x, 0);
    const el = h('div', { className: row ? 'fg-r' : 'fg-c' });
    kids.forEach((k, j) => { const c = node(k); c.style[row ? 'width' : 'height'] = ((100 * (row ? a[j] : 1 / a[j])) / tot).toFixed(3) + '%'; el.append(c); });
    return el;
  };
  return h('div', { className: 'fg-art', style: `width:${W.toFixed(1)}px;height:${H.toFixed(1)}px` }, node(lay));
}
/** Figures always; tables (and text figures) when the Tables toggle is on. */
const showable = (f) => !f.table || (R.tables && !!(f.html || f.img));
const figAr = (f) => (f.table ? TABLE_AR : Math.max(MIN_AR, Math.min(MAX_AR, (f.w || 4) / (f.h || 3))));
const yearOf = (it) => it.y || String(it.d || '').slice(0, 4);

// ---------- the river ----------
const GAP = 16, MIN_COL = 290, PAD = 8;
const root = h('section', { id: 'figures', hidden: true });
const head = h('div', { className: 'fg-head' });
const colsEl = h('div', { className: 'fg-cols', style: `--fg-gap:${GAP}px` });
const more = h('div', { className: 'fg-more' });
root.append(head, colsEl, more);
$('#main').append(root);

const R = {
  gen: 0, lane: null, papers: [], next: 0, tiles: [], cols: [], colH: [], colW: 0, txtH: 0,
  loading: false, sel: -1, scroll: 0, away: true, tables: store.get('figTables', false), byPaper: new Map(),
};
const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) loadMore(); }, { root, rootMargin: '0px 0px 1600px 0px' });
io.observe(more);

function build() {
  R.gen++; R.lane = state.lane; R.loading = false; R.sel = -1; hoverT = null;
  const ord = state.order;
  const from = Math.max(0, Math.min(state.pos, ord.length));
  R.papers = [...ord.slice(from), ...ord.slice(0, from)].filter((i) => arxivId(items[i]));
  R.next = 0; R.tiles = []; R.byPaper = new Map();
  layoutCols(true);
  root.scrollTop = 0;
  paintHead();
  if (!R.papers.length) { paintEmpty(); return; }
  more.replaceChildren(h('span', { className: 'fg-loading', textContent: 'Loading figures…' }));
  loadMore();
}
function paintHead() {
  const lane = state.lane === 'all' ? 'All lanes' : LANES[state.lane] || state.lane;
  const shown = R.tiles.filter((t) => !t.gone && !t.rest).length;
  head.replaceChildren(
    h('span', { className: 'fg-title', textContent: 'Figures' }),
    h('span', { className: 'fg-count', textContent: R.papers.length ? `${lane} · ${Math.min(R.next, R.papers.length)} of ${R.papers.length} arXiv papers · ${shown} ${R.tables ? 'figures and tables' : 'figures'}` : lane }),
    h('span', { className: 'fg-sp' }),
    h('button', { className: 'ghost fg-tbl-btn' + (R.tables ? ' on' : ''), textContent: 'Tables', title: 'Also show tables (and text figures)', onclick: () => { R.tables = !R.tables; store.set('figTables', R.tables); build(); } }),
    h('span', { className: 'fg-hint', textContent: 'j k ← → move · Enter open at the figure · z enlarge · o arXiv' }));
}
function paintEmpty() {
  const withArxiv = {};
  for (const it of items) if (arxivId(it)) withArxiv[it.lane] = (withArxiv[it.lane] || 0) + 1;
  const lanes = Object.entries(withArxiv).sort((a, b) => b[1] - a[1]);
  more.replaceChildren(h('div', { className: 'fg-empty' },
    h('p', { textContent: lanes.length ? 'No arXiv papers in this lane. Figures come from arXiv’s HTML versions of papers.' : 'No arXiv papers in the corpus yet. Figures come from arXiv’s HTML versions of papers.' }),
    lanes.length ? h('div', { className: 'links' }, ...lanes.map(([l, n]) => h('button', { className: 'ghost', textContent: `${LANES[l] || l} · ${n}`, onclick: () => { const b = [...document.querySelectorAll('#lanes button')].find((x) => x.firstChild?.textContent === LANES[l]); b?.click(); } }))) : null));
}

/** Columns for the current width; re-places every tile when the count or width changed. */
function layoutCols(force) {
  const W = root.clientWidth - 2 * 18;
  if (W <= 0) return;
  const n = Math.max(1, Math.floor((W + GAP) / (MIN_COL + GAP)));
  const colW = (W - GAP * (n - 1)) / n;
  if (!force && n === R.cols.length && Math.abs(colW - R.colW) < 0.5) return;
  const anchor = R.tiles.find((t) => !t.gone && t.el.isConnected && t.el.getBoundingClientRect().bottom > root.getBoundingClientRect().top + 40);
  R.colW = colW;
  R.cols = [...Array(n)].map(() => h('div', { className: 'fg-col' }));
  R.colH = R.cols.map(() => 0);
  colsEl.replaceChildren(...R.cols);
  for (const t of R.tiles) if (!t.gone) place(t);
  if (anchor && !force) anchor.el.scrollIntoView({ block: 'start' });
}
function sizeBox(t) {
  const bh = t.f.table ? R.colW / TABLE_AR : R.colW / figAr(t.f);
  t.box.style.height = bh.toFixed(1) + 'px';
  if (t.f.table) requestAnimationFrame(() => fitTable(t));
  else if (t.artW !== R.colW) { t.box.replaceChildren(figArt(t.f, R.colW - 2 * PAD, bh - 2 * PAD, () => drop(t))); t.artW = R.colW; }
  return bh;
}
function fitTable(t) {
  const inner = t.box.firstChild; if (!inner) return;
  inner.style.transform = '';
  const s = Math.min(1, (R.colW - 2) / Math.max(1, inner.scrollWidth));
  inner.style.transform = `scale(${s.toFixed(3)})`;
}
/** Masonry: each tile goes to the shortest column. Heights are known in
 *  advance (aspect boxes plus a fixed caption block), so nothing is measured. */
function place(t) {
  let c = 0;
  for (let j = 1; j < R.colH.length; j++) if (R.colH[j] < R.colH[c] - 1) c = j;
  t.c = c; t.y = R.colH[c];
  R.cols[c].append(t.el);
  if (t.rest) t.hgt = MORE_H;
  else {
    const bh = sizeBox(t);
    if (!R.txtH) R.txtH = t.el.querySelector('.fg-txt').offsetHeight || 76;
    t.hgt = bh + R.txtH;
  }
  R.colH[c] += t.hgt + GAP;
}
function drop(t) {
  if (t.gone) return;
  t.gone = true; t.el.remove();
  R.colH[t.c] -= t.hgt + GAP; // later tiles in that column move up; arithmetic stays close enough
  paintHead();
}

function makeTile(i, f) {
  const it = items[i];
  const box = h('div', { className: 'fg-box' + (f.table ? ' tbl' : '') });
  if (f.table && f.html) { const inner = h('div', { className: 'fg-tbl-in' }); inner.innerHTML = f.html; box.append(inner); }
  const el = h('figure', { className: 'fg-tile' }, box,
    h('figcaption', { className: 'fg-txt' },
      h('div', { className: 'fg-cap' }, h('b', { textContent: f.label.replace(/^Figure/, 'Fig.') }), f.caption || h('i', { textContent: 'uncaptioned' })),
      h('div', { className: 'fg-meta' },
        h('i', { className: 'dot', style: `background:${LANE_COLORS[it.lane] || '#6b5a3a'}` }),
        h('span', { className: 'pt', textContent: it.t }),
        h('span', { className: 'yr', textContent: String(yearOf(it)) }))));
  const t = { i, f, el, box };
  el.onclick = () => openFigure(i, f);
  tileOf.set(el, t);
  if (!R.byPaper.has(i)) R.byPaper.set(i, []);
  R.byPaper.get(i).push(t);
  return t;
}
function addTile(t) { t.k = R.tiles.length; R.tiles.push(t); place(t); }

// Hover selects (so z, Enter and o act on what you point at), shows the full
// caption and warms the paper's PDF. Only real pointer movement counts: Chrome
// also fires mouse events when tiles scroll under a still pointer, which would
// steal the keyboard's selection.
const tileOf = new WeakMap();
let px = -1, py = -1, hoverT = null, warmHover = null;
function hoverTile(t) {
  if (t === hoverT) return;
  for (const x of (hoverT && R.byPaper.get(hoverT.i)) || []) x.el.classList.remove('kin');
  hoverT = t;
  clearTimeout(popTimer); clearTimeout(warmHover); hidePop();
  if (!t) return;
  for (const x of R.byPaper.get(t.i) || []) x.el.classList.add('kin');
  select(t.k, { scroll: false, pop: false });
  if (!t.f) return;
  const it = items[t.i];
  popTimer = setTimeout(() => showPop(t.el, t.i, t.f), 280);
  warmHover = setTimeout(() => { openDoc(it).catch(() => {}); findPage(it, t.f).catch(() => {}); }, 220); // so the click lands at once
}
root.addEventListener('mousemove', (e) => {
  if (e.clientX === px && e.clientY === py) return;
  px = e.clientX; py = e.clientY;
  hoverTile(tileOf.get(e.target.closest('.fg-tile, .fg-moretile')) || null);
});
root.addEventListener('mouseleave', () => hoverTile(null));

// A paper shows its first PER_PAPER figures; a small tile holds the rest
// and expands them in place (Enter or click).
const PER_PAPER = 6, MORE_H = 46;
function moreTile(i, rest) {
  const el = h('div', { className: 'fg-moretile', style: `height:${MORE_H}px` },
    h('span', { className: 'n', textContent: `+${rest.length} more` }),
    h('span', { className: 'pt', textContent: items[i].t }));
  const t = { i, rest, el };
  el.onclick = () => expand(t);
  tileOf.set(el, t);
  return t;
}
function expand(t) {
  const at = R.tiles.indexOf(t); if (at < 0) return;
  const fresh = t.rest.map((f) => makeTile(t.i, f));
  R.tiles.splice(at, 1, ...fresh);
  R.tiles.forEach((x, j) => { x.k = j; });
  t.el.remove();
  // Tiles before this one land where they were; the rest re-flow below.
  layoutCols(true);
  select(fresh[0].k, { scroll: false });
  paintHead();
}

async function loadMore() {
  if (R.loading || state.view !== 'figures' || R.next >= R.papers.length) return;
  R.loading = true;
  const gen = R.gen;
  let added = 0;
  while (added < 24 && R.next < R.papers.length) {
    const batch = R.papers.slice(R.next, R.next + 4);
    const ps = batch.map((i) => figuresOf(items[i], 2));
    for (const i of R.papers.slice(R.next + 4, R.next + 12)) figuresOf(items[i], 0); // prefetch the next lists
    for (let j = 0; j < batch.length; j++) {
      const list = await ps[j];
      if (gen !== R.gen) return;
      R.next++;
      const figs = list.filter(showable);
      const cut = figs.length > PER_PAPER + 1 ? PER_PAPER : figs.length;
      for (const f of figs.slice(0, cut)) { addTile(makeTile(batch[j], f)); added++; }
      if (cut < figs.length) addTile(moreTile(batch[j], figs.slice(cut)));
      paintHead();
    }
  }
  R.loading = false;
  warmVisible();
  if (R.next >= R.papers.length) more.replaceChildren(h('span', { className: 'fg-end', textContent: `End of the lane · ${R.papers.length} arXiv papers` }));
  // Still short of the screen? Keep going.
  if (root.scrollHeight - root.scrollTop - root.clientHeight < 1600) loadMore();
}

// ---------- selection, popover, lightbox ----------
let popTimer = null;
function select(k, { scroll = true, pop = true } = {}) {
  const prev = R.tiles[R.sel]; if (prev) prev.el.classList.remove('sel');
  const t = R.tiles[k]; if (!t) return;
  R.sel = k; t.el.classList.add('sel');
  if (scroll) t.el.scrollIntoView({ block: 'nearest' });
  if (lbOpen()) paintLb();
  else if (pop && t.f) { clearTimeout(popTimer); hidePop(); popTimer = setTimeout(() => showPop(t.el, t.i, t.f), 450); }
}
const live = () => R.tiles.filter((t) => !t.gone);
const figTiles = () => R.tiles.filter((t) => !t.gone && t.f);
function step(d) {
  const ts = lbOpen() ? figTiles() : live(); if (!ts.length) return;
  const at = ts.indexOf(R.tiles[R.sel]);
  const next = at < 0 ? firstVisible() : ts[Math.max(0, Math.min(ts.length - 1, at + d))];
  if (next) select(next.k);
}
function firstVisible() {
  const top = root.getBoundingClientRect().top;
  return live().filter((t) => t.el.getBoundingClientRect().bottom > top + 20).sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top || a.c - b.c)[0];
}
/** Arrow keys: up/down within a column, left/right to the nearest tile in the next column. */
function spatial(dx, dy) {
  const cur = R.tiles[R.sel];
  if (!cur || cur.gone) { const t = firstVisible(); if (t) select(t.k); return; }
  let target;
  if (dy) {
    const col = [...R.cols[cur.c].children];
    const el = col[col.indexOf(cur.el) + dy];
    target = el && R.tiles.find((t) => t.el === el);
  } else {
    const c = cur.c + dx; if (c < 0 || c >= R.cols.length) return;
    const mid = cur.y + cur.hgt / 2;
    target = live().filter((t) => t.c === c).sort((a, b) => Math.abs(a.y + a.hgt / 2 - mid) - Math.abs(b.y + b.hgt / 2 - mid))[0];
  }
  if (target) select(target.k);
}

const pop = h('div', { id: 'fg-pop', hidden: true });
document.body.append(pop);
function showPop(anchor, i, f, { image = false } = {}) {
  if (!anchor.isConnected || lbOpen()) return;
  const it = items[i];
  const w = image ? 460 : 400;
  pop.style.width = w + 'px';
  pop.replaceChildren(...[
    image && !f.table ? h('div', { className: 'fg-pop-art' }, figArt(f, w - 28, 300)) : null,
    h('div', { className: 'fg-pop-cap' }, h('b', { textContent: f.label }), f.caption || '(no caption)'),
    h('div', { className: 'fg-pop-meta', textContent: [it.t, it.a, yearOf(it)].filter(Boolean).join(' · ') }),
  ].filter(Boolean));
  pop.hidden = false;
  const r = anchor.getBoundingClientRect(); const ph = pop.offsetHeight;
  const left = r.right + 12 + w < innerWidth ? r.right + 12 : Math.max(8, r.left - 12 - w);
  pop.style.left = left + 'px';
  pop.style.top = Math.max(44, Math.min(r.top, innerHeight - ph - 10)) + 'px';
}
function hidePop() { pop.hidden = true; }
// setView hides the root before calling hide(), so remember the scroll as it happens.
let warmT = null;
root.addEventListener('scroll', () => {
  hoverTile(null);
  if (!root.hidden) R.scroll = root.scrollTop;
  clearTimeout(warmT); warmT = setTimeout(warmVisible, 300);
}, { passive: true });
/** Have the server fetch the PDFs of the papers on screen (and just below), so a click opens fast. */
function warmVisible() {
  if (state.view !== 'figures') return;
  const top = root.scrollTop - colsEl.offsetTop, H = root.clientHeight;
  const seen = new Set();
  for (const t of R.tiles) if (!t.gone && t.y + t.hgt > top && t.y < top + 1.6 * H) seen.add(t.i);
  const urls = [...seen].map((i) => items[i]).filter((it) => it.kind === 'pdf').map((it) => it.url).slice(0, 10);
  if (urls.length) fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls, pri: 50, group: 'figures-pdfs' }) }).catch(() => {});
}

const lb = h('div', { id: 'fg-lb', hidden: true });
document.body.append(lb);
lb.onclick = (e) => { if (e.target === lb) closeLb(); };
const lbOpen = () => !lb.hidden;
function paintLb() {
  const t = R.tiles[R.sel]; if (!t?.f) return;
  const it = items[t.i]; const f = t.f;
  const maxW = innerWidth * 0.9, maxH = innerHeight * 0.74;
  let art;
  if (f.table && f.html) { art = h('div', { className: 'fg-lb-tbl' }); art.innerHTML = f.html; } else art = figArt(f, maxW - 40, maxH - 40);
  const at = figTiles().indexOf(t);
  lb.replaceChildren(h('div', { className: 'fg-lb-in' },
    h('div', { className: 'fg-lb-art' }, art),
    h('div', { className: 'fg-lb-cap' }, h('b', { textContent: f.label }), f.caption || ''),
    h('div', { className: 'fg-lb-meta' },
      h('span', { textContent: [it.t, it.a, yearOf(it)].filter(Boolean).join(' · ') }),
      h('span', { className: 'k', textContent: `${at + 1} / ${figTiles().length} · ← → or j k next · Enter open at the figure · o arXiv · Esc close` }))));
}
function openLb() {
  if (!R.tiles[R.sel]) step(0);
  if (R.tiles[R.sel]?.rest) select(R.tiles.slice(R.sel).find((x) => x.f && !x.gone)?.k ?? -1, { scroll: false });
  if (!R.tiles[R.sel]?.f) return;
  hidePop(); lb.hidden = false; paintLb();
}
function closeLb() { lb.hidden = true; }

// Keys inside the river (the feed's j/k/Enter/z keep their meaning there).
document.addEventListener('keydown', (e) => {
  if (state.view !== 'figures' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (!$('#keys').hidden || !$('#search').hidden) return;
  const t = R.tiles[R.sel];
  const act = {
    j: () => step(1), k: () => step(-1),
    ArrowRight: () => (lbOpen() ? step(1) : spatial(1, 0)), ArrowLeft: () => (lbOpen() ? step(-1) : spatial(-1, 0)),
    ArrowDown: () => (lbOpen() ? step(1) : spatial(0, 1)), ArrowUp: () => (lbOpen() ? step(-1) : spatial(0, -1)),
    Enter: () => t && (t.rest ? expand(t) : openFigure(t.i, t.f)),
    z: () => (lbOpen() ? closeLb() : openLb()),
    o: () => t?.f && window.open(t.f.href, '_blank', 'noopener'),
    ' ': () => root.scrollBy({ top: (e.shiftKey ? -1 : 1) * root.clientHeight * 0.85 }),
    Escape: () => (lbOpen() ? closeLb() : setView('feed')),
  }[e.key];
  if (!act) return;
  e.preventDefault(); e.stopPropagation();
  act();
}, true);

registerView('figures', {
  label: 'Figures', key: 'R', order: 2, roots: () => [root],
  show() {
    const back = R.away; R.away = false;
    if (R.lane !== state.lane || !R.papers.length) build();
    else { if (back) root.scrollTop = R.scroll; layoutCols(false); loadMore(); }
  },
  hide() { R.away = true; hidePop(); closeLb(); },
});
keyHelp.push({ label: 'R', text: 'figure river: the figures of the lane’s arXiv papers (j k ← → move · Enter open at the figure · z enlarge · o arXiv)', order: 64 });

// ---------- panel section: the current paper's figures ----------
let scanFor = null;
registerSection({
  id: 'figures', title: 'Figures', order: 35,
  render(it, i) {
    if (!arxivId(it)) return null;
    const strip = h('div', { className: 'fg-strip' });
    const fill = (figs) => {
      if (state.panelItem !== it.id) return;
      const sec = document.getElementById('sec-figures');
      const show = figs.filter(showable);
      if (sec) { sec.hidden = !show.length; const t = sec.querySelector('h3'); if (t) t.textContent = `Figures · ${show.filter((f) => !f.table).length}`; }
      strip.replaceChildren(...show.map((f) => thumb(it, i, f)));
      markStrip();
      scanPages(it, i, show);
    };
    const now = ready.get(it.id);
    if (now) queueMicrotask(() => fill(now));
    else { strip.append(...[0, 1, 2].map(() => h('div', { className: 'fg-th ph' }))); figuresOf(it, 3).then(fill); }
    // The next items' lists, so their strips paint at once.
    for (const j of state.order.slice(state.pos + 1, state.pos + 4)) figuresOf(items[j], 0);
    return strip;
  },
});
function thumb(it, i, f) {
  const TH = 62;
  const ar = f.table ? TABLE_AR : Math.max(0.5, Math.min(3, (f.w || 4) / (f.h || 3)));
  const w = Math.round(TH * ar);
  const el = h('button', { className: 'fg-th' + (f.table ? ' tbl' : ''), style: `width:${w + 6}px`, title: '' },
    f.table && !f.img ? h('span', { className: 'tt', textContent: 'Table' }) : figArt(f, w, TH),
    h('span', { className: 'no', textContent: (f.n || '·') }));
  el._fig = f;
  el.onclick = async () => {
    hidePop();
    const p = findPage(it, f).catch(() => null);
    let k = await Promise.race([p, sleep(300).then(() => undefined)]);
    if (k === undefined) { toast(`Finding ${f.label}…`, 4000, { icon: 'search', kind: 'busy' }); k = await p; }
    if (current() !== i || state.view !== 'feed') return;
    if (k == null) { toast(`${f.label} not found`, 2200, { icon: 'search-x', sub: 'Not in the text; showing the first page' }); goPage(0); return; }
    goPage(k); toast(f.label, { icon: 'image', sub: `p. ${k + 1}` });
  };
  let tm = null;
  el.onmouseenter = () => { tm = setTimeout(() => showPop(el, i, f, { image: true }), 220); };
  el.onmouseleave = () => { clearTimeout(tm); hidePop(); };
  return el;
}
/** After the reader settles on a paper, find every figure's page (one at a time) to label the strip. */
function scanPages(it, i, figs) {
  scanFor = it.id;
  setTimeout(async () => {
    for (const f of figs) {
      if (scanFor !== it.id || current() !== i || state.view !== 'feed') return;
      const k = await findPage(it, f).catch(() => null);
      const el = [...document.querySelectorAll('#sec-figures .fg-th')].find((x) => x._fig === f);
      if (el && k != null) { el.dataset.k = k; el.querySelector('.no').textContent = `${f.n || '·'} · p${k + 1}`; }
      markStrip();
    }
  }, 1500);
}
/** Light the figures on the pages on screen. */
function markStrip() {
  const i = current(); if (i == null) return;
  const s = state.start.get(i) ?? 0; const shown = state.shown || 1;
  let first = null;
  for (const el of document.querySelectorAll('#sec-figures .fg-th')) {
    const k = el.dataset.k === undefined ? -1 : Number(el.dataset.k);
    const on = !isFlow(items[i]) && k >= s && k < s + shown;
    el.classList.toggle('cur', on);
    if (on && !first) first = el;
  }
  // Keep the lit thumbnail in view (sideways only: never scroll the panel itself).
  const strip = first?.parentElement;
  if (strip && (first.offsetLeft < strip.scrollLeft || first.offsetLeft + first.offsetWidth > strip.scrollLeft + strip.clientWidth)) strip.scrollLeft = first.offsetLeft - 8;
}
on('spread:rendered', markStrip);
on('view:changed', () => { hidePop(); if (state.view !== 'figures') closeLb(); });
