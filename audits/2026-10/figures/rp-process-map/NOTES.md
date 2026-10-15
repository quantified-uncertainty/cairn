# rp-process-map: notes

Target: apps/reasoning-processes/src/content/docs/concepts/process-catalogue.mdx. This replaces `<ProcessMap />` under "## The map", after the paragraph that ends "an empty cell is a hypothesis, not a finding." (Same place, new component, e.g. components/figures/ProcessMap.astro.)

## What changed from the old ProcessMap
- Positions are now the table's own ordinal ratings: Info is column 2 and "Cost & challenges to bias it" is the bolded column 4. They sit on a 5x5 L / L–M / M / M–H / H grid. The old 0–100 coordinates are gone because they implied precision the ratings don't have. compute.py parses the table straight from the .mdx, so the figure can't drift from it. It also asserts that the six cheap-and-at-least-M cells are empty.
- The three colour-coded families are dropped. The old palette used three hues; the one accent now marks the empty corner and the composition arrow (both mean "the target").
- Label collisions at 375px are fixed with a separate narrow SVG. It merges Info L with L–M (play-money is marked "info cost L–M") and M–H with H (the M–H column has no entries), and it wraps labels by estimated width.
- Moves added, each tied to page text:
  - Single LLM judge → Multi-model panel ("Independence"): table rows L/L → L/L–M; "must fool several models at once, but shared training pipelines correlate their failures".
  - Tournament → Real-money market ("Incentives: real money"): M/M → M/M–H; the "Scope and corruption resistance trade off" paragraph. The scope cost is in the caption's source paragraph, not drawn.
  - Composition (accent, dashed, "unmeasured"): from the cheap L/L–M cell into the corner. "Cheap and robust don't yet coexist" paragraph, plus Hardening overview §Composition.
  - Grey up-ticks on Online reviews, Play-money, Tournament: "identity infrastructure would raise the corruption cost of every row that currently fails by Sybil or reputation-laundering". Row membership is my reading of the table: reviews "absent identity infrastructure", play-money "play currency is farmable", tournament "accounts are cheap". The page doesn't list the rows itself.
  - Dashed proof-checking line, from Formal proof (H) to info L: the table's "H to produce, L to verify". It is the only entry that touches the corner, and only for formalizable claims (verifiability asymmetry).
  - Legend "How hardening moves a point": the family → axis table and the "non-obvious structural point" paragraph in concepts/hardening-techniques.md (verification raises both costs; deterrence is the low-info-cost exception).

## Disagreements and things for the page owner
- The page's intro says the empty quadrant is "cheap and hard-to-corrupt". On the ratings, "cheap" has to mean Info L or L–M; with that reading the corner is strictly empty (6 of 6 cells). If "cheap" includes M, it isn't empty.
- "L to verify" for formal proof formally places its checking step in the empty corner. The text answers this only indirectly ("near-incorruptible, vanishingly narrow"). The figure makes the scope escape explicit. The page could say so in one sentence.
- Hardening overview rates Independence as buying both axes, i.e. pointing straight at the corner. Yet it names Deterrence, not Independence, as "the most promising route into the empty quadrant". The legend shows Independence as up-left as the table states. The one Independence move on the map (judge → panel) only goes up, which is consistent with "shared pipelines correlate failures".
- Old ProcessMap placed Courts at y=64 and Real-money at 67 (close to each other). On the ratings both are M–H, consistent.
- No information cost rating is M–H in the table: that column is empty, not missing data.

## Data source
Table in process-catalogue.mdx (17 rows), parsed by compute.py. Moves: process-catalogue.mdx "Reading the table"; concepts/hardening-techniques.md "Two axes, six families" and "Composition".

## Reviewer changes (2026-10-15)
- Independently re-checked all 17 placements against the table; all match. The empty-corner claim (6 of 6 cells, with "cheap" read as Info L or L–M) holds.
- Legend: Deterrence now has its own row. The Hardening overview singles it out as costlier to bias *at low information cost* and as "the most promising route into the empty quadrant". Grouping it with Invariance and Incentives hid the one family that points at the corner. Independence's "both" is now spelled out.
- Caption: says composition is the only move *drawn* into the corner, and names deterrence as the overview's candidate family, so the two pages' bets (composition vs deterrence) are both visible.
