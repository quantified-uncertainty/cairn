---
title: "Concepts"
description: "Reference statement of the framework's core concepts: the delegation risk formula, harm channels, propagation, the verifiability tiers, the Least-X core, tail risk, and the minimal delegation-engineering layer."
---

A reference page. For the argument in order, read the [Five-Minute Intro](/getting-started/five-minute-intro/) and then [the Core Path](/getting-started/reading-order/#the-core-path).

## The formula

**Delegation Risk = Σ P(harm mode) × Damage(harm mode)**

For each way a delegation can go wrong (a *harm mode*), multiply the probability that it happens by the damage if it does, and sum over all harm modes. The result is an expected loss in dollars.

:::note[Canonical definition]
This anchor is the canonical statement of the formula. Other pages restate it for convenience.
:::

**Units.** State what the probabilities are per: per task, per action, or per period. The delegation risk carries the same unit. Convert between them by multiplying a per-task figure by tasks per period. Most pages on this site use dollars per month.

*Example (illustrative): an employee with check-writing authority, probabilities per year.*

| Harm mode | Probability | Damage | Contribution |
|-----------|-------------|--------|--------------|
| Clerical error | 0.01 | \$1,000 | \$10 |
| Unauthorized payment | 0.001 | \$50,000 | \$50 |
| Fraud | 0.0001 | \$500,000 | \$50 |

Delegation risk is \$110/year. This is the average loss over many such years, not a prediction for any one year; see [when expected loss is the wrong metric](#when-expected-loss-is-the-wrong-metric).

The three-tier vocabulary keeps the formula's inputs separate. The **harm surface** is the set of harm modes (you enumerate it). **Exposure** is the worst-case loss across it given what the delegate can reach (a bound). **Delegation risk** is the expectation. See the [Glossary](/getting-started/glossary/#exposure).

## Harm channels

Harm modes fall into [three channels](/delegation-risk/risk-decomposition/):

- **Accident**: the delegate fails at its task (bugs, hallucinations, edge cases).
- **Defection**: the delegate pursues something other than the principal's interest. Scheming is the strategic case; reward hacking, which is goal-directed but not scheming, is a sub-type.
- **Hijack**: a third party or user steers a delegate that is not itself scheming, for example through prompt injection in a document or tool output, or through misuse.

The channels call for different mitigations. Testing and redundancy address accidents. Control protocols and monitoring address defection. Separating instructions from untrusted data, and keeping a hard envelope, address hijack.

## Propagation

When delegates delegate, reliabilities compose. Quantitative "trust" on this site means one thing: **t = P(the delegate executes the task faithfully)**, estimated from its harm-mode table. If A delegates to B with t = 0.8 and B to C with t = 0.7, the chain works with probability 0.8 × 0.7 = 0.56 when the links fail independently.

Correlation changes the two directions of composition differently:

- **Serial chains** (every link must work): correlation helps, because failures bunch together. The plain product is conservative and safe to use.
- **Parallel checks** (a harmful action gets through only if every check misses): correlation hurts. Use the beta-factor mixture P(all miss) = (1−ρ)·∏pᵢ + ρ·min(pᵢ), with ρ on the failure-indicator (phi) scale. With three checks each missing 10%, the residual is 1 + 99ρ times the independence figure.

[Risk Propagation](/delegation-risk/risk-propagation/) has the derivation, the simulation and the estimation recipe. The alternative rules that earlier versions offered are retired.

**Roll-ups add.** The expected loss of a system is the sum of its components' expected losses, whatever the correlation, by linearity of expectation. Where harm modes overlap on one asset, the naive sum overstates the true figure, so it is a conservative upper bound. Correlation matters for tail metrics and for AND-structured defenses, not for expected-loss totals.

## Decomposition and the Least-X core

A single delegate with broad capability, context and access concentrates risk: its worst case is the whole system's worst case. Decomposition splits a task across narrow components so that each one's exposure is bounded. It does not stop correlated components from failing together, and it does not stop instances of one model from coordinating through shared reasoning. That is the subject of [Entanglements](/entanglements/).

The six core [Least-X principles](/design-patterns/least-x-principles/) generalize least privilege:

- **Least Intelligence**: the least capable implementation that does the task.
- **Least Privilege**: minimum permissions and access rights.
- **Least Context**: minimum information about the wider system.
- **Least Persistence**: minimum state carried across invocations.
- **Least Autonomy**: minimum ability to act without review.
- **Least Connectivity**: minimum communication paths between components.

The canonical page lists further principles as a labelled tail.

## Verifiability hierarchy

Implementations differ in how thoroughly you can check them. From most to least verifiable:

1. **Formally verified code.** Proven against a specification. Examples: access-control checks, rate limiters.
2. **Deterministic tested code and rule-based checks.** Auditable and repeatable. Examples: routing, schema validation, allow-lists.
3. **Narrow learned models with measured error on a fixed task.** Examples: a classifier with a known false-negative rate on a held-out set.
4. **Trusted LLMs**, below the capability level at which scheming is a live concern. This is AI Control's "trusted model" ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)).
5. **Untrusted frontier models and agents.**

Use the most verifiable tier that can do the job. A check should sit at a lower tier than the component it checks; a frontier model checking a sibling of itself shares its blind spots. Training method does not define a tier: nearly all deployed frontier models are RL post-trained, and what matters is what you can verify about the deployed system.

## When expected loss is the wrong metric

An expected-loss budget treats a 10⁻⁶ chance of losing \$1 billion the same as a certain loss of \$1,000. A principal who could not survive the first is not indifferent between them. Use something else when:

- **The tail matters.** Budget a tail measure such as [Expected Shortfall](/getting-started/glossary/#expected-shortfall), the mean loss in the worst α fraction of periods. This needs loss distributions, not point estimates, and it is where correlation between components enters.
- **A single action can be catastrophic.** Put a hard cap on exposure instead of a budget on expectation. The [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) exists because a single concentrated failure must hit a wall, not slowly overdraw an account.
- **The harm is irreversible or not denominated in money.** Treat it as a constraint (this mode must be outside the envelope, or below a stated probability), not as a line in a dollar budget.

## The minimal delegation-engineering layer

If you build nothing else, build these four:

1. **Write down the harm surface.** For each component, record what it can reach and how it can fail, in each of the three channels.
2. **Put a hard envelope around it.** File scope, tool permissions, egress allow-lists and spend caps, enforced by the harness, not by the model or its prompt.
3. **Set a correlation budget.** No two checks on the same action share a model family, and at least one check sits at tier 1 or 2 of the hierarchy.
4. **Keep a ledger and reconcile it monthly.** Log consequential actions with their preflight estimates, compare against incidents and near misses, and revise the estimates.

Ordinary security hygiene sits underneath: least privilege, sandboxing, audit logs and human approval above a threshold. It is necessary, but it is not what this framework adds. [For Engineers](/getting-started/for-engineers/) maps the layer onto current agent harnesses.

## What this framework is not

- **Not an alignment solution.** It assumes components may be misaligned and tries to bound the damage.
- **Not formal verification.** Its guarantees are probabilistic, except where an envelope is enforced mechanically.
- **Not validated.** Most numbers on this site are illustrative, and the framework is untested on deployed AI systems.

## See also

- [Glossary](/getting-started/glossary/) and [Quick Reference](/getting-started/quick-reference/)
- [Delegation Risk](/delegation-risk/): the section this page summarizes
- [Runtime Accounting](/delegation-risk/runtime-accounting/): preflight, envelope and ledger
