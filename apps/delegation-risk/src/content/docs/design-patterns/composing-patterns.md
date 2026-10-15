---
title: "Composing Patterns"
description: "How to combine patterns into an architecture: layer by harm channel, budget for correlation between layers, match stringency to exposure, and how the two worked examples apply the principles."
sidebar:
  order: 3
---

A single pattern rarely bounds a system's risk. Each covers some harm modes and leaves others:

| Pattern alone | Covers | Leaves |
|---|---|---|
| Human review | Errors a reader can see | Volume, fatigue, subtle or deliberately hidden changes |
| Model-based checker | Scale, speed | Blind spots shared with the model it checks |
| Sandbox or envelope | Damage from any single action | Bad outputs that stay inside the envelope |
| Rate and spend limits | Runaway loops | Quality of what does run |

Composition is choosing patterns whose gaps do not line up.

## Principles

### Layer by channel

Harm arrives through three [channels](/delegation-risk/risk-decomposition/), accident, defection (including reward hacking) and hijack, and they need different layers. Tests and redundancy address accidents. Defection needs checks the delegate cannot predict or influence: a [Trusted Monitor](/design-patterns/monitoring/#trusted-monitor), [Random Audit](/design-patterns/monitoring/#random-audit) and control evaluations. Hijack needs untrusted content kept apart from private data and from outbound channels. Across all three, a hard [exposure envelope](/design-patterns/structural/#exposure-envelope-gateway) bounds what any single action can do, whatever went wrong upstream. A stack is complete when every row of the harm table has at least one layer aimed at its channel and the envelope sits behind all of them.

### Budget for correlation

Layers that share a model family, a prompt, a provider or a blind spot fail together. If layer i misses with probability $p_i$ and the layers share a common cause with weight ρ (the phi scale), the beta-factor model gives

$$P(\text{all miss}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i .$$

For three layers that each miss 10%, independence gives 0.001. At ρ = 0.1, 0.2 and 0.5 the figure is about 0.011, 0.021 and 0.051, an [entanglement tax](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax) of roughly 11×, 21× and 50×. These ρ values are illustrative. [Measuring Entanglement](/entanglements/detection/correlation-calculator/#what-the-evidence-supports) puts φ between the benchmark misses of strong LLMs from different providers at about 0.5, as an upper estimate. Against an adaptive attacker, assume ρ → 1: the stack is worth its best layer.

Diversity is the lever. One model family writing the code, reviewing it and writing its tests is one check, not three. Better: tests the model cannot see or edit, static analysis and a policy check at tiers 1–2, a reviewer model from a different provider, and a human sample. Different providers are necessary but not sufficient. Larger, more accurate models have highly correlated errors even across providers ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)). A test suite, a static analyzer and a model buy more independence than three models. Write the rule down as a correlation budget: no two checks on the same action share a model family, and at least one sits at tier 1 or 2.

### Match stringency to exposure

| Exposure of the action | Stack |
|---|---|
| Low, reversible | Envelope, output validation, logging |
| Moderate | Add a model-based check and rate limits |
| High | Add human review (sampled or on flag) and checkpoints before side effects |
| Severe or irreversible | Add mandatory human approval, two-person rules, a time lock and tier 1–2 checks on the critical path |

Choose the stack per action, not per agent ([Escalation Ladder](/design-patterns/structural/#escalation-ladder)).

### Degrade gracefully, without counting on it

It is tempting to describe a stack as a chain of fallbacks: the filter misses, the verifier catches it; the verifier misses, the human catches it. That reasoning assumes each layer's misses are independent of the others'. They are not. The output that fools a model-based filter is often the one that fools a model-based verifier, and a reviewer who sees the verifier's approval may defer to it. In the defection and hijack channels the attacker picks the input that beats every layer at once.

So name the backstop whose protection does not depend on detection: the envelope, which blocks an action whatever its inputs or intent, and [Checkpoint-Rollback](/design-patterns/recovery/#checkpoint-rollback), which undoes what got through. Estimate the other layers' joint miss rate with correlation, not as a product. When layers do fail, [Graceful Degradation](/design-patterns/recovery/#graceful-degradation) should fall back to less capability, not less checking.

## Anti-patterns

The common failures are a single layer (one bypass defeats everything), several checkers on one model family counted as independent, checks never tested against adversarial inputs, and maximum checking everywhere, which latency and approval fatigue push operators to switch off.

## The principles in the two examples

The [coding agent](/design-patterns/examples/code-deployment-example/) and the [research assistant](/design-patterns/examples/research-assistant-example/) apply the same principles to different problems.

The rows are the six core [Least-X principles](/design-patterns/least-x-principles/).

| Principle | Research assistant | Coding agent |
|---|---|---|
| Least Intelligence | A capable planner, checked by code and a trusted monitor | Orchestrator and gates are tested code; only the agent is a frontier model |
| Least Privilege | No experiments; no outbound data except search queries | Pushes to a branch; cannot merge, deploy or reach production credentials |
| Least Context | Summarizer sees one paper; raw papers and private notes never share a context | Canary sees metrics only; monitor sees one diff and its log |
| Least Persistence | No memory between projects beyond a curated bibliography | Fresh container per session |
| Least Autonomy | Scientist approves direction and any change to it | Human approves every merge; two people and a time lock for high-exposure paths |
| Least Connectivity | Results flow forward; nothing messages the planner | Output reaches the pipeline only as a pull request |

The coordination choice differs for a reason. The research assistant needs a model to decide what to investigate, so its planner is capable, and its plan becomes a checked, approved artifact. The deployment pipeline's logic is fully specifiable, so it is code. Use model coordination where the decision needs judgment and its errors are recoverable. Use code where the logic can be written as rules or the outcome is hard to reverse.

## Designing a stack

1. **List the harm surface.** Harm modes per component, each tagged with a channel, with the unit and volume of every probability.
2. **Draw the envelope first**, enforced outside the model.
3. **Assign at least one layer per harm mode**, aimed at its channel.
4. **Check correlation.** Note shared models, providers, prompts and inputs; estimate ρ or assume it high. Count defection and hijack stacks as their best layer.
5. **Plan for failure**: what happens when each layer misses, and whether rollback is possible.
6. **Price it** in latency, cost and reviewer time. A stack that operators disable under load is not a stack.
7. **Reconcile** predictions against incidents in the [exposure ledger](/delegation-risk/runtime-accounting/#3-the-exposure-ledger).

## See also

- [Design Patterns](/design-patterns/): the catalog
- [Least-X Principles](/design-patterns/least-x-principles/): the core six and the verifiability tiers
- [Coordinator Constraints](/design-patterns/coordinator-constraints/): constraining the component with the most leverage
- [Risk Propagation](/delegation-risk/risk-propagation/): the correlation correction in full
