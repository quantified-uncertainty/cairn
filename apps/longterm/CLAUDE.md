# Claude Code Workflows

This document describes available workflows for Claude Code when working with this project.

## Temp Files Convention

**All temporary/intermediate files should go in `.claude/temp/`** (gitignored).

Scripts that generate intermediate output (like grading results) should write to this directory by default. This keeps the project root clean and prevents accidental commits of temp data.

## Styling Guidelines

**Prefer Tailwind CSS and shadcn/ui components over custom CSS.**

When adding or modifying styles:
1. **Use Tailwind utility classes** directly in components via `className`
2. **Use shadcn/ui components** from `src/components/ui/` for common UI patterns (buttons, cards, tabs, tables, etc.)
3. **Avoid creating new CSS classes** in `.css` files - use Tailwind instead
4. **When refactoring existing components**, convert custom CSS to Tailwind where practical

Existing custom CSS files (legacy):
- `src/components/wiki/wiki.css` - Wiki component styles (refactor candidate)
- `src/components/CauseEffectGraph.css` - Graph visualization styles
- `src/components/MiniModelDiagram/MiniModelDiagram.css` - SVG diagram styles

shadcn/ui is configured in `components.json`. To add new shadcn components:
```bash
npx shadcn@latest add [component-name]
```

Available shadcn components are in `src/components/ui/`.

### Starlight Content Spacing Issue

**Problem:** Custom React components inside MDX pages have unexpected spacing/margins between elements. Cards, grids, and other layouts look broken with extra vertical gaps.

**Cause:** Starlight's `.sl-markdown-content` CSS rule adds `margin-top` between adjacent block elements:

```css
@layer starlight.content {
  .sl-markdown-content :not(a, strong, em, del, span, input, code, br) + :not(a, strong, em, del, span, input, code, br, :where(.not-content *)) {
    margin-top: var(--sl-content-gap-y);
  }
}
```

This rule is designed for prose content but interferes with custom component layouts.

**Fix:** Add the `not-content` class to your component's container to opt out of Starlight's markdown spacing:

```tsx
// Before (broken spacing)
<div className="my-grid">
  {items.map(item => <Card key={item.id} />)}
</div>

// After (correct spacing)
<div className="my-grid not-content">
  {items.map(item => <Card key={item.id} />)}
</div>
```

**When to use `not-content`:**
- Any React component with its own layout (grids, flex containers, card layouts)
- Components where you control spacing via Tailwind/CSS
- Interactive widgets, dashboards, data visualizations

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

Unified tool for managing external resource links, `<R>` component conversions, and metadata extraction.

### Commands

