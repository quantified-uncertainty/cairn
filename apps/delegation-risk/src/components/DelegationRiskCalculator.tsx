import React, { useMemo, useState } from 'react';

/*
 * Delegation risk calculator.
 *
 * Model, per harm mode m and per month:
 *   - N_m actions per month (the volume).
 *   - p_m = probability that one action causes this harm. Uncertain: logit-normal
 *     whose 5th and 95th percentiles are the two inputs.
 *   - Damage per incident: lognormal whose 5th and 95th percentiles are the inputs.
 *
 * Two quantities are kept apart:
 *   - Delegation risk (expected loss per month) = sum_m N_m * E[p_m] * E[D_m].
 *     Its interval reflects uncertainty about the rates p_m only.
 *   - Realized loss in one month: incidents K_m ~ Binomial(N_m, p_m), each with an
 *     independent damage draw. p_m is redrawn for every simulated month, so the
 *     distribution includes both rate uncertainty and incident randomness.
 *
 * Assumptions: incidents are independent given the rates, and uncertainty about
 * different modes' rates is independent. Correlation does not change the expected
 * loss but fattens the realized-loss tail, so the tail figures are optimistic for
 * correlated harm modes.
 *
 * Plain TypeScript Monte Carlo; no Squiggle runtime. The optional export emits a
 * Squiggle model of the expected-loss part only, tested with @quri/squiggle-lang 0.10.0.
 */

export interface HarmModeInput {
  id: string;
  name: string;
  actionsPerMonth: string;
  pLow: string;
  pHigh: string;
  damageLow: string;
  damageHigh: string;
}

export interface HarmMode {
  name: string;
  actionsPerMonth: number;
  pLow: number;
  pHigh: number;
  damageLow: number;
  damageHigh: number;
}

export interface ModeSummary {
  name: string;
  actionsPerMonth: number;
  meanP: number;
  meanDamage: number;
  expectedIncidents: number;
  expectedLoss: number;
}

export interface SimulationResult {
  modes: ModeSummary[];
  expectedLoss: number;
  expectedLossP5: number;
  expectedLossP95: number;
  realizedMean: number;
  probZero: number;
  realizedP50: number;
  realizedP90: number;
  realizedP99: number;
  realized: Float64Array; // sorted ascending
}

const Z90 = 1.6448536269514722; // standard normal 95th percentile
const P_MIN = 1e-9;
const EXACT_SUM_LIMIT = 200;
export const N_MONTHS = 20000;

// ---------- random numbers (seeded so server and client renders agree) ----------

/** sfc32 generator, state filled by splitmix32 from one seed. Returns uniforms in [0, 1). */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  const splitmix = () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
    return (z ^ (z >>> 16)) >>> 0;
  };
  let a = splitmix();
  let b = splitmix();
  let c = splitmix();
  let d = 1;
  const next = () => {
    const t = (((a + b) >>> 0) + d) >>> 0;
    d = (d + 1) >>> 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) >>> 0;
    c = ((c << 21) | (c >>> 11)) >>> 0;
    c = (c + t) >>> 0;
    return t / 4294967296;
  };
  for (let i = 0; i < 12; i++) next();
  return next;
}

