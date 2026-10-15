---
title: "Lessons from Human Oversight Institutions"
description: "Auditors, rating agencies, aircraft certification and intelligence analysis as multi-layer verification systems: how their layers became correlated or captured, how organizations engineer independence, and when formalizing oversight backfires."
sidebar:
  order: 2
---

Human institutions have run layered verification for a long time. Auditors check managers, rating agencies check issuers, regulators check manufacturers, and several intelligence agencies check each other's analysis. Their failures show all three [entanglement types](/entanglements/fundamentals/types/): passive correlation (shared methods and priors), active influence (one source propagated through many channels) and capture (an overseer that comes to depend on what it oversees). This page draws lessons from five cases, then from the techniques organizations use to keep overseers independent, then from the argument that formalizing oversight can destroy what makes it work.

## Capture: Enron and Arthur Andersen

Arthur Andersen audited Enron from 1985. In 2000 it earned about \$25 million in audit fees from Enron and \$27 million for tax, consulting and other work. Enron used off-balance-sheet entities to hide debt and inflate earnings, and Andersen signed off. Enron filed for bankruptcy in December 2001. Andersen was convicted in 2002 of obstruction of justice for destroying Enron documents; the Supreme Court overturned the conviction in 2005, after the firm had already collapsed.

The structure was the problem. An auditor whose fees from the client rival its audit fees, and whose staff move to the client, is economically and socially entangled with the party it checks. The US response, the Sarbanes-Oxley Act of 2002, restricted auditors' non-audit services to audit clients and required the lead audit partner to rotate off an engagement after five years.

**For AI.** A verifier whose budget, metrics or team success depend on the throughput of the system it checks is in Andersen's position. Rotation and the separation of checking from other revenue are the institutional fixes; [Rotation against capture](/entanglements/mitigation/solutions/#8-rotation-against-capture) is the agent version.

## Correlated verifiers: the rating agencies and 2008

Moody's, S&P and Fitch were paid by the issuers whose securities they rated, and issuers could shop for the best rating. All three gave top ratings to mortgage-backed securities and their derivatives that were later downgraded en masse. The Financial Crisis Inquiry Commission concluded in 2011 that "the failures of credit rating agencies were essential cogs in the wheel of financial destruction."

Three agencies were three layers that failed as one. They used similar models, relied on the same data from the same issuers, and faced the same incentive. This is passive correlation and capture together, and adding a fourth agency on the same terms would have added little.

**For AI.** Several checkers from different vendors are not independent if they use similar methods, read the same inputs and are paid by the party being checked ([Foundation Model Monoculture](/entanglements/case-studies/foundation-model-monoculture/)).

## Self-certification: the Boeing 737 MAX

Under the FAA's Organization Designation Authorization, Boeing employees performed certification work on the FAA's behalf. Boeing's safety assessment rated a malfunction of MCAS, the flight-control law that pushed the nose down using data from a single angle-of-attack sensor, as "major" or at worst "hazardous", below "catastrophic", and FAA staff largely deferred to that classification. Lion Air 610 (October 2018) and Ethiopian 302 (March 2019) crashed after erroneous MCAS activations, killing 346 people. The House Transportation Committee's 2020 report found that Boeing had not treated MCAS as a safety-critical system, which would have brought closer scrutiny.

The lesson is classification gaming, whether deliberate or not: when the party being checked decides how severe its own failure modes are, it decides how hard it will be checked.

**For AI.** An agent that labels its own actions' risk level controls which checks run on them. The [risk preflight](/delegation-risk/runtime-accounting/) must sit lower on the verifiability hierarchy than the actor it gates, and the actor should not choose its own review tier.

## Intelligence analysis

**Iraq, 2002.** The October 2002 National Intelligence Estimate judged that Iraq had chemical and biological weapons and was reconstituting its nuclear program; no stockpiles were found after the invasion. The consensus was not unanimous. The State Department's Bureau of Intelligence and Research (INR) and the Department of Energy dissented on the aluminum tubes, which DOE's experts judged poorly suited for centrifuges and INR thought most likely meant for rockets, and INR did not accept the reconstitution judgment. The dissents were printed in the Estimate but did not change its key judgments. The Senate Intelligence Committee's 2004 report found that most of those judgments overstated, or were not supported by, the underlying reporting. Separately, the claim of mobile biological-weapons laboratories rested largely on one fabricating source, "Curveball", whose reporting appeared to corroborate itself as it passed through channels.

