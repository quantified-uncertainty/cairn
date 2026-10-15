// Feeds (D): the typed parts of every item across a lane, as skimmable feeds.
// Pictures (each item's top graph, or its top two or three), findings,
// numbers, tables, equations, definitions, limits, posts' own voice and
// highlights, laid out as a Pinterest-style Board (one feed, masonry) or
// TweetDeck-style Columns (one stream per feed, side by side). Rest the
// pointer on a card and it opens large on the right (peek.js); Enter or a
// click opens the item at that place (arXiv: the HTML version at the anchor;
// Shift: the PDF page); q quotes it into the item's note, s saves the item,
// x hides the card.
//
// Data: GET /extract/feed and POST /extract/verdict (server/routes/66-extract.mjs;
// docs/feeds/spec.md sections 3-4). Nothing here runs while another view is
// showing, except finishing a dive into an item and posting telemetry; the
// only hook on the main feed is one spread:rendered listener that does a
// single comparison unless a dive is pending.
import { $, h, P, on, store, toast, sleep, keymap, keyHelp, registerView } from '../util.js';
import { items, LANES, COUNTS, LANE_COLORS, byId } from '../corpus.js';
import { state, learn } from '../state.js';
import { openDoc, scanUrl } from '../docs.js';
import { setView, setLane, paintSaved } from '../chrome.js';
import { jumpTo } from '../nav.js';
import { showFeed } from '../feed.js';
import { live, elToCol } from '../flow.js';
import { currentWords, highlight } from '../text.js';
import { appendQuote } from '../notes.js';
import { figArt, figuresOf, openFigure, arxivId } from './figures.js';
import { attachPeek, showPeek, closePeek, pinPeek, peekState, sharpImg } from './peek.js';

// ---------------------------------------------------------------- feeds
const FEEDS = {
  pictures: { label: 'Pictures', kinds: ['arxiv', 'post', 'web', 'scan'], src: 'each item’s top graph or picture: figures from arXiv’s HTML papers, post preview and body images, web page images, and plates from old books' },
  findings: { label: 'Findings', kinds: ['arxiv', 'post'], src: 'result sentences (“we find that…”) and lists of contributions in arXiv papers, and claim lists in posts' },
  numbers: { label: 'Numbers', kinds: ['arxiv', 'post', 'web'], src: 'result sentences with a quantity in arXiv papers, and probability statements in posts and wiki pages' },
  tables: { label: 'Tables', kinds: ['arxiv', 'web', 'post'], src: 'tables from arXiv’s HTML papers, wiki pages and posts' },
  equations: { label: 'Equations', kinds: ['arxiv'], src: 'key display equations in arXiv’s HTML papers (cited, or introduced as an objective, loss or bound)' },
  definitions: { label: 'Definitions', kinds: ['arxiv', 'web'], src: 'definition and theorem blocks and defined terms in arXiv papers, and definition lists on wiki pages' },
  limits: { label: 'Limits', kinds: ['arxiv', 'web'], src: 'limitations, future work and open questions in arXiv papers and wiki pages' },
  posts: { label: 'Posts', kinds: ['post'], src: 'LessWrong, Alignment Forum and EA Forum posts: TL;DRs, epistemic status lines, bold pull lines, openings and block quotes' },
  highlights: { label: 'Highlights', kinds: ['hl'], src: 'model-picked (or hand-picked) figures, claim, number, passage and question per item, from data/highlights.json' },
};
const ORDER = Object.keys(FEEDS);
const CHIP = { claims: 'Contributions', definition: 'Definition', theorem: 'Theorem', limitation: 'Limitation', question: 'Open question', tldr: 'TL;DR', status: 'Epistemic status', pull: 'Pull', opener: 'Opening', quote: 'Quote' };
const TYPE_LABEL = { lead: 'Figure', highlight: 'Highlight', finding: 'Finding', claims: 'Contributions', number: 'Number', table: 'Table', equation: 'Equation', definition: 'Definition', theorem: 'Theorem', limitation: 'Limitation', question: 'Open question', tldr: 'TL;DR', status: 'Epistemic status', pull: 'Pull quote', opener: 'Opening', quote: 'Quote', image: 'Picture', figure: 'Figure', plate: 'Plate' };
const COLS = [240, 300, 380, 480], STREAMS = [400, 480, 560];
const GAP = 16, PAD = 8, MAX_CARDS = 2000, TEXT_MAX = 440, TABLE_MAX = 460;
const srcKind = (it) => (it.id.startsWith('arxiv:') ? 'arxiv' : it.kind === 'scan' ? 'scan' : it.kind === 'web' ? 'web' : it.kind === 'html' && /graphql/.test(it.url || '') ? 'post' : 'none');
const itemOf = (card) => items[byId.get(card.id)];
const yearOf = (it) => it?.y || String(it?.d || '').slice(0, 4);
const clampAr = (ar) => Math.max(0.62, Math.min(3.2, ar || 1.6));
const laneColor = (it) => LANE_COLORS[it?.lane] || '#6b5a3a';

const cfg = { layout: 'board', type: 'pictures', streams: ['pictures', 'findings', 'numbers', 'definitions', 'limits', 'posts'], colMin: 300, streamW: 480, ...store.get('feeds', {}) };
if (!FEEDS[cfg.type]) cfg.type = 'pictures';
cfg.streams = cfg.streams.filter((t) => FEEDS[t]);
const saveCfg = () => store.set('feeds', cfg);
const hidden = new Set(store.get('feeds:hidden', []));
const hiddenItems = store.get('feeds:hiddenItems', {});
const undoStack = [];

// ---------------------------------------------------------------- telemetry
const tbuf = [];
const tel = (act, feed, card, ms) => { tbuf.push({ t: Date.now(), type: 'feeds', act, feed, cid: card?.cid, ...(ms != null ? { ms } : {}) }); };
function tflush(beacon) {
  if (!tbuf.length) return;
  const body = JSON.stringify(tbuf.splice(0));
  if (beacon && navigator.sendBeacon) navigator.sendBeacon('/events', new Blob([body], { type: 'text/plain' }));
  else fetch('/events', { method: 'POST', body, keepalive: true }).catch(() => {});
}
setInterval(tflush, 15000);
addEventListener('pagehide', () => tflush(true));

// ---------------------------------------------------------------- data
// One list per (feed, lane): the cards received so far, append-only (the
// server keeps offsets stable within a run). Surfaces (a board, or a stream
// in the column deck) read from it.
const lists = new Map();
let inflight = 0;
function listOf(type, lane) {
  const k = type + '|' + lane;
  if (!lists.has(k)) lists.set(k, { type, lane, cards: [], seen: new Set(), leads: {}, next: 0, done: false, pending: 0, walked: 0, total: 0, busy: false, err: 0, missing: false, subs: new Set() });
  return lists.get(k);
}
/** GET /extract/feed: `limit` cards from `offset`, waiting up to 1.5 s for them. */
async function getFeed(type, lane, offset, limit = 40) {
  const r = await fetch(`/extract/feed?type=${type}&lane=${encodeURIComponent(lane)}&offset=${offset}&limit=${limit}&wait=1500`);
  if (r.status === 404) { const e = new Error('no route'); e.missing = true; throw e; }
  if (!r.ok) throw new Error('feed ' + r.status);
  return r.json();
}
async function fetchMore(L) {
  if (L.busy || L.done || L.missing || inflight >= 3) return;
  L.busy = true; inflight++;
  const t0 = performance.now();
  try {
    const r = await getFeed(L.type, L.lane, L.next);
    for (const c of r.cards || []) if (c?.cid && !L.seen.has(c.cid)) { L.seen.add(c.cid); L.cards.push(c); }
    Object.assign(L.leads, r.leads || {});
    L.next = r.next ?? L.next + (r.cards || []).length;
    L.done = !!r.done; L.pending = r.pending || 0; L.walked = r.walked || 0; L.total = r.total || 0; L.err = 0;
    // An empty, quick answer (the server had nothing ready): do not spin.
    if (!(r.cards || []).length && !L.done && performance.now() - t0 < 300) await sleep(500);
  } catch (e) {
    if (e.missing) L.missing = true;
    L.err++;
    if (!L.missing) await sleep(Math.min(10000, 600 * 2 ** L.err));
  } finally { L.busy = false; inflight--; }
  for (const s of L.subs) s.onData();
  for (const x of lists.values()) if (x !== L && x.subs.size && !x.busy) for (const s of x.subs) s.pump(); // a freed slot
  paintHead();
}

