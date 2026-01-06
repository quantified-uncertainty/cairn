// Full-page wrapper for the parameter list visualization
// Full-width card layout for side-by-side experimentation

import { ListView } from './CauseEffectGraph/components/ListView';
import { parameterNodes, parameterEdges } from '../data/parameter-graph-data';
import '../components/CauseEffectGraph.css';

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
  .parameter-list-page {
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .parameter-list-page__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #e5e7eb;
    background-color: #f9fafb;
    flex-shrink: 0;
  }
  .parameter-list-page__back-link {
    color: #475569;
    text-decoration: none;
    font-size: 14px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
  }
  .parameter-list-page__back-link:hover {
    color: #1e293b;
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  .parameter-list-page__title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
  .parameter-list-page__container {
    flex: 1;
    overflow: auto;
  }
`;

export default function ParameterListPage() {
  return (
    <>
      <style>{styles}</style>
      <div className="parameter-list-page">
        <div className="parameter-list-page__header">
          <a href="/ai-transition-model/" className="parameter-list-page__back-link">
            &larr; Documentation
          </a>
          <span className="parameter-list-page__title">AI Transition Model - List View</span>
          <a href="/ai-transition-model" className="parameter-list-page__back-link">
            Graph View &rarr;
          </a>
        </div>
        <div className="parameter-list-page__container">
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
