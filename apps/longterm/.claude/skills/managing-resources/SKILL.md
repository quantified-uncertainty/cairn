---
name: managing-resources
description: Manage external resource links and citations. Use when converting markdown links to R components, checking resource database, or managing citations.
allowed-tools: Read, Edit, Grep, Glob, Bash
---

# Managing Resources Skill

This skill provides guidance for managing external resource links and citations.

## Overview

The wiki uses a resource database to track external sources (papers, blog posts, reports). Resources get:
- Stable IDs that don't break when URLs change
- Hover tooltips showing title, authors, summary
- Bidirectional tracking ("Cited By" on resource pages)

## Resource Manager Commands

```bash
# Discovery
npm run resources list                        # List pages with unconverted links
npm run resources -- show bioweapons          # Show unconverted links in specific file

# Conversion
npm run resources -- process lock-in --apply  # Convert links to <R> components

# Metadata
npm run resources -- metadata stats           # Show metadata coverage statistics
npm run resources -- metadata all             # Extract metadata from all sources
npm run resources -- rebuild-citations        # Rebuild cited_by relationships
```

## Using the `<R>` Component

For sources that exist in the resource database, use `<R>` instead of markdown links:

```mdx
import {R} from '../../../../components/wiki';

<!-- Basic usage - auto-fetches title -->
<R id="11ac11c30d3ab901" />

<!-- With custom label -->
<R id="11ac11c30d3ab901">Accident reports</R>

<!-- In tables -->
| Finding | Source |
|---------|--------|
| Pilots struggle | <R id="a9d7143ed49b479f">FAA studies</R> |
```

## Finding Resource IDs

When you have a URL and want to check if it's in the database:

```bash
npm run resources -- show expertise-atrophy  # Shows convertible links for a page
```

The output shows which URLs have matching resource IDs and can be converted.

## Adding Article Sources Section

To display all resources cited by an article, add at the end of the MDX file:

```mdx
import {ArticleSources} from '../../../../components/wiki';

<ArticleSources entityId="expertise-atrophy" client:load />
```

## Workflow for New Content

1. When citing an external source, first check if URL exists:
   ```bash
   npm run resources -- show [page-name]
   ```

2. If resource exists → use `<R id="{hash}">Label</R>`

3. If resource doesn't exist → use standard markdown link `[Label](url)`
   - The link will be tracked by the scan script
   - Can be converted to `<R>` later when added to database

4. Add `<ArticleSources entityId="..." />` at end of articles to show all cited resources

## Database Location

Resource data is stored in:
- `src/data/resources/` - Resource YAML files with metadata
- `.cache/` - SQLite database with cached content (gitignored)

## Benefits of Resource System

| Feature | Benefit |
|---------|---------|
| Hover tooltips | Shows title, authors, summary without leaving page |
| Bidirectional links | Resource pages show which articles cite them |
| Stable IDs | Links don't break when source URLs change |
| Metadata tracking | Consistent citation information across wiki |
