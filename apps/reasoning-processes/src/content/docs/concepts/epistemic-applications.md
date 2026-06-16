---
title: The Reliability Ladder
description: What strong reasoners could be used for — five application tiers, each requiring more warranted trust than the last.
sidebar:
  order: 2
---

*Applications of strong reasoners arranged as a ladder of five tiers — error-checking, estimation, personalized synthesis, research valuation, institutional mechanisms — where each tier becomes defensible to deploy only when its verification machinery exists and survives systems optimized to pass it.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). The tier boundaries are a first cut, not a settled taxonomy.
:::

What would [strong reasoners](/concepts/what-is-a-strong-reasoner/) actually be *for*? The applications are not interchangeable: they demand very different amounts of warranted trust. We organize them here as a **reliability ladder** — each tier requires more trust than the last, and we conjecture a tier's applications become defensible to deploy once its verification machinery exists *and survives systems optimized to pass it*. Lower tiers are running today; upper tiers should not run unsupervised until [oversight protocols](/concepts/oversight-protocols/) can carry their weight.

## Tier 1: Error-checking and critique

The lowest-trust applications are those where a human reviews every output — a policy, not a safety property: reviewers anchor on AI verdicts, passed checks read as endorsement, and noisy flags teach them to dismiss true ones, so false-positive rates decide review quality. Document critique is the canonical case: flag mathematical errors, check links, verify citations, surface logical fallacies and missing considerations. Only arithmetic approaches determinism; link checking merely looks mechanical, and the substantive checks are LLM judgments inheriting judge-grounding's failures.

