# Strong Reasoners Wiki

Astro/Starlight research wiki investigating how LLMs can be used to improve epistemics — mainly by figuring out what strong AI reasoners would look like and how to build toward them. Part of the CAIRN pnpm monorepo.

## Commands

```bash
pnpm dev       # Start dev server at localhost:4321
pnpm build     # Build for production
pnpm preview   # Preview production build
pnpm lint      # Lint .ts/.tsx files
```

Run from this directory, or from the repo root with `pnpm --filter strong-reasoners <cmd>`.

## Project Structure

```
src/content/docs/       # All wiki pages (Markdown/MDX)
src/components/         # Astro/React components (Footer.astro wraps @cairn/starlight)
src/styles/global.css   # Global CSS (Tailwind import + overrides)
src/content.config.ts   # Content collection schema (don't delete)
astro.config.mjs        # Site config, sidebar, integrations
version.json            # Displayed in the footer
public/                 # Static assets
notes/                  # Reference corpus — NOT site content, gitignored (see below)
```

## Reference Materials (`notes/`)

`notes/` holds the non-published reference corpus behind the wiki: Ozzie's 2021–22 estimation-theory series (the wiki's intellectual ancestor), current research notes, QURI project writeups, experimental designs, and the v0 question portfolio. **Read `notes/README.md` first** — it's an annotated index with per-file summaries, provenance, and how each document maps to wiki chapters.

Rules: the directory is gitignored; never commit it, publish it, or move material from it into `src/content/docs/` without an explicit request. When wiki pages and notes disagree, the wiki is the current position. When adding or converting material there, keep provenance and add an index row to `notes/README.md`.

## Sidebar Configuration

The sidebar in `astro.config.mjs` autogenerates sections from directories under `src/content/docs/`:

- `start-here/` — introduction, key questions
- `concepts/` — core concept pages
- `open-questions/` — unresolved problems and research directions

To add a section: create a directory and add an autogenerate entry to the sidebar array. Pages are ordered alphabetically; use frontmatter `sidebar: { order: 1 }` to control ordering.

## Content Conventions

- **Frontmatter**: Every page needs `title` and `description`
- **Escape `$` signs**: Write `\$100` not `$100` (prevents LaTeX parsing)
- **Math**: `$...$` inline, `$$...$$` display (KaTeX)
- **Mermaid**: ` ```mermaid ` code blocks for diagrams
- **React in MDX**: import from `@/components/...` and add `client:load`

## Content Style

- Analytical, evidence-based tone; cite sources where possible
- Pages are working notes, not settled positions — be explicit about uncertainty
- Include "Open Questions" sections for areas of uncertainty
- Keep pages focused on one topic each; link between related pages
- The wiki is in an early brainstorming stage — keep pages minimal and marked as drafts; don't bake in framing that hasn't been discussed
