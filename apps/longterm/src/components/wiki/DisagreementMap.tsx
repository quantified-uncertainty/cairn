import React from 'react';
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

// Normalize position data to handle both formats
const normalizePosition = (pos: Position) => ({
  name: pos.name || pos.actor || 'Unknown',
  description: pos.description || pos.position || '',
  estimate: pos.estimate,
  confidence: pos.confidence,
  source: pos.source,
  url: pos.url,
  proponents: pos.proponents,
  strength: pos.strength,
});

const strengthLabels: Record<number, { label: string; color: string }> = {
  5: { label: 'Dominant', color: 'text-red-600 dark:text-red-400' },
  4: { label: 'Strong', color: 'text-orange-600 dark:text-orange-400' },
  3: { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400' },
  2: { label: 'Minority', color: 'text-emerald-600 dark:text-emerald-400' },
  1: { label: 'Rare', color: 'text-muted-foreground' },
};

const confidenceLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'High confidence', color: 'text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium confidence', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low confidence', color: 'text-red-600 dark:text-red-400' },
};

export function DisagreementMap({
  topic,
  description,
  positions,
  spectrum
}: DisagreementMapProps) {
  const normalizedPositions = positions.map(normalizePosition);

  // Sort by strength (higher first) then by name
  const sortedPositions = [...normalizedPositions].sort((a, b) => {
    const aStrength = a.strength ?? 0;
    const bStrength = b.strength ?? 0;
    if (bStrength !== aStrength) return bStrength - aStrength;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="my-6 not-content">
      <details className="group" open>
        <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {topic} ({positions.length} perspectives)
        </summary>

        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}

        {spectrum && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400">{spectrum.low}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-400" />
            <span className="text-red-600 dark:text-red-400">{spectrum.high}</span>
          </div>
        )}

        <div className="space-y-6">
          {sortedPositions.map((pos, i) => {
            const strength = strengthLabels[pos.strength ?? 0];

            return (
              <div
                key={i}
                className="pl-3 py-1 border-l-2 border-border/50"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground">
                    {pos.url ? (
                      <a
                        href={pos.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground no-underline hover:underline"
                      >
                        {pos.name}
                      </a>
                    ) : (
                      pos.name
                    )}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pos.estimate && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {pos.estimate}
                      </span>
                    )}
                    {strength && (
                      <span className={cn("text-xs font-medium", strength.color)}>
                        {strength.label}
                      </span>
                    )}
                    {pos.confidence && confidenceLabels[pos.confidence] && (
                      <span className={cn("text-xs", confidenceLabels[pos.confidence].color)}>
                        {confidenceLabels[pos.confidence].label}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pos.description}
                </p>

                {pos.proponents && pos.proponents.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground/70">
                    {pos.proponents.join(' · ')}
                  </div>
                )}

                {pos.source && (
                  <div className="mt-1 text-xs text-muted-foreground/70">
                    {pos.source}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

export default DisagreementMap;
