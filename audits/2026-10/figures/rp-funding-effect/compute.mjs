// rp-funding-effect: data + SVG for the figure on case-studies/the-funding-effect.
// Every number comes from the page's own model and values:
//   LR'(s) = (α + s(1−α)) / (β + s(1−β))                       ("Spin attenuates")
//   observed LR = LR'(s) · r_H / r_¬H, flips once r_¬H/r_H > LR'(s)   ("A sign flip needs selection")
//   α = 0.8, β = 0.2, prior 0.5; Lundh RR 1.34 and Barnes & Bero OR 88 read as pure spin ("A worked number")
//   95% intervals from the page's table: RR 1.19–1.51, OR 16–477.
// The one value not on the page is the illustrative selection ratio r_¬H/r_H = 2.
// Run: node compute.mjs   → prints the numbers, checks them against the page, writes figure.html + index.html.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---------- model ----------
const A = 0.8, B = 0.2, PRIOR = 0.5;
const LR0 = A / B; // 4
const LRp = (s) => (A + s * (1 - A)) / (B + s * (1 - B));
const P0 = PRIOR * A + (1 - PRIOR) * B; // independent favorable rate = 0.5
const sFromRR = (rr) => (rr * P0 - P0) / (1 - P0);
const sFromOR = (or) => { const o = (or * P0) / (1 - P0); const p = o / (1 + o); return (p - P0) / (1 - P0); };
const weight = (s) => Math.log(LRp(s)) / Math.log(LR0); // share of log-odds weight kept
const RHO = 2; // illustrative selection ratio r_¬H / r_H (not on the page)

const lundh = { s: sFromRR(1.34), lo: sFromRR(1.19), hi: sFromRR(1.51) };
const tobacco = { s: sFromOR(88), lo: sFromOR(16), hi: sFromOR(477) };
for (const p of [lundh, tobacco]) { p.lr = LRp(p.s); p.w = weight(p.s); p.lrLo = LRp(p.hi); p.lrHi = LRp(p.lo); }
const sCross = (A - RHO * B) / (RHO * (1 - B) - (1 - A)); // where LR'(s) = RHO

// ---------- checks against the page text ----------
const near = (x, y, tol) => Math.abs(x - y) <= tol;
const checks = [
  ['Lundh s ≈ 0.34', near(lundh.s, 0.34, 0.005)],
  ['Lundh LR′ ≈ 1.8', near(lundh.lr, 1.8, 0.05)],
  ['Lundh keeps ≈ 44% of log-odds weight', near(lundh.w, 0.44, 0.005)],
  ['Passive smoking s ≈ 0.98', near(tobacco.s, 0.98, 0.005)],
  ['Passive smoking LR′ ≈ 1.01', near(tobacco.lr, 1.01, 0.005)],
  ['LR′(s) > 1 for all s < 1 (grid of α > β)', (() => {
    for (let i = 2; i < 100; i++) for (let j = 1; j < i; j++) for (let k = 0; k < 100; k++) {
      const a = i / 100, b = j / 100, s = k / 100;
      if ((a + s * (1 - a)) / (b + s * (1 - b)) <= 1) return false;
    }
    return true;
  })()],
  ['Lundh flips under r¬H/rH = 2 (2 > LR′)', lundh.lr / RHO < 1],
];
console.log(JSON.stringify({ LR0, P0, lundh, tobacco, RHO, sCross, lundhWithSelection: lundh.lr / RHO, tobaccoWithSelection: tobacco.lr / RHO }, null, 1));
for (const [name, ok] of checks) console.log((ok ? 'ok   ' : 'FAIL ') + name);
if (checks.some(([, ok]) => !ok)) process.exit(1);

// ---------- drawing ----------
const f1 = (x) => (Math.round(x * 10) / 10).toString();
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function frame(v) {
  const { X0, X1, YT, YB, LMIN, LMAX } = v;
  const x = (s) => X0 + s * (X1 - X0);
  const y = (L) => YB - ((Math.log(L) - Math.log(LMIN)) / (Math.log(LMAX) - Math.log(LMIN))) * (YB - YT);
  const path = (fn, s0, s1, n = 160) => {
    let d = '';
    for (let i = 0; i <= n; i++) { const s = s0 + ((s1 - s0) * i) / n; d += (i ? 'L' : 'M') + f1(x(s)) + ' ' + f1(y(fn(s))); }
    return d;
  };
  return { x, y, path };
}

