# RRP homepage: implementation spec

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
- Dots are gray-4, each with a `<title>`.
- Four labels: Formal proof, Real-money market (wide only), Peer review, Single LLM judge.
- The empty corner is info < 35, corrupt > 55, as in ProcessMap. It is a dashed accent outline with an accent label, the figure's only use of the accent.

**Content flag**
- The sidebar omits ch. 24, Building Strong Reasoners, so its 24–26 should read 25–27.
