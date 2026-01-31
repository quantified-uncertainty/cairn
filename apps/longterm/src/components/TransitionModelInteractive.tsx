// Embeddable interactive view for AI Transition Model - no navigation wrapper
import './CauseEffectGraph.css';
import { InteractiveView } from './CauseEffectGraph/components';
import { parameterNodes, parameterEdges } from '@data/parameter-graph-data';

const typeLabels = {
  cause: 'Root Factors',
  intermediate: 'Ultimate Scenarios',
  effect: 'Ultimate Outcomes',
};

const subgroups = {
  'ai': { label: 'AI System Factors' },
  'society': { label: 'Societal Factors' },
};

export default function TransitionModelInteractive() {
  return (
    <div style={{
      width: '100%',
      marginLeft: 'calc(-1 * var(--sl-content-pad-x, 1rem))',
      marginRight: 'calc(-1 * var(--sl-content-pad-x, 1rem))',
      paddingLeft: 'var(--sl-content-pad-x, 1rem)',
      paddingRight: 'var(--sl-content-pad-x, 1rem)',
      background: '#f8fafc',
      borderTop: '1px solid var(--sl-color-gray-5, #e5e7eb)',
      borderBottom: '1px solid var(--sl-color-gray-5, #e5e7eb)',
      paddingTop: '1rem',
      paddingBottom: '1rem',
      marginBottom: '2rem',
    }}>
      <InteractiveView
        nodes={parameterNodes}
        edges={parameterEdges}
        typeLabels={typeLabels}
        subgroups={subgroups}
        basePath="/ai-transition-model"
        className="iv-container--embedded"
      />
    </div>
  );
}
