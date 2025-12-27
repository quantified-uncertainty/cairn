# Claude Code Workflows

This document describes available workflows for Claude Code when working with this project.

## Content Quality System

### Available Validators

Run all validators:
```bash
npm run validate
```

Individual validators:
```bash
npm run validate:style        # Style guide compliance
npm run validate:staleness    # Content freshness
npm run validate:consistency  # Cross-page consistency
npm run validate:data         # Entity data integrity
npm run validate:links        # Internal link validation
npm run validate:mdx          # MDX syntax validation
npm run validate:sidebar      # Sidebar configuration (index pages)
npm run validate:types        # UI components handle all schema entity types
```

### Workflow: Validate Content

When editing or creating content, run validation to check for issues:

1. Run style guide check: `npm run validate:style`
2. Check for consistency issues: `npm run validate:consistency`
3. Verify all links work: `npm run validate:links`
4. Run full suite: `npm run validate`

### Workflow: Create New Model Page

To create a new analytical model page:

1. Create a YAML file with the required structure (see `src/data/content-schemas.ts`)
2. Run the generator:
   ```bash
   node scripts/generate-content.mjs --type model --file input.yaml
   ```
3. Add the entity to `src/data/entities.yaml`
4. Rebuild data: `npm run build:data`
5. Validate: `npm run validate`

### Workflow: Create New Risk Page

Same as model, but use `--type risk`:
```bash
node scripts/generate-content.mjs --type risk --file input.yaml
```

### Workflow: Create New Response Page

Same as model, but use `--type response`:
```bash
node scripts/generate-content.mjs --type response --file input.yaml
```

### Workflow: Check Content Staleness

To find content that needs review:
```bash
npm run validate:staleness
```

This checks:
- Pages past their `reviewBy` date
- Pages with updated dependencies
- Pages not edited within threshold (90 days for models, 60 for risks)

### Workflow: Find Entity Gaps

To find risks without responses, responses without risks, or orphaned entities:

1. Visit the dashboard at `/dashboard/`
2. Or run the consistency checker: `npm run validate:consistency`

## Style Guide Requirements

### Model Pages

Required sections:
- Overview (2-3 paragraphs)
- Conceptual Framework (diagram + explanation)
- Quantitative Analysis (tables with uncertainty ranges)
- Strategic Importance (magnitude, comparative ranking, resource implications, key cruxes)
- Limitations

Required frontmatter:
```yaml
title: "Model Title"
description: "This model [methodology]. It estimates/finds that [key conclusion with numbers]."
quality: 3  # 1-5
lastEdited: "2025-12-26"
ratings:
  novelty: 4
  rigor: 3
  actionability: 4
  completeness: 3
```

**Critical: Executive Summary in Description**

The `description` field MUST include both methodology AND conclusions. This is shown in previews.

Good: "This model estimates AI's marginal contribution to bioweapons risk. It finds current LLMs provide 1.3-2.5x uplift for non-experts."

Bad: "Analysis of AI bioweapons risk" (no conclusion)

### Risk Pages

Required sections:
- Overview (2-3 paragraphs)
- Risk Assessment (table with severity, likelihood, timeline)
- Responses That Address This Risk (cross-links)
- Why This Matters
- Key Uncertainties

### Response Pages

Required sections:
- Overview (2-3 paragraphs)
- Quick Assessment (table with tractability, grades)
- Risks Addressed (cross-links)
- How It Works
- Critical Assessment

## Mermaid Diagram Guidelines

- Use `<Mermaid client:load chart={`...`} />` component (not code blocks)
- Prefer vertical flowcharts (`TD`) over horizontal (`LR`)
- Maximum 15 nodes per diagram
- Maximum 3 subgraphs
- Use semantic colors (red for risks, green for interventions)

## Data Layer

### Entity Types

Available entity types (defined in `src/data/schema.ts`):
- risk, risk-factor
- safety-agenda, intervention, policy
- capability, model, crux, concept
- organization, lab, lab-frontier
- researcher, funder

### Building Data

After editing `src/data/*.yaml` files:
```bash
npm run build:data
```

This regenerates:
- `database.json`
- `entities.json`
- `backlinks.json`
- `tagIndex.json`
- `pathRegistry.json`

## Dashboard

View content quality metrics at `/dashboard/`:
- Quality distribution
- Content by type
- Recently updated entities
- Entity gaps (risks without responses, etc.)

View entity relationships at `/dashboard/graph/`:
- Interactive graph visualization
- Cluster detection
- Orphan highlighting

## Project Structure

### Sidebar Configuration

**IMPORTANT:** The sidebar is manually configured in `astro.config.mjs`, NOT auto-generated from the file system.

When moving, renaming, or creating new content directories:
1. Update `astro.config.mjs` sidebar configuration (around line 45-80)
2. The sidebar uses `autogenerate: { directory: '...' }` for directories
3. Use `slug: '...'` for individual pages
4. User must restart dev server after config changes

Example sidebar entry:
```javascript
{ label: 'Compute Governance', collapsed: true, autogenerate: { directory: 'knowledge-base/responses/governance/compute-governance' } },
```

### Sidebar Ordering Rules

**Index/Overview pages:**
- Always use `sidebar: order: 0` and `label: Overview`
- This ensures the section overview appears first in the sidebar
- Run `npm run validate:sidebar` to check all index pages are correct

**Sub-pages:**
- Use `order: 1, 2, 3...` for logical ordering
- Without explicit order, pages sort alphabetically by filename

Example frontmatter for an index page:
```yaml
sidebar:
  label: Overview
  order: 0
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Sidebar structure, site config |
| `src/data/entities.yaml` | Entity definitions for cross-linking |
| `src/data/schema.ts` | Entity type definitions |
| `src/content/config.ts` | Content collection schemas |

## Knowledge Base System

A SQLite-based system for managing article content, source references, and AI-generated summaries.

### Setup

Requires `.env` file with:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Commands

```bash
npm run kb:scan        # Scan MDX files, extract sources, populate database
npm run kb:summarize   # Generate AI summaries (uses Haiku by default)
npm run kb:stats       # Show database statistics
```

### Detailed Usage

```bash
# Scan content (run after editing MDX files)
node scripts/scan-content.mjs
node scripts/scan-content.mjs --force    # Rescan all files
node scripts/scan-content.mjs --verbose  # Show per-file progress

# Generate summaries
node scripts/generate-summaries.mjs --batch 50           # Summarize 50 articles
node scripts/generate-summaries.mjs --type sources       # Summarize sources instead
node scripts/generate-summaries.mjs --model sonnet       # Use Sonnet (more expensive)
node scripts/generate-summaries.mjs --id deceptive-alignment  # Specific article
node scripts/generate-summaries.mjs --dry-run            # Preview without API calls
```

### Database Location

All cached data is stored in `.cache/` (gitignored):
- `.cache/knowledge.db` - SQLite database with articles, sources, summaries
- `.cache/sources/` - Fetched source documents (PDFs, HTML, text)

### Cost Estimates

| Task | Model | Cost |
|------|-------|------|
| Summarize all 311 articles | Haiku | ~$2-3 |
| Summarize all 793 sources | Haiku | ~$10-15 |
| Improve single article | Sonnet | ~$0.20 |

### Architecture

```
scripts/lib/knowledge-db.mjs  # Core database module
scripts/scan-content.mjs      # Populate articles + sources
scripts/generate-summaries.mjs # AI summary generation
```

The database stores:
- **articles**: Full text content extracted from MDX files
- **sources**: External references (papers, blogs, reports) found in articles
- **summaries**: AI-generated summaries with key points and claims
- **entity_relations**: Relationships from entities.yaml
