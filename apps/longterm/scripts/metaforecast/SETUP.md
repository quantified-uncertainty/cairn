# Metaforecast Integration Setup Guide

Quick start guide for integrating Metaforecast forecasts into the LongtermWiki wiki.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Internet connection (for Metaforecast API)

## Step 1: Install Dependencies

The necessary dependencies are already in `package.json`. No additional packages needed.

```bash
pnpm install
```

## Step 2: Test the Integration (Single Page)

Let's start by testing on a single page to make sure everything works.

```bash
# Discover forecasts for the bioweapons page
npm run forecasts:discover -- --page bioweapons --verbose

# Check the output
cat src/data/page-forecasts.yaml
```

**Expected output:**
- You should see a YAML file with forecasts related to bioweapons
- Each forecast has: id, title, url, platform, stars, relevance, probabilities

## Step 3: Full Discovery (All Pages)

Once the single-page test works, run discovery for all pages:

```bash
# Process top 50 pages by importance (recommended for first run)
npm run forecasts:discover -- --limit 50

# Or process all pages (will take 15-30 minutes)
npm run forecasts:discover
```

**What this does:**
- Scans all wiki pages in `src/content/docs/knowledge-base/`
- For each page, searches Metaforecast for relevant forecasts
- Saves results to `src/data/page-forecasts.yaml`

**Rate limiting:**
- 1 request per second to Metaforecast API
- 3 queries per page (title, tags, key phrases)
- Total time: ~3 seconds per page

## Step 4: Update Tracked Forecasts

Now fetch fresh probability data for the discovered forecasts:

```bash
npm run forecasts:update
```

**What this does:**
- Extracts all forecast IDs from `page-forecasts.yaml`
- Fetches current probabilities from Metaforecast API
- Saves to `src/data/tracked-forecasts.yaml` with history

## Step 5: Add Forecasts to a Wiki Page

Edit a wiki page to display forecasts:

```mdx
---
title: "Bioweapons"
---

import {PageForecasts} from '../../../../components/forecasts';
import '../../../../components/forecasts/forecasts.css';

## Overview

[Your content here...]

## Related Forecasts

<PageForecasts
  pageSlug="knowledge-base/risks/misuse/bioweapons"
  client:load
/>
```

**Important:** Use `client:load` directive for React components in Astro.

## Step 6: Build and Preview

```bash
# Build static site
npm run build

# Or start dev server
npm run dev
```

Visit the page and you should see forecast cards with:
- Forecast title (linked to source)
- Platform badge (Metaculus, Manifold, etc.)
- Quality stars (★★★★☆)
- Probability bars
- Last update date

## Step 7: Set Up Automated Updates

Add a cron job or CI workflow to keep forecasts fresh:

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/update-forecasts.yml`:

```yaml
name: Update Forecasts

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6am UTC
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm forecasts:update

      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: update forecasts"
          file_pattern: "src/data/tracked-forecasts.yaml"
```

### Option B: Local Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add daily update at 6am
0 6 * * * cd /path/to/longtermwiki/apps/longterm && pnpm forecasts:update && git commit -am "chore: update forecasts" && git push
```

## Verification Checklist

✅ **Discovery works:**
```bash
npm run forecasts:discover -- --page bioweapons
# Should create src/data/page-forecasts.yaml
```

✅ **Update works:**
```bash
npm run forecasts:update
# Should create/update src/data/tracked-forecasts.yaml
```

✅ **API endpoint works:**
```bash
npm run dev
# Visit: http://localhost:3000/api/forecasts/[any-forecast-id]
# Should return JSON
```

✅ **Component renders:**
- Add `<PageForecasts>` to an MDX page
- Start dev server
- Visit the page
- Should see forecast cards

## Troubleshooting

### No forecasts found

**Problem:** `page-forecasts.yaml` is empty or has no forecasts for a page.

**Solutions:**
1. Check page title/tags are relevant to forecasting topics
2. Lower relevance threshold: `--min-relevance 0.3`
3. Check Metaforecast manually: https://metaforecast.org
4. Run with `--verbose` to see search queries

### API errors

**Problem:** "Metaforecast API error: HTTP 500" or timeouts

**Solutions:**
1. Check https://metaforecast.org is accessible
2. Try again later (API may be temporarily down)
3. Increase rate limiting in `lib/metaforecast-client.mjs`

### Component not rendering

**Problem:** Forecast cards don't appear on the page.

**Solutions:**
1. Check you used `client:load` directive
2. Import CSS: `import '../../../../components/forecasts/forecasts.css'`
3. Check browser console for errors
4. Verify `pageSlug` matches exactly the key in `page-forecasts.yaml`

### Build errors

**Problem:** "Cannot find module 'yaml'" or similar

**Solutions:**
1. Ensure `yaml` is in `package.json` dependencies (it should be)
2. Run `pnpm install`
3. Clear `.astro` cache: `rm -rf .astro`

## Next Steps

Once the basic integration works:

1. **Add forecasts to more pages:**
   - Identify high-importance pages that would benefit
   - Add `<PageForecasts>` components

2. **Customize display:**
   - Adjust `limit` prop (default: 5)
   - Set `minRelevance` (default: 0.5)
   - Enable `showRelevance` to debug scoring

3. **Set up automation:**
   - Add GitHub Actions for daily updates
   - Consider weekly full rediscovery

4. **Monitor quality:**
   - Review relevance scores periodically
   - Remove low-quality mappings manually if needed
   - Adjust scoring algorithm in `scoreRelevance()` if needed

## Cost Estimates

**Time:**
- Initial discovery (300 pages): ~15-30 minutes
- Daily updates (100 forecasts): ~2-3 minutes
- CI build with updates: +2-3 minutes

**API Usage:**
- Discovery: 3 requests per page
- Updates: 1 request per tracked forecast
- No rate limits documented for Metaforecast (public API)

**Storage:**
- `page-forecasts.yaml`: ~200-500 KB
- `tracked-forecasts.yaml`: ~100-300 KB
- Total: <1 MB (git-friendly)

## Support

**Documentation:**
- Full docs: `scripts/metaforecast/README.md`
- Metaforecast API: https://metaforecast.org/api/graphql
- Metaforecast docs: Search for "@quantified-uncertainty/metaforecast"

**Issues:**
- Metaforecast bugs: https://github.com/quantified-uncertainty/squiggle/issues
- Integration bugs: Open issue in this repo
