// Table view for Safety Research Generalizability Model
import { getSafetyApproaches, type SafetyApproach } from '../data/safety-generalizability-graph-data';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .st-page { min-height: 100vh; display: flex; flex-direction: column; }
  .st-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
  }
  .st-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .st-header a:hover { color: #374151; }
  .st-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .st-header nav {
    display: flex;
    gap: 8px;
  }
  .st-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .st-header nav a:hover {
    background: #e5e7eb;
  }
  .st-header nav a.active {
    background: #3b82f6;
    color: white;
  }
  .st-content {
    flex: 1;
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .st-intro {
    margin-bottom: 24px;
    color: #4b5563;
    line-height: 1.6;
  }
  .st-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .st-table th {
    text-align: left;
    padding: 12px 16px;
    background: #f9fafb;
    border-bottom: 2px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
  }
  .st-table td {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .st-table tr:hover {
    background: #f9fafb;
  }
  .st-approach-name {
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }
  .st-approach-desc {
    color: #6b7280;
    font-size: 13px;
    line-height: 1.5;
  }
  .st-level {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .st-level.low {
    background: #fee2e2;
    color: #991b1b;
  }
  .st-level.medium {
    background: #fef3c7;
    color: #92400e;
  }
  .st-level.medium-high {
    background: #dbeafe;
    color: #1e40af;
  }
  .st-level.high {
    background: #ccfbf1;
    color: #115e59;
  }
  .st-level.highest {
    background: #dcfce7;
    color: #166534;
  }
  .st-dep-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .st-dep-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .st-dep-item:last-child {
    margin-bottom: 0;
  }
  .st-dep-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 10px;
  }
  .st-dep-icon.requires {
    background: #dcfce7;
    color: #166534;
  }
  .st-dep-icon.threatens {
    background: #fee2e2;
    color: #991b1b;
  }
  .st-dep-label {
    color: #374151;
  }
  .st-examples {
    color: #6b7280;
    font-size: 13px;
    font-style: italic;
  }
`;

function getLevelClass(level: SafetyApproach['generalizationLevel']): string {
  switch (level) {
    case 'LOW':
      return 'low';
    case 'MEDIUM':
      return 'medium';
    case 'MEDIUM-HIGH':
      return 'medium-high';
    case 'HIGH':
      return 'high';
    case 'HIGHEST':
      return 'highest';
    default:
      return 'medium';
  }
}

export default function SafetyGeneralizabilityTableView() {
  const approaches = getSafetyApproaches();

  return (
    <>
      <style>{styles}</style>
      <div className="st-page">
        <div className="st-header">
          <a href="/knowledge-base/models/">
            <span>←</span> Models
          </a>
          <h1>Safety Research Generalizability</h1>
          <nav>
            <a href="/knowledge-base/safety-generalizability/graph">Graph</a>
            <a href="/knowledge-base/safety-generalizability/table" className="active">Table</a>
            <a href="/knowledge-base/safety-generalizability/matrix">Matrix</a>
          </nav>
        </div>
        <div className="st-content">
          <p className="st-intro">
            This table summarizes which AI safety research approaches are likely to generalize
            to future AI architectures, and what conditions they depend on. Approaches are ordered
            from lowest to highest expected generalization.
          </p>

          <table className="st-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Safety Approach</th>
                <th style={{ width: '12%' }}>Generalization</th>
                <th style={{ width: '31%' }}>Requires (to work)</th>
                <th style={{ width: '31%' }}>Threatened by</th>
              </tr>
            </thead>
            <tbody>
              {approaches.map((approach) => (
                <tr key={approach.id}>
                  <td>
                    <div className="st-approach-name">{approach.label}</div>
                    <div className="st-approach-desc">{approach.description}</div>
                    {approach.examples && (
                      <div className="st-examples">{approach.examples}</div>
                    )}
                  </td>
                  <td>
                    <span className={`st-level ${getLevelClass(approach.generalizationLevel)}`}>
                      {approach.generalizationLevel}
                    </span>
                  </td>
                  <td>
                    {approach.dependencies.length > 0 ? (
                      <ul className="st-dep-list">
                        {approach.dependencies.map((dep) => (
                          <li key={dep.id} className="st-dep-item">
                            <span className="st-dep-icon requires">✓</span>
                            <span className="st-dep-label">{dep.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Minimal dependencies
                      </span>
                    )}
                  </td>
                  <td>
                    {approach.threats.length > 0 ? (
                      <ul className="st-dep-list">
                        {approach.threats.map((threat) => (
                          <li key={threat.id} className="st-dep-item">
                            <span className="st-dep-icon threatens">✗</span>
                            <span className="st-dep-label">{threat.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        Few threats identified
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
