# RRP homepage: implementation spec (round 3)

Round 3 = the round-2 final plus (a) the shared flourish block and (b) a richer HomeMap (family shapes and two hardening arrows). Everything else below is the round-2 spec, amended where marked.

This page uses the Handbook's frame. Only the accent and one figure are RRP's own.

**`src/content/docs/index.mdx`**
- Frontmatter: `title`, `description`, `template: splash`. Delete `hero`, so PageTitle renders the h1.
- Body: the mock's `.sl-markdown-content`, as plain Markdown.
  - Each Part is a `###` heading, a one-line paragraph, and an ordered list starting at the chapter number (`3. [The Core Model](/concepts/core-model/) — gloss`).
  - The Interlude is a one-item `-` list directly after Part I.
  - Planned chapters are unlinked and end "— planned".
  - Keep `## Contents`, because Chapter 1 links to `/#contents`.
  - Drop the `ProcessMap` import. The figure is `<HomeMap>caption</HomeMap>`.

**`src/styles/global.css`**: append mock sections 1 and 3 verbatim.
- Tokens: the family neutrals plus RRP's accent:
  - dark `#1b2c4a`/`#4f7fd1`/`#9dbdf2`
  - light `#dbe5f6`/`#2a57a6`/`#183a75`
- `home.css` is scoped to `:root:not([data-has-sidebar])` and sets:
  - 40rem column, 17px text, line-height 1.6
  - h1/h2/h3 at 2.25/1.25/1.0625rem
  - grey list numbers; contents links underlined on hover only

**`src/components/HomeMap.astro`** (new)
- A `<figure>` containing two SVGs and `<figcaption><slot/></figcaption>`. Styles are in mock section 4.
- Move `points` out of ProcessMap into `src/data/processes.ts` and import it in both components, so the two maps cannot drift.
- Wide SVG: 640×396, 16px text. x = 2 + 6.28·info, y = 351.5 − 3.075·corrupt.
- Narrow SVG: 343×356, 15px text, shown below 34rem. x = 2 + 3.33·info, y = 309.9 − 2.7·corrupt.
- `compute.mjs` generates both SVGs from ProcessMap's points and splices them into `index.html` between `FIG:wide`/`FIG:narrow` markers; it also checks label/marker/arrow collisions. Port its geometry to the component (or paste its output). Rerun `node compute.mjs` after any data change.
- **(Round 3) Markers by family, not colour**, using ProcessMap's `family` field: circle = grounded in resolution or track records (7), square = institutional judgment (6), triangle = AI-native (4). All gray-4 (class `.mk`), r 5 wide / 4.5 narrow; each has a `<title>` naming process and family. The key is inline in the caption (three tiny inline SVGs), so it wraps on phones.
- **(Round 3) Two arrows** (class `.move`, gray-2, 1.25px), both starting at Single LLM judge (6, 14), the process the worked bound in `hardening-deterrence.md` wraps ("a \$0.01 LLM-judge call"):
  - *Verification*: (9, 17.5) → (34, 40), roughly parallel to the diagonal. Source: `hardening-techniques.md`, "Two axes, six families": verification-bought hardening "raises both axes together and never reaches the cheap-and-incorruptible corner".
  - *Deterrence*: (6, 19) → (6, 54), straight up, stopping at the corner's lower edge (55), not inside it. Source: `hardening-deterrence.md`: raises corruption cost "at little cost on the information axis"; "the most promising route into the empty quadrant".
  - Lengths are illustrative. The caption says neither move is measured. The arrows do not use the accent.
- Four labels: Formal proof, Real-money market (wide only), Peer review, Single LLM judge.
- The empty corner is info < 35, corrupt > 55, as in ProcessMap. It is a dashed accent outline with an accent label, the figure's only use of the accent. 0 of 17 points fall in it.
- (Round 3) Caption, two short paragraphs: (1) the shape key plus the round-2 "rough judgments … conjecture" sentence; (2) what the arrows mean, linking Hardening: Overview and Deterrence. The paragraph before the figure gains "nothing yet is both cheap to run and hard to corrupt."
- (Round 3) CSS additions in mock section 4: `.mk`, `.move`, `.move-label`, `.key`, `.fam` (nowrap), `figcaption p + p`. `.dot` is gone.

**Flourish (round 3)**: mock section 5, appended to `home.css` as one block, scoped to `:root:not([data-has-sidebar])`. `style/CHOSEN.md` did not exist when this was built, so the block is the same placeholder the Handbook used: option 1, Source Serif 4 600 for h1 and h2 (h2 1.375rem; h3 stays in the body face), page tone `#fbf9f4` light / `#181715` dark. Replace it with the chosen block; nothing else depends on it. Load the face via `@fontsource-variable/source-serif-4` (the mock uses the Google Fonts link). The site accent is unchanged.

**Content flag**
- The sidebar omits ch. 24, Building Strong Reasoners, so its 24–26 should read 25–27.
