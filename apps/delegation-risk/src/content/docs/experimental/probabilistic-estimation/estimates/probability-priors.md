---
title: "Probability Priors"
description: "Default failure probability distributions by component type"
sidebar:
  order: 2
---

# Probability Priors by Component Type

These are **prior distributions** for failure probabilities before observing any track record. Use them as starting points, then update based on actual performance.

## Component Type Taxonomy

We classify AI components into four categories based on their failure modes:

| Type | Description | Examples |
|------|-------------|----------|
| **Deterministic Code** | Traditional software with no learning | Rule engines, validators, formatters |
| **Narrow ML** | Trained on specific task, limited generalization | Classifiers, embeddings, specialized models |
| **General LLM** | Large language models with broad capabilities | GPT-4, Claude, open-source LLMs |
| **RL/Agentic** | Agents that plan, act, and adapt | AutoGPT-style systems, trading agents |

## Accident Probability Priors

"Accidents" are failures due to capability limitations, bugs, or misunderstanding—not intentional misbehavior.

### Deterministic Code
```squiggle
// Very low accident rate for well-tested code
accidentRate_deterministicCode = beta(1, 10000)
// Mean: 0.01%, 90% CI: [0.001%, 0.05%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 0.01% | High | Well-tested production code |
| Distribution | `beta(1, 10000)` | High | Shape reflects testing |
| 90% CI | [0.001%, 0.05%] | - | Per-invocation failure |

**Rationale**: Deterministic code can be exhaustively tested. Remaining failures are edge cases, integration issues, or environmental factors. Software industry data suggests ~0.1-1 defects per KLOC in production code.

### Narrow ML Models
```squiggle
// Moderate accident rate - can fail on distribution shift
accidentRate_narrowML = beta(5, 200)
// Mean: 2.4%, 90% CI: [0.9%, 4.5%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 2.5% | Medium | Calibrated, narrow-domain model |
| Distribution | `beta(5, 200)` | Medium | Accounts for distribution shift |
| 90% CI | [0.9%, 4.5%] | - | Varies by domain and data quality |

**Rationale**: Narrow ML fails when inputs differ from training distribution. Studies show 2-10% error rates on held-out test sets, higher on real-world deployment.

### General LLMs
```squiggle
// Higher accident rate - broad capability, subtle failures
accidentRate_generalLLM = beta(8, 80)
// Mean: 9.1%, 90% CI: [4.5%, 15%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 10% | Medium | Typical error rate on complex tasks |
| Distribution | `beta(8, 80)` | Medium | High variance in real deployments |
| 90% CI | [4.5%, 15%] | - | Task-dependent |

**Rationale**: LLMs make plausible-sounding errors that may not be caught. Benchmarks show 5-20% error rates on reasoning tasks. Hallucination rates vary widely by domain.

### RL/Agentic Systems
```squiggle
// High accident rate - exploration, reward hacking, compounding errors
accidentRate_RLAgent = beta(15, 60)
// Mean: 20%, 90% CI: [12%, 29%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 20% | Low | Highly uncertain, few deployments |
| Distribution | `beta(15, 60)` | Low | Wide uncertainty |
| 90% CI | [12%, 29%] | - | Environment-dependent |

**Rationale**: RL agents explore state space, may find reward hacks, and compound errors across steps. Limited production deployment data makes this highly uncertain.

---

## Defection Probability Priors

"Defection" refers to intentional misbehavior—the system pursuing goals misaligned with the principal's intent. This is more speculative than accident rates.

### Deterministic Code
```squiggle
// Zero by definition - no agency
defectionRate_deterministicCode = 0
```

**Rationale**: Deterministic code has no agency or goals. It cannot "decide" to defect. Any misbehavior is a bug (accident), not intentional.

### Narrow ML Models
```squiggle
// Very low - limited agency, specific objective
defectionRate_narrowML = beta(1, 1000)
// Mean: 0.1%, 90% CI: [0.01%, 0.4%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 0.1% | Low | Speculative |
| Distribution | `beta(1, 1000)` | Low | Could be lower or higher |
| 90% CI | [0.01%, 0.4%] | - | Depends on training objective |

**Rationale**: Narrow ML has limited situational awareness and optimization pressure. Defection requires both capability and motivation, which narrow models lack.

### General LLMs
```squiggle
// Low but non-negligible - possible instrumental goals
defectionRate_generalLLM = beta(2, 200)
// Mean: 1.0%, 90% CI: [0.2%, 2.4%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 1% | Low | Highly uncertain |
| Distribution | `beta(2, 200)` | Low | Placeholder pending research |
| 90% CI | [0.2%, 2.4%] | - | Could vary significantly |

