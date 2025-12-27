/**
 * Data Schema for EA Crux Project
 *
 * This file defines TypeScript types and Zod schemas for all structured data.
 * Data lives in YAML files in src/data/ and is validated at build time.
 */

import { z } from 'zod';

// =============================================================================
// CORE ENUMS
// =============================================================================

export const Confidence = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof Confidence>;

export const Importance = z.enum(['low', 'medium', 'high', 'critical']);
export type Importance = z.infer<typeof Importance>;

export const OrgType = z.enum([
  'frontier-lab',      // OpenAI, Anthropic, DeepMind
  'safety-org',        // MIRI, ARC, Redwood
  'academic',          // FHI, CHAI, CAIS
  'government',        // UK AISI, US AISI
  'funder',            // Open Phil, SFF
  'policy',            // GovAI, CSET
]);
export type OrgType = z.infer<typeof OrgType>;

export const RiskCategory = z.enum([
  'accident',          // Misalignment, mesa-optimization
  'misuse',            // Bioweapons, cyberweapons
  'structural',        // Racing dynamics, lock-in
  'epistemic',         // Trust erosion, sycophancy at scale
]);
export type RiskCategory = z.infer<typeof RiskCategory>;

// =============================================================================
// EXPERTS (People)
// =============================================================================

export const ExpertPosition = z.object({
  topic: z.string(),                    // e.g., "p-doom", "alignment-difficulty", "timelines"
  view: z.string(),                     // Their position in words
  estimate: z.string().optional(),      // Quantified if available (e.g., "10-20%", "2030s")
  confidence: Confidence.optional(),
  date: z.string().optional(),          // When they stated this
  source: z.string().optional(),        // Title of source
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
export type ExpertPosition = z.infer<typeof ExpertPosition>;

export const Expert = z.object({
  id: z.string(),                       // e.g., "paul-christiano"
  name: z.string(),
  affiliation: z.string().optional(),   // Org ID reference
  role: z.string().optional(),
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  knownFor: z.array(z.string()).optional(),
  background: z.string().optional(),    // Brief bio
  positions: z.array(ExpertPosition).optional(),
});
export type Expert = z.infer<typeof Expert>;

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export const Organization = z.object({
  id: z.string(),                       // e.g., "anthropic"
  name: z.string(),
  type: OrgType,
  founded: z.string().optional(),       // Year
  headquarters: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  keyPeople: z.array(z.string()).optional(),  // Expert ID references
  funding: z.string().optional(),       // e.g., "$7B+"
  employees: z.string().optional(),     // e.g., "~1000"
  safetyFocus: z.string().optional(),   // Brief description of safety work
  parentOrg: z.string().optional(),     // Org ID for subsidiaries
});
export type Organization = z.infer<typeof Organization>;

// =============================================================================
// ESTIMATES
// =============================================================================

export const EstimateSource = z.object({
  source: z.string(),                   // Who made the estimate (expert ID or org name)
  value: z.string(),                    // The estimate value
  date: z.string().optional(),
  url: z.string().url().optional(),
  notes: z.string().optional(),
  confidence: Confidence.optional(),
});
export type EstimateSource = z.infer<typeof EstimateSource>;

export const Estimate = z.object({
  id: z.string(),                       // e.g., "p-tai-2030"
  variable: z.string(),                 // What's being estimated
  description: z.string().optional(),
  unit: z.string().optional(),          // e.g., "%", "years"
  aggregateRange: z.string().optional(), // Summary range
  category: z.string().optional(),      // e.g., "timelines", "risk", "alignment"
  estimates: z.array(EstimateSource),
  lastUpdated: z.string().optional(),
});
export type Estimate = z.infer<typeof Estimate>;

// =============================================================================
// CRUXES (Key Uncertainties)
// =============================================================================

export const CruxPosition = z.object({
  view: z.string(),
  probability: z.string().optional(),   // e.g., "40-60%"
  holders: z.array(z.string()).optional(), // Expert IDs or org names
  implications: z.string().optional(),
});
export type CruxPosition = z.infer<typeof CruxPosition>;

export const Crux = z.object({
  id: z.string(),                       // e.g., "alignment-difficulty"
  question: z.string(),
  domain: z.string().optional(),        // e.g., "Technical", "Governance"
  description: z.string().optional(),
  importance: Importance,
  resolvability: z.enum(['soon', 'years', 'decades', 'never']).optional(),
  currentState: z.string().optional(),
  positions: z.array(CruxPosition),
  wouldUpdateOn: z.array(z.string()).optional(),
  relatedCruxes: z.array(z.string()).optional(),  // Crux ID references
  relevantResearch: z.array(z.object({
    title: z.string(),
    url: z.string().url().optional(),
  })).optional(),
});
export type Crux = z.infer<typeof Crux>;

// =============================================================================
// RISKS (Failure Modes)
// =============================================================================

export const Risk = z.object({
  id: z.string(),                       // e.g., "deceptive-alignment"
  name: z.string(),
  category: RiskCategory,
  description: z.string().optional(),
  severity: Importance.optional(),
  likelihood: z.string().optional(),    // e.g., "medium", "high if no intervention"
  mechanisms: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),  // Risk IDs that must occur first
  mitigatedBy: z.array(z.string()).optional(),    // Intervention IDs
  relatedRisks: z.array(z.string()).optional(),
  keyPapers: z.array(z.string()).optional(),      // Source IDs
});
export type Risk = z.infer<typeof Risk>;

// =============================================================================
// INTERVENTIONS (Responses)
// =============================================================================

export const Intervention = z.object({
  id: z.string(),                       // e.g., "interpretability-research"
  name: z.string(),
  category: z.enum(['technical', 'governance', 'institutional', 'field-building', 'resilience']),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  addressesRisks: z.array(z.string()).optional(),  // Risk IDs
  organizations: z.array(z.string()).optional(),   // Org IDs working on this
  tractability: Importance.optional(),
  neglectedness: Importance.optional(),
  importance: Importance.optional(),
  timeHorizon: z.string().optional(),   // e.g., "1-3 years", "5+ years"
});
export type Intervention = z.infer<typeof Intervention>;

// =============================================================================
// GLOSSARY
// =============================================================================

export const GlossaryTerm = z.object({
  id: z.string(),                       // e.g., "agi"
  term: z.string(),                     // Display name
  aliases: z.array(z.string()).optional(),
  definition: z.string(),
  related: z.array(z.string()).optional(),  // Other term IDs
  seeAlso: z.array(z.string()).optional(),  // Page slugs
});
export type GlossaryTerm = z.infer<typeof GlossaryTerm>;

// =============================================================================
// TIMELINE EVENTS
// =============================================================================

export const TimelineEvent = z.object({
  id: z.string(),
  date: z.string(),                     // ISO date or "YYYY" or "YYYY-MM"
  title: z.string(),
  description: z.string().optional(),
  category: z.enum([
    'capability',       // Model releases, benchmarks
    'safety',           // Safety research milestones
    'governance',       // Policy, regulation
    'incident',         // Near-misses, problems
    'organization',     // Org founded, key hires
  ]),
  importance: Importance.optional(),
  actors: z.array(z.string()).optional(),  // Expert or org IDs
  url: z.string().url().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEvent>;

// =============================================================================
// SOURCES (Publications, Papers)
// =============================================================================

export const Source = z.object({
  id: z.string(),                       // e.g., "superintelligence-2014"
  title: z.string(),
  authors: z.array(z.string()).optional(),  // Expert IDs or names
  year: z.string().optional(),
  type: z.enum(['book', 'paper', 'blog', 'report', 'talk', 'podcast']).optional(),
  url: z.string().url().optional(),
  abstract: z.string().optional(),
  significance: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

// =============================================================================
// GRAPH RELATIONSHIPS (for RiskDependencyGraph)
// =============================================================================

export const GraphNode = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['crux', 'risk', 'outcome', 'capability', 'intervention']),
  description: z.string().optional(),
  entityRef: z.string().optional(),     // ID of the underlying entity
});
export type GraphNode = z.infer<typeof GraphNode>;

export const GraphEdge = z.object({
  from: z.string(),                     // Node ID
  to: z.string(),                       // Node ID
  type: z.enum(['causes', 'mitigates', 'requires', 'enables', 'blocks']),
  label: z.string().optional(),
  strength: Importance.optional(),
});
export type GraphEdge = z.infer<typeof GraphEdge>;

export const Graph = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
});
export type Graph = z.infer<typeof Graph>;

