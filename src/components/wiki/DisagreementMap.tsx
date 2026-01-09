import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

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

const confidenceIndicators = {
  high: { text: '●●●', class: 'text-green-500' },
  medium: { text: '●●○', class: 'text-amber-500' },
  low: { text: '●○○', class: 'text-red-500' },
};

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
    <Card className="my-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
        <span>⚖️</span>
        <span className="font-semibold">{topic}</span>
      </div>

      <div className="p-4">
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}

        {/* Spectrum bar */}
        {spectrum && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-green-600 min-w-[80px]">{spectrum.low}</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)'
              }}
            />
            <span className="text-xs font-medium text-red-600 min-w-[80px] text-right">{spectrum.high}</span>
          </div>
        )}

        {/* Positions list */}
        <div className="flex flex-col gap-3">
          {sortedPositions.map((pos, i) => {
            const barWidth = parseEstimateForBar(pos.estimate, pos.strength);
            const color = getPositionColor(pos.position, pos.strength);

            return (
              <div key={i} className="flex items-center gap-3">
                {/* Actor name */}
                <div className="w-[100px] flex-shrink-0 text-sm font-medium truncate">
                  {pos.url ? (
                    <a
                      href={pos.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-foreground no-underline hover:underline"
                    >
                      {pos.actor}
                    </a>
                  ) : (
                    pos.actor
                  )}
                </div>

                {/* Bar + estimate */}
                <div className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1 h-5 bg-muted rounded overflow-hidden">
                    {barWidth !== null && (
                      <div
                        className="absolute inset-y-0 left-0 rounded transition-all"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: color
                        }}
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-foreground mix-blend-difference">
                      {pos.estimate || ''}
                    </span>
                  </div>
                </div>

                {/* Position text */}
                <div className="w-[150px] flex-shrink-0">
                  <div className="text-sm font-medium" style={{ color }}>
                    {pos.position}
                  </div>
                  {pos.proponents && pos.proponents.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate">
                      {pos.proponents.join(', ')}
                    </div>
                  )}
                </div>

                {/* Confidence indicator */}
                {pos.confidence && confidenceIndicators[pos.confidence as keyof typeof confidenceIndicators] && (
                  <span className={cn("text-xs tracking-tight", confidenceIndicators[pos.confidence as keyof typeof confidenceIndicators].class)}>
                    {confidenceIndicators[pos.confidence as keyof typeof confidenceIndicators].text}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Sources footer */}
        {normalizedPositions.some(p => p.source) && (
          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <span className="font-medium mr-2">Sources:</span>
            {normalizedPositions.filter(p => p.source).map((pos, i) => (
              <span key={i} className="mr-1">
                {pos.url ? (
                  <a
                    href={pos.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-foreground no-underline hover:underline"
                  >
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
    </Card>
  );
}

export default DisagreementMap;
