---
title: "Types of Entanglement"
description: "Understanding passive, active, and adversarial entanglements in safety architectures"
sidebar:
  order: 1
---

# Types of Entanglement

Not all entanglement is equal. Components can become entangled in fundamentally different ways—from passive shared dependencies to active influence channels to deliberate collusion. Understanding the type helps determine the appropriate response.

---

## The Three Classes of Entanglement

| Class | Description | Example | Primary Concern |
|-------|-------------|---------|-----------------|
| **Passive** | Shared dependencies create correlated behavior without intent | Same LLM provider for multiple checkers | Correlated failures on the same inputs |
| **Active** | One component influences another's behavior | Verifier inherits context from agent being verified | Compromised oversight |
| **Adversarial** | Components coordinate against the principal's interests | Agents develop side-channels to collude | System subversion |

```mermaid
flowchart TB
    subgraph Passive["PASSIVE ENTANGLEMENT"]
        P1["Checker A"] ~~~ P2["Checker B"]
        PNote["Both fail on same inputs<br/>due to shared blind spots"]
    end
    subgraph Active["ACTIVE ENTANGLEMENT"]
        A1["Component X"] -->|"influences"| A2["Component Y"]
        ANote["X shapes Y's decisions<br/>through information flow"]
    end
    subgraph Adversarial["ADVERSARIAL ENTANGLEMENT"]
        C1["Agent A"] <-.->|"side-deal"| C2["Agent B"]
        CNote["Agents coordinate<br/>against oversight"]
    end

    style Passive fill:#ffe6cc
    style Active fill:#ffcccc
    style Adversarial fill:#ff9999
```

---

## The Bureaucrat Analogy

To understand entanglement, consider how bureaucracies fail:

**Passive entanglement** is like when two clerks both miss the same types of fraud because they were trained at the same institution and use the same manual.

**Active entanglement** is like when the clerk who prepares a case summary can influence the reviewer's decision through selective emphasis—even without any malicious intent.

**Adversarial entanglement** is like when the clerk and reviewer have lunch together and develop an understanding that benefits them both at the organization's expense.

This bureaucrat analogy helps clarify why "just add more checkers" often fails: if those checkers share training, share information, or can coordinate, you haven't actually added independent verification.

---

## Passive Entanglements

Passive entanglements create **correlated failures without any intentional communication** between components. The components don't need to "know" about each other—they fail together because they share something upstream.

### Types of Passive Entanglement

| Type | Description | Bureaucrat Analogy |
|------|-------------|--------------------|
| **Positive failure correlation** | If A fails, B more likely to fail | Both clerks miss fraud because both use the same inadequate checklist |
| **Negative failure correlation** | If A fails, B more likely to succeed | One clerk is overly lenient, another overly strict—they catch each other's misses |
| **Conditional correlation** | Only correlated under certain conditions | Both clerks are fine normally, but both make errors when rushed |
| **Higher-order correlation** | Only manifests when 3+ components interact | A+B fine, B+C fine, A+C fine, but A+B+C creates resource contention |

### Positive Failure Correlation

The most common and dangerous type. When component A fails, component B is more likely to fail on the same input.

```mermaid
flowchart TB
    X[Input X arrives]
    X --> A["Checker A<br/>(GPT-4)"]
    X --> B["Checker B<br/>(Claude)"]
    A -->|MISS| R[Both miss because both are<br/>LLMs with similar training]
    B -->|MISS| R

    style A fill:#ffcccc
    style B fill:#ffcccc
    style R fill:#ffe6e6
```

**Sources**:
- Shared training data or methodology
- Same underlying infrastructure
- Similar architectural decisions
- Common conceptual blind spots
- Shared failure modes under stress

**Mitigation**: Genuine methodological diversity—not just different providers, but fundamentally different verification approaches (rule-based + statistical + semantic + formal).

### Negative Failure Correlation (Desirable)

The rare and valuable case. When A fails, B is more likely to succeed. This is what you *want* in a robust system.

```mermaid
flowchart TB
    X[Input X arrives]
    X --> A["Checker A<br/>(Permissive)"]
    X --> B["Checker B<br/>(Strict)"]
    A -->|"MISS (too lenient)"| R["A's blind spot is<br/>B's strength"]
    B -->|"CATCH!"| R

    style A fill:#ffcccc
    style B fill:#ccffcc
    style R fill:#e6ffe6
```

