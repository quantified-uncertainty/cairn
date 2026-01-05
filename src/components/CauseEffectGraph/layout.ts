import ELK from 'elkjs/lib/elk.bundled.js';
import { MarkerType, type Node, type Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData, GraphConfig, SubgroupConfig, TypeLabels } from './types';
import {
  NODE_WIDTH,
  NODE_HEIGHT_WITH_SUBITEMS,
  GROUP_PADDING,
  GROUP_HEADER_HEIGHT,
  SUBGROUP_PADDING,
  SUBGROUP_HEADER_HEIGHT,
  SUBGROUP_GAP,
  DEFAULT_SUBGROUP_CONFIG,
  groupConfig,
  DEFAULT_TYPE_LABELS,
  elkOptions as defaultElkOptions,
} from './config';

// Use larger height for layout since most nodes have subItems
const LAYOUT_NODE_HEIGHT = NODE_HEIGHT_WITH_SUBITEMS;

// Estimate node width based on content (label and sub-items)
function estimateNodeWidth(node: { data: CauseEffectNodeData }): number {
  const CHAR_WIDTH = 8; // Approximate pixels per character
  const MIN_WIDTH = NODE_WIDTH; // Must match actual rendered node width
  const PADDING = 40; // Internal padding

  // Get the longest text (label or any sub-item)
  let maxTextLength = node.data.label?.length || 0;

  if (node.data.subItems) {
    for (const item of node.data.subItems) {
      const itemLength = item.label?.length || 0;
      if (itemLength > maxTextLength) {
        maxTextLength = itemLength;
      }
    }
  }

  const estimatedWidth = maxTextLength * CHAR_WIDTH + PADDING;
  return Math.max(MIN_WIDTH, estimatedWidth);
}

const elk = new ELK();

// Style edges based on strength and effect
export function getStyledEdges(edges: Edge<CauseEffectEdgeData>[]): Edge<CauseEffectEdgeData>[] {
  const strengthMap = { strong: 3.5, medium: 2, weak: 1.2 };
  const effectColors = { increases: '#dc2626', decreases: '#16a34a' };

  return edges.map((edge) => {
    const data = edge.data;
    const strokeWidth = data?.strength ? strengthMap[data.strength] : 2;
    const strokeColor = data?.effect ? effectColors[data.effect] : '#64748b';

    return {
      ...edge,
      label: data?.label,
      labelStyle: data?.label ? { fontSize: 11, fontWeight: 500, fill: '#64748b' } : undefined,
      labelBgStyle: data?.label ? { fill: '#f8fafc', fillOpacity: 0.9 } : undefined,
      labelBgPadding: data?.label ? [4, 6] as [number, number] : undefined,
      labelBgBorderRadius: data?.label ? 4 : undefined,
      style: { ...edge.style, stroke: strokeColor, strokeWidth, opacity: 0.4 },
      markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor, width: 16, height: 16 },
    };
  });
}

// Helper types
type LayoutedNode = Node<CauseEffectNodeData>;
type NodesByType = Record<string, LayoutedNode[]>;

// Helper to position a row of nodes evenly around a center point
function positionRow(nodes: LayoutedNode[], centerX: number, extraSpacing: number = 0) {
  if (nodes.length === 0) return;
  if (nodes.length === 1) {
    nodes[0].position.x = centerX - NODE_WIDTH / 2;
    return;
  }
  const spacing = NODE_WIDTH + 30 + extraSpacing;
  const totalWidth = (nodes.length - 1) * spacing;
  const startX = centerX - totalWidth / 2;
  nodes.forEach((node, i) => {
    node.position.x = startX + i * spacing;
  });
}

// Get barycenter (average X of connected nodes)
function getBarycenter(nodeId: string, connectedNodes: LayoutedNode[], edges: Edge<CauseEffectEdgeData>[]) {
  const connected = connectedNodes.filter(n =>
    edges.some(e => (e.source === nodeId && e.target === n.id) || (e.target === nodeId && e.source === n.id))
  );
  if (connected.length === 0) return 0;
  return connected.reduce((sum, n) => sum + n.position.x, 0) / connected.length;
}

