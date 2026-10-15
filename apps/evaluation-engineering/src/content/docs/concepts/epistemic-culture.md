---
title: Epistemic Culture
description: How evaluation systems fare once the evaluated push back — documented backlash and exit cases, the candidness problem, and what they suggest about rollout.
---

*Status: draft, rebuilt October 2026. The cases are documented; the lessons drawn from them are this wiki's reading, and the rollout advice is conjecture.*

## The claim

An evaluation system pointed at people or organizations changes the behaviour of the evaluated, and some of that change is aimed at the system itself: lawsuits, boycotts, lobbying, refusal to supply data, or quiet self-censorship by the evaluators. The 2021–22 notes called this the cultural constraint and guessed it might bind harder than any technical one ([crux 10](/start-here/key-questions/#on-the-environment)). The cases below do not settle that guess. They show what the pushback looks like and which designs attracted it.

## Cases

**Ofsted's single-word grades.** England's school inspectorate summarized each inspection in one headline word, from "outstanding" to "inadequate". In December 2023 a coroner recorded that the death of headteacher Ruth Perry was "suicide, contributed to by an Ofsted inspection carried out in November 2022", and warned that the system let a school with fixable safeguarding problems receive the same overall label as one inadequate in every area ([prevention of future deaths report](https://www.judiciary.uk/prevention-of-future-death-reports/ruth-perry-prevention-of-future-deaths-report/)). The government removed single headline grades for state schools in September 2024 ([DfE](https://www.gov.uk/government/news/single-headline-ofsted-grades-scrapped-in-landmark-school-reform)). Ofsted's replacement report cards grade each area separately on a five-point scale and give no overall judgement ([Ofsted guidance](https://www.gov.uk/guidance/understanding-ofsted-report-cards-and-grades)). The evaluation survived; its most compressed output did not.

**The US News law-school boycott.** In November 2022 Yale Law School, ranked first since the rankings began, withdrew from the US News rankings, calling the methodology "profoundly flawed"; Harvard Law School followed the same day ([Bloomberg](https://www.bloomberg.com/news/articles/2022-11-16/yale-law-school-drops-u-s-news-rankings-over-profound-flaws)). Rankings depend partly on data the ranked institutions supply, so the evaluated could exit. Their stated objection was that the formula rewarded behaviour they considered harmful, the reactivity documented in [Patterns §1](/concepts/patterns-and-failure-modes/).

**Charity overhead ratios.** For years donors judged charities by the share of spending on administration and fundraising, and evaluators published the ratio. In 2013 the heads of GuideStar, Charity Navigator and the BBB Wise Giving Alliance wrote to donors that overhead "is a poor measure of a charity's performance" and that "many charities should spend more on overhead" ([open letter](https://nonprofitquarterly.org/2013/06/17/the-overhead-myth/)). Here the evaluators themselves retracted a cheap metric after it had shaped what charities did.

**GiveWell's mistakes page.** The counter-example is an evaluator that made admitting error part of its product. GiveWell keeps a public log of [its mistakes](https://www.givewell.org/about/our-mistakes) in research, grantmaking and operations. It publishes about itself the kind of candid negative assessment it asks of others.

**Internal prediction markets.** A 2021 report on why companies rarely adopt internal prediction markets ([Sempere, Yagudin & Lifland](https://forum.effectivealtruism.org/posts/dQhjwHA7LhfE8YpYF)) lists social disruptiveness among the likely reasons, alongside poor tooling and the difficulty of writing good questions. A market that surfaces bad news about a team is unwelcome to the people it exposes. This is the candidness problem inside one organization.

Capture is a different failure from backlash and is covered under [institutional design variables](/concepts/the-systems-view/#technical-and-institutional-design-variables): the World Bank's *Doing Business* index was discontinued in 2021 after data irregularities in two editions ([World Bank](https://www.worldbank.org/en/news/statement/2021/09/16/world-bank-group-to-discontinue-doing-business-report)).

## What the cases suggest

- **Compression draws the fire.** Ofsted's detailed findings were not what was abolished; the single word was. The coarser and more consequential the published output, the stronger the pushback. That is a direct cost of the cheap, standardized outputs this wiki otherwise favours ([lesson 5 of the catalogue](/concepts/evaluation-systems-in-the-wild/)).
- **Exit is available when the evaluated supply the inputs.** A system that depends on the cooperation of those it rates can be boycotted. One that gathers its own data (product testers that buy their own units) cannot, which is part of why [funding and data independence](/concepts/the-systems-view/#technical-and-institutional-design-variables) matter.
- **A metric that steers behaviour badly will eventually be disowned**, sometimes by its own publishers. Robustness under optimization is a legitimacy property as well as an accuracy property.
- **Candidness is easier to demand of others than to practise.** Public error logs are rare. An evaluator that wants candid inputs has a stronger case if it is candid about itself.

## The candidness problem

The 2021–22 notes stated the general mechanism with a hypothetical: under certificates of impact, an organization watched by funders would issue certificates only for its best work, because a mediocre rating had become a liability. Once an evaluation matters to the evaluated, their incentive to be open with the evaluator falls. The internal-markets case is an observed instance. LLM evaluators do not remove this; they make it cheaper to produce the unwelcome assessment and so may bring the pushback sooner ([LLMs as Evaluators](/concepts/llm-evaluators/#what-llms-do-not-fix)).

## Rollout

The notes' thought experiment: an agency that published decent estimates of the impact of every politician, bill and organization would attract lawsuits and political pressure and might be shut down or captured before it stabilized. Their proposed answer, untested, is sequencing: start with private or commissioned evaluations at low stakes, publish more as norms and track records develop, and test in small willing communities first.

Law now constrains the end state. In the EU, AI systems used to evaluate learning outcomes, job candidates or creditworthiness are classed as high-risk ([AI Act Annex III](https://artificialintelligenceact.eu/annex/3/)); a 2026 amendment moved the start of those obligations to December 2027 ([Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)). Separately, the GDPR gives people a right not to be subject to decisions with legal or similarly significant effects based solely on automated processing ([Art. 22](https://gdpr-info.eu/art-22-gdpr/)). A high-throughput evaluator of people needs a human in the decision and an appeal route, which are the institutional variables again.

The sibling RRP wiki's material on [identity and track records](https://reasoning-processes.quantifieduncertainty.org/environment/identity-and-track-records/) covers the related question of how evaluators earn trust over time.
