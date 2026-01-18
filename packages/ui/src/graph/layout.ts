/**
 * Main layout module - dispatches to appropriate layout algorithm
 *
 * Layout algorithms:
 * - ELK (default): Powerful layout with layer constraints, good for medium graphs
 * - Dagre: Simpler hierarchical layout, often cleaner for standard graphs
 * - Grouped: Category-based clustering with Sugiyama-style crossing reduction
 */
import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig } from './types';
import {
  NODE_WIDTH,
  SUBGROUP_PADDING,
  SUBGROUP_HEADER_HEIGHT,
  SUBGROUP_GAP,
  elkOptions as defaultElkOptions,
} from './config';

// Re-export shared utilities
export {
  getStyledEdges,
  estimateNodeWidth,
  estimateNodeDimensions,
  positionRow,
  getBarycenter,
  sortByBarycenter,
  groupNodesByType,
  groupNodesBySubgroup,
  createGroupContainer,
  LAYOUT_NODE_HEIGHT,
  DEFAULT_CONFIG,
  type LayoutedNode,
  type NodesByType,
} from './layout-utils';

// Import layout algorithms
import { getDagreLayout } from './layout-dagre';
import { getGroupedLayout } from './layout-grouped';
import {
  LAYOUT_NODE_HEIGHT,
  DEFAULT_CONFIG,
  getStyledEdges,
  positionRow,
  sortByBarycenter,
  groupNodesByType,
  groupNodesBySubgroup,
  createGroupContainer,
  estimateNodeWidth,
  type LayoutedNode,
} from './layout-utils';

// Layout algorithm type
export type LayoutAlgorithm = 'dagre' | 'grouped' | 'elk';

const elk = new ELK();

// Main layout function
export async function getLayoutedElements(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[],
  graphConfig?: GraphConfig
): Promise<{ nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] }> {
  // Determine layout algorithm to use
  const layoutAlgorithm = graphConfig?.layoutAlgorithm || (graphConfig?.useDagre ? 'dagre' : 'elk');

  // Use Grouped layout for category-based section containers
  if (layoutAlgorithm === 'grouped') {
    return getGroupedLayout(nodes, edges);
  }

  // Use Dagre for simpler hierarchical layouts
  if (layoutAlgorithm === 'dagre') {
    return getDagreLayout(nodes, edges, graphConfig);
  }

  // ELK layout (default)
  return getElkLayout(nodes, edges, graphConfig);
}

