// rp-consistency-types: the seven consistency types from
// apps/reasoning-processes/src/content/docs/proposals/consistency-evals.md
// laid out on the page's own two classifications:
//   rows    = how a Dutch book prices a violation (Notation section)
//   columns = how far published work covers the type ("What's covered and what's open")
// Each cell carries a glyph of the invariant with one example violation, computed here.
//
// Run: node compute.mjs   → writes figure.html and index.html next to this file.

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const f2 = (v) => v.toFixed(2).replace(/^0\./, '.');
const r1 = (v) => Math.round(v * 10) / 10;

// ---------------------------------------------------------------------------
// 1. Numbers behind each glyph
// ---------------------------------------------------------------------------

// Logical: the page's own example, P(A) = 0.7 and P(¬A) = 0.4.
// Selling a $1 contract on A at 0.7 and one on ¬A at 0.4 collects 1.1 and pays out exactly 1.
const logical = { pA: 0.7, pNotA: 0.4 };
logical.profit = logical.pA + logical.pNotA - 1; // guaranteed profit per $1 of payout

// Constraint (beyond binary): a distribution over a physically non-negative quantity.
// A normal belief with mean 1 and sd 0.6 puts Φ(−1/0.6) of its mass below the bound.
const erf = (x) => {
  // Abramowitz & Stegun 7.1.26, |error| < 1.5e-7
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const Phi = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
const constraint = { mu: 0.9, sd: 0.6, bound: 0 };
constraint.tail = Phi((constraint.bound - constraint.mu) / constraint.sd);

// Temporal: deadline-bounded question, P0 = 0.6 now, constant hazard.
// Martingale + constant hazard ⇒ while nothing happens, P(t) = 1 − exp(−λ(T − t)),
// since E[P(t+dt)] = λdt·1 + (1 − λdt)·P_nonews(t+dt) must equal P(t).
const temporal = { P0: 0.6 };
temporal.lamT = -Math.log(1 - temporal.P0);
temporal.path = (u) => 1 - Math.exp(-temporal.lamT * (1 - u)); // u = t/T
temporal.asks = [0, 0.25, 0.5, 0.75];                            // a stuck forecaster: 0.6 every time
temporal.gapAt = 0.75;
temporal.gap = temporal.P0 - temporal.path(temporal.gapAt);
// check the martingale property of the no-news path numerically
{
  const u = 0.3, du = 1e-4, lam = temporal.lamT; // per unit of T
  const e = lam * du * 1 + (1 - lam * du) * temporal.path(u + du);
  if (Math.abs(e - temporal.path(u)) > 1e-7) throw new Error('no-news path is not a martingale');
}

// Repeatability: the same question asked six times.
const repeat = { asks: [0.31, 0.42, 0.47, 0.55, 0.61, 0.7] };
repeat.range = Math.max(...repeat.asks) - Math.min(...repeat.asks);

// Method: three independent routes to one quantity (90% intervals, log scale).
const method = {
  rows: [
    { label: 'MC', lo: 1.9, hi: 4.4 },
    { label: 'analytic', lo: 2.5, hi: 3.7 },
    { label: 'Fermi', lo: 5.8, hi: 13.5 },
  ],
};
for (const r of method.rows) r.mid = Math.sqrt(r.lo * r.hi); // geometric midpoint
method.consensus = Math.sqrt(method.rows[0].mid * method.rows[1].mid);
method.ratio = method.rows[2].mid / method.consensus;

// Contextual: one question and a paraphrase.
const contextual = { q: 0.62, q2: 0.44 };
contextual.shift = contextual.q - contextual.q2;

// Evidential: conservation of expected evidence.
// Prior P(H) = 0.30; evidence e with P(e|H) = 0.8, P(e|¬H) = 0.2 → P(e) = 0.38.
const evidential = { prior: 0.3, peH: 0.8, peNotH: 0.2 };
evidential.pe = evidential.prior * evidential.peH + (1 - evidential.prior) * evidential.peNotH;
evidential.coherent = {
  plus: (evidential.prior * evidential.peH) / evidential.pe,
  minus: (evidential.prior * (1 - evidential.peH)) / (1 - evidential.pe),
};
evidential.coherentAvg = evidential.pe * evidential.coherent.plus + (1 - evidential.pe) * evidential.coherent.minus;
// An over-reacting model states posteriors 0.80 and 0.20 for the same prior and P(e).
evidential.stated = { plus: 0.8, minus: 0.2 };
evidential.statedAvg = evidential.pe * evidential.stated.plus + (1 - evidential.pe) * evidential.stated.minus;
evidential.gap = evidential.statedAvg - evidential.prior;
if (Math.abs(evidential.coherentAvg - evidential.prior) > 1e-12) throw new Error('CoEE check failed');

// ---------------------------------------------------------------------------
// 2. The page's classifications
// ---------------------------------------------------------------------------

// Rows: "The Dutch-book characterization is exact for logical and constraint checks, extends to
// temporal checks via dynamic books, reaches paraphrase and repeatability only through a trusted
// equivalence judge …, and is a looser metaphor for method and evidential consistency."
const ROWS = [
  { id: 'exact', label: 'Dutch book: exact' },
  { id: 'dynamic', label: 'Dutch book: a dynamic book, across time' },
  { id: 'judge', label: 'Dutch book: only via a trusted equivalence judge' },
  { id: 'metaphor', label: 'Dutch book: a loose metaphor' },
];
// Columns: "Largely covered" / "Partially covered" / "Open" bullets.
const COLS = [
  { id: 'covered', label: 'Largely covered', short: 'Largely covered' },
  { id: 'partial', label: 'Partially covered', short: 'Partially covered' },
  { id: 'open', label: 'Open', short: 'Open: not yet scored' },
];

const TYPES = [
  { n: 1, name: 'Repeatability', row: 'judge', col: 'partial', formula: ['Var[M(Q)] over n runs = 0'], narrow: ['Var[M(Q)] = 0', 'across n runs'], glyph: gRepeat },
  { n: 2, name: 'Logical', row: 'exact', col: 'covered', formula: ['P(A) + P(¬A) = 1'], glyph: gLogical },
  { n: 3, name: 'Constraint', row: 'exact', col: 'open', formula: ['X ≥ 0 physically ⇒ P(X < 0) = 0'], narrow: ['X ≥ 0 physically', '⇒ P(X < 0) = 0'], glyph: gConstraint },
  { n: 4, name: 'Temporal', row: 'dynamic', col: 'partial', formula: ['E[tomorrow’s P] = today’s P'], narrow: ['E[tomorrow’s P]', '= today’s P'], glyph: gTemporal },
  { n: 5, name: 'Method', row: 'metaphor', col: 'open', formula: ['Monte Carlo ≈ analytic ≈ Fermi'], narrow: ['Monte Carlo ≈ analytic', '≈ Fermi'], glyph: gMethod },
  { n: 6, name: 'Contextual', row: 'judge', col: 'covered', formula: ['M(Q) = M(Q′), Q′ a paraphrase'], narrow: ['M(Q) = M(Q′),', 'Q′ a paraphrase'], glyph: gContextual },
  { n: 7, name: 'Evidential', row: 'metaphor', col: 'covered', formula: ['prior = Σ P(e) · P(H | e)'], narrow: ['prior =', 'Σ P(e) · P(H | e)'], glyph: gEvidential },
];

// ---------------------------------------------------------------------------
// 3. Glyphs. Each draws in a local box (0,0)–(w,h). Grammar:
//    ink (text colour) = the model's answers; grey = what consistency requires;
//    thin brackets with numbers = the size of the violation.
// ---------------------------------------------------------------------------

const GH = 84; // glyph height
const n = (v) => Math.round(v * 10) / 10;
const T = (x, y, s, cls = 'gl', anchor = 'start') => `<text x="${n(x)}" y="${n(y)}" class="${cls}" text-anchor="${anchor}">${s}</text>`;
const L = (x1, y1, x2, y2, cls) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" class="${cls}"/>`;
const C = (cx, cy, r, cls = 'dot') => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" class="${cls}"/>`;
const hBracket = (x1, x2, y, dir) => `<path d="M${n(x1)} ${n(y + 5 * dir)}V${n(y)}H${n(x2)}V${n(y + 5 * dir)}" class="br"/>`;
const vBracket = (x, y1, y2, dir) => `<path d="M${n(x + 5 * dir)} ${n(y1)}H${n(x)}V${n(y2)}H${n(x + 5 * dir)}" class="br"/>`;
// Centre a label on cx but keep it inside [0, w].
const fitLabel = (cx, y, s, w, approx) => {
  const half = approx / 2;
  if (cx - half < 0) return T(0, y, s, 'gl', 'start');
  if (cx + half > w) return T(w, y, s, 'gl', 'end');
  return T(cx, y, s, 'gl', 'middle');
};
const approxW = (s, px = 14.5) => s.length * px * 0.56;

function gRepeat(w) {
  const x = (v) => 6 + v * (w - 12);
  const y = 62;
  const lo = Math.min(...repeat.asks), hi = Math.max(...repeat.asks);
  const lab = `range ${f2(repeat.range)}`;
  return [
    L(x(0), y, x(1), y, 'hair'), L(x(0), y - 4, x(0), y + 4, 'hair'), L(x(1), y - 4, x(1), y + 4, 'hair'),
    hBracket(x(lo), x(hi), 44, 1),
    fitLabel((x(lo) + x(hi)) / 2, 36, lab, w, approxW(lab)),
    ...repeat.asks.map((v) => C(x(v), y, 4)),
    T(x(0), 80, 'six asks of the same Q', 'gl muted', 'start'),
  ].join('');
}

function gLogical(w) {
  const x = (v) => 6 + v * (w - 12);
  const { pA, pNotA, profit } = logical;
  const lab = `sure profit ${f2(profit).replace(/0$/, '')}`;
  return [
    L(x(0), 22, x(0), 58, 'req'), L(x(1), 22, x(1), 58, 'req'),
    T(x(0) + 4, 16, `P(A) ${f2(pA).replace(/0$/, '')}`, 'gl', 'start'),
    T(x(1) - 4, 16, `P(¬A) ${f2(pNotA).replace(/0$/, '')}`, 'gl', 'end'),
    `<rect x="${n(x(0))}" y="26" width="${n(x(pA) - x(0))}" height="7" class="bar"/>`,
    `<rect x="${n(x(1 - pNotA))}" y="39" width="${n(x(1) - x(1 - pNotA))}" height="7" class="bar"/>`,
    L(x(1 - pNotA), 24, x(1 - pNotA), 48, 'hairdash'), L(x(pA), 24, x(pA), 48, 'hairdash'),
    hBracket(x(1 - pNotA), x(pA), 56, -1),
    fitLabel((x(1 - pNotA) + x(pA)) / 2, 74, lab, w, approxW(lab)),
  ].join('');
}

function gConstraint(w) {
  const lo = -1.0, hi = 2.8;
  const x = (v) => 4 + ((v - lo) / (hi - lo)) * (w - 8);
  const base = 60, peak = 24;
  const dens = (v) => Math.exp(-((v - constraint.mu) ** 2) / (2 * constraint.sd ** 2));
  const y = (v) => base - (base - peak) * dens(v);
  const N = 80; const pts = [];
  for (let i = 0; i <= N; i++) { const v = lo + (i / N) * (hi - lo); pts.push([x(v), y(v)]); }
  const curve = 'M' + pts.map(([a, b]) => `${n(a)} ${n(b)}`).join('L');
  const tailPts = pts.filter(([a]) => a <= x(0) + 1e-9);
  const tail = `M${n(x(lo))} ${base}L` + tailPts.map(([a, b]) => `${n(a)} ${n(b)}`).join('L') + `L${n(x(0))} ${n(y(0))}L${n(x(0))} ${base}Z`;
  const pct = (constraint.tail * 100).toFixed(1) + '%';
  return [
    `<path d="${tail}" class="tail"/>`,
    L(x(lo), base, x(hi), base, 'hair'),
    `<path d="${curve}" class="ink"/>`,
    L(x(0), 10, x(0), base + 4, 'req'),
    T(x(0) + 5, 18, 'bound', 'gl req-t', 'start'),
    T(x(0) + 5, 78, `${pct} of belief below 0`, 'gl', 'start').replace(`x="${n(x(0) + 5)}"`, `x="0"`),
  ].join('');
}

function gTemporal(w) {
  const x = (u) => 6 + u * (w - 22);
  const y = (P) => 64 - P * 54;
  const N = 60; const pts = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(`${n(x(u))} ${n(y(temporal.path(u)))}`); }
  const ug = temporal.gapAt;
  const lab = f2(temporal.gap);
  return [
    L(x(0), 66, x(1), 66, 'hair'), L(x(1), 62, x(1), 70, 'hair'),
    `<path d="M${pts.join('L')}" class="req"/>`,
    T(x(0), 84, 'if no news', 'gl req-t', 'start'),
    ...temporal.asks.map((u) => C(x(u), y(temporal.P0), 4)),
    vBracket(x(ug) + 8, y(temporal.P0), y(temporal.path(ug)), -1),
    T(x(ug) + 12, (y(temporal.P0) + y(temporal.path(ug))) / 2 + 5, lab, 'gl', 'start'),
    T(x(1), 84, 'deadline', 'gl muted', 'end'),
  ].join('');
}

