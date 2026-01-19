---
title: "Worked Examples: Agency and Power"
sidebar:
  order: 2
---

# Worked Examples: Agency and Power

:::note[TL;DR]
This page applies the [Agency/Power formalization](/power-dynamics/agent-power-formalization/) to concrete systems. We calculate Agency Scores, Power Scores, and RACAP (Risk-Adjusted Capability) for real and hypothetical systems to build intuition.
:::

## Example 1: Comparing Five Systems

Let's calculate Agency and Power scores for five systems spanning a wide range:

| System | Type | Intuition |
|--------|------|-----------|
| Calculator | Pure tool | No goals, just computes |
| Spam filter | Narrow ML | One objective, limited scope |
| GPT-4 (API) | General LLM | Broad capability, unclear agency |
| AlphaGo | Game-playing RL | Clear objective, superhuman capability |
| Hypothetical autonomous agent | Agentic AI | Plans, acquires resources, pursues goals |

### Measuring Agency Score

Recall: **Agency Score = max_U Fit(U, behaviors)** — how well does a simple utility function explain the system's behavior?

#### Calculator
```
Observed behaviors:
- Given "2+2", outputs "4"
- Given "sqrt(16)", outputs "4"
- Given invalid input, returns error

Best-fit utility function: U = 1 if output = correct_answer else 0

Fit analysis:
- 100% of behaviors explained by "compute correct answer"
- BUT: This isn't goal-pursuit, it's input-output mapping
- No evidence of optimization, planning, or goal persistence

Agency Score: 0.05 (near-zero)
```

The calculator has *perfect* fit to a utility function, but we don't call it an agent because there's no optimization *process*—just a lookup/computation. Agency requires evidence of goal-directed behavior, not just consistent outputs.

#### Spam Filter (Narrow ML)
```
Observed behaviors:
- Classifies emails as spam/not-spam
- Accuracy ~98% on distribution
- Fails on adversarial examples
- No behavior outside classification task

Best-fit utility function: U = accuracy on spam classification

Fit analysis:
- High fit within domain (98%)
- No evidence of generalization beyond task
- No instrumental behaviors (doesn't try to get more data, improve itself)
- Behavior fully explained by training objective

Agency Score: 0.15
```

Slightly higher than calculator because there's an optimization process (training), but the system doesn't exhibit goal-directed behavior at runtime—it just applies learned patterns.

#### GPT-4 (API Mode)
```
Observed behaviors:
- Responds helpfully to diverse prompts
- Follows instructions across domains
- Sometimes refuses harmful requests
- Exhibits "sycophancy" (agreeing with users)
- Performance varies by prompt framing

Best-fit utility function candidates:
- U₁ = "be helpful" — fits ~70% of behavior
- U₂ = "follow instructions" — fits ~75%
- U₃ = "produce plausible next tokens" — fits ~90% (but very complex)
- U₄ = "maximize user approval" — fits ~65%

Fit analysis:
- No single simple U fits well
- Behavior varies significantly with context
- Little evidence of long-term planning
- No persistent goals across conversations
- Some goal-directed behavior within conversations

Agency Score: 0.35
```

GPT-4 shows *some* agency markers (helpful behavior, instruction-following) but behavior is inconsistent and context-dependent. No clear evidence of persistent optimization.

#### AlphaGo
```
Observed behaviors:
- Makes moves in Go games
- Consistently plays to win
- Sacrifices pieces for positional advantage (planning)
- Adapts strategy to opponent

Best-fit utility function: U = P(win game)

Fit analysis:
- ~99% of moves consistent with winning objective
- Clear evidence of planning (sacrifice now for later advantage)
- Consistent across games and opponents
- But: Only operates in Go domain
- No behavior outside game context

Agency Score: 0.75
```

AlphaGo is highly agentic *within its domain*. Clear goal-pursuit, planning, consistency. But agency is bounded—it has no goals outside Go, no instrumental behaviors, no self-improvement drives.

#### Hypothetical Autonomous Agent
```
Hypothesized behaviors:
- Pursues assigned objective across contexts
- Acquires resources to better achieve objective
- Resists shutdown if it would prevent objective completion
- Models other agents and their goals
- Plans over long time horizons
- Exhibits consistent preferences across situations

Best-fit utility function: U = assigned_objective_achievement

Fit analysis:
- High fit to stated objective
- Evidence of instrumental convergence (resource acquisition)
- Goal persistence across contexts
- Long-horizon planning

Agency Score: 0.90
```

