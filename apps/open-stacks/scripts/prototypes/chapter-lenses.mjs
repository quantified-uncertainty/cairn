#!/usr/bin/env node
/**
 * Chapter Lenses: build the data behind prototypes/chapter-lenses.html.
 *
 *   node scripts/prototypes/chapter-lenses.mjs
 *
 * Writes public/prototypes/data/chapter-lenses/:
 *
 *   chapters.json   Chapter index for the nine full texts in data/texts/ (start and
 *                   end line, label, title, word count). Headings are found by
 *                   per-book regexes (CHAPTER / SECTION / essay titles) and were
 *                   checked by hand against each book's table of contents.
 *   lenses/<id>.json  The four precomputed lens specs, validated. Sources are the
 *                   hand-checked JSON files in scripts/prototypes/chapter-lenses/
 *                   (written by Claude, October 2026: AI-generated content). For every
 *                   leaf element this script:
 *                     - finds each anchor ("src" string) verbatim in the chapter text
 *                       (exact substring match after collapsing whitespace) and stores
 *                       its line range; an anchor that fails drops its element;
 *                     - parses every LiveCalculation / WorkedExample expression with a
 *                       small exact-rational evaluator (no eval) and records whether
 *                       the author's printed number agrees with the recomputation.
 *   lenses/index.json  List of lenses with their verification summaries.
 *   land.json       World land outline (Natural Earth 1:110m via the world-atlas npm
 *                   package, public domain / ISC) as one SVG path in an equirectangular
 *                   0..360 x 0..180 frame, for the MapOfPlaces component.
 *
 * Re-run after editing a source spec or re-fetching the texts. The page re-verifies
 * every anchor at runtime as well, so a stale line hint is caught there too.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEXTS = join(APP, 'public/prototypes/data/texts');
const OUT = join(APP, 'public/prototypes/data/chapter-lenses');
const SRC = join(APP, 'scripts/prototypes/chapter-lenses');
const PROVENANCE = 'Precomputed by Claude, October 2026 (AI-generated; spot-check before relying on it)';

mkdirSync(join(OUT, 'lenses'), { recursive: true });

// ---------------------------------------------------------------- chapter index

const index = JSON.parse(readFileSync(join(TEXTS, 'index.json'), 'utf-8'));
const LINES = {};
for (const b of index.books) LINES[b.id] = readFileSync(join(TEXTS, `${b.id}.txt`), 'utf-8').split('\n');

const clean = (s) => s.replace(/_/g, '').replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').replace(/[.\s]+$/, '').trim();
const titleCase = (s) => {
  const small = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'upon', 'with', 'from', 'its', 'into']);
  return s.toLowerCase().split(' ').map((w, i) => (i > 0 && small.has(w) ? w : w.replace(/^(\W*)(\w)/, (m, p, c) => p + c.toUpperCase()))).join(' ')
    .replace(/\bA Priori\b/g, 'a priori');
};
/** Title = the following non-blank lines up to the next blank line (at most 3). */
function nextTitle(lines, i) {
  let j = i + 1;
  while (j < lines.length && !lines[j].trim()) j++;
  const parts = [];
  while (j < lines.length && lines[j].trim() && parts.length < 3) parts.push(lines[j].trim()), j++;
  return clean(parts.join(' '));
}
/** Generic scan: every line in [from, to) matching re starts a chapter. */
function scan(lines, { from, to, re, label, title }) {
  const out = [];
  for (let i = from; i < to; i++) {
    const m = lines[i].match(re);
    if (m) out.push({ start: i + 1, n: label(m), title: title ? title(m, i) : titleCase(nextTitle(lines, i)) });
  }
  return out;
}
const at = (lines, line, n, title) => ({ start: line, n, title });

