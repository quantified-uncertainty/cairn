---
title: The Shadow Libraries
description: A neutral landscape of Sci-Hub, Library Genesis, Z-Library and Anna's Archive as of October 2026 — their scale and measured coverage, the lawsuits and blocking orders against them, their central role in Bartz v. Anthropic and Kadrey v. Meta, the legal risks to readers and tool builders, what their usage reveals about gaps in legal access, and why Open Stacks routes only to legal sources.
---

*Status: draft, October 2026. Legal statuses are as of 2026-10-15 unless another date is given; sizes are self-reported by the sites and dated. This is a landscape chapter, not legal advice. It gives no domains, mirrors or access instructions, and Open Stacks does not link to these services. Sources: the [R02 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R02-open-papers-and-shadow-libraries.md), the [R09 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md), court orders checked directly (Bartz Dkt. 231 and Dkt. 680, Kadrey Dkt. 598, the OCLC opinion), and primary sources linked inline. Facts marked "(secondary)" come from press or Wikipedia summaries and were not checked against a court record.*

"Shadow libraries" are unauthorized collections of copyrighted books and papers that are free to download. Four matter: Sci-Hub, Library Genesis (LibGen), Z-Library and Anna's Archive. They belong in a guide to cheap reading for three reasons. Their coverage is the benchmark that legal routes get measured against. Their usage is the best available measure of unmet demand. And since 2025 they have been at the center of a \$1.5B settlement, reported as the largest copyright settlement on record, which changed the legal map for anyone building tools over literature.

## The short version

