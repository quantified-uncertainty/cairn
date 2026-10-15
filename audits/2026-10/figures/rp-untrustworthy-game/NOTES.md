# rp-untrustworthy-game

**Page:** apps/reasoning-processes/src/content/docs/concepts/untrustworthy-sources.md (convert to .mdx)

**Placement:** under "## Deception is a game the defender moves first in", replacing the ```mermaid
flowchart (between "...leaves the attacker the worst best response." and "Call the set of routes a
strategic sender could use..."). It covers everything the mermaid shows and adds the channel table,
the residue, Move 2's three open payloads and the six-rung test. Component:
`src/components/figures/UntrustworthyGame.astro`, built from figure.html (wide + narrow SVG, CSS swaps at 560px).

**Data source:** no numbers. All labels come from the page: the Move 1 channel table (channel names,
levers, "What closing it costs the defender"), the mermaid residual box and "The residual attack
surface", "Why AI shrinks the surface, and the channel that reopens it", Move 2's payload types and the
three channels that stay open, and Move 3's six rungs. compute.py holds the wording and layout and writes
figure.html, index.html, svg-wide.svg and svg-narrow.svg.

**Design decisions:**
- Move 1 columns are ordered so rungs 1–4 of the test sit under the channel each re-asks
  (Aligned? / Goal divergence, Verifiable? / Verification gap, Reproducible? / Reproduction gap,
  Deterred? / Never-resolves). This is our reading of "Rung 6 is the residual surface of Move 1 reached
  from the other end". The page never states the pairing outright.
- The accent marks one thing: the reproduction-gap lane, which AI closes cheaply and correlated
  error reopens (a dashed bypass around the gate).
- The page says "Three channels stay open" for Move 2, but "channel" already means a Move 1
  precondition. The figure calls the Move 2 items "payloads" (the page's own "payload type", step 1) so
  the two sets aren't confused. Their names are exact: Selective truth, Framing, The unfalsifiable.

**Where the page text and the figure may disagree / want alignment:**
- Which channels are residual: the mermaid box lists "irreplaceable advantage · never resolves ·
  goal-divergence you can't design out". Verification gap and Stakes are therefore drawn as closed. The
  Move 2 intro ("goals diverge, the source has irreplaceable leverage, nothing resolves in time") agrees.
  The table, though, doesn't say Stakes always closes. If the authors mean it can stay open, flip
  `open` for Stakes in compute.py.
- The channel the starting brief called "the one channel AI reopens" is a Move 1 channel (reproduction
  gap), not one of Move 2's three, so the highlight sits in Move 1.
- Cost labels are shortened: "costs infrastructure" -> "infrastructure", "often free" etc. are verbatim.
  The Stakes lever is paraphrased as "spread the decision weight" (page: "don't concentrate decision weight
  on one elicitation"). The Never-resolves lever "escrow, bonds, a trusted resolver, identity" is
  shortened to "escrow, bonds, resolver, identity".
- Rung 5 outcome is paraphrased as "use it, but discount by how cheap a fake is" (page: "discounted by
  how cheaply it could still be faked"). Rung 6 box reads "Otherwise" (page wording; reviewer changed it from "None held").
- The mermaid's Move 1 also mentions "pick framing that zeroes goal-bias"; the figure uses the table's
  wording ("pick a venue or framing, no lean").
- Reviewer: the residue's "irreplaceable advantage" needs reproduction gap AND dependence both open. The figure draws
  Dependence as "open on some questions" and Reproduction gap as "closed for AI" with the correlated-error bypass, so the
  fused channel is reached only via that bypass. This matches the page for AI sources; for human sources the page says
  the reproduction gap "holds almost always", which the figure does not show.
