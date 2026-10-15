# rp-consistency-types

**Placement.** On `proposals/consistency-evals` (convert to `.mdx`), at the end of "What's covered and what's open", after the "Open." bullet and before "## Generating test questions". The figure joins that section to the Notation paragraph on Dutch-book reach. Component: `src/components/figures/ConsistencyTypes.astro`. Copy the `<figure>` and `<style>` from `figure.html`, then move the glyph maths from `compute.mjs` into the frontmatter.

**What it shows.** The seven types sit on a 4×3 grid. The rows show how a Dutch book prices a violation, using the Notation paragraph: exact (logical, constraint), dynamic (temporal), only via a trusted equivalence judge (paraphrase/contextual, repeatability), or as a loose metaphor (method, evidential). The columns show published coverage, from "What's covered and what's open": "Largely covered" (logical, evidential, paraphrase), "Partially covered" (temporal, repeatability) or open (constraint beyond binary, method). The accent is used once, as a dashed frame around the Open column.

Each cell gives the page's name and a one-line invariant, then a glyph of one violation. Ink marks the model's answers, grey marks what coherence requires, and a number gives the size of the gap. The narrow variant (≤600px) is a list grouped by Dutch-book row, with coverage as a text line.

**Data (all computed in `compute.mjs`).**
- Logical: the page's own example, P(A)=.7 and P(¬A)=.4. The overlap is .1, which is the bookie's sure profit per $1 payout.
- Constraint: a belief N(0.9, 0.6) over a non-negative quantity puts Φ(−1.5)=6.7% of its mass below 0.
- Temporal: P0=.6, with a constant hazard. Under the martingale property, the no-news path is P(t)=1−e^{−λ(T−t)}, and the script checks this numerically. A forecaster stuck at .6 is .40 off that path at t=.75T.
- Evidential: prior .30, P(e|H)=.8, P(e|¬H)=.2, so P(e)=.38. The coherent posteriors are .632 and .097, which average to .30. The stated posteriors .80 and .20 average to .428, a gap of .13. Dot area is proportional to P(e).
- Repeatability (range .39), Contextual (shift .18) and Method (3.0× between geometric midpoints): these use illustrative values. The page gives no numbers for them.

**Disagreements and flags in the page text.**
1. The page is internally inconsistent about evidential. It calls the Dutch book a "looser metaphor" for evidential consistency, but its coverage section calls the conservation-of-expected-evidence check "a one-step martingale test". By the page's own row for temporal, that would make it a dynamic-book case, and conditionalization has a standard diachronic Dutch book (Lewis/Teller). The figure follows the Notation sentence. Consider moving evidential (or its CoEE part) to the dynamic row, or rewording the sentence.
2. Contextual is placed by its paraphrase subcase only. The page doesn't classify framing, irrelevant detail, formatting or label-swap neutrality on either axis.
3. Constraint counts as "open" only beyond binary probabilities, since binary exclusive/exhaustive sums are covered. That is why the glyph shows a distribution over a quantity rather than a partition summing to 1.
4. The figure lists repeatability as type 1 under that name. The page's list heads it "Self-consistency (repeatability)".

**Review (independent recheck).** Recomputed by hand: logical profit .7+.4−1 = .10; Φ(−1.5) = 6.68%; temporal λT = −ln .4 = .916, so the no-news path at t = .75T is 1−e^(−.229) = .205 and the gap is .395, shown as .40; evidential P(e) = .38, coherent posteriors .632/.097 (average .300), stated .80/.20 average .428, gap .128, shown as .13; method midpoints 2.89, 3.04 and 8.85, ratio to the MC/analytic consensus 2.98, shown as 3×. The rows and columns match the Notation sentence and the coverage bullets exactly. Fixes: the column heads now use the page's terms ("Largely covered", "Partially covered"; the first had read "Covered in published evals"). The legend said "black", which is wrong in dark mode; it now says "solid marks" and also says which values are illustrative. The constraint tail was grey, which the legend reserves for "what consistency requires" even though the tail is the violation; it is now an ink tint. The narrow repeatability formula no longer leaves "= 0" alone on its own line.
