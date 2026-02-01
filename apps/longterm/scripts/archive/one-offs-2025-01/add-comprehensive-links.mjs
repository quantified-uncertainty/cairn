#!/usr/bin/env node
/**
 * Add Comprehensive External Links
 *
 * Adds Wikipedia, Stampy/AISafety.info, and Arbital links
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

// Additional Wikipedia pages found
const WIKIPEDIA_ADDITIONS = {
  'reward-hacking': 'https://en.wikipedia.org/wiki/Reward_hacking',
  'specification-gaming': 'https://en.wikipedia.org/wiki/Reward_hacking',
  'rlhf': 'https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback',
  'ai-takeover': 'https://en.wikipedia.org/wiki/AI_takeover',
  'mech-interp': 'https://en.wikipedia.org/wiki/Mechanistic_interpretability',
  'mechanistic-interpretability': 'https://en.wikipedia.org/wiki/Mechanistic_interpretability',
  'interpretability': 'https://en.wikipedia.org/wiki/Explainable_artificial_intelligence',
  'ai-control': 'https://en.wikipedia.org/wiki/AI_capability_control',
  'ai-boxing': 'https://en.wikipedia.org/wiki/AI_capability_control',
  'sandboxing': 'https://en.wikipedia.org/wiki/AI_capability_control',
  'deep-learning-era': 'https://en.wikipedia.org/wiki/Deep_learning',
  'dense-transformers': 'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)',
  'transformers': 'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)',
  'scaling-laws': 'https://en.wikipedia.org/wiki/Neural_scaling_law',
  'emergent-capabilities': 'https://en.wikipedia.org/wiki/Emergent_abilities_of_large_language_models',
  'chain-of-thought': 'https://en.wikipedia.org/wiki/Prompt_engineering#Chain-of-thought',
  'constitutional-ai': 'https://en.wikipedia.org/wiki/Constitutional_AI',
  'disinformation': 'https://en.wikipedia.org/wiki/Disinformation',
  'deepfakes': 'https://en.wikipedia.org/wiki/Deepfake',
  'deepfake-detection': 'https://en.wikipedia.org/wiki/Deepfake#Detection',
  'surveillance': 'https://en.wikipedia.org/wiki/Mass_surveillance',
  'prediction-markets': 'https://en.wikipedia.org/wiki/Prediction_market',
  'decision-theory': 'https://en.wikipedia.org/wiki/Decision_theory',
  'brain-computer-interfaces': 'https://en.wikipedia.org/wiki/Brain%E2%80%93computer_interface',
  'whole-brain-emulation': 'https://en.wikipedia.org/wiki/Mind_uploading',
  'genetic-enhancement': 'https://en.wikipedia.org/wiki/Human_genetic_enhancement',
  'neuro-symbolic': 'https://en.wikipedia.org/wiki/Neuro-symbolic_AI',
  'multi-agent': 'https://en.wikipedia.org/wiki/Multi-agent_system',
  'collective-intelligence': 'https://en.wikipedia.org/wiki/Collective_intelligence',
  'game-theory': 'https://en.wikipedia.org/wiki/Game_theory',

  // People with Wikipedia pages
  'dario-amodei': 'https://en.wikipedia.org/wiki/Dario_Amodei',
  'sam-altman': 'https://en.wikipedia.org/wiki/Sam_Altman',
  'ilya-sutskever': 'https://en.wikipedia.org/wiki/Ilya_Sutskever',

  // Organizations
  'openai': 'https://en.wikipedia.org/wiki/OpenAI',
  'anthropic': 'https://en.wikipedia.org/wiki/Anthropic',
  'deepmind': 'https://en.wikipedia.org/wiki/DeepMind',
  'miri': 'https://en.wikipedia.org/wiki/Machine_Intelligence_Research_Institute',

  // Governance
  'eu-ai-act': 'https://en.wikipedia.org/wiki/Artificial_Intelligence_Act',
};

// Stampy/AISafety.info links
const STAMPY_LINKS = {
  'alignment': 'https://aisafety.info/questions/9Tii/What-is-AI-alignment',
  'ai-alignment': 'https://aisafety.info/questions/9Tii/What-is-AI-alignment',
  'existential-risk': 'https://aisafety.info/questions/8mTg/What-is-existential-risk',
  'instrumental-convergence': 'https://aisafety.info/questions/5FhD/What-is-instrumental-convergence',
  'orthogonality-thesis': 'https://aisafety.info/questions/6315/What-is-the-orthogonality-thesis',
  'corrigibility': 'https://aisafety.info/questions/7750/What-is-corrigibility',
  'mesa-optimization': 'https://aisafety.info/questions/8V5k/What-is-mesa-optimization',
  'inner-alignment': 'https://aisafety.info/questions/8V5k/What-is-mesa-optimization',
  'deceptive-alignment': 'https://aisafety.info/questions/6170/What-is-deceptive-alignment',
  'goal-misgeneralization': 'https://aisafety.info/questions/8TJ7/What-is-goal-misgeneralization',
  'reward-hacking': 'https://aisafety.info/questions/8HJI/What-is-reward-hacking',
  'specification-gaming': 'https://aisafety.info/questions/8HJI/What-is-reward-hacking',
  'goodharts-law': 'https://aisafety.info/questions/5943/What-is-Goodharts-Law',
  'scalable-oversight': 'https://aisafety.info/questions/8IHH/What-is-scalable-oversight',
  'interpretability': 'https://aisafety.info/questions/9SIA/What-is-interpretability',
  'agi': 'https://aisafety.info/questions/5651/What-is-artificial-general-intelligence-AGI',
  'superintelligence': 'https://aisafety.info/questions/5880/What-is-superintelligence',
  'ai-takeoff': 'https://aisafety.info/questions/6268/What-is-an-intelligence-explosion',
  'sharp-left-turn': 'https://aisafety.info/questions/9KE6/What-is-the-sharp-left-turn',
  'treacherous-turn': 'https://aisafety.info/questions/6396/What-is-the-treacherous-turn',
  'power-seeking': 'https://aisafety.info/questions/5FhD/What-is-instrumental-convergence',
  'ai-boxing': 'https://aisafety.info/questions/6175/What-is-AI-boxing',
  'oracle-ai': 'https://aisafety.info/questions/6271/What-is-an-Oracle-AI',
  'tool-ai': 'https://aisafety.info/questions/6277/What-is-a-Tool-AI',
  'value-learning': 'https://aisafety.info/questions/8IzO/What-is-value-learning',
  'debate': 'https://aisafety.info/questions/8Jgr/What-is-AI-safety-via-debate',
  'rlhf': 'https://aisafety.info/questions/8RIL/What-is-RLHF',
  'eliciting-latent-knowledge': 'https://aisafety.info/questions/8Lfr/What-is-Eliciting-Latent-Knowledge-ELK',
  'agent-foundations': 'https://aisafety.info/questions/8Iup/What-is-agent-foundations',
  'decision-theory': 'https://aisafety.info/questions/5LJp/What-is-decision-theory',
  'utility-functions': 'https://aisafety.info/questions/5xAh/What-is-a-utility-function',
  'x-risk': 'https://aisafety.info/questions/8mTg/What-is-existential-risk',
  's-risk': 'https://aisafety.info/questions/8VKx/What-is-s-risk',
  'catastrophic-risk': 'https://aisafety.info/questions/8mTg/What-is-existential-risk',
};

// Arbital links for key concepts
const ARBITAL_LINKS = {
  'instrumental-convergence': 'https://arbital.greaterwrong.com/p/instrumental_convergence',
  'orthogonality-thesis': 'https://arbital.greaterwrong.com/p/orthogonality',
  'corrigibility': 'https://arbital.greaterwrong.com/p/corrigibility',
  'alignment': 'https://arbital.greaterwrong.com/p/ai_alignment',
  'ai-alignment': 'https://arbital.greaterwrong.com/p/ai_alignment',
  'utility-functions': 'https://arbital.greaterwrong.com/p/utility_function',
  'value-learning': 'https://arbital.greaterwrong.com/p/value_learning',
  'goodharts-law': 'https://arbital.greaterwrong.com/p/goodharts_law',
  'superintelligence': 'https://arbital.greaterwrong.com/p/superintelligence',
  'agi': 'https://arbital.greaterwrong.com/p/agi',
  'cognitive-uncontainability': 'https://arbital.greaterwrong.com/p/cognitive_uncontainability',
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e]));

let updatedCount = 0;
let addedCount = 0;

// Update existing entries with new platforms
for (const entry of existingLinks) {
  const pageId = entry.pageId;
  let updated = false;

  // Add Wikipedia if missing and we have it
  if (!entry.links.wikipedia && WIKIPEDIA_ADDITIONS[pageId]) {
    entry.links.wikipedia = WIKIPEDIA_ADDITIONS[pageId];
    updated = true;
  }

  // Add Stampy if we have it
  if (!entry.links.stampy && STAMPY_LINKS[pageId]) {
    entry.links.stampy = STAMPY_LINKS[pageId];
    updated = true;
  }

  // Add Arbital if we have it
  if (!entry.links.arbital && ARBITAL_LINKS[pageId]) {
    entry.links.arbital = ARBITAL_LINKS[pageId];
    updated = true;
  }

  // Add Alignment Forum mirror of LessWrong where applicable
  if (entry.links.lesswrong && !entry.links.alignmentForum) {
    // Only for alignment-specific tags
    const alignmentTags = [
      'deceptive-alignment', 'mesa-optimization', 'inner-alignment', 'outer-alignment',
      'corrigibility', 'interpretability', 'scalable-oversight', 'eliciting-latent-knowledge',
      'situational-awareness', 'scheming', 'goal-misgeneralization', 'reward-hacking',
      'agent-foundations', 'ai-control', 'value-learning', 'debate'
    ];
    if (alignmentTags.includes(pageId)) {
      entry.links.alignmentForum = entry.links.lesswrong.replace('lesswrong.com', 'alignmentforum.org');
      updated = true;
    }
  }

  if (updated) {
    updatedCount++;
    console.log(`Updated: ${pageId}`);
  }
}

// Add new entries from Wikipedia that might not exist
for (const [pageId, url] of Object.entries(WIKIPEDIA_ADDITIONS)) {
  if (!existingMap.has(pageId)) {
    const newEntry = { pageId, links: { wikipedia: url } };
    if (STAMPY_LINKS[pageId]) newEntry.links.stampy = STAMPY_LINKS[pageId];
    if (ARBITAL_LINKS[pageId]) newEntry.links.arbital = ARBITAL_LINKS[pageId];
    existingLinks.push(newEntry);
    addedCount++;
    console.log(`Added new: ${pageId}`);
  }
}

// Sort and save
existingLinks.sort((a, b) => a.pageId.localeCompare(b.pageId));

const yamlContent = `# External Links Mapping
# Maps page entity IDs to their corresponding pages on external platforms
#
# Supported platforms:
#   - wikipedia: Wikipedia article URL
#   - wikidata: Wikidata item URL
#   - lesswrong: LessWrong tag/wiki URL
#   - alignmentForum: Alignment Forum wiki URL
#   - eaForum: EA Forum topic URL
#   - stampy: AISafety.info / Stampy article URL
#   - arbital: Arbital (GreaterWrong) page URL
#
# Generated: ${new Date().toISOString()}
# Total entries: ${existingLinks.length}

${yaml.dump(existingLinks, { lineWidth: 120, noRefs: true })}`;

fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);

console.log(`\nUpdated ${updatedCount} existing entries`);
console.log(`Added ${addedCount} new entries`);
console.log(`Total entries: ${existingLinks.length}`);
