/**
 * Dagre-based layout algorithm for hierarchical DAGs
 * Simpler and often cleaner than ELK for standard graphs
 */
import Dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData } from './types';
import { estimateNodeDimensions, getStyledEdges } from './layout-utils';

export function getDagreLayout(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[]
): { nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Adjust spacing based on graph size
  const isLargeGraph = nodes.length > 50;
  const nodeSpacing = isLargeGraph ? 30 : 50;
  const rankSpacing = isLargeGraph ? 120 : 80;

  g.setGraph({
    rankdir: 'TB',
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 40,
    marginy: 40,
    ranker: 'tight-tree',
    acyclicer: 'greedy',
    align: 'UL',
  });

  // Group nodes by type to assign ranks
  const causeNodes: string[] = [];
  const intermediateNodes: string[] = [];
  const effectNodes: string[] = [];

  nodes.forEach((node) => {
    const nodeType = node.data.type;
    if (nodeType === 'cause' || nodeType === 'leaf') {
      causeNodes.push(node.id);
    } else if (nodeType === 'intermediate') {
      intermediateNodes.push(node.id);
    } else if (nodeType === 'effect') {
      effectNodes.push(node.id);
    }
  });

  // Add nodes with dynamic dimensions based on type
  nodes.forEach((node) => {
    const dims = estimateNodeDimensions(node);
    g.setNode(node.id, {
      width: dims.width,
      height: dims.height,
    });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Add invisible edges to enforce layering: cause → intermediate → effect
  if (causeNodes.length > 0 && intermediateNodes.length > 0) {
    const firstCause = causeNodes[0];
    intermediateNodes.forEach(intNode => {
      if (!edges.some(e => e.source === firstCause && e.target === intNode)) {
        g.setEdge(firstCause, intNode, { weight: 0, minlen: 2 });
      }
    });
  }

  if (intermediateNodes.length > 0 && effectNodes.length > 0) {
    const firstIntermediate = intermediateNodes[0];
    effectNodes.forEach(effNode => {
      if (!edges.some(e => e.source === firstIntermediate && e.target === effNode)) {
        g.setEdge(firstIntermediate, effNode, { weight: 0, minlen: 2 });
      }
    });
  }

  // If no intermediates, connect causes directly to effects
  if (intermediateNodes.length === 0 && causeNodes.length > 0 && effectNodes.length > 0) {
    const firstCause = causeNodes[0];
    effectNodes.forEach(effNode => {
      if (!edges.some(e => e.source === firstCause && e.target === effNode)) {
        g.setEdge(firstCause, effNode, { weight: 0, minlen: 3 });
      }
    });
  }

  // Run the layout
  Dagre.layout(g);

  // Apply positions back to nodes, centering based on actual dimensions
  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const dims = estimateNodeDimensions(node);
    return {
      ...node,
      position: {
        x: dagreNode.x - dims.width / 2,
        y: dagreNode.y - dims.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges: getStyledEdges(edges) };
}
