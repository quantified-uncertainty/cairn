// Insights data loader
// Loads the insights YAML and provides typed access

import yaml from 'js-yaml';
import insightsYaml from './insights.yaml?raw';

export type InsightType = 'claim' | 'research-gap' | 'counterintuitive' | 'quantitative' | 'disagreement' | 'neglected';

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
  added: string;
  composite?: number;
}

interface RawInsightsData {
  insights: Insight[];
}

function loadInsights(): Insight[] {
  const data = yaml.load(insightsYaml) as RawInsightsData;

  return data.insights.map(insight => ({
    ...insight,
    type: insight.type || 'claim',
    actionable: insight.actionable || 3.0,
    neglected: insight.neglected || 3.0,
    // Composite now weights surprising + important + actionable
    composite: Number(((insight.surprising + insight.important + (insight.actionable || 3.0)) / 3).toFixed(2))
  }));
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

  return {
    total,
    avgSurprising: avgSurprising.toFixed(2),
    avgImportant: avgImportant.toFixed(2),
    avgActionable: avgActionable.toFixed(2),
    avgNeglected: avgNeglected.toFixed(2),
    avgCompact: avgCompact.toFixed(2),
    avgComposite: avgComposite.toFixed(2),
    byType,
  };
}
