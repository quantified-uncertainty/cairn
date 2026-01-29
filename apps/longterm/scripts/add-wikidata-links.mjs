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
// VERIFIED Wikidata Q-items mapped to page IDs
// All IDs verified via Wikidata API - do not modify without verification
const WIKIDATA_LINKS = {
  // Core AI Safety concepts
  'alignment': 'Q24882728',
  'ai-alignment': 'Q24882728',
  'ai-safety': 'Q116291231',
  'existential-risk': 'Q16830153',
  'superintelligence': 'Q1566000',
  'agi': 'Q2264109',
  'artificial-general-intelligence': 'Q2264109',

  // Technical concepts
  'interpretability': 'Q17027399',
  'mech-interp': 'Q134503305',
  'mechanistic-interpretability': 'Q134503305',
  'rlhf': 'Q115570683',
  'deep-learning': 'Q197536',
  'neural-networks': 'Q192776',
  'transformers': 'Q85810444',
  'machine-learning': 'Q2539',

  // Organizations
  'openai': 'Q21708200',
  'anthropic': 'Q116758847',
  'deepmind': 'Q15733006',
  'miri': 'Q2040269',
  'fhi': 'Q5510826',
  'chai': 'Q85751153',
  'cais': 'Q119084607',

  // People
  'nick-bostrom': 'Q460475',
  'stuart-russell': 'Q7627055',
  'eliezer-yudkowsky': 'Q704195',
  'dario-amodei': 'Q103335665',
  'sam-altman': 'Q7407093',
  'ilya-sutskever': 'Q21712134',
  'demis-hassabis': 'Q3022141',
  'jan-leike': 'Q123130693',
  'paul-christiano': 'Q64769299',
  'toby-ord': 'Q7811863',
  'max-tegmark': 'Q2076321',
  'yoshua-bengio': 'Q3572699',
  'geoffrey-hinton': 'Q92894',

  // Books and papers
  'superintelligence-book': 'Q18386449',
  'the-precipice': 'Q4329937',
  'human-compatible': 'Q85767699',

  // Governance
  'eu-ai-act': 'Q108456694',
  'sb-1047': 'Q127393140',

  // Other concepts
  'effective-altruism': 'Q13489381',
  'longtermism': 'Q109311813',
  'x-risk': 'Q21715237',
  'catastrophic-risk': 'Q1531622',
  'brain-computer-interfaces': 'Q897410',
  'whole-brain-emulation': 'Q2267982',
  'mind-uploading': 'Q2267982',
  'game-theory': 'Q44455',
  'decision-theory': 'Q177571',
  'collective-intelligence': 'Q432197',

  // AI capabilities
  'ai-takeover': 'Q2254427',
  'technological-singularity': 'Q237525',
  'intelligence-explosion': 'Q237525',

  // Risks
  'disinformation': 'Q189656',
  'deepfakes': 'Q49473179',
  'surveillance': 'Q334401',
  'mass-surveillance': 'Q1425056',
  'autonomous-weapons': 'Q25378861',
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
