import React from 'react';

interface Position {
  // Primary format
  actor?: string;
  position?: string;
  estimate?: string;
  confidence?: 'low' | 'medium' | 'high';
  source?: string;
  url?: string;
  // Alternative format (also accepted)
  name?: string;
  description?: string;
  proponents?: string[];
  strength?: number;
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

const getPositionColor = (position: string | undefined, strength?: number): string => {
  if (strength !== undefined) {
    if (strength >= 4) return '#ef4444'; // red
    if (strength >= 3) return '#f59e0b'; // amber
    if (strength >= 2) return '#22c55e'; // green
    return '#6b7280'; // gray
  }

  if (!position) return '#6b7280'; // gray default

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

const parseEstimateForBar = (estimate?: string, strength?: number): number | null => {
  if (strength !== undefined) {
    return strength * 25; // Convert 1-4 scale to 25-100%
  }
  if (!estimate) return null;
  const match = estimate.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

// Normalize position data to handle both formats
const normalizePosition = (pos: Position) => ({
  actor: pos.actor || pos.name || 'Unknown',
  position: pos.position || pos.description || '',
  estimate: pos.estimate,
  confidence: pos.confidence,
  source: pos.source,
  url: pos.url,
  proponents: pos.proponents,
  strength: pos.strength,
});

export function DisagreementMap({
  topic,
  description,
  positions,
  spectrum
}: DisagreementMapProps) {
  const normalizedPositions = positions.map(normalizePosition);

  const sortedPositions = [...normalizedPositions].sort((a, b) => {
    const aVal = parseEstimateForBar(a.estimate, a.strength) ?? 50;
    const bVal = parseEstimateForBar(b.estimate, b.strength) ?? 50;
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
          const barWidth = parseEstimateForBar(pos.estimate, pos.strength);
          const color = getPositionColor(pos.position, pos.strength);

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
                      backgroundColor: color
                    }}
                  />
                )}
                <span className="position-estimate">{pos.estimate || ''}</span>
              </div>

              <div className="position-content">
                <div
                  className="position-label"
                  style={{ color }}
                >
                  {pos.position}
                </div>
                {pos.proponents && pos.proponents.length > 0 && (
                  <div className="position-proponents">
                    {pos.proponents.join(', ')}
                  </div>
                )}
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

      {normalizedPositions.some(p => p.source) && (
        <div className="position-sources">
          <span className="sources-label">Sources:</span>
          {normalizedPositions.filter(p => p.source).map((pos, i) => (
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
