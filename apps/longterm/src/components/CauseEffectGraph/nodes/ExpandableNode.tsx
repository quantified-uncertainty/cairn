/**
 * ExpandableNode - Rich interactive node with expand/collapse and data badges
 *
 * Features:
 * - Rich data display: counts, ratings, connection badges
 * - Click-to-expand: reveals child nodes
 * - Visual clustering support
 */

import { useState, useRef, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { NODE_TYPE_CONFIG, OUTCOME_COLORS, NODE_BORDER_RADIUS } from '../config';

// Extended data for expandable nodes
export interface ExpandableNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  type?: 'cause' | 'effect' | 'intermediate' | 'cluster';
  subgroup?: string;

  // Rich data (Option B)
  childCount?: number;       // Number of child/nested nodes
  connectionCount?: number;  // Number of edges in/out
  importance?: number;       // 0-100 importance score
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';

  // Expand/collapse (Option A)
  isExpanded?: boolean;
  isExpandable?: boolean;
  childNodes?: string[];     // IDs of child nodes to show when expanded
  onToggleExpand?: () => void;

  // Cluster info (Option D)
  clusterId?: string;
  clusterLabel?: string;
  isClusterHeader?: boolean;

  // Collapse button for grouped expandable nodes
  showCollapseButton?: boolean;  // Show collapse button to re-combine group
  onCollapse?: () => void;       // Callback to collapse back to cluster
  groupSize?: number;            // Number of siblings in the group

  // Navigation
  href?: string;
}

// Badge component for displaying counts/ratings
function Badge({
  value,
  label,
  color = '#64748b',
  bgColor = 'rgba(100, 116, 139, 0.2)'
}: {
  value: string | number;
  label?: string;
  color?: string;
  bgColor?: string;
}) {
  return (
    <span
      className="exp-node__badge"
      style={{
        color,
        backgroundColor: bgColor,
      }}
      title={label}
    >
      {value}
    </span>
  );
}

// Expand/collapse button
function ExpandButton({
  isExpanded,
  onClick,
  color
}: {
  isExpanded: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      className="exp-node__expand-btn"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ color }}
      title={isExpanded ? 'Collapse' : 'Expand'}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

// Risk level indicator
function RiskIndicator({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const colors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#f97316',
    critical: '#ef4444',
  };

  return (
    <span
      className="exp-node__risk"
      style={{ backgroundColor: colors[level] }}
      title={`Risk: ${level}`}
    />
  );
}

export function ExpandableNode({ data, selected, id }: NodeProps<Node<ExpandableNodeData>>) {
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const nodeType = data.type || 'intermediate';

  // Get colors from config
  const config = NODE_TYPE_CONFIG[nodeType] || NODE_TYPE_CONFIG.intermediate;
  let colors = {
    bg: config.nodeBg,
    border: config.nodeBorder,
    text: config.nodeText,
    accent: config.nodeAccent,
  };

  // Override for specific outcome nodes
  if (nodeType === 'effect' && id && OUTCOME_COLORS[id]) {
    const outcomeOverride = OUTCOME_COLORS[id];
    colors = {
      bg: outcomeOverride.nodeBg || colors.bg,
      border: outcomeOverride.nodeBorder || colors.border,
      text: outcomeOverride.nodeText || colors.text,
      accent: outcomeOverride.nodeAccent || colors.accent,
    };
  }

  // Cluster header styling
  if (data.isClusterHeader) {
    colors.bg = 'rgba(30, 41, 59, 0.95)';
    colors.border = colors.accent;
  }

  const borderRadius = NODE_BORDER_RADIUS[nodeType] || '12px';
  const isExpandable = data.isExpandable && data.childCount && data.childCount > 0;
  const isClickable = !!data.href;

  const handleClick = useCallback(() => {
    if (data.onToggleExpand && isExpandable) {
      data.onToggleExpand();
    } else if (data.href) {
      window.location.href = data.href;
    }
  }, [data, isExpandable]);

  // Determine what badges to show
  const showChildCount = data.childCount && data.childCount > 0;
  const showConnections = data.connectionCount && data.connectionCount > 0;
  const showImportance = data.importance !== undefined;

  return (
    <div
      ref={nodeRef}
      className={`exp-node ${selected ? 'exp-node--selected' : ''} ${isHovered ? 'exp-node--hovered' : ''} ${data.isExpanded ? 'exp-node--expanded' : ''} ${isExpandable ? 'exp-node--expandable' : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? colors.accent : colors.border,
        borderRadius,
        boxShadow: selected
          ? `0 8px 24px rgba(0,0,0,0.2), 0 0 0 2px ${colors.accent}`
          : isHovered
            ? '0 4px 16px rgba(0,0,0,0.15)'
            : undefined,
        cursor: isExpandable || isClickable ? 'pointer' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="exp-node__handle" />

      {/* Collapse button for grouped nodes */}
      {data.showCollapseButton && data.onCollapse && (
        <button
          className="exp-node__collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            data.onCollapse?.();
          }}
          title={`Collapse back to ${data.clusterLabel || 'cluster'}`}
          style={{ borderColor: `${colors.border}60` }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 10L8 6L12 10" stroke={colors.text} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ color: colors.text }}>
            {data.clusterLabel || 'Collapse'} ({data.groupSize || '?'})
          </span>
        </button>
      )}

      {/* Header row with label and expand button */}
      <div className="exp-node__header">
        <div className="exp-node__label" style={{ color: colors.text }}>
          {data.label}
        </div>

        {isExpandable && (
          <ExpandButton
            isExpanded={!!data.isExpanded}
            onClick={() => data.onToggleExpand?.()}
            color={colors.text}
          />
        )}
      </div>

      {/* Description snippet */}
      {data.description && (
        <div className="exp-node__description" style={{ color: `${colors.text}88` }}>
          {data.description.length > 80
            ? data.description.slice(0, 80) + '...'
            : data.description}
        </div>
      )}

      {/* Rich data badges (Option B) */}
      {(showChildCount || showConnections || showImportance || data.riskLevel) && (
        <div className="exp-node__badges">
          {showChildCount && (
            <Badge
              value={data.childCount!}
              label={`${data.childCount} nested factors`}
              color={colors.text}
              bgColor={`${colors.accent}30`}
            />
          )}

          {showConnections && (
            <Badge
              value={`↔${data.connectionCount}`}
              label={`${data.connectionCount} connections`}
              color={colors.text}
              bgColor={`${colors.border}40`}
            />
          )}

          {showImportance && (
            <Badge
              value={`★${data.importance}`}
              label={`Importance: ${data.importance}/100`}
              color={data.importance! > 70 ? '#fbbf24' : colors.text}
              bgColor={data.importance! > 70 ? 'rgba(251, 191, 36, 0.2)' : `${colors.border}40`}
            />
          )}

          {data.riskLevel && (
            <RiskIndicator level={data.riskLevel} />
          )}
        </div>
      )}

      {/* Cluster indicator */}
      {data.clusterLabel && !data.isClusterHeader && (
        <div className="exp-node__cluster-tag" style={{ color: `${colors.text}66` }}>
          {data.clusterLabel}
        </div>
      )}

      {/* Expansion preview (shows when expandable but collapsed) */}
      {isExpandable && !data.isExpanded && (
        <div className="exp-node__expand-preview" style={{ borderTopColor: `${colors.border}40` }}>
          <span style={{ color: `${colors.text}88` }}>
            Click to expand {data.childCount} items
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="exp-node__handle" />
    </div>
  );
}