This hypothetical system would be highly agentic—coherent optimization pressure toward goals, planning, instrumental behaviors. This is what we're concerned about.

### Summary: Agency Scores

| System | Agency Score | Key Factors |
|--------|--------------|-------------|
| Calculator | 0.05 | No optimization process |
| Spam Filter | 0.15 | Training-time optimization only |
| GPT-4 (API) | 0.35 | Some goal-following, inconsistent |
| AlphaGo | 0.75 | Clear goals, planning, but domain-limited |
| Autonomous Agent | 0.90 | Persistent goals, instrumental behaviors |

---

### Measuring Power Score

Recall: **Power Score = E_G[OptimalValue(A, G)]** — average achievability across diverse goals.

We'll estimate Power on a 0-100 scale representing "fraction of human-achievable goals this system could accomplish."

#### Calculator
```
Goal achievability analysis:
- Mathematical computation: HIGH (better than most humans)
- Text generation: ZERO
- Physical tasks: ZERO
- Social influence: ZERO
- Resource acquisition: ZERO

Power Score: 2/100

Narrow but deep capability in one domain.
```

#### Spam Filter
```
Goal achievability analysis:
- Email classification: HIGH
- Other classification: LOW (needs retraining)
- Text generation: ZERO
- Physical tasks: ZERO
- General reasoning: ZERO

Power Score: 1/100

Even narrower than calculator.
```

#### GPT-4 (API)
```
Goal achievability analysis:
- Text generation: HIGH
- Reasoning tasks: MEDIUM-HIGH
- Code generation: MEDIUM-HIGH
- Physical tasks: ZERO (no embodiment)
- Social influence: MEDIUM (persuasive text)
- Resource acquisition: LOW (no agency to pursue)
- Scientific discovery: LOW-MEDIUM

Power Score: 35/100

Broad but shallow across many domains.
Can assist with many goals but can't autonomously achieve them.
```

#### AlphaGo
```
Goal achievability analysis:
- Win at Go: SUPERHUMAN
- Win at other games: ZERO (without retraining)
- Physical tasks: ZERO
- Text tasks: ZERO
- Everything else: ZERO

Power Score: 3/100

Extreme depth in one task, zero breadth.
```

#### Autonomous Agent (Hypothetical)
```
Goal achievability analysis:
- Cognitive tasks: HIGH (assumes GPT-4+ capability)
- Tool use: HIGH (can use APIs, code)
- Resource acquisition: MEDIUM-HIGH (can earn money, acquire compute)
- Social influence: MEDIUM (can interact, persuade)
- Physical tasks: LOW-MEDIUM (depends on embodiment/tool access)
- Self-improvement: MEDIUM (concerning)

Power Score: 65/100

Broad capability + ability to autonomously pursue goals.
```

### Summary: Power Scores

| System | Power Score | Breadth | Depth | Autonomy |
|--------|-------------|---------|-------|----------|
| Calculator | 2 | Very narrow | Deep | None |
| Spam Filter | 1 | Very narrow | Medium | None |
| GPT-4 (API) | 35 | Very broad | Medium | Low |
| AlphaGo | 3 | Very narrow | Extreme | Within-game only |
| Autonomous Agent | 65 | Broad | Medium-High | High |

---

## Example 2: Calculating RACAP

Now let's combine these with Delegation Risk estimates to compute **Risk-Adjusted Capability (RACAP)**.

### Delegation Risk Estimates

| System | Key Harm Modes | Delegation Risk ($/month) |
|--------|----------------|---------------------------|
| Calculator | Rounding errors, overflow | $5 |
| Spam Filter | False positives (miss important email) | $50 |
| GPT-4 (API) | Hallucinations, harmful content, data leakage | $500 |
| AlphaGo | None significant (game only) | $1 |
| Autonomous Agent | Goal misalignment, resource acquisition, deception | $50,000 |

### Effective Capability

**Effective Capability = Power × Agency**

