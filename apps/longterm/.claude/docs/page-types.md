# Page Type System

LongtermWiki uses a two-level classification system:

1. **Page Type** (`pageType`): Controls validation behavior and quality scoring eligibility
2. **Page Template** (`pageTemplate`): Determines expected structure and applicable style guide

## Available Page Types

| Type | Set By | Quality Scored? | Validated? |
|------|--------|-----------------|------------|
| `content` | Default | Yes | Full |
| `stub` | Explicit `pageType: stub` | No | Minimal |
| `documentation` | Explicit `pageType: documentation` | No | No |
| `overview` | Auto-detected from `index.mdx` | No | Navigation only |

## When to Use Each Type

### `content` (default)
- All substantive knowledge base pages (risks, responses, models, organizations)
- Any page that should be graded and improved
- No frontmatter field needed (it's the default)

**Validation**: Full quality grading, structural checks, style guide compliance, staleness warnings.

**Quality**: Must be set ONLY by `grade-content.mjs`, never manually. The `quality-source` rule enforces this.

### `stub`
- Intentionally minimal placeholder pages
- Topics covered elsewhere (use `seeAlso` to point to primary coverage)
- Brief profiles that don't warrant full pages
- Deprecated concepts kept for link stability

**Validation**: Excluded from quality grading and style checks. Still validated for MDX compilation and EntityLinks.

```yaml
pageType: stub
seeAlso: "primary-page-slug"  # Points to primary content
```

### `documentation`
- Style guides and internal documentation
- Example/template pages with code snippets
- Meta-content about the site itself
- Internal planning documents

**Validation**: Excluded from all content validation. May contain intentional examples or placeholder text.

```yaml
pageType: documentation
```

### `overview` (auto-detected)
- Index pages (`index.mdx`) that serve as section navigation
- No manual setting required—detected from filename

**Validation**: Sidebar structure and link integrity only.

## Page Templates

Templates control expected structure (separate from page type):

| Template | Used For | Style Guide |
|----------|----------|-------------|
| `knowledge-base-risk` | Risk analysis pages | `/internal/risk-style-guide/` |
| `knowledge-base-response` | Intervention/response pages | `/internal/response-style-guide/` |
| `knowledge-base-model` | Analytical models | `/internal/models-style-guide/` |
| `ai-transition-model-factor` | ATM top-level factors | `/internal/ai-transition-model-style-guide/` |
| `ai-transition-model-sub-item` | ATM sub-factors | `/internal/ai-transition-model-style-guide/` |

## Quality Pipeline

Only `content` pages are graded. Quality must come from `grade-content.mjs`:

```bash
# Grade a specific page
npm run regrade -- page-id

# The quality-source validation rule catches manually-set quality
npm run crux -- validate unified --rules=quality-source
```

Pages with `quality` but no `ratings` indicate the quality was set outside the proper pipeline.

## Setting pageType in Frontmatter

```yaml
---
title: "Page Title"
pageType: stub  # or: documentation, content (default - can omit)
seeAlso: "primary-page-slug"  # For stubs pointing elsewhere
---
```

## Full Documentation

See `/internal/page-types/` for comprehensive documentation with examples.
