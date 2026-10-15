// ee-audit-pattern: the prediction–evaluation pattern drawn at the worked example's proportions,
// for concepts/techniques ("Prediction–evaluation systems").
// Numbers used, all from the wiki's own pages:
//   worked-example.md, design C: 1,000 grants; model $1 each; a hidden random 50 get two
//     independent expert reviews; expert review $600 → 50 × $600 = $30,000 per expert;
//     experts renew 80%; journal peer review κ ≈ 0.17; "a κ estimated from 50 audits has a
//     95% interval of about ±0.3"; "80% power takes about 300 audits".
//   techniques.md: random resolution, so each item counts with probability n/N.
// The κ ranges are simulated here from the 2×2 table (both raters at 80% "yes", true κ given),
// exactly the simulation the worked example describes.
// Run: node compute.mjs → prints numbers + checks, writes figure.html and index.html.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));

// ---------- numbers ----------
const N = 1000, NA = 50, COST_REVIEW = 600, COST_MODEL = 1, PI = 0.8, N_BIG = 300;
let seed = 20261015;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

function kappaRange(k, n, R = 40000) {
  const q = PI * (1 - PI);
  const c = [PI * PI + k * q, q * (1 - k), q * (1 - k), (1 - PI) ** 2 + k * q];
  const ks = [];
  for (let r = 0; r < R; r++) {
    const a = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) { const u = rnd(); a[u < c[0] ? 0 : u < c[0] + c[1] ? 1 : u < c[0] + c[1] + c[2] ? 2 : 3]++; }
    const po = (a[0] + a[3]) / n, ry = (a[0] + a[1]) / n, cy = (a[0] + a[2]) / n, pe = ry * cy + (1 - ry) * (1 - cy);
    if (pe < 1) ks.push((po - pe) / (1 - pe));
  }
  ks.sort((x, y) => x - y);
  const qt = (p) => ks[Math.floor(p * (ks.length - 1))];
  return { k, n, lo: qt(0.025), hi: qt(0.975) };
}
const KS = [0, 0.17, 0.4];
const ranges = { [NA]: KS.map((k) => kappaRange(k, NA)), [N_BIG]: KS.map((k) => kappaRange(k, N_BIG)) };

// which 50 of the 1,000 are audited (a seeded uniform draw without replacement)
const idx = [...Array(N).keys()];
for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
const audited = new Set(idx.slice(0, NA));

const usd = (x) => '$' + x.toLocaleString('en-US');
const auditCost = NA * COST_REVIEW, bigCost = N_BIG * COST_REVIEW;
const r2 = (x) => Math.round(x * 100) / 100;
const half50 = ranges[NA].map((r) => (r.hi - r.lo) / 2);
const checks = [
  ['50 × $600 = $30,000 (worked example)', auditCost === 30000],
  ['model on all 1,000 = $1,000', N * COST_MODEL === 1000],
  ['audit share 5% → 1 in 20', NA / N === 0.05],
  ['κ from 50 audits: ±≈0.3 (page "about ±0.3")', half50.every((h) => h > 0.25 && h < 0.35)],
  ['κ 0.17 vs κ 0 ranges overlap at 50 audits', ranges[NA][1].lo < ranges[NA][0].hi],
  ['ranges nearly separate at 300 audits', ranges[N_BIG][1].lo > 0],
];
console.log(JSON.stringify(ranges, (k, v) => typeof v === 'number' ? r2(v) : v, 1));
for (const [n, ok] of checks) console.log((ok ? 'ok   ' : 'FAIL ') + n);
if (checks.some(([, ok]) => !ok)) process.exit(1);

