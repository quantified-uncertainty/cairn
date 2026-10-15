---
title: "Formal Verification Limits for AI Systems"
description: "What can be proved about neural networks and AI systems, what cannot, where runtime verification and statistics take over, and why the provable part of a delegation design is the scaffold rather than the model."
---

Formal verification proves that a system satisfies a specification for every input in a stated set. For AI delegation the question is which parts of a system can carry such a proof. The short answer: small networks for narrow properties, and the deterministic scaffold around a model, yes. The model's open-ended behaviour, no. That is why the top tier of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy) holds formally verified code, and why the [exposure envelope](/delegation-risk/runtime-accounting/#2-the-exposure-envelope) is specified on the scaffold rather than on the model.

## What can be verified about neural networks

The properties current tools prove are local and numeric:

- **Local robustness.** The classification does not change within an ε-ball around a given input.
- **Input–output specifications.** For inputs satisfying a precondition, outputs satisfy a postcondition. The standard benchmark is the ACAS Xu collision-avoidance networks, on which Reluplex was demonstrated (Katz et al. 2017, [arXiv:1702.01135](https://arxiv.org/abs/1702.01135)).
- **Reachability** of output sets for neural controllers in closed loop with simple plant models.
- **Lipschitz bounds**, for example by semidefinite programming (Fazlyab et al., NeurIPS 2019, [arXiv:1906.04893](https://arxiv.org/abs/1906.04893)).

The leading tools are α,β-CROWN (bound propagation with GPU branch-and-bound), which has won every VNN-COMP since 2021 according to its [project page](https://github.com/Verified-Intelligence/alpha-beta-CROWN); Marabou 2.0, an SMT-based verifier (Wu et al., CAV 2024, [arXiv:2401.14461](https://arxiv.org/abs/2401.14461)); and ETH's abstract-interpretation verifiers built on DeepPoly (Singh et al., POPL 2019). Brix et al. summarise the competition's benchmarks and results ([arXiv:2412.19985](https://arxiv.org/abs/2412.19985)).

On scale, GPUPoly proves local robustness of a 1M-neuron, 34-layer residual network in about 34.5 ms (Müller et al., MLSys 2021, [arXiv:2007.10868](https://arxiv.org/abs/2007.10868)). That is an image classifier and an ε-ball. Nothing comparable exists for semantic properties of a language model with billions of parameters, and "this model never takes a harmful action" is not a property any of these tools can state.

## Why it does not scale

**Complexity.** Deciding whether a ReLU network can reach a given output region from a given input region is NP-complete. Katz et al. stated this with Reluplex. Sälzer & Lange repaired flaws in the original proofs and showed hardness already for one-layer networks with minimal parameters (RP 2021, [arXiv:2108.13179](https://arxiv.org/abs/2108.13179)). For other activations it is NP-complete for non-linear piecewise-linear ones, NP-hard for almost all others, complete for the existential theory of the reals for non-linear polynomials, and ∃ℝ-hard for exponential and sigmoidal functions (Wurm, RP 2023, [arXiv:2306.05818](https://arxiv.org/abs/2306.05818)).

In practice, branch-and-bound splits each unstable ReLU into two cases, so worst-case work grows as 2ⁿ in the number of unstable neurons. Heuristics cut the constant, not the exponent. Learned branching with a graph neural network reduced branches and verification time by about 50% (Lu & Kumar, ICLR 2020, [arXiv:1912.01329](https://arxiv.org/abs/1912.01329)). Ordering sub-problems by their likelihood of containing a counterexample gave speedups of up to 25× on MNIST and 80× on CIFAR-10 (Zhang, Fukuda et al. 2025, [arXiv:2507.17453](https://arxiv.org/abs/2507.17453)). Certified training, which optimises networks to be easier to verify, attacks the same problem from the other side.

**Undecidability.** By Rice's theorem, no algorithm decides a non-trivial semantic property for arbitrary programs. Melo et al. apply this to inner alignment: whether an arbitrary model satisfies a non-trivial alignment function of its outputs is undecidable. Their constructive response is that provably aligned systems can be built from a finite set of provably aligned operations, so alignment has to come from the architecture rather than be checked afterwards (*Scientific Reports* 2025; preprint [arXiv:2408.08995](https://arxiv.org/abs/2408.08995)). Undecidability for *arbitrary* systems does not block proofs about *specific* restricted ones. It means the verifiable object has to be chosen for verifiability.

**Accuracy, trust and capability.** Panigrahy & Sharan (2025, [arXiv:2509.21654](https://arxiv.org/abs/2509.21654)) define accuracy as never making a false claim when abstention is allowed, and trust as the assumption of accuracy. Under those definitions they prove that an accurate, trusted system cannot match or exceed humans on all tasks. The proof parallels Gödel and Turing, and the conclusion depends on the strict definitions.

## Compositional verification

Assume-guarantee contracts split a system into components, each promising guarantees *G* when its environment meets assumptions *A*. A system-level property follows from the component contracts if they compose. Pacti implements the contract algebra of composition, quotient and refinement efficiently (Incer et al., [arXiv:2303.17751](https://arxiv.org/abs/2303.17751)). It has been used for early design exploration of spacecraft and aircraft subsystems (Rouquette, Pinto & Incer 2024, [arXiv:2409.02218](https://arxiv.org/abs/2409.02218)). ScenicProver (Vin et al. 2025, [arXiv:2511.02164](https://arxiv.org/abs/2511.02164)) brings contracts to learning-enabled systems. It combines evidence from testing, Lean 4 proofs and manufacturers' sensor guarantees. In an automatic-emergency-braking case study, it gave stronger probabilistic guarantees than monolithic testing at the same compute budget.

The gap is the learned component. A network has no specification of its own, so its contract is an assumption, synthesised or tested, and the system guarantee is only as good as that assumption. Composition also says nothing about interactions that the contracts do not mention.

## Guaranteed Safe AI

Dalrymple et al. (2024, [arXiv:2405.06624](https://arxiv.org/abs/2405.06624)) define a Guaranteed Safe AI system by three components: a world model, a safety specification, and a verifier that produces an auditable quantitative guarantee that the system meets the specification relative to the world model. They grade each component on its own spectrum: world models from Level 0 to 5, specifications from 0 to 7, verifiers from 0 to 10. The verifier spectrum runs from no guarantee (0) through ad-hoc testing (1), standard test suites (2), property-based tests (3), black-box fuzzing (4) and white-box fuzzing (5), to probabilistic inference with asymptotic coverage (6, and 7 combined with white-box fuzzing). Level 8 adds non-asymptotic coverage bounds, Level 9 is a sound bound on the probability of failure (a formal proof is the case where the bound is zero), and Level 10 requires a proof concise enough for humans to check. The authors say strong guarantees need a verifier at Level 8, 9 or 10. Tegmark & Omohundro (2023, [arXiv:2309.01933](https://arxiv.org/abs/2309.01933)) make the stronger claim that provable safety is the only path to controllable AGI.

Every GS AI guarantee is relative to its world model and complete only to the extent of its specification. For an agent with open-ended tasks, neither exists today. What can be specified are interface properties: no writes outside a directory, no network egress except to an allowlist, spend under a cap. These are the envelope.

## Runtime verification

Runtime verification checks a single execution against a formal specification as it runs (Leucker & Schallhart, "A brief account of runtime verification", *JLAP* 2009). Monitors are synthesised from temporal logic: LTL for orderings of events, and metric variants for deadlines (Havelund & Roşu, "Synthesizing monitors for safety properties", TACAS 2002). Two facts shape what a monitor can promise:

- **Safety properties are monitorable; liveness generally is not.** A violation of "never write outside directory D" shows up in a finite prefix, so a monitor can detect it and block it. "Eventually answers" cannot be refuted by any finite prefix. Monitors over finite prefixes therefore give three-valued verdicts: satisfied, violated, or inconclusive. Envelope rules should be written as safety properties.
- **A monitor proves something about this run, not all runs.** It is sound and complete only relative to what it can observe. A monitor that sees the model's prose instead of the process's system calls inherits the model's ambiguity.

Mature tooling exists for embedded and cyber-physical systems. Copilot compiles stream specifications into constant-time, constant-space C monitors for hard real-time systems (Pike, Goodloe, Morisset & Niller, RV 2010). TeSSLa is a stream-based specification language with compilers to software and hardware monitor backends (Kallwies, Leucker et al., RV 2022). Schotschneider et al. (2025, [arXiv:2511.05982](https://arxiv.org/abs/2511.05982)) survey monitors for neural perception, classified by whether they watch inputs, internal representations or outputs.

The **Simplex architecture** (Sha, "Using simplicity to control complexity", *IEEE Software* 2001) runs an unverified high-performance controller beside a verified baseline controller. A verified decision module switches to the baseline before the system leaves the set of states the baseline can recover from. Nesti et al. (2025, [arXiv:2509.21014](https://arxiv.org/abs/2509.21014)) put the neural controller and the safety functions in hypervisor-isolated domains on one platform, and show the fallback preventing faults on a pendulum and a rover. The mapping to agents is direct: the model is the unverified controller, the envelope and its enforcement are the decision module, and the decision module is the part that must be verified. That is the "[who preflights the preflight](/delegation-risk/runtime-accounting/#who-preflights-the-preflight)" rule in control-systems form.

For LLM agents, ProbGuard (Wang, Poskitt et al. 2025, [arXiv:2508.00500](https://arxiv.org/abs/2508.00500)) abstracts agent executions into symbolic states and learns a discrete-time Markov chain from traces. It intervenes when the estimated probability of staying safe falls below a threshold. In the embodied-agent tasks, re-prompting cut unsafe behaviour by 65% while keeping 80% of task completion, and halting cut it by 94% at a larger cost in completion. Its estimates are learned from past traces, so they share the limit in the next section.

## Statistical guarantees and the rule of three

Where proof is out of reach, the fallback is a statistical bound, and two different bounds get conflated.

- **Estimating** a failure rate to within ±ε with confidence 1 − δ needs on the order of ε⁻² log(1/δ) samples. By Hoeffding's inequality, n ≥ ln(2/δ)/(2ε²) suffices.
- **Certifying** that a rate is below ε, after observing zero failures, needs n ≥ ln(1/δ)/ε, which is about 3/ε at 95% confidence: the *rule of three*.

Certification is the relevant bound for rare catastrophic harm, and it is linear in 1/ε, which is still prohibitive. Showing a failure rate below 10⁻³ takes about 3,000 failure-free trials. Below 10⁻⁶ takes 3 million, and below 10⁻⁹ takes 3 billion, about 342,000 years if each trial is an hour of operation. Butler & Finelli made this argument for life-critical software ("The infeasibility of quantifying the reliability of life-critical real-time software", *IEEE TSE* 19(1), 1993). They also argued that fault tolerance does not escape the problem, because independent failure of separately written versions cannot be assumed.

Both bounds also assume the trials are independent draws from the deployment distribution. Distribution shift breaks that, and an adaptive adversary breaks it completely. A scheming model that behaves well whenever it suspects it is being tested contributes clean trials that say little about deployment (see [Empirical Scheming Reduction](/research/trust-behavior/empirical-scheming-reduction/#good-behaviour-under-observation-is-weak-evidence)).

## What follows for delegation design

- **Verify the scaffold, not the model.** Envelope rules over file scope, egress, spend and tool allowlists are safety properties over deterministic code. They can be specified, model-checked or tested exhaustively, and enforced by a monitor that reads system calls rather than prose. This is tier 1–2 of the verifiability hierarchy.
- **Monitor what cannot be proved.** Model behaviour gets runtime checks and [control evaluations](/research/trust-behavior/empirical-scheming-reduction/), with stated detection rates rather than proofs.
- **Do not claim calibrated probabilities for rare catastrophic harm modes from operational data.** The rule of three makes them unreachable at the rates that matter. Bound those modes with the envelope. Reserve ledger [reconciliation](/delegation-risk/runtime-accounting/#3-the-exposure-ledger) for harm modes frequent enough to observe.
- **State what each guarantee is relative to:** the world model, the contract assumed for a learned component, the monitor's observation channel, the sampling distribution.

## Further reading

Urban & Miné (2021, [arXiv:2104.02466](https://arxiv.org/abs/2104.02466)) review formal methods for machine learning against the standard set by avionics software. The Guaranteed Safe AI paper above is the most developed proposal for extending proofs to AI systems; [Relationship to Existing Approaches](/reference/related-approaches/) places it next to safety cases and AI Control.
