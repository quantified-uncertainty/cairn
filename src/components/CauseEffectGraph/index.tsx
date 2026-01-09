import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../CauseEffectGraph.css';

import type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig } from './types';
import { GroupNode, SubgroupNode, CauseEffectNode, ExpandableNode, ClusterNode, ClusterContainerNode } from './nodes';
import { Legend, DataView, CopyIcon, CheckIcon, ExpandIcon, ShrinkIcon } from './components';
import { getLayoutedElements, toYaml } from './layout';
import { ZoomProvider } from './ZoomContext';

// Re-export types for external use
export type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig, LayoutOptions, TypeLabels, SubgroupConfig, LegendItem, LayoutAlgorithm } from './types';
export type { ExpandableNodeData } from './nodes/ExpandableNode';
export type { ClusterNodeData } from './nodes/ClusterNode';
export type { ClusterContainerData } from './nodes/ClusterContainerNode';

const nodeTypes = {
  causeEffect: CauseEffectNode,
  group: GroupNode,
  subgroup: SubgroupNode,
  expandable: ExpandableNode,
  cluster: ClusterNode,
  clusterContainer: ClusterContainerNode,
};

interface CauseEffectGraphProps {
  initialNodes: Node<CauseEffectNodeData>[];
  initialEdges: Edge<CauseEffectEdgeData>[];
  height?: string | number;
  fitViewPadding?: number;
  graphConfig?: GraphConfig;
  showFullscreenButton?: boolean;
  hideListView?: boolean;  // Hide the "List View" tab link
  selectedNodeId?: string;  // ID of node to highlight as selected (e.g., the current page's node)
  minZoom?: number;  // Minimum zoom level (default 0.1 for large graphs)
  maxZoom?: number;  // Maximum zoom level (default 2)
  defaultZoom?: number;  // Initial zoom level (if not specified, fitView is used)
  showMiniMap?: boolean;  // Show mini-map navigation (default false)
  enablePathHighlighting?: boolean;  // Click nodes to highlight causal paths (default false)
}

// Helper to compute all nodes in a causal path (BFS both directions)
function computeCausalPath(
  startNodeId: string,
  edges: Edge<CauseEffectEdgeData>[],
  maxDepth: number = 10
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([startNodeId]);
  const edgeIds = new Set<string>();

  // Build adjacency maps
  const downstream = new Map<string, { nodeId: string; edgeId: string }[]>();
  const upstream = new Map<string, { nodeId: string; edgeId: string }[]>();

  for (const edge of edges) {
    if (!downstream.has(edge.source)) downstream.set(edge.source, []);
    downstream.get(edge.source)!.push({ nodeId: edge.target, edgeId: edge.id });

    if (!upstream.has(edge.target)) upstream.set(edge.target, []);
    upstream.get(edge.target)!.push({ nodeId: edge.source, edgeId: edge.id });
  }

  // BFS downstream
  let frontier = new Set([startNodeId]);
  for (let d = 0; d < maxDepth && frontier.size > 0; d++) {
    const nextFrontier = new Set<string>();
    for (const nodeId of frontier) {
      for (const { nodeId: nextId, edgeId } of downstream.get(nodeId) || []) {
        if (!nodeIds.has(nextId)) {
          nodeIds.add(nextId);
          edgeIds.add(edgeId);
          nextFrontier.add(nextId);
        } else {
          edgeIds.add(edgeId); // Still add the edge even if node already visited
        }
      }
    }
    frontier = nextFrontier;
  }

  // BFS upstream
  frontier = new Set([startNodeId]);
  for (let d = 0; d < maxDepth && frontier.size > 0; d++) {
    const nextFrontier = new Set<string>();
    for (const nodeId of frontier) {
      for (const { nodeId: nextId, edgeId } of upstream.get(nodeId) || []) {
        if (!nodeIds.has(nextId)) {
          nodeIds.add(nextId);
          edgeIds.add(edgeId);
          nextFrontier.add(nextId);
        } else {
          edgeIds.add(edgeId);
        }
      }
    }
    frontier = nextFrontier;
  }

  return { nodeIds, edgeIds };
}

