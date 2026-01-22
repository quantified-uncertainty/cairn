/**
 * Risk Trajectory Visualizations
 *
 * Visualize AI transition risk over time, showing:
 * - Catastrophe risk by pathway (AI Takeover, Human-Caused)
 * - Lock-in severity by type (Economic, Political, Epistemic, Values, Suffering)
 * - Factor attribution (how root factors drive outcomes)
 */

import React, { useState, useMemo } from 'react';

// ============================================================================
// Shared Utilities
// ============================================================================

function seededRandom(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

function StatLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-slate-400 leading-normal">{children}</div>
  );
}

// ============================================================================
// Data Generation
// ============================================================================

interface TimePoint {
  year: number;
  phase: 'current' | 'near-tai' | 'tai' | 'post-tai';
}

const timePoints: TimePoint[] = [
  { year: 2025, phase: 'current' },
  { year: 2028, phase: 'current' },
  { year: 2031, phase: 'near-tai' },
  { year: 2034, phase: 'near-tai' },
  { year: 2037, phase: 'tai' },
  { year: 2040, phase: 'tai' },
  { year: 2045, phase: 'post-tai' },
  { year: 2050, phase: 'post-tai' },
  { year: 2060, phase: 'post-tai' },
];

// Catastrophe pathways from AI Transition Model
const catastrophePathways = [
  { id: 'takeover-rapid', label: 'AI Takeover (Rapid)', color: '#dc2626' },
  { id: 'takeover-gradual', label: 'AI Takeover (Gradual)', color: '#ef4444' },
  { id: 'human-state', label: 'Human Catastrophe (State)', color: '#f97316' },
  { id: 'human-rogue', label: 'Human Catastrophe (Rogue)', color: '#fb923c' },
];

// Lock-in types from AI Transition Model
const lockInTypes = [
  { id: 'economic', label: 'Economic Lock-in', color: '#1e3a8a' },
  { id: 'political', label: 'Political Lock-in', color: '#3730a3' },
  { id: 'epistemic', label: 'Epistemic Lock-in', color: '#6d28d9' },
  { id: 'values', label: 'Values Lock-in', color: '#a21caf' },
  { id: 'suffering', label: 'Suffering Lock-in', color: '#db2777' },
];

// Root factors from AI Transition Model
const rootFactors = [
  { id: 'misalignment', label: 'Misalignment Potential', color: '#ef4444' },
  { id: 'misuse', label: 'Misuse Potential', color: '#f97316' },
  { id: 'capabilities', label: 'AI Capabilities', color: '#3b82f6' },
  { id: 'ownership', label: 'AI Ownership', color: '#8b5cf6' },
  { id: 'competence', label: 'Civilizational Competence', color: '#6b7280' },
  { id: 'turbulence', label: 'Transition Turbulence', color: '#eab308' },
];

function generateCatastropheData(seed: number = 42) {
  const random = seededRandom(seed);

  return timePoints.map((tp, i) => {
    const progress = i / (timePoints.length - 1);
    const taiMultiplier = tp.phase === 'tai' ? 1.8 : tp.phase === 'post-tai' ? 1.2 : 1;

    return {
      ...tp,
      'takeover-rapid': Math.min(18, 0.5 + progress * 12 * taiMultiplier + random() * 3),
      'takeover-gradual': Math.min(12, 1 + progress * 8 + random() * 2),
      'human-state': Math.min(8, 2 + progress * 4 * (tp.phase === 'near-tai' ? 1.5 : 1) + random() * 1.5),
      'human-rogue': Math.min(6, 1.5 + progress * 3 + random() * 1),
    };
  });
}

function generateLockInData(seed: number = 43) {
  const random = seededRandom(seed);

  return timePoints.map((tp, i) => {
    const progress = i / (timePoints.length - 1);

    return {
      ...tp,
      economic: 15 + progress * 25 + random() * 5,
      political: 10 + progress * 20 + random() * 4,
      epistemic: 5 + progress * 18 + random() * 3,
      values: 3 + progress * 12 + random() * 2,
      suffering: 2 + progress * 8 + random() * 1.5,
    };
  });
}

function generateFactorContributions(seed: number = 44) {
  const random = seededRandom(seed);

  return {
    catastrophe: {
      misalignment: 35 + random() * 10,
      misuse: 20 + random() * 8,
      capabilities: 25 + random() * 8,
      ownership: 8 + random() * 5,
      competence: 7 + random() * 4,
      turbulence: 5 + random() * 3,
    },
    lockIn: {
      misalignment: 15 + random() * 5,
      misuse: 10 + random() * 5,
      capabilities: 20 + random() * 8,
      ownership: 30 + random() * 10,
      competence: 15 + random() * 5,
      turbulence: 10 + random() * 4,
    },
  };
}

// ============================================================================
// VISUALIZATION 1: Split Stacked Area Chart
// ============================================================================

// Generate factor-based data for "By Factor" view
function generateFactorCatastropheData(seed: number = 50) {
  const random = seededRandom(seed);
  const factorWeights = {
    misalignment: 0.35,
    misuse: 0.20,
    capabilities: 0.25,
    ownership: 0.08,
    competence: 0.07,
    turbulence: 0.05,
  };

  return timePoints.map((tp, i) => {
    const progress = i / (timePoints.length - 1);
    const taiMultiplier = tp.phase === 'tai' ? 1.8 : tp.phase === 'post-tai' ? 1.2 : 1;
    const baseRisk = 5 + progress * 30 * taiMultiplier;

    return {
      ...tp,
      misalignment: baseRisk * factorWeights.misalignment + random() * 3,
      misuse: baseRisk * factorWeights.misuse + random() * 2,
      capabilities: baseRisk * factorWeights.capabilities + random() * 2,
      ownership: baseRisk * factorWeights.ownership + random() * 1,
      competence: baseRisk * factorWeights.competence + random() * 1,
      turbulence: baseRisk * factorWeights.turbulence + random() * 0.5,
    };
  });
}

function generateFactorLockInData(seed: number = 51) {
  const random = seededRandom(seed);
  const factorWeights = {
    misalignment: 0.15,
    misuse: 0.10,
    capabilities: 0.20,
    ownership: 0.30,
    competence: 0.15,
    turbulence: 0.10,
  };

  return timePoints.map((tp, i) => {
    const progress = i / (timePoints.length - 1);
    const baseValue = 10 + progress * 80;

    return {
      ...tp,
      misalignment: baseValue * factorWeights.misalignment + random() * 5,
      misuse: baseValue * factorWeights.misuse + random() * 3,
      capabilities: baseValue * factorWeights.capabilities + random() * 5,
      ownership: baseValue * factorWeights.ownership + random() * 8,
      competence: baseValue * factorWeights.competence + random() * 4,
      turbulence: baseValue * factorWeights.turbulence + random() * 3,
    };
  });
}

