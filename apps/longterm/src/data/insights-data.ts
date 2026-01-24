// Insights data loader
// Loads insights from multiple YAML files in the insights/ directory

import yaml from 'js-yaml';

// Import all insight files by type
import quantitativeYaml from './insights/quantitative.yaml?raw';
import claimYaml from './insights/claim.yaml?raw';
import counterintuitiveYaml from './insights/counterintuitive.yaml?raw';
import researchGapYaml from './insights/research-gap.yaml?raw';
import disagreementYaml from './insights/disagreement.yaml?raw';
import neglectedYaml from './insights/neglected.yaml?raw';

// Combine all insight files
const insightFiles = [
  quantitativeYaml,
  claimYaml,
  counterintuitiveYaml,
  researchGapYaml,
  disagreementYaml,
  neglectedYaml,
];

export type InsightType = 'claim' | 'research-gap' | 'counterintuitive' | 'quantitative' | 'disagreement' | 'neglected';

export type InsightStatus = 'current' | 'needs-review' | 'stale' | 'new';

export interface Insight {
  id: string;
  insight: string;
  source: string;
  tags: string[];
  type: InsightType;
  surprising: number;    // Would update an AI safety researcher's beliefs?
  important: number;     // Affects decisions or priorities?
  actionable: number;    // Suggests concrete work?
  neglected: number;     // Getting less attention than deserved?
  compact: number;       // How briefly can it be stated?
  added: string;         // When first added
  composite?: number;
  // New fields for tracking freshness
  lastVerified?: string; // When last checked against source
  tableRef?: string;     // Optional: specific table this references (e.g., "safety-approaches#rlhf")
  needsReview?: boolean; // Flagged for review
  status?: InsightStatus;
}

interface RawInsightsData {
  insights: Insight[];
}

// Compute insight status based on dates
function computeStatus(insight: Insight): InsightStatus {
  const now = new Date();
  const added = new Date(insight.added);
  const daysSinceAdded = Math.floor((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));

  // Explicit needs-review flag
  if (insight.needsReview) return 'needs-review';

  // New if added in last 14 days
  if (daysSinceAdded <= 14) return 'new';

  // Stale if no verification and older than 90 days
  if (!insight.lastVerified && daysSinceAdded > 90) return 'stale';

  // Check lastVerified date
  if (insight.lastVerified) {
    const verified = new Date(insight.lastVerified);
    const daysSinceVerified = Math.floor((now.getTime() - verified.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceVerified > 90) return 'needs-review';
  }

  return 'current';
}

function loadInsights(): Insight[] {
  // Load and merge insights from all files
  const allInsights: Insight[] = [];
  for (const fileContent of insightFiles) {
    const data = yaml.load(fileContent) as RawInsightsData;
    if (data?.insights) {
      allInsights.push(...data.insights);
    }
  }

  return allInsights.map(insight => {
    const processed = {
      ...insight,
      type: insight.type || 'claim',
      actionable: insight.actionable || 3.0,
      neglected: insight.neglected || 3.0,
      // Composite now weights surprising + important + actionable
      composite: Number(((insight.surprising + insight.important + (insight.actionable || 3.0)) / 3).toFixed(2))
    };
    return {
      ...processed,
      status: computeStatus(processed),
    };
  });
}

export const insights = loadInsights();

// Helper to get insights by source page
export function getInsightsBySource(sourcePath: string): Insight[] {
  return insights.filter(i => i.source === sourcePath);
}

// Helper to get insights by tag
export function getInsightsByTag(tag: string): Insight[] {
  return insights.filter(i => i.tags.includes(tag));
}

// Get all unique tags
export function getAllTags(): string[] {
  const tags = new Set<string>();
  insights.forEach(i => i.tags.forEach(t => tags.add(t)));
  return Array.from(tags).sort();
}

// Get all unique types
export function getAllTypes(): InsightType[] {
  const types = new Set<InsightType>();
  insights.forEach(i => types.add(i.type));
  return Array.from(types).sort();
}

// Get insights by type
export function getInsightsByType(type: InsightType): Insight[] {
  return insights.filter(i => i.type === type);
}

// Get insights by status
export function getInsightsByStatus(status: InsightStatus): Insight[] {
  return insights.filter(i => i.status === status);
}

// Get insights added in last N days
export function getRecentInsights(days: number = 14): Insight[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return insights.filter(i => new Date(i.added) >= cutoff);
}

// Get insights that reference a specific table
export function getInsightsByTable(tableRef: string): Insight[] {
  return insights.filter(i => i.tableRef === tableRef);
}

// Get statistics
export function getInsightStats() {
  const total = insights.length;
  const avgSurprising = insights.reduce((sum, i) => sum + i.surprising, 0) / total;
  const avgImportant = insights.reduce((sum, i) => sum + i.important, 0) / total;
  const avgActionable = insights.reduce((sum, i) => sum + i.actionable, 0) / total;
  const avgNeglected = insights.reduce((sum, i) => sum + i.neglected, 0) / total;
  const avgCompact = insights.reduce((sum, i) => sum + i.compact, 0) / total;
  const avgComposite = insights.reduce((sum, i) => sum + (i.composite || 0), 0) / total;

  // Count by type
  const byType: Record<string, number> = {};
  insights.forEach(i => {
    byType[i.type] = (byType[i.type] || 0) + 1;
  });

  // Count by status
  const byStatus: Record<string, number> = {
    'new': 0,
    'current': 0,
    'needs-review': 0,
    'stale': 0,
  };
  insights.forEach(i => {
    if (i.status) byStatus[i.status] = (byStatus[i.status] || 0) + 1;
  });

  // Count with table references
  const withTableRef = insights.filter(i => i.tableRef).length;

  return {
    total,
    avgSurprising: avgSurprising.toFixed(2),
    avgImportant: avgImportant.toFixed(2),
    avgActionable: avgActionable.toFixed(2),
    avgNeglected: avgNeglected.toFixed(2),
    avgCompact: avgCompact.toFixed(2),
    avgComposite: avgComposite.toFixed(2),
    byType,
    byStatus,
    withTableRef,
  };
}
