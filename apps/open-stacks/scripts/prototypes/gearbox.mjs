#!/usr/bin/env node
/**
 * Gearbox prototype data builder.
 *
 *   node scripts/prototypes/gearbox.mjs
 *
 * Reads the nine public-domain texts in public/prototypes/data/texts/ and the
 * hand-authored apparatus in ./gearbox-content.mjs, and writes:
 *
 *   public/prototypes/data/gearbox/structure.json
 *     Chapter segmentation of all nine books (line ranges into each .txt,
 *     titles, word counts), so the page can open any chapter of any book.
 *
 *   public/prototypes/data/gearbox/laplace.json
 *     The precomputed apparatus for Laplace's Essay (#58881): per-chapter
 *     gists, summaries, claims with verbatim quotes, bets, margin notes;
 *     the glossary; the printed-page map; dog-ears (passages in the other
 *     eight books that cite, quote or echo the Essay) and every other
 *     mention of Laplace found on the shelf.
 *
 * Verification. Every quotation (claim quotes, bet quotes, note anchors,
 * dog-ear excerpts and anchors) must occur verbatim inside a single
 * paragraph of its source text, compared after collapsing whitespace,
 * dropping _ and * italics markers and straightening curly quotes. Anything
 * that fails is dropped and reported. Paragraphs are identified by the
 * 0-based line number where they start; the page uses the same rule
 * (blank-line separated) to find them.
 *
 * Page numbers. The 1902 Wiley edition's table of contents gives each
 * chapter's first page. Pages inside a chapter are interpolated by word
 * position; the last chapter's end (p. 196) is estimated from the book's
 * average density of about 277 words per page.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CHAPTERS, GLOSSARY, DOGEARS, EXAMPLE_BETS, PROVENANCE } from './gearbox-content.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TEXTS = join(APP, 'public/prototypes/data/texts');
const OUT = join(APP, 'public/prototypes/data/gearbox');
mkdirSync(OUT, { recursive: true });

const index = JSON.parse(readFileSync(join(TEXTS, 'index.json'), 'utf-8'));
const meta = Object.fromEntries(index.books.map((b) => [b.id, b]));
const lines = {};
for (const b of index.books) lines[b.id] = readFileSync(join(TEXTS, `${b.id}.txt`), 'utf-8').split('\n');

// ---------- shared text rules (mirrored in the page) ----------
const norm = (s) =>
  s.replace(/[_*]/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
// Same characters as norm() minus the quote straightening, so offsets line up; used for text we display.
const shown = (s) => s.replace(/[_*]/g, '').replace(/\s+/g, ' ').trim();
const words = (s) => (s.match(/[A-Za-zÀ-ÿ0-9]+(?:['’][A-Za-z]+)?/g) || []).length;

/** Paragraphs of a line range: [{line, text}] where text is the joined, normalized paragraph. */
function paragraphs(id, from, to) {
  const L = lines[id];
  const out = [];
  let start = -1;
  let buf = [];
  for (let i = from; i <= to; i++) {
    const l = i < to ? L[i] : '';
    if (l === undefined || l.trim() === '') {
      if (buf.length) out.push({ line: start, text: norm(buf.join(' ')), shown: shown(buf.join(' ')) });
      buf = [];
      start = -1;
    } else {
      if (start < 0) start = i;
      buf.push(l.trim());
    }
  }
  return out;
}