QURI's worked example, RoastMyPost (see [LLM epistemics in production](/case-studies/llm-epistemics-in-production/)), runs a panel of evaluators over submitted documents. Built by the same group as [our oversight taxonomy](/concepts/oversight-protocols/), its tooling unsurprisingly draws on three of the four groundings' verification sources (what a check's verdict bottoms out in): math/link checks (resolution), fallacy detection and auditing (LLM verdict), and — in a companion tool — multi-model claim polling (cross-model agreement) — buildable is not the same as correct, and whether grounding predicts evaluator failures is untested. The published caveats are the tier-1 signature: false positives are expected, and the tool is explicitly *not* for gatekeeping — a human reads everything.

## Tier 2: Estimation and modeling

One rung up, the AI produces quantitative artifacts — probabilities, cost-effectiveness models, Fermi estimates — that nobody re-derives by hand. The trust requirement rises, but the outputs are *structured*: a probabilistic model can be audited, decomposed, sensitivity-tested, and eventually scored against resolution in ways prose cannot.

[Squiggle AI](/case-studies/llm-epistemics-in-production/) generates full probabilistic models from natural-language prompts; telemetry is thin (168 workflows, ~30 external users, \$0.10–0.35 per run), and the speedup (2–3 hours down to 10–30 minutes) is the developer's untimed self-report. Its documented failure mode, systematic overconfidence, was caught anecdotally; structure makes calibration evals possible in principle, but none has been run, and omitted considerations are invisible by construction — the gap between *can be audited* and *is audited* is tier 2's open verification problem. Forecasting is the tier's most mature branch, with external benchmarks ([ForecastBench](https://arxiv.org/abs/2409.19839)): [Metaforecast](https://forum.effectivealtruism.org/posts/tEo5oXeSNcB3sYr8m/introducing-metaforecast-a-forecast-aggregator-and-search) aggregated ~2,100 questions across 10+ platforms at its 2021 launch. The tier's frontier is the resolution side: [AI question resolution](https://quantifieduncertainty.org/posts/ai-for-resolving-forecasting-questions-an-early-exploration/) proposes letting AI systems judge how questions resolved, with **Epistemic Selection Protocols** — committing to a *process* for choosing the future resolver rather than naming a tool that may be obsolete by then — as an untested mechanism for keeping deferred trust honest.

## Tier 3: Personalized explanation and synthesis

The third tier asks the reader to trust *faithfulness*: that a transformed presentation of content preserves its substance. [Expansive translations](https://www.lesswrong.com/posts/PC4yowA2TiRne69iD/expansive-translations-considerations-and-possibilities) is the framing concept — translation generalizes beyond languages to dialects, styles, inferential distances, and worldviews, so a strong reasoner could re-explain any document for *your* background. [Next-generation writing platforms](https://forum.effectivealtruism.org/posts/mhkkzXSTGJoKTvwQj/ideas-for-next-generation-writing-platforms-using-llms) sketch the production side: response prediction, parallel drafting, research agents, incremental edits.

Why is this higher than tier 2? Not because the reader can't check it — tier-2 artifacts go equally unchecked by their consumers — but because no one else can: models are third-party-auditable and resolution-scorable; faithfulness has no such machinery, and personalization at scale leaves no shared artifact to audit. Spot-checks against the original stay possible (a tier-1 application), but most of the burden lands on the system. The trade-off — personalization erodes shared texts and can build filter bubbles — previews the tier-5 failure modes below.

## Tier 4: Research oversight and valuation

Here the AI's judgment starts steering resource allocation: which claims get verified, which research outputs count as progress, how much a given piece of information is worth. This requires trusting the system's *valuations*, not just its facts — and valuations are far harder to ground. [Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) proposes pricing the epistemic value of claims and updates; [Overseeing Automated Research](/proposals/overseeing-automated-research/) applies it, metering automated research pipelines by valued output rather than activity. Both remain proposals; the required machinery — [utility functions over questions](/concepts/constructing-utility-functions/), audited valuation models — does not yet exist, and whether it can is open.

## Tier 5: Institutional mechanisms

The top of the ladder embeds AI judgment in institutions themselves. [Superhuman governance](https://forum.effectivealtruism.org/posts/nyiXej8EtoFwigrsw/a-case-for-superhuman-governance-using-ai) argues that transparent, constantly-monitorable AI overseers could give organizations corruption-resistance ("99.99%"-style aspirations) impractical under purely human oversight — though such monitorability presumes faithfulness current models lack, and nothing could certify four nines of corruption resistance. [LLM-secured systems](https://forum.effectivealtruism.org/posts/piAQ2qpiZEFwdKtmq/llm-secured-systems-a-general-purpose-tool-for-structured) propose AI gatekeepers entrusted with continuously-updating private data — releasing only what the owner's policy permits — enabling structured transparency: whistleblower protection, compliance verification, treaty monitoring, without full disclosure; today's gatekeepers, though, are jailbreakable. Decision support for leadership sits here too — and at the limit, institutions acting on AI conclusions no human has fully reviewed. Tier 5 is where the case for strong reasoners is most compelling and least earned.

## The cross-cutting pattern

Each tier becomes deployable when [verification](/concepts/oversight-protocols/) catches up to it: human review for tier 1, resolution and audit trails for tier 2, faithfulness checks for tier 3, valuation audits for tier 4, recursive oversight for tier 5 — though the tier 3–5 machinery named here exists nowhere yet, this wiki included. Deploying *above* your verification tier is how you get the characteristic failures: personalized synthesis optimized for reception degrades into sycophancy at scale (unfaithfulness in the direction the reader prefers), and unverified institutional deference is the road to [epistemic lock-in](https://forum.effectivealtruism.org/posts/G7KnxZ3Jpuy6hQ4Ew/a-sketch-of-ai-driven-epistemic-lock-in) — worldview-aligned AI clusters that rationalize their users' beliefs and compete on conversion rather than accuracy. The ladder is therefore less a roadmap than a discipline: the interesting question for any proposed application is not "can a model do this?" but "what would have to be verifiable before we let it?"

## Open questions

- Are the tiers real? Faithfulness (tier 3) might be *harder* to verify than valuation (tier 4); the ordering needs argument, not assertion.
- Tier 2's resolution machinery assumes trustworthy resolvers *and* unambiguous questions (AI resolvers amplify underspecified wording) — do Epistemic Selection Protocols actually bottom out anywhere, or just defer the trust question?
- What is the minimal verification standard for tier 5? "Better than current human institutions" is a much lower bar than "verified," and possibly the right one.
- Can lower tiers bootstrap the upper ones — e.g., tier-1 critique tools auditing tier-4 valuation models?
- How much of the lock-in risk is mitigated by verification, versus by market structure (who builds the dominant reasoners)?
