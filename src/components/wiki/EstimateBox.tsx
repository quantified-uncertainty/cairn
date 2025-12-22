import React from 'react';

interface Estimate {
  source: string;
  value: string;
  date?: string;
  url?: string;
  notes?: string;
}

interface EstimateBoxProps {
  variable: string;
  description?: string;
  estimates: Estimate[];
  unit?: string;
  aggregateRange?: string;
}

export function EstimateBox({
  variable,
  description,
  estimates,
  unit = '%',
  aggregateRange
}: EstimateBoxProps) {
  return (
    <div className="estimate-box">
      <div className="estimate-header">
        <span className="estimate-icon">📊</span>
        <span className="estimate-variable">{variable}</span>
      </div>

      {description && (
        <p className="estimate-description">{description}</p>
      )}

      {aggregateRange && (
        <div className="estimate-aggregate">
          <span className="aggregate-label">Aggregate Range:</span>
          <span className="aggregate-value">{aggregateRange}</span>
        </div>
      )}

      <div className="estimate-sources">
        <table className="estimate-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Estimate</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est, i) => (
              <tr key={i}>
                <td>
                  {est.url ? (
                    <a href={est.url} target="_blank" rel="noopener noreferrer">
                      {est.source}
                    </a>
                  ) : (
                    est.source
                  )}
                </td>
                <td className="estimate-value-cell">
                  {est.value}{unit && !est.value.includes('%') && !est.value.includes('-') ? unit : ''}
                </td>
                <td className="estimate-date">{est.date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {estimates.some(e => e.notes) && (
        <div className="estimate-notes">
          {estimates.filter(e => e.notes).map((est, i) => (
            <p key={i} className="estimate-note">
              <strong>{est.source}:</strong> {est.notes}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default EstimateBox;
