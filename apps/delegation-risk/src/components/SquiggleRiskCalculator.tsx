import React, { useState, useMemo } from 'react';

// Types
interface HarmMode {
  id: string;
  name: string;
  probabilityMean: number;
  probabilityStd: number;
  damageMean: number;
  damageStd: number;
}

interface CalculationResult {
  mean: number;
  median: number;
  p5: number;
  p95: number;
  samples: number[];
}

// Simple beta distribution approximation using normal for display
function betaMean(a: number, b: number): number {
  return a / (a + b);
}

function betaStd(a: number, b: number): number {
  return Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
}

// Lognormal sampling
function sampleLognormal(mu: number, sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

// Beta sampling (approximation)
function sampleBeta(a: number, b: number): number {
  // Using gamma sampling
  const gamma = (shape: number) => {
    if (shape < 1) {
      return gamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      let x, v;
      do {
        x = (Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1);
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = Math.random();
      if (u < 1 - 0.0331 * x * x * x * x) return d * v;
      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  };
  const ga = gamma(a);
  const gb = gamma(b);
  return ga / (ga + gb);
}

// Monte Carlo simulation
function simulateRisk(harmModes: HarmMode[], numSamples: number = 10000): CalculationResult {
  const samples: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    let totalRisk = 0;
    for (const mode of harmModes) {
      // Sample probability from beta-like distribution
      const probAlpha = mode.probabilityMean * 100;
      const probBeta = (1 - mode.probabilityMean) * 100;
      const prob = Math.max(0, Math.min(1, sampleBeta(Math.max(1, probAlpha), Math.max(1, probBeta))));

      // Sample damage from lognormal
      const logDamageMean = Math.log(mode.damageMean);
      const logDamageStd = mode.damageStd;
      const damage = sampleLognormal(logDamageMean, logDamageStd);

      totalRisk += prob * damage;
    }
    samples.push(totalRisk);
  }

  samples.sort((a, b) => a - b);

  return {
    mean: samples.reduce((a, b) => a + b, 0) / samples.length,
    median: samples[Math.floor(samples.length / 2)],
    p5: samples[Math.floor(samples.length * 0.05)],
    p95: samples[Math.floor(samples.length * 0.95)],
    samples,
  };
}

// Histogram component
function Histogram({ samples, budget }: { samples: number[]; budget: number }) {
  const numBins = 40;
  const max = Math.max(...samples);
  const binWidth = max / numBins;

  const bins = new Array(numBins).fill(0);
  for (const sample of samples) {
    const binIndex = Math.min(Math.floor(sample / binWidth), numBins - 1);
    bins[binIndex]++;
  }

  const maxBin = Math.max(...bins);
  const budgetBin = Math.min(Math.floor(budget / binWidth), numBins - 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '1px', marginTop: '12px' }}>
      {bins.map((count, i) => {
        const height = (count / maxBin) * 100;
        const isOverBudget = i > budgetBin;
        const isBudgetBin = i === budgetBin;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${height}%`,
              background: isOverBudget ? '#ef4444' : isBudgetBin ? '#f59e0b' : '#22c55e',
              borderRadius: '2px 2px 0 0',
              minWidth: '2px',
            }}
            title={`$${Math.round(i * binWidth)} - $${Math.round((i + 1) * binWidth)}: ${count} samples`}
          />
        );
      })}
    </div>
  );
}

// Default harm modes
const defaultHarmModes: HarmMode[] = [
  {
    id: '1',
    name: 'Data processing error',
    probabilityMean: 0.05,
    probabilityStd: 0.02,
    damageMean: 500,
    damageStd: 0.6,
  },
  {
    id: '2',
    name: 'Security vulnerability',
    probabilityMean: 0.01,
    probabilityStd: 0.005,
    damageMean: 5000,
    damageStd: 1.0,
  },
  {
    id: '3',
    name: 'Incorrect recommendation',
    probabilityMean: 0.08,
    probabilityStd: 0.03,
    damageMean: 1000,
    damageStd: 0.8,
  },
];

export default function SquiggleRiskCalculator() {
  const [harmModes, setHarmModes] = useState<HarmMode[]>(defaultHarmModes);
  const [budget, setBudget] = useState(500);
  const [isSimulating, setIsSimulating] = useState(false);

  const result = useMemo(() => {
    setIsSimulating(true);
    const r = simulateRisk(harmModes, 10000);
    setIsSimulating(false);
    return r;
  }, [harmModes]);

  const budgetConfidence = useMemo(() => {
    const underBudget = result.samples.filter(s => s <= budget).length;
    return (underBudget / result.samples.length) * 100;
  }, [result, budget]);

  const addHarmMode = () => {
    const newId = String(Date.now());
    setHarmModes([...harmModes, {
      id: newId,
      name: 'New harm mode',
      probabilityMean: 0.05,
      probabilityStd: 0.02,
      damageMean: 1000,
      damageStd: 0.7,
    }]);
  };

  const removeHarmMode = (id: string) => {
    setHarmModes(harmModes.filter(m => m.id !== id));
  };

  const updateHarmMode = (id: string, field: keyof HarmMode, value: string | number) => {
    setHarmModes(harmModes.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const confidenceColor = budgetConfidence >= 90 ? '#22c55e' : budgetConfidence >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 0.5rem' }}>
      {/* Budget Setting */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
      }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
            Monthly Budget
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>$</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{
                width: '120px',
                padding: '8px 12px',
                fontSize: '18px',
                fontWeight: '600',
                border: '2px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                background: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
              }}
            />
            <span style={{ fontSize: '14px', color: 'var(--sl-color-gray-3)' }}>/month</span>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '4px' }}>
            Budget Confidence
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: confidenceColor }}>
            {budgetConfidence.toFixed(1)}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>
            probability of staying within budget
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '20px',
      }}>
        {[
          { label: 'Expected Risk', value: result.mean, color: '#3b82f6' },
          { label: 'Median', value: result.median, color: '#8b5cf6' },
          { label: '5th Percentile', value: result.p5, color: '#22c55e' },
          { label: '95th Percentile', value: result.p95, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: '12px',
            background: 'var(--sl-color-gray-6)',
            borderRadius: '8px',
            borderLeft: `4px solid ${color}`,
          }}>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>${value.toFixed(0)}</div>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>/month</div>
          </div>
        ))}
      </div>

      {/* Histogram */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Risk Distribution (10,000 samples)</div>
        <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '8px' }}>
          <span style={{ color: '#22c55e' }}>Green</span> = under budget,
          <span style={{ color: '#f59e0b', marginLeft: '8px' }}>Yellow</span> = at budget,
          <span style={{ color: '#ef4444', marginLeft: '8px' }}>Red</span> = over budget
        </div>
        <Histogram samples={result.samples} budget={budget} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>
          <span>$0</span>
          <span>${Math.round(Math.max(...result.samples))}</span>
        </div>
      </div>

      {/* Harm Modes */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Harm Modes</div>
          <button
            onClick={addHarmMode}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            + Add Harm Mode
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {harmModes.map((mode) => {
            const modeRisk = mode.probabilityMean * mode.damageMean;
            return (
              <div key={mode.id} style={{
                padding: '12px',
                background: 'var(--sl-color-bg)',
                borderRadius: '6px',
                border: '1px solid var(--sl-color-gray-5)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={mode.name}
                    onChange={(e) => updateHarmMode(mode.id, 'name', e.target.value)}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--sl-color-text)',
                      flex: 1,
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                      ~${modeRisk.toFixed(0)}/mo
                    </span>
                    <button
                      onClick={() => removeHarmMode(mode.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                      Probability (mean)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={mode.probabilityMean}
                      onChange={(e) => updateHarmMode(mode.id, 'probabilityMean', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        background: 'var(--sl-color-bg)',
                        color: 'var(--sl-color-text)',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--sl-color-gray-4)', marginTop: '2px' }}>
                      {(mode.probabilityMean * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                      Probability (uncertainty)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={mode.probabilityStd}
                      onChange={(e) => updateHarmMode(mode.id, 'probabilityStd', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        background: 'var(--sl-color-bg)',
                        color: 'var(--sl-color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                      Damage (median $)
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={mode.damageMean}
                      onChange={(e) => updateHarmMode(mode.id, 'damageMean', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        background: 'var(--sl-color-bg)',
                        color: 'var(--sl-color-text)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                      Damage (log-std)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2"
                      value={mode.damageStd}
                      onChange={(e) => updateHarmMode(mode.id, 'damageStd', Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid var(--sl-color-gray-5)',
                        borderRadius: '4px',
                        background: 'var(--sl-color-bg)',
                        color: 'var(--sl-color-text)',
                      }}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--sl-color-gray-4)', marginTop: '2px' }}>
                      Higher = more uncertain
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Squiggle Code Export */}
      <details style={{ marginTop: '20px' }}>
        <summary style={{ cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: 'var(--sl-color-gray-2)' }}>
          View as Squiggle Code
        </summary>
        <pre style={{
          marginTop: '12px',
          padding: '16px',
          background: '#1e1e1e',
          color: '#d4d4d4',
          borderRadius: '8px',
          fontSize: '12px',
          overflow: 'auto',
        }}>
{`// Delegation Risk Model
// Generated from calculator inputs

${harmModes.map((mode, i) => `
// ${mode.name}
prob_${i} = beta(${Math.round(mode.probabilityMean * 100)}, ${Math.round((1 - mode.probabilityMean) * 100)})
damage_${i} = lognormal(log(${mode.damageMean}), ${mode.damageStd})
risk_${i} = prob_${i} * damage_${i}
`).join('')}

// Total monthly delegation risk
totalRisk = ${harmModes.map((_, i) => `risk_${i}`).join(' + ')}

// Budget analysis
budget = ${budget}
budgetConfidence = cdf(totalRisk, budget)

// Summary statistics
mean(totalRisk)      // Expected risk
quantile(totalRisk, 0.5)   // Median
quantile(totalRisk, 0.05)  // 5th percentile
quantile(totalRisk, 0.95)  // 95th percentile
`}
        </pre>
      </details>
    </div>
  );
}
