---
title: "Runtime Monitoring Architectures"
description: "Runtime verification and monitoring for AI safety guarantees"
---

# Runtime Monitoring Architectures for AI Safety

Runtime monitoring represents a critical layer in AI safety assurance, providing continuous verification of system behavior during deployment. Unlike static verification methods that analyze systems before deployment, runtime monitoring observes actual execution, detecting violations, anomalies, and unsafe conditions as they emerge. This document explores the foundations, architectures, and practical implementation of runtime monitoring for AI safety.

## 1. Why Runtime Monitoring

### The Limits of Static Verification

Static verification methods—including formal verification, testing, and certification—provide crucial pre-deployment assurance but face fundamental limitations when applied to modern AI systems:

**Incomplete Coverage**: No testing regime can exhaustively cover the state space of deep neural networks operating in complex environments. A vision system trained on millions of images will inevitably encounter novel inputs during deployment that differ from training data in subtle but safety-critical ways.

**Dynamic Behavior**: AI systems exhibit emergent behaviors that cannot be fully predicted from static analysis. Language models may generate outputs that satisfy formal specifications yet violate implicit safety constraints. Reinforcement learning agents discover strategies that exploit environment dynamics in unanticipated ways.

**Distribution Shift**: The fundamental assumption underlying most ML deployment—that test data resembles training data—breaks down over time. Adversarial inputs, environmental changes, and evolving user behavior create distribution shifts that static verification cannot anticipate.

**Verification-Performance Tradeoffs**: Formally verified neural networks typically sacrifice significant performance. A controller verified for all possible states may be so conservative that it provides minimal utility. Runtime monitoring enables the deployment of high-performance, unverified components alongside safety guarantees.

### Continuous Assurance Through Monitoring

Runtime monitoring addresses these limitations by providing assurance during actual operation:

**Online Detection**: Monitors operate continuously during inference, analyzing inputs, internal representations, and outputs to detect safety violations as they occur. This enables immediate intervention before violations propagate to consequences.

**Adaptive Response**: Unlike static barriers, runtime monitors can escalate responses based on severity—logging anomalies, flagging outputs for review, engaging fallback controllers, or halting operation entirely.

**Empirical Validation**: Monitoring provides ground truth about actual system behavior in deployment, validating (or invalidating) assumptions made during development and revealing failure modes that testing missed.

**Regulatory Compliance**: Safety-critical domains increasingly require continuous monitoring. Aviation authorities mandate runtime health monitoring for flight control systems. Medical device regulations require adverse event detection during clinical use. Similar requirements are emerging for autonomous vehicles and AI-powered medical diagnosis.

### The Runtime Monitoring Value Proposition

Runtime monitoring is not a replacement for static verification but a complementary layer that enables:

1. **Deployment of unverified high-performance components** under the supervision of verified safety monitors
2. **Detection of novel failure modes** that static analysis could not anticipate
3. **Continuous safety assurance** as systems and environments evolve
4. **Empirical risk quantification** through operational data collection
5. **Graceful degradation** rather than catastrophic failure when violations occur

The key insight is that monitoring shifts the verification question from "Is this system always safe?" (often unanswerable for AI) to "Can we detect when this system becomes unsafe and respond appropriately?" (achievable with formal guarantees).

## 2. Runtime Verification Foundations

Runtime verification (RV) provides the theoretical and practical foundations for monitor construction. RV synthesizes monitors from formal specifications, ensuring that the monitor correctly detects all and only the specified violations.

### Temporal Logic Specifications

Temporal logics extend propositional logic with operators that reason about time, enabling specifications about sequences of events and timing constraints.

**Linear Temporal Logic (LTL)**

LTL reasons about properties along a single execution trace. Key operators include:

- **G φ** (Globally): φ must hold at all time points
- **F φ** (Finally): φ must eventually hold at some future point
- **X φ** (Next): φ must hold at the next time point
- **φ U ψ** (Until): φ must hold until ψ becomes true

Example LTL specifications for AI safety:

```
G(request_approved → F(response_generated))
"Every approved request eventually receives a response"

G(unsafe_detected → X(system_halted))
"Unsafe conditions immediately trigger system halt"

¬F(privacy_violation)
"Privacy violations never occur"

G(human_override_requested → (¬autonomous_action U human_decision))
"After human override request, no autonomous actions until human decides"
```

LTL's clean semantics enable algorithmic monitor synthesis: an LTL formula can be translated to a finite automaton that accepts exactly those traces satisfying the formula. For runtime monitoring, the automaton processes the observed execution prefix and reports violations when reaching rejecting states.

**Metric Temporal Logic (MTL)**

MTL extends LTL with explicit timing constraints, essential for cyber-physical systems where temporal bounds matter:

- **G[a,b] φ**: φ must hold at all points in time interval [a,b]
- **F[a,b] φ**: φ must hold at some point within [a,b]
- **φ U[a,b] ψ**: φ holds until ψ, which occurs within [a,b]

Example MTL specifications:

```
G(emergency_detected → F[0,100ms](controller_switched))
"Emergency detection triggers controller switch within 100ms"

G[0,3600s](¬critical_failure)
"No critical failures occur within first hour of operation"

G(user_query → F[0,5s](response ∨ timeout_notification))
"User queries receive response or timeout notification within 5 seconds"
```

MTL monitoring requires tracking timing information alongside state, making implementation more complex but providing crucial real-time guarantees. Recent work has developed efficient online MTL monitors that maintain bounded memory even for unbounded traces.

### Monitor Synthesis

Monitor synthesis transforms temporal specifications into executable monitors. The synthesis process must ensure:

1. **Soundness**: The monitor only reports actual violations
2. **Completeness**: The monitor reports all violations it can detect from observed prefixes
3. **Efficiency**: Monitor overhead is bounded and acceptable for the application

**Automata-Based Synthesis**

The classical approach translates temporal formulas to finite automata:

1. Convert the negation of the safety property to a Büchi automaton (accepting infinite traces that violate the property)
2. Determinize the automaton (converting to an automaton with deterministic transitions)
3. Minimize the automaton (reducing states while preserving language)
4. Execute the automaton synchronously with the system, reporting violations when accepting states are reached

This approach provides strong guarantees but faces challenges:

- **State explosion**: The automaton size can be exponential in formula size
- **Determinization complexity**: Not all Büchi automata can be determinized
- **Three-valued semantics**: Finite prefixes may be inconclusive—neither definitely satisfying nor definitely violating the property

