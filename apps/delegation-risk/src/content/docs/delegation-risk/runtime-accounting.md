---
title: "Runtime Risk Accounting"
description: "Risk preflight, exposure envelopes, and the exposure ledger: what it would mean for agent scaffolding to do risk accounting natively"
sidebar:
  order: 8
---

:::caution[Design Proposal]
This page describes a mechanism design, not existing tooling. Nothing below is built. It is
the framework's answer to "what would you actually construct?" — and it states its own
failure modes at the end.
:::

Imagine a coding agent that begins every consequential action with: *"Let's estimate the
expected damages I could do by doing this with strategy X"* — and then adjusts the strategy
to reduce them. Not a permission prompt (binary, per-action, easily rubber-stamped), but an
account: damage estimated before acting, budgeted across a session, reconciled against what
actually happens.

That is runtime risk accounting: moving the framework's math out of documents and into the
scaffolding layer — the harness around the model, not the model itself. It has three
mechanisms.

## 1. Risk preflight

Before an action commits, the scaffold runs a **risk preflight**:

1. Enumerate the **harm surface** of the proposed action (what are the distinct ways this
   `rm`, this API call, this email could go wrong?)
2. Bound the **exposure** (worst case, given what this delegate can actually reach)
3. Estimate the **delegation risk** (expected loss) and compare against the session budget
4. Below threshold → proceed. Above → adjust strategy, or escalate to a human

The name imports two correct intuitions. Web engineers know CORS preflight: a cheap
permission-check request sent before the real request. Pilots know flight-risk assessment
tools: scored go/no-go checks before takeoff. Both are cheap, mandatory, and occasionally
abort the flight.

Preflight is also what makes human oversight budgetable rather than theatrical. Permission
prompts treat every action as equally worth a human's attention, which is how you get
approval fatigue and reflexive clicking. A preflight score decides *which* actions deserve
the scarce human review budget — the same logic as an [auditing
budget](https://arxiv.org/abs/2312.06942) in AI Control, where humans carefully review only
the small fraction of actions that monitoring flags.

## 2. The exposure envelope

The **exposure envelope** is the bounded region of action-space within which the agent may
operate freely. The scaffold enforces the boundary mechanically — file-system scope, spend
caps, network egress rules, rate limits — *regardless of what the agent intends or argues*.

The lineage is deliberate: Airbus's flight envelope protection keeps the aircraft inside
its structural limits no matter what the pilot commands. Safety that does not depend on the
operator's intent is precisely this framework's thesis — architecture over alignment — and
aviation has run the experiment for nearly four decades.

The envelope and the budget play different roles, and the difference matters:

- The **budget** is statistical: expected losses accumulate against it, and an agent can
  overdraw it gradually.
- The **envelope** is a hard bound: a *single* catastrophic action — one credential
  exfiltration, one `DROP TABLE` — must hit the envelope wall, not merely overdraw an
  account. Risk accounting without hard bounds fails exactly where it matters most, because
  the worst failures are concentrated in single actions, not diffuse across many
  ([Shlegeris & Greenblatt 2024](https://blog.redwoodresearch.org/p/the-case-for-ensuring-that-powerful)
  call these *concentrated failures*, and build the AI Control agenda around them).

Preflight decides whether an action is worth its estimated risk. The envelope decides what
is possible at all. You need both.

## 3. The exposure ledger

The **exposure ledger** is the running account per delegate: granting access debits it,
completing verification or revoking privileges credits it back. A session has an opening
balance (the budget), a running position, and a closing reconciliation.

Three accounting disciplines come with it — they are not optional extras; they are what
separates a ledger from decorated guesswork:

- **Mark-to-market.** Exposure is re-estimated as conditions change, not only at delegation
  time. The delegate that was low-risk when sandboxed is not low-risk after you mount the
  production volume. Stale risk estimates are a real failure mode with no common name; this
  is it.
- **Margin call.** When a delegate's running exposure exceeds its budget mid-task, the
  scaffold forces de-risking: pause, post collateral (obtain human approval), or unwind the
  position (roll back, drop privileges). Like its finance namesake, it is involuntary.
- **Reconciliation.** Periodically compare the ledger against reality: incidents,
  near-misses, audit samples. Estimates that never meet outcomes drift into fiction — this
  is the standing answer to "aren't all these numbers made up?" They start made up. The
  discipline is that they don't stay that way.

And one structural rule: **consolidation**. When a coordinator's exposure is rolled up from
its subagents, the entries don't simply sum — shared dependencies mean shared failure
modes, and naive addition double-counts independence you don't have. Accounting solved the
analogous problem long ago (consolidated statements eliminate intercompany positions); here
the elimination entries are [correlation adjustments](/delegation-risk/risk-propagation/).
The [entanglement tax](/entanglements/#the-canonical-example) is what you pay when you skip
this step.

## Who preflights the preflight?

The obvious implementation is wrong: have the model estimate its own risks.

If the preflight estimator is the same model — or the same model family — as the actor,
its blind spots are *correlated with the actions it is vetting*. That is this site's own
[entanglement argument](/entanglements/) turned on its own flagship mechanism. And in the
adversarial case it is worse than correlated: a scheming agent does not generate honest
telemetry about its own risk, so any self-reported risk signal is suspect by construction —
the standard AI Control objection
([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)).

Two design rules follow:

1. **The preflight sits lower on the [verifiability
   hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) than the actor.**
   Deterministic rules and resource accounting first; small, narrow, separately-trained
   classifiers second; a frontier sibling of the actor, never. In Control vocabulary: the
   preflight is a *trusted* component checking an *untrusted* one — trusted because it is
   too simple and too separate to scheme or to share the actor's blind spots, not because
   it is smart.
2. **Ledger inputs come from the scaffold's own observation, never from agent self-report.**
   What did the process actually read, write, spend, and send — measured at the boundary
   (syscalls, network egress, API billing), not asked of the model. An agent can lie about
   its intentions; it cannot lie to the accounting layer about which files it touched.

## What this does not handle

Honest scoping, since this page proposes the framework's most ambitious mechanism:

- **A sufficiently capable schemer attacks the estimator, not the budget.** Runtime
  accounting raises the bar for subversion; it is not a control evaluation and does not
  substitute for one. Claims of robustness to intentional subversion need the adversarial
  methodology of [AI Control](https://arxiv.org/abs/2312.06942), not architecture diagrams.
- **Harm enumeration is open-ended.** The preflight prices the harm surface it can
  enumerate; novel harm modes are by definition off-ledger. Envelopes (which bound
  *capability to act*, not *predicted harm*) are the backstop, which is why they are hard
  bounds.
- **The accounting itself costs something.** Every preflight is latency and compute; the
  Control literature's *usefulness cost* applies here too. The bet is that, like CORS
  preflights, the checks are cheap relative to the actions they gate — a bet that needs
  measurement, not assertion.

## Status and next steps

Nothing on this page exists yet. The nearest buildable artifact is a preflight hook for an
agent harness (modern coding agents expose pre-action hook points), with a hard-coded
envelope and a session ledger — crude estimates, real reconciliation. See [Open
Problems](/research/potential-projects/) for this and the other gaps.

## See also

- [Delegation Accounting](/delegation-risk/delegation-accounting/) — the balance-sheet view
  this page makes operational
- [Risk Propagation](/delegation-risk/risk-propagation/) — the composition rule
  consolidation depends on
- [Exposure Cascade](/delegation-risk/exposure-cascade/) — budgets flowing down a hierarchy
- [Psychology of Oversight](/entanglements/cross-domain/psychology-of-oversight/) — why
  unbudgeted human review degrades into approval theater