// ---------- drawing helpers ----------
const f1 = (x) => (Math.round(x * 10) / 10).toString();
const sgn = (x) => (x < 0 ? '−' : '') + Math.abs(r2(x)).toFixed(2);
const K = '<tspan font-style="italic">κ</tspan>';
const KS_ = (sub) => `${K}<tspan class="pe-sub" dy="4">${sub}</tspan><tspan dy="-4">&#8203;</tspan>`;
const tl = (tx, ty, lines, lh, anchor = 'start') => `<text x="${f1(tx)}" y="${f1(ty)}" text-anchor="${anchor}">` + lines.map(([cls, s], i) => `<tspan x="${f1(tx)}"${i ? ` dy="${lh}"` : ''} class="${cls}">${s}</tspan>`).join('') + `</text>`;
const arrowHead = (x, y, dir, cls) => {
  const d = { r: [[-7, -4], [-7, 4]], l: [[7, -4], [7, 4]], d: [[-4, -7], [4, -7]], u: [[-4, 7], [4, 7]] }[dir];
  return `<path class="${cls}" d="M${f1(x + d[0][0])} ${f1(y + d[0][1])}L${f1(x)} ${f1(y)}L${f1(x + d[1][0])} ${f1(y + d[1][1])}"/>`;
};

function field(x0, y0, pitch, cols) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const cx = x0 + (i % cols) * pitch + pitch / 2, cy = y0 + Math.floor(i / cols) * pitch + pitch / 2;
    out.push(audited.has(i) ? `<circle class="pe-aud" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(pitch * 0.4)}"/>` : `<circle class="pe-dot" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(pitch * 0.17)}"/>`);
  }
  return out.join('');
}

function chart(o, x0, x1, y0, rowH, labW, fs, short) {
  // κ axis from −0.3 to 0.8
  const KMIN = -0.3, KMAX = 0.8;
  const X = (k) => x0 + labW + (k - KMIN) / (KMAX - KMIN) * (x1 - x0 - labW);
  const names = short
    ? [`${K} 0, guessing`, `${K} 0.17, as good as a 2nd expert`, `${K} 0.40`]
    : [`true ${K} 0: a model that guesses`, `true ${K} 0.17: as good as a second expert`, `true ${K} 0.40`];
  let y = y0;
  const groups = [[NA, `${NA} audits (${usd(auditCost)} per expert)`], [N_BIG, `${N_BIG} audits (${usd(bigCost)} per expert)`]];
  const top = y0 - 4;
  let rowsEnd;
  for (const [n, title] of groups) {
    o.push(`<text x="${f1(x0)}" y="${f1(y + fs * 0.35)}" class="pe-b">${title}</text>`);
    y += short ? rowH + 10 : rowH;
    ranges[n].forEach((r, i) => {
      if (short) { o.push(`<text x="${f1(x0)}" y="${f1(y - 9)}" class="pe-m pe-halo">${names[i]}</text>`); }
      else o.push(`<text x="${f1(x0 + labW - 14)}" y="${f1(y + fs * 0.35)}" class="pe-m" text-anchor="end">${names[i]}</text>`);
      o.push(`<path class="pe-range" d="M${f1(X(r.lo))} ${f1(y)}H${f1(X(r.hi))}"/>`);
      o.push(`<path class="pe-cap" d="M${f1(X(r.lo))} ${f1(y - 5)}v10M${f1(X(r.hi))} ${f1(y - 5)}v10"/>`);
      o.push(`<circle class="pe-true" cx="${f1(X(r.k))}" cy="${f1(y)}" r="3.5"/>`);
      y += short ? rowH + 6 : rowH - 4;
    });
    y += short ? 6 : 10;
  }
  rowsEnd = y - (short ? 18 : 20);
  // reference lines at κ = 0 and 0.17
  o.unshift(`<path class="pe-hair" d="M${f1(X(0))} ${f1(top)}V${f1(rowsEnd)}M${f1(X(0.17))} ${f1(top)}V${f1(rowsEnd)}"/>`);
  // axis
  o.push(`<path class="pe-axis" d="M${f1(X(KMIN))} ${f1(rowsEnd + 6)}H${f1(X(KMAX))}"/>`);
  for (const t of [-0.2, 0, 0.2, 0.4, 0.6, 0.8]) {
    o.push(`<path class="pe-axis" d="M${f1(X(t))} ${f1(rowsEnd + 6)}v5"/>`);
    o.push(`<text x="${f1(X(t))}" y="${f1(rowsEnd + 11 + fs * 1.1)}" class="pe-m" text-anchor="middle">${t < 0 ? '−' + Math.abs(t).toFixed(1) : t.toFixed(1)}</text>`);
  }
  if (short) { o.push(tl(x0, rowsEnd + 11 + fs * 2.6, [['pe-m', `${K} one audit would report: 95% of`], ['pe-m', `audits land on the bar; dot = true ${K}`]], 19)); return rowsEnd + 11 + fs * 2.6 + 19; }
  o.push(`<text x="${f1(X(KMAX))}" y="${f1(rowsEnd + 11 + fs * 2.4)}" class="pe-m" text-anchor="end">${K} one audit would report: 95% of audits land on the bar; dot = true ${K}</text>`);
  return rowsEnd + 11 + fs * 2.4;
}

