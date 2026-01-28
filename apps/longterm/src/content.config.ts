import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Page Type System:
 *
 * - overview: Auto-detected from index.mdx filename. Navigation pages. Excluded from quality scoring.
 * - content: Default for all substantive pages. Full quality criteria (tables, citations, diagrams).
 * - stub: Explicitly marked. Intentionally minimal - placeholders, brief profiles, reference pointers. Excluded from quality scoring.
 * - documentation: Style guides, internal docs, examples. Excluded from content validation (may contain example code).
 *
 * Quality Rating Guide (0-100) - applies to 'content' pages only:
 *
 * 80-100 - Comprehensive: 2+ tables, diagrams, 5+ citations, quantified claims
 * 60-79  - Good: 1+ table, some citations (3+), mostly prose with numbers
 * 40-59  - Adequate: Good prose but lacks tables/citations, vague claims
 * 20-39  - Draft: Poorly structured, heavy bullets, no evidence
 * 0-19   - Stub: Minimal content, placeholder
 *
 * CRITICAL: No tables + no citations = max 55. Good prose alone ≠ high quality.
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
        // Model page ratings (1-5 scale)
        ratings: z.object({
          novelty: z.number().min(1).max(5).optional(),
          rigor: z.number().min(1).max(5).optional(),
          actionability: z.number().min(1).max(5).optional(),
          completeness: z.number().min(1).max(5).optional(),
          // Scenario ratings (0-100 scale)
          changeability: z.number().min(0).max(100).optional(),
          xriskImpact: z.number().min(0).max(100).optional(),
          trajectoryImpact: z.number().min(0).max(100).optional(),
          uncertainty: z.number().min(0).max(100).optional(),
        }).optional(),
        // Existing custom fields
        maturity: z.string().optional(),
        // Layout options
        fullWidth: z.boolean().optional(),
        // Entity ID for sidebar InfoBox (when filename doesn't match entity ID)
        entityId: z.string().optional(),
      }),
    }),
  }),
};
