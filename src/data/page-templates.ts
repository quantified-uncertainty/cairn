/**
 * Page Template Definitions
 *
 * Templates define the expected structure and components for different page types.
 * Each template specifies:
 * - Required frontmatter fields
 * - Required and optional sections (with scoring weights)
 * - Quality criteria for evaluation
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
  /** Path pattern this template applies to */
  pathPattern: string;
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
    description: 'Top-level factor pages (e.g., AI Capabilities, Misalignment Potential)',
    pathPattern: '/ai-transition-model/factors/*/index.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Factor name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description for previews', weight: 10 },
      { name: 'template', type: 'string', required: true, description: 'Must be "ai-transition-model-factor"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs introducing the factor', weight: 20 },
      { id: 'sub-factors', label: 'Sub-Factors', alternateLabels: ['Components', 'Sub-Items'], required: true, headingLevel: 'h2', description: 'List of sub-items with brief descriptions', weight: 15 },
      { id: 'how-affects', label: 'How This Affects Outcomes', alternateLabels: ['Impact', 'Effects'], required: false, headingLevel: 'h2', description: 'Connection to scenarios and outcomes', weight: 10 },
      { id: 'related-content', label: 'Related Content', required: false, headingLevel: 'h2', description: 'Links to knowledge base', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-diagram', label: 'Has Diagram', description: 'Includes Mermaid or relationship diagram', weight: 15, detection: 'diagram' },
      { id: 'has-table', label: 'Has Data Table', description: 'Includes structured data table', weight: 10, detection: 'table' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 300 words of prose', weight: 10, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/factors/ai-capabilities/',
    minWordCount: 300,
  },

  'ai-transition-model-scenario': {
    id: 'ai-transition-model-scenario',
    name: 'AI Transition Model - Scenario Category',
    description: 'Scenario category pages (e.g., AI Takeover, Long-term Lock-in)',
    pathPattern: '/ai-transition-model/scenarios/*/index.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Scenario category name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description for previews', weight: 10 },
      { name: 'template', type: 'string', required: true, description: 'Must be "ai-transition-model-scenario"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs introducing the scenario category', weight: 20 },
      { id: 'variants', label: 'Variants', alternateLabels: ['Scenario Variants', 'Types'], required: true, headingLevel: 'h2', description: 'List of specific scenario variants', weight: 15 },
      { id: 'factors', label: 'Influencing Factors', alternateLabels: ['What Influences This', 'Contributing Factors'], required: false, headingLevel: 'h2', description: 'Factors that affect this scenario', weight: 10 },
      { id: 'outcomes', label: 'Outcomes Affected', alternateLabels: ['Impact on Outcomes'], required: false, headingLevel: 'h2', description: 'Which outcomes this scenario affects', weight: 10 },
    ],
    qualityCriteria: [
      { id: 'has-diagram', label: 'Has Diagram', description: 'Includes Mermaid or relationship diagram', weight: 15, detection: 'diagram' },
      { id: 'has-probability', label: 'Has Probability Estimates', description: 'Includes probability or likelihood estimates', weight: 10, detection: 'content', pattern: '\\d+%|probability|likelihood' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 300 words of prose', weight: 10, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/scenarios/ai-takeover/',
    minWordCount: 300,
  },

  'ai-transition-model-outcome': {
    id: 'ai-transition-model-outcome',
    name: 'AI Transition Model - Outcome',
    description: 'Ultimate outcome pages (Existential Catastrophe, Long-term Trajectory)',
    pathPattern: '/ai-transition-model/outcomes/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Outcome name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description for previews', weight: 10 },
      { name: 'template', type: 'string', required: true, description: 'Must be "ai-transition-model-outcome"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date (YYYY-MM-DD)', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: 'Definition and scope of this outcome', weight: 20 },
      { id: 'sub-dimensions', label: 'Sub-dimensions', alternateLabels: ['Dimensions', 'Components'], required: true, headingLevel: 'h2', description: 'Breakdown of outcome dimensions', weight: 15 },
      { id: 'what-contributes', label: 'What Contributes', alternateLabels: ['Contributing Factors', 'What Shapes'], required: true, headingLevel: 'h2', description: 'Factors and scenarios that contribute', weight: 15 },
      { id: 'why-matters', label: 'Why This Matters', required: true, headingLevel: 'h2', description: 'Importance and implications', weight: 10 },
      { id: 'scenarios', label: 'Scenarios', alternateLabels: ['Related Scenarios'], required: false, headingLevel: 'h2', description: 'Specific scenarios leading here', weight: 10 },
    ],
    qualityCriteria: [
      { id: 'has-diagram', label: 'Has Diagram', description: 'Includes relationship diagram', weight: 15, detection: 'diagram' },
      { id: 'has-impact-list', label: 'Has Impact Scores', description: 'Shows impact scores from scenarios', weight: 10, detection: 'component', pattern: 'ImpactList' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 400 words of prose', weight: 10, detection: 'content' },
    ],
    autoComponent: 'TransitionModelContent',
    examplePage: '/ai-transition-model/outcomes/existential-catastrophe/',
    minWordCount: 400,
  },

  'ai-transition-model-sub-item': {
    id: 'ai-transition-model-sub-item',
    name: 'AI Transition Model - Sub-Item',
    description: 'Specific factor sub-items or scenario variants (e.g., Compute, Rapid Takeover). Uses simplified ATMPage pattern.',
    pathPattern: '/ai-transition-model/*/*.mdx',
    usesATMPage: true,
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Sub-item name', weight: 10 },
      { name: 'template', type: 'string', required: true, description: 'Must be "ai-transition-model-sub-item"', weight: 5 },
    ],
    sections: [
      // ATMPage renders all content from YAML, so no manual sections required
    ],
    qualityCriteria: [
      { id: 'has-yaml-description', label: 'Has YAML Description', description: 'Entity has description in YAML', weight: 20, detection: 'content' },
      { id: 'has-yaml-debates', label: 'Has Key Debates', description: 'Entity has keyDebates in YAML', weight: 15, detection: 'content' },
      { id: 'has-yaml-related', label: 'Has Related Content', description: 'Entity has relatedContent in YAML', weight: 15, detection: 'content' },
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
    description: 'Risk analysis pages in the knowledge base',
    pathPattern: '/knowledge-base/risks/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Risk name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description with key finding', weight: 15 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-risk"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 1-5', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
      { name: 'importance', type: 'number', required: false, description: 'Importance rating 0-100', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 substantive paragraphs', weight: 15 },
      { id: 'risk-assessment', label: 'Risk Assessment', alternateLabels: ['Assessment', 'Risk Summary'], required: true, headingLevel: 'h2', description: 'Table with severity, likelihood, timeline, trend', weight: 15 },
      { id: 'mechanisms', label: 'How It Works', alternateLabels: ['Mechanisms', 'How This Happens', 'Pathways'], required: true, headingLevel: 'h2', description: 'How the risk manifests', weight: 15 },
      { id: 'evidence', label: 'Evidence', alternateLabels: ['Current Evidence', 'Empirical Evidence'], required: false, headingLevel: 'h2', description: 'Empirical support for the risk', weight: 10 },
      { id: 'scenarios', label: 'Scenarios', alternateLabels: ['Risk Scenarios', 'How It Could Happen'], required: false, headingLevel: 'h2', description: 'Specific risk scenarios with estimates', weight: 10 },
      { id: 'responses', label: 'Responses', alternateLabels: ['Responses That Address This', 'Mitigations', 'Interventions'], required: true, headingLevel: 'h2', description: 'Cross-links to interventions', weight: 10 },
      { id: 'uncertainties', label: 'Key Uncertainties', alternateLabels: ['Uncertainties', 'What We Don\'t Know'], required: true, headingLevel: 'h2', description: 'What we don\'t know', weight: 10 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources', 'Further Reading'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-risk-table', label: 'Has Risk Assessment Table', description: 'Table with severity/likelihood/timeline', weight: 20, detection: 'table', pattern: 'severity|likelihood|timeline' },
      { id: 'has-diagram', label: 'Has Mechanism Diagram', description: 'Mermaid or other diagram showing how risk manifests', weight: 15, detection: 'diagram' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations', weight: 15, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'has-scenarios', label: 'Has Scenario Table', description: 'Table with specific scenarios and probabilities', weight: 10, detection: 'table', pattern: 'scenario|probability' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 800 words of prose', weight: 10, detection: 'content' },
      { id: 'has-responses', label: 'Links to Responses', description: 'Cross-links to intervention pages', weight: 10, detection: 'content', pattern: '/knowledge-base/responses/' },
    ],
    examplePage: '/knowledge-base/risks/misuse/bioweapons/',
    minWordCount: 800,
  },

  'knowledge-base-response': {
    id: 'knowledge-base-response',
    name: 'Knowledge Base - Response/Intervention',
    description: 'Intervention and response pages',
    pathPattern: '/knowledge-base/responses/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Response name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description with assessment', weight: 15 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-response"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 1-5', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
      { name: 'importance', type: 'number', required: false, description: 'Importance rating 0-100', weight: 5 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs', weight: 15 },
      { id: 'quick-assessment', label: 'Quick Assessment', alternateLabels: ['Assessment', 'Summary Assessment', 'Evaluation'], required: true, headingLevel: 'h2', description: 'Table with tractability grades (A-F or 1-5)', weight: 15 },
      { id: 'how-it-works', label: 'How It Works', alternateLabels: ['Mechanism', 'Approach', 'Method'], required: true, headingLevel: 'h2', description: 'Mechanism of action', weight: 15 },
      { id: 'current-state', label: 'Current State', alternateLabels: ['State of the Field', 'Current Progress'], required: false, headingLevel: 'h2', description: 'Current implementation and progress', weight: 10 },
      { id: 'key-actors', label: 'Key Actors', alternateLabels: ['Organizations', 'Who\'s Working on This'], required: false, headingLevel: 'h2', description: 'Organizations and researchers working on this', weight: 5 },
      { id: 'risks-addressed', label: 'Risks Addressed', alternateLabels: ['Addresses These Risks', 'Target Risks'], required: true, headingLevel: 'h2', description: 'Cross-links to risks', weight: 10 },
      { id: 'limitations', label: 'Limitations', alternateLabels: ['Challenges', 'Weaknesses', 'What This Doesn\'t Solve'], required: true, headingLevel: 'h2', description: 'What this doesn\'t solve', weight: 10 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources', 'Further Reading'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-assessment-table', label: 'Has Assessment Table', description: 'Table with tractability/effectiveness grades', weight: 20, detection: 'table', pattern: 'tractability|effectiveness|grade' },
      { id: 'has-diagram', label: 'Has Diagram', description: 'Mermaid or other diagram showing mechanism', weight: 10, detection: 'diagram' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations', weight: 15, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 600 words of prose', weight: 10, detection: 'content' },
      { id: 'has-risk-links', label: 'Links to Risks', description: 'Cross-links to risk pages', weight: 15, detection: 'content', pattern: '/knowledge-base/risks/' },
    ],
    examplePage: '/knowledge-base/responses/alignment/interpretability/',
    minWordCount: 600,
  },

  'knowledge-base-model': {
    id: 'knowledge-base-model',
    name: 'Knowledge Base - Analytical Model',
    description: 'Quantitative or conceptual model pages',
    pathPattern: '/knowledge-base/models/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Model name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Methodology AND key conclusion', weight: 20 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-model"', weight: 5 },
      { name: 'quality', type: 'number', required: true, description: 'Quality rating 1-5', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
      { name: 'ratings', type: 'object', required: false, description: 'novelty, rigor, actionability, completeness', weight: 10 },
    ],
    sections: [
      { id: 'overview', label: 'Overview', required: true, headingLevel: 'h2', description: '2-3 paragraphs with key conclusion', weight: 15 },
      { id: 'framework', label: 'Conceptual Framework', alternateLabels: ['Framework', 'Model Structure', 'Methodology'], required: true, headingLevel: 'h2', description: 'Diagram + explanation of model structure', weight: 20 },
      { id: 'analysis', label: 'Quantitative Analysis', alternateLabels: ['Analysis', 'Results', 'Findings'], required: true, headingLevel: 'h2', description: 'Tables with uncertainty ranges', weight: 20 },
      { id: 'importance', label: 'Strategic Importance', alternateLabels: ['Implications', 'Why This Matters', 'Key Insights'], required: true, headingLevel: 'h2', description: 'Magnitude, ranking, implications', weight: 10 },
      { id: 'limitations', label: 'Limitations', alternateLabels: ['Caveats', 'What This Doesn\'t Capture'], required: true, headingLevel: 'h2', description: 'What the model doesn\'t capture', weight: 10 },
      { id: 'sources', label: 'Sources', alternateLabels: ['References', 'Key Sources'], required: false, headingLevel: 'h2', description: 'Citations and references', weight: 5 },
    ],
    qualityCriteria: [
      { id: 'has-framework-diagram', label: 'Has Framework Diagram', description: 'Mermaid or other diagram showing model structure', weight: 20, detection: 'diagram' },
      { id: 'has-data-tables', label: 'Has Quantitative Tables', description: 'Tables with numbers and uncertainty ranges', weight: 20, detection: 'table', pattern: '\\d+%|\\d+-\\d+|±' },
      { id: 'has-citations', label: 'Has Citations', description: 'Includes 3+ citations', weight: 10, detection: 'citation', pattern: '<R id=|\\[.*\\]\\(http' },
      { id: 'description-has-conclusion', label: 'Description Has Conclusion', description: 'Description field includes key finding/number', weight: 15, detection: 'frontmatter', pattern: 'finds|estimates|concludes|\\d+%' },
      { id: 'word-count', label: 'Sufficient Length', description: 'At least 600 words of prose', weight: 10, detection: 'content' },
    ],
    examplePage: '/knowledge-base/models/risk-models/bioweapons-risk-decomposition/',
    minWordCount: 600,
  },

  'knowledge-base-concept': {
    id: 'knowledge-base-concept',
    name: 'Knowledge Base - Concept',
    description: 'Concept and terminology explanation pages',
    pathPattern: '/knowledge-base/concepts/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Concept name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief definition', weight: 15 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-concept"', weight: 5 },
      { name: 'quality', type: 'number', required: false, description: 'Quality rating 1-5', weight: 10 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
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
    description: 'Organization profile pages',
    pathPattern: '/knowledge-base/organizations/**/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Organization name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief description', weight: 10 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-organization"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
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
    description: 'Person profile pages',
    pathPattern: '/knowledge-base/people/*.mdx',
    frontmatter: [
      { name: 'title', type: 'string', required: true, description: 'Person name', weight: 5 },
      { name: 'description', type: 'string', required: true, description: 'Brief bio', weight: 10 },
      { name: 'template', type: 'string', required: false, description: '"knowledge-base-person"', weight: 5 },
      { name: 'lastEdited', type: 'date', required: true, description: 'Last edit date', weight: 5 },
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
