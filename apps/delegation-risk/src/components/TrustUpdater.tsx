import React, { useState, useMemo } from 'react';

interface PriorPreset {
  name: string;
  alpha: number;
  beta: number;
  description: string;
}

const priorPresets: PriorPreset[] = [
  { name: 'Uninformative', alpha: 1, beta: 1, description: 'No prior knowledge (50% ± 45%)' },
  { name: 'Skeptical', alpha: 5, beta: 5, description: 'Cautious starting point (50% ± 20%)' },
  { name: 'Deterministic Code', alpha: 99, beta: 1, description: 'Very high reliability (99% ± 1%)' },
  { name: 'Narrow ML', alpha: 19, beta: 1, description: 'High reliability (95% ± 5%)' },
  { name: 'General LLM', alpha: 9, beta: 1, description: 'Moderate reliability (90% ± 10%)' },
  { name: 'RL/Agentic', alpha: 4, beta: 1, description: 'Lower reliability (80% ± 15%)' },
  { name: 'New/Unknown', alpha: 1, beta: 1, description: 'Uncertain (50% ± 45%)' },
  { name: 'Custom', alpha: 10, beta: 10, description: 'Set your own values' },
];

// Beta distribution PDF
function betaPdf(x: number, a: number, b: number): number {
  if (x <= 0 || x >= 1) return 0;
  const B = (gamma(a) * gamma(b)) / gamma(a + b);
  return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) / B;
}

// Gamma function approximation (Stirling)
function gamma(n: number): number {
  if (n === 1) return 1;
  if (n < 1) return gamma(n + 1) / n;
  // Stirling's approximation for larger values
  return Math.sqrt(2 * Math.PI / n) * Math.pow((n / Math.E) * Math.sqrt(n * Math.sinh(1/n) + 1/(810 * Math.pow(n, 6))), n);
}

// More accurate gamma using Lanczos approximation
function gammaLanczos(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaLanczos(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

// Beta distribution statistics
function betaMean(a: number, b: number): number {
  return a / (a + b);
}

function betaStd(a: number, b: number): number {
  return Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
}

function betaQuantile(p: number, a: number, b: number): number {
  // Binary search for quantile
  let low = 0, high = 1;
  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const cdf = betaCdf(mid, a, b);
    if (cdf < p) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function betaCdf(x: number, a: number, b: number): number {
  // Numerical integration
  const n = 1000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n * x;
    sum += betaPdf(t, a, b) * (x / n);
  }
  return Math.min(1, Math.max(0, sum));
}

// Distribution visualization
function BetaDistribution({
  alpha,
  beta,
  posteriorAlpha,
  posteriorBeta,
  label
}: {
  alpha: number;
  beta: number;
  posteriorAlpha?: number;
  posteriorBeta?: number;
  label: string;
}) {
  const points = 200;
  const priorData: { x: number; y: number }[] = [];
  const posteriorData: { x: number; y: number }[] = [];

  let maxY = 0;

  for (let i = 1; i < points - 1; i++) {
    const x = i / points;
    const priorY = betaPdf(x, alpha, beta);
    priorData.push({ x, y: priorY });
    maxY = Math.max(maxY, priorY);

    if (posteriorAlpha && posteriorBeta) {
      const postY = betaPdf(x, posteriorAlpha, posteriorBeta);
      posteriorData.push({ x, y: postY });
      maxY = Math.max(maxY, postY);
    }
  }

  const width = 400;
  const height = 150;
  const padding = 30;

  const scaleX = (x: number) => padding + x * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding);

  const priorPath = `M ${scaleX(priorData[0].x)} ${scaleY(priorData[0].y)} ` +
    priorData.slice(1).map(d => `L ${scaleX(d.x)} ${scaleY(d.y)}`).join(' ');

  const posteriorPath = posteriorData.length > 0
    ? `M ${scaleX(posteriorData[0].x)} ${scaleY(posteriorData[0].y)} ` +
      posteriorData.slice(1).map(d => `L ${scaleX(d.x)} ${scaleY(d.y)}`).join(' ')
    : '';

  return (
    <svg width={width} height={height} style={{ display: 'block', margin: '0 auto' }}>
      {/* Axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--sl-color-gray-4)" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="var(--sl-color-gray-4)" />

      {/* X axis labels */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <text key={v} x={scaleX(v)} y={height - 10} textAnchor="middle" fontSize="10" fill="var(--sl-color-gray-3)">
          {(v * 100).toFixed(0)}%
        </text>
      ))}

      {/* Prior distribution */}
      <path d={priorPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

      {/* Posterior distribution */}
      {posteriorPath && (
        <path d={posteriorPath} fill="none" stroke="#22c55e" strokeWidth="2" />
      )}

      {/* Legend */}
      <rect x={width - 100} y={10} width={12} height={12} fill="#3b82f6" />
      <text x={width - 85} y={20} fontSize="11" fill="var(--sl-color-gray-2)">Prior</text>
      {posteriorPath && (
        <>
          <rect x={width - 100} y={26} width={12} height={12} fill="#22c55e" />
          <text x={width - 85} y={36} fontSize="11" fill="var(--sl-color-gray-2)">Posterior</text>
        </>
      )}
    </svg>
  );
}