// Helper to compute N-hop neighborhood around a center node (BFS both directions)
// Unlike computeCausalPath (which goes to maxDepth), this traverses bidirectionally
function computeNeighborhood(
  centerNodeId: string,
  edges: Edge<CauseEffectEdgeData>[],
  depth: number
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const nodeIds = new Set<string>([centerNodeId]);
  const edgeIds = new Set<string>();

  // Build bidirectional adjacency map
  const neighbors = new Map<string, { nodeId: string; edgeId: string }[]>();

  for (const edge of edges) {
    // Forward direction: source -> target
    if (!neighbors.has(edge.source)) neighbors.set(edge.source, []);
    neighbors.get(edge.source)!.push({ nodeId: edge.target, edgeId: edge.id });

    // Reverse direction: target -> source
    if (!neighbors.has(edge.target)) neighbors.set(edge.target, []);
    neighbors.get(edge.target)!.push({ nodeId: edge.source, edgeId: edge.id });
  }

  // BFS from center
  let frontier = new Set([centerNodeId]);
  for (let d = 0; d < depth && frontier.size > 0; d++) {
    const nextFrontier = new Set<string>();
    for (const nodeId of frontier) {
      for (const { nodeId: nextId, edgeId } of neighbors.get(nodeId) || []) {
        edgeIds.add(edgeId);
        if (!nodeIds.has(nextId)) {
          nodeIds.add(nextId);
          nextFrontier.add(nextId);
        }
      }
    }
    frontier = nextFrontier;
  }

  return { nodeIds, edgeIds };
}

