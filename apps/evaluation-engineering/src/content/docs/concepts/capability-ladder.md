---
title: The Capability Ladder
description: Five rungs for grading an evaluation system, each defined by a test it must pass (standardized, measured, monitored, gaming-tested, accountable), with eight real systems graded against them.
---

*Status: draft v0, October 2026. The rungs are this wiki's proposal. The placements are judgments from public documentation and will be wrong wherever a system measures more internally than it publishes.*

Driving automation has graded levels; evaluation has no shared way to say how far a system has got. This page proposes one. Each rung is defined by something the system must be able to measure or do, so a grade can be checked rather than asserted. The unit being graded is the standing system, not a single evaluation ([Evaluation as a System](/concepts/the-systems-view/)).

## The rungs

| Rung | Name | The system can… | Test |
|---|---|---|---|
| 0 | Ad hoc | produce judgments | none: each judgment is made its own way |
| 1 | Standardized | apply one written procedure and output scale to every item, and keep records | two items judged a year apart sit on the same scale and trace to the rubric version used |
| 2 | Measured | state its error on a defined population, with an interval | it publishes chance-corrected agreement with independent raters, alongside the rater–rater baseline, or a proper-score track record against resolved outcomes |
| 3 | Monitored | re-measure that error in operation and notice when it moves | a standing audit stream on random or hidden items; every accuracy figure carries a date and version; re-validation triggers are declared in advance |
| 4 | Gaming-tested | state its error under deliberate attempts to fool it | an attack suite or red team has been run against it, success rates are reported, and detected gaming is penalized |
| 5 | Accountable | be checked and contested by parties it does not control | independent audit of the whole system; disclosed payer and conflicts; an appeal route for the evaluated whose outcomes feed back into measurement |

A system's grade is the highest rung whose test it passes together with every rung below. The ordering is a claim about dependence: drift (3) cannot be detected without a measured baseline (2), and the cost of an attack (4) cannot be stated without the unattacked error. Rung 5 is institutional rather than technical, and real systems often acquire it out of order. A jagged profile is information, not a grading error. An externally examined system that fails under gaming is the profile of credit ratings in 2008.

