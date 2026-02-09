/**
 * Data layer for longterm-next
 *
 * Reads database.json from the local data directory (copied from longterm via sync:data).
 * Entity type overrides can be applied locally without modifying the longterm source.
 * This runs at build time / server-component level only.
 *
 * Entities are validated and transformed into typed entities (discriminated union)
 * at load time via Zod schemas. See entity-schemas.ts for the schema definitions.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import {
  TypedEntitySchema,
  GenericEntitySchema,
  OLD_TYPE_MAP,
  OLD_LAB_TYPE_TO_ORG_TYPE,
  type TypedEntity,
  type GenericEntity,
  type RiskEntity,
  type OrganizationEntity,
  isRisk,
  isPerson,
  isOrganization,
  isPolicy,
} from "./entity-schemas";

// Path to the local data directory (database.json is synced here from longterm)
const LOCAL_DATA_DIR = path.resolve(process.cwd(), "src/data");

// Fallback: path to the longterm app's data (used if local copy doesn't exist)
const LONGTERM_DATA_DIR = path.resolve(process.cwd(), "../longterm/src/data");

// ============================================================================
// DATABASE LOADING
// ============================================================================

interface IdRegistryMaps {
  byNumericId: Record<string, string>; // E1 → slug
  bySlug: Record<string, string>; // slug → E1
}

export interface Fact {
  value?: string;
  numeric?: number;
  asOf?: string;
  source?: string;
  note?: string;
  noCompute?: boolean;
  compute?: string;
  format?: string;
  formatDivisor?: number;
  entity: string;
  factId: string;
  computed?: boolean;
}

/** Raw entity shape as stored in database.json (before transformation) */
interface RawEntity {
  id: string;
  type: string;
  title: string;
  description?: string;
  severity?: string;
  likelihood?: string | { level: string; status?: string; display?: string };
  timeframe?: string | { median: number; earliest?: number; latest?: number; display?: string };
  maturity?: string;
  website?: string;
  customFields?: { label: string; value: string; link?: string }[];
  relatedTopics?: string[];
  relatedEntries?: { id: string; type: string; relationship?: string }[];
  tags?: string[];
  lastUpdated?: string;
  sourceRefs?: string[];
  sources?: { title: string; url?: string; author?: string; date?: string }[];
  content?: unknown;
  numericId?: string;
  path?: string;
  status?: string;
  clusters?: string[];
  causeEffectGraph?: {
    title?: string;
    description?: string;
    nodes?: { id: string; [k: string]: unknown }[];
  };
}

interface DatabaseShape {
  entities: RawEntity[];
  resources: Resource[];
  publications: Publication[];
  experts: Expert[];
  organizations: Organization[];
  backlinks: Record<string, BacklinkEntry[]>;
  pathRegistry: Record<string, string>;
  idRegistry: IdRegistryMaps;
  pages: Page[];
  facts: Record<string, Fact>;
  insights: DatabaseInsight[];
  stats: Record<string, unknown>;
}

// ============================================================================
// ENTITY TYPE OVERRIDES
// Pages whose entity type should be remapped in longterm-next.
// This lets us reclassify entities without modifying the longterm source.
// ============================================================================

/**
 * Path patterns that should be treated as "project" type.
 * Matches against the page path or entity path.
 */
const PROJECT_PATH_PATTERNS = [
  "/knowledge-base/responses/epistemic-tools/tools/",
];

/**
 * Explicit entity ID → type overrides.
 */
const ENTITY_TYPE_OVERRIDES: Record<string, string> = {
  // Add individual overrides here as needed, e.g.:
  // "some-entity-id": "project",
};

function applyEntityOverrides(db: DatabaseShape): DatabaseShape {
  // Build a set of page IDs that match project path patterns
  const projectPageIds = new Set<string>();
  for (const page of db.pages || []) {
    if (PROJECT_PATH_PATTERNS.some(pattern => page.path?.includes(pattern))) {
      projectPageIds.add(page.id);
    }
  }

  // Apply overrides to entities
  const entities = (db.entities || []).map(entity => {
    // Check explicit overrides first
    if (ENTITY_TYPE_OVERRIDES[entity.id]) {
      return { ...entity, type: ENTITY_TYPE_OVERRIDES[entity.id] };
    }
    // Check path-based overrides
    if (projectPageIds.has(entity.id)) {
      return { ...entity, type: "project" };
    }
    return entity;
  });

  // Also create entities for pages in project paths that don't have entities yet
  const entityIds = new Set(entities.map(e => e.id));
  const newEntities: RawEntity[] = [];
  for (const page of db.pages || []) {
    if (projectPageIds.has(page.id) && !entityIds.has(page.id)) {
      newEntities.push({
        id: page.id,
        type: "project",
        title: page.title,
        description: page.llmSummary || page.description || undefined,
        tags: page.tags || [],
        lastUpdated: page.lastUpdated || undefined,
      });
    }
  }

  return {
    ...db,
    entities: [...entities, ...newEntities],
  };
}