// text helper: lines = [[text, cls]] or strings; first line baseline at y
function text(xp, yp, lines, { anchor = 'start', cls = 'fe-t', lh = 19 } = {}) {
  const arr = (Array.isArray(lines) ? lines : [lines]).map((l) => (Array.isArray(l) ? l : [l, '']));
  if (arr.length === 1) return `<text x="${f1(xp)}" y="${f1(yp)}" class="${cls} ${arr[0][1]}" text-anchor="${anchor}">${arr[0][0]}</text>`;
  return `<text x="${f1(xp)}" y="${f1(yp)}" class="${cls}" text-anchor="${anchor}">${arr
    .map(([t, c], i) => `<tspan x="${f1(xp)}" ${i ? `dy="${lh}"` : ''}${c ? ` class="${c}"` : ''}>${t}</tspan>`)
    .join('')}</text>`;
}

function arrowDown(xp, y1, y2, cls) {
  // vertical arrow from y1 down to y2 (y2 > y1), head at y2
  return `<path class="${cls}" d="M${f1(xp)} ${f1(y1)}V${f1(y2 - 1)}"/><path class="${cls}" d="M${f1(xp - 4.5)} ${f1(y2 - 8)}L${f1(xp)} ${f1(y2 - 1)}L${f1(xp + 4.5)} ${f1(y2 - 8)}"/>`;
}

function svg(v) {
  const { W, H, X0, X1, YT, YB, fs, id, aria } = v;
  const { x, y, path } = frame(v);
  const o = [];
  o.push(`<svg class="fe-svg fe-${id}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(aria)}" style="font-size:${fs}px">`);
  o.push(`<defs><clipPath id="fe-${id}-above"><rect x="0" y="0" width="${W}" height="${f1(y(1))}"/></clipPath><clipPath id="fe-${id}-below"><rect x="0" y="${f1(y(1))}" width="${W}" height="${f1(H - y(1))}"/></clipPath></defs>`);
  // region where a favorable conclusion counts against H
  o.push(`<rect class="fe-tint" x="${X0}" y="${f1(y(1))}" width="${X1 - X0}" height="${f1(YB - y(1))}"/>`);
  // axes
  o.push(`<path class="fe-axis" d="M${X0} ${YT - 6}V${YB}H${X1}"/>`);
  for (const L of [0.5, 1, 2, 4]) {
    o.push(`<path class="fe-axis" d="M${X0 - 5} ${f1(y(L))}H${X0}"/>`);
    o.push(text(X0 - 9, y(L) + fs * 0.35, L === 0.5 ? '0.5' : String(L), { anchor: 'end', cls: 'fe-t fe-m' }));
  }
  for (const s of v.xticks) {
    o.push(`<path class="fe-axis" d="M${f1(x(s))} ${YB}V${YB + 5}"/>`);
    o.push(text(x(s), YB + 5 + fs + 1, String(s), { anchor: s === 0 ? 'start' : s === 1 ? 'end' : 'middle', cls: 'fe-t fe-m' }));
  }
  // reference lines
  o.push(`<path class="fe-one" d="M${X0} ${f1(y(1))}H${X1}"/>`);
  o.push(`<path class="fe-ref" d="M${X0} ${f1(y(LR0))}H${X1}"/>`);
  // 95% interval stretches along the spin curve
  for (const p of [lundh, tobacco]) o.push(`<path class="fe-ci" d="${path(LRp, p.lo, p.hi, 60)}"/>`);
  // spin + selection (dashed): neutral above 1, accent below 1
  const sel = path((s) => LRp(s) / RHO, 0, 1);
  o.push(`<path class="fe-sel" clip-path="url(#fe-${id}-above)" d="${sel}"/>`);
  o.push(`<path class="fe-sel fe-sel-acc" clip-path="url(#fe-${id}-below)" d="${sel}"/>`);
  // spin only (solid)
  o.push(`<path class="fe-spin" d="${path(LRp, 0, 1)}"/>`);
  // selection arrow at Lundh's s
  o.push(arrowDown(x(lundh.s), y(lundh.lr) + 7, y(lundh.lr / RHO) - 5, 'fe-arrow'));
  // points
  o.push(`<circle class="fe-dot" cx="${f1(x(lundh.s))}" cy="${f1(y(lundh.lr))}" r="4.5"/>`);
  o.push(`<circle class="fe-dot" cx="${f1(x(tobacco.s))}" cy="${f1(y(tobacco.lr))}" r="4.5"/>`);
  o.push(`<circle class="fe-hollow" cx="${f1(x(lundh.s))}" cy="${f1(y(lundh.lr / RHO))}" r="4.5"/>`);
  // labels (positions per variant)
  for (const l of v.labels({ x, y })) o.push(l);
  o.push('</svg>');
  return o.join('\n');
}

