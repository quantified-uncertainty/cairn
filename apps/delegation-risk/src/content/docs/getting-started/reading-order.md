---
title: "Reading Order & Prerequisites"
description: "How to navigate this site based on your goals and background"
sidebar:
  order: 6
---

# Reading Order & Prerequisites

This guide helps you navigate the 162-page documentation site efficiently by showing dependencies between sections and suggesting paths based on your goals.

## Section Dependency Graph

```mermaid
flowchart TB
    subgraph Foundation["Foundation (Read First)"]
        GS[Getting Started]
        CC[Core Concepts]
    end

    subgraph Theory["Theory (Build Understanding)"]
        DR[Delegation Risk]
        PD[Power Dynamics]
        ENT[Entanglements]
    end

    subgraph Application["Application (Take Action)"]
        DP[Design Patterns]
        CS[Case Studies]
        XD[Cross-Domain Methods]
    end

    subgraph Advanced["Advanced (Deep Dives)"]
        RES[Research]
        EXP[Experimental]
    end

    GS --> CC
    CC --> DR
    CC --> PD
    CC --> ENT
    DR --> DP
    PD --> DP
    ENT --> DP
    DR --> CS
    DP --> CS
    CC --> XD
    DR --> RES
    RES --> EXP

    style GS fill:#e3f2fd
    style CC fill:#e3f2fd
    style DR fill:#fff3e0
    style PD fill:#fff3e0
    style ENT fill:#fff3e0
    style DP fill:#e8f5e9
    style CS fill:#e8f5e9
    style XD fill:#e8f5e9
    style RES fill:#f3e5f5
    style EXP fill:#f3e5f5
```

## Prerequisites by Section

| To Read... | First Understand... | Time Investment |
|------------|---------------------|-----------------|
| **Core Concepts** | Nothing (start here) | 20 min |
| **Delegation Risk** | Core Concepts | 45 min + Core |
| **Power Dynamics** | Core Concepts | 30 min + Core |
| **Entanglements** | Core Concepts | 60 min + Core |
| **Design Patterns** | Core Concepts + at least one of (DR, PD, or ENT) | 2+ hours |
| **Case Studies** | Core Concepts + Design Patterns | 1-2 hours |
| **Cross-Domain Methods** | Core Concepts | 30-60 min |
| **Research** | All theory sections | 5+ hours |

---

## Paths by Goal

### "I'm building an AI system from scratch"
1. [Core Concepts](/getting-started/core-concepts/) — Understand the framework
2. [Design Patterns Index](/design-patterns/) — See what patterns exist
3. [Least-X Principles](/design-patterns/least-x-principles/) — Core design philosophy
4. [Quick Start](/design-patterns/tools/quick-start/) — Step-by-step checklist
5. [Entanglements](/entanglements/) — Avoid correlated failures

**Total time:** 2-3 hours

### "I'm assessing risk in an existing system"
1. [Core Concepts](/getting-started/core-concepts/) — Framework basics
2. [Delegation Risk Overview](/delegation-risk/overview/) — Quantification approach
3. [Risk Decomposition](/delegation-risk/risk-decomposition/) — How to break down risk
4. [Case Studies](/case-studies/) — See examples
5. [Cost-Benefit Tool](/design-patterns/tools/cost-benefit/) — Evaluate mitigations

**Total time:** 2-3 hours

### "I'm skeptical this framework works"
1. [FAQ](/getting-started/faq/) — Common objections answered
2. [Sydney Case Study](/case-studies/ai-systems/case-study-sydney/) — Real-world failure analysis
3. [Nuclear Safety PRA](/cross-domain-methods/nuclear-safety-pra/) — Similar methods that work
4. [Lessons from Failures](/cross-domain-methods/lessons-from-failures/) — Historical context
5. [Research](/research/) — Theoretical foundations

**Total time:** 2-3 hours

### "I want to understand the math"
1. [Core Concepts](/getting-started/core-concepts/) — Conceptual foundation
2. [Delegation Risk Overview](/delegation-risk/overview/) — Formulas
3. [Delegation Walkthrough](/delegation-risk/walkthrough/) — Worked examples
4. [Risk Decomposition](/delegation-risk/risk-decomposition/) — Formal treatment
5. [Power Dynamics](/power-dynamics/) — Agency formalization
6. [Experimental Estimates](/experimental/probabilistic-estimation/) — Squiggle distributions

