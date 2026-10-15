---
title: "Design Patterns"
description: "Twenty patterns for bounding the risk of delegating to AI agents, each mapped to its prior art in security, reliability and governance"
sidebar:
  order: 0
---

This section catalogs twenty patterns for delegating to AI agents. Almost none is new. Most are standard security, reliability or governance practice, and each pattern names its prior art. What the pattern pages add is the part that changes when the delegate is an LLM agent:

- data and instructions arrive through the same channel;
- models can often tell when they are being tested;
- model versions change underneath stable names;
- checks built on similar models fail together.

The "main channels" column uses the harm channels of [Risk Decomposition](/delegation-risk/risk-decomposition/): *accident*, *defection* (including reward hacking) and *hijack* (prompt or tool-output injection, and misuse).

## Catalog

| Pattern | What it does | Main channels | Prior art |
|---|---|---|---|
| [Escalation Ladder](/design-patterns/structural/#escalation-ladder) | Scales oversight to stakes; adds a time lock before irreversible actions | all | Approval chains; levels of automation |
| [Graduated Autonomy](/design-patterns/structural/#graduated-autonomy) | Widens permissions as evidence accumulates | accident | Probation; graduated licensing |
| [Exposure-Envelope Gateway](/design-patterns/structural/#exposure-envelope-gateway) | One enforcement point the agent cannot bypass, for tools, egress, writes and spend | all | Reference monitor; least privilege |
| [Task Decomposition Pipeline](/design-patterns/structural/#task-decomposition-pipeline) | Checkable steps; factored cognition | accident, defection | Pipes and filters; stage gates |
| [Bulkhead Isolation](/design-patterns/structural/#bulkhead-isolation) | Partitions that failures and credentials cannot cross | accident, hijack | Ship bulkheads; Nygard (2007) |
| [Voting Tribunal](/design-patterns/structural/#voting-tribunal) | Independent checkers vote; rotation and resampling | accident, defection | N-version programming; Byzantine fault tolerance |
| [Honeypot Injection](/design-patterns/verification/#honeypot-injection) | Traps and canary tokens that no legitimate task touches | hijack, defection | Honeypots; canary tokens |
| [Capability Probing](/design-patterns/verification/#capability-probing) | Elicits true capability; detects sandbagging | defection | Capability evaluations |
| [Consistency Triangulation](/design-patterns/verification/#consistency-triangulation) | Resamples and cross-checks for contradictions | accident | Triangulation; self-consistency |
| [Trusted Monitor](/design-patterns/monitoring/#trusted-monitor) | A trusted model scores every action; chain-of-thought monitoring | defection, hijack | Supervision; AI Control |
| [Random Audit](/design-patterns/monitoring/#random-audit) | Unpredictable deep review under an auditing budget | defection | Random tax audits; the Panopticon |
| [Flight Recorder](/design-patterns/monitoring/#flight-recorder) | Tamper-evident trace with detectors and drift baselines | all | Flight recorders; secure audit logs |
| [Need-to-Know Compartments](/design-patterns/information/#need-to-know-compartments) | Separates trusted instructions from untrusted data | hijack | Compartmented clearances; information-flow control |
| [Selective Amnesia](/design-patterns/information/#selective-amnesia) | Keeps derived results, not raw data, in every store | hijack, accident | Data minimization |
| [Expiring Grants](/design-patterns/information/#expiring-grants) | Every grant has a time-to-live; renewal is a new grant | all | Kerberos tickets; just-in-time access |
| [Adversarial Collaboration](/design-patterns/multi-agent/#adversarial-collaboration) | Debate between genuinely opposed parties | accident, defection | Adversarial legal process; AI safety via debate |
| [Trust Transitivity Limits](/design-patterns/multi-agent/#trust-transitivity-limits) | Attenuation and depth limits for subagent chains | hijack, defection | X.509 path-length constraints; macaroons |
| [Operator Incentives](/design-patterns/multi-agent/#operator-incentives) | Bonds, bounties and insurance on the humans and firms involved | all | Fidelity bonds; bug bounties; insurance |
| [Graceful Degradation](/design-patterns/recovery/#graceful-degradation) | Pre-defined degraded modes, a kill switch and fallbacks | all | Degraded modes; emergency stops |
| [Checkpoint-Rollback](/design-patterns/recovery/#checkpoint-rollback) | Undoes what can be undone; commit points for what cannot | accident | Transactions; sagas |

## Redundancy and independence

Several of these patterns get their value from multiple checks failing independently: Voting Tribunal, Consistency Triangulation, Adversarial Collaboration, stacked monitors and the Flight Recorder's detectors. Such checks rarely fail independently. Take three layers that each miss 10%. A common-cause correlation $\rho$ multiplies their joint miss probability by $1 + 99\rho$, which is about 11×, 21× and 50× at $\rho$ = 0.1, 0.2 and 0.5. Those values of $\rho$ are illustrative; [Measuring Entanglement](/entanglements/detection/correlation-calculator/#what-the-evidence-supports) estimates about 0.5 between the benchmark misses of strong LLMs even across providers, with caveats. Against an adaptive attacker, assume $\rho \to 1$ and count a stack as worth its best layer. Correlation does not change the sum of expected losses, only how often defenses fail together.

The [entanglement tax](/entanglements/fundamentals/formal-definitions/#the-entanglement-tax) is defined on Formal Definitions; [Risk Propagation](/delegation-risk/risk-propagation/) gives the derivation and the estimation recipe. [Channel Integrity](/design-patterns/channel-integrity/) covers active influence between components, and [Entanglements](/entanglements/) gives the wider treatment.

## Using the catalog

Start with structure and with the six [Least-X principles](/design-patterns/least-x-principles/), which say how far to shrink each component's capability, access, context, memory, autonomy and connections. The envelope gateway, bulkheads and expiring grants bound exposure without detecting anything, so they hold against inputs and intentions nobody anticipated. Add verification and monitoring where the envelope has to be wide enough for the agent to do useful work. Add recovery for what detection misses. [Composing Patterns](/design-patterns/composing-patterns/) works through combinations.
