---
title: "Introduction"
description: "The delegation risk problem, why AI systems raise it acutely, and the structural-safety approach this framework takes."
sidebar:
  order: 1
---

# Introduction

## The Problem

Every delegation involves risk. When you delegate a task—to an employee, a contractor, a software system, or an AI agent—you're accepting potential downside in exchange for capability you don't have or can't apply yourself.

This is straightforward but worth stating precisely: **Delegation Risk is the expected cost of delegating**. For each way things could go wrong (we'll call these *harm modes*), multiply the probability by the damage and sum across all harm modes. See the [canonical formula](/getting-started/core-concepts/#the-formula) in Core Concepts.

A research assistant that might leak proprietary data (P=0.001, damage=$50,000) contributes $50 to your Delegation Risk. An AI code deployer that might deploy malicious code (P=0.0001, damage=$1,000,000) contributes $100. You're implicitly accepting these costs when you delegate.

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

## The Approach

This framework proposes **structural constraints** as a foundation for managing Delegation Risk. The intuition: rather than relying solely on selecting trustworthy delegates or overseeing every action, we can design systems where dangerous behavior is difficult or impossible regardless of intentions. The core idea: **safety can be a property of system architecture, not just individual component behavior**. (Core Concepts develops this in [Decomposition Over Monoliths](/getting-started/core-concepts/#decomposition-over-monoliths) and [Architectural Safety](/getting-started/core-concepts/#architectural-safety).)

This isn't a new idea. It's how nuclear plants aim for very low failure probabilities—by flowing system-level targets down to component budgets through fault trees. It's how financial institutions attempt to manage systemic risk. It's how secure systems try to limit blast radius through least privilege. It's also the logic behind constitutional separation of powers: bounding what any individual actor can do, regardless of their intentions.

Whether these approaches actually work as well as claimed is a separate question—nuclear safety has an impressive track record; financial risk management has a more mixed one. But the underlying principle of structural safety has proven useful across domains, and seems worth applying to AI systems.

What's newer here is attempting to systematize these ideas for AI specifically, where the delegates are less predictable than traditional software and the stakes may be higher than traditional human delegation. The framework provides a vocabulary, the underlying mathematics, the "Least X" principles, cross-domain methods (from nuclear safety, finance, and mechanism design), and concrete decomposition patterns—see [What This Framework Provides](/getting-started/core-concepts/#what-this-framework-provides) in Core Concepts. Whether this all adds up to something useful is ultimately an empirical question.

## Scope and Limitations

This framework is primarily about **structural safety**—architectural properties that bound harm regardless of behavior. It complements, rather than replaces:

- **Alignment research**: Making AI systems that actually want what we want
- **Interpretability**: Understanding what AI systems are doing internally
- **AI Control**: Protocols for maintaining safety despite potential scheming ([Greenblatt et al., 2024](https://arxiv.org/abs/2312.06942))

The implicit bet is that structural constraints can provide meaningful safety guarantees even if alignment is imperfect and interpretability is limited—at least for some period where AI systems are capable enough to be concerning but not so capable that no containment is possible.

This bet might be wrong. Structural constraints might be less effective than hoped, or the window where they're useful might be shorter than expected, or the overhead of implementing them might outweigh the benefits. We think the approach is promising enough to develop, but we're not certain it will work.

The framework is also not a complete solution to any problem. It's infrastructure—a set of concepts, tools, and patterns that might help. How much it helps depends on how well it's applied and whether the underlying assumptions hold.

### What This Framework Does NOT Provide

To set expectations clearly:

- **A solution to AI alignment**: This is about containment, not making AI want the right things
- **Guaranteed safety**: Structural constraints can fail; this provides defense in depth, not certainty
- **Empirically validated protocols**: The AI-specific application is novel and largely untested at scale
- **Complete coverage of all AI risks**: Many risks (e.g., emergent capabilities, deceptive alignment) may not be addressed by structural approaches
- **A substitute for careful judgment**: The framework provides structure for thinking, not answers

## Domain Generality

While AI is our primary application, the framework is domain-general. The same mathematics applies to:

- **Organizational trust**: How much Delegation Risk does a CFO represent? How should authority be distributed across an organization?
- **Software systems**: How much can a microservice damage if compromised? How should permissions be allocated?
- **Supply chains**: How much exposure do you have to a supplier's failures? How should you diversify?
- **Government**: How much authority has been delegated to an agency? What structural checks exist?

We include examples from these domains for two reasons. First, they're often more intuitive than AI examples—most people have better intuitions about organizational trust than AI agent architectures. Second, decades of experience managing human delegation provides tested patterns. Some of these patterns may transfer to AI; others may not. But it seems worth learning from existing practice rather than starting from scratch.

## How to Read This

The documentation is organized from foundations to applications. You don't need to read linearly: for the core ideas fast, start with the [Five-Minute Intro](/getting-started/five-minute-intro/); to apply the framework immediately, try the [Quick Start](/design-patterns/tools/quick-start/); for the full picture, [Core Concepts](/getting-started/core-concepts/) gives a visual overview of how everything connects. For a section-by-section map, dependency graph, and goal-based reading paths, see [Reading Order](/getting-started/reading-order/).

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
- [Quick Start](/design-patterns/tools/quick-start/) — Step-by-step application checklist
- [Glossary](/getting-started/glossary/) — Terminology reference
