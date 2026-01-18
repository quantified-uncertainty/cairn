// List view for AI Transition Model
import './CauseEffectGraph.css';
import { ListView } from './CauseEffectGraph/components';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';
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

export default function TransitionModelListView() {
  return (
    <>
      <style>{styles}</style>
      <div className="tm-page">
        <TransitionModelNav activeTab="list" />
        <div className="tm-content">
          <ListView
            nodes={parameterNodes}
            edges={parameterEdges}
            typeLabels={typeLabels}
            subgroups={subgroups}
          />
        </div>
      </div>
    </>
  );
}
