/**
 * Page Template Definitions
 *
 * Templates define the expected structure and components for different page types.
 * Each template specifies:
 * - Required frontmatter fields
 * - Required and optional sections (with scoring weights)
 * - Quality criteria for evaluation
 * - Reference to the corresponding style guide
 *
 * STYLE GUIDES:
 * Templates reference style guides in /internal/ that provide detailed writing guidance:
 * - /internal/risk-style-guide/ - Risk pages
 * - /internal/response-style-guide/ - Response/intervention pages
 * - /internal/ai-transition-model-style-guide/ - ATM factor/scenario/parameter pages
 * - /internal/models-style-guide/ - Analytical model pages
 *
 * DATA ARCHITECTURE:
 * - YAML (parameter-graph.yaml) is the single source of truth for AI Transition Model metadata
 *   (ratings, descriptions, scope, keyDebates, relatedContent)
 * - MDX files contain only: title (for SEO/sidebar) and custom prose content
 * - Components read from YAML via parameter-graph-data.ts functions
 *
 * Pages can optionally declare which template they follow via `pageTemplate` frontmatter field.
 * (We use `pageTemplate` instead of `template` to avoid conflicts with Starlight's built-in template field.)
 */

export type TemplateId =
  | 'ai-transition-model-factor'
  | 'ai-transition-model-scenario'
  | 'ai-transition-model-outcome'
  | 'ai-transition-model-sub-item'
  | 'ai-transition-model-parameter'
  | 'knowledge-base-risk'
  | 'knowledge-base-response'
  | 'knowledge-base-model'
  | 'knowledge-base-concept'
  | 'knowledge-base-organization'
  | 'knowledge-base-person';

/**
 * URL path patterns for suggesting templates based on file location
 */
export const TEMPLATE_PATH_PATTERNS: Array<{ pattern: RegExp; templateId: TemplateId; priority: number }> = [
  // AI Transition Model patterns (more specific first)
  { pattern: /^ai-transition-model\/factors\/[^/]+\/index\.mdx$/, templateId: 'ai-transition-model-factor', priority: 100 },
  { pattern: /^ai-transition-model\/scenarios\/[^/]+\/index\.mdx$/, templateId: 'ai-transition-model-scenario', priority: 100 },
  { pattern: /^ai-transition-model\/outcomes\/[^/]+\.mdx$/, templateId: 'ai-transition-model-outcome', priority: 90 },
  { pattern: /^ai-transition-model\/parameters\/[^/]+\.mdx$/, templateId: 'ai-transition-model-parameter', priority: 90 },
  { pattern: /^ai-transition-model\/(factors|scenarios)\/[^/]+\/[^/]+\.mdx$/, templateId: 'ai-transition-model-sub-item', priority: 80 },

  // Knowledge Base patterns
  { pattern: /^knowledge-base\/risks\/.*\.mdx$/, templateId: 'knowledge-base-risk', priority: 70 },
  { pattern: /^knowledge-base\/responses\/.*\.mdx$/, templateId: 'knowledge-base-response', priority: 70 },
  { pattern: /^knowledge-base\/models\/.*\.mdx$/, templateId: 'knowledge-base-model', priority: 70 },
  { pattern: /^knowledge-base\/concepts\/.*\.mdx$/, templateId: 'knowledge-base-concept', priority: 70 },
  { pattern: /^knowledge-base\/organizations\/.*\.mdx$/, templateId: 'knowledge-base-organization', priority: 70 },
  { pattern: /^knowledge-base\/people\/.*\.mdx$/, templateId: 'knowledge-base-person', priority: 70 },
];

export interface TemplateSection {
  id: string;
  label: string;
  /** Alternative labels that match this section (case-insensitive) */
  alternateLabels?: string[];
  required: boolean;
  description: string;
  /** Weight for scoring (0-100, default 10) */
  weight?: number;
  /** Component that renders this section, if auto-generated */
  component?: string;
  /** Heading level if manual (h2, h3) */
  headingLevel?: 'h2' | 'h3';
}

