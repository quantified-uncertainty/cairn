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

import React, { useState } from 'react';
import type { Insight, InsightType } from '@/data/insights-data';

const typeLabels: Record<InsightType, string> = {
  'claim': 'Claim',
  'research-gap': 'Gap',
  'counterintuitive': 'Counterint.',
  'quantitative': 'Quant.',
  'disagreement': 'Debate',
  'neglected': 'Neglected',
};

const typeColors: Record<InsightType, string> = {
  'claim': 'bg-blue-500/20 text-blue-400',
  'research-gap': 'bg-purple-500/20 text-purple-400',
  'counterintuitive': 'bg-orange-500/20 text-orange-400',
  'quantitative': 'bg-cyan-500/20 text-cyan-400',
  'disagreement': 'bg-rose-500/20 text-rose-400',
  'neglected': 'bg-amber-500/20 text-amber-400',
};

function getRatingClass(value: number): string {
  if (value >= 4.0) return 'bg-emerald-500/20 text-emerald-400';
  if (value >= 3.0) return 'bg-amber-500/20 text-amber-400';
  return 'bg-slate-500/20 text-slate-400';
}

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

interface PageIssues {
  unconvertedLinkCount?: number;
  redundancy?: {
    maxSimilarity: number;
    similarPages: Array<{ id: string; title: string; path: string; similarity: number }>;
  };
}

// Page type definitions with style guide links
type ContentPageType = 'content' | 'risk' | 'response' | 'stub' | 'documentation' | 'ai-transition-model' | 'overview';

interface PageTypeInfo {
  label: string;
  description: string;
  styleGuideUrl?: string;
  color: string;
}

