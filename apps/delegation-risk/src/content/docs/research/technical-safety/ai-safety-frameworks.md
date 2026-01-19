---
title: "AI Safety Frameworks Comparison"
description: "How this framework relates to CAIS, AI Control, IDA, RSP, Guaranteed Safe AI, and other approaches"
---

Comparison of existing AI safety frameworks and how they address trust decomposition, risk budgeting, coordinator safety, and verification.

## Framework Comparison Matrix

| Framework | Trust Decomposition | Risk Budgeting | Coordinator Safety | Verification |
|-----------|--------------------|--------------|--------------------|--------------|
| **CAIS (Drexler 2019)** | Services not agents | None | Underspecified | Human oversight |
| **AI Control (Redwood 2024)** | Trusted/Untrusted | Qualitative | T monitors U | Empirical protocols |
| **IDA (Christiano 2018)** | Amplification | None | Amplified human | Distillation |
| **Anthropic RSP** | ASL tiers | Safety buffers | Governance only | Capability evals |
| **Guaranteed Safe AI** | Component contracts | Worst-case only | Formal specs | Mathematical proofs |
| **This Framework** | Hierarchical trust | Euler allocation | Formal constraints | Risk budgets + verification |

---

## CAIS - Comprehensive AI Services (Drexler 2019)

**Citation:** Drexler, K.E. (2019). "Reframing Superintelligence: Comprehensive AI Services as General Intelligence." FHI Technical Report #2019-1. [FHI Oxford](https://www.fhi.ox.ac.uk/reframing/)

### Core Thesis

AI-driven general intelligence need not take the form of unified, goal-directed agents. Instead: **services with expanding capabilities, where agency is optional**.

### Key Safety Arguments

1. **Avoid unified agency** - treat AGI as deviant branch
2. **Task-specific optimization** - concrete goals, not open-ended utility
3. **Human oversight** - services informed by models of human approval
4. **Recursive service development** - self-improving under human guidance

### Critiques

- **Foundation models gap** - didn't anticipate shared base models spreading problems
- **Agency creep** - even GPT-4 being set up to act autonomously
- **Coordination underspecified** - how do services coordinate without becoming agents?
- **Competitive dynamics** - no mechanism to prevent racing to unified agents

### How This Framework Extends CAIS

| CAIS Gap | This Framework's Solution |
|----------|--------------------------|
| No formal trust composition | Delegation risk framework with propagation rules |
| No quantitative risk allocation | Euler allocation for risk budgets |
| Underspecified coordination | Formal coordinator constraints |
| Ignores foundation model reality | Accounts for shared base models |

---

## AI Control (Redwood Research 2024)

