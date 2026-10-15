---
title: The Access Ladder
description: Every legal route to a book or paper, ordered from free to expensive (open and author copies, public domain, Open Library lending, public library cards, walk-in academic access, cheap subscriptions, UC Berkeley Extension or visiting-scholar status, buying), with each rung's cost, setup time, coverage on small spot-check samples, license limits and indexability as of October 2026. Includes a 30-book worked example, a cost-against-coverage table, and the minimal-cost bundle for a Bay Area researcher.
---

*Status: draft, October 2026. Prices, eligibility rules and product statuses are as of 2026-10-15 unless another date is given; the main pricing, eligibility and license pages cited below were re-checked that day. Every book-coverage figure comes from one of two small, hand-picked spot-checks run that day: 55 canonical books (R01) and 33 technical plus 20 humanities books (R03). They are labeled as samples wherever they appear. The 30-book worked example reuses those per-title lookups plus one new Libby lookup (Popper, 2026-10-15); estimates in it are marked. Paper-coverage figures come from Walters (*PNAS*, 2025) as recomputed in [Open Papers and Preprints](/access/open-papers/). Unverified: whether SFPL's JSTOR link works from home, whether O'Reilly's library edition carries the full catalog, and whether a "Start Anytime" Extension course qualifies for the \$25 UC Berkeley card. Sources: the [R01](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R01-open-books.md), [R02](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R02-open-papers-and-shadow-libraries.md) and [R03](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md) dossiers, the other Part I chapters, and primary sources linked inline.*

The other Part I chapters each cover one kind of access. This one puts them in a single order: cash cost per title, then setup time. Check every free route before spending anything, and spend money on the residue, not on the whole list. For each rung the chapter gives the cost, the setup time, the share of a reading list it covered in the spot-checks, what its license forbids, and whether a tool you build can index it. A worked example then routes a 30-book list in probability, ML, forecasting and philosophy, and the chapter ends with the cheapest bundle for a Bay Area researcher.

## The short version

