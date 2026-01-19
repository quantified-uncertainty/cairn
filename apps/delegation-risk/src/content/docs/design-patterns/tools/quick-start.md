---
title: "Quick Start"
sidebar:
  order: 0
---

# Quick Start: Applying the Framework

A practical checklist for applying the AI Safety Framework to a new system. Complete these steps in order.

## Phase 1: Scope and Budget (1-2 hours)

### 1.1 Define System Boundaries

- [ ] What is the system's primary task?
- [ ] What actions can the system take?
- [ ] What data does it have access to?
- [ ] Who are the human principals (users, operators, admins)?

### 1.2 Set Risk Tolerance

- [ ] What's the worst realistic outcome?
- [ ] What damage would that cause? ($ or equivalent)
- [ ] What's acceptable expected damage per month? → **This is your Delegation Risk budget**

**Typical budgets**:
| System Type | Suggested Delegation Risk Budget |
|-------------|---------------------|
| Internal tools, recoverable | $500-2,000/month |
| Customer-facing, monitored | $2,000-10,000/month |
| High-stakes, autonomous | $10,000-50,000/month |
| Safety-critical | Consult specialists |

### 1.3 Identify Components

List every component that will exist:
- [ ] What does each component do?
- [ ] What inputs does it receive?
- [ ] What outputs does it produce?
- [ ] What actions can it take?

---

## Phase 2: Risk Assessment (2-4 hours)

### 2.1 Failure Mode Analysis

For each component, complete this table:

| Component | Failure Mode | P(failure) | Damage | Delegation Risk |
|-----------|--------------|------------|--------|-----|
| _name_ | _what could go wrong_ | _estimate_ | _$_ | P × D |
| | | | | |
| | | | | |

**Guidance for estimates**:
- P = 0.1 (10%): Happens regularly without mitigation
- P = 0.01 (1%): Occasional, seen in testing
- P = 0.001 (0.1%): Rare, but plausible
- P = 0.0001 (0.01%): Very rare, requires adversarial action

### 2.2 Sum and Compare

- [ ] Total component Delegation Risks: $______
- [ ] Budget: $______
- [ ] **Within budget?** Yes / No

If no: proceed to Phase 3 for mitigation. If yes: proceed to Phase 4.

---

## Phase 3: Risk Mitigation (iterate until within budget)

### 3.1 Identify Highest-Delegation Risk Component

Which component contributes most to total Delegation Risk? → **Focus here first**

### 3.2 Choose Mitigation Strategy

| Strategy | Effect | Example |
|----------|--------|---------|
| **Add verification** | Reduce P(failure) | Code checker before deploy |
| **Reduce permissions** | Reduce Damage | Read-only instead of read-write |
| **Add redundancy** | Reduce P(failure) | Two models must agree |
| **Add human gate** | Reduce P(failure) | Require approval for high-stakes |
| **Decompose** | Reduce Damage per component | Split into smaller pieces |

### 3.3 Re-estimate and Repeat

- [ ] Update Delegation Risk estimates with mitigation
- [ ] Still over budget? → Mitigate next-highest component
- [ ] Within budget? → Proceed to Phase 4

---

## Phase 4: Apply Principles (1-2 hours)

### 4.1 Component Principles Checklist

For each component, verify:

| Principle | Question | Answer |
|-----------|----------|--------|
| Least Intelligence | Is this the dumbest implementation that works? | |
| Least Privilege | Does it have only necessary permissions? | |
| Least Context | Does it know only what it needs? | |
| Least Persistence | Is it stateless between invocations? | |
| Least Autonomy | Is human oversight proportionate to risk? | |
| Least Surprise | Is behavior deterministic/predictable? | |
| Least Connectivity | Are communication paths minimized? | |

### 4.2 Coordinator Constraints (if applicable)

If your system has a coordinator component:

- [ ] Does it route rather than directly cause outcomes?
- [ ] Does it work through intermediaries?
- [ ] Is communication structured (not natural language)?
- [ ] Is planning horizon limited?
- [ ] Is it stateless between invocations?
- [ ] Is there redundancy or verification?

---

## Phase 5: Implementation Choices (2-4 hours)

### 5.1 Choose Implementation for Each Component

Use the [Decision Guide](/design-patterns/tools/decision-guide/) for details.

| Component | Implementation | Justification |
|-----------|---------------|---------------|
| _name_ | Code / Narrow Model / General LLM | _why_ |
| | | |