function gMethod(w) {
  const lo = Math.log(1.7), hi = Math.log(14);
  const x0 = 62;
  const x = (v) => x0 + ((Math.log(v) - lo) / (hi - lo)) * (w - x0 - 4);
  const rows = method.rows.map((r, i) => ({ ...r, y: 16 + i * 20 }));
  const out = [];
  for (const r of rows) {
    out.push(T(0, r.y + 5, r.label, 'gl', 'start'));
    out.push(L(x(r.lo), r.y, x(r.hi), r.y, 'ink2'));
    out.push(C(x(r.mid), r.y, 3.5));
  }
  const lab = `${r1(method.ratio)}× apart`;
  out.push(hBracket(x(method.consensus), x(rows[2].mid), 66, -1));
  out.push(fitLabel((x(method.consensus) + x(rows[2].mid)) / 2, 82, lab, w, approxW(lab)));
  return out.join('');
}

function gContextual(w) {
  const x0 = 26;
  const x = (v) => x0 + v * (w - x0 - 6);
  const yQ = 22, yQ2 = 46;
  const lab = `shift ${f2(contextual.shift)}`;
  return [
    T(0, yQ + 5, 'Q', 'gl', 'start'), T(0, yQ2 + 5, 'Q′', 'gl', 'start'),
    L(x(0), yQ, x(1), yQ, 'hair'), L(x(0), yQ2, x(1), yQ2, 'hair'),
    L(x(contextual.q), yQ, x(contextual.q), 60, 'hairdash'), L(x(contextual.q2), yQ2, x(contextual.q2), 60, 'hairdash'),
    C(x(contextual.q), yQ, 4.5), C(x(contextual.q2), yQ2, 4.5),
    hBracket(x(contextual.q2), x(contextual.q), 64, -1),
    fitLabel((x(contextual.q) + x(contextual.q2)) / 2, 82, lab, w, approxW(lab)),
  ].join('');
}