function standardNormal(rng: () => number): number {
  const u1 = 1 - rng(); // (0, 1]
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ---------- distribution helpers ----------

const logit = (p: number) => Math.log(p / (1 - p));
const invLogit = (x: number) => 1 / (1 + Math.exp(-x));
const clampP = (p: number) => Math.min(1 - P_MIN, Math.max(P_MIN, p));

/** Logit-normal parameters from a 90% interval on a probability. */
export function rateParams(lo: number, hi: number): { mu: number; sigma: number } {
  const a = logit(clampP(Math.min(lo, hi)));
  const b = logit(clampP(Math.max(lo, hi)));
  return { mu: (a + b) / 2, sigma: (b - a) / (2 * Z90) };
}

/** E[p] for a logit-normal, by trapezoidal integration over the normal density. */
export function logitNormalMean(mu: number, sigma: number): number {
  if (sigma === 0) return invLogit(mu);
  const steps = 1600;
  const lim = 8;
  const h = (2 * lim) / steps;
  let sum = 0;
  for (let i = 0; i <= steps; i++) {
    const z = -lim + i * h;
    const w = i === 0 || i === steps ? 0.5 : 1;
    sum += w * Math.exp(-0.5 * z * z) * invLogit(mu + sigma * z);
  }
  return (sum * h) / Math.sqrt(2 * Math.PI);
}

/** Lognormal parameters from a 90% interval on damage per incident. */
export function damageParams(lo: number, hi: number): { mu: number; sigma: number } {
  const a = Math.log(Math.max(1e-9, Math.min(lo, hi)));
  const b = Math.log(Math.max(1e-9, Math.max(lo, hi)));
  return { mu: (a + b) / 2, sigma: (b - a) / (2 * Z90) };
}

export function lognormalMean(mu: number, sigma: number): number {
  return Math.exp(mu + (sigma * sigma) / 2);
}

/** Binomial(n, p) draw: inversion for small means, normal approximation for large. */
export function sampleBinomial(n: number, p: number, rng: () => number): number {
  n = Math.floor(n);
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (p > 0.5) return n - sampleBinomial(n, 1 - p, rng);
  const mean = n * p;
  if (mean < 30) {
    const ratio = p / (1 - p);
    let f = Math.exp(n * Math.log1p(-p));
    let cdf = f;
    let k = 0;
    const u = rng();
    const cap = Math.min(n, Math.ceil(mean + 40 * Math.sqrt(mean) + 40));
    while (u > cdf && k < cap) {
      f *= ((n - k) / (k + 1)) * ratio;
      k++;
      cdf += f;
    }
    return k;
  }
  const k = Math.round(mean + Math.sqrt(mean * (1 - p)) * standardNormal(rng));
  return Math.min(n, Math.max(0, k));
}

/**
 * Sum of k independent lognormal(mu, sigma) damages. Exact up to EXACT_SUM_LIMIT
 * draws; beyond that, a lognormal with the same mean and variance (Fenton-Wilkinson).
 */
export function sampleDamageSum(k: number, mu: number, sigma: number, rng: () => number): number {
  if (k <= 0) return 0;
  if (k <= EXACT_SUM_LIMIT) {
    let s = 0;
    for (let i = 0; i < k; i++) s += Math.exp(mu + sigma * standardNormal(rng));
    return s;
  }
  const s2 = sigma * sigma;
  const m = k * Math.exp(mu + s2 / 2);
  const v = k * (Math.exp(s2) - 1) * Math.exp(2 * mu + s2);
  const sigmaSum2 = Math.log(1 + v / (m * m));
  return Math.exp(Math.log(m) - sigmaSum2 / 2 + Math.sqrt(sigmaSum2) * standardNormal(rng));
}

function quantileSorted(sorted: Float64Array, q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function parseModes(inputs: HarmModeInput[]): HarmMode[] {
  const num = (s: string) => {
    const x = parseFloat(s);
    return Number.isFinite(x) && x >= 0 ? x : 0;
  };
  return inputs.map((m) => ({
    name: m.name.trim() || 'Unnamed harm mode',
    actionsPerMonth: Math.floor(num(m.actionsPerMonth)),
    pLow: Math.min(1, num(m.pLow)),
    pHigh: Math.min(1, num(m.pHigh)),
    damageLow: num(m.damageLow),
    damageHigh: num(m.damageHigh),
  }));
}

export function simulate(modes: HarmMode[], nSamples = N_MONTHS, seed = 20261015): SimulationResult {
  const rng = seededRandom(seed);
  const prepared = modes.map((m) => {
    const rate = rateParams(m.pLow, m.pHigh);
    const dmg = damageParams(m.damageLow, m.damageHigh);
    const zeroRate = Math.max(m.pLow, m.pHigh) <= 0;
    const zeroDamage = Math.max(m.damageLow, m.damageHigh) <= 0;
    const inactive = zeroRate || zeroDamage || m.actionsPerMonth <= 0;
    const meanP = zeroRate ? 0 : logitNormalMean(rate.mu, rate.sigma);
    const meanDamage = zeroDamage ? 0 : lognormalMean(dmg.mu, dmg.sigma);
    return { m, rate, dmg, inactive, meanP, meanDamage };
  });

  const summaries: ModeSummary[] = prepared.map(({ m, meanP, meanDamage, inactive }) => ({
    name: m.name,
    actionsPerMonth: m.actionsPerMonth,
    meanP: inactive ? 0 : meanP,
    meanDamage,
    expectedIncidents: inactive ? 0 : m.actionsPerMonth * meanP,
    expectedLoss: inactive ? 0 : m.actionsPerMonth * meanP * meanDamage,
  }));
  const expectedLoss = summaries.reduce((s, x) => s + x.expectedLoss, 0);

  const epistemic = new Float64Array(nSamples);
  const realized = new Float64Array(nSamples);
  let zeros = 0;
  let realizedSum = 0;
  for (let i = 0; i < nSamples; i++) {
    let el = 0;
    let loss = 0;
    for (const x of prepared) {
      if (x.inactive) continue;
      const p = invLogit(x.rate.mu + x.rate.sigma * standardNormal(rng));
      el += x.m.actionsPerMonth * p * x.meanDamage;
      const k = sampleBinomial(x.m.actionsPerMonth, p, rng);
      loss += sampleDamageSum(k, x.dmg.mu, x.dmg.sigma, rng);
    }
    epistemic[i] = el;
    realized[i] = loss;
    realizedSum += loss;
    if (loss === 0) zeros++;
  }
  epistemic.sort();
  realized.sort();

  return {
    modes: summaries,
    expectedLoss,
    expectedLossP5: quantileSorted(epistemic, 0.05),
    expectedLossP95: quantileSorted(epistemic, 0.95),
    realizedMean: realizedSum / nSamples,
    probZero: zeros / nSamples,
    realizedP50: quantileSorted(realized, 0.5),
    realizedP90: quantileSorted(realized, 0.9),
    realizedP99: quantileSorted(realized, 0.99),
    realized,
  };
}

export function probExceeds(sorted: Float64Array, x: number): number {
  // count of samples strictly greater than x, by binary search
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  return (sorted.length - lo) / sorted.length;
}

/** Squiggle model of the expected-loss part (tested with @quri/squiggle-lang 0.10.0). */
export function toSquiggle(modes: HarmMode[]): string {
  const lines = [
    '// Delegation risk (expected loss per month) exported from the calculator.',
    '// Uncertainty comes from the per-action rates only; the calculator\'s',
    '// realized-loss simulation is not included.',
    'z90 = 1.6448536',
    '// Per-action probability: logit-normal with this 90% interval',
    'rate(lo, hi) = {',
    '  a = log(lo / (1 - lo))',
    '  b = log(hi / (1 - hi))',
    '  SampleSet.map(normal((a + b) / 2, (b - a) / (2 * z90)), {|z| 1 / (1 + exp(-z))})',
    '}',
    '// Mean damage per incident: lognormal with this 90% interval',
    'meanDamage(lo, hi) = {',
    '  s = (log(hi) - log(lo)) / (2 * z90)',
    '  exp((log(lo) + log(hi)) / 2 + s ^ 2 / 2)',
    '}',
    '',
  ];
  const fmt = (x: number) => String(Number(x.toPrecision(6)));
  const terms: string[] = [];
  let anyDist = false;
  modes.forEach((m, i) => {
    const lo = clampP(Math.min(m.pLow, m.pHigh));
    const hi = clampP(Math.max(m.pLow, m.pHigh));
    const dLo = Math.max(1e-9, Math.min(m.damageLow, m.damageHigh));
    const dHi = Math.max(1e-9, Math.max(m.damageLow, m.damageHigh));
    if (m.actionsPerMonth <= 0 || Math.max(m.pLow, m.pHigh) <= 0 || dHi <= 1e-9) return;
    const id = `mode${i + 1}`;
    const rate = lo === hi ? fmt(lo) : `rate(${fmt(lo)}, ${fmt(hi)})`;
    const dmg = dLo === dHi ? fmt(dLo) : `meanDamage(${fmt(dLo)}, ${fmt(dHi)})`;
    if (lo !== hi) anyDist = true;
    lines.push(`// ${m.name.replace(/[\r\n]+/g, ' ')}`);
    lines.push(`${id} = ${m.actionsPerMonth} * ${rate} * ${dmg}`);
    terms.push(id);
  });
  lines.push('');
  lines.push(`delegationRisk = ${terms.length ? terms.join(' + ') : '0'}`);
  lines.push(
    anyDist
      ? '{expected: mean(delegationRisk), p5: quantile(delegationRisk, 0.05), p95: quantile(delegationRisk, 0.95)}'
      : 'delegationRisk',
  );
  return lines.join('\n');
}

// ---------- defaults (illustrative, not data) ----------

const defaultModes: HarmModeInput[] = [
  {
    id: '1',
    name: 'Wrong answer the customer acts on',
    actionsPerMonth: '5000',
    pLow: '0.0002',
    pHigh: '0.002',
    damageLow: '20',
    damageHigh: '500',
  },
  {
    id: '2',
    name: 'Refund issued on an injected instruction',
    actionsPerMonth: '1000',
    pLow: '0.00001',
    pHigh: '0.001',
    damageLow: '50',
    damageHigh: '2000',
  },
  {
    id: '3',
    name: 'Customer records disclosed',
    actionsPerMonth: '5000',
    pLow: '0.00000005',
    pHigh: '0.000005',
    damageLow: '5000',
    damageHigh: '500000',
  },
];

// ---------- presentation ----------

const money = (x: number) => {
  if (!Number.isFinite(x)) return '—';
  if (x >= 1e6) return `$${(x / 1e6).toPrecision(3)}M`;
  if (x >= 1e4) return `$${Math.round(x / 1e3)}k`;
  return `$${Math.round(x).toLocaleString('en-US')}`;
};
const pct = (x: number) => (x < 0.001 && x > 0 ? '<0.1%' : `${(x * 100).toFixed(1)}%`);

const box: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: 'var(--sl-color-gray-6)',
  borderRadius: '0.5rem',
  marginBottom: '1rem',
};
const small: React.CSSProperties = { fontSize: '0.8rem', color: 'var(--sl-color-gray-3)' };
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.35rem 0.5rem',
  border: '1px solid var(--sl-color-gray-5)',
  borderRadius: '0.25rem',
  background: 'var(--sl-color-bg)',
  color: 'var(--sl-color-text)',
  boxSizing: 'border-box',
};

