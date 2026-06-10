---
title: "Open Problems in Delegation Engineering"
description: "A worklist for delegation engineering applied to AI agent systems: the open problems whose first results would tell us whether the framework is real — preflight prototypes, measured correlation priors, multi-tenant entanglement, and more."
---

[Delegation engineering](/getting-started/core-concepts/) — designing and operating delegation structures to bound exposure while preserving capability — is a field name this site keeps using. A field name is only real if other people have work to do in it. This page is that work: a list of open problems, each one an invitation rather than a claim.

Be clear about the epistemic status. Almost nothing here has been measured. The framework's central mechanisms — [risk preflight](/delegation-risk/runtime-accounting/), [exposure envelopes](/delegation-risk/runtime-accounting/#2-the-exposure-envelope), the [entanglement tax](/entanglements/) — are design proposals with plausible lineage and no empirical track record on AI agents. Each problem below is phrased so that a *first result* would move the needle one way or the other. Several of them could falsify load-bearing parts of the framework, which is the point: a research program you cannot lose from is not a research program.

Each entry gives the **question**, **why it matters**, **what a first result looks like**, and a rough **scale** — weekend prototype, month project, or research program.

---

## Tier 1: The cheapest credibility purchases

These are the problems whose results are most decision-relevant per hour spent. If you do one thing, do one of these.

### 1. The preflight prototype

**Question.** Can you build a working [risk preflight](/delegation-risk/runtime-accounting/) — a pre-action hook in a real agent harness (modern coding agents expose pre-tool-call hook points) that, before a proposed command commits, estimates its exposure against a running session budget?

**Why it matters.** Everything on [Runtime Accounting](/delegation-risk/runtime-accounting/) is currently a design diagram. A preflight hook with crude estimates, a real [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) (hard-coded file/spend/egress bounds), and a real [exposure ledger](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) is the single cheapest purchase of credibility for the whole framework. It converts "here is what we would build" into "here is what we built, here is where it broke."

**First result.** A hook that intercepts proposed tool calls, classifies each into a small harm-surface table, debits an estimated dollar exposure against a session budget, and blocks or escalates on overdraw — measured at the boundary (what the process actually touched), never by asking the agent. Even a deliberately crude estimator counts, as long as the envelope and ledger are real.

**Scale.** Weekend prototype to month project.

### 2. Who preflights the preflight, empirically

**Question.** Does a small, narrow, separately-trained estimator actually catch failures that a frontier sibling of the actor misses? The framework *predicts* it does — that correlated blind spots make a frontier model a bad judge of its own frontier mistakes (the "[who preflights the preflight](/delegation-risk/runtime-accounting/#who-preflights-the-preflight)" argument). Nobody has checked.

**Why it matters.** This is the framework's most testable falsifiable prediction. It maps directly onto AI Control's trusted/untrusted distinction ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)): the claim is that a *trusted* (simpler, separate) estimator earns its keep precisely on the failures a *untrusted* frontier judge shares with the actor. If a frontier judge does just as well, the verifiability-hierarchy rule loses its teeth.

**First result.** On a challenge set of actor failures, compare detection rates of (a) a frontier sibling judge and (b) a small/narrow/separately-trained judge, and show whether (b) catches a measurably non-overlapping slice. The interesting number is the *uncaught-by-frontier, caught-by-narrow* fraction.

**Scale.** Month project.

### 3. Measured correlation priors

**Question.** What is the actual pairwise failure correlation (φ, on the failure-indicator scale per the recipe in [Risk Propagation](/delegation-risk/risk-propagation/)) between real model pairs on shared challenge sets — same provider, cross-provider, cross-paradigm?

**Why it matters.** The [entanglement tax](/entanglements/) tables and the [correlation budget](/entanglements/) idea are uncomputable without these numbers. Right now the site uses ρ ≈ 0.5 as an illustrative same-provider figure; that figure is asserted, not measured. The adversarial-transferability literature suggests the measurement is feasible — transferable failures are correlated failures by another name.

**First result.** A small table of measured φ for a handful of model pairs, bucketed by relationship (same provider / cross-provider / cross-paradigm), with the challenge-set methodology documented well enough to reproduce. Even three pairs would replace an assumption with a measurement.

**Scale.** Month project to research program.

---

## Tier 2: Naming and measuring failure modes

### 4. Multi-tenant entanglement

**Question.** What are the failure modes of agents that share memory files, MCP servers, and tool caches — and how do you measure them? This is the 2026-shaped version of shared infrastructure, and the [entanglement](/entanglements/) literature (which grew up on shared training data and shared providers) hasn't characterized it.

