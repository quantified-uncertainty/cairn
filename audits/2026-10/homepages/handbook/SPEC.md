# CAIRN Handbook homepage: implementation

Mock: `index.html`. Two drop-in files sit beside it; no new component.

## 1. Content: `index.mdx` → `apps/meta/src/content/docs/index.mdx`

- Keep `template: splash`.
- Remove `hero`, so Starlight's `PageTitle` renders the h1.
- Remove the `LinkCard`/`CardGrid` import.
- Body:
  - two sentences (what, how checked, date);
  - one "Start with" sentence, two links;
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
