#!/usr/bin/env node

/**
 * Sync Model Descriptions
 *
 * Reads descriptions from model MDX frontmatter and updates entities.yaml
 * to keep them in sync. Frontmatter is the source of truth.
 *
 * Usage: node scripts/sync-model-descriptions.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const MODELS_DIR = 'src/content/docs/knowledge-base/models';
const ENTITIES_FILE = 'src/data/entities.yaml';
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parseYaml(match[1]);
  } catch {
    return null;
  }
}

/**
 * Get model ID from filename
 */
function getModelId(filename) {
  return basename(filename, '.mdx');
}

/**
 * Find all MDX files in models directory
 */
function findModelFiles(dir) {
  const results = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...findModelFiles(filePath));
    } else if (file.endsWith('.mdx') && file !== 'index.mdx') {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Main sync function
 */
function main() {
  console.log(DRY_RUN ? '🔍 Dry run - no changes will be made\n' : '📝 Syncing model descriptions...\n');

  // Read all model MDX files and extract descriptions
  const modelFiles = findModelFiles(MODELS_DIR);
  const modelDescriptions = new Map();

  for (const file of modelFiles) {
    const content = readFileSync(file, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (frontmatter?.description) {
      const id = getModelId(file);
      modelDescriptions.set(id, frontmatter.description);
    }
  }

  console.log(`Found ${modelDescriptions.size} models with descriptions in MDX files\n`);

  // Read entities.yaml
  const entitiesContent = readFileSync(ENTITIES_FILE, 'utf-8');
  const entities = parseYaml(entitiesContent);

  // Track changes
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  // Update model entities
  for (const entity of entities) {
    if (entity.type !== 'model') continue;

    const mdxDescription = modelDescriptions.get(entity.id);

    if (!mdxDescription) {
      // No MDX file found for this entity
      notFound++;
      continue;
    }

    // Clean descriptions for comparison (remove quotes, trim)
    const cleanMdx = mdxDescription.replace(/^["']|["']$/g, '').trim();
    const cleanEntity = (entity.description || '').trim();

    if (cleanMdx !== cleanEntity) {
      console.log(`📝 ${entity.id}`);
      console.log(`   Old: ${cleanEntity.substring(0, 60)}...`);
      console.log(`   New: ${cleanMdx.substring(0, 60)}...`);
      console.log();

      entity.description = cleanMdx;
      updated++;
    } else {
      skipped++;
    }
  }

  console.log('---');
  console.log(`Updated: ${updated}`);
  console.log(`Already in sync: ${skipped}`);
  console.log(`No MDX file: ${notFound}`);

  // Write back if not dry run
  if (!DRY_RUN && updated > 0) {
    writeFileSync(ENTITIES_FILE, stringifyYaml(entities, { lineWidth: 0 }));
    console.log(`\n✓ Written ${ENTITIES_FILE}`);
  } else if (DRY_RUN && updated > 0) {
    console.log('\n⚠️  Run without --dry-run to apply changes');
  } else {
    console.log('\n✓ All descriptions already in sync');
  }
}

main();