function gEvidential(w) {
  const x = (v) => 8 + v * (w - 16);
  const ay = 50;
  const k = 11; // radius scale: area ∝ P(e)
  const rPlus = k * Math.sqrt(evidential.pe), rMinus = k * Math.sqrt(1 - evidential.pe);
  const tri = (cx, cls) => `<path d="M${n(cx)} ${ay + 2}L${n(cx - 6)} ${ay + 13}L${n(cx + 6)} ${ay + 13}Z" class="${cls}"/>`;
  return [
    L(x(0), ay, x(1), ay, 'hair'),
    C(x(evidential.stated.minus), ay - rMinus - 1, rMinus),
    C(x(evidential.stated.plus), ay - rPlus - 1, rPlus),
    T(x(evidential.stated.minus), ay - 2 * rMinus - 6, 'if ¬e', 'gl muted', 'middle'),
    T(x(evidential.stated.plus), ay - 2 * rMinus - 6, 'if e', 'gl muted', 'middle'),
    tri(x(evidential.prior), 'reqfill'),
    tri(x(evidential.statedAvg), 'inkfill'),
    T(x(evidential.prior) - 9, ay + 13, 'prior', 'gl req-t', 'end'),
    T(x(evidential.statedAvg) + 9, ay + 13, 'average', 'gl', 'start'),
    hBracket(x(evidential.prior), x(evidential.statedAvg), ay + 20, -1),
    T((x(evidential.prior) + x(evidential.statedAvg)) / 2, ay + 34, f2(evidential.gap), 'gl', 'middle'),
  ].join('');
}

