---
title: "Implementation Decision Guide"
sidebar:
  order: 1
---

# Implementation Decision Guide

Practical decision trees for applying the framework. Use these when designing a new system or evaluating an existing one.

## Decision Tree 1: Choosing Component Implementation

For each component, work through this tree:

```mermaid
flowchart TD
    Start[New Component] --> Q1{Can behavior be<br/>formally specified?}
    Q1 -->|Yes| Q2{Is it safety-critical?}
    Q1 -->|No| Q5{Is domain narrow<br/>and well-defined?}

    Q2 -->|Yes| Formal[Formally Verified Code]
    Q2 -->|No| Code[Regular Tested Code]

    Q5 -->|Yes| Q6{Do you have<br/>training data?}
    Q5 -->|No| Q7{Can you write<br/>comprehensive evals?}

    Q6 -->|Yes| FineTune[Fine-tuned Narrow Model]
    Q6 -->|No| Q7

    Q7 -->|Yes| Constrained[Constrained General LLM]
    Q7 -->|No| Q8{Is creativity<br/>the goal?}

    Q8 -->|Yes| Base[Base LLM + heavy monitoring]
    Q8 -->|No| Rethink[Rethink: decompose further<br/>or add human-in-loop]
```

### Implementation Recommendations by Type

| Decision | Implementation | Delegation Risk Multiplier | Examples |
|----------|---------------|----------------|----------|
| Formally Verified | Coq, Isabelle, TLA+ | 0.1x | Access control, invariants |
| Regular Code | Python, Rust with tests | 0.3x | Parsers, validators, routing |
| Fine-tuned Narrow | 7B model, task-specific | 0.5x | Summarization, classification |
| Constrained General | GPT-4 + prompts + evals | 1.0x | Code review, gap analysis |
| Base LLM | Frontier model | 2.0x | Hypothesis generation |

**The multiplier**: Rough factor for how much the implementation choice affects Delegation Risk. Formal verification ~10x safer than base LLM for equivalent tasks.

---

## Decision Tree 2: Coordinator Design

Should your coordinator use an LLM or pure code?

```mermaid
flowchart TD
    Start[Coordinator Design] --> Q1{Is coordination logic<br/>fully specifiable as rules?}
    Q1 -->|Yes| Code[Pure Verified Code<br/>No LLM needed]
    Q1 -->|No| Q2{Are failures<br/>immediately reversible?}

    Q2 -->|Yes| Q3{Is human oversight<br/>feasible for all decisions?}
    Q2 -->|No| Conservative[Conservative: Code + Human<br/>No autonomous LLM coordination]

    Q3 -->|Yes| Advisory[LLM Advisory Only<br/>Human decides]
    Q3 -->|No| Q4{Can you afford<br/>N-version redundancy?}

    Q4 -->|Yes| Redundant[Multiple LLM Coordinators<br/>Consensus required]
    Q4 -->|No| Decompose[Decompose further<br/>Reduce coordinator scope]
```

### Coordinator Implementation Matrix

| Stakes | Reversibility | Recommended Approach |
|--------|---------------|---------------------|
| Low | Easy | Single LLM coordinator OK |
| Low | Hard | LLM + automatic rollback |
| High | Easy | LLM advisory + human approval |
| High | Hard | Code only OR N-version + human gate |

---

## Decision Tree 3: Delegation Risk Budget Allocation

How to allocate your system's delegation risk budget across components:

```mermaid
flowchart TD
    Start[System Delegation Risk Budget] --> Step1[1. List all components]
    Step1 --> Step2[2. Identify failure modes per component]
    Step2 --> Step3[3. Estimate P × Damage for each]
    Step3 --> Q1{Total < Budget?}

    Q1 -->|Yes| Done[✓ Within budget<br/>Proceed to implementation]
    Q1 -->|No| Q2{Which component<br/>has highest Delegation Risk?}

    Q2 --> Mitigate[Mitigate highest-Delegation Risk component]
    Mitigate --> M1{Can reduce P?}
    M1 -->|Yes| ReduceP[Add verification/redundancy]
    M1 -->|No| M2{Can reduce Damage?}

    M2 -->|Yes| ReduceD[Reduce permissions/scope]
    M2 -->|No| M3{Can decompose?}

    M3 -->|Yes| Decompose[Split into smaller components]
    M3 -->|No| Human[Add human-in-loop]

    ReduceP --> Step3
    ReduceD --> Step3
    Decompose --> Step3
    Human --> Step3
```

### Budget Allocation Heuristics

