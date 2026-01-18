/**
 * Migrate Tags Script
 *
 * Converts free-text relatedTopics to standardized tags.
 * Object references (with 'id' field) are kept in relatedEntries.
 *
 * Usage: node scripts/migrate-tags.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { parse, stringify } from 'yaml';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENTITIES_FILE = join(ROOT, 'src/data/entities.yaml');

// Map common variations to standardized tags
const TAG_NORMALIZATION = {
  // Core safety concepts
  'ai safety': 'ai-safety',
  'ai alignment': 'alignment',
  'alignment': 'alignment',
  'existential risk': 'x-risk',
  'x-risk': 'x-risk',
  'catastrophic risk': 'x-risk',
  'superintelligence': 'superintelligence',
  'agi': 'agi',

  // Technical approaches
  'rlhf': 'rlhf',
  'reinforcement learning': 'rlhf',
  'interpretability': 'interpretability',
  'mechanistic interpretability': 'interpretability',
  'mech interp': 'interpretability',
  'scalable oversight': 'scalable-oversight',
  'ai control': 'ai-control',
  'corrigibility': 'corrigibility',
  'robustness': 'robustness',
  'constitutional ai': 'constitutional-ai',
  'agent foundations': 'agent-foundations',
  'decision theory': 'decision-theory',
  'verification': 'verification',
  'formal methods': 'formal-methods',
  'capability evaluations': 'evaluations',
  'ai evaluations': 'evaluations',
  'evals': 'evaluations',
  'red teaming': 'red-teaming',

  // Risk types
  'deceptive alignment': 'deception',
  'deception': 'deception',
  'mesa-optimization': 'mesa-optimization',
  'inner alignment': 'inner-alignment',
  'outer alignment': 'outer-alignment',
  'instrumental convergence': 'instrumental-convergence',
  'power-seeking': 'power-seeking',
  'goal misgeneralization': 'goal-misgeneralization',
  'specification gaming': 'specification-gaming',
  'reward hacking': 'reward-hacking',

  // Capabilities
  'agentic ai': 'agentic',
  'autonomous ai': 'agentic',
  'ai agents': 'agentic',
  'tool use': 'tool-use',
  'reasoning': 'reasoning',
  'planning': 'planning',
  'coding': 'coding',
  'persuasion': 'persuasion',
  'situational awareness': 'situational-awareness',

  // Governance
  'ai governance': 'governance',
  'ai policy': 'governance',
  'ai regulation': 'regulation',
  'regulation': 'regulation',
  'international coordination': 'international',
  'international': 'international',
  'compute governance': 'compute-governance',
  'export controls': 'export-controls',
  'responsible scaling': 'responsible-scaling',
  'frontier ai': 'frontier-ai',

  // Content/media
  'deepfakes': 'deepfakes',
  'synthetic media': 'synthetic-media',
  'disinformation': 'disinformation',
  'misinformation': 'disinformation',

  // Infrastructure
  'scaling laws': 'scaling',
  'deep learning': 'deep-learning',
  'transformers': 'transformers',
  'language models': 'llms',
  'llms': 'llms',
  'foundation models': 'foundation-models',

  // Epistemic
  'trust': 'trust',
  'transparency': 'transparency',
  'decision making': 'decision-making',

  // Other
  'security': 'security',
  'compute thresholds': 'compute-thresholds',
  'competition': 'competition',
  'racing': 'racing',
};

/**
 * Normalize a tag to standard form
 */
function normalizeTag(tag) {
  const lower = tag.toLowerCase().trim();

  // Check direct mapping
  if (TAG_NORMALIZATION[lower]) {
    return TAG_NORMALIZATION[lower];
  }

  // Convert to kebab-case
  return lower
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function main() {
  console.log('Migrating tags from relatedTopics...\n');

  // Load entities
  const content = readFileSync(ENTITIES_FILE, 'utf-8');
  const entities = parse(content);

  let migratedCount = 0;
  let tagsAdded = 0;
  const allTags = {};

  for (const entity of entities) {
    if (!entity.relatedTopics || entity.relatedTopics.length === 0) {
      continue;
    }

    const newTags = [];
    const keepTopics = [];

    for (const topic of entity.relatedTopics) {
      // Check if it's an object reference (has 'id' property)
      if (typeof topic === 'object' && topic.id) {
        // Keep object references
        keepTopics.push(topic);
        continue;
      }

      // It's a free-text tag
      if (typeof topic === 'string') {
        const normalized = normalizeTag(topic);
        if (normalized && normalized.length > 1) {
          if (!newTags.includes(normalized)) {
            newTags.push(normalized);
            allTags[normalized] = (allTags[normalized] || 0) + 1;
          }
        }
      }
    }

    if (newTags.length > 0) {
      // Merge with existing tags
      entity.tags = [...new Set([...(entity.tags || []), ...newTags])];
      tagsAdded += newTags.length;
      migratedCount++;
    }

    // Keep only object references in relatedTopics (if any)
    if (keepTopics.length > 0) {
      entity.relatedTopics = keepTopics;
    } else {
      delete entity.relatedTopics;
    }
  }

  // Write back
  const output = stringify(entities, {
    lineWidth: 0,
    singleQuote: true,
  });
  writeFileSync(ENTITIES_FILE, output);

  console.log(`Migrated ${migratedCount} entities`);
  console.log(`Added ${tagsAdded} tags total`);
  console.log('\nTop tags:');
  Object.entries(allTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count}`);
    });
}

main();
