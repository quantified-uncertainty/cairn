/**
 * Entity Transformation
 *
 * Transforms raw database.json entities into typed entities at build time.
 * This replaces the runtime transformation that was previously done in
 * longterm-next/src/data/index.ts.
 *
 * Handles:
 * - Type mapping (old types → canonical entityType)
 * - Expert/org data merging
 * - Risk category assignment
 * - CustomField extraction into typed fields
 * - Entity type overrides (path-based and explicit)
 */

// ============================================================================
// TYPE MAPS (mirrored from entity-schemas.ts)
// ============================================================================

/**
 * Maps old database.json `type` values to canonical `entityType` values.
 * Types not listed here map to themselves.
 */
const OLD_TYPE_MAP = {
  // Lab types → organization
  lab: 'organization',
  'lab-frontier': 'organization',
  'lab-research': 'organization',
  'lab-academic': 'organization',
  'lab-startup': 'organization',
  // Researcher → person
  researcher: 'person',
};

/**
 * Maps old lab types to orgType values.
 */
const OLD_LAB_TYPE_TO_ORG_TYPE = {
  lab: 'generic',
  'lab-frontier': 'frontier-lab',
  'lab-research': 'safety-org',
  'lab-academic': 'academic',
  'lab-startup': 'startup',
};

// ============================================================================
// RISK CATEGORIES
// ============================================================================

const RISK_CATEGORIES = {
  epistemic: [
    'authentication-collapse',
    'automation-bias',
    'consensus-manufacturing',
    'epistemic-collapse',
    'epistemic-sycophancy',
    'trust-cascade',
    'trust-decline',
  ],
  misuse: [
    'authoritarian-tools',
    'autonomous-weapons',
    'bioweapons',
    'cyberweapons',
    'deepfakes',
    'disinformation',
    'fraud',
    'surveillance',
  ],
  structural: [
    'concentration-of-power',
    'economic-disruption',
    'enfeeblement',
    'lock-in',
    'racing-dynamics',
    'winner-take-all',
  ],
};

function getRiskCategory(riskId) {
  if (RISK_CATEGORIES.epistemic.includes(riskId)) return 'epistemic';
  if (RISK_CATEGORIES.misuse.includes(riskId)) return 'misuse';
  if (RISK_CATEGORIES.structural.includes(riskId)) return 'structural';
  return 'accident';
}

// ============================================================================
// ENTITY TYPE OVERRIDES
// ============================================================================

/**
 * Path patterns that should be treated as "project" type.
 * Matches against the page path or entity path.
 */
const PROJECT_PATH_PATTERNS = [
  '/knowledge-base/responses/epistemic-tools/tools/',
];

/**
 * Explicit entity ID → type overrides.
 */
const ENTITY_TYPE_OVERRIDES = {
  // Add individual overrides here as needed, e.g.:
  // "some-entity-id": "project",
};

/**
 * Apply entity type overrides based on path patterns and explicit overrides.
 * Also creates entities for pages in project paths that don't have entities yet.
 */
function applyEntityOverrides(entities, pages) {
  // Build a set of page IDs that match project path patterns
  const projectPageIds = new Set();
  for (const page of pages || []) {
    if (PROJECT_PATH_PATTERNS.some(pattern => page.path?.includes(pattern))) {
      projectPageIds.add(page.id);
    }
  }

  // Apply overrides to entities
  const overriddenEntities = entities.map(entity => {
    // Check explicit overrides first
    if (ENTITY_TYPE_OVERRIDES[entity.id]) {
      return { ...entity, type: ENTITY_TYPE_OVERRIDES[entity.id] };
    }
    // Check path-based overrides
    if (projectPageIds.has(entity.id)) {
      return { ...entity, type: 'project' };
    }
    return entity;
  });

  // Also create entities for pages in project paths that don't have entities yet
  const entityIds = new Set(overriddenEntities.map(e => e.id));
  const newEntities = [];
  for (const page of pages || []) {
    if (projectPageIds.has(page.id) && !entityIds.has(page.id)) {
      newEntities.push({
        id: page.id,
        type: 'project',
        title: page.title,
        description: page.llmSummary || page.description || undefined,
        tags: page.tags || [],
        lastUpdated: page.lastUpdated || undefined,
      });
    }
  }

  return [...overriddenEntities, ...newEntities];
}

// ============================================================================
// ENTITY TRANSFORMATION
// ============================================================================

/**
 * Transform a raw entity into a typed entity.
 * - Maps old type names to canonical entityType
 * - Flattens lab-* → organization with orgType
 * - Extracts customFields into typed fields for researcher → person, policy, etc.
 */
