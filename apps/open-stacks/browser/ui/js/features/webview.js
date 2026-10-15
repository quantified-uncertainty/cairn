// Web pages in the Stacks Browser: reading single-column web articles in
// columns, and looking at the original page when it is interactive.
//
// 1. Extraction (kind 'web'): Mozilla Readability, with site rules for
//    LaTeXML (arXiv HTML, ar5iv) and Distill-style articles (distill.pub,
//    transformer-circuits.pub), and the old heuristic as a fallback. Keeps
//    figures, tables, code, MathML and embeds; resolves relative URLs against
//    the page's final URL; recovers lazy images (data-src, data-srcset,
//    <noscript> fallbacks); reserves image space so columns do not jump.
// 2. Math: TeX is recovered from whatever the page shipped (MathJax output in
//    LessWrong posts, <d-math>, prerendered KaTeX, MathJax <script> tags) and
//    rendered with KaTeX. MathML (LaTeXML) renders natively, in STIX Two Math.
// 3. H on an arXiv PDF: read its HTML version (arxiv.org/html, else ar5iv) in
//    columns, at the same place; remembered per item; the next arXiv items'
//    HTML is prefetched once you have used H.
// 4. N on a web page: the live original, scripts running, in N side-by-side
//    views of the same page, each one screen further down (see "Live N-up").
// 5. Embeds (YouTube, Manifold, Metaculus, ...) stay live iframes sized to the column.
//
// Dev: open the app with ?webtest=1 for a "Web (test)" lane of sample pages.
import { $, h, P, on, store, toast, registerKey } from '../util.js';
import { items, LANES, COUNTS, byId, laneMax } from '../corpus.js';
import { state, current } from '../state.js';
import { extractors, openDoc, peekDoc, markWidgets } from '../docs.js';
import { showFeed } from '../feed.js';
import { live as flowLive } from '../flow.js';

const KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.22/';
const READABILITY = 'https://cdn.jsdelivr.net/npm/@mozilla/readability@0.6.0/+esm';
const idle = () => new Promise((r) => (window.requestIdleCallback || setTimeout)(r, { timeout: 400 }));

// ---------------------------------------------------------------- libraries

let katexP = null;
/** KaTeX, with its stylesheet; fonts come through the proxy like everything else. */
function katex() {
  return (katexP ||= Promise.all([
    import(P(KATEX + '+esm')).then((m) => m.default || m),
    fetch(P(KATEX + 'dist/katex.min.css')).then((r) => r.text()).then((t) => {
      document.head.append(h('style', { id: 'wv-katex', textContent: t.replace(/url\((fonts\/[^)]+)\)/g, (_, f) => `url(${P(KATEX + 'dist/' + f)})`) }));
    }),
  ]).then(([k]) => k));
}
let readP = null;
const readability = () => (readP ||= import(P(READABILITY)).then((m) => m.Readability));

// ---------------------------------------------------------------- page clean-up

const EMBEDS = /youtube(-nocookie)?\.com|youtu\.be|vimeo\.com|loom\.com|manifold\.markets|metaculus\.com|d3s0w6fek99l5b\.cloudfront|ourworldindata\.org|observablehq|datawrapper|flo\.uri\.sh|codepen\.io|twitter\.com|x\.com|desmos\.com|geogebra|streamable|elicit\.org|polymarket\.com/i;
const PLACEHOLDER = /^data:image\/(gif|png|svg)|blank\.|placeholder|spacer|transparent|1x1|pixel\./i;

/** Point the parsed document at the page's real address, so el.src, el.href
 *  and Readability resolve relative URLs correctly. */
function setBase(doc, url) {
  let base = url;
  const own = doc.querySelector('base[href]');
  if (own) { try { base = new URL(own.getAttribute('href'), url).href; } catch { /* keep */ } own.remove(); }
  doc.head.prepend(Object.assign(doc.createElement('base'), { href: base }));
  return base;
}

/** Lazy-loading images: the real URL is in data-* or in a <noscript> twin. */
function fixLazy(doc) {
  for (const img of doc.querySelectorAll('img')) {
    const src = img.getAttribute('src') || '';
    const lazy = ['data-src', 'data-lazy-src', 'data-original', 'data-hi-res-src', 'data-actualsrc', 'data-url'].map((a) => img.getAttribute(a)).find(Boolean);
    if (lazy && (!src || PLACEHOLDER.test(src) || src.length < 6)) img.setAttribute('src', lazy);
    const ls = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (ls && !img.getAttribute('srcset')) img.setAttribute('srcset', ls);
  }
  for (const s of doc.querySelectorAll('source[data-srcset]')) if (!s.getAttribute('srcset')) s.setAttribute('srcset', s.getAttribute('data-srcset'));
  // DOMParser parses <noscript> content as elements (scripting is off).
  for (const ns of [...doc.querySelectorAll('noscript')]) {
    const real = ns.querySelector('img');
    if (!real) continue;
    const prev = ns.previousElementSibling;
    const ph = prev && (prev.matches('img') ? prev : prev.querySelector('img'));
    if (ph && (!ph.getAttribute('src') || PLACEHOLDER.test(ph.getAttribute('src')) || /lazy|thumb|progressive/i.test(ph.className))) { ph.replaceWith(real); ns.remove(); }
    else if (!ns.parentElement?.querySelector('img:not(noscript img)')) ns.replaceWith(...ns.childNodes);
    else ns.remove();
  }
}

const URL_ATTRS = [['a', 'href'], ['img', 'src'], ['img', 'srcset'], ['source', 'src'], ['source', 'srcset'], ['video', 'src'], ['video', 'poster'], ['audio', 'src'], ['iframe', 'src'], ['track', 'src']];
/** Absolute URLs everywhere (srcset too); links to this same page become #anchors. */
function absolutize(root, base) {
  const abs = (v) => { try { return new URL(v, base).href; } catch { return v; } };
  for (const [tag, attr] of URL_ATTRS) for (const el of root.querySelectorAll(`${tag}[${attr}]`)) {
    const v = el.getAttribute(attr).trim();
    if (attr === 'srcset') el.setAttribute(attr, v.split(/,\s+/).map((c) => { const [u, ...d] = c.trim().split(/\s+/); return [abs(u), ...d].join(' '); }).join(', '));
    else if (!v.startsWith('#') && !/^(data|javascript|mailto|blob|tel):/i.test(v)) el.setAttribute(attr, abs(v));
  }
  const here = base.split('#')[0];
  for (const a of root.querySelectorAll('a[href*="#"]')) {
    const v = a.getAttribute('href'); const k = v.indexOf('#');
    if (k > 0 && v.slice(0, k) === here) a.setAttribute('href', v.slice(k));
  }
  // srcset without sizes means "100vw": far too big for a column.
  for (const img of root.querySelectorAll('img[srcset]')) if (/\d+w\b/.test(img.getAttribute('srcset')) && !/px|em/.test(img.getAttribute('sizes') || '')) img.setAttribute('sizes', '560px');
  for (const s of root.querySelectorAll('picture source[srcset]')) if (/\d+w\b/.test(s.getAttribute('srcset'))) s.setAttribute('sizes', '560px');
}

