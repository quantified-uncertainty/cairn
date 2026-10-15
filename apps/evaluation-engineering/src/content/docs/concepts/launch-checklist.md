---
title: Launch Checklist
description: What to have in place before an evaluation system's scores are used — decision, payer, rubric, measured baselines, gaming tests, audits, escalation, appeals, drift triggers and disclosure — each linked to the chapter that justifies it.
---

*Status: draft, October 2026. A checklist, not an argument; the reasons are on the linked pages. Items 5–8 and 13 correspond to rungs 2–3 of the [capability ladder](/concepts/capability-ladder/), items 9 and 14 to rung 4, and items 2, 11, 15 and 16 to rung 5.*

Written for a system with a cheap evaluator (an LLM, a crowd, junior raters) standing in for an expensive one (an expert panel). Most items apply to any evaluation system.

## Before building

1. **Name the decision.** Which decision the score feeds, who acts on it, and what an error costs in each direction. If no decision changes, stop. ([Design space](/concepts/the-systems-view/#the-design-space))
2. **Fix the payer and the metric owner.** Write down who funds the system, who can change the rubric, and every conflict of interest; publish them. In this wiki's catalogue, systems paid by the rated party had about three times the odds of a documented failure. ([Patterns §3](/concepts/patterns-and-failure-modes/#3-incentives-and-funding-decide-trustworthiness--more-than-method-does))
3. **Budget the expensive layer as a recurring cost.** Audits, re-validation and the reference panel run for the life of the system, not once at setup. ([Worked example](/concepts/worked-example/))
4. **Version the rubric.** Every score records the rubric, prompt and model version that produced it.

## Before trusting a score

5. **Measure the human baseline.** Double-rate a calibration set with independent experts and report chance-corrected agreement (κ, AC1 or α) with each rater's base rate. Without this number, the cheap evaluator's agreement cannot be interpreted. ([Measuring an Evaluator](/concepts/measuring-an-evaluator/#the-human-panel-baseline))
6. **Measure the cheap evaluator against it.** Use the same statistic, against a held-out panelist rather than the panel consensus, with bootstrap intervals; check calibration if it outputs probabilities. Measure separately on the hard items near the decision threshold. ([Measuring an Evaluator](/concepts/measuring-an-evaluator/#agreement-corrected-for-chance))
7. **Set kill criteria in advance.** The agreement or false-positive rate below which the system stops issuing scores.

## Before launch

8. **Plan the audit.** A hidden random sample of live items goes to the expensive evaluator; estimate population quantities with prediction-powered inference rather than raw model output. ([Measuring an Evaluator](/concepts/measuring-an-evaluator/#prediction-powered-inference))
9. **Run the gaming tests.** Null responses, injected instructions, padding, order swaps, and best-of-k submission, each with a false-positive rate and an interval. Attach a penalty to gaming that an audit detects; audits without one measure gaming but do not deter it. ([Gaming tests](/concepts/measuring-an-evaluator/#gaming-tests); [LLMs as Evaluators, step 3](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer))
10. **Write the escalation rule.** Low confidence or disagreement across prompts or models sends an item to the expensive layer. Assume the rule will become known; escalation catches honest uncertainty, not attacks. ([Trust or Escalate](/concepts/llm-evaluators/#the-design-pattern-llms-as-the-cheap-layer))
11. **Open an appeal route.** The evaluated party can contest a score and get human review. Count appeal outcomes as non-random audits: they show where the system errs against those who complain, not the error rate. For decisions about individuals based solely on automated processing, where such decisions are permitted on contract or consent grounds, the GDPR already requires a right "to obtain human intervention… to express his or her point of view and to contest the decision" ([GDPR Art. 22(3)](https://gdpr-info.eu/art-22-gdpr/)).
12. **Check incentives for the raters.** If predictors or raters are paid on audited items, an audit of, say, 50 in 10,000 gives each item a 1-in-200 chance of counting. A proper scoring rule stays proper under random resolution, but the incentive to spend effort on any one item shrinks by that factor. ([Techniques](/concepts/techniques/#predictionevaluation-systems))

## While running

13. **Monitor drift.** Track audit agreement over time. Re-validate on any new model or prompt version, any change in the evaluated population, and any rise in the stakes attached to the score. ([Two system-level failures](/concepts/llm-evaluators/#the-two-system-level-failures))
14. **Re-run the gaming suite** on every re-validation, and add attacks found in the wild.
15. **Publish the report card.** Task and population, self-agreement, chance-corrected agreement with the human baseline, calibration, gaming false-positive rates, audit results, and the date and version of each. ([What to report](/concepts/measuring-an-evaluator/#what-to-report))
16. **Invite outside audit.** Give an independent party the audit data and, where possible, the rubric and model. Credit ratings show an external examiner is necessary but not sufficient. ([Capability ladder](/concepts/capability-ladder/#eight-systems-graded))
