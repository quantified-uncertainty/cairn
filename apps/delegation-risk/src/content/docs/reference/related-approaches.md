---
title: "Relationship to Existing Approaches"
description: "Where delegation engineering sits relative to AI Control, frontier safety frameworks, FAIR, safety cases, agent-security patterns, scalable oversight, insurance and principal–agent theory, and what it actually adds."
---

Most of this framework is borrowed: expected-loss accounting from risk management and insurance, the propagation correction from reliability engineering's beta-factor model, the adversarial methodology from AI Control, and least privilege from security engineering. This page says where each neighbour sits and what this site adds, limited to what its pages actually show. For several neighbours the honest answer is "little".

## Positioning

| Approach | What it does | What this framework adds | Relationship |
|---|---|---|---|
| **AI Control** | Protocols that stay safe if the model is deliberately subverting them, evaluated quantitatively on safety–usefulness curves under an auditing budget | An accounting layer around the protocols. It extends to the accident and hijack channels, which Control sets aside, and adds a correlation budget across checks. The adversarial methodology is not added: it is borrowed | Highly complementary |
| **Frontier safety frameworks** (Anthropic RSP, OpenAI Preparedness, Google DeepMind FSF) | Capability thresholds and risk reports that tie required safeguards to a model before and during deployment | A deployment-time view: per-delegate, per-action accounting inside one operator's agent system | Different layer; complementary |
| **EU GPAI Code of Practice** | A voluntary code (July 2025) for meeting the AI Act's obligations on general-purpose models; its Safety and Security chapter applies to systemic-risk models | Little. The code binds model providers, not the operators who deploy agents on their models | Upstream of this framework |
| **NIST AI RMF** | Voluntary guidance (2023; generative-AI profile 2024) organized as Govern, Map, Measure, Manage | A concrete metric for "Measure" when the system is a delegation structure; the RMF prescribes none | Fits inside it |
| **FAIR** | Quantitative information-risk analysis: loss event frequency × loss magnitude in money, estimated as ranges and simulated | Delegation structure (who delegates to whom), composition of checks with correlation, and runtime accounting. FAIR's ranges and Monte Carlo are ahead of most of this site's point estimates | Closest precedent for Σ P × D in dollars |
| **Safety cases** | Structured arguments that a system is safe enough to deploy | Quantitative inputs a safety case could cite, and a reconciled ledger as post-deployment evidence | Complementary |
| **Guaranteed Safe AI** | A world model, a safety specification, and a verifier producing an auditable proof certificate | Probabilistic budgets where proofs are out of reach. The exposure envelope is the small part that can be specified and verified | Complementary; proofs for the envelope, budgets for the rest |
| **CaMeL and agent-security patterns** | Defenses against prompt injection built into the system design, and rules such as the lethal trifecta and the Agents Rule of Two | Accounting around these defenses, not a better defense. They are the best current answer to the hijack channel and the closest prior art for the envelope | Use them |
| **Common-cause failure analysis** | The beta-factor model of redundant components failing together | Applying it to stacks of AI checks, plus a phi-scale estimation recipe | Same math |
| **CAIS** | General capability built as a system of bounded services | Accepts agentic coordinators and adds accounting | Shares the decomposition intuition |
| **AI liability insurance** | Prices, excludes or audits AI risk for policyholders | An expected-loss estimate an underwriter could use. Insurers' exclusions are evidence of how hard that estimate is | A future customer for the numbers |
| **Principal–agent theory** | Agency costs, moral hazard, monitoring, multitask incentives | Applies the results to AI delegates, which lack wealth, a known utility and independence across copies | Source of the vocabulary and of the case for constraints over incentives |

## AI Control

