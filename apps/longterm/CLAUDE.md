# Longterm Wiki - Claude Code Config

Astro/Starlight wiki about AI safety with ~500 MDX pages, React components, and YAML data layer.

## Quick Reference

```bash
# Development
npm run dev                    # Start dev server (runs build:data first)
npm run build:data             # Rebuild entity database after YAML changes

# Validation (run before committing)
npm run precommit              # Quick: dollars, comparisons, markdown-lists, compile
npm run validate               # Full validation suite

# Common tasks
npm run analyze:mentions       # Find unlinked entity mentions
npm run analyze:links          # Link coverage report
npm run resources list         # List pages with unconverted links
```

## Essential Conventions

### Temp Files
All temporary/intermediate files go in `.claude/temp/` (gitignored).

### Import Path Aliases
**Always use path aliases instead of relative imports.** Configured in `tsconfig.json`:
```tsx
// ✅ Good - use path aliases
import { EntityLink } from '@components/wiki';
import { getWikiStats } from '@lib/dashboard';
import database from '@data/database.json';

// ❌ Bad - don't use relative paths
import { EntityLink } from '../../../components/wiki';
```

Available aliases:
- `@components/*` → `src/components/*`
- `@lib/*` → `src/lib/*`
- `@data/*` → `src/data/*`
- `@/*` → `src/*` (general fallback)

### Styling
- **Use Tailwind CSS** and shadcn/ui components over custom CSS
- shadcn components in `src/components/ui/`
- Add new: `npx shadcn@latest add [component-name]`

### Starlight Spacing Fix
Custom React components need `not-content` class to avoid Starlight's prose spacing:
```tsx
<div className="my-grid not-content">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### MDX Escaping (common CI failures)
- Currency: `\$100` not `$100` (LaTeX parsing)
- Comparisons: `\<100ms` not `<100ms` (JSX parsing)
- Numbered lists starting with N>1 need blank line before

## Project Structure

```
src/
├── content/docs/           # MDX pages (knowledge-base/, ai-transition-model/)
├── components/wiki/        # Wiki components (EntityLink, DataInfoBox, R, etc.)
├── data/                   # YAML entities, JSON databases
│   ├── database.json       # Generated - all entities merged
│   ├── pathRegistry.json   # Generated - entity ID → URL path
│   └── backlinks.json      # Generated - reverse references
└── pages/                  # Astro pages (dashboard, browse)

scripts/
├── validate/               # 20+ validators
├── analyze/                # Link coverage, mentions analysis
├── content/                # Page improvement, grading
└── lib/                    # Shared utilities, rules
```

### Key Files
| File | Purpose |
|------|---------|
| `astro.config.mjs` | Sidebar config (manual, not auto-generated) |
| `src/content.config.ts` | MDX frontmatter schema |
| `src/data/schema.ts` | Entity type definitions |

## Validators

Run `npm run validate` for full suite. Key individual validators:
- `validate:compile` - MDX compilation (catches JSX errors)
- `validate:refs` - EntityLink/DataInfoBox references
- `validate:links` - Internal link resolution
- `validate:mermaid` - Diagram syntax

## Page Types

| Type | Set via | Quality scored? |
|------|---------|-----------------|
| `content` | Default | Yes |
| `stub` | `pageType: stub` | No |
| `documentation` | `pageType: documentation` | No |
| `overview` | Auto (index.mdx) | No |

## Entity Cross-Linking

Use `<EntityLink id="entity-id">` for internal references:
```mdx
import {EntityLink} from '@components/wiki';

The <EntityLink id="scheming">scheming</EntityLink> risk is related to...
```

Use `<R id="hash">` for external resource links with hover tooltips.

## Data Layer

After editing `src/data/*.yaml`:
```bash
npm run build:data  # Regenerates database.json, pathRegistry.json, etc.
```

Entity types: risk, response, model, organization, researcher, funder, capability, crux, concept

## Detailed Documentation

For workflow-specific guidance, see:
- `.claude/docs/page-types.md` - Page type system details
- `.claude/docs/content-quality.md` - Rating system, TODOs, templates
- `.claude/docs/mermaid-diagrams.md` - Diagram guidelines
- `.claude/docs/cause-effect-graphs.md` - Causal graph schema
- `.claude/docs/knowledge-base-system.md` - SQLite cache system
- `.claude/docs/resource-linking.md` - External resource management

For task-specific workflows, use skills:
- `/improving-pages` - Page improvement workflow
- `/managing-resources` - Resource link management
- `/generating-content` - Create new pages from YAML
