#!/usr/bin/env node

/**
 * Apply Grades from JSON
 *
 * Reads grades-all.json (or specified file) and applies to MDX frontmatter.
 * Updates: importance, quality (if not set), llmSummary, ratings (for models)
 *
 * Usage:
 *   node scripts/apply-grades.mjs                    # Apply all grades
 *   node scripts/apply-grades.mjs --dry-run          # Preview changes
 *   node scripts/apply-grades.mjs --file other.json  # Use different input
 *   node scripts/apply-grades.mjs --only-importance  # Only apply importance
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const CONTENT_DIR = 'src/content/docs';
const DEFAULT_GRADES_FILE = 'grades-all.json';

// Parse args
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : DEFAULT_GRADES_FILE,
  onlyImportance: args.includes('--only-importance'),
  onlyQuality: args.includes('--only-quality'),
  skipExisting: args.includes('--skip-existing'),
};

/**
 * Update frontmatter in a file
 */
function updateFrontmatter(filePath, updates) {
  if (!existsSync(filePath)) {
    return { success: false, reason: 'file not found' };
  }

  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!fmMatch) {
    return { success: false, reason: 'no frontmatter' };
  }

  let fm;
  try {
    fm = parseYaml(fmMatch[1]) || {};
  } catch (e) {
    return { success: false, reason: 'parse error: ' + e.message };
  }

  const changes = [];

  // Apply importance
  if (updates.importance !== undefined) {
    if (!options.skipExisting || fm.importance === undefined) {
      if (fm.importance !== updates.importance) {
        changes.push(`importance: ${fm.importance ?? 'null'} → ${updates.importance}`);
        fm.importance = updates.importance;
      }
    }
  }

  // Apply quality (only if not already set, unless forced)
  if (updates.quality !== undefined && !options.onlyImportance) {
    if (fm.quality === undefined || fm.quality === null) {
      changes.push(`quality: null → ${updates.quality}`);
      fm.quality = updates.quality;
    }
  }

  // Apply llmSummary
  if (updates.llmSummary && !options.onlyImportance && !options.onlyQuality) {
    if (fm.llmSummary !== updates.llmSummary) {
      const preview = updates.llmSummary.slice(0, 50) + '...';
      changes.push(`llmSummary: "${preview}"`);
      fm.llmSummary = updates.llmSummary;
    }
  }

  // Apply ratings for models
  if (updates.ratings && !options.onlyImportance && !options.onlyQuality) {
    if (!fm.ratings) fm.ratings = {};
    for (const [key, value] of Object.entries(updates.ratings)) {
      if (fm.ratings[key] !== value) {
        changes.push(`ratings.${key}: ${fm.ratings[key] ?? 'null'} → ${value}`);
        fm.ratings[key] = value;
      }
    }
  }

  if (changes.length === 0) {
    return { success: true, reason: 'no changes needed', changes: [] };
  }

  if (options.dryRun) {
    return { success: true, reason: 'dry run', changes };
  }

  // Reconstruct file
  const newFm = stringifyYaml(fm);
  const bodyStart = content.indexOf('---', 4) + 4;
  const body = content.slice(bodyStart);
  const newContent = `---\n${newFm}---${body}`;

  writeFileSync(filePath, newContent);
  return { success: true, reason: 'applied', changes };
}

/**
 * Main
 */
function main() {
  console.log('Apply Grades Script');
  console.log('===================\n');

  if (!existsSync(options.file)) {
    console.error(`Error: Grades file not found: ${options.file}`);
    console.error('Run grade-content.mjs first to generate grades.');
    process.exit(1);
  }

  const grades = JSON.parse(readFileSync(options.file, 'utf-8'));
  console.log(`Loaded ${grades.length} grades from ${options.file}`);
  console.log(`Options: ${options.dryRun ? 'DRY RUN, ' : ''}${options.onlyImportance ? 'importance only' : 'all fields'}\n`);

  let applied = 0;
  let skipped = 0;
  let errors = 0;
  let noChanges = 0;

  for (const grade of grades) {
    const filePath = join(CONTENT_DIR, grade.filePath);

    const result = updateFrontmatter(filePath, {
      importance: grade.grades.importance,
      quality: grade.grades.quality,
      llmSummary: grade.grades.llmSummary,
      ratings: grade.grades.ratings,
    });

    if (!result.success) {
      console.log(`✗ ${grade.id}: ${result.reason}`);
      errors++;
    } else if (result.changes.length === 0) {
      noChanges++;
    } else {
      console.log(`✓ ${grade.id}`);
      for (const change of result.changes) {
        console.log(`    ${change}`);
      }
      applied++;
    }
  }

  console.log('\n-------------------');
  console.log(`Applied: ${applied}`);
  console.log(`No changes: ${noChanges}`);
  console.log(`Errors: ${errors}`);

  if (options.dryRun) {
    console.log('\nThis was a dry run. Run without --dry-run to apply changes.');
  }
}

main();
