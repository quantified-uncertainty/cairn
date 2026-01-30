#!/usr/bin/env node

/**
 * Metaforecast Page-Forecast Discovery
 *
 * Scans all wiki pages and finds relevant forecasts from Metaforecast.
 * Saves static mappings to src/data/page-forecasts.yaml (git-tracked).
 *
 * Usage:
 *   node scripts/metaforecast/discover-page-forecasts.mjs [options]
 *
 * Options:
 *   --limit <n>         Only process N pages (for testing)
 *   --page <slug>       Process specific page
 *   --min-relevance <n> Minimum relevance score (0-1, default: 0.5)
 *   --dry-run           Preview without saving
 *   --verbose           Show detailed output
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import matter from 'gray-matter';
import { searchForecasts, scoreRelevance } from './lib/metaforecast-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const CONTENT_DIR = join(PROJECT_ROOT, 'src/content/docs/knowledge-base');
const OUTPUT_FILE = join(PROJECT_ROOT, 'src/data/page-forecasts.yaml');

// Parse args
const args = process.argv.slice(2);
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const SPECIFIC_PAGE = args.includes('--page') ? args[args.indexOf('--page') + 1] : null;
const MIN_RELEVANCE = args.includes('--min-relevance') ? parseFloat(args[args.indexOf('--min-relevance') + 1]) : 0.5;
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// =============================================================================
// PAGE SCANNING
// =============================================================================

/**
 * Recursively scan content directory for MDX files
 */
function scanPages(dir, baseDir = dir) {
  const pages = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      pages.push(...scanPages(fullPath, baseDir));
    } else if (entry.name.endsWith('.mdx')) {
      // Extract slug from path
      const relativePath = fullPath.replace(baseDir + '/', '').replace(/\.mdx$/, '');
      const slug = relativePath.replace(/\//g, '/');

      // Parse frontmatter
      const content = readFileSync(fullPath, 'utf-8');
      const { data: frontmatter, content: body } = matter(content);

      // Skip certain page types
      if (frontmatter.pageType === 'stub' || frontmatter.pageType === 'documentation') {
        continue;
      }

      pages.push({
        slug,
        title: frontmatter.title || slug,
        description: frontmatter.description || '',
        tags: frontmatter.tags || [],
        importance: frontmatter.importance || 50,
        path: fullPath,
        body: body.slice(0, 1000) // First 1000 chars for context
      });
    }
  }

  return pages;
}

/**
 * Generate search queries for a page
 */
function generateSearchQueries(page) {
  const queries = [];

  // Primary: page title
  queries.push({
    query: page.title,
    weight: 1.0,
    type: 'title'
  });

  // Secondary: tags
  if (page.tags && page.tags.length > 0) {
    for (const tag of page.tags.slice(0, 3)) { // Top 3 tags only
      queries.push({
        query: tag,
        weight: 0.7,
        type: 'tag'
      });
    }
  }

  // Tertiary: extract key phrases from description
  if (page.description) {
    const phrases = extractKeyPhrases(page.description);
    for (const phrase of phrases.slice(0, 2)) {
      queries.push({
        query: phrase,
        weight: 0.5,
        type: 'phrase'
      });
    }
  }

  return queries;
}

/**
 * Extract key phrases from text (simple heuristic)
 */
function extractKeyPhrases(text) {
  // Look for capitalized phrases (likely important concepts)
  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  return [...new Set(matches)]; // Deduplicate
}

// =============================================================================
// FORECAST DISCOVERY
// =============================================================================

/**
 * Find relevant forecasts for a page
 */
