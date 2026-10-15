---
title: "Glossary"
description: "Key terms used throughout the framework, organized by domain, with framework-specific definitions."
---

Definitions as this site uses them. Borrowed terms keep their home field's meaning; where this site's usage is narrower, the entry says so.

**Units convention.** A probability on this site is always *per* something: per task, per action, or per period. A delegation risk carries the same unit. Most pages use dollars per month; worked examples state their unit at the top.

## Core framework terms

<span id="harm-mode"></span>
**Harm mode**: a specific way a delegation could cause damage, with a probability and a damage value. It parallels the *failure mode* of [FMEA](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis). *Example*: "leaks proprietary data", P = 0.001 per month, damage \$50,000.

<span id="harm-surface"></span>
**Harm surface**: the *set* of a delegation's harm modes, the delegation analogue of an [attack surface](https://en.wikipedia.org/wiki/Attack_surface). It is a set, not a number. You enumerate it, bound it (exposure) and price it (delegation risk).

<span id="exposure"></span>
**Exposure**: the worst-case loss across the harm surface, given the delegate's actual access and capability. It is a dollar bound, not an expectation, and it depends on capability: the same office key carries more exposure for a delegate who can exploit what it opens. Lineage: [exposure-at-default](https://en.wikipedia.org/wiki/Exposure_at_default) in finance. *Gross* exposure is measured before controls, *net* exposure after.

