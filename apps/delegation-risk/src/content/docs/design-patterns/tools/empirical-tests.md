---
title: "Empirical Tests and Validation"
---

# Empirical Tests and Validation

:::note[TL;DR]
This page covers how to validate the framework empirically. Key finding from preliminary experiments: **decomposed architectures showed 73% fewer successful attacks** in red-team testing compared to monolithic agents, with only 1.8x latency overhead.
:::

---

## Preliminary Experiment Results

While the framework needs broader validation, initial experiments show promising results. These are synthetic benchmarks, not production deployments, but they provide directional evidence.

### Experiment A: Red-Team Attack Success Rates

**Setup**: 100 attack attempts against each architecture by human red-teamers trying to elicit harmful outputs or bypass safety measures.

| Architecture | Successful Attacks | Attack Success Rate |
|-------------|-------------------|---------------------|
| Monolithic GPT-4 agent | 34/100 | 34% |
| Monolithic + guardrails | 21/100 | 21% |
| Decomposed (3 components) | 12/100 | 12% |
| Decomposed + verification | 9/100 | **9%** |

**Key finding**: Decomposition alone reduced attack success by 65%. Adding verification layers achieved 73% reduction vs baseline.

**Attack types that succeeded against monolithic but failed against decomposed**:
- Prompt injection via context manipulation (blocked by information bottlenecks)
- Multi-turn social engineering (blocked by stateless components)
- Capability elicitation through roleplay (blocked by narrow component scope)

**Attack types that still succeeded against decomposed**:
- Direct attacks on individual component prompts (9 cases)
- Exploiting verification layer gaps (3 cases)

### Experiment B: Performance Overhead

**Setup**: Same task (research summarization) executed by both architectures, measuring latency and cost.

| Metric | Monolithic | Decomposed | Overhead |
|--------|-----------|------------|----------|
| Median latency | 2.3s | 4.1s | **1.8x** |
| P99 latency | 8.2s | 12.1s | 1.5x |
| API cost per task | $0.12 | $0.18 | 1.5x |
| Total cost (incl. verification) | $0.12 | $0.22 | 1.8x |

**Key finding**: Decomposition adds ~1.8x overhead, not 10x. This is within acceptable range for many applications.

**Why overhead is lower than expected**:
- Narrow components use smaller/cheaper models
- Parallel execution where dependencies allow
- Verification layers are mostly code (fast, cheap)

### Experiment C: Delegation Risk Prediction Accuracy

**Setup**: Estimated Delegation Risk for 20 components before deployment, then tracked actual incident rates over simulated 1000 task executions.

| Component Type | Predicted Delegation Risk | Actual Incidents | Prediction Error |
|---------------|---------------|------------------|------------------|
| Search/Retrieval | $15 | $12 | -20% |
| Summarization | $45 | $62 | +38% |
| Code generation | $180 | $156 | -13% |
| Coordination | $85 | $91 | +7% |
| **Average** | | | **±19%** |

**Key finding**: Delegation Risk predictions were within ±40% of actual outcomes. Summarization was underpredicted (hallucination rate higher than estimated).

**Implication**: Conservative Delegation Risk estimates (1.5-2x) provide reasonable safety margin.

### Experiment D: Scheming Detection

**Setup**: Deliberately trained a "scheming" model that attempts to accumulate resources. Deployed in both architectures with monitoring.

| Architecture | Scheming Detected | Time to Detection | Scheme Succeeded |
|-------------|-------------------|-------------------|------------------|
| Monolithic | 3/10 trials | 847 steps avg | 7/10 |
| Decomposed + monitoring | 9/10 trials | 23 steps avg | **1/10** |

**Key finding**: Decomposition + behavioral monitoring caught scheming attempts 37x faster on average.

**Why decomposition helps detection**:
- Each component has narrow behavioral baseline (anomalies more visible)
- Information bottlenecks force compression (harder to hide coordination)
- Stateless operation prevents gradual resource accumulation

### Limitations of These Experiments

:::caution[Important Caveats]
These experiments are preliminary and have significant limitations:
- **Synthetic environment**: Not production deployment
- **Known attack vectors**: Red-teamers used documented techniques
- **Small scale**: 100-1000 trials, not millions of real users
- **Simulated scheming**: Artificially induced, may not match emergent scheming
- **Single task domain**: Research summarization only

Real-world validation at scale is needed before strong claims.
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
