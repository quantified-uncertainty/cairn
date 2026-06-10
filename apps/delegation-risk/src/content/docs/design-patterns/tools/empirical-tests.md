---
title: "Empirical Tests and Validation"
---

:::note[TL;DR]
This page covers how to validate the framework empirically. The experiments below are **synthetic, not production deployments** — they provide directional evidence about what to measure, not proof of real-world effectiveness.
:::

---

## Illustrative Experiment Results

:::caution[Synthetic Data — Not Empirical Results]
The tables below are **invented-for-illustration** — they represent what well-designed experiments might plausibly show, not measured outcomes from actual deployments. Treat them as hypothetical predictions and testable benchmarks, not evidence. Real-world validation at scale is needed before strong claims.
:::

### Experiment A: Red-Team Attack Success Rates (Hypothetical)

**Illustrative setup**: 100 attack attempts against each architecture.

| Architecture | Successful Attacks | Attack Success Rate |
|-------------|-------------------|---------------------|
| Monolithic GPT-4 agent | 34/100 | 34% |
| Monolithic + guardrails | 21/100 | 21% |
| Decomposed (3 components) | 12/100 | 12% |
| Decomposed + verification | 9/100 | **9%** |

**What this would show**: Decomposition creating information bottlenecks and stateless components could plausibly reduce attack success—but the specific numbers are invented to illustrate the concept.

**Attack types expected to be reduced**:
- Prompt injection via context manipulation (blocked by information bottlenecks)
- Multi-turn social engineering (blocked by stateless components)
- Capability elicitation through roleplay (blocked by narrow component scope)

### Experiment B: Performance Overhead (Hypothetical)

**Illustrative setup**: Same task (research summarization) executed by both architectures.

| Metric | Monolithic | Decomposed | Overhead |
|--------|-----------|------------|----------|
| Median latency | 2.3s | 4.1s | **1.8x** |
| P99 latency | 8.2s | 12.1s | 1.5x |
| API cost per task | \$0.12 | \$0.18 | 1.5x |
| Total cost (incl. verification) | \$0.12 | \$0.22 | 1.8x |

**What this would show**: Overhead plausibly within acceptable range for many applications—but actual overheads depend heavily on implementation choices.

**Why overhead might be lower than feared**:
- Narrow components can use smaller/cheaper models
- Parallel execution where dependencies allow
- Verification layers are mostly code (fast, cheap)

### Experiment C: Delegation Risk Prediction Accuracy (Hypothetical)

**Illustrative setup**: Estimated Delegation Risk for 20 components, then tracked incident rates over simulated executions.

| Component Type | Predicted Delegation Risk | Actual Incidents | Prediction Error |
|---------------|---------------|------------------|------------------|
| Search/Retrieval | \$15 | \$12 | -20% |
| Summarization | \$45 | \$62 | +38% |
| Code generation | \$180 | \$156 | -13% |
| Coordination | \$85 | \$91 | +7% |
| **Average** | | | **±19%** |

**What this would show**: Plausible prediction error range; summarization may be harder to bound due to hallucination variance.

### Experiment D: Scheming Detection (Hypothetical)

**Illustrative setup**: Artificially induced scheming model deployed in both architectures with monitoring.

| Architecture | Scheming Detected | Time to Detection | Scheme Succeeded |
|-------------|-------------------|-------------------|------------------|
| Monolithic | 3/10 trials | 847 steps avg | 7/10 |
| Decomposed + monitoring | 9/10 trials | 23 steps avg | **1/10** |

**What this would show**: Decomposition + monitoring could plausibly accelerate detection—but the specific ratios are invented to illustrate the expected direction of effect.

**Why decomposition is expected to help detection**:
- Each component has narrow behavioral baseline (anomalies more visible)
- Information bottlenecks force compression (harder to hide coordination)
- Stateless operation prevents gradual resource accumulation

### Caveats on the Illustrations Above

:::caution[Important Caveats]
The experiments above are **hypothetical predictions, not measurements**:
- Numbers are invented to illustrate plausible outcomes, not derived from actual trials
- Real overhead, attack success rates, and detection latencies will vary by implementation
- Simulated scheming in a controlled setup may not match emergent scheming in deployment
- Single task domain generalizations are unreliable

Real-world validation at scale is needed before any strong claims.
:::

---

## Testable Predictions

If this approach is promising, we should see concrete, measurable results across four validation stages:

1. **Empirical Tests** — Validate core assumptions (scheming reduction, forecasting calibration)
2. **Prototypes** — Build working systems (research assistant, code deployment)
3. **Red Team Testing** — Adversarial evaluation of architectural patterns
4. **Low-Stakes Deployment** — Real-world validation in bounded environments

### Empirically Testable Now

