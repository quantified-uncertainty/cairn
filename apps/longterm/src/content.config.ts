import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Page Type System:
 *
 * - overview: Auto-detected from index.mdx filename. Navigation pages. Excluded from quality scoring.
 * - content: Default for all substantive pages. Full quality criteria.
 * - stub: Explicitly marked. Intentionally minimal. Excluded from quality scoring.
 * - documentation: Style guides, internal docs, examples. Excluded from content validation.
 *
 * Content Type System (for rating calibration):
 *
 * - reference: Factual coverage (orgs, people, risks, responses). Prioritizes accuracy, completeness.
 * - analysis: Original research/models. Prioritizes focus, concreteness, novelty.
 * - explainer: Educational content. Prioritizes clarity, completeness.
 *
 * Quality System:
 *
 * Seven subscores (0-10 scale, harsh - 7+ is exceptional):
 *
 * Core ratings (all content types):
 * - focus: Does it answer the question its title implies? (3-4 = drifts from topic, 5-6 = mostly on-topic, 7+ = laser-focused on claimed subject)
 * - novelty: Value-add beyond obvious sources (3-4 = summary of sources, 5-6 = some original synthesis, 7+ = genuinely new insight or framing)
 * - rigor: Evidence quality (3-4 = mixed sourcing, 5-6 = mostly sourced, 7+ = fully sourced with quantification)
 * - completeness: Covers what the TITLE promises, not just "has content" (3-4 = misses key aspects, 5-6 = covers main points, 7+ = thorough on claimed topic)
 * - objectivity: Epistemic honesty, language neutrality, analytical tone, no editorial artifacts (3-4 = insider jargon/false certainty/correction artifacts, 5-6 = mostly neutral, 7+ = fully accessible, honest about uncertainty, reads as polished final product). See /internal/common-writing-principles/
 *
 * Analysis-weighted ratings (critical for analysis/model pages):
 * - concreteness: Specific recommendations/numbers/examples vs. abstract hand-waving (3-4 = vague generalities, 5-6 = some specifics, 7+ = concrete actionable details)
 * - actionability: Can reader make different decisions after reading? (3-4 = no clear implications, 5-6 = some takeaways, 7+ = clear "do X not Y" guidance)
 *
 * Automated metrics:
 * - wordCount: Prose words (excluding tables)
 * - citations: Count of sources
 * - tables: Count of data tables
 * - diagrams: Count of diagrams/figures
 *
 * Derived quality (0-100): Computed from subscores avg * 6 + length bonus + evidence bonus
 * For analysis pages: focus and concreteness weighted 1.5x
 */
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Page type: 'stub' for minimal pages, 'documentation' for style guides/examples
        pageType: z.enum(['content', 'stub', 'documentation']).optional(),
        // Content type: determines rating weight calibration (see Quality System above)
        contentType: z.enum(['reference', 'analysis', 'explainer']).optional(),
        // Editorial metadata for PageStatus (0-100 scale, see rating guide above)
        quality: z.number().min(0).max(100).optional(),
        importance: z.number().min(0).max(100).optional(),
        // ITN framework fields (0-100 scale) - primarily for parameters
        tractability: z.number().min(0).max(100).optional(),
        neglectedness: z.number().min(0).max(100).optional(),
        uncertainty: z.number().min(0).max(100).optional(), // Higher = more uncertain
        llmSummary: z.string().optional(),
        lastEdited: z.string().optional(),
        todo: z.string().optional(),
        todos: z.array(z.string()).optional(),
        // Reference to primary page (for reference-style stubs)
        seeAlso: z.string().optional(),
        // Content quality ratings (0-10 scale, harsh - 7+ is exceptional)
        ratings: z.object({
          // Core ratings (all content types)
          focus: z.number().min(0).max(10).optional(), // Does it answer what title promises?
          novelty: z.number().min(0).max(10).optional(), // Value-add beyond obvious sources
          rigor: z.number().min(0).max(10).optional(), // Evidence quality and precision
          completeness: z.number().min(0).max(10).optional(), // Covers what TITLE promises
          objectivity: z.number().min(0).max(10).optional(), // Epistemic honesty, language neutrality, analytical tone
          // Analysis-weighted ratings (critical for analysis/model pages)
          concreteness: z.number().min(0).max(10).optional(), // Specific vs. abstract
          actionability: z.number().min(0).max(10).optional(), // Can reader act differently?
          // Scenario ratings (0-100 scale) - for AI Transition Model pages
          changeability: z.number().min(0).max(100).optional(),
          xriskImpact: z.number().min(0).max(100).optional(),
          trajectoryImpact: z.number().min(0).max(100).optional(),
          uncertainty: z.number().min(0).max(100).optional(),
        }).optional(),
        // Automated content metrics
        metrics: z.object({
          wordCount: z.number().optional(),
          citations: z.number().optional(),
          tables: z.number().optional(),
          diagrams: z.number().optional(),
        }).optional(),
        // Existing custom fields
        maturity: z.string().optional(),
        // Layout options
        fullWidth: z.boolean().optional(),
        // Entity ID for sidebar InfoBox (when filename doesn't match entity ID)
        entityId: z.string().optional(),
        // Roles for people pages (e.g., ['funder', 'researcher', 'entrepreneur'])
        roles: z.array(z.string()).optional(),
        // Topic clusters for filtering (pages can belong to multiple)
        // - ai-safety: Relevant for AI safety/alignment (default if not specified)
        // - biorisks: Relevant for biosecurity, pandemics, bioweapons
        // - cyber: Relevant for cybersecurity, hacking, digital threats
        // - epistemics: Relevant for forecasting, truth, deception, worldviews
        // - governance: Relevant for policy, regulation, international coordination
        // - community: Relevant for field-building, funding, careers, orgs
        clusters: z.array(z.enum([
          'ai-safety',
          'biorisks',
          'cyber',
          'epistemics',
          'governance',
          'community',
        ])).optional(),
      }),
    }),
  }),
};
