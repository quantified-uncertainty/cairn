---
title: "Introduction"
description: "The delegation risk problem, why AI systems raise it acutely, and where to go next."
sidebar:
  order: 2
---

# Introduction

:::tip[In a hurry?]
The [Five-Minute Intro](/getting-started/five-minute-intro/) covers the essentials on one page. This page gives the fuller problem statement and points you to the rest.
:::

## The Problem

Every delegation involves risk. When you delegate a task—to an employee, a contractor, a software system, or an AI agent—you're accepting potential downside in exchange for capability you don't have or can't apply yourself.

This is straightforward but worth stating precisely: **Delegation Risk is the expected cost of delegating**. For each way things could go wrong (we'll call these *harm modes*), multiply the probability by the damage and sum across all harm modes. See the [canonical formula](/getting-started/core-concepts/#the-formula) in Core Concepts.

A research assistant that might leak proprietary data (P=0.001, damage=\$50,000) contributes \$50 to your Delegation Risk. An AI code deployer that might deploy malicious code (P=0.0001, damage=\$1,000,000) contributes \$100. You're implicitly accepting these costs when you delegate.

This framing has two virtues:

1. **It's quantifiable.** You can compare delegates, track changes over time, and make principled trade-offs. "Is this AI system safer?" becomes a question with a numerical answer—at least in principle, and sometimes in practice.

2. **It separates the problem from the solution.** You might reduce Delegation Risk by selecting more trustworthy delegates, by adding verification layers, or by limiting what delegates can do. The metric doesn't assume a particular approach.

Of course, the hard part is estimating the probabilities and damages. We'll address this, but it's worth acknowledging upfront: Delegation Risk is only as good as your estimates. The framework provides structure for reasoning about risk; it doesn't eliminate uncertainty.

## Why AI Systems?

AI systems may present delegation challenges at unusual scale. Several factors suggest this:

**Capabilities are expanding rapidly, and verification may not be keeping pace.** A year ago, AI couldn't reliably write working code; now it often can. Our tools for verifying AI behavior have improved, but it's not obvious they've improved proportionally.

**Agent-to-agent delegation creates complex risk networks.** When AI agents delegate to other AI agents, risk relationships become networks rather than chains. If your AI assistant uses a plugin that calls another API that invokes another model—how much Delegation Risk are you accepting? Most current systems don't have principled answers.

**Autonomy may increase while oversight decreases.** There are economic pressures toward more autonomous AI ([Gwern, 2016](https://gwern.net/tool-ai)). To the extent autonomy increases without proportional accountability, structural guarantees become more important.

**We may be building systems we don't fully understand.** Uncharacterized capabilities mean unenumerated harm modes—and the Delegation Risk calculation requires listing failure modes, so uncertainty about capabilities translates directly to uncertainty about risk.

None of these claims are certain. But if even some hold, infrastructure for managing Delegation Risk seems valuable. And even if AI turns out easier to manage than feared, the framework applies to delegation generally—the AI application is primary but not exclusive.

## The Approach, in One Paragraph

The framework proposes **structural constraints**: design systems where dangerous behavior is difficult or impossible regardless of intentions, so that safety is a property of the architecture rather than of any component's behavior. This is how nuclear plants budget failure probabilities, how secure systems limit blast radius, and the logic behind constitutional separation of powers. [Core Concepts](/getting-started/core-concepts/) develops the idea in full—decomposition, the "Least X" principles, and what the framework does and doesn't provide.

Two pointers worth following early:

- **Scope**: this is about *containment*, not alignment—it complements alignment research, interpretability, and [AI Control](https://arxiv.org/abs/2312.06942) rather than replacing them. For an explicit list of what the framework does **not** provide, see [What This Framework Is NOT](/getting-started/core-concepts/#what-this-framework-is-not).
- **Generality**: the same mathematics applies to organizational trust, software permissions, supply chains, and government delegation. We use these domains throughout because human-delegation intuitions are often sharper than AI ones, and decades of practice provide tested patterns.

## How to Read This

Follow **[The Core Path](/getting-started/reading-order/#the-core-path)**—the framework's strongest material in about 12 stops (~4–6 hours). For the fastest version, the [Five-Minute Intro](/getting-started/five-minute-intro/); to apply the framework immediately, the [Quick Start](/design-patterns/tools/quick-start/); for goal-based paths and the full section map, [Reading Order](/getting-started/reading-order/).

---

## Key Takeaways

:::note[Key Takeaways]
1. **Risk is quantifiable**: Delegation Risk is the expected cost of delegating ([formula](/getting-started/core-concepts/#the-formula))
2. **Safety can be structural**: Architectural constraints can bound harm regardless of delegate behavior
3. **Decomposition limits risk**: No single component should have enough power to cause catastrophe
4. **Cross-domain methods may help**: Nuclear, finance, and mechanism design have relevant experience
5. **AI is our primary application**: The framework is general but AI systems are our focus
6. **Uncertainty remains**: The framework provides structure, not certainty
:::

## Further Reading

### Key Background
- Gwern. [*Why Tool AIs Want to Be Agent AIs*](https://gwern.net/tool-ai) — Economic pressures toward agentic AI
- Greenblatt, R., et al. (2024). [*AI Control*](https://arxiv.org/abs/2312.06942) — Safety despite potential scheming
- Drexler, K.E. (2019). [*Comprehensive AI Services*](https://www.fhi.ox.ac.uk/reframing/) — Narrow services approach

### Related Concepts
- [Defense in Depth](https://en.wikipedia.org/wiki/Defense_in_depth_(computing)) — Multiple independent safety barriers
- [Separation of Powers](https://en.wikipedia.org/wiki/Separation_of_powers) — Distributing authority to prevent concentration
- [Principal-Agent Problem](https://en.wikipedia.org/wiki/Principal%E2%80%93agent_problem) — Information asymmetry in delegation

See the [full bibliography](/reference/bibliography/) for comprehensive references.

---

## See Also

- [Core Concepts](/getting-started/core-concepts/) — Key ideas without mathematical formalism
- [The Core Path](/getting-started/reading-order/#the-core-path) — The guided route through the framework
- [Quick Start](/design-patterns/tools/quick-start/) — Step-by-step application checklist
- [Glossary](/getting-started/glossary/) — Terminology reference
