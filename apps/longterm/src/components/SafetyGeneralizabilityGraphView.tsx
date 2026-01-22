// Graph view for Safety Research Generalizability Model (Option B - Approach-Centric)
import { useCallback, useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './CauseEffectGraph.css';

import type { CauseEffectNodeData, CauseEffectEdgeData } from './CauseEffectGraph/types';
import { CauseEffectNode } from './CauseEffectGraph/nodes';
import { DetailsPanel } from './CauseEffectGraph/components';
import { safetyGeneralizabilityNodes, safetyGeneralizabilityEdges } from '../data/safety-generalizability-graph-data';

const nodeTypes = {
  causeEffect: CauseEffectNode,
};

// Custom layout for approach-centric graph (multiple clusters)
function layoutApproachCentric(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[]
): { nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] } {
  // Group nodes by their target effect
  const effectNodes = nodes.filter(n => n.data.type === 'effect');
  const causeNodes = nodes.filter(n => n.data.type === 'cause');

  // Build a map of cause -> effect
  const causeToEffect = new Map<string, string>();
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (sourceNode?.data.type === 'cause' && targetNode?.data.type === 'effect') {
      causeToEffect.set(edge.source, edge.target);
    }
  }

  // Layout parameters
  const clusterWidth = 320;
  const clusterGap = 40;
  const nodeHeight = 80;
  const effectY = 400;
  const startX = 50;

  // Position effect nodes in a row
  const positionedNodes: Node<CauseEffectNodeData>[] = [];

  effectNodes.forEach((effect, idx) => {
    const centerX = startX + idx * (clusterWidth + clusterGap) + clusterWidth / 2;

    // Position the effect node
    positionedNodes.push({
      ...effect,
      position: { x: centerX - 100, y: effectY },
    });

    // Find all causes for this effect
    const effectCauses = causeNodes.filter(c => causeToEffect.get(c.id) === effect.id);

    // Separate into deps and threats based on subgroup
    const deps = effectCauses.filter(c => c.data.subgroup?.includes('-deps'));
    const threats = effectCauses.filter(c => c.data.subgroup?.includes('-threats'));

    // Position deps on the left side above effect
    deps.forEach((dep, depIdx) => {
      positionedNodes.push({
        ...dep,
        position: {
          x: centerX - 140,
          y: 50 + depIdx * (nodeHeight + 20),
        },
      });
    });

    // Position threats on the right side above effect
    threats.forEach((threat, threatIdx) => {
      positionedNodes.push({
        ...threat,
        position: {
          x: centerX + 20,
          y: 50 + threatIdx * (nodeHeight + 20),
        },
      });
    });
  });

  // Style edges
  const styledEdges = edges.map(edge => {
    const isDecrease = edge.data?.effect === 'decreases';
    const strength = edge.data?.strength || 'medium';
    const strokeWidth = strength === 'strong' ? 2.5 : strength === 'medium' ? 2 : 1.5;

    return {
      ...edge,
      style: {
        stroke: isDecrease ? '#ef4444' : '#22c55e',
        strokeWidth,
        strokeDasharray: isDecrease ? '5,5' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isDecrease ? '#ef4444' : '#22c55e',
        width: 16,
        height: 16,
      },
    };
  });

  return { nodes: positionedNodes, edges: styledEdges };
}

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; width: 100%; overflow: hidden; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .sg-page { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
  .sg-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
  }
  .sg-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .sg-header a:hover { color: #374151; }
  .sg-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .sg-header nav {
    display: flex;
    gap: 8px;
  }
  .sg-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .sg-header nav a:hover {
    background: #e5e7eb;
  }
  .sg-header nav a.active {
    background: #3b82f6;
    color: white;
  }
  .sg-content { flex: 1; position: relative; min-height: 0; }
  .sg-legend {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 12px;
    z-index: 10;
  }
  .sg-legend-title {
    font-weight: 600;
    margin-bottom: 8px;
    color: #374151;
  }
  .sg-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .sg-legend-line {
    width: 24px;
    height: 2px;
  }
  .sg-legend-line.increases {
    background: #22c55e;
  }
  .sg-legend-line.decreases {
    background: #ef4444;
    background: repeating-linear-gradient(
      90deg,
      #ef4444,
      #ef4444 5px,
      transparent 5px,
      transparent 10px
    );
  }
`;

export default function SafetyGeneralizabilityGraphView() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CauseEffectNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CauseEffectEdgeData>>([]);
  const [selectedNode, setSelectedNode] = useState<Node<CauseEffectNodeData> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutApproachCentric(
      safetyGeneralizabilityNodes,
      safetyGeneralizabilityEdges
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => setSelectedNode(node),
    []
  );

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onNodeMouseEnter: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>([hoveredNodeId]);
    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId) connected.add(edge.target);
      if (edge.target === hoveredNodeId) connected.add(edge.source);
    });
    return connected;
  }, [hoveredNodeId, edges]);

  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map((edge) => {
      const isConnected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.2,
        },
        zIndex: isConnected ? 1000 : 0,
      };
    });
  }, [edges, hoveredNodeId]);

  const styledNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    return nodes.map((node) => {
      const isConnected = connectedNodeIds.has(node.id);
      return {
        ...node,
        style: { ...node.style, opacity: isConnected ? 1 : 0.3 },
      };
    });
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  return (
    <>
      <style>{styles}</style>
      <div className="sg-page">
        <div className="sg-header">
          <a href="/knowledge-base/models/">
            <span>←</span> Models
          </a>
          <h1>Safety Research Generalizability</h1>
          <nav>
            <a href="/knowledge-base/models/safety-generalizability/graph" className="active">Graph</a>
            <a href="/knowledge-base/models/safety-generalizability/table">Table</a>
            <a href="/knowledge-base/models/safety-generalizability/matrix">Matrix</a>
          </nav>
        </div>
        <div className="sg-content">
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
            fitViewOptions={{ padding: 0.1 }}
          >
            <Controls />
          </ReactFlow>
          <div className="sg-legend">
            <div className="sg-legend-title">Edge Types</div>
            <div className="sg-legend-item">
              <div className="sg-legend-line increases"></div>
              <span>Enables / Supports</span>
            </div>
            <div className="sg-legend-item">
              <div className="sg-legend-line decreases"></div>
              <span>Threatens / Undermines</span>
            </div>
          </div>
          <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </>
  );
}
