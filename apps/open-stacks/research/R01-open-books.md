# Free and open-access books and textbooks — research dossier

- **Date:** 2026-10-15. All "accessed" dates are 2026-10-15 unless stated otherwise.
- **Track:** R01 (Open Stacks / CAIRN). Scope: what freely and legally available books and textbooks exist, and how much they cover. Covers the scholarly OA-book layer (DOAB, OAPEN, OA programmes at presses), open textbooks/OER (OpenStax, LibreTexts, Open Textbook Library, BCcampus, OTexts), author-hosted editions of major technical books, curated lists (free-programming-books), lecture notes (MIT OCW, course sites, arXiv), public-domain libraries (Project Gutenberg, Standard Ebooks, Wikisource, HathiTrust, Internet Archive/Open Library) and large open corpora (Institutional Books, Common Pile, Common Corpus). It ends with an empirical coverage test on 55 canonical books.
- **Method.**
  1. **Primary data pulls (my own analysis).** I downloaded the complete DOAB metadata export (CSV, 281 MB, 102,078 rows) and the complete OAPEN Library export (CSV, 112 MB, 42,938 rows) and computed counts, subject mix, licences, languages, years and publishers myself. I tested the DOAB and OAPEN OAI-PMH and REST endpoints. I harvested the full Open Textbook Library JSON API (1,887 records), queried the OpenStax CMS API (129 book records, 40 recent blog posts), downloaded the Project Gutenberg catalogue CSV (79,576 rows), listed the Common Pile datasets via the Hugging Face API, and queried the Open Library search API for every book in the empirical sample.
  2. **Direct fetches of primary pages:** author book pages, publisher and programme pages, dataset cards, and the OpenStax licensing announcement.
  3. **Secondary sources** (mostly Wikipedia) only where primary pages blocked automated access.
- **Important limitation.** The shared web-search budget for this session ran out after my first search. Most of the work therefore uses direct fetches of known primary URLs and official APIs, not open-ended search. Several primary sites (doabooks.org, mitpress.mit.edu, direct.mit.edu, hathitrust.org, bccampus.ca, otexts.com/fpp3, the Stat110 site, hastie.su.domains) returned HTTP 403/429/503 or reset the connection from this environment. Where that happened I say so and fall back to other evidence.
- **Key sources:** DOAB export and OAI-PMH [1–3]; OAPEN export, homepage and OAI [4–6]; OpenStax CMS and licensing posts [11–15]; Open Textbook Library API [16–17]; author pages [22–55]; Gutenberg catalogue [57]; Common Pile, Common Corpus and Institutional Books dataset cards and papers [65–68]; Open Library API [64].

Legend: **[V]** verified on a primary source or official data in this session. **[S]** reported by a secondary source. **[I]** my inference. Confidence is given as high/medium/low or as a percentage.

---

## Executive summary

1. **Of 55 canonical, frequently recommended books, 24 (44%) have a free and legal full text** [V for each "free" row; [I, high] for most "not free" rows]. Including one partial text (Jaynes, chapters 1–3), the figure is 25 (45%). The split by field is lopsided:
   - ML/AI: 8/10 (80%)
   - philosophy/rationality: 4/9
   - history/social science: 4/9, every one of them pre-1900 public domain
   - probability/statistics: 3/9
   - software engineering: 3/9
   - decision theory/forecasting/economics: 2/9
2. **The claim "free legal sources cover <20% of the modern technical textbooks someone would want" is false for the canonical core but probably true for the long tail.**
   - Canonical core: in my sample, 17 of 33 post-1990 technical textbooks (52%) are free. Without ML it is 9 of 23 (39%).
   - Long tail: mainstream commercial textbook series barely appear in the OA record. DOAB lists only 3 *Graduate Texts in Mathematics* (plus 2 *Undergraduate Texts in Mathematics*), 1 *Springer Texts in Statistics* and 0 *Undergraduate Topics in Computer Science* volumes [V, my count from the DOAB export]. [corrected in verification]
   - Popular non-fiction since 1990: 1 of 10 is free.
   - In-copyright classics from 1930–1989 (Feller, Savage, Kuhn, Popper, Parfit, Brooks): 0 of 6. This "20th-century hole" is the biggest gap.
3. **"Free to read" is not the same as "free to reuse."** Only 7 of the 55 books are public domain or under a licence that allows commercial reuse (6 PD works plus SICP under CC BY-SA 4.0). Fifteen of the 24 free books are gratis PDFs hosted by authors or publishers with all rights reserved, often "personal use only" (ROS, BDA3) or "on-screen viewing" (MacKay) [V]. This matters for any tool that indexes, redistributes or trains on texts.
4. **Controlled digital lending (CDL) adds roughly 11 points of reading access in English.** Open Library's search API rates 12 of the 31 non-free books "borrowable", but for six of them (Kahneman, Mankiw, Diamond, Harari, Acemoglu & Robinson, Brooks) the work-level flag comes only from a lendable translation or, for Mankiw, a study guide; their English scans are print-disabled only. Six have a lendable English edition: Bertsekas & Tsitsiklis, Feller, Géron (1st ed.), Savage, Parfit and Kuhn [V, Open Library editions API + Internet Archive item metadata, 2026-10-15]. [corrected in verification] Counting English-language CDL, 30/55 (55%) can be read free and legally; counting lendable translations too, 36/55 (65%). [corrected in verification] CDL is still under pressure: the Second Circuit affirmed *Hachette v. Internet Archive* on 2024-09-04, IA did not seek Supreme Court review (Dec 2024), and more than 500,000 books were removed from lending [S].
5. **DOAB is large, but mostly humanities and social sciences, and its STEM half is mostly edited collections.**
   - Size: 92,260 book records and 9,818 chapter records from 819 publisher names [V, my count, export of 2026-10-15].
   - Subject mix among the 76% of books with a Thema/BIC classification:
     - humanities and arts ≈34%
     - social sciences, economics and law ≈27%
     - STEM (Thema P/T/U/M) ≈29%
     - other ≈10%
   - Counting any listed code rather than the first: 34.7% of classified books carry a STEM code and 64.4% an HSS code.
   - **69% of DOAB "STEM" books come from three publishers:** IntechOpen (6,449), MDPI (4,829) and Frontiers (2,648). These are mostly edited collections and journal special-issue reprints, not textbooks.
6. **OAPEN (the full-text repository behind much of DOAB) is even more HSS-heavy:** 36,434 books and 6,504 chapters from 479 publishers. Of classified books, 82.7% are HSS and 10.6% STEM [V, my count]. The OAPEN homepage claims "40,000+" OA books, "450+" publishers and "1.5 million+" monthly downloads [V].
7. **Machine access is uneven.**
   - Works: DOAB and OAPEN OAI-PMH endpoints, and full CSV exports (`/download-export?format=csv`) for both. One HTTP request gets the whole catalogue [V].
   - Blocked: both REST search APIs answered "You address is not allowed to access this API" from this cloud IP [V]. Builders should plan around bulk exports, not live search.
8. **OpenStax switched its whole library to CC BY-NC-SA on 2026-04-22**, moving away from CC BY. The stated reason is large-scale commercial reuse "accelerated" by AI [V, OpenStax blog]. Of 84 live OpenStax titles, 70 now carry BY-NC-SA. Older CC BY versions and derivatives stay valid. This is the clearest sign that OER licences are tightening because of AI.
9. **Open textbooks are numerous, recent and introductory, but rarely graduate-level ML or decision theory.**
   - The Open Textbook Library has 1,887 titles: median copyright year 2021, 58% from 2020 or later, 64% with at least one faculty review, mean rating 4.43/5.
   - It has only 3 titles with "Machine Learning" in the name, 34 statistics titles and 1 game-theory title [V, my analysis of the OTL API].
   - LibreTexts claims 3,000+ textbooks; OpenStax claims 49M students reached and $3.8B saved all-time [V, self-reported].
10. **Author-hosted ML/stats books form the de facto open canon, and it is fragile.**
    - The canon: Bishop PRML (Microsoft-hosted PDF), ISL and ISLP, Murphy PML 1–2 (CC BY-NC-ND drafts updated 2025), Sutton & Barto, MacKay, Prince UDL (2026 PDF build), Boyd & Vandenberghe, D2L (CC BY-SA 4.0), Mohri (CC BY-NC-ND via MIT Press), BDA3, ROS, and Hernán & Robins [V].
    - Fragility: from this environment, ESL's host reset connections, and MIT Press's classic SICP HTML server returned HTTP 400 [V, 2026-10-15]. Google's SRE book is free online in its 1st edition, but the 2026 2nd edition is offered only as "Buy from Google Books" [V].
11. **Public domain is large but literary.**
    - Project Gutenberg: 79,598 eBooks per its homepage; the catalogue has 78,325 text items, 57% classed under LoC "P" (language and literature) and only 3.5% under "Q" (science) [V].
    - Standard Ebooks: about 1,530 polished titles [V, count from pagination].
    - English Wikisource: 1,134,450 content pages [V].
    - HathiTrust: about 6.7M public-domain volumes of 18M+ (Sept 2024) [S].
    - Works from 1930 entered the US public domain on 2026-01-01, e.g. Freud's *Civilization and Its Discontents* and Russell's *The Conquest of Happiness* [V].
12. **There are now large licence-clean book corpora usable as building material.**
    - Common Pile v0.1 (8 TB, 30 sources; June 2025) includes DOAB (CC BY/BY-SA English only; 474,445 docs, 12.5 GB), pre-1929 US books (137,127 docs, 73.8 GB), Library of Congress (135,500 docs), Gutenberg (71,810 docs), LibreTexts (62,269 docs) and PressBooks (106,881 docs) [V].
    - Common Corpus: ~2.27T tokens, of which 967B are "OpenCulture" [V].
    - Harvard's Institutional Books 1.0: 983,004 public-domain volumes, ~242B tokens; gated, non-commercial "early-access" terms; renamed `institutional-books-hl` in Aug 2026 [V].
13. **The legal environment for book corpora shifted in 2025–26.** In *Bartz v. Anthropic*, a June 2025 ruling found training on lawfully acquired books to be fair use but sent pirated-library copies to trial. A $1.5B settlement followed in Sept 2025, with final approval in July 2026 [S]. For tool builders, this pushes toward provably legal sources such as those above.
14. **Practical upshot.** Someone building "read everything cheaply" tools should combine five sources:
    - a curated registry of author-hosted technical books (the highest-value, least-indexed layer)
    - DOAB/OAPEN bulk metadata, filtered for publisher quality
    - Gutenberg, Standard Ebooks and HathiTrust for pre-1930 works
    - Open Library CDL for the 1930–2010 gap
    - an explicit licence lane per document (PD/BY/BY-SA vs NC/ND vs gratis-personal-use)

