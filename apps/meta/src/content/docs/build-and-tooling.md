---
title: Build & Tooling
description: The CAIRN repository layout, the generated llms.txt files, the built-site link checker, the version footer, and the shared Starlight package.
---

## Layout

```
cairn/
├── apps/
│   ├── delegation-risk/         # delegation-risk.quantifieduncertainty.org
│   ├── evaluation-engineering/  # evaluation-engineering.quantifieduncertainty.org
│   ├── reasoning-processes/     # reasoning-processes.quantifieduncertainty.org
│   └── meta/                    # this handbook
├── packages/
│   ├── starlight/   # @cairn/starlight: shared Footer and Copy-as-Markdown button
│   ├── config/      # @cairn/config: shared ESLint config
│   └── ui/          # @cairn/ui: React component library, no longer imported by any site
├── scripts/
│   ├── generate-llm-files.mjs   # builds public/llms.txt and llms-full.txt
│   ├── check-built-links.py     # checks links, anchors and KaTeX in built sites
│   └── sync-versions.mjs        # writes version.json (see below)
├── starters/research-wiki/      # standalone template, not part of the workspace
├── audits/                      # review-round reports and plans
└── .github/workflows/           # ci.yml, release.yml
```

Each app is an Astro Starlight site with its own `astro.config.mjs`, `vercel.json` and Vercel project. The workspace is pnpm (`pnpm-workspace.yaml` covers `apps/*` and `packages/*`):

```bash
pnpm install
pnpm --filter evaluation-engineering dev     # http://localhost:4321
pnpm --filter evaluation-engineering build   # → apps/evaluation-engineering/dist
pnpm build                                   # every app
python3 scripts/check-built-links.py         # after building
```

CI (`.github/workflows/ci.yml`) runs on pushes and pull requests to `main`. It installs, builds all four apps, then runs the link checker. It does not run lint.

## llms.txt generation

`scripts/generate-llm-files.mjs` writes two files into an app's `public/`:

- `llms.txt`: an index with one line per page, giving its sidebar label, URL and frontmatter `description`, grouped under the sidebar's section labels.
- `llms-full.txt`: every page concatenated in sidebar order, for LLM context or offline reading.

It runs at the start of `build` in all four apps, and on its own as `pnpm gen:llms`. Site metadata comes from the app's `llms.config.json`; page order comes from parsing the `sidebar` block of `astro.config.mjs` as text. That parse only understands explicit `{ label, slug }` entries, `{ label, link }` placeholders, and group labels followed by `collapsed:`. The exact rules are in [Adding a Wiki](/adding-a-wiki/#3-edit-astroconfigmjs).

Deriving the files from the sidebar is the point: an earlier hand-written `llms.txt` drifted out of step with the chapter numbering. The script fails the build if `llms.config.json` is missing or lacks a required field, if a sidebar slug has no matching `.md`/`.mdx` file, or if the sidebar yields no chapters. Page bodies are lightly cleaned: frontmatter and `import` lines are removed, `:::note[Title]` asides become bold lines, and JSX component tags are dropped while their contents are kept. Only one level is stripped, so a component nested inside another, such as `<TabItem>` inside `<Tabs>`, keeps its tags.

## Link checker

`scripts/check-built-links.py` reads the built HTML, not the source. It finds sites by looking for apps that have both an `llms.config.json` and a `dist/`, and maps each site's domain (the `url` in that file) to its build. For every link inside `<main>` it checks:

- root-relative links (`/foo/`) against the same site's build;
- absolute links to any checked site's domain against that site's build, so cross-wiki links are checked too;
- `#fragment` targets against the `id` attributes of the target page.

It also reports KaTeX parse errors. `rehype-katex` renders a bad formula as red text instead of failing the build, so this is the only automated check that catches them. It exits 1 on any problem. It does not check external links, relative links such as `./page`, or anything outside `<main>` (header, sidebar, footer). It also compares fragments without percent-decoding them, so a non-ASCII heading anchor can be reported as missing when it isn't.

## Version footer

Each app has a `version.json` and a small `Footer.astro` that turns it into a string such as `0.0.1` or `0.0.1+abc1234` and passes it to the shared footer, which prints it as `v0.0.1`. Nothing updates `version.json` during a build. It changes only when `scripts/sync-versions.mjs` runs, normally as the second half of `pnpm run version` (after `changeset version`). That script copies each app's `package.json` version into its `version.json`, along with the current short commit hash and the date. Its list of apps is hard-coded.

`.changeset/` holds only the Changesets config and README, with no pending changesets, so in practice the versions stay at `0.0.1`. `release.yml` runs the Changesets action on every push to `main`, and with nothing pending it does nothing. The October 2026 infrastructure audit (`audits/2026-10/meta-infra.md`) proposes replacing this with a build-time commit hash and date.

## Shared packages

`@cairn/starlight` (`packages/starlight`) exports two Astro components:

- `Footer.astro` replaces Starlight's footer. It keeps Starlight's edit link, last-updated line and pagination, and adds the Copy-as-Markdown button and the version string. Apps use it through the `components.Footer` override in their Starlight config.
- `CopyAsMarkdown.astro` converts the page's main content to Markdown in the browser. It loads Turndown from unpkg on first click, and copies the result to the clipboard under a small YAML header giving the title, source URL and date.

Its `peerDependencies` pin `astro ^5` and `@astrojs/starlight ^0.37`, so they must be bumped together with any Astro upgrade.

`@cairn/config` (`packages/config`) is the shared flat ESLint config. Delegation Risk, Reasoning Processes and this handbook use it; Evaluation Engineering has its own. `@cairn/ui` (`packages/ui`) is a React component library built for the LongtermWiki apps, which have since moved out of this repository. No page imports it, and it is due to be deleted, along with the unused Tailwind setup, in the planned stack upgrade.
