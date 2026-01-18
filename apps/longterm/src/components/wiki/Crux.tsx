import React from 'react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
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


function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-sm font-semibold text-muted-foreground mb-2">{children}</h4>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

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
  const impStyle = importanceColors[importance];

  return (
    <Card className="my-6 p-5" id={id}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium uppercase tracking-wide px-2 py-0.5 bg-muted rounded">
            {domain}
          </span>
          <span
            className={cn("text-sm", impStyle.color)}
            title={`Importance: ${importance}`}
          >
            {impStyle.label}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground m-0">{question}</h3>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      )}

      {/* Info row */}
      <div className="flex flex-wrap gap-6 mb-4 py-3 border-y border-border">
        <InfoItem label="Resolvability" value={resolvabilityLabels[resolvability]} />
        {currentState && <InfoItem label="Current state" value={currentState} />}
      </div>

      {/* Positions */}
      <div className="mb-4">
        <SectionHeader>Key Positions</SectionHeader>
        <div className="flex flex-col gap-3">
          {positions.map((pos, i) => (
            <div key={i} className="pl-3 border-l-2 border-border">
              <div className="flex items-baseline gap-2">
                <strong className="text-foreground">{pos.view}</strong>
                {pos.probability && (
                  <span className="text-xs text-muted-foreground">({pos.probability})</span>
                )}
              </div>
              {pos.holders && pos.holders.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Held by: {pos.holders.join(', ')}
                </div>
              )}
              <div className="text-sm text-muted-foreground mt-1">
                → {pos.implications}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Would update on */}
      {wouldUpdateOn && wouldUpdateOn.length > 0 && (
        <div className="mb-4">
          <SectionHeader>Would Update On</SectionHeader>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {wouldUpdateOn.map((update, i) => (
              <li key={i}>{update}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Related cruxes */}
      {relatedCruxes && relatedCruxes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-3 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">Related cruxes:</span>
          {relatedCruxes.map((crux, i) => (
            <a
              key={i}
              href={`#${crux}`}
              className="text-xs px-2 py-0.5 bg-muted rounded text-accent-foreground no-underline hover:bg-muted/80"
            >
              {crux}
            </a>
          ))}
        </div>
      )}

      {/* Research */}
      {relevantResearch && relevantResearch.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-2 py-3 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">Research:</span>
          <span className="text-sm">
            {relevantResearch.map((r, i) => (
              <span key={i}>
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
                  r.title
                )}
                {i < relevantResearch.length - 1 && ', '}
              </span>
            ))}
          </span>
        </div>
      )}
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
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border font-semibold">
        <span>🔑</span>
        <span>Key Cruxes: {domain}</span>
      </div>

      <div className="flex flex-col">
        {sortedCruxes.map((crux) => {
          const impStyle = importanceColors[crux.importance];
          return (
            <div key={crux.id} className="px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-semibold text-white rounded lowercase",
                    impStyle.bg
                  )}
                >
                  {crux.importance}
                </span>
                {crux.link ? (
                  <a href={crux.link} className="font-medium text-foreground underline underline-offset-2 hover:text-accent-foreground">
                    {crux.question}
                  </a>
                ) : (
                  <span className="font-medium text-foreground">{crux.question}</span>
                )}
              </div>
              <p className="m-0 pl-[calc(0.5rem+3.5rem+0.75rem)] text-sm text-muted-foreground">
                {crux.summary}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default Crux;