// ---------- wide ----------
function wide() {
  const W = 780, fs = 15, o = [];
  const GX = 0, GY = 58, P = 6.5, COLS = 40;           // 260 × 162.5
  const GW = COLS * P, GH = (N / COLS) * P;
  o.push(`<text x="${GX}" y="20" class="pe-b">The model scores all ${N.toLocaleString('en-US')} grants</text>`);
  o.push(`<text x="${GX}" y="40" class="pe-m">${usd(COST_MODEL)} each; ● = one grant</text>`);
  o.push(field(GX, GY, P, COLS));
  // experts
  const EX = 418, EW = 150, EH = 76, EA = 56, EB = 148;
  for (const [y, name, sub] of [[EA, 'Expert A', `${NA} reviews`], [EB, 'Expert B', `same ${NA}, blind`]]) {
    o.push(`<rect class="pe-box" x="${EX}" y="${y}" width="${EW}" height="${EH}" rx="3"/>`);
    o.push(tl(EX + 12, y + 24, [['pe-b', name], ['pe-m', sub], ['pe-m', usd(auditCost)]], 20));
  }
  // grid → experts: the hidden random 50
  const fx = GX + GW + 8, mx = 412;
  o.push(`<path class="pe-acc-line" d="M${fx} ${GY + GH / 2}H${mx}M${mx} ${EA + EH / 2}V${EB + EH / 2}M${mx} ${EA + EH / 2}H${EX - 2}M${mx} ${EB + EH / 2}H${EX - 2}"/>`);
  o.push(arrowHead(EX - 2, EA + EH / 2, 'r', 'pe-acc-line'), arrowHead(EX - 2, EB + EH / 2, 'r', 'pe-acc-line'));
  o.push(tl(fx + 4, GY + GH / 2 - 28, [['pe-a pe-strong', `hidden random ${NA}`], ['pe-a', `(${NA / N * 100}%, 1 in ${N / NA})`]], 19));
  // compare box
  const CX = 630, CW = 150, CY = 56, CH = 168;
  o.push(`<rect class="pe-box" x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="3"/>`);
  o.push(tl(CX + 12, CY + 24, [['pe-b', 'Compare'], ['pe-m', `model vs A: ${KS_('model')}`], ['pe-m', `B vs A: ${KS_('ceiling')}`]], 24));
  o.push(tl(CX + 12, CY + 24 + 24 * 3 + 6, [['pe-m', 'same sampling'], ['pe-m', 'error in each']], 19));
  // experts → compare
  for (const y of [EA + EH / 2, EB + EH / 2]) { o.push(`<path class="pe-line" d="M${EX + EW} ${y}H${CX - 2}"/>`, arrowHead(CX - 2, y, 'r', 'pe-line')); }
  o.push(`<text x="${(EX + EW + CX) / 2}" y="${EA + EH / 2 - 8}" class="pe-m" text-anchor="middle">verdicts</text>`);
  o.push(`<text x="${(EX + EW + CX) / 2}" y="${EB + EH / 2 - 8}" class="pe-m" text-anchor="middle">verdicts</text>`);
  // model's scores on the same 50 travel along the top
  const TY = 32;
  o.push(`<path class="pe-line" d="M${GX + GW - 40} ${GY - 6}V${TY}H${CX + CW / 2}V${CY - 2}"/>`, arrowHead(CX + CW / 2, CY - 2, 'd', 'pe-line'));
  o.push(`<text x="${(GX + GW + CX) / 2 + 30}" y="${TY - 8}" class="pe-m" text-anchor="middle">the model's scores on those 50</text>`);
  // feedback: compare → back under the field
  const BY = GY + GH + 30;
  o.push(`<path class="pe-line pe-dash" d="M${CX + CW / 2} ${CY + CH}V${BY}H${GX + GW / 2}V${GY + GH + 8}"/>`, arrowHead(GX + GW / 2, GY + GH + 8, 'u', 'pe-line'));
  o.push(tl(GX + GW / 2 + 12, BY + 22, [['pe-m', `verdict on all ${N.toLocaleString('en-US')} scores: is ${KS_('model')} near ${KS_('ceiling')}?`], ['pe-m', 'Re-measured every round; a drop means gaming or drift.']], 20));
  // chart
  const CY0 = BY + 96;
  o.push(`<path class="pe-hair" d="M0 ${CY0 - 34}H${W}"/>`);
  o.push(`<text x="0" y="${CY0 - 8}" class="pe-b">How precisely can the audit measure ${K}? Both raters renew ${PI * 100}%; simulated.</text>`);
  const yEnd = chart(o, 0, W, CY0 + 20, 26, 300, fs, false);
  const H = Math.ceil(yEnd + 8);
  return `<svg class="pe-svg pe-wide" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${ARIA}" style="font-size:${fs}px">\n${o.join('\n')}\n</svg>`;
}

