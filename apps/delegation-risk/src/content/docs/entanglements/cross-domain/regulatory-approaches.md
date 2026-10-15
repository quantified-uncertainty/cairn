---
title: "Regulatory Approaches"
description: "What regulation in force by late 2026 does about provider concentration and correlated failure in AI, what it borrows from finance, aviation and nuclear safety, and which options remain open."
sidebar:
  order: 20
---

Correlated failure across AI deployments is an externality. Each deployer picks the best available model and checks; nobody bears the cost of everyone failing together ([Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/)). Regulation is one response. This page describes the position as of October 2026.

## In force or enacted

**EU AI Act: general-purpose models.** Obligations for providers of general-purpose AI models have applied since 2 August 2025; models already on the market by then have until 2 August 2027. A model trained with more than 10²⁵ floating-point operations is presumed to pose systemic risk; the presumption is rebuttable, and the Commission can also designate models. Providers of those models must evaluate them, including adversarial testing, assess and mitigate systemic risks, track and report serious incidents to the AI Office, and maintain cybersecurity (Article 55). The General-Purpose AI Code of Practice, published in July 2025, is the voluntary route the Commission recognizes for showing compliance. Since 2 August 2026 the AI Office can enforce these duties, including by fines ([European Commission](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)). This is a systemic-importance regime aimed at the models many others build on. It does not limit concentration or require diversity among deployers.

**EU AI Act: high-risk systems and Article 73.** Article 73 requires providers of high-risk AI systems to report serious incidents to market-surveillance authorities: within 15 days of becoming aware, 10 days if a person died, and 2 days for a widespread infringement or a serious disruption of critical infrastructure. The high-risk obligations were due to apply from 2 August 2026. The AI Omnibus, Regulation (EU) 2026/1744, agreed on 7 May 2026 and in force since 27 July 2026, deferred them to 2 December 2027 for the stand-alone use cases in Annex III (including critical infrastructure, employment and credit) and to 2 August 2028 for AI in products covered by Annex I ([European Commission](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)). It left the general-purpose model obligations unchanged. <!-- TODO(verify): whether Article 73 applies to any system before the deferred high-risk dates; secondary sources conflict and the Official Journal text could not be retrieved. -->

