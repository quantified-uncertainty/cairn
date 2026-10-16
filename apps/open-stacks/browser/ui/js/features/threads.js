// Threads (docs/feeds/threads.md): one short thread per item, written by a
// model from the whole text (node threads.mjs; data/threads.json, served by
// server/routes/67-threads.mjs as GET /threads.json). Every post cites a quote
// that software found again in the source, and the page it is on.
//
// This module holds the data, the thread card and its two peeks (the whole
// thread; a post's cited page with the quote marked on it), and the side
// panel's Thread section (order 22: the hook and two posts, "more" for the
// rest; a click goes to the post's page and lights the quote).
// features/feeds.js makes Threads its first feed and wires the cards into its
// Board and Columns, keys, peek and dives. Nothing here runs while reading
// except the panel section, which paints from a cached answer or one small
// request per item.
import { h, P, on, sleep, registerSection } from '../util.js';
import { items, LANES, LANE_COLORS, byId } from '../corpus.js';
import { state, current } from '../state.js';
import { openDoc, scanUrl, isFlow } from '../docs.js';
import { goPage } from '../nav.js';
import { currentWords, highlight, reveal } from '../text.js';
import { itemIcon, typeOf, TYPES } from '../icons.js';
import { findPage, figuresOf, arxivId } from './figures.js';
import { sharpImg } from './peek.js';

// ---------------------------------------------------------------- data
const TH = new Map(); // item id -> thread, or null when the server has none for it
const laneReq = new Map(); // lane -> Promise<item ids | null>
export const threadsInfo = { n: 0, lanes: {}, missing: false, built: null };
async function getJson(url) {
  const r = await fetch(url);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('threads ' + r.status);
  return r.json();
}
function take(j) {
  threadsInfo.n = j.n || 0; threadsInfo.lanes = j.lanes || {}; threadsInfo.built = j.built || null; threadsInfo.missing = false;
  for (const [id, th] of Object.entries(j.items || {})) TH.set(id, th);
}
/** The lane's threads ('all': every one) as item ids, corpus order; null when there is no threads file (404). */
export function laneThreads(lane) {
  if (!laneReq.has(lane)) {
    laneReq.set(lane, getJson('/threads.json' + (lane && lane !== 'all' ? '?lane=' + encodeURIComponent(lane) : '')).then((j) => {
      if (!j) { threadsInfo.missing = true; return null; }
      take(j); return Object.keys(j.items || {});
    }, (e) => { laneReq.delete(lane); throw e; }));
  }
  return laneReq.get(lane);
}
export const threadOf = (id) => TH.get(id) || null;
const asking = new Map();
/** One item's thread (null when it has none), cached. */
export function loadThread(id) {
  if (TH.has(id)) return Promise.resolve(TH.get(id));
  if (!asking.has(id)) {
    asking.set(id, getJson('/threads.json?ids=' + encodeURIComponent(id)).then((j) => {
      if (j) take(j); else threadsInfo.missing = true;
      if (!TH.has(id)) TH.set(id, null);
      return TH.get(id);
    }, () => null).finally(() => asking.delete(id)));
  }
  return asking.get(id);
}

// ---------------------------------------------------------------- words and places
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const yearOf = (it) => { const m = /^(\d{4})-(\d\d)/.exec(it?.d || ''); return m ? `${MONTHS[Number(m[2]) - 1]} ${m[1]}` : it?.y ? String(it.y) : it?.d ? String(it.d).slice(0, 4) : ''; };
const laneColor = (it) => LANE_COLORS[it?.lane] || '#6b5a3a';
/** "§5.3" from a LaTeXML section id; "App. B.2" from an appendix id; '' for anything else. */
export function secLabel(sec) {
  let m;
  if ((m = /^S(\d+)(?:\.SS(\d+))?(?:\.SSS(\d+))?/.exec(sec || ''))) return '§' + [m[1], m[2], m[3]].filter((x) => x && x !== '0').join('.');
  if ((m = /^A(\d+)(?:\.SS(\d+))?/.exec(sec || ''))) return 'App. ' + String.fromCharCode(64 + Number(m[1])) + (m[2] && m[2] !== '0' ? '.' + m[2] : '');
  return '';
}
const prettySlug = (s) => String(s || '').replace(/[-_]+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());
/** Where a cite points, as the reader sees it: "p. 19 · §5.3", "p. vi", "¶ 52", "abstract". */
export function placeText(it, c = {}) {
  const parts = [];
  if (c.page != null && it && !isFlow(it)) parts.push('p. ' + (c.label || c.page + 1));
  const s = secLabel(c.sec);
  if (s) parts.push(s);
  if (!parts.length) {
    const loc = String(c.loc || '');
    let m;
    if (loc === 'abstract') parts.push('abstract');
    else if ((m = /^p(\d+)$/.exec(loc))) parts.push('¶ ' + (Number(m[1]) + 1));
    else if ((m = /^img(\d+)$/.exec(loc))) parts.push('image ' + (Number(m[1]) + 1));
    else if ((m = /^tbl(\d+)$/.exec(loc))) parts.push('table ' + (Number(m[1]) + 1));
    else if (loc) parts.push(loc);
  }
  return parts.join(' · ');
}
const KIND = { hook: 'Hook', finding: 'Finding', method: 'Method', figure: 'Figure', implication: 'What it changes', caveat: 'Caveat', read: 'What to read' };
const LEADS = /^(How(?:, in one line)?:|What it changes:|Caveat:|Limits:|Why:|Read it if\b)/;
/** The post's text with its lead-in ("How:", "Caveat:", "Read it if") set apart. */
function textOf(t) {
  const m = LEADS.exec(t);
  return m ? [h('b', { className: 'th-lead', textContent: m[1] }), t.slice(m[1].length)] : [t];
}
/** "Opus" / "Opus, revised in an editing pass" / "Haiku" / "mock": who wrote it, briefly. A model's
 *  "hand-written" means written in an agent session rather than by the generator: no person checked it. */