export default function TrustUpdater() {
  const [selectedPreset, setSelectedPreset] = useState('General LLM');
  const [priorAlpha, setPriorAlpha] = useState(9);
  const [priorBeta, setPriorBeta] = useState(1);
  const [successes, setSuccesses] = useState(50);
  const [failures, setFailures] = useState(3);
  const [history, setHistory] = useState<{ successes: number; failures: number; date: string }[]>([]);

  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = priorPresets.find(p => p.name === presetName);
    if (preset && preset.name !== 'Custom') {
      setPriorAlpha(preset.alpha);
      setPriorBeta(preset.beta);
    }
  };

  const posteriorAlpha = priorAlpha + successes;
  const posteriorBeta = priorBeta + failures;

  const priorMean = betaMean(priorAlpha, priorBeta);
  const posteriorMean = betaMean(posteriorAlpha, posteriorBeta);

  const priorStd = betaStd(priorAlpha, priorBeta);
  const posteriorStd = betaStd(posteriorAlpha, posteriorBeta);

  const prior5 = betaQuantile(0.05, priorAlpha, priorBeta);
  const prior95 = betaQuantile(0.95, priorAlpha, priorBeta);
  const posterior5 = betaQuantile(0.05, posteriorAlpha, posteriorBeta);
  const posterior95 = betaQuantile(0.95, posteriorAlpha, posteriorBeta);

  // Track record modifier
  const trackRecordModifier = priorMean / posteriorMean;

  const addToHistory = () => {
    setHistory([...history, {
      successes,
      failures,
      date: new Date().toLocaleDateString()
    }]);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '0 0.5rem' }}>
      {/* Prior Selection */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>1. Select Prior Belief</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {priorPresets.map(preset => (
            <button
              key={preset.name}
              onClick={() => handlePresetChange(preset.name)}
              style={{
                padding: '8px 16px',
                background: selectedPreset === preset.name ? '#3b82f6' : 'var(--sl-color-bg)',
                color: selectedPreset === preset.name ? 'white' : 'var(--sl-color-text)',
                border: '1px solid var(--sl-color-gray-5)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {selectedPreset === 'Custom' && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                Alpha (successes)
              </label>
              <input
                type="number"
                min="1"
                value={priorAlpha}
                onChange={(e) => setPriorAlpha(Math.max(1, Number(e.target.value)))}
                style={{
                  width: '100px',
                  padding: '6px 10px',
                  border: '1px solid var(--sl-color-gray-5)',
                  borderRadius: '4px',
                  background: 'var(--sl-color-bg)',
                  color: 'var(--sl-color-text)',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
                Beta (failures)
              </label>
              <input
                type="number"
                min="1"
                value={priorBeta}
                onChange={(e) => setPriorBeta(Math.max(1, Number(e.target.value)))}
                style={{
                  width: '100px',
                  padding: '6px 10px',
                  border: '1px solid var(--sl-color-gray-5)',
                  borderRadius: '4px',
                  background: 'var(--sl-color-bg)',
                  color: 'var(--sl-color-text)',
                }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--sl-color-gray-3)' }}>
          Prior: beta({priorAlpha}, {priorBeta}) = {(priorMean * 100).toFixed(1)}% reliability,
          90% CI: [{(prior5 * 100).toFixed(0)}%, {(prior95 * 100).toFixed(0)}%]
        </div>
      </div>

      {/* Observations */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>2. Enter Observations</div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
              Successes
            </label>
            <input
              type="number"
              min="0"
              value={successes}
              onChange={(e) => setSuccesses(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100px',
                padding: '10px 14px',
                fontSize: '18px',
                fontWeight: '600',
                border: '2px solid #22c55e',
                borderRadius: '6px',
                background: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', display: 'block', marginBottom: '4px' }}>
              Failures
            </label>
            <input
              type="number"
              min="0"
              value={failures}
              onChange={(e) => setFailures(Math.max(0, Number(e.target.value)))}
              style={{
                width: '100px',
                padding: '10px 14px',
                fontSize: '18px',
                fontWeight: '600',
                border: '2px solid #ef4444',
                borderRadius: '6px',
                background: 'var(--sl-color-bg)',
                color: 'var(--sl-color-text)',
              }}
            />
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: '12px', color: 'var(--sl-color-gray-3)', marginBottom: '4px' }}>Observed Rate</div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              {successes + failures > 0 ? ((successes / (successes + failures)) * 100).toFixed(1) : '--'}%
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Visualization */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>3. Updated Belief</div>

        <BetaDistribution
          alpha={priorAlpha}
          beta={priorBeta}
          posteriorAlpha={posteriorAlpha}
          posteriorBeta={posteriorBeta}
          label="Reliability Distribution"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div style={{
            padding: '12px',
            background: 'var(--sl-color-bg)',
            borderRadius: '6px',
            borderLeft: '4px solid #3b82f6',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' }}>Prior</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{(priorMean * 100).toFixed(1)}%</div>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>
              beta({priorAlpha}, {priorBeta}), 90% CI: [{(prior5 * 100).toFixed(0)}%, {(prior95 * 100).toFixed(0)}%]
            </div>
          </div>

          <div style={{
            padding: '12px',
            background: 'var(--sl-color-bg)',
            borderRadius: '6px',
            borderLeft: '4px solid #22c55e',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)', textTransform: 'uppercase' }}>Posterior</div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{(posteriorMean * 100).toFixed(1)}%</div>
            <div style={{ fontSize: '11px', color: 'var(--sl-color-gray-3)' }}>
              beta({posteriorAlpha}, {posteriorBeta}), 90% CI: [{(posterior5 * 100).toFixed(0)}%, {(posterior95 * 100).toFixed(0)}%]
            </div>
          </div>
        </div>
      </div>

      {/* Track Record Modifier */}
      <div style={{
        padding: '16px',
        background: 'var(--sl-color-gray-6)',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Track Record Modifier</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: trackRecordModifier > 1.05 ? '#ef4444' : trackRecordModifier < 0.95 ? '#22c55e' : 'var(--sl-color-text)',
          }}>
            {trackRecordModifier.toFixed(2)}×
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              {trackRecordModifier > 1.05
                ? "Performance below prior expectation - risk multiplied"
                : trackRecordModifier < 0.95
                ? "Performance above prior expectation - risk reduced"
                : "Performance matches prior expectation"}
            </div>

            <div style={{
              height: '8px',
              background: 'var(--sl-color-gray-5)',
              borderRadius: '4px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '-2px',
                width: '2px',
                height: '12px',
                background: 'var(--sl-color-gray-3)',
              }} />
              <div style={{
                position: 'absolute',
                left: `${Math.min(100, Math.max(0, (1 - (trackRecordModifier - 0.5)) * 100))}%`,
                top: '-4px',
                width: '16px',
                height: '16px',
                background: trackRecordModifier > 1.05 ? '#ef4444' : trackRecordModifier < 0.95 ? '#22c55e' : '#f59e0b',
                borderRadius: '50%',
                transform: 'translateX(-50%)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--sl-color-gray-4)', marginTop: '4px' }}>
              <span>0.5× (much better)</span>
              <span>1× (as expected)</span>
              <span>1.5× (much worse)</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: 'var(--sl-color-bg)', borderRadius: '6px', fontSize: '12px' }}>
          <strong>Usage:</strong> Multiply your base risk estimate by {trackRecordModifier.toFixed(2)} to get the track-record-adjusted risk.
          <br />
          <code style={{ marginTop: '8px', display: 'block', color: '#3b82f6' }}>
            adjustedRisk = baseRisk × {trackRecordModifier.toFixed(2)}
          </code>
        </div>
      </div>

      {/* Squiggle Export */}
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
{`// Trust Calibration Model
// Prior belief about component reliability
prior = beta(${priorAlpha}, ${priorBeta})
// Mean: ${(priorMean * 100).toFixed(1)}%, 90% CI: [${(prior5 * 100).toFixed(0)}%, ${(prior95 * 100).toFixed(0)}%]

// Observations
successes = ${successes}
failures = ${failures}
observedRate = ${successes + failures > 0 ? (successes / (successes + failures)).toFixed(3) : 'N/A'}

// Bayesian update
posterior = beta(${posteriorAlpha}, ${posteriorBeta})
// Mean: ${(posteriorMean * 100).toFixed(1)}%, 90% CI: [${(posterior5 * 100).toFixed(0)}%, ${(posterior95 * 100).toFixed(0)}%]

// Track record modifier for risk adjustment
priorMean = mean(prior)      // ${priorMean.toFixed(3)}
posteriorMean = mean(posterior)  // ${posteriorMean.toFixed(3)}
trackRecordModifier = priorMean / posteriorMean  // ${trackRecordModifier.toFixed(3)}

// Apply to risk calculation
baseRisk = ... // your base risk estimate
adjustedRisk = baseRisk * trackRecordModifier
`}
        </pre>
      </details>
    </div>
  );
}
