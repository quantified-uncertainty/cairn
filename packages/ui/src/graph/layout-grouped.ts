/**
 * Grouped layout algorithm - organizes nodes into category-based clusters
 * Uses Sugiyama-style crossing reduction for cluster positioning
 */
import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData } from './types';
import { estimateNodeDimensions, getStyledEdges } from './layout-utils';

// Category styling
const categoryColors: Record<string, { bg: string; border: string }> = {
  'misalignment-potential': { bg: 'rgba(252, 231, 243, 0.25)', border: 'rgba(236, 72, 153, 0.6)' },
  'ai-capabilities': { bg: 'rgba(219, 234, 254, 0.25)', border: 'rgba(59, 130, 246, 0.6)' },
  'ai-uses': { bg: 'rgba(209, 250, 229, 0.25)', border: 'rgba(16, 185, 129, 0.6)' },
  'ai-ownership': { bg: 'rgba(254, 243, 199, 0.25)', border: 'rgba(245, 158, 11, 0.6)' },
  'civilizational-competence': { bg: 'rgba(224, 231, 255, 0.25)', border: 'rgba(99, 102, 241, 0.6)' },
  'transition-turbulence': { bg: 'rgba(255, 237, 213, 0.25)', border: 'rgba(249, 115, 22, 0.6)' },
  'ai-takeover': { bg: 'rgba(237, 233, 254, 0.25)', border: 'rgba(139, 92, 246, 0.6)' },
  'human-caused-catastrophe': { bg: 'rgba(250, 232, 255, 0.25)', border: 'rgba(217, 70, 239, 0.6)' },
  'long-term-lockin': { bg: 'rgba(243, 232, 255, 0.25)', border: 'rgba(168, 85, 247, 0.6)' },
  'existential-catastrophe': { bg: 'rgba(254, 226, 226, 0.25)', border: 'rgba(239, 68, 68, 0.6)' },
  'lock-in': { bg: 'rgba(254, 249, 195, 0.25)', border: 'rgba(234, 179, 8, 0.6)' },
  'positive-transition': { bg: 'rgba(220, 252, 231, 0.25)', border: 'rgba(34, 197, 94, 0.6)' },
};

const categoryLabels: Record<string, string> = {
  'misalignment-potential': 'Misalignment Potential',
  'ai-capabilities': 'AI Capabilities',
  'ai-uses': 'AI Uses',
  'ai-ownership': 'AI Ownership',
  'civilizational-competence': 'Civilizational Competence',
  'transition-turbulence': 'Transition Turbulence',
  'ai-takeover': 'AI Takeover',
  'human-caused-catastrophe': 'Human-Caused Catastrophe',
  'long-term-lockin': 'Long-term Lock-in',
  'existential-catastrophe': 'Existential Catastrophe',
  'lock-in': 'Lock-in',
  'positive-transition': 'Positive Transition',
};

// Layout constants
const GRID_NODE_GAP_X = 25;
const GRID_NODE_GAP_Y = 20;
const MAX_NODES_PER_ROW = 3;
const CLUSTER_PADDING = 25;
const CLUSTER_HEADER = 35;
const CLUSTER_GAP_X = 40;
const CLUSTER_GAP_Y = 70;
const ROW_GAP = 45;
const MAX_ROW_WIDTH = 4500;

// Layer names for cluster IDs
const layerNames = ['root-causes', 'derived-causes', 'scenarios', 'outcomes', 'terminal'];
const layerTypeLabels = ['Root Causes', 'Derived Causes', 'Scenarios', 'Outcomes', 'Terminal Outcomes'];

