// Code, diagrams and wide tables in flow documents (posts, web pages, your own files).
//
// 1. Code. Sites ship code as markup that their own stylesheet finishes: Expressive Code
//    (Starlight) puts each line in a div and the token colours in CSS variables (--0, --1: one
//    per theme), Shiki in inline colours or --shiki-light / --shiki-dark, highlight.js, Prism,
//    Pygments, Rouge, pandoc and GitHub in classes. Extraction flattens that (Readability turns
//    each line's div into a paragraph and drops every style attribute). prepCode(doc) runs on
//    the page as served (webview.js extractWeb, before Readability) and again inside prepareFlow
//    on every flow document, and rewrites each block as one <pre class="wv-code">: a span per
//    line (wrapped lines hang under their own indentation), the site's token colours kept for a
//    light page and a dark one, chosen by the paper in CSS, nothing else (copy buttons, line
//    numbers, title bars become a data-title).
// 2. Mermaid. A diagram's source (<pre class="mermaid">, <div class="mermaid">, ```mermaid,
//    <code class="language-mermaid">) is drawn when the document opens (docs.js flowAfter, after
//    prepareFlow, before layout), by mermaid loaded only then, into an SVG image in the page's
//    colours with its size reserved; a source that does not parse stays as code with a note.
// 3. Wide tables. A table whose natural width is well over a column's is marked and given a
//    control that shows it across the whole spread, over the pages (built on click). In place it
//    is set compact, without hyphenation. See ARCHITECTURE.md (Flow blocks) for why it does not
//    span columns in the layout itself.
//
// All of it runs once per document, when it is prepared; nothing runs on page turns.
import { $, h, P, on } from '../util.js';
import { flowFilters, flowAfter } from '../docs.js';
import { state, current } from '../state.js';
import { items } from '../corpus.js';
import { live, flowGeom } from '../flow.js';

/** Per document: what was found and what it cost (ms), newest last; for tests and benchmarks. */
export const blockTimes = [];
const note = (r) => { blockTimes.push(r); if (blockTimes.length > 40) blockTimes.shift(); };
window.__flowblocks = { blockTimes };

// ---------------------------------------------------------------- colour
const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
function parseColor(s) {
  s = String(s || '').trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let x = m[1];
    if (x.length === 3 || x.length === 4) x = [...x.slice(0, 3)].map((c) => c + c).join('');
    if (x.length !== 6 && x.length !== 8) return null;
    return [0, 2, 4].map((k) => parseInt(x.slice(k, k + 2), 16));
  }
  m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(s);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
const toHex = (c) => '#' + c.map(hex2).join('');
const lumOf = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// The hardest backgrounds a token colour has to read on: the code background of the grey paper
// (the darkest light paper) and of the dark paper (settings.js PAPERS, --paper-code).
const ON_LIGHT = [200, 200, 195], ON_DARK = [44, 41, 36];
const fixed = new Map();
/** A site's token colour moved toward black (light papers) or white (dark paper) until it reads. */
function readable(col, dark) {
  const k = col + (dark ? 'd' : 'l');
  if (fixed.has(k)) return fixed.get(k);
  let c = parseColor(col), out = null;
  if (c) {
    const on = dark ? ON_DARK : ON_LIGHT, to = dark ? 255 : 0, want = dark ? 4 : 3;
    for (let t = 0; t <= 1.001 && contrast(c, on) < want; t += 0.1) c = c.map((v) => v + (to - v) * 0.1);
    out = toHex(c);
  }
  fixed.set(k, out);
  return out;
}

// ---------------------------------------------------------------- code
const SKIP = '.gutter, .ln, .line-numbers-rows, .hljs-ln-numbers, .linenos, .lineno, .line-number, .copy, button, script, style, .sr-only, .ec-section > summary';
const LINE_TAGS = /^(DIV|P|LI)$/;
const isLineEl = (el) => el.classList.contains('ec-line') || LINE_TAGS.test(el.tagName);

