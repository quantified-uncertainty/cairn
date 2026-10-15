---
title: "Jury Systems: Unanimity and Correlated Jurors"
description: "The textbook case for twelve jurors and unanimity assumes independent votes. Jurors share evidence and deliberate together, and most convictions never reach a jury."
sidebar:
  badge:
    text: Core
    variant: tip
  order: 6
---

A criminal jury is a delegation with an explicit error preference. Society delegates fact-finding to twelve strangers and, through unanimity and the reasonable-doubt standard, says that convicting the innocent is worse than acquitting the guilty. The standard argument for this design is arithmetic that assumes jurors vote independently. They do not, and the gap between the arithmetic and the record is the same gap that separates a stack of AI checks from its independence estimate.

The legal facts below are sourced. The juror accuracies used in the arithmetic are illustrative assumptions, chosen to show the shape of the argument; nothing is concluded from their particular values.

## The independence arithmetic

Condorcet's jury theorem (1785): if each juror is right with probability p > 0.5, independently, the probability that a majority is right rises toward 1 as the jury grows. For p = 0.7 (illustrative), the probability that a strict majority is right:

| Jurors | 1 | 3 | 6 | 9 | 12 | 15 | 21 |
|---|---|---|---|---|---|---|---|
| P(strict majority correct) | 0.700 | 0.784 | 0.744 | 0.901 | 0.882 | 0.950 | 0.974 |

Even sizes are penalized because a tie counts as failure; splitting ties by coin flip gives 0.837 for six and 0.922 for twelve. Accuracy keeps rising past twelve, with no kink there. Twelve is inherited from medieval English practice, not derived.

The decision rule matters more than the size. Suppose (illustratively) a juror votes to convict with probability 0.10 if the defendant is innocent and 0.85 if guilty. Under independence:

| Rule (of 12) | P(convict an innocent defendant) | P(acquit a guilty defendant) |
|---|---|---|
| 7 to convict | 5.0 × 10⁻⁵ | 0.46% |
| 10 to convict | 5.5 × 10⁻⁹ | 26% |
| Unanimous | 1.0 × 10⁻¹² | 86% |

