---
title: "Delegation Risk in 5 Minutes"
description: "The compressed version: treat delegation risk as a quantity, build scaffolding that accounts for it natively, and price the correlation that breaks naive arithmetic."
---

:::note
This is the compressed version. For caveats and nuance, see the [Getting Started overview](/getting-started/).
:::

Every time you hand a task to an agent—an employee, a script, an AI—you take on the downside of how it might go wrong. This framework's bet is that you can put a number on that downside, account for it the way a balance sheet accounts for money, and architect systems to spend less of it per unit of capability.

---

## 1. Delegation risk is a quantity

Start with three distinct things, smeared together too often as one word "exposure":

- **Harm surface** — the *set* of distinct ways a delegation can go wrong (a coding agent's `rm`, its API calls, the emails it can send). Borrowed from *attack surface*.
- **Exposure** — the worst-case loss across that surface, given what this delegate can actually reach. Borrowed from finance's *exposure-at-default*.
- **Delegation risk** — the expected loss: probability times damage, summed over the surface.

Mnemonic: **enumerate → bound → expect.** The third tier is the headline number, stated once and linked from its [canonical home](/getting-started/core-concepts/#the-formula):

```
Delegation Risk = Σ P(harm mode) × Damage
```

A component with a 1% chance of \$10,000 damage carries \$100 of delegation risk. That is a quantity you can budget across a system and optimize—just like compute or money.

---

## 2. The hook: scaffolding that does the accounting natively

Now imagine a coding agent that begins every consequential action with *"let's estimate the expected damages of doing this with strategy X"*—and adjusts the strategy to lower them. Not a permission prompt (binary, per-action, easily rubber-stamped), but a running account. This is [**runtime accounting**](/delegation-risk/runtime-accounting/): moving the math out of documents and into the harness around the model. It has three mechanisms.

- **Risk preflight** — before an action commits, the scaffold enumerates its harm surface, bounds the exposure, estimates the delegation risk, and compares against the session budget. Below threshold, proceed; above, adjust or escalate. (Like a CORS preflight or a pilot's go/no-go check: cheap, mandatory, occasionally aborts the flight.)
- **Exposure envelope** — a hard boundary on action-space the scaffold enforces *regardless of what the agent intends or argues*: file scope, spend caps, egress rules. The budget is statistical and can be overdrawn gradually; the envelope is a wall a single catastrophic action must hit. You need both.
- **Exposure ledger** — the running position per delegate, with the accounting disciplines that keep it honest: mark-to-market as conditions change, margin calls when exposure exceeds budget, and reconciliation against real incidents so the numbers don't stay made up.

Nothing here is built yet—it is the framework's answer to "what would you actually construct?" See [Runtime Accounting](/delegation-risk/runtime-accounting/) for the full design, including who is allowed to preflight whom.

---

## 3. The design space

If risk is a quantity, you can architect to minimize it. Two moves:

**Decompose the task.** Instead of one powerful agent with full access, split the work across narrow components, no one of which has enough capability, context, or connectivity to cause catastrophic harm.

```
User → [Router] → [Narrow Component 1] → [Verifier] → Limited Action 1
                → [Narrow Component 2] → [Verifier] → Limited Action 2
                → [Narrow Component 3] → [Human Gate] → Sensitive Action
```

**Minimize each delegate.** Apply the [**Least-X principles**](/design-patterns/least-x-principles/)—least intelligence, least privilege, least context, least persistence, least autonomy—so every component does only what its task needs. Together these define a Pareto frontier: for a given capability you want, there is a minimum exposure you can get away with, and the design work is finding it.

---

## 4. The complication: entanglement

Here is what breaks the easy version. Safeguards multiply *only if they fail independently*—and stacked safeguards rarely do, because they share causes: the same model, the same training data, the same context. Decomposition also leaves some channels between subagents that you simply cannot remove ([load-bearing channels](/entanglements/)), and those are where correlated failure concentrates.

The numbers, [exactly](/entanglements/#the-canonical-example): three 90%-effective layers, naively, promise 99.9% protection. At correlations realistic for same-provider stacks (ρ ≈ 0.5), they deliver closer to **95%**—residual risk roughly **50×** what you computed. That gap runs 10–100× at realistic correlations, and it is the [**entanglement tax**](/entanglements/).

**Pricing it is what this framework adds over generic "decompose and verify" advice.** It is the most distinctive quantitative contribution here: diversify what your layers are built on, not just how many you stack.

---

## A worked mini-example

**Task**: Slack bot answering questions from docs (illustrative numbers)

| Component | Implementation | Delegation Risk |
|-----------|---------------|-----|
| Retriever | Code (vector search) | \$5/mo |
| Answerer | Fine-tuned 7B | \$50/mo |
| Poster | Code (rate limited) | \$1/mo |
| **Total** | | **\$56/mo** |

Budget: \$500/mo → **within budget, before the entanglement tax.** If those verifiers share a provider, apply the correction above before you ship.

---

## This is not new—just newly quantified

Humans have run exposure-limited delegation for centuries: juries split fact-finding from sentencing, nuclear launch needs two keys, double-entry bookkeeping exists so no one clerk can cook the books. The [case studies](/case-studies/) read those structures as delegation engineering avant la lettre—and as a stress test for whether the accounting holds up.

---

## Where to go next

- **Convinced enough to read properly?** → [The Core Path](/getting-started/reading-order/#the-core-path) — the framework's strongest material in ~12 stops
- **Want the flagship mechanism?** → [Runtime Accounting](/delegation-risk/runtime-accounting/)
- **Ready to apply it?** → [Quick Start](/design-patterns/tools/quick-start/)
- **Want the full picture first?** → [Core Concepts](/getting-started/core-concepts/)
- **Have questions?** → [FAQ](/getting-started/faq/)

---

**TL;DR**: Delegation risk is a quantity—harm surface, exposure, expected loss. Build scaffolding that accounts for it before acting; decompose and minimize each delegate to spend less of it; and price the entanglement that makes stacked safeguards fail together.