async function discoverForecastsForPage(page) {
  const queries = generateSearchQueries(page);
  const allForecasts = [];

  if (VERBOSE) {
    console.log(`\n  Searching with queries:`);
    for (const q of queries) {
      console.log(`    - "${q.query}" (${q.type}, weight: ${q.weight})`);
    }
  }

  // Execute searches
  for (const { query, weight, type } of queries) {
    try {
      const forecasts = await searchForecasts(query, {
        starsThreshold: 2, // Only quality forecasts
        limit: 5
      });

      for (const forecast of forecasts) {
        // Score relevance
        const relevance = scoreRelevance(page, forecast, type) * weight;

        if (relevance >= MIN_RELEVANCE) {
          allForecasts.push({
            ...forecast,
            relevance,
            discoveredVia: type
          });
        }
      }

      // Rate limiting: 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`    ✗ Search failed for "${query}": ${err.message}`);
    }
  }

  // Deduplicate by forecast ID, keeping highest relevance
  const uniqueForecasts = {};
  for (const f of allForecasts) {
    if (!uniqueForecasts[f.id] || f.relevance > uniqueForecasts[f.id].relevance) {
      uniqueForecasts[f.id] = f;
    }
  }

  // Sort by relevance
  return Object.values(uniqueForecasts)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10); // Max 10 forecasts per page
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🔍 Metaforecast Page-Forecast Discovery\n');

  // Load existing mappings (if any)
  let existingMappings = {};
  if (existsSync(OUTPUT_FILE)) {
    const yamlContent = readFileSync(OUTPUT_FILE, 'utf-8');
    existingMappings = parseYAML(yamlContent) || {};
    console.log(`   Loaded ${Object.keys(existingMappings).length} existing mappings\n`);
  }

  // Scan pages
  console.log('📄 Scanning wiki pages...');
  let pages = scanPages(CONTENT_DIR);

  if (SPECIFIC_PAGE) {
    pages = pages.filter(p => p.slug.includes(SPECIFIC_PAGE));
    if (pages.length === 0) {
      console.error(`No pages found matching: ${SPECIFIC_PAGE}`);
      process.exit(1);
    }
  }

  if (LIMIT) {
    pages = pages.slice(0, LIMIT);
  }

  console.log(`   Found ${pages.length} pages\n`);

  // Sort by importance (process important pages first)
  pages.sort((a, b) => b.importance - a.importance);

  // Process each page
  const results = { ...existingMappings };
  let processed = 0;
  let totalForecasts = 0;

  for (const page of pages) {
    processed++;
    const progress = `[${processed}/${pages.length}]`;

    console.log(`${progress} ${page.title}`);

    const forecasts = await discoverForecastsForPage(page);

    if (forecasts.length > 0) {
      results[page.slug] = {
        title: page.title,
        lastUpdated: new Date().toISOString().split('T')[0],
        forecasts: forecasts.map(f => ({
          id: f.id,
          title: f.title,
          url: f.url,
          platform: f.platform.label,
          stars: f.qualityIndicators.stars,
          relevance: parseFloat(f.relevance.toFixed(2)),
          discoveredVia: f.discoveredVia,
          // Store snapshot of probabilities
          probabilities: f.options.map(opt => ({
            name: opt.name,
            probability: opt.probability
          }))
        }))
      };

      totalForecasts += forecasts.length;
      console.log(`   ✓ Found ${forecasts.length} forecasts (relevance: ${forecasts[0].relevance.toFixed(2)} - ${forecasts[forecasts.length-1].relevance.toFixed(2)})`);
    } else {
      console.log(`   - No relevant forecasts found`);
    }
  }

  // Save results
  if (!DRY_RUN) {
    const yamlOutput = stringifyYAML(results, {
      indent: 2,
      lineWidth: 0 // Disable line wrapping
    });

    writeFileSync(OUTPUT_FILE, yamlOutput);
    console.log(`\n✅ Saved ${Object.keys(results).length} page mappings with ${totalForecasts} total forecasts`);
    console.log(`   Output: ${OUTPUT_FILE}`);
  } else {
    console.log(`\n📋 DRY RUN - would save ${Object.keys(results).length} page mappings`);
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log('Summary:');
  console.log(`  Pages processed: ${processed}`);
  console.log(`  Pages with forecasts: ${Object.keys(results).length}`);
  console.log(`  Total forecasts: ${totalForecasts}`);
  console.log(`  Avg forecasts/page: ${(totalForecasts / Math.max(Object.keys(results).length, 1)).toFixed(1)}`);
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
