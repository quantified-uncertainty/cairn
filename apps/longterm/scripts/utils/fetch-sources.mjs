#!/usr/bin/env node

/**
 * Source Fetching Script (Firecrawl Edition)
 *
 * Fetches content from external source URLs using Firecrawl API.
 * Extracts clean markdown content and metadata (authors, dates).
 *
 * Usage:
 *   node scripts/fetch-sources.mjs [options]
 *
 * Options:
 *   --batch <n>          Number of sources to fetch (default: 20)
 *   --concurrency <n>    Parallel fetches (default: 3)
 *   --type <type>        Only fetch specific type: paper, blog, web, etc.
 *   --id <id>            Fetch a specific source by ID
 *   --retry-failed       Retry previously failed sources
 *   --dry-run            Show what would be fetched without fetching
 *   --verbose            Show detailed output
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import FirecrawlApp from '@mendable/firecrawl-js';
import { sources } from './lib/knowledge-db.mjs';
import { getColors } from './lib/output.mjs';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const CACHE_DIR = join(PROJECT_ROOT, '.cache', 'sources');

// Ensure cache directory exists
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

const args = process.argv.slice(2);

function getArg(name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return defaultValue;
  return args[index + 1] || defaultValue;
}

const BATCH_SIZE = parseInt(getArg('batch', '20'));
const CONCURRENCY = parseInt(getArg('concurrency', '3'));
const SOURCE_TYPE = getArg('type', null);
const SPECIFIC_ID = getArg('id', null);
const RETRY_FAILED = args.includes('--retry-failed');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

const colors = getColors();

// Initialize Firecrawl
const FIRECRAWL_KEY = process.env.FIRECRAWL_KEY;
if (!FIRECRAWL_KEY) {
  console.error(`${colors.red}Error: FIRECRAWL_KEY not found in environment${colors.reset}`);
  console.error('Add FIRECRAWL_KEY to your .env file');
  process.exit(1);
}

const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_KEY });

// =============================================================================
// FETCH LOGIC
// =============================================================================

/**
 * Fetch a single source using Firecrawl
 */
async function fetchSource(source) {
  const url = source.url;

  if (!url) {
    throw new Error('No URL provided');
  }

  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    });

    // Check if we got content (success is implicit if markdown exists)
    if (!result.markdown) {
      throw new Error(result.error || 'No content returned');
    }

    // Extract metadata
    const metadata = result.metadata || {};

    return {
      content: result.markdown,
      title: metadata.title || metadata.ogTitle || source.title || '',
      authors: extractAuthors(metadata),
      publishedDate: metadata.publishedTime || metadata.datePublished || metadata.citation_online_date || null,
      type: 'firecrawl',
      sourceUrl: metadata.sourceURL || url,
    };
  } catch (err) {
    // Re-throw with cleaner message
    throw new Error(err.message || 'Fetch failed');
  }
}

/**
 * Extract authors from Firecrawl metadata
 */
function extractAuthors(metadata) {
  // Try various metadata fields that might contain author info
  const authorFields = [
    'author',
    'authors',
    'DC.Contributor',  // Used by academic sites like RAND
    'DC.Creator',
    'article:author',
    'og:article:author',
    'citation_author',
  ];

  for (const field of authorFields) {
    const value = metadata[field];
    if (value) {
      if (Array.isArray(value)) {
        return value.filter(a => a && typeof a === 'string');
      }
      if (typeof value === 'string') {
        // Handle comma-separated authors
        if (value.includes(',') && !value.includes(' and ')) {
          return value.split(',').map(a => a.trim()).filter(Boolean);
        }
        return [value];
      }
    }
  }

  return null;
}

/**
 * Process sources sequentially with rate limiting (Firecrawl free tier: 10 req/min)
 */