export function writer(th) {
  const m = String(th?.model || '');
  if (/mock/i.test(m)) return 'mock';
  const fam = (/fable/i.test(m) && 'Fable') || (/opus/i.test(m) && 'Opus') || (/sonnet/i.test(m) && 'Sonnet') || (/haiku/i.test(m) && 'Haiku') || 'a model';
  return /editor/i.test(m) ? `${fam}, revised in an editing pass` : fam;
}
const okCount = (th) => { const q = th?.checks?.quotes; const n = th.posts.filter((p) => p.cite?.ok).length; return q ? `${n}/${th.posts.length}` : ''; };
const minutes = (th) => Math.max(1, Math.round(th.posts.reduce((a, p) => a + p.t.split(/\s+/).length, 0) / 240));
/** The posts a closed card shows: the hook, the finding and the caveat (the claim and what most weakens it). */
export function closedPosts(posts) {
  if (posts.length <= 4) return posts.map((_, k) => k);
  const at = (kind) => posts.findIndex((p) => p.kind === kind);
  const second = at('finding') > 0 ? at('finding') : 1;
  let third = at('caveat');
  if (third < 0) third = posts.findIndex((p, k) => k > second && p.kind !== 'read');
  return [...new Set([0, second, third].filter((k) => k >= 0))].sort((a, b) => a - b);
}

