---
title: "Formal Verification Limits for AI Systems"
description: "What can and cannot be formally verified in AI systems"
---

# Formal Verification Limits for AI Systems

## Executive Summary

Formal verification of AI systems, particularly neural networks, has made significant strides but faces fundamental theoretical and practical limits. While we can verify specific properties like local robustness bounds and Lipschitz constants for relatively small networks (up to ~1M neurons in specialized cases), many critical safety properties remain unverifiable due to computational complexity, undecidability results, and the gap between verified components and emergent system behavior.

This document synthesizes current capabilities, scalability limits, and fundamental barriers to provide realistic expectations for what formal verification can—and cannot—achieve in AI safety frameworks.

---

## 1. Current State of Neural Network Verification

### 1.1 Properties That CAN Be Verified

Modern neural network verification tools can formally prove several important properties:

#### Adversarial Robustness Bounds
- **Definition**: Proving that a network's classification output remains unchanged under bounded input perturbations (typically L∞ or L2 norm bounds)
- **Practical capability**: Successfully verified for small-to-medium networks on MNIST, CIFAR-10 with perturbation bounds ε ≤ 0.3
- **Example**: α,β-CROWN achieved 6.68% verified error on MNIST at ε=0.3, outperforming even PGD adversarial training (~12% error) ([Zhang et al., 2024](https://github.com/Verified-Intelligence/alpha-beta-CROWN))

#### Lipschitz Constants
- **Definition**: Bounding how much the network output can change relative to input changes, formally: ||f(x₁) - f(x₂)|| ≤ L||x₁ - x₂||
- **Methods**: Semidefinite programming (SDP), branch-and-bound (LipBaB), compositional estimation
- **Applications**: Certified robustness certification, stability analysis for reinforcement learning controllers
- **Scalability**: Compositional approaches can handle larger networks by decomposing into layer-by-layer verification ([Fazlyab et al., NeurIPS 2019](https://proceedings.neurips.cc/paper_files/paper/2019/file/95e1533eb1b20a97777749fb94fdb944-Paper.pdf))

#### Reachability Properties
- **Definition**: Determining which outputs are reachable from a given input set
- **Applications**: Safety verification for neural network control systems (NNCS), collision avoidance
- **Tools**: NNV 2.0 supports reachability for feedforward, convolutional, recurrent networks, and neural ODEs ([Tran et al., CAV 2023](https://link.springer.com/chapter/10.1007/978-3-031-37703-7_19))

#### Fairness Properties
- **Individual fairness**: Similar individuals receive similar treatment
- **Counterfactual fairness**: Outcomes don't depend on sensitive attributes
- **Tool**: FairNNV leverages reachability analysis to verify fairness with quantitative "Verified Fairness" (VF) scores ([FairNNV, ASE 2024](https://dl.acm.org/doi/fullHtml/10.1145/3677052.3698677))

#### Input-Output Specifications
- **Definition**: Proving that for inputs satisfying precondition A, outputs satisfy postcondition G
- **Example**: "If no vertical separation and intruder nearby, never output Clear-of-Conflict (COC) advisory" for ACAS Xu collision avoidance
- **Format**: Standardized in VNN-LIB specification language

### 1.2 State-of-the-Art Verification Tools

#### α,β-CROWN (Leading Verifier)
- **Performance**: Winner of VNN-COMP 2021-2025 competitions
- **Method**: Linear bound propagation with GPU-accelerated branch-and-bound
- **Scalability**: Can handle networks with millions of parameters
- **Recent advances**:
  - BICCOS (Zhou et al., NeurIPS 2024): Efficient cutting plane generation for tighter bounds
  - GenBaB (Shi et al., TACAS 2025): Extends to general nonlinear functions, enabling verification of Transformers
  - Clip-and-Verify (Zhou et al., NeurIPS 2025): Efficiently handles linear constraints, accelerates provably stable neural control systems
- **Repository**: [github.com/Verified-Intelligence/alpha-beta-CROWN](https://github.com/Verified-Intelligence/alpha-beta-CROWN)

#### Marabou 2.0 (SMT-Based Verifier)
- **Method**: Satisfiability Modulo Theories (SMT) solving with lazy constraint satisfaction
- **Architecture**: Simplex-based core with network-level reasoning, preprocessor, and (MI)LP interface
- **Parallelization**: Split-and-conquer and portfolio modes for distributed verification
- **Optimizations**: Avoids costly tableau re-computation, achieving >50% runtime reduction
- **Activation functions**: ReLU, Sigmoid, MaxPooling
- **Publication**: [Marabou 2.0, CAV 2024](https://link.springer.com/chapter/10.1007/978-3-031-65630-9_13)

#### ERAN (Abstract Interpretation-Based)
- **Institution**: ETH Zurich SRI Lab
- **Abstract domains**:
  - **DeepZ**: Specialized zonotope transformers for ReLU, Sigmoid, Tanh
  - **DeepPoly**: Combines floating-point polyhedra with intervals ([Singh et al., POPL 2019](https://dl.acm.org/doi/10.1145/3290354))
  - **GPUPoly**: GPU-accelerated DeepPoly for larger networks ([MLSys 2021](https://github.com/eth-sri/eran))
  - **RefineZono/RefinePoly**: Combines abstract interpretation with (MI)LP refinement for higher precision
- **Trade-off**: Incomplete (sound but may fail to prove true properties) but scalable
- **Library**: Built on ELINA numerical abstractions

#### Other Notable Tools
- **NeuralSAT**: High-performance verification tool ([CAV 2024](https://link.springer.com/chapter/10.1007/978-3-031-98679-6_19))
- **PyRAT**: Python Reachability Assessment Tool, 2nd place in VNN-COMP 2024 ([CEA, 2024](https://arxiv.org/html/2410.23903))
- **nnenum**: Complete enumeration-based verifier

### 1.3 Scalability Limits

#### Network Size Constraints

**Current practical limits**:
- **Small networks**: Hundreds of neurons, few layers → complete verification possible
- **Medium networks**: ~170K neurons → challenging but feasible with GPU acceleration
- **Large networks**: 1M neurons (e.g., 34-layer ResNet) → verified in ~34.5ms using GPUPoly ([Müller et al., NeurIPS 2021](https://arxiv.org/pdf/2007.10868))
- **Very large networks**: Modern LLMs with billions of parameters → currently infeasible for complete verification

**Specific benchmarks**:
- **ACAS Xu**: 45 networks, each with 8 layers, 300 ReLU neurons, 5 inputs/outputs
  - 10 open-loop properties can be verified
  - Closed-loop properties remain "out of reach" for most verifiers ([Sun et al., HSCC 2019](https://dl.acm.org/doi/10.1145/3302504.3311802))
- **Control systems**: FFNNs with 5 ReLU layers × 20 neurons verified for adaptive cruise control
- **Image classifiers**: ResNets on CIFAR-10, TinyImageNet verified for robustness with specialized techniques

#### Computational Complexity Barriers

**Fundamental complexity results**:

1. **Reachability is NP-Complete** ([Sälzer & Lange, RP 2021](https://link.springer.com/chapter/10.1007/978-3-030-89716-1_10))
   - Holds even for networks with **one hidden layer** and minimal architecture:
     - Single negative weight, single zero weight, single positive weight
     - Output dimension of 1
   - Problem: "Does the network compute valid output given some valid input?"

2. **Complexity varies by activation function** ([Wurm, RP 2023](https://link.springer.com/chapter/10.1007/978-3-031-45286-4_2)):
   - **ReLU & piecewise linear**: NP-complete
   - **Non-linear continuous functions**: NP-hard for almost all suitable activations
   - **Non-linear polynomials**: Complete for Existential Theory of Reals (∃ℝ)
   - **Exponential functions**: ∃ℝ-hard

3. **Exponential branching in branch-and-bound**:
   - BaB splits ReLU neurons into positive (active) and negative (inactive) cases
   - Number of subproblems grows exponentially with unstable neurons
   - Mitigations: learned branching strategies (50% reduction via GNNs), bound implication graphs, order-leading exploration (25-80× speedups on MNIST/CIFAR-10) ([Ferrari et al., 2024](https://arxiv.org/html/2507.17453))

**Practical implications**:
- Verification time can range from minutes (small networks) to hours (medium networks) to intractable (large networks)
- Standard algorithms run out of memory on ~170K neuron benchmarks without GPU optimization
- Trade-off between completeness (guaranteed result) and scalability

#### Training for Verification

To address scalability, researchers are developing **verification-aware training**:

- **RS Loss**: Regularization inducing neuron stability, reducing verification complexity ([2024, CAV](https://link.springer.com/chapter/10.1007/978-3-031-57256-2_2))
- **Certified training**: CROWN-IBP combines Interval Bound Propagation (IBP) with CROWN bounds during training, achieving better verified accuracy than post-hoc verification ([Zhang et al., ICLR 2020](https://github.com/huanzhang12/CROWN-IBP))
- **Key insight**: Fewer unstable neurons → exponentially fewer branches needed → faster verification

### 1.4 Properties That CANNOT Be Verified (and Why)

#### Undecidable Properties

**Rice's Theorem implications** ([Alfonseca et al., Nature Scientific Reports 2025](https://www.nature.com/articles/s41598-025-99060-2)):
- **Rice's Theorem**: Any non-trivial semantic property of programs is undecidable
- **Applied to AI**: The inner alignment problem is undecidable—cannot algorithmically determine if an arbitrary AI satisfies a non-trivial alignment function
- **Related undecidable problems**:
  - Harming problem: Will AI cause harm to humans?
  - Containment problem: Can AI be reliably contained?
  - AI control problem: Can we maintain control?
  - Ethics compliance: Does AI satisfy ethical constraints?

**Practical consequence**: We **cannot** have a general algorithm that decides arbitrary semantic properties for all neural networks. Must restrict to specific, tractable property classes.

#### Algorithmic Undecidability in Neural Network Training

For neural networks used to solve PDEs:
- Optimal NNs can be proven to exist mathematically
- **No algorithm can compute them reliably** in many cases
- A posteriori verification (checking after training) is essential but doesn't guarantee finding a solution ([Trustworthy AI in Numerics, 2025](https://arxiv.org/html/2509.26122))

#### Emergent System Behavior

**The compositional verification gap**:
- Individual components may be verified
- **System-level emergent behavior** cannot be fully predicted from component properties alone
- Example: Multiple verified neural controllers may interact in unforeseen ways
- Mitigation: Assume-guarantee contracts (see Section 2), but gaps remain ([AlgebraicSystems, ICRA 2022](https://ieeexplore.ieee.org/document/9797550/))

#### Intractable-in-Practice Properties

Even decidable properties may be computationally intractable:

1. **High-dimensional input spaces**: Image-based controllers processing camera inputs
   - Solution: Use Variational Autoencoders (VAE) to encode to interpretable latent space (SEVIN framework, 2025)

2. **Global properties over all possible inputs**: May require enumeration of exponentially many cases
   - Solution: Statistical verification with PAC bounds (see Section 5.2)

3. **Closed-loop system verification**: Requires modeling environment, adversaries, continuous dynamics
   - ACAS Xu closed-loop verification remains "out of reach" even for small networks

4. **General semantic properties**: "Will this LLM ever generate harmful content?"
   - Too broad, undecidable
   - Must narrow to specific, bounded properties

---

## 2. Compositional Verification

Compositional verification addresses scalability by breaking large systems into components with formal interfaces. However, this introduces new challenges around emergent behavior.

### 2.1 Assume-Guarantee Reasoning

**Core concept**: Specify each component C with a contract (A, G):
- **Assumptions (A)**: What C requires from its environment
- **Guarantees (G)**: What C promises if A is met
- **Implementation**: Component M implements contract if M || E |= G for all environments E that satisfy A

**Advantages**:
- **Modularity**: Verify components independently
- **Scalability**: Avoid monolithic verification of entire system
- **Concurrent design**: Multiple teams develop components in parallel

### 2.2 Contract-Based Design: Pacti Tool

**Pacti** ([Incer et al., ACM Transactions on Cyber-Physical Systems, January 2025](https://dl.acm.org/doi/10.1145/3704736)):
- **Institution**: Developed by teams from UC Berkeley, Caltech, MIT, and others (Seshia, Murray, Sangiovanni-Vincentelli)
- **Capabilities**:
  - Algebraic operations on contracts: composition, quotient, merge, refinement
  - Multiple viewpoints (performance, timing, energy, etc.)
  - Computes contract at system interface from component contracts
  - Enables inspection of composition results to diagnose failures

**Key innovation**: Efficient algorithms for contract operations at scale
- Traditional contract theory existed for 15+ years but lacked practical implementations
- Pacti provides scalable computation of contract specifications

**Applications**:

1. **Aerospace Systems** ([Pandey et al., arXiv 2024](https://arxiv.org/html/2409.02218)):
   - Spacecraft rendezvous mission design
   - Aircraft thermal management systems
   - Enables "agile, early analysis and exploration"

2. **Autonomous Systems with Learning Components** ([ScenicProver, arXiv 2024](https://arxiv.org/html/2511.02164)):
   - Compositional verification of cyber-physical systems with DNNs
   - Automatically synthesizes assumptions on DNN behavior that guarantee safety
   - Integrates with Scenic probabilistic programming language

3. **Fault Diagnosis** ([Graebener et al., CAV 2022](https://link.springer.com/chapter/10.1007/978-3-032-05435-7_24)):
   - Identifies components responsible for system-level failures
   - Exploits compositional system design

**Python library**: Available at [pypi.org/project/Pacti](https://pypi.org/project/Pacti/)

### 2.3 AGREE Tool for Avionics

**AGREE** (Assume-Guarantee Reasoning Environment):
- **Domain**: Aerospace and defense industries
- **Purpose**: Compositional reasoning for architecture models
- **Challenge**: Industry adoption remains limited despite demonstrated capabilities
- **Barriers**:
  - Difficulty understanding counterexamples (large tabular variable dumps)
  - Lack of formal methods expertise among engineers
  - Need for human-centered verification workflows

**DARPA PROVERS Program**:
- Goal: Develop scalable, human-centered formal verification
- Focus: Enable usage by engineers without extensive formal methods background
- Approach: Integrate into aerospace engineering practices

**AGREE-Dog Copilot** ([NFM 2022](https://link.springer.com/chapter/10.1007/978-3-032-07132-3_8)):
- Neuro-symbolic approach to enhance model-based systems engineering
- Addresses counterexample interpretability

**Certification**: DO-333 standard (part of DO-178C) guides formal methods for airborne software

### 2.4 When Compositional Verification Works vs. Fails

#### ✅ Compositional Verification Succeeds When:

1. **Component interfaces are well-defined**: Clear input/output specifications
2. **Interactions are constrained**: Contracts capture all relevant dependencies
3. **Properties are compositional**: System property can be derived from component properties
   - Example: Two verified collision-avoidance modules won't interfere if contracts specify non-overlapping control regions
4. **Environment is modeled**: Assumptions about context are accurate

#### ❌ Compositional Verification Fails When:

1. **Emergent behavior arises**: System exhibits behaviors not predictable from components
   - "We cannot use their parts in isolation to examine their overall behavior" ([AlgebraicSystems, ICRA 2022](https://ieeexplore.ieee.org/document/9797550/))
   - Example: Interaction between multiple ML perception modules may create unforeseen failure modes

2. **Contracts are too weak**: Assumptions/guarantees don't capture critical properties
   - Under-specification of environment behavior
   - Missing constraints on component interactions

3. **Infinite state spaces**: Hybrid systems with continuous dynamics
   - May require infinite contracts or overapproximation

4. **Learning components lack formal specs**: DNNs don't have precise specifications
   - Pacti/ScenicProver address this by automatically synthesizing DNN behavioral assumptions
   - Gap: Synthesized assumptions may be conservative (reject safe systems) or unsound (miss unsafe cases)

### 2.5 The Verified-Unverified Component Gap

**Fundamental challenge**: Real systems mix verified and unverified components

**Example scenario**:
- Verified control module (formally proven stable)
- Unverified ML perception module (trained on data, no formal guarantees)
- **Question**: What can we guarantee about the full system?

**Current approaches**:

1. **Runtime Assurance / Simplex Architecture**:
   - Combine unverified "advanced" controller with verified "safe" fallback
   - Monitor switches to fallback when advanced controller violates safety constraints
   - **SOTER system** (Berkeley Verified AI): Implements this paradigm ([Toward Verified AI, CACM 2022](https://cacm.acm.org/research/toward-verified-artificial-intelligence/))
   - **Limitation**: Requires manual design of monitors and fallback strategies; fallback may be overly conservative

2. **Assume-Guarantee Wrapping**:
   - Wrap unverified component in verified "envelope" that monitors inputs/outputs
   - If component behavior violates assumptions, trigger mitigation
   - **Limitation**: Only works for limited classes of systems; monitor must be complete

3. **Statistical Verification** (see Section 5.2):
   - Provide probabilistic guarantees with confidence bounds
   - Complements formal verification for components that can't be verified exactly

**Open research questions**:
- Automated synthesis of runtime monitors for ML components
- Introspective environment modeling (system self-monitors its assumptions)
- Balancing conservatism (frequent fallback) vs. risk (rare but catastrophic failures)

---

## 3. Guaranteed Safe AI Framework

### 3.1 The GS AI Framework (Seshia, Tegmark, et al.)

**Paper**: "Towards Guaranteed Safe AI: A Framework for Ensuring Robust and Reliable AI Systems" ([Dalrymple, Skalse, Bengio, Russell, Tegmark, Seshia, et al., arXiv:2405.06624, May 2024](https://arxiv.org/abs/2405.06624))

**Core definition**: Guaranteed Safe (GS) AI approaches produce AI systems equipped with **high-assurance quantitative safety guarantees**.

**Three essential components**:

1. **World Model (W)**: Mathematical description of how the AI system affects the outside world
   - Includes physical dynamics, environment model, actuator effects
   - Can be simplified for specific properties (e.g., "AI never copies itself" needs less detail than "AI safely navigates traffic")

2. **Safety Specification (S)**: Mathematical description of acceptable effects
   - Formal language (temporal logic, probabilistic bounds, etc.)
   - Example: "Collision probability < 10⁻⁹ per flight hour"
   - Example: "Never communicate outside trusted channel"

3. **Verifier (V)**: Provides auditable proof certificate that AI satisfies S relative to W
   - Proof must be checkable by independent parties
   - Enables coordination without mutual trust

**Key contrast**: GS AI relies on **formal proofs**, not empirical evaluations, red teaming, or qualitative intuitions
- Empirical methods are vulnerable to adversaries who may be more skilled at finding failure modes
- Formal guarantees enable **independently auditable assurance** and **zero-knowledge verification** for coordination

### 3.2 Spectrum of Verification Rigor (Levels 1-9)

The paper outlines a spectrum from weak (empirical) to strong (provable) assurance:

#### Levels 1-5: Empirical Approaches (Not GS AI)

- **Level 1**: Ad-hoc testing
- **Level 2**: Structured test suites
- **Level 3**: Red teaming
- **Level 4**: Adversarial testing with reward for finding failures
- **Level 5**: White-box fuzzing with code coverage

**Limitation**: No guarantees; adversaries may find missed cases

#### Level 6: Asymptotic Coverage

- Evaluation system would eventually cover every possible input given infinite time
- Still no finite-time guarantees

#### Level 7: White-Box Fuzzing with Asymptotic Coverage

- Prioritizes areas where safety concerns are most likely
- Combines gradient optimization with asymptotic coverage
- Still lacks finite-time bounds

#### Level 8: Non-Asymptotic Convergence Bounds

- **Key innovation**: Formula for how much of state space is covered at time t
- Can run for finite time T and know how much remains unverified
- Example: "After 1000 hours of testing, we've covered 99.9% of state space"
- **Gap to Level 9**: Coverage ≠ safety; could miss critical 0.1%

#### Level 9: Sound Probabilistic Bound (GS AI Threshold)

- **Definition**: Provable upper bound on failure probability
- True probability ≤ verified bound
- Example: "P(collision) ≤ 10⁻⁹" with formal proof
- **Status**: Approaches at this level qualify as Guaranteed Safe AI

**Quote from paper**: "Different approaches to verification can be projected onto a spectrum according to how much safety they would grant if successfully implemented. Approaches listed in green fall into the GS AI family."

### 3.3 Practical Examples Achieved

#### ✅ Currently Achievable (Domain-Specific)

1. **Automated controller design** ([Paper, Section 4.1](https://arxiv.org/abs/2405.06624)):
   - Routine in classical control theory
   - Specifications: "Stay in safe region," "Avoid collisions"
   - Probabilistic guarantees for robotics collision avoidance

2. **Traditional software systems**:
   - Authoring safety specs is standard practice
   - Example properties: Memory safety, absence of buffer overflows
   - Tools: CompCert (verified compiler), seL4 (verified OS microkernel)

3. **Narrow AI safety properties** (with simple world models):
   - "AI never copies itself to external computer"
   - "AI never communicates outside trusted channel"
   - "AI never tampers with sensor"
   - **Key**: These don't require detailed world models—mostly interface constraints

4. **ACAS Xu verification** (limited):
   - Open-loop properties for small networks verified
   - Closed-loop with simplified assumptions (perfect sensors, ideal maneuvers, straight-flying intruder)

#### 🔄 Proposed Proof-of-Concept Projects

**Provably unpickable lock** ([ARIA Programme, 2024](https://www.alignmentforum.org/posts/LkECxpbjvSifPfjnb/towards-guaranteed-safe-ai-a-framework-for-ensuring-robust-1)):
- Requires: Basic physics model, logic for component composition, adversarial test harnesses
- **Challenge**: Zac Hatfield-Dodds (Anthropic/Hypothesis) bet against achieving this by 2026-2027
- **Purpose**: Demonstrate GS AI stack in well-understood mechanical engineering domain

**Robot solar panel installer**:
- Task: Install panels without damaging animals or irreversibly affecting structures
- Communication: Only via highly structured script
- **Benefit**: Valuable, ambitious task that avoids "paralysis" (AI does nothing)

#### ❌ Not Yet Achievable

1. **General-purpose AGI with safety guarantees**: Far beyond current capabilities
2. **Full closed-loop ACAS Xu verification**: "Out of reach" even for small networks
3. **LLM alignment verification**: Undecidable for general semantic properties; even narrow properties intractable at scale
4. **Emergent multi-agent system safety**: Interaction complexity exceeds verification capacity

### 3.4 Fundamental Limitations Acknowledged in Framework

**From the paper**:

1. **Paralysis**: "Most likely failure mode" — AI system does nothing to avoid violating specs
   - Mitigation: Carefully design specifications to allow valuable actions

2. **World model accuracy**: Guarantees are relative to world model W
   - If W doesn't match reality, guarantees may not hold
   - Example: Physics simulation may not capture all real-world edge cases

3. **Specification completeness**: Safety spec S must capture all relevant harms
   - Under-specified S → unintended behaviors may be "safe" according to S but harmful
   - Requires deep understanding of domain

4. **Computational intractability**: Even with sound verifier, verification may take infeasible time
   - Level 9 guarantees are theoretical; practical achievement depends on problem structure

5. **Adversarial world models**: If AI can influence world model (e.g., tamper with sensors), guarantees break
   - Requires trusted world model foundation

**Seshia et al. (2022) position** ([referenced in GS AI paper](https://arxiv.org/abs/2405.06624)):
- Even when individual AI components perform hard-to-formalize tasks, safety can often be formalized at **full system level**
- Compositional decomposition can aid scalable analysis

**Tegmark & Omohundro (2023)** ([arXiv:2309.01933](https://arxiv.org/abs/2309.01933)):
- "Provably safe systems: the only path to controllable AGI"
- Proposes hierarchy of safety specifications down to physical level
- Argues this will soon be technically feasible using advanced AI for formal verification and mechanistic interpretability
- **Controversial claim**: Many in ML community dispute feasibility timeline

---

## 4. Undecidability and Complexity Results

### 4.1 What is Provably Impossible to Verify

#### Rice's Theorem: The Fundamental Barrier

**Rice's Theorem** ([Turing-complete computation](https://en.wikipedia.org/wiki/Rice's_theorem)):
- **Statement**: Any non-trivial semantic property of the language recognized by a Turing machine is undecidable
- **Semantic property**: Property about the overall behavior or output (not syntactic like code length)
- **Non-trivial**: At least one program satisfies the property and at least one doesn't

**Implications for AI** ([Alfonseca et al., Nature Scientific Reports 2025](https://www.nature.com/articles/s41598-025-99060-2)):

1. **Inner alignment problem is undecidable**:
   - Problem: "Does arbitrary AI model M satisfice non-trivial alignment function F?"
   - Result: No algorithm can decide this for all M
   - Proof: Reduction to Halting Problem

2. **Specific undecidable AI problems**:
   - **Harming problem**: Will AI cause harm to humans?
   - **Containment problem**: Can AI be reliably contained?
   - **AI control problem**: Can we maintain control over AI?
   - **Monitorability**: Can we detect all unsafe behaviors?
   - **Ethics compliance**: Does AI satisfy ethical constraints?

3. **Any non-trivial behavioral question**:
   - "Does this program ever output letter X?"
   - "Does this NN ever reach internal state S?"
   - "Does this agent ever take action outside safe set A?"
   - All undecidable for arbitrary programs/networks

**Constructive response** ([Paper, Section 5](https://www.nature.com/articles/s41598-025-99060-2)):
- **Enumerable set of provably aligned AIs**: Constructed from finite set of provenly aligned operations
- **Implication**: Alignment should be **guaranteed by architecture**, not imposed post-hoc on arbitrary models
- Cannot verify arbitrary AI; must design verifiable AI from ground up

#### Impossibility of Safe, Trusted AGI (Under Specific Definitions)

**Panigrahy (2024)** ([arXiv:2509.21654](https://arxiv.org/pdf/2509.21654)):
- **Definitions**:
  - **Safe**: System never makes false claims
  - **Trusted**: Assume system is safe
  - **AGI**: Always matches or exceeds human capability
- **Result**: For these formal definitions, a safe and trusted AI system **cannot be an AGI**
- **Interpretation**: Fundamental incompatibility between perfect safety and superhuman capability
- **Note**: Controversial; depends heavily on strict definitions

### 4.2 Computational Complexity of Verification

#### NP-Completeness of Neural Network Reachability

**Core result** ([Sälzer & Lange, RP 2021](https://link.springer.com/chapter/10.1007/978-3-030-89716-1_10)):
- **Problem**: "Does network compute valid output given valid input?" (reachability)
- **Result**: NP-complete even for simplest networks:
  - **One hidden layer**
  - **Output dimension = 1**
  - **Minimal parameters**: One negative weight, one zero, one positive weight

**Implication**: No polynomial-time algorithm exists (unless P=NP)

**Extended results** ([Wurm, RP 2023](https://link.springer.com/chapter/10.1007/978-3-031-45286-4_2)):

| Activation Function | Complexity |
|---------------------|------------|
| ReLU | NP-complete |
| Piecewise linear (rational coefficients, non-linear) | NP-complete |
| Non-linear continuous | NP-hard (almost all) |
| Non-linear polynomial | ∃ℝ-complete |
| Exponential | ∃ℝ-hard |

**∃ℝ** (Existential Theory of Reals): Complexity class for deciding existence of real solutions to polynomial equations
- Believed to be harder than NP
- Exact complexity relationship to NP unknown

#### Robustness Verification Complexity

**Piecewise linear + semi-linear metrics** ([Wurm et al.](https://link.springer.com/content/pdf/10.1007/978-3-031-60599-4_18.pdf)):
- With sum-norm or max-norm: Most problems in P or NP
- "Conquerable in semi-linear setting"

**General non-linear activations**: Significantly harder

#### Exponential Branching in Branch-and-Bound

**Problem structure**:
- BaB splits each unstable ReLU neuron into 2 cases (active/inactive)
- n unstable neurons → up to 2^n subproblems
- Modern networks: hundreds to thousands of unstable neurons

**Mitigation strategies**:

1. **Learned branching** ([Ferrari et al., NeurIPS 2021](https://openreview.net/forum?id=B1evfa4tPB)):
   - Graph neural networks predict which neurons to branch on
   - 50% reduction in branches and verification time

2. **Bound implication graphs** ([OpenReview 2024](https://openreview.net/forum?id=mMh4W72Hhe)):
   - Reuse pre-computed variables from bound propagation
   - Find implications among neurons (e.g., if neuron A > 0, then neuron B > 0)
   - Reduces branching needs

3. **Order-leading exploration** ([arXiv:2507.17453, 2024](https://arxiv.org/abs/2507.17453)):
   - Prioritize subproblems likely to contain counterexamples
   - 25× speedup on MNIST, 80× on CIFAR-10

**Fundamental limit**: Without new algorithmic breakthroughs, verification time grows exponentially with network complexity

### 4.3 What Can Be Decided with Caveats

#### Local Properties (Tractable)

- **Local robustness**: ε-ball around single input point
  - Tools can verify for small networks
  - Scales to medium networks with GPU acceleration

- **Specific input-output pairs**: Concrete test cases
  - Deterministic evaluation (not verification, but useful)

#### Global Properties (Often Intractable)

- **All possible inputs**: Requires covering exponential input space
- **Emergent behaviors**: May not reduce to local properties

#### Approximate Verification (Tractable but Incomplete)

- **Abstract interpretation** (ERAN, DeepPoly):
  - Overapproximates reachable set
  - Sound (no false positives for safety) but incomplete (may fail to verify true properties)
  - Polynomial time for many domains

- **Convex relaxations** (CROWN, α,β-CROWN):
  - Relax non-convex verification problem to convex optimization
  - Fast, scalable, but conservative

**Trade-off**: Precision vs. scalability
- Simple domains (intervals) → fast but imprecise
- Complex domains (polyhedra) → precise but exponential cost
- Middle ground (zonotopes, DeepPoly) → practical balance

---

## 5. Practical Verification Approaches

### 5.1 Runtime Monitoring vs. Static Verification

#### Static Verification

**Definition**: Analyze program/network before execution to prove properties hold for all runs

**Advantages**:
- **Coverage**: Proves properties across all possible executions
- **No runtime overhead**: Verification done offline
- **Strong guarantees**: If verification succeeds, property holds unconditionally

**Disadvantages**:
- **Scalability**: Computationally expensive; may not terminate for complex systems
- **Conservatism**: May reject safe systems due to imprecise analysis
- **Limited automation**: Powerful judgments hard to achieve automatically

**Best for**:
- Safety-critical components where offline analysis is feasible
- Systems with bounded state spaces
- Properties amenable to formal methods (safety, invariants)

#### Runtime Monitoring

**Definition**: Observe system execution and check properties online during operation

**Advantages**:
- **Full automation**: No need for complex proofs
- **Precision**: Observes actual behavior, no overapproximation
- **Handles complex systems**: Doesn't require analyzing all possible runs

**Disadvantages**:
- **Single run**: Can only judge current execution, not future/alternative runs
- **Reactive**: Detects violations after they occur (or are imminent)
- **Runtime overhead**: Monitoring consumes computational resources

**Best for**:
- Large-scale systems where static verification is intractable
- Non-safety-critical properties (fairness, performance)
- Complementing static verification for defense-in-depth

#### Hybrid: Runtime Assurance

**Simplex Architecture**:
- Combines unverified high-performance controller with verified safe fallback
- Runtime monitor switches to fallback when safety boundary approached
- **Example**: SOTER system ([Berkeley Verified AI](https://berkeleylearnverify.github.io/VerifiedAIWebsite/))

**Challenges**:
- Manual design of monitors and fallback strategies
- Ensuring monitor itself is correct (verified monitor for unverified system)
- Minimizing unnecessary switches (false alarms)

**Open research**:
- Automated synthesis of monitors for ML components
- Introspective environment modeling (self-monitoring assumptions)

### 5.2 Statistical Verification and PAC Bounds

#### Probably Approximately Correct (PAC) Verification

**Core idea**: Provide probabilistic guarantees with confidence bounds

**Definition**: Property holds with probability ≥ 1 - δ, within error ε

**Example**: "AI system is fair within ε = 0.05 with confidence 1 - δ = 0.99"

#### Statistical Runtime Verification for LLMs

**RoMA Framework** ([Springer 2022](https://link.springer.com/chapter/10.1007/978-3-032-05435-7_25), adapted for LLMs 2024):
- **Problem**: Verifying local robustness is NP-complete; intractable for large LLMs
- **Solution**: Probabilistic robustness estimates via statistical sampling
- **Method**: Analyze confidence score distributions under semantic perturbations
- **Results**:
  - Comparable accuracy to formal verification (within 1% deviation)
  - Reduces verification time from **hours to minutes**
  - Enables black-box deployment settings (no white-box access required)

#### PAC Fairness Monitoring

**Approach** ([Springer 2023](https://link.springer.com/chapter/10.1007/978-3-031-44267-4_15)):
- **Monitors observe long event sequence** from system
- **After each observation**: Compute statistically rigorous estimate of fairness
- **PAC-style error bound**: Gets tighter as sequence gets longer
- **Confidence level**: User-specified (e.g., 95%, 99%)

**Advantages**:
- **Computational lightweight**: Real-time monitoring feasible
- **Model-independent**: Doesn't require explicit system model
- **Dynamic**: Tracks fairness as system evolves

**Comparison to static analysis**:
- Static: Model-based, design-time or inspection-time
- Runtime: Model-free, handles partially unknown or imprecise models

#### PAC Verification of Statistical Algorithms

**General framework** ([COLT 2023](https://proceedings.mlr.press/v195/mutreja23a/mutreja23a.pdf)):
- Extends beyond agnostic PAC learning
- Interactive proof for verifying ML models
- Applicable to wider variety of statistical settings

#### Limitations of Statistical Verification

- **Not deductive**: Probabilistic, not absolute guarantees
- **Sample complexity**: May require many observations for tight bounds
- **Distribution assumptions**: Typically assume i.i.d. samples; violations undermine guarantees
- **Adversarial settings**: Adaptive adversaries may exploit statistical methods

**When to use**:
- Full formal verification is intractable
- Probabilistic guarantees are acceptable
- System operates in non-adversarial or bounded-adversarial environment

### 5.3 Hybrid Approaches: Combining Formal and Empirical

#### 1. Certified Training with Empirical Fine-Tuning

**Pipeline**:
1. **Train with IBP/CROWN-IBP**: Network optimized for verified robustness
2. **Empirically fine-tune**: Improve natural accuracy on clean examples
3. **Re-verify**: Check certified robustness maintained

**Benefit**: Balance verified guarantees with practical performance

#### 2. Abstract Interpretation + Refinement

**ERAN RefinePoly** ([NeurIPS 2019](https://github.com/eth-sri/eran)):
1. **Initial pass**: DeepPoly/GPUPoly (fast, overapproximate)
2. **Refinement**: If inconclusive, use (MI)LP solver for precision
3. **PRIMA**: Group-wise joint neuron abstractions

**Trade-off**: Fast common case, precise when needed

#### 3. Formal Verification + Fuzzing

**White-box fuzzing guided by verification**:
- Formal methods identify uncovered regions
- Fuzzing generates test cases for those regions
- Iterative refinement

**Example**: DARPA PROVERS program approach

#### 4. Verified Components + Statistical System-Level

**Architecture**:
- **Core safety modules**: Formally verified (e.g., control stability)
- **Perception modules**: Statistically validated (e.g., PAC-certified robustness)
- **System integration**: Runtime monitoring

**Example**: Autonomous vehicle
- Verified collision avoidance logic
- Statistically validated object detection
- Runtime monitor ensures detection confidence thresholds

#### 5. Hybrid Neural-Symbolic Verification

**TacticToe / ProofNet++**:
- Neural networks guide symbolic proof search
- Symbolic checker verifies neural outputs in the loop
- **Reinforcement learning** with logical verification feedback

**Application**: Theorem proving, program synthesis with correctness guarantees

#### 6. Extracting Specifications via Verified AI

**GEVAI Framework** ([Springer 2024](https://link.springer.com/chapter/10.1007/978-3-031-97007-8_2)):
- Combines three types of explainability:
  - **A priori**: Understand model before deployment
  - **Ad hoc**: Explain specific decisions
  - **Ex post**: Analyze model after incidents
- **Hybrid explainability** improves verification efficiency by structuring specification space
- Enables data-driven pipeline with verification integration

---

## 6. Implications for AI Safety and Trust Frameworks

### 6.1 What Coordinators Can Provably Guarantee

**Strong guarantees (achievable now)**:

1. **Bounded interface properties**:
   - "AI never writes to file system outside directory D"
   - "AI never opens network connections except to server S"
   - "AI API calls stay within rate limit R"
   - **Method**: OS-level sandboxing, capability-based security, verified runtime

2. **Simple physical constraints**:
   - "Robot actuator forces ≤ F_max" (hardware limits)
   - "Drone never flies above altitude H" (geofencing with verified GPS)
   - **Method**: Verified control barriers, hardware interlocks

3. **Local robustness for small networks**:
   - "Classifier output unchanged under ε-perturbation" for specific inputs
   - **Method**: α,β-CROWN, Marabou
   - **Limitation**: Network size ≤ ~1M neurons; properties must be simple

4. **Verified fallback in Simplex architecture**:
   - "If advanced controller violates monitor, fallback engages within T seconds"
   - **Method**: Formally verified monitor + fallback, runtime assurance
   - **Limitation**: Fallback may be overly conservative

**Moderate guarantees (achievable with caveats)**:

5. **Compositional system properties** (if contracts hold):
   - "System of verified components satisfies top-level spec S"
   - **Method**: Pacti, assume-guarantee reasoning
   - **Caveat**: Assumes contracts accurately capture all interactions; emergent behavior may violate

6. **Probabilistic safety bounds**:
   - "P(collision) ≤ 10^-6 per mission" under world model W
   - **Method**: GS AI framework (Level 9 verification)
   - **Caveat**: Guarantee is relative to W; if W is inaccurate, guarantee may not hold in reality

7. **Statistical fairness**:
   - "System is ε-fair with confidence 1-δ over observed distribution"
   - **Method**: PAC fairness monitoring
   - **Caveat**: Distribution shift may invalidate; not adversarially robust

### 6.2 Where We Must Rely on Empirical Trust

**Fundamental limits require empirical approaches for**:

1. **Large language models**:
   - Billions of parameters → formal verification intractable
   - General semantic properties (alignment, helpfulness, harmlessness) → undecidable
   - **Current best practice**: Empirical evaluations, red teaming, RLHF, scaling-based trust
   - **Risk**: No guarantees; adversaries may find exploits

2. **Emergent multi-agent behavior**:
   - Interactions between multiple AI systems
   - Compositional verification assumes contracts; real systems may violate
   - **Approach**: Simulation-based testing, empirical monitoring
   - **Risk**: Rare failure modes may be missed

3. **Perception in complex environments**:
   - Image-based neural networks processing real-world camera feeds
   - State space too large for complete verification
   - **Approach**: Statistical validation (e.g., PAC-certified robustness), runtime monitoring
   - **Risk**: Tail distribution events (adversarial examples, distribution shift)

4. **Human-AI interaction properties**:
   - "Users find AI helpful and trustworthy"
   - "AI doesn't manipulate users"
   - Not formalizable in tractable way
   - **Approach**: User studies, behavioral monitoring, qualitative assessment

5. **World model accuracy**:
   - Even with GS AI, guarantees depend on world model W
   - W is built from physics simulations, sensor models, environment assumptions
   - **No formal verification of W itself** (except in simple domains)
   - **Approach**: Empirical validation, reality gap analysis, robust control

### 6.3 Combining Verified and Unverified Components: Practical Strategies

#### Strategy 1: Verified Safety Envelope

**Architecture**:
```
Unverified ML System
        ↓
Verified Safety Monitor → Verified Fallback (if violation)
```

**Example**: Autonomous vehicle
- Unverified: Perception (object detection, scene understanding)
- Verified: Safety monitor (checks if detection confidence ≥ threshold, actuation within limits)
- Verified: Fallback (emergency braking)

**Guarantee**: "System never takes unsafe action, even if perception fails"
**Caveat**: Fallback may be overly cautious (frequent false alarms)

#### Strategy 2: Layered Assurance

**Architecture**:
```
Layer 1: Formal verification (core safety properties)
Layer 2: Statistical verification (performance properties)
Layer 3: Empirical testing (edge cases, usability)
```

**Example**: Medical diagnosis AI
- Layer 1: Verified that system never recommends contraindicated drug combinations
- Layer 2: PAC-certified accuracy ≥ 95% on validation distribution
- Layer 3: Clinical trials for real-world effectiveness

**Guarantee**: Strong for critical safety; weaker for performance
**Design principle**: Allocate verification effort by risk severity

#### Strategy 3: Assume-Guarantee Composition with Runtime Checks

**Architecture**:
```
Component A (verified) ↔ Component B (unverified)
         ↓                       ↓
   Assumes B_contract    Monitored for B_contract compliance
```

**Example**: Robot navigation
- Component A (motion planner): Verified safe if obstacle detector satisfies contract "reports all obstacles within radius R"
- Component B (ML obstacle detector): Unverified, but runtime monitor checks consistency (e.g., LIDAR cross-check)

**Guarantee**: If monitor never triggers, A's safety proof holds
**Caveat**: Monitor must be complete (detect all contract violations)

#### Strategy 4: Probabilistic Risk Budgeting

**Framework**:
1. Decompose system into components C1, ..., Cn
2. Allocate failure probability budget: P(failure_total) ≤ ε
3. Assign per-component budgets: P(failure_Ci) ≤ ε_i, where Σε_i ≤ ε
4. Verify formally where possible (ε_i = 0), statistically where not (ε_i > 0)

**Example**: Spacecraft
- Guidance: ε_guidance = 0 (formally verified)
- Sensor fusion: ε_sensor = 10^-8 (statistically certified)
- Thruster control: ε_thruster = 0 (formally verified)
- Total: ε_total ≤ 10^-8

**Benefit**: Quantitative risk management; focuses verification effort where needed
**Challenge**: Requires accurate probabilistic models

#### Strategy 5: Continuous Verification + Empirical Monitoring

**Approach**:
- Deploy system with runtime monitoring
- Collect data on actual behavior
- Periodically re-verify with updated models/contracts
- Adjust system parameters or retrain components

**Example**: Industrial control AI
- Initial: Formally verify for limited operating region
- Deployment: Monitor for out-of-distribution inputs, constraint violations
- Update: Expand verified region based on observed data; re-verify

**Benefit**: Balances upfront verification cost with real-world learning
**Risk**: Period between deployment and re-verification is empirically assured

### 6.4 Decision Framework: When to Use Which Approach

| Property Type | System Scale | Best Approach | Assurance Level |
|--------------|--------------|---------------|-----------------|
| Safety-critical, bounded | Small network (<1K neurons) | Static verification (α,β-CROWN, Marabou) | High (formal proof) |
| Safety-critical, bounded | Medium network (1K-1M neurons) | Certified training (CROWN-IBP) + verification | High (formal proof) |
| Safety-critical, bounded | Large network (>1M neurons) | Approximate verification (ERAN) + runtime monitoring | Medium (sound bounds + monitoring) |
| Safety-critical, unbounded | Any scale | Impossible; narrow specification | N/A |
| Performance (robustness) | Small-medium network | Lipschitz constant verification | High (formal proof) |
| Performance (robustness) | Large network | Statistical verification (PAC bounds) | Medium (probabilistic) |
| Fairness | Any scale | Runtime PAC monitoring | Medium (probabilistic, evolving) |
| Multi-component system | Modular | Compositional (Pacti contracts) + runtime assurance | Medium-high (depends on contract fidelity) |
| Emergent behavior | Complex | Empirical (simulation, red teaming) | Low (no guarantees) |
| LLM alignment | Billions of parameters | Empirical (RLHF, evals, red teaming) | Low (no guarantees) |

**General principles**:

1. **Use formal verification when**:
   - Property is critical (safety, security)
   - System is small enough (or can be decomposed)
   - Property is formalizable and tractable

2. **Use statistical verification when**:
   - Formal verification is intractable
   - Probabilistic guarantees are acceptable
   - System operates in bounded-adversarial environment

3. **Use empirical methods when**:
   - No formal/statistical approach exists
   - Property is qualitative (user satisfaction, "helpfulness")
   - System is too large/complex and non-critical

4. **Use hybrid approaches when**:
   - System has critical and non-critical components
   - Defense-in-depth is valuable
   - Resources allow multi-layer assurance

---

## 7. Key Takeaways for AI Safety Frameworks

### 7.1 What Formal Verification Can Deliver

1. **High-assurance guarantees for narrow properties**: Local robustness, Lipschitz bounds, specific input-output behaviors for small-to-medium networks
2. **Compositional system safety**: If contracts are accurate and components verified, system properties can be guaranteed
3. **Runtime assurance architectures**: Verified monitors + fallbacks can provide safety nets for unverified components
4. **Quantitative risk budgets**: Statistical verification enables probabilistic guarantees (PAC bounds)
5. **Independently auditable proofs**: GS AI approach enables coordination without mutual trust

### 7.2 Fundamental Limitations to Accept

1. **Undecidability**: General alignment, harming, containment, ethics problems are undecidable (Rice's Theorem)
2. **Computational complexity**: Even decidable problems may be NP-complete or ∃ℝ-hard, intractable for large systems
3. **Emergent behavior**: Verified components ≠ verified system; interactions may create unforeseen failures
4. **World model dependency**: GS AI guarantees are relative to world model; if model is wrong, guarantees may not hold in reality
5. **Scale limits**: Verification tools struggle beyond ~1M neurons; LLMs with billions of parameters are currently out of reach for formal methods

### 7.3 Recommended Approach for Delegation Risk

**For AI safety frameworks focused on delegation risk framework and risk budgeting**:

1. **Stratify system components by criticality**:
   - **Critical path** (safety-critical): Formally verify or use verified fallbacks
   - **Performance path** (important but not safety): Statistical verification
   - **Auxiliary functions**: Empirical validation

2. **Explicit trust assumptions**:
   - Document what is formally verified vs. empirically validated
   - State assumptions (world model, contracts, distribution)
   - Quantify residual risk from unverified components

3. **Compositional design with contracts**:
   - Use Pacti or similar tools for modular systems
   - Define clear assume-guarantee interfaces
   - Runtime monitoring to detect contract violations

4. **Probabilistic risk budgeting**:
   - Allocate failure probability across components
   - Use formal verification to achieve P = 0 where feasible
   - Use statistical verification (PAC bounds) elsewhere
   - Sum to total acceptable risk

5. **Defense-in-depth**:
   - Layer 1: Formal verification of core safety properties
   - Layer 2: Statistical verification of performance properties
   - Layer 3: Runtime monitoring for anomaly detection
   - Layer 4: Verified fallback mechanisms

6. **Continuous assurance**:
   - Monitor deployed systems (runtime verification)
   - Update models/contracts based on observed data
   - Re-verify periodically as systems evolve

7. **Honest communication of limits**:
   - To stakeholders: "We guarantee X (formally), Y (probabilistically), but cannot guarantee Z"
   - Avoid overpromising verification coverage
   - Acknowledge empirical trust where formal guarantees are impossible

### 7.4 Open Research Directions

**Where the field is headed** (from VNN-COMP, SAIV, and recent publications):

1. **Scaling verification to larger networks**:
   - Training-for-verification (inducing neuron stability)
   - Better branching heuristics (learned strategies, bound implication graphs)
   - Efficient GPU implementations

2. **Beyond ReLU architectures**:
   - GenBaB for general nonlinearities (Transformers, attention mechanisms)
   - Verification for neural ODEs, recurrent networks

3. **Closed-loop verification**:
   - NNCS (neural network control systems) in feedback with environments
   - Current tools struggle; active research area

4. **Automated synthesis**:
   - Runtime monitors from specifications
   - Safe fallback controllers
   - Contracts from component behaviors

5. **Hybrid neural-symbolic verification**:
   - Neural networks guide symbolic reasoning
   - Symbolic checkers verify neural outputs
   - Reinforcement learning with verification in the loop

6. **Mechanistic interpretability for verification**:
   - Understanding internal representations to inform verification
   - Identifying "safety-relevant" neurons/circuits
   - Verifying interpretability claims themselves

7. **Standardization**:
   - VNN-LIB for specifications
   - ONNX for network exchange
   - Benchmark suites (VNN-COMP) for tool comparison

---

## 8. Conclusion

Formal verification of AI systems is a rapidly advancing field with significant achievements—verifying robustness, Lipschitz constants, and safety properties for small-to-medium neural networks—but faces **fundamental theoretical limits** (undecidability, computational complexity) and **practical scalability barriers** (exponential branching, state explosion).

**For AI safety coordinators**:
- **You CAN provably guarantee**: Narrow, well-defined properties for small-medium systems; interface constraints; runtime monitor correctness; fallback safety
- **You CANNOT provably guarantee**: General alignment for arbitrary AIs; emergent multi-agent behavior; properties of billion-parameter LLMs; accuracy of world models

**The path forward**: Hybrid approaches that combine formal verification (where tractable), statistical verification (where probabilistic guarantees suffice), and empirical validation (where no formal methods exist), organized through compositional design, explicit trust assumptions, and quantitative risk budgeting.

Verification is a powerful tool in the AI safety toolkit, but not a panacea. Effective safety frameworks must honestly acknowledge its limits and combine it with complementary assurance methods.

---

## References and Further Reading

### Key Papers

1. **Guaranteed Safe AI Framework**: Dalrymple, Skalse, Bengio, Russell, Tegmark, Seshia, et al. (2024). "Towards Guaranteed Safe AI: A Framework for Ensuring Robust and Reliable AI Systems." arXiv:2405.06624. [Link](https://arxiv.org/abs/2405.06624)

2. **Pacti (Compositional Verification)**: Incer, I., Badithela, A., Graebener, J., et al. (2025). "Pacti: Assume-Guarantee Contracts for Efficient Compositional Analysis and Design." ACM Transactions on Cyber-Physical Systems, 9(1), Article 3. [Link](https://dl.acm.org/doi/10.1145/3704736)

3. **α,β-CROWN Verifier**: Zhang, H., et al. (2024). "α,β-CROWN: Winner of VNN-COMP 2021-2025." [GitHub](https://github.com/Verified-Intelligence/alpha-beta-CROWN)

4. **Marabou 2.0**: Wu, M., et al. (2024). "Marabou 2.0: A Versatile Formal Analyzer of Neural Networks." CAV 2024, LNCS 14682, pp. 249–264. [Link](https://link.springer.com/chapter/10.1007/978-3-031-65630-9_13)

5. **NP-Completeness of Reachability**: Sälzer, M., & Lange, M. (2021). "Reachability is NP-Complete Even for the Simplest Neural Networks." RP 2021. [Link](https://link.springer.com/chapter/10.1007/978-3-030-89716-1_10)

6. **Rice's Theorem and AI Alignment**: Alfonseca, M., et al. (2025). "Machines that halt resolve the undecidability of artificial intelligence alignment." Nature Scientific Reports. [Link](https://www.nature.com/articles/s41598-025-99060-2)

7. **CROWN-IBP Certified Training**: Zhang, H., et al. (2020). "Towards Stable and Efficient Training of Verifiably Robust Neural Networks." ICLR 2020. [Link](https://github.com/huanzhang12/CROWN-IBP)

8. **DeepPoly Abstract Domain**: Singh, G., et al. (2019). "An abstract domain for certifying neural networks." POPL 2019. [Link](https://dl.acm.org/doi/10.1145/3290354)

9. **VNN-COMP 2024 Report**: Brix, C., Bak, S., et al. (2024). "The Fifth International Verification of Neural Networks Competition (VNN-COMP 2024): Summary and Results." arXiv:2412.19985. [Link](https://arxiv.org/abs/2412.19985)

10. **ACAS Xu Verification**: Sun, X., et al. (2019). "Formal verification of neural network controlled autonomous systems." HSCC 2019. [Link](https://dl.acm.org/doi/10.1145/3302504.3311802)

### Tools and Frameworks

- **α,β-CROWN**: [github.com/Verified-Intelligence/alpha-beta-CROWN](https://github.com/Verified-Intelligence/alpha-beta-CROWN)
- **Marabou**: [github.com/NeuralNetworkVerification/Marabou](https://neuralnetworkverification.github.io/)
- **ERAN**: [github.com/eth-sri/eran](https://github.com/eth-sri/eran)
- **Pacti**: [pypi.org/project/Pacti](https://pypi.org/project/Pacti/)
- **NNV 2.0**: [Link](https://link.springer.com/chapter/10.1007/978-3-031-37703-7_19)
- **VNN-COMP**: [sites.google.com/view/vnn2025](https://sites.google.com/view/vnn2025)

### Community Resources

- **VNN-COMP (Annual Competition)**: International Verification of Neural Networks Competition
- **SAIV (Symposium on AI Verification)**: Co-located with CAV
- **Berkeley Verified AI**: [berkeleylearnverify.github.io/VerifiedAIWebsite](https://berkeleylearnverify.github.io/VerifiedAIWebsite/)
- **ETH SRI Lab (Safe AI Project)**: [eth-sri.github.io](https://github.com/eth-sri)

---

*Document prepared for trust-website AI safety framework (December 2025)*
*Focus: Realistic assessment of formal verification capabilities and limits for risk budgeting and delegation risk framework*
