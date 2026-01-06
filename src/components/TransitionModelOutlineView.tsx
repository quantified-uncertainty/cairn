// Outline view for AI Transition Model
import './CauseEffectGraph.css';
import { OutlineView } from './CauseEffectGraph/components';
import { parameterNodes } from '../data/parameter-graph-data';
import TransitionModelNav from './TransitionModelNav';

const typeLabels = {
  cause: 'Root Factors',
  intermediate: 'Ultimate Scenarios',
  effect: 'Ultimate Outcomes',
};

const subgroups = {
  'ai': { label: 'AI System Factors' },
  'society': { label: 'Societal Factors' },
};

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; width: 100%; overflow: hidden; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .tm-page { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
  .tm-content { flex: 1; overflow: auto; min-height: 0; }
`;

export default function TransitionModelOutlineView() {
  return (
    <>
      <style>{styles}</style>
      <div className="tm-page">
        <TransitionModelNav activeTab="outline" />
        <div className="tm-content">
          <OutlineView
            nodes={parameterNodes}
            typeLabels={typeLabels}
            subgroups={subgroups}
          />
        </div>
      </div>
    </>
  );
}