// ---------- narrow ----------
function narrow() {
  const W = 343, fs = 14, o = [];
  const P = 7.5, COLS = 40, GX = 0, GY = 46;
  const GW = COLS * P, GH = (N / COLS) * P;
  o.push(`<text x="0" y="16" class="pe-b">The model scores all ${N.toLocaleString('en-US')} grants</text>`);
  o.push(`<text x="0" y="34" class="pe-m">${usd(COST_MODEL)} each; ● = one grant</text>`);
  o.push(field(GX, GY, P, COLS));
  // down arrow to experts
  const EY = GY + GH + 62, EH = 58, EW = 150, EA = 0, EB = 165;
  const ay = GY + GH + 6;
  o.push(`<path class="pe-acc-line" d="M${GW / 2} ${ay}V${ay + 24}M${EA + EW / 2} ${ay + 24}H${EB + EW / 2}M${EA + EW / 2} ${ay + 24}V${EY - 2}M${EB + EW / 2} ${ay + 24}V${EY - 2}"/>`);
  o.push(arrowHead(EA + EW / 2, EY - 2, 'd', 'pe-acc-line'), arrowHead(EB + EW / 2, EY - 2, 'd', 'pe-acc-line'));
  o.push(`<text x="${GW / 2 + 8}" y="${ay + 17}" class="pe-a pe-strong">hidden random ${NA} (${NA / N * 100}%)</text>`);
  for (const [x, name, sub] of [[EA, 'Expert A', `${NA} reviews, ${usd(auditCost)}`], [EB, 'Expert B', `same ${NA}, blind`]]) {
    o.push(`<rect class="pe-box" x="${x}" y="${EY}" width="${EW}" height="${EH}" rx="3"/>`);
    o.push(tl(x + 10, EY + 23, [['pe-b', name], ['pe-m', sub]], 19));
  }
  // compare
  const CY = EY + EH + 44, CW = 236, CH = 96;
  for (const x of [EA + EW / 2, EB + EW / 2]) { o.push(`<path class="pe-line" d="M${x} ${EY + EH}V${CY - 2}"/>`, arrowHead(x, CY - 2, 'd', 'pe-line')); }
  o.push(`<text x="${EA + EW / 2 + 8}" y="${EY + EH + 27}" class="pe-m">verdicts</text>`);
  o.push(`<text x="${EB + EW / 2 + 8}" y="${EY + EH + 27}" class="pe-m">verdicts</text>`);
  o.push(`<rect class="pe-box" x="0" y="${CY}" width="${CW}" height="${CH}" rx="3"/>`);
  o.push(tl(10, CY + 22, [['pe-b', 'Compare on the 50'], ['pe-m', `model vs A: ${KS_('model')}`], ['pe-m', `B vs A: ${KS_('ceiling')}`]], 23));
  // feedback along right margin
  const RX = W - 4;
  o.push(`<path class="pe-line pe-dash" d="M${CW} ${CY + CH / 2}H${RX}V${GY + GH / 2}H${GW + 8}"/>`, arrowHead(GW + 8, GY + GH / 2, 'l', 'pe-line'));
  o.push(tl(CW + 10, CY + CH / 2 + 22, [['pe-m', 'verdict on'], ['pe-m', `all ${N.toLocaleString('en-US')}`]], 18));
  o.push(tl(0, CY + CH + 24, [['pe-m', `The model's own scores on the 50 also go in.`], ['pe-m', `Re-measured every round; a drop in ${KS_('model')}`], ['pe-m', 'means gaming or drift.']], 19));
  // chart
  const CY0 = CY + CH + 112;
  o.push(`<path class="pe-hair" d="M0 ${CY0 - 34}H${W}"/>`);
  o.push(tl(0, CY0 - 10, [['pe-b', `How precisely can the audit`], ['pe-b', `measure ${K}? Both raters renew ${PI * 100}%.`]], 19));
  const yEnd = chart(o, 0, W, CY0 + 34, 30, 0, fs, true);
  const H = Math.ceil(yEnd + 8);
  return `<svg class="pe-svg pe-narrow" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${ARIA}" style="font-size:${fs}px">\n${o.join('\n')}\n</svg>`;
}

