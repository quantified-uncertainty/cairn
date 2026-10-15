# Evaluation Engineering homepage: implementation

Mock: `index.html`. Two drop-in files sit beside it. No new component, no diagram.

## 1. Content: `index.mdx` → `apps/evaluation-engineering/src/content/docs/index.mdx`

- Keep `template: splash`.
- Remove `hero`, so Starlight's `PageTitle` renders the h1.
- Body is plain Markdown:
  - five short paragraphs: what it is, the core pattern, who pays, status, and where to start;
  - `## Contents`, with an `### h3` per Part matching the sidebar labels;
  - numbered lists keep the chapter numbers (`5.` renders `<ol start="5">`);
  - the four unnumbered Part II pages are a `-` list straight after the `9.` list;
  - each gloss follows a non-breaking space and an em dash (U+00A0 —), so the dash never starts a line;
  - a `---` rule, the sibling line and the QURI credit.
- Compiles with MDX 3.1.1. All 25 internal links and anchors resolve.

## 2. Style: `home.css` → `apps/evaluation-engineering/src/styles/home.css`

Change `customCss` to `['./src/styles/global.css', './src/styles/home.css']`.

**Site-wide tokens.** These are the family neutrals, identical to the Handbook and RRP. Only the accent changes.

| Token | Dark | Light |
|---|---|---|
| `--sl-color-accent-low` | `#173323` | `#d5ece0` |
| `--sl-color-accent` | `#3f9a68` | `#1f6e46` (links, 6.2:1) |
| `--sl-color-accent-high` | `#7fd2a0` (links, 10.1:1) | `#124a2e` |

**Homepage only.** Same rules as RRP's `home.css`, scoped with `:root:not([data-has-sidebar])`:

- width 39rem;
- line-height 1.6;
- 17px body, h1 2.25rem, h2 1.25rem, h3 1.0625rem;
- grey list markers;
- contents links not underlined;
- after the `hr`, text is 16px `gray-3`;
- Copy-as-Markdown is hidden.

The rules use `:root`, not `html`, so they win over Starlight's unlayered width rule.

## 3. Recommended

Add Measuring an Evaluator, The Capability Ladder and Launch Checklist to the sidebar's Part II, in the homepage order, so the two lists match.
