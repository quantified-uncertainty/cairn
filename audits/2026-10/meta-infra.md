# CAIRN audit: apps/meta content + cross-site infrastructure

Audited 2026-10-15 at commit 33b7ef9. No tracked files were modified. `dist/` and `.astro/` were built and are gitignored; `git status` is clean.

---

## Verdicts

### Part A: apps/meta content, **3/10**

- About **17k of the 27k words (~63%) describe `apps/longterm`**, which was removed in 40b16f8 and now lives in the standalone `longterm-wiki` repo. That material covers the YAML entity layer, `EntityLink`, path registry, `page-improver.mjs`, `grade-content.mjs`, the SQLite `knowledge.db`, `kb:scan`, `validate:mdx`, the enhancement queue, the AI-risk "Model Style Guide", cause-effect YAML, and research-report style. None of these scripts or components exists anywhere in this repo (grep: 0 hits outside apps/meta).
- The built meta site has **101 broken internal links**. 77 of them are on `/enhancement-queue/`. CI does not catch them (see B-P0-3).
- Site title is "LongtermWiki Meta" and the description is "How to build LongtermWiki-like knowledge bases". The homepage explains "What is LongtermWiki?". Nothing in the site documents what CAIRN actually has:
  - the generated `llms.txt`
  - `check-built-links.py`
  - `CopyAsMarkdown`
  - the explicit-sidebar "book" pattern
  - the REVISION_PLAN / adversarial-review / citation-review workflow that produced the last ~10 PRs
  - how to add a new wiki
- **What still has value:** `workshop.mdx` (6.5k words) is concrete, practical and well structured, with good "watch out for" and troubleshooting sections. `claude-code-web-app.mdx` is a reasonable idea. Both are now stale in specific, fixable ways (Node version, install method, sudo advice, web-app mechanics, event dates).
- **Score:** 3 = one solid page, one salvageable page, and the rest is the wrong product.

### Part B: cross-site infrastructure and presentation, **5/10**

**Working:**
- All 4 apps build with exit 0.
- CI builds all 4 apps.
- `generate-llm-files.mjs` is a good design: it derives the files from the sidebar and fails on missing slugs.
- A link, anchor and KaTeX checker exists.
- Shared Footer and ESLint config.
- Vercel config is consistent.
- The live domains resolve (all 200).

**Not working:**
- Dependencies are two Astro majors behind: Astro 5.16 vs latest 7.3.8, Starlight 0.37 vs 0.42.6.
- CI runs on Node 20, which reached EOL in April 2026. Astro 6+ requires Node ≥22.12.
- The link checker silently skips meta and delegation-risk, which together hold 175 of the 222 pages.
- Delegation-risk's `llms.txt` is hand-written, stale, and **live**: it points to the wrong domain (`delegation-risk.org`) and to 404 paths.
- The delegation-risk header still links to a PDF that its own homepage says "has been withdrawn".
- `@cairn/ui` is 7.3k LOC, and only one ~80-line Mermaid wrapper from it is used, by one site.
- Tailwind is installed in all 4 apps and used by none.
- No og:image, robots.txt, analytics, custom favicon or accent colour. All four sites are stock Starlight with the default star icon and look identical.
- No cross-site navigation or QURI hub. Delegation-risk doesn't link to the other three. Meta doesn't mention EE or RP.
- No root README or root CLAUDE.md.

---

## Build results