// ---------------------------------------------------------------- images
// Sizes of pictures whose aspect is unknown (post and web images): preloaded,
// at most 6 at a time, 1.2 s each; plates pass an ink test first.
const sizes = new Map();
const imgQ = []; let imgActive = 0;
function pumpImgs() {
  while (imgActive < 6 && imgQ.length) {
    const j = imgQ.shift(); imgActive++;
    const im = new Image(); im.referrerPolicy = 'no-referrer'; im.decoding = 'async';
    let done = false;
    const end = (v) => { if (done) return; done = true; imgActive--; j.resolve(v); pumpImgs(); };
    const t = setTimeout(() => end({ w: 0, h: 0, slow: true }), 1200);
    im.onload = () => { clearTimeout(t); end({ w: im.naturalWidth, h: im.naturalHeight }); };
    im.onerror = () => { clearTimeout(t); end(null); };
    im.src = j.url;
  }
}
function sizeOf(url) {
  if (!sizes.has(url)) sizes.set(url, new Promise((resolve) => { imgQ.push({ url, resolve }); pumpImgs(); }));
  return sizes.get(url);
}
const picSrc = (p) => (p.type === 'plate' || /^https?:\/\/([^/]*\.)?archive\.org\//.test(p.img || '') ? P(p.img) : p.img);

// The ink test for plate candidates: a real picture has ink on many rows,
// is not mostly dark (a cover, a scanner bed) and has few mid greys (paper
// texture, bleed-through). Read from the w200 thumbnail through the proxy.
const inkQ = []; let inkActive = 0;
const verdicts = store.get('feeds:ink', {});
function inkTest(id, pic) {
  const key = id + '#' + pic.pid;
  if (verdicts[key]) return Promise.resolve(verdicts[key]);
  return new Promise((resolve) => { inkQ.push({ id, pic, key, resolve }); pumpInk(); });
}
function pumpInk() {
  while (inkActive < 4 && inkQ.length) {
    const j = inkQ.shift(); inkActive++;
    runInk(j.pic).then((v) => {
      verdicts[j.key] = v;
      if (Object.keys(verdicts).length > 4000) for (const k of Object.keys(verdicts).slice(0, 500)) delete verdicts[k];
      store.set('feeds:ink', verdicts);
      fetch('/extract/verdict', { method: 'POST', body: JSON.stringify({ id: j.id, pid: j.pic.pid, ok: v.ok }) }).catch(() => {});
      j.resolve(v);
    }, () => j.resolve({ ok: false, err: true })).finally(() => { inkActive--; pumpInk(); });
  }
}
async function runInk(pic) {
  const im = new Image();
  im.src = P(String(pic.img).replace(/_w\d+\.jpg$/, '_w200.jpg'));
  await im.decode();
  const W = im.naturalWidth, H = im.naturalHeight;
  const x0 = Math.round(W * 0.06), y0 = Math.round(H * 0.08), w = W - 2 * x0, hh = H - 2 * y0;
  const c = document.createElement('canvas'); c.width = w; c.height = hh;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(im, x0, y0, w, hh, 0, 0, w, hh);
  const d = g.getImageData(0, 0, w, hh).data;
  const grey = new Uint8Array(w * hh); const hist = new Uint32Array(256);
  for (let p = 0, q = 0; q < grey.length; p += 4, q++) { const v = (0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]) | 0; grey[q] = v; hist[v]++; }
  let acc = 0, bg = 255; const target = 0.9 * grey.length;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) { bg = v; break; } }
  let dark = 0, mid = 0, rows = 0;
  for (let y = 0; y < hh; y++) {
    let rd = 0;
    for (let x = 0; x < w; x++) { const v = grey[y * w + x]; if (v < bg - 60) { dark++; rd++; } else if (v < bg - 25) mid++; }
    if (rd > 0.02 * w) rows++;
  }
  const n = w * hh;
  const r = { dark: dark / n, mid: mid / n, rowsInk: rows / hh, w: W, h: H };
  r.ok = r.rowsInk >= 0.2 && r.dark < 0.6 && r.mid < 0.2;
  return r;
}

/** Get a card ready to place: sizes for pictures of unknown aspect, the ink
 *  test for plates. Resolves to the pictures to show ([] for text cards), or
 *  null when the card should not be placed. */
async function prepare(card) {
  const pics = card.pics;
  if (!pics?.length) return card.type === 'lead' ? null : [];
  if (pics.some((p) => p.verify)) {
    // Plates: try candidates in order, two at a time; the first that passes.
    const cands = pics.filter((p) => p.verdict !== false);
    for (let k = 0; k < cands.length; k += 2) {
      const vs = await Promise.all(cands.slice(k, k + 2).map((p) => (p.verify ? inkTest(card.id, p) : Promise.resolve({ ok: true }))));
      const j = vs.findIndex((v) => v.ok);
      if (j >= 0) { const p = { ...cands[k + j] }; if (vs[j].w) { p._w = vs[j].w; p._h = vs[j].h; } return [p]; }
    }
    return null;
  }
  const want = card.show === 'few' ? pics.slice(0, 3) : pics.slice(0, 1);
  const out = await Promise.all(want.map(async (p) => {
    if (p.verdict === false) return null;
    if (p.type === 'table' || (p.w && p.h) || p.parts?.every((x) => x.w && x.h)) return p;
    if (!p.img) return null;
    const s = await sizeOf(picSrc(p));
    if (!s) return null; // broken before placement: drop
    return { ...p, _w: s.w || 16, _h: s.h || 10, _slow: !!s.slow };
  }));
  const ok = out.filter(Boolean);
  if (!ok.length) return card.type === 'lead' ? null : [];
  return ok;
}
const arOfPic = (p) => (p.type === 'table' ? 1.3 : clampAr((p.w || p._w) / (p.h || p._h)));