const RR2 = 'r<tspan class="fe-sub" dy="4">¬H</tspan><tspan dy="-4">/r</tspan><tspan class="fe-sub" dy="4">H</tspan><tspan dy="-4"> = 2</tspan>';
const pct = Math.round(lundh.w * 100);
const lr1 = lundh.lr.toFixed(1);
const ARIA = `Line chart on a log scale. A funded favorable conclusion's likelihood ratio falls from 4 toward 1 as the spin rate s rises from 0 to 1 but never drops below 1. Lundh's drug-trial estimate, s about 0.34, leaves a ratio of about ${lr1}, ${pct} percent of the weight; the passive-smoking estimate, s about 0.98, leaves about 1.01. Selection that makes funders of failing products twice as likely to produce a favorable study halves every ratio, which pushes Lundh's point to about ${(lundh.lr / RHO).toFixed(2)}, below 1.`;

const wide = {
  id: 'wide', W: 640, H: 392, X0: 46, X1: 618, YT: 42, YB: 330, LMIN: 0.34, LMAX: 5, fs: 15,
  xticks: [0, 0.25, 0.5, 0.75, 1], aria: ARIA,
  labels: ({ x, y }) => [
    text(4, 20, 'Likelihood ratio of a funded favorable conclusion (log scale)', { cls: 'fe-t fe-m' }),
    text(x(0) + 2, 384, 'Spin rate s: share of would-be unfavorable conclusions reported favorable', { cls: 'fe-t fe-m' }),
    text(x(1), y(LR0) - 8, 'Independent study, or any pure multiplier: α/β = 4', { anchor: 'end', cls: 'fe-t fe-m' }),
    text(x(0.105), y(3.35), 'Spin only', { cls: 'fe-t fe-b' }),
    text(x(lundh.s) + 12, y(lundh.lr) - 34, [['Drug trials, Lundh RR 1.34', 'fe-b'], [`s ≈ ${lundh.s.toFixed(2)}, LR′ ≈ ${lr1}: ${pct}% of the weight`, 'fe-m']]),
    text(x(lundh.s) + 10, y(Math.sqrt(lundh.lr * lundh.lr / RHO)) + 5, '÷ 2 from selection', { cls: 'fe-t fe-m' }),
    text(x(lundh.s) - 11, y(lundh.lr / RHO) + 17, `With selection: ${(lundh.lr / RHO).toFixed(2)}`, { anchor: 'end', cls: 'fe-t fe-a' }),
    text(x(0) + 10, y(0.5) - 2, [['Below 1, a favorable', 'fe-a'], ['conclusion counts against H', 'fe-a']]),
    text(x(1), y(0.5) + 26, `Spin plus selection, ${RR2}`, { anchor: 'end', cls: 'fe-t fe-m' }),
    text(x(1), y(tobacco.lr) - 52, [['Passive smoking, OR 88', 'fe-b'], [`s ≈ ${tobacco.s.toFixed(2)}, LR′ ≈ ${tobacco.lr.toFixed(2)}`, 'fe-m']], { anchor: 'end' }),
  ],
};

