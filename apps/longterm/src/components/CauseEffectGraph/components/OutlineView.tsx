import { useState, useEffect, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import type { CauseEffectNodeData } from '../types';
import { getImpactsFrom, getImpactsTo, getNodeLabel, type ImpactGridEntry } from '@data/parameter-graph-data';
import { MiniModelDiagram } from '../../MiniModelDiagram';
import Markdown from 'react-markdown';

// Convert label to URL-friendly slug
function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Truncate description to first sentence or max characters for preview
function truncateDescription(desc: string, maxLength: number = 150): string {
  if (!desc) return '';
  // Get first sentence (up to first period followed by space or end)
  const firstSentence = desc.split(/\.\s/)[0];
  if (firstSentence.length <= maxLength) {
    return firstSentence + (desc.length > firstSentence.length + 1 ? '.' : '');
  }
  // If first sentence is too long, truncate with ellipsis
  return desc.slice(0, maxLength).trim() + '...';
}

interface OutlineViewProps {
  nodes: Node<CauseEffectNodeData>[];
  typeLabels?: {
    cause?: string;
    intermediate?: string;
    effect?: string;
  };
  subgroups?: Record<string, { label: string }>;
}

// Generate human-readable outline from graph nodes (for copy function)
export function generateOutlineText(
  nodes: Node<CauseEffectNodeData>[],
  typeLabels?: OutlineViewProps['typeLabels'],
  subgroups?: OutlineViewProps['subgroups']
): string {
  const lines: string[] = [];
  const contentNodes = nodes.filter(
    (n) => n.type === 'causeEffect' || (!n.type && n.data.type)
  );

  const nodesByType: Record<string, Node<CauseEffectNodeData>[]> = {};
  for (const node of contentNodes) {
    const type = node.data.type || 'intermediate';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  }

  const sortNodes = (nodes: Node<CauseEffectNodeData>[]) => {
    return [...nodes].sort((a, b) => {
      const orderA = a.data.order ?? 999;
      const orderB = b.data.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.position?.x || 0) - (b.position?.x || 0);
    });
  };

  const renderNode = (node: Node<CauseEffectNodeData>, indent: string = '  ') => {
    lines.push(`${indent}• ${node.data.label}`);
    if (node.data.subItems && node.data.subItems.length > 0) {
      for (const item of node.data.subItems) {
        lines.push(`${indent}  - ${item.label}`);
      }
    }
  };

  if (nodesByType['cause'] && nodesByType['cause'].length > 0) {
    const causeLabel = typeLabels?.cause || 'ROOT FACTORS';
    lines.push(causeLabel.toUpperCase());
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
      for (const sgKey of Object.keys(subgroups)) {
        if (!bySubgroup[sgKey] || bySubgroup[sgKey].length === 0) continue;
        lines.push(`  ${subgroups[sgKey]?.label || sgKey}`);
        for (const node of sortNodes(bySubgroup[sgKey])) renderNode(node, '    ');
      }
    } else {
      for (const node of sortNodes(nodesByType['cause'])) renderNode(node, '  ');
    }
    lines.push('');
  }

  if (nodesByType['intermediate'] && nodesByType['intermediate'].length > 0) {
    lines.push((typeLabels?.intermediate || 'SCENARIOS').toUpperCase());
    for (const node of sortNodes(nodesByType['intermediate'])) renderNode(node, '  ');
    lines.push('');
  }

  if (nodesByType['effect'] && nodesByType['effect'].length > 0) {
    lines.push((typeLabels?.effect || 'OUTCOMES').toUpperCase());
    for (const node of sortNodes(nodesByType['effect'])) renderNode(node, '  ');
  }

  return lines.join('\n');
}

interface KeyDebate {
  topic: string;
  description: string;
}

interface RelatedContentItem {
  path: string;
  title: string;
}

interface RelatedContent {
  risks?: RelatedContentItem[];
  responses?: RelatedContentItem[];
  models?: RelatedContentItem[];
  cruxes?: RelatedContentItem[];
}

interface SelectedItem {
  type: 'node' | 'subitem';
  nodeId: string;
  subItemIndex?: number;
  label: string;
  description: string;
  tier: 'cause' | 'intermediate' | 'effect';
  parent?: string;
  parentSlug?: string;
  subgroup?: string;
  subItems?: { label: string; description?: string }[];
  ratings?: {
    changeability?: number;
    xriskImpact?: number;
    trajectoryImpact?: number;
    uncertainty?: number;
  };
  keyDebates?: KeyDebate[];
  scope?: string;
  relatedContent?: RelatedContent;
}

