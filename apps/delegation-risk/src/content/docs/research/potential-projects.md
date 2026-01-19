---
title: "Potential Research Projects"
description: "Research projects derived from the capability containment, coordinator constraints, risk budgeting, and delegation risk framework frameworks"
---

Research projects to validate, extend, and implement the AI safety framework. Projects are organized into eleven categories:

- **Empirical Validation** (3 projects) — Testing core assumptions
- **Cross-Domain Analysis** (4 projects) — Learning from nuclear, finance, carbon markets
- **Formal Methods** (3 projects) — Mathematical foundations
- **Mechanism Design** (3 projects) — Incentive-compatible safety reporting
- **Architecture** (3 projects) — Implementation feasibility
- **Game Theory** (3 projects) — Trust dynamics and Byzantine tolerance
- **Human-AI** (2 projects) — Trust calibration and handoffs
- **Standards & Policy** (3 projects) — Certification and regulation
- **Tools** (3 projects) — Simulation, monitoring, language support
- **Meta-Research** (3 projects) — Historical failures, uncertainty, emergence
- **Agency & Power** (10 projects) — Formalizing capability, agency measurement, strong tools hypothesis

---

## Empirical Validation

### 1. Empirical Scheming Reduction
Does decomposition actually reduce scheming behavior in AI systems?
- Survey existing work on factored cognition and monitoring (Factor(T,U) paper, etc.)
- Find/analyze empirical studies comparing monolithic vs modular AI behavior
- Examine AI Control literature for relevant experiments
- Key question: What's the evidence that limited context prevents strategic deception?

### 2. Forecasting Calibration for Self-Prediction
Can AI systems accurately forecast their own behavior after modifications?
- Benchmark "predict your behavior N steps ahead" with various modifications
- Characterize how calibration degrades with horizon length
- Compare to superforecaster baselines on similar prediction tasks
- Test if forecasting quality scales with capability

### 3. Temperature and Covert Signaling
Does deterministic output (temperature=0) prevent covert communication?
- Run same LLM at temperature=0 vs 1.0 with repeated queries
- Measure output variance and potential information encoding
- Test if high temperature enables steganographic signaling between components
- Quantify "surprise budget" violations

---

## Cross-Domain Analysis

### 4. Nuclear/Aerospace Safety Transfer
Deep dive into operational PRA and SIL frameworks:
- How do fault trees decompose 10⁻⁹ failure targets to components?
- Limitations discovered in practice (Three Mile Island, Fukushima, Challenger)
- How do independence assumptions hold up under stress?
- Can IEC 61508's ASIL decomposition rules (ASIL D = ASIL B + B) adapt to AI?

### 5. Financial Risk Budgeting Methods
Euler allocation and portfolio risk decomposition:
- How do banks cascade risk budgets from board to trading desks?
- Component VaR (CoVaR) computation and full allocation property
- Lessons from LTCM collapse, 2008 crisis, March 2020 risk parity failures
- Applicability of Expected Shortfall vs VaR to AI harm measures

### 6. Carbon Budget Allocation Mechanisms
Climate policy as large-scale risk budgeting:
- Seven effort-sharing approaches (equal per capita, historical responsibility, capability-based, etc.)
- EU ETS implementation: linear reduction factors, benchmarks, carbon leakage protection
- MRV (Monitoring, Reporting, Verification) systems
- Phase 1 failure analysis: over-allocation from poor baseline data

### 7. Pharmacological Safety Margins
How uncertainty factors stack in drug development:
- Therapeutic Index vs Margin of Safety calculations
- FDA uncertainty factors: 10× animal-to-human, 10× human variability, etc.
- Combined factors of 100-1000× as engineering judgment
- Applicability to AI where failure modes are poorly characterized

---

## Formal Methods & Theory

### 8. Compositional Risk Measures
Mathematical foundations for AI risk budgeting:
- Which risk measures are homogeneous (enabling Euler allocation)?
- Survey Markov categories for compositional probability
- When do safety properties compose vs not compose?
- Conditions for additive, multiplicative, sub-additive composition

### 9. Linear Logic for Delegation Risk Budgets
Type systems that enforce resource constraints:
- Bounded Linear Types (Ghica and Smith 2014) for risk tracking
- Light Linear Logic (LLL) for polynomial-time guarantees
- Object capability models for authority tracking
- Practical implementation in AI system design