// Sort nodes by barycenter
function sortByBarycenter(group: LayoutedNode[], neighbors: LayoutedNode[], edges: Edge<CauseEffectEdgeData>[]) {
  group.sort((a, b) => {
    const aBC = getBarycenter(a.id, neighbors, edges);
    const bBC = getBarycenter(b.id, neighbors, edges);
    if (aBC === bBC) return a.position.x - b.position.x;
    return aBC - bBC;
  });
}

// Group nodes by type
function groupNodesByType(nodes: LayoutedNode[]): NodesByType {
  const result: NodesByType = {};
  for (const node of nodes) {
    const type = node.data.type || 'intermediate';
    if (!result[type]) result[type] = [];
    result[type].push(node);
  }
  return result;
}

// Group nodes by subgroup (works for any node type)
function groupNodesBySubgroup(nodes: LayoutedNode[] | undefined): Record<string, LayoutedNode[]> {
  const result: Record<string, LayoutedNode[]> = {};
  if (!nodes) return result;

  for (const node of nodes) {
    const subgroup = node.data.subgroup || 'default';
    if (!result[subgroup]) result[subgroup] = [];
    result[subgroup].push(node);
  }
  return result;
}

// Create a group container node with fixed width
function createGroupContainer(
  type: string,
  nodesInGroup: LayoutedNode[],
  globalCenterX: number,
  containerWidth: number,
  typeLabels?: TypeLabels
): Node<CauseEffectNodeData> | null {
  if (nodesInGroup.length === 0) return null;

  const config = groupConfig[type];
  if (!config) return null;
  const minX = globalCenterX - containerWidth / 2;
  const minY = Math.min(...nodesInGroup.map(n => n.position.y)) - GROUP_PADDING - GROUP_HEADER_HEIGHT;
  const maxY = Math.max(...nodesInGroup.map(n => n.position.y + LAYOUT_NODE_HEIGHT)) + GROUP_PADDING;

  // Use custom type labels if provided, otherwise fall back to default config label
  const label = typeLabels?.[type as keyof TypeLabels] || config.label;

  return {
    id: `group-${type}`,
    type: 'group',
    position: { x: minX, y: minY },
    data: { label, type: type as CauseEffectNodeData['type'] },
    style: {
      width: containerWidth,
      height: maxY - minY,
      backgroundColor: config.bgColor,
      border: `2px dashed ${config.borderColor}`,
      borderRadius: '12px',
      zIndex: -1,
    },
    selectable: false,
    draggable: false,
  };
}

// Default configuration
const DEFAULT_CONFIG: Required<GraphConfig> = {
  layout: {
    containerWidth: 1200,
    centerX: 600,
    layerGap: 60,
    causeSpacing: 100,
    intermediateSpacing: 150,
    effectSpacing: 300,
  },
  typeLabels: DEFAULT_TYPE_LABELS as TypeLabels,
  subgroups: DEFAULT_SUBGROUP_CONFIG,
  legendItems: [],
  elkOptions: {},
};