/** Reserve each image's box before it loads (prepareFlow drops width and
 *  height), so the columns do not reflow under the reader. */
function keepAspect(root) {
  for (const el of root.querySelectorAll('img[width][height], video[width][height]')) {
    const w = parseFloat(el.getAttribute('width')), hh = parseFloat(el.getAttribute('height'));
    if (!(w > 8 && hh > 8) || /%/.test(el.getAttribute('width') + el.getAttribute('height'))) continue;
    el.style.setProperty('--w', w + 'px'); el.style.setProperty('--r', String(w / hh));
    el.classList.add('wv-sized');
  }
}

/** Embedded iframes: live, full column width, at their own aspect ratio. */
const EMBED_H = [[/manifold\.markets/, 0, 400], [/metaculus|d3s0w6fek99l5b/, 0, 430], [/ourworldindata/, 4 / 3.2, 0], [/elicit\.org/, 0, 180], [/youtube|youtu\.be|vimeo|loom|streamable/, 16 / 9, 0]];
function sizeEmbeds(root) {
  for (const f of [...root.querySelectorAll('iframe')]) {
    const src = f.getAttribute('src') || '';
    if (!/^https?:/.test(src)) { f.remove(); continue; }
    const w = parseFloat(f.getAttribute('width')), hh = parseFloat(f.getAttribute('height'));
    const rule = EMBED_H.find(([re]) => re.test(src));
    let ratio = rule?.[1] || 0, px = rule?.[2] || 0;
    if (!rule && w > 50 && hh > 50 && !/%/.test(f.getAttribute('width') + f.getAttribute('height'))) ratio = w / hh;
    if (!ratio && !px) px = 360;
    f.classList.add('wv-embed');
    if (ratio) f.style.setProperty('--r', String(ratio)); else f.style.setProperty('--h', px + 'px');
    f.setAttribute('allowfullscreen', '');
    if (!f.getAttribute('allow')) f.setAttribute('allow', 'fullscreen; encrypted-media; picture-in-picture; clipboard-write');
  }
}

/** Drop a leading heading that repeats the item title (the flow shows its own). */
function dropTitle(root, title) {
  const n = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  for (const el of [...root.querySelectorAll('h1, h2')].slice(0, 2)) if (n(el.textContent) && n(el.textContent) === n(title)) el.remove();
}

// ---------------------------------------------------------------- math

/** Replace every math construct we can read TeX from with a placeholder
 *  <span class="wv-tex" data-display> holding the TeX; renderMath() turns
 *  those into KaTeX. Placeholders survive Readability. MathML is kept. */
