// Full-page wrapper for the parameter graph visualization
// Includes styling, back button, and data

import CauseEffectGraph, { type GraphConfig } from './CauseEffectGraph';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';

// Complete configuration specific to this parameter graph
const parameterGraphConfig: GraphConfig = {
  layout: {
    containerWidth: 1350,
    centerX: 750,
    layerGap: 60,
    causeSpacing: 40,        // Compressed top row
    intermediateSpacing: 200, // Spread middle row
    effectSpacing: 400,       // Spread bottom row
  },
  typeLabels: {
    cause: 'Root Factors',
    intermediate: 'Ultimate Scenarios',
    effect: 'Ultimate Outcomes',
  },
  subgroups: {
    // Subgroups for this specific graph (if nodes have subgroup field)
    'ai-takeover': { label: 'AI Takeover', bgColor: 'rgba(255, 182, 193, 0.3)', borderColor: '#f9a8d4' },
    'human-caused': { label: 'Human-Caused', bgColor: 'rgba(255, 182, 193, 0.3)', borderColor: '#f9a8d4' },
    'post-trans-factors': { label: 'Post-Trans Factors', bgColor: 'rgba(255, 228, 181, 0.3)', borderColor: '#fcd34d' },
    'transition': { label: 'Transition Effects', bgColor: 'rgba(135, 206, 235, 0.3)', borderColor: '#7dd3fc' },
  },
};

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  html, body {
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }
  .parameter-graph-page {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
  .parameter-graph-page__back-link {
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 1000;
    color: #475569;
    text-decoration: none;
    font-size: 14px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    cursor: pointer;
  }
  .parameter-graph-page__back-link:hover {
    color: #1e293b;
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  .parameter-graph-page__container {
    width: 100%;
    height: 100%;
  }
`;

export default function ParameterGraphPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="parameter-graph-page">
        <a href="/knowledge-base/parameters/" className="parameter-graph-page__back-link">
          &larr; Back to Parameters
        </a>
        <div className="parameter-graph-page__container">
          <CauseEffectGraph
            initialNodes={parameterNodes}
            initialEdges={parameterEdges}
            height="100%"
            graphConfig={parameterGraphConfig}
          />
        </div>
      </div>
    </>
  );
}
