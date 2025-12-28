/**
 * PageStatus Component
 *
 * Displays editorial metadata for knowledge base pages including:
 * - Quality rating (0-100)
 * - Importance rating (0-100)
 * - LLM summary (short explanation)
 * - Last edited date
 * - Optional todo/notes
 *
 * Supports dev-only mode: only shows when ?dev=true in URL or in development
 */

import React from 'react';

interface PageMetrics {
  wordCount: number;
  tableCount: number;
  diagramCount: number;
  internalLinks: number;
  externalLinks: number;
  bulletRatio: number;
  sectionCount: number;
  hasOverview: boolean;
  structuralScore: number;
}

interface PageStatusProps {
  quality?: number;  // 0-100 scale
  importance?: number;  // 0-100 scale
  llmSummary?: string;
  lastEdited?: string;
  todo?: string;
  wordCount?: number;
  backlinkCount?: number;
  metrics?: PageMetrics;
  suggestedQuality?: number;
  /** If true, only show in dev mode (controlled by header toggle) */
  devOnly?: boolean;
}

const qualityLabels: Record<string, string> = {
  comprehensive: 'Comprehensive',
  good: 'Good',
  adequate: 'Adequate',
  draft: 'Draft',
  stub: 'Stub',
};

const importanceLabels: Record<string, string> = {
  essential: 'Essential',
  high: 'High',
  useful: 'Useful',
  reference: 'Reference',
  peripheral: 'Peripheral',
};

function getQualityLevel(quality: number): string {
  if (quality >= 80) return 'comprehensive';
  if (quality >= 60) return 'good';
  if (quality >= 40) return 'adequate';
  if (quality >= 20) return 'draft';
  return 'stub';
}

function getImportanceLevel(importance: number): string {
  if (importance >= 90) return 'essential';
  if (importance >= 70) return 'high';
  if (importance >= 50) return 'useful';
  if (importance >= 30) return 'reference';
  return 'peripheral';
}

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatAge(lastEdited: string): string {
  const today = new Date();
  const edited = new Date(lastEdited);
  const days = Math.floor((today.getTime() - edited.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days <= 14) return `${days} days ago`;
  if (days <= 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function QualityBadge({ quality }: { quality: number }) {
  const level = getQualityLevel(quality);
  const colorClass = level === 'comprehensive' ? 'page-status-quality--comprehensive'
    : level === 'good' ? 'page-status-quality--good'
    : level === 'adequate' ? 'page-status-quality--adequate'
    : level === 'draft' ? 'page-status-quality--draft'
    : 'page-status-quality--stub';

  return (
    <span className={`page-status-quality ${colorClass}`}>
      {quality} <span className="page-status-quality-label">({qualityLabels[level]})</span>
    </span>
  );
}

export function PageStatus({ quality, importance, llmSummary, lastEdited, todo, wordCount, backlinkCount, metrics, suggestedQuality, devOnly = false }: PageStatusProps) {
  // Don't render if no metadata provided
  if (!quality && !importance && !llmSummary && !lastEdited && !todo) {
    return null;
  }

  // Wrapper class handles visibility via CSS when devOnly is true
  const wrapperClass = devOnly ? 'page-status-dev-only' : '';

  const importanceLevel = importance !== undefined ? getImportanceLevel(importance) : null;
  const importanceColor = importanceLevel === 'essential' ? 'page-status-importance--essential'
    : importanceLevel === 'high' ? 'page-status-importance--high'
    : importanceLevel === 'useful' ? 'page-status-importance--useful'
    : 'page-status-importance--low';

  // Check for quality discrepancy (on 0-100 scale, 20+ points is significant)
  const qualityDiscrepancy = quality !== undefined && suggestedQuality !== undefined ? quality - suggestedQuality : 0;
  const hasDiscrepancy = Math.abs(qualityDiscrepancy) >= 20;

  return (
    <div className={`page-status ${wrapperClass}`}>
      <div className="page-status-header">
        <span className="page-status-icon">📋</span>
        <span className="page-status-title">Page Status</span>
      </div>

      <div className="page-status-content">
        {/* Row 1: Quality and Importance side by side */}
        <div className="page-status-row page-status-row--metrics">
          {quality !== undefined && (
            <div className="page-status-metric">
              <span className="page-status-label">Quality:</span>
              <QualityBadge quality={quality} />
              {hasDiscrepancy && (
                <span className="page-status-discrepancy" title={`Structural analysis suggests ${suggestedQuality}`}>
                  ⚠️
                </span>
              )}
            </div>
          )}
          {importance !== undefined && (
            <div className="page-status-metric">
              <span className="page-status-label">Importance:</span>
              <span className={`page-status-importance ${importanceColor}`}>
                {importance} <span className="page-status-importance-label">({importanceLabels[importanceLevel!]})</span>
              </span>
            </div>
          )}
        </div>

        {/* Row 2: Last edited with age, plus word count and backlinks */}
        <div className="page-status-row page-status-row--stats">
          {lastEdited && (
            <div className="page-status-stat">
              <span className="page-status-label">Last edited:</span>
              <span className="page-status-value">{lastEdited} ({formatAge(lastEdited)})</span>
            </div>
          )}
          {(wordCount !== undefined && wordCount > 0) && (
            <div className="page-status-stat">
              <span className="page-status-label">Words:</span>
              <span className="page-status-value">{formatWordCount(wordCount)}</span>
            </div>
          )}
          {(backlinkCount !== undefined && backlinkCount > 0) && (
            <div className="page-status-stat">
              <span className="page-status-label">Backlinks:</span>
              <span className="page-status-value">{backlinkCount}</span>
            </div>
          )}
        </div>

        {/* Row 3: Structural metrics breakdown */}
        {metrics && (
          <div className="page-status-row page-status-row--structural">
            <span className="page-status-label">Structure:</span>
            <div className="page-status-metrics-grid">
              <span className="page-status-metric-item" title="Tables">
                📊 {metrics.tableCount}
              </span>
              <span className="page-status-metric-item" title="Diagrams">
                📈 {metrics.diagramCount}
              </span>
              <span className="page-status-metric-item" title="Internal links">
                🔗 {metrics.internalLinks}
              </span>
              <span className="page-status-metric-item" title="External citations">
                📚 {metrics.externalLinks}
              </span>
              <span className="page-status-metric-item" title="Bullet ratio (lower is better)">
                •{Math.round(metrics.bulletRatio * 100)}%
              </span>
              <span className={`page-status-metric-item page-status-score ${metrics.structuralScore >= 10 ? 'page-status-score--high' : metrics.structuralScore >= 6 ? 'page-status-score--medium' : 'page-status-score--low'}`} title={`Structural score: ${metrics.structuralScore}/15`}>
                Score: {metrics.structuralScore}/15
              </span>
            </div>
          </div>
        )}

        {llmSummary && (
          <div className="page-status-row page-status-row--full">
            <span className="page-status-label">LLM Summary:</span>
            <span className="page-status-summary">{llmSummary}</span>
          </div>
        )}

        {todo && (
          <div className="page-status-row page-status-row--todo">
            <span className="page-status-label">Todo:</span>
            <span className="page-status-todo">{todo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PageStatus;
