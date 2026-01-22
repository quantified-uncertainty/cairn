// Table view for Architecture Scenarios - Expanded Version
import { useState } from 'react';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .as-page { min-height: 100vh; display: flex; flex-direction: column; }
  .as-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .as-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .as-header a:hover { color: #374151; }
  .as-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .as-header nav {
    display: flex;
    gap: 8px;
  }
  .as-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .as-header nav a:hover { background: #e5e7eb; }
  .as-header nav a.active { background: #3b82f6; color: white; }
  .as-controls {
    padding: 12px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .as-controls-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    margin-right: 4px;
  }
  .as-toggle-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    background: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    color: #6b7280;
  }
  .as-toggle-btn:hover { background: #f3f4f6; }
  .as-toggle-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  .as-toggle-btn.safety { border-color: #f59e0b; }
  .as-toggle-btn.safety.active { background: #f59e0b; border-color: #f59e0b; }
  .as-toggle-btn.landscape { border-color: #0ea5e9; }
  .as-toggle-btn.landscape.active { background: #0ea5e9; border-color: #0ea5e9; }
  .as-toggle-btn.assessment { border-color: #ec4899; }
  .as-toggle-btn.assessment.active { background: #ec4899; border-color: #ec4899; }
  .as-preset-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #6366f1;
    background: white;
    font-size: 11px;
    cursor: pointer;
    color: #6366f1;
    margin-left: 8px;
  }
  .as-preset-btn:hover { background: #eef2ff; }
  .as-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .as-intro {
    margin-bottom: 24px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 1000px;
  }
  .as-table-wrapper {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }
  .as-table {
    border-collapse: collapse;
    font-size: 12px;
    min-width: 1800px;
  }
  .as-table th {
    text-align: left;
    padding: 10px 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
    font-size: 12px;
    white-space: nowrap;
    border-bottom: 2px solid #d1d5db;
  }
  .as-table th.sticky-col {
    position: sticky;
    left: 0;
    z-index: 20;
    background: linear-gradient(to right, #e0e7ff, #eef2ff);
    color: #3730a3;
    font-size: 13px;
    font-weight: 700;
    border-right: 2px solid #c7d2fe;
  }
  .as-table th.overview-col {
    background: #f0fdf4;
    color: #166534;
  }
  .as-table th.safety-col {
    background: #fef3c7;
    color: #92400e;
  }
  .as-table th.landscape-col {
    background: #f0f9ff;
    color: #0369a1;
  }
  .as-table th.assessment-col {
    background: #fdf2f8;
    color: #9d174d;
  }
  .as-table td {
    padding: 12px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .as-table td.sticky-col {
    position: sticky;
    left: 0;
    background: #fafaff;
    z-index: 5;
    border-right: 2px solid #e0e7ff;
  }
  .as-table tr:hover td {
    background: #f9fafb;
  }
  .as-table tr:hover td.sticky-col {
    background: #eef2ff;
  }
  .as-scenario-name {
    font-weight: 600;
    color: #111827;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .as-scenario-desc {
    color: #6b7280;
    font-size: 11px;
    line-height: 1.4;
    max-width: 200px;
  }
  .as-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }
  .as-badge.high { background: #dcfce7; color: #166534; }
  .as-badge.medium { background: #fef3c7; color: #92400e; }
  .as-badge.low { background: #fee2e2; color: #991b1b; }
  .as-badge.unknown { background: #f3f4f6; color: #6b7280; }
  .as-badge.partial { background: #e0e7ff; color: #3730a3; }
  .as-badge.likelihood { background: #dbeafe; color: #1e40af; }
  .as-badge.timeline { background: #f3e8ff; color: #6b21a8; }
  .as-badge.safety-favorable { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .as-badge.safety-mixed { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .as-badge.safety-challenging { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .as-badge.safety-unknown { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
  .as-category-row td {
    background: #1f2937 !important;
    color: white !important;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px !important;
    border: none !important;
  }
  .as-safety-outlook {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .as-outlook-score {
    font-size: 18px;
    font-weight: 700;
  }
  .as-outlook-score.good { color: #166534; }
  .as-outlook-score.mixed { color: #92400e; }
  .as-outlook-score.poor { color: #991b1b; }
  .as-outlook-score.unknown { color: #6b7280; }
  .as-outlook-label {
    font-size: 10px;
    color: #6b7280;
  }
  .as-cell-note {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 4px;
    line-height: 1.3;
  }
  .as-sparkline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 30px;
    padding: 4px 0;
  }
  .as-sparkline-bar {
    width: 8px;
    background: #3b82f6;
    border-radius: 2px 2px 0 0;
    transition: height 0.2s;
  }
  .as-sparkline-label {
    font-size: 9px;
    color: #9ca3af;
    margin-top: 2px;
  }
  .as-labs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .as-lab {
    font-size: 10px;
    padding: 2px 6px;
    background: #f3f4f6;
    border-radius: 4px;
    color: #374151;
  }
  .as-lab a:hover {
    text-decoration: underline;
  }
  .as-table a {
    color: #3b82f6;
    text-decoration: none;
  }
  .as-table a:hover {
    text-decoration: underline;
  }
  .as-scenario-name a {
    color: inherit !important;
  }
  .as-examples {
    font-size: 11px;
    color: #6b7280;
  }
  .as-example-item {
    margin-bottom: 2px;
  }
  .as-pros-cons {
    font-size: 11px;
  }
  .as-pro {
    color: #166534;
  }
  .as-con {
    color: #991b1b;
  }
`;

// Sparkline data: ILLUSTRATIVE research activity over time (2020-2026, normalized 0-100)
// TODO: Replace with actual data from arXiv/Semantic Scholar paper counts
const SPARKLINE_DATA: Record<string, number[]> = {
  // Deployment Patterns
  'minimal-scaffolding': [80, 85, 70, 50, 35, 25, 20],  // Declining as agents rise
  'light-scaffolding': [20, 40, 60, 75, 80, 75, 70],    // Peaked, now agents taking over
  'heavy-scaffolding': [5, 10, 20, 40, 70, 90, 95],     // Strong growth
  // Base Architectures
  'dense-transformers': [70, 80, 85, 90, 85, 80, 75],   // Still dominant but MoE rising
  'sparse-moe': [10, 20, 35, 50, 70, 85, 95],           // Strong growth
  'ssm-hybrid': [0, 5, 15, 40, 60, 70, 75],             // Growing
  'world-model-planning': [15, 20, 30, 40, 50, 60, 65], // Steady growth
  'hybrid-neurosymbolic': [25, 28, 32, 35, 40, 50, 55], // Slow growth
  'provable-bounded': [5, 8, 12, 18, 25, 35, 45],       // Growing from low base
  'biological-organic': [8, 10, 12, 15, 18, 22, 28],    // Slow
  'neuromorphic': [20, 22, 25, 28, 32, 36, 40],         // Slow
  // Non-AI Paradigms
  'whole-brain-emulation': [15, 14, 13, 12, 12, 11, 10], // Declining interest
  'genetic-enhancement': [10, 12, 15, 18, 20, 22, 25],  // Slow growth
  'bci-enhancement': [10, 15, 25, 35, 50, 60, 70],      // Growing (Neuralink hype)
  'collective-intelligence': [20, 25, 30, 40, 55, 70, 80], // Growing
  'novel-unknown': [10, 10, 10, 10, 10, 10, 10],        // Flat - unknown
};

// STRUCTURE: We separate BASE ARCHITECTURE (what the neural net is) from DEPLOYMENT PATTERN (how it's used).
// These are orthogonal - you can have dense transformers with heavy scaffolding, MoE with minimal scaffolding, etc.
// Likelihoods are for "this combination is dominant at TAI" - they should sum to ~100%.

type SafetyOutlook = 'favorable' | 'mixed' | 'challenging' | 'unknown';
type Category = 'deployment' | 'base-arch' | 'alt-compute' | 'non-ai';

interface Link {
  title: string;
  url?: string;
}

interface LabLink {
  name: string;
  url?: string;
}

interface Scenario {
  id: string;
  category: Category;
  name: string;
  pageUrl?: string; // Link to KB page
  description: string;
  likelihood: string;
  likelihoodNote: string;
  timeline: string;
  safetyOutlook: {
    rating: SafetyOutlook;
    score?: number; // 1-10 scale, optional
    summary: string;
    keyRisks: string[];
    keyOpportunities: string[];
  };
  whitebox: { level: string; note: string };
  training: { level: string; note: string };
  predictability: { level: string; note: string };
  reprConvergence: { level: string; note: string };
  modularity: { level: string; note: string };
  formalVerifiable: { level: string; note: string };
  researchTractability: { level: string; note: string };
  labs: LabLink[];
  examples: Link[];
  keyPapers: Link[];
  safetyPros: string[];
  safetyCons: string[];
}

const CATEGORIES: Record<Category, { label: string; description: string }> = {
  'deployment': { label: 'Deployment Patterns', description: 'How models are orchestrated and used' },
  'base-arch': { label: 'Base Architectures', description: 'Core neural network architectures' },
  'alt-compute': { label: 'Alternative Compute', description: 'Non-standard computing substrates' },
  'non-ai': { label: 'Non-AI Paradigms', description: 'Intelligence enhancement without traditional AI' },
};

const SCENARIOS: Scenario[] = [
  // === DEPLOYMENT PATTERNS (how models are used) ===
  {
    id: 'minimal-scaffolding',
    category: 'deployment',
    name: 'Minimal Scaffolding',
    pageUrl: '/knowledge-base/intelligence-paradigms/minimal-scaffolding',
    description: 'Direct model API/chat with basic prompting. No persistent memory, minimal tools. Like ChatGPT web interface.',
    likelihood: '5-15%',
    likelihoodNote: 'Unlikely to stay dominant - scaffolding adds clear value',
    timeline: 'Now (declining)',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Easy to study but limited interpretability; low capability ceiling reduces risk',
      keyRisks: ['Model internals opaque', 'Deception possible in base model'],
      keyOpportunities: ['Simple threat model', 'Easier red-teaming', 'Limited action space'],
    },
    researchTractability: { level: 'HIGH', note: 'Well-studied; most interp work applies' },
    whitebox: { level: 'LOW', note: 'Model internals opaque; just see inputs/outputs' },
    training: { level: 'HIGH', note: 'Standard RLHF on base model' },
    predictability: { level: 'MEDIUM', note: 'Single forward pass, somewhat predictable' },
    reprConvergence: { level: 'N/A', note: 'Depends on base model' },
    modularity: { level: 'LOW', note: 'Monolithic model' },
    formalVerifiable: { level: 'LOW', note: 'Model itself unverifiable' },
    labs: [
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
    ],
    examples: [
      { title: 'ChatGPT', url: 'https://chat.openai.com' },
      { title: 'Claude.ai', url: 'https://claude.ai' },
      { title: 'Gemini', url: 'https://gemini.google.com' },
    ],
    keyPapers: [
      { title: 'InstructGPT (2022)', url: 'https://arxiv.org/abs/2203.02155' },
      { title: 'Constitutional AI (2022)', url: 'https://arxiv.org/abs/2212.08073' },
    ],
    safetyPros: ['Simple to analyze', 'No tool access = limited harm'],
    safetyCons: ['Model internals opaque', 'Limited capability ceiling'],
  },
  {
    id: 'light-scaffolding',
    category: 'deployment',
    name: 'Light Scaffolding',
    pageUrl: '/knowledge-base/intelligence-paradigms/light-scaffolding',
    description: 'Model + basic tool use + simple chains. RAG, function calling, single-agent loops. Like GPT with plugins.',
    likelihood: '15-25%',
    likelihoodNote: 'Current sweet spot; but heavy scaffolding catching up',
    timeline: 'Now - 2027',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Tool use adds capability and risk; scaffold provides some inspection',
      keyRisks: ['Tool access enables real-world harm', 'Prompt injection vulnerabilities'],
      keyOpportunities: ['Tool permissions controllable', 'Scaffold code auditable', 'Bounded context windows'],
    },
    researchTractability: { level: 'HIGH', note: 'Active research area; tools well-understood' },
    whitebox: { level: 'MEDIUM', note: 'Scaffold code readable; model still opaque' },
    training: { level: 'HIGH', note: 'Model trained; scaffold is code' },
    predictability: { level: 'MEDIUM', note: 'Tool calls add some unpredictability' },
    reprConvergence: { level: 'N/A', note: 'Scaffold is explicit code' },
    modularity: { level: 'MEDIUM', note: 'Clear tool boundaries' },
    formalVerifiable: { level: 'PARTIAL', note: 'Scaffold code can be verified' },
    labs: [
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Cohere' },
    ],
    examples: [
      { title: 'GPT-4 with plugins' },
      { title: 'Claude with tools' },
      { title: 'RAG systems' },
    ],
    keyPapers: [
      { title: 'Toolformer (2023)', url: 'https://arxiv.org/abs/2302.04761' },
      { title: 'RAG (2020)', url: 'https://arxiv.org/abs/2005.11401' },
    ],
    safetyPros: ['Scaffold logic inspectable', 'Tool permissions controllable'],
    safetyCons: ['Tool use enables real-world harm', 'Model decisions still opaque'],
  },
  {
    id: 'heavy-scaffolding',
    category: 'deployment',
    name: 'Heavy Scaffolding / Agentic',
    pageUrl: '/knowledge-base/intelligence-paradigms/heavy-scaffolding',
    description: 'Multi-agent systems, complex orchestration, persistent memory, autonomous operation. Like Claude Code, Devin.',
    likelihood: '25-40%',
    likelihoodNote: 'Strong trend; scaffolding getting cheaper and more valuable',
    timeline: 'Now - 2030',
    safetyOutlook: {
      rating: 'challenging',
      score: 4,
      summary: 'High capability with emergent behavior; scaffold helps but autonomy is risky',
      keyRisks: ['Emergent multi-step deception', 'Autonomous operation limits oversight', 'Compounding tool use risks'],
      keyOpportunities: ['Code-level safety checks', 'Modular = can swap components', 'Explicit decision traces'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Emerging field; agent safety understudied' },
    whitebox: { level: 'MEDIUM-HIGH', note: 'Scaffold code fully readable; model calls are black boxes' },
    training: { level: 'LOW', note: 'Models trained separately; scaffold is engineered code' },
    predictability: { level: 'LOW', note: 'Multi-step plans diverge unpredictably' },
    reprConvergence: { level: 'N/A', note: 'Scaffold is code, not representations' },
    modularity: { level: 'HIGH', note: 'Explicit component architecture' },
    formalVerifiable: { level: 'PARTIAL', note: 'Scaffold verifiable; model calls not' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Cognition' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
    ],
    examples: [
      { title: 'Claude Code', url: 'https://claude.ai/code' },
      { title: 'Devin', url: 'https://devin.ai' },
      { title: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT' },
    ],
    keyPapers: [
      { title: 'ReAct (2022)', url: 'https://arxiv.org/abs/2210.03629' },
      { title: 'Voyager (2023)', url: 'https://arxiv.org/abs/2305.16291' },
      { title: 'Agent protocols' },
    ],
    safetyPros: ['Scaffold code auditable', 'Can add safety checks in code', 'Modular'],
    safetyCons: ['Emergent multi-step behavior', 'Autonomous = less oversight', 'Tool use risk'],
  },
  // === BASE NEURAL ARCHITECTURES (what the model is) ===
  {
    id: 'dense-transformers',
    category: 'base-arch',
    name: 'Dense Transformers',
    pageUrl: '/knowledge-base/intelligence-paradigms/dense-transformers',
    description: 'Standard transformer architecture. All parameters active. Current GPT/Claude/Llama architecture.',
    likelihood: '(base arch)',
    likelihoodNote: 'Orthogonal to deployment - combined with scaffolding choices',
    timeline: 'Now - ???',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Most studied but still opaque; interpretability improving but slowly',
      keyRisks: ['Emergent deception', 'Phase transitions in capabilities', 'Internals remain opaque at scale'],
      keyOpportunities: ['Most interp research applies', 'Extensive red-teaming', 'Well-understood training'],
    },
    researchTractability: { level: 'HIGH', note: 'Most safety research targets this' },
    whitebox: { level: 'LOW', note: 'Weights exist but mech interp still primitive' },
    training: { level: 'HIGH', note: 'Well-understood pretraining + RLHF' },
    predictability: { level: 'LOW-MED', note: 'Emergent capabilities, phase transitions' },
    reprConvergence: { level: 'MEDIUM', note: 'Some evidence for platonic representations' },
    modularity: { level: 'LOW', note: 'Monolithic, end-to-end trained' },
    formalVerifiable: { level: 'LOW', note: 'Billions of parameters, no formal guarantees' },
    labs: [
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'Meta AI' },
    ],
    examples: [
      { title: 'GPT-4', url: 'https://openai.com/gpt-4' },
      { title: 'Claude 3', url: 'https://anthropic.com/claude' },
      { title: 'Llama 3', url: 'https://llama.meta.com' },
      { title: 'Gemini', url: 'https://deepmind.google/technologies/gemini/' },
    ],
    keyPapers: [
      { title: 'Attention Is All You Need (2017)', url: 'https://arxiv.org/abs/1706.03762' },
      { title: 'Scaling Laws (2020)', url: 'https://arxiv.org/abs/2001.08361' },
    ],
    safetyPros: ['Most studied architecture', 'Some interp tools exist'],
    safetyCons: ['Internals still opaque', 'Emergent deception possible', 'Scale makes analysis hard'],
  },
  {
    id: 'sparse-moe',
    category: 'base-arch',
    name: 'Sparse / MoE Transformers',
    pageUrl: '/knowledge-base/intelligence-paradigms/sparse-moe',
    description: 'Mixture-of-Experts or other sparse architectures. Only subset of params active per token.',
    likelihood: '(base arch)',
    likelihoodNote: 'May become default for efficiency; orthogonal to scaffolding',
    timeline: 'Now - ???',
    safetyOutlook: {
      rating: 'mixed',
      score: 4,
      summary: 'Efficiency gains good for safety research budget, but routing adds complexity',
      keyRisks: ['Routing decisions opaque', 'Harder to ensure coverage of expert combinations', 'Less interp research'],
      keyOpportunities: ['Expert specialization may aid interpretability', 'Efficiency = more testing budget'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Some transfer from dense; routing novel' },
    whitebox: { level: 'LOW', note: 'Same opacity as dense + routing complexity' },
    training: { level: 'HIGH', note: 'Standard + load balancing' },
    predictability: { level: 'LOW', note: 'Routing adds another layer of unpredictability' },
    reprConvergence: { level: 'UNKNOWN', note: 'Experts may specialize differently' },
    modularity: { level: 'MEDIUM', note: 'Expert boundaries exist but interact' },
    formalVerifiable: { level: 'LOW', note: 'Combinatorial explosion of expert paths' },
    labs: [
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'Mistral' },
      { name: 'xAI', url: '/knowledge-base/organizations/labs/xai' },
    ],
    examples: [
      { title: 'Mixtral', url: 'https://mistral.ai/news/mixtral-of-experts/' },
      { title: 'Switch Transformer', url: 'https://arxiv.org/abs/2101.03961' },
      { title: 'GPT-4 (rumored)' },
    ],
    keyPapers: [
      { title: 'Switch Transformers (2021)', url: 'https://arxiv.org/abs/2101.03961' },
      { title: 'Mixtral (2024)', url: 'https://arxiv.org/abs/2401.04088' },
    ],
    safetyPros: ['Can study individual experts', 'More efficient = more testing budget'],
    safetyCons: ['Routing is another black box', 'Hard to cover all expert combinations'],
  },
  {
    id: 'ssm-hybrid',
    category: 'base-arch',
    name: 'SSM / Hybrid (Mamba-style)',
    pageUrl: '/knowledge-base/intelligence-paradigms/ssm-mamba',
    description: 'State-space models or SSM-transformer hybrids with linear-time inference.',
    likelihood: '5-15%',
    likelihoodNote: 'Promising efficiency but transformers still dominate benchmarks',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'unknown',
      score: undefined,
      summary: 'Too early to assess; different internals may help or hurt',
      keyRisks: ['Existing interp tools don\'t transfer', 'Less studied = unknown unknowns'],
      keyOpportunities: ['Recurrence might enable new safety analysis', 'Efficiency gains'],
    },
    researchTractability: { level: 'LOW', note: 'New architecture; limited safety work' },
    whitebox: { level: 'MEDIUM', note: 'Different internals, less studied' },
    training: { level: 'HIGH', note: 'Still gradient-based' },
    predictability: { level: 'MEDIUM', note: 'Recurrence adds complexity' },
    reprConvergence: { level: 'UNKNOWN', note: 'Open question' },
    modularity: { level: 'LOW', note: 'Similar to transformers' },
    formalVerifiable: { level: 'UNKNOWN', note: 'Recurrence may help or hurt' },
    labs: [
      { name: 'Cartesia' },
      { name: 'Together AI' },
      { name: 'Princeton' },
    ],
    examples: [
      { title: 'Mamba', url: 'https://arxiv.org/abs/2312.00752' },
      { title: 'Mamba-2' },
      { title: 'Jamba', url: 'https://www.ai21.com/jamba' },
      { title: 'Griffin' },
    ],
    keyPapers: [
      { title: 'Mamba (Gu & Dao 2023)', url: 'https://arxiv.org/abs/2312.00752' },
      { title: 'RWKV', url: 'https://arxiv.org/abs/2305.13048' },
    ],
    safetyPros: ['More efficient', 'Linear complexity'],
    safetyCons: ['Interp tools don\'t transfer', 'Less studied'],
  },
  {
    id: 'world-model-planning',
    category: 'base-arch',
    name: 'World Models + Planning',
    pageUrl: '/knowledge-base/intelligence-paradigms/world-models',
    description: 'Explicit learned world model with search/planning. More like AlphaGo than GPT.',
    likelihood: '5-15%',
    likelihoodNote: 'LeCun advocates; not yet competitive for general tasks',
    timeline: '2026-2032',
    safetyOutlook: {
      rating: 'mixed',
      score: 6,
      summary: 'Explicit structure helps inspection but goal misgeneralization risks higher',
      keyRisks: ['Goal misgeneralization', 'Mesa-optimization risks', 'Model errors compound in planning'],
      keyOpportunities: ['Can inspect world model beliefs', 'Explicit goals more auditable', 'Planning traces visible'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Different paradigm; some transfer from RL safety' },
    whitebox: { level: 'PARTIAL', note: 'World model inspectable but opaque' },
    training: { level: 'HIGH', note: 'Model-based RL, self-play' },
    predictability: { level: 'MEDIUM', note: 'Explicit planning but model errors compound' },
    reprConvergence: { level: 'MEDIUM', note: 'May converge on physics-like structure' },
    modularity: { level: 'MEDIUM', note: 'Separate world model, policy, value' },
    formalVerifiable: { level: 'PARTIAL', note: 'Planning verifiable, world model less so' },
    labs: [
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'Meta FAIR' },
      { name: 'UC Berkeley' },
    ],
    examples: [
      { title: 'MuZero', url: 'https://deepmind.google/discover/blog/muzero-mastering-go-chess-shogi-and-atari-without-rules/' },
      { title: 'Dreamer v3', url: 'https://arxiv.org/abs/2301.04104' },
      { title: 'JEPA' },
    ],
    keyPapers: [
      { title: 'World Models (Ha 2018)', url: 'https://arxiv.org/abs/1803.10122' },
      { title: 'MuZero (2020)', url: 'https://arxiv.org/abs/1911.08265' },
      { title: 'JEPA (LeCun 2022)', url: 'https://openreview.net/forum?id=BZ5a1r-kVsf' },
    ],
    safetyPros: ['Explicit goals', 'Can inspect beliefs'],
    safetyCons: ['Goal misgeneralization', 'Mesa-optimization'],
  },
  {
    id: 'hybrid-neurosymbolic',
    category: 'base-arch',
    name: 'Neuro-Symbolic Hybrid',
    pageUrl: '/knowledge-base/intelligence-paradigms/neuro-symbolic',
    description: 'Neural + symbolic reasoning, knowledge graphs, or program synthesis.',
    likelihood: '3-10%',
    likelihoodNote: 'Long-promised, rarely delivered at scale',
    timeline: '2027-2035',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Symbolic components enable formal verification; hybrid boundaries a challenge',
      keyRisks: ['Neural-symbolic boundary vulnerabilities', 'Brittleness in edge cases', 'Scaling challenges'],
      keyOpportunities: ['Symbolic parts formally verifiable', 'Reasoning traces auditable', 'Natural language specs'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Formal methods apply to symbolic parts' },
    whitebox: { level: 'PARTIAL', note: 'Symbolic parts clear, neural parts opaque' },
    training: { level: 'COMPLEX', note: 'Neural trainable, symbolic often hand-crafted' },
    predictability: { level: 'MEDIUM', note: 'Explicit reasoning more auditable' },
    reprConvergence: { level: 'HIGH', note: 'Symbolic structures standardizable' },
    modularity: { level: 'HIGH', note: 'Clear neural/symbolic separation' },
    formalVerifiable: { level: 'PARTIAL', note: 'Symbolic parts formally verifiable' },
    labs: [
      { name: 'IBM Research' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'MIT-IBM Lab' },
    ],
    examples: [
      { title: 'AlphaProof', url: 'https://deepmind.google/discover/blog/ai-solves-imo-problems-at-silver-medal-level/' },
      { title: 'AlphaGeometry', url: 'https://deepmind.google/discover/blog/alphageometry-an-olympiad-level-ai-system-for-geometry/' },
      { title: 'NeurASP' },
    ],
    keyPapers: [
      { title: 'Neural Theorem Provers' },
      { title: 'AlphaProof (2024)' },
    ],
    safetyPros: ['Auditable reasoning', 'Formal verification possible'],
    safetyCons: ['Brittleness', 'Hard to scale', 'Boundary problems'],
  },
  {
    id: 'provable-bounded',
    category: 'base-arch',
    name: 'Provable/Guaranteed Safe',
    pageUrl: '/knowledge-base/intelligence-paradigms/provable-safe',
    description: 'Formally verified AI with mathematical safety guarantees. Davidad\'s agenda.',
    likelihood: '1-5%',
    likelihoodNote: 'Ambitious; unclear if achievable for general capabilities',
    timeline: '2030+',
    safetyOutlook: {
      rating: 'favorable',
      score: 9,
      summary: 'If achievable, best safety properties by design; uncertainty about feasibility',
      keyRisks: ['May not achieve competitive capabilities', 'World model verification hard', 'Specification gaming'],
      keyOpportunities: ['Mathematical guarantees', 'Auditable by construction', 'Safety-capability not tradeoff'],
    },
    researchTractability: { level: 'LOW', note: 'Nascent field; theoretical foundations needed' },
    whitebox: { level: 'HIGH', note: 'Designed for formal analysis' },
    training: { level: 'DIFFERENT', note: 'Verified synthesis, not just SGD' },
    predictability: { level: 'HIGH', note: 'Behavior bounded by proofs' },
    reprConvergence: { level: 'N/A', note: 'Designed, not learned' },
    modularity: { level: 'HIGH', note: 'Compositional by design' },
    formalVerifiable: { level: 'HIGH', note: 'This is the point' },
    labs: [
      { name: 'ARIA (Davidad)' },
      { name: 'MIRI', url: '/knowledge-base/organizations/safety-orgs/miri' },
    ],
    examples: [
      { title: 'Open Agency Architecture (proposed)' },
    ],
    keyPapers: [
      { title: 'Guaranteed Safe AI (2024)', url: 'https://arxiv.org/abs/2405.06624' },
      { title: 'Davidad ARIA programme', url: 'https://www.aria.org.uk/programme/safeguarded-ai/' },
    ],
    safetyPros: ['Mathematical guarantees', 'Auditable by construction'],
    safetyCons: ['May not scale', 'Capability tax', 'World model verification hard'],
  },
  {
    id: 'biological-organic',
    category: 'alt-compute',
    name: 'Biological / Organoid',
    pageUrl: '/knowledge-base/intelligence-paradigms/biological-organoid',
    description: 'Actual biological neurons, brain organoids, or wetware computing.',
    likelihood: '<1%',
    likelihoodNote: 'Fascinating but far from TAI-relevant scale',
    timeline: '2035+',
    safetyOutlook: {
      rating: 'challenging',
      score: 3,
      summary: 'Deeply opaque; no existing safety tools apply; ethical complexities',
      keyRisks: ['No interpretability tools', 'Ethical status unclear', 'Biological noise and variability'],
      keyOpportunities: ['May share human-like values', 'Different failure modes than silicon'],
    },
    researchTractability: { level: 'LOW', note: 'Novel paradigm; neuroscience needed' },
    whitebox: { level: 'LOW', note: 'Biological systems inherently opaque' },
    training: { level: 'UNKNOWN', note: 'Biological learning rules' },
    predictability: { level: 'LOW', note: 'Noisy and variable' },
    reprConvergence: { level: 'UNKNOWN', note: 'May share human cognitive structure' },
    modularity: { level: 'LOW', note: 'Highly interconnected' },
    formalVerifiable: { level: 'LOW', note: 'Too complex' },
    labs: [
      { name: 'Cortical Labs' },
      { name: 'Various academic' },
    ],
    examples: [
      { title: 'DishBrain', url: 'https://www.cell.com/neuron/fulltext/S0896-6273(22)00806-6' },
      { title: 'Brain organoids' },
    ],
    keyPapers: [
      { title: 'DishBrain (Kagan 2022)', url: 'https://www.cell.com/neuron/fulltext/S0896-6273(22)00806-6' },
    ],
    safetyPros: ['May have human-like values', 'Energy efficient'],
    safetyCons: ['Ethical concerns', 'No interp tools', 'Slow iteration'],
  },
  {
    id: 'neuromorphic',
    category: 'alt-compute',
    name: 'Neuromorphic Hardware',
    pageUrl: '/knowledge-base/intelligence-paradigms/neuromorphic',
    description: 'Spiking neural networks on specialized chips. Event-driven, analog.',
    likelihood: '1-3%',
    likelihoodNote: 'Efficiency gains real but not on path to TAI',
    timeline: '2030+',
    safetyOutlook: {
      rating: 'unknown',
      score: undefined,
      summary: 'Different substrate with different properties; too early to assess',
      keyRisks: ['Analog dynamics hard to verify', 'Existing tools don\'t transfer', 'Less mature ecosystem'],
      keyOpportunities: ['May enable new safety approaches', 'Energy efficiency for safety testing'],
    },
    researchTractability: { level: 'LOW', note: 'Different paradigm; limited safety work' },
    whitebox: { level: 'PARTIAL', note: 'Architecture known, dynamics complex' },
    training: { level: 'DIFFERENT', note: 'Spike-timing plasticity' },
    predictability: { level: 'MEDIUM', note: 'More brain-like' },
    reprConvergence: { level: 'UNKNOWN', note: 'Different substrate' },
    modularity: { level: 'MEDIUM', note: 'Modular chip designs possible' },
    formalVerifiable: { level: 'LOW', note: 'Analog dynamics hard to verify' },
    labs: [
      { name: 'Intel Labs' },
      { name: 'IBM Research' },
      { name: 'SynSense' },
    ],
    examples: [
      { title: 'Loihi 2', url: 'https://www.intel.com/content/www/us/en/research/neuromorphic-computing.html' },
      { title: 'TrueNorth' },
      { title: 'Akida', url: 'https://brainchip.com/akida-neural-processor-soc/' },
    ],
    keyPapers: [
      { title: 'Loihi (Intel 2018)', url: 'https://ieeexplore.ieee.org/document/8259423' },
      { title: 'SpiNNaker', url: 'https://apt.cs.manchester.ac.uk/projects/SpiNNaker/' },
    ],
    safetyPros: ['Energy efficient', 'Robust'],
    safetyCons: ['Current tools don\'t transfer', 'Less mature'],
  },
  // === NON-AI PARADIGMS ===
  {
    id: 'whole-brain-emulation',
    category: 'non-ai',
    name: 'Whole Brain Emulation',
    pageUrl: '/knowledge-base/intelligence-paradigms/whole-brain-emulation',
    description: 'Upload/simulate a complete biological brain at sufficient fidelity. Requires scanning + simulation tech.',
    likelihood: '<1%',
    likelihoodNote: 'Probably slower than AI; scanning tech far away',
    timeline: '2050+?',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Human values by default, but speed-up and copy-ability create novel risks',
      keyRisks: ['Fast-forwarding breaks human safeguards', 'Copy-ability enables coordination risks', 'Identity/ethics'],
      keyOpportunities: ['Human values by default', 'Understood entity type', 'Could interview/negotiate'],
    },
    researchTractability: { level: 'LOW', note: 'Speculative; neuroscience bottleneck' },
    whitebox: { level: 'LOW', note: 'Brain structure visible but not interpretable' },
    training: { level: 'N/A', note: 'Copied from biological learning' },
    predictability: { level: 'LOW', note: 'Human-like = unpredictable' },
    reprConvergence: { level: 'HIGH', note: 'Same as human brains by definition' },
    modularity: { level: 'LOW', note: 'Brains are highly interconnected' },
    formalVerifiable: { level: 'LOW', note: 'Too complex, poorly understood' },
    labs: [
      { name: 'Carboncopies' },
      { name: 'Academic neuroscience' },
    ],
    examples: [
      { title: 'OpenWorm', url: 'https://openworm.org' },
      { title: 'Blue Brain Project', url: 'https://www.epfl.ch/research/domains/bluebrain/' },
    ],
    keyPapers: [
      { title: 'Whole Brain Emulation Roadmap (Sandberg 2008)', url: 'https://www.fhi.ox.ac.uk/brain-emulation-roadmap-report.pdf' },
    ],
    safetyPros: ['Human values by default', 'Understood entity type'],
    safetyCons: ['Ethics of copying minds', 'Could run faster than real-time', 'Identity issues'],
  },
  {
    id: 'genetic-enhancement',
    category: 'non-ai',
    name: 'Genetic Enhancement',
    pageUrl: '/knowledge-base/intelligence-paradigms/genetic-enhancement',
    description: 'IQ enhancement via embryo selection, polygenic screening, or direct genetic engineering.',
    likelihood: '<0.5%',
    likelihoodNote: 'Too slow for TAI race; incremental gains only',
    timeline: '2040+',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Slow and controllable; enhanced humans still have human values',
      keyRisks: ['Inequality/access concerns', 'Too slow to compete with AI', 'Ethical opposition'],
      keyOpportunities: ['Human values intact', 'Gradual/controllable', 'Socially legible'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Genetics research applicable' },
    whitebox: { level: 'LOW', note: 'Genetic effects poorly understood' },
    training: { level: 'N/A', note: 'Biological development' },
    predictability: { level: 'MEDIUM', note: 'Still human, but smarter' },
    reprConvergence: { level: 'HIGH', note: 'Human cognitive architecture' },
    modularity: { level: 'LOW', note: 'Integrated biological system' },
    formalVerifiable: { level: 'LOW', note: 'Biological complexity' },
    labs: [
      { name: 'Genomic Prediction' },
      { name: 'Academic genetics' },
    ],
    examples: [
      { title: 'Polygenic embryo screening' },
      { title: 'Iterated embryo selection (proposed)' },
    ],
    keyPapers: [
      { title: 'Embryo Selection for Cognitive Enhancement (Shulman & Bostrom)', url: 'https://nickbostrom.com/papers/embryo.pdf' },
    ],
    safetyPros: ['Human values', 'Slow/controllable', 'Socially legible'],
    safetyCons: ['Ethical concerns', 'Too slow to matter for TAI', 'Inequality risks'],
  },
  {
    id: 'bci-enhancement',
    category: 'non-ai',
    name: 'Brain-Computer Interfaces',
    pageUrl: '/knowledge-base/intelligence-paradigms/brain-computer-interfaces',
    description: 'Neural interfaces that augment human cognition with AI/compute. Neuralink-style.',
    likelihood: '<1%',
    likelihoodNote: 'Bandwidth limits; AI likely faster standalone',
    timeline: '2035+',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Human oversight built-in, but security risks and bandwidth limits',
      keyRisks: ['Security vulnerabilities', 'Human-AI value conflicts', 'Bandwidth bottleneck'],
      keyOpportunities: ['Human judgment preserved', 'Gradual augmentation', 'Value alignment implicit'],
    },
    researchTractability: { level: 'LOW', note: 'Medical device + AI research needed' },
    whitebox: { level: 'PARTIAL', note: 'Interface visible, brain opaque' },
    training: { level: 'HYBRID', note: 'Human learning + AI training' },
    predictability: { level: 'LOW', note: 'Human in the loop = unpredictable' },
    reprConvergence: { level: 'PARTIAL', note: 'Hybrid human-AI representations' },
    modularity: { level: 'MEDIUM', note: 'Clear human/AI boundary' },
    formalVerifiable: { level: 'LOW', note: 'Human component unverifiable' },
    labs: [
      { name: 'Neuralink' },
      { name: 'Synchron' },
      { name: 'BrainGate' },
    ],
    examples: [
      { title: 'Neuralink N1', url: 'https://neuralink.com' },
      { title: 'Synchron Stentrode', url: 'https://synchron.com' },
      { title: 'BrainGate', url: 'https://www.braingate.org' },
    ],
    keyPapers: [
      { title: 'Neuralink whitepaper (2019)', url: 'https://www.biorxiv.org/content/10.1101/703801v4' },
    ],
    safetyPros: ['Human oversight built-in', 'Gradual augmentation'],
    safetyCons: ['Bandwidth limits', 'Security risks', 'Human bottleneck'],
  },
  {
    id: 'collective-intelligence',
    category: 'non-ai',
    name: 'Collective/Hybrid Intelligence',
    pageUrl: '/knowledge-base/intelligence-paradigms/collective-intelligence',
    description: 'Human-AI teams, prediction markets, deliberative democracy augmented by AI. Intelligence from coordination.',
    likelihood: '(overlay)',
    likelihoodNote: 'Not exclusive; already happening',
    timeline: 'Now',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Human oversight natural; slower pace; but coordination challenges',
      keyRisks: ['Manipulation by AI', 'Coordination failures', 'May not scale to TAI-level tasks'],
      keyOpportunities: ['Human oversight natural', 'Diverse perspectives', 'Slower = more controllable'],
    },
    researchTractability: { level: 'HIGH', note: 'Existing social science + CS research' },
    whitebox: { level: 'PARTIAL', note: 'Process visible, emergent behavior less so' },
    training: { level: 'N/A', note: 'Coordination protocols, not training' },
    predictability: { level: 'MEDIUM', note: 'Depends on protocol design' },
    reprConvergence: { level: 'N/A', note: 'Not a single system' },
    modularity: { level: 'HIGH', note: 'Explicitly modular by design' },
    formalVerifiable: { level: 'PARTIAL', note: 'Protocols can be analyzed' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Metaculus' },
    ],
    examples: [
      { title: 'AI-assisted research' },
      { title: 'Prediction markets', url: 'https://metaculus.com' },
      { title: 'Constitutional AI', url: 'https://arxiv.org/abs/2212.08073' },
    ],
    keyPapers: [
      { title: 'Superforecasting (Tetlock)', url: 'https://goodjudgment.com/superforecasting/' },
      { title: 'Collective Intelligence papers' },
    ],
    safetyPros: ['Human oversight', 'Diverse perspectives', 'Slower = more controllable'],
    safetyCons: ['Coordination failures', 'Vulnerable to manipulation', 'May not scale'],
  },
  {
    id: 'novel-unknown',
    category: 'base-arch',
    name: 'Novel / Unknown Paradigm',
    pageUrl: '/knowledge-base/intelligence-paradigms/novel-unknown',
    description: 'Something we haven\'t thought of yet. Placeholder for model uncertainty.',
    likelihood: '5-15%',
    likelihoodNote: 'Epistemic humility; history suggests surprises',
    timeline: '???',
    safetyOutlook: {
      rating: 'unknown',
      score: undefined,
      summary: 'Cannot assess; all current safety research may or may not transfer',
      keyRisks: ['All current work may not transfer', 'Unknown unknowns'],
      keyOpportunities: ['Fresh start possible', 'May be more interpretable'],
    },
    researchTractability: { level: '???', note: 'Cannot know' },
    whitebox: { level: '???', note: 'Depends on what emerges' },
    training: { level: '???', note: 'Unknown' },
    predictability: { level: '???', note: 'No basis for prediction' },
    reprConvergence: { level: '???', note: 'Unknown' },
    modularity: { level: '???', note: 'Unknown' },
    formalVerifiable: { level: '???', note: 'Unknown' },
    labs: [{ name: 'Unknown' }],
    examples: [{ title: '???' }],
    keyPapers: [],
    safetyPros: ['Fresh start possible'],
    safetyCons: ['All current work may not transfer'],
  },
];

function Sparkline({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data);
  return (
    <div>
      <div className="as-sparkline">
        {data.map((val, i) => (
          <div
            key={i}
            className="as-sparkline-bar"
            style={{ height: `${(val / max) * 26}px`, opacity: 0.4 + (i / data.length) * 0.6 }}
            title={`${2020 + i}: ${val}%`}
          />
        ))}
      </div>
      <div className="as-sparkline-label">{label}</div>
    </div>
  );
}

function Badge({ level }: { level: string }) {
  const cls = level.toLowerCase().includes('high') ? 'high' :
              level.toLowerCase().includes('medium') || level.toLowerCase().includes('similar') ? 'medium' :
              level.toLowerCase().includes('low') || level.toLowerCase().includes('limited') ? 'low' :
              level.toLowerCase().includes('partial') || level.toLowerCase().includes('complex') ? 'partial' :
              'unknown';
  return <span className={`as-badge ${cls}`}>{level}</span>;
}

function SafetyOutlookBadge({ rating, score }: { rating: SafetyOutlook; score?: number }) {
  const config = {
    favorable: { label: 'Favorable', cls: 'safety-favorable', color: '#166534' },
    mixed: { label: 'Mixed', cls: 'safety-mixed', color: '#92400e' },
    challenging: { label: 'Challenging', cls: 'safety-challenging', color: '#991b1b' },
    unknown: { label: 'Unknown', cls: 'safety-unknown', color: '#6b7280' },
  };
  const { label, cls, color } = config[rating];
  return (
    <div className="as-safety-outlook">
      {score !== undefined && (
        <div className={`as-outlook-score ${rating === 'favorable' ? 'good' : rating === 'mixed' ? 'mixed' : rating === 'challenging' ? 'poor' : 'unknown'}`}>
          {score}/10
        </div>
      )}
      <span className={`as-badge ${cls}`}>{label}</span>
    </div>
  );
}

// Column definitions for toggle controls
const COLUMNS = {
  // Overview
  likelihood: { key: 'likelihood', label: 'P(TAI)', group: 'overview', default: true },
  trend: { key: 'trend', label: 'Trend', group: 'overview', default: true },
  // Safety Outlook (new)
  safetyOutlook: { key: 'safetyOutlook', label: 'Safety Outlook', group: 'safety', default: true },
  keyRisks: { key: 'keyRisks', label: 'Key Risks', group: 'safety', default: false },
  keyOpportunities: { key: 'keyOpportunities', label: 'Key Opportunities', group: 'safety', default: false },
  // Safety Properties
  whitebox: { key: 'whitebox', label: 'White-box', group: 'safety', default: true },
  training: { key: 'training', label: 'Trainable', group: 'safety', default: true },
  predictability: { key: 'predictability', label: 'Predictable', group: 'safety', default: true },
  modularity: { key: 'modularity', label: 'Modular', group: 'safety', default: true },
  verifiable: { key: 'verifiable', label: 'Verifiable', group: 'safety', default: true },
  tractability: { key: 'tractability', label: 'Research Tractability', group: 'safety', default: false },
  // Landscape
  keyPapers: { key: 'keyPapers', label: 'Key Papers', group: 'landscape', default: true },
  labs: { key: 'labs', label: 'Labs', group: 'landscape', default: true },
  // Assessment
  safetyPros: { key: 'safetyPros', label: 'Safety Pros', group: 'assessment', default: true },
  safetyCons: { key: 'safetyCons', label: 'Safety Cons', group: 'assessment', default: true },
} as const;

type ColumnKey = keyof typeof COLUMNS;

const PRESETS = {
  all: Object.keys(COLUMNS) as ColumnKey[],
  safety: ['safetyOutlook', 'keyRisks', 'keyOpportunities', 'whitebox', 'training', 'predictability', 'modularity', 'verifiable', 'tractability'] as ColumnKey[],
  compact: ['likelihood', 'safetyOutlook', 'whitebox', 'predictability', 'verifiable'] as ColumnKey[],
  default: Object.entries(COLUMNS).filter(([_, v]) => v.default).map(([k]) => k) as ColumnKey[],
};

export default function ArchitectureScenariosTableView() {
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(new Set(PRESETS.default));

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    setVisibleColumns(new Set(PRESETS[preset]));
  };

  const isVisible = (key: ColumnKey) => visibleColumns.has(key);

  // Group scenarios by category
  const scenariosByCategory = SCENARIOS.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<Category, Scenario[]>);

  const categoryOrder: Category[] = ['deployment', 'base-arch', 'alt-compute', 'non-ai'];

  // Count visible columns for colspan
  const visibleCount = visibleColumns.size + 1; // +1 for scenario column

  return (
    <>
      <style>{styles}</style>
      <div className="as-page">
        <div className="as-header">
          <a href="/knowledge-base/intelligence-paradigms/">← Intelligence Paradigms</a>
          <h1>Scalable Intelligence Paradigms</h1>
          <nav>
            <a href="/knowledge-base/architecture-scenarios/table" className="active">Table</a>
            <a href="/knowledge-base/safety-approaches/table">Safety Approaches</a>
          </nav>
        </div>

        <div className="as-controls">
          <span className="as-controls-label">Columns:</span>
          {Object.entries(COLUMNS).map(([key, col]) => (
            <button
              key={key}
              className={`as-toggle-btn ${col.group} ${isVisible(key as ColumnKey) ? 'active' : ''}`}
              onClick={() => toggleColumn(key as ColumnKey)}
            >
              {col.label}
            </button>
          ))}
          <span className="as-controls-label" style={{ marginLeft: '16px' }}>Presets:</span>
          <button className="as-preset-btn" onClick={() => applyPreset('default')}>Default</button>
          <button className="as-preset-btn" onClick={() => applyPreset('safety')}>Safety Focus</button>
          <button className="as-preset-btn" onClick={() => applyPreset('compact')}>Compact</button>
          <button className="as-preset-btn" onClick={() => applyPreset('all')}>All</button>
        </div>

        <div className="as-content">
          <p className="as-intro">
            Paradigms for transformative intelligence. <strong>Structure:</strong> We separate <em>deployment patterns</em> (minimal → heavy scaffolding)
            from <em>base architectures</em> (transformers, SSMs, etc.). These are orthogonal - real systems combine both.
            E.g., "Heavy scaffolding + MoE transformer" is one concrete system.
          </p>
          <p className="as-intro" style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
            <strong>Key insight:</strong> Scaffold code is actually <em>more</em> interpretable than model internals.
            We can read and verify orchestration logic; we can't read transformer weights.
            <strong>Trend</strong> = illustrative (needs real data). <strong>Ratings</strong> = subjective guesses.
          </p>

          <div className="as-table-wrapper">
            <table className="as-table">
              <thead>
                <tr>
                  <th className="sticky-col" style={{ minWidth: '180px' }}>Scenario</th>
                  {isVisible('likelihood') && <th className="overview-col" style={{ minWidth: '140px' }}>P(dominant at TAI)</th>}
                  {isVisible('trend') && <th className="overview-col" style={{ minWidth: '90px' }}>Trend</th>}
                  {isVisible('safetyOutlook') && <th className="assessment-col" style={{ minWidth: '130px' }}>Safety Outlook</th>}
                  {isVisible('keyRisks') && <th className="assessment-col" style={{ minWidth: '150px' }}>Key Risks</th>}
                  {isVisible('keyOpportunities') && <th className="assessment-col" style={{ minWidth: '150px' }}>Key Opportunities</th>}
                  {isVisible('whitebox') && <th className="safety-col" style={{ minWidth: '110px' }}>White-box</th>}
                  {isVisible('training') && <th className="safety-col" style={{ minWidth: '110px' }}>Trainable</th>}
                  {isVisible('predictability') && <th className="safety-col" style={{ minWidth: '110px' }}>Predictable</th>}
                  {isVisible('modularity') && <th className="safety-col" style={{ minWidth: '100px' }}>Modular</th>}
                  {isVisible('verifiable') && <th className="safety-col" style={{ minWidth: '100px' }}>Verifiable</th>}
                  {isVisible('tractability') && <th className="safety-col" style={{ minWidth: '130px' }}>Research Tractability</th>}
                  {isVisible('keyPapers') && <th className="landscape-col" style={{ minWidth: '130px' }}>Key Papers</th>}
                  {isVisible('labs') && <th className="landscape-col" style={{ minWidth: '130px' }}>Labs</th>}
                  {isVisible('safetyPros') && <th className="assessment-col" style={{ minWidth: '140px' }}>Safety Pros</th>}
                  {isVisible('safetyCons') && <th className="assessment-col" style={{ minWidth: '140px' }}>Safety Cons</th>}
                </tr>
              </thead>
              <tbody>
                {categoryOrder.map((category) => (
                  <>
                    <tr key={`cat-${category}`} className="as-category-row">
                      <td colSpan={visibleCount}>
                        {CATEGORIES[category].label} — {CATEGORIES[category].description}
                      </td>
                    </tr>
                    {scenariosByCategory[category]?.map((s) => (
                      <tr key={s.id}>
                        <td className="sticky-col">
                          <div className="as-scenario-name">
                            {s.pageUrl ? (
                              <a href={s.pageUrl} style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted #6366f1' }}>
                                {s.name}
                              </a>
                            ) : (
                              s.name
                            )}
                          </div>
                          <div className="as-scenario-desc">{s.description}</div>
                        </td>
                        {isVisible('likelihood') && (
                          <td>
                            <span className="as-badge likelihood">{s.likelihood}</span>
                            <div className="as-cell-note">{s.likelihoodNote}</div>
                          </td>
                        )}
                        {isVisible('trend') && (
                          <td>
                            {SPARKLINE_DATA[s.id] ? (
                              <Sparkline data={SPARKLINE_DATA[s.id]} label="(illustrative)" />
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '11px' }}>No data</span>
                            )}
                          </td>
                        )}
                        {isVisible('safetyOutlook') && (
                          <td>
                            <SafetyOutlookBadge rating={s.safetyOutlook.rating} score={s.safetyOutlook.score} />
                            <div className="as-cell-note">{s.safetyOutlook.summary}</div>
                          </td>
                        )}
                        {isVisible('keyRisks') && (
                          <td>
                            <div className="as-pros-cons">
                              {s.safetyOutlook.keyRisks.map((risk) => (
                                <div key={risk} className="as-con">• {risk}</div>
                              ))}
                            </div>
                          </td>
                        )}
                        {isVisible('keyOpportunities') && (
                          <td>
                            <div className="as-pros-cons">
                              {s.safetyOutlook.keyOpportunities.map((opp) => (
                                <div key={opp} className="as-pro">• {opp}</div>
                              ))}
                            </div>
                          </td>
                        )}
                        {isVisible('whitebox') && (
                          <td>
                            <Badge level={s.whitebox.level} />
                            <div className="as-cell-note">{s.whitebox.note}</div>
                          </td>
                        )}
                        {isVisible('training') && (
                          <td>
                            <Badge level={s.training.level} />
                            <div className="as-cell-note">{s.training.note}</div>
                          </td>
                        )}
                        {isVisible('predictability') && (
                          <td>
                            <Badge level={s.predictability.level} />
                            <div className="as-cell-note">{s.predictability.note}</div>
                          </td>
                        )}
                        {isVisible('modularity') && (
                          <td>
                            <Badge level={s.modularity.level} />
                            <div className="as-cell-note">{s.modularity.note}</div>
                          </td>
                        )}
                        {isVisible('verifiable') && (
                          <td>
                            <Badge level={s.formalVerifiable.level} />
                            <div className="as-cell-note">{s.formalVerifiable.note}</div>
                          </td>
                        )}
                        {isVisible('tractability') && (
                          <td>
                            <Badge level={s.researchTractability.level} />
                            <div className="as-cell-note">{s.researchTractability.note}</div>
                          </td>
                        )}
                        {isVisible('keyPapers') && (
                          <td>
                            <div className="as-examples">
                              {s.keyPapers?.map((paper, i) => (
                                <div key={paper.title || i} className="as-example-item" style={{ fontSize: '10px' }}>
                                  {paper.url ? (
                                    <a href={paper.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                                      {paper.title}
                                    </a>
                                  ) : (
                                    paper.title
                                  )}
                                </div>
                              ))}
                              {(!s.keyPapers || s.keyPapers.length === 0) && (
                                <span style={{ color: '#9ca3af', fontSize: '10px', fontStyle: 'italic' }}>None listed</span>
                              )}
                            </div>
                          </td>
                        )}
                        {isVisible('labs') && (
                          <td>
                            <div className="as-labs">
                              {s.labs.map((lab, i) => {
                                const name = lab.name;
                                const url = lab.url;
                                return (
                                  <span key={name || i} className="as-lab">
                                    {url ? (
                                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {name}
                                      </a>
                                    ) : (
                                      name
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        )}
                        {isVisible('safetyPros') && (
                          <td>
                            <div className="as-pros-cons">
                              {s.safetyPros.map((pro) => (
                                <div key={pro} className="as-pro">+ {pro}</div>
                              ))}
                            </div>
                          </td>
                        )}
                        {isVisible('safetyCons') && (
                          <td>
                            <div className="as-pros-cons">
                              {s.safetyCons.map((con) => (
                                <div key={con} className="as-con">− {con}</div>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
