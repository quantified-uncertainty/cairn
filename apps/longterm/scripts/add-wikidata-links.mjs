#!/usr/bin/env node
/**
 * Add Wikidata Links
 *
 * Adds Wikidata Q-item URLs to external-links.yaml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

// Wikidata Q-items mapped to page IDs
const WIKIDATA_LINKS = {
  // Core AI Safety concepts
  'alignment': 'Q24882728',
  'ai-alignment': 'Q24882728',
  'ai-safety': 'Q116291231',
  'existential-risk': 'Q746242',
  'superintelligence': 'Q769620',
  'agi': 'Q192551',
  'artificial-general-intelligence': 'Q192551',

  // Technical concepts
  'reward-hacking': 'Q113660963',
  'mesa-optimization': 'Q113661065',
  'interpretability': 'Q117328686',
  'mech-interp': 'Q117328686',
  'mechanistic-interpretability': 'Q117328686',
  'rlhf': 'Q113660894',
  'deep-learning': 'Q197536',
  'neural-networks': 'Q192776',
  'transformers': 'Q105688554',
  'machine-learning': 'Q2539',

  // Organizations
  'openai': 'Q21708200',
  'anthropic': 'Q107715915',
  'deepmind': 'Q15733006',
  'miri': 'Q6721918',
  'fhi': 'Q5765389',
  'chai': 'Q85751153',
  'cais': 'Q119084607',
  'redwood-research': 'Q113661009',

  // People
  'nick-bostrom': 'Q460475',
  'stuart-russell': 'Q3504066',
  'eliezer-yudkowsky': 'Q984915',
  'dario-amodei': 'Q98602847',
  'sam-altman': 'Q24871854',
  'ilya-sutskever': 'Q28226767',
  'demis-hassabis': 'Q15982125',
  'jan-leike': 'Q117346571',
  'paul-christiano': 'Q113661095',
  'toby-ord': 'Q16866889',
  'max-tegmark': 'Q706546',
  'yoshua-bengio': 'Q4932443',
  'geoffrey-hinton': 'Q555680',

  // Books and papers
  'superintelligence-book': 'Q18386449',
  'the-precipice': 'Q87064138',
  'human-compatible': 'Q83538364',

  // Governance
  'eu-ai-act': 'Q107409849',
  'sb-1047': 'Q127393140',

  // Other concepts
  'effective-altruism': 'Q15078454',
  'longtermism': 'Q85800893',
  'x-risk': 'Q746242',
  'catastrophic-risk': 'Q1026695',
  'brain-computer-interfaces': 'Q464310',
  'whole-brain-emulation': 'Q1074059',
  'mind-uploading': 'Q1074059',
  'prediction-markets': 'Q1814760',
  'game-theory': 'Q11417',
  'decision-theory': 'Q626821',
  'multi-agent': 'Q1925963',
  'collective-intelligence': 'Q846347',

  // AI capabilities
  'ai-takeover': 'Q266495',
  'technological-singularity': 'Q193794',
  'intelligence-explosion': 'Q193794',

  // Safety techniques
  'constitutional-ai': 'Q113660990',

  // Risks
  'disinformation': 'Q7242',
  'deepfakes': 'Q36509522',
  'surveillance': 'Q334401',
  'mass-surveillance': 'Q333971',
  'autonomous-weapons': 'Q1142270',
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e]));

let updatedCount = 0;
let addedCount = 0;

// Update existing entries with Wikidata links
for (const entry of existingLinks) {
  const pageId = entry.pageId;

  if (!entry.links.wikidata && WIKIDATA_LINKS[pageId]) {
    entry.links.wikidata = `https://www.wikidata.org/wiki/Q${WIKIDATA_LINKS[pageId].replace('Q', '')}`;
    updatedCount++;
    console.log(`Updated: ${pageId} -> ${entry.links.wikidata}`);
  }
}

// Add new entries if they don't exist
for (const [pageId, qid] of Object.entries(WIKIDATA_LINKS)) {
  if (!existingMap.has(pageId)) {
    const newEntry = {
      pageId,
      links: {
        wikidata: `https://www.wikidata.org/wiki/Q${qid.replace('Q', '')}`
      }
    };
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

console.log(`\nUpdated ${updatedCount} existing entries with Wikidata`);
console.log(`Added ${addedCount} new entries`);
console.log(`Total entries: ${existingLinks.length}`);