function collectMath(root, { rawDelims = false } = {}) {
  const doc = root.ownerDocument || root;
  let n = 0;
  const ph = (el, tex, display) => {
    const s = doc.createElement('span');
    s.className = 'wv-tex'; s.dataset.display = display ? '1' : '';
    s.textContent = tex.trim();
    el.replaceWith(s); n++;
  };
  // MathJax 2 CommonHTML output (LessWrong): TeX is in the aria-label.
  for (const m of [...root.querySelectorAll('.mjx-math[aria-label]')]) {
    if (!root.contains(m)) continue;
    const outer = m.closest('.mjpage') || m.closest('.mjx-chtml') || m;
    const display = !!(outer.matches('.mjpage__block, .MJXc-display') || outer.querySelector('.MJXc-display') || outer.closest('.mjpage__block'));
    const wrap = outer.parentElement?.matches('.math-tex') && outer.parentElement.children.length === 1 ? outer.parentElement : outer;
    ph(wrap, m.getAttribute('aria-label'), display);
  }
  // MathJax input scripts: <script type="math/tex; mode=display">.
  for (const s of [...root.querySelectorAll('script[type^="math/tex"]')]) {
    for (let p = s.previousElementSibling; p && /MathJax/.test(p.className); p = s.previousElementSibling) p.remove();
    ph(s, s.textContent, /mode=display/.test(s.type));
  }
  // Prerendered KaTeX: the TeX is in the MathML annotation.
  for (const k of [...root.querySelectorAll('.katex')]) {
    if (!root.contains(k)) continue;
    const ann = k.querySelector('annotation[encoding="application/x-tex"]');
    if (!ann) continue;
    const outer = k.closest('.katex-display') || k;
    const host = outer.parentElement?.matches('d-math, dt-math') ? outer.parentElement : outer;
    ph(host, ann.textContent, !!k.closest('.katex-display') || host.hasAttribute?.('block'));
  }
  // Distill <d-math> (TeX as text; `block` for display).
  for (const d of [...root.querySelectorAll('d-math, dt-math')]) ph(d, d.textContent, d.hasAttribute('block'));
  // MathJax 3 keeps assistive MathML: use it natively.
  for (const c of [...root.querySelectorAll('mjx-container')]) {
    const mm = c.querySelector('mjx-assistive-mml math');
    if (mm) c.replaceWith(mm); else c.remove();
  }
  // Raw TeX left for a client-side renderer (LessWrong editor output, pages using auto-render).
  for (const s of [...root.querySelectorAll('.math-tex')]) {
    const t = s.textContent.trim();
    const m = t.match(/^\\\(([\s\S]*)\\\)$/) || t.match(/^\\\[([\s\S]*)\\\]$/) || t.match(/^\$\$([\s\S]*)\$\$$/);
    if (m && !s.querySelector('.wv-tex')) ph(s, m[1], !t.startsWith('\\('));
  }
  if (rawDelims) {
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.parentElement?.closest('pre, code, script, style, textarea, .wv-tex') ? NodeFilter.FILTER_REJECT : /\\\(|\\\[|\$\$/.test(t.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const hits = []; for (let t = walker.nextNode(); t; t = walker.nextNode()) hits.push(t);
    for (const t of hits) {
      const parts = t.data.split(/(\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]|\$\$[\s\S]+?\$\$)/);
      if (parts.length < 2) continue;
      const frag = doc.createDocumentFragment();
      parts.forEach((p, k) => {
        if (k % 2 === 0) { if (p) frag.append(p); return; }
        const s = doc.createElement('span'); s.className = 'wv-tex'; s.dataset.display = p.startsWith('\\(') ? '' : '1';
        s.textContent = p.slice(2, -2); frag.append(s); n++;
      });
      t.replaceWith(frag);
    }
  }
  return n;
}

/** Render the placeholders with KaTeX (HTML output only, so the text of a
 *  formula is its glyphs once). TeX KaTeX cannot parse stays visible as TeX. */
async function renderMath(root) {
  const slots = [...root.querySelectorAll('.wv-tex')];
  if (!slots.length) return 0;
  const K = await katex();
  const macros = {};
  let bad = 0;
  for (const s of slots) {
    const tex = s.textContent.replace(/\\label\{[^}]*\}|\\nonumber|\\notag/g, '');
    const display = s.dataset.display === '1';
    try {
      s.innerHTML = K.renderToString(tex, { displayMode: display, throwOnError: true, output: 'html', strict: 'ignore', trust: false, globalGroup: true, macros, maxExpand: 500 });
      s.className = display ? 'wv-math wv-display' : 'wv-math';
    } catch {
      bad++;
      s.className = 'wv-tex-raw'; s.textContent = display ? `\\[${tex}\\]` : `\\(${tex}\\)`;
    }
    s.title = tex.length < 400 ? tex : '';
    delete s.dataset.display;
  }
  return slots.length - bad;
}

// ---------------------------------------------------------------- site rules

/** A footnote/reference marker that the flow previews on hover and jumps from on click. */
const refMark = (doc, id, label, cls) => {
  const sup = doc.createElement('sup'); sup.className = cls;
  const a = doc.createElement('a'); a.href = '#' + id; a.textContent = label;
  sup.append(a); return sup;
};
function noteList(doc, title, notes, prefix) {
  const sec = doc.createElement('section'); sec.className = 'wv-notes';
  const hh = doc.createElement('h2'); hh.textContent = title;
  const ol = doc.createElement('ol');
  notes.forEach((html, k) => { const li = doc.createElement('li'); li.id = `${prefix}${k + 1}`; li.innerHTML = html; ol.append(li); });
  sec.append(hh, ol); return sec;
}

/** arXiv HTML and ar5iv (LaTeXML): the paper without the site around it;
 *  footnotes collected at the end; the bibliography last. */
function latexml(doc) {
  const root = doc.querySelector('article.ltx_document') || doc.querySelector('.ltx_document') || doc.querySelector('.ltx_page_main');
  root.querySelectorAll('.ltx_page_header, .ltx_page_footer, .ltx_TOC, nav, .ltx_page_logo, .ar5iv-footer, .ar5iv-header, .package-alerts, button, .ltx_authors, h1.ltx_title_document, .ltx_dates, .ltx_role_affiliationtext, #license-tr, .ltx_ERROR.undefined')
    .forEach((x) => x.remove());
  // MathML renders its first <semantics> child; the TeX and content-MathML
  // annotations would only triple the formula's text (word counts, summaries).
  root.querySelectorAll('math annotation, math annotation-xml').forEach((x) => x.remove());
  const notes = [];
  for (const n of [...root.querySelectorAll('.ltx_note')]) {
    if (!n.isConnected || n.parentElement.closest('.ltx_note')) continue;
    const c = n.querySelector('.ltx_note_content');
    if (!c) { n.remove(); continue; }
    c.querySelectorAll('.ltx_note_mark, .ltx_tag_note').forEach((x) => x.remove());
    const k = notes.push(c.innerHTML.trim());
    n.replaceWith(refMark(doc, 'wv-fn-' + k, String(k), 'wv-ref'));
  }
  // Display equations scroll sideways when wider than a column.
  for (const t of [...root.querySelectorAll('table.ltx_equation, table.ltx_equationgroup, table.ltx_eqn_table')]) {
    if (t.parentElement.closest('table')) continue;
    const w = doc.createElement('div'); w.className = 'wv-eq'; t.replaceWith(w); w.append(t);
  }
  const bib = root.querySelector('.ltx_bibliography');
  const out = doc.createElement('div');
  out.append(...root.childNodes);
  if (notes.length) out.append(noteList(doc, 'Notes', notes, 'wv-fn-'));
  if (bib) out.append(bib);
  return out;
}

/** BibTeX, just enough for a reference list. */
function parseBib(src) {
  const out = new Map(); let i = 0;
  while ((i = src.indexOf('@', i)) >= 0) {
    const open = src.indexOf('{', i); if (open < 0) break;
    let depth = 0, k = open;
    for (; k < src.length; k++) { if (src[k] === '{') depth++; else if (src[k] === '}' && --depth === 0) break; }
    const body = src.slice(open + 1, k); i = k + 1;
    const comma = body.indexOf(','); if (comma < 0) continue;
    const f = {};
    for (const x of body.slice(comma + 1).matchAll(/(\w+)\s*=\s*(?:\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}|"([^"]*)"|(\w+))/g)) {
      f[x[1].toLowerCase()] = (x[2] ?? x[3] ?? x[4] ?? '').replace(/\\["'`^~]\s*\{?(\w)\}?/g, '$1').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
    }
    out.set(body.slice(0, comma).trim(), f);
  }
  return out;
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
function refHtml(key, e) {
  if (!e) return `<span class="wv-key">${esc(key)}</span>`;
  const au = (e.author || '').split(/\s+and\s+/).filter(Boolean).map((a) => (a.includes(',') ? a.split(',')[0] : a.split(' ').at(-1)).trim());
  const who = au.length > 2 ? `${au[0]} et al.` : au.join(' and ');
  const where = e.journal || e.booktitle || e.publisher || '';
  const t = e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title || key)}</a>` : esc(e.title || key);
  return [who, e.year].filter(Boolean).map(esc).join(', ') + (who || e.year ? '. ' : '') + t + (where ? `. <i>${esc(where)}</i>` : '');
}

/** Distill-template articles (distill.pub, transformer-circuits.pub). Their
 *  custom elements need the template's JavaScript; without it, d-cite and
 *  d-footnote become numbered notes, and interactive figures get a pointer
 *  to the live view. */
async function distill(doc, base) {
  const art = doc.querySelector('d-article, dt-article');
  const out = doc.createElement('div');
  const dek = doc.querySelector('d-title p, dt-article > h2:first-of-type');
  if (dek && !art.contains(dek)) { const p = doc.createElement('p'); p.className = 'wv-dek'; p.innerHTML = dek.innerHTML; out.append(p); }
  art.querySelectorAll('d-title, dt-byline, d-byline, d-contents, d-toc, nav, d-front-matter, dt-header, d-header').forEach((x) => x.remove());
  if (dek && art.contains(dek)) dek.classList.add('wv-dek');
  out.append(...art.childNodes);
  const appx = doc.querySelector('d-appendix, dt-appendix');
  if (appx) { const hh = doc.createElement('h2'); hh.textContent = 'Appendix'; out.append(hh, ...appx.childNodes); }
  out.querySelectorAll('d-footnote-list, d-citation-list, d-bibliography, dt-fn-list, dt-bibliography').forEach((x) => x.remove());
  // Footnotes, then citations (footnotes can cite).
  const fns = [];
  for (const fn of [...out.querySelectorAll('d-footnote, dt-fn')]) {
    const k = fns.push(fn.innerHTML.trim());
    fn.replaceWith(refMark(doc, 'wv-fn-' + k, String(k), 'wv-ref'));
  }
  if (fns.length) out.append(noteList(doc, 'Footnotes', fns, 'wv-fn-'));
  let bib = new Map();
  const bibEl = doc.querySelector('d-bibliography, dt-bibliography');
  const inline = bibEl?.querySelector('script')?.textContent;
  try {
    if (inline) bib = parseBib(inline);
    else if (bibEl?.getAttribute('src')) bib = parseBib(await (await fetch(P(new URL(bibEl.getAttribute('src'), base).href))).text());
  } catch { /* keys only */ }
  const order = [];
  for (const c of [...out.querySelectorAll('d-cite, dt-cite')]) {
    const keys = (c.getAttribute('key') || c.getAttribute('bibtex-key') || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (!keys.length) { c.replaceWith(...c.childNodes); continue; }
    const sup = doc.createElement('sup'); sup.className = 'wv-ref';
    keys.forEach((key, x) => {
      let k = order.indexOf(key); if (k < 0) k = order.push(key) - 1;
      const a = doc.createElement('a'); a.href = '#wv-ref-' + (k + 1); a.textContent = String(k + 1);
      if (x) sup.append(',');
      sup.append(a);
    });
    c.replaceWith(sup);
  }
  if (order.length) out.append(noteList(doc, 'References', order.map((k) => refHtml(k, bib.get(k))), 'wv-ref-'));
  return out;
}

/** Figures drawn by scripts are empty without them (or are a heap of
 *  absolutely placed labels): say so, keep the caption, and point to N. */
const MEDIA = 'img, picture, video, table, pre, .wv-tex, .wv-math, math, iframe';
// An empty container a script would have drawn into.
const blank = (el) => /^(DIV|SPAN|SVG|CANVAS|SECTION)$|-/.test(el.tagName.toUpperCase()) && !el.firstElementChild && !el.textContent.trim();
function scriptDrawn(el) {
  if (el.querySelector(MEDIA) || [...el.querySelectorAll('svg')].some((s) => s.querySelector('path, rect, circle, text, image, line, polyline, polygon'))) return false;
  const body = [...el.children].filter((c) => c.tagName !== 'FIGCAPTION');
  const text = body.map((c) => c.textContent).join(' ').trim();
  return body.some((c) => blank(c) || c.querySelector('canvas, svg') || [...c.querySelectorAll('*')].some(blank)) || (text.length < 300 && !!el.querySelector('[style*="absolute"]'));
}
function markInteractive(doc, root) {
  const hint = () => { const p = doc.createElement('p'); p.className = 'wv-live-hint'; p.textContent = 'Interactive figure · N shows the live page'; return p; };
  for (const el of [...root.querySelectorAll('*')]) {
    if (!root.contains(el) || el.closest('.wv-live-hint, .wv-math, svg *')) continue;
    if (el.tagName === 'FIGURE') {
      if (!scriptDrawn(el)) continue;
      const cap = el.querySelector('figcaption');
      el.replaceChildren(hint(), ...(cap ? [cap] : []));
      continue;
    }
    const custom = el.tagName.includes('-') && !/^(D|DT)-(MATH|CITE|FOOTNOTE|FN|ARTICLE|APPENDIX)$/.test(el.tagName);
    if ((custom && el.textContent.trim().length < 40 && !el.querySelector(MEDIA)) || el.tagName === 'CANVAS' || (el.tagName === 'svg' && !el.firstElementChild)) el.replaceWith(hint());
  }
  // Collapse runs of hints.
  for (const p of [...root.querySelectorAll('.wv-live-hint')]) { const nx = p.nextElementSibling; if (nx?.classList.contains('wv-live-hint')) p.remove(); }
}

/** Inline styles from the page lay it out for its own design (absolute
 *  positions, fixed heights, Google-Docs indents and font sizes). Keep only
 *  what carries meaning: emphasis, colour, alignment, reserved image boxes. */
const STYLE_KEEP = /^(font-weight|font-style|font-variant.*|text-decoration.*|color|background-color|text-align|vertical-align|aspect-ratio|white-space|text-transform|display|border.*|--.*)$/;
function cleanStyles(root) {
  for (const el of root.querySelectorAll('[style]')) {
    if (el.closest('.wv-math, svg, math')) continue;
    const st = el.style;
    for (const p of [...st]) if (!STYLE_KEEP.test(p)) st.removeProperty(p);
    if (st.display && st.display !== 'none') st.removeProperty('display');
    if (!st.length) el.removeAttribute('style');
  }
}

/** Spacing hacks (runs of <br> between blocks, empty paragraphs) waste
 *  column space; the flow spaces blocks itself. */
const BLOCK = /^(P|H[1-6]|HR|UL|OL|DIV|FIGURE|TABLE|SECTION|BLOCKQUOTE|PRE|DL|BR)$/;
function tidy(root) {
  const side = (n, dir) => { while (n && n.nodeType === 3 && !n.data.trim()) n = n[dir]; return n; };
  for (const br of [...root.querySelectorAll('br')]) {
    const a = side(br.previousSibling, 'previousSibling'), b = side(br.nextSibling, 'nextSibling');
    if ((!a || (a.nodeType === 1 && BLOCK.test(a.tagName))) && (!b || (b.nodeType === 1 && BLOCK.test(b.tagName)))) br.remove();
  }
  for (const p of [...root.querySelectorAll('p')]) if (!p.textContent.replace(/\u00a0/g, ' ').trim() && !p.querySelector('img, picture, video, iframe, svg, canvas, math, .wv-math, .wv-live-hint')) p.remove();
}

/** Readability drops images whose wrappers look like widgets ("media",
 *  "share"); put each image directly in its figure, or make one. */
function protectMedia(doc) {
  for (const img of [...doc.querySelectorAll('img')]) {
    const pic = img.parentElement?.tagName === 'PICTURE' ? img.parentElement : img;
    const fig = pic.closest('figure');
    if (fig) {
      if (pic.parentElement !== fig) { const cap = [...fig.children].find((c) => c.tagName === 'FIGCAPTION'); fig.insertBefore(pic, cap || null); }
      continue;
    }
    let w = pic;
    while (w.parentElement && w.parentElement !== doc.body && w.parentElement.tagName === 'DIV' && w.parentElement.children.length === 1 && !w.parentElement.textContent.trim()) w = w.parentElement;
    if (w !== pic) { const f = doc.createElement('figure'); w.replaceWith(f); f.append(pic); }
  }
}

/** The old heuristic: the main content element minus page chrome. */
function heuristic(doc) {
  doc.querySelectorAll('nav, header, footer, aside, form, [role=navigation], [role=banner], [class*=sidebar], [class*=comments], [id*=comments]').forEach((x) => x.remove());
  return doc.querySelector('article, main, [role=main], .post-content, .entry-content, #content') || doc.body;
}

// ---------------------------------------------------------------- extractors

const finalUrl = (u) => fetch('/web/final?u=' + encodeURIComponent(u)).then((r) => r.json()).then((j) => j.url || u).catch(() => u);
const extracted = new Map(); // url -> Promise<html>, filled ahead by the arXiv prefetch
const remember = (url, p) => { extracted.set(url, p); p.catch(() => extracted.delete(url)); while (extracted.size > 8) extracted.delete(extracted.keys().next().value); return p; };

/** Web page source -> article HTML for prepareFlow. */
export async function extractWeb(it, src) {
  const t0 = performance.now();
  const fin = finalUrl(it.url); // memoized on the server; a HEAD request the first time
  let doc = new DOMParser().parseFromString(src, 'text/html');
  const base = setBase(doc, await fin);
  fixLazy(doc);
  absolutize(doc, base);
  markWidgets(doc, it.page || base); // before extraction flattens them
  const rawDelims = !!doc.querySelector('script[src*="mathjax" i], script[src*="katex" i], script[src*="auto-render" i]') || /MathJax\.Hub|renderMathInElement/.test(src.slice(0, 300000));
  let out, how;
  if (doc.querySelector('.ltx_document, .ltx_page_main')) { collectMath(doc); out = latexml(doc); how = 'latexml'; }
  else if (doc.querySelector('d-article, dt-article')) { collectMath(doc, { rawDelims }); out = await distill(doc, base); how = 'distill'; }
  else {
    collectMath(doc, { rawDelims });
    protectMedia(doc);
    try {
      const R = await readability();
      const art = new R(doc, { charThreshold: 400, keepClasses: true, allowedVideoRegex: EMBEDS, serializer: (el) => el }).parse();
      if (art && (art.textContent || '').trim().length > 600) { out = art.content; how = 'readability'; }
    } catch (e) { console.warn('readability failed', e); }
    if (!out) {
      doc = new DOMParser().parseFromString(src, 'text/html');
      setBase(doc, base); fixLazy(doc); absolutize(doc, base); markWidgets(doc, it.page || base); collectMath(doc, { rawDelims });
      out = heuristic(doc); how = 'heuristic';
    }
  }
  dropTitle(out, it.t);
  await renderMath(out);
  if (how !== 'latexml') markInteractive(out.ownerDocument, out);
  cleanStyles(out);
  tidy(out);
  sizeEmbeds(out);
  keepAspect(out);
  out.querySelectorAll('button, input, select, textarea').forEach((x) => x.remove());
  console.debug(`webview: ${it.id} via ${how} in ${Math.round(performance.now() - t0)} ms`);
  return out.innerHTML;
}

const coreHtml = extractors.html;
extractors.web = async (it, r) => {
  if (extracted.has(it.url)) { r.body?.cancel().catch(() => {}); return extracted.get(it.url); }
  return remember(it.url, extractWeb(it, await r.text()));
};
// LessWrong / Alignment Forum posts: real math and column-sized embeds.
extractors.html = async (it, r) => {
  let html = await coreHtml(it, r);
  // Every MathJax formula carries a copy of a 17 KB stylesheet; drop them first.
  html = html.replace(/<style>[\s\S]*?<\/style>/g, '');
  if (!/mjx-math|math-tex|<iframe|katex|width="\d/.test(html)) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  collectMath(doc.body);
  await renderMath(doc.body);
  sizeEmbeds(doc.body);
  keepAspect(doc.body);
  return doc.body.innerHTML;
};

// ---------------------------------------------------------------- arXiv: H

const isArxiv = (it) => /^arxiv:/.test(it?.id || '');
const asHtml = store.get('webview:arxiv', {}); // id -> HTML url, for items read as HTML
const arxivRes = new Map(); // id -> Promise<{url, via}>
const resolveArxiv = (id) => {
  if (!arxivRes.has(id)) {
    const p = fetch('/web/arxiv?id=' + encodeURIComponent(id)).then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error); return j; });
    p.catch(() => setTimeout(() => arxivRes.delete(id), 60e3));
    arxivRes.set(id, p);
  }
  return arxivRes.get(id);
};
function toHtml(it, url) {
  if (!it._pdf) it._pdf = { kind: it.kind, url: it.url, n: it.n };
  Object.assign(it, { kind: 'web', url, n: it._htmlN });
}
function toPdf(it) {
  if (!it._pdf) return;
  it._htmlN = it.n;
  Object.assign(it, it._pdf);
  delete it._pdf;
}
for (const [id, url] of Object.entries(asHtml)) { const i = byId.get(id); if (i != null) toHtml(items[i], url); }

// Keeping your place across the switch: match a few word sequences from the
// top of the PDF page against the HTML's stable pages (and back), falling
// back to the same fraction of the way through.
const words = (s) => String(s || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((w) => w.length > 1);
const grams = (ws, n = 4) => { const g = new Set(); for (let i = 0; i + n <= ws.length; i++) g.add(ws.slice(i, i + n).join(' ')); return g; };
const hits = (probe, text) => { let c = 0; const g = grams(words(text)); for (const x of probe) if (g.has(x)) c++; return c; };
const pdfText = async (pdf, k) => (await (await pdf.getPage(k + 1)).getTextContent()).items.map((x) => x.str).join(' ');

async function pdfPageToVp(pdf, k, texts) {
  const probe = grams(words(await pdfText(pdf, k)).slice(0, 120));
  let best = -1, at = null;
  texts.forEach((t, vp) => { const c = hits(probe, t); if (c > best) { best = c; at = vp; } });
  return best >= 2 ? at : null;
}
async function vpToPdfPage(pdf, vp, texts) {
  const probe = grams(words(texts[vp]).slice(0, 120));
  const guess = Math.round((vp / Math.max(1, texts.length)) * pdf.numPages);
  const order = [...Array(pdf.numPages).keys()].sort((a, b) => Math.abs(a - guess) - Math.abs(b - guess)).slice(0, 14);
  let best = -1, at = null;
  for (const k of order) { const c = hits(probe, await pdfText(pdf, k)); if (c > best) { best = c; at = k; } if (c > 12) break; }
  return best >= 2 ? at : null;
}

async function toggleArxiv() {
  const i = current(); const it = items[i];
  if (!isArxiv(it)) { toast('Only for arXiv papers', { icon: 'info', sub: 'H switches an arXiv paper to its HTML version' }); return; }
  store.set('webview:usedH', true);
  const t0 = performance.now();
  try {
    if (!it._pdf) {
      // PDF -> HTML, at the same place.
      toast('Opening the HTML version…', 4000, { icon: 'loader-circle', kind: 'busy' });
      const k = state.start.get(i) ?? 0;
      const pdfDoc = peekDoc(it);
      const { url, via } = await resolveArxiv(it.id);
      toHtml(it, url);
      const d = await openDoc(it);
      let vp = null;
      if (k > 0) {
        const pd = pdfDoc && await pdfDoc.catch(() => null);
        if (pd?.pdf) vp = await pdfPageToVp(pd.pdf, k, d.texts).catch(() => null);
        if (vp == null) vp = Math.round((k / Math.max(1, it._pdf.n || 1)) * d.n);
      }
      asHtml[it.id] = url; store.set('webview:arxiv', asHtml);
      state.hist.set(i, []); state.start.set(i, 0); state.pendingVp = vp || null;
      if (current() === i) showFeed();
      toast('HTML version', 2200, { icon: 'file-code', sub: `from ${via} · H for the PDF` });
    } else {
      // HTML -> PDF.
      const s = state.start.get(i) ?? 0;
      const vp = flowLive?.id === it.id ? (flowLive.first[s] ?? flowLive.running[s] ?? 0) : 0;
      const d = await peekDoc(it)?.catch(() => null);
      toPdf(it);
      delete asHtml[it.id]; store.set('webview:arxiv', asHtml);
      let k = 0;
      if (vp > 0) {
        const pd = await openDoc(it);
        k = (d?.texts && await vpToPdfPage(pd.pdf, vp, d.texts).catch(() => null)) ?? Math.round((vp / Math.max(1, d?.n || 1)) * pd.n);
      }
      state.hist.set(i, []); state.start.set(i, k);
      if (current() === i) showFeed();
      toast('PDF version', { icon: 'file-text', sub: 'H for the HTML version' });
    }
  } catch (e) {
    toPdf(it);
    toast('No HTML version', { icon: 'circle-alert', kind: 'bad', sub: e.message && e.message !== 'No HTML version' ? e.message : 'Staying with the PDF' });
  }
  console.debug(`webview: H took ${Math.round(performance.now() - t0)} ms`);
}
registerKey('H', toggleArxiv, { help: ['H', 'arXiv paper: read its HTML version in columns / back to the PDF'], order: 24 });

// Once you read arXiv papers as HTML, get this and the next ones' HTML ready: resolved
// and cached on the server, extracted here in idle time.
function prefetchArxiv() {
  if (!store.get('webview:usedH', false)) return;
  const next = state.order.slice(state.pos, state.pos + 10).map((j) => items[j]).filter((x) => isArxiv(x) && !x._pdf).slice(0, 4);
  next.forEach((x, d) => setTimeout(async () => {
    try {
      const { url } = await resolveArxiv(x.id);
      if (extracted.has(url)) return;
      const src = await (await fetch(P(url))).text();
      await idle();
      remember(url, extractWeb({ ...x, kind: 'web', url }, src));
    } catch { /* no HTML version */ }
  }, d ? 400 + d * 600 : 150));
}
on('item:shown', prefetchArxiv);

// ---------------------------------------------------------------- live N-up
//
// N shows the ORIGINAL page with its scripts running, as N iframes side by
// side, each scrolled one screen further than the one before: a single-column
// page read as N columns, with interactive figures still interactive.
//
// The frames are served by /web/live from the other loopback name
// (localhost <-> 127.0.0.1), so they are a different origin from the app:
// the page's scripts cannot reach the app's DOM or storage, yet the frames
// share one HTTP cache (unlike sandboxed srcdoc frames, which would each
// download everything again). The app moves them with postMessage; a small
// controller in each frame reports its height and forwards wheel, keys and
// link clicks, so all the views move together.
//
// Limits, by construction:
// - Each view is its own copy of the page: state is not shared. A slider
//   moved in view 2 does not move in view 3, a video plays in one view only,
//   and a widget that straddles a view boundary appears twice.
// - N copies cost N times the CPU and memory of one page.
// - Scroll-driven pages (scrollytelling, sticky graphics, parallax) do what
//   they would do at each view's position; sticky headers repeat per view.
// - Requests to the page's own host go through the caching proxy; other
//   cross-origin requests, web fonts without CORS headers and module scripts
//   may fail where the real site would have served them same-origin.
// - Pages that need cookies or a login, and sites that block non-browser
//   fetches, do not render.
const ALT = { localhost: '127.0.0.1', '127.0.0.1': 'localhost' }[location.hostname];
const LIVE_ORIGIN = ALT ? `${location.protocol}//${ALT}${location.port ? ':' + location.port : ''}` : location.origin;
const OVERLAP = 34; // px each view repeats from the previous one's bottom, so no line is cut in two
const liveIds = new Set(store.get('webview:live', []));
const views = new Map(); // id -> view (the current one and the one before, so k/j back is instant)
let cur = null;

const GAP = 10;
const autoN = (w) => Math.max(1, Math.min(4, Math.round(w / 520)));
const stride = (v) => Math.max(120, (v.vh || 600) - OVERLAP);
const send = (f, m) => f.contentWindow?.postMessage({ wv: 1, ...m }, '*');
const userN = store.get('webview:liveN', {}); // id -> views, when the reader chose with + and -
const needs = store.get('webview:need', {}); // url -> text width the page needs (px), learned on first view

function makeView(it) {
  const need = needs[it.url] || 0;
  const v = { it, n: userN[it.id] || 0, z: 1, need, fitted: !!need, base: 0, hs: [], H: 0, vh: 0, frames: [], frac: null };
  v.row = h('div', { className: 'wv-frames' });
  v.el = h('div', { className: 'wv-live' }, v.row);
  v.el.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); liveWheel(v, e.deltaX, e.deltaY, e.deltaMode, e.shiftKey); }, { passive: false });
  return v;
}
function fillFrames(v) {
  while (v.frames.length < v.n) {
    const j = v.frames.length;
    const f = h('iframe', { name: 'wv' + j, title: `${v.it.t} · view ${j + 1}`, src: `${LIVE_ORIGIN}/web/live?u=${encodeURIComponent(v.it.url)}` });
    f.setAttribute('allow', 'fullscreen; clipboard-write; autoplay');
    const cell = h('div', { className: 'wv-cell loading' }, f, j ? h('div', { className: 'wv-seam' }) : null);
    f._cell = cell;
    setTimeout(() => cell.classList.remove('loading'), 9000); // show whatever there is
    v.frames.push(f); v.row.append(cell);
  }
  while (v.frames.length > v.n) v.frames.pop()._cell.remove();
  // A page whose text needs more width than a view gets it, scaled down
  // (every view the same, so they stay in step).
  for (const f of v.frames) Object.assign(f.style, v.z < 1 ? { width: 100 / v.z + '%', height: 100 / v.z + '%', transform: `scale(${v.z})` } : { width: '', height: '', transform: '' });
  v.row.style.setProperty('--seam', OVERLAP * v.z + 'px');
}
/** Views and scale for a page that needs `need` CSS px of width: fewer,
 *  wider views (unless the reader chose how many), then at most a 0.6 scale. */
