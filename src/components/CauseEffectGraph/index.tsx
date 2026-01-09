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
import '../CauseEffectGraph.css';

import type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig } from './types';
import { GroupNode, SubgroupNode, CauseEffectNode } from './nodes';
import { DetailsPanel, Legend, DataView, OutlineView, InteractiveView, generateOutlineText, CopyIcon, CheckIcon, ExpandIcon, ShrinkIcon } from './components';
import { getLayoutedElements, toYaml } from './layout';

// Re-export types for external use
export type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig, LayoutOptions, TypeLabels, SubgroupConfig, LegendItem } from './types';

const nodeTypes = {
  causeEffect: CauseEffectNode,
  group: GroupNode,
  subgroup: SubgroupNode,
};

interface CauseEffectGraphProps {
  initialNodes: Node<CauseEffectNodeData>[];
  initialEdges: Edge<CauseEffectEdgeData>[];
  height?: string | number;
  fitViewPadding?: number;
  graphConfig?: GraphConfig;
  showFullscreenButton?: boolean;
}

export default function CauseEffectGraph({
  initialNodes,
  initialEdges,
  height = 500,
  fitViewPadding = 0.1,
  graphConfig,
  showFullscreenButton = true,
}: CauseEffectGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CauseEffectNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CauseEffectEdgeData>>([]);
  const [selectedNode, setSelectedNode] = useState<Node<CauseEffectNodeData> | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'interactive' | 'outline' | 'data'>('graph');
  const [copied, setCopied] = useState(false);

  const yamlData = toYaml(initialNodes, initialEdges);

  // Generate outline text for copy/display
  const outlineData = useMemo(() => {
    return generateOutlineText(initialNodes, graphConfig?.typeLabels, graphConfig?.subgroups);
  }, [initialNodes, graphConfig?.typeLabels, graphConfig?.subgroups]);

  const handleCopy = async () => {
    const textToCopy = activeTab === 'outline' ? outlineData : yamlData;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Layout effect
  useEffect(() => {
    setIsLayouting(true);
    getLayoutedElements(initialNodes, initialEdges, graphConfig).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    });
  }, [initialNodes, initialEdges, graphConfig, setNodes, setEdges]);

  // Event handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => setSelectedNode(node),
    []
  );

  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  const onNodeMouseEnter: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  // Compute connected nodes for hover highlighting
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const connected = new Set<string>([hoveredNodeId]);
    edges.forEach((edge) => {
      if (edge.source === hoveredNodeId) connected.add(edge.target);
      if (edge.target === hoveredNodeId) connected.add(edge.source);
    });
    return connected;
  }, [hoveredNodeId, edges]);

  // Style edges based on hover state (no labels - color/thickness encode the relationship)
  const styledEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map((edge) => {
      const isConnected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;

      return {
        ...edge,
        // No labels on hover - visual encoding (color/thickness) is sufficient
        label: undefined,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.15,
          strokeWidth: isConnected
            ? ((edge.style?.strokeWidth as number) || 2) * 1.3
            : edge.style?.strokeWidth,
        },
        markerEnd: isConnected
          ? edge.markerEnd
          : { ...(edge.markerEnd as object), color: '#d1d5db' },
        zIndex: isConnected ? 1000 : 0,
      };
    });
  }, [edges, hoveredNodeId]);

  // Style nodes based on hover state
  const styledNodes = useMemo(() => {
    if (!hoveredNodeId) return nodes;
    return nodes.map((node) => {
      if (node.type === 'group') return node;
      const isConnected = connectedNodeIds.has(node.id);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isConnected ? 1 : 0.3,
          zIndex: isConnected ? 1001 : undefined,
        },
      };
    });
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  // Keyboard handler for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Fullscreen body/sidebar handling
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';

    const elements = {
      siteHeader: document.querySelector('header.header') as HTMLElement,
      sidebar: document.querySelector('nav.sidebar') as HTMLElement,
      mainContent: document.querySelector('.main-frame') as HTMLElement,
      rightSidebar: document.querySelector(
        'aside.right-sidebar, starlight-toc, .right-sidebar-container'
      ) as HTMLElement,
      tocNav: document.querySelector('starlight-toc') as HTMLElement,
    };

    if (elements.siteHeader) elements.siteHeader.style.display = isFullscreen ? 'none' : '';
    if (elements.sidebar) elements.sidebar.style.display = isFullscreen ? 'none' : '';
    if (elements.mainContent) elements.mainContent.style.marginInlineStart = isFullscreen ? '0' : '';
    if (elements.rightSidebar) elements.rightSidebar.style.display = isFullscreen ? 'none' : '';
    if (elements.tocNav) elements.tocNav.style.display = isFullscreen ? 'none' : '';

    return () => {
      document.body.style.overflow = '';
      Object.values(elements).forEach((el) => {
        if (el) {
          el.style.display = '';
          if ('marginInlineStart' in el.style) el.style.marginInlineStart = '';
        }
      });
    };
  }, [isFullscreen]);

  const containerClass = `cause-effect-graph ${isFullscreen ? 'cause-effect-graph--fullscreen' : ''}`;

  return (
    <div className={containerClass} style={isFullscreen ? undefined : { height }}>
      {/* Header */}
      <div className="ceg-header">
        <div className="ceg-segmented-control">
          <button
            className={`ceg-segment-btn ${activeTab === 'graph' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            Graph
          </button>
          <button
            className={`ceg-segment-btn ${activeTab === 'interactive' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('interactive')}
          >
            Interactive
          </button>
          <button
            className={`ceg-segment-btn ${activeTab === 'outline' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('outline')}
          >
            Outline
          </button>
          <button
            className={`ceg-segment-btn ${activeTab === 'data' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data (YAML)
          </button>
          <a
            href="/ai-transition-model-list"
            className="ceg-segment-btn ceg-segment-link"
          >
            List View
          </a>
        </div>

        <div className="ceg-button-group">
          {(activeTab === 'outline' || activeTab === 'data') && (
            <button className="ceg-action-btn" onClick={handleCopy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          {showFullscreenButton && (
            <button className="ceg-action-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
              {isFullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="ceg-content">
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
            <Legend typeLabels={graphConfig?.typeLabels} customItems={graphConfig?.legendItems} />
            <DetailsPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}
        {activeTab === 'interactive' && (
          <InteractiveView
            nodes={initialNodes}
            edges={initialEdges}
            typeLabels={graphConfig?.typeLabels}
            subgroups={graphConfig?.subgroups}
          />
        )}
        {activeTab === 'outline' && (
          <OutlineView
            nodes={initialNodes}
            typeLabels={graphConfig?.typeLabels}
            subgroups={graphConfig?.subgroups}
          />
        )}
        {activeTab === 'data' && <DataView yaml={yamlData} />}
      </div>
    </div>
  );
}
