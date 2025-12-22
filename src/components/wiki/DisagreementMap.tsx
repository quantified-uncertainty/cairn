import React from 'react';

interface Position {
  actor: string;
  position: string;
  estimate?: string;
  confidence?: 'low' | 'medium' | 'high';
  source?: string;
  url?: string;
}

interface DisagreementMapProps {
  topic: string;
  description?: string;
  positions: Position[];
  spectrum?: {
    low: string;
    high: string;
  };
}

const getPositionColor = (position: string): string => {
  const posLower = position.toLowerCase();
  if (posLower.includes('high') || posLower.includes('likely') || posLower.includes('yes') || posLower.includes('>50')) {
    return '#ef4444'; // red
  }
  if (posLower.includes('low') || posLower.includes('unlikely') || posLower.includes('no') || posLower.includes('<20')) {
    return '#22c55e'; // green
  }
  if (posLower.includes('medium') || posLower.includes('uncertain') || posLower.includes('maybe')) {
    return '#f59e0b'; // amber
  }
  return '#6b7280'; // gray
};

const parseEstimateForBar = (estimate?: string): number | null => {
  if (!estimate) return null;
  const match = estimate.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export function DisagreementMap({
  topic,
  description,
  positions,
  spectrum
}: DisagreementMapProps) {
  const sortedPositions = [...positions].sort((a, b) => {
    const aVal = parseEstimateForBar(a.estimate) ?? 50;
    const bVal = parseEstimateForBar(b.estimate) ?? 50;
    return aVal - bVal;
  });

  return (
    <div className="disagreement-map">
      <div className="disagreement-header">
        <span className="disagreement-icon">⚖️</span>
        <span className="disagreement-topic">{topic}</span>
      </div>

      {description && (
        <p className="disagreement-description">{description}</p>
      )}

      {spectrum && (
        <div className="disagreement-spectrum">
          <span className="spectrum-low">{spectrum.low}</span>
          <div className="spectrum-bar"></div>
          <span className="spectrum-high">{spectrum.high}</span>
        </div>
      )}

      <div className="positions-list">
        {sortedPositions.map((pos, i) => {
          const barWidth = parseEstimateForBar(pos.estimate);

          return (
            <div key={i} className="position-row">
              <div className="position-actor">
                {pos.url ? (
                  <a href={pos.url} target="_blank" rel="noopener noreferrer">
                    {pos.actor}
                  </a>
                ) : (
                  pos.actor
                )}
              </div>

              <div className="position-bar-container">
                {barWidth !== null && (
                  <div
                    className="position-bar"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: getPositionColor(pos.position)
                    }}
                  />
                )}
                <span className="position-estimate">{pos.estimate || pos.position}</span>
              </div>

              <div
                className="position-label"
                style={{ color: getPositionColor(pos.position) }}
              >
                {pos.position}
              </div>

              {pos.confidence && (
                <span className={`confidence-indicator confidence-${pos.confidence}`}>
                  {pos.confidence === 'high' ? '●●●' : pos.confidence === 'medium' ? '●●○' : '●○○'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {positions.some(p => p.source) && (
        <div className="position-sources">
          <span className="sources-label">Sources:</span>
          {positions.filter(p => p.source).map((pos, i) => (
            <span key={i} className="source-ref">
              {pos.url ? (
                <a href={pos.url} target="_blank" rel="noopener noreferrer">
                  [{pos.actor}]
                </a>
              ) : (
                `[${pos.actor}]`
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default DisagreementMap;
