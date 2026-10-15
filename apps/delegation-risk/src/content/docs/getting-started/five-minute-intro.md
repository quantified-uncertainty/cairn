---
title: "Delegation Risk in 5 Minutes"
description: "The compressed version: treat delegation risk as a quantity, build scaffolding that accounts for it natively, and price the correlation that breaks naive arithmetic."
---

Handing a task to an employee, a script or an AI means taking on the downside of how it might go wrong. This framework's bet is that you can put a number on that downside, account for it like money, and design systems that spend less of it per unit of capability.

## 1. Delegation risk is a quantity

Three things often get smeared together:

- **Harm surface**: the *set* of distinct ways a delegation can go wrong (a coding agent's `rm`, its API calls, the emails it can send). Borrowed from *attack surface*.
- **Exposure**: the worst-case loss across that surface, given what this delegate can actually reach. Borrowed from finance's *exposure-at-default*.
- **Delegation risk**: the expected loss, probability times damage summed over the surface.

Enumerate, bound, expect. The third is the headline number ([canonical statement](/getting-started/core-concepts/#the-formula)):

```
Delegation Risk = Σ P(harm mode) × Damage
```

A component with a 1% chance per month of causing \$10,000 of damage carries \$100/month of delegation risk.

Each harm mode comes through one of [three channels](/delegation-risk/risk-decomposition/). In an *accident* the delegate fails at its task. In *defection* it pursues something other than your interest, from reward hacking to scheming. In a *hijack* someone else steers it: direct misuse, instructions planted in a web page, email, document or tool output it reads (indirect prompt injection), a poisoned MCP server, or a compromised dependency. The channels need different fixes, and in the last two an adversary is choosing its moves.

## 2. Scaffolding that does the accounting

Imagine a coding agent that begins every consequential action by estimating its expected damage, and adjusts its strategy to lower it. This is [runtime accounting](/delegation-risk/runtime-accounting/): the math moved into the harness around the model. It has three mechanisms.

- **Risk preflight**: before an action commits, the scaffold enumerates its harm surface, bounds the exposure, estimates the delegation risk and compares it with the session budget. Below threshold, proceed; above, adjust or escalate. The estimator must be more verifiable than the actor it checks, never the same model.
- **Exposure envelope**: hard limits on action-space that the scaffold enforces regardless of what the agent intends or argues, such as file scope, spend caps and egress rules. A budget can be overdrawn gradually; the envelope is a wall that a single catastrophic action must hit. You need both.
- **Exposure ledger**: the running position per delegate, reconciled against real incidents so the numbers don't stay made up.

Pieces of this exist today: pre-tool-use hooks, permission modes, sandboxes and spend caps in agent harnesses. What does not yet exist is the ledger with reconciliation.

## 3. The design space

There are two design moves.

**Decompose the task** across narrow components, none of which has enough capability, context or connectivity to cause catastrophic harm alone.

```
User → [Router] → [Narrow Component 1] → [Check] → Limited Action 1
                → [Narrow Component 2] → [Check] → Limited Action 2
                → [Narrow Component 3] → [Human Gate] → Sensitive Action
```

**Minimize each delegate.** Apply the [Least-X principles](/design-patterns/least-x-principles/), so that every component gets only what its task needs: Least Intelligence, Least Privilege, Least Context, Least Persistence, Least Autonomy, Least Connectivity. For a given capability there is some minimum exposure you can get away with, and the design work is finding it.

## 4. The complication: entanglement

Safeguards multiply only if they fail independently, and stacked safeguards rarely do, because they share causes: the same model family, the same training data, the same context. Decomposition also leaves some channels between components that cannot be removed ([load-bearing channels](/entanglements/)), and correlated failure concentrates there.

Three checks that each miss 10% of harmful actions promise, under independence, a 0.1% miss rate. With common-cause weight ρ the [canonical correction](/delegation-risk/risk-propagation/) gives (1−ρ)·0.001 + ρ·0.1, which is 1 + 99ρ times the naive figure: about 11× at ρ = 0.1, 21× at ρ = 0.2 and 50× at ρ = 0.5. That multiplier is the [entanglement tax](/entanglements/). For stacks built on one provider, ρ is an assumption; we know of no measurement on this scale. And this is benign-failure math: against an attacker who picks inputs to defeat every layer, assume ρ near 1.

Pricing that gap is what the framework adds to generic "decompose and verify" advice: diversify what your checks are built on, not just how many you stack.

## A worked mini-example

*All numbers are illustrative.* A Slack bot answers staff questions from internal docs, about 1,000 answers a month. The risk budget is \$200/month.

| Component | Implementation | Delegation risk |
|-----------|---------------|-----|
| Retriever | Code (vector search, access-filtered) | \$5/mo |
| Answerer | Frontier LLM via API, behind two checks | see below |
| Poster | Code (rate-limited) | \$1/mo |

Suppose 1% of the Answerer's drafts would leak something it shouldn't, at \$500 a leak. Unchecked, that is 1,000 × 0.01 × \$500 = \$5,000/month. Two checks screen each draft, a policy classifier and an LLM grader, both from the Answerer's model family, and each misses 10% of bad drafts.

- **Assuming independence**, both miss 1% of bad drafts, so the Answerer's risk is \$50 and the system total is \$56/month, well inside budget.
- **With the correction** for two layers, the miss rate is (1−ρ)·0.01 + ρ·0.1. At ρ = 0.2 that is 2.8%, giving \$140 for the Answerer and \$146 in total: inside budget. At ρ = 0.5 it is 5.5%, giving \$275 and \$281: over budget.
- **If the leaks come from instructions planted in the docs** (prompt injection), the attacker chooses the input. Assume ρ near 1: the pair is no better than one check, giving at least \$500 and \$506.

Whether the design ships depends on a number you have not measured. The fixes: measure ρ on a labeled challenge set, replace one check with a non-LLM rule or another provider's model, or tighten the envelope so a leak costs less.

Humans have long run exposure-limited delegation: nuclear launch requires two officers, and accounting separates the clerk who records a payment from the one who approves it. The [case studies](/case-studies/) read such institutions as delegation engineering.

Next: [the Core Path](/getting-started/reading-order/#the-core-path), [For Engineers](/getting-started/for-engineers/), or the [FAQ](/getting-started/faq/).