async function processWithRateLimiting(items, processor, onProgress) {
  let completed = 0;
  let failed = 0;
  const DELAY_MS = 7000; // 7 seconds between requests = ~8.5 req/min (under 10 limit)

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const result = await processor(item);
      completed++;
      onProgress?.(i, item, result, null);
    } catch (err) {
      // Check for rate limit error and wait if needed
      if (err.message?.includes('Rate limit')) {
        const waitMatch = err.message.match(/retry after (\d+)s/);
        const waitTime = waitMatch ? parseInt(waitMatch[1]) * 1000 + 1000 : 60000;
        console.log(`   Waiting ${Math.round(waitTime/1000)}s for rate limit...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // Retry once after waiting
        try {
          const result = await processor(item);
          completed++;
          onProgress?.(i, item, result, null);
          continue;
        } catch (retryErr) {
          failed++;
          onProgress?.(i, item, null, retryErr);
        }
      } else {
        failed++;
        onProgress?.(i, item, null, err);
      }
    }

    // Wait between requests to stay under rate limit
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }

  return { completed, failed };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`${colors.blue}🔥 Source Fetcher (Firecrawl)${colors.reset}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  if (SOURCE_TYPE) console.log(`   Filter: ${SOURCE_TYPE}`);
  if (RETRY_FAILED) console.log(`   ${colors.yellow}Retrying failed sources${colors.reset}`);
  if (DRY_RUN) console.log(`   ${colors.yellow}DRY RUN - no fetching${colors.reset}`);
  console.log();

  // Get sources to fetch
  let pendingSources;

  if (SPECIFIC_ID) {
    const source = sources.get(SPECIFIC_ID);
    if (!source) {
      console.error(`${colors.red}Source not found: ${SPECIFIC_ID}${colors.reset}`);
      process.exit(1);
    }
    pendingSources = [source];
  } else if (RETRY_FAILED) {
    pendingSources = sources.getFailed(BATCH_SIZE);
  } else {
    pendingSources = sources.getPending(BATCH_SIZE);
  }

  // Filter by type if specified
  if (SOURCE_TYPE && !SPECIFIC_ID) {
    pendingSources = pendingSources.filter(s => s.source_type === SOURCE_TYPE);
  }

  // Filter out sources without URLs
  pendingSources = pendingSources.filter(s => s.url);

  if (pendingSources.length === 0) {
    console.log(`${colors.green}✅ No sources to fetch${colors.reset}`);

    // Show stats
    const stats = sources.stats();
    console.log(`\n${colors.blue}Stats:${colors.reset}`);
    console.log(`  Pending: ${stats.pending}`);
    console.log(`  Fetched: ${stats.fetched}`);
    console.log(`  Failed: ${stats.failed}`);
    process.exit(0);
  }

  console.log(`Found ${pendingSources.length} sources to fetch\n`);

  if (DRY_RUN) {
    console.log('Would fetch:');
    for (const source of pendingSources) {
      console.log(`  ${source.title || source.url}`);
    }
    process.exit(0);
  }

  // Process sources
  const onProgress = (index, source, result, error) => {
    const progress = `[${index + 1}/${pendingSources.length}]`;
    const title = source.title || (source.url ? source.url.slice(0, 50) : source.id);

    if (error) {
      console.log(`${colors.cyan}${progress}${colors.reset} ${title}`);
      console.log(`   ${colors.red}✗ ${error.message}${colors.reset}`);

      // Mark as failed in database
      sources.markFailed(source.id, error.message);
    } else {
      console.log(`${colors.cyan}${progress}${colors.reset} ${title}`);
      const chars = result.content?.length || 0;
      const authorInfo = result.authors ? ` by ${result.authors.join(', ')}` : '';
      console.log(`   ${colors.green}✓ ${chars.toLocaleString()} chars${authorInfo}${colors.reset}`);

      // Save content to database
      const cacheFile = `${source.id}.txt`;
      sources.markFetched(source.id, result.content, cacheFile);

      // Update source with extracted metadata (authors, date)
      if (result.authors || result.publishedDate) {
        sources.updateMetadata(source.id, {
          authors: result.authors,
          year: result.publishedDate ? new Date(result.publishedDate).getFullYear() : null,
        });
      }

      // Also save to cache file for backup
      if (result.content) {
        const cachePath = join(CACHE_DIR, `${source.id}.txt`);
        try {
          writeFileSync(cachePath, result.content);
        } catch (err) {
          // Ignore cache write errors
        }
      }
    }
  };

  const { completed, failed } = await processWithRateLimiting(
    pendingSources,
    fetchSource,
    onProgress
  );

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${colors.green}✅ Fetch complete${colors.reset}\n`);
  console.log(`  Successful: ${completed}`);
  console.log(`  Failed: ${failed}`);

  // Show remaining stats
  const stats = sources.stats();
  console.log(`\n${colors.blue}Remaining:${colors.reset}`);
  console.log(`  Pending: ${stats.pending}`);
  console.log(`  Fetched: ${stats.fetched}`);
  console.log(`  Failed: ${stats.failed}`);
}

main().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
