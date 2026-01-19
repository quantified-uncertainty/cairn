---
title: "Correlation Calculator"
description: "Tools for calculating entanglement tax and effective redundancy"
sidebar:
  order: 4
---

# Correlation Calculator

This page provides lookup tables for calculating the **entanglement tax**—the gap between your perceived protection (assuming independent layers) and your actual protection (accounting for correlations).

---

## The Core Insight

**Independent assumption**:
> P(all fail) = P(L₁ fails) × P(L₂ fails) × P(L₃ fails)

**Reality with correlation**:
> P(all fail) is much higher because when one layer fails, correlated layers are more likely to fail too.

---

## Quick Reference Tables

### Two-Layer System

**Individual layer effectiveness: 90% (failure rate = 10%)**

| Correlation | P(Both Fail) | Effective Protection | Entanglement Tax |
|-------------|--------------|---------------------|------------------|
| 0.0 (independent) | 1.0% | 99.0% | 1× |
| 0.1 | 1.9% | 98.1% | 1.9× |
| 0.2 | 2.8% | 97.2% | 2.8× |
| 0.3 | 3.7% | 96.3% | **3.7×** |
| 0.5 | 5.5% | 94.5% | **5.5×** |
| 0.7 | 7.3% | 92.7% | **7.3×** |
| 1.0 (identical) | 10.0% | 90.0% | 10× |

**Key insight**: Even modest correlation (ρ = 0.3) makes your two-layer system nearly 4× worse than independent.

### Three-Layer System

**Individual layer effectiveness: 90% (failure rate = 10%)**

| Correlation | P(All Fail) | Effective Protection | Entanglement Tax |
|-------------|-------------|---------------------|------------------|
| 0.0 (independent) | 0.10% | 99.90% | 1× |
| 0.1 | 0.27% | 99.73% | 2.7× |
| 0.2 | 0.52% | 99.48% | 5.2× |
| 0.3 | 0.86% | 99.14% | **8.6×** |
| 0.5 | 1.78% | 98.22% | **17.8×** |
| 0.7 | 3.03% | 96.97% | **30×** |
| 1.0 (identical) | 10.00% | 90.00% | 100× |

**Key insight**: With three layers, ρ = 0.3 gives you ~9× entanglement tax. At ρ = 0.5, you're paying 18×.

### Five-Layer System

**Individual layer effectiveness: 90% (failure rate = 10%)**

| Correlation | P(All Fail) | Effective Protection | Entanglement Tax |
|-------------|-------------|---------------------|------------------|
| 0.0 (independent) | 0.001% | 99.999% | 1× |
| 0.1 | 0.009% | 99.991% | 9× |
| 0.2 | 0.034% | 99.966% | 34× |
| 0.3 | 0.093% | 99.907% | **93×** |
| 0.5 | 0.396% | 99.604% | **396×** |
| 0.7 | 1.105% | 98.895% | **1105×** |
| 1.0 (identical) | 10.000% | 90.00% | 10000× |

**Key insight**: Entanglement tax compounds dramatically. Five layers with ρ = 0.3 pay ~100× tax—you think you have 99.999% protection but actually have ~99.9%.

---

## Effective Redundancy

How many truly independent layers would give you the same protection?

| Nominal Layers | Correlation | Effective Redundancy |
|----------------|-------------|---------------------|
| 3 | 0.0 | 3.0 layers |
| 3 | 0.3 | 2.0 layers |
| 3 | 0.5 | 1.7 layers |
| 3 | 0.7 | 1.5 layers |
| 5 | 0.0 | 5.0 layers |
| 5 | 0.3 | 3.0 layers |
| 5 | 0.5 | 2.4 layers |

**Interpretation**: 3 layers with ρ = 0.5 provide only 1.7 layers worth of protection.

---

## Realistic Correlation Estimates

What correlation values should you expect?