/** The colours, font style and highlighter classes of one token element, or null. */
function tokenOf(el, fam) {
  const st = el.getAttribute('style') || '';
  let t = null;
  if (st) {
    for (const m of st.matchAll(/(?:^|;)\s*(--[\w-]+|color|font-style|font-weight)\s*:\s*([^;]+)/gi)) {
      const p = m[1].toLowerCase(), v = m[2].trim();
      t ||= { slots: {}, f: '' };
      if (/^--\d+$/.test(p) || p === 'color' || /^--shiki-[\w-]+$/.test(p)) { if (parseColor(v)) t.slots[p] = v; }
      else if (/^--\d+fs$/.test(p) || p === 'font-style') { if (/italic|oblique/.test(v)) t.f += 'i'; }
      else if (/^--\d+fw$/.test(p) || p === 'font-weight') { if (/bold|[6-9]00/.test(v)) t.f += 'b'; }
    }
  }
  if (fam && el.classList.length) {
    const cls = [...el.classList].filter((c) => (fam === 'hljs' ? /^hljs-/.test(c) : fam === 'prism' ? c !== 'token' || el.classList.length === 1 : fam === 'gh' ? /^pl-/.test(c) : /^[a-z][a-z0-9]{0,2}$/.test(c)));
    if (cls.length) { t ||= { slots: {}, f: '' }; t.cls = cls.map((c) => 'tk-' + c.replace(/^(hljs-|pl-)/, '')).join(' '); }
  }
  return t && (Object.keys(t.slots).length || t.f || t.cls) ? t : null;
}

/** The highlighter family whose classes name the tokens, or ''. */
function familyOf(pre, code) {
  const root = pre.closest('.highlight, .codehilite, .highlighter-rouge, div.sourceCode, .chroma');
  if (code.querySelector('[class^="hljs-"], [class*=" hljs-"]')) return 'hljs';
  if (code.querySelector('.token')) return 'prism';
  if (code.querySelector('[class^="pl-"], [class*=" pl-"]')) return 'gh';
  if (root || pre.matches('.sourceCode, .chroma') || code.matches('.sourceCode')) return pre.closest('div.sourceCode, pre.sourceCode') ? 'pandoc' : 'pyg';
  return '';
}

/** Lines of [text, token] runs, from any of the shapes above. */
function linesOf(code, fam) {
  const lines = [{ runs: [], cls: '' }];
  let brk = false;
  const cur = () => lines[lines.length - 1];
  const newline = (cls = '') => { lines.push({ runs: [], cls }); brk = false; };
  const add = (t, tok) => {
    if (!t) return;
    if (brk) newline();
    const r = cur().runs, last = r[r.length - 1];
    if (last && last[1] === tok) last[0] += t; else r.push([t, tok]);
  };
  const walk = (node, tok) => {
    for (let n = node.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3) {
        n.data.replace(/\r\n?/g, '\n').split('\n').forEach((p, k) => { if (k) newline(); add(p, tok); });
      } else if (n.nodeType === 1) {
        if (n.tagName === 'BR') { newline(); continue; }
        if (n.matches(SKIP)) continue;
        const line = isLineEl(n);
        let at = 0;
        if (line) {
          // A line element starts its own line (an empty one too) ...
          const mark = /\b(mark|ins|del|highlight|hl)\b/.exec(n.className)?.[1] || '';
          if (cur().runs.length || brk) newline(mark); else if (mark) cur().cls = mark;
          at = lines.length;
        }
        walk(n, tokenOf(n, fam) || tok);
        if (line) {
          // ... and a newline at its end is not another one.
          if (lines.length > at && !cur().runs.length) lines.pop();
          brk = true;
        }
      }
    }
  };
  walk(code, null);
  while (lines.length > 1 && !lines[lines.length - 1].runs.some(([t]) => t.trim())) lines.pop();
  while (lines.length > 1 && !lines[0].runs.some(([t]) => t.trim())) lines.shift();
  return lines;
}