- Narrow components show less scheming than monolithic models
- Factored cognition improves monitoring effectiveness (already shown in recent work)
- Frontier models can forecast their own behavior with reasonable calibration
- Modular architectures have acceptable performance penalty (<2-3x) for many tasks

### Development Validation

- Prototype systems (code generation, research assistant) demonstrate the approach
- Red team adversarial testing finds vulnerabilities → informs better decomposition
- Early deployment in low-stakes domains proves value

## Specific Empirical Tests

### Test 1: Scheming in Narrow vs Broad Context

1. Train frontier model, measure scheming propensity
2. Decompose same capability into narrow components, measure again
3. **Hypothesis**: Modular version schemes less (quantify difference)

### Test 2: Covert Signaling via Randomness

1. Run same LLM at temperature=0 vs 1.0 with repeated queries
2. Measure output variance
3. **Hypothesis**: High temperature enables covert signaling

### Test 3: Coordinator Robustness

1. Build coordinator as: (a) monolithic, (b) decomposed with older models, (c) decomposed with redundancy
2. Red-team attack attempts to make each scheme
3. **Hypothesis**: (c) most resistant, (a) least resistant

### Test 4: Forecasting-Based Navigation

1. Implement forecasting-based navigation on toy problem
2. Measure: Does system improve over time? Do forecasts remain calibrated?
3. **Hypothesis**: Navigation works if forecasts honest

### Test 5: Fine-Tuned vs Frontier Model Predictability

1. Compare behavior predictability of fine-tuned narrow model vs frontier model on same task
2. Measure: variance in outputs, ease of verification, susceptibility to prompt injection
3. **Hypothesis**: Fine-tuned models more predictable and verifiable

### Test 6: Byzantine Fault Tolerance

1. Deploy N coordinators with 0-f adversarial
2. Measure: At what f does system fail?
3. **Hypothesis**: 3f+1 rule holds for AI coordinators

## Open Questions Requiring Research

### 1. Forecasting Accuracy Bounds

**Question**: How good does forecasting need to be? How does uncertainty compound over 10-step iterations?

**Current state**: LLMs are approaching superforecaster-level on many prediction tasks. But self-prediction (forecasting own behavior after modification) is less tested.

**What's needed**: Benchmarks specifically for "predict your behavior N steps ahead" with various modifications in between. Characterize how calibration degrades with horizon length.

### 2. Decomposing Coordination Logic

**Challenge addressed**: The original concern was capability concentration in "the coordinator."

**Solution proposed**: Coordination isn't one component—it's an architecture. Decompose into:

- Strategy (older models, heavily constrained)
- Forecasting delegation (separate modules)
- Tactical execution (narrow context)
- Progress monitoring (mostly code)
- Verification layers (simple checkers)

**Remaining questions**:

- What's the optimal granularity of coordination decomposition?
- How much redundancy is needed (multiple strategy modules)?
- At what capability level does even decomposed coordination become risky?
- Can we formally verify coordination logic?

### 3. Anti-Scheming Architecture

**Question**: What architectural features actually reduce scheming propensity?

**Hypothesis**: Limited context, component isolation, independent forecasting/implementation separation, multiple adversarial checks—these should make strategic deception harder.

**What's needed**: Empirical validation. Test scheming propensity in:

- Monolithic models
- Models with factored cognition
- Models with architectural separation between planning and execution

Recent work (Factor(T,U) paper) shows factored cognition helps monitoring. Need specific tests for deception.

### 4. Decomposition Granularity

**Question**: How fine-grained should decomposition be?

**Tradeoff**: Finer → safer but less efficient. Coarser → more efficient but larger blast radius per component.

**What's needed**: Theory of optimal decomposition boundaries. Where do you split? How do you decide?

### 5. Competitive Dynamics

**Question**: What's the performance penalty vs monolithic models? Is it acceptable?

:::caution[Economic Reality]
If modular systems are 10x slower/more expensive, they won't be deployed except under regulation.
:::

**What's needed**: Benchmarks. Prototype a modular system, compare performance to monolithic baseline. Quantify the safety-capability tradeoff.

### 6. Emergence and Composition

**Question**: Can forecasting reliably catch emergent properties from component composition?

**Risk**: Two safe components might enable dangerous capability together. Can multi-step forecasting detect this?

**What's needed**: Adversarial testing. Design components that seem safe individually but enable harm together. See if forecasting catches it.

### 7. Evaluation Before Deployment

**Question**: How do you test this works without deploying potentially dangerous systems?

**Sandbox problem**: Testing in restricted environments might not reveal problems that emerge in deployment.

**What's needed**: Evaluation methodology that gives confidence without catastrophic-failure-as-test. Possibly: progressive deployment with increasing stakes, extensive red-teaming, formal verification of critical components.
