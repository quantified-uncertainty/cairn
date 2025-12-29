# Claude Code Workflows

This document describes available workflows for Claude Code when working with this project.

## Temp Files Convention

**All temporary/intermediate files should go in `.claude/temp/`** (gitignored).

Scripts that generate intermediate output (like grading results) should write to this directory by default. This keeps the project root clean and prevents accidental commits of temp data.

## Page Improvement Workflow (Recommended)

The most effective way to improve wiki pages to quality 5 is using a Task Agent with research capabilities. This approach:
- Uses WebSearch to find real citations from authoritative sources
- Makes surgical Edit operations instead of full rewrites
- References the style guide and Q5 examples for quality standards

### Quick Start

```bash
# Improve a specific page
node scripts/page-improver.mjs economic-disruption

# Dry run (shows what would be done)
node scripts/page-improver.mjs economic-disruption --dry-run

# List pages that need improvement
node scripts/page-improver.mjs --list
```

### What It Does

The improver spawns a sub-agent that:
1. Reads MODELS_STYLE_GUIDE.md and a Q5 example (bioweapons.mdx)
2. Analyzes the target page for missing elements
3. Uses WebSearch to find real citations (McKinsey, IMF, WEF, etc.)
4. Adds tables, Mermaid diagrams, and quantified claims via Edit tool
5. Updates quality rating and lastEdited date

### Target Output Quality

A Q5 page should have:
- **2+ substantive tables** (Risk Assessment, Impact by Sector, Scenarios)
- **1+ Mermaid diagrams** (flowcharts showing relationships)
- **5+ real citations** with working URLs from authoritative sources
- **Quantified claims** with uncertainty ranges (e.g., "30-50% probability")
- **Dense prose** with minimal bullets (<30%)
- **800+ words** of substantive content

### Cost Estimates

| Model | Input Tokens | Output Tokens | Cost per Page |
|-------|--------------|---------------|---------------|
| Opus | ~100K | ~30K | **$3-5** |
| Sonnet | ~100K | ~30K | **$0.50-1.00** |

The Task agent reads ~3 files (50K tokens), runs WebSearch, and makes multiple Edit operations. Using Sonnet is recommended for batch improvements.

### Reference Examples

- **Gold standard**: `src/content/docs/knowledge-base/risks/misuse/bioweapons.mdx` (1079 lines, 15+ tables, 30+ citations)
- **Good example**: `src/content/docs/knowledge-base/risks/structural/racing-dynamics.mdx` (307 lines, 12+ tables)

### Manual Usage (via Claude Code)

If you prefer to run it manually in Claude Code:

```
Task({
  subagent_type: 'general-purpose',
  prompt: `Improve the page at src/content/docs/knowledge-base/[path].mdx

  FIRST: Read MODELS_STYLE_GUIDE.md and bioweapons.mdx as references.

  THEN: Add these improvements using Edit tool:
  1. Risk Assessment table (Severity, Likelihood, Timeline, Trend)
  2. Impact/Data table with real sources (use WebSearch)
  3. Scenario comparison table with probability estimates
  4. Mermaid diagram showing key relationships
  5. 5+ citations from authoritative sources
  6. Quantify vague claims with ranges

  DO NOT rewrite the entire file. Make surgical edits.`
})
```

---

## Document Enhancer CLI (Legacy)

Unified tool for managing and improving wiki content quality via the Claude API.

### Commands

```bash
node scripts/document-enhancer.mjs list --sort gap --limit 10   # List priority pages
node scripts/document-enhancer.mjs show scheming                 # Show page details
node scripts/document-enhancer.mjs grade --limit 5 --dry-run     # Grade pages
node scripts/document-enhancer.mjs enhance --limit 3             # Enhance pages
```

### List Command

List pages sorted by importance, quality, or gap (importance - quality × 20):
```bash
node scripts/document-enhancer.mjs list --sort gap --limit 20
node scripts/document-enhancer.mjs list --min-imp 80 --max-qual 2
```

### Grade Command

Grade pages using Claude API (importance 0-100, quality 1-5, llmSummary):
```bash
node scripts/document-enhancer.mjs grade --limit 10 --dry-run    # Preview
node scripts/document-enhancer.mjs grade --apply                  # Apply to frontmatter
```

### Enhance Command

Enhance low-quality high-importance pages to quality 4-5:
```bash
node scripts/document-enhancer.mjs enhance --min-imp 70 --max-qual 2 --dry-run
node scripts/document-enhancer.mjs enhance --page language-models  # Specific page
node scripts/document-enhancer.mjs enhance --apply                  # Apply directly
```

