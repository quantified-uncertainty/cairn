---
title: "Hardening: Incentive-Compatibility"
description: Make honest reporting the agent's best strategy through scoring rules and markets, so distortion costs the producer.
sidebar:
  order: 10
---

*Family 5 of the [Hardening overview](/concepts/hardening-techniques/). Where the producer is a strategic agent, the move is mechanism design: arrange payoffs so truth-telling is the equilibrium. The lever, its limit, the constructions with their cheapest attacks, and a worked bound with numbers.*

## The lever

If the producer is optimizing, make honesty its profit-maximizing strategy. Proper scoring rules and market scoring (LMSR) pay in proportion to the validated improvement a report induces in a shared belief state; peer-prediction mechanisms make truth-telling an equilibrium with no ground truth at all, now hardened into *informed-truthful* (maximally-paid) equilibria ([Shnayder et al. 2016](https://arxiv.org/abs/1603.03151); [Kong & Schoenebeck 2016](https://arxiv.org/abs/1605.01021)); and when the forecast feeds a decision, [decision scoring rules](https://www.andrew.cmu.edu/user/coesterh/DecisionScoringRules.pdf) can keep the recommendation and its expected value honest, though not the full conditional forecast (Oesterheld & Conitzer 2020). Distortion stops being free and starts costing the agent its score.

## The limit

Incentive-compatibility needs a payoff to ground out in — resolution, or at least peer agreement. Claims that never resolve escape it entirely (the persuasion gradient survives in proportion to the unvalidated weight), and the no-ground-truth mechanisms (peer prediction, BTS) buy their guarantees with an assumption — **non-collusion and rationality** — that LLM copies violate more easily than any human pool. Scoring also rewards *confidence calibrated to the score*, not truth, so an agent that models the resolver can be incentive-compatible toward the resolver while wrong about the world. IC moves the attack from the producer to whoever defines resolution.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| Escrow-and-clawback credit | expected persuasion surplus $\le$ unvalidated weight, coherent consumer (below) **[standard shape]** | payout on belief-movement pre-resolution | harvest the never-resolving weight, or exit before resolution (≈ pick unresolvable claims) | prototyped · — |
| Decision-contingent bets | proper scoring randomized over the decision rule **[standard shape]** | persuasion when forecasts feed actions | manipulate *which* decision is taken, or the outcome's resolution (moderate) | prototyped · [Chen et al. 2014](https://doi.org/10.1145/2556271) |
| Mandatory two-sided quotes | bid-ask spread reveals withheld uncertainty **[standard shape]** | confidence the agent won't stand behind | quote a huge spread — honest-looking refusal to commit (≈ free, partial win) | prototyped · (LMSR) |
| Peer-relative bets | truthful equilibrium without ground truth **[standard shape]** | unresolvable-soon claims | collude with peers — coordinated reports (low; copies) | prototyped · [Prelec 2004](https://doi.org/10.1126/science.1102081) |
| Self-auditing pricing desk | two coherence identities checkable w/o ground truth **[exact]** | a mispriced value-of-information quote | misprice in a way *both* identities share (moderate) | prototyped · (EIA) |
| Long-short research portfolios | producers must short over-stated competitors **[heuristic]** | unincentivized criticism / consensus burial | form a cartel — agree not to short each other (low) | speculative · — |

## Worked bound

**The persuasion-budget bound.** A producer paid on belief-movement before resolution can harvest "surprise now." How much? For a coherent consumer, expected total squared movement on a binary question is at most $q_0(1-q_0)\le\tfrac14$ ([Augenblick & Rabin 2021](https://academic.oup.com/qje/article-abstract/136/2/933/6127317)), so if pay tracks squared movement the **expected unvalidated persuasion surplus across a portfolio is $\le\sum_i w_i\,q_i(1-q_i)\le\tfrac14\sum_i w_i$** **[standard shape]**. A flat 200-question portfolio at $q=0.5$ caps it at $200\times0.25=50$ "movement units", concentrated in the high-uncertainty questions, so escrow should be allocated $\propto w_i q_i(1-q_i)$. The bound is an expectation under the consumer's own beliefs and assumes coherence, which a persuadable LLM consumer may lack; one question moving past budget proves nothing, while persistent excess across many questions is a statistical test of incoherence. This puts a number on [Overseeing Automated Research's](/proposals/overseeing-automated-research/) "persuasion gradient survives in proportion to unvalidated weight", and the cheapest attack stays within it: harvest the weight that never resolves.

## Open questions

- How should payment split between *surprise now* (escrowed) and *validation later* to keep both incentives and cash-flow workable for long-horizon claims?
- Do peer-prediction mechanisms survive colluding LLM agents that share a base model, or does collusion-resistance require demonstrable independence (see [Independence](/concepts/hardening-independence/))?
- Once resolution is the terminal incentive, how much does the attack simply relocate to whoever interprets the resolution criteria?
