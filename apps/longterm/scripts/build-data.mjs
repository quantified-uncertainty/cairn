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
import { spawnSync } from 'child_process';
import { join, basename, relative } from 'path';
import { parse } from 'yaml';
import { extractMetrics, suggestQuality, getQualityDiscrepancy } from './lib/metrics-extractor.mjs';
import { computeRedundancy } from './lib/redundancy.mjs';
import { CONTENT_DIR, DATA_DIR } from './lib/content-types.mjs';

// =============================================================================
// UNCONVERTED LINK DETECTION
// =============================================================================

/**
 * Normalize URL to handle variations (trailing slashes, www prefix, http/https)
 */
function normalizeUrl(url) {
  const variations = new Set();
  try {
    const parsed = new URL(url);
    const base = parsed.href.replace(/\/$/, '');
    variations.add(base);
    variations.add(base + '/');

    // Without www
    if (parsed.hostname.startsWith('www.')) {
      const noWww = base.replace('://www.', '://');
      variations.add(noWww);
      variations.add(noWww + '/');
    }
    // With www
    if (!parsed.hostname.startsWith('www.')) {
      const withWww = base.replace('://', '://www.');
      variations.add(withWww);
      variations.add(withWww + '/');
    }
  } catch {
    variations.add(url);
  }
  return Array.from(variations);
}

/**
 * Build URL → resource map from resources
 */
function buildUrlToResourceMap(resources) {
  const urlToResource = new Map();
  for (const r of resources) {
    if (!r.url) continue;
    const normalizedUrls = normalizeUrl(r.url);
    for (const url of normalizedUrls) {
      urlToResource.set(url, r);
    }
  }
  return urlToResource;
}

/**
 * Extract markdown links from content (not images, not internal, not <R> components)
 */
function extractMarkdownLinks(content) {
  const links = [];
  // Match [text](url) but not images ![text](url)
  const linkRegex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const [full, text, url] = match;
    // Skip internal links, anchors, mailto
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:')) continue;
    links.push({ text, url });
  }
  return links;
}

/**
 * Find unconverted links in content (markdown links that have matching resources)
 */
function findUnconvertedLinks(content, urlToResource) {
  const links = extractMarkdownLinks(content);
  const unconverted = [];

  for (const link of links) {
    const resource = urlToResource.get(link.url) || urlToResource.get(link.url.replace(/\/$/, ''));
    if (resource) {
      unconverted.push({
        text: link.text,
        url: link.url,
        resourceId: resource.id,
        resourceTitle: resource.title,
      });
    }
  }

  return unconverted;
}

/**
 * Count <R> component usages in content (already converted links)
 */
function countConvertedLinks(content) {
  // Match <R id="..."> or <R id="...">...</R>
  const rComponentRegex = /<R\s+id=/g;
  const matches = content.match(rComponentRegex);
  return matches ? matches.length : 0;
}

const OUTPUT_FILE = 'src/data/database.json';

// =============================================================================
// MDX GENERATION FOR YAML-FIRST ENTITIES
// =============================================================================

/**
 * Check if an MDX file needs regeneration based on entity content
 * Returns true if the file doesn't exist or is a minimal stub that should be regenerated
 */
function shouldGenerateMdx(mdxPath, entity) {
  if (!existsSync(mdxPath)) return true;

  const content = readFileSync(mdxPath, 'utf-8');

  // If file contains custom content beyond the stub, don't overwrite
  // Check for markers that indicate it's a generated stub
  const isGeneratedStub = content.includes('<TransitionModelContent entityId=') &&
    !content.includes('## ') && // No custom headings
    content.split('\n').length < 20; // Short file

  return isGeneratedStub;
}

/**
 * Generate minimal MDX stub for an entity with YAML-first content
 */
function generateMdxStub(entity) {
  // Calculate relative import path based on entity path depth
  // Path like /ai-transition-model/scenarios/human-catastrophe/state-actor/
  // File at src/content/docs/ai-transition-model/scenarios/human-catastrophe/state-actor.mdx
  // Use path alias for clean imports
  const importPath = '@components/wiki';

  // Extract sidebar order from entity if available
  const sidebarOrder = entity.sidebarOrder || 99;

  return `---
title: "${entity.title}"
sidebar:
  order: ${sidebarOrder}
---

import {TransitionModelContent} from '${importPath}';

<TransitionModelContent entityId="${entity.id}" client:load />
`;
}

/**
 * Generate MDX files for entities with YAML-first content structure
 * Only generates/updates files that are marked as generated stubs
 */