---

## Detailed findings

### 1. The scholarly OA book layer: DOAB and OAPEN

**What they are.** The Directory of Open Access Books (DOAB) indexes peer-reviewed OA books. The OAPEN Library hosts full texts. Both are run by the OAPEN Foundation (The Hague), and DOAB was developed with OpenEdition [S: Wikipedia, ref 7]. DOAB indexes metadata and links. OAPEN stores PDFs and EPUBs, many harvested into DOAB: of the 92,260 DOAB book records, 34,532 sit in the "OAPEN harvesting" collection [V, my count].

**Size (my counts from the official exports, 2026-10-15) [V].**

| Metric | DOAB | OAPEN Library |
|---|---|---|
| Book records | 92,260 | 36,434 |
| Chapter records | 9,818 | 6,504 |
| Distinct publisher names | 819 | 479 |
| English share | 58.0% (53,499) | 64% (23,294) |
| German / French share | 14.7% / 13.1% | 25% German (9,162) |
| Median page count | 248 (n=65,210 with page data) | — |
| Self-reported on homepage | "over 94,000" (Common Pile card, 2025) [V-secondary] | "40,000+ OA books, 450+ publishers, 80+ languages, 1.5M+ monthly downloads" [V, ref 5] |
| OAI-PMH `completeListSize` | 128,288 (all record types, incl. publisher/peer-review/deleted records) | 59,193 |

Older figures for calibration: about 60,000 titles from about 500 publishers in early 2023 [S: Delta Think, ref 9; stale], and "more than 82,000 books … from 748 publishers" in a 2025 library guide [S: ref 8].

**Growth by publication year (DOAB, book records) [V].**

| Year | Books |
|---|---|
| 2018 | 5,957 |
| 2019 | 6,043 |
| 2020 | 7,595 |
| 2021 | 7,156 |
| 2022 | 7,786 |
| 2023 | 8,207 |
| 2024 | 5,055 |
| 2025 | 5,327 |

The drop in 2024–25 is very likely ingestion lag rather than a real decline [I, medium]. OAPEN shows the same shape: 3,743 (2023), 3,173 (2024), 2,697 (2025).

**Subject mix: STEM vs humanities (the brief asked for current numbers).** I assigned each DOAB book to the top-level code of its first-listed Thema (or BIC) classification. The export has Thema/BIC classification for 70,725 of 92,260 books (76.7%).

| Domain (first-listed Thema/BIC top level) | Books | % of all | % of classified |
|---|---|---|---|
| Humanities and arts (Thema N, D, Q, A, C, F, … + BIC H) | 24,085 | 26.1% | 34.1% |
| Social sciences, economics, law (J, K, L) | 19,122 | 20.7% | 27.0% |
| STEM (P science & maths, T technology/engineering, U computing, M medicine) | 20,286 | 22.0% | 28.7% |
| Reference/interdisciplinary (G) | 4,885 | 5.3% | 6.9% |
| Earth sciences/environment/geography (R) | 1,756 | 1.9% | 2.5% |
| Lifestyle/health/sport (V, W, S) | 589 | 0.6% | 0.8% |
| Unclassified | 21,535 | 23.3% | — |

The headline is that roughly 61% of classified DOAB books are humanities or social sciences and roughly 29–31% are STEM [V, my computation; the mapping of codes to domains is my choice].

The finer-grained Thema counts, where a book counts once per code listed, show how thin the technical core is [V]:

| Thema code | Books |
|---|---|
| PB Mathematics | 451 |
| PBT Probability and statistics | 97 |
| UY Computer science | 1,308 |
| UYQ Artificial intelligence | 477 |
| UYQM Machine learning | 74 |
| UM Programming/software development | 195 |
| KC Economics | 2,509 |
| KCH Econometrics | 25 |
| QD Philosophy | 2,203 |
| NH History | 7,910 |
| JP Politics | 4,583 |

**The STEM half is mostly edited collections, not textbooks.** Of the 20,286 DOAB STEM books, the top contributors are [V, my count]:

| Publisher | STEM books |
|---|---|
| IntechOpen | 6,449 |
| MDPI | 4,829 |
| Frontiers | 2,648 |
| KIT Scientific Publishing | 1,681 |
| Springer Nature | 870 |
| Taylor & Francis | 409 |
| De Gruyter | 221 |
| RAND | 214 |
| The MIT Press | 87 |

IntechOpen, MDPI and Frontiers together supply **68.6%** of DOAB's STEM books but only 23.8% of DOAB overall. MDPI "books" are reprints of journal special issues; IntechOpen and Frontiers titles are edited collections and topic collections [I, high]. Titles containing "Introduction to" appear 96 times in all of DOAB (49 in STEM), and "Textbook" 19 times. Of 115 titles containing "machine learning", 68 are MDPI.

**OAPEN subject mix** (same method, 36,434 books): 82.7% HSS, 10.6% STEM, 3.2% interdisciplinary, 2.7% earth/environment among classified [V]. OAPEN's largest contributors are Taylor & Francis (4,427), Springer Nature (3,705), transcript (2,205), Peter Lang (2,077) and De Gruyter (1,523). Its largest funder or collection tags are Knowledge Unlatched (5,769 + 2,100 "KU Open Services"), AG Universitätsverlage (2,176), SNSF (931), FWF (890) and ScholarLed (825) [V].

**Licences (DOAB books, first-listed licence) [V].**

| Licence | Share |
|---|---|
| CC BY | 34.1% |
| CC BY-NC-ND | 33.4% |
| None recorded | 12.6% |
| Other/publisher licence (e.g. OpenEdition) | 6.7% |
| CC BY-NC | 4.5% |
| CC BY-NC-SA | 4.0% |
| CC BY-SA | 3.7% |
| CC BY-ND | 0.9% |

Only 37.8% are CC BY, CC BY-SA or PD and so allow commercial reuse. 24,259 books are both English and BY/BY-SA/PD; that subset is roughly what Common Pile ingested.

**APIs and bulk access (tested 2026-10-15) [V].**

| Endpoint | Status from a cloud IP | Notes |
|---|---|---|
| `https://directory.doabooks.org/oai/request` (OAI-PMH) | Works | Formats: oai_dc, qdc, mods, mets, didl, ore, uketd_dc. Sets for Books, Book chapters, Publishers, Funders, Peer Reviews. |
| `https://directory.doabooks.org/download-export?format=csv` | Works (281 MB) | 138 columns incl. licence, Thema/BIC subjects, keywords, ISBN, DOI, download URL, funder, peer-review policy. A TSV/KBART-style export also works (44 MB). |
| `https://directory.doabooks.org/rest/search?...` | **Blocked**: "You address is not allowed to access this API" | Apparently IP-restricted. |
| `https://library.oapen.org/oai/request` | Works | |
| `https://library.oapen.org/download-export?format=csv` | Works (112 MB) | |
| `https://library.oapen.org/rest/search?...` | **Blocked** (same message) | |
| doabooks.org HTML, DOAB handle pages | 403 to curl/WebFetch | Bot protection; the CSV still gives each record's handle URI. |

**Quality signals.** DOAB requires publishers to have a peer-review policy [S: ref 7]. The export carries per-publisher peer-review metadata for 8,377 records (`peerreview.review.type`, e.g. "Proposal" vs "Full text"). DOAB does not screen *pedagogical* quality. For a reader, the strongest single quality filter is the publisher. Down-weighting IntechOpen, MDPI special-issue reprints and conference proceedings, and up-weighting university presses (OUP, CUP, MIT, UCL, California, Michigan) and specialist OA presses (OBP, LangSci, punctum), changes what a DOAB browse surfaces [I, high].

**Examples relevant to this readership** (all in DOAB, licence shown) [V, DOAB export]:
- *Moral Uncertainty* (MacAskill, Bykvist, Ord; OUP 2020; CC BY-NC-ND)
- *Essays on Longtermism* (OUP 2025; CC BY-NC)
- *An Anthology of Global Risk* (OBP 2024; CC BY-NC) and *The Era of Global Risk* (OBP 2023; CC BY-NC)
- *Risk, Death, and Well-Being* (OUP 2025; CC BY-NC-ND)
- Halpern, *Actual Causality* (MIT 2016; CC BY-NC-ND)
- Schapire & Freund, *Boosting* (MIT 2012; CC BY-NC-ND)
- Rasmussen & Williams, *Gaussian Processes for ML* (MIT 2005; CC BY-NC-ND)
- Bellemare, Dabney & Rowland, *Distributional Reinforcement Learning* (MIT 2023; CC BY-NC-ND)
- Axler, *Linear Algebra Done Right* 4e (Springer 2024; CC BY-NC) and *Measure, Integration & Real Analysis* (Springer 2020)
- Barroso et al., *The Datacenter as a Computer* (Springer 2019; CC BY)
- *Learning Statistics with jamovi* (OBP 2025; CC BY-SA)

### 2. OA book programmes at publishers and presses

Counts below are from the DOAB and OAPEN exports (2026-10-15), so they are lower bounds wherever publishers do not deposit everything.