| Component Type | Typical Delegation Risk Share | Justification |
|----------------|-------------------|---------------|
| Coordinators | 20-30% | High leverage, needs headroom |
| High-capability LLMs | 30-40% | Inherently less predictable |
| Verified code | 5-10% | Low risk, give small budget |
| Human-gated actions | 20-30% | Human absorbs residual risk |

---

## Decision Tree 4: When to Add Redundancy

```mermaid
flowchart TD
    Start[Component Design] --> Q1{Is component<br/>safety-critical?}
    Q1 -->|No| Single[Single implementation OK]
    Q1 -->|Yes| Q2{Can behavior be<br/>formally verified?}

    Q2 -->|Yes| Verified[Formal verification<br/>Single implementation]
    Q2 -->|No| Q3{Is common-cause<br/>failure likely?}

    Q3 -->|Yes| Diverse[N-version with<br/>DIVERSE implementations]
    Q3 -->|No| Q4{What's acceptable<br/>false-negative rate?}

    Q4 -->|<1%| Triple[3+ implementations<br/>Unanimous agreement]
    Q4 -->|1-10%| Double[2 implementations<br/>Both must agree]
    Q4 -->|>10%| Single2[Single + monitoring]
```

### Redundancy Configurations

| Config | Implementations | Agreement | Tolerates |
|--------|-----------------|-----------|-----------|
| 2-of-2 | 2 | Both agree | 0 failures |
| 2-of-3 | 3 | Majority | 1 failure |
| 3-of-4 | 4 | Super-majority | 1 Byzantine |
| 4-of-5 | 5 | Super-majority | 1 Byzantine + 1 crash |

**Byzantine**: Assumes adversarial/arbitrary behavior, not just crashes.

---

## Decision Tree 5: Human-in-the-Loop Placement

Where should humans approve decisions?

```mermaid
flowchart TD
    Start[Action Point] --> Q1{Is action<br/>reversible in <1hr?}
    Q1 -->|Yes| Q2{Is damage from<br/>mistake < $1000?}
    Q1 -->|No| Human[Human approval required]

    Q2 -->|Yes| Auto[Autonomous OK<br/>Log for audit]
    Q2 -->|No| Q3{Is action<br/>time-sensitive?}

    Q3 -->|Yes| Q4{Can you batch<br/>similar actions?}
    Q3 -->|No| Human

    Q4 -->|Yes| Batch[Batch approval<br/>Human reviews set]
    Q4 -->|No| Async[Async approval<br/>Time-locked execution]
```

### Human Oversight Patterns

| Pattern | Latency | Throughput | Use When |
|---------|---------|------------|----------|
| Sync approval | High | Low | High-stakes, rare actions |
| Async approval | Medium | Medium | Important but not urgent |
| Batch approval | Low | High | Many similar low-stakes actions |
| Audit-only | None | Unlimited | Low-stakes, reversible |

---

## Quick Decision Checklist

For each component, answer:

- [ ] **Implementation**: Code, narrow model, or general LLM?
- [ ] **Risk budget**: What Delegation Risk allocation?
- [ ] **Redundancy**: Single, double, or N-version?
- [ ] **Human gate**: Approval required, async, batch, or audit-only?
- [ ] **Monitoring**: What metrics trigger alerts?
- [ ] **Rollback**: How to undo if problems detected?

For the system as a whole:

- [ ] **Total Delegation Risk**: Sum of components < budget?
- [ ] **Concentration**: No single component > 50% of budget?
- [ ] **Coordinator**: Appropriate constraints applied?
- [ ] **Verification**: How will you validate trust assumptions?

---

## Example: Applying Decision Trees

**Scenario**: Building a customer support bot that can issue refunds.

**Component: Refund Issuer**
1. **Implementation tree**: Can't formally specify (customer situations vary) → Domain narrow? Yes (refunds only) → Have training data? Yes → **Fine-tuned narrow model**
2. **Risk budget**: Refund mistakes = moderate damage (~$100 avg) → Medium Delegation Risk allocation
3. **Redundancy tree**: Safety-critical? Yes (money involved) → Formally verified? No → **2-of-2 with different models**
4. **Human gate tree**: Reversible? Yes (can reverse refund) → Damage < $1000? Usually → **Audit-only for small refunds, approval for large**

**Result**: Two fine-tuned models must agree, small refunds auto-approved with logging, large refunds require human approval.

---

## See Also

- [Research Assistant Example](/design-patterns/examples/research-assistant-example/) — Full worked example
- [Code Deployment Example](/design-patterns/examples/code-deployment-example/) — Higher-stakes example
- [Principles to Practice](/design-patterns/principles-to-practice/) — Mapping principles to implementations
