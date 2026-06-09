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

**The formula** (canonical derivation in [Formal Definitions](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax); see also [Risk Propagation](/delegation-risk/risk-propagation/)):

$$P(\text{all fail}) = (1-\rho)\prod_i p_i + \rho \cdot \min_i p_i$$

This is the beta-factor common-cause model: with weight ρ a shared cause defeats every correlated layer at once. It is deliberately conservative at intermediate ρ relative to smoother correlation models — the right direction for budgeting. All tables below are generated from this formula.

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
| 0.1 | 1.09% | 98.91% | 10.9× |
| 0.2 | 2.08% | 97.92% | 20.8× |
| 0.3 | 3.07% | 96.93% | **31×** |
| 0.5 | 5.05% | 94.95% | **50×** |
| 0.7 | 7.03% | 92.97% | **70×** |
| 1.0 (identical) | 10.00% | 90.00% | 100× |

**Key insight**: With three layers, even ρ = 0.1 costs you an order of magnitude — and at ρ = 0.3 you're paying ~31×. The third layer barely moves actual protection once a common cause exists.

### Five-Layer System

**Individual layer effectiveness: 90% (failure rate = 10%)**

| Correlation | P(All Fail) | Effective Protection | Entanglement Tax |
|-------------|-------------|---------------------|------------------|
| 0.0 (independent) | 0.001% | 99.999% | 1× |
| 0.1 | 1.00% | 99.00% | ~1,000× |
| 0.2 | 2.00% | 98.00% | ~2,000× |
| 0.3 | 3.00% | 97.00% | **~3,000×** |
| 0.5 | 5.00% | 95.00% | **~5,000×** |
| 0.7 | 7.00% | 93.00% | **~7,000×** |
| 1.0 (identical) | 10.00% | 90.00% | 10,000× |

**Key insight**: Entanglement tax compounds dramatically with layer count — you *think* you have 99.999% protection, but with any appreciable common cause your actual protection is set by ρ × 10%, not by the five layers. The extra layers improve the perceived number, not the real one.

---

## Effective Redundancy

How many truly independent layers would give you the same protection?

| Nominal Layers | Correlation | Effective Redundancy |
|----------------|-------------|---------------------|
| 3 | 0.0 | 3.0 layers |
| 3 | 0.3 | 1.5 layers |
| 3 | 0.5 | 1.3 layers |
| 3 | 0.7 | 1.2 layers |
| 5 | 0.0 | 5.0 layers |
| 5 | 0.3 | 1.5 layers |
| 5 | 0.5 | 1.3 layers |

**Interpretation**: 3 layers with ρ = 0.5 provide only ~1.3 layers worth of protection — and going from 3 layers to 5 at the same correlation buys you *nothing*. Once a common cause exists, effective redundancy is set by the correlation, not the layer count. Reduce ρ (diversify providers, isolate context) before adding layers.

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
- You have: ~96.9% protection (P(all fail) ≈ 3.1%)
- Entanglement tax: ~31×

### Example 2: Homogeneous LLM Stack

**Setup**:
- Layer 1: GPT-4 agent
- Layer 2: GPT-4 safety checker
- Layer 3: GPT-4 reviewer
- All 90% effective

**Correlation**: ρ ≈ 0.9 (same model)

**Result** (from 3-layer table, interpolating between ρ = 0.7 and ρ = 1.0):
- You thought: 99.9% protection
- You have: ~91% protection (P(all fail) ≈ 9%)
- Entanglement tax: ~90×

Your three layers are worth about 1.05 effective layers — barely more than one.

### Example 3: Diverse Stack

**Setup**:
- Layer 1: LLM (90% effective)
- Layer 2: Rule-based checker (95% effective)
- Layer 3: Human review (99% effective for reviewed items)

**Average correlation**: ~0.15 (paradigm diversity)

**Result**:
- Independent assumption: P(all fail) = 0.1 × 0.05 × 0.01 = 0.005%
- Actual: P(all fail) = 0.85 × 0.005% + 0.15 × 1% ≈ 0.15%
- Entanglement tax: ~31×

The tax *ratio* is still large — with heterogeneous layers, the common-cause term ρ · min(pᵢ) dominates the tiny independent product, and the strongest layer (the 99% human review) sets the floor: P(all fail) ≥ ρ × 1%. But compare absolute risk: 0.15% here versus 3.1% for the code review bot in Example 1. Genuine diversity bought a ~20× lower actual failure rate. The remaining risk is almost entirely the shared-cause channel, so the next improvement is reducing ρ further — not adding layers.

---

## Decision Guidelines

### Maximum Acceptable Correlation

With 90%-effective layers, the common-cause floor P(all fail) ≥ ρ × 10% caps your achievable protection no matter how many layers you stack. Working backwards from each target (assuming ≥4 layers, so the independent term is negligible):

| Stakes | Target Protection | Max Correlation (90% layers) |
|--------|-------------------|------------------------------|
| Low | 95% | ρ ≤ ~0.5 |
| Medium | 99% | ρ ≤ ~0.1 |
| High | 99.9% | ρ ≤ ~0.01 |
| Critical | 99.99% | Essentially zero (ρ ≤ ~0.001) |

If you can't get ρ that low, the other lever is stronger individual layers: the floor is ρ × min(pᵢ), so improving your *best* layer lowers it proportionally.

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

1. **The tax is linear in ρ, and the first step is the worst**: for 3 layers at 90%, each +0.1 of ρ adds roughly +10× to the tax (about +1 percentage point of P(all fail)). Going from ρ = 0 to ρ = 0.1 alone multiplies the tax by ~11×.

2. **Adding layers has diminishing returns**: The n-th correlated layer adds only (1-ρ) × effectiveness of first layer

3. **Paradigm diversity beats provider diversity**: Different approaches reduce ρ by ~0.3-0.5; different providers only ~0.1-0.2

4. **Information flow increases correlation**: If Layer A's output influences Layer B, add ~0.1-0.2 to ρ

5. **Same model = almost no redundancy**: ρ ≈ 0.9 means your 3 layers are worth ~1.05 layers

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