export interface FrontmatterField {
  name: string;
  type: 'string' | 'number' | 'date' | 'object' | 'array' | 'boolean';
  required: boolean;
  description: string;
  /** Weight for scoring (0-100, default 10) */
  weight?: number;
}

export interface QualityCriteria {
  id: string;
  label: string;
  description: string;
  /** Weight for final score (0-100) */
  weight: number;
  /** How to detect/measure this */
  detection: 'frontmatter' | 'section' | 'content' | 'component' | 'table' | 'diagram' | 'citation';
  /** Regex or field name to check */
  pattern?: string;
}

export interface PageTemplate {
  id: TemplateId;
  name: string;
  description: string;
  /** Path pattern this template applies to (glob-style) */
  pathPattern: string;
  /** URL path to the style guide for this template type */
  styleGuide?: string;
  /** Required frontmatter fields */
  frontmatter: FrontmatterField[];
  /** Expected sections in order */
  sections: TemplateSection[];
  /** Quality criteria for evaluation */
  qualityCriteria: QualityCriteria[];
  /** Component to use for auto-generated content */
  autoComponent?: string;
  /** Example page following this template */
  examplePage?: string;
  /** Minimum word count for quality */
  minWordCount?: number;
  /** Whether this template uses simplified ATMPage pattern */
  usesATMPage?: boolean;
}