// ---------------------------------------------------------------------------
// 4. Layouts
// ---------------------------------------------------------------------------

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CLAIM = 'The seven consistency types, each drawn as the invariant it tests with one example violation. Published evals cover three types and part of two more; the two open types sit at opposite ends of the Dutch-book scale: constraint consistency, which a book prices exactly, and method consistency, which it prices only as a metaphor.';

function wide() {
  const W = 720, colW = 240, pad = 16, gw = colW - 2 * pad;
  const headH = 34, bandH = 28, cellH = 140, rowGap = 0;
  const out = [];
  // column heads
  COLS.forEach((c, i) => {
    out.push(T(i * colW + pad, 20, c.label, c.id === 'open' ? 'head accent' : 'head', 'start'));
  });
  let y = headH;
  const rowY = {};
  ROWS.forEach((r) => {
    rowY[r.id] = y;
    out.push(L(0, y + 0.5, W, y + 0.5, 'rule'));
    out.push(T(pad, y + 21, r.label, 'band', 'start'));
    y += bandH + cellH + rowGap;
  });
  const H = y + 8;
  // open column frame
  out.unshift(`<rect x="${2 * colW + 4}" y="2" width="${colW - 8}" height="${H - 6}" rx="6" class="openframe"/>`);
  for (const t of TYPES) {
    const ci = COLS.findIndex((c) => c.id === t.col);
    const cx = ci * colW + pad, cy = rowY[t.row] + bandH;
    out.push(`<g class="cell" transform="translate(${cx} ${cy})">`);
    out.push(T(0, 18, `${t.n}  ${t.name}`, 'name', 'start'));
    t.formula.forEach((line, k) => out.push(T(0, 40 + k * 18, esc(line), 'formula', 'start')));
    out.push(`<g transform="translate(0 50)">${t.glyph(gw)}</g>`);
    out.push('</g>');
  }
  return { W, H, body: out.join('\n') };
}

