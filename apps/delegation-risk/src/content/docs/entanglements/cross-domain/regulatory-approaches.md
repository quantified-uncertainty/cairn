---
title: "Regulatory Approaches"
description: "What regulation in force by late 2026 does about provider concentration and correlated failure in AI, what it borrows from finance, aviation and nuclear safety, and which options remain open."
sidebar:
  order: 20
---

Correlated failure across AI deployments is an externality. Each deployer picks the best available model and checks; nobody bears the cost of everyone failing together ([Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/)). Regulation is one response. This page describes the position as of October 2026. An earlier version presented the 2023 US Executive Order as current and missed most of the regimes below.

## In force or enacted

**EU AI Act: general-purpose models.** Obligations for providers of general-purpose AI models have applied since 2 August 2025. A model trained with more than 10²⁵ floating-point operations is presumed to pose systemic risk; the presumption is rebuttable, and the Commission can also designate models. Providers of those models must evaluate them, including adversarial testing, assess and mitigate systemic risks, track and report serious incidents, and maintain cybersecurity (Article 55). The General-Purpose AI Code of Practice, published on 10 July 2025, is the voluntary route the Commission recognizes for showing compliance, and the Commission's fining powers apply from 2 August 2026 ([European Commission](https://digital-strategy.ec.europa.eu/en/factpages/general-purpose-ai-obligations-under-ai-act)). This is a systemic-importance regime aimed at the models many others build on. It does not limit concentration or require diversity among deployers.

Obligations for high-risk systems, including serious-incident reporting under Article 73, were due to follow from August 2026. In May 2026 the EU institutions reached a provisional agreement on a "Digital Omnibus" that defers them, to December 2027 for stand-alone high-risk systems. <!-- TODO(verify): formal adoption and publication of the AI Omnibus in the Official Journal, and whether Article 73 timing changed. -->

**EU Digital Operational Resilience Act (DORA).** Applicable since 17 January 2025. EU financial entities must manage ICT third-party risk, including concentration risk, and keep a register of their ICT contracts. The European Supervisory Authorities directly oversee providers designated as critical: on 18 November 2025 they designated 19, among them AWS, Google Cloud and Microsoft. This is the concentration-oversight idea already working, applied to the infrastructure AI deployments run on.

**UK critical third parties regime.** Rules from the Bank of England, PRA and FCA took effect on 1 January 2025. They apply to a provider once HM Treasury designates it as critical to the UK financial system.

**California SB 53, the Transparency in Frontier Artificial Intelligence Act.** Signed on 29 September 2025, with most provisions effective from 1 January 2026. Developers of models trained with more than 10²⁶ operations must report critical safety incidents to the state Office of Emergency Services within 15 days, or 24 hours where there is imminent danger of death or serious injury. Developers with annual revenue above \$500 million must also publish a frontier AI framework describing how they assess and mitigate catastrophic risk. The act protects whistleblowers and carries civil penalties of up to \$1 million per violation ([Future of Privacy Forum](https://fpf.org/blog/californias-sb-53-the-first-frontier-ai-law-explained/)).

**US federal.** Executive Order 14110 (October 2023) was revoked by Executive Order 14148 on 20 January 2025, and EO 14179 ordered a review of actions taken under it. Executive Order 14365 (11 December 2025) directs federal agencies to challenge state AI laws that conflict with federal policy; it does not itself invalidate them. No federal statute addresses frontier-model concentration.

**Bank model risk.** US banks' use of models, including vendor models, has been supervised under interagency model-risk guidance since 2011: SR 11-7 from the Federal Reserve, issued with OCC Bulletin 2011-12. On 17 April 2026 the Federal Reserve, OCC and FDIC replaced it with SR 26-2, which keeps a section on vendor and other third-party products ([Federal Reserve](https://www.federalreserve.gov/supervisionreg/srletters/SR2602.htm)).

## What older safety regimes already do

- **Aviation.** Certification requires that no single failure lead to a catastrophic outcome and that common-cause failures be analyzed (AC 25.1309 and ARP4754A). Dissimilar redundancy (different hardware, software or teams in redundant channels) is a design practice that the guidance credits, not a blanket FAA mandate, and manufacturers have made different choices about how much software diversity to use. An earlier version of this page said the FAA requires diverse software; it does not.
- **Nuclear.** The NRC's single-failure criterion requires safety functions to survive any single failure. For digital instrumentation and control, NRC policy (SRM-SECY-93-087) treats software as susceptible to common-cause failure and expects applicants to assess defense in depth and diversity against it; staff review that assessment under Branch Technical Position 7-19. This is the closest existing precedent for a diversity requirement on checks.
- **Banking.** Large-exposure limits and stress tests address concentration and correlation in balance sheets. The Basel standards are not a treaty: the Basel Committee's standards have no legal force and apply only as national regulators implement them. An earlier version of this page listed "Treaty: Basel Accords" as precedent.

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
- **Know which incident-reporting duties apply.** Providers of systemic-risk models under the AI Act and frontier developers under SB 53 have reporting obligations, and their deployers will be asked for incident data.

## See also

- [Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/)
- [Lessons from human oversight institutions](/entanglements/case-studies/historical-cases/)
- [Solutions](/entanglements/mitigation/solutions/)
