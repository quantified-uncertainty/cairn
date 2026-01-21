/**
 * Experimental visualizations for Critical Insight density/gaps
 *
 * Concept: Show a huge grid where most cells are empty, representing
 * the vast space of potential insights vs. the few we've actually found.
 */

import React, { useState, useMemo } from 'react';

// ============================================================================
// Shared Components & Utilities
// ============================================================================

function seededRandom(seed: number) {
  return function () {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Reusable toggle button
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

// Reusable stat display - use div to avoid p tag margin issues
function StatLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-slate-400 leading-normal">
      {children}
    </div>
  );
}

// Reusable hover tooltip panel
function HoverPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-lg text-sm">
      {children}
    </div>
  );
}

// ============================================================================
// EXPERIMENT 1: Sparse Knowledge Grid
// ============================================================================

interface GridCell {
  id: string;
  row: number;
  col: number;
  importance: number;
  quality: number;
  surprising: number;
  label?: string;
  topic?: string;
}

function generateSparseGrid(
  rows: number,
  cols: number,
  fillProbability: number = 0.05,
  seed: number = 42
): GridCell[] {
  const cells: GridCell[] = [];
  const random = seededRandom(seed);

  const topics = [
    'Capabilities', 'Alignment', 'Governance', 'Strategy',
    'Economics', 'Security', 'Ethics', 'Coordination',
    'Compute', 'Data', 'Talent', 'Deployment',
  ];

  const questionTypes = [
    'Magnitude', 'Timeline', 'Probability', 'Mechanism',
    'Interventions', 'Actors', 'Dependencies', 'Feedback',
    'Uncertainty', 'Cruxes', 'Evidence', 'Models',
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (random() < fillProbability) {
        cells.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          importance: random() * 100,
          quality: random() * 100,
          surprising: random() * 100,
          topic: topics[c % topics.length],
          label: `${questionTypes[r % questionTypes.length]} × ${topics[c % topics.length]}`,
        });
      }
    }
  }

  return cells;
}

interface SparseGridProps {
  rows?: number;
  cols?: number;
  fillProbability?: number;
  cellSize?: number;
}

