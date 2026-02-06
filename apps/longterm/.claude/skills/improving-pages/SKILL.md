---
name: improving-pages
description: Improve existing wiki pages. Use when asked to improve, enhance, fix, or update a wiki page, add cross-references, complete TODOs, or check page quality.
allowed-tools: Read, Edit, Grep, Glob, Bash
---

# Improving Pages Skill

This skill provides guidance for improving existing wiki pages.

## Workflow Overview

1. **Analyze the page** - Run validators and check quality metrics
2. **Identify improvements** - Check todos, missing sections, link coverage
3. **Discover cross-page insights** - Check related pages for analytical discoveries
4. **Make targeted edits** - Fix specific issues without over-engineering
5. **Validate changes** - Run relevant validators before completing

## Analysis Commands

```bash
# Check page for validation issues
npm run crux -- validate compile --quick

# Check entity mention opportunities (unlinked references)
npm run crux -- analyze mentions

# Check link coverage (orphans, underlinked pages)
npm run crux -- analyze links --orphans
```

## Quality Assessment — 3-Step Pipeline

Quality assessment uses a 3-step pipeline. When manually reviewing a page, follow this process:

### Step 1: Run automated warning rules
```bash
npm run crux -- validate unified --rules=insider-jargon,false-certainty,prescriptive-language,tone-markers,structural-quality
```

### Step 2: Review against the checklist
Consult `.claude/docs/content-warnings-checklist.md` — ~70 items across 7 categories (Objectivity, Rigor, Focus, Completeness, Concreteness, Cross-Page, Formatting). Check each category and note violations.

### Step 3: Score on 7 dimensions
Pages are scored on seven dimensions (0-10, harsh scale - 7+ is exceptional):

| Dimension | Measures |
|-----------|----------|
| **focus** | Answers what the title promises |
| **novelty** | Originality beyond sources |
| **rigor** | Claims sourced and quantified |
| **completeness** | Coverage of topic |
| **objectivity** | Epistemic honesty, neutral language |
| **concreteness** | Specific vs. abstract |
| **actionability** | Decision usefulness |

Factor the warnings from Steps 1-2 into your scores, especially for objectivity, rigor, and concreteness.

Use the `/grade` skill to run the full automated pipeline. See `.claude/docs/content-quality.md` for the rating system and `.claude/docs/content-warnings-checklist.md` for the full checklist.

## Common Improvements

### Adding Cross-References

Use `<EntityLink>` for internal wiki links:

```jsx
import { EntityLink } from '../../../../components/wiki';

// Auto-fetches title from pathRegistry
<EntityLink id="scheming" />

// Custom label
<EntityLink id="scheming">deceptive behavior</EntityLink>
```

### Completing TODOs

Pages may have a `todos` array in frontmatter:

```yaml
todos:
  - "Complete 'How It Works' section"
  - "Add Key Uncertainties"
```

When completing a TODO:
1. Write the content
2. Remove the item from `todos` array
3. Update `lastEdited` date

### Adding Sources

For external sources, check if URL exists in resources database:

```bash
npm run crux -- resources show bioweapons  # Check existing resources
```

If resource exists, use `<R>` component instead of markdown link:
```jsx
<R id="11ac11c30d3ab901">Source label</R>
```

## Page Type Requirements

Different page types have different requirements. See `.claude/docs/page-types.md` for details.

### Model Pages

Required sections:
- Overview (2-3 paragraphs)
- Conceptual Framework (diagram + explanation)
- Quantitative Analysis (tables with uncertainty ranges)
- Strategic Importance
- Limitations

### Risk Pages

Required sections:
- Overview
- Risk Assessment (severity, likelihood, timeline table)
- Responses That Address This Risk
- Why This Matters
- Key Uncertainties

### Response Pages

Required sections:
- Overview
- Quick Assessment table
- Risks Addressed
- How It Works
- Critical Assessment

## Insight Discovery

Before editing, check 2-3 related pages for cross-page discoveries. For financial pages, run `npm run crux -- validate financials`. See `.claude/docs/insight-discovery.md` for the pattern catalog (Stale Valuation, Cross-Page Contradiction, Undrawn Conclusion, etc.).

## Validation Before Completing

Always run relevant validators:

```bash
npm run validate                      # Full validation suite
npm run crux -- validate mermaid      # If page has diagrams
npm run crux -- validate compile      # Check MDX compiles
```
