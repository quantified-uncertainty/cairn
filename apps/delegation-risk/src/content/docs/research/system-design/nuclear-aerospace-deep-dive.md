---
title: "Safety-Critical Engineering Precedents"
description: "How nuclear, aviation, process-industry and automotive safety engineering decompose a system-level target across components, where those methods break, and what transfers to AI delegation."
---

Nuclear power, civil aviation, the process industries and automotive engineering all start from a system-level safety target and push it down to components. Their tools (fault trees, importance measures, common-cause models, integrity levels, decomposition rules) are the closest precedent for a delegation-risk budget. This page summarizes the tools, the standards, and the failures that showed their limits. They are analogies with stated limits, not evidence that the methods work for AI agents.

## Fault trees and importance measures

A fault tree combines component failure probabilities through gates. With independent inputs:

- **OR gate** (any input failure fails the output): $P = 1 - \prod_i (1 - p_i) \approx \sum_i p_i$ for rare events.
- **AND gate** (all inputs must fail): $P = \prod_i p_i$.

In reliability-block terms, components in **series** form an OR gate (any one failing breaks the chain), and redundant components in **parallel** form an AND gate. The AND gate is where redundancy earns its credit, and it is also where the independence assumption does the most work.

Importance measures say where to spend effort:

| Measure | Definition | Use |
|---|---|---|
| Fussell-Vesely | Share of total risk from cut sets containing the component | How much risk the component contributes |
| Risk Achievement Worth (RAW) | Risk with the component failed ÷ baseline risk | How much the system leans on it |
| Birnbaum | $\partial R / \partial p_i$ | Where an improvement buys most |

A RAW of 2 or more is commonly used as a screening criterion for risk significance (for example, in US Maintenance Rule practice), not as a trigger for regulatory action. <!-- TODO(verify): RAW >= 2 screening threshold attributed to NUMARC 93-01; not checked against the document. -->

## Common-cause failure

The AND gate's product holds only if the inputs fail independently. The beta-factor model (Fleming 1974; NUREG/CR-4780) assigns a fraction β of each component's failure probability to a shared cause that fails all redundant components together. The site's canonical form, with ρ in place of β, is in [Risk Propagation](/delegation-risk/risk-propagation/):

$$P(\text{all fail}) \approx (1-\rho)\prod_i p_i + \rho \min_i p_i$$

For process-industry hardware, IEC 61508-6 (Annex D) gives β values of roughly 0.5–5% for logic subsystems and 1–10% for sensors and final elements, set by a checklist of separation, diversity and maintenance practices. <!-- TODO(verify): IEC 61508-6 Annex D beta ranges taken from the audit and memory; not checked against the standard or a secondary source. -->

The consequence is a floor that redundancy cannot get under. Two channels at $3.2 \times 10^{-5}$ per hour each give $10^{-9}$ if independent. With β = 1% the common-cause term alone is $3.2 \times 10^{-7}$, more than 300 times the target. To reach $10^{-9}$ with β = 1%, each channel must already be at $10^{-7}$.

Independence fails in three familiar ways: physical (shared location, power or cooling), design (same component type, supplier or software), and operational (the same maintenance error or calibration mistake applied to every channel). For AI components the design route dominates: shared base models, training data and prompts.

### An illustrative AI fault tree

All numbers in this example are illustrative. The top event is "harmful code reaches production", with a target of $10^{-6}$ per year, and three paths:

| Path | Inputs (AND) | Independent result |
|---|---|---|
| Bypass all checks | Code review misses (10⁻²), static analysis misses (10⁻²), tests pass bad code (10⁻²), human approves (10⁻¹) | 10⁻⁷ |
| Compromised coordinator | Coordinator schemes (10⁻³), defeats redundancy (10⁻²), evades monitoring (10⁻²) | 10⁻⁷ |
| Human insider | Override (10⁻²), malicious intent (10⁻⁴) | 10⁻⁶ |

The OR of the three is about $1.2 \times 10^{-6}$, which misses the target even under independence. The first path is the larger problem. Its four checks see the same code, and the reviewers and test generators may share a model. Under the mixture above, ρ = 0.01 raises that path from $10^{-7}$ to about $10^{-4}$, and ρ = 0.1 to about $10^{-3}$: the common-cause term ρ × min pᵢ swamps the product. The second path has a different flaw: once a coordinator is scheming, "defeats redundancy" and "evades monitoring" are conditional probabilities given that fact, and must be estimated that way, not as base rates.

## Targets and what they measure

### Nuclear: modeled versus observed

