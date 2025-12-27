/**
 * Build Data Script
 *
 * Converts YAML files to JSON for browser import.
 * Also computes backlinks, tag index, and statistics.
 * Run this before building the site.
 *
 * Usage: node scripts/build-data.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, basename, relative } from 'path';
import { parse } from 'yaml';

const DATA_DIR = 'src/data';
const CONTENT_DIR = 'src/content/docs';
const OUTPUT_FILE = 'src/data/database.json';

// Files to combine
const DATA_FILES = [
  { key: 'experts', file: 'experts.yaml' },
  { key: 'organizations', file: 'organizations.yaml' },
  { key: 'estimates', file: 'estimates.yaml' },
  { key: 'cruxes', file: 'cruxes.yaml' },
  { key: 'glossary', file: 'glossary.yaml' },
  { key: 'entities', file: 'entities.yaml' },
  { key: 'literature', file: 'literature.yaml' },
  { key: 'funders', file: 'funders.yaml' },
];

function loadYaml(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    console.warn(`File not found: ${filepath}`);
    return [];
  }
  const content = readFileSync(filepath, 'utf-8');
  return parse(content) || [];
}

function countEntries(data) {
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && typeof data === 'object') {
    let count = 0;
    for (const value of Object.values(data)) {
      if (Array.isArray(value)) {
        count += value.length;
      }
    }
    return count || Object.keys(data).length;
  }
  return 0;
}

/**
 * Compute backlinks for all entities
 * Returns a map: entityId -> array of entities that link to it
 */
function computeBacklinks(entities) {
  const backlinks = {};

  for (const entity of entities) {
    // Check relatedEntries
    if (entity.relatedEntries) {
      for (const ref of entity.relatedEntries) {
        if (!backlinks[ref.id]) {
          backlinks[ref.id] = [];
        }
        backlinks[ref.id].push({
          id: entity.id,
          type: entity.type,
          title: entity.title,
          relationship: ref.relationship,
        });
      }
    }
  }

  return backlinks;
}

/**
 * Build inverted tag index
 * Returns a map: tag -> array of entities with that tag
 */
function buildTagIndex(entities) {
  const index = {};

  for (const entity of entities) {
    if (!entity.tags) continue;

    for (const tag of entity.tags) {
      if (!index[tag]) {
        index[tag] = [];
      }
      index[tag].push({
        id: entity.id,
        type: entity.type,
        title: entity.title,
      });
    }
  }

  // Sort tags alphabetically
  const sortedIndex = {};
  for (const tag of Object.keys(index).sort()) {
    sortedIndex[tag] = index[tag];
  }

  return sortedIndex;
}

/**
 * Extract frontmatter from MDX/MD content using YAML parser
 * Properly handles nested objects like ratings
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  try {
    return parse(match[1]) || {};
  } catch (e) {
    console.warn('Failed to parse frontmatter:', e.message);
    return {};
  }
}

/**
 * Build pages registry by scanning all MDX/MD files
 * Extracts frontmatter including quality, lastUpdated, title, etc.
 */
function buildPagesRegistry() {
  const pages = [];

  function scanDirectory(dir, urlPrefix = '') {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDirectory(fullPath, `${urlPrefix}/${entry}`);
      } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
        const id = basename(entry, entry.endsWith('.mdx') ? '.mdx' : '.md');
        const content = readFileSync(fullPath, 'utf-8');
        const fm = extractFrontmatter(content);

        // Skip index files for the pages list
        if (id === 'index') continue;

        const urlPath = `${urlPrefix}/${id}/`;

        pages.push({
          id,
          path: urlPath,
          filePath: relative(CONTENT_DIR, fullPath),
          title: fm.title || id.replace(/-/g, ' '),
          quality: fm.quality ? parseInt(fm.quality) : null,
          lastUpdated: fm.lastUpdated || fm.lastEdited || null,
          llmSummary: fm.llmSummary || null,
          description: fm.description || null,
          // Extract ratings for model pages
          ratings: fm.ratings || null,
          // Extract category from path
          category: urlPrefix.split('/').filter(Boolean)[1] || 'other',
        });
      }
    }
  }

  // Scan all content directories
  scanDirectory(join(CONTENT_DIR, 'knowledge-base'), '/knowledge-base');

  const otherDirs = ['understanding-ai-risk', 'analysis', 'getting-started', 'browse', 'internal', 'style-guides'];
  for (const topDir of otherDirs) {
    const dirPath = join(CONTENT_DIR, topDir);
    if (existsSync(dirPath)) {
      scanDirectory(dirPath, `/${topDir}`);
    }
  }

  return pages;
}

/**
 * Build path registry by scanning all MDX/MD files
 * Maps entity IDs (from filenames) to their URL paths
 */
