# Research Wiki

Astro/Starlight research wiki with Mermaid diagrams, math rendering, React components, and Tailwind CSS.

## Commands

```bash
npm run dev       # Start dev server at localhost:4321
npm run build     # Build for production
npm run preview   # Preview production build
```

## Project Structure

```
src/content/docs/       # All wiki pages (MDX format)
src/components/         # React components (import in MDX with client:load)
src/styles/global.css   # Global CSS (Tailwind import + overrides)
src/content.config.ts   # Content collection schema (don't delete)
astro.config.mjs        # Site config, sidebar, integrations
CLAUDE.md               # Instructions for Claude Code (this file)
public/                 # Static assets (create as needed for images)
```

## Sidebar Configuration

The sidebar in `astro.config.mjs` uses `autogenerate` to generate sections from directory structure:

```js
sidebar: [
  { label: 'Section Name', autogenerate: { directory: 'section-name' } },
]
```

To add a new section:
1. Create a directory under `src/content/docs/`
2. Add an autogenerate entry to the sidebar array in `astro.config.mjs`

Pages are ordered alphabetically by filename. Use frontmatter `sidebar: { order: 1 }` or prefix filenames with numbers (`01-intro.mdx`) to control ordering.

## MDX Conventions

- **File extension**: Always use `.mdx` for pages
- **Frontmatter**: Every page needs `title` and `description`
- **Escape `$` signs**: Write `\$100` not `$100` (prevents LaTeX parsing)
- **Escape `<` in text**: Write `\<100` not `<100` (prevents JSX parsing)
- **Math**: Use `$...$` for inline math and `$$...$$` for display math
- **Mermaid**: Use ` ```mermaid ` code blocks for diagrams
- **Images**: Create `public/images/` if needed, then reference as `/images/name.png`

## Available Features

- **Mermaid diagrams**: Flowcharts, sequence diagrams, state diagrams, etc.
- **Math (KaTeX)**: Inline and display equations
- **React components**: Create `.tsx` files in `src/components/` and import in MDX with `client:load` directive. See `src/components/Counter.tsx` for an example.
- **Tailwind CSS**: Utility-first CSS framework. Configured in `src/styles/global.css`.
- **Starlight components**: `Card`, `CardGrid`, `Tabs`, `Aside`, etc. — import from `@astrojs/starlight/components`

## React Components in MDX

```mdx
import Counter from '@/components/Counter';

<Counter client:load />
```

The `client:load` directive is required — without it, React components render as static HTML with no interactivity. Use `@/components/...` import paths (alias for `src/`).

When React components render grids or custom layouts, add the `not-content` class to prevent Starlight from applying prose spacing:

```tsx
<div className="not-content">
  {/* your custom layout */}
</div>
```

## Content Style

- Use an analytical, evidence-based tone
- Cite sources where possible
- Include "Open Questions" sections for areas of uncertainty
- Use Markdown tables for comparing positions, proposals, or data
- Keep pages focused on one topic each
- Link between related pages to create a navigable knowledge base
