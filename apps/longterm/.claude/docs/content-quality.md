# Content Quality System

Quality scoring applies only to `content` pages (see page-types.md).

## Rating System

Pages are scored on four dimensions (0-10 scale, harsh - 7+ is exceptional):
- **novelty**: Originality beyond sources
- **rigor**: Claims sourced and quantified
- **actionability**: Decision usefulness
- **completeness**: Coverage of topic

Plus automated metrics (wordCount, citations, tables, diagrams) and a derived quality score (0-100).

Use the `/grade` skill to grade pages. See `/internal/rating-system/` for full documentation.

## Page TODOs System

Pages can have a `todos` array in frontmatter to track incomplete sections.

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

**When completing a TODO:**
1. Write the actual content for the section
2. Manually remove the item from the `todos` array in frontmatter
3. Update `lastEdited` date

## Page Template System

Pages can declare which template/style guide they follow via the `template` frontmatter field.

| Template ID | Description | Path Pattern |
|-------------|-------------|--------------|
| `ai-transition-model-sub-item` | Factor sub-items or scenario variants | `/ai-transition-model/*/*.mdx` |
| `knowledge-base-risk` | Risk analysis pages | `/knowledge-base/risks/**/*.mdx` |
| `knowledge-base-response` | Intervention pages | `/knowledge-base/responses/**/*.mdx` |
| `knowledge-base-model` | Analytical model pages | `/knowledge-base/models/**/*.mdx` |

**Validate templates:**
```bash
npm run crux -- validate templates           # Check pages with declared templates
npm run crux -- validate templates --suggest # Suggest templates for pages without them
```

Template definitions are in `src/data/page-templates.ts`.

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

## AI Transition Model Data Architecture

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
