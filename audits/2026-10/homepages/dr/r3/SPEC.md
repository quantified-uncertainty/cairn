# Delegation Risk homepage, round 3: implementation

Round 3 = the round-2 final plus (a) the shared flourish block and (b) one figure, "what a stack of checks is worth". Everything else in the round-2 spec below still applies, with the amendments marked **(round 3)**.

## Round 3 additions

**Flourish.** `index.html` §5 is one block, appended to `custom.css` and scoped like the rest. `style/CHOSEN.md` did not exist when this was built, so the block is a placeholder using option 1, the same as the Handbook's round 3: Source Serif 4 600 for h1/h2, h2 1.375rem, page tone `#fbf9f4` light / `#181715` dark. Replace that block with the chosen one; nothing else depends on it. Load the face via `@fontsource-variable/source-serif-4` (or whichever face is chosen). Accent unchanged.

**Figure.**
- What it shows: n_eff = ln P(all miss) / ln 0.1 against ρ, for 2, 3 and 5 checks that each miss 10%, under the site's beta-factor mixture P(all miss) = (1−ρ)·0.1ⁿ + ρ·0.1. The 3-check curve is the one accent element, with dots at ρ = 0.1, 0.2, 0.5 labelled 2.0, 1.7, 1.3 (the values the prose cites). Brackets under the axis are the site's prior ranges for LLM checks from `entanglements/detection/correlation-calculator.md` ("Priors when you cannot measure"): same model 0.8–1.0, same provider 0.5–0.7, different providers 0.3–0.6.
- Insight it carries: the steep fall near ρ = 0; the curves merging (past ρ ≈ 0.3 extra checks add almost nothing); five checks already on the ceiling 1 − log₁₀ρ; every LLM-check range sits where a stack is worth about 1.0–1.5 checks.
- Data: `compute.py` (Python 3, stdlib) computes every coordinate, asserts the values against the calculator page's lookup table (3 and 5 layers at ρ = 0.1…1.0) and that the curves never cross, writes `fig-wide.svg` (624 wide, 15px labels) and `fig-narrow.svg` (343 wide, 14px labels), `checks.txt`, and splices both SVGs into `index.html` between `<!-- FIG:START/END -->`.
- Implementation: a new `src/components/EntanglementFigure.astro` holding the `<figure>`, both SVGs and the caption (inline SVG in MDX would need JSX attribute renames). Import it in `index.mdx` and place it after the "Counted in independent checks…" paragraph. The two SVGs are drawn 1:1 and swapped at 40em, so labels stay near text size; all colours come from Starlight tokens via the `.fig` rules in §4, so both themes work.
- Prose **(round 3)**: the paragraph "The weight ρ is assumed, not measured…" becomes "Counted in independent checks, three are worth about 2.0 at ρ = 0.1, 1.7 at 0.2 and 1.3 at 0.5. No study has measured ρ for checks on harmful actions. Error correlations on benchmarks suggest about 0.3–0.6 for LLMs from different providers and 0.5–0.7 for models from one provider. Against an attacker…" (unchanged from there).

**Checks (round 3).** n_eff for 3 checks: 1.963, 1.682, 1.297 at ρ = 0.1, 0.2, 0.5 (rounded 2.0, 1.7, 1.3, matching the lookup table). Note: "three checks are worth about 1.4 at ρ = 0.2" is wrong; it is 1.7 (1.4 is two checks at ρ ≈ 0.3). The new link to `#priors-when-you-cannot-measure` resolves. Screenshots: `shot-{desktop,mobile}-{light,dark}.png`; no overflow at 375px.

---

## Round-2 spec (base)

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