```bash
npm run resources list                              # List pages with unconverted links
npm run resources -- show bioweapons               # Show unconverted links in file
npm run resources -- process lock-in --apply       # Convert links to <R> components
npm run resources -- metadata stats                # Show metadata coverage statistics
npm run resources -- metadata all                  # Extract metadata from all sources
npm run resources -- rebuild-citations             # Rebuild cited_by relationships
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

### Metadata Command

Extract author/date metadata from external sources:
```bash
node scripts/resource-manager.mjs metadata stats            # Show coverage statistics
node scripts/resource-manager.mjs metadata arxiv --batch 50 # ArXiv papers (free API)
node scripts/resource-manager.mjs metadata forum            # LessWrong/AF/EAF posts
node scripts/resource-manager.mjs metadata scholar          # Nature, Science via Semantic Scholar
node scripts/resource-manager.mjs metadata web --batch 20   # General web via Firecrawl
node scripts/resource-manager.mjs metadata all              # Run all extractors
```

Sources and rate limits:
- **arxiv**: Free API, 3s/batch of 20
- **forum**: GraphQL API, 200ms/request
- **scholar**: Semantic Scholar API, 100ms/request (needs DOI)
- **web**: Firecrawl API (requires FIRECRAWL_KEY), 7s/request

### Rebuild Citations Command

Scan MDX files and rebuild `cited_by` relationships in resource files:
```bash
node scripts/resource-manager.mjs rebuild-citations
```

### Create Command

Create a single resource entry:
```bash
node scripts/resource-manager.mjs create "https://arxiv.org/abs/2301.00001"
node scripts/resource-manager.mjs create "https://example.com" --title "Example" --type paper
```

## Page Type System

Pages are classified by type, which determines validation behavior and quality scoring. The page type is set via the `pageType` frontmatter field or auto-detected from context.

### Available Page Types

| Type | Detection | Quality Scoring | Validation |
|------|-----------|-----------------|------------|
| `content` | Default for all pages | Full criteria | Full style guide checks |
| `stub` | Explicit `pageType: stub` | Excluded | Minimal checks only |
| `documentation` | Explicit `pageType: documentation` | Excluded | Excluded (may contain examples) |
| `overview` | Auto-detected from `index.mdx` | Excluded | Navigation structure only |
| AI Transition Model | URL pattern `/ai-transition-model/**` | Different criteria | YAML schema validation |

### When to Use Each Type

**`content` (default)**
- All substantive knowledge base pages (risks, responses, models)
- Any page that should be graded and improved
- No frontmatter field needed (it's the default)

**`stub`**
- Intentionally minimal placeholder pages
- Topics covered elsewhere (use `seeAlso` to point to primary coverage)
- Brief profiles (people, organizations) that don't warrant full pages
- Deprecated concepts kept for historical link stability

**`documentation`**
- Style guides and internal documentation
- Example/template pages with code snippets
- Meta-content about the site itself

**`overview` (auto-detected)**
- Index pages (`index.mdx`) that serve as section navigation
- No manual setting required—detected from filename

**AI Transition Model pages**
- Detected by URL path, not frontmatter
- Use YAML as source of truth (not MDX content)
- Different quality criteria (completeness, diagrams, ratings)

### How to Set pageType in Frontmatter

```yaml
---
title: "Page Title"
pageType: stub  # or: documentation, content (default - can omit)
seeAlso: "primary-page-slug"  # Optional: for stubs pointing elsewhere
---
```

### Validation Behavior by Type

**Content pages** receive full validation:
- Style guide compliance (`npm run validate:style`)
- Quality scoring (tables, citations, diagrams required for high scores)
- Staleness checks
- Cross-page consistency

**Stub pages** are excluded from:
- Quality grading scripts
- Style guide enforcement
- Improvement queues

**Documentation pages** are excluded from:
- All content validation (may contain example code, placeholders)
- Quality scoring

**Overview pages** are validated for:
- Sidebar configuration only
- Link integrity

### Style Guides by Page Type

| Page Type | Style Guide |
|-----------|-------------|
| Risk pages | `/internal/risk-style-guide/` |
| Response pages | `/internal/response-style-guide/` |
| Model pages | `/internal/models-style-guide/` |
| Stub pages | `/internal/stub-style-guide/` |
| AI Transition Model | `/internal/ai-transition-model-style-guide/` |

### Schema Definition

Page types are defined in `src/content.config.ts`:

```typescript
pageType: z.enum(['content', 'stub', 'documentation']).optional()
```

The `overview` type is auto-detected in scripts, not stored in frontmatter.

---

## Content Quality System

Quality scoring applies only to `content` pages (see Page Type System above).

### Rating System

Pages are scored on four dimensions (0-10 scale, harsh - 7+ is exceptional):
- **novelty**: Originality beyond sources
- **rigor**: Claims sourced and quantified
- **actionability**: Decision usefulness
- **completeness**: Coverage of topic

Plus automated metrics (wordCount, citations, tables, diagrams) and a derived quality score (0-100).

Use the `/grade` skill to grade pages. See `/internal/rating-system/` for full documentation.

### Page TODOs System

Pages can have a `todos` array in frontmatter to track incomplete sections. These are displayed in the PageStatus component (dev-only) and help track content that needs work.

**Frontmatter format:**
```yaml
---
title: "Page Title"
todos:
  - "Complete 'How It Works' section"
  - "Fill in Limitations (3 items)"
  - "Add Key Uncertainties"
---
```

**How it works:**
- TODOs appear in the PageStatus component with a violet badge
- Only visible in dev mode (controlled by header toggle)
- Count shown in header: "TODOs (3)"

**Migration script:**

The `migrate-placeholders-to-todos.mjs` script converts placeholder content to tracked TODOs:

```bash
# Preview changes without modifying files
node scripts/migrate-placeholders-to-todos.mjs --dry-run

# Apply changes to files
node scripts/migrate-placeholders-to-todos.mjs --apply
```

The script:
1. Scans MDX files in `knowledge-base/`
2. Detects placeholder patterns like `[Explain...]`, `[Limitation N]`, `[Description]`
3. Extracts section names containing placeholders as TODO items
4. Adds `todos: [...]` to frontmatter (preserving original formatting)
5. Removes the placeholder sections from content

**Placeholder patterns detected:**
- `[Explain the mechanism...]`
- `[Limitation 1]: [Description]`
- `[Uncertainty 1]: [Description]`
- `[Low/Medium/High]`, `[Brief justification]`
- `[Value]`, `[Range]`, `[Citation]`, `[Source]`
- `[Describe...]`, `[Provide...]`, `[List...]`

**When completing a TODO:**
1. Write the actual content for the section
2. Manually remove the item from the `todos` array in frontmatter
3. Update `lastEdited` date

### AI Transition Model Data Architecture

**YAML is the single source of truth** for AI Transition Model pages:

| Data | Source | NOT in MDX |
|------|--------|------------|
| Ratings (changeability, xriskImpact, etc.) | `parameter-graph.yaml` | ❌ |
| Descriptions | `parameter-graph.yaml` | ❌ |
| Scope (includes/excludes) | `parameter-graph.yaml` | ❌ |
| Key debates | `parameter-graph.yaml` | ❌ |
| Related content links | `parameter-graph.yaml` | ❌ |
| Title (for sidebar/SEO) | MDX frontmatter | ✅ |
| Custom prose content | MDX body | ✅ |

**MDX files should be minimal:**
```yaml
---
title: "Compute (AI Capabilities)"
sidebar:
  order: 1
---
import {TransitionModelContent} from '../../../../../components/wiki';

## Overview

[Custom prose content here]

---

<TransitionModelContent slug="compute" client:load />
```

The `TransitionModelContent` component reads all metadata from YAML via `parameter-graph-data.ts`.

### Page Template System

Pages can optionally declare which template/style guide they follow via the `template` frontmatter field. Templates define expected structure.

| Template ID | Description | Path Pattern |
|-------------|-------------|--------------|
| `ai-transition-model-sub-item` | Factor sub-items or scenario variants | `/ai-transition-model/*/*.mdx` |
| `knowledge-base-risk` | Risk analysis pages | `/knowledge-base/risks/**/*.mdx` |
| `knowledge-base-response` | Intervention pages | `/knowledge-base/responses/**/*.mdx` |
| `knowledge-base-model` | Analytical model pages | `/knowledge-base/models/**/*.mdx` |

**Validate templates:**
```bash
npm run validate:templates           # Check pages with declared templates
npm run validate:templates --suggest # Suggest templates for pages without them
```

Template definitions are in `src/data/page-templates.ts`.

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
npm run validate:mdx          # MDX syntax validation (regex-based)
npm run validate:compile      # MDX compilation check (catches JSX errors)
npm run validate:compile:quick # MDX compile for changed files only
npm run validate:refs         # Component references (EntityLink, DataInfoBox, etc.)
npm run validate:mermaid      # Mermaid diagram syntax and best practices
npm run validate:sidebar      # Sidebar configuration (index pages)
npm run validate:types        # UI components handle all schema entity types
npm run validate:dollars      # Currency values escaped for LaTeX
npm run validate:comparisons  # Less-than/greater-than escaped for JSX
npm run validate:templates    # Page template compliance
npm run validate:placeholders # Detect TODOs, TBDs, placeholder text, incomplete content
npm run validate:content-errors # LLM-based review for content issues (requires API key)
```