const SPLIT = {
  58881: (L) => scan(L, { from: 160, to: L.length, re: /^CHAPTER ([IVXL]+)\.$/, label: (m) => `Ch. ${m[1]}` }),
  57359: (L) => [
    at(L, 67, 'Preface', 'Preface to the First Edition'),
    at(L, 315, 'Preface', 'Preface to the Second Edition'),
    at(L, 400, 'Preface', 'Preface to the Third Edition'),
    ...scan(L, { from: 860, to: 18243, re: /^CHAPTER ([IVXL]+)\.(\[\d+\])?$/, label: (m) => `Ch. ${m[1]}` }),
  ],
  65274: (L) => [
    at(L, 223, 'Intro.', 'Introduction (Morris R. Cohen)'),
    at(L, 1037, 'Proem', 'The Rules of Philosophy'),
    at(L, 1126, 'I.1', 'The Fixation of Belief'),
    at(L, 1801, 'I.2', 'How to Make Our Ideas Clear'),
    at(L, 2565, 'I.3', 'The Doctrine of Chances'),
    at(L, 3162, 'I.4', 'The Probability of Induction'),
    at(L, 3852, 'I.5', 'The Order of Nature'),
    at(L, 4569, 'I.6', 'Deduction, Induction, and Hypothesis'),
    at(L, 5251, 'II.1', 'The Architecture of Theories'),
    at(L, 5834, 'II.2', 'The Doctrine of Necessity Examined'),
    at(L, 6464, 'II.3', 'The Law of Mind'),
    at(L, 7481, 'II.4', 'Man’s Glassy Essence'),
    at(L, 8290, 'II.5', 'Evolutionary Love'),
    at(L, 9194, 'Suppl.', 'The Pragmatism of Peirce (John Dewey)'),
  ],
  74864: (L) => scan(L, { from: 1800, to: 31478, re: /^CHAPTER ([IVXL]+)\.$/, label: (m) => `Ch. ${m[1]}` }),
  39713: (L) => {
    const work = (from, to, abbr) => [
      ...scan(L, { from, to, re: /^(INTRODUCTION)$/, label: () => `${abbr} Intro.`, title: () => 'Introduction' }).slice(0, 1),
      ...scan(L, { from, to, re: /^CHAPTER ([IVXL]+)$/, label: (m) => `${abbr} ${m[1]}` }),
    ];
    const sm = [];
    // Science and Method numbers chapters within four books.
    let book = '';
    for (let i = 14286; i < 21626; i++) {
      const b = L[i].match(/^BOOK ([IV]+)$/);
      if (b) book = b[1];
      if (i === 14295) sm.push({ start: i + 1, n: 'S&M Intro.', title: 'Introduction' });
      const m = L[i].match(/^CHAPTER ([IVXL]+)$/);
      if (m) sm.push({ start: i + 1, n: `S&M ${book}.${m[1]}`, title: titleCase(nextTitle(L, i)) });
    }
    return [...work(1284, 8298, 'S&H'), ...work(8298, 14285, 'VoS'), ...sm];
  },
  5827: (L) => [
    at(L, 9, 'Preface', 'Preface'),
    ...scan(L, { from: 20, to: 3960, re: /^CHAPTER ([IVXL]+)\. (.+)$/, label: (m) => `Ch. ${m[1]}`, title: (m) => titleCase(clean(m[2])) }),
  ],
  9662: (L) => scan(L, { from: 55, to: 5259, re: /^SECTION ([IVXL]+)\.$/, label: (m) => `Sect. ${m[1]}` }),
  34901: (L) => scan(L, { from: 450, to: L.length, re: /^CHAPTER ([IVX]+)\.$/, label: (m) => `Ch. ${m[1]}` }),
  1228: (L) => [
    at(L, 285, 'Intro.', 'Introduction'),
    ...scan(L, { from: 450, to: 14589, re: /^CHAPTER ([IVX]+)\.$/, label: (m) => `Ch. ${m[1]}` }),
  ],
};
const END = { 57359: 18243, 65274: 9508, 74864: 31478, 39713: 21626, 5827: 3960, 9662: 5259, 1228: 14589 };

const chapterIndex = { source: index.source, fetched: index.fetched, note: 'Line numbers are 1-based lines of data/texts/<id>.txt.', books: [] };
for (const b of index.books) {
  const L = LINES[b.id];
  const chs = SPLIT[b.id](L).sort((x, y) => x.start - y.start);
  const last = END[b.id] || L.length;
  chs.forEach((c, i) => {
    c.end = i + 1 < chs.length ? chs[i + 1].start - 1 : last;
    while (c.end > c.start && !L[c.end - 1].trim()) c.end--;
    c.words = L.slice(c.start - 1, c.end).join(' ').split(/\s+/).filter(Boolean).length;
    c.key = `${b.id}:${c.start}`;
  });
  chapterIndex.books.push({ id: b.id, t: b.t, a: b.a, y: b.y, file: b.file, chapters: chs.map(({ key, n, title, start, end, words }) => ({ key, n, title, start, end, words })) });
  console.log(`${b.id} ${b.t}: ${chs.length} chapters`);
}
writeFileSync(join(OUT, 'chapters.json'), JSON.stringify(chapterIndex));

