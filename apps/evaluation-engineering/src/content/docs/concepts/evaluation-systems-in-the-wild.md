---
title: Evaluation Systems in the Wild
description: A catalogue of ~100 real-world evaluation systems — from RTINGS and IMDb to credit ratings, Michelin, and the Corruption Perceptions Index — and what they teach about building evaluation systems.
sidebar:
  order: 3
---

*Status: early draft / curated catalogue, assembled from a June 2026 sweep. This is the descriptive companion to the conceptual pages: the world is already full of standing systems that produce many evaluations of a repeated type. They are the field's natural experiments — its documented successes, failures, and capture stories. The founding program called for exactly this survey (the proto "process catalogue").*

:::caution
A working catalogue, not a reference. Systems and links are verified, but **exact figures (coverage counts, market shares, percentages) are approximate and should be checked against the source** before relying on them. Where a number is load-bearing, follow the link.
:::

## How to read this

Every entry names **what it evaluates**, its **output format**, its **method**, and one **notable weakness or failure**. Before the catalogue, four cross-cutting lenses that the ~100 systems below keep illustrating:

**Method archetypes.** Independent lab testing · professional anonymous inspection · expert panel/committee · critic aggregation · crowd reviews (often Bayesian/credibility-weighted) · two-sided/reciprocal rating · statistical/algorithmic model · composite index · market-based · regulatory review. These are the menu on [Evaluation Methods](/concepts/evaluation-methods/), seen in the wild.

**Output formats.** Stars (1–5), points (0–100), letter grades (A–F, AAA–D), rankings, pass/fail certification, tiers, probabilities, and dollar estimates. The format is an editorial choice with consequences — binary "fresh/rotten" discards intensity; 100-point wine scales compress to 88–100.