### Error Detection Tools

Beyond standard validators, these tools help find content and rendering issues:

#### Placeholder Detection

Finds unfinished content - TODOs, placeholder text, empty sections, template remnants:

```bash
npm run validate:placeholders              # Check all files
npm run validate:placeholders --verbose    # Show context around matches
npm run validate:placeholders --path risks # Filter by path
```

Detects patterns like:
- `TODO`, `TBD`, `FIXME` markers
- `[Value]`, `[Description]`, `[Insert X]` placeholders
- Empty or sparse sections
- Trailing `...` (incomplete sentences)
- Empty table cells

#### LLM Content Review

Uses Claude to review pages for content issues that automated validators miss:

```bash
npm run validate:content-errors --page scheming    # Review specific page
npm run validate:content-errors --limit 20         # Review top 20 by importance
npm run validate:content-errors --path /risks/     # Filter by path
npm run validate:content-errors --model sonnet     # Use Sonnet (better quality)
npm run validate:content-errors --dry-run          # Preview without API calls
```

Finds issues like:
- Unclear or confusing writing
- Claims without sources
- Factual issues or contradictions
- Missing context or unexplained jargon
- Structural problems

**Cost**: ~$0.02-0.05 per page (Haiku), ~$0.15-0.30 per page (Sonnet)