**Total time:** 4-6 hours

### "I want to apply this to my organization"
1. [Core Concepts](/getting-started/core-concepts/) — Basics
2. [Quick Start](/design-patterns/tools/quick-start/) — Practical checklist
3. [Human Systems Case Studies](/case-studies/) — Organizational examples
4. [Cost-Benefit Tool](/design-patterns/tools/cost-benefit/) — ROI analysis
5. [Entanglements: Mitigation](/entanglements/mitigation/solutions/) — How to fix issues

**Total time:** 3-4 hours

### "I'm a researcher"
1. [Core Concepts](/getting-started/core-concepts/) — Framework overview
2. [All Theory Sections](/delegation-risk/) — Full understanding
3. [Research Index](/research/) — Open problems
4. [Potential Projects](/research/potential-projects/) — Contribution ideas
5. [Experimental](/experimental/) — Probabilistic methods

**Total time:** 10+ hours

---

## Section Overviews

What each section covers and its key pages (prerequisites are in the table above):

| Section | What you'll learn | Key pages |
|---------|-------------------|-----------|
| **Delegation Risk** (Theory) | Quantify delegation risk mathematically, decompose it into components, track risk through hierarchical systems | Overview, Walkthrough, Risk Decomposition |
| **Power Dynamics** (Theory) | Formalize agent power, authority, and the "Strong Tools Hypothesis" about capability constraints | Agent Power Formalization, Strong Tools Hypothesis |
| **Entanglements** (Theory) | How correlated components undermine safety assumptions, how to detect entanglement, how to mitigate it | Index (Independence Illusion), Detection, Mitigation |
| **Design Patterns** (Application) | 45 patterns for building safer delegation systems, organized by threat model | Index (pattern matrix), Least-X Principles, Tools |
| **Case Studies** (Application) | How concepts apply to real AI systems (Sydney, code review bots) and human systems (nuclear, finance) | AI Systems, Human Systems |
| **Cross-Domain Methods** (Application) | How mature risk fields (nuclear, finance, carbon budgets) handle similar problems | Overview, Nuclear Safety PRA |
| **Research** (Advanced) | Theoretical foundations, open problems, connections to academic literature | Index, Potential Projects |
| **Experimental** (Advanced) | Probabilistic estimation tools, Squiggle distributions, uncertainty quantification | Probabilistic Estimation |

### Time budget

| If you have... | Read... |
|----------------|---------|
| 5 minutes | [Five-Minute Intro](/getting-started/five-minute-intro/) |
| 30 minutes | Introduction + Core Concepts |
| 2 hours | Foundation + one theory section + Quick Start |
| Half a day | Foundation + all theory + Design Patterns index |
| Full day | Everything except Research and Experimental |

---

## How Sections Connect

Beyond the order in which to read sections, it helps to understand *why* the documentation is organized this way and how the pieces fit together.

### The Core Logic

The framework follows a specific logical structure:

```mermaid
flowchart LR
    subgraph Problem["1. Problem"]
        P1[Delegation creates risk]
        P2[Risk compounds through hierarchies]
        P3[Independence assumptions often fail]
    end

    subgraph Quantify["2. Quantify"]
        Q1[Define harm modes]
        Q2[Estimate probabilities]
        Q3[Calculate total risk]
    end

    subgraph Constrain["3. Constrain"]
        C1[Set risk budgets]
        C2[Allocate to components]
        C3[Verify constraints hold]
    end

    subgraph Mitigate["4. Mitigate"]
        M1[Apply design patterns]
        M2[Monitor for drift]
        M3[Respond to incidents]
    end

    Problem --> Quantify --> Constrain --> Mitigate
```

Each major section corresponds to one or more steps in this logic.

### Section Relationships

**Getting Started → Everything Else.** Provides the conceptual vocabulary and intuition needed to understand any other section. Key insight: "Delegation risk is quantifiable using probability × damage, summed across harm modes." Without this foundation, the math in Delegation Risk will seem arbitrary and the patterns in Design Patterns will seem unmotivated.