function buildPathRegistry() {
  const registry = {};

  function scanDirectory(dir, urlPrefix = '') {
    if (!existsSync(dir)) return;

    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recurse into subdirectory
        scanDirectory(fullPath, `${urlPrefix}/${entry}`);
      } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
        // Extract ID from filename (remove extension)
        const id = basename(entry, entry.endsWith('.mdx') ? '.mdx' : '.md');

        // Skip index files - they use the directory path
        if (id === 'index') {
          // The directory itself is the URL
          registry[`__index__${urlPrefix}`] = `${urlPrefix}/`;
        } else {
          // Build the URL path
          const urlPath = `${urlPrefix}/${id}/`;
          registry[id] = urlPath;
        }
      }
    }
  }

  // Scan the knowledge-base directory
  scanDirectory(join(CONTENT_DIR, 'knowledge-base'), '/knowledge-base');

  // Also scan other top-level content directories
  const topLevelDirs = ['understanding-ai-risk', 'analysis', 'getting-started'];
  for (const topDir of topLevelDirs) {
    const dirPath = join(CONTENT_DIR, topDir);
    if (existsSync(dirPath)) {
      scanDirectory(dirPath, `/${topDir}`);
    }
  }

  return registry;
}

/**
 * Compute aggregate statistics
 */
function computeStats(entities, backlinks, tagIndex) {
  // Count by type
  const byType = {};
  for (const entity of entities) {
    byType[entity.type] = (byType[entity.type] || 0) + 1;
  }

  // Count by severity
  const bySeverity = {};
  for (const entity of entities) {
    if (entity.severity) {
      bySeverity[entity.severity] = (bySeverity[entity.severity] || 0) + 1;
    }
  }

  // Count by status
  const byStatus = {};
  for (const entity of entities) {
    const status = entity.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  // Recently updated (sort by lastUpdated, take top 10)
  const recentlyUpdated = entities
    .filter((e) => e.lastUpdated)
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 10)
    .map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      lastUpdated: e.lastUpdated,
    }));

  // Most linked (entities with most backlinks)
  const mostLinked = Object.entries(backlinks)
    .map(([id, links]) => ({
      id,
      count: links.length,
      entity: entities.find((e) => e.id === id),
    }))
    .filter((item) => item.entity)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      type: item.entity.type,
      title: item.entity.title,
      backlinkCount: item.count,
    }));

  // Tag statistics
  const topTags = Object.entries(tagIndex)
    .map(([tag, entities]) => ({ tag, count: entities.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Entities with descriptions
  const withDescription = entities.filter((e) => e.description).length;

  return {
    totalEntities: entities.length,
    byType,
    bySeverity,
    byStatus,
    recentlyUpdated,
    mostLinked,
    topTags,
    totalTags: Object.keys(tagIndex).length,
    withDescription,
    lastBuilt: new Date().toISOString(),
  };
}

function main() {
  console.log('Building data bundle...\n');

  const database = {};

  for (const { key, file } of DATA_FILES) {
    const data = loadYaml(file);
    database[key] = data;
    console.log(`  ${key}: ${countEntries(data)} entries`);
  }

  // Compute derived data for entities
  const entities = database.entities || [];

  console.log('\nComputing derived data...');

  // Compute backlinks
  const backlinks = computeBacklinks(entities);
  database.backlinks = backlinks;
  console.log(`  backlinks: ${Object.keys(backlinks).length} entities have incoming links`);

  // Build tag index
  const tagIndex = buildTagIndex(entities);
  database.tagIndex = tagIndex;
  console.log(`  tagIndex: ${Object.keys(tagIndex).length} unique tags`);

  // Compute statistics
  const stats = computeStats(entities, backlinks, tagIndex);
  database.stats = stats;
  console.log(`  stats: computed`);

  // Build path registry from content files
  const pathRegistry = buildPathRegistry();
  database.pathRegistry = pathRegistry;
  console.log(`  pathRegistry: ${Object.keys(pathRegistry).length} paths mapped`);

  // Build pages registry with frontmatter data (quality, etc.)
  const pages = buildPagesRegistry();
  database.pages = pages;
  const pagesWithQuality = pages.filter(p => p.quality !== null).length;
  console.log(`  pages: ${pages.length} pages (${pagesWithQuality} with quality ratings)`);

  // Write combined JSON
  writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
  console.log(`\n✓ Written: ${OUTPUT_FILE}`);

  // Also write individual JSON files for selective imports
  for (const { key, file } of DATA_FILES) {
    const jsonFile = file.replace('.yaml', '.json');
    writeFileSync(join(DATA_DIR, jsonFile), JSON.stringify(database[key], null, 2));
  }

  // Write derived data as separate files too
  writeFileSync(join(DATA_DIR, 'backlinks.json'), JSON.stringify(backlinks, null, 2));
  writeFileSync(join(DATA_DIR, 'tagIndex.json'), JSON.stringify(tagIndex, null, 2));
  writeFileSync(join(DATA_DIR, 'stats.json'), JSON.stringify(stats, null, 2));
  writeFileSync(join(DATA_DIR, 'pathRegistry.json'), JSON.stringify(pathRegistry, null, 2));
  writeFileSync(join(DATA_DIR, 'pages.json'), JSON.stringify(pages, null, 2));

  console.log('✓ Written individual JSON files');
  console.log('✓ Written derived data files (backlinks, tagIndex, stats, pathRegistry)');

  // Print summary stats
  console.log('\n--- Summary ---');
  console.log(`Total entities: ${stats.totalEntities}`);
  console.log(`With descriptions: ${stats.withDescription}`);
  console.log(`Unique tags: ${stats.totalTags}`);
  console.log(`Top types: ${Object.entries(stats.byType).slice(0, 5).map(([t, c]) => `${t}(${c})`).join(', ')}`);
}

main();