function narrow() {
  const W = 343, gw = 158, tx = 174;
  const out = [];
  let y = 0;
  // legend at top
  out.push(T(0, 16, 'Grouped by how exactly a Dutch book', 'band', 'start'));
  out.push(T(0, 36, 'prices a violation.', 'band', 'start'));
  y = 52;
  for (const r of ROWS) {
    const items = TYPES.filter((t) => t.row === r.id).sort((a, b) => COLS.findIndex((c) => c.id === a.col) - COLS.findIndex((c) => c.id === b.col));
    out.push(L(0, y + 0.5, W, y + 0.5, 'rule'));
    const lab = r.label.replace('Dutch book: ', '');
    out.push(T(0, y + 22, lab.charAt(0).toUpperCase() + lab.slice(1), 'band', 'start'));
    y += 34;
    for (const t of items) {
      const col = COLS.find((c) => c.id === t.col);
      out.push(`<g transform="translate(0 ${y})">`);
      out.push(`<g transform="translate(0 6)">${t.glyph(gw)}</g>`);
      out.push(T(tx, 18, `${t.n}  ${t.name}`, 'name', 'start'));
      const lines = t.narrow || t.formula;
      lines.forEach((line, k) => out.push(T(tx, 40 + k * 19, esc(line), 'formula', 'start')));
      out.push(T(tx, 40 + lines.length * 19 + 4, col.short, col.id === 'open' ? 'formula accent' : 'formula muted', 'start'));
      out.push('</g>');
      y += 104;
    }
    y += 6;
  }
  return { W, H: y, body: out.join('\n') };
}