// Inner component that has access to ReactFlow instance
function CauseEffectGraphInner({
  initialNodes,
  initialEdges,
  height = 500,
  fitViewPadding = 0.1,
  graphConfig,
  showFullscreenButton = true,
  hideListView = false,
  selectedNodeId,
  minZoom = 0.1,
  maxZoom = 2,
  defaultZoom,
  showMiniMap = false,
  enablePathHighlighting = false,
}: CauseEffectGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CauseEffectNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CauseEffectEdgeData>>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [pathHighlightNodeId, setPathHighlightNodeId] = useState<string | null>(null);
  const [isLayouting, setIsLayouting] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(1);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Track zoom level changes for semantic zoom
  // Zoom levels: far (<0.25), medium (0.25-0.5), close (0.5-0.9), detail (>0.9)
  const onViewportChange = useCallback((viewport: Viewport) => {
    setCurrentZoom(viewport.zoom);
  }, []);

  // Compute zoom level class for CSS-based semantic zoom
  const zoomLevelClass = useMemo(() => {
    if (currentZoom < 0.25) return 'ceg-zoom-far';
    if (currentZoom < 0.5) return 'ceg-zoom-medium';
    if (currentZoom < 0.9) return 'ceg-zoom-close';
    return 'ceg-zoom-detail';
  }, [currentZoom]);

  // Fit view handler for the "Fit All" button
  const handleFitView = useCallback(() => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: fitViewPadding, duration: 300 });
    }
  }, [fitViewPadding]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'walk' | 'data'>('graph');
  const [copied, setCopied] = useState(false);

  // Walk mode state
  const [walkCenterNodeId, setWalkCenterNodeId] = useState<string | null>(null);
  const [walkDepth, setWalkDepth] = useState<number>(2);

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

  // Layout effect - uses JSON stringify to ensure deep comparison of graphConfig
  const graphConfigKey = JSON.stringify(graphConfig);
  useEffect(() => {
    setIsLayouting(true);
    getLayoutedElements(initialNodes, initialEdges, graphConfig).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setIsLayouting(false);
    }).catch((error) => {
      console.error('Layout failed:', error);
      setIsLayouting(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges, graphConfigKey, setNodes, setEdges]);

  // Event handlers
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const toggleFullscreen = useCallback(() => setIsFullscreen((prev) => !prev), []);

  const onNodeMouseEnter: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => setHoveredNodeId(node.id),
    []
  );

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  // Edge hover handlers for showing labels
  const onEdgeMouseEnter: EdgeMouseHandler<Edge<CauseEffectEdgeData>> = useCallback(
    (_, edge) => setHoveredEdgeId(edge.id),
    []
  );

  const onEdgeMouseLeave = useCallback(() => setHoveredEdgeId(null), []);

  // Node click handler for path highlighting and walk mode
  const onNodeClick: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (event, node) => {
      // In walk mode, clicking sets the center node
      if (activeTab === 'walk') {
        // Don't allow clicking group/subgroup nodes
        if (node.type === 'group' || node.type === 'subgroup' || node.type === 'clusterContainer') return;
        setWalkCenterNodeId(node.id);
        setTimeout(() => {
          if (reactFlowInstance.current) {
            reactFlowInstance.current.fitView({ padding: 0.2, duration: 400 });
          }
        }, 100);
        return;
      }

      // Regular graph tab path highlighting
      if (!enablePathHighlighting) return;
      // Toggle: if clicking same node, clear; otherwise set new
      setPathHighlightNodeId((prev) => (prev === node.id ? null : node.id));
    },
    [enablePathHighlighting, activeTab]
  );

  // Compute path highlight data
  const pathHighlight = useMemo(() => {
    if (!pathHighlightNodeId || !enablePathHighlighting) {
      return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    }
    return computeCausalPath(pathHighlightNodeId, edges);
  }, [pathHighlightNodeId, edges, enablePathHighlighting]);

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

  // Style edges based on hover, path highlighting, and edge hover states
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isHoveredEdge = hoveredEdgeId === edge.id;
      const isConnectedToHoveredNode = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
      const isInPath = pathHighlight.edgeIds.has(edge.id);
      const hasPathHighlight = pathHighlight.nodeIds.size > 0;
      const hasHoveredNode = !!hoveredNodeId;

      // Determine if this edge should be highlighted
      const isHighlighted = isHoveredEdge || isConnectedToHoveredNode || isInPath;

      // Determine opacity based on state
      let opacity = 1;
      if (hasPathHighlight && !isInPath) {
        opacity = 0.15;
      } else if (hasHoveredNode && !isConnectedToHoveredNode) {
        opacity = 0.15;
      }

      // Show label on hover
      const edgeData = edge.data as CauseEffectEdgeData | undefined;
      const showLabel = isHoveredEdge && edgeData;
      const effectLabel = edgeData?.effect === 'decreases' ? '−' : edgeData?.effect === 'mixed' ? '±' : '+';
      const strengthLabel = edgeData?.strength === 'strong' ? 'Strong' : edgeData?.strength === 'weak' ? 'Weak' : '';

      return {
        ...edge,
        label: showLabel ? `${strengthLabel} ${effectLabel}`.trim() : undefined,
        labelStyle: showLabel ? {
          fill: '#f1f5f9',
          fontSize: 11,
          fontWeight: 500,
        } : undefined,
        labelBgStyle: showLabel ? {
          fill: edgeData?.effect === 'decreases' ? '#991b1b' : edgeData?.effect === 'mixed' ? '#854d0e' : '#166534',
          fillOpacity: 1,
        } : undefined,
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        style: {
          ...edge.style,
          opacity,
          strokeWidth: isHighlighted
            ? ((edge.style?.strokeWidth as number) || 2) * 1.5
            : edge.style?.strokeWidth,
        },
        markerEnd: isHighlighted
          ? edge.markerEnd
          : { ...(edge.markerEnd as object), color: '#d1d5db' },
        zIndex: isHighlighted ? 1000 : 0,
        className: isInPath ? 'react-flow__edge--path-highlighted' : undefined,
      };
    });
  }, [edges, hoveredNodeId, hoveredEdgeId, pathHighlight]);

  // Style nodes based on hover state, selection, and path highlighting
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.type === 'group' || node.type === 'subgroup' || node.type === 'clusterContainer') return node;

      const isSelected = selectedNodeId === node.id;
      const isPathRoot = pathHighlightNodeId === node.id;
      const isInPath = pathHighlight.nodeIds.has(node.id);
      const hasPathHighlight = pathHighlight.nodeIds.size > 0;
      const isConnected = hoveredNodeId ? connectedNodeIds.has(node.id) : true;

      // Determine opacity
      let opacity = 1;
      if (hasPathHighlight && !isInPath) {
        opacity = 0.3;
      } else if (hoveredNodeId && !isConnected) {
        opacity = 0.3;
      }

      return {
        ...node,
        selected: isSelected || isPathRoot,
        style: {
          ...node.style,
          opacity,
          zIndex: isInPath || isConnected ? 1001 : undefined,
        },
        className: isInPath ? 'react-flow__node--path-highlighted' : undefined,
      };
    });
  }, [nodes, hoveredNodeId, connectedNodeIds, selectedNodeId, pathHighlight, pathHighlightNodeId]);

  // Walk mode: compute neighborhood around center node
  const walkNeighborhood = useMemo(() => {
    if (!walkCenterNodeId) {
      return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    }
    return computeNeighborhood(walkCenterNodeId, edges, walkDepth);
  }, [walkCenterNodeId, edges, walkDepth]);

  // Walk mode: state for layouted nodes/edges
  const [walkLayoutedNodes, setWalkLayoutedNodes] = useState<Node<CauseEffectNodeData>[]>([]);
  const [walkLayoutedEdges, setWalkLayoutedEdges] = useState<Edge<CauseEffectEdgeData>[]>([]);
  const [isWalkLayouting, setIsWalkLayouting] = useState(false);

  // Walk mode: filter and center nodes when center or depth changes
  useEffect(() => {
    if (!walkCenterNodeId || walkNeighborhood.nodeIds.size === 0 || nodes.length === 0) {
      setWalkLayoutedNodes([]);
      setWalkLayoutedEdges([]);
      return;
    }

    // Get nodes from the already-layouted state (preserves types and data)
    const neighborhoodNodes = nodes.filter((node) => {
      if (node.type === 'group' || node.type === 'subgroup' || node.type === 'clusterContainer') return false;
      return walkNeighborhood.nodeIds.has(node.id);
    });

    const neighborhoodEdges = edges.filter((edge) =>
      walkNeighborhood.edgeIds.has(edge.id)
    );

    if (neighborhoodNodes.length === 0) {
      setWalkLayoutedNodes([]);
      setWalkLayoutedEdges([]);
      return;
    }

    // Find the center node to offset positions
    const centerNode = neighborhoodNodes.find((n) => n.id === walkCenterNodeId);
    const centerX = centerNode?.position?.x || 0;
    const centerY = centerNode?.position?.y || 0;

    // Apply walk-mode styling and center the layout around the selected node
    const styledWalkNodes = neighborhoodNodes.map((node) => {
      const isCenterNode = node.id === walkCenterNodeId;
      return {
        ...node,
        // Offset positions so center node is at origin
        position: {
          x: node.position.x - centerX,
          y: node.position.y - centerY,
        },
        // Clear any opacity styling from hover/path highlighting
        style: {
          ...node.style,
          opacity: 1,
        },
        // Mark center node as selected for ReactFlow's built-in highlighting
        selected: isCenterNode,
        // Add CSS class for custom styling
        className: isCenterNode ? 'walk-center-node' : undefined,
        zIndex: isCenterNode ? 1000 : 1,
      };
    });

    // Style edges for full opacity and visibility
    const styledWalkEdges = neighborhoodEdges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: 1,
        strokeWidth: 2.5,
      },
    }));

    setWalkLayoutedNodes(styledWalkNodes);
    setWalkLayoutedEdges(styledWalkEdges);

    // Fit view after update
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
      }
    }, 50);
  }, [walkCenterNodeId, walkNeighborhood, nodes, edges]);

  // Walk mode: get label for center node (for indicator)
  const walkCenterNodeLabel = useMemo(() => {
    if (!walkCenterNodeId) return '';
    const node = nodes.find((n) => n.id === walkCenterNodeId);
    return node?.data?.label || walkCenterNodeId;
  }, [walkCenterNodeId, nodes]);

  // Walk mode: handle node click to re-center
  const handleWalkNodeClick: NodeMouseHandler<Node<CauseEffectNodeData>> = useCallback(
    (_, node) => {
      // Don't allow clicking group/subgroup nodes
      if (node.type === 'group' || node.type === 'subgroup' || node.type === 'clusterContainer') return;

      // Set new center
      setWalkCenterNodeId(node.id);

      // Fit view after short delay to allow state update
      setTimeout(() => {
        if (reactFlowInstance.current) {
          reactFlowInstance.current.fitView({ padding: 0.2, duration: 400 });
        }
      }, 100);
    },
    []
  );

  // Walk mode: auto-select a node when entering walk mode without a center
  useEffect(() => {
    if (activeTab === 'walk' && !walkCenterNodeId && nodes.length > 0) {
      // Find valid nodes (not groups/subgroups/containers)
      const validNodes = nodes.filter(
        (n) => n.type !== 'group' && n.type !== 'subgroup' && n.type !== 'clusterContainer'
      );
      if (validNodes.length > 0) {
        // Pick a random node to start
        const randomNode = validNodes[Math.floor(Math.random() * validNodes.length)];
        setWalkCenterNodeId(randomNode.id);
      }
    }
  }, [activeTab, walkCenterNodeId, nodes]);

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

  const containerClass = `cause-effect-graph ${isFullscreen ? 'cause-effect-graph--fullscreen' : ''} ${zoomLevelClass}`;

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
            className={`ceg-segment-btn ${activeTab === 'walk' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('walk')}
          >
            Walk
          </button>
          <button
            className={`ceg-segment-btn ${activeTab === 'data' ? 'ceg-segment-btn--active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data (YAML)
          </button>
          {!hideListView && (
            <a
              href="/ai-transition-model-list"
              className="ceg-segment-btn ceg-segment-link"
            >
              List View
            </a>
          )}
        </div>

        <div className="ceg-button-group">
          {activeTab === 'walk' && (
            <div className="ceg-walk-controls">
              <label className="ceg-walk-depth-label">
                Depth: {walkDepth}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                value={walkDepth}
                onChange={(e) => setWalkDepth(Number(e.target.value))}
                className="ceg-walk-depth-slider"
              />
            </div>
          )}
          {(activeTab === 'graph' || activeTab === 'walk') && (
            <button className="ceg-action-btn" onClick={handleFitView} title="Fit all nodes in view">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
              Fit All
            </button>
          )}
          {activeTab === 'data' && (
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
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeClick={onNodeClick}
              onEdgeMouseEnter={onEdgeMouseEnter}
              onEdgeMouseLeave={onEdgeMouseLeave}
              onViewportChange={onViewportChange}
              nodeTypes={nodeTypes}
              fitView={!defaultZoom}
              fitViewOptions={{ padding: fitViewPadding }}
              minZoom={minZoom}
              maxZoom={maxZoom}
              defaultViewport={defaultZoom ? { x: 0, y: 0, zoom: defaultZoom } : undefined}
              onInit={(instance) => { reactFlowInstance.current = instance; }}
              defaultEdgeOptions={{
                type: 'default',
                style: { stroke: '#94a3b8', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
              }}
            >
              <Controls />
              {showMiniMap && (
                <MiniMap
                  nodeStrokeWidth={3}
                  zoomable
                  pannable
                  style={{ width: 150, height: 100 }}
                />
              )}
              {/* Zoom level indicator */}
              <div className="ceg-zoom-indicator">
                <span className="ceg-zoom-indicator__value">{Math.round(currentZoom * 100)}%</span>
                <span className="ceg-zoom-indicator__level">{zoomLevelClass.replace('ceg-zoom-', '')}</span>
              </div>
            </ReactFlow>
            <Legend typeLabels={graphConfig?.typeLabels} customItems={graphConfig?.legendItems} />
          </div>
        )}
        {activeTab === 'walk' && (
          <div className="cause-effect-graph__content">
            {!walkCenterNodeId ? (
              // Empty state - no center node selected
              <div className="ceg-walk-empty">
                <div className="ceg-walk-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                </div>
                <h3 className="ceg-walk-empty__title">Walk Mode</h3>
                <p className="ceg-walk-empty__description">
                  Click any node to center the view around it and explore its local neighborhood.
                </p>
                <p className="ceg-walk-empty__hint">
                  Use the Graph tab to browse the full graph, then click a node to start walking.
                </p>
              </div>
            ) : (
              // Walk view with layouted neighborhood graph
              <>
                {isWalkLayouting && <div className="cause-effect-graph__loading">Computing layout...</div>}
                <ReactFlow
                  nodes={walkLayoutedNodes}
                  edges={walkLayoutedEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeMouseEnter={onNodeMouseEnter}
                  onNodeMouseLeave={onNodeMouseLeave}
                  onNodeClick={onNodeClick}
                  onEdgeMouseEnter={onEdgeMouseEnter}
                  onEdgeMouseLeave={onEdgeMouseLeave}
                  onViewportChange={onViewportChange}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  onInit={(instance) => { reactFlowInstance.current = instance; }}
                  defaultEdgeOptions={{
                    type: 'default',
                    style: { stroke: '#94a3b8', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 16, height: 16 },
                  }}
                >
                  <Controls />
                  {/* Walk center indicator */}
                  <div className="ceg-walk-indicator">
                    <span className="ceg-walk-indicator__label">Centered on:</span>
                    <span className="ceg-walk-indicator__node">{walkCenterNodeLabel}</span>
                    <button
                      className="ceg-walk-indicator__clear"
                      onClick={() => setWalkCenterNodeId(null)}
                      title="Clear center node"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  {/* Zoom level indicator */}
                  <div className="ceg-zoom-indicator">
                    <span className="ceg-zoom-indicator__value">{Math.round(currentZoom * 100)}%</span>
                    <span className="ceg-zoom-indicator__level">{zoomLevelClass.replace('ceg-zoom-', '')}</span>
                  </div>
                </ReactFlow>
                <Legend typeLabels={graphConfig?.typeLabels} customItems={graphConfig?.legendItems} />
              </>
            )}
          </div>
        )}
        {activeTab === 'data' && <DataView yaml={yamlData} />}
      </div>
    </div>
  );
}

// Wrapper component that provides ReactFlow context
export default function CauseEffectGraph(props: CauseEffectGraphProps) {
  return (
    <ReactFlowProvider>
      <CauseEffectGraphInner {...props} />
    </ReactFlowProvider>
  );
}
