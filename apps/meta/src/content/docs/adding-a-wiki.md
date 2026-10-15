---
title: Adding a Wiki
description: How to add a new Starlight wiki to the CAIRN monorepo, from the starter template to a deployed, CI-checked site.
---

A wiki in CAIRN is a directory under `apps/`. `pnpm-workspace.yaml` includes `apps/*` and `packages/*`, so any directory there with a `package.json` becomes a workspace package. Evaluation Engineering (`apps/evaluation-engineering`) is the cleanest existing app to compare against.

## 1. Copy the starter

```bash
cp -r starters/research-wiki apps/my-wiki
```

`starters/research-wiki` is also the template that [workshop](/workshop/) attendees download with `degit`. It already has Starlight, `astro-mermaid`, `remark-math` with `rehype-katex`, React, and a `CLAUDE.md`. It is written for standalone use with npm, so it needs the changes below before it fits the monorepo. Delete `src/content/docs/example/` and `src/components/Counter.tsx` once you have pages of your own.

## 2. Wire it into the workspace

In `apps/my-wiki/package.json`:

- Set `"name"`. This is the name used by `pnpm --filter my-wiki …` and CI.
- Add `"packageManager": "pnpm@9.15.4"`, as the other apps have, and delete the starter's `engines` field. The Node requirement is set in the root `package.json` and in CI.
- Add `"@cairn/starlight": "workspace:*"` to `dependencies`.
- Change `build` to `node ../../scripts/generate-llm-files.mjs && astro build`, and add `"gen:llms": "node ../../scripts/generate-llm-files.mjs"`.

Then run `pnpm install` from the repository root and commit the updated `pnpm-lock.yaml`. In CI, pnpm installs with a frozen lockfile by default, so a stale lockfile fails the build.

For the footer, copy `src/components/Footer.astro` and `version.json` from Evaluation Engineering. The footer wraps `@cairn/starlight/Footer.astro`, which adds the Copy-as-Markdown button, the version string and the sibling-wiki links. Add the new site to the `SITES` list in that component. Add the app's directory name to the `apps` list in `scripts/sync-versions.mjs`. [Build & Tooling](/build-and-tooling/#version-footer) explains what these do.

## 3. Edit `astro.config.mjs`

- `site`: the live URL. Starlight uses it for canonical links and the sitemap.
- `title` and `description`.
- `social`: a GitHub link to `https://github.com/quantified-uncertainty/cairn`.
- `components: { Footer: './src/components/Footer.astro' }`.
- `sidebar`: replace the starter's `autogenerate` sections with an explicit list.

The explicit sidebar is required. `generate-llm-files.mjs` builds `llms.txt` and `llms-full.txt` by parsing the sidebar text, and it only recognises three shapes:

```js
sidebar: [
  {
    label: 'Part I — Foundations',        // a group header: `collapsed:` must follow `label`
    collapsed: false,
    items: [
      { label: '1. Introduction', slug: 'start-here/introduction' },  // a chapter
      { label: '2. Planned Chapter', link: '/#contents' },            // a planned placeholder
    ],
  },
],
```

Each entry must be exactly `{ label: '…', slug: '…' }` (optionally followed by a one-line `badge: { … }`) or `{ label: '…', link: '…' }`, keys in that order, values single-quoted, and no straight apostrophe in the label (use ’). Anything else is skipped. A group without `collapsed:` right after its `label` still lists its pages, but gets no heading in `llms.txt`. An `autogenerate` group contributes nothing, and a sidebar with no parseable chapters fails the build.

The explicit sidebar also lets Evaluation Engineering and Robust Reasoning Processes read as books. Chapter numbers live in the sidebar labels and are mirrored in a contents table on each site's index page.

## 4. Add `llms.config.json`

```json
{
  "name": "My Wiki",
  "url": "https://my-wiki.quantifieduncertainty.org",
  "description": "One paragraph on what the wiki covers.",
  "intro": "Optional extra paragraph, e.g. links to sibling wikis."
}
```

`name`, `url` and `description` are required. Keep `url` identical to `site`, because `scripts/check-built-links.py` maps each site's domain to its build through this field. The generated `public/llms.txt` and `public/llms-full.txt` are committed. Don't edit them by hand; run `pnpm gen:llms`, or just build.

## 5. Deploy

Copy `vercel.json` from another app:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "astro",
  "installCommand": "cd ../.. && npx pnpm@9 install",
  "buildCommand": "npx pnpm@9 run build"
}
```

The `cd ../..` assumes the Vercel project's root directory is `apps/my-wiki`, so the install runs at the workspace root. Create the Vercel project with that root directory and attach the domain in Vercel; the three live wikis use `<name>.quantifieduncertainty.org`. By default, pushes to `main` deploy to production, and other branches and pull requests get preview deployments.

## 6. Add it to CI

In `.github/workflows/ci.yml`, add a build step before the link check:

```yaml
      - name: Build my-wiki
        run: pnpm --filter my-wiki build
```

`scripts/check-built-links.py` discovers sites through their `llms.config.json`, so it checks the new wiki without changes.

## 7. Finish

- Rewrite the starter's `CLAUDE.md` for the monorepo, using Evaluation Engineering's as a model: pnpm commands, the explicit-sidebar rule, and "don't hand-edit the llms files".
- Add the wiki to this handbook's [homepage](/), and mention it in the `intro` of the sibling wikis' `llms.config.json`.

## Diagrams and math

All three wikis render diagrams and maths the same way as the starter. ` ```mermaid ` code fences are rendered by `astro-mermaid`. `$…$` and `$$…$$` are rendered by `remark-math` and `rehype-katex`, which also need the KaTeX stylesheet. Because of `remark-math`, currency needs escaping: write `\$100`. A malformed formula does not fail the build; it renders as red text, which the link checker reports. The content column is narrow, so prefer top-down Mermaid flowcharts (`flowchart TD`) to wide left-to-right ones, and use a table rather than a diagram for a taxonomy.