// ---------- segmentation ----------
const ROMAN = { I: 1, V: 5, X: 10, L: 50 };
const roman = (r) => [...r].reduce((a, c, i, s) => (ROMAN[c] < (ROMAN[s[i + 1]] || 0) ? a - ROMAN[c] : a + ROMAN[c]), 0);
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'upon', 'with', 'which', 'its', 'be', 'are', 'is']);
function titleCase(s) {
  s = s.replace(/[_*]/g, '').replace(/\[\d+\]/g, '').replace(/[.,;:]+$/, '').trim();
  const letters = s.replace(/[^A-Za-zÀ-ÿ]/g, '');
  if (letters.replace(/[^A-ZÀ-Þ]/g, '').length < 0.7 * letters.length) return s;
  return s
    .toLowerCase()
    .split(/(\s+|—|-)/)
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/^([a-zà-ÿ])/, (m) => m.toUpperCase())))
    .join('')
    .replace(/\bA Priori\b/i, 'a priori');
}
function nextNonEmpty(L, i) {
  let j = i + 1;
  while (j < L.length && L[j].trim() === '') j++;
  return j;
}
/** Title = the non-empty lines after the heading, up to the next blank line. */
function titleAfter(L, i) {
  const j = nextNonEmpty(L, i);
  const t = [];
  let k = j;
  while (k < L.length && L[k].trim() !== '' && t.length < 3) t.push(L[k].trim()), k++;
  return { title: titleCase(t.join(' ')), body: k };
}
function findLine(L, re, from = 0) {
  for (let i = from; i < L.length; i++) if (re.test(L[i])) return i;
  return -1;
}
function lastLine(L, re) {
  for (let i = L.length - 1; i >= 0; i--) if (re.test(L[i])) return i;
  return -1;
}

const LAPLACE_TITLES = [
  'Introduction', 'Concerning Probability', 'General Principles of the Calculus of Probabilities', 'Concerning Hope',
  'Analytical Methods of the Calculus of Probabilities', 'Games of Chance',
  'Concerning the Unknown Inequalities which may Exist among Chances Supposed to be Equal',
  'Concerning the Laws of Probability which result from the Indefinite Multiplication of Events',
  'Application of the Calculus of Probabilities to Natural Philosophy',
  'Application of the Calculus of Probabilities to the Moral Sciences', 'Concerning the Probability of Testimonies',
  'Concerning the Selections and Decisions of Assemblies', 'Concerning the Probability of the Judgments of Tribunals',
  'Concerning Tables of Mortality, and the Mean Durations of Life, Marriage, and Some Associations',
  'Concerning the Benefits of Institutions which Depend upon the Probability of Events',
  'Concerning Illusions in the Estimation of Probabilities', 'Concerning the Various Means of Approaching Certainty',
  'Historical Notice of the Calculus of Probabilities to 1816',
];