// ---------------------------------------------------------------- the figure
const renderUrl = (it, k, w = 1400, wait = 4000) => `/render/page?u=${encodeURIComponent(it.url)}&k=${k}&w=${w}&wait=${wait}`;
const PAGE_AR = { scan: 0.66, pdf: 0.773 }; // a page's width / height before it has loaded (book scans; US Letter)
/** What the card shows as the thread's picture, before any size is known: {kind: 'img'|'page', src, box?, ar?, label, approx}. */
export function figSpec(card) {
  const th = card.th, it = items[byId.get(card.id)], f = th?.figure;
  if (!f || !it) return null;
  // The figure post, when it is about this figure: its name for it ("Figure 3", "Table I") and its chart readings.
  const fp = th.posts.find((p) => p.kind === 'figure' && (!p.cite?.fig || !f.fig || p.cite.fig === f.fig));
  const lead = fp ? (/^([^:]{2,40}):/.exec(fp.t) || [])[1] || '' : '';
  const named = /^(?:Figures?|Fig\.|Tables?|Charts?|Plates?|Panel)\s*(?:[A-Z]|[IVX]+|\d+)(?:\.\d+)?[a-z]?\b/i.exec(lead);
  let m;
  const fromId = (m = /\.([FT])(\d+)/.exec(f.fig || '')) ? `${m[1] === 'T' ? 'Table' : 'Figure'} ${m[2]}` : /^tbl/.test(f.fig || '') ? 'Table' : /^img/.test(f.fig || '') ? 'Picture' : /^fig/.test(f.fig || '') ? 'Chart' : /^k\d/.test(f.fig || '') ? 'Page' : 'Figure';
  const own = named ? named[0] : lead.split(/[,(;]/)[0].trim();
  const label = own && !/^(?:img|fig|tbl|k)\d+$|^S\d/.test(own) && own.split(' ').length <= 4 ? own : fromId; // not a bare marker, not a sentence
  const base = { label, approx: !!fp?.approx, page: f.page, pageLabel: f.label, k: fp ? th.posts.indexOf(fp) : -1 };
  if (f.img) return { ...base, kind: 'img', src: /^https?:\/\/([^/]*\.)?archive\.org\//.test(f.img) ? P(f.img) : f.img };
  if (f.page == null) return null;
  if (it.kind === 'scan' && it.ia) {
    const box = f.box || [0.04, 0.04, 0.96, 0.96];
    return { ...base, kind: 'page', src: P(scanUrl(it, f.page, 1000)), box, ar: ((box[2] - box[0]) / (box[3] - box[1])) * PAGE_AR.scan };
  }
  if (it.kind === 'pdf' && f.box && /^https?:\/\//.test(it.url || '')) {
    const box = f.box;
    return { ...base, kind: 'page', src: renderUrl(it, f.page), pdf: true, box, ar: ((box[2] - box[0]) / (box[3] - box[1])) * PAGE_AR.pdf };
  }
  return null;
}
/** figSpec(), or for an arXiv figure stored without an image, its image from GET /figures (the one panel `part` names). */
export async function figSpecOf(card) {
  const spec = figSpec(card);
  if (spec) return spec;
  const it = items[byId.get(card.id)], f = card.th?.figure;
  if (!it || !f?.fig || !arxivId(it)) return null;
  const figs = await figuresOf(it, 1).catch(() => null);
  const g = (Array.isArray(figs) ? figs : []).find((x) => x.id === f.fig);
  const img = (f.part != null && g?.parts?.[f.part]?.img) || g?.img;
  return img ? figSpec({ ...card, th: { ...card.th, figure: { ...f, img } } }) : null;
}
/** Ask the server to fetch a PDF (its page renders need it on disk). */
const asked = new Set();
function fetchPdf(it, pri = 40) {
  if (asked.has(it.url)) return;
  asked.add(it.url);
  fetch('/prefetch', { method: 'POST', body: JSON.stringify({ urls: [it.url], pri, group: 'threads' }) }).catch(() => {});
}
/** A crop of a page image (box in fractions of the page) contained in w × hh, positioned once the image has loaded. */
function cropEl(spec, it, w, hh) {
  const box = spec.box || [0, 0, 1, 1];
  const el = h('div', { className: 'th-crop', style: `width:${Math.round(w)}px;height:${Math.round(hh)}px${spec.pdf ? ';background:#fff' : ''}` });
  const im = h('img', { alt: '', decoding: 'async', draggable: false, loading: 'lazy' });
  const fit = () => {
    const iw = im.naturalWidth, ih = im.naturalHeight; if (!iw || !ih) return;
    const bw = (box[2] - box[0]) * iw, bh = (box[3] - box[1]) * ih;
    const s = Math.min(w / bw, hh / bh);
    // Clipped to the box: when the box is narrower (or flatter) than the frame, the rest of the page (a
    // neighbouring panel, its cut-off legend) would otherwise show beside it.
    const px = (v) => (v * s).toFixed(1) + 'px';
    Object.assign(im.style, { width: iw * s + 'px', height: ih * s + 'px', left: (w - bw * s) / 2 - box[0] * iw * s + 'px', top: (hh - bh * s) / 2 - box[1] * ih * s + 'px',
      clipPath: `inset(${px(box[1] * ih)} ${px((1 - box[2]) * iw)} ${px((1 - box[3]) * ih)} ${px(box[0] * iw)})` });
    el.classList.add('ok');
  };
  let tries = 0;
  im.onload = fit;
  im.onerror = () => {
    // A PDF not on the server's disk yet answers 204: have it fetched, then ask again (for about 35 s: a long
    // PDF from a slow host, queued behind the reader's own prefetches, can take that long on a cold cache).
    if (spec.pdf && tries++ < 8) { fetchPdf(it); setTimeout(() => { if (im.isConnected) im.src = spec.src + '&try=' + tries; }, Math.min(5000, 1500 * tries)); return; }
    el.classList.add('broken');
    el.replaceChildren(h('span', { className: 'fd-na', textContent: `p. ${spec.pageLabel || spec.page + 1}: picture unavailable` }));
  };
  im.src = spec.src;
  el.append(im);
  return el;
}
/** The card's figure box at width w, its height known from `spec.ar` (or the image's own size, measured before placement). */
function figureEl(spec, it, w) {
  const ar = spec.ar || (spec._w && spec._h ? spec._w / spec._h : 1.6);
  const cap = Math.max(170, Math.min(260, innerHeight * 0.27)); // the hook stays the card's lead on a laptop screen
  const hh = Math.round(Math.min(cap, Math.max(90, w / Math.max(0.55, Math.min(3.2, ar)))));
  let art;
  if (spec.kind === 'page') art = cropEl(spec, it, w, hh);
  else {
    art = h('div', { className: 'th-img', style: `height:${hh}px` });
    const im = h('img', { src: spec.src, alt: '', loading: 'lazy', decoding: 'async', draggable: false });
    im.referrerPolicy = 'no-referrer';
    im.onerror = () => { art.classList.add('broken'); art.replaceChildren(h('span', { className: 'fd-na', textContent: 'picture unavailable' })); };
    art.append(im);
  }
  const where = spec.page != null ? 'p. ' + (spec.pageLabel || spec.page + 1) : '';
  return withK(h('figure', { className: 'th-fig' + (spec.kind === 'page' ? ' page' : '') }, art,
    h('figcaption', {}, h('b', { textContent: spec.label }), [where, spec.approx && spec.k >= 0 ? `post ${spec.k + 1} reads values off it` : ''].filter(Boolean).join(' · '))), spec.k);
}

// ---------------------------------------------------------------- the card
const withK = (el, k) => { el.dataset.k = k; return el; }; // which post an element stands for (data-k)
function postEl(it, th, k) {
  const p = th.posts[k], c = p.cite || {};
  const at = placeText(it, c);
  return withK(h('div', { className: `th-post k-${p.kind}` },
    h('span', { className: 'th-n', textContent: String(k + 1) }),
    h('div', { className: 'th-tx' }, ...textOf(p.t), ' ',
      h('span', { className: 'th-at' + (c.ok ? ' ok' : ' unv'), title: (c.ok ? 'Quote found in the source: ' : 'Quote not re-checked: ') + '“' + (c.quote || '') + '”' },
        at || 'cited', c.ok ? h('i', { textContent: '✓' }) : null, p.approx ? h('span', { className: 'th-ap', textContent: '≈ chart' }) : null))), k);
}
/** The foot every thread card shares: type icon, title, lane, date, and who wrote the thread. */
function footEl(it, th) {
  const t = TYPES[typeOf(it)]?.[1] || '';
  return h('footer', { className: 'th-foot' },
    h('span', { className: 'th-ic', style: `--lc:${laneColor(it)}` }, itemIcon(it, 15)),
    h('div', { className: 'fd-who' },
      h('div', { className: 'fd-t', textContent: it.t }),
      h('div', { className: 'fd-m' }, h('i', { className: 'dot', style: `background:${laneColor(it)}` }), h('span', { textContent: [LANES[it.lane] || it.lane, yearOf(it), t].filter(Boolean).join(' · ') }))),
    h('span', { className: 'th-by', title: `Written by ${th.model}; ${okCount(th)} quotes found in the source${th.checks?.at ? ' (checked ' + th.checks.at + ')' : ''}` },
      h('span', { className: 'fd-mk ai', textContent: 'AI' }), ' ', okCount(th) ? h('span', { className: 'th-okn', textContent: '✓ ' + okCount(th) }) : null));
}
/** The thread card at width W. `fig`: the figure spec prepare() resolved (or none); `open`: every post. */
export function threadCardEl(card, W, fig, { open = false } = {}) {
  const it = items[byId.get(card.id)], th = card.th;
  const el = h('article', { className: 'fd-card t-thread' + (open ? ' open' : '') });
  el.style.width = W + 'px';
  const show = open ? th.posts.map((_, k) => k) : closedPosts(th.posts);
  const body = h('div', { className: 'th-body' });
  body.append(h('div', { className: 'th-top' }, h('span', { textContent: `Thread · ${th.posts.length} posts · ${minutes(th)} min` }), th.basis === 'abstract' ? h('span', { className: 'fd-mk', textContent: 'from the abstract' }) : null));
  const first = postEl(it, th, 0); first.classList.add('first');
  body.append(first);
  if (fig) body.append(figureEl(fig, it, W - 50));
  for (const k of show.slice(1)) body.append(postEl(it, th, k));
  body.lastElementChild.classList.add('last');
  const hidden = th.posts.length - show.length;
  if (hidden > 0) {
    const kinds = th.posts.map((p, k) => (show.includes(k) ? null : KIND[p.kind])).filter(Boolean);
    body.append(h('button', { className: 'th-more', title: 'Show every post (t)' }, h('b', { textContent: `+${hidden} more` }), ' · ' + kinds.join(' · ')));
  } else if (open && th.posts.length > closedPosts(th.posts).length) body.append(h('button', { className: 'th-more less', title: 'Show fewer posts (t)', textContent: 'Show less' }));
  el.append(body, footEl(it, th));
  return el;
}
/** A card for the feed (features/feeds.js): one per item with a thread. */
export const threadCard = (id, th) => ({ cid: id + '#th', id, type: 'thread', th });

// ---------------------------------------------------------------- the quote on its page
const skel = (s) => String(s || '').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
/** Find skel(quote) in a sequence of strings; → [first, last] indexes of the strings it covers, or null. */
function spanOf(strs, quote) {
  const q = skel(quote);
  if (q.length < 10) return null;
  let sk = ''; const at = [];
  strs.forEach((s, j) => { const x = skel(s); for (let c = 0; c < x.length; c++) at.push(j); sk += x; });
  let i = sk.indexOf(q), n = q.length;
  if (i < 0) { // the start or end may differ (a hyphenated word, a symbol): its longest found prefix of at least 24 letters,
    // else its longest found suffix (a quote that starts at the foot of the page before)
    const longest = (cut) => {
      let lo = Math.min(24, q.length), hi = q.length;
      if (sk.indexOf(cut(lo)) < 0) return 0;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (sk.indexOf(cut(mid)) >= 0) lo = mid; else hi = mid - 1; }
      return lo;
    };
    const head = (m) => q.slice(0, m), tail = (m) => q.slice(q.length - m);
    n = longest(head);
    if (n) i = sk.indexOf(head(n));
    else if ((n = longest(tail))) i = sk.indexOf(tail(n));
    else return null;
  }
  return [at[i], at[i + n - 1]];
}
/** Boxes of the quote on page k, in fractions of the page: from the OCR words (scans) or pdf.js's text (PDFs). */
export async function quoteBoxes(it, k, quote) {
  if (it.kind === 'scan' && it.ia) {
    const r = await fetch(`/ocr?ia=${encodeURIComponent(it.ia)}&k=${k}`);
    if (!r.ok) return [];
    const o = await r.json();
    const ws = o.words || [];
    const sp = spanOf(ws.map((w) => w.t), quote);
    if (!sp || !o.w || !o.h) return [];
    return mergeLines(ws.slice(sp[0], sp[1] + 1).map((w) => [w.x0 / o.w, w.y0 / o.h, w.x1 / o.w, w.y1 / o.h]));
  }
  if (it.kind !== 'pdf') return [];
  const d = await openDoc(it);
  if (!d.pdf || k >= d.n) return [];
  const page = await d.pdf.getPage(k + 1);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const its = tc.items.filter((x) => x.str);
  const sp = spanOf(its.map((x) => x.str), quote);
  if (!sp) return [];
  return mergeLines(its.slice(sp[0], sp[1] + 1).map((x) => {
    const hgt = Math.hypot(x.transform[2], x.transform[3]) || x.height || 10;
    const [a, b, c, e] = vp.convertToViewportRectangle([x.transform[4], x.transform[5] - hgt * 0.22, x.transform[4] + x.width, x.transform[5] + hgt * 0.9]);
    return [Math.min(a, c) / vp.width, Math.min(b, e) / vp.height, Math.max(a, c) / vp.width, Math.max(b, e) / vp.height];
  }));
}
/** Join boxes on the same line into one. */
function mergeLines(bs) {
  const out = [];
  for (const b of bs) {
    const last = out.at(-1);
    if (last && Math.abs((last[1] + last[3]) / 2 - (b[1] + b[3]) / 2) < (b[3] - b[1]) * 0.6) { last[0] = Math.min(last[0], b[0]); last[1] = Math.min(last[1], b[1]); last[2] = Math.max(last[2], b[2]); last[3] = Math.max(last[3], b[3]); }
    else out.push([...b]);
  }
  return out;
}
/** A whole page as an image w px wide, with the quote's boxes marked once found. Scans: the page image; PDFs: the render server's page, else pdf.js. */
function pageView(it, k, quote, w, live, { box } = {}) {
  const wrap = h('div', { className: 'th-page' });
  const marks = h('div', { className: 'th-marks' });
  const pct = (x) => (x * 100).toFixed(2) + '%';
  // The figure's box (a figure post), then the quote's lines once found.
  if (box) marks.append(h('b', { className: 'th-box', style: `left:${pct(box[0])};top:${pct(box[1])};width:${pct(box[2] - box[0])};height:${pct(box[3] - box[1])}` }));
  const boxes = () => {
    if (!quote) return;
    quoteBoxes(it, k, quote).then((bs) => {
      if (!live() || !bs.length) return;
      marks.append(...bs.map(([x0, y0, x1, y1]) => h('i', { style: `left:${pct(x0)};top:${pct(y0)};width:${pct(x1 - x0)};height:${pct(y1 - y0)}` })));
      // Bring the quote into view in the panel when it is below the fold (one layout read, once).
      const body = wrap.closest('.pk-body');
      if (body) requestAnimationFrame(() => {
        if (!live()) return;
        const wr = wrap.getBoundingClientRect(), br = body.getBoundingClientRect();
        const y = wr.top - br.top + body.scrollTop + bs[0][1] * wr.height;
        if (y > body.scrollTop + body.clientHeight * 0.85) body.scrollTop = y - body.clientHeight * 0.55;
      });
    }).catch(() => {});
  };
  if (it.kind === 'scan') {
    const im = sharpImg(P(scanUrl(it, k, 600)), P(scanUrl(it, k, 1000)), { cls: 'th-pimg' });
    wrap.append(im, marks);
    boxes();
    return wrap;
  }
  // PDFs: the server's render (a JPEG, at once when it has one), else pdf.js draws the page here.
  const im = h('img', { className: 'th-pimg', alt: '', decoding: 'async', draggable: false });
  const viaPdfjs = async () => {
    try {
      const d = await openDoc(it);
      if (!live() || k >= d.n) return;
      const page = await d.pdf.getPage(k + 1);
      const v1 = page.getViewport({ scale: 1 });
      const scale = (w * Math.min(2, devicePixelRatio || 1)) / v1.width;
      const vp = page.getViewport({ scale });
      const c = h('canvas', { className: 'th-pimg' }); c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: g, viewport: vp }).promise;
      if (live()) im.replaceWith(c);
    } catch { if (live()) wrap.replaceChildren(h('div', { className: 'fd-na', textContent: 'page unavailable' })); }
  };
  im.onerror = () => { fetchPdf(it, 60); viaPdfjs(); };
  im.src = renderUrl(it, k, 1400, 2500);
  wrap.append(im, marks);
  boxes();
  return wrap;
}
/** Posts and web pages: the stable page (about 280 words) that holds the quote, with the quote marked. */
async function flowPage(it, quote, live) {
  const box = h('div', { className: 'th-flow', textContent: 'Finding the passage…' });
  (async () => {
    try {
      const d = await openDoc(it);
      if (!live()) return;
      const q = skel(quote).slice(0, 60);
      let k = (d.texts || []).findIndex((t) => skel(t).includes(q));
      if (k < 0) k = await findPage(it, { id: 'th:' + skel(quote).slice(0, 48), caption: quote, at: 0 }).catch(() => null) ?? -1;
      if (!live()) return;
      if (k < 0) { box.textContent = 'The passage was not found in the page as the app shows it.'; return; }
      box.replaceChildren(h('div', { className: 'th-flowk', textContent: `page ${k + 1} of ${d.n} as the app shows it` }));
      for (const para of String(d.texts[k]).split('\n')) {
        const p = h('p', {});
        const sp = spanOfChars(para, quote);
        if (sp) { p.append(para.slice(0, sp[0]), h('mark', { textContent: para.slice(sp[0], sp[1]) }), para.slice(sp[1])); }
        else p.textContent = para;
        box.append(p);
      }
      const m = box.querySelector('mark');
      if (m) requestAnimationFrame(() => {
        const body = box.closest('.pk-body'); if (!body || !live()) return;
        const y = m.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop;
        if (y > body.scrollTop + body.clientHeight * 0.85) body.scrollTop = y - body.clientHeight * 0.45;
      });
    } catch { if (live()) box.textContent = 'Page unavailable.'; }
  })();
  return box;
}
/** Character range [a, b) of the quote in a paragraph (on letters and digits), or null. */
function spanOfChars(t, quote) {
  const q = skel(quote);
  if (q.length < 10) return null;
  let sk = ''; const at = [];
  for (let i = 0; i < t.length;) { const ch = String.fromCodePoint(t.codePointAt(i)); for (const c of skel(ch)) { sk += c; at.push(i); } i += ch.length; }
  const i = sk.indexOf(q);
  if (i < 0) return null;
  return [at[i], at[i + q.length - 1] + 1];
}

