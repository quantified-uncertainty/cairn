/**
 * Dashboard Utilities
 *
 * Computes metrics for the content quality dashboard.
 * These functions process entity data and content files to generate
 * quality metrics, staleness reports, and gap analysis.
 */

import database from '../data/database.json';
import pages from '../data/pages.json';
import resources from '../data/resources.json';
import stats from '../data/stats.json';

// Types for dashboard data
export interface QualityDistribution {
  quality: number;
  count: number;
  label: string;
}

export interface StaleContent {
  id: string;
  title: string;
  type: string;
  path: string;
  daysPastReview?: number;
  daysSinceEdit?: number;
  reason: string;
}

export interface EntityGap {
  id: string;
  title: string;
  type: string;
  issue: string;
}

export interface DashboardMetrics {
  totalEntities: number;
  qualityDistribution: QualityDistribution[];
  averageQuality: number;
  contentByType: { type: string; count: number }[];
  recentlyUpdated: { id: string; title: string; date: string }[];
  risksWithoutResponses: EntityGap[];
  responsesWithoutRisks: EntityGap[];
  orphanedEntities: EntityGap[];
}

/**
 * Get all entities from the database
 */
export function getEntities(): any[] {
  return (database as any).entities || [];
}

/**
 * Get pages data (includes quality scores from MDX frontmatter)
 */
export function getPages(): any[] {
  return (pages as any[]) || [];
}

/**
 * Convert 0-100 quality score to 1-5 scale
 * 0-20 → 1 (Stub), 21-40 → 2 (Draft), 41-60 → 3 (Adequate), 61-80 → 4 (Good), 81-100 → 5 (Excellent)
 */
export function convertQualityTo5Scale(quality: number | null | undefined): number {
  if (quality == null || quality === 0) return 0; // Unrated
  if (quality <= 20) return 1;
  if (quality <= 40) return 2;
  if (quality <= 60) return 3;
  if (quality <= 80) return 4;
  return 5;
}

/**
 * Get backlinks data
 */
export function getBacklinks(): Record<string, any[]> {
  return (database as any).backlinks || {};
}

/**
 * Compute quality distribution from pages (MDX frontmatter quality scores)
 */
export function computeQualityDistribution(): QualityDistribution[] {
  const pages = getPages();
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const qualityLabels: Record<number, string> = {
    0: 'Unrated',
    1: 'Stub',
    2: 'Draft',
    3: 'Adequate',
    4: 'Good',
    5: 'Excellent',
  };

  for (const page of pages) {
    const quality5 = convertQualityTo5Scale(page.quality);
    distribution[quality5] = (distribution[quality5] || 0) + 1;
  }

  return Object.entries(distribution).map(([q, count]) => ({
    quality: parseInt(q),
    count,
    label: qualityLabels[parseInt(q)],
  }));
}

/**
 * Compute average quality score (on 1-5 scale)
 */
export function computeAverageQuality(): number {
  const pages = getPages();
  const rated = pages
    .map(p => convertQualityTo5Scale(p.quality))
    .filter(q => q > 0);

  if (rated.length === 0) return 0;

  const sum = rated.reduce((acc, q) => acc + q, 0);
  return sum / rated.length;
}

/**
 * Count entities by type
 */