// ---------------------------------------------------------------- anchors

/** Whitespace-normalized view of a string with a map back to original offsets. */
function normView(s) {
  let n = '', map = [], sp = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/\s/.test(c)) { if (!sp && n.length) { n += ' '; map.push(i); } sp = true; }
    else { n += c; map.push(i); sp = false; }
  }
  return { n, map };
}
const normQ = (q) => q.replace(/\s+/g, ' ').trim();
function lineOf(starts, off) { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= off) lo = m; else hi = m - 1; } return lo; }

function makeScope(bookId, start, end) {
  const L = LINES[bookId];
  const text = L.slice(start - 1, end).join('\n');
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return { text, starts, first: start, view: normView(text) };
}
function locate(scope, q) {
  const nq = normQ(q);
  if (nq.length < 8) return { ok: false, why: 'anchor too short' };
  const i = scope.view.n.indexOf(nq);
  if (i < 0) return { ok: false, why: 'not found verbatim' };
  const again = scope.view.n.indexOf(nq, i + 1);
  const a = scope.view.map[i], b = scope.view.map[i + nq.length - 1] + 1;
  return { ok: true, L: [scope.first + lineOf(scope.starts, a), scope.first + lineOf(scope.starts, b - 1)], dup: again >= 0 };
}

// ---------------------------------------------------------------- exact rationals

const babs = (x) => (x < 0n ? -x : x);
const gcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a || 1n; };
const R = (n, d = 1n) => { if (d === 0n) throw new Error('division by zero'); if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
const add = (x, y) => R(x.n * y.d + y.n * x.d, x.d * y.d);
const sub = (x, y) => R(x.n * y.d - y.n * x.d, x.d * y.d);
const mul = (x, y) => R(x.n * y.n, x.d * y.d);
const div = (x, y) => R(x.n * y.d, x.d * y.n);
const pow = (x, y) => {
  if (y.d !== 1n || babs(y.n) > 400n) throw new Error('exponent must be a whole number up to 400');
  let e = y.n, r = R(1n);
  const b = e < 0n ? div(R(1n), x) : x; e = babs(e);
  for (let i = 0n; i < e; i++) r = mul(r, b);
  return r;
};
const fromDec = (s) => { const [a, f = ''] = s.split('.'); return R(BigInt(a + f), 10n ** BigInt(f.length)); };
const toNum = (x) => Number(x.n) / Number(x.d);
const eq = (x, y) => x.n === y.n && x.d === y.d;
const cmp = (x, y) => { const d = x.n * y.d - y.n * x.d; return d > 0n ? 1 : d < 0n ? -1 : 0; };
const show = (x) => (x.d === 1n ? `${x.n}` : `${x.n}/${x.d}`);
const FUNCS = { digits: (x) => { if (x.d !== 1n) throw new Error('digits() needs a whole number'); return R(BigInt(babs(x.n).toString().length)); } };

function tokenize(s) {
  const t = [], re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*)|([-+*/^(),]))/y;
  s = s.replace(/[½⅓¼]/g, (c) => ({ '½': '(1/2)', '⅓': '(1/3)', '¼': '(1/4)' })[c]).replace(/×/g, '*').replace(/,(?=\d{3}\b)/g, '');
  let m;
  re.lastIndex = 0;
  while (re.lastIndex < s.length) {
    const before = re.lastIndex;
    if (!/\S/.test(s.slice(before))) break;
    m = re.exec(s);
    if (!m || m.index !== before) throw new Error(`unexpected character near "${s.slice(before, before + 8)}"`);
    t.push(m[1] ? { k: 'num', v: m[1] } : m[2] ? { k: 'id', v: m[2] } : { k: 'op', v: m[3] });
  }
  return t;
}
function parse(src) {
  const t = tokenize(src); let i = 0;
  const peek = () => t[i], take = () => t[i++];
  const expect = (v) => { const x = take(); if (!x || x.v !== v) throw new Error(`expected "${v}"`); };
  function expr() { let a = term(); while (peek() && (peek().v === '+' || peek().v === '-')) { const o = take().v; const b = term(); a = { o, a, b }; } return a; }
  function term() { let a = unary(); while (peek() && (peek().v === '*' || peek().v === '/')) { const o = take().v; const b = unary(); a = { o, a, b }; } return a; }
  function unary() { if (peek() && peek().v === '-') { take(); return { o: 'neg', a: unary() }; } return power(); }
  function power() { const a = prim(); if (peek() && peek().v === '^') { take(); return { o: '^', a, b: unary() }; } return a; }
  function prim() {
    const x = take();
    if (!x) throw new Error('unexpected end');
    if (x.k === 'num') return { k: 'num', v: fromDec(x.v) };
    if (x.k === 'id') {
      if (peek() && peek().v === '(') { take(); if (!FUNCS[x.v]) throw new Error(`function "${x.v}" is not allowed`); const a = expr(); expect(')'); return { f: x.v, a }; }
      return { k: 'id', v: x.v };
    }
    if (x.v === '(') { const e = expr(); expect(')'); return e; }
    throw new Error(`unexpected "${x.v}"`);
  }
  const e = expr();
  if (i < t.length) throw new Error(`unexpected "${t[i].v}"`);
  return e;
}
function evaluate(node, env) {
  if (node.k === 'num') return node.v;
  if (node.k === 'id') { if (!(node.v in env)) throw new Error(`unknown name "${node.v}"`); return env[node.v]; }
  if (node.f) return FUNCS[node.f](evaluate(node.a, env));
  if (node.o === 'neg') { const a = evaluate(node.a, env); return R(-a.n, a.d); }
  const a = evaluate(node.a, env), b = evaluate(node.b, env);
  return node.o === '+' ? add(a, b) : node.o === '-' ? sub(a, b) : node.o === '*' ? mul(a, b) : node.o === '/' ? div(a, b) : pow(a, b);
}
const ev = (s, env) => evaluate(parse(String(s)), env);