// ---------------------------------------------------------------- HTML
/** Sanitized HTML (the server cleans it too): no scripts, handlers, links or ids. */
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'textarea', 'select', 'base', 'video', 'audio']);
function safe(html) {
  const t = document.createElement('template');
  t.innerHTML = String(html || '');
  for (const el of [...t.content.querySelectorAll('*')]) {
    if (DROP.has(el.localName)) { el.remove(); continue; }
    for (const a of [...el.attributes]) {
      const n = a.name.toLowerCase();
      if (n.startsWith('on') || n === 'id' || n === 'href' || n === 'xlink:href' || (n === 'style' && /url\(|expression/i.test(a.value)) || (n === 'src' && !/^(https?:|\/)/.test(a.value))) el.removeAttribute(a.name);
    }
    if (el.localName === 'img') { el.loading = 'lazy'; el.decoding = 'async'; el.referrerPolicy = 'no-referrer'; }
  }
  return t.content;
}
const htmlEl = (cls, html) => { const d = h('div', { className: cls }); d.append(safe(html)); return d; };
/** The sentence with `value` marked (both ends of "X → Y" when it is a change). */
function marked(text, value) {
  const frag = document.createDocumentFragment();
  const parts = String(value || '').split(/\s*→\s*/).filter(Boolean);
  let rest = String(text || '');
  for (const v of parts) {
    const k = rest.indexOf(v);
    if (k < 0) continue;
    frag.append(rest.slice(0, k), h('mark', { textContent: v }));
    rest = rest.slice(k + v.length);
  }
  frag.append(rest);
  return frag;
}
function cued(text, cue) {
  const k = cue ? text.indexOf(cue) : -1;
  if (k < 0) return [text];
  return [text.slice(0, k), h('span', { className: 'cue', textContent: cue }), text.slice(k + cue.length)];
}
const tail = (s, n) => (s && s.length > n ? '…' + s.slice(s.length - n).replace(/^\S*\s/, '') : s || '');
function placeOf(card, it) {
  const page = card.loc?.page ?? (card.pics?.[0]?.loc?.page);
  if (it?.kind === 'scan' && page != null) return 'p. ' + (card.loc?.label || card.pics?.[0]?.loc?.label || page + 1);
  const sec = card.sec || '';
  const m = sec.match(/^([A-Z]?\d+(?:\.\d+)*)\s/);
  if (m) return '§' + m[1];
  return sec ? (sec.length > 26 ? sec.slice(0, 25) + '…' : sec) : '';
}

// ---------------------------------------------------------------- cards
function avatar(it, lead) {
  const el = h('span', { className: 'fd-av', style: `--lc:${laneColor(it)}` });
  const mono = () => { el.classList.add('mono'); el.replaceChildren(h('b', { textContent: (it?.t || '?').replace(/^[^A-Za-z0-9]+/, '')[0] || '?' })); };
  if (!lead?.img) { mono(); return el; }
  const im = h('img', { src: lead.img.startsWith('http') && /archive\.org/.test(lead.img) ? P(lead.img) : lead.img, alt: '', loading: 'lazy', decoding: 'async', draggable: false });
  im.referrerPolicy = 'no-referrer';
  im.onerror = mono;
  el.append(im);
  return el;
}
function foot(card, L, it, { av = true } = {}) {
  const place = placeOf(card, it);
  const marks = [];
  if (card.type === 'highlight') marks.push(h('span', { className: 'fd-mk ai', textContent: 'AI' }), card.sample ? h('span', { className: 'fd-mk', textContent: 'sample' }) : null);
  if (state.saved.includes(card.id)) marks.push(h('span', { className: 'fd-mk sv', textContent: '★', title: 'Saved' }));
  return h('footer', { className: 'fd-foot' + (av ? '' : ' noav') },
    av ? avatar(it, L.leads[card.id]) : null,
    h('div', { className: 'fd-who' },
      h('div', { className: 'fd-t', textContent: it?.t || card.id }),
      h('div', { className: 'fd-m' },
        h('i', { className: 'dot', style: `background:${laneColor(it)}` }),
        h('span', { textContent: [yearOf(it), place].filter(Boolean).join(' · ') }))),
    ...marks);
}
/** One picture drawn into a w × hh cell. */
function picArt(p, w, hh, onFail) {
  if (p.type === 'table' && p.html) { const box = h('div', { className: 'fd-cell-tbl' }); box.append(htmlEl('fg-tbl-in fd-tbl', p.html)); return box; }
  if (p.type === 'figure' && (p.parts || p.lay != null)) return figArt({ ...p, w: p.w || p._w, h: p.h || p._h }, w, hh, onFail);
  const im = h('img', { src: picSrc(p), alt: '', loading: 'lazy', decoding: 'async', draggable: false, style: `width:${Math.round(w)}px;height:${Math.round(hh)}px` });
  im.referrerPolicy = 'no-referrer';
  im.onerror = onFail;
  return im;
}
/** The pictures box of a lead or highlight card: one picture, or a mosaic of
 *  the top two or three (2/3 + a stacked third on wide cards; the main one
 *  over a row of the others on narrow ones). Its height is known up front. */
function picsBox(pics, W, broken) {
  const plate = pics[0].type === 'plate';
  const cell = (p, w, hh) => {
    const c = h('div', { className: 'fd-cell' + (plate ? ' plate' : '') + (p.type === 'table' ? ' tbl' : ''), style: `width:${w.toFixed(1)}px;height:${hh.toFixed(1)}px` });
    c.append(picArt(p, Math.max(10, w - 2 * PAD), Math.max(10, hh - 2 * PAD), () => broken(c)));
    return c;
  };
  if (pics.length === 1) {
    const bh = W / arOfPic(pics[0]);
    return { el: h('div', { className: 'fd-pics one', style: `height:${bh.toFixed(1)}px` }, cell(pics[0], W, bh)), h: bh };
  }
  const G = 3;
  if (W >= 380) {
    const mw = (W - G) * 2 / 3, sw = W - G - mw;
    const bh = Math.max(W * 0.42, Math.min(W * 1.1, mw / arOfPic(pics[0])));
    const k = pics.length - 1, sh = (bh - G * (k - 1)) / k;
    const side = h('div', { className: 'fd-side' }, ...pics.slice(1).map((p) => cell(p, sw, sh)));
    return { el: h('div', { className: 'fd-pics few wide', style: `height:${bh.toFixed(1)}px` }, cell(pics[0], mw, bh), side), h: bh };
  }
  const mh = W / arOfPic(pics[0]);
  const th = Math.round(Math.max(70, Math.min(120, W * 0.32)));
  const k = pics.length - 1, tw = (W - G * (k - 1)) / k;
  const row = h('div', { className: 'fd-row' }, ...pics.slice(1).map((p) => cell(p, tw, th)));
  return { el: h('div', { className: 'fd-pics few tall', style: `height:${(mh + G + th).toFixed(1)}px` }, cell(pics[0], W, mh), row), h: mh + G + th };
}
function capOf(p, n) {
  const label = p.label ? p.label.replace(/^Figure\b/, 'Fig.') : p.type === 'plate' ? 'Plate' : '';
  const text = p.caption || (p.type === 'image' ? '' : '');
  if (!label && !text) return null;
  return h('div', { className: 'fd-cap' + (n === 1 ? ' one' : '') }, label ? h('b', { textContent: label }) : null, text || '');
}

/** The card element for `card` at width W. `ready` is what prepare() gave. */
function renderCard(card, L, W, ready) {
  const it = itemOf(card);
  const t = card.type;
  const el = h('article', { className: `fd-card t-${t}` });
  el.style.width = W + 'px';
  if (t === 'lead' || t === 'highlight') {
    const pics = ready?.length ? ready : [];
    const brk = (c) => { c.classList.add('broken'); c.replaceChildren(h('span', { className: 'fd-na', textContent: 'picture unavailable' })); };
    if (pics.length === 1 && pics[0].type === 'table' && pics[0].html) { // a table pick: drawn as a table card
      el.classList.add('tblpick');
      el.append(h('div', { className: 'fd-main free' }, h('div', { className: 'fd-tblbox' }, htmlEl('fg-tbl-in fd-tbl', pics[0].html))));
    } else if (pics.length) { const box = picsBox(pics, W, brk); el.append(box.el); }
    if (t === 'lead') {
      el.append(capOf(pics[0] || {}, pics[0]?.type === 'plate' ? 1 : 2) || '', foot(card, L, it, { av: false }));
      if (pics.length > 1) el.classList.add('few');
      return el;
    }
    const main = h('div', { className: 'fd-main' });
    if (card.question) main.append(h('div', { className: 'fd-q', textContent: card.question }));
    if (card.claim) main.append(h('div', { className: 'fd-claim', textContent: card.claim }));
    if (card.number?.value && card.number.ok !== false) main.append(h('div', { className: 'fd-nt' }, h('b', { textContent: card.number.value }), h('span', { textContent: card.number.what || '' })));
    if (card.passage?.quote && card.passage.ok) main.append(h('blockquote', { className: 'fd-pq' }, card.passage.quote, h('span', { className: 'ok', textContent: ' ✓', title: 'Found verbatim in the source' })));
    if (card.passage?.why) main.append(h('div', { className: 'fd-why' }, h('span', { className: 'fd-mk ai', textContent: 'AI' }), ' ', card.passage.why));
    el.append(main, foot(card, L, it, { av: !pics.length }));
    return el;
  }
  const main = h('div', { className: 'fd-main' });
  if (CHIP[t]) main.append(h('div', { className: 'fd-chip c-' + t, textContent: t === 'definition' && !card.html && card.label && !/^(Definition|Assumption)\b/.test(card.label) ? 'Term' : CHIP[t] }));
  switch (t) {
    case 'finding':
      main.append(h('p', { className: 'fd-s' }, ...cued(card.text, card.cue)));
      break;
    case 'claims':
      if (card.cue) main.append(h('div', { className: 'fd-lead', textContent: card.cue }));
      main.append(card.html ? htmlEl('fd-list fd-clamp', card.html) : h('p', { className: 'fd-s fd-clamp', textContent: card.text }));
      break;
    case 'number':
      main.append(h('div', { className: 'fd-val', textContent: card.value || '' }), h('p', { className: 'fd-s' }, marked(card.text, card.value)));
      break;
    case 'table':
      main.classList.add('free');
      main.append(h('div', { className: 'fd-tcap' }, h('b', { textContent: card.label || 'Table' }), ' ', card.caption || ''));
      main.append(h('div', { className: 'fd-tblbox' }, card.html ? htmlEl('fg-tbl-in fd-tbl', card.html) : h('div', { className: 'fd-tbl', textContent: card.text })));
      break;
    case 'equation':
      main.classList.add('free');
      if (card.ctx?.before) main.append(h('p', { className: 'fd-ctx', textContent: tail(card.ctx.before, 200) }));
      main.append(h('div', { className: 'fd-eqrow' }, h('div', { className: 'fd-eqbox' }, card.html ? htmlEl('fd-eq', card.html) : h('code', { className: 'fd-tex', textContent: card.text })), card.label ? h('span', { className: 'fd-eqn', textContent: card.label }) : null));
      break;
    case 'definition': case 'theorem':
      if (card.label) main.append(h('div', { className: 'fd-term', textContent: card.label }));
      main.append(card.html ? htmlEl('fd-s fd-def fd-clamp', card.html) : h('p', { className: 'fd-s fd-clamp', textContent: card.text }));
      break;
    case 'limitation': case 'question':
      main.append(h('p', { className: 'fd-s', textContent: card.text }));
      if (card.sec) main.append(h('div', { className: 'fd-sec', textContent: card.sec }));
      break;
    default: // tldr, status, pull, opener, quote and anything new
      main.append(card.html ? htmlEl('fd-s fd-voice', card.html) : h('p', { className: 'fd-s fd-voice', textContent: card.text }));
  }
  el.append(main, foot(card, L, it));
  return el;
}

// Measuring without layout shift: cards are built at their final width in a
// hidden column, all heights are read in one pass, then placed with explicit
// sizes. Tables and equations are scaled to fit the card.
function measureRead(r) {
  const el = r.el;
  r.h0 = el.offsetHeight;
  const box = el.querySelector('.fd-tblbox, .fd-eqbox');
  if (box) { const inner = box.firstElementChild; r.iw = inner?.scrollWidth || 1; r.ih = inner?.offsetHeight || 0; r.bw = box.clientWidth || 1; }
  for (const c of el.querySelectorAll('.fd-main, .fd-clamp')) if (c.scrollHeight > c.clientHeight + 2) (r.cut ||= []).push(c);
}
function measureWrite(r) {
  let hgt = r.h0;
  const box = r.el.querySelector('.fd-tblbox, .fd-eqbox');
  if (box && r.ih) {
    const s = Math.min(1, (r.bw - 2) / r.iw);
    const tbl = box.classList.contains('fd-tblbox');
    const bh = Math.min(r.ih * s, tbl ? TABLE_MAX : 360);
    box.firstElementChild.style.transform = s < 1 ? `scale(${s.toFixed(3)})` : '';
    box.style.height = bh.toFixed(1) + 'px';
    if (r.ih * s > bh + 1) box.classList.add('cut');
    hgt = r.h0 - r.ih + bh;
  }
  for (const c of r.cut || []) c.classList.add('cut');
  r.hgt = Math.ceil(hgt);
}

// ---------------------------------------------------------------- surfaces
const root = h('section', { id: 'feeds', hidden: true });
const head = h('div', { className: 'fd-head' });
const bodyEl = h('div', { className: 'fd-body' });
root.append(head, bodyEl);
$('#main').append(root);

const recOf = new WeakMap(); // card element -> record
const cardRec = new WeakMap(); // card object -> its latest record
const kin = new Map(); // item id -> Set of card elements on screen
const V = { lane: null, away: true, surf: null, sel: null, hoverId: null, surfaces: new Map() };

function addKin(r) { let s = kin.get(r.card.id); if (!s) kin.set(r.card.id, (s = new Set())); s.add(r.el); }
function dropKin(r) { kin.get(r.card.id)?.delete(r.el); }

/** The card pipeline shared by boards and streams: filter, prepare, then
 *  place in batches (one forced layout per batch), keeping feed order except
 *  where a picture is slow. */
function makeFeeder(S) {
  S.used = 0; S.q = []; S.count = 0; S.recs = []; S.flushT = 0;
  S.feed = () => {
    const L = S.L;
    while (S.used < L.cards.length && S.count + S.q.length < MAX_CARDS) {
      const card = L.cards[S.used++];
      if (hidden.has(card.cid) || hiddenItems[S.type]?.includes(card.id) || byId.get(card.id) == null) continue;
      const r = { card, type: S.type, ready: undefined, t: performance.now() };
      S.q.push(r); cardRec.set(card, r);
      prepare(card).then((v) => { r.ready = v; S.kick(); }, () => { r.ready = null; S.kick(); });
    }
  };
  S.kick = () => { if (!S.flushT) S.flushT = requestAnimationFrame(() => { S.flushT = 0; S.flush(); }); };
  S.flush = () => {
    if (!S.alive || !S.visible()) return;
    const now = performance.now(); const batch = [];
    let k = 0;
    while (k < S.q.length && batch.length < 40) {
      const r = S.q[k];
      if (r.ready === undefined) { if (now - r.t < 300) break; k++; continue; } // a slow picture: let the rest go ahead
      S.q.splice(k, 1);
      if (r.ready) batch.push(r);
    }
    if (batch.length) S.place(batch);
    if (S.q.some((r) => r.ready !== undefined) || (S.q.length && S.q[0].ready === undefined)) setTimeout(S.kick, S.q.some((r) => r.ready !== undefined) ? 0 : 120);
    S.status();
  };
}

// ---- Board: masonry, absolutely placed cards, the shortest column first.
function makeBoard(type, lane) {
  const B = { kind: 'board', type, lane, L: listOf(type, lane), alive: true, colW: 0, n: 0, colH: [], near: false, scroll: 0, order: null };
  B.el = h('div', { className: 'fd-board' });
  B.mas = h('div', { className: 'fd-mas' });
  B.meas = h('div', { className: 'fd-meas', 'aria-hidden': 'true' });
  B.sent = h('div', { className: 'fd-sent' });
  B.more = h('div', { className: 'fd-more' });
  B.mas.append(B.meas, B.sent, B.more);
  B.el.append(B.mas);
  makeFeeder(B);
  B.visible = () => !root.hidden && !B.el.hidden;
  B.io = new IntersectionObserver((es) => { B.near = es.some((e) => e.isIntersecting); if (B.near) B.pump(); }, { root: B.el, rootMargin: '0px 0px 1600px 0px' });
  B.io.observe(B.sent);
  B.el.addEventListener('scroll', () => { if (!B.el.hidden) B.scroll = B.el.scrollTop; }, { passive: true });
  B.geom = () => {
    const W = B.el.clientWidth - 36;
    if (W <= 0) return false;
    const n = Math.max(1, Math.floor((W + GAP) / (cfg.colMin + GAP)));
    const colW = Math.floor((W - GAP * (n - 1)) / n);
    if (n === B.n && colW === B.colW) return false;
    B.n = n; B.colW = colW; return true;
  };
  B.place = (batch) => {
    if (!B.n) { B.geom(); B.colH = Array(B.n || 1).fill(0); B.n ||= 1; }
    for (const r of batch) { r.el = renderCard(r.card, B.L, B.colW, r.ready); recOf.set(r.el, r); B.meas.append(r.el); }
    for (const r of batch) measureRead(r);
    for (const r of batch) {
      measureWrite(r);
      let c = 0;
      for (let j = 1; j < B.n; j++) if (B.colH[j] < B.colH[c] - 1) c = j;
      r.col = c; r.x = c * (B.colW + GAP); r.y = B.colH[c];
      B.colH[c] += r.hgt + GAP;
      Object.assign(r.el.style, { left: r.x + 'px', top: r.y + 'px', height: r.hgt + 'px', containIntrinsicSize: `${B.colW}px ${r.hgt}px` });
      r.el.classList.add('placed');
      B.mas.append(r.el);
      B.recs.push(r); B.count++; addKin(r);
    }
    B.order = null;
    B.edges();
    paintHead();
  };
  B.edges = () => {
    const lo = B.colH.length ? Math.min(...B.colH) : 0, hi = B.colH.length ? Math.max(...B.colH) : 0;
    B.sent.style.top = lo + 'px';
    B.more.style.top = hi + 'px';
    B.mas.style.height = hi + 60 + 'px';
  };
  B.status = () => statusLine(B, B.more);
  B.pump = () => {
    if (!B.alive || state.view !== 'feeds' || !B.visible()) return;
    B.feed(); B.kick();
    if (B.near && B.count < MAX_CARDS && !B.q.length) fetchMore(B.L);
    B.status();
  };
  B.onData = () => B.pump();
  /** Re-place every card (resize, density, an undone hide after a re-layout): rebuilt at the new width. */
  B.relayout = () => {
    B.geom();
    const anchor = B.recs.find((r) => !r.gone && r.y + r.hgt > B.el.scrollTop);
    const keep = B.recs.filter((r) => !r.hidden && !r.gone);
    for (const r of B.recs) { r.el.remove(); dropKin(r); }
    B.recs = []; B.count = 0; B.colH = Array(B.n).fill(0);
    for (let k = 0; k < keep.length; k += 200) B.place(keep.slice(k, k + 200));
    if (anchor && !anchor.hidden) B.el.scrollTop = anchor.y; else B.el.scrollTop = 0;
    if (V.sel && !V.sel.el.isConnected) V.sel = null;
  };
  B.show = () => {
    const first = !B.colW;
    if (B.geom() && !first) B.relayout(); else if (first) B.colH = Array(B.n).fill(0);
    if (B.scroll) B.el.scrollTop = B.scroll;
    B.L.subs.add(B); B.pump();
  };
  B.hide = () => { B.L.subs.delete(B); };
  B.destroy = () => { B.alive = false; B.io.disconnect(); B.L.subs.delete(B); for (const r of B.recs) dropKin(r); B.el.remove(); };
  B.readingOrder = () => (B.order ||= B.recs.filter((r) => !r.hidden).sort((a, b) => a.y - b.y || a.col - b.col));
  B.colsOf = (c) => B.recs.filter((r) => r.col === c && !r.hidden).sort((a, b) => a.y - b.y);
  return B;
}

// ---- Columns: one stream per feed, natural heights, each its own scroll.
function makeStream(type, lane, deck) {
  const S = { kind: 'stream', type, lane, deck, L: listOf(type, lane), alive: true, near: false, scroll: 0 };
  S.list = h('div', { className: 'fd-sl' });
  S.meas = h('div', { className: 'fd-smeas' });
  S.more = h('div', { className: 'fd-more' });
  S.sent = h('div', { className: 'fd-sent' });
  S.n = h('span', { className: 'n' });
  S.head = h('header', { className: 'fd-sh' },
    h('span', { className: 'nm', textContent: FEEDS[type].label }), S.n,
    h('button', { className: 'ghost x', title: `Close this column (the ${FEEDS[type].label} chip brings it back)`, textContent: '×', onclick: (e) => { e.stopPropagation(); toggleStream(type); } }));
  S.el = h('section', { className: 'fd-stream', style: `width:${cfg.streamW}px` }, S.head, S.list);
  S.list.append(S.meas, S.more, S.sent);
  makeFeeder(S);
  S.visible = () => !root.hidden && !deck.el.hidden;
  S.io = new IntersectionObserver((es) => { S.near = es.some((e) => e.isIntersecting); if (S.near) S.pump(); }, { root: S.list, rootMargin: '0px 0px 1600px 0px' });
  S.io.observe(S.sent);
  S.list.addEventListener('scroll', () => { if (!deck.el.hidden) S.scroll = S.list.scrollTop; }, { passive: true });
  S.w = () => cfg.streamW - 2 * 10 - 2;
  S.place = (batch) => {
    const W = S.w();
    for (const r of batch) { r.el = renderCard(r.card, S.L, W, r.ready); recOf.set(r.el, r); S.meas.append(r.el); }
    for (const r of batch) measureRead(r);
    for (const r of batch) {
      measureWrite(r);
      r.el.style.height = r.hgt + 'px';
      r.el.style.containIntrinsicSize = `${W}px ${r.hgt}px`;
      r.el.classList.add('placed');
      S.list.insertBefore(r.el, S.more);
      S.recs.push(r); S.count++; addKin(r);
    }
    S.n.textContent = String(S.count);
    paintHead();
  };
  S.status = () => statusLine(S, S.more);
  S.pump = () => {
    if (!S.alive || state.view !== 'feeds' || !S.visible()) return;
    S.feed(); S.kick();
    if (S.near && S.count < MAX_CARDS && !S.q.length) fetchMore(S.L);
    S.status();
  };
  S.onData = () => S.pump();
  S.relayout = () => {
    S.el.style.width = cfg.streamW + 'px';
    const keep = S.recs.filter((r) => !r.hidden);
    for (const r of S.recs) { r.el.remove(); dropKin(r); }
    S.recs = []; S.count = 0;
    for (let k = 0; k < keep.length; k += 200) S.place(keep.slice(k, k + 200));
  };
  S.destroy = () => { S.alive = false; S.io.disconnect(); S.L.subs.delete(S); for (const r of S.recs) dropKin(r); S.el.remove(); };
  return S;
}
function makeDeck(lane) {
  const D = { kind: 'deck', lane, alive: true, streams: new Map(), scroll: 0, w: cfg.streamW };
  D.el = h('div', { className: 'fd-deck' });
  D.el.addEventListener('scroll', () => { if (!D.el.hidden) D.scroll = D.el.scrollLeft; }, { passive: true });
  D.sync = () => {
    for (const [t, s] of D.streams) if (!cfg.streams.includes(t)) { s.destroy(); D.streams.delete(t); }
    const els = [];
    for (const t of ORDER) if (cfg.streams.includes(t)) {
      if (!D.streams.has(t)) D.streams.set(t, makeStream(t, lane, D));
      els.push(D.streams.get(t).el);
    }
    const cur = [...D.el.children];
    if (cur.length !== els.length || cur.some((x, k) => x !== els[k])) D.el.replaceChildren(...els);
  };
  D.show = () => {
    D.sync();
    if (D.w !== cfg.streamW) { D.w = cfg.streamW; for (const s of D.streams.values()) s.relayout(); }
    D.el.scrollLeft = D.scroll;
    for (const s of D.streams.values()) { if (s.scroll) s.list.scrollTop = s.scroll; s.L.subs.add(s); s.pump(); }
    if (!cfg.streams.length) D.el.replaceChildren(h('div', { className: 'fd-empty' }, h('p', { textContent: 'No columns. Pick feeds with the chips above (each chip toggles its column).' })));
  };
  D.hide = () => { for (const s of D.streams.values()) s.L.subs.delete(s); };
  D.destroy = () => { D.alive = false; for (const s of D.streams.values()) s.destroy(); D.el.remove(); };
  D.relayout = () => { D.w = cfg.streamW; for (const s of D.streams.values()) s.relayout(); };
  return D;
}

function statusLine(S, el) {
  const L = S.L;
  let text = '', cls = '';
  if (L.missing) { text = 'Feeds need the extraction routes on the server (GET /extract/feed answered 404).'; cls = 'bad'; }
  else if (S.count >= MAX_CARDS) text = `End of this session’s feed · ${MAX_CARDS.toLocaleString()} cards · Esc to the feed`;
  else if (L.done && !S.q.length) {
    if (!S.count && !S.empty) { S.empty = true; el.replaceChildren(emptyState(S)); el.className = 'fd-more fd-emptywrap'; return; }
    text = S.count ? `End of the lane · ${S.count} card${S.count === 1 ? '' : 's'} from ${L.total} items` : '';
  } else if (L.busy || L.pending || S.q.length) { text = L.pending ? `Reading ${L.pending} more item${L.pending === 1 ? '' : 's'}…` : 'Loading…'; cls = 'busy'; }
  if (S.empty && S.count) S.empty = false;
  if (S.empty) return;
  el.className = 'fd-more ' + cls;
  if (el.textContent !== text) el.textContent = text;
}
function emptyState(S) {
  const f = FEEDS[S.type];
  const lanes = {};
  for (const it of items) {
    const k = srcKind(it);
    if (f.kinds.includes(k)) lanes[it.lane] = (lanes[it.lane] || 0) + 1;
  }
  for (const L of lists.values()) if (L.type === S.type && L.cards.length && L.lane !== 'all') lanes[L.lane] = Math.max(lanes[L.lane] || 0, 1);
  const here = S.lane === 'all' ? 'the corpus' : `${LANES[S.lane] || S.lane}`;
  const opts = Object.entries(lanes).filter(([l]) => l !== S.lane).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return h('div', { className: 'fd-empty' },
    h('p', {}, h('b', { textContent: `No ${f.label.toLowerCase()} in ${here}. ` }), `This feed shows ${f.src}.`),
    opts.length ? h('div', { className: 'links' }, ...opts.map(([l]) => h('button', { className: 'ghost', textContent: LANES[l] || l, onclick: () => setLane(l) }))) : null);
}

// ---------------------------------------------------------------- the view
function surfKey() { return cfg.layout === 'board' ? `board|${cfg.type}|${state.lane}` : `deck|${state.lane}`; }
function current() {
  const k = surfKey();
  let s = V.surfaces.get(k);
  if (!s) {
    s = cfg.layout === 'board' ? makeBoard(cfg.type, state.lane) : makeDeck(state.lane);
    V.surfaces.set(k, s);
    bodyEl.append(s.el);
    // Keep the last six (layout, feed, lane) states for instant return.
    const keys = [...V.surfaces.keys()];
    for (const old of keys.slice(0, Math.max(0, keys.length - 6))) { V.surfaces.get(old).destroy(); V.surfaces.delete(old); }
  } else { V.surfaces.delete(k); V.surfaces.set(k, s); }
  return s;
}
function open() {
  const s = current();
  if (V.surf && V.surf !== s) { V.surf.hide(); V.surf.el.hidden = true; select(null); }
  for (const x of V.surfaces.values()) x.el.hidden = x !== s;
  V.surf = s; V.lane = state.lane;
  s.show();
  paintHead();
}
const surfaceOf = (r) => (r?.type && V.surf?.kind === 'deck' ? V.surf.streams.get(r.type) : V.surf);

function paintHead() {
  if (state.view !== 'feeds') return;
  const lane = state.lane === 'all' ? 'All lanes' : LANES[state.lane] || state.lane;
  const board = cfg.layout === 'board';
  const L = board ? listOf(cfg.type, state.lane) : null;
  const surf = V.surf;
  const count = (t) => { const x = lists.get(t + '|' + state.lane); return x?.cards.length ? (x.done ? String(x.cards.length) : x.cards.length + '+') : ''; };
  const chips = ORDER.map((t) => {
    const on = board ? cfg.type === t : cfg.streams.includes(t);
    return h('button', { className: 'fd-chip-btn' + (on ? ' on' : ''), title: board ? `Show the ${FEEDS[t].label} feed` : `${on ? 'Hide' : 'Show'} the ${FEEDS[t].label} column`, onclick: () => (board ? setType(t) : toggleStream(t)) },
      FEEDS[t].label, h('span', { className: 'n', textContent: count(t) }));
  });
  let stats = '';
  if (board && L) {
    const shown = surf?.count ?? 0;
    stats = `${shown} card${shown === 1 ? '' : 's'}` + (L.total ? ` · ${L.walked} of ${L.total} items` : '') + (L.pending && !L.done ? ` · reading ${L.pending}…` : '');
  } else if (surf?.kind === 'deck') {
    let n = 0, p = 0; for (const s of surf.streams.values()) { n += s.count; p += s.L.done ? 0 : s.L.pending; }
    stats = `${n} cards` + (p ? ` · reading ${p}…` : '');
  }
  head.replaceChildren(
    h('span', { className: 'fd-title', textContent: 'Feeds' }),
    h('span', { className: 'fd-lane', textContent: lane }),
    h('span', { className: 'fd-seg' },
      h('button', { className: board ? 'on' : '', textContent: 'Board', title: 'One feed as a masonry board (c)', onclick: () => setLayout('board') }),
      h('button', { className: board ? '' : 'on', textContent: 'Columns', title: 'Several feeds side by side (c)', onclick: () => setLayout('columns') })),
    h('span', { className: 'fd-chips' }, ...chips),
    h('span', { className: 'fd-stats', textContent: stats }),
    h('span', { className: 'fd-sp' }),
    h('span', { className: 'fd-hint', textContent: 'hover to peek · Enter open here · q quote · s save · x hide · [ ] feeds · c layout · - = size' }));
}

function setType(t) { if (!FEEDS[t]) return; cfg.type = t; saveCfg(); if (cfg.layout !== 'board') cfg.layout = 'board'; saveCfg(); open(); tel('view', t); }
function toggleStream(t) {
  const k = cfg.streams.indexOf(t);
  if (k >= 0) cfg.streams.splice(k, 1); else cfg.streams = ORDER.filter((x) => x === t || cfg.streams.includes(x));
  saveCfg();
  if (cfg.layout === 'columns' && V.surf?.kind === 'deck') { V.surf.show(); paintHead(); }
}
function setLayout(l) { if (cfg.layout === l) return; cfg.layout = l; saveCfg(); closePeek(); open(); tel('view', l === 'board' ? cfg.type : 'columns'); }
function density(d) {
  if (cfg.layout === 'board') {
    const k = Math.max(0, Math.min(COLS.length - 1, COLS.indexOf(cfg.colMin) + d));
    if (COLS[k] === cfg.colMin) return;
    cfg.colMin = COLS[k]; saveCfg();
    if (V.surf?.kind === 'board' && V.surf.geom()) V.surf.relayout();
    toast(`Columns ≥ ${cfg.colMin} px`, { icon: 'columns-3', sub: `${V.surf?.n || ''} columns` });
  } else {
    const k = Math.max(0, Math.min(STREAMS.length - 1, (STREAMS.indexOf(cfg.streamW) < 0 ? 1 : STREAMS.indexOf(cfg.streamW)) + d));
    if (STREAMS[k] === cfg.streamW) return;
    cfg.streamW = STREAMS[k]; saveCfg();
    V.surf?.relayout?.();
    toast(`Columns ${cfg.streamW} px wide`, { icon: 'columns-3' });
  }
}

// ---------------------------------------------------------------- selection
function select(r, { scroll = false, peek = true } = {}) {
  if (V.sel === r) return;
  V.sel?.el?.classList.remove('sel');
  V.sel = r;
  if (!r) return;
  r.el.classList.add('sel');
  if (scroll) r.el.scrollIntoView({ block: 'nearest' });
  if (peek && peekState().pinned && !r.hidden) showPeek(root, r.card, r.el);
}
function firstVisible(S) {
  if (S.kind === 'board') { const top = S.el.scrollTop; return S.readingOrder().find((r) => r.y + r.hgt > top + 8); }
  const top = S.list.scrollTop;
  return S.recs.find((r) => !r.hidden && r.el.offsetTop + r.el.offsetHeight > top + 8);
}
function activeStream() {
  if (V.surf?.kind !== 'deck') return V.surf;
  return surfaceOf(V.sel) || V.surf.streams.get(cfg.streams[0]);
}
function step(d) {
  const S = activeStream(); if (!S) return;
  const list = S.kind === 'board' ? S.readingOrder() : S.recs.filter((r) => !r.hidden);
  if (!list.length) return;
  const at = list.indexOf(V.sel);
  const r = at < 0 ? firstVisible(S) || list[0] : list[Math.max(0, Math.min(list.length - 1, at + d))];
  select(r, { scroll: true });
  if (at >= list.length - 3) S.pump();
}
function spatial(dx, dy) {
  const S = activeStream(); if (!S) return;
  const cur = V.sel && surfaceOf(V.sel) === S ? V.sel : null;
  if (!cur || cur.hidden) { const r = firstVisible(S); if (r) select(r, { scroll: true }); return; }
  if (S.kind === 'board') {
    if (dy) { const col = S.colsOf(cur.col); const r = col[col.indexOf(cur) + dy]; if (r) select(r, { scroll: true }); else if (dy > 0) S.pump(); return; }
    const c = cur.col + dx; if (c < 0 || c >= S.n) return;
    const mid = cur.y + cur.hgt / 2;
    const r = S.colsOf(c).sort((a, b) => Math.abs(a.y + a.hgt / 2 - mid) - Math.abs(b.y + b.hgt / 2 - mid))[0];
    if (r) select(r, { scroll: true });
    return;
  }
  if (dy) { const list = S.recs.filter((r) => !r.hidden); const r = list[list.indexOf(cur) + dy]; if (r) select(r, { scroll: true }); return; }
  const ts = cfg.streams.filter((t) => V.surf.streams.has(t));
  const nt = ts[ts.indexOf(S.type) + dx]; if (!nt) return;
  const T = V.surf.streams.get(nt);
  const mid = cur.el.offsetTop - S.list.scrollTop + cur.el.offsetHeight / 2;
  const r = T.recs.filter((x) => !x.hidden).sort((a, b) => Math.abs(a.el.offsetTop - T.list.scrollTop + a.el.offsetHeight / 2 - mid) - Math.abs(b.el.offsetTop - T.list.scrollTop + b.el.offsetHeight / 2 - mid))[0];
  if (r) select(r, { scroll: true }); else T.el.scrollIntoView({ inline: 'nearest' });
}
function nextFeed(d) {
  if (cfg.layout === 'board') { setType(ORDER[(ORDER.indexOf(cfg.type) + d + ORDER.length) % ORDER.length]); toast(FEEDS[cfg.type].label, { icon: 'columns-3' }); return; }
  const ts = cfg.streams.filter((t) => V.surf?.streams?.has(t)); if (!ts.length) return;
  const S = activeStream();
  const T = V.surf.streams.get(ts[(ts.indexOf(S?.type) + d + ts.length) % ts.length]);
  T.el.scrollIntoView({ inline: 'nearest', block: 'nearest' });
  const r = firstVisible(T); if (r) select(r);
}

// Hover selects (so keys act on what you point at) and lights the other
// cards from the same item. Only real pointer movement counts.
let hx = -1, hy = -1;
root.addEventListener('pointermove', (e) => {
  if (e.clientX === hx && e.clientY === hy) return;
  hx = e.clientX; hy = e.clientY;
  const el = e.target.closest?.('.fd-card');
  const r = el ? recOf.get(el) : null;
  const id = r?.card.id ?? null;
  if (id !== V.hoverId) {
    for (const x of (V.hoverId && kin.get(V.hoverId)) || []) x.classList.remove('kin');
    V.hoverId = id;
    const set = id && kin.get(id);
    if (set && set.size > 1) for (const x of set) x.classList.add('kin');
  }
  if (r && r !== V.sel && !r.hidden) select(r, { peek: false });
}, { passive: true });
root.addEventListener('pointerleave', () => { for (const x of (V.hoverId && kin.get(V.hoverId)) || []) x.classList.remove('kin'); V.hoverId = null; });
root.addEventListener('click', (e) => {
  if (e.target.closest('button, a')) return;
  const el = e.target.closest('.fd-card'); const r = el && recOf.get(el);
  if (!r) return;
  if (r.hidden) { undo(r); return; }
  openCard(r.card, { pdf: e.shiftKey, feed: r.type });
});

// ---------------------------------------------------------------- peek
let warmT = null;
const warmedArxiv = new Set();
attachPeek(root, {
  selector: '.fd-card',
  cardOf: (el) => { const r = recOf.get(el); return r && !r.hidden ? r.card : null; },
  render: renderPeek,
  onOpen(card) {
    const it = itemOf(card); if (!it) return;
    clearTimeout(warmT);
    // Get the click ready: only the peeked item, never every card on screen.
    if (it.kind === 'pdf') fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls: [it.url], pri: 50, group: 'feeds-open' }) }).catch(() => {});
    if (card.id.startsWith('arxiv:') && !warmedArxiv.has(card.id)) { warmedArxiv.add(card.id); fetch('/web/arxiv?id=' + encodeURIComponent(card.id)).catch(() => {}); }
    warmT = setTimeout(() => { if (peekState().card === card) openDoc(it).catch(() => {}); }, 600);
  },
  onClose(card, ms) { clearTimeout(warmT); tel('peek', recFeed(card), card, ms); },
});
const recFeed = (card) => (cfg.layout === 'board' ? cfg.type : Object.keys(FEEDS).find((t) => listOf(t, state.lane).seen.has(card.cid)) || 'columns');

