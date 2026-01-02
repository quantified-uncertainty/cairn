import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type NodeMouseHandler,
} from '@xyflow/react';
import ELK from 'elkjs/lib/elk.bundled.js';
import '@xyflow/react/dist/style.css';
import './CauseEffectGraph.css';

const elk = new ELK();

// Types for our cause-effect data
export interface CauseEffectNodeData {
  label: string;
  description?: string;
  type?: 'leaf' | 'cause' | 'effect' | 'intermediate';
  confidence?: number;
  confidenceLabel?: string;
  details?: string;
  sources?: string[];
  relatedConcepts?: string[];
}

export interface CauseEffectEdgeData {
  label?: string;
  impact?: number;
  // New cleaner arrow properties
  strength?: 'strong' | 'medium' | 'weak';  // Maps to line thickness
  confidence?: 'high' | 'medium' | 'low';   // Maps to solid/dashed/dotted
  effect?: 'increases' | 'decreases';        // Maps to red/green color
}

// Convert graph data to YAML format
function toYaml(nodes: Node<CauseEffectNodeData>[], edges: Edge<CauseEffectEdgeData>[]): string {
  const lines: string[] = ['nodes:'];

  for (const node of nodes) {
    lines.push(`  - id: ${node.id}`);
    lines.push(`    label: "${node.data.label}"`);
    if (node.data.type) {
      lines.push(`    type: ${node.data.type}`);
    }
    if (node.data.confidence !== undefined) {
      lines.push(`    confidence: ${node.data.confidence}`);
    }
    if (node.data.confidenceLabel) {
      lines.push(`    confidenceLabel: "${node.data.confidenceLabel}"`);
    }
    if (node.data.description) {
      lines.push(`    description: "${node.data.description.replace(/"/g, '\\"')}"`);
    }
    if (node.data.details) {
      lines.push(`    details: "${node.data.details.replace(/"/g, '\\"')}"`);
    }
    if (node.data.relatedConcepts && node.data.relatedConcepts.length > 0) {
      lines.push(`    relatedConcepts:`);
      for (const concept of node.data.relatedConcepts) {
        lines.push(`      - "${concept}"`);
      }
    }
    if (node.data.sources && node.data.sources.length > 0) {
      lines.push(`    sources:`);
      for (const source of node.data.sources) {
        lines.push(`      - "${source}"`);
      }
    }
    lines.push('');
  }

  lines.push('edges:');
  for (const edge of edges) {
    lines.push(`  - source: ${edge.source}`);
    lines.push(`    target: ${edge.target}`);
    if (edge.data?.strength) {
      lines.push(`    strength: ${edge.data.strength}`);
    }
    if (edge.data?.confidence) {
      lines.push(`    confidence: ${edge.data.confidence}`);
    }
    if (edge.data?.effect) {
      lines.push(`    effect: ${edge.data.effect}`);
    }
    if (edge.data?.label) {
      lines.push(`    label: "${edge.data.label}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Node dimensions for layout calculation
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// Style edges based on strength and effect
// - Thickness: strong=4, medium=2.5, weak=1.5
// - Color: increases risk=red, decreases risk=green, neutral=gray
function getStyledEdges(edges: Edge<CauseEffectEdgeData>[]): Edge<CauseEffectEdgeData>[] {
  return edges.map((edge) => {
    const data = edge.data;

    // Determine stroke width from strength
    const strengthMap = { strong: 3.5, medium: 2, weak: 1.2 };
    const strokeWidth = data?.strength ? strengthMap[data.strength] : 2;

    // Determine color from effect
    const effectColors = {
      increases: '#dc2626',      // red - increases risk
      decreases: '#16a34a',      // green - decreases risk
    };
    const strokeColor = data?.effect ? effectColors[data.effect] : '#64748b'; // gray default

    return {
      ...edge,
      // Remove percentage labels - the visual encoding is now the information
      label: data?.label,
      labelStyle: data?.label ? { fontSize: 11, fontWeight: 500, fill: '#64748b' } : undefined,
      labelBgStyle: data?.label ? { fill: '#f8fafc', fillOpacity: 0.9 } : undefined,
      labelBgPadding: data?.label ? [4, 6] as [number, number] : undefined,
      labelBgBorderRadius: data?.label ? 4 : undefined,
      style: {
        ...edge.style,
        stroke: strokeColor,
        strokeWidth,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 16,
        height: 16,
      },
    };
  });
}

// ELK layout options
const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '80',
  'elk.spacing.edgeEdge': '20',
  'elk.spacing.edgeNode': '30',
  'elk.layered.spacing.nodeNodeBetweenLayers': '120',
  'elk.layered.spacing.edgeNodeBetweenLayers': '40',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
  'elk.edgeRouting': 'SPLINES',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  // Ensure proper layering respects constraints
  'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
  // Compact layout
  'elk.layered.compaction.postCompaction.strategy': 'LEFT_RIGHT_CONNECTION_LOCKING',
};

// Async ELK layout function with layer constraints based on node types
async function getLayoutedElements(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[]
): Promise<{ nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] }> {
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => {
      // Assign layer constraints based on node type
      // leaf and cause nodes → FIRST layer, effect nodes → LAST layer
      // intermediate nodes → no constraint (middle layer)
      const layoutOptions: Record<string, string> = {};
      if (node.data.type === 'leaf' || node.data.type === 'cause') {
        layoutOptions['elk.layered.layerConstraint'] = 'FIRST';
      } else if (node.data.type === 'effect') {
        layoutOptions['elk.layered.layerConstraint'] = 'LAST';
      }
      return {
        id: node.id,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        layoutOptions: Object.keys(layoutOptions).length > 0 ? layoutOptions : undefined,
      };
    }),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutedGraph = await elk.layout(graph);

  // First pass: get positions from ELK
  let layoutedNodes = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return { ...node, position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 } };
  });

  // Second pass: force same-type nodes into same horizontal row
  // Group nodes by type and compute target Y for each group
  const nodesByType: Record<string, typeof layoutedNodes> = {};
  for (const node of layoutedNodes) {
    const type = node.data.type || 'intermediate';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  }

  // For each type, set all nodes to the same Y (minimum Y in that group for consistent row)
  for (const type of Object.keys(nodesByType)) {
    const group = nodesByType[type];
    if (group.length > 1) {
      // Use minimum Y so the row is at the highest position of any node in that group
      const targetY = Math.min(...group.map(n => n.position.y));
      for (const node of group) {
        node.position.y = targetY;
      }
    }
  }

  // Third pass: redistribute X positions within each row to avoid overlaps and center
  for (const type of Object.keys(nodesByType)) {
    const group = nodesByType[type];
    if (group.length > 1) {
      // Sort by current X position
      group.sort((a, b) => a.position.x - b.position.x);
      // Calculate total width needed
      const spacing = NODE_WIDTH + 40; // node width + gap
      const totalWidth = group.length * spacing - 40;
      // Find center X of original positions
      const centerX = group.reduce((sum, n) => sum + n.position.x, 0) / group.length;
      // Redistribute evenly centered around that point
      const startX = centerX - totalWidth / 2;
      group.forEach((node, i) => {
        node.position.x = startX + i * spacing;
      });
    }
  }

  return { nodes: layoutedNodes, edges: getStyledEdges(edges) };
}

// Custom node component
function CauseEffectNode({ data, selected }: NodeProps<Node<CauseEffectNodeData>>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeType = data.type || 'intermediate';

  const nodeTypeColors = {
    leaf: { bg: '#ecfdf5', border: '#059669', text: '#047857', accent: '#10b981' },  // Emerald/teal for Leaf Parameters
    cause: { bg: '#f1f5f9', border: '#475569', text: '#334155', accent: '#64748b' },  // Slate/gray for Aggregates
    effect: { bg: '#fef3c7', border: '#d97706', text: '#92400e', accent: '#f59e0b' },  // Amber for Ultimate Outcomes
    intermediate: { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8', accent: '#3b82f6' },  // Blue for Critical Outcomes
  };
  const colors = nodeTypeColors[nodeType];

  return (
    <div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: colors.bg,
        border: `2px solid ${selected ? colors.text : colors.border}`,
        minWidth: '140px',
        maxWidth: '180px',
        position: 'relative',
        boxShadow: selected ? `0 8px 24px rgba(0,0,0,0.15), 0 0 0 2px ${colors.accent}` : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
      <div style={{ fontWeight: 600, fontSize: '14px', color: colors.text, textAlign: 'center', lineHeight: 1.3 }}>
        {data.label}
      </div>
      {data.confidence !== undefined && (
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
          {data.confidenceLabel
            ? `${data.confidence > 1 ? Math.round(data.confidence) : Math.round(data.confidence * 100) + '%'} ${data.confidenceLabel}`
            : `${Math.round(data.confidence * 100)}% confidence`}
        </div>
      )}
      {showTooltip && data.description && (
        <div style={{
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
          marginTop: '12px', padding: '12px 16px', backgroundColor: '#1e293b', color: 'white',
          borderRadius: '8px', fontSize: '13px', maxWidth: '280px', zIndex: 1000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', whiteSpace: 'normal', lineHeight: '1.5',
        }}>
          {data.description}
          <div style={{
            position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent', borderBottom: '6px solid #1e293b',
          }} />
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: 'transparent', border: 'none', width: 1, height: 1 }} />
    </div>
  );
}

const nodeTypes = { causeEffect: CauseEffectNode };

// Details panel component
function DetailsPanel({ node, onClose }: { node: Node<CauseEffectNodeData> | null; onClose: () => void }) {
  if (!node) return null;
  const data = node.data;
  const nodeType = data.type || 'intermediate';

  return (
    <div className="cause-effect-graph__panel">
      <div className="cause-effect-graph__panel-header">
        <div>
          <span className={`cause-effect-graph__panel-badge cause-effect-graph__panel-badge--${nodeType}`}>
            {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
          </span>
          <h3 className="cause-effect-graph__panel-title">{data.label}</h3>
        </div>
        <button className="cause-effect-graph__panel-close" onClick={onClose} aria-label="Close panel">×</button>
      </div>
      <div className="cause-effect-graph__panel-content">
        {data.confidence !== undefined && (
          <div className="cause-effect-graph__panel-section">
            <div className="cause-effect-graph__panel-label">
              {data.confidenceLabel ? `${data.confidenceLabel.charAt(0).toUpperCase()}${data.confidenceLabel.slice(1)}` : 'Confidence Level'}
            </div>
            {data.confidence <= 1 ? (
              <div className="cause-effect-graph__progress">
                <div className="cause-effect-graph__progress-bar">
                  <div className="cause-effect-graph__progress-fill" style={{ width: `${data.confidence * 100}%` }} />
                </div>
                <span className="cause-effect-graph__progress-value">{Math.round(data.confidence * 100)}%</span>
              </div>
            ) : (
              <span className="cause-effect-graph__progress-value">{Math.round(data.confidence)}</span>
            )}
          </div>
        )}
        {data.description && (
          <div className="cause-effect-graph__panel-section">
            <div className="cause-effect-graph__panel-label">Description</div>
            <p className="cause-effect-graph__panel-text">{data.description}</p>
          </div>
        )}
        {data.details && (
          <div className="cause-effect-graph__panel-section">
            <div className="cause-effect-graph__panel-label">Details</div>
            <p className="cause-effect-graph__panel-text">{data.details}</p>
          </div>
        )}
        {data.relatedConcepts && data.relatedConcepts.length > 0 && (
          <div className="cause-effect-graph__panel-section">
            <div className="cause-effect-graph__panel-label">Related Concepts</div>
            <div className="cause-effect-graph__panel-tags">
              {data.relatedConcepts.map((concept, i) => (
                <span key={i} className="cause-effect-graph__panel-tag">{concept}</span>
              ))}
            </div>
          </div>
        )}
        {data.sources && data.sources.length > 0 && (
          <div className="cause-effect-graph__panel-section">
            <div className="cause-effect-graph__panel-label">Sources</div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
              {data.sources.map((source, i) => <li key={i}>{source}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


// Data view component - just renders the YAML content
function DataView({ yaml }: { yaml: string }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', backgroundColor: '#f8fafc', padding: '16px' }}>
      <pre style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre', margin: 0, color: '#1e293b' }}>
        <code>{yaml}</code>
      </pre>
    </div>
  );
}

// Copy icon
function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Chevron icon for collapsible legend
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Legend component for node types and arrow encoding
function Legend() {
  const [isExpanded, setIsExpanded] = useState(true);

  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: isExpanded ? '12px 16px' : '8px 12px',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#374151',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '200px',
    transition: 'padding 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
    gap: '8px',
  };

  const headerTitleStyle: React.CSSProperties = {
    fontWeight: 600,
    color: '#111827',
    fontSize: '12px',
  };

  const contentStyle: React.CSSProperties = {
    overflow: 'hidden',
    maxHeight: isExpanded ? '300px' : '0',
    opacity: isExpanded ? 1 : 0,
    marginTop: isExpanded ? '10px' : '0',
    transition: 'max-height 0.2s ease, opacity 0.2s ease, margin-top 0.2s ease',
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '10px',
  };

  const lastSectionStyle: React.CSSProperties = {
    marginBottom: '0',
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: 600,
    marginBottom: '4px',
    color: '#111827',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  };

  const nodeSwatchStyle = (color: string): React.CSSProperties => ({
    width: '14px',
    height: '14px',
    borderRadius: '4px',
    backgroundColor: color,
    border: `1px solid ${color}`,
  });

  const lineContainerStyle: React.CSSProperties = {
    width: '24px',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={legendStyle}>
      {/* Collapsible Header */}
      <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={headerTitleStyle}>Legend</span>
        <ChevronIcon expanded={isExpanded} />
      </div>

      {/* Collapsible Content */}
      <div style={contentStyle}>
        {/* Node Types */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Node Types</div>
          <div style={rowStyle}>
            <div style={nodeSwatchStyle('#ecfdf5')}></div>
            <span>Leaf Parameters</span>
          </div>
          <div style={rowStyle}>
            <div style={nodeSwatchStyle('#f1f5f9')}></div>
            <span>Aggregate Parameters</span>
          </div>
          <div style={rowStyle}>
            <div style={nodeSwatchStyle('#dbeafe')}></div>
            <span>Critical Outcomes</span>
          </div>
          <div style={rowStyle}>
            <div style={nodeSwatchStyle('#fef3c7')}></div>
            <span>Ultimate Outcomes</span>
          </div>
        </div>

        {/* Arrow Thickness */}
        <div style={sectionStyle}>
          <div style={titleStyle}>Arrow Strength</div>
          <div style={rowStyle}>
            <div style={lineContainerStyle}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#64748b" strokeWidth="3.5" /></svg>
            </div>
            <span>Strong</span>
          </div>
          <div style={rowStyle}>
            <div style={lineContainerStyle}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#64748b" strokeWidth="2" /></svg>
            </div>
            <span>Medium</span>
          </div>
          <div style={rowStyle}>
            <div style={lineContainerStyle}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#64748b" strokeWidth="1.2" /></svg>
            </div>
            <span>Weak</span>
          </div>
        </div>

        {/* Arrow Color */}
        <div style={lastSectionStyle}>
          <div style={titleStyle}>Arrow Direction</div>
          <div style={rowStyle}>
            <div style={lineContainerStyle}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#dc2626" strokeWidth="2" /></svg>
            </div>
            <span>Increases risk</span>
          </div>
          <div style={rowStyle}>
            <div style={lineContainerStyle}>
              <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#16a34a" strokeWidth="2" /></svg>
            </div>
            <span>Decreases risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fullscreen icon components
function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function ShrinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

// Props for the main component
interface CauseEffectGraphProps {
  initialNodes: Node<CauseEffectNodeData>[];
  initialEdges: Edge<CauseEffectEdgeData>[];
  height?: string | number;
  fitViewPadding?: number;
}

export default function CauseEffectGraph({
  initialNodes,
  initialEdges,
  height = 500,
  fitViewPadding = 0.3,
}: CauseEffectGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CauseEffectNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CauseEffectEdgeData>>([]);
  const [selectedNode, setSelectedNode] = useState<Node<CauseEffectNodeData> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('graph');
  const [copied, setCopied] = useState(false);

  const yamlData = toYaml(initialNodes, initialEdges);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    setIsLayouting(true);
    getLayoutedElements(initialNodes, initialEdges).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    });
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onNodeClick: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  // Hover handlers for path highlighting
  const onNodeMouseEnter: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback((_, node) => {
    setHoveredNodeId(node.id);
  }, []);
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Compute which nodes are connected to hovered node
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>([hoveredNodeId]);
    edges.forEach(edge => {
      if (edge.source === hoveredNodeId) connected.add(edge.target);
      if (edge.target === hoveredNodeId) connected.add(edge.source);
    });
    return connected;
  }, [hoveredNodeId, edges]);

  // Style edges based on hover state
  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map(edge => {
      const isConnected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      // Generate label from effect type when connected
      const effectLabel = edge.data?.effect === 'increases' ? 'increases risk'
                        : edge.data?.effect === 'decreases' ? 'decreases risk'
                        : undefined;
      const hoverLabel = isConnected ? (edge.data?.label || effectLabel) : undefined;
      return {
        ...edge,
        label: hoverLabel,
        labelStyle: hoverLabel ? { fontSize: 10, fontWeight: 500, fill: '#374151' } : undefined,
        labelBgStyle: hoverLabel ? { fill: '#ffffff', fillOpacity: 0.95 } : undefined,
        labelBgPadding: hoverLabel ? [4, 6] as [number, number] : undefined,
        labelBgBorderRadius: hoverLabel ? 4 : undefined,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.15,
          strokeWidth: isConnected ? (edge.style?.strokeWidth as number || 2) * 1.3 : edge.style?.strokeWidth,
        },
        markerEnd: isConnected ? edge.markerEnd : {
          ...(edge.markerEnd as object),
          color: '#d1d5db',
        },
        zIndex: isConnected ? 1000 : 0,
      };
    });
  }, [edges, hoveredNodeId]);

  // Style nodes based on hover state (dim unconnected nodes)
  const styledNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    return nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: connectedNodeIds.has(node.id) ? 1 : 0.3,
      },
    }));
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    // Hide Starlight header, left sidebar, and right sidebar (TOC) in fullscreen mode
    const siteHeader = document.querySelector('header.header') as HTMLElement;
    const sidebar = document.querySelector('nav.sidebar') as HTMLElement;
    const mainContent = document.querySelector('.main-frame') as HTMLElement;
    const rightSidebar = document.querySelector('aside.right-sidebar, starlight-toc, .right-sidebar-container') as HTMLElement;
    const tocNav = document.querySelector('starlight-toc') as HTMLElement;

    if (siteHeader) {
      siteHeader.style.display = isFullscreen ? 'none' : '';
    }
    if (sidebar) {
      sidebar.style.display = isFullscreen ? 'none' : '';
    }
    if (mainContent) {
      mainContent.style.marginInlineStart = isFullscreen ? '0' : '';
    }
    if (rightSidebar) {
      rightSidebar.style.display = isFullscreen ? 'none' : '';
    }
    if (tocNav) {
      tocNav.style.display = isFullscreen ? 'none' : '';
    }

    return () => {
      document.body.style.overflow = '';
      if (siteHeader) siteHeader.style.display = '';
      if (sidebar) sidebar.style.display = '';
      if (mainContent) mainContent.style.marginInlineStart = '';
      if (rightSidebar) rightSidebar.style.display = '';
      if (tocNav) tocNav.style.display = '';
    };
  }, [isFullscreen]);

  const containerClass = `cause-effect-graph ${isFullscreen ? 'cause-effect-graph--fullscreen' : ''}`;

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    flexShrink: 0,
  };

  const segmentedControlStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    padding: '3px',
    gap: '2px',
  };

  const segmentButtonStyle = (isActive: boolean): React.CSSProperties => ({
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '28px',
    padding: '0 12px',
    fontSize: '13px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 500,
    lineHeight: 1,
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#111827' : '#6b7280',
    boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
    transition: 'background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
  });

  const actionButtonStyle: React.CSSProperties = {
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '34px',
    padding: '0 12px',
    fontSize: '13px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 500,
    lineHeight: 1,
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    color: '#374151',
  };

  const buttonGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  };

  return (
    <div className={containerClass} style={isFullscreen ? undefined : { height }}>
      {/* Header */}
      <div style={headerStyle}>
        {/* Segmented Control */}
        <div style={segmentedControlStyle}>
          <button
            style={segmentButtonStyle(activeTab === 'graph')}
            onClick={() => setActiveTab('graph')}
          >
            Graph
          </button>
          <button
            style={segmentButtonStyle(activeTab === 'data')}
            onClick={() => setActiveTab('data')}
          >
            Data (YAML)
          </button>
        </div>

        {/* Action Buttons */}
        <div style={buttonGroupStyle}>
          {activeTab === 'data' && (
            <button style={actionButtonStyle} onClick={handleCopy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button style={actionButtonStyle} onClick={toggleFullscreen}>
            {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'graph' && (
          <div className="cause-effect-graph__content">
            {isLayouting && <div className="cause-effect-graph__loading">Computing layout...</div>}
            <ReactFlow
              nodes={styledNodes}
              edges={styledEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: fitViewPadding }}
              defaultEdgeOptions={{
                type: 'default',
                style: { stroke: '#94a3b8', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
              }}
            >
              <Controls />
            </ReactFlow>
            <Legend />
            <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
        {activeTab === 'data' && <DataView yaml={yamlData} />}
      </div>
    </div>
  );
}
