import type { NodeProps, Node } from '@xyflow/react';
import type { CauseEffectNodeData } from '../types';
import { groupConfig } from '../config';

export function GroupNode({ data }: NodeProps<Node<CauseEffectNodeData>>) {
  const config = groupConfig[data.type || 'intermediate'];
  const labelColor = config?.borderColor || '#64748b';

  return (
    <div className="ceg-group-node">
      <div className="ceg-group-node__label" style={{ color: labelColor }}>
        {data.label}
      </div>
    </div>
  );
}
