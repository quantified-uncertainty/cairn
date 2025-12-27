#!/usr/bin/env node

/**
 * Apply Summary Updates
 *
 * Reads summary-updates.json and applies to MDX frontmatter.
 * Usage: node scripts/apply-summaries.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';

const MODELS_DIR = 'src/content/docs/knowledge-base/models';
const UPDATES_FILE = 'scripts/summary-updates.json';

function findModelFiles(dir) {
  const results = [];
  for (const file of readdirSync(dir)) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) results.push(...findModelFiles(filePath));
    else if (file.endsWith('.mdx') && file !== 'index.mdx') results.push(filePath);
  }
  return results;
}

function findFileById(id) {
  const files = findModelFiles(MODELS_DIR);
  return files.find(f => basename(f, '.mdx') === id);
}

function updateDescription(content, newDesc) {
  // Handle both quoted and unquoted descriptions
  return content.replace(
    /^(---\n[\s\S]*?)(description:\s*)(["']?)([^\n]*(?:\n(?!---|\w+:)[^\n]*)*)(["']?)(\n[\s\S]*?---)$/m,
    (match, pre, key, q1, oldDesc, q2, post) => {
      const escaped = newDesc.replace(/"/g, '\\"');
      return `${pre}${key}"${escaped}"${post}`;
    }
  );
}

// Main
if (!existsSync(UPDATES_FILE)) {
  console.error('No updates file found:', UPDATES_FILE);
  process.exit(1);
}

const updates = JSON.parse(readFileSync(UPDATES_FILE, 'utf-8'));
let count = 0;

for (const [id, newDesc] of Object.entries(updates)) {
  const file = findFileById(id);
  if (!file) {
    console.log(`⚠ Not found: ${id}`);
    continue;
  }

  const content = readFileSync(file, 'utf-8');
  const updated = updateDescription(content, newDesc);

  if (updated !== content) {
    writeFileSync(file, updated);
    console.log(`✓ ${id}`);
    count++;
  } else {
    console.log(`- ${id} (no change)`);
  }
}

console.log(`\nUpdated ${count} files`);
console.log('Run: npm run sync:descriptions && npm run build:data');