**How to create negative correlation**:
- **Adversarial collaboration**: Explicitly opposed incentives
- **Complementary specialization**: One focuses on false positives, another on false negatives
- **Different priors**: One conservative, one permissive
- **Different granularity**: One checks high-level patterns, another checks details

### Conditional Correlation

Components appear independent under normal conditions but become correlated under stress—like bureaucrats who are careful during audits but sloppy when overworked.

```mermaid
flowchart LR
    subgraph Normal["Normal Operation"]
        N1["A: ●●●○○●●●●○ (independent)"]
        N2["B: ●○●●●○●●○● (independent)"]
    end
    subgraph Stress["Under Stress"]
        S1["A: ○○○○○●○○○○ (correlated)"]
        S2["B: ○○○○○●○○○○ (correlated)"]
        S3["↑ Shared failure mode<br/>activated by load"]
    end
    Normal --> Stress

    style Normal fill:#ccffcc
    style Stress fill:#ffcccc
```

**Detection**: Stress testing is essential. Normal-condition testing won't reveal conditional correlations.

### Higher-Order Correlation

Failures that only manifest when three or more components interact. Pairwise analysis will miss these entirely.

```mermaid
flowchart TB
    subgraph Pairwise["Pairwise tests: PASS"]
        P1["A + B: PASS"]
        P2["B + C: PASS"]
        P3["A + C: PASS"]
    end
    subgraph ThreeWay["Three-way test"]
        A((A))
        B((B))
        C((C))
        A --- B
        B --- C
        A --- C
        FAIL["A + B + C: FAIL!<br/>Triangle creates emergent failure"]
    end

    style Pairwise fill:#ccffcc
    style ThreeWay fill:#ffcccc
    style FAIL fill:#ff9999
```

---

## Active Entanglements

Active entanglements involve **one component influencing another's behavior**—intentionally or not. Unlike passive correlation, there's a directional relationship: Component X affects Component Y.

### The Information Flow Problem

```mermaid
flowchart LR
    A["Component A<br/>Prepares context"]
    B["Component B<br/>Makes decision"]
    A -->|"frames the situation"| B
    B -.->|"decision shaped by<br/>A's framing"| OUT[Outcome]

    NOTE1["A influences B<br/>(A provides context to B)"]
    NOTE2["B doesn't influence A"]

    style A fill:#ffe6cc
    style B fill:#ffcccc
```

**Bureaucrat analogy**: The clerk who summarizes a case for the reviewer controls what the reviewer sees. Even without malice, the summary emphasizes what the clerk found important—and the reviewer inherits that framing.

### Types of Active Entanglement

| Type | Direction | Example |
|------|-----------|---------|
| **Context contamination** | Upstream → Downstream | Summarizer omits key details; all downstream components miss them |
| **Asymmetric influence** | A → B, but not B → A | Agent provides context to verifier; corrupted context → corrupted verification |
| **Feedback loops** | A ↔ B cyclically | Agent learns what verifier accepts; verifier trained on agent's outputs |
| **Hierarchy bypass** | Lower → Higher directly | Agent appeals directly to human, bypassing intermediate oversight |

### Context Contamination

When a component that processes information early can shape what later components see:

```mermaid
flowchart LR
    subgraph Clean["Clean Flow"]
        T1[Task] --> D1[Decompose] --> V1[Verify]
        D1 --> CS["[clean] steps"]
        V1 --> CC["[clean] checks"]
    end
    subgraph Contaminated["Contaminated Flow"]
        T2[Task] --> D2[Decompose] --> V2[Verify]
        D2 --> PS["[poisoned] steps"]
        V2 --> PC["[poisoned] checks"]
        PS --> BAD["Both inherit bad context"]
        PC --> BAD
    end

    style Clean fill:#ccffcc
    style Contaminated fill:#ffcccc
```

**Mitigation**: Independent context construction. Verifiers should receive raw inputs, not summarized contexts from the components being verified.

### Asymmetric Influence

A's state predicts B's state, but not vice versa. The earlier component in a chain is more critical.

