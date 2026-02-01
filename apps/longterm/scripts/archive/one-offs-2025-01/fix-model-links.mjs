#!/usr/bin/env node
/**
 * Fix broken model links that point to wrong subdirectories
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CONTENT_DIR = 'src/content/docs';
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/fix-model-links.mjs --dry-run');
  console.log('  node scripts/fix-model-links.mjs --apply');
  process.exit(1);
}

// Model path mappings (old → new)
const modelMappings = {
  '/knowledge-base/models/bioweapons-attack-chain/': '/knowledge-base/models/domain-models/bioweapons-attack-chain/',
  '/knowledge-base/models/bioweapons-ai-uplift/': '/knowledge-base/models/domain-models/bioweapons-ai-uplift/',
  '/knowledge-base/models/bioweapons-timeline/': '/knowledge-base/models/timeline-models/bioweapons-timeline/',
  '/knowledge-base/models/capability-alignment-race/': '/knowledge-base/models/race-models/capability-alignment-race/',
  '/knowledge-base/models/sycophancy-feedback-loop/': '/knowledge-base/models/societal-models/sycophancy-feedback-loop/',
};

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
let totalFixes = 0;
const changedFiles = [];

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  const fixes = [];

  for (const [oldPath, newPath] of Object.entries(modelMappings)) {
    if (content.includes(oldPath)) {
      content = content.replaceAll(oldPath, newPath);
      fixes.push({ from: oldPath, to: newPath });
      modified = true;
    }
  }

  if (modified) {
    changedFiles.push({ path: filePath, fixes });
    totalFixes += fixes.length;
    if (apply) {
      writeFileSync(filePath, content);
    }
  }
}

console.log(`Found ${totalFixes} model links to fix in ${changedFiles.length} files:\n`);
for (const { path, fixes } of changedFiles) {
  const rel = path.replace(CONTENT_DIR + '/', '');
  console.log(`  ${rel}:`);
  for (const f of fixes) {
    console.log(`    ${f.from} → ${f.to}`);
  }
}

if (dryRun) {
  console.log('\n=== DRY RUN ===');
} else {
  console.log(`\n✓ Fixed ${totalFixes} links`);
}
