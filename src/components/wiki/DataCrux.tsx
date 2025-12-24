/**
 * Data-aware Crux Component
 *
 * Wrapper that supports both:
 * 1. Inline data via props (backwards compatible)
 * 2. Data lookup via `dataId` prop (pulls from YAML data)
 */

import React from 'react';
import { getCruxData } from '../../data';
import './wiki.css';

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

const importanceColors: Record<string, string> = {
  low: '#6b7280',
  medium: '#eab308',
  high: '#f97316',
  critical: '#dc2626',
};

const resolvabilityLabels: Record<string, string> = {
  soon: 'Potentially soon (months)',
  years: 'Years of research',
  decades: 'Decades',
  never: 'May never resolve',
};

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
        <div className="crux-box crux-box--empty">
          <p>No crux found with ID: {dataId}</p>
        </div>
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
      <div className="crux-box crux-box--empty">
        <p>Crux requires a question prop or dataId</p>
      </div>
    );
  }

  return (
    <div className="crux-box">
      <div className="crux-header">
        <span className="crux-icon">🔑</span>
        <span className="crux-label">Key Crux</span>
        {domain && <span className="crux-domain">{domain}</span>}
        {importance && (
          <span
            className="crux-importance"
            style={{ backgroundColor: importanceColors[importance] }}
          >
            {importance}
          </span>
        )}
      </div>

      <h4 className="crux-question">{question}</h4>

      {description && <p className="crux-description">{description}</p>}

      {currentState && (
        <div className="crux-current-state">
          <strong>Current state:</strong> {currentState}
        </div>
      )}

      {resolvability && (
        <div className="crux-resolvability">
          <strong>Resolvability:</strong> {resolvabilityLabels[resolvability] || resolvability}
        </div>
      )}

      {positions && positions.length > 0 && (
        <div className="crux-positions">
          <h5>Positions:</h5>
          {positions.map((pos, i) => (
            <div key={i} className="crux-position">
              <div className="crux-position-view">
                <strong>{pos.view}</strong>
                {pos.probability && (
                  <span className="crux-position-prob"> ({pos.probability})</span>
                )}
              </div>
              {pos.holders && pos.holders.length > 0 && (
                <div className="crux-position-holders">
                  Held by: {pos.holders.join(', ')}
                </div>
              )}
              {pos.implications && (
                <div className="crux-position-implications">
                  Implications: {pos.implications}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {wouldUpdateOn && wouldUpdateOn.length > 0 && (
        <div className="crux-would-update">
          <h5>Would update on:</h5>
          <ul>
            {wouldUpdateOn.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {relatedCruxes && relatedCruxes.length > 0 && (
        <div className="crux-related">
          <strong>Related cruxes:</strong> {relatedCruxes.join(', ')}
        </div>
      )}

      {relevantResearch && relevantResearch.length > 0 && (
        <div className="crux-research">
          <h5>Relevant research:</h5>
          <ul>
            {relevantResearch.map((item, i) => (
              <li key={i}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                ) : (
                  item.title
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DataCrux;
