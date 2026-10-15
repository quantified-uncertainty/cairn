# rp-oversight-router

**Page:** apps/reasoning-processes/src/content/docs/concepts/oversight-protocols.md (convert to .mdx)

**Placement:** under "## Composition: the hybrid protocol", replacing the ```mermaid flowchart block
(between "Since the groundings cover complementary territory, the natural design is layered:" and
"Debate operates over the unresolvable claim..."). It covers everything the mermaid shows: the
markets -> resolution/retrodiction edge is now the "grounded in" row. Component would be
`src/components/figures/OversightRouter.astro`, built from figure.html.

**Data source:** no numbers. Every label is paraphrased from the page: the mermaid block, the
"Each edge buys..." / "slips all three" sentence, the grounding table's failure column
(latency, resolution ambiguity; consistent-but-wrong, evasive vagueness; obfuscation), and the
open question "Who controls decomposition in the hybrid?". compute.py holds the wording and
the layout and writes figure.html, index.html, svg-wide.svg and svg-narrow.svg.

**Departures from the starting idea:**
- The brief's linear cascade (resolvable? -> coherence -> peer prediction -> judge) is not what
  the page describes. Here debate splits the claim and three parts go to three checks in
  parallel, and the consistency check applies to the debaters' probabilities, not to the leftover
  claims. The figure follows the page.
- Peer prediction / bridging is left out. The page's hybrid doesn't include it, and calls it
  "the least trusted grounding". If the page later adds it to the composition, it would become a
  fourth lane (grounded in peer agreement; lets through collusion and shared-corpus errors).

**Things the page text may want to align with:**
- The mermaid labels the consistency input "Debater belief structure", while the prose says
  "probability assignments". The figure uses "debaters' probabilities".
- The figure's footnote ("Unresolvable evades the markets, consistent passes the checks,
  obfuscated beats the judge") is our gloss of "slips all three". The page never pairs each
  property with a check explicitly, though the pairing is implied.
- "Narrowing the residue" (routing sub-questions out, with a trusted-frontier fallback) extends
  this picture but isn't drawn, to keep the figure to one mechanism.

**Accent:** blue, used only for the leak: the keywords in "lets through", the bracket and the
"slips all three" line. A narrow variant swaps in at max-width 560px.

**Reviewer changes (2026-10-15):**
- Markets "lets through" now says "unresolvable claims; latency; ambiguous or gamed resolution": the accent word
  now matches the "slips all three" sentence, and the line follows the grounding table's failure column
  ("resolution ambiguity/manipulation").
- Judge "grounded in" now reads "the judge's verdict: what persuades, not what is true" (the page: "the training
  signal is what convinces the judge"). The old "(persuasion, not truth)" put a failure mode in the grounding row.
- The open-question note now says "who controls the split?", the page's wording ("Who controls decomposition"),
  and ties it to the "splits the claim" box.
- Re-wrapped so no line runs past its column at 375px (two lines had been clipped at the right edge).