const narrow = {
  id: 'narrow', W: 343, H: 384, X0: 34, X1: 334, YT: 40, YB: 338, LMIN: 0.34, LMAX: 5, fs: 14,
  xticks: [0, 0.5, 1], aria: ARIA,
  labels: ({ x, y }) => [
    text(2, 18, 'Likelihood ratio (log scale)', { cls: 'fe-t fe-m' }),
    text(x(0) + 2, 380, 'Spin rate s', { cls: 'fe-t fe-m' }),
    text(x(1), y(LR0) - 8, 'Independent study: 4', { anchor: 'end', cls: 'fe-t fe-m' }),
    text(x(0.14), y(3.0), 'Spin only', { cls: 'fe-t fe-b' }),
    text(x(lundh.s) + 10, y(lundh.lr) - 26, [['Lundh RR 1.34', 'fe-b'], [`LR′ ≈ ${lr1} (${pct}%)`, 'fe-m']], { lh: 17 }),
    text(x(lundh.s) + 9, y(Math.sqrt(lundh.lr * lundh.lr / RHO)) + 5, '÷ 2', { cls: 'fe-t fe-m' }),
    text(x(lundh.s) - 10, y(lundh.lr / RHO) + 16, (lundh.lr / RHO).toFixed(2), { anchor: 'end', cls: 'fe-t fe-a' }),
    text(x(0) + 7, y(0.5) + 4, [['Below 1:', 'fe-a'], ['counts against H', 'fe-a']], { lh: 17 }),
    text(x(1), y(0.5) + 24, `With selection, ${RR2}`, { anchor: 'end', cls: 'fe-t fe-m' }),
    text(x(1), y(tobacco.lr) - 42, [['OR 88', 'fe-b'], [`LR′ ≈ ${tobacco.lr.toFixed(2)}`, 'fe-m']], { anchor: 'end', lh: 17 }),
  ],
};

const CAPTION = `Spin alone weakens a funded favorable conclusion toward worthless but never past it; only selection on the truth can make it count against <em>H</em>. Curves use the page's illustration, α = 0.8 and β = 0.2 (LR = 4). Reading Lundh's RR of 1.34 as pure spin gives s ≈ ${lundh.s.toFixed(2)} and LR′ ≈ ${lr1}; if funders whose product fails were twice as likely to produce such a study (r<sub>¬H</sub>/r<sub>H</sub> = 2, an illustrative value), the same conclusion would count against <em>H</em>. Thick stretches span each estimate's 95% interval.`;

const STYLE = `<style>
.fe-fig {
  --fe-text: #2e2c28; --fe-muted: #5f5b53; --fe-lines: #8f897e; --fe-hair: #d6d1c7; --fe-bg: #ffffff;
  --fe-accent: #2a57a6; --fe-tint: rgba(42, 87, 166, 0.07);
  margin: 2rem 0; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
:root[data-theme='dark'] .fe-fig {
  --fe-text: #dcd7cd; --fe-muted: #a7a195; --fe-lines: #8f897e; --fe-hair: #45423c; --fe-bg: #161514;
  --fe-accent: #9dbdf2; --fe-tint: rgba(157, 189, 242, 0.08);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .fe-fig {
    --fe-text: #dcd7cd; --fe-muted: #a7a195; --fe-lines: #8f897e; --fe-hair: #45423c; --fe-bg: #161514;
    --fe-accent: #9dbdf2; --fe-tint: rgba(157, 189, 242, 0.08);
  }
}
.fe-svg { display: block; width: 100%; height: auto; max-width: 640px; overflow: visible; font-family: inherit; }
.fe-narrow { display: none; max-width: 400px; }
@media (max-width: 34rem) { .fe-wide { display: none; } .fe-narrow { display: block; } }
.fe-t { fill: var(--fe-text); }
.fe-m { fill: var(--fe-muted); }
.fe-b { fill: var(--fe-text); font-weight: 600; }
.fe-a { fill: var(--fe-accent); }
.fe-sub { font-size: 0.75em; }
.fe-axis { fill: none; stroke: var(--fe-lines); stroke-width: 1; }
.fe-one { fill: none; stroke: var(--fe-lines); stroke-width: 1.25; }
.fe-ref { fill: none; stroke: var(--fe-lines); stroke-width: 1; stroke-dasharray: 2 4; }
.fe-tint { fill: var(--fe-tint); }
.fe-spin { fill: none; stroke: var(--fe-text); stroke-width: 2; stroke-linejoin: round; }
.fe-sel { fill: none; stroke: var(--fe-muted); stroke-width: 1.5; stroke-dasharray: 6 4; }
.fe-sel-acc { stroke: var(--fe-accent); }
.fe-ci { fill: none; stroke: var(--fe-text); stroke-opacity: 0.16; stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; }
.fe-arrow { fill: none; stroke: var(--fe-muted); stroke-width: 1.25; stroke-linecap: round; stroke-linejoin: round; }
.fe-dot { fill: var(--fe-text); stroke: var(--fe-bg); stroke-width: 2; }
.fe-hollow { fill: var(--fe-bg); stroke: var(--fe-accent); stroke-width: 2; }
.fe-fig figcaption { margin-top: 0.75rem; font-size: 0.9375rem; line-height: 1.55; color: var(--fe-muted); max-width: 40rem; }
</style>`;