const PAGE_TYPE_INFO: Record<ContentPageType, PageTypeInfo> = {
  'content': {
    label: 'Content',
    description: 'Standard knowledge base article',
    styleGuideUrl: '/internal/models-style-guide/',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  'risk': {
    label: 'Risk',
    description: 'Risk analysis page',
    styleGuideUrl: '/internal/risk-style-guide/',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  'response': {
    label: 'Response',
    description: 'Intervention/response page',
    styleGuideUrl: '/internal/response-style-guide/',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  },
  'stub': {
    label: 'Stub',
    description: 'Minimal placeholder page',
    styleGuideUrl: '/internal/stub-style-guide/',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  },
  'documentation': {
    label: 'Documentation',
    description: 'Internal docs, style guides, examples',
    styleGuideUrl: '/internal/page-types/',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  'ai-transition-model': {
    label: 'AI Transition Model',
    description: 'Structured factor/scenario/parameter page',
    styleGuideUrl: '/internal/ai-transition-model-style-guide/',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  'overview': {
    label: 'Overview',
    description: 'Section navigation page',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
};

interface PageStatusProps {
  quality?: number;  // 0-100 scale
  importance?: number;  // 0-100 scale
  llmSummary?: string;
  lastEdited?: string;
  todo?: string;
  todos?: string[];
  wordCount?: number;
  backlinkCount?: number;
  metrics?: PageMetrics;
  suggestedQuality?: number;
  insights?: Insight[];
  issues?: PageIssues;
  /** Explicit page type from frontmatter */
  pageType?: string;
  /** URL path to detect page type from location */
  pathname?: string;
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

function detectPageType(explicitType?: string, pathname?: string): ContentPageType {
  // Explicit frontmatter type takes priority
  if (explicitType === 'stub') return 'stub';
  if (explicitType === 'documentation') return 'documentation';

  // Detect from pathname
  if (pathname) {
    // AI Transition Model pages
    if (pathname.includes('/ai-transition-model/')) {
      return 'ai-transition-model';
    }
    // Risk pages
    if (pathname.includes('/knowledge-base/risks/')) {
      return 'risk';
    }
    // Response pages
    if (pathname.includes('/knowledge-base/responses/')) {
      return 'response';
    }
  }

  // Default to content
  return explicitType as ContentPageType || 'content';
}

function PageTypeBadge({ pageType, pathname }: { pageType?: string; pathname?: string }) {
  const detectedType = detectPageType(pageType, pathname);
  const info = PAGE_TYPE_INFO[detectedType];

  return (
    <div className="page-status-row page-status-row--type">
      <span className="page-status-label">Page Type:</span>
      <span className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${info.color}`}>
        <span className="font-medium">{info.label}</span>
        {info.styleGuideUrl && (
          <a
            href={info.styleGuideUrl}
            className="text-xs opacity-70 hover:opacity-100 underline"
            title={`View ${info.label} style guide`}
          >
            Style Guide →
          </a>
        )}
      </span>
      <span className="text-xs text-slate-500 ml-2">{info.description}</span>
    </div>
  );
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

interface Issue {
  type: 'warning' | 'info';
  label: string;
  message: string;
}

function IssuesSection({
  issues,
  metrics,
  quality,
  suggestedQuality,
  lastEdited
}: {
  issues?: PageIssues;
  metrics?: PageMetrics;
  quality?: number;
  suggestedQuality?: number;
  lastEdited?: string;
}) {
  const detectedIssues: Issue[] = [];

  // Quality discrepancy
  if (quality !== undefined && suggestedQuality !== undefined) {
    const diff = quality - suggestedQuality;
    if (Math.abs(diff) >= 20) {
      detectedIssues.push({
        type: 'warning',
        label: 'Quality',
        message: diff > 0
          ? `Rated ${quality} but structure suggests ${suggestedQuality} (overrated by ${diff} points)`
          : `Rated ${quality} but structure suggests ${suggestedQuality} (underrated by ${Math.abs(diff)} points)`,
      });
    }
  }

  // Unconverted links
  if (issues?.unconvertedLinkCount && issues.unconvertedLinkCount > 0) {
    detectedIssues.push({
      type: 'info',
      label: 'Links',
      message: `${issues.unconvertedLinkCount} link${issues.unconvertedLinkCount > 1 ? 's' : ''} could use <R> components`,
    });
  }

  // High redundancy
  if (issues?.redundancy && issues.redundancy.maxSimilarity >= 40) {
    const topSimilar = issues.redundancy.similarPages[0];
    detectedIssues.push({
      type: 'warning',
      label: 'Redundancy',
      message: `${issues.redundancy.maxSimilarity}% similar to "${topSimilar?.title}"`,
    });
  }

  // Stale content (> 60 days)
  if (lastEdited) {
    const days = Math.floor((Date.now() - new Date(lastEdited).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 60) {
      detectedIssues.push({
        type: 'info',
        label: 'Stale',
        message: `Last edited ${days} days ago - may need review`,
      });
    }
  }

  // Missing structure
  if (metrics) {
    if (metrics.tableCount === 0 && metrics.diagramCount === 0) {
      detectedIssues.push({
        type: 'info',
        label: 'Structure',
        message: 'No tables or diagrams - consider adding visual content',
      });
    }
  }

  if (detectedIssues.length === 0) return null;

  return (
    <div className="page-status-row flex flex-col gap-1.5">
      <span className="page-status-label">Issues ({detectedIssues.length}):</span>
      <ul className="flex flex-col gap-1 w-full">
        {detectedIssues.map((issue, i) => (
          <li
            key={i}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${
              issue.type === 'warning'
                ? 'bg-amber-500/10 border-l-2 border-amber-500/50'
                : 'bg-slate-500/10 border-l-2 border-slate-500/30'
            }`}
          >
            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${
              issue.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
            }`}>
              {issue.label}
            </span>
            <span className="text-slate-300">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightsSection({ insights }: { insights: Insight[] }) {
  const [expanded, setExpanded] = useState(false);
  const MAX_COLLAPSED = 3;

  // Sort by composite score (descending)
  const sortedInsights = [...insights].sort((a, b) => (b.composite || 0) - (a.composite || 0));
  const displayedInsights = expanded ? sortedInsights : sortedInsights.slice(0, MAX_COLLAPSED);
  const hasMore = sortedInsights.length > MAX_COLLAPSED;

  return (
    <div className="page-status-row flex flex-col gap-2">
      <div className="flex justify-between items-center w-full">
        <span className="page-status-label">Critical Insights ({insights.length}):</span>
        {hasMore && (
          <button
            className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/10"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▲ Collapse' : `▼ Show all ${insights.length}`}
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2 w-full">
        {displayedInsights.map((insight) => (
          <li key={insight.id} className="flex items-start gap-2 p-2 bg-indigo-500/10 rounded border-l-2 border-indigo-500/40">
            <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${typeColors[insight.type]}`}>
              {typeLabels[insight.type]}
            </span>
            <span className="flex-1 text-xs leading-relaxed">{insight.insight}</span>
            <span className="flex gap-1 text-[10px] shrink-0">
              <span className={`px-1.5 py-0.5 rounded ${getRatingClass(insight.surprising)}`} title="Surprising">
                S:{insight.surprising.toFixed(1)}
              </span>
              <span className={`px-1.5 py-0.5 rounded ${getRatingClass(insight.important)}`} title="Important">
                I:{insight.important.toFixed(1)}
              </span>
              <span className={`px-1.5 py-0.5 rounded ${getRatingClass(insight.actionable)}`} title="Actionable">
                A:{insight.actionable.toFixed(1)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageStatus({ quality, importance, llmSummary, lastEdited, todo, todos, wordCount, backlinkCount, metrics, suggestedQuality, insights, issues, pageType, pathname, devOnly = false }: PageStatusProps) {
  // Don't render if no metadata provided
  if (!quality && !importance && !llmSummary && !lastEdited && !todo && (!todos || todos.length === 0)) {
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
        {/* Row 0: Page Type - shown prominently at top */}
        <PageTypeBadge pageType={pageType} pathname={pathname} />

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

        {insights && insights.length > 0 && (
          <InsightsSection insights={insights} />
        )}

        <IssuesSection
          issues={issues}
          metrics={metrics}
          quality={quality}
          suggestedQuality={suggestedQuality}
          lastEdited={lastEdited}
        />

        {todo && (
          <div className="page-status-row page-status-row--todo">
            <span className="page-status-label">Todo:</span>
            <span className="page-status-todo">{todo}</span>
          </div>
        )}

        {todos && todos.length > 0 && (
          <div className="page-status-row flex flex-col gap-1.5">
            <span className="page-status-label">TODOs ({todos.length}):</span>
            <ul className="flex flex-col gap-1 w-full">
              {todos.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 px-2 py-1 rounded text-xs bg-violet-500/10 border-l-2 border-violet-500/40"
                >
                  <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                    TODO
                  </span>
                  <span className="text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default PageStatus;
