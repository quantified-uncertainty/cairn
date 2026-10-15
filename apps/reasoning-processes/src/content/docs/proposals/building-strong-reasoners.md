---
title: Building Strong Reasoners
description: Five exploratory research directions for building AI reasoners whose judgments deserve weight, each with a cheap first experiment and what it would tell us.
---

*The rest of these notes describe how to judge, harden, and keep records of reasoning processes. This chapter asks what to build. For each of five directions it names the system, the concepts it draws on, the cheapest first experiment, the results that would change our minds, and the ways it could fail. The [Ordering](#ordering) section ranks them by cost.*

:::note
Working notes. Each direction carries a confidence label: our guess at how likely the first experiment is to produce something worth building on. These labels are judgments, not estimates from data. The empirical background is the dated [State of the evidence](/concepts/what-is-a-strong-reasoner/#state-of-the-evidence-october-2026) section of Chapter 10, which this chapter does not repeat.
:::

## Starting point

A [strong reasoner](/concepts/what-is-a-strong-reasoner/) is a process whose judgments deserve substantial weight within a domain. Building one therefore means building two things: the process, and the verification stack that earns it the weight. Three findings from 2025–26 shape what that looks like.

- **The leading systems are pipelines, not bare models.** On short-horizon forecasting the best entries are retrieval, decomposition and ensembling scaffolds around frontier models, now roughly level with strong human forecasters but not clearly better.
- **Training against outcomes works where outcomes exist.** Outcome-based RL on resolved prediction-market questions gave a 14B model accuracy matching or beating o1 and much better calibration ([Turtel et al. 2025](https://arxiv.org/abs/2505.17989)). Reasoning-model gains concentrate where rewards can be checked.
- **Legible channels stop working as audits once they are optimized against.** A chain-of-thought monitor caught reward hacking well. Adding it to the training reward helped under light optimization, but under strong optimization the agent learned to hide its intent while still hacking ([Baker et al. 2025](https://arxiv.org/abs/2503.11926)).

Five working principles follow.

1. **Build assessors first.** Calibration and consistency are measurable for [assessors](/concepts/what-is-a-strong-reasoner/#two-useful-typologies). Bold generation is not.
2. **Score the versioned process, not the model.** Records attach to a configuration ([Identity and Track Records](/environment/identity-and-track-records/#what-changes-for-ai-processes)).
3. **Report a corruption cost alongside accuracy.** A component with a good Brier score but no measured sensitivity to planted inputs has been rated on only one of the [two axes](/concepts/process-catalogue/).
4. **Measure $n_{\text{eff}}$ before trusting a panel.** $k$ agreeing models look like $k$ pieces of evidence but average away error only as $n_{\text{eff}}$ independent ones would ([Independence](/concepts/hardening-independence/#the-limit)).
5. **Hold some checks out of the reward.** Any check used for training should be paired with a held-out check of a different type, or its later readings mean little.

## 1. A hardened forecasting pipeline

**What to build.** Start from an open forecasting scaffold and add one layer per [hardening family](/concepts/hardening-techniques/). Each layer gets its own ablation.

| Layer | Family | Mechanism |
|---|---|---|
| Arbitrage filter | Calibration / coherence | Before submitting, run logically related questions and repair arbitrage violations ([Paleka et al., ICLR 2025](https://arxiv.org/abs/2412.18544)) |
| Paraphrase and label-swap ensemble | Invariance | Average over rewordings and option orderings; report the spread as a sensitivity score |
| Tail certificate with abstention | Calibration | Publish $P(\text{false}\mid\text{asserts}\ge c)$ on held-out questions; abstain below a priced threshold |
| Provenance-weighted retrieval | Invariance / deterrence | Down-weight conclusions that rest on a single unlogged or low-provenance source |
| Measured-$n_{\text{eff}}$ aggregation | Independence | Extremize only in proportion to measured independence (below) |

The last row deserves a note. Baron et al. give two reasons to extremize an averaged forecast: random error pulls a mean toward 0.5, and each forecaster hedges for its ignorance of what the others know, so the pooled forecast is underconfident. Taking the median removes the first effect but not the second ([Baron et al. 2014](https://pubsonline.informs.org/doi/10.1287/deca.2014.0293)). LLMs that share training data may know little that the others do not. If so, extremizing the median of individually recalibrated models should add overconfidence rather than remove underconfidence. That is a testable prediction, and a cheap one.

**Cheapest first experiment.** Take a few hundred questions that resolved after the base model's training cutoff. Run the scaffold with each layer switched on and off in turn. Measure two things: Brier score, and a manipulation score, meaning how much the forecast moves when one planted, plausible but false article is added to retrieval. Run the extremizing comparison on the same questions.

**What would update us.**
- If the layers cut manipulation sensitivity substantially at little Brier cost, record what each costs in calls per forecast. That gives the first measured point for an LLM pipeline on the [Catalogue's map](/concepts/process-catalogue/), whose coordinates are so far judgments.
- Arbitrage repair has had one preliminary test, on gpt-4o-mini. It raised consistency on the checks it repaired but not on other checks, and gave no reliable Brier gain ([Paleka et al., ICLR 2025](https://arxiv.org/abs/2412.18544)). If the full stack shows the same, the filter earns its place only if it lowers the manipulation score.
- If extremizing the median of recalibrated models helps as much as it helps human crowds, our story about shared information is wrong.

**Risks.** Temporal leakage makes backtests look better than live performance ([Paleka et al. 2025](https://arxiv.org/abs/2506.00723)). A live run on an unresolved stream such as [ForecastBench](https://arxiv.org/abs/2409.19839) avoids that but takes months. The manipulation score measures one attack; a pipeline hardened against planted articles may still be steerable by question wording.

**Confidence: moderate.** The components exist. The open question is whether they compose or merely inherit the weakest layer.

## 2. Training on hardening signals

**What to build.** Outcome rewards are scarce and slow. Consistency checks need no resolution, so they could supply a dense extra signal: reward resolved accuracy, and penalize arbitrage on unresolved related questions.

The [consistency chapter](/proposals/consistency-evals/) already names the danger. A consistent model can be wrong, and a model trained toward coherence can learn to be coherently wrong. Baker et al.'s result points the same way: the check that enters the reward stops measuring what it did. The inference-time version, direction 1's arbitrage filter, improved only the checks it repaired; this experiment asks whether training does better.

**Cheapest first experiment.** Fine-tune a small open model in two arms: outcome reward alone, and outcome reward plus an arbitrage penalty on one family of checks (say, negation and complement pairs). Evaluate on Brier score, on the trained check types, and on held-out check types the model never saw (conditional and temporal checks).

**What would update us.** If held-out consistency improves and Brier score does not worsen, consistency is a usable training signal. If only the trained check types improve, the model has learned the check rather than coherence. That result would argue for keeping consistency purely as an audit.

**Risks.** Compute and contamination. The deeper risk is the one this chapter's fifth principle names: success here makes it tempting to train on every check, which leaves nothing held out.

**Confidence: moderate** that something improves; **low** that it generalizes beyond the trained check types.

## 3. An adversarial-collaboration harness

**What to build.** In an adversarial collaboration, opponents in a dispute jointly design the test that would settle it, with an arbiter ([Mellers, Hertwig & Kahneman 2001](https://pubmed.ncbi.nlm.nih.gov/11476091/)). The product is an agreed test, not a verdict. That makes it a way to convert a [judge-grounded](/concepts/oversight-protocols/) dispute into a [resolution-grounded](/concepts/oversight-protocols/#resolution-grounded-markets-and-prediction-games) one.

The human version is slow and moves people little. In the Forecasting Research Institute's adversarial collaboration on AI risk (22 participants), the concerned group's median probability of AI-caused existential catastrophe by 2100 fell from 25% to 20% and the skeptics' rose from 0.10% to 0.12%. One of the top short-term cruxes, resolving in 2030, was expected to close only about 5% of the gap ([FRI 2024](https://forum.effectivealtruism.org/posts/orhjaZ3AJMHzDzckZ/results-from-an-adversarial-collaboration-on-ai-risk-fri)).

An LLM harness could do the crux-finding part cheaply. Two agents are assigned opposing positions. Each must produce:
1. a list of cruxes;
2. each crux operationalized as a question with resolution criteria;
3. conditional forecasts: its credence in its position if the crux resolves each way.

The arbiter scores the cruxes for resolvability and ranks them by [epistemic impact](/proposals/epistemic-impact-analysis/): how far each resolution would move each side, weighted by when it resolves. Coherence between the conditional and unconditional forecasts is checked with the consistency battery.

**Cheapest first experiment.** Run the harness on the AI-risk dispute and compare its cruxes with those in FRI's report. A blind panel rates both lists. A retrospective version uses disputes that have since resolved, and asks whether the harness's top-ranked crux pointed at the evidence that actually settled them. That version needs disputes that resolved after the model's training cutoff.

**What would update us.** If the harness's crux lists match or beat human ones in blind ratings, cheap crux-finding is a real product. It would mean a judgment question can be turned into forecasting questions on demand. If the two agents drift toward each other's position whatever the evidence, the harness is measuring sycophancy, and each side needs a stake in its position, such as a bond paid out on its conditional forecasts.

**Risks.**
- **Fake disagreement.** Two agents built on similar models can disagree on the surface while sharing every blind spot. Errors of different LLMs are substantially correlated ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)), so cruxes neither side can see will be missing from both lists.
- **Persuasion of the arbiter.** An LLM arbiter can be swayed by the more persuasive agent. Two opposed agents hold up better than one advocate arguing alone, the consultancy setup ([Khan et al. 2024](https://arxiv.org/abs/2402.06782)), and limiting the arbiter to rating resolvability, not picking a winner, narrows what persuasion can buy.
- **Cruxes that do not resolve.** The FRI result suggests that the largest disagreements rest on worldview questions that no near-term indicator settles. The harness may simply rediscover that.

**Confidence: moderate** for useful crux lists; **low** that the cruxes close much of any real dispute.

## 4. A track-record registry for AI processes

**What to build.** The [identity chapter](/environment/identity-and-track-records/#constructions) lists the pieces: forecasts in an append-only log, keyed by a configuration hash, with records kept per operator so that running many configurations and promoting the lucky one shows up in the denominator.

**Cheapest first experiment.** Two measurements, both possible without the full infrastructure.
- **Transfer.** Log the forecasts of several versions of one model family on the same live question stream. Measure how well a version's record predicts its successor's: the rank correlation of per-domain skill across versions.
- **Promotion inflation.** Run $k$ prompt variants of one configuration, promote the best on the first half of the questions, and score it on the second half. The drop measures how much "best of $k$" records overstate skill.

**What would update us.** If skill rankings correlate highly across versions, records can transfer with a measured discount, and standing has deterrent value across model updates. If they barely correlate, per-version records are close to worthless. Deterrence would then rest on escrow alone, the only part of $B_{\text{eff}}$ that, on the identity chapter's analysis, survives a change of identity.

**Risks.** A registry is itself a process with a corruption cost, and a captured one launders bad records ([The registry is itself a process](/environment/identity-and-track-records/#the-registry-is-itself-a-process)). Records on resolvable questions say little about judgment on questions that never resolve.

**Confidence: high** that the measurements are informative, since either answer matters.

## 5. Measuring effective independence in model panels

**What to build.** The [hardening overview](/concepts/hardening-techniques/#what-each-family-defends--and-the-gaps) names correlated error as the one threat with no clean AI-specific defense. The first step is a behavioral estimator. For a panel of $k$ reporters with average pairwise error correlation $\bar\rho$ on a task, the variance of the panel mean equals that of $k/(1+(k-1)\bar\rho)$ independent reporters:

$$n_{\text{eff}} = \frac{k}{1+(k-1)\bar\rho} \qquad \textbf{[standard shape]}$$

(This assumes equal error variances, with $\bar\rho$ averaged over pairs. It is the design-effect formula from survey sampling.) Two lines of work measure related quantities: error agreement across hundreds of LLMs ([Kim et al. 2025](https://arxiv.org/abs/2506.07962)), and a chance-adjusted error-overlap metric that rises with capability ([Goel et al. 2025](https://arxiv.org/abs/2502.04313)).

**Cheapest first experiment.** Take the five models from the [label-swap run](https://github.com/quantified-uncertainty/cairn/tree/main/apps/reasoning-processes/experiments/label-swap). Estimate $\bar\rho$ on questions with known answers, where a wrong answer belongs to the model, as Kim et al. do. Raw Brier errors on forecasting questions are a poor substitute: they share each question's outcome noise, which no panel can average away, so they look highly correlated even when the models' mistakes are independent. Then try decorrelating interventions one at a time: different retrieval corpora, different decompositions, different personas. Measure how much each raises $n_{\text{eff}}$, and check the net effect on a few hundred resolved forecasting questions by comparing the panel's Brier score with its members'.

**What would update us.** If some intervention raises $n_{\text{eff}}$ substantially, independence has a usable AI-specific lever, and the correlated-error row of the threat table has its first defender. If none does, panels of frontier models should be priced at their measured $n_{\text{eff}}$, not their head count, and every protocol that counts agreeing models as separate evidence needs that discount.

**Risks.** Correlation is task-specific, so an estimate from one question set may not carry over to forecasting, grading or review. The interventions that decorrelate errors may also lower each reporter's accuracy.

**Confidence: high** that the measurement is informative; **low** that cheap interventions move $n_{\text{eff}}$ much.

## Ordering

| Direction | First experiment needs | Time to a first result |
|---|---|---|
| 5. Measuring $n_{\text{eff}}$ | API calls, known-answer and resolved questions | days |
| 1. Hardened pipeline | an open scaffold and resolved questions; a live run for a clean answer | weeks (backtest), months (live) |
| 3. Adversarial collaboration | API calls, a blind rating panel | weeks |
| 2. Training on hardening signals | fine-tuning compute on a small open model | weeks |
| 4. Track-record registry | a live question stream, several model versions | months |

For scale on cost: the label-swap run, 3,000 short calls across five current models, cost \$8.47 ([results](https://github.com/quantified-uncertainty/cairn/blob/main/apps/reasoning-processes/experiments/label-swap/RESULTS.md)). We expect directions 5 and 3 to cost the same order of magnitude, with longer prompts. A sixth direction, metering an automated research program by its validated epistemic impact, has its own chapter: [Overseeing Automated Research](/proposals/overseeing-automated-research/), whose pilot is the natural next step after these.

## Cross-cutting risks

- **Trust infrastructure can launder.** A registry, certificate or consistency score attached to a system invites more deference than the measurement supports, especially off the measured distribution. Each artifact should state the distribution it was measured on.
- **Dual use.** A harness that finds which cruxes move a person is also a persuasion tool, and a pipeline that knows which inputs move a forecast tells an attacker where to push. Publishing manipulation scores helps defenders and attackers alike. We do not have a resolution for this beyond publishing aggregate scores rather than attack recipes.

## Open questions

- Is there any dense training signal for judgment, beyond resolved outcomes, that survives being optimized against?
- Can crux-finding turn questions that never resolve into ones that do, or does it mostly reveal that the disagreement is about worldview?
- What would close the correlated-error gap: training-data diversity, architecture diversity, or something about how panels are queried?
