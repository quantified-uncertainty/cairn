---
title: "For Engineers"
description: "The practitioner's path: the minimal delegation-engineering layer, where it lives in a 2026 agent stack, and the three mistakes specific to this framework."
---

The fastest route: read the [Five-Minute Intro](/getting-started/five-minute-intro/), build [the minimal delegation-engineering layer](/getting-started/core-concepts/#the-minimal-delegation-engineering-layer), and follow [the Core Path](/getting-started/reading-order/#the-core-path) when you want the reasons. The [Quick Start](/design-patterns/tools/quick-start/) checklist walks through a first assessment.

## Where the layer lives in an agent stack

Put every limit in the harness, not in the model. A system prompt is not a security boundary: an instruction in the prompt is one more input the model may fail to follow or be talked out of, including by text it reads in a tool result.

| Layer element | Where it lives in a current agent stack |
|---|---|
| **Harm surface** | An inventory of what the agent can touch: each MCP server and the tools it exposes, credentials and their scopes, writable paths, network destinations, and anything that sends messages or moves money. |
| **Exposure envelope** | Enforced outside the model. Run code in a sandbox (container or VM, scoped filesystem). Use an egress allow-list, tool allow/deny lists per MCP server, spend and rate caps, and scoped, short-lived credentials. |
| **Risk preflight** | Pre-tool-use hooks that can block a call, require approval or rewrite arguments. Use permission modes that decide which tools run unattended. The estimator sits at a lower [verifiability tier](/getting-started/core-concepts/#verifiability-hierarchy) than the agent: rules or a narrow classifier, not a sibling of the agent's model. |
| **Correlation budget** | Guard models and monitors from a different model family than the agent, plus at least one rule-based check per consequential action. |
| **Hijack defenses** | Keep untrusted content (web pages, documents, tool outputs) away from control flow. CaMeL extracts the control and data flows from the trusted query, so data retrieved later cannot change which tools are called (Debenedetti et al. 2025, [arXiv:2503.18813](https://arxiv.org/abs/2503.18813)). Beurer-Kellner et al. 2025 catalogue design patterns for agents that resist prompt injection ([arXiv:2506.08837](https://arxiv.org/abs/2506.08837)). |
| **Ledger** | Post-tool-use hooks and tracing that record each consequential action with its preflight estimate, per delegate. Reconcile monthly against incidents and near misses. |

Harnesses already provide much of the first four rows. What they do not provide is the accounting: a preflight that estimates expected damage rather than asking a yes/no question, and a ledger whose estimates are checked against outcomes. [Runtime Accounting](/delegation-risk/runtime-accounting/) describes both.

## Patterns and examples

The [pattern catalogue](/design-patterns/) has about twenty AI-specific patterns. The ones most engineers reach for first:

- **[Structural](/design-patterns/structural/)**: Escalation Ladder (approval modes), the exposure-envelope gateway, Task Decomposition Pipeline, Bulkhead Isolation.
- **[Monitoring](/design-patterns/monitoring/)**: Trusted Monitor, Random Audit, Flight Recorder.
- **[Verification](/design-patterns/verification/)**: Capability Probing, Honeypot Injection, Consistency Triangulation.
- **[Information](/design-patterns/information/)**: Need-to-Know Compartments, which separate untrusted context from capabilities.
- **[Recovery](/design-patterns/recovery/)**: Checkpoint-Rollback and Graceful Degradation.

There are two worked examples: a [code-deployment agent](/design-patterns/examples/code-deployment-example/) and a [research assistant](/design-patterns/examples/research-assistant-example/). [Composing Patterns](/design-patterns/composing-patterns/) covers how patterns interact.

## Three mistakes specific to this framework

Generic engineering advice (threat-model before copying patterns, don't over-engineer low-stakes tools) applies here as everywhere. These three are the ones the framework is specifically about.

### 1. Multiplying miss rates as if checks were independent

"Three checks, each catching 90%, so we miss 0.1%." That holds only if the checks fail independently. Checks built on one model family, trained on overlapping data or reading the same context tend to miss the same items. With common-cause weight ρ, three such checks miss (1−ρ)·0.001 + ρ·0.1 of harmful actions: about 11× the naive figure at ρ = 0.1, 21× at ρ = 0.2 and 50× at ρ = 0.5 (the [entanglement tax](/entanglements/)). We know of no measurement of ρ for same-provider stacks on this scale, so treat these values as assumptions.

These figures describe benign, common-cause failure. Against an adaptive attacker, such as an injected prompt or a scheming component searching for an input that defeats every layer, assume ρ near 1, so that only your single best check counts, unless a [control evaluation](/research/trust-behavior/empirical-scheming-reduction/) shows otherwise.

To avoid this mistake, give each consequential action at least one check from a different tier or provider. Measure ρ where you can, using the phi coefficient of per-item misses on a shared labeled challenge set ([recipe](/delegation-risk/risk-propagation/)).

### 2. Letting the wrong party set the risk budget

If the team that ships the agent sets its risk budget but users or third parties bear the harm, the team will tend to accept more risk than the people exposed would. In other words, it will overestimate how much risk is acceptable. This is moral hazard, the problem [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) works through. Have the risk-bearers, or someone accountable to them, set the budget. Get the estimates reviewed by someone who is not paid to ship.

### 3. Estimates that are never reconciled

A risk budget built from guesses and never compared with outcomes is fake precision with bookkeeping aesthetics. The probabilities also go stale: a model upgrade, a new tool or a widened use case changes the harm surface. Keep the ledger, and compare predicted against observed incidents and near misses on a schedule and after every capability or tool change. When they diverge, revise the estimates, not the incident log.

### A reading mistake

Skipping [Entanglements](/entanglements/). Two components that share a model are enough to pay the tax; you do not need a large system.
