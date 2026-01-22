// AI Safety Approaches Comparison Table
// Evaluates safety techniques on whether they actually make the world safer
// vs. primarily enabling more capable (potentially dangerous) systems

export type RatingLevel =
  | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NEGLIGIBLE'  // For safety uplift
  | 'DOMINANT' | 'SIGNIFICANT' | 'SOME' | 'NEUTRAL' | 'TAX'  // For capability uplift
  | 'HARMFUL' | 'UNCLEAR' | 'HELPFUL'  // For net effect
  | 'NONE' | 'WEAK' | 'PARTIAL' | 'STRONG'  // For robustness
  | 'NO' | 'UNLIKELY' | 'UNKNOWN' | 'MAYBE' | 'YES'  // For scalability
  | 'NEGATIVE' | 'MODERATE' | 'CORE'  // For incentives
  | 'EXPERIMENTAL' | 'WIDESPREAD' | 'UNIVERSAL'  // For adoption
  | 'N/A' | '???';

export interface RatedProperty {
  level: string;
  note: string;
}

export type MechanismType = 'Training' | 'Architecture' | 'Evaluation' | 'Governance' | 'Runtime' | 'Research' | 'Theoretical';
export type FailureMode = 'Misalignment' | 'Misuse' | 'Accident' | 'Deception' | 'Power-seeking' | 'Capability-control' | 'Multiple';

// Recommendation levels for research prioritization
export type RecommendationLevel =
  | 'DEFUND'      // Actively counterproductive; reduce investment
  | 'REDUCE'      // Overfunded relative to safety value
  | 'MAINTAIN'    // About right
  | 'INCREASE'    // Underfunded; should grow
  | 'PRIORITIZE'; // Among most important; needs much more

// Differential progress levels
export type DifferentialLevel =
  | 'SAFETY-DOMINANT'    // Safety benefit >> capability benefit
  | 'SAFETY-LEANING'     // Safety benefit > capability benefit
  | 'BALANCED'           // Roughly equal
  | 'CAPABILITY-LEANING' // Capability benefit > safety benefit
  | 'CAPABILITY-DOMINANT'; // Capability benefit >> safety benefit

export interface SafetyApproach {
  id: string;
  name: string;
  description: string;
  category: 'training' | 'interpretability' | 'evaluation' | 'architectural' | 'governance' | 'theoretical';

  // Core tradeoff columns
  safetyUplift: RatedProperty;      // How much does this reduce catastrophic risk?
  capabilityUplift: RatedProperty;  // Does it make AI more capable/useful?
  netWorldSafety: RatedProperty;    // Given both, is the world safer?
  labIncentive: RatedProperty;      // Do labs have commercial reason to do this?

  // NEW: Quantitative columns
  researchInvestment: {
    amount: string;  // e.g., "$1B+/yr", "$10-50M/yr"
    note: string;
  };
  differentialProgress: {
    level: DifferentialLevel;
    note: string;
  };
  recommendation: {
    level: RecommendationLevel;
    note: string;
  };

  // Mechanism
  mechanism: MechanismType;
  failureModeTargeted: FailureMode[];

  // Critical assessment
  scalability: RatedProperty;        // Does it work as AI gets smarter?
  deceptionRobust: RatedProperty;    // Does it work against deceptive AI?
  siReady: RatedProperty;            // Works for superintelligent AI?

  // Context
  currentAdoption: RatedProperty;
  keyPapers: string[];
  keyLabs: string[];
  mainCritiques: string[];
}

