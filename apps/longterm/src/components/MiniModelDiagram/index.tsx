import './MiniModelDiagram.css';

interface MiniNode {
  id: string;
  label: string;
  slug: string; // URL slug for navigation (matches OutlineView's label-based slugs)
  tier: 'cause' | 'intermediate' | 'effect';
  subgroup?: 'ai' | 'society';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniEdge {
  source: string;
  target: string;
}

// Node definitions with positions (SVG coordinates)
// Ultra-compact layout: tight spacing, minimal gaps
// Slugs match the label-based slugs used by OutlineView
const NODES: MiniNode[] = [
  // Tier 1: Root Factors (causes) - 7 nodes in a row
  { id: 'misalignment-potential', label: 'Safety', slug: 'ai-safety', tier: 'cause', subgroup: 'ai', x: 3, y: 3, width: 36, height: 16 },
  { id: 'ai-capabilities', label: 'Capabilities', slug: 'ai-capabilities', tier: 'cause', subgroup: 'ai', x: 42, y: 3, width: 48, height: 16 },
  { id: 'ai-uses', label: 'Uses', slug: 'ai-uses', tier: 'cause', subgroup: 'ai', x: 93, y: 3, width: 28, height: 16 },
  { id: 'ai-ownership', label: 'Ownership', slug: 'ai-ownership', tier: 'cause', subgroup: 'ai', x: 124, y: 3, width: 44, height: 16 },
  { id: 'civ-competence', label: 'Civ Comp', slug: 'civilizational-competence', tier: 'cause', subgroup: 'society', x: 178, y: 3, width: 42, height: 16 },
  { id: 'transition-turbulence', label: 'Turbulence', slug: 'transition-turbulence', tier: 'cause', subgroup: 'society', x: 223, y: 3, width: 46, height: 16 },
  { id: 'misuse-potential', label: 'Misuse', slug: 'misuse-potential', tier: 'cause', subgroup: 'society', x: 272, y: 3, width: 34, height: 16 },
  // Tier 2: Scenarios - 3 nodes
  { id: 'ai-takeover', label: 'AI Takeover', slug: 'ai-takeover', tier: 'intermediate', x: 22, y: 32, width: 62, height: 18 },
  { id: 'human-catastrophe', label: 'Human Catastrophe', slug: 'human-caused-catastrophe', tier: 'intermediate', x: 108, y: 32, width: 88, height: 18 },
  { id: 'long-term-lockin', label: 'Lock-in', slug: 'long-term-lock-in', tier: 'intermediate', x: 220, y: 32, width: 48, height: 18 },
  // Tier 3: Outcomes - 2 nodes
  { id: 'existential-catastrophe', label: 'Existential Catastrophe', slug: 'existential-catastrophe', tier: 'effect', x: 40, y: 62, width: 100, height: 18 },
  { id: 'long-term-trajectory', label: 'Long-term Trajectory', slug: 'long-term-trajectory', tier: 'effect', x: 165, y: 62, width: 90, height: 18 },
];

// Simplified edges (key connections only)
const EDGES: MiniEdge[] = [
  // Root Factors → Scenarios
  { source: 'misalignment-potential', target: 'ai-takeover' },
  { source: 'ai-capabilities', target: 'ai-takeover' },
  { source: 'misuse-potential', target: 'human-catastrophe' },
  { source: 'transition-turbulence', target: 'human-catastrophe' },
  { source: 'civ-competence', target: 'ai-takeover' },
  { source: 'civ-competence', target: 'human-catastrophe' },
  { source: 'ai-ownership', target: 'long-term-lockin' },
  { source: 'ai-uses', target: 'long-term-lockin' },
  { source: 'civ-competence', target: 'long-term-lockin' },
  // Scenarios → Outcomes
  { source: 'ai-takeover', target: 'existential-catastrophe' },
  { source: 'human-catastrophe', target: 'existential-catastrophe' },
  { source: 'ai-takeover', target: 'long-term-trajectory' },
  { source: 'long-term-lockin', target: 'long-term-trajectory' },
];

// Color configuration - desaturated for non-active, vivid for selected
const TIER_COLORS = {
  cause: {
    bg: '#f1f5f9',           // Desaturated gray-blue
    bgSelected: '#3b82f6',   // Vivid blue when selected
    border: '#cbd5e1',       // Muted border
    text: '#94a3b8',         // More muted text
    textSelected: '#ffffff',
  },
  intermediate: {
    bg: '#f5f3ff',           // Desaturated purple-gray
    bgSelected: '#8b5cf6',   // Vivid purple when selected
    border: '#ddd6fe',       // Muted border
    text: '#94a3b8',         // More muted text
    textSelected: '#ffffff',
  },
  effect: {
    bg: '#fefce8',           // Desaturated yellow-gray
    bgSelected: '#f59e0b',   // Vivid amber when selected
    border: '#fef08a',       // Muted border
    text: '#94a3b8',         // More muted text
    textSelected: '#ffffff',
  },
};

// Special colors for specific outcome nodes
const OUTCOME_COLORS: Record<string, typeof TIER_COLORS.effect> = {
  'existential-catastrophe': {
    bg: '#fef2f2',           // Desaturated red-gray
    bgSelected: '#ef4444',   // Vivid red when selected
    border: '#fecaca',       // Muted border
    text: '#94a3b8',         // More muted text
    textSelected: '#ffffff',
  },
  'long-term-trajectory': {
    bg: '#fefce8',           // Desaturated yellow-gray
    bgSelected: '#f59e0b',   // Vivid amber when selected
    border: '#fef08a',       // Muted border
    text: '#94a3b8',         // More muted text
    textSelected: '#ffffff',
  },
};

// Border radius by tier (matching main graph shapes)
const BORDER_RADIUS = {
  cause: 4,
  intermediate: 8,
  effect: 16,
};

interface MiniModelDiagramProps {
  selectedNodeId?: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export function MiniModelDiagram({ selectedNodeId, onNodeClick, className }: MiniModelDiagramProps) {
  const handleNodeClick = (node: MiniNode) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    } else {
      // Navigate to outline page with slug as hash (matches OutlineView's label-based slugs)
      window.location.href = `/ai-transition-model-views/outline#${node.slug}`;
    }
  };