**Rewriting-Based Synthesis**

An alternative approach rewrites the temporal formula as the trace extends:

```
monitor(G φ, trace) = φ ∧ monitor(G φ, tail(trace))
monitor(F φ, trace) = φ ∨ monitor(F φ, tail(trace))
monitor(X φ, trace) = monitor(φ, tail(trace))
```

This approach generates monitors compositionally, avoiding explicit automaton construction. The monitor maintains a formula representing the remaining obligation, simplifying it as events occur.

**Trace-Based Monitoring for Concurrent Systems**

Monitoring concurrent systems introduces additional complexity: multiple interleavings of the same events are observationally equivalent. Linear Temporal Logic over Mazurkiewicz Traces (LTrL) addresses this by reasoning about partial orders rather than sequences.

When monitoring a concurrent system, a single observed execution represents an equivalence class of interleavings. LTrL monitors provide three-valued verdicts: correct (all equivalent executions satisfy the property), incorrect (all violate), or inconclusive (some satisfy, some violate).

### Online vs Offline Monitoring

**Offline Monitoring** analyzes complete execution traces after the fact, useful for:

- Post-incident analysis and root cause determination
- Compliance auditing and regulatory reporting
- Testing and validation during development
- Mining operational data for patterns and anomalies

Offline monitoring faces no real-time constraints and can employ computationally expensive analyses. However, it cannot prevent safety violations—only detect them after they occur.

**Online Monitoring** analyzes traces during execution, enabling:

- Immediate violation detection and intervention
- Preventing consequences of detected violations
- Real-time system adaptation based on monitoring results
- Continuous safety assurance during operation

Online monitoring must satisfy strict performance requirements:

- **Bounded latency**: Monitor verdicts must be available within specified time bounds
- **Bounded memory**: Monitors cannot grow memory usage unbounded as traces extend
- **Minimal overhead**: Monitoring must not degrade system performance unacceptably

For safety-critical AI systems, online monitoring is essential—detecting a violation after a crash or injury provides little value. The challenge is achieving formal guarantees while meeting real-time constraints.

## 3. AI-Specific Monitoring Approaches

While traditional runtime verification focuses on discrete events and temporal properties, AI systems require monitoring techniques tailored to their unique characteristics: high-dimensional continuous outputs, learned behaviors, and distribution-dependent performance.

### Output Distribution Monitoring

AI models produce outputs from learned distributions rather than executing predetermined logic. Monitoring output distributions detects when model behavior diverges from expected patterns.

**Statistical Distribution Tracking**

Monitors maintain statistics about output distributions during training and deployment:

- **Mean and variance**: Track whether output statistics remain within expected ranges
- **Higher moments**: Skewness and kurtosis detect distributional shape changes
- **Entropy**: Measure output uncertainty; sudden entropy changes indicate distributional shifts
- **Mode collapse**: Detect when generative models produce overly homogeneous outputs

A vision classifier might monitor the distribution of confidence scores across classes. During training, well-calibrated models show high confidence on correct predictions and low confidence on errors. At deployment, sudden changes—like uniform confidence across classes or extreme overconfidence—indicate potential failures.

**Anomaly Detection in Output Space**

Rather than hand-specifying acceptable distributions, anomaly detection learns "normal" output patterns from operational data:

- **Density estimation**: Model the joint distribution of outputs using Gaussian mixture models, kernel density estimation, or normalizing flows
- **Distance metrics**: Flag outputs far from training distribution in embedding space
- **Autoencoder reconstruction**: Train autoencoders on nominal outputs; poor reconstruction indicates anomalies
- **One-class classification**: Train classifiers to distinguish normal outputs from arbitrary deviations

