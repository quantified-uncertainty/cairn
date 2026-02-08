import {
  detectPageType,
  PAGE_TYPE_INFO,
} from "@/lib/page-types";

// ============================================================================
// TYPES
// ============================================================================

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
    similarPages: Array<{
      id: string;
      title: string;
      path: string;
      similarity: number;
    }>;
  };
}

export interface PageStatusProps {
  quality?: number;
  importance?: number;
  llmSummary?: string;
  lastEdited?: string;
  todo?: string;
  todos?: string[];
  wordCount?: number;
  backlinkCount?: number;
  metrics?: PageMetrics;
  suggestedQuality?: number;
  issues?: PageIssues;
  pageType?: string;
  pathname?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const qualityLabels: Record<string, string> = {
  comprehensive: "Comprehensive",
  good: "Good",
  adequate: "Adequate",
  draft: "Draft",
  stub: "Stub",
};

const importanceLabels: Record<string, string> = {
  essential: "Essential",
  high: "High",
  useful: "Useful",
  reference: "Reference",
  peripheral: "Peripheral",
};

function getQualityLevel(quality: number): string {
  if (quality >= 80) return "comprehensive";
  if (quality >= 60) return "good";
  if (quality >= 40) return "adequate";
  if (quality >= 20) return "draft";
  return "stub";
}

function getImportanceLevel(importance: number): string {
  if (importance >= 90) return "essential";
  if (importance >= 70) return "high";
  if (importance >= 50) return "useful";
  if (importance >= 30) return "reference";
  return "peripheral";
}

function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function formatAge(lastEdited: string): string {
  const today = new Date();
  const edited = new Date(lastEdited);
  const days = Math.floor(
    (today.getTime() - edited.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days <= 14) return `${days} days ago`;
  if (days <= 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

// ============================================================================
// SVG ICONS (inline, no emoji)
// ============================================================================

function IconTable({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <line x1="2" y1="6" x2="14" y2="6" />
      <line x1="6" y1="6" x2="6" y2="14" />
    </svg>
  );
}

function IconDiagram({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="2,12 6,6 10,9 14,3" />
      <polyline points="11,3 14,3 14,6" />
    </svg>
  );
}

function IconLink({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6.5 9.5l3-3M9 5l1.5-1.5a2.12 2.12 0 013 3L12 8M7 11l-1.5 1.5a2.12 2.12 0 01-3-3L4 8" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h4.5a2 2 0 012 2v8.5a1.5 1.5 0 00-1.5-1.5H2V3zM14 3H9.5a2 2 0 00-2 2v8.5a1.5 1.5 0 011.5-1.5H14V3z" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5l6.5 12H1.5L8 1.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="6.5" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="7" x2="8" y2="11" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3.5 8 6.5 11 12.5 5" />
    </svg>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ScoreRing({
  value,
  max,
  size = 40,
  strokeWidth = 3,
  color,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <div className="ps2-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span className="ps2-ring-label">{children}</span>
    </div>
  );
}

function PageTypeBadge({
  pageType,
  pathname,
}: {
  pageType?: string;
  pathname?: string;
}) {
  const detectedType = detectPageType(pathname || "", pageType);
  const info = PAGE_TYPE_INFO[detectedType];

  return (
    <span className={`ps2-type-badge ${info.color}`}>
      {info.label}
    </span>
  );
}

function QualityDisplay({ quality, suggestedQuality }: { quality: number; suggestedQuality?: number }) {
  const level = getQualityLevel(quality);
  const colorMap: Record<string, string> = {
    comprehensive: "#10b981",
    good: "#3b82f6",
    adequate: "#f59e0b",
    draft: "#ef4444",
    stub: "#94a3b8",
  };
  const hasDiscrepancy =
    suggestedQuality !== undefined && Math.abs(quality - suggestedQuality) >= 20;

  return (
    <div className="ps2-score-block">
      <ScoreRing value={quality} max={100} color={colorMap[level]} size={44} strokeWidth={3.5}>
        <span className="ps2-ring-number">{quality}</span>
      </ScoreRing>
      <div className="ps2-score-detail">
        <span className="ps2-score-title">Quality</span>
        <span className={`ps2-score-level ps2-quality--${level}`}>
          {qualityLabels[level]}
          {hasDiscrepancy && (
            <span
              className="ps2-discrepancy-dot"
              title={`Structure suggests ${suggestedQuality}`}
            />
          )}
        </span>
      </div>
    </div>
  );
}

function ImportanceDisplay({ importance }: { importance: number }) {
  const level = getImportanceLevel(importance);
  const colorMap: Record<string, string> = {
    essential: "#a855f7",
    high: "#8b5cf6",
    useful: "#6366f1",
    reference: "#94a3b8",
    peripheral: "#94a3b8",
  };

  return (
    <div className="ps2-score-block">
      <ScoreRing value={importance} max={100} color={colorMap[level]} size={44} strokeWidth={3.5}>
        <span className="ps2-ring-number">{importance}</span>
      </ScoreRing>
      <div className="ps2-score-detail">
        <span className="ps2-score-title">Importance</span>
        <span className={`ps2-score-level ps2-importance--${level}`}>
          {importanceLabels[level]}
        </span>
      </div>
    </div>
  );
}

function StructureDisplay({ metrics }: { metrics: PageMetrics }) {
  const scoreLevel =
    metrics.structuralScore >= 10
      ? "high"
      : metrics.structuralScore >= 6
        ? "medium"
        : "low";
  const scoreColor =
    scoreLevel === "high"
      ? "#10b981"
      : scoreLevel === "medium"
        ? "#f59e0b"
        : "#ef4444";

  return (
    <div className="ps2-score-block">
      <ScoreRing
        value={metrics.structuralScore}
        max={15}
        color={scoreColor}
        size={44}
        strokeWidth={3.5}
      >
        <span className="ps2-ring-number" style={{ fontSize: "0.7rem" }}>
          {metrics.structuralScore}
        </span>
      </ScoreRing>
      <div className="ps2-score-detail">
        <span className="ps2-score-title">Structure</span>
        <span className={`ps2-score-level ps2-struct--${scoreLevel}`}>
          {metrics.structuralScore}/15
        </span>
      </div>
    </div>
  );
}

function MetricChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <span className="ps2-chip" title={label}>
      <span className="ps2-chip-icon">{icon}</span>
      <span className="ps2-chip-value">{value}</span>
    </span>
  );
}

interface Issue {
  type: "warning" | "info";
  label: string;
  message: string;
}

function IssuesSection({
  issues,
  metrics,
  quality,
  suggestedQuality,
  lastEdited,
}: {
  issues?: PageIssues;
  metrics?: PageMetrics;
  quality?: number;
  suggestedQuality?: number;
  lastEdited?: string;
}) {
  const detectedIssues: Issue[] = [];

  if (quality !== undefined && suggestedQuality !== undefined) {
    const diff = quality - suggestedQuality;
    if (Math.abs(diff) >= 20) {
      detectedIssues.push({
        type: "warning",
        label: "Quality",
        message:
          diff > 0
            ? `Rated ${quality} but structure suggests ${suggestedQuality} (overrated by ${diff} points)`
            : `Rated ${quality} but structure suggests ${suggestedQuality} (underrated by ${Math.abs(diff)} points)`,
      });
    }
  }

  if (issues?.unconvertedLinkCount && issues.unconvertedLinkCount > 0) {
    detectedIssues.push({
      type: "info",
      label: "Links",
      message: `${issues.unconvertedLinkCount} link${issues.unconvertedLinkCount > 1 ? "s" : ""} could use <R> components`,
    });
  }

  if (issues?.redundancy && issues.redundancy.maxSimilarity >= 40) {
    const topSimilar = issues.redundancy.similarPages[0];
    detectedIssues.push({
      type: "warning",
      label: "Redundancy",
      message: `${issues.redundancy.maxSimilarity}% similar to "${topSimilar?.title}"`,
    });
  }

  if (lastEdited) {
    const days = Math.floor(
      (Date.now() - new Date(lastEdited).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days > 60) {
      detectedIssues.push({
        type: "info",
        label: "Stale",
        message: `Last edited ${days} days ago - may need review`,
      });
    }
  }

  if (metrics) {
    if (metrics.tableCount === 0 && metrics.diagramCount === 0) {
      detectedIssues.push({
        type: "info",
        label: "Structure",
        message: "No tables or diagrams - consider adding visual content",
      });
    }
  }

  if (detectedIssues.length === 0) return null;

  return (
    <div className="ps2-issues">
      <div className="ps2-issues-header">
        Issues
        <span className="ps2-issues-count">{detectedIssues.length}</span>
      </div>
      <div className="ps2-issues-list">
        {detectedIssues.map((issue, i) => (
          <div
            key={i}
            className={`ps2-issue ps2-issue--${issue.type}`}
          >
            <span className="ps2-issue-icon">
              {issue.type === "warning" ? (
                <IconAlert />
              ) : (
                <IconInfo />
              )}
            </span>
            <span className="ps2-issue-label">{issue.label}</span>
            <span className="ps2-issue-msg">{issue.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PageStatus({
  quality,
  importance,
  llmSummary,
  lastEdited,
  todo,
  todos,
  wordCount,
  backlinkCount,
  metrics,
  suggestedQuality,
  issues,
  pageType,
  pathname,
}: PageStatusProps) {
  const detectedType = detectPageType(pathname || "", pageType);
  const isATMPage = detectedType === "ai-transition-model";

  const hasEditorialContent =
    quality ||
    importance ||
    llmSummary ||
    lastEdited ||
    todo ||
    (todos && todos.length > 0);
  if (!hasEditorialContent && !isATMPage) {
    return null;
  }

  return (
    <div className="page-status page-status-dev-only">
      {/* Top bar: title + page type + meta stats */}
      <div className="ps2-topbar">
        <div className="ps2-topbar-left">
          <span className="ps2-badge-title">Page Status</span>
          <PageTypeBadge pageType={pageType} pathname={pathname} />
        </div>
        <div className="ps2-topbar-right">
          {lastEdited && (
            <span className="ps2-meta">
              Edited {formatAge(lastEdited)}
            </span>
          )}
          {wordCount !== undefined && wordCount > 0 && (
            <span className="ps2-meta">{formatWordCount(wordCount)} words</span>
          )}
          {backlinkCount !== undefined && backlinkCount > 0 && (
            <span className="ps2-meta">{backlinkCount} backlinks</span>
          )}
        </div>
      </div>

      {/* Score rings row */}
      <div className="ps2-scores-row">
        <div className="ps2-scores-group">
          {quality !== undefined && (
            <QualityDisplay quality={quality} suggestedQuality={suggestedQuality} />
          )}
          {importance !== undefined && (
            <ImportanceDisplay importance={importance} />
          )}
          {metrics && (
            <StructureDisplay metrics={metrics} />
          )}
        </div>

        {/* Structure chips */}
        {metrics && (
          <div className="ps2-chips">
            <MetricChip icon={<IconTable />} value={metrics.tableCount} label="Tables" />
            <MetricChip icon={<IconDiagram />} value={metrics.diagramCount} label="Diagrams" />
            <MetricChip icon={<IconLink />} value={metrics.internalLinks} label="Internal links" />
            <MetricChip icon={<IconBook />} value={metrics.externalLinks} label="External citations" />
            <MetricChip
              icon={<span style={{ fontSize: "10px", fontWeight: 700 }}>%</span>}
              value={`${Math.round(metrics.bulletRatio * 100)}%`}
              label="Bullet ratio"
            />
          </div>
        )}
      </div>

      {/* LLM Summary */}
      {llmSummary && (
        <div className="ps2-summary">
          <span className="ps2-summary-label">Summary</span>
          <p className="ps2-summary-text">{llmSummary}</p>
        </div>
      )}

      {/* Issues */}
      <IssuesSection
        issues={issues}
        metrics={metrics}
        quality={quality}
        suggestedQuality={suggestedQuality}
        lastEdited={lastEdited}
      />

      {/* Single todo */}
      {todo && (
        <div className="ps2-todos">
          <div className="ps2-todos-header">
            Todo
            <span className="ps2-todos-count">1</span>
          </div>
          <div className="ps2-todo-item">
            <IconCheck className="ps2-todo-icon" />
            <span>{todo}</span>
          </div>
        </div>
      )}

      {/* Multiple todos */}
      {todos && todos.length > 0 && (
        <div className="ps2-todos">
          <div className="ps2-todos-header">
            TODOs
            <span className="ps2-todos-count">{todos.length}</span>
          </div>
          {todos.map((item, index) => (
            <div key={index} className="ps2-todo-item">
              <IconCheck className="ps2-todo-icon" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