export const PAGE_TEMPLATES: Record<TemplateId, PageTemplate> = {
  'ai-transition-model-factor': {
    id: 'ai-transition-model-factor',
    name: 'AI Transition Model - Root Factor',
    description: 'Top-level factor pages (e.g., AI Capabilities, Misalignment Potential). YAML is the source of truth for ratings and metadata.',
    pathPattern: '/ai-transition-model/factors/*/index.mdx',
    styleGuide: '/internal/ai-transition-model-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Factor name', weight: 5 },
      { name: 'description', type: 'string', required: false, description: 'Brief description for previews (also in YAML)', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"ai-transition-model-factor"', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs introducing the factor (custom prose)', weight: 20 },
    ],
    qualityCriteria: [
      { id: 'has-yaml-entity', label: 'Has YAML Entity', description: 'Entity exists in ai-transition-model.yaml', weight: 25, detection: 'content' },
      { id: 'has-cause-effect-graph', label: 'Has Cause-Effect Graph', description: 'Entity has causeEffectGraph in YAML', weight: 25, detection: 'content' },
      { id: 'has-yaml-debates', label: 'Has Key Debates', description: 'Entity has keyDebates in YAML', weight: 15, detection: 'content' },
      { id: 'has-overview-prose', label: 'Has Custom Prose', description: 'MDX has custom Overview prose content', weight: 15, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/factors/ai-capabilities/',
    minWordCount: 200,
  },

  'ai-transition-model-scenario': {
    id: 'ai-transition-model-scenario',
    name: 'AI Transition Model - Scenario Category',
    description: 'Scenario category pages (e.g., AI Takeover, Long-term Lock-in). YAML is the source of truth for ratings and metadata.',
    pathPattern: '/ai-transition-model/scenarios/*/index.mdx',
    styleGuide: '/internal/ai-transition-model-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Scenario category name', weight: 5 },
      { name: 'description', type: 'string', required: false, description: 'Brief description for previews (also in YAML)', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"ai-transition-model-scenario"', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs introducing the scenario category', weight: 20 },
    ],
    qualityCriteria: [
      { id: 'has-yaml-entity', label: 'Has YAML Entity', description: 'Entity exists in ai-transition-model.yaml', weight: 25, detection: 'content' },
      { id: 'has-cause-effect-graph', label: 'Has Cause-Effect Graph', description: 'Entity has causeEffectGraph in YAML', weight: 25, detection: 'content' },
      { id: 'has-probability', label: 'Has Probability Estimates', description: 'Includes probability or likelihood estimates in YAML', weight: 15, detection: 'content', pattern: '\\d+%|probability|likelihood' },
      { id: 'has-overview-prose', label: 'Has Custom Prose', description: 'MDX has custom Overview prose content', weight: 15, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/scenarios/ai-takeover/',
    minWordCount: 200,
  },

  'ai-transition-model-outcome': {
    id: 'ai-transition-model-outcome',
    name: 'AI Transition Model - Outcome',
    description: 'Ultimate outcome pages (Existential Catastrophe, Long-term Trajectory). YAML is the source of truth.',
    pathPattern: '/ai-transition-model/outcomes/*.mdx',
    styleGuide: '/internal/ai-transition-model-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Outcome name', weight: 5 },
      { name: 'description', type: 'string', required: false, description: 'Brief description for previews (also in YAML)', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"ai-transition-model-outcome"', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: 'Definition and scope of this outcome', weight: 20 },
    ],
    qualityCriteria: [
      { id: 'has-yaml-entity', label: 'Has YAML Entity', description: 'Entity exists in ai-transition-model.yaml', weight: 25, detection: 'content' },
      { id: 'has-cause-effect-graph', label: 'Has Cause-Effect Graph', description: 'Entity has causeEffectGraph showing contributing factors', weight: 25, detection: 'content' },
      { id: 'has-overview-prose', label: 'Has Custom Prose', description: 'MDX has custom Overview prose content', weight: 15, detection: 'content' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 300 words of prose', weight: 10, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/outcomes/existential-catastrophe/',
    minWordCount: 300,
  },

  'ai-transition-model-sub-item': {
    id: 'ai-transition-model-sub-item',
    name: 'AI Transition Model - Sub-Item',
    description: 'Specific factor sub-items or scenario variants (e.g., Compute, Rapid Takeover). YAML is the source of truth - MDX is minimal.',
    pathPattern: '/ai-transition-model/*/*.mdx',
    styleGuide: '/internal/ai-transition-model-style-guide/',
    usesATMPage: true,
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Sub-item name (for sidebar/SEO)', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"ai-transition-model-sub-item"', weight: 5 },
    ],
    sections: [
      // ATMPage renders all content from YAML, so no manual sections required
      // Optional Overview section can contain custom prose
    ],
    qualityCriteria: [
      { id: 'has-yaml-entity', label: 'Has YAML Entity', description: 'Entity exists in ai-transition-model.yaml with parentFactor', weight: 25, detection: 'content' },
      { id: 'has-yaml-description', label: 'Has YAML Description', description: 'Entity has description in YAML', weight: 20, detection: 'content' },
      { id: 'has-yaml-ratings', label: 'Has YAML Ratings', description: 'Entity has ratings (changeability, xriskImpact, uncertainty) in YAML', weight: 15, detection: 'content' },
      { id: 'has-cause-effect-graph', label: 'Has Cause-Effect Graph', description: 'Entity has causeEffectGraph in YAML', weight: 20, detection: 'content' },
    ],
    autoComponent: 'ATMPage',
    examplePage: '/ai-transition-model/factors/ai-capabilities/compute/',
  },

  'ai-transition-model-parameter': {
    id: 'ai-transition-model-parameter',
    name: 'AI Transition Model - Parameter',
    description: 'Detailed parameter pages with comprehensive analysis (e.g., Alignment Robustness, Societal Trust)',
    pathPattern: '/ai-transition-model/parameters/*.mdx',
    styleGuide: '/internal/ai-transition-model-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Parameter name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description with key finding', weight: 15 },
      { name: 'template', type: 'string', required: true, description: 'Must be "ai-transition-model-parameter"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
      { name: 'quality', type: 'number', required: false, description: 'Quality rating 1-100', weight: 5 },
      { name: 'importance', type: 'number', required: false, description: 'Importance rating 0-100', weight: 5 },
      { name: 'tractability', type: 'number', required: false, description: 'Tractability rating 0-100', weight: 5 },
      { name: 'neglectedness', type: 'number', required: false, description: 'Neglectedness rating 0-100', weight: 5 },
      { name: 'uncertainty', type: 'number', required: false, description: 'Uncertainty rating 0-100', weight: 5 },
    ],
    sections: [
      { id: 'intro', label: 'Introduction', alternateLabels: ['Overview'], required: true, description: 'Opening paragraphs explaining what the parameter measures', weight: 10 },
      { id: 'parameter-network', label: 'Parameter Network', alternateLabels: ['Relationships', 'Network'], required: true, headingLevel: 'h2', description: 'Mermaid diagram showing relationships to other parameters', weight: 15 },
      { id: 'current-state', label: 'Current State Assessment', alternateLabels: ['Current State', 'Assessment'], required: true, headingLevel: 'h2', description: 'Tables with current metrics and evidence', weight: 15 },
      { id: 'healthy-state', label: 'What "Healthy" Looks Like', alternateLabels: ['Healthy State', 'Optimal State', 'Target State'], required: true, headingLevel: 'h2', description: 'Description of optimal parameter values', weight: 10 },
      { id: 'threats', label: 'Factors That Decrease', alternateLabels: ['Threats', 'What Decreases', 'Negative Factors'], required: true, headingLevel: 'h2', description: 'What reduces this parameter', weight: 10 },
      { id: 'supports', label: 'Factors That Increase', alternateLabels: ['Supports', 'What Increases', 'Positive Factors'], required: true, headingLevel: 'h2', description: 'What improves this parameter', weight: 10 },
      { id: 'why-matters', label: 'Why This Parameter Matters', alternateLabels: ['Why This Matters', 'Importance'], required: true, headingLevel: 'h2', description: 'Connection to outcomes and existential risk', weight: 10 },
      { id: 'trajectory', label: 'Trajectory and Scenarios', alternateLabels: ['Trajectory', 'Scenarios', 'Projections'], required: true, headingLevel: 'h2', description: 'Projected trends and scenario analysis', weight: 10 },
      { id: 'key-debates', label: 'Key Debates', alternateLabels: ['Debates', 'Controversies'], required: false, headingLevel: 'h2', description: 'Major points of disagreement', weight: 5 },
      { id: 'related-pages', label: 'Related Pages', alternateLabels: ['Related', 'See Also'], required: false, headingLevel: 'h2', description: 'Links to related content', weight: 5 },
      { id: 'sources', label: 'Sources', alternateLabels: ['Sources & Key Research', 'References', 'Key Research'], required: true, headingLevel: 'h2', description: 'Citations and key research', weight: 10 },
    ],
    qualityCriteria: [
      { id: 'has-mermaid', label: 'Has Network Diagram', description: 'Includes Mermaid parameter network diagram', weight: 15, detection: 'diagram', pattern: 'Mermaid' },
      { id: 'has-data-tables', label: 'Has Data Tables', description: 'Includes 2+ tables with quantified data', weight: 15, detection: 'table' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 5+ citations with <R> components', weight: 15, detection: 'citation', pattern: '<R id=' },
      { id: 'has-scenario-analysis', label: 'Has Scenario Analysis', description: 'Includes probability estimates for scenarios', weight: 10, detection: 'content', pattern: '\\d+%.*probability|probability.*\\d+%' },
      { id: 'word-count', label: 'Comprehensive Length', description: 'At least 2000 words of prose', weight: 10, detection: 'content' },
      { id: 'has-cause-effect', label: 'Has Cause-Effect Graph', description: 'Includes PageCauseEffectGraph component', weight: 10, detection: 'component', pattern: 'PageCauseEffectGraph' },
    ],
    examplePage: '/ai-transition-model/parameters/alignment-robustness/',
    minWordCount: 2000,
  },

  'knowledge-base-risk': {
    id: 'knowledge-base-risk',
    name: 'Knowledge Base - Risk',
    description: 'Risk analysis pages analyzing potential negative outcomes from AI development.',
    pathPattern: '/knowledge-base/risks/**/*.mdx',
    styleGuide: '/internal/risk-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Risk name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'One sentence explaining what this risk is and its key concern', weight: 15 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-risk"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 0-100', weight: 10 },
      { name: 'importance', type: 'number', required: false, description: 'Importance rating 0-100', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 substantive paragraphs explaining what this risk is and why it matters', weight: 15 },
      { id: 'risk-assessment', label: 'Risk Assessment', alternateLabels: ['Assessment', 'Risk Summary'], required: true, headingLevel: 'h2', description: 'Table with Severity, Likelihood, Timeline, Trend, Reversibility columns', weight: 15 },
      { id: 'mechanisms', label: 'How It Works', alternateLabels: ['Mechanisms', 'How This Happens', 'Pathways'], required: true, headingLevel: 'h2', description: 'How the risk manifests, with Mermaid diagram', weight: 15 },
      { id: 'contributing-factors', label: 'Contributing Factors', alternateLabels: ['Factors', 'What Affects This'], required: false, headingLevel: 'h2', description: 'Table of factors that increase/decrease risk', weight: 10 },
      { id: 'responses', label: 'Responses That Address This Risk', alternateLabels: ['Responses', 'Mitigations', 'Interventions'], required: true, headingLevel: 'h2', description: 'Table with cross-links to response pages', weight: 10 },
      { id: 'uncertainties', label: 'Key Uncertainties', alternateLabels: ['Uncertainties', 'What We Don\'t Know'], required: true, headingLevel: 'h2', description: 'Numbered list of what we don\'t know', weight: 10 },
      { id: 'related-risks', label: 'Related Risks', alternateLabels: ['Related', 'See Also'], required: false, headingLevel: 'h2', description: 'Links to connected risk pages', weight: 5 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources', 'Further Reading'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-risk-table', label: 'Has Risk Assessment Table', description: 'Table with Severity|Likelihood|Timeline|Trend|Reversibility', weight: 20, detection: 'table', pattern: 'Severity|Likelihood|Timeline' },
      { id: 'has-diagram', label: 'Has Mechanism Diagram', description: 'Mermaid flowchart showing how risk manifests', weight: 15, detection: 'diagram' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations with <R> components or links', weight: 15, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'has-contributing-factors', label: 'Has Contributing Factors Table', description: 'Table showing factors that increase/decrease risk', weight: 10, detection: 'table', pattern: 'Factor|Effect|Mechanism' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 800 words of prose', weight: 10, detection: 'content' },
      { id: 'has-responses', label: 'Links to Responses', description: 'Cross-links to intervention pages', weight: 10, detection: 'content', pattern: '/knowledge-base/responses/' },
    ],
    examplePage: '/knowledge-base/risks/misuse/bioweapons/',
    minWordCount: 800,
  },

  'knowledge-base-response': {
    id: 'knowledge-base-response',
    name: 'Knowledge Base - Response/Intervention',
    description: 'Intervention, policy, and technical approach pages that address AI risks.',
    pathPattern: '/knowledge-base/responses/**/*.mdx',
    styleGuide: '/internal/response-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Response name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'One sentence explaining what this response does and its key mechanism', weight: 15 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-response"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 0-100', weight: 10 },
      { name: 'importance', type: 'number', required: false, description: 'Importance rating 0-100', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs explaining what this response is and why it matters', weight: 15 },
      { id: 'quick-assessment', label: 'Quick Assessment', alternateLabels: ['Assessment', 'Summary Assessment', 'Evaluation'], required: true, headingLevel: 'h2', description: 'Table with Tractability, Scalability, Current Maturity, Time Horizon, Key Proponents', weight: 15 },
      { id: 'how-it-works', label: 'How It Works', alternateLabels: ['Mechanism', 'Approach', 'Method'], required: true, headingLevel: 'h2', description: 'Technical explanation with Mermaid diagram', weight: 15 },
      { id: 'risks-addressed', label: 'Risks Addressed', alternateLabels: ['Addresses These Risks', 'Target Risks'], required: true, headingLevel: 'h2', description: 'Table with cross-links to risk pages', weight: 10 },
      { id: 'limitations', label: 'Limitations', alternateLabels: ['Challenges', 'Weaknesses', 'What This Doesn\'t Solve'], required: true, headingLevel: 'h2', description: 'What this approach cannot do or gets wrong', weight: 10 },
      { id: 'current-state', label: 'Current State', alternateLabels: ['State of the Field', 'Current Progress'], required: false, headingLevel: 'h2', description: 'Who is working on this and what progress has been made', weight: 10 },
      { id: 'open-questions', label: 'Open Questions', alternateLabels: ['Research Questions', 'Future Work'], required: false, headingLevel: 'h2', description: 'Unsolved problems and research directions', weight: 5 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources', 'Further Reading'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-assessment-table', label: 'Has Quick Assessment Table', description: 'Table with Tractability|Scalability|Maturity columns', weight: 20, detection: 'table', pattern: 'Tractability|Scalability|Maturity|Dimension' },
      { id: 'has-diagram', label: 'Has Mechanism Diagram', description: 'Mermaid flowchart showing how it works', weight: 10, detection: 'diagram' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations with <R> components or links', weight: 15, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 600 words of prose', weight: 10, detection: 'content' },
      { id: 'has-risk-links', label: 'Links to Risks', description: 'Cross-links to risk pages', weight: 15, detection: 'content', pattern: '/knowledge-base/risks/' },
    ],
    examplePage: '/knowledge-base/responses/alignment/mech-interp/',
    minWordCount: 600,
  },

  'knowledge-base-model': {
    id: 'knowledge-base-model',
    name: 'Knowledge Base - Analytical Model',
    description: 'Quantitative or conceptual model pages with structured analysis.',
    pathPattern: '/knowledge-base/models/**/*.mdx',
    styleGuide: '/internal/models-style-guide/',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Model name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Methodology AND key conclusion (e.g., "This model estimates X. It finds Y.")', weight: 20 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-model"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 0-100', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
      { name: 'ratings', type: 'object', required: false, description: 'novelty, rigor, actionability, completeness (0-5 each)', weight: 10 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs with key conclusion/finding', weight: 15 },
      { id: 'framework', label: 'Conceptual Framework', alternateLabels: ['Framework', 'Model Structure', 'Methodology'], required: true, headingLevel: 'h2', description: 'Mermaid diagram + explanation of model structure', weight: 20 },
      { id: 'analysis', label: 'Quantitative Analysis', alternateLabels: ['Analysis', 'Results', 'Findings'], required: true, headingLevel: 'h2', description: 'Tables with uncertainty ranges (e.g., 10-30%)', weight: 20 },
      { id: 'importance', label: 'Strategic Importance', alternateLabels: ['Implications', 'Why This Matters', 'Key Insights'], required: true, headingLevel: 'h2', description: 'Magnitude, comparative ranking, resource implications', weight: 10 },
      { id: 'limitations', label: 'Limitations', alternateLabels: ['Caveats', 'What This Doesn\'t Capture'], required: true, headingLevel: 'h2', description: 'What the model doesn\'t capture', weight: 10 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-framework-diagram', label: 'Has Framework Diagram', description: 'Mermaid diagram showing model structure', weight: 20, detection: 'diagram' },
      { id: 'has-data-tables', label: 'Has Quantitative Tables', description: 'Tables with numbers and uncertainty ranges', weight: 20, detection: 'table', pattern: '\\d+%|\\d+-\\d+|±' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations', weight: 10, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'description-has-conclusion', label: 'Description Has Conclusion', description: 'Description field includes methodology AND key finding/number', weight: 15, detection: 'frontmatter', pattern: 'finds|estimates|concludes|\\d+%' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 600 words of prose', weight: 10, detection: 'content' },
    ],
    examplePage: '/knowledge-base/models/risk-models/bioweapons-risk-decomposition/',
    minWordCount: 600,
  },

  'knowledge-base-concept': {
    id: 'knowledge-base-concept',
    name: 'Knowledge Base - Concept',
    description: 'Concept and terminology explanation pages.',
    pathPattern: '/knowledge-base/concepts/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Concept name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief definition', weight: 15 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-concept"', weight: 5 },
      { name: 'quality', type: 'number', required: false, description: 'Quality rating 0-100', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', alternateLabels: ['Definition'], required: true, headingLevel: 'h2', description: 'Clear definition and explanation', weight: 25 },
      { id: 'examples', label: 'Examples', alternateLabels: ['Use Cases', 'Applications'], required: false, headingLevel: 'h2', description: 'Concrete examples', weight: 15 },
      { id: 'related', label: 'Related Concepts', alternateLabels: ['See Also', 'Related'], required: false, headingLevel: 'h2', description: 'Links to related concepts', weight: 10 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-examples', label: 'Has Examples', description: 'Includes concrete examples', weight: 20, detection: 'section', pattern: 'example|instance|case' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 300 words of prose', weight: 15, detection: 'content' },
    ],
    minWordCount: 300,
  },

  'knowledge-base-organization': {
    id: 'knowledge-base-organization',
    name: 'Knowledge Base - Organization',
    description: 'Organization profile pages.',
    pathPattern: '/knowledge-base/organizations/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Organization name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-organization"', weight: 5 },
      { name: 'quality', type: 'number', required: false, description: 'Quality rating 0-100', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: 'Organization description', weight: 20 },
      { id: 'key-work', label: 'Key Work', alternateLabels: ['Notable Work', 'Contributions', 'Research Areas'], required: true, headingLevel: 'h2', description: 'Notable contributions', weight: 20 },
      { id: 'people', label: 'Key People', alternateLabels: ['Leadership', 'Team'], required: false, headingLevel: 'h2', description: 'Leadership and researchers', weight: 10 },
      { id: 'funding', label: 'Funding', alternateLabels: ['Budget', 'Resources'], required: false, headingLevel: 'h2', description: 'Funding sources and amounts', weight: 10 },
    ],
    qualityCriteria: [
      { id: 'has-funding-info', label: 'Has Funding Info', description: 'Includes funding/budget information', weight: 15, detection: 'content', pattern: '\\$|million|billion|funding|budget' },
      { id: 'has-links', label: 'Has External Links', description: 'Links to organization website', weight: 10, detection: 'content', pattern: 'http' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 200 words of prose', weight: 10, detection: 'content' },
    ],
    examplePage: '/knowledge-base/organizations/labs/anthropic/',
    minWordCount: 200,
  },

  'knowledge-base-person': {
    id: 'knowledge-base-person',
    name: 'Knowledge Base - Person',
    description: 'Person profile pages.',
    pathPattern: '/knowledge-base/people/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Person name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief bio', weight: 10 },
      { name: 'pageTemplate', type: 'string', required: false, description: '"knowledge-base-person"', weight: 5 },
      { name: 'quality', type: 'number', required: false, description: 'Quality rating 0-100', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', alternateLabels: ['Biography', 'Bio'], required: true, headingLevel: 'h2', description: 'Bio and role', weight: 20 },
      { id: 'contributions', label: 'Key Contributions', alternateLabels: ['Notable Work', 'Research', 'Publications'], required: true, headingLevel: 'h2', description: 'Notable work', weight: 20 },
      { id: 'positions', label: 'Key Positions', alternateLabels: ['Views', 'Stances', 'Opinions'], required: false, headingLevel: 'h2', description: 'Views on AI risk', weight: 15 },
    ],
    qualityCriteria: [
      { id: 'has-affiliations', label: 'Has Affiliations', description: 'Lists current affiliations', weight: 15, detection: 'content', pattern: 'affiliation|works at|researcher at' },
      { id: 'has-publications', label: 'Has Publications', description: 'Lists key publications', weight: 15, detection: 'content', pattern: 'paper|publication|wrote|authored' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 150 words of prose', weight: 10, detection: 'content' },
    ],
    examplePage: '/knowledge-base/people/paul-christiano/',
    minWordCount: 150,
  },
};