Without `--apply`, enhanced pages are saved to `.claude/temp/enhanced/` for review.

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview without API calls |
| `--limit N` | Process only N pages |
| `--apply` | Apply changes directly to files |
| `--model X` | Use specific Claude model |
| `--min-imp N` | Minimum importance (enhance) |
| `--max-qual N` | Maximum quality (enhance) |
| `--page ID` | Target specific page |

## Resource Manager CLI

Unified tool for managing external resource links and `<R>` component conversions.

### Commands

```bash
npm run resources list                              # List pages with unconverted links
npm run resources -- show bioweapons               # Show unconverted links in file
npm run resources -- process lock-in --dry-run     # Preview link conversions
npm run resources -- process lock-in --apply       # Apply conversions
npm run resources -- create "https://arxiv.org/..." # Create a resource entry
```

### List Command

List pages sorted by number of unconverted links:
```bash
node scripts/resource-manager.mjs list --limit 20
node scripts/resource-manager.mjs list --min-unconv 5
```

### Show Command

Show details about unconverted links in a specific file:
```bash
node scripts/resource-manager.mjs show bioweapons
node scripts/resource-manager.mjs show risks/structural/lock-in  # Use path for disambiguation
```

### Process Command

Convert markdown links to `<R>` components, creating resources as needed:
```bash
node scripts/resource-manager.mjs process lock-in --dry-run      # Preview
node scripts/resource-manager.mjs process lock-in --apply        # Apply changes
node scripts/resource-manager.mjs process lock-in --skip-create  # Only convert existing
```

This command:
1. Finds all external markdown links in the file
2. For links with existing resources → converts to `<R id="...">`
3. For links without resources → creates new resource entry, then converts
4. Adds the `{R}` import statement if needed

### Create Command

Create a single resource entry:
```bash
node scripts/resource-manager.mjs create "https://arxiv.org/abs/2301.00001"
node scripts/resource-manager.mjs create "https://example.com" --title "Example" --type paper
```

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

**Important:** The data build must run before the site build. The `npm run build` and `npm run dev` commands handle this automatically, but if you're running builds manually:

```bash
npm run build:data  # Must run first - generates database.json
npm run build       # Site build - requires database.json
```

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

### Security Note

The SQLite database in `.cache/knowledge.db` is a local cache for AI-assisted content workflows only. It is:
- Not exposed to any network
- Not used in production builds
- Contains only derived data from public content

Standard SQL patterns are maintained for good practice, but this is not a security-critical component.

## Resource Linking

Use the `<R>` component to link to external resources with hover tooltips and bidirectional tracking.

### Usage in MDX

```mdx
import {R} from '../../../../components/wiki';

<!-- Basic usage - auto-fetches title from resource database -->
<R id="11ac11c30d3ab901" />

<!-- With custom label -->
<R id="11ac11c30d3ab901">Accident reports</R>

<!-- In tables -->
| Finding | Source |
|---------|--------|
| Pilots struggle | <R id="a9d7143ed49b479f">FAA studies</R> |
```

### Benefits

- **Hover tooltips**: Shows title, authors, summary on hover
- **Bidirectional links**: Resource pages show "Cited By" articles
- **Stable IDs**: Links don't break when URLs change
- **View details link**: Each resource has a detail page at `/browse/resources/{id}/`

### Finding Resource IDs

Run the mapping script to find which URLs in an MDX file have matching resource IDs:

```bash
node scripts/map-urls-to-resources.mjs expertise-atrophy  # Specific file
node scripts/map-urls-to-resources.mjs                     # All files
node scripts/map-urls-to-resources.mjs --stats             # Statistics only
```

Output shows convertible links:
```
✓ [Accident reports](https://www.bea.aero/)
  → <R id="11ac11c30d3ab901">Accident reports</R>
```

### Adding Article Sources Section

To show all resources cited by an article, add at the end of the MDX:

```mdx
import {ArticleSources} from '../../../../components/wiki';

<ArticleSources entityId="expertise-atrophy" client:load />
```

### Workflow for AI Content Generation

1. When citing an external source, check if URL exists in `resources.yaml`
2. If yes, use `<R id="{hash}">Label</R>` instead of markdown link
3. If no, use standard markdown link `[Label](url)` — it will be tracked by the scan script
4. Add `<ArticleSources entityId="..." />` at end of articles to show all cited resources
