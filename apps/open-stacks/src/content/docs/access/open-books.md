---
title: Open-Access Books and Textbooks
description: How much of a technical researcher's reading list exists as a free, legal book (24 of 55 canonical titles in a test; 8 of 10 in ML, none of six 1930–1989 classics), what DOAB, OAPEN, OpenStax, LibreTexts, the Open Textbook Library and author-hosted PDFs actually contain as of October 2026, and an ordered routine for finding the free copy.
---

*Status: draft, October 2026. Counts, licences and link statuses are as of 2026-10-15 unless another date is given. The DOAB, OAPEN, Open Textbook Library and OpenStax figures are the research dossier's own counts from the official bulk exports and APIs on that date, recomputed in an independent verification pass. MIT Press Direct to Open figures come from Wikipedia because the press's own pages block automated access. In the 55-book coverage test, every "free" verdict except ESL's (host unreachable) was checked on a primary page, but most "not free" verdicts rest on the research agent's prior knowledge rather than a page-by-page search. Sources: the [R01 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R01-open-books.md) and primary sources linked inline.*

This chapter covers books and textbooks that are free and legal to read: public domain, openly licensed, or posted in full by the author or publisher. Papers have [their own chapter](/access/open-papers/), as do [the public domain and large open corpora](/access/public-domain/), library lending ([Public Libraries](/access/public-libraries/)) and [the shadow libraries](/access/shadow-libraries/).

## The short version

- **In a test of 55 frequently recommended books across six fields, 24 (44%) have a free, legal full text.** The list was chosen by an LLM, which probably biases it toward famously free titles. The split by field is lopsided: ML/AI 8 of 10, probability and statistics 3 of 9, decision theory and economics 2 of 9.
- **Era matters as much as field.** Post-1990 technical textbooks: 17 of 33 free (52%). Pre-1929 classics: 6 of 6. In-copyright classics from 1930–1989 (Feller, Savage, Kuhn, Popper, Parfit, Brooks): 0 of 6. Popular non-fiction since 1990: 1 of 10.
- **Controlled digital lending adds 11 points.** Counting books with a borrowable English scan on Open Library, 30 of 55 (55%) can be read free and legally. A higher figure, 36 of 55, counts six books whose only lendable copy is a translation or a study guide.
- **Free to read is not free to reuse.** Only 7 of the 55 are public domain or under CC BY / CC BY-SA. Fifteen of the 24 free books are gratis PDFs or HTML posted by authors or publishers with all rights reserved, often "personal use only".
- **The claim that free legal sources cover under 20% of modern technical textbooks is false for the canonical core and probably true for the long tail.** Mainstream commercial series are almost absent from the open record: DOAB lists 3 *Graduate Texts in Mathematics* volumes and 0 *Undergraduate Topics in Computer Science*.
- **The most valuable layer is the least indexed.** The free ML and statistics canon (Bishop, ESL, ISL, Murphy, MacKay, Sutton & Barto, BDA3, Boyd) lives on author and publisher pages, not in DOAB or any structured catalog. It is also the most fragile layer.
- **DOAB is large (about 92,000 books) but mostly humanities and social science, and 69% of its STEM books come from three publishers** of edited collections and journal special-issue reprints: IntechOpen, MDPI and Frontiers.
- **OpenStax moved new and updated titles to CC BY-NC-SA on 2026-04-22**, after a March post blaming AI-accelerated commercial reuse. Older CC BY versions stay reusable.
- **If you do one thing:** for a modern technical book, check the author's own book page before anything else. For anything published 1930–1989, go straight to [Open Library](https://openlibrary.org/) and check whether the *English* edition is borrowable.

## How much is free: a test on 55 books

### Method