/** Compare an author's printed number with the recomputation. */
function judge(step, env) {
  const out = {};
  const val = ev(step.expr, env);
  out.value = show(val);
  if (step.stated == null) return { ...out, status: 'computed' };
  const st = ev(step.stated, {});
  const check = step.check || 'exact';
  let ok;
  if (check === 'exact') ok = eq(val, st);
  else if (check === 'min') ok = cmp(val, st) >= 0;
  else if (check === 'max') ok = cmp(val, st) <= 0;
  else if (check === 'approx') ok = Math.abs(toNum(val) - toNum(st)) / Math.abs(toNum(st)) <= (step.tol ?? 0.1);
  let status = ok ? (check === 'approx' ? 'approx' : 'ok') : 'differs';
  if (step.printed != null) {
    const pv = ev(step.printed, {});
    out.printedValue = show(pv);
    if (!eq(pv, st) && ok) status = 'misprint';
  }
  return { ...out, status };
}

// ---------------------------------------------------------------- spec validation

const KIT = {
  LiveCalculation: ['steps'], WorkedExample: ['tree'], ArgumentTree: ['nodes'], ClaimCard: ['cards'],
  Counterexample: ['cases'], CastList: ['people'], Timeline: ['events'], MapOfPlaces: ['places'],
  Glossary: ['terms'], BranchingDiagram: ['nodes'],
};