const R50 = ranges[NA], R300 = ranges[N_BIG];
const ARIA = `Diagram of the prediction–evaluation pattern at the worked example's scale. A field of 1,000 dots, one per grant, each scored by the model at $1. Fifty dots scattered at random are highlighted: the hidden audit sample, 1 in 20. Those 50 go to Expert A and, independently, to Expert B, at $30,000 each. Their verdicts and the model's scores on the same 50 are compared: model against A gives kappa model, B against A gives the ceiling. That comparison is the verdict on all 1,000 scores and is re-measured each round. Below, simulated 95 percent ranges of the kappa an audit would report, with both raters renewing 80 percent: with 50 audits, a guessing model ranges ${sgn(R50[0].lo)} to ${sgn(R50[0].hi)}, a model at kappa 0.17 ranges ${sgn(R50[1].lo)} to ${sgn(R50[1].hi)}, and at 0.40 ${sgn(R50[2].lo)} to ${sgn(R50[2].hi)}; the ranges overlap heavily. With 300 audits they shrink to ${sgn(R300[0].lo)} to ${sgn(R300[0].hi)}, ${sgn(R300[1].lo)} to ${sgn(R300[1].hi)}, and ${sgn(R300[2].lo)} to ${sgn(R300[2].hi)}.`;

const CAPTION = `Fifty audits measure the model, but not precisely enough to judge it when experts agree as weakly as in peer review. The model scores all 1,000 grants; a random 50, hidden from everyone, go to two experts, and the model–expert κ is compared with the expert–expert κ on the same 50. Each κ carries about ±0.3 of sampling error (bars, simulated with both raters renewing 80%), so 50 audits cannot tell a model that guesses (κ 0) from one as good as a second expert (κ 0.17). About 300 audits, ${usd(bigCost)} per expert at $600 a review, mostly separate them.`;

