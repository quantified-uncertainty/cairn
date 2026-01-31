/**
 * Entity Graph Visualization Component
 *
 * Interactive graph visualization of entity relationships using React Flow.
 * Features:
 * - Force-directed layout
 * - Color-coded entity types
 * - Zoom and pan
 * - Click to view entity details
 * - Highlight orphans
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  prepareReactFlowData,
  TYPE_COLORS,
  findOrphans,
  getMostConnected,
  detectClusters,
  getEntityMap,
} from '@lib/graph-analysis';

interface EntityGraphProps {
  focusEntity?: string;
  showOrphans?: boolean;
  maxNodes?: number;
  height?: string;
}

export default function EntityGraph({
  focusEntity,
  showOrphans = false,
  maxNodes = 100,
  height = '600px',
}: EntityGraphProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const entityMap = useMemo(() => getEntityMap(), []);

  // Prepare graph data
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = prepareReactFlowData({
      focusEntity,
      showOrphans,
      maxNodes,
    });

    // Convert to React Flow format
    const flowNodes: Node[] = nodes.map(n => ({
      id: n.id,
      type: 'default',
      position: n.position,
      data: { label: n.data.label, ...n.data },
      style: n.style,
    }));

    const flowEdges: Edge[] = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated,
      style: e.style,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
    }));

    return { initialNodes: flowNodes, initialEdges: flowEdges };
  }, [focusEntity, showOrphans, maxNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node click
  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode(node.id);
  }, []);

  // Get stats
  const orphanCount = useMemo(() => findOrphans().length, []);
  const clusters = useMemo(() => detectClusters(), []);
  const topConnected = useMemo(() => getMostConnected(5), []);

  // Selected entity details
  const selectedEntity = selectedNode ? entityMap.get(selectedNode) : null;

  return (
    <div className="entity-graph-container" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background color="#aaa" gap={16} />

        {/* Legend Panel */}
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-sm">
          <h4 className="font-bold mb-2">Entity Types</h4>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(TYPE_COLORS).slice(0, 10).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs">{type}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Stats Panel */}
        <Panel position="top-right" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg text-sm">
          <h4 className="font-bold mb-2">Graph Stats</h4>
          <div className="space-y-1 text-xs">
            <div>Nodes: {nodes.length}</div>
            <div>Edges: {edges.length}</div>
            <div>Orphans: {orphanCount}</div>
            <div>Clusters: {clusters.length}</div>
          </div>
        </Panel>

        {/* Selected Entity Panel */}
        {selectedEntity && (
          <Panel position="bottom-right" className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
            <h4 className="font-bold text-lg mb-1">{selectedEntity.title}</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {selectedEntity.type}
            </div>
            {selectedEntity.description && (
              <p className="text-sm mb-3">{selectedEntity.description}</p>
            )}
            <a
              href={`/knowledge-base/${selectedEntity.type}s/${selectedEntity.id}/`}
              className="text-blue-600 hover:underline text-sm"
            >
              View Page →
            </a>
          </Panel>
        )}
      </ReactFlow>

      {/* Additional info below graph */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-bold mb-2">Most Connected Entities</h4>
          <ol className="list-decimal list-inside space-y-1">
            {topConnected.map(e => (
              <li key={e.id}>
                {e.title} <span className="text-gray-500">({e.connections})</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-bold mb-2">Largest Clusters</h4>
          <ul className="space-y-1">
            {clusters.slice(0, 5).map(c => (
              <li key={c.id}>
                <span className="font-medium">{entityMap.get(c.centralNode)?.title || c.centralNode}</span>
                <span className="text-gray-500"> ({c.size} entities)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
