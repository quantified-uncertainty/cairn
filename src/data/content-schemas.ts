/**
 * Content Generation Schemas
 *
 * These Zod schemas define the structure for LLM-generated content.
 * Used by the generation pipeline to validate structured YAML before
 * templating to MDX.
 *
 * Workflow:
 * 1. LLM generates YAML matching these schemas
 * 2. Validate with Zod
 * 3. Template to MDX using Handlebars
 * 4. Run full validation suite
 */

import { z } from 'zod';

// =============================================================================
// SHARED TYPES
// =============================================================================

const DateString = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'Date must be YYYY-MM or YYYY-MM-DD');

const RatingValue = z.number().int().min(1).max(5);

const ModelRatings = z.object({
  novelty: RatingValue.describe('1-5: How much does this add beyond existing frameworks?'),
  rigor: RatingValue.describe('1-5: How well-supported and internally consistent?'),
  actionability: RatingValue.describe('1-5: How useful for decision-making?'),
  completeness: RatingValue.describe('1-5: How thoroughly does it cover its domain?'),
});

const AssessmentLevel = z.enum(['Low', 'Medium', 'High', 'Very High', 'Critical']);
const EffectivenessLevel = z.enum(['Low', 'Medium', 'High']);
const GradeLevel = z.enum(['A', 'B', 'C', 'D', 'F']);

// =============================================================================
// MODEL CONTENT SCHEMA
// =============================================================================

/**
 * Schema for generating analytical model pages.
 * Follows style-guides/models.mdx requirements.
 */
export const ModelContentSchema = z.object({
  // Frontmatter
  frontmatter: z.object({
    title: z.string().min(10).max(100).describe('Descriptive title for the model'),
    description: z.string().min(50).max(300).describe('1-2 sentence summary of what this model analyzes'),
    quality: z.number().int().min(1).max(5).optional(),
    lastEdited: DateString,
    ratings: ModelRatings.optional(),
    reviewBy: DateString.optional().describe('When content should be reviewed'),
  }),

  // Entity metadata for entities.yaml
  entityId: z.string().regex(/^[a-z0-9-]+$/).describe('Kebab-case identifier'),

  // Overview section (2-3 paragraphs)
  overview: z.object({
    paragraphs: z.array(z.string().min(100).max(500))
      .min(2).max(3)
      .describe('2-3 paragraphs explaining the model\'s central insight'),
  }),

  // Conceptual framework with diagram
  conceptualFramework: z.object({
    diagram: z.object({
      type: z.enum(['flowchart', 'stateDiagram-v2', 'erDiagram', 'quadrantChart', 'timeline']),
      direction: z.enum(['TD', 'LR', 'TB']).default('TD'),
      content: z.string().describe('Raw Mermaid diagram content (nodes, edges, etc.)'),
    }),
    explanation: z.string().min(100).max(500).describe('Explanation of what the diagram shows'),
  }),

  // Quantitative analysis section
  quantitativeAnalysis: z.object({
    tables: z.array(z.object({
      caption: z.string().optional(),
      columns: z.array(z.string()).min(3).describe('At least 3 columns'),
      rows: z.array(z.record(z.string())).min(4).describe('At least 4 rows'),
    })).min(1),
    discussion: z.string().min(100).optional().describe('Discussion of the quantitative findings'),
  }),

  // Strategic importance (required for models)
  strategicImportance: z.object({
    magnitude: z.object({
      shareOfTotalRisk: z.string().describe('e.g., "5-15%"'),
      affectedPopulation: z.string().describe('Who/what is affected'),
      timeline: z.string().describe('When effects materialize'),
    }),
    comparativeRanking: z.array(z.object({
      riskCategory: z.string(),
      relativeImportance: z.enum(['Higher', 'Baseline', 'Lower']),
      reasoning: z.string(),
    })).min(2),
    resourceImplications: z.object({
      whoShouldWork: z.string(),
      suggestedAllocation: z.string(),
      comparativeAdvantage: z.string(),
    }),
    keyCruxes: z.array(z.object({
      condition: z.string().describe('If [X]...'),
      implication: z.string().describe('...then this becomes [more/less] important because [Y]'),
    })).min(2),
  }),

  // Limitations
  limitations: z.object({
    prose: z.string().min(150).describe('Flowing prose about what the model cannot do'),
    specificCaveats: z.array(z.string()).optional(),
  }),

  // Related models
  relatedModels: z.array(z.object({
    id: z.string(),
    relationship: z.string().describe('How this model relates to the other'),
  })).optional(),
});

export type ModelContent = z.infer<typeof ModelContentSchema>;

// =============================================================================
// RISK CONTENT SCHEMA
// =============================================================================

/**
 * Schema for generating risk pages.
 * Follows style-guides/risk-response-templates.mdx requirements.
 */
