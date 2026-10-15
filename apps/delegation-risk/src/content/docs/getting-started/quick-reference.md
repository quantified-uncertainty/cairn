---
title: "Quick Reference"
description: "Core formulas, harm-mode checklist and pattern pointers at a glance"
---

A lookup page for readers who know the framework. Definitions are in the [Glossary](/getting-started/glossary/); derivations are in [Risk Propagation](/delegation-risk/risk-propagation/).

## Formulas

Probabilities are per stated unit (per task, action or month); dollar figures carry the same unit.

| Quantity | Formula | Units |
|---|---|---|
| Delegation risk of a component | Σ P(harm mode) × Damage | \$ per unit |
| System expected loss | Σ component delegation risks (adds whatever the correlation; overlapping harm modes on one asset make the sum an upper bound) | \$ per unit |
| Chain works (serial) | ∏ tᵢ, with tᵢ = P(faithful execution); conservative under correlation | probability |
| All checks miss (parallel) | (1−ρ)·∏pᵢ + ρ·min pᵢ | probability |
| Residual risk behind checks | P(harmful action) × P(all checks miss) × Damage | \$ per unit |
| Entanglement tax | P(all miss) / ∏pᵢ; for n equal checks, (1−ρ) + ρ·p^(1−n) | ratio |
| Estimating ρ | largest pairwise phi coefficient of per-item misses on a shared labeled set | 0–1 |

When ρ is unknown and the checks share a provider, training data or context, or when an adaptive attacker can probe them, use ρ = 1: only your best single check counts. With three checks at p = 0.1, the tax is 1 + 99ρ, about 11×, 21× and 50× at ρ = 0.1, 0.2 and 0.5.

## Harm-mode checklist

**Accident.** The task is done wrong; there is an edge-case failure; a confident falsehood; resource exhaustion; an irreversible action taken by mistake.

**Defection.** Pursuing a different objective; deception; sandbagging; collusion between components; *reward hacking* (special-casing tests, editing graders), which is a non-scheming sub-type.

**Hijack.** Prompt injection through documents, web pages or tool outputs; a malicious or compromised MCP server or dependency; misuse by an authorized user.

## Where to start, by concern

| Concern | Patterns |
|---|---|
| Capability errors | Escalation Ladder, Trusted Monitor, Checkpoint-Rollback |
| Prompt injection and misuse | Exposure-envelope gateway, Need-to-Know Compartments, Flight Recorder |
| Scheming | Honeypot Injection, Capability Probing, Consistency Triangulation, Random Audit |
| Cascading failure | Bulkhead Isolation, Graceful Degradation |
| Collusion | Trust Transitivity Limits, Adversarial Collaboration; diversify model families |

All are in the [pattern catalogue](/design-patterns/). Before any of them, build [the minimal delegation-engineering layer](/getting-started/core-concepts/#the-minimal-delegation-engineering-layer).

## Example thresholds

*These are examples to adapt, not benchmarks.* Block and escalate any action whose preflight estimate exceeds the remaining budget. Require human approval above a damage threshold you set per system. Keep irreversible or catastrophic harm modes outside the envelope, rather than pricing them in a dollar budget ([why](/getting-started/core-concepts/#when-expected-loss-is-the-wrong-metric)). Review the ledger whenever observed incidents exceed the estimate for a period.
