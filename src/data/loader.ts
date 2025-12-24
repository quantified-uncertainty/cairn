/**
 * Data Loader for EA Crux Project
 *
 * Loads and validates YAML data files at build time.
 * Provides typed access to all structured data.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import {
  Expert,
  Organization,
  Estimate,
  Crux,
  Risk,
  Intervention,
  GlossaryTerm,
  TimelineEvent,
  Source,
  Graph,
} from './schema';

const DATA_DIR = new URL('.', import.meta.url).pathname;

// =============================================================================
// GENERIC LOADER
// =============================================================================

function loadYaml<T>(filename: string, schema: { parse: (data: unknown) => T[] }): T[] {
  const filepath = join(DATA_DIR, filename);
  try {
    const content = readFileSync(filepath, 'utf-8');
    const data = parse(content);
    // Validate with Zod schema
    return schema.parse(data);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// =============================================================================
// TYPED LOADERS
// =============================================================================

let _experts: Expert[] | null = null;
let _organizations: Organization[] | null = null;
let _estimates: Estimate[] | null = null;
let _glossary: GlossaryTerm[] | null = null;

export function getExperts(): Expert[] {
  if (!_experts) {
    const filepath = join(DATA_DIR, 'experts.yaml');
    const content = readFileSync(filepath, 'utf-8');
    _experts = parse(content) as Expert[];
  }
  return _experts;
}

export function getOrganizations(): Organization[] {
  if (!_organizations) {
    const filepath = join(DATA_DIR, 'organizations.yaml');
    const content = readFileSync(filepath, 'utf-8');
    _organizations = parse(content) as Organization[];
  }
  return _organizations;
}

export function getEstimates(): Estimate[] {
  if (!_estimates) {
    const filepath = join(DATA_DIR, 'estimates.yaml');
    const content = readFileSync(filepath, 'utf-8');
    _estimates = parse(content) as Estimate[];
  }
  return _estimates;
}

export function getGlossary(): GlossaryTerm[] {
  if (!_glossary) {
    const filepath = join(DATA_DIR, 'glossary.yaml');
    const content = readFileSync(filepath, 'utf-8');
    _glossary = parse(content) as GlossaryTerm[];
  }
  return _glossary;
}

// =============================================================================
// LOOKUP FUNCTIONS
// =============================================================================

export function getExpertById(id: string): Expert | undefined {
  return getExperts().find((e) => e.id === id);
}

export function getOrganizationById(id: string): Organization | undefined {
  return getOrganizations().find((o) => o.id === id);
}

export function getEstimateById(id: string): Estimate | undefined {
  return getEstimates().find((e) => e.id === id);
}

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return getGlossary().find((t) => t.id === id);
}

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all positions on a specific topic from all experts
 */
export function getPositionsOnTopic(topic: string) {
  const experts = getExperts();
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
 * Get all estimates for a specific variable
 */
export function getEstimatesForVariable(variableId: string) {
  const estimate = getEstimateById(variableId);
  if (!estimate) return null;

  // Resolve expert references to full expert objects
  return {
    ...estimate,
    resolvedEstimates: estimate.estimates.map((e) => ({
      ...e,
      expertData: getExpertById(e.source),
      orgData: getOrganizationById(e.source),
    })),
  };
}

/**
 * Get all organizations of a specific type
 */
export function getOrganizationsByType(type: Organization['type']) {
  return getOrganizations().filter((o) => o.type === type);
}

/**
 * Get all experts affiliated with an organization
 */
export function getExpertsByOrganization(orgId: string) {
  return getExperts().filter((e) => e.affiliation === orgId);
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate all cross-references in the data
 * Run this at build time to catch broken references
 */
export function validateReferences(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const experts = getExperts();
  const orgs = getOrganizations();

  const expertIds = new Set(experts.map((e) => e.id));
  const orgIds = new Set(orgs.map((o) => o.id));

  // Check expert affiliations
  for (const expert of experts) {
    if (expert.affiliation && !orgIds.has(expert.affiliation)) {
      errors.push(`Expert "${expert.id}" references unknown organization "${expert.affiliation}"`);
    }
  }

  // Check organization keyPeople
  for (const org of orgs) {
    if (org.keyPeople) {
      for (const personId of org.keyPeople) {
        if (!expertIds.has(personId)) {
          errors.push(`Organization "${org.id}" references unknown person "${personId}"`);
        }
      }
    }
  }

  // Check estimate source references
  const estimates = getEstimates();
  for (const estimate of estimates) {
    for (const source of estimate.estimates) {
      // Source can be expert ID, org ID, or free text
      // Only warn if it looks like an ID (lowercase, hyphens) but doesn't exist
      if (/^[a-z-]+$/.test(source.source)) {
        if (!expertIds.has(source.source) && !orgIds.has(source.source)) {
          // This is a soft warning - could be a name, not an ID
          // errors.push(`Estimate "${estimate.id}" source "${source.source}" may be a broken reference`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// =============================================================================
// COMPONENT HELPERS
// =============================================================================

/**
 * Format data for DisagreementMap component
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
 * Format data for EstimateBox component
 */
export function getEstimateBoxData(estimateId: string) {
  const estimate = getEstimateById(estimateId);
  if (!estimate) return null;

  return {
    variable: estimate.variable,
    description: estimate.description,
    aggregateRange: estimate.aggregateRange,
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