function fit(v) {
  const W = v.row.clientWidth || $('#spread').offsetWidth - 24;
  if (v.need && !userN[v.it.id]) v.n = Math.max(1, Math.min(v.n, Math.floor((W + GAP) / (v.need * 0.8 + GAP))));
  const fw = (W - GAP * (v.n - 1)) / v.n;
  const z = v.need ? Math.max(0.6, Math.min(1, fw / v.need)) : 1;
  v.z = z > 0.97 ? 1 : z;
}
/** Cover #spread exactly (the flow underneath keeps its layout for the other features). */
function placeView(v) {
  const sp = $('#spread');
  Object.assign(v.el.style, { top: sp.offsetTop + 'px', left: sp.offsetLeft + 'px', width: sp.offsetWidth + 'px', height: sp.offsetHeight + 'px' });
  if (!v.n) { v.n = autoN(sp.offsetWidth); if (v.need) fit(v); }
  fillFrames(v);
}
function sync(v, except = -1) {
  const s = stride(v);
  v.frames.forEach((f, j) => { if (j !== except) send(f, { type: 'scroll', y: Math.round(v.base + j * s) }); });
  paintLivePos(v);
}
function moveTo(v, y, except) {
  v.base = Math.max(0, Math.min(y, Math.max(0, v.H - stride(v) * 0.5)));
  sync(v, except);
}
function liveTurn(v, dir) {
  const step = v.n * stride(v);
  if (dir > 0 && v.base + step >= v.H - 8) { toast('End of document', { icon: 'arrow-down-to-line', kind: 'edge', sub: 'j for the next item' }); return; }
  if (dir < 0 && v.base <= 0) { toast('Start of document', { icon: 'arrow-up-to-line', kind: 'edge' }); return; }
  moveTo(v, dir > 0 ? v.base + step : Math.max(0, v.base - step));
}
function relayout(v) {
  fillFrames(v);
  v.frames.forEach((f) => send(f, { type: 'pad', px: (v.n + 1) * (v.vh || innerHeight) }));
  sync(v);
}
function setN(v, n) {
  v.n = Math.max(1, Math.min(6, n));
  userN[v.it.id] = v.n; store.set('webview:liveN', userN);
  fit(v); relayout(v);
  toast(`${v.n} live view${v.n > 1 ? 's' : ''}${v.z < 1 ? ` at ${Math.round(v.z * 100)}%` : ''}`, { icon: 'app-window', sub: '+ − to change' });
}
// One wheel gesture turns N screens, like a page turn; Shift+wheel scrolls finely.
let wAcc = 0, wLast = 0, wSteps = 0;
function liveWheel(v, dx, dy, mode, shift) {
  let d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
  if (mode === 1) d *= 40; else if (mode === 2) d *= 800;
  if (shift) { moveTo(v, v.base + d / v.z); return; }
  const now = performance.now();
  if (now - wLast > 140) { wAcc = 0; wSteps = 0; }
  wLast = now;
  if (wAcc && Math.sign(d) !== Math.sign(wAcc)) { wAcc = 0; wSteps = 0; }
  wAcc += d;
  if (Math.abs(wAcc) < (wSteps ? 320 : 30)) return;
  const dir = Math.sign(wAcc); wAcc = 0; wSteps++;
  liveTurn(v, dir);
}
function paintLivePos(v) {
  const el = $('#pos'); if (!el || cur !== v) return;
  const s = stride(v), a = Math.floor(v.base / s) + 1;
  const T = v.H ? Math.max(1, Math.ceil(v.H / s)) : null;
  el.textContent = `${state.pos + 1}/${state.order.length} · screens ${T ? Math.min(a, T) : a}–${T ? Math.min(T, a + v.n - 1) : a + v.n - 1} of ${T ?? '…'} · live${v.z < 1 ? ` ${Math.round(v.z * 100)}%` : ''}`;
}