// ELK-based layout with support for subgroups and group containers
async function getElkLayout(
  nodes: Node<CauseEffectNodeData>[],
  edges: Edge<CauseEffectEdgeData>[],
  graphConfig?: GraphConfig
): Promise<{ nodes: Node<CauseEffectNodeData>[]; edges: Edge<CauseEffectEdgeData>[] }> {
  // Merge provided config with defaults
  const config = {
    ...DEFAULT_CONFIG,
    ...graphConfig,
    layout: { ...DEFAULT_CONFIG.layout, ...graphConfig?.layout },
    typeLabels: { ...DEFAULT_CONFIG.typeLabels, ...graphConfig?.typeLabels },
    subgroups: { ...DEFAULT_CONFIG.subgroups, ...graphConfig?.subgroups },
  };
  const layout = config.layout;

  // Build ELK options based on config
  const isCompact = graphConfig?.compactMode !== false; // Default to compact
  const useStraightEdges = graphConfig?.straightEdges === true; // Default to curved

  // Get config values, with fallbacks based on compact mode
  const configNodeSpacing = config.layout.causeSpacing;
  const configLayerGap = config.layout.layerGap;

  // Calculate actual spacing values
  const nodeNodeSpacing = configNodeSpacing ?? (isCompact ? 20 : 40);
  const layerSpacing = configLayerGap ?? (isCompact ? 40 : 80);

  const elkLayoutOptions = {
    ...defaultElkOptions,
    // Edge routing: SPLINES (curved) or POLYLINE (straight segments)
    'elk.edgeRouting': useStraightEdges ? 'POLYLINE' : 'SPLINES',
    // Node spacing (horizontal, within same layer)
    'elk.spacing.nodeNode': String(nodeNodeSpacing),
    'elk.spacing.edgeEdge': String(Math.max(2, nodeNodeSpacing * 0.3)),
    'elk.spacing.edgeNode': String(Math.max(2, nodeNodeSpacing * 0.5)),
    // Layer spacing (vertical, between layers)
    'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
    'elk.layered.spacing.edgeNodeBetweenLayers': String(Math.max(2, layerSpacing * 0.3)),
    'elk.layered.spacing.edgeEdgeBetweenLayers': String(Math.max(2, layerSpacing * 0.2)),
  };

  // Build ELK graph with layer constraints
  const graph = {
    id: 'root',
    layoutOptions: elkLayoutOptions,
    children: nodes.map((node) => {
      const layoutOptions: Record<string, string> = {};
      if (node.data.type === 'leaf' || node.data.type === 'cause') {
        layoutOptions['elk.layered.layerConstraint'] = 'FIRST';
      } else if (node.data.type === 'effect') {
        layoutOptions['elk.layered.layerConstraint'] = 'LAST';
      }
      // Use configurable node width from graphConfig, fallback to constant
      const configuredWidth = graphConfig?.nodeWidth ?? NODE_WIDTH;
      return {
        id: node.id,
        width: configuredWidth,
        height: LAYOUT_NODE_HEIGHT,
        layoutOptions: Object.keys(layoutOptions).length > 0 ? layoutOptions : undefined,
      };
    }),
    edges: edges.map((edge) => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })),
  };

  const layoutedGraph = await elk.layout(graph);

  // Apply ELK positions
  let layoutedNodes = nodes.map((node) => {
    const elkNode = layoutedGraph.children?.find((n) => n.id === node.id);
    return { ...node, position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 } };
  });

  const nodesByType = groupNodesByType(layoutedNodes);
  const globalCenterX = layout.centerX;
  const hideGroups = graphConfig?.hideGroupBackgrounds === true;

  // Variables for group container positioning (only used when showing groups)
  let causeRowY = 0;
  let intermediateStartY = 0;
  let maxIntermediateY = 0;
  let effectRowY = 0;
  const subgroupPositions: Record<string, { startX: number; minY: number; maxY: number; nodes: LayoutedNode[] }> = {};

  // Position intermediate nodes by subgroup (for X positioning)
  const intermediatesBySubgroup = groupNodesBySubgroup(nodesByType['intermediate']);
  const hasSubgroups = Object.keys(intermediatesBySubgroup).some(k => k !== 'default' && intermediatesBySubgroup[k]?.length > 0);

  // When hiding groups, keep ELK's Y positions (they respect layerSpacing)
  // Only override Y positions when showing group containers
  if (!hideGroups) {
    const groupChrome = 65; // GROUP_HEADER_HEIGHT (45) + GROUP_PADDING (20)
    const groupPadding = 20;

    // Calculate Y positions for each layer
    const leafY = 0;
    if (nodesByType['leaf']) {
      for (const node of nodesByType['leaf']) node.position.y = leafY;
    }

    const leafContainerBottom = leafY + LAYOUT_NODE_HEIGHT + groupPadding;
    const causeContainerTop = leafContainerBottom + layout.layerGap;
    causeRowY = causeContainerTop + groupChrome;

    if (nodesByType['cause']) {
      for (const node of nodesByType['cause']) node.position.y = causeRowY;
    }

    const causeContainerBottom = causeRowY + LAYOUT_NODE_HEIGHT + groupPadding;
    const intermediateContainerTop = causeContainerBottom + layout.layerGap;
    intermediateStartY = intermediateContainerTop + groupChrome;

    maxIntermediateY = intermediateStartY;

    if (hasSubgroups) {
      const subgroupStartY = intermediateStartY + SUBGROUP_HEADER_HEIGHT + SUBGROUP_PADDING;

      const subgroupOrder = Object.keys(config.subgroups);
      const activeSubgroups = subgroupOrder.filter(sg => intermediatesBySubgroup[sg]?.length > 0);
      Object.keys(intermediatesBySubgroup).forEach(sg => {
        if (sg !== 'default' && !activeSubgroups.includes(sg)) activeSubgroups.push(sg);
      });
      if (intermediatesBySubgroup['default']?.length > 0) activeSubgroups.push('default');

      const columnWidth = NODE_WIDTH + SUBGROUP_PADDING * 2;
      const totalColumnsWidth = activeSubgroups.length * (columnWidth + SUBGROUP_GAP) - SUBGROUP_GAP;
      let currentX = globalCenterX - totalColumnsWidth / 2;

      for (const subgroupKey of activeSubgroups) {
        const subgroupNodes = intermediatesBySubgroup[subgroupKey] || [];
        if (subgroupNodes.length === 0) continue;

        let nodeY = subgroupStartY;
        for (const node of subgroupNodes) {
          node.position.x = currentX + SUBGROUP_PADDING;
          node.position.y = nodeY;
          nodeY += LAYOUT_NODE_HEIGHT + 15;
        }

        const subgroupMaxY = nodeY - 15 + LAYOUT_NODE_HEIGHT;
        maxIntermediateY = Math.max(maxIntermediateY, subgroupMaxY);

        subgroupPositions[subgroupKey] = {
          startX: currentX,
          minY: intermediateStartY,
          maxY: subgroupMaxY,
          nodes: subgroupNodes,
        };

        currentX += columnWidth + SUBGROUP_GAP;
      }
    } else {
      if (nodesByType['intermediate']) {
        for (const node of nodesByType['intermediate']) {
          node.position.y = intermediateStartY;
        }
      }
    }

    // Position effect nodes
    const intermediateContainerBottom = maxIntermediateY + LAYOUT_NODE_HEIGHT + groupPadding;
    const effectContainerTop = intermediateContainerBottom + layout.layerGap;
    effectRowY = effectContainerTop + groupChrome;

    if (nodesByType['effect']) {
      for (const node of nodesByType['effect']) node.position.y = effectRowY;
    }
  }

  // Sort and position nodes
  const allIntermediates = nodesByType['intermediate'] || [];

  const sortByOrder = (nodes: LayoutedNode[]) => {
    nodes.sort((a, b) => {
      const orderA = a.data.order ?? 999;
      const orderB = b.data.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.position.x - b.position.x;
    });
  };

  const hasManualOrder = (nodes: LayoutedNode[]) => nodes.some(n => n.data.order !== undefined);

  // Position cause nodes (with horizontal subgroup support)
  const causesBySubgroup = groupNodesBySubgroup(nodesByType['cause']);
  const hasCauseSubgroups = Object.keys(causesBySubgroup).some(k => k !== 'default' && causesBySubgroup[k]?.length > 0);
  const causeSubgroupPositions: Record<string, { startX: number; endX: number; nodes: LayoutedNode[] }> = {};
  const CAUSE_SUBGROUP_GAP = 60;

  if (nodesByType['cause']) {
    if (hasCauseSubgroups) {
      const causeSubgroupOrder = Object.keys(config.subgroups);
      const activeCauseSubgroups = causeSubgroupOrder.filter(sg => causesBySubgroup[sg]?.length > 0);
      Object.keys(causesBySubgroup).forEach(sg => {
        if (sg !== 'default' && !activeCauseSubgroups.includes(sg)) activeCauseSubgroups.push(sg);
      });
      if (causesBySubgroup['default']?.length > 0) activeCauseSubgroups.push('default');

      for (const sg of activeCauseSubgroups) {
        const nodes = causesBySubgroup[sg] || [];
        if (hasManualOrder(nodes)) {
          sortByOrder(nodes);
        } else {
          nodes.sort((a, b) => a.position.x - b.position.x);
        }
      }

      let totalWidth = 0;
      for (const sg of activeCauseSubgroups) {
        const nodes = causesBySubgroup[sg] || [];
        for (const node of nodes) {
          totalWidth += estimateNodeWidth(node) + layout.causeSpacing;
        }
        if (nodes.length > 0) totalWidth -= layout.causeSpacing;
      }
      totalWidth += (activeCauseSubgroups.length - 1) * CAUSE_SUBGROUP_GAP;

      let currentX = globalCenterX - totalWidth / 2;
      for (const sg of activeCauseSubgroups) {
        const nodes = causesBySubgroup[sg] || [];
        if (nodes.length === 0) continue;

        const subgroupStartX = currentX;
        for (const node of nodes) {
          node.position.x = currentX;
          node.position.y = causeRowY;
          currentX += estimateNodeWidth(node) + layout.causeSpacing;
        }
        const subgroupEndX = currentX - layout.causeSpacing;

        causeSubgroupPositions[sg] = { startX: subgroupStartX, endX: subgroupEndX, nodes };
        currentX += CAUSE_SUBGROUP_GAP - layout.causeSpacing;
      }
    } else {
      if (hasManualOrder(nodesByType['cause'])) {
        sortByOrder(nodesByType['cause']);
      } else {
        nodesByType['cause'].sort((a, b) => a.position.x - b.position.x);
      }
      positionRow(nodesByType['cause'], globalCenterX, layout.causeSpacing);
    }
  }

  // Position intermediate nodes
  if (!hasSubgroups && allIntermediates.length > 0) {
    if (hasManualOrder(allIntermediates)) {
      sortByOrder(allIntermediates);
    } else if (nodesByType['cause']) {
      sortByBarycenter(allIntermediates, nodesByType['cause'], edges);
    }
    positionRow(allIntermediates, globalCenterX, layout.intermediateSpacing);
  }

  // Position effect nodes
  if (nodesByType['effect']) {
    if (hasManualOrder(nodesByType['effect'])) {
      sortByOrder(nodesByType['effect']);
    } else {
      sortByBarycenter(nodesByType['effect'], allIntermediates, edges);
    }
    positionRow(nodesByType['effect'], globalCenterX, layout.effectSpacing);
  }

  // Position leaf nodes
  if (nodesByType['leaf']) {
    if (hasManualOrder(nodesByType['leaf'])) {
      sortByOrder(nodesByType['leaf']);
    } else if (nodesByType['cause']) {
      sortByBarycenter(nodesByType['leaf'], nodesByType['cause'], edges);
    }
    positionRow(nodesByType['leaf'], globalCenterX, 0);
  }

  // Create group containers
  const groupNodes: Node<CauseEffectNodeData>[] = [];

  if (nodesByType['leaf'] && !hideGroups) {
    const container = createGroupContainer('leaf', nodesByType['leaf'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  if (nodesByType['cause'] && !hasCauseSubgroups && !hideGroups) {
    const container = createGroupContainer('cause', nodesByType['cause'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  } else if (nodesByType['cause'] && hasCauseSubgroups && !hideGroups) {
    const causeLabel = config.typeLabels?.cause || 'Root Factors';
    const minY = Math.min(...nodesByType['cause'].map(n => n.position.y)) - 20 - 45 - SUBGROUP_HEADER_HEIGHT - SUBGROUP_PADDING;
    const maxY = Math.max(...nodesByType['cause'].map(n => n.position.y + LAYOUT_NODE_HEIGHT)) + 20;
    groupNodes.push({
      id: 'group-cause',
      type: 'group',
      position: { x: globalCenterX - layout.containerWidth / 2, y: minY },
      data: { label: causeLabel, type: 'cause' },
      style: {
        width: layout.containerWidth,
        height: maxY - minY,
        backgroundColor: 'transparent',
        border: 'none',
        zIndex: -1,
      },
      selectable: false,
      draggable: false,
    });
  }

  if (allIntermediates.length > 0 && !hideGroups) {
    const container = createGroupContainer('intermediate', allIntermediates, globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  // Create subgroup containers for intermediate nodes
  if (hasSubgroups && !hideGroups) {
    for (const [subgroupKey, pos] of Object.entries(subgroupPositions)) {
      const subConfig = config.subgroups[subgroupKey];
      if (!subConfig || pos.nodes.length === 0) continue;

      groupNodes.push({
        id: `subgroup-${subgroupKey}`,
        type: 'subgroup',
        position: { x: pos.startX, y: pos.minY },
        data: { label: subConfig.label, type: 'intermediate' },
        style: {
          width: NODE_WIDTH + SUBGROUP_PADDING * 2,
          height: pos.maxY - pos.minY + SUBGROUP_PADDING,
          backgroundColor: subConfig.bgColor,
          border: `1.5px solid ${subConfig.borderColor}`,
          borderRadius: '8px',
          zIndex: -1,
          pointerEvents: 'none' as const,
        },
        selectable: false,
        draggable: false,
      });
    }
  }

  // Create subgroup containers for cause nodes
  if (hasCauseSubgroups && !hideGroups) {
    for (const [subgroupKey, pos] of Object.entries(causeSubgroupPositions)) {
      const subConfig = config.subgroups[subgroupKey];
      if (!subConfig || pos.nodes.length === 0) continue;

      const width = pos.endX - pos.startX + SUBGROUP_PADDING * 2;
      groupNodes.push({
        id: `cause-subgroup-${subgroupKey}`,
        type: 'subgroup',
        position: { x: pos.startX - SUBGROUP_PADDING, y: causeRowY - SUBGROUP_HEADER_HEIGHT - SUBGROUP_PADDING },
        data: { label: subConfig.label, type: 'cause' },
        style: {
          width,
          height: LAYOUT_NODE_HEIGHT + SUBGROUP_HEADER_HEIGHT + SUBGROUP_PADDING * 2,
          backgroundColor: subConfig.bgColor,
          border: `1.5px solid ${subConfig.borderColor}`,
          borderRadius: '8px',
          zIndex: -1,
          pointerEvents: 'none' as const,
        },
        selectable: false,
        draggable: false,
      });
    }
  }

  if (nodesByType['effect'] && !hideGroups) {
    const container = createGroupContainer('effect', nodesByType['effect'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  return { nodes: [...groupNodes, ...layoutedNodes], edges: getStyledEdges(edges) };
}

// Convert graph data to YAML format
export function toYaml(nodes: Node<CauseEffectNodeData>[], edges: Edge<CauseEffectEdgeData>[]): string {
  // Build a map of outgoing edges by source node
  const edgesBySource = new Map<string, Edge<CauseEffectEdgeData>[]>();
  for (const edge of edges) {
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source)!.push(edge);
  }

  const lines: string[] = ['nodes:'];

  for (const node of nodes) {
    lines.push(`  - id: ${node.id}`);
    lines.push(`    label: "${node.data.label}"`);
    if (node.data.type) lines.push(`    type: ${node.data.type}`);
    if (node.data.confidence !== undefined) lines.push(`    confidence: ${node.data.confidence}`);
    if (node.data.confidenceLabel) lines.push(`    confidenceLabel: "${node.data.confidenceLabel}"`);
    if (node.data.description) lines.push(`    description: "${node.data.description.replace(/"/g, '\\"')}"`);
    if (node.data.details) lines.push(`    details: "${node.data.details.replace(/"/g, '\\"')}"`);
    if (node.data.relatedConcepts?.length) {
      lines.push(`    relatedConcepts:`);
      for (const concept of node.data.relatedConcepts) lines.push(`      - "${concept}"`);
    }
    if (node.data.sources?.length) {
      lines.push(`    sources:`);
      for (const source of node.data.sources) lines.push(`      - "${source}"`);
    }
    if (node.data.scores) {
      const { novelty, sensitivity, changeability, certainty } = node.data.scores;
      if (novelty !== undefined || sensitivity !== undefined || changeability !== undefined || certainty !== undefined) {
        lines.push(`    scores:`);
        if (novelty !== undefined) lines.push(`      novelty: ${novelty}`);
        if (sensitivity !== undefined) lines.push(`      sensitivity: ${sensitivity}`);
        if (changeability !== undefined) lines.push(`      changeability: ${changeability}`);
        if (certainty !== undefined) lines.push(`      certainty: ${certainty}`);
      }
    }
    // Add outgoing edges for this node
    const nodeEdges = edgesBySource.get(node.id);
    if (nodeEdges?.length) {
      lines.push(`    edges:`);
      for (const edge of nodeEdges) {
        lines.push(`      - target: ${edge.target}`);
        if (edge.data?.strength) lines.push(`        strength: ${edge.data.strength}`);
        if (edge.data?.confidence) lines.push(`        confidence: ${edge.data.confidence}`);
        if (edge.data?.effect) lines.push(`        effect: ${edge.data.effect}`);
        if (edge.data?.label) lines.push(`        label: "${edge.data.label}"`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