- **Coverage.** On a 2025 sample of 875 recently cited works, Anna's Archive had free full text for 76% and Sci-Hub for 72%. A university library's subscriptions reached 73%, and Google Scholar's free links 67% ([Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)). The pirate advantage is concentrated in **older paywalled work and the published version of record**. For papers from 2021–2024 the pirate sites' coverage "drops off precipitously", because Sci-Hub has been mostly frozen since about December 2020.
- **Legal pressure, 2024–2026.** Default judgments came against LibGen (about \$30M, 2024) and Anna's Archive (\$322.2M and \$19.5M, 2026). An Ohio court ordered Anna's Archive to delete its scraped WorldCat data (2026-01-15). The Delhi High Court ordered Sci-Hub blocked across India (2025-08-19). Z-Library's alleged operators were indicted in 2022. No collection on these money judgments has been reported. The practical effect comes from orders aimed at registries, registrars, CDNs and hosts.
- **AI litigation.** *Bartz v. Anthropic* turned on downloads from LibGen and the Pirate Library Mirror. The settlement is **\$1.5B for 482,460 works**, about **\$3,000 per work**, with final approval on **2026-07-20** and first payments expected on or before 2026-11-15. In *Kadrey v. Meta*, Meta's torrenting of LibGen and Anna's Archive is undisputed. Meta won summary judgment on fair use on a thin record. A distribution claim is still live, with a hearing set for **2027-02-25**.
- **The two judges disagree.** Judge Alsup treated pirated acquisition as a separate, non-transformative use. Judge Chhabria held that downloading must be judged by its ultimate purpose. No appellate court has resolved the conflict. Chhabria declined to certify the question for interlocutory appeal on 2026-07-08.
- **Risk to individuals.** In the US, downloading an in-copyright work without authorization is infringement, with statutory damages of \$750–\$150,000 per work. Torrenting adds distribution. Reported enforcement has targeted operators, intermediaries and corporate downloaders, not individual readers.
- **Risk to tool builders.** It is the largest legal hazard in this space. Liability scales with every work a tool surfaces or ingests, and it does not stop at files: metadata from these sources has been ordered deleted. **Open Stacks routes only to legal sources** ([why](#why-open-stacks-routes-only-to-legal-sources)).

## What they are

| Library | Started | What it holds | Size (self-reported, date) | How new material arrives | Status, October 2026 |
|---|---|---|---|---|---|
| **Sci-Hub** | 2011 | Journal articles, retrieved by DOI | 88,343,822 files (2022-07-15) ([secondary](https://en.wikipedia.org/wiki/Sci-Hub)) | Historically fetched on demand through university accounts. Walters describes this as "the unauthorized use of university user accounts" ([PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)). Uploads paused around December 2020 under an undertaking to the Delhi High Court | Corpus largely frozen. Blocked in India since 2025-08-19 and by ISP orders in several other countries. Its founder reported a DNS block of one domain in January 2026 (secondary) |
| **Sci-Net** | 2025-04-15 | Peer request-and-upload network for papers, tied to Sci-Hub | n/a | Users fulfil requests and are rewarded with a Solana-based token (SCI) (secondary) | The Delhi High Court treated it as part of the same enterprise and ordered it blocked ([summary](https://sunslegal.com/2025/09/03/delhi-high-court-orders-blocking-of-sci-hub-and-sci-net-for-copyright-infringement/)) |
| **Library Genesis (LibGen)** | about 2008 | Non-fiction and fiction books, comics, magazines, plus a mirror of Sci-Hub's articles | 2.4M non-fiction books, 2.2M fiction, 80M articles, 2M comics, 0.4M magazine issues (2024-02-04) ([secondary](https://en.wikipedia.org/wiki/Library_Genesis)) | Volunteer uploads; collections copied between forks | Fragmented. Most domains taken offline in December 2024 after a US default judgment (secondary) |
| **Z-Library** | about 2009 | Books and articles | About 13.35M books and 84.8M articles (February 2023 data) ([secondary](https://en.wikipedia.org/wiki/Z-Library)) | User uploads | Still operating after repeated domain seizures. The two people indicted as its operators escaped house arrest in Argentina in July 2024 (secondary) |
| **Anna's Archive** | November 2022, days after the Z-Library seizures; grew out of the Pirate Library Mirror (PiLiMi) | Metasearch and mirror over LibGen, Sci-Hub, Z-Library, Internet Archive lending scans, DuXiu, HathiTrust and others, plus metadata scraped from WorldCat, Google Books and Open Library | **71,996,952 books and 239,545,528 papers; about 1.1 PB of torrents (2026-10-01)** ([secondary](https://en.wikipedia.org/wiki/Anna%27s_Archive)) | Copies other collections; scrapes; offers bulk "high-speed access" to AI developers in exchange for donations or data ([TorrentFreak, 2025-01-31](https://torrentfreak.com/pirate-libraries-are-forbidden-fruit-for-ai-companies-but-at-what-cost-250131/)) | Lost several domain names in January–March 2026, and intermediaries were enjoined from serving it. Three US default judgments in 2026 (below) |

Three structural points:

- **They form a stack, not four rivals.** Sci-Hub supplied articles and LibGen supplied books. Z-Library and Anna's Archive mostly aggregate and redistribute those collections. Walters notes that Sci-Hub's pause "poses problems for Anna's Archive, which relies on Sci-Hub for a substantial portion of its full-text content" ([PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)).
- **The sizes are inflated as counts of distinct works.** Anna's Archive claims 239.5M papers, but Crossref lists 124.5M journal articles and 187.7M DOIs in total (live API, 2026-10-15, per R02). The figure must include duplicates, multiple formats, non-DOI documents and metadata-only records [~95%]. Treat every number in the size column as an upper bound on distinct works.
- **The corpora are effectively permanent.** Collections mirrored as bulk torrents survive domain seizures and the loss of any single operator. Enforcement changes how easy the material is to reach. It does not change whether the material exists [inference, high confidence].

## How much they cover

Two peer-reviewed studies measured coverage directly. They are eight years apart and measure different things.

| Study | Data date | Sample | Shadow-library coverage | Legal comparator |
|---|---|---|---|---|
| [Himmelstein et al., *eLife* 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5832410/) | March 2017 | 81.6M Crossref-registered scholarly works | Sci-Hub held **68.9%** overall (56.2M). By segment: **85.1%** of toll-access journal articles; **48.3%** of open-access-journal articles; **96.9%** of Elsevier; **14.2%** of book chapters. 2016 articles 56.0%; 2017 (partial year) 45.3% | University of Pennsylvania: about the same overall (Sci-Hub 85.2% vs Penn 87.4% on a 500-article manual set). On toll-access articles Sci-Hub led: **94.2% vs 80.7%** (manual set) and 90.7% vs 83.5% (290,120-article automated set) |
| [Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/) | 2023 review articles; published July 2025 | 875 cited works, 125 each from 7 fields (chemistry, materials science, cardiology, public health, economics, education, psychology), hand-searched in 15 mechanisms | Free full text, any version / final version: **Anna's Archive 76% / 70%; Sci-Hub 72% / 67%**. Coverage "drops off precipitously" for 2021–2024 publications in both | University library subscriptions 73% / 72%. Google Scholar (no library links) 67% / 48%. OpenAlex 48% / 35%. ResearchGate 36% / 29%. All free mechanisms combined, **pirate sites included**: 94% / 89% |

How to read the two studies together:

- **Sci-Hub was nearly complete for the paywalled article literature of the 2010s, and it is not complete for anything recent.** Himmelstein already saw coverage falling for articles published after 2010. Walters, with Sci-Hub frozen, sees a collapse for 2021–2024. Meanwhile the open-access share of new articles rose from 22% (2015) to 59% (2022 and 2023) in OpenAlex counts ([Herb 2025](https://rogue-scholar.org/records/1t1dg-xha78)). **For recent papers, legal routes now beat the pirate sites. For the paywalled backfile, the pirate sites still lead** [inference from the two studies, high confidence].
- **Most of the gap is about the version of record, not access to the ideas.** Google Scholar's free links found some version of 67% of Walters' sample, within 5–9 points of either pirate site. For the final published version, the gap widens to 19–22 points (48% vs 67–70%). Much of what a shadow library adds over the best legal free route is a typeset PDF of a paper whose preprint or accepted manuscript is already free.
- **There is no legal-only combined figure.** Walters' 94% includes the pirate sites, and the paper reports no number without them. R02 estimates that a legal-only cascade (Google Scholar "All versions", Unpaywall/OpenAlex, PMC/Europe PMC, arXiv/SSRN/RePEc, author pages) reaches about **70–80%** of a cited-literature sample [~60%; inference, not measured]. Adding an institutional subscription plausibly closes most of the rest, but that has not been measured either.
- **Books are a different market.** No comparable peer-reviewed coverage study of in-copyright books was found. Sci-Hub's 14.2% coverage of book chapters in 2017 shows that article-oriented tools miss the book literature. The legal book gap widened when the Second Circuit ended controlled digital lending of in-copyright scans in [*Hachette v. Internet Archive*](https://storage.courtlistener.com/recap/gov.uscourts.ca2.60988/gov.uscourts.ca2.60988.306.1.pdf) (2024-09-04). About 500,000 books left the Internet Archive's lending program (secondary, per R09).

### Where the gaps are, by segment

| Segment | Best legal free route (Oct 2026) | Shadow-library coverage (as measured) | Where the gap is |
|---|---|---|---|
| Articles published 2021 onward | Gold, hybrid and green OA (59% of 2022–23 articles are OA per OpenAlex); NIH-funded manuscripts accepted from 2025-07-01 must be in PMC at publication | "Drops off precipitously" for 2021–2024 (Walters) | Small and shrinking; see [Open Papers and Preprints](/access/open-papers/) |
| Paywalled articles published before 2021 | Green copies where they exist; JSTOR's free 10 articles per 30 days; library and interlibrary loan | Sci-Hub held 85.1% of toll-access articles in 2017 | **The main legal gap for papers**; see [University and Employer Access](/access/academic-and-employer/) |
| Version of record vs preprint | Accepted manuscripts and preprints | Anna's Archive 70% final version vs Google Scholar 48% (Walters) | Large for the typeset version; small for the content |
| Book chapters and edited volumes | OA books, library e-books, purchase | 14.2% (Sci-Hub, 2017) | Large on both sides |
| In-copyright books, especially out of print | Library lending, HathiTrust search-only, purchase (often used) | No rigorous measurement; Anna's Archive claims 72M books, including duplicates | **The main legal gap for books** [inference]; see [Public Libraries](/access/public-libraries/) |
| Public-domain books | Broadly available: HathiTrust, Internet Archive, Project Gutenberg | Irrelevant | None; see [The Public Domain and Open Corpora](/access/public-domain/) |

## How much they are used

| Measure | Value | Date | Source |
|---|---|---|---|
| Sci-Hub logged downloads | 26,984,851 events over 165 days (about 164,000/day). The authors later clarified these were resolved downloads, not raw requests | September 2015 to February 2016 | [Himmelstein et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC5832410/) |
| Who used Sci-Hub | Heavy use from rich-country university campuses as well as from lower-income countries | same logs | [Bohannon, *Science* 2016](https://doi.org/10.1126/science.352.6285.508) (summary via R02) |
| Sci-Hub request rate | About 400,000 requests/day | September 2019 | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Sci-Hub)) |
| Sci-Hub cumulative downloads | Over 1 billion | July 2020 | secondary |
| Sci-Hub downloads by country | China about 25M in a single month; the US second | around January 2022 (one month) | secondary, citing [Owens, *Nature* 2022](https://www.nature.com/articles/d41586-022-00556-y) |
| Anna's Archive downloads | More than 650,000/day on average | March 2025 | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Anna%27s_Archive)) |

All usage data after 2022 is self-reported or secondhand. There is no recent independent log study. Whether usage fell as the open-access share rose is unknown (see [Open questions](#open-questions)).

## Legal actions through October 2026

| Date | Forum and parties | Outcome | Source |
|---|---|---|---|
| 2017-06-21 | S.D.N.Y., *Elsevier v. Sci-Hub* | Default judgment, about \$15M; LibGen found liable for willful infringement | Cited in [Kadrey Dkt. 598](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf); amount secondary |
| 2017-11-06 | E.D. Va., American Chemical Society v. Sci-Hub | Default judgment (reported at \$4.8M), with an injunction reaching ISPs and search engines | secondary (stale) |
| 2012–2021 | ISP blocking orders in India, Sweden, Russia, France, Belgium, the UK and others | Sci-Hub blocked at the network level; Walters adds China, Italy and the Netherlands | secondary; [Walters](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/) |
| 2022-11-03 / 2022-11-16 | US seizure of 240+ Z-Library domains; E.D.N.Y. indictment unsealed (criminal copyright infringement, wire fraud, money laundering) | Two alleged operators arrested in Argentina; escaped house arrest in July 2024 after extradition was approved | Indictment cited in [Kadrey Dkt. 598](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf); rest secondary |
| 2024-09-26 | S.D.N.Y., Pearson, McGraw Hill, Macmillan and Cengage v. LibGen (operators unidentified) | Default judgment of about \$30M; domain actions in December 2024; a German CUII block | secondary ([Wikipedia](https://en.wikipedia.org/wiki/Library_Genesis)) |
| 2025-08-19 | Delhi High Court, *Elsevier Ltd. v. Elbakyan*, CS(COMM) 572/2020 | Sci-Hub and Sci-Net declared "rogue websites"; India's Department of Telecommunications and IT ministry to direct ISPs to block them within 72 hours; contempt found for breaching a 2020-12-24 undertaking not to upload the plaintiffs' articles. The court found post-2022 articles on the site | [Law-firm summary](https://sunslegal.com/2025/09/03/delhi-high-court-orders-blocking-of-sci-hub-and-sci-net-for-copyright-infringement/) |
| 2026-01-15 | S.D. Ohio, *OCLC v. Anna's Archive*, No. 2:24-cv-144 | Default judgment on **breach of WorldCat's browsewrap terms** and **trespass to chattels**, not copyright. Permanent injunction against scraping, storing or distributing WorldCat data; deletion of all copies "including all torrents". OCLC sought no damages | [Opinion and Order, Doc. 58](https://librarytechnology.org/docs/32142.pdf) (read in full in R05) |
| 2026-01-16 | S.D.N.Y. (Rakoff), Spotify and the three major labels v. Anna's Archive, after its announced ~300 TB Spotify "backup" | Preliminary injunction binding registries, hosts and a CDN | secondary |
| 2026-04-14/15 | Same case | **\$322.2M default judgment**: \$150,000 × 148 recordings for the labels, plus \$2,500 × 120,000 files under DMCA §1203 for Spotify. Worldwide injunction on 10 domains binding named registries, registrars and hosts | [TorrentFreak](https://torrentfreak.com/annas-archive-loses-322-million-spotify-piracy-case-without-a-fight/) |
| 2026-05-19 | S.D.N.Y. (Rakoff), 13 publishers v. Anna's Archive (filed March 2026) | **\$19.5M default judgment** (\$150,000 × 130 works); all registries and registrars ordered to disable its domains | [Publishers Weekly](https://www.publishersweekly.com/pw/by-topic/digital/copyright/article/100463-court-rules-against-anna-s-archive-in-copyright-lawsuit.html) |

The pattern since 2024:

1. **Default judgments at the statutory maximum.** Operators are anonymous or abroad and do not appear in court. Courts award \$150,000 per work, the ceiling for willful infringement under [17 U.S.C. §504(c)](https://www.law.cornell.edu/uscode/text/17/504). No collection against these operators has been reported.
2. **Injunctions aimed at intermediaries.** The remedies that bite run against registries, registrars, CDNs and hosts worldwide. They raise the cost of staying reachable without removing the corpus.
3. **Non-copyright claims for metadata.** OCLC won on contract and trespass. Even uncopyrightable catalog facts can carry an injunction if they were scraped against terms of use.
4. **Diversification in response.** The sites add domains, move hosts, rely on torrents and crowd-source new material (Sci-Net) instead of scraping it.

[~80%] that this equilibrium holds through 2027: the sites stay reachable for determined users, with recurring outages, and no operator pays a US judgment.

## Shadow libraries in AI-training litigation

The 2025 fair-use rulings made acquisition, not training, the expensive question. As of October 2026 the two leading cases point in different directions on how acquisition should be judged.

### Bartz v. Anthropic

**Facts** ([Order on Fair Use, Dkt. 231, 2025-06-23](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)). Anthropic downloaded 196,640 books from Books3 (2021), at least 5 million copies from LibGen (June 2021) and at least 2 million from PiLiMi (July 2022), "over seven million" pirated copies in total. It kept them in a "central library" of "all the books in the world". It also bought print books and scanned them.

**Holdings.** Judge Alsup held training "exceedingly transformative" and fair use, and digitizing purchased print books fair use. He denied summary judgment to Anthropic on the pirated library copies and set those for trial:

- "the person who copies the textbook from a pirate site has infringed already, full stop."
- Pirating otherwise available copies is "inherently, irredeemably infringing even if the pirated copies are immediately used for the transformative use and immediately discarded". He then said the case need not be decided "on that rule", because Anthropic kept the copies for a general-purpose library.
- Later buying a copy of a book "will not absolve it of liability for the theft but it may affect the extent of statutory damages."

**Settlement.** The case settled before the piracy trial.

| Term | Value | Source |
|---|---|---|
| Fund | **\$1.5B**, non-reversionary | [Final approval order, Dkt. 680](https://assets-us-01.kc-usercontent.com:443/1eeb16db-4934-006e-40a6-38fa91285ebb/36cce252-a32c-4cbb-a624-31dd8ac9574c/2026-07-20%20Order%20Granting%20Final%20_dckt%20680_0_.pdf) |
| Works covered | **482,460** | Dkt. 680 |
| Per work | About **\$3,000** before fees and costs, about 4× the \$750 statutory minimum | Class notice (R09) |
| Claims | 91.3% of works (440,490) claimed as of 2026-04-16 | Dkt. 680 |
| Opt-outs and objections | 350 valid opt-outs covering 1,802 works; 54 objections or comments; all objections overruled | Dkt. 680 |
| Attorneys' fees | \$101,561,111, about 6.8% of the fund (12.5% requested) | Dkt. 680 |
| Conduct terms | Anthropic must destroy its LibGen and PiLiMi copies | Class notice (R09) |
| Release | Past conduct only (through 2025-08-25 per R02). Excludes claims about model outputs. Not a license to train | Class notice (R09) |
| Default split | 50/50 author/publisher for trade and university-press books | Class notice (R09) |
| Final approval | **2026-07-20**, Judge Araceli Martínez-Olguín, who took over the case from Judge Alsup | Dkt. 680; [Authors Guild](https://authorsguild.org/news/court-grants-final-approval-anthropic-copyright-settlement/) |
| Payments | "We currently expect to send the first round of payments on or before November 15, 2026." The parties say the Effective Date has passed, "assuming that no late-filed appeal is permitted to go forward" | [Settlement site](https://www.anthropiccopyrightsettlement.com/), read 2026-10-15 |
| Appeals | Three notices reported: Publishers Coordination Counsel (around 2026-08-19, fees); a non-class-counsel law firm (around 2026-08-20, fee allocation); an objecting class member (filed 2026-08-31, not in proper form, re-filing required). Only the last is described as able to delay payouts substantially | [Writer Beware](https://writerbeware.blog/2026/07/23/anthropic-settlement-update-final-settlement-approved/), updated 2026-09-02 (secondary) |

The arithmetic explains the settlement [inference]. At the \$750 statutory minimum, 482,460 works imply \$361.8M of exposure. At the \$150,000 willful maximum they imply \$72.4B. The settlement sits at about 4× the minimum. Pearl Cohen [describes it](https://pearlcohen.com/federal-court-approves-1-5-billion-anthropic-copyright-settlement-largest-in-history) as the largest copyright settlement in history.

### Kadrey v. Meta

**Facts** ([Dkt. 598, 2025-06-25](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf)). Meta first downloaded LibGen in October 2022 to test its value for training. In spring 2023, after failing to acquire licenses, it decided to train on the LibGen works, and it abandoned licensing efforts after confirming that LibGen held most of the works available for license from publishers it had been negotiating with. It downloaded Anna's Archive in early 2024. "There is no dispute that Meta torrented LibGen and Anna's Archive." The parties dispute whether, and how much, Meta re-uploaded while torrenting. Unsealed emails reportedly cite 81.7 TB torrented, 35.7 TB of it from Z-Library and LibGen (secondary).

**Holding.** Judge Chhabria granted Meta partial summary judgment on fair use, only because these 13 authors "made the wrong arguments". He stated that the ruling does not mean Meta's use is lawful, and that market dilution could win on a better record. On shadow libraries specifically:

- Downloading "must still be considered in light of its ultimate, highly transformative purpose: training Llama." He cited the Bartz order as contrary authority. "Because Meta's ultimate use of the plaintiffs' books was transformative, so too was Meta's downloading of those books."
- Shadow-library use could still matter if it "benefitted those who created the libraries" and perpetuated their infringement. That would weigh under factor four, or support a contributory-infringement claim. The plaintiffs had offered no evidence of either.
- Distribution through torrenting is a separate claim, and it is still live.

**Since then** (secondary, from the [*ChatGPT Is Eating the World*](https://chatgptiseatingtheworld.com/) tracker):

- On 2026-03-25 the court allowed a fourth amended complaint that adds contributory infringement based on torrenting ([post](https://chatgptiseatingtheworld.com/2026/03/25/judge-chhabria-grants-kadreys-request-to-file-4th-amended-complaint-to-add-contributory-infringement-claim-related-to-torrenting-but-judge-strongly-rebukes-kadreys-lawyers-for-pattern-of-blam/)).
- The summary-judgment hearing on the distribution claims is set for **2027-02-25** ([post](https://chatgptiseatingtheworld.com/2026/03/27/kadrey-v-meta-gets-scheduling-order-summary-judgment-motion-hearing-for-distribution-claim-wont-be-heard-until-feb-25-2027/)).
- On 2026-07-08 Chhabria **denied** the authors' motion to certify the downloading ruling for interlocutory appeal. He called the issue "a difficult one" and said "Judge Alsup's opinion makes a good point", but chose to wait for a final judgment ([post](https://chatgptiseatingtheworld.com/2026/07/08/judge-chhabria-denies-kadrey-book-authors-motion-to-seek-an-interlocutory-appeal-of-downloading-part-of-ruling-in-fair-use-decision/)).

### Where the two judges disagree

| Question | Alsup, *Bartz* (2025-06-23) | Chhabria, *Kadrey* (2025-06-25) |
|---|---|---|
| Is training an LLM on books fair use? | Yes: "exceedingly transformative" | Yes, on this record. But he writes that "in most cases" unlicensed training "will likely be" illegal, mainly through market dilution |
| Is acquisition from pirate sites judged separately from training? | **Yes.** Building a central library from pirated copies "was its own use — and not a transformative one" | **No.** Downloading is judged "in light of its ultimate, highly transformative purpose" |
| Role of bad faith | Not the basis of the decision; relevant to willfulness and damages | "The law is in flux"; in any case it "doesn't move the needle here" |
| Distribution via BitTorrent | Not decided in the fair-use order | A separate, live claim; hearing 2027-02-25 |
| Outcome | Settled for \$1.5B | Meta won on fair use for training; distribution and contributory claims pending |

**Which way I lean, for a builder's purposes: plan on the Alsup view** [~75% that a court would apply something close to it to a literature tool]. Three reasons:

1. Chhabria's reasoning depends on a highly transformative end use, model training. A reading or search tool that serves copies to users has no comparable purpose to borrow.
2. The [US Copyright Office's Part 3 report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf) (pre-publication, 2025-05-09) says "knowing use of a dataset that consists of pirated or illegally accessed works should weigh against fair use without being determinative."
3. Japan's [Agency for Cultural Affairs guidance](https://www.bunka.go.jp/english/policy/copyright/pdf/94055801_01.pdf) (May 2024) says knowingly collecting training data from piracy sites "should be strictly avoided".

An appellate ruling on the question before the end of 2027 looks unlikely [~15%]. Bartz settled, and Kadrey reaches final judgment only after the 2027-02-25 hearing.

### Other AI cases and dealings

- **Authors v. NVIDIA** (N.D. Cal.). An amended complaint (January 2026) alleges that NVIDIA's data team approached Anna's Archive for "high-speed access" to about 500 TB, that the site warned the data was illegally acquired, and that management approved within a week. The complaint does not allege payment. Anna's Archive says it never dealt with NVIDIA directly. NVIDIA moved to dismiss on 2026-01-29; I found no ruling as of October 2026 [low confidence] (secondary, [TorrentFreak](https://torrentfreak.com/nvidia-contacted-annas-archive-to-secure-access-to-millions-of-pirated-books/)).
- **Bulk access sold to model developers.** As of January 2025 Anna's Archive said about 20–30 companies or teams had bulk access, granted for large donations or data ([TorrentFreak](https://torrentfreak.com/pirate-libraries-are-forbidden-fruit-for-ai-companies-but-at-what-cost-250131/)). A DeepSeek vision-language paper reportedly used its e-book data (secondary).

## Risks to individual readers

US-focused. Not legal advice.

| Activity | Legal status (US) | Enforcement record | Other risks |
|---|---|---|---|
| Downloading an in-copyright paper or book from a shadow-library website | Infringes the reproduction right. Statutory damages run from \$750 to \$30,000 per work, up to \$150,000 if willful and as low as \$200 if innocent ([17 U.S.C. §504(c)](https://www.law.cornell.edu/uscode/text/17/504)) | No US suit against an individual researcher for reading Sci-Hub papers was found [moderate confidence; absence of evidence in a limited search] | Sci-Hub has relied partly on university credentials, some reportedly obtained by phishing. The UK's Police Intellectual Property Crime Unit warned in March 2021 that it could steal credentials (secondary) |
| Downloading via BitTorrent | Adds a distribution claim, because BitTorrent clients upload by default. This is the live claim against Meta | Rightsholders have pursued Meta over its torrenting; no suit against an individual reader found | Exposure scales with the number of works in a torrent, and a single library torrent can contain thousands [inference] |
| Uploading papers or fulfilling requests (for example on Sci-Net) | Distribution | The Delhi High Court treated Sci-Net as part of Sci-Hub and ordered it blocked | Token rewards make participation look commercial [inference] |
| Supplying institutional login credentials | Breach of the institution's license and acceptable-use policy | Publishers suspend access by IP range: [JSTOR's terms](https://about.jstor.org/terms) (2026-04-24) reserve the right to suspend "IP address(es)" | Can cut off a whole campus; disciplinary exposure |
| Using these sites outside the US | Varies. Sites are blocked at the ISP level, by court or administrative order, in India, the UK, France, Sweden, Russia, Belgium, Germany, Italy, the Netherlands and elsewhere | Enforcement is at the network level, not against users | — |

**A note on fair use for personal reading.** A footnote in Chhabria's Kadrey order says a researcher who downloaded books from a shadow library "in the process of writing an article on shadow libraries" would "almost certainly" be making fair use. That is dicta, from one district judge, about research on the libraries themselves. Downloading a paper to read it for its content is the substitutive use that copyright markets price. Alsup's contrary language ("infringed already, full stop") was written about exactly the "research purpose" argument. I put [~85%] on a US court holding an ordinary personal-reading download not to be fair use, if one were ever litigated. The practical risk to an individual reader has so far been low; the legal status is not ambiguous.

## Risks to tool builders

A reader's exposure is per work they download. A tool's exposure is per work it surfaces or ingests, multiplied across its users, and its operator is identifiable. That asymmetry is why the builder's answer is categorical. The table follows R09's green/yellow/red scheme.

| Tool behavior | Rating | Why |
|---|---|---|
| Link to shadow-library pages, files or search results | **Red** | Contributory-infringement exposure in the US. In the EU, a for-profit linker to unauthorized content is presumed to know it is unauthorized ([*GS Media*, CJEU 2016-09-08](https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf)). The 2026 injunctions reached registries, registrars, CDNs and hosts |
| Show an "available on [shadow library]" badge or query their indexes | **Red** | Functionally the same as linking. It also advertises infringement as a feature [inference, high] |
| Ingest shadow-library files for search, RAG or training | **Red** | The *Bartz* facts. USCO: knowing use of pirated data weighs against fair use. Japan's guidance says "strictly avoid". Statutory damages scale per work: 10,000 ingested books imply \$7.5M–\$1.5B of theoretical exposure [calculation] |
| Ingest shadow-library *metadata* dumps (for example Anna's Archive's WorldCat-derived records) | **Red** | Covered by a US deletion order that extends to "all torrents" ([OCLC opinion](https://librarytechnology.org/docs/32142.pdf)). Contract and trespass claims do not need copyrightable content. Legal open equivalents exist: Open Library dumps, Library of Congress MARC, Wikidata, OpenAlex (CC0) |
| Buy or accept bulk "high-speed access" to a shadow corpus | **Red** | The NVIDIA allegations; the Bartz and Kadrey facts |
| Host user-uploaded PDFs in a shared library | **Yellow** | Some uploads will come from shadow libraries. Requires full DMCA §512 compliance: a registered agent (\$6, renewed every 3 years), takedown handling and a repeat-infringer policy (R09). Default to private |
| Process PDFs the user supplies, locally, with no sharing | **Green** for the tool | No distribution (R09). Optionally show the user the provenance you can detect |
| Cite published coverage studies (Himmelstein, Walters) and report "no legal copy found" | **Green** | Facts about the landscape. Routing to request, interlibrary loan or purchase is the legal alternative |

One practical point adds to the legal ones: **shadow sources are unreliable infrastructure.** In 2024–2026 their domains were seized, suspended or blocked repeatedly, and service providers were enjoined from serving them. A tool built on them breaks on a court's schedule.

## What their usage says about the access problem

The shadow libraries are, among other things, a large natural experiment in what readers want when price and friction go to zero.

1. **Demand is large and global.** Hundreds of thousands of downloads per day from one site (Sci-Hub in 2019, Anna's Archive in 2025) is a lower bound on demand for frictionless free access. China was the largest single source of Sci-Hub downloads in early 2022, with the US second (secondary). India responded at the policy level: its One Nation One Subscription scheme became operational on 2025-01-01, months before the Delhi High Court's blocking order (secondary).
2. **People with legal access use them too.** Bohannon's 2016 analysis found heavy use from rich-country campuses. In 2017 Penn's overall coverage was about the same as Sci-Hub's. For readers with institutional access, the draw is plausibly convenience: one box, a DOI in, a PDF out, no proxy login and no publisher interstitials [~70%; inference, since no recent survey separates convenience from coverage]. **A legal tool that matches that interaction would capture much of this demand.**
3. **Legal coverage gaps are real but narrow, and they sit in specific places.** They are the paywalled backfile (articles published before 2021), the typeset version of record, book chapters and in-copyright books. They are not recent articles: for 2021–2024 papers the pirate sites are now worse than the legal open-access routes.
4. **The 2018 prediction has not come true yet.** Himmelstein et al. wrote that free access to nearly all literature suggested "the toll access business model may become unsustainable." Eight years later, transformative agreements are being extended (the [UC–Elsevier agreement](https://osc.universityofcalifornia.edu/uc-publisher-relationships/elsevier-oa-agreement/) now runs to 2027-12-31). What changed the open share was funder policy and gold/hybrid open access [inference, moderate confidence].
5. **The measurement gap is itself a finding.** No study reports a legal-only combined coverage figure, and no study measures how often an emailed request to an author succeeds. Both are cheap to measure with a resolver and some care.

### What to do instead: a legal route for each case

| If you need… | Do this first | Main obstacle | Chapter |
|---|---|---|---|
| A paper from 2021 onward | Run the open-access cascade: OpenAlex/Unpaywall location, then arXiv/bioRxiv/PMC/Europe PMC, then Google Scholar "All versions" | The version may be a preprint or accepted manuscript | [Open Papers and Preprints](/access/open-papers/) |
| A paywalled paper published before 2021 | Institutional access or interlibrary loan; JSTOR's free 10 per 30 days; JPASS (\$199/yr for 120 PDFs, as of October 2026); email the corresponding author | Turnaround time; no measured success rate for author requests | [University and Employer Access](/access/academic-and-employer/), [Cheap Subscriptions](/access/subscriptions/) |
| The exact version of record for citation or figures | Library access or pay-per-view; check whether the accepted manuscript differs materially | Cost per article | [The Access Ladder](/access/access-ladder/) |
| An in-copyright book | Public-library e-lending; HathiTrust full-text search to find the pages, then a library or used copy | Holds queues; out-of-print titles | [Public Libraries](/access/public-libraries/) |
| A public-domain book | HathiTrust, Internet Archive, Project Gutenberg | None of substance | [The Public Domain and Open Corpora](/access/public-domain/) |
| To build a tool that "finds a copy" | A legal-copy resolver with a provenance ledger; report unreachable items instead of filling gaps | Coverage of the backfile | [The Legal Map](/building/legal-map/), [A Reference Architecture](/building/reference-architecture/) |

## Why Open Stacks routes only to legal sources

**Open Stacks routes only to legal sources.** Its catalog, prototypes and recommendations do not link to Sci-Hub, LibGen, Z-Library, Anna's Archive or their successors. They do not check availability on these sites, mirror them, or ingest their files or metadata, and this wiki gives no domains or access instructions. We cite published studies that measured their coverage, and we report their legal history, because both are part of an accurate map.

The reasons, in decreasing order of weight:

1. **Liability scales with the tool.** One reader's download is one work. A catalog that routes thousands of readers to millions of works is a contributory-infringement target, and in the EU any for-profit linking carries a presumption of knowledge.
2. **Provenance contaminates what is built downstream.** *Bartz* shows that a legitimate end use does not reliably cure an infringing acquisition. A "catalog of everything" that a reader later uses for RAG or fine-tuning must have clean inputs, and the [reference architecture](/building/reference-architecture/) keeps a provenance record for exactly this reason.
3. **Metadata is not a safe harbor.** The OCLC deletion order shows that even catalog records from these sources carry legal encumbrances. Open, legal metadata covers what a discovery tool needs.
4. **Robustness.** A tool should not break when a registrar receives a court order.
5. **The open problem is legal, not technical.** The evidence above says the legal gap is concentrated in the paywalled backfile and in books. Recent work is increasingly open, and convenience can be engineered. Building a one-box legal resolver, measuring what it cannot reach, and routing the rest to libraries, authors and purchase is the useful project. Pointing at a pirate index would hide the gap instead of measuring it.

This is a routing rule, not a verdict on the wider ethics debate about shadow libraries, which this chapter does not try to settle.

## Open questions

- **What is the legal-only coverage rate on Walters' sample?** Re-run his 875 works through a legal cascade only (Unpaywall/OpenAlex, PMC/Europe PMC, preprint servers, Google Scholar "All versions") and through a cascade plus one institutional subscription. That would settle the 70–80% estimate.
- **How much does the typeset version matter?** For papers whose only free copy is a preprint or accepted manuscript, how often does the published version differ materially in results, tables or figures? A sample of a few hundred matched pairs would answer it.
- **Has shadow-library usage fallen as open access rose?** There is no independent log study after Himmelstein and Bohannon (2015–2016 data). Any new log release, or traffic-panel data, would show whether the open-access share of 2022–2023 articles (59%) reduced demand.
- **Is Sci-Net refilling Sci-Hub's post-2020 gap?** The Delhi High Court found post-2022 articles present. Walters' 2021–2024 numbers are in his Supporting Information tables S11–S12. A 2026 re-measurement would show whether crowd-sourcing replaced scraping.
- **Will the Ninth Circuit resolve the Alsup–Chhabria conflict on acquisition?** The Kadrey distribution-claim hearing (2027-02-25) and the final judgment that follows are the next opportunity.
- **When do Bartz payments actually go out?** The test is whether the class member's re-filed appeal (if any) is allowed to go forward and whether the 2026-11-15 target holds.
- **What happens to the NVIDIA motion to dismiss (filed 2026-01-29)?** It is the first case built around an alleged direct approach to Anna's Archive.
- **What fraction of emailed author requests succeed, by field and paper age?** No rigorous measurement was found. An opt-in request tool could publish the first one.

## Related pages

- [Open Papers and Preprints](/access/open-papers/): the legal open-access cascade and the infrastructure behind it
- [The Access Ladder](/access/access-ladder/): cheapest legal route for a given work
- [University and Employer Access](/access/academic-and-employer/): subscriptions, proxies, interlibrary loan, and the contract terms that govern them
- [Public Libraries](/access/public-libraries/): e-lending and databases for books
- [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/)
- [The Legal Map](/building/legal-map/): the full green/yellow/red table for tool builders
- [A Reference Architecture](/building/reference-architecture/): catalog/content separation and provenance records
- [Cruxes](/start-here/cruxes/): the disagreements that change what you should build
- [Glossary](/reference/glossary/)