### 10. Formal Verification Limits
What can and can't be formally verified in AI systems?
- Current state of neural network verification
- Compositional verification via assume-guarantee reasoning
- Gap between verified components and emergent system behavior
- Guaranteed Safe AI (Seshia, Tegmark) Level 1-9 framework analysis

---

## Mechanism Design & Economics

### 11. Incentive-Compatible Safety Reporting
Mechanism design for honest risk disclosure:
- VCG mechanisms applied to AI subsystems reporting risk
- Revelation principle implications for trust reporting
- Shapley values for risk attribution across components
- What makes safety buffers (Anthropic's 6× > 4×) work?

### 12. Trust Insurance and Liability
Economic structures for AI safety:
- Insurance pricing for AI trust violations
- Moral hazard and adverse selection in AI deployment
- Experience rating and deductible structures
- Subrogation and recovery from violating agents

### 13. Trust Markets and Arbitrage
When trust is mispriced:
- Market efficiency for AI trustworthiness
- Information asymmetry between developers and deployers
- Adverse selection in AI agent markets
- Trust derivatives (futures, options, swaps) - feasibility analysis

---

## Architecture & Implementation

### 14. Prototype Architecture Feasibility
Implementation-focused investigation:
- Decomposed research assistant design
- Cost/performance: 10+ fine-tuned narrow models vs one frontier model
- Existing multi-agent frameworks and trust/coordination properties
- Hardware requirements for Byzantine-tolerant redundant coordinators

### 15. Coordinator Redundancy Experiments
Testing diverse coordinator implementations:
- Build 3 coordinators: rule-based, fine-tuned 7B, older frontier (GPT-3.5)
- Compare agreement rates and failure modes
- Red-team attack attempts on each architecture
- Quantify safety improvement from redundancy

### 16. Fine-Tuning vs General Models
Task-specific models for safety:
- Train narrow models for summarization, forecasting, verification, etc.
- Compare behavior predictability to frontier models
- Audit narrow model behavior vs general model
- Cost-benefit analysis of fine-tuning pipeline

---

## Game Theory & Dynamics

### 17. Trust Dynamics Under Adversarial Pressure
Strategic trust building and exploitation:
- Equilibrium behaviors when agents can build then exploit trust
- Deceptive equilibrium analysis: when does "behave well then defect" pay?
- Counter-strategy effectiveness (unpredictable monitoring, delayed trust, trust decay)
- Multi-agent trust learning and reputation systems

### 18. Byzantine Coordinator Voting
Fault tolerance in AI coordination:
- How many coordinators needed for Byzantine tolerance?
- 3f+1 rule application to AI systems
- Cryptographic commitment schemes for coordination decisions
- Empirical testing of voting-based coordination

### 19. Risk Inheritance Algorithms
Mathematical properties of trust flow:
- Compare multiplicative, minimum, harmonic, PageRank propagation
- Multi-path trust combination (max, independence, Dempster-Shafer)
- Trust conductance (electrical analogy) for complex topologies
- Adversarial risk inheritance with Byzantine components

---

## Human-AI Interaction

### 20. Human Trust Calibration
How humans (mis)calibrate trust in AI:
- Over-trust and under-trust patterns
- Calibration interventions (accuracy feedback, confidence display, explanation)
- Trust contagion in human-AI teams
- Trust repair after AI violations

### 21. Trust Handoff Protocols
Human-AI task transitions:
- Specification completeness at human→AI handoffs
- Context sufficiency at AI→human handoffs
- Verification criteria clarity
- Failure modes at handoff points

---

## Standards & Policy

### 22. Trust Labeling and Certification
Standards development:
- Delegation Risk estimation methodologies
- Verification coverage requirements
- Trust concentration limits
- Third-party certification processes

### 23. Regulatory Framework Analysis
Policy implications:
- Maximum allowed Delegation Risk for application categories
- Required verification for high-stakes tasks
- Disclosure requirements for trust relationships
- Liability frameworks for trust violations

### 24. Comparison to Existing AI Safety Frameworks
Situating this work:
- Relationship to CAIS (Drexler 2019)
- Integration with AI Control (Redwood Research 2024)
- Comparison to IDA (Christiano 2018)
- Anthropic RSP, OpenAI preparedness framework analysis

---

## Tools & Infrastructure

### 25. Trust Simulation Framework
Software for trust dynamics:
- Simulate trust evolution before deployment
- Stress testing (adversarial fraction, coordinated attacks, cascade failures)
- Trust regression testing after architectural changes
- Red team trust testing automation

### 26. Trust Dashboard and Monitoring
Operational tooling:
- Real-time Delegation Risk tracking
- Trust concentration heat maps
- Verification coverage metrics
- Alert systems for trust violations

### 27. Trust Programming Language Features
Language-level support:
- Trust types with provenance tracking
- Compiler-checked trust requirements
- Trust context blocks with capability limits
- Integration with existing type systems

---

## Meta-Research

### 28. Historical Failure Analysis
Learning from past risk management failures:
- Finance: LTCM, 2008 crisis, correlation breakdowns
- Nuclear: TMI, Fukushima, Challenger organizational failures
- Carbon: EU ETS Phase 1 over-allocation
- Pattern extraction for AI safety

### 29. Trust Uncertainty Quantification
Distributions over trust levels:
- Beta distributions for trust estimates
- Uncertainty propagation through trust calculations
- Confidence intervals for Delegation Risk
- Robust optimization under trust uncertainty

### 30. Emergent Capability Trust
The unknown unknowns problem:
- How to bound trust when capabilities are unknown?
- Detecting emergence before exploitation
- Capability elicitation and red-teaming
- Dynamic trust adjustment as capabilities are discovered

---

## Agency, Power, and Capability Formalization

Research questions related to [Agent, Power, and Authority Formalization](/power-dynamics/agent-power-formalization/).

### 31. Empirical Agency Measurement
Can we reliably measure agency in AI systems?
- Behavioral tests for goal-directedness (perturbation studies, goal persistence)
- Temporal consistency probes (does apparent utility function drift?)
- Cross-context generalization (same goals in different environments?)
- Comparison of agency metrics to capability benchmarks

### 32. The Strong Tools Hypothesis
Is high capability achievable with low agency?
- Analyze existing high-power, low-agency systems (search engines, compilers, databases)
- What architectural patterns keep agency low?
- Theoretical limits: As capability increases, does agency necessarily increase?
- Empirical studies: Track agency measures across model scales

### 33. Power Accumulation Dynamics
When and how does AI system power grow over time?
- Measure power growth rate (λ) for deployed systems
- Identify factors that increase λ (resource access, influence, information accumulation)
- Architectural constraints that bound λ to zero
- Early warning indicators for power accumulation

### 34. Agency-Capability Frontier
What's the shape of the safety-capability tradeoff?
- Map (Agency, Power, Risk) tuples for diverse systems
- Is there a Pareto frontier? What's its shape?
- Can alignment research push the frontier outward?
- Compare frontier across architectural approaches

### 35. Multi-Agent Agency Aggregation
How does agency combine across components?
- Does decomposition reduce total system agency?
- Conditions for agency "emergence" in multi-agent systems
- Voting/consensus effects on aggregate agency
- Can low-agency components form high-agency collectives?

### 36. RACAP Optimization
Design systems that maximize Risk-Adjusted Capability:
- Sensitivity analysis: Which design choices most affect RACAP?
- Optimal agency level for given tasks
- Power allocation across components
- Benchmark architectures by RACAP

### 37. Power-Seeking Behavior Detection
Operationalize power-seeking in deployed systems:
- Behavioral signatures of instrumental convergence
- Resource acquisition monitoring
- Influence expansion detection
- Shutdown avoidance indicators

### 38. Authority-Power Gap Analysis
When does power exceed granted authority?
- Methods for detecting authority violations
- Dynamic authority adjustment protocols
- Enforcement mechanisms when power exceeds authority
- Case studies: Historical authority-power gaps (institutions, organizations)

### 39. Formal Bounds on Power
Mathematical limits on achievable power:
- Given resource constraints, what's maximum power?
- Power bounds from capability constraints
- Information-theoretic limits on influence
- Compositional power bounds for decomposed systems

### 40. Agency Evolution During Training
How does agency develop during AI training?
- Track agency metrics across training runs
- Phase transitions in goal-directedness
- RLHF effects on agency
- Can training be modified to suppress agency while maintaining capability?
