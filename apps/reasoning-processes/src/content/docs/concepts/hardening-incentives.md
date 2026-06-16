---
title: "Hardening: Incentive-Compatibility"
description: Make honest reporting the agent's best strategy through scoring rules and markets, so distortion costs the producer.
sidebar:
  order: 10
---

*Family 5 of the [Hardening overview](/concepts/hardening-techniques/). Where the producer is a strategic agent, the move is mechanism design: arrange payoffs so truth-telling is the equilibrium. The lever, its limit, the constructions with their cheapest attacks, and a worked bound with numbers.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Part III, family page. Exploratory. Grades per [The Core Model](/concepts/core-model/).
:::

## The lever

If the producer is optimizing, make honesty its profit-maximizing strategy. Proper scoring rules and market scoring (LMSR) pay in proportion to the validated improvement a report induces in a shared belief state; peer-prediction mechanisms make truth-telling an equilibrium with no ground truth at all, now hardened into *informed-truthful* (maximally-paid) equilibria ([Shnayder et al. 2016](https://arxiv.org/abs/1603.03151); [Kong & Schoenebeck 2016](https://arxiv.org/abs/1605.01021)); and decision scoring rules keep elicitation honest even when the forecast feeds a decision ([Singh et al. 2025](https://arxiv.org/abs/2503.16395)). Distortion stops being free and starts costing the agent its score.

## The limit

Incentive-compatibility needs a payoff to ground out in — resolution, or at least peer agreement. Claims that never resolve escape it entirely (the persuasion gradient survives in proportion to the unvalidated weight), and the no-ground-truth mechanisms (peer prediction, BTS) buy their guarantees with an assumption — **non-collusion and rationality** — that LLM copies violate more easily than any human pool. Scoring also rewards *confidence calibrated to the score*, not truth, so an agent that models the resolver can be incentive-compatible toward the resolver while wrong about the world. IC moves the attack from the producer to whoever defines resolution.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Escrow-and-clawback credit | persuasion surplus $\le$ unvalidated weight (below) **[exact]** | payout on belief-movement pre-resolution | harvest the never-resolving weight, or exit before resolution (≈ pick unresolvable claims) | prototyped · — |
| Decision-contingent bets | proper scoring randomized over the decision rule **[standard shape]** | persuasion when forecasts feed actions | manipulate *which* decision is taken, or the outcome's resolution (moderate) | prototyped · [Singh 2025](https://arxiv.org/abs/2503.16395) |
| Mandatory two-sided quotes | bid-ask spread reveals withheld uncertainty **[standard shape]** | confidence the agent won't stand behind | quote a huge spread — honest-looking refusal to commit (≈ free, partial win) | prototyped · (LMSR) |
| Peer-relative bets | truthful equilibrium without ground truth **[standard shape]** | unresolvable-soon claims | collude with peers — coordinated reports (low; copies) | prototyped · [Prelec 2004](https://doi.org/10.1126/science.1102081) |
| Self-auditing pricing desk | two coherence identities checkable w/o ground truth **[exact]** | a mispriced value-of-information quote | misprice in a way *both* identities share (moderate) | prototyped · (EIA) |
| Long-short research portfolios | producers must short over-stated competitors **[heuristic]** | unincentivized criticism / consensus burial | form a cartel — agree not to short each other (low) | speculative · — |

## Worked bound

**The persuasion-budget bound.** A producer paid on belief-movement before resolution can harvest "surprise now." How much? A coherent forecaster's expected total squared movement on a binary question is bounded by $q_0(1-q_0)\le\tfrac14$ ([Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317)), so the **total unvalidated persuasion surplus across a portfolio is $\le\sum_i w_i\,q_i(1-q_i)\le\tfrac14\sum_i w_i$** **[exact]**. For a flat 200-question portfolio all sitting at maximum uncertainty ($q=0.5$), that ceiling is $200\times0.25=50$ "movement units" — finite, pre-computable, and concentrated entirely in the high-uncertainty questions. Three consequences: the attack surface is bounded; escrow/clawback budget should be allocated $\propto w_i q_i(1-q_i)$ rather than uniformly; and any producer inducing movement past budget is provably over-reacting. This turns [Overseeing Automated Research's](/proposals/overseeing-automated-research/) "persuasion gradient survives in proportion to unvalidated weight" into a number — and the cheapest attack stays exactly within it: harvest the weight that never resolves.

## Open questions

- How should payment split between *surprise now* (escrowed) and *validation later* to keep both incentives and cash-flow workable for long-horizon claims?
- Do peer-prediction mechanisms survive colluding LLM agents that share a base model, or does collusion-resistance require demonstrable independence (see [Independence](/concepts/hardening-independence/))?
- Once resolution is the terminal incentive, how much does the attack simply relocate to whoever interprets the resolution criteria?
