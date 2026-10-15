// ee-kappa: data + SVG for the figure on concepts/measuring-an-evaluator ("Agreement, corrected for chance").
// Every number comes from the page (or the worked example it points to):
//   κ = (p_o − p_e)/(1 − p_e)                                   (measuring-an-evaluator)
//   p_e = π² + (1 − π)² when both raters say "yes" at rate π     ("0.8² + 0.2² = 68%")
//   worked example: expert renews 80%, raw agreement 70% → κ 0.06; at 50% → κ 0.40
//   peer-review κ ≈ 0.17; 50 audits; binomial half-width 1.96·√(a(1−a)/n)   (worked-example.md)
// Run: node compute.mjs  → prints numbers, checks them against the page, writes figure.html + index.html.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));

// ---------- model ----------
const pe = (p) => p * p + (1 - p) * (1 - p);
const po = (p, k) => pe(p) + k * (1 - pe(p));
const kap = (o, e) => (o - e) / (1 - e);
const KS = [0, 0.17, 0.4, 0.6, 0.8];
const N = 50, AGREE = 0.7, PI_W = 0.8;
const half = 1.96 * Math.sqrt(AGREE * (1 - AGREE) / N);
const ex = { pi: PI_W, po: AGREE, pe: pe(PI_W), k: kap(AGREE, pe(PI_W)), lo: AGREE - half, hi: AGREE + half };
ex.kLo = kap(ex.lo, ex.pe); ex.kHi = kap(ex.hi, ex.pe); // marginals held fixed: too wide, NOT used in labels
// κ's own 95% range at n = 50, simulated the way the page does it (both raters' "yes" rates estimated from the
// same 50 items, which move with p_o). True table at π = 0.8, p_o = 0.7: yes-yes 0.65, yes-no 0.15, no-yes 0.15, no-no 0.05.
function simKappa(cells, n, reps, seed) {
  let t = seed >>> 0; const rnd = () => { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  const cum = cells.map((_, i) => cells.slice(0, i + 1).reduce((a, b) => a + b, 0)); const ks = [];
  for (let r = 0; r < reps; r++) {
    const c = [0, 0, 0, 0];
    for (let i = 0; i < n; i++) { const u = rnd(); c[u < cum[0] ? 0 : u < cum[1] ? 1 : u < cum[2] ? 2 : 3]++; }
    const o = (c[0] + c[3]) / n, p1 = (c[0] + c[1]) / n, p2 = (c[0] + c[2]) / n, e = p1 * p2 + (1 - p1) * (1 - p2);
    if (e < 1) ks.push((o - e) / (1 - e));
  }
  ks.sort((a, b) => a - b); return [ks[Math.floor(0.025 * ks.length)], ks[Math.floor(0.975 * ks.length)]];
}
const yy = (AGREE + 2 * PI_W - 1) / 2; // yes-yes cell for equal marginals π and agreement p_o
[ex.sLo, ex.sHi] = simKappa([yy, PI_W - yy, PI_W - yy, AGREE - yy], N, 100000, 1);
const bal = { pi: 0.5, po: AGREE, k: kap(AGREE, pe(0.5)) };
// where the 70% line crosses the κ = 0.17 contour (π > 0.5)
const crossPi = (k, o) => { const e = (o - k) / (1 - k); return (2 + Math.sqrt(4 - 8 * (1 - e))) / 4; };
const cross17 = crossPi(0.17, AGREE);

const near = (x, y, t) => Math.abs(x - y) <= t;
const r2 = (x) => Math.round(x * 100) / 100;
const checks = [
  ['p_e(0.8) = 68%', near(pe(0.8), 0.68, 1e-9)],
  ['p_e(0.5) = 50%', near(pe(0.5), 0.5, 1e-9)],
  ['κ 0.17 needs 58.5% at 50%, 73% at 80%', near(po(0.5, 0.17), 0.585, 1e-9) && near(po(0.8, 0.17), 0.7344, 1e-3)],
  ['κ 0.4 needs 70% at 50%, 81% at 80%', near(po(0.5, 0.4), 0.70, 1e-9) && near(po(0.8, 0.4), 0.808, 1e-3)],
  ['70% at 80% → κ 0.06', r2(ex.k) === 0.06],
  ['70% at 50% → κ 0.40', r2(bal.k) === 0.4],
  ['±11 points at 80% agreement, n = 50 (page)', Math.round(100 * 1.96 * Math.sqrt(0.8 * 0.2 / 50)) === 11],
  ['simulated κ spread at n = 50 is about ±0.3 (page)', ex.sHi - ex.sLo > 0.5 && ex.sHi - ex.sLo < 0.65],
  ['paradox table row 1: 0.85, 0.50 → 0.70', r2(kap(0.85, 0.5)) === 0.7],
  ['paradox table row 2: 0.85, 0.9·0.85+0.1·0.15 → 0.32', r2(kap(0.85, 0.9 * 0.85 + 0.1 * 0.15)) === 0.32],
];
console.log(JSON.stringify({ ex, bal, half, cross17, curvesAt: Object.fromEntries([0.5, 0.6, 0.7, 0.8, 0.9, 0.95].map(p => [p, KS.map(k => r2(po(p, k) * 100) / 100)])) }, null, 1));
for (const [n, ok] of checks) console.log((ok ? 'ok   ' : 'FAIL ') + n);
if (checks.some(([, ok]) => !ok)) process.exit(1);

// ---------- drawing ----------
const f1 = (x) => (Math.round(x * 10) / 10).toString();
const pct = (x) => Math.round(x * 100) + '%';
const sgn = (x) => (x < 0 ? '−' : '') + Math.abs(r2(x)).toFixed(2);

function draw(v) {
  const { W, H, X0, X1, YT, YB, fs, id, labPi, kLab } = v;
  const PMAX = 0.995;
  const x = (p) => X0 + ((p - 0.5) / 0.5) * (X1 - X0);
  const y = (o) => YB - ((o - 0.5) / 0.5) * (YB - YT);
  const out = [];
  const P = (cls, d) => out.push(`<path class="${cls}" d="${d}"/>`);
  const T = (tx, ty, cls, s, anchor = 'start') => out.push(`<text x="${f1(tx)}" y="${f1(ty)}" class="${cls}" text-anchor="${anchor}">${s}</text>`);
  const curve = (k) => { let d = ''; for (let i = 0; i <= 120; i++) { const p = 0.5 + (PMAX - 0.5) * i / 120; d += (i ? 'L' : 'M') + f1(x(p)) + ' ' + f1(y(po(p, k))); } return d; };

  // gridlines + axes
  for (const o of [0.6, 0.7, 0.8, 0.9, 1.0]) P('ka-grid', `M${X0} ${f1(y(o))}H${X1}`);
  P('ka-axis', `M${X0} ${YT - 6}V${YB}H${X1}`);
  for (const o of [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) T(X0 - 8, y(o) + fs * 0.35, 'ka-m', pct(o), 'end');
  for (const p of v.xt) { P('ka-axis', `M${f1(x(p))} ${YB}V${YB + 5}`); T(x(p), YB + 5 + fs * 1.15, 'ka-m', pct(p), v.midTicks ? 'middle' : p === 0.5 ? 'start' : p === 1 ? 'end' : 'middle'); }

  // κ contours
  for (const k of KS) P(k === 0 ? 'ka-chance' : k === 0.17 ? 'ka-k ka-k17' : 'ka-k', curve(k));

  // same raw agreement line
  P('ka-same', `M${X0} ${f1(y(AGREE))}H${f1(x(ex.pi))}`);

  // contour labels (haloed, sitting on the curve)
  for (const [k, p, txt, dy] of kLab) T(x(p), y(po(p, k)) + (dy ?? fs * 0.35), 'ka-lab' + (k === 0 ? ' ka-m' : ''), txt, 'middle');

  // worked-example interval + point
  const cx = f1(x(ex.pi));
  P('ka-ci', `M${cx} ${f1(y(ex.lo))}V${f1(y(ex.hi))}M${f1(x(ex.pi) - 5)} ${f1(y(ex.lo))}h10M${f1(x(ex.pi) - 5)} ${f1(y(ex.hi))}h10`);
  out.push(`<circle class="ka-dot" cx="${f1(x(bal.pi))}" cy="${f1(y(bal.po))}" r="4.5"/>`);
  out.push(`<circle class="ka-dot-a" cx="${cx}" cy="${f1(y(ex.po))}" r="5"/>`);

  for (const a of v.notes(x, y)) out.push(a);
  return `<svg class="ka-svg ka-${id}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${ARIA}" style="font-size:${fs}px">\n${out.join('\n')}\n</svg>`;
}

const ARIA = `Chart of raw agreement against the share of items both raters call yes, from 50 to 100 percent. The chance-agreement curve p_e = pi squared plus (1 minus pi) squared rises from 50 percent to 100 percent, and the curves for kappa 0.17, 0.4, 0.6 and 0.8 sit above it and converge on it as the yes rate nears 100 percent. A horizontal line at 70 percent raw agreement runs from a balanced 50 percent yes rate, where it means kappa 0.40, to an 80 percent yes rate, where it means kappa 0.06. Fifty audits put a 95 percent interval of plus or minus 13 points on that 70 percent, and the kappa estimated from those 50 items could fall anywhere from about ${sgn(ex.sLo)} to ${sgn(ex.sHi)}.`;

const tl = (tx, ty, lines, lh, anchor = 'start') => `<text x="${f1(tx)}" y="${f1(ty)}" text-anchor="${anchor}">` + lines.map(([cls, s], i) => `<tspan x="${f1(tx)}"${i ? ` dy="${lh}"` : ''} class="${cls}">${s}</tspan>`).join('') + `</text>`;
const k = (s) => `<tspan font-style="italic">κ</tspan>${s}`;

const wide = {
  id: 'wide', W: 660, H: 418, X0: 54, X1: 640, YT: 46, YB: 352, fs: 15, xt: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  kLab: [[0.8, 0.66, k(' = 0.8')], [0.6, 0.66, k(' = 0.6')], [0.4, 0.88, k(' = 0.4')], [0.17, 0.6, k(' = 0.17, journal peer review')], [0, 0.66, 'chance, ' + k(' = 0')]],
  notes: (x, y) => [
    `<text x="4" y="20" class="ka-m">Raw agreement, p<tspan class="ka-sub" dy="4">o</tspan></text>`,
    `<text x="${54}" y="${352 + 50}" class="ka-m">Share of items each rater calls “yes”, π (both raters at the same rate)</text>`,
    tl(x(0.5) + 10, y(AGREE) + 21, [['ka-b', k(' = 0.40') + ' at a 50/50 split']], 19),
    `<text x="${f1(x(0.672))}" y="${f1(y(AGREE) - 8)}" class="ka-m">70% agreement</text>`,
    tl(x(ex.pi) + 16, y(0.66), [['ka-a ka-strong', 'Experts renew 80%: ' + k(` = ${ex.k.toFixed(2)}`)], ['ka-m', `50 audits: 70% ± ${Math.round(half * 100)} points;`], ['ka-m', `${k('')} from about ${sgn(ex.sLo)} to ${sgn(ex.sHi)}`]], 20),
  ],
};
const narrow = {
  id: 'narrow', W: 343, H: 470, X0: 44, X1: 326, midTicks: true, YT: 40, YB: 330, fs: 14, xt: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  kLab: [[0.8, 0.62, k(' 0.8')], [0.6, 0.62, k(' 0.6')], [0.4, 0.88, k(' 0.4')], [0.17, 0.62, k(' 0.17')], [0, 0.62, 'chance']],
  notes: (x, y) => [
    `<text x="2" y="18" class="ka-m">Raw agreement, p<tspan class="ka-sub" dy="4">o</tspan></text>`,
    `<text x="42" y="${330 + 44}" class="ka-m">Share of items each rater calls “yes”, π</text>`,
    tl(x(0.5) + 8, y(AGREE) + 19, [['ka-b', k(' = 0.40')]], 18),
    tl(x(ex.pi) + 12, y(0.645), [['ka-a ka-strong', k(` = ${ex.k.toFixed(2)}`)]], 18),
    tl(2, 330 + 80, [['ka-t', `Same 70% raw agreement: ${k(' = 0.40')} when`], ['ka-t', `raters split 50/50, ${k(` = ${ex.k.toFixed(2)}`)} at 80% “yes”.`], ['ka-m', `50 audits: 70% ± ${Math.round(half * 100)} points; ${k('')} about ${sgn(ex.sLo)} to ${sgn(ex.sHi)}.`]], 19),
  ],
};

const CAPTION = `The same raw agreement means very different things at different base rates. Each curve is the raw agreement needed for a given κ when both raters say “yes” at rate π; the bottom one is chance, π² + (1 − π)². At 70% agreement, κ is 0.40 when raters split 50/50 but only ${ex.k.toFixed(2)} in the <a href="/concepts/worked-example/#what-50-audits-buy">worked example</a>, where experts renew 80% of grants. Fifty audits put about ±${Math.round(half * 100)} points on that 70% (the bar), and the κ estimated from them could fall anywhere from about ${sgn(ex.sLo)} to ${sgn(ex.sHi)}: it cannot tell this pair of raters from chance. The picture is symmetric for π below 50%.`;

const STYLE = `<style>
.ka-fig {
  --ka-text: #2e2c28; --ka-muted: #5f5b53; --ka-lines: #8f897e; --ka-hair: #d6d1c7; --ka-bg: #ffffff; --ka-accent: #1f6e46;
  margin: 2rem 0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
:root[data-theme='dark'] .ka-fig { --ka-text: #dcd7cd; --ka-muted: #a7a195; --ka-lines: #8f897e; --ka-hair: #45423c; --ka-bg: #161514; --ka-accent: #7fd2a0; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .ka-fig { --ka-text: #dcd7cd; --ka-muted: #a7a195; --ka-lines: #8f897e; --ka-hair: #45423c; --ka-bg: #161514; --ka-accent: #7fd2a0; }
}
.ka-svg { display: block; width: 100%; height: auto; max-width: 660px; overflow: visible; font-family: inherit; }
.ka-narrow { display: none; max-width: 400px; }
@media (max-width: 34rem) { .ka-wide { display: none; } .ka-narrow { display: block; } }
.ka-svg text { fill: var(--ka-text); }
.ka-svg .ka-m { fill: var(--ka-muted); }
.ka-svg .ka-b { fill: var(--ka-text); font-weight: 600; }
.ka-svg .ka-a { fill: var(--ka-accent); }
.ka-strong { font-weight: 600; }
.ka-sub { font-size: 0.75em; }
.ka-svg .ka-lab { fill: var(--ka-text); paint-order: stroke; stroke: var(--ka-bg); stroke-width: 5px; stroke-linejoin: round; }
.ka-svg .ka-lab.ka-m { fill: var(--ka-muted); }
.ka-axis { fill: none; stroke: var(--ka-lines); stroke-width: 1; }
.ka-grid { fill: none; stroke: var(--ka-hair); stroke-width: 1; }
.ka-chance { fill: none; stroke: var(--ka-muted); stroke-width: 2; }
.ka-k { fill: none; stroke: var(--ka-lines); stroke-width: 1.25; }
.ka-k17 { stroke-dasharray: 5 4; }
.ka-same { fill: none; stroke: var(--ka-text); stroke-width: 1; stroke-dasharray: 2 4; }
.ka-ci { fill: none; stroke: var(--ka-accent); stroke-width: 2; stroke-linecap: round; }
.ka-dot { fill: var(--ka-text); stroke: var(--ka-bg); stroke-width: 2; }
.ka-dot-a { fill: var(--ka-accent); stroke: var(--ka-bg); stroke-width: 2; }
.ka-fig figcaption a { color: inherit; text-decoration: underline; }
.ka-fig figcaption { margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.55; color: var(--ka-muted); max-width: 40rem; }
</style>`;

const FIG = `${STYLE}
<figure class="ka-fig">
${draw(wide)}
${draw(narrow)}
<figcaption>${CAPTION}</figcaption>
</figure>
`;
writeFileSync(join(here, 'figure.html'), FIG);

const INDEX = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Measuring an Evaluator</title>
<style>
:root { --text: #2e2c28; --muted: #5f5b53; --bg: #ffffff; --accent: #1f6e46; }
:root[data-theme='dark'] { --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #7fd2a0; }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #7fd2a0; } }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 17px; line-height: 1.6; }
main { max-width: 45rem; margin: 0 auto; padding: 2.5rem 16px 3rem; }
h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 1.25rem; color: var(--muted); }
h2 { font-size: 1.375rem; margin: 0 0 0.75rem; }
p { margin: 0 0 1rem; }
a { color: var(--accent); }
.eq { text-align: center; font-style: italic; margin: 0 0 1rem; }
</style>
</head>
<body>
<main>
<h1>Measuring an Evaluator</h1>
<h2>Agreement, corrected for chance</h2>
<p>Raw agreement <i>p</i><sub>o</sub> is the share of items on which two raters give the same label. It is inflated by base rates: two raters who each independently say “yes” to 80% of items agree 0.8² + 0.2² = 68% of the time without looking. Cohen’s kappa subtracts the agreement expected from the raters’ own marginal rates, <i>p</i><sub>e</sub>, and rescales:</p>
<p class="eq">κ = (p<sub>o</sub> − p<sub>e</sub>) / (1 − p<sub>e</sub>)</p>
<p>so that chance scores 0 and perfect agreement 1 (Cohen 1960).</p>
${FIG}<p>Kappa has two well-known paradoxes (Feinstein &amp; Cicchetti 1990). Both follow from <i>p</i><sub>e</sub> depending on the marginals …</p>
</main>
</body>
</html>
`;
writeFileSync(join(here, 'index.html'), INDEX);
console.log('wrote figure.html, index.html');