The US NRC uses a core damage frequency (CDF) below $10^{-4}$ per reactor-year as a subsidiary safety objective, with a tighter figure for large early releases. <!-- TODO(verify): the LERF figure (10^-5 per reactor-year in earlier versions of this page, as used in Regulatory Guide 1.174) was not checked against an NRC source. --> Plant PRAs often report CDFs well below the $10^{-4}$ objective, and these figures are sometimes described as achieved performance. They are model outputs.

The observed record is different. Five reactor cores have suffered severe damage in three accidents at commercial power plants (Three Mile Island 2, Chernobyl 4, Fukushima Daiichi 1–3) in more than 20,000 cumulative reactor-years ([World Nuclear Association](https://world-nuclear.org/information-library/safety-and-security/safety-of-plants/safety-of-nuclear-power-reactors)). That is about $1.5 \times 10^{-4}$ per reactor-year counting accidents, or $2.5 \times 10^{-4}$ counting cores. The fleet is heterogeneous, Chernobyl's RBMK design is not comparable to plants with modern PRAs, and Fukushima was an external event, so the comparison is rough. It still shows that a computed frequency and an observed one can differ by an order of magnitude or more. A delegation-risk estimate of $10^{-6}$ from a fault tree is a model output in the same sense.

Nuclear defence in depth is structured in five levels (IAEA INSAG-10, 1996): prevention of abnormal operation, control of abnormal operation, control of design-basis accidents, control of severe accidents, and mitigation of off-site radiological consequences. It is not the three-lines-of-defence model used in banking and internal audit.

### Aviation: probability targets and the fail-safe rule

Transport-aircraft certification ties allowable probability to severity (AC 25.1309-1B; ARP 4761):

| Severity | Allowable probability per flight hour | Qualitative term |
|---|---|---|
| Catastrophic | on the order of 10⁻⁹ or less | Extremely improbable |
| Hazardous | 10⁻⁷ or less | Extremely remote |
| Major | 10⁻⁵ or less | Remote |
| Minor | may be probable | Probable |

The $10^{-9}$ figure is an allocation, not a measurement. FAA's AC 25.1309-1B (2024) traces it to the British Concorde standard: a severe-accident rate of about $10^{-6}$ per flight hour, about 10% of it attributed to aircraft systems, gives $10^{-7}$, divided equally among an assumed 100 catastrophic failure conditions.

The same advisory circular states the rule that matters more for AI delegation: the failure of any single element during a flight "must be assumed, regardless of its probability," and such single failures must not be catastrophic. The $10^{-9}$ target applies only to failure conditions that already require multiple failures. This is the precedent for the site's [exposure envelope](/delegation-risk/runtime-accounting/): a hard bound that holds whatever the estimated probability, rather than a statistical budget that a single bad action can overdraw.

Software assurance follows severity through DO-178C's design assurance levels:

| Level | Failure condition | Objectives | Structural coverage |
|---|---|---|---|
| A | Catastrophic | 71 | Statement, decision and MC/DC |
| B | Hazardous | 69 | Statement and decision |
| C | Major | 62 | Statement |
| D | Minor | 26 | None |

### Process industry: safety integrity levels

IEC 61508 functional safety, not nuclear or aerospace practice, defines Safety Integrity Levels. For a safety function in low-demand mode:

| SIL | Average probability of failure on demand | Risk reduction |
|---|---|---|
| 1 | 10⁻² to 10⁻¹ | 10–100 |
| 2 | 10⁻³ to 10⁻² | 100–1,000 |
| 3 | 10⁻⁴ to 10⁻³ | 1,000–10,000 |
| 4 | 10⁻⁵ to 10⁻⁴ | 10,000–100,000 |

A sensor, logic solver and final element in series form an OR gate, so their PFDs add. An illustrative SIL 3 allocation: sensor 2 × 10⁻⁴, logic 5 × 10⁻⁵, final element 5 × 10⁻⁴, total 7.5 × 10⁻⁴, inside the band. An allocation that sums to exactly 10⁻³ is SIL 2.

### Automotive: ASIL decomposition

ISO 26262 lets a requirement at one Automotive Safety Integrity Level be split across two sufficiently independent elements at lower levels. The notation X(Y) means an element developed to ASIL X as part of a decomposed ASIL Y requirement. The permitted splits (ISO 26262-9, clause 5; see [Mohan 2019](https://arxiv.org/abs/2001.02496)) are:

| Requirement | Permitted decompositions |
|---|---|
| ASIL D | C(D) + A(D); B(D) + B(D); D(D) + QM(D) |
| ASIL C | B(C) + A(C); C(C) + QM(C) |
| ASIL B | A(B) + A(B); B(B) + QM(B) |
| ASIL A | A(A) + QM(A) |

ASIL C cannot be split into A + A. Decomposition is a statement about development rigor against systematic faults and requires a dependent-failure analysis showing independence. It does not multiply random hardware failure rates, which are bounded separately:

| ASIL | Single-point fault metric | Latent fault metric | Random hardware failure target |
|---|---|---|---|
| D | ≥ 99% | ≥ 90% | < 10⁻⁸ per hour (10 FIT) |
| C | ≥ 97% | ≥ 80% | < 10⁻⁷ per hour (100 FIT) |
| B | ≥ 90% | ≥ 60% | < 10⁻⁷ per hour (100 FIT) |

An AI system decomposed as "ML detector at B(D) plus rule-based check at B(D)" earns the split only if the two fail independently on the inputs that matter, which is the claim [Risk Propagation](/delegation-risk/risk-propagation/) says to assume false until measured. ISO 26262 also covers only malfunctions. Hazards from a correctly functioning but insufficient perception model fall under SOTIF (ISO 21448), AI-specific guidance for road vehicles is ISO/PAS 8800, and UL 4600 (first edition April 2020) sets out safety cases for autonomous products.

## Failures that showed the limits

**Three Mile Island (1979).** A pilot-operated relief valve stuck open. Its control-room indicator showed only that the valve's solenoid was powered, not the valve's position, so operators believed it was closed. The same sequence had occurred about 18 months earlier at Davis-Besse and was not acted on. WASH-1400 (1975) had already judged a small break more likely than a large one and stressed operator response; the accident is usually read as vindicating that analysis. What failed was the use of operating experience and the human-machine interface, not the existence of a probabilistic model.

**Fukushima Daiichi (2011).** The design-basis tsunami was 5.7 m; waves of up to about 14 m overtopped the site. Most emergency diesel generators and switchgear sat in flooded basements, so nominally redundant power failed from one cause. Units interacted: hydrogen from unit 3 most likely reached unit 4 through shared piping, and explosions at one unit damaged equipment needed at another. A beyond-design-basis external event, common-cause failure and multi-unit coupling arrived together.

**Challenger (1986) and Columbia (2003).** Vaughan (1996) called the Challenger pattern the normalization of deviance: O-ring erosion seen on earlier flights was reclassified, flight by flight, as acceptable, and the launch decision conformed to NASA's rules rather than breaking them. The Columbia board, on which Vaughan served, found the same pattern with foam shedding, which was well known and came to be treated as an acceptable risk.

**Boeing 737 MAX (2018–2019).** MCAS took its trigger from one angle-of-attack sensor at a time, so a single sensor fault could command repeated nose-down trim. Certification relied on the FAA's Organization Designation Authorization, under which the manufacturer acts on the regulator's behalf. It is a case of both a single point of failure and delegated verification.

## What transfers

Fault-tree logic, importance measures, explicit common-cause parameters and severity-tiered targets transfer directly; they are arithmetic about whatever probabilities one supplies. Three things do not. Failure-rate databases have no AI equivalent. Random-failure assumptions fit hardware, while AI failures are systematic: the same input fails every copy. And physical separation, the main source of independence in hardware, does nothing for components that share a model.

The standard critique of PRA for software and organizational failure is Leveson's STAMP and its hazard analysis method STPA (*Engineering a Safer World*, MIT Press, 2012). STPA treats accidents as failures of control (unsafe commands, missing feedback, flawed process models) rather than chains of component faults. That framing fits agent scaffolds, where most of the risk sits in what the controller is allowed to command.

## Sources

- FAA Advisory Circular 25.1309-1B, *System Design and Analysis* (30 August 2024); AC 25.1309-1A (1988).
- IAEA INSAG-10, *Defence in Depth in Nuclear Safety* (1996).
- IEC 61508 (functional safety); ISO 26262 (road vehicles functional safety); RTCA DO-178C; SAE ARP 4761.
- NUREG/CR-4780 (common-cause failure procedures).
- Leveson, N. (2012). *Engineering a Safer World*. MIT Press.
- Mohan, N. (2019). *Architecting Safe Automated Driving with Legacy Platforms*. [arXiv:2001.02496](https://arxiv.org/abs/2001.02496).
- Vaughan, D. (1996). *The Challenger Launch Decision*. University of Chicago Press.
- World Nuclear Association, *Safety of Nuclear Power Reactors*.
