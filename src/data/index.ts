/**
 * Data Index for EA Crux Project
 *
 * Exports all data from pre-built JSON files.
 * Run `node scripts/build-data.mjs` to regenerate JSON from YAML.
 */

import database from './database.json';
import type { Expert, Organization, Estimate, Crux, GlossaryTerm, Entity, StructuredLikelihood, StructuredTimeframe, ResearchMaturity } from './schema';

// =============================================================================
// DATA ACCESS
// =============================================================================

export const experts: Expert[] = database.experts as Expert[];
export const organizations: Organization[] = database.organizations as Organization[];
export const estimates: Estimate[] = database.estimates as Estimate[];
export const cruxes: Crux[] = database.cruxes as Crux[];
export const glossary: GlossaryTerm[] = database.glossary as GlossaryTerm[];
export const entities: Entity[] = (database as any).entities as Entity[] || [];

// Derived data (computed at build time)
export const backlinks: Record<string, Array<{ id: string; type: string; title: string; relationship?: string }>> =
  (database as any).backlinks || {};
export const tagIndex: Record<string, Array<{ id: string; type: string; title: string }>> =
  (database as any).tagIndex || {};
export const stats: {
  totalEntities: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentlyUpdated: Array<{ id: string; type: string; title: string; lastUpdated: string }>;
  mostLinked: Array<{ id: string; type: string; title: string; backlinkCount: number }>;
  topTags: Array<{ tag: string; count: number }>;
  totalTags: number;
  withDescription: number;
  lastBuilt: string;
} = (database as any).stats || {
  totalEntities: 0,
  byType: {},
  bySeverity: {},
  byStatus: {},
  recentlyUpdated: [],
  mostLinked: [],
  topTags: [],
  totalTags: 0,
  withDescription: 0,
  lastBuilt: '',
};

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

export function getExpertById(id: string): Expert | undefined {
  return experts.find((e) => e.id === id);
}

export function getOrganizationById(id: string): Organization | undefined {
  return organizations.find((o) => o.id === id);
}

export function getEstimateById(id: string): Estimate | undefined {
  return estimates.find((e) => e.id === id);
}

export function getCruxById(id: string): Crux | undefined {
  return cruxes.find((c) => c.id === id);
}

export function getGlossaryTerm(idOrTerm: string): GlossaryTerm | undefined {
  return glossary.find(
    (t) => t.id === idOrTerm || t.term.toLowerCase() === idOrTerm.toLowerCase()
  );
}

// Literature data
const literature = (database as any).literature || { categories: [] };

export function getLiteratureById(paperId: string) {
  for (const category of literature.categories || []) {
    const paper = category.papers?.find((p: any) =>
      p.title.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(paperId) ||
      paperId === p.title
    );
    if (paper) return paper;
  }
  return null;
}

/**
 * Get sources for an entity, resolving literature references
 */
export function getEntitySources(entityId: string) {
  const entity = getEntityById(entityId);
  if (!entity) return [];

  const sources: Array<{ title: string; url: string; author?: string; date?: string }> = [];

  // Add any sourceRefs from literature
  if (entity.sourceRefs) {
    for (const ref of entity.sourceRefs) {
      const paper = getLiteratureById(ref);
      if (paper) {
        sources.push({
          title: paper.title,
          url: paper.link,
          author: paper.authors?.join(', '),
          date: paper.year?.toString(),
        });
      }
    }
  }

  return sources;
}

