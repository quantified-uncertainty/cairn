import React from 'react';
import { Card } from '../ui/card';
import { cn } from '@lib/utils';
import { importanceColors, resolvabilityLabels, type ImportanceLevel, type Resolvability } from './shared/style-config';

interface Position {
  view: string;
  holders?: string[];
  probability?: string;
  implications: string;
}

interface CruxProps {
  id: string;
  question: string;
  domain: string;
  description?: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  resolvability: 'soon' | 'years' | 'decades' | 'unclear';
  currentState?: string;
  positions: Position[];
  relatedCruxes?: string[];
  wouldUpdateOn?: string[];
  relevantResearch?: { title: string; url?: string }[];
}

// Importance badge styling
const importanceBadgeStyles = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-slate-400 text-white',
} as const;

const importanceLabels = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

// Header background colors based on importance
const headerBgStyles = {
  critical: 'bg-red-500/10 border-red-500/20',
  high: 'bg-orange-500/10 border-orange-500/20',
  medium: 'bg-amber-500/10 border-amber-500/20',
  low: 'bg-slate-500/10 border-slate-500/20',
} as const;

// Position card accent colors based on parent importance
const positionAccentStyles = {
  critical: 'border-l-red-500',
  high: 'border-l-orange-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-400',
} as const;

export function Crux({
  id,
  question,
  domain,
  description,
  importance,
  resolvability,
  currentState,
  positions,
  relatedCruxes,
  wouldUpdateOn,
  relevantResearch,
}: CruxProps) {
  return (
    <Card className="my-6 overflow-hidden" id={id}>
      {/* Header with colored background */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center justify-between gap-3",
        headerBgStyles[importance]
      )}>
        <div className="flex items-center gap-2">
          <span className="text-base">🔑</span>
          <span className="font-semibold text-foreground">Key Crux</span>
          <span className="text-xs font-medium px-2 py-0.5 bg-background/50 rounded border border-border">
            {domain}
          </span>
        </div>
        <span className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded",
          importanceBadgeStyles[importance]
        )}>
          {importanceLabels[importance]}
        </span>
      </div>

      <div className="p-4">
        {/* Question as title */}
        <p className="text-lg font-semibold text-foreground mt-0 mb-3 leading-snug">{question}</p>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 pb-4 border-b border-border text-sm">
          <div>
            <span className="text-muted-foreground">Resolvability: </span>
            <span className="font-medium text-foreground">{resolvabilityLabels[resolvability]}</span>
          </div>
          {currentState && (
            <div className="flex-1 min-w-[200px]">
              <span className="text-muted-foreground">Status: </span>
              <span className="text-foreground">{currentState}</span>
            </div>
          )}
        </div>

        {/* Positions */}
        <div className="mb-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Key Positions
          </h4>
          <div className="flex flex-col gap-3">
            {positions.map((pos, i) => (
              <div
                key={i}
                className={cn(
                  "pl-4 py-2 border-l-3 bg-muted/30 rounded-r",
                  positionAccentStyles[importance]
                )}
                style={{ borderLeftWidth: '3px' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{pos.view}</span>
                  {pos.probability && (
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-background rounded border border-border text-muted-foreground">
                      {pos.probability}
                    </span>
                  )}
                </div>
                {pos.holders && pos.holders.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1.5">
                    <span className="font-medium">Held by:</span> {pos.holders.join(', ')}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1.5 flex items-start gap-1.5">
                  <span className="text-muted-foreground/60">→</span>
                  <span>{pos.implications}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Would update on */}
        {wouldUpdateOn && wouldUpdateOn.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Would Update On
            </h4>
            <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
              {wouldUpdateOn.map((update, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-0.5">•</span>
                  <span>{update}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer with related cruxes and research */}
        {((relatedCruxes && relatedCruxes.length > 0) || (relevantResearch && relevantResearch.length > 0)) && (
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            {/* Related cruxes */}
            {relatedCruxes && relatedCruxes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Related:</span>
                {relatedCruxes.map((crux, i) => (
                  <a
                    key={i}
                    href={`#${crux}`}
                    className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-foreground no-underline transition-colors"
                  >
                    {crux}
                  </a>
                ))}
              </div>
            )}

            {/* Research */}
            {relevantResearch && relevantResearch.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                <span className="text-xs font-medium text-muted-foreground">Research:</span>
                {relevantResearch.map((r, i) => (
                  <span key={i} className="text-sm">
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-foreground no-underline hover:underline"
                      >
                        {r.title}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">{r.title}</span>
                    )}
                    {i < relevantResearch.length - 1 && <span className="text-muted-foreground">, </span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Component for listing multiple cruxes in a domain
interface CruxListProps {
  domain: string;
  cruxes: Array<{
    id: string;
    question: string;
    importance: 'critical' | 'high' | 'medium' | 'low';
    summary: string;
    link?: string;
  }>;
}

export function CruxList({ domain, cruxes }: CruxListProps) {
  const sortedCruxes = [...cruxes].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.importance] - order[b.importance];
  });

  return (
    <Card className="my-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
        <span className="text-base">🔑</span>
        <span className="font-semibold text-foreground">Key Cruxes</span>
        <span className="text-xs font-medium px-2 py-0.5 bg-background/50 rounded border border-border">
          {domain}
        </span>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {sortedCruxes.map((crux) => (
          <div key={crux.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex-shrink-0 mt-0.5 px-2 py-0.5 text-xs font-semibold text-white rounded capitalize",
                  importanceBadgeStyles[crux.importance]
                )}
              >
                {crux.importance}
              </span>
              <div className="flex-1 min-w-0">
                {crux.link ? (
                  <a href={crux.link} className="font-medium text-foreground hover:text-accent-foreground no-underline hover:underline">
                    {crux.question}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{crux.question}</span>
                )}
                <p className="m-0 mt-1 text-sm text-muted-foreground leading-relaxed">
                  {crux.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default Crux;