const STYLE = `<style>
.pe-fig {
  --pe-text: #2e2c28; --pe-muted: #5f5b53; --pe-lines: #8f897e; --pe-hair: #d6d1c7; --pe-bg: #ffffff; --pe-accent: #1f6e46;
  margin: 2rem 0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
:root[data-theme='dark'] .pe-fig { --pe-text: #dcd7cd; --pe-muted: #a7a195; --pe-lines: #8f897e; --pe-hair: #45423c; --pe-bg: #161514; --pe-accent: #7fd2a0; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .pe-fig { --pe-text: #dcd7cd; --pe-muted: #a7a195; --pe-lines: #8f897e; --pe-hair: #45423c; --pe-bg: #161514; --pe-accent: #7fd2a0; }
}
.pe-svg { display: block; width: 100%; height: auto; max-width: 780px; overflow: visible; font-family: inherit; }
.pe-narrow { display: none; max-width: 420px; }
@media (max-width: 36rem) { .pe-wide { display: none; } .pe-narrow { display: block; } }
.pe-svg text { fill: var(--pe-text); }
.pe-svg .pe-m { fill: var(--pe-muted); }
.pe-svg .pe-b { fill: var(--pe-text); font-weight: 600; }
.pe-svg .pe-a { fill: var(--pe-accent); }
.pe-svg .pe-halo { paint-order: stroke; stroke: var(--pe-bg); stroke-width: 5px; stroke-linejoin: round; }
.pe-strong { font-weight: 600; }
.pe-sub { font-size: 0.72em; }
.pe-dot { fill: var(--pe-lines); }
.pe-aud { fill: var(--pe-accent); }
.pe-box { fill: none; stroke: var(--pe-lines); stroke-width: 1; }
.pe-line { fill: none; stroke: var(--pe-lines); stroke-width: 1.25; }
.pe-dash { stroke-dasharray: 4 4; }
.pe-acc-line { fill: none; stroke: var(--pe-accent); stroke-width: 1.5; }
.pe-axis { fill: none; stroke: var(--pe-lines); stroke-width: 1; }
.pe-hair { fill: none; stroke: var(--pe-hair); stroke-width: 1; }
.pe-range { fill: none; stroke: var(--pe-text); stroke-width: 2; }
.pe-cap { fill: none; stroke: var(--pe-text); stroke-width: 1.25; }
.pe-true { fill: var(--pe-bg); stroke: var(--pe-text); stroke-width: 1.5; }
.pe-fig figcaption { margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.55; color: var(--pe-muted); max-width: 42rem; }
</style>`;

const FIG = `${STYLE}
<figure class="pe-fig">
${wide()}
${narrow()}
<figcaption>${CAPTION}</figcaption>
</figure>
`;
writeFileSync(join(here, 'figure.html'), FIG);

const md = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*([^*]+)\*/g, '<em>$1</em>');
const P1 = `Ask predictors to forecast a large set of items, say 10,000, and announce that a random subset, say 50, will be resolved by an expensive, trusted evaluation. Reward accuracy on that subset. Because no predictor knows which items will be graded, each must treat every item as if it might be. A small evaluation budget then calibrates forecasts across the whole set. What gets calibrated is agreement with the evaluator, errors included: predictors are paid to model the evaluator, not the truth.`;
const P2 = `The incentive thins as the set grows: with 50 of 10,000 resolved, each item has a 1-in-200 chance of counting. A proper scoring rule stays proper under random resolution, but the reward for effort on any one item falls by that factor.`;
const INDEX = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Prediction–evaluation pattern</title>
<style>
:root { --text:#2e2c28; --muted:#5f5b53; --bg:#ffffff; }
:root[data-theme='dark'] { --text:#dcd7cd; --muted:#a7a195; --bg:#161514; }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { --text:#dcd7cd; --muted:#a7a195; --bg:#161514; } }
body { margin:0; background:var(--bg); color:var(--text); font: 17px/1.6 ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
main { max-width: 48rem; margin: 0 auto; padding: 2rem 16px 3rem; }
h1 { font-size: 1rem; color: var(--muted); font-weight: 600; margin: 0 0 0.25rem; }
h2 { font-size: 1.5rem; margin: 0 0 1rem; }
</style></head><body><main>
<h1>Techniques</h1>
<h2>Prediction–evaluation systems</h2>
<p>${md(P1)}</p>
${FIG}
<p>${md(P2)}</p>
</main></body></html>
`;
writeFileSync(join(here, 'index.html'), INDEX);
console.log('wrote figure.html, index.html');