export function DualOutcomeChart({
  width = 900,
  height = 400,
}: {
  width?: number;
  height?: number;
}) {
  const [viewMode, setViewMode] = useState<'pathways' | 'factors'>('pathways');
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);

  // Pathway-based data
  const catastropheData = useMemo(() => generateCatastropheData(), []);
  const lockInData = useMemo(() => generateLockInData(), []);

  // Factor-based data
  const factorCatastropheData = useMemo(() => generateFactorCatastropheData(), []);
  const factorLockInData = useMemo(() => generateFactorLockInData(), []);

  const margin = { top: 40, right: 20, bottom: 50, left: 50 };
  const chartWidth = (width - margin.left - margin.right - 40) / 2;
  const chartHeight = height - margin.top - margin.bottom;

  // Items to stack based on view mode
  const catastropheItems = viewMode === 'pathways' ? catastrophePathways : rootFactors;
  const lockInItems = viewMode === 'pathways' ? lockInTypes : rootFactors;
  const catData = viewMode === 'pathways' ? catastropheData : factorCatastropheData;
  const lockData = viewMode === 'pathways' ? lockInData : factorLockInData;

  // Calculate stacked areas for catastrophe
  const catastropheStacked = useMemo(() => {
    return catData.map((d) => {
      let y0 = 0;
      const stacks = catastropheItems.map((item) => {
        const value = d[item.id as keyof typeof d] as number;
        const result = { y0, y1: y0 + value, item };
        y0 += value;
        return result;
      });
      return { ...d, stacks, total: y0 };
    });
  }, [catData, catastropheItems]);

  // Calculate stacked areas for lock-in
  const lockInStacked = useMemo(() => {
    return lockData.map((d) => {
      let y0 = 0;
      const stacks = lockInItems.map((item) => {
        const value = d[item.id as keyof typeof d] as number;
        const result = { y0, y1: y0 + value, item };
        y0 += value;
        return result;
      });
      return { ...d, stacks, total: y0 };
    });
  }, [lockData, lockInItems]);

  const maxCatastrophe = Math.max(...catastropheStacked.map((d) => d.total));
  const maxLockIn = Math.max(...lockInStacked.map((d) => d.total));

  // Scale functions
  const xScale = (i: number) => (i / (timePoints.length - 1)) * chartWidth;
  const yCatastropheScale = (v: number) => chartHeight - (v / 50) * chartHeight;
  const yLockInScale = (v: number) => chartHeight - (v / 100) * chartHeight;

  // Generate SVG path for stacked area
  const generateAreaPath = (
    data: typeof catastropheStacked,
    itemId: string,
    yScale: (v: number) => number
  ) => {
    const points = data.map((d, i) => {
      const stack = d.stacks.find((s) => s.item.id === itemId);
      return {
        x: xScale(i),
        y0: yScale(stack?.y0 ?? 0),
        y1: yScale(stack?.y1 ?? 0),
      };
    });

    const topLine = points.map((p) => `${p.x},${p.y1}`).join(' L ');
    const bottomLine = points
      .slice()
      .reverse()
      .map((p) => `${p.x},${p.y0}`)
      .join(' L ');

    return `M ${topLine} L ${bottomLine} Z`;
  };

  // Phase markers
  const phaseMarkers = [
    { year: 2025, label: 'Current' },
    { year: 2034, label: 'Near-TAI' },
    { year: 2037, label: 'TAI', highlight: true },
    { year: 2050, label: 'Post-TAI' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>
          Risk trajectories from present to 2060
        </StatLine>
        <div className="flex gap-1.5">
          <ToggleButton
            active={viewMode === 'pathways'}
            onClick={() => setViewMode('pathways')}
          >
            By Pathway
          </ToggleButton>
          <ToggleButton
            active={viewMode === 'factors'}
            onClick={() => setViewMode('factors')}
          >
            By Factor
          </ToggleButton>
        </div>
      </div>

      <div className="flex gap-4">
        {/* LEFT: Catastrophe Risk */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-300 mb-2 text-center">
            Cumulative Catastrophe Risk
          </div>
          <svg
            width={chartWidth + margin.left + margin.right}
            height={height}
            className="bg-slate-950 rounded-lg border border-slate-800"
          >
            <defs>
              <linearGradient id="catastrophe-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Background */}
              <rect
                width={chartWidth}
                height={chartHeight}
                fill="url(#catastrophe-bg)"
                rx={4}
              />

              {/* Grid lines */}
              {[0, 10, 20, 30, 40, 50].map((v) => (
                <g key={v}>
                  <line
                    x1={0}
                    y1={yCatastropheScale(v)}
                    x2={chartWidth}
                    y2={yCatastropheScale(v)}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray={v === 0 ? 'none' : '2,2'}
                  />
                  <text
                    x={-8}
                    y={yCatastropheScale(v) + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px]"
                  >
                    {v}%
                  </text>
                </g>
              ))}

              {/* Stacked areas */}
              {catastropheItems.map((item) => (
                <path
                  key={item.id}
                  d={generateAreaPath(catastropheStacked, item.id, yCatastropheScale)}
                  fill={item.color}
                  fillOpacity={hoveredArea === item.id ? 0.9 : 0.7}
                  stroke={item.color}
                  strokeWidth={hoveredArea === item.id ? 2 : 0}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredArea(item.id)}
                  onMouseLeave={() => setHoveredArea(null)}
                />
              ))}

              {/* TAI marker */}
              <line
                x1={xScale(4)}
                y1={0}
                x2={xScale(4)}
                y2={chartHeight}
                stroke="#fff"
                strokeWidth={2}
                strokeDasharray="4,4"
                opacity={0.5}
              />
              <text
                x={xScale(4)}
                y={-10}
                textAnchor="middle"
                className="fill-white text-[10px] font-medium"
              >
                TAI
              </text>

              {/* X-axis labels */}
              {timePoints
                .filter((_, i) => i % 2 === 0)
                .map((tp, i) => (
                  <text
                    key={tp.year}
                    x={xScale(i * 2)}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px]"
                  >
                    {tp.year}
                  </text>
                ))}
            </g>
          </svg>
        </div>

        {/* Divider */}
        <div className="w-px bg-slate-700" />

        {/* RIGHT: Lock-in Severity */}
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-300 mb-2 text-center">
            Lock-in Severity Index
          </div>
          <svg
            width={chartWidth + margin.left + margin.right}
            height={height}
            className="bg-slate-950 rounded-lg border border-slate-800"
          >
            <defs>
              <linearGradient id="lockin-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#1e293b" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Background */}
              <rect
                width={chartWidth}
                height={chartHeight}
                fill="url(#lockin-bg)"
                rx={4}
              />

              {/* Grid lines */}
              {[0, 20, 40, 60, 80, 100].map((v) => (
                <g key={v}>
                  <line
                    x1={0}
                    y1={yLockInScale(v)}
                    x2={chartWidth}
                    y2={yLockInScale(v)}
                    stroke="rgba(255,255,255,0.1)"
                    strokeDasharray={v === 0 ? 'none' : '2,2'}
                  />
                  <text
                    x={-8}
                    y={yLockInScale(v) + 4}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px]"
                  >
                    {v}
                  </text>
                </g>
              ))}

              {/* Stacked areas */}
              {lockInItems.map((item) => (
                <path
                  key={item.id}
                  d={generateAreaPath(lockInStacked as any, item.id, yLockInScale)}
                  fill={item.color}
                  fillOpacity={hoveredArea === item.id ? 0.9 : 0.7}
                  stroke={item.color}
                  strokeWidth={hoveredArea === item.id ? 2 : 0}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredArea(item.id)}
                  onMouseLeave={() => setHoveredArea(null)}
                />
              ))}

              {/* TAI marker */}
              <line
                x1={xScale(4)}
                y1={0}
                x2={xScale(4)}
                y2={chartHeight}
                stroke="#fff"
                strokeWidth={2}
                strokeDasharray="4,4"
                opacity={0.5}
              />
              <text
                x={xScale(4)}
                y={-10}
                textAnchor="middle"
                className="fill-white text-[10px] font-medium"
              >
                TAI
              </text>

              {/* X-axis labels */}
              {timePoints
                .filter((_, i) => i % 2 === 0)
                .map((tp, i) => (
                  <text
                    key={tp.year}
                    x={xScale(i * 2)}
                    y={chartHeight + 20}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px]"
                  >
                    {tp.year}
                  </text>
                ))}
            </g>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-8 justify-center">
        {viewMode === 'pathways' ? (
          <>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Catastrophe Pathways</div>
              <div className="flex flex-wrap gap-3">
                {catastrophePathways.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${
                      hoveredArea && hoveredArea !== p.id ? 'opacity-40' : ''
                    }`}
                    onMouseEnter={() => setHoveredArea(p.id)}
                    onMouseLeave={() => setHoveredArea(null)}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-slate-300">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-medium">Lock-in Types</div>
              <div className="flex flex-wrap gap-3">
                {lockInTypes.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${
                      hoveredArea && hoveredArea !== t.id ? 'opacity-40' : ''
                    }`}
                    onMouseEnter={() => setHoveredArea(t.id)}
                    onMouseLeave={() => setHoveredArea(null)}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-slate-300">{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-medium">Root Factors (contribution to both outcomes)</div>
            <div className="flex flex-wrap gap-3">
              {rootFactors.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center gap-1.5 text-xs cursor-pointer transition-opacity ${
                    hoveredArea && hoveredArea !== f.id ? 'opacity-40' : ''
                  }`}
                  onMouseEnter={() => setHoveredArea(f.id)}
                  onMouseLeave={() => setHoveredArea(null)}
                >
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: f.color }}
                  />
                  <span className="text-slate-300">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 2: Factor Attribution Matrix (with sparklines)
// ============================================================================

export function FactorAttributionMatrix({
  width = 900,
  height = 400,
}: {
  width?: number;
  height?: number;
}) {
  const [hoveredCell, setHoveredCell] = useState<{
    factor: string;
    outcome: string;
  } | null>(null);

  // Generate time-series data for each factor's contribution
  const factorTimeSeriesData = useMemo(() => {
    const random = seededRandom(55);

    return rootFactors.map((factor) => {
      // Base weights that evolve over time
      const catBaseWeight = {
        misalignment: 0.35,
        misuse: 0.20,
        capabilities: 0.25,
        ownership: 0.08,
        competence: 0.07,
        turbulence: 0.05,
      }[factor.id] || 0.1;

      const lockBaseWeight = {
        misalignment: 0.15,
        misuse: 0.10,
        capabilities: 0.20,
        ownership: 0.30,
        competence: 0.15,
        turbulence: 0.10,
      }[factor.id] || 0.1;

      const catastropheSeries = timePoints.map((tp, i) => {
        const progress = i / (timePoints.length - 1);
        const taiBoost = tp.phase === 'tai' ? 1.3 : tp.phase === 'post-tai' ? 1.1 : 1;
        return catBaseWeight * 100 * taiBoost * (0.8 + progress * 0.4) + random() * 5;
      });

      const lockInSeries = timePoints.map((tp, i) => {
        const progress = i / (timePoints.length - 1);
        return lockBaseWeight * 100 * (0.7 + progress * 0.6) + random() * 4;
      });

      return {
        factor,
        catastrophe: {
          series: catastropheSeries,
          current: catastropheSeries[0],
          final: catastropheSeries[catastropheSeries.length - 1],
          trend: catastropheSeries[catastropheSeries.length - 1] > catastropheSeries[0] ? 'up' : 'down',
        },
        lockIn: {
          series: lockInSeries,
          current: lockInSeries[0],
          final: lockInSeries[lockInSeries.length - 1],
          trend: lockInSeries[lockInSeries.length - 1] > lockInSeries[0] ? 'up' : 'down',
        },
      };
    });
  }, []);

  const cellWidth = 115;
  const cellHeight = 70;
  const labelWidth = 120;
  const headerHeight = 50;
  const sparkWidth = 55;
  const sparkHeight = 30;

  const outcomes = [
    { id: 'catastrophe', label: 'Catastrophe Risk', colorBase: '#ef4444', colorLight: '#fca5a5' },
    { id: 'lockIn', label: 'Lock-in Severity', colorBase: '#8b5cf6', colorLight: '#c4b5fd' },
  ];

  // Mini sparkline component
  const Sparkline = ({ data, color, width: w, height: h }: { data: number[]; color: string; width: number; height: number }) => {
    const max = Math.max(...data) * 1.1;
    const min = Math.min(...data) * 0.9;
    const range = max - min;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');

    // Area path
    const areaPath = `M 0,${h} L ${points} L ${w},${h} Z`;

    return (
      <svg width={w} height={h}>
        <path d={areaPath} fill={color} fillOpacity={0.2} />
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} />
        <circle cx={w} cy={h - ((data[data.length - 1] - min) / range) * h} r={2.5} fill={color} />
      </svg>
    );
  };

  return (
    <div className="space-y-4">
      <StatLine>
        Factor contributions over time — sparklines show trajectory from 2025 to 2060
      </StatLine>

      <svg
        width={width}
        height={height}
        className="bg-slate-950 rounded-lg border border-slate-800"
      >
        <g transform={`translate(${labelWidth}, ${headerHeight})`}>
          {/* Column headers (factors) */}
          {rootFactors.map((factor, i) => (
            <g key={factor.id} transform={`translate(${i * cellWidth}, 0)`}>
              <rect
                x={2}
                y={-headerHeight + 5}
                width={cellWidth - 4}
                height={headerHeight - 8}
                rx={4}
                fill={factor.color}
                fillOpacity={0.15}
              />
              <text
                x={cellWidth / 2}
                y={-headerHeight + 22}
                textAnchor="middle"
                className="fill-slate-200 text-[11px] font-medium"
              >
                {factor.label.split(' ')[0]}
              </text>
              <text
                x={cellWidth / 2}
                y={-headerHeight + 36}
                textAnchor="middle"
                className="fill-slate-500 text-[9px]"
              >
                {factor.label.split(' ').slice(1).join(' ')}
              </text>
            </g>
          ))}

          {/* Row labels */}
          {outcomes.map((outcome, rowIdx) => (
            <g key={outcome.id} transform={`translate(-${labelWidth}, ${rowIdx * (cellHeight + 10)})`}>
              <text
                x={labelWidth - 10}
                y={cellHeight / 2 + 4}
                textAnchor="end"
                className="fill-slate-200 text-sm font-medium"
              >
                {outcome.label}
              </text>
            </g>
          ))}

          {/* Cells */}
          {outcomes.map((outcome, rowIdx) => (
            <g key={outcome.id} transform={`translate(0, ${rowIdx * (cellHeight + 10)})`}>
              {factorTimeSeriesData.map((factorData, colIdx) => {
                const data = outcome.id === 'catastrophe' ? factorData.catastrophe : factorData.lockIn;
                const isHovered =
                  hoveredCell?.factor === factorData.factor.id &&
                  hoveredCell?.outcome === outcome.id;

                return (
                  <g
                    key={factorData.factor.id}
                    transform={`translate(${colIdx * cellWidth}, 0)`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCell({ factor: factorData.factor.id, outcome: outcome.id })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <rect
                      x={2}
                      y={2}
                      width={cellWidth - 4}
                      height={cellHeight - 4}
                      rx={6}
                      fill={outcome.colorBase}
                      fillOpacity={isHovered ? 0.25 : 0.1}
                      stroke={isHovered ? outcome.colorLight : 'rgba(255,255,255,0.08)'}
                      strokeWidth={isHovered ? 2 : 1}
                    />

                    {/* Sparkline */}
                    <g transform={`translate(${(cellWidth - sparkWidth) / 2}, 8)`}>
                      <Sparkline
                        data={data.series}
                        color={outcome.colorBase}
                        width={sparkWidth}
                        height={sparkHeight}
                      />
                    </g>

                    {/* Values */}
                    <text
                      x={cellWidth / 2}
                      y={cellHeight - 12}
                      textAnchor="middle"
                      className="fill-slate-300 text-[11px] font-mono"
                    >
                      {data.current.toFixed(0)} → {data.final.toFixed(0)}%
                    </text>

                    {/* Trend indicator */}
                    <text
                      x={cellWidth - 12}
                      y={16}
                      className={`text-[10px] ${data.trend === 'up' ? 'fill-red-400' : 'fill-green-400'}`}
                    >
                      {data.trend === 'up' ? '↑' : '↓'}
                    </text>
                  </g>
                );
              })}
            </g>
          ))}
        </g>
      </svg>

      {hoveredCell && (
        <div className="p-4 bg-slate-800/95 border border-slate-700 rounded-lg inline-block">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: rootFactors.find((f) => f.id === hoveredCell.factor)?.color }}
            />
            <p className="text-sm font-medium text-slate-200">
              {rootFactors.find((f) => f.id === hoveredCell.factor)?.label}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Impact on {outcomes.find((o) => o.id === hoveredCell.outcome)?.label.toLowerCase()}:{' '}
            <span className="font-mono text-slate-200">
              {factorTimeSeriesData
                .find((f) => f.factor.id === hoveredCell.factor)
                ?.[hoveredCell.outcome as 'catastrophe' | 'lockIn'].current.toFixed(1)}%
            </span>
            {' → '}
            <span className="font-mono text-slate-200">
              {factorTimeSeriesData
                .find((f) => f.factor.id === hoveredCell.factor)
                ?.[hoveredCell.outcome as 'catastrophe' | 'lockIn'].final.toFixed(1)}%
            </span>
            {' by 2060'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VISUALIZATION 3: Factor Gauges
// ============================================================================

export function FactorGauges() {
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);

  const factorLevels = useMemo(() => {
    const random = seededRandom(45);
    return rootFactors.map((f) => ({
      ...f,
      currentLevel: 30 + random() * 50,
      trend: random() > 0.5 ? 'increasing' : random() > 0.3 ? 'stable' : 'decreasing',
    }));
  }, []);

  return (
    <div className="space-y-4">
      <StatLine>Current root factor levels (affects both outcomes)</StatLine>

      <div className="grid grid-cols-3 gap-4">
        {factorLevels.map((factor) => {
          const isHovered = hoveredFactor === factor.id;
          return (
            <div
              key={factor.id}
              className={`p-3 bg-slate-900 border rounded-lg cursor-pointer transition-all ${
                isHovered ? 'border-slate-500 scale-[1.02]' : 'border-slate-800'
              }`}
              onMouseEnter={() => setHoveredFactor(factor.id)}
              onMouseLeave={() => setHoveredFactor(null)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-300">{factor.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    factor.trend === 'increasing'
                      ? 'bg-red-900/50 text-red-400'
                      : factor.trend === 'decreasing'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {factor.trend === 'increasing' ? '↑' : factor.trend === 'decreasing' ? '↓' : '→'}
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${factor.currentLevel}%`,
                    backgroundColor: factor.color,
                    opacity: isHovered ? 1 : 0.7,
                  }}
                />
              </div>
              <div className="mt-1 text-right">
                <span className="text-xs font-mono text-slate-400">
                  {factor.currentLevel.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 4: Combined Dashboard
// ============================================================================

export function RiskDashboard() {
  return (
    <div className="space-y-8">
      <DualOutcomeChart width={900} height={350} />
      <div className="border-t border-slate-700 pt-6">
        <FactorAttributionMatrix width={700} height={160} />
      </div>
      <div className="border-t border-slate-700 pt-6">
        <FactorGauges />
      </div>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 5: Trajectory Lines (Alternative View)
// ============================================================================

export function TrajectoryLines({
  width = 800,
  height = 400,
}: {
  width?: number;
  height?: number;
}) {
  const [showConfidence, setShowConfidence] = useState(true);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  const catastropheData = useMemo(() => generateCatastropheData(), []);

  const margin = { top: 40, right: 120, bottom: 50, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xScale = (i: number) => (i / (timePoints.length - 1)) * chartWidth;
  const yScale = (v: number) => chartHeight - (v / 50) * chartHeight;

  // Calculate cumulative totals for each point
  const totals = catastropheData.map((d) => {
    return (
      (d['takeover-rapid'] as number) +
      (d['takeover-gradual'] as number) +
      (d['human-state'] as number) +
      (d['human-rogue'] as number)
    );
  });

  const generateLinePath = (pathwayId: string) => {
    return catastropheData
      .map((d, i) => {
        const v = d[pathwayId as keyof typeof d] as number;
        return `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(v)}`;
      })
      .join(' ');
  };

  const generateConfidencePath = (pathwayId: string, offset: number) => {
    const upper = catastropheData.map((d, i) => {
      const v = (d[pathwayId as keyof typeof d] as number) + offset;
      return `${xScale(i)},${yScale(v)}`;
    });
    const lower = catastropheData
      .slice()
      .reverse()
      .map((d, i) => {
        const v = Math.max(0, (d[pathwayId as keyof typeof d] as number) - offset);
        return `${xScale(catastropheData.length - 1 - i)},${yScale(v)}`;
      });
    return `M ${upper.join(' L ')} L ${lower.join(' L ')} Z`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>Individual pathway trajectories with uncertainty bands</StatLine>
        <ToggleButton
          active={showConfidence}
          onClick={() => setShowConfidence(!showConfidence)}
        >
          {showConfidence ? 'Hide' : 'Show'} Confidence
        </ToggleButton>
      </div>

      <svg
        width={width}
        height={height}
        className="bg-slate-950 rounded-lg border border-slate-800"
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid */}
          {[0, 10, 20, 30, 40, 50].map((v) => (
            <g key={v}>
              <line
                x1={0}
                y1={yScale(v)}
                x2={chartWidth}
                y2={yScale(v)}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="2,2"
              />
              <text
                x={-10}
                y={yScale(v) + 4}
                textAnchor="end"
                className="fill-slate-500 text-[10px]"
              >
                {v}%
              </text>
            </g>
          ))}

          {/* TAI marker */}
          <line
            x1={xScale(4)}
            y1={0}
            x2={xScale(4)}
            y2={chartHeight}
            stroke="#fff"
            strokeWidth={2}
            strokeDasharray="4,4"
            opacity={0.3}
          />

          {/* Confidence bands */}
          {showConfidence &&
            catastrophePathways.map((pathway) => (
              <path
                key={`conf-${pathway.id}`}
                d={generateConfidencePath(pathway.id, 3)}
                fill={pathway.color}
                fillOpacity={hoveredLine === pathway.id ? 0.2 : 0.1}
              />
            ))}

          {/* Lines */}
          {catastrophePathways.map((pathway) => (
            <path
              key={pathway.id}
              d={generateLinePath(pathway.id)}
              fill="none"
              stroke={pathway.color}
              strokeWidth={hoveredLine === pathway.id ? 3 : 2}
              strokeOpacity={hoveredLine && hoveredLine !== pathway.id ? 0.3 : 1}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredLine(pathway.id)}
              onMouseLeave={() => setHoveredLine(null)}
            />
          ))}

          {/* Total line */}
          <path
            d={totals
              .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(v)}`)
              .join(' ')}
            fill="none"
            stroke="#fff"
            strokeWidth={hoveredLine === 'total' ? 3 : 2}
            strokeDasharray="6,3"
            strokeOpacity={hoveredLine && hoveredLine !== 'total' ? 0.3 : 0.8}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredLine('total')}
            onMouseLeave={() => setHoveredLine(null)}
          />

          {/* X-axis */}
          {timePoints.map((tp, i) => (
            <text
              key={tp.year}
              x={xScale(i)}
              y={chartHeight + 20}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {tp.year}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={-chartHeight / 2}
            y={-40}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-slate-400 text-xs"
          >
            Probability (%)
          </text>
        </g>

        {/* Legend */}
        <g transform={`translate(${width - margin.right + 20}, ${margin.top})`}>
          {[...catastrophePathways, { id: 'total', label: 'Total Risk', color: '#fff' }].map(
            (item, i) => (
              <g
                key={item.id}
                transform={`translate(0, ${i * 24})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredLine(item.id)}
                onMouseLeave={() => setHoveredLine(null)}
              >
                <line
                  x1={0}
                  y1={8}
                  x2={20}
                  y2={8}
                  stroke={item.color}
                  strokeWidth={2}
                  strokeDasharray={item.id === 'total' ? '6,3' : 'none'}
                />
                <text
                  x={28}
                  y={12}
                  className={`text-[10px] ${
                    hoveredLine === item.id ? 'fill-white' : 'fill-slate-400'
                  }`}
                >
                  {item.label}
                </text>
              </g>
            )
          )}
        </g>
      </svg>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 6: Scenario Comparison
// ============================================================================

const scenarios = [
  { id: 'optimistic', label: 'Optimistic', color: '#22c55e', multiplier: 0.5 },
  { id: 'baseline', label: 'Baseline', color: '#3b82f6', multiplier: 1.0 },
  { id: 'pessimistic', label: 'Pessimistic', color: '#ef4444', multiplier: 1.8 },
];

export function ScenarioComparison({
  width = 800,
  height = 350,
}: {
  width?: number;
  height?: number;
}) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['optimistic', 'baseline', 'pessimistic']);
  const [hoveredScenario, setHoveredScenario] = useState<string | null>(null);

  const margin = { top: 40, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const xScale = (i: number) => (i / (timePoints.length - 1)) * chartWidth;
  const yScale = (v: number) => chartHeight - (v / 60) * chartHeight;

  // Generate data for each scenario
  const scenarioData = useMemo(() => {
    return scenarios.map((scenario) => {
      const data = generateCatastropheData(42 + scenarios.indexOf(scenario));
      return {
        ...scenario,
        totals: data.map((d) => {
          const base =
            (d['takeover-rapid'] as number) +
            (d['takeover-gradual'] as number) +
            (d['human-state'] as number) +
            (d['human-rogue'] as number);
          return base * scenario.multiplier;
        }),
      };
    });
  }, []);

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>Compare catastrophe risk across scenarios</StatLine>
        <div className="flex gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => toggleScenario(s.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${
                selectedScenarios.includes(s.id)
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color, opacity: selectedScenarios.includes(s.id) ? 1 : 0.3 }}
              />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        width={width}
        height={height}
        className="bg-slate-950 rounded-lg border border-slate-800"
      >
        <defs>
          {scenarios.map((s) => (
            <linearGradient key={s.id} id={`gradient-${s.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.05" />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid */}
          {[0, 10, 20, 30, 40, 50, 60].map((v) => (
            <g key={v}>
              <line
                x1={0}
                y1={yScale(v)}
                x2={chartWidth}
                y2={yScale(v)}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="2,2"
              />
              <text x={-10} y={yScale(v) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {v}%
              </text>
            </g>
          ))}

          {/* TAI marker */}
          <line
            x1={xScale(4)}
            y1={0}
            x2={xScale(4)}
            y2={chartHeight}
            stroke="#fff"
            strokeWidth={2}
            strokeDasharray="4,4"
            opacity={0.3}
          />
          <text x={xScale(4)} y={-10} textAnchor="middle" className="fill-white text-[10px] font-medium">
            TAI
          </text>

          {/* Areas and lines */}
          {scenarioData
            .filter((s) => selectedScenarios.includes(s.id))
            .map((scenario) => {
              const isHovered = hoveredScenario === scenario.id;
              const areaPath = `
                M ${scenario.totals.map((v, i) => `${xScale(i)},${yScale(v)}`).join(' L ')}
                L ${xScale(timePoints.length - 1)},${yScale(0)}
                L ${xScale(0)},${yScale(0)}
                Z
              `;
              const linePath = scenario.totals
                .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)},${yScale(v)}`)
                .join(' ');

              return (
                <g
                  key={scenario.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredScenario(scenario.id)}
                  onMouseLeave={() => setHoveredScenario(null)}
                >
                  <path
                    d={areaPath}
                    fill={`url(#gradient-${scenario.id})`}
                    opacity={isHovered ? 1 : 0.6}
                  />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={scenario.color}
                    strokeWidth={isHovered ? 3 : 2}
                    opacity={hoveredScenario && !isHovered ? 0.3 : 1}
                  />
                  {/* End label */}
                  <text
                    x={xScale(timePoints.length - 1) + 8}
                    y={yScale(scenario.totals[scenario.totals.length - 1]) + 4}
                    className={`text-[10px] font-medium ${isHovered ? 'fill-white' : 'fill-slate-400'}`}
                  >
                    {scenario.totals[scenario.totals.length - 1].toFixed(0)}%
                  </text>
                </g>
              );
            })}

          {/* X-axis */}
          {timePoints.map((tp, i) => (
            <text
              key={tp.year}
              x={xScale(i)}
              y={chartHeight + 20}
              textAnchor="middle"
              className="fill-slate-400 text-[10px]"
            >
              {tp.year}
            </text>
          ))}

          {/* Y-axis label */}
          <text
            x={-chartHeight / 2}
            y={-40}
            textAnchor="middle"
            transform="rotate(-90)"
            className="fill-slate-400 text-xs"
          >
            Total Catastrophe Risk (%)
          </text>
        </g>
      </svg>

      {/* Scenario details */}
      {hoveredScenario && (
        <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-lg inline-block">
          <p className="text-sm font-medium text-slate-200">
            {scenarios.find((s) => s.id === hoveredScenario)?.label} Scenario
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {hoveredScenario === 'optimistic' && 'Strong safety progress, effective governance, coordinated response'}
            {hoveredScenario === 'baseline' && 'Current trajectory continues with moderate safety investment'}
            {hoveredScenario === 'pessimistic' && 'Racing dynamics, weak governance, inadequate safety measures'}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VISUALIZATION 7: Interactive Factor Sliders
// ============================================================================

export function InteractiveFactors() {
  const [factorValues, setFactorValues] = useState<Record<string, number>>(() => {
    const random = seededRandom(46);
    return Object.fromEntries(rootFactors.map((f) => [f.id, 30 + random() * 40]));
  });

  // Calculate projected outcomes based on factor values
  const projectedOutcomes = useMemo(() => {
    const weights = {
      catastrophe: {
        misalignment: 0.35,
        misuse: 0.20,
        capabilities: 0.25,
        ownership: 0.08,
        competence: -0.07, // negative = reduces risk
        turbulence: 0.05,
      },
      lockIn: {
        misalignment: 0.15,
        misuse: 0.10,
        capabilities: 0.20,
        ownership: 0.35,
        competence: -0.15,
        turbulence: 0.10,
      },
    };

    const catastrophe = Object.entries(weights.catastrophe).reduce((sum, [id, weight]) => {
      return sum + factorValues[id] * weight;
    }, 0);

    const lockIn = Object.entries(weights.lockIn).reduce((sum, [id, weight]) => {
      return sum + factorValues[id] * weight;
    }, 0);

    return {
      catastrophe: Math.max(0, Math.min(100, catastrophe)),
      lockIn: Math.max(0, Math.min(100, lockIn)),
    };
  }, [factorValues]);

  const handleSliderChange = (factorId: string, value: number) => {
    setFactorValues((prev) => ({ ...prev, [factorId]: value }));
  };

  return (
    <div className="space-y-6">
      <StatLine>Adjust root factors to see projected impact on outcomes</StatLine>

      <div className="grid grid-cols-2 gap-8">
        {/* Factor Sliders */}
        <div className="space-y-4">
          <div className="text-sm font-medium text-slate-300 mb-3">Root Factors</div>
          {rootFactors.map((factor) => (
            <div key={factor.id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{factor.label}</span>
                <span className="font-mono text-slate-300">{factorValues[factor.id].toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={factorValues[factor.id]}
                onChange={(e) => handleSliderChange(factor.id, Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${factor.color} 0%, ${factor.color} ${factorValues[factor.id]}%, #334155 ${factorValues[factor.id]}%, #334155 100%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Outcome Gauges */}
        <div className="space-y-6">
          <div className="text-sm font-medium text-slate-300 mb-3">Projected Outcomes</div>

          {/* Catastrophe Risk */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-300">Catastrophe Risk</span>
              <span
                className={`text-2xl font-bold ${
                  projectedOutcomes.catastrophe > 30
                    ? 'text-red-400'
                    : projectedOutcomes.catastrophe > 15
                    ? 'text-orange-400'
                    : 'text-green-400'
                }`}
              >
                {projectedOutcomes.catastrophe.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${projectedOutcomes.catastrophe}%`,
                  background: `linear-gradient(to right, #22c55e, #eab308 30%, #ef4444 60%, #dc2626)`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Low</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Lock-in Severity */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-300">Lock-in Severity</span>
              <span
                className={`text-2xl font-bold ${
                  projectedOutcomes.lockIn > 50
                    ? 'text-purple-400'
                    : projectedOutcomes.lockIn > 30
                    ? 'text-violet-400'
                    : 'text-blue-400'
                }`}
              >
                {projectedOutcomes.lockIn.toFixed(1)}
              </span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${projectedOutcomes.lockIn}%`,
                  background: `linear-gradient(to right, #3b82f6, #8b5cf6 50%, #a855f7)`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>Low</span>
              <span>Severe</span>
            </div>
          </div>

          {/* Risk level indicator */}
          <div className="text-xs text-slate-500 p-3 bg-slate-800/50 rounded-lg">
            <p className="font-medium text-slate-400 mb-1">Assessment:</p>
            {projectedOutcomes.catastrophe > 25 ? (
              <p className="text-red-400">High catastrophe risk requires urgent intervention</p>
            ) : projectedOutcomes.lockIn > 40 ? (
              <p className="text-purple-400">Significant lock-in risk from power concentration</p>
            ) : (
              <p className="text-green-400">Risk levels within manageable range</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 8: Pathway Breakdown Bars
// ============================================================================

export function PathwayBreakdown() {
  const [selectedYear, setSelectedYear] = useState(4); // TAI year index
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const catastropheData = useMemo(() => generateCatastropheData(), []);
  const lockInData = useMemo(() => generateLockInData(), []);

  const currentCatastrophe = catastropheData[selectedYear];
  const currentLockIn = lockInData[selectedYear];

  const catastropheTotal = catastrophePathways.reduce(
    (sum, p) => sum + (currentCatastrophe[p.id as keyof typeof currentCatastrophe] as number),
    0
  );

  const lockInTotal = lockInTypes.reduce(
    (sum, t) => sum + (currentLockIn[t.id as keyof typeof currentLockIn] as number),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>Risk breakdown at selected time point</StatLine>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
          >
            {timePoints.map((tp, i) => (
              <option key={tp.year} value={i}>
                {tp.year} ({tp.phase})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Catastrophe Breakdown */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-300">Catastrophe Risk</span>
            <span className="text-xl font-bold text-red-400">{catastropheTotal.toFixed(1)}%</span>
          </div>
          <div className="space-y-3">
            {catastrophePathways.map((pathway) => {
              const value = currentCatastrophe[pathway.id as keyof typeof currentCatastrophe] as number;
              const pct = (value / catastropheTotal) * 100;
              return (
                <div
                  key={pathway.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setShowDetails(pathway.id)}
                  onMouseLeave={() => setShowDetails(null)}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{pathway.label}</span>
                    <span className="font-mono text-slate-300">{value.toFixed(1)}%</span>
                  </div>
                  <div className="h-6 bg-slate-800 rounded overflow-hidden flex items-center">
                    <div
                      className="h-full rounded transition-all duration-300 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: pathway.color,
                        opacity: showDetails === pathway.id ? 1 : 0.7,
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lock-in Breakdown */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-300">Lock-in Severity</span>
            <span className="text-xl font-bold text-purple-400">{lockInTotal.toFixed(0)}</span>
          </div>
          <div className="space-y-3">
            {lockInTypes.map((type) => {
              const value = currentLockIn[type.id as keyof typeof currentLockIn] as number;
              const pct = (value / lockInTotal) * 100;
              return (
                <div
                  key={type.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setShowDetails(type.id)}
                  onMouseLeave={() => setShowDetails(null)}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{type.label}</span>
                    <span className="font-mono text-slate-300">{value.toFixed(1)}</span>
                  </div>
                  <div className="h-6 bg-slate-800 rounded overflow-hidden flex items-center">
                    <div
                      className="h-full rounded transition-all duration-300 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(pct, 5)}%`,
                        backgroundColor: type.color,
                        opacity: showDetails === type.id ? 1 : 0.7,
                      }}
                    >
                      <span className="text-[10px] text-white font-medium">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VISUALIZATION 9: Compact Summary Dashboard
// ============================================================================

export function CompactSummary() {
  const catastropheData = useMemo(() => generateCatastropheData(), []);
  const lockInData = useMemo(() => generateLockInData(), []);
  const factorContributions = useMemo(() => generateFactorContributions(), []);

  // Calculate key metrics
  const currentIdx = 0;
  const taiIdx = 4;
  const finalIdx = timePoints.length - 1;

  const getCurrentTotal = (data: typeof catastropheData, pathways: typeof catastrophePathways) => {
    return pathways.reduce((sum, p) => sum + (data[currentIdx][p.id as keyof typeof data[0]] as number), 0);
  };

  const getTaiTotal = (data: typeof catastropheData, pathways: typeof catastrophePathways) => {
    return pathways.reduce((sum, p) => sum + (data[taiIdx][p.id as keyof typeof data[0]] as number), 0);
  };

  const getFinalTotal = (data: typeof catastropheData, pathways: typeof catastrophePathways) => {
    return pathways.reduce((sum, p) => sum + (data[finalIdx][p.id as keyof typeof data[0]] as number), 0);
  };

  const catCurrent = getCurrentTotal(catastropheData, catastrophePathways);
  const catTai = getTaiTotal(catastropheData, catastrophePathways);
  const catFinal = getFinalTotal(catastropheData, catastrophePathways);

  const lockCurrent = lockInTypes.reduce((sum, t) => sum + (lockInData[currentIdx][t.id as keyof typeof lockInData[0]] as number), 0);
  const lockTai = lockInTypes.reduce((sum, t) => sum + (lockInData[taiIdx][t.id as keyof typeof lockInData[0]] as number), 0);
  const lockFinal = lockInTypes.reduce((sum, t) => sum + (lockInData[finalIdx][t.id as keyof typeof lockInData[0]] as number), 0);

  // Mini sparkline component
  const MiniSparkline = ({ data, color, max }: { data: number[]; color: string; max: number }) => {
    const width = 80;
    const height = 24;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(' ');
    return (
      <svg width={width} height={height} className="inline-block">
        <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} opacity={0.8} />
        <circle cx={width} cy={height - (data[data.length - 1] / max) * height} r={2} fill={color} />
      </svg>
    );
  };

  // Get sparkline data
  const catSparkline = catastropheData.map((d) =>
    catastrophePathways.reduce((sum, p) => sum + (d[p.id as keyof typeof d] as number), 0)
  );
  const lockSparkline = lockInData.map((d) =>
    lockInTypes.reduce((sum, t) => sum + (d[t.id as keyof typeof d] as number), 0)
  );

  return (
    <div className="space-y-4">
      <StatLine>Key metrics at a glance</StatLine>

      <div className="grid grid-cols-3 gap-4">
        {/* Catastrophe Card */}
        <div className="p-4 bg-gradient-to-br from-red-950/50 to-slate-900 border border-red-900/30 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-red-400 font-medium uppercase tracking-wide">Catastrophe Risk</div>
              <div className="text-3xl font-bold text-red-400 mt-1">{catFinal.toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">by 2060</div>
            </div>
            <MiniSparkline data={catSparkline} color="#ef4444" max={50} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-red-900/30 pt-3">
            <div>
              <div className="text-xs text-slate-400">Now</div>
              <div className="text-sm font-mono text-slate-300">{catCurrent.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">TAI</div>
              <div className="text-sm font-mono text-red-300">{catTai.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">2060</div>
              <div className="text-sm font-mono text-red-400">{catFinal.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Lock-in Card */}
        <div className="p-4 bg-gradient-to-br from-purple-950/50 to-slate-900 border border-purple-900/30 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs text-purple-400 font-medium uppercase tracking-wide">Lock-in Severity</div>
              <div className="text-3xl font-bold text-purple-400 mt-1">{lockFinal.toFixed(0)}</div>
              <div className="text-[10px] text-slate-500">by 2060</div>
            </div>
            <MiniSparkline data={lockSparkline} color="#a855f7" max={100} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-purple-900/30 pt-3">
            <div>
              <div className="text-xs text-slate-400">Now</div>
              <div className="text-sm font-mono text-slate-300">{lockCurrent.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">TAI</div>
              <div className="text-sm font-mono text-purple-300">{lockTai.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">2060</div>
              <div className="text-sm font-mono text-purple-400">{lockFinal.toFixed(0)}</div>
            </div>
          </div>
        </div>

        {/* Key Drivers Card */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Top Risk Drivers</div>
          <div className="space-y-2">
            {rootFactors
              .map((f) => ({
                ...f,
                impact: factorContributions.catastrophe[f.id as keyof typeof factorContributions.catastrophe],
              }))
              .sort((a, b) => b.impact - a.impact)
              .slice(0, 4)
              .map((factor, i) => (
                <div key={factor.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 w-3">{i + 1}.</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${factor.impact}%`, backgroundColor: factor.color }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 w-20 truncate">{factor.label.split(' ')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">{factor.impact.toFixed(0)}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Pathway breakdown mini bars */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400 mb-2">Catastrophe by Pathway (2060)</div>
          <div className="flex gap-1 h-6">
            {catastrophePathways.map((p) => {
              const value = catastropheData[finalIdx][p.id as keyof typeof catastropheData[0]] as number;
              const pct = (value / catFinal) * 100;
              return (
                <div
                  key={p.id}
                  className="h-full rounded-sm flex items-center justify-center"
                  style={{ width: `${pct}%`, backgroundColor: p.color }}
                  title={`${p.label}: ${value.toFixed(1)}%`}
                >
                  {pct > 15 && <span className="text-[8px] text-white font-medium">{pct.toFixed(0)}%</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400 mb-2">Lock-in by Type (2060)</div>
          <div className="flex gap-1 h-6">
            {lockInTypes.map((t) => {
              const value = lockInData[finalIdx][t.id as keyof typeof lockInData[0]] as number;
              const pct = (value / lockFinal) * 100;
              return (
                <div
                  key={t.id}
                  className="h-full rounded-sm flex items-center justify-center"
                  style={{ width: `${pct}%`, backgroundColor: t.color }}
                  title={`${t.label}: ${value.toFixed(1)}`}
                >
                  {pct > 12 && <span className="text-[8px] text-white font-medium">{pct.toFixed(0)}%</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assessment */}
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <div className="flex items-start gap-4">
          <div className={`w-3 h-3 rounded-full mt-1 ${catFinal > 30 ? 'bg-red-500' : catFinal > 20 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
          <div>
            <div className="text-sm font-medium text-slate-200">
              {catFinal > 30
                ? 'High Alert: Catastrophe risk exceeds safe thresholds'
                : catFinal > 20
                ? 'Elevated Risk: Significant probability of catastrophic outcomes'
                : 'Moderate Risk: Within manageable range but requires vigilance'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Primary drivers: {rootFactors
                .map((f) => ({
                  ...f,
                  impact: factorContributions.catastrophe[f.id as keyof typeof factorContributions.catastrophe],
                }))
                .sort((a, b) => b.impact - a.impact)
                .slice(0, 2)
                .map((f) => f.label)
                .join(', ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ADVANCED VISUALIZATION: Intervention Modeling + Milestones + Tipping Points
// ============================================================================

// Timeline events organized by lane
const milestoneEvents = {
  capabilities: [
    { year: 2025, label: 'GPT-5', impact: 'neutral', size: 'small' },
    { year: 2027, label: 'Autonomous Agents', impact: 'negative', size: 'medium' },
    { year: 2029, label: 'Human-level Coding', impact: 'negative', size: 'medium' },
    { year: 2033, label: 'Scientific Research AI', impact: 'negative', size: 'large' },
    { year: 2038, label: 'Recursive Improvement', impact: 'negative', size: 'large' },
  ],
  governance: [
    { year: 2025, label: 'EU AI Act', impact: 'positive', size: 'medium' },
    { year: 2026, label: 'US Executive Order', impact: 'positive', size: 'small' },
    { year: 2029, label: 'Treaty Attempt', impact: 'uncertain', size: 'medium' },
    { year: 2034, label: 'Governance Failure', impact: 'negative', size: 'large' },
    { year: 2042, label: 'Emergency Measures', impact: 'uncertain', size: 'medium' },
  ],
  safety: [
    { year: 2027, label: 'Interpretability Advance', impact: 'positive', size: 'medium' },
    { year: 2031, label: 'Alignment Paradigm Shift', impact: 'positive', size: 'large' },
    { year: 2036, label: 'Safety Team Disbanded', impact: 'negative', size: 'medium' },
    { year: 2040, label: 'New Safety Org', impact: 'positive', size: 'medium' },
  ],
  coordination: [
    { year: 2026, label: 'Lab Cooperation', impact: 'positive', size: 'medium' },
    { year: 2028, label: 'Info Sharing Regime', impact: 'positive', size: 'medium' },
    { year: 2032, label: 'Arms Race Acceleration', impact: 'negative', size: 'large' },
    { year: 2037, label: 'Coordination Breakdown', impact: 'negative', size: 'large' },
  ],
  incidents: [
    { year: 2028, label: 'Near-miss Incident', impact: 'negative', size: 'small' },
    { year: 2034, label: 'Public AI Failure', impact: 'negative', size: 'medium' },
    { year: 2036, label: 'Economic Shock', impact: 'negative', size: 'large' },
    { year: 2045, label: 'First Autonomous Harm', impact: 'negative', size: 'large' },
  ],
};

const lanes = [
  { id: 'capabilities', label: 'AI Capabilities', color: '#3b82f6', icon: '🧠' },
  { id: 'governance', label: 'Governance/Policy', color: '#22c55e', icon: '⚖️' },
  { id: 'safety', label: 'Safety Research', color: '#a855f7', icon: '🛡️' },
  { id: 'coordination', label: 'Coordination', color: '#f97316', icon: '🤝' },
  { id: 'incidents', label: 'Incidents', color: '#ef4444', icon: '⚠️' },
];

const tippingPoints = [
  { year: 2030, label: 'Window for\nIntervention Closes', severity: 'warning' },
  { year: 2037, label: 'Last Chance for\nCoordination', severity: 'critical' },
];

// Intervention definitions with their effects
const interventions = [
  {
    id: 'alignment',
    label: 'Alignment Research Investment',
    color: '#a855f7',
    effects: { misalignment: -0.4, capabilities: 0.05 },
    description: 'Funding for interpretability, control, and alignment techniques'
  },
  {
    id: 'governance',
    label: 'International Governance',
    color: '#22c55e',
    effects: { turbulence: -0.3, ownership: -0.2, misuse: -0.15 },
    description: 'Treaties, compute tracking, deployment standards'
  },
  {
    id: 'coordination',
    label: 'Lab Coordination',
    color: '#f97316',
    effects: { turbulence: -0.25, misalignment: -0.1 },
    description: 'Information sharing, joint safety commitments'
  },
  {
    id: 'slowdown',
    label: 'Capability Slowdown',
    color: '#ef4444',
    effects: { capabilities: -0.3, turbulence: -0.2 },
    description: 'Deliberate deceleration of frontier development'
  },
];

export function AdvancedRiskDashboard() {
  // Intervention levels (0-100)
  const [interventionLevels, setInterventionLevels] = useState<Record<string, number>>({
    alignment: 30,
    governance: 20,
    coordination: 25,
    slowdown: 10,
  });

  const [hoveredEvent, setHoveredEvent] = useState<{ lane: string; event: typeof milestoneEvents.capabilities[0] } | null>(null);
  const [selectedTimePoint, setSelectedTimePoint] = useState(4); // TAI year

  // Calculate modified risk based on interventions
  const calculateModifiedRisk = useMemo(() => {
    const baseFactors = {
      misalignment: 65,
      misuse: 45,
      capabilities: 70,
      ownership: 55,
      competence: 40,
      turbulence: 60,
    };

    // Apply intervention effects
    const modifiedFactors = { ...baseFactors };
    interventions.forEach((intervention) => {
      const level = interventionLevels[intervention.id] / 100;
      Object.entries(intervention.effects).forEach(([factor, effect]) => {
        modifiedFactors[factor as keyof typeof modifiedFactors] += effect * level * 50;
      });
    });

    // Clamp values
    Object.keys(modifiedFactors).forEach((k) => {
      modifiedFactors[k as keyof typeof modifiedFactors] = Math.max(0, Math.min(100, modifiedFactors[k as keyof typeof modifiedFactors]));
    });

    // Calculate catastrophe and lock-in from factors
    const catastropheWeights = { misalignment: 0.35, misuse: 0.2, capabilities: 0.25, ownership: 0.08, competence: -0.07, turbulence: 0.12 };
    const lockInWeights = { misalignment: 0.15, misuse: 0.1, capabilities: 0.2, ownership: 0.35, competence: -0.15, turbulence: 0.1 };

    const catastropheRisk = Object.entries(catastropheWeights).reduce((sum, [k, w]) =>
      sum + modifiedFactors[k as keyof typeof modifiedFactors] * w, 0);
    const lockInRisk = Object.entries(lockInWeights).reduce((sum, [k, w]) =>
      sum + modifiedFactors[k as keyof typeof modifiedFactors] * w, 0);

    return { factors: modifiedFactors, catastropheRisk, lockInRisk };
  }, [interventionLevels]);

  // Generate trajectory data with interventions applied
  const trajectoryData = useMemo(() => {
    const random = seededRandom(100);
    const interventionEffect = Object.values(interventionLevels).reduce((a, b) => a + b, 0) / 400; // 0-1 scale

    return timePoints.map((tp, i) => {
      const progress = i / (timePoints.length - 1);
      const taiMultiplier = tp.phase === 'tai' ? 1.8 : tp.phase === 'post-tai' ? 1.2 : 1;

      // Base risk modified by interventions
      const baseRisk = 5 + progress * 35 * taiMultiplier;
      const modifiedRisk = baseRisk * (1 - interventionEffect * 0.6);

      return {
        ...tp,
        risk: modifiedRisk + random() * 3,
        baseline: baseRisk + random() * 3,
        lowerBound: modifiedRisk * 0.7,
        upperBound: modifiedRisk * 1.4,
      };
    });
  }, [interventionLevels]);

  const width = 950;
  const mainChartHeight = 280;
  const timelineHeight = 200;
  const margin = { top: 30, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;

  const xScale = (year: number) => ((year - 2025) / 35) * chartWidth;
  const yScale = (v: number) => (mainChartHeight - margin.top - margin.bottom) - (v / 50) * (mainChartHeight - margin.top - margin.bottom);

  // Generate area paths
  const generateAreaPath = (data: typeof trajectoryData, key: 'risk' | 'baseline') => {
    const points = data.map((d, i) => `${xScale(d.year)},${yScale(d[key])}`);
    return `M ${points.join(' L ')} L ${xScale(data[data.length - 1].year)},${yScale(0)} L ${xScale(data[0].year)},${yScale(0)} Z`;
  };

  const generateLinePath = (data: typeof trajectoryData, key: 'risk' | 'baseline') => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.year)},${yScale(d[key])}`).join(' ');
  };

  const generateConfidenceBand = () => {
    const upper = trajectoryData.map((d) => `${xScale(d.year)},${yScale(d.upperBound)}`).join(' L ');
    const lower = trajectoryData.slice().reverse().map((d) => `${xScale(d.year)},${yScale(d.lowerBound)}`).join(' L ');
    return `M ${upper} L ${lower} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Header with total risk score */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Risk Trajectory with Interventions</h3>
          <p className="text-xs text-slate-500">Adjust intervention levels to see impact on projected outcomes</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Projected 2060 Risk</div>
          <div className={`text-3xl font-bold ${
            calculateModifiedRisk.catastropheRisk > 30 ? 'text-red-400' :
            calculateModifiedRisk.catastropheRisk > 20 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {calculateModifiedRisk.catastropheRisk.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500">
            vs {(calculateModifiedRisk.catastropheRisk / (1 - Object.values(interventionLevels).reduce((a, b) => a + b, 0) / 400 * 0.6)).toFixed(1)}% baseline
          </div>
        </div>
      </div>

      {/* Main stacked area chart with tipping points */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
        <svg width={width} height={mainChartHeight}>
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="baselineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b7280" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6b7280" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {[0, 10, 20, 30, 40, 50].map((v) => (
              <g key={v}>
                <line x1={0} y1={yScale(v)} x2={chartWidth} y2={yScale(v)} stroke="rgba(255,255,255,0.08)" strokeDasharray="2,4" />
                <text x={-8} y={yScale(v) + 4} textAnchor="end" className="fill-slate-500 text-[10px]">{v}%</text>
              </g>
            ))}

            {/* Tipping point zones */}
            {tippingPoints.map((tp, i) => (
              <g key={i}>
                <rect
                  x={xScale(tp.year) - 15}
                  y={0}
                  width={30}
                  height={mainChartHeight - margin.top - margin.bottom}
                  fill={tp.severity === 'critical' ? '#ef4444' : '#eab308'}
                  fillOpacity={0.1}
                />
                <line
                  x1={xScale(tp.year)}
                  y1={0}
                  x2={xScale(tp.year)}
                  y2={mainChartHeight - margin.top - margin.bottom}
                  stroke={tp.severity === 'critical' ? '#ef4444' : '#eab308'}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  opacity={0.6}
                />
                <text
                  x={xScale(tp.year)}
                  y={-8}
                  textAnchor="middle"
                  className={`text-[9px] font-medium ${tp.severity === 'critical' ? 'fill-red-400' : 'fill-yellow-400'}`}
                >
                  {tp.label.split('\n')[0]}
                </text>
              </g>
            ))}

            {/* TAI marker */}
            <rect x={xScale(2037) - 20} y={0} width={40} height={mainChartHeight - margin.top - margin.bottom} fill="#8b5cf6" fillOpacity={0.1} />
            <line x1={xScale(2037)} y1={0} x2={xScale(2037)} y2={mainChartHeight - margin.top - margin.bottom} stroke="#8b5cf6" strokeWidth={2} strokeDasharray="6,3" />
            <text x={xScale(2037)} y={-8} textAnchor="middle" className="fill-purple-400 text-[10px] font-semibold">TAI</text>

            {/* Confidence band */}
            <path d={generateConfidenceBand()} fill="#ef4444" fillOpacity={0.1} />

            {/* Baseline area (no interventions) */}
            <path d={generateAreaPath(trajectoryData, 'baseline')} fill="url(#baselineGradient)" />
            <path d={generateLinePath(trajectoryData, 'baseline')} fill="none" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.5} />

            {/* Modified risk area */}
            <path d={generateAreaPath(trajectoryData, 'risk')} fill="url(#riskGradient)" />
            <path d={generateLinePath(trajectoryData, 'risk')} fill="none" stroke="#ef4444" strokeWidth={2.5} />

            {/* X-axis years */}
            {[2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060].map((year) => (
              <text key={year} x={xScale(year)} y={mainChartHeight - margin.top - margin.bottom + 20} textAnchor="middle" className="fill-slate-400 text-[10px]">
                {year}
              </text>
            ))}
          </g>
        </svg>

        {/* Legend */}
        <div className="flex gap-6 justify-center mt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500" />
            <span className="text-slate-400">With Interventions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-slate-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #6b7280 0, #6b7280 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-slate-500">Baseline (no intervention)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/10 border border-red-500/30 rounded" />
            <span className="text-slate-500">Confidence Range</span>
          </div>
        </div>
      </div>

      {/* Intervention Sliders */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
        <div className="text-sm font-medium text-slate-300 mb-4">Intervention Levers</div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {interventions.map((intervention) => (
            <div key={intervention.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: intervention.color }} />
                  <span className="text-xs font-medium text-slate-300">{intervention.label}</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{interventionLevels[intervention.id]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={interventionLevels[intervention.id]}
                onChange={(e) => setInterventionLevels((prev) => ({ ...prev, [intervention.id]: Number(e.target.value) }))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${intervention.color} 0%, ${intervention.color} ${interventionLevels[intervention.id]}%, #334155 ${interventionLevels[intervention.id]}%, #334155 100%)`,
                }}
              />
              <div className="text-[10px] text-slate-500">{intervention.description}</div>
            </div>
          ))}
        </div>

        {/* Impact summary */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-2">Intervention Impact on Factors:</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(calculateModifiedRisk.factors).map(([factor, value]) => {
              const baseline = { misalignment: 65, misuse: 45, capabilities: 70, ownership: 55, competence: 40, turbulence: 60 }[factor] || 50;
              const diff = value - baseline;
              return (
                <div key={factor} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 capitalize">{factor}:</span>
                  <span className={`text-[10px] font-mono ${diff < 0 ? 'text-green-400' : diff > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-4">
        <div className="text-sm font-medium text-slate-300 mb-4">Milestone Timeline</div>
        <svg width={width} height={timelineHeight}>
          <g transform={`translate(${margin.left}, 10)`}>
            {/* Time axis */}
            <line x1={0} y1={timelineHeight - 30} x2={chartWidth} y2={timelineHeight - 30} stroke="rgba(255,255,255,0.2)" />
            {[2025, 2030, 2035, 2040, 2045, 2050, 2055, 2060].map((year) => (
              <g key={year}>
                <line x1={xScale(year)} y1={timelineHeight - 35} x2={xScale(year)} y2={timelineHeight - 25} stroke="rgba(255,255,255,0.3)" />
                <text x={xScale(year)} y={timelineHeight - 12} textAnchor="middle" className="fill-slate-400 text-[10px]">{year}</text>
              </g>
            ))}

            {/* TAI zone highlight */}
            <rect x={xScale(2035)} y={0} width={xScale(2042) - xScale(2035)} height={timelineHeight - 40} fill="#8b5cf6" fillOpacity={0.08} rx={4} />

            {/* Lanes */}
            {lanes.map((lane, laneIdx) => {
              const laneY = 8 + laneIdx * 28;
              const events = milestoneEvents[lane.id as keyof typeof milestoneEvents];

              return (
                <g key={lane.id}>
                  {/* Lane label */}
                  <text x={-8} y={laneY + 10} textAnchor="end" className="fill-slate-400 text-[9px]">
                    {lane.icon}
                  </text>

                  {/* Lane line */}
                  <line x1={0} y1={laneY + 8} x2={chartWidth} y2={laneY + 8} stroke={lane.color} strokeOpacity={0.2} strokeWidth={1} />

                  {/* Events */}
                  {events.map((event, eventIdx) => {
                    const eventX = xScale(event.year);
                    const size = event.size === 'large' ? 10 : event.size === 'medium' ? 7 : 5;
                    const isHovered = hoveredEvent?.lane === lane.id && hoveredEvent?.event.label === event.label;

                    return (
                      <g
                        key={eventIdx}
                        transform={`translate(${eventX}, ${laneY})`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredEvent({ lane: lane.id, event })}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        {/* Event marker */}
                        {event.impact === 'positive' ? (
                          <polygon
                            points={`0,-${size} ${size * 0.6},${size * 0.5} -${size * 0.6},${size * 0.5}`}
                            fill="#22c55e"
                            stroke={isHovered ? '#fff' : 'none'}
                            strokeWidth={1}
                          />
                        ) : event.impact === 'negative' ? (
                          <polygon
                            points={`0,${size} ${size * 0.6},-${size * 0.5} -${size * 0.6},-${size * 0.5}`}
                            fill="#ef4444"
                            stroke={isHovered ? '#fff' : 'none'}
                            strokeWidth={1}
                          />
                        ) : (
                          <text y={4} textAnchor="middle" className="fill-yellow-400 text-sm font-bold">?</text>
                        )}

                        {/* Label on hover */}
                        {isHovered && (
                          <g>
                            <rect x={-50} y={-28} width={100} height={18} fill="#1e293b" stroke="#475569" rx={3} />
                            <text x={0} y={-15} textAnchor="middle" className="fill-slate-200 text-[9px] font-medium">
                              {event.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Lane legend */}
        <div className="flex flex-wrap gap-4 justify-center mt-2">
          {lanes.map((lane) => (
            <div key={lane.id} className="flex items-center gap-1.5 text-[10px]">
              <span>{lane.icon}</span>
              <span className="text-slate-400">{lane.label}</span>
            </div>
          ))}
          <div className="border-l border-slate-700 pl-4 flex gap-3">
            <div className="flex items-center gap-1">
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500" />
              <span className="text-slate-500">Positive</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
              <span className="text-slate-500">Negative</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-bold text-xs">?</span>
              <span className="text-slate-500">Uncertain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Mini-Charts */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: 'capabilities', label: 'AI Capability Index', value: 38.7, status: 'Advancing', statusColor: 'text-red-400', data: [10, 15, 22, 35, 55, 78, 92], annotations: [{ x: 4, label: 'Human-level' }, { x: 6, label: 'Superhuman' }] },
          { id: 'concentration', label: 'Power Concentration', value: 54.2, status: 'Rising', statusColor: 'text-orange-400', data: [40, 45, 52, 58, 68, 75, 82], threshold: 65, thresholdLabel: 'Critical Centralization' },
          { id: 'alignment', label: 'Alignment Progress', value: 41.5, status: 'Lagging', statusColor: 'text-yellow-400', data: [20, 25, 32, 38, 42, 45, 48], capabilityLine: [10, 15, 22, 35, 55, 78, 92], gapLabel: 'GAP WIDENING' },
          { id: 'coordination', label: 'Coordination Index', value: 52.1, status: 'Deteriorating', statusColor: 'text-red-400', data: [70, 68, 62, 55, 45, 38, 30], annotations: [{ x: 3, label: 'Treaty fails' }] },
          { id: 'socioeconomic', label: 'Socio-Economic Stability', value: 67.3, status: 'Vulnerable', statusColor: 'text-orange-400', data: [80, 75, 68, 55, 45, 52, 60], volatilityZone: [3, 5] },
          { id: 'information', label: 'Information Integrity', value: 45.8, status: 'Critical', statusColor: 'text-red-400', data: [75, 65, 52, 40, 32, 28, 25], annotations: [{ x: 2, label: 'Deepfake Proliferation' }, { x: 4, label: 'Trust Collapse' }] },
        ].map((chart) => {
          const miniWidth = 420;
          const miniHeight = 140;
          const miniMargin = { top: 15, right: 15, bottom: 25, left: 40 };
          const miniChartWidth = miniWidth - miniMargin.left - miniMargin.right;
          const miniChartHeight = miniHeight - miniMargin.top - miniMargin.bottom;

          const xMiniScale = (i: number) => (i / (chart.data.length - 1)) * miniChartWidth;
          const yMiniScale = (v: number) => miniChartHeight - (v / 100) * miniChartHeight;

          const linePath = chart.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xMiniScale(i)},${yMiniScale(v)}`).join(' ');
          const areaPath = `${linePath} L ${miniChartWidth},${miniChartHeight} L 0,${miniChartHeight} Z`;

          return (
            <div key={chart.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="text-sm font-medium text-slate-300">{chart.label}</div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-200">{chart.value}</span>
                  <span className={`text-xs ml-1.5 ${chart.statusColor}`}>({chart.status})</span>
                </div>
              </div>
              <svg width={miniWidth} height={miniHeight}>
                <g transform={`translate(${miniMargin.left}, ${miniMargin.top})`}>
                  {/* Grid */}
                  {[0, 50, 100].map((v) => (
                    <line key={v} x1={0} y1={yMiniScale(v)} x2={miniChartWidth} y2={yMiniScale(v)} stroke="rgba(255,255,255,0.1)" />
                  ))}

                  {/* TAI zone */}
                  <rect x={xMiniScale(3)} y={0} width={xMiniScale(5) - xMiniScale(3)} height={miniChartHeight} fill="#8b5cf6" fillOpacity={0.1} />

                  {/* Threshold line */}
                  {chart.threshold && (
                    <g>
                      <line x1={0} y1={yMiniScale(chart.threshold)} x2={miniChartWidth} y2={yMiniScale(chart.threshold)} stroke="#ef4444" strokeDasharray="4,4" strokeOpacity={0.7} />
                      <text x={miniChartWidth} y={yMiniScale(chart.threshold) - 6} textAnchor="end" className="fill-red-400 text-[10px]">{chart.thresholdLabel}</text>
                    </g>
                  )}

                  {/* Capability comparison line for alignment chart */}
                  {chart.capabilityLine && (
                    <g>
                      <path
                        d={chart.capabilityLine.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xMiniScale(i)},${yMiniScale(v)}`).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="6,3"
                      />
                      {chart.gapLabel && (
                        <text x={miniChartWidth - 10} y={yMiniScale(70)} textAnchor="end" className="fill-red-400 text-[11px] font-semibold">{chart.gapLabel}</text>
                      )}
                    </g>
                  )}

                  {/* Main area and line */}
                  <path d={areaPath} fill={chart.status === 'Critical' || chart.status === 'Deteriorating' ? '#ef4444' : chart.status === 'Lagging' || chart.status === 'Vulnerable' ? '#f97316' : '#3b82f6'} fillOpacity={0.2} />
                  <path d={linePath} fill="none" stroke={chart.status === 'Critical' || chart.status === 'Deteriorating' ? '#ef4444' : chart.status === 'Lagging' || chart.status === 'Vulnerable' ? '#f97316' : '#3b82f6'} strokeWidth={2.5} />

                  {/* Annotations */}
                  {chart.annotations?.map((ann, i) => (
                    <g key={i}>
                      <circle cx={xMiniScale(ann.x)} cy={yMiniScale(chart.data[ann.x])} r={4} fill="#fff" />
                      <text x={xMiniScale(ann.x)} y={yMiniScale(chart.data[ann.x]) - 10} textAnchor="middle" className="fill-slate-200 text-[10px] font-medium">{ann.label}</text>
                    </g>
                  ))}

                  {/* X-axis labels */}
                  <text x={0} y={miniChartHeight + 16} className="fill-slate-400 text-[11px]">Now</text>
                  <text x={xMiniScale(3)} y={miniChartHeight + 16} textAnchor="middle" className="fill-purple-400 text-[11px] font-medium">TAI</text>
                  <text x={miniChartWidth} y={miniChartHeight + 16} textAnchor="end" className="fill-slate-400 text-[11px]">Post-TAI</text>
                </g>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Combined Export with Tabs
// ============================================================================

export function RiskTrajectoryExperiments() {
  const [view, setView] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  const views = [
    { id: 1, name: 'Stacked Areas' },
    { id: 2, name: 'Factor Matrix' },
    { id: 3, name: 'Trajectory Lines' },
    { id: 4, name: 'Scenarios' },
    { id: 5, name: 'Summary' },
    { id: 6, name: '⭐ Advanced' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {views.map((v) => (
          <ToggleButton
            key={v.id}
            active={view === v.id}
            onClick={() => setView(v.id as typeof view)}
          >
            {v.id}. {v.name}
          </ToggleButton>
        ))}
      </div>

      <div className="min-h-[500px]">
        {view === 1 && <DualOutcomeChart />}
        {view === 2 && <FactorAttributionMatrix />}
        {view === 3 && <TrajectoryLines />}
        {view === 4 && <ScenarioComparison />}
        {view === 5 && <CompactSummary />}
        {view === 6 && <AdvancedRiskDashboard />}
      </div>
    </div>
  );
}

export default RiskTrajectoryExperiments;
