import { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface RiskNode {
  id: string;
  label: string;
  category: 'crux' | 'risk' | 'outcome' | 'capability' | 'intervention' | 'factor' | 'risk-category';
  description?: string;
  x?: number;
  y?: number;
}

interface RiskEdge {
  from: string;
  to: string;
  label?: string;
  type: 'causes' | 'mitigates' | 'requires' | 'enables' | 'blocks';
}

interface RiskDependencyGraphProps {
  nodes: RiskNode[];
  edges: RiskEdge[];
  title?: string;
  description?: string;
  width?: number;
  height?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  crux: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  risk: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  outcome: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  capability: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  intervention: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  factor: { bg: '#f3f4f6', border: '#9ca3af', text: '#374151' },
  'risk-category': { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
};

const EDGE_COLORS: Record<string, string> = {
  causes: '#ef4444',
  mitigates: '#10b981',
  requires: '#6366f1',
  enables: '#3b82f6',
  blocks: '#f59e0b',
};

// Auto-layout nodes in layers if no positions specified
function autoLayout(nodes: RiskNode[], edges: RiskEdge[], width: number, height: number): RiskNode[] {
  // Build dependency graph
  const inDegree: Record<string, number> = {};
  const outEdges: Record<string, string[]> = {};

  nodes.forEach(n => {
    inDegree[n.id] = 0;
    outEdges[n.id] = [];
  });

  edges.forEach(e => {
    if (e.type === 'causes' || e.type === 'requires' || e.type === 'enables') {
      inDegree[e.to] = (inDegree[e.to] || 0) + 1;
      outEdges[e.from] = outEdges[e.from] || [];
      outEdges[e.from].push(e.to);
    }
  });

  // Topological sort into layers
  const layers: string[][] = [];
  const assigned = new Set<string>();

  while (assigned.size < nodes.length) {
    const layer: string[] = [];
    nodes.forEach(n => {
      if (assigned.has(n.id)) return;
      // Node has no unassigned dependencies
      const deps = edges.filter(e => e.to === n.id && (e.type === 'causes' || e.type === 'requires' || e.type === 'enables'));
      const allDepsAssigned = deps.every(e => assigned.has(e.from));
      if (deps.length === 0 || allDepsAssigned) {
        layer.push(n.id);
      }
    });

    // Fallback: if no nodes can be added, add remaining nodes
    if (layer.length === 0) {
      nodes.forEach(n => {
        if (!assigned.has(n.id)) layer.push(n.id);
      });
    }

    layer.forEach(id => assigned.add(id));
    if (layer.length > 0) layers.push(layer);
  }

  // Assign positions
  const padding = 60;
  const layerWidth = (width - padding * 2) / Math.max(layers.length, 1);

  return nodes.map(node => {
    if (node.x !== undefined && node.y !== undefined) return node;

    const layerIdx = layers.findIndex(layer => layer.includes(node.id));
    const layer = layers[layerIdx];
    const nodeIdx = layer.indexOf(node.id);
    const layerHeight = (height - padding * 2) / Math.max(layer.length, 1);

    return {
      ...node,
      x: padding + layerIdx * layerWidth + layerWidth / 2,
      y: padding + nodeIdx * layerHeight + layerHeight / 2,
    };
  });
}

export function RiskDependencyGraph({
  nodes,
  edges,
  title,
  description,
  width = 800,
  height = 500
}: RiskDependencyGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const layoutNodes = autoLayout(nodes, edges, width, height);

  const getNodeById = useCallback((id: string) =>
    layoutNodes.find(n => n.id === id), [layoutNodes]);

  // Get edges connected to a node
  const getConnectedEdges = useCallback((nodeId: string) =>
    edges.filter(e => e.from === nodeId || e.to === nodeId), [edges]);

  const renderEdge = (edge: RiskEdge, index: number) => {
    const fromNode = getNodeById(edge.from);
    const toNode = getNodeById(edge.to);
    if (!fromNode || !toNode) return null;

    const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to ||
                          selectedNode === edge.from || selectedNode === edge.to;

    const x1 = fromNode.x!;
    const y1 = fromNode.y!;
    const x2 = toNode.x!;
    const y2 = toNode.y!;

    // Calculate control points for curved edges
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.2;

    const color = EDGE_COLORS[edge.type] || '#666';

    return (
      <g key={`edge-${index}`} style={{ opacity: isHighlighted ? 1 : 0.4, transition: 'opacity 0.2s' }}>
        <defs>
          <marker
            id={`arrowhead-${index}`}
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={color}
              opacity={isHighlighted ? 1 : 0.5}
            />
          </marker>
        </defs>
        <path
          d={`M ${x1} ${y1} Q ${midX + offset} ${midY - offset} ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={isHighlighted ? 2.5 : 1.5}
          markerEnd={`url(#arrowhead-${index})`}
          strokeDasharray={edge.type === 'mitigates' || edge.type === 'blocks' ? '5,5' : 'none'}
        />
        {edge.label && (
          <text
            x={midX + offset / 2}
            y={midY - offset / 2 - 5}
            fontSize="10"
            fill="#666"
            textAnchor="middle"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  const renderNode = (node: RiskNode) => {
    const colors = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.risk;
    const isHovered = hoveredNode === node.id;
    const isSelected = selectedNode === node.id;
    const isConnected = hoveredNode && getConnectedEdges(hoveredNode).some(
      e => e.from === node.id || e.to === node.id
    );

    const isHighlighted = isHovered || isSelected || isConnected;

    return (
      <g
        key={node.id}
        transform={`translate(${node.x}, ${node.y})`}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
        style={{ cursor: 'pointer', opacity: hoveredNode && !isHighlighted ? 0.3 : 1, transition: 'opacity 0.2s' }}
      >
        <rect
          x={-50}
          y={-20}
          width={100}
          height={40}
          rx={8}
          fill={colors.bg}
          stroke={colors.border}
          strokeWidth={isHighlighted ? 3 : 2}
        />
        <text
          x={0}
          y={5}
          fontSize="11"
          fontWeight="600"
          fill={colors.text}
          textAnchor="middle"
          style={{ pointerEvents: 'none' }}
        >
          {node.label.length > 14 ? node.label.slice(0, 12) + '...' : node.label}
        </text>
      </g>
    );
  };

  const selectedNodeData = selectedNode ? getNodeById(selectedNode) : null;
  const connectedEdges = selectedNode ? getConnectedEdges(selectedNode) : [];

  return (
    <Card className="my-6 p-6 bg-muted/50">
      {title && <h3 className="text-xl font-semibold text-foreground m-0 mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 p-3 bg-background rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-muted-foreground">Nodes:</span>
          {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
            <span
              key={cat}
              className="px-2 py-1 rounded border font-medium capitalize"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text
              }}
            >
              {cat}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-muted-foreground">Edges:</span>
          {Object.entries(EDGE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1 text-muted-foreground">
              <span
                className="w-5 h-0.5"
                style={{
                  backgroundColor: color,
                  borderStyle: (type === 'mitigates' || type === 'blocks') ? 'dashed' : 'solid'
                }}
              />
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Graph */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-w-full bg-background rounded-lg border border-border"
      >
        <g>
          {edges.map((edge, i) => renderEdge(edge, i))}
        </g>
        <g>
          {layoutNodes.map(node => renderNode(node))}
        </g>
      </svg>

      {/* Selected node details */}
      {selectedNodeData && (
        <div className="mt-4 p-4 bg-background rounded-lg border border-border">
          <h4 className="text-lg font-semibold text-foreground m-0 mb-2">{selectedNodeData.label}</h4>
          <span
            className="inline-block px-2 py-1 rounded border text-xs font-medium capitalize mb-2"
            style={{
              backgroundColor: CATEGORY_COLORS[selectedNodeData.category].bg,
              color: CATEGORY_COLORS[selectedNodeData.category].text,
              borderColor: CATEGORY_COLORS[selectedNodeData.category].border,
            }}
          >
            {selectedNodeData.category}
          </span>
          {selectedNodeData.description && (
            <p className="text-sm text-muted-foreground mt-2 mb-0">{selectedNodeData.description}</p>
          )}
          {connectedEdges.length > 0 && (
            <div className="mt-3">
              <strong className="text-sm text-foreground">Connections:</strong>
              <ul className="mt-1 pl-5 m-0">
                {connectedEdges.map((edge, i) => {
                  const other = edge.from === selectedNode ? edge.to : edge.from;
                  const otherNode = getNodeById(other);
                  const direction = edge.from === selectedNode ? '→' : '←';
                  return (
                    <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                      <span style={{ color: EDGE_COLORS[edge.type] }}>{edge.type}</span>
                      {' '}{direction} {otherNode?.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
