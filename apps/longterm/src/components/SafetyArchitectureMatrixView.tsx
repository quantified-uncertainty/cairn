// Matrix view: Safety Approaches × Architecture Scenarios
import { getSafetyApproaches, type SafetyApproach } from '../data/safety-generalizability-graph-data';
import { getArchitectureScenarios, type ArchitectureScenario } from '../data/architecture-scenarios-data';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .mx-page { min-height: 100vh; display: flex; flex-direction: column; }
  .mx-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
  }
  .mx-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .mx-header a:hover { color: #374151; }
  .mx-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .mx-header nav {
    display: flex;
    gap: 8px;
  }
  .mx-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .mx-header nav a:hover { background: #e5e7eb; }
  .mx-header nav a.active { background: #3b82f6; color: white; }
  .mx-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .mx-intro {
    margin-bottom: 24px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 900px;
  }
  .mx-table-wrapper {
    overflow-x: auto;
  }
  .mx-table {
    border-collapse: collapse;
    font-size: 13px;
    min-width: 100%;
  }
  .mx-table th {
    padding: 12px 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
    text-align: center;
  }
  .mx-table th.approach-header {
    text-align: left;
    min-width: 180px;
    background: #f3f4f6;
  }
  .mx-table th.scenario-header {
    min-width: 140px;
    font-size: 12px;
  }
  .mx-table td {
    padding: 10px 12px;
    border: 1px solid #e5e7eb;
    vertical-align: middle;
    text-align: center;
  }
  .mx-table td.approach-cell {
    text-align: left;
    background: #fafafa;
  }
  .mx-approach-name {
    font-weight: 600;
    color: #111827;
    font-size: 13px;
  }
  .mx-approach-gen {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    margin-left: 8px;
  }
  .mx-approach-gen.low { background: #fee2e2; color: #991b1b; }
  .mx-approach-gen.medium { background: #fef3c7; color: #92400e; }
  .mx-approach-gen.high { background: #dcfce7; color: #166534; }
  .mx-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .mx-rating {
    font-size: 18px;
  }
  .mx-rating.works { color: #22c55e; }
  .mx-rating.partial { color: #f59e0b; }
  .mx-rating.fails { color: #ef4444; }
  .mx-rating.unknown { color: #9ca3af; }
  .mx-note {
    font-size: 10px;
    color: #6b7280;
    max-width: 120px;
    line-height: 1.3;
  }
  .mx-legend {
    margin-top: 24px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .mx-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .mx-legend-icon {
    font-size: 18px;
  }
`;

// Compatibility matrix: [approachId][scenarioId] -> rating
const COMPATIBILITY: Record<string, Record<string, { rating: 'works' | 'partial' | 'fails' | 'unknown'; note: string }>> = {
  'mechanistic-interp': {
    'scaled-transformers': { rating: 'works', note: 'Best case: stable arch, white-box access' },
    'scaffolded-agents': { rating: 'partial', note: 'Which component? Emergent behavior hard to trace' },
    'ssm-based': { rating: 'partial', note: 'Different internals, needs new techniques' },
    'hybrid-neurosymbolic': { rating: 'partial', note: 'Neural parts opaque, symbolic parts clear' },
    'novel-unknown': { rating: 'fails', note: 'Current techniques unlikely to transfer' },
  },
  'training-based': {
    'scaled-transformers': { rating: 'works', note: 'Standard RLHF pipeline applies' },
    'scaffolded-agents': { rating: 'partial', note: 'Can train base models, not scaffold logic' },
    'ssm-based': { rating: 'works', note: 'Gradient-based training still works' },
    'hybrid-neurosymbolic': { rating: 'partial', note: 'Neural parts trainable, symbolic parts not' },
    'novel-unknown': { rating: 'unknown', note: 'May not use gradient descent' },
  },
  'blackbox-evals': {
    'scaled-transformers': { rating: 'works', note: 'Query access, predictable behavior' },
    'scaffolded-agents': { rating: 'partial', note: 'Emergent behavior hard to eval comprehensively' },
    'ssm-based': { rating: 'works', note: 'Behavioral testing still applicable' },
    'hybrid-neurosymbolic': { rating: 'works', note: 'Can test end-to-end behavior' },
    'novel-unknown': { rating: 'partial', note: 'If queryable, basic evals work' },
  },
  'control-containment': {
    'scaled-transformers': { rating: 'works', note: 'Standard containment approaches' },
    'scaffolded-agents': { rating: 'partial', note: 'Multi-component systems harder to box' },
    'ssm-based': { rating: 'works', note: 'Architecture-agnostic principles apply' },
    'hybrid-neurosymbolic': { rating: 'works', note: 'Symbolic parts may be easier to constrain' },
    'novel-unknown': { rating: 'partial', note: 'Core principles likely transfer' },
  },
  'theoretical-alignment': {
    'scaled-transformers': { rating: 'works', note: 'Theory is architecture-independent' },
    'scaffolded-agents': { rating: 'works', note: 'Agent theory applies to any agent' },
    'ssm-based': { rating: 'works', note: 'Mathematical frameworks still valid' },
    'hybrid-neurosymbolic': { rating: 'works', note: 'May be easier to formally verify' },
    'novel-unknown': { rating: 'works', note: 'Core theory transcends architecture' },
  },
};

function getRatingIcon(rating: string): string {
  switch (rating) {
    case 'works': return '✓';
    case 'partial': return '◐';
    case 'fails': return '✗';
    case 'unknown': return '?';
    default: return '?';
  }
}

function getGenClass(level: string): string {
  if (level.includes('LOW')) return 'low';
  if (level.includes('HIGH')) return 'high';
  return 'medium';
}

export default function SafetyArchitectureMatrixView() {
  const approaches = getSafetyApproaches();
  const scenarios = getArchitectureScenarios();

  return (
    <>
      <style>{styles}</style>
      <div className="mx-page">
        <div className="mx-header">
          <a href="/knowledge-base/intelligence-paradigms/">← Intelligence Paradigms</a>
          <h1>Safety × Architecture Compatibility Matrix</h1>
          <nav>
            <a href="/knowledge-base/safety-approaches/table">Approaches</a>
            <a href="/knowledge-base/architecture-scenarios/table">Architectures</a>
            <a href="/knowledge-base/safety-generalizability/matrix" className="active">Matrix</a>
          </nav>
        </div>
        <div className="mx-content">
          <p className="mx-intro">
            This matrix shows which safety research approaches are likely to work under different
            future AI architecture scenarios. Green = likely works, yellow = partially works or
            needs adaptation, red = unlikely to work, gray = unknown.
          </p>

          <div className="mx-table-wrapper">
            <table className="mx-table">
              <thead>
                <tr>
                  <th className="approach-header">Safety Approach</th>
                  {scenarios.map((s) => (
                    <th key={s.id} className="scenario-header">
                      {s.label}
                      <br />
                      <span style={{ fontWeight: 'normal', fontSize: '10px', color: '#6b7280' }}>
                        {s.likelihood}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approaches.map((approach) => (
                  <tr key={approach.id}>
                    <td className="approach-cell">
                      <span className="mx-approach-name">{approach.label}</span>
                      <span className={`mx-approach-gen ${getGenClass(approach.generalizationLevel)}`}>
                        {approach.generalizationLevel}
                      </span>
                    </td>
                    {scenarios.map((scenario) => {
                      const compat = COMPATIBILITY[approach.id]?.[scenario.id] || { rating: 'unknown', note: '' };
                      return (
                        <td key={scenario.id}>
                          <div className="mx-cell">
                            <span className={`mx-rating ${compat.rating}`}>
                              {getRatingIcon(compat.rating)}
                            </span>
                            <span className="mx-note">{compat.note}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mx-legend">
            <div className="mx-legend-item">
              <span className="mx-legend-icon" style={{ color: '#22c55e' }}>✓</span>
              <span>Works well</span>
            </div>
            <div className="mx-legend-item">
              <span className="mx-legend-icon" style={{ color: '#f59e0b' }}>◐</span>
              <span>Partially works / needs adaptation</span>
            </div>
            <div className="mx-legend-item">
              <span className="mx-legend-icon" style={{ color: '#ef4444' }}>✗</span>
              <span>Unlikely to work</span>
            </div>
            <div className="mx-legend-item">
              <span className="mx-legend-icon" style={{ color: '#9ca3af' }}>?</span>
              <span>Unknown</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
