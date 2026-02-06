# Research Wiki Starter

A ready-to-use [Astro Starlight](https://starlight.astro.build/) starter template for building research wikis, mini-textbooks, and structured knowledge bases — optimized for use with [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview).

## Quick Start

```bash
npx degit quantified-uncertainty/cairn/starters/research-wiki my-wiki
cd my-wiki
npm install
npm run dev
```

Then open Claude Code (`claude`) and start building your wiki.

## What's Included

- **[Astro Starlight](https://starlight.astro.build/)** — Docs framework with search, sidebar, dark mode, and mobile support
- **[Mermaid](https://mermaid.js.org/)** — Diagrams as code (flowcharts, sequence diagrams, etc.)
- **[KaTeX](https://katex.org/)** — Math rendering (inline and display equations)
- **[React](https://react.dev/)** — For custom interactive components
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework
- **CLAUDE.md** — Pre-configured instructions for Claude Code

## Usage

1. **Clone the starter**: Use the `npx degit` command above
2. **Start the dev server**: `npm run dev` — opens at `http://localhost:4321`
3. **Open Claude Code**: Run `claude` in the project directory
4. **Tell Claude your topic**: Ask it to create your page structure and content
5. **Iterate**: Review in the browser, give feedback, expand pages

## Project Structure

```
src/content/docs/       # All wiki pages (MDX format)
src/components/         # React components
src/content.config.ts   # Content collection schema (don't delete)
astro.config.mjs        # Site config, sidebar, integrations
CLAUDE.md               # Instructions for Claude Code
public/                 # Static assets (create as needed for images)
```

## Deployment

Build for production with `npm run build`. Deploy the `dist/` directory to any static hosting:

- **Netlify**: Connect your repo, set build command `npm run build`, publish directory `dist/`
- **Vercel**: Import repo — auto-detects Astro
- **GitHub Pages**: Use a GitHub Actions workflow
- **Cloudflare Pages**: Connect repo, build command `npm run build`, output `dist/`

## Part of CAIRN

This starter is part of the [CAIRN](https://github.com/quantified-uncertainty/cairn) project by [QURI](https://quantifieduncertainty.org/). See the [workshop page](https://cairn-meta.vercel.app/workshop/) for a guided walkthrough.