// ============================================================================
// ENTITY TRANSFORMATION (raw → typed)
// ============================================================================

/**
 * Transform a raw database.json entity into a typed entity.
 * - Maps old type names to canonical entityType
 * - Flattens lab-* → organization with orgType
 * - Extracts customFields into typed fields for researcher → person, policy, etc.
 */
function transformEntity(
  raw: RawEntity,
  experts: Map<string, Expert>,
  orgs: Map<string, Organization>,
): TypedEntity | GenericEntity | null {
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
  const cf = (label: string): string | undefined =>
    raw.customFields?.find(f => f.label === label)?.value;

  // Remove extracted customFields from the passthrough list
  const filterCustomFields = (...labels: string[]) => {
    const labelSet = new Set(labels);
    return (raw.customFields || []).filter(f => !labelSet.has(f.label));
  };

  switch (canonicalType) {
    case "risk": {
      return {
        ...base,
        entityType: "risk" as const,
        // Zod safeParse validates these enum values; mismatches produce warnings
        severity: raw.severity as RiskEntity["severity"],
        likelihood: raw.likelihood,
        timeframe: raw.timeframe,
        maturity: raw.maturity as RiskEntity["maturity"],
        riskCategory: getRiskCategory(raw.id),
      };
    }

    case "person": {
      // Merge expert data if available
      const expert = experts.get(raw.id);
      const org = expert?.affiliation ? orgs.get(expert.affiliation) : null;
      const role = expert?.role || cf("Role");
      const knownForStr = cf("Known For");
      const knownFor = expert?.knownFor ||
        (knownForStr ? knownForStr.split(",").map(s => s.trim()).filter(Boolean) : []);
      const affiliation = org?.name || expert?.affiliation || cf("Affiliation");

      return {
        ...base,
        entityType: "person" as const,
        title: expert?.name || raw.title,
        website: expert?.website || raw.website,
        role,
        affiliation,
        knownFor,
        customFields: filterCustomFields("Role", "Known For", "Affiliation"),
      };
    }

    case "organization": {
      // Determine orgType from old lab-* type (values match OrganizationEntity["orgType"])
      const orgType = OLD_LAB_TYPE_TO_ORG_TYPE[oldType] as OrganizationEntity["orgType"] | undefined;
      // Merge org data if available
      const orgData = orgs.get(raw.id);
      return {
        ...base,
        entityType: "organization" as const,
        orgType: orgType || (orgData?.type as OrganizationEntity["orgType"]) || undefined,
        founded: orgData?.founded || cf("Founded") || cf("Established"),
        headquarters: orgData?.headquarters || cf("Location") || cf("Headquarters"),
        employees: orgData?.employees || cf("Employees"),
        funding: orgData?.funding || cf("Funding"),
        website: orgData?.website || raw.website,
        title: orgData?.name || raw.title,
        customFields: filterCustomFields("Founded", "Established", "Location", "Headquarters", "Employees", "Funding"),
      };
    }

    case "policy": {
      return {
        ...base,
        entityType: "policy" as const,
        introduced: cf("Introduced") || cf("Established"),
        policyStatus: cf("Status"),
        author: cf("Author"),
        scope: cf("Scope"),
        customFields: filterCustomFields("Introduced", "Established", "Status", "Author", "Scope"),
      };
    }

    case "approach":
      return { ...base, entityType: "approach" as const };
    case "safety-agenda":
      return { ...base, entityType: "safety-agenda" as const, goal: cf("Goal") };
    case "concept":
      return { ...base, entityType: "concept" as const };
    case "crux":
      return { ...base, entityType: "crux" as const };
    case "model":
      return { ...base, entityType: "model" as const };
    case "capability":
      return { ...base, entityType: "capability" as const };
    case "project":
      return { ...base, entityType: "project" as const };
    case "analysis":
      return { ...base, entityType: "analysis" as const };
    case "historical":
      return { ...base, entityType: "historical" as const };
    case "argument":
      return { ...base, entityType: "argument" as const };
    case "scenario":
      return { ...base, entityType: "scenario" as const };
    case "case-study":
      return { ...base, entityType: "case-study" as const };
    case "funder":
      return { ...base, entityType: "funder" as const };
    case "resource":
      return { ...base, entityType: "resource" as const };
    case "parameter":
      return { ...base, entityType: "parameter" as const };
    case "metric":
      return { ...base, entityType: "metric" as const };
    case "risk-factor":
      return { ...base, entityType: "risk-factor" as const };

    default: {
      // Unknown types (ai-transition-model-* etc.) — validated as generic entity
      const generic = GenericEntitySchema.safeParse({ ...base, entityType: canonicalType });
      return generic.success ? generic.data : { ...base, entityType: canonicalType };
    }
  }
}

