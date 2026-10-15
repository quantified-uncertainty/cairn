---
title: "Open Problems in Delegation Engineering"
description: "A worklist for delegation engineering applied to AI agent systems: the open problems whose first results would tell us whether the framework holds — a preflight prototype, replicated monitor and correlation measurements on agentic harm tasks, multi-tenant entanglement, and more."
---

[Delegation engineering](/getting-started/core-concepts/), designing and operating delegation structures to bound exposure while keeping capability, is a field name this site keeps using. A field name is only real if other people have work to do in it. This page lists that work.

Almost nothing here has been measured on AI agents. The framework's central mechanisms, [risk preflight](/delegation-risk/runtime-accounting/), [exposure envelopes](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) and the [entanglement tax](/delegation-risk/risk-propagation/), are design proposals with plausible lineage and no empirical track record in that setting. Each problem is phrased so that a first result would move the estimate one way or the other. Several could falsify load-bearing parts of the framework.

Each entry gives the question, why it matters, what a first result looks like, and a rough scale: weekend prototype, month project, or research programme.

---

## Tier 1: The cheapest credibility purchases

### 1. The preflight prototype

**Question.** Can you build a working [risk preflight](/delegation-risk/runtime-accounting/)? That is a pre-action hook in a real agent harness that estimates a proposed command's exposure against a running session budget before it commits. Modern coding agents expose pre-tool-call hook points.

**Why it matters.** Everything on [Runtime Accounting](/delegation-risk/runtime-accounting/) is currently a design. A hook with crude estimates, a real envelope (hard-coded file, spend and egress bounds) and a real [exposure ledger](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) would turn "here is what we would build" into "here is what we built, and where it broke".

**First result.** A hook that intercepts proposed tool calls, classifies each into a small harm-surface table, debits an estimated exposure against a session budget, and blocks or escalates on overdraw. It should measure at the boundary, meaning what the process actually touched, and never by asking the agent. A crude estimator counts, as long as the envelope and ledger are real.

**Scale.** Weekend prototype to month project.

### 2. Who preflights the preflight, on agentic harm

**Question.** Does a small, separate, trusted checker catch failures that a frontier sibling of the actor misses, on the kinds of harmful actions agents actually take?