| Programme / publisher | Model | DOAB books | OAPEN books | Recent OAPEN output (books/yr) | Notes / status 2026 |
|---|---|---|---|---|---|
| Springer Nature OA books | BPC/funder-paid; mostly CC BY | 4,028 | 3,705 | 556 (2022), 607 (2023), 438 (2024), 395 (2025) | Largest commercial OA-book producer in these indexes; includes a handful of textbooks (Axler). [V] |
| Taylor & Francis / Routledge OA | BPC/funder | 3,821 | 4,427 | — | Mostly HSS monographs and handbooks. [V] |
| MIT Press, incl. **Direct to Open (D2O)** | Collective library funding, no author fees; launched 2021 | 280 | 62 | DOAB: 79 (2022), 37 (2023) | Wikipedia: "80 monographs" opened in D2O's second year; "as of 2026, roughly 30% of the press's books … are open access." [S, ref 20] Official D2O pages blocked from here (403). |
| Cambridge University Press (incl. "Flip it Open") | Mixed: BPC + Flip it Open (titles opened after sales) | 416 | 74 | 1–3/yr | "Flip it Open" appears in CUP's OA navigation [V, ref 21]; no programme figures retrieved. |
| Oxford University Press | BPC/funder | 333 | 319 | 24–44/yr (2019–2025) | E.g. *Moral Uncertainty*, *Essays on Longtermism*. [V] |
| UCL Press | Fully OA university press | 396 | 379 | 25–50/yr | [V] |
| Open Book Publishers | Library membership, no BPC for most titles [I, medium] | 537 | 404 | 26–46/yr | WebFetch hit HTTP 429; counts from exports. [V] |
| punctum books | Scholar-led, library support | 456 | 421 | 17–35/yr | [V] |
| Language Science Press | Community-funded via supporters/Knowledge Unlatched; free for authors and readers | 273 | 263 | 7–36/yr | Own catalogue lists 390 titles; top books exceed 60,000 downloads; a 2027–2029 funding round is open. [V, ref 19] |
| University of California Press (Luminos) | BPC/membership | 301 | 298 | 21–40/yr | [V] |
| University of Michigan Press | Mixed (incl. TOME, Big Ten Open Books) | 670 | 583 | — | [V] |
| ANU Press | Fully OA | 870 | 720 | — | [V] |
| Cornell University Press | Mixed | 457 | — | — | [V] |
| Knowledge Unlatched (KU Select / KU Open Services) | Library crowdfunding | — | 5,769 + 2,100 tagged | — | Largest collection tag in OAPEN. [V] |
| Max Planck Society × OAPEN | New funder collection | — | — | — | Announced 2026-09-16 on the OAPEN homepage. [V] |

Interpretation [I]: university-press OA output is in the hundreds of titles per year, overwhelmingly HSS monographs. Programmes that systematically open *textbooks* in STEM barely exist outside OpenStax-style OER and author-hosting.

### 3. Open textbooks (OER)

| Platform | Size (date) | Licence | Level / coverage | Access for machines | Status / notes |
|---|---|---|---|---|---|
| **OpenStax** (Rice University; est. 2012) | 129 book records in its CMS: 84 live, 34 retired, 8 unlisted, 3 deprecated [V, API]. Self-reported 49M students all-time and 5.4M/yr; $3.8B saved all-time and $374.3M/yr; 172 countries [V, impact page] | **CC BY-NC-SA** for 70 of 84 live titles since the April 2026 change; 4 live titles still CC BY; 10 live titles have no licence field [V] | Intro undergrad (calculus, stats, econ, intro CS, Python, data science, philosophy) | Public CMS API (`/apps/cms/api/v2/pages/?type=books.Book`); PDFs and web view | Live-title publish dates have median 2022; 21% are pre-2020 [V]. New products: OpenStax Assignable (2026), "EduStax" AI (blog 2026-04-23), Microsoft AI partnership (2025-06-26) [V, blog list]. |
| **LibreTexts** | "3,000+ textbooks", "1,500K+ pages", "300K+ homework questions", 240,000+ items in ADAPT question bank, 500+ schools [V, homepage, self-reported]. The same page also says "over 2000 textbooks" | Mixed CC (BY, BY-SA, BY-NC-SA…) per page | Broad; 17 subject libraries | HTML; Common Pile extracted 62,269 BY/BY-SA/PD sections (5.3 GB) [V] | AI tutoring tool in development (testimonial on homepage) [V]. |
| **Open Textbook Library** (U Minnesota / Open Education Network) | **1,887 textbooks** (1,743 English, 107 Spanish) [V, API + homepage] | BY-NC-SA 41.7%, BY 26.1%, BY-NC 18.3%, BY-SA 10.0%, BY-NC-ND 2.2%, GFDL 0.8%, CC0 0.8% [V, my count] | Mostly lower-division. Top subjects: Humanities 365, Social Sciences 249, Natural Sciences 216, Mathematics 163, Business 159, CS 145, Statistics 34, Economics 52, Philosophy 43 | **Public JSON API** (`/opentextbooks/textbooks.json?page=N`, 202 pages) with ratings and reviews | Median copyright year 2021; 58% ≥2020; 36% ≥2023; 64% have ≥1 faculty review; 7,581 reviews in total; mean rating 4.43/5 (median 4.5) [V]. Top contributors: Editorial Grupo AEA (82), OpenStax (65), Open Oregon (54), Saylor (52), BCcampus (44). |
| **BCcampus Open Collection** | Not retrieved (site 403) | Mostly CC BY | Canadian post-secondary | — | 44 BCcampus titles appear in OTL [V]. |
| **OTexts** (Hyndman et al.) | — | Free online | Forecasting, statistics | — | "Our books are freely available to students everywhere" [V, otexts.com]. Includes *Forecasting: Principles and Practice* 3e. |
| **MIT OCW** (not textbooks, but course notes) | 2,500+ courses; 500M+ lifetime visits; 6M+ YouTube subscribers; 440 mirror sites [V, OCW about page] | CC BY-NC-SA 4.0 | Full MIT curriculum | Course pages, PDFs | 25th year in 2025; MIT Learn hub; "OCW To Go" offline (2026+) [V]. |

**The OpenStax licence change (verified primary source, 2026-04-22).** OpenStax "has transitioned our textbook library from a mix of CC BY and CC BY-NC-SA licensing to CC BY-NC-SA licensing across the library. This change will apply to all newly released and updated versions of our titles, with limited exceptions." Its 2026-03-18 post explains why: "Emerging technologies like artificial intelligence (AI) have accelerated this shift … permissive licensing has unintentionally rewarded those who are taking more than they invest" [V, refs 13–14]. Derivatives of earlier CC BY versions are unaffected. In practice, a commercial LLM product can no longer freely republish new OpenStax content. Earlier CC BY versions remain reusable and are worth archiving [I, high].

### 4. Author-hosted editions of major technical books

These are the highest-value free books for a technical reader. Almost none are in DOAB, because they are gratis rather than openly licensed. Statuses below were checked on 2026-10-15.