// ============================================================================
// DATABASE LOADING
// ============================================================================

/** Union of fully-typed entities and generic (unknown-type) entities */
type AnyEntity = TypedEntity | GenericEntity;

let _database: DatabaseShape | null = null;
let _typedEntities: AnyEntity[] | null = null;

function getDatabase(): DatabaseShape {
  if (_database) return _database;

  // Try local copy first, fall back to longterm source
  const localDbPath = path.join(LOCAL_DATA_DIR, "database.json");
  const longtermDbPath = path.join(LONGTERM_DATA_DIR, "database.json");
  const dbPath = fs.existsSync(localDbPath) ? localDbPath : longtermDbPath;

  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    const rawDb = JSON.parse(raw) as DatabaseShape;
    _database = applyEntityOverrides(rawDb);
  } catch (err) {
    throw new Error(
      `Failed to load database from ${dbPath}: ${err instanceof Error ? err.message : err}. ` +
      `Run "pnpm --filter longterm-next sync:data" or "pnpm --filter longterm build:data" first.`
    );
  }
  return _database;
}

function getTypedEntities(): AnyEntity[] {
  if (_typedEntities) return _typedEntities;

  const db = getDatabase();
  const expertMap = new Map((db.experts || []).map(e => [e.id, e]));
  const orgMap = new Map((db.organizations || []).map(o => [o.id, o]));

  const entities: AnyEntity[] = [];
  const isDev = process.env.NODE_ENV === "development";

  for (const raw of db.entities || []) {
    const typed = transformEntity(raw, expertMap, orgMap);
    if (!typed) continue;

    // Build-time validation via Zod
    const result = TypedEntitySchema.safeParse(typed);
    if (!result.success) {
      if (isDev) {
        console.warn(
          `[entity-validation] ${raw.id} (${raw.type} → ${typed.entityType}): ${result.error.issues.map(i => i.message).join(", ")}`
        );
      }
      // Still include the entity — the generic fallback handles unknown types
      entities.push(typed);
    } else {
      entities.push(result.data);
    }
  }

  _typedEntities = entities;
  return _typedEntities;
}

// ============================================================================
// TYPES (re-exported for consumers)
// ============================================================================

// Re-export typed entity types for consumers
export type { TypedEntity, GenericEntity, RiskEntity, PersonEntity, OrganizationEntity, PolicyEntity } from "./entity-schemas";
export type { AnyEntity };
export { isRisk, isPerson, isOrganization, isPolicy } from "./entity-schemas";

/** @deprecated Use TypedEntity instead */
export interface Entity {
  id: string;
  type: string;
  title: string;
  description?: string;
  severity?: string;
  likelihood?: any;
  timeframe?: any;
  maturity?: string;
  website?: string;
  customFields?: { label: string; value: string; link?: string }[];
  relatedTopics?: string[];
  relatedEntries?: { id: string; type: string; relationship?: string }[];
  tags?: string[];
  lastUpdated?: string;
  sourceRefs?: string[];
  sources?: { title: string; url?: string; author?: string; date?: string }[];
  content?: any;
}

export interface Resource {
  id: string;
  url: string;
  title: string;
  authors?: string[];
  published_date?: string;
  type: string;
  summary?: string;
  tags?: string[];
  publication_id?: string;
  credibility_override?: number;
}

export interface Publication {
  id: string;
  name: string;
  type: string;
  credibility: number;
  peer_reviewed?: boolean;
  domains: string[];
  description?: string;
}