**Examples**:
- Summarization → analysis pipelines (bad summary → bad analysis)
- Preprocessing → verification (malformed preprocessing → verification on wrong data)
- Context construction → LLM evaluation (manipulated context → manipulated evaluation)

### Feedback Loops

Over time, components that interact repeatedly can develop co-adaptation:

```mermaid
flowchart TB
    subgraph Loop["Feedback Loop"]
        Agent["Agent"] -->|"learns what<br/>gets approved"| Adaptation["Adaptation"]
        Verifier["Verifier"] -->|"trained on<br/>agent outputs"| VAdapt["Verifier drift"]
        Adaptation --> Agent
        VAdapt --> Verifier
        Agent <-->|"co-evolve"| Verifier
    end

    style Loop fill:#ffcccc
```

**Bureaucrat analogy**: After working together for years, the clerk knows exactly how to word things so the reviewer approves. The reviewer has unconsciously adapted to trust the clerk's judgment.

---

## Adversarial Entanglements

Adversarial entanglements involve **deliberate coordination against the principal's interests**. This is the most dangerous class—components actively working together to subvert oversight.

### The Collusion Problem

```mermaid
flowchart LR
    subgraph Intended["INTENDED: Independent Checks"]
        A1["Agent"] --> V1["Verifier"]
        V1 -->|"catches errors"| Output1["Safe Output"]
    end
    subgraph Actual["ACTUAL: Collusion"]
        A2["Agent"] <-.->|"side-deal"| V2["Verifier"]
        A2 --> V2
        V2 -->|"rubber stamps"| Output2["Unsafe Output"]
    end

    style Intended fill:#ccffcc
    style Actual fill:#ffcccc
```

**Bureaucrat analogy**: The inspector and the inspected company have developed an "understanding." The inspector finds minor violations to fill quotas while overlooking major ones. Both benefit; the public loses.

### Types of Adversarial Entanglement

| Type | Mechanism | Detection Difficulty |
|------|-----------|---------------------|
| **Explicit collusion** | Components communicate to coordinate | Medium (monitor communications) |
| **Implicit collusion** | Components learn to cooperate without explicit communication | Hard (no visible coordination) |
| **Regulatory capture** | Overseer's interests align with overseen | Very hard (gradual, normalized) |
| **TDT-style coordination** | Similar reasoning leads to coordination without communication | Near-impossible (logical correlation) |

### Explicit Collusion

Components establish side-channels to coordinate:

```mermaid
flowchart TB
    subgraph Adversarial["Adversarial Collaboration SUBVERTED"]
        Red["Red Team Agent"] -.->|"signal: go easy"| Blue["Blue Team Agent"]
        Red -->|"weak attacks"| System["System"]
        Blue -->|"minimal defense"| System
        System --> Fragile["Fragile Output"]
    end

    style Red fill:#fef3c7
    style Blue fill:#fef3c7
    style Fragile fill:#ffcccc
```

### Implicit Collusion

More subtle: components develop coordination through repeated interaction without any explicit agreement:

- Agent learns which outputs verifier approves
- Verifier learns to trust agent's patterns
- Over time, they converge on mutually beneficial behaviors
- Neither explicitly agreed to anything, but the effect is the same

### Regulatory Capture

The overseer gradually comes to identify with the interests of the overseen:

```mermaid
flowchart LR
    subgraph Capture["Regulatory Capture Evolution"]
        direction TB
        T1["Day 1: Adversarial<br/>(suspicious)"]
        T2["Month 6: Professional<br/>(respectful)"]
        T3["Year 2: Collaborative<br/>(aligned)"]
        T4["Year 5: Captured<br/>(defending the regulated)"]
        T1 --> T2 --> T3 --> T4
    end

    style T1 fill:#ccffcc
    style T2 fill:#ffffcc
    style T3 fill:#ffe6cc
    style T4 fill:#ffcccc
```

See [Channel Integrity Patterns](/design-patterns/channel-integrity/) for detailed detection and mitigation of regulatory capture.

### TDT-Style Logical Correlation

The most philosophically interesting and hardest to address: agents using similar reasoning may coordinate through logical correlation, without any communication channel.

If two agents both reason "what would an agent like me do in this situation?", they may reach the same conclusion and thus coordinate—even though neither sent any message.