Results saved to `.claude/temp/content-errors.json`

#### Visual Page Capture

Captures full-page screenshots for visual inspection of rendering issues:

```bash
npm run visual:capture                     # Capture top 20 pages by importance
npm run visual:capture --limit 50          # Capture top 50
npm run visual:capture --page scheming     # Capture specific page
npm run visual:capture --path /risks/      # Filter by path pattern
npm run visual:capture --changed           # Only pages with git changes
npm run visual:capture --serve             # Auto-start dev server
npm run visual:capture --no-sidebar        # Hide sidebar in screenshots
```

**Requirements** (first time only):
```bash
pnpm add -D playwright
npx playwright install chromium
```

**Output**:
- Screenshots in `.claude/temp/screenshots/`
- HTML index at `.claude/temp/screenshots/index.html` for visual review

### Pre-Commit Checks

**IMPORTANT**: Run these before committing to catch build-breaking errors early:

```bash
npm run precommit       # Quick check: comparisons, dollars, compile (changed files)
npm run precommit:full  # Full check: all above + component refs validation
```

These catch common issues that would fail CI:
- Unescaped `<100ms` in tables (parsed as JSX tags)
- Unescaped `$100` (parsed as LaTeX)
- Invalid component references (e.g., `<EntityLink id="nonexistent" />`)
- Unused imports

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
   node scripts/generate/generate-content.mjs --type model --file input.yaml
   ```
3. Add the entity to `src/data/entities.yaml`
4. Rebuild data: `npm run build:data`
5. Validate: `npm run validate`

### Workflow: Create New Risk Page

Same as model, but use `--type risk`:
```bash
node scripts/generate/generate-content.mjs --type risk --file input.yaml
```

### Workflow: Create New Response Page

Same as model, but use `--type response`:
```bash
node scripts/generate/generate-content.mjs --type response --file input.yaml
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
- **Subgraph syntax**: Use `subgraph id["Label"]` not `subgraph "Label"`
- **Avoid comparison operators in labels**: Use "above 0.5" instead of "> 0.5"
- Run `npm run validate:mermaid` to check diagram syntax

## Cause-Effect Graph Guidelines

Cause-effect graphs visualize causal relationships between factors using ReactFlow. Use these for AI Transition Model entity pages.

### When to Use

- **Cause-effect graphs**: For entity-specific causal models showing what affects a particular factor
- **Mermaid diagrams**: For general flowcharts, sequences, or simpler relationship diagrams

### Graph Structure Pattern

For factor-level pages, use a **three-tier structure**:

1. **Upstream drivers** (leaf nodes): What drives each sub-component
2. **Sub-components** (intermediate nodes): The model's defined sub-items (use entityRef)
3. **Critical questions** (leaf nodes): Key uncertainties that affect the outcome
4. **Output** (effect node): The factor being explained

**Example: AI Capabilities factor**
```
UPSTREAM DRIVERS          SUB-COMPONENTS         CRITICAL QUESTIONS
─────────────────         ──────────────         ──────────────────
Chip Supply Chain    ──→  Compute
Energy Infrastructure──→
Capital Investment   ──→                         Will scaling hit a ceiling? ──→
                                                                                  AI Capabilities
Research Talent Pool ──→  Algorithms
Paradigm Discoveries ──→                         Can AI accelerate AI research?──→

Economic Incentives  ──→  Adoption
Regulatory Friction  ──→
```

### Node Content Guidelines

