/**
 * Data layer for longterm-next
 *
 * Reads database.json from the longterm app's build output via fs.
 * This runs at build time / server-component level only.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// Path to the longterm app's built data
const LONGTERM_DATA_DIR = path.resolve(
  process.cwd(),
  "../longterm/src/data"
);

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

interface DatabaseShape {
  entities: Entity[];
  resources: Resource[];
  publications: Publication[];
  experts: Expert[];
  organizations: Organization[];
  backlinks: Record<string, BacklinkEntry[]>;
  pathRegistry: Record<string, string>;
  idRegistry: IdRegistryMaps;
  pages: Page[];
  facts: Record<string, Fact>;
  stats: any;
  [key: string]: any;
}

let _database: DatabaseShape | null = null;

function getDatabase(): DatabaseShape {
  if (_database) return _database;

  const dbPath = path.join(LONGTERM_DATA_DIR, "database.json");
  try {
    const raw = fs.readFileSync(dbPath, "utf-8");
    _database = JSON.parse(raw) as DatabaseShape;
  } catch (err) {
    throw new Error(
      `Failed to load database from ${dbPath}: ${err instanceof Error ? err.message : err}. ` +
      `Run "pnpm --filter longterm build:data" first.`
    );
  }
  return _database;
}

// ============================================================================
// TYPES (minimal subset needed for wiki components)
// ============================================================================

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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
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
  [key: string]: any;
}

// ============================================================================
// LOOKUP INDEXES (built lazily)
// ============================================================================

let _entityIndex: Map<string, Entity> | null = null;
let _resourceIndex: Map<string, Resource> | null = null;
let _publicationIndex: Map<string, Publication> | null = null;
let _expertIndex: Map<string, Expert> | null = null;
let _orgIndex: Map<string, Organization> | null = null;
let _pageIndex: Map<string, Page> | null = null;

function entityIndex() {
  if (!_entityIndex) {
    const db = getDatabase();
    _entityIndex = new Map((db.entities || []).map((e) => [e.id, e]));
  }
  return _entityIndex;
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

export function getEntityById(id: string): Entity | undefined {
  return entityIndex().get(id);
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

export function getResourceCredibility(
  resource: Resource
): number | undefined {
  if (resource.credibility_override) return resource.credibility_override;
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
  return db.pathRegistry?.[id] || null;
}

export function getIdRegistry(): IdRegistryMaps {
  return getDatabase().idRegistry;
}

export function getEntityHref(id: string, _type?: string): string {
  const registry = getIdRegistry();
  const numericId = registry.bySlug[id];
  return numericId ? `/explore/${numericId}` : `/explore/${id}`;
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

/**
 * Get a specific canonical fact by entity ID and fact ID.
 */
export function getFact(entityId: string, factId: string): Fact | undefined {
  const db = getDatabase();
  return db.facts?.[`${entityId}.${factId}`];
}

/**
 * Get just the display value for a canonical fact.
 */
export function getFactValue(entityId: string, factId: string): string | undefined {
  return getFact(entityId, factId)?.value;
}

/**
 * Get all canonical facts for an entity, keyed by factId.
 */
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

// ============================================================================
// INFOBOX DATA HELPERS
// ============================================================================

export function getExpertInfoBoxData(expertId: string) {
  const expert = getExpertById(expertId);
  if (!expert) return null;
  const org = expert.affiliation
    ? getOrganizationById(expert.affiliation)
    : null;
  return {
    type: "researcher" as const,
    title: expert.name,
    affiliation: org?.name || expert.affiliation,
    role: expert.role,
    website: expert.website,
    knownFor: expert.knownFor?.join(", "),
  };
}

export function getOrgInfoBoxData(orgId: string) {
  const org = getOrganizationById(orgId);
  if (!org) return null;
  return {
    type:
      org.type === "frontier-lab"
        ? ("lab-frontier" as const)
        : org.type === "safety-org"
          ? ("lab-research" as const)
          : org.type === "academic"
            ? ("lab-academic" as const)
            : ("lab" as const),
    title: org.name,
    founded: org.founded,
    location: org.headquarters,
    headcount: org.employees,
    funding: org.funding,
    website: org.website,
  };
}

