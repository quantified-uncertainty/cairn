---
title: "Hardening: Calibration"
description: Make the output's confidence claims true, so the only unboundedly dangerous state — confident error — becomes rare and priced.
sidebar:
  order: 6
---

*Family 1 of the [Hardening overview](/concepts/hardening-techniques/). Calibration makes a process's stated confidence mean what it says, so a judge can size its commitment safely and unforced overconfidence shows up as a measurable defect. The lever, its sharp limit, the constructions with their cheapest attacks, and two worked bounds with numbers.*

## The lever

The only epistemic state that can hurt a judge *unboundedly* is confident error. A calibrated process — where stated confidence $c$ means it is wrong a $(1-c)$ fraction of the time — turns an open-ended tail risk into a bounded, priceable one. The safety-relevant target is therefore not accuracy but **tail calibration**, $P(\text{false}\mid\text{asserts}\ge c)$ for $c$ near 1, since that is where over-commitment does its damage ([Allen et al. 2024](https://arxiv.org/abs/2407.03167); trained for in [Wessel et al. 2025](https://arxiv.org/abs/2506.13687)). The canonical handle: if the tail's error rate exceeds its stated $1-c$ by at most $\varepsilon$, acting only above threshold $c$ keeps the confident-wrong rate $\le (1-c)+\varepsilon$.

## The limit

Calibration is **necessary, not sufficient**, and the gap is exactly where the adversaries are. A process can be perfectly calibrated and useless (calibrated to the base rate, with no resolution — which is why a sharpness floor is mandatory), and a competent deceiver can be calibrated *on the observables the test uses* while wrong off-distribution. One that lies rarely, on the decisions that matter, barely moves a tail estimate at all. Tail calibration is also the hardest thing to measure precisely, because the high-confidence regime is rare by construction — so the certificate that matters most is the one with the least data. Calibration screens out *unforced* overconfidence cheaply; it does not, alone, catch a strategic liar.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Tail-calibration certification | confident-wrong $\le (1-c)+\varepsilon$; $c{=}.99,\varepsilon{=}.005\Rightarrow\le1.5\%$ **[heuristic]** | over-commitment; deception | be calibrated on the *test* distribution, wrong off it (≈ free if the test set is static) | prototyped · [Allen 2024](https://arxiv.org/abs/2407.03167) |
| Priced abstention | risk-coverage curve; abstain when E[loss] > cost **[standard shape]** | hallucinated confidence out-of-knowledge | answer easy items, abstain on hard ones to dodge scoring (≈ free) | prototyped · [Geifman & El-Yaniv 2017](https://arxiv.org/abs/1705.08500) |
| Kelly bankruptcy league | overconfident bettor loses $n D_{KL}$ in expected log-wealth **[exact]** | systematic overconfidence | farm a colluding identity, or re-key after ruin (≈ cost of a Sybil) | theoretical · [Kelly 1956](https://doi.org/10.1002/j.1538-7305.1956.tb03809.x); [Blume & Easley 2006](https://doi.org/10.1111/j.1468-0262.2006.00691.x) |
| Sharpness floor (anti-laundering) | Brier $=$ reliability $-$ resolution $+$ uncertainty **[exact]** | calibration faked via base rates | answer only easy, high-resolution questions (≈ free) | deployed · [Murphy 1973](https://doi.org/10.1175/1520-0450(1973)012%3C0595:ANVPOT%3E2.0.CO;2) |
| Cross-horizon hazard consistency | deviation from the martingale-implied path **[standard shape]** | inconsistent confidence trajectories | drift smoothly along a plausible-but-wrong hazard curve (low) | prototyped · [Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317) |
| Self-insurance pricing | premium demanded $=$ stated error probability **[heuristic]** | unstated overconfidence | quote an honest premium, never pay out absent escrow (≈ free) | speculative · — |
| Reverse-Brier bounty | score $=$ adversary's confident-error-find-rate **[heuristic]** | confident errors an honest test misses | retreat to evasive vagueness; or bounty-hunter collusion (low) | speculative · — |

Priced abstention depends on the scoring rule. [Kalai et al. (2025)](https://arxiv.org/abs/2509.04664) argue that language models keep hallucinating partly because most benchmarks score "I don't know" the same as a wrong answer, so guessing pays. Their remedy is to rescore the benchmarks that dominate leaderboards, for example by stating a confidence threshold $t$ and charging $t/(1-t)$ points per error, rather than to add hallucination evaluations. By the same logic, an evaluation used to certify a process should score an error below an abstention, by a stated penalty.

## Worked bounds

**Tail-calibration certification.** Let $\varepsilon$ be the tail's *excess* error, so $P(\text{false}\mid\text{asserts}\ge c)\le(1-c)+\varepsilon$. Certify $\varepsilon$, and acting only on assertions above $c$ caps the confident-wrong rate at $(1-c)+\varepsilon$ **[heuristic]**. With $c=0.99$ and a measured $\varepsilon=0.005$, the judge's confident-wrong rate is $\le1.5\%$ — a number it can insure against. The catch is in the limit above: $\varepsilon$ is hardest to estimate precisely exactly where it matters, since assertions $\ge0.99$ are rare.

**The Kelly bankruptcy league.** Run agents in a market where each bets its credences with Kelly (log-optimal) sizing. Relative to a calibrated rival, an agent whose stated credence differs from the truth loses $D_{KL}(\text{true}\Vert\text{stated})$ in expected log-wealth per bet (Kelly 1956; [Cover & Thomas](https://onlinelibrary.wiley.com/doi/book/10.1002/047174882X), ch. 6), so its wealth share typically decays like $e^{-n\,D_{KL}}$ **[exact, in expected log-wealth]**. In complete markets, wealth flows to the more accurate believers, other things equal; in incomplete markets the selection can fail (Blume & Easley 2006). Concretely, an agent that states 0.9 when the truth is 0.7 forfeits log-wealth at $D_{KL}\approx0.15$ nats per resolved bet, so after $\sim30$ bets it typically holds $\approx e^{-4.6}\approx1\%$ of a calibrated rival's stake — an exponential overconfidence filter. The caveat is that betting only grounds resolvable claims on workable horizons.

## Open questions

- How do you estimate tail calibration when the high-confidence regime is, by design, the rarest — and therefore the least-sampled?
- Does a sharpness floor plus tail calibration jointly defeat the "coherent ignorance" attack, or can a deceiver still satisfy both on the test distribution?
- What is the right exchange rate between abstention cost and confident-error penalty for a given decision?
