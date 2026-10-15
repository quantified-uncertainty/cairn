---
title: "About This Site"
sidebar:
  order: 100
---

## How it was made

This site was drafted quickly in early 2026 by Ozzie Gooen ([QURI](https://quantifieduncertainty.org)) with substantial assistance from large language models, primarily Claude. Read it with that in mind.

## Revisions

**June 2026: hardening.**

- A nine-agent review covered the whole corpus, followed by a fix pass against its findings.
- Flagged fabricated or misattributed citations were removed or corrected. Real-history claims (dates, court cases, nuclear and aviation figures) were checked against secondary sources, mostly Wikipedia plus a few official pages such as nrc.gov. Few were checked against primary documents.
- The propagation math was re-derived, and one canonical worked example replaced several inconsistent ones.
- Hypothetical scenarios were labelled, and a ~25,000-word fiction section was removed.
- Vocabulary was consolidated against a written terminology canon.

**October 2026: audit and contraction.** Model-written audits found that problems remained: retired terms still in use, formulas that contradicted the core one, invented numbers presented as data, citation errors, and examples frozen in 2023. The site was cut from about 300,000 words to roughly 90,000 <!-- TODO(verify): replace with the final word count after the October 2026 integration step -->. Deleted pages redirect to their nearest surviving page, and the surviving core was corrected. The audit reports, with quoted evidence, are in the source repository under `audits/2026-10/`.

## Limitations

- **Little expert review.** Most pages have not been reviewed by domain experts.
- **Illustrative numbers.** Most numbers are illustrative and labelled as such. Where a number is cited, check the source before relying on it; errors of the kind the audits found may remain.
- **Untested.** The framework has not been tested on deployed AI systems. The recommendations are reasoned, not validated.
- **Labelled hypotheticals.** Worked examples and scenarios that are hypothetical are labelled as such.
- **One speculative section.** The [Power Dynamics](/power-dynamics/) page is speculative and marked so.

The parts that seem most robust are borrowed: expected-loss accounting, common-cause failure analysis, least privilege, and AI Control's adversarial methodology. What the site adds is the combination, applied to agent harnesses. Whether that combination earns its keep is an open question.

## How to help

Open an issue on [GitHub](https://github.com/quantified-uncertainty/delegation-risk-framework). The content is licensed CC BY 4.0. The most useful contributions:

- factual and citation corrections;
- logical inconsistencies between pages;
- real incidents, positive or negative;
- measurements of error correlation between checks, which would test the site's central number.

## Acknowledgments

The framework draws on Eric Drexler's CAIS, Redwood Research's AI Control work, and decades of nuclear and financial risk practice. Errors are ours.
