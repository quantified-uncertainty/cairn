---
title: "Runtime Risk Accounting"
description: "Risk preflight, exposure envelopes and the exposure ledger: what agent harnesses already do, and what it would add for them to do risk accounting natively"
sidebar:
  badge:
    text: Core
    variant: tip
  order: 5
---

:::caution[Design proposal]
Most of the mechanisms on this page exist in agent harnesses as of late 2026; the ledger and its reconciliation do not. [What exists and what is new](#what-exists-and-what-is-new) draws the line. The page states its own failure modes at the end.
:::

Imagine a coding agent that begins every consequential action by asking *"What is the expected damage of doing this with strategy X?"*, and adjusts the strategy to lower it. This is not a permission prompt, which is binary and easily rubber-stamped. It is an account: damage estimated before acting, budgeted across a session, and reconciled against what happens.

Runtime risk accounting moves the framework's math into the harness around the model. It has three mechanisms.

## 1. Risk preflight

Before an action commits, the scaffold runs a **risk preflight**:

1. Enumerate the **harm surface** of the proposed action: the distinct ways this `rm`, this API call or this email could go wrong.
2. Bound the **exposure**: the worst case, given what this delegate can actually reach.
3. Estimate the **delegation risk** (expected loss) and compare it with what remains of the session's budget.
4. Below threshold, proceed. Above, adjust the strategy or escalate to a human.

The name borrows from the CORS preflight, a cheap permission check sent before the real request, and from pilots' flight-risk assessment tools, scored go/no-go checks before takeoff. Both are cheap, mandatory, and occasionally abort the flight.

Preflight also makes human oversight budgetable rather than theatrical. Permission prompts treat every action as equally worth a human's attention, which produces approval fatigue and reflexive clicking. A preflight score decides *which* actions get the scarce human review. This is the logic of the *auditing budget* in AI Control ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)), where humans review only the small fraction of actions that monitoring flags.

## 2. The exposure envelope

The **exposure envelope** is the bounded region of action-space within which the agent may act freely. The scaffold enforces the boundary mechanically, through file-system scope, spend caps, network egress rules and rate limits, *regardless of what the agent intends or argues*.

The lineage is Airbus's flight-envelope protection, which keeps the aircraft inside its structural limits whatever the pilot commands: safety that does not depend on the operator's intent.

The envelope and the budget do different jobs:

- The **budget** is statistical. Expected losses accumulate against it, and an agent can overdraw it gradually.
- The **envelope** is a hard bound. A *single* catastrophic action, one credential exfiltration or one `DROP TABLE`, must hit the envelope wall, not merely overdraw an account. Risk accounting without hard bounds fails where it matters most, because the worst failures are concentrated in single actions. Shlegeris and Greenblatt ([2024](https://blog.redwoodresearch.org/p/the-case-for-ensuring-that-powerful)) call these *concentrated failures*; AI Control is designed against them.

Preflight decides whether an action is worth its estimated risk. The envelope decides what is possible at all. You need both.

## 3. The exposure ledger

The **exposure ledger** is the running account per delegate. Granting access debits it; completing a verification or revoking a privilege credits it back. A session has an opening balance (the budget), a running position and a closing reconciliation.

Three disciplines come with it. Without them a ledger is decorated guesswork.

- **Mark-to-market.** Re-estimate exposure when conditions change, not only at delegation time. A delegate that was low-risk in a sandbox is not low-risk once the production volume is mounted.
- **Margin call.** When a delegate's running position exceeds its budget mid-task, the scaffold forces de-risking: pause, post collateral (obtain human approval), or unwind the position (roll back, drop privileges). As in finance, it is involuntary.
- **Reconciliation.** Periodically compare the ledger with reality: incidents, near misses, audit samples. This is the standing answer to "aren't these numbers made up?" They start made up. The discipline is that they don't stay that way.

One structural rule completes it: **consolidation**, rolling a coordinator's ledger up from its subagents. For expected loss this is simple. Expected losses add, whatever the correlation, by linearity of expectation. Where two subagents' harm modes hit the same asset (both can delete the same database), the true expected loss is P(A or B) × D, which is at most the naive sum. The sum is therefore a conservative upper bound; subtract the overlap only if you can estimate it. This mirrors consolidated accounts, where eliminating intercompany positions lowers the total.

Correlation matters in two other places. It shapes the *tail* of the roll-up: the chance that several subagents fail in the same period, and the size of a bad month. And it governs *AND-structured* defenses, where a harmful action gets through only if every check misses. The [entanglement tax](/entanglements/#the-canonical-example) belongs to that second case, not to the roll-up.

## Who preflights the preflight?

The obvious implementation is wrong: have the model estimate its own risks.

If the preflight estimator is the same model as the actor, or the same model family, its blind spots are *correlated with the actions it is vetting*. That is this site's own [entanglement argument](/entanglements/) turned on its flagship mechanism. In the adversarial case it is worse than correlated. A scheming agent does not report honestly on its own risk, so any self-reported risk signal is suspect by construction. This is the standard AI Control objection ([Greenblatt et al. 2023](https://arxiv.org/abs/2312.06942)).

Two design rules follow.

1. **The preflight sits lower on the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) than the actor.** Use tiers 1 and 2 first: formally verified or deterministic, tested rules and resource accounting. Use tier 3, narrow learned classifiers with a measured error rate on a fixed task, second. A tier 4 trusted LLM, below the capability at which scheming is a live concern, can screen what the lower tiers cannot express, with its error rate measured. Never use tier 5, an untrusted frontier model, which includes any sibling of the actor. In Control vocabulary, the preflight is a *trusted* component checking an *untrusted* one. It is trusted because it is too simple and too separate to scheme or to share the actor's blind spots, not because it is smart.
2. **Ledger inputs come from the scaffold's own observation, never from agent self-report.** Record what the process actually read, wrote, spent and sent, measured at the boundary (syscalls, network egress, API billing), not what the model says it did. An agent can lie about its intentions; it cannot lie to the accounting layer about which files it touched.

## What exists and what is new

As of late 2026, agent harnesses already ship most of the parts. Compared one by one with the three mechanisms above:

| Mechanism in use | What it does | What it is in these terms | What it lacks |
|---|---|---|---|
| Pre-action hooks, such as Claude Code's [`PreToolUse`](https://code.claude.com/docs/en/hooks) | Run before a tool call; can allow, deny or escalate it, or rewrite its arguments | The place a preflight would run | Any damage estimate; the rule is whatever the hook's author wrote |
| Per-tool permission rules and approval modes | Allow, ask or deny by tool and pattern; modes from approving everything to approving nothing | A hand-set envelope plus an escalation rule | State: each decision ignores what has already been approved |
| A model-based action classifier, such as Claude Code's [auto mode](https://www.anthropic.com/engineering/claude-code-auto-mode) | A separate model call reviews each action and blocks ones that exceed the user's request or look driven by injected content | The closest thing to a preflight in production | A budget, a damage estimate, and an estimator independent of the actor (below) |
| OS sandboxes with egress allow-lists, such as Claude Code's [Bash sandbox](https://code.claude.com/docs/en/sandboxing) and [Codex](https://learn.chatgpt.com/docs/agent-approvals-security) | Writes confined to the workspace; network off, or routed through a proxy that admits listed domains | The envelope's mechanical wall | Coverage: see below |
| Information-flow control: CaMeL ([Debenedetti et al. 2025](https://arxiv.org/abs/2503.18813)), FIDES ([Costa et al. 2025](https://arxiv.org/abs/2505.23643)) | Track where each value came from, and enforce at tool-call time a policy on where untrusted or private data may flow | Envelope rules that depend on data provenance; the strongest structural defense against hijack | Prices nothing; does not address accident or a defecting planner |
| Spend and rate limits, such as per-workspace monthly caps in the [Anthropic Console](https://claude.com/blog/workspaces) | Cap what the agent costs to run | An envelope on compute | Bound the agent's cost, not the damage of its actions: a \$100 token cap permits a \$1M wire transfer |
| Trusted monitoring | A weaker model screens a stronger one's actions or reasoning; [Baker et al. (2025)](https://arxiv.org/abs/2503.11926) show one catching a stronger model's reward hacking from its chain of thought | A tier-4 preflight | A ledger to book its verdicts in |

Three details in these systems bear on the rules above.

- **Measured error rates exist, and they are not small.** Anthropic reports its auto-mode classifier, run on Sonnet 4.6, letting through 17% of a set of 52 real overeager actions, at a 0.4% false-positive rate on 10,000 actions of real internal traffic. It is tuned to overeager behavior and honest mistakes. Under rule 1 a classifier from the actor's own model family counts as a sibling, so against a schemer it is a tier-5 check. It does follow rule 2's spirit: the classifier sees user messages and the agent's tool calls but not tool results or the agent's own prose, so injected content and the agent's arguments do not reach it directly.
- **Envelopes have doors.** Claude Code's sandbox covers shell commands only; its file tools, MCP servers and hooks run outside it. When a command fails in the sandbox the agent may request an unsandboxed retry, which is approved by the user, by the classifier, automatically, or not at all, depending on the mode. A setting removes the retry. An envelope the agent can ask to leave is as hard as whatever approves the exit.
- **Spend caps sit on the wrong quantity.** API spend is what the operator pays the model provider. Delegation risk is what the agent's actions can cost. The two need not move together.

What does not exist is the accounting: an expected-loss estimate attached to each consequential action, booked per delegate against a budget, and reconciled against what happened. Hooks, permission rules and classifiers make yes/no decisions with no running account. A ledger makes the decision depend on what has already been spent, and lets outcomes correct the estimates. The ledger, its reconciliation and the rule about who may estimate are what this page proposes.

## What this does not handle

- **A capable schemer attacks the estimator, not the budget.** Runtime accounting raises the bar for subversion. It is not a control evaluation and does not replace one. A claim of robustness to intentional subversion needs the adversarial methodology of [AI Control](https://arxiv.org/abs/2312.06942), not architecture diagrams.
- **Harm enumeration is open-ended.** The preflight prices the harm surface it can enumerate, so novel harm modes are off-ledger by definition. Envelopes bound the *capability to act*, not *predicted harm*, which is why they are the backstop and why they are hard bounds.
- **The accounting costs something.** Every preflight adds latency and compute (the Control literature's *usefulness cost*). The bet that checks are cheap relative to the actions they gate needs measurement.

## Next steps

Everything needed for a first version exists. A pre-tool-use hook looks up each consequential call in a harm table and books its estimate to a session ledger, written from the harness's own logs; a sandbox with the unsandboxed retry disabled supplies the envelope; a monthly job reconciles the ledger against incidents. The estimates will be crude; the reconciliation will be real. See [Open Problems](/research/potential-projects/) for this and the other gaps.

## See also

- [Delegation Accounting](/delegation-risk/delegation-accounting/): the balance-sheet view this page makes operational
- [Risk Propagation](/delegation-risk/risk-propagation/): the composition rule, and why adversarial inputs need the minimum rule
- [Exposure Cascade](/delegation-risk/exposure-cascade/): how a budget divides down an orchestrator's tree
- [Psychology of Oversight](/entanglements/cross-domain/psychology-of-oversight/): why unbudgeted human review degrades into approval theater
