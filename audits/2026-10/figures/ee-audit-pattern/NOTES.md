# ee-audit-pattern

Target page: apps/evaluation-engineering/src/content/docs/concepts/techniques.md (convert to .mdx, same slug).

## Placement
In "## Prediction–evaluation systems", directly after the first paragraph ("Ask predictors to forecast ... paid to model the evaluator, not the truth.") and before "The incentive thins as the set grows". Suggested one-line lead-in before the figure, since the figure uses the worked example's scale rather than the paragraph's 10,000/50:
"The [worked example](/concepts/worked-example/) runs this at a smaller scale: 1,000 grants, a hidden random 50 audited by two experts."
(Alternative home: concepts/llm-evaluators.md, "The design pattern: LLMs as the cheap layer", after step 4. Techniques is the pattern's canonical page, so it goes there.)

## Data source
All from compute.mjs (run `node compute.mjs`; it checks itself against the pages and writes figure.html + index.html).
- worked-example.md, design C: 1,000 grants; model $1 each; hidden random 50, two independent expert reviews each; $600/review -> $30,000 per expert; experts renew 80%; peer-review kappa ~ 0.17; "a kappa estimated from 50 audits has a 95% interval of about +/-0.3"; "80% power takes about 300 audits".
- The 1,000-dot field: the 50 highlighted dots are a seeded uniform draw without replacement.
- Kappa ranges: simulated from the 2x2 table (both raters at 80% "yes", true kappa 0 / 0.17 / 0.40), 40,000 draws each, 2.5-97.5 percentiles of Cohen's kappa:
  - n=50: k0 [-0.24, 0.29], k0.17 [-0.14, 0.48], k0.40 [0.05, 0.70]   (half-widths ~0.27-0.33, matches "about +/-0.3")
  - n=300: k0 [-0.11, 0.12], k0.17 [0.04, 0.30], k0.40 [0.27, 0.52]
- $180,000 per expert for 300 audits = 300 x $600 (derived, not stated on the page).

## Where the page text and the figure disagree / things to watch
1. Scale: techniques.md's paragraph uses "say 10,000 ... say 50" (1 in 200); the figure uses the worked example's 1,000/50 (1 in 20). Both are illustrative; the lead-in sentence above makes the switch explicit. 10,000 dots would not be legible at 375px.
2. Who is disciplined: techniques.md frames the predictors as *paid* on the audited subset (incentive). In the worked example the predictor is an LLM, so the audit *measures* rather than incentivises (llm-evaluators step 3 says this explicitly). The figure follows the worked example (measurement + comparison with the expert-expert ceiling); the caption avoids claiming an incentive effect.
3. Techniques.md does not mention the second expert / inter-evaluator ceiling at all; that comes from worked-example.md and llm-evaluators step 4. The figure is the first place on techniques that shows it; consider a clause in the prose pointing to "Report agreement against a second panel".
4. "300 audits mostly separate them": at n=300 the kappa-0 and kappa-0.17 95% ranges still overlap slightly (0.04 vs 0.12), consistent with the worked example's "80% power", not certainty. Caption says "mostly".

## Files
- figure.html: <figure> + <style> (prefix pe-), wide SVG (viewBox 780) and narrow SVG (viewBox 343) swapped at 36rem.
- index.html: preview with the page's own paragraphs.
- shot-{desktop,mobile}-{light,dark}.png

## Review (2026-10-15)
- Independently re-simulated Cohen's kappa (both raters 80% yes, 200k multinomial draws, Python): n=50 k0 [-0.24, 0.29], k0.17 [-0.14, 0.47], k0.40 [0.05, 0.70]; n=300 [-0.11, 0.12], [0.04, 0.30], [0.27, 0.52]. Matches the plotted bars to within Monte Carlo noise (0.47 vs 0.48). Costs ($30,000, $180,000, $1/grant) and 5% / 1 in 20 check against worked-example.md.
- Fixed: on the 375px variant, the label "hidden random 50 (1 in 20)" ran into the dashed return arrow; now "hidden random 50 (5%)".
- Fixed: caption now leads with the claim (50 audits measure the model but cannot judge it when expert agreement is as weak as peer review) and drops the muddled "paid for or trusted" sentence.
- Remaining: the bars show the precision of one kappa. The model-vs-ceiling *difference* is noisier still (both kappas have this error, partly correlated through Expert A); the page doesn't quantify it and the figure doesn't claim it.