// Main layout function
export async function getLayoutedElements(
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
  // Build ELK graph with layer constraints
  const graph = {
    id: 'root',
    layoutOptions: defaultElkOptions,
    children: nodes.map((node) => {
      const layoutOptions: Record<string, string> = {};
      if (node.data.type === 'leaf' || node.data.type === 'cause') {
        layoutOptions['elk.layered.layerConstraint'] = 'FIRST';
      } else if (node.data.type === 'effect') {
        layoutOptions['elk.layered.layerConstraint'] = 'LAST';
      }
      return {
        id: node.id,
        width: NODE_WIDTH,
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

  // Calculate Y positions for each layer
  const leafY = 0;
  if (nodesByType['leaf']) {
    for (const node of nodesByType['leaf']) node.position.y = leafY;
  }

  const leafContainerBottom = leafY + LAYOUT_NODE_HEIGHT + GROUP_PADDING;
  const causeContainerTop = leafContainerBottom + layout.layerGap;
  const causeRowY = causeContainerTop + GROUP_HEADER_HEIGHT + GROUP_PADDING;

  if (nodesByType['cause']) {
    for (const node of nodesByType['cause']) node.position.y = causeRowY;
  }

  const causeContainerBottom = causeRowY + LAYOUT_NODE_HEIGHT + GROUP_PADDING;
  const intermediateContainerTop = causeContainerBottom + layout.layerGap;
  const intermediateStartY = intermediateContainerTop + GROUP_HEADER_HEIGHT + GROUP_PADDING;

  // Position intermediate nodes by subgroup
  const intermediatesBySubgroup = groupNodesBySubgroup(nodesByType['intermediate']);
  const hasSubgroups = Object.keys(intermediatesBySubgroup).some(k => k !== 'default' && intermediatesBySubgroup[k]?.length > 0);

  let maxIntermediateY = intermediateStartY;
  const subgroupPositions: Record<string, { startX: number; minY: number; maxY: number; nodes: LayoutedNode[] }> = {};

  if (hasSubgroups) {
    const subgroupStartY = intermediateStartY + SUBGROUP_HEADER_HEIGHT + SUBGROUP_PADDING;

    // Get ordered active subgroups (use config.subgroups keys as order, then any remaining)
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
    // Simple single-row layout for intermediates
    if (nodesByType['intermediate']) {
      for (const node of nodesByType['intermediate']) {
        node.position.y = intermediateStartY;
      }
      maxIntermediateY = intermediateStartY;
    }
  }

  // Position effect nodes
  const intermediateContainerBottom = maxIntermediateY + LAYOUT_NODE_HEIGHT + GROUP_PADDING;
  const effectContainerTop = intermediateContainerBottom + layout.layerGap;
  const effectRowY = effectContainerTop + GROUP_HEADER_HEIGHT + GROUP_PADDING;

  if (nodesByType['effect']) {
    for (const node of nodesByType['effect']) node.position.y = effectRowY;
  }

  // Sort and position nodes by manual order (if specified) or fall back to barycenter
  const allIntermediates = nodesByType['intermediate'] || [];

  // Helper to sort by manual order
  const sortByOrder = (nodes: LayoutedNode[]) => {
    nodes.sort((a, b) => {
      const orderA = a.data.order ?? 999;
      const orderB = b.data.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.position.x - b.position.x;  // Fall back to position
    });
  };

  // Check if any nodes have manual order
  const hasManualOrder = (nodes: LayoutedNode[]) => nodes.some(n => n.data.order !== undefined);

  // Position cause nodes (with horizontal subgroup support)
  const causesBySubgroup = groupNodesBySubgroup(nodesByType['cause']);
  const hasCauseSubgroups = Object.keys(causesBySubgroup).some(k => k !== 'default' && causesBySubgroup[k]?.length > 0);
  const causeSubgroupPositions: Record<string, { startX: number; endX: number; nodes: LayoutedNode[] }> = {};
  const CAUSE_SUBGROUP_GAP = 60; // Extra gap between subgroups

  if (nodesByType['cause']) {
    if (hasCauseSubgroups) {
      // Get ordered subgroups from config, then remaining
      const causeSubgroupOrder = Object.keys(config.subgroups);
      const activeCauseSubgroups = causeSubgroupOrder.filter(sg => causesBySubgroup[sg]?.length > 0);
      Object.keys(causesBySubgroup).forEach(sg => {
        if (sg !== 'default' && !activeCauseSubgroups.includes(sg)) activeCauseSubgroups.push(sg);
      });
      if (causesBySubgroup['default']?.length > 0) activeCauseSubgroups.push('default');

      // Sort nodes within each subgroup
      for (const sg of activeCauseSubgroups) {
        const nodes = causesBySubgroup[sg] || [];
        if (hasManualOrder(nodes)) {
          sortByOrder(nodes);
        } else {
          nodes.sort((a, b) => a.position.x - b.position.x);
        }
      }

      // Calculate total width needed using dynamic node widths
      let totalWidth = 0;
      for (const sg of activeCauseSubgroups) {
        const nodes = causesBySubgroup[sg] || [];
        for (const node of nodes) {
          totalWidth += estimateNodeWidth(node) + layout.causeSpacing;
        }
        if (nodes.length > 0) totalWidth -= layout.causeSpacing; // Remove trailing spacing
      }
      totalWidth += (activeCauseSubgroups.length - 1) * CAUSE_SUBGROUP_GAP;

      // Position each subgroup using dynamic node widths
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

        causeSubgroupPositions[sg] = {
          startX: subgroupStartX,
          endX: subgroupEndX,
          nodes,
        };

        currentX += CAUSE_SUBGROUP_GAP - layout.causeSpacing; // Add extra gap between subgroups
      }
    } else {
      // Original single-row layout
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

  // Position leaf nodes (if any)
  if (nodesByType['leaf']) {
    if (hasManualOrder(nodesByType['leaf'])) {
      sortByOrder(nodesByType['leaf']);
    } else if (nodesByType['cause']) {
      sortByBarycenter(nodesByType['leaf'], nodesByType['cause'], edges);
    }
    positionRow(nodesByType['leaf'], globalCenterX, 0);
  }

  // Create group containers with fixed width
  const groupNodes: Node<CauseEffectNodeData>[] = [];

  // Create leaf container
  if (nodesByType['leaf']) {
    const container = createGroupContainer('leaf', nodesByType['leaf'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  // Create cause container only if no cause subgroups (to avoid overlapping boxes)
  if (nodesByType['cause'] && !hasCauseSubgroups) {
    const container = createGroupContainer('cause', nodesByType['cause'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  } else if (nodesByType['cause'] && hasCauseSubgroups) {
    // Create a label-only container (no border) when subgroups handle the visual grouping
    const causeLabel = config.typeLabels?.cause || 'Root Factors';
    const minY = Math.min(...nodesByType['cause'].map(n => n.position.y)) - GROUP_PADDING - GROUP_HEADER_HEIGHT - SUBGROUP_HEADER_HEIGHT - SUBGROUP_PADDING;
    const maxY = Math.max(...nodesByType['cause'].map(n => n.position.y + LAYOUT_NODE_HEIGHT)) + GROUP_PADDING;
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

  if (allIntermediates.length > 0) {
    const container = createGroupContainer('intermediate', allIntermediates, globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  // Create subgroup containers for intermediate nodes
  if (hasSubgroups) {
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

  // Create subgroup containers for cause nodes (horizontal layout)
  if (hasCauseSubgroups) {
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

  if (nodesByType['effect']) {
    const container = createGroupContainer('effect', nodesByType['effect'], globalCenterX, layout.containerWidth, config.typeLabels);
    if (container) groupNodes.push(container);
  }

  return { nodes: [...groupNodes, ...layoutedNodes], edges: getStyledEdges(edges) };
}

// Convert graph data to YAML format
export function toYaml(nodes: Node<CauseEffectNodeData>[], edges: Edge<CauseEffectEdgeData>[]): string {
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
    lines.push('');
  }

  lines.push('edges:');
  for (const edge of edges) {
    lines.push(`  - source: ${edge.source}`);
    lines.push(`    target: ${edge.target}`);
    if (edge.data?.strength) lines.push(`    strength: ${edge.data.strength}`);
    if (edge.data?.confidence) lines.push(`    confidence: ${edge.data.confidence}`);
    if (edge.data?.effect) lines.push(`    effect: ${edge.data.effect}`);
    if (edge.data?.label) lines.push(`    label: "${edge.data.label}"`);
    lines.push('');
  }

  return lines.join('\n');
}
