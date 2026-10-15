# Delegation Risk homepage: implementation

No new component.

**1. `src/content/docs/index.mdx`**
- Keep `title`, `description` and `template: splash` in the frontmatter.
- Delete `hero` (PageTitle then renders the h1) and the Card import.
- Body: copy `.sl-markdown-content` from `index.html`.
  - Markdown for the paragraphs and both `##` headings.
  - HTML for three elements:
    - `<p class="status">`
    - `<p class="formula">Delegation risk = <span>Σ P(harm mode) × Damage</span></p>`
    - the `<dl>`, with `<a href>` links
  - Then `---` and the two closing paragraphs.
- Gotchas:
  - `remark-math` is on, so write `\$50,000` and `\$50`.
  - Keep U+2011 in "beta‑factor" and `&nbsp;` in "ρ&nbsp;=&nbsp;0.1".

**2. `src/styles/custom.css`**, added via `customCss`. Copy §1, §3 and §4 from `index.html`.
- **§1 Tokens.** Neutrals match the Handbook's. Only accent-low, accent and accent-high change:
  - dark: `#3d1f19`, `#c4523b`, `#f29a84`
  - light: `#f6ddd6`, `#a8321f` (6.7:1), `#6e2014`
  - Drop the mock-only `prefers-color-scheme` block.
- **§3 Links, site-wide.** Links keep the text colour, underlined in `--sl-color-text-accent`. On a wiki, red link text reads as "missing page". Ship this rule with the red accent, or inner pages get red links.
- **§4 Homepage.** Every rule is scoped to `:root:not([data-has-sidebar])`:
  - 39rem measure, 17px text, line-height 1.6
  - h1 2.25rem, h2 1.25rem
  - stacked `dl`
  - muted `.status` and `hr ~ p`
  - `.formula` indented 1.5rem; its span is `nowrap`, so it breaks only after "="
  - `text-wrap: pretty`
  - Copy-as-Markdown hidden

**Moved content.** The "Book edition withdrawn" note moves to About This Site. These parts of the old homepage already live on linked pages:
- "Why AI systems": 5-Minute Intro
- AI Control positioning: Related Approaches
- ρ citations: Risk Propagation

**Checks.**
- 1 + 99ρ is 10.9, 20.8 and 50.5 at ρ = 0.1, 0.2, 0.5.
- "Fifteen stops" matches `reading-order.md`; "twenty patterns" matches `design-patterns/index.md`.
- All 22 internal links resolve.
