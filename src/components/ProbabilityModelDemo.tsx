import React, { useState, useMemo } from 'react';

// Simple pseudo-random number generator for reproducible samples
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Generate samples from a normal distribution using Box-Muller
const normalSample = (mean: number, std: number, seed: number): number => {
  const u1 = Math.max(0.0001, seededRandom(seed)); // Avoid log(0)
  const u2 = seededRandom(seed + 1);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
};

// Generate samples from a lognormal distribution
const lognormalSample = (mu: number, sigma: number, seed: number): number => {
  return Math.exp(normalSample(mu, sigma, seed));
};

// Calculate percentiles from sorted samples
const percentile = (samples: number[], p: number): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.floor(p * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
};

// Simple histogram binning
const histogram = (samples: number[], bins: number = 30): { x: number; y: number }[] => {
  if (samples.length === 0) return [];
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  if (min === max) return [{ x: min, y: 1 }];

  const binWidth = (max - min) / bins;
  const counts = new Array(bins).fill(0);

  samples.forEach(s => {
    const idx = Math.min(Math.floor((s - min) / binWidth), bins - 1);
    if (idx >= 0 && idx < bins) {
      counts[idx]++;
    }
  });

  return counts.map((count, i) => ({
    x: min + (i + 0.5) * binWidth,
    y: count / samples.length
  }));
};

// ============ STYLES ============
const styles = {
  container: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#fff',
    marginBottom: '24px',
  } as React.CSSProperties,
  title: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  } as React.CSSProperties,
  gridSingle: {
    display: 'block',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: '12px',
  } as React.CSSProperties,
  sliderContainer: {
    marginBottom: '16px',
  } as React.CSSProperties,
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  } as React.CSSProperties,
  sliderLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  } as React.CSSProperties,
  sliderValue: {
    fontSize: '14px',
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
  } as React.CSSProperties,
  slider: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    accentColor: '#3b82f6',
  } as React.CSSProperties,
  sliderRange: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  } as React.CSSProperties,
  sliderDesc: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  } as React.CSSProperties,
  statBox: {
    backgroundColor: '#eff6ff',
    padding: '12px',
    borderRadius: '6px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  statBoxRed: {
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  } as React.CSSProperties,
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#2563eb',
  } as React.CSSProperties,
  statValueRed: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#dc2626',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '16px',
  } as React.CSSProperties,
  chartContainer: {
    marginBottom: '16px',
  } as React.CSSProperties,
  chartLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  } as React.CSSProperties,
  chartSvg: {
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    display: 'block',
  } as React.CSSProperties,
  ci: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  } as React.CSSProperties,
};

// ============ VISUALIZATION COMPONENTS ============

interface DistributionChartProps {
  samples: number[];
  label: string;
  unit?: string;
  color?: string;
  width?: number;
  height?: number;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  samples,
  label,
  unit = '',
  color = '#3b82f6',
  width = 320,
  height = 140
}) => {
  const hist = histogram(samples, 25);
  if (hist.length === 0) return null;

  const maxY = Math.max(...hist.map(h => h.y), 0.001);
  const minX = Math.min(...hist.map(h => h.x));
  const maxX = Math.max(...hist.map(h => h.x));

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const p10 = percentile(samples, 0.1);
  const p90 = percentile(samples, 0.9);

  const padding = { top: 10, right: 15, bottom: 30, left: 15 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const xScale = (x: number) => {
    if (maxX === minX) return padding.left + chartWidth / 2;
    return padding.left + ((x - minX) / (maxX - minX)) * chartWidth;
  };
  const yScale = (y: number) => padding.top + chartHeight - (y / maxY) * chartHeight;

  const barWidth = Math.max(1, chartWidth / hist.length - 1);

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartLabel}>{label}</div>
      <svg width={width} height={height} style={styles.chartSvg}>
        {/* Bars */}
        {hist.map((bar, i) => (
          <rect
            key={i}
            x={xScale(bar.x) - barWidth / 2}
            y={yScale(bar.y)}
            width={barWidth}
            height={Math.max(0, chartHeight - (yScale(bar.y) - padding.top))}
            fill={color}
            opacity={0.7}
          />
        ))}

        {/* Mean line */}
        <line
          x1={xScale(mean)}
          y1={padding.top}
          x2={xScale(mean)}
          y2={padding.top + chartHeight}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="4,2"
        />

        {/* X-axis labels */}
        <text x={padding.left} y={height - 8} fontSize={10} fill="#666" textAnchor="start">
          {minX.toFixed(0)}{unit}
        </text>
        <text x={width - padding.right} y={height - 8} fontSize={10} fill="#666" textAnchor="end">
          {maxX.toFixed(0)}{unit}
        </text>
        <text x={xScale(mean)} y={height - 8} fontSize={10} fill="#ef4444" textAnchor="middle">
          mean={mean.toFixed(0)}
        </text>
      </svg>
      <div style={styles.ci}>
        90% CI: [{p10.toFixed(1)}, {p90.toFixed(1)}]{unit}
      </div>
    </div>
  );
};