Greenblatt et al. ([arXiv:2312.06942](https://arxiv.org/abs/2312.06942); ICML 2024) study protocols that use an untrusted strong model, a trusted weaker model and a limited budget of trusted human labor. In their setting, that budget covers 2% of problems. The work is explicitly quantitative: protocols are compared on safety and usefulness, measured against a red team that plays the scheming model. The line has since moved to agents:

- **Ctrl-Z** (Bhatt et al. 2025, [arXiv:2504.10374](https://arxiv.org/abs/2504.10374)) ran the first control evaluation in an agent environment. Its best resampling protocol cut attack success from 58% to 7% at a 5% cost to a benign agent's performance.
- **AI Control Levels** (Korbak et al. 2025, [arXiv:2504.05259](https://arxiv.org/abs/2504.05259)) scale red-team affordances to a model's capabilities.
- **A control safety case sketch** (Korbak et al. 2025, [arXiv:2501.17315](https://arxiv.org/abs/2501.17315)) argues from a control evaluation to a deployment decision.
- **Factor(T,U)** (Sandoval & Rushing 2025, [arXiv:2512.02157](https://arxiv.org/abs/2512.02157)) found that adding factored cognition to trusted monitoring raised safety from 41% to 63% in the APPS setting. The same paper reports that factoring made backdoors no harder to write, and that its protocols had low usefulness.

**Mapping the vocabularies.** Control's *auditing budget* limits how many actions humans can inspect. This site's *risk budget* limits tolerated expected loss. They are related but not equivalent. Control's tradeoff term is *usefulness cost*; "control tax" is not Redwood's term.

Control's stated scope is the defection channel, especially concentrated failures. A model that behaves well under evaluation in order to be deployed is the case where every pre-deployment estimate of P(defection) is unreliable. In the literature this is *deceptive alignment* (Hubinger et al. 2019, [arXiv:1906.01820](https://arxiv.org/abs/1906.01820)); alignment faking has been demonstrated experimentally (Greenblatt et al. 2024, [arXiv:2412.14093](https://arxiv.org/abs/2412.14093)). This framework's answer to that case is not a better estimate. It is the envelope, which bounds damage regardless of intent, together with Control's runtime protocols.

**Combining them.** The natural deployment combines a modular architecture, Control protocols on untrusted components, and per-delegate budgets with an envelope. Do not multiply these layers' failure rates as if independent: they share blind spots when they share a model, and a scheming component picks its moment. Measure the combination with a control evaluation.

## Frontier safety frameworks and regulation

Anthropic's Responsible Scaling Policy, OpenAI's Preparedness Framework (version 2, April 2025) and Google DeepMind's Frontier Safety Framework (first published May 2024, revised in 2025) each tie capability thresholds to required safeguards. Anthropic activated ASL-3 protections with the release of Claude Opus 4 in May 2025. Its [RSP version 3](https://www.anthropic.com/news/responsible-scaling-policy-v3) (February 2026) adds public Frontier Safety Roadmaps and Risk Reports every three to six months, and says pre-set capability levels had proved "far more ambiguous than we anticipated". METR's time-horizon measurements (Kwa et al. 2025, [arXiv:2503.14499](https://arxiv.org/abs/2503.14499)), which found the length of tasks frontier models complete at 50% success doubling about every seven months since 2019, are a common capability input to these frameworks. The frameworks govern models; this site is about how an operator deploys agents built on them.

The EU's General-Purpose AI Code of Practice was published on 10 July 2025, with chapters on transparency, copyright, and safety and security. The AI Act's obligations for general-purpose model providers applied from 2 August 2025, and the Commission's enforcement powers from 2 August 2026 ([Commission guidance](https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers)). California's SB 53, signed on 29 September 2025, requires large frontier developers to publish a safety framework and creates a channel for reporting critical safety incidents to the state's Office of Emergency Services ([announcement](https://www.gov.ca.gov/2025/09/29/governor-newsom-signs-sb-53-advancing-californias-world-leading-artificial-intelligence-industry/)). NIST's AI Risk Management Framework (January 2023) and its generative-AI profile, NIST AI 600-1 (July 2024), are voluntary guidance. The code and SB 53 bind developers of models, so an operator building agents on those models sits downstream of both. The RMF does not prescribe a metric. A delegation-risk estimate could serve as one input to its "Measure" function, but no regulator has endorsed one.

## Quantitative risk analysis: FAIR

FAIR (published by The Open Group as the Open FAIR risk taxonomy and risk analysis standards) expresses information risk as the frequency and magnitude of loss in money. It estimates each factor as a calibrated range and simulates the result. That is the obvious precedent for "Σ P × Damage in dollars", and its practice of ranges plus simulation is better than the point estimates on many pages of this site. What FAIR does not model is delegation structure: chains of delegates, stacks of checks with correlated misses, and the per-action accounting a harness could keep.

## Safety cases and Guaranteed Safe AI

A safety case is a structured argument that a system is unlikely to cause a catastrophe; Clymer et al. (2024, [arXiv:2403.10462](https://arxiv.org/abs/2403.10462)) group the arguments as inability, control, trustworthiness and deference. Delegation-risk estimates and a reconciled ledger are evidence such an argument could cite.

Guaranteed Safe AI (Dalrymple et al. 2024, [arXiv:2405.06624](https://arxiv.org/abs/2405.06624)) asks for a world model, a safety specification and a verifier that produces an auditable proof certificate. The stronger claim that provable safety is the only path to controllable AGI comes from Tegmark & Omohundro (2023, [arXiv:2309.01933](https://arxiv.org/abs/2309.01933)). Full specifications for open-ended agent behavior are out of reach today. The exposure envelope (file scope, egress, spend) is the part small enough to specify and verify, which is why it sits at the top of the [verifiability hierarchy](/getting-started/core-concepts/#verifiability-hierarchy).

## Agent security: CaMeL and design patterns

CaMeL (Debenedetti et al. 2025, [arXiv:2503.18813](https://arxiv.org/abs/2503.18813)) extracts the control and data flows from the trusted user query, so that untrusted data the model later retrieves cannot change which tools are called. It enforces capability-based policies on tool calls to stop exfiltration. On the AgentDojo benchmark it solved 77% of tasks with provable security, against 84% for an undefended system. Beurer-Kellner et al. (2025, [arXiv:2506.08837](https://arxiv.org/abs/2506.08837)) give a set of design patterns for agents with provable resistance to prompt injection and analyse their utility trade-offs. Two simpler rules state the same idea as a constraint on capabilities. Willison's [lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/) (June 2025) is access to private data, exposure to untrusted content, and the ability to communicate externally. Meta's [Agents Rule of Two](https://ai.meta.com/blog/practical-ai-agent-security/) (October 2025) says an agent should have at most two of three properties in a session: processing untrustworthy inputs, access to sensitive systems or private data, and changing state or communicating externally. The case for design over filtering is empirical. Nasr et al. (2025, [arXiv:2510.09023](https://arxiv.org/abs/2510.09023)) bypassed 12 published jailbreak and prompt-injection defenses with adaptive attacks, most at success rates above 90%, although most had originally reported near-zero attack success.

These are the strongest current defenses for the hijack channel; this site's patterns that separate context from capability apply them. The framework's contribution is to price what remains: the exposure an agent keeps after such a design, and how correlated its remaining checks are.

## Reliability engineering: common-cause failure

The closest prior art for the entanglement tax is common-cause failure analysis. The beta-factor model and its successors are documented in NUREG/CR-4780 (Mosleh et al. 1988). Knight & Leveson (1986) showed the same effect in software: independently written versions of one program failed together more often than independence predicts.

The propagation rule used across this site, (1−ρ)·∏pᵢ + ρ·min pᵢ, *is* the beta-factor mixture. What [Risk Propagation](/delegation-risk/risk-propagation/) adds is narrow:

- applying the mixture to stacks of AI checks;
- the observation that correlation biases serial chains and parallel checks in opposite directions;
- a recipe for estimating ρ on the failure-indicator scale.

AI delegation also has failure modes that CCF analysis does not model. One component can create the common cause, for example by biasing what downstream checks see. And components can scheme or collude. The site does not yet model either quantitatively. Its operating rule is to treat any channel an adversary can probe as fully correlated (ρ near 1) unless a control evaluation shows otherwise ([research connections](/entanglements/research/research-connections/)).

## CAIS

Drexler's *Reframing Superintelligence* ([report](https://www.futureofhumanityinstitute.org/s/2019-1.pdf), 2019) argues that general capability can be delivered as a system of bounded services, with agents as one class of service and broader systems coordinating narrower ones. It is sometimes summarized as "train a new narrow model from scratch for each task". That is wrong: the report argues that components are best learned with cross-task generality and reused or fine-tuned. Deployment has since moved toward general agents, as Gwern ([2016](https://gwern.net/tool-ai)) predicted on economic grounds; this framework accepts agentic coordinators and tries to bound them.

## Training-time oversight: IDA, debate, weak-to-strong

These methods aim to make an overseer's judgments better. Iterated amplification (Christiano et al. 2018, [arXiv:1810.08575](https://arxiv.org/abs/1810.08575)) and debate (Irving, Christiano & Amodei 2018, [arXiv:1805.00899](https://arxiv.org/abs/1805.00899), written at OpenAI) are proposals of this kind. There is empirical work on debate. Khan et al. (2024, [arXiv:2402.06782](https://arxiv.org/abs/2402.06782)) found that it raised non-expert accuracy to 76% for models and 88% for humans, against naive baselines of 48% and 60%. Kenton et al. (2024, [arXiv:2407.04622](https://arxiv.org/abs/2407.04622)) found debate beat consultancy across tasks but had mixed results against direct question-answering. Weak-to-strong generalization (Burns et al. 2023, [arXiv:2312.09390](https://arxiv.org/abs/2312.09390)) found that weakly supervised strong models outperform their supervisors but fall well short of their full capability. Engels et al. (2025, [arXiv:2504.18530](https://arxiv.org/abs/2504.18530)) model oversight as a game between players of mismatched capability. For nested oversight across a general Elo gap of 400 they estimate success rates of 13.5% for Mafia, 51.7% for Debate, 10.0% for Backdoor Code and 9.4% for Wargames, falling further against stronger systems.

This framework treats any overseer as a check with a miss rate, and asks how correlated that miss rate is with the failures it oversees. Goel et al. (2025, [arXiv:2502.04313](https://arxiv.org/abs/2502.04313)) report that model mistakes grow more similar as capability increases, which would raise that correlation.

## Insurance

Insurers are the market most likely to price delegation risk in dollars, and since 2025 they have begun to. Specialist carriers now write affirmative AI liability cover, sometimes tied to an audit standard such as AIUC-1 ([Insurance Journal, July 2025](https://amp.insurancejournal.com/news/national/2025/07/25/833169.htm)). General insurers have moved the other way: Verisk's ISO program issued optional generative-AI exclusions for US commercial general liability policies with a January 2026 edition date ([Independent Agent](https://www.independentagent.com/vu_resource/verisk-to-roll-out-new-general-liability-exclusions-for-generative-ai-exposures/)). [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/) covers the market and the moral-hazard and adverse-selection problems it faces. A premium is not a delegation-risk estimate, since it includes loadings for expenses, capital and ambiguity, but a market that audits before it insures is the kind of reconciliation this framework asks for.

## Principal–agent theory

The vocabulary is economics': agency cost (Jensen & Meckling 1976), moral hazard and the informativeness of monitoring signals (Holmström 1979), and the multitask result that constraints substitute for incentives when performance is hard to measure (Holmström & Milgrom 1991). Delegation risk is roughly the residual-loss part of an agency cost, a disposition to defect is closer to a hidden type than a hidden action, a check is a monitoring signal, and an exposure envelope is a delegation set in the sense of Alonso & Matouschek (2008). AI delegates have no wealth, no known utility function and no independence across copies, so incentives bind the operators and vendors around a model, not the model. [Principal–Agent Foundations](/research/principal-agent-foundations/) works through the correspondence and where it breaks.

## What this framework does not claim

- That it is the first to compose risks across AI systems, or that its coordinator constraints are formally verified. Earlier versions of this site claimed both, and neither is shown on the site.
- That architecture reduces the probability of scheming. Decomposition limits what a schemer can reach; whether it changes propensity is untested.
- That its numbers are calibrated. Most are illustrative; see [About This Site](/reference/about-this-site/).