const styles = `
  .ov-layout {
    display: flex;
    height: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Sidebar */
  .ov-sidebar {
    width: 320px;
    min-width: 320px;
    border-right: 1px solid #e5e7eb;
    overflow-y: auto;
    background: #f9fafb;
  }

  .ov-section {
    border-bottom: 1px solid #e5e7eb;
  }
  .ov-section:last-child { border-bottom: none; }

  .ov-section__header {
    padding: 10px 16px;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .ov-section--cause .ov-section__header {
    color: #1e40af;
    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  }
  .ov-section--intermediate .ov-section__header {
    color: #7c3aed;
    background: linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%);
  }
  .ov-section--effect .ov-section__header {
    color: #a16207;
    background: linear-gradient(135deg, #fef3c7 0%, #fefce8 100%);
  }

  .ov-subgroup__header {
    font-weight: 600;
    font-size: 11px;
    color: #64748b;
    padding: 8px 16px 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .ov-item {
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.1s;
    border-left: 3px solid transparent;
  }
  .ov-item:hover { background: #f1f5f9; }
  .ov-item--active {
    background: #e0f2fe;
    border-left-color: #3b82f6;
  }
  .ov-item--node { font-weight: 600; font-size: 14px; color: #1e293b; }
  .ov-item--subitem {
    font-size: 13px;
    color: #475569;
    padding-left: 32px;
  }

  /* Detail Panel */
  .ov-detail {
    flex: 1;
    overflow-y: auto;
    background: #ffffff;
  }

  .ov-detail__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #9ca3af;
    font-size: 15px;
  }

  .ov-detail__layout {
    display: flex;
    gap: 40px;
    padding: 32px;
  }

  .ov-detail__main {
    flex: 1;
    min-width: 0;
  }

  .ov-detail__sidebar {
    width: 380px;
    flex-shrink: 0;
  }

  .ov-mini-graph {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    position: sticky;
    top: 32px;
  }
  .ov-mini-graph__header {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-mini-graph__canvas {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .ov-mini-graph__node {
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    margin: 4px 0;
    max-width: 100%;
    word-wrap: break-word;
  }
  .ov-mini-graph__node--current {
    background: #dbeafe;
    color: #1e40af;
    border: 2px solid #3b82f6;
  }
  .ov-mini-graph__node--parent {
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    padding: 6px 10px;
  }
  .ov-mini-graph__node--child {
    background: #f0fdf4;
    color: #166534;
    font-size: 11px;
    padding: 6px 10px;
  }
  .ov-mini-graph__arrow {
    color: #94a3b8;
    font-size: 16px;
    margin: 2px 0;
  }
  .ov-mini-graph__children {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 4px;
  }

  .ov-detail__tier {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-detail__tier--cause { background: #dbeafe; color: #1e40af; }
  .ov-detail__tier--intermediate { background: #ede9fe; color: #7c3aed; }
  .ov-detail__tier--effect { background: #fef3c7; color: #a16207; }

  .ov-detail__title {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 8px;
    line-height: 1.2;
  }

  .ov-detail__parent {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 20px;
  }

  .ov-detail__description {
    font-size: 16px;
    line-height: 1.7;
    color: #334155;
    margin-bottom: 32px;
  }
  .ov-detail__description p {
    margin-bottom: 16px;
  }
  .ov-detail__description p:last-child {
    margin-bottom: 0;
  }
  .ov-detail__description a {
    color: #2563eb;
    text-decoration: none;
  }
  .ov-detail__description a:hover {
    text-decoration: underline;
  }
  .ov-detail__description ul, .ov-detail__description ol {
    margin: 16px 0;
    padding-left: 24px;
  }
  .ov-detail__description li {
    margin-bottom: 8px;
  }
  .ov-detail__description strong {
    font-weight: 600;
    color: #1e293b;
  }
  .ov-detail__description em {
    font-style: italic;
  }
  .ov-detail__description h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  .ov-detail__description h3 {
    font-size: 16px;
    font-weight: 600;
    color: #334155;
    margin-top: 20px;
    margin-bottom: 8px;
  }

  .ov-detail__ratings {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 24px;
  }

  .ov-rating {
    background: #f8fafc;
    border-radius: 6px;
    padding: 8px 10px;
  }
  .ov-rating__label {
    font-size: 9px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .ov-rating__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ov-rating__value {
    font-size: 14px;
    font-weight: 700;
    min-width: 24px;
  }
  .ov-rating__bar {
    flex: 1;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
  }
  .ov-rating__fill {
    height: 100%;
    border-radius: 2px;
  }
  .ov-rating--green .ov-rating__fill { background: #22c55e; }
  .ov-rating--green .ov-rating__value { color: #166534; }
  .ov-rating--red .ov-rating__fill { background: #ef4444; }
  .ov-rating--red .ov-rating__value { color: #991b1b; }
  .ov-rating--blue .ov-rating__fill { background: #3b82f6; }
  .ov-rating--blue .ov-rating__value { color: #1e40af; }
  .ov-rating--gray .ov-rating__fill { background: #6b7280; }
  .ov-rating--gray .ov-rating__value { color: #374151; }

  .ov-detail__subitems {
    margin-top: 24px;
  }
  .ov-detail__subitems-header {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-detail__subitem {
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .ov-detail__subitem:hover { background: #f1f5f9; }
  .ov-detail__subitem-label {
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }
  .ov-detail__subitem-desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }

  .ov-detail__debates {
    margin-top: 32px;
    border-top: 1px solid #e5e7eb;
    padding-top: 24px;
  }
  .ov-detail__debates-header {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-debate {
    margin-bottom: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  .ov-debate:last-child { margin-bottom: 0; border-bottom: none; }
  .ov-debate__topic {
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
    margin-bottom: 4px;
  }
  .ov-debate__desc {
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }

  .ov-detail__impacts {
    margin-top: 32px;
    border-top: 1px solid #e5e7eb;
    padding-top: 24px;
  }
  .ov-detail__impacts-header {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-impacts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  .ov-impacts-section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
  }
  .ov-impacts-section__title {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-impact {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  .ov-impact:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
  .ov-impact__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .ov-impact__target {
    font-weight: 600;
    font-size: 13px;
    color: #1e293b;
  }
  .ov-impact__score {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .ov-impact__score--high { background: #fee2e2; color: #991b1b; }
  .ov-impact__score--medium { background: #fef3c7; color: #92400e; }
  .ov-impact__score--low { background: #dcfce7; color: #166534; }
  .ov-impact__direction {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
  }
  .ov-impact__direction--increases { background: #fee2e2; color: #991b1b; }
  .ov-impact__direction--decreases { background: #dcfce7; color: #166534; }
  .ov-impact__direction--mixed { background: #e0e7ff; color: #3730a3; }
  .ov-impact__notes {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }

  .ov-detail__scope {
    margin-top: 16px;
    padding: 12px 14px;
    background: #f9fafb;
    border-radius: 6px;
  }
  .ov-detail__scope-header {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .ov-detail__scope-text {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Breadcrumbs */
  .ov-breadcrumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
    font-size: 13px;
  }
  .ov-breadcrumb {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .ov-breadcrumb__item {
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .ov-breadcrumb__item:hover { opacity: 0.8; }
  .ov-breadcrumb__item--tier {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  .ov-breadcrumb__item--cause { background: #dbeafe; color: #1e40af; }
  .ov-breadcrumb__item--intermediate { background: #ede9fe; color: #7c3aed; }
  .ov-breadcrumb__item--effect { background: #fef3c7; color: #a16207; }
  .ov-breadcrumb__item--subgroup { background: #f1f5f9; color: #475569; }
  .ov-breadcrumb__item--parent { background: #e0f2fe; color: #0369a1; }
  .ov-breadcrumb__item--current {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 600;
    cursor: default;
  }
  .ov-breadcrumb__item--current:hover { opacity: 1; }
  .ov-breadcrumb__separator {
    color: #94a3b8;
    font-size: 12px;
  }

  /* Related Content - sidebar layout */
  .ov-related {
    margin-top: 20px;
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
  }
  .ov-related__header {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
  }
  .ov-related__section {
    margin-bottom: 12px;
  }
  .ov-related__section:last-child { margin-bottom: 0; }
  .ov-related__section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .ov-related__section--risks .ov-related__section-title { color: #dc2626; }
  .ov-related__section--responses .ov-related__section-title { color: #059669; }
  .ov-related__section--models .ov-related__section-title { color: #7c3aed; }
  .ov-related__section--cruxes .ov-related__section-title { color: #d97706; }
  .ov-related__link {
    display: block;
    padding: 4px 8px;
    margin-bottom: 2px;
    border-radius: 4px;
    font-size: 12px;
    color: #1e293b;
    text-decoration: none;
    transition: background 0.15s;
  }
  .ov-related__link:last-child { margin-bottom: 0; }
  .ov-related__link:hover { background: #e2e8f0; }
  .ov-related__section--risks .ov-related__link:hover { background: #fee2e2; }
  .ov-related__section--responses .ov-related__link:hover { background: #d1fae5; }
  .ov-related__section--models .ov-related__link:hover { background: #ede9fe; }
  .ov-related__section--cruxes .ov-related__link:hover { background: #fef3c7; }
`;