interface TimeSeriesChartProps {
  data: { year: number; mean: number; p10: number; p90: number }[];
  label: string;
  unit?: string;
  color?: string;
  width?: number;
  height?: number;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  data,
  label,
  unit = '',
  color = '#3b82f6',
  width = 320,
  height = 180
}) => {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 35, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minX = Math.min(...data.map(d => d.year));
  const maxX = Math.max(...data.map(d => d.year));
  const maxY = Math.max(...data.map(d => d.p90), 1) * 1.1;
  const minY = 0;

  const xScale = (x: number) => {
    if (maxX === minX) return padding.left + chartWidth / 2;
    return padding.left + ((x - minX) / (maxX - minX)) * chartWidth;
  };
  const yScale = (y: number) => {
    if (maxY === minY) return padding.top + chartHeight / 2;
    return padding.top + chartHeight - ((y - minY) / (maxY - minY)) * chartHeight;
  };

  // Create path for confidence band
  const bandPath = `
    M ${data.map(d => `${xScale(d.year)},${yScale(d.p10)}`).join(' L ')}
    L ${[...data].reverse().map(d => `${xScale(d.year)},${yScale(d.p90)}`).join(' L ')}
    Z
  `;

  // Create path for mean line
  const meanPath = `M ${data.map(d => `${xScale(d.year)},${yScale(d.mean)}`).join(' L ')}`;

  const formatY = (y: number) => {
    if (y >= 1000) return `$${(y/1000).toFixed(0)}T`;
    return `$${y.toFixed(0)}B`;
  };

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartLabel}>{label}</div>
      <svg width={width} height={height} style={styles.chartSvg}>
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = minY + frac * (maxY - minY);
          return (
            <g key={frac}>
              <line
                x1={padding.left}
                y1={yScale(y)}
                x2={width - padding.right}
                y2={yScale(y)}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text x={padding.left - 8} y={yScale(y) + 4} fontSize={10} fill="#666" textAnchor="end">
                {formatY(y)}
              </text>
            </g>
          );
        })}

        {/* Confidence band */}
        <path d={bandPath} fill={color} opacity={0.2} />

        {/* Mean line */}
        <path d={meanPath} fill="none" stroke={color} strokeWidth={2} />

        {/* X-axis labels */}
        {data.filter((_, i) => i % 4 === 0).map(d => (
          <text key={d.year} x={xScale(d.year)} y={height - 8} fontSize={10} fill="#666" textAnchor="middle">
            {d.year}
          </text>
        ))}
      </svg>
    </div>
  );
};

// ============ SLIDER COMPONENT ============

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
  onChange: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  description,
  onChange
}) => {
  return (
    <div style={styles.sliderContainer}>
      <div style={styles.sliderHeader}>
        <label style={styles.sliderLabel}>{label}</label>
        <span style={styles.sliderValue}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={styles.slider}
      />
      <div style={styles.sliderRange}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
      {description && (
        <p style={styles.sliderDesc}>{description}</p>
      )}
    </div>
  );
};

// ============ MAIN DEMO COMPONENTS ============

