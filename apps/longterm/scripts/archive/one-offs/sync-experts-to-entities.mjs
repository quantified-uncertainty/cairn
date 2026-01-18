#!/usr/bin/env node

/**
 * Sync Experts to Entities Script
 *
 * Ensures all experts in experts.yaml have corresponding entity entries.
 * This allows people pages to use <DataInfoBox entityId="..." /> consistently.
 *
 * Usage: node scripts/sync-experts-to-entities.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const EXPERTS_FILE = 'src/data/experts.yaml';
const ENTITIES_FILE = 'src/data/entities.yaml';

function loadYaml(file) {
  if (!existsSync(file)) return [];
  const content = readFileSync(file, 'utf-8');
  return parseYaml(content) || [];
}

function saveYaml(file, data) {
  const content = stringifyYaml(data, { lineWidth: 0 });
  writeFileSync(file, content);
}

function main() {
  console.log('🔄 Syncing experts to entities...\n');

  const experts = loadYaml(EXPERTS_FILE);
  const entities = loadYaml(ENTITIES_FILE);

  const entityIds = new Set(entities.map(e => e.id));
  let added = 0;
  let updated = 0;

  for (const expert of experts) {
    if (entityIds.has(expert.id)) {
      // Update existing entity with expert data
      const entity = entities.find(e => e.id === expert.id);
      let changed = false;

      // Update title if expert has name
      if (expert.name && entity.title !== expert.name) {
        entity.title = expert.name;
        changed = true;
      }

      // Ensure type is researcher
      if (entity.type !== 'researcher') {
        entity.type = 'researcher';
        changed = true;
      }

      // Add custom fields from expert data
      if (expert.affiliation || expert.role || expert.knownFor) {
        const customFields = entity.customFields || [];
        const fieldMap = new Map(customFields.map(f => [f.label, f]));

        if (expert.role && !fieldMap.has('Role')) {
          customFields.push({ label: 'Role', value: expert.role });
          changed = true;
        }

        if (expert.knownFor?.length && !fieldMap.has('Known For')) {
          customFields.push({ label: 'Known For', value: expert.knownFor.slice(0, 3).join(', ') });
          changed = true;
        }

        if (customFields.length > 0) {
          entity.customFields = customFields;
        }
      }

      // Add website
      if (expert.website && !entity.website) {
        entity.website = expert.website;
        changed = true;
      }

      if (changed) {
        console.log(`  📝 Updated: ${expert.id}`);
        updated++;
      }
    } else {
      // Create new entity from expert
      const newEntity = {
        id: expert.id,
        type: 'researcher',
        title: expert.name,
      };

      // Add custom fields
      const customFields = [];
      if (expert.role) {
        customFields.push({ label: 'Role', value: expert.role });
      }
      if (expert.affiliation) {
        customFields.push({ label: 'Affiliation', value: expert.affiliation });
      }
      if (expert.knownFor?.length) {
        customFields.push({ label: 'Known For', value: expert.knownFor.slice(0, 3).join(', ') });
      }

      if (customFields.length > 0) {
        newEntity.customFields = customFields;
      }

      if (expert.website) {
        newEntity.website = expert.website;
      }

      entities.push(newEntity);
      console.log(`  ✨ Added: ${expert.id} (${expert.name})`);
      added++;
    }
  }

  if (added > 0 || updated > 0) {
    // Sort entities by type then ID
    entities.sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.id.localeCompare(b.id);
    });

    saveYaml(ENTITIES_FILE, entities);
    console.log(`\n✅ Saved entities.yaml`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Added: ${added} new entities`);
  console.log(`   Updated: ${updated} existing entities`);
  console.log(`   Total experts: ${experts.length}`);
}

main();
