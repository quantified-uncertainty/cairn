# dr-entanglement-tax

**Page:** `apps/delegation-risk/src/content/docs/entanglements/fundamentals/formal-definitions.md` (the page that calls itself the single source of truth for the tax; correlation-calculator.md links to it for the derivation). Convert to `.mdx`, same slug.

**Placement:** under `### Effective Redundancy`, directly after its only paragraph (ending "…not by independent bad luck."), before `## Bounds and Limits`. The figure's y-axis is n_eff, it shows the tax at ρ = 0.5 from the table above, and the measured ranges from the tax section, so it sits after all three.

**What it shows:** n_eff = ln P(all fail)/ln p against ρ on a log axis, for 2, 3 and 5 identical layers at p = 0.1, under the page's beta-factor formula. Because p = 0.1, n_eff = −log10 P, so the left axis (independent layers' worth) and right axis (P(all miss)) are the same gridlines. The accent line is the floor ρ·p (the n → ∞ limit, n_eff = 1 + log10(1/ρ)). Each stack is a plateau at n until ρ ≈ p^(n−1) (0.1, 0.01, 0.0001), then rides the floor down one layer per tenfold rise in ρ. Dashed line + bracket: product rule for 3 layers (0.1%) vs actual at ρ = 0.5 (5.05%) = 50.5× tax. Grey span and range bars: measured LLM ρ, 0.3–0.6 across providers, 0.5–0.7 within one (as cited in the tax section).

**Data source:** `compute.py` (asserts the page's tax table, the "about 1.3 at ρ = 0.5" claim and the calculator's effective-layers column, then writes figure.html/index.html). Narrow variant (≤34rem) is a separate 360-wide SVG.

**Component:** figure.html is the `<figure>` + scoped `<style>`; colour tokens are on `.et-fig`, switched by `:root[data-theme='dark']` (Starlight) and `prefers-color-scheme` when no data-theme is set. The two SVGs use distinct clipPath ids (`et-w-clip`, `et-n-clip`); keep them unique if the component is used twice on a page.

**Disagreements / cautions:**
- The brief's "three checks are worth ~1.4 at ρ = 0.2" is wrong under the page's formula: 1.68 (calculator table says 1.7). The figure uses the formula.
- The floor and the flatness are properties of the beta-factor model, as the page's Effective Redundancy paragraph says; the caption states "under the beta-factor model". A Gaussian copula with the same pairwise misses gives, at ρ = 0.5, 3.9% / 2.6% (n_eff 1.41 / 1.58) for 3 / 5 layers (recomputed; matches the calculator page) — i.e. above the drawn floor. Not drawn, to keep the figure clean; the text covers it.
- risk-propagation.md line ~89 still says "We know of no published measurement of φ between same-provider LLM checks" and that Kim et al.'s statistics "cannot be plugged in", while correlation-calculator.md now derives φ and mixture ρ from Kim et al.'s released data. Not a conflict with this figure but the two pages disagree.
- The ranges drawn are the label-noise-adjusted ranges in formal-definitions; the raw medians (0.58 cross-provider, 0.69 same-provider) sit inside them.

**Reviewer (independent recompute):** P(all miss) = (1−ρ)p^n + ρp, n_eff = −log10 P, at p = 0.1, checked by hand: ρ = 0.5 gives 1.26 / 1.30 / 1.30 for 2 / 3 / 5 layers; 3 layers at 0.5 → 5.05% vs 0.1% = 50.5×; the floor 1 + log10(1/ρ) bounds every curve. Across the measured span ρ = 0.3–0.7, n_eff runs 1.14–1.52, so the caption and aria text now say "about 1.1–1.5" instead of "1.2–1.5". The 1.2 lower bound was wrong for same-provider ρ = 0.7, which gives 1.15. compute.py now asserts this. The narrow legend label "LLMs: other provider" now reads "different providers".
