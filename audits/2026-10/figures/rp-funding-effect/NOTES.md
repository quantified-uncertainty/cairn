# rp-funding-effect

**Page:** apps/reasoning-processes/src/content/docs/case-studies/the-funding-effect.md (convert to .mdx to embed).

**Placement:** in "From odds ratios to a likelihood-ratio discount", directly after the "A sign flip needs selection" paragraph and before "A worked number (illustrative)". The figure plots the first two models and the worked number marks points on it, so readers meet the curve before the numbers.

**What it shows:** LR′(s) on a log axis (log = weight of evidence, so 1 is "no evidence" and the height above 1 is the remaining log-odds weight). Spin bends the curve from 4 toward 1 and it never crosses. Selection divides the whole curve by r¬H/rH, which on a log axis is a rigid downward shift; that is the only way below 1. The dotted line at 4 covers the pure-multiplier case: the ratio stays at α/β. Lundh's point (s ≈ 0.34, LR′ ≈ 1.84, 44% of the weight) is shown with an arrow down to 0.92 under r¬H/rH = 2. Passive smoking (s ≈ 0.98, LR′ ≈ 1.01) sits on the 1-line, where any selection flips it. Accent = the "counts against H" region only.

**Data source:** compute.mjs uses the page's formula LR′(s) = (α+s(1−α))/(β+s(1−β)), the observed ratio LR′·rH/r¬H, α=0.8, β=0.2 and prior 0.5. RR→s: s = (RR·P0−P0)/(1−P0), P0 = 0.5. OR→s goes through the odds. The script asserts the page's numbers: s 0.34, LR′ 1.8, 44%, s 0.98, LR′ 1.01, and LR′ > 1 on an α>β grid. Run `node compute.mjs` to regenerate figure.html and index.html.

**Added beyond the page (flag for the owner):**
- r¬H/rH = 2 is an illustrative value I chose; the page names no value. With it, the sign flips for every s > 0.29.
- The thick stretches are the table's 95% CIs converted the same way. Lundh RR 1.19–1.51 gives s 0.19–0.51 and LR′ 2.38–1.48. OR 16–477 gives s 0.88–0.996 and LR′ 1.08–1.003. The page converts only the point estimates.

**Disagreements with page text:** none found. Caveats:
- The figure uses only one (α,β) pair because the page gives only one. The general "never below 1 for α>β" claim is checked numerically in compute.mjs but not drawn.
- The page says these conversions overstate s if sponsors pick products likely to work. The figure does not show this; the caption calls the readings illustrative.
- The Bes-Rastrollo RR 5.16 cannot be converted under P0 = 0.5, because RR is capped at 2 there. This is one reason not to plot more table rows.

**Astro notes:** figure.html is self-contained. Its classes are prefixed fe-, its clipPath ids are fe-wide-* and fe-narrow-*, and theme tokens are scoped to .fe-fig via [data-theme] plus prefers-color-scheme. Below 34rem the narrow 343-px SVG replaces the wide one. There is no JS. The SVG text uses ¬ and subscript tspans (dy ±4, 0.75em).

**Reviewer check (independent):** I recomputed every value by hand: s = (RR−1)·P0/(1−P0) = 0.34, giving LR′ = 0.868/0.472 = 1.839 and ln1.839/ln4 = 0.44. OR 88 gives P1 = 88/89, s = 0.9775 and LR′ = 1.0137. The CI ends also match: LR′ 2.38/1.48 and 1.078/1.0025. Halving gives 1.839/2 = 0.92. The flip under ratio 2 happens for s > 0.4/1.4 = 0.286. I moved the desktop "Spin only" label up (y 2.95 → 3.35 in compute.mjs) because the curve was crossing its first letter.