These are exact binomial sums. On this model unanimity makes wrongful conviction effectively impossible and acquits most of the guilty. Neither half matches the record. In US federal court in fiscal 2022, 1,379 of the 1,669 defendants who went to trial were convicted ([Pew Research Center 2023](https://www.pewresearch.org/short-reads/2023/06/14/fewer-than-1-of-defendants-in-federal-criminal-cases-were-acquitted-in-2022/)), and wrongful convictions by unanimous juries are documented (below). Selection explains part of the first gap: prosecutors take strong cases to trial, so in tried cases a guilty defendant's per-juror conviction probability is presumably well above the illustrative 0.85. Correlation explains much of the rest.

## Correlated jurors

Jurors hear the same witnesses, see the same exhibits, receive the same instructions and then deliberate in one room. Their votes share causes. In Asch's line-judgment experiments, about a third of responses on critical trials went along with a unanimous wrong majority, and about three-quarters of participants conformed at least once (Asch 1956). A jury room is not Asch's laboratory, but the direction of the effect is not in doubt.

The site's canonical correction for shared causes is the [beta-factor mixture](/delegation-risk/risk-propagation/): with weight ρ a common cause moves every juror together, otherwise they vote independently. For twelve jurors, each voting to convict an innocent defendant with probability 0.1:

P(all twelve convict) = (1 − ρ)·0.1¹² + ρ·0.1

| ρ (phi scale) | 0 | 0.01 | 0.05 | 0.1 | 0.2 |
|---|---|---|---|---|---|
| Beta-factor mixture | 10⁻¹² | 0.001 | 0.005 | 0.01 | 0.02 |
| Beta-binomial, same pairwise ρ | 10⁻¹² | 8 × 10⁻¹¹ | 1.2 × 10⁻⁷ | 5.8 × 10⁻⁶ | 2.2 × 10⁻⁴ |

The beta-binomial values were checked by Monte Carlo. Two points follow.

1. **Almost all of unanimity's protection is an independence assumption.** At ρ = 0.1 the mixture puts the wrongful-conviction probability ten billion times above the independence figure: the [entanglement tax](/entanglements/fundamentals/formal-definitions/) for twelve layers.
2. **Pairwise correlation does not fix the twelve-way joint.** Both rows have the same pairwise ρ, and they differ by orders of magnitude. What matters is the structure of the common cause: a single shared cause (bad evidence that misleads everyone) behaves like the mixture; diffuse similarity of jurors behaves more like the beta-binomial.

## Where wrongful convictions actually come from

**Most convictions never reach a jury.** About 90% of federal defendants in fiscal 2022 pleaded guilty and about 2% went to trial (Pew 2023), so roughly 98% of federal convictions came by plea. In state courts, 94% of felony offenders sentenced in 2006 had pleaded guilty ([BJS, *Felony Sentences in State Courts, 2006*](https://bjs.ojp.gov/content/pub/ascii/fssc06st.txt)). Whatever unanimity buys, it buys for a small and selected minority of cases.

**Where juries do decide, errors are common-mode.** [Gross et al. (2014)](https://doi.org/10.1073/pnas.1306417111) estimate conservatively that at least 4.1% of defendants sentenced to death in the US would be exonerated if all remained under sentence indefinitely. Capital cases almost always go to a unanimous jury. The recurring causes in exonerations (mistaken eyewitness identification, false confessions, flawed forensic evidence, official misconduct) are failures of the shared input. Twelve jurors evaluating the same false confession are one check, not twelve.

**Hung juries are rare.** Federal criminal trials averaged 2.5% hung juries from 1980 to 1997; rates in the large urban state courts studied were higher and varied widely by court (Hannaford-Agor et al., *Are Hung Juries a Problem?*, NCSC/NIJ 2002).

## The legal facts

- **Size.** *Williams v. Florida* (1970) upheld a six-person jury in a state felony trial. *Ballew v. Georgia* (1978) held that five is too few. Federal juries have twelve; some states use six for non-capital felonies.
- **Unanimity.** *Ramos v. Louisiana*, 590 U.S. 83 (2020), held that the Sixth Amendment requires a unanimous verdict to convict of a serious offense in state as well as federal court, ending the 10–2 verdicts Louisiana and Oregon had allowed.
- **England and Wales** allow majority verdicts of 11–1 or 10–2 after at least two hours of deliberation.
- **Germany** uses mixed panels of professional and lay judges (*Schöffen*). Any decision against the defendant on guilt or sentence needs a two-thirds majority (§ 263 StPO), so in the one-judge, two-lay-judge *Schöffengericht* the two lay judges together can block a conviction.
- **Japan's** *saiban-in* panels of six citizens and three judges decide by a majority that must include at least one professional judge and one lay judge.
- **France's** *cour d'assises* sits three judges with six jurors at first instance and needs seven of nine votes to convict. Since 2023 many crimes punishable by 15 or 20 years go instead to *cours criminelles départementales*, staffed only by professional judges.

Mixed panels trade one correlation structure for another. Lay judges deliberate with professionals and may defer to them, which ties their votes to the professionals' views.

## Lessons for AI oversight

1. **"All checks must approve" is only as strong as the checks' independence.** Five monitors that share a model, a prompt or an input behave, at the tail, like one. Estimate ρ before counting layers ([Measuring Entanglement](/entanglements/detection/correlation-calculator/)), and assume ρ near 1 against an adversary who chooses the input.
2. **The common cause is usually the shared input.** Jurors fail together on false evidence; LLM checks fail together on the same misleading context or injected instruction. Different models reading the same poisoned text are not independent ([independent context](/entanglements/mitigation/solutions/#2-independent-context)).
3. **Measure how many decisions reach the check.** Plea bargaining routes most cases around the jury. An AI review layer that sees only flagged actions, or that a default-allow path bypasses, protects less than its accuracy suggests.
4. **Keep an abstain output.** A hung jury is a check that can say "no decision" and force escalation instead of a verdict, which is cheap insurance when the inputs are ambiguous.
5. **Pick the rule from the error costs.** Unanimity encodes a judgment that false convictions cost more than false acquittals. For an AI gate, decide which error is the costly one (a harmful action allowed, or a useful one blocked) before choosing between "any check can veto" and "a majority decides".

## See also

- [Nuclear Launch Authority](/case-studies/human-systems/nuclear-launch-authority/): another system built around error asymmetry
- [Risk Propagation](/delegation-risk/risk-propagation/): the beta-factor mixture
- [Human overseers as a correlated layer](/entanglements/cross-domain/psychology-of-oversight/)
