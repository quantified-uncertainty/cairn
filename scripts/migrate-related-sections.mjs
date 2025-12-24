#!/usr/bin/env node

/**
 * Migrate Related Sections Script
 *
 * Finds MDX files with <Section title="Related Topics"> and <Section title="Related Entries">
 * blocks, extracts the data, and adds it to the entity's YAML entry.
 * Then removes those sections from the MDX files.
 *
 * Usage:
 *   node scripts/migrate-related-sections.mjs --dry-run    # Preview changes
 *   node scripts/migrate-related-sections.mjs              # Apply changes
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
  'src/content/docs/getting-started',
  'src/content/docs/guides',
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

function loadEntities() {
  if (!existsSync(ENTITIES_FILE)) {
    return [];
  }
  const content = readFileSync(ENTITIES_FILE, 'utf-8');
  return parseYaml(content) || [];
}

function saveEntities(entities) {
  const content = stringifyYaml(entities, { lineWidth: 0 });
  writeFileSync(ENTITIES_FILE, content);
}

function getEntityIdFromPath(filePath) {
  return basename(filePath, '.mdx');
}

// Extract tags from <Tags tags={[...]} />
function extractTags(content) {
  const tagsMatch = content.match(/<Tags\s+tags=\{(\[[^\]]*\])\}\s*\/>/s);
  if (!tagsMatch) return null;

  try {
    // Parse the array - it's JavaScript array syntax
    const tagsStr = tagsMatch[1];
    // Simple parsing for string arrays
    const tags = [];
    const matches = tagsStr.matchAll(/"([^"]+)"/g);
    for (const m of matches) {
      tags.push(m[1]);
    }
    return tags.length > 0 ? tags : null;
  } catch (e) {
    return null;
  }
}

// Extract EntityCards from <EntityCards>...</EntityCards>
function extractEntityCards(content) {
  const cardsMatch = content.match(/<EntityCards>([\s\S]*?)<\/EntityCards>/);
  if (!cardsMatch) return null;

  const cardsContent = cardsMatch[1];
  const cards = [];

  // Match each EntityCard
  const cardRegex = /<EntityCard\s+([\s\S]*?)\/>/g;
  let match;
  while ((match = cardRegex.exec(cardsContent)) !== null) {
    const propsStr = match[1];

    const idMatch = propsStr.match(/id="([^"]+)"/);
    const categoryMatch = propsStr.match(/category="([^"]+)"/);

    if (idMatch) {
      cards.push({
        id: idMatch[1],
        type: categoryMatch ? categoryMatch[1] : 'risk',
      });
    }
  }

  return cards.length > 0 ? cards : null;
}

// Check if file has Related sections to migrate
function hasRelatedSections(content) {
  // Match any Section with "Related" in the title
  return /<Section\s+title="[^"]*Related[^"]*">/i.test(content);
}

// Remove Related sections from content
function removeRelatedSections(content) {
  // Remove any Section with "Related" in the title (handles all variants)
  content = content.replace(
    /<Section\s+title="[^"]*Related[^"]*">[\s\S]*?<\/Section>\n?/gi,
    ''
  );

  // Clean up unused imports
  if (!content.includes('<Section')) {
    content = content.replace(/,?\s*Section/g, '');
  }
  if (!content.includes('<Tags')) {
    content = content.replace(/,?\s*Tags/g, '');
  }
  if (!content.includes('<EntityCard')) {
    content = content.replace(/,?\s*EntityCards?/g, '');
  }

  // Clean up import statement - remove empty imports and fix formatting
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
  console.log('🔄 Migrating Related Sections to YAML\n');
  if (DRY_RUN) console.log('  (DRY RUN - no files will be modified)\n');

  // Find files from all content directories
  const files = [];
  for (const dir of CONTENT_DIRS) {
    findFiles(dir, files);
  }
  console.log(`Found ${files.length} MDX files to check\n`);

  const entities = loadEntities();
  const entityMap = new Map(entities.map(e => [e.id, e]));

  let migratedCount = 0;
  let updatedEntities = 0;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const entityId = getEntityIdFromPath(file);

    if (!hasRelatedSections(content)) {
      if (VERBOSE) console.log(`⏭️  ${entityId}: no Related sections`);
      continue;
    }

    console.log(`📝 Processing: ${file}`);

    // Extract data
    const tags = extractTags(content);
    const cards = extractEntityCards(content);

    if (VERBOSE) {
      console.log(`   Tags: ${tags ? tags.join(', ') : 'none'}`);
      console.log(`   Cards: ${cards ? cards.map(c => c.id).join(', ') : 'none'}`);
    }

    // Update entity if it exists
    const entity = entityMap.get(entityId);
    if (entity) {
      let updated = false;

      if (tags && (!entity.relatedTopics || entity.relatedTopics.length === 0)) {
        entity.relatedTopics = tags;
        console.log(`   ✨ Added ${tags.length} relatedTopics`);
        updated = true;
      }

      if (cards && (!entity.relatedEntries || entity.relatedEntries.length === 0)) {
        entity.relatedEntries = cards;
        console.log(`   ✨ Added ${cards.length} relatedEntries`);
        updated = true;
      }

      if (updated) updatedEntities++;
    } else {
      console.log(`   ⚠️  No entity found for ${entityId}`);
    }

    // Remove sections from MDX
    const newContent = removeRelatedSections(content);

    if (!DRY_RUN && newContent !== content) {
      writeFileSync(file, newContent);
      console.log(`   ✅ Removed Related sections from MDX`);
    }

    migratedCount++;
  }

  // Save updated entities
  if (!DRY_RUN && updatedEntities > 0) {
    saveEntities(entities);
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