// ---------------------------------------------------------------- peeks
function metaEl(it, th) {
  return h('div', { className: 'pk-meta' },
    h('div', { className: 'pk-title', textContent: it.t }),
    h('div', { className: 'pk-by' }, h('i', { className: 'dot', style: `background:${laneColor(it)}` }), [it.a, yearOf(it), LANES[it.lane] || it.lane].filter(Boolean).join(' · ')),
    checksEl(th));
}
function checksEl(th) {
  const ch = th.checks || {};
  const parts = [`Written by ${writer(th)}`];
  if (ch.quotes) parts.push(`${th.posts.filter((p) => p.cite?.ok).length} of ${th.posts.length} quotes found in the source`);
  if (ch.numbers?.[1]) parts.push(`${ch.numbers[0]} of ${ch.numbers[1]} numbers too`);
  if (ch.at) parts.push(`checked ${ch.at}`);
  const flags = (ch.flags || []).filter((f) => !/^repeat:/.test(f));
  return h('div', { className: 'th-checks' }, parts.join(' · ') + '. AI-written: it may be wrong.',
    flags.length ? h('details', {}, h('summary', { textContent: `${flags.length} note${flags.length > 1 ? 's' : ''} from the checker` }), h('ul', {}, ...flags.map((f) => h('li', { textContent: f })))) : null);
}
/** The whole thread, large: each post with its quote under it. */
export function renderThreadPeek(card, body, ctx) {
  const it = items[byId.get(card.id)], th = card.th;
  if (!it || !th) return;
  const spec = figSpec(card);
  th.posts.forEach((p, k) => {
    const c = p.cite || {};
    body.append(withK(h('div', { className: `th-pk k-${p.kind}` },
      h('div', { className: 'th-pkh' }, h('span', { className: 'th-n', textContent: `${k + 1}/${th.posts.length}` }), h('span', { className: 'th-kd', textContent: KIND[p.kind] }), h('span', { className: 'th-at' + (c.ok ? ' ok' : ' unv') }, placeText(it, c), c.ok ? h('i', { textContent: '✓' }) : null)),
      h('p', { className: 'th-pkt' }, ...textOf(p.t)),
      h('blockquote', { className: 'th-q' }, '“' + c.quote + '”')), k));
    if (k === 0 && spec) {
      const W = ctx.width - 40;
      body.append(spec.kind === 'page' ? h('figure', { className: 'pk-fig' }, h('div', { className: 'pk-art' + (it.kind === 'scan' ? ' plate' : '') }, cropEl(spec, it, W - 32, Math.min(innerHeight * 0.55, (W - 32) / Math.max(0.5, spec.ar)))))
        : h('figure', { className: 'pk-fig' }, h('div', { className: 'pk-art' }, Object.assign(sharpImg(spec.src, null, { referrer: true }), { style: `max-width:100%;max-height:${Math.round(innerHeight * 0.55)}px` }))));
    }
  });
  body.append(metaEl(it, th), h('div', { className: 'pk-keys', textContent: 'hover a post for its page · click it to open there · t all posts · q quote · s save · o original' }));
}
/** One post (rest the pointer on it): the post, its quote, and the page it cites with the quote marked. */
export function renderPostPeek(ref, body, ctx) {
  const it = items[byId.get(ref.id)], th = ref.th, p = th?.posts[ref.k];
  if (!it || !p) return;
  const c = p.cite || {};
  body.append(
    h('div', { className: 'th-pkh' }, h('span', { className: 'th-n', textContent: `${ref.k + 1}/${th.posts.length}` }), h('span', { className: 'th-kd', textContent: KIND[p.kind] }), h('span', { className: 'th-at' + (c.ok ? ' ok' : ' unv') }, placeText(it, c), c.ok ? h('i', { textContent: '✓' }) : null)),
    h('p', { className: 'th-pkt big' }, ...textOf(p.t)),
    h('blockquote', { className: 'th-q' }, '“' + c.quote + '”', c.ok ? h('span', { className: 'ok', textContent: ' ✓ found in the source', title: c.match === 'exact' ? 'Found exactly' : c.match === 'joined' ? 'Found with OCR line-break hyphens joined' : 'Found on letters and digits' }) : h('span', { className: 'unv', textContent: ' not re-checked' })));
  const W = ctx.width - 40;
  const fig = th.figure && p.kind === 'figure' && th.figure.page === c.page ? th.figure.box : null;
  if (c.page != null && !isFlow(it)) body.append(pageView(it, c.page, c.quote, W, ctx.live, { box: fig }));
  else if (isFlow(it)) flowPage(it, c.quote, ctx.live).then((el) => { if (ctx.live()) body.insertBefore(el, body.querySelector('.pk-meta')); });
  if (p.kind === 'read' && Array.isArray(c.spans) && c.spans.some((s) => typeof s[0] === 'number')) {
    body.append(h('div', { className: 'th-spans' }, 'Recommended: ', c.spans.filter((s) => typeof s[0] === 'number').map(([a, b]) => (a === b ? `p. ${a + 1}` : `pp. ${a + 1}–${b + 1}`)).join(', ')));
  }
  body.append(metaEl(it, th), h('div', { className: 'pk-keys', textContent: `click: open at ${placeText(it, c) || 'the place'} · Enter the same · q quote this to your note · t all posts` }));
}