For language models, output monitoring might track perplexity (model's surprise at its own outputs), toxic content detection, factual consistency, or deviation from expected response patterns. A chatbot consistently producing very long responses when typical responses are brief signals potential prompt injection or mode collapse.

### Behavioral Anomaly Detection

Beyond individual outputs, monitoring can detect anomalous behavioral patterns emerging over sequences of interactions.

**Sequence Modeling**

Models of normal behavioral sequences enable detection of unusual patterns:

- **Hidden Markov Models**: Learn typical state transition sequences; flag unlikely transitions
- **Recurrent networks**: Train on normal operation sequences; detect when prediction error exceeds thresholds
- **Temporal convolutional networks**: Capture long-range temporal dependencies in behavior

For autonomous vehicles, sequence monitoring might track the pattern of control decisions. A vehicle repeatedly oscillating between acceleration and braking, or making unusual sequences of lane changes, exhibits behavioral anomalies even if individual actions are within bounds.

**Policy Deviation Detection**

In reinforcement learning, monitors can detect when deployed policies deviate from learned behavior:

- **Action distribution comparison**: Compare deployment action distributions to training distributions in similar states
- **Trajectory similarity**: Measure whether execution trajectories resemble training trajectories
- **Reward estimation**: Estimate expected returns; significant deviations indicate behavioral changes

### Out-of-Distribution (OOD) Detection

OOD detection is crucial for AI safety—models cannot be trusted on inputs dissimilar to training data. OOD monitors determine whether inputs fall within the model's competence region.

**Input-Based OOD Detection**

Monitor inputs directly to detect distributional shifts:

- **Density-based**: Estimate training data density; flag low-density inputs as OOD
- **Distance-based**: Compute distance to nearest training examples; threshold for OOD
- **Classification-based**: Train binary classifier to distinguish training data from various OOD datasets
- **Generative-based**: Use generative models (VAE, GAN) to assess input likelihood

Modern approaches include Mahalanobis distance in feature space, using the deep network's learned representations. This is more effective than raw input space, as the network has learned task-relevant features.

**Internal Representation Monitoring**

Recent work monitors neural network internal activations during inference:

- **Neuron activation ranges**: Track typical activation ranges for hidden layer neurons during training; flag inputs producing out-of-range activations
- **Layer-wise density**: Model activation distributions at each layer; detect when inference-time activations are atypical
- **Attention pattern analysis**: For attention-based models, unusual attention patterns indicate OOD inputs

A survey on runtime safety monitoring for DNNs categorizes approaches into monitoring inputs, internal representations, and outputs. Internal monitoring can detect adversarial inputs that appear normal in input space but create anomalous activations in hidden layers.

**Uncertainty Quantification**

Bayesian deep learning and ensemble methods provide uncertainty estimates that can drive monitoring:

- **Predictive entropy**: High entropy indicates model uncertainty about the correct output
- **Epistemic uncertainty**: Measures uncertainty due to limited training data; high for OOD inputs
- **Aleatoric uncertainty**: Measures inherent noise; less useful for OOD detection
- **Ensemble disagreement**: Multiple models disagreeing on an input suggests OOD or ambiguity

Combining multiple uncertainty signals provides robust OOD detection. A medical diagnosis system might require low epistemic uncertainty (the model has seen similar cases) and acceptable aleatoric uncertainty (the case itself is reasonably clear) before providing autonomous diagnoses.

### Capability Monitoring

As AI systems become more capable and autonomous, monitoring for unexpected capabilities becomes critical. Capability monitoring detects when systems exhibit behaviors beyond their intended scope.

**Behavioral Repertoire Analysis**

Monitor the space of behaviors the system produces:

- **Capability mapping**: Maintain an explicit map of intended capabilities; flag novel capabilities
- **Skill discovery**: Use unsupervised methods to identify distinct behaviors; track when new behaviors emerge
- **Complexity metrics**: Monitor task complexity the system attempts; flag when attempting unexpectedly complex tasks

For AI assistants, capability monitoring might detect when the system attempts tasks it wasn't trained for—like executing system commands, accessing unauthorized data, or engaging in activities requiring expert knowledge beyond its training.

**Goal Inference Monitoring**

In goal-directed agents, monitors can infer pursued goals from observed behavior and detect goal drift:

- **Inverse reinforcement learning**: Infer the reward function that would produce observed behavior; compare to intended rewards
- **Planning recognition**: Recognize plans from action sequences; flag plans inconsistent with intended objectives
- **Instrumental convergence detection**: Monitor for power-seeking, resource acquisition, or self-preservation behaviors that emerge across many goals

**Emergent Capability Detection**

Large models exhibit emergent capabilities not present in smaller versions. Monitoring for emergence is challenging but critical:

- **In-context learning detection**: Monitor whether the model demonstrates new abilities within a single context window
- **Transfer learning detection**: Track performance on novel tasks without fine-tuning
- **Compositional generalization**: Detect when the system combines learned components in novel ways

## 4. Simplex Architecture

The Simplex Architecture represents a foundational pattern for runtime assurance of autonomous systems, combining high-performance unverified controllers with formally verified safety controllers.

### Architecture Components

The Simplex architecture comprises four key components:

**1. Advanced Controller (AC)**

The advanced controller optimizes performance without safety verification guarantees. This might be:

- A deep reinforcement learning policy trained for maximum task performance
- A large language model providing intelligent but unverified responses
- A neural network controller optimized for efficiency and user experience

The AC operates during normal conditions, providing the best available performance. It may use techniques difficult to formally verify—deep networks, learned policies, adaptive algorithms—accepting that formal safety guarantees cannot be proven.

**2. Baseline Controller (BC)**

The baseline controller provides verified safety guarantees but typically lower performance. Examples include:

- A classical control law proven stable via Lyapunov analysis
- A rule-based system with exhaustively tested behavior
- A simplified neural network that sacrifices performance for verifiability

The BC must guarantee that whenever it takes control, the system can be safely recovered. Critically, this is not just a stopped state—the BC must actively maintain safety while the system continues operating.

**3. Decision Module (DM)**

The decision module monitors system state and determines which controller should command the system. The DM implements switching logic based on:

- **State reachability**: Can the BC recover from the current state if engaged now?
- **Safety predictions**: Will continuing with AC lead to unrecoverable states?
- **Performance metrics**: Is AC behavior sufficiently nominal to continue trusting it?

The DM must be formally verified to ensure correct switching decisions. An incorrect switch—failing to engage BC when needed, or unnecessarily engaging BC—can cause safety violations or performance degradation.

**4. Plant**

The physical system or environment being controlled. The plant model must be sufficiently accurate for verification to provide meaningful guarantees. Model uncertainty is addressed through robust control techniques in the BC and conservative decision criteria in the DM.

### Verified Fallback Mechanism

The core safety property Simplex provides is:

**Safety Guarantee**: If the BC is verified safe and the DM switching logic is verified correct, the complete system (AC + BC + DM) maintains safety despite an unverified AC.

This guarantee depends on several conditions:

**Recoverability**: At all times, the system must remain in states from which the BC can restore safety. The AC can explore states the BC would never enter, but cannot enter states from which the BC cannot recover.

Formally, define:
- S_safe: the set of safe states
- R_BC: the set of states from which the BC can reach S_safe
- The DM must ensure the system stays within R_BC

**Switching Correctness**: The DM must detect when the system approaches the boundary of R_BC and switch to BC before leaving R_BC. This requires:

- Accurate state estimation
- Reachability analysis to determine R_BC
- Conservative switching to account for delays and uncertainties

**BC Verification**: The BC must be formally proven to maintain safety. Techniques include:

- Lyapunov stability proofs for continuous systems
- Exhaustive testing for discrete systems
- Formal methods like model checking for hybrid systems
- Barrier certificates proving state constraints are maintained

### Trust Implications

The Simplex architecture has profound implications for trust in AI systems:

**Decomposed Trust Requirements**

Trust requirements are decomposed by component:

- **AC**: No trust required—can be arbitrarily complex, unverified, or even adversarial
- **BC**: Must be highly trusted—requires formal verification and validation
- **DM**: Must be trusted—switching logic is safety-critical
- **Plant model**: Must be trusted—verification validity depends on model accuracy

This decomposition enables deploying powerful but unverified AI (AC) in safety-critical contexts by relying on simpler, verifiable components (BC, DM) for safety.

**Performance-Safety Tradeoffs**

Simplex makes explicit the performance-safety tradeoff:

- **Higher AC performance → more aggressive behavior → closer to R_BC boundary → more frequent BC engagement**
- **More conservative switching → greater safety margin → reduced AC operational time → lower performance**

The design question becomes: how much BC engagement is acceptable? In aviation, engaging backup controllers might be acceptable 0.1% of flight time. In autonomous vehicles, more frequent engagement might be tolerable during initial deployment.

**Verification Scope Limitation**

Simplex limits the scope of difficult verification:

- The BC can be simple enough for exhaustive verification
- The DM logic can be small enough for formal methods
- The plant model verification can focus on BC-relevant dynamics

This contrasts with attempting to verify the complete AC behavior—often infeasible for neural networks operating in complex environments.

**Empirical Performance, Formal Safety**

Simplex embodies a key principle: achieve performance empirically (training AC on real data) while guaranteeing safety formally (verifying BC and DM). This is particularly powerful for AI systems where:

- Formal verification of learned policies is extremely difficult
- Empirical performance of learned policies can be excellent
- Simple fallback policies can provide adequate safety

### Implementation Considerations

**State Estimation**

Both controllers and the DM require accurate state estimates. State estimation errors can cause:

- DM switching at wrong times
- BC failing to recover from perceived states
- AC operating on incorrect information

Robust state estimation, possibly with formal uncertainty bounds, is crucial. Techniques include:

- Kalman filtering with validated uncertainty models
- Interval observers providing guaranteed state bounds
- Multiple independent estimation methods with cross-checking

**Switching Overhead**

Controller switching incurs costs:

- **Computational**: Determining switching conditions, activating new controller
- **Performance**: BC typically provides lower performance than AC
- **Transient**: Switching may cause momentary instability

Minimizing switching frequency while maintaining safety requires careful tuning of DM thresholds and hysteresis.

**Reachability Computation**

Computing R_BC—the set of recoverable states—is often the most challenging verification problem. Approaches include:

- **Backward reachability**: Start from safe states, compute backwards what states BC can reach them from
- **Barrier certificates**: Find functions proving BC never leaves safe regions from R_BC
- **Numerical methods**: Grid-based or sampling-based reachability for continuous systems
- **Symbolic methods**: SMT solvers or model checkers for discrete/hybrid systems

Recent work has developed efficient real-time reachability computation for verified Simplex design.

## 5. Monitor-and-Intervene Patterns

Runtime monitors become valuable when they can intervene to prevent or mitigate detected violations. The spectrum of interventions ranges from passive logging to complete system shutdown.

### Monitor Action Hierarchy

**Level 0: Logging**

The minimal intervention simply records detected violations:

- **Audit trails**: Permanent records for compliance, forensics, and analysis
- **Metrics**: Aggregate statistics about violation frequency and types
- **Alerts**: Notifications to operators or developers

Logging provides no immediate safety benefit but enables offline analysis, incident investigation, and system improvement. It's appropriate when:

- Violations are expected occasionally but not immediately dangerous
- Human review can determine appropriate responses
- Building evidence for gradual system improvements

**Level 1: Flagging**

Monitors flag outputs for review before use:

- **Quarantine**: Hold flagged outputs pending human approval
- **Reduced confidence**: Mark outputs as requiring additional verification
- **User warnings**: Inform users that outputs may be unreliable

This pattern is common in content moderation (flagging potentially harmful content for human review), medical diagnosis (flagging uncertain cases for physician review), and autonomous vehicles (flagging difficult scenarios for teleoperator attention).

The key constraint: flagging requires that delayed action is acceptable. This works for offline predictions but not for real-time control.

**Level 2: Filtering and Modification**

Monitors modify violations to satisfy safety constraints:

- **Output sanitization**: Remove or redact unsafe portions of outputs
- **Constraint projection**: Modify outputs to satisfy safety constraints while minimizing change
- **Safe approximation**: Replace unsafe outputs with nearest safe alternatives

For language models, this might involve:

- Filtering toxic content from generated text
- Redacting personal information from responses
- Modifying code suggestions to avoid security vulnerabilities

The challenge is maintaining utility while enforcing safety—aggressive filtering may make outputs useless.

**Level 3: Fallback Engagement**

Monitors switch to alternative safe mechanisms:

- **Simplex switching**: Engage verified baseline controller
- **Retrieval fallback**: Replace generation with retrieval from curated safe responses
- **Conservative mode**: Switch to less capable but safer operational mode

This is the pattern implemented by Simplex architectures. Fallback engagement is appropriate when:

- Verified safe alternatives exist
- Performance degradation is acceptable
- Recovery to normal operation is possible

**Level 4: Human Escalation**

Monitors request human intervention:

- **Teleoperator control**: Human remotely operates the system
- **Expert consultation**: Specialist reviews situation and decides
- **Interactive verification**: Human answers questions to resolve ambiguity

Human-in-the-loop monitoring is critical for edge cases but introduces challenges:

- **Latency**: Humans may not respond fast enough for real-time systems
- **Attention**: Monitoring fatigue reduces human effectiveness
- **Authority**: Humans may lack formal authority to override automated systems
- **Responsibility**: Unclear liability when humans supervise but don't fully understand AI decisions

Research on formalizing human-in-the-loop systems identifies failure modes: automation bias (humans defer to AI even when wrong), alert fatigue (too many false positives), and insufficient context (humans can't make informed decisions with provided information).

**Level 5: Immediate Halt**

Monitors immediately stop system operation:

- **Emergency stop**: Halt all system actions
- **Safe state**: Enter minimal safe configuration
- **Shutdown**: Complete system termination

Halting is appropriate for critical safety violations where continuing operation risks catastrophic consequences. However, halting itself can be dangerous:

- Aircraft cannot simply stop mid-flight
- Medical devices shutting down during procedures may harm patients
- Industrial processes may become hazardous if suddenly interrupted

The BC in Simplex provides an alternative to halting—active safety maintenance rather than passive stopping.

### Graceful Degradation

Graceful degradation ensures systems reduce functionality progressively rather than failing catastrophically. Monitor-driven degradation strategies include:

**Capability Restriction**

Progressively limit system capabilities as violations accumulate:

```
Normal operation: Full autonomous capability
Minor violations: Require human approval for risky actions
Moderate violations: Reduce to scripted responses only
Major violations: Engage manual control
Critical violations: Halt until reset
```

This staged approach prevents single violations from causing complete system failure while ensuring safety.

**Performance Derating**

Reduce performance to increase safety margins:

- **Speed limits**: Slow down operation to allow more reaction time
- **Workspace limits**: Restrict to well-understood, safe operational regions
- **Conservative policies**: Switch from optimal to robust controllers

Autonomous vehicles might reduce speed limits as uncertainty increases, eventually pulling over if uncertainty becomes excessive.

**Resource Prioritization**

Allocate limited resources to safety-critical functions:

- **Processing priority**: Allocate compute to monitors and safety checks over performance optimization
- **Bandwidth allocation**: Prioritize safety-critical communications
- **Attention focusing**: Direct sensing and reasoning to safety-relevant aspects

**Temporal Degradation**

Reduce responsiveness while maintaining safety:

- **Increased latency**: Take more time for decisions to enable additional verification
- **Reduced frequency**: Decrease action frequency to allow thorough monitoring
- **Batch processing**: Group operations for efficient safety checking

### Intervention Timing

When should monitors intervene? The tradeoff:

- **Early intervention**: Higher false positive rate, more performance impact, but prevents violations
- **Late intervention**: Lower false positive rate, but may miss preventing violations

**Threshold-Based Intervention**

Set thresholds on safety metrics that trigger intervention:

```
If safety_margin < threshold_critical:
    Halt operation
Elif safety_margin < threshold_warning:
    Engage fallback controller
Elif safety_margin < threshold_caution:
    Increase monitoring frequency
```

Thresholds should account for:

- Intervention latency (how long intervention takes to become effective)
- Prediction uncertainty (safety margin estimates may be incorrect)
- Consequence severity (more severe consequences warrant earlier intervention)

**Predictive Intervention**

Intervene based on predicted future violations rather than current state:

- **Trajectory prediction**: Forecast future states; intervene if predictions violate safety
- **Reachability analysis**: Compute reachable states; intervene before leaving safe reachable set
- **Risk forecasting**: Estimate violation probability over time horizons; intervene when risk exceeds threshold

This is the approach in Simplex: the DM intervenes not when currently unsafe, but when predicted to become unrecoverable.

**Adaptive Intervention**

Adjust intervention strategies based on operational context:

- **Risk budgets**: More aggressive intervention when remaining risk budget is low
- **Operational phase**: Different strategies for initialization, normal operation, and shutdown
- **Environmental conditions**: More conservative in high-uncertainty environments

## 6. Formal Guarantees from Runtime Monitoring

What can runtime monitoring formally guarantee? The guarantees depend on monitor correctness, observation completeness, and intervention effectiveness.

### What Monitoring Can Guarantee

**Violation Detection (Sound Monitoring)**

A sound monitor guarantees: If the monitor reports a violation, a violation actually occurred.

Soundness requires:

- Correct specification (the monitored property accurately captures the safety requirement)
- Correct monitor synthesis (the monitor faithfully implements the specification)
- Accurate observations (sensor data reliably reflects system state)

Most formal runtime verification techniques provide soundness guarantees through:

- Verified monitor synthesis from temporal logic specifications
- Proven monitor implementations in languages like Coq or Isabelle
- Validated instrumentation providing reliable observations

**Complete Detection (Complete Monitoring)**

A complete monitor guarantees: If a violation occurs that is detectable from the observation, the monitor reports it.

Completeness is limited by observability:

- **Partial observability**: If safety depends on unobservable state, violations may be undetectable
- **Prefix limitations**: For infinite-horizon properties, finite prefixes may be inconclusive
- **Timing constraints**: Detection may occur after violation with unavoidable delay

Complete monitoring requires sufficient instrumentation to observe all safety-relevant aspects of execution.

**Intervention Timeliness (Real-Time Guarantees)**

For online monitoring with intervention, the critical guarantee is: Violations are detected and intervention completes before consequences occur.

This requires bounding:

- **Monitoring latency**: Time from violation occurrence to monitor detection
- **Intervention delay**: Time from monitor decision to intervention taking effect
- **Consequence horizon**: Minimum time from violation to harmful consequences

Formal real-time monitoring techniques ensure monitoring latency bounds through:

- Certified execution time bounds for monitor code
- Deterministic scheduling with verified WCET (worst-case execution time)
- Hardware-accelerated monitoring for performance-critical paths

### PAC Bounds and Probabilistic Guarantees

For stochastic systems and learned components, deterministic guarantees are often impossible. Probabilistic Approximately Correct (PAC) bounds provide formal probabilistic guarantees.

**PAC Learning Framework**

PAC guarantees take the form:

With probability at least 1-δ (confidence), the learned model has error at most ε (accuracy).

Applied to runtime monitoring:

**PAC Safety Monitoring**: With probability at least 1-δ, the monitor correctly identifies unsafe states with error at most ε.

This is weaker than deterministic guarantees but achievable for learned monitors.

**Data-Driven Safety Verification**

Recent work develops PAC guarantees for data-driven safety verification:

1. Collect N samples of system behavior under the baseline controller
2. Use PAC learning to bound: P(system unsafe | baseline controller) ≤ ε with confidence 1-δ
3. The bound depends on N: larger sample sizes give tighter ε or higher confidence δ

For discrete-time Markov chains (DTMCs), global PAC learning guarantees justify using finite sampled traces for probabilistic analysis. When the DTMC is trained with Laplace smoothing and known support, the learned model approximates the true system with bounded error across all CTL properties.

**Runtime Assurance with PAC Guarantees**

Proactive runtime enforcement can combine probabilistic model checking with PAC guarantees:

1. Learn a DTMC of system behavior from execution data
2. At runtime, use probabilistic model checking to determine: P(reach unsafe state | current state) > threshold?
3. If yes, trigger intervention (halt, human verification, fallback controller)

PAC guarantees ensure that the learned DTMC approximates the true system with bounded error, so the probabilistic safety estimates are reliable with quantified confidence.

**Sample Complexity**

PAC bounds specify how much data is required for guarantees. For ε accuracy and δ confidence, sample complexity is typically:

N = O((1/ε²) log(1/δ))

This means:

- Tighter accuracy (smaller ε) requires quadratically more samples
- Higher confidence (smaller δ) requires logarithmically more samples

For runtime monitoring, this implies:

- High-consequence systems require more operational data to establish safety
- Adaptive monitoring can adjust conservativeness based on available data
- Early deployment may need more conservative thresholds until sufficient data accumulates

### Safety Guarantees Under Distribution Shift

A critical challenge: guarantees established under one data distribution may not hold when distribution shifts.

**Detecting Distribution Shift**

Monitors can detect shift using statistical tests:

- **Two-sample tests**: Compare deployment distribution to training distribution (Kolmogorov-Smirnov, Maximum Mean Discrepancy)
- **Drift detection**: Sequential tests that trigger when distribution changes (CUSUM, Page-Hinkley)
- **Concept drift**: Detect when input-output relationships change

Upon detecting significant shift:

- Invalidate previous guarantees (PAC bounds no longer apply)
- Increase monitoring conservativeness
- Trigger retraining or recalibration
- Engage fallback mechanisms until new guarantees established

**Robust Monitoring**

Design monitors robust to bounded distribution shifts:

- **Worst-case analysis**: Guarantee holds over a set of distributions
- **Robust optimization**: Monitors optimized for worst-case in uncertainty set
- **Adaptive thresholds**: Automatically adjust detection thresholds based on observed distribution

For MDPs with uncertain transition kernels, robust safety functions can characterize reach-avoid probabilistic safety under all transition kernels consistent with an interval MDP. High-confidence safety guarantees can be derived for the true, unknown time-varying system.

### Compositional Guarantees

Complex systems require composing multiple monitors. How do individual monitor guarantees compose?

**Conjunction**: If monitor M1 guarantees property φ1 and monitor M2 guarantees φ2, the combined system guarantees φ1 ∧ φ2 (both properties hold).

**Coverage**: If monitors M1...Mn cover all components and guarantee individual component safety, does the system guarantee overall safety? Only if:

- Component interactions are modeled correctly
- Emergent properties from composition are verified separately
- Interface assumptions are validated

**Hierarchical Monitoring**: Monitors can be organized hierarchically:

- Low-level monitors: Check individual component properties
- Mid-level monitors: Check subsystem properties
- High-level monitors: Check system-level invariants

Each level can have different specifications and guarantees. Lower-level monitors provide stronger guarantees about local properties; higher-level monitors provide weaker guarantees about global properties.

### Connection to Risk Budgets

Runtime monitoring enables dynamic risk budget management:

**Risk Budget Tracking**

Maintain a runtime risk budget B(t) representing remaining allowable risk:

- Initialize: B(0) = B_total (total allocated risk for deployment period)
- Deplete: When violations occur or uncertainty increases, reduce B(t)
- Restore: When safety margins increase or uncertainty resolves, restore B(t)

**Budget-Based Intervention**

Intervention decisions can use risk budget state:

```
If B(t) < B_critical:
    Engage maximum safety measures (fallback controller, human oversight)
Elif B(t) < B_warning:
    Increase monitoring frequency, reduce capability
Elif B(t) < B_nominal:
    Normal operation with standard monitoring
```

This creates dynamic safety margins: when risk budget is depleted, become more conservative; when budget is ample, allow more aggressive optimization.

**Quantitative Risk Tracking**

Monitors track quantitative risk metrics:

- **Violation frequency**: Count violations per operating hour
- **Severity distribution**: Track distribution of violation severities
- **Near-miss analysis**: Monitor how close to violations the system operates
- **Uncertainty levels**: Track epistemic uncertainty requiring more conservative operation

These metrics feed into risk budget updates, creating a closed-loop safety management system.

## 7. Practical Implementation

Translating runtime monitoring theory into deployed systems requires addressing practical concerns: tool selection, integration strategies, and performance overhead.

### Runtime Verification Tools

**Copilot**

Copilot is a stream-based runtime verification framework for generating hard real-time C code. Developed by NASA, Copilot targets embedded systems with strict timing and resource constraints.

Key features:

- **Domain-specific language**: High-level stream-based specifications in Haskell
- **Automatic code generation**: Generates verified C99 code from specifications
- **Constant-time execution**: All operations execute in constant time (no dynamic allocation, bounded loops)
- **Resource bounds**: Static analysis provides guaranteed memory and timing bounds

Typical workflow:

1. Write specifications as temporal properties over typed streams
2. Compile specifications to C code
3. Link generated monitors with system code
4. Deploy to embedded platform with real-time OS

Copilot is particularly suitable for safety-critical embedded systems like flight controllers and satellite systems.

**FRET (Formal Requirements Elicitation Tool)**

NASA's FRET addresses the gap between natural language requirements and formal specifications:

- **Structured natural language**: Requirements written in constrained English with formal semantics
- **Automatic formalization**: Converts structured requirements to temporal logic (LTL, MTL)
- **Tool integration**: Integrates with Copilot for monitor generation

Example FRET requirement:

```
"When engine_failure occurs, the controller shall transition to backup_mode within 100ms"
```

FRET automatically translates this to an MTL formula and generates a Copilot monitor specification.

**ROSRV (Runtime Verification for ROS)**

ROSRV provides runtime verification for robotic systems built on ROS (Robot Operating System):

- **Transparent monitoring**: Intercepts ROS messages without modifying application code
- **Formal specifications**: Properties specified in temporal logic
- **Automatic instrumentation**: Automatically generates monitor nodes in ROS

ROSRV is particularly valuable for robotics, where:

- Systems are complex with many interacting components
- ROS provides standardized message-passing infrastructure
- Runtime verification can detect coordination and safety issues

**TeSSLa**

TeSSLa (Temporal Stream-based Specification Language) provides a flexible ecosystem for runtime verification:

- **Stream-based specifications**: Declarative specifications over event streams
- **Multiple backends**: Compiles to software monitors (JVM, C) and hardware monitors (FPGA)
- **Time-aware**: Explicitly handles real-time and timing constraints
- **Toolchain**: Includes interpreters, compilers, and analysis tools

TeSSLa supports both online and offline monitoring and can handle asynchronous event streams from distributed systems.

**Commercial and Domain-Specific Tools**

- **MATLAB/Simulink Deep Learning Verification Library**: Runtime monitoring for neural network controllers in Simulink
- **Netdata**: Low-overhead system monitoring with machine learning anomaly detection
- **Datadog, New Relic**: Commercial observability platforms with AI-driven anomaly detection
- **AWS Agentic AI Security**: Framework for monitoring autonomous AI agents with behavioral anomaly detection

### Integration Strategies

**Non-Invasive Monitoring**

Ideal monitoring requires no modification to monitored system:

- **Observation points**: Tap existing system outputs, sensors, or communication channels
- **Shadow execution**: Monitors run in parallel without affecting system
- **Post-processing**: Analyze logs or traces generated by unmodified system

Benefits: No risk of monitoring introducing bugs, can monitor legacy or third-party components

Limitations: Limited to observable interfaces, cannot prevent violations proactively

**Instrumentation-Based Monitoring**

Insert observation points into system code:

- **Logging instrumentation**: Add logging statements at safety-critical points
- **Assertion instrumentation**: Insert runtime assertions checked during execution
- **Tracing instrumentation**: Add tracepoints for detailed execution monitoring

Modern approaches include:

- **Aspect-oriented programming**: Specify monitoring concerns separately; weave into code automatically
- **Compiler instrumentation**: Compiler automatically instruments code based on specifications
- **Binary instrumentation**: Modify compiled binaries to add monitoring without source changes

**API-Based Integration**

Systems expose APIs specifically for monitoring:

- **Health check endpoints**: Regularly queried to verify system status
- **Metrics APIs**: Expose internal metrics for external monitoring
- **Event streams**: Publish events to which monitors subscribe

This approach is common in microservices architectures and cloud deployments.

**Hardware-Accelerated Monitoring**

For performance-critical systems, implement monitors in hardware:

- **FPGA monitors**: Compile monitoring logic to FPGAs for parallel execution
- **Monitoring coprocessors**: Dedicated hardware for monitoring tasks
- **Hardware instrumentation**: Built-in tracing and monitoring in processors

Hardware monitoring provides:

- **Parallel execution**: Zero overhead on main system
- **Deterministic timing**: Predictable monitoring latency
- **Security isolation**: Hardware monitors cannot be compromised by software

### Performance Overhead and Benchmarks

Runtime monitoring inevitably introduces overhead. Understanding and minimizing overhead is crucial for practical deployment.

**Sources of Overhead**

- **Instrumentation overhead**: Cost of collecting observations (logging, tracing, sensor reading)
- **Monitor execution overhead**: Computational cost of monitor logic
- **Intervention overhead**: Cost of triggering interventions when violations detected
- **Communication overhead**: Transmitting observations to monitors, monitor results to actuators

**Overhead Metrics**

Standard metrics for monitoring overhead:

- **CPU overhead**: Additional CPU utilization due to monitoring (typically 1-15% for software monitors)
- **Memory overhead**: Additional memory for monitor state (bounded for online monitors, typically KB to MB)
- **Latency overhead**: Additional delay in system response (critical for real-time systems, typically μs to ms)
- **Throughput impact**: Reduction in system throughput (typically 5-20% for complex monitors)

**Benchmark Results**

Representative overhead measurements from literature:

**ROSRV (robotics monitoring)**:

- CPU overhead: 2-8% depending on specification complexity
- Memory overhead: <10MB for typical specifications
- Latency: <1ms for message interception and checking

**Copilot (embedded real-time monitoring)**:

- Constant-time execution: Bounded WCET proven by construction
- Memory: Static allocation only, typically <100KB
- Latency: Microseconds for typical temporal properties on embedded processors

**TeSSLa (general-purpose monitoring)**:

- Software monitors: 5-15% CPU overhead
- FPGA monitors: <1% CPU overhead (parallel execution)
- Memory: Depends on specification, typically <50MB for complex specifications

**Neural network monitoring**:

- Internal representation monitoring: 10-30% inference latency increase
- OOD detection (density-based): 5-20% inference latency increase
- Ensemble uncertainty: 2-5× inference latency (running multiple models)

**Optimization Techniques**

Reducing monitoring overhead:

**Sampling**: Monitor subset of executions or time points

- **Periodic sampling**: Monitor every Nth event
- **Statistical sampling**: Random sampling with statistical guarantees
- **Adaptive sampling**: Increase sampling frequency when violations suspected

Tradeoff: Reduced overhead but potential to miss violations between samples

**Incremental Monitoring**: Update monitor state incrementally rather than recomputing from scratch

- **Stream processing**: Process events one at a time, maintaining minimal state
- **Incremental automata**: Update automaton state based on new events only
- **Memoization**: Cache intermediate results to avoid recomputation

**Specification Optimization**: Optimize monitor specifications for efficiency

- **Rewriting**: Transform specifications to equivalent but more efficient forms
- **Static analysis**: Identify specification portions that cannot be violated; eliminate their monitoring
- **Compositional monitoring**: Decompose complex specifications into simpler sub-monitors

**Hardware Acceleration**: Offload monitoring to specialized hardware

- **FPGA monitors**: TeSSLa and other tools compile monitors to FPGAs
- **GPU monitoring**: Parallelize monitoring across GPU cores for high-throughput systems
- **Custom ASICs**: For highest-volume systems, custom monitoring hardware

**Runtime Adaptation**: Adjust monitoring overhead based on operational conditions

- **Confidence-based**: Reduce monitoring when confidence in safety is high
- **Risk-based**: Increase monitoring when operating near safety boundaries
- **Resource-based**: Adjust monitoring based on available computational resources

### Deployment Best Practices

**Start with Offline Monitoring**

Begin deployment with offline analysis:

1. Collect execution traces from operation
2. Apply monitors to traces offline
3. Analyze violations, tune specifications and thresholds
4. Validate that online monitoring is feasible before deploying

**Gradual Online Integration**

Deploy online monitoring incrementally:

1. **Logging only**: Monitor online but only log violations, no interventions
2. **Shadow mode**: Monitor and indicate what interventions would occur, but don't execute them
3. **Limited intervention**: Enable interventions for subset of violations or during limited time periods
4. **Full deployment**: Enable complete monitoring and intervention

Each stage validates monitoring before increasing its authority.

**Comprehensive Testing**

Test monitors extensively:

- **Fault injection**: Deliberately inject violations to verify monitor detection
- **Adversarial testing**: Red-team against monitors to find evasion strategies
- **Performance testing**: Validate overhead under realistic load
- **Integration testing**: Ensure monitors interact correctly with system components

**Monitoring the Monitors**

Runtime monitoring systems themselves require monitoring:

- **Heartbeats**: Monitors periodically report operational status
- **Self-checks**: Monitors verify their own correct operation
- **Redundancy**: Multiple independent monitors for critical properties
- **Watchdog timers**: Detect if monitors hang or fail to respond

**Human Factors**

Design monitoring systems considering human operators:

- **Alert prioritization**: Distinguish critical alerts from warnings; avoid alert fatigue
- **Actionable information**: Provide context enabling operators to make informed decisions
- **Clear authority**: Define who has authority to override monitors or interventions
- **Training**: Ensure operators understand monitoring system and appropriate responses

## Conclusion

Runtime monitoring transforms the AI safety challenge from "prove this system is always safe" (often impossible) to "detect when this system becomes unsafe and respond appropriately" (achievable with formal guarantees). By combining temporal logic specifications, monitor synthesis, architectural patterns like Simplex, and careful practical implementation, runtime monitoring enables deploying powerful AI systems with safety assurance.

The key insights:

1. **Static verification alone is insufficient** for AI systems operating in complex, evolving environments with learned behaviors
2. **Formal runtime monitoring** provides provable guarantees about violation detection while enabling empirical performance optimization
3. **Architectural patterns** like Simplex decompose trust requirements, enabling unverified high-performance components under verified supervision
4. **AI-specific monitoring** techniques address unique challenges: distribution shift, OOD detection, emergent capabilities
5. **Probabilistic guarantees** through PAC bounds extend formal methods to stochastic systems and learned components
6. **Practical tools and integration strategies** make runtime monitoring deployable in real systems with acceptable overhead

As AI systems become more capable and autonomous, runtime monitoring will be essential for safe deployment. The foundations—temporal logic, monitor synthesis, verification techniques—are mature. The AI-specific extensions—OOD detection, behavioral anomaly detection, capability monitoring—are rapidly developing. The integration of these techniques into comprehensive safety architectures represents a tractable path toward trustworthy AI systems.

Future work must address:

- **Monitoring compositional systems** where multiple AI components interact
- **Adversarial robustness** against attacks targeting monitors themselves
- **Monitoring emergent capabilities** in large-scale foundation models
- **Closing the loop** between monitoring and continuous learning/improvement
- **Regulatory frameworks** recognizing runtime monitoring as evidence for safety certification

Runtime monitoring is not a complete solution to AI safety—no single technique is. But as a layer in defense-in-depth safety architectures, runtime monitoring provides formal guarantees, continuous operational assurance, and a path to safely deploying AI systems whose full behavior we cannot predict in advance.

---

## References and Further Reading

1. Havelund, K., & Roşu, G. (2002). "Synthesizing monitors for safety properties." *Proceedings of TACAS*. Foundational work on monitor synthesis from temporal properties.

2. Leucker, M., & Schallhart, C. (2009). "A brief account of runtime verification." *Journal of Logic and Algebraic Programming*. Comprehensive overview of RV foundations.

3. Deshmukh, J., et al. (2017). "Robust online monitoring of signal temporal logic." *Formal Methods in System Design*. Efficient online monitoring with quantitative semantics.

4. Sha, L. (2001). "Using simplicity to control complexity." *IEEE Software*. Original Simplex architecture for runtime assurance.

5. Cofer, D., et al. (2012). "Compositional verification of architectural models." *NASA/CR-2012-217635*. Copilot framework and formal verification of embedded monitors.

6. Huang, L., et al. (2021). ["Runtime Safety Monitoring of Deep Neural Networks for Perception: A Survey"](https://arxiv.org/abs/2511.05982). Comprehensive survey of DNN runtime monitoring techniques.

7. Pike, L., et al. (2022). ["Integrating FRET with Copilot: Automated Translation of Natural Language Requirements to Runtime Monitors"](https://ntrs.nasa.gov/citations/20220000049). NASA's end-to-end framework from requirements to monitors.

8. Huang, C., et al. (2019). ["ROSRV: Runtime Verification for Robots"](https://link.springer.com/chapter/10.1007/978-3-319-11164-3_20). Runtime verification framework for ROS-based robotic systems.

9. Sipma, H., & Leucker, M. (2024). ["TeSSLa – An Ecosystem for Runtime Verification"](https://link.springer.com/chapter/10.1007/978-3-031-17196-3_20). Comprehensive RV toolchain with multiple backends.

10. Zhao, H., et al. (2025). ["The Use of the Simplex Architecture to Enhance Safety in Deep-Learning-Powered Autonomous Systems"](https://arxiv.org/abs/2509.21014). Recent application of Simplex to neural network controllers.

11. Desai, A., et al. (2025). ["Proactive Runtime Enforcement of LLM Agent Safety via Probabilistic Model Checking"](https://arxiv.org/abs/2508.00500). PAC-based runtime assurance for LLM agents.

12. AWS Security Blog (2025). ["The Agentic AI Security Scoping Matrix"](https://aws.amazon.com/blogs/security/the-agentic-ai-security-scoping-matrix-a-framework-for-securing-autonomous-ai-systems/). Framework for securing autonomous AI with behavioral monitoring.

13. Wiz Academy (2025). ["AI Runtime Security In The Cloud"](https://www.wiz.io/academy/ai-runtime-security). Practical guide to runtime security for deployed AI systems.

14. Cohen, I., et al. (2025). ["The Power of Reframing: Using LLMs in Synthesizing RV Monitors"](https://link.springer.com/chapter/10.1007/978-3-032-05435-7_12). Novel approaches to monitor synthesis using language models.

15. T3 Consultants (2025). ["AI Fail Safe Systems: Design, Strategies, & Fallback Plans"](https://t3-consultants.com/2025/07/ai-fail-safe-systems-design-strategies-fallback-plans/). Practical engineering guidance for fail-safe AI.

16. Springer (2025). ["Probabilistic Safety Verification of Distributed Systems: A Statistical Approach for Monitoring"](https://link.springer.com/chapter/10.1007/978-3-031-95497-9_7). Statistical monitoring with probabilistic guarantees.

17. IEEE (2025). ["Explainable Online Monitoring of Metric Temporal Logic"](https://link.springer.com/chapter/10.1007/978-3-031-30820-8_28). MTL monitors that provide explanation alongside verdicts.

18. arXiv (2025). ["Data-Driven Probabilistic Evaluation of Logic Properties with PAC-Confidence on Mealy Machines"](https://arxiv.org/abs/2508.14710). PAC learning for safety verification of automata.

19. arXiv (2025). ["Refined Barrier Conditions for Finite-Time Safety and Reach-Avoid Guarantees in Stochastic Systems"](https://arxiv.org/abs/2509.18518). Barrier certificates for probabilistic safety in stochastic systems.

20. arXiv (2025). ["Formalising Human-in-the-Loop: Computational Reductions, Failure Modes, and Legal-Moral Responsibility"](https://arxiv.org/abs/2505.10426). Formal analysis of human-in-the-loop systems and failure modes.