**EU Digital Operational Resilience Act (DORA).** Applicable since 17 January 2025. EU financial entities must manage ICT third-party risk, including concentration risk, and keep a register of their ICT contracts. The European Supervisory Authorities directly oversee providers designated as critical. On 18 November 2025 they [designated 19](https://www.eiopa.europa.eu/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital-2025-11-18_en), mostly cloud, data-centre, data and IT-services firms, among them AWS, Google Cloud, Microsoft, Oracle and SAP. This is concentration oversight already working, applied to the infrastructure AI deployments run on. It does not yet reach model providers as such.

**UK critical third parties regime.** Rules from the Bank of England, PRA and FCA took effect on 1 January 2025. They apply to a provider once HM Treasury designates it as critical to the UK financial system. The first four designations, effective 13 July 2026, were Microsoft, Google Cloud, AWS and Oracle ([HM Treasury](https://www.gov.uk/government/news/uk-financial-system-strengthened-with-new-safeguards-for-major-technology-providers)).

**California SB 53, the Transparency in Frontier Artificial Intelligence Act.** Signed on 29 September 2025 and in effect since 1 January 2026. Developers of models trained with more than 10²⁶ operations must report critical safety incidents to the state Office of Emergency Services within 15 days of discovery. Where an incident poses imminent danger of death or serious injury, they must tell an appropriate law-enforcement or public-safety authority within 24 hours. Developers with annual revenue above \$500 million must also publish a frontier AI framework describing how they assess and mitigate catastrophic risk. The act protects whistleblowers and carries civil penalties of up to \$1 million per violation ([Future of Privacy Forum](https://fpf.org/blog/californias-sb-53-the-first-frontier-ai-law-explained/)).

**New York RAISE Act.** Signed in December 2025 and amended by agreement in March 2026 to align largely with SB 53, it takes effect in 2027. It uses the same compute and revenue thresholds, requires incident reports to a new office in the Department of Financial Services within 72 hours, and sets penalties of up to \$1 million for a first violation and \$3 million for later ones ([MultiState](https://www.multistate.ai/updates-subscriber/vol-83-new-york-ai-safety-law-raise-act)).

**US federal.** Executive Order 14110 (October 2023) was revoked by Executive Order 14148 on 20 January 2025, and EO 14179 ordered a review of actions taken under it. Executive Order 14365 (11 December 2025) set up a Justice Department task force to challenge state AI laws that conflict with federal policy; it does not itself invalidate them. A White House framework of 20 March 2026 asked Congress to preempt state AI laws but is non-binding ([Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/03/white-house-releases-a-national-policy-framework-for-artificial)). As of October 2026 no federal statute addresses frontier models or provider concentration, and the state laws above remain in force.

**Bank model risk.** US banks' use of models, including vendor models, was supervised from 2011 under interagency model-risk guidance: SR 11-7 from the Federal Reserve, issued with OCC Bulletin 2011-12. On 17 April 2026 the Federal Reserve, OCC and FDIC replaced it with SR 26-2 ([Federal Reserve](https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm)). The new guidance keeps a section on validating vendor and other third-party models, but it explicitly excludes generative and agentic AI models from its scope as "novel and rapidly evolving", leaving them to banks' general risk governance.

## What older safety regimes already do

- **Aviation.** Certification requires that no single failure lead to a catastrophic outcome and that common-cause failures be analyzed (AC 25.1309 and ARP4754A). Dissimilar redundancy (different hardware, software or teams in redundant channels) is a design practice that the guidance credits, not a blanket FAA mandate, and manufacturers have made different choices about how much software diversity to use.
- **Nuclear.** The NRC's single-failure criterion requires safety functions to survive any single failure. For digital instrumentation and control, NRC policy (SRM-SECY-93-087) treats software as susceptible to common-cause failure and expects applicants to assess defense in depth and diversity against it; staff review that assessment under Branch Technical Position 7-19. This is the closest existing precedent for a diversity requirement on checks.
- **Banking.** Large-exposure limits and stress tests address concentration and correlation in balance sheets. The Basel standards are not a treaty: the Basel Committee's standards have no legal force and apply only as national regulators implement them.

## Options not yet in force

| Option | Existing precedent | Main difficulty |
|---|---|---|
| Disclosure of model dependencies | DORA's register of ICT contracts | Defining a "provider" across fine-tunes, resellers and embedded models |
| Correlation stress tests for safety-critical checks | Bank stress tests | No agreed measure; tests invite optimization against the test |
| Diversity requirements for safety-critical checks | NRC diversity assessments; aviation dissimilarity | Defining "different method" so that it means lower correlation |
| Concentration limits for critical functions | Bank large-exposure limits | May force use of weaker models; hard to enforce through supply chains |
| Systemic designation of model providers | EU systemic-risk models; DORA critical providers; systemically important banks | Can entrench the designated firms |
| Portability requirements | Data-portability rules | Models differ in behavior, so switching changes outputs |

Each of these regulates the provider or deployer. None makes two models' errors less correlated by itself. The measurable quantity a regulator would need, the correlation of misses between checks on harmful actions, is the same one the site asks deployers to estimate ([Measuring Entanglement](/entanglements/detection/correlation-calculator/)), and no standard method for it exists yet.

## For deployers

- **Keep a register of model dependencies,** including embeddings, guard models and monitoring tools. EU financial entities already keep the infrastructure version under DORA.
- **Measure and document the correlation of your checks,** separately for benign and adversarial inputs, and record the correlation budget you work to.
- **Keep a tested path to a second provider** for critical functions.
- **Know which incident-reporting duties apply.** Providers of systemic-risk models under the AI Act and frontier developers under SB 53 and the RAISE Act already have reporting obligations; providers and deployers of high-risk systems under the AI Act will from December 2027. Expect upstream providers to ask for incident data.
- **Check your liability policies for AI exclusions.** Private insurers are moving faster than regulators on correlated AI loss, mostly by excluding it ([The Insurer's Dilemma](/delegation-risk/insurers-dilemma/#ai-liability-insurance)).

## See also

- [Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/)
- [Lessons from human oversight institutions](/entanglements/case-studies/historical-cases/)
- [Solutions](/entanglements/mitigation/solutions/)
- [The Insurer's Dilemma](/delegation-risk/insurers-dilemma/): how insurers price, or exclude, correlated AI loss