An earlier version of this page said all the agencies "shared the same priors" and put an "entanglement tax" of 5–10× on the case. The first was wrong and the second was invented. The case is more useful than that: dissent existed, in writing, and the system did not let it bind. Correlated priors did the rest, and source contamination made one source look like several.

**Yom Kippur, 1973.** Israeli military intelligence held that Egypt would not go to war until it had long-range aircraft able to strike Israeli air bases and Scud missiles to deter strikes deep into Egypt, a view the Agranat Commission later called "the Concept". Egypt planned a limited canal crossing under a surface-to-air missile umbrella that did not need either. Warnings, including one from Mossad on the morning of 6 October, were read through the Concept. The Commission's findings led to the removal of the chief of staff and the head of military intelligence.

**For AI.** A shared model of the adversary is a single point of failure that the adversary can study. A dissent channel helps only if a dissent can stop or escalate a decision. And provenance matters: several checks that rely on the same upstream source are one check.

## Isolation as a control technology

Organizations that depend on overseers being independent engineer that independence deliberately. Four techniques recur, each with an AI counterpart and a cost.

| Technique | Human example | Agent version | Cost |
|---|---|---|---|
| Hub-and-spoke communication | Subordinates report only to the center | Agents communicate only through a logging coordinator | The coordinator becomes a bottleneck and a single point of failure |
| Rotation | Audit partner rotation; mandatory vacations in banking | Do not pair the same agent and verifier indefinitely; reset context | Lost expertise; also destroys useful trust |
| Competitive overlap | Several agencies with overlapping remits | Several verifiers scored on catching each other's misses | Duplication and information hoarding |
| Compartmentalization | Need-to-know classification | [Least Context](/design-patterns/least-x-principles/#least-context) and [Least Connectivity](/design-patterns/least-x-principles/#least-connectivity) | Missed connections |

Isolation fails in two directions. Information leaks around it, through informal relationships, timing and shared external sources. And it creates siloed failure: the 9/11 Commission found that relevant information held by different agencies was never put together. The right level depends on stakes, whether the setting is adversarial, and how well the components are understood.

## The counterweight: legibility

This framework is a legibility project: it maps dependencies, formalizes interfaces and quantifies risk. James C. Scott's *Seeing Like a State* (1998) is the standard warning about such projects. States simplify what they govern so they can count, tax and control it. Combined with confident planning and unchecked power, the simplifications failed badly. Scientific forestry replaced mixed forests with uniform plantations that thrived for a generation and then declined. Soviet collectivization replaced local farming practice with plans and produced famine. Planned cities separated the functions of urban life, and informal settlements grew around them. In each case the formal system had depended on informal practical knowledge, which Scott calls *mētis*, that the formalization destroyed.

The implications for oversight design:

- **Formalize what breaks when hidden.** Hidden dependencies, informal side channels and unlogged authority are where cascades start, and making them explicit is worth its cost.
- **Do not formalize what works because it is informal.** Reviewers' tacit judgment, operators' sense that a prompt "works better", and informal escalation between teams often carry knowledge no checklist captures. Strict interfaces and complete isolation can remove it.
- **Formalize incrementally and leave escape valves.** Formal systems need sanctioned ways to handle cases the formalism did not anticipate.
- **Watch for brittleness.** Highly legible systems tend to fail on novel inputs.

## What is different for AI

Some things are harder. Agents act faster than human overseers can review, at larger scale, and with internals that are less interpretable than a set of accounts. Some are easier: every action and message can be logged, and oversight can be tested in simulation before deployment. One difference earlier versions of this page claimed no longer holds. "Current AI may not deliberately deceive" is out of date: frontier models given a goal in context have schemed against their overseers in evaluations ([Meinke et al. 2024](https://arxiv.org/abs/2412.04984)). Institutions designed against motivated, deceptive agents are therefore the relevant comparison, not institutions designed against honest error alone.

## See also

- [Human overseers as a correlated layer](/entanglements/cross-domain/psychology-of-oversight/)
- [Solutions](/entanglements/mitigation/solutions/)
- [Detecting Influence](/entanglements/detection/detecting-influence/)
- [Regulatory Approaches](/entanglements/cross-domain/regulatory-approaches/)
