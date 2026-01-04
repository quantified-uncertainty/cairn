import { useState } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { CauseEffectNodeData } from '../types';
import { NODE_TYPE_CONFIG } from '../config';

export function CauseEffectNode({ data, selected }: NodeProps<Node<CauseEffectNodeData>>) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeType = data.type || 'intermediate';

  const config = NODE_TYPE_CONFIG[nodeType] || NODE_TYPE_CONFIG.intermediate;
  const colors = {
    bg: config.nodeBg,
    border: config.nodeBorder,
    text: config.nodeText,
    accent: config.nodeAccent,
  };

  const hasSubItems = data.subItems && data.subItems.length > 0;
  const isClickable = !!data.href;

  const handleClick = () => {
    if (data.href) {
      window.location.href = data.href;
    }
  };

  return (
    <div
      className={`ceg-node ${hasSubItems ? 'ceg-node--with-subitems' : ''} ${selected ? 'ceg-node--selected' : ''} ${isClickable ? 'ceg-node--clickable' : ''}`}
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? colors.text : colors.border,
        boxShadow: selected ? `0 8px 24px rgba(0,0,0,0.15), 0 0 0 2px ${colors.accent}` : undefined,
        cursor: isClickable ? 'pointer' : undefined,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={isClickable ? handleClick : undefined}
    >
      <Handle type="target" position={Position.Top} className="ceg-node__handle" />

      <div className="ceg-node__label" style={{ color: colors.text }}>
        {data.label}
      </div>

      {data.confidence !== undefined && !hasSubItems && (
        <div className="ceg-node__confidence">
          {data.confidenceLabel
            ? `${data.confidence > 1 ? Math.round(data.confidence) : Math.round(data.confidence * 100) + '%'} ${data.confidenceLabel}`
            : `${Math.round(data.confidence * 100)}% confidence`}
        </div>
      )}

      {hasSubItems && (
        <div className="ceg-node__subitems" style={{ borderTopColor: `${colors.border}40` }}>
          {data.subItems!.map((item, i) => (
            <div
              key={i}
              className={`ceg-node__subitem ${item.href ? 'ceg-node__subitem--clickable' : ''}`}
              style={{
                backgroundColor: colors.bg,
                borderColor: `${colors.border}60`,
                color: colors.text,
                cursor: item.href ? 'pointer' : undefined,
              }}
              onClick={item.href ? (e) => { e.stopPropagation(); window.location.href = item.href!; } : undefined}
            >
              <span className="ceg-node__subitem-label">{item.label}</span>
              {item.probability && (
                <span className="ceg-node__subitem-prob">{item.probability}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {showTooltip && data.description && (
        <div className="ceg-node__tooltip">
          {data.description}
          <div className="ceg-node__tooltip-arrow" />
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="ceg-node__handle" />
    </div>
  );
}
