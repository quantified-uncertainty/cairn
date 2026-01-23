// Accident Risks Comparison Table
// Analyzes AI accident risks with explicit overlap handling and relationship tracking

import { useState, useMemo } from 'react';
import {
  accidentRisks,
  riskCategories,
  abstractionLevelDescriptions,
  type AccidentRisk,
  type AbstractionLevel,
  type RiskRelationship,
} from '../data/accident-risks-data';
import { TableInsightsSummary } from './tables/shared/TableInsightsSummary';

type ViewMode = 'unified' | 'grouped';
type SortColumn = 'name' | 'category' | 'level' | 'evidence' | 'timeline' | 'severity' | 'detectability';
type SortDirection = 'asc' | 'desc';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .ar-page { min-height: 100vh; display: flex; flex-direction: column; }
  .ar-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .ar-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .ar-header a:hover { color: #374151; }
  .ar-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .ar-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .ar-intro {
    margin-bottom: 16px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 1000px;
  }
  .ar-key-insight {
    background: #fee2e2;
    border: 1px solid #f87171;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    max-width: 1000px;
  }
  .ar-key-insight strong {
    color: #991b1b;
  }
  .ar-overlap-note {
    background: #dbeafe;
    border: 1px solid #60a5fa;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    max-width: 1000px;
  }
  .ar-overlap-note strong {
    color: #1e40af;
  }
  .ar-category-section {
    margin-bottom: 32px;
  }
  .ar-category-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
  }
  .ar-category-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .ar-category-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
  .ar-table-wrapper {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }
  .ar-table {
    border-collapse: collapse;
    font-size: 11px;
    min-width: 1800px;
    width: 100%;
  }
  .ar-table th {
    text-align: left;
    padding: 8px 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
    font-size: 11px;
    white-space: nowrap;
    border-bottom: 2px solid #d1d5db;
  }
  .ar-table th.sticky-col {
    position: sticky;
    left: 0;
    z-index: 20;
    background: linear-gradient(to right, #fee2e2, #fef2f2);
    color: #991b1b;
    font-size: 12px;
    font-weight: 700;
    border-right: 2px solid #fca5a5;
    min-width: 200px;
  }
  .ar-table th.level-col {
    background: #e0e7ff;
    color: #3730a3;
  }
  .ar-table th.evidence-col {
    background: #dcfce7;
    color: #166534;
  }
  .ar-table th.assessment-col {
    background: #fef3c7;
    color: #92400e;
  }
  .ar-table th.relations-col {
    background: #f3e8ff;
    color: #6b21a8;
  }
  .ar-table td {
    padding: 10px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .ar-table td.sticky-col {
    position: sticky;
    left: 0;
    background: #fff5f5;
    z-index: 5;
    border-right: 2px solid #fecaca;
  }
  .ar-table tr:hover td {
    background: #f9fafb;
  }
  .ar-table tr:hover td.sticky-col {
    background: #fef2f2;
  }
  .ar-risk-name {
    font-weight: 600;
    color: #111827;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .ar-risk-name a {
    color: #1d4ed8;
    text-decoration: none;
  }
  .ar-risk-name a:hover {
    text-decoration: underline;
  }
  .ar-risk-desc {
    color: #6b7280;
    font-size: 10px;
    line-height: 1.4;
    max-width: 200px;
  }
  .ar-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
    white-space: nowrap;
  }
  /* Abstraction Level */
  .ar-badge.theoretical { background: #ddd6fe; color: #5b21b6; }
  .ar-badge.mechanism { background: #a5f3fc; color: #155e75; }
  .ar-badge.behavior { background: #fde68a; color: #92400e; }
  .ar-badge.outcome { background: #fecaca; color: #991b1b; }
  /* Evidence Level */
  .ar-badge.theoretical-ev { background: #e5e7eb; color: #374151; }
  .ar-badge.speculative { background: #f3f4f6; color: #6b7280; }
  .ar-badge.demonstrated-lab { background: #bbf7d0; color: #166534; }
  .ar-badge.observed-current { background: #22c55e; color: white; }
  /* Timeline */
  .ar-badge.current { background: #ef4444; color: white; }
  .ar-badge.near-term { background: #fb923c; color: #7c2d12; }
  .ar-badge.medium-term { background: #fef08a; color: #713f12; }
  .ar-badge.long-term { background: #e0e7ff; color: #3730a3; }
  .ar-badge.uncertain { background: #d1d5db; color: #374151; }
  /* Severity */
  .ar-badge.low-sev { background: #86efac; color: #14532d; }
  .ar-badge.medium-sev { background: #fef08a; color: #713f12; }
  .ar-badge.high-sev { background: #fb923c; color: #7c2d12; }
  .ar-badge.catastrophic { background: #dc2626; color: white; }
  .ar-badge.existential { background: #7f1d1d; color: white; font-weight: 700; }
  /* Detectability */
  .ar-badge.easy { background: #22c55e; color: white; }
  .ar-badge.moderate-det { background: #fef08a; color: #713f12; }
  .ar-badge.difficult { background: #fb923c; color: #7c2d12; }
  .ar-badge.very-difficult { background: #dc2626; color: white; }
  .ar-badge.unknown-det { background: #d1d5db; color: #374151; }
  /* Relationship types */
  .ar-badge.requires { background: #fee2e2; color: #991b1b; }
  .ar-badge.enables { background: #dcfce7; color: #166534; }
  .ar-badge.overlaps { background: #fef3c7; color: #92400e; }
  .ar-badge.manifestation-of { background: #dbeafe; color: #1e40af; }
  .ar-badge.special-case-of { background: #f3e8ff; color: #6b21a8; }
  .ar-cell-note {
    font-size: 9px;
    color: #9ca3af;
    margin-top: 3px;
    line-height: 1.3;
    max-width: 140px;
  }
  .ar-relations {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ar-relation {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    font-size: 9px;
  }
  .ar-relation-risk {
    color: #1d4ed8;
    cursor: pointer;
  }
  .ar-relation-risk:hover {
    text-decoration: underline;
  }
  .ar-relation-note {
    color: #9ca3af;
    font-size: 8px;
    margin-left: 16px;
  }
  .ar-key-question {
    font-size: 10px;
    color: #4b5563;
    font-style: italic;
    max-width: 180px;
  }
  .ar-overlap-cell {
    font-size: 9px;
    color: #6b7280;
    line-height: 1.3;
    max-width: 180px;
    background: #f3f4f6;
    padding: 4px 6px;
    border-radius: 4px;
  }
  .ar-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 24px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    max-width: 1400px;
  }
  .ar-legend-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .ar-legend-title {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  .ar-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: #6b7280;
  }
  .ar-view-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .ar-view-btn {
    padding: 6px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    font-size: 12px;
    cursor: pointer;
    color: #374151;
  }
  .ar-view-btn:hover {
    background: #f9fafb;
  }
  .ar-view-btn.active {
    background: #1d4ed8;
    color: white;
    border-color: #1d4ed8;
  }
  .ar-table th.sortable {
    cursor: pointer;
    user-select: none;
  }
  .ar-table th.sortable:hover {
    background: #e5e7eb;
  }
  .ar-sort-indicator {
    margin-left: 4px;
    font-size: 10px;
  }
  .ar-category-cell {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ar-category-dot-small {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .ar-category-label {
    font-size: 10px;
    color: #374151;
  }
`;

const categoryColors: Record<string, string> = {
  'Theoretical Frameworks': '#7c3aed',
  'Alignment Failures': '#dc2626',
  'Specification Problems': '#f59e0b',
  'Deceptive Behaviors': '#991b1b',
  'Instrumental Behaviors': '#ea580c',
  'Capability Concerns': '#0891b2',
  'Catastrophic Scenarios': '#7f1d1d',
  'Human-AI Interaction': '#4f46e5',
};

function getAbstractionBadgeClass(level: AbstractionLevel): string {
  switch (level) {
    case 'THEORETICAL':
      return 'theoretical';
    case 'MECHANISM':
      return 'mechanism';
    case 'BEHAVIOR':
      return 'behavior';
    case 'OUTCOME':
      return 'outcome';
    default:
      return '';
  }
}

function getEvidenceBadgeClass(level: string): string {
  switch (level) {
    case 'THEORETICAL':
      return 'theoretical-ev';
    case 'SPECULATIVE':
      return 'speculative';
    case 'DEMONSTRATED_LAB':
      return 'demonstrated-lab';
    case 'OBSERVED_CURRENT':
      return 'observed-current';
    default:
      return '';
  }
}

function getTimelineBadgeClass(level: string): string {
  switch (level) {
    case 'CURRENT':
      return 'current';
    case 'NEAR_TERM':
      return 'near-term';
    case 'MEDIUM_TERM':
      return 'medium-term';
    case 'LONG_TERM':
      return 'long-term';
    case 'UNCERTAIN':
      return 'uncertain';
    default:
      return '';
  }
}

function getSeverityBadgeClass(level: string): string {
  switch (level) {
    case 'LOW':
      return 'low-sev';
    case 'MEDIUM':
      return 'medium-sev';
    case 'HIGH':
      return 'high-sev';
    case 'CATASTROPHIC':
      return 'catastrophic';
    case 'EXISTENTIAL':
      return 'existential';
    default:
      return '';
  }
}

function getDetectabilityBadgeClass(level: string): string {
  switch (level) {
    case 'EASY':
      return 'easy';
    case 'MODERATE':
      return 'moderate-det';
    case 'DIFFICULT':
      return 'difficult';
    case 'VERY_DIFFICULT':
      return 'very-difficult';
    case 'UNKNOWN':
      return 'unknown-det';
    default:
      return '';
  }
}

function getRelationBadgeClass(type: string): string {
  return type.toLowerCase().replace('_', '-');
}

// Sorting helpers
const LEVEL_ORDER: Record<string, number> = {
  // Abstraction Level
  'THEORETICAL': 1, 'MECHANISM': 2, 'BEHAVIOR': 3, 'OUTCOME': 4,
  // Evidence Level
  'SPECULATIVE': 1, 'THEORETICAL': 1, 'DEMONSTRATED_LAB': 3, 'OBSERVED_CURRENT': 4,
  // Timeline
  'LONG_TERM': 1, 'MEDIUM_TERM': 2, 'NEAR_TERM': 3, 'CURRENT': 4, 'UNCERTAIN': 0,
  // Severity
  'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CATASTROPHIC': 4, 'EXISTENTIAL': 5,
  // Detectability (reversed - easy is better)
  'EASY': 4, 'MODERATE': 3, 'DIFFICULT': 2, 'VERY_DIFFICULT': 1, 'UNKNOWN': 0,
};

function getLevelValue(level: string): number {
  if (LEVEL_ORDER[level] !== undefined) return LEVEL_ORDER[level];
  return 0;
}

function getCategoryOrder(category: string): number {
  const index = riskCategories.indexOf(category);
  return index >= 0 ? index : 999;
}

function getCategoryColor(category: string): string {
  return categoryColors[category] || '#6b7280';
}

function sortRisks(risks: AccidentRisk[], column: SortColumn, direction: SortDirection): AccidentRisk[] {
  const sorted = [...risks].sort((a, b) => {
    let comparison = 0;

    switch (column) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'category':
        comparison = getCategoryOrder(a.category) - getCategoryOrder(b.category);
        break;
      case 'level':
        comparison = getLevelValue(a.abstractionLevel) - getLevelValue(b.abstractionLevel);
        break;
      case 'evidence':
        comparison = getLevelValue(a.evidenceLevel) - getLevelValue(b.evidenceLevel);
        break;
      case 'timeline':
        comparison = getLevelValue(a.timeline) - getLevelValue(b.timeline);
        break;
      case 'severity':
        comparison = getLevelValue(a.severity) - getLevelValue(b.severity);
        break;
      case 'detectability':
        comparison = getLevelValue(a.detectability) - getLevelValue(b.detectability);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

function formatLevel(level: string): string {
  return level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function Badge({ level, className }: { level: string; className: string }) {
  return <span className={`ar-badge ${className}`}>{formatLevel(level)}</span>;
}

function RelationsCell({ relations, scrollToRisk }: { relations: RiskRelationship[], scrollToRisk: (id: string) => void }) {
  if (relations.length === 0) return <span style={{ color: '#9ca3af', fontSize: '10px' }}>None</span>;

  return (
    <div className="ar-relations">
      {relations.slice(0, 4).map((rel, i) => (
        <div key={i} className="ar-relation">
          <Badge level={rel.type} className={getRelationBadgeClass(rel.type)} />
          <span className="ar-relation-risk" onClick={() => scrollToRisk(rel.riskId)}>
            {rel.riskId}
          </span>
        </div>
      ))}
      {relations.length > 4 && (
        <div style={{ fontSize: '9px', color: '#9ca3af' }}>+{relations.length - 4} more</div>
      )}
    </div>
  );
}

function RiskRow({ risk, scrollToRisk }: { risk: AccidentRisk; scrollToRisk: (id: string) => void }) {
  const riskUrl = risk.pageSlug
    ? `/knowledge-base/risks/accident/${risk.pageSlug}/`
    : null;

  return (
    <tr id={`risk-${risk.id}`}>
      <td className="sticky-col" title={risk.shortDescription}>
        <div className="ar-risk-name">
          {riskUrl ? (
            <a href={riskUrl}>{risk.name}</a>
          ) : (
            risk.name
          )}
        </div>
      </td>
      <td title={abstractionLevelDescriptions[risk.abstractionLevel]}>
        <Badge level={risk.abstractionLevel} className={getAbstractionBadgeClass(risk.abstractionLevel)} />
      </td>
      <td title={risk.evidenceNote}>
        <Badge level={risk.evidenceLevel} className={getEvidenceBadgeClass(risk.evidenceLevel)} />
      </td>
      <td title={risk.timelineNote}>
        <Badge level={risk.timeline} className={getTimelineBadgeClass(risk.timeline)} />
      </td>
      <td title={risk.severityNote}>
        <Badge level={risk.severity} className={getSeverityBadgeClass(risk.severity)} />
      </td>
      <td title={risk.detectabilityNote}>
        <Badge level={risk.detectability} className={getDetectabilityBadgeClass(risk.detectability)} />
      </td>
      <td>
        <RelationsCell relations={risk.relatedRisks} scrollToRisk={scrollToRisk} />
      </td>
      <td title={risk.overlapNote || undefined}>
        {risk.overlapNote && <span style={{ fontSize: '9px', color: '#6b7280' }}>ℹ</span>}
      </td>
      <td title={risk.keyQuestion}>
        <span style={{ fontSize: '9px', color: '#6b7280' }}>?</span>
      </td>
    </tr>
  );
}

function SortableHeader({
  column,
  currentSort,
  direction,
  onSort,
  children,
  className = '',
  style
}: {
  column: SortColumn;
  currentSort: SortColumn;
  direction: SortDirection;
  onSort: (col: SortColumn) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={`${className} sortable`}
      style={style}
      onClick={() => onSort(column)}
    >
      {children}
      <span className="ar-sort-indicator">
        {isActive ? (direction === 'asc' ? '▲' : '▼') : ''}
      </span>
    </th>
  );
}

function UnifiedRiskRow({ risk, scrollToRisk }: { risk: AccidentRisk; scrollToRisk: (id: string) => void }) {
  const riskUrl = risk.pageSlug
    ? `/knowledge-base/risks/accident/${risk.pageSlug}/`
    : null;
  const categoryColor = getCategoryColor(risk.category);

  return (
    <tr id={`risk-${risk.id}`}>
      <td className="sticky-col" title={risk.shortDescription}>
        <div className="ar-risk-name">
          {riskUrl ? (
            <a href={riskUrl}>{risk.name}</a>
          ) : (
            risk.name
          )}
        </div>
      </td>
      <td>
        <div className="ar-category-cell">
          <div className="ar-category-dot-small" style={{ background: categoryColor }} />
          <span className="ar-category-label">{risk.category}</span>
        </div>
      </td>
      <td title={abstractionLevelDescriptions[risk.abstractionLevel]}>
        <Badge level={risk.abstractionLevel} className={getAbstractionBadgeClass(risk.abstractionLevel)} />
      </td>
      <td title={risk.evidenceNote}>
        <Badge level={risk.evidenceLevel} className={getEvidenceBadgeClass(risk.evidenceLevel)} />
      </td>
      <td title={risk.timelineNote}>
        <Badge level={risk.timeline} className={getTimelineBadgeClass(risk.timeline)} />
      </td>
      <td title={risk.severityNote}>
        <Badge level={risk.severity} className={getSeverityBadgeClass(risk.severity)} />
      </td>
      <td title={risk.detectabilityNote}>
        <Badge level={risk.detectability} className={getDetectabilityBadgeClass(risk.detectability)} />
      </td>
      <td>
        <RelationsCell relations={risk.relatedRisks} scrollToRisk={scrollToRisk} />
      </td>
      <td title={risk.overlapNote || undefined}>
        {risk.overlapNote && <span style={{ fontSize: '9px', color: '#6b7280' }}>ℹ</span>}
      </td>
      <td title={risk.keyQuestion}>
        <span style={{ fontSize: '9px', color: '#6b7280' }}>?</span>
      </td>
    </tr>
  );
}

export default function AccidentRisksTableView() {
  const [viewMode, setViewMode] = useState<ViewMode>('unified');
  const [sortColumn, setSortColumn] = useState<SortColumn>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedRisks = useMemo(() => {
    return sortRisks(accidentRisks, sortColumn, sortDirection);
  }, [sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const scrollToRisk = (riskId: string) => {
    const element = document.getElementById(`risk-${riskId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.background = '#fef3c7';
      setTimeout(() => {
        element.style.background = '';
      }, 2000);
    }
  };

  const groupedRisks = riskCategories.map((cat) => ({
    name: cat,
    color: categoryColors[cat] || '#6b7280',
    risks: accidentRisks.filter((r) => r.category === cat),
  }));

  return (
    <>
      <style>{styles}</style>
      <div className="ar-page">
        <div className="ar-header">
          <a href="/knowledge-base/risks/accident/">← Accident Risks</a>
          <span style={{ color: '#9ca3af' }}>|</span>
          <a href="/tables/">All Tables</a>
          <h1>AI Accident Risks: Overlap Analysis</h1>
        </div>
        <div className="ar-content">
          <p className="ar-intro">
            Comparative analysis of AI accident risks with explicit handling of overlaps and relationships.
            Many risks are closely related—scheming is the behavioral expression of deceptive alignment,
            which requires mesa-optimization as a precondition.
          </p>

          <div className="ar-key-insight">
            <strong>Key insight:</strong> Risks exist at different levels of abstraction. <em>Theoretical frameworks</em> (mesa-optimization, instrumental convergence) describe why problems occur. <em>Mechanisms</em> (deceptive alignment, goal misgeneralization) describe how failures happen. <em>Behaviors</em> (scheming, power-seeking) are what we observe. <em>Outcomes</em> (treacherous turn, sharp left turn) are the resulting scenarios.
          </div>

          <div className="ar-overlap-note">
            <strong>Handling overlaps:</strong> Each risk shows its <em>related risks</em> with relationship types:
            <strong> requires</strong> (needs the other as precondition),
            <strong> enables</strong> (can lead to),
            <strong> overlaps</strong> (conceptual similarity),
            <strong> manifestation-of</strong> (behavioral expression of),
            <strong> special-case-of</strong> (specific instance).
          </div>

          {/* Related insights - dev mode only */}
          <div className="max-w-4xl my-4">
            <TableInsightsSummary
              tableId="accident-risks"
              tags={["accident-risks", "deception", "mesa-optimization", "scheming", "alignment"]}
              maxItems={3}
            />
          </div>

          <div className="ar-view-toggle">
            <button
              className={`ar-view-btn ${viewMode === 'unified' ? 'active' : ''}`}
              onClick={() => setViewMode('unified')}
            >
              Unified Table
            </button>
            <button
              className={`ar-view-btn ${viewMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setViewMode('grouped')}
            >
              Grouped by Category
            </button>
          </div>

          <div className="ar-legend">
            <div className="ar-legend-group">
              <div className="ar-legend-title">Abstraction Level</div>
              <div className="ar-legend-item"><Badge level="THEORETICAL" className="theoretical" /> Foundational concepts</div>
              <div className="ar-legend-item"><Badge level="MECHANISM" className="mechanism" /> How failures occur</div>
              <div className="ar-legend-item"><Badge level="BEHAVIOR" className="behavior" /> Observable actions</div>
              <div className="ar-legend-item"><Badge level="OUTCOME" className="outcome" /> Resulting scenarios</div>
            </div>
            <div className="ar-legend-group">
              <div className="ar-legend-title">Evidence</div>
              <div className="ar-legend-item"><Badge level="OBSERVED_CURRENT" className="observed-current" /> In current systems</div>
              <div className="ar-legend-item"><Badge level="DEMONSTRATED_LAB" className="demonstrated-lab" /> Lab experiments</div>
              <div className="ar-legend-item"><Badge level="THEORETICAL" className="theoretical-ev" /> First principles</div>
              <div className="ar-legend-item"><Badge level="SPECULATIVE" className="speculative" /> Hypothesized</div>
            </div>
            <div className="ar-legend-group">
              <div className="ar-legend-title">Timeline</div>
              <div className="ar-legend-item"><Badge level="CURRENT" className="current" /> Now</div>
              <div className="ar-legend-item"><Badge level="NEAR_TERM" className="near-term" /> 1-3 years</div>
              <div className="ar-legend-item"><Badge level="MEDIUM_TERM" className="medium-term" /> 3-10 years</div>
              <div className="ar-legend-item"><Badge level="LONG_TERM" className="long-term" /> 10+ years</div>
            </div>
            <div className="ar-legend-group">
              <div className="ar-legend-title">Severity</div>
              <div className="ar-legend-item"><Badge level="EXISTENTIAL" className="existential" /> Extinction risk</div>
              <div className="ar-legend-item"><Badge level="CATASTROPHIC" className="catastrophic" /> Civilizational</div>
              <div className="ar-legend-item"><Badge level="HIGH" className="high-sev" /> Significant harm</div>
              <div className="ar-legend-item"><Badge level="MEDIUM" className="medium-sev" /> Real harm</div>
              <div className="ar-legend-item"><Badge level="LOW" className="low-sev" /> Minor harm</div>
            </div>
            <div className="ar-legend-group">
              <div className="ar-legend-title">Detectability</div>
              <div className="ar-legend-item"><Badge level="EASY" className="easy" /> Obvious</div>
              <div className="ar-legend-item"><Badge level="MODERATE" className="moderate-det" /> With effort</div>
              <div className="ar-legend-item"><Badge level="DIFFICULT" className="difficult" /> Sophisticated</div>
              <div className="ar-legend-item"><Badge level="VERY_DIFFICULT" className="very-difficult" /> May be impossible</div>
            </div>
            <div className="ar-legend-group">
              <div className="ar-legend-title">Relationships</div>
              <div className="ar-legend-item"><Badge level="requires" className="requires" /> Needs as precondition</div>
              <div className="ar-legend-item"><Badge level="enables" className="enables" /> Can lead to</div>
              <div className="ar-legend-item"><Badge level="overlaps" className="overlaps" /> Conceptual similarity</div>
              <div className="ar-legend-item"><Badge level="manifestation-of" className="manifestation-of" /> Behavioral expression</div>
            </div>
          </div>

          {viewMode === 'unified' ? (
            <div className="ar-table-wrapper">
              <table className="ar-table">
                <thead>
                  <tr>
                    <SortableHeader column="name" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="sticky-col">
                      Risk
                    </SortableHeader>
                    <SortableHeader column="category" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="level-col">
                      Category
                    </SortableHeader>
                    <SortableHeader column="level" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="level-col">
                      Level
                    </SortableHeader>
                    <SortableHeader column="evidence" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="evidence-col">
                      Evidence
                    </SortableHeader>
                    <SortableHeader column="timeline" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="assessment-col">
                      Timeline
                    </SortableHeader>
                    <SortableHeader column="severity" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="assessment-col">
                      Severity
                    </SortableHeader>
                    <SortableHeader column="detectability" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="assessment-col">
                      Detectability
                    </SortableHeader>
                    <th className="relations-col">Related Risks</th>
                    <th className="relations-col">Overlap Notes</th>
                    <th>Key Question</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRisks.map((risk) => (
                    <UnifiedRiskRow key={risk.id} risk={risk} scrollToRisk={scrollToRisk} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            groupedRisks.map((group) => {
              if (group.risks.length === 0) return null;

              return (
                <div key={group.name} className="ar-category-section">
                  <div className="ar-category-header">
                    <div className="ar-category-dot" style={{ background: group.color }} />
                    <div className="ar-category-name">{group.name}</div>
                  </div>

                  <div className="ar-table-wrapper">
                    <table className="ar-table">
                      <thead>
                        <tr>
                          <th className="sticky-col">Risk</th>
                          <th className="level-col">Level</th>
                          <th className="evidence-col">Evidence</th>
                          <th className="assessment-col">Timeline</th>
                          <th className="assessment-col">Severity</th>
                          <th className="assessment-col">Detectability</th>
                          <th className="relations-col">Related Risks</th>
                          <th className="relations-col">Overlap Notes</th>
                          <th>Key Question</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.risks.map((risk) => (
                          <RiskRow key={risk.id} risk={risk} scrollToRisk={scrollToRisk} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