**DO use:**
- Conceptually interesting causal factors (e.g., "Paradigm Discoveries", "Chip Supply Chain")
- The model's existing sub-components with entityRef links
- Critical questions phrased as questions (e.g., "Will scaling hit a ceiling?")
- Factors someone with domain knowledge would identify as important

**DON'T use:**
- Arbitrary statistics as node names (e.g., "IMF: 40% Jobs Exposed")
- Generic labels (e.g., "Global Politics" instead of "Taiwan Strait Tension")
- Data points pulled from reports without conceptual framing

### Example: Factor-Level Graph

```yaml
causeEffectGraph:
  title: "What Drives AI Capabilities?"
  description: "The three pillars of AI capability, their drivers, and key uncertainties."
  primaryNodeId: ai-capabilities
  nodes:
    # Upstream drivers of Compute
    - id: chip-supply-chain
      label: "Chip Supply Chain"
      type: leaf
      description: "TSMC/ASML concentration, Taiwan geopolitical risk, fab construction timelines."
    - id: energy-infrastructure
      label: "Energy Infrastructure"
      type: leaf
      description: "Data center power availability, grid capacity, nuclear/renewable buildout."
    - id: capital-investment
      label: "Capital Investment"
      type: leaf
      description: "Willingness of investors to fund $1B+ training runs, hyperscaler budgets."

    # Upstream drivers of Algorithms
    - id: research-talent-pool
      label: "Research Talent Pool"
      type: leaf
      description: "Number of top ML researchers, PhD pipeline, brain drain dynamics."
    - id: paradigm-discoveries
      label: "Paradigm Discoveries"
      type: leaf
      description: "Transformers, RLHF, chain-of-thought - unpredictable breakthroughs."

    # Upstream drivers of Adoption
    - id: economic-incentives
      label: "Economic Incentives"
      type: leaf
      description: "Productivity gains, labor cost arbitrage, competitive pressure to adopt."
    - id: regulatory-friction
      label: "Regulatory Friction"
      type: leaf
      description: "EU AI Act, sector-specific rules, liability concerns slowing deployment."

    # Sub-components (from the model)
    - id: compute
      label: "Compute"
      type: intermediate
      entityRef: tmc-compute
      description: "Hardware and energy available for training and inference."
    - id: algorithms
      label: "Algorithms"
      type: intermediate
      entityRef: tmc-algorithms
      description: "Architectures, training methods, and efficiency improvements."
    - id: adoption
      label: "Adoption"
      type: intermediate
      entityRef: tmc-adoption
      description: "How quickly and broadly AI gets deployed and iterated on."

    # Critical questions/uncertainties
    - id: scaling-ceiling-question
      label: "Will scaling hit a ceiling?"
      type: leaf
      description: "Core uncertainty: are we near diminishing returns or far from limits?"
    - id: recursive-improvement-question
      label: "Can AI accelerate AI research?"
      type: leaf
      description: "If AI improves AI development, capabilities could accelerate non-linearly."

    # Output
    - id: ai-capabilities
      label: "AI Capabilities"
      type: effect
      description: "Aggregate frontier AI capability level."

  edges:
    # Upstream → Sub-components
    - source: chip-supply-chain
      target: compute
      strength: strong
    - source: energy-infrastructure
      target: compute
      strength: strong
    - source: capital-investment
      target: compute
      strength: strong
    - source: research-talent-pool
      target: algorithms
      strength: strong
    - source: paradigm-discoveries
      target: algorithms
      strength: strong
    - source: economic-incentives
      target: adoption
      strength: strong
    - source: regulatory-friction
      target: adoption
      strength: medium
      effect: decreases

    # Sub-components → Output
    - source: compute
      target: ai-capabilities
      strength: strong
    - source: algorithms
      target: ai-capabilities
      strength: strong
    - source: adoption
      target: ai-capabilities
      strength: medium

    # Critical questions → Output (use mixed effect for uncertainties)
    - source: scaling-ceiling-question
      target: ai-capabilities
      strength: medium
      effect: mixed
    - source: recursive-improvement-question
      target: ai-capabilities
      strength: medium
      effect: mixed
```

### Edge Styling

**Strength determines visual importance:**
- `strong`: Thick line (primary causal relationships)
- `medium`: Normal line (significant but secondary)
- `weak`: Thin line (minor or uncertain relationships)