export function OutlineView({ nodes, typeLabels, subgroups }: OutlineViewProps) {
  const [selected, setSelected] = useState<SelectedItem | null>(null);

  const contentNodes = nodes.filter(
    (n) => n.type === 'causeEffect' || (!n.type && n.data.type)
  );

  const nodesByType: Record<string, Node<CauseEffectNodeData>[]> = {};
  for (const node of contentNodes) {
    const type = node.data.type || 'intermediate';
    if (!nodesByType[type]) nodesByType[type] = [];
    nodesByType[type].push(node);
  }

  const sortNodes = (arr: Node<CauseEffectNodeData>[]) => {
    return [...arr].sort((a, b) => {
      const orderA = a.data.order ?? 999;
      const orderB = b.data.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.position?.x || 0) - (b.position?.x || 0);
    });
  };

  // Build lookup maps for URL parsing (memoized)
  const { nodeBySlug, subItemBySlug } = useMemo(() => {
    const nodeMap = new Map<string, Node<CauseEffectNodeData>>();
    const subItemMap = new Map<string, { node: Node<CauseEffectNodeData>; index: number }>();

    for (const node of contentNodes) {
      nodeMap.set(toSlug(node.data.label), node);
      if (node.data.subItems) {
        for (let i = 0; i < node.data.subItems.length; i++) {
          const subItem = node.data.subItems[i];
          subItemMap.set(toSlug(subItem.label), { node, index: i });
        }
      }
    }
    return { nodeBySlug: nodeMap, subItemBySlug: subItemMap };
  }, [contentNodes]);

  // Parse URL hash and select corresponding item
  const selectFromHash = () => {
    const hash = window.location.hash.slice(1); // Remove '#'
    if (!hash) return;

    // Try to find a matching sub-item first (more specific)
    const subItemMatch = subItemBySlug.get(hash);
    if (subItemMatch) {
      const { node, index } = subItemMatch;
      const subItem = node.data.subItems?.[index];
      if (subItem) {
        setSelected({
          type: 'subitem',
          nodeId: node.id,
          subItemIndex: index,
          label: subItem.label,
          description: subItem.description || '',
          tier: node.data.type as 'cause' | 'intermediate' | 'effect',
          parent: node.data.label,
          parentSlug: toSlug(node.data.label),
          subgroup: node.data.subgroup,
          ratings: subItem.ratings as SelectedItem['ratings'],
          keyDebates: subItem.keyDebates as KeyDebate[] | undefined,
          scope: subItem.scope as string | undefined,
          relatedContent: subItem.relatedContent as RelatedContent | undefined,
        });
        return;
      }
    }

    // Try to find a matching node
    const nodeMatch = nodeBySlug.get(hash);
    if (nodeMatch) {
      setSelected({
        type: 'node',
        nodeId: nodeMatch.id,
        label: nodeMatch.data.label,
        description: nodeMatch.data.description || '',
        tier: nodeMatch.data.type as 'cause' | 'intermediate' | 'effect',
        subgroup: nodeMatch.data.subgroup,
        subItems: nodeMatch.data.subItems,
      });
    }
  };

  // Initialize from URL on mount and listen for hash changes
  useEffect(() => {
    selectFromHash();

    const handleHashChange = () => selectFromHash();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [nodeBySlug, subItemBySlug]);

  const selectNode = (node: Node<CauseEffectNodeData>) => {
    const slug = toSlug(node.data.label);
    window.history.pushState(null, '', `#${slug}`);
    setSelected({
      type: 'node',
      nodeId: node.id,
      label: node.data.label,
      description: node.data.description || '',
      tier: node.data.type as 'cause' | 'intermediate' | 'effect',
      subgroup: node.data.subgroup,
      subItems: node.data.subItems,
    });
  };

  const selectSubItem = (node: Node<CauseEffectNodeData>, index: number) => {
    const subItem = node.data.subItems?.[index];
    if (!subItem) return;
    const slug = toSlug(subItem.label);
    window.history.pushState(null, '', `#${slug}`);
    setSelected({
      type: 'subitem',
      nodeId: node.id,
      subItemIndex: index,
      label: subItem.label,
      description: subItem.description || '',
      tier: node.data.type as 'cause' | 'intermediate' | 'effect',
      parent: node.data.label,
      parentSlug: toSlug(node.data.label),
      subgroup: node.data.subgroup,
      ratings: subItem.ratings as SelectedItem['ratings'],
      keyDebates: subItem.keyDebates as KeyDebate[] | undefined,
      scope: subItem.scope as string | undefined,
      relatedContent: subItem.relatedContent as RelatedContent | undefined,
    });
  };

  const isActive = (nodeId: string, subItemIndex?: number) => {
    if (!selected) return false;
    if (subItemIndex !== undefined) {
      return selected.nodeId === nodeId && selected.subItemIndex === subItemIndex;
    }
    return selected.nodeId === nodeId && selected.type === 'node';
  };

  const renderSidebarSection = (
    type: 'cause' | 'intermediate' | 'effect',
    label: string
  ) => {
    const sectionNodes = nodesByType[type];
    if (!sectionNodes || sectionNodes.length === 0) return null;

    const bySubgroup: Record<string, Node<CauseEffectNodeData>[]> = {};
    for (const node of sectionNodes) {
      const sg = node.data.subgroup || 'default';
      if (!bySubgroup[sg]) bySubgroup[sg] = [];
      bySubgroup[sg].push(node);
    }

    const hasSubgroups = type === 'cause' && subgroups &&
      Object.keys(bySubgroup).some(k => k !== 'default' && bySubgroup[k]?.length > 0);

    return (
      <div className={`ov-section ov-section--${type}`}>
        <div className="ov-section__header">{label}</div>
        {hasSubgroups && subgroups ? (
          Object.keys(subgroups).map(sgKey => {
            if (!bySubgroup[sgKey] || bySubgroup[sgKey].length === 0) return null;
            return (
              <div key={sgKey}>
                <div className="ov-subgroup__header">{subgroups[sgKey].label}</div>
                {sortNodes(bySubgroup[sgKey]).map(node => (
                  <div key={node.id}>
                    <div
                      className={`ov-item ov-item--node ${isActive(node.id) ? 'ov-item--active' : ''}`}
                      onClick={() => selectNode(node)}
                    >
                      {node.data.label}
                    </div>
                    {node.data.subItems?.map((sub, i) => (
                      <div
                        key={i}
                        className={`ov-item ov-item--subitem ${isActive(node.id, i) ? 'ov-item--active' : ''}`}
                        onClick={() => selectSubItem(node, i)}
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })
        ) : (
          sortNodes(sectionNodes).map(node => (
            <div key={node.id}>
              <div
                className={`ov-item ov-item--node ${isActive(node.id) ? 'ov-item--active' : ''}`}
                onClick={() => selectNode(node)}
              >
                {node.data.label}
              </div>
              {node.data.subItems?.map((sub, i) => (
                <div
                  key={i}
                  className={`ov-item ov-item--subitem ${isActive(node.id, i) ? 'ov-item--active' : ''}`}
                  onClick={() => selectSubItem(node, i)}
                >
                  {sub.label}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    );
  };

  const tierLabels = {
    cause: 'Root Factor',
    intermediate: 'Scenario',
    effect: 'Outcome',
  };

  const renderRating = (label: string, value: number | undefined, colorClass: string) => {
    if (value === undefined) return null;
    return (
      <div className={`ov-rating ov-rating--${colorClass}`}>
        <div className="ov-rating__label">{label}</div>
        <div className="ov-rating__row">
          <div className="ov-rating__value">{value}</div>
          <div className="ov-rating__bar">
            <div className="ov-rating__fill" style={{ width: `${value}%` }} />
          </div>
        </div>
      </div>
    );
  };

  const getScoreClass = (score: number) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const renderImpact = (impact: ImpactGridEntry, labelField: 'source' | 'target') => {
    const label = getNodeLabel(impact[labelField]);
    return (
      <div key={`${impact.source}-${impact.target}`} className="ov-impact">
        <div className="ov-impact__header">
          <span className="ov-impact__target">{label}</span>
          <span className={`ov-impact__score ov-impact__score--${getScoreClass(impact.impact)}`}>
            {impact.impact}
          </span>
          <span className={`ov-impact__direction ov-impact__direction--${impact.direction}`}>
            {impact.direction}
          </span>
        </div>
        <div className="ov-impact__notes">{impact.notes}</div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selected) {
      return (
        <div className="ov-detail__empty">
          Select an item from the sidebar to view details
        </div>
      );
    }

    const hasRatings = selected.ratings && (
      selected.ratings.changeability !== undefined ||
      selected.ratings.xriskImpact !== undefined ||
      selected.ratings.trajectoryImpact !== undefined ||
      selected.ratings.uncertainty !== undefined
    );

    // Get subgroup label
    const subgroupLabel = selected.subgroup && subgroups?.[selected.subgroup]?.label;

    // Build breadcrumb items
    const breadcrumbItems: Array<{ label: string; type: string; slug?: string; clickable: boolean }> = [];

    // Tier (always first)
    breadcrumbItems.push({
      label: tierLabels[selected.tier],
      type: `tier ${selected.tier}`,
      clickable: false,
    });

    // Subgroup (if present)
    if (subgroupLabel) {
      breadcrumbItems.push({
        label: subgroupLabel,
        type: 'subgroup',
        clickable: false,
      });
    }

    // Parent node (for subitems)
    if (selected.type === 'subitem' && selected.parent) {
      breadcrumbItems.push({
        label: selected.parent,
        type: 'parent',
        slug: selected.parentSlug,
        clickable: true,
      });
    }

    // Current item (always last)
    breadcrumbItems.push({
      label: selected.label,
      type: 'current',
      clickable: false,
    });

    return (
      <div className="ov-detail__layout">
        <div className="ov-detail__main">
          <nav className="ov-breadcrumbs">
            {breadcrumbItems.map((item, i) => (
              <span key={i} className="ov-breadcrumb">
                {i > 0 && <span className="ov-breadcrumb__separator">/</span>}
                <span
                  className={`ov-breadcrumb__item ov-breadcrumb__item--${item.type.split(' ').join(' ov-breadcrumb__item--')}`}
                  onClick={item.clickable && item.slug ? () => {
                    window.history.pushState(null, '', `#${item.slug}`);
                    const node = nodeBySlug.get(item.slug!);
                    if (node) selectNode(node);
                  } : undefined}
                >
                  {item.label}
                </span>
              </span>
            ))}
          </nav>
          <h1 className="ov-detail__title">{selected.label}</h1>
          {selected.description && (
            <div className="ov-detail__description">
              <Markdown>{selected.description}</Markdown>
            </div>
          )}
          {selected.scope && (
          <div className="ov-detail__scope">
            <div className="ov-detail__scope-header">Scope</div>
            <div className="ov-detail__scope-text">{selected.scope}</div>
          </div>
        )}
        {hasRatings && (
          <div className="ov-detail__ratings">
            {renderRating('Changeability', selected.ratings?.changeability, 'green')}
            {renderRating('Uncertainty', selected.ratings?.uncertainty, 'gray')}
            {renderRating('X-Risk Impact', selected.ratings?.xriskImpact, 'red')}
            {renderRating('Trajectory Impact', selected.ratings?.trajectoryImpact, 'blue')}
          </div>
        )}
        {selected.type === 'node' && selected.subItems && selected.subItems.length > 0 && (
          <div className="ov-detail__subitems">
            <div className="ov-detail__subitems-header">Sub-parameters</div>
            {selected.subItems.map((sub, i) => (
              <div
                key={i}
                className="ov-detail__subitem"
                onClick={() => {
                  const node = contentNodes.find(n => n.id === selected.nodeId);
                  if (node) selectSubItem(node, i);
                }}
              >
                <div className="ov-detail__subitem-label">{sub.label}</div>
                {sub.description && (
                  <div className="ov-detail__subitem-desc">{truncateDescription(sub.description)}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {selected.keyDebates && selected.keyDebates.length > 0 && (
          <div className="ov-detail__debates">
            <div className="ov-detail__debates-header">Key Debates</div>
            {selected.keyDebates.map((debate, i) => (
              <div key={i} className="ov-debate">
                <div className="ov-debate__topic">{debate.topic}</div>
                <div className="ov-debate__desc">{debate.description}</div>
              </div>
            ))}
          </div>
        )}
        {selected.type === 'node' && (() => {
          const impactsFrom = getImpactsFrom(selected.nodeId);
          const impactsTo = getImpactsTo(selected.nodeId);
          if (impactsFrom.length === 0 && impactsTo.length === 0) return null;
          return (
            <div className="ov-detail__impacts">
              <div className="ov-detail__impacts-header">Impact Relationships</div>
              <div className="ov-impacts-grid">
                {impactsFrom.length > 0 && (
                  <div className="ov-impacts-section">
                    <div className="ov-impacts-section__title">Affects →</div>
                    {impactsFrom.map(impact => renderImpact(impact, 'target'))}
                  </div>
                )}
                {impactsTo.length > 0 && (
                  <div className="ov-impacts-section">
                    <div className="ov-impacts-section__title">← Affected by</div>
                    {impactsTo.map(impact => renderImpact(impact, 'source'))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        </div>
        <div className="ov-detail__sidebar">
          <div className="ov-mini-graph">
            <div className="ov-mini-graph__header">Position in Model</div>
            <MiniModelDiagram selectedNodeId={selected.nodeId} />
          </div>
          {selected.relatedContent && (
            (selected.relatedContent.risks?.length ?? 0) > 0 ||
            (selected.relatedContent.responses?.length ?? 0) > 0 ||
            (selected.relatedContent.models?.length ?? 0) > 0 ||
            (selected.relatedContent.cruxes?.length ?? 0) > 0
          ) && (
            <div className="ov-related">
              <div className="ov-related__header">Related Knowledge Base</div>
              {selected.relatedContent.risks && selected.relatedContent.risks.length > 0 && (
                <div className="ov-related__section ov-related__section--risks">
                  <div className="ov-related__section-title">Risks</div>
                  {selected.relatedContent.risks.map((item, i) => (
                    <a key={i} href={item.path} className="ov-related__link">{item.title}</a>
                  ))}
                </div>
              )}
              {selected.relatedContent.responses && selected.relatedContent.responses.length > 0 && (
                <div className="ov-related__section ov-related__section--responses">
                  <div className="ov-related__section-title">Responses</div>
                  {selected.relatedContent.responses.map((item, i) => (
                    <a key={i} href={item.path} className="ov-related__link">{item.title}</a>
                  ))}
                </div>
              )}
              {selected.relatedContent.models && selected.relatedContent.models.length > 0 && (
                <div className="ov-related__section ov-related__section--models">
                  <div className="ov-related__section-title">Models</div>
                  {selected.relatedContent.models.map((item, i) => (
                    <a key={i} href={item.path} className="ov-related__link">{item.title}</a>
                  ))}
                </div>
              )}
              {selected.relatedContent.cruxes && selected.relatedContent.cruxes.length > 0 && (
                <div className="ov-related__section ov-related__section--cruxes">
                  <div className="ov-related__section-title">Key Cruxes</div>
                  {selected.relatedContent.cruxes.map((item, i) => (
                    <a key={i} href={item.path} className="ov-related__link">{item.title}</a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ov-layout">
        <div className="ov-sidebar">
          {renderSidebarSection('cause', typeLabels?.cause || 'Root Factors')}
          {renderSidebarSection('intermediate', typeLabels?.intermediate || 'Ultimate Scenarios')}
          {renderSidebarSection('effect', typeLabels?.effect || 'Ultimate Outcomes')}
        </div>
        <div className="ov-detail">
          {renderDetail()}
        </div>
      </div>
    </>
  );
}
