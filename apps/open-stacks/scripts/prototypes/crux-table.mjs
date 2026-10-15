#!/usr/bin/env node
/**
 * Crux Table — build the syntopicon data for prototypes/crux-table.html.
 *
 *   node scripts/prototypes/crux-table.mjs
 *
 * Input:
 *   public/prototypes/data/texts/*.txt          nine Project Gutenberg texts (public domain)
 *   scripts/prototypes/crux-table.curation.mjs  AI-authored stances + candidate quotations
 *
 * Output:
 *   public/prototypes/data/crux-table/crux.json
 *
 * What it does, deterministically:
 *   1. Marks each book's own text (excluding Gutenberg front matter, editorial
 *      introductions such as Cohen's and Dewey's essays in the Peirce volume or
 *      Royce's in Poincaré, tables of contents and indexes) and finds chapter,
 *      section and paragraph locators.
 *   2. VERIFIES every candidate quotation: exact substring of the book after
 *      normalising whitespace, Gutenberg italics markers (_ and *), footnote
 *      anchors like [112] and curly/straight quote glyphs. The stored quotation
 *      is the SOURCE text at the matched span, never the curated string. Misses,
 *      and matches inside editorial matter, are dropped and logged.
 *   3. Computes TileBars (Hearst 1995): each book's own text is cut into tiles of
 *      about 1,200 words; each tile is scored per sub-question by idf-weighted
 *      counts of period vocabulary, and quantised to 0-9.
 *   4. Detects text reuse between books (shared 8-word shingles after the same
 *      normalisation, and shared numbers of six or more digits). These "echoes"
 *      are evidence the page computes, not claims the model makes.
 *   5. Builds the reading list that would let a reader audit every cell.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as C from './crux-table.curation.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEXTS = join(APP, 'public/prototypes/data/texts');
const OUTDIR = join(APP, 'public/prototypes/data/crux-table');
const TILE_WORDS = 1200;

// ------------------------------------------------------------------ books
// regions: [startLine, endLineExclusive] of the author's own text (1-based lines).
// parts: dated sub-works (Peirce's essays, Poincaré's three books) for quote dates.
const BOOKS = [
  { key: 'hume', id: 9662, author: 'David Hume', short: 'Hume', title: 'An Enquiry Concerning Human Understanding', y: 1748, yLabel: '1748',
    ed: 'Text of the posthumous 1777 edition (Selby-Bigge, 2nd ed., Oxford 1902)', regions: [[58, 5260]], chapter: /^SECTION ([IVX]+)\.$/, chapLabel: 'Sect.', para: /^(\d{1,3})\. [A-Z_'‘"]/, paraLabel: '¶' },
  { key: 'laplace', id: 58881, author: 'Pierre-Simon Laplace', short: 'Laplace', title: 'A Philosophical Essay on Probabilities', y: 1814, yLabel: '1814',
    ed: 'Translated from the 6th French edition by F. W. Truscott and F. L. Emory (Wiley, 1902)', regions: [[162, 5041]], chapter: /^CHAPTER ([IVX]+)\.$/, chapLabel: 'Ch.' },
  { key: 'mill', id: 34901, author: 'John Stuart Mill', short: 'Mill', title: 'On Liberty', y: 1859, yLabel: '1859',
    ed: 'Walter Scott Publishing Co. edition (introduction by W. L. Courtney excluded)', regions: [[451, 4704]], chapter: /^CHAPTER ([IVX]+)\.$/, chapLabel: 'Ch.', marginal: true },
  { key: 'darwin', id: 1228, author: 'Charles Darwin', short: 'Darwin', title: 'On the Origin of Species', y: 1859, yLabel: '1859',
    ed: 'First edition (John Murray, 1859)', regions: [[285, 14590]], chapter: /^CHAPTER ([IVX]+)\.$/, chapLabel: 'Ch.', marginal: true },
  { key: 'jevons', id: 74864, author: 'W. Stanley Jevons', short: 'Jevons', title: 'The Principles of Science', y: 1874, yLabel: '1874',
    ed: 'Second edition (1877), Macmillan stereotyped printing of 1883', regions: [[86, 959], [1808, 31479]], chapter: /^CHAPTER ([IVXL]+)\.$/, chapLabel: 'Ch.' },
  { key: 'peirce', id: 65274, author: 'Charles Sanders Peirce', short: 'Peirce', title: 'Chance, Love, and Logic', y: 1878, yLabel: '1878–93',
    ed: 'Essays of 1868–1893 collected by Morris R. Cohen (Kegan Paul, 1923); Cohen\'s introduction and Dewey\'s essay excluded', regions: [[1037, 9195]],
    parts: [
      [1037, 'Proem: The Rules of Philosophy', 1868], [1128, 'The Fixation of Belief', 1877], [1802, 'How to Make Our Ideas Clear', 1878],
      [2566, 'The Doctrine of Chances', 1878], [3163, 'The Probability of Induction', 1878], [3853, 'The Order of Nature', 1878],
      [4570, 'Deduction, Induction, and Hypothesis', 1878], [5251, 'The Architecture of Theories', 1891], [5834, 'The Doctrine of Necessity Examined', 1892],
      [6464, 'The Law of Mind', 1892], [7481, 'Man\'s Glassy Essence', 1892], [8290, 'Evolutionary Love', 1893],
    ], section: /^\s{12,}([IVX]{1,4})\s*$/, secLabel: '§' },
  { key: 'venn', id: 57359, author: 'John Venn', short: 'Venn', title: 'The Logic of Chance', y: 1888, yLabel: '1888',
    ed: 'Third edition (Macmillan, 1888); first edition 1866', regions: [[67, 455], [868, 18244]], chapter: /^CHAPTER ([IVX]+)\.?(?:\[\d+\])?$/, chapLabel: 'Ch.', vennSec: true },
  { key: 'poincare', id: 39713, author: 'Henri Poincaré', short: 'Poincaré', title: 'The Foundations of Science', y: 1902, yLabel: '1902–08',
    ed: 'Translated by G. B. Halsted (Science Press, 1913); Royce\'s introduction excluded', regions: [[451, 661], [1285, 21627]],
    parts: [[451, 'Author\'s Preface to the Translation', 1913], [1285, 'Science and Hypothesis', 1902], [8299, 'The Value of Science', 1905], [14286, 'Science and Method', 1908]],
    chapter: /^CHAPTER ([IVX]+)$/, chapLabel: 'Ch.' },
  { key: 'russell', id: 5827, author: 'Bertrand Russell', short: 'Russell', title: 'The Problems of Philosophy', y: 1912, yLabel: '1912',
    ed: 'Home University Library (Williams and Norgate, 1912)', regions: [[1, 3975]], chapter: /^CHAPTER ([IVX]+)\. /, chapLabel: 'Ch.' },
];
const BK = Object.fromEntries(BOOKS.map((b) => [b.key, b]));

// ------------------------------------------------------------------ normalisation
// Returns { s, map } where s is the normalised string and map[i] is the index in the
// original string of normalised char i. Lower-casing is optional (for shingles).
function normalise(src, { lower = false } = {}) {
  let out = '';
  const map = [];
  let pendingSpace = false;
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    if (ch === '[') { // footnote anchor [12]
      const m = /^\[\d{1,3}\]/.exec(src.slice(i, i + 6));
      if (m) { i += m[0].length - 1; continue; }
    }
    if (ch === '_' || ch === '*') continue;
    if (/\s/.test(ch)) { if (out.length) pendingSpace = true; continue; }
    if (ch === '‘' || ch === '’') ch = "'";
    else if (ch === '“' || ch === '”') ch = '"';
    if (pendingSpace) { out += ' '; map.push(i); pendingSpace = false; }
    out += lower ? ch.toLowerCase() : ch;
    map.push(i);
  }
  return { s: out, map };
}
const normQuote = (q) => normalise(q).s;

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
// Display form of an original slice: collapse whitespace, drop footnote anchors,
// render balanced _x_ / *x* as <i>, drop unbalanced markers.
function displayHTML(slice) {
  let t = slice.replace(/\[\d{1,3}\]/g, '').replace(/\s+/g, ' ').trim();
  t = esc(t);
  for (const mk of ['_', '\\*']) {
    const re = new RegExp(`${mk}([^${mk === '_' ? '_' : '*'}]+?)${mk}`, 'g');
    t = t.replace(re, '<i>$1</i>');
  }
  return t.replace(/[_*]/g, '');
}
const plain = (h) => h.replace(/<\/?i>/g, '');

// ------------------------------------------------------------------ load books
for (const b of BOOKS) {
  const raw = readFileSync(join(TEXTS, `${b.id}.txt`), 'utf-8');
  b.raw = raw;
  b.lines = raw.split('\n');
  b.lineStart = [];
  let off = 0;
  for (const ln of b.lines) { b.lineStart.push(off); off += ln.length + 1; }
  b.nlines = b.lines.length;
  const N = normalise(raw);
  b.norm = N.s; b.nmap = N.map;
  b.inOwn = (line) => b.regions.some(([s, e]) => line >= s && line < e);
  b.ownWords = 0;
  for (const [s, e] of b.regions) for (let l = s; l < e; l++) b.ownWords += (b.lines[l - 1].match(/[A-Za-zÀ-ÿ]+/g) || []).length;
}
function lineOf(b, off) { // 1-based line containing original offset
  let lo = 0, hi = b.lineStart.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (b.lineStart[mid] <= off) lo = mid; else hi = mid - 1; }
  return lo + 1;
}

// ------------------------------------------------------------------ chapters & locators
function nextTitle(b, l) {
  for (let k = l; k < Math.min(l + 6, b.nlines); k++) {
    const t = b.lines[k].trim();
    if (t && !/^PART\b/.test(t)) return t.replace(/[_*]/g, '').replace(/\[\d+\]/g, '').replace(/\.$/, '');
  }
  return '';
}
const titleCase = (s) => s.length > 3 && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(“"-])([a-zà-ÿ])/g, (m, a, c) => a + c.toUpperCase()).replace(/\b(Of|The|And|In|On|To|A|An|By|As|For|With|From)\b/g, (w, _x, i) => (i === 0 ? w : w.toLowerCase())) : s;

for (const b of BOOKS) {
  b.chapters = [];
  if (b.key === 'peirce') {
    for (const [l, t, y] of b.parts) b.chapters.push({ l, label: `“${t}”`, title: t, y });
  } else {
    for (let i = 0; i < b.nlines; i++) {
      const line = i + 1;
      if (!b.inOwn(line)) continue;
      const m = b.chapter && b.chapter.exec(b.lines[i].trim());
      if (!m) continue;
      let title = b.key === 'russell' ? b.lines[i].trim().replace(/^CHAPTER [IVX]+\. /, '') : nextTitle(b, line);
      const ch = { l: line, label: `${b.chapLabel} ${m[1]}`, title: titleCase(title.replace(/^_|_$/g, '')) };
      if (b.parts) { const p = [...b.parts].reverse().find(([pl]) => pl <= line); if (p) { ch.part = p[1]; ch.y = p[2]; } }
      b.chapters.push(ch);
    }
    if (b.key === 'venn') b.chapters.unshift({ l: 67, label: 'Prefaces', title: 'Prefaces to the three editions' });
    if (b.key === 'jevons') b.chapters.unshift({ l: 86, label: 'Prefaces', title: 'Prefaces to the first and second editions' });
    if (b.key === 'darwin') b.chapters.unshift({ l: 285, label: 'Introd.', title: 'Introduction' });
    if (b.key === 'russell') b.chapters.unshift({ l: 1, label: 'Preface', title: 'Preface' });
    if (b.key === 'poincare') {
      b.chapters.unshift({ l: 451, label: 'Preface', title: 'Author\'s Preface to the Translation', part: 'Author\'s Preface', y: 1913 });
      for (const [pl, pt, py] of b.parts.slice(1)) b.chapters.push({ l: pl, label: 'Introd.', title: 'Introduction', part: pt, y: py });
    }
  }
  b.chapters.sort((a, c) => a.l - c.l);
}
function chapterAt(b, line) { let c = null; for (const ch of b.chapters) { if (ch.l <= line) c = ch; else break; } return c; }

function lineIsNoteBlock(b, start, line) { // is `line` inside the footnote that begins at `start`?
  for (let l = start + 1; l <= line; l++) { const t = b.lines[l - 1]; if (t.trim() === '') return false; if (!/^  \S/.test(t)) return false; }
  return true;
}
function sectionAt(b, line) {
  if (b.key === 'hume') { // Selby-Bigge paragraph numbers; indented [n] blocks are footnotes
    if (/^\s{4}/.test(b.lines[line - 1])) {
      for (let l = line; l > 0 && /^\s{4}|^$/.test(b.lines[l - 1]); l--) { const m = /^\s+\[(\d+)\]/.exec(b.lines[l - 1]); if (m) return `note ${m[1]}`; }
    }
    for (let l = line; l > 0; l--) { const m = b.para.exec(b.lines[l - 1]); if (m) return `¶${m[1]}`; if (/^SECTION /.test(b.lines[l - 1])) break; }
    return null;
  }
  if (b.key === 'venn') { // §n, numbered monotonically within a chapter; footnotes have indented continuation lines
    const ch = chapterAt(b, line); if (!ch) return null;
    let cur = 0;
    for (let l = ch.l + 1; l <= line; l++) {
      const m = /^ ?(\d{1,2})\. \S/.exec(b.lines[l - 1]);
      if (!m) continue;
      const isNote = /^  \S/.test(b.lines[l] || '');
      if (isNote) { if (l <= line && lineIsNoteBlock(b, l, line)) return `note ${m[1]}`; continue; }
      if (+m[1] === cur + 1) cur = +m[1];
    }
    return cur ? `§${cur}` : null;
  }
  if (b.key === 'peirce') {
    const ch = chapterAt(b, line); if (!ch) return null;
    let sec = null;
    for (let l = ch.l + 1; l <= line; l++) { const m = b.section.exec(b.lines[l - 1]); if (m) sec = m[1]; const fm = /^Footnote (\d+):/.exec(b.lines[l - 1]); if (fm) { let n = fm[1]; for (let k = l; k <= line; k++) { const f2 = /^Footnote (\d+):/.exec(b.lines[k - 1]); if (f2) n = f2[1]; } return `note ${n}`; } }
    return sec ? `§${sec}` : null;
  }
  return null;
}
function huntPart(b, line) { // Hume's PART I / II within a section
  if (b.key !== 'hume') return null;
  for (let l = line; l > 0; l--) { const t = b.lines[l - 1].trim(); if (/^PART [IVX]+\.$/.test(t)) return 'Pt. ' + t.slice(5, -1); if (/^SECTION /.test(t)) return null; }
  return null;
}
function locate(b, l0) {
  const ch = chapterAt(b, l0);
  const parts = [];
  if (b.key === 'poincare' && ch?.part) parts.push(ch.part);
  if (ch) parts.push(ch.label);
  const pt = huntPart(b, l0); if (pt) parts.push(pt);
  const sec = sectionAt(b, l0); if (sec) parts.push(sec);
  const y = ch?.y ?? b.y;
  return { loc: parts.join(', '), ch: ch ? ch.label : null, chTitle: ch ? ch.title : null, y };
}

// ------------------------------------------------------------------ verify quotes
const quotes = {};
const dropped = [];
let proposed = 0;
function verify(id, [key, text]) {
  proposed++;
  const b = BK[key];
  if (!b) { dropped.push({ id, reason: `unknown book ${key}` }); return null; }
  const nq = normQuote(text);
  let from = 0, hit = -1, editorialHit = false;
  while (true) {
    const i = b.norm.indexOf(nq, from);
    if (i < 0) break;
    const l0 = lineOf(b, b.nmap[i]);
    if (b.inOwn(l0)) { hit = i; break; }
    editorialHit = true; from = i + 1;
  }
  if (hit < 0) { dropped.push({ id, book: key, reason: editorialHit ? 'matched only in editorial matter' : 'no exact match in source', text }); return null; }
  let o0 = b.nmap[hit], o1 = b.nmap[hit + nq.length - 1] + 1;
  // keep italics markers that hug the span, so _..._ pairs stay balanced in the display
  if ('_*'.includes(b.raw[o0 - 1])) o0--;
  if ('_*'.includes(b.raw[o1])) o1++;
  const l0 = lineOf(b, o0), l1 = lineOf(b, o1 - 1);
  const h = displayHTML(b.raw.slice(o0, o1));
  const where = locate(b, l0);
  return { id, a: key, h, l0, l1, o0, o1, ...where };
}
for (const [id, spec] of Object.entries(C.Q)) { const v = verify(id, spec); if (v) quotes[id] = v; }

// ------------------------------------------------------------------ cells
const parseRef = (r) => { const [id, role] = r.split(':'); return { id, role: role || 'asserts' }; };
const cells = [];
for (const [q, a, pos, stance, note, refs, range, frame] of C.CELLS) {
  const qs = refs.map(parseRef).filter((r) => quotes[r.id]);
  if (!qs.length) { dropped.push({ id: `${q}|${a}`, reason: 'cell lost all its quotes' }); continue; }
  cells.push({ q, a, pos, range: range || null, frame: frame || null, stance, note, quotes: qs });
}
const example = {
  q: C.EXAMPLE.q, poles: C.EXAMPLE.poles, terms: C.EXAMPLE.terms,
  cells: C.EXAMPLE.cells.map(([a, pos, stance, note, refs]) => ({ a, pos, stance, note, quotes: refs.map(parseRef).filter((r) => quotes[r.id]) })).filter((c) => c.quotes.length),
};

// ------------------------------------------------------------------ tiles & TileBars
for (const b of BOOKS) {
  b.tiles = []; // start lines
  let words = 0;
  for (const [s, e] of b.regions) {
    b.tiles.push(s); words = 0;
    for (let l = s; l < e; l++) {
      const w = (b.lines[l - 1].match(/[A-Za-zÀ-ÿ]+/g) || []).length;
      if (words >= TILE_WORDS && b.lines[l - 1].trim() === '') { b.tiles.push(l); words = 0; }
      words += w;
    }
  }
  // tile end lines
  b.tileEnd = b.tiles.map((s, i) => {
    const nxt = b.tiles[i + 1];
    const reg = b.regions.find(([rs, re]) => s >= rs && s < re);
    return nxt && nxt < reg[1] ? nxt : reg[1];
  });
  b.tileText = b.tiles.map((s, i) => b.lines.slice(s - 1, b.tileEnd[i] - 1).join('\n').toLowerCase().replace(/[_*]/g, ''));
}
function countTerm(text, term) {
  const t = term.toLowerCase();
  const re = new RegExp((/^\w/.test(t) ? '\\b' : '') + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'), 'g');
  return (text.match(re) || []).length;
}
const allTiles = BOOKS.flatMap((b) => b.tileText);
function tileBars(terms) {
  const df = terms.map((t) => allTiles.filter((tx) => countTerm(tx, t) > 0).length);
  const idf = df.map((d) => Math.log(1 + allTiles.length / (1 + d)));
  const raw = {};
  let max = 0;
  for (const b of BOOKS) {
    raw[b.key] = b.tileText.map((tx) => {
      let s = 0;
      terms.forEach((t, k) => { const c = countTerm(tx, t); if (c) s += idf[k] * Math.log(1 + c); });
      return s;
    });
    for (const v of raw[b.key]) max = Math.max(max, v);
  }
  // quantise against the 99th percentile so a single dense tile does not wash out the rest
  const sorted = Object.values(raw).flat().sort((x, y) => x - y);
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || max || 1;
  const tiles = {}, hot = {};
  for (const b of BOOKS) {
    tiles[b.key] = raw[b.key].map((v) => Math.max(0, Math.min(9, Math.round((v / p99) * 9)))).join('');
    const ranked = raw[b.key].map((v, i) => [v, i]).sort((x, y) => y[0] - x[0]).slice(0, 2).filter(([v]) => v > 0);
    hot[b.key] = ranked.map(([v, i]) => {
      // densest line in the tile, as a verbatim snippet
      let best = b.tiles[i], bestN = -1;
      for (let l = b.tiles[i]; l < b.tileEnd[i]; l++) {
        const t = (b.lines[l - 1] + ' ' + (b.lines[l] || '')).toLowerCase();
        const n = terms.reduce((acc, tm) => acc + countTerm(t, tm), 0);
        if (n > bestN) { bestN = n; best = l; }
      }
      const snip = b.lines.slice(best - 2, best + 2).join(' ').replace(/\[\d{1,3}\]/g, '').replace(/[_*]/g, '').replace(/\s+/g, ' ').trim();
      return { t: i, l: best, s: snip.slice(0, 260) };
    });
  }
  return { tiles, hot };
}
const questions = C.QUESTIONS.map((q) => ({ ...q, ...tileBars(q.terms) }));
example.tb = tileBars(example.terms);

// ------------------------------------------------------------------ echoes (text reuse)
const STOP = new Set('the of and to a in that is it be as which by this for with not or are we on but from at have his has was an if they he there would their its so all may one any been such these more than our what them other no will can into who only same those were do some them'.split(' '));
function tokens(b) {
  const out = []; // {w, off}
  for (const [s, e] of b.regions) {
    const startOff = b.lineStart[s - 1], endOff = e - 1 < b.lineStart.length ? b.lineStart[e - 1] : b.raw.length;
    const seg = b.raw.slice(startOff, endOff).replace(/(\d),(?=\d{3}\b)/g, '$1 ').toLowerCase();
    // keep offsets: we replaced ',' with ' ' (same length) so offsets are preserved
    const re = /[a-zà-ÿ]+|\d+/g; let m;
    let pendingDigits = null;
    while ((m = re.exec(seg))) {
      const w = m[0];
      if (/^\d+$/.test(w) && pendingDigits && seg.slice(pendingDigits.end, m.index) === ' ' && w.length === 3) { // 1,826,214 → 1826214
        pendingDigits.w += w; pendingDigits.end = m.index + w.length; continue;
      }
      const tok = { w, off: startOff + m.index, end: m.index + w.length };
      if (/^\d+$/.test(w)) pendingDigits = tok; else pendingDigits = null;
      out.push(tok);
    }
  }
  return out;
}
const K = 8;
const shingleMap = new Map(); // shingle -> Map(book -> [positions])
const TOK = {};
for (const b of BOOKS) {
  const toks = tokens(b); TOK[b.key] = toks;
  for (let i = 0; i + K <= toks.length; i++) {
    const words = toks.slice(i, i + K).map((t) => t.w);
    const content = words.filter((w) => !STOP.has(w) && w.length > 2).length;
    if (content < 3) continue;
    const sh = words.join(' ');
    let e = shingleMap.get(sh);
    if (!e) { e = new Map(); shingleMap.set(sh, e); }
    if (!e.has(b.key)) e.set(b.key, []);
    e.get(b.key).push(i);
  }
}
// collect pairwise hits, then merge runs
const pairHits = new Map(); // "a|b" -> [[ia, ib]]
for (const [, e] of shingleMap) {
  if (e.size < 2) continue;
  const ks = [...e.keys()];
  for (let x = 0; x < ks.length; x++) for (let y = x + 1; y < ks.length; y++) {
    const [ka, kb] = [ks[x], ks[y]].sort((p, q) => BK[p].y - BK[q].y || p.localeCompare(q));
    const key = `${ka}|${kb}`;
    if (!pairHits.has(key)) pairHits.set(key, []);
    for (const ia of e.get(ka).slice(0, 24)) for (const ib of e.get(kb).slice(0, 24)) pairHits.get(key).push([ia, ib]);
  }
}
const echoes = [];
function spanText(b, o0, o1) { return displayHTML(b.raw.slice(o0, o1)); }
for (const [key, hits] of pairHits) {
  const [ka, kb] = key.split('|');
  const set = new Set(hits.map(([p, q]) => `${p}:${q}`));
  const used = new Set();
  const ta = TOK[ka], tb = TOK[kb];
  const A = BK[ka], B = BK[kb];
  for (const [ia, ib] of hits) {
    if (used.has(`${ia}:${ib}`)) continue;
    let s0 = ia, t0 = ib, s1 = ia, t1 = ib; // walk the diagonal both ways
    while (set.has(`${s0 - 1}:${t0 - 1}`)) { s0--; t0--; }
    while (set.has(`${s1 + 1}:${t1 + 1}`)) { s1++; t1++; }
    for (let k = 0; k <= s1 - s0; k++) used.add(`${s0 + k}:${t0 + k}`);
    const n = s1 - s0 + K;
    const alpha = ta.slice(s0, s1 + K).filter((t) => /^[a-zà-ÿ]+$/.test(t.w) && !STOP.has(t.w) && t.w.length > 2).length;
    if (n < 10 || alpha < 4) continue;
    const a0 = ta[s0].off, a1 = ta[s1 + K - 1].off + ta[s1 + K - 1].w.length;
    const b0 = tb[t0].off, b1 = tb[t1 + K - 1].off + tb[t1 + K - 1].w.length;
    echoes.push({ a: { book: ka, o0: a0, o1: a1, l0: lineOf(A, a0), l1: lineOf(A, a1 - 1), h: spanText(A, a0, a1), ...locate(A, lineOf(A, a0)) },
      b: { book: kb, o0: b0, o1: b1, l0: lineOf(B, b0), l1: lineOf(B, b1 - 1), h: spanText(B, b0, b1), ...locate(B, lineOf(B, b0)) }, words: n, kind: 'shingle' });
  }
}
// rare numbers (6+ digits) shared between books
const numIdx = new Map();
const isRound = (w) => /000$/.test(w) || [...Array(40).keys()].some((k) => String(2 ** k) === w);
for (const b of BOOKS) for (const t of TOK[b.key]) if (/^\d{6,}$/.test(t.w) && !isRound(t.w)) {
  if (!numIdx.has(t.w)) numIdx.set(t.w, new Map());
  const m = numIdx.get(t.w); if (!m.has(b.key)) m.set(b.key, t);
}
for (const [num, m] of numIdx) {
  if (m.size < 2) continue;
  const ks = [...m.keys()].sort((p, q) => BK[p].y - BK[q].y);
  for (let x = 0; x < ks.length; x++) for (let y = x + 1; y < ks.length; y++) {
    const A = BK[ks[x]], B = BK[ks[y]], ta = m.get(ks[x]), tb = m.get(ks[y]);
    const ctx = (bk, t) => { const l = lineOf(bk, t.off); return { book: bk.key, o0: t.off, o1: t.off + t.w.length + 3, l0: l, l1: l, h: displayHTML(bk.lines[l - 1]), ...locate(bk, l) }; };
    echoes.push({ a: ctx(A, ta), b: ctx(B, tb), words: 1, kind: 'number', num });
  }
}
echoes.sort((x, y) => (y.kind === 'number') - (x.kind === 'number') || y.words - x.words);
echoes.forEach((e, i) => { e.id = `E${i + 1}`; });
const echoesOut = () => echoes.map(({ a, b, ...r }) => ({ ...r, a: (({ o0, o1, ...x }) => x)(a), b: (({ o0, o1, ...x }) => x)(b) }));

// ------------------------------------------------------------------ threads (+ echo arcs between turns)
const overlaps = (q, side) => q.a === side.book && q.o0 < side.o1 && q.o1 > side.o0;
const threads = C.THREADS.map((t) => {
  const turns = t.turns.map(([qid, role, re]) => ({ q: qid, role, re })).filter((x) => quotes[x.q]);
  const arcs = [];
  turns.forEach((u, i) => turns.forEach((v, j) => {
    if (j <= i) return;
    const qa = quotes[u.q], qb = quotes[v.q];
    if (qa.a === qb.a) return;
    for (const e of echoes) {
      if ((overlaps(qa, e.a) && overlaps(qb, e.b)) || (overlaps(qa, e.b) && overlaps(qb, e.a))) { arcs.push({ from: i, to: j, echo: e.id }); break; }
    }
  }));
  return { id: t.id, title: t.title, lede: t.lede, turns, notes: t.notes, arcs };
});

// ------------------------------------------------------------------ vocabulary
const vocab = C.VOCAB.map((v) => ({ ...v, cells: v.cells.filter(([, , qid]) => quotes[qid]).map(([a, term, q]) => ({ a, term, q })) }));

// ------------------------------------------------------------------ reading list
const byChapter = new Map();
for (const c of cells) for (const r of c.quotes) {
  const q = quotes[r.id]; const b = BK[q.a]; const ch = chapterAt(b, q.l0);
  const key = `${q.a}|${ch ? ch.l : 0}`;
  if (!byChapter.has(key)) {
    const idx = ch ? b.chapters.indexOf(ch) : -1;
    const end = idx >= 0 && b.chapters[idx + 1] ? b.chapters[idx + 1].l : b.regions[b.regions.length - 1][1];
    let words = 0; for (let l = ch ? ch.l : 1; l < end; l++) words += (b.lines[l - 1].match(/[A-Za-zÀ-ÿ]+/g) || []).length;
    byChapter.set(key, { a: q.a, l: ch ? ch.l : 1, label: ch ? (q.a === 'poincare' && ch.part ? `${ch.part}, ${ch.label}` : ch.label) : '', title: ch ? ch.title : '', words, cells: new Set() });
  }
  byChapter.get(key).cells.add(`${c.q}|${c.a}`);
}
const reading = [...byChapter.values()].map((r) => ({ ...r, cells: r.cells.size, minutes: Math.round(r.words / 230) }))
  .sort((x, y) => y.cells - x.cells || BK[x.a].y - BK[y.a].y);

// ------------------------------------------------------------------ write
const books = BOOKS.map((b) => ({
  key: b.key, id: b.id, author: b.author, short: b.short, title: b.title, y: b.y, yLabel: b.yLabel, ed: b.ed,
  words: b.ownWords, lines: b.nlines, file: `texts/${b.id}.txt`, regions: b.regions, marginal: !!b.marginal,
  chapters: b.chapters.map(({ l, label, title, y, part }) => ({ l, label, title, ...(y ? { y } : {}), ...(part ? { part } : {}) })),
  tiles: b.tiles, tileEnd: b.tileEnd,
}));
const usedQuotes = new Set([...cells.flatMap((c) => c.quotes.map((r) => r.id)), ...example.cells.flatMap((c) => c.quotes.map((r) => r.id)),
  ...threads.flatMap((t) => t.turns.map((u) => u.q)), ...vocab.flatMap((v) => v.cells.map((c) => c.q))]);
const outQuotes = Object.fromEntries(Object.entries(quotes).filter(([id]) => usedQuotes.has(id)).map(([id, q]) => [id, { a: q.a, h: q.h, l0: q.l0, l1: q.l1, loc: q.loc, ch: q.ch, chTitle: q.chTitle, y: q.y }]));

const out = {
  meta: {
    title: 'Crux Table', question: 'What is probability, and what can it justify?',
    built: new Date().toISOString().slice(0, 10), provenance: C.PROVENANCE,
    normalisation: 'Exact substring after collapsing whitespace and removing Gutenberg italics markers (_ and *), footnote anchors such as [112], and the distinction between curly and straight quotation marks. The text shown is the source text at the matched span.',
    tileWords: TILE_WORDS,
    counts: { proposed, verified: Object.keys(quotes).length, dropped: dropped.length, cells: cells.length, quotesShown: Object.keys(outQuotes).length, echoes: echoes.length },
  },
  books, questions: questions.map(({ id, part, q, poles, kind, terms, synth, tiles, hot }) => ({ id, part, q, poles, kind, terms, synth, tiles, hot })),
  cells, silence: C.SILENCE, quotes: outQuotes, vocab, threads, echoes: echoesOut(),
  deps: C.DEPS, kinds: C.KINDS, pairs: C.PAIRS, example, reading,
  verification: { dropped },
};
mkdirSync(OUTDIR, { recursive: true });
writeFileSync(join(OUTDIR, 'crux.json'), JSON.stringify(out));

console.log(`crux-table: ${proposed} candidate quotes, ${Object.keys(quotes).length} verified, ${dropped.length} dropped`);
for (const d of dropped) console.log(`  DROPPED ${d.id} (${d.book || ''}): ${d.reason}${d.text ? ' :: ' + d.text.slice(0, 90) : ''}`);
console.log(`  ${cells.length} cells, ${echoes.length} echoes, ${reading.length} chapters in the audit reading list`);
console.log(`  wrote ${join(OUTDIR, 'crux.json')} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
