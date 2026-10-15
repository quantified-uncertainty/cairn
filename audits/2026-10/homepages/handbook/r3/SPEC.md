# CAIRN Handbook homepage: implementation (round 3)

Round 3 = the round-2 final plus (a) the shared flourish block and (b) one small figure of a review round. Everything else in the round-2 spec below is unchanged.

Mock: `index.html`. Two drop-in files sit beside it; no new component.

## 1. Content: `index.mdx` → `apps/meta/src/content/docs/index.mdx`

- Keep `template: splash`.
- Remove `hero`, so Starlight's `PageTitle` renders the h1.
- Remove the `LinkCard`/`CardGrid` import.
- Body:
  - two sentences (what, how checked, date);
  - one "Start with" sentence, two links;
  - the review-round `<figure class="rw-fig">` (inline SVG, see section 4);
  - `## Handbook` and `## Workshop`, each a `<dl>` of title link plus one-line description;
  - a `---` rule;
  - one line of wiki links;
  - the QURI credit.
- Keep the blank line before `---`. Compiles with MDX 3.1.1.

## 2. Style: `home.css` → `apps/meta/src/styles/home.css`

Add `customCss: ['./src/styles/home.css']`. Unlayered, so it overrides Starlight's defaults.

**Site-wide tokens.** Starlight's `:root` is dark; light uses `[data-theme='light']`.

| Token | Dark | Light |
|---|---|---|
| `--sl-color-black` (page) | `#161514` | `#ffffff` |
| `--sl-color-white` (headings) | `#f4f1ea` | `#1c1b19` |
| `--sl-color-gray-2` (body) | `#dcd7cd` (12.7:1) | `#2e2c28` (13.9:1) |
| `--sl-color-gray-3` (secondary) | `#a7a195` (7.1:1) | `#5f5b53` (6.8:1) |
| Links, ochre | `accent-high` `#e8be6a` (10.4:1) | `accent` `#8a5a0b` (5.9:1) |

Also sets `gray-1`, `gray-4`–`gray-7`, `accent-low`, `accent-high`.

**Homepage only.** These rules are scoped with `:root:not([data-has-sidebar])`:

- `--sl-content-width: 39rem` (about 70 characters per line).
- `--sl-line-height: 1.6`.
- Body text 17px; h1 2.25rem; h2 1.25rem.
- Use `:root`, not `html`: Starlight's unlayered `html:not([data-has-sidebar])` width rule would otherwise win.
- No hairline or top padding between title and content panels.
- `dt`: weight 600, link not underlined.
- `dd`: no indent.
- `hr`: thin `gray-5` rule. The paragraphs after it are 16px `gray-3`. Wiki names never break across lines.
- Hide Copy-as-Markdown.

These also reach the 404 page (harmless).

**Optional.** In the shared `Footer.astro`, give `.version` `font-family: inherit`, since monospace is only for code.

**Flourish (round 3).** Appended to `home.css` as one block, scoped like the rest. `style/CHOSEN.md` did not exist when this was built, so the block is a placeholder using option 1 (Source Serif 4 600 for h1/h2, h2 1.375rem; page tone `#fbf9f4` light / `#181715` dark). Replace that block with the chosen one; nothing else depends on it. Load the face via `@fontsource-variable/source-serif-4` (or whichever face is chosen).

## 4. Figure: one review round

- Source: `review-workflow.md`. It shows Audit (read-only agents, one per section) → one plan and brief → editors in parallel, each on its own files → each edit re-checked by a different agent → reconciled in one integration pass (build, redirects, link check) → pull requests with previews → **merge to main** (dashed accent line) → live sites.
- Encoding: a filled (neutral) dot is an agent that writes, and a hollow dot is one that only reads. The caption carries the key, so editors and verifiers are visibly different agents. Three lanes stand for "one per section/file scope". They are not a count.
- `compute.mjs` generates both SVGs (`figure-wide.svg` 624×176 for ≥40rem; `figure-tall.svg` 343×318 for phones) and splices them between `FIG:wide`/`FIG:tall` markers. `index.mdx` uses JSX comments as markers, because HTML comments are invalid in MDX. Rerun `node compute.mjs` after any change. `index.mdx` compiles with @mdx-js/mdx 3.1.1.
- The colours are all `var(--sl-color-*)` via classes, so the figure follows the theme with no JS. Text is 11–12.5px at 1:1 scale on both layouts. The CSS is in the "review-round figure" block of `home.css`.
- Cost: on desktop the page grows from about 1060px to about 1350px tall. If that feels heavy, delete the `<figure>` and the figure CSS block; the page then reverts to round 2 plus the flourish.

**Review fixes (round 3).** The accent appears once in the figure, on the dashed merge line; editor dots and the live-sites box are neutral (rule 4). Labels now match `review-workflow.md`: "one pass" (not "one branch") and "PRs" (one per phase or per site). Desktop notes are 12px and shortened so adjacent columns no longer touch.