addEventListener('message', (e) => {
  const m = e.data;
  if (!m || m.wv !== 1 || typeof m.type !== 'string') return;
  for (const v of views.values()) {
    const j = v.frames.findIndex((f) => f.contentWindow === e.source);
    if (j < 0) continue;
    const f = v.frames[j];
    if (m.type === 'ready' || m.type === 'metrics') {
      if (m.vh) v.vh = m.vh;
      if (m.h != null) { v.hs[j] = m.h; v.H = Math.max(...v.hs.filter((x) => x != null)); }
      if (v.frac != null && v.H > v.vh * 2) { v.base = Math.floor((v.frac * v.H) / stride(v)) * stride(v); v.frac = null; sync(v); }
      if (m.type === 'ready') send(f, { type: 'pad', px: (v.n + 1) * (v.vh || innerHeight) });
      send(f, { type: 'scroll', y: Math.round(v.base + j * stride(v)) });
      if (m.type === 'ready') requestAnimationFrame(() => f._cell.classList.remove('loading'));
      paintLivePos(v);
    } else if (m.type === 'fit') {
      // Only the first view's verdict counts, once: the page's text needs this width.
      if (j || v.fitted || !(m.need > 0)) return;
      v.fitted = true; v.need = Math.min(+m.need, 2400);
      needs[v.it.url] = v.need; store.set('webview:need', needs);
      const n0 = v.n; fit(v); relayout(v);
      if (v.n !== n0 || v.z < 1) toast(`${v.n} live view${v.n > 1 ? 's' : ''}${v.z < 1 ? ` at ${Math.round(v.z * 100)}%` : ''}`, 2600, { icon: 'app-window', sub: `This page needs ${v.need} px · + − to change` });
    } else if (m.type === 'wheel') liveWheel(v, +m.dx || 0, +m.dy || 0, m.mode, !!m.shift);
    else if (m.type === 'key' && typeof m.key === 'string') document.dispatchEvent(new KeyboardEvent('keydown', { key: m.key, shiftKey: !!m.shift, bubbles: true, cancelable: true }));
    else if (m.type === 'goto') moveTo(v, +m.y || 0);
    else if (m.type === 'scrolled') moveTo(v, (+m.y || 0) - j * stride(v), j);
    else if (m.type === 'open' && /^https?:/.test(m.href)) window.open(m.href, '_blank', 'noopener');
    return;
  }
});

