/**
 * Dashboard Utilities
 *
 * Computes metrics for the content quality dashboard.
 * These functions process entity data and content files to generate
 * quality metrics, staleness reports, and gap analysis.
 */

import database from '../data/database.json';

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
 * Get backlinks data
 */
export function getBacklinks(): Record<string, any[]> {
  return (database as any).backlinks || {};
}

/**
 * Compute quality distribution from entities
 */
export function computeQualityDistribution(): QualityDistribution[] {
  const entities = getEntities();
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  const qualityLabels: Record<number, string> = {
    0: 'Unrated',
    1: 'Stub',
    2: 'Draft',
    3: 'Adequate',
    4: 'Good',
    5: 'Excellent',
  };

  for (const entity of entities) {
    const quality = entity.quality ?? 0;
    distribution[quality] = (distribution[quality] || 0) + 1;
  }

  return Object.entries(distribution).map(([q, count]) => ({
    quality: parseInt(q),
    count,
    label: qualityLabels[parseInt(q)],
  }));
}

/**
 * Compute average quality score
 */
export function computeAverageQuality(): number {
  const entities = getEntities();
  const rated = entities.filter(e => e.quality && e.quality > 0);

  if (rated.length === 0) return 0;

  const sum = rated.reduce((acc, e) => acc + e.quality, 0);
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
export function findRisksWithoutResponses(): EntityGap[] {
  const entities = getEntities();
  const risks = entities.filter(e => e.type === 'risk' || e.type === 'risk-factor');
  const responses = entities.filter(e =>
    e.type === 'safety-agenda' || e.type === 'intervention' || e.type === 'policy'
  );

  // Build a set of risk IDs that have responses
  const risksWithResponses = new Set<string>();

  for (const response of responses) {
    if (response.relatedEntries) {
      for (const rel of response.relatedEntries) {
        if (rel.type === 'risk' || rel.type === 'risk-factor') {
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
      return !response.relatedEntries.some(
        rel => rel.type === 'risk' || rel.type === 'risk-factor'
      );
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
 * Priority = importance - (quality * 10)
 * High importance + low quality = high priority
 */
export function getEnhancementQueue(limit = 20): EnhancementQueueItem[] {
  try {
    const pages = require('../data/pages.json') as any[];

    return pages
      .filter(p => p.quality && p.quality <= 4 && p.importance && p.importance >= 30)
      .map(p => ({
        id: p.id,
        title: p.title,
        path: p.path,
        quality: p.quality,
        importance: p.importance,
        gap: p.importance - (p.quality * 10),
        category: p.category || 'other',
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, limit);
  } catch {
    return [];
  }
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
    const riskEntry = byType.find(t => t.type === 'risk');
    const riskFactorEntry = byType.find(t => t.type === 'risk-factor');
    return (riskEntry?.count || 0) + (riskFactorEntry?.count || 0);
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
