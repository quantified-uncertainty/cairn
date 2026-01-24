#!/usr/bin/env node
/**
 * Remove placeholder links from template files
 *
 * Removes lines like:
 * - [Risk 1](/knowledge-base/risks/...) - [How it helps]
 * - [Response 1](/knowledge-base/responses/...) - [How it helps]
 *
 * These are template placeholders that should be filled in or removed.
 *
 * Usage:
 *   node scripts/remove-placeholder-links.mjs --dry-run
 *   node scripts/remove-placeholder-links.mjs --apply
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CONTENT_DIR = 'src/content/docs';
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/remove-placeholder-links.mjs --dry-run  # Preview');
  console.log('  node scripts/remove-placeholder-links.mjs --apply    # Apply');
  process.exit(1);
}

// Patterns to remove - these are placeholder lines
const placeholderPatterns = [
  /^- \[Risk \d+\]\(\/knowledge-base\/risks\/\.\.\.\).*$/gm,
  /^- \[Response \d+\]\(\/knowledge-base\/responses\/\.\.\.\).*$/gm,
  /^- \[Intervention \d+\]\(\/knowledge-base\/responses\/\.\.\.\).*$/gm,
  /^- \[Related \d+\]\(\/knowledge-base\/.*\/\.\.\.\).*$/gm,
];

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

let totalRemoved = 0;
const changedFiles = [];

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  let removedInFile = 0;

  for (const pattern of placeholderPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      removedInFile += matches.length;
      content = content.replace(pattern, '');
    }
  }

  // Also remove any resulting empty bullet sections
  // (section heading followed by only blank lines until next section)
  content = content.replace(/\n(#+\s+(?:Risks Addressed|Related (?:Risks|Interventions|Responses)))\n+(?=\n#|\n---|\n\n\n|$)/gi, '');

  // Clean up multiple consecutive blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== originalContent) {
    changedFiles.push({ path: filePath, removed: removedInFile });
    totalRemoved += removedInFile;

    if (apply) {
      writeFileSync(filePath, content);
    }
  }
}

// Output results
console.log(`Found ${totalRemoved} placeholder links in ${changedFiles.length} files:\n`);

for (const { path, removed } of changedFiles) {
  const relativePath = path.replace(CONTENT_DIR + '/', '');
  console.log(`  ${relativePath}: ${removed} placeholders`);
}

if (dryRun) {
  console.log('\n=== DRY RUN - No changes made ===');
} else if (apply) {
  console.log(`\n✓ Removed ${totalRemoved} placeholders from ${changedFiles.length} files`);
}
