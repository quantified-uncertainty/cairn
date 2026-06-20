---
title: Patterns & Failure Modes
description: What the academic literature establishes across real-world evaluation systems — reactivity, Goodhart's law, selection bias, certification economics, reputation inflation, and aggregation theory — and what it implies for evaluation engineering.
sidebar:
  order: 4
---

*Status: early draft, synthesized from a June 2026 literature sweep. This is the analytical companion to [Evaluation Systems in the Wild](/concepts/evaluation-systems-in-the-wild/): the catalogue lists ~100 systems; this page asks what is **provably and repeatedly true** across them. Each pattern names a mechanism, the key papers, and the real systems that illustrate it.*

:::caution
Citations and key figures have been verified against their sources. A "~" denotes a rounded or pooled value (e.g. a meta-analytic mean); check the original for exact numbers and confidence intervals.
:::

The findings cluster into five families. The first is the deepest and most distinctive of the field: **a public evaluation does not observe the world, it changes it.**

## 1. The measure reshapes the measured

The single most important finding across the whole literature: deploying a public evaluation is an *intervention*, not an observation. Espeland & Sauder call this **reactivity** — "how public measures recreate social worlds" ([*AJS* 2007](https://doi.org/10.1086/517897); book-length in [*Engines of Anxiety*](https://www.russellsage.org/publications/engines-anxiety), 2016) — and identify two mechanisms:

- **Self-fulfilling prophecy.** Once a measure is authoritative, audiences act on it, making it true. A law school that drops a US News tier gets weaker applicants, less alumni giving, and worse placement — becoming actually worse, confirming the rank.
- **Commensuration** ([Espeland & Stevens, *Ann. Rev. Sociology* 1998](https://doi.org/10.1146/annurev.soc.24.1.313)). Collapsing diverse qualities into one number erases information *and* reorganizes how the rated parties think and allocate effort. Power flows to whoever defines the metric — its categories, inputs, and weights.

Reactivity's destructive twin is **Goodhart's law**, discovered independently three times: [Goodhart](https://en.wikipedia.org/wiki/Goodhart%27s_law) (1975, monetary policy), [Campbell](https://doi.org/10.1016/0149-7189(79)90048-X) (1979, social indicators — and note Campbell's crucial *dose–response* claim: corruption scales with the stakes attached), and Strathern's popular gloss ("when a measure becomes a target, it ceases to be a good measure," [1997](https://doi.org/10.1002/(SICI)1234-981X(199707)5:3%3C305::AID-EURO184%3E3.0.CO;2-4) — often misattributed to Goodhart).

[Manheim & Garrabrant (2018)](https://arxiv.org/abs/1803.04585) give the precise decomposition. When proxy *M* is optimized for hidden goal *G*, four distinct things go wrong — and **two require no bad actor at all**:

| Variant | Mechanism | Adversary needed? |
|---|---|---|
| **Regressional** | *M = G + noise*; the top of *M* selects partly for noise (winner's curse) | No |
| **Extremal** | the *M*–*G* correlation breaks down in the extreme region optimization reaches | No |
| **Causal** | *M* correlates with *G* but isn't causally upstream — intervening doesn't move *G* | No |
| **Adversarial** | an agent who knows you optimize *M* manipulates it (incl. the "cobra effect" where the metric's own incentive backfires) | Yes |

Two further mechanisms complete the picture. **Surrogation** ([Choi, Hecht & Tayler 2012](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1438212)): people don't just game the proxy cynically — they *psychologically substitute* it for the goal, strongest when a single measure is tied to pay. And a behavioral severity ladder ([Bevan & Hood 2006](https://eprints.lse.ac.uk/16211/), on NHS targets): **effort substitution** ("hitting the target and missing the point") → **gaming** (meeting the letter, subverting the purpose) → **outright fabrication**.

The same law reappears in AI as **specification gaming / reward hacking** ([Krakovna et al.](https://vkrakovna.wordpress.com/2018/04/02/specification-gaming-examples-in-ai/)) — an agent maximizes the literal reward while violating intent. Evaluation engineering, which proposes to *automate* evaluation, inherits this directly.

**Seen in the wild:** US News rankings (reactivity — schools restructure around the formula; [a 2022–23 revolt](https://www.usnews.com/best-colleges) saw many top law/medical schools withdraw); Journal Impact Factor (adversarial — coercive self-citation, [Wilhite & Fong, *Science* 2012](https://doi.org/10.1126/science.1212540); citation cartels); credit ratings (adversarial — issuer "ratings shopping"); NHS waiting-time gaming; cardiac-surgery report cards (cobra effect — surgeons avoid sick patients, below).

> **Design implication.** A robust evaluation must be *invariant to everything but the truth it measures* — the organizing concern of the sibling [RRP](https://github.com/quantified-uncertainty/cairn) wiki. Reactivity says the feedback loop (being measured → optimizing the proxy) is the enemy; provenance and control of the metric definition is the master lever.

## 2. The ratings you collect are a biased sample

Even setting aside gaming, the raw ratings entering a system are not a clean sample of quality.

- **Distributions are J-shaped / bimodal, from self-selection.** Online ratings pile up at 5 stars with a 1-star spike and little middle ([Hu, Pavlou & Zhang, *CACM* 2009](https://dl.acm.org/doi/10.1145/1562764.1562800); [*MISQ* 2017](https://misq.umn.edu/misq/article/41/2/449/335/On-Self-Selection-Biases-in-Online-Product)). Two mechanisms: **acquisition bias** (buyers already liked the product) and **under-reporting / "brag-and-moan" bias** (only extreme experiences bother to review). The mean is therefore a biased signal; the full distribution predicts behavior better.
- **Social influence herds, asymmetrically.** In a randomized experiment on >100,000 comments, a single seeded *positive* vote made the next viewer ~32% more likely to up-vote and, through accumulating herding, raised the comment's final mean rating by ~25%; a seeded *negative* vote was *corrected* by the crowd ([Muchnik, Aral & Taylor, *Science* 2013](https://doi.org/10.1126/science.1240466)). Positive herding accumulates; negative does not.
- **Expert review has low inter-rater reliability.** A meta-analysis of peer review (48 studies, ~19,443 manuscripts) found mean agreement ICC ≈ 0.34, κ ≈ 0.17 ([Bornmann, Mutz & Daniel, *PLoS ONE* 2010](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0014331)); the classic NSF re-review found funding "depends to a significant extent on chance" — i.e., on *which* reviewers are drawn ([Cole, Cole & Simon, *Science* 1981](https://doi.org/10.1126/science.7302566)).
- **Scales drift and compress.** Grade inflation is the canonical case: the A-share rose from ~15% of grades (1940) to over 40% (2008), making A the most common grade ([Rojstaczer & Healy 2012](https://www.gradeinflation.com/tcr2012grading.pdf)). The ceiling compresses and the signal degrades — the same shape as reputation inflation (§4).
- **Fakes are detectable but persistent.** Deceptive reviews have linguistic signatures a classifier catches at ~90% where humans are near chance ([Ott et al., *ACL* 2011](https://aclanthology.org/P11-1032/)); requiring a verified purchase raises the cost of faking and measurably reduces — but doesn't eliminate — manipulation ([Mayzlin, Dover & Chevalier, *AER* 2014](https://www.aeaweb.org/articles?id=10.1257/aer.104.8.2421)).

**Seen in the wild:** Amazon's J-shape (and its Verified-Purchase badge as the Mayzlin fix); IMDb's 1/10 polarization (and its Bayesian weighting as the §5 fix); Reddit/HN early-vote snowball (and vote-fuzzing / "controversial" sort as countermeasures); peer review and grant panels (low reliability → motivates more reviewers + calibration).

> **Design implication.** Never treat the mean of self-selected ratings as the quality signal. Verify *who* is evaluating, model the selection process, and prefer distribution-aware metrics.

## 3. Incentives and funding decide trustworthiness — more than method does

The economics of quality disclosure explains why the [catalogue's](/concepts/evaluation-systems-in-the-wild/) most-trusted and most-failed systems differ by *funding structure*, not technique. (This is the formal backbone of the [audit & ratings](/reference/adjacent-fields/) section.)

- **Quality information is valuable because of adverse selection.** When buyers can't tell quality, good sellers exit and markets collapse to "lemons" ([Akerlof, *QJE* 1970](https://academic.oup.com/qje/article-abstract/84/3/488/1896241)). Evaluation systems exist to restore those lost gains from trade.
- **A signal works only if it's differentially costly** to fake for low-quality types ([Spence, *QJE* 1973](https://academic.oup.com/qje/article-abstract/87/3/355/1909092)). The design question is always: *can a bad type cheaply mimic this?*
- **Voluntary disclosure should "unravel" to full disclosure — but often doesn't,** because receivers aren't fully skeptical, disclosure is costly, the sender may not know its own quality, and quality is multidimensional ([Grossman 1981](https://ideas.repec.org/a/ucp/jlawec/v24y1981i3p461-83.html); [Milgrom 1981](https://milgrom.people.stanford.edu/wp-content/uploads/1981/10/Good-News-and-Bad-News.pdf); survey: [Dranove & Jin, *JEL* 2010](https://www.aeaweb.org/articles?id=10.1257/jel.48.4.935)). This is the case for *mandatory* disclosure.
- **When the rated party pays, the certifier prefers a coarse, lenient signal.** A profit-maximizing monopoly certifier optimally reveals only whether quality clears a low threshold ([Lizzeri, *RAND* 1999](https://ideas.repec.org/a/rje/randje/v30y1999isummerp214-231.html)); issuer-pays adds ratings shopping and inflation, worse in booms ([Bolton, Freixas & Shapiro, *J. Finance* 2012](https://onlinelibrary.wiley.com/doi/10.1111/j.1540-6261.2011.01708.x)). Reputation disciplines certifiers only under strong conditions, and price *competition* can erode honesty rather than improve it ([Strausz 2005](https://www.sciencedirect.com/science/article/abs/pii/S0167718704001092)) — so "just add competitors" is not a clean fix.
- **Disclosure backfires when the rated party games the input mix instead of improving.** Cardiac-surgery report cards led surgeons to avoid sick patients, worsening outcomes for the sickest ([Dranove, Kessler, McClellan & Satterthwaite, *JPE* 2003](https://www.journals.uchicago.edu/doi/abs/10.1086/374180)). It *works* when the metric resists gaming and demand responds: LA restaurant hygiene grade cards raised scores, shifted demand, and cut foodborne-illness hospitalizations partly via real improvement ([Jin & Leslie, *QJE* 2003](https://academic.oup.com/qje/article-abstract/118/2/409/1899578)).
- **Too many labels destroy a label's value** — the "Groucho effect": small uncertainty about what a label *means* makes consumers infer the labeled product is marginal ([Harbaugh, Maxwell & Roussillon, *Mgmt Sci* 2011](https://pubsonline.informs.org/doi/abs/10.1287/mnsc.1110.1412)).
- **Gatekeepers fail in correlated, predictable ways** when they rent their reputation to the issuer who pays them ([Coffee, *Gatekeepers* 2006](https://global.oup.com/academic/product/gatekeepers-9780199288090)) — Enron, WorldCom, the 2008 ratings.

**Seen in the wild:** credit ratings (issuer-pays → inflation); LEED/B-Corp/ISO (fee-for-cert → threshold-gaming, label proliferation); hospital report cards (cream-skimming); restaurant hygiene (independent inspector + hard-to-game metric → it works).

> **Design implication.** Credible evaluation needs (a) a non-gameable, differentially-costly signal, (b) an independent payer or strong reputational stake, (c) skeptical receivers, and (d) a clear standard. Mandatory, standardized, risk-adjusted, hard-to-game disclosure beats voluntary issuer-paid coarse certification.

## 4. Reputation systems converge on the same arms race

Online-marketplace reputation has been studied enough to expose a recurring lifecycle.

- **Reputation is real but modestly priced.** A matched-item eBay field experiment found established reputation raised willingness-to-pay ~8% ([Resnick et al., *Exp. Econ.* 2006](https://link.springer.com/article/10.1007/s10683-006-4309-2)).
- **Reputation inflation is the central pathology.** eBay feedback runs ~99% positive — so even high-90s scores are unremarkable and barely discriminate between sellers ([Nosko & Tadelis, NBER 2015](https://www.nber.org/papers/w20830)). Cheap-to-give positives + costly negatives drive the pile-up.
- **Bilateral feedback causes retaliation,** so platforms moved to **blind / simultaneous-reveal or one-sided** feedback ([Bolton, Greiner & Ockenfels, *Mgmt Sci* 2013](https://pubsonline.informs.org/doi/10.1287/mnsc.1120.1609)) — the fix is changing *information flow*, not exhortation.
- **But selection bias often dominates retaliation:** on Airbnb, *who chooses to review* biases scores more than retaliation, with "socially induced reciprocity" from face-to-face contact suppressing negatives ([Fradkin et al., *EC* 2015](https://dl.acm.org/doi/10.1145/2764468.2764528)).
- **Cheap pseudonyms enable whitewashing** — abandon a bad identity, re-enter clean — so cooperation survives only via a costly "newcomers pay dues" convention ([Friedman & Resnick 2001](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1430-9134.2001.00173.x)); and without a trusted identity authority one party can mint many fake identities (the **Sybil attack**, [Douceur 2002](https://www.freehaven.net/anonbib/cache/sybil.pdf)) — the engine of fake reviews and ballot-stuffing.
- **Cold start is an efficiency loss, not just unfairness:** newcomers can't get the first transaction that would build reputation; subsidizing it and publishing detailed evaluations raised later earnings enough to prove they were inefficiently excluded ([Pallais, *AER* 2014](https://www.aeaweb.org/articles?id=10.1257/aer.104.11.3565)). (Foundational survey: [Tadelis, *Ann. Rev. Econ.* 2016](https://faculty.haas.berkeley.edu/stadelis/Annual_Review_Tadelis.pdf).)

**Seen in the wild:** eBay (the most-studied — inflation, retaliation→one-sided ratings, EPP search ranking); Airbnb (double-blind reveal; selection bias; "New listing" badges); Uber (ceiling compression ~4.6+; face-to-face suppression; driver re-registration); Amazon/Yelp (Sybil fakes and the filters that fight them).

> **Design implication.** Verifying *who* evaluates — tying identity to a scarce resource — is the recurring fix, and the information-flow design (blind, one-sided, recency-weighted) matters as much as the rating scale. This is the [trust-network](/concepts/techniques/) problem in miniature.

## 5. The scale and the aggregation rule are not neutral

How you collect and combine ratings changes the answer — there is no neutral default.

- **Naive averages mis-rank low-volume items.** A 100%-positive item with 2 votes outranks a 95%-positive item with 500 under mean sorting. Two principled fixes: the **Wilson score lower bound** for binary votes ([Evan Miller, 2009](https://www.evanmiller.org/how-not-to-sort-by-average-rating.html); Reddit's "best" sort) and **Bayesian shrinkage** toward a global prior weighted by volume ([IMDb's Top-250 formula](https://help.imdb.com/article/imdb/track-movies-tv/ratings-faq/G67Y87TFYYP6TWAV); [Trustpilot's TrustScore](https://support.trustpilot.com/hc/en-us/articles/201748946)). Both regularize the **cold-start** problem.
- **Binary can beat fine-grained.** Up/down collapses scaling idiosyncrasies into one clean Bernoulli parameter; fine scales add interpretation variance — and 5-star scales already behave bimodally (§2). For *aggregate ranking* you can use a coarse per-rater scale and recover resolution from volume.
- **Optimal scale granularity is ~7 ± 2.** Reliability/validity rise to about 7 points and plateau by 7–10; beyond ~10 they decline ([Preston & Colman, *Acta Psychologica* 2000](https://pubmed.ncbi.nlm.nih.gov/10769936/)).
- **Pairwise comparison often beats absolute scores.** Humans judge "is A better than B?" more reliably than "rate A 1–5"; [Bradley–Terry (1952)](https://www.jstor.org/stable/2334029) / Elo model this and sidestep scale-anchoring — now used to rank LLMs in preference arenas. (Caveat: online Elo is order-sensitive; the static MLE is more robust; cyclic preferences break the model.)
- **The aggregation rule materially changes the ranking.** Mean vs. median vs. Bayesian vs. positional **Borda** vs. **Kemeny** (the maximum-likelihood, Condorcet-consistent — but NP-hard — rule) give genuinely different winners on the same votes ([Dwork et al., *WWW* 2001](http://static.cs.brown.edu/courses/csci2531/papers/rank2.pdf)). Arrow-style impossibility lurks underneath: there is no canonical "correct" aggregator.

**Seen in the wild:** IMDb (Bayesian shrinkage), Reddit (Wilson lower bound), Trustpilot (Bayesian + recency decay), chess/LLM leaderboards (Elo / Bradley–Terry), meta-search and committees (Borda/Kemeny).

> **Design implication.** Choosing the [output format and aggregation rule](/concepts/the-systems-view/) is choosing your failure mode and partly choosing your answer. Make it explicit and defensible; for sparse data, regularize (Wilson or Bayesian); when raters are noisy, prefer pairwise.

## What this means for evaluation engineering

Pulling the five families together:

1. **Deploying an evaluation is world-making, not world-describing.** Reactivity and Goodhart guarantee the rated parties will optimize the proxy. A system that ignores its own feedback loop will be gamed into uselessness. Design for invariance to everything but the truth.
2. **Funding structure predicts trustworthiness better than methodology.** The master lever is *who pays the evaluator and who controls the metric's definition* — matching both the [catalogue's](/concepts/evaluation-systems-in-the-wild/) headline pattern and the certification economics here.
3. **Raw ratings are a biased, gameable sample;** verification of *who evaluates* and distribution-aware aggregation are not optional polish — they are the difference between signal and noise.
4. **Every output format and aggregation rule embeds a choice** with predictable, different failure modes. None is neutral.
5. **The hard problems are old and partly solved.** Adverse selection, signaling, unraveling, reputation inflation, Wilson/Bayesian aggregation, the reactivity of public measures — these have decades of theory and evidence. An automated, LLM-powered evaluation system should treat this literature as its spec sheet, not rediscover it.

## Core references by theme

- **Reactivity & quantification:** Espeland & Sauder (AJS 2007); Espeland & Stevens (1998, 2008); Porter, *Trust in Numbers* (1995); Power, *The Audit Society* (1997); Merry, *The Seductions of Quantification* (2016); Muller, *The Tyranny of Metrics* (2018); Davis, Kingsbury & Merry, *Governance by Indicators* (2012).
- **Goodhart & gaming:** Goodhart (1975); Campbell (1979); Strathern (1997); Manheim & Garrabrant (2018); Bevan & Hood (2006); Choi, Hecht & Tayler (2012/2013); Krakovna (specification gaming).
- **Rating bias:** Muchnik, Aral & Taylor (2013); Hu, Pavlou & Zhang (2009, 2017); Godes & Silva (2012); Bornmann et al. (2010); Cole et al. (1981); Ott et al. (2011); Mayzlin et al. (2014); Rojstaczer & Healy (2012).
- **Certification & disclosure:** Akerlof (1970); Spence (1973); Grossman (1981); Milgrom (1981); Lizzeri (1999); Strausz (2005); Dranove & Jin (2010); Dranove et al. (2003); Jin & Leslie (2003); Bolton, Freixas & Shapiro (2012); Harbaugh et al. (2011); Coffee (2006).
- **Reputation systems:** Resnick et al. (2000); Dellarocas (2003); Resnick & Zeckhauser (2002); Resnick et al. (2006); Friedman & Resnick (2001); Douceur (2002); Bolton, Greiner & Ockenfels (2013); Nosko & Tadelis (2015); Fradkin et al. (2015); Pallais (2014); Tadelis (2016); Jøsang, Ismail & Boyd (2007).
- **Scales & aggregation:** Evan Miller (2009); Wilson (1927); Preston & Colman (2000); Bradley & Terry (1952); Elo (1978); Dwork et al. (2001); Hunter (2004).

See [Adjacent Fields & Literature](/reference/adjacent-fields/) for the broader disciplines and [Evaluation Systems in the Wild](/concepts/evaluation-systems-in-the-wild/) for the systems these patterns describe.
