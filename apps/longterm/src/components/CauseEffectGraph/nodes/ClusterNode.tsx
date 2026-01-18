/**
 * ClusterNode - Collapsible container for grouping related nodes (Option D)
 *
 * Features:
 * - Collapsible group of nodes
 * - Shows preview items when collapsed
 * - Visual cluster background
 */

import { useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export interface ClusterNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  color?: string;
  borderColor?: string;
  textColor?: string;

  // Cluster contents
  childCount?: number;
  previewItems?: string[];  // Labels to show when collapsed
  childNodeIds?: string[];  // IDs of child nodes

  // State
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ClusterNode({ data, selected }: NodeProps<Node<ClusterNodeData>>) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (data.onToggleExpand) {
      data.onToggleExpand();
    }
  }, [data]);

  const bgColor = data.color || 'rgba(148, 163, 184, 0.1)';
  const borderColor = data.borderColor || '#94a3b8';
  const textColor = data.textColor || '#64748b';

  return (
    <div
      className={`cluster-node ${data.isExpanded ? 'cluster-node--expanded' : 'cluster-node--collapsed'}`}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        boxShadow: selected
          ? `0 0 0 2px ${borderColor}`
          : isHovered
            ? '0 4px 12px rgba(0, 0, 0, 0.1)'
            : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="exp-node__handle" />

      {/* Header */}
      <div className="cluster-node__header">
        <span className="cluster-node__label" style={{ color: textColor }}>
          {data.label}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.childCount && (
            <span className="cluster-node__count" style={{ color: textColor }}>
              {data.childCount} items
            </span>
          )}

          <button
            className="cluster-node__expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleExpand?.();
            }}
            style={{ color: textColor }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: data.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
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
        </div>
      </div>

      {/* Description (if provided) */}
      {data.description && !data.isExpanded && (
        <div style={{ fontSize: '12px', color: textColor, opacity: 0.8, marginBottom: '8px' }}>
          {data.description}
        </div>
      )}

      {/* Preview items (when collapsed) */}
      {!data.isExpanded && data.previewItems && data.previewItems.length > 0 && (
        <div className="cluster-node__preview">
          {data.previewItems.slice(0, 5).map((item, i) => (
            <span key={i} className="cluster-node__preview-item" style={{ color: textColor }}>
              {item}
            </span>
          ))}
          {data.previewItems.length > 5 && (
            <span className="cluster-node__preview-item" style={{ color: textColor, opacity: 0.6 }}>
              +{data.previewItems.length - 5} more
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="exp-node__handle" />
    </div>
  );
}