The research agent that wrote the dossier, an LLM, picked 55 books often named in reading lists and syllabi, 9 or 10 in each of six fields. It deliberately mixed "famously free" and "famously paid" titles, and practitioner bestsellers with academic texts. For each book it searched the [DOAB](https://directory.doabooks.org/) export and the [Project Gutenberg](https://www.gutenberg.org/) catalogue and recorded the [Open Library](https://openlibrary.org/dev/docs/api/search) lending status on 2026-10-15. It opened the author's or publisher's page for every book it rated free, but for only four it rated not free (see below).

"Free legal full text" means one of three things: public domain in the US, an open licence, or a complete text deliberately posted by the author or publisher. Partial texts and controlled digital lending (CDL) are counted separately.

### Limits of the sample

Read the numbers below as a rough map, not a measurement.

- **The list is LLM-chosen, and the choice is partly circular.** Free books are discussed, linked and recommended more often on the web, and a model's sense of "the canon" comes from web text. So a model-picked canon over-represents famously free books. The bias most likely pushes the free share *up* [~75%].
- **The sample is small.** At n=55 the binomial standard error on 44% is about 7 points, so a 95% interval runs roughly 31–57%. Each field has only 9 or 10 books, so a field's share could easily move 30 points with a different list.
- **Other lists would give other numbers.** The dossier judges that another analyst's list could plausibly put modern technical textbooks anywhere from 35% to 60% free. The share is most sensitive to how many ML books are included.
- **"Not free" is less certain than "free."** Of the 31 non-free verdicts (including Jaynes, which is partial), only AIMA, Wasserman, Kleppmann and Jaynes were checked on the author's or publisher's page; McElreath's site refused the check. The other 27 rely on prior knowledge [high confidence, not certainty]. An unnoticed free copy would raise the share.
- **Two free verdicts carry residual doubt.** Blitzstein & Hwang's free PDF sits on Google Drive behind the authors' domain, and the course site that would show the publisher's permission refused automated access [~80% authorised]. The host of *Elements of Statistical Learning* was unreachable in every check on 2026-10-15, but the Internet Archive [records a successful capture](https://archive.org/wayback/available?url=hastie.su.domains/ElemStatLearn/) of the book page on 2026-10-04 [~90% that the long-standing free PDF is still served to browsers].

### Results by field

| Field | n | Free legal full text | Partial | Plus a borrowable English scan (CDL) | Free or borrowable |
|---|---|---|---|---|---|
| Probability & statistics | 9 | 3 (33%) | 1 (Jaynes, ch. 1–3) | +2 | 5 (56%) |
| ML / AI | 10 | **8 (80%)** | 0 | +1 | 9 (90%) |
| Decision theory, forecasting, economics | 9 | 2 (22%) | 0 | +1 | 3 (33%) |
| Philosophy, rationality | 9 | 4 (44%) | 0 | +2 | 6 (67%) |
| History, social science | 9 | 4 (44%, all pre-1900 public domain) | 0 | +0 | 4 (44%) |
| Software engineering | 9 | 3 (33%) | 0 | +0 | 3 (33%) |
| **Total** | **55** | **24 (44%)** | **1** | **+6** | **30 (55%)** |

Open Library's search API flags 12 of the 31 non-free books as "borrowable", but that flag is a maximum over every edition of a work, including translations. Checking each edition's Internet Archive item shows that six of the twelve (Kahneman, Mankiw, Diamond, Harari, Acemoglu & Robinson, Brooks) have no lendable English edition: the lendable copy is a Dutch, Korean, German, Polish, Spanish, Swedish or Chinese translation, or, for Mankiw, a 2001 study guide. For *Thinking, Fast and Slow*, for example, the [editions list](https://openlibrary.org/works/OL15992072W/editions.json) has three English scans, all print-disabled only, while the Dutch and Korean scans are lendable (checked 2026-10-15). Counting translations, the total reaches 36 of 55 (65%), or 37 with Popper, whose main work record is flagged through a Galician translation. For an English reader, 30 of 55 is the right figure.

### Which books

| Field | Free (type) | Not free, but an English scan is borrowable | Not free |
|---|---|---|---|
| Probability & statistics | Blitzstein & Hwang, *Introduction to Probability* 2e (gratis); Gelman et al., *Bayesian Data Analysis* 3e (gratis, non-commercial); Gelman, Hill & Vehtari, *Regression and Other Stories* (gratis, personal use). Partial: Jaynes, *Probability Theory* (ch. 1–3) | Bertsekas & Tsitsiklis, *Introduction to Probability* 2e; Feller, Vol. 1 | Wasserman, *All of Statistics*; Casella & Berger; McElreath, *Statistical Rethinking* 2e (lectures free) |
| ML / AI | Bishop, *PRML*; Hastie, Tibshirani & Friedman, *ESL*; James et al., *ISL*; Murphy, *Probabilistic ML* (CC BY-NC-ND); Goodfellow et al., *Deep Learning* (HTML only); Sutton & Barto; MacKay, *ITILA*; Prince, *Understanding Deep Learning* | Géron, *Hands-On ML* (1st edition only; the sample entry was the 3rd) | Russell & Norvig, *AIMA* 4e |
| Decision theory, forecasting, economics | Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* 3e; Osborne & Rubinstein, *A Course in Game Theory* | Savage, *The Foundations of Statistics* | Tetlock & Gardner, *Superforecasting*; Kahneman, *Thinking, Fast and Slow*; Peterson, *An Introduction to Decision Theory*; Hubbard, *How to Measure Anything*; Mas-Colell, Whinston & Green; Mankiw, *Principles of Economics* |
| Philosophy, rationality | Yudkowsky, *Rationality: From AI to Zombies* (gratis); Hume, *Treatise* (PD); Mill, *Utilitarianism* (PD); MacAskill, Bykvist & Ord, *Moral Uncertainty* (CC BY-NC-ND) | Parfit, *Reasons and Persons*; Kuhn, *Structure of Scientific Revolutions* | Popper, *Logic of Scientific Discovery*; Pearl, *Causality* 2e; Bostrom, *Superintelligence* |
| History, social science | Gibbon; Thucydides (Crawley tr.); Smith, *Wealth of Nations*; Tocqueville (Reeve tr.) (all PD) | none | Diamond; Harari; Pinker, *Better Angels*; Acemoglu & Robinson; Scott, *Seeing Like a State* |
| Software engineering | Abelson & Sussman, *SICP* 2e (CC BY-SA 4.0); Arpaci-Dusseau, *OSTEP* (gratis); Beyer et al., *Site Reliability Engineering* (1st edition only) | none | Brooks, *Mythical Man-Month*; Kleppmann, *DDIA*; Martin, *Clean Code*; Thomas & Hunt, *Pragmatic Programmer*; Gamma et al., *Design Patterns*; Cormen et al., *CLRS* 4e |

### Results by era and genre

Era separates free from paid as sharply as field does.

| Segment | n | Free | Share |
|---|---|---|---|
| Post-1990 technical textbooks and monographs (statistics, ML, economics and decision theory, software engineering, causality) | 33 | 17 | **52%** |
| … the same, excluding ML/AI | 23 | 9 | 39% |
| Popular or general non-fiction since 1990 | 10 | 1 (*Rationality: From AI to Zombies*) | 10% |
| Pre-1929 classics | 6 | 6 | 100% |
| In-copyright classics, 1930–1989 | 6 | **0** | **0%** |

The 1930–1989 hole is the biggest gap. Four of those six (Feller, Savage, Kuhn, Parfit) have a borrowable English scan on Open Library; Popper and Brooks are lendable only in translation. The hole closes slowly. Works published before 1978 get a 95-year US term, so one publication year enters the public domain each January: 1930 works did on 2026-01-01, including Freud's *Civilization and Its Discontents* (in the original German) and Russell's *The Conquest of Happiness* ([Duke CSPD, Public Domain Day 2026](https://cspd.law.duke.edu/publicdomainday/2026/)). Books from 1978 on, such as *Reasons and Persons* (1984), run for the author's life plus 70 years. One shortcut: US works published before 1964 also needed a copyright renewal (same Duke page), so a mid-century US book whose renewal lapsed is already public domain; foreign works do not get this exemption. For a 1931–1963 US book, check HathiTrust for full view before borrowing; [The Public Domain and Open Corpora](/access/public-domain/) covers how.

### Free to read versus free to reuse

| Kind of free text | Count | Share of the 24 free | Books |
|---|---|---|---|
| Gratis: posted by author or publisher, all rights reserved | 15 | 62.5% | Blitzstein & Hwang, BDA3, ROS, PRML, ESL, ISL, Goodfellow, Sutton & Barto, MacKay, Prince, FPP3, Osborne & Rubinstein, *Rationality: A–Z*, OSTEP, SRE |
| Public domain | 6 | 25% | Hume, Mill, Gibbon, Thucydides, Smith, Tocqueville |
| Creative Commons | 3 | 12.5% | Murphy (BY-NC-ND), *Moral Uncertainty* (BY-NC-ND), SICP (BY-SA 4.0) |
| **Reusable commercially (PD, CC BY or CC BY-SA)** | **7 of 55** | **13% of the sample** | the six PD books plus SICP |

The gratis terms vary and matter. *Regression and Other Stories* is posted "for personal use only … With permission from Cambridge University Press" ([ROS page](https://avehtari.github.io/ROS-Examples/)). BDA3 is "for non-commercial purposes" ([BDA page](https://sites.stat.columbia.edu/gelman/book/)). MacKay's page says "You are welcome to view the book on-screen" ([ITILA](https://www.inference.org.uk/itila/book.html)). Goodfellow et al. offer HTML only, because "our contract with MIT Press forbids distribution of too easily copied electronic formats" ([deeplearningbook.org](https://www.deeplearningbook.org/)).

For a reader this distinction rarely matters. For a tool it decides the architecture. Sort every document into one of three licence lanes:

- **Lane A (PD, CC BY, CC BY-SA):** you may redistribute, embed and use commercially. 13% of the sample.
- **Lane B (CC NC or ND):** you may share copies non-commercially; NC rules out commercial use and ND rules out adapted versions. Whether embeddings or summaries count as adaptations is unsettled, so keep lane B out of commercial products [I].
- **Lane C (gratis, personal use):** link out, index locally for your own use, never redistribute. Together, lanes A to C cover 44% of the sample.

[The Legal Map](/building/legal-map/) covers what each lane permits in more detail.

## Verdict on the under-20% claim

The claim under test: *free legal sources cover under 20% of the modern technical textbooks someone would want.*

**For the canonical core, it is false.** In the sample, 17 of 33 post-1990 technical books are free (52%; 95% interval roughly 35–69% from sample size alone), 9 of 23 without ML (39%), and 8 of 10 in ML. Even if the LLM-chosen list inflates the share by 15–20 points, the core stays above 20% [~80%].

**For the long tail, it is probably true.** Commercial textbook series barely appear in the open-access record. Counts from the DOAB export, 2026-10-15:

| Series | Volumes in DOAB | Examples |
|---|---|---|
| Springer *Graduate Texts in Mathematics* | 3 | Axler, *Measure, Integration & Real Analysis*; *Metric Lie Groups*; *Quaternion Algebras* |
| Springer *Undergraduate Texts in Mathematics* | 2 | Axler, *Linear Algebra Done Right* 4e; *Beginning in Algebraic Geometry* |
| *Springer Texts in Statistics* | 1 | |
| *Springer Series in Statistics* | 1 | |
| *Undergraduate Topics in Computer Science* | 0 | |
| *Texts in Computer Science* | 0 | |
| *Universitext* | 0 | |
| CRC *Texts in Statistical Science* | 0 | |
| MIT *Adaptive Computation and Machine Learning* | 4 | *Boosting*; *Gaussian Processes for ML*; *ML for Data Streams*; *Distributional RL* |

GTM alone runs to around 300 volumes [~70% on the exact figure], so the openly licensed share of the mainstream series is likely at most 2–5% [medium confidence]. DOAB undercounts, because author-hosted PDFs never enter it: ISL is itself a *Springer Texts in Statistics* volume, and ESL is in *Springer Series in Statistics*. Even allowing for that, the free share of the full universe of modern textbooks is probably well under 20% [~75%].

**What you want decides which answer applies.** Someone reading ML, Bayesian statistics and forecasting lives in an unusually open world: most of the books they will reach for first are free. Someone reading microeconomic theory, decision theory, algorithms or classic software engineering texts should expect a third or less, and should plan on a library or a purchase for the rest. I lean that the useful framing is "most of the famous ML books, little of everything else" [~75%].

## The sources

| Source | What it is | Size (2026-10-15) | Licence | Best for | Main catch |
|---|---|---|---|---|---|
| [DOAB](https://directory.doabooks.org/) | Directory of peer-reviewed OA books; metadata and links | 92,260 books, 9,818 chapters, about 820 publishers | Publisher-supplied; 34% CC BY, 33% BY-NC-ND | Scholarly monographs, especially humanities and social science | Its STEM share is mostly edited collections |
| [OAPEN Library](https://library.oapen.org/) | Full-text repository behind much of DOAB | 36,434 books, 6,504 chapters | Per book | Same, more European, more HSS | 83% HSS among classified books |
| [OpenStax](https://openstax.org/) | Rice University's peer-reviewed intro textbooks | 84 live titles | CC BY-NC-SA for 70 of 84 since April 2026 | Intro statistics, economics, data science, Python | Introductory only |
| [LibreTexts](https://libretexts.org/) | Remixable textbook platform, 17 subject libraries | "3,000+ textbooks" (self-reported) | Mixed CC, per page | Breadth at lower-division level | Licence varies page by page; self-reported size inconsistent |
| [Open Textbook Library](https://open.umn.edu/opentextbooks) | Curated catalog with faculty reviews | 1,887 titles | Mostly CC; 42% BY-NC-SA | Finding a reviewed intro text | 3 ML titles, 34 statistics, 1 game theory |
| MIT Press Direct to Open ([Wikipedia summary](https://en.wikipedia.org/wiki/MIT_Press)) | Library-funded OA monographs, no author fees | about 30% of the press's books OA as of 2026 (Wikipedia) | Typically CC BY-NC-ND [I] | MIT monographs, including ML [I] | Monographs, not textbooks |
| Author-hosted books | PDFs and HTML on author or publisher pages | No index; a few hundred important titles [I] | Mostly gratis, all rights reserved | Graduate ML, statistics, optimization, game theory | Unindexed; links rot; new editions may close |
| [MIT OpenCourseWare](https://ocw.mit.edu/) and course notes | Course materials, lecture notes | 2,500+ courses | CC BY-NC-SA 4.0 | Substitutes for paid textbooks | Notes, not books |
| arXiv lecture notes | Notes posted as preprints | about 2,200 records mention "lecture notes" in the comments | arXiv licences vary | Maths and physics topics | Small layer outside maths and physics |
| [free-programming-books](https://github.com/EbookFoundation/free-programming-books) | Curated link list | 13,418 link entries | List is CC BY 4.0 | Programming and CS discovery | Does not vet legality |
| [Project Gutenberg](https://www.gutenberg.org/) and other PD libraries | Public-domain texts | 79,598 ebooks | PD in the US | Works published in 1930 or earlier | 57% literature, 3.5% science |

### DOAB

The [Directory of Open Access Books](https://directory.doabooks.org/) indexes peer-reviewed OA books and links to the full text. It is run by the OAPEN Foundation in The Hague ([Wikipedia](https://en.wikipedia.org/wiki/Directory_of_Open_Access_Books)). The dossier downloaded DOAB's complete metadata export on 2026-10-15 (a 281 MB CSV) and counted:

- **92,260 book records and 9,818 chapter records** from about 820 distinct publisher names (815–822, depending on how name variants are normalised).
- **Languages:** 58.0% English, 14.7% German, 13.1% French.
- **Growth:** about 7,200–8,200 books per publication year for 2020–2023, then about 5,100–5,300 for 2024 and 2025. The drop is very likely ingestion lag, not a real decline [I, medium].

Other published sizes count different things: "just over 60,000" titles in early 2023 ([Delta Think](https://www.deltathink.com/news-views-open-access-books-2), stale), "over 94,000" on the [Common Pile DOAB card](https://huggingface.co/datasets/common-pile/doab) (2025), and 128,242 OAI-PMH records, which include publisher, peer-review and deleted records.

**Subject mix.** 76.7% of books carry a Thema or BIC subject code. By first-listed code, classified books are 34.1% humanities and arts, 27.0% social sciences, economics and law, 28.7% STEM (science, maths, technology, computing, medicine), 6.9% reference and interdisciplinary, and 3.3% earth sciences, lifestyle and health. Counting any listed code instead, 34.7% carry a STEM code and 64.4% a humanities or social-science code. The mapping of codes to domains is the dossier's choice, so treat the split as roughly 60/30.

The technical core is thin. Counting a book once per code it carries: mathematics 451, probability and statistics 97, computer science 1,308, artificial intelligence 477, machine learning 74, programming 195, econometrics 25. For comparison: economics 2,509, philosophy 2,203, history 7,910.

**Three publishers dominate DOAB's STEM shelf.** Of 20,286 STEM books, IntechOpen supplies 6,449 (edited collections), MDPI 4,829 (reprints of journal special issues) and Frontiers 2,648 (topic collections): **68.6%** of the shelf, against 23.8% of DOAB overall. Next come KIT Scientific Publishing (1,681), Springer Nature (870) and Taylor & Francis (409); the MIT Press has 87. Of 115 DOAB titles containing "machine learning", 68 are MDPI. Only 96 DOAB titles contain "Introduction to" (49 in STEM), and 19 contain "Textbook". DOAB requires a peer-review policy from publishers but does not screen pedagogical quality.

**Licences.** CC BY 34.1%, CC BY-NC-ND 33.4%, none recorded 12.6%, other or publisher licence 6.7%, CC BY-NC 4.5%, CC BY-NC-SA 4.0%, CC BY-SA 3.7%, CC BY-ND 0.9%. So 37.8% allow commercial reuse. About 24,000 books are both English and CC BY, CC BY-SA or PD, which is roughly what the [Common Pile](https://arxiv.org/abs/2506.05209) training corpus took from DOAB. Licences are publisher-supplied, and Common Pile's card warns of "license laundering and inaccurate metadata".

**Good finds for this readership.** Below the edited collections, DOAB holds useful titles such as:

- MacAskill, Bykvist & Ord, *Moral Uncertainty* (OUP 2020, CC BY-NC-ND)
- *Essays on Longtermism* (OUP 2025, CC BY-NC)
- *An Anthology of Global Risk* (Open Book Publishers 2024, CC BY-NC) and *The Era of Global Risk* (OBP 2023)
- *Risk, Death, and Well-Being* (OUP 2025, CC BY-NC-ND)
- Halpern, *Actual Causality* (MIT 2016, CC BY-NC-ND)
- Schapire & Freund, *Boosting* (MIT 2012); Rasmussen & Williams, *Gaussian Processes for Machine Learning* (MIT 2005); Bellemare, Dabney & Rowland, *Distributional Reinforcement Learning* (MIT 2023), all CC BY-NC-ND
- Axler, *Linear Algebra Done Right* 4e (Springer 2024, CC BY-NC) and *Measure, Integration & Real Analysis* (Springer 2020)
- Barroso et al., *The Datacenter as a Computer* (Springer 2019, CC BY)
- *Learning Statistics with jamovi* (OBP 2025, CC BY-SA)

**If you browse DOAB for technical books, filter by publisher first.** Down-weight IntechOpen, MDPI and conference proceedings; up-weight university presses (Oxford, Cambridge, MIT, UCL, California, Michigan) and specialist OA presses (Open Book Publishers, Language Science Press, punctum). Without that filter, the STEM shelf is mostly special-issue reprints [I, high].

**Machine access.** The complete CSV export (`https://directory.doabooks.org/download-export?format=csv`) and the [OAI-PMH endpoint](https://directory.doabooks.org/oai/request?verb=Identify) both work from a cloud IP; the REST search API answered "You address is not allowed to access this API", and HTML record pages return 403 to scripts.

### OAPEN

The [OAPEN Library](https://library.oapen.org/) hosts the PDFs and EPUBs; 34,532 DOAB book records are harvested from it. Its export (112 MB CSV, 2026-10-15) has **36,434 books and 6,504 chapters from about 479 publishers**, 64% in English and 25% in German. Among classified books, 82.7% are humanities or social science and 10.6% STEM. The largest contributors are Taylor & Francis (4,427) and Springer Nature (3,705). The [OAPEN homepage](https://www.oapen.org/) claims "40,000+" OA books and "1.5 million+" monthly downloads, and announced a Max Planck Society collection on 2026-09-16. Machine access matches DOAB: CSV export and OAI-PMH work; REST search refuses cloud IPs.

For a technical reader OAPEN adds little that DOAB does not already list. It matters as the place the files live.

### OA programmes at presses

Counts are records in the DOAB and OAPEN exports (2026-10-15), so they are lower bounds for any publisher that does not deposit everything.

| Programme | Model | DOAB books | Output | Notes |
|---|---|---|---|---|
| Springer Nature OA books | Author or funder fee; mostly CC BY | 4,028 | 556 (2022), 607 (2023), 438 (2024), 395 (2025) deposited in OAPEN | Largest commercial OA book producer in these indexes; a handful of textbooks (Axler) |
| Taylor & Francis / Routledge | Author or funder fee | 3,821 | | Mostly HSS monographs and handbooks |
| MIT Press, incl. Direct to Open | Collective library funding, no author fees; launched 2021 | 280 | 79 DOAB records for 2022, 37 for 2023 | "80 monographs were made freely available in the program's second year"; "As of 2026, roughly 30% of the press's books … are open access" ([Wikipedia](https://en.wikipedia.org/wiki/MIT_Press), checked 2026-10-15; official pages blocked automated access) |
| Cambridge University Press | Author fees plus "Flip it Open" (titles opened after sales) | 416 | 1–3 per year in OAPEN | No programme figures found |
| Oxford University Press | Author or funder fee | 333 | 24–44 per year (2019–2025) | *Moral Uncertainty*, *Essays on Longtermism* |
| UCL Press | Fully OA university press | 396 | 25–50 per year | |
| Open Book Publishers | Library membership | 537 | 26–46 per year | Osborne & Rubinstein's *Models in Microeconomic Theory* |
| Other OA-heavy presses: ANU (fully OA), Michigan, punctum, UC Press Luminos, Language Science Press | Mixed: library support, membership, fees | 870, 670, 456, 301, 273 | 7–40 per year where measured | Almost entirely humanities, social science and linguistics |

University-press OA output is in the hundreds of titles per year, overwhelmingly humanities and social-science monographs. Programmes that systematically open STEM *textbooks* barely exist outside OpenStax-style OER and author-hosting [I]. The MIT Press is the exception that matters for this readership, because its OA list includes ML monographs such as *Boosting*, GPML and *Distributional RL*; the MIT titles in DOAB cited here are all CC BY-NC-ND.

### OpenStax

[OpenStax](https://openstax.org/) (Rice University, founded 2012) publishes peer-reviewed introductory textbooks. Its CMS API lists 129 book records on 2026-10-15: 84 live, 34 retired, 8 unlisted, 3 deprecated. Live titles have a median publish year of 2022. It self-reports 49 million students reached and \$3.8 billion saved all-time ([impact page](https://openstax.org/impact), undated).

**The licence switch.** On 2026-04-22 OpenStax announced: "OpenStax has transitioned our textbook library from a mix of CC BY and CC BY-NC-SA licensing to CC BY-NC-SA licensing across the library. This change will apply to all newly released and updated versions of our titles, with limited exceptions." The same post says "No action is needed by anyone who has previously created derivatives of CC BY content" ([OpenStax, 2026-04-22](https://openstax.org/blog/openstax-licensing)). The reasoning is in an earlier post: "Emerging technologies like artificial intelligence (AI) have accelerated this shift … permissive licensing has unintentionally rewarded those who are taking more than they invest" ([OpenStax, 2026-03-18](https://openstax.org/blog/when-open-resources-meet-a-changing-landscape)). On 2026-10-15 the API shows 70 of the 84 live titles under CC BY-NC-SA 4.0, 4 still under CC BY 4.0, and 10 with no licence field.

What this means:

- **For readers, nothing changes.** The books stay free online and as PDFs.
- **For commercial tools, new OpenStax content is off-limits without a deal.** Earlier CC BY versions remain reusable. If you depend on one, archive it now.
- **As a signal, it is the clearest case of an OER licence tightening because of AI.** I put about even odds on at least one other large OER producer moving new titles to a non-commercial licence by the end of 2027 [I, ~50%].

Titles relevant to this readership: *Statistics*, *Introductory Statistics* 2e, *Principles of Data Science* (2025), *Introduction to Python Programming* (2024), *Introduction to Computer Science* (2024), *Principles of Economics* 3e (2022) and *Introduction to Philosophy* (2022). None is graduate-level. The public CMS API (`https://openstax.org/apps/cms/api/v2/pages/?type=books.Book`) gives titles, states and dates without scraping.

### LibreTexts

[LibreTexts](https://libretexts.org/) is a remixable textbook platform with 17 subject libraries. Its homepage claims "3,000+ textbooks" and 500+ partner schools, while the same page also says "over 2000 textbooks" (self-reported, 2026). Licences are mixed Creative Commons, set per page, so check the licence of the exact page you plan to reuse. The Common Pile corpus extracted 62,269 CC BY, CC BY-SA or PD sections (5.3 GB) from it. Its remix model means the same chapter can appear in several "books". For this readership it is a lower-division reference, not a source of graduate texts [I, medium].

### Open Textbook Library

The [Open Textbook Library](https://open.umn.edu/opentextbooks) (University of Minnesota, Open Education Network) is the best-curated catalog of open textbooks. The dossier harvested its full JSON API on 2026-10-15:

- **1,887 textbooks** (1,743 English, 107 Spanish). The API's `total_count` field says 2,015, but only 1,887 records are returned and the homepage says 1,887.
- **Recent:** median copyright year 2021; 58% from 2020 or later; 36% from 2023 or later.
- **Reviewed:** 64% have at least one faculty review, 7,581 reviews in all, mean rating 4.43 of 5. The high mean suggests a ceiling effect, so a rating is weak evidence of quality [I].
- **Licences:** CC BY-NC-SA 41.7%, CC BY 26.1%, CC BY-NC 18.3%, CC BY-SA 10.0%, CC BY-NC-ND 2.2%, GFDL 0.8%, CC0 0.8%.
- **Level:** mostly lower-division. Humanities 365, Social Sciences 249, Natural Sciences 216, Mathematics 163, Business 159, Computer Science 145, Economics 52, Philosophy 43, Statistics 34. Three titles have "Machine Learning" in the name; one is on game theory.

Other OER collections: the BCcampus Open Collection (Canadian post-secondary, mostly CC BY; its site refused automated access, but 44 of its titles appear in the OTL), and [OTexts](https://otexts.com/), which publishes Hyndman & Athanasopoulos's *Forecasting: Principles and Practice* 3e free online.

**Use the OTL when you need a reviewed introductory text in a field you do not know.** For graduate-level ML, statistics or decision theory it will rarely have what you want.

### The author-hosted canon

For a technical reader these are the most valuable free books. Few are in DOAB, because most are gratis rather than openly licensed. They exist because ML and statistics have a norm of author-hosting, and several publishers permit it: Cambridge (MacKay, Boyd, Barber, ROS, *Mathematics for ML*), MIT Press (Sutton & Barto, Mohri, Murphy, Prince), Springer (Bishop, ISL, ESL) and CRC (BDA3, and probably Blitzstein & Hwang).

Statuses were checked on 2026-10-15. "Resolves" means the page answered from a script that day.

| Book | Terms | Link | Status and fragility |
|---|---|---|---|
| MacKay, *Information Theory, Inference, and Learning Algorithms* (CUP 2003) | Full PDF, EPUB and more; "welcome to view the book on-screen" | [inference.org.uk/itila](https://www.inference.org.uk/itila/book.html) | Resolves; long-standing |
| Bishop, *Pattern Recognition and Machine Learning* (Springer 2006) | Full PDF (18 MB) hosted by Microsoft Research; no licence text | [Microsoft Research PRML page](https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/) | Resolves (page and PDF) |
| Hastie, Tibshirani & Friedman, *Elements of Statistical Learning* 2e | Author PDF (12th printing) | [hastie.su.domains/ElemStatLearn](https://hastie.su.domains/ElemStatLearn/) | Unreachable from scripts (resets, 503); archived with status 200 on 2026-10-04 [~90% still served to browsers] |
| James et al., *ISL* (R 2e 2021; Python 2023) | Full PDFs | [statlearning.com](https://www.statlearning.com/) | Resolves |
| Murphy, *Probabilistic Machine Learning: An Introduction* (2022) and *Advanced Topics* (2023) | Draft PDFs, CC BY-NC-ND, dated 2025-04-18 and 2025-12-10 | [probml.github.io/pml-book](https://probml.github.io/pml-book/) | Resolves; drafts newer than print |
| Goodfellow, Bengio & Courville, *Deep Learning* (MIT 2016) | HTML only, by contract | [deeplearningbook.org](https://www.deeplearningbook.org/) | Resolves |
| Sutton & Barto, *Reinforcement Learning* 2e (MIT 2018) | Full PDF | [incompleteideas.net](http://incompleteideas.net/book/the-book-2nd.html) | Resolves |
| Boyd & Vandenberghe, *Convex Optimization* (CUP) | PDF; CUP "kindly agreed to allow us to keep the book available on the web" | [stanford.edu/~boyd/cvxbook](https://web.stanford.edu/~boyd/cvxbook/) | Resolves |
| Zhang et al., *Dive into Deep Learning* (CUP 2023) | HTML and notebooks, CC BY-SA 4.0 | [d2l.ai](https://d2l.ai/) | Resolves; lane A, so mirrorable |
| Prince, *Understanding Deep Learning* (MIT 2023) | Free PDF, 2026 build | [udlbook.github.io](https://udlbook.github.io/udlbook/) | Resolves |
| Gelman et al., *Bayesian Data Analysis* 3e | PDF "for non-commercial purposes" | [BDA page](https://sites.stat.columbia.edu/gelman/book/) | Resolves |
| Gelman, Hill & Vehtari, *Regression and Other Stories* (CUP 2020) | PDF, personal use only, with CUP's permission | [ROS-Examples](https://avehtari.github.io/ROS-Examples/) | Resolves |
| Blitzstein & Hwang, *Introduction to Probability* 2e | Redirects to a Google Drive PDF | [probabilitybook.net](http://probabilitybook.net/) | Resolves; publisher permission not seen [~80%]; Drive links are easy to revoke |
| Durrett, *Probability: Theory and Examples* 5e | Author PDF | [Durrett's PTE page](https://sites.math.duke.edu/~rtd/PTE/pte.html) | Resolves |
| Jaynes, *Probability Theory: The Logic of Science* | **Partial:** front matter and chapters 1–3 (95 pp.) | [bayes.wustl.edu](https://bayes.wustl.edu/etj/prob/book.pdf) | Resolves |
| Deisenroth, Faisal & Ong, *Mathematics for Machine Learning* (CUP 2020) | "We will keep PDFs of this book freely available" | [mml-book.github.io](https://mml-book.github.io/) | Resolves |
| Mohri, Rostamizadeh & Talwalkar, *Foundations of ML* 2e (MIT 2018) | CC BY-NC-ND via MIT Press | [cs.nyu.edu/~mohri/mlbook](https://cs.nyu.edu/~mohri/mlbook/) | Resolves |
| Rasmussen & Williams, *Gaussian Processes for ML* (MIT 2006) | Download; also CC BY-NC-ND in DOAB | [gaussianprocess.org/gpml](https://gaussianprocess.org/gpml/) | Resolves; two independent copies |
| Barber, *Bayesian Reasoning and Machine Learning* (CUP 2012) | Publisher agreed to keep the online version free | [Barber's BRML page](http://web4.cs.ucl.ac.uk/staff/D.Barber/pmwiki/pmwiki.php?n=Brml.HomePage) | Resolves |
| Hardt & Recht, *Patterns, Predictions, and Actions* (Princeton 2022) | Full preprint PDF | [mlstory.org](https://mlstory.org/) | Resolves |
| Jurafsky & Martin, *Speech and Language Processing* 3e draft | Full draft, August 19, 2026 release | [stanford.edu/~jurafsky/slp3](https://web.stanford.edu/~jurafsky/slp3/) | Resolves; updated more often than any print book |
| Hernán & Robins, *Causal Inference: What If* | Free download | [miguelhernan.org/whatifbook](https://miguelhernan.org/whatifbook) | Resolves |
| Osborne & Rubinstein, *A Course in Game Theory* (MIT 1994), plus Rubinstein's other books | "My 8 books are free" | [Rubinstein's books page](https://arielrubinstein.tau.ac.il/books.html) | Resolves; also offers *Lecture Notes in Microeconomic Theory* (2e 2012), *Modeling Bounded Rationality* (MIT 1998) and *Bargaining and Markets* (with Osborne, 1990) |
| Osborne & Rubinstein, *Models in Microeconomic Theory* (Open Book Publishers 2020; 2e 2023) | CC BY-NC-ND 4.0 | [DOI 10.11647/OBP.0204](https://doi.org/10.11647/OBP.0204) | Licence per Crossref metadata; also on Rubinstein's page (titled there "Models of …") |
| Easley & Kleinberg, *Networks, Crowds, and Markets* (CUP 2010) | Complete pre-publication draft | [Cornell networks-book page](https://www.cs.cornell.edu/home/kleinber/networks-book/) | Resolves; draft, not the printed text |
| Shoham & Leyton-Brown, *Multiagent Systems* (CUP 2009) | Free ebook download | [masfoundations.org](http://www.masfoundations.org/) | Resolves |
| Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* 3e | Free online | [otexts.com/fpp3](https://otexts.com/fpp3/) | Resolves |
| Yudkowsky, *Rationality: From AI to Zombies* (MIRI 2015) | Full text online; ebook pay-what-you-want | [readthesequences.com](https://www.readthesequences.com/) | Resolves |
| Abelson & Sussman, *SICP* 2e | CC BY-SA 4.0; MIT-hosted 883-page PDF | [web.mit.edu SICP PDF](https://web.mit.edu/6.001/6.037/sicp.pdf) | PDF resolves; the classic MIT Press HTML server returned HTTP 400 |
| Arpaci-Dusseau, *Operating Systems: Three Easy Pieces* | Free online | [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) | Resolves |
| Erickson, *Algorithms* (2019) | CC BY 4.0; the electronic version "will remain freely available here indefinitely" | [Erickson's Algorithms page](https://jeffe.cs.illinois.edu/teaching/algorithms/) | Resolves; lane A, so mirrorable; not in the sample |
| Beyer et al., *Site Reliability Engineering* (Google/O'Reilly 2016) | 1st edition "Read online"; **2nd edition "Buy from Google Books" only** | [sre.google/books](https://sre.google/books/) | Resolves; new edition closed |
| Winters et al., *Software Engineering at Google* | HTML, CC BY-NC-ND 4.0 | [abseil.io](https://abseil.io/resources/swe-book) | Resolves |
| Chacon & Straub, *Pro Git* 2e | CC BY-NC-SA 3.0 | [git-scm.com/book](https://git-scm.com/book/en/v2) | Resolves |

**Some famous books are not free.** Russell & Norvig's *AIMA* (the site offers only the preface, contents, bibliography, index and pseudocode), Wasserman's *All of Statistics* (errata and R code only), Kleppmann's *DDIA* (purchase only) and McElreath's *Statistical Rethinking* (lectures free, book not) ([AIMA](https://aima.cs.berkeley.edu/), [Wasserman](https://www.stat.cmu.edu/~larry/all-of-statistics/), [DDIA](https://dataintensive.net/)).

Four patterns:

1. **Terms span the whole range**, from CC BY / CC BY-SA (Erickson, D2L, SICP) through CC BY-NC-ND (Murphy, Mohri) to "personal use only" (ROS) and "HTML only" (Goodfellow).
2. **The free version is often a draft**, which can be *newer* than print (Murphy's 2025 drafts, the August 2026 SLP3 release) or differ from it (Easley & Kleinberg). Cite the version you read.
3. **The layer is fragile.** It depends on personal and departmental servers and on publisher goodwill. In checks on 2026-10-15, ESL's host was unreachable all day, SICP's classic MIT Press HTML server returned HTTP 400 (the MIT-hosted PDF still works), and the Stat110 site that would show the publisher's permission for Blitzstein & Hwang refused automated access.
4. **New editions can close.** Google's SRE book is free in its 1st edition and purchase-only in its 2nd. One case is not a trend [I, low-medium that this becomes common], but it is a reason to keep a personal copy of the free edition where the terms allow.

**Decision:** if your reading is ML, statistics or optimization, keep your own list of these books with the URL, edition and terms, and save personal copies where the terms permit (MacKay's page invites on-screen viewing; ROS forbids redistribution). This list is the highest-value, least-indexed part of the free supply, and no catalog maintains it for you.

### Lecture notes as substitutes

When the textbook you want is not free, a set of course notes often covers the same ground.

- **[MIT OpenCourseWare](https://ocw.mit.edu/about/):** 2,500+ courses under CC BY-NC-SA 4.0. Example: [6.041SC Probabilistic Systems Analysis](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/) uses Bertsekas & Tsitsiklis 2e as its text ([syllabus](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/pages/syllabus/)), and its lectures, recitations and problem sets cover much of the book [I, that they substitute for it].
- **Course note sets** such as the [Stanford CS229 main notes](https://cs229.stanford.edu/main_notes.pdf) act as de facto free textbooks for a course's scope.
- **arXiv:** the arXiv API on 2026-10-15 returned 2,182 records with "lecture notes" in the comments field and 317 with both words in the title; title-word counts by category are small (cs.LG 21, math.PR 24, stat.ML 8). arXiv phrase search is idiosyncratic, so treat these as lower bounds. The layer is real but modest, and strongest in mathematics and physics. To search it, query the comments field: `https://export.arxiv.org/api/query?search_query=co:%22lecture%20notes%22+AND+cat:math.PR`, or use "Comments" in arXiv's advanced search.

[Lectures, Talks and Other Media](/finding/lectures-and-media/) covers video lectures.

### free-programming-books

The EbookFoundation [free-programming-books](https://github.com/EbookFoundation/free-programming-books) repository (list itself CC BY 4.0; last commit 2026-10-14) contains 13,418 link entries: 5,919 in `books/` (1,874 English entries by programming language, 893 by subject), 5,435 courses and the rest screencasts, podcasts and miscellany.

**It does not vet legality.** In the ML and statistics section the dossier found at least one entry pointing to what looks like an unauthorised mirror of a commercial Springer book (on an `inis.jinr.ru` path) [legality judgement medium confidence]. Use it to discover candidates, then confirm that the file sits on the author's or publisher's own site, or carries a licence, before relying on it.

### Public domain and library lending, in brief

Pre-1929 classics were 6 of 6 free in the sample. Project Gutenberg's 79,598 ebooks (homepage, 2026-10-15) are 57% language and literature and 3.5% science. HathiTrust, Wikisource, Standard Ebooks and the large open corpora are covered in [The Public Domain and Open Corpora](/access/public-domain/).

For the 1930–1989 gap, the main legal route is controlled digital lending through Open Library. CDL is constrained but alive: the Second Circuit affirmed *Hachette v. Internet Archive* on 2024-09-04, the Internet Archive let the December 2024 deadline for Supreme Court review pass, and more than 500,000 books were removed from lending ([Wikipedia summary](https://en.wikipedia.org/wiki/Hachette_v._Internet_Archive), checked 2026-10-15; secondary source). Borrowing needs a free account and is subject to waitlists and loan limits. [Public Libraries](/access/public-libraries/) covers CDL and library e-lending in detail.

## Free substitutes for the gaps

When the book you want is not free, a free book often covers most of the same material. Pairings marked [I] are the chapter's judgement, not a measured equivalence.

| Wanted, not free | Free substitute | Notes |
|---|---|---|
| Feller, *An Introduction to Probability Theory and Its Applications*, Vol. 1 | [Grinstead & Snell](https://math.dartmouth.edu/~prob/prob/prob.pdf) (GFDL); Durrett, *PTE* 5e | Feller's English scan is also borrowable on Open Library |
| Bertsekas & Tsitsiklis, *Introduction to Probability* | MIT OCW 6.041SC; Blitzstein & Hwang [I] | B&T is also borrowable in English |
| Mankiw, *Principles of Economics* | [OpenStax *Principles of Economics* 3e](https://openstax.org/details/books/principles-economics-3e); [CORE Econ](https://www.core-econ.org/) | |
| Mas-Colell, Whinston & Green | Osborne & Rubinstein, *Models in Microeconomic Theory* (CC BY-NC-ND); Rubinstein, *Lecture Notes in Microeconomic Theory* [I] | Narrower and lower level than MWG |
| Pearl, *Causality* | Hernán & Robins, *What If*; Halpern, *Actual Causality* (DOAB) [I] | Different emphases: epidemiological vs formal |
| Cormen et al., *CLRS* | Erickson, *Algorithms* (CC BY 4.0) [I] | Less encyclopedic |
| Wasserman, *All of Statistics*; Casella & Berger | Blitzstein & Hwang for probability; ISL and BDA3 for applied inference [I] | No single free equivalent found for mathematical statistics |
| Russell & Norvig, *AIMA* | None comprehensive; Sutton & Barto, Shoham & Leyton-Brown and the ML canon cover parts [I] | |
| Kuhn, Parfit, Savage | Borrow the English edition on Open Library | Not free, but legally readable |

## How to find the free copy fast

The sample suggests where to look first, by what you are after:

| If you want | Look first at | Hit rate in the sample | Then |
|---|---|---|---|
| A modern ML or AI textbook | The author's book page | 8 of 10 | Publisher page; DOAB for MIT Press titles |
| A modern statistics, econometrics or decision theory text | The author's page, then DOAB | 3 of 9 (statistics); 2 of 9 (decision and economics) | Substitutes table above; library |
| An introductory text in a new field | Open Textbook Library, OpenStax | not tested | LibreTexts |
| A scholarly monograph (philosophy, EA, history) | DOAB search | not tested | Publisher's OA page |
| A classic published in 1930 or earlier | Project Gutenberg, Standard Ebooks | 6 of 6 | HathiTrust, Wikisource |
| A 1930–1989 classic | Open Library, English edition; HathiTrust for unrenewed 1931–1963 US books | 0 of 6 free; 4 of 6 borrowable | Library; buy used |
| Popular non-fiction since 1990 | Your public library's e-lending | 1 of 10 free | [Public Libraries](/access/public-libraries/) |
| A programming book | free-programming-books | not tested | Confirm the host is the author or publisher |

**The routine, in order:**

1. **If it was published in 1930 or earlier** (public domain in the US as of 2026), go to Gutenberg or HathiTrust. For a US book from 1931–1963, check HathiTrust for full view too, in case the copyright was never renewed.
2. **Otherwise, search for the book's own website.** Query the title plus "pdf" or "book" and look for a page on the author's institutional domain, a personal domain named for the book (statlearning.com, mlstory.org), or the publisher. For the ML and statistics canon this usually takes under a minute [I].
3. **Check the terms on that page** before saving or sharing: open licence, non-commercial, personal use, or on-screen only.
4. **Search DOAB** for scholarly titles, especially from MIT Press, OUP, CUP, UCL Press and Open Book Publishers. Use the [DOAB website search](https://directory.doabooks.org/) in a browser; its record pages and REST API refuse many scripts.
5. **Check Open Library's lending status, then open the specific edition.** The search page shows "Borrow" at the work level; click through and confirm the borrowable edition is in your language. Scripts can query `https://openlibrary.org/search.json?q=<title>&fields=key,title,ebook_access` and then the work's `editions.json`.
6. **If nothing turns up, look for a substitute** (table above), OCW notes, or arXiv lecture notes.
7. **Then move to paid or institutional routes:** see [The Access Ladder](/access/access-ladder/).

**How to tell a legal free PDF from a pirated one.** A legal copy usually sits on the author's institutional or personal site, the publisher's site, or a recognised repository (DOAB, OAPEN, arXiv), and often says why it is free ("with permission from Cambridge University Press"). A recent commercial textbook on an unrelated university mirror, a file-sharing host or an anonymous Google Drive with no permission statement is very likely unauthorised [I, high]. Blitzstein & Hwang's PDF is a borderline case: the file is on Google Drive, but the authors' own domain points to it.

### For builders

If you are building a resolver that routes a title to its free copy (see [A Reference Architecture](/building/reference-architecture/)):

- **Use bulk dumps, not live search.** The DOAB and OAPEN CSV exports (about 400 MB together), the Gutenberg `pg_catalog.csv`, and full harvests of the Open Textbook Library JSON API (202 pages) and the OpenStax CMS API give a complete, refreshable local catalog. DOAB and OAPEN REST search refuse cloud IPs. Query Open Library live only for lending status, which changes.
- **Build a registry of author-hosted books** (title, edition, URL, terms, last-checked date, checksum) and run a scheduled link check. A few hundred entries would cover most of what a technical reader wants [I, medium].
- **Store the licence lane per document** (A, B or C above), and keep lane C as link-out only.
- **Filter DOAB by publisher** before showing it to readers.
- **Resolve Open Library lending to a specific edition** and check its language before showing "borrowable".
- **Archive CC BY versions** of OpenStax books you depend on, since newer versions are non-commercial.

## Open questions

- **A sample not chosen by an LLM.** What share of the required texts on, say, 50 public graduate syllabi in statistics, ML, economics and philosophy have a free legal copy? This would remove the circularity in the 55-book test.
- **The long-tail denominator.** How many volumes do GTM, *Springer Texts in Statistics* and CRC *Texts in Statistical Science* contain, and what share have an author-hosted free copy that DOAB misses?
- **Textbooks inside DOAB.** What fraction of DOAB's roughly 20,000 STEM books are textbooks rather than edited collections or special-issue reprints? A classifier over the export's titles, series and page counts could answer this.
- **Licence drift.** Will other OER producers follow OpenStax to non-commercial licences? Tracking the Open Textbook Library licence mix each quarter would show it.
- **Blitzstein & Hwang and ESL.** Does CRC's permission for the Blitzstein & Hwang PDF exist in writing, and is ESL's host still serving the PDF to browsers?
- **MIT Press Direct to Open.** How many titles has D2O opened per year since 2021, and how many are in ML, statistics or cognitive science? The official figures could not be fetched.
- **Closing editions.** Beyond SRE, how often does a new edition of a formerly free book go purchase-only? A registry with edition tracking would measure this over a few years.
- **CDL in practice.** What are typical waitlists for the English scans of Kuhn, Parfit, Feller and Savage on Open Library?

## Related pages

- [What to Do First](/start-here/decision-guide/): where free books sit in the overall plan
- [The Public Domain and Open Corpora](/access/public-domain/): Gutenberg, HathiTrust, Wikisource and licence-clean corpora
- [Open Papers and Preprints](/access/open-papers/): the same question for articles
- [Public Libraries](/access/public-libraries/): controlled digital lending and library e-books for the 1930–1989 gap
- [The Shadow Libraries](/access/shadow-libraries/): what this chapter excludes, and why
- [The Access Ladder](/access/access-ladder/): every access route ordered by cost
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): DOAB, OAPEN and Open Library as catalog sources
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): finding which books to read
- [Lectures, Talks and Other Media](/finding/lectures-and-media/): lectures as substitutes for books
- [The Legal Map](/building/legal-map/): what each licence lane allows a tool to do
- [A Reference Architecture](/building/reference-architecture/): a resolver that routes each work to its free copy
- [Directory of Sources and Tools](/reference/directory/)
