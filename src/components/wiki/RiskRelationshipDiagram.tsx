import React, { useMemo } from 'react';

interface RiskNode {
  id: string;
  title: string;
  href?: string;
  x?: number;  // Manual positioning (0-100 as percentage)
  y?: number;
  color?: string;  // Optional node border color
}

interface RiskEdge {
  from: string;
  to: string;
  type?: 'increases' | 'decreases' | 'enables' | 'related';
  label?: string;  // Edge label like "leads to", "enables", etc.
}

interface RiskCluster {
  id: string;
  label: string;
  risks: string[];
  color?: string;
}

interface RiskRelationshipDiagramProps {
  title?: string;
  nodes: RiskNode[];
  edges: RiskEdge[];
  clusters?: RiskCluster[];
  width?: number;
  height?: number;
  showClusters?: boolean;  // Whether to show cluster backgrounds
  layout?: 'auto' | 'manual';  // 'manual' uses node x,y positions
}

// Auto-layout when manual positions aren't provided
function computeAutoLayout(
  nodes: RiskNode[],
  edges: RiskEdge[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Count incoming edges to determine hierarchy level
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  nodes.forEach(n => {
    incomingCount.set(n.id, 0);
    outgoingCount.set(n.id, 0);
  });

  edges.forEach(e => {
    incomingCount.set(e.to, (incomingCount.get(e.to) || 0) + 1);
    outgoingCount.set(e.from, (outgoingCount.get(e.from) || 0) + 1);
  });

  // Sort nodes: sources (many outgoing, few incoming) on left, sinks on right
  const nodeScores = nodes.map(n => ({
    node: n,
    score: (outgoingCount.get(n.id) || 0) - (incomingCount.get(n.id) || 0)
  })).sort((a, b) => b.score - a.score);

  // Assign to columns based on score
  const cols = 4;
  const nodesPerCol = Math.ceil(nodes.length / cols);
  const padding = 80;
  const colWidth = (width - padding * 2) / (cols - 1);

  nodeScores.forEach((item, idx) => {
    const col = Math.floor(idx / nodesPerCol);
    const row = idx % nodesPerCol;
    const rowCount = Math.min(nodesPerCol, nodeScores.length - col * nodesPerCol);
    const rowHeight = (height - padding * 2) / Math.max(rowCount - 1, 1);

    positions.set(item.node.id, {
      x: padding + col * colWidth,
      y: padding + row * rowHeight
    });
  });

  return positions;
}

function getEdgeColor(type: RiskEdge['type']): string {
  switch (type) {
    case 'increases': return '#dc2626';
    case 'decreases': return '#2563eb';
    case 'enables': return '#d97706';
    default: return '#6b7280';
  }
}

export function RiskRelationshipDiagram({
  title,
  nodes,
  edges,
  clusters,
  width = 800,
  height = 500,
  showClusters = false,
  layout = 'auto',
}: RiskRelationshipDiagramProps) {
  const nodeWidth = 110;
  const nodeHeight = 40;
  const padding = 60;

  const positions = useMemo(() => {
    const pos = new Map<string, { x: number; y: number }>();

    // Check if manual positions are provided
    const hasManualPositions = nodes.some(n => n.x !== undefined && n.y !== undefined);

    if (layout === 'manual' && hasManualPositions) {
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          pos.set(node.id, {
            x: padding + (node.x / 100) * (width - padding * 2),
            y: padding + (node.y / 100) * (height - padding * 2)
          });
        }
      });
      return pos;
    }

    return computeAutoLayout(nodes, edges, width, height);
  }, [nodes, edges, width, height, layout]);

  // Cluster colors for node borders
  const clusterColors = clusters?.reduce((acc, cluster, idx) => {
    const colors = ['#6366f1', '#ef4444', '#10b981', '#f59e0b'];
    acc[cluster.id] = cluster.color || colors[idx % colors.length];
    return acc;
  }, {} as Record<string, string>) || {};

  const riskToCluster = clusters?.reduce((acc, cluster) => {
    cluster.risks.forEach(r => { acc[r] = cluster.id; });
    return acc;
  }, {} as Record<string, string>) || {};

  // Track edge pairs for curve offsetting
  const edgePairCount = new Map<string, number>();
  edges.forEach(edge => {
    const key = [edge.from, edge.to].sort().join('-');
    edgePairCount.set(key, (edgePairCount.get(key) || 0) + 1);
  });
  const edgePairIndex = new Map<string, number>();

  return (
    <div className="my-6">
      {title && <h4 className="text-base font-semibold text-foreground mb-3">{title}</h4>}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxWidth: '100%' }}
      >
        <defs>
          <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L0,7 L7,4 z" fill="#dc2626" />
          </marker>
          <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L0,7 L7,4 z" fill="#2563eb" />
          </marker>
          <marker id="arrow-gray" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,1 L0,7 L7,4 z" fill="#6b7280" />
          </marker>
        </defs>

        {/* Cluster backgrounds (optional, subtle) */}
        {showClusters && clusters?.map(cluster => {
          const clusterPositions = cluster.risks
            .map(id => positions.get(id))
            .filter((p): p is { x: number; y: number } => p !== undefined);

          if (clusterPositions.length < 2) return null;

          const minX = Math.min(...clusterPositions.map(p => p.x)) - nodeWidth / 2 - 20;
          const maxX = Math.max(...clusterPositions.map(p => p.x)) + nodeWidth / 2 + 20;
          const minY = Math.min(...clusterPositions.map(p => p.y)) - nodeHeight / 2 - 30;
          const maxY = Math.max(...clusterPositions.map(p => p.y)) + nodeHeight / 2 + 20;

          const color = clusterColors[cluster.id];

          return (
            <g key={cluster.id}>
              <rect
                x={minX} y={minY}
                width={maxX - minX} height={maxY - minY}
                rx={8}
                fill={color} fillOpacity={0.05}
                stroke={color} strokeOpacity={0.2}
                strokeWidth={1} strokeDasharray="4,4"
              />
              <text
                x={(minX + maxX) / 2} y={minY + 14}
                textAnchor="middle" fontSize={10} fontWeight={500}
                fill={color} opacity={0.7}
              >
                {cluster.label}
              </text>
            </g>
          );
        })}

        {/* Edges with labels */}
        {edges.map((edge, idx) => {
          const fromPos = positions.get(edge.from);
          const toPos = positions.get(edge.to);
          if (!fromPos || !toPos) return null;

          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return null;

          // Handle multiple edges between same pair
          const pairKey = [edge.from, edge.to].sort().join('-');
          const totalEdges = edgePairCount.get(pairKey) || 1;
          const currentIndex = edgePairIndex.get(pairKey) || 0;
          edgePairIndex.set(pairKey, currentIndex + 1);

          const angle = Math.atan2(dy, dx);

          // Calculate intersection with node rectangle
          const getIntersection = (pos: { x: number; y: number }, outgoing: boolean) => {
            const halfW = nodeWidth / 2 + 6;
            const halfH = nodeHeight / 2 + 6;
            const a = outgoing ? angle : angle + Math.PI;
            const tanA = Math.tan(a);

            if (Math.abs(Math.cos(a)) > 0.001) {
              const xInt = halfW * Math.sign(Math.cos(a));
              const yAtX = xInt * tanA;
              if (Math.abs(yAtX) <= halfH) {
                return { x: pos.x + xInt, y: pos.y + yAtX };
              }
            }
            const yInt = halfH * Math.sign(Math.sin(a));
            const xAtY = Math.abs(tanA) > 0.001 ? yInt / tanA : 0;
            return { x: pos.x + xAtY, y: pos.y + yInt };
          };

          const start = getIntersection(fromPos, true);
          const end = getIntersection(toPos, false);

          const color = getEdgeColor(edge.type);
          const markerId = edge.type === 'increases' ? 'arrow-red' :
                          edge.type === 'decreases' ? 'arrow-blue' : 'arrow-gray';

          // Curve calculation
          const curveOffset = totalEdges > 1 ? (currentIndex - (totalEdges - 1) / 2) * 25 : 0;
          const baseCurve = 15;

          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          const perpX = (-dy / dist) * (baseCurve + curveOffset);
          const perpY = (dx / dist) * (baseCurve + curveOffset);
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;

          // Label position (along the curve)
          const labelX = ctrlX;
          const labelY = ctrlY;
          const labelText = edge.label || '';

          return (
            <g key={idx}>
              <path
                d={`M${start.x},${start.y} Q${ctrlX},${ctrlY} ${end.x},${end.y}`}
                stroke={color}
                strokeWidth={1.5}
                fill="none"
                markerEnd={`url(#${markerId})`}
                opacity={0.6}
              />
              {labelText && (
                <g>
                  <rect
                    x={labelX - labelText.length * 3 - 4}
                    y={labelY - 7}
                    width={labelText.length * 6 + 8}
                    height={14}
                    fill="var(--sl-color-bg)"
                    rx={3}
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    fontSize={9}
                    fill={color}
                    fontWeight={500}
                  >
                    {labelText}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const clusterId = riskToCluster[node.id];
          // Use node.color first, then cluster color, then default
          const borderColor = node.color || (clusterId ? clusterColors[clusterId] : '#64748b');

          return (
            <g key={node.id}>
              <a href={node.href} style={{ textDecoration: 'none' }}>
                <rect
                  x={pos.x - nodeWidth / 2}
                  y={pos.y - nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  rx={6}
                  fill="var(--sl-color-bg)"
                  stroke={borderColor}
                  strokeWidth={2}
                  style={{ transition: 'stroke-width 0.15s, stroke 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.strokeWidth = '3'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.strokeWidth = '2'; }}
                />
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="var(--sl-color-text)"
                  style={{ pointerEvents: 'none' }}
                >
                  {wrapText(node.title, 15).map((line, i, arr) => (
                    <tspan key={i} x={pos.x} dy={i === 0 ? -(arr.length - 1) * 6 : 12}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </a>
            </g>
          );
        })}
      </svg>

      {/* Minimal legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground" style={{ opacity: 0.7 }}>
        <div className="flex items-center gap-1">
          <svg width="20" height="8" style={{ marginRight: '4px' }}>
            <line x1="0" y1="4" x2="14" y2="4" stroke="#dc2626" strokeWidth="1.5" />
            <polygon points="14,2 14,6 18,4" fill="#dc2626" />
          </svg>
          <span>increases</span>
        </div>
      </div>
    </div>
  );
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/[\s-]+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3);
}

export default RiskRelationshipDiagram;
