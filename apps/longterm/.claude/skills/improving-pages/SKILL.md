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
3. **Make targeted edits** - Fix specific issues without over-engineering
4. **Validate changes** - Run relevant validators before completing

## Analysis Commands

```bash
# Check page for validation issues
npm run crux -- validate compile --quick

# Check entity mention opportunities (unlinked references)
npm run crux -- analyze mentions

# Check link coverage (orphans, underlinked pages)
npm run crux -- analyze links --orphans
```

## Quality Assessment

Pages are scored on four dimensions (0-10, harsh scale - 7+ is exceptional):

| Dimension | Measures |
|-----------|----------|
| **novelty** | Originality beyond sources |
| **rigor** | Claims sourced and quantified |
| **actionability** | Decision usefulness |
| **completeness** | Coverage of topic |

Use the `/grade` skill to assess page quality. See `/internal/rating-system/` for documentation.

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

## Validation Before Completing

Always run relevant validators:

```bash
npm run validate                      # Full validation suite
npm run crux -- validate mermaid      # If page has diagrams
npm run crux -- validate compile      # Check MDX compiles
```