function generateMdxFromYaml(entities, options = { dryRun: false }) {
  const generated = [];
  const skipped = [];

  for (const entity of entities) {
    // Only process entities with content field and path
    if (!entity.content || !entity.path) continue;

    // Convert URL path to file path
    // e.g., /ai-transition-model/scenarios/human-catastrophe/state-actor/
    //    -> src/content/docs/ai-transition-model/scenarios/human-catastrophe/state-actor.mdx
    const urlPath = entity.path.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes
    const mdxPath = join(CONTENT_DIR, `${urlPath}.mdx`);

    // Check if we should generate this file
    if (!shouldGenerateMdx(mdxPath, entity)) {
      skipped.push({ id: entity.id, path: mdxPath, reason: 'custom content' });
      continue;
    }

    const mdxContent = generateMdxStub(entity);

    if (options.dryRun) {
      generated.push({ id: entity.id, path: mdxPath, action: 'would generate' });
    } else {
      // Ensure directory exists
      const dir = join(mdxPath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(mdxPath, mdxContent);
      generated.push({ id: entity.id, path: mdxPath, action: 'generated' });
    }
  }

  return { generated, skipped };
}

// Files to combine
const DATA_FILES = [
  { key: 'experts', file: 'experts.yaml' },
  { key: 'organizations', file: 'organizations.yaml' },
  { key: 'estimates', file: 'estimates.yaml' },
  { key: 'cruxes', file: 'cruxes.yaml' },
  { key: 'glossary', file: 'glossary.yaml' },
  { key: 'entities', dir: 'entities' }, // Split by entity type
  { key: 'literature', file: 'literature.yaml' },
  { key: 'funders', file: 'funders.yaml' },
  { key: 'resources', dir: 'resources' }, // Split into multiple files
  { key: 'publications', file: 'publications.yaml' },
  { key: 'parameterGraph', file: 'parameter-graph.yaml', isObject: true }, // Graph structure (not array)
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

/**
 * Load and merge all YAML files from a directory
 */
function loadYamlDir(dirname) {
  const dirpath = join(DATA_DIR, dirname);
  if (!existsSync(dirpath)) {
    console.warn(`Directory not found: ${dirpath}`);
    return [];
  }

  const files = readdirSync(dirpath).filter((f) => f.endsWith('.yaml'));
  const merged = [];

  for (const file of files) {
    const filepath = join(dirpath, file);
    const content = readFileSync(filepath, 'utf-8');
    const data = parse(content) || [];
    merged.push(...data);
  }

  return merged;
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
 * Also detects unconverted links (markdown links with matching resources)
 */
function buildPagesRegistry(urlToResource) {
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

        // Extract structural metrics
        const metrics = extractMetrics(content, fullPath);
        const currentQuality = fm.quality ? parseInt(fm.quality) : null;

        // Find unconverted links (markdown links that have matching resources)
        const unconvertedLinks = urlToResource ? findUnconvertedLinks(content, urlToResource) : [];

        // Count already converted links (<R> components)
        const convertedLinkCount = countConvertedLinks(content);

        pages.push({
          id,
          path: urlPath,
          filePath: relative(CONTENT_DIR, fullPath),
          title: fm.title || id.replace(/-/g, ' '),
          quality: currentQuality,
          importance: fm.importance ? parseInt(fm.importance) : null,
          // ITN framework fields (0-100 scale)
          tractability: fm.tractability ? parseInt(fm.tractability) : null,
          neglectedness: fm.neglectedness ? parseInt(fm.neglectedness) : null,
          uncertainty: fm.uncertainty ? parseInt(fm.uncertainty) : null,
          causalLevel: fm.causalLevel || null,
          lastUpdated: fm.lastUpdated || fm.lastEdited || null,
          llmSummary: fm.llmSummary || null,
          description: fm.description || null,
          // Extract ratings for model pages
          ratings: fm.ratings || null,
          // Extract category from path
          category: urlPrefix.split('/').filter(Boolean)[1] || 'other',
          // Structural metrics
          metrics: {
            wordCount: metrics.wordCount,
            tableCount: metrics.tableCount,
            diagramCount: metrics.diagramCount,
            internalLinks: metrics.internalLinks,
            externalLinks: metrics.externalLinks,
            bulletRatio: Math.round(metrics.bulletRatio * 100) / 100,
            sectionCount: metrics.sectionCount.total,
            hasOverview: metrics.hasOverview,
            structuralScore: metrics.structuralScore,
          },
          // Suggested quality based on structure
          suggestedQuality: suggestQuality(metrics.structuralScore, fm),
          // Legacy field for backwards compatibility
          wordCount: metrics.wordCount,
          // Unconverted links (markdown links with matching resources)
          unconvertedLinks,
          unconvertedLinkCount: unconvertedLinks.length,
          // Already converted links (<R> components)
          convertedLinkCount,
          // Raw content for redundancy analysis (removed before JSON output)
          rawContent: content,
        });
      }
    }
  }

  // Scan all content directories
  scanDirectory(join(CONTENT_DIR, 'knowledge-base'), '/knowledge-base');

  const otherDirs = ['ai-transition-model', 'analysis', 'getting-started', 'browse', 'internal', 'style-guides'];
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
  const topLevelDirs = ['ai-transition-model', 'analysis', 'getting-started'];
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

  for (const { key, file, dir, isObject } of DATA_FILES) {
    const data = dir ? loadYamlDir(dir) : loadYaml(file);
    database[key] = data;
    if (isObject) {
      // Object with structure (e.g., parameterGraph with nodes/edges)
      const nodeCount = data?.nodes?.length || 0;
      const edgeCount = data?.edges?.length || 0;
      console.log(`  ${key}: ${nodeCount} nodes, ${edgeCount} edges`);
    } else {
      console.log(`  ${key}: ${countEntries(data)} entries`);
    }
  }

  // Compute derived data for entities
  const entities = database.entities || [];

  // Generate MDX stubs for entities with YAML-first content
  console.log('\nGenerating MDX from YAML content...');
  const { generated, skipped } = generateMdxFromYaml(entities, { dryRun: false });
  if (generated.length > 0) {
    console.log(`  generated: ${generated.length} MDX files from YAML content`);
    for (const g of generated) {
      console.log(`    ✓ ${g.id}`);
    }
  }
  if (skipped.length > 0) {
    console.log(`  skipped: ${skipped.length} files (have custom content)`);
  }

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

  // Build URL → resource map for unconverted link detection
  const resources = database.resources || [];
  const urlToResource = buildUrlToResourceMap(resources);
  console.log(`  urlToResource: ${urlToResource.size} URL variations mapped`);

  // Build pages registry with frontmatter data (quality, etc.)
  const pages = buildPagesRegistry(urlToResource);

  // Enrich pages with backlink counts
  for (const page of pages) {
    const pageBacklinks = backlinks[page.id] || [];
    page.backlinkCount = pageBacklinks.length;
  }

  // Compute redundancy scores
  console.log('  Computing redundancy scores...');
  const { pageRedundancy, pairs: redundancyPairs } = computeRedundancy(pages);

  // Add redundancy data to pages and remove rawContent
  for (const page of pages) {
    const redundancy = pageRedundancy.get(page.id);
    page.redundancy = redundancy ? {
      maxSimilarity: redundancy.maxSimilarity,
      similarPages: redundancy.similarPages,
    } : {
      maxSimilarity: 0,
      similarPages: [],
    };
    // Remove rawContent to keep JSON size reasonable
    delete page.rawContent;
  }

  // Store redundancy pairs for analysis
  database.redundancyPairs = redundancyPairs.slice(0, 100); // Top 100 pairs
  console.log(`  redundancy: ${redundancyPairs.length} similar pairs found`);

  database.pages = pages;
  const pagesWithQuality = pages.filter(p => p.quality !== null).length;
  const pagesWithUnconvertedLinks = pages.filter(p => p.unconvertedLinkCount > 0).length;
  const totalUnconvertedLinks = pages.reduce((sum, p) => sum + p.unconvertedLinkCount, 0);
  console.log(`  pages: ${pages.length} pages (${pagesWithQuality} with quality ratings)`);
  console.log(`  unconvertedLinks: ${totalUnconvertedLinks} links across ${pagesWithUnconvertedLinks} pages`);

  // Write combined JSON
  writeFileSync(OUTPUT_FILE, JSON.stringify(database, null, 2));
  console.log(`\n✓ Written: ${OUTPUT_FILE}`);

  // Also write individual JSON files for selective imports
  for (const { key, file, dir } of DATA_FILES) {
    const jsonFile = dir ? `${key}.json` : file.replace('.yaml', '.json');
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

  // Generate link health data
  console.log('\nGenerating link health data...');
  const linkHealthPath = join(DATA_DIR, 'link-health.json');
  const linkValidation = spawnSync('node', [
    'scripts/validate/validate-internal-links.mjs',
    '--ci',
    `--output=${linkHealthPath}`
  ], { encoding: 'utf-8', cwd: process.cwd() });

  if (linkValidation.status === 0 || linkValidation.status === 1) {
    // Exit 0 = all valid, Exit 1 = broken links found
    // Both are acceptable for data generation
    console.log('✓ Link health data generated');
  } else {
    console.error('⚠️  Link health generation failed:', linkValidation.stderr);
  }

  // Print summary stats
  console.log('\n--- Summary ---');
  console.log(`Total entities: ${stats.totalEntities}`);
  console.log(`With descriptions: ${stats.withDescription}`);
  console.log(`Unique tags: ${stats.totalTags}`);
  console.log(`Top types: ${Object.entries(stats.byType).slice(0, 5).map(([t, c]) => `${t}(${c})`).join(', ')}`);

  // ==========================================================================
  // Zod Schema Validation
  // ==========================================================================
  console.log('\n--- Zod Schema Validation ---');
  console.log('Run `npm run validate:schema` to validate data against Zod schemas');
  console.log('Or run `npm run validate` for all validators');
}

main();
