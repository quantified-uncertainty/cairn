---
title: "Hardening: Verifiability Asymmetry"
description: Make checking cheaper than producing, then spot-check — the engine under SAT, proof-carrying code, and the PCP theorem, ported to estimates.
sidebar:
  order: 7
---

*Family 2 of the [Hardening overview](/concepts/hardening-techniques/). All cheap robustness runs on one asymmetry: verification costing less than production. Where it holds, a constant amount of checking catches large distortions; where it fails, nothing else in the toolkit is cheap. The lever, its limit, the constructions with their cheapest attacks, and two worked bounds with numbers.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Part III, family page. Exploratory. Grades per [The Core Model](/concepts/core-model/).
:::

## The lever

If checking a claim is cheaper than producing it, you can spot-check a small fraction and still catch a large lie — the asymmetry behind SAT, proof-carrying code ([Necula 1997](https://doi.org/10.1145/263699.263712)), succinct verifiable computation ([Pinocchio, Parno et al. 2013](https://doi.org/10.1109/SP.2013.47)), and the PCP theorem, under which a proof can be verified by reading $O(1)$ random bits ([Arora & Safra 1998](https://doi.org/10.1145/273865.273901); [Arora et al. 1998](https://doi.org/10.1145/278298.278306); [Dinur 2007](https://doi.org/10.1145/1236457.1236459)). The hardening move is to *force* the asymmetry into existence — require a structured, checkable artifact (a decomposition, a model, a held-out prediction) where one didn't exist.

## The limit

The asymmetry has to *exist*. For machine-checkable proofs it does (Lean); for general estimates it may not — you cannot spot-check a bare probability, and the field has no PCP-analogue for quantitative reasoning yet. Worse, forcing a decomposition is itself gameable: a dishonest producer routes the load-bearing claim into the one node that *isn't* checkable, leaving the spot-check to graze only honest scaffolding (the decomposition-routing attack). And for the genuinely unresolvable residue — claims with too few checkable connections — this family is silent, which is precisely the territory [judge-grounded protocols](/concepts/oversight-protocols/) exist for.

## Constructions

| Construction | Bound / estimate | Defends against | Cheapest attack (≈ cost) | Maturity · source |
|---|---|---|---|---|
| PCP-analogue for estimates | detection $\ge 1-(1-f)^{g(\Delta)}$; $f{=}.1,g{=}20\Rightarrow88\%$ **[heuristic]** | fabricated estimate spread across a decomposition | force $g(\Delta){=}1$ — concentrate the lie in one node (missed w.p. $1{-}f$) | speculative · [Arora & Safra 1998](https://doi.org/10.1145/273865.273901) |
| Forced precision (Quine–Duhem) | defended-falsehood prior $\sim p^{k_R}$ **[heuristic]** | bold-but-vague claims | choose a claim with no checkable connections ($k_R{=}0$) (≈ free) | speculative · — |
| Decomposition disclosure | check $O(1)$ nodes of a stated graph **[heuristic]** | hidden load-bearing assumptions | put the load-bearing claim in an un-checkable leaf (low) | prototyped · [Necula 1997](https://doi.org/10.1145/263699.263712) |
| Entailment-web check | $N$ related questions must cohere **[standard shape]** | confident-wrong that can't stay coherent | maintain a globally coherent but wrong worldview (high — the point) | prototyped · (consistency line) |
| Held-out retrodiction | scored by held-out log-loss, not self-report **[standard shape]** | rhetorical worldview with no predictive content | exploit contamination — the "held-out" facts are in training (≈ free if the bank leaks) | prototyped · [Mallen 2023](https://arxiv.org/abs/2312.01037) |
| Retrodiction banks (decay-accounted) | each item priced by leak probability **[heuristic]** | contamination eroding a test set | infer outcomes from correlated public knowledge (low) | prototyped · — |
| Throttle-vs-unlimited divergence | gap between tiny- and large-compute answers **[heuristic]** | heuristic/persuasion-driven answers | cache / canonicalize so both budgets return the same answer (≈ free) | speculative · — |

## Worked bounds

**A PCP-analogue for estimates.** Require a structured decomposition (a Fermi tree, a Squiggle model) as a certificate and spot-check a fraction $f$ of its nodes. If a distortion of size $\Delta$ can be forced to corrupt at least $g(\Delta)$ nodes, detection is $\ge 1-(1-f)^{g(\Delta)}$ **[heuristic]**. Checking only $f=10\%$ of nodes catches a lie spread over $g=20$ nodes with probability $1-0.9^{20}\approx88\%$ — but a lie concentrated in a single node ($g=1$) is missed with probability $1-f=90\%$. So the whole construction lives or dies on whether the task can be *encoded* to force $g(\Delta)$ large — the open research question, and the dual of counterexample-shrinking in [Consistency Evaluations](/proposals/consistency-evals/).

**Forced precision — the Quine–Duhem cost.** Demand a bold claim be cashed into a precise operationalization *and* a model linking it to checkable facts. A false claim can always be saved by adjusting auxiliaries, but keeping it coherent at resolution $R$ costs $k_R$ improbable auxiliary commitments, and the defended position's joint prior decays like $p^{k_R}$ **[heuristic]** — e.g. five independent auxiliaries each 30% plausible drag the position to $0.3^5\approx0.2\%$, forcing a confident liar to either lower confidence or expose a contradiction. The cheapest escape, per the limit, is a claim with $k_R\to0$: no checkable connections to begin with.

## Open questions

- Does a non-trivial PCP-analogue for estimates exist, and what is $g(\Delta)$ for realistic decompositions?
- Who controls the decomposition? If the producer does, it can route load-bearing claims into un-checkable nodes — can the checker force a decomposition it trusts?
- How much of a real research portfolio is verifiable at all, versus residing in the unresolvable residue?
