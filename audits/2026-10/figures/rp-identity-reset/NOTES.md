# rp-identity-reset — the enforceable penalty over an identity's life

**Page:** apps/reasoning-processes/src/content/docs/environment/identity-and-track-records.md (becomes .mdx)

**Placement:** under "## The quantity: enforceable penalty", directly after the two bullets that start
"Plug in the deterrence chapter's numbers" (newcomer about 1 cent; established producer at $53 only if ΔR is about $1,000),
and before the paragraph "So **a track record works like a bond that can't be refunded but can be spent once**…".

**What it shows.** B_eff = B_escrow + ΔR plotted against rounds since the identity entered. The right axis shows the safe stake S* = (c + pB)/(1−p) at c = 1¢ and p = 5%. Three of the page's claims, all in one picture:
1. Newcomer dues: a fresh identity has no standing to lose. This is why a reset is cheap and why newcomers are the cheapest place to attack.
2. Reset at round 50: the gap between the established identity (solid) and its replacement (dashed) is the ΔR = $1,000 the page names, which reads as $53 on the right axis. The figure redraws the requested "two timelines" as two curves on one axis.
3. Reputation milking: standing is a discounted stream, so it drains to 0 before the version's scheduled retirement. Only escrow binds at both ends of the identity's life, which is the page's argument for capping stakes at what escrow covers.
This does not repeat rp-deterrence, which shows "re-key → B = 0" on the (p, B) plane. This figure adds the time dimension that the identity page argues from.

**Data source.** compute.py (run `python3 compute.py`; it writes svg-wide.svg, svg-narrow.svg, figure.html and index.html, and asserts the page's numbers).
- Page formulas: S*, B_eff ≈ B_escrow + ΔR, and R = V_est − max(V_fresh − W, 0) with W = 0 (cheap pseudonyms).
- Modelling assumptions, which the page states only qualitatively: the newcomer premium ramps linearly over D = 25 rounds (the dues convention); discount 0.98 per round; a ruin rule (ΔR = R); the version retires at T = 100; a fresh identity runs the same version, so it retires at the same date. R(t) = Σ_{k=1}^{T−t} δ^k [π(t+k) − π(k)], scaled so the plateau is exactly $1,000. Without dues, π is constant and R ≡ 0.
- B_escrow = $200 is **illustrative**, because the page gives no escrow figure. The caption says so.

**Text vs figure.**
- No contradiction. The page's "$53 only if ΔR ≈ $1,000" is the standing alone. With the illustrative escrow stacked on top, the peak reads $63; the $1,000 ↔ $53 pair is on the axes.
- The page says ΔR < R unless a ruin rule applies, for example under averaging reputations. The figure assumes a ruin rule throughout. An averaging rule would flatten the blue band toward the escrow floor and is not drawn.
- The shape of the drain near exit (and the concave rise) comes from the model. The page only says R "goes to zero" as exit approaches. Suggest the page text keep "illustrative" if it refers to the curve.

**Component notes.** One accent (blue) marks the standing band and the B_eff line. Escrow is a neutral band, and the reset path is dashed in the text colour. The double arrow at round 50 is labelled. The narrow variant (≤560px) shortens the labels; the caption describes the dashed reset path. Classes are prefixed `id-`, and marker ids are `idw-`/`idn-`.

**Review (2026-10-15).** Independently recomputed: S*($0)=1.05¢, S*($200)=$10.54, S*($1,000)=$52.64, S*($1,200)=$63.17, plus the right-axis ticks $21/$32/$42; R(5)≈$347 checked by hand against the stated model. Fixes: the caption no longer says that losing standing "lifts" the safe stake (it is the standing *at risk* that does); the narrow variant's "lost if caught" label moved off the dashed curve, and the dashed path gets its own label ("new identity"); the right-axis title moved closer to its ticks. Remaining caveat: because the reset is at 50 with D=25 and T=100, the replacement reaches the plateau exactly when the drain begins. That coincidence comes from the chosen parameters, not from the page.