function transformEntity(raw, expertMap, orgMap) {
  const oldType = raw.type;
  const canonicalType = OLD_TYPE_MAP[oldType] || oldType;

  // Build base fields shared across all types
  const base = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    tags: raw.tags || [],
    clusters: raw.clusters || [],
    relatedEntries: raw.relatedEntries || [],
    sources: raw.sources || [],
    lastUpdated: raw.lastUpdated,
    website: raw.website,
    numericId: raw.numericId,
    path: raw.path,
    status: raw.status,
    customFields: raw.customFields || [],
    relatedTopics: raw.relatedTopics || [],
  };

  // Helper to find a customField value
  const cf = (label) =>
    raw.customFields?.find(f => f.label === label)?.value;

  // Remove extracted customFields from the passthrough list
  const filterCustomFields = (...labels) => {
    const labelSet = new Set(labels);
    return (raw.customFields || []).filter(f => !labelSet.has(f.label));
  };

  switch (canonicalType) {
    case 'risk': {
      return {
        ...base,
        entityType: 'risk',
        severity: raw.severity,
        likelihood: raw.likelihood,
        timeframe: raw.timeframe,
        maturity: raw.maturity,
        riskCategory: getRiskCategory(raw.id),
      };
    }

    case 'person': {
      // Merge expert data if available
      const expert = expertMap.get(raw.id);
      const org = expert?.affiliation ? orgMap.get(expert.affiliation) : null;
      const role = expert?.role || cf('Role');
      const knownForStr = cf('Known For');
      const knownFor = expert?.knownFor ||
        (knownForStr ? knownForStr.split(',').map(s => s.trim()).filter(Boolean) : []);
      const affiliation = org?.name || expert?.affiliation || cf('Affiliation');

      return {
        ...base,
        entityType: 'person',
        title: expert?.name || raw.title,
        website: expert?.website || raw.website,
        role,
        affiliation,
        knownFor,
        customFields: filterCustomFields('Role', 'Known For', 'Affiliation'),
      };
    }

    case 'organization': {
      // Determine orgType from old lab-* type
      const orgType = OLD_LAB_TYPE_TO_ORG_TYPE[oldType] || undefined;
      // Merge org data if available
      const orgData = orgMap.get(raw.id);
      return {
        ...base,
        entityType: 'organization',
        orgType: orgType || orgData?.type || undefined,
        founded: orgData?.founded || cf('Founded') || cf('Established'),
        headquarters: orgData?.headquarters || cf('Location') || cf('Headquarters'),
        employees: orgData?.employees || cf('Employees'),
        funding: orgData?.funding || cf('Funding'),
        website: orgData?.website || raw.website,
        title: orgData?.name || raw.title,
        customFields: filterCustomFields('Founded', 'Established', 'Location', 'Headquarters', 'Employees', 'Funding'),
      };
    }

    case 'policy': {
      return {
        ...base,
        entityType: 'policy',
        introduced: cf('Introduced') || cf('Established'),
        policyStatus: cf('Status'),
        author: cf('Author'),
        scope: cf('Scope'),
        customFields: filterCustomFields('Introduced', 'Established', 'Status', 'Author', 'Scope'),
      };
    }

    case 'approach':
      return { ...base, entityType: 'approach' };
    case 'safety-agenda':
      return { ...base, entityType: 'safety-agenda', goal: cf('Goal') };
    case 'concept':
      return { ...base, entityType: 'concept' };
    case 'crux':
      return { ...base, entityType: 'crux' };
    case 'model':
      return { ...base, entityType: 'model' };
    case 'capability':
      return { ...base, entityType: 'capability' };
    case 'project':
      return { ...base, entityType: 'project' };
    case 'analysis':
      return { ...base, entityType: 'analysis' };
    case 'historical':
      return { ...base, entityType: 'historical' };
    case 'argument':
      return { ...base, entityType: 'argument' };
    case 'scenario':
      return { ...base, entityType: 'scenario' };
    case 'case-study':
      return { ...base, entityType: 'case-study' };
    case 'funder':
      return { ...base, entityType: 'funder' };
    case 'resource':
      return { ...base, entityType: 'resource' };
    case 'parameter':
      return { ...base, entityType: 'parameter' };
    case 'metric':
      return { ...base, entityType: 'metric' };
    case 'risk-factor':
      return { ...base, entityType: 'risk-factor' };

    default: {
      // Unknown types (ai-transition-model-* etc.) — pass through with entityType
      return { ...base, entityType: canonicalType };
    }
  }
}

// ============================================================================
// ORCHESTRATOR
// ============================================================================

/**
 * Transform all entities from raw database format to typed entities.
 *
 * @param {Array} entities - Raw entity array from database
 * @param {Array} pages - Pages array (needed for path-based type overrides)
 * @param {Array} experts - Experts array
 * @param {Array} organizations - Organizations array
 * @returns {Array} Transformed typed entities
 */
export function transformEntities(entities, pages, experts, organizations) {
  // Apply entity type overrides first
  const overriddenEntities = applyEntityOverrides(entities, pages);

  // Build lookup maps
  const expertMap = new Map((experts || []).map(e => [e.id, e]));
  const orgMap = new Map((organizations || []).map(o => [o.id, o]));

  // Transform each entity
  const typedEntities = [];
  for (const raw of overriddenEntities) {
    const typed = transformEntity(raw, expertMap, orgMap);
    if (typed) {
      typedEntities.push(typed);
    }
  }

  return typedEntities;
}
