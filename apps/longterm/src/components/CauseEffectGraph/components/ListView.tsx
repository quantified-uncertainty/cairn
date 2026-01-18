import { useState, useMemo, createContext, useContext, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData } from '../types';

// Context for coordinating hover highlighting across the view
const HighlightContext = createContext<{
  hoveredId: string | null;
  connectedIds: Set<string>;
  setHovered: (id: string | null) => void;
}>({
  hoveredId: null,
  connectedIds: new Set(),
  setHovered: () => {},
});

// Context for global tooltip
const TooltipContext = createContext<{
  showTooltip: (content: string, rect: DOMRect) => void;
  hideTooltip: () => void;
}>({
  showTooltip: () => {},
  hideTooltip: () => {},
});

interface ListViewProps {
  nodes: Node<CauseEffectNodeData>[];
  edges: Edge<CauseEffectEdgeData>[];
  typeLabels?: {
    cause?: string;
    intermediate?: string;
    effect?: string;
  };
  subgroups?: Record<string, { label: string }>;
}

// Global tooltip component
function GlobalTooltip({ content, position }: { content: string | null; position: { x: number; y: number } | null }) {
  if (!content || !position) return null;

  return (
    <div
      className="lv-global-tooltip"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
    >
      {content}
    </div>
  );
}

// Sub-item component with hover tooltip
function SubItem({ item }: { item: { label: string; description?: string; href?: string } }) {
  const { showTooltip, hideTooltip } = useContext(TooltipContext);
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (item.description && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      showTooltip(item.description, rect);
    }
  };

  const content = item.href ? (
    <a href={item.href} className="lv-subitem__link">{item.label}</a>
  ) : (
    item.label
  );

  return (
    <div
      ref={ref}
      className={`lv-node__subitem ${item.description ? 'lv-node__subitem--hoverable' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
    >
      {content}
    </div>
  );
}

// Individual node card component - full width
function NodeCard({
  node,
}: {
  node: Node<CauseEffectNodeData>;
}) {
  const { setHovered, hoveredId, connectedIds } = useContext(HighlightContext);
  const { showTooltip, hideTooltip } = useContext(TooltipContext);
  const headerRef = useRef<HTMLDivElement>(null);

  const isHighlighted = hoveredId === node.id || connectedIds.has(node.id);
  const isDimmed = hoveredId !== null && !isHighlighted;

  const hasSubItems = node.data.subItems && node.data.subItems.length > 0;

  const handleHeaderEnter = () => {
    setHovered(node.id);
    if (node.data.description && headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      showTooltip(node.data.description, rect);
    }
  };

  const handleHeaderLeave = () => {
    setHovered(null);
    hideTooltip();
  };

  return (
    <div
      className={`lv-node ${isHighlighted ? 'lv-node--highlighted' : ''} ${isDimmed ? 'lv-node--dimmed' : ''}`}
    >
      <div
        ref={headerRef}
        className="lv-node__header"
        onMouseEnter={handleHeaderEnter}
        onMouseLeave={handleHeaderLeave}
      >
        <span className="lv-node__title">{node.data.label}</span>
      </div>

      {hasSubItems && (
        <div className="lv-node__subitems">
          {node.data.subItems!.map((item, i) => (
            <SubItem key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tier section component - full width stacked layout
function TierSection({
  title,
  nodes,
  subgroups,
  tierType,
}: {
  title: string;
  nodes: Node<CauseEffectNodeData>[];
  subgroups?: Record<string, { label: string }>;
  tierType: 'cause' | 'intermediate' | 'effect';
}) {
  // Group by subgroup if applicable
  const groupedNodes = useMemo(() => {
    if (!subgroups) return { default: nodes };

    const groups: Record<string, Node<CauseEffectNodeData>[]> = {};
    nodes.forEach(node => {
      const sg = node.data.subgroup || 'default';
      if (!groups[sg]) groups[sg] = [];
      groups[sg].push(node);
    });
    return groups;
  }, [nodes, subgroups]);

  const hasSubgroups = subgroups && Object.keys(groupedNodes).some(k => k !== 'default' && groupedNodes[k]?.length > 0);

  // Sort nodes by order
  const sortNodes = (nodeList: Node<CauseEffectNodeData>[]) => {
    return [...nodeList].sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));
  };

  const tierClass = `lv-tier lv-tier--${tierType}`;

  return (
    <div className={tierClass}>
      <div className="lv-tier__header">
        <h3 className="lv-tier__title">{title}</h3>
      </div>

      <div className="lv-tier__content">
        {hasSubgroups ? (
          Object.entries(subgroups || {}).map(([key, config]) => {
            const sgNodes = groupedNodes[key];
            if (!sgNodes || sgNodes.length === 0) return null;

            return (
              <div key={key} className="lv-subgroup">
                <div className="lv-subgroup__header">{config.label}</div>
                <div className="lv-subgroup__nodes">
                  {sortNodes(sgNodes).map(node => (
                    <NodeCard key={node.id} node={node} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="lv-tier__nodes">
            {sortNodes(nodes).map(node => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main list view component
export function ListView({ nodes, edges, typeLabels, subgroups }: ListViewProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Filter to content nodes only
  const contentNodes = useMemo(() =>
    nodes.filter(n => n.type === 'causeEffect' || (!n.type && n.data.type)),
    [nodes]
  );

  // Group by type
  const nodesByType = useMemo(() => {
    const groups: Record<string, Node<CauseEffectNodeData>[]> = {};
    contentNodes.forEach(node => {
      const type = node.data.type || 'intermediate';
      if (!groups[type]) groups[type] = [];
      groups[type].push(node);
    });
    return groups;
  }, [contentNodes]);

  // Compute connected nodes for highlighting
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === hoveredId) connected.add(edge.target);
      if (edge.target === hoveredId) connected.add(edge.source);
    });
    return connected;
  }, [hoveredId, edges]);

  const highlightContextValue = {
    hoveredId,
    connectedIds,
    setHovered: setHoveredId,
  };

  const tooltipContextValue = {
    showTooltip: (content: string, rect: DOMRect) => {
      setTooltipContent(content);
      setTooltipPosition({
        x: rect.right + 12,
        y: rect.top,
      });
    },
    hideTooltip: () => {
      setTooltipContent(null);
      setTooltipPosition(null);
    },
  };

  return (
    <HighlightContext.Provider value={highlightContextValue}>
      <TooltipContext.Provider value={tooltipContextValue}>
        <div className="lv-container">
          {nodesByType['cause'] && nodesByType['cause'].length > 0 && (
            <TierSection
              title={typeLabels?.cause || 'Root Factors'}
              nodes={nodesByType['cause']}
              subgroups={subgroups}
              tierType="cause"
            />
          )}

          {nodesByType['intermediate'] && nodesByType['intermediate'].length > 0 && (
            <TierSection
              title={typeLabels?.intermediate || 'Scenarios'}
              nodes={nodesByType['intermediate']}
              tierType="intermediate"
            />
          )}

          {nodesByType['effect'] && nodesByType['effect'].length > 0 && (
            <TierSection
              title={typeLabels?.effect || 'Outcomes'}
              nodes={nodesByType['effect']}
              tierType="effect"
            />
          )}
        </div>
        <GlobalTooltip content={tooltipContent} position={tooltipPosition} />
      </TooltipContext.Provider>
    </HighlightContext.Provider>
  );
}
