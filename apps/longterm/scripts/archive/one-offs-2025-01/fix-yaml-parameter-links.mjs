#!/usr/bin/env node
/**
 * Fix broken /parameters/ links in AI Transition Model YAML markdown content
 *
 * These links embedded in markdown descriptions should point to the correct
 * /factors/[parent]/[subitem]/ paths.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const ENTITIES_DIR = 'src/data/entities';
const dryRun = !process.argv.includes('--apply');

// Mapping from parameter slug to correct factor path
const PATH_MAPPINGS = {
  // Misalignment Potential sub-items
  'alignment-robustness': '/ai-transition-model/factors/misalignment-potential/alignment-robustness/',
  'safety-capability-gap': '/ai-transition-model/factors/misalignment-potential/safety-capability-gap/',
  'interpretability-coverage': '/ai-transition-model/factors/misalignment-potential/interpretability-coverage/',
  'human-oversight-quality': '/ai-transition-model/factors/misalignment-potential/human-oversight-quality/',
  'safety-culture-strength': '/ai-transition-model/factors/misalignment-potential/safety-culture-strength/',

  // Misuse Potential sub-items
  'biological-threat-exposure': '/ai-transition-model/factors/misuse-potential/biological-threat-exposure/',
  'cyber-threat-exposure': '/ai-transition-model/factors/misuse-potential/cyber-threat-exposure/',
  'robot-threat-exposure': '/ai-transition-model/factors/misuse-potential/robot-threat-exposure/',
  'surprise-threat-exposure': '/ai-transition-model/factors/misuse-potential/surprise-threat-exposure/',

  // Transition Turbulence sub-items
  'racing-intensity': '/ai-transition-model/factors/transition-turbulence/racing-intensity/',
  'economic-stability': '/ai-transition-model/factors/transition-turbulence/economic-stability/',

  // Civilizational Competence - top level sub-items
  'adaptability': '/ai-transition-model/factors/civilizational-competence/adaptability/',
  'epistemics': '/ai-transition-model/factors/civilizational-competence/epistemics/',
  'governance': '/ai-transition-model/factors/civilizational-competence/governance/',

  // Under Adaptability
  'societal-resilience': '/ai-transition-model/factors/civilizational-competence/societal-resilience/',
  'human-expertise': '/ai-transition-model/factors/civilizational-competence/human-expertise/',
  'human-agency': '/ai-transition-model/factors/civilizational-competence/human-agency/',

  // Under Epistemics
  'epistemic-health': '/ai-transition-model/factors/civilizational-competence/epistemic-health/',
  'information-authenticity': '/ai-transition-model/factors/civilizational-competence/information-authenticity/',
  'reality-coherence': '/ai-transition-model/factors/civilizational-competence/reality-coherence/',
  'societal-trust': '/ai-transition-model/factors/civilizational-competence/societal-trust/',
  'preference-authenticity': '/ai-transition-model/factors/civilizational-competence/preference-authenticity/',

  // Under Governance
  'regulatory-capacity': '/ai-transition-model/factors/civilizational-competence/regulatory-capacity/',
  'institutional-quality': '/ai-transition-model/factors/civilizational-competence/institutional-quality/',
  'international-coordination': '/ai-transition-model/factors/civilizational-competence/international-coordination/',
  'coordination-capacity': '/ai-transition-model/factors/civilizational-competence/coordination-capacity/',
  'ai-control-concentration': '/ai-transition-model/factors/civilizational-competence/ai-control-concentration/',
};

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fixCount = 0;

  // Find and replace all /parameters/ links
  for (const [slug, correctPath] of Object.entries(PATH_MAPPINGS)) {
    const wrongPath = `/ai-transition-model/parameters/${slug}/`;
    if (content.includes(wrongPath)) {
      const count = (content.match(new RegExp(wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      content = content.replaceAll(wrongPath, correctPath);
      fixCount += count;
    }
  }

  if (fixCount > 0) {
    if (dryRun) {
      console.log(`Would fix ${fixCount} links in ${filePath}`);
    } else {
      writeFileSync(filePath, content);
      console.log(`Fixed ${fixCount} links in ${filePath}`);
    }
  }

  return fixCount;
}

// Also fix path: definitions in entity files
function fixPathDefinitions(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let fixCount = 0;

  for (const [slug, correctPath] of Object.entries(PATH_MAPPINGS)) {
    const wrongPathDef = `path: "/ai-transition-model/parameters/${slug}/"`;
    const correctPathDef = `path: "${correctPath}"`;

    if (content.includes(wrongPathDef)) {
      content = content.replaceAll(wrongPathDef, correctPathDef);
      fixCount++;
      console.log(`${dryRun ? 'Would fix' : 'Fixed'} path definition: ${slug}`);
    }
  }

  if (fixCount > 0 && !dryRun) {
    writeFileSync(filePath, content);
  }

  return fixCount;
}

console.log(dryRun ? 'DRY RUN - Use --apply to make changes\n' : 'Applying changes...\n');

// Process all YAML files in entities directory
const files = readdirSync(ENTITIES_DIR).filter(f => f.endsWith('.yaml'));
let totalLinks = 0;
let totalPaths = 0;

for (const file of files) {
  const filePath = join(ENTITIES_DIR, file);
  totalLinks += fixFile(filePath);
  totalPaths += fixPathDefinitions(filePath);
}

console.log(`\nSummary:`);
console.log(`  ${totalLinks} markdown links ${dryRun ? 'would be' : ''} fixed`);
console.log(`  ${totalPaths} path definitions ${dryRun ? 'would be' : ''} fixed`);