export function countByType(): { type: string; count: number }[] {
  const entities = getEntities();
  const counts: Record<string, number> = {};

  for (const entity of entities) {
    counts[entity.type] = (counts[entity.type] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get recently updated entities
 */
export function getRecentlyUpdated(limit = 10): { id: string; title: string; date: string }[] {
  const entities = getEntities();

  return entities
    .filter(e => e.lastUpdated)
    .sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''))
    .slice(0, limit)
    .map(e => ({
      id: e.id,
      title: e.title,
      date: e.lastUpdated,
    }));
}

/**
 * Find risks without any responses linked to them
 */
// Helper to check if a type is a risk-like type
function isRiskType(type: string): boolean {
  return type === 'risk' || type === 'risk-factor' || type === 'ai-transition-model-factor';
}

export function findRisksWithoutResponses(): EntityGap[] {
  const entities = getEntities();
  const risks = entities.filter(e => isRiskType(e.type));
  const responses = entities.filter(e =>
    e.type === 'safety-agenda' || e.type === 'intervention' || e.type === 'policy'
  );

  // Build a set of risk IDs that have responses
  const risksWithResponses = new Set<string>();

  for (const response of responses) {
    if (response.relatedEntries) {
      for (const rel of response.relatedEntries) {
        if (isRiskType(rel.type)) {
          risksWithResponses.add(rel.id);
        }
      }
    }
  }

  return risks
    .filter(risk => !risksWithResponses.has(risk.id))
    .map(risk => ({
      id: risk.id,
      title: risk.title,
      type: risk.type,
      issue: 'No responses link to this risk',
    }));
}

/**
 * Find responses that don't link to any risks
 */
export function findResponsesWithoutRisks(): EntityGap[] {
  const entities = getEntities();
  const responses = entities.filter(e =>
    e.type === 'safety-agenda' || e.type === 'intervention' || e.type === 'policy'
  );

  return responses
    .filter(response => {
      if (!response.relatedEntries) return true;
      return !response.relatedEntries.some(rel => isRiskType(rel.type));
    })
    .map(response => ({
      id: response.id,
      title: response.title,
      type: response.type,
      issue: 'Does not link to any risks',
    }));
}

/**
 * Find entities with no backlinks (orphans)
 */
export function findOrphanedEntities(): EntityGap[] {
  const entities = getEntities();
  const backlinks = getBacklinks();

  return entities
    .filter(entity => {
      const hasBacklinks = backlinks[entity.id]?.length > 0;
      const hasForwardLinks = entity.relatedEntries?.length > 0;
      return !hasBacklinks && !hasForwardLinks;
    })
    .map(entity => ({
      id: entity.id,
      title: entity.title,
      type: entity.type,
      issue: 'No incoming or outgoing links',
    }));
}

/**
 * Get complete dashboard metrics
 */
export function getDashboardMetrics(): DashboardMetrics {
  return {
    totalEntities: getEntities().length,
    qualityDistribution: computeQualityDistribution(),
    averageQuality: computeAverageQuality(),
    contentByType: countByType(),
    recentlyUpdated: getRecentlyUpdated(),
    risksWithoutResponses: findRisksWithoutResponses(),
    responsesWithoutRisks: findResponsesWithoutRisks(),
    orphanedEntities: findOrphanedEntities(),
  };
}

/**
 * Enhancement Queue Item - pages prioritized for improvement
 */
export interface EnhancementQueueItem {
  id: string;
  title: string;
  path: string;
  quality: number;
  importance: number;
  gap: number;  // importance - (quality * 10)
  category: string;
}

/**
 * Get enhancement queue - pages sorted by improvement priority
 * Priority = importance - quality (both on 0-100 scale)
 * High importance + low quality = high priority
 */
export function getEnhancementQueue(limit = 20): EnhancementQueueItem[] {
  const pagesData = getPages();

  return pagesData
    .filter(p => p.quality != null && p.quality <= 80 && p.importance && p.importance >= 30)
    .map(p => ({
      id: p.id,
      title: p.title,
      path: p.path,
      quality: p.quality,
      importance: p.importance,
      gap: p.importance - p.quality,
      category: p.category || 'other',
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);
}

/**
 * Link Health Stats
 */
export interface LinkHealthStats {
  totalLinks: number;
  validLinks: number;
  brokenLinks: number;
  conventionIssues: number;
  healthScore: number;  // 0-100
}

/**
 * Get link health statistics (static placeholder - run npm run validate:links for real data)
 */
export function getLinkHealthStats(): LinkHealthStats {
  // This is a placeholder - actual data comes from validate:links command
  return {
    totalLinks: 1254,
    validLinks: 1254,
    brokenLinks: 0,
    conventionIssues: 0,
    healthScore: 100,
  };
}

/**
 * Get summary statistics
 */
export function getSummaryStats(): {
  total: number;
  risks: number;
  responses: number;
  models: number;
  avgQuality: string;
  gaps: number;
} {
  const entities = getEntities();
  const byType = countByType();

  const getRiskCount = () => {
    return byType
      .filter(t => isRiskType(t.type))
      .reduce((sum, t) => sum + t.count, 0);
  };

  const getResponseCount = () => {
    return byType
      .filter(t => ['safety-agenda', 'intervention', 'policy'].includes(t.type))
      .reduce((sum, t) => sum + t.count, 0);
  };

  const getModelCount = () => {
    const modelEntry = byType.find(t => t.type === 'model');
    return modelEntry?.count || 0;
  };

  const gaps = findRisksWithoutResponses().length +
    findResponsesWithoutRisks().length +
    findOrphanedEntities().length;

  return {
    total: entities.length,
    risks: getRiskCount(),
    responses: getResponseCount(),
    models: getModelCount(),
    avgQuality: computeAverageQuality().toFixed(1),
    gaps,
  };
}

/**
 * Wiki Statistics - high-level stats for the About page
 */
export interface WikiStats {
  totalPages: number;
  totalEntities: number;
  totalResources: number;
  totalWords: string;
  avgQuality: string;
  qualitySummary: { low: number; adequate: number; high: number };
  entityBreakdown: {
    risks: number;
    responses: number;
    orgs: number;
    people: number;
    models: number;
    concepts: number;
  };
  createdDate: string;
  lastBuildDate: string;
}

/**
 * Get wiki-wide statistics for meta/about page
 */
export function getWikiStats(): WikiStats {
  const pagesData = getPages();
  const byType = countByType();
  const qualityDist = computeQualityDistribution();

  // Count quality buckets
  const low = qualityDist.filter(d => d.quality === 1 || d.quality === 2).reduce((s, d) => s + d.count, 0);
  const adequate = qualityDist.find(d => d.quality === 3)?.count || 0;
  const high = qualityDist.filter(d => d.quality === 4 || d.quality === 5).reduce((s, d) => s + d.count, 0);

  // Entity type helpers
  const getCount = (types: string[]) => byType.filter(t => types.includes(t.type)).reduce((s, t) => s + t.count, 0);

  return {
    totalPages: pagesData.length,
    totalEntities: (stats as any).totalEntities || getEntities().length,
    totalResources: (resources as any[]).length,
    totalWords: '~970K', // Pre-computed approximation
    avgQuality: computeAverageQuality().toFixed(1),
    qualitySummary: { low, adequate, high },
    entityBreakdown: {
      risks: getCount(['risk', 'risk-factor', 'ai-transition-model-factor']),
      responses: getCount(['safety-agenda', 'intervention', 'policy']),
      orgs: getCount(['organization', 'lab', 'lab-academic', 'lab-research']),
      people: getCount(['researcher']),
      models: getCount(['model']),
      concepts: getCount(['concept', 'crux', 'capability', 'ai-transition-model-parameter', 'ai-transition-model-metric', 'ai-transition-model-scenario', 'ai-transition-model-subitem']),
    },
    createdDate: 'December 2024',
    lastBuildDate: (stats as any).lastBuilt ? new Date((stats as any).lastBuilt).toLocaleDateString() : 'Unknown',
  };
}
