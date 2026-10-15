---
title: The Shadow Libraries
description: Sci-Hub, Library Genesis, Z-Library and Anna's Archive as of October 2026 — their measured coverage against legal routes, the lawsuits and blocking orders against them, their role in Bartz v. Anthropic and Kadrey v. Meta, and the legal risks to readers and tool builders. Shows where the legal access gaps actually are and why Open Stacks routes only to legal sources.
---

*Status: draft, October 2026. Legal statuses are as of 2026-10-15 unless another date is given; library sizes are self-reported and dated. A landscape chapter, not legal advice: it gives no domains, mirrors or access instructions, and Open Stacks does not link to these services. Sources: the [R02 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R02-open-papers-and-shadow-libraries.md), the [R09 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md), court orders read directly (Bartz Dkt. 231 and Dkt. 680, Kadrey Dkt. 598; the OCLC opinion via the [R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md)), and primary sources linked inline. Facts marked "(secondary)" come from press, blog or Wikipedia summaries, not a court record or the original data.*

"Shadow libraries" are unauthorized collections of copyrighted books and papers that are free to download. Four matter: Sci-Hub, Library Genesis (LibGen), Z-Library and Anna's Archive. They belong in a guide to cheap reading for three reasons. Their coverage is the benchmark that legal routes get measured against. Their usage is the best available measure of unmet demand. And downloads from them produced a \$1.5B settlement, [described as](https://pearlcohen.com/federal-court-approves-1-5-billion-anthropic-copyright-settlement-largest-in-history) the largest copyright settlement in history, which changed the legal map for anyone building tools over literature.

## The short version