**Rule of thumb**: Default to verified code or narrow models. Only use general LLMs when creativity/flexibility is required.

### 5.2 Design Redundancy

For safety-critical components:
- [ ] Which components need N-version redundancy?
- [ ] Are implementations diverse (different architectures)?
- [ ] What agreement threshold (unanimous, majority)?

### 5.3 Place Human Gates

- [ ] Which actions require human approval?
- [ ] Sync, async, or batch approval?
- [ ] What information does the human see to decide?

---

## Phase 6: Monitoring and Rollback (1-2 hours)

### 6.1 Define Monitoring

For each component:
- [ ] What metrics indicate problems?
- [ ] What thresholds trigger alerts?
- [ ] What thresholds trigger automatic shutdown?

### 6.2 Design Rollback

- [ ] How do you undo actions if problems detected?
- [ ] What's the maximum time to detect and rollback?
- [ ] Are there actions that can't be rolled back? → Extra scrutiny needed

### 6.3 Plan Verification

- [ ] How will you test that Delegation Risk estimates are accurate?
- [ ] What data will you collect in production?
- [ ] When will you re-assess the risk analysis?

---

## Phase 7: Document and Review (1-2 hours)

### 7.1 Create Trust Ledger

Document:
- [ ] System architecture diagram
- [ ] Component Delegation Risk budgets
- [ ] Trust relationships (who delegates to whom)
- [ ] Human approval gates
- [ ] Monitoring thresholds

### 7.2 Review Checklist

Before deployment:
- [ ] Total Delegation Risk within budget
- [ ] All principles applied to each component
- [ ] Coordinator constraints verified (if applicable)
- [ ] Redundancy in place for critical components
- [ ] Human gates at appropriate points
- [ ] Monitoring and alerting configured
- [ ] Rollback procedures tested
- [ ] Documentation complete

---

## Quick Reference Card

### Delegation Risk Formula
```
Delegation Risk = Σ P(outcome) × Damage(outcome)
```

### Risk Inheritance (Multiplicative)
```
Trust(A→C via B) = Trust(A→B) × Trust(B→C)
```

### Verifiability Hierarchy
```
Verified Code > Regular Code > Narrow Models > Constrained LLMs > Base LLMs > RL
```

### Key Questions
1. What's the worst that could happen?
2. How likely is it?
3. Can I make it less likely (verification, redundancy)?
4. Can I make it less bad (reduce permissions, add gates)?
5. How will I know if it's happening (monitoring)?
6. How will I stop it (rollback, circuit breakers)?

### Interactive Tools

Use these calculators to run the numbers:

- **[Delegation Risk Calculator](/design-patterns/tools/delegation-risk-calculator/)** — Input failure modes, get total Delegation Risk
- **[Risk Inheritance](/design-patterns/tools/trust-propagation/)** — Compute effective trust through networks
- **[Tradeoff Frontier](/design-patterns/tools/tradeoff-frontier/)** — Explore capability vs. safety tradeoffs

---

## Example: 30-Minute Assessment

**System**: Slack bot that answers employee questions using internal docs

**Phase 1** (5 min):
- Task: Answer questions from internal knowledge base
- Actions: Read docs, post messages
- Budget: $1,000/month (internal tool, recoverable)

**Phase 2** (10 min):
- Components: Retriever, Answerer, Poster
- Failure modes:
  - Retriever returns wrong docs: P=0.05, D=$100 → DR=$5
  - Answerer hallucinates: P=0.1, D=$500 → DR=$50
  - Answerer leaks sensitive info: P=0.01, D=$10,000 → DR=$100
  - Poster spam: P=0.001, D=$1,000 → DR=$1
- Total: $156/month ✓ Within budget

**Phase 4** (10 min):
- Least Intelligence: Answerer could be smaller model ✓
- Least Context: Answerer doesn't see user identity ✓
- Least Persistence: Stateless ✓

**Phase 5** (5 min):
- Retriever: Code (vector search)
- Answerer: Fine-tuned 7B (narrow task)
- Poster: Code (rate limited)

**Result**: Simple, low-risk system. No redundancy needed. Monitor for hallucination rate.

---

## Next Steps

- [Decision Guide](/design-patterns/tools/decision-guide/) — Detailed decision trees
- [Research Assistant Example](/design-patterns/examples/research-assistant-example/) — Full worked example
- [Principles to Practice](/design-patterns/principles-to-practice/) — Mapping principles to implementations