<span id="delegation-risk"></span>
**Delegation risk**: the expected loss of a delegation, Σ P(harm mode) × Damage(harm mode), in dollars per the stated unit ([canonical statement](/getting-started/core-concepts/#the-formula)). *Residual risk* is delegation risk after controls. A *delegation risk budget* is the maximum a system or component may carry.

<span id="harm-channels"></span>
**Harm channels**: the three ways harm arises ([Risk Decomposition](/delegation-risk/risk-decomposition/)).
- <span id="accident"></span>**Accident**: the delegate fails at its task (bugs, hallucinations, edge cases, capability limits). P(error per action) often falls as capability rises, but not reliably: inverse-scaling results exist. A more capable delegate is also given more consequential actions, so damage per accident tends to rise. Do not assume accident risk falls with capability.
- <span id="defection"></span>**Defection**: the delegate pursues something other than the principal's interest. Scheming is the strategic case. **Reward hacking**, in which the delegate exploits a flaw in its objective (special-casing tests, editing a grader) without strategic deception, is a non-scheming sub-type. Capability raises both the chance that defection succeeds and the damage it can do.
- <span id="hijack"></span>**Hijack**: a third party or user steers a delegate that is not itself scheming. Examples are prompt injection through a document, web page or tool output, and direct misuse. The attacker chooses the input, so treat correlated checks as fully correlated (ρ near 1).

<span id="propagation-rule"></span>
**Propagation rule**: how reliabilities compose. Under independence, chains and parallel stacks multiply. For common-cause correlation, use the beta-factor mixture P(all fail) = (1−ρ)·∏pᵢ + ρ·min(pᵢ). The minimum rule is its ρ = 1 limit. The harmonic and discounted rules are retired. See [Risk Propagation](/delegation-risk/risk-propagation/).

<span id="trust"></span>
**Trust (quantitative)**: where a number is attached, t = P(the delegate executes the task faithfully), estimated from its harm-mode table. Unquantified, "trust" is ordinary English. *Risk inheritance*: when A delegates to B and B to C, A carries C's harm modes, composed by the propagation rule.

<span id="entanglement-tax"></span>
**Entanglement tax**: actual joint failure probability divided by what independence predicts, P(all fail) / ∏pᵢ. For n identical layers with miss rate p, it is (1−ρ) + ρ·p^(1−n). For three layers at p = 0.1 that is 1 + 99ρ: about 11×, 21× and 50× at ρ = 0.1, 0.2 and 0.5. This is benign-failure math; ρ for same-provider stacks is assumed, not measured. See [Formal Definitions](/entanglements/fundamentals/formal-definitions/).

<span id="correlation-budget"></span>
**Correlation budget**: a limit on failure correlation within a defense stack, such as "no two checks share a model family". It complements the risk budget. ρ is on the failure-indicator (phi) scale.

<span id="load-bearing-channels"></span>
**Load-bearing channels**: the sanctioned communication paths between delegates that decomposition could not remove. Monitoring budget should concentrate there.

<span id="privilege-overhang"></span>
**Privilege overhang**: the gap between what a delegate *can* do and what its task *needs*. It is the stock; *privilege creep* is the flow that grows it. Cloud-security tools measure the same quantity as *unused entitlements*. Microsoft's *2024 State of Multicloud Security Risk Report* found that identities used about 2% of the permissions granted to them in 2023.

<span id="risk-preflight"></span>
**Risk preflight**: a damage estimate the scaffold runs before an agent action commits. It enumerates the action's harm surface, bounds the exposure, compares the result with the budget, then proceeds, adjusts or escalates. Lineage: [CORS preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) and aviation flight-risk assessment. The estimator must sit at a more verifiable (lower-numbered) tier of the [verifiability hierarchy](#verifiability-hierarchy) than the actor it checks. See [Runtime Accounting](/delegation-risk/runtime-accounting/).

<span id="exposure-envelope"></span>
**Exposure envelope**: the region of action-space in which an agent may act freely, enforced by the scaffold regardless of the agent's inputs or intent. It is a hard bound, not a statistical one: a single catastrophic action must hit the wall, not merely overdraw a budget. Lineage: Airbus flight-envelope protection.

<span id="exposure-ledger"></span>
**Exposure ledger**: the running account per delegate. Actions debit it; completed verifications and de-provisioning credit it. It comes with two disciplines. **Reconciliation** periodically compares the ledger's estimates with observed incidents and near misses. **Consolidation** rolls up a subagent tree. Expected-loss roll-ups simply add. Where several harm modes hit the same asset, the naive sum overstates the true loss, so it is a conservative upper bound. Correlation matters only for tail metrics and for AND-structured defenses.

<span id="principal"></span>
**Principal, delegate, executor, coordinator**: the *principal* delegates, and is ultimately a human or an organization. A *delegate* receives a task (*agent* stresses goal-directedness, *component* architecture). An *executor* performs actions. A <span id="coordinator"></span>*coordinator* routes tasks, grants permissions or aggregates results. Coordinators often concentrate risk because of that leverage, but whether one is the riskiest component depends on the system.

<span id="delegation-engineering"></span>
**Delegation engineering**: designing, measuring and operating delegation structures to bound exposure while preserving capability, here mainly for AI agents.

## Least-X principles

The core six, from the [canonical page](/design-patterns/least-x-principles/):

- <span id="least-intelligence"></span>**Least Intelligence**: the least capable implementation that does the task.
- <span id="least-privilege"></span>**[Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)**: minimum permissions and access rights.
- <span id="least-context"></span>**Least Context**: minimum information about the wider system.
- <span id="least-persistence"></span>**Least Persistence**: minimum state across invocations, including memory stores, caches and logs the delegate can read.
- <span id="least-autonomy"></span>**Least Autonomy**: minimum ability to act without review.
- <span id="least-connectivity"></span>**Least Connectivity**: minimum communication paths between components.

The canonical page lists further principles as a labelled tail. Two need care. Predictability is worth seeking, but temperature 0 neither guarantees deterministic output from served LLMs nor prevents a deterministic policy from encoding covert signals. Hiding from a component whether it is being tested is hard to enforce: current models often recognize evaluations (Schoen et al. 2025, [arXiv:2509.15541](https://arxiv.org/abs/2509.15541)).

## Architecture terms

<span id="verifiability-hierarchy"></span>
**Verifiability hierarchy**: implementations ordered by how thoroughly they can be checked. The tiers are (1) formally verified code; (2) deterministic tested code and rule-based checks; (3) narrow learned models with measured error on a fixed task; (4) trusted LLMs, below the capability at which scheming is a live concern; and (5) untrusted frontier models and agents. Training method does not set the tier. See [Concepts](/getting-started/core-concepts/#verifiability-hierarchy).

<span id="decomposed-coordination"></span>
**Decomposed coordination**: splitting coordination across several limited components rather than one powerful coordinator. See [Coordinator Constraints](/design-patterns/coordinator-constraints/).

<span id="byzantine-fault-tolerance"></span>
**[Byzantine fault tolerance](https://en.wikipedia.org/wiki/Byzantine_fault)**: correct operation despite up to f arbitrarily faulty components, which requires at least 3f + 1 replicas. The bound counts faulty replicas; replicas that share a model can exceed f together.

<span id="n-version-programming"></span>
**[N-version programming](https://en.wikipedia.org/wiki/N-version_programming)**: independently developed implementations of one specification, used redundantly. Knight & Leveson (1986) found that such versions failed together more often than independence predicts.

## AI safety terms

<span id="ai-control"></span>
**[AI Control](https://arxiv.org/abs/2312.06942)**: designing protocols that stay safe even if the model is intentionally trying to subvert them, and testing them with control evaluations (Greenblatt et al. 2023). Its vocabulary (trusted and untrusted model, control protocol, auditing budget, usefulness cost) is used here as Redwood Research uses it.

<span id="scheming"></span>
**Scheming**: an AI system covertly pursuing goals other than its operators', including by deceiving them.

<span id="instrumental-convergence"></span>
**[Instrumental convergence](https://en.wikipedia.org/wiki/Instrumental_convergence)**: the tendency of diverse goals to produce similar sub-goals, such as self-preservation and resource acquisition.

<span id="cais"></span>
**CAIS (Comprehensive AI Services)**: Drexler's proposal to build general capability as a system of bounded services rather than unified agents ([report](https://www.futureofhumanityinstitute.org/s/2019-1.pdf)). Related: [tool AI vs. agent AI](https://gwern.net/tool-ai).

<span id="scalable-oversight"></span>
**Scalable oversight**: methods for overseeing systems that are more capable than their overseers in the relevant domain.

## Risk measurement terms

<span id="euler-allocation"></span>
**Euler allocation**: splitting a portfolio risk measure R among positions as RCᵢ = xᵢ·∂R/∂xᵢ. For risk measures that are homogeneous of degree one, the contributions sum exactly to R.

<span id="var"></span>
**[Value at Risk (VaR)](https://en.wikipedia.org/wiki/Value_at_risk)**: the loss level exceeded with probability 1 − α over a period (for example, the 95% VaR is exceeded 5% of the time). It says nothing about how large losses beyond it are.

<span id="expected-shortfall"></span>
**[Expected Shortfall (ES)](https://en.wikipedia.org/wiki/Expected_shortfall)**: the mean loss in the worst 1 − α of outcomes. It is a coherent risk measure, unlike VaR, and it is the tail metric to use when expected loss is not enough.

<span id="pra"></span>
**[Probabilistic risk assessment (PRA)](https://en.wikipedia.org/wiki/Probabilistic_risk_assessment)**: quantifying risk through [fault trees](https://en.wikipedia.org/wiki/Fault_tree_analysis) (AND and OR gates over component failures) and event trees, as practiced in nuclear and aerospace engineering. <span id="cdf"></span>*Core damage frequency* is its headline output for reactors; the US NRC's subsidiary safety goal is 10⁻⁴ per reactor-year. PRA figures are model outputs, not observed rates.

<span id="common-cause-failure"></span>
**Common-cause failure**: a single cause that makes several redundant components fail together. The beta-factor model, documented in NUREG/CR-4780, is the source of this site's propagation correction.

<span id="defense-in-depth"></span>
**[Defense in depth](https://en.wikipedia.org/wiki/Defence_in_depth)**: multiple barriers against failure. The arithmetic usually assumes the barriers fail independently, and they rarely do.

<span id="sil"></span>
**[SIL](https://en.wikipedia.org/wiki/Safety_integrity_level) / [ASIL](https://en.wikipedia.org/wiki/Automotive_Safety_Integrity_Level)**: safety integrity levels under IEC 61508 (SIL 1–4) and ISO 26262 (ASIL A–D). Higher levels require lower failure rates and more rigorous development.

## Mechanism design terms

- <span id="incentive-compatibility"></span>**[Incentive compatibility](https://en.wikipedia.org/wiki/Incentive_compatibility)**: truthful reporting is each participant's best strategy.
- <span id="revelation-principle"></span>**[Revelation principle](https://en.wikipedia.org/wiki/Revelation_principle)**: any outcome some mechanism implements in equilibrium can be implemented by a direct mechanism in which truth-telling is optimal.
- <span id="moral-hazard"></span>**[Moral hazard](https://en.wikipedia.org/wiki/Moral_hazard)**: a party changes behavior after an agreement because its actions are not fully observable (hidden action).
- <span id="adverse-selection"></span>**[Adverse selection](https://en.wikipedia.org/wiki/Adverse_selection)**: parties with unobservable characteristics self-select in ways that harm the other side (hidden information).

## Notation

| Symbol | Meaning |
|--------|---------|
| DR | Delegation risk (expected loss, dollars per stated unit) |
| HS | Harm surface (set of harm modes) |
| P(·), D(·) | Probability and damage of a harm mode |
| t | P(faithful execution) for one delegation link |
| pᵢ | Miss probability of check *i* |
| ρ | Common-cause weight in the beta-factor mixture; equals the phi coefficient of failure indicators for equal pᵢ |
| ES_α | Expected Shortfall at level α |
| HHI | [Herfindahl-Hirschman Index](https://en.wikipedia.org/wiki/Herfindahl%E2%80%93Hirschman_index), a concentration measure |

## See also

- [Concepts](/getting-started/core-concepts/) and [Quick Reference](/getting-started/quick-reference/)
- [Bibliography](/reference/bibliography/)