**Why it matters.** Real agent deployments increasingly route through shared MCP servers and shared persistent memory. If those are common-cause failure channels, naive per-agent risk accounting double-counts independence the system doesn't have — exactly the failure [consolidation](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) is supposed to catch, but for a coupling nobody has named yet.

**First result.** A taxonomy of multi-tenant coupling channels (shared memory poisoning, MCP-server-as-common-mode, cache contamination) with at least one demonstrated case where two nominally independent agents fail together because of a shared dependency.

**Scale.** Month project.

### 5. Rubber-stamp rate measurement

**Question.** In a real approval flow, what fraction of human approvals are issued faster than the minimum time to read the thing being approved — the [rubber-stamp rate](/entanglements/cross-domain/psychology-of-oversight/) — and which interventions move it?

**Why it matters.** The framework leans on the claim that unbudgeted human review degrades into [approval theater](/entanglements/cross-domain/psychology-of-oversight/). That claim is borrowed and plausible but unmeasured in agent-oversight settings. If the rubber-stamp rate is low even under load, the case for preflight-as-attention-router weakens.

**First result.** Instrument an approval flow, log approval latency against a minimum-reading-time floor, report the rubber-stamp rate, then test one or two interventions (session-length limits, deliberate friction) and report the effect size.

**Scale.** Weekend prototype to month project.

---

## Tier 3: Protocol and metric design

### 6. Reconciliation protocol design

**Question.** What does it concretely mean to [reconcile](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) an exposure ledger against incidents and near-misses? The discipline is named everywhere on the site and specified nowhere.

**Why it matters.** A ledger without reconciliation is, in the site's own words, "the fake-precision trap with bookkeeping aesthetics." The whole defense against "aren't these numbers made up?" is that they get reconciled against reality — so the reconciliation procedure had better exist. Actuarial loss-development practice (how insurers update loss estimates as claims mature) is the obvious place to borrow from.

**First result.** A written protocol: what counts as an incident vs. a near-miss, how observed outcomes update prior exposure estimates, and a triangle-style worked example showing estimates converging (or failing to) over a few reconciliation periods.

**Scale.** Month project.

### 7. The insurance question, scoped

**Question.** Does liability transfer change outcomes when the agent doesn't feel the premiums? One crisp question, not a survey of insurance generally.

**Why it matters.** Insurance is the standard real-world answer to "who bears the cost of delegation gone wrong," but the standard moral-hazard analysis assumes the risk-taker internalizes the premium. An AI agent doesn't. Whether liability transfer still improves outcomes when the cost signal never reaches the actor is a genuinely open mechanism-design question, and the answer shapes whether trust-insurance proposals are coherent at all.

**First result.** A formal model (or a clean argument) for whether a principal carrying insurance on an agent's actions changes the agent's behavior when the agent is indifferent to premiums — and under what added structure (deductibles routed back as constraints, experience-rated privileges) it would.

**Scale.** Month project.

### 8. Repair risk-adjusted capability

**Question.** Can you define a dimensionally honest capability-per-unit-exposure metric? The current RACAP in [agent-power formalization](/power-dynamics/agent-power-formalization/) has incommensurable units — capability and exposure are not measured on comparable scales, so the ratio is not well-formed.

**Why it matters.** "Get the most capability per unit of exposure" is the framework's optimization target, stated on the homepage. If the metric that names that target is dimensionally broken, the optimization is rhetorical. The honest move is to say so plainly and either repair the units or replace the metric.

**First result.** Either a repaired definition with consistent units (and a worked computation on two example architectures showing the ranking is stable), or a documented argument that no single scalar works and a small vector of incomparable axes is the honest object instead.

**Scale.** Month project.

---

## Surviving problems from the earlier worklist

The problems above are the ones whose first results would most directly tell us whether the framework holds. The questions below predate this page and remain genuinely open; they are grouped, not abandoned. Several feed the problems above.

### Empirical validation
- **Empirical scheming reduction** — does task decomposition actually reduce scheming behavior? Survey factored-cognition and monitoring work; find or run monolithic-vs-modular comparisons. (Research program.)
- **Forecasting calibration for self-prediction** — can a model accurately forecast its own post-modification behavior, and how does calibration degrade with horizon? (Month project.)
- **Temperature and covert signaling** — does temperature=0 meaningfully suppress steganographic signaling between components? (Weekend to month.)

### Cross-domain transfer
- **Nuclear/aerospace safety transfer** — how PRA and IEC 61508 ASIL decomposition handle 10⁻⁹ targets and independence assumptions, and where they broke (TMI, Fukushima, Challenger). (Month project.)
- **Financial risk budgeting** — Euler allocation, Component VaR, and the lessons of LTCM / 2008 / March 2020 risk-parity failures for [exposure-cascade budgets](/delegation-risk/exposure-cascade/). (Month project.)
- **Carbon budget allocation** — effort-sharing rules and EU ETS Phase 1 over-allocation as a cautionary tale in baseline-data quality. (Month project.)
- **Pharmacological safety margins** — how FDA uncertainty factors stack (10× × 10× …) when failure modes are poorly characterized. (Weekend to month.)