/** Which colour slot reads on a light page and which on a dark one, for one block. */
function slotsFor(lines) {
  const sum = new Map();
  for (const ln of lines) for (const [, tok] of ln.runs) {
    if (!tok) continue;
    for (const [s, v] of Object.entries(tok.slots)) { const c = parseColor(v); if (!c) continue; const a = sum.get(s) || [0, 0]; a[0] += lumOf(c); a[1]++; sum.set(s, a); }
  }
  if (sum.has('--shiki-light') || sum.has('--shiki-dark')) {
    const light = sum.has('--shiki-light') ? '--shiki-light' : sum.has('color') ? 'color' : null;
    return { light, dark: sum.has('--shiki-dark') ? '--shiki-dark' : null };
  }
  const means = [...sum].map(([s, [l, n]]) => [s, l / n]).sort((a, b) => a[1] - b[1]);
  if (!means.length) return { light: null, dark: null };
  // One theme only: its colours serve both papers, moved until they read (readable()).
  if (means.length === 1) return { light: means[0][0], dark: means[0][0] };
  return { light: means[0][1] < 0.45 ? means[0][0] : null, dark: means.at(-1)[1] > 0.12 ? means.at(-1)[0] : null };
}

const langOf = (pre, code) => {
  const own = pre.getAttribute('data-language') || pre.getAttribute('data-lang') || code.getAttribute('data-lang') || pre.getAttribute('lang') || '';
  if (own) return own.toLowerCase();
  const cls = `${code.className} ${pre.className} ${pre.parentElement?.className || ''}`;
  return (/\b(?:language|lang|highlight-source)-([\w+#-]+)/.exec(cls)?.[1] || (pre.classList.contains('sourceCode') ? [...pre.classList].find((c) => c !== 'sourceCode' && c !== 'numberSource') : '') || '').toLowerCase();
};
const MERMAID_LANG = /^(mermaid|mmd)$/;

/** One canonical block: pre.wv-code > code > span.wv-ln per line (data-i: leading spaces), token
 *  spans with data-c="<light> <dark>" ('-' for none) and tk-* classes. Readability-proof (no styles). */
function codeBlock(doc, lines, { lang, title, fam }) {
  const pre = doc.createElement('pre'); pre.className = 'wv-code';
  if (lang) pre.dataset.lang = lang;
  if (title) pre.dataset.title = title;
  if (fam) pre.dataset.hl = fam;
  const code = doc.createElement('code');
  const { light, dark } = slotsFor(lines);
  for (const ln of lines) {
    const L = doc.createElement('span'); L.className = 'wv-ln' + (ln.cls ? ' wv-' + ln.cls : '');
    const lead = /^[ \t]*/.exec(ln.runs.map(([t]) => t).join(''))[0].replace(/\t/g, '    ').length;
    if (lead) L.dataset.i = Math.min(lead, 40);
    for (const [t, tok] of ln.runs) {
      const cl = tok && light && tok.slots[light] ? readable(tok.slots[light], false) : null;
      const cd = tok && dark && tok.slots[dark] ? readable(tok.slots[dark], true) : null;
      const cls = [tok?.f.includes('i') ? 'wv-fi' : '', tok?.f.includes('b') ? 'wv-fb' : '', tok?.cls || ''].filter(Boolean).join(' ');
      if (!cl && !cd && !cls) { L.append(t); continue; }
      const s = doc.createElement('span');
      if (cl || cd) s.dataset.c = `${cl || '-'} ${cd || '-'}`;
      if (cls) s.className = cls;
      s.textContent = t; L.append(s);
    }
    L.append('\n');
    code.append(L);
  }
  pre.append(code);
  return pre;
}
function mermaidBlock(doc, src) {
  const pre = doc.createElement('pre'); pre.className = 'wv-mermaid';
  pre.textContent = src.replace(/ /g, ' ').trim();
  return pre;
}

/** Rewrite every code block and mermaid source in a parsed page or document into the canonical
 *  forms (idempotent); returns the number of blocks rewritten. */
export function prepCode(doc) {
  const root = doc.body || doc;
  let n = 0;
  // Mermaid sources first (an EC or Shiki block of language mermaid is one too). Found by class and
  // tag (no selector walk over the whole page: an arXiv paper has tens of thousands of elements).
  const pres = root.getElementsByTagName('pre');
  const mm = [...root.getElementsByClassName('mermaid'), ...root.getElementsByClassName('language-mermaid')];
  for (const pre of pres) if (MERMAID_LANG.test(pre.getAttribute('data-language') || pre.getAttribute('lang') || '')) mm.push(pre);
  for (const el of mm) {
    if (!el.isConnected || !/^(PRE|DIV|CODE)$/.test(el.tagName) || el.closest('.wv-mermaid, .wv-code') || el.querySelector('svg, img')) continue;
    const pre = el.closest('pre') || el;
    const host = pre.closest('.expressive-code, div.sourceCode, .highlight, .codehilite') || pre;
    const ln = linesOf(pre.querySelector('code') || pre, '');
    host.replaceWith(mermaidBlock(doc, ln.map((l) => l.runs.map(([t]) => t).join('')).join('\n'))); n++;
  }
  for (const pre of [...pres]) {
    if (!pre.isConnected || pre.matches('.wv-code, .wv-mermaid') || pre.closest('.wv-code, .wv-mermaid, math, svg')) continue;
    const code = pre.querySelector(':scope > code') || (pre.children.length === 1 && pre.firstElementChild.tagName === 'CODE' ? pre.firstElementChild : null) || pre;
    const lang = langOf(pre, code);
    // Pygments' line-number tables and Expressive Code's frame go with the block.
    const ec = pre.closest('.expressive-code');
    const table = pre.closest('td.code')?.closest('table.highlighttable, table.hljs-ln');
    const host = ec || table?.closest('.highlight') || table || pre.closest('div.highlight, div.codehilite, div.highlighter-rouge, div.sourceCode') || pre;
    const title = ec?.querySelector('figcaption .title, figcaption')?.textContent.trim() || pre.getAttribute('data-title') || host.querySelector?.('.code-title, .filename')?.textContent.trim() || '';
    const fam = familyOf(pre, code);
    const lines = linesOf(code, fam);
    const src = lines.map((l) => l.runs.map(([t]) => t).join('')).join('\n');
    const block = MERMAID_LANG.test(lang) ? mermaidBlock(doc, src) : codeBlock(doc, lines, { lang, title: title.length < 120 ? title : '', fam });
    host.replaceWith(block); n++;
  }
  return n;
}

/** data-* from prepCode onto inline custom properties, which CSS reads (cleanStyles keeps --*). */
function finishCode(doc) {
  for (const pre of doc.getElementsByClassName('wv-code')) {
    for (const L of pre.querySelectorAll('.wv-ln[data-i]')) { L.style.setProperty('--i', L.dataset.i); delete L.dataset.i; }
    for (const s of pre.querySelectorAll('span[data-c]')) {
      const [cl, cd] = s.dataset.c.split(' ');
      if (cl && cl !== '-') s.style.setProperty('--cl', cl);
      if (cd && cd !== '-') s.style.setProperty('--cd', cd);
      s.classList.add('wv-tc'); delete s.dataset.c;
    }
  }
}

// ---------------------------------------------------------------- wide tables
const COL_CAP = 28; // characters: a column wraps comfortably at about this width
/** Estimated natural and narrowest widths of a table, in em of its own text, from its cells' text
 *  (no layout): a column wraps at about COL_CAP characters and can shrink to its longest word. */
export function tableWidthEm(t) {
  const W = [], M = [], A = [], N = [];
  let rows = 0;
  for (const tr of t.rows) {
    if (++rows > 80) break;
    let c = 0;
    for (const cell of tr.cells) {
      const span = Math.max(1, cell.colSpan || 1);
      if (span === 1) {
        const txt = cell.textContent.replace(/\s+/g, ' ').trim();
        // A line can break after a hyphen, a dash or a slash as well as at a space.
        const word = txt.split(/ |(?<=[-‐–—/])/).reduce((m, w) => Math.max(m, w.length), 0);
        W[c] = Math.max(W[c] || 0, Math.min(Math.max(txt.length, 3), COL_CAP), Math.min(word, 40));
        M[c] = Math.max(M[c] || 0, Math.min(word, 40));
        A[c] = (A[c] || 0) + txt.length; N[c] = (N[c] || 0) + 1;
      }
      c += span;
    }
    for (let k = 0; k < c; k++) { W[k] ??= 3; M[k] ??= 3; }
  }
  return { nat: W.reduce((s, w) => s + w * 0.5 + 0.9, 0), min: M.reduce((s, w) => s + w * 0.52 + 0.9, 0), floor: M.map((w) => w * 0.52 + 0.9), mean: W.map((_, k) => (A[k] || 0) / (N[k] || 1)) };
}
const TABLE_EM = 0.85, WIDE_EM = 0.78; // .flow table font-size (style.css), a wide one's (flowblocks.css)
const colEm = () => state.measure || 31;
/** A column's width now, in em of the text: the flow layout on screen (no layout read), else
 *  what flow.js would lay out in the stage now (one read), else the measure. */
function colNow() {
  if (live?.g && live.sheet?.isConnected) return live.g.colw / live.g.font;
  const sp = $('#spread');
  if (sp?.clientWidth > 200) { const g = flowGeom(sp); return g.colw / g.font; }
  return colEm();
}
const flagBtn = (doc, what) => {
  const b = doc.createElement('button');
  b.type = 'button'; b.className = 'wt-open ' + (what === 'table' ? 'wt-tbl' : 'wt-dgm');
  b.setAttribute('aria-label', `Wide ${what}: view it across the screen`);
  b.title = `Show this ${what} across the whole screen, over the pages (Esc closes)`;
  return b;
};
// A table that is a scroll container (style.css: display block, overflow-x auto) cannot break across
// columns, so one taller than a column loses its last rows under the column's foot. Every data
// table is laid out as a table instead, so its rows continue in the next column: at its own column
// widths when its longest words fit a narrow column (wt-fit), else at fixed widths in proportion
// to its text (wt-fixed: never wider than the column, long words broken).
function markTables(doc) {
  let n = 0, wide = 0, now = 0;
  for (const t of [...doc.getElementsByTagName('table')]) {
    if (t.parentElement.closest('table, math, .wv-eq, .wv-math') || t.matches('.ltx_equation, .ltx_equationgroup, .ltx_eqn_table, .wt-fit, .wt-fixed') || t.rows.length < 2) continue;
    n++;
    now ||= colNow(); // one layout read, only for a document with tables
    const { nat, min, floor, mean } = tableWidthEm(t);
    const isWide = nat * TABLE_EM > 1.3 * colEm();
    const fs = isWide ? WIDE_EM : TABLE_EM;
    if (min * fs <= 0.92 * Math.min(now, 1.25 * colEm())) t.classList.add('wt-fit');
    else if (!t.querySelector(':scope > colgroup, :scope > col')) {
      // Widths in proportion to each column's text (rows come out about even), never under its longest word.
      t.classList.add('wt-fixed');
      const C = now / fs, sum = mean.reduce((a, b) => a + b, 0) || 1;
      const w = mean.map((m, k) => Math.max(floor[k], (m / sum) * C)), tot = w.reduce((a, b) => a + b, 0);
      const cg = doc.createElement('colgroup');
      for (const x of w) { const c = doc.createElement('col'); c.style.width = (100 * x / tot).toFixed(1) + '%'; cg.append(c); }
      const cap0 = t.querySelector(':scope > caption');
      if (cap0) cap0.after(cg); else t.prepend(cg);
    } else t.classList.add('wt-fixed');
    if (!isWide) continue;
    t.classList.add('wt-wide'); wide++;
    t.dataset.wtCols = mean.length;
    let cap = t.querySelector(':scope > caption');
    if (!cap) { cap = doc.createElement('caption'); cap.className = 'wt-cap'; t.prepend(cap); }
    cap.prepend(flagBtn(doc, 'table'));
  }
  return [n, wide];
}

// ---------------------------------------------------------------- the wide view
let ov = null, back = null;
function closeWide() {
  if (!ov) return;
  ov.remove(); ov = null;
  removeEventListener('keydown', onKey, true);
  removeEventListener('resize', closeWide);
  try { back?.focus({ preventScroll: true }); } catch { /* gone */ }
  back = null;
}
function onKey(e) {
  if (!ov) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeWide(); }
}
/** Show a flagged table (its figure, with the caption) or diagram across the spread. */
function openWide(btn) {
  closeWide();
  const fig = btn.closest('figure.wv-diagram');
  const table = fig ? null : btn.closest('table');
  const src = fig || table?.closest('figure') || table;
  const sp = $('#spread');
  if (!src || !sp) return;
  const r = sp.getBoundingClientRect();
  const body = src.cloneNode(true);
  body.querySelectorAll('.wt-open').forEach((b) => b.remove());
  body.querySelectorAll('caption.wt-cap').forEach((c) => { if (!c.textContent.trim()) c.remove(); });
  body.removeAttribute('data-vp'); body.querySelectorAll('[data-vp]').forEach((x) => x.removeAttribute('data-vp'));
  const cols = table?.dataset.wtCols, rows = table ? [...table.tBodies].reduce((n, b) => n + b.rows.length, 0) || table.rows.length : 0;
  const label = fig ? 'Diagram' : `Table${cols ? ` · ${cols} columns` : ''}${rows ? ` · ${rows} rows` : ''}`;
  const x = h('button', { type: 'button', className: 'wt-x', title: 'Close (Esc)', textContent: '✕' });
  x.setAttribute('aria-label', 'Close');
  const flow = h('div', { className: 'flow wt-flow' + (fig ? ' wt-dg' : '') }, body);
  flow.style.fontSize = (live?.g?.font || state.font || 15) + 'px';
  const sheet = h('div', { className: 'wt-sheet' }, h('div', { className: 'wt-bar' }, h('span', { className: 'wt-t', textContent: label }), h('span', { className: 'wt-k', textContent: 'Esc closes' }), x), h('div', { className: 'wt-body' }, flow));
  ov = h('div', { id: 'wt-ov' }, sheet);
  ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', label);
  Object.assign(ov.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target.closest('.wt-x')) closeWide(); });
  ov.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  back = btn;
  document.body.append(ov);
  addEventListener('keydown', onKey, true);
  addEventListener('resize', closeWide);
  x.focus({ preventScroll: true });
}
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.flow .wt-open');
  if (!b || b.closest('#wt-ov')) return;
  e.preventDefault(); e.stopPropagation();
  openWide(b);
}, true);
let lastMove = 0; // the reader's last move (a turn, an item, a skim step), for quiet()
for (const ev of ['nav', 'item:shown', 'view:changed', 'header:changed']) on(ev, () => { lastMove = Date.now(); if (ov) closeWide(); });
on('item:skim', () => { lastMove = Date.now(); });

