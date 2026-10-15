# dr-harm-channels

**Page:** apps/delegation-risk/src/content/docs/delegation-risk/risk-decomposition.md (convert to .mdx; slug unchanged).

**Placement:** section "How the channels differ", directly after the four-row table and before the paragraph "The last row matters most." The figure draws the table's rows as topology: who chooses (where each path starts), what sets P (left labels), main mitigations (cut on the hijack entry, the checks, the hard envelope), and correlation between stacked checks (the per-check percentages).

**What it shows.** Three lanes (accident, defection, hijack) run through one delegate, the same three checks, one hard envelope and one damage term. Accident and defection start inside the delegate ("error", "own goal"); hijack enters from below as injected instructions (prompt, retrieved content, tool, dependency), where the "data may fill in values, not choose actions" cut sits. Percentages give the share of harmful actions still going after each check. Accent red marks only the adversarially chosen paths.

**Data source.** compute.py (generates figure.html and index.html):
- Stack of three checks each missing 10% (risk-propagation.md's running example). Beta-factor mixture (1−ρ)·0.1^k + ρ·0.1: accident ρ = 0 gives 100 / 10 / 1 / 0.1%; ρ = 0.5 gives 5% (page: 0.051); defection and hijack use the minimum rule (ρ → 1), giving 100 / 10 / 10 / 10%.
- The coordinator's permission grant, D = $100,000 for both the accident row (P = 0.003) and the defection row (P = 0.002), is taken from index.md and risk-decomposition.md. The script also checks the page's channel totals ($1,420 / $500 / $100, 70 / 25 / 5%).

**Disagreements and judgment calls.**
- The page's table lists "hard envelopes" as a mitigation only for defection and hijack. The figure draws the envelope across all three lanes because an envelope bounds actions "regardless of what the agent intends" (runtime-accounting.md), and the overview recommends a hard limit for tail risk generally. If the owner wants it to match the table exactly, shorten the wall to the two lower lanes.
- The 10%-per-check figure is not on this page; it comes from risk-propagation.md. The caption says "three checks that each miss 10%", so it reads as illustrative.
- The page says that against an adversary the stack is worth "no more than its best layer", and possibly less. The figure shows exactly 10%, the floor. Nasr et al. suggest it is worse in practice.
- The starting idea's preflight and ledger were dropped because this page doesn't mention them. "Removing exfiltration paths" is folded into the envelope label ("limits what any action can reach").
- Variants: a wide SVG (720 viewBox, 14–15px text at 1:1) and a narrow stacked SVG (343 viewBox), switched by a container query at 600px.

**Review fixes (reviewer).**
- Caption now says "at least 10%": the page treats the stack as worth "no more than its best layer", so 10% is a floor on pass-through, not a point estimate.
- Widened the delegate box (x 168) so "own goal" no longer touches its left edge on desktop.
- Open point: the "data may fill in values, not choose actions" cut is drawn on all injection routes, but for direct misuse (the user typing the instruction) that separation does not apply. The page groups direct injection under hijack, so the cut overstates coverage for that route.