function peekMeta(it, card) {
  const lane = LANES[it.lane] || it.lane;
  return [
    h('div', { className: 'pk-title', textContent: it.t }),
    h('div', { className: 'pk-by' }, h('i', { className: 'dot', style: `background:${laneColor(it)}` }), [it.a, yearOf(it), lane].filter(Boolean).join(' · ')),
    it.ab || it.why ? h('p', { className: 'pk-ab', textContent: it.ab || it.why }) : null,
  ];
}
const peekKeys = () => h('div', { className: 'pk-keys', textContent: 'Enter open here · q quote to note · s save · x hide · o original · z pin' });
function bigPic(p, W, H) {
  const fig = h('figure', { className: 'pk-fig' });
  const maxW = W - 40, maxH = Math.max(200, H);
  let art;
  if (p.type === 'table' && p.html) { art = h('div', { className: 'pk-tbl' }); art.append(htmlEl('fg-tbl-in', p.html)); }
  else if (p.type === 'plate') {
    const it = items[byId.get(p._id)];
    const k = p.loc?.page;
    const ar = (p._w && p._h) ? p._w / p._h : 0.68;
    const w = Math.min(maxW, maxH * ar), hh = w / ar;
    art = sharpImg(P(p.img), it && k != null ? P(scanUrl(it, k, 1000)) : null, { cls: 'pk-plate' });
    art.style.width = w + 'px'; art.style.height = hh + 'px';
  } else if (p.type === 'figure' && (p.parts || p.lay != null || (p.w && p.h))) art = figArt({ ...p, w: p.w || p._w, h: p.h || p._h }, maxW, maxH);
  else {
    const ar = (p.w || p._w) && (p.h || p._h) ? (p.w || p._w) / (p.h || p._h) : 1.6;
    const w = Math.min(maxW, maxH * ar);
    art = sharpImg(picSrc(p), null, { referrer: true });
    art.style.width = w + 'px'; art.style.height = w / ar + 'px';
  }
  fig.append(h('div', { className: 'pk-art' + (p.type === 'plate' ? ' plate' : p.type === 'table' ? ' tbl' : '') }, art));
  if (p.label || p.caption) fig.append(h('figcaption', { className: 'pk-cap' }, p.label ? h('b', { textContent: p.label }) : null, p.caption || ''));
  return fig;
}
/** The paper's other figures, 64 px high; hovering one swaps the first big picture. */
function figStrip(it, card, body, ctx) {
  if (!arxivId(it)) return;
  const strip = h('div', { className: 'pk-strip' });
  body.insertBefore(strip, body.querySelector('.pk-meta'));
  figuresOf(it, 3).then((figs) => {
    if (!ctx.live()) return;
    const shown = new Set((card.pics || []).map((p) => p.loc?.anchor));
    const rest = figs.filter((f) => !f.table && f.img);
    if (rest.length < 2) { strip.remove(); return; }
    let cur = body.querySelector('.pk-fig');
    strip.append(h('div', { className: 'pk-sl', textContent: `All ${rest.length} figures · hover to look` }), ...rest.map((f) => {
      const ar = Math.max(0.5, Math.min(3, (f.w || 4) / (f.h || 3)));
      const b = h('button', { className: 'pk-th' + (shown.has(f.id) ? ' on' : ''), title: f.label, style: `width:${Math.round(64 * ar) + 6}px` }, figArt(f, Math.round(64 * ar), 64));
      b.onmouseenter = () => {
        if (!cur?.isConnected) return;
        const next = bigPic({ ...f, type: 'figure' }, ctx.width, innerHeight * 0.62);
        cur.replaceWith(next); cur = next;
        for (const x of strip.querySelectorAll('.pk-th.cur')) x.classList.remove('cur');
        b.classList.add('cur');
      };
      b.onmousedown = (e) => e.preventDefault();
      return b;
    }));
  });
}
function renderPeek(card, body, ctx) {
  const it = itemOf(card); if (!it) return;
  const L = listOf(recFeed(card), state.lane);
  const W = ctx.width, Hmax = innerHeight * 0.7;
  const t = card.type;
  if (t === 'lead' || t === 'highlight') {
    if (t === 'highlight') {
      if (card.question) body.append(h('h2', { className: 'pk-qn', textContent: card.question }));
      if (card.claim) body.append(h('p', { className: 'pk-claim' }, card.claim, ' ', h('span', { className: 'fd-mk ai', textContent: 'AI' }), card.sample ? h('span', { className: 'fd-mk', textContent: 'sample' }) : null));
      if (card.number?.value && card.number.ok !== false) body.append(h('div', { className: 'pk-num' }, h('b', { textContent: card.number.value }), h('span', { textContent: card.number.what || '' })));
    }
    const ready = cardRec.get(card)?.ready;
    const use = (ready?.length ? ready : (card.pics || []).filter((p) => !p.verify).slice(0, card.show === 'few' ? 3 : 1));
    for (const p of use) body.append(bigPic({ ...p, _id: card.id }, W, use.length > 1 ? Hmax * 0.8 : Hmax));
    if (t === 'highlight' && card.passage?.quote && card.passage.ok) body.append(h('blockquote', { className: 'pk-pq' }, card.passage.quote, h('span', { className: 'ok', textContent: ' ✓' })), card.passage.why ? h('p', { className: 'pk-why' }, h('span', { className: 'fd-mk ai', textContent: 'AI' }), ' ', card.passage.why) : null);
    body.append(h('div', { className: 'pk-meta' }, ...peekMeta(it, card)), peekKeys());
    figStrip(it, card, body, ctx);
    return;
  }
  const head2 = h('div', { className: 'pk-kind' }, h('span', { className: 'fd-chip c-' + t, textContent: TYPE_LABEL[t] || t }), card.sec ? h('span', { className: 'pk-sec', textContent: card.sec }) : null);
  body.append(head2);
  if (t === 'table') {
    body.append(h('div', { className: 'pk-cap' }, h('b', { textContent: card.label || 'Table' }), card.caption || ''));
    const box = h('div', { className: 'pk-tbl' }); box.append(card.html ? htmlEl('fg-tbl-in', card.html) : h('pre', { textContent: card.text }));
    body.append(box);
  } else if (t === 'equation') {
    if (card.ctx?.before) body.append(h('p', { className: 'pk-ctx', textContent: card.ctx.before }));
    body.append(h('div', { className: 'pk-eqrow' }, card.html ? htmlEl('pk-eq', card.html) : null, card.label ? h('span', { className: 'fd-eqn', textContent: card.label }) : null));
    if (card.ctx?.after) body.append(h('p', { className: 'pk-ctx', textContent: card.ctx.after }));
    body.append(h('code', { className: 'pk-tex', textContent: card.text }));
  } else {
    if (t === 'number' && card.value) body.append(h('div', { className: 'pk-val', textContent: card.value }));
    if (card.label && (t === 'definition' || t === 'theorem')) body.append(h('div', { className: 'pk-term', textContent: card.label }));
    const p = h('div', { className: 'pk-text' });
    if (card.ctx?.before) p.append(h('span', { className: 'pk-ctx', textContent: card.ctx.before + ' ' }));
    if (card.html && t !== 'number' && t !== 'finding') p.append(htmlEl('pk-html', card.html));
    else p.append(h('span', { className: 'pk-main' }, ...(t === 'number' ? [marked(card.text, card.value)] : cued(card.text, card.cue))));
    if (card.ctx?.after) p.append(h('span', { className: 'pk-ctx', textContent: ' ' + card.ctx.after }));
    body.append(p);
  }
  const lead = L.leads[card.id];
  if (lead?.img) {
    const im = h('img', { className: 'pk-lead', src: /archive\.org/.test(lead.img) ? P(lead.img) : lead.img, alt: '', decoding: 'async' });
    im.referrerPolicy = 'no-referrer'; im.onerror = () => im.remove();
    body.append(h('div', { className: 'pk-leadbox' }, im));
  }
  const others = L.cards.filter((c) => c.id === card.id && c.cid !== card.cid && !hidden.has(c.cid)).slice(0, 4);
  if (others.length) body.append(h('div', { className: 'pk-others' }, h('div', { className: 'pk-sl', textContent: 'More from this item' }), ...others.map((c) => h('div', { className: 'pk-o' }, h('span', { className: 'fd-chip c-' + c.type, textContent: TYPE_LABEL[c.type] || c.type }), ' ', c.value ? h('b', { textContent: c.value + ' ' }) : null, (c.text || '').slice(0, 300)))));
  body.append(h('div', { className: 'pk-meta' }, ...peekMeta(it, card)), peekKeys());
}
// ---------------------------------------------------------------- opening at the place
let dive = null; // { i, phase: 'anchor' | 'mark', anchor, quote, card, n, t }
const locOf = (card) => card.loc || card.passage?.loc || card.pics?.[0]?.loc || {};
const quoteOf = (card) => card.loc?.quote || card.passage?.quote || card.pics?.[0]?.caption || card.caption || card.text || '';
function goItem(i, k) {
  state.hist.set(i, []); state.zoom = false;
  state.start.set(i, k);
  const pos = state.order.indexOf(i);
  if (pos >= 0) { state.pos = pos; setView('feed'); } else jumpTo(i);
}
function viaFind(i, card, quote) {
  dive = { i, phase: 'mark', quote, n: 0, t: performance.now() };
  openFigure(i, { id: 'fd:' + card.cid, label: TYPE_LABEL[card.type] || 'Card', caption: quote, at: card.at ?? card.pics?.[0]?.at ?? 0 });
}
/** Open the card's item at the card's place (spec section 4.6). */
async function openCard(card, { pdf = false, feed } = {}) {
  const i = byId.get(card.id); if (i == null) return;
  const it = items[i];
  pinPeek(false); closePeek();
  tel('open', feed || recFeed(card), card);
  const loc = locOf(card); const quote = quoteOf(card);
  const page = loc.page ?? card.pics?.[0]?.loc?.page;
  if (it.kind === 'scan' && page != null) { // (a) scans: the page itself
    dive = { i, phase: 'mark', quote, n: 0, t: performance.now() };
    goItem(i, page);
    return;
  }
  const H = keymap.get('H');
  if (!pdf && card.id.startsWith('arxiv:') && loc.anchor && H) { // (b) arXiv: the HTML version at the anchor
    dive = { i, phase: 'anchor', anchor: loc.anchor, quote, card, n: 0, t: performance.now() };
    goItem(i, 0);
    if (!it._pdf) {
      try { await H.fn({}); } catch { /* falls through */ }
      if (!it._pdf && dive?.i === i) { dive = null; viaFind(i, card, quote); }
    }
    return;
  }
  if (pdf && it._pdf && H) { goItem(i, 0); try { await H.fn({}); } catch { /* stay */ } } // the PDF, then find the quote in it
  viaFind(i, card, quote); // (c) everything else
}
on('spread:rendered', ({ i, it }) => {
  if (!dive || dive.i !== i) return;
  if (dive.phase === 'anchor') {
    if (live?.id !== it.id) return;
    const el = live.flow.querySelector('[id="' + CSS.escape(dive.anchor) + '"]');
    if (!el) { const d = dive; dive = null; viaFind(i, d.card, d.quote); return; }
    dive.phase = 'mark';
    state.start.set(i, elToCol(el)); showFeed();
    toast(TYPE_LABEL[dive.card.type] || 'Here', { icon: 'file-code', sub: dive.card.sec || 'HTML version · H for the PDF' });
    return;
  }
  markQuote(dive);
});
const skel = (s) => String(s || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '');
async function markQuote(d) {
  d.n++;
  const target = skel(String(d.quote).split(/\s+/).slice(0, 12).join(' '));
  if (target.length < 12) { dive = null; return; }
  const r = await currentWords().catch(() => null);
  if (dive !== d) return;
  const ws = r?.words || [];
  const sk = ws.map((w) => skel(w.text));
  for (let j = 0; j < ws.length; j++) {
    if (!sk[j] || !target.startsWith(sk[j].slice(0, Math.min(sk[j].length, target.length)))) continue;
    let acc = '', e = j;
    while (e < ws.length && acc.length < target.length) acc += sk[e++];
    if (acc.startsWith(target) || target.startsWith(acc)) {
      const run = ws.slice(j, e);
      highlight('fd', run);
      setTimeout(() => highlight('fd', []), 4000);
      dive = null;
      return;
    }
  }
  if (d.n >= 3 || performance.now() - d.t > 9000) dive = null; // not on screen yet: try the next render, a few times
}