**Effect direction:**
- `increases` (default): Normal arrow
- `decreases`: Red-tinted line
- `mixed`: Dashed line (use for critical questions/uncertainties)

### Node Types

| Type | Position | Purpose |
|------|----------|---------|
| `leaf` | Top/sides | Upstream drivers and critical questions |
| `intermediate` | Middle | Sub-components from the model (use entityRef) |
| `effect` | Bottom | The factor/outcome being explained |

### Best Practices

1. **Use the model's structure**: Check for existing sub-components (parentFactor relationships) and use them as intermediate nodes
2. **Add critical questions**: Include 1-3 key uncertainties as leaf nodes with `effect: mixed`
3. **Set primaryNodeId**: Highlight the node representing the current page
4. **Link to ATM entities**: Use `entityRef` to connect sub-components to their pages
5. **Show relative importance**: Use `strength` on edges to distinguish critical vs minor relationships
6. **Aim for 10-15 nodes**: Enough depth to be informative, not so many it's overwhelming

### Schema Location

Cause-effect graph schema is defined in `src/data/schema.ts`:
- `CauseEffectNode`: Node with id, label, type, entityRef, confidence
- `CauseEffectEdge`: Edge with source, target, strength, effect, confidence
- `CauseEffectGraph`: Container with title, description, primaryNodeId, nodes, edges

Data is stored in entity YAML files under the `causeEffectGraph` field.

### Graph Sync Architecture

**Two-tier system with single source of truth:**

1. **Master Graph** (`src/data/graphs/ai-transition-model-master.yaml`)
   - Contains ALL node definitions (categories, sub-items, detailed nodes)
   - Single source of truth for node IDs, labels, descriptions
   - Viewable at `/diagrams/master-graph/`

2. **Individual Entity Diagrams** (`src/data/entities/ai-transition-model.yaml`)
   - Each entity can have a `causeEffectGraph` field
   - Define which nodes to include and their edge relationships
   - Nodes MUST exist in master graph (enforced by validation)

**Sync workflow:**
```bash
# Check sync status
node scripts/graph/analyze-graph-sync.mjs

# Add missing nodes to master (if individual diagrams have new nodes)
node scripts/graph/add-missing-nodes-to-master.mjs --dry-run  # Preview
node scripts/graph/add-missing-nodes-to-master.mjs --apply    # Apply

# Validate sync (runs as part of npm run validate)
node scripts/validate/validate-graph-sync.mjs
```

**When adding new diagram nodes:**
1. Add nodes to the master graph first (or use sync script)
2. Reference nodes by ID in individual entity diagrams
3. Run `npm run validate` to ensure sync

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
node scripts/generate/generate-summaries.mjs --batch 50           # Summarize 50 articles
node scripts/generate/generate-summaries.mjs --type sources       # Summarize sources instead
node scripts/generate/generate-summaries.mjs --model sonnet       # Use Sonnet (more expensive)
node scripts/generate/generate-summaries.mjs --id deceptive-alignment  # Specific article
node scripts/generate/generate-summaries.mjs --dry-run            # Preview without API calls
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
scripts/lib/knowledge-db.mjs       # Core database module
scripts/lib/anthropic.mjs          # Shared Anthropic client
scripts/scan-content.mjs           # Populate articles + sources
scripts/generate/generate-summaries.mjs  # AI summary generation
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

Use the resource manager to find which URLs in an MDX file have matching resource IDs:

```bash
npm run resources list                        # List pages with unconverted links
npm run resources -- show expertise-atrophy   # Show unconverted links in specific file
```

Output shows convertible links that can be changed to `<R>` components.

### Adding Article Sources Section

To show all resources cited by an article, add at the end of the MDX:

```mdx
import {ArticleSources} from '../../../../components/wiki';

<ArticleSources entityId="expertise-atrophy" client:load />
```

### Workflow for AI Content Generation

1. When citing an external source, check if URL exists in `src/data/resources/`
2. If yes, use `<R id="{hash}">Label</R>` instead of markdown link
3. If no, use standard markdown link `[Label](url)` — it will be tracked by the scan script
4. Add `<ArticleSources entityId="..." />` at end of articles to show all cited resources