**Funding determines capture risk** — the single most predictive variable, echoing the [audit/ratings literature](/reference/adjacent-fields/) and the [trust-network](/concepts/techniques/) and [candidness](/concepts/epistemic-culture/) discussions. Three archetypes:
1. **Independent / nonprofit, buys its own units, no ads** (Consumer Reports, Which?, Stiftung Warentest, IIHS) — strongest independence.
2. **Affiliate / ad-funded editorial** (Wirecutter, RTINGS, CNET) — recommendation-revenue conflict.
3. **Rated party pays** — issuer-pays ratings, fee-for-certification, award-licensing (Moody's/S&P, UL, ISO, LEED, J.D. Power, DXOMARK) — highest capture exposure.

**Recurring failure modes.** Fake reviews / astroturfing / review bombing · gaming and Goodharting (citations, ratings) · capture (credit ratings in 2008; the World Bank's *Doing Business* scandal) · pay-to-play · grade inflation · self-declaration abuse · snapshot-in-time validity · reciprocal retaliation in two-sided systems · opaque weighting.

---

## Consumer products & testing

- **[Consumer Reports](https://www.consumerreports.org/)** — consumer products & services. 0–100 scores + "Recommended"/"Best Buy". Independent lab testing + member reliability surveys; nonprofit, buys all units at retail, no ads. *Weakness:* affiliate-link revenue creates a perceived conflict.
- **[Which?](https://www.which.co.uk/)** (UK) — products & services. Scores + "Best Buy"/"Don't Buy". Independent lab testing; nonprofit, no manufacturer money.
- **[Stiftung Warentest](https://www.test.de/)** (Germany) — products & services. German school-grade scale, printed on packaging. Undercover purchasing + outsourced scientific testing; ad-free, government-seeded foundation. *Weakness:* sued by manufacturers ~10×/year.
- **[CHOICE](https://www.choice.com.au/)** (Australia) — products & services. Scores + "CHOICE Recommended". Accredited in-house labs; nonprofit.
- **[Wirecutter](https://www.nytimes.com/wirecutter/)** (NYT) — consumer gear. Narrative "top pick"/"budget pick", no scores. Hands-on reviewer testing; affiliate revenue, no on-site ads.
- **[RTINGS](https://www.rtings.com/)** — TVs, monitors, headphones, etc. 0–100 overall + per-use-case scores. Standardized in-house bench measurements. *Weakness:* 2025 scoring overhaul drew backlash over weighting; 2026 paywall.
- **[DXOMARK](https://www.dxomark.com/)** — camera/phone image, audio, display. Open-scale scores + sub-scores. Lab + structured perceptual testing. *Weakness:* core conflict — sells consulting to the firms it scores.
- **[Tom's Hardware](https://www.tomshardware.com/)** / **[PCMag](https://www.pcmag.com/)** — PC components/devices. Stars + "Editors' Choice" + hierarchy charts. Standardized benchmarking labs; affiliate + ads.
- **[J.D. Power](https://www.jdpower.com/business)** — vehicle quality/satisfaction. PP100 (problems per 100) + segment awards. Large owner surveys. *Weakness:* clients are the automakers; winners license the awards to advertise.
- **[Kelley Blue Book](https://www.kbb.com/)** / **[Edmunds](https://www.edmunds.com/)** — vehicle valuation & reviews. Dollar values (TMV / Blue Book Value). Statistical models on transaction data. *Weakness:* dealer-referral revenue; values can diverge from actual sales.
- **[Robert Parker / Wine Advocate](https://www.robertparker.com/)**, **[Wine Spectator](https://www.winespectator.com/)** — wine. 100-point scale. Professional critics, often blind. *Weakness:* "Parker palate" homogenization; score compression into 88–100.
- **[Untappd](https://untappd.com/)**, **[BeerAdvocate](https://www.beeradvocate.com/)**, **[RateBeer](https://www.ratebeer.com/)** — beer. Crowd star/score averages. *Weakness:* hype/novelty bias; RateBeer is owned by AB InBev (BeerAdvocate/Untappd by Next Glass) — big-brewer ownership of the rater.
- **[Coffee Review](https://www.coffeereview.com/)** — coffee. 100-point scale. Expert blind cupping. *Weakness:* pay-to-submit service; mostly 90+ published.
- **[America's Test Kitchen / Cook's Illustrated](https://www.americastestkitchen.com/)** — kitchen gear, ingredients, recipes. Tiered verdicts. Expert panels, blind taste tests, heavy repeated testing; no ads.

## Media, entertainment & content

- **[IMDb](https://www.imdb.com/)** — films, TV, people. 1–10 Bayesian-weighted average; "Top 250". Crowd votes. *Weakness:* vote brigading; demographic skew; polarized 1/10 voting.
- **[Rotten Tomatoes](https://www.rottentomatoes.com/)** — film/TV. % "fresh" critics + audience score. Binary critic aggregation (discards intensity). *Weakness:* review bombing of audience scores; binary loses nuance.
- **[Metacritic](https://www.metacritic.com/)** — film/TV/games/music. 0–100 Metascore. Weighted critic average. *Weakness:* undisclosed weights; user-score review bombing.
- **[OpenCritic](https://opencritic.com/)** — games. Top Critic Average (transparent, unweighted mean). *Weakness:* no user component; small samples for niche titles.
- **[Steam user reviews](https://store.steampowered.com/)** — games. Positive/negative tiers, "Recent" vs "All-time". Owner-gated binary. *Weakness:* protest review bombing.
- **[Goodreads](https://www.goodreads.com/)** — books. 1–5 simple average. Crowd, minimal verification. *Weakness:* sockpuppet scandals; pre-publication bombing of unreleased books.
- **[Letterboxd](https://letterboxd.com/)** — film. 0.5–5 stars, weighted average. Cinephile crowd.
- **[RateYourMusic](https://rateyourmusic.com/)** — music. Credibility-weighted crowd charts. *Weakness:* opaque user-weighting; canon/obscurity skew.
- **[MyAnimeList](https://myanimelist.net/)** / **[AniList](https://anilist.co/)** — anime/manga. Bayesian-weighted scores. *Weakness:* score inflation; seasonal brigading.
- **[Billboard charts](https://www.billboard.com/charts/)** — songs/albums. Weekly ranking. Statistical blend of streams + sales + airplay. *Weakness:* bundling/stream-campaign manipulation; opaque weights.
- **[Pitchfork](https://pitchfork.com/)** — albums. Single critic 0.0–10.0. *Weakness:* single-reviewer subjectivity.
- **[Nielsen](https://www.nielsen.com/)** — TV/streaming audience. Ratings/share. Panel + (since 2025) big-data hybrid. *Weakness:* panel sampling error for niche audiences; clients are the rated networks.
- **[Common Sense Media](https://www.commonsensemedia.org/)** — media for kids. Age (2–18) + 5-star quality. Expert reviewers on child-development criteria; nonprofit.
- **Age/content boards** — **[MPA](https://www.motionpictures.org/film-ratings/)** (G–NC-17, anonymous parent panel), **[ESRB](https://www.esrb.org/)** (games), **[PEGI](https://pegi.info/)** (games). Self-regulatory; rely on publisher disclosure (hidden content can slip).

## Finance, credit, insurance & risk

- **[FICO](https://www.fico.com/)** / **[VantageScore](https://en.wikipedia.org/wiki/VantageScore)** — consumer credit. 300–850. Proprietary statistical model. *Weakness:* opacity; thin-file exclusion; entrenched gatekeeper.
- **Credit bureaus** — **[Experian](https://www.experian.com/)**, **[Equifax](https://www.equifax.com/)**, **[TransUnion](https://www.transunion.com/)**. Full credit reports. Data aggregation. *Weakness:* common data errors hard to dispute; the 2017 Equifax breach (~147M people).
- **Bond/sovereign ratings** — **[Moody's](https://www.moodys.com/)**, **[S&P Global](https://www.spglobal.com/ratings/)**, **[Fitch](https://www.fitchratings.com/)**. AAA–D letter scales. Analyst committee + models, **issuer-pays**. *Weakness:* the canonical capture story — inflated AAA on mortgage CDOs, ~\$864M+ settlements after 2008.
- **[Morningstar](https://www.morningstar.com/)** — funds/stocks. 1–5 stars (quant, backward-looking), Medalist (forward-looking), Economic Moat. *Weakness:* star ratings weakly predict future performance; "star chasing".
- **ESG ratings** — **[MSCI](https://www.msci.com/our-solutions/esg-investing/esg-ratings)** (AAA–CCC), **[Sustainalytics](https://www.sustainalytics.com/)** (0–100 risk), **[S&P Global ESG](https://www.spglobal.com/esg/)**. *Weakness:* ratings divergence — inter-rater correlation ~0.54 vs. ~0.92 for credit ratings ([MIT "Aggregate Confusion"](https://academic.oup.com/rof/article/26/6/1315/6590670)).
- **[A.M. Best](https://www.ambest.com/)** — insurer financial strength. A++–F. Insurance-specialist analysis; largely issuer-pays.
- **Credit-based insurance scores** — **[LexisNexis](https://risk.lexisnexis.com/products/attract)**, FICO. Risk scores for underwriting. *Weakness:* fairness/proxy-discrimination concerns; restricted or banned in several US states.
- **[Zillow Zestimate](https://www.zillow.com/zestimate/)** — home value. Dollar estimate + range. ML automated valuation. *Weakness:* off-market median error ~7%; ignores condition; "not an appraisal".
- **Cyber risk** — **[BitSight](https://www.bitsight.com/security-ratings)** (250–900), **[SecurityScorecard](https://securityscorecard.com/)** (A–F), **[CVSS](https://www.first.org/cvss/)** (0–10, open standard). *Weakness:* external-only signals; CVSS severity routinely conflated with risk → "everything is Critical".
- **[Dun & Bradstreet PAYDEX](https://www.dnb.com/)** — business payment reliability. 1–100. Vendor-reported trade data.

## Academia, science & education

- **Scholarly peer review** — manuscripts. Accept/revise/reject. Expert review, mostly unpaid. *Weakness:* low inter-rater reliability ("lottery"); slow; weak fraud screening.
- **[Journal Impact Factor](https://jcr.clarivate.com/)** (Clarivate) — journals. Citation ratio. *Weakness:* heavily gamed (coercive/self-citation, cartels); [DORA](https://sfdora.org/) condemns its use to judge individuals.
- **h-index** — authors. Single integer (productivity × impact). *Weakness:* field-dependent; gameable via self-citation; can't decrease.
- **Citation databases** — **[Web of Science](https://clarivate.com/)**, **[Scopus](https://www.scopus.com/)** (Elsevier — also a publisher), **[Google Scholar](https://scholar.google.com/)** (widest, least curated).
- **[Altmetric](https://www.altmetric.com/)** — online attention. Weighted "donut" score. *Weakness:* measures attention, not quality; gameable.
- **University rankings** — **[QS](https://www.topuniversities.com/world-university-rankings)**, **[THE](https://www.timeshighereducation.com/world-university-rankings)** (reputation-survey heavy), **[ARWU/Shanghai](https://www.shanghairanking.com/)** (objective, prize-weighted), **[US News](https://www.usnews.com/best-colleges)** (self-reported data enabled the Columbia fraud; 2023 boycott), **[Leiden](https://www.leidenranking.com/)** (bibliometric, deliberately no composite).
- **[REF](https://2029.ref.ac.uk/)** (UK Research Excellence Framework) — university research. 4*–1* profiles. Expert panel review; allocates ~£2B/yr. *Weakness:* very high administrative cost.
- **[GRADE](https://www.gradeworkinggroup.org/)** / **[Cochrane RoB 2](https://methods.cochrane.org/risk-bias-2)** — evidence quality / trial bias. Tiered ratings. Structured expert rating. *Weakness:* domain judgments still subjective.
- **Standardized tests** — **[SAT/ACT](https://satsuite.collegeboard.org/sat)**, **[GRE](https://www.ets.org/gre.html)**, **[PISA](https://www.oecd.org/en/about/programmes/pisa.html)**, **[TIMSS](https://www.iea.nl/studies/iea/timss)**. *Weakness:* scores track family income; teaching-to-the-test.
- **School ratings** — **[GreatSchools](https://www.greatschools.org/)** (1–10; historically correlated with race/affluence), **[Ofsted](https://reports.ofsted.gov.uk/)** (England; replaced single-word grades with report cards in 2025 after criticism).
- **Accreditation** — **[ABET](https://www.abet.org/)** (engineering/computing), **[AACSB](https://www.aacsb.edu/)** (business schools), US institutional accreditors (Title IV gatekeepers). *Weakness:* peers accredit peers (conflict); slow on failing schools.

## Health, safety, standards & certification

- **Hospital ratings** — **[CMS star ratings](https://www.medicare.gov/care-compare/)** (1–5, federal), **[Leapfrog](https://www.hospitalsafetygrade.org/)** (A–F safety), **[US News Best Hospitals](https://health.usnews.com/best-hospitals)**, **[Healthgrades](https://www.healthgrades.com/)**. *Weakness:* CMS criticized for penalizing complex/teaching hospitals; Healthgrades sells ads to the hospitals it rates.
- **Restaurant hygiene** — **[NYC letter grades](https://www.nyc.gov/site/doh/business/food-operators/letter-grading-for-restaurants.page)** (A/B/C), **[UK Food Hygiene Rating Scheme](https://www.food.gov.uk/safety-hygiene/food-hygiene-rating-scheme)** (0–5). Unannounced inspections; municipal, no fee-for-grade. *Weakness:* snapshot validity; inspection inconsistency.
- **Drug/device** — **[FDA](https://www.fda.gov/)**, **[EMA](https://www.ema.europa.eu/)**, **[NICE](https://www.nice.org.uk/)** (cost-per-QALY HTA). Approve/not. Expert regulatory review. *Weakness:* user-fee funding criticized as "cozy"; QALY thresholds called arbitrary.
- **Crash tests** — **[IIHS](https://www.iihs.org/)** (Good–Poor + Top Safety Pick; insurer-funded, independent of makers), **[Euro NCAP](https://www.euroncap.com/)** (0–5 stars), **[NHTSA 5-Star](https://www.nhtsa.gov/ratings)** (most cluster at 4–5★). *Weakness:* limited scenario set; "test to the test".
- **Product safety** — **[UL](https://www.ul.com/)** (lab testing + factory audits, fee-for-cert), **[CE marking](https://europa.eu/youreurope/business/product-requirements/labels-markings/ce-marking/index_en.htm)** (mostly self-declared). *Weakness:* UL cost barrier + counterfeit marks; CE self-declaration is gameable.
- **Energy** — **[Energy Star](https://www.energystar.gov/)** (a 2010 GAO sting certified a gas-powered "alarm clock" → triggered third-party testing), **[EU energy label](https://energy-efficient-products.ec.europa.eu/)** (A–G; rescaled 2021).
- **[ISO 9001 certification](https://www.iso.org/iso-9001-quality-management.html)** — quality-management systems. Pass/fail + surveillance audits. Third-party audit, **client pays the auditor**. *Weakness:* "audit shopping"; certifies process not outcome.
- **[LEED](https://www.usgbc.org/leed)** — green buildings. Certified–Platinum, points-based; fee-for-cert. *Weakness:* design- not performance-based — certified buildings don't reliably use less energy.
- **[B Corp](https://www.bcorporation.net/)** — whole-company social/environmental. Pass/fail seal (≥80/200); fee-for-cert. *Weakness:* bar seen as low; Dr. Bronner's dropped the cert in 2025 over multinational dilution.
- **Food/agriculture** — **[USDA Organic](https://www.ams.usda.gov/about-ams/programs-offices/national-organic-program)**, **[Fairtrade](https://www.fairtrade.net/)**, **[MSC](https://www.msc.org/)** seafood (logo-royalty conflict), **[Rainforest Alliance](https://www.rainforest-alliance.org/)**. *Weakness:* royalty/fee models create incentives to certify generously.

## Hospitality, travel & local business

- **[Michelin Guide](https://guide.michelin.com/)** — restaurants/hotels. 1–3 stars. Professional anonymous inspectors, multiple visits. *Weakness:* tourism boards increasingly pay for regional entry (conflict); fine-dining/Eurocentric bias.
- **[AAA Diamonds](https://www.aaa.com/diamonds/)** — N. American hotels/restaurants. 1–5 Diamonds. Anonymous inspectors; nonprofit. **[Forbes Travel Guide](https://www.forbestravelguide.com/)** — luxury. 4–5 Star. Inspectors on ~900 standards. *Weakness:* Forbes also sells training on how to earn its ratings.
- **Hotel star systems** — accommodations. 1–5 stars. **[Hotelstars Union](https://www.hotelstars.eu/)** standardizes 21 European countries; the US has no government system (self-declared "5-star" is meaningless).
- **[Yelp](https://www.yelp.com/)** — local businesses. 1–5 stars + automated review filter. *Weakness:* long-running extortion / pay-to-play allegations.
- **[TripAdvisor](https://www.tripadvisor.com/)** — travel. 1–5 bubbles. Crowd, no proof of stay. *Weakness:* a 2018 investigation alleged ~1 in 3 reviews fake; 200k+ AI-generated reviews removed in 2024.
- **[Google Reviews](https://maps.google.com/)** — places. 1–5 stars + AI moderation. *Weakness:* ~240M fake reviews removed in 2024; extortion scams at scale.
- **[Booking.com](https://www.booking.com/reviews_guidelines.html)** / **Hotels.com** — accommodations. Score /10, **verified guests only**, recency-weighted. *Weakness:* commission model is a structural conflict.
- **[Trustpilot](https://www.trustpilot.com/)** — businesses. TrustScore (Bayesian-weighted). *Weakness:* paying businesses get more tools (two-tier criticism).
- **[BBB grades](https://www.bbb.org/)** — business trustworthiness. A+–F. Composite + accreditation fees. *Weakness:* a 2010 sting got a fake company an A+ for ~\$425 (pay-for-grade).
- **[Glassdoor](https://www.glassdoor.com/)** — employers. 1–5 stars, anonymous, "give to get". *Weakness:* anonymity enables fakes; the rated employer pays the host.

## Online platforms & reputation systems

- **[eBay feedback](https://www.ebay.com/help/buying/resolving-issues-sellers/seller-ratings?id=4023)** — sellers. % positive + detailed star ratings. Transaction-linked. *Weakness:* extreme grade inflation; seller retaliation led eBay to bar negative buyer feedback.
- **[Amazon reviews](https://www.amazon.com/)** — products/sellers. 1–5 stars + Verified Purchase. ML-weighted crowd. *Weakness:* persistent fake/incentivized reviews; the FTC's 2024 fake-review rule targets this.
- **[Airbnb](https://www.airbnb.com/)** — hosts/guests. 1–5 stars, **double-blind reveal**, Superhost badge. *Weakness:* retaliation/extortion via review leverage; strong inflation (~4.8+ norm).
- **[Uber](https://www.uber.com/)** / **[Lyft](https://www.lyft.com/)** — drivers/riders. 1–5 reciprocal rolling average. *Weakness:* drivers deactivated below ~4.6; a 2020 suit alleged aggregating biased customer ratings is discriminatory.
- **[DoorDash](https://help.doordash.com/)** — Dashers. 1–5 (last 100) + completion %. *Weakness:* low deactivation thresholds; ratings reflect restaurant/app delays outside the driver's control.
- **[Stack Overflow reputation](https://stackoverflow.com/help/whats-reputation)** — Q&A expertise. Points + privilege tiers. *Weakness:* voting rings / sockpuppets ([study](https://arxiv.org/abs/2111.07101)).
- **[GitHub stars](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars)** — repo popularity. Integer count. *Weakness:* a fake-star economy — millions of bought stars, often promoting malware ([study](https://arxiv.org/html/2412.13459v2)).
- **[Reddit karma](https://support.reddithelp.com/hc/en-us/articles/204511829-What-is-karma)** — contribution. Numeric. *Weakness:* karma farming via reposts/bots.
- **App store ratings** — **[Apple](https://developer.apple.com/app-store/ratings-and-reviews/)** (legacy ratings persist), **[Google Play](https://support.google.com/googleplay/android-developer/answer/138230)** (recency-weighted). *Weakness:* bought reviews + review bombing.
- **[Wikipedia pending-changes / editor trust](https://en.wikipedia.org/wiki/Wikipedia:Reviewing_pending_changes)** — editor trustworthiness. Permission flags + edit counts. Automated thresholds + admin grants. *Weakness:* edit count is a shallow, gameable proxy.

## Sports & competition rankings

- **[Elo](https://en.wikipedia.org/wiki/Elo_rating_system)** / **[Glicko-2](https://en.wikipedia.org/wiki/Glicko_rating_system)** — player skill. Numeric rating (Glicko adds a confidence/deviation term). Zero-sum statistical update. *Weakness:* single K-factor models uncertainty crudely; pool-wide inflation.
- **[FIDE](https://www.fide.com/)** — chess. Elo with tiered K-factors. *Weakness:* decades-long inflation debates.
- **[ATP](https://www.atptour.com/en/rankings/rankings-faq)** / **[WTA](https://www.wtatennis.com/rankings-explained)** — tennis. Rolling 52-week points. *Weakness:* no opponent-strength weighting.
- **[OWGR](https://www.owgr.com/)** — golf. Strength-of-field-weighted points. *Weakness:* the LIV Golf exclusion controversy.
- **[FIFA rankings](https://inside.fifa.com/fifa-world-ranking/procedure-men)** — national football teams. Elo-based "SUM" model (since 2018, fixing the gameable old system).
- **Sabermetrics / WAR** — baseball player value, in wins. Statistical composite. *Weakness:* the two main versions ([bWAR](https://www.baseball-reference.com/about/war_explained.shtml), [fWAR](https://library.fangraphs.com/misc/war/)) disagree — "which WAR?".
- **[College Football Playoff](https://collegefootballplayoff.com/)** committee, **[AP Poll](https://apnews.com/hub/ap-top-25-college-football-poll)**, **Coaches Poll** — top-25 rankings. Expert/voter judgment. *Weakness:* opacity, reputation bias, and (Coaches Poll) direct conflicts of interest.

## Governance & social indices

- **[Corruption Perceptions Index](https://www.transparency.org/en/cpi/)** (Transparency International) — public-sector corruption. 0–100. Composite of expert/business surveys. *Weakness:* measures perceptions, not corruption.
- **[Freedom in the World](https://freedomhouse.org/report/freedom-world)** (Freedom House) — political rights/civil liberties. 0–100 + Free/Partly/Not Free. Expert assessment. *Weakness:* majority US-government funded (independence critique).
- **[V-Dem](https://www.v-dem.net/)** — democracy (5 dimensions). 0–1 indices. ~3,500 expert coders → Bayesian IRT with explicit uncertainty bounds. *Weakness:* expert-coding subjectivity; complex to audit.
- **[EIU Democracy Index](https://www.eiu.com/)** — democracy. 0–10 + regime type. *Weakness:* opaque, proprietary, anonymous experts.
- **[Human Development Index](https://hdr.undp.org/data-center/human-development-index)** (UNDP) — health/education/income. 0–1. Geometric mean of three indicators. *Weakness:* only three crude dimensions; arbitrary weighting.
- **[World Press Freedom Index](https://rsf.org/en/index)** (RSF) — press freedom. 0–100. Abuse tally + expert survey.
- **[Worldwide Governance Indicators](https://www.worldbank.org/en/publication/worldwide-governance-indicators)** (World Bank) — six governance dimensions, with standard errors.
- **World Bank *Doing Business* (DISCONTINUED)** — ease of doing business. Killed in [September 2021](https://www.worldbank.org/en/news/statement/2021/09/16/world-bank-group-to-discontinue-doing-business-report) after audits found **deliberate data manipulation** favoring certain countries under leadership pressure — the cleanest documented case of index capture.
- **[Gallup World Poll / World Happiness Report](https://worldhappiness.report/)** — wellbeing. Survey means (Cantril Ladder 0–10). Large-N self-report (not expert perception). *Weakness:* translation/cultural bias; over-reading a single question.
- *Also:* [Global Peace Index](https://www.economicsandpeace.org/global-peace-index/), [WJP Rule of Law Index](https://worldjusticeproject.org/rule-of-law-index/), [Environmental Performance Index](https://epi.yale.edu/), and the ideologically-framed economic-freedom indices ([Heritage](https://www.heritage.org/index/), [Fraser](https://www.fraserinstitute.org/economic-freedom)).

## Charity & nonprofit evaluation

- **[GiveWell](https://www.givewell.org/)** — global health/development charities. Short "Top Charities" list + cost-per-life-saved estimates. Deep in-house CEA, publishes full models. *Weakness:* very narrow, evidence-rich cause focus.
- **[Charity Navigator](https://www.charitynavigator.org/)** — US 501(c)(3)s. 0–4 stars / 0–100. Largely automated from Form 990s + impact "beacons". *Weakness:* historic overhead-ratio reliance is a poor, gameable impact proxy.
- **[Candid / GuideStar](https://www.guidestar.org/)** — nonprofit profiles. Bronze–Platinum transparency seals. Self-reported data. *Weakness:* seals measure disclosure, not effectiveness.
- **[Animal Charity Evaluators](https://animalcharityevaluators.org/)**, **[Founders Pledge](https://www.founderspledge.com/)** — impact-focused evaluation in harder-to-measure causes. **ImpactMatters** (cost-per-impact) was folded into Charity Navigator (2020).
- *Also:* [CharityWatch](https://www.charitywatch.org/) (A+–F), [BBB Wise Giving / Give.org](https://give.org/) (pass/fail accreditation), [Giving What We Can](https://www.givingwhatwecan.org/) (meta-evaluation of evaluators).

## Forecasting & prediction platforms

- **[Metaculus](https://www.metaculus.com/)** — many event types. Community-prediction probability; forecasters scored by proper rules. Crowd aggregation, no betting. *Weakness:* aggregate accuracy largely self-reported; no monetary incentive.
- **[Good Judgment](https://goodjudgment.com/)** / **[GJ Open](https://www.gjopen.com/)** — geopolitics/economics. Probabilities scored by Brier; curated Superforecasters. *Weakness:* premium forecasts paywalled; small expert panel.
- **[Polymarket](https://polymarket.com/)** — real-world events. Market price = probability; real-money crypto. *Weakness:* past US legal issues; thin-market manipulation.
- **[Kalshi](https://kalshi.com/)** — US event contracts. Binary \$0–\$1; CFTC-regulated exchange. *Weakness:* much volume is sports, not forecasting.
- **[Manifold](https://manifold.markets/)** — user-created markets. Play-money market maker. *Weakness:* play money weakens incentives; creator-resolved miscalibration.
- **[PredictIt](https://www.predictit.org/)** — US politics. Real-money, academic project. *Weakness:* position/withdrawal caps distort prices.

## Lessons for evaluation engineering

These five patterns are the headlines; [Patterns & Failure Modes](/concepts/patterns-and-failure-modes/) develops each one rigorously, with the academic literature (reactivity, Goodhart's law, certification economics, reputation inflation, aggregation theory) behind it.

Patterns the catalogue makes hard to ignore:

1. **Funding structure predicts trustworthiness better than methodology does.** The most-trusted systems (Consumer Reports, Which?, Stiftung Warentest, IIHS) share a model — independent, buys its own units, refuses ads — not a method. The clearest failures (2008 credit ratings, *Doing Business*, BBB pay-for-grade) are capture stories, not technique stories. This is the [trust-network](/concepts/techniques/) and [candidness](/concepts/epistemic-culture/) problem in the wild, and it matches the [audit/ratings literature](/reference/adjacent-fields/).
2. **Every output format is gameable, differently.** Binary fresh/rotten invites bombing; 100-point scales inflate and compress; reciprocal two-sided ratings breed retaliation and inflation; self-declared certifications get faked. Choosing the [output format](/concepts/the-systems-view/) is choosing your failure mode.
3. **Crowd systems converge on the same arms race** — fakes, astroturfing, review bombing — and the same defenses: purchase/stay verification, Bayesian/credibility weighting, recency weighting, and ML fraud detection. Verification of *who is evaluating* is the recurring fix.
4. **Composite indices live or die on weighting**, which is inherently contested (HDI's three dimensions, ESG divergence, ranking methodology churn). The [OECD composite-indicators handbook](/reference/adjacent-fields/) exists precisely because this is hard.
5. **"Shallow but standardized" often beats "deep but bespoke" at scale** — letter-grade hygiene inspections, 5-star crash tests, and star ratings change behavior precisely because they are cheap, comparable, and ubiquitous. That is the [systems view](/concepts/the-systems-view/)'s accuracy × quantity × cost trade-off, already made by society many times over.

## Meta-lists & further reading

Curated catalogues of evaluation systems (the "good lists" that already exist):

- **Wikipedia — [List of international rankings](https://en.wikipedia.org/wiki/List_of_international_rankings)** — the best single index of country rankings by domain.
- **Wikipedia categories** — [Review websites](https://en.wikipedia.org/wiki/Category:Review_websites), [International rankings](https://en.wikipedia.org/wiki/Category:International_rankings), [Credit rating agencies](https://en.wikipedia.org/wiki/Category:Credit_rating_agencies), [Certification marks](https://en.wikipedia.org/wiki/Category:Certification_marks).
- **Wikipedia overviews** — [Review aggregator](https://en.wikipedia.org/wiki/Review_aggregator), [Reputation system](https://en.wikipedia.org/wiki/Reputation_system), [List of academic databases and search engines](https://en.wikipedia.org/wiki/List_of_academic_databases_and_search_engines), [Sustainability standards and certification](https://en.wikipedia.org/wiki/Sustainability_standards_and_certification), [List of freedom indices](https://en.wikipedia.org/wiki/List_of_freedom_indices).
- **[Ecolabel Index](https://www.ecolabelindex.com/)** — a directory of ~450+ ecolabels across ~200 countries.
- **Academic** — Davis, Kingsbury & Merry, *[Governance by Indicators](https://academic.oup.com/book/32690)* (Oxford, 2012) — the scholarly catalogue + critique of global indicators; Jøsang et al., *[A survey of trust and reputation systems](https://people.cs.vt.edu/~irchen/5984/pdf/Josang-DSS07.pdf)* (2007); Tadelis, *[Reputation and Feedback Systems in Online Platform Markets](https://faculty.haas.berkeley.edu/stadelis/Annual_Review_Tadelis.pdf)* (2016).

See also [Adjacent Fields & Literature](/reference/adjacent-fields/) for the academic disciplines behind these systems, and [Related Work](/reference/related-work/) for QURI's own evaluation tools.