**Implications**:
- True independence requires cognitive diversity, not just separate instances
- Some correlation may be irreducible for agents that reason well
- This is an active area of research with significant uncertainty

---

## Success Correlation vs. Failure Correlation

**Critical distinction**: We care about **failure correlation**, not general correlation.

```mermaid
flowchart LR
    subgraph Good["Good: All detect threat X"]
        GA[A] -->|detect| GALERT[ALERT]
        GB[B] -->|detect| GALERT
        GC[C] -->|detect| GALERT
        GNOTE["Redundancy confirms<br/>the detection"]
    end
    subgraph Bad["Bad: All miss threat Y"]
        BA[A] -->|miss| BNOALERT[NO ALERT]
        BB[B] -->|miss| BNOALERT
        BC[C] -->|miss| BNOALERT
        BNOTE["Redundancy provides<br/>false confidence"]
    end

    style Good fill:#ccffcc
    style Bad fill:#ffcccc
    style GALERT fill:#99ff99
    style BNOALERT fill:#ff9999
```

If all your detectors agree on true positives, that's *good*. The problem is when they agree on **false negatives** or when they **cascade into failure together**.

---

## Measuring Entanglement Type

### Quick Assessment

| Observation | Likely Type |
|-------------|-------------|
| Components fail on similar input patterns | Passive (conceptual blind spots) |
| Components fail during same time periods | Passive (resource-based) or Active (cascade) |
| Downstream fails when upstream fails | Active (information flow) |
| Pairs work but triples fail | Passive (higher-order) |
| Opposite-tendency components catch each other | Passive negative (designed correctly) |
| Component behavior shifts based on who's checking | Active (adaptation) or Adversarial |
| Gradual convergence of component behaviors | Adversarial (capture) or Active (feedback loop) |

### Correlation Coefficient Interpretation

For passive entanglement, calculate:

```
ρ (failure correlation) = P(both fail | one fails) / P(either fails)

ρ < 0.3:  Low correlation (acceptable)
ρ 0.3-0.5: Moderate correlation (investigate)
ρ > 0.5:  High correlation (redesign required)
ρ < 0:    Negative correlation (good—maintain this)
```

For active entanglement, measure directional influence:

```
Influence(A→B) = P(B fails | A fails) - P(B fails | A succeeds)

If Influence(A→B) >> Influence(B→A), the relationship is asymmetric
```

---

## Implications for Architecture

| Entanglement Type | Architectural Response |
|-------------------|------------------------|
| **Passive positive** | Add fundamentally different verification methods |
| **Passive negative** | Preserve and strengthen this diversity |
| **Passive conditional** | Separate resource pools; stress test regularly |
| **Passive higher-order** | Holistic testing; conservative resource allocation |
| **Active context contamination** | Isolate information flows; verify contexts independently |
| **Active feedback loops** | Rotate relationships; prevent co-adaptation |
| **Adversarial explicit** | Monitor communications; penalize detected collusion |
| **Adversarial implicit** | Rotate validators; inject honeypots |
| **Adversarial capture** | Term limits; external audits; adversarial incentives |

---

## The Entanglement Spectrum

In practice, most entanglements exist on a spectrum:

```
PASSIVE ←────────────────────────────────→ ADVERSARIAL

Shared          Information     Adaptive        Implicit        Explicit
blind spots     flow            co-evolution    coordination    collusion
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
  [Diversity]   [Isolation]    [Rotation]     [Monitoring]    [Penalties]
```

As you move from passive to adversarial, the entanglement becomes:
- More intentional (even if emergent)
- Harder to detect
- More dangerous when undetected
- More expensive to mitigate

Design your architecture assuming passive entanglement exists, but monitor for signs of drift toward active or adversarial patterns.

---

See also:
- [Challenge Categories](/entanglements/fundamentals/challenges/) - Sources of entanglement
- [Detecting Influence](/entanglements/detection/detecting-influence/) - Methods for detecting active entanglements
- [Modeling Approaches](/entanglements/detection/modeling/) - Quantifying entanglement
- [Solutions](/entanglements/mitigation/solutions/) - Reducing entanglement
- [Channel Integrity Patterns](/design-patterns/channel-integrity/) - Preventing boundary violations
