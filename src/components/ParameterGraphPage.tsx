// Full-page wrapper for the parameter graph visualization
// Includes styling, back button, and data

import CauseEffectGraph, { type GraphConfig } from './CauseEffectGraph';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';

// Complete configuration specific to this parameter graph
const parameterGraphConfig: GraphConfig = {
  layout: {
    containerWidth: 1600,
    centerX: 800,
    layerGap: 60,
    causeSpacing: 8,         // Spacing between root factor nodes
    intermediateSpacing: 200, // Spread middle row
    effectSpacing: 400,       // Spread bottom row
  },
  typeLabels: {
    cause: 'Root Factors',
    intermediate: 'Ultimate Scenarios',
    effect: 'Ultimate Outcomes',
  },
  subgroups: {
    // Root Factor clusters - subtle tints to distinguish AI vs Societal within blue tier
    'ai': { label: 'AI System Factors', bgColor: 'rgba(219, 234, 254, 0.2)', borderColor: 'transparent' },
    'society': { label: 'Societal Factors', bgColor: 'rgba(209, 250, 229, 0.2)', borderColor: 'transparent' },
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
    top: 8px;
    left: 12px;
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
  /* Add left padding to graph header to make room for back button */
  .parameter-graph-page .ceg-header {
    padding-left: 240px;
  }
`;

export default function ParameterGraphPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="parameter-graph-page">
        <a href="/ai-transition-model/" className="parameter-graph-page__back-link">
          &larr; Documentation
        </a>
        <div className="parameter-graph-page__container">
          <CauseEffectGraph
            initialNodes={parameterNodes}
            initialEdges={parameterEdges}
            height="100%"
            graphConfig={parameterGraphConfig}
            showFullscreenButton={false}
          />
        </div>
      </div>
    </>
  );
}
