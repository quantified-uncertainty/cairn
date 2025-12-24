#!/usr/bin/env node

/**
 * Data Validation Script
 *
 * Validates the integrity of YAML data files:
 * - Checks that relatedEntries reference existing entity IDs
 * - Checks that entity IDs map to actual MDX files
 * - Validates expert/organization references
 * - Reports orphaned entities
 *
 * Usage: node scripts/validate-data.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';

const DATA_DIR = 'src/data';
const CONTENT_DIR = 'src/content/docs';

// Color codes for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function loadYaml(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    return [];
  }
  const content = readFileSync(filepath, 'utf-8');
  return parseYaml(content) || [];
}

// Recursively find all MDX files
function findMdxFiles(dir, results = []) {
  if (!existsSync(dir)) return results;

  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findMdxFiles(filePath, results);
    } else if (file.endsWith('.mdx')) {
      results.push(filePath);
    }
  }
  return results;
}

// Extract entity ID from file path
function getEntityIdFromPath(filePath) {
  return basename(filePath, '.mdx');
}

// Map entity type to expected directory paths
function getExpectedPaths(type) {
  const pathMapping = {
    'risk': ['knowledge-base/risks'],
    'capability': ['knowledge-base/capabilities'],
    'safety-agenda': ['knowledge-base/responses/technical'],
    'policy': ['knowledge-base/responses/governance'],
    'lab': ['knowledge-base/organizations'],
    'lab-frontier': ['knowledge-base/organizations/labs'],
    'lab-research': ['knowledge-base/organizations/safety-orgs'],
    'lab-startup': ['knowledge-base/organizations'],
    'lab-academic': ['knowledge-base/organizations'],
    'researcher': ['knowledge-base/people'],
    'crux': ['knowledge-base/cruxes'],
    'scenario': ['analysis/scenarios'],
    'resource': ['resources'],
    'funder': ['knowledge-base/funders'],
    'intervention': ['knowledge-base/responses'],
    'case-study': ['knowledge-base/case-studies'],
  };

  return pathMapping[type] || ['knowledge-base'];
}

function main() {
  console.log(`${colors.blue}🔍 Validating data integrity...${colors.reset}\n`);

  let errors = 0;
  let warnings = 0;

  // Load all data
  const entities = loadYaml('entities.yaml');
  const experts = loadYaml('experts.yaml');
  const organizations = loadYaml('organizations.yaml');
  const literature = loadYaml('literature.yaml');

  // Build ID sets for quick lookups
  const entityIds = new Set(entities.map(e => e.id));
  const expertIds = new Set(experts.map(e => e.id));
  const orgIds = new Set(organizations.map(o => o.id));

  // Find all MDX files
  const mdxFiles = findMdxFiles(CONTENT_DIR);
  const mdxIds = new Set(mdxFiles.map(f => getEntityIdFromPath(f)));

  console.log(`📊 Data summary:`);
  console.log(`   Entities: ${entities.length}`);
  console.log(`   Experts: ${experts.length}`);
  console.log(`   Organizations: ${organizations.length}`);
  console.log(`   MDX files: ${mdxFiles.length}\n`);

  // ==========================================================================
  // 1. Validate related entries reference existing entities
  // ==========================================================================
  console.log(`${colors.blue}Checking related entries...${colors.reset}`);

  for (const entity of entities) {
    if (!entity.relatedEntries) continue;

    for (const related of entity.relatedEntries) {
      const relatedId = related.id;

      // Check if it exists in entities, experts, or organizations
      const exists = entityIds.has(relatedId) ||
                    expertIds.has(relatedId) ||
                    orgIds.has(relatedId);

      if (!exists) {
        console.log(`${colors.yellow}⚠️  ${entity.id}: relatedEntry "${relatedId}" not found in any data file${colors.reset}`);
        warnings++;
      }
    }
  }

  // ==========================================================================
  // 2. Validate entities have corresponding MDX files
  // ==========================================================================
  console.log(`\n${colors.blue}Checking entity-to-file mapping...${colors.reset}`);

  const entitiesWithoutFiles = [];
  for (const entity of entities) {
    if (!mdxIds.has(entity.id)) {
      entitiesWithoutFiles.push(entity);
    }
  }

  if (entitiesWithoutFiles.length > 0) {
    console.log(`${colors.yellow}⚠️  ${entitiesWithoutFiles.length} entities without MDX files:${colors.reset}`);
    for (const e of entitiesWithoutFiles.slice(0, 10)) {
      console.log(`   - ${e.id} (${e.type})`);
    }
    if (entitiesWithoutFiles.length > 10) {
      console.log(`   ... and ${entitiesWithoutFiles.length - 10} more`);
    }
    warnings += entitiesWithoutFiles.length;
  }

  // ==========================================================================
  // 3. Check for duplicate IDs
  // ==========================================================================
  console.log(`\n${colors.blue}Checking for duplicate IDs...${colors.reset}`);

  const seenIds = new Map();
  for (const entity of entities) {
    if (seenIds.has(entity.id)) {
      console.log(`${colors.red}❌ Duplicate entity ID: ${entity.id}${colors.reset}`);
      errors++;
    }
    seenIds.set(entity.id, true);
  }

  // ==========================================================================
  // 4. Validate required fields
  // ==========================================================================
  console.log(`\n${colors.blue}Checking required fields...${colors.reset}`);

  for (const entity of entities) {
    if (!entity.id) {
      console.log(`${colors.red}❌ Entity missing ID: ${JSON.stringify(entity).slice(0, 50)}${colors.reset}`);
      errors++;
    }
    if (!entity.type) {
      console.log(`${colors.red}❌ Entity "${entity.id}" missing type${colors.reset}`);
      errors++;
    }
    if (!entity.title) {
      console.log(`${colors.yellow}⚠️  Entity "${entity.id}" missing title${colors.reset}`);
      warnings++;
    }
  }

  // ==========================================================================
  // 5. Check expert affiliations reference valid organizations
  // ==========================================================================
  console.log(`\n${colors.blue}Checking expert affiliations...${colors.reset}`);

  for (const expert of experts) {
    if (expert.affiliation && !orgIds.has(expert.affiliation)) {
      console.log(`${colors.yellow}⚠️  Expert "${expert.id}": affiliation "${expert.affiliation}" not found in organizations${colors.reset}`);
      warnings++;
    }
  }

  // ==========================================================================
  // 6. Check MDX files that use DataInfoBox have corresponding entities
  // ==========================================================================
  console.log(`\n${colors.blue}Checking DataInfoBox references...${colors.reset}`);

  let missingEntityRefs = 0;
  for (const file of mdxFiles) {
    const content = readFileSync(file, 'utf-8');
    const match = content.match(/<DataInfoBox\s+entityId="([^"]+)"/);
    if (match) {
      const entityId = match[1];
      if (!entityIds.has(entityId) && !expertIds.has(entityId) && !orgIds.has(entityId)) {
        console.log(`${colors.red}❌ ${file}: DataInfoBox references unknown entityId "${entityId}"${colors.reset}`);
        errors++;
        missingEntityRefs++;
      }
    }
  }

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log(`\n${'─'.repeat(60)}`);

  if (errors === 0 && warnings === 0) {
    console.log(`${colors.green}✅ All validations passed!${colors.reset}`);
  } else {
    if (errors > 0) {
      console.log(`${colors.red}❌ ${errors} error(s)${colors.reset}`);
    }
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠️  ${warnings} warning(s)${colors.reset}`);
    }
  }

  process.exit(errors > 0 ? 1 : 0);
}

main();