export function getGroupedLayout(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[]
): { nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Build connectivity sets
  const nodesWithOutgoingEdges = new Set<string>();
  const nodesWithIncomingEdges = new Set<string>();
  edges.forEach((edge) => {
    nodesWithOutgoingEdges.add(edge.source);
    nodesWithIncomingEdges.add(edge.target);
  });

  // Terminal nodes: effect nodes with no outgoing edges
  const terminalNodes = new Set<string>();
  nodes.forEach((node) => {
    if (node.data.type === 'effect' && !nodesWithOutgoingEdges.has(node.id)) {
      terminalNodes.add(node.id);
    }
  });

  // Root nodes: cause/leaf nodes with no incoming edges
  const rootNodes = new Set<string>();
  nodes.forEach((node) => {
    const nodeType = node.data.type;
    if ((nodeType === 'cause' || nodeType === 'leaf') && !nodesWithIncomingEdges.has(node.id)) {
      rootNodes.add(node.id);
    }
  });

  // Step 1: Group nodes by category+layer combination
  const nodesByCluster = new Map<string, Node<CauseEffectNodeData>[]>();
  const nodeToCluster = new Map<string, string>();
  const clusterToLayer = new Map<string, number>();
  const clusterToCategory = new Map<string, string>();

  nodes.forEach((node) => {
    if (node.type === 'group') return;
    const category = node.data.subgroup || 'default';

    // Determine layer based on node type and connectivity
    const nodeType = node.data.type;
    let layer = 2; // Default to scenarios
    if (nodeType === 'cause' || nodeType === 'leaf') {
      layer = rootNodes.has(node.id) ? 0 : 1;
    } else if (nodeType === 'intermediate') {
      layer = 2;
    } else if (nodeType === 'effect') {
      layer = terminalNodes.has(node.id) ? 4 : 3;
    }

    const clusterId = `${category}:${layerNames[layer]}`;
    nodeToCluster.set(node.id, clusterId);
    clusterToLayer.set(clusterId, layer);
    clusterToCategory.set(clusterId, category);

    if (!nodesByCluster.has(clusterId)) {
      nodesByCluster.set(clusterId, []);
    }
    nodesByCluster.get(clusterId)!.push({ ...node });
  });

  // Step 2: Calculate inter-cluster edge weights
  const clusterEdgeWeights = new Map<string, Map<string, number>>();
  const strengthScore = { strong: 3, medium: 2, weak: 1 };

  edges.forEach((edge) => {
    const sourceCluster = nodeToCluster.get(edge.source);
    const targetCluster = nodeToCluster.get(edge.target);
    if (!sourceCluster || !targetCluster || sourceCluster === targetCluster) return;

    const weight = edge.data?.strength ? strengthScore[edge.data.strength] : 1;

    if (!clusterEdgeWeights.has(sourceCluster)) {
      clusterEdgeWeights.set(sourceCluster, new Map());
    }
    const sourceMap = clusterEdgeWeights.get(sourceCluster)!;
    sourceMap.set(targetCluster, (sourceMap.get(targetCluster) || 0) + weight);
  });

  // Step 3: For each cluster, arrange nodes in a grid layout
  const clusterLayouts = new Map<string, {
    nodes: Node<CauseEffectNodeData>[];
    width: number;
    height: number;
  }>();

  nodesByCluster.forEach((clusterNodes, clusterId) => {
    if (clusterNodes.length === 0) return;

    const sortedNodes = [...clusterNodes].sort((a, b) =>
      (a.data.label || '').localeCompare(b.data.label || '')
    );

    const numNodes = sortedNodes.length;
    const nodesPerRow = Math.min(MAX_NODES_PER_ROW, numNodes);

    let maxWidth = 0;
    let maxHeight = 0;
    const positionedNodes = sortedNodes.map((node, index) => {
      const dims = estimateNodeDimensions(node);
      const col = index % nodesPerRow;
      const row = Math.floor(index / nodesPerRow);

      const x = col * (dims.width + GRID_NODE_GAP_X);
      const y = row * (dims.height + GRID_NODE_GAP_Y);

      maxWidth = Math.max(maxWidth, x + dims.width);
      maxHeight = Math.max(maxHeight, y + dims.height);

      return { ...node, position: { x, y } };
    });

    clusterLayouts.set(clusterId, { nodes: positionedNodes, width: maxWidth, height: maxHeight });
  });

  // Step 4: Arrange clusters using Sugiyama-style crossing reduction
  const clustersByLayer = new Map<number, string[]>();
  clusterLayouts.forEach((_, clusterId) => {
    const layer = clusterToLayer.get(clusterId) ?? 0;
    if (!clustersByLayer.has(layer)) {
      clustersByLayer.set(layer, []);
    }
    clustersByLayer.get(layer)!.push(clusterId);
  });

  const sortedLayers = Array.from(clustersByLayer.keys()).sort((a, b) => a - b);

  // Helper functions for crossing reduction
  function getMedianPosition(
    clusterId: string,
    neighborLayer: string[],
    getWeight: (neighbor: string) => number,
    orderMap: Map<string, number>
  ): number | null {
    const positions: number[] = [];
    for (const neighbor of neighborLayer) {
      const weight = getWeight(neighbor);
      if (weight > 0) {
        const pos = orderMap.get(neighbor) ?? 0;
        for (let i = 0; i < weight; i++) {
          positions.push(pos);
        }
      }
    }
    if (positions.length === 0) return null;
    positions.sort((a, b) => a - b);
    const mid = Math.floor(positions.length / 2);
    return positions.length % 2 === 0
      ? (positions[mid - 1] + positions[mid]) / 2
      : positions[mid];
  }

  function countCrossings(
    upperLayer: string[],
    lowerLayer: string[],
    getEdgeWeight: (upper: string, lower: string) => number
  ): number {
    let crossings = 0;
    for (let i = 0; i < upperLayer.length; i++) {
      for (let j = i + 1; j < upperLayer.length; j++) {
        const u1 = upperLayer[i];
        const u2 = upperLayer[j];
        for (let k = 0; k < lowerLayer.length; k++) {
          for (let l = k + 1; l < lowerLayer.length; l++) {
            const v1 = lowerLayer[k];
            const v2 = lowerLayer[l];
            const w1 = getEdgeWeight(u1, v2);
            const w2 = getEdgeWeight(u2, v1);
            if (w1 > 0 && w2 > 0) {
              crossings += w1 * w2;
            }
          }
        }
      }
    }
    return crossings;
  }

  function getTotalCrossings(): number {
    let total = 0;
    for (let i = 0; i < sortedLayers.length - 1; i++) {
      const upper = clustersByLayer.get(sortedLayers[i]) || [];
      const lower = clustersByLayer.get(sortedLayers[i + 1]) || [];
      total += countCrossings(upper, lower, (u, l) =>
        clusterEdgeWeights.get(u)?.get(l) || 0
      );
    }
    return total;
  }

  // Initial positions based on edge density
  const clusterOrder = new Map<string, number>();
  for (const layerNum of sortedLayers) {
    const clusters = clustersByLayer.get(layerNum) || [];
    const edgeCounts = clusters.map(c => {
      let edgeTotal = 0;
      clusterEdgeWeights.get(c)?.forEach(w => edgeTotal += w);
      clusterEdgeWeights.forEach(targets => edgeTotal += targets.get(c) || 0);
      return { id: c, count: edgeTotal };
    });
    edgeCounts.sort((a, b) => b.count - a.count);

    const ordered: string[] = new Array(clusters.length);
    let left = Math.floor(clusters.length / 2);
    let right = left;
    let useLeft = true;
    for (const { id } of edgeCounts) {
      if (useLeft && left >= 0) {
        ordered[left--] = id;
      } else if (right < clusters.length) {
        ordered[right++] = id;
      }
      useLeft = !useLeft;
    }
    const result = ordered.filter(Boolean);
    result.forEach((id, idx) => clusterOrder.set(id, idx));
    clustersByLayer.set(layerNum, result);
  }

  // Median heuristic iterations
  const NUM_ITERATIONS = 8;
  for (let iteration = 0; iteration < NUM_ITERATIONS; iteration++) {
    // Top-down pass
    for (let i = 1; i < sortedLayers.length; i++) {
      const layerNum = sortedLayers[i];
      const prevLayerNum = sortedLayers[i - 1];
      const clusters = clustersByLayer.get(layerNum) || [];
      const prevClusters = clustersByLayer.get(prevLayerNum) || [];

      const medians = new Map<string, number>();
      for (const clusterId of clusters) {
        const median = getMedianPosition(
          clusterId,
          prevClusters,
          (prev) => clusterEdgeWeights.get(prev)?.get(clusterId) || 0,
          clusterOrder
        );
        medians.set(clusterId, median ?? clusterOrder.get(clusterId) ?? 0);
      }

      clusters.sort((a, b) => (medians.get(a) ?? 0) - (medians.get(b) ?? 0));
      clusters.forEach((id, idx) => clusterOrder.set(id, idx));
    }

    // Bottom-up pass
    for (let i = sortedLayers.length - 2; i >= 0; i--) {
      const layerNum = sortedLayers[i];
      const nextLayerNum = sortedLayers[i + 1];
      const clusters = clustersByLayer.get(layerNum) || [];
      const nextClusters = clustersByLayer.get(nextLayerNum) || [];

      const medians = new Map<string, number>();
      for (const clusterId of clusters) {
        const targets = clusterEdgeWeights.get(clusterId);
        const median = getMedianPosition(
          clusterId,
          nextClusters,
          (next) => targets?.get(next) || 0,
          clusterOrder
        );
        medians.set(clusterId, median ?? clusterOrder.get(clusterId) ?? 0);
      }

      clusters.sort((a, b) => (medians.get(a) ?? 0) - (medians.get(b) ?? 0));
      clusters.forEach((id, idx) => clusterOrder.set(id, idx));
    }

    // Transpose optimization
    const MAX_TRANSPOSE_PASSES = 3;
    for (const layerNum of sortedLayers) {
      const clusters = clustersByLayer.get(layerNum) || [];
      let passCount = 0;
      let improved = true;
      while (improved && passCount < MAX_TRANSPOSE_PASSES) {
        improved = false;
        passCount++;
        for (let j = 0; j < clusters.length - 1; j++) {
          const before = getTotalCrossings();
          [clusters[j], clusters[j + 1]] = [clusters[j + 1], clusters[j]];
          clusters.forEach((id, idx) => clusterOrder.set(id, idx));
          const after = getTotalCrossings();

          if (after < before) {
            improved = true;
          } else {
            [clusters[j], clusters[j + 1]] = [clusters[j + 1], clusters[j]];
            clusters.forEach((id, idx) => clusterOrder.set(id, idx));
          }
        }
      }
    }
  }

  // Calculate cluster positions with row wrapping
  const clusterPositions = new Map<string, { x: number; y: number }>();
  type ClusterRow = { clusters: string[]; width: number; height: number };
  const layerRows = new Map<number, ClusterRow[]>();

  for (const layerNum of sortedLayers) {
    const clusters = clustersByLayer.get(layerNum) || [];
    const rows: ClusterRow[] = [];
    let currentRow: ClusterRow = { clusters: [], width: 0, height: 0 };

    for (const clusterId of clusters) {
      const layout = clusterLayouts.get(clusterId);
      if (!layout) continue;

      const clusterWidth = layout.width + CLUSTER_PADDING * 2;
      const clusterHeight = layout.height + CLUSTER_PADDING * 2 + CLUSTER_HEADER;
      const newWidth = currentRow.width + (currentRow.clusters.length > 0 ? CLUSTER_GAP_X : 0) + clusterWidth;

      if (currentRow.clusters.length > 0 && newWidth > MAX_ROW_WIDTH) {
        rows.push(currentRow);
        currentRow = { clusters: [clusterId], width: clusterWidth, height: clusterHeight };
      } else {
        currentRow.clusters.push(clusterId);
        currentRow.width = newWidth;
        currentRow.height = Math.max(currentRow.height, clusterHeight);
      }
    }

    if (currentRow.clusters.length > 0) {
      rows.push(currentRow);
    }

    layerRows.set(layerNum, rows);
  }

  // Calculate layer heights and positions
  const layerHeights = new Map<number, number>();
  for (const layerNum of sortedLayers) {
    const rows = layerRows.get(layerNum) || [];
    let totalHeight = 0;
    for (let i = 0; i < rows.length; i++) {
      totalHeight += rows[i].height;
      if (i < rows.length - 1) totalHeight += ROW_GAP;
    }
    layerHeights.set(layerNum, totalHeight);
  }

  let globalMaxWidth = 0;
  layerRows.forEach((rows) => {
    for (const row of rows) {
      globalMaxWidth = Math.max(globalMaxWidth, row.width);
    }
  });

  const layerYPositions = new Map<number, number>();
  let currentY = 0;
  for (const layerNum of sortedLayers) {
    layerYPositions.set(layerNum, currentY);
    currentY += (layerHeights.get(layerNum) || 0) + CLUSTER_GAP_Y;
  }

  // Calculate cluster widths
  const clusterWidths = new Map<string, number>();
  clusterLayouts.forEach((layout, clusterId) => {
    clusterWidths.set(clusterId, layout.width + CLUSTER_PADDING * 2);
  });

  // Smart horizontal positioning (3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (const layerNum of sortedLayers) {
      const rows = layerRows.get(layerNum) || [];
      let rowY = layerYPositions.get(layerNum) || 0;

      for (const row of rows) {
        const targets: { id: string; targetX: number; width: number }[] = [];

        for (const clusterId of row.clusters) {
          const width = clusterWidths.get(clusterId) || 200;
          let sumX = 0;
          let totalWeight = 0;

          for (const otherLayerNum of sortedLayers) {
            if (otherLayerNum === layerNum) continue;
            const layerDistance = Math.abs(otherLayerNum - layerNum);
            const distanceWeight = 1 / layerDistance;

            const otherClusters = clustersByLayer.get(otherLayerNum) || [];
            for (const otherId of otherClusters) {
              const pos = clusterPositions.get(otherId);
              if (!pos) continue;

              const otherWidth = clusterWidths.get(otherId) || 200;
              const otherCenterX = pos.x + otherWidth / 2;

              let edgeWeight = clusterEdgeWeights.get(clusterId)?.get(otherId) || 0;
              edgeWeight += clusterEdgeWeights.get(otherId)?.get(clusterId) || 0;
              const weight = edgeWeight * distanceWeight;

              if (weight > 0) {
                sumX += otherCenterX * weight;
                totalWeight += weight;
              }
            }
          }

          const centerX = (globalMaxWidth - width) / 2;
          const targetX = totalWeight > 0 ? sumX / totalWeight - width / 2 : centerX;

          targets.push({ id: clusterId, targetX, width });
        }

        targets.sort((a, b) => a.targetX - b.targetX);

        let minRequiredWidth = 0;
        for (let i = 0; i < targets.length; i++) {
          minRequiredWidth += targets[i].width;
          if (i < targets.length - 1) minRequiredWidth += CLUSTER_GAP_X;
        }

        const rowStartX = Math.max(0, (globalMaxWidth - minRequiredWidth) / 2);
        let currentX = rowStartX;

        const placedPositions: { id: string; x: number; width: number }[] = [];
        for (let i = 0; i < targets.length; i++) {
          const { id, targetX, width } = targets[i];
          const desiredX = Math.max(currentX, targetX);

          let remainingWidth = 0;
          for (let j = i + 1; j < targets.length; j++) {
            remainingWidth += targets[j].width + CLUSTER_GAP_X;
          }
          const maxX = globalMaxWidth - remainingWidth - width;
          const finalX = Math.min(desiredX, Math.max(currentX, maxX));

          placedPositions.push({ id, x: finalX, width });
          currentX = finalX + width + CLUSTER_GAP_X;
        }

        for (const { id, x } of placedPositions) {
          clusterPositions.set(id, { x, y: rowY });
        }

        rowY += row.height + ROW_GAP;
      }
    }
  }

  // Step 5: Build final nodes with positions
  const finalNodes: Node<CauseEffectNodeData>[] = [];
  const clusterContainers: Node<CauseEffectNodeData>[] = [];

  clusterLayouts.forEach((layout, clusterId) => {
    const layer = clusterToLayer.get(clusterId) ?? 0;
    const category = clusterToCategory.get(clusterId) ?? 'default';
    const position = clusterPositions.get(clusterId);
    if (!position) return;

    const containerWidth = layout.width + CLUSTER_PADDING * 2;
    const containerHeight = layout.height + CLUSTER_PADDING * 2 + CLUSTER_HEADER;
    const clusterX = position.x;
    const clusterY = position.y;

    // Position nodes in cluster
    for (const node of layout.nodes) {
      finalNodes.push({
        ...node,
        position: {
          x: clusterX + CLUSTER_PADDING + node.position.x,
          y: clusterY + CLUSTER_PADDING + CLUSTER_HEADER + node.position.y,
        },
      });
    }

    // Create cluster container
    const colors = categoryColors[category] || { bg: 'rgba(100, 116, 139, 0.2)', border: 'rgba(100, 116, 139, 0.5)' };
    const categoryLabel = categoryLabels[category] || category;
    const clusterLabel = `${categoryLabel} (${layerTypeLabels[layer]})`;

    clusterContainers.push({
      id: `cluster-${clusterId}`,
      type: 'group',
      position: { x: clusterX, y: clusterY },
      data: { label: clusterLabel, type: 'cause' as const },
      style: {
        width: containerWidth,
        height: containerHeight,
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        zIndex: -1,
      },
      selectable: false,
      draggable: false,
    });
  });

  // Handle uncategorized nodes
  const defaultClusters = Array.from(clusterLayouts.keys()).filter(k => k.startsWith('default:'));
  if (defaultClusters.length > 0) {
    let maxY = 0;
    clusterContainers.forEach((c) => {
      const bottom = c.position.y + ((c.style?.height as number) || 0);
      maxY = Math.max(maxY, bottom);
    });

    for (const clusterId of defaultClusters) {
      const layout = clusterLayouts.get(clusterId);
      if (!layout) continue;
      for (const node of layout.nodes) {
        finalNodes.push({
          ...node,
          position: {
            x: node.position.x,
            y: maxY + CLUSTER_GAP_Y + node.position.y,
          },
        });
      }
    }
  }

  return {
    nodes: [...clusterContainers, ...finalNodes],
    edges: getStyledEdges(edges),
  };
}
