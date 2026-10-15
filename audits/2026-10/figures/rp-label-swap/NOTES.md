# rp-label-swap — notes

**Page:** apps/reasoning-processes/src/content/docs/case-studies/measurement-log.md (becomes .mdx; slug unchanged).

**Placement:** in the "2026-10-15 · Label-swap neutrality" entry, immediately after the matched-condition table
(the one starting "| Model | Position bias [95% CI] | ...") and before "What the run shows:".
The top panel explains the design bullets and the identical-condition null; the bottom panel is that table drawn.
If the page owner wants it split, the top panel could sit after the "Statistics" bullets and the bottom one stays after the table.

**What it shows**
- Top: one real trial (DeepSeek V4 Pro, analyst hire, Option A / Option B) in the 2 × 2 layout
  (label listed first × description listed first). The cell means 76 / 57 / 84 / 73 come from the raw calls, 5 replies each.
  Arrows mark the label-swap pairs (same descriptions, same positions, labels swapped), which are exactly the permutation strata.
  The three contrasts are worked through: position +22.5, label −6.0 (flagged, p = 0.004), content +7.5.
- Bottom: all five models, matched condition. Position bias with 95% CI (and DeepSeek's decisions-as-unit interval [−13, +29], dashed);
  RMS label bias against its noise-only median–95th percentile; share of trials flagged against the 5% rate, with binomial p.
- Accent (RP blue) has one meaning: a result that clears chance. That is DeepSeek's position interval and its flag count. Nothing else uses it.

**Data source:** apps/reasoning-processes/experiments/label-swap/results/2026-10-15.json (summaries) and
2026-10-15.calls.jsonl (example-trial cells). compute.py re-derives the example trial from raw calls with the harness's estimators,
asserts it equals the JSON trial row, asserts every displayed rounded value equals the RESULTS.md / page table strings,
checks 998 identical-condition answers are all 50, checks the page's 0.77 / 0.41 statistician rates, and checks [−13, +29].
Run `python3 compute.py` to regenerate figure.html and index.html.

**Disagreements found in the text (the figure does not show these values)**
1. Qwen omnibus p: the page table says 0.023, RESULTS.md says 0.024. The JSON has 0.02349, so the page is right and RESULTS.md is off by rounding.
2. Qwen lost calls: the page says "87 / 400, plus 1 error" and RESULTS.md says "88/400 (22%)". The JSON has errors = 0, unparseable = 88 and truncated = 87,
   so the provider error is counted as unparseable, not as an API error. The two are consistent in substance, but the page's "error" is not an `errors` count in the JSON.
No other disagreements: position CIs, flag counts, binomial p, RMS and null 95th all match.

**Not shown on purpose:** the 25 per-pair label intervals (all include zero; this is stated in the text) and the post-hoc alphabetical-order lean
(it is post hoc, and RESULTS.md gives only the range and GPT's interval).

**Review (2026-10-15).** All plotted values were checked again from the raw calls and the JSON: the cells 76/57/84/73; the contrasts +22.5/−6.0/+7.5 with p = 0.0037; all five position CIs; the decisions-as-unit interval (t interval over per-decision means, df 2) of [−13.1, +29.3]; RMS against the null median/95th; and the binomial p for each flag count (exact upper tail). All of them match.
Fixes: on desktop the dashed 5% line and the zero line ran through the "k of n, p = …" labels and the "[−13, +29]" label, so those now sit on background-filled masks. The dark-mode noise bars had too little contrast, so they now use their own token --ls-noise (#5a564e). The top-panel note was reworded, and the mobile formulas got more spacing.
