// Table view for Deployment / Safety Architectures
import { useState } from 'react';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .da-page { min-height: 100vh; display: flex; flex-direction: column; }
  .da-header {
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
  .da-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .da-header a:hover { color: #374151; }
  .da-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .da-header nav {
    display: flex;
    gap: 8px;
  }
  .da-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .da-header nav a:hover { background: #e5e7eb; }
  .da-header nav a.active { background: #3b82f6; color: white; }
  .da-controls {
    padding: 12px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .da-controls-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    margin-right: 4px;
  }
  .da-toggle-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    background: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    color: #6b7280;
  }
  .da-toggle-btn:hover { background: #f3f4f6; }
  .da-toggle-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  .da-toggle-btn.safety { border-color: #f59e0b; }
  .da-toggle-btn.safety.active { background: #f59e0b; border-color: #f59e0b; }
  .da-toggle-btn.overview { border-color: #10b981; }
  .da-toggle-btn.overview.active { background: #10b981; border-color: #10b981; }
  .da-toggle-btn.landscape { border-color: #0ea5e9; }
  .da-toggle-btn.landscape.active { background: #0ea5e9; border-color: #0ea5e9; }
  .da-preset-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #6366f1;
    background: white;
    font-size: 11px;
    cursor: pointer;
    color: #6366f1;
    margin-left: 8px;
  }
  .da-preset-btn:hover { background: #eef2ff; }
  .da-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .da-intro {
    margin-bottom: 24px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 1000px;
  }
  .da-table-wrapper {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }
  .da-table {
    border-collapse: collapse;
    font-size: 12px;
    min-width: 1400px;
  }
  .da-table th {
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
  .da-table th.sticky-col {
    position: sticky;
    left: 0;
    z-index: 20;
    background: linear-gradient(to right, #fef3c7, #fefce8);
    color: #92400e;
    font-size: 13px;
    font-weight: 700;
    border-right: 2px solid #fcd34d;
  }
  .da-table th.overview-col {
    background: #f0fdf4;
    color: #166534;
  }
  .da-table th.safety-col {
    background: #fef3c7;
    color: #92400e;
  }
  .da-table th.landscape-col {
    background: #f0f9ff;
    color: #0369a1;
  }
  .da-table td {
    padding: 12px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .da-table td.sticky-col {
    position: sticky;
    left: 0;
    background: #fffbeb;
    z-index: 5;
    border-right: 2px solid #fef3c7;
  }
  .da-table tr:hover td {
    background: #f9fafb;
  }
  .da-table tr:hover td.sticky-col {
    background: #fef3c7;
  }
  .da-arch-name {
    font-weight: 600;
    color: #111827;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .da-arch-desc {
    color: #6b7280;
    font-size: 11px;
    line-height: 1.4;
    max-width: 220px;
  }
  .da-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }
  .da-badge.high { background: #dcfce7; color: #166534; }
  .da-badge.medium { background: #fef3c7; color: #92400e; }
  .da-badge.low { background: #fee2e2; color: #991b1b; }
  .da-badge.unknown { background: #f3f4f6; color: #6b7280; }
  .da-badge.partial { background: #e0e7ff; color: #3730a3; }
  .da-badge.minimal { background: #d1fae5; color: #065f46; }
  .da-badge.variable { background: #fef9c3; color: #854d0e; }
  .da-badge.none { background: #f3f4f6; color: #6b7280; }
  .da-badge.adoption { background: #dbeafe; color: #1e40af; }
  .da-badge.timeline { background: #f3e8ff; color: #6b21a8; }
  .da-badge.safety-favorable { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .da-badge.safety-mixed { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .da-badge.safety-challenging { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .da-cell-note {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 4px;
    line-height: 1.3;
  }
  .da-safety-outlook {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .da-outlook-score {
    font-size: 18px;
    font-weight: 700;
  }
  .da-outlook-score.good { color: #166534; }
  .da-outlook-score.mixed { color: #92400e; }
  .da-outlook-score.poor { color: #991b1b; }
  .da-sources {
    font-size: 10px;
    color: #6b7280;
  }
  .da-sources a {
    color: #3b82f6;
    text-decoration: none;
  }
  .da-sources a:hover {
    text-decoration: underline;
  }
  .da-pros-cons {
    font-size: 11px;
  }
  .da-pro {
    color: #166534;
  }
  .da-con {
    color: #991b1b;
  }
  .da-category-row td {
    background: #1f2937 !important;
    color: white !important;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px !important;
    border: none !important;
  }
`;

type SafetyOutlook = 'favorable' | 'mixed' | 'challenging' | 'unknown';
type Category = 'basic' | 'structured' | 'oversight';

interface Source {
  title: string;
  url?: string;
  year?: string;
}

interface Architecture {
  id: string;
  category: Category;
  name: string;
  description: string;
  adoption: string;
  adoptionNote: string;
  timeline: string;
  safetyOutlook: {
    rating: SafetyOutlook;
    score?: number;
    summary: string;
  };
  agencyLevel: { level: string; note: string };
  decomposition: { level: string; note: string };
  oversight: { level: string; note: string };
  whitebox: { level: string; note: string };
  modularity: { level: string; note: string };
  verifiable: { level: string; note: string };
  sources: Source[];
  safetyPros: string[];
  safetyCons: string[];
}

const CATEGORIES: Record<Category, { label: string; description: string }> = {
  'basic': { label: 'Basic Patterns', description: 'Minimal to light scaffolding approaches' },
  'structured': { label: 'Structured Safety Architectures', description: 'Architectures designed with safety properties' },
  'oversight': { label: 'Oversight Mechanisms', description: 'Methods for supervising AI systems' },
};

const ARCHITECTURES: Architecture[] = [
  // === BASIC PATTERNS ===
  {
    id: 'monolithic-minimal',
    category: 'basic',
    name: 'Monolithic / Minimal Scaffolding',
    description: 'Single model with direct API access. No persistent memory, minimal tools. Like ChatGPT web or basic Claude usage.',
    adoption: 'DECLINING',
    adoptionNote: 'Legacy pattern; scaffolding adds clear value',
    timeline: 'Now (legacy)',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Simple threat model but limited interpretability',
    },
    agencyLevel: { level: 'HIGH', note: 'Single model makes all decisions' },
    decomposition: { level: 'NONE', note: 'Single forward pass or CoT in one context' },
    oversight: { level: 'MINIMAL', note: 'Human sees inputs/outputs only' },
    whitebox: { level: 'LOW', note: 'Model internals opaque' },
    modularity: { level: 'LOW', note: 'Monolithic model' },
    verifiable: { level: 'LOW', note: 'No formal guarantees' },
    sources: [
      { title: 'InstructGPT', url: 'https://arxiv.org/abs/2203.02155', year: '2022' },
    ],
    safetyPros: ['Simple to analyze', 'Limited action space'],
    safetyCons: ['Model internals opaque', 'Relies entirely on training'],
  },
  {
    id: 'light-scaffolding',
    category: 'basic',
    name: 'Light Scaffolding',
    description: 'Model + basic tool use + simple chains. RAG, function calling, single-agent loops. Like GPT with plugins.',
    adoption: 'HIGH',
    adoptionNote: 'Current mainstream; most deployed systems',
    timeline: 'Now - 2027',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Tool use adds capability and risk; scaffold provides some inspection',
    },
    agencyLevel: { level: 'MEDIUM-HIGH', note: 'Model retains most decision-making' },
    decomposition: { level: 'BASIC', note: 'Simple tool calls, RAG retrieval' },
    oversight: { level: 'HUMAN (limited)', note: 'Tool permissions controllable' },
    whitebox: { level: 'MEDIUM', note: 'Scaffold code readable; model opaque' },
    modularity: { level: 'MEDIUM', note: 'Clear tool boundaries' },
    verifiable: { level: 'PARTIAL', note: 'Scaffold code can be verified' },
    sources: [
      { title: 'Toolformer', url: 'https://arxiv.org/abs/2302.04761', year: '2023' },
      { title: 'RAG', url: 'https://arxiv.org/abs/2005.11401', year: '2020' },
    ],
    safetyPros: ['Scaffold logic inspectable', 'Tool permissions controllable'],
    safetyCons: ['Tool use enables real-world harm', 'Model decisions still opaque'],
  },
  {
    id: 'tool-oracle',
    category: 'basic',
    name: 'Tool AI / Oracle',
    description: 'Bostrom\'s taxonomy. Tool: narrow software-like, no persistent goals. Oracle: questions only. Agency structurally constrained.',
    adoption: 'MEDIUM',
    adoptionNote: 'Used for specialized applications',
    timeline: 'Now - ongoing',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Safety through limitation; capability traded for safety',
    },
    agencyLevel: { level: 'MINIMAL', note: 'No persistent goals, narrow scope' },
    decomposition: { level: 'N/A', note: 'Scope-restricted instead of decomposed' },
    oversight: { level: 'SCOPE CONSTRAINT', note: 'Safety through limitation' },
    whitebox: { level: 'LOW-MEDIUM', note: 'Limited scope means less to inspect' },
    modularity: { level: 'LOW', note: 'Single-purpose by design' },
    verifiable: { level: 'PARTIAL', note: 'Behavior bounded by constraint' },
    sources: [
      { title: 'Superintelligence (Bostrom)', url: 'https://nickbostrom.com/papers/oracle.pdf', year: '2014' },
    ],
    safetyPros: ['Minimal agency', 'Clear boundaries', 'Human decides actions'],
    safetyCons: ['Limited capability', 'May develop emergent agency'],
  },
  // === STRUCTURED SAFETY ARCHITECTURES ===
  {
    id: 'cais-services',
    category: 'structured',
    name: 'CAIS / Service-Based',
    description: 'Comprehensive AI Services (Drexler). Many task-specific services rather than unified agents. Agency optional, not default.',
    adoption: 'LOW-MEDIUM',
    adoptionNote: '15-25% chance becomes dominant paradigm',
    timeline: '2026-2032',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Avoids unified agency; bounded goals; ongoing human direction',
    },
    agencyLevel: { level: 'LOW', note: 'Services have bounded, task-specific goals' },
    decomposition: { level: 'SERVICE-LEVEL', note: 'System = many specialized services' },
    oversight: { level: 'HUMAN', note: 'Services informed by models of human approval' },
    whitebox: { level: 'PARTIAL', note: 'Service boundaries visible; internals may be opaque' },
    modularity: { level: 'HIGH', note: 'Explicit service architecture' },
    verifiable: { level: 'PARTIAL', note: 'Inter-service protocols can be verified' },
    sources: [
      { title: 'Reframing Superintelligence', url: 'https://www.fhi.ox.ac.uk/reframing/', year: '2019' },
      { title: 'CAIS - EA Forum', url: 'https://forum.effectivealtruism.org/topics/comprehensive-ai-services' },
    ],
    safetyPros: ['No unified agency', 'Bounded goals', 'Incremental development'],
    safetyCons: ['Coordination complexity', 'Agency creep possible', 'Foundation model gap'],
  },
  {
    id: 'ai-control',
    category: 'structured',
    name: 'AI Control / Hierarchical (T/U)',
    description: 'Redwood Research. Trusted model T monitors untrusted model U. Designed to work even if U intentionally subverts. 92% safety / 94% usefulness.',
    adoption: 'MEDIUM',
    adoptionNote: '20-35% chance; active research area',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Maintains safety despite intentional subversion attempts',
    },
    agencyLevel: { level: 'MEDIUM', note: 'U has capability but T constrains' },
    decomposition: { level: 'T/U SPLIT', note: 'Binary: trusted monitors untrusted' },
    oversight: { level: 'AI MONITORS AI', note: 'Scalable without linear human effort' },
    whitebox: { level: 'PARTIAL', note: 'Protocol logic visible; U internals constrained' },
    modularity: { level: 'MEDIUM', note: 'Clear T/U separation' },
    verifiable: { level: 'PARTIAL', note: 'Protocol effectiveness empirically tested' },
    sources: [
      { title: 'AI Control Paper', url: 'https://arxiv.org/abs/2312.06942', year: '2024' },
      { title: 'Redwood Research', url: 'https://www.redwoodresearch.org/research/ai-control' },
    ],
    safetyPros: ['Works despite subversion', 'Scalable oversight', 'Empirically validated'],
    safetyCons: ['Capability gap may close', 'Collusion risk', 'T must be trustworthy'],
  },
  {
    id: 'factored-cognition',
    category: 'structured',
    name: 'Factored Cognition',
    description: 'Decompose tasks into isolated child tasks solved independently. Factor(T,U): 41% to 63% safety improvement. Simpler contexts for monitors.',
    adoption: 'MEDIUM',
    adoptionNote: '15-30% chance; complements AI Control',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Decomposition creates easier tasks and clearer contexts',
    },
    agencyLevel: { level: 'LOW-MEDIUM', note: 'Components have limited context' },
    decomposition: { level: 'TASK-LEVEL', note: 'Complex tasks into isolated children' },
    oversight: { level: 'CONTEXT ISOLATION', note: 'Attacks more obvious on simpler tasks' },
    whitebox: { level: 'PARTIAL-HIGH', note: 'Decomposition structure visible' },
    modularity: { level: 'HIGH', note: 'Explicit task boundaries' },
    verifiable: { level: 'PARTIAL', note: 'Can audit composition of results' },
    sources: [
      { title: 'Factor(T,U)', url: 'https://arxiv.org/abs/2512.02157', year: '2024' },
      { title: 'Factored Cognition - LessWrong', url: 'https://www.lesswrong.com/posts/tgLmDjKRXaX3dokrC/factored-cognition-strengthens-monitoring-and-thwarts' },
    ],
    safetyPros: ['Simpler contexts', 'Attacks more obvious', 'Compositional safety'],
    safetyCons: ['Decomposition limits', 'Information loss', 'Usefulness cost'],
  },
  {
    id: 'open-agency',
    category: 'structured',
    name: 'Open Agency Architecture',
    description: 'Drexler/davidad. Separate goal-setting, planning, evaluation, execution. Plans externalized and interpretable. Foundation for Provably Safe AI.',
    adoption: 'LOW',
    adoptionNote: '5-15% chance; ambitious long-term agenda',
    timeline: '2027-2035',
    safetyOutlook: {
      rating: 'favorable',
      score: 8,
      summary: 'Designed for formal analysis; externalized plans',
    },
    agencyLevel: { level: 'MEDIUM (bounded)', note: 'Bounded tasks with time/budget constraints' },
    decomposition: { level: 'ROLE SEPARATION', note: 'Separate goal/plan/evaluate/execute' },
    oversight: { level: 'EXTERNALIZED PLANS', note: 'Plans interpretable, not opaque' },
    whitebox: { level: 'HIGH', note: 'Designed for formal analysis' },
    modularity: { level: 'HIGH', note: 'Clear role separation' },
    verifiable: { level: 'PARTIAL-HIGH', note: 'Compositional verification possible' },
    sources: [
      { title: 'Open Agency Model', url: 'https://www.lesswrong.com/posts/5hApNw5f7uG8RXxGS/the-open-agency-model' },
      { title: 'ARIA Safeguarded AI', url: 'https://www.aria.org.uk/programme/safeguarded-ai/' },
    ],
    safetyPros: ['Externalized plans', 'Formal analysis', 'Role separation'],
    safetyCons: ['May not scale to TAI', 'Specification difficulty', 'Capability tax'],
  },
  {
    id: 'safety-first-cognitive',
    category: 'structured',
    name: 'Safety-First Cognitive Architectures',
    description: 'Federated architectures with transparent inter-component communication. Separate planning, execution, memory. Interpretability by design.',
    adoption: 'LOW-MEDIUM',
    adoptionNote: 'Emerging field; underdeveloped',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Intelligence from separate, non-agentic systems',
    },
    agencyLevel: { level: 'MEDIUM (federated)', note: 'No single unified agent' },
    decomposition: { level: 'COGNITIVE ROLES', note: 'Separate planning/execution/memory' },
    oversight: { level: 'TRANSPARENT COMMS', note: 'Human-readable, rate-controlled' },
    whitebox: { level: 'HIGH', note: 'Communication channels visible by design' },
    modularity: { level: 'HIGH', note: 'Explicit component architecture' },
    verifiable: { level: 'PARTIAL', note: 'Can verify communication protocols' },
    sources: [
      { title: 'Safety-First Agents', url: 'https://www.lesswrong.com/posts/caeXurgTwKDpSG4Nh/safety-first-agents-architectures-are-a-promising-path-to' },
    ],
    safetyPros: ['Transparent by design', 'Federated = no unified agent', 'Rate-controlled'],
    safetyCons: ['Field underdeveloped', 'May not compete on capability'],
  },
  // === OVERSIGHT MECHANISMS ===
  {
    id: 'process-supervision',
    category: 'oversight',
    name: 'Process Supervision',
    description: 'OpenAI. Reward each reasoning step, not just outcome. 78.2% vs 72.4% on MATH. Deployed in o1 models. Detects bad reasoning.',
    adoption: 'HIGH',
    adoptionNote: 'Already deployed in production (o1)',
    timeline: 'Now - expanding',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Step-by-step verification catches bad reasoning',
    },
    agencyLevel: { level: 'VARIABLE', note: 'Doesn\'t constrain agency directly' },
    decomposition: { level: 'STEP-BY-STEP', note: 'Reasoning into verifiable steps' },
    oversight: { level: 'STEP VERIFICATION', note: 'Each step evaluated for correctness' },
    whitebox: { level: 'MEDIUM-HIGH', note: 'Reasoning steps visible' },
    modularity: { level: 'MEDIUM', note: 'Step boundaries clear' },
    verifiable: { level: 'PARTIAL', note: 'Steps can be verified individually' },
    sources: [
      { title: 'Let\'s Verify Step by Step', url: 'https://arxiv.org/abs/2305.20050', year: '2023' },
      { title: 'PRM800K', url: 'https://github.com/openai/prm800k', year: '2023' },
    ],
    safetyPros: ['Catches bad reasoning', 'Deployed at scale', 'Strong empirical results'],
    safetyCons: ['May not transfer to all domains', 'Process-outcome gap', 'Alien reasoning risk'],
  },
  {
    id: 'debate-adversarial',
    category: 'oversight',
    name: 'Debate / Adversarial Oversight',
    description: 'Irving et al. Two AIs argue opposing positions, human judges. Truth should win via adversarial scrutiny. 60-80% on factual Qs.',
    adoption: 'LOW-MEDIUM',
    adoptionNote: 'Research stage; promising but challenges',
    timeline: '2026-2032',
    safetyOutlook: {
      rating: 'mixed',
      score: 6,
      summary: 'Promising but vulnerable to sophisticated deception',
    },
    agencyLevel: { level: 'MEDIUM', note: 'Debaters have agency within format' },
    decomposition: { level: 'ADVERSARIAL SPLIT', note: 'Two perspectives, not task decomposition' },
    oversight: { level: 'HUMAN JUDGE', note: 'Human evaluates which argument wins' },
    whitebox: { level: 'MEDIUM', note: 'Arguments visible; model internals opaque' },
    modularity: { level: 'MEDIUM', note: 'Clear debater separation' },
    verifiable: { level: 'LOW', note: 'Hard to verify truth advantage holds' },
    sources: [
      { title: 'AI Safety via Debate', url: 'https://arxiv.org/abs/1805.00899', year: '2018' },
      { title: 'Debate improves judge accuracy', url: 'https://arxiv.org/abs/2402.06782', year: '2024' },
    ],
    safetyPros: ['Forces consideration of counterarguments', 'Truth advantage theory', 'Externalized reasoning'],
    safetyCons: ['Sophisticated deception may win', 'Confidence escalation', 'Complex reasoning struggles'],
  },
  {
    id: 'ida-amplification',
    category: 'oversight',
    name: 'IDA / Iterated Amplification',
    description: 'Christiano. Amplify weak agents via delegation, distill to faster models, iterate. Recursive decomposition. Related to AlphaGoZero.',
    adoption: 'LOW',
    adoptionNote: 'Training methodology; research stage',
    timeline: 'Research stage',
    safetyOutlook: {
      rating: 'mixed',
      score: 6,
      summary: 'Theoretical promise; limited empirical validation',
    },
    agencyLevel: { level: 'LOW (during training)', note: 'Weak agents amplified' },
    decomposition: { level: 'RECURSIVE', note: 'Task → subtasks → copies → integrate' },
    oversight: { level: 'AMPLIFIED HUMAN', note: 'Human judgment amplified via AI' },
    whitebox: { level: 'MEDIUM', note: 'Training structure visible; distilled model less so' },
    modularity: { level: 'MEDIUM', note: 'Recursive structure' },
    verifiable: { level: 'LOW', note: 'Hard to verify alignment preservation' },
    sources: [
      { title: 'Iterated Distillation and Amplification', url: 'https://ai-alignment.com/iterated-distillation-and-amplification-157debfd1616', year: '2018' },
      { title: 'Supervising strong learners', url: 'https://arxiv.org/abs/1810.08575', year: '2018' },
    ],
    safetyPros: ['Human values preserved', 'Recursive safety', 'Theoretical elegance'],
    safetyCons: ['Limited empirical validation', 'Decomposition limits unclear', 'Distillation may lose alignment'],
  },
];

function Badge({ level }: { level: string }) {
  const lowerLevel = level.toLowerCase();
  const cls = lowerLevel.includes('high') && !lowerLevel.includes('medium') ? 'high' :
              lowerLevel.includes('medium') ? 'medium' :
              lowerLevel.includes('low') && !lowerLevel.includes('medium') ? 'low' :
              lowerLevel.includes('partial') ? 'partial' :
              lowerLevel.includes('minimal') ? 'minimal' :
              lowerLevel.includes('variable') ? 'variable' :
              lowerLevel.includes('none') || lowerLevel.includes('n/a') ? 'none' :
              'unknown';
  return <span className={`da-badge ${cls}`}>{level}</span>;
}

function SafetyOutlookBadge({ rating, score }: { rating: SafetyOutlook; score?: number }) {
  const config = {
    favorable: { label: 'Favorable', cls: 'safety-favorable' },
    mixed: { label: 'Mixed', cls: 'safety-mixed' },
    challenging: { label: 'Challenging', cls: 'safety-challenging' },
    unknown: { label: 'Unknown', cls: 'unknown' },
  };
  const { label, cls } = config[rating];
  return (
    <div className="da-safety-outlook">
      {score !== undefined && (
        <div className={`da-outlook-score ${rating === 'favorable' ? 'good' : rating === 'mixed' ? 'mixed' : 'poor'}`}>
          {score}/10
        </div>
      )}
      <span className={`da-badge ${cls}`}>{label}</span>
    </div>
  );
}

// Column definitions
const COLUMNS = {
  adoption: { key: 'adoption', label: 'Adoption', group: 'overview', default: true },
  safetyOutlook: { key: 'safetyOutlook', label: 'Safety Outlook', group: 'overview', default: true },
  agencyLevel: { key: 'agencyLevel', label: 'Agency Level', group: 'safety', default: true },
  decomposition: { key: 'decomposition', label: 'Decomposition', group: 'safety', default: true },
  oversight: { key: 'oversight', label: 'Oversight', group: 'safety', default: true },
  whitebox: { key: 'whitebox', label: 'White-box', group: 'safety', default: true },
  modularity: { key: 'modularity', label: 'Modularity', group: 'safety', default: false },
  verifiable: { key: 'verifiable', label: 'Verifiable', group: 'safety', default: false },
  sources: { key: 'sources', label: 'Key Sources', group: 'landscape', default: true },
  safetyPros: { key: 'safetyPros', label: 'Safety Pros', group: 'landscape', default: true },
  safetyCons: { key: 'safetyCons', label: 'Safety Cons', group: 'landscape', default: true },
} as const;

type ColumnKey = keyof typeof COLUMNS;

const PRESETS = {
  all: Object.keys(COLUMNS) as ColumnKey[],
  safety: ['safetyOutlook', 'agencyLevel', 'decomposition', 'oversight', 'whitebox', 'modularity', 'verifiable'] as ColumnKey[],
  compact: ['adoption', 'safetyOutlook', 'agencyLevel', 'oversight', 'whitebox'] as ColumnKey[],
  default: Object.entries(COLUMNS).filter(([_, v]) => v.default).map(([k]) => k) as ColumnKey[],
};

export default function DeploymentArchitecturesTableView() {
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

  // Group architectures by category
  const archByCategory = ARCHITECTURES.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<Category, Architecture[]>);

  const categoryOrder: Category[] = ['basic', 'structured', 'oversight'];
  const visibleCount = visibleColumns.size + 1;

  return (
    <>
      <style>{styles}</style>
      <div className="da-page">
        <div className="da-header">
          <a href="/knowledge-base/intelligence-paradigms/">← Intelligence Paradigms</a>
          <span style={{ color: '#9ca3af' }}>|</span>
          <a href="/tables/">All Tables</a>
          <h1>Deployment / Safety Architectures</h1>
          <nav>
            <a href="/knowledge-base/architecture-scenarios/table">Model Architectures</a>
            <a href="/knowledge-base/deployment-architectures/table" className="active">Deployment Architectures</a>
            <a href="/knowledge-base/responses/safety-approaches/table">Safety Approaches</a>
          </nav>
        </div>

        <div className="da-controls">
          <span className="da-controls-label">Columns:</span>
          {Object.entries(COLUMNS).map(([key, col]) => (
            <button
              key={key}
              className={`da-toggle-btn ${col.group} ${isVisible(key as ColumnKey) ? 'active' : ''}`}
              onClick={() => toggleColumn(key as ColumnKey)}
            >
              {col.label}
            </button>
          ))}
          <span className="da-controls-label" style={{ marginLeft: '16px' }}>Presets:</span>
          <button className="da-preset-btn" onClick={() => applyPreset('default')}>Default</button>
          <button className="da-preset-btn" onClick={() => applyPreset('safety')}>Safety Focus</button>
          <button className="da-preset-btn" onClick={() => applyPreset('compact')}>Compact</button>
          <button className="da-preset-btn" onClick={() => applyPreset('all')}>All</button>
        </div>

        <div className="da-content">
          <p className="da-intro">
            <strong>How AI systems are organized for safety.</strong> These architectures are largely model-agnostic—they can be applied
            to transformers, SSMs, or future architectures. The key question: how do we structure AI systems to maintain oversight and safety?
          </p>
          <p className="da-intro" style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
            <strong>Key insight:</strong> Lower agency + more decomposition + better oversight = generally safer.
            But there are tradeoffs with capability and practicality. See also: <a href="/knowledge-base/architecture-scenarios/table" style={{ color: '#3b82f6' }}>Model Architectures</a> for what the AI is made of.
          </p>

          <div className="da-table-wrapper">
            <table className="da-table">
              <thead>
                <tr>
                  <th className="sticky-col" style={{ minWidth: '200px' }}>Architecture</th>
                  {isVisible('adoption') && <th className="overview-col" style={{ minWidth: '130px' }}>Adoption</th>}
                  {isVisible('safetyOutlook') && <th className="overview-col" style={{ minWidth: '120px' }}>Safety Outlook</th>}
                  {isVisible('agencyLevel') && <th className="safety-col" style={{ minWidth: '120px' }}>Agency Level</th>}
                  {isVisible('decomposition') && <th className="safety-col" style={{ minWidth: '130px' }}>Decomposition</th>}
                  {isVisible('oversight') && <th className="safety-col" style={{ minWidth: '140px' }}>Oversight</th>}
                  {isVisible('whitebox') && <th className="safety-col" style={{ minWidth: '110px' }}>White-box</th>}
                  {isVisible('modularity') && <th className="safety-col" style={{ minWidth: '100px' }}>Modularity</th>}
                  {isVisible('verifiable') && <th className="safety-col" style={{ minWidth: '100px' }}>Verifiable</th>}
                  {isVisible('sources') && <th className="landscape-col" style={{ minWidth: '140px' }}>Key Sources</th>}
                  {isVisible('safetyPros') && <th className="landscape-col" style={{ minWidth: '140px' }}>Safety Pros</th>}
                  {isVisible('safetyCons') && <th className="landscape-col" style={{ minWidth: '140px' }}>Safety Cons</th>}
                </tr>
              </thead>
              <tbody>
                {categoryOrder.map((category) => (
                  <>
                    <tr key={`cat-${category}`} className="da-category-row">
                      <td colSpan={visibleCount}>
                        {CATEGORIES[category].label} — {CATEGORIES[category].description}
                      </td>
                    </tr>
                    {archByCategory[category]?.map((a) => (
                      <tr key={a.id}>
                        <td className="sticky-col">
                          <div className="da-arch-name">{a.name}</div>
                          <div className="da-arch-desc">{a.description}</div>
                        </td>
                        {isVisible('adoption') && (
                          <td>
                            <span className="da-badge adoption">{a.adoption}</span>
                            <div className="da-cell-note">{a.adoptionNote}</div>
                            <div className="da-cell-note" style={{ marginTop: '2px' }}>
                              <span className="da-badge timeline">{a.timeline}</span>
                            </div>
                          </td>
                        )}
                        {isVisible('safetyOutlook') && (
                          <td>
                            <SafetyOutlookBadge rating={a.safetyOutlook.rating} score={a.safetyOutlook.score} />
                            <div className="da-cell-note">{a.safetyOutlook.summary}</div>
                          </td>
                        )}
                        {isVisible('agencyLevel') && (
                          <td>
                            <Badge level={a.agencyLevel.level} />
                            <div className="da-cell-note">{a.agencyLevel.note}</div>
                          </td>
                        )}
                        {isVisible('decomposition') && (
                          <td>
                            <Badge level={a.decomposition.level} />
                            <div className="da-cell-note">{a.decomposition.note}</div>
                          </td>
                        )}
                        {isVisible('oversight') && (
                          <td>
                            <Badge level={a.oversight.level} />
                            <div className="da-cell-note">{a.oversight.note}</div>
                          </td>
                        )}
                        {isVisible('whitebox') && (
                          <td>
                            <Badge level={a.whitebox.level} />
                            <div className="da-cell-note">{a.whitebox.note}</div>
                          </td>
                        )}
                        {isVisible('modularity') && (
                          <td>
                            <Badge level={a.modularity.level} />
                            <div className="da-cell-note">{a.modularity.note}</div>
                          </td>
                        )}
                        {isVisible('verifiable') && (
                          <td>
                            <Badge level={a.verifiable.level} />
                            <div className="da-cell-note">{a.verifiable.note}</div>
                          </td>
                        )}
                        {isVisible('sources') && (
                          <td>
                            <div className="da-sources">
                              {a.sources.map((src, i) => (
                                <div key={i} style={{ marginBottom: '2px' }}>
                                  {src.url ? (
                                    <a href={src.url} target="_blank" rel="noopener noreferrer">
                                      {src.title}
                                    </a>
                                  ) : (
                                    src.title
                                  )}
                                  {src.year && <span style={{ color: '#9ca3af' }}> ({src.year})</span>}
                                </div>
                              ))}
                            </div>
                          </td>
                        )}
                        {isVisible('safetyPros') && (
                          <td>
                            <div className="da-pros-cons">
                              {a.safetyPros.map((pro) => (
                                <div key={pro} className="da-pro">+ {pro}</div>
                              ))}
                            </div>
                          </td>
                        )}
                        {isVisible('safetyCons') && (
                          <td>
                            <div className="da-pros-cons">
                              {a.safetyCons.map((con) => (
                                <div key={con} className="da-con">− {con}</div>
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
