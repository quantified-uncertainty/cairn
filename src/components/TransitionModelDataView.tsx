// Data (YAML) view for AI Transition Model
import './CauseEffectGraph.css';
import { DataView } from './CauseEffectGraph/components';
import { toYaml } from './CauseEffectGraph/layout';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';
import TransitionModelNav from './TransitionModelNav';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; width: 100%; overflow: hidden; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .tm-page { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
  .tm-content { flex: 1; overflow: auto; min-height: 0; }
  .tm-copy-btn {
    position: fixed;
    top: 56px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    cursor: pointer;
    color: #374151;
    z-index: 100;
  }
  .tm-copy-btn:hover { background: #f9fafb; }
`;

export default function TransitionModelDataView() {
  const yamlData = toYaml(parameterNodes, parameterEdges);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yamlData);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="tm-page">
        <TransitionModelNav activeTab="data" />
        <button className="tm-copy-btn" onClick={handleCopy}>Copy</button>
        <div className="tm-content">
          <DataView yaml={yamlData} />
        </div>
      </div>
    </>
  );
}