### Formal methods
- **Compositional risk measures** — which risk measures are homogeneous enough for Euler allocation, and when safety properties compose. (Research program.)
- **Linear logic for risk budgets** — bounded linear types and object-capability models for resource-constrained delegation. (Research program.)
- **Formal verification limits** — the gap between verified components and emergent system behavior; Guaranteed Safe AI levels. (Research program.)

### Mechanism design and economics
- **Incentive-compatible safety reporting** — VCG / revelation-principle / Shapley-value approaches to honest risk disclosure across subsystems. (Research program.)
- **Trust markets and arbitrage** — information asymmetry and adverse selection in agent markets; feasibility of trust derivatives. (Month project.)

### Architecture
- **Coordinator redundancy experiments** — build diverse coordinators (rule-based, narrow fine-tune, older frontier), compare agreement and failure modes, red-team each. (Month project.) *Feeds problem 2.*
- **Fine-tuning vs general models** — predictability and auditability of narrow task models vs frontier models. (Month project.)

### Game theory and dynamics
- **Trust dynamics under adversarial pressure** — equilibria when agents build then exploit trust; counter-strategies (unpredictable monitoring, trust decay). (Research program.)
- **Byzantine coordinator voting** — 3f+1 applied to AI coordination; empirical testing of voting-based decisions. (Month project.)
- **Risk inheritance algorithms** — compare multiplicative (canonical), beta-factor mixture, minimum (the ρ=1 limit), and PageRank propagation across topologies (harmonic is retired). (Research program.)

### Human–AI interaction
- **Human trust calibration** — over/under-trust patterns and calibration interventions in human-AI teams. (Month project.) *Adjacent to problem 5.*
- **Trust handoff protocols** — specification and context sufficiency at human↔AI handoffs. (Month project.)

### Standards and policy
- **Comparison to existing frameworks** — situating this work against CAIS (Drexler 2019), AI Control (Redwood 2024), IDA (Christiano 2018), and frontier RSPs. (Month project.)
- **Regulatory and certification analysis** — maximum allowed delegation risk by application category; disclosure and liability frameworks. (Research program.)

### Meta-research
- **Historical failure analysis** — pattern extraction from finance, nuclear, and carbon risk-management failures. (Month project.)
- **Uncertainty quantification** — distributions over risk estimates and their propagation through the accounting. (Month project.) *Feeds problem 3 and problem 6.*
- **Emergent capability bounds** — how to bound exposure when capabilities are unknown; detecting emergence before exploitation. (Research program.)

### Agency, power, and capability
Tied to [Agent, Power, and Authority Formalization](/power-dynamics/agent-power-formalization/):
- **Empirical agency measurement** — behavioral tests for goal-directedness, temporal consistency, cross-context generalization. (Research program.)
- **The strong-tools hypothesis** — is high capability achievable with low agency, and which architectures keep agency low? See [Strong Tools Hypothesis](/power-dynamics/strong-tools-hypothesis/). (Research program.)
- **Power accumulation dynamics** — measure and bound the power growth rate λ for deployed systems. (Research program.)
- **Power-seeking detection** — behavioral signatures of instrumental convergence, resource-acquisition and shutdown-avoidance indicators. (Research program.)
- **Authority–power gap analysis** — detecting and correcting when power exceeds granted authority. (Month project.)

---

## How to contribute

Every problem here is an invitation. If you have a result — even a negative one, even a crude prototype that broke in an instructive way — it is more valuable to this framework than another page of prose. Negative results that falsify a load-bearing claim are the most valuable of all.

The framework lives at **[github.com/quantified-uncertainty/delegation-risk-framework](https://github.com/quantified-uncertainty/delegation-risk-framework)**. Open an issue to propose a problem, claim one above, or share a result. If you build the [preflight prototype](#1-the-preflight-prototype), please tell us where the estimates broke down — that is the data the whole [Runtime Accounting](/delegation-risk/runtime-accounting/) design is waiting on.

## See also

- [Runtime Risk Accounting](/delegation-risk/runtime-accounting/) — the mechanism most of Tier 1 would build and test
- [Entanglements](/entanglements/) — the correlation problem problems 3 and 4 would measure
- [Risk Propagation](/delegation-risk/risk-propagation/) — the φ recipe problem 3 depends on
- [Psychology of Oversight](/entanglements/cross-domain/psychology-of-oversight/) — the approval-theater claim problem 5 would test