- **Coverage.** In a study of 875 works cited in 2023 review articles, Anna's Archive had free full text for 76% and Sci-Hub for 72%. A university library's subscriptions reached 73%, and Google Scholar's free links 67% ([Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)). The pirate advantage is concentrated in **older paywalled work and the published version of record**. For 2021–2024 papers, pirate coverage "drops off precipitously", because Sci-Hub paused uploads around December 2020.
- **Legal pressure, 2024–2026.** Default judgments against LibGen (about \$30M, 2024) and Anna's Archive (\$322.2M and \$19.5M, 2026); an order to delete Anna's Archive's scraped WorldCat data (2026-01-15); a nationwide Indian block on Sci-Hub (2025-08-19); criminal charges against Z-Library's alleged operators (2022). No collection on the money judgments has been reported. What bites are orders against registries, registrars, CDNs and hosts.
- **AI litigation.** *Bartz v. Anthropic* turned on downloads from LibGen and the Pirate Library Mirror. It settled for **\$1.5B covering 482,460 works**, about **\$3,000 per work**, with final approval on **2026-07-20** and first payments expected on or before 2026-11-15. In *Kadrey v. Meta*, Meta's torrenting of LibGen and Anna's Archive is undisputed. Meta won summary judgment on fair use on a thin record; the torrenting claims are set for a summary-judgment hearing on **2027-02-25** (secondary).
- **The two judges disagree.** Judge Alsup treated pirated acquisition as a separate, non-transformative use. Judge Chhabria judged downloading by its ultimate purpose. No appellate court has resolved the conflict, and Chhabria declined to certify it for interlocutory appeal on 2026-07-08 (secondary).
- **Readers.** In the US, downloading an in-copyright work without authorization is infringement unless fair use applies, with statutory damages of \$750–\$150,000 per work. Torrenting adds distribution. Reported enforcement has targeted operators, intermediaries and corporate downloaders, not individual readers.
- **Builders.** Shadow-library sourcing is the largest legal hazard in this space. Liability scales with every work a tool surfaces or ingests, and it reaches metadata as well as files. **Open Stacks routes only to legal sources** ([why](#why-open-stacks-routes-only-to-legal-sources)). For the legal route to a given kind of work, see [What to do instead](#what-to-do-instead).

## What they are

| Library | Started | What it holds | Size (self-reported, date) | How new material arrives | Status, October 2026 |
|---|---|---|---|---|---|
| **Sci-Hub** | 2011 | Journal articles, retrieved by DOI | 88,343,822 files (2022-07-15) ([secondary](https://en.wikipedia.org/wiki/Sci-Hub)) | Obtained "through a variety of mechanisms, including the unauthorized use of university user accounts" ([Walters](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)). Uploads paused around December 2020, under an undertaking to the Delhi High Court | Corpus largely frozen. Blocked in India since 2025-08-19 and by ISP orders in several other countries. Its founder reported a DNS block of one domain in January 2026 (secondary) |
| **Sci-Net** | 2025-04-15 | Peer request-and-upload network for papers, tied to Sci-Hub | n/a | Users fulfil requests and are rewarded with a Solana-based token (SCI) (secondary) | The Delhi High Court treated it as part of the same enterprise and ordered it blocked ([summary](https://sunslegal.com/2025/09/03/delhi-high-court-orders-blocking-of-sci-hub-and-sci-net-for-copyright-infringement/)) |
| **Library Genesis (LibGen)** | about 2008 | Non-fiction and fiction books, comics, magazines, plus a mirror of Sci-Hub's articles | 2.4M non-fiction books, 2.2M fiction, 80M articles, 2M comics, 0.4M magazine issues (2024-02-04) ([secondary](https://en.wikipedia.org/wiki/Library_Genesis)) | Volunteer uploads; collections copied between forks | Fragmented. Most domains taken offline in December 2024 after a US default judgment (secondary) |
| **Z-Library** | about 2009 | Books and articles | About 13.35M books and 84.8M articles (February 2023 data) ([secondary](https://en.wikipedia.org/wiki/Z-Library)) | User uploads | Still operating after repeated domain seizures. The two people indicted as its operators escaped house arrest in Argentina in July 2024 (secondary) |
| **Anna's Archive** | November 2022, days after the Z-Library seizures; grew out of the Pirate Library Mirror (PiLiMi) | Metasearch and mirror over LibGen, Sci-Hub, Z-Library, Internet Archive lending scans, DuXiu, HathiTrust and others, plus metadata scraped from WorldCat, Google Books and Open Library | **71,996,952 books and 239,545,528 papers; about 1.1 PB of torrents (2026-10-01)** ([secondary](https://en.wikipedia.org/wiki/Anna%27s_Archive)) | Copies other collections; scrapes; sells bulk "high-speed access" to AI developers for large donations or datasets ([TorrentFreak, 2025-01-31](https://torrentfreak.com/pirate-libraries-are-forbidden-fruit-for-ai-companies-but-at-what-cost-250131/)) | Lost several domains between January and March 2026, and intermediaries were enjoined from serving it. Three US default judgments in 2026 (below) |

Three structural points:

- **They form a stack, not four rivals.** Sci-Hub supplied articles and LibGen supplied books. Z-Library and Anna's Archive mostly aggregate and redistribute those collections. Walters notes that Sci-Hub's pause "poses problems for Anna's Archive, which relies on Sci-Hub for a substantial portion of its full-text content" ([PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)).
- **The sizes overstate distinct works.** Anna's Archive claims 239.5M papers, but Crossref lists 124.5M journal articles and 187.7M DOIs in total (live API, 2026-10-15, per R02). The claim must count duplicates, multiple formats, non-DOI documents or metadata-only records [~95%]. Treat every number in the size column as an upper bound.
- **The corpora are effectively permanent.** Collections mirrored as bulk torrents survive domain seizures and the loss of any single operator. Enforcement changes how easy the material is to reach, not whether it exists [inference, high confidence].

## How much they cover

Two peer-reviewed studies measured coverage directly. They are eight years apart and measure different things.

| Study | Data date | Sample | Shadow-library coverage | Legal comparator |
|---|---|---|---|---|
| [Himmelstein et al., *eLife* 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5832410/) | March 2017 | 81.6M Crossref-registered scholarly articles | Sci-Hub held **68.9%** overall (56.2M). By segment: **85.1%** of toll-access journal articles; **48.3%** of open-access-journal articles; **96.9%** of Elsevier; **14.2%** of book chapters. 2016 articles 56.0%; 2017 (partial year) 45.3% | University of Pennsylvania: about the same overall (Sci-Hub 85.2% vs Penn 87.4% on a 500-article manual set). On toll-access articles Sci-Hub led: **94.2% vs 80.7%** (manual set) and 90.7% vs 83.5% (290,120-article automated set) |
| [Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/) | Works cited in 2023 review articles; published July 2025 | 875 works, 125 each from 7 fields (chemistry, materials science, cardiology, public health, economics, education, psychology), hand-searched in 15 mechanisms | Free full text, any version / final version: **Anna's Archive 76% / 70%; Sci-Hub 72% / 67%**. Coverage "drops off precipitously" for 2021–2024 publications in both | University library subscriptions 73% / 72%. Google Scholar (no library links) 67% / 48%. OpenAlex 48% / 35%. ResearchGate 36% / 29%. All mechanisms with URLs combined, **pirate sites included** (and, by the paper's definition, possibly the library catalog): 94% / 89% |

How to read the two studies together:

- **Sci-Hub covered most of the paywalled backfile in 2017, and it is not complete for anything recent.** It held 85% of toll-access articles and 97% of Elsevier's then, but Himmelstein already saw coverage dropping for articles published from 2010 on (56% of 2016 articles). Walters, with Sci-Hub frozen, sees a collapse for 2021–2024 and attributes it to uploads paused "in response to legal actions". Meanwhile the open-access share of new articles rose from 22% (2015) to 59% (2022 and 2023) in OpenAlex counts ([Herb 2025](https://rogue-scholar.org/records/1t1dg-xha78)). **For recent papers, legal routes now beat the pirate sites. For the paywalled backfile, the pirate sites still lead** [inference from the two studies, high confidence].
- **Most of the gap is about the version of record, not access to the ideas.** Google Scholar's free links found some version of 67% of Walters' sample, within 5–9 points of either pirate site. For the final published version the gap widens to 19–22 points (48% vs 67–70%). Much of what a shadow library adds over the best legal free route is a typeset PDF of a paper whose preprint or accepted manuscript is already free.
- **There is no legal-only combined figure.** Walters' 94% includes the pirate sites, and the paper reports no number without them. R02 estimates that a legal-only cascade (Google Scholar "All versions", Unpaywall/OpenAlex, PMC/Europe PMC, arXiv/SSRN/RePEc, author pages) reaches about **70–80%** of a cited-literature sample [~60%; inference, not measured]. An institutional subscription plausibly closes most of the rest; that has not been measured either.
- **Books are a different market.** No comparable peer-reviewed coverage study of in-copyright books was found. Sci-Hub's 14.2% coverage of book chapters in 2017 shows that article-oriented tools miss the book literature. The legal book gap widened when the Second Circuit held the Internet Archive's controlled digital lending of in-copyright scans not fair use in [*Hachette v. Internet Archive*](https://storage.courtlistener.com/recap/gov.uscourts.ca2.60988/gov.uscourts.ca2.60988.306.1.pdf) (2024-09-04); about 500,000 books left the Internet Archive's lending program (secondary, per R09).

### Where the gaps are, by segment

| Segment | Best legal free route (Oct 2026) | Shadow-library coverage (as measured) | Where the gap is |
|---|---|---|---|
| Articles published 2021 onward | Gold, hybrid, bronze and green OA (59% of 2022–23 articles are OA per OpenAlex); NIH-funded manuscripts accepted from 2025-07-01 must be in PMC at publication | "Drops off precipitously" for 2021–2024 (Walters) | Small and shrinking; see [Open Papers and Preprints](/access/open-papers/) |
| Paywalled articles published before 2021 | Green copies where they exist; JSTOR's free 10 articles per 30 days; library and interlibrary loan | Sci-Hub held 85.1% of toll-access articles in 2017 | **The main legal gap for papers**; see [University and Employer Access](/access/academic-and-employer/) |
| Version of record vs preprint | Accepted manuscripts and preprints | Anna's Archive 70% final version vs Google Scholar 48% (Walters) | Large for the typeset version; small for the content |
| Book chapters and edited volumes | OA books, library e-books, purchase | 14.2% (Sci-Hub, 2017) | Large on both sides |
| In-copyright books, especially out of print | Library lending, HathiTrust search-only, purchase (often used) | No rigorous measurement; Anna's Archive claims 72M books, including duplicates | **The main legal gap for books** [inference]; see [Public Libraries](/access/public-libraries/) |
| Public-domain books | HathiTrust, Internet Archive, Project Gutenberg | Irrelevant | None; see [The Public Domain and Open Corpora](/access/public-domain/) |

## How much they are used

| Measure | Value | Date | Source |
|---|---|---|---|
| Sci-Hub logged downloads | 26,984,851 access events over 165 days (about 164,000/day). The authors later corrected their reading: these were resolved downloads, not requests | September 2015 to February 2016 | [Himmelstein et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC5832410/) |
| Who used Sci-Hub | Heavy use from rich-country university campuses as well as from lower-income countries | same logs | [Bohannon, *Science* 2016](https://doi.org/10.1126/science.352.6285.508) (summary via R02) |
| Sci-Hub request rate | About 400,000 requests/day | September 2019 | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Sci-Hub)) |
| Sci-Hub cumulative downloads | Over 1 billion | July 2020 | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Sci-Hub)) |
| Sci-Hub downloads by country | China about 25M in one month; the US second. Secondary summaries disagree on the US and French figures | January 2022 | secondary, citing [Owens, *Nature*, 2022-02-25](https://doi.org/10.1038/d41586-022-00556-y) |
| Anna's Archive downloads | More than 650,000/day on average | March 2025 | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Anna%27s_Archive)) |

All usage data after 2016 is self-reported or secondhand. There is no recent independent log study, so whether usage fell as the open-access share rose is unknown (see [Open questions](#open-questions)).

## Legal actions through October 2026

| Date | Forum and parties | Outcome | Source |
|---|---|---|---|
| 2017-06-21 | S.D.N.Y., *Elsevier v. Sci-Hub* | Default judgment, about \$15M; LibGen found liable for willful infringement | Cited in [Kadrey Dkt. 598](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf); amount secondary |
| 2017-11-06 | E.D. Va., American Chemical Society v. Sci-Hub | Default judgment with an injunction reaching ISPs and search engines. Reported at \$4.8M, the amount ACS sought | secondary (stale) |
| 2018–2021 | ISP blocking orders in Sweden (2018), Russia (2018), France (2019), the UK (2021), Belgium and elsewhere | Sci-Hub blocked at the network level; Walters also lists China, Italy and the Netherlands | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Sci-Hub)); [Walters](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/) |
| 2022-11-03 / 2022-11-16 | US seizure of 240+ Z-Library domains; E.D.N.Y. indictment (criminal copyright infringement, wire fraud, money laundering) | Two alleged operators arrested in Argentina; escaped house arrest in July 2024 after extradition was approved | Indictment cited in [Kadrey Dkt. 598](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf); rest secondary |
| 2024-09-26 | S.D.N.Y., Pearson, McGraw Hill, Macmillan and Cengage v. LibGen (operators unidentified) | Default judgment of about \$30M; domain actions in December 2024; a German CUII block | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Library_Genesis)) |
| 2025-08-19 | Delhi High Court, *Elsevier Ltd. v. Elbakyan*, CS(COMM) 572/2020 | Sci-Hub and Sci-Net declared "rogue websites"; India's Department of Telecommunications and IT ministry to direct ISPs to block them within 72 hours; contempt for breaching a 2020-12-24 undertaking not to upload the plaintiffs' articles. The court found post-2022 articles on the site | [Law-firm summary](https://sunslegal.com/2025/09/03/delhi-high-court-orders-blocking-of-sci-hub-and-sci-net-for-copyright-infringement/) |
| 2026-01-15 | S.D. Ohio, *OCLC v. Anna's Archive*, No. 2:24-cv-144 | Default judgment on **breach of WorldCat's browsewrap terms** and **trespass to chattels**, not copyright. Permanent injunction against scraping, storing or distributing WorldCat data; deletion of all copies "including all torrents". OCLC sought no damages | [Opinion and Order, Doc. 58](https://librarytechnology.org/docs/32142.pdf) (read in full for R05) |
| 2026-01-16 | S.D.N.Y. (Rakoff), Spotify and the three major labels v. Anna's Archive, after its announced ~300 TB Spotify "backup" | Preliminary injunction binding registries, hosts and a CDN | secondary |
| 2026-04-14/15 | Same case | **\$322.2M default judgment**: \$150,000 × 148 recordings for the labels, plus \$2,500 × 120,000 files under DMCA §1203 for Spotify. Worldwide injunction on 10 domains binding named registries, registrars and hosts | [TorrentFreak](https://torrentfreak.com/annas-archive-loses-322-million-spotify-piracy-case-without-a-fight/) |
| 2026-05-19 | S.D.N.Y. (Rakoff), 13 publishers v. Anna's Archive (filed March 2026) | **\$19.5M default judgment** (\$150,000 × 130 works); all registries and registrars ordered to disable its domains | [Publishers Weekly](https://www.publishersweekly.com/pw/by-topic/digital/copyright/article/100463-court-rules-against-anna-s-archive-in-copyright-lawsuit.html) |

The pattern since 2024:

1. **Default judgments at the statutory maximum.** Operators are anonymous or abroad and do not appear. In the 2026 Anna's Archive cases the court awarded \$150,000 per work, the ceiling for willful infringement under [17 U.S.C. §504(c)](https://www.law.cornell.edu/uscode/text/17/504). No collection against these operators has been reported.
2. **Injunctions aimed at intermediaries.** The remedies that bite run against registries, registrars, CDNs and hosts worldwide. They raise the cost of staying reachable without removing the corpus.
3. **Non-copyright claims for metadata.** OCLC won on contract and trespass. Uncopyrightable catalog facts can still carry an injunction if they were scraped against terms of use.
4. **Diversification in response.** The sites add domains, move hosts, rely on torrents and crowd-source new material (Sci-Net) instead of scraping it.

[~80%] that this equilibrium holds through 2027: the sites stay reachable for determined users, with recurring outages, and no operator pays a US judgment.

## Shadow libraries in AI-training litigation

The 2025 fair-use rulings made acquisition, not training, the expensive question. The two leading cases point in different directions on how acquisition should be judged.

### Bartz v. Anthropic

**Facts** ([Order on Fair Use, Dkt. 231, 2025-06-23](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)). Anthropic downloaded 196,640 books from Books3 (early 2021), at least 5 million copies from LibGen (June 2021) and at least 2 million from PiLiMi (July 2022): "over seven million" pirated copies. It kept them in a "central library" of "all the books in the world". It also bought print books and scanned them.

**Holdings.** Judge Alsup held training "exceedingly transformative" and fair use, and digitizing purchased print books fair use. He denied Anthropic summary judgment on the pirated library copies and set those for trial:

- "the person who copies the textbook from a pirate site has infringed already, full stop."
- Pirating otherwise available copies is "inherently, irredeemably infringing even if the pirated copies are immediately used for the transformative use and immediately discarded". He then said the case need not be decided "on that rule", because Anthropic kept the copies for a general-purpose library.
- Later buying a copy "will not absolve it of liability for the theft but it may affect the extent of statutory damages."

**Settlement.** The case settled before the piracy trial.

| Term | Value | Source |
|---|---|---|
| Fund | **\$1.5B**, non-reversionary | [Final approval order, Dkt. 680](https://assets-us-01.kc-usercontent.com:443/1eeb16db-4934-006e-40a6-38fa91285ebb/36cce252-a32c-4cbb-a624-31dd8ac9574c/2026-07-20%20Order%20Granting%20Final%20_dckt%20680_0_.pdf) |
| Works covered | **482,460** | Dkt. 680 |
| Per work | About **\$3,000** before fees and costs, four times the \$750 statutory minimum | Dkt. 680 |
| Uptake | 91.3% of works (440,490) claimed as of 2026-04-16; 350 valid opt-outs covering 1,802 works; 54 objections or comments filed, objections overruled | Dkt. 680 |
| Conduct terms | Anthropic must destroy its LibGen and PiLiMi copies | Class notice (R09) |
| Release | Past conduct only (through 2025-08-25 per R02). Excludes claims about model outputs. Not a license to train | Class notice (R09) |
| Final approval | **2026-07-20**, Judge Araceli Martínez-Olguín, who took over the case from Judge Alsup | Dkt. 680; [Authors Guild](https://authorsguild.org/news/court-grants-final-approval-anthropic-copyright-settlement/) |
| Payments | "We currently expect to send the first round of payments on or before November 15, 2026", for works without allocation disputes and with complete claimant information. The parties say the Effective Date has passed, "assuming that no late-filed appeal is permitted to go forward" | [Settlement site](https://www.anthropiccopyrightsettlement.com/), read 2026-10-15 |
| Appeals | Three notices reported: Publishers Coordination Counsel (around 2026-08-19, fees and expenses); a non-class-counsel law firm (around 2026-08-20, fee allocation only); an objecting class member (filed 2026-08-31, not in proper form, re-filing required). Only the last is described as able to delay payouts substantially. Whether it was re-filed is unknown | [Writer Beware](https://writerbeware.blog/2026/07/23/anthropic-settlement-update-final-settlement-approved/), updated 2026-09-02 (secondary) |

The arithmetic explains the settlement [calculation]. At the \$750 statutory minimum, 482,460 works imply \$361.8M of exposure. At the \$150,000 willful maximum they imply \$72.4B. The settlement sits at about 4× the minimum.

### Kadrey v. Meta

**Facts** ([Dkt. 598, 2025-06-25](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf)). Meta first downloaded LibGen in October 2022 to test its value for training. In spring 2023, after failing to acquire licenses, it decided to train on the LibGen works, and it abandoned licensing efforts after confirming that LibGen held most of the works available for license from publishers it had been negotiating with. It downloaded Anna's Archive in early 2024. "There is no dispute that Meta torrented LibGen and Anna's Archive"; the parties dispute whether, and how much, Meta re-uploaded while torrenting. Unsealed emails reportedly cite 81.7 TB torrented, 35.7 TB of it from Z-Library and LibGen (secondary).

**Holding.** Judge Chhabria granted Meta partial summary judgment on fair use, only because these 13 authors "made the wrong arguments". The ruling "does not stand for the proposition that Meta's use of copyrighted materials to train its language models is lawful", and market dilution could win on a better record. On shadow libraries:

- Downloading "must still be considered in light of its ultimate, highly transformative purpose: training Llama," citing the Bartz order as contrary authority. "Because Meta's ultimate use of the plaintiffs' books was transformative, so too was Meta's downloading of those books."
- Shadow-library use could still matter if it "benefitted those who created the libraries" and perpetuated their infringement, under factor four or as contributory infringement. The plaintiffs offered no evidence of either.
- Distribution through torrenting is a separate claim, and it is still live.

**Since then** (secondary, from the [*ChatGPT Is Eating the World*](https://chatgptiseatingtheworld.com/) tracker; the docket was not checked directly):

- On 2026-03-25 the court allowed a fourth amended complaint that adds contributory infringement based on torrenting ([post](https://chatgptiseatingtheworld.com/2026/03/25/judge-chhabria-grants-kadreys-request-to-file-4th-amended-complaint-to-add-contributory-infringement-claim-related-to-torrenting-but-judge-strongly-rebukes-kadreys-lawyers-for-pattern-of-blam/)).
- The summary-judgment hearing on the torrenting-related claims is set for **2027-02-25** ([post](https://chatgptiseatingtheworld.com/2026/03/27/kadrey-v-meta-gets-scheduling-order-summary-judgment-motion-hearing-for-distribution-claim-wont-be-heard-until-feb-25-2027/)).
- On 2026-07-08 Chhabria **denied** the authors' motion to certify the downloading ruling for interlocutory appeal. He called the issue "a difficult one" and said "Judge Alsup's opinion makes a good point", but expected that "it won't be long before a final judgment is entered in at least one of the Meta cases" ([post](https://chatgptiseatingtheworld.com/2026/07/08/judge-chhabria-denies-kadrey-book-authors-motion-to-seek-an-interlocutory-appeal-of-downloading-part-of-ruling-in-fair-use-decision/)).

### Where the two judges disagree

| Question | Alsup, *Bartz* (2025-06-23) | Chhabria, *Kadrey* (2025-06-25) |
|---|---|---|
| Is training an LLM on books fair use? | Yes: "exceedingly transformative" | Yes, on this record. But "in most cases" unlicensed training "will likely be" illegal, mainly through market dilution |
| Is acquisition from pirate sites judged separately from training? | **Yes.** Building a central library from pirated copies "was its own use — and not a transformative one" | **No.** Downloading is judged "in light of its ultimate, highly transformative purpose" |
| Role of bad faith | "Not the basis for this decision"; relevant to willfulness | "The law is in flux"; in any case it "doesn't move the needle here" |

**For a builder, plan on the Alsup view** [~75% that a court would apply something close to it to a literature tool]. Three reasons:

1. Chhabria's reasoning depends on a highly transformative end use, model training. A reading or search tool that serves copies to users has no comparable purpose to borrow.
2. The [US Copyright Office's Part 3 report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf) (pre-publication, 2025-05-09) says "knowing use of a dataset that consists of pirated or illegally accessed works should weigh against fair use without being determinative."
3. Japan's [Agency for Cultural Affairs guidance](https://www.bunka.go.jp/english/policy/copyright/pdf/94055801_01.pdf) (May 2024) says knowingly collecting training data from piracy sites "should be strictly avoided".

An appellate ruling on the acquisition question before the end of 2027 looks unlikely [~15%]. Bartz settled. A final judgment in one of the Meta cases may come soon, but a Ninth Circuit decision on appeal from it would probably not arrive within 2027 [inference from typical appellate timelines].

### Other AI cases and dealings

- **Authors v. NVIDIA** (N.D. Cal.). An amended complaint (January 2026) alleges that NVIDIA's data team approached Anna's Archive about "high-speed access" to roughly 500 TB, that the site warned the data was illegally acquired, and that management approved within a week. The complaint does not say whether NVIDIA paid. Anna's Archive says it never dealt with NVIDIA directly ([TorrentFreak, 2026-01-19](https://torrentfreak.com/nvidia-contacted-annas-archive-to-secure-access-to-millions-of-pirated-books/)). NVIDIA moved to dismiss on 2026-01-29 ([secondary](https://en.wikipedia.org/wiki/Anna%27s_Archive)); I found no ruling as of October 2026 [low confidence that none exists].
- **Bulk access sold to model developers.** In January 2025 Anna's Archive said it had given about 20–30 companies or teams its entire dataset over high-speed servers, usually for a large donation, sometimes for datasets ([TorrentFreak](https://torrentfreak.com/pirate-libraries-are-forbidden-fruit-for-ai-companies-but-at-what-cost-250131/)). The DeepSeek-VL paper (March 2024) states that its authors "cleaned 860K English and 180K Chinese e-books from Anna's Archive" for OCR training data ([arXiv:2403.05525](https://arxiv.org/abs/2403.05525)).

## Risks to individual readers

US-focused. Not legal advice.

| Activity | Legal status (US) | Enforcement record | Other risks |
|---|---|---|---|
| Downloading an in-copyright paper or book from a shadow-library website | Infringes the reproduction right unless fair use applies (see below). Statutory damages run from \$750 to \$30,000 per work, up to \$150,000 if willful and as low as \$200 if innocent ([17 U.S.C. §504(c)](https://www.law.cornell.edu/uscode/text/17/504)) | No US suit against an individual researcher for reading Sci-Hub papers was found [moderate confidence; absence of evidence in a limited search] | Sci-Hub has relied partly on university credentials. The UK's Police Intellectual Property Crime Unit warned in March 2021 that the site could steal credentials ([secondary](https://en.wikipedia.org/wiki/Sci-Hub)) |
| Downloading via BitTorrent | Adds a distribution claim, because BitTorrent clients upload by default. This is the live claim against Meta | Rightsholders are pursuing Meta over its torrenting; no suit against an individual reader found | Exposure scales with the number of works in a torrent, and one library torrent can hold thousands [inference] |
| Uploading papers or fulfilling requests (for example on Sci-Net) | Distribution | The Delhi High Court treated Sci-Net as part of Sci-Hub and ordered it blocked | Token rewards make participation look commercial [inference] |
| Supplying institutional login credentials | Breach of the institution's license and acceptable-use policy | Publishers suspend access by IP range: [JSTOR's terms](https://about.jstor.org/terms) (2026-04-24) reserve the right to suspend "IP address(es)" | Can cut off a whole campus; disciplinary exposure |
| Using these sites outside the US | Varies. Sites are blocked at the ISP level, by court or administrative order, in India, the UK, France, Sweden, Russia, Belgium, Germany, Italy, the Netherlands and elsewhere | Enforcement is at the network level, not against users | — |

**On fair use for personal reading.** Footnote 14 of Chhabria's Kadrey order says a researcher who downloaded books from a shadow library "in the process of writing an article on shadow libraries" would "almost certainly" be making fair use. That is dicta, from one district judge, about research on the libraries themselves. Downloading a paper to read it for its content is the substitutive use that copyright markets price. Alsup's "infringed already, full stop" answers exactly the "research purpose" argument: he quoted Anthropic's own counsel that "You can't just bless yourself by saying I have a research purpose." I put [~85%] on a US court holding an ordinary personal-reading download not to be fair use, if one were ever litigated. The practical risk to an individual reader has so far been low; the legal status is not ambiguous.

## Risks to tool builders

A reader's exposure is per work they download. A tool's exposure is per work it surfaces or ingests, multiplied across its users, and its operator is identifiable. That asymmetry is why the builder's answer is categorical. The ratings follow R09's green/yellow/red scheme.

| Tool behavior | Rating | Why |
|---|---|---|
| Link to shadow-library pages, files or search results | **Red** | Contributory-infringement exposure in the US. In the EU, a for-profit linker to unauthorized content is presumed to know it is unauthorized ([*GS Media*, CJEU 2016-09-08](https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf)). The 2026 injunctions reached registries, registrars, CDNs and hosts |
| Show an "available on [shadow library]" badge or query their indexes | **Red** | Functionally the same as linking, and it advertises infringement as a feature [inference, high confidence] |
| Ingest shadow-library files for search, RAG or training | **Red** | The *Bartz* facts. USCO: knowing use of pirated data weighs against fair use. Japan: "strictly avoided". Damages scale per work: 10,000 ingested books imply \$7.5M–\$1.5B of theoretical statutory exposure [calculation] |
| Ingest shadow-library *metadata* dumps (for example Anna's Archive's WorldCat-derived records) | **Red** | The distributor is under a US order to delete that data, "including all torrents" ([OCLC opinion](https://librarytechnology.org/docs/32142.pdf)), and contract and trespass claims do not need copyrightable content. Legal open equivalents exist: Open Library dumps, Library of Congress MARC, and Wikidata and OpenAlex (both CC0) |
| Buy or accept bulk "high-speed access" to a shadow corpus | **Red** | The NVIDIA allegations; the Bartz and Kadrey facts |
| Host user-uploaded PDFs in a shared library | **Yellow** | Some uploads will come from shadow libraries. Requires full DMCA §512 compliance: a registered agent (\$6, renewed every 3 years), takedown handling and a repeat-infringer policy (R09). Default to private |
| Process PDFs the user supplies, locally, with no sharing | **Green** for the tool | No distribution (R09) |
| Cite published coverage studies (Himmelstein, Walters) and report "no legal copy found" | **Green** | Facts about the landscape. Route the gap to request, interlibrary loan or purchase |

## What their usage says about the access problem

The shadow libraries are, among other things, a large natural experiment in what readers want when price and friction go to zero.

1. **Demand is large and global.** Hundreds of thousands of requests or downloads per day from one site (Sci-Hub in 2019, Anna's Archive in 2025) is a lower bound on demand for frictionless free access. China was the largest single source of Sci-Hub downloads in January 2022, with the US second (secondary). India also widened legal access: its national One Nation One Subscription licence has been operational since 2025-01-01 ([secondary](https://en.wikipedia.org/wiki/One_Nation_One_Subscription)). Whether it reduced Sci-Hub use is unmeasured.
2. **People with legal access use them too.** Bohannon's 2016 analysis found heavy use from rich-country campuses, and in 2017 Penn's overall coverage was about the same as Sci-Hub's. For readers with institutional access the draw is plausibly convenience: a DOI in, a PDF out, no proxy login and no publisher interstitials [~70%; no recent survey separates convenience from coverage]. **A legal tool that matches that interaction would plausibly capture much of this demand** [inference].
3. **For papers, the legal gaps are narrow and located.** They sit in the paywalled pre-2021 backfile and the typeset version of record, not in recent articles. For books the gap is wide and unmeasured.
4. **Piracy did not break the subscription model.** Himmelstein et al. wrote in 2018 that near-complete free access suggested "the toll access business model may become unsustainable." Transformative agreements are instead being extended (the [UC–Elsevier agreement](https://osc.universityofcalifornia.edu/uc-publisher-relationships/elsevier-oa-agreement/) now runs to 2027-12-31); the open share grew through funder policy and gold/hybrid open access [inference, moderate confidence].

## What to do instead

| If you need… | Do this first | Main obstacle | Chapter |
|---|---|---|---|
| A paper from 2021 onward | Run the open-access cascade: OpenAlex/Unpaywall location, then arXiv/bioRxiv/PMC/Europe PMC, then Google Scholar "All versions" | The free version may be a preprint or accepted manuscript | [Open Papers and Preprints](/access/open-papers/) |
| A paywalled paper published before 2021 | Institutional access or interlibrary loan; JSTOR's free 10 per 30 days; JPASS (\$199/yr for 120 PDFs, as of October 2026); email the corresponding author | Turnaround time; no measured success rate for author requests | [University and Employer Access](/access/academic-and-employer/), [Cheap Subscriptions](/access/subscriptions/) |
| The exact version of record, for citation or figures | Library access or pay-per-view; check whether the accepted manuscript differs materially | Cost per article | [The Access Ladder](/access/access-ladder/) |
| An in-copyright book | Public-library e-lending; HathiTrust full-text search to find the pages, then a library or used copy | Holds queues; out-of-print titles | [Public Libraries](/access/public-libraries/) |
| A public-domain book | HathiTrust, Internet Archive, Project Gutenberg | None of substance | [The Public Domain and Open Corpora](/access/public-domain/) |
| A tool that "finds a copy" | A legal-copy resolver with a provenance ledger that reports unreachable items instead of filling the gaps | Coverage of the backfile | [The Legal Map](/building/legal-map/), [A Reference Architecture](/building/reference-architecture/) |

## Why Open Stacks routes only to legal sources

Its catalog, prototypes and recommendations do not link to Sci-Hub, LibGen, Z-Library, Anna's Archive or their successors. They do not check availability on these sites, mirror them, or ingest their files or metadata, and this wiki gives no domains or access instructions. We cite the published studies that measured their coverage and report their legal history, because both belong on an accurate map.

The reasons, in decreasing order of weight:

1. **Liability scales with the tool.** One reader's download is one work. A catalog that routes thousands of readers to millions of works is a contributory-infringement target, and in the EU a for-profit link to unauthorized content carries a presumption of knowledge.
2. **Provenance contaminates what is built downstream.** *Bartz* shows that a legitimate end use does not reliably cure an infringing acquisition. A "catalog of everything" that a reader later uses for RAG or fine-tuning needs clean inputs, which is why the [reference architecture](/building/reference-architecture/) keeps a provenance record.
3. **Metadata is not a safe harbor.** The OCLC deletion order shows that catalog records from these sources carry legal encumbrances. Open, legal metadata covers what a discovery tool needs.
4. **Robustness.** In 2024–2026 their domains were seized, suspended or blocked repeatedly, and service providers were enjoined from serving them. A tool built on them breaks on a court's schedule.
5. **The useful project is measuring the legal gap, not hiding it.** A one-box legal resolver that reports what it cannot reach, and routes the rest to libraries, authors and purchase, supplies the convenience and measures the gap at once.

This is a routing rule, not a verdict on the wider ethics debate about shadow libraries, which this chapter does not try to settle.

## Open questions

- **What is the legal-only coverage rate on Walters' sample?** Re-run his 875 works through a legal cascade only (Unpaywall/OpenAlex, PMC/Europe PMC, preprint servers, Google Scholar "All versions") and through the cascade plus one institutional subscription. That would settle the 70–80% estimate.
- **How much does the typeset version matter?** For papers whose only free copy is a preprint or accepted manuscript, how often does the published version differ materially in results, tables or figures? A few hundred matched pairs would answer it.
- **Has shadow-library usage fallen as open access rose?** There is no independent log study after Himmelstein and Bohannon (2015–2016 data). A new log release or traffic-panel data would show whether the 59% open-access share of 2022–2023 articles reduced demand.
- **Is Sci-Net refilling Sci-Hub's post-2020 gap?** The Delhi High Court found post-2022 articles present. Walters' year-by-year coverage is in his Supporting Information (Tables S11–S12); a 2026 re-measurement would show whether crowd-sourcing has replaced scraping.
- **Will the Ninth Circuit resolve the Alsup–Chhabria conflict on acquisition?** The first final judgment in a Meta case, and the Kadrey torrenting hearing (2027-02-25), are the next openings.
- **When do Bartz payments actually go out?** The test is whether the class member's appeal was re-filed and allowed to go forward, and whether the 2026-11-15 target holds.
- **What happens to NVIDIA's motion to dismiss (filed 2026-01-29)?** It is the first case built around an alleged direct approach to Anna's Archive.
- **What fraction of emailed author requests succeed, by field and paper age?** No rigorous measurement was found. An opt-in request tool could publish the first one.

## Related pages

- [Open Papers and Preprints](/access/open-papers/): the legal open-access cascade and the infrastructure behind it
- [The Access Ladder](/access/access-ladder/): the cheapest legal route for a given work
- [University and Employer Access](/access/academic-and-employer/): subscriptions, proxies, interlibrary loan, and the contract terms that govern them
- [Public Libraries](/access/public-libraries/): e-lending and databases for books
- [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/)
- [The Legal Map](/building/legal-map/): the full green/yellow/red table for tool builders
- [A Reference Architecture](/building/reference-architecture/): catalog/content separation and provenance records
- [Cruxes](/start-here/cruxes/): the disagreements that change what you should build
- [Glossary](/reference/glossary/)