function LossHistogram({ sorted, budget }: { sorted: Float64Array; budget: number }) {
  const nonzero = sorted.filter((x) => x > 0);
  if (nonzero.length < 2) return <p style={small}>Too few months with losses to plot.</p>;
  const lo = Math.log10(nonzero[0]);
  const hi = Math.log10(nonzero[nonzero.length - 1]);
  const nBins = 30;
  const width = (hi - lo) / nBins || 1;
  const bins = new Array(nBins).fill(0);
  for (const x of nonzero) bins[Math.min(nBins - 1, Math.floor((Math.log10(x) - lo) / width))]++;
  const maxBin = Math.max(...bins);
  return (
    <div>
      <div
        role="img"
        aria-label="Histogram of realized monthly loss on a logarithmic scale"
        style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '1px' }}
      >
        {bins.map((count, i) => {
          const binLo = Math.pow(10, lo + i * width);
          const binHi = Math.pow(10, lo + (i + 1) * width);
          return (
            <div
              key={i}
              title={`${money(binLo)}–${money(binHi)}: ${count} months`}
              style={{
                flex: 1,
                height: `${(count / maxBin) * 100}%`,
                minHeight: count > 0 ? '1px' : 0,
                background: binLo >= budget ? 'var(--sl-color-red)' : 'var(--sl-color-accent)',
                borderRadius: '2px 2px 0 0',
              }}
            />
          );
        })}
      </div>
      <div style={{ ...small, display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <span>{money(nonzero[0])}</span>
        <span>log scale; red bins start at or above the budget</span>
        <span>{money(nonzero[nonzero.length - 1])}</span>
      </div>
    </div>
  );
}