function segment(id) {
  const L = lines[id];
  const heads = []; // {s, label, title, body}
  const simple = (from, to, re, labelFn) => {
    for (let i = from; i < to; i++) {
      const m = L[i].match(re);
      if (!m) continue;
      const { title, body } = titleAfter(L, i);
      heads.push({ s: i, label: labelFn(m), title, body });
    }
  };
  let end = L.length;
  switch (id) {
    case 58881: {
      const from = findLine(L, /^A PHILOSOPHICAL ESSAY ON PROBABILITIES\.$/);
      simple(from, L.length, /^CHAPTER ([IVXL]+)\.$/, (m) => m[1]);
      heads.forEach((h, k) => {
        h.title = LAPLACE_TITLES[k];
        h.part = k < 5 ? 'Part I' : 'Part II · Applications';
      });
      break;
    }
    case 57359: {
      const from = findLine(L, /^THE LOGIC OF CHANCE\.$/, 800);
      end = lastLine(L, /^INDEX\.$/);
      simple(from, end, /^CHAPTER ([IVXL]+)\.(?:\[\d+\])?$/, (m) => m[1]);
      break;
    }
    case 65274: {
      end = findLine(L, /BIBLIOGRAPHY OF PEIRCE’S PUBLISHED WRITINGS/);
      const intro = findLine(L, /^\s+INTRODUCTION$/, 200);
      heads.push({ s: intro, label: 'Intro', title: 'Introduction (by the editor, Morris R. Cohen)', body: intro + 1 });
      const proem = findLine(L, /^\s+PROEM$/);
      heads.push({ s: proem, label: 'Proem', title: 'Proem: The Rules of Philosophy', body: titleAfter(L, proem).body });
      for (let i = proem; i < end; i++) {
        let m = L[i].match(/^\s+(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH) PAPER$/);
        if (m) {
          const { title, body } = titleAfter(L, i);
          const n = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH', 'SIXTH'].indexOf(m[1]) + 1;
          heads.push({ s: i, label: `I.${n}`, title, body, part: 'Part I · Chance and Logic' });
          continue;
        }
        m = L[i].match(/^\s{6,}([IV]+)\. ([A-Z’ ]+?)(?:\[\d+\])?$/);
        if (m && i > 5000) {
          heads.push({ s: i, label: `II.${roman(m[1])}`, title: titleCase(m[2]), body: i + 1, part: 'Part II · Love and Chance' });
          continue;
        }
        if (/^\s+THE PRAGMATISM OF PEIRCE$/.test(L[i]) && i > 9000) {
          heads.push({ s: i, label: 'Dewey', title: 'Supplementary essay: The Pragmatism of Peirce (John Dewey)', body: i + 1 });
        }
      }
      break;
    }
    case 74864: {
      const from = findLine(L, /^CHAPTER I\.$/);
      end = lastLine(L, /^INDEX\.$/);
      let book = '';
      for (let i = from - 10; i < end; i++) {
        const b = L[i].match(/^BOOK ([IVX]+)\.$/);
        if (b) book = `Book ${b[1]}`;
        const m = L[i].match(/^CHAPTER ([IVXL]+)\.$/);
        if (m) {
          const { title, body } = titleAfter(L, i);
          heads.push({ s: i, label: m[1], title, body, part: book || 'Book I' });
        }
      }
      break;
    }
    case 39713: {
      const from = 1280;
      end = lastLine(L, /^INDEX$/);
      let work = '';
      let short = '';
      let bk = '';
      let workLine = -99;
      for (let i = from; i < end; i++) {
        const l = L[i];
        if (l === 'SCIENCE AND HYPOTHESIS') (work = 'Science and Hypothesis'), (short = 'S&H'), (bk = ''), (workLine = i);
        else if (l === 'THE VALUE OF SCIENCE') (work = 'The Value of Science'), (short = 'VS'), (bk = ''), (workLine = i);
        else if (l === 'SCIENCE AND METHOD') (work = 'Science and Method'), (short = 'S&M'), (bk = ''), (workLine = i);
        const b = l.match(/^BOOK ([IV]+)$/);
        if (b) bk = b[1];
        const m = l.match(/^CHAPTER ([IVXL]+)$/);
        if (m) {
          const { title, body } = titleAfter(L, i);
          heads.push({ s: i, label: `${short} ${bk ? bk + '.' : ''}${m[1]}`, title, body, part: work });
        } else if (l === 'INTRODUCTION' && work && i - workLine < 20) {
          const { body } = titleAfter(L, i);
          const by = /ROYCE/.test(L[i + 2] || '') ? ' by Josiah Royce' : '';
          heads.push({ s: i, label: `${short} Intro`, title: `Introduction${by}`, body, part: work });
        }
      }
      break;
    }
    case 5827: {
      end = findLine(L, /^BIBLIOGRAPHICAL NOTE$/);
      for (let i = 0; i < end; i++) {
        const m = L[i].match(/^CHAPTER ([IVXL]+)\. (.+)$/);
        if (m) heads.push({ s: i, label: m[1], title: titleCase(m[2]), body: i + 1 });
      }
      break;
    }
    case 9662: {
      end = lastLine(L, /^INDEX$/);
      simple(55, end, /^SECTION ([IVXL]+)\.$/, (m) => m[1]);
      break;
    }
    case 34901: {
      simple(440, L.length, /^CHAPTER ([IVXL]+)\.$/, (m) => m[1]);
      break;
    }
    case 1228: {
      end = lastLine(L, /^INDEX\.$/);
      simple(440, end, /^CHAPTER ([IVXL]+)\.$/, (m) => m[1]);
      break;
    }
  }
  heads.sort((a, b) => a.s - b.s);
  return heads.map((h, k) => {
    const e = k + 1 < heads.length ? heads[k + 1].s : end;
    let w = 0;
    for (let i = h.body; i < e; i++) w += words(L[i]);
    return { label: h.label, title: h.title, part: h.part, s: h.s, b: h.body, e, w };
  });
}