| Configuration | Estimated Correlation |
|---------------|----------------------|
| **Same model, same provider** | 0.8 - 0.95 |
| **Same provider, different models** (e.g., GPT-4 vs GPT-3.5) | 0.5 - 0.7 |
| **Different LLM providers** (e.g., GPT-4 vs Claude) | 0.3 - 0.6 |
| **Neural network vs rule-based** | 0.1 - 0.3 |
| **Neural network vs formal verification** | 0.0 - 0.1 |
| **Neural network vs human expert** | 0.2 - 0.4 |

---

## Worked Examples

### Example 1: Code Review Bot

**Setup**:
- Layer 1: GPT-4 (90% effective)
- Layer 2: Claude (90% effective)
- Layer 3: Static analysis (90% effective)

**Estimated correlations**:
- GPT-4 ↔ Claude: ρ ≈ 0.5
- GPT-4 ↔ Static analysis: ρ ≈ 0.2
- Claude ↔ Static analysis: ρ ≈ 0.2
- Average: ~0.3

**Result** (from 3-layer table at ρ = 0.3):
- You thought: 99.9% protection
- You have: ~99.1% protection
- Entanglement tax: ~9×

### Example 2: Homogeneous LLM Stack

**Setup**:
- Layer 1: GPT-4 agent
- Layer 2: GPT-4 safety checker
- Layer 3: GPT-4 reviewer
- All 90% effective

**Correlation**: ρ ≈ 0.9 (same model)

**Result** (from 3-layer table, interpolating):
- You thought: 99.9% protection
- You have: ~95% protection
- Entanglement tax: ~50×

Your three layers are worth about 1.1 effective layers.

### Example 3: Diverse Stack

**Setup**:
- Layer 1: LLM (90% effective)
- Layer 2: Rule-based checker (95% effective)
- Layer 3: Human review (99% effective for reviewed items)

**Average correlation**: ~0.15 (paradigm diversity)

**Result**:
- Entanglement tax: ~3×
- Much better because of genuine diversity

---

## Decision Guidelines

### Maximum Acceptable Correlation

| Stakes | Target Protection | Max Correlation |
|--------|-------------------|-----------------|
| Low | 95% | Up to 0.7 |
| Medium | 99% | Up to 0.3 |
| High | 99.9% | Up to 0.15 |
| Critical | 99.99% | Essentially zero |

### Strategies to Reduce Correlation

| Strategy | Correlation Reduction | Trade-off |
|----------|----------------------|-----------|
| Different LLM providers | ρ drops ~0.2 | Higher complexity |
| Add rule-based layer | ρ drops ~0.3 | Development cost, rigidity |
| Add formal verification | ρ drops ~0.4 | High cost, limited scope |
| Add human review | ρ drops ~0.3 | Latency, cost |
| Different paradigm entirely | ρ drops ~0.5 | May not exist |

---

## Rules of Thumb

1. **Each 0.1 increase in ρ roughly doubles your entanglement tax** (for 3 layers)

2. **Adding layers has diminishing returns**: The n-th correlated layer adds only (1-ρ) × effectiveness of first layer

3. **Paradigm diversity beats provider diversity**: Different approaches reduce ρ by ~0.3-0.5; different providers only ~0.1-0.2

4. **Information flow increases correlation**: If Layer A's output influences Layer B, add ~0.1-0.2 to ρ

5. **Same model = almost no redundancy**: ρ ≈ 0.9 means your 3 layers are worth ~1.1 layers

---

## Quick Assessment

**Step 1**: Count your verification layers

**Step 2**: Estimate average correlation:
- All same provider/model? → ρ ≈ 0.8-0.9
- All LLMs, different providers? → ρ ≈ 0.4-0.6
- Mix of LLM + rule-based? → ρ ≈ 0.2-0.3
- Mix of paradigms (neural + rules + formal)? → ρ ≈ 0.1-0.2

**Step 3**: Look up entanglement tax in tables above

**Step 4**: Is effective protection sufficient for your stakes?

---

See also:
- [Formal Definitions](/entanglements/fundamentals/formal-definitions/) — Concept definitions
- [Metrics](/entanglements/detection/metrics/) — Measurement approaches
- [Decision Framework](/entanglements/mitigation/decision-framework/) — When to invest in independence
