---
title: "Hardening: Calibration"
description: Make the output's confidence claims true, so the only unboundedly dangerous state — confident error — becomes rare and priced.
sidebar:
  order: 6
---

*Family 1 of the [Hardening overview](/concepts/hardening-techniques/). Calibration makes a process's stated confidence mean what it says, so a judge can size its commitment safely and a deceiver — confidently wrong by construction — shows up as a measurable defect. The lever, its sharp limit, the constructions, and two worked bounds.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Part III, family page. Exploratory. Grades per [The Core Model](/concepts/core-model/): **[exact]**, **[standard shape]**, **[heuristic]**, **[speculative]**.
:::

## The lever

The only epistemic state that can hurt a judge *unboundedly* is confident error. A calibrated process — where stated confidence $c$ means it is wrong a $(1-c)$ fraction of the time — turns an open-ended tail risk into a bounded, priceable one. The safety-relevant target is therefore not accuracy but **tail calibration**, $P(\text{false}\mid\text{asserts}\ge c)$ for $c$ near 1, since that is exactly where over-commitment and deception live ([Allen et al. 2024](https://arxiv.org/abs/2407.03167); trained for in [Wessel et al. 2025](https://arxiv.org/abs/2506.13687)). The canonical handle: act only above threshold $c$ and the confident-wrong rate is $\le (1-c)+\varepsilon$.

## The limit

Calibration is **necessary, not sufficient**, and the gap is exactly where the adversaries are. A process can be perfectly calibrated and useless (calibrated to the base rate, with no resolution — which is why a sharpness floor is mandatory), and a competent deceiver can be calibrated *on the observables the test uses* while wrong off-distribution. Tail calibration is also the hardest thing to measure precisely, because the high-confidence regime is rare by construction — so the certificate that matters most is the one with the least data. Calibration screens out *unforced* overconfidence cheaply; it does not, alone, catch a strategic liar.

## Constructions

| Construction | Bound / estimate | Threat it buys | Maturity | Source |
|---|---|---|---|---|
| Tail-calibration certification | confident-wrong $\le (1-c)+\varepsilon$ above $c$ **[heuristic]** | over-commitment on confident claims; deception | prototyped | [Allen 2024](https://arxiv.org/abs/2407.03167) |
| Priced abstention | risk-coverage curve; abstain when expected loss > cost **[standard shape]** | hallucinated confidence on out-of-knowledge queries | prototyped | [Geifman & El-Yaniv 2017](https://arxiv.org/abs/1705.08500); [Zhang 2024](https://arxiv.org/abs/2311.09677) |
| Kelly bankruptcy league | overconfident removed at rate $e^{-n D_{KL}}$ **[exact]** | systematic overconfidence in a population | theoretical | [Kleinberg 2023](https://arxiv.org/abs/2307.00168) |
| Sharpness floor (anti-laundering) | Brier $=$ reliability $-$ resolution $+$ uncertainty **[exact]** | calibration faked by retreat to base rates | deployed | [Murphy 1973](https://doi.org/10.1175/1520-0450(1973)012%3C0595:ANVPOT%3E2.0.CO;2) |
| Cross-horizon hazard consistency | deviation from the martingale-implied decay path **[standard shape]** | inconsistent confidence trajectories over time | prototyped | [Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317) |
| Self-insurance pricing | premium demanded $=$ stated error probability **[heuristic]** | unstated overconfidence | speculative | — |
| Reverse-Brier bounty | score $=$ adversary's failure-to-find-confident-error rate **[heuristic]** | confident errors an honest test misses | speculative | — |

## Worked bounds

**Tail-calibration certification.** Certify $P(\text{false}\mid\text{asserts}\ge c)\le\varepsilon$ directly; then acting only on assertions above $c$ caps the confident-wrong rate at $(1-c)+\varepsilon$ **[heuristic]**. A forecast can be calibrated overall yet miscalibrated in exactly this tail, so the measurement must be tail-specific.

**The Kelly bankruptcy league.** Run agents in a market where each bets its credences with Kelly (log-optimal) sizing. Bankroll growth equals the information actually held; an overconfident agent's is *negative* and it is driven out at rate $e^{-n\,D_{KL}(\text{true}\Vert\text{stated})}$ **[exact]** — a betting environment is an exponential overconfidence filter. The bridge to [U-calibration](https://arxiv.org/abs/2307.00168) (unexploitability by any bettor); the caveat is that betting only grounds resolvable claims on workable horizons.

## Open questions

- How do you estimate tail calibration when the high-confidence regime is, by design, the rarest — and therefore the least-sampled?
- Does a sharpness floor plus tail calibration jointly defeat the "coherent ignorance" attack, or can a deceiver still satisfy both on the test distribution?
- What is the right exchange rate between abstention cost and confident-error penalty for a given decision?