// ---------------------------------------------------------------- actions
function quote(r) {
  const card = r.card; const it = itemOf(card); if (!it) return;
  const t = card.type;
  const p0 = card.pics?.[0];
  let text = card.loc?.quote || card.text || '';
  if (t === 'table' || t === 'lead' || t === 'plate') text = `${card.label || p0?.label || TYPE_LABEL[t]}: ${card.caption || p0?.caption || ''}`;
  if (t === 'highlight') text = card.passage?.ok ? card.passage.quote : card.claim;
  if (t === 'equation') text = `${card.label || 'Equation'} ${card.text}`;
  const pg = card.loc?.page ?? p0?.loc?.page;
  let page = null;
  if (it.kind === 'scan' && pg != null) page = pg + 1;
  else if (it.kind === 'pdf') { const k = store.get('figpg', {})[it.id + '#fd:' + card.cid]; if (k != null) page = k + 1; }
  appendQuote(it, text, page);
  tel('quote', r.type, card);
}
function save(r) {
  const it = itemOf(r.card); if (!it) return;
  const k = state.saved.indexOf(it.id);
  if (k >= 0) state.saved.splice(k, 1); else { state.saved.unshift(it.id); learn(it, 1); }
  store.set('saved', state.saved); paintSaved();
  toast(k >= 0 ? 'Removed from saved' : 'Saved', { icon: k >= 0 ? 'star-off' : 'star', kind: k >= 0 ? 'edge' : 'ok', sub: it.t.slice(0, 80) });
  for (const el of kin.get(it.id) || []) { const rr = recOf.get(el); if (rr && !rr.hidden) el.querySelector('.fd-foot')?.replaceWith(foot(rr.card, surfaceOf(rr)?.L || listOf(rr.type, state.lane), it, { av: !el.querySelector('.fd-foot.noav') })); }
  tel('save', r.type, r.card);
}
function stub(r) {
  if (r.hidden) return;
  r.hidden = true; r.el.classList.add('stub'); r.el.classList.remove('kin');
  r.el.replaceChildren(h('div', { className: 'fd-stub' }, h('span', { textContent: 'Hidden' }), h('kbd', { textContent: 'u' }), h('span', { textContent: 'undo' })));
  const S = surfaceOf(r); if (S?.order) S.order = null;
}
function hide(r) {
  if (!r || r.hidden) return;
  hidden.add(r.card.cid);
  store.set('feeds:hidden', [...hidden].slice(-5000));
  undoStack.push({ cids: [r.card.cid], recs: [r] });
  if (peekState().card === r.card) { pinPeek(false); closePeek(); }
  stub(r);
  tel('hide', r.type, r.card);
  toast('Card hidden', { icon: 'file-minus', sub: 'u to undo · X hides this item’s cards' });
}
function hideItem(r) {
  if (!r) return;
  const id = r.card.id, feed = r.type;
  (hiddenItems[feed] ||= []).push(id);
  if (hiddenItems[feed].length > 3000) hiddenItems[feed] = hiddenItems[feed].slice(-3000);
  store.set('feeds:hiddenItems', hiddenItems);
  const recs = [...(kin.get(id) || [])].map((el) => recOf.get(el)).filter((x) => x && x.type === feed && !x.hidden);
  undoStack.push({ item: id, feed, recs });
  pinPeek(false); closePeek();
  for (const x of recs) stub(x);
  tel('hideItem', feed, r.card);
  toast('Item hidden in this feed', { icon: 'file-minus', sub: `${recs.length} card${recs.length === 1 ? '' : 's'} · u to undo` });
}
function undo(only) {
  let u;
  if (only) { // a click on a stub: undo that one
    const k = undoStack.findIndex((x) => x.recs.includes(only));
    u = k >= 0 ? undoStack.splice(k, 1)[0] : { cids: [only.card.cid], recs: [only] };
  } else u = undoStack.pop();
  if (!u) { toast('Nothing to undo', { icon: 'rotate-ccw', kind: 'edge' }); return; }
  for (const c of u.cids || []) hidden.delete(c);
  if (u.item) hiddenItems[u.feed] = (hiddenItems[u.feed] || []).filter((x) => x !== u.item);
  store.set('feeds:hidden', [...hidden].slice(-5000)); store.set('feeds:hiddenItems', hiddenItems);
  let relay = false;
  for (const r of u.recs) {
    r.hidden = false;
    if (!r.el.isConnected) { relay = true; continue; } // collapsed by a re-layout: place it again
    const S = surfaceOf(r);
    const fresh = renderCard(r.card, S?.L || listOf(r.type, state.lane), parseFloat(r.el.style.width), r.ready);
    fresh.style.cssText = r.el.style.cssText;
    fresh.className = r.el.className.replace(/\bstub\b/, '').trim();
    dropKin(r); r.el.replaceWith(fresh); recOf.set(fresh, r); r.el = fresh; addKin(r);
    if (V.sel === r) fresh.classList.add('sel');
    measureFades(r);
    if (S?.order) S.order = null;
  }
  if (relay) V.surf?.relayout?.();
  tel('unhide', u.feed || u.recs[0]?.type, u.recs[0]?.card);
  toast('Restored', { icon: 'rotate-ccw', kind: 'ok' });
}
function measureFades(r) { for (const c of r.el.querySelectorAll('.fd-main, .fd-clamp')) if (c.scrollHeight > c.clientHeight + 2) c.classList.add('cut'); }
function original(r) {
  const card = r.card; const it = itemOf(card); if (!it) return;
  const href = locOf(card).href || it.page || it.url;
  if (href) window.open(href, '_blank', 'noopener');
}
function togglePin() {
  const st = peekState();
  if (st.pinned) { pinPeek(false); closePeek(); toast('Peek unpinned', { icon: 'image' }); return; }
  const r = V.sel && !V.sel.hidden ? V.sel : null;
  if (!st.open && !r) return;
  pinPeek(true);
  if (!st.open && r) showPeek(root, r.card, r.el);
  toast('Peek pinned', { icon: 'image', sub: 'It follows the selection · z to unpin' });
}

