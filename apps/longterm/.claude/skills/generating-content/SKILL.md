---
name: generating-content
description: Create new wiki pages and content. Use when asked to create new pages, write articles, add entities to the wiki, or draft new content.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Generating Content Skill

This skill provides guidance for creating new wiki pages and content.

## Creating New Pages

### 1. Choose the Right Page Type

| Type | Use For | Quality Scored? |
|------|---------|-----------------|
| `content` | Substantive articles | Yes |
| `stub` | Placeholder pages | No |
| `documentation` | Internal docs, how-tos | No |

Set via frontmatter:
```yaml
---
title: "Page Title"
pageType: stub  # omit for content pages
---
```

### 2. Follow Template Requirements

Different sections require different structures. See `.claude/docs/content-quality.md` for full details.

**Model Pages** require:
- Overview (2-3 paragraphs)
- Conceptual Framework (diagram + explanation)
- Quantitative Analysis (tables with uncertainty ranges)
- Strategic Importance
- Limitations

**Risk Pages** require:
- Overview
- Risk Assessment table (severity, likelihood, timeline)
- Responses That Address This Risk
- Why This Matters
- Key Uncertainties

**Response Pages** require:
- Overview
- Quick Assessment table
- Risks Addressed
- How It Works
- Critical Assessment

### 3. Frontmatter Template

```yaml
---
title: "Page Title"
description: "1-2 sentence summary with key conclusion"
quality: 3
lastEdited: "2025-01-30"
ratings:
  novelty: 4
  rigor: 3
  actionability: 4
  completeness: 3
todos:
  - "Complete 'How It Works' section"
  - "Add Key Uncertainties"
---
```

**Critical**: The `description` field must include both methodology AND conclusions. It's shown in previews.

Good: "This model estimates AI's marginal contribution to bioweapons risk. It finds current LLMs provide 1.3-2.5x uplift for non-experts."

Bad: "Analysis of AI bioweapons risk" (no conclusion)

## Adding Cross-References

### Internal Links

Use `<EntityLink>` for wiki cross-references:

```mdx
import {EntityLink} from '../../../../components/wiki';

<EntityLink id="scheming" />  <!-- Auto-fetches title -->
<EntityLink id="scheming">deceptive behavior</EntityLink>  <!-- Custom label -->
```

### External Sources

Check if URL exists in resource database first:
```bash
npm run crux -- resources show [page-name]
```

If exists, use `<R>` component:
```mdx
import {R} from '../../../../components/wiki';
<R id="hash">Source label</R>
```

If not, use markdown link (will be tracked for later conversion).

## AI Transition Model Pages

For ATM pages, **YAML is the single source of truth**:

| Data | Source |
|------|--------|
| Ratings, descriptions, scope | `parameter-graph.yaml` |
| Related content links | `parameter-graph.yaml` |
| Title (sidebar/SEO) | MDX frontmatter |
| Custom prose | MDX body |

MDX files should be minimal:
```mdx
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

## Using Diagrams

### Mermaid (for flowcharts, sequences)

```mdx
<Mermaid client:load chart={`
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]
`} />
```

See `.claude/docs/mermaid-diagrams.md` for syntax guidelines.

### Cause-Effect Graphs (for causal models)

For ATM entity pages, use cause-effect graphs defined in YAML. See `.claude/docs/cause-effect-graphs.md`.

## Validation

Before completing new pages:

```bash
npm run crux -- validate compile --quick   # Verify MDX compiles
npm run crux -- validate refs              # Check EntityLink/DataInfoBox references
npm run validate                           # Full validation suite
```

## Common MDX Escaping Issues

These cause CI failures:

| Issue | Wrong | Correct |
|-------|-------|---------|
| Currency | `$100` | `\$100` |
| Comparisons | `<100ms` | `\<100ms` |
| Lists starting >1 | No blank line | Blank line before |

## After Creating Content

Rebuild the data layer if you added new entities:
```bash
npm run build:data
```

### Cross-Linking Checklist (Important!)

After creating a new page, **always check cross-linking**:

```bash
# 1. Check what links TO and FROM this entity
npm run crux -- analyze entity-links <entity-id>

# 2. Add EntityLinks to pages that mention this entity
# (The analyzer shows which pages mention but don't link)

# 3. Add EntityLinks FROM this page to related entities
# (Look for entity names in your content that could be linked)
```

**Why this matters:**
- New pages aren't automatically linked from existing content
- Poor cross-linking reduces discoverability
- Related pages (like a person and their organization) should link to each other

**Quick fix for bulk issues:**
```bash
npm run crux -- fix entity-links
```

Run link analysis to check integration:
```bash
npm run crux -- analyze links
```
