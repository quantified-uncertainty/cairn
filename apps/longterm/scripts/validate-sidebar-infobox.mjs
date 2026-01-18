#!/usr/bin/env node
/**
 * Validate that all pages with InfoBox/DataInfoBox will get sidebar treatment.
 *
 * Checks:
 * 1. Pages with DataInfoBox entityId - entity must exist in database
 * 2. Pages with inline InfoBox - should have entityId frontmatter or matching entity
 * 3. Frontmatter entityId - must reference existing entity
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';

const CONTENT_DIR = 'src/content/docs/knowledge-base';
const ENTITIES_DIR = 'src/data/entities';

// Load all entity IDs from the database
function loadEntityIds() {
  const entityIds = new Set();
  const files = readdirSync(ENTITIES_DIR).filter(f => f.endsWith('.yaml'));

  for (const file of files) {
    const content = readFileSync(join(ENTITIES_DIR, file), 'utf-8');
    const entities = parseYaml(content) || [];
    for (const entity of entities) {
      if (entity.id) {
        entityIds.add(entity.id);
      }
    }
  }

  return entityIds;
}

// Recursively find all MDX files
function findMdxFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findMdxFiles(fullPath, files);
    } else if (entry.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Extract frontmatter from MDX file
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) || {};
  } catch {
    return {};
  }
}

// Check if file uses DataInfoBox or InfoBox
function getInfoBoxUsage(content) {
  const dataInfoBoxMatch = content.match(/DataInfoBox\s+entityId="([^"]+)"/);
  const hasInlineInfoBox = /<InfoBox[\s\n]/.test(content);

  return {
    dataInfoBoxEntityId: dataInfoBoxMatch ? dataInfoBoxMatch[1] : null,
    hasInlineInfoBox,
  };
}

// Get slug from file path
function getSlugFromPath(filePath) {
  const filename = basename(filePath, '.mdx');
  if (filename === 'index') {
    // Use parent directory name
    const parts = filePath.split('/');
    return parts[parts.length - 2];
  }
  return filename;
}

// Main validation
function validate() {
  console.log('Loading entity IDs from database...');
  const entityIds = loadEntityIds();
  console.log(`Found ${entityIds.size} entities\n`);

  console.log('Scanning knowledge-base pages...\n');
  const mdxFiles = findMdxFiles(CONTENT_DIR);

  const issues = [];
  const warnings = [];
  const ok = [];

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    const { dataInfoBoxEntityId, hasInlineInfoBox } = getInfoBoxUsage(content);
    const slug = getSlugFromPath(filePath);
    const relativePath = filePath.replace('src/content/docs/', '');

    // Skip pages without any InfoBox
    if (!dataInfoBoxEntityId && !hasInlineInfoBox) {
      continue;
    }

    // Determine what entity ID will be used
    const frontmatterEntityId = frontmatter.entityId;
    const effectiveEntityId = frontmatterEntityId || slug;

    // Check 1: DataInfoBox entityId must exist
    if (dataInfoBoxEntityId && !entityIds.has(dataInfoBoxEntityId)) {
      issues.push({
        file: relativePath,
        issue: `DataInfoBox references non-existent entity: "${dataInfoBoxEntityId}"`,
        fix: `Add entity "${dataInfoBoxEntityId}" to entities/*.yaml`,
      });
      continue;
    }

    // Check 2: For sidebar to work, effective entityId must exist
    if (!entityIds.has(effectiveEntityId)) {
      if (dataInfoBoxEntityId && entityIds.has(dataInfoBoxEntityId)) {
        // DataInfoBox entity exists but doesn't match slug
        if (!frontmatterEntityId) {
          issues.push({
            file: relativePath,
            issue: `Slug "${slug}" doesn't match DataInfoBox entity "${dataInfoBoxEntityId}"`,
            fix: `Add "entityId: ${dataInfoBoxEntityId}" to frontmatter`,
          });
        }
      } else if (hasInlineInfoBox) {
        warnings.push({
          file: relativePath,
          issue: `Inline InfoBox but no matching entity "${effectiveEntityId}"`,
          note: `Will show inline, not sidebar (may be intentional)`,
        });
      }
      continue;
    }

    // Check 3: If both DataInfoBox and frontmatter entityId exist, they should match
    if (dataInfoBoxEntityId && frontmatterEntityId && dataInfoBoxEntityId !== frontmatterEntityId) {
      warnings.push({
        file: relativePath,
        issue: `Mismatch: frontmatter entityId="${frontmatterEntityId}" vs DataInfoBox entityId="${dataInfoBoxEntityId}"`,
        note: `Sidebar will use frontmatter entityId`,
      });
      continue;
    }

    // All good
    ok.push({
      file: relativePath,
      entityId: effectiveEntityId,
      source: frontmatterEntityId ? 'frontmatter' : 'slug',
    });
  }

  // Report results
  console.log('='.repeat(60));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(60));

  if (issues.length > 0) {
    console.log(`\n❌ ISSUES (${issues.length}) - These need fixing:\n`);
    for (const issue of issues) {
      console.log(`  ${issue.file}`);
      console.log(`    Problem: ${issue.issue}`);
      console.log(`    Fix: ${issue.fix}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}) - Review these:\n`);
    for (const warning of warnings) {
      console.log(`  ${warning.file}`);
      console.log(`    ${warning.issue}`);
      console.log(`    Note: ${warning.note}\n`);
    }
  }

  console.log(`\n✅ OK: ${ok.length} pages will correctly show sidebar InfoBox`);

  if (issues.length === 0 && warnings.length === 0) {
    console.log('\n🎉 All pages with InfoBox are properly configured!\n');
  }

  // Exit with error if there are issues
  process.exit(issues.length > 0 ? 1 : 0);
}

validate();