| Book | Free form & terms | URL | Verified? |
|---|---|---|---|
| MacKay, *Information Theory, Inference, and Learning Algorithms* (CUP 2003) | Full PDF/PS/DJVU/EPUB; "You are welcome to view the book on-screen" | inference.org.uk/itila/book.html | [V] |
| Bishop, *Pattern Recognition and Machine Learning* (Springer 2006) | Full PDF (18 MB) hosted by Microsoft Research; no licence text on page | microsoft.com/…/prml-book/ | [V] |
| Hastie, Tibshirani, Friedman, *Elements of Statistical Learning* 2e | Author-hosted PDF (12th printing) | hastie.su.domains/ElemStatLearn/ | Host reset connections from here; listed in free-programming-books [~90%] |
| James et al., *ISL* (R 1e 2013, R 2e 2021, Python 2023) | Full PDFs | statlearning.com | [V] |
| Murphy, *Probabilistic ML: An Introduction* (2022) and *Advanced Topics* (2023) | Draft PDFs, **CC BY-NC-ND**, dated 2025-04-18 and 2025-12-10 | probml.github.io/pml-book/ | [V] |
| Goodfellow, Bengio, Courville, *Deep Learning* (MIT 2016) | HTML only; "our contract with MIT Press forbids distribution of too easily copied electronic formats" | deeplearningbook.org | [V] |
| Sutton & Barto, *Reinforcement Learning* 2e (MIT 2018) | Full PDF (73 MB) | incompleteideas.net/book/the-book-2nd.html | [V] |
| Boyd & Vandenberghe, *Convex Optimization* (CUP) | PDF; "Cambridge University Press … kindly agreed to allow us to keep the book available on the web" | web.stanford.edu/~boyd/cvxbook/ | [V] |
| Zhang et al., *Dive into Deep Learning* (CUP 2023) | HTML/notebooks, **CC BY-SA 4.0**; "Adopted at 500 universities from 70 countries" | d2l.ai | [V] |
| Prince, *Understanding Deep Learning* (MIT 2023) | Free PDF (GitHub release v5.0.3, 2026 build) | udlbook.github.io/udlbook/ | [V] |
| Gelman et al., *Bayesian Data Analysis* 3e | PDF "for non-commercial purposes" (56 MB) | sites.stat.columbia.edu/gelman/book/ | [V] |
| Gelman, Hill, Vehtari, *Regression and Other Stories* (CUP 2020) | PDF "for personal use only … With permission from Cambridge University Press" | avehtari.github.io/ROS-Examples/ | [V] |
| Blitzstein & Hwang, *Introduction to Probability* 2e | probabilitybook.net redirects to a Google Drive PDF | probabilitybook.net | Link [V]; publisher permission not seen (Stat110 site 403) [~80%] |
| Durrett, *Probability: Theory and Examples* 5e | Author PDF (PTE5_011119.pdf) | services.math.duke.edu/~rtd/PTE/pte.html | [V] |
| Jaynes, *Probability Theory: The Logic of Science* | **Partial**: editor's site hosts a 95-page PDF (front matter + Chapters 1–3, © 1995 Jaynes) | bayes.wustl.edu/etj/prob/book.pdf | [V] |
| Deisenroth, Faisal, Ong, *Mathematics for ML* (CUP 2020) | "We will keep PDFs of this book freely available" | mml-book.github.io | [V] |
| Mohri et al., *Foundations of ML* 2e (MIT 2018) | Official PDF/HTML, **CC BY-NC-ND** via MIT Press | cs.nyu.edu/~mohri/mlbook/ | [V] |
| Rasmussen & Williams, *GPML* (MIT 2006) | Download; also CC BY-NC-ND in DOAB | gaussianprocess.org/gpml/ | [V] |
| Barber, *Bayesian Reasoning and ML* (CUP 2012) | "The publishers have kindly agreed to allow the online version to remain freely accessible" | web4.cs.ucl.ac.uk/…/Brml.HomePage | [V] |
| Hardt & Recht, *Patterns, Predictions, and Actions* (Princeton 2022) | Full preprint PDF | mlstory.org | [V] |
| Jurafsky & Martin, *Speech and Language Processing* 3e draft | Full-draft PDF dated Aug 19, 2026 | web.stanford.edu/~jurafsky/slp3/ | [V] |
| Hernán & Robins, *Causal Inference: What If* | "download the book … for free" | miguelhernan.org/whatifbook | [V] |
| Osborne & Rubinstein, *A Course in Game Theory* (MIT 1994), plus Rubinstein's other books | "My 8 books are free"; latest book 2024 | arielrubinstein.tau.ac.il/books.html | [V] |
| Easley & Kleinberg, *Networks, Crowds, and Markets* (CUP 2010) | Complete pre-publication draft | cs.cornell.edu/home/kleinber/networks-book/ | [V] |
| Shoham & Leyton-Brown, *Multiagent Systems* (CUP 2009) | "eBook Download" | masfoundations.org | [V] |
| Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* 3e | Free online (OTexts) | otexts.com | Publisher statement [V]; book page 403 here |
| Yudkowsky, *Rationality: From AI to Zombies* (MIRI 2015) | Full text online; ebook "pay-what-you-want" | readthesequences.com; intelligence.org/rationality-ai-zombies/ | [V] |
| Abelson & Sussman, *SICP* 2e | **CC BY-SA 4.0**; MIT-hosted PDF (883 pp) | web.mit.edu/6.001/6.037/sicp.pdf | [V]; classic MIT Press HTML server returned HTTP 400 |
| Arpaci-Dusseau, *Operating Systems: Three Easy Pieces* (v1.10) | "a free online operating systems book" | pages.cs.wisc.edu/~remzi/OSTEP/ | [V] |
| Beyer et al., *Site Reliability Engineering* (Google/O'Reilly 2016) | 1st ed "Read online"; **2nd ed (2026) "Buy from Google Books" only** | sre.google/books/ | [V] |
| Winters et al., *Software Engineering at Google* | HTML, CC BY-NC-ND 4.0 | abseil.io/resources/swe-book | [V] |
| Chacon & Straub, *Pro Git* 2e | CC BY-NC-SA 3.0 | git-scm.com/book | [V] |
| Russell & Norvig, *AIMA* 4e | **Not free**: site offers only preface, contents, bibliography, index and pseudocode PDFs | aima.cs.berkeley.edu | [V] |
| Wasserman, *All of Statistics* | **Not free**: author page offers errata and R code only | stat.cmu.edu/~larry/all-of-statistics/ | [V] |
| Kleppmann, *Designing Data-Intensive Applications* | **Not free**: site points to purchase | dataintensive.net | [V] |

**Patterns [I].**
- ML and statistics have a strong norm of author-hosting. Publishers that permit it include CUP (MacKay, Boyd, Barber, ROS, MML), MIT Press (Sutton & Barto, Mohri, Murphy, Prince), Springer (ISL, ESL) and CRC (BDA3, Blitzstein).
- The terms run from CC BY-SA (D2L, SICP) through CC BY-NC-ND (Murphy, Mohri) to "personal use only" (ROS) and "HTML only" (Goodfellow).
- The free version is often a *draft* or *pre-publication* text (Easley & Kleinberg, Murphy, SLP3). That matters for citation, but also means these are sometimes *more* current than print.

### 5. Curated lists: free-programming-books and similar

The EbookFoundation **free-programming-books** repository (CC BY 4.0; last commit 2026-10-14) contains 13,418 link entries across all files [V, my count]:

| Part of the repo | Entries |
|---|---|
| `books/` | 5,919 |
| `books/free-programming-books-langs.md` (English, by programming language) | 1,874 |
| `books/free-programming-books-subjects.md` (English, by subject) | 893 |
| `courses/` | 5,435 |
| `more/` | 1,103 |
| `casts/` | 616 |

It has a static site and a search UI. The list is extremely useful for discovery but **does not vet legality**. In the ML/statistics section I spotted at least one entry pointing to what looks like an unauthorised mirror of a commercial Springer book (an `inis.jinr.ru` path) and an entry pointing to an IntechOpen collection [V, observation; legality judgement is mine, medium]. It also lists Springer OA-book landing pages. Treat it as a candidate source that needs a licence check.

### 6. Lecture notes and course materials

- **MIT OCW:** 2,500+ courses under CC BY-NC-SA 4.0 [V]. Example: 6.041SC Probabilistic Systems Analysis (Fall 2013) serves as a free substitute for the Bertsekas & Tsitsiklis textbook [V URL resolves; equivalence is my inference].
- **Course note sets**, e.g. Stanford CS229 main notes (a 5.4 MB PDF resolves) [V], often act as de facto free textbooks.
- **arXiv:** the arXiv API returns 2,182 records with "lecture notes" in the comments field, 1,524 with it in the abstract, and 317 with both words in the title. The title-word count per category is small: cs.LG 21, math.PR 24, stat.ML 8 [V, API counts 2026-10-15]. Phrase search in the arXiv API is idiosyncratic, so treat these as lower bounds [medium]. arXiv lecture notes are a real but modest layer, strongest in maths and physics.

### 7. Public domain libraries

| Source | Size (date) | Character | Bulk/machine access | Status / notes |
|---|---|---|---|---|
| **Project Gutenberg** | "79,598 free eBooks" (homepage, 2026-10-15). Catalogue CSV: 79,576 items, of which 78,325 are texts and 61,817 English [V] | **57% literature** (LoC class P: 44,388), D history 8,136, B philosophy/religion 4,802, Q science 2,750 (3.5%), H social sciences 1,977, T technology 1,622 [V, my count] | `pg_catalog.csv` and RDF feeds; offline catalogues page | Adds ~2,400–3,100 texts/yr (2,580 in 2025; 2,170 so far in 2026) [V]. Blocked in Italy since 2020; German block lifted in 2021 except three authors [S]. CEO Greg Newby died in 2025; Eric Hellman acting CEO [S]. |
| **Standard Ebooks** | ≈1,530 titles (127 full pages × 12 + 6) [V, count] | Carefully typeset, proofread PD classics | OPDS feed (requires Patrons Circle; returned 401 here) | Small, very high quality. |
| **Wikisource (English)** | 1,134,450 content pages; 4.89M total pages [V, API] | PD and freely licensed texts, scan-backed proofreading | MediaWiki API, dumps | Included in Common Corpus [V]. |
| **HathiTrust** | 18M+ volumes, ~6.7M US public domain (Sept 2024); 219+ member libraries [S, Wikipedia; site 403 here] | Research-library scans (Google Books), full-text search over all volumes | Hathifiles, HTRC | *Authors Guild v. HathiTrust* (2d Cir. 2014) upheld search and accessibility uses as fair use [S]. |
| **Internet Archive / Open Library** | Open Library: 25M edition records, ~1.6M PD full texts, CDL lending of 647,784+ non-PD books (undated) [S] | Scans + CDL | Open Library search API exposes `ebook_access` = public / borrowable / printdisabled / no_ebook [V] | *Hachette v. IA*: SDNY 2023-03-24; 2d Cir. affirmed 2024-09-04; no cert petition (IA blog 2024-12-04); 500,000+ books removed from lending [S]. Great 78 (UMG) suit settled Sept 2025 [S]. Cyberattack and data breach Oct 2024 [S]. |
| **US Public Domain Day 2026** | Works published in 1930 entered PD on 2026-01-01 [V] | E.g. Freud, *Civilization and Its Discontents*; Russell, *The Conquest of Happiness*; Faulkner, *As I Lay Dying*; Hammett, *The Maltese Falcon*; 1925 sound recordings | — | 1931 works follow on 2027-01-01 [I, high]. |

### 8. Large open corpora as building material

| Corpus | Size | Book-relevant content | Terms | Date / status |
|---|---|---|---|---|
| **Institutional Books 1.0** (Harvard Law School Library, Institutional Data Initiative) | 983,004 PD volumes (of 1,075,899 scanned); ~242B o200k tokens; 386M pages; 254 languages [V] | Mostly 19th–20th-century books from Harvard's Google Books scans | **Gated**; "Early-Access Terms": non-commercial, no redistribution, contact needed for commercial use including AI training [V] | Paper 2025-06-10 (arXiv 2506.08300). The HF dataset was renamed `institutional/institutional-books-hl` (updated 2026-08-19). Sibling sets added in 2026: enriched text, visual elements (2026-10-09), BPL newspapers, U. Michigan proceedings [V, HF API]. |
| **Common Pile v0.1** (EleutherAI et al.) | 8 TB, 30 sources; Comma v0.1 7B models trained on 1T and 2T tokens [V] | DOAB (English CC BY/BY-SA only; 474,445 docs, 12.5 GB); pre-1929 books (137,127 docs, 73.8 GB, IA-hosted OCR of HathiTrust-identified books); Library of Congress Selected Digitized Books (135,500 docs, 47.8 GB); Gutenberg (71,810 docs, 26.2 GB); PressBooks (106,881 docs, 1.5 GB); LibreTexts (62,269 docs, 5.3 GB); OER Commons (9,339 docs); Biodiversity Heritage Library [V, dataset cards] | PD or open licence per document; cards warn about "license laundering and inaccurate metadata" [V] | arXiv 2506.05209 (2025-06-05). 63 datasets under `common-pile` on HF [V]. |
| **Common Corpus** (Pleias) | 2.267T tokens [V] | OpenCulture 967B tokens (PD books, newspapers, Wikisource, Gutenberg); OpenScience 281B; OpenGovernment 579B | "Only data that is either uncopyrighted or freely licensed"; ungated [V] | v1 Nov 2024; ICLR 2026 oral; last modified 2026-05-06 [V]. |

**Legal context [S].** *Bartz v. Anthropic* (N.D. Cal., filed 2024-08-19) involved two different questions:
- **Training:** a 2025-06-23 summary-judgment ruling found training on the plaintiffs' books fair use.
- **Pirated copies:** acquiring and keeping pirated library copies went to trial.

A $1.5B settlement followed in Sept 2025 and received final approval in July 2026. Some rights holders opted out [S: Wikipedia, ref 70]. I did not verify the court docket directly.

### 9. Empirical test: coverage of 55 canonical books

**Method.**
1. I fixed a list of books frequently named in reading lists and syllabi across six categories, aiming for 9–10 per category. I deliberately included both "famously free" and "famously paid" titles, and practitioner bestsellers as well as academic texts.
2. For each book I checked the author's or publisher's page, the DOAB export and the Gutenberg catalogue.
3. I recorded the Open Library `ebook_access` status from its search API (2026-10-15).

"Free legal full text" means:
- public domain in the US,
- an open licence, or
- a complete text deliberately made available by the author or publisher.

Partial texts and controlled lending are reported separately.

**Bias warning [I].** The list reflects my own sense of the canon, which comes from web text. Freely available books are discussed and recommended more online, so "canonical" and "free" are partly circular. The sample is also small (about ±13 percentage points of binomial standard error at n=55, and far more per category).

**Full table.** Free type: **PD** = public domain; **CC** = Creative Commons; **Gratis** = free by permission, all rights reserved; **Partial**; **None**. OL = Open Library status (2026-10-15).

| # | Cat | Book (edition, year) | Free legal full text? | Type | Where | OL | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | a | Jaynes, *Probability Theory: The Logic of Science* (2003) | Partial (Ch. 1–3) | Partial | bayes.wustl.edu/etj/prob/book.pdf | printdisabled | [V] |
| 2 | a | Blitzstein & Hwang, *Introduction to Probability* 2e (2019) | Yes | Gratis | probabilitybook.net (Google Drive PDF) | no_ebook | [V link; ~80% on permission] |
| 3 | a | Wasserman, *All of Statistics* (2004) | No | None | — | no_ebook | [V author page] |
| 4 | a | Casella & Berger, *Statistical Inference* 2e (2002) | No | None | — | printdisabled | [I, high] |
| 5 | a | Gelman et al., *Bayesian Data Analysis* 3e (2013) | Yes | Gratis (non-commercial) | sites.stat.columbia.edu/gelman/book/ | printdisabled | [V] |
| 6 | a | McElreath, *Statistical Rethinking* 2e (2020) | No (lectures free) | None | — | no_ebook | [I, high]; site 403 |
| 7 | a | Gelman, Hill & Vehtari, *Regression and Other Stories* (2020) | Yes | Gratis (personal use) | avehtari.github.io/ROS-Examples/ | no_ebook | [V] |
| 8 | a | Bertsekas & Tsitsiklis, *Introduction to Probability* 2e (2008) | No (OCW 6.041 course free) | None | — | **borrowable** | [I, high] |
| 9 | a | Feller, *An Introduction to Probability Theory and Its Applications* Vol. 1, 3e (1968) | No | None | — | **borrowable** | [I, high] |
| 10 | b | Bishop, *Pattern Recognition and Machine Learning* (2006) | Yes | Gratis | microsoft.com (PRML page) | no_ebook | [V] |
| 11 | b | Hastie, Tibshirani & Friedman, *Elements of Statistical Learning* 2e (2009) | Yes | Gratis | hastie.su.domains/ElemStatLearn/ | borrowable | [~90%; host unreachable] |
| 12 | b | James et al., *An Introduction to Statistical Learning* 2e (2021) / ISLP (2023) | Yes | Gratis | statlearning.com | printdisabled | [V] |
| 13 | b | Murphy, *Probabilistic Machine Learning* (2022/2023) | Yes | CC BY-NC-ND | probml.github.io/pml-book/ | no_ebook | [V] |
| 14 | b | Goodfellow, Bengio & Courville, *Deep Learning* (2016) | Yes (HTML only) | Gratis | deeplearningbook.org | printdisabled | [V] |
| 15 | b | Sutton & Barto, *Reinforcement Learning: An Introduction* 2e (2018) | Yes | Gratis | incompleteideas.net | (unclassified) | [V] |
| 16 | b | Russell & Norvig, *Artificial Intelligence: A Modern Approach* 4e (2020) | No | None | — | printdisabled | [V site] |
| 17 | b | MacKay, *Information Theory, Inference, and Learning Algorithms* (2003) | Yes | Gratis (on-screen) | inference.org.uk/itila | (unclassified) | [V] |
| 18 | b | Prince, *Understanding Deep Learning* (2023) | Yes | Gratis | udlbook.github.io/udlbook/ | no_ebook | [V] |
| 19 | b | Géron, *Hands-On Machine Learning with Scikit-Learn* 3e (2022) | No | None | — | **borrowable** | [I, high] |
| 20 | c | Tetlock & Gardner, *Superforecasting* (2015) | No | None | — | printdisabled | [I, high] |
| 21 | c | Kahneman, *Thinking, Fast and Slow* (2011) | No | None | — | borrowable (translations only; English scans printdisabled) [corrected in verification] | [I, high] |
| 22 | c | Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* 3e (2021) | Yes | Gratis | otexts.com | public | [V publisher statement] |
| 23 | c | Peterson, *An Introduction to Decision Theory* 2e (2017) | No | None | — | printdisabled | [I, high] |
| 24 | c | Hubbard, *How to Measure Anything* 3e (2014) | No | None | — | printdisabled | [I, high] |
| 25 | c | Osborne & Rubinstein, *A Course in Game Theory* (1994) | Yes | Gratis | arielrubinstein.tau.ac.il/books.html | (unclassified) | [V] |
| 26 | c | Mas-Colell, Whinston & Green, *Microeconomic Theory* (1995) | No | None | — | printdisabled | [I, high] |
| 27 | c | Mankiw, *Principles of Economics* (recent eds.) | No (open substitutes: OpenStax *Principles of Economics* 3e, CORE) | None | — | printdisabled (the only lendable item in a matching work is a 2001 study guide) [corrected in verification] | [I, high] |
| 28 | c | Savage, *The Foundations of Statistics* (1954; Dover 1972) | No | None | — | **borrowable** | [I, high] |
| 29 | d | Yudkowsky, *Rationality: From AI to Zombies* (2015) | Yes | Gratis | readthesequences.com | no_ebook | [V] |
| 30 | d | Parfit, *Reasons and Persons* (1984) | No | None | — | **borrowable** | [I, high] |
| 31 | d | Hume, *A Treatise of Human Nature* (1739–40) | Yes | PD | gutenberg.org/ebooks/4705 | public | [V] |
| 32 | d | Mill, *Utilitarianism* (1863) | Yes | PD | gutenberg.org/ebooks/11224 | public | [V] |
| 33 | d | Kuhn, *The Structure of Scientific Revolutions* (1962) | No | None | — | **borrowable** | [I, high] |
| 34 | d | Popper, *The Logic of Scientific Discovery* (1959) | No | None | — | printdisabled (main work record OL262211W shows "borrowable" via a Galician translation) [corrected in verification] | [I, high] |
| 35 | d | Pearl, *Causality* 2e (2009) | No | None | — | printdisabled | [I, high] |
| 36 | d | MacAskill, Bykvist & Ord, *Moral Uncertainty* (2020) | Yes | CC BY-NC-ND | DOAB 20.500.12854/30579 (OUP) | no_ebook | [V DOAB] |
| 37 | d | Bostrom, *Superintelligence* (2014) | No | None | — | printdisabled | [I, high] |
| 38 | e | Gibbon, *The History of the Decline and Fall of the Roman Empire* (1776–89) | Yes | PD | gutenberg.org/ebooks/731 (+ vols.) | public | [V] |
| 39 | e | Thucydides, *History of the Peloponnesian War* (Crawley tr., 1874) | Yes | PD | gutenberg.org/ebooks/7142 | public | [V] |
| 40 | e | Smith, *The Wealth of Nations* (1776) | Yes | PD | gutenberg.org/ebooks/3300 | public | [V] |
| 41 | e | Tocqueville, *Democracy in America* (Reeve tr.) | Yes | PD | gutenberg.org/ebooks/815 (+816) | public | [V] |
| 42 | e | Diamond, *Guns, Germs, and Steel* (1997) | No | None | — | borrowable (translations only) [corrected in verification] | [I, high] |
| 43 | e | Harari, *Sapiens* (2014) | No | None | — | borrowable (translations only) [corrected in verification] | [I, high] |
| 44 | e | Pinker, *The Better Angels of Our Nature* (2011) | No | None | — | (unclassified) | [I, high] |
| 45 | e | Acemoglu & Robinson, *Why Nations Fail* (2012) | No | None | — | borrowable (Spanish translation only) [corrected in verification] | [I, high] |
| 46 | e | Scott, *Seeing Like a State* (1998) | No | None | — | printdisabled | [I, high] |
| 47 | f | Abelson & Sussman, *Structure and Interpretation of Computer Programs* 2e (1996) | Yes | CC BY-SA 4.0 | web.mit.edu/6.001/6.037/sicp.pdf | borrowable | [V licence text] |
| 48 | f | Brooks, *The Mythical Man-Month* (1975/1995) | No | None | — | borrowable (Chinese translation only) [corrected in verification] | [I, high] |
| 49 | f | Kleppmann, *Designing Data-Intensive Applications* (2017) | No | None | — | no_ebook | [V site] |
| 50 | f | Martin, *Clean Code* (2008) | No | None | — | printdisabled | [I, high] |
| 51 | f | Thomas & Hunt, *The Pragmatic Programmer* 2e (2019) | No | None | — | printdisabled | [I, high] |
| 52 | f | Gamma et al., *Design Patterns* (1994) | No | None | — | printdisabled | [I, high] |
| 53 | f | Cormen et al., *Introduction to Algorithms* 4e (2022) | No | None | — | printdisabled | [I, high] |
| 54 | f | Arpaci-Dusseau, *Operating Systems: Three Easy Pieces* (v1.10) | Yes | Gratis | pages.cs.wisc.edu/~remzi/OSTEP/ | no_ebook | [V] |
| 55 | f | Beyer et al., *Site Reliability Engineering* (2016) | Yes (1st ed; the 2026 2nd ed is not) | Gratis | sre.google/books/ | public | [V] |

Where the OL column says "(unclassified)", Open Library returned no ebook status, or a not-found result that I resolved manually. Open Library statuses are for the best-matching work record. "Borrowable" requires a free account and is subject to waitlists and loan limits. The search API's `ebook_access` is a work-level maximum over all editions, including translations; checking each edition's Internet Archive item for the `inlibrary` (lending) collection shows that only six sample books (B&T, Feller, Géron, Savage, Parfit, Kuhn) have a lendable English edition. [corrected in verification]

**Coverage by category.**

| Category | n | Free full text | % | + partial | + borrowable via Open Library CDL | Free to read incl. CDL |
|---|---|---|---|---|---|---|
| (a) Probability & statistics | 9 | 3 | 33% | 4 (44%) | +2 (B&T, Feller) | 5 (56%) |
| (b) ML/AI | 10 | 8 | 80% | 8 | +1 (Géron) | 9 (90%) |
| (c) Decision theory / forecasting / economics | 9 | 2 | 22% | 2 | +1 (Savage); Kahneman only in translation, Mankiw only a study guide [corrected in verification] | 3 (33%) |
| (d) Philosophy / rationality | 9 | 4 | 44% | 4 | +2 (Parfit, Kuhn) | 6 (67%) |
| (e) History / social science | 9 | 4 | 44% (all PD) | 4 | +0 (Diamond, Harari, Acemoglu & Robinson lendable only in translation) [corrected in verification] | 4 (44%) |
| (f) Software engineering | 9 | 3 | 33% | 3 | +0 (Brooks lendable only in Chinese translation) [corrected in verification] | 3 (33%) |
| **Total** | **55** | **24** | **43.6%** | **25 (45.5%)** | **+6 in English (+12 counting translations)** [corrected in verification] | **30 (54.5%); 36 (65.5%) counting translations** |

**By kind of free text.**

| Kind | Count | Books |
|---|---|---|
| Gratis, author- or publisher-hosted | 15 (62.5% of free) | B&H, BDA3, ROS, PRML, ESL, ISL, Goodfellow, Sutton & Barto, MacKay, UDL, FPP3, Osborne & Rubinstein, R:AZ, OSTEP, SRE |
| Public domain | 6 (25%) | Hume, Mill, Gibbon, Thucydides, Smith, Tocqueville |
| Creative Commons | 3 (12.5%) | Murphy (BY-NC-ND), *Moral Uncertainty* (BY-NC-ND), SICP (BY-SA) |
| **Reusable commercially (PD or BY/BY-SA)** | **7 of 55 (13%)** | — |

**By era and genre.** This is the most informative cut.

| Segment | n | Free | % |
|---|---|---|---|
| Modern (post-1990) technical textbooks and monographs (stats, ML, econ/decision, SE, causality) | 33 | 17 | 52% |
| … same, excluding ML/AI | 23 | 9 | 39% |
| Popular or general non-fiction since 1990 (Tetlock, Kahneman, Hubbard, R:AZ, Bostrom, Diamond, Harari, Pinker, Acemoglu & Robinson, Scott) | 10 | 1 | 10% |
| Pre-1929 classics | 6 | 6 | 100% |
| In-copyright 1930–1989 classics (Feller, Savage, Kuhn, Popper, Parfit, Brooks) | 6 | 0 | 0% |

**Long-tail check (does the <20% claim hold for the broader universe?)** [V counts, I interpretation]. I counted how many volumes of the big commercial textbook series appear in DOAB:

| Series | Volumes in DOAB | Example |
|---|---|---|
| *Graduate Texts in Mathematics* | 3 [corrected in verification] | Axler, *Measure, Integration & Real Analysis*; *Metric Lie Groups*; *Quaternion Algebras* |
| *Undergraduate Texts in Mathematics* | 2 | Axler, *Linear Algebra Done Right* 4e; *Beginning in Algebraic Geometry* [corrected in verification] |
| *Springer Texts in Statistics* | 1 | — |
| *Springer Series in Statistics* | 1 | — |
| *Undergraduate Topics in Computer Science* | 0 | — |
| *Texts in Computer Science* | 0 | — |
| *Universitext* | 0 | — |
| CRC *Texts in Statistical Science* | 0 | — |
| MIT *Adaptive Computation and ML* | 4 | *Boosting*, GPML, *ML for Data Streams*, *Distributional RL* |

These series each run to many dozens or hundreds of volumes. GTM alone is around 300 [I, ~70% on the exact figure]. So the openly licensed share of mainstream textbook series is likely ≤2–5% [I, medium]. DOAB undercounts because author-hosted PDFs never enter it: ISL is itself a *Springer Texts in Statistics* volume. Even allowing for that, the free share of the full universe of modern textbooks is probably well below 20% [I, ~75%].

**Verdict.** "Free legal sources cover <20% of the modern technical textbooks someone would want" is:
- **False for the canonical core** a technical researcher would actually reach for: 52% of modern technical textbooks in the sample, 80% in ML/AI, and 55% of all 55 books if English-language CDL borrowing counts (65% counting lendable translations). [corrected in verification]
- **True for the long tail** of commercial textbook series, recent popular non-fiction (10%) and 1930–1989 classics (0%).

What you *want* matters a great deal. Someone reading ML and Bayesian statistics lives in an unusually open world; someone reading economics, decision theory or classic software-engineering texts does not.

### 10. Quality and recency of open textbooks

- **Recency is fine at the introductory level.**
  - OTL: median copyright year 2021, 58% from 2020 or later, 36% from 2023 or later.
  - OpenStax: live titles have median publish year 2022; 21% are pre-2020.
  - DOAB adds 5,000–8,000 books per year [V].
  - Author-hosted ML books are *more* current than print: Murphy's drafts are dated 2025, SLP3 2026-08-19, UDL a 2026 PDF build [V].
- **Quality signals exist but are weak.** OTL has 7,581 faculty reviews, with 64% of titles reviewed at least once, but a mean rating of 4.43/5 suggests ceiling effects [V; interpretation I]. OpenStax books are peer-reviewed and widely adopted: 71% of US colleges and universities per its impact page [V, self-reported].
- **The level is the main gap.** OTL has 34 statistics, 3 machine-learning and 1 game-theory titles. OpenStax has *Statistics*, *Introductory Statistics 2e*, *Principles of Data Science* (2025), *Introduction to Python Programming* (2024), *Introduction to Computer Science* (2024), *Principles of Economics 3e* (2022) and *Introduction to Philosophy* (2022) [V]. None is graduate-level. At graduate level the open supply comes almost entirely from author-hosting (section 4) and a few press OA monographs (section 1).
- **DOAB quality is heterogeneous.** Seventy percent of its STEM supply is edited collections from IntechOpen, MDPI and Frontiers [V]. Good DOAB technical books tend to come from MIT Press, Springer Nature (selected), CUP/OUP and OBP [I].

---

## Numbers that matter

| Fact | Value | Date of info | Source | Confidence |
|---|---|---|---|---|
| DOAB book records / chapter records | 92,260 / 9,818 | 2026-10-15 | DOAB CSV export [1] (my count) | High |
| DOAB distinct publisher names (books) | 819 | 2026-10-15 | [1] | High (name variants possible) |
| DOAB English-language share | 58.0% | 2026-10-15 | [1] | High |
| DOAB share HSS vs STEM (classified books) | First-listed code: ≈61% HSS (34% humanities + 27% social sci/econ/law) vs ≈29% STEM. Any listed code: 64.4% carry an HSS code, 34.7% a STEM code | 2026-10-15 | [1], my Thema mapping | Medium-high (mapping choices) |
| Share of DOAB STEM from IntechOpen + MDPI + Frontiers | 68.6% (13,926 of 20,286) | 2026-10-15 | [1] | High |
| DOAB licence mix | CC BY 34.1%, BY-NC-ND 33.4%, none recorded 12.6% | 2026-10-15 | [1] | High |
| DOAB books allowing commercial reuse (BY/BY-SA/PD) | 37.8% | 2026-10-15 | [1] | High |
| OAPEN Library books / chapters / publishers | 36,434 / 6,504 / 479 | 2026-10-15 | OAPEN CSV [4] | High |
| OAPEN classified books HSS vs STEM | 82.7% vs 10.6% | 2026-10-15 | [4] | Medium-high |
| OAPEN self-reported monthly downloads | 1.5M+ | 2026-10-15 | OAPEN homepage [5] | Medium (self-report) |
| Springer Nature OA books in OAPEN, per year | 556 (2022), 607 (2023), 438 (2024), 395 (2025) | 2026-10-15 | [4] | High (as deposited) |
| OpenStax live titles; share now CC BY-NC-SA | 84; 70 (83%) | 2026-10-15 | OpenStax CMS API [12] | High |
| OpenStax licence switch date | 2026-04-22 | 2026-04-22 | OpenStax blog [13] | High |
| OpenStax students reached / savings (all-time) | 49M / $3.8B | 2026 (undated page) | [11] | Medium (self-report) |
| Open Textbook Library titles | 1,887 | 2026-10-15 | OTL API/homepage [16–17] | High |
| OTL median copyright year; share ≥2020 | 2021; 58% | 2026-10-15 | [17] | High |
| LibreTexts textbooks (self-reported) | "3,000+" | 2026 | [18] | Medium |
| MIT OCW courses | 2,500+ | 2026 | [71] | High |
| Project Gutenberg eBooks | 79,598 | 2026-10-15 | [57] | High |
| Gutenberg share in LoC class P (literature) / Q (science) | 57% / 3.5% | 2026-10-15 | Gutenberg catalogue CSV [57] | High |
| Standard Ebooks titles | ≈1,530 | 2026-10-15 | [59] (pagination count) | Medium-high |
| English Wikisource content pages | 1,134,450 | 2026-10-15 | [60] | High |
| HathiTrust volumes / PD volumes | 18M+ / ~6.7M | Sept 2024 | [61] (secondary) | Medium (stale-ish) |
| Books removed from IA lending after *Hachette* | 500,000+ | 2024 | [63] (secondary) | Medium |
| Common Pile v0.1 size; DOAB subset | 8 TB; 474,445 docs / 12.5 GB | 2025-06 | [67] | High |
| Common Corpus total / OpenCulture tokens | 2.267T / 967B | 2026-05 | [68] | High |
| Institutional Books 1.0 volumes / tokens | 983,004 / ~242B | 2025-06 | [65–66] | High |
| *Bartz v. Anthropic* settlement | $1.5B; final approval July 2026 | 2025–2026 | [70] (secondary) | Medium |
| Sample: canonical books with free legal full text | 24/55 (43.6%) | 2026-10-15 | This dossier §9 | Medium (sample bias) |
| Sample: modern technical textbooks free | 17/33 (52%); ML/AI 8/10 | 2026-10-15 | §9 | Medium |
| Sample: free to read incl. Open Library CDL | 30/55 (55%) with English CDL; 36/55 (65%) counting translated editions [corrected in verification] | 2026-10-15 | §9 + [64] | Medium |
| Sample: commercially reusable (PD/BY/BY-SA) | 7/55 (13%) | 2026-10-15 | §9 | Medium-high |
| free-programming-books link entries | 13,418 (5,919 in books/) | commit of 2026-10-14 | [56] | High |

---

## Surprises and recent changes (2024–2026)

1. **OpenStax moved from CC BY to CC BY-NC-SA (2026-04-22), explicitly citing AI-era commercial reuse.** The flagship CC BY OER provider has stepped back from maximally permissive licensing. Expect other OER producers to follow [I, medium].
2. **Most DOAB "STEM" is three publishers' edited collections.** I expected university presses to dominate. Instead IntechOpen, MDPI and Frontiers supply 69% of DOAB STEM books.
3. **The REST APIs of DOAB and OAPEN refuse cloud IPs**, but complete CSV dumps download in a single request. That is the opposite of the usual "API good, scraping bad" pattern.
4. **Author-hosted canon is fragile.** SICP's classic MIT Press HTML server returned HTTP 400 and ESL's host reset connections from this environment. Google's new SRE 2nd edition (2026) is not free online, unlike the 1st. One possible trend [I, low-medium]: new editions of formerly free books may stay closed.
5. **Free drafts are often newer than print**: Murphy PML drafts from 2025-04-18 and 2025-12-10, SLP3 draft of 2026-08-19, UDL PDF built in 2026.
6. **Harvard's Institutional Books** went from a June 2025 release to a renamed, gated dataset family in Aug–Oct 2026, with newspapers, proceedings and visual elements added, still under non-commercial early-access terms.
7. **Public Domain Day 2026** added 1930 works, including Freud's *Civilization and Its Discontents* and Russell's *The Conquest of Happiness*. Each year now adds a meaningful slice of interwar non-fiction.
8. **The *Hachette v. IA* appeal ended (no cert petition, Dec 2024).** Open Library's search API still flags many modern trade books as "borrowable" as of 2026-10-15, but for Kahneman, Harari and Diamond the lendable copies are translations; English editions of Kuhn and Parfit remain lendable. [corrected in verification] CDL is constrained but not dead.
9. **Book-data litigation and settlements (*Bartz v. Anthropic*, $1.5B; final approval July 2026)** raise the value of provably legal, licence-tagged corpora such as Common Pile and Common Corpus.
10. **A 1930–1989 hole.** None of the six mid-century classics in my sample is free; four (Feller, Savage, Kuhn, Parfit) have a CDL-borrowable English edition, while Popper and Brooks are lendable only in translation. [corrected in verification] It will close by roughly one year of publication per calendar year.

---

## Contested or uncertain points

- **DOAB size.** Figures vary with what is counted. My count: 92,260 book records in the official CSV export. Common Pile's card says "over 94,000" (2025). A 2025 library guide said 82,000+. The OAI `completeListSize` is 128,288 for all record types. Duplicates, withdrawn records and chapter-vs-book typing ("book||book" occurs 592 times) explain the spread.
- **STEM vs humanities share.** My result (~29% STEM among classified) depends on mapping Thema codes to domains and on using the *first-listed* code. 23% of books are unclassified, and multi-coded books are common. Counting *any* listed code instead of the first: 24,534 of 70,725 classified books (34.7%) carry at least one STEM code (P/T/U/M), 45,529 (64.4%) carry at least one HSS code, and 3,442 carry both [V, my count]. A 2018 study of 10,866 DOAB books found social sciences, science and history the most common LCC classes [S, stale]; not directly comparable.
- **Legality of some "free" links.** Blitzstein & Hwang's free PDF sits on Google Drive behind the authors' domain; I could not see the publisher-permission statement because the Stat110 site returned 403 [~80% legal]. ESL's free PDF is long-standing and well known, but I could not reach the host [~90%].
- **"Not free" claims.** For 31 books I found no official free edition. I checked author or publisher pages directly for AIMA, Wasserman and DDIA. The others rest on prior knowledge, not page-by-page checks [I, high but not certain]. Free *partial* material (sample chapters, lecture videos) exists for several.
- **Open Library CDL statuses** come from search-API metadata and reflect the best-matching work record. Actual borrowability (waitlists, region, the injunction's scope for specific publishers) can differ [medium]. The work-level flag also counts translations and companion volumes: six of the twelve "borrowable" sample books have no lendable English edition. [corrected in verification]
- **The sample's representativeness** is the biggest uncertainty. The 52% figure for modern technical textbooks is very sensitive to which ML books are included. Another analyst's list could plausibly produce 35–60%.
- **MIT Press D2O figures** (launch 2021; "80 monographs in the second year"; "~30% of books OA as of 2026") come from Wikipedia. The official D2O pages were blocked from here.
- **Licences in DOAB** are publisher-supplied. 12.6% have none recorded, and Common Pile explicitly warns about "license laundering and inaccurate metadata".
- **OpenStax licence coverage.** The post says "with limited exceptions". Four live titles still show CC BY and ten have no licence field in the API.

---

## Implications for someone building tools to explore literature

1. **Use bulk dumps, not live APIs.** DOAB and OAPEN CSVs (≈400 MB together), the Gutenberg `pg_catalog.csv` (21 MB), the OTL JSON (202 pages), the OpenStax CMS and the Open Library search API make a complete, refreshable local catalogue in minutes. DOAB/OAPEN REST search is IP-blocked.
2. **The most valuable layer is unindexed.** Author-hosted technical books sit in no structured database. A curated registry (YAML/JSON: title, edition, URL, terms, last-checked, checksum) of a few hundred such books would cover most of what a technical reader wants. It also needs link-rot monitoring.
3. **Make licence a first-class field and keep three lanes:**
   - **(A)** PD / CC BY / CC BY-SA: can be redistributed, embedded and used commercially.
   - **(B)** CC NC/ND: free reading and non-commercial derivatives; careful with embeddings in commercial products.
   - **(C)** Gratis "personal use / on-screen": link out, index locally for personal use only, never redistribute.

   In my sample, lane A is 13% of books but lane A+B+C is 44%.
4. **Filter DOAB by publisher quality before showing it to readers.** Otherwise the STEM shelf is dominated by special-issue reprints. A simple publisher allow-list, or a learned quality score (series, press type, peer-review metadata, page count), changes the experience.
5. **Cover the 1930–1989 gap with CDL and substitutes.** Use Open Library `ebook_access` to route to borrowable scans, but resolve to a specific edition and check its language, because the work-level flag is also set by lendable translations. [corrected in verification] Offer "closest free substitute" suggestions, e.g. Grinstead & Snell (GFDL) or Durrett for Feller, and OpenStax *Principles of Economics* 3e or CORE for Mankiw.
6. **Version awareness matters.** Free drafts (Murphy, SLP3, UDL) differ from print editions, and new editions may be closed (SRE 2e). Store edition, version date and source hash, and cite accordingly.
7. **For corpus building, start from Common Pile and Common Corpus** rather than scraping. They already filter DOAB to English BY/BY-SA, LibreTexts, PressBooks, Gutenberg and pre-1929 books, with per-document licence metadata. Institutional Books is attractive for 19th–20th-century scholarship, but its terms are non-commercial and gated.
8. **Watch licence drift.** The OpenStax move shows licences can tighten. Archive CC BY versions of resources you depend on, since derivatives of those versions remain valid.

---

## Ideas sparked

1. **"Legal Route" resolver.** An MCP server or Claude Code skill. Given a title, ISBN or DOI, it checks a local DOAB/OAPEN dump, the Gutenberg catalogue, the OTL and OpenStax APIs, Open Library `ebook_access`, and a curated author-hosted registry. It returns the best legal route ranked by openness (PD/CC → gratis → CDL borrow → library → buy), with licence lane and edition notes.
2. **Reading-list coverage scanner.** Paste a syllabus, a LessWrong reading list or a course bibliography. It colours each item by availability, as the §9 table does, computes a "coverage score", and auto-suggests free substitutes for the red items. Running it on 50 public reading lists would yield a field-by-field openness map, a natural follow-up to this dossier.
3. **Open-canon concept atlas.** Use an LLM to align chapters across the free ML/stats canon (PRML, ESL, ISL, PML 1–2, MacKay, D2L, UDL, MML, BDA3, ROS, Hernán & Robins) into a concept graph. "Show me the three best free treatments of variational inference, side by side, with notation translated into one convention." This is lane-C-safe if done locally.
4. **Link-rot sentinel for author-hosted books.** A scheduled job HEAD-checks the registry, stores checksums and page counts, and alerts on changes. It catches SICP's HTTP 400, ESL's resets, new drafts (Murphy's draft dates) and closed new editions (SRE 2e). For CC BY-SA works (SICP, D2L) it can keep a legally redistributable mirror.
5. **DOAB "gems" lens.** A re-ranked DOAB view that hides special-issue reprints and conference proceedings and boosts university-press and specialist-OA monographs. Pre-built shelves for "EA/longtermism", "decision theory and causality", and "ML theory": e.g. *Moral Uncertainty*, *Essays on Longtermism*, *Actual Causality*, *Boosting*, GPML, *Distributional RL*, *An Anthology of Global Risk*.
6. **Public Domain Day radar.** Each January, list newly PD works (1931 works on 2027-01-01) matched to the user's interests. Track when they appear on Gutenberg, HathiTrust and Wikisource, and offer a clean EPUB pipeline (Standard-Ebooks-style) for the user's own reading.
7. **Licence-lane EPUB compiler.** Build a personal "course pack" EPUB from lane-A texts only, with attribution pages auto-generated from DOAB, Gutenberg and CC metadata. Lane B and C items appear as linked stubs with a "read at source" button.
8. **"20th-century hole" substitution engine.** For each in-copyright mid-century classic, map its key ideas to free sources: the author's PD-era papers, SEP-style overviews, open lecture notes, later OA monographs. Show a "coverage of key arguments" estimate, e.g. "Kuhn's argument via free sources: 70%".
9. **Edition-diff viewer.** For books with free drafts and paid finals (Murphy, Easley & Kleinberg, SLP3), use an LLM to summarise what changed between versions. That tells a reader whether the free draft is "good enough" for a given chapter.
10. **CDL scheduler.** Combine Open Library borrowable status, waitlists and the user's reading queue. Batch one-hour loans into focused sessions, with an LLM study guide pre-generated from the table of contents and public reviews only, never from the loaned text.
11. **Open-corpus semantic index.** A local embedding index over Common Pile's DOAB, LibreTexts, PressBooks and Gutenberg subsets (about 50–150 GB of text) plus the user's lane-C PDFs, kept in separate namespaces. Retrieval-augmented reading across about 1M openly licensed or PD books plus the personal canon.

---

## Sources

Accessed 2026-10-15 unless noted; publication or update date in parentheses where known. "Search result" marks items seen only as search hits. Items marked *stale* are older than about two years.

1. DOAB full metadata export (CSV) — https://directory.doabooks.org/download-export?format=csv — downloaded 2026-10-15
2. DOAB OAI-PMH endpoint (Identify/ListSets/ListRecords) — https://directory.doabooks.org/oai/request?verb=Identify — 2026-10-15
3. DOAB REST search API (returned "not allowed") — https://directory.doabooks.org/rest/search?query=machine+learning&expand=metadata&limit=2 — 2026-10-15
4. OAPEN Library full metadata export (CSV) — https://library.oapen.org/download-export?format=csv — downloaded 2026-10-15
5. OAPEN homepage ("Our collection, in numbers"; MPG partnership 2026-09-16) — https://www.oapen.org/ — 2026-10-15
6. OAPEN OAI-PMH endpoint — https://library.oapen.org/oai/request?verb=Identify — 2026-10-15
7. Wikipedia, "Directory of Open Access Books" — https://en.wikipedia.org/wiki/Directory_of_Open_Access_Books — accessed 2026-10-15
8. VKU e-library record citing DOAB size (82,000+ books, 748 publishers) — https://elib.vku.udn.vn/handle/123456789/6077 — 2025 (search result)
9. Delta Think, "News & Views: Open Access Books" — https://www.deltathink.com/news-views-open-access-books-2 — 2023 (search result; stale)
10. Tsuji, statistics on DOAB books (IJALIS) — https://tsukuba.repo.nii.ac.jp/record/47582/files/IJALIS_6%284%29-86.pdf — 2018 (search result; stale)
11. OpenStax impact page — https://openstax.org/impact — 2026 (undated)
12. OpenStax CMS API, books — https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&limit=250&fields=title,book_state,publish_date — 2026-10-15
13. OpenStax, "An update on OpenStax licensing" — https://openstax.org/blog/openstax-licensing — 2026-04-22
14. OpenStax, "When open resources meet a changing landscape" — https://openstax.org/blog/when-open-resources-meet-a-changing-landscape — 2026-03-18
15. Wikipedia, "OpenStax" — https://en.wikipedia.org/wiki/OpenStax — accessed 2026-10-15
16. Open Textbook Library homepage — https://open.umn.edu/opentextbooks — 2026-10-15
17. Open Textbook Library JSON API — https://open.umn.edu/opentextbooks/textbooks.json — harvested 2026-10-15
18. LibreTexts homepage — https://libretexts.org/ — 2026 (newsletters to 2026-08-31)
19. Language Science Press homepage and catalogue — https://langsci-press.org/ and https://langsci-press.org/catalog — 2026-10-15
20. Wikipedia, "MIT Press" (D2O; OA share 2026) — https://en.wikipedia.org/wiki/MIT_Press — accessed 2026-10-15
21. Cambridge Core open access books (navigation incl. Flip it Open) — https://www.cambridge.org/core/services/open-access-policies/open-access-books — 2026-10-15
22. MacKay, ITILA book page — https://www.inference.org.uk/itila/book.html — 2026-10-15
23. Bishop, PRML page (Microsoft Research) — https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/ ; PDF https://www.microsoft.com/en-us/research/uploads/prod/2006/01/Bishop-Pattern-Recognition-and-Machine-Learning-2006.pdf — 2026-10-15
24. ISL / ISLP — https://www.statlearning.com/ — 2026-10-15
25. Murphy, PML book pages — https://probml.github.io/pml-book/book1.html ; https://probml.github.io/pml-book/book2.html — drafts 2025-04-18 / 2025-12-10
26. Goodfellow et al., Deep Learning — https://www.deeplearningbook.org/ — 2026-10-15
27. Sutton & Barto — http://incompleteideas.net/book/the-book-2nd.html — 2026-10-15
28. Boyd & Vandenberghe — https://web.stanford.edu/~boyd/cvxbook/ — page generated 2026-10-04
29. Dive into Deep Learning — https://d2l.ai/ ; licence https://raw.githubusercontent.com/d2l-ai/d2l-en/master/README.md — 2026-10-15
30. Prince, Understanding Deep Learning — https://udlbook.github.io/udlbook/ ; PDF https://github.com/udlbook/udlbook/releases/download/v5.0.3/UnderstandingDeepLearning_02_09_26_C.pdf — 2026
31. Gelman et al., BDA3 — https://sites.stat.columbia.edu/gelman/book/ — 2026-10-15
32. Gelman, Hill, Vehtari, ROS — https://avehtari.github.io/ROS-Examples/ — 2026-10-15
33. Blitzstein & Hwang free book redirect — http://probabilitybook.net/ — 2026-10-15
34. Durrett, PTE 5e — https://services.math.duke.edu/~rtd/PTE/pte.html — 2026-10-15
35. Jaynes, partial PDF (Bretthorst) — https://bayes.wustl.edu/etj/prob/book.pdf — PDF created 2002; accessed 2026-10-15
36. Wasserman, All of Statistics page — https://www.stat.cmu.edu/~larry/all-of-statistics/ — 2026-10-15
37. Deisenroth et al., MML — https://mml-book.github.io/ — 2026-10-15
38. Mohri et al., Foundations of ML — https://cs.nyu.edu/~mohri/mlbook/ — 2026-10-15
39. Rasmussen & Williams, GPML — https://gaussianprocess.org/gpml/ — updated 2022-04-01
40. Hardt & Recht, PPA — https://mlstory.org/ — 2026-10-15
41. Jurafsky & Martin, SLP3 — https://web.stanford.edu/~jurafsky/slp3/ — draft 2026-08-19
42. Russell & Norvig, AIMA — https://aima.cs.berkeley.edu/ — modified 2022-08-22
43. Barber, BRML — http://web4.cs.ucl.ac.uk/staff/D.Barber/pmwiki/pmwiki.php?n=Brml.HomePage — 2026-10-15
44. Hernán & Robins, What If — https://miguelhernan.org/whatifbook — 2026-10-15
45. Rubinstein, books page — https://arielrubinstein.tau.ac.il/books.html — 2026-10-15
46. Easley & Kleinberg — https://www.cs.cornell.edu/home/kleinber/networks-book/ — 2026-10-15
47. Shoham & Leyton-Brown, MAS — http://www.masfoundations.org/ — 2026-10-15
48. OTexts — https://otexts.com/ — 2026-10-15
49. Rationality: From AI to Zombies — https://www.readthesequences.com/ ; https://intelligence.org/rationality-ai-zombies/ — 2026-10-15
50. SICP PDF (CC BY-SA 4.0), MIT-hosted — https://web.mit.edu/6.001/6.037/sicp.pdf ; MIT Press content server (HTTP 400) https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pages/sicp/index.html — 2026-10-15
51. OSTEP — https://pages.cs.wisc.edu/~remzi/OSTEP/ — 2026-10-15
52. Google SRE books — https://sre.google/books/ — 2026-10-15
53. Pro Git — https://git-scm.com/book/en/v2 — 2026-10-15
54. Software Engineering at Google — https://abseil.io/resources/swe-book — 2026-10-15
55. DDIA — https://dataintensive.net/ — 2026-10-15
56. EbookFoundation free-programming-books (repo; README) — https://github.com/EbookFoundation/free-programming-books ; https://raw.githubusercontent.com/EbookFoundation/free-programming-books/main/README.md — commit 2026-10-14
57. Project Gutenberg homepage and catalogue CSV — https://www.gutenberg.org/ ; https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv ; offline catalogues https://www.gutenberg.org/ebooks/offline_catalogs.html — 2026-10-15
58. Wikipedia, "Project Gutenberg" — https://en.wikipedia.org/wiki/Project_Gutenberg — accessed 2026-10-15
59. Standard Ebooks catalogue — https://standardebooks.org/ebooks — 2026-10-15
60. English Wikisource statistics API — https://en.wikisource.org/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json — 2026-10-15
61. Wikipedia, "HathiTrust" — https://en.wikipedia.org/wiki/HathiTrust — accessed 2026-10-15 (figures Sept 2024)
62. Wikipedia, "Internet Archive" — https://en.wikipedia.org/wiki/Internet_Archive — accessed 2026-10-15
63. Wikipedia, "Hachette v. Internet Archive" — https://en.wikipedia.org/wiki/Hachette_v._Internet_Archive — accessed 2026-10-15
64. Open Library search API — https://openlibrary.org/search.json (e.g. https://openlibrary.org/works/OL15992072W) — 2026-10-15
65. Institutional Books on Hugging Face — https://huggingface.co/datasets/institutional/institutional-books-1.0 ; dataset list https://huggingface.co/api/datasets?author=institutional — 2026-10-15
66. Institutional Books 1.0 paper — https://arxiv.org/abs/2506.08300 — 2025-06-10
67. Common Pile v0.1 paper and datasets — https://arxiv.org/abs/2506.05209 ; https://huggingface.co/collections/common-pile/common-pile-v01-68307d37df48e36f02717f21 ; https://huggingface.co/datasets/common-pile/doab ; https://huggingface.co/datasets/common-pile/pre_1929_books ; https://huggingface.co/datasets/common-pile/project_gutenberg ; https://huggingface.co/datasets/common-pile/libretexts ; https://huggingface.co/datasets/common-pile/pressbooks ; https://huggingface.co/datasets/common-pile/library_of_congress — 2025-06-05; accessed 2026-10-15
68. Common Corpus (Pleias) — https://huggingface.co/datasets/PleIAs/common_corpus — last modified 2026-05-06
69. Duke Center for the Study of the Public Domain, Public Domain Day 2026 — https://cspd.law.duke.edu//publicdomainday/2026/ — 2026-01-01
70. Wikipedia, "Bartz v. Anthropic" — https://en.wikipedia.org/wiki/Bartz_v._Anthropic — accessed 2026-10-15
71. MIT OpenCourseWare, About — https://ocw.mit.edu/about/ — 2026
72. Stanford CS229 main notes — https://cs229.stanford.edu/main_notes.pdf — 2026-10-15
73. arXiv API queries (lecture-notes counts) — https://export.arxiv.org/api/query?search_query=ti:%22lecture%20notes%22&max_results=1 — 2026-10-15
74. MIT OCW 6.041SC Probabilistic Systems Analysis — https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/ — 2026-10-15
75. Grinstead & Snell, Introduction to Probability (GFDL) — https://math.dartmouth.edu/~prob/prob/prob.pdf — 2026-10-15
76. CORE Econ — https://www.core-econ.org/ — 2026-10-15
77. OpenStax Principles of Economics 3e — https://openstax.org/details/books/principles-economics-3e — 2026-10-15
78. Project Gutenberg ebook pages used in the sample — https://www.gutenberg.org/ebooks/4705 ; /11224 ; /731 ; /7142 ; /3300 ; /815 ; /5827 — 2026-10-15
79. DOAB records cited (record URIs from the DOAB export; HTML pages 403 to bots): *Moral Uncertainty* https://directory.doabooks.org/handle/20.500.12854/30579 ; *Linear Algebra Done Right* https://directory.doabooks.org/handle/20.500.12854/121457 ; GPML https://directory.doabooks.org/handle/20.500.12854/78483 ; *Actual Causality* https://directory.doabooks.org/handle/20.500.12854/78541 ; *Boosting* https://directory.doabooks.org/handle/20.500.12854/77893 ; *Distributional RL* https://directory.doabooks.org/handle/20.500.12854/111581 — 2026-10-15
80. Jeff Erickson, Algorithms (free) — https://jeffe.cs.illinois.edu/teaching/algorithms/ — 2026-10-15 (resolves; not in sample)
81. Crafting Interpreters — https://craftinginterpreters.com/ — 2026-10-15 (resolves; not in sample)
