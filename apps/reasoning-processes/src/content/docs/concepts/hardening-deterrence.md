---
title: "Hardening: Deterrence"
description: Off-equilibrium penalties that cost little on the honest path and a great deal to an adversary — the most promising route to the empty quadrant.
sidebar:
  order: 11
---

*Family 6 of the [Hardening overview](/concepts/hardening-techniques/). The other families mostly raise corruption cost by spending on verification, which costs information every run. Deterrence raises it off-equilibrium — bonds, clawbacks, tamper-evidence — at low honest-path cost, which makes it the most promising route into the cheap-and-incorruptible quadrant. The lever, its limit, the constructions with their cheapest attacks, and two worked bounds with numbers.*

## The lever

Make corruption expensive *only when it happens*. A bond posted and forfeited on detection, a clawback at resolution, an append-only log that makes tampering discoverable — each costs the honest participant almost nothing yet imposes a large expected cost on an adversary. Following the classical [detection × penalty](https://doi.org/10.1086/259394) logic (Becker 1968), deterrence raises the corruption axis at little cost on the information axis: the penalty is paid off the equilibrium path, and the honest path pays only for detection, an audit rate $p$ times the audit cost. With an enforceable penalty, $p$ can be small, which is why deterrence looks like the cheapest route into the [empty quadrant](/concepts/process-catalogue/).

## The limit

Deterrence needs two things that don't yet come for free: **enforceable identity** and **eventually-real detection**. Without [identity infrastructure](/environment/identity-and-track-records/) the maximum bond $B$ is effectively zero (an adversary re-keys after forfeiture), and the inspection-game ceiling collapses to the verification regime. Detection must also actually arrive — a tamper-evident log deters nothing if no one ever audits, and a clawback deters nothing on claims that never resolve. And deterrence fails entirely against an adversary who does not internalize the penalty: judgment-proof, one-shot, or indifferent attackers. It is the most powerful family where its preconditions hold and inert where they don't.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Randomized deep-audit lottery | safe stake $S^\*=(c+pB)/(1-p)$; ≈ \$53 below **[standard shape]** | cheap-process corruption up to $S^\*$ | keep each attack's stake just below $S^\*$ (bounded by $S^\*$) | prototyped · (inspection games) |
| Merkle-logged reasoning traces | post-hoc tamper detection w.p. $\approx 1$ **[exact, given active monitors]** | silent after-the-fact tampering | be dishonest in the *original* trace; or rely on no one auditing (≈ free if unaudited) | deployed · [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962) |
| Clawback-with-interest | penalty multiplier on false resolutions **[standard shape]** | claims resolving just past the horizon | be judgment-proof — take the credit and exit before clawback (≈ cost of an exit) | prototyped · [Becker 1968](https://doi.org/10.1086/259394) |
| Provenance-bonded sources | source stake slashed if later shown corrupt **[heuristic]** | citing sources later revealed biased | stay biased but below the *proof* threshold (low — detection gap) | speculative · ([funding effect](/case-studies/the-funding-effect/)) |
| Reputation bankroll with ruin | identity-bound standing funds high-stakes claims **[heuristic]** | sets the enforceable penalty $B$ | Sybil — a fresh identity after ruin (≈ cost of an identity, cheap without infra) | speculative · (identity infra) |
| Confidence-scaled bonds | bond $\propto$ confidence, forfeited on error **[heuristic]** | overconfidence as a cheap strategy | under-report confidence to dodge the bond (≈ free, but loses persuasive force) | speculative · — |
| Revision rate-limiting | manipulation needs a slow, visible trail **[heuristic]** | instant reversal as a cheap-attack signature | pre-position the manipulation slowly within the limit (≈ patience) | speculative · — |

## Worked bounds

**The inspection-game frontier.** Wrap a cheap process (corruption cost $c$) in an audit that escalates to an expensive robust process with probability $p$, requiring an enforceable bond $B$ forfeited on detection. An adversary's expected payoff $(1-p)S - pB - c$ is negative iff

$$S < S^\* = \frac{c + pB}{1-p}. \qquad \textbf{[standard shape]}$$

Plug in a \$0.01 LLM-judge call, a 5% audit rate, and a \$1,000 bond: $S^\*=(0.01+0.05\cdot1000)/0.95\approx 53$, so about \$53 of safe stake bought by a one-in-twenty audit. Strip the bond ($B=0$) and the *same* \$53 safe stake would require an audit rate of $p\approx99.98\%$ — full verification. Robustness scales with the expected penalty $pB$, and every run still pays $p\,C_{\text{audit}}$ for the audits; what the bond buys is that a small $p$ suffices. That is the formal case for identity/escrow infrastructure, and the cheapest attack is to keep each stake below $S^\*$.

**Provenance bonds and the funding effect.** Make every cited source post a stake, slashed if spin is later demonstrated. In the [funding-effect](/case-studies/the-funding-effect/#from-odds-ratios-to-a-likelihood-ratio-discount) model, spin at rate $s$ is what attenuates a favorable conclusion's likelihood ratio; the bond deters it when detection probability times $B$ exceeds the gain from spinning. It is the deterrence-side counterpart to the [identity-masking gap](/concepts/hardening-invariance/), which *measures* the same bias. A per-study bond cannot reach selection (which studies get commissioned), and its cheapest defeat is the detection gap: a source biased but never *proven* corrupt keeps its bond.

## Open questions

- How much enforceable penalty $B$ is reachable without identity infrastructure (see [Identity and Track Records](/environment/identity-and-track-records/#the-quantity-enforceable-penalty) for the decomposition $B_{\text{eff}} \approx B_{\text{escrow}} + \Delta R$ and why standing is weaker than escrow), and how much does that infrastructure raise $S^\*$ across the [Process Catalogue's](/concepts/process-catalogue/) rows?
- What is the minimal viable identity/escrow layer that makes bonds binding for AI producers?
- How do you deter an adversary who is judgment-proof or playing a one-shot game — is there a deterrence analogue that doesn't rely on a repeated relationship?
