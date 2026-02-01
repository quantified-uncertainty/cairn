#!/usr/bin/env node
/**
 * Fix missing trailing slashes in internal links
 *
 * Astro/Starlight convention requires trailing slashes on internal URLs.
 * This script finds and fixes links missing the trailing slash.
 *
 * Usage:
 *   node scripts/fix-trailing-slashes.mjs --dry-run  # Preview
 *   node scripts/fix-trailing-slashes.mjs --apply    # Apply fixes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const CONTENT_DIR = 'src/content/docs';
const dryRun = process.argv.includes('--dry-run');
const apply = process.argv.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage:');
  console.log('  node scripts/fix-trailing-slashes.mjs --dry-run  # Preview');
  console.log('  node scripts/fix-trailing-slashes.mjs --apply    # Apply fixes');
  process.exit(1);
}

// Collect all MDX files
function getMdxFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      getMdxFiles(fullPath, files);
    } else if (extname(entry) === '.mdx' || extname(entry) === '.md') {
      files.push(fullPath);
    }
  }
  return files;
}

function needsTrailingSlash(href) {
  // Skip if already has trailing slash
  if (href.endsWith('/')) return false;
  // Skip anchors
  if (href.includes('#')) return false;
  // Skip external URLs
  if (href.startsWith('http://') || href.startsWith('https://')) return false;
  // Skip non-internal paths
  if (!href.startsWith('/')) return false;
  // Skip file extensions
  if (/\.\w{2,4}$/.test(href)) return false;
  // Skip query strings
  if (href.includes('?')) return false;

  return true;
}

const files = getMdxFiles(CONTENT_DIR);
console.log(`Scanning ${files.length} content files...\n`);

let totalFixes = 0;
const changedFiles = [];

// Simple non-greedy link pattern
const linkRegex = /\[([^\]]*?)\]\(([^)]+?)\)/g;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fixesInFile = 0;

  // Track code block state to skip code blocks
  const lines = content.split('\n');
  let inCodeBlock = false;
  const processedLines = [];

  for (const line of lines) {
    if (line.trim().startsWith('```') || line.trim().startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      processedLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      processedLines.push(line);
      continue;
    }

    // Process links in this line
    let processedLine = line;
    let match;
    linkRegex.lastIndex = 0;

    // Find all links and fix them
    const replacements = [];
    while ((match = linkRegex.exec(line)) !== null) {
      const [fullMatch, text, href] = match;
      if (needsTrailingSlash(href)) {
        replacements.push({
          original: fullMatch,
          replacement: `[${text}](${href}/)`
        });
        fixesInFile++;
      }
    }

    // Apply replacements
    for (const { original, replacement } of replacements) {
      processedLine = processedLine.replace(original, replacement);
    }

    processedLines.push(processedLine);
  }

  content = processedLines.join('\n');

  if (content !== originalContent) {
    changedFiles.push({ path: filePath, fixes: fixesInFile });
    totalFixes += fixesInFile;

    if (apply) {
      writeFileSync(filePath, content);
    }
  }
}

// Output results
console.log(`Found ${totalFixes} links needing trailing slashes in ${changedFiles.length} files:\n`);

for (const { path, fixes } of changedFiles.slice(0, 20)) {
  const relativePath = path.replace(CONTENT_DIR + '/', '');
  console.log(`  ${relativePath}: ${fixes} fixes`);
}

if (changedFiles.length > 20) {
  console.log(`  ... and ${changedFiles.length - 20} more files`);
}

if (dryRun) {
  console.log('\n=== DRY RUN - No changes made ===');
} else if (apply) {
  console.log(`\n✓ Fixed ${totalFixes} links in ${changedFiles.length} files`);
}