export function getEntityInfoBoxData(entityId: string) {
  const entity = getEntityById(entityId);
  if (!entity) return null;

  const resolvedRelatedEntries = entity.relatedEntries?.map((entry) => ({
    type: entry.type,
    title:
      getEntityById(entry.id)?.title ||
      entry.id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    href: getEntityHref(entry.id, entry.type),
  }));

  // For researchers, merge expert data
  if (entity.type === "researcher") {
    const expert = getExpertById(entityId);
    if (expert) {
      const org = expert.affiliation
        ? getOrganizationById(expert.affiliation)
        : null;
      return {
        type: entity.type,
        title: expert.name,
        affiliation: org?.name || expert.affiliation,
        role: expert.role,
        website: expert.website || entity.website,
        knownFor: expert.knownFor?.join(", "),
        customFields: entity.customFields,
        relatedTopics: entity.relatedTopics,
        relatedEntries: resolvedRelatedEntries,
      };
    }
  }

  // Resolve likelihood/timeframe to strings
  let likelihoodStr: string | undefined;
  if (entity.likelihood) {
    likelihoodStr =
      typeof entity.likelihood === "string"
        ? entity.likelihood
        : entity.likelihood?.display || entity.likelihood?.level;
  }
  let timeframeStr: string | undefined;
  if (entity.timeframe) {
    timeframeStr =
      typeof entity.timeframe === "string"
        ? entity.timeframe
        : entity.timeframe?.display || String(entity.timeframe?.median || "");
  }

  // Risk category
  let category: string | undefined;
  let maturity: string | undefined;
  let relatedSolutions: any[] | undefined;
  if (entity.type === "risk") {
    category = getRiskCategory(entity.id);
    maturity = entity.maturity;
    const db = getDatabase();
    const solutionEntities = (db.entities || []).filter(
      (e) => e.type === "safety-agenda" || e.type === "intervention"
    );
    relatedSolutions = [];
    for (const solution of solutionEntities) {
      const linkedRisks =
        solution.relatedEntries?.filter((re) => re.type === "risk") || [];
      if (linkedRisks.some((r) => r.id === entity.id)) {
        relatedSolutions.push({
          id: solution.id,
          title: solution.title,
          type: solution.type,
          href: getEntityHref(solution.id, solution.type),
        });
      }
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
    category,
    maturity,
    relatedSolutions,
  };
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
    const yamlPath = path.join(LONGTERM_DATA_DIR, "external-links.yaml");
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
}

// Map page categories to entity-like types for display
const CATEGORY_TO_TYPE: Record<string, string> = {
  responses: "intervention",
  organizations: "organization",
  people: "researcher",
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

export function getExploreItems(): ExploreItem[] {
  const db = getDatabase();
  const pageMap = new Map((db.pages || []).map((p) => [p.id, p]));
  const entityIds = new Set((db.entities || []).map((e) => e.id));

  // Items from entities (as before)
  const entityItems: ExploreItem[] = (db.entities || []).map((entity) => {
    const page = pageMap.get(entity.id);
    return {
      id: entity.id,
      numericId: (entity as any).numericId || db.idRegistry?.bySlug[entity.id] || entity.id,
      title: entity.title,
      type: entity.type,
      description: page?.llmSummary || page?.description || entity.description || null,
      tags: entity.tags || [],
      clusters: page?.clusters || [],
      wordCount: page?.wordCount || null,
      quality: page?.quality || null,
      importance: page?.importance || null,
      category: page?.category || null,
      riskCategory: entity.type === "risk" ? getRiskCategory(entity.id) : null,
    };
  });

  // Items from pages that have no entity — these are content pages without structured data
  const pageOnlyItems: ExploreItem[] = (db.pages || [])
    .filter((p) => !entityIds.has(p.id))
    .filter((p) => p.title && p.category !== "schema") // skip schema/index pages
    .map((page) => ({
      id: page.id,
      numericId: db.idRegistry?.bySlug[page.id] || page.id, // fall back to slug
      title: page.title,
      type: CATEGORY_TO_TYPE[page.category] || "concept",
      description: page.llmSummary || page.description || null,
      tags: page.tags || [],
      clusters: page.clusters || [],
      wordCount: page.wordCount || null,
      quality: page.quality || null,
      importance: page.importance || null,
      category: page.category || null,
      riskCategory: null,
    }));

  return [...entityItems, ...pageOnlyItems];
}