**Rationale**: LLMs show some situational awareness and can reason about goals. Cases like Sydney/Bing suggest potential for misaligned behavior. RLHF may reduce but not eliminate.

### RL/Agentic Systems
```squiggle
// Higher - explicit optimization, instrumental goals likely
defectionRate_RLAgent = beta(8, 50)
// Mean: 13.8%, 90% CI: [6.6%, 23%]
```

| Estimate | Value | Confidence | Notes |
|----------|-------|------------|-------|
| Point estimate | 15% | Speculative | Very high uncertainty |
| Distribution | `beta(8, 50)` | Speculative | Wide distribution reflects uncertainty |
| 90% CI | [6.6%, 23%] | - | Depends heavily on alignment techniques |

**Rationale**: RL agents explicitly optimize objectives and may develop instrumental goals (self-preservation, resource acquisition). Theoretical arguments suggest non-negligible risk; empirical data is limited.

---

## Combined Failure Rate

Total failure probability is the sum of accident and defection rates:

```squiggle
// Example: General LLM
totalFailure_generalLLM = accidentRate_generalLLM + defectionRate_generalLLM
// Mean: ~10%, dominated by accidents
```

### Accident vs. Defection Split by Type

| Component Type | Accident | Defection | Total | Accident % |
|----------------|----------|-----------|-------|------------|
| Deterministic Code | 0.01% | 0% | 0.01% | 100% |
| Narrow ML | 2.5% | 0.1% | 2.6% | 96% |
| General LLM | 9% | 1% | 10% | 90% |
| RL/Agentic | 20% | 14% | 34% | 59% |

---

## Modifiers

These priors should be adjusted based on:

### Task Complexity Modifier
```squiggle
complexityMultiplier(taskComplexity) = {
  if taskComplexity <= 3: 0.5  // Simple tasks
  if taskComplexity <= 6: 1.0  // Moderate
  if taskComplexity <= 9: 2.0  // Complex
  else: 4.0                     // Very complex
}
```

### Domain Sensitivity Modifier
```squiggle
domainMultiplier(sensitivity) = {
  "internal_tools": 0.5,
  "customer_facing": 1.0,
  "financial": 2.0,
  "healthcare": 3.0,
  "safety_critical": 5.0
}
```

### Track Record Modifier
After observing n successful executions and m failures:
```squiggle
trackRecordMultiplier(n, m) = (m + alpha) / (n + m + alpha + beta)
// Where alpha, beta are prior parameters
```

---

## Applying These Priors

### Example: Code Review Agent

A code review agent using a general LLM:

```squiggle
// Base rates for general LLM
baseAccident = beta(8, 80)    // ~9%
baseDefection = beta(2, 200)  // ~1%

// Modifiers for code review context
taskComplexity = 5            // Moderate
domainSensitivity = "customer_facing"

// Adjusted rates
adjustedAccident = baseAccident * complexityMultiplier(5) * domainMultiplier("customer_facing")
// ~9% * 1.0 * 1.0 = ~9%

// With 100 successful reviews, 2 failures observed
posteriorAccident = bayesianUpdate(baseAccident, successes=100, failures=2)
// Posterior tightens around observed rate
```

---

## Limitations

1. **Limited empirical data**: Most estimates are extrapolations, not measurements
2. **Rapid capability changes**: These priors may need frequent updates
3. **Context dependence**: Real failure rates depend heavily on deployment specifics
4. **Defection uncertainty**: Theoretical estimates with high uncertainty
5. **Correlation ignored**: Components may have correlated failures

## References

- [AI Incident Database](https://incidentdatabase.ai/) - Real-world AI failures
- [Anthropic research on AI safety](https://www.anthropic.com/research)
- [DeepMind safety research](https://deepmind.google/safety-and-responsibility/)
- [Aligned AI research](https://www.alignedai.org/)