export function getTemplate(id: TemplateId): PageTemplate | undefined {
  return PAGE_TEMPLATES[id];
}

/**
 * Get template for a path using glob-style pattern matching
 * @deprecated Use suggestTemplateForPath for more accurate matching
 */
export function getTemplateForPath(path: string): PageTemplate | undefined {
  // Simple pattern matching - could be more sophisticated
  for (const template of Object.values(PAGE_TEMPLATES)) {
    const pattern = template.pathPattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]+');
    if (new RegExp(`^${pattern}$`).test(path)) {
      return template;
    }
  }
  return undefined;
}

/**
 * Suggest which template a page should use based on its URL path.
 * Uses TEMPLATE_PATH_PATTERNS which are ordered by priority (most specific first).
 *
 * @param relativePath - Path relative to content directory (e.g., "knowledge-base/risks/misuse/bioweapons.mdx")
 * @returns Object with suggested templateId and the matching pattern's style guide path
 */
export function suggestTemplateForPath(relativePath: string): {
  templateId: TemplateId;
  styleGuide?: string;
} | undefined {
  // Skip index pages (overview pages) - they don't need templates
  if (relativePath.endsWith('/index.mdx') && !relativePath.includes('ai-transition-model')) {
    return undefined;
  }

  // Find matching pattern with highest priority
  let bestMatch: { templateId: TemplateId; priority: number } | undefined;

  for (const { pattern, templateId, priority } of TEMPLATE_PATH_PATTERNS) {
    if (pattern.test(relativePath)) {
      if (!bestMatch || priority > bestMatch.priority) {
        bestMatch = { templateId, priority };
      }
    }
  }

  if (!bestMatch) {
    return undefined;
  }

  const template = PAGE_TEMPLATES[bestMatch.templateId];
  return {
    templateId: bestMatch.templateId,
    styleGuide: template?.styleGuide,
  };
}

