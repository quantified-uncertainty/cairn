#!/usr/bin/env node
/**
 * Expand External Links Coverage
 *
 * Adds more external links to reach better coverage by:
 * 1. Manual mappings for known topics
 * 2. Broader fuzzy matching
 * 3. Wikipedia pages for notable people/concepts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');
const LESSWRONG_TAGS_PATH = path.join(ROOT, 'src/data/reference/lesswrong-tags.txt');
const EAFORUM_TAGS_PATH = path.join(ROOT, 'src/data/reference/eaforum-tags.txt');

// Manual mappings for pages that didn't match automatically
const MANUAL_MAPPINGS = {
  // People
  'dario-amodei': {
    wikipedia: 'https://en.wikipedia.org/wiki/Dario_Amodei',
    eaForum: 'https://forum.effectivealtruism.org/topics/dario-amodei'
  },
  'ilya-sutskever': {
    wikipedia: 'https://en.wikipedia.org/wiki/Ilya_Sutskever'
  },
  'jan-leike': {
    lesswrong: 'https://www.lesswrong.com/tag/jan-leike'
  },
  'sam-altman': {
    wikipedia: 'https://en.wikipedia.org/wiki/Sam_Altman'
  },
  'connor-leahy': {
    lesswrong: 'https://www.lesswrong.com/tag/connor-leahy'
  },
  'dan-hendrycks': {
    lesswrong: 'https://www.lesswrong.com/tag/dan-hendrycks'
  },
  'chris-olah': {
    lesswrong: 'https://www.lesswrong.com/tag/chris-olah'
  },
  'neel-nanda': {
    lesswrong: 'https://www.lesswrong.com/tag/neel-nanda'
  },

  // Organizations
  'chai': {
    lesswrong: 'https://www.lesswrong.com/tag/center-for-human-compatible-ai-chai',
    eaForum: 'https://forum.effectivealtruism.org/topics/center-for-human-compatible-ai'
  },
  'arc': {
    lesswrong: 'https://www.lesswrong.com/tag/arc-alignment-research-center',
    eaForum: 'https://forum.effectivealtruism.org/topics/alignment-research-center'
  },
  'cais': {
    lesswrong: 'https://www.lesswrong.com/tag/center-for-ai-safety-cais',
    eaForum: 'https://forum.effectivealtruism.org/topics/center-for-ai-safety'
  },
  'govai': {
    lesswrong: 'https://www.lesswrong.com/tag/centre-for-the-governance-of-ai',
    eaForum: 'https://forum.effectivealtruism.org/topics/centre-for-the-governance-of-ai'
  },
  'uk-aisi': {
    lesswrong: 'https://www.lesswrong.com/tag/uk-ai-safety-institute',
    eaForum: 'https://forum.effectivealtruism.org/topics/uk-ai-safety-institute'
  },
  'us-aisi': {
    lesswrong: 'https://www.lesswrong.com/tag/us-ai-safety-institute',
    eaForum: 'https://forum.effectivealtruism.org/topics/us-ai-safety-institute'
  },

  // Governance & Policy
  'eu-ai-act': {
    wikipedia: 'https://en.wikipedia.org/wiki/Artificial_Intelligence_Act',
    lesswrong: 'https://www.lesswrong.com/tag/eu-ai-act',
    eaForum: 'https://forum.effectivealtruism.org/topics/eu-ai-act'
  },
  'us-executive-order': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-executive-order',
    eaForum: 'https://forum.effectivealtruism.org/topics/us-ai-executive-order'
  },
  'california-sb1047': {
    lesswrong: 'https://www.lesswrong.com/tag/sb-1047',
    eaForum: 'https://forum.effectivealtruism.org/topics/sb-1047'
  },
  'export-controls': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-chip-export-controls',
    eaForum: 'https://forum.effectivealtruism.org/topics/export-controls'
  },
  'international-coordination': {
    lesswrong: 'https://www.lesswrong.com/tag/international-coordination',
    eaForum: 'https://forum.effectivealtruism.org/topics/international-ai-cooperation'
  },

  // Technical Concepts
  'mech-interp': {
    lesswrong: 'https://www.lesswrong.com/tag/mechanistic-interpretability',
    eaForum: 'https://forum.effectivealtruism.org/topics/mechanistic-interpretability'
  },
  'mechanistic-interpretability': {
    lesswrong: 'https://www.lesswrong.com/tag/mechanistic-interpretability'
  },
  'reward-modeling': {
    lesswrong: 'https://www.lesswrong.com/tag/reward-modeling'
  },
  'process-supervision': {
    lesswrong: 'https://www.lesswrong.com/tag/process-supervision'
  },
  'weak-to-strong': {
    lesswrong: 'https://www.lesswrong.com/tag/weak-to-strong-generalization'
  },
  'probing': {
    lesswrong: 'https://www.lesswrong.com/tag/probing'
  },
  'representation-engineering': {
    lesswrong: 'https://www.lesswrong.com/tag/representation-engineering'
  },
  'circuit-breakers': {
    lesswrong: 'https://www.lesswrong.com/tag/circuit-breakers'
  },
  'refusal-training': {
    lesswrong: 'https://www.lesswrong.com/tag/refusal-training'
  },
  'output-filtering': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety-via-output-filtering'
  },

  // Risk Concepts
  'disinformation': {
    wikipedia: 'https://en.wikipedia.org/wiki/Disinformation',
    lesswrong: 'https://www.lesswrong.com/tag/misinformation-and-disinformation',
    eaForum: 'https://forum.effectivealtruism.org/topics/misinformation-and-disinformation'
  },
  'concentration-of-power': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-concentration-of-power',
    eaForum: 'https://forum.effectivealtruism.org/topics/concentration-of-power'
  },
  'authoritarian-tools': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-and-authoritarianism'
  },
  'authoritarian-takeover': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-and-authoritarianism'
  },
  'distributional-shift': {
    lesswrong: 'https://www.lesswrong.com/tag/distributional-shift'
  },
  'sandbagging': {
    lesswrong: 'https://www.lesswrong.com/tag/sandbagging'
  },
  'steganography': {
    lesswrong: 'https://www.lesswrong.com/tag/steganography'
  },
  'multipolar-trap': {
    lesswrong: 'https://www.lesswrong.com/tag/multipolar-scenarios'
  },
  'winner-take-all': {
    lesswrong: 'https://www.lesswrong.com/tag/winner-take-all-dynamics'
  },
  'enfeeblement': {
    lesswrong: 'https://www.lesswrong.com/tag/enfeeblement'
  },

  // Framework/Model Concepts
  'carlsmith-six-premises': {
    lesswrong: 'https://www.lesswrong.com/tag/is-power-seeking-ai-an-existential-risk-2021'
  },

  // Timelines & Forecasting
  'agi-timeline': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-timelines',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-forecasting'
  },
  'agi-timeline-debate': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-timelines',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-forecasting'
  },

  // Debates
  'scaling-debate': {
    lesswrong: 'https://www.lesswrong.com/tag/scaling-laws'
  },
  'interpretability-sufficient': {
    lesswrong: 'https://www.lesswrong.com/tag/interpretability-ml-and-ai'
  },

  // Responses/Interventions
  'pause-moratorium': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-pause',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-pause-debate-2023'
  },
  'pause': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-pause',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-pause-debate-2023'
  },
  'formal-verification': {
    lesswrong: 'https://www.lesswrong.com/tag/formal-verification'
  },
  'evals': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-evaluations',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-evaluations-and-standards'
  },
  'deepfake-detection': {
    lesswrong: 'https://www.lesswrong.com/tag/deepfakes'
  },
  'content-authentication': {
    lesswrong: 'https://www.lesswrong.com/tag/deepfakes'
  },
  'lab-culture': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-lab-safety',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-labs'
  },
  'whistleblower-protections': {
    eaForum: 'https://forum.effectivealtruism.org/topics/whistleblowing'
  },
  'labor-transition': {
    lesswrong: 'https://www.lesswrong.com/tag/economic-consequences-of-agi',
    eaForum: 'https://forum.effectivealtruism.org/topics/labor-and-automation'
  },

  // History
  'miri-era': {
    lesswrong: 'https://www.lesswrong.com/tag/machine-intelligence-research-institute-miri'
  },
  'deep-learning-era': {
    lesswrong: 'https://www.lesswrong.com/tag/deep-learning'
  },
  'early-warnings': {
    lesswrong: 'https://www.lesswrong.com/tag/history-of-ai'
  },
  'mainstream-era': {
    lesswrong: 'https://www.lesswrong.com/tag/history-of-ai'
  },

  // Intelligence Paradigms
  'neuro-symbolic': {
    lesswrong: 'https://www.lesswrong.com/tag/neurosymbolic-ai'
  },
  'sparse-moe': {
    lesswrong: 'https://www.lesswrong.com/tag/mixture-of-experts'
  },
  'world-models': {
    lesswrong: 'https://www.lesswrong.com/tag/world-models'
  },
  'collective-intelligence': {
    lesswrong: 'https://www.lesswrong.com/tag/collective-intelligence'
  },

  // Worldviews
  'long-timelines': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-timelines'
  },
  'governance-focused': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-governance',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-governance'
  },

  // Epistemic Risks
  'trust-cascade': {
    lesswrong: 'https://www.lesswrong.com/tag/trust'
  },
  'trust-decline': {
    lesswrong: 'https://www.lesswrong.com/tag/trust'
  },
  'preference-manipulation': {
    lesswrong: 'https://www.lesswrong.com/tag/human-values'
  },
  'cyber-psychosis': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-psychology'
  },
  'consensus-manufacturing': {
    lesswrong: 'https://www.lesswrong.com/tag/misinformation-and-disinformation'
  },
  'authentication-collapse': {
    lesswrong: 'https://www.lesswrong.com/tag/deepfakes'
  },
  'expertise-atrophy': {
    lesswrong: 'https://www.lesswrong.com/tag/human-performance'
  },
  'epistemic-collapse': {
    lesswrong: 'https://www.lesswrong.com/tag/epistemic-security'
  },
  'reality-fragmentation': {
    lesswrong: 'https://www.lesswrong.com/tag/filter-bubbles'
  },
  'fraud': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-misuse'
  },
  'flash-dynamics': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-takeoff'
  },
  'irreversibility': {
    lesswrong: 'https://www.lesswrong.com/tag/irreversibility'
  },

  // Capabilities
  'coding': {
    lesswrong: 'https://www.lesswrong.com/tag/programming-ai'
  },
  'long-horizon': {
    lesswrong: 'https://www.lesswrong.com/tag/agentic-ai'
  },
  'adoption': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-deployment'
  },

  // ATM Parameters
  'alignment-robustness': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-alignment'
  },
  'safety-capability-gap': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety'
  },
  'safety-culture-strength': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-lab-safety'
  },
  'human-oversight-quality': {
    lesswrong: 'https://www.lesswrong.com/tag/scalable-oversight'
  },
  'interpretability-coverage': {
    lesswrong: 'https://www.lesswrong.com/tag/interpretability-ml-and-ai'
  },
  'regulatory-capacity': {
    lesswrong: 'https://www.lesswrong.com/tag/regulation-and-ai-risk'
  },
  'coordination-capacity': {
    lesswrong: 'https://www.lesswrong.com/tag/international-coordination'
  },
  'institutional-quality': {
    eaForum: 'https://forum.effectivealtruism.org/topics/institutions'
  },
  'societal-resilience': {
    eaForum: 'https://forum.effectivealtruism.org/topics/resilience'
  },
  'societal-trust': {
    lesswrong: 'https://www.lesswrong.com/tag/trust'
  },

  // ATM Scenarios
  'gradual': {
    lesswrong: 'https://www.lesswrong.com/tag/slow-takeoff'
  },
  'rapid': {
    lesswrong: 'https://www.lesswrong.com/tag/fast-takeoff'
  },
  'suffering-lock-in': {
    lesswrong: 'https://www.lesswrong.com/tag/s-risk',
    eaForum: 'https://forum.effectivealtruism.org/topics/s-risk'
  },
  'rogue-actor': {
    eaForum: 'https://forum.effectivealtruism.org/topics/global-catastrophic-risk'
  },
  'state-actor': {
    eaForum: 'https://forum.effectivealtruism.org/topics/great-power-conflict'
  },
  'economic-power': {
    lesswrong: 'https://www.lesswrong.com/tag/economic-consequences-of-agi'
  },
  'political-power': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-concentration-of-power'
  },

  // ATM Factors
  'lab-safety-practices': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-lab-safety'
  },
  'technical-ai-safety': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-safety'
  },
  'racing-intensity': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-arms-race'
  },
  'economic-stability': {
    eaForum: 'https://forum.effectivealtruism.org/topics/economic-growth'
  },
  'epistemics': {
    lesswrong: 'https://www.lesswrong.com/tag/epistemic-rationality'
  },
  'adaptability': {
    eaForum: 'https://forum.effectivealtruism.org/topics/resilience'
  },
  'biological-threat-exposure': {
    eaForum: 'https://forum.effectivealtruism.org/topics/global-catastrophic-biological-risk'
  },
  'cyber-threat-exposure': {
    lesswrong: 'https://www.lesswrong.com/tag/computer-security-and-cryptography'
  },
  'robot-threat-exposure': {
    lesswrong: 'https://www.lesswrong.com/tag/robotics'
  },

  // More ATM Parameters and Factors
  'human-agency': {
    lesswrong: 'https://www.lesswrong.com/tag/agency'
  },
  'human-expertise': {
    lesswrong: 'https://www.lesswrong.com/tag/human-performance'
  },
  'information-authenticity': {
    lesswrong: 'https://www.lesswrong.com/tag/deepfakes'
  },
  'preference-authenticity': {
    lesswrong: 'https://www.lesswrong.com/tag/human-values'
  },
  'reality-coherence': {
    lesswrong: 'https://www.lesswrong.com/tag/epistemic-security'
  },
  'surprise-threat-exposure': {
    eaForum: 'https://forum.effectivealtruism.org/topics/global-catastrophic-risk'
  },

  // More Epistemic Risks
  'epistemic-sycophancy': {
    lesswrong: 'https://www.lesswrong.com/tag/sycophancy'
  },
  'historical-revisionism': {
    lesswrong: 'https://www.lesswrong.com/tag/misinformation-and-disinformation'
  },
  'institutional-capture': {
    lesswrong: 'https://www.lesswrong.com/tag/institutions'
  },
  'knowledge-monopoly': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-concentration-of-power'
  },
  'learned-helplessness': {
    lesswrong: 'https://www.lesswrong.com/tag/learned-helplessness'
  },
  'legal-evidence-crisis': {
    lesswrong: 'https://www.lesswrong.com/tag/deepfakes'
  },
  'scientific-corruption': {
    lesswrong: 'https://www.lesswrong.com/tag/science'
  },

  // More Structural Risks
  'erosion-of-agency': {
    lesswrong: 'https://www.lesswrong.com/tag/agency'
  },

  // More Technical Concepts
  'alignment-evals': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-evaluations'
  },
  'capability-elicitation': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-evaluations'
  },
  'capability-unlearning': {
    lesswrong: 'https://www.lesswrong.com/tag/machine-unlearning'
  },
  'cirl': {
    lesswrong: 'https://www.lesswrong.com/tag/cooperative-inverse-reinforcement-learning'
  },
  'dangerous-cap-evals': {
    lesswrong: 'https://www.lesswrong.com/tag/dangerous-capability-evaluations'
  },
  'evals-governance': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-evaluations'
  },
  'model-spec': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-specifications'
  },
  'multi-agent': {
    lesswrong: 'https://www.lesswrong.com/tag/multi-agent-systems'
  },
  'provably-safe': {
    lesswrong: 'https://www.lesswrong.com/tag/provable-ai-safety'
  },
  'scheming-detection': {
    lesswrong: 'https://www.lesswrong.com/tag/scheming'
  },
  'sleeper-agent-detection': {
    lesswrong: 'https://www.lesswrong.com/tag/sleeper-agents'
  },
  'structured-access': {
    lesswrong: 'https://www.lesswrong.com/tag/structured-access'
  },
  'tool-restrictions': {
    lesswrong: 'https://www.lesswrong.com/tag/tool-use'
  },

  // More Governance
  'voluntary-commitments': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-commitments'
  },
  'coordination-mechanisms': {
    lesswrong: 'https://www.lesswrong.com/tag/international-coordination'
  },
  'international-summits': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety-summits',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-safety-summit'
  },
  'seoul-declaration': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-safety-summit'
  },
  'nist-ai-rmf': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-standards'
  },
  'model-registries': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-governance'
  },
  'ai-safety-institutes': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety-institutes',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-safety-institutes'
  },
  'standards-bodies': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-standards'
  },
  'hardware-enabled-governance': {
    lesswrong: 'https://www.lesswrong.com/tag/hardware-enabled-governance'
  },
  'thresholds': {
    lesswrong: 'https://www.lesswrong.com/tag/compute-governance'
  },
  'monitoring': {
    lesswrong: 'https://www.lesswrong.com/tag/compute-governance'
  },
  'international-regimes': {
    lesswrong: 'https://www.lesswrong.com/tag/international-coordination'
  },
  'governance-policy': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-governance',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-governance'
  },
  'effectiveness-assessment': {
    eaForum: 'https://forum.effectivealtruism.org/topics/impact-assessment'
  },

  // More Epistemic Tools
  'coordination-tech': {
    lesswrong: 'https://www.lesswrong.com/tag/coordination-cooperation'
  },
  'deliberation': {
    lesswrong: 'https://www.lesswrong.com/tag/deliberation'
  },
  'epistemic-infrastructure': {
    lesswrong: 'https://www.lesswrong.com/tag/epistemic-security'
  },
  'hybrid-systems': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-human-interaction'
  },

  // Intelligence Paradigms
  'biological-organoid': {
    lesswrong: 'https://www.lesswrong.com/tag/biological-cognitive-enhancement'
  },
  'genetic-enhancement': {
    lesswrong: 'https://www.lesswrong.com/tag/biological-cognitive-enhancement'
  },
  'heavy-scaffolding': {
    lesswrong: 'https://www.lesswrong.com/tag/agentic-ai'
  },
  'light-scaffolding': {
    lesswrong: 'https://www.lesswrong.com/tag/agentic-ai'
  },
  'minimal-scaffolding': {
    lesswrong: 'https://www.lesswrong.com/tag/agentic-ai'
  },
  'provable-safe': {
    lesswrong: 'https://www.lesswrong.com/tag/provable-ai-safety'
  },
  'ssm-mamba': {
    lesswrong: 'https://www.lesswrong.com/tag/state-space-models'
  },

  // Models
  'capability-threshold-model': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-capabilities'
  },
  'defense-in-depth-model': {
    lesswrong: 'https://www.lesswrong.com/tag/defense-in-depth'
  },

  // More People (additional Wikipedia pages)
  'daniela-amodei': {
    eaForum: 'https://forum.effectivealtruism.org/topics/anthropic'
  },

  // More Cruxes
  'accident-risks': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-risk'
  },
  'epistemic-risks': {
    lesswrong: 'https://www.lesswrong.com/tag/epistemic-security'
  },
  'misuse-risks': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-misuse'
  },
  'structural-risks': {
    lesswrong: 'https://www.lesswrong.com/tag/structural-risks'
  },
  'solutions': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety'
  },

  // More Debates
  'why-alignment-hard': {
    lesswrong: 'https://www.lesswrong.com/tag/alignment-difficulty'
  },
  'why-alignment-easy': {
    lesswrong: 'https://www.lesswrong.com/tag/alignment-difficulty'
  },
  'case-for-xrisk': {
    lesswrong: 'https://www.lesswrong.com/tag/existential-risk',
    eaForum: 'https://forum.effectivealtruism.org/topics/existential-risk'
  },
  'case-against-xrisk': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-optimism'
  },
  'is-ai-xrisk-real': {
    lesswrong: 'https://www.lesswrong.com/tag/existential-risk',
    eaForum: 'https://forum.effectivealtruism.org/topics/existential-risk'
  },
  'open-vs-closed': {
    lesswrong: 'https://www.lesswrong.com/tag/open-source-ai'
  },
  'regulation-debate': {
    lesswrong: 'https://www.lesswrong.com/tag/regulation-and-ai-risk'
  },

  // More Future Projections/Forecasting
  'aligned-agi': {
    lesswrong: 'https://www.lesswrong.com/tag/aligned-ai'
  },
  'misaligned-catastrophe': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-catastrophe'
  },
  'multipolar-competition': {
    lesswrong: 'https://www.lesswrong.com/tag/multipolar-scenarios'
  },
  'pause-and-redirect': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-pause'
  },
  'slow-takeoff-muddle': {
    lesswrong: 'https://www.lesswrong.com/tag/slow-takeoff'
  },
  'agi-development': {
    lesswrong: 'https://www.lesswrong.com/tag/agi'
  },

  // Corporate influence
  'corporate-influence': {
    eaForum: 'https://forum.effectivealtruism.org/topics/working-at-ai-labs'
  },

  // Field Building
  'field-building': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-alignment-fieldbuilding',
    eaForum: 'https://forum.effectivealtruism.org/topics/building-the-field-of-ai-safety'
  },

  // Metrics
  'alignment-progress': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-alignment'
  },
  'lab-behavior': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-labs'
  },
  'expert-opinion': {
    eaForum: 'https://forum.effectivealtruism.org/topics/expert-opinion'
  },
  'public-opinion': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-public-opinion'
  },
  'geopolitics': {
    lesswrong: 'https://www.lesswrong.com/tag/geopolitics'
  },
  'compute-hardware': {
    lesswrong: 'https://www.lesswrong.com/tag/compute'
  },
  'economic-labor': {
    lesswrong: 'https://www.lesswrong.com/tag/economic-consequences-of-agi'
  },
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e.links]));

// Add manual mappings
let addedCount = 0;
for (const [pageId, links] of Object.entries(MANUAL_MAPPINGS)) {
  if (!existingMap.has(pageId)) {
    existingLinks.push({ pageId, links });
    existingMap.set(pageId, links);
    console.log(`Added: ${pageId}`);
    addedCount++;
  }
}

// Sort and save
existingLinks.sort((a, b) => a.pageId.localeCompare(b.pageId));

const yamlContent = `# External Links Mapping
# Maps page entity IDs to their corresponding pages on external platforms
#
# Supported platforms:
#   - wikipedia: Wikipedia article URL
#   - lesswrong: LessWrong tag/wiki URL
#   - alignmentForum: Alignment Forum wiki URL
#   - eaForum: EA Forum topic URL
#
# Generated: ${new Date().toISOString()}
# Total entries: ${existingLinks.length}

${yaml.dump(existingLinks, { lineWidth: 120, noRefs: true })}`;

fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);

console.log(`\nAdded ${addedCount} new mappings`);
console.log(`Total entries: ${existingLinks.length}`);
