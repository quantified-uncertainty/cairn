/**
 * ClusterContainerNode - Visual wrapper for expanded cluster nodes
 *
 * When a cluster is expanded, this node acts as a background container
 * with a collapse button to re-combine the items.
 */

import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

export interface ClusterContainerData extends Record<string, unknown> {
  label: string;
  childCount?: number;
  onCollapse?: () => void;
  color?: string;
  borderColor?: string;
}

export function ClusterContainerNode({ data }: NodeProps<Node<ClusterContainerData>>) {
  const bgColor = data.color || 'rgba(148, 163, 184, 0.08)';
  const borderColor = data.borderColor || 'rgba(148, 163, 184, 0.4)';

  return (
    <div
      className="cluster-container-node"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />

      {/* Header with collapse button */}
      <div className="cluster-container-node__header">
        <span className="cluster-container-node__label">
          {data.label}
        </span>

        {data.childCount && (
          <span className="cluster-container-node__count">
            {data.childCount} items
          </span>
        )}

        <button
          className="cluster-container-node__collapse-btn"
          onClick={(e) => {
            e.stopPropagation();
            data.onCollapse?.();
          }}
          title="Collapse back to cluster"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 10L8 6L12 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
}