The ladder does not grade whether the question is worth asking, or cost. A rung-4 system can be too expensive to run ([the design space](/concepts/the-systems-view/#the-design-space)). The methods behind rungs 2–4 are in [Measuring an Evaluator](/concepts/measuring-an-evaluator/); the operational steps are in the [Launch Checklist](/concepts/launch-checklist/).

## Eight systems graded

✓ passes, ~ partial, ✗ fails or absent, ? not publicly documented.

| System | 1 | 2 | 3 | 4 | 5 | Grade |
|---|---|---|---|---|---|---|
| Journal and grant peer review | ✓ | ~ | ✗ | ✗ | ~ | 1 |
| Cochrane systematic reviews | ✓ | ~ | ? | ? | ~ | 1 |
| Credit ratings (US NRSROs) | ✓ | ✓ | ~ | ✗ | ✓ | 2 |
| LMArena | ✓ | ✓ | ? | ✗ | ~ | 2 |
| Community Notes (X) | ✓ | ~ | ? | ✓ | ~ | 1–2 |
| METR capability evaluations | ✓ | ✓ | ? | ✓ | ~ | 2–4 |
| Metaculus | ✓ | ✓ | ✓ | ? | ~ | 3 |
| GRE essay scoring (e-rater plus human) | ✓ | ✓ | ✓ | ✓ | ? | 4 |

**Peer review.** Journals and funders use fixed criteria and score scales, but the reliability of the result is measured, when at all, by outside researchers. A meta-analysis of 48 studies found mean inter-rater κ ≈ 0.17 ([Bornmann, Mutz & Daniel 2010](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0014331)). In a mock NIH study section, 43 reviewers scoring the same 25 funded oncology applications showed little agreement in scores or written critiques ([Pier et al. 2018](https://doi.org/10.1073/pnas.1714379115)). Hidden prompts aimed at AI reviewers ([LLMs as Evaluators](/concepts/llm-evaluators/#evidence-under-optimization-pressure)) show the process has no gaming tests.

**Cochrane.** The Handbook and the RoB 2 risk-of-bias tool standardize the procedure. Their reliability is again measured externally, and poorly: four experienced raters applying RoB 2 to 70 trials reached Fleiss' κ 0.16 on the overall judgment, at about 28 minutes per outcome ([Minozzi et al. 2020](https://doi.org/10.1016/j.jclinepi.2020.06.015)). Cochrane's strength is institutional: commercial organizations with a financial interest in a review's outcome may not fund it ([commercial sponsorship policy](https://www.cochrane.org/learn/resources/commercial-sponsorship-policy)). Grade 1 with rung-5 features, which is the opposite profile to credit ratings.

**Credit ratings.** Registered agencies must publish standardized performance statistics (transition and default rates) as Exhibit 1 to Form NRSRO, and SEC staff must examine each agency at least annually ([SEC Office of Credit Ratings staff report, Jan. 2025](https://www.sec.gov/files/jan-2025-ocr-staff-report.pdf)). That is rungs 2 and 5, in the strongest form any catalogue system has. Rung 4 failed in practice: the official inquiry called the agencies' failures "essential cogs in the wheel of financial destruction" ([FCIC 2011](https://www.govinfo.gov/content/pkg/GPO-FCIC/pdf/GPO-FCIC.pdf)). Most of the examination regime postdates the failure, and nobody has shown that it tests resistance to issuer pressure rather than compliance.

**LMArena.** Pairwise votes, a Bradley–Terry model and published confidence intervals give rungs 1–2. Its builders checked crowd votes against expert raters and found good agreement ([Chiang et al. 2024](https://arxiv.org/abs/2403.04132)). Rung 4 failed at the process level: a few providers tested many private variants and published only the best ([Singh et al. 2025](https://arxiv.org/abs/2504.20879)).

**Community Notes.** The bridging algorithm and the rating data are public so that outsiders can audit them ([X help centre](https://help.x.com/en/using-x/community-notes)). Its developers validated note selection with a survey experiment and a reshare effect in deployment ([Wojcik et al. 2022](https://arxiv.org/abs/2210.15723)), but no routine error rate on a random sample of displayed notes has been published. Rung 4 has a recent pass of the useful kind: a study co-authored with the Community Notes team found that up to 10.7% of lower-quality notes in historical data could be pushed over the display threshold with fewer than 10 coordinated ratings, and mitigations were deployed ([Selvam et al. 2026](https://arxiv.org/abs/2607.01824)). An independent simulation found 5–20% bad raters could suppress targeted helpful notes ([Truong et al. 2025](https://arxiv.org/abs/2511.02615)). The profile is the reverse of most systems': attacked and patched before its unattacked error is measured.

**METR.** Task suites with timed human baselines, and capability estimates with hierarchical-bootstrap 95% intervals ([Kwa et al. 2025](https://arxiv.org/abs/2503.14499)), give rungs 1–2. Here the evaluated party is the model, and METR checks for it gaming the tasks: o3 reward-hacked in 30.4% of RE-Bench runs and 0.7% of HCAST runs, and successful hacks are excluded from reported results, though METR says it may miss some ([METR 2025](https://metr.org/blog/2025-06-05-recent-reward-hacking)). Whether error is re-measured across releases in a way that would meet rung 3 is not documented publicly, hence the range.

**Metaculus.** Every resolved question is scored with proper scoring rules, and the platform publishes a [track record](https://www.metaculus.com/questions/track-record/) with calibration curves. Because all questions eventually resolve, the audit stream is the whole population rather than a sample, which is rung 3 by construction. We know of no published test of how the community forecast responds to deliberate manipulation.

**GRE essay scoring.** Each Analytical Writing essay is scored by a trained human reader and by e-rater; if they disagree, a second human scores it and the human scores are averaged ([ETS](https://www.ets.org/gre/test-takers/general-test/transcript/preparing-for-the-analytical-writing-measure.html)). That is a continuous audit on every item. ETS published machine–human agreement before deployment ([Ramineni et al. 2012](https://www.ets.org/research/policy_research_reports/publications/report/2012/jdyu.html)), and in 2001 invited outsiders to write essays designed to fool e-rater; they succeeded more often at inflating scores than deflating them, and the authors concluded e-rater should not be the sole scorer in high-stakes use ([Powers et al. 2002](https://www.ets.org/research/policy_research_reports/publications/article/2002/cnrp.html)). The deployed design follows that conclusion. It is the highest-graded system here, and it is the [LLMs-as-cheap-layer pattern](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer) running at scale for over a decade.

## What the grading suggests

These are eight hand-picked systems, so the observations are hypotheses. The most trusted systems by reputation (peer review, Cochrane) grade lowest on measurement, which suggests trust tracks institutional standing more than measured error. The highest grades go to systems whose ground truth arrives cheaply (questions resolve; a second human reads the essay). And every system that has been seriously attacked, whether by issuers, model providers, coordinated raters or the model itself, was attacked through the incentive the score created. That is the [Goodhart pattern](/concepts/patterns-and-failure-modes/#1-the-measure-reshapes-the-measured), and it is why rung 4 cannot be skipped by anything that gates value.

The sibling RRP wiki's [Reliability Ladder](https://reasoning-processes.quantifieduncertainty.org/concepts/epistemic-applications/) answers a different question: which *applications* of strong reasoners need how much verified trust. The two fit together: an application at RRP tier *n* needs evaluation machinery at some rung here, and mapping tiers to rungs is open work.

## Open questions

- Do the rungs discriminate? Grading the [~100 catalogue systems](/concepts/evaluation-systems-in-the-wild/) would show whether most cluster at 1, and whether grade predicts documented failure better than [funding model](/concepts/the-systems-view/#technical-and-institutional-design-variables) does.
- Should rung 5 be a separate axis rather than a rung? The Cochrane and credit-rating profiles argue for two axes, technical and institutional.
- What is the minimal rung-4 evidence for a judge facing unknown attacks, given that a suite only covers known ones?