// ---------------------------------------------------------------- mermaid
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';
const FONT = '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif';
let mmP = null;
/** mermaid's single-file build (it sets globalThis.mermaid), through the proxy, once. */
function mermaidLib() {
  return (mmP ||= new Promise((res, rej) => {
    if (window.mermaid?.render) { res(window.mermaid); return; }
    const s = document.createElement('script');
    s.src = P(MERMAID); s.async = true;
    s.onload = () => (window.mermaid?.render ? res(window.mermaid) : rej(new Error('mermaid did not load')));
    s.onerror = () => rej(new Error('mermaid did not load'));
    document.head.append(s);
  }).catch((e) => { mmP = null; throw e; }));
}
const idle = (ms) => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: ms }) : setTimeout(r, 50)));
const mixHex = (a, b, t) => { const A = parseColor(a), B = parseColor(b); return A && B ? toHex(A.map((v, j) => v + (B[j] - v) * t)) : a; };
/** Theme variables from the paper on screen now (settings.js sets --paper*; cream leaves them unset). */
function paperTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, d) => { const x = cs.getPropertyValue('--' + n).trim(); return parseColor(x) ? x : d; };
  const dark = document.documentElement.dataset.stPaper === 'dark';
  const bg = v('paper', dark ? '#22201c' : '#f4efe4');
  const ink = v('paper-ink', '#26211a'), ink2 = v('paper-ink-2', '#4a4236'), ink3 = v('paper-ink-3', '#5d5446');
  const code = v('paper-code', '#ebe4d6'), rule = v('paper-rule', '#d8cfbd');
  return {
    dark,
    vars: {
      darkMode: dark, background: bg, fontFamily: FONT, fontSize: '15px',
      primaryColor: code, primaryTextColor: ink, primaryBorderColor: ink3, lineColor: ink2, textColor: ink,
      secondaryColor: mixHex(code, bg, 0.5), secondaryTextColor: ink, secondaryBorderColor: rule,
      tertiaryColor: bg, tertiaryTextColor: ink, tertiaryBorderColor: rule,
      mainBkg: code, nodeBorder: ink3, clusterBkg: mixHex(code, bg, 0.6), clusterBorder: rule,
      edgeLabelBackground: bg, titleColor: ink, noteBkgColor: mixHex(code, bg, 0.3), noteTextColor: ink, noteBorderColor: rule,
      actorBkg: code, actorBorder: ink3, actorTextColor: ink, signalColor: ink2, signalTextColor: ink, labelBoxBkgColor: code, labelTextColor: ink, loopTextColor: ink,
    },
  };
}
let host = null, seq = 0, chain = Promise.resolve();
/** One diagram as SVG text; renders one at a time (mermaid keeps global state). */
function renderSvg(M, src, theme) {
  const run = chain.then(async () => {
    host ||= document.body.appendChild(h('div', { id: 'wv-mm-host', ariaHidden: 'true' }));
    M.initialize({
      startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: theme.vars, darkMode: theme.dark,
      fontFamily: FONT, htmlLabels: false, flowchart: { htmlLabels: false }, suppressErrorRendering: true,
      // A diagram's own %%{init}%% may not restyle it or reach outside it.
      secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'theme', 'themeVariables', 'themeCSS', 'fontFamily', 'darkMode', 'htmlLabels'],
    });
    const id = 'wvmm' + (++seq);
    try { return (await M.render(id, src, host)).svg; }
    finally { host.replaceChildren(); document.getElementById('d' + id)?.remove(); document.getElementById(id)?.remove(); }
  });
  chain = run.catch(() => {});
  return run;
}
/** SVG text → an inert <img> (no scripts, no outside requests, no text in the page) with its box. */
function diagramFig(doc, svg, dark, src) {
  const sd = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = sd.documentElement;
  if (root.nodeName !== 'svg' || sd.querySelector('parsererror')) throw new Error('not an SVG');
  const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const w = vb[2] > 0 ? vb[2] : parseFloat(root.getAttribute('width')), hh = vb[3] > 0 ? vb[3] : parseFloat(root.getAttribute('height'));
  if (!(w > 0 && hh > 0)) throw new Error('no size');
  for (const el of [...root.querySelectorAll('script, foreignObject iframe, a[href^="javascript"]')]) el.remove();
  for (const st of root.querySelectorAll('style')) st.textContent = st.textContent.replace(/@import[^;]*;/g, '').replace(/url\(\s*['"]?(?!#)[^)]*\)/g, 'none');
  root.setAttribute('width', String(Math.round(w))); root.setAttribute('height', String(Math.round(hh)));
  root.removeAttribute('style');
  const img = doc.createElement('img');
  img.className = 'wv-dgimg';
  img.alt = 'Diagram: ' + src.split('\n').slice(1).join(' ').replace(/\s+/g, ' ').replace(/[-=.]+>|\|/g, ' ').slice(0, 200).trim();
  img.setAttribute('src', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(root)));
  img.style.setProperty('--w', Math.round(w) + 'px'); img.style.setProperty('--r', (w / hh).toFixed(4));
  const fig = doc.createElement('figure');
  fig.className = 'wv-diagram ' + (dark ? 'dk' : 'lt');
  fig.append(img);
  // Wider than about 1.3 columns at its own size: it gets the wide view too.
  if (w > 1.3 * colEm() * (state.font || 15)) { fig.classList.add('wt-wide'); const cap = doc.createElement('figcaption'); cap.className = 'wt-cap'; cap.append(flagBtn(doc, 'diagram')); fig.append(cap); }
  return fig;
}
const isCurrent = (it) => items[current()] === it;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** For a document opened ahead (prefetch, a hover): wait until the reader has not turned a page or
 *  moved to another item for 1.5 s (compile.js waits the same way), then for an idle moment, so
 *  drawing (mermaid's first load is one long task) does not land on a turn. Not for the item on
 *  screen, and never more than 30 s. */
async function quiet(it) {
  const t0 = Date.now();
  const busy = () => document.hidden || Date.now() - Math.max(lastMove, state.turns?.at(-1)?.at || 0) < 1500;
  while (!isCurrent(it) && Date.now() - t0 < 30000 && busy()) await sleep(400);
  if (!isCurrent(it)) await idle(800);
}

// ---------------------------------------------------------------- the hooks
// Inside prepareFlow, on every flow document (and the wall's digests).
flowFilters.push((doc, it) => {
  const t0 = performance.now();
  const n = prepCode(doc);
  finishCode(doc);
  const t1 = performance.now();
  const [tables, wide] = markTables(doc);
  const code = doc.getElementsByClassName('wv-code').length, mermaid = doc.getElementsByClassName('wv-mermaid').length;
  if (code || tables || mermaid) note({ id: it?.id, step: 'prepare', ms: +(performance.now() - t0).toFixed(2), codeMs: +(t1 - t0).toFixed(2), rewrote: n, code, tables, wide, mermaid });
});
// After prepareFlow, when a document opens (docs.js openDoc): draw its diagrams before layout.
flowAfter.push(async (d, it) => {
  if (!d.html.includes('wv-mermaid')) return;
  const tw = performance.now();
  await quiet(it);
  const t0 = performance.now();
  const doc = new DOMParser().parseFromString(d.html, 'text/html');
  const pres = [...doc.querySelectorAll('pre.wv-mermaid')];
  if (!pres.length) return;
  let M = null, err = '';
  try { M = await mermaidLib(); } catch (e) { err = e.message; }
  const tLib = performance.now();
  const theme = paperTheme();
  let ok = 0;
  for (const pre of pres) {
    try {
      if (!M) throw new Error(err || 'mermaid did not load');
      if (pre !== pres[0]) await quiet(it);
      const fig = diagramFig(doc, await renderSvg(M, pre.textContent, theme), theme.dark, pre.textContent);
      if (pre.dataset.vp != null) fig.dataset.vp = pre.dataset.vp;
      pre.replaceWith(fig); ok++;
    } catch (e) {
      pre.classList.add('wv-dg-fail');
      pre.title = 'Mermaid: ' + String(e?.message || e).replace(/\s+/g, ' ').slice(0, 240);
    }
  }
  d.html = doc.body.innerHTML;
  note({ id: it?.id, step: 'mermaid', ms: +(performance.now() - t0).toFixed(1), lib: +(tLib - t0).toFixed(1), waited: Math.round(t0 - tw), diagrams: pres.length, ok });
  console.debug(`flowblocks: ${ok}/${pres.length} diagrams for ${it?.id} in ${Math.round(performance.now() - t0)} ms (library ${Math.round(tLib - t0)} ms)`);
  return d;
});
