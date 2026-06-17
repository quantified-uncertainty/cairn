---
title: Glossary & Notation
description: Index of the field's terms and symbols, with the page where each is defined.
---

*Every term this book mints or borrows, and every recurring symbol, with a one-line definition and a link to the page that owns it. When prose and glossary disagree, the owning page wins; please file the disagreement.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/).
:::

## Terms

| Term | One-line definition | Defined in |
|---|---|---|
| **Robust reasoning processes (RRP)** | The proposed field: the study and engineering of procedures that turn effort and evidence into trustworthy conclusions, and keep doing so under adversarial pressure | [Robust Reasoning Processes](/start-here/introduction/) |
| **Reasoning process** | A procedure — peer review, a prediction market, an LLM pipeline — that consumes effort and evidence and emits claims, estimates, or evaluations | [The Core Model](/concepts/core-model/) |
| **Judge** | The consumer of reasoning, who cannot check the work object-level and must decide how much to update | [The Core Model](/concepts/core-model/) |
| **Epistemic weight** | A process's likelihood-ratio profile: how strongly its outputs discriminate truth from falsehood, conditional on its incentive environment | [The Core Model](/concepts/core-model/#1-epistemic-weight-exact) |
| **Loss pipeline** | The heuristic decomposition of delivered value into codification, evaluator, and interpretation losses | [The Core Model](/concepts/core-model/#2-value-delivered-the-loss-pipeline-heuristic) |
| **Cost per validated bit** | The field's figure of merit: the price of information that survived checking, not the price of text | [The Core Model](/concepts/core-model/#3-cost-unit-economics-standard-shape) |
| **Corruption cost curve** | The minimum an adversary of given capability must spend to distort a process's output by a given amount | [The Core Model](/concepts/core-model/#4-corruption-standard-shape) |
| **Corruption surplus** | A participant's maximum expected gain from deviating from honest effort — what attackers harvest | [The Core Model](/concepts/core-model/#4-corruption-standard-shape) |
| **Robustness condition** | Corrupting the process costs more than the distortion is worth — evaluated per threat model, never threat-model-free | [The Core Model](/concepts/core-model/#4-corruption-standard-shape) |
| **Incentive audit** | Measuring a corruption cost curve empirically: pay red-team producers to corrupt the process and record the price | [The Core Model](/concepts/core-model/#4-corruption-standard-shape) |
| **Grading scheme** | Every formalism carries **[exact]**, **[standard shape]**, or **[heuristic]** — trust each exactly as far as its grade | [The Core Model](/concepts/core-model/) |
| **Epistemic Impact Analysis (EIA)** | Pricing information by how it changes a calibrated agent's beliefs, weighted by a utility function, validated at resolution | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| **Profundity** | How load-bearing a changed belief is — how much an update propagates to downstream questions | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| **Falsehood nullification** | The demand that false claims contribute zero or negative value — the hard problem of verification, restated as a desideratum | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| **Question portfolio** | A utility function represented as a few hundred importance-weighted resolvable questions | [Constructing Utility Functions](/concepts/constructing-utility-functions/) |
| **Relative value functions** | Representing value as pairwise ratio distributions rather than absolute units, preserving correlation | [Constructing Utility Functions](/concepts/constructing-utility-functions/) |
| **Grounding** | What a protocol's incentives terminate in: a judge's verdict, external resolution, internal coherence, or peer agreement | [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/) |
| **Producer/consumer prediction game** | An information producer trades against a calibrated reference model and profits by moving its beliefs and being validated at resolution | [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/#the-producerconsumer-prediction-game) |
| **Retrodiction** | Scoring models on known facts hidden from them — resolution without waiting, if contamination can be controlled | [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/) |
| **Epistemic selection protocols** | Committing now to a process for choosing the most-trusted resolver at resolution time | [The Reliability Ladder](/concepts/epistemic-applications/) |
| **Consistency battery** | A suite of checks that a system's estimates obey the constraints any rational belief set must — necessary, never sufficient | [Consistency Evaluations](/proposals/consistency-evals/) |
| **Dutch book / arbitrage metric** | Inconsistency priced as the guaranteed profit extractable from a system's own estimates | [Consistency Evaluations](/proposals/consistency-evals/) |
| **Opinion fuzzing** | Sampling judgments across prompts, models, and personas and treating the variance structure as signal | [Consistency Evaluations](/proposals/consistency-evals/) |
| **Strong reasoner** | An AI system whose judgments deserve substantial weight — in the limit, deference — within its domain; warranted trust, not raw capability (and not "reasoning model") | [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/) |
| **LLM-based epistemic process** | The unit of analysis: model plus scaffolding plus protocols, not the bare model | [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/) |
| **Reliability ladder** | Five application tiers, each deployable only when its verification machinery exists and survives optimization against it | [The Reliability Ladder](/concepts/epistemic-applications/) |
| **Output-metered oversight** | Don't audit the research process; meter the output's validated epistemic impact against a question portfolio | [Overseeing Automated Research](/proposals/overseeing-automated-research/) |
| **Consumer agent** | The calibrated reference model whose belief state over the portfolio is "the book" | [Overseeing Automated Research](/proposals/overseeing-automated-research/) |
| **Object loop / meta loop** | Producers maximize validated impact against $V$; an institutionally separated party audits and re-weights $V$ itself | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| **Resolution layer** | The enforcement of falsehood nullification: resolvers, retrodiction, consistency checks, randomized audits. "The resolution layer is the system." | [Overseeing Automated Research](/proposals/overseeing-automated-research/) |
| **Deception affordance** | A form's false-side belief swing relative to its true-side swing — near one, the form transmits persuasion, not information | [Interlude: Untrustworthy Sources](/concepts/untrustworthy-sources/) |
| **Built-in biases** | A process's systematic distortions with no adversary at all — corruption an attacker gets at zero marginal cost | [The Process Catalogue](/concepts/process-catalogue/) |
| **Decision-relative (goal) bias** | A process's systematic lean toward one resolution of a specific decision $D$ — as opposed to broad, decision-independent biases; should be ≈0 on decisions it has no information about | [The Process Catalogue](/concepts/process-catalogue/#reading-the-table) |
| **Label-swap neutrality** | The unsupervised check for goal bias: swap the options of a no-information decision; residual output asymmetry is the bias | [The Process Catalogue](/concepts/process-catalogue/#reading-the-table) |
| **Deception preconditions** | The conjunction (verification gap, reproduction gap, dependence, goal-divergence, never-resolves, stakes) all required for deception to be a live risk — break any one to defuse it | [Interlude: Untrustworthy Sources](/concepts/untrustworthy-sources/#when-is-deception-possible) |
| **Irreplaceable advantage** | A source's output-relevant epistemic edge the trusted frontier cannot reproduce — the region where replacement cost is infinite and deception is genuinely dangerous | [Interlude: Untrustworthy Sources](/concepts/untrustworthy-sources/#the-irreplaceable-advantage) |
| **The empty quadrant** | Cheap to run and expensive to corrupt — the region of the process map the AI era needs filled | [The Process Catalogue](/concepts/process-catalogue/#the-map) |

## Notation

| Symbol | Meaning | Home |
|---|---|---|
| $\pi$ | a reasoning process | [The Core Model](/concepts/core-model/) |
| $J$ | the judge | [The Core Model](/concepts/core-model/) |
| $U$ | the judge's utility function over information, represented as a weighted question portfolio | [The Core Model](/concepts/core-model/), [Constructing Utility Functions](/concepts/constructing-utility-functions/) |
| $V_{source}, V_{delivered}$ | information value before and after the loss pipeline | [The Core Model](/concepts/core-model/) |
| $L_{cod}, L_{eval}, L_{interp}$ | codification, evaluator, and interpretation losses | [The Core Model](/concepts/core-model/) |
| $c_{process}, c_{interp}$, $n$ | process cost, per-consumer interpretation cost, number of consumers | [The Core Model](/concepts/core-model/) |
| $C_\pi(\Delta, g, t)$ | corruption cost curve: minimum adversary spend to distort $\pi$'s output by $\Delta$ at capability $g$, time $t$ | [The Core Model](/concepts/core-model/) |
| $\Delta$ | distortion, measured in $U$-units | [The Core Model](/concepts/core-model/) |
| $g$ | adversary capability | [The Core Model](/concepts/core-model/) |
| $V(I, A, U)$ | EIA's value of information set $I$ to agent $A$ under utility function $U$ | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| $I$ | a set of information (data, arguments, a paper) | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| $A$ | the calibrated consumer agent — itself a reasoning process $\pi$ in the core model's sense, playing the judge's belief-keeper | [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) |
| $Q$, $Q'$ | an estimation question; a semantically equivalent rephrasing | [Consistency Evaluations](/proposals/consistency-evals/) |
| $M(Q, t)$ | the evaluated model's answer to $Q$ at time $t$ | [Consistency Evaluations](/proposals/consistency-evals/) |
| $q$, $q_X$ | a forecast; the forecast after observing source $X$ | [The Core Model](/concepts/core-model/#5-pricing-information-before-it-arrives-exact) |
| $I(Q; X)$ | mutual information between question $Q$ and source $X$ — the decision-free value of a source, per question | [The Core Model](/concepts/core-model/#5-pricing-information-before-it-arrives-exact) |
| $\tau$ | the listener's credence that a source is honest rather than strategic — refined into decision-indexed goal-divergence | [Interlude: Untrustworthy Sources](/concepts/untrustworthy-sources/#when-is-deception-possible) |
| $b_\pi(D)$ | decision-relative (goal) bias: $\pi$'s systematic lean toward one resolution of decision $D$, holding truth-relevant information fixed | [The Process Catalogue](/concepts/process-catalogue/#reading-the-table) |
