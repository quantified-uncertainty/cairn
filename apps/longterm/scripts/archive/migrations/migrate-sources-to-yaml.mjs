#!/usr/bin/env node

/**
 * Migrate Sources to YAML Script
 *
 * Finds MDX files with <Sources sources={[...]} /> blocks,
 * extracts the data, and adds it to the entity's YAML entry.
 * Then removes the Sources block from the MDX files.
 *
 * Usage:
 *   node scripts/migrate-sources-to-yaml.mjs --dry-run    # Preview changes
 *   node scripts/migrate-sources-to-yaml.mjs              # Apply changes
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const ENTITIES_FILE = 'src/data/entities.yaml';
const CONTENT_DIRS = [
  'src/content/docs/knowledge-base',
  'src/content/docs/analysis',
  'src/content/docs/understanding-ai-risk',
];

function findFiles(dir, results = []) {
  if (!existsSync(dir)) return results;

  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, results);
    } else if (file.endsWith('.mdx') && file !== 'index.mdx') {
      results.push(filePath);
    }
  }
  return results;
}

function loadYaml(file) {
  if (!existsSync(file)) return [];
  const content = readFileSync(file, 'utf-8');
  return parseYaml(content) || [];
}

function saveYaml(file, data) {
  const content = stringifyYaml(data, { lineWidth: 0 });
  writeFileSync(file, content);
}

function getEntityIdFromPath(filePath) {
  return basename(filePath, '.mdx');
}

// Extract sources from <Sources sources={[...]} />
function extractSources(content) {
  // Match <Sources sources={[...]} />
  const sourcesMatch = content.match(/<Sources\s+sources=\{(\[[\s\S]*?\])\}\s*\/>/);
  if (!sourcesMatch) return null;

  try {
    // Parse the array - it's JavaScript object array syntax
    const sourcesStr = sourcesMatch[1];
    const sources = [];

    // Match individual source objects - handle any property order
    const objectRegex = /\{([^}]+)\}/g;
    let match;
    while ((match = objectRegex.exec(sourcesStr)) !== null) {
      const objStr = match[1];
      const source = {};

      // Extract each property
      const titleMatch = objStr.match(/title:\s*"([^"]+)"/);
      const urlMatch = objStr.match(/url:\s*"([^"]+)"/);
      const authorMatch = objStr.match(/author:\s*"([^"]+)"/);
      const dateMatch = objStr.match(/date:\s*"([^"]+)"/);

      if (titleMatch) {
        source.title = titleMatch[1];
        if (urlMatch) source.url = urlMatch[1];
        if (authorMatch) source.author = authorMatch[1];
        if (dateMatch) source.date = dateMatch[1];
        sources.push(source);
      }
    }

    return sources.length > 0 ? sources : null;
  } catch (e) {
    console.warn('  Could not parse sources:', e.message);
    return null;
  }
}

// Check if file has Sources block
function hasSources(content) {
  return /<Sources\s+sources=\{/.test(content);
}

// Remove Sources block from content
function removeSources(content) {
  // Remove the Sources component
  content = content.replace(/<Sources\s+sources=\{[\s\S]*?\}\s*\/>\n?/g, '');

  // Clean up Sources import if no longer needed
  if (!content.includes('<Sources')) {
    content = content.replace(/,?\s*Sources/g, '');
  }

  // Clean up empty imports
  content = content.replace(
    /import \{\s*,?\s*([^}]*?),?\s*\} from/g,
    (match, imports) => {
      const cleanImports = imports
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .join(', ');
      return `import { ${cleanImports} } from`;
    }
  );

  // Remove completely empty imports
  content = content.replace(/import \{\s*\} from ['"'][^'"]+['"'];?\n?/g, '');

  return content;
}

function main() {
  console.log('🔄 Migrating Sources to YAML\n');
  if (DRY_RUN) console.log('  (DRY RUN - no files will be modified)\n');

  // Find files from all content directories
  const files = [];
  for (const dir of CONTENT_DIRS) {
    findFiles(dir, files);
  }
  console.log(`Found ${files.length} MDX files to check\n`);

  const entities = loadYaml(ENTITIES_FILE);
  const entityMap = new Map(entities.map(e => [e.id, e]));

  let migratedCount = 0;
  let updatedEntities = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const entityId = getEntityIdFromPath(file);

    if (!hasSources(content)) {
      if (VERBOSE) console.log(`⏭️  ${entityId}: no Sources block`);
      continue;
    }

    console.log(`📝 Processing: ${file}`);

    // Extract sources
    const sources = extractSources(content);
    if (!sources) {
      console.log(`   ⚠️  Could not parse sources`);
      continue;
    }

    if (VERBOSE) {
      console.log(`   Found ${sources.length} sources`);
    }

    // Update entity if it exists
    const entity = entityMap.get(entityId);
    if (entity) {
      if (!entity.sources || entity.sources.length === 0) {
        entity.sources = sources;
        console.log(`   ✨ Added ${sources.length} sources to entity`);
        updatedEntities++;
      } else {
        console.log(`   📦 Entity already has sources, skipping`);
      }
    } else {
      console.log(`   ⚠️  No entity found for ${entityId}`);
    }

    // Remove Sources from MDX
    const newContent = removeSources(content);

    if (!DRY_RUN && newContent !== content) {
      writeFileSync(file, newContent);
      console.log(`   ✅ Removed Sources block from MDX`);
    }

    migratedCount++;
  }

  // Save updated entities
  if (!DRY_RUN && updatedEntities > 0) {
    saveYaml(ENTITIES_FILE, entities);
    console.log(`\n📝 Updated ${updatedEntities} entities in ${ENTITIES_FILE}`);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Processed: ${migratedCount} files`);
  console.log(`   Updated entities: ${updatedEntities}`);

  if (!DRY_RUN && migratedCount > 0) {
    console.log(`\n⚠️  Run 'node scripts/build-data.mjs' to rebuild the database`);
  }
}

main();