export default function DelegationRiskCalculator() {
  const [inputs, setInputs] = useState<HarmModeInput[]>(defaultModes);
  const [budgetText, setBudgetText] = useState('2000');
  const [showExport, setShowExport] = useState(false);

  const modes = useMemo(() => parseModes(inputs), [inputs]);
  const result = useMemo(() => simulate(modes), [modes]);
  const budget = Math.max(0, parseFloat(budgetText) || 0);
  const pOver = useMemo(() => probExceeds(result.realized, budget), [result, budget]);
  const within = result.expectedLoss <= budget;

  const update = (id: string, field: keyof HarmModeInput, value: string) =>
    setInputs((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  const add = () =>
    setInputs((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: 'New harm mode',
        actionsPerMonth: '1000',
        pLow: '0.0001',
        pHigh: '0.001',
        damageLow: '100',
        damageHigh: '10000',
      },
    ]);
  const remove = (id: string) => setInputs((prev) => prev.filter((m) => m.id !== id));

  const fields: { key: keyof HarmModeInput; label: string }[] = [
    { key: 'actionsPerMonth', label: 'Actions per month' },
    { key: 'pLow', label: 'P(harm) per action, 5th pct' },
    { key: 'pHigh', label: 'P(harm) per action, 95th pct' },
    { key: 'damageLow', label: 'Damage per incident, 5th pct ($)' },
    { key: 'damageHigh', label: 'Damage per incident, 95th pct ($)' },
  ];

  return (
    <div style={{ fontSize: '0.95rem' }}>
      <div style={box}>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Risk budget (expected loss per month), $</span>
          <input
            type="text"
            inputMode="decimal"
            value={budgetText}
            onChange={(e) => setBudgetText(e.target.value)}
            style={{ ...inputStyle, width: '8rem' }}
          />
        </label>
      </div>

      <div style={box}>
        <div style={{ fontWeight: 600 }}>
          Delegation risk: {money(result.expectedLoss)} per month{' '}
          <span style={{ color: within ? 'var(--sl-color-green)' : 'var(--sl-color-red)' }}>
            ({within ? 'within' : 'over'} budget)
          </span>
        </div>
        <div style={small}>
          Expected loss. 90% interval from uncertainty about the rates: {money(result.expectedLossP5)} to{' '}
          {money(result.expectedLossP95)}.
        </div>
        <div style={{ fontWeight: 600, marginTop: '0.75rem' }}>Realized loss in a single month ({N_MONTHS.toLocaleString('en-US')} simulated months)</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(8.5rem, 1fr))',
            gap: '0.5rem',
            margin: '0.5rem 0',
          }}
        >
          {[
            ['Months with no incident', pct(result.probZero)],
            ['Median month', money(result.realizedP50)],
            ['90th percentile', money(result.realizedP90)],
            ['99th percentile', money(result.realizedP99)],
            ['Months with loss above budget', pct(pOver)],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--sl-color-bg)', padding: '0.5rem', borderRadius: '0.25rem' }}>
              <div style={small}>{label}</div>
              <div style={{ fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
        <LossHistogram sorted={result.realized} budget={budget} />
      </div>

      <div style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600 }}>Harm modes</span>
          <button type="button" onClick={add} style={{ cursor: 'pointer' }}>
            Add harm mode
          </button>
        </div>
        {inputs.map((m, i) => {
          const s = result.modes[i];
          return (
            <div
              key={m.id}
              style={{
                padding: '0.5rem',
                background: 'var(--sl-color-bg)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '0.25rem',
                marginBottom: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  aria-label="Harm mode name"
                  value={m.name}
                  onChange={(e) => update(m.id, 'name', e.target.value)}
                  style={{ ...inputStyle, fontWeight: 600 }}
                />
                <button type="button" onClick={() => remove(m.id)} style={{ cursor: 'pointer' }}>
                  Remove
                </button>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {fields.map((f) => (
                  <label key={f.key} style={small}>
                    {f.label}
                    <input
                      type="text"
                      inputMode="decimal"
                      value={m[f.key]}
                      onChange={(e) => update(m.id, f.key, e.target.value)}
                      style={inputStyle}
                    />
                  </label>
                ))}
              </div>
              {s && (
                <div style={{ ...small, marginTop: '0.4rem' }}>
                  Mean P per action {s.meanP.toPrecision(2)} · {s.expectedIncidents.toPrecision(2)} incidents per month ·
                  mean damage {money(s.meanDamage)} · expected loss {money(s.expectedLoss)} per month
                  {result.expectedLoss > 0 ? ` (${pct(s.expectedLoss / result.expectedLoss)} of total)` : ''}
                  {modes[i].pLow === 0 && modes[i].pHigh > 0
                    ? '. A 5th percentile of 0 is read as 1e-9, which makes the interval very wide.'
                    : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <details open={showExport} onToggle={(e) => setShowExport((e.target as HTMLDetailsElement).open)}>
        <summary style={{ cursor: 'pointer' }}>Export the expected-loss model as Squiggle code</summary>
        {showExport && (
          <pre style={{ fontSize: '0.8rem', overflowX: 'auto' }}>
            <code>{toSquiggle(modes)}</code>
          </pre>
        )}
      </details>
    </div>
  );
}