function validateSpec(spec) {
  const book = chapterIndex.books.find((b) => b.id === spec.book);
  const ch = book.chapters.find((c) => c.start === spec.chapter.start);
  if (!ch) throw new Error(`${spec.id}: no chapter starting at line ${spec.chapter.start}`);
  Object.assign(spec.chapter, { n: ch.n, title: ch.title, end: ch.end, words: ch.words, key: ch.key });
  const chScope = makeScope(spec.book, ch.start, ch.end);
  const bookScope = makeScope(spec.book, 1, LINES[spec.book].length);
  const stats = { anchors: 0, verified: 0, dropped: [], checks: { ok: 0, approx: 0, misprint: 0, differs: 0, computed: 0 } };

  const fixSrc = (arr, where) => {
    if (!Array.isArray(arr) || !arr.length) return null;
    const out = [];
    for (const a of arr) {
      const q = typeof a === 'string' ? a : a.q;
      const scope = typeof a === 'object' && a.scope === 'book' ? bookScope : chScope;
      stats.anchors++;
      const r = locate(scope, q);
      if (!r.ok) { stats.dropped.push(`${where}: ${r.why}: "${q.slice(0, 70)}"`); return null; }
      if (r.dup) console.warn(`  note ${spec.id} ${where}: anchor occurs more than once; first used: "${q.slice(0, 50)}"`);
      stats.verified++;
      out.push(scope === bookScope ? { q, L: r.L, scope: 'book' } : { q, L: r.L });
    }
    return out;
  };
  /** Verify `src` on each leaf in a list; drop leaves that fail. */
  const leaves = (list, where, extra) => (list || []).filter((x, i) => {
    const s = fixSrc(x.src, `${where}[${i}]`);
    if (!s) return false;
    x.src = s;
    if (extra && !extra(x, i)) return false;
    return true;
  });

  for (const [bi, blk] of spec.lenses.entries()) {
    const w = `${blk.type}#${bi}`;
    if (!KIT[blk.type]) throw new Error(`${spec.id}: unknown component ${blk.type}`);
    if (blk.src) blk.src = fixSrc(blk.src, `${w}.src`) || undefined;
    for (const extra of ['rings', 'scales']) if (blk[extra]) blk[extra] = leaves(blk[extra], `${w}.${extra}`);
    if (blk.type === 'LiveCalculation' || blk.type === 'WorkedExample') {
      const env = {};
      for (const p of blk.params || []) { env[p.id] = ev(p.value, env); if (p.src) p.src = fixSrc(p.src, `${w}.param ${p.id}`) || undefined; }
      if (blk.type === 'LiveCalculation') {
        blk.steps = leaves(blk.steps, `${w}.steps`, (s) => {
          const j = judge(s, env); env[s.id] = ev(s.expr, env);
          s.computed = j; stats.checks[j.status]++;
          if (s.erratum) s.erratum = fixSrc(s.erratum, `${w}.erratum`) || undefined;
          return true;
        });
      } else {
        const walk = (node, path) => {
          if (node.src) node.src = fixSrc(node.src, path) || undefined;
          if (node.stated != null) { const j = judge({ expr: node.n, stated: node.stated }, env); node.computed = j; stats.checks[j.status]++; }
          (node.children || []).forEach((c, i) => walk(c, `${path}.${i}`));
        };
        walk(blk.tree, `${w}.tree`);
        if (blk.answer) {
          blk.answer.src = fixSrc(blk.answer.src, `${w}.answer`) || undefined;
          const j = judge(blk.answer, env); blk.answer.computed = j; stats.checks[j.status]++;
        }
      }
    } else if (blk.type === 'ArgumentTree') {
      const walk = (nodes, path) => (nodes || []).filter((n, i) => {
        const s = fixSrc(n.src, `${path}[${i}]`);
        if (!s) return false;
        n.src = s; n.children = walk(n.children, `${path}[${i}]`);
        return true;
      });
      blk.nodes = walk(blk.nodes, `${w}.nodes`);
    } else if (blk.type === 'ClaimCard') {
      blk.cards = leaves(blk.cards, `${w}.cards`, (c, i) => { c.examples = leaves(c.examples, `${w}.cards[${i}].examples`); return true; });
    } else if (blk.type === 'Counterexample') {
      blk.cases = leaves(blk.cases, `${w}.cases`, (c, i) => { const r = fixSrc(c.ruleSrc, `${w}.cases[${i}].rule`); if (!r) return false; c.ruleSrc = r; return true; });
    } else {
      const key = KIT[blk.type][0];
      blk[key] = leaves(blk[key], `${w}.${key}`, (x, i) => {
        if (x.quoteCheck) {
          const qc = x.quoteCheck;
          const r = fixSrc([qc.quoted], `${w}.${key}[${i}].quoteCheck`);
          const o = qc.original && locate(makeScope(qc.original.book, 1, LINES[qc.original.book].length), qc.original.q);
          if (!r || !o || !o.ok) { stats.dropped.push(`${w}.${key}[${i}].quoteCheck: original not found`); delete x.quoteCheck; }
          else { qc.quoted = r[0]; qc.original.L = o.L; }
        }
        return true;
      });
    }
  }
  spec.verification = {
    date: new Date().toISOString().slice(0, 10),
    anchors: stats.anchors, verified: stats.verified, dropped: stats.dropped, checks: stats.checks,
    method: 'Each anchor must occur verbatim in the chapter text after collapsing whitespace; failing elements are dropped. Expressions are evaluated in exact rational arithmetic.',
  };
  spec.provenance = PROVENANCE;
  return spec;
}

// Cross-references carry an anchor ("q") inside another lens's chapter; check those too.
function checkXrefs(specs) {
  const byId = Object.fromEntries(specs.map((s) => [s.id, s]));
  const visit = (o, where) => {
    if (!o || typeof o !== 'object') return;
    if (o.xref && o.xref.q) {
      const t = byId[o.xref.lens];
      const r = t && locate(makeScope(t.book, t.chapter.start, t.chapter.end), o.xref.q);
      if (!r || !r.ok) { console.log(`  DROPPED xref in ${where}: "${o.xref.q.slice(0, 60)}"`); delete o.xref; }
      else o.xref.L = r.L;
    }
    for (const v of Object.values(o)) visit(v, where);
  };
  for (const s of specs) visit(s.lenses, s.id);
}

