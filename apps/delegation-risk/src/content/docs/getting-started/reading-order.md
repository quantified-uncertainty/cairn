---
title: "The Core Path"
description: "The ~12-stop core path through the framework's strongest material, plus shorter routes by goal"
---

# The Core Path & Where to Go Next

This site is large (~160 pages), but its essential argument lives in about a dozen stops. **If you read only one path, read this one** — it covers the framework's most distinctive material in order, in roughly 4–6 hours. Pages on this path are marked with a <span style="color:var(--sl-color-green)">Core</span> badge in the sidebar. Everything else on the site is reference depth, supporting research, or applied variation.

## The Core Path

**Before you start:** skim the [Five-Minute Intro](/getting-started/five-minute-intro/) and [Core Concepts](/getting-started/core-concepts/) (~25 min) for the vocabulary — especially the [canonical definition of Delegation Risk](/getting-started/core-concepts/#the-formula).

1. **[Risk Decomposition](/delegation-risk/risk-decomposition/)** — The framework's load-bearing distinction: *accidents* (component fails at its task) versus *defection* (component works against you). They scale oppositely with capability — smarter systems have fewer accidents but potentially more dangerous defection — which is why "just build better AI" can't solve both, and why architecture has to.

2. **[Delegation Accounting](/delegation-risk/delegation-accounting/)** — Treats risk like money: every delegation moves exposure onto someone's balance sheet, complexity carries a tax, and the running example (a \$1,000 delivery that escalates to an adversarial agent) shows why financial instruments alone stop working as agents get more capable.

3. **[The Insurer's Dilemma](/delegation-risk/insurers-dilemma/)** — Why coverage structures break down under moral hazard and adversarial agents: the case for *architectural* rather than purely financial risk management. This is the pivot point of the whole framework.

4. **[Entanglements](/entanglements/)** + **[Types](/entanglements/fundamentals/types/)**, **[Challenges](/entanglements/fundamentals/challenges/)**, **[Formal Definitions](/entanglements/fundamentals/formal-definitions/)** — The site's most original contribution. Five 90%-effective safety layers are not 99.999% safe, because components share infrastructure, blind spots, and influence channels. The *entanglement tax* — actual risk over perceived risk — is often 10–100×. The passive / active / adversarial taxonomy organizes everything that follows.

5. **[Detecting Influence](/entanglements/detection/detecting-influence/)** — Eight practical methods (A/B frame testing, counterfactual intervention, honeypots, rotation, timing analysis, red-team channel enumeration) for finding the entanglements your architecture diagram says don't exist.

6. **[Entanglement Worked Examples](/entanglements/case-studies/examples/)** — Four systems (code review, healthcare, trading, support escalation) diagnosed end-to-end: build the correlation matrix, find the hidden dependency, redesign, verify. The most directly actionable page on the site.

7. **[Structural Patterns](/design-patterns/structural/)** — The eight architectural building blocks (escalation ladders, voting tribunals, capability airlocks, bulkheads…) that bound damage regardless of component behavior.

8. **[Channel Integrity](/design-patterns/channel-integrity/)** — The deepest pattern chapter: side-channels, and how components that never communicate can still coordinate through shared reasoning (logical correlation). Where entanglement theory meets decision theory.

9. **[Composing Patterns](/design-patterns/composing-patterns/)** — Patterns interact. Four reference stacks for real systems, a compatibility matrix, and the anti-patterns (kitchen-sink, verification theater) that come from composing badly.

10. **[Worked Examples](/design-patterns/examples/research-assistant-example/)** — The framework applied end-to-end with explicit (illustrative) numbers in four domains: [research assistant](/design-patterns/examples/research-assistant-example/), [code deployment](/design-patterns/examples/code-deployment-example/), [trading system](/design-patterns/examples/trading-system-example/), [healthcare bot](/design-patterns/examples/healthcare-bot-example/). Note how risk budgets shift with stakes across the four.

11. **[Nuclear Launch Authority](/case-studies/human-systems/nuclear-launch-authority/)**, **[Jury Systems](/case-studies/human-systems/jury-trust/)**, **[Criminal Organizations](/case-studies/human-systems/criminal-trust/)** — Three human systems that solved delegation-under-distrust for real, each isomorphic to an AI design question: engineered error asymmetry (juries), deliberate friction and two-person integrity (nuclear), and trust without any external enforcement at all (criminal organizations).

12. **[Sydney / Bing Chat](/case-studies/ai-systems/case-study-sydney/)** — The closing real-world failure analysis: what happens when none of the above is in place, and the counterfactual architecture that would have contained it.

**After the Core Path:** go applied with the [Quick Start checklist](/design-patterns/tools/quick-start/), go quantitative with [Probabilistic Estimation](/experimental/probabilistic-estimation/), or go deep with the [Research section](/research/).

---

## Paths by Goal

The Core Path is the recommended default. If it's more than you need right now, these shorter routes target a specific goal. Each is a focused subset — for the fullest picture, the Core Path remains the recommended read.

**Building or applying a system.** [Core Concepts](/getting-started/core-concepts/) → [Quick Start](/design-patterns/tools/quick-start/) → [Design Patterns](/design-patterns/) and [Least-X Principles](/design-patterns/least-x-principles/) → [Entanglements](/entanglements/) to avoid correlated failures, with the [Cost-Benefit Tool](/design-patterns/tools/cost-benefit/) for ROI. Applying to an organization rather than an AI system? Start from the [human-systems case studies](/case-studies/) instead. (~2–4 hrs)

**Assessing an existing system.** [Core Concepts](/getting-started/core-concepts/) → [Delegation Risk Overview](/delegation-risk/overview/) and [Risk Decomposition](/delegation-risk/risk-decomposition/) → [Case Studies](/case-studies/) → [Entanglements: Mitigation](/entanglements/mitigation/solutions/) to fix what you find. (~2–3 hrs)

**Skeptical it works.** [FAQ](/getting-started/faq/) → [Sydney Case Study](/case-studies/ai-systems/case-study-sydney/) → [Nuclear Safety PRA](/cross-domain-methods/nuclear-safety-pra/) and [Lessons from Failures](/cross-domain-methods/lessons-from-failures/) for fields that already do this. (~2–3 hrs)

**Following the math.** [Core Concepts](/getting-started/core-concepts/) → [Delegation Risk Overview](/delegation-risk/overview/) and [Walkthrough](/delegation-risk/walkthrough/) → [Risk Decomposition](/delegation-risk/risk-decomposition/) and [Power Dynamics](/power-dynamics/) → [Experimental Estimates](/experimental/probabilistic-estimation/). (~4–6 hrs)

**Researching.** [Core Concepts](/getting-started/core-concepts/) → [all theory sections](/delegation-risk/) → [Research Index](/research/) and [Potential Projects](/research/potential-projects/) → [Experimental](/experimental/). (10+ hrs)

---

### Time budget

| If you have... | Read... |
|----------------|---------|
| 30 minutes | [Five-Minute Intro](/getting-started/five-minute-intro/) + [Core Concepts](/getting-started/core-concepts/) |
| Half a day (4–6 hrs) | [The Core Path](#the-core-path) — the framework's strongest material, end to end |
| Full day | The Core Path + [Research](/research/) and [Experimental](/experimental/) |

---

## See Also

- [Site Map](/reference/site-map/) — Visual map of all content
- [Glossary](/getting-started/glossary/) — Term definitions
- [FAQ](/getting-started/faq/) — Common questions
