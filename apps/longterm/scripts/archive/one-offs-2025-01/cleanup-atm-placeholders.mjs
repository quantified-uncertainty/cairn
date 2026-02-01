#!/usr/bin/env node

/**
 * Removes placeholder sections from ai-transition-model-content.yaml
 *
 * Identifies and removes sections that contain placeholder text like:
 * - "[Description of what optimal values...]"
 * - "[Characteristic 1]: [Description]"
 * - "[Factor N]" with "[Mechanism]" or "[How it...]"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const ATM_CONTENT_PATH = path.join(ROOT, 'src/data/entities/ai-transition-model-content.yaml');

// Patterns that indicate placeholder content
const PLACEHOLDER_PATTERNS = [
  /\[Description of what optimal values/,
  /\[Characteristic \d+\]\*\*:\s*\[Description\]/,
  /\*\*\[Characteristic \d+\]\*\*.*\[Description\]/,
  /\*\*\[Factor \d+\]\*\*.*\[How it/,
  /\*\*\[Factor \d+\]\*\*.*\[Mechanism\]/,
];

function isPlaceholderSection(section) {
  if (!section || !section.body) return false;

  const body = section.body;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(body));
}

function cleanEntity(entity) {
  if (!entity || !entity.content || !entity.content.sections) {
    return { changed: false, removed: [] };
  }

  const removed = [];
  const originalLength = entity.content.sections.length;

  entity.content.sections = entity.content.sections.filter(section => {
    if (isPlaceholderSection(section)) {
      removed.push(section.heading);
      return false;
    }
    return true;
  });

  return {
    changed: entity.content.sections.length !== originalLength,
    removed
  };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log(`Loading ${ATM_CONTENT_PATH}...`);
  const content = fs.readFileSync(ATM_CONTENT_PATH, 'utf-8');
  const data = yaml.load(content);

  // Data is an array
  if (!Array.isArray(data)) {
    console.error('Expected YAML to be an array');
    process.exit(1);
  }

  let totalRemoved = 0;
  const changes = [];

  for (const entity of data) {
    const result = cleanEntity(entity);
    if (result.changed) {
      changes.push({ entityId: entity.id, removed: result.removed });
      totalRemoved += result.removed.length;
    }
  }

  console.log(`\nFound ${totalRemoved} placeholder sections across ${changes.length} entities:\n`);

  for (const { entityId, removed } of changes) {
    console.log(`  ${entityId}:`);
    for (const heading of removed) {
      console.log(`    - "${heading}"`);
    }
  }

  if (dryRun) {
    console.log(`\n[DRY RUN] Would remove ${totalRemoved} placeholder sections.`);
    console.log('Run without --dry-run to apply changes.');
  } else {
    // Write back
    const newContent = yaml.dump(data, {
      lineWidth: -1,
      noRefs: true,
      quotingType: '"',
      forceQuotes: false,
    });

    fs.writeFileSync(ATM_CONTENT_PATH, newContent);
    console.log(`\nRemoved ${totalRemoved} placeholder sections.`);
    console.log(`Updated ${ATM_CONTENT_PATH}`);
  }
}

main();