export const TimelineModel: React.FC = () => {
  const [taiMean, setTaiMean] = useState(2035);
  const [taiUncertainty, setTaiUncertainty] = useState(5);
  const [alignmentDifficulty, setAlignmentDifficulty] = useState(50);

  const samples = useMemo(() => {
    const n = 1000;
    return Array.from({ length: n }, (_, i) =>
      normalSample(taiMean, taiUncertainty, i * 2)
    );
  }, [taiMean, taiUncertainty]);

  const pBefore2030 = samples.filter(s => s < 2030).length / samples.length;
  const pBefore2040 = samples.filter(s => s < 2040).length / samples.length;

  // Simple P(doom) calculation
  const alignmentSuccessRate = (100 - alignmentDifficulty) / 100;
  const timeAvailable = taiMean - 2024;
  const timePenalty = timeAvailable < 5 ? 0.3 : timeAvailable < 10 ? 0.6 : 1.0;
  const pAligned = alignmentSuccessRate * timePenalty;
  const pCatastropheGivenMisaligned = 0.6;
  const pDoom = (1 - pAligned) * pCatastropheGivenMisaligned;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>TAI Timeline & Risk Model</h3>

      <div style={styles.grid}>
        <div>
          <h4 style={styles.sectionTitle}>Inputs</h4>

          <Slider
            label="Expected TAI Year"
            value={taiMean}
            min={2026}
            max={2060}
            onChange={setTaiMean}
            description="When do you expect transformative AI?"
          />

          <Slider
            label="Timeline Uncertainty (std dev)"
            value={taiUncertainty}
            min={1}
            max={15}
            unit=" yrs"
            onChange={setTaiUncertainty}
            description="Higher = wider distribution"
          />

          <Slider
            label="Alignment Difficulty"
            value={alignmentDifficulty}
            min={10}
            max={90}
            unit="%"
            onChange={setAlignmentDifficulty}
            description="How hard is alignment to solve?"
          />
        </div>

        <div>
          <h4 style={styles.sectionTitle}>Outputs</h4>

          <DistributionChart
            samples={samples}
            label="TAI Year Distribution"
            color="#3b82f6"
          />

          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statValue}>
                {(pBefore2030 * 100).toFixed(0)}%
              </div>
              <div style={styles.statLabel}>P(TAI by 2030)</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statValue}>
                {(pBefore2040 * 100).toFixed(0)}%
              </div>
              <div style={styles.statLabel}>P(TAI by 2040)</div>
            </div>
          </div>

          <div style={{ ...styles.statBoxRed, marginTop: '16px' }}>
            <div style={styles.statValueRed}>
              {(pDoom * 100).toFixed(0)}%
            </div>
            <div style={styles.statLabel}>Implied P(Catastrophe)</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              = (1 - alignment success) × 0.6
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CyberRiskModel: React.FC = () => {
  const [taiYear, setTaiYear] = useState(2035);
  const [offenseAdvantage, setOffenseAdvantage] = useState(1.5);
  const [defenseAdaptation, setDefenseAdaptation] = useState(0.7);

  const timeSeriesData = useMemo(() => {
    const years = Array.from({ length: 17 }, (_, i) => 2024 + i);
    const nSamples = 100;

    return years.map(year => {
      const samples = Array.from({ length: nSamples }, (_, i) => {
        const baseCapability = 0.3;
        const yearlyGrowth = 0.12;
        const preTaiCapability = baseCapability * Math.pow(1 + yearlyGrowth, year - 2024);
        const taiMultiplier = year >= taiYear ? 3 + Math.abs(lognormalSample(0, 0.3, i * year)) : 1;
        const aiOffense = Math.min(1, preTaiCapability * taiMultiplier) * offenseAdvantage;

        const humanDefense = 0.25 * Math.pow(1 + 0.08, year - 2024);
        const aiDefense = year >= taiYear ? aiOffense * defenseAdaptation * 0.5 : 0;
        const totalDefense = Math.max(humanDefense, aiDefense);

        const gap = Math.max(0, aiOffense - totalDefense);
        const baseDamage = 500;
        return baseDamage * (1 + gap * 12);
      });

      return {
        year,
        mean: samples.reduce((a, b) => a + b, 0) / samples.length,
        p10: percentile(samples, 0.1),
        p90: percentile(samples, 0.9)
      };
    });
  }, [taiYear, offenseAdvantage, defenseAdaptation]);

  const peakYear = timeSeriesData.reduce((max, d) => d.mean > max.mean ? d : max, timeSeriesData[0]);
  const cumulative = timeSeriesData.reduce((sum, d) => sum + d.mean, 0);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>AI-Enabled Cyber Risk Over Time</h3>

      <div style={styles.grid}>
        <div>
          <h4 style={styles.sectionTitle}>Inputs</h4>

          <Slider
            label="TAI Year"
            value={taiYear}
            min={2026}
            max={2045}
            onChange={setTaiYear}
            description="When AI capabilities jump"
          />

          <Slider
            label="Offense Advantage"
            value={offenseAdvantage}
            min={0.5}
            max={3}
            step={0.1}
            unit="x"
            onChange={setOffenseAdvantage}
            description="How much AI favors attackers"
          />

          <Slider
            label="Defense Adaptation"
            value={defenseAdaptation}
            min={0.3}
            max={1}
            step={0.05}
            onChange={setDefenseAdaptation}
            description="How quickly defenses catch up"
          />
        </div>

        <div>
          <h4 style={styles.sectionTitle}>Projected Annual Damage</h4>

          <TimeSeriesChart
            data={timeSeriesData}
            label="Cyber damage (shaded = 80% CI)"
            color="#ef4444"
          />

          <div style={styles.statsGrid}>
            <div style={{ ...styles.statBox, backgroundColor: '#fef3c7' }}>
              <div style={{ ...styles.statValue, color: '#d97706' }}>
                {peakYear.year}
              </div>
              <div style={styles.statLabel}>Peak vulnerability</div>
            </div>
            <div style={{ ...styles.statBox, backgroundColor: '#fef3c7' }}>
              <div style={{ ...styles.statValue, color: '#d97706', fontSize: '22px' }}>
                ${(cumulative / 1000).toFixed(1)}T
              </div>
              <div style={styles.statLabel}>Cumulative damage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AlignmentDecomposition: React.FC = () => {
  const [pInterpretability, setPInterpretability] = useState(35);
  const [pSpecification, setPSpecification] = useState(45);
  const [pRobustness, setPRobustness] = useState(25);
  const [pNoDeception, setPNoDeception] = useState(55);

  const pSuccess = (pInterpretability / 100) *
                   (pSpecification / 100) *
                   (pRobustness / 100) *
                   (pNoDeception / 100);

  const factors = [
    { name: 'Interpretability Solved', p: pInterpretability, setP: setPInterpretability, color: '#3b82f6' },
    { name: 'Goals Specifiable', p: pSpecification, setP: setPSpecification, color: '#8b5cf6' },
    { name: 'Robustness Achieved', p: pRobustness, setP: setPRobustness, color: '#06b6d4' },
    { name: 'No Deceptive Alignment', p: pNoDeception, setP: setPNoDeception, color: '#10b981' },
  ];

  const resultColor = pSuccess > 0.3 ? '#10b981' : pSuccess > 0.1 ? '#f59e0b' : '#ef4444';
  const resultBg = pSuccess > 0.3 ? '#ecfdf5' : pSuccess > 0.1 ? '#fffbeb' : '#fef2f2';

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Alignment Success Decomposition</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
        Alignment requires solving multiple sub-problems. See how uncertainty compounds:
      </p>

      <div style={styles.grid}>
        <div>
          {factors.map((factor, i) => (
            <Slider
              key={i}
              label={factor.name}
              value={factor.p}
              min={5}
              max={95}
              unit="%"
              onChange={factor.setP}
            />
          ))}
        </div>

        <div>
          <h4 style={styles.sectionTitle}>Compound Probability</h4>

          <div style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
            {factors.map((f, i) => (
              <span key={i}>
                <span style={{ color: f.color }}>{f.p}%</span>
                {i < factors.length - 1 && <span style={{ color: '#9ca3af' }}> × </span>}
              </span>
            ))}
            <span style={{ color: '#9ca3af' }}> = </span>
            <strong>{(pSuccess * 100).toFixed(1)}%</strong>
          </div>

          {/* Bar visualization */}
          <div style={{ marginBottom: '16px' }}>
            {factors.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '100px', fontSize: '12px', color: '#6b7280' }}>
                  {f.name.split(' ')[0]}
                </div>
                <div style={{ flex: 1, backgroundColor: '#e5e7eb', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${f.p}%`, height: '100%', backgroundColor: f.color, borderRadius: '4px' }} />
                </div>
                <div style={{ width: '40px', fontSize: '12px', textAlign: 'right' }}>{f.p}%</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: resultBg, border: `1px solid ${resultColor}33` }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: resultColor }}>
              {(pSuccess * 100).toFixed(1)}%
            </div>
            <div style={styles.statLabel}>P(Alignment Success)</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
              Assumes independence. Reality may have correlations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExpertComparison: React.FC = () => {
  const [userTaiYear, setUserTaiYear] = useState(2035);
  const [userAlignmentDifficulty, setUserAlignmentDifficulty] = useState(50);
  const [userPDoom, setUserPDoom] = useState(15);

  const experts = [
    { name: 'Yudkowsky', taiYear: 2030, alignmentDiff: 85, pDoom: 90, color: '#ef4444' },
    { name: 'Christiano', taiYear: 2040, alignmentDiff: 50, pDoom: 15, color: '#3b82f6' },
    { name: 'Anthropic', taiYear: 2032, alignmentDiff: 45, pDoom: 18, color: '#8b5cf6' },
    { name: 'OpenAI', taiYear: 2030, alignmentDiff: 35, pDoom: 12, color: '#10b981' },
    { name: 'LeCun', taiYear: 2050, alignmentDiff: 20, pDoom: 2, color: '#f59e0b' },
  ];

  const distances = experts.map(e => {
    const taiDiff = Math.abs(e.taiYear - userTaiYear) / 20;
    const alignDiff = Math.abs(e.alignmentDiff - userAlignmentDifficulty) / 100;
    const doomDiff = Math.abs(e.pDoom - userPDoom) / 100;
    return { ...e, distance: Math.sqrt(taiDiff ** 2 + alignDiff ** 2 + doomDiff ** 2) };
  }).sort((a, b) => a.distance - b.distance);

  const closest = distances[0];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Compare Your Views to Experts</h3>

      <div style={styles.grid}>
        <div>
          <h4 style={styles.sectionTitle}>Your Views</h4>

          <Slider
            label="Expected TAI Year"
            value={userTaiYear}
            min={2026}
            max={2060}
            onChange={setUserTaiYear}
          />

          <Slider
            label="Alignment Difficulty"
            value={userAlignmentDifficulty}
            min={10}
            max={90}
            unit="%"
            onChange={setUserAlignmentDifficulty}
          />

          <Slider
            label="P(Doom)"
            value={userPDoom}
            min={1}
            max={95}
            unit="%"
            onChange={setUserPDoom}
          />
        </div>

        <div>
          <h4 style={styles.sectionTitle}>Expert Comparison</h4>

          <div>
            {experts.map((e, i) => {
              const isClosest = e.name === closest.name;
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px',
                    marginBottom: '8px',
                    borderRadius: '6px',
                    border: isClosest ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: isClosest ? '#eff6ff' : '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, color: e.color }}>{e.name}</span>
                    {isClosest && (
                      <span style={{ fontSize: '11px', backgroundColor: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                        Closest
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    TAI: {e.taiYear} · Difficulty: {e.alignmentDiff}% · P(doom): {e.pDoom}%
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
            <div style={{ fontSize: '14px' }}>
              <strong>Closest to:</strong>{' '}
              <span style={{ color: closest.color }}>{closest.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProbabilityModelDemo: React.FC = () => {
  return (
    <div>
      <TimelineModel />
      <CyberRiskModel />
      <AlignmentDecomposition />
      <ExpertComparison />
    </div>
  );
};

export default ProbabilityModelDemo;
