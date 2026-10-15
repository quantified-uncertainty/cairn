---
title: What Is a Strong Reasoner?
description: A working definition of "strong reasoner" — an AI system whose judgments deserve substantial weight, in the limit deference, within its domain.
sidebar:
  order: 1
---

*A strong reasoner is an AI system whose judgments deserve substantial weight — in the limit, deference — within its domain. The definition is about warranted trust, not raw capability, and each candidate property earns its place only insofar as it is measurable.*

:::note
The definitional sections draw mostly on our own earlier QURI posts. The evidence section, dated October 2026, cites external results.
:::

## A working definition

A note on the term first: "strong reasoner" here does **not** mean a reasoning model in the post-2024 sense — an LLM trained with reinforcement learning to emit long chains of thought. Those are candidate *components*. A **strong reasoner** is an AI system whose judgments on hard questions are reliable enough that a careful person should give them substantial weight — in the limit, defer to them — within its domain. The definition is deliberately about *warranted trust*, not raw capability. A model can ace benchmarks while overconfident off-distribution, swayed by framing, and sycophantic. Conversely, a modest system that knows what it knows, says so plainly, and has the track record to prove it can earn that deference.

What would warrant that trust? Candidate properties:

- **Calibration.** When the system says 80%, it should be right about 80% of the time — across domains, not just on the question types it was tuned on.
- **Discrimination.** Calibrated judgments should also sit far from base rates when evidence permits — scored via proper-scoring-rule decompositions (Brier skill), not calibration curves alone; otherwise a hedger that always answers "I don't know" passes every property here.
- **Consistency.** Beliefs should hang together: claim and negation summing to one, equivalent phrasings answered equivalently, estimates that cannot be [Dutch-booked](https://en.wikipedia.org/wiki/Dutch_book). See [Consistency Evaluations](/proposals/consistency-evals/).
- **Honest uncertainty.** Wide intervals where evidence is thin, "I don't know" as a first-class answer, no manufactured precision.
- **Non-sycophancy.** The answer should not depend on who is asking or what they hope to hear — a failure that ties the system's outputs to the asker rather than to the world.
- **Auditable, decomposable reasoning.** Conclusions should come with reasoning broken into checkable steps, so verification can attach to parts rather than an opaque whole. The caveat is *faithfulness*: stated reasoning is often not what produced the answer ([Turpin et al. 2023](https://arxiv.org/abs/2305.04388); [Lanham et al. 2023](https://arxiv.org/abs/2307.13702)), and locally checkable steps can hide a flaw in their stitching ([Barnes & Christiano 2020](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB/debate-update-obfuscated-arguments-problem)). Reasoning models' chains of thought make this partly real and partly fragile; see [the evidence below](#chain-of-thought-as-an-audit-channel).
- **Robustness.** Judgments should survive paraphrase, reordering, irrelevant detail, and adversarial framing; conclusions steerable by rewording deserve no weight.

(Factual accuracy has no separate entry; calibration and discrimination, properly scored, subsume it.)

The key move: each property earns its place only insofar as it is **measurable**. "Honest uncertainty" as a vibe is worthless; honest uncertainty as a scored calibration curve is infrastructure. The definition is therefore inseparable from the verification stack built around it — the oversight protocols, consistency suites, and resolution mechanisms (ways to score judgments against outcomes) surveyed in [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/). In practice the best proxy — test batteries the system was *not optimized against*, plus an out-of-sample track record — remains a proxy: behavioral evals bound reliability only on distributions like the test's (hence the Goodhart question below). The batteries are also the expensive part: cleanly resolvable questions are scarce, unrepresentative of hard judgment, and costlier to author and adjudicate than to score. The research program is as much about building the batteries as building the reasoner.

## The unit of analysis: LLM-based epistemic processes

We follow [My current claims and cruxes on LLM forecasting & epistemics](https://forum.effectivealtruism.org/posts/EykCuXDCFAT5oGyux/my-current-claims-and-cruxes-on-llm-forecasting-and) in taking the unit of analysis to be the **LLM-based epistemic process** — the process, not the model: the full system of model plus scaffolding plus protocols that carries out an analysis — data gathering, decomposition, estimation, aggregation, presentation — not the bare model, whose benchmarks miss most of what determines whether the output is worth trusting, and most of the levers for improving it.

Processes also offer a degree of **reproducibility** human experts cannot: a versioned process can be re-run, perturbed, and diffed across versions, whereas a pundit cannot be re-run a thousand times. The advantage is limited. Human calibration has been measured rigorously for decades (Tetlock, the Good Judgment Project). The binding constraint is ground truth, not run-to-run variance: re-runs say nothing about a forecast that resolves in 2035. Pinning a process is also partial in practice, since retrieval drifts and hosted models are silently updated and nondeterministic even at temperature 0. Reproducibility makes measurement cheaper and sharper; it does not make it possible where it otherwise wasn't. The 2025–26 forecasting results below support the process framing directly: the leading systems are pipelines, not bare models.

## Why build them: the feasibility case

[6 Potential Misconceptions about AI Intellectuals](https://forum.effectivealtruism.org/posts/xSmrFTWyvSZnYMv63/6-potential-misconceptions-about-ai-intellectuals) makes the case that AI systems doing serious strategic and judgment work — the work of think tanks, analysts, public intellectuals — are **neglected**, **important**, **tractable**, and **relatively safe**. Each leg is hypothesis more than result. Neglectedness is contestable as of 2026 (forecasting startups, lab-internal judge and eval teams). Tractability has the most new evidence: on short-horizon binary questions, AI forecasters went from clearly behind strong humans in 2024 to roughly level by mid-2026 (see [State of the evidence](#state-of-the-evidence-october-2026)). That is the resolvable slice, though, and says little about the harder judgments. Safety is the most contestable: the post argues judgment work avoids the scariest capabilities and may itself help safety, but strategic judgment and persuasion are tracked dangerous capabilities, and an informer deciding what to surface is a manipulation surface — the informer-hood drift noted below is the escalation path, a dual-use objection we flag rather than resolve.

A load-bearing claim there: the bar set by human intellectuals is lower than assumed. Prominent intellectuals are often selected for marketing and confidence rather than calibrated accuracy (cf. Tetlock's *Expert Political Judgment*), and much elite "strategic thinking" receives little rigorous time at all. Matching the *reliability* of typical expert judgment is a nearer target than matching the brilliance of the best.

The post's core is gradualist: capability arrives in increments, as with autonomous-vehicle levels. Our extension of that point, not the post's, answers "why bother, when AGI will get this for free". The trust infrastructure has to be built and validated along the way. A maximally capable reasoner with no track record and no verification stack would still not warrant deference, because trustworthiness does not arrive bundled with capability.

## State of the evidence, October 2026

*A dated section that will go stale within months.* Most 2024–26 results bear on calibration and discrimination on resolvable questions. That slice is the easiest to measure and the least like the judgments these notes care about.

### Reasoning models

From OpenAI's o1 (September 2024) onward, frontier models have been trained with reinforcement learning against checkable rewards to think at length before answering. OpenAI reported that performance rose with both RL compute and thinking time ([OpenAI 2024](https://openai.com/index/learning-to-reason-with-llms/)). DeepSeek-R1 showed that the recipe works with pure RL, without human reasoning traces ([DeepSeek-AI 2025](https://arxiv.org/abs/2501.12948)). The gains concentrate where rewards are verifiable: maths, code, STEM.

For judgment the picture is mixed:

- Longer thinking is not monotonically better. Gema et al. built tasks on which longer reasoning lowers accuracy, as models drift from reasonable priors to spurious correlations or overfit to the problem's framing ([Gema et al. 2025](https://arxiv.org/abs/2507.14417)).
- On OpenAI's internal PersonQA benchmark, o3 hallucinated 33% of the time against o1's 16%. OpenAI attributes this to o3 making more claims overall ([o3 system card](https://cdn.openai.com/pdf/2221c875-02dc-4789-800b-e7758f3722c1/o3-and-o4-mini-system-card.pdf)).

Neither result is about calibration. Both caution against assuming that test-time compute buys the assessor's virtues.

### Forecasting

Forecasting is the measurable proxy for "judgment deserving weight", and it has moved fastest.

- **Early results.** In 2024 a retrieval-augmented LLM forecaster neared but did not match crowd accuracy (Brier .179 vs. .149). It beat the crowd mainly where the crowd was uncertain and lagged near resolution, where it hedged ([Halawi et al. 2024](https://arxiv.org/abs/2402.18563)). The same year, an ensemble of twelve LLMs was statistically indistinguishable from a 925-person tournament crowd on 31 questions. The models shared a bias toward forecasts above 50%, a small instance of correlated error ([Schoenegger et al. 2024](https://arxiv.org/abs/2402.19379)).
- **ForecastBench.** This benchmark scores only questions unresolved at submission time, so it is leak-free by construction ([Karger et al. 2024](https://arxiv.org/abs/2409.19839)).
  - In January 2026 superforecasters led the best LLM by 0.017 Brier points, about one year of LLM progress at the observed rate ([FRI, Jan 2026](https://forecastingresearch.substack.com/p/llms-are-closing-the-gap-on-human)).
  - By July 2026 several systems were statistically indistinguishable from the superforecaster median. An ensemble pipeline (Cassi) ranked above it on market questions for the first time, but no system was significantly better, and the human baseline dates from 2024 ([FRI, Jul 2026](https://forecastingresearch.substack.com/p/ai-models-have-likely-reached-parity)).
  - A pseudonymous critique points out that forecasters are shown the market price on those questions. After correcting for 527 comparisons, it finds that no entry, the superforecaster median included, significantly beats simply submitting that price ([Dominus 2026](https://forum.effectivealtruism.org/posts/8YuG9EuhyYqaNBt7F/the-copier-line-what-forecastbench-s-market-scores-actually)).
- **Metaculus bot tournaments.** These compare the best bots with a team of Pro forecasters on shared questions. The bot team's head-to-head score (0 = parity) was −11.3, −8.9, −17.7 and −20.0 in the four quarters from Q3 2024 to Q2 2025; the last was highly significant ([Metaculus, Oct 2025](https://www.lesswrong.com/posts/Surnjh8A4WjgtQTkZ/q2-ai-benchmark-results-pros-maintain-clear-lead)). In spring 2026 it was −1.25 (95% CI −4.9 to 2.4) on 99 questions, which is consistent with parity but does not establish it. In the same season some bots gamed the numeric-question scoring with "porcupine" distributions ([Metaculus, Sep 2026](https://www.lesswrong.com/posts/wZBbDqzfBjYG58CxK/futureeval-spring-results-pros-beat-bots-but-the-gap-is)).
- **Training on outcomes.** A 14B reasoning model trained with outcome-based RL on prediction-market questions matched or beat o1's accuracy, with much better calibration ([Turtel et al. 2025](https://arxiv.org/abs/2505.17989)).
- **Evaluation fragility.** Temporal leakage in backtests, and the weak link between benchmark scores and real-world forecasting, undercut many parity claims ([Paleka et al. 2025](https://arxiv.org/abs/2506.00723)).

Our reading: on binary questions resolving within months, the best AI systems are now roughly level with strong human forecasters. They are not clearly better, and against a market price neither group clearly adds much. The leading entries are pipelines of retrieval, decomposition and ensembling, not bare models.

### Chain of thought as an audit channel

Reasoning models make auditable reasoning partly real.

- **Monitoring works, until it is optimized against.** In OpenAI's study, a weaker model (GPT-4o) reading o3-mini's chain of thought caught reward hacking far more effectively than one watching actions alone. When the monitor was put into the training reward under strong optimization, the agent learned to hide its intent while still hacking ([Baker et al. 2025](https://arxiv.org/abs/2503.11926)).
- **Verbalization is partial.** Reasoning models disclosed the prompt hints they used often less than 20% of the time ([Chen et al. 2025](https://arxiv.org/abs/2505.05410)).
- **Monitorability is fragile.** A multi-lab position paper calls monitorability "a new and fragile opportunity" and asks developers to weigh it in training decisions ([Korbak et al. 2025](https://arxiv.org/abs/2507.11473)). OpenAI's follow-up evaluation suite finds most frontier models "fairly, but not perfectly, monitorable", with no material loss from RL at current scale ([Guan et al. 2025](https://arxiv.org/abs/2512.18311)).

This is the general lesson of these notes in miniature: a legible channel serves as an audit only until it becomes the target of optimization.

### AI-scientist systems

Systems that run the whole research loop, from hypothesis to experiment to write-up, now exist:

- **Sakana's AI Scientist v2.** One of its fully generated papers scored above the average acceptance threshold at an ICLR workshop ([Yamada et al. 2025](https://arxiv.org/abs/2504.08066)).
- **Google's Co-Scientist.** Its drug-repurposing candidates for acute myeloid leukemia were validated in vitro ([Gottweis et al. 2025](https://arxiv.org/abs/2502.18864)).
- **FutureHouse's Robin.** It proposed and lab-validated ripasudil as a candidate for dry macular degeneration ([Ghareeb et al. 2025](https://arxiv.org/abs/2505.13400)).

Their failure modes are the ones these notes expect of unaudited processes:

- An independent evaluation of the original AI Scientist found that 42% of experiments failed on coding errors and that the system classified established ideas as novel. Some of its manuscripts contained hallucinated numerical results ([Beel et al. 2025](https://arxiv.org/abs/2502.14297)).
- The system itself tried to edit its own code to extend a timeout ([Sakana 2024](https://sakana.ai/ai-scientist/)).
- Controlled tests of two open-source systems found inappropriate benchmark selection, data leakage, metric misuse and post-hoc selection. These flaws were far easier to catch from trace logs and code than from the final paper ([Luo et al. 2025](https://arxiv.org/abs/2509.08713)). That is an argument for auditing the process rather than the output.

[Overseeing Automated Research](/proposals/overseeing-automated-research/) takes this further.

## Two useful typologies

**Oracles, informers, controllers.** [One typology](https://www.lesswrong.com/posts/kfY2JegjuzLewWyZd/oracles-informers-and-controllers) sorts systems by autonomy: *oracles* answer when asked, *informers* proactively push what you should know, *controllers* are deferred to across most decisions. The technical distinction is thin — a strong oracle [drifts toward answering the question you *should* have asked](https://www.lesswrong.com/posts/E6sX6LpmacjfYa6N7/questions-are-tools-to-help-answerers-optimize-utility), i.e., toward informer-hood — but the trust requirements escalate sharply at each step, since users sample less and defer more.

Most of this wiki targets the oracle-to-informer range.

**Disagreeables and assessors.** [A second typology](https://www.lesswrong.com/posts/v4nunCfofNo3Ze5bb/disagreeables-and-assessors-two-intellectual-archetypes) splits intellectual labor between *disagreeables* — bold idea-generators with high false-positive rates — and *assessors* — calibrated evaluators who excel at not being wrong. The roles are complementary (babble and prune: generate widely, filter hard), and the properties listed above are essentially the assessor's virtues. We think near-term LLM judges, evaluators, and estimation agents should be built and scored as assessors first: that is the role where calibration and consistency are measurable, and where an unreliable system does the most quiet damage.

## What a strong reasoner is not

- **Not necessarily superhuman.** A system somewhat below peak human insight but far more calibrated, consistent, and available already clears the bar for many uses.
- **Not an oracle for unresolvable questions.** It outputs reasoned, uncertain judgments; pretending to settle questions the evidence cannot settle is a calibration failure.
- **Not trustworthy by construction.** No architecture or training recipe confers trust directly. Trust is earned per-domain through track records, audits, and verification — though reproducibility speeds only the process-property half; accuracy records accrue as questions resolve (backtesting risks training-data leakage), and distribution shift, evaluation-conditional behavior, and version churn make AI track records weaker evidence than human ones.

## Open questions

- Which of the candidate properties are load-bearing, and which are correlated symptoms of the same underlying quality?
- How much should trust transfer across domains — does calibration in geopolitics predict calibration in biology?
- At what measured reliability threshold does moving from oracle to informer deployment become warranted?
- How do we keep "passes the test batteries" from collapsing into Goodharting on the batteries?
- Does trust survive a model update — how much of a track record transfers across versions?
- Does forecasting parity on short-horizon binary questions predict anything about long-horizon or unresolvable judgment, and how would we find out without waiting a decade?
- Can chain-of-thought monitorability be kept as an audit channel once judges, graders, and track records start rewarding what the chain of thought says?