// =============================================================================
// ENTITIES (Generic knowledge base entries with InfoBox data)
// =============================================================================

export const EntityType = z.enum([
  'risk',
  'risk-factor',
  'capability',
  'safety-agenda',
  'intervention',  // Technical or policy interventions
  'policy',
  'organization',  // Generic organization
  'lab',           // AI lab (generic)
  'lab-frontier',
  'lab-research',
  'lab-startup',
  'lab-academic',
  'crux',
  'concept',       // Abstract concepts, ideas, or theoretical constructs
  'case-study',
  'researcher',
  'scenario',
  'resource',
  'funder',
  'historical',    // Historical era or timeline event
  'analysis',      // Analysis or comparison pages
  'model',         // Analytical model for risks/scenarios (has MDX content)
]);
export type EntityType = z.infer<typeof EntityType>;

export const RelationshipType = z.enum([
  'related',      // Generic relationship
  'causes',       // A causes B
  'mitigates',    // A reduces/prevents B
  'requires',     // A needs B to work
  'enables',      // A makes B possible
  'blocks',       // A prevents B
  'supersedes',   // A replaces B (for deprecated entries)
]);
export type RelationshipType = z.infer<typeof RelationshipType>;

export const RelatedEntry = z.object({
  id: z.string(),
  type: EntityType,
  relationship: RelationshipType.optional(),
  strength: z.enum(['weak', 'moderate', 'strong']).optional(),
});
export type RelatedEntry = z.infer<typeof RelatedEntry>;

