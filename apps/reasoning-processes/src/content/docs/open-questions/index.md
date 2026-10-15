---
title: Open Problems
description: Unresolved problems, aggregated from every chapter's open-questions section.
---

*Every chapter keeps its own open-questions section, and this page aggregates them. The five problems at the top are the ones we currently think the whole program rests on. A further group lists questions that the 2025–26 evidence has raised.*

:::note
This page is an index, not original content. Each link points to the chapter where the problem lives. For the strategic uncertainties, with credences, see [Cruxes](/start-here/key-questions/).
:::

## The five load-bearing problems

1. **Can trustworthy resolution be extended faster than adversaries learn to game it?**
   - Retrodiction, selection protocols and consistency floors all expand the resolvable set, and all can be gamed.
   - The program is workable if and only if this race is winnable ([Robust Reasoning Processes](/start-here/introduction/#the-central-uncertainty)).
2. **Is "cost per validated bit" well-defined across output types?** Probabilities, rulings, models and rankings need a common currency before the catalogue's comparisons count as measurements ([The Process Catalogue](/concepts/process-catalogue/#open-questions)).
3. **How much does consistency constrain correctness, especially under optimization pressure?** The observed correlation between consistency and accuracy comes from models that were not optimizing against the metric ([Consistency Evaluations](/proposals/consistency-evals/#open-questions)).
4. **Does composition multiply corruption costs, or merely add the weakest link?**
   - The constructive bet of the whole catalogue is cheap filters with randomized escalation to robust processes.
   - That bet is an unmeasured conjecture ([The Process Catalogue](/concepts/process-catalogue/#open-questions), [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/#open-questions), [Hardening: Overview](/concepts/hardening-techniques/#open-questions)).
5. **How fast does the corruption cost curve fall as attacker capability rises?** The corruption-capacity curve, per process, is among the most decision-relevant unmeasured quantities in AI oversight ([The Core Model](/concepts/core-model/#4-corruption-standard-shape)).

## Raised by the 2025–26 evidence

These questions come from the [State of the evidence](/concepts/what-is-a-strong-reasoner/#state-of-the-evidence-october-2026):

- **Does forecasting parity transfer?** AI forecasters now roughly match strong humans on binary questions that resolve within months. We do not know whether that predicts anything about long-horizon or unresolvable judgment, or how to find out without waiting.
- **What is the right baseline?**
  - On market questions, forecasters see the price. One analysis finds that, after correcting for multiple comparisons, no entry, AI or superforecaster, significantly beats simply submitting that price.
  - We do not know which baseline a judge should use when deciding how much weight a forecaster deserves.
- **Do audit channels survive optimization?**
  - Chain-of-thought monitoring works, and it degrades when it is trained against.
  - The same may hold for every legible channel these notes propose, including consistency checks, track records and trace logs.
- **Can automated research be audited from its traces?** AI-scientist failures are easier to catch from logs and code than from papers. It remains open who mandates the traces, and who reads them at scale ([Overseeing Automated Research](/proposals/overseeing-automated-research/#open-questions)).

## By chapter

- [Cruxes](/start-here/key-questions/) — strategic uncertainties with illustrative credences: scaffolding vs. base models, demand, differential safety, lock-in, CoT monitorability.
- [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/#open-questions) — consumer-agent adequacy, divergence measures for rich beliefs, efficient profundity, adversarial information, valuing question discovery.
- [Constructing Utility Functions](/concepts/constructing-utility-functions/#open-questions) — aggregating structural disagreement, weight drift and its auditors, required elicitation precision under optimization pressure.
- [Untrustworthy Sources](/concepts/untrustworthy-sources/#open-questions) — whether the deception conjunction is complete, when reproduction fails under correlated error, whether "deception affordance" is the right central object, whether form-level robustness generalizes, composed arguments, Goodhart dynamics once the map is public, and design-time advantage without credible commitment.
- [Interlude: The Funding Effect](/case-studies/the-funding-effect/#open-questions) — the size of the funding effect by conflict type, whether the drug-vs-nutrition gap is real, LLM replication of favorable/unfavorable coding, and result–conclusion concordance as an automatable spin signal.
- [The Process Catalogue](/concepts/process-catalogue/#open-questions) — the common currency problem, corruption-cost stability over time, intrinsic vs. infrastructure-artifact weaknesses.
- [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/#open-questions) — head-to-head empirics across groundings, retrodiction's contamination ceiling, collusion in peer prediction, who controls decomposition, cheap conservative routing out of the deception conjunction.
- [Consistency Evaluations](/proposals/consistency-evals/#open-questions) — consistency vs. correctness, the cost-per-bit portfolio of checks, attacker–defender equilibrium.
- [What Is a Strong Reasoner?](/concepts/what-is-a-strong-reasoner/#open-questions) — which properties are load-bearing, cross-domain trust transfer, track records across model versions, whether forecasting parity generalizes, keeping CoT monitorable.
- [Hardening: Overview](/concepts/hardening-techniques/#open-questions) — whether six families is the right cut, which compose multiplicatively, a single unifying inequality, the correlated-error row.
  - [Calibration](/concepts/hardening-calibration/#open-questions) — estimating tail calibration, defeating coherent ignorance, abstention exchange rates.
  - [Verifiability Asymmetry](/concepts/hardening-verifiability/#open-questions) — a PCP-analogue for estimates, who controls decomposition, how much research is verifiable at all, whether reasoning trained on verifiable rewards transfers to unchecked tasks.
  - [Independence & Decorrelation](/concepts/hardening-independence/#open-questions) — estimating $n_{\text{eff}}$, whether re-seeding decorrelates, decorrelated interrogation probes.
  - [Invariance & Low Sensitivity](/concepts/hardening-invariance/#open-questions) — efficiency vs. breakdown, nuisance vs. signal sensitivity, invariance against correlated error.
  - [Incentive-Compatibility](/concepts/hardening-incentives/#open-questions) — splitting surprise and validation payments, peer prediction among colluding LLMs, attacks relocating to resolution interpreters.
  - [Deterrence](/concepts/hardening-deterrence/#open-questions) — reachable enforceable penalty without identity infrastructure, minimal escrow layer, deterring judgment-proof adversaries.
- [Identity and Track-Record Infrastructure](/environment/identity-and-track-records/#open-questions) — the incumbency vs. cold-start exchange rate, track-record transfer across model versions, estimating effective independence from lineage, who runs the registries.
- [The Reliability Ladder](/concepts/epistemic-applications/#open-questions) — whether the tiers are real, what tier 5's minimal verification standard is, whether lower tiers can bootstrap upper ones.
- [Overseeing Automated Research](/proposals/overseeing-automated-research/#open-questions) — provable incentive guarantees, surprise vs. validation credit splits, valuing exploratory work, minimal meta-loop separation.
- [LLM Epistemics in Production](/case-studies/llm-epistemics-in-production/#open-questions) — net-positive false-positive rates, whether grounding predicts evaluator failure, fixing overconfidence at the system level.