export function getEntityById(id: string): Entity | undefined {
  return entities.find((e) => e.id === id);
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all positions on a specific topic from all experts
 */
export function getPositionsOnTopic(topic: string) {
  const positions: Array<{
    expert: Expert;
    position: NonNullable<Expert['positions']>[number];
  }> = [];

  for (const expert of experts) {
    if (!expert.positions) continue;
    for (const position of expert.positions) {
      if (position.topic === topic) {
        positions.push({ expert, position });
      }
    }
  }

  return positions;
}

/**
 * Get all experts affiliated with an organization
 */
export function getExpertsByOrganization(orgId: string) {
  return experts.filter((e) => e.affiliation === orgId);
}

/**
 * Get organizations by type
 */
export function getOrganizationsByType(type: Organization['type']) {
  return organizations.filter((o) => o.type === type);
}

// =============================================================================
// COMPONENT DATA HELPERS
// =============================================================================

/**
 * Get data formatted for DisagreementMap component
 */
export function getDisagreementMapData(topic: string) {
  const positions = getPositionsOnTopic(topic);
  return positions.map(({ expert, position }) => ({
    actor: expert.name,
    position: position.view,
    estimate: position.estimate,
    confidence: position.confidence,
    source: position.source,
    url: position.sourceUrl,
  }));
}

/**
 * Get data formatted for EstimateBox component
 */
export function getEstimateBoxData(estimateId: string) {
  const estimate = getEstimateById(estimateId);
  if (!estimate) return null;

  return {
    variable: estimate.variable,
    description: estimate.description,
    aggregateRange: estimate.aggregateRange,
    unit: estimate.unit,
    estimates: estimate.estimates.map((e) => {
      const expert = getExpertById(e.source);
      const org = getOrganizationById(e.source);
      return {
        source: expert?.name || org?.name || e.source,
        value: e.value,
        date: e.date,
        url: e.url,
        notes: e.notes,
      };
    }),
  };
}

/**
 * Get data formatted for InfoBox component (expert)
 */
export function getExpertInfoBoxData(expertId: string) {
  const expert = getExpertById(expertId);
  if (!expert) return null;

  const org = expert.affiliation ? getOrganizationById(expert.affiliation) : null;

  return {
    type: 'researcher' as const,
    title: expert.name,
    affiliation: org?.name || expert.affiliation,
    role: expert.role,
    website: expert.website,
    knownFor: expert.knownFor?.join(', '),
  };
}

/**
 * Get data formatted for InfoBox component (organization)
 */
export function getOrgInfoBoxData(orgId: string) {
  const org = getOrganizationById(orgId);
  if (!org) return null;

  return {
    type: org.type === 'frontier-lab' ? 'lab-frontier' as const :
          org.type === 'safety-org' ? 'lab-research' as const :
          org.type === 'academic' ? 'lab-academic' as const :
          'lab' as const,
    title: org.name,
    founded: org.founded,
    location: org.headquarters,
    headcount: org.employees,
    funding: org.funding,
    website: org.website,
  };
}

/**
 * Get data formatted for Crux component
 */
export function getCruxData(cruxId: string) {
  const crux = getCruxById(cruxId);
  if (!crux) return null;

  return {
    id: crux.id,
    question: crux.question,
    domain: crux.domain,
    description: crux.description,
    importance: crux.importance,
    resolvability: crux.resolvability,
    currentState: crux.currentState,
    positions: crux.positions,
    wouldUpdateOn: crux.wouldUpdateOn,
    relatedCruxes: crux.relatedCruxes,
    relevantResearch: crux.relevantResearch,
  };
}

/**
 * Get data formatted for InfoBox component (entity)
 * Resolves related entries to include hrefs
 * For researchers, also pulls in expert data
 */
export function getEntityInfoBoxData(entityId: string) {
  const entity = getEntityById(entityId);
  if (!entity) return null;

  // Generate hrefs for related entries based on type
  const resolvedRelatedEntries = entity.relatedEntries?.map((entry) => {
    const href = getEntityHref(entry.id, entry.type);
    return {
      type: entry.type,
      title: getEntityTitle(entry.id, entry.type),
      href,
    };
  });

  // For researchers, merge in expert data
  if (entity.type === 'researcher') {
    const expert = getExpertById(entityId);
    if (expert) {
      const org = expert.affiliation ? getOrganizationById(expert.affiliation) : null;
      return {
        type: entity.type,
        title: expert.name,
        affiliation: org?.name || expert.affiliation,
        role: expert.role,
        website: expert.website || entity.website,
        knownFor: expert.knownFor?.join(', '),
        customFields: entity.customFields,
        relatedTopics: entity.relatedTopics,
        relatedEntries: resolvedRelatedEntries,
      };
    }
  }

  // Convert likelihood to string if it's an object
  let likelihoodStr: string | undefined;
  if (entity.likelihood) {
    if (typeof entity.likelihood === 'string') {
      likelihoodStr = entity.likelihood;
    } else if (typeof entity.likelihood === 'object') {
      const lh = entity.likelihood as { level?: string; display?: string; notes?: string };
      likelihoodStr = lh.display || lh.level || undefined;
    }
  }

  // Convert timeframe to string if it's an object
  let timeframeStr: string | undefined;
  if (entity.timeframe) {
    if (typeof entity.timeframe === 'string') {
      timeframeStr = entity.timeframe;
    } else if (typeof entity.timeframe === 'object') {
      const tf = entity.timeframe as { display?: string; median?: number };
      timeframeStr = tf.display || (tf.median ? `${tf.median}` : undefined);
    }
  }

  return {
    type: entity.type,
    title: entity.title,
    severity: entity.severity,
    likelihood: likelihoodStr,
    timeframe: timeframeStr,
    website: entity.website,
    customFields: entity.customFields,
    relatedTopics: entity.relatedTopics,
    relatedEntries: resolvedRelatedEntries,
    sources: (entity as any).sources,
  };
}

/**
 * Get all risk entities, optionally filtered by category
 */
export function getRisks(category?: string) {
  const riskEntities = entities.filter(e => e.type === 'risk');

  if (category) {
    // Infer category from the entity ID patterns or customFields
    return riskEntities.filter(e => {
      // Check if the risk ID suggests a category, or look in customFields
      const typeField = e.customFields?.find(f => f.label === 'Type');
      if (typeField) {
        return typeField.value.toLowerCase().includes(category.toLowerCase());
      }
      return false;
    });
  }

  return riskEntities;
}

// Helper types for table data
export interface RiskTableLikelihood {
  level: string;
  status?: string;
  confidence?: string;
  notes?: string;
  // Display string for legacy compatibility
  display: string;
}

export interface RiskTableTimeframe {
  median: number;
  earliest?: number;
  latest?: number;
  confidence?: string;
  notes?: string;
  // Display string for legacy compatibility
  display: string;
}

export interface RiskTableSolution {
  id: string;
  title: string;
  type: string;
  href: string;
}

export interface RiskTableRow {
  id: string;
  title: string;
  severity?: string;
  likelihood?: RiskTableLikelihood;
  timeframe?: RiskTableTimeframe;
  maturity?: string;
  category: string;
  relatedSolutions: RiskTableSolution[];
  customFields?: { label: string; value: string }[];
}

/**
 * Get all risks organized by category for table display
 */
export function getRisksForTable(): RiskTableRow[] {
  const riskEntities = entities.filter(e => e.type === 'risk');

  // Build a map of risk -> solutions by checking which solutions link to each risk
  const solutionEntities = entities.filter(e =>
    e.type === 'safety-agenda' || e.type === 'intervention'
  );
  const riskToSolutions: Record<string, RiskTableSolution[]> = {};

  for (const solution of solutionEntities) {
    const linkedRisks = solution.relatedEntries?.filter(re => re.type === 'risk') || [];
    for (const riskRef of linkedRisks) {
      if (!riskToSolutions[riskRef.id]) {
        riskToSolutions[riskRef.id] = [];
      }
      riskToSolutions[riskRef.id].push({
        id: solution.id,
        title: solution.title,
        type: solution.type,
        href: `/knowledge-base/responses/technical/${solution.id}/`,
      });
    }
  }

  return riskEntities.map(e => {
    // Infer category from customFields or ID pattern
    let category = 'accident'; // default
    const typeField = e.customFields?.find(f => f.label === 'Type');
    if (typeField) {
      const typeValue = typeField.value.toLowerCase();
      if (typeValue.includes('epistemic')) category = 'epistemic';
      else if (typeValue.includes('misuse')) category = 'misuse';
      else if (typeValue.includes('structural') || typeValue.includes('systemic')) category = 'structural';
    }

    // Also check the ID for patterns
    const epistemicIds = ['authentication-collapse', 'automation-bias', 'consensus-manufacturing', 'cyber-psychosis', 'epistemic-collapse', 'expertise-atrophy', 'historical-revisionism', 'institutional-capture', 'knowledge-monopoly', 'learned-helplessness', 'legal-evidence-crisis', 'preference-manipulation', 'reality-fragmentation', 'scientific-corruption', 'sycophancy-scale', 'trust-cascade', 'trust-erosion'];
    const misuseIds = ['authoritarian-tools', 'autonomous-weapons', 'bioweapons', 'cyberweapons', 'deepfakes', 'disinformation', 'fraud', 'surveillance'];
    const structuralIds = ['concentration-of-power', 'economic-disruption', 'enfeeblement', 'erosion-of-agency', 'flash-dynamics', 'irreversibility', 'lock-in', 'multipolar-trap', 'proliferation', 'racing-dynamics', 'winner-take-all'];

    if (epistemicIds.includes(e.id)) category = 'epistemic';
    else if (misuseIds.includes(e.id)) category = 'misuse';
    else if (structuralIds.includes(e.id)) category = 'structural';

    // Parse likelihood - handle both string and structured format
    let likelihood: RiskTableLikelihood | undefined;
    const rawLikelihood = e.likelihood;
    if (rawLikelihood) {
      if (typeof rawLikelihood === 'string') {
        // Legacy string format
        likelihood = {
          level: rawLikelihood.toLowerCase().includes('high') ? 'high' :
                 rawLikelihood.toLowerCase().includes('medium') ? 'medium' : 'low',
          display: rawLikelihood,
        };
      } else {
        // Structured format
        const struct = rawLikelihood as StructuredLikelihood;
        let display = struct.level.charAt(0).toUpperCase() + struct.level.slice(1);
        if (struct.status) {
          display += ` (${struct.status})`;
        }
        likelihood = {
          level: struct.level,
          status: struct.status,
          confidence: struct.confidence,
          notes: struct.notes,
          display,
        };
      }
    }

    // Parse timeframe - handle both string and structured format
    let timeframe: RiskTableTimeframe | undefined;
    const rawTimeframe = e.timeframe;
    if (rawTimeframe) {
      if (typeof rawTimeframe === 'string') {
        // Legacy string format - try to extract year
        const yearMatch = rawTimeframe.match(/(\d{4})/);
        const median = yearMatch ? parseInt(yearMatch[1]) : 2030;
        timeframe = {
          median,
          display: rawTimeframe,
        };
      } else {
        // Structured format
        const struct = rawTimeframe as StructuredTimeframe;
        let display: string;
        if (struct.earliest && struct.latest) {
          display = `${struct.earliest}-${struct.latest}`;
        } else if (struct.median === 2025) {
          display = 'Current';
        } else {
          display = struct.median.toString();
        }
        timeframe = {
          median: struct.median,
          earliest: struct.earliest,
          latest: struct.latest,
          confidence: struct.confidence,
          notes: struct.notes,
          display,
        };
      }
    }

    return {
      id: e.id,
      title: e.title,
      severity: e.severity,
      likelihood,
      timeframe,
      maturity: (e as any).maturity as ResearchMaturity | undefined,
      category,
      relatedSolutions: riskToSolutions[e.id] || [],
      customFields: e.customFields,
    };
  });
}

/**
 * Generate href for an entity based on its ID and type
 */
export function getEntityHref(id: string, type: string): string {
  const pathMapping: Record<string, string> = {
    'risk': '/knowledge-base/risks/',
    'capability': '/knowledge-base/capabilities/',
    'safety-agenda': '/knowledge-base/responses/technical/',
    'policy': '/knowledge-base/responses/governance/',
    'lab': '/knowledge-base/organizations/',
    'lab-frontier': '/knowledge-base/organizations/',
    'lab-research': '/knowledge-base/organizations/',
    'lab-startup': '/knowledge-base/organizations/',
    'lab-academic': '/knowledge-base/organizations/',
    'researcher': '/knowledge-base/people/',
    'crux': '/knowledge-base/key-uncertainties/',
    'scenario': '/analysis/scenarios/',
    'resource': '/resources/',
    'funder': '/knowledge-base/funders/',
    'intervention': '/knowledge-base/responses/',
  };

  const basePath = pathMapping[type] || '/knowledge-base/';
  return `${basePath}${id}/`;
}

/**
 * Get title for an entity - looks up in entities first, then falls back to ID
 */
function getEntityTitle(id: string, type: string): string {
  // First check entities
  const entity = getEntityById(id);
  if (entity) return entity.title;

  // Check organizations
  const org = getOrganizationById(id);
  if (org) return org.name;

  // Check experts
  const expert = getExpertById(id);
  if (expert) return expert.name;

  // Fallback: humanize the ID
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// =============================================================================
// BACKLINKS & DISCOVERY HELPERS
// =============================================================================

/**
 * Get backlinks for an entity - entities that link TO this entity
 */
export function getBacklinksFor(entityId: string): Array<{
  id: string;
  type: string;
  title: string;
  href: string;
  relationship?: string;
}> {
  const links = backlinks[entityId] || [];
  return links.map(link => ({
    ...link,
    href: getEntityHref(link.id, link.type),
  }));
}

/**
 * Get entities by tag
 */
export function getEntitiesByTag(tag: string): Array<{
  id: string;
  type: string;
  title: string;
  href: string;
}> {
  const items = tagIndex[tag] || [];
  return items.map(item => ({
    ...item,
    href: getEntityHref(item.id, item.type),
  }));
}

/**
 * Get all unique tags sorted by count
 */
export function getAllTags(): Array<{ tag: string; count: number }> {
  return Object.entries(tagIndex)
    .map(([tag, items]) => ({ tag, count: items.length }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get recently updated entities
 */
export function getRecentlyUpdated(limit = 10): Array<{
  id: string;
  type: string;
  title: string;
  href: string;
  lastUpdated: string;
}> {
  return stats.recentlyUpdated.slice(0, limit).map(item => ({
    ...item,
    href: getEntityHref(item.id, item.type),
  }));
}

/**
 * Get most linked entities
 */
export function getMostLinked(limit = 10): Array<{
  id: string;
  type: string;
  title: string;
  href: string;
  backlinkCount: number;
}> {
  return stats.mostLinked.slice(0, limit).map(item => ({
    ...item,
    href: getEntityHref(item.id, item.type),
  }));
}

/**
 * Get entities by type with optional filtering
 */
export function getEntitiesByType(type: string, options?: {
  limit?: number;
  sortBy?: 'title' | 'lastUpdated' | 'severity';
  filterTags?: string[];
}): Array<Entity & { href: string }> {
  let filtered = entities.filter(e => e.type === type);

  // Filter by tags if specified
  if (options?.filterTags && options.filterTags.length > 0) {
    filtered = filtered.filter(e =>
      e.tags?.some(t => options.filterTags!.includes(t))
    );
  }

  // Sort
  if (options?.sortBy === 'title') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (options?.sortBy === 'lastUpdated') {
    filtered.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
  } else if (options?.sortBy === 'severity') {
    const severityOrder = { catastrophic: 0, high: 1, medium: 2, low: 3 };
    filtered.sort((a, b) => {
      const aOrder = severityOrder[a.severity as keyof typeof severityOrder] ?? 4;
      const bOrder = severityOrder[b.severity as keyof typeof severityOrder] ?? 4;
      return aOrder - bOrder;
    });
  }

  // Limit
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered.map(e => ({
    ...e,
    href: getEntityHref(e.id, e.type),
  }));
}