export interface Expert {
  id: string;
  name: string;
  affiliation?: string;
  role?: string;
  website?: string;
  knownFor?: string[];
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  funding?: string;
  employees?: string;
}

export interface BacklinkEntry {
  id: string;
  type: string;
  title: string;
  relationship?: string;
}

export interface Page {
  id: string;
  path: string;
  filePath: string;
  title: string;
  quality: number | null;
  importance: number | null;
  tractability: number | null;
  neglectedness: number | null;
  uncertainty: number | null;
  causalLevel: string | null;
  lastUpdated: string | null;
  llmSummary: string | null;
  description: string | null;
  ratings: {
    novelty?: number;
    rigor?: number;
    actionability?: number;
    completeness?: number;
  } | null;
  category: string;
  tags?: string[];
  clusters?: string[];
  wordCount?: number;
  backlinkCount?: number;
  metrics?: {
    wordCount: number;
    tableCount: number;
    diagramCount: number;
    internalLinks: number;
    externalLinks: number;
    bulletRatio: number;
    sectionCount: number;
    hasOverview: boolean;
    structuralScore: number;
  };
  suggestedQuality?: number;
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

// ============================================================================
// LOOKUP INDEXES (built lazily)
// ============================================================================

let _typedEntityIndex: Map<string, AnyEntity> | null = null;
let _resourceIndex: Map<string, Resource> | null = null;
let _publicationIndex: Map<string, Publication> | null = null;
let _expertIndex: Map<string, Expert> | null = null;
let _orgIndex: Map<string, Organization> | null = null;
let _pageIndex: Map<string, Page> | null = null;

function typedEntityIndex() {
  if (!_typedEntityIndex) {
    _typedEntityIndex = new Map(getTypedEntities().map(e => [e.id, e]));
  }
  return _typedEntityIndex;
}

function resourceIndex() {
  if (!_resourceIndex) {
    const db = getDatabase();
    _resourceIndex = new Map((db.resources || []).map((r) => [r.id, r]));
  }
  return _resourceIndex;
}

function publicationIndex() {
  if (!_publicationIndex) {
    const db = getDatabase();
    _publicationIndex = new Map(
      (db.publications || []).map((p) => [p.id, p])
    );
  }
  return _publicationIndex;
}

function expertIndex() {
  if (!_expertIndex) {
    const db = getDatabase();
    _expertIndex = new Map((db.experts || []).map((e) => [e.id, e]));
  }
  return _expertIndex;
}

function orgIndex() {
  if (!_orgIndex) {
    const db = getDatabase();
    _orgIndex = new Map((db.organizations || []).map((o) => [o.id, o]));
  }
  return _orgIndex;
}

function pageIndex() {
  if (!_pageIndex) {
    const db = getDatabase();
    _pageIndex = new Map((db.pages || []).map((p) => [p.id, p]));
  }
  return _pageIndex;
}

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/** Get a typed entity by ID (may be a generic entity for unknown types) */
export function getTypedEntityById(id: string): AnyEntity | undefined {
  return typedEntityIndex().get(id);
}

/** @deprecated Use getTypedEntityById for new code */
export function getEntityById(id: string): Entity | undefined {
  // Return typed entity cast to the old Entity interface for backward compat
  const typed = typedEntityIndex().get(id);
  if (!typed) return undefined;
  return {
    id: typed.id,
    type: typed.entityType,
    title: typed.title,
    description: typed.description,
    tags: typed.tags,
    relatedEntries: typed.relatedEntries,
    sources: typed.sources,
    lastUpdated: typed.lastUpdated,
    website: typed.website,
    customFields: typed.customFields,
    // Type-specific fields (spread them for backward compat)
    ...(isRisk(typed) ? {
      severity: typed.severity,
      likelihood: typed.likelihood,
      timeframe: typed.timeframe,
      maturity: typed.maturity,
    } : {}),
  };
}

export function getResourceById(id: string): Resource | undefined {
  return resourceIndex().get(id);
}

export function getPublicationById(id: string): Publication | undefined {
  return publicationIndex().get(id);
}

export function getExpertById(id: string): Expert | undefined {
  return expertIndex().get(id);
}

export function getOrganizationById(id: string): Organization | undefined {
  return orgIndex().get(id);
}

export function getPageById(id: string): Page | undefined {
  return pageIndex().get(id);
}

export function getAllPages(): Page[] {
  return getDatabase().pages || [];
}

export function getResourceCredibility(
  resource: Resource
): number | undefined {
  if (resource.credibility_override !== undefined) return resource.credibility_override;
  if (resource.publication_id) {
    const pub = getPublicationById(resource.publication_id);
    return pub?.credibility;
  }
  return undefined;
}

export function getResourcePublication(
  resource: Resource
): Publication | undefined {
  if (resource.publication_id) {
    return getPublicationById(resource.publication_id);
  }
  return undefined;
}

// ============================================================================
// PATH REGISTRY & ENTITY HREF
// ============================================================================

export function getEntityPath(id: string): string | null {
  const db = getDatabase();
  return db.pathRegistry?.[id] || db.pathRegistry?.[`__index__/${id}`] || null;
}

export function getIdRegistry(): IdRegistryMaps {
  return getDatabase().idRegistry;
}

export function getEntityHref(id: string, _type?: string): string {
  const registry = getIdRegistry();
  const numericId = registry.bySlug[id];
  return numericId ? `/wiki/${numericId}` : `/wiki/${id}`;
}

// ============================================================================
// BACKLINKS
// ============================================================================

export function getBacklinksFor(
  entityId: string
): Array<{
  id: string;
  type: string;
  title: string;
  href: string;
  relationship?: string;
}> {
  const db = getDatabase();
  const links = db.backlinks?.[entityId] || [];
  return links.map((link) => ({
    ...link,
    href: getEntityHref(link.id, link.type),
  }));
}

// ============================================================================
// CANONICAL FACTS
// ============================================================================

export function getFact(entityId: string, factId: string): Fact | undefined {
  const db = getDatabase();
  return db.facts?.[`${entityId}.${factId}`];
}

export function getFactValue(entityId: string, factId: string): string | undefined {
  return getFact(entityId, factId)?.value;
}

export function getFactsForEntity(entityId: string): Record<string, Fact> {
  const db = getDatabase();
  const result: Record<string, Fact> = {};
  for (const [key, fact] of Object.entries(db.facts || {})) {
    if (fact.entity === entityId) {
      result[fact.factId] = fact;
    }
  }
  return result;
}

export function getAllFacts(): Array<Fact & { key: string }> {
  const db = getDatabase();
  return Object.entries(db.facts || {}).map(([key, fact]) => ({
    ...fact,
    key,
  }));
}

// ============================================================================
// INFOBOX DATA HELPERS
// ============================================================================

export function getEntityInfoBoxData(entityId: string) {
  const entity = getTypedEntityById(entityId);
  if (!entity) return null;

  const resolvedRelatedEntries = entity.relatedEntries?.map((entry) => ({
    type: entry.type,
    title:
      getTypedEntityById(entry.id)?.title ||
      entry.id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    href: getEntityHref(entry.id, entry.type),
  }));

  // Resolve likelihood/timeframe to strings
  let likelihoodStr: string | undefined;
  let timeframeStr: string | undefined;
  let category: string | undefined;
  let maturity: string | undefined;
  let relatedSolutions: any[] | undefined;
  let severity: string | undefined;

  if (isRisk(entity)) {
    severity = entity.severity;
    category = entity.riskCategory;
    maturity = entity.maturity;
    if (entity.likelihood) {
      likelihoodStr =
        typeof entity.likelihood === "string"
          ? entity.likelihood
          : entity.likelihood?.display || entity.likelihood?.level;
    }
    if (entity.timeframe) {
      timeframeStr =
        typeof entity.timeframe === "string"
          ? entity.timeframe
          : entity.timeframe?.display || String(entity.timeframe?.median || "");
    }
    // Find related solutions
    const allEntities = getTypedEntities();
    relatedSolutions = [];
    for (const solution of allEntities) {
      if (
        solution.entityType === "safety-agenda" ||
        solution.entityType === "approach" ||
        solution.entityType === "project"
      ) {
        const linkedRisks =
          solution.relatedEntries?.filter((re) => re.type === "risk") || [];
        if (linkedRisks.some((r) => r.id === entity.id)) {
          relatedSolutions.push({
            id: solution.id,
            title: solution.title,
            type: solution.entityType,
            href: getEntityHref(solution.id, solution.entityType),
          });
        }
      }
    }
  }

  // Person-specific fields
  let affiliation: string | undefined;
  let role: string | undefined;
  let knownFor: string | undefined;

  if (isPerson(entity)) {
    affiliation = entity.affiliation;
    role = entity.role;
    knownFor = entity.knownFor?.join(", ");
  }

  // Organization-specific fields
  let founded: string | undefined;
  let location: string | undefined;
  let headcount: string | undefined;
  let funding: string | undefined;
  let orgType: string | undefined;

  if (isOrganization(entity)) {
    founded = entity.founded;
    location = entity.headquarters;
    headcount = entity.employees;
    funding = entity.funding;
    orgType = entity.orgType;
  }

  // Policy-specific fields
  let introduced: string | undefined;
  let policyStatus: string | undefined;
  let policyAuthor: string | undefined;
  let scope: string | undefined;

  if (isPolicy(entity)) {
    introduced = entity.introduced;
    policyStatus = entity.policyStatus;
    policyAuthor = entity.author;
    scope = entity.scope;
  }

  return {
    type: entity.entityType,
    title: entity.title,
    severity,
    likelihood: likelihoodStr,
    timeframe: timeframeStr,
    website: entity.website,
    customFields: entity.customFields,
    relatedTopics: entity.relatedTopics,
    relatedEntries: resolvedRelatedEntries,
    category,
    maturity,
    relatedSolutions,
    // Person
    affiliation,
    role,
    knownFor,
    // Organization
    founded,
    location,
    headcount,
    funding,
    orgType,
    // Policy
    introduced,
    policyStatus,
    policyAuthor,
    scope,
  };
}

/** @deprecated Use getEntityInfoBoxData with entityId for person entities */
export function getExpertInfoBoxData(expertId: string) {
  return getEntityInfoBoxData(expertId);
}

/** @deprecated Use getEntityInfoBoxData with entityId for organization entities */
export function getOrgInfoBoxData(orgId: string) {
  return getEntityInfoBoxData(orgId);
}

// ============================================================================
// RISK CATEGORIES (inline minimal version)
// ============================================================================

const RISK_CATEGORIES = {
  epistemic: [
    "authentication-collapse",
    "automation-bias",
    "consensus-manufacturing",
    "epistemic-collapse",
    "epistemic-sycophancy",
    "trust-cascade",
    "trust-decline",
  ],
  misuse: [
    "authoritarian-tools",
    "autonomous-weapons",
    "bioweapons",
    "cyberweapons",
    "deepfakes",
    "disinformation",
    "fraud",
    "surveillance",
  ],
  structural: [
    "concentration-of-power",
    "economic-disruption",
    "enfeeblement",
    "lock-in",
    "racing-dynamics",
    "winner-take-all",
  ],
} as const;

function getRiskCategory(
  riskId: string
): "epistemic" | "misuse" | "structural" | "accident" {
  if (
    (RISK_CATEGORIES.epistemic as readonly string[]).includes(riskId)
  )
    return "epistemic";
  if ((RISK_CATEGORIES.misuse as readonly string[]).includes(riskId))
    return "misuse";
  if (
    (RISK_CATEGORIES.structural as readonly string[]).includes(riskId)
  )
    return "structural";
  return "accident";
}

// ============================================================================
// EXTERNAL LINKS (loads YAML via fs)
// ============================================================================

export interface ExternalLinksData {
  wikipedia?: string;
  wikidata?: string;
  lesswrong?: string;
  alignmentForum?: string;
  eaForum?: string;
  stampy?: string;
  arbital?: string;
  eightyK?: string;
}

let _externalLinksMap: Map<string, ExternalLinksData> | null = null;

function loadExternalLinksMap(): Map<string, ExternalLinksData> {
  if (_externalLinksMap) return _externalLinksMap;

  try {
    const localYamlPath = path.join(LOCAL_DATA_DIR, "external-links.yaml");
    const longtermYamlPath = path.join(LONGTERM_DATA_DIR, "external-links.yaml");
    const yamlPath = fs.existsSync(localYamlPath) ? localYamlPath : longtermYamlPath;
    const raw = fs.readFileSync(yamlPath, "utf-8");
    const entries = yaml.load(raw) as Array<{
      pageId: string;
      links: ExternalLinksData;
    }>;
    _externalLinksMap = new Map();
    for (const entry of entries) {
      if (entry.pageId && entry.links) {
        _externalLinksMap.set(entry.pageId, entry.links);
      }
    }
    return _externalLinksMap;
  } catch {
    return new Map();
  }
}

export function getExternalLinks(
  pageId: string
): ExternalLinksData | undefined {
  return loadExternalLinksMap().get(pageId);
}

// ============================================================================
// EXPLORE PAGE DATA
// ============================================================================

export interface ExploreItem {
  id: string;
  numericId: string;
  title: string;
  type: string;
  description: string | null;
  tags: string[];
  clusters: string[];
  wordCount: number | null;
  quality: number | null;
  importance: number | null;
  category: string | null;
  riskCategory: string | null;
  lastUpdated: string | null;
  href?: string;
  meta?: string;
  sourceTitle?: string;
}

// Map page categories to entity-like types for display
const CATEGORY_TO_TYPE: Record<string, string> = {
  responses: "approach",
  organizations: "organization",
  people: "person",
  factors: "model",
  "intelligence-paradigms": "capability",
  models: "model",
  scenarios: "model",
  reports: "analysis",
  cruxes: "crux",
  worldviews: "concept",
  risks: "risk",
  forecasting: "model",
  "foundation-models": "capability",
  incidents: "historical",
  other: "concept",
};

// MANUAL MAINTENANCE: This table list is hardcoded because table metadata
// (row/col counts, descriptions) is not included in database.json.
// Update these values when tables change in the Astro app's ContentHub.
// TODO: Include table metadata in build-data.mjs output to automate this.
const TABLES = [
  {
    id: "safety-approaches",
    title: "Safety Approaches",
    description: "Safety research effectiveness vs capability uplift.",
    href: "/knowledge-base/responses/safety-approaches/table",
    path: "/knowledge-base/responses/safety-approaches",
    rows: 42,
    cols: 9,
  },
  {
    id: "safety-generalizability",
    title: "Safety Generalizability",
    description: "Safety approaches across AI architectures.",
    href: "/knowledge-base/responses/safety-generalizability/table",
    path: "/knowledge-base/responses/safety-generalizability",
    rows: 42,
    cols: 8,
  },
  {
    id: "safety-matrix",
    title: "Safety × Architecture Matrix",
    description: "Safety approaches vs architecture scenarios.",
    href: "/knowledge-base/responses/safety-generalizability/matrix",
    path: "/knowledge-base/responses/safety-generalizability",
    rows: 42,
    cols: 12,
  },
  {
    id: "architecture-scenarios",
    title: "Architecture Scenarios",
    description: "Deployment patterns and base architectures.",
    href: "/knowledge-base/architecture-scenarios/table",
    path: "/knowledge-base/architecture-scenarios",
    rows: 12,
    cols: 7,
  },
  {
    id: "deployment-architectures",
    title: "Deployment Architectures",
    description: "How AI systems are deployed.",
    href: "/knowledge-base/deployment-architectures/table",
    path: "/knowledge-base/deployment-architectures",
    rows: 8,
    cols: 6,
  },
  {
    id: "accident-risks",
    title: "Accident Risks",
    description: "Accident and misalignment risks.",
    href: "/knowledge-base/risks/accident/table",
    path: "/knowledge-base/risks/accident",
    rows: 16,
    cols: 7,
  },
  {
    id: "eval-types",
    title: "Evaluation Types",
    description: "Evaluation methodologies comparison.",
    href: "/knowledge-base/models/eval-types/table",
    path: "/knowledge-base/models/eval-types",
    rows: 18,
    cols: 8,
  },
  {
    id: "transition-model",
    title: "AI Transition Model Parameters",
    description: "All AI Transition Model parameters.",
    href: "/ai-transition-model/table",
    path: "/ai-transition-model",
    rows: 45,
    cols: 6,
  },
];

// Insight shape as stored in database.json
interface DatabaseInsight {
  id: string;
  insight: string;
  source: string;
  tags: string[];
  type: string;
  surprising: number;
  important: number;
  actionable: number;
  neglected: number;
  compact: number;
  added: string;
  composite?: number | null;
}

export function getExploreItems(): ExploreItem[] {
  const db = getDatabase();
  const typedEntities = getTypedEntities();
  const pageMap = new Map((db.pages || []).map((p) => [p.id, p]));
  const entityIds = new Set(typedEntities.map((e) => e.id));

  // Build cluster lookup from pages (for tables/insights)
  const pageClusterMap = new Map<string, string[]>();
  const pageTitleMap = new Map<string, string>();
  for (const page of db.pages || []) {
    pageClusterMap.set(page.path, page.clusters || []);
    pageTitleMap.set(page.path, page.title);
    if (!page.path.endsWith("/")) {
      pageClusterMap.set(page.path + "/", page.clusters || []);
      pageTitleMap.set(page.path + "/", page.title);
    }
  }

  // Items from typed entities
  const entityItems: ExploreItem[] = typedEntities.map((entity) => {
    const page = pageMap.get(entity.id);
    return {
      id: entity.id,
      numericId: entity.numericId || db.idRegistry?.bySlug[entity.id] || entity.id,
      title: entity.title,
      type: entity.entityType,
      description: page?.llmSummary || page?.description || entity.description || null,
      tags: entity.tags || [],
      clusters: entity.clusters?.length ? entity.clusters : (page?.clusters || []),
      wordCount: page?.wordCount ?? null,
      quality: page?.quality ?? null,
      importance: page?.importance ?? null,
      category: page?.category ?? null,
      riskCategory: isRisk(entity) ? (entity.riskCategory || null) : null,
      lastUpdated: page?.lastUpdated ?? null,
    };
  });

  // Items from pages that have no entity
  const pageOnlyItems: ExploreItem[] = (db.pages || [])
    .filter((p) => !entityIds.has(p.id))
    .filter((p) => p.title && p.category !== "schema")
    .map((page) => ({
      id: page.id,
      numericId: db.idRegistry?.bySlug[page.id] || page.id,
      title: page.title,
      type: CATEGORY_TO_TYPE[page.category] || "concept",
      description: page.llmSummary || page.description || null,
      tags: page.tags || [],
      clusters: page.clusters || [],
      wordCount: page.wordCount ?? null,
      quality: page.quality ?? null,
      importance: page.importance ?? null,
      category: page.category ?? null,
      riskCategory: null,
      lastUpdated: page.lastUpdated ?? null,
    }));

  // Table items
  const tableItems: ExploreItem[] = TABLES.map((table) => ({
    id: `table-${table.id}`,
    numericId: `table-${table.id}`,
    title: table.title,
    type: "table",
    description: table.description,
    tags: [],
    clusters: pageClusterMap.get(table.path) || ["ai-safety"],
    wordCount: null,
    quality: null,
    importance: null,
    category: null,
    riskCategory: null,
    lastUpdated: null,
    href: table.href,
    meta: `${table.rows} × ${table.cols}`,
  }));

  // Diagram items
  const diagramItems: ExploreItem[] = (db.entities || [])
    .filter((e) => (e.causeEffectGraph?.nodes?.length ?? 0) > 0)
    .map((e) => {
      const nodeCount = e.causeEffectGraph?.nodes?.length || 0;
      return {
        id: `diagram-${e.id}`,
        numericId: `diagram-${e.id}`,
        title: e.causeEffectGraph?.title || e.title,
        type: "diagram",
        description: e.causeEffectGraph?.description || `Cause-effect diagram for ${e.title}`,
        tags: [],
        clusters: ["ai-safety"],
        wordCount: null,
        quality: null,
        importance: null,
        category: null,
        riskCategory: null,
        lastUpdated: e.lastUpdated || null,
        href: `/diagrams/${e.id}`,
        meta: `${nodeCount} nodes`,
      };
    });

  // Insight items
  const insightItems: ExploreItem[] = (db.insights || []).map((insight) => {
    const sourcePath = insight.source || "/insight-hunting";
    const parentClusters =
      pageClusterMap.get(sourcePath) ||
      pageClusterMap.get(sourcePath + "/") ||
      ["ai-safety"];
    const sourceTitle =
      pageTitleMap.get(sourcePath) ||
      pageTitleMap.get(sourcePath + "/") ||
      undefined;
    return {
      id: `insight-${insight.id}`,
      numericId: `insight-${insight.id}`,
      title: insight.insight,
      type: "insight",
      description: insight.insight,
      tags: insight.tags || [],
      clusters: parentClusters,
      wordCount: null,
      quality: insight.composite || null,
      importance: insight.composite || null,
      category: null,
      riskCategory: null,
      lastUpdated: null,
      href: sourcePath,
      meta: insight.composite?.toFixed(1) || undefined,
      sourceTitle,
    };
  });

  return [...entityItems, ...pageOnlyItems, ...tableItems, ...diagramItems, ...insightItems];
}