// Quoted fragments inside paraphrases ('...' or “...”) and each cast member's "as named"
// string must also occur in the book (case-insensitive, italics marks ignored). Warn if not.
// Cross-reference labels quote other books; their anchors are checked by checkXrefs().
function checkQuotedFragments(spec) {
  const L = LINES[spec.book];
  const norm = (t) => t.replace(/_/g, '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase().trim();
  const ch = norm(L.join('\n')); // the whole book: notes may quote the front matter
  const skip = /(^|\.)(q|L|expr|printed|stated|value|label)$|\.(src|ruleSrc|erratum|quoteCheck|xref)(\.|$)/;
  const visit = (o, path) => {
    if (typeof o === 'string') {
      if (skip.test(path) && !/\.(examples\.\d+|cards\.\d+)\.label$/.test(path)) return;
      for (const m of o.matchAll(/(?:^|[\s(])['‘“"]([^'’”"]{3,140})['’”"](?=[\s.,;:)!?]|$)/g)) {
        if (m[1].split(' ').length >= 2 && !ch.includes(norm(m[1]))) console.warn(`  QUOTE NOT IN TEXT ${path}: '${m[1]}'`);
      }
      if (path.endsWith('.as') && !ch.includes(norm(o))) console.warn(`  NAME NOT IN TEXT ${path}: '${o}'`);
      return;
    }
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) visit(v, `${path}.${k}`);
  };
  visit(spec.lenses, spec.id);
}

const lensList = [];
const built = [];
const files = readdirSync(SRC).filter((f) => f.endsWith('.json')).sort();
for (const f of files) {
  const raw = JSON.parse(readFileSync(join(SRC, f), 'utf-8'));
  if (raw.constructed) {
    // Hand-made bad spec for the validator demo: published unvalidated, so the page's
    // own runtime validator is what rejects it.
    writeFileSync(join(OUT, 'lenses', `${raw.id}.json`), JSON.stringify(raw, null, 1));
    console.log(`${raw.id}: constructed example, copied without validation`);
    continue;
  }
  const spec = validateSpec(raw);
  checkQuotedFragments(spec);
  built.push(spec);
  const v = spec.verification;
  console.log(`${spec.id}: ${v.verified}/${v.anchors} anchors verified; checks ${JSON.stringify(v.checks)}`);
  for (const d of v.dropped) console.log(`  DROPPED ${d}`);
  lensList.push({ id: spec.id, book: spec.book, chapter: spec.chapter, tab: spec.tab, verification: { anchors: v.anchors, verified: v.verified, checks: v.checks } });
}
checkXrefs(built);
for (const spec of built) writeFileSync(join(OUT, 'lenses', `${spec.id}.json`), JSON.stringify(spec, null, 1));
lensList.sort((a, b) => (a.tab?.order ?? 9) - (b.tab?.order ?? 9));
writeFileSync(join(OUT, 'lenses', 'index.json'), JSON.stringify({ provenance: PROVENANCE, lenses: lensList }, null, 1));

// ---------------------------------------------------------------- land outline

const LAND = join(OUT, 'land.json');
if (!existsSync(LAND)) {
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json');
  const topo = await res.json();
  const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
  const arcs = topo.arcs.map((arc) => { let x = 0, y = 0; return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
  const ring = (idx) => idx.flatMap((a, k) => { const pts = a >= 0 ? arcs[a] : arcs[~a].slice().reverse(); return k ? pts.slice(1) : pts; });
  let d = '';
  const geoms = topo.objects.land.geometries || [topo.objects.land];
  for (const g of geoms) {
    const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    for (const poly of polys) for (const r of poly) {
      const pts = ring(r);
      d += pts.map(([lon, lat], i) => `${i ? 'L' : 'M'}${(lon + 180).toFixed(1)} ${(90 - lat).toFixed(1)}`).join('') + 'Z';
    }
  }
  d = d.replace(/L(\S+) (\S+)(?=L\1 \2)/g, '');
  writeFileSync(LAND, JSON.stringify({ source: 'Natural Earth 1:110m land via world-atlas@2.0.2 (public domain / ISC)', frame: 'equirectangular; x = lon + 180, y = 90 - lat', d }));
  console.log(`land.json: ${d.length} chars`);
}