const structure = { generated: '2026-10-15', source: index.source, books: [] };
const segs = {};
for (const b of index.books) {
  const chapters = segment(b.id);
  segs[b.id] = chapters;
  structure.books.push({ id: b.id, t: b.t, a: b.a, y: b.y, words: chapters.reduce((a, c) => a + c.w, 0), chapters });
  console.log(`${b.id} ${b.a.split(' ').pop()}: ${chapters.length} chapters, ${chapters.reduce((a, c) => a + c.w, 0)} words`);
}

// ---------- verification helpers ----------
const report = { checked: 0, dropped: [] };
const paraCache = {};
function parasOf(id, chIdx) {
  const key = `${id}:${chIdx}`;
  if (!paraCache[key]) {
    const c = segs[id][chIdx];
    paraCache[key] = paragraphs(id, c.b, c.e);
  }
  return paraCache[key];
}
function locateIn(id, chIdx, quote) {
  const q = norm(quote);
  report.checked++;
  const p = parasOf(id, chIdx).find((p) => p.text.includes(q));
  return p ? p.line : null;
}
function locateAnywhere(id, quote) {
  const q = norm(quote);
  report.checked++;
  for (let k = 0; k < segs[id].length; k++) {
    const p = parasOf(id, k).find((p) => p.text.includes(q));
    if (p) return { ch: k, line: p.line };
  }
  return null;
}

// ---------- Laplace apparatus ----------
const LAP = 58881;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// Balanced answer positions: each of the four slots holds the answer 4 or 5 times.
const ANSWER_POS = Array.from({ length: CHAPTERS.length }, (_, i) => i % 4);
for (let i = ANSWER_POS.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [ANSWER_POS[i], ANSWER_POS[j]] = [ANSWER_POS[j], ANSWER_POS[i]];
}
const chapters = CHAPTERS.map((c) => {
  const k = c.n - 1;
  const seg = segs[LAP][k];
  const claims = c.claims
    .map((cl) => ({ ...cl, line: locateIn(LAP, k, cl.quote) }))
    .filter((cl) => cl.line !== null || (report.dropped.push(`ch${c.n} claim: ${cl.quote.slice(0, 60)}`), false));
  const notes = c.notes
    .map((n) => ({ ...n, line: locateIn(LAP, k, n.at) }))
    .filter((n) => n.line !== null || (report.dropped.push(`ch${c.n} note: ${n.at.slice(0, 60)}`), false));
  // Shuffle bet options deterministically (balanced answer positions); record where the answer went.
  const d = [1, 2, 3];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  const order = [...d];
  order.splice(ANSWER_POS[k], 0, 0);
  const bet = {
    q: c.bet.q,
    options: order.map((i) => c.bet.options[i]),
    answer: order.indexOf(0),
    authored: order, // authored index of each displayed option
    why: c.bet.why,
    quote: c.bet.quote,
    line: locateIn(LAP, k, c.bet.quote),
  };
  if (bet.line === null) report.dropped.push(`ch${c.n} bet quote: ${c.bet.quote.slice(0, 60)}`), (bet.quote = null);
  const lens = c.bet.options.map((o) => o.length);
  if (Math.max(...lens) - Math.min(...lens) > 30) console.warn(`  ch${c.n}: bet option lengths vary ${lens.join('/')}`);
  return { n: c.n, label: seg.label, title: seg.title, short: c.short, part: seg.part, gist: c.gist, summary: c.summary, claims, notes, bet };
});