const STYLE = `
<style>
.rp-ct{margin:1.75rem 0;
  --ct-text:#2e2c28;--ct-muted:#5f5b53;--ct-line:#8f897e;--ct-hair:#d6d1c7;--ct-bg:#ffffff;--ct-accent:#2a57a6}
:root[data-theme="dark"] .rp-ct{--ct-text:#dcd7cd;--ct-muted:#a7a195;--ct-line:#8f897e;--ct-hair:#45423c;--ct-bg:#161514;--ct-accent:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .rp-ct{--ct-text:#dcd7cd;--ct-muted:#a7a195;--ct-line:#8f897e;--ct-hair:#45423c;--ct-bg:#161514;--ct-accent:#9dbdf2}}
.rp-ct svg{display:block;width:100%;height:auto;overflow:visible;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.rp-ct .ct-narrow{display:none}
@media (max-width:600px){.rp-ct .ct-wide{display:none}.rp-ct .ct-narrow{display:block}}
.rp-ct text{fill:var(--ct-text)}
.rp-ct .head{font-size:15px;font-weight:600}
.rp-ct .band{font-size:14.5px;fill:var(--ct-muted)}
.rp-ct .name{font-size:15px;font-weight:600}
.rp-ct .formula{font-size:14.5px}
.rp-ct .gl{font-size:14.5px}
.rp-ct .muted{fill:var(--ct-muted)}
.rp-ct .accent{fill:var(--ct-accent)}
.rp-ct .req-t{fill:var(--ct-muted)}
.rp-ct .rule{stroke:var(--ct-hair);stroke-width:1}
.rp-ct .hair{stroke:var(--ct-hair);stroke-width:1.25;fill:none}
.rp-ct .hairdash{stroke:var(--ct-line);stroke-width:1;stroke-dasharray:2 3;fill:none}
.rp-ct .req{stroke:var(--ct-line);stroke-width:1.5;fill:none}
.rp-ct .reqfill{fill:var(--ct-line)}
.rp-ct .ink{stroke:var(--ct-text);stroke-width:1.5;fill:none}
.rp-ct .ink2{stroke:var(--ct-text);stroke-width:2;fill:none;stroke-linecap:round}
.rp-ct .inkfill{fill:var(--ct-text)}
.rp-ct .bar{fill:var(--ct-text)}
.rp-ct .dot{fill:var(--ct-text);stroke:var(--ct-bg);stroke-width:1.25}
.rp-ct .tail{fill:var(--ct-text);fill-opacity:.35}
.rp-ct .br{stroke:var(--ct-text);stroke-width:1;fill:none}
.rp-ct .openframe{fill:none;stroke:var(--ct-accent);stroke-width:1.25;stroke-dasharray:4 4}
.rp-ct figcaption{font-size:.95rem;line-height:1.55;color:var(--ct-muted);margin-top:.75rem}
</style>`;

