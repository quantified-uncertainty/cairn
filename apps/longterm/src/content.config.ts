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
 * Quality System:
 *
 * Four subscores (0-10 scale, harsh - 7+ is exceptional):
 * - novelty: Originality of content (3-4 = accurate summary, 5-6 = some original framing, 7+ = significant original insight)
 * - rigor: Evidence and precision (3-4 = mixed sourcing, 5-6 = mostly sourced, 7+ = fully sourced with quantification)
 * - actionability: Decision usefulness (3-4 = abstract, 5-6 = some actionable takeaways, 7+ = concrete guidance)
 * - completeness: Coverage (3-4 = notable gaps, 5-6 = covers main points, 7+ = thorough coverage)
 *
 * Automated metrics:
 * - wordCount: Prose words (excluding tables)
 * - citations: Count of sources
 * - tables: Count of data tables
 * - diagrams: Count of diagrams/figures
 *
 * Derived quality (0-100): Computed from subscores avg * 6 + length bonus + evidence bonus
 */
export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Page type: 'stub' for minimal pages, 'documentation' for style guides/examples
        pageType: z.enum(['content', 'stub', 'documentation']).optional(),
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
          novelty: z.number().min(0).max(10).optional(),
          rigor: z.number().min(0).max(10).optional(),
          actionability: z.number().min(0).max(10).optional(),
          completeness: z.number().min(0).max(10).optional(),
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
      }),
    }),
  }),
};