// Printed pages (1902 Wiley edition, from its table of contents).
const START_PAGES = [1, 3, 11, 20, 26, 53, 56, 60, 73, 107, 109, 126, 132, 140, 149, 160, 176, 185];
const LAST_PAGE = 196;

// Example bets: convert authored weights to displayed order.
const example = EXAMPLE_BETS.map((e) => {
  const ch = chapters[e.n - 1];
  return { n: e.n, w: ch.bet.authored.map((i) => e.w[i]) };
});

// ---------- dog-ears ----------
const dogears = [];
for (const d of DOGEARS) {
  const at = locateIn(LAP, d.ch - 1, d.anchor);
  const src = locateAnywhere(d.book, d.excerpt);
  const src2 = d.excerpt2 ? locateAnywhere(d.book, d.excerpt2) : null;
  if (at === null || !src || (d.excerpt2 && !src2)) {
    report.dropped.push(`dog-ear ${d.book}: ${(at === null ? 'anchor ' : 'excerpt ') + (at === null ? d.anchor : d.excerpt).slice(0, 60)}`);
    continue;
  }
  dogears.push({ ...d, line: at, src: { ch: src.ch, line: src.line, line2: src2?.line } });
}

// Every mention of Laplace on the shelf (body text only), to show what was linked and what was not.
const mentions = [];
for (const b of index.books) {
  if (b.id === LAP) continue;
  segs[b.id].forEach((c, k) => {
    for (const p of parasOf(b.id, k)) {
      const re = /la ?place|essai philosophique/i;
      const m = re.exec(p.text);
      if (m) {
        const s = Math.max(0, p.text.lastIndexOf(' ', Math.max(0, m.index - 90)));
        const e = p.text.indexOf(' ', Math.min(p.text.length, m.index + 110));
        const snip = p.shown.slice(s, e < 0 ? undefined : e).trim(); // keeps the source's curly quotes
        // Linked if it is a dog-ear's paragraph, or a footnote within a few lines after one.
        const linked = dogears.some((d) => d.book === b.id && (p.line === d.src.line || p.line === d.src.line2 || (/^\[\d+\]/.test(p.text) && p.line > d.src.line && p.line - d.src.line < 30)));
        mentions.push({ book: b.id, ch: k, line: p.line, snip, linked });
      }
    }
  });
}
const mentionCounts = Object.fromEntries(index.books.filter((b) => b.id !== LAP).map((b) => [b.id, mentions.filter((m) => m.book === b.id).length]));

const laplace = {
  provenance: PROVENANCE,
  book: LAP,
  edition: 'Translated from the sixth French edition by F. W. Truscott and F. L. Emory (New York: Wiley, 1902). Project Gutenberg #58881.',
  pages: { start: START_PAGES, last: LAST_PAGE, note: 'Chapter start pages from the 1902 table of contents; pages within chapters interpolated by word count; the final page (196) is estimated.' },
  rates: { riffleSecPerPage: 2.5, wpm: 240, studyWpm: 120 },
  chapters,
  glossary: GLOSSARY,
  dogears,
  mentions,
  mentionCounts,
  example,
  verification: { checked: report.checked, dropped: report.dropped.length },
};

writeFileSync(join(OUT, 'structure.json'), JSON.stringify(structure));
writeFileSync(join(OUT, 'laplace.json'), JSON.stringify(laplace));
console.log(`\nquotes checked: ${report.checked}, dropped: ${report.dropped.length}`);
for (const d of report.dropped) console.log('  DROPPED ' + d);
console.log(`dog-ears kept: ${dogears.length}/${DOGEARS.length}; mentions on shelf: ${JSON.stringify(mentionCounts)}`);
console.log(`wrote ${join(OUT, 'structure.json')} and laplace.json`);