// ---------------------------------------------------------------- keys
const REPEAT = new Set(['j', 'k', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
const KEYS = {
  j: () => step(1), k: () => step(-1),
  ArrowDown: () => spatial(0, 1), ArrowUp: () => spatial(0, -1), ArrowRight: () => spatial(1, 0), ArrowLeft: () => spatial(-1, 0),
  ' ': (e) => { const S = activeStream(); const sc = S?.kind === 'stream' ? S.list : S?.el; sc?.scrollBy({ top: (e.shiftKey ? -1 : 1) * sc.clientHeight * 0.85 }); },
  Enter: (e) => { const r = V.sel; if (r && !r.hidden) openCard(r.card, { pdf: e.shiftKey, feed: r.type }); },
  z: togglePin, Z: togglePin,
  q: () => V.sel && !V.sel.hidden && quote(V.sel),
  s: () => V.sel && save(V.sel),
  x: () => hide(V.sel), X: () => hideItem(V.sel), u: () => undo(),
  o: () => V.sel && original(V.sel),
  '[': () => nextFeed(-1), ']': () => nextFeed(1),
  c: () => setLayout(cfg.layout === 'board' ? 'columns' : 'board'),
  '-': () => density(-1), '=': () => density(1), '+': () => density(1),
  Escape: () => { if (peekState().open) { pinPeek(false); closePeek(); } else setView('feed'); },
};
addEventListener('keydown', (e) => {
  if (state.view !== 'feeds' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
  if (!$('#keys').hidden || !$('#search').hidden || $('#st')?.hidden === false) return;
  const fn = KEYS[e.key]; if (!fn) return;
  e.preventDefault(); e.stopPropagation();
  if (e.repeat && !REPEAT.has(e.key)) return;
  fn(e);
}, true);

registerView('feeds', {
  label: 'Feeds', key: 'D', order: 2.5, roots: () => [root],
  show() {
    V.away = false;
    open();
    tel('view', cfg.layout === 'board' ? cfg.type : 'columns');
  },
  hide() { V.away = true; pinPeek(false); closePeek(); V.surf?.hide(); },
});
keyHelp.push(
  { label: 'D', text: 'feeds: each item’s top pictures, findings, numbers, tables, equations, definitions, limits, posts and highlights, as a board or columns', order: 64.5 },
  { label: 'j k ← → ↑ ↓', text: 'feeds: move between cards (hover to peek; z pins the peek)', order: 64.6 },
  { label: 'Enter ⇧Enter', text: 'feeds: open the item at the card’s place (arXiv: the HTML version; Shift: the PDF page)', order: 64.7 },
  { label: 'q s x X u o', text: 'feeds: quote into the note · save · hide card · hide item · undo · original', order: 64.8 },
  { label: '[ ] c - =', text: 'feeds: previous/next feed · Board ↔ Columns · card size', order: 64.9 });

// ---------------------------------------------------------------- dev hooks
window.__feeds = {
  cfg, lists, V, openCard, getFeed,
  /** Run the ink test over every plate candidate in a lane, in idle time. */
  async verifyAll(lane = state.lane) {
    let off = 0, done = false, tested = 0, passed = 0; const out = [];
    while (!done) {
      const r = await getFeed('pictures', lane, off, 100); off = r.next; done = r.done || !r.cards.length;
      for (const c of r.cards) for (const p of c.pics || []) if (p.verify) {
        await new Promise((res) => (window.requestIdleCallback || setTimeout)(res, { timeout: 500 }));
        const v = await inkTest(c.id, p); tested++; if (v.ok) passed++;
        out.push({ id: c.id, pid: p.pid, ...v });
      }
    }
    return { tested, passed, out };
  },
  /** Scroll the open view at `speed` px/s for `ms`; frame and long-task stats. */
  bench(ms = 10000, speed = 2000) {
    const S = activeStream(); const sc = S?.kind === 'stream' ? S.list : S?.el;
    if (!sc) return Promise.resolve(null);
    const longs = []; let po = null;
    try { po = new PerformanceObserver((l) => longs.push(...l.getEntries().map((x) => x.duration))); po.observe({ type: 'longtask', buffered: false }); } catch { /* unsupported */ }
    const gaps = []; let last = performance.now(); const t0 = last;
    return new Promise((resolve) => {
      const tick = (now) => {
        gaps.push(now - last); last = now;
        sc.scrollTop += (speed * gaps.at(-1)) / 1000;
        if (now - t0 < ms) requestAnimationFrame(tick);
        else {
          po?.disconnect();
          const s = gaps.slice(1).sort((a, b) => a - b); const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
          resolve({ frames: s.length, p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), over33: s.filter((x) => x > 33).length, over50: s.filter((x) => x > 50).length, longTasks: longs.map((x) => Math.round(x)) });
        }
      };
      requestAnimationFrame(tick);
    });
  },
  /** Rectangles of the first n placed cards, relative to their scroll container. */
  rects(n = 60) {
    const S = activeStream(); if (!S) return [];
    return S.recs.slice(0, n).map((r) => ({ cid: r.card.cid, x: r.el.offsetLeft, y: r.el.offsetTop, w: r.el.offsetWidth, h: r.el.offsetHeight }));
  },
};
