# Metaforecast Integration

Two-tier system for integrating forecasts from [Metaforecast](https://metaforecast.org) into the LongtermWiki wiki.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Tier 1: Static Discovery                 │
│                 (Weekly/Monthly via CI or manual)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Scans all wiki pages
                              │ Searches Metaforecast for relevant forecasts
                              │ Scores relevance
                              ▼
                    page-forecasts.yaml
                  (git-tracked, static data)
                              │
                              ├──→ Used by PageForecasts component
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tier 2: Live Updates                       │
│              (Hourly/Daily for tracked forecasts)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Extracts forecast IDs from page-forecasts.yaml
                              │ Fetches fresh probabilities from Metaforecast API
                              │ Stores history for trend analysis
                              ▼
                  tracked-forecasts.yaml
                  (git-tracked, updated frequently)
                              │
                              ├──→ Used by ForecastCard component
                              │    (with live API fallback via /api/forecasts/[id])
                              ▼
                    Wiki pages with <PageForecasts />
```

## Quick Start

### 1. Discover Forecasts for All Pages (Tier 1)

```bash
# Discover relevant forecasts for all wiki pages
npm run forecasts:discover

# Test on a single page
npm run forecasts:discover -- --page bioweapons --verbose

# Process only top 10 pages (by importance)
npm run forecasts:discover -- --limit 10
```

**Output:** `src/data/page-forecasts.yaml` containing page → forecasts mappings

**Example output:**
```yaml
knowledge-base/risks/misuse/bioweapons:
  title: "Bioweapons"
  lastUpdated: "2025-01-29"
  forecasts:
    - id: "metaculus-12345"
      title: "Will there be a bioweapon attack by 2030?"
      url: "https://metaculus.com/questions/12345"
      platform: "Metaculus"
      stars: 4
      relevance: 0.92
      discoveredVia: "title"
      probabilities:
        - name: "Yes"
          probability: 0.23
        - name: "No"
          probability: 0.77
```

### 2. Update Tracked Forecasts (Tier 2)

```bash
# Update forecasts that are >6 hours old
npm run forecasts:update

# Force update all forecasts
npm run forecasts:update -- --force

# Update only if >24 hours old
npm run forecasts:update -- --min-age 24
```

**Output:** `src/data/tracked-forecasts.yaml` with fresh probabilities and history

**Example output:**
```yaml
metaculus-12345:
  id: "metaculus-12345"
  title: "Will there be a bioweapon attack by 2030?"
  url: "https://metaculus.com/questions/12345"
  platform: "Metaculus"
  stars: 4
  numForecasters: 156
  lastUpdated: "2025-01-29T10:30:00.000Z"
  fetched: "2025-01-29T10:25:00.000Z"
  referencedBy:
    - pageSlug: "knowledge-base/risks/misuse/bioweapons"
      pageTitle: "Bioweapons"
      relevance: 0.92
  options:
    - name: "Yes"
      probability: 0.23
    - name: "No"
      probability: 0.77
  history:
    - timestamp: "2025-01-28T10:25:00.000Z"
      options:
        - name: "Yes"
          probability: 0.22
        - name: "No"
          probability: 0.78
    - timestamp: "2025-01-29T10:25:00.000Z"
      options:
        - name: "Yes"
          probability: 0.23
        - name: "No"
          probability: 0.77
```

### 3. Full Refresh (Both Tiers)

```bash
# Run discovery + update in sequence
npm run forecasts:refresh
```

## Usage in Wiki Pages

### Display All Relevant Forecasts for a Page

```mdx
---
title: "Bioweapons"
---

import {PageForecasts} from '../../../../components/forecasts';

## Overview

[Page content...]

<PageForecasts pageSlug="knowledge-base/risks/misuse/bioweapons" client:load />
```

**Props:**
- `pageSlug` (required): Page path matching key in page-forecasts.yaml
- `limit` (optional): Max forecasts to show (default: 5)
- `minRelevance` (optional): Filter by relevance score (default: 0.5)
- `showRelevance` (optional): Display relevance scores (default: false)

### Display a Single Forecast

```mdx
import {ForecastCard} from '../../../../components/forecasts';

<ForecastCard id="metaculus-12345" client:load />
```

**Props:**
- `id` (required): Metaforecast forecast ID
- `showHistory` (optional): Display probability history chart (default: false)
- `compact` (optional): Compact layout (default: false)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Update Forecasts

on:
  schedule:
    # Tier 1: Run discovery weekly (Sundays at 6am UTC)
    - cron: '0 6 * * 0'
    # Tier 2: Run updates daily (every day at 6am UTC)
    - cron: '0 6 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  update-forecasts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install

      # Tier 1: Discovery (weekly)
      - name: Discover forecasts
        if: github.event.schedule == '0 6 * * 0'
        run: pnpm forecasts:discover

      # Tier 2: Update (daily)
      - name: Update tracked forecasts
        run: pnpm forecasts:update

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: update forecasts data"
          file_pattern: "src/data/*-forecasts.yaml"
```

## Data Files

### `src/data/page-forecasts.yaml` (Tier 1)

**Updated:** Weekly/monthly
**Purpose:** Static mapping of wiki pages → relevant forecasts
**Git-tracked:** Yes
**Size:** ~100-500 KB (depends on number of pages)

### `src/data/tracked-forecasts.yaml` (Tier 2)

**Updated:** Hourly/daily
**Purpose:** Live forecast data with probability history
**Git-tracked:** Yes
**Size:** ~50-200 KB (depends on number of tracked forecasts)

## Scripts Reference

### `discover-page-forecasts.mjs`

Scans wiki pages and discovers relevant forecasts.

**Options:**
- `--limit <n>` - Process only N pages (for testing)
- `--page <slug>` - Process specific page
- `--min-relevance <n>` - Minimum relevance score (0-1, default: 0.5)
- `--dry-run` - Preview without saving
- `--verbose` - Show detailed output

**Algorithm:**
1. Scan all MDX files in `src/content/docs/knowledge-base/`
2. Extract title, description, tags, importance
3. Generate search queries:
   - Primary: page title (weight: 1.0)
   - Secondary: tags (weight: 0.7)
   - Tertiary: key phrases from description (weight: 0.5)
4. Search Metaforecast API for each query (stars ≥ 2, limit: 5 per query)
5. Score relevance based on:
   - Discovery method (title > tag > phrase)
   - Quality indicators (stars, num forecasters)
   - Title overlap
   - Recency
6. Deduplicate and keep top 10 per page
7. Save to `page-forecasts.yaml`

### `update-tracked-forecasts.mjs`

Fetches fresh probabilities for tracked forecasts.

**Options:**
- `--force` - Update all, ignore cache age
- `--min-age <hours>` - Only update if older than N hours (default: 6)
- `--dry-run` - Preview without saving
- `--verbose` - Show detailed output

**Algorithm:**
1. Extract all forecast IDs from `page-forecasts.yaml`
2. Load existing `tracked-forecasts.yaml` cache
3. Filter to forecasts older than `--min-age` hours
4. Batch fetch from Metaforecast API (1 req/sec rate limit)
5. Update probabilities and append to history (keep last 10 data points)
6. Save to `tracked-forecasts.yaml`

### `lib/metaforecast-client.mjs`

GraphQL client for Metaforecast API.

**Functions:**
- `searchForecasts(query, options)` - Search for forecasts
- `getForecast(id)` - Get single forecast by ID
- `getForecastsBatch(ids)` - Batch fetch forecasts
- `scoreRelevance(page, forecast, type)` - Score relevance (0-1)
- `getPlatforms()` - List supported platforms

## API Endpoint

### `GET /api/forecasts/[id]`

Server-side API endpoint with caching.

**Behavior:**
1. Check in-memory cache (TTL: 6 hours)
2. If miss, fetch from Metaforecast API
3. If API fails, fallback to `tracked-forecasts.yaml`
4. Return 404 if not found

**Response:**
```json
{
  "id": "metaculus-12345",
  "title": "Will there be...",
  "url": "https://metaculus.com/questions/12345",
  "platform": { "label": "Metaculus" },
  "options": [
    { "name": "Yes", "probability": 0.23 },
    { "name": "No", "probability": 0.77 }
  ],
  "qualityIndicators": {
    "stars": 4,
    "numForecasters": 156
  },
  "fetched": "2025-01-29T10:25:00.000Z"
}
```

**Fallback response** (when using cached data):
```json
{
  "_cached": true,
  "_cacheDate": "2025-01-29",
  ...
}
```

## Relevance Scoring

Forecasts are scored 0-1 based on:

| Factor | Weight | Details |
|--------|--------|---------|
| Discovery method | 0.4-0.8 | Title match (0.8) > Tag match (0.6) > Phrase match (0.4) |
| Quality stars | +0.0 to +0.2 | Linear scale: 5★ = +0.2, 3★ = +0.12, 1★ = +0.04 |
| Num forecasters | +0.05 to +0.1 | 50+ forecasters: +0.1, 10-50: +0.05 |
| Title word overlap | +0.05 per word | Page title ∩ forecast title (max 3 words) |
| Recency penalty | ×0.8 | If forecast >6 months old |
| No overlap penalty | ×0.7 | If title match but zero word overlap |

**Example calculations:**

```
Forecast A: "Will AGI be developed by 2030?"
Page: "AGI Timelines"
- Discovery: title match (0.8)
- Stars: 4★ (+0.16)
- Forecasters: 120 (+0.1)
- Word overlap: "AGI" (+0.05)
- Age: 3 months (no penalty)
= 0.8 + 0.16 + 0.1 + 0.05 = 1.0 (capped at 1.0)
✓ High relevance

Forecast B: "Will superintelligence exist by 2035?"
Page: "AGI Timelines"
- Discovery: tag match (0.6)
- Stars: 2★ (+0.08)
- Forecasters: 8 (no bonus)
- Word overlap: 0 (×0.7 penalty)
- Age: 8 months (×0.8 penalty)
= (0.6 + 0.08) × 0.7 × 0.8 = 0.38
✗ Below default threshold (0.5)
```

## Rate Limits

**Metaforecast API:**
- No documented rate limit
- Recommended: 1 request/second (implemented in scripts)
- Typical response time: 200-500ms

**Cost estimates:**
- Discovery (300 pages × 3 queries × 1s): ~15 minutes
- Update (100 forecasts × 1s): ~2 minutes

## Troubleshooting

### No forecasts found for page

**Possible causes:**
1. Page title too specific (e.g., "Advanced AI Safety Techniques" vs "AI Safety")
2. No forecasts exist for this topic on supported platforms
3. Relevance threshold too high

**Solutions:**
- Run with `--verbose` to see search queries and scores
- Lower `--min-relevance` (e.g., `--min-relevance 0.3`)
- Add better tags to page frontmatter
- Manually add forecast IDs to page-forecasts.yaml

### API errors

**Timeout:**
- Increase rate limiting delay in `metaforecast-client.mjs`

**404 errors:**
- Forecast may have been deleted from platform
- Update page-forecasts.yaml to remove dead IDs

### Stale data on frontend

**Issue:** ForecastCard shows old probabilities

**Solution:**
1. Check `/api/forecasts/[id]` cache TTL (default: 6h)
2. Run `npm run forecasts:update -- --force`
3. Clear browser cache
4. Restart dev server

## Future Enhancements

**Planned:**
- [ ] Probability change alerts (email/Slack when >10% shift)
- [ ] Forecast comparison charts (show multiple forecasts side-by-side)
- [ ] Historical trend visualization (line charts)
- [ ] Platform filtering in PageForecasts component
- [ ] Embed forecasts in DataEstimateBox for comparison with expert estimates

**Potential:**
- [ ] AI-powered relevance scoring (use LLM to judge relevance)
- [ ] Forecast quality weighting (adjust by platform track record)
- [ ] Community curation (upvote/downvote forecast relevance)
- [ ] RSS feed for new/updated forecasts

## Related Files

```
scripts/metaforecast/
├── README.md                           # This file
├── discover-page-forecasts.mjs         # Tier 1: Discovery
├── update-tracked-forecasts.mjs        # Tier 2: Updates
└── lib/
    └── metaforecast-client.mjs         # API client

src/data/
├── page-forecasts.yaml                 # Static page mappings
└── tracked-forecasts.yaml              # Live forecast data

src/pages/api/forecasts/
└── [id].ts                             # API endpoint

src/components/forecasts/
├── ForecastCard.tsx                    # Single forecast display
├── PageForecasts.tsx                   # Page forecast collection
├── forecasts.css                       # Styles
└── index.ts                            # Exports
```
