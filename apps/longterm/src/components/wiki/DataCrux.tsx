/**
 * Data-aware Crux Component
 *
 * Wrapper that supports both:
 * 1. Inline data via props (backwards compatible)
 * 2. Data lookup via `dataId` prop (pulls from YAML data)
 */

import React from 'react';
import { getCruxData } from '@data';
import { Card } from '../ui/card';
import { cn } from '@lib/utils';
import { importanceColors, resolvabilityLabels, type ImportanceLevel } from './shared/style-config';

interface CruxPosition {
  view: string;
  probability?: string;
  holders?: string[];
  implications?: string;
}

interface RelevantResearch {
  title: string;
  url?: string;
}

interface DataCruxProps {
  // Data lookup option
  dataId?: string;

  // Inline props (for backwards compatibility)
  id?: string;
  question?: string;
  domain?: string;
  description?: string;
  importance?: 'low' | 'medium' | 'high' | 'critical';
  resolvability?: 'soon' | 'years' | 'decades' | 'never';
  currentState?: string;
  positions?: CruxPosition[];
  wouldUpdateOn?: string[];
  relatedCruxes?: string[];
  relevantResearch?: RelevantResearch[];
}


export function DataCrux({
  dataId,
  id: inlineId,
  question: inlineQuestion,
  domain: inlineDomain,
  description: inlineDescription,
  importance: inlineImportance,
  resolvability: inlineResolvability,
  currentState: inlineCurrentState,
  positions: inlinePositions,
  wouldUpdateOn: inlineWouldUpdateOn,
  relatedCruxes: inlineRelatedCruxes,
  relevantResearch: inlineRelevantResearch,
}: DataCruxProps) {
  // Determine data source
  let data: DataCruxProps;

  if (dataId) {
    const fetchedData = getCruxData(dataId);
    if (!fetchedData) {
      return (
        <Card className="my-6 p-4 border-dashed">
          <p className="text-muted-foreground m-0">No crux found with ID: {dataId}</p>
        </Card>
      );
    }
    data = fetchedData;
  } else {
    data = {
      id: inlineId,
      question: inlineQuestion,
      domain: inlineDomain,
      description: inlineDescription,
      importance: inlineImportance,
      resolvability: inlineResolvability,
      currentState: inlineCurrentState,
      positions: inlinePositions,
      wouldUpdateOn: inlineWouldUpdateOn,
      relatedCruxes: inlineRelatedCruxes,
      relevantResearch: inlineRelevantResearch,
    };
  }

  const {
    question,
    domain,
    description,
    importance,
    resolvability,
    currentState,
    positions,
    wouldUpdateOn,
    relatedCruxes,
    relevantResearch,
  } = data;

  if (!question) {
    return (
      <Card className="my-6 p-4 border-dashed">
        <p className="text-muted-foreground m-0">Crux requires a question prop or dataId</p>
      </Card>
    );
  }

  return (
    <Card className="my-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border-b border-border">
        <span>🔑</span>
        <span className="font-semibold">Key Crux</span>
        {domain && (
          <span className="text-xs px-2 py-0.5 bg-muted rounded">{domain}</span>
        )}
        {importance && (
          <span className={cn("text-xs px-2 py-0.5 text-white rounded ml-auto", importanceColors[importance as ImportanceLevel]?.bg)}>
            {importance}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Question */}
        <h4 className="text-lg font-semibold text-foreground mt-0 mb-3">{question}</h4>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}

        {/* Current state & Resolvability */}
        {(currentState || resolvability) && (
          <div className="flex flex-col gap-2 mb-4 text-sm">
            {currentState && (
              <div>
                <strong className="text-foreground">Current state:</strong>{' '}
                <span className="text-muted-foreground">{currentState}</span>
              </div>
            )}
            {resolvability && (
              <div>
                <strong className="text-foreground">Resolvability:</strong>{' '}
                <span className="text-muted-foreground">{resolvabilityLabels[resolvability] || resolvability}</span>
              </div>
            )}
          </div>
        )}

        {/* Positions */}
        {positions && positions.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">Positions:</h5>
            <div className="flex flex-col gap-3">
              {positions.map((pos, i) => (
                <div key={i} className="pl-3 border-l-2 border-amber-500/50">
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
                  {pos.implications && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Implications: {pos.implications}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Would update on */}
        {wouldUpdateOn && wouldUpdateOn.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">Would update on:</h5>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 m-0">
              {wouldUpdateOn.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Related cruxes */}
        {relatedCruxes && relatedCruxes.length > 0 && (
          <div className="text-sm mb-4">
            <strong className="text-foreground">Related cruxes:</strong>{' '}
            <span className="text-muted-foreground">{relatedCruxes.join(', ')}</span>
          </div>
        )}

        {/* Relevant research */}
        {relevantResearch && relevantResearch.length > 0 && (
          <div>
            <h5 className="text-sm font-semibold text-muted-foreground mb-2">Relevant research:</h5>
            <ul className="list-disc list-inside text-sm space-y-1 m-0">
              {relevantResearch.map((item, i) => (
                <li key={i}>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-foreground no-underline hover:underline"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

export default DataCrux;
