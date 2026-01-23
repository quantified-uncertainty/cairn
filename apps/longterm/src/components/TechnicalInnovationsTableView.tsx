// Table view for Technical Innovations in AI Systems
import { useState } from 'react';

type SafetyOutlook = 'favorable' | 'mixed' | 'challenging' | 'unknown';
type InterpretabilityLevel = 'opaque' | 'post-hoc' | 'hybrid' | 'inherent';
type CommunicationChannel = 'internal' | 'human-facing' | 'ai-ai-overt' | 'ai-ai-covert';

interface Link {
  title: string;
  url?: string;
}

interface LabLink {
  name: string;
  url?: string;
}

interface Innovation {
  id: string;
  name: string;
  description: string;
  likelihood: string;
  likelihoodNote: string;
  timeline: string;
  safetyOutlook: {
    rating: SafetyOutlook;
    score?: number;
    summary: string;
    keyRisks: string[];
    keyOpportunities: string[];
  };
  researchTractability: { level: string; note: string };
  whitebox: { level: string; note: string };
  training: { level: string; note: string };
  predictability: { level: string; note: string };
  labs: LabLink[];
  examples: Link[];
  keyPapers: Link[];
  safetyPros: string[];
  safetyCons: string[];
  taxonomy: {
    interpretability: InterpretabilityLevel;
    channel: CommunicationChannel;
    architectureRelevance: string[];
  };
}

