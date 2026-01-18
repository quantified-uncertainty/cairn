#!/usr/bin/env node

/**
 * Cleanup Entities Script
 *
 * Removes invalid entries from entities.yaml:
 * - Duplicate "index" entries (from index.mdx files)
 * - Entries without meaningful IDs
 *
 * Usage: node scripts/cleanup-entities.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const ENTITIES_FILE = 'src/data/entities.yaml';

function main() {
  console.log('🧹 Cleaning up entities.yaml...\n');

  const content = readFileSync(ENTITIES_FILE, 'utf-8');
  const entities = parseYaml(content) || [];

  console.log(`Found ${entities.length} entities`);

  // Filter out invalid entries
  const seenIds = new Set();
  const validEntities = [];
  let removed = 0;

  for (const entity of entities) {
    // Skip entries with ID "index" (from index.mdx files)
    if (entity.id === 'index') {
      console.log(`  Removing: index (type: ${entity.type})`);
      removed++;
      continue;
    }

    // Skip entries missing required fields
    if (!entity.type) {
      console.log(`  Removing (no type): ${entity.id}`);
      removed++;
      continue;
    }

    if (!entity.title) {
      console.log(`  Removing (no title): ${entity.id}`);
      removed++;
      continue;
    }

    // Skip duplicates
    if (seenIds.has(entity.id)) {
      console.log(`  Removing duplicate: ${entity.id}`);
      removed++;
      continue;
    }

    seenIds.add(entity.id);
    validEntities.push(entity);
  }

  console.log(`\nRemoved ${removed} invalid entries`);
  console.log(`Keeping ${validEntities.length} valid entities`);

  // Sort entities by type then ID for organization
  validEntities.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.id.localeCompare(b.id);
  });

  // Write back
  const output = stringifyYaml(validEntities, { lineWidth: 0 });
  writeFileSync(ENTITIES_FILE, output);

  console.log(`\n✅ Written cleaned entities.yaml`);
}

main();