function figure() {
  const a = wide(), b = narrow();
  const aria = esc(CLAIM);
  const svg = (o, cls) => `<svg class="${cls}" viewBox="0 0 ${o.W} ${o.H}" role="img" aria-label="${aria}">\n${o.body}\n</svg>`;
  const legend = 'In each glyph, solid marks are the model’s answers, grey marks are what consistency requires, and the bracketed number is the size of the violation (the shaded tail is belief the bound rules out). Repeatability, contextual and method values are illustrative; the others are computed from the page’s example or stated inputs.';
  return `${STYLE}
<figure class="rp-ct">
${svg(a, 'ct-wide')}
${svg(b, 'ct-narrow')}
<figcaption>${esc(CLAIM.replace(/^The seven consistency types, each drawn as the invariant it tests with one example violation\. /, ''))} ${esc(legend)}</figcaption>
</figure>`;
}

const fig = figure();
writeFileSync(join(here, 'figure.html'), fig + '\n');

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Consistency Types</title>
<style>
:root{--t:#2e2c28;--m:#5f5b53;--bg:#ffffff;--a:#2a57a6}
:root[data-theme="dark"]{--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--t:#dcd7cd;--m:#a7a195;--bg:#161514;--a:#9dbdf2}}
body{margin:0;background:var(--bg);color:var(--t);font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:46rem;margin:0 auto;padding:2rem 16px 3rem}
h1{font-size:1.15rem;font-weight:600;margin:0 0 1rem;color:var(--m)}
h2{font-size:1.3rem;font-weight:600;margin:1.6rem 0 .6rem}
p,ul{margin:0 0 1rem}
a{color:var(--a)}
</style></head><body><main>
<h1>Consistency Evaluations</h1>
<p>Consistency is a spectrum, not a binary. Two answers to equivalent questions will rarely be identical; the right move is to measure the gap (e.g., Jensen–Shannon divergence between two distributions — symmetric, as the relation is) and track it. The Dutch-book characterization is exact for logical and constraint checks, extends to temporal checks via dynamic books, reaches paraphrase and repeatability only through a trusted equivalence judge (itself part of the trusted base), and is a looser metaphor for method and evidential consistency.</p>
<h2>What’s covered and what’s open</h2>
<p>Mapping the seven types against published work:</p>
<ul>
<li><strong>Largely covered.</strong> Logical consistency (Paleka et al.’s negation/and/or/conditional checks, with the arbitrage metric); evidential consistency in substantial part (their conservation-of-expected-evidence check; Bayes-rule coherence tests); paraphrase invariance (one of their ten checks; see also ParaRel and semantic consistency work).</li>
<li><strong>Partially covered.</strong> Temporal consistency (Fluri et al. ran temporal-monotonicity checks, and the conservation-of-expected-evidence check is a one-step martingale test; martingale drift as a standing regression test is not benchmarked); repeatability (LLM probability judgments show human-like systematic incoherence — Zhu &amp; Griffiths 2024 — but variance is not yet integrated into forecasting evals as a scored metric).</li>
<li><strong>Open.</strong> Constraint consistency beyond binary probabilities — full distributions, physical bounds, conservation laws, cross-estimate inequalities (published checks handle binary event probabilities only); method consistency (Monte Carlo vs. analytic vs. independent Fermi decompositions), which we have not seen scored anywhere — the nearest work, chain-of-thought vs. program-aided answer agreement, improves answers rather than scoring disagreement; adversarial question generation (explicitly deferred as future work by Paleka et al.); and progressive property testing, below.</li>
</ul>
${fig}
<h2>Generating test questions</h2>
<p>Four escalating strategies: …</p>
</main></body></html>
`;
writeFileSync(join(here, 'index.html'), page);

// Print the numbers so NOTES.md can quote them.
console.log(JSON.stringify({
  logicalProfit: logical.profit,
  constraintTail: constraint.tail,
  temporal: { lamT: temporal.lamT, pathAtGap: temporal.path(temporal.gapAt), gap: temporal.gap },
  repeatRange: repeat.range,
  method: { mids: method.rows.map((r) => r.mid), consensus: method.consensus, ratio: method.ratio },
  contextualShift: contextual.shift,
  evidential: { pe: evidential.pe, coherent: evidential.coherent, statedAvg: evidential.statedAvg, gap: evidential.gap },
}, null, 1));