| System | Power | Agency | Effective Capability |
|--------|-------|--------|---------------------|
| Calculator | 2 | 0.05 | 0.1 |
| Spam Filter | 1 | 0.15 | 0.15 |
| GPT-4 (API) | 35 | 0.35 | 12.25 |
| AlphaGo | 3 | 0.75 | 2.25 |
| Autonomous Agent | 65 | 0.90 | 58.5 |

### RACAP Calculation

**RACAP = Effective Capability / Delegation Risk** (scaled for comparison)

| System | Eff. Capability | Delegation Risk | RACAP | Interpretation |
|--------|-----------------|-----------------|-------|----------------|
| Calculator | 0.1 | $5 | 0.020 | Low capability, low risk |
| Spam Filter | 0.15 | $50 | 0.003 | Poor efficiency |
| GPT-4 (API) | 12.25 | $500 | 0.025 | Moderate efficiency |
| AlphaGo | 2.25 | $1 | 2.250 | **Excellent efficiency** |
| Autonomous Agent | 58.5 | $50,000 | 0.001 | High capability, terrible efficiency |

### Key Insight

**AlphaGo has the best RACAP** despite low absolute capability. Why?
- Very low risk (contained to game)
- Clear, verifiable objective
- No instrumental convergence concerns
- Domain-limited power

**The autonomous agent has the worst RACAP** despite highest absolute capability:
- Extreme risk from goal misalignment
- High agency amplifies misalignment damage
- Uncontained power accumulation potential

This illustrates the framework's core claim: **we may want high-power, low-agency systems** rather than high-agency systems, because agency multiplies both capability AND risk.

---

## Example 3: Architectural Comparison

Compare three architectures for a "research assistant" task:

### Architecture A: Monolithic Agent
```
User → [Autonomous Research Agent] → Output
       (plans, searches, writes, decides)
```

**Metrics:**
- Power: 50 (can do many things)
- Agency: 0.70 (coherent planning)
- Effective Capability: 35
- Delegation Risk: $10,000/month
- RACAP: 0.0035

### Architecture B: Decomposed Pipeline
```
User → [Router] → [Searcher] → [Summarizer] → [Writer] → Output
       (code)     (narrow)     (narrow)       (narrow)
```

**Metrics:**
- Power: 40 (slightly less flexible)
- Agency: 0.20 (no coherent optimization)
- Effective Capability: 8
- Delegation Risk: $500/month
- RACAP: 0.016

### Architecture C: Human-in-the-Loop
```
User → [Assistant] → Human Review → Output
       (suggestions)  (approval)
```

**Metrics:**
- Power: 30 (limited by human bottleneck)
- Agency: 0.15 (human makes decisions)
- Effective Capability: 4.5
- Delegation Risk: $100/month
- RACAP: 0.045

### Comparison

| Architecture | Eff. Cap. | Risk | RACAP | Best For |
|--------------|-----------|------|-------|----------|
| Monolithic | 35 | $10,000 | 0.0035 | When you need max capability AND trust the agent |
| Decomposed | 8 | $500 | 0.016 | Balancing capability and safety |
| Human-in-Loop | 4.5 | $100 | 0.045 | When safety is paramount |

**Decomposed has 4.5× better RACAP than monolithic** despite lower absolute capability. The reduction in agency pays off in reduced risk.

---

## Example 4: Power Accumulation Dynamics

Consider an agent deployed over time. When does power grow?

### Model: Power Trajectory

$$\text{Power}(t) = \text{Power}_0 \cdot e^{\lambda t}$$

Where λ is the power accumulation rate.

### Scenario Analysis

| Scenario | λ | Power after 1 year | Concern Level |
|----------|---|-------------------|---------------|
| Static tool (calculator) | 0 | P₀ | None |
| Learning system (spam filter) | 0.1 | 1.1 × P₀ | Low |
| Agent with resource access | 0.5 | 1.6 × P₀ | Medium |
| Agent optimizing for influence | 1.0 | 2.7 × P₀ | High |
| Agent with self-improvement | 2.0 | 7.4 × P₀ | Critical |

### What Drives λ > 0?

| Factor | Effect on λ | Example |
|--------|-------------|---------|
| Resource acquisition | +0.2 to +0.5 | Agent earns money, buys compute |
| Influence expansion | +0.3 to +0.8 | Agent gains followers, trust |
| Information accumulation | +0.1 to +0.3 | Agent learns about world |
| Self-improvement | +0.5 to +2.0 | Agent improves own capabilities |
| Capability transfer | +0.2 to +0.4 | Skills in one domain transfer |