**What is already known.** First results exist for code and for monitoring. In AI Control, a GPT-3.5 monitor ranked every GPT-4 backdoor at or above median suspiciousness, but at a 2% false-positive rate it missed many of them (Greenblatt et al. 2023, [arXiv:2312.06942](https://arxiv.org/abs/2312.06942)). A weaker model, GPT-4o, reading o3-mini's chain of thought caught reward hacking far more effectively than monitoring actions alone (Baker et al. 2025, [arXiv:2503.11926](https://arxiv.org/abs/2503.11926)). Factoring tasks for a weak monitor raised safety from 41% to 63% in APPS (Sandoval & Rushing 2025, [arXiv:2512.02157](https://arxiv.org/abs/2512.02157)). Against monitors that the attacker can target with prompt injection, monitoring failed (Terekhov et al. 2025, [arXiv:2510.09462](https://arxiv.org/abs/2510.09462)). [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/) has the details.

**The open part.** None of these compares a frontier sibling judge with a narrow, separately trained one on agentic harm: file deletion, credential use, exfiltration, spend. None reports the overlap of their misses on the phi scale the [entanglement tax](/delegation-risk/risk-propagation/) needs.

**First result.** On a challenge set of agent actions with known harm labels, the detection rates of (a) a frontier sibling of the actor and (b) a narrow or older-family judge. Report the fraction caught by (b) and missed by (a), and φ between their miss indicators. Repeat under an adaptive red team. If (a) does as well as (b), the [verifiability-hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) rule for preflights loses its teeth.

**Scale.** Month project.

### 3. Measured correlation priors on the phi scale

**Question.** What is the pairwise failure correlation φ between real model pairs, same provider, cross-provider and cross-paradigm, on harm-detection tasks?

**What is already known.** Goel et al. (2025, [arXiv:2502.04313](https://arxiv.org/abs/2502.04313)) find model mistakes becoming more similar as capability rises. Kim et al. (2025, [arXiv:2506.07962](https://arxiv.org/abs/2506.07962)) find, across 350+ models, that two models agree 60% of the time when both err on one leaderboard dataset. Larger, more accurate models have highly correlated errors even across providers.

**The open part.** Those are similarity and agreement statistics on benchmarks, not φ on harm detection. The site's tax figures, about 11×, 21× and 50× at ρ = 0.1, 0.2 and 0.5, rest on assumed ρ ([Risk Propagation](/delegation-risk/risk-propagation/)).

**First result.** A small table of measured φ for a handful of judge pairs on a shared agentic-harm challenge set, bucketed by relationship, with the method documented well enough to reproduce. Even three pairs would replace an assumption with a measurement. The adversarial case needs a separate measurement, under attack.

**Scale.** Month project to research programme.

---

## Tier 2: Naming and measuring failure modes

### 4. Multi-tenant entanglement

**Question.** What are the failure modes of agents that share memory stores, MCP servers and tool caches, and how do you measure them?

**Why it matters.** Single-channel attacks are documented: poisoning an agent's memory or knowledge base (AgentPoison, [arXiv:2407.12784](https://arxiv.org/abs/2407.12784); MINJA, [arXiv:2503.03704](https://arxiv.org/abs/2503.03704)) and instructions hidden in MCP tool descriptions ([Invariant Labs, April 2025](https://invariantlabs.ai/blog/mcp-security-notification)). What is not characterised is the common-cause effect: two nominally independent agents failing together because they share the poisoned resource. That is the [entanglement](/entanglements/) problem in its 2026 form.

**First result.** A taxonomy of multi-tenant coupling channels with at least one demonstrated joint failure through a shared dependency, and an estimate of how much it raises joint failure over the independent baseline.

**Scale.** Month project.

### 5. Rubber-stamp rate measurement

**Question.** In a real approval flow, what fraction of human approvals are issued faster than the minimum time to read what is being approved (the [rubber-stamp rate](/entanglements/cross-domain/psychology-of-oversight/)), and which interventions move it?

**Why it matters.** The framework leans on the claim that unbudgeted human review degrades into approval theater. The claim is borrowed and plausible, but unmeasured in agent oversight. If the rate stays low under load, the case for preflight as an attention router weakens.

**First result.** Log approval latency against a minimum-reading-time floor, report the rate, then test one or two interventions (session-length limits, deliberate friction) and report effect sizes.

**Scale.** Weekend prototype to month project.

---

## Tier 3: Protocol and metric design

### 6. Reconciliation protocol design

**Question.** What does it mean, concretely, to [reconcile](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) an exposure ledger against incidents and near-misses?

**Why it matters.** A ledger without reconciliation is fake precision with bookkeeping aesthetics. The answer to "aren't these numbers made up?" is that they get reconciled against reality, so the procedure has to exist. Actuarial loss development, how insurers update estimates as claims mature, is the obvious source. Reconciliation can only calibrate harm modes frequent enough to observe. Rare catastrophic modes need the envelope instead (see the rule of three in [Formal Verification Limits](/research/technical-safety/formal-verification-limits/)).

**First result.** A written protocol, covering what counts as an incident or a near-miss and how observed outcomes update prior estimates, with a triangle-style worked example over a few periods.

**Scale.** Month project.

### 7. The insurance question, scoped

**Question.** Does liability transfer change outcomes when the agent never sees the premium?

**Why it matters.** Standard moral-hazard analysis assumes the risk-taker internalises the premium. An AI agent does not. Whether insurance still improves outcomes when the cost signal stops at the principal decides whether insurance-based proposals are coherent.

**First result.** A formal model, or a clean argument, for when insurance carried by the principal changes the agent's behaviour, and under what added structure: deductibles routed back as constraints, or experience-rated privileges.

**Scale.** Month project.

### 8. A capability–risk frontier

**Question.** How should architectures be compared on capability and delegation risk together?

**Why it matters.** Ratios of capability to expected loss have broken units: a design with near-zero estimated risk gets an unbounded score from an assumption. The honest object may be a frontier, capability plotted against delegation risk, on which designs are dominated or not, with no scalar.

**First result.** Two or three real architectures for one task, each with measured task success and a delegation-risk estimate with its uncertainty. Show which are dominated and whether the ranking survives the uncertainty.

**Scale.** Month project.

---

## Other open questions

These are open and not covered by an existing page. Several feed the problems above.

- **Coordinator redundancy.** Build diverse coordinators (rule-based, narrow fine-tune, older frontier model), red-team each, and compare agreement and failure modes. *Feeds problem 2.*
- **Narrow versus general models.** How much more predictable and auditable are narrow fine-tuned models on a fixed task than frontier models prompted for it?
- **Self-prediction.** Can a model forecast its own behaviour after modification, and how does calibration degrade with horizon?
- **Uncertainty propagation.** Distributions, not point estimates, through the accounting. *Feeds problems 3 and 6.*
- **Bounding unknown capabilities.** How to size a harm surface when elicitation may be incomplete; see the sandbagging results in [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/).
- **Handoffs.** What context is sufficient when work passes between a human and an agent, and how to check it.
- **Agency and power.** Behavioural measures of goal-directedness in deployed agent systems, and whether they predict defection ([Power Dynamics](/power-dynamics/)).
- **Regulation and certification.** What maximum delegation risk, if any, regulators could set by application category, and what disclosure would make it checkable.

**Answered.** *Does temperature 0 suppress steganographic signalling?* No. A deterministic policy can encode information in which output it produces, and served models are not deterministic at temperature 0 anyway ([Steganography](/research/technical-safety/steganography-detection-prevention/)).

---

## How to contribute

A result, even a negative one or a crude prototype that broke instructively, is worth more to this framework than another page of prose. Negative results that falsify a load-bearing claim are worth the most.

The framework lives at **[github.com/quantified-uncertainty/delegation-risk-framework](https://github.com/quantified-uncertainty/delegation-risk-framework)**. Open an issue to propose a problem, claim one, or share a result. If you build the [preflight prototype](#1-the-preflight-prototype), please report where the estimates broke down.

## See also

- [Runtime Risk Accounting](/delegation-risk/runtime-accounting/): the mechanism Tier 1 would build and test
- [Risk Propagation](/delegation-risk/risk-propagation/): the φ recipe and the tax table problems 2 and 3 would ground
- [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/): the first results problem 2 builds on
- [Psychology of Oversight](/entanglements/cross-domain/psychology-of-oversight/): the approval-theater claim problem 5 would test