- **Climb in order, and stop when the list is covered.** The rungs are: open and author-hosted copies → public domain → Open Library lending → public library cards → walk-in academic access → cheap subscriptions → UC Berkeley Extension or visiting-scholar status → buying.
- **Free routes alone cover about a third of a technical list and about half of a broad canon.** In R03's 33 famous technical books, 11 (33%) have a legal free full text. In R01's 55 canonical books across six fields, 24 (44%) do, rising to 30 (55%) with Open Library's English-language lending. ML is the outlier: 8 of 10 are free.
- **One free San Francisco Public Library card is the biggest step on the ladder.** Together with legal free copies, SFPL's O'Reilly and Libby reached 28 of 33 technical titles (85%). Libby alone reached 10 of 20 humanities titles. The O'Reilly login stands in for a \$499/year subscription.
- **Extra library cards help humanities reading, not technical reading.** Six Bay Area systems lifted humanities Libby coverage from 10 to 16 of 20, almost all of it from the Peninsula–South Bay cards. In the technical sample they added no title that SFPL and the free web lacked, though they add copies and shorten holds. A Los Angeles Public Library (LAPL) card, which needs a trip to LA, adds one technical title (CLRS) and three humanities titles.
- **Subscriptions add little once you hold the cards.** Perlego covered 5 of the 33 technical titles, all of them already reachable. For humanities it lifts the Bay Area card stack from 16 to 18 of 20. Buy subscriptions in one-month bursts tied to a project.
- **The residue is cheap to buy.** Neither the free web nor any Bay Area card reached CLRS, AIMA, CS:APP, *Gödel, Escher, Bach* or the whole of Jaynes (LAPL's Libby has CLRS). At the cheapest AbeBooks listings on 2026-10-15, all five cost \$159 together.
- **Papers follow the same shape.** The free legal routes reached 73% of a sample of cited works (58% in the final version); one university library's subscriptions raised that to 88% (85%) ([Walters 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/), recomputed in [Open Papers and Preprints](/access/open-papers/)).
- **Worked example:** a 30-book list in this wiki's domains reaches 26 titles (87%) with one free SFPL card, 27 (90%) with LAPL, and all 30 for \$111–\$138.
- **What a tool may index shrinks as you climb.** Public-domain and openly licensed text can be indexed and shared. Gratis author PDFs can be indexed locally, for personal use only. Library, lending and subscription content can enter a tool only as metadata and links. O'Reilly's agreement forbids using its content "as input or a prompt to a machine learning or AI system" ([O'Reilly](https://www.oreilly.com/membership-agreement/), updated 2024-10-09). In the worked example, a personal tool can hold the full text of 13 of 30 books, or 16 if you buy the print residue and scan it.

## The samples behind the numbers

Both spot-checks were run on 2026-10-15, and both are small.

| Sample | What it is | Checked against | Main bias |
|---|---|---|---|
| **R01 canon** (n = 55) | Books the research agent, an LLM, judged frequently recommended: 9–10 each in probability and statistics; ML/AI; decision theory, forecasting and economics; philosophy and rationality; history and social science; software engineering | Author and publisher pages, the DOAB export, the Gutenberg catalogue, and Open Library lending status checked edition by edition | Free books are discussed more online, so a model-picked canon over-represents them. This probably pushes the free share up [~75%] |
| **R03 technical** (n = 33) | Well-known technical books: DDIA, *Hands-On ML*, CLRS, Goodfellow, PRML, *Statistical Rethinking*, BDA3, Jaynes, *Superforecasting* and others | Free legal copies (from R01), O'Reilly's public book sitemap, Perlego's public search index (US rights only), Libby at nine library systems via OverDrive's catalog API, AbeBooks prices | Famous books have more library copies and more free editions |
| **R03 humanities** (n = 20) | Kuhn, Parfit, Scott, Rawls, Arendt, Meadows, Henrich, Hacking and others | Perlego, Libby, O'Reilly. Free status was not checked. R03 reported Libby results as totals; [Public Libraries](/access/public-libraries/) re-ran them by library the same day | Same |

Read the results as a rough map. The binomial standard error is about 6 points on 85% at n = 33, and about 9 points on 80% at n = 20. For a less famous list, treat each figure as an upper estimate [~70%]. "Coverage" here means a complete, current-edition text you can read legally. Partial texts and superseded editions are counted separately. Library results come from catalog lookups, not logged-in tests, and Libby holdings change daily.

## The ladder at a glance

Coverage columns are cumulative. They count the titles reachable by that rung or any rung below it.

| # | Rung | Cost (Oct 2026) | Setup time | Technical, R03 (n = 33) | Humanities, R03 (n = 20) | Main restriction | Can a tool index it? |
|---|---|---|---|---|---|---|---|
| 1 | **Open-access and author-hosted copies** (author pages, DOAB/OAPEN, OpenStax, OTexts; for papers, Unpaywall, arXiv, PMC) | \$0 | Minutes; about a minute per title [inference] | 11 (33%), +1 partial | Not measured; low [inference] | Terms range from CC BY to "personal use only" and "on-screen" | Metadata: yes. Text: by license lane (open: share; NC/ND: non-commercial; gratis: local and personal only) |
| 2 | **Public domain** (Gutenberg, HathiTrust full view, Wikisource, Standard Ebooks) | \$0 | None | 11 (+0) | Not measured. R01: 6 of 18 history and philosophy titles | None in the US for works published 1930 or earlier | Yes, fully |
| 3 | **Open Library / Internet Archive lending** (controlled digital lending, CDL) | \$0, free account | Minutes, plus an edition check per book | 11 (+0 current editions; *Hands-On ML* 1st ed. only). 14 titles unchecked | At least 2 (Kuhn, Parfit) | One-hour loans; DRM on downloads; often older editions | Availability: yes. Text: no |
| 4 | **Public library cards** (SFPL first; then San José, Santa Clara County, Peninsula, Oakland, Berkeley; LAPL on a trip) | \$0 for California residents; SCCLD free to any US address in person | SFPL: online application plus one visit with ID. Bay stack: two afternoons. LAPL: a trip to LA | SFPL: 28 (85%). Bay stack: 28. +LAPL: 29 (88%) | SFPL: 10 (50%). Bay stack: 16 (80%). +LAPL: 19 (95%) | O'Reilly bans AI input and spiders; JSTOR officially walk-in only; holds queues | Availability: yes. Text: no |
| 5 | **Walk-in academic access** (UC Berkeley public computers, SF State stations, Stanford day passes; paid community cards) | \$0 walk-in; cards \$50–\$1,000/yr | Travel per visit | Not measured for books | Not measured | On-site only; no systematic downloading | No. A tool can prepare visit lists |
| 6 | **Cheap subscriptions** (Perlego, JPASS, Springer+, DeepDyve, O'Reilly, Everand) | \$15–\$27/month (Perlego); \$199/yr (JPASS); \$499/yr (O'Reilly, DeepDyve) | Minutes | +0 (Perlego and O'Reilly add nothing beyond the cards) | Bay stack + Perlego: 18 (90%) | Personal use only; O'Reilly's AI clause; JSTOR bans LLM training; US sales rights vary by title | Presence: yes. Text: no |
| 7 | **UC Berkeley Extension or visiting scholar** | Extension card \$25 per 6 months plus a 10+ week course (cheapest likely-qualifying course \$810 in an October 2026 sample). Visiting scholar \$750 first year plus a faculty sponsor | A 10+ week course; weeks to months for an appointment [inference] | Not measured. Full UC Berkeley e-collections, remotely | Same | Institutional license terms | Only under a text-and-data-mining (TDM) license, if one applies (unverified) |
| 8 | **Buy used or new** | \$8–\$70 per residual title at the cheapest listings | Days | 33 (100%) for \$143–\$159 more | Hacking unpriced | Ebook DRM | Print you own: private scan-and-search is defensible. Breaking ebook DRM: no |

Three caveats on the order:

- **Rungs 1–3 are all free and fast,** so in practice you check them together for each title.
- **Walk-in academic access is free in cash but expensive in time.** For a reader who values time highly, it belongs after the subscriptions.
- **Buying is last only because you pay per title.** For the last three or four books on a list, or a book you will annotate for years, it is the cheapest rung.

## Rung by rung

### 1. Open-access and author-hosted copies

**What it adds.** For books there are three layers.

- **Author and publisher PDFs.** These form the free ML and statistics canon: Bishop, ESL, ISL, Murphy, MacKay, Sutton & Barto, BDA3, *Regression and Other Stories*, Boyd & Vandenberghe.
- **The scholarly open-access record.** DOAB lists 92,260 books as of 2026-10-15, mostly humanities and social science. 69% of its STEM titles come from three publishers of edited collections: IntechOpen, MDPI and Frontiers.
- **Open textbooks,** mostly introductory: OpenStax, the Open Textbook Library (1,887 titles), LibreTexts and OTexts.

For papers this rung is the open-access cascade. Details are in [Open-Access Books and Textbooks](/access/open-books/) and [Open Papers and Preprints](/access/open-papers/).

**Coverage (samples).** In R01, 18 of 55 books have a free text that is not public domain: 15 gratis author or publisher copies and 3 under Creative Commons. Jaynes is partial, with chapters 1–3 only. The field split is lopsided:

| R01 field (n) | Free legal full text | Of which public domain |
|---|---|---|
| ML/AI (10) | 8 | 0 |
| Probability and statistics (9) | 3, +1 partial | 0 |
| Decision theory, forecasting, economics (9) | 2 | 0 |
| Philosophy and rationality (9) | 4 | 2 |
| History and social science (9) | 4 | 4 |
| Software engineering (9) | 3 | 0 |

By era, the same sample has 17 of 33 post-1990 technical textbooks free (52%), but only 9 of 23 once ML is excluded (39%). Popular non-fiction since 1990: 1 of 10.

**Restrictions.** Free to read is not free to reuse. Fifteen of R01's 24 free books are gratis copies with all rights reserved. Examples: "personal use only" ([ROS](https://avehtari.github.io/ROS-Examples/)), "for non-commercial purposes" ([BDA3](https://sites.stat.columbia.edu/gelman/book/)), "view the book on-screen" ([MacKay](https://www.inference.org.uk/itila/book.html)), and HTML only by contract ([Goodfellow et al.](https://www.deeplearningbook.org/)). OpenStax moved its library to CC BY-NC-SA on 2026-04-22 ([OpenStax](https://openstax.org/blog/openstax-licensing)). Free drafts can differ from print, and new editions can close: Google's *Site Reliability Engineering* 2nd edition (2026) is not free online, unlike the 1st ([sre.google](https://sre.google/books/)).

**Can a tool index it?** R01 proposes three license lanes:

- **Lane A** (public domain, CC BY, CC BY-SA): redistribute and embed freely.
- **Lane B** (NC/ND licenses): non-commercial use; be careful with embeddings in a commercial product.
- **Lane C** (gratis): index locally for personal use, link out, never redistribute.

Of the 55 books, lane A holds 7 (13%) and lanes A–C together hold 24 (44%). For papers, OpenAlex and arXiv metadata are CC0. arXiv's default license lets you cache full text for personal research but not re-serve it ([arXiv API terms](https://info.arxiv.org/help/api/tou.html)). Bronze open access carries no license at all.

**Decision.** For a modern technical book, check the author's own book page first; R01 found 8 of 10 ML books that way. For a paper, run Unpaywall, then Google Scholar's "All versions". Keep a list of the author-hosted copies you rely on, with last-checked dates. During the checks, ESL's host reset connections and SICP's classic MIT Press server returned HTTP 400.

### 2. The public domain

**What it adds.** Project Gutenberg lists 79,598 ebooks; of the texts in its catalogue, 57% are literature and 3.5% science ([Gutenberg](https://www.gutenberg.org/), 2026-10-15). English Wikisource has 1.13M content pages. HathiTrust has 8.29M full-view volumes of 19.7M (Hathifile of 2026-10-01; details in [The Public Domain and Open Corpora](/access/public-domain/)). In the US, works published in 1930 entered the public domain on 2026-01-01, among them Freud's *Civilization and Its Discontents* (the German original) and Russell's *The Conquest of Happiness* ([Duke CSPD](https://cspd.law.duke.edu/publicdomainday/2026/)). Works from 1931 follow on 2027-01-01.

**Coverage (samples).** R01's six pre-1929 classics were all free (Hume, Mill, Gibbon, Thucydides, Smith, Tocqueville). That is 6 of 55, all in philosophy, history and social science. R03's technical set had none. For a technical reader this rung is nearly empty. For a reader of intellectual history it is decisive. The six in-copyright classics from 1930–1989 in R01 (Feller, Savage, Kuhn, Popper, Parfit, Brooks) had no free text. That hole closes by one publication year per calendar year.

**Restrictions.** None for US public-domain texts, though HathiTrust's `pdus` volumes (2.30M of its full view) are public domain in the US only. A modern translation of an old work has its own copyright. R01's free copies of Thucydides and Tocqueville are 19th-century translations (Crawley, Reeve).

**Can a tool index it?** Yes: store, embed and redistribute. Large corpora such as Common Pile already package pre-1929 books with per-document license metadata. Harvard's Institutional Books is gated under non-commercial terms. See [The Public Domain and Open Corpora](/access/public-domain/).

**Decision.** Check the publication year first. If it is 1930 or earlier, go straight to Gutenberg or HathiTrust. Otherwise skip this rung.

### 3. Open Library and Internet Archive lending

**What it adds.** With a free account you get one-hour renewable loans in the BookReader. Some titles offer 14-day loans as LCP-encrypted EPUB or PDF. You can hold up to 10 books at a time ([Internet Archive help](https://help.archive.org/help/borrowing-from-the-lending-library/)). Lending shrank after *Hachette v. Internet Archive*: the Second Circuit affirmed on 2024-09-04, and the Archive did not seek Supreme Court review ([IA blog, 2024-12-04](https://blog.archive.org/2024/12/04/end-of-hachette-v-internet-archive/)). More than 500,000 books were reportedly removed from lending (secondary source).

**Coverage (samples).** In R01, lending adds 6 of 55 books with a borrowable English edition: Bertsekas & Tsitsiklis, Feller, Géron (1st edition only), Savage, Parfit and Kuhn. That takes the free-to-read total from 24 to 30 (55%). Four of the six 1930–1989 classics are borrowable in English, so this is the rung that fills the 20th-century hole. In R03's technical set it adds no current edition.

**Restrictions.** The search API's `ebook_access` flag overstates availability. It is a work-level maximum over all editions, translations included. Of 12 R01 books flagged "borrowable", six are lendable only as a translation or a study guide: Kahneman, Mankiw, Diamond, Harari, Acemoglu & Robinson, Brooks. (R03's table lists Kahneman as borrowable; R01's verification pass corrected that.) Lendable editions are often old: Géron's 1st edition, not the 3rd. Popular titles have waitlists.

**Can a tool index it?** Availability, yes. Query `https://openlibrary.org/search.json?q=<title>&fields=key,title,ebook_access`, then the work's `editions.json`, and check the language of the lendable edition ([Open Library search API](https://openlibrary.org/dev/docs/api/search)). The loaned text, no. R01 suggests a scheduler that prepares a study guide from the table of contents and public reviews, never from the loan.

**Decision.** Use this rung for 1930–1989 classics and for older editions. Always open the specific edition and check its language and edition number.

### 4. Public library cards

**What it adds.** An SFPL card is free to every California resident. You apply online, then show photo ID at any branch ([SFPL](https://sfpl.org/welcome-new-cardholders)). It unlocks Libby, O'Reilly for Public Libraries, LinkedIn Learning, ProQuest eBook Central, EBSCO and Gale databases, a JSTOR link and newspapers ([SFPL databases](https://sfpl.org/articles-databases)). It also gives you Link+ for print. Five more Bay Area systems give Californians free cards. Santa Clara County Library District gives a free full card to anyone with a US mailing address who applies in person ([SCCLD](https://sccld.org/card/)). The card-by-card detail and a one-afternoon plan are in [Public Libraries](/access/public-libraries/).

**Coverage (samples).**

| Route | Technical (n = 33) | Humanities (n = 20) |
|---|---|---|
| SFPL O'Reilly | 14 | 0 |
| SFPL Libby | 10 | 10 |
| SFPL card + legal free copies | **28 (85%)** | 10+ (free copies not checked) |
| Six Bay Area cards (Libby) + SFPL O'Reilly + free copies | 28 (no change) | 16 (80%): Santa Clara County +4, Peninsula +1, Berkeley +1 |
| + LAPL | 29 (88%; CLRS) | 19 (95%): Parfit, Weber, Popper |

The technical unions are computed from R03's title table; the humanities breakdown is the by-library re-run in [Public Libraries](/access/public-libraries/). The six Bay Area cards hold eight technical titles in Libby that SFPL's Libby lacks. All eight are already on O'Reilly or free online, so the stack adds ebook copies, not titles. Applied to R01's canon, the SFPL card adds at least 7 books beyond rungs 1–3 (McElreath, Tetlock, Kahneman, Hubbard, Kleppmann, Martin, Thomas & Hunt), for at least 37 of 55 (67%). Fifteen of the remaining books have no per-title library result.

**Holds are the real price.** On 2026-10-15, *Thinking, Fast and Slow* had 13 copies and 51 holds at SFPL: about 3.9 loan periods, or 8–12 weeks for a new hold at 14- to 21-day loans if every borrower keeps the full term [inference; SFPL's loan length not checked]. For print-only books, Link+ reaches "over 11 million items from 64 libraries", and most requests arrive in under a week ([Oakland PL](https://oaklandlibrary.org/borrow-from-another-library/)). Interlibrary loan is rationed (3 requests a month at Oakland).

**Restrictions.**

- **O'Reilly.** Its membership agreement bans "Web spiders" and AI training. It also bans using content "as input or a prompt to a machine learning or AI system", and caps quotes at 250 words ([O'Reilly](https://www.oreilly.com/membership-agreement/)). I put it at [~75%] that these terms bind library patrons.
- **JSTOR.** It says public-library access is walk-in only ([JSTOR](https://about.jstor.org/products/fees/public-libraries/)). Yet SFPL lists a remote proxy link; I put it at [~50%] that the link works from home.
- **Remote e-cards are closing.** LAPL's instant e-card is now for Los Angeles City residents only, because "licensing agreements with our digital content vendors require" it ([LAPL](https://lapl.org/library-card/borrowing-policies-and-information)). Orlando's Orange County Library System stopped issuing fee cards on 2026-07-31 ([OCLS](https://ocls.org/using-library/types-cards/what-are-types-cards/)).

**Can a tool index it?** Availability, yes. OverDrive's undocumented catalog API returns owned copies, available copies and holds per library ([example](https://thunder.api.overdrive.com/v2/libraries/sfpl/media?query=designing%20data-intensive%20applications)). O'Reilly's public sitemap lists its titles ([sitemap](https://www.oreilly.com/book-sitemap.xml)). The content, no: it sits behind DRM and the library login, and O'Reilly forbids AI input.

**Decision.** Get the SFPL card before anything else that costs time. For humanities reading, or for Libby copies of O'Reilly titles and shorter holds, add the Peninsula–South Bay cards (Peninsula Library System, San José, Santa Clara County): in the samples they supplied all eight extra technical Libby titles and five of the six extra humanities titles. The East Bay cards (Oakland, Berkeley) added one title (Rawls); get them for Berkeley's JSTOR link and both libraries' in-library physics journals. Get LAPL on your next trip to Los Angeles, not on a dedicated one.

### 5. Walk-in academic access

**What it adds.** A research library's licensed databases, its stacks, or both, used on site.

| Option | Cost (Oct 2026) | Licensed e-resources | Borrowing | Source |
|---|---|---|---|---|
| UC Berkeley, visitor | Free | On library public computers only; the free Wi-Fi does not include them | No | [UCB visitors](https://www.lib.berkeley.edu/help/visitors) |
| UC Berkeley, California-resident card | \$100/yr (\$95 seniors) | **No remote access** | 20 books; no interlibrary loan | [UCB borrow](https://www.lib.berkeley.edu/find/borrow-renew) |
| SF State public research stations | Free; "no account or login is required" | On site; downloads can be saved to your own USB drive | — | [SFSU accounts](https://library.sfsu.edu/accounts); [SFSU USB](https://library.sfsu.edu/community-borrowers) |
| SF State Community Borrowers | \$50/yr | No off-campus access | Physical borrowing | [SFSU](https://library.sfsu.edu/community-borrowers) |
| Stanford day pass | Free, 7 days a year (14 for alumni) | Designated public computers | No | [Stanford](https://library.stanford.edu/about-stanford-libraries/visitor-access) |
| Stanford independent researcher | \$35 per 2 weeks; \$75/month; \$150 per 3 months; \$450/yr (\$1,000/yr with borrowing) | On site only | With the \$1,000 tier | same |

**Coverage.** Neither sample measured this rung for books. For papers, one university library's subscriptions alone gave full text for 73% of 875 works cited in 2023 review articles (72% in the final version), against 67% (48%) for Google Scholar's free links ([Walters, *PNAS* 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/)). Combined with the free legal routes, the library reached 88% (85% final), recomputed in [Open Papers and Preprints](/access/open-papers/). It mattered most for final versions (58% free, 85% with the library), work published before 2001 (36% to 67%) and cited books (3% to 30%). The library was Manhattan University's, with subscriptions of "more than \$500,000 per year"; UC Berkeley's or Stanford's collections should do better [~80%].

**Restrictions.** On-site use only. JSTOR's terms (2026-04-24) forbid systematic downloading and using content "to train large language models" ([JSTOR terms](https://about.jstor.org/terms/)). Other databases have similar clauses.

**Can a tool index it?** No. A tool can prepare a visit list (DOIs, database paths, chapter targets) and file what you save for personal reading. Whether you may then feed those files to a model depends on each database's terms: JSTOR bans LLM training, and Elsevier allows text mining only under its TDM terms (see [The Legal Map](/building/legal-map/)).

**Decision.** Batch the visits. Go when you have a list of paywalled papers, need final versions for citation, or need a print-only book for an afternoon. If a half-day visit costs about four hours, four visits a year make JPASS's \$199 worth about \$12 per hour saved, for JSTOR content only. Walk-in still wins for the non-JSTOR backfile [inference].

### 6. Cheap subscriptions

| Subscription | Price (Oct 2026) | What it covers | Sample coverage | Catch |
|---|---|---|---|---|
| [O'Reilly Individual](https://www.oreilly.com/pricing/) | \$49/month; \$129 per 3 months; \$499/yr | 66,609 title URLs in its book sitemap; largest publishers Wiley, O'Reilly, Pearson, Packt, Apress, CRC, Manning. **No MIT Press, Cambridge, Oxford or core Springer** | 14/33 technical; 0/20 humanities. +0 over an SFPL card | AI-input ban; 250-word quote limit |
| [Perlego](https://www.perlego.com/pricing/) Essential / Complete | \$15/month, \$45 per 4 months or \$125/yr / \$27/month, \$79 per 4 months or \$199/yr | About 1.5M items with US rights. Routledge 153k, CRC 34k, Wiley 19k, Cambridge 15.7k, Princeton 9.8k, MIT Press about 1,000; only 33 O'Reilly | 5/33 technical (all reachable elsewhere); 8/20 humanities | Per-title US sales rights (*The Alignment Problem* is UK-only). Some titles flagged "restricted", probably Complete-only [~40%]. Test prices run \$12–\$38/month |
| [Everand](https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe) Standard / Plus / Deluxe | \$11.99 / \$16.99 / \$28.99 per month for 1 / 3 / 5 unlocks | 1.5M+ titles; most need an unlock | Not checked (bot-blocked) | \$5.66–\$11.99 per book. The unlimited Legacy plan is closed to new sign-ups |
| [JPASS](https://about.jstor.org/products/jpass/) | \$19.50/month for 10 PDFs; \$199/yr for 120 PDFs | 2,400+ journals | Papers | \$1.66–\$1.95 per PDF |
| [Springer+](https://link.springer.com/product/springer-plus) Basic / Standard | \$39.99/month for 10 units / \$299 per 6 months for 120 units | Springer Nature chapters and articles; a whole ebook costs at most 7 units | — | 12 hours to download after spending a unit; unused units expire; "not licensed for use by companies or organizations" |
| [DeepDyve](https://www.deepdyve.com/pricing) | \$59/month or \$499/yr | 35M+ paywalled papers, streamed | Papers | Printing capped at 40 pages a month |

Kindle Unlimited's price could not be verified in October 2026, and its catalog claim ("over 5 million digital titles") could not be re-checked in the verification pass. Kobo Plus blocked automated checks.

**Restrictions.** Every plan above is sold to individuals; O'Reilly's and Springer+'s terms say so explicitly, so none can be pooled into a team tool. JSTOR bans LLM training and automated downloading.

**Can a tool index it?** Presence, yes. O'Reilly's sitemap and Perlego's public search index show what each service carries. Content, no.

**Decision.**

- **O'Reilly Individual:** with an SFPL card, skip it. Pay only for early releases, live events or labs.
- **Perlego:** buy one month for a humanities project heavy in Routledge, Cambridge or Princeton monographs, not a year.
- **Springer+ Basic:** buy one month when you need about ten Springer chapters, at \$4 each against \$29.95 pay-per-view ([Springer Nature](https://support.springernature.com/en/support/solutions/articles/6000230449-springer-nature-products)).
- **JPASS:** only if you read a lot on JSTOR and SFPL's JSTOR link fails from home.
- **DeepDyve:** only for heavy paper reading outside JSTOR with no institutional route.

Prices and catalogs are in [Cheap Subscriptions](/access/subscriptions/).

### 7. UC Berkeley Extension or visiting-scholar status

**What it adds.** Remote access to a research university's licensed journals, databases and ebooks.

- **Extension.** UC Berkeley Extension students "enrolled in a semester-length (10+ week) course" can buy a six-month library card "for a fee of \$25". With it, "remote access to licensed electronic resources such as journals, databases, and e-books are available" ([UCB Library](https://www.lib.berkeley.edu/find/borrow-renew), checked 2026-10-15). The \$100 California-resident card does not include remote access. The real price is the course. In a sample of 76 open online Extension sections on 2026-10-15, courses of 2 or more units cost \$665–\$2,100 (median \$1,045). The cheapest course likely to qualify was a 3-unit "Start Anytime" course at \$810 ([ENGLISH X135A](https://extension.berkeley.edu/search/publicCourseSearchDetails.do?method=load&courseId=41071); sample and method in [University and Employer Access](/access/academic-and-employer/)). That puts the route at about \$835 per six months, or \$1,670 a year. A 3-unit Start Anytime course runs at least 90 days, but whether the library counts it as "semester-length" is unconfirmed [~60%]; ask the library's Privileges Desk before enrolling. Cal Alumni Association membership (\$75/yr, "open to all") gives "\$50 discount per eligible UC Berkeley Extension course" ([CAA](https://alumni.berkeley.edu/join/alumni-member-benefits/)); whether that applies to non-alumni members is unverified.
- **Visiting scholar.** Requires a department appointment and a faculty sponsor. The University Services Fee is \$750 for the first year and \$1,500 for a consecutive second year, and the department may charge its own fee ([VSPA](https://vspa.berkeley.edu/about/university-services-fee)). It gives full remote access.
- **Employer licenses** belong here too: O'Reilly Teams at \$499 per member per year, and JSTOR's corporate collection at \$9,000–\$65,000 a year. See [University and Employer Access](/access/academic-and-employer/).

**Coverage.** Not measured for books. For papers, one university library's subscriptions plus the free legal routes reached 88% of Walters' sample (85% final), as recomputed in [Open Papers and Preprints](/access/open-papers/). UC Berkeley's collections are much larger than that library's, so treat 88% as a floor [~80%].

**Restrictions and indexing.** Institutional license terms apply. An academic affiliation is also the usual gateway to publisher text-and-data-mining licenses. Springer Nature gives TDM rights "at no additional cost" to academic subscribers for non-commercial research ([Springer Nature](https://www.springernature.com/gp/researchers/text-and-data-mining)). Elsevier gives researchers at subscribing academic institutions a personal API key ([Elsevier](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining)). Whether an Extension student or a visiting scholar qualifies is unverified.

**Decision.** If you would take a 10+ week Extension course anyway, the card is a \$25 add-on for six months of remote access, about \$4 a month. If you would not, \$1,670 a year buys more than twice a first-year visiting-scholar appointment; pay it only for a bounded project such as a six-month literature review across many publishers. Take the visiting-scholar route if you have a real collaborator: at \$750 it costs less than DeepDyve, JPASS and Perlego Complete bought together (\$897 a year) and covers far more [inference].

### 8. Buying used or new

**Prices.** The cheapest AbeBooks listings, US shipping included, on 2026-10-15 ([AbeBooks](https://www.abebooks.com/servlet/SearchResults?isbn=9780521592710&sortby=17); single-day snapshot):

| Title | Cheapest total |
|---|---|
| *Gödel, Escher, Bach* | \$8.23 |
| *Superforecasting* | \$9.38 |
| CLRS 3e / 4e | \$16.25 / \$70.43 |
| AIMA 4e | \$33.15 new (probably an international edition) / \$127.80 used |
| CS:APP 3e | \$31.54 new / \$93.00 used |
| *Hands-On ML* 3e | \$32.74 |
| Goodfellow, *Deep Learning* | \$35.99 |
| PRML | \$38.19 |
| ESL 2e | \$42.14 |
| DDIA 1e | \$44.54 |
| BDA3 | \$54.39 |
| MacKay | \$56.21 |
| *Statistical Rethinking* 2e | \$68.75 |
| Jaynes | \$69.99 |
| Sutton & Barto 2e | \$77.74 |

The technical residue after rung 4 (CLRS, AIMA, CS:APP, *Gödel, Escher, Bach*, Jaynes) costs \$159 at these prices, or \$143 without CLRS if you hold an LAPL card. At current US editions bought used, it costs about \$370.

**Can a tool index it?** For print you own, a private scan-and-search index is rated green/yellow in [The Legal Map](/building/legal-map/). *Bartz v. Anthropic* held that scanning purchased print books was fair use, on facts where each print original was destroyed and the scans stayed in-house ([order, 2025-06-23](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)); keeping the print copy as well is outside those facts. *Hachette v. Internet Archive* held that digitizing and lending books is not transformative. Breaking ebook DRM to text-mine is rated red outside a narrow exemption for university researchers. **If you want a tool to index a book you buy, buy print or a DRM-free edition.**

**Decision.** Buy the last few titles on a list, and any book you will annotate or reread for years. Buy early when the holds queue is longer than you will wait: *Superforecasting* at \$9.38 beats a months-long wait.

## Papers on the same ladder

The ladder holds for papers, with different numbers. The measured rates come from [Walters (*PNAS*, July 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/), who hand-searched 875 works cited in 2023 review articles across seven fields (none of them ML, statistics or philosophy). "Recomputed" rows are unions calculated from his per-work data in [Open Papers and Preprints](/access/open-papers/); the rest are that chapter's estimates.

| Rung | Route for papers | Coverage (any version / final) | Cost |
|---|---|---|---|
| 1 | Unpaywall / OpenAlex | 48% / 35% (measured) | \$0 |
| 1 | Google Scholar "All versions" alone | 67% / 48% (measured) | \$0 |
| 1 | All free legal tools Walters tested (Scholar, OpenAlex, ResearchGate, Academia.edu, Dimensions, PubMed, ERIC) | 73% / 58% (recomputed) | \$0 |
| 1 | + field servers he did not test (arXiv, SSRN, RePEc), author pages, CORE | Perhaps 74–77% [~50%]; much higher in arXiv fields | \$0 |
| 2 | JSTOR Early Journal Content (US articles more than 95 years old) | Old articles only | \$0 |
| 4 | JSTOR free account (10 articles per 30 days, read online); library databases; interlibrary loan | About 80% without institutional access [~50%] | \$0 |
| 5 / 7 | University subscriptions, walk-in or remote | 73% / 72% alone (measured); 88% / 85% with the free legal routes (recomputed) | \$0 walk-in; \$25 + course; \$750 |
| 6 | JPASS; Springer+; DeepDyve | Per item | \$1.66–\$1.95 per JSTOR PDF; \$2.49–\$3.99 per Springer item |
| 8 | Publisher pay-per-view | About 100% | \$29.95 per chapter, \$39.95 per article (Springer) |

Emailing the corresponding author is legal and common, but no study measures how often it works. Shadow libraries are not a rung. In Walters' sample, Anna's Archive and Sci-Hub reached 76% and 72%, but this wiki routes only to legal sources ([The Shadow Libraries](/access/shadow-libraries/)).

## The worked example

**The list.** Thirty books for a researcher in Bayesian statistics, forecasting, ML and EA-adjacent philosophy: 7 in probability and statistics, 8 in ML and AI, 7 in decision theory, forecasting and economics, and 8 in philosophy and AI risk. Every title comes from one of the two spot-check samples, so each status below is a lookup made on 2026-10-15, not a guess, unless marked. Each book is routed to the first rung that gives a complete, current edition.

| # | Book | First rung | Route and catch |
|---|---|---|---|
| 1 | Jaynes, *Probability Theory: The Logic of Science* | 8 | Free: chapters 1–3 only ([editor's PDF](https://bayes.wustl.edu/etj/prob/book.pdf)). No lendable scan, no Libby, O'Reilly or Perlego copy. Used \$69.99. Link+ not checked |
| 2 | Blitzstein & Hwang, *Introduction to Probability* 2e | 1 | Author-linked PDF ([probabilitybook.net](http://probabilitybook.net/)); publisher permission not seen [~80%] |
| 3 | Gelman et al., *Bayesian Data Analysis* 3e | 1 | Author PDF, non-commercial |
| 4 | McElreath, *Statistical Rethinking* 2e | 4 | O'Reilly via SFPL, if the library edition includes it [~70%]. Fallback: used \$68.75 |
| 5 | Gelman, Hill & Vehtari, *Regression and Other Stories* | 1 | PDF, personal use only |
| 6 | Bertsekas & Tsitsiklis, *Introduction to Probability* | 3 | Lendable English edition. Free substitute: [MIT OCW 6.041SC](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/) |
| 7 | Feller, *An Introduction to Probability Theory*, Vol. 1 | 3 | Lendable English edition |
| 8 | Bishop, *Pattern Recognition and Machine Learning* | 1 | [Microsoft Research PDF](https://www.microsoft.com/en-us/research/people/cmbishop/prml-book/) |
| 9 | Hastie, Tibshirani & Friedman, *Elements of Statistical Learning* 2e | 1 | Author PDF; host unreachable during checks [~90%] |
| 10 | Murphy, *Probabilistic Machine Learning* | 1 | [CC BY-NC-ND drafts](https://probml.github.io/pml-book/) (2025) |
| 11 | Goodfellow, Bengio & Courville, *Deep Learning* | 1 | HTML only |
| 12 | Sutton & Barto, *Reinforcement Learning* 2e | 1 | [Author PDF](http://incompleteideas.net/book/the-book-2nd.html) |
| 13 | MacKay, *Information Theory, Inference, and Learning Algorithms* | 1 | Author PDF, "on-screen" |
| 14 | Russell & Norvig, *Artificial Intelligence: A Modern Approach* 4e | 8 | No free text ([site](https://aima.cs.berkeley.edu/) has front matter only); no library or subscription copy. \$33.15 new (probably international), \$127.80 used |
| 15 | Géron, *Hands-On Machine Learning* 3e | 4 | O'Reilly via SFPL; Libby at San José, Santa Clara County and LAPL. Lending has only the 1st edition |
| 16 | Tetlock & Gardner, *Superforecasting* | 4 | SFPL Libby. Used \$9.38 |
| 17 | Kahneman, *Thinking, Fast and Slow* | 4 | SFPL Libby, 13 copies / 51 holds (about 8–12 weeks). Lendable scans are translations only |
| 18 | Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* 3e | 1 | [Free online](https://otexts.com/fpp3/) |
| 19 | Hubbard, *How to Measure Anything* 3e | 4 | O'Reilly via SFPL; also Santa Clara County Libby |
| 20 | Osborne & Rubinstein, *A Course in Game Theory* | 1 | ["My 8 books are free"](https://arielrubinstein.tau.ac.il/books.html) |
| 21 | Savage, *The Foundations of Statistics* | 3 | Lendable English edition |
| 22 | Pearl & Mackenzie, *The Book of Why* | 4 | SFPL Libby (lending not checked) |
| 23 | Kuhn, *The Structure of Scientific Revolutions* | 3 | Lendable English edition; also on Perlego (US) |
| 24 | Parfit, *Reasons and Persons* | 3 | Lendable English edition |
| 25 | Popper, *The Logic of Scientific Discovery* | 4 | Lendable only in translation. R03 reported humanities Libby results only as totals, so this title's Bay Area status is unknown: [~75%] that some Bay Area Libby has it (reasoning below). LAPL's Libby certainly does. Without either, Perlego (US rights) |
| 26 | MacAskill, Bykvist & Ord, *Moral Uncertainty* | 1 | [DOAB](https://directory.doabooks.org/handle/20.500.12854/30579), CC BY-NC-ND |
| 27 | Hume, *A Treatise of Human Nature* | 2 | [Gutenberg](https://www.gutenberg.org/ebooks/4705) |
| 28 | Ord, *The Precipice* | 4 | SFPL Libby |
| 29 | Christian, *The Alignment Problem* | 4 | SFPL Libby, 7 copies / 8 holds. Perlego holds only UK rights |
| 30 | Hofstadter, *Gödel, Escher, Bach* | 8 | No ebook in any Libby checked. Used \$8.23 |

**Where the Popper estimate comes from.** Four of the 20 humanities titles were missing from every Bay Area Libby. One is Hacking. Perlego carries two of the other three and does not carry Hacking. Popper is one of Perlego's 8 US-rights titles in the set. If any of those 8 is equally likely to be among the missing, Popper is missing with probability 2/8. So the chance that a Bay Area Libby has it is about 75%. With LAPL added, every humanities title except Hacking was in some Libby, so Popper is covered.

**Coverage and cost by rung.**

| Rung | Titles added | Cumulative | Share | Cash spent | Time spent |
|---|---|---|---|---|---|
| 1. Open and author copies | 12 (+ Jaynes ch. 1–3) | 12 | 40% | \$0 | About 30 minutes of searching [inference] |
| 2. Public domain | 1 | 13 | 43% | \$0 | — |
| 3. Open Library lending | 5 | 18 | 60% | \$0 | Account setup; an edition check per book |
| 4. SFPL card | 8 | 26 | 87% | \$0 | One visit; Kahneman's holds queue |
| 4. Bay Area stack | Popper [~75%] | 26–27 | 87–90% | \$0 | Two afternoons |
| 4. LAPL | Popper (certain) | 27 | 90% | \$0 | A trip to LA |
| 5. Walk-in academic | Print stacks only (not checked) | 27 | 90% | \$0 | — |
| 6. One Perlego month | Popper, if you have neither the Bay Area cards nor LAPL | 27 | 90% | \$15–\$27 (tier not checked) | Minutes |
| 8. Buy used | Jaynes, AIMA, *Gödel, Escher, Bach* | 30 | 100% | \$111.37 | Days |

**Total: \$111–\$138 for all 30 titles.** If Link+ holds the three print books, the total falls to \$0–\$27; I did not check. For comparison, buying the whole list: the 12 titles priced on AbeBooks average \$44 (\$526.90 in total), so all 30 would cost on the order of \$1,000–\$1,300 [inference].

**The license view of the same list.** Only Hume is lane A, meaning redistributable. Two books are lane B (Murphy, *Moral Uncertainty*) and ten are lane C (gratis). So a personal tool can hold the full text of 13 of 30, or 16 if you scan the three print books you buy. The other 14 (lending, library, Perlego) can enter it only as metadata, a table of contents, your own notes and a deep link. For a Claude-powered reading tool, roughly half the list will be "ask the text" and half "ask the catalog and your notes".

## Cost against coverage

Read this table as a chart. Rows run up the ladder in order of cash spent; each cell is cumulative coverage for one sample.

| Step | Cumulative cash | Technical, R03 (n = 33) | Humanities, R03 (n = 20) | Worked example (n = 30) |
|---|---|---|---|---|
| Free routes (rungs 1–3) | \$0 | 11 (33%) | At least 2 (10%) via lending; free copies not checked | 18 (60%) |
| + SFPL card | \$0, one visit | 28 (85%) | 10 (50%) | 26 (87%) |
| + five more Bay Area cards | \$0, two afternoons | 28 (85%) | 16 (80%) | 26–27 |
| + LAPL | \$0, a trip to LA | 29 (88%) | 19 (95%) | 27 (90%) |
| + one Perlego month | \$15–\$27 | 29 (88%) | 19 (95%); 18 (90%) if you skipped LAPL | 27 (90%) |
| + buy the residue | Technical \$143; example \$111 | 33 (100%) | 19; Hacking not priced | 30 (100%) |

From the SFPL row down, the humanities column counts Libby and Perlego only; lending copies of Kuhn and Parfit and any free copies would add a little.

The shape is a step up at \$0, then a plateau. Almost all coverage arrives before any money is spent, most of it at the SFPL step. After that, money buys little:

| Purchase | Cost per additional title |
|---|---|
| One Perlego month, humanities, without LAPL | About \$13.50 |
| The technical residue, bought used | About \$36 |
| O'Reilly Individual, on top of an SFPL card | No new titles for \$499 |

## The minimal-cost bundle for a Bay Area researcher

**Tier 0: \$0, one evening and one visit.** This captures most of the measured coverage.

1. Learn the free routine: the author's book page, DOAB, then Gutenberg or HathiTrust for anything from 1930 or earlier ([Open-Access Books and Textbooks](/access/open-books/)).
2. Install [Unpaywall](https://unpaywall.org/) and use Google Scholar's "All versions" for papers.
3. Open an Internet Archive / Open Library account for the 1930–1989 classics.
4. Open a free JSTOR account, which gives 10 articles every 30 days, read online ([JSTOR](https://about.jstor.org/oa-and-free/)).
5. Get the SFPL card: apply online, then show photo ID at a branch. Activate O'Reilly. Add the card to Libby. From home, test whether the JSTOR link works.

**Tier 1: \$0, two afternoons and the occasional trip.**

- **The library cards.** The South Bay loop (Peninsula, San José, Santa Clara County) and the East Bay loop (Oakland, Berkeley) are planned in [Public Libraries](/access/public-libraries/). Add LAPL on your next trip to Los Angeles.
- **Print books.** Use Link+ before interlibrary loan.
- **Paywalled papers.** Batch them into walk-in visits: SF State's stations, UC Berkeley's public computers, Stanford's seven day passes.

**Tier 2: pay per project.**

- **Buy the residue used.** The samples left 10–12% of each list unreached at \$36–\$37 per title. For someone working through 30–60 such books a year, that is about \$110–\$260 [inference].
- **Subscription bursts:** a Perlego month (\$15–\$27) for a monograph-heavy humanities project, or a Springer+ Basic month (\$39.99 for 10 units) for a Springer-heavy one.
- **JPASS (\$199/yr)** only if you read a lot on JSTOR and the SFPL link fails.

**Tier 3: institutional, when the papers backlog justifies it.**

- **UC Berkeley Extension** (\$25 for six months, plus a course whose fee is unverified) if you would take a 10+ week course anyway.
- **Visiting-scholar status** (\$750 for the first year, plus a faculty sponsor) if you have a real collaborator.
- **An employer license,** if you have one, subject to its AI and TDM limits.

**What not to buy.**

- O'Reilly Individual, if you hold an SFPL card.
- Everand for technical reading: coverage is unmeasured, and you pay per unlock.
- A year of Perlego, unless most of your reading is Routledge, Cambridge or Princeton monographs.
- DeepDyve, unless you read many paywalled papers outside JSTOR and have no institution.

**Marginal value of each step**, in ladder order. Coverage columns show the increment on the R03 samples.

| Step | Marginal cash | Marginal time | Technical (n = 33) | Humanities (n = 20) | Papers | Verdict |
|---|---|---|---|---|---|---|
| Free routine (author pages, DOAB, Gutenberg, Unpaywall, Scholar) | \$0 | About 1 minute per title | 0 → 11, +1 partial | Not measured | 67% any version, 48% final | Always first |
| Open Library account | \$0 | 5 minutes, plus edition checks | +0 current editions | At least +2 | — | Essential for 1930–1989 classics (R01: 24 → 30 of 55) |
| SFPL card | \$0 | One ID visit | **+17 → 28** | **+10 → 10** | JSTOR link [~50% remote]; EBSCO, Gale | The single largest gain |
| South Bay and East Bay cards | \$0 | Two afternoons | +0 titles; more copies | +6 → 16 | Berkeley JSTOR link; walk-in physics journals | Worth it for humanities and holds |
| LAPL card | \$0 | A trip to LA | +1 (CLRS; \$16.25 used) | +3 → 19 | ProQuest Central, OECD, HeinOnline (remote use not checked) | Only when already in LA |
| Walk-in academic | \$0 (cards \$50–\$450) | Half a day per visit [inference] | Not measured | Not measured | Final versions: 72% vs 48% free | Batch paywalled papers |
| Perlego month | \$15–\$27 | Minutes | +0 | +2 if you skipped LAPL | — | Humanities project bursts |
| JPASS | \$199/yr | Minutes | — | — | 120 PDFs at \$1.66 | Only if JSTOR-heavy and SFPL's link fails |
| Extension card | \$25 per 6 months + course | A 10+ week course | Not measured | Not measured | Full UC Berkeley e-collections | Best value if you would take the course anyway |
| Visiting scholar | \$750/yr + sponsor | Weeks to months | Not measured | Not measured | Full remote access | Only with a real collaboration |
| Buy the residue | \$8–\$70 per title | Days | +4 → 33 (\$143 with LAPL) | Hacking (unpriced) | Pay-per-view \$29.95–\$39.95 | For the last few titles |

## For tool builders: the ladder as a resolver

A resolver takes two inputs: the work and the reader's access profile (cards, accounts, affiliations, subscriptions). It returns the lowest rung that covers the work. That is the design in [A Reference Architecture](/building/reference-architecture/). The ladder also decides what the tool may hold:

| Rung | Availability data a tool can use | Full text in a personal tool | Full text in a shared tool |
|---|---|---|---|
| 1. Open and author copies | DOAB/OAPEN CSV exports; OpenAlex (CC0); a hand-kept registry of author pages | Lanes A–C | Lane A; lane B for non-commercial use only; lane C link only |
| 2. Public domain | Gutenberg catalog CSV; Hathifiles | Yes | Yes |
| 3. Lending | Open Library `ebook_access`, resolved to the edition | No | No |
| 4. Library cards | OverDrive catalog API (undocumented); O'Reilly sitemap | No | No |
| 5. Walk-in | Visit lists only | Rarely; the database's terms govern [inference] | No |
| 6. Subscriptions | O'Reilly sitemap; Perlego public index | No | No; personal licenses cannot be pooled |
| 7. Institutional | Through the institution | Only under a TDM license | No |
| 8. Bought | Retail and used-book listings | Print you scanned: green/yellow; DRM ebooks: do not break | Page numbers and hit counts only |

The rules behind the table are in [The Legal Map](/building/legal-map/). In short, provenance drives liability: in *Bartz v. Anthropic*, the \$1.5B settlement came from how the books were acquired, not from training on them.

## Open questions

- **Does SFPL's JSTOR link work from home?** Any cardholder can test it in five minutes. The current estimate is [~50%]. The answer decides whether JPASS ever makes sense for a Bay Area reader.
- **Does O'Reilly for Public Libraries carry the full book catalog,** and do the membership agreement's AI clauses bind library patrons? Estimates: [~70%] and [~75%]. Sample 200 sitemap ISBNs through a library login, and find the library-edition terms.
- **What does the cheapest qualifying UC Berkeley Extension course cost,** and do "Start Anytime" online courses count as 10+ week courses for the \$25 card? Ask Extension or the library, or price a course in the catalog by hand.
- **Do Extension cardholders or visiting scholars qualify for publisher TDM programs** (Springer Nature, Elsevier) as researchers at a subscribing academic institution?
- **How much of the residue sits in rungs 4 (Link+), 5 and 7?** Check Jaynes, AIMA, CS:APP, *Gödel, Escher, Bach* and Hacking against the Link+ catalog and UC Berkeley's e-collections.
- **Lending status for the R03-only titles.** Fourteen technical and fifteen humanities titles were never checked against Open Library at edition level.
- **Replace the fame-biased samples.** Draw about 300 titles at random from public syllabi and run the whole ladder on them. That would give a coverage curve with honest error bars for each field.
- **How fast is the ladder decaying?** LAPL's e-card restriction and Orlando's fee-card closure happened within a few years; neither could be dated precisely. Keep a registry of routes with last-verified dates and measure closures per year.

## Related pages

- [What to Do First](/start-here/decision-guide/): the short decision guide built on this ladder
- [Open-Access Books and Textbooks](/access/open-books/): rung 1 for books, and the 55-book test
- [The Public Domain and Open Corpora](/access/public-domain/): rung 2
- [Open Papers and Preprints](/access/open-papers/): the paper workflow in eight steps
- [Public Libraries](/access/public-libraries/): rung 4 in detail, with a one-afternoon card plan
- [University and Employer Access](/access/academic-and-employer/): rungs 5 and 7
- [Cheap Subscriptions](/access/subscriptions/): rung 6
- [The Shadow Libraries](/access/shadow-libraries/): why they are not a rung
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): building the reading list you route here
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the catalog layer that holds the access rows
- [The Legal Map](/building/legal-map/): what a tool may index at each rung
- [A Reference Architecture](/building/reference-architecture/): the best-free-copy resolver
- [Costs and Effort](/building/costs-and-effort/): build costs, kept separate from content costs
- [Directory of Sources and Tools](/reference/directory/)
