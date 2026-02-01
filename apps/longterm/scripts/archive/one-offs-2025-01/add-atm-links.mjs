#!/usr/bin/env node
/**
 * Add External Links for AI Transition Model Pages
 *
 * Adds relevant external links for ATM pages that are missing them.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

// Manual mappings for ATM pages
const ATM_LINKS = {
  // Outcomes
  'existential-catastrophe': {
    wikipedia: 'https://en.wikipedia.org/wiki/Global_catastrophic_risk',
    lesswrong: 'https://www.lesswrong.com/tag/existential-risk',
    stampy: 'https://aisafety.info/questions/8mTg/What-is-existential-risk',
  },
  'long-term-trajectory': {
    lesswrong: 'https://www.lesswrong.com/tag/the-long-run-future',
    eaForum: 'https://forum.effectivealtruism.org/topics/longtermism',
  },

  // Factors - AI Capabilities
  'adoption': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-diffusion',
  },
  'compute': {
    lesswrong: 'https://www.lesswrong.com/tag/compute-governance',
    eaForum: 'https://forum.effectivealtruism.org/topics/compute-governance',
  },
  'algorithms': {
    wikipedia: 'https://en.wikipedia.org/wiki/Machine_learning',
  },

  // Factors - AI Ownership
  'companies': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-labs',
  },
  'countries': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-nationalism',
  },

  // Factors - AI Uses
  'governments': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-governance',
  },
  'industries': {
    wikipedia: 'https://en.wikipedia.org/wiki/Applications_of_artificial_intelligence',
  },
  'recursive-ai-capabilities': {
    lesswrong: 'https://www.lesswrong.com/tag/recursive-self-improvement',
    stampy: 'https://aisafety.info/questions/6268/What-is-an-intelligence-explosion',
  },
  'coordination': {
    eaForum: 'https://forum.effectivealtruism.org/topics/international-ai-governance',
  },

  // Factors - Civilizational Competence
  'epistemics': {
    lesswrong: 'https://www.lesswrong.com/tag/rationality',
    eaForum: 'https://forum.effectivealtruism.org/topics/epistemics',
  },
  'governance': {
    eaForum: 'https://forum.effectivealtruism.org/topics/improving-institutional-decision-making',
  },
  'adaptability': {
    eaForum: 'https://forum.effectivealtruism.org/topics/resilience',
  },

  // Factors - Misalignment Potential
  'technical-ai-safety': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-safety-research',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-safety-research',
    stampy: 'https://aisafety.info/questions/9Tii/What-is-AI-alignment',
  },
  'lab-safety-practices': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-lab-safety',
  },
  'ai-governance': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-governance',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-governance',
  },

  // Factors - Misuse Potential
  'biological-threat-exposure': {
    wikipedia: 'https://en.wikipedia.org/wiki/Biological_warfare',
    eaForum: 'https://forum.effectivealtruism.org/topics/biosecurity',
  },
  'cyber-threat-exposure': {
    wikipedia: 'https://en.wikipedia.org/wiki/Cyberwarfare',
    eaForum: 'https://forum.effectivealtruism.org/topics/cybersecurity',
  },

  // Factors - Transition Turbulence
  'economic-stability': {
    eaForum: 'https://forum.effectivealtruism.org/topics/economic-growth',
  },
  'racing-intensity': {
    lesswrong: 'https://www.lesswrong.com/tag/racing-through-a-danger-zone',
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-arms-race',
  },

  // Scenarios
  'misaligned-takeover': {
    lesswrong: 'https://www.lesswrong.com/tag/ai-takeover',
    stampy: 'https://aisafety.info/questions/8mTg/What-is-existential-risk',
  },
  'state-actor': {
    eaForum: 'https://forum.effectivealtruism.org/topics/great-power-conflict',
  },
  'rogue-actor': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-misuse',
  },
  'aligned-good': {
    eaForum: 'https://forum.effectivealtruism.org/topics/transformative-ai',
  },

  // Parameters
  'coordination-capacity': {
    eaForum: 'https://forum.effectivealtruism.org/topics/international-ai-governance',
  },
  'human-expertise': {
    eaForum: 'https://forum.effectivealtruism.org/topics/expertise',
  },
  'safety-capability-gap': {
    lesswrong: 'https://www.lesswrong.com/tag/differential-progress',
    eaForum: 'https://forum.effectivealtruism.org/topics/differential-progress',
  },
  'safety-culture-strength': {
    eaForum: 'https://forum.effectivealtruism.org/topics/ai-lab-safety',
  },

  // Takeoff
  'gradual': {
    lesswrong: 'https://www.lesswrong.com/tag/soft-takeoff',
  },
  'rapid': {
    lesswrong: 'https://www.lesswrong.com/tag/hard-takeoff',
    stampy: 'https://aisafety.info/questions/6268/What-is-an-intelligence-explosion',
  },
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e]));

let updatedCount = 0;
let addedCount = 0;

// Update existing entries or add new ones
for (const [pageId, links] of Object.entries(ATM_LINKS)) {
  if (existingMap.has(pageId)) {
    const entry = existingMap.get(pageId);
    let updated = false;
    for (const [platform, url] of Object.entries(links)) {
      if (!entry.links[platform]) {
        entry.links[platform] = url;
        updated = true;
      }
    }
    if (updated) {
      updatedCount++;
      console.log(`Updated: ${pageId}`);
    }
  } else {
    existingLinks.push({ pageId, links });
    addedCount++;
    console.log(`Added: ${pageId}`);
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