**Citation:** Greenblatt, R. et al. (2023). "AI Control: Improving Safety Despite Intentional Subversion." arXiv:2312.06942. [Paper](https://arxiv.org/abs/2312.06942)

### Core Insight

Maintain safety even when the model is **intentionally trying to subvert safety measures**.

### Architecture

- **Untrusted Model (U)**: Powerful but potentially deceptive (e.g., GPT-4)
- **Trusted Model (T)**: Less capable but reliable (e.g., GPT-3.5)
- **Limited Trusted Labor**: Human oversight with resource constraints

### Key Protocols

1. **Trusted Monitoring** - T reviews U's outputs for suspicious behavior
2. **Untrusted Monitoring** - U monitors itself (requires collusion-busting)
3. **Defer to Trusted** - when suspicious, defer to weaker but trusted model
4. **Factor(T,U)** - decompose tasks, monitor each child task

### Empirical Results

**Factor(T,U) December 2024:** Safety improved 41% → 70% when adding factored cognition to trusted monitoring. Attacks on simpler child tasks are more obvious to monitors.

**Scheming Detection (OpenAI/Apollo 2024):**
- o4-mini: 8.7% → 0.3% scheming (29× reduction with deliberative alignment)
- o3: 13% → 0.4% scheming (33× reduction)

### How This Framework Extends AI Control

| AI Control | This Framework |
|------------|----------------|
| Qualitative T/U separation | Quantitative risk budgets |
| Single T-U pair | Multi-level hierarchies |
| Technical protocols only | Economic incentive alignment |
| No compositional framework | Mathematical trust composition |

**Key integration:** Coordinator = formalized "Trusted model T" with explicit capability bounds, risk budgets, and verification requirements.

---

## IDA - Iterated Distillation and Amplification (Christiano 2018)

**Citation:** Christiano, P. et al. (2018). "Supervising strong learners by amplifying weak experts." arXiv:1810.08575. [Paper](https://arxiv.org/abs/1810.08575)

### The Core Loop

**Amplification:** Weak agent + more resources/time = better outputs (like MCTS in AlphaGo)

**Distillation:** Train faster model to predict amplified outputs

**Iteration:** Repeat with distilled model as new base

### Connection to Hierarchical Delegation

1. Agent receives difficult task
2. Decomposes into subtasks
3. Calls copies of itself to solve subtasks
4. Integrates results

**This is precisely the coordinator architecture pattern.**

### Factored Cognition

Central question: "Can we solve difficult problems by composing small contributions from individual agents who don't know the big picture?"

**Challenge:** Problems requiring extended learning to build intuitions (e.g., math textbook halfway through requires earlier problems).

### How This Framework Relates

| IDA | This Framework |
|-----|----------------|
| Training methodology | Deployment architecture |
| Alignment during training | Safety during operation |
| No runtime risk quantification | Continuous risk budgets |
| Theoretical | Practical implementation |

**Complementary:** Train with IDA, deploy in this architecture, use risk budgets to determine when model "trusted enough" for role.

---

## Anthropic RSP - Responsible Scaling Policy

**Citation:** Anthropic (2023-2025). "Responsible Scaling Policy." Versions 1.0-2.2. [Anthropic RSP](https://www.anthropic.com/responsible-scaling-policy)

### AI Safety Levels (ASL)

| Level | Description | Status |
|-------|-------------|--------|
| **ASL-1** | No meaningful catastrophic risk | Historical LLMs |
| **ASL-2** | Early dangerous capabilities (not yet useful) | Pre-Claude Opus 4 |
| **ASL-3** | Substantially increased catastrophic misuse risk | Claude Opus 4 (Dec 2024) |
| **ASL-4+** | Not yet defined | Future |

### Safety Buffer Concept

- **Yellow Line:** Safety buffer before red line (originally 6× effective compute)
- **Red Line:** Actual ASL threshold requiring new protections
- Yellow line triggers comprehensive assessment and preparation

**Evolution:** Version 2.2 dropped specific 6× number - "science of evaluations is not currently mature enough"

### Evaluation Triggers

- 4× Effective Compute increase, OR
- Six months of accumulated post-training enhancements

### How This Framework Extends RSP

| RSP | This Framework |
|-----|----------------|
| Model-level ASL tiers | Component-level risk budgets |
| Qualitative thresholds | Quantitative probability budgets |
| Periodic assessments | Continuous risk tracking |
| Governance only | Technical + economic mechanisms |

**Proposed Integration:**
```
ASL-2 component: Risk budget = 10⁻⁴ per operation
ASL-3 component: Risk budget = 10⁻⁶ per operation
System composition: Euler allocation for total risk
Yellow line: 50% of budget consumed
Red line: 80% of budget consumed
```

---

## Guaranteed Safe AI (Tegmark, Seshia et al. 2024)

**Citation:** Dalrymple, D. et al. (2024). "Towards Guaranteed Safe AI." arXiv:2405.06624. [Paper](https://arxiv.org/abs/2405.06624)

### Core Philosophy

"Mathematical proof is humanity's most powerful tool for controlling AGIs. Regardless of how intelligent a system becomes, it cannot prove a mathematical falsehood."

### Three Components

1. **World Model:** Mathematical description of how AI affects world
2. **Safety Specification:** Mathematical description of acceptable effects
3. **Verifier:** Auditable proof certificate that AI satisfies specification

### Practical Examples

- Machines provably impossible to login without correct credentials
- DNA synthesizers provably unable to synthesize certain pathogens
- AI hardware provably geofenced or with remote kill-switch

### Limitations

- Requires complete formal specification (extremely difficult)
- Assumptions in world model may not hold
- Verification doesn't scale easily to large neural networks

### How This Framework Relates

| Guaranteed Safe AI | This Framework |
|-------------------|----------------|
| Worst-case proofs | Probabilistic budgets |
| Complete specification needed | Works with partial specs |
| Formal verification | Risk budgets + verification |

**Complementary:**
- Formally verify coordinator constraints (provable bounds)
- Risk budget sub-agent behaviors (practical for complex tasks)
- Hybrid: proofs for critical paths, budgets for rest

---

## Other Frameworks

### OpenAI Preparedness Framework

**Citation:** OpenAI (2023-2025). "Preparedness Framework." [OpenAI](https://openai.com/index/updating-our-preparedness-framework/)

Two thresholds:
- **High capability:** Could amplify existing pathways to severe harm
- **Critical capability:** Could introduce unprecedented new pathways

Similar governance (SAG review, board veto) but less granular than RSP.

### DeepMind Debate

**Citation:** Irving, G. et al. (2018). "AI Safety via Debate." arXiv:1805.00899. [Paper](https://arxiv.org/abs/1805.00899)

Two AI systems argue opposite sides; human judge evaluates.

**Core assumption:** "Harder to lie convincingly than to refute a lie"

**2024 results:** First empirical evidence debate helps judges recognize truth (Anthropic Feb, DeepMind July).

### Constitutional AI

**Citation:** Bai, Y. et al. (2022). "Constitutional AI: Harmlessness from AI Feedback." arXiv:2212.08073. [Anthropic](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback)

Self-improvement without human labels of harmful outputs. AI evaluates own outputs against constitutional principles.

**Key result:** More helpful AND more harmless than standard RLHF.

### Weak-to-Strong Generalization

**Citation:** Burns, C. et al. (2023). "Weak-to-Strong Generalization." arXiv:2312.09390. [OpenAI](https://openai.com/index/weak-to-strong-generalization/)

Can weak model supervision elicit full capabilities of stronger model?

**Finding:** GPT-2-level model can elicit most of GPT-4's capabilities (close to GPT-3.5-level), but not full recovery.

**Implication:** Weak coordinator supervising strong sub-agent = weak-to-strong problem. Risk budgets must account for supervision limitations.

### Multi-Agent Safety

**Citation:** Cooperative AI Foundation (2024). "Multi-Agent Risks from Advanced AI." [Report](https://www.cooperativeai.com/post/new-report-multi-agent-risks-from-advanced-ai)

Three failure modes:
1. **Miscoordination:** Failure to cooperate despite shared goals
2. **Conflict:** Failure due to differing goals
3. **Collusion:** Undesirable cooperation

Coordinator architecture addresses all three via shared state, risk budgets, and monitoring.

---

## Key Citations by Topic

### Trust Decomposition
- Drexler (2019) - CAIS services architecture
- Greenblatt et al. (2023) - AI Control T/U decomposition
- Christiano et al. (2018) - IDA amplification

### Risk Budgeting
- Anthropic RSP (2023-2025) - Safety buffers
- OpenAI Preparedness (2023-2025) - Capability thresholds
- This framework - Euler allocation from finance

### Coordinator Safety
- AI Control protocols - Trusted monitoring
- Factor(T,U) (2024) - Factored cognition for monitoring
- This framework - Formal coordinator constraints

### Verification
- Dalrymple et al. (2024) - Guaranteed Safe AI
- Urban & Miné (2021) - Formal methods for ML, arXiv:2104.02466
- OpenAI/Apollo (2024) - Scheming detection

### Scalable Oversight
- Leike et al. (2018) - Recursive reward modeling, arXiv:1811.07871
- Irving et al. (2018) - AI Safety via Debate
- Burns et al. (2023) - Weak-to-strong generalization

---

## Unique Contributions of This Framework

1. **Quantitative Risk Composition:** First framework to mathematically compose risks across hierarchical AI systems using Euler allocation

2. **Coordinator Formalization:** Explicit formal treatment of the "trusted overseer" role (informal in other frameworks)

3. **Economic Alignment:** Mechanism design for AI systems (missing from technical safety work)

4. **Practical Integration:** Bridges theoretical safety (IDA, Debate) and deployment reality (RSP, Preparedness)

5. **Heterogeneous Systems:** Safe composition of components at different trust/capability levels

6. **Real-Time Risk Tracking:** Continuous budget monitoring vs. periodic evaluations

7. **Foundation Model Reality:** Accounts for shared base models and fine-tuning
