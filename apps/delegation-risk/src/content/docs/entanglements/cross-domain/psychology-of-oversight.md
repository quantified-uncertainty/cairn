---
title: "Human Overseers as a Correlated Layer"
description: "Human review is usually counted as an independent check on an AI system. It is not: reviewers see the AI's output, their attention fails at the base rates where AI errors live, and the setting pushes them toward approval. When review helps, when it hurts, and how to measure it."
sidebar:
  order: 4
---

Human review is the most common extra layer in an AI deployment, and it is usually counted as independent of the system it reviews. It is not, for three reasons:

- **The reviewer sees the AI's output.** The AI's answer is the reviewer's starting point, so an AI error is also an input to the human. This is [active entanglement](/entanglements/fundamentals/types/#active-entanglement).
- **Attention fails where AI errors live.** Errors in a good system are rare, and people are worst at detecting rare events.
- **The setting rewards approval.** Throughput targets, social pressure and diffuse responsibility all push toward "approve".

Each of these makes the reviewer more likely to miss exactly the cases the AI got wrong, which is positive miss correlation and an [entanglement tax](/entanglements/fundamentals/formal-definitions/) on the stack.

## When review makes things worse

Let e be the AI's error rate, c the fraction of AI errors the reviewer catches, and f the fraction of correct AI outputs the reviewer wrongly overrides. The error rate after review is

e(1 − c) + (1 − e)·f,

so review helps only if **c·e > f·(1 − e)**. Because correct outputs vastly outnumber errors in a good system, a small false-override rate can cancel a respectable catch rate. Illustrative numbers: at e = 10% and c = 20%, review breaks even at f ≈ 2.2%; at f = 5% the final error rate is 12.5%, worse than the AI alone. At e = 2% and c = 30%, the break-even false-override rate is about 0.6%. The better the AI, the harder it is for review to add accuracy.

An earlier version of this page claimed review was "worse than useless" using e = 10%, c = 30% and 2% new errors. Those numbers give 9%, an improvement. The claim did not follow from its own example, and the "entanglement tax ~9×" attached to it misused the term.

The evidence that the bad regime is common: a preregistered meta-analysis of 106 experiments found that on average human–AI combinations performed worse than the better of the human or the AI alone, with losses concentrated in decision tasks and gains in content creation ([Vaccaro, Almaatouq & Malone 2024, *Nature Human Behaviour*](https://doi.org/10.1038/s41562-024-02024-1)). In an older simulated-flight study, participants with a highly but not perfectly reliable automated aid did worse on a monitoring task than participants without one. They missed events the aid did not flag (omission errors) and followed the aid against other valid indicators (commission errors) (Skitka, Mosier & Burdick 1999, *International Journal of Human-Computer Studies*).

## Why the reviewer's misses correlate with the AI's

**Automation bias and complacency.** Parasuraman & Manzey's review (2010, *Human Factors*) treats these as overlapping attention failures. They occur in novices and experts, complacency appears mainly when the automated task competes with other work, and neither is removed by simple practice or instructions.

**Explanations can raise reliance without raising accuracy.** In [Bansal et al. (2021)](https://arxiv.org/abs/2006.14779), AI explanations increased the chance that people accepted the AI's recommendation whether or not it was correct. [Buçinca et al. (2021)](https://arxiv.org/abs/2102.09692) found that cognitive forcing, such as asking for the person's own judgment before showing the AI's, reduced overreliance more than explanations did, and that participants liked those designs least. [Vasconcelos et al. (2023)](https://arxiv.org/abs/2212.06823) argue that people choose strategically whether to engage, and show that explanations reduce overreliance when they make checking the AI cheaper than trusting it.

**Trust tracks salient events, not reliability.** Lee & See (2004, *Human Factors*) define appropriate reliance as trust that is calibrated to the automation's capability and resolves changes in it. Observed trust swings instead. People abandon an algorithm after seeing it err even when it outperforms humans ([Dietvorst, Simmons & Massey 2015](https://doi.org/10.1037/xge0000033)), and in other settings prefer algorithmic advice to human advice (Logg, Minson & Moore 2019, *Organizational Behavior and Human Decision Processes*). A long run without visible errors breeds deference, which is when an error is least likely to be caught.

**Vigilance and capacity.** In Mackworth's clock test (1948), detection of rare signals fell within the first half hour of watch; the vigilance decrement is among the most replicated findings in human factors. Working memory holds about four chunks (Cowan 2001, *Behavioral and Brain Sciences*), not the "seven plus or minus two" often quoted. A long agent transcript or a large diff exceeds both limits, so reviewers fall back on heuristics, and "the AI is usually right" is the obvious one.

**Social and organizational pressure.** Disagreeing with the AI and with colleagues who accept it is costly ([conformity](/case-studies/human-systems/jury-trust/#correlated-jurors)). In groups each reviewer expects someone else to catch real problems. Throughput targets make approval the default and a rejection the thing that must be justified. Accountability pushes the other way: participants who saw themselves as accountable for how they used an automated aid verified it more and made fewer automation-related errors (Skitka, Mosier & Burdick 2000, *International Journal of Human-Computer Studies*).

## Reducing the correlation

- **Get an independent judgment first.** Ask for the reviewer's assessment, or at least their key concerns, before showing the AI's output. This attacks anchoring directly and is the best-supported intervention above, at a cost in reviewer satisfaction.
- **Make verification cheap.** Show checkable evidence (sources, diffs, test results, the exact action about to run) rather than explanations of the AI's reasoning.
- **Inject known items.** Seed the queue with known-bad and known-good items ([Honeypot Injection](/design-patterns/verification/#honeypot-injection)) to measure c and f directly. Without them, nobody knows whether review is above or below the break-even line.
- **Track the rubber-stamp rate:** the share of approvals issued faster than the minimum time needed to read the item.
- **Rotate and rest reviewers,** and keep sessions short enough that the vigilance decrement does not set in.
- **Name an accountable reviewer** for each decision.
- **Route, do not blanket-review.** Use people where they are strong (novel situations, value judgments, spotting incoherence, high-stakes and irreversible actions) and not as a generic high-volume filter. A human asked to approve everything stops reading. Claude Code users approve 93% of permission prompts, and Anthropic cites the resulting approval fatigue as a reason for offering a mode in which a classifier decides instead ([Anthropic, March 2026](https://www.anthropic.com/engineering/claude-code-auto-mode); [Least Autonomy](/design-patterns/least-x-principles/#least-autonomy)).

## Measuring a human layer

Treat a reviewer as a check with measurable error rates. From injected items, estimate c and f and test the break-even condition. Then estimate the correlation between the reviewer's misses and the AI's errors: on items the AI gets wrong, does the reviewer miss more often than on comparable items the reviewer judges without the AI's output? A positive gap is the anchoring effect, and it belongs in the stack's ρ ([Measuring Entanglement](/entanglements/detection/correlation-calculator/)).

## See also

- [Lessons from human oversight institutions](/entanglements/case-studies/historical-cases/)
- [Jury Systems](/case-studies/human-systems/jury-trust/): correlated human decision-makers
- [Detecting Influence](/entanglements/detection/detecting-influence/)
