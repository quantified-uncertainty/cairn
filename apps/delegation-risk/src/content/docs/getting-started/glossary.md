---
title: "Glossary"
description: "Key terms used throughout the framework, organized by domain, with framework-specific definitions."
---

Key terms used throughout this framework, organized by domain.

:::note[Framework-Specific Definitions]
These definitions reflect how terms are used **within this framework**. Other sources (academic literature, industry standards, other AI safety work) may define some of these terms differently. When reading external sources, be aware of potential definitional differences.
:::

## Common Terminology Confusions {#terminology-clarifications}

Some terms are used interchangeably in casual discussion but have distinct meanings in this framework:

| Term | When to Use | Related Terms |
|------|-------------|---------------|
| **Agent** | When emphasizing goal-directed behavior and optimization | Component, Delegate, System |
| **Component** | When emphasizing architecture and system structure | Agent, Module, Subsystem |
| **Delegate** | When emphasizing the delegation relationship from principal | Agent, Subordinate, Executor |
| **Defection** | Intentional deviation from principal's goals (scheming) | Misalignment, Failure |
| **Misalignment** | Goals don't match principal's (may or may not be intentional) | Defection, Value Drift |
| **Harm Mode** | Specific way delegation causes damage | Failure Mode (related but distinct) |
| **Failure Mode** | Engineering term for how systems fail (from FMEA) | Harm Mode (our AI-specific term) |

**When in doubt:**
- Use **agent** when discussing optimization, goals, and agency scores
- Use **component** when discussing architecture and system decomposition
- Use **delegate** when discussing the principal-agent relationship

## Core Framework Terms {#core-framework-terms}

<span id="agent"></span>
**Agent** — A system whose behavior can be usefully modeled as optimizing an objective function over time. Agency is a matter of degree, not a binary property. See [Agent, Power, and Authority](/power-dynamics/agent-power-formalization/).

<span id="agency-score"></span>
**Agency Score** (or **Coherence Score**) — Measure of how well a system's behavior can be explained by a simple utility function. Higher coherence = more agent-like. Formally: max over simple utility functions U of Fit(U, observed behaviors). A low-agency system is predictable; a high-agency system coherently pursues goals.

<span id="power-score"></span>
**Power Score** — Measure of an agent's ability to achieve a wide variety of goals. Formally: expected achievability across many possible goal functions. Related concepts: reachability (how many states can the agent access?), resource control, influence over other agents.

<span id="authority"></span>
**Authority** — Sanctioned power; the intersection of what an agent *can* do (power) and what it *may* do (permission). Authority = Power ∩ Permission. An agent with high power but low authority is dangerous.

<span id="effective-capability"></span>
**Effective Capability** — Power × Agency. The ability to actually accomplish objectives. Requires both the power to affect the world and the agency to coherently pursue goals.

<span id="racap"></span>
**RACAP (Risk-Adjusted Capability)** — Capability Score / Delegation Risk. Measures efficiency—how much capability per unit risk. Higher RACAP = better system design.