export const CustomField = z.object({
  label: z.string(),
  value: z.string(),
});
export type CustomField = z.infer<typeof CustomField>;

export const EntitySource = z.object({
  title: z.string(),
  url: z.string().url().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
});
export type EntitySource = z.infer<typeof EntitySource>;

export const EntityStatus = z.enum(['stub', 'draft', 'published', 'verified']);
export type EntityStatus = z.infer<typeof EntityStatus>;

// Structured likelihood for risks
export const LikelihoodLevel = z.enum(['low', 'medium', 'medium-high', 'high', 'very-high', 'near-certain']);
export type LikelihoodLevel = z.infer<typeof LikelihoodLevel>;

export const LikelihoodStatus = z.enum(['theoretical', 'emerging', 'occurring', 'established']);
export type LikelihoodStatus = z.infer<typeof LikelihoodStatus>;

export const StructuredLikelihood = z.object({
  level: LikelihoodLevel,
  status: LikelihoodStatus.optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});
export type StructuredLikelihood = z.infer<typeof StructuredLikelihood>;

// Structured timeframe for risks
export const StructuredTimeframe = z.object({
  median: z.number(),                           // Year number (e.g., 2030)
  earliest: z.number().optional(),
  latest: z.number().optional(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});
export type StructuredTimeframe = z.infer<typeof StructuredTimeframe>;

// Maturity of research on a topic
export const ResearchMaturity = z.enum(['Neglected', 'Emerging', 'Growing', 'Mature']);
export type ResearchMaturity = z.infer<typeof ResearchMaturity>;

// =============================================================================
// CONTENT FRESHNESS TRACKING
// =============================================================================

/**
 * Freshness tracking for content pages.
 * These fields appear in MDX frontmatter to track content staleness.
 *
 * Usage in frontmatter:
 * ---
 * reviewBy: "2026-06-26"          # When content should be reviewed
 * contentDependencies:             # Entity IDs that affect this content
 *   - deceptive-alignment
 *   - mesa-optimization
 * lastReviewed: "2025-12-26"       # When last reviewed (optional)
 * reviewedBy: "ozzie"              # Who reviewed it (optional)
 * stalenessRisk: "low"             # How quickly this content might become stale
 * ---
 */
export const FreshnessConfig = z.object({
  reviewBy: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
  contentDependencies: z.array(z.string()).optional(),
  lastReviewed: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/).optional(),
  reviewedBy: z.string().optional(),
  stalenessRisk: z.enum(['low', 'medium', 'high']).optional(),
});
export type FreshnessConfig = z.infer<typeof FreshnessConfig>;

export const Entity = z.object({
  id: z.string(),
  type: EntityType,
  title: z.string(),
  // Core content fields
  description: z.string().optional(),           // 1-3 sentence summary
  aliases: z.array(z.string()).optional(),      // Alternative names for search
  // Metadata
  status: EntityStatus.optional(),              // Content maturity level
  lastUpdated: z.string().optional(),           // ISO date "2024-12"
  tags: z.array(z.string()).optional(),         // Standardized tags for filtering
  // InfoBox fields
  severity: z.enum(['low', 'medium', 'high', 'catastrophic']).optional(),
  // Likelihood can be string (legacy) or structured object
  likelihood: z.union([z.string(), StructuredLikelihood]).optional(),
  // Timeframe can be string (legacy) or structured object
  timeframe: z.union([z.string(), StructuredTimeframe]).optional(),
  maturity: ResearchMaturity.optional(),
  website: z.string().url().optional(),
  customFields: z.array(CustomField).optional(),
  // Relationships
  relatedTopics: z.array(z.string()).optional(),
  relatedEntries: z.array(RelatedEntry).optional(),
  // Sources
  sources: z.array(EntitySource).optional(),
});
export type Entity = z.infer<typeof Entity>;

// =============================================================================
// FULL DATABASE SCHEMA
// =============================================================================

export const Database = z.object({
  experts: z.array(Expert),
  organizations: z.array(Organization),
  estimates: z.array(Estimate),
  cruxes: z.array(Crux),
  risks: z.array(Risk),
  interventions: z.array(Intervention),
  glossary: z.array(GlossaryTerm),
  timeline: z.array(TimelineEvent),
  sources: z.array(Source),
  graphs: z.array(Graph),
  entities: z.array(Entity),
});
export type Database = z.infer<typeof Database>;