**Delegation Risk ↔ Power Dynamics.** Complementary quantification approaches. Delegation Risk asks "How much harm could happen?"; Power Dynamics asks "How much capability does each component have?" Together they answer: "What's the worst-case if this component defects, and how likely is that?"

```mermaid
flowchart LR
    DR[Delegation Risk<br/>P × D = Expected Harm]
    PD[Power Dynamics<br/>Capability + Misalignment]

    DR --> Combined[Combined Risk Score]
    PD --> Combined
```

**Entanglements → Design Patterns.** Problem definition → solution catalog. Entanglements explains why naive safety approaches fail—components that seem independent actually share failure modes, creating correlated risks that multiply. Design Patterns provides solutions that work given entanglement constraints.

:::tip
If you read Design Patterns without understanding Entanglements, you'll miss why certain patterns (like diverse verification) are necessary.
:::

**Theory Sections → Case Studies.** Abstract concepts → concrete examples. Each case study illustrates concepts from the theory sections:

| Case Study | Illustrates |
|------------|-------------|
| Sydney | Constraint failures, harm mode analysis |
| Code Review Bot | Design patterns in practice |
| Nuclear Safety | Cross-domain method applicability |
| Financial Failures | Entanglement risks |

**Cross-Domain Methods → Everything.** External validation and borrowed techniques. Shows that delegation risk isn't novel—nuclear safety, finance, and other fields have grappled with similar problems for decades. This provides proven techniques to adapt, historical examples of what works (and fails), and confidence that risk budgeting is achievable.

**Research → Experimental.** Theoretical foundations → practical tools. Research provides the academic grounding (linear logic for consumable resources, mechanism design for incentive compatibility, formal verification limits); Experimental makes these practical (Squiggle distributions, calibration tools, Monte Carlo analysis).

### Why This Order

**Why theory before application?** You could jump straight to Design Patterns, and many readers do. But without theory, patterns seem like arbitrary rules rather than principled solutions, you won't know which patterns apply to your situation, and you'll miss dangerous edge cases the patterns are designed for. The theory sections exist to make pattern selection principled rather than guesswork.

**Why Entanglements gets its own section.** Entanglement is subtle enough that it deserves extended treatment. Many systems that look safe under independence assumptions become dangerous when components share failure modes. The "Independence Illusion" diagram in the Entanglements index illustrates why this matters:

```mermaid
flowchart LR
    subgraph Illusion["Independence Illusion"]
        A1[Verifier A]
        A2[Verifier B]
        A3[Verifier C]
        A1 -.->|"Seem<br/>independent"| Safe1[✓ Safe]
        A2 -.-> Safe1
        A3 -.-> Safe1
    end

    subgraph Reality["Entangled Reality"]
        B1[Verifier A]
        B2[Verifier B]
        B3[Verifier C]
        SharedFailure[Shared<br/>Failure Mode]
        B1 --> SharedFailure
        B2 --> SharedFailure
        B3 --> SharedFailure
        SharedFailure --> Unsafe[✗ Unsafe]
    end
```

**Why case studies are application, not theory.** Case studies aren't about proving the theory—they're about showing how to apply it. Each is a worked example: here's a real (or realistic) system, here's how delegation risk analysis applies, here's what we learn about design. This is why Case Studies depends on both Theory and Design Patterns.

### Common Reading Mistakes

- **Jumping to Design Patterns** — You implement patterns without understanding why they work, applying them incorrectly or in the wrong situations. *Fix:* Read at least Core Concepts first.
- **Skipping Entanglements** — You assume your verification layers are independent, leading to correlated failures that bypass all your safety measures. *Fix:* Read Entanglements before finalizing architecture.
- **Reading Research first** — You get lost in theory without practical grounding and can't connect abstract concepts to real systems. *Fix:* Read Theory and Application sections first.
- **Only reading Case Studies** — You learn specific examples but not general principles, and can't apply lessons to your different situation. *Fix:* Use case studies to reinforce, not replace, theory.

---

## See Also

- [Site Map](/reference/site-map/) — Visual map of all content
- [Glossary](/getting-started/glossary/) — Term definitions
- [FAQ](/getting-started/faq/) — Common questions
