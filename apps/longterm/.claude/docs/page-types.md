# Page Type System

Pages are classified by type, which determines validation behavior and quality scoring.

## Available Page Types

| Type | Detection | Quality Scoring | Validation |
|------|-----------|-----------------|------------|
| `content` | Default for all pages | Full criteria | Full style guide checks |
| `stub` | Explicit `pageType: stub` | Excluded | Minimal checks only |
| `documentation` | Explicit `pageType: documentation` | Excluded | Excluded (may contain examples) |
| `overview` | Auto-detected from `index.mdx` | Excluded | Navigation structure only |
| AI Transition Model | URL pattern `/ai-transition-model/**` | Different criteria | YAML schema validation |

## When to Use Each Type

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

## Setting pageType in Frontmatter

```yaml
---
title: "Page Title"
pageType: stub  # or: documentation, content (default - can omit)
seeAlso: "primary-page-slug"  # Optional: for stubs pointing elsewhere
---
```

## Validation Behavior by Type

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

## Style Guides by Page Type

| Page Type | Style Guide |
|-----------|-------------|
| Risk pages | `/internal/risk-style-guide/` |
| Response pages | `/internal/response-style-guide/` |
| Model pages | `/internal/models-style-guide/` |
| Stub pages | `/internal/stub-style-guide/` |
| AI Transition Model | `/internal/ai-transition-model-style-guide/` |

## Schema Definition

Page types are defined in `src/content.config.ts`:

```typescript
pageType: z.enum(['content', 'stub', 'documentation']).optional()
```

The `overview` type is auto-detected in scripts, not stored in frontmatter.