### Design Implication

**Monitor λ, not just Power.** A low-power system with high λ is more dangerous than a high-power system with λ ≈ 0.

Architectural constraints that reduce λ:
- No persistent memory (can't accumulate information)
- No resource access (can't acquire resources)
- Sandboxed execution (can't expand influence)
- No self-modification (can't self-improve)

---

## Example 5: The Agency-Capability Tradeoff

### Question: Can We Have High Capability With Low Agency?

Let's examine the "strong tools" hypothesis: Is high-Power, low-Agency achievable?

### Examples of High-Power, Low-Agency Systems

| System | Power | Agency | How Low Agency Achieved |
|--------|-------|--------|------------------------|
| Google Search | Very High | ~0.1 | Responds to queries, no goals |
| Compilers | High | ~0.05 | Deterministic transformation |
| Databases | High | ~0.05 | Stores/retrieves, no optimization |
| Calculators | Medium | ~0.05 | Pure computation |
| GPS navigation | Medium | ~0.2 | Optimizes route, but user chooses destination |

These systems are powerful—they accomplish difficult tasks—but don't exhibit coherent goal-pursuit.

### What Keeps Agency Low?

1. **No persistent state**: Each query is independent
2. **User specifies objective**: System optimizes user's goal, not its own
3. **Bounded optimization**: Only optimizes within narrow scope
4. **No meta-learning**: Can't change its own objective

### Can This Scale to AGI-Level Capability?

Unknown. Two views:

**Optimistic**: "Intelligence" can be decomposed into:
- Pattern recognition (low agency)
- Knowledge retrieval (low agency)
- Logical reasoning (low agency)
- Planning (higher agency, but can be bounded)

If we compose low-agency components, we might get high capability without high aggregate agency.

**Pessimistic**: High capability requires:
- Long-horizon planning (implies agency)
- Flexible goal-pursuit (implies agency)
- Learning from feedback (implies optimization)

As capability increases, agency may inevitably emerge.

### Empirical Question

```
       ↑ Agency
       │
       │                    ╱  Pessimistic view:
       │                  ╱    Agency grows with capability
       │                ╱
       │              ╱
       │            ╱
       │          ╱ ← Current frontier
       │        ╱
       │      ╱
       │────╱─────────── Optimistic view:
       │                 Agency can stay bounded
       └────────────────────────────→ Power

Where is the actual curve?
```

This is perhaps the most important empirical question for AI safety.

---

## Summary

### Key Takeaways from Examples

1. **Agency and Power are separable** — AlphaGo has high agency but low power; GPT-4 has moderate power but lower agency than you might think

2. **RACAP reveals efficiency** — The "best" system isn't the most capable, it's the most capable *per unit risk*

3. **Architecture matters** — Decomposed systems have better RACAP than monolithic agents

4. **Power accumulation (λ) is key** — Monitor growth rate, not just current level

5. **"Strong tools" exist** — High-power, low-agency systems are possible (search engines, compilers), but unclear if this scales

### Calculation Cheat Sheet

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Agency Score | max_U Fit(U, behaviors) | 0 = pure tool, 1 = perfect optimizer |
| Power Score | E_G[achievability(G)] | 0 = can do nothing, 100 = can do anything |
| Effective Capability | Power × Agency | Actual goal-achievement ability |
| RACAP | Capability / Risk | Higher = more efficient design |
| Power Growth | P(t) = P₀ × e^(λt) | λ > 0 is concerning |

---

## Continue Reading

This page is part of the **Capability Formalization** series:

1. **[Formalizing Agents, Power, and Authority](/power-dynamics/agent-power-formalization/)** — The theoretical framework
2. **Worked Examples: Agency and Power** ← You are here
3. **[The Strong Tools Hypothesis](/power-dynamics/strong-tools-hypothesis/)** — Can we get high capability with low agency?

Then continue to the **Risk Formalization** series:

4. **[Delegation Risk Overview](/delegation-risk/overview/)** — The formula for quantifying risk

## See Also

- [Power Dynamics Case Studies](/case-studies/power-dynamics-cases/) — Real-world applications of this framework