const FIGURE = `<figure class="fe-fig">
${svg(wide)}
${svg(narrow)}
<figcaption>${CAPTION}</figcaption>
</figure>`;

writeFileSync(join(here, 'figure.html'), `${STYLE}\n${FIGURE}\n`);

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>The Funding Effect</title>
<style>
:root { --text: #2e2c28; --muted: #5f5b53; --bg: #ffffff; --accent: #2a57a6; }
:root[data-theme='dark'] { --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #9dbdf2; }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { --text: #dcd7cd; --muted: #a7a195; --bg: #161514; --accent: #9dbdf2; } }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 17px; line-height: 1.6; }
main { max-width: 45rem; margin: 0 auto; padding: 2.5rem 16px 3rem; }
h1 { font-size: 1.125rem; font-weight: 600; margin: 0 0 1.25rem; color: var(--muted); }
p { margin: 0 0 1rem; }
a { color: var(--accent); }
.katex-ish { font-style: italic; }
</style>
</head>
<body>
<main>
<h1>The Funding Effect</h1>
<p><strong>Spin attenuates.</strong> Suppose instead that, with probability <i>s</i>, a study whose honest conclusion would be unfavorable is reported as favorable, whatever the truth. Then LR′(<i>s</i>) = (α + <i>s</i>(1 − α)) / (β + <i>s</i>(1 − β)), which falls toward 1 as <i>s</i> → 1 and stays above 1 for every <i>s</i> &lt; 1 when α &gt; β.</p>
<p><strong>A sign flip needs selection.</strong> Under any bias applied regardless of the truth, a funded favorable conclusion stays (weak) evidence <em>for</em> <i>H</i>. It becomes evidence against <i>H</i> only if the funder's behavior depends on <i>H</i> itself. If funders whose product fails commission studies, or publish the favorable ones, at a rate r<sub>¬H</sub> above the rate r<sub>H</sub> of funders whose product works, the observed ratio is LR′(<i>s</i>)·r<sub>H</sub>/r<sub>¬H</sub>, which drops below 1 once r<sub>¬H</sub>/r<sub>H</sub> &gt; LR′(<i>s</i>).</p>
${STYLE}
${FIGURE}
<p><strong>A worked number (illustrative).</strong> Take α = 0.8, β = 0.2 (LR = 4), a prior of 0.5, and read Lundh's favorable-conclusions RR of 1.34 as pure spin. Then <i>s</i> ≈ 0.34 and LR′ ≈ 1.8: a funded favorable conclusion keeps about 44% of an independent one's log-odds weight. The passive-smoking OR of 88, read the same way, gives <i>s</i> ≈ 0.98 and LR′ ≈ 1.01: nearly worthless, not negative.</p>
</main>
</body>
</html>
`;
writeFileSync(join(here, 'index.html'), PAGE);
console.log('wrote figure.html, index.html');
