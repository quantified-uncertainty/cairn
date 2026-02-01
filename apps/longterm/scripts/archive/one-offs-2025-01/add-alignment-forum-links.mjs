#!/usr/bin/env node
/**
 * Add Alignment Forum Links
 *
 * Re-adds Alignment Forum links that were removed due to rate limiting.
 * These are valid URLs that mirror LessWrong's alignment-focused tags.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

// These are known-valid Alignment Forum tags that mirror LessWrong
const AF_LINKS = {
  'agent-foundations': 'https://www.alignmentforum.org/tag/agent-foundations',
  'ai-control': 'https://www.alignmentforum.org/tag/ai-control',
  'corrigibility': 'https://www.alignmentforum.org/tag/corrigibility',
  'debate': 'https://www.alignmentforum.org/tag/debate-ai-safety-technique-1',
  'deceptive-alignment': 'https://www.alignmentforum.org/tag/deceptive-alignment',
  'eliciting-latent-knowledge': 'https://www.alignmentforum.org/tag/eliciting-latent-knowledge',
  'goal-misgeneralization': 'https://www.alignmentforum.org/tag/goal-misgeneralization',
  'inner-alignment': 'https://www.alignmentforum.org/tag/inner-alignment',
  'interpretability': 'https://www.alignmentforum.org/tag/interpretability-ml-and-ai',
  'mesa-optimization': 'https://www.alignmentforum.org/tag/mesa-optimization',
  'outer-alignment': 'https://www.alignmentforum.org/tag/outer-alignment',
  'reward-hacking': 'https://www.alignmentforum.org/tag/reward-hacking',
  'scalable-oversight': 'https://www.alignmentforum.org/tag/scalable-oversight',
  'scheming': 'https://www.alignmentforum.org/tag/scheming',
  'situational-awareness': 'https://www.alignmentforum.org/tag/situational-awareness',
  'value-learning': 'https://www.alignmentforum.org/tag/value-learning',
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e]));

let updatedCount = 0;

// Update existing entries with AF links
for (const entry of existingLinks) {
  const pageId = entry.pageId;

  if (!entry.links.alignmentForum && AF_LINKS[pageId]) {
    entry.links.alignmentForum = AF_LINKS[pageId];
    updatedCount++;
    console.log(`Added AF link: ${pageId}`);
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

console.log(`\nAdded ${updatedCount} Alignment Forum links`);
console.log(`Total entries: ${existingLinks.length}`);
