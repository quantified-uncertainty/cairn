#!/usr/bin/env node

/**
 * Update Tracked Forecasts
 *
 * Fetches fresh data for forecasts that are actively referenced in wiki pages.
 * Updates src/data/tracked-forecasts.yaml with latest probabilities.
 *
 * This runs more frequently than discovery (hourly/daily vs weekly/monthly).
 *
 * Usage:
 *   node scripts/metaforecast/update-tracked-forecasts.mjs [options]
 *
 * Options:
 *   --force             Update all, ignore cache age
 *   --min-age <hours>   Only update if cached data is older than N hours (default: 6)
 *   --dry-run           Preview without saving
 *   --verbose           Show detailed output
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse as parseYAML, stringify as stringifyYAML } from 'yaml';
import { getForecastsBatch } from './lib/metaforecast-client.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const PAGE_FORECASTS_FILE = join(PROJECT_ROOT, 'src/data/page-forecasts.yaml');
const TRACKED_FORECASTS_FILE = join(PROJECT_ROOT, 'src/data/tracked-forecasts.yaml');

// Parse args
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const MIN_AGE_HOURS = args.includes('--min-age') ? parseInt(args[args.indexOf('--min-age') + 1]) : 6;
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// =============================================================================
// TRACKED FORECAST EXTRACTION
// =============================================================================

/**
 * Extract all forecast IDs from page-forecasts.yaml that should be tracked
 */
function extractTrackedForecastIds() {
  if (!existsSync(PAGE_FORECASTS_FILE)) {
    console.error('❌ page-forecasts.yaml not found. Run discover-page-forecasts.mjs first.');
    process.exit(1);
  }

  const yamlContent = readFileSync(PAGE_FORECASTS_FILE, 'utf-8');
  const pageMappings = parseYAML(yamlContent) || {};

  const forecastIds = new Set();
  const forecastMeta = {}; // Store basic metadata

  for (const [pageSlug, pageData] of Object.entries(pageMappings)) {
    if (!pageData.forecasts) continue;

    for (const forecast of pageData.forecasts) {
      forecastIds.add(forecast.id);

      if (!forecastMeta[forecast.id]) {
        forecastMeta[forecast.id] = {
          title: forecast.title,
          url: forecast.url,
          platform: forecast.platform,
          stars: forecast.stars,
          referencedBy: []
        };
      }

      forecastMeta[forecast.id].referencedBy.push({
        pageSlug,
        pageTitle: pageData.title,
        relevance: forecast.relevance
      });
    }
  }

  return { ids: Array.from(forecastIds), meta: forecastMeta };
}

/**
 * Load existing tracked forecasts cache
 */
function loadTrackedForecasts() {
  if (!existsSync(TRACKED_FORECASTS_FILE)) {
    return {};
  }

  const yamlContent = readFileSync(TRACKED_FORECASTS_FILE, 'utf-8');
  return parseYAML(yamlContent) || {};
}

/**
 * Filter forecast IDs that need updating based on cache age
 */
function filterStaleForecasts(forecastIds, trackedForecasts) {
  if (FORCE) {
    return forecastIds;
  }

  const now = Date.now();
  const maxAge = MIN_AGE_HOURS * 60 * 60 * 1000; // Convert hours to ms

  return forecastIds.filter(id => {
    const cached = trackedForecasts[id];
    if (!cached || !cached.lastUpdated) {
      return true; // No cache = needs update
    }

    const age = now - new Date(cached.lastUpdated).getTime();
    return age > maxAge;
  });
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('📊 Update Tracked Forecasts\n');

  // Extract forecast IDs to track
  console.log('📄 Extracting tracked forecast IDs from page-forecasts.yaml...');
  const { ids: allForecastIds, meta: forecastMeta } = extractTrackedForecastIds();
  console.log(`   Found ${allForecastIds.length} unique forecasts\n`);

  // Load existing cache
  console.log('💾 Loading existing tracked-forecasts.yaml...');
  const trackedForecasts = loadTrackedForecasts();
  const cachedCount = Object.keys(trackedForecasts).length;
  console.log(`   Found ${cachedCount} cached forecasts\n`);

  // Filter to only stale forecasts
  const staleIds = filterStaleForecasts(allForecastIds, trackedForecasts);

  if (staleIds.length === 0) {
    console.log(`✅ All forecasts are fresh (< ${MIN_AGE_HOURS} hours old)`);
    console.log(`   Use --force to update anyway`);
    return;
  }

  console.log(`🔄 Updating ${staleIds.length} stale forecasts (> ${MIN_AGE_HOURS}h old)...\n`);

  if (DRY_RUN) {
    console.log('📋 DRY RUN - would update:');
    for (const id of staleIds.slice(0, 10)) {
      console.log(`   - ${forecastMeta[id].title}`);
    }
    if (staleIds.length > 10) {
      console.log(`   ... and ${staleIds.length - 10} more`);
    }
    return;
  }

  // Fetch fresh data
  console.log('🌐 Fetching from Metaforecast API...');
  const freshForecasts = await getForecastsBatch(staleIds);
  console.log(`   Fetched ${freshForecasts.length} forecasts\n`);

  // Update tracked forecasts
  const now = new Date().toISOString();
  let updated = 0;

  for (const forecast of freshForecasts) {
    const meta = forecastMeta[forecast.id];

    trackedForecasts[forecast.id] = {
      id: forecast.id,
      title: forecast.title,
      url: forecast.url,
      platform: forecast.platform.label,
      stars: forecast.qualityIndicators.stars,
      numForecasters: forecast.qualityIndicators.numForecasters,
      numForecasts: forecast.qualityIndicators.numForecasts,
      lastUpdated: now,
      fetched: forecast.fetched,
      firstSeen: forecast.firstSeen,
      referencedBy: meta.referencedBy,
      options: forecast.options.map(opt => ({
        name: opt.name,
        probability: opt.probability
      })),
      // Store history (keep last 10 data points)
      history: [
        ...(trackedForecasts[forecast.id]?.history || []).slice(-9),
        {
          timestamp: forecast.fetched,
          options: forecast.options.map(opt => ({
            name: opt.name,
            probability: opt.probability
          }))
        }
      ]
    };

    updated++;

    if (VERBOSE) {
      console.log(`   ✓ ${forecast.title}`);
      const probs = forecast.options.map(o => `${o.name}: ${(o.probability * 100).toFixed(1)}%`).join(', ');
      console.log(`     ${probs}`);
    }
  }

  // Save results
  const yamlOutput = stringifyYAML(trackedForecasts, {
    indent: 2,
    lineWidth: 0
  });

  writeFileSync(TRACKED_FORECASTS_FILE, yamlOutput);

  console.log(`\n✅ Updated ${updated} forecasts`);
  console.log(`   Output: ${TRACKED_FORECASTS_FILE}`);

  // Summary stats
  const totalTracked = Object.keys(trackedForecasts).length;
  const avgHistoryLength = Object.values(trackedForecasts)
    .reduce((sum, f) => sum + (f.history?.length || 0), 0) / totalTracked;

  console.log(`\n${'─'.repeat(50)}`);
  console.log('Summary:');
  console.log(`  Total tracked: ${totalTracked}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Avg history length: ${avgHistoryLength.toFixed(1)} data points`);
}

main().catch(err => {
  console.error(`\n❌ Fatal error: ${err.message}`);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