| Target | Result | Pages | Warnings |
|---|---|---|---|
| `pnpm install --frozen-lockfile` | OK (8.1s, 804 pkgs) | | none |
| meta | OK | 20 | 1 × expressive-code "squiggle" language not found (content-formats.mdx) |
| delegation-risk | OK | 155 | 72 × "squiggle" language not found (experimental/probabilistic-estimation/estimates/*.md, tools/trust-updater.mdx) |
| evaluation-engineering | OK | 21 | none; llms files regenerated, identical to committed |
| reasoning-processes | OK | 26 | none; llms files regenerated, identical to committed |
| `scripts/check-built-links.py` | "checked 899 links, 0 broken" | | covers only EE and RP (apps with `llms.config.json`) |
| Extended checker over all 4 sites, incl. relative links (my scratch script) | **101 broken in meta**; 0 real in DR | | 3 DR "anchor" hits for `#what-%CF%81-…` are false positives (id is `what-ρ-…`). The repo script would report them too if DR were added, because it doesn't `unquote()` fragments. |
| `pnpm -r lint` | OK | | 15 `no-unused-vars` warnings, all in DR components (e.g. `SquiggleRiskCalculator.tsx` `isSimulating`, `TrustUpdater.tsx` `addToHistory`, `gammaLanczos`) |
| starters/research-wiki (copied to scratch, `npm install && npm run build`) | OK | | resolved Astro 5.18.2 / Starlight 0.37.7; vite chunk-size warning (mermaid); sitemap "requires site" (expected); `tsconfck` deprecated |

**Dependency staleness** (`pnpm -r outdated`):

| Package | Installed | Latest | Notes |
|---|---|---|---|
| astro | 5.16.15 | 7.3.8 | 7.x engines: node ≥22.12 |
| @astrojs/starlight | 0.37.4 | 0.42.6 | requires astro ^7.2 |
| @astrojs/react | 4.4.2 | 7.0.1 | |
| mermaid | 11.12 | 12.2 | |
| astro-mermaid | 1.3 | 2.1 | |
| typescript | 5.9 | 7.0 | |
| eslint | 9 | 10 | |
| tailwindcss | 4.1 | 4.3 | |
| lucide-react | 0.562 | 1.57 | |
| @dagrejs/dagre | 1.1 | 3.1 | |
| @tanstack/react-table | 8 | 9 | |
| @changesets/cli | 2 | 3 | |

Most of the last four go away if `@cairn/ui` is deleted. KaTeX: CSS loaded from CDN @0.16.11 on every page, while rehype-katex resolved katex@0.16.28. The starter already uses 0.16.28.

---

## Part A findings: apps/meta

### P0 (broken or wrong)

**A-P0-1. Site identity is a removed product.** S
- **Where:** `apps/meta/astro.config.mjs` (title "LongtermWiki Meta", description "How to build LongtermWiki-like knowledge bases"), `src/content/docs/index.mdx` ("What is LongtermWiki? … a framework…"), `getting-started/introduction.mdx` ("LongtermWiki is a monorepo framework…"), `styles/global.css` comment.
- **Evidence:** 40b16f8 removed `apps/longterm` ("superseded by the standalone longterm-wiki repo"). The repo is CAIRN and hosts DR, EE and RP. The live site at cairn-meta.vercel.app serves this same stale title.
- **Fix:** Rename to "CAIRN" or "CAIRN Handbook" ("How QURI builds LLM-assisted research wikis"). Rewrite the homepage as a hub that cards the 3 live wikis, the workshop and the starter. Consider a real domain such as `cairn.quantifieduncertainty.org`, consistent with the other three.

**A-P0-2. About 10 pages document scripts, components and data that don't exist in this repo.** M (mostly deletion)
- **Where:** `architecture/index.mdx`, `content-formats.mdx`, `knowledge-base.mdx`, `models.mdx`, `cause-effect-diagrams.mdx`, `workflows.mdx`, `research-reports.mdx`, `content-database.mdx`, `automation-tools.mdx`, `enhancement-queue.mdx`, `project-roadmap.md`, `reports/*`.
- **Evidence:**
  - `page-improver`, `grade-content`, `document-enhancer`, `scan-content`, `generate-summaries`, `export-resources`, `knowledge-db`, `kb:scan`, `validate:mdx` and `build:data` each get 0 hits outside apps/meta.
  - `EntityLink`, path registry and `src/data/entities/*.yaml` are absent.
  - `content-database.mdx` imports `./scripts/lib/knowledge-db.mjs` and `../../components/wiki` inside code blocks.
  - `project-roadmap.md` claims "14 validators … ✅ Complete".
- **Fix:** Cut these pages from cairn. If the owner wants them preserved, move them to the `longterm-wiki` repo's own docs, where they are true. Salvage only the generic principles (see triage table).

**A-P0-3. 101 broken internal links in the built meta site.** S (falls out of A-P0-2)
- **Where:**

  | Page | Broken links | Targets |
  |---|---|---|
  | enhancement-queue | 77 | `/knowledge-base/risks/...`, `/internal/models/` |
  | content-formats | 9 | `/ai-transition-model/...`, `/diagrams/` |
  | reports/causal-diagram-visualization | 6 | `/diagrams/master-graph?...` |
  | knowledge-base | 3 | |
  | getting-started/introduction | 2 | `/architecture/overview/`, `/components/overview/` (real paths are `/architecture/` and `/components/`) |
  | reports/index | 1 | `/knowledge-base/research-reports/` |
  | research-reports | 1 | |
  | cause-effect-diagrams | 1 | `/diagrams` |
  | project-roadmap | 1 | `/internal/enhancement-queue/` |

- **Fix:** Delete the pages per A-P0-2 and fix the two intro links. Then add meta to the link checker (B-P0-3).

**A-P0-4. Workshop setup instructions are now wrong.** S
- **Where:** `workshop.mdx` lines 16–17, 102–108, 774–780, 907.
- **Evidence:**
  - **Node version:**
    - The page says "Node.js 18+" and `nvm install 18`.
    - `npm create astro@latest` now installs Astro 7, whose engines field is `node >=22.12.0`.
    - The npm install of Claude Code also states Node.js 22+ (code.claude.com/docs/en/setup).
    - Node 18 has been EOL since April 2025, and Node 20 since April 2026.
    - Attendees following the page on Node 18 or 20 will fail at step 2.
  - **sudo:** The page recommends `sudo npm install -g @anthropic-ai/claude-code` twice. The current official docs explicitly say not to use `sudo npm install -g` ("permission issues and security risks").
  - **Install method:** The page labels npm "(recommended)". Current docs lead with the native installer (`curl -fsSL https://claude.ai/install.sh | bash`; PowerShell/WinGet on Windows). Homebrew is a cask (`brew install --cask claude-code`), not `brew install claude-code`.
  - **Docs URLs:** `docs.anthropic.com/en/docs/claude-code/*` now 301-redirects to `code.claude.com/docs/en/*`. They still work, but should be updated.
- **Fix:**
  - Require Node 22 LTS or later.
  - Lead with the native installer and drop the sudo advice.
  - Point the Windows note at the native Windows install and Git for Windows.
  - Update the doc links.
  - Add a "last verified: <date>" line at the top of the page.

**A-P0-5. The web-app guide misdescribes the product.** M
- **Where:** `claude-code-web-app.mdx`.
- **Evidence:**
  - The page says the web app "creates a GitHub repo for your project automatically" and gives you "a built-in terminal and file editor", with a "Create project" button.
  - Current docs (code.claude.com/docs/en/claude-code-on-the-web) describe cloud sessions that run against repositories connected through the Claude GitHub App or `/web-setup` (gh token). They also note that terminal-only commands (e.g. `/resume`) aren't available in cloud sessions, and they describe `claude --teleport` for pulling a cloud session down to a local checkout.
  - The guide's "Use the built-in terminal… run `npm run build`" advice is therefore misleading. You ask Claude to run the build.
  - It omits that cloud sessions push to `claude/*` branches. Vercel then builds **preview** deployments, not production, so "open your Vercel URL and refresh" won't show changes until merge.
  - The plan list omits Team and Enterprise plans.
- **Fix:** Rewrite against the current docs:
  - Create an empty GitHub repo first, then connect it.
  - Ask Claude to scaffold the site and run `npm run build`.
  - Use Vercel preview URLs per branch.
  - Merge to main for production.
  - Use `--teleport` to move to local work.
  - Keep it to about 600 words.

### P1 (significant)

**A-P1-1. Stale, dated event content.** S
- **Where:** `workshop.mdx` lines 44–52: "Upcoming event logistics (February 2026 — EAG SF)". It also links a Google Doc and Slides from that event.
- **Fix:** Move event specifics into a dated "Past sessions" footnote. Keep the page evergreen.

**A-P1-2. Workshop troubleshooting contains incorrect advice.** S
- **Where:** `workshop.mdx`:
  - "MDX imports must go … with no blank lines between imports" (false; blank lines are fine).
  - "Blank page — missing frontmatter" (Starlight fails the build with a schema error when `title` is missing; it does not render blank).
  - "Deployed site loads but styles are missing → make sure `site` matches" (`site` doesn't affect asset loading; `base` does).
  - "Prefix filenames with numbers `01-intro.mdx`" (this puts `01-` into the URL slug; prefer `sidebar.order`). The starter's CLAUDE.md repeats this.
- **Fix:** Correct these four items in both files.

**A-P1-3. Workshop is missing current Claude Code features that matter for this workflow.** S
- **Gaps:**
  - Plan mode and permission-mode cycling with Shift+Tab, which is better than recommending `--dangerously-skip-permissions` as the speed option.
  - Checkpoints and `/rewind` (Esc Esc), as the undo path alongside git.
  - Auto-compaction and `/context`.
  - `claude --resume`.
  - `/terminal-setup` for terminals where Shift+Enter doesn't insert a newline.
  - Subagents for parallel page drafting.
  - Desktop app / IDE extension as a first-class option.
- **Fix:** Add a compact "Claude Code in 2026" table and remove the claim that "context too long" is a common warning. Keep it short. Feature names drift fast, so link the docs rather than enumerating everything.

**A-P1-4. Workshop doesn't teach the quality workflow this repo actually uses.** M
- **Evidence:** The repo's best practice, visible in git history and the app-root plan docs, is:
  - full-corpus read, then a written REVISION_PLAN
  - adversarial review
  - citation verification
  - a "credibility hardening" pass that purges fabricated empiricism
  - a terminology canon
  - label-swap measurement

  The workshop stops at "ask Claude to self-audit".
- **Fix:** Add a "Making it trustworthy" section, or a separate page, that distils `apps/delegation-risk/CREDIBILITY_HARDENING_PLAN.md`, `TERMINOLOGY.md` and the EE/RP REVISION_PLANs into a reusable recipe with prompts.

**A-P1-5. Components page documents a package that doesn't exist and one that is effectively dead.** S
- **Where:** `components/index.mdx`. It documents `@cairn/tailwind` ("Shared Tailwind CSS theme tokens"), which does not exist. It also documents the `@cairn/ui` shadcn components and CauseEffectGraph, which no site uses (B-P1-1).
- **Fix:** Replace with a page on what the wikis actually use: Starlight components, `astro-mermaid` code fences, KaTeX, `ProcessMap.astro` as an example of a static SVG component, and DR's React islands as the interactive example.

**A-P1-6. Meta uses a different Mermaid mechanism from every other site.** S
- **Evidence:** Meta pages use `<Mermaid client:load chart={...}/>` from `@cairn/ui/mermaid` with `securityLevel: 'loose'`. DR, EE, RP and the starter all use `astro-mermaid` code fences. Meta also has its own unused `src/components/Mermaid.tsx`.
- **Fix:** Switch meta to `astro-mermaid` fences, delete `src/components/Mermaid.tsx`, and drop the `@cairn/ui`, `@xyflow/react` and `elkjs` deps from meta.

**A-P1-7. Nothing documents the real CAIRN infrastructure.** M
- **Missing pages:**
  - "Add a new wiki". The checklist is:
    - copy the starter or an app
    - `llms.config.json`
    - add to `ci.yml`
    - add to the `sync-versions.mjs` list
    - Vercel project, domain and vercel.json
    - Footer wrapper
    - CLAUDE.md
  - "Build tooling": `generate-llm-files.mjs` and its sidebar-parsing constraints (it only parses explicit `{label, slug}` entries, so autogenerate sidebars like DR's aren't supported), `check-built-links.py`, CopyAsMarkdown, the version footer.
  - "The book pattern": numbered explicit sidebar, status table on the index, planned-chapter placeholders.
- **Fix:** Write these three pages, about 1.5k words total.

**A-P1-8. Dead metadata in frontmatter.** S
- **Evidence:** `importance`, `quality`, `llmSummary`, `lastEdited`, `createdAt` and `lastUpdated` appear across meta pages. The schema is plain `docsSchema()`, so these fields are silently stripped and nothing reads them. They are leftovers from longterm's grading system.
- **Fix:** Remove them along with the page cuts.

### P2 (polish)

- **A-P2-1. No favicon.** `apps/meta` has no `public/` directory, so `/favicon.svg` 404s on the live site. S
- **A-P2-2. Dead CSS.** `src/styles/global.css` isn't in `customCss`, so it is dead. Its accent values (`217 91% 60%`) are also in the wrong format for Starlight (Starlight expects full colour values). S
- **A-P2-3. LLM-prose smell across the longterm pages.** S. These pages are all being cut, so the only action is to avoid repeating the pattern. Signs include:
  - badge soup (`<Badge text="kb-2.0"/>`)
  - "Most Critical Requirement" danger asides
  - ✅ status tables
  - cost tables in "(Opus)" dollars with no model or version
  - "This is the magic moment"
- **A-P2-4. Workshop length.** The workshop is 6.5k words in one page with three overlapping prompt tables ("If you're stuck", "Effective prompting", "Content Quality" troubleshooting). M
  - Split it into "Workshop walkthrough" (~2.5k), "Troubleshooting" (~1.5k) and "Prompting research content" (~1.5k).
  - Remove the duplicated `/clear` vs `/compact` advice, which appears three times.
  - Remove the "Non-Code Alternatives" claim that they're "harder to scale past ~50 pages" (unsupported).
- **A-P2-5. Demo table omits two wikis.** The "Demo Projects" table lists LongTermWiki and Delegation Risk only. Add Robust Reasoning Processes and Evaluation Engineering as live examples of the "small textbook" pattern. S

### Per-page triage (19 pages, ~27k words)

| Page | Words | Verdict | Notes |
|---|---|---|---|
| index.mdx | 90 | **Rewrite** | CAIRN hub: the 3 wikis, workshop, starter, GitHub |
| getting-started/introduction.mdx | 149 | **Rewrite** | Monorepo tree is accurate. Fix 2 broken links and remove "LongtermWiki". Merge with architecture. |
| workshop.mdx | 6530 | **Keep + update + split** | A-P0-4, A-P1-1/2/3/4, A-P2-4 |
| claude-code-web-app.mdx | 979 | **Rewrite** | A-P0-5 |
| architecture/index.mdx | 142 | **Rewrite** | Describe the real architecture: apps, shared packages, build-time llms generation, CI. Drop YAML/EntityLink. |
| components/index.mdx | 150 | **Rewrite** | A-P1-5 |
| mermaid-diagrams.mdx | 908 | **Merge** into a ~300-word "Diagrams & math" page | Layout advice (prefer TD, tables for taxonomies) is generic and useful |
| cause-effect-diagrams.mdx | 1416 | **Cut / move to longterm-wiki** | Component unused in CAIRN |
| content-formats.mdx | 1715 | **Cut** | Longterm-specific. 9 broken links. Squiggle warning. |
| knowledge-base.mdx | 1603 | **Cut**, salvage ~200 words | "Content over format" and "proper hierarchy" principles can go into a CAIRN writing guide |
| models.mdx | 3388 | **Cut / move** | AI-risk model style guide for longterm |
| workflows.mdx | 1631 | **Cut, replace** | Replace with the real review workflow (A-P1-4) |
| research-reports.mdx | 978 | **Cut / move** | |
| content-database.mdx | 1811 | **Cut** | SQLite system doesn't exist here |
| automation-tools.mdx | 1670 | **Cut, replace** | Replace with "Build tooling" (A-P1-7) |
| enhancement-queue.mdx | 979 | **Cut** | 77 broken links. A longterm task tracker. |
| reports/index.mdx | 145 | **Cut** | |
| reports/causal-diagram-visualization.mdx | 2066 | **Move to longterm-wiki** | Decent lit survey but about longterm's graph; dated 2025-01-08 |
| project-roadmap.md | 490 | **Cut** | Orphan (not in sidebar), longterm roadmap |

After the cuts, meta is about 9–10k words across about 8 pages, and every claim in it is true of this repo.

---

## Part B findings: infrastructure and presentation

### P0 (broken or wrong)

**B-P0-1. Delegation-risk `llms.txt` and `llms-core.txt` are stale, hand-maintained and live.** S
- **Where:** `apps/delegation-risk/public/llms.txt`, `llms-core.txt`, `llms-full.txt`.
- **Evidence:**
  - 29 links use the domain `https://delegation-risk.org/...`. The site is `delegation-risk.quantifieduncertainty.org`.
  - The paths are pre-restructure (`/framework/overview/`, `/applying/least-x-principles/`, `/getting-started/introduction/`, none of which exist).
  - The header says "Version: 1.0.1" and llms-core says "Generated: 2025-12-23". These files were last touched 2026-02-15, while the content was last touched 2026-06-10.
  - curl of the live `/llms.txt` confirms the stale file is being served.
  - DR has no `llms.config.json`, so it isn't generated.
- **Fix:** Extend `generate-llm-files.mjs` to handle `autogenerate` sidebar groups by walking the directory and ordering by `sidebar.order` then title. Alternatively, switch DR to an explicit sidebar. Then add `llms.config.json`, wire `gen:llms` into DR's build, and delete `llms-core.txt` or generate it from a "Core Path" list.

**B-P0-2. Delegation-risk header links to a withdrawn PDF.** S
- **Where:** `apps/delegation-risk/astro.config.mjs` `social[0]`: "Download PDF" pointing to `.../releases/download/v1.0.0/delegation-risk-framework-book.pdf`.
- **Evidence:** The homepage (`index.mdx` line 143–146) says "The earlier v1.0.0 book predates that revision and has been withdrawn; until v2 ships, the website is the authoritative version."
- **Fix:** Remove the social link until v2 exists. Also verify that the GitHub social link (`delegation-risk-framework` repo) is still the canonical source, since the content now lives in `cairn`.

**B-P0-3. The link checker silently skips half the sites, and CI therefore misses 101 broken links.** S
- **Where:** `scripts/check-built-links.py` discovers sites via `apps/*/llms.config.json`, which only EE and RP have. That leaves out 175 of 222 built pages (meta and DR).
- **Other gaps:**
  - It skips relative hrefs (the `else: continue` branch), e.g. `./causal-diagram-visualization`.
  - It doesn't `unquote()` URL fragments, so non-ASCII anchors such as DR's `#what-ρ-…` would false-positive.
- **Fix:**
  - Discover sites from each app's `astro.config.mjs` `site:`, or add a minimal `llms.config.json` to every app.
  - Resolve relative links with `urljoin` against the page path.
  - Unquote fragments.
  - A scratch version implementing all three found exactly the meta breakage and 0 real DR breakage. Effort S.

**B-P0-4. CI and engines are pinned to an EOL Node, which blocks the Astro upgrade.** S
- **Where:** `.github/workflows/ci.yml` and `release.yml` use `node-version: '20'`. Root `package.json` has `engines.node >=20`. The starter has `>=18`.
- **Evidence:** Node 20 has been EOL since April 2026. Astro 6 and 7 require `>=22.12.0`.
- **Fix:** Move to Node 22 LTS (or 24) everywhere, and add `.nvmrc` / `"engines"` to match. Pin the Node version in Vercel project settings too.

### P1 (significant)

**B-P1-1. `@cairn/ui` is about 7.3k LOC of dead code with heavy dependencies.** M
- **Where:** `packages/ui/src/{components,graph}/**`.
- **Evidence:** The only import anywhere is `@cairn/ui/mermaid`, from meta pages, which A-P1-6 removes. DR declares `@cairn/ui` in `package.json` but never imports it. Its dependencies are about 10 Radix packages, @tanstack/react-table, @xyflow/react, elkjs, dagre, lucide-react and tailwind-merge. Several are majors behind, and all add to install time.
- **Fix:** Delete `packages/ui`, or move it to the longterm-wiki repo if it is still used there. Remove `@cairn/ui` from DR and meta, and `@xyflow/react` and `elkjs` from meta. DR keeps its own `@xyflow/react` for `DelegationGraph.tsx`.

**B-P1-2. Two Astro majors and five Starlight minors behind.** L (staged)
- **Evidence:** Astro 5.16.15 vs 7.3.8; Starlight 0.37.4 vs 0.42.6 (which needs astro ^7.2); @astrojs/react 4 vs 7; mermaid 11 vs 12; astro-mermaid 1 vs 2. Astro 5 still builds today, but security fixes and Starlight features (e.g. newer head/OG handling) are on 7.
- **Fix:**
  1. Node 22 (B-P0-4).
  2. Delete `@cairn/ui` and Tailwind (B-P1-1, B-P1-3) to shrink the surface.
  3. Upgrade one app (EE, the smallest) to Astro 7 + Starlight 0.42 and run the link checker.
  4. Roll out to the others and the starter.
  5. Keep the `@cairn/starlight` `peerDependencies` (`astro ^5`, `starlight ^0.37`) in sync. They will block the upgrade otherwise.

**B-P1-3. Tailwind is installed and configured in 4 apps and the starter, and used nowhere.** S
- **Evidence:**
  - 0 Tailwind utility classes across all app sources. The two `class="grid"` hits in `ProcessMap.astro` are SVG gridlines.
  - EE and RP `global.css` exist only to undo Tailwind preflight's damage to Starlight lists.
  - DR lists `tailwindcss` and `@tailwindcss/vite` but never loads them.
  - Meta loads the vite plugin, but its CSS isn't included.
- **Fix:** Remove Tailwind from all apps, which also lets you delete the list-style patch. For the starter, either remove it too or use the official `@astrojs/starlight-tailwind` layered setup, so preflight doesn't fight Starlight.

**B-P1-4. No cross-site navigation, hub or consistent attribution.** M
- **Evidence:**
  - EE and RP link to each other (10 and 6 links) and to the cairn GitHub.
  - DR links to none of the others and never mentions QURI (0 links to quantifieduncertainty.org).
  - Meta links to DR but not to EE or RP.
  - No site has a header or footer link to QURI or to sibling wikis.
- **Fix:**
  - Add a "QURI research wikis" strip to the shared `packages/starlight/Footer.astro`: the 3 wikis plus the handbook plus quantifieduncertainty.org. Drive it from one JSON in the package so each site gets it for free.
  - Add a one-line "A QURI project · by Ozzie Gooen et al." attribution.
  - Make the meta homepage the hub.

**B-P1-5. No social and SEO polish beyond Starlight defaults.** M
- **Evidence:**
  - Every page emits `twitter:card=summary_large_image` but there is **no `og:image`**, so shares render as bare text cards.
  - No `robots.txt` on any site (the live `/robots.txt` returns the 404 HTML page).
  - DR has no site-level `description` in its Starlight config; it falls back per page.
- **Fix:**
  - Generate per-site OG images (static PNG per site at minimum, or `astro-og-canvas` per page) and add an `og:image` head entry.
  - Add `public/robots.txt` with a `Sitemap:` line. Include an `llms.txt` pointer, and consider allowing AI crawlers explicitly, since the sites are built for LLM consumption.

**B-P1-6. No branding and identical appearance.** M
- **Evidence:** All three sites with a `public/` folder ship the byte-identical default Starlight favicon (md5 `1883fa14…`), and meta has none. No accent colours are set anywhere. The four sites look indistinguishable in a tab bar or screenshot.
- **Fix:** Give each site a simple distinct favicon and accent hue. Put a shared QURI logo/wordmark in the header via Starlight `logo`. Put the shared tokens in `packages/starlight` (e.g. `@cairn/starlight/theme.css`). This also makes the "@cairn/tailwind theme tokens" idea real in a simpler form.

**B-P1-7. No root README, no root CLAUDE.md, and no CLAUDE.md for DR or meta.** S
- **Evidence:** `git ls-files` shows CLAUDE.md only in EE, RP and the starter. There is no README at the root. Anyone landing on github.com/quantified-uncertainty/cairn sees a bare file list.
- **Fix:**
  - Root README: what CAIRN is, the 4 sites with live links, `pnpm install` / `pnpm --filter <app> dev`, how to add a wiki, CI and link checking.
  - Root CLAUDE.md: monorepo conventions, "don't hand-edit llms files", "run check-built-links after build", where plans live.
  - DR CLAUDE.md, adapted from EE's.

**B-P1-8. Planning docs sit at app roots and some are finished.** S
- **Where:**
  - `apps/delegation-risk/{CREDIBILITY_HARDENING_PLAN.md (3.4k w), GETTING_STARTED_REVAMP.md ("Status: EXECUTED 2026-06-09"), REVAMP_BRIEF.md (executed brief), REVISION_PLAN.md, TERMINOLOGY.md}`
  - `apps/evaluation-engineering/REVISION_PLAN.md`
  - `apps/reasoning-processes/REVISION_PLAN.md`
- **Fix:**
  - Create `apps/<app>/plans/` (or a root `docs/plans/<app>/`).
  - Archive the executed briefs (GETTING_STARTED_REVAMP, REVAMP_BRIEF) under `plans/archive/` or delete them, since git history keeps them.
  - Keep the active REVISION_PLANs and `TERMINOLOGY.md`. TERMINOLOGY is a living canon, so put it in `plans/` or `docs/`.
  - Update links: `experiments/label-swap/README.md` links `../../REVISION_PLAN.md`.

**B-P1-9. The versioning machinery produces misleading output.** S
- **Evidence:**
  - Footers render `v0.0.1+320fa80` on meta and DR, which is a January commit hash. EE and RP render `v0.0.1`.
  - `version.json` only changes when someone runs `pnpm version` (changesets), and no changesets exist.
  - `release.yml` runs changesets/action on every push to main to do nothing.
  - `@cairn/*` packages aren't `"private": true`, so a stray changeset plus `pnpm release` would attempt an npm publish.
- **Fix:** Drop changesets, `release.yml`, `sync-versions.mjs` and `version.json`. Have the Footer read the build-time git short hash and date (`VERCEL_GIT_COMMIT_SHA` or `git rev-parse` in astro.config, passed via `import.meta.env`) and render "Updated 2026-10-15 · abc1234". Content sites rarely need semver, so if the owner wants it, mark the packages private.

**B-P1-10. The starter isn't built in CI and isn't in the workspace.** S
- **Evidence:** `pnpm-workspace.yaml` covers `apps/*` and `packages/*` only. Workshop attendees `degit` it from main with no lockfile. It built fine today (Astro 5.18.2), but nothing guards it.
- **Fix:** Add a CI job: copy the starter to a temp dir, `npm install`, `npm run build`. Bump its `engines` to `>=22.12`.

### P2 (polish)

**B-P2-1. 73 "squiggle" highlighting warnings.** S
- **Where:** DR estimates pages and meta `content-formats`.
- **Fix:** Register a Squiggle TextMate grammar in expressive-code `langs`, or alias it to `js` via `shiki: { langAlias: { squiggle: 'js' } }`.

**B-P2-2. KaTeX CSS comes from a third-party CDN, on every page, at a mismatched version.** S
- **Evidence:** jsdelivr `katex@0.16.11` is a render-blocking stylesheet on all 202 pages of DR, EE and RP, including pages without math. The JS is 0.16.28.
- **Fix:** `import 'katex/dist/katex.min.css'` via `customCss`, which self-hosts it at the matching version.

**B-P2-3. CopyAsMarkdown pulls code from unpkg at click time and appears on splash homepages.** S
- **Where:** `packages/starlight/src/components/CopyAsMarkdown.astro`. It loads `https://unpkg.com/turndown@7.1.2` at runtime.
- **Fix:**
  - Bundle turndown as a dependency, or better, emit per-page `.md` at build time from `generate-llm-files` and have the button fetch that.
  - Hide it on `template: splash` pages.
  - Swap `.innerHTML` for an aria-live status region; the existing status span lacks `role="status"`.

**B-P2-4. No analytics on any site.** S
- **Evidence:** No analytics script found in any `dist/`.
- **Fix:** If the owner wants usage data, enable Vercel Web Analytics (one toggle plus `@vercel/analytics`) or Plausible, through a shared head entry in `@cairn/starlight`.

**B-P2-5. Search is per-site Pagefind only.** M
- **Fix:** Optional. Pagefind supports multisite search by merging indexes (`mergeIndex`), which could give the hub a cross-wiki search box.

**B-P2-6. Lint isn't in CI, and DR has 15 unused-variable warnings.** S
- **Where:** `SquiggleRiskCalculator.tsx`, `TrustUpdater.tsx`, `SensitivityDashboard.tsx`, `DelegationGraph.tsx`, `ArchitectureComparator.tsx`. These point to half-finished UI (e.g. a simulation state never shown, a history feature never wired). No `astro check` / typecheck exists anywhere.
- **Fix:** Add `pnpm -r lint` and `astro check` to CI and clean the warnings. EE has its own ESLint config instead of `@cairn/config`, so unify it. `--ext` in the lint scripts is a legacy flag under flat config; drop it.

**B-P2-7. Committed `.pyc` file.** S
- **Where:** `apps/reasoning-processes/experiments/label-swap/__pycache__/label_swap.cpython-311.pyc`.
- **Fix:** Remove it and add `__pycache__/` to `.gitignore`.

**B-P2-8. `.claude/settings.json` allow-list is both too broad and stale.** S
- **Evidence:**
  - It allows `rm:*`, `curl:*`, `perl:*` and `git:*` (including push), but not `pnpm`, which the repo uses.
  - It lists `mcp__puppeteer__*` tools that aren't configured.
  - Only one repo skill remains (`frontend-design`). The two longterm skills were removed.
- **Fix:** Add `Bash(pnpm:*)` and `Bash(python3 scripts/check-built-links.py)`. Drop puppeteer. Consider narrowing `rm` and `git push`.

**B-P2-9. Accessibility is mostly inherited from Starlight, which is fine.** Spot checks:
- 0 `<img>` without alt.
- `ProcessMap.astro` has `role="img"` and an aria-label. A visible data table or `<desc>` fallback for screen readers would help.

  Mermaid SVGs have no text alternative, but DR and RP diagrams generally have adjacent prose. On mobile, Starlight scrolls the 914 tables horizontally. Wide Mermaid LR diagrams shrink to unreadable on phones; the meta "prefer TD" guidance should become a lint or review rule. Not browser-tested.

**B-P2-10. Meta `site` is `cairn-meta.vercel.app` while the other three use quantifieduncertainty.org subdomains.** S
- **Fix:** Use a consistent domain for the hub.

**B-P2-11. EE and RP astro configs repeat the same Mermaid vite boilerplate.** S
- **Evidence:** `optimizeDeps.include: ['mermaid']` and `ssr.noExternal`. DR doesn't have it and works fine.
- **Fix:** Test removing it, or move it into a shared `cairnStarlight()` preset in `@cairn/starlight` that sets KaTeX, Mermaid, Footer, social and the head entries in one place. A shared preset is the structural fix for most of the per-site drift above.

---

## Counts

| | P0 | P1 | P2 | Total |
|---|---|---|---|---|
| Part A (meta content) | 5 | 8 | 5 | 18 |
| Part B (infrastructure) | 4 | 10 | 11 | 25 |
| **Total** | **9** | **18** | **16** | **43** |

Per-page triage for meta: Keep 1 (workshop, with updates), Rewrite 6, Merge 1, Cut or move 11.

---

## Top 5 recommendations

1. **Turn meta into the CAIRN Handbook.** (A-P0-1/2/3, A-P1-7; M)
   - Cut or move the ~17k words of longterm docs. This also removes all 101 broken links.
   - Rename the site and make its homepage the hub for the three wikis.
   - Add three true pages: "Add a new wiki", "Build tooling" (llms generation, link checker), and "Making it trustworthy" (the revision-plan, adversarial and citation-review recipe this repo uses).
2. **Fix the workshop and web-app guide for October 2026.** (A-P0-4/5, A-P1-1/2/3; S–M)
   - Node 22+, the native installer, no `sudo npm`, code.claude.com links, plan mode and checkpoints.
   - Accurate cloud-session mechanics: connect an existing repo through the GitHub App, `claude/*` branches with Vercel preview URLs, `--teleport`.
   - Remove the February 2026 event block and add a "last verified" date.
3. **Repair what's live and wrong on Delegation Risk.** (B-P0-1/2; S)
   - Generate its `llms.txt` (extend the generator to handle autogenerate sidebars).
   - Delete the stale `delegation-risk.org` files.
   - Remove the "Download PDF" link to the withdrawn v1 book.
4. **Make CI actually guard all four sites.** (B-P0-3/4, B-P1-10, B-P2-6; S)
   - Fix `check-built-links.py`: discover every app, resolve relative links, unquote anchors.
   - Move to Node 22.
   - Build the starter and run lint in CI.
5. **Shrink, then upgrade, then brand.** (B-P1-1/3/2/4/5/6; M–L)
   - Delete the dead `@cairn/ui` (7.3k LOC) and unused Tailwind.
   - Upgrade to Astro 7 / Starlight 0.42 through a shared `cairnStarlight()` preset.
   - Use that preset to add a shared cross-site footer strip (QURI plus sibling wikis), distinct favicons and accent colours, OG images and robots.txt.