export const RiskContentSchema = z.object({
  frontmatter: z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(50).max(300),
    quality: z.number().int().min(1).max(5).optional(),
    lastEdited: DateString,
    reviewBy: DateString.optional(),
  }),

  entityId: z.string().regex(/^[a-z0-9-]+$/),

  // Overview (2-3 paragraphs)
  overview: z.object({
    paragraphs: z.array(z.string().min(80).max(400)).min(2).max(3),
  }),

  // Risk assessment table
  riskAssessment: z.object({
    severity: z.enum(['Low', 'Medium', 'High', 'Catastrophic']),
    severityNotes: z.string(),
    likelihood: z.object({
      level: z.string(),
      keyFactors: z.string(),
    }),
    timeline: z.object({
      when: z.string(),
      conditions: z.string(),
    }),
  }),

  // Cross-links to responses
  responsesCrossLinks: z.array(z.object({
    responseId: z.string().describe('Entity ID of the response'),
    responseName: z.string().describe('Display name'),
    mechanism: z.string().describe('How this response addresses the risk'),
    effectiveness: EffectivenessLevel,
  })).min(1),

  // Why this matters section
  whyThisMatters: z.string().min(200).describe('Detailed explanation of importance'),

  // Key uncertainties
  keyUncertainties: z.array(z.string().min(50)).min(2).describe('What we don\'t know'),
});

export type RiskContent = z.infer<typeof RiskContentSchema>;

// =============================================================================
// RESPONSE CONTENT SCHEMA
// =============================================================================

/**
 * Schema for generating response/intervention pages.
 * Follows style-guides/risk-response-templates.mdx requirements.
 */
export const ResponseContentSchema = z.object({
  frontmatter: z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(50).max(300),
    quality: z.number().int().min(1).max(5).optional(),
    lastEdited: DateString,
    reviewBy: DateString.optional(),
  }),

  entityId: z.string().regex(/^[a-z0-9-]+$/),

  // Overview (2-3 paragraphs)
  overview: z.object({
    paragraphs: z.array(z.string().min(80).max(400)).min(2).max(3),
  }),

  // Quick assessment table
  quickAssessment: z.object({
    tractability: AssessmentLevel,
    tractabilityNotes: z.string(),
    ifAlignmentHard: z.string().describe('Value if alignment is difficult'),
    ifAlignmentEasy: z.string().describe('Value if alignment is straightforward'),
    neglectedness: z.string(),
    grade: GradeLevel,
    gradeReasoning: z.string(),
  }),

  // Cross-links to risks
  risksAddressed: z.array(z.object({
    riskId: z.string(),
    riskName: z.string(),
    mechanism: z.string().describe('How this response addresses the risk'),
    effectiveness: EffectivenessLevel,
  })).min(1),

  // How it works
  howItWorks: z.object({
    mainContent: z.string().min(300).describe('Detailed explanation of the approach'),
    subsections: z.array(z.object({
      heading: z.string(),
      content: z.string().min(100),
    })).optional(),
  }),

  // Critical assessment
  criticalAssessment: z.object({
    limitations: z.string().min(100).describe('What this approach can and cannot do'),
    keyUncertainties: z.string().min(100),
    differentPerspectives: z.string().optional().describe('Where experts disagree'),
  }),

  // Getting involved (optional)
  gettingInvolved: z.string().optional().describe('Who might work on this'),
});

export type ResponseContent = z.infer<typeof ResponseContentSchema>;

// =============================================================================
// GENERATION HELPERS
// =============================================================================

/**
 * Format Zod schema as documentation for LLM prompts
 */
export function schemaToPromptDoc(schema: z.ZodTypeAny, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (schema instanceof z.ZodObject) {
    const shape = schema.shape;
    const lines: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const field = value as z.ZodTypeAny;
      const desc = field.description || '';
      const optional = field.isOptional() ? ' (optional)' : '';

      if (field instanceof z.ZodObject) {
        lines.push(`${prefix}${key}:${optional} ${desc}`);
        lines.push(schemaToPromptDoc(field, indent + 1));
      } else if (field instanceof z.ZodArray) {
        const element = (field as z.ZodArray<any>)._def.type;
        lines.push(`${prefix}${key}:${optional} array ${desc}`);
        if (element instanceof z.ZodObject) {
          lines.push(schemaToPromptDoc(element, indent + 1));
        }
      } else {
        lines.push(`${prefix}${key}:${optional} ${getTypeDescription(field)} ${desc}`);
      }
    }

    return lines.join('\n');
  }

  return '';
}

function getTypeDescription(field: z.ZodTypeAny): string {
  if (field instanceof z.ZodString) return 'string';
  if (field instanceof z.ZodNumber) return 'number';
  if (field instanceof z.ZodEnum) return `enum(${(field as z.ZodEnum<any>).options.join('|')})`;
  if (field instanceof z.ZodOptional) return getTypeDescription((field as z.ZodOptional<any>)._def.innerType);
  return 'unknown';
}

/**
 * Validate content against a schema, returning formatted errors
 */
export function validateContent<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(issue => {
    const path = issue.path.join('.');
    return `${path}: ${issue.message}`;
  });

  return { success: false, errors };
}
