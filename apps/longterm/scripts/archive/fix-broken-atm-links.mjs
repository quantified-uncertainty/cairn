#!/usr/bin/env node
/**
 * Fix broken AI Transition Model links
 *
 * This script updates links from the old path structure to the new one:
 * - /ai-transition-model/factors/{category}/{parameter}/ → /ai-transition-model/parameters/{parameter}
 * - /ai-transition-model/timelines/ → /knowledge-base/forecasting/agi-timeline
 * - /ai-transition-model/takeoff/ → /ai-transition-model (or remove)
 * - /ai-transition-model/coordination/ → /ai-transition-model/parameters/international-coordination
 *
 * Usage:
 *   node scripts/fix-broken-atm-links.mjs --dry-run
 *   node scripts/fix-broken-atm-links.mjs --apply
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CONTENT_DIR = 'src/content/docs';
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/fix-broken-atm-links.mjs --dry-run  # Preview');
  console.log('  node scripts/fix-broken-atm-links.mjs --apply    # Apply');
  process.exit(1);
}

// Mapping of broken paths to correct paths
const pathMappings = {
  // Factor sub-pages that moved to parameters
  '/ai-transition-model/factors/misalignment-potential/interpretability-coverage/': '/ai-transition-model/parameters/interpretability-coverage',
  '/ai-transition-model/factors/misalignment-potential/alignment-robustness/': '/ai-transition-model/parameters/alignment-robustness',
  '/ai-transition-model/factors/misalignment-potential/human-oversight-quality/': '/ai-transition-model/parameters/human-oversight-quality',
  '/ai-transition-model/factors/misalignment-potential/safety-capability-gap/': '/ai-transition-model/parameters/safety-capability-gap',
  '/ai-transition-model/factors/misalignment-potential/safety-culture-strength/': '/ai-transition-model/parameters/safety-culture-strength',
  '/ai-transition-model/factors/civilizational-competence/human-expertise/': '/ai-transition-model/parameters/human-expertise',
  '/ai-transition-model/factors/civilizational-competence/human-agency/': '/ai-transition-model/parameters/human-agency',
  '/ai-transition-model/factors/civilizational-competence/epistemic-health/': '/ai-transition-model/parameters/epistemic-health',
  '/ai-transition-model/factors/civilizational-competence/preference-authenticity/': '/ai-transition-model/parameters/preference-authenticity',
  '/ai-transition-model/factors/civilizational-competence/societal-trust/': '/ai-transition-model/parameters/societal-trust',
  '/ai-transition-model/factors/civilizational-competence/information-authenticity/': '/ai-transition-model/parameters/information-authenticity',
  '/ai-transition-model/factors/civilizational-competence/reality-coherence/': '/ai-transition-model/parameters/reality-coherence',
  '/ai-transition-model/factors/civilizational-competence/institutional-quality/': '/ai-transition-model/parameters/institutional-quality',
  '/ai-transition-model/factors/civilizational-competence/societal-resilience/': '/ai-transition-model/parameters/societal-resilience',
  '/ai-transition-model/factors/civilizational-competence/regulatory-capacity/': '/ai-transition-model/parameters/regulatory-capacity',
  '/ai-transition-model/factors/civilizational-competence/coordination-capacity/': '/ai-transition-model/parameters/coordination-capacity',
  '/ai-transition-model/factors/civilizational-competence/international-coordination/': '/ai-transition-model/parameters/international-coordination',
  '/ai-transition-model/factors/misuse-potential/ai-control-concentration/': '/ai-transition-model/parameters/ai-control-concentration',
  '/ai-transition-model/factors/transition-turbulence/economic-stability/': '/ai-transition-model/parameters/economic-stability',
  '/ai-transition-model/factors/transition-turbulence/racing-intensity/': '/ai-transition-model/parameters/racing-intensity',

  // Top-level broken links
  '/ai-transition-model/timelines/': '/knowledge-base/forecasting/agi-timeline',
  '/ai-transition-model/takeoff/': '/ai-transition-model',
  '/ai-transition-model/coordination/': '/ai-transition-model/parameters/international-coordination',
  '/ai-transition-model/catastrophe/': '/ai-transition-model/outcomes/existential-catastrophe',
  '/ai-transition-model/goal-directedness/': '/knowledge-base/risks/accident/goal-misgeneralization',
};

// Collect all MDX files
function getMdxFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getMdxFiles(fullPath, files);
    } else if (extname(entry) === '.mdx') {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getMdxFiles(CONTENT_DIR);
console.log(`Scanning ${files.length} MDX files...\n`);

let totalFixes = 0;
const fixesByFile = new Map();

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];

  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    // Match markdown links: [text](path)
    const linkRegex = new RegExp(`\\]\\(${escapeRegex(oldPath)}\\)`, 'g');
    if (linkRegex.test(content)) {
      content = content.replace(linkRegex, `](${newPath})`);
      fixes.push({ from: oldPath, to: newPath });
      modified = true;
    }
  }

  if (modified) {
    fixesByFile.set(filePath, fixes);
    totalFixes += fixes.length;

    if (apply) {
      writeFileSync(filePath, content);
    }
  }
}

// Output results
console.log(`Found ${totalFixes} links to fix in ${fixesByFile.size} files:\n`);

for (const [filePath, fixes] of fixesByFile) {
  const relativePath = filePath.replace(CONTENT_DIR + '/', '');
  console.log(`  ${relativePath}:`);
  for (const fix of fixes) {
    console.log(`    ${fix.from} → ${fix.to}`);
  }
}

if (dryRun) {
  console.log('\n=== DRY RUN - No changes made ===');
} else if (apply) {
  console.log(`\n✓ Fixed ${totalFixes} links in ${fixesByFile.size} files`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
