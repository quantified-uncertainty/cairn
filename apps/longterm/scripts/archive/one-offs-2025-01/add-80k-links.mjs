#!/usr/bin/env node
/**
 * Add 80,000 Hours Links
 *
 * Maps 80,000 Hours problem profiles, career reviews, and articles to our pages.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EXTERNAL_LINKS_PATH = path.join(ROOT, 'src/data/external-links.yaml');

// 80,000 Hours URLs mapped to our page IDs
const EIGHTY_K_LINKS = {
  // AI Safety / Alignment
  'ai-safety': 'https://80000hours.org/problem-profiles/artificial-intelligence/',
  'ai-alignment': 'https://80000hours.org/problem-profiles/artificial-intelligence/',
  'alignment': 'https://80000hours.org/problem-profiles/artificial-intelligence/',
  'technical-ai-safety': 'https://80000hours.org/career-reviews/ai-safety-researcher/',
  'technical-research': 'https://80000hours.org/career-reviews/ai-safety-researcher/',

  // Power-seeking AI / Misalignment
  'power-seeking': 'https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/',
  'ai-takeover': 'https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/',
  'misaligned-takeover': 'https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/',
  'misaligned-catastrophe': 'https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/',
  'instrumental-convergence': 'https://80000hours.org/problem-profiles/risks-from-power-seeking-ai/',

  // AI Governance
  'ai-governance': 'https://80000hours.org/career-reviews/ai-policy-and-strategy/',
  'governance': 'https://80000hours.org/career-reviews/ai-policy-and-strategy/',

  // Concentration of Power
  'concentration-of-power': 'https://80000hours.org/problem-profiles/extreme-power-concentration/',
  'lock-in': 'https://80000hours.org/problem-profiles/extreme-power-concentration/',
  'political-power': 'https://80000hours.org/problem-profiles/extreme-power-concentration/',
  'authoritarian-takeover': 'https://80000hours.org/problem-profiles/extreme-power-concentration/',

  // Totalitarianism
  'authoritarian-tools': 'https://80000hours.org/problem-profiles/risks-of-stable-totalitarianism/',
  'surveillance': 'https://80000hours.org/problem-profiles/risks-of-stable-totalitarianism/',

  // Gradual Disempowerment
  'enfeeblement': 'https://80000hours.org/problem-profiles/gradual-disempowerment/',
  'human-expertise': 'https://80000hours.org/problem-profiles/gradual-disempowerment/',
  'expertise-atrophy': 'https://80000hours.org/problem-profiles/gradual-disempowerment/',
  'learned-helplessness': 'https://80000hours.org/problem-profiles/gradual-disempowerment/',

  // AI Misuse
  'misuse': 'https://80000hours.org/problem-profiles/catastrophic-ai-misuse/',
  'misuse-risks': 'https://80000hours.org/problem-profiles/catastrophic-ai-misuse/',
  'rogue-actor': 'https://80000hours.org/problem-profiles/catastrophic-ai-misuse/',

  // Bioweapons / Pandemics
  'bioweapons': 'https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/',
  'biological-threat-exposure': 'https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/',
  'biosecurity': 'https://80000hours.org/problem-profiles/preventing-catastrophic-pandemics/',

  // Cybersecurity
  'cyber-threat-exposure': 'https://80000hours.org/career-reviews/information-security/',
  'cybersecurity': 'https://80000hours.org/career-reviews/information-security/',

  // Nuclear
  'nuclear-risk': 'https://80000hours.org/problem-profiles/nuclear-security/',

  // Great Power Conflict
  'great-power-conflict': 'https://80000hours.org/problem-profiles/great-power-conflict/',
  'state-actor': 'https://80000hours.org/problem-profiles/great-power-conflict/',
  'geopolitics': 'https://80000hours.org/problem-profiles/great-power-conflict/',

  // S-risks
  's-risk': 'https://80000hours.org/problem-profiles/s-risks/',
  'suffering-lock-in': 'https://80000hours.org/problem-profiles/s-risks/',

  // Digital Minds
  'digital-minds': 'https://80000hours.org/problem-profiles/moral-status-digital-minds/',
  'moral-patienthood': 'https://80000hours.org/problem-profiles/moral-status-digital-minds/',

  // Existential Risk
  'existential-risk': 'https://80000hours.org/articles/existential-risks/',
  'x-risk': 'https://80000hours.org/articles/existential-risks/',
  'existential-catastrophe': 'https://80000hours.org/articles/existential-risks/',
  'catastrophic-risk': 'https://80000hours.org/articles/existential-risks/',

  // Longtermism
  'longtermism': 'https://80000hours.org/articles/future-generations/',
  'long-term-trajectory': 'https://80000hours.org/articles/future-generations/',

  // Whole Brain Emulation
  'whole-brain-emulation': 'https://80000hours.org/problem-profiles/whole-brain-emulation/',
  'mind-uploading': 'https://80000hours.org/problem-profiles/whole-brain-emulation/',

  // Civilizational Resilience
  'civilizational-resilience': 'https://80000hours.org/problem-profiles/civilisation-resilience/',
  'adaptability': 'https://80000hours.org/problem-profiles/civilisation-resilience/',

  // Malevolent Actors
  'malevolent-actors': 'https://80000hours.org/problem-profiles/risks-from-malevolent-actors/',

  // AI Hardware
  'compute': 'https://80000hours.org/career-reviews/become-an-expert-in-ai-hardware/',
  'compute-governance': 'https://80000hours.org/career-reviews/become-an-expert-in-ai-hardware/',

  // Working at AI Labs
  'lab-culture': 'https://80000hours.org/career-reviews/working-at-an-ai-lab/',
  'lab-behavior': 'https://80000hours.org/career-reviews/working-at-an-ai-lab/',

  // Space Governance
  'space-governance': 'https://80000hours.org/problem-profiles/space-governance/',

  // Global Coordination
  'coordination': 'https://80000hours.org/articles/coordination/',
  'international-coordination': 'https://80000hours.org/articles/coordination/',

  // Decision Making
  'decision-theory': 'https://80000hours.org/problem-profiles/ai-enhanced-decision-making/',
  'epistemics': 'https://80000hours.org/2020/09/good-judgement/',
};

// Load current links
const existingLinks = yaml.load(fs.readFileSync(EXTERNAL_LINKS_PATH, 'utf-8'));
const existingMap = new Map(existingLinks.map(e => [e.pageId, e]));

let updatedCount = 0;
let addedCount = 0;

// Update existing entries or add new ones
for (const [pageId, url] of Object.entries(EIGHTY_K_LINKS)) {
  if (existingMap.has(pageId)) {
    const entry = existingMap.get(pageId);
    if (!entry.links.eightyK) {
      entry.links.eightyK = url;
      updatedCount++;
      console.log(`Updated: ${pageId}`);
    }
  } else {
    const newEntry = { pageId, links: { eightyK: url } };
    existingLinks.push(newEntry);
    existingMap.set(pageId, newEntry);
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
#   - eightyK: 80,000 Hours article/problem profile URL
#
# Generated: ${new Date().toISOString()}
# Total entries: ${existingLinks.length}

${yaml.dump(existingLinks, { lineWidth: 120, noRefs: true })}`;

fs.writeFileSync(EXTERNAL_LINKS_PATH, yamlContent);

console.log(`\nUpdated ${updatedCount} existing entries`);
console.log(`Added ${addedCount} new entries`);
console.log(`Total entries: ${existingLinks.length}`);