export function SparseKnowledgeGrid({
  rows = 50,
  cols = 50,
  fillProbability = 0.03,
  cellSize = 8,
}: SparseGridProps) {
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [colorMode, setColorMode] = useState<'importance' | 'quality' | 'surprising' | 'combined'>('combined');

  const cells = useMemo(
    () => generateSparseGrid(rows, cols, fillProbability),
    [rows, cols, fillProbability]
  );

  const filledCount = cells.length;
  const totalCells = rows * cols;
  const fillPercentage = ((filledCount / totalCells) * 100).toFixed(1);

  const getColor = (cell: GridCell) => {
    switch (colorMode) {
      case 'importance':
        return `rgba(59, 130, 246, ${cell.importance / 100})`;
      case 'quality':
        return `rgba(34, 197, 94, ${cell.quality / 100})`;
      case 'surprising':
        return `rgba(249, 115, 22, ${cell.surprising / 100})`;
      default:
        const h = 200 + (cell.surprising / 100) * 60;
        const l = 30 + (cell.importance / 100) * 40;
        const a = 0.3 + (cell.quality / 100) * 0.7;
        return `hsla(${h}, 70%, ${l}%, ${a})`;
    }
  };

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>
          <span className="text-lg font-semibold text-slate-200">{filledCount}</span> insights in{' '}
          <span className="text-lg font-semibold text-slate-200">{totalCells.toLocaleString()}</span> cells
          <span className="ml-2 text-slate-500">({fillPercentage}% coverage)</span>
        </StatLine>

        <div className="flex gap-1.5">
          {(['combined', 'importance', 'quality', 'surprising'] as const).map((mode) => (
            <ToggleButton key={mode} active={colorMode === mode} onClick={() => setColorMode(mode)}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </ToggleButton>
          ))}
        </div>
      </div>

      <div
        className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800"
        style={{
          width: gridWidth,
          height: gridHeight,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${cellSize}px ${cellSize}px`,
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.id}
            className="absolute rounded-sm cursor-pointer transition-transform duration-150 hover:scale-150 hover:z-10"
            style={{
              left: cell.col * cellSize,
              top: cell.row * cellSize,
              width: cellSize - 1,
              height: cellSize - 1,
              backgroundColor: getColor(cell),
            }}
            onMouseEnter={() => setHoveredCell(cell)}
            onMouseLeave={() => setHoveredCell(null)}
          />
        ))}
      </div>

      {hoveredCell && (
        <HoverPanel>
          <p className="font-semibold text-slate-200 mb-2">{hoveredCell.label}</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Importance:</span>{' '}
              <span className="font-mono text-blue-400">{hoveredCell.importance.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-slate-500">Quality:</span>{' '}
              <span className="font-mono text-green-400">{hoveredCell.quality.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-slate-500">Surprising:</span>{' '}
              <span className="font-mono text-orange-400">{hoveredCell.surprising.toFixed(0)}</span>
            </div>
          </div>
        </HoverPanel>
      )}
    </div>
  );
}

// ============================================================================
// EXPERIMENT 2: Hierarchical Treemap with Gaps
// ============================================================================

interface TreeNode {
  name: string;
  value?: number;
  fillDensity?: number;
  importance?: number;
  children?: TreeNode[];
}

const knowledgeTree: TreeNode = {
  name: 'AI Safety Knowledge',
  children: [
    {
      name: 'Risks',
      children: [
        { name: 'Misalignment', value: 100, fillDensity: 0.15, importance: 95 },
        { name: 'Misuse', value: 80, fillDensity: 0.25, importance: 85 },
        { name: 'Structural', value: 60, fillDensity: 0.08, importance: 70 },
        { name: 'Accident', value: 40, fillDensity: 0.12, importance: 75 },
      ],
    },
    {
      name: 'Responses',
      children: [
        { name: 'Technical', value: 90, fillDensity: 0.20, importance: 90 },
        { name: 'Governance', value: 70, fillDensity: 0.10, importance: 80 },
        { name: 'Strategy', value: 50, fillDensity: 0.05, importance: 85 },
        { name: 'Field-building', value: 30, fillDensity: 0.15, importance: 60 },
      ],
    },
    {
      name: 'Models',
      children: [
        { name: 'Timelines', value: 60, fillDensity: 0.18, importance: 80 },
        { name: 'Takeoff', value: 50, fillDensity: 0.12, importance: 85 },
        { name: 'Impact', value: 40, fillDensity: 0.08, importance: 75 },
      ],
    },
    {
      name: 'Cruxes',
      children: [
        { name: 'Technical', value: 70, fillDensity: 0.06, importance: 95 },
        { name: 'Strategic', value: 50, fillDensity: 0.04, importance: 90 },
        { name: 'Empirical', value: 40, fillDensity: 0.03, importance: 85 },
      ],
    },
  ],
};

interface TreemapCellProps {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

function TreemapCell({ node, x, y, width, height, depth }: TreemapCellProps) {
  const [hovered, setHovered] = useState(false);

  if (width < 20 || height < 20) return null;

  const fillDensity = node.fillDensity ?? 0.5;
  const importance = node.importance ?? 50;
  const baseHue = depth === 0 ? 220 : depth === 1 ? 200 : 180;
  const bgOpacity = 0.1 + fillDensity * 0.6;
  const borderOpacity = 0.2 + (importance / 100) * 0.5;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`hsla(${baseHue}, 30%, 15%, 0.9)`}
        stroke={`hsla(${baseHue}, 50%, 50%, ${borderOpacity})`}
        strokeWidth={depth === 1 ? 2 : 1}
        rx={4}
      />
      <rect
        x={x + 2}
        y={y + height - (height - 4) * fillDensity - 2}
        width={width - 4}
        height={(height - 4) * fillDensity}
        fill={`hsla(${baseHue + 40}, 60%, 50%, ${bgOpacity})`}
        rx={2}
        className={`transition-transform duration-200 ${hovered ? 'scale-[1.02]' : ''}`}
        style={{ transformOrigin: 'center' }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + 16}
          textAnchor="middle"
          className="fill-slate-300 text-xs font-medium"
        >
          {node.name}
        </text>
      )}
      {width > 40 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height - 8}
          textAnchor="middle"
          className="fill-slate-500 text-[10px] font-mono"
        >
          {(fillDensity * 100).toFixed(0)}%
        </text>
      )}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="transparent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="cursor-pointer"
      />
    </g>
  );
}

function layoutTreemap(
  node: TreeNode,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number
): TreemapCellProps[] {
  const result: TreemapCellProps[] = [];

  if (!node.children || node.children.length === 0) {
    result.push({ node, x, y, width, height, depth });
    return result;
  }

  result.push({ node, x, y, width, height, depth });

  const padding = depth === 0 ? 4 : 2;
  const innerX = x + padding;
  const innerY = y + padding + (depth === 0 ? 0 : 20);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2 - (depth === 0 ? 0 : 20);
  const totalValue = node.children.reduce((sum, c) => sum + (c.value ?? 1), 0);

  let currentX = innerX;
  let currentY = innerY;
  const horizontal = innerWidth > innerHeight;

  node.children.forEach((child) => {
    const ratio = (child.value ?? 1) / totalValue;
    const cellWidth = horizontal ? innerWidth * ratio : innerWidth;
    const cellHeight = horizontal ? innerHeight : innerHeight * ratio;

    result.push(...layoutTreemap(child, currentX, currentY, cellWidth, cellHeight, depth + 1));

    if (horizontal) currentX += cellWidth;
    else currentY += cellHeight;
  });

  return result;
}

export function KnowledgeTreemap({ width = 800, height = 500 }) {
  const cells = useMemo(() => layoutTreemap(knowledgeTree, 0, 0, width, height, 0), [width, height]);
  const leafCells = cells.filter((c) => !c.node.children);
  const avgFill = leafCells.reduce((sum, c) => sum + (c.node.fillDensity ?? 0), 0) / leafCells.length;

  return (
    <div className="space-y-4">
      <StatLine>
        Average knowledge density: <span className="font-semibold text-slate-200">{(avgFill * 100).toFixed(1)}%</span>
        <span className="ml-4 text-slate-500">(filled bars show exploration depth)</span>
      </StatLine>

      <svg width={width} height={height} className="bg-slate-950 rounded-lg border border-slate-800">
        {cells.slice(1).map((cell, i) => (
          <TreemapCell key={i} {...cell} />
        ))}
      </svg>
    </div>
  );
}

// ============================================================================
// EXPERIMENT 3: Critical Insight Score Matrix
// ============================================================================

interface Insight {
  id: string;
  claim: string;
  topic: string;
  surprising: number;
  important: number;
  compact: number;
}

const sampleInsights: Insight[] = [
  { id: '1', claim: 'Scaling laws may plateau within 2 orders of magnitude', topic: 'Capabilities', surprising: 75, important: 90, compact: 85 },
  { id: '2', claim: 'RLHF creates deceptive alignment incentives', topic: 'Alignment', surprising: 60, important: 95, compact: 70 },
  { id: '3', claim: 'Compute governance has 18-month policy window', topic: 'Governance', surprising: 80, important: 85, compact: 90 },
  { id: '4', claim: 'Lab safety culture varies 10x across organizations', topic: 'Institutions', surprising: 55, important: 70, compact: 80 },
  { id: '5', claim: 'Open-source models lag 6-12 months, not years', topic: 'Deployment', surprising: 70, important: 75, compact: 95 },
  { id: '6', claim: 'Interpretability tools scale sublinearly with model size', topic: 'Technical', surprising: 65, important: 80, compact: 75 },
  { id: '7', claim: 'China AI investment growing 40% YoY', topic: 'Geopolitics', surprising: 40, important: 85, compact: 90 },
  { id: '8', claim: 'Most alignment researchers expect <20 years to AGI', topic: 'Timelines', surprising: 50, important: 80, compact: 85 },
];

function ScoreBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="w-full h-4 bg-slate-800 rounded-sm overflow-hidden">
      <div
        className={`h-full ${colorClass} transition-all duration-300`}
        style={{ width: `${value}%`, opacity: 0.4 + (value / 100) * 0.6 }}
      />
    </div>
  );
}

export function InsightScoreMatrix() {
  const [sortBy, setSortBy] = useState<'surprising' | 'important' | 'compact' | 'combined'>('combined');

  const sortedInsights = useMemo(() => {
    return [...sampleInsights].sort((a, b) => {
      if (sortBy === 'combined') {
        return (b.surprising + b.important + b.compact) / 3 - (a.surprising + a.important + a.compact) / 3;
      }
      return b[sortBy] - a[sortBy];
    });
  }, [sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Sort by:</span>
        <div className="flex gap-1.5">
          {(['combined', 'surprising', 'important', 'compact'] as const).map((key) => (
            <ToggleButton key={key} active={sortBy === key} onClick={() => setSortBy(key)}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </ToggleButton>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-3 px-4 py-3 text-xs font-medium text-slate-500 border-b border-slate-800">
          <div>Claim</div>
          <div className="text-center">Surprising</div>
          <div className="text-center">Important</div>
          <div className="text-center">Compact</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {sortedInsights.map((insight) => (
            <div
              key={insight.id}
              className="grid grid-cols-[1fr_80px_80px_80px] gap-3 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors"
            >
              <div className="text-sm text-slate-300 truncate" title={insight.claim}>
                <span className="text-xs text-slate-500 mr-2">[{insight.topic}]</span>
                {insight.claim}
              </div>
              <ScoreBar value={insight.surprising} colorClass="bg-orange-500" />
              <ScoreBar value={insight.important} colorClass="bg-blue-500" />
              <ScoreBar value={insight.compact} colorClass="bg-green-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPERIMENT 4: Pixel Density Map
// ============================================================================

export function PixelDensityMap({
  width = 200,
  height = 200,
  pixelSize = 3,
}: {
  width?: number;
  height?: number;
  pixelSize?: number;
}) {
  const [seed, setSeed] = useState(42);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width * pixelSize, height * pixelSize);

    let s = seed;
    const random = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (random() < 0.02) {
          const importance = random();
          const surprising = random();
          const hue = 200 + (x / width) * 60 + (y / height) * 30;
          const saturation = 50 + surprising * 30;
          const lightness = 20 + importance * 40;
          const alpha = 0.4 + importance * 0.6;

          ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 0.5, pixelSize - 0.5);
        }
      }
    }
  }, [width, height, pixelSize, seed]);

  const totalPixels = width * height;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>
          {totalPixels.toLocaleString()} possible insight areas
          <span className="ml-2 text-slate-500">(~2% explored)</span>
        </StatLine>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="px-3 py-1.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors"
        >
          Regenerate
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={width * pixelSize}
        height={height * pixelSize}
        className="rounded-lg border border-slate-700"
      />

      <div className="text-xs text-slate-500">
        Each pixel = potential question × topic. Brightness = importance. Hue = domain.
      </div>
    </div>
  );
}

// ============================================================================
// EXPERIMENT 5: Research Frontier Visualization
// ============================================================================

export function ResearchFrontier({ width = 600, height = 400 }: { width?: number; height?: number }) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const regions = [
    { id: 'alignment', name: 'Alignment Research', x: 0.1, depth: 0.35, color: '#3b82f6' },
    { id: 'capabilities', name: 'Capabilities Forecasting', x: 0.25, depth: 0.25, color: '#8b5cf6' },
    { id: 'governance', name: 'AI Governance', x: 0.4, depth: 0.20, color: '#06b6d4' },
    { id: 'interpretability', name: 'Interpretability', x: 0.55, depth: 0.30, color: '#10b981' },
    { id: 'evals', name: 'Evaluations', x: 0.7, depth: 0.28, color: '#f59e0b' },
    { id: 'strategy', name: 'Field Strategy', x: 0.85, depth: 0.12, color: '#ef4444' },
  ];

  const colWidth = 60;

  return (
    <div className="space-y-4">
      <StatLine>
        Each column shows exploration depth.
        <span className="ml-2 text-slate-500">Taller = more explored</span>
      </StatLine>

      <svg width={width} height={height} className="bg-slate-950 rounded-lg border border-slate-800">
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={i}
            x1={0}
            y1={(i + 1) * (height / 5)}
            x2={width}
            y2={(i + 1) * (height / 5)}
            stroke="rgba(255,255,255,0.05)"
          />
        ))}

        {/* Labels */}
        <text x={width - 80} y={height - 15} className="fill-slate-600 text-xs">
          Unknown →
        </text>
        <text x={15} y={25} className="fill-slate-600 text-xs">
          ↑ Explored
        </text>

        {/* Columns */}
        {regions.map((region) => {
          const cx = region.x * width;
          const colHeight = region.depth * height * 0.75;
          const isHovered = hoveredRegion === region.id;

          return (
            <g key={region.id}>
              <ellipse cx={cx} cy={height - 5} rx={colWidth / 2 + 5} ry={8} fill={region.color} opacity={0.2} />
              <rect
                x={cx - colWidth / 2}
                y={height - colHeight}
                width={colWidth}
                height={colHeight}
                fill={region.color}
                opacity={isHovered ? 0.9 : 0.6}
                rx={4}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              <ellipse
                cx={cx}
                cy={height - colHeight}
                rx={colWidth / 2}
                ry={6}
                fill={region.color}
                opacity={isHovered ? 1 : 0.8}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              {isHovered && (
                <g>
                  <rect x={cx - 70} y={height - colHeight - 50} width={140} height={40} fill="rgba(0,0,0,0.9)" rx={6} />
                  <text x={cx} y={height - colHeight - 30} textAnchor="middle" className="fill-white text-xs font-medium">
                    {region.name}
                  </text>
                  <text x={cx} y={height - colHeight - 16} textAnchor="middle" className="fill-slate-400 text-[10px]">
                    {(region.depth * 100).toFixed(0)}% explored
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// EXPERIMENT 6: Priority Matrix (ITN Framework)
// ============================================================================

interface PriorityCell {
  area: string;
  importance: number;
  neglectedness: number;
  tractability: number;
}

const priorityData: PriorityCell[] = [
  { area: 'Deceptive alignment detection', importance: 95, neglectedness: 70, tractability: 30 },
  { area: 'Compute governance', importance: 85, neglectedness: 60, tractability: 55 },
  { area: 'Interpretability scaling', importance: 90, neglectedness: 45, tractability: 40 },
  { area: 'AI safety culture in labs', importance: 80, neglectedness: 55, tractability: 50 },
  { area: 'International coordination', importance: 85, neglectedness: 75, tractability: 25 },
  { area: 'Alignment theory', importance: 95, neglectedness: 35, tractability: 35 },
  { area: 'Evals for dangerous capabilities', importance: 88, neglectedness: 40, tractability: 60 },
  { area: 'Open source governance', importance: 70, neglectedness: 65, tractability: 45 },
  { area: 'Talent pipeline', importance: 75, neglectedness: 50, tractability: 65 },
  { area: 'Public communication', importance: 65, neglectedness: 55, tractability: 70 },
  { area: 'Model organisms of misalignment', importance: 85, neglectedness: 50, tractability: 45 },
  { area: 'Formal verification', importance: 80, neglectedness: 60, tractability: 25 },
];

export function PriorityMatrix() {
  const [hoveredCell, setHoveredCell] = useState<PriorityCell | null>(null);
  const [sizeBy, setSizeBy] = useState<'tractability' | 'combined'>('combined');

  const gridSize = 10;
  const cellSize = 40;
  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const svgWidth = gridSize * cellSize + margin.left + margin.right;
  const svgHeight = gridSize * cellSize + margin.top + margin.bottom;

  const getSize = (cell: PriorityCell) => {
    if (sizeBy === 'tractability') {
      return 10 + (cell.tractability / 100) * 15;
    }
    const combined = (cell.importance / 100) * (cell.neglectedness / 100) * (cell.tractability / 100);
    return 10 + combined * 20;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatLine>
          Position = Importance × Neglectedness. Size = {sizeBy === 'tractability' ? 'Tractability' : 'Combined'}.
        </StatLine>
        <div className="flex gap-1.5">
          <ToggleButton active={sizeBy === 'tractability'} onClick={() => setSizeBy('tractability')}>
            Size = Tractability
          </ToggleButton>
          <ToggleButton active={sizeBy === 'combined'} onClick={() => setSizeBy('combined')}>
            Size = Combined
          </ToggleButton>
        </div>
      </div>

      <svg width={svgWidth} height={svgHeight} className="bg-slate-950 rounded-lg border border-slate-800">
        <defs>
          <linearGradient id="priority-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <rect width={gridSize * cellSize} height={gridSize * cellSize} fill="url(#priority-gradient)" rx={6} />

          {Array.from({ length: gridSize + 1 }).map((_, i) => (
            <g key={i}>
              <line x1={i * cellSize} y1={0} x2={i * cellSize} y2={gridSize * cellSize} stroke="rgba(255,255,255,0.08)" />
              <line x1={0} y1={i * cellSize} x2={gridSize * cellSize} y2={i * cellSize} stroke="rgba(255,255,255,0.08)" />
            </g>
          ))}

          {priorityData.map((cell, i) => {
            const x = (cell.neglectedness / 100) * gridSize * cellSize;
            const y = ((100 - cell.importance) / 100) * gridSize * cellSize;
            const size = getSize(cell);
            const isHovered = hoveredCell?.area === cell.area;

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isHovered ? size * 1.3 : size}
                fill={`hsla(${200 + cell.tractability * 0.6}, 80%, 55%, 0.85)`}
                stroke="white"
                strokeWidth={isHovered ? 3 : 2}
                strokeOpacity={0.8}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredCell(cell)}
                onMouseLeave={() => setHoveredCell(null)}
              />
            );
          })}

          <text x={gridSize * cellSize / 2} y={gridSize * cellSize + 35} textAnchor="middle" className="fill-slate-400 text-sm">
            Neglectedness →
          </text>
          <text x={-gridSize * cellSize / 2} y={-35} textAnchor="middle" transform="rotate(-90)" className="fill-slate-400 text-sm">
            ← Importance
          </text>
          <text x={5} y={20} className="fill-slate-600 text-xs">High priority</text>
          <text x={gridSize * cellSize - 65} y={gridSize * cellSize - 10} className="fill-slate-600 text-xs">Low priority</text>
        </g>
      </svg>

      {hoveredCell && (
        <HoverPanel>
          <p className="font-semibold text-slate-200 mb-2">{hoveredCell.area}</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Importance:</span>{' '}
              <span className="text-blue-400 font-mono">{hoveredCell.importance}</span>
            </div>
            <div>
              <span className="text-slate-500">Neglectedness:</span>{' '}
              <span className="text-purple-400 font-mono">{hoveredCell.neglectedness}</span>
            </div>
            <div>
              <span className="text-slate-500">Tractability:</span>{' '}
              <span className="text-green-400 font-mono">{hoveredCell.tractability}</span>
            </div>
          </div>
        </HoverPanel>
      )}
    </div>
  );
}

// ============================================================================
// EXPERIMENT 7: Topic × Question Grid (SVG-based)
// ============================================================================

const topicLabels = [
  'Capabilities', 'Alignment', 'Governance', 'Compute', 'Coordination',
  'Strategy', 'Bioweapons', 'Cyber', 'Economics', 'Talent', 'Evals', 'Interp',
];

const questionLabels = [
  'What is it?', 'How likely?', 'How bad?', 'When?', 'Who works on it?',
  'What helps?', 'Key cruxes?', 'Evidence?', 'Forecasts?', 'Interventions?',
  'Dependencies?', 'History?',
];

const filledCells: Record<string, number> = {
  'Capabilities-What is it?': 85, 'Capabilities-How likely?': 60, 'Capabilities-When?': 70,
  'Capabilities-Who works on it?': 50, 'Capabilities-Forecasts?': 75,
  'Alignment-What is it?': 90, 'Alignment-Key cruxes?': 65, 'Alignment-What helps?': 80,
  'Alignment-Who works on it?': 70, 'Alignment-Evidence?': 45,
  'Governance-What is it?': 75, 'Governance-Interventions?': 85, 'Governance-Who works on it?': 60,
  'Compute-What is it?': 80, 'Compute-Forecasts?': 70, 'Compute-Dependencies?': 55,
  'Bioweapons-What is it?': 90, 'Bioweapons-How likely?': 75, 'Bioweapons-How bad?': 85,
  'Bioweapons-Evidence?': 80, 'Bioweapons-What helps?': 60,
  'Evals-What is it?': 70, 'Evals-Who works on it?': 50, 'Evals-Evidence?': 40,
  'Interp-What is it?': 65, 'Interp-What helps?': 55, 'Interp-Who works on it?': 60,
  'Strategy-Key cruxes?': 70, 'Strategy-What helps?': 50, 'Strategy-Interventions?': 45,
  'Coordination-What is it?': 40, 'Coordination-Key cruxes?': 30,
  'Economics-What is it?': 35, 'Economics-Forecasts?': 25,
  'Talent-What is it?': 50, 'Talent-Who works on it?': 45,
  'Cyber-What is it?': 55, 'Cyber-How likely?': 40,
};

// Color scale for quality values - returns fill color
function getQualityFill(quality: number): string {
  if (quality === 0) return '#1e293b'; // Empty: dark slate
  if (quality < 40) return '#1e3a5f';  // Low: dark blue
  if (quality < 60) return '#1d4ed8';  // Medium: blue
  if (quality < 80) return '#3b82f6';  // Good: bright blue
  return '#60a5fa';                     // High: light blue
}

export function TopicQuestionGrid() {
  const [hoveredCell, setHoveredCell] = useState<{ topic: string; question: string; quality: number } | null>(null);

  // Grid dimensions
  const cellSize = 32;
  const cellGap = 3;
  const labelWidth = 100;
  const headerHeight = 80; // Increased for rotated labels
  const rightPadding = 60;

  const gridWidth = topicLabels.length * (cellSize + cellGap) - cellGap;
  const gridHeight = questionLabels.length * (cellSize + cellGap) - cellGap;
  const svgWidth = labelWidth + gridWidth + rightPadding + 10;
  const svgHeight = headerHeight + gridHeight + 10;

  // Calculate stats
  const totalCells = topicLabels.length * questionLabels.length;
  const filledCount = Object.keys(filledCells).length;
  const emptyCount = totalCells - filledCount;
  const avgQuality = Object.values(filledCells).reduce((a, b) => a + b, 0) / filledCount;

  // Calculate per-question coverage
  const questionCoverage = useMemo(() => {
    return questionLabels.map((question) => {
      const filled = topicLabels.filter((t) => filledCells[`${t}-${question}`]).length;
      return { question, filled, total: topicLabels.length, pct: (filled / topicLabels.length) * 100 };
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Header stats - compact row */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-200">{filledCount}</span>
          <span className="text-slate-500">filled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-600">{emptyCount}</span>
          <span className="text-slate-500">empty</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-400">{avgQuality.toFixed(0)}</span>
          <span className="text-slate-500">avg quality</span>
        </div>

        {/* Color legend */}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: getQualityFill(0) }} />
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: getQualityFill(30) }} />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: getQualityFill(60) }} />
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: getQualityFill(90) }} />
            <span>High</span>
          </div>
        </div>
      </div>

      {/* SVG Grid */}
      <svg width={svgWidth} height={svgHeight} className="block">
        {/* Topic headers (rotated) */}
        {topicLabels.map((topic, colIdx) => {
          const x = labelWidth + colIdx * (cellSize + cellGap) + cellSize / 2;
          const y = headerHeight - 5;
          return (
            <text
              key={topic}
              x={x}
              y={y}
              textAnchor="start"
              transform={`rotate(-50, ${x}, ${y})`}
              className="fill-slate-400 text-[10px] font-medium"
            >
              {topic}
            </text>
          );
        })}

        {/* Question labels and rows */}
        {questionLabels.map((question, rowIdx) => {
          const y = headerHeight + rowIdx * (cellSize + cellGap);
          const coverage = questionCoverage[rowIdx];

          return (
            <g key={question}>
              {/* Row label */}
              <text
                x={labelWidth - 8}
                y={y + cellSize / 2 + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {question}
              </text>

              {/* Cells */}
              {topicLabels.map((topic, colIdx) => {
                const x = labelWidth + colIdx * (cellSize + cellGap);
                const key = `${topic}-${question}`;
                const quality = filledCells[key] || 0;
                const isHovered = hoveredCell?.topic === topic && hoveredCell?.question === question;

                return (
                  <rect
                    key={key}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={4}
                    fill={getQualityFill(quality)}
                    stroke={isHovered ? '#fff' : quality > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}
                    strokeWidth={isHovered ? 2 : 1}
                    className="cursor-pointer transition-all duration-100"
                    onMouseEnter={() => setHoveredCell({ topic, question, quality })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}

              {/* Row coverage bar */}
              <g transform={`translate(${labelWidth + gridWidth + 8}, ${y + 8})`}>
                <rect x={0} y={0} width={40} height={16} rx={3} fill="#1e293b" />
                <rect x={0} y={0} width={40 * (coverage.pct / 100)} height={16} rx={3} fill="#475569" />
                <text x={20} y={12} textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">
                  {coverage.pct.toFixed(0)}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Hover detail */}
      {hoveredCell && (
        <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-lg inline-block">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">{hoveredCell.topic}</p>
              <p className="text-xs text-slate-400">{hoveredCell.question}</p>
            </div>
            {hoveredCell.quality > 0 ? (
              <div className="text-right">
                <p className="text-xl font-bold text-blue-400">{hoveredCell.quality}</p>
                <p className="text-[10px] text-slate-500">quality</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No content</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Combined Demo Component
// ============================================================================

export function InsightGridExperiments() {
  const [experiment, setExperiment] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);

  const experiments = [
    { id: 1, name: 'Sparse Grid' },
    { id: 2, name: 'Treemap' },
    { id: 3, name: 'Score Matrix' },
    { id: 4, name: 'Pixel Map' },
    { id: 5, name: 'Frontier' },
    { id: 6, name: 'Priority' },
    { id: 7, name: 'Topic×Question' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {experiments.map((exp) => (
          <ToggleButton
            key={exp.id}
            active={experiment === exp.id}
            onClick={() => setExperiment(exp.id as typeof experiment)}
          >
            {exp.id}. {exp.name}
          </ToggleButton>
        ))}
      </div>

      <div className="min-h-[500px]">
        {experiment === 1 && <SparseKnowledgeGrid rows={40} cols={60} fillProbability={0.04} cellSize={10} />}
        {experiment === 2 && <KnowledgeTreemap width={700} height={450} />}
        {experiment === 3 && <InsightScoreMatrix />}
        {experiment === 4 && <PixelDensityMap width={150} height={150} pixelSize={4} />}
        {experiment === 5 && <ResearchFrontier width={650} height={400} />}
        {experiment === 6 && <PriorityMatrix />}
        {experiment === 7 && <TopicQuestionGrid />}
      </div>
    </div>
  );
}

export default InsightGridExperiments;
