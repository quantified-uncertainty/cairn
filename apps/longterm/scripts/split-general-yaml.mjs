#!/usr/bin/env node
/**
 * Split general.yaml into multiple files by publication source
 *
 * Groups:
 * - ai-labs.yaml: Major AI labs (Anthropic, OpenAI, DeepMind, Google, Meta)
 * - think-tanks.yaml: Policy think tanks (RAND, Brookings, CSIS, CSET, etc.)
 * - safety-orgs.yaml: AI safety organizations (MIRI, FHI, 80K, etc.)
 * - academic.yaml: Academic sources (Epoch, HAI Stanford, universities)
 * - news-media.yaml: News and media outlets
 * - reference.yaml: Reference materials (Wikipedia, GitHub)
 * - web-other.yaml: Everything else
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse, stringify } from 'yaml';

const RESOURCES_DIR = 'src/data/resources';
const INPUT_FILE = `${RESOURCES_DIR}/general.yaml`;

// Define publication groupings
const GROUPS = {
  'ai-labs': [
    'anthropic', 'openai', 'deepmind', 'google', 'google-scholar',
    'meta', 'microsoft', 'nvidia', 'amazon', 'apple', 'ibm',
    'huggingface', 'cohere', 'stability-ai', 'midjourney',
    'xai', 'inflection', 'character-ai', 'together-ai'
  ],
  'think-tanks': [
    'rand', 'brookings', 'csis', 'cset', 'carnegie', 'cnas',
    'cfr', 'heritage', 'cato', 'aei', 'urban-institute',
    'chatham-house', 'iiss', 'stimson', 'new-america',
    'atlantic-council', 'wilson-center', 'bipartisan-policy'
  ],
  'safety-orgs': [
    'miri', 'fhi', 'fli', 'open-philanthropy', '80k', 'metr',
    'redwood', 'arc', 'conjecture', 'apollo-research',
    'anthropic-interpretability', 'alignment-forum', 'ai-impacts',
    'givewell', 'rethink-priorities', 'center-ai-safety'
  ],
  'academic': [
    'epoch', 'hai-stanford', 'mit', 'berkeley', 'oxford',
    'cambridge', 'cmu', 'princeton', 'yale', 'harvard',
    'nature', 'science', 'sciencedirect', 'arxiv', 'acm',
    'ieee', 'neurips', 'icml', 'iclr', 'aaai'
  ],
  'news-media': [
    'techcrunch', 'mit-tech-review', 'fortune', 'time', 'reuters',
    'pew', 'wired', 'nyt', 'wsj', 'economist', 'guardian',
    'bbc', 'cnn', 'wapo', 'ft', 'bloomberg', 'verge',
    'arstechnica', 'vice', 'vox', 'politico', 'axios'
  ],
  'reference': [
    'wikipedia', 'github', 'stackoverflow', 'docs', 'spec'
  ]
};

// Read and parse input
console.log(`Reading ${INPUT_FILE}...`);
const content = readFileSync(INPUT_FILE, 'utf-8');
const resources = parse(content);

console.log(`Found ${resources.length} resources`);

// Categorize resources
const categorized = {
  'ai-labs': [],
  'think-tanks': [],
  'safety-orgs': [],
  'academic': [],
  'news-media': [],
  'reference': [],
  'web-other': []
};

// Create lookup for fast matching
const pubIdToGroup = new Map();
for (const [group, pubs] of Object.entries(GROUPS)) {
  for (const pub of pubs) {
    pubIdToGroup.set(pub, group);
  }
}

// Categorize each resource
for (const resource of resources) {
  const pubId = resource.publication_id;
  const group = pubIdToGroup.get(pubId) || 'web-other';
  categorized[group].push(resource);
}

// Print stats
console.log('\nCategorization results:');
for (const [group, items] of Object.entries(categorized)) {
  console.log(`  ${group}: ${items.length} resources`);
}

// Write output files
const header = (name, description) => `# ${name}
# ${description}
# Auto-generated from general.yaml - see scripts/split-general-yaml.mjs

`;

const configs = {
  'ai-labs': { name: 'AI Labs', desc: 'Resources from major AI labs and companies' },
  'think-tanks': { name: 'Think Tanks', desc: 'Policy research and think tank publications' },
  'safety-orgs': { name: 'AI Safety Organizations', desc: 'AI safety and EA organization resources' },
  'academic': { name: 'Academic Sources', desc: 'Academic papers, journals, and university research' },
  'news-media': { name: 'News & Media', desc: 'News articles and media coverage' },
  'reference': { name: 'Reference Materials', desc: 'Documentation, wikis, and reference materials' },
  'web-other': { name: 'General Web Resources', desc: 'Other web resources not categorized elsewhere' }
};

console.log('\nWriting output files...');
for (const [group, items] of Object.entries(categorized)) {
  if (items.length === 0) continue;

  const config = configs[group];
  const filename = `${RESOURCES_DIR}/${group}.yaml`;
  const content = header(config.name, config.desc) + stringify(items, { lineWidth: 100 });

  writeFileSync(filename, content);
  console.log(`  Wrote ${filename} (${items.length} items)`);
}

console.log('\nDone! You can now:');
console.log('1. Review the new files');
console.log('2. Delete general.yaml');
console.log('3. Run npm run build:data to verify');
