#!/usr/bin/env node
/**
 * Migrate MDX Content to YAML
 *
 * This script extracts prose content from MDX files and migrates it to YAML entities,
 * following the YAML-first architecture where all content lives in YAML.
 *
 * Usage:
 *   node scripts/migrate-mdx-to-yaml.mjs --list          # List candidate files
 *   node scripts/migrate-mdx-to-yaml.mjs --file state-actor  # Migrate specific file
 *   node scripts/migrate-mdx-to-yaml.mjs --all           # Migrate all candidates
 *   node scripts/migrate-mdx-to-yaml.mjs --dry-run       # Preview without writing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { parse, stringify } from 'yaml';

const CONTENT_DIR = 'src/content/docs/ai-transition-model';
const YAML_FILE = 'src/data/entities/ai-transition-model.yaml';

// =============================================================================
// PARSING
// =============================================================================

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  try {
    const frontmatter = parse(match[1]) || {};
    const body = content.slice(match[0].length).trim();
    return { frontmatter, body };
  } catch (e) {
    console.warn('Failed to parse frontmatter:', e.message);
    return { frontmatter: {}, body: content };
  }
}

/**
 * Extract Mermaid diagrams from content
 * Returns { cleaned: contentWithoutMermaid, diagrams: [string] }
 */
function extractMermaidDiagrams(content) {
  const diagrams = [];
  const mermaidRegex = /<Mermaid\s+client:load\s+chart=\{`([\s\S]*?)`\}\s*\/>/g;

  let match;
  while ((match = mermaidRegex.exec(content)) !== null) {
    diagrams.push(match[1].trim());
  }

  const cleaned = content.replace(mermaidRegex, '').trim();
  return { cleaned, diagrams };
}

/**
 * Parse MDX body into sections
 */
