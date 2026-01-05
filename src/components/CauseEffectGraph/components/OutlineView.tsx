import type { Node } from '@xyflow/react';
import type { CauseEffectNodeData } from '../types';

interface OutlineViewProps {
  nodes: Node<CauseEffectNodeData>[];
  typeLabels?: {
    cause?: string;
    intermediate?: string;
    effect?: string;
  };
  subgroups?: Record<string, { label: string }>;
}

// Generate human-readable outline from graph nodes
export function generateOutlineText(
  nodes: Node<CauseEffectNodeData>[],
  typeLabels?: OutlineViewProps['typeLabels'],
  subgroups?: OutlineViewProps['subgroups']
): string {
  const lines: string[] = [];

  // Filter out group/subgroup nodes - only want actual content nodes
  const contentNodes = nodes.filter(
    (n) => n.type === 'causeEffect' || (!n.type && n.data.type)
  );

  // Group by type
  const nodesByType: Record<string, Node<CauseEffectNodeData>[]> = {};
  for (const node of contentNodes) {
    const type = node.data.type || 'intermediate';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  }

  // Sort within each type by order, then by position
  const sortNodes = (nodes: Node<CauseEffectNodeData>[]) => {
    return [...nodes].sort((a, b) => {
      const orderA = a.data.order ?? 999;
      const orderB = b.data.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.position?.x || 0) - (b.position?.x || 0);
    });
  };

  // Helper to render a node with its sub-items
  const renderNode = (node: Node<CauseEffectNodeData>, indent: string = '  ') => {
    lines.push(`${indent}• ${node.data.label}`);
    if (node.data.subItems && node.data.subItems.length > 0) {
      for (const item of node.data.subItems) {
        lines.push(`${indent}  - ${item.label}`);
      }
    }
  };

  // ROOT FACTORS / CAUSES
  if (nodesByType['cause'] && nodesByType['cause'].length > 0) {
    const causeLabel = typeLabels?.cause || 'ROOT FACTORS';
    lines.push(causeLabel.toUpperCase());

    // Group by subgroup if present
    const bySubgroup: Record<string, Node<CauseEffectNodeData>[]> = {};
    for (const node of nodesByType['cause']) {
      const sg = node.data.subgroup || 'default';
      if (!bySubgroup[sg]) bySubgroup[sg] = [];
      bySubgroup[sg].push(node);
    }

    const hasSubgroups = Object.keys(bySubgroup).some(
      (k) => k !== 'default' && bySubgroup[k]?.length > 0
    );

    if (hasSubgroups && subgroups) {
      // Render with subgroup headers
      const subgroupOrder = Object.keys(subgroups);
      for (const sgKey of subgroupOrder) {
        if (!bySubgroup[sgKey] || bySubgroup[sgKey].length === 0) continue;
        const sgLabel = subgroups[sgKey]?.label || sgKey;
        lines.push(`  ${sgLabel}`);
        for (const node of sortNodes(bySubgroup[sgKey])) {
          renderNode(node, '    ');
        }
      }
      // Render any 'default' nodes without subgroup
      if (bySubgroup['default']?.length > 0) {
        for (const node of sortNodes(bySubgroup['default'])) {
          renderNode(node, '  ');
        }
      }
    } else {
      // No subgroups - render flat
      for (const node of sortNodes(nodesByType['cause'])) {
        renderNode(node, '  ');
      }
    }
    lines.push('');
  }

  // INTERMEDIATE / SCENARIOS
  if (nodesByType['intermediate'] && nodesByType['intermediate'].length > 0) {
    const intermediateLabel = typeLabels?.intermediate || 'SCENARIOS';
    lines.push(intermediateLabel.toUpperCase());

    for (const node of sortNodes(nodesByType['intermediate'])) {
      renderNode(node, '  ');
    }
    lines.push('');
  }

  // EFFECTS / OUTCOMES
  if (nodesByType['effect'] && nodesByType['effect'].length > 0) {
    const effectLabel = typeLabels?.effect || 'OUTCOMES';
    lines.push(effectLabel.toUpperCase());

    for (const node of sortNodes(nodesByType['effect'])) {
      renderNode(node, '  ');
    }
  }

  return lines.join('\n');
}

export function OutlineView({ nodes, typeLabels, subgroups }: OutlineViewProps) {
  const outline = generateOutlineText(nodes, typeLabels, subgroups);

  return (
    <div className="ceg-data-view">
      <pre className="ceg-data-view__code">
        <code>{outline}</code>
      </pre>
    </div>
  );
}