/**
 * Get all templates that match a given path pattern type.
 * Useful for getting all ATM templates or all knowledge-base templates.
 */
export function getTemplatesByPathPrefix(prefix: string): PageTemplate[] {
  return Object.values(PAGE_TEMPLATES).filter(t =>
    t.pathPattern.startsWith('/' + prefix)
  );
}

export function getAllTemplates(): PageTemplate[] {
  return Object.values(PAGE_TEMPLATES);
}

/**
 * Get total weight for a template's quality criteria
 */
export function getTotalCriteriaWeight(template: PageTemplate): number {
  return template.qualityCriteria.reduce((sum, c) => sum + c.weight, 0);
}

/**
 * Get section by label (case-insensitive, checks alternates)
 */
export function findSectionByLabel(template: PageTemplate, label: string): TemplateSection | undefined {
  const normalizedLabel = label.toLowerCase().trim();
  return template.sections.find(s => {
    if (s.label.toLowerCase() === normalizedLabel) return true;
    if (s.alternateLabels?.some(alt => alt.toLowerCase() === normalizedLabel)) return true;
    return false;
  });
}

/**
 * Get the style guide URL for a template
 */
export function getStyleGuideForTemplate(templateId: TemplateId): string | undefined {
  return PAGE_TEMPLATES[templateId]?.styleGuide;
}

/**
 * Map of template categories for grouping in UI
 */
export const TEMPLATE_CATEGORIES = {
  'ai-transition-model': [
    'ai-transition-model-factor',
    'ai-transition-model-scenario',
    'ai-transition-model-outcome',
    'ai-transition-model-sub-item',
    'ai-transition-model-parameter',
  ] as TemplateId[],
  'knowledge-base': [
    'knowledge-base-risk',
    'knowledge-base-response',
    'knowledge-base-model',
    'knowledge-base-concept',
    'knowledge-base-organization',
    'knowledge-base-person',
  ] as TemplateId[],
};