// ---------------------------------------------------------------- the panel
const openPanel = new Set(); // item ids whose Thread section shows every post (this session)
let markGen = 0;
/** Light the quote on the current item's pages once they are on screen, for 4 s (a few tries: text layers come late). */
export function markSoon(i, quote) {
  const gen = ++markGen;
  // The first 12 words; when they are not together on screen (a quote over a page break or past a figure), the last 12, then the first 6.
  const w = String(quote).split(/\s+/).filter(Boolean);
  const targets = [w.slice(0, 12), w.length > 12 ? w.slice(-12) : null, w.length > 6 ? w.slice(0, 6) : null].filter(Boolean).map((x) => skel(x.join(' '))).filter((t, n) => t.length >= (n ? 24 : 12));
  if (skel(w.slice(0, 12).join(' ')).length < 12) return;
  const tryAt = async (k) => {
    if (gen !== markGen || current() !== i || state.view !== 'feed') return;
    const r = await currentWords().catch(() => null);
    const ws = r?.words || [];
    const sk = ws.map((w) => skel(w.text));
    for (const target of targets) for (let j = 0; j < ws.length; j++) {
      if (!sk[j] || !target.startsWith(sk[j].slice(0, Math.min(sk[j].length, target.length)))) continue;
      let acc = '', e = j;
      while (e < ws.length && acc.length < target.length) acc += sk[e++];
      if (acc.startsWith(target) || target.startsWith(acc)) {
        const run = ws.slice(j, e);
        highlight('fd', run); reveal(run[0]);
        // A page just drawn has its words before its text layer's spans: light the spans that exist by then too (as feeds.js showMark does).
        for (const ms of [300, 800, 1600, 2800]) setTimeout(() => { if (gen === markGen && current() === i) highlight('fd', run); }, ms);
        setTimeout(() => { if (gen === markGen) highlight('fd', []); }, 4000);
        return;
      }
    }
    if (k < 5) setTimeout(() => tryAt(k + 1), [200, 400, 700, 1200, 2400][k]);
  };
  setTimeout(() => tryAt(0), 150);
}
/** Go to a post's page in the item on screen, and light its quote. */
async function goPost(it, p) {
  const i = current(); if (items[i]?.id !== it.id) return;
  const c = p.cite || {};
  let k = !isFlow(it) && c.page != null ? c.page : null;
  if (k == null) k = await findPage(it, { id: 'th:' + skel(c.quote).slice(0, 48), caption: c.quote, at: 0 }).catch(() => null);
  if (k == null || current() !== i) return;
  goPage(k);
  markSoon(i, c.quote);
}
function paintSection(it, box) {
  const th = threadOf(it.id);
  const sec = box.closest('section');
  if (!th) { if (sec) sec.hidden = true; return; }
  if (sec) sec.hidden = false;
  const open = openPanel.has(it.id);
  const show = open ? th.posts.map((_, k) => k) : closedPosts(th.posts);
  const row = (k) => {
    const p = th.posts[k], c = p.cite || {};
    return h('li', { className: `th-li k-${p.kind}`, title: `Go to ${placeText(it, c) || 'the place'} and light the quote: “${c.quote}”`, onclick: () => goPost(it, p) },
      h('span', { className: 'th-n', textContent: String(k + 1) }),
      h('span', { className: 'th-tx' }, ...textOf(p.t), ' ', h('span', { className: 'th-at' + (c.ok ? ' ok' : ' unv') }, placeText(it, c), c.ok ? h('i', { textContent: '✓' }) : null, p.approx ? h('span', { className: 'th-ap', textContent: '≈ chart' }) : null)));
  };
  const hidden = th.posts.length - show.length;
  box.replaceChildren(
    h('ol', { className: 'th-list' }, ...show.map(row)),
    hidden > 0 || open ? h('button', { className: 'th-more', textContent: open ? 'Show less' : `+${hidden} more: ${th.posts.filter((_, k) => !show.includes(k)).map((p) => KIND[p.kind]).join(' · ')}`, onclick: () => { if (open) openPanel.delete(it.id); else openPanel.add(it.id); paintSection(it, box); } }) : null,
    h('div', { className: 'th-note' }, `AI-written (${writer(th)}) · ${okCount(th)} quotes found in the source · may be wrong`));
}
registerSection({
  id: 'thread', title: 'Thread', order: 22,
  render(it) {
    if (it.lane === 'local') return null; // your own files: no threads (they are written from public sources only)
    const box = h('div', { className: 'th-sec' });
    if (TH.has(it.id)) { queueMicrotask(() => paintSection(it, box)); return box; }
    loadThread(it.id).then(() => { if (state.panelItem === it.id && box.isConnected) paintSection(it, box); });
    queueMicrotask(() => { const sec = box.closest('section'); if (sec && !TH.has(it.id)) sec.hidden = true; });
    return box;
  },
});
// The next items' threads, in one request, so the section paints at once when you get there.
let aheadT = null;
on('item:settled', () => {
  clearTimeout(aheadT);
  aheadT = setTimeout(() => {
    const ids = state.order.slice(state.pos + 1, state.pos + 9).map((j) => items[j]?.id).filter((id) => id && !TH.has(id) && !/^local:/.test(id));
    if (ids.length && !threadsInfo.missing) getJson('/threads.json?ids=' + ids.map(encodeURIComponent).join(',')).then((j) => { if (j) take(j); for (const id of ids) if (!TH.has(id)) TH.set(id, null); }).catch(() => {});
  }, 1500);
});

window.__threads = { TH, threadsInfo, laneThreads, loadThread, quoteBoxes, placeText, closedPosts };
