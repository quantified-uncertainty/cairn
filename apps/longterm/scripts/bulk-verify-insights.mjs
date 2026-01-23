#!/usr/bin/env node
/**
 * Bulk Verify Insights
 *
 * Adds lastVerified dates to all insights that don't have one.
 *
 * Usage:
 *   node scripts/bulk-verify-insights.mjs --dry-run    # Preview changes
 *   node scripts/bulk-verify-insights.mjs --apply      # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSIGHTS_PATH = path.join(__dirname, '../src/data/insights.yaml');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apply = args.includes('--apply');

if (!dryRun && !apply) {
  console.log('Usage: node scripts/bulk-verify-insights.mjs [--dry-run | --apply]');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];
console.log(`\n📅 Verification date: ${today}`);
console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}\n`);

// Read the YAML file
let content = fs.readFileSync(INSIGHTS_PATH, 'utf-8');

// Count insights
const insightMatches = content.match(/- id: "/g);
const totalInsights = insightMatches ? insightMatches.length : 0;
console.log(`📊 Found ${totalInsights} insights`);

// Count insights that already have lastVerified
const alreadyVerified = (content.match(/lastVerified:/g) || []).length;
console.log(`   Already verified: ${alreadyVerified}`);
console.log(`   Need verification: ${totalInsights - alreadyVerified}`);

if (alreadyVerified === totalInsights) {
  console.log('\n✅ All insights already have lastVerified dates!');
  process.exit(0);
}

// Add lastVerified after each "added:" line that doesn't already have it
// This regex matches "added: ..." lines not followed by "lastVerified:"
const updatedContent = content.replace(
  /(added: "[\d-]+")\n(\n|\s+- id:|\s+#|\s+[a-z]+:(?!lastVerified))/g,
  (match, addedLine, nextLine) => {
    // Check if next line is lastVerified - if so, don't modify
    if (nextLine.includes('lastVerified:')) {
      return match;
    }
    return `${addedLine}\n    lastVerified: "${today}"\n${nextLine}`;
  }
);

// More robust approach: process line by line
const lines = content.split('\n');
const newLines = [];
let addedLastVerified = 0;

for (let i = 0; i < lines.length; i++) {
  newLines.push(lines[i]);

  // If this line is "added:" and next line isn't "lastVerified:", add it
  if (lines[i].match(/^\s+added: "[\d-]+"$/)) {
    const nextLine = lines[i + 1] || '';
    if (!nextLine.match(/^\s+lastVerified:/)) {
      // Extract indentation from current line
      const indent = lines[i].match(/^(\s+)/)?.[1] || '    ';
      newLines.push(`${indent}lastVerified: "${today}"`);
      addedLastVerified++;
    }
  }
}

const finalContent = newLines.join('\n');

console.log(`\n📝 Would add lastVerified to ${addedLastVerified} insights`);

if (apply) {
  fs.writeFileSync(INSIGHTS_PATH, finalContent, 'utf-8');
  console.log(`\n✅ Updated ${INSIGHTS_PATH}`);
  console.log(`   Added lastVerified: "${today}" to ${addedLastVerified} insights`);
} else {
  console.log('\n🔍 Dry run complete. Run with --apply to make changes.');

  // Show a sample of what would be added
  console.log('\nSample change:');
  const sampleIdx = finalContent.indexOf('lastVerified: "2026');
  if (sampleIdx > 0) {
    const contextStart = Math.max(0, sampleIdx - 100);
    const contextEnd = Math.min(finalContent.length, sampleIdx + 100);
    console.log('...' + finalContent.slice(contextStart, contextEnd) + '...');
  }
}