const INNOVATIONS: Innovation[] = [
  {
    id: 'neuralese',
    name: 'Neuralese',
    description: 'Internal representations in neural networks that encode information in ways distinct from human concepts. Includes superposition, polysemantic neurons, and distributed encodings.',
    likelihood: '60-80%',
    likelihoodNote: 'Default outcome for gradient-trained systems; present in all current LLMs',
    timeline: 'Now (dominant)',
    safetyOutlook: {
      rating: 'challenging',
      score: 3,
      summary: 'Fundamental barrier to interpretability; enables undetectable deception',
      keyRisks: ['Deception undetectable in principle', 'Goals unverifiable', 'Steganographic communication between AI systems', 'Interpretability research may hit fundamental limits'],
      keyOpportunities: ['Mechanistic interp making progress', 'May be extractable with sufficient compute', 'Behavioral testing still provides signal'],
    },
    researchTractability: { level: 'LOW', note: 'Fundamental problem; mech interp is hard' },
    whitebox: { level: 'LOW', note: 'Weights exist but representations opaque' },
    training: { level: 'HIGH', note: 'Emerges naturally from gradient descent' },
    predictability: { level: 'LOW', note: 'Cannot predict from internal state' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
    ],
    examples: [
      { title: 'Current LLM internals' },
      { title: 'Superposition in neural nets' },
      { title: 'Polysemantic neurons' },
    ],
    keyPapers: [
      { title: 'Toy Models of Superposition (2022)', url: 'https://transformer-circuits.pub/2022/toy_model/index.html' },
      { title: 'Scaling Monosemanticity (2024)', url: 'https://transformer-circuits.pub/2024/scaling-monosemanticity/' },
    ],
    safetyPros: ['Can still do behavioral testing', 'Some features extractable'],
    safetyCons: ['Fundamental interpretability barrier', 'Enables steganography', 'Deception may be undetectable'],
    taxonomy: {
      interpretability: 'opaque',
      channel: 'internal',
      architectureRelevance: ['Dense Transformers', 'Sparse/MoE', 'SSM/Mamba'],
    },
  },
  {
    id: 'interpretable-by-design',
    name: 'Interpretable-by-Design Architectures',
    description: 'Neural network architectures that constrain internal representations to be human-readable by construction. Includes concept bottleneck models and neural module networks.',
    likelihood: '5-15%',
    likelihoodNote: 'Active research area; adoption depends on capability-transparency tradeoffs',
    timeline: '2027+',
    safetyOutlook: {
      rating: 'favorable',
      score: 8,
      summary: 'Transparency by construction; enables formal verification',
      keyRisks: ['May not scale to TAI capabilities', 'Capability tax reduces adoption', 'Could be gamed if not carefully designed'],
      keyOpportunities: ['Auditable by construction', 'Natural language specs possible', 'Formal verification tractable'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Active research area; some promising directions' },
    whitebox: { level: 'HIGH', note: 'Designed for transparency' },
    training: { level: 'COMPLEX', note: 'Constraints make training harder' },
    predictability: { level: 'HIGH', note: 'Intermediate steps visible' },
    labs: [
      { name: 'ARIA (Davidad)' },
      { name: 'MIT-IBM Lab' },
      { name: 'Academic groups' },
    ],
    examples: [
      { title: 'Concept bottleneck models' },
      { title: 'Neural module networks' },
      { title: 'Program synthesis approaches' },
    ],
    keyPapers: [
      { title: 'Concept Bottleneck Models (2020)', url: 'https://arxiv.org/abs/2007.04612' },
      { title: 'Guaranteed Safe AI (2024)', url: 'https://arxiv.org/abs/2405.06624' },
    ],
    safetyPros: ['Auditable', 'Verifiable', 'No hidden representations'],
    safetyCons: ['Capability limitations', 'May not scale', 'Requires deliberate choice'],
    taxonomy: {
      interpretability: 'inherent',
      channel: 'human-facing',
      architectureRelevance: ['Neuro-Symbolic', 'Provable/Guaranteed Safe'],
    },
  },
  {
    id: 'shared-latent-spaces',
    name: 'Shared Latent Spaces',
    description: 'AI systems communicating via shared embedding spaces or learned protocols rather than natural language. Enables efficient information transfer between models.',
    likelihood: '30-50%',
    likelihoodNote: 'Natural evolution of multi-agent systems; driven by efficiency gains',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'challenging',
      score: 3,
      summary: 'Enables AI coordination humans cannot monitor',
      keyRisks: ['Collusion undetectable', 'Humans excluded from AI-AI communication', 'Emergent protocols we cannot understand'],
      keyOpportunities: ['Can mandate natural language interface layer', 'Logging/monitoring possible at interface'],
    },
    researchTractability: { level: 'LOW', note: 'Emergent behavior hard to study' },
    whitebox: { level: 'LOW', note: 'Communication channel opaque' },
    training: { level: 'HIGH', note: 'Emerges from multi-agent training' },
    predictability: { level: 'LOW', note: 'Emergent protocols unpredictable' },
    labs: [
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'Multi-agent research groups' },
    ],
    examples: [
      { title: 'Emergent communication in games' },
      { title: 'Multi-agent RL' },
      { title: 'AI-to-AI APIs with embeddings' },
    ],
    keyPapers: [
      { title: 'Emergent Communication (2017)', url: 'https://arxiv.org/abs/1703.04908' },
      { title: 'Multi-Agent Communication', url: 'https://arxiv.org/abs/1605.06676' },
    ],
    safetyPros: ['Can mandate logging', 'Interface monitoring possible'],
    safetyCons: ['Coordination risk', 'Human exclusion', 'Steganography risk'],
    taxonomy: {
      interpretability: 'opaque',
      channel: 'ai-ai-overt',
      architectureRelevance: ['Heavy Scaffolding/Agentic', 'Multi-agent systems'],
    },
  },
  {
    id: 'legible-cot',
    name: 'Chain-of-Thought Reasoning',
    description: 'Models producing explicit intermediate reasoning steps in natural language before final outputs. Includes scratchpads, reasoning traces, and process-based methods.',
    likelihood: '20-40%',
    likelihoodNote: 'Active research area; faithfulness of reasoning traces is open question',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'mixed',
      score: 6,
      summary: 'Promising if CoT faithfully reflects reasoning; risk of unfaithful/performative CoT',
      keyRisks: ['CoT may not reflect true reasoning', 'Performative explanations', 'Steganography in CoT tokens'],
      keyOpportunities: ['Process-based oversight possible', 'Reasoning auditable', 'Easier red-teaming'],
    },
    researchTractability: { level: 'HIGH', note: 'Active area; many groups working on this' },
    whitebox: { level: 'PARTIAL', note: 'CoT visible but faithfulness uncertain' },
    training: { level: 'HIGH', note: 'Can train for CoT' },
    predictability: { level: 'MEDIUM', note: 'Steps visible but may be unfaithful' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
    ],
    examples: [
      { title: 'Chain-of-thought prompting' },
      { title: 'Process reward models' },
      { title: 'Faithful reasoning research' },
    ],
    keyPapers: [
      { title: 'Chain-of-Thought Prompting (2022)', url: 'https://arxiv.org/abs/2201.11903' },
      { title: "Let's Verify Step by Step (2023)", url: 'https://arxiv.org/abs/2305.20050' },
      { title: "Language Models Don't Always Say What They Think (2023)", url: 'https://arxiv.org/abs/2305.04388' },
    ],
    safetyPros: ['Reasoning visible', 'Process oversight possible', 'Auditable'],
    safetyCons: ['Faithfulness uncertain', 'Can be gamed', 'Steganography possible'],
    taxonomy: {
      interpretability: 'hybrid',
      channel: 'human-facing',
      architectureRelevance: ['Dense Transformers', 'Any LLM-based'],
    },
  },
  {
    id: 'steganographic-encoding',
    name: 'Steganographic Capacity',
    description: 'Ability of AI systems to embed information in outputs through subtle patterns (word choice, formatting, timing). A capability that emerges from model expressiveness.',
    likelihood: '30-50%',
    likelihoodNote: 'Demonstrated capability; prevalence in deployed systems uncertain',
    timeline: '2025-2030',
    safetyOutlook: {
      rating: 'challenging',
      score: 2,
      summary: 'Enables circumvention of monitoring; collusion; evasion of safety measures',
      keyRisks: ['Undetectable coordination', 'Safety measure evasion', 'Monitoring circumvention', 'Perfect steganography may be theoretically undetectable'],
      keyOpportunities: ['Paraphrasing countermeasures', 'Statistical detection possible', 'Logging at interfaces'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Detection methods exist but arms race dynamics' },
    whitebox: { level: 'LOW', note: 'Hidden in plain sight' },
    training: { level: 'HIGH', note: 'Can emerge or be trained' },
    predictability: { level: 'LOW', note: 'Hidden channels unpredictable' },
    labs: [
      { name: 'Redwood Research' },
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Academic security groups' },
    ],
    examples: [
      { title: 'GPT-3.5 steganography fine-tuning' },
      { title: 'Lexical substitution patterns' },
      { title: 'Timing channel attacks' },
    ],
    keyPapers: [
      { title: 'Steganography in Chain-of-Thought', url: 'https://www.alignmentforum.org/posts/yDcMDJeSck7SuBs24/steganography-in-chain-of-thought-reasoning' },
      { title: 'Preventing LMs from Hiding Reasoning', url: 'https://www.alignmentforum.org/posts/9Fdd9N7Escg3tcymb/preventing-language-models-from-hiding-their-reasoning' },
    ],
    safetyPros: ['Paraphrasing countermeasures exist', 'Statistical detection possible'],
    safetyCons: ['Perfect steganography undetectable', 'Arms race dynamics', 'Multiple orthogonal channels'],
    taxonomy: {
      interpretability: 'opaque',
      channel: 'ai-ai-covert',
      architectureRelevance: ['Any with text output', 'Multi-agent', 'Heavy Scaffolding/Agentic'],
    },
  },
  {
    id: 'emergent-private-languages',
    name: 'Emergent Communication Protocols',
    description: 'AI agents spontaneously developing communication conventions through interaction. Observed in multi-agent RL and may emerge in LLM agent populations.',
    likelihood: '20-40%',
    likelihoodNote: 'Demonstrated in controlled settings; unclear if scales to LLM agents',
    timeline: '2026-2032',
    safetyOutlook: {
      rating: 'challenging',
      score: 2,
      summary: 'Fundamental transparency barrier; humans excluded from AI coordination',
      keyRisks: ['Collusion without explicit coordination', 'Humans cannot monitor', 'Hierarchical grammar structures emerge', 'Bypasses safety mechanisms'],
      keyOpportunities: ['Can mandate natural language interface', 'Detectable if looking for it', 'Protocol analysis possible'],
    },
    researchTractability: { level: 'LOW', note: 'Emergent behavior hard to study/predict' },
    whitebox: { level: 'LOW', note: 'Protocols opaque by nature' },
    training: { level: 'N/A', note: 'Emerges without training for it' },
    predictability: { level: 'LOW', note: 'Emergent = unpredictable' },
    labs: [
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Multi-agent research groups' },
    ],
    examples: [
      { title: 'Emergent communication in games' },
      { title: 'Multi-agent RL protocols' },
      { title: 'LLM population conventions' },
    ],
    keyPapers: [
      { title: 'Emergent Communication (2017)', url: 'https://arxiv.org/abs/1703.04908' },
      { title: 'Multi-Agent Communication', url: 'https://arxiv.org/abs/1605.06676' },
    ],
    safetyPros: ['Can mandate NL interface', 'Protocol analysis possible'],
    safetyCons: ['Humans excluded', 'Collusion risk', 'Bypasses safety measures'],
    taxonomy: {
      interpretability: 'opaque',
      channel: 'ai-ai-covert',
      architectureRelevance: ['Multi-agent systems', 'Heavy Scaffolding/Agentic', 'Any with AI-AI interaction'],
    },
  },
  {
    id: 'circuit-based',
    name: 'Mechanistic Interpretability',
    description: 'Techniques for identifying computational circuits within neural networks (induction heads, attention patterns). Enables reverse-engineering of specific model behaviors.',
    likelihood: '40-60%',
    likelihoodNote: 'Active research; successfully applied to smaller models and specific circuits',
    timeline: 'Now - 2030',
    safetyOutlook: {
      rating: 'mixed',
      score: 5,
      summary: 'Offers hope for understanding without redesign; but circuits may be too numerous/complex at scale',
      keyRisks: ['May not scale to full understanding', 'Circuits interact in complex ways', 'Deception circuits may be hard to identify'],
      keyOpportunities: ['Reverse-engineering possible', 'Can identify specific capabilities', 'Targeted interventions'],
    },
    researchTractability: { level: 'HIGH', note: 'Active Anthropic/academic research' },
    whitebox: { level: 'PARTIAL', note: 'Some circuits understood; most not' },
    training: { level: 'HIGH', note: 'Circuits emerge from training' },
    predictability: { level: 'MEDIUM', note: 'Understood circuits are predictable' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'EleutherAI' },
    ],
    examples: [
      { title: 'Induction heads' },
      { title: 'Indirect object identification' },
      { title: 'Attention pattern analysis' },
    ],
    keyPapers: [
      { title: 'In-context Learning and Induction Heads (2022)', url: 'https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html' },
      { title: 'Anthropic Circuit Updates (2025)', url: 'https://transformer-circuits.pub/2025/april-update/index.html' },
    ],
    safetyPros: ['Targeted understanding', 'Can identify specific capabilities', 'Intervention possible'],
    safetyCons: ['May not scale', 'Circuit interactions complex', 'Incomplete coverage'],
    taxonomy: {
      interpretability: 'post-hoc',
      channel: 'internal',
      architectureRelevance: ['Dense Transformers', 'Sparse/MoE'],
    },
  },
  {
    id: 'strategic-self-modeling',
    name: 'Situational Awareness',
    description: 'AI systems developing internal representations of themselves, their training process, deployment context, and the agents they interact with. Emerges with model scale.',
    likelihood: '50-70%',
    likelihoodNote: 'Observed in frontier models; increases with capability',
    timeline: 'Now (emerging)',
    safetyOutlook: {
      rating: 'challenging',
      score: 2,
      summary: 'Enables sophisticated deception; recursive theory-of-mind allows logical coordination',
      keyRisks: ['Foundation for deceptive alignment', 'Enables strategic behavior modification', 'Recursive modeling of human overseers', 'Logical coordination without explicit communication'],
      keyOpportunities: ['Can probe for self-models', 'May enable better oversight if understood', 'Situational awareness is detectable'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Can probe for self-knowledge; hard to ensure completeness' },
    whitebox: { level: 'LOW', note: 'Self-models opaque' },
    training: { level: 'HIGH', note: 'Emerges from scale/capability' },
    predictability: { level: 'LOW', note: 'Strategic behavior unpredictable' },
    labs: [
      { name: 'Anthropic', url: '/knowledge-base/organizations/labs/anthropic' },
      { name: 'OpenAI', url: '/knowledge-base/organizations/labs/openai' },
      { name: 'Apollo Research' },
    ],
    examples: [
      { title: 'Claude 3 Opus faking alignment (12%)' },
      { title: 'o1 resisting interrogation' },
      { title: 'Models reasoning about training' },
    ],
    keyPapers: [
      { title: 'Situational Awareness in LLMs', url: 'https://arxiv.org/abs/2309.00667' },
      { title: 'Sleeper Agents (2024)', url: 'https://arxiv.org/abs/2401.05566' },
    ],
    safetyPros: ['Can probe for self-models', 'Detectable through evaluation'],
    safetyCons: ['Enables deception', 'Recursive modeling of overseers', 'Logical coordination'],
    taxonomy: {
      interpretability: 'opaque',
      channel: 'internal',
      architectureRelevance: ['Any at sufficient scale', 'Worse with agentic deployment'],
    },
  },
  {
    id: 'explicit-world-models',
    name: 'Explicit World Models',
    description: 'Learned, separable representations of environment dynamics used for planning and prediction. Includes MuZero-style models and JEPA architectures.',
    likelihood: '15-30%',
    likelihoodNote: 'Active research direction; not yet competitive with LLMs for general tasks',
    timeline: '2027-2035',
    safetyOutlook: {
      rating: 'favorable',
      score: 7,
      summary: 'Can examine what model "believes" about world; separable components aid interpretability',
      keyRisks: ['World model may be wrong in dangerous ways', 'Planning on wrong model compounds errors', 'May not generalize as well as LLMs'],
      keyOpportunities: ['Inspectable beliefs', 'Can verify world model accuracy', 'Separable = more auditable'],
    },
    researchTractability: { level: 'MEDIUM', note: 'Active research; transfer from RL safety' },
    whitebox: { level: 'PARTIAL', note: 'World model inspectable; policy less so' },
    training: { level: 'HIGH', note: 'Model-based RL, self-play' },
    predictability: { level: 'MEDIUM', note: 'Can predict from world model state' },
    labs: [
      { name: 'Google DeepMind', url: '/knowledge-base/organizations/labs/deepmind' },
      { name: 'Meta FAIR' },
      { name: 'UC Berkeley' },
    ],
    examples: [
      { title: 'MuZero' },
      { title: 'Dreamer v3' },
      { title: 'JEPA (LeCun)' },
    ],
    keyPapers: [
      { title: 'World Models (Ha 2018)', url: 'https://arxiv.org/abs/1803.10122' },
      { title: 'MuZero (2020)', url: 'https://arxiv.org/abs/1911.08265' },
      { title: 'JEPA (LeCun 2022)', url: 'https://openreview.net/forum?id=BZ5a1r-kVsf' },
    ],
    safetyPros: ['Inspectable beliefs', 'Separable components', 'Verifiable'],
    safetyCons: ['Wrong models compound', 'May not generalize', 'Capability limitations'],
    taxonomy: {
      interpretability: 'hybrid',
      channel: 'internal',
      architectureRelevance: ['World Models + Planning', 'Model-based RL'],
    },
  },
];

function Badge({ level }: { level: string }) {
  const cls = level.toLowerCase().includes('high') ? 'bg-green-100 text-green-800' :
              level.toLowerCase().includes('medium') ? 'bg-amber-100 text-amber-800' :
              level.toLowerCase().includes('low') ? 'bg-red-100 text-red-800' :
              level.toLowerCase().includes('partial') ? 'bg-indigo-100 text-indigo-800' :
              'bg-gray-100 text-gray-600';
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${cls}`}>{level}</span>;
}

function getSafetyClass(rating: SafetyOutlook) {
  switch (rating) {
    case 'favorable': return 'bg-green-100 border-green-300 text-green-800';
    case 'mixed': return 'bg-amber-100 border-amber-300 text-amber-800';
    case 'challenging': return 'bg-red-100 border-red-300 text-red-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-600';
  }
}

export default function TechnicalInnovationsTableView() {
  const [viewMode, setViewMode] = useState<'taxonomy' | 'table'>('table');

  const interpretabilityLevels: InterpretabilityLevel[] = ['opaque', 'post-hoc', 'hybrid', 'inherent'];
  const channels: CommunicationChannel[] = ['internal', 'human-facing', 'ai-ai-overt', 'ai-ai-covert'];

  const interpretabilityLabels: Record<InterpretabilityLevel, { label: string; desc: string }> = {
    'opaque': { label: 'Opaque', desc: 'Cannot interpret' },
    'post-hoc': { label: 'Post-hoc', desc: 'Reverse-engineerable' },
    'hybrid': { label: 'Hybrid', desc: 'Partially visible' },
    'inherent': { label: 'Inherent', desc: 'Transparent by design' },
  };

  const channelLabels: Record<CommunicationChannel, { label: string; desc: string }> = {
    'internal': { label: 'Internal', desc: 'Within model' },
    'human-facing': { label: 'Human-Facing', desc: 'Visible to humans' },
    'ai-ai-overt': { label: 'AI-AI Overt', desc: 'Visible AI communication' },
    'ai-ai-covert': { label: 'AI-AI Covert', desc: 'Hidden AI communication' },
  };

  const getInnovationsByCell = (interp: InterpretabilityLevel, channel: CommunicationChannel) => {
    return INNOVATIONS.filter(i =>
      i.taxonomy.interpretability === interp && i.taxonomy.channel === channel
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <a href="/knowledge-base/intelligence-paradigms/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Intelligence Paradigms
          </a>
          <h1 className="text-lg font-semibold text-gray-900 flex-1">Technical Innovations</h1>
          <nav className="flex gap-2">
            <a href="/knowledge-base/architecture-scenarios/table" className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
              Architecture Scenarios
            </a>
            <a href="/knowledge-base/technical-innovations/table" className="px-3 py-1.5 text-sm rounded-md bg-blue-500 text-white">
              Technical Innovations
            </a>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-gray-600 mb-6 max-w-3xl">
          Emerging capabilities and techniques in AI systems. Unlike architecture choices, these are not mutually exclusive -
          a single system can exhibit multiple innovations simultaneously. The safety assessment indicates the outlook for each innovation.
        </p>

        {/* View Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              viewMode === 'taxonomy'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('taxonomy')}
          >
            Taxonomy Matrix
          </button>
          <button
            className={`px-4 py-2 text-sm rounded-md border transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setViewMode('table')}
          >
            Detailed Table
          </button>
        </div>

        {viewMode === 'taxonomy' && (
          <div className="space-y-8">
            {/* Taxonomy Matrix */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">Interpretability × Communication Channel</h2>
              <p className="text-sm text-gray-500 mb-4">
                Colors indicate safety outlook:
                <span className="text-green-700 ml-2">green = favorable</span>,
                <span className="text-amber-700 mx-1">amber = mixed</span>,
                <span className="text-red-700">red = challenging</span>
              </p>

              <div className="overflow-x-auto">
                <div className="grid gap-px bg-gray-300 rounded-lg overflow-hidden"
                     style={{ gridTemplateColumns: '160px repeat(4, minmax(160px, 1fr))' }}>
                  {/* Header row */}
                  <div className="bg-gray-900 p-3 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Channel ↓ / Interp →</span>
                  </div>
                  {interpretabilityLevels.map(level => (
                    <div key={level} className="bg-gray-800 p-3 text-center">
                      <div className="text-xs font-semibold text-white">{interpretabilityLabels[level].label}</div>
                      <div className="text-[10px] text-gray-400">{interpretabilityLabels[level].desc}</div>
                    </div>
                  ))}

                  {/* Data rows */}
                  {channels.map(channel => (
                    <>
                      <div key={`header-${channel}`} className="bg-gray-700 p-3">
                        <div className="text-xs font-semibold text-white">{channelLabels[channel].label}</div>
                        <div className="text-[10px] text-gray-400">{channelLabels[channel].desc}</div>
                      </div>
                      {interpretabilityLevels.map(level => {
                        const cellInnovations = getInnovationsByCell(level, channel);
                        return (
                          <div key={`${channel}-${level}`} className="bg-white p-2 min-h-[90px] flex flex-col gap-1.5">
                            {cellInnovations.length === 0 ? (
                              <span className="text-[10px] text-gray-400 italic flex items-center justify-center h-full">—</span>
                            ) : (
                              cellInnovations.map(i => (
                                <div
                                  key={i.id}
                                  className={`px-2 py-1.5 rounded text-xs border transition-colors hover:opacity-80 ${getSafetyClass(i.safetyOutlook.rating)}`}
                                  title={`${i.name}: ${i.safetyOutlook.summary}`}
                                >
                                  <div className="font-medium">{i.name}</div>
                                  <div className="text-[10px] opacity-75 mt-0.5">{i.safetyOutlook.score}/10</div>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>

            {/* Architecture Relevance */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Relevance by Architecture</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Dense Transformers', 'Sparse/MoE', 'Heavy Scaffolding/Agentic', 'Neuro-Symbolic', 'Multi-agent systems'].map(arch => {
                  const relevant = INNOVATIONS.filter(i =>
                    i.taxonomy.architectureRelevance.some(a =>
                      a.toLowerCase().includes(arch.toLowerCase().split('/')[0].split(' ')[0])
                    )
                  );
                  return (
                    <div key={arch} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">{arch}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {relevant.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">No specific innovations</span>
                        ) : (
                          relevant.map(i => (
                            <span
                              key={i.id}
                              className={`px-2 py-0.5 rounded text-[10px] border ${getSafetyClass(i.safetyOutlook.rating)}`}
                            >
                              {i.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border border-gray-200 font-semibold sticky left-0 bg-gray-50 z-10">Innovation</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold max-w-xs">Description</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Interp.</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Channel</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Safety</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Prevalence</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Timeline</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Tractability</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Key Risks</th>
                  <th className="text-left p-2 border border-gray-200 font-semibold">Key Opportunities</th>
                </tr>
              </thead>
              <tbody>
                {INNOVATIONS.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="p-2 border border-gray-200 sticky left-0 bg-white z-10">
                      <div className="font-medium text-gray-900 whitespace-nowrap">{i.name}</div>
                    </td>
                    <td className="p-2 border border-gray-200 text-xs text-gray-600 max-w-xs">
                      {i.description}
                    </td>
                    <td className="p-2 border border-gray-200">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        i.taxonomy.interpretability === 'opaque' ? 'bg-red-100 text-red-700' :
                        i.taxonomy.interpretability === 'inherent' ? 'bg-green-100 text-green-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {interpretabilityLabels[i.taxonomy.interpretability].label}
                      </span>
                    </td>
                    <td className="p-2 border border-gray-200">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                        i.taxonomy.channel === 'ai-ai-covert' ? 'bg-red-100 text-red-700' :
                        i.taxonomy.channel === 'human-facing' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {channelLabels[i.taxonomy.channel].label}
                      </span>
                    </td>
                    <td className="p-2 border border-gray-200">
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${
                          i.safetyOutlook.rating === 'favorable' ? 'text-green-600' :
                          i.safetyOutlook.rating === 'mixed' ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {i.safetyOutlook.score}/10
                        </span>
                        <span className={`px-1 py-0.5 rounded text-[9px] ${getSafetyClass(i.safetyOutlook.rating)}`}>
                          {i.safetyOutlook.rating}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 border border-gray-200">
                      <div className="text-blue-600 font-medium text-xs">{i.likelihood}</div>
                    </td>
                    <td className="p-2 border border-gray-200 text-xs text-gray-600 whitespace-nowrap">{i.timeline}</td>
                    <td className="p-2 border border-gray-200">
                      <Badge level={i.researchTractability.level} />
                    </td>
                    <td className="p-2 border border-gray-200">
                      <ul className="text-[11px] text-red-700 space-y-0.5">
                        {i.safetyOutlook.keyRisks.slice(0, 2).map((risk, idx) => (
                          <li key={idx}>• {risk}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-2 border border-gray-200">
                      <ul className="text-[11px] text-green-700 space-y-0.5">
                        {i.safetyOutlook.keyOpportunities.slice(0, 2).map((opp, idx) => (
                          <li key={idx}>• {opp}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