export const SAFETY_APPROACHES: SafetyApproach[] = [
  // ============================================
  // TRAINING & ALIGNMENT
  // ============================================
  {
    id: 'rlhf',
    name: 'RLHF',
    description: 'Reinforcement Learning from Human Feedback. Train models to produce outputs humans rate highly.',
    category: 'training',

    safetyUplift: {
      level: 'LOW-MEDIUM',
      note: 'Reduces obvious harmful outputs; doesn\'t address underlying goals'
    },
    capabilityUplift: {
      level: 'DOMINANT',
      note: 'Makes models vastly more useful - this is what makes ChatGPT work'
    },
    netWorldSafety: {
      level: 'UNCLEAR',
      note: 'May be net negative: enables deployment of systems we can\'t verify are safe'
    },
    labIncentive: {
      level: 'CORE',
      note: 'Essential for commercial products; labs would do this without safety concerns'
    },

    researchInvestment: {
      amount: '$1B+/yr',
      note: 'Massive investment by all frontier labs; core to product development'
    },
    differentialProgress: {
      level: 'CAPABILITY-DOMINANT',
      note: 'Per dollar, capability gains vastly exceed safety gains'
    },
    recommendation: {
      level: 'REDUCE',
      note: 'Already overfunded; marginal safety $ better spent elsewhere'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Misuse', 'Accident'],

    scalability: {
      level: 'BREAKS',
      note: 'Human feedback can\'t scale to superhuman tasks; humans can\'t evaluate what they can\'t understand'
    },
    deceptionRobust: {
      level: 'NONE',
      note: 'A deceptive model could easily learn to produce human-approved outputs while having different goals'
    },
    siReady: {
      level: 'NO',
      note: 'Fundamentally relies on human ability to evaluate outputs'
    },

    currentAdoption: { level: 'UNIVERSAL', note: 'Used by all frontier labs' },
    keyPapers: ['InstructGPT (2022)', 'Training language models to follow instructions'],
    keyLabs: ['OpenAI', 'Anthropic', 'Google', 'Meta'],
    mainCritiques: [
      'Goodharting on human approval',
      'Doesn\'t ensure actual alignment',
      'May hide rather than eliminate bad behavior'
    ],
  },

  {
    id: 'constitutional-ai',
    name: 'Constitutional AI / RLAIF',
    description: 'Use AI feedback based on written principles instead of (or alongside) human feedback.',
    category: 'training',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Scales feedback; principles can be more consistent than humans'
    },
    capabilityUplift: {
      level: 'SIGNIFICANT',
      note: 'Reduces RLHF bottleneck; enables more training signal'
    },
    netWorldSafety: {
      level: 'UNCLEAR',
      note: 'Probably better than pure RLHF but shares fundamental limitations'
    },
    labIncentive: {
      level: 'STRONG',
      note: 'Cheaper than human feedback; Anthropic uses commercially'
    },

    researchInvestment: {
      amount: '$50-200M/yr',
      note: 'Anthropic primary; others experimenting'
    },
    differentialProgress: {
      level: 'CAPABILITY-LEANING',
      note: 'Some safety benefit but mainly enables more training'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Probably net positive but not transformative; adequately funded'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Misuse', 'Accident'],

    scalability: {
      level: 'PARTIAL',
      note: 'Scales better than human feedback but still bottlenecked by constitutional AI\'s judgment'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'If base model is deceptive, constitutional AI oversight inherits limitations'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'Relies on AI judgment which may not generalize to SI'
    },

    currentAdoption: { level: 'WIDESPREAD', note: 'Anthropic primary; others experimenting' },
    keyPapers: ['Constitutional AI (2022)', 'RLAIF (2023)'],
    keyLabs: ['Anthropic', 'Google'],
    mainCritiques: [
      'Principles may not cover all cases',
      'AI feedback may amplify model biases',
      'Doesn\'t solve fundamental alignment'
    ],
  },

  {
    id: 'debate',
    name: 'AI Safety via Debate',
    description: 'Two AIs argue opposing sides; human judges which is more convincing. Truth should win.',
    category: 'training',

    safetyUplift: {
      level: 'UNKNOWN',
      note: 'Theoretically promising; unclear if it works in practice'
    },
    capabilityUplift: {
      level: 'SOME',
      note: 'May improve reasoning; not primary capability driver'
    },
    netWorldSafety: {
      level: 'UNCLEAR',
      note: 'Could be transformative if it works; unproven at scale'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Expensive to implement; unclear commercial benefit'
    },

    researchInvestment: {
      amount: '$5-20M/yr',
      note: 'Limited research; mostly academic and OpenAI'
    },
    differentialProgress: {
      level: 'SAFETY-LEANING',
      note: 'Primarily safety-motivated; some reasoning improvements'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Underexplored; could be valuable if it works'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Deception', 'Misalignment'],

    scalability: {
      level: 'MAYBE',
      note: 'Designed to scale: human only judges, AIs do hard work'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'In theory, honest AI can expose deceptive AI; but collusion possible'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Designed for this; unknown if assumptions hold'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Research only; no production use' },
    keyPapers: ['AI Safety via Debate (Irving 2018)', 'Scalable agent alignment via reward modeling'],
    keyLabs: ['OpenAI (research)', 'Anthropic (interest)'],
    mainCritiques: [
      'May not converge to truth',
      'Sophisticated debaters could mislead humans',
      'Unproven empirically'
    ],
  },

  {
    id: 'process-supervision',
    name: 'Process Supervision',
    description: 'Reward each reasoning step, not just final answers. Train models to reason correctly.',
    category: 'training',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'More transparent reasoning; harder to hide bad logic'
    },
    capabilityUplift: {
      level: 'SIGNIFICANT',
      note: 'Improves math/reasoning accuracy significantly'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Probably net positive: makes reasoning auditable'
    },
    labIncentive: {
      level: 'STRONG',
      note: 'Improves benchmark performance; commercial benefit'
    },

    researchInvestment: {
      amount: '$100-500M/yr',
      note: 'All major labs invest; improves reasoning benchmarks'
    },
    differentialProgress: {
      level: 'BALANCED',
      note: 'Safety (auditable reasoning) and capability roughly balanced'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Good investment; already well-funded by labs'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Accident', 'Deception'],

    scalability: {
      level: 'PARTIAL',
      note: 'Expensive to label steps; may not scale to very complex reasoning'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Harder to hide deception in visible reasoning, but model could deceive while showing valid steps'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'Humans need to evaluate steps; breaks for superhuman reasoning'
    },

    currentAdoption: { level: 'WIDESPREAD', note: 'Used for math/coding; growing adoption' },
    keyPapers: ['Let\'s Verify Step by Step (2023)', 'Process Reward Models'],
    keyLabs: ['OpenAI', 'Google', 'Anthropic'],
    mainCritiques: [
      'Expensive annotation',
      'Model could learn to show fake reasoning',
      'Doesn\'t scale to superhuman tasks'
    ],
  },

  {
    id: 'weak-to-strong',
    name: 'Weak-to-Strong Generalization',
    description: 'Can weak supervisors (humans, small models) elicit good behavior from stronger models?',
    category: 'training',

    safetyUplift: {
      level: 'UNKNOWN',
      note: 'If it works, solves scalable oversight; very uncertain'
    },
    capabilityUplift: {
      level: 'SOME',
      note: 'Better use of limited supervision signal'
    },
    netWorldSafety: {
      level: 'UNCLEAR',
      note: 'Early research; potential high upside if successful'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Could reduce annotation costs; also safety-motivated'
    },

    researchInvestment: {
      amount: '$10-50M/yr',
      note: 'Active research area; OpenAI, Anthropic'
    },
    differentialProgress: {
      level: 'SAFETY-LEANING',
      note: 'Designed for safety; some capability spillover'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'High potential if successful; deserves more attention'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Misalignment'],

    scalability: {
      level: 'UNKNOWN',
      note: 'This IS the scaling question - does weak supervision transfer?'
    },
    deceptionRobust: {
      level: 'UNKNOWN',
      note: 'Unclear if weak supervisor can detect strong model deception'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Designed to address SI oversight; success uncertain'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Active research area' },
    keyPapers: ['Weak-to-Strong Generalization (OpenAI 2023)'],
    keyLabs: ['OpenAI', 'Anthropic'],
    mainCritiques: [
      'Early results show partial success only',
      'May not work for deceptive models',
      'Theoretical foundations unclear'
    ],
  },

  {
    id: 'reward-modeling',
    name: 'Reward Modeling',
    description: 'Train separate model to predict human preferences, use to guide policy training.',
    category: 'training',

    safetyUplift: {
      level: 'LOW',
      note: 'Just a component of RLHF; inherits RLHF limitations'
    },
    capabilityUplift: {
      level: 'SIGNIFICANT',
      note: 'Enables efficient RLHF training'
    },
    netWorldSafety: {
      level: 'UNCLEAR',
      note: 'Same as RLHF - enables capable but unverified systems'
    },
    labIncentive: {
      level: 'CORE',
      note: 'Essential component of RLHF pipeline'
    },

    researchInvestment: {
      amount: '$500M+/yr',
      note: 'Core component of all RLHF pipelines'
    },
    differentialProgress: {
      level: 'CAPABILITY-DOMINANT',
      note: 'Enables RLHF which is primarily capability-focused'
    },
    recommendation: {
      level: 'REDUCE',
      note: 'Already heavily funded; inherits RLHF problems'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Misuse', 'Accident'],

    scalability: {
      level: 'PARTIAL',
      note: 'Reward hacking becomes more severe with scale'
    },
    deceptionRobust: {
      level: 'NONE',
      note: 'Reward model can be gamed by sophisticated policy'
    },
    siReady: {
      level: 'NO',
      note: 'Reward hacking at scale; fundamental limitation'
    },

    currentAdoption: { level: 'UNIVERSAL', note: 'Core RLHF component' },
    keyPapers: ['Deep RL from Human Preferences (2017)', 'Reward Model literature'],
    keyLabs: ['All frontier labs'],
    mainCritiques: [
      'Reward hacking',
      'Distributional shift',
      'Goodhart\'s law'
    ],
  },

  {
    id: 'cirl',
    name: 'Cooperative IRL (CIRL)',
    description: 'AI and human cooperatively learn human preferences; AI uncertain about reward.',
    category: 'training',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Encourages corrigibility through uncertainty'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Not primarily a capability technique'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Good theoretical foundations; limited practical application'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Mostly academic; limited commercial pull'
    },

    researchInvestment: {
      amount: '$1-5M/yr',
      note: 'Academic research; UC Berkeley CHAI'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Purely safety-motivated theoretical work'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Good theoretical foundations; needs more practical work'
    },

    mechanism: 'Theoretical',
    failureModeTargeted: ['Misalignment', 'Power-seeking'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Theoretical framework; scaling properties unclear'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Uncertainty-aware AI less likely to act unilaterally'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Good theoretical properties; practical application unclear'
    },

    currentAdoption: { level: 'NONE', note: 'Academic only' },
    keyPapers: ['Cooperative Inverse Reinforcement Learning (2016)', 'CHAI papers'],
    keyLabs: ['UC Berkeley CHAI'],
    mainCritiques: [
      'Hard to implement in practice',
      'Requires special training setup',
      'Gap between theory and practice'
    ],
  },

  // ============================================
  // INTERPRETABILITY & TRANSPARENCY
  // ============================================
  {
    id: 'mech-interp',
    name: 'Mechanistic Interpretability',
    description: 'Reverse-engineer neural networks to understand internal computations and circuits.',
    category: 'interpretability',

    safetyUplift: {
      level: 'LOW (now) / HIGH (potential)',
      note: 'Currently limited impact; could be transformative if scaled'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Doesn\'t directly improve capabilities'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'One of few approaches that could detect deception'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Some debugging value; mostly safety-motivated'
    },

    researchInvestment: {
      amount: '$50-150M/yr',
      note: 'Anthropic (~$50M+), DeepMind, independents, academia'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Understanding models helps safety much more than capabilities'
    },
    recommendation: {
      level: 'PRIORITIZE',
      note: 'One of few paths to detecting deception; needs much more investment'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Deception', 'Misalignment'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Can we understand billion-parameter models? Open question'
    },
    deceptionRobust: {
      level: 'STRONG (if works)',
      note: 'In principle can detect deception directly; if we can read the model'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Could scale if we solve the science; no fundamental ceiling'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Growing research investment' },
    keyPapers: ['Zoom In (Olah 2020)', 'Toy Models of Superposition', 'Scaling Monosemanticity'],
    keyLabs: ['Anthropic', 'DeepMind', 'EleutherAI', 'Independent'],
    mainCritiques: [
      'Doesn\'t scale yet',
      'May be fundamentally intractable',
      'Even if we understand, can we act on it?'
    ],
  },

  {
    id: 'sparse-autoencoders',
    name: 'Sparse Autoencoders (SAEs)',
    description: 'Find interpretable features in neural network activations using sparsity constraints.',
    category: 'interpretability',

    safetyUplift: {
      level: 'LOW (now)',
      note: 'Promising tool for mech interp; impact depends on parent field'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Analysis tool, not capability improvement'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Supports interpretability research'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Research tool; limited direct commercial value'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'Subset of mech interp; Anthropic, Apollo, independents'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Purely a safety/understanding tool'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Promising technique; deserves more resources'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Deception', 'Misalignment'],

    scalability: {
      level: 'PARTIAL',
      note: 'Works on larger models; dictionary size grows with model'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Could find deception features; not guaranteed'
    },
    siReady: {
      level: 'UNKNOWN',
      note: 'Depends on broader mech interp scaling'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Active research tool' },
    keyPapers: ['Scaling Monosemanticity (2024)', 'Sparse Autoencoders Find Interpretable Features'],
    keyLabs: ['Anthropic', 'Apollo', 'Independent researchers'],
    mainCritiques: [
      'Features may not be functionally important',
      'Expensive to train at scale',
      'Interpretation still requires human judgment'
    ],
  },

  {
    id: 'representation-engineering',
    name: 'Representation Engineering',
    description: 'Control model behavior by steering activation vectors (e.g., "honesty direction").',
    category: 'interpretability',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Direct intervention on model behavior; promising results'
    },
    capabilityUplift: {
      level: 'SOME',
      note: 'Can enhance capabilities via steering'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Potentially useful safety intervention'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Practical applications for model control'
    },

    researchInvestment: {
      amount: '$5-20M/yr',
      note: 'CAIS, various academics, some lab interest'
    },
    differentialProgress: {
      level: 'SAFETY-LEANING',
      note: 'Primarily safety; some capability enhancement possible'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Practical intervention with near-term applicability'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Deception', 'Misalignment'],

    scalability: {
      level: 'PARTIAL',
      note: 'Works on current models; unclear at larger scale'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Could enforce honesty; but model might adapt'
    },
    siReady: {
      level: 'UNKNOWN',
      note: 'Unclear if simple directions persist at SI'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Research and some applications' },
    keyPapers: ['Representation Engineering (2023)', 'Activation Addition'],
    keyLabs: ['Center for AI Safety', 'Various academics'],
    mainCritiques: [
      'May be superficial control',
      'Model could route around interventions',
      'Requires finding right directions'
    ],
  },

  {
    id: 'probing',
    name: 'Probing / Linear Probes',
    description: 'Train simple classifiers on activations to test what concepts models represent.',
    category: 'interpretability',

    safetyUplift: {
      level: 'LOW',
      note: 'Diagnostic tool; doesn\'t directly improve safety'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Analysis tool only'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Supports understanding; small direct impact'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Research tool; limited commercial application'
    },

    researchInvestment: {
      amount: '$5-10M/yr',
      note: 'Common research technique; many groups'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Understanding tool; no capability benefit'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Useful supporting technique; adequately funded'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Deception'],

    scalability: {
      level: 'YES',
      note: 'Scales well; question is whether it detects the right things'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Could detect lying representations; model could hide them'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Technique scales; effectiveness uncertain'
    },

    currentAdoption: { level: 'WIDESPREAD', note: 'Standard research tool' },
    keyPapers: ['Probing Classifiers', 'Eliciting Latent Knowledge papers'],
    keyLabs: ['Many research groups'],
    mainCritiques: [
      'Probes might not find safety-relevant features',
      'Linear probes may miss nonlinear structure',
      'Model could learn to hide from probes'
    ],
  },

  // ============================================
  // EVALUATION & RED-TEAMING
  // ============================================
  {
    id: 'dangerous-cap-evals',
    name: 'Dangerous Capability Evaluations',
    description: 'Systematically test models for dangerous capabilities (bio, cyber, CBRN, persuasion, etc.).',
    category: 'evaluation',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Provides information for decisions; doesn\'t fix issues'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Evaluation only; doesn\'t improve capabilities'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Information is valuable for governance'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Required by some policies; reputational value'
    },

    researchInvestment: {
      amount: '$20-50M/yr',
      note: 'METR, Apollo, UK AISI, all frontier labs'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure safety information; no capability benefit'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Critical for governance; needs more rigor and coverage'
    },

    mechanism: 'Evaluation',
    failureModeTargeted: ['Misuse', 'Capability-control'],

    scalability: {
      level: 'PARTIAL',
      note: 'Evals need to scale with capabilities; challenging'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'Deceptive model might hide capabilities during evals'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'Hard to eval capabilities we don\'t understand'
    },

    currentAdoption: { level: 'WIDESPREAD', note: 'All frontier labs; METR, Apollo, UK AISI' },
    keyPapers: ['Model Evaluation for Extreme Risks', 'METR papers'],
    keyLabs: ['METR', 'Apollo', 'UK AISI', 'All frontier labs'],
    mainCritiques: [
      'Evals may not capture real-world risk',
      'Can\'t eval for unknown dangers',
      'Deceptive models could sandbag'
    ],
  },

  {
    id: 'red-teaming',
    name: 'Red Teaming',
    description: 'Adversarial testing to find model failures, jailbreaks, and harmful outputs.',
    category: 'evaluation',

    safetyUplift: {
      level: 'LOW-MEDIUM',
      note: 'Finds specific failures; doesn\'t ensure safety'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Testing only'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Marginally improves safety; can\'t find all issues'
    },
    labIncentive: {
      level: 'STRONG',
      note: 'Prevents embarrassing failures; PR value'
    },

    researchInvestment: {
      amount: '$50-200M/yr',
      note: 'All labs do this extensively; external contractors'
    },
    differentialProgress: {
      level: 'BALANCED',
      note: 'Finds safety issues but also improves product quality'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Necessary but limited; already well-funded'
    },

    mechanism: 'Evaluation',
    failureModeTargeted: ['Misuse', 'Accident'],

    scalability: {
      level: 'PARTIAL',
      note: 'Red team effort must scale with attack surface'
    },
    deceptionRobust: {
      level: 'NONE',
      note: 'Deceptive model would pass red teaming'
    },
    siReady: {
      level: 'NO',
      note: 'Human red teams can\'t outsmart SI'
    },

    currentAdoption: { level: 'UNIVERSAL', note: 'All labs do extensive red teaming' },
    keyPapers: ['Red Teaming Language Models', 'Various jailbreak papers'],
    keyLabs: ['All frontier labs', 'External red teams'],
    mainCritiques: [
      'Can\'t find all failures',
      'Adversaries adapt',
      'False sense of security'
    ],
  },

  {
    id: 'alignment-evals',
    name: 'Alignment Evaluations',
    description: 'Test for alignment properties: honesty, corrigibility, goal stability, etc.',
    category: 'evaluation',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Important information; but hard to measure true alignment'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Measurement only'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Better than no information; limited by what we can measure'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Some commitment to this; mostly safety-motivated'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'Anthropic, Apollo, UK AISI; growing'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure safety measurement'
    },
    recommendation: {
      level: 'PRIORITIZE',
      note: 'Critical gap; we need better ways to measure alignment'
    },

    mechanism: 'Evaluation',
    failureModeTargeted: ['Deception', 'Misalignment'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Can we measure alignment in systems smarter than us?'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'Deceptive model could fake alignment on evals'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'Fundamental measurement problem at SI'
    },

    currentAdoption: { level: 'SOME', note: 'Growing area; challenging to do well' },
    keyPapers: ['Evaluating AI Alignment', 'Sleeper Agents paper'],
    keyLabs: ['Anthropic', 'Apollo', 'UK AISI'],
    mainCritiques: [
      'May not measure what matters',
      'Deception-robust evals very hard',
      'Goodharting on evals'
    ],
  },

  {
    id: 'model-auditing',
    name: 'Third-Party Model Auditing',
    description: 'External organizations audit models for safety, capabilities, and alignment.',
    category: 'evaluation',

    safetyUplift: {
      level: 'LOW-MEDIUM',
      note: 'Adds accountability; limited by auditor capabilities'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Assessment only'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Adds oversight layer; valuable for governance'
    },
    labIncentive: {
      level: 'NEGATIVE',
      note: 'Labs prefer not to be audited; may be required'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'METR, UK AISI, Apollo, emerging ecosystem'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure oversight function'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Important governance layer; auditor capacity needs growth'
    },

    mechanism: 'Governance',
    failureModeTargeted: ['Multiple'],

    scalability: {
      level: 'PARTIAL',
      note: 'Auditor expertise must keep up with frontier'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'Auditors face same detection challenges'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'How do you audit SI?'
    },

    currentAdoption: { level: 'SOME', note: 'METR, UK AISI, emerging ecosystem' },
    keyPapers: ['AI auditing frameworks', 'Structured access papers'],
    keyLabs: ['METR', 'UK AISI', 'Apollo', 'RAND'],
    mainCritiques: [
      'Auditors may lack expertise',
      'Access limitations',
      'Incentive problems'
    ],
  },

  // ============================================
  // ARCHITECTURAL & RUNTIME
  // ============================================
  {
    id: 'output-filtering',
    name: 'Output Filtering',
    description: 'Post-hoc filter or classifier to block harmful model outputs.',
    category: 'architectural',

    safetyUplift: {
      level: 'LOW',
      note: 'Blocks obvious harms; easily bypassed'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Reduces model usefulness (false positives)'
    },
    netWorldSafety: {
      level: 'NEUTRAL',
      note: 'Marginal benefit; creates false sense of security'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Prevents obvious bad PR; required for deployment'
    },

    researchInvestment: {
      amount: '$50-200M/yr',
      note: 'Part of product deployment; all labs'
    },
    differentialProgress: {
      level: 'BALANCED',
      note: 'Safety theater that also degrades product'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Necessary for deployment but limited value; don\'t over-invest'
    },

    mechanism: 'Runtime',
    failureModeTargeted: ['Misuse'],

    scalability: {
      level: 'BREAKS',
      note: 'Sophisticated users/models can evade filters'
    },
    deceptionRobust: {
      level: 'NONE',
      note: 'Deceptive model could bypass or manipulate filters'
    },
    siReady: {
      level: 'NO',
      note: 'SI could trivially evade output filters'
    },

    currentAdoption: { level: 'UNIVERSAL', note: 'All deployed systems use some filtering' },
    keyPapers: ['Content moderation papers'],
    keyLabs: ['All deployment labs'],
    mainCritiques: [
      'Easily jailbroken',
      'Capability tax',
      'Arms race dynamic'
    ],
  },

  {
    id: 'refusal-training',
    name: 'Refusal Training',
    description: 'Train models to decline harmful requests rather than comply.',
    category: 'architectural',

    safetyUplift: {
      level: 'LOW-MEDIUM',
      note: 'Blocks obvious harms; doesn\'t address underlying goals'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Over-refusal reduces usefulness'
    },
    netWorldSafety: {
      level: 'NEUTRAL',
      note: 'Helpful for misuse; may hide rather than solve issues'
    },
    labIncentive: {
      level: 'STRONG',
      note: 'Essential for public deployment; liability reduction'
    },

    researchInvestment: {
      amount: '(included in RLHF)',
      note: 'Part of standard safety training pipeline'
    },
    differentialProgress: {
      level: 'BALANCED',
      note: 'Helps deployment (commercial) and blocks obvious harms'
    },
    recommendation: {
      level: 'MAINTAIN',
      note: 'Necessary for deployment but don\'t confuse with real safety'
    },

    mechanism: 'Training',
    failureModeTargeted: ['Misuse'],

    scalability: {
      level: 'BREAKS',
      note: 'Jailbreaks consistently found; arms race'
    },
    deceptionRobust: {
      level: 'NONE',
      note: 'Refusals are behavioral, not goal-level'
    },
    siReady: {
      level: 'NO',
      note: 'SI could easily reason around refusals'
    },

    currentAdoption: { level: 'UNIVERSAL', note: 'All chatbots have refusals' },
    keyPapers: ['Safety training papers', 'Jailbreak literature'],
    keyLabs: ['All frontier labs'],
    mainCritiques: [
      'Consistently jailbroken',
      'Over-refusal problem',
      'Doesn\'t address misalignment'
    ],
  },

  {
    id: 'sandboxing',
    name: 'Sandboxing / Containment',
    description: 'Limit AI system access to resources, networks, and capabilities.',
    category: 'architectural',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Limits damage from failures; defense in depth'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Reduces what AI can do'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Valuable containment measure'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Security best practice; limits agentic deployment'
    },

    researchInvestment: {
      amount: '$20-50M/yr',
      note: 'Part of agent development; growing focus'
    },
    differentialProgress: {
      level: 'SAFETY-LEANING',
      note: 'Primarily limits risk; some product benefit from trust'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Critical as agents become more autonomous'
    },

    mechanism: 'Architecture',
    failureModeTargeted: ['Accident', 'Power-seeking'],

    scalability: {
      level: 'PARTIAL',
      note: 'Harder to contain more capable systems; social engineering'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Limits options but deceptive AI might find escape routes'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'SI likely finds containment gaps; social engineering'
    },

    currentAdoption: { level: 'SOME', note: 'Growing with agentic systems' },
    keyPapers: ['AI containment papers', 'Boxing papers (old)'],
    keyLabs: ['Anthropic', 'OpenAI', 'Various'],
    mainCritiques: [
      'Reduces usefulness',
      'Sophisticated AI may escape',
      'Social engineering attacks'
    ],
  },

  {
    id: 'tool-restrictions',
    name: 'Tool-Use Restrictions',
    description: 'Limit what tools and actions AI systems can take.',
    category: 'architectural',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Directly limits harm potential'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Reduces what AI can do for users'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Important safeguard for agentic systems'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Limits product value; mainly safety-motivated'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'Part of agent safety engineering'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure safety constraint; reduces capability'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Important as agents expand; labs pressure to loosen'
    },

    mechanism: 'Architecture',
    failureModeTargeted: ['Accident', 'Misuse', 'Power-seeking'],

    scalability: {
      level: 'PARTIAL',
      note: 'Effective but pressure to expand tool access'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'Hard limits help; but composition attacks possible'
    },
    siReady: {
      level: 'PARTIAL',
      note: 'Hard limits meaningful; but SI creative with available tools'
    },

    currentAdoption: { level: 'WIDESPREAD', note: 'All agentic systems have restrictions' },
    keyPapers: ['Agent safety papers'],
    keyLabs: ['All agentic system developers'],
    mainCritiques: [
      'Limits usefulness',
      'Pressure to expand access',
      'Composition attacks'
    ],
  },

  {
    id: 'monitoring',
    name: 'Monitoring / Trip Wires',
    description: 'Monitor AI behavior for anomalies, policy violations, or dangerous patterns.',
    category: 'architectural',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Can catch issues early; detection not prevention'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Observation doesn\'t affect capabilities'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Important layer of defense'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Standard security practice; compliance value'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'Growing with agent deployment'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Detection and response; no capability benefit'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Underinvested relative to agent deployment'
    },

    mechanism: 'Runtime',
    failureModeTargeted: ['Multiple'],

    scalability: {
      level: 'PARTIAL',
      note: 'Must keep up with model sophistication'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'Deceptive AI would avoid triggering monitors'
    },
    siReady: {
      level: 'NO',
      note: 'SI would understand and evade monitoring'
    },

    currentAdoption: { level: 'SOME', note: 'Growing with agent deployment' },
    keyPapers: ['AI monitoring frameworks'],
    keyLabs: ['Various'],
    mainCritiques: [
      'Deceptive AI evades monitors',
      'False positive burden',
      'Detection vs prevention gap'
    ],
  },

  // ============================================
  // GOVERNANCE & EXTERNAL
  // ============================================
  {
    id: 'compute-governance',
    name: 'Compute Governance',
    description: 'Control or monitor access to large-scale AI training compute.',
    category: 'governance',

    safetyUplift: {
      level: 'MEDIUM-HIGH',
      note: 'Only approach that can limit frontier development'
    },
    capabilityUplift: {
      level: 'NEGATIVE',
      note: 'Explicitly limits capability development'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'One of few interventions that could slow racing'
    },
    labIncentive: {
      level: 'NEGATIVE',
      note: 'Labs strongly opposed; limits competitive position'
    },

    researchInvestment: {
      amount: '$5-20M/yr',
      note: 'GovAI, CSET, RAND; policy research'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Explicitly slows capability development'
    },
    recommendation: {
      level: 'PRIORITIZE',
      note: 'One of few levers to affect timeline; very underfunded'
    },

    mechanism: 'Governance',
    failureModeTargeted: ['Capability-control', 'Multiple'],

    scalability: {
      level: 'YES',
      note: 'Compute is physical and monitorable'
    },
    deceptionRobust: {
      level: 'N/A',
      note: 'External constraint, not model-level'
    },
    siReady: {
      level: 'PARTIAL',
      note: 'Could slow SI development; can\'t stop post-SI'
    },

    currentAdoption: { level: 'SOME', note: 'Export controls; reporting requirements' },
    keyPapers: ['Compute Governance papers', 'GovAI work'],
    keyLabs: ['GovAI', 'CSET', 'RAND'],
    mainCritiques: [
      'Hard to implement globally',
      'Algorithmic efficiency gains',
      'May just shift development location'
    ],
  },

  {
    id: 'rsp',
    name: 'Responsible Scaling Policies',
    description: 'Commitments to pause scaling if certain capability/safety thresholds are crossed.',
    category: 'governance',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Creates tripwires; effectiveness depends on follow-through'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Not capability-focused'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Better than nothing; implementation uncertain'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'PR value; may become required; some genuine commitment'
    },

    researchInvestment: {
      amount: '$5-15M/yr',
      note: 'Policy teams at labs; external policy orgs'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure governance; no capability benefit'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Needs enforcement mechanisms and external verification'
    },

    mechanism: 'Governance',
    failureModeTargeted: ['Multiple'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Depends on whether commitments are honored'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'External policy; but evals could be fooled'
    },
    siReady: {
      level: 'UNLIKELY',
      note: 'Pre-SI intervention; can\'t constrain SI itself'
    },

    currentAdoption: { level: 'SOME', note: 'Anthropic, OpenAI, DeepMind have versions' },
    keyPapers: ['Anthropic RSP', 'OpenAI Preparedness Framework'],
    keyLabs: ['Anthropic', 'OpenAI', 'DeepMind'],
    mainCritiques: [
      'Voluntary and unenforceable',
      'Labs set their own thresholds',
      'Competitive pressure to continue'
    ],
  },

  {
    id: 'evals-governance',
    name: 'Evals-Based Deployment Gates',
    description: 'Require models to pass safety evals before deployment or scaling.',
    category: 'governance',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Creates accountability; limited by eval quality'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'May delay deployment'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Adds friction and accountability'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Compliance cost; may be required'
    },

    researchInvestment: {
      amount: '$10-30M/yr',
      note: 'Policy development; eval infrastructure'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Adds deployment friction for safety'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Needs better evals and enforcement'
    },

    mechanism: 'Governance',
    failureModeTargeted: ['Multiple'],

    scalability: {
      level: 'PARTIAL',
      note: 'Evals must keep up with capabilities'
    },
    deceptionRobust: {
      level: 'WEAK',
      note: 'Deceptive models could pass evals'
    },
    siReady: {
      level: 'NO',
      note: 'Can\'t eval SI safely'
    },

    currentAdoption: { level: 'SOME', note: 'EU AI Act; emerging requirements' },
    keyPapers: ['AI governance literature'],
    keyLabs: ['Regulators', 'Policy orgs'],
    mainCritiques: [
      'Evals may be inadequate',
      'Regulatory capture risk',
      'Can\'t eval for unknown risks'
    ],
  },

  {
    id: 'model-registries',
    name: 'Model Registries / Licensing',
    description: 'Require registration or licensing for frontier AI development/deployment.',
    category: 'governance',

    safetyUplift: {
      level: 'LOW-MEDIUM',
      note: 'Visibility and accountability; doesn\'t directly improve safety'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Compliance burden'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Enables oversight; valuable governance tool'
    },
    labIncentive: {
      level: 'NEGATIVE',
      note: 'Compliance cost; reveals competitive info'
    },

    researchInvestment: {
      amount: '$5-15M/yr',
      note: 'Policy development; regulatory bodies'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure governance infrastructure'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Foundation for other governance; needs development'
    },

    mechanism: 'Governance',
    failureModeTargeted: ['Capability-control'],

    scalability: {
      level: 'YES',
      note: 'Administrative mechanism scales'
    },
    deceptionRobust: {
      level: 'N/A',
      note: 'External governance, not model-level'
    },
    siReady: {
      level: 'PARTIAL',
      note: 'Pre-SI governance; provides structure'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'EU AI Act; US considering' },
    keyPapers: ['AI governance papers'],
    keyLabs: ['Policy organizations', 'Regulators'],
    mainCritiques: [
      'Enforcement challenges',
      'May not cover all actors',
      'Compliance vs actual safety'
    ],
  },

  // ============================================
  // THEORETICAL & RESEARCH
  // ============================================
  {
    id: 'formal-verification',
    name: 'Formal Verification',
    description: 'Mathematical proofs of AI system properties and behavior bounds.',
    category: 'theoretical',

    safetyUplift: {
      level: 'HIGH (if achievable)',
      note: 'Would provide strong guarantees; currently very limited'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Verified systems likely less capable'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Best-case: transformative. Current: minimal impact'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Academic interest; limited commercial value'
    },

    researchInvestment: {
      amount: '$5-20M/yr',
      note: 'Academic research; some lab interest'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Pure safety research; imposes capability tax'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'High-risk high-reward; worth more exploration'
    },

    mechanism: 'Theoretical',
    failureModeTargeted: ['Misalignment', 'Accident'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Can we verify billion-param models? Open question'
    },
    deceptionRobust: {
      level: 'STRONG (if works)',
      note: 'Proofs don\'t care about deception'
    },
    siReady: {
      level: 'MAYBE',
      note: 'In principle yes; in practice unclear'
    },

    currentAdoption: { level: 'NONE', note: 'Research only; not applicable to current models' },
    keyPapers: ['Verified neural networks papers'],
    keyLabs: ['Academic groups', 'MIRI (historically)'],
    mainCritiques: [
      'Doesn\'t scale to current models',
      'What properties to verify?',
      'World model verification is hard'
    ],
  },

  {
    id: 'provably-safe',
    name: 'Provably Safe AI (davidad agenda)',
    description: 'Design AI systems with mathematical safety guarantees from the ground up.',
    category: 'theoretical',

    safetyUplift: {
      level: 'CRITICAL (if works)',
      note: 'Would be transformative; highly speculative'
    },
    capabilityUplift: {
      level: 'TAX',
      note: 'Constraints likely reduce capabilities'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Best-case: solves alignment. Current: research only'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Very long-term; no near-term commercial value'
    },

    researchInvestment: {
      amount: '$10-50M/yr',
      note: 'ARIA funding; some academic work'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Explicitly safety-by-construction'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Moonshot but worth pursuing; one of few paradigm-shifting possibilities'
    },

    mechanism: 'Theoretical',
    failureModeTargeted: ['Misalignment', 'Deception', 'Power-seeking'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Core question of the research agenda'
    },
    deceptionRobust: {
      level: 'STRONG (by design)',
      note: 'Proofs rule out deception'
    },
    siReady: {
      level: 'YES (if works)',
      note: 'Designed for this; success uncertain'
    },

    currentAdoption: { level: 'NONE', note: 'Research only; ARIA funding' },
    keyPapers: ['Guaranteed Safe AI (2024)', 'davidad ARIA programme'],
    keyLabs: ['ARIA', 'MIRI'],
    mainCritiques: [
      'May be impossible',
      'Capability tax may be prohibitive',
      'World model verification unsolved'
    ],
  },

  {
    id: 'corrigibility',
    name: 'Corrigibility Research',
    description: 'Research into making AI systems that accept correction and shutdown.',
    category: 'theoretical',

    safetyUplift: {
      level: 'HIGH (if solved)',
      note: 'Key safety property; unsolved'
    },
    capabilityUplift: {
      level: 'NEUTRAL',
      note: 'Research direction, not capability-focused'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Important theoretical work'
    },
    labIncentive: {
      level: 'WEAK',
      note: 'Long-term safety; no commercial pull'
    },

    researchInvestment: {
      amount: '$1-5M/yr',
      note: 'Very limited; MIRI, some academics'
    },
    differentialProgress: {
      level: 'SAFETY-DOMINANT',
      note: 'Core safety property; no capability benefit'
    },
    recommendation: {
      level: 'PRIORITIZE',
      note: 'Severely underfunded for importance; key unsolved problem'
    },

    mechanism: 'Theoretical',
    failureModeTargeted: ['Power-seeking', 'Misalignment'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Theoretical; scaling properties unclear'
    },
    deceptionRobust: {
      level: 'PARTIAL',
      note: 'True corrigibility resists deception; fake corrigibility doesn\'t'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Would need to solve before SI'
    },

    currentAdoption: { level: 'NONE', note: 'Theoretical research only' },
    keyPapers: ['Corrigibility (Soares et al.)', 'MIRI papers'],
    keyLabs: ['MIRI', 'Academic groups'],
    mainCritiques: [
      'Unsolved theoretically',
      'May conflict with capability',
      'How to implement in neural nets?'
    ],
  },

  {
    id: 'goal-misgeneralization',
    name: 'Goal Misgeneralization Research',
    description: 'Study of how learned goals fail to generalize to new situations correctly.',
    category: 'theoretical',

    safetyUplift: {
      level: 'MEDIUM',
      note: 'Important problem identification; solutions unclear'
    },
    capabilityUplift: {
      level: 'SOME',
      note: 'Better generalization helps capabilities too'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Understanding problems is first step'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Robustness is commercially valuable'
    },

    researchInvestment: {
      amount: '$5-20M/yr',
      note: 'DeepMind, Anthropic, academic research'
    },
    differentialProgress: {
      level: 'BALANCED',
      note: 'Understanding helps both safety and robustness'
    },
    recommendation: {
      level: 'INCREASE',
      note: 'Core alignment problem; needs more solution-oriented work'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Misalignment'],

    scalability: {
      level: 'PARTIAL',
      note: 'Problem may get worse or better with scale'
    },
    deceptionRobust: {
      level: 'N/A',
      note: 'Studying failure mode, not preventing deception'
    },
    siReady: {
      level: 'UNKNOWN',
      note: 'Understanding helps; solutions unclear'
    },

    currentAdoption: { level: 'EXPERIMENTAL', note: 'Active research area' },
    keyPapers: ['Goal Misgeneralization (DeepMind 2022)', 'Reward hacking papers'],
    keyLabs: ['DeepMind', 'Anthropic', 'Academic'],
    mainCritiques: [
      'Problem well-characterized; solutions lacking',
      'May be fundamental to learning',
      'Hard to detect in practice'
    ],
  },

  {
    id: 'eliciting-latent-knowledge',
    name: 'Eliciting Latent Knowledge (ELK)',
    description: 'Research into getting AI to report what it actually knows/believes.',
    category: 'theoretical',

    safetyUplift: {
      level: 'HIGH (if solved)',
      note: 'Would enable detecting deception; unsolved'
    },
    capabilityUplift: {
      level: 'SOME',
      note: 'Better knowledge extraction is useful'
    },
    netWorldSafety: {
      level: 'HELPFUL',
      note: 'Critical research direction'
    },
    labIncentive: {
      level: 'MODERATE',
      note: 'Some commercial value; mostly safety-motivated'
    },

    researchInvestment: {
      amount: '$5-15M/yr',
      note: 'ARC, some academic groups'
    },
    differentialProgress: {
      level: 'SAFETY-LEANING',
      note: 'Primarily for deception detection; some knowledge extraction benefit'
    },
    recommendation: {
      level: 'PRIORITIZE',
      note: 'Solves deception problem if successful; needs breakthrough'
    },

    mechanism: 'Research',
    failureModeTargeted: ['Deception'],

    scalability: {
      level: 'UNKNOWN',
      note: 'Core open problem'
    },
    deceptionRobust: {
      level: 'STRONG (if solved)',
      note: 'Solving ELK = solving deception detection'
    },
    siReady: {
      level: 'MAYBE',
      note: 'Would need to solve before SI'
    },

    currentAdoption: { level: 'NONE', note: 'Theoretical research' },
    keyPapers: ['ELK Report (ARC 2021)'],
    keyLabs: ['ARC', 'Academic groups'],
    mainCritiques: [
      'Unsolved despite significant effort',
      'May be impossible',
      'Current approaches don\'t work'
    ],
  },
];

// Category definitions for grouping
export const CATEGORIES = [
  { id: 'training', label: 'Training & Alignment', color: '#3b82f6' },
  { id: 'interpretability', label: 'Interpretability & Transparency', color: '#8b5cf6' },
  { id: 'evaluation', label: 'Evaluation & Red-teaming', color: '#f59e0b' },
  { id: 'architectural', label: 'Architectural & Runtime', color: '#10b981' },
  { id: 'governance', label: 'Governance & External', color: '#ef4444' },
  { id: 'theoretical', label: 'Theoretical & Research', color: '#6366f1' },
] as const;

// Helper to get approaches by category
export function getApproachesByCategory(category: string): SafetyApproach[] {
  return SAFETY_APPROACHES.filter(a => a.category === category);
}