  const getNodeColors = (node: MiniNode) => {
    if (node.tier === 'effect' && OUTCOME_COLORS[node.id]) {
      return OUTCOME_COLORS[node.id];
    }
    return TIER_COLORS[node.tier];
  };

  const getNodeById = (id: string) => NODES.find(n => n.id === id);

  // Calculate edge path - rectangular/orthogonal routing
  const getEdgePath = (edge: MiniEdge) => {
    const source = getNodeById(edge.source);
    const target = getNodeById(edge.target);
    if (!source || !target) return '';

    const sourceX = source.x + source.width / 2;
    const sourceY = source.y + source.height;
    const targetX = target.x + target.width / 2;
    const targetY = target.y;

    // Orthogonal routing: go down, then horizontal, then down
    // Place horizontal line closer to source (just 4px below source box)
    const midY = sourceY + 4;
    return `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  };

  return (
    <div className={`mini-model-diagram ${className || ''}`}>
      <svg viewBox="0 0 310 83" preserveAspectRatio="xMidYMid meet">

        {/* Edges (drawn first, behind nodes) */}
        <g className="mini-model-diagram__edges">
          {EDGES.map((edge, i) => (
            <path
              key={i}
              d={getEdgePath(edge)}
              className="mini-model-diagram__edge"
              markerEnd="url(#arrowhead)"
            />
          ))}
        </g>

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="4"
            markerHeight="4"
            refX="3.5"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 4 2, 0 4" fill="#e5e7eb" />
          </marker>
        </defs>

        {/* Nodes */}
        <g className="mini-model-diagram__nodes">
          {NODES.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const colors = getNodeColors(node);
            const borderRadius = BORDER_RADIUS[node.tier];

            return (
              <g
                key={node.id}
                className={`mini-model-diagram__node ${isSelected ? 'mini-model-diagram__node--selected' : ''}`}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={borderRadius}
                  ry={borderRadius}
                  fill={isSelected ? colors.bgSelected : colors.bg}
                  stroke={colors.border}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isSelected ? colors.textSelected : colors.text}
                  className="mini-model-diagram__node-label"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default MiniModelDiagram;
