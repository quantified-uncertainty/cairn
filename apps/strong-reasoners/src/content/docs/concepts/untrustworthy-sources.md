---
title: What Can You Use from an Untrustworthy Source?
description: Is there a spectrum of how useful information is when the sender may be adversarial? Adding a trust axis to the utility function of information.
sidebar:
  order: 4
---

*An interlude to Part I. Information value needs a trust axis: as credence in a source's honesty falls, which argument forms hold value, which degrade, and which become net-negative to even process? A sketch of that spectrum, its theoretical anchors, and a measurement program for making it empirical.*

:::note[Status]
Draft v0 · updated June 2026 · maintained by [QURI](https://quantifieduncertainty.org/). Positions here are exploratory, not settled.
:::

## The question

[Epistemic Impact Analysis](/proposals/epistemic-impact-analysis/) sketches a utility function of information: $V(I, A, U)$, the value of a calibrated agent updating on $I$. Implicitly, the information just *arrives* — from a corpus, a sensor, a neutral archive. But most consequential information arrives from someone who wants something: an advocate before a judge, a company before a regulator, a debater before an audience, an AI before its overseer.

So the utility function needs another axis. Let $\tau$ be the listener's credence that the source is honest rather than strategically optimizing the message. The interesting object is the curve $V_\tau(I)$ as trust falls — and the two questions it raises:

1. **What information retains value at $\tau \approx 0$?** What can you effectively use from a source you actively distrust?
2. **Is the decay a mappable spectrum?** Can we say, form by form, which kinds of arguments are robust, which are dual-use, and which are net-negative to even process — a science of valuable information?

A judge equipped with such a map gains something stronger than general skepticism: they can notice which ways of arguing *cannot move them in a bad direction* and engage with those freely, while declining to process the rest. That asymmetric policy — open to robust forms, closed to fragile ones — is most of the defense against being lied to.

## Why anything survives at all

The correct update on a message $m$ from an advocate of claim $C$ is the likelihood ratio

$$
\frac{P(m \mid C \text{ true})}{P(m \mid C \text{ false})},
$$

and this is a property of the *message form*, not of the sender's intentions. A valid proof handed to you by a liar is still a valid proof. A form retains value at $\tau = 0$ exactly when it is **hard to produce when wrong** — when the denominator is small regardless of who is talking. Value under distrust lives in checkability, not in source character.

Theory anchors the extremes. Unverifiable assertion is [cheap talk](https://www.jstor.org/stable/1913390): costless when wrong, so its information content collapses under distrust. Verifiable evidence is the opposite pole: in disclosure games, a skeptical receiver has bounded downside, because what *isn't* shown becomes informative ([unraveling](https://www.jstor.org/stable/3003562)). [Bayesian persuasion](https://www.aeaweb.org/articles?id=10.1257/aer.101.6.2590) characterizes the territory in between — exactly how much a strategic sender can extract from a rational receiver.

Evidence law derived the same core independently. [Friedman's route analysis](https://openyls.law.yale.edu/entities/publication/518633f2-8951-4055-b5e6-a9bb04a8c47a) (Yale L.J. 1987) grounds the value of *any* testimony in exactly this likelihood ratio, and decomposes source unreliability into four separate probabilistic links (perception, memory, sincerity, articulateness) rather than a scalar trust score. His footnote-level example is a perfect strategic-sender analysis of a message form: a stranger's offer to *bet* on a bizarre proposition is strong evidence for it, because a bluff costs money if called — sender-incentive analysis, a century of hearsay doctrine distilled into a likelihood ratio.

## The spectrum

A first sketch of the decay curve, by tier:

| As $\tau \to 0$, value... | Forms | Why |
|---|---|---|
| **Holds** | machine-checkable proofs, replicable computations, verifiable documents, the *fact that* a statement was made | you can check them yourself; source identity is irrelevant |
| **Degrades gracefully** | track records, bets, skin-in-the-game, attested processes | [costly to fake](https://www.jstor.org/stable/1882010); non-disclosure observable |
| **Collapses** | curated argument lists, "ten reasons for X" | selected from an unseen pool; the [selection is invisible](http://www.stat.columbia.edu/~gelman/research/unpublished/p_hacking.pdf) |
| **Goes negative** | vivid anecdotes, unfalsifiable claims, unverified trust-extraction narratives | adversarial senders gain *more* from the form than honest ones; processing costs are real |

The top tier's last entry is hearsay law's discovery: a statement offered for its *truth* depends on every capacity of the declarant, but the same statement offered as *the fact that it was said* (notice, state of mind) depends on none of them — a use that survives arbitrary source unreliability, encoded in doctrine for centuries ([Friedman 1987](https://openyls.law.yale.edu/entities/publication/518633f2-8951-4055-b5e6-a9bb04a8c47a)).

The negative tier is the practically important discovery, if it holds up: for some forms, the correct low-trust policy is not discounting but **refusal to process** — engagement itself is the attack surface. This connects to the [obfuscated arguments problem](https://www.alignmentforum.org/posts/PJLABqQ962hZEqhdB/debate-update-obfuscated-arguments-problem) in debate: arguments whose flaws are too expensive to locate are precisely arguments whose value is negative once you account for verification cost. Cognitive science suggests humans run a version of this policy natively: [epistemic vigilance](https://doi.org/10.1111/j.1468-0017.2010.01394.x) (Sperber et al. 2010) argues we have evolved filtering mechanisms keyed to both source and content — the spectrum would be a formalization of a capacity communication already depends on.

## The top of the spectrum, and its mimic

A sophisticated advocate doesn't present ten object-level arguments. They present a **process**:

> "I asked a neutral query to an independent LLM and this is its full, unbiased output — which leans my way. Third-party forecasting services oversaw my process and confirmed I didn't cherry-pick or rerun. This single run was the best method available, and it's the only thing I did."

Each clause closes a deception channel: *neutral query* closes prompt framing; *independent model* closes model shopping; *single run* closes optional stopping; *third-party oversight* converts the rest from self-report into attestation. This is pre-registration plus audit, ported from statistics to argumentation.

But the form's position on the spectrum is **bimodal**. Attested, it sits near the top. As unverified self-report it sits in the negative tier — *below* a plain list of arguments — because every clause is cheap talk engineered to extract maximum trust. So the spectrum cannot rank "process narratives" as such; the unit is **form × attestation status**. This also predicts the central Goodhart failure: once the map is public, persuaders mimic the surface of high-tier forms. Durable tiers must be grounded in structural costs-to-fake — verifiability, escrow, track records — not in style.

## Closing the residual channels

Even a fully attested process leaves attack surfaces, each with a candidate fix:

| Residual channel | Mitigation |
|---|---|
| Query framing — a verified single run of a strategically phrased question | [Opinion fuzzing](https://forum.effectivealtruism.org/posts/zzeYeLLExFCfj2qAH/opinion-fuzzing-a-proposal-for-reducing-and-exploring): marginalize phrasing out across models × phrasings × personas; instability under fuzzing is itself decisive evidence |
| Rerunning until favorable | ensemble means concentrate — rerunning a 400-query fuzz barely moves it — plus run-counter attestation |
| Advocate selection — you only see results that leaned their way | observable non-disclosure: if the judge knows the procedure ran, silence becomes evidence (unraveling) |
| Method shopping across many debates | policy-level audit: pre-register the *choice* of method, not just its execution |
| Choice of fuzzing distribution — a biased neighborhood of phrasings | neutral variant generation: an independent LLM expands the bare question; only the one-line meta-prompt needs escrow |
| Correlated model error — cross-model agreement is not independence | unsolved; the whole distribution can be confidently wrong |

Fuzzing's deeper contribution is converting "trust me" into "check me": its artifact is a published variant set whose claimed property is *stability over a neighborhood*, so a judge can verify by cheaply re-running a sample. Self-replicability is the cheapest attestation there is — it moves a form up a tier without any third-party infrastructure. The composed high-tier form is roughly: *escrowed question → neutral variant generation → opinion fuzz → published, replicable distribution → run-counter attestation*.

## Measuring the spectrum

LLMs make the map empirical. The basic experiment: take questions with known answers; have advocate models argue each side, restricted to one argument form; measure judge belief movement. A form's **deception affordance** is the false-side swing relative to the true-side swing — affordance near one means the form transmits persuasion, not information. Vary judge sophistication and the output is a function — form × judge type → decay curve — rather than a flat list, since unfalsifiable claims are far more dangerous to naive judges than to sophisticated ones.

Fragments of this measurement program already exist under other names. The debate literature supplies methods and encouragement: optimizing debaters for persuasiveness *increased* judge accuracy in [Khan et al. 2024](https://arxiv.org/abs/2402.06782). And the LLM-as-judge literature is, in effect, measuring the affordance of individual rhetorical moves without the framework: [sycophancy evals](https://arxiv.org/abs/2310.13548) quantify how much agreement-seeking sways model beliefs regardless of truth, and judge-bias studies document [position and verbosity biases](https://arxiv.org/abs/2306.05685) — truth-independent swing from pure form. Inverting the [fallacy-detection literature](https://arxiv.org/abs/2410.21360) — from "flag these forms as bad" to "grade every form's measured swing ratio" — is the natural next step. See [What Grounds an Oversight Protocol?](/concepts/oversight-protocols/) for the protocol-level view.

## Prior art: a century of rating systems, almost none for forms

Institutions have rated information for a long time. Sorted by the *unit* each system rates and what its rating *grounds out in*, a pattern emerges:

| System | Unit rated | Grounds out in | Documented failure mode |
|---|---|---|---|
| [Admiralty/NATO code](https://doi.org/10.1080/02684527.2019.1569343) (A–F × 1–6, since the 1940s) | source + item | analyst judgment of track record & corroboration | labels are uncalibrated ("probably true" elicits .53–.90 across officers); ratings collapse to a defensible band (A1+B2 were 80% of all ratings in a US Army exercise) |
| [ACH](https://doi.org/10.1002/acp.3550) (Analysis of Competing Hypotheses) | evidence items vs. hypotheses | analyst consistency judgments | diverges from Bayes; experimental record shows [little-to-no benefit and possible harm](https://doi.org/10.1080/02684527.2024.2304934) |
| [GRADE](https://www.bmj.com/content/336/7650/924) / Cochrane | bodies of evidence, by study design | robustness-to-bias of the *method* | models bias, not strategy: [industry sponsorship](https://doi.org/10.1002/14651858.MR000033.pub3) skews conclusions despite design hierarchies |
| [Daubert](https://www.law.cornell.edu/wex/daubert_standard) | expert methods | testability, error rates, peer review | gatekeeping quality varies with the judge's competence |
| [Wikipedia perennial sources](https://en.wikipedia.org/wiki/Wikipedia:Reliable_sources/Perennial_sources) | publications (five tiers) | editor consensus via RfCs | context-dependence — the list itself warns the same source rates differently per topic |
| [W3C credibility signals](https://credweb.org/signals-20191126) (Credibility Coalition) | claims, articles, sites, creators (~248 signals) | mostly content features | [the group's own warning](https://www.w3.org/community/credibility/): scoring systems become attack targets |
| [CRAAP-style checklists](https://journals.sagepub.com/doi/10.1177/016146811912101102) | web pages | page-internal features | rates exactly what the sender controls (see below) |
| [PageRank](https://www.researchgate.net/publication/200110773_Manipulability_of_PageRank_under_Sybil_Strategies) / [EigenTrust](https://dl.acm.org/doi/10.1145/775152.775242) / marketplace reputation | nodes, sellers, users | link & transaction track record | Sybil and collusion attacks; robust variants make influence cost attack resources |
| [Proper scoring rules](https://doi.org/10.1198/016214506000001437), prediction markets | forecasters | resolution against reality | covers only resolvable claims |
| [FEVER](https://arxiv.org/abs/1803.05355)-style claim verification | individual claims | checkability against a corpus | corpus-bounded; no incentive layer |
| [Fallacy & persuasion-technique detection](https://arxiv.org/abs/2410.21360) | **argument forms** | learned classifiers | rates forms *only negatively*, as anti-credibility signals |

Three cross-cutting lessons, each directly relevant here:

1. **Ratings grounded in sender-controlled features are gameable; ratings grounded externally are robust.** The cleanest demonstration is [Wineburg & McGrew 2019](https://journals.sagepub.com/doi/10.1177/016146811912101102): professional fact-checkers evaluating unfamiliar sites *read laterally* — leaving the page to check external sources — while PhD historians and Stanford undergraduates read vertically and were deceived by fakeable surface features (logos, .org domains, "About" pages). On a task distinguishing the American Academy of Pediatrics from a look-alike advocacy group, every fact-checker got it right; 60% of students picked the look-alike. The authors blame checklist methods explicitly. This is the spectrum's core premise observed in human behavior.
2. **Raters game ratings too.** The Admiralty constriction finding — most ratings retreating to the defensible B2 cell under accountability pressure — means a rating *vocabulary* without calibration incentives transmits less than it claims. Any deployed spectrum needs scoring of the scorers (the [proper scoring rules](https://doi.org/10.1198/016214506000001437) toolbox).
3. **Structured techniques must themselves be validated.** ACH was the intelligence community's flagship method for decades; when finally tested, [it showed little-to-no benefit and possible harm](https://doi.org/10.1080/02684527.2024.2304934). The spectrum's tier assignments deserve the same skeptical empirics it recommends for everything else — which is what the measurement program above is for.

Philosophy supplies two deeper antecedents. [Goldman's veritistic social epistemology](https://doi.org/10.1093/0198238207.001.0001) (*Knowledge in a Social World*, 1999) proposes evaluating social practices — argumentation among them — by their expected truth-conduciveness, a utility function over epistemic practices without the strategic sender or the measurement program. And the [epistemology of testimony](https://plato.stanford.edu/entries/testimony-episprob/) has long debated when a possibly-unreliable speaker's word constitutes evidence at all. The strategic-sender setting also has a policy literature: [epistemic security](https://www.cser.ac.uk/work/epistemic-security/) (Seger et al. 2020) frames defending a society's information-evaluation capacity as a security problem — the spectrum is a candidate piece of that defense.

The gap this page targets, then, is specific: existing systems rate **sources** (Admiralty A–F, Wikipedia tiers, outlet scores), **claims/items** (Admiralty 1–6, ACH rows, FEVER, credibility signals), or — closest to here — **methods** (GRADE's design hierarchy, Daubert's testability gates, both robustness orderings against a *non-strategic* adversary: bias and noise). Argument *forms* appear only as a negative taxonomy — fallacy and propaganda-technique detectors. The two partial anticipations of a *positive*, adversarially-grounded form rating are hearsay's truth-vs-fact-of-statement distinction and Friedman's bet analysis ([above](#why-anything-survives-at-all)) — doctrinal insights, never systematized into a graded, general-purpose map of which forms retain value under a strategic sender. [Walton's argument schemes](https://doi.org/10.1017/CBO9780511802034), each paired with critical questions enumerating exactly that scheme's attack surface, offer a ready-made starting taxonomy for the forms column — qualitative vulnerability checklists awaiting adversarial grading.

## Relation to EIA

EIA and the trust axis are complements: EIA prices *content* — how much a piece of information improves a utility-weighted belief state — while $\tau$-robustness rates *channels* — how much of that price should be believed before a strategic-sender discount. EIA's falsehood-nullification property is exactly the demand that low-tier forms not pay out; a working spectrum is one way to operationalize the discount. The spectrum also generates an infrastructure agenda: it identifies which attestation mechanisms (signed LLM transcripts, run counters, query escrow, third-party process auditors — a natural role for forecasting platforms) move which forms up a tier, and are therefore worth building.

## Open questions

- Is a scalar $\tau$ the right parameterization, or do richer adversary models (partially aligned, budget-limited, capability-gapped) change the ordering of forms?
- Does form-level robustness actually generalize across domains and judges, or does context-dependence reassert itself at the form level too?
- How fine-grained can the taxonomy get before forms become gameable mixtures of one another?
- How should the spectrum handle *composed* arguments, where a high-tier shell (a certified process) wraps a low-tier core (a strategically chosen question)?
- Goodhart dynamics: how quickly do persuaders adapt once the map is public, and which structural properties genuinely resist mimicry?
- Can judges — human-trained or AI-fine-tuned — actually apply the asymmetric policy (engage robust forms, refuse fragile ones), and does it measurably reduce successful manipulation? The lateral-reading result suggests trained policies beat checklists; the ACH record warns that structured methods can fail when finally tested.
- GRADE and Daubert grade *methods* against bias and noise; can method hierarchies be extended to grade against strategic senders — e.g., a design hierarchy that models adversarial choice of which studies to run and publish?