// Turning, views and jumps while a live page is up; everything else (j/k,
// panel, search, N) goes to the app as usual.
addEventListener('keydown', (e) => {
  const v = cur;
  if (!v || state.view !== 'feed' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
  if ($('#keys') && !$('#keys').hidden) return;
  const k = e.key;
  if (['l', 'ArrowRight', ' ', 'PageDown'].includes(k)) liveTurn(v, 1);
  else if (['h', 'ArrowLeft', 'PageUp'].includes(k)) liveTurn(v, -1);
  else if (k === '+' || k === '=') setN(v, v.n + 1);
  else if (k === '-') setN(v, v.n - 1);
  else if (k === 't') moveTo(v, 0);
  else if (k === 'r') moveTo(v, Math.floor(Math.random() * Math.max(1, v.H / stride(v) - v.n)) * stride(v));
  else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);

/** Show or hide the live view for the item on screen. */
function applyLive() {
  const i = current(); const it = i != null ? items[i] : null;
  const on = state.view === 'feed' && it?.kind === 'web' && liveIds.has(it.id);
  $('#stage').classList.toggle('wv-on', !!on);
  for (const [id, v] of views) v.el.hidden = !(on && id === it.id);
  if (!on) { cur = null; return; }
  let v = views.get(it.id);
  if (!v) {
    v = makeView(it);
    // Open at the flow's place.
    if (flowLive?.id === it.id && it.n) v.frac = (flowLive.first[state.start.get(i) ?? 0] ?? 0) / it.n;
    views.set(it.id, v);
    $('#stage').append(v.el);
    for (const [id, old] of views) if (views.size > 2 && id !== it.id) { old.el.remove(); views.delete(id); }
  }
  cur = v;
  placeView(v);
  paintLivePos(v);
}
function toggleLive() {
  const i = current(); const it = items[i];
  if (it?.kind !== 'web') { toast('Only for web pages', { icon: 'info', sub: 'N shows the live original of a web page' }); return; }
  if (liveIds.has(it.id)) {
    liveIds.delete(it.id);
    const v = views.get(it.id);
    // Back to the columns at about the same place.
    if (v?.H) { state.hist.set(i, []); state.start.set(i, 0); state.pendingVp = Math.round((v.base / v.H) * (it.n || 1)); }
    if (v) { v.el.remove(); views.delete(it.id); }
    toast('Reader columns', { icon: 'book-open', sub: 'N for the live page' });
  } else {
    liveIds.add(it.id);
    toast('Live page', 2600, { icon: 'globe', kind: 'mode', sub: 'Scripts run in each view · + − views · N for the reader' });
  }
  store.set('webview:live', [...liveIds]);
  showFeed();
  applyLive();
}
registerKey('N', toggleLive, { help: ['N', 'web page: the live original in side-by-side views / back to the reader'], order: 25 });
on('spread:rendered', applyLive);
on('item:shown', applyLive);
on('view:changed', applyLive);
on('nav', ({ type, k }) => { if (cur && type === 'page' && cur.H) moveTo(cur, (k / Math.max(1, cur.it.n || 1)) * cur.H); });
let rz = null;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (cur) { placeView(cur); fit(cur); relayout(cur); } }, 200); });

// A small marker in the item head for the HTML version and live views.
on('spread:rendered', ({ it }) => {
  const meta = $('#item-head .meta'); if (!meta || meta.querySelector('.wv-chip')) return;
  const label = liveIds.has(it.id) && it.kind === 'web' ? 'live' : it._pdf ? 'HTML' : null;
  if (label) meta.append(h('span', { className: 'wv-chip', textContent: label, title: label === 'live' ? 'The original page, scripts running (N for the reader)' : 'arXiv HTML version (H for the PDF)' }));
});

// ---------------------------------------------------------------- dev test items

if (/[?&]webtest\b/.test(location.search)) {
  try {
    const extra = await (await fetch('/web/test-items.json')).json();
    for (const x of extra) {
      if (byId.has(x.id)) continue;
      byId.set(x.id, items.length); items.push(x);
      COUNTS[x.lane] = (COUNTS[x.lane] || 0) + 1;
      laneMax[x.lane] = Math.max(laneMax[x.lane] || 1, x.score || 0);
    }
    LANES['web-test'] = 'Web (test)';
  } catch (e) { console.warn('webtest items', e); }
}
