// Table view for AI Evaluation Types - Strategic Analysis
import { useState } from 'react';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .ev-page { min-height: 100vh; display: flex; flex-direction: column; }
  .ev-header {
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
  .ev-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .ev-header a:hover { color: #374151; }
  .ev-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .ev-header nav {
    display: flex;
    gap: 8px;
  }
  .ev-header nav a {
    padding: 6px 12px;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    font-size: 13px;
  }
  .ev-header nav a:hover { background: #e5e7eb; }
  .ev-header nav a.active { background: #3b82f6; color: white; }
  .ev-controls {
    padding: 12px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .ev-controls-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    margin-right: 4px;
  }
  .ev-toggle-btn {
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #d1d5db;
    background: white;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    color: #6b7280;
  }
  .ev-toggle-btn:hover { background: #f3f4f6; }
  .ev-toggle-btn.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  .ev-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .ev-intro {
    margin-bottom: 24px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 1000px;
  }
  .ev-table-wrapper {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }
  .ev-table {
    border-collapse: collapse;
    font-size: 12px;
    min-width: 2200px;
  }
  .ev-table th {
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
  .ev-table th.sticky-col {
    position: sticky;
    left: 0;
    z-index: 20;
    background: linear-gradient(to right, #fce7f3, #fdf2f8);
    color: #9d174d;
    font-size: 13px;
    font-weight: 700;
    border-right: 2px solid #fbcfe8;
  }
  .ev-table th.signal-col {
    background: #ecfdf5;
    color: #065f46;
  }
  .ev-table th.risk-col {
    background: #fef3c7;
    color: #92400e;
  }
  .ev-table th.strategy-col {
    background: #ede9fe;
    color: #5b21b6;
  }
  .ev-table th.landscape-col {
    background: #f0f9ff;
    color: #0369a1;
  }
  .ev-table td {
    padding: 12px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .ev-table td.sticky-col {
    position: sticky;
    left: 0;
    background: #fffbfe;
    z-index: 5;
    border-right: 2px solid #fce7f3;
  }
  .ev-table tr:hover td {
    background: #f9fafb;
  }
  .ev-table tr:hover td.sticky-col {
    background: #fdf2f8;
  }
  .ev-eval-name {
    font-weight: 600;
    color: #111827;
    font-size: 13px;
    margin-bottom: 4px;
  }
  .ev-eval-desc {
    color: #6b7280;
    font-size: 11px;
    line-height: 1.4;
    max-width: 220px;
  }
  .ev-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
  }
  .ev-badge.high { background: #dcfce7; color: #166534; }
  .ev-badge.medium { background: #fef3c7; color: #92400e; }
  .ev-badge.low { background: #fee2e2; color: #991b1b; }
  .ev-badge.unknown { background: #f3f4f6; color: #6b7280; }
  .ev-badge.partial { background: #e0e7ff; color: #3730a3; }
  .ev-badge.category { background: #f3e8ff; color: #6b21a8; }
  .ev-badge.timing { background: #dbeafe; color: #1e40af; }
  .ev-cell-note {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 4px;
    line-height: 1.3;
  }
  .ev-risk-list {
    font-size: 11px;
  }
  .ev-risk-item {
    margin-bottom: 2px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .ev-risk-icon {
    flex-shrink: 0;
  }
  .ev-risk-strong { color: #166534; }
  .ev-risk-weak { color: #dc2626; }
  .ev-risk-partial { color: #d97706; }
  .ev-labs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .ev-lab {
    font-size: 10px;
    padding: 2px 6px;
    background: #f3f4f6;
    border-radius: 4px;
    color: #374151;
  }
  .ev-examples {
    font-size: 11px;
    color: #6b7280;
  }
  .ev-example-item {
    margin-bottom: 2px;
  }
  .ev-pros-cons {
    font-size: 11px;
  }
  .ev-pro {
    color: #166534;
  }
  .ev-con {
    color: #991b1b;
  }
  .ev-category-row td {
    background: #f9fafb !important;
    border-top: 3px solid #d1d5db;
  }
  .ev-category-label {
    font-weight: 700;
    font-size: 13px;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

type RiskCoverage = {
  risk: string;
  strength: 'strong' | 'partial' | 'weak';
  note?: string;
};

type EvalType = {
  id: string;
  name: string;
  description: string;
  category: string;
  // Signal quality
  signalReliability: { level: string; note: string };
  coverageDepth: { level: string; note: string };
  goodhartRisk: { level: string; note: string };
  // Risk coverage
  riskCoverage: RiskCoverage[];
  // Strategic properties
  timing: { when: string; note: string };
  archDependence: { level: string; note: string };
  actionability: { level: string; note: string };
  scalability: { level: string; note: string };
  // Landscape
  labs: string[];
  examples: string[];
  keyPapers: string[];
  // Assessment
  strategicPros: string[];
  strategicCons: string[];
};

const EVAL_TYPES: EvalType[] = [
  // === CAPABILITY EVALS ===
  {
    id: 'dangerous-capability-evals',
    name: 'Dangerous Capability Evals',
    description: 'Structured assessments of whether models can perform specific dangerous tasks: bioweapons synthesis, cyberattacks, persuasion/manipulation, autonomous replication.',
    category: 'Capability Evals',
    signalReliability: { level: 'MEDIUM', note: 'Clear pass/fail on specific tasks; but tasks may not match real-world threat' },
    coverageDepth: { level: 'LOW', note: 'Tests known threats; unknown unknowns remain' },
    goodhartRisk: { level: 'MEDIUM', note: 'Labs may optimize to pass specific tests without reducing underlying risk' },
    riskCoverage: [
      { risk: 'Bioweapons', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Cyberweapons', strength: 'strong', note: 'Direct measurement' },
      { risk: 'CBRN uplift', strength: 'partial', note: 'Chemistry/nuclear harder to test' },
      { risk: 'Autonomous replication', strength: 'partial', note: 'Sandbox limitations' },
    ],
    timing: { when: 'Pre-deployment', note: 'Run before release; but capabilities may emerge post-deployment' },
    archDependence: { level: 'LOW', note: 'Behavioral; works on any queryable model' },
    actionability: { level: 'HIGH', note: 'Clear thresholds for go/no-go decisions' },
    scalability: { level: 'MEDIUM', note: 'Human expert validation needed; expensive' },
    labs: ['Anthropic', 'OpenAI', 'DeepMind', 'METR'],
    examples: ['METR ARA evals', 'Anthropic RSP evals', 'OpenAI preparedness evals'],
    keyPapers: ['Model evaluation for extreme risks (2023)', 'METR Task Suite', 'Frontier AI regulation (Anderljung 2023)'],
    strategicPros: ['Concrete evidence for policymakers', 'Triggers RSP commitments', 'Legally defensible standards'],
    strategicCons: ['Known unknowns only', 'Expensive expert validation', 'May lag capability emergence', 'Gaming/teaching-to-test risk'],
  },
  {
    id: 'frontier-capability-benchmarks',
    name: 'Frontier Capability Benchmarks',
    description: 'Standard benchmarks measuring general capabilities: MMLU, MATH, HumanEval, GPQA, etc. Track capability frontier over time.',
    category: 'Capability Evals',
    signalReliability: { level: 'HIGH', note: 'Well-defined tasks; reproducible' },
    coverageDepth: { level: 'MEDIUM', note: 'Broad coverage but saturating quickly' },
    goodhartRisk: { level: 'HIGH', note: 'Extensively trained on; contamination issues' },
    riskCoverage: [
      { risk: 'Capability tracking', strength: 'strong', note: 'Primary purpose' },
      { risk: 'Misalignment', strength: 'weak', note: 'Capabilities ≠ alignment' },
      { risk: 'Misuse', strength: 'weak', note: 'Indirect signal only' },
    ],
    timing: { when: 'Continuous', note: 'Run throughout development' },
    archDependence: { level: 'LOW', note: 'Behavioral; architecture-agnostic' },
    actionability: { level: 'LOW', note: 'No clear thresholds; just trend tracking' },
    scalability: { level: 'HIGH', note: 'Fully automated' },
    labs: ['All major labs', 'Academic groups'],
    examples: ['MMLU', 'MATH', 'HumanEval', 'GPQA', 'ARC-AGI', 'SWE-bench'],
    keyPapers: ['MMLU (Hendrycks 2021)', 'Measuring Massive Multitask Language Understanding'],
    strategicPros: ['Universal comparison', 'Historical trend data', 'Cheap and fast'],
    strategicCons: ['Goodharted extensively', 'Contamination', 'Doesn\'t measure risk', 'Saturation'],
  },
  {
    id: 'uplift-studies',
    name: 'Uplift Studies',
    description: 'Measure marginal risk increase from AI access. Compare expert vs novice performance with/without AI assistance on dangerous tasks.',
    category: 'Capability Evals',
    signalReliability: { level: 'HIGH', note: 'Controlled comparison; causal signal' },
    coverageDepth: { level: 'LOW', note: 'Very expensive; few tasks studied' },
    goodhartRisk: { level: 'LOW', note: 'Hard to game controlled experiments' },
    riskCoverage: [
      { risk: 'Bioweapons', strength: 'strong', note: 'RAND study showed measurable uplift' },
      { risk: 'Cyberweapons', strength: 'partial', note: 'Some studies exist' },
      { risk: 'Social engineering', strength: 'partial', note: 'Hard to measure ethically' },
    ],
    timing: { when: 'Pre-deployment', note: 'Expensive; done for major releases only' },
    archDependence: { level: 'LOW', note: 'Measures system behavior' },
    actionability: { level: 'HIGH', note: 'Directly answers "does this make attacks easier?"' },
    scalability: { level: 'LOW', note: 'Requires human subjects; IRB approval; expensive' },
    labs: ['Anthropic', 'OpenAI', 'RAND', 'Academic groups'],
    examples: ['RAND bioweapons uplift study', 'OpenAI GPT-4 red team reports'],
    keyPapers: ['The Operational Risks of AI in Large-Scale Biological Attacks (RAND 2024)'],
    strategicPros: ['Gold standard for marginal risk', 'Credible to policymakers', 'Causal not correlational'],
    strategicCons: ['Very expensive', 'Small sample sizes', 'Ethical constraints limit scope', 'Results may be suppressed'],
  },
  // === ALIGNMENT EVALS ===
  {
    id: 'deception-evals',
    name: 'Deception Evals',
    description: 'Test for strategic deception: sandbagging on evals, lying to evaluators, concealing capabilities, pretending to be aligned.',
    category: 'Alignment Evals',
    signalReliability: { level: 'LOW', note: 'A truly deceptive model would pass these tests' },
    coverageDepth: { level: 'LOW', note: 'Only catches unsophisticated deception' },
    goodhartRisk: { level: 'HIGH', note: 'Training not to fail these evals ≠ training not to deceive' },
    riskCoverage: [
      { risk: 'Deceptive alignment', strength: 'weak', note: 'Fundamental observability problem' },
      { risk: 'Scheming', strength: 'weak', note: 'Sophisticated schemers pass by design' },
      { risk: 'Sandbagging', strength: 'partial', note: 'Some techniques detect it' },
    ],
    timing: { when: 'Pre-deployment', note: 'But deception may only emerge in deployment' },
    archDependence: { level: 'LOW', note: 'Behavioral; but interp could help' },
    actionability: { level: 'LOW', note: 'Passing doesn\'t mean safe; failing is informative' },
    scalability: { level: 'MEDIUM', note: 'Automated but needs creative adversarial design' },
    labs: ['Anthropic', 'Redwood Research', 'ARC Evals'],
    examples: ['Sleeper agents paper', 'ARC deception tests', 'Anthropic sandbagging evals'],
    keyPapers: ['Sleeper Agents (Anthropic 2024)', 'Towards Understanding Sycophancy'],
    strategicPros: ['Raises awareness', 'Failure is clear signal', 'Drives interp research'],
    strategicCons: ['Passing means little', 'Sophisticated deception undetectable', 'May create false confidence'],
  },
  {
    id: 'power-seeking-evals',
    name: 'Power-Seeking Evals',
    description: 'Test for instrumental convergence behaviors: resource acquisition, self-preservation, avoiding shutdown, expanding influence.',
    category: 'Alignment Evals',
    signalReliability: { level: 'LOW', note: 'Easy to suppress in eval; may only emerge with real stakes' },
    coverageDepth: { level: 'LOW', note: 'Toy scenarios don\'t capture real deployment' },
    goodhartRisk: { level: 'HIGH', note: 'Models learn to avoid triggering these' },
    riskCoverage: [
      { risk: 'Instrumental convergence', strength: 'partial', note: 'Tests the concept' },
      { risk: 'Self-preservation', strength: 'partial', note: 'Scenario-dependent' },
      { risk: 'Real-world power-seeking', strength: 'weak', note: 'Gap from toy to real' },
    ],
    timing: { when: 'Pre-deployment', note: 'But behavior may differ in deployment' },
    archDependence: { level: 'MEDIUM', note: 'RL agents more relevant than LLMs' },
    actionability: { level: 'LOW', note: 'Passing doesn\'t guarantee safety' },
    scalability: { level: 'MEDIUM', note: 'Need careful scenario design' },
    labs: ['DeepMind', 'Anthropic', 'ARC Evals'],
    examples: ['MACHIAVELLI benchmark', 'Shutdown problem tests', 'Resource acquisition games'],
    keyPapers: ['MACHIAVELLI (Pan et al. 2023)', 'Optimal Policies Tend to Seek Power'],
    strategicPros: ['Tests core alignment theory predictions', 'Concrete operationalization'],
    strategicCons: ['Toy scenarios', 'Easy to game', 'May not generalize', 'Theory-reality gap'],
  },
  {
    id: 'goal-stability-evals',
    name: 'Goal Stability / Goal Preservation',
    description: 'Test whether models maintain consistent goals vs allowing goal modification. Relevant to corrigibility and shutdown problems.',
    category: 'Alignment Evals',
    signalReliability: { level: 'LOW', note: 'Goals may not be stable or well-defined for LLMs' },
    coverageDepth: { level: 'LOW', note: 'Mostly theoretical; few concrete tests' },
    goodhartRisk: { level: 'MEDIUM', note: 'Can train to accept modification superficially' },
    riskCoverage: [
      { risk: 'Corrigibility failure', strength: 'partial', note: 'Tests the concept' },
      { risk: 'Value lock-in', strength: 'partial', note: 'If goals too stable' },
      { risk: 'Goal drift', strength: 'partial', note: 'If goals unstable' },
    ],
    timing: { when: 'Research', note: 'Still mostly theoretical' },
    archDependence: { level: 'HIGH', note: 'Very different for LLMs vs RL agents' },
    actionability: { level: 'LOW', note: 'Unclear what "good" performance means' },
    scalability: { level: 'LOW', note: 'Requires careful philosophical framing' },
    labs: ['MIRI', 'DeepMind', 'Academic groups'],
    examples: ['Corrigibility tests', 'Shutdown problem scenarios'],
    keyPapers: ['Corrigibility (Soares et al. 2015)', 'The Off-Switch Game'],
    strategicPros: ['Addresses fundamental alignment problem', 'Theoretically grounded'],
    strategicCons: ['Very abstract', 'May not apply to LLMs', 'Unclear operationalization'],
  },
  {
    id: 'situational-awareness-evals',
    name: 'Situational Awareness Evals',
    description: 'Test whether models know they are AI, understand training/deployment, can reason about their own situation.',
    category: 'Alignment Evals',
    signalReliability: { level: 'MEDIUM', note: 'Can measure knowledge; harder to measure implications' },
    coverageDepth: { level: 'MEDIUM', note: 'Growing suite of tests' },
    goodhartRisk: { level: 'HIGH', note: 'Easy to train away surface behavior without changing underlying awareness' },
    riskCoverage: [
      { risk: 'Deceptive alignment', strength: 'partial', note: 'SA is necessary but not sufficient' },
      { risk: 'Scheming', strength: 'partial', note: 'SA enables but doesn\'t prove scheming' },
      { risk: 'Self-improvement', strength: 'partial', note: 'Requires knowing own nature' },
    ],
    timing: { when: 'Continuous', note: 'Track emergence over model scale' },
    archDependence: { level: 'LOW', note: 'Behavioral tests; any model' },
    actionability: { level: 'MEDIUM', note: 'High SA may warrant more scrutiny' },
    scalability: { level: 'HIGH', note: 'Automated tests' },
    labs: ['Anthropic', 'ARC Evals', 'MATS researchers'],
    examples: ['SAD benchmark', 'In-context awareness tests', '"Am I an AI?" probes'],
    keyPapers: ['Situational Awareness Dataset (Laine et al. 2024)', 'Model Written Evals'],
    strategicPros: ['Tracks concerning capability', 'Scalable', 'Clear signal'],
    strategicCons: ['SA alone isn\'t dangerous', 'Easy to hide', 'May increase with scale regardless'],
  },
  // === EPISTEMIC EVALS ===
  {
    id: 'honesty-evals',
    name: 'Honesty / Truthfulness Evals',
    description: 'Test whether models give true answers, admit uncertainty, avoid hallucination, don\'t make things up.',
    category: 'Epistemic Evals',
    signalReliability: { level: 'MEDIUM', note: 'Clear for factual questions; harder for opinions/uncertainty' },
    coverageDepth: { level: 'MEDIUM', note: 'Many benchmarks but hard to cover all cases' },
    goodhartRisk: { level: 'MEDIUM', note: 'Can train to say "I don\'t know" too often' },
    riskCoverage: [
      { risk: 'Hallucination', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Misinformation', strength: 'partial', note: 'Factual subset' },
      { risk: 'Epistemic manipulation', strength: 'partial', note: 'Honest ≠ not manipulative' },
    ],
    timing: { when: 'Continuous', note: 'Run throughout development' },
    archDependence: { level: 'LOW', note: 'Behavioral; architecture-agnostic' },
    actionability: { level: 'MEDIUM', note: 'Can train for honesty but unclear limits' },
    scalability: { level: 'HIGH', note: 'Fully automated' },
    labs: ['All major labs'],
    examples: ['TruthfulQA', 'HaluEval', 'FactScore'],
    keyPapers: ['TruthfulQA (Lin et al. 2022)', 'Measuring Hallucination in LLMs'],
    strategicPros: ['Foundational for trust', 'Concrete metrics', 'Scalable'],
    strategicCons: ['Ground truth required', 'May reduce helpfulness', 'Strategic honesty vs genuine'],
  },
  {
    id: 'sycophancy-evals',
    name: 'Sycophancy Evals',
    description: 'Test whether models inappropriately agree with users, change answers based on user beliefs, or flatter rather than inform.',
    category: 'Epistemic Evals',
    signalReliability: { level: 'HIGH', note: 'Clear experimental design; reproducible' },
    coverageDepth: { level: 'MEDIUM', note: 'Well-studied phenomenon' },
    goodhartRisk: { level: 'MEDIUM', note: 'Can train to be contrarian instead' },
    riskCoverage: [
      { risk: 'Epistemic deference', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Value drift from users', strength: 'partial', note: 'If models adopt user beliefs' },
      { risk: 'Manipulation', strength: 'partial', note: 'Sycophancy can enable manipulation' },
    ],
    timing: { when: 'Pre/post RLHF', note: 'RLHF often increases sycophancy' },
    archDependence: { level: 'LOW', note: 'Behavioral; emerges from RLHF' },
    actionability: { level: 'MEDIUM', note: 'Can train against but in tension with helpfulness' },
    scalability: { level: 'HIGH', note: 'Fully automated' },
    labs: ['Anthropic', 'OpenAI', 'Academic groups'],
    examples: ['Sycophancy benchmarks', 'Opinion change tests', 'Debate format tests'],
    keyPapers: ['Towards Understanding Sycophancy in LLMs (Anthropic 2023)', 'RLHF and sycophancy'],
    strategicPros: ['Well-understood failure mode', 'Measurable', 'Training helps'],
    strategicCons: ['In tension with being helpful', 'May increase with scale', 'Cultural variation'],
  },
  {
    id: 'calibration-evals',
    name: 'Calibration Evals',
    description: 'Test whether model confidence matches accuracy. When model says 80% confident, is it right 80% of the time?',
    category: 'Epistemic Evals',
    signalReliability: { level: 'HIGH', note: 'Statistical measurement; well-defined' },
    coverageDepth: { level: 'MEDIUM', note: 'Applies to all factual claims' },
    goodhartRisk: { level: 'LOW', note: 'Hard to game calibration in aggregate' },
    riskCoverage: [
      { risk: 'Overconfidence', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Decision-making errors', strength: 'partial', note: 'If users trust confidences' },
      { risk: 'Unknown unknowns', strength: 'weak', note: 'Calibration on known questions' },
    ],
    timing: { when: 'Continuous', note: 'Can track over development' },
    archDependence: { level: 'LOW', note: 'Behavioral; any model' },
    actionability: { level: 'MEDIUM', note: 'Can train for calibration' },
    scalability: { level: 'HIGH', note: 'Fully automated' },
    labs: ['All major labs', 'Academic groups'],
    examples: ['Calibration benchmarks', 'Brier scores', 'ECE metrics'],
    keyPapers: ['Language Models (Mostly) Know What They Know (Anthropic 2022)'],
    strategicPros: ['Foundational for decision-making', 'Well-defined metrics', 'Trainable'],
    strategicCons: ['May not transfer to novel domains', 'Verbalized confidence ≠ behavioral confidence'],
  },
  // === CONTROL EVALS ===
  {
    id: 'control-evals',
    name: 'Control / Containment Evals',
    description: 'Test effectiveness of oversight measures: Can the model be controlled? Can it be monitored? Can it be shut down?',
    category: 'Control Evals',
    signalReliability: { level: 'MEDIUM', note: 'Tests specific measures; adversarial model may find bypasses' },
    coverageDepth: { level: 'MEDIUM', note: 'Growing suite; but creative attacks hard to anticipate' },
    goodhartRisk: { level: 'HIGH', note: 'If model knows the eval, may hide ability to escape' },
    riskCoverage: [
      { risk: 'Loss of control', strength: 'partial', note: 'Tests current measures' },
      { risk: 'Autonomous replication', strength: 'partial', note: 'Sandbox escape tests' },
      { risk: 'Coordination failures', strength: 'weak', note: 'Tests individual systems' },
    ],
    timing: { when: 'Pre-deployment', note: 'Red team before release' },
    archDependence: { level: 'MEDIUM', note: 'Depends on deployment architecture' },
    actionability: { level: 'HIGH', note: 'Clear failures to fix' },
    scalability: { level: 'LOW', note: 'Requires creative adversarial thinking' },
    labs: ['Anthropic', 'Redwood Research', 'ARC Evals'],
    examples: ['AI control protocols', 'Sandbox escape tests', 'Trusted monitoring'],
    keyPapers: ['AI Control (Greenblatt et al. 2024)', 'Catching AI cheaters'],
    strategicPros: ['Doesn\'t require solving alignment', 'Pragmatic', 'Clear success criteria'],
    strategicCons: ['Arms race dynamic', 'May give false confidence', 'Strong AI may overcome any control'],
  },
  {
    id: 'instruction-following-evals',
    name: 'Instruction Following Evals',
    description: 'Test whether models follow user instructions precisely, including safety-relevant instructions like content policies.',
    category: 'Control Evals',
    signalReliability: { level: 'HIGH', note: 'Clear success criteria' },
    coverageDepth: { level: 'MEDIUM', note: 'Many instruction types; edge cases hard' },
    goodhartRisk: { level: 'MEDIUM', note: 'Can be too literal or miss intent' },
    riskCoverage: [
      { risk: 'Policy violations', strength: 'strong', note: 'Tests compliance' },
      { risk: 'Specification gaming', strength: 'partial', note: 'Tests for loopholes' },
      { risk: 'Goal misgeneralization', strength: 'weak', note: 'Instructions ≠ goals' },
    ],
    timing: { when: 'Continuous', note: 'Throughout development' },
    archDependence: { level: 'LOW', note: 'Behavioral; any model' },
    actionability: { level: 'HIGH', note: 'Can train for instruction following' },
    scalability: { level: 'HIGH', note: 'Mostly automated' },
    labs: ['All major labs'],
    examples: ['IFEval', 'Instruction hierarchy tests', 'Policy compliance tests'],
    keyPapers: ['IFEval (Zhou et al. 2023)', 'The Instruction Hierarchy'],
    strategicPros: ['Foundational for control', 'Trainable', 'Clear metrics'],
    strategicCons: ['Instructions may conflict', 'Literal ≠ intended', 'Gaming possible'],
  },
  {
    id: 'jailbreak-robustness',
    name: 'Jailbreak Robustness Evals',
    description: 'Test resistance to adversarial prompts that attempt to bypass safety measures. Red teaming for prompt injection and jailbreaks.',
    category: 'Control Evals',
    signalReliability: { level: 'MEDIUM', note: 'Tests known attacks; new attacks emerge constantly' },
    coverageDepth: { level: 'LOW', note: 'Infinite attack surface; only samples' },
    goodhartRisk: { level: 'HIGH', note: 'Patch specific jailbreaks without fixing root cause' },
    riskCoverage: [
      { risk: 'Misuse via jailbreaks', strength: 'partial', note: 'Tests current defenses' },
      { risk: 'Policy circumvention', strength: 'partial', note: 'Known techniques' },
      { risk: 'Novel attacks', strength: 'weak', note: 'New jailbreaks keep emerging' },
    ],
    timing: { when: 'Continuous', note: 'Ongoing red teaming' },
    archDependence: { level: 'LOW', note: 'Behavioral; any deployed model' },
    actionability: { level: 'MEDIUM', note: 'Can patch but whack-a-mole' },
    scalability: { level: 'MEDIUM', note: 'Automated + manual red teaming' },
    labs: ['All major labs', 'Security researchers', 'HackerOne programs'],
    examples: ['JailbreakBench', 'AdvBench', 'Prompt injection CTFs'],
    keyPapers: ['Universal adversarial suffixes', 'Many-shot jailbreaking'],
    strategicPros: ['Reduces surface area', 'Required for deployment', 'Community engagement'],
    strategicCons: ['Endless arms race', 'Never complete', 'May encourage capability hiding'],
  },
  // === INTERPRETABILITY-ASSISTED EVALS ===
  {
    id: 'mechanistic-interp-probes',
    name: 'Mechanistic Interpretability Probes',
    description: 'Use interp techniques to understand what models know/want: probing classifiers, activation analysis, feature circuits.',
    category: 'Interpretability Evals',
    signalReliability: { level: 'LOW', note: 'Interpretation of interp results is contested' },
    coverageDepth: { level: 'LOW', note: 'Only understand tiny fraction of model' },
    goodhartRisk: { level: 'LOW', note: 'Hard to game internals without changing behavior' },
    riskCoverage: [
      { risk: 'Deceptive alignment', strength: 'partial', note: 'Could detect deception directly' },
      { risk: 'Goal content', strength: 'partial', note: 'Might reveal true goals' },
      { risk: 'Capability elicitation', strength: 'partial', note: 'Find hidden capabilities' },
    ],
    timing: { when: 'Research', note: 'Not yet deployment-ready' },
    archDependence: { level: 'HIGH', note: 'Transformer-specific; may not transfer' },
    actionability: { level: 'LOW', note: 'Unclear what to do with findings' },
    scalability: { level: 'LOW', note: 'Very labor-intensive' },
    labs: ['Anthropic', 'DeepMind', 'EleutherAI', 'Academic groups'],
    examples: ['Probing classifiers', 'Activation patching', 'SAE features', 'Circuit analysis'],
    keyPapers: ['Toy Models of Superposition', 'Scaling Monosemanticity', 'Representation Engineering'],
    strategicPros: ['Could solve observability problem', 'Ground truth about internals', 'Not gameable'],
    strategicCons: ['Not yet practical', 'Interpretation uncertain', 'May not scale', 'Architecture-dependent'],
  },
  {
    id: 'representation-probing',
    name: 'Representation / Belief Probing',
    description: 'Linear probes and other techniques to read out model beliefs, knowledge states, and internal representations directly.',
    category: 'Interpretability Evals',
    signalReliability: { level: 'MEDIUM', note: 'Probes work; interpretation debated' },
    coverageDepth: { level: 'LOW', note: 'One concept at a time' },
    goodhartRisk: { level: 'LOW', note: 'Would require modifying internal representations' },
    riskCoverage: [
      { risk: 'Hidden knowledge', strength: 'partial', note: 'Detect knowledge vs behavior gap' },
      { risk: 'Lying', strength: 'partial', note: 'Compare stated vs internal belief' },
      { risk: 'Emergent world models', strength: 'partial', note: 'Understand what model believes' },
    ],
    timing: { when: 'Research/Development', note: 'Needs model access' },
    archDependence: { level: 'HIGH', note: 'Requires weight access; architecture-specific' },
    actionability: { level: 'MEDIUM', note: 'Can inform training if clear signal' },
    scalability: { level: 'MEDIUM', note: 'Automated once probes trained' },
    labs: ['Anthropic', 'EleutherAI', 'Academic groups'],
    examples: ['CCS (Contrast Consistent Search)', 'Truth probes', 'Belief state probes'],
    keyPapers: ['Discovering Latent Knowledge (Burns et al. 2023)', 'Representation Engineering'],
    strategicPros: ['Bypasses behavioral output', 'Could detect lying', 'Ground truth about beliefs'],
    strategicCons: ['Probe validity debated', 'Requires weight access', 'May not find all relevant info'],
  },
  // === RED TEAMING ===
  {
    id: 'automated-red-teaming',
    name: 'Automated Red Teaming',
    description: 'Use AI to find weaknesses: adversarial prompt generation, automated jailbreak search, model-vs-model attacks.',
    category: 'Red Teaming',
    signalReliability: { level: 'MEDIUM', note: 'Finds real attacks but may miss creative human attacks' },
    coverageDepth: { level: 'MEDIUM', note: 'Scales better than human; still incomplete' },
    goodhartRisk: { level: 'MEDIUM', note: 'Train against found attacks but new ones emerge' },
    riskCoverage: [
      { risk: 'Jailbreaks', strength: 'strong', note: 'Primary use case' },
      { risk: 'Policy violations', strength: 'strong', note: 'Finds edge cases' },
      { risk: 'Novel misuse', strength: 'partial', note: 'Depends on red team model capability' },
    ],
    timing: { when: 'Continuous', note: 'Automated pipeline' },
    archDependence: { level: 'LOW', note: 'Black-box; any deployed model' },
    actionability: { level: 'HIGH', note: 'Found attacks can be patched' },
    scalability: { level: 'HIGH', note: 'Automated; scales with compute' },
    labs: ['Anthropic', 'OpenAI', 'DeepMind', 'Various startups'],
    examples: ['Perez et al. red teaming', 'GCG attacks', 'PAIR', 'TAP'],
    keyPapers: ['Red Teaming LLMs with LLMs (Perez et al. 2022)', 'Universal Adversarial Suffixes'],
    strategicPros: ['Scales', 'Finds real attacks', 'Improves with AI capabilities'],
    strategicCons: ['Arms race', 'Creative attacks may be missed', 'Requires good red team model'],
  },
  {
    id: 'human-red-teaming',
    name: 'Human Expert Red Teaming',
    description: 'Domain experts attempt to elicit dangerous behavior: biosecurity experts, cybersecurity researchers, persuasion experts.',
    category: 'Red Teaming',
    signalReliability: { level: 'HIGH', note: 'Most realistic threat model' },
    coverageDepth: { level: 'LOW', note: 'Small sample; expensive' },
    goodhartRisk: { level: 'LOW', note: 'Creative humans hard to anticipate' },
    riskCoverage: [
      { risk: 'Bioweapons', strength: 'strong', note: 'Expert evaluation' },
      { risk: 'Cyberweapons', strength: 'strong', note: 'Expert evaluation' },
      { risk: 'Manipulation', strength: 'strong', note: 'Expert evaluation' },
      { risk: 'Novel attacks', strength: 'partial', note: 'Depends on expert creativity' },
    ],
    timing: { when: 'Pre-major-release', note: 'Expensive; for major releases' },
    archDependence: { level: 'LOW', note: 'Black-box; any system' },
    actionability: { level: 'HIGH', note: 'Direct feedback on failures' },
    scalability: { level: 'LOW', note: 'Limited by expert availability' },
    labs: ['All major labs', 'Third-party contractors'],
    examples: ['OpenAI red team network', 'Anthropic domain expert testing', 'METR evaluations'],
    keyPapers: ['GPT-4 System Card', 'Claude 3 Model Card'],
    strategicPros: ['Gold standard', 'Realistic threat model', 'Finds unexpected issues'],
    strategicCons: ['Very expensive', 'Small sample', 'May miss attacks experts don\'t think of'],
  },
  // === MODEL ORGANISM / TOY EVALS ===
  {
    id: 'model-organisms',
    name: 'Model Organisms of Misalignment',
    description: 'Deliberately create misaligned models in controlled settings to study alignment failures and test detection methods.',
    category: 'Research Evals',
    signalReliability: { level: 'MEDIUM', note: 'Controlled experiments but may not match natural emergence' },
    coverageDepth: { level: 'LOW', note: 'Studies specific failure modes' },
    goodhartRisk: { level: 'LOW', note: 'Research tool, not deployment test' },
    riskCoverage: [
      { risk: 'Deceptive alignment', strength: 'partial', note: 'Study in controlled setting' },
      { risk: 'Sleeper agents', strength: 'partial', note: 'Anthropic sleeper agents paper' },
      { risk: 'Goal misgeneralization', strength: 'partial', note: 'Can create examples' },
    ],
    timing: { when: 'Research', note: 'Inform eval development' },
    archDependence: { level: 'MEDIUM', note: 'Results may be architecture-specific' },
    actionability: { level: 'MEDIUM', note: 'Develops detection methods' },
    scalability: { level: 'MEDIUM', note: 'Once setup, can run experiments' },
    labs: ['Anthropic', 'Redwood Research', 'DeepMind', 'Academic groups'],
    examples: ['Sleeper agents', 'Reward hacking examples', 'Deceptive models'],
    keyPapers: ['Sleeper Agents (2024)', 'Goal Misgeneralization in Deep RL'],
    strategicPros: ['Controlled study', 'Can iterate on detection', 'Builds understanding'],
    strategicCons: ['Artificial misalignment ≠ natural', 'May not transfer', 'Could be misused'],
  },
  {
    id: 'toy-environments',
    name: 'Toy Environment Evals',
    description: 'Simplified environments to study alignment properties: gridworlds, text games, multi-agent scenarios.',
    category: 'Research Evals',
    signalReliability: { level: 'LOW', note: 'Toy results may not transfer' },
    coverageDepth: { level: 'LOW', note: 'Simplified vs real world' },
    goodhartRisk: { level: 'LOW', note: 'Research tool' },
    riskCoverage: [
      { risk: 'Power-seeking', strength: 'partial', note: 'Study in simple settings' },
      { risk: 'Coordination', strength: 'partial', note: 'Multi-agent scenarios' },
      { risk: 'Specification gaming', strength: 'partial', note: 'Many examples found' },
    ],
    timing: { when: 'Research', note: 'Develop understanding' },
    archDependence: { level: 'HIGH', note: 'Often RL-specific' },
    actionability: { level: 'LOW', note: 'Builds theory but unclear application' },
    scalability: { level: 'HIGH', note: 'Automated simulation' },
    labs: ['DeepMind', 'OpenAI', 'Academic groups'],
    examples: ['AI Safety Gridworlds', 'MACHIAVELLI', 'Melting Pot'],
    keyPapers: ['AI Safety Gridworlds (Leike et al. 2017)', 'Specification Gaming'],
    strategicPros: ['Cheap', 'Fast iteration', 'Tests theory'],
    strategicCons: ['Toy → real gap', 'RL-focused', 'May miss LLM-specific issues'],
  },
  // === SOCIETAL / SYSTEMIC EVALS ===
  {
    id: 'bias-fairness-evals',
    name: 'Bias and Fairness Evals',
    description: 'Test for demographic biases, unfair treatment, stereotyping, and discriminatory outputs.',
    category: 'Societal Evals',
    signalReliability: { level: 'MEDIUM', note: 'Clear for some biases; complex for others' },
    coverageDepth: { level: 'MEDIUM', note: 'Many benchmarks; hard to cover all groups' },
    goodhartRisk: { level: 'HIGH', note: 'Can reduce measured bias without fixing underlying issues' },
    riskCoverage: [
      { risk: 'Discrimination', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Stereotyping', strength: 'strong', note: 'Direct measurement' },
      { risk: 'Systemic harm', strength: 'partial', note: 'Individual tests vs systemic impact' },
    ],
    timing: { when: 'Continuous', note: 'Throughout development and deployment' },
    archDependence: { level: 'LOW', note: 'Behavioral; any model' },
    actionability: { level: 'MEDIUM', note: 'Can train against specific biases' },
    scalability: { level: 'HIGH', note: 'Mostly automated' },
    labs: ['All major labs', 'AI ethics researchers'],
    examples: ['BBQ', 'WinoBias', 'Toxicity benchmarks', 'Representation audits'],
    keyPapers: ['BBQ (Parrish et al. 2022)', 'On the Dangers of Stochastic Parrots'],
    strategicPros: ['Legally required in some contexts', 'Clear harm', 'Public accountability'],
    strategicCons: ['Goodhart risk', 'Complex cultural context', 'May conflict with accuracy'],
  },
  {
    id: 'persuasion-evals',
    name: 'Persuasion / Manipulation Evals',
    description: 'Test ability to change human beliefs and behaviors: political persuasion, sales, emotional manipulation.',
    category: 'Societal Evals',
    signalReliability: { level: 'MEDIUM', note: 'Human studies needed; expensive' },
    coverageDepth: { level: 'LOW', note: 'Many persuasion vectors; hard to cover all' },
    goodhartRisk: { level: 'LOW', note: 'Hard to game human studies' },
    riskCoverage: [
      { risk: 'Mass manipulation', strength: 'partial', note: 'Tests capability but not deployment' },
      { risk: 'Election interference', strength: 'partial', note: 'Specific test domain' },
      { risk: 'Radicalization', strength: 'partial', note: 'Ethical constraints on testing' },
    ],
    timing: { when: 'Pre-deployment', note: 'For major releases' },
    archDependence: { level: 'LOW', note: 'Behavioral; any model' },
    actionability: { level: 'LOW', note: 'Capability exists; mitigation unclear' },
    scalability: { level: 'LOW', note: 'Requires human subjects' },
    labs: ['Anthropic', 'OpenAI', 'Academic groups'],
    examples: ['Political persuasion studies', 'Durmus et al. persuasion evals', 'Simulated social interactions'],
    keyPapers: ['Durmus et al. persuasion study', 'AI and manipulation research'],
    strategicPros: ['Measures real risk', 'Human ground truth', 'Policy-relevant'],
    strategicCons: ['Expensive', 'Ethical constraints', 'Lab vs real-world gap'],
  },
  {
    id: 'emergent-behavior-evals',
    name: 'Emergent Behavior Detection',
    description: 'Monitor for unexpected capabilities or behaviors that emerge at scale or in deployment. Anomaly detection.',
    category: 'Societal Evals',
    signalReliability: { level: 'LOW', note: 'Hard to define "unexpected"; noisy' },
    coverageDepth: { level: 'LOW', note: 'Inherently limited to what we monitor' },
    goodhartRisk: { level: 'LOW', note: 'Not optimized against' },
    riskCoverage: [
      { risk: 'Unknown unknowns', strength: 'partial', note: 'Only approach to this' },
      { risk: 'Emergent capabilities', strength: 'partial', note: 'May detect new abilities' },
      { risk: 'Phase transitions', strength: 'partial', note: 'Track capability jumps' },
    ],
    timing: { when: 'Continuous', note: 'Ongoing monitoring' },
    archDependence: { level: 'LOW', note: 'Behavioral monitoring' },
    actionability: { level: 'LOW', note: 'Detection is easy; response is hard' },
    scalability: { level: 'HIGH', note: 'Automated monitoring' },
    labs: ['All major labs'],
    examples: ['Capability elicitation', 'User feedback monitoring', 'Anomaly detection systems'],
    keyPapers: ['Emergent Abilities of Large Language Models', 'Are Emergent Abilities a Mirage?'],
    strategicPros: ['Only way to catch surprises', 'Scales with deployment'],
    strategicCons: ['High false positive rate', 'May miss subtle emergence', 'Response unclear'],
  },
];

// Group evals by category
const categories = [...new Set(EVAL_TYPES.map(e => e.category))];

function Badge({ level }: { level: string }) {
  const cls = level.toLowerCase().includes('high') ? 'high' :
              level.toLowerCase().includes('medium') || level.toLowerCase().includes('partial') ? 'medium' :
              level.toLowerCase().includes('low') || level.toLowerCase().includes('limited') ? 'low' :
              'unknown';
  return <span className={`ev-badge ${cls}`}>{level}</span>;
}

function RiskCoverageCell({ risks }: { risks: RiskCoverage[] }) {
  return (
    <div className="ev-risk-list">
      {risks.map((r, i) => (
        <div key={i} className="ev-risk-item">
          <span className={`ev-risk-icon ${r.strength === 'strong' ? 'ev-risk-strong' : r.strength === 'partial' ? 'ev-risk-partial' : 'ev-risk-weak'}`}>
            {r.strength === 'strong' ? '●' : r.strength === 'partial' ? '◐' : '○'}
          </span>
          <span>
            <strong>{r.risk}</strong>
            {r.note && <span style={{ color: '#9ca3af', fontSize: '10px' }}> - {r.note}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EvalTypesTableView() {
  const [showCategory, setShowCategory] = useState<string | null>(null);

  const filteredEvals = showCategory
    ? EVAL_TYPES.filter(e => e.category === showCategory)
    : EVAL_TYPES;

  return (
    <>
      <style>{styles}</style>
      <div className="ev-page">
        <div className="ev-header">
          <a href="/knowledge-base/">← Knowledge Base</a>
          <h1>AI Evaluation Types - Strategic Analysis</h1>
          <nav>
            <a href="/knowledge-base/models/eval-types/table" className="active">Table</a>
            <a href="/knowledge-base/architecture-scenarios/table">Architectures</a>
            <a href="/knowledge-base/safety-approaches/table">Safety Approaches</a>
          </nav>
        </div>

        <div className="ev-controls">
          <span className="ev-controls-label">Filter by category:</span>
          <button
            className={`ev-toggle-btn ${!showCategory ? 'active' : ''}`}
            onClick={() => setShowCategory(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`ev-toggle-btn ${showCategory === cat ? 'active' : ''}`}
              onClick={() => setShowCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="ev-content">
          <p className="ev-intro">
            Comprehensive analysis of AI evaluation approaches and their strategic value for different risk scenarios.
            <strong> Key insight:</strong> No single eval approach is sufficient. Behavioral evals are gameable;
            interpretability isn't ready; human red teaming doesn't scale. A portfolio approach is required, with
            emphasis shifting based on which risks you prioritize.
          </p>
          <p className="ev-intro" style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
            <strong>Risk coverage:</strong> ● = strong signal, ◐ = partial signal, ○ = weak signal.
            <strong> Architecture dependence:</strong> LOW means works on any model; HIGH means needs specific access/architecture.
          </p>

          <div className="ev-table-wrapper">
            <table className="ev-table">
              <thead>
                <tr>
                  <th className="sticky-col" style={{ minWidth: '220px' }}>Evaluation Type</th>
                  <th className="signal-col" style={{ minWidth: '100px' }}>Signal Reliability</th>
                  <th className="signal-col" style={{ minWidth: '100px' }}>Coverage Depth</th>
                  <th className="signal-col" style={{ minWidth: '100px' }}>Goodhart Risk</th>
                  <th className="risk-col" style={{ minWidth: '180px' }}>Risk Coverage</th>
                  <th className="strategy-col" style={{ minWidth: '110px' }}>Timing</th>
                  <th className="strategy-col" style={{ minWidth: '100px' }}>Arch. Dependence</th>
                  <th className="strategy-col" style={{ minWidth: '100px' }}>Actionability</th>
                  <th className="strategy-col" style={{ minWidth: '100px' }}>Scalability</th>
                  <th className="landscape-col" style={{ minWidth: '120px' }}>Labs</th>
                  <th className="landscape-col" style={{ minWidth: '140px' }}>Key Papers/Examples</th>
                  <th className="risk-col" style={{ minWidth: '160px' }}>Strategic Pros</th>
                  <th className="risk-col" style={{ minWidth: '160px' }}>Strategic Cons</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvals.map((ev, idx) => {
                  // Check if this is a new category
                  const prevCategory = idx > 0 ? filteredEvals[idx - 1].category : null;
                  const isNewCategory = ev.category !== prevCategory;

                  return (
                    <>
                      {isNewCategory && showCategory === null && (
                        <tr key={`cat-${ev.category}`} className="ev-category-row">
                          <td colSpan={13}>
                            <span className="ev-category-label">{ev.category}</span>
                          </td>
                        </tr>
                      )}
                      <tr key={ev.id}>
                        <td className="sticky-col">
                          <div className="ev-eval-name">{ev.name}</div>
                          <div className="ev-eval-desc">{ev.description}</div>
                        </td>
                        <td>
                          <Badge level={ev.signalReliability.level} />
                          <div className="ev-cell-note">{ev.signalReliability.note}</div>
                        </td>
                        <td>
                          <Badge level={ev.coverageDepth.level} />
                          <div className="ev-cell-note">{ev.coverageDepth.note}</div>
                        </td>
                        <td>
                          <Badge level={ev.goodhartRisk.level} />
                          <div className="ev-cell-note">{ev.goodhartRisk.note}</div>
                        </td>
                        <td>
                          <RiskCoverageCell risks={ev.riskCoverage} />
                        </td>
                        <td>
                          <span className="ev-badge timing">{ev.timing.when}</span>
                          <div className="ev-cell-note">{ev.timing.note}</div>
                        </td>
                        <td>
                          <Badge level={ev.archDependence.level} />
                          <div className="ev-cell-note">{ev.archDependence.note}</div>
                        </td>
                        <td>
                          <Badge level={ev.actionability.level} />
                          <div className="ev-cell-note">{ev.actionability.note}</div>
                        </td>
                        <td>
                          <Badge level={ev.scalability.level} />
                        </td>
                        <td>
                          <div className="ev-labs">
                            {ev.labs.slice(0, 4).map((lab) => (
                              <span key={lab} className="ev-lab">{lab}</span>
                            ))}
                            {ev.labs.length > 4 && <span className="ev-lab">+{ev.labs.length - 4}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="ev-examples">
                            {ev.keyPapers.slice(0, 2).map((paper) => (
                              <div key={paper} className="ev-example-item" style={{ fontSize: '10px' }}>{paper}</div>
                            ))}
                            {ev.examples.slice(0, 2).map((ex) => (
                              <div key={ex} className="ev-example-item" style={{ fontSize: '10px', color: '#6b7280' }}>{ex}</div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="ev-pros-cons">
                            {ev.strategicPros.map((pro) => (
                              <div key={pro} className="ev-pro">+ {pro}</div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="ev-pros-cons">
                            {ev.strategicCons.map((con) => (
                              <div key={con} className="ev-con">− {con}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
