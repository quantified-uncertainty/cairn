import { useState, useMemo, createContext, useContext, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { CauseEffectNodeData, CauseEffectEdgeData } from '../types';
import { getEntityById, getPageById } from '../../../data';
import { cn } from '../../../lib/utils';
import { Card } from '../../ui/card';

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

// Context for global tooltip (avoids overflow issues)
const TooltipContext = createContext<{
  showTooltip: (content: string, rect: DOMRect) => void;
  hideTooltip: () => void;
}>({
  showTooltip: () => {},
  hideTooltip: () => {},
});

// Convert label to URL-friendly slug
function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

interface InteractiveViewProps {
  nodes: Node<CauseEffectNodeData>[];
  edges: Edge<CauseEffectEdgeData>[];
  typeLabels?: {
    cause?: string;
    intermediate?: string;
    effect?: string;
  };
  subgroups?: Record<string, { label: string }>;
  basePath?: string; // Base path for generated links (e.g., '/ai-transition-model')
  className?: string; // Additional CSS class (e.g., 'iv-container--embedded')
}

// Global tooltip component (renders at root level to avoid overflow clipping)
function GlobalTooltip({ content, position }: { content: string | null; position: { x: number; y: number } | null }) {
  if (!content || !position) return null;

  return (
    <div
      className="iv-global-tooltip"
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

// Helper to truncate text
function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// Helper to format entity type for display
function formatEntityType(type: string): string {
  return type
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Sub-item component with hover tooltip
function SubItem({
  item,
  nodeType,
  nodeId,
  basePath,
}: {
  item: { label: string; description?: string; href?: string; entityId?: string };
  nodeType?: 'cause' | 'intermediate' | 'effect';
  nodeId?: string;
  basePath?: string;
}) {
  // Look up entity data for rich tooltips
  const entity = item.entityId ? getEntityById(item.entityId) : null;
  const page = item.entityId ? getPageById(item.entityId) : null;

  // Get summary for tooltip (prefer llmSummary, fall back to description)
  const summary = page?.llmSummary || page?.description || entity?.description || item.description;
  const entityType = entity?.type;

  // Generate href based on basePath, nodeType, nodeId, and item label
  let href = item.href;
  if (!href && basePath && nodeType && nodeId) {
    const typePathMap: Record<string, string> = {
      cause: 'factors',
      intermediate: 'scenarios',
      effect: 'outcomes',
    };
    const typePath = typePathMap[nodeType];
    const itemSlug = toSlug(item.label);
    href = `${basePath}/${typePath}/${nodeId}/${itemSlug}/`;
  }

  // Always show tooltip if we have summary or entity type
  const hasTooltipContent = summary || entityType;

  return (
    <div className="group relative py-0.5">
      <span className={cn(
        "text-[13px] text-gray-600 dark:text-gray-400",
        hasTooltipContent && "cursor-help"
      )}>
        {href ? (
          <a
            href={href}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 no-underline hover:underline"
          >
            {item.label}
          </a>
        ) : (
          item.label
        )}
      </span>
      {hasTooltipContent && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none">
          {entityType && (
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {formatEntityType(entityType)}
            </div>
          )}
          <div className="font-medium mb-1">
            {entity?.title || item.label}
          </div>
          {summary && (
            <div className="text-gray-300 text-xs leading-relaxed">
              {truncateText(summary, 200)}
            </div>
          )}
          {page?.quality && (
            <div className="text-xs text-gray-500 mt-2">
              Quality: {page.quality}/100
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual node item component
function NodeItem({
  node,
  basePath,
}: {
  node: Node<CauseEffectNodeData>;
  basePath?: string;
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
    <Card
      className={cn(
        // Base styles - compact card that doesn't stretch
        "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200",
        // Highlighted state
        isHighlighted && "border-blue-500 ring-2 ring-blue-500/20",
        // Dimmed state
        isDimmed && "opacity-40"
      )}
    >
      <div
        ref={headerRef}
        className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-800 dark:text-gray-200 rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onMouseEnter={handleHeaderEnter}
        onMouseLeave={handleHeaderLeave}
      >
        <span>{node.data.label}</span>
      </div>

      {/* Only render content area if there are sub-items */}
      {hasSubItems && (
        <div className="px-3 pb-2">
          <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
            {node.data.subItems!.map((item, i) => (
              <SubItem
                key={i}
                item={item}
                nodeType={node.data.type}
                nodeId={node.id}
                basePath={basePath}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Tier section component
function TierSection({
  title,
  nodes,
  subgroups,
  tierType,
  basePath,
}: {
  title: string;
  nodes: Node<CauseEffectNodeData>[];
  subgroups?: Record<string, { label: string }>;
  tierType: 'cause' | 'intermediate' | 'effect';
  basePath?: string;
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

  // Tier header colors
  const tierHeaderColors = {
    cause: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
    intermediate: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    effect: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={cn("px-4 py-2", tierHeaderColors[tierType])}>
        <h3 className="text-sm font-semibold uppercase tracking-wide m-0">{title}</h3>
      </div>

      <div className="p-3">
        {hasSubgroups ? (
          Object.entries(subgroups || {}).map(([key, config]) => {
            const sgNodes = groupedNodes[key];
            if (!sgNodes || sgNodes.length === 0) return null;

            return (
              <div key={key} className="mb-3 last:mb-0">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 pl-1">
                  {config.label}
                </div>
                {/* CSS Grid with top-alignment */}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 items-start">
                  {sortNodes(sgNodes).map(node => (
                    <NodeItem
                      key={node.id}
                      node={node}
                      basePath={basePath}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          /* CSS Grid with top-alignment */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 items-start">
            {sortNodes(nodes).map(node => (
              <NodeItem
                key={node.id}
                node={node}
                basePath={basePath}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Main interactive view component
export function InteractiveView({ nodes, edges, typeLabels, subgroups, basePath, className }: InteractiveViewProps) {
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
      // Position tooltip to the right of the element
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
        <div className={cn("iv-container not-content", className)}>
          {nodesByType['cause'] && nodesByType['cause'].length > 0 && (
            <TierSection
              title={typeLabels?.cause || 'Root Factors'}
              nodes={nodesByType['cause']}
              subgroups={subgroups}
              tierType="cause"
              basePath={basePath}
            />
          )}

          {nodesByType['intermediate'] && nodesByType['intermediate'].length > 0 && (
            <TierSection
              title={typeLabels?.intermediate || 'Scenarios'}
              nodes={nodesByType['intermediate']}
              tierType="intermediate"
              basePath={basePath}
            />
          )}

          {nodesByType['effect'] && nodesByType['effect'].length > 0 && (
            <TierSection
              title={typeLabels?.effect || 'Outcomes'}
              nodes={nodesByType['effect']}
              tierType="effect"
              basePath={basePath}
            />
          )}
        </div>
        <GlobalTooltip content={tooltipContent} position={tooltipPosition} />
      </TooltipContext.Provider>
    </HighlightContext.Provider>
  );
}