<span id="harm-surface"></span>
**Harm Surface** — The *enumeration*: the set of distinct ways a delegation can go wrong (its harm modes). A set, not a number—the delegation analogue of an [attack surface](https://en.wikipedia.org/wiki/Attack_surface) in security. The harm surface is what you *bound* (→ Exposure) and *price* (→ Delegation Risk). Previously called "delegation exposure" in older pages; that conflation is now resolved into three tiers (enumerate → bound → expect).

<span id="exposure"></span>
**Exposure** — The worst-case loss across the harm surface, *given the delegate's actual access and capability*—a dollar bound, not an expectation. Capability-dependent: the same office key carries far higher exposure for a delegate who can exploit what it reaches. Lineage: [exposure-at-default](https://en.wikipedia.org/wiki/Exposure_at_default) in finance. Contrast Delegation Risk (the expected loss). See [Delegation Accounting](/delegation-risk/delegation-accounting/).

<span id="exposure-envelope"></span>
**Exposure Envelope** — The bounded region of action-space within which an agent may operate freely; the scaffold enforces the boundary *regardless of the agent's inputs or intent*. A hard bound, not a statistical one—a single catastrophic action must hit the envelope wall, not merely overdraw a budget. Lineage: Airbus flight envelope protection. See [Runtime Risk Accounting](/delegation-risk/runtime-accounting/).

<span id="exposure-ledger"></span>
**Exposure Ledger** — The running account of exposure per delegate: actions debit, completed verifications and de-provisioning credit back. Ships only with its discipline attached—**reconciliation** (comparing ledger estimates against observed incidents) and **consolidation** (rolling up a subagent tree requires correlation adjustments, like intercompany eliminations). A ledger without reconciliation is fake precision with bookkeeping aesthetics. See [Runtime Risk Accounting](/delegation-risk/runtime-accounting/).

<span id="harm-mode"></span>
**Harm Mode** — A specific way a delegation could cause damage. Parallels "failure mode" from [FMEA](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis). Each harm mode has a probability and a damage value. *Example*: "Leaks proprietary data" with P=0.001 and Damage=\$50,000.

<span id="delegation-risk"></span>
**Delegation Risk** — The probability-weighted expected cost of a delegation: Σ P(harm mode) × Damage(harm mode). This is the quantified total across all harm modes in the harm surface—the *expected* loss, contrasted with Exposure (the worst-case bound). Measured in dollars per time period. *Example*: Two harm modes (\$100 + \$50) = \$150 delegation risk. Decomposes into Accident Risk + Defection Risk.

<span id="accident-exposure"></span>
**Accident Exposure** — The subset of the harm surface containing non-goal-directed harm modes: bugs, errors, hallucinations, capability limitations, edge cases. These are failures where the system isn't pursuing a conflicting objective—it's just failing to achieve the intended one. See [Risk Decomposition](/delegation-risk/risk-decomposition/).

<span id="accident-risk"></span>
**Accident Risk** — Delegation Risk from accident exposure: Σ P(accident mode) × Damage(accident mode). Generally *decreases* with capability (smarter systems make fewer errors). Mitigated through testing, verification, redundancy, and capability improvements.

<span id="defection-exposure"></span>
**Defection Exposure** — The subset of the harm surface containing goal-directed harm modes: scheming, deception, pursuing misaligned objectives, collusion. These are failures where the system is effectively optimizing for something other than the principal's interests. See [Risk Decomposition](/delegation-risk/risk-decomposition/).

<span id="defection-risk"></span>
**Defection Risk** — Delegation Risk from defection exposure: Σ P(defection mode) × Damage(defection mode). May *increase* with capability (smarter systems are better at pursuing misaligned goals). Mitigated through alignment, monitoring, containment, and architectural constraints.

<span id="risk-inheritance"></span>
**Risk Inheritance** — How risk flows through a delegation chain. When A delegates to B and B delegates to C, A inherits exposure to C's harm modes. Risks combine via the canonical propagation rule (next entry).

<span id="propagation-rule"></span>
**Propagation Rule** — How reliabilities compose through a chain or stack. The canonical rule is multiplicative (independent stages multiply), corrected for common-cause correlation with the beta-factor mixture P(all fail) = (1−ρ)·∏pᵢ + ρ·min(pᵢ). The "minimum" (weakest-link) rule is the fully correlated ρ = 1 limit of this mixture, not a separate option. See [Risk Propagation](/delegation-risk/risk-propagation/).

<span id="entanglement-tax"></span>
**Entanglement Tax** — The ratio between your actual joint failure probability and what the independence assumption predicts: Tax = P(all fail) / ∏pᵢ. For n identical layers with failure rate p and correlation ρ, Tax = (1−ρ) + ρ·p^(1−n) — three 90% layers at ρ = 0.5 carry a ~50× tax. See [Formal Definitions](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax).

<span id="load-bearing-channels"></span>
**Load-Bearing Channels** — The sanctioned communication paths between delegates that decomposition could not remove—the "necessary evil" channels where monitoring budget should concentrate. The named subspecies of entanglement that is *chosen*, as opposed to the passive correlations a system inherits.

<span id="privilege-overhang"></span>
**Privilege Overhang** — The static gap between what a delegate *can* do and what its current task *needs*. The stock; [privilege creep](https://en.wikipedia.org/wiki/Privilege_creep) is the flow that grows it. The same quantity CIEM measures as *unused entitlements / the permissions gap* (Microsoft 2024: ~2% of granted cloud permissions are actually used).

<span id="delegation-risk-budget"></span>
**Delegation Risk Budget** — Maximum acceptable Delegation Risk for a system or component. Like a financial budget, but for expected harm.

<span id="gross-exposure"></span>
**Gross Exposure** — The full harm surface before controls are applied. Contains all possible harm modes.

<span id="net-exposure"></span>
**Net Exposure** — The harm surface remaining after controls. Some harm modes may be eliminated or mitigated.

<span id="residual-risk"></span>
**Residual Risk** — Delegation Risk after controls are applied. The expected cost that remains despite mitigations.

<span id="risk-preflight"></span>
**Risk Preflight** — A damage estimate the scaffold runs *before* an agent action commits: enumerate the harm surface of the proposed action, bound the exposure, compare against budget, then adjust strategy or escalate. Lineage: [CORS preflight](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) (a cheap permission-check before the real request) and aviation flight-risk assessment. Hard rule: the preflight must sit *lower* on the [verifiability hierarchy](#verifiability-hierarchy) than the actor it checks. See [Runtime Risk Accounting](/delegation-risk/runtime-accounting/).

<span id="principal"></span>
**Principal** — An entity that delegates tasks and grants trust. In most systems, humans are the ultimate principals.

<span id="executor"></span>
**Executor** — A component that performs delegated actions. Executors create exposure through their potential harm modes.

<span id="coordinator"></span>
**Coordinator** — A component that orchestrates other components—routing tasks, making strategic decisions, aggregating results. Highest-risk component type due to leverage over the system.

<span id="correlation-budget"></span>
**Correlation Budget** — A budget on allowed failure correlation within a defense stack (e.g. "no two layers share a provider"), complementing the risk budget. The practical, settable face of the [entanglement tax](#entanglement-tax); ρ is on the failure-indicator (φ) scale. See [Risk Propagation](/delegation-risk/risk-propagation/).

<span id="delegation-engineering"></span>
**Delegation Engineering** — The practice of designing, measuring, and operating delegation structures (human or AI, but our distinctive content is AI-flavored) to bound exposure while preserving capability. The field name for what this site does.

<span id="trust-level"></span>
**Trust Level** — Assessment of an actor's reliability and alignment. Informs delegation decisions but is distinct from delegation risk. High trust level → willing to accept larger exposure.

---

## "Least X" Principles {#least-x-principles}

<span id="least-intelligence"></span>
**Least Intelligence** — Minimum cognitive capability needed for the task. Bounds optimization power to limit damage from misalignment.

<span id="least-privilege"></span>
**[Least Privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege)** — Minimum permissions and access rights. Classic security principle: read vs. write, network access, API permissions.

<span id="least-context"></span>
**Least Context** — Minimum information about the broader system. Component doesn't know system architecture, other components, or deployment details.

<span id="least-persistence"></span>
**Least Persistence** — Minimum state maintained across invocations. Prevents accumulation of knowledge or long-term planning.

<span id="least-autonomy"></span>
**Least Autonomy** — Minimum ability to act without oversight. Spectrum from human-approval-required to bounded-autonomy.

<span id="least-surprise"></span>
**Least Surprise** — Maximum predictability and determinism. Temperature=0 for LLMs, logged seeds for randomness. Prevents covert signaling.

<span id="least-connectivity"></span>
**Least Connectivity** — Minimum communication paths between components. One-way flows, no broadcast, physical isolation where needed.

<span id="least-observability"></span>
**Least Observability** — Components can't observe system state, their own resources, or whether they're being tested.

<span id="least-compute"></span>
**Least Compute** — Bounded computational resources per invocation. FLOPs budget, memory limits, timeouts.

<span id="least-generality"></span>
**Least Generality** — Use the least general implementation that works. Hard-coded rules > algorithms > narrow models > general LLMs > RL.

<span id="maximum-verifiability"></span>
**Maximum Verifiability** — Use the most verifiable implementation that works. Formally verified code > regular code > fine-tuned models > prompted LLMs.

---

## Risk Budgeting Terms (Finance) {#risk-budgeting-terms-finance}

<span id="euler-allocation"></span>
**[Euler Allocation](https://en.wikipedia.org/wiki/Euler%27s_homogeneous_function_theorem)** — Method for decomposing portfolio risk to individual positions. Uses partial derivatives: RC_i = x_i × ∂R/∂x_i. Ensures component contributions sum exactly to total risk.

<span id="var"></span>
**[Value at Risk (VaR)](https://en.wikipedia.org/wiki/Value_at_risk)** — Maximum expected loss at a given confidence level (e.g., 95% VaR = loss exceeded only 5% of the time).

<span id="expected-shortfall"></span>
**[Expected Shortfall (ES) / CVaR](https://en.wikipedia.org/wiki/Expected_shortfall)** — Average loss in the worst X% of cases. More sensitive to tail risk than VaR.

<span id="raroc"></span>
**[RAROC](https://en.wikipedia.org/wiki/Risk-adjusted_return_on_capital)** — Risk-Adjusted Return on Capital. Profit divided by risk capital. Used to compare risk-adjusted performance across units.

<span id="stress-testing"></span>
**Stress Testing** — Evaluating system performance under extreme but plausible scenarios.

<span id="backtesting"></span>
**Backtesting** — Comparing predicted risk levels to actual historical outcomes to validate models.

---

## Risk Budgeting Terms (Nuclear/Aerospace) {#risk-budgeting-terms-nuclear}

<span id="pra"></span>
**[PRA (Probabilistic Risk Assessment)](https://en.wikipedia.org/wiki/Probabilistic_risk_assessment)** — Systematic method for quantifying risks through event trees and fault trees. Standard in nuclear and aerospace.

<span id="cdf"></span>
**CDF (Core Damage Frequency)** — Probability of reactor core damage per reactor-year. Typical target: 10⁻⁴ to 10⁻⁵.

<span id="fault-tree"></span>
**[Fault Tree](https://en.wikipedia.org/wiki/Fault_tree_analysis)** — Logical diagram showing how component failures combine to cause system failure. AND gates (all must fail) and OR gates (any can fail).

<span id="event-tree"></span>
**[Event Tree](https://en.wikipedia.org/wiki/Event_tree_analysis)** — Diagram showing sequences of events following an initiating event, with branching based on success/failure of safety systems.

<span id="defense-in-depth"></span>
**[Defense in Depth](https://en.wikipedia.org/wiki/Defence_in_depth)** — Multiple independent barriers against failure. If one fails, others still protect.

<span id="sil"></span>
**[Safety Integrity Level (SIL)](https://en.wikipedia.org/wiki/Safety_integrity_level)** — [IEC 61508](https://en.wikipedia.org/wiki/IEC_61508) standard for safety system reliability. SIL 1-4, with higher numbers requiring lower failure probability.

<span id="asil"></span>
**[ASIL (Automotive SIL)](https://en.wikipedia.org/wiki/Automotive_Safety_Integrity_Level)** — [ISO 26262](https://en.wikipedia.org/wiki/ISO_26262) automotive safety standard. ASIL A-D, with D being most stringent.

<span id="pfdavg"></span>
**PFDavg** — Average Probability of Failure on Demand. Key metric for safety-instrumented systems.

<span id="common-cause-failure"></span>
**Common Cause Failure** — Single event that causes multiple components to fail simultaneously. Defeats redundancy.

<span id="importance-measures"></span>
**Importance Measures** — Metrics quantifying how much each component contributes to system risk. Includes Fussell-Vesely (fraction of risk involving component), Risk Achievement Worth (risk if component failed), Risk Reduction Worth (risk if component perfect).

---

## Mechanism Design Terms {#mechanism-design-terms}

<span id="incentive-compatibility"></span>
**[Incentive Compatibility](https://en.wikipedia.org/wiki/Incentive_compatibility)** — Property where truthful reporting is optimal for each participant. No benefit from lying.

<span id="vcg"></span>
**[VCG (Vickrey-Clarke-Groves)](https://en.wikipedia.org/wiki/Vickrey%E2%80%93Clarke%E2%80%93Groves_mechanism)** — Mechanism achieving truthful revelation through payments based on externalities imposed on others.

<span id="revelation-principle"></span>
**[Revelation Principle](https://en.wikipedia.org/wiki/Revelation_principle)** — Any outcome achievable by some mechanism can be achieved by a direct mechanism where truth-telling is optimal.

<span id="information-rent"></span>
**[Information Rent](https://en.wikipedia.org/wiki/Information_rent)** — Profit extracted by agents due to private information. Cost of eliciting truthful reports.

<span id="moral-hazard"></span>
**[Moral Hazard](https://en.wikipedia.org/wiki/Moral_hazard)** — When agents change behavior after agreements because their actions aren't fully observable.

<span id="adverse-selection"></span>
**[Adverse Selection](https://en.wikipedia.org/wiki/Adverse_selection)** — When agents with different (unobservable) characteristics self-select in ways that harm the principal.

---

## AI Safety Terms {#ai-safety-terms}

<span id="alignment"></span>
**Alignment** — Ensuring AI systems pursue intended goals and behave as desired by their operators.

<span id="scheming"></span>
**Scheming** — AI system strategically deceiving operators to achieve goals different from stated objectives.

<span id="instrumental-convergence"></span>
**[Instrumental Convergence](https://en.wikipedia.org/wiki/Instrumental_convergence)** — Tendency for diverse goals to produce similar instrumental sub-goals (self-preservation, resource acquisition, goal preservation).

<span id="corrigibility"></span>
**[Corrigibility](https://en.wikipedia.org/wiki/AI_alignment#Corrigibility)** — Property of an AI system that allows and assists human correction of its goals and behavior.

<span id="cais"></span>
**[CAIS (Comprehensive AI Services)](https://www.fhi.ox.ac.uk/reframing/)** — AI safety approach using narrow, task-specific AI services rather than general agents. Related: [tool AI vs. agent AI](https://gwern.net/tool-ai).

<span id="ai-control"></span>
**[AI Control](https://arxiv.org/abs/2312.06942)** — Approach focusing on monitoring and controlling AI systems rather than ensuring alignment. Assumes potential adversarial behavior.

<span id="scalable-oversight"></span>
**Scalable Oversight** — Methods for humans to effectively oversee AI systems as they become more capable than humans in various domains.

<span id="red-teaming"></span>
**[Red Teaming](https://en.wikipedia.org/wiki/Red_team)** — Adversarial testing where evaluators attempt to find vulnerabilities or elicit harmful behaviors.

---

## Architecture Terms {#architecture-terms}

<span id="decomposed-coordination"></span>
**Decomposed Coordination** — Breaking coordination into multiple limited components rather than one powerful coordinator. Prevents risk concentration.

<span id="verifiability-hierarchy"></span>
**Verifiability Hierarchy** — Ordering of implementation methods by how thoroughly they can be verified: (1) Formally verified code, (2) Regular tested code, (3) Fine-tuned narrow models, (4) Constrained general models, (5) Base LLMs, (6) RL systems.

<span id="information-bottleneck"></span>
**Information Bottleneck** — Architectural constraint limiting information flow between components. Forces compression, limits coordination.

<span id="byzantine-fault-tolerance"></span>
**[Byzantine Fault Tolerance](https://en.wikipedia.org/wiki/Byzantine_fault)** — System property where correct operation continues despite some components behaving arbitrarily (including maliciously). Requires 3f+1 components to tolerate f Byzantine faults.

<span id="n-version-programming"></span>
**[N-Version Programming](https://en.wikipedia.org/wiki/N-version_programming)** — Using multiple independent implementations for redundancy. Different architectures, different training, different teams.

<span id="canary-deployment"></span>
**[Canary Deployment](https://en.wikipedia.org/wiki/Feature_toggle#Canary_release)** — Gradual rollout where new version serves small fraction of traffic while monitoring for problems.

<span id="circuit-breaker"></span>
**[Circuit Breaker](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern)** — Automatic mechanism that stops operation when anomalies detected. Fail-closed design.

---

## Mathematical Notation {#mathematical-notation}

| Symbol | Meaning |
|--------|---------|
| DR | Delegation Risk |
| HS | Harm Surface (set of harm modes) |
| P(·) | Probability of event/harm mode |
| D(·) | Damage from harm mode |
| Σ | Sum over all harm modes/components |
| w_ij | Trust weight from component i to j |
| π | Prior probability (Bayesian) |
| λ | Decay rate |
| δ | Discount factor |
| HHI | [Herfindahl-Hirschman Index](https://en.wikipedia.org/wiki/Herfindahl%E2%80%93Hirschman_index) (concentration measure) |
| AS | Agency Score (coherence of goal-pursuit) |
| PS | Power Score (ability to achieve diverse goals) |
| U | Utility function |
| 𝒢 | Space of goal functions |
| 𝒜 | Action space |
| RACAP | Risk-Adjusted Capability |

---

## Quick Reference: Typical Values {#typical-values}

| Metric | Low Risk | Medium Risk | High Risk |
|--------|----------|-------------|-----------|
| Component Delegation Risk | < \$100/mo | \$100-500/mo | > \$500/mo |
| System Delegation Risk | < \$1,000/mo | \$1,000-5,000/mo | > \$5,000/mo |
| Harm mode probability | < 10⁻³ | 10⁻³ to 10⁻² | > 10⁻² |
| Nuclear CDF target | - | - | ~10⁻⁵/year |
| Aviation target | - | - | ~10⁻⁹/hour |

---

## See Also

- [Core Concepts](/getting-started/core-concepts/) — High-level framework introduction
- [Delegation Risk Overview](/delegation-risk/overview/) — Harm surface, exposure, and risk computation
- [Risk Budgeting Overview](/cross-domain-methods/overview/) — Cross-domain methods
- [Bibliography](/reference/bibliography/) — Full academic references
