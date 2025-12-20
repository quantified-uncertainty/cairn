import { useCallback, useState, useEffect } from 'react';
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
  type?: 'cause' | 'effect' | 'intermediate';
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

// Style edges based on strength, confidence, and effect
// - Thickness: strong=4, medium=2.5, weak=1.5
// - Style: high confidence=solid, medium=dashed, low=dotted
// - Color: increases risk=red, decreases risk=green, neutral=gray
function getStyledEdges(edges: Edge<CauseEffectEdgeData>[]): Edge<CauseEffectEdgeData>[] {
  return edges.map((edge) => {
    const data = edge.data;

    // Determine stroke width from strength
    const strengthMap = { strong: 3.5, medium: 2, weak: 1.2 };
    const strokeWidth = data?.strength ? strengthMap[data.strength] : 2;

    // Determine stroke dash array from confidence
    const confidenceMap = {
      high: undefined,           // solid line
      medium: '8 4',             // dashed
      low: '3 3'                 // dotted
    };
    const strokeDasharray = data?.confidence ? confidenceMap[data.confidence] : undefined;

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
        strokeDasharray,
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
  'elk.spacing.nodeNode': '120',
  'elk.spacing.edgeEdge': '25',
  'elk.spacing.edgeNode': '40',
  'elk.layered.spacing.nodeNodeBetweenLayers': '160',
  'elk.layered.spacing.edgeNodeBetweenLayers': '50',
  'elk.layered.spacing.edgeEdgeBetweenLayers': '25',
  'elk.edgeRouting': 'SPLINES',
  'elk.layered.mergeEdges': 'false',
  'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
};

// Async ELK layout function
async function getLayoutedElements(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[]
): Promise<{ nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] }> {
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({ id: node.id, width: NODE_WIDTH, height: NODE_HEIGHT })),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return { ...node, position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 } };
  });

  return { nodes: layoutedNodes, edges: getStyledEdges(edges) };
}

// Custom node component
function CauseEffectNode({ data, selected }: NodeProps<Node<CauseEffectNodeData>>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeType = data.type || 'intermediate';

  const nodeTypeColors = {
    cause: { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', accent: '#ef4444' },
    effect: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d', accent: '#22c55e' },
    intermediate: { bg: '#f5f3ff', border: '#7c3aed', text: '#6d28d9', accent: '#8b5cf6' },
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    // Hide Starlight header and sidebar in fullscreen mode
    const siteHeader = document.querySelector('header.header') as HTMLElement;
    const sidebar = document.querySelector('nav.sidebar') as HTMLElement;
    const mainContent = document.querySelector('.main-frame') as HTMLElement;

    if (siteHeader) {
      siteHeader.style.display = isFullscreen ? 'none' : '';
    }
    if (sidebar) {
      sidebar.style.display = isFullscreen ? 'none' : '';
    }
    if (mainContent) {
      mainContent.style.marginInlineStart = isFullscreen ? '0' : '';
    }

    return () => {
      document.body.style.overflow = '';
      if (siteHeader) siteHeader.style.display = '';
      if (sidebar) sidebar.style.display = '';
      if (mainContent) mainContent.style.marginInlineStart = '';
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
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
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
            <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
        {activeTab === 'data' && <DataView yaml={yamlData} />}
      </div>
    </div>
  );
}