function parseToSections(body) {
  // Remove import statements
  const withoutImports = body.replace(/^import\s+.*$/gm, '').trim();

  // Remove component calls that aren't content (PageCauseEffectGraph, Backlinks, etc.)
  const withoutComponents = withoutImports
    .replace(/<PageCauseEffectGraph[^>]*\/>/g, '')
    .replace(/<Backlinks[^>]*\/>/g, '')
    .replace(/<TransitionModelContent[^>]*\/>/g, '')
    .trim();

  // Split by h2 headings (## )
  const parts = withoutComponents.split(/^(?=## )/m).filter(Boolean);

  // First part before any heading is intro
  let intro = '';
  const sections = [];

  for (const part of parts) {
    if (part.startsWith('## ')) {
      // Extract heading
      const headingMatch = part.match(/^## (.+?)[\n\r]/);
      const heading = headingMatch ? headingMatch[1].trim() : 'Section';
      const bodyContent = part.replace(/^## .+?[\n\r]/, '').trim();

      // Check for Mermaid diagrams
      const { cleaned, diagrams } = extractMermaidDiagrams(bodyContent);

      // Skip empty sections or sections with just ---
      if (cleaned.replace(/---/g, '').trim() || diagrams.length > 0) {
        const section = { heading };

        if (diagrams.length > 0) {
          section.mermaid = diagrams[0]; // Take first diagram
        }

        // Clean up body - remove leading/trailing ---
        const cleanBody = cleaned
          .replace(/^---+\s*/g, '')
          .replace(/\s*---+$/g, '')
          .trim();

        if (cleanBody) {
          section.body = cleanBody;
        }

        sections.push(section);
      }
    } else {
      // Content before first heading is intro
      const { cleaned } = extractMermaidDiagrams(part);
      intro = cleaned.replace(/^---+\s*/g, '').replace(/\s*---+$/g, '').trim();
    }
  }

  return { intro, sections };
}

/**
 * Parse table markdown into structured table data
 */
function parseMarkdownTable(tableStr) {
  const lines = tableStr.split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;

  // Parse header
  const headers = lines[0]
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  // Skip separator line
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

// =============================================================================
// FILE SCANNING
// =============================================================================

/**
 * Find all content-rich MDX files that are candidates for migration
 */
function findCandidates() {
  const candidates = [];

  function scanDir(dir, urlPrefix = '') {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, `${urlPrefix}/${entry}`);
      } else if (entry.endsWith('.mdx')) {
        const content = readFileSync(fullPath, 'utf-8');
        const { frontmatter, body } = extractFrontmatter(content);

        // Skip if already minimal stub
        if (content.includes('<TransitionModelContent entityId=') &&
            !content.includes('## ') &&
            content.split('\n').length < 20) {
          continue;
        }

        // Skip index files
        if (entry === 'index.mdx') continue;

        // Check if has substantial content
        const lineCount = body.split('\n').length;
        const hasHeadings = /^## /m.test(body);
        const hasMermaid = /<Mermaid/.test(body);

        if (lineCount > 30 || hasHeadings || hasMermaid) {
          candidates.push({
            file: entry,
            path: fullPath,
            urlPath: `${urlPrefix}/${basename(entry, '.mdx')}/`,
            lineCount,
            hasHeadings,
            hasMermaid,
          });
        }
      }
    }
  }

  scanDir(CONTENT_DIR, '/ai-transition-model');
  return candidates;
}

// =============================================================================
// YAML MANIPULATION
// =============================================================================

/**
 * Load the ai-transition-model.yaml file
 */
function loadYaml() {
  const content = readFileSync(YAML_FILE, 'utf-8');
  return parse(content);
}

/**
 * Save the ai-transition-model.yaml file
 */
function saveYaml(entities) {
  const content = stringify(entities, {
    lineWidth: 100,
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
  });
  writeFileSync(YAML_FILE, content);
}

/**
 * Find entity by path
 */
function findEntityByPath(entities, urlPath) {
  return entities.find(e => e.path === urlPath);
}

/**
 * Derive entity ID from URL path
 * e.g., /ai-transition-model/scenarios/human-catastrophe/state-actor/ -> tmc-state-actor
 */
function deriveEntityId(urlPath) {
  const parts = urlPath.replace(/^\/|\/$/g, '').split('/');
  const slug = parts[parts.length - 1];
  return `tmc-${slug}`;
}

// =============================================================================
// MIGRATION
// =============================================================================

/**
 * Migrate a single MDX file to YAML
 */
function migrateFile(mdxPath, options = { dryRun: false }) {
  const content = readFileSync(mdxPath, 'utf-8');
  const { frontmatter, body } = extractFrontmatter(content);

  // Derive URL path from file path
  const relativePath = mdxPath.replace(CONTENT_DIR, '').replace('.mdx', '/');
  const urlPath = `/ai-transition-model${relativePath}`;

  // Parse content
  const { intro, sections } = parseToSections(body);

  // Create content structure
  const contentObj = {};
  if (intro) contentObj.intro = intro;
  if (sections.length > 0) contentObj.sections = sections;

  // Load existing YAML
  const entities = loadYaml();

  // Find or create entity
  let entity = findEntityByPath(entities, urlPath);
  const entityId = deriveEntityId(urlPath);

  if (!entity) {
    console.log(`  Creating new entity: ${entityId}`);
    entity = {
      id: entityId,
      type: 'ai-transition-model-subitem',
      title: frontmatter.title || basename(mdxPath, '.mdx').replace(/-/g, ' '),
      path: urlPath,
    };
    entities.push(entity);
  }

  // Add content to entity
  entity.content = contentObj;

  // Add sidebar order if available
  if (frontmatter.sidebar?.order) {
    entity.sidebarOrder = frontmatter.sidebar.order;
  }

  // Generate minimal MDX stub
  // Need to go up depth+1 levels from file location to reach src/components/wiki
  const pathParts = urlPath.split('/').filter(Boolean);
  const depth = pathParts.length;
  const relativImport = '../'.repeat(depth + 1) + 'components/wiki';
  const sidebarOrder = frontmatter.sidebar?.order || 99;

  const stubContent = `---
title: "${frontmatter.title || entity.title}"
sidebar:
  order: ${sidebarOrder}
---

import {TransitionModelContent} from '${relativImport}';

<TransitionModelContent entityId="${entity.id}" client:load />
`;

  if (options.dryRun) {
    console.log(`\n--- Would migrate: ${mdxPath} ---`);
    console.log(`Entity ID: ${entity.id}`);
    console.log(`Content sections: ${sections.length}`);
    console.log(`Intro length: ${intro.length} chars`);
    if (sections.length > 0) {
      console.log('Sections:', sections.map(s => s.heading).join(', '));
    }
    return { entity, stubContent, success: true };
  }

  // Write updated YAML
  saveYaml(entities);
  console.log(`  ✓ Updated YAML with content for ${entity.id}`);

  // Write minimal MDX stub
  writeFileSync(mdxPath, stubContent);
  console.log(`  ✓ Replaced MDX with minimal stub`);

  return { entity, stubContent, success: true };
}

// =============================================================================
// CLI
// =============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    const candidates = findCandidates();
    console.log(`\nFound ${candidates.length} content-rich MDX files:\n`);
    for (const c of candidates) {
      console.log(`  ${c.file}`);
      console.log(`    Lines: ${c.lineCount}, Headings: ${c.hasHeadings}, Mermaid: ${c.hasMermaid}`);
      console.log(`    Path: ${c.urlPath}`);
    }
    return;
  }

  const dryRun = args.includes('--dry-run');
  const fileArg = args.find(a => a.startsWith('--file='));
  const migrateAll = args.includes('--all');

  if (fileArg) {
    const fileName = fileArg.replace('--file=', '');
    const candidates = findCandidates();
    const candidate = candidates.find(c =>
      c.file === `${fileName}.mdx` ||
      c.file === fileName ||
      c.urlPath.includes(fileName)
    );

    if (!candidate) {
      console.error(`File not found: ${fileName}`);
      console.log('\nAvailable candidates:');
      for (const c of candidates) {
        console.log(`  ${c.file}`);
      }
      process.exit(1);
    }

    console.log(`\nMigrating: ${candidate.file}`);
    migrateFile(candidate.path, { dryRun });
    return;
  }

  if (migrateAll) {
    const candidates = findCandidates();
    console.log(`\nMigrating ${candidates.length} files${dryRun ? ' (dry run)' : ''}:\n`);

    for (const c of candidates) {
      console.log(`\n${c.file}:`);
      try {
        migrateFile(c.path, { dryRun });
      } catch (e) {
        console.error(`  ✗ Error: ${e.message}`);
      }
    }

    if (!dryRun) {
      console.log('\n✓ Migration complete. Run `npm run build:data` to rebuild.');
    }
    return;
  }

  // Show help
  console.log(`
Migrate MDX Content to YAML

Usage:
  node scripts/migrate-mdx-to-yaml.mjs --list              List candidate files
  node scripts/migrate-mdx-to-yaml.mjs --file=state-actor  Migrate specific file
  node scripts/migrate-mdx-to-yaml.mjs --all               Migrate all candidates
  node scripts/migrate-mdx-to-yaml.mjs --all --dry-run     Preview migration
`);
}

main();
