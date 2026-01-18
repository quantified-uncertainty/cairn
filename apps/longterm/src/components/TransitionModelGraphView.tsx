// Graph view for AI Transition Model
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
import { GroupNode, SubgroupNode, CauseEffectNode } from './CauseEffectGraph/nodes';
import { DetailsPanel, Legend } from './CauseEffectGraph/components';
import { getLayoutedElements } from './CauseEffectGraph/layout';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';
import TransitionModelNav from './TransitionModelNav';

const nodeTypes = {
  causeEffect: CauseEffectNode,
  group: GroupNode,
  subgroup: SubgroupNode,
};

const graphConfig = {
  layout: {
    containerWidth: 1600,
    centerX: 800,
    layerGap: 60,
    causeSpacing: 8,
    intermediateSpacing: 200,
    effectSpacing: 400,
  },
  typeLabels: {
    cause: 'Root Factors',
    intermediate: 'Ultimate Scenarios',
    effect: 'Ultimate Outcomes',
  },
  subgroups: {
    'ai': { label: 'AI System Factors', bgColor: 'rgba(219, 234, 254, 0.2)', borderColor: 'transparent' },
    'society': { label: 'Societal Factors', bgColor: 'rgba(209, 250, 229, 0.2)', borderColor: 'transparent' },
  },
};

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; width: 100%; overflow: hidden; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .tm-page { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
  .tm-content { flex: 1; position: relative; min-height: 0; }
`;

export default function TransitionModelGraphView() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CauseEffectNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CauseEffectEdgeData>>([]);
  const [selectedNode, setSelectedNode] = useState<Node<CauseEffectNodeData> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(true);

  useEffect(() => {
    setIsLayouting(true);
    getLayoutedElements(parameterNodes, parameterEdges, graphConfig).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    });
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
        label: undefined,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.15,
          strokeWidth: isConnected ? ((edge.style?.strokeWidth as number) || 2) * 1.3 : edge.style?.strokeWidth,
        },
        markerEnd: isConnected ? edge.markerEnd : { ...(edge.markerEnd as object), color: '#d1d5db' },
        zIndex: isConnected ? 1000 : 0,
      };
    });
  }, [edges, hoveredNodeId]);

  const styledNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    return nodes.map((node) => {
      if (node.type === 'group') return node;
      const isConnected = connectedNodeIds.has(node.id);
      return {
        ...node,
        style: { ...node.style, opacity: isConnected ? 1 : 0.3, zIndex: isConnected ? 1001 : undefined },
      };
    });
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  return (
    <>
      <style>{styles}</style>
      <div className="tm-page">
        <TransitionModelNav activeTab="graph" />
        <div className="tm-content">
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
            fitViewOptions={{ padding: 0.1 }}
            defaultEdgeOptions={{
              type: 'default',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
            }}
          >
            <Controls />
          </ReactFlow>
          <Legend typeLabels={graphConfig.typeLabels} />
          <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      </div>
    </>
  );
}
