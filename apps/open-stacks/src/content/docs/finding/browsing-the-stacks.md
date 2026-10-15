---
title: Browsing the Stacks
description: Why shelf browsing works (borrowing data show a 9- to 22-fold neighbour effect), what Library of Congress shelf order gives a reader and what it scatters, what happened to virtual shelf browsers from Harvard's StackLife to Open Library Explorer, and how to build a digital stacks browser with multiple placements, semantic "wormholes", access badges and LLM-assisted reclassification.
---

*Status: draft, October 2026. Product statuses, Open Library counts and Claude prices are as of 2026-10-15. The Open Library tables, counts and examples are our own API queries, re-run during fact-checking; they inherit Open Library's cataloguing errors, and the multi-placement sample is not random. Open Library dump-level counts (total works, table-of-contents and cover coverage) come from R05 and were not independently reproduced. Two 2026 preprints (Awad; Veenstra & Munoz Arias) are not peer reviewed. Sources: the [R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md), the [R06 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R06-infovis-and-interaction-research.md), and primary sources linked inline.*

A library shelf is a recommender system that catalogers built by hand: each book sits next to the books most like it, in an order kept stable for decades. It works. In 2007–08 borrowing data from Ohio academic libraries, a book was 9.5 to 21.7 times as likely to be borrowed on a day when a shelf neighbour was borrowed as on the day before. Online, the shelf has mostly been lost: digital library interfaces show 10 to 25 items at a time, which one study calls a "keyhole view", and the virtual shelf browsers built to fix this have mostly died or shrunk into small catalog widgets. This chapter covers what the shelf does, how much of it a call-number-ordered virtual stack can rebuild, and how to build one now that classification data is free and LLMs can fill its gaps.

## The short version

- **Shelf adjacency measurably drives discovery.** In 2007–08 OhioLINK circulation data, a neighbour's loan raised a book's chance of being borrowed that day "at least 9-fold" ([McKay, Smith & Chang 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658)). The authors propose 9× as the bar a virtual browser should match. We found no virtual browser that has published a comparable figure.
- **Use Library of Congress Classification (LCC) as the spine.** The Library of Congress (LoC) gives LCC away; Dewey belongs to OCLC. Open Library alone has about 14.7M works with an LCC number (R05's live API count, 2026-10-15). That is enough for a 15M-work virtual shelf without touching WorldCat.
- **One shelf order scatters a forecaster's library.** We looked up 27 canonical books on probability, forecasting, judgment and AI in Open Library. They sit in 12 LCC subclasses across 5 main classes, from QA273 (probability) to CB158 ("Forecasts of future progress") to BF441 (cognition). A single order cannot keep them together. Multiple placements and cross-links can.
- **Standalone virtual-shelf apps died; shelf browsing inside catalogs survives.** Harvard's StackLife (launched 2013) no longer resolves in DNS. Open Library Explorer (beta since December 2020) is still linked. Stanford SearchWorks, Ex Libris Primo and a University of Michigan widget (2024) offer call-number browsing inside the catalog, showing 1 to about 50 items at a time.
- **What a virtual stack loses:** scanning hundreds of spines in seconds, finds made in passing between aisles, handling the book, and the filter of a library's purchasing. **What it gains:** it can show every placement, every library, checked-out books, and several orderings at once.
- **If you build one:** shelve each work wherever any edition was classed. Add "wormholes" to works that are close in meaning but far on the shelf. Mark each spine with whether you can read it tonight. Log impressions so you can measure neighbour uptake. Use LLMs to *add* placements for unclassed and interdisciplinary works, never to overwrite cataloger numbers, and validate them against held-out LCC numbers first.

## Why physical shelves work

### Classification as a map

LCC divides knowledge into 21 main classes (A–H, J–N, P–V, Z) and about 220 subclasses, such as QA (Mathematics) or BF (Psychology). The [LC Classification Outline](https://www.loc.gov/aba/cataloging/classification/lcco/) is the top layer. Our parse of the outline PDFs (`lcc-outline.json`, used by this wiki's prototypes) has 221 subclasses and 6,566 captioned ranges. The full schedules go much deeper. They are free as PDFs, with data "selected in May 2024" ([Free LCC](https://www.loc.gov/aba/publications/FreeLCC/freelcc.html)).

Take the outline row **QA273–280 Probabilities. Mathematical statistics**. Its trail is Q Science › QA Mathematics › QA273–280. The 2024 Q schedule ([PDF](https://www.loc.gov/aba/publications/FreeLCC/LCC_Q2024TEXT.pdf)) breaks it down as follows. The counts are Open Library works carrying each number, from live queries on 2026-10-15. A work with several numbers is counted under each.

| Call number | Caption in the LC schedule (2024) | Open Library works |
|---|---|---|
| QA269–272.6 | Game theory (just before the range, under Algebra) | — |
| QA273 | Probabilities: general works, axioms and foundations (273.4), distributions (273.6), limit theorems (273.67) | 4,746 |
| QA274 | Stochastic processes: martingales (274.5), learning models (274.6), Markov chains (274.7), random walks (274.73), diffusion (274.75), queuing theory (274.8) | 1,974 |
| QA275 | Theory of errors. Least squares | 232 |
| QA276 | Mathematical statistics: general works, statistics software (R at 276.45.R3), sampling (276.6), estimation (276.8), minimum description length (276.9) | 5,500 |
| QA277 | Testing of hypotheses | 175 |
| QA278 | Multivariate analysis: regression (278.2), structural equation models (278.3), cluster analysis (278.55); order statistics (278.7), nonparametric methods (278.8) | 1,855 |
| QA279 | Analysis of variance and experimental design; prediction analysis (279.2); decision theory (279.4–279.7), including **Bayesian statistics (279.5)** | 1,264 (326 at QA279.5) |
| QA280 | Time series analysis | 390 |

That is about 16,100 work-placements in one outline row. Three features of this map matter for interface design:

1. **The hierarchy is a ready-made overview.** Class › subclass › outline range › schedule caption gives four levels of labels written by experts. No clustering is needed.
2. **The schedule contains its own cross-references.** Under "Probabilities" it says "Cf. T57.3+ Industrial engineering" and "Cf. TA340 Engineering mathematics". Under stochastic processes it points to renewal theory and queuing theory in T57. These are wormholes the catalogers already drew. A virtual shelf can render them as links; a physical one cannot.
3. **The last step of the order is alphabetical.** Within a class number, books are ordered by a Cutter number from the author's surname or the title. In Open Library's QA273 sequence, E. T. Jaynes's *Probability Theory: The Logic of Science* (QA273.J36) sits among a 1968 monograph on priority queues (QA273.J3), a 2015 monograph on Banach-space random variables (QA273.J34), a 1954 distribution model for economics (QA273.J43) and a 1972 Spanish statistics text (QA273.J44). They are neighbours because the authors' names start with J. *Bayesian Data Analysis* is shelved under its title, at QA279.5.B386, among other books whose titles begin "Bayesian": a volume of the *Bayesian Statistics* conference proceedings, a book on fault diagnosis, one on forensic networks.

**DDC vs LCC.** Dewey is owned by OCLC, which sells Dewey services. OCLC's free ISBN-to-class lookup, Classify, is retired; its URL now leads to a "page not found" (R05, checked 2026-10-15). LCC and LC Subject Headings are free from LoC, including bulk linked data at [id.loc.gov](https://id.loc.gov/download/), which calls itself a "public domain data set" ([About](https://id.loc.gov/about/)). Open Library has 5.86M works with a DDC number, against about 14.7M with LCC (live API, 2026-10-15). McKay et al. tested whether either scheme supports browsing better. They found a difference driven mostly by one library (Oberlin), and it was not significant once that library was excluded (p = 0.10). For an open tool, use LCC [~90%].

### The neighbour effect: evidence that adjacency drives discovery

| Study | Setting and sample | Finding | Design lever |
|---|---|---|---|
| [McKay, Smith & Chang 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658) (JCDL; [DOI](https://doi.org/10.1109/jcdl.2014.6970161)) | OCLC's OhioLINK circulation data, 2007–08; seven collections in six academic libraries (three mainly LCC, three mainly Dewey); each book compared with its five neighbours on each side | In the paired test, books were 9.5 to 21.7 times as likely to be loaned on the day a neighbour was loaned as on the day before, across collections. Comparisons with random ten-book samples gave larger ratios. Because the paired test compares the same books on two days, the effect cannot be explained by a topic being popular that day | Adjacency is worth building. 9× is the bar |
| [Hinze et al. 2012](https://doi.org/10.1145/2232817.2232874) (JCDL; [open copy](https://researchcommons.waikato.ac.nz/bitstreams/3876091c-69d5-44ff-b3e7-2a23aedd4fa6/download)) | 65 readers at three academic and government libraries, 51 observed at the shelves | 34 of 51 had searched the catalogue before entering the stacks. Only 10 explicitly read spines, and 31 took a book fully off the shelf. Readers judged books by table of contents, back cover, index and flicking through. Several found books by scanning shelves next to their target. In digital libraries, the ability "to scan hundreds of books on a physical shelf in seconds has been reduced to slowly limping from one keyhole view to another" | Bandwidth and fast triage, not just order |
| [Björneborn 2008](https://informationr.net/ir/13-4/paper370.html) (*Information Research*) | Two Danish public libraries, 10 months in 2006; 113 interviews | About half the users (51% and 48%) found material only by goal-directed search. About 40% added unplanned finds to a planned one, and 10–12% found things only by exploring. Ten "serendipity dimensions" (below) | Serve both modes on one screen |
| [Björneborn 2017](http://www.emerald.com/jd/article/73/5/1053-1081/198223) (*J. Documentation*) | Conceptual synthesis | Three affordances: diversifiability, traversability, sensoriability. Serendipity can be afforded, not engineered | Digital wins on traversability, loses on sensory cues |
| [Bates 1989](https://pages.gseis.ucla.edu/faculty/bates/berrypicking.html) | Theory of search strategies | Area scanning is "the quintessential form of browsing in manual environments" and one of six moves searchers combine | Make "scan the shelf" one move among several |

Three caveats on McKay et al. First, the large ratios sit on tiny base rates. Only 8–18% of books in these collections were borrowed even once in 2007–08, and the φ coefficients were small (mostly about 0.11). Second, the authors argue that the study *underestimates* browsing. They could see only left and right neighbours, not the shelves above and below. They could not separate renewals from new loans or tell which books were on the shelf that day. And a loan log records only browsing that ends in a loan. Third, the study shows that people took the neighbours, not that the neighbours were good finds.

Björneborn's ten dimensions are the most useful design checklist in this literature. Here they are mapped onto a screen:

| Dimension (Björneborn 2008) | In the physical library | Digital equivalent |
|---|---|---|
| Unhampered access | Open stacks, nothing behind counters | No login wall; works visible even if not readable |
| Diversity | Many topics in a small space | Whole-catalog scope, not a personalised slice |
| Display | Cover-out books on tilted shelves | Faced-out "front table" picks among the spines |
| Contrasts | Lighting, colour, varied displays | Visual variety; differently styled curated items |
| Pointers | Signs, shelf icons, cross-references | Outline labels, schedule "Cf." links |
| Imperfection | Misshelved books, books left on tables | Secondary and machine-proposed placements, labelled as such |
| Cross contacts | "Moving just a few steps across a gangway may take the user topically far" | Wormholes to shelf-far, meaning-near works |
| Multi-reachability | Many routes to the same item | A work reachable from every class it was ever given |
| Explorability | Layout invites side trips | Scrolling in both directions; cheap jumps |
| Stopability | Seats near shelves, room to put things down | One-click basket; preview without leaving the shelf |

### Bookstore tables: curation as a filter

Bookstores show the other half of the shelf's appeal: the small, opinionated table.

- **Independent bookstores recovered.** US independents grew from 1,651 in 2009 to 2,227 in 2015 (ABA figures via [Wikipedia](https://en.wikipedia.org/wiki/Independent_bookstore)) [secondary]. The ABA counted about 605 new independent stores in 2025, up 87% on 2024 (reported by [Fortune, 2026-08-03](https://fortune.com/2026/08/03/barnes-noble-ceo-james-daunt-indie-bookstore-revive-big-box-chain/)) [secondary].
- **The peer-reviewed account is about place, not lists.** Raffaelli & Noe ([*Administrative Science Quarterly*, 2025](https://doi.org/10.1177/00018392251333696)) studied US independent bookselling from 1995 to 2019. They attribute its resilience against Amazon to "organizational emplacement": "architecting the physical environment, anchoring to the local community, and sanctifying the meaning of place". The abstract does not mention curation. Wikipedia says an earlier Harvard Business School study by Raffaelli credited the buy-local movement, "curation of interesting titles" and community events [secondary].
- **Barnes & Noble moved table decisions to stores.** Under James Daunt (CEO since 2019), B&N dropped "co-op advertising", in which publishers gave discounts in exchange for prime placement. Daunt: "We abandoned [co-op advertising] 100% so now each store curates its own assortment." B&N has more than 700 stores and opened 50 "this past year" (Fortune, 2026-08-03). It is private and discloses no financials, so there is no way to test whether store-level curation caused the recovery.

For years the chain-store front table was partly paid advertising, and the evidence that curated tables improve discovery is observational and confounded with everything else these stores changed. Our reading of why they work [inference, ~70%]: a table is a **small** filter (30 books, not 30,000), it is **explained** (a handwritten shelf-talker), and it is **cross-category** by construction, which supplies Björneborn's contrasts and cross contacts. For an interface, copy the unit: a dozen books with a stated reason each, not an infinite ranked list.

## The forecaster's shelf: what one classification scatters

LCC is a single linear order, so every book gets one primary home. For a researcher whose interests cut across disciplines, that home is often somewhere unexpected. We looked up 27 books a forecasting- or AI-minded reader might want on one shelf, using Open Library's search API on 2026-10-15. The table shows the most common LCC on each work record, other numbers carried by its editions, and the outline range.

| Book | Main LCC (Open Library) | Outline range | Other placements on record |
|---|---|---|---|
| Jaynes, *Probability Theory: The Logic of Science* | QA273 | QA273–280 Probabilities. Mathematical statistics | DDC 519.2 |
| de Finetti, *Theory of Probability* | QA273 | same | |
| Hacking, *The Emergence of Probability* | QA273 | same | QA279 on one record (probably a cataloguing error) |
| Gelman et al., *Bayesian Data Analysis* | QA279.5 | same (schedule: Bayesian statistics) | QA76 on one edition |
| McElreath, *Statistical Rethinking* | QA279.5 | same | |
| von Neumann & Morgenstern, *Theory of Games and Economic Behavior* | QA269 | QA150–272.5 Algebra (schedule: Game theory) | HB99 |
| Savage, *The Foundations of Statistics* | HA29 | HA29–32 Theory and method of social science statistics | |
| Keynes, *A Treatise on Probability* | BC141 | BC1–199 Logic | DDC 160 and 519.2 |
| Knight, *Risk, Uncertainty and Profit* | HB601 | HB601 Profit | |
| Raiffa, *Decision Analysis* | HD69.D4 | HD28–70 Management | |
| Bernstein, *Against the Gods* | HD61 | HD61 Risk in industry. Risk management | |
| Kahneman, Slovic & Tversky (eds.), *Judgment under Uncertainty* | BF441 | BF309–499 Consciousness. Cognition | |
| Kahneman, *Thinking, Fast and Slow* | BF441 | same | BF448 |
| Galef, *The Scout Mindset* | BF311 | same | HD30.23 |
| Tetlock, *Expert Political Judgment* | JA74.5 | JA71–80 Theory. Relations to other subjects | |
| Tetlock & Gardner, *Superforecasting* | HB3730 | HB3711–3840 Business cycles. Economic fluctuations | CB158 |
| Silver, *The Signal and the Noise* | CB158 | CB158–161 Forecasts of future progress | DDC 303.49 and 519.542 |
| Pearl, *Probabilistic Reasoning in Intelligent Systems* | Q335 | Q300–390 Cybernetics (schedule: Artificial intelligence) | |
| Russell & Norvig, *Artificial Intelligence: A Modern Approach* | Q335 | same | |
| Bostrom, *Superintelligence* | Q335 | same | |
| Hastie, Tibshirani & Friedman, *The Elements of Statistical Learning* | Q325.75 | same (schedule: Supervised learning) | |
| MacKay, *Information Theory, Inference, and Learning Algorithms* | Q360 | Q350–390 Information theory | |
| Taleb, *The Black Swan* | Q375 | same (schedule: Uncertainty theory) | |
| Pearl, *Causality* | BD541 | BD493–701 Cosmology | |
| Pearl & Mackenzie, *The Book of Why* | Q175.32.C38 | Q1–295 General (schedule: special topics, Causation) | BD541 |
| Hubbard, *How to Measure Anything* | HF5681.I55 | HF5601–5689 Accounting | |
| Ord, *The Precipice* | HM901 | HM831–901 Social change | |

That is **12 subclasses in 5 main classes** (B, C, H, J, Q). Four patterns matter before building anything:

- **Statistics is split by audience, not method.** Mathematical statistics lives in QA276, "theory and method of social science statistics" in HA29, where Savage's *Foundations* sits. Machine learning sits under Q "Cybernetics" (Q325.5–325.787), not next to statistics in QA.
- **"Forecasting" has no home.** It appears as CB158 (forecasts of future progress, under History of Civilization), HB3730 (within business cycles and economic fluctuations), QC994.95–999 (weather forecasting) and, in the same subclass as Kahneman's BF441, BF1845–1891 (fortune-telling).
- **One author's work splits by framing.** Pearl's *Causality* is in speculative philosophy (BD541). *The Book of Why* is in general science (Q175.32.C38), with BD541 on some editions.
- **Catalogers already disagree, and the disagreement is useful.** *Superforecasting* carries both HB3730 and CB158; *Thinking, Fast and Slow* both BF441 and BF448. Each extra number is a second shelf the book could live on.

How common are multiple numbers? We took the first 1,000 works Open Library returned for each of QA273, QA274, QA276, QA278 and QA279 (4,814 distinct works, in Open Library's default order; not a random sample). **9.3% carried LCC numbers in more than one subclass, 21.6% carried more than one integer class number, and 14.1% carried at least one number outside QA273–280.** Among works with five or more editions, 14.7% spanned two or more subclasses. The most common other homes were HA (social-science statistics), QH (biology), Q, QC (physics, including meteorology), HF and T. Open Library's `lcc_sort` field picks one of these values, sometimes a malformed one (R05 found a record sorted under "AA-0007"). A browser that trusts `lcc_sort` throws the extra placements away.

## Virtual shelf browsers and what happened to them

| System | Years | What it did | Scale | Status, October 2026 |
|---|---|---|---|---|
| **Harvard StackLife**, with the StackView plugin and the LibraryCloud metadata API | Launched 2013 ([Harvard Gazette, 2013-05-09](https://news.harvard.edu/gazette/story/newsplus/stacklife-visually-browse-millions-of-harvard-library-materials/)); code from 2012 ([GitHub](https://github.com/harvard-lil/stacklife)) | Scrollable stack of spines across all of Harvard's libraries. Spine height showed the volume's real height, thickness its page count, and colour its "StackScore", "a measure of how often that work has been used by the Harvard community" | "12.3 million items in Harvard's 73 libraries" (2013) | `stacklife.harvard.edu` does not resolve in DNS (checked 2026-10-15). The LibraryCloud item API returns HTTP 403 to scripts. Harvard still publishes 12.7M bibliographic records as **CC0** MARC ([Harvard Library](https://library.harvard.edu/services-tools/harvard-library-apis-datasets)) |
| **Stanford SearchWorks "Browse related items"** | Built on Blacklight and Solr; described at [Code4Lib 2010](https://code4lib.org/conference/2010/dushay_keck2) | Call-number-ordered list (about 50 items a page) with previous/next shelf paging, covering "digital or physical materials", with explicit handling of "multiple call numbers for a single bib record" | Stanford holdings | [Live](https://searchworks.stanford.edu/browse) (HTTP 200, 2026-10-15). Scripted catalog searches hit an F5 bot challenge |
| **NCSU Virtual Shelf Index** | Completed May 2011 ([NCSU](https://www.lib.ncsu.edu/projects/virtual-shelf-index)) | Web service returning titles "in shelf order"; a "Browse Shelf" link on catalog records | NCSU holdings | Project page still up; current use unknown |
| **Open Library Explorer** | Beta since December 2020 ([OL blog](https://blog.openlibrary.org/2020/12/16/introducing-the-open-library-explorer/)) | Tall shelves scrolling across classes and down into subclasses; Dewey/LCC toggle; filters (e.g. ebooks only); 3D modes where "each book has the correct thickness determined by its actual number of pages" | Open Library's classed works | Still in Open Library's navigation. Scripted fetches get a "Human Verification" page (2026-10-15). Whether it is still labelled beta, or maintained, is unverified |
| **Ex Libris Primo "Virtual Shelf"** | Feature of a commercial discovery layer | Call-number neighbours on the record page; browse "up to 100 items to the left and right". When a record has several call numbers, "Primo will choose the call number according to the order defined with the Browse Lists mapping table" ([Ex Libris docs](https://knowledge.exlibrisgroup.com/Primo/Product_Documentation/Primo/Technical_Guide/010The_PNX_Record/150The_Browse_Section/020Virtual_Shelf_Tab)) | One institution's holdings | Common in academic libraries [deployment share unverified] |
| **University of Michigan "What's nearby on the shelf"** | August 2024 ([UM Library Tech Talk](https://blogs.lib.umich.edu/library-tech-talk/what%E2%80%99s-nearby-shelf-visual-shelf-browse-widget)) | Cards (title, author, year, call number) on the full record page: 5, 3 or 1 per page depending on screen, up to 20 items left or right; LC and Dewey items only; no covers, although users asked for them | Michigan holdings | Launched 2024; we found no published usage figures |
| **The Online Books Page** (Penn) | Long-running | LC call-number "virtual shelves" of free online books; each book has one call number, so it appears in one place | Free online books | [Live](https://onlinebooks.library.upenn.edu/subjects.html) |
| **Blended Shelf** (Konstanz) | [CHI 2013 extended abstract](https://doi.org/10.1145/2468356.2468458) | Research prototype for "reality-based" shelf exploration | Prototype | Historical |

Four lessons:

1. **Standalone apps die; catalog features survive** [inference, ~70%]. StackLife was a separate application on its own metadata API, and it is gone. Shelf browsing that is part of a maintained discovery system persists, and Michigan was still adding it in 2024. For a builder: make the shelf a *view* over a durable catalog, not a separate product.
2. **Windows are small and single-library.** Current widgets show 1 to about 50 items at a time over one institution's holdings, and stop 20 (Michigan) or 100 (Primo) items from the record. Most place each record once; Stanford, which handles several call numbers per record, is the exception.
3. **Nobody publishes whether it works.** We found no published neighbour-uptake figure for any virtual shelf. A 2026 preprint reviewing ebook-collection assessment states that "no standard library metric records an item impression", so non-use cannot be told apart from never being seen, and a neighbour effect cannot be computed ([Veenstra & Munoz Arias 2026](https://arxiv.org/abs/2608.26308), not peer reviewed).
4. **Skeuomorphism is not evidence.** Realistic spines and 3D aisles demo well. In the interface research, 3D document spaces gave no retrieval benefit, and users still *preferred* them. 2D was slightly faster in 2001 (not significant) and 3D slower in 2002 (marginal, p = .09) ([Cockburn & McKenzie 2001](http://www.cosc.canterbury.ac.nz/andrew.cockburn/papers/chi01DM.pdf), [2002](http://www.cosc.canterbury.ac.nz/~andy/papers/chi02DM.pdf); see [Maps of Knowledge](/interfaces/maps-of-knowledge/)). Spine *thickness* as a 2D encoding of page count is useful. The third dimension is not.

**If you want to browse a shelf today:** use SearchWorks' "Browse related items" for a major research collection (no login needed), or Open Library Explorer for Open Library's catalog. For any LCC range, the Open Library API returns shelf order directly, e.g. [`search.json?q=lcc:QA-0279.50000000*&sort=lcc_sort`](https://openlibrary.org/search.json?q=lcc:QA-0279.50000000*&sort=lcc_sort&fields=title,author_name,lcc_sort,ebook_access&limit=100) for Bayesian statistics. Identify your client in the User-Agent and stay under 3 requests per second ([OL API](https://openlibrary.org/developers/api)).

## What a call-number stack can and cannot replicate

| Property of the physical stack | Can a virtual stack replicate it? | Evidence | What closes the gap |
|---|---|---|---|
| **Stable, expert adjacency** | Yes, exactly: same LCC numbers | McKay et al.'s effect is an adjacency effect | Keep the order stable across sessions so spatial memory builds (R06: Data Mountain) |
| **Context around a known item** | Yes; every implementation does this | 34 of 51 readers in Hinze et al. searched the catalogue before entering the stacks | Open the shelf *at* the search hit, not on a separate page |
| **Bandwidth: hundreds of spines in seconds** | Partly. Widgets show 1–50 items | Hinze et al.'s "keyhole view" | Dense spine walls with legible titles at full width, plus an outline minimap (overview+detail) |
| **Cross contacts and finds in passing** | Poorly. A list has two directions; a library has aisles, end caps, displays and trolleys | Björneborn: "a few steps across a gangway"; Hinze: 3 of the 4 readers who found books in passing were walking to or from the washroom | Wormholes and a front table: deliberate cross-class jumps |
| **Sensory triage: cover, heft, contents, flicking** | Partly, and limited by data | R05: only ~2.5% of Open Library editions have a table of contents and ~23% a cover (dump count, not independently reproduced) | Hover cards with table of contents, search-inside snippets and page-level term counts (see [Searching Inside Books](/finding/searching-inside-books/)) |
| **Social traces** (books left on tables, worn spines) | Only with usage data | StackLife's StackScore used Harvard's own usage; open usage data is scarce (Open Library reading logs, monthly) | Your own reading history and lists; licensed co-assignment data |
| **The collection filter** (a selector bought this) | No. A union catalog has no selector | Jaynes's 20 nearest shelf neighbours in Open Library include an apparent duplicate record of a 1968 queuing monograph and works in seven languages (2026-10-15) | Filter to a real library's holdings (Harvard CC0 MARC, HathiTrust), to syllabus-assigned works, or to readable-now |
| **Showing what is absent** | Better than physical | Physical shelves hide checked-out books, which are often the popular ones [inference]; McKay et al. could not tell which books were on the shelf | Show every holding, including remote storage and ebooks |
| **Several orders at once** | Better than physical | — | Re-sort by year, by access or by semantic order, with LCC as the stable default |
| **Immediate access** | Usually not | Of the 30 QA279.5 works around *Bayesian Data Analysis* in shelf order, Open Library could lend 3; 2, including *Bayesian Data Analysis* itself, were print-disabled only; 22 had no ebook; 3 had no access status (2026-10-15) | An access badge on every spine and routing to the best legal copy ([The Access Ladder](/access/access-ladder/)) |

The last row is why this wiki separates catalog from content. A virtual shelf can show all of QA279.5 but let you read very little of it in place. A shelf that does not say where each book can be read sends the reader down attractive dead ends.

## Design implications for a digital stacks browser

These follow from the evidence above and from R06's interface findings. Each says what to build and what stands in the way.

1. **Build the spine from LCC, with multiple placements.**
   - *Data:* Open Library dumps (edition-level `lc_classifications`, on about a third of editions by R05's count, not independently reproduced), Harvard's 12.7M CC0 MARC records, and LoC's ~25M MARC records from the 2016 retrospective set (stale for newer books). The [Reference Architecture](/building/reference-architecture/) covers ingestion.
   - *Rule:* shelve a work on every shelf where any edition was classed. Give each placement a provenance: LoC, another library, Open Library or machine-proposed. Put works with no number on an "unshelved cart" rather than hiding them.
   - *Obstacle:* malformed and conflicting numbers. Normalize to Open Library's padded form (`QA-0279.50000000.B386 2003`) and reject values that do not parse against the schedule.
2. **Give an overview that never distorts.** Use the outline as a minimap: 21 classes, 221 subclasses, 6,566 ranges, each shaded by how many works it holds and how many you can read. Clicking jumps the shelf. This is overview+detail: in Hornbæk & Frøkjær's study, 19 of 20 readers preferred an overview+detail reader to linear and fisheye versions (via [Hearst 2009](http://searchuserinterfaces.com/book/sui_ch10_visualization.html)). Stay in 2D.
3. **Raise bandwidth with dense spines and hover cards.** Encode page count as thickness, access as colour and year as a label. On hover, show the table of contents, a two-line gist and search-inside hits. In Wikipedia's Page Previews A/B tests, hover cards raised distinct pages engaged per session by 20–22%, and about 0.01% of sessions turned them off ([Wikimedia, 2017–18](https://www.mediawiki.org/wiki/Page_Previews/2017-18_A/B_Tests)).
4. **Add wormholes, but keep the order fixed.** For each work, show the three nearest neighbours *in meaning* that sit in a different main class.
   - *Data:* LoC's experimental embeddings: 1024-dimension Amazon Titan Text Embeddings V2 vectors of LoC bibliographic records, about 190 GB across 22 files, an estimated 19–20M records (R05; [id.loc.gov](https://id.loc.gov/download/)). They are probably public domain like the rest of id.loc.gov [~75%]. Which fields were embedded is undocumented.
   - *Other edge types:* the schedule's own "Cf." references, and syllabus co-assignment from [Open Syllabus](https://www.opensyllabus.org/) (free tier capped at 2019 data; see [Curation](/finding/curation/)).
   - *Obstacle:* to put works LoC did not catalog into the same space, you must embed them with the same model or re-embed everything [inference].
5. **Put a front table at the head of each aisle.** Twelve books chosen across classes, each with a stated reason and an access badge. One slot goes to a wildcard from a distant class with a semantic bridge to the rest. Disclose what put each book there, and never sell placement. Hearst's evidence on clusters argues for small sets: users rated 20 and especially 40 groups "too many", and her summary is "fewer is better".
6. **Route every spine to a copy.** A badge for free full text, borrowable, library holding, search-only or purchase, from the resolver described in the [Reference Architecture](/building/reference-architecture/). On a shelf where most books have no scan, this is the difference between serendipity and frustration.
7. **Measure neighbour uptake.** Log impressions (which spines were on screen) and opens. Compute how much more likely a user is to open a neighbour of a book they just opened than a random visible book. Then A/B test LCC order against a semantic order on the same data. Nobody has published this comparison (R05); it is publishable research and a direct design test. Compare with McKay et al.'s 9× only loosely: an open costs far less than a loan, so the ratios may differ for reasons unrelated to adjacency [inference].

### LLM-based reclassification

LLMs can do four distinct jobs on a shelf, with different risks.

| Job | Example | Risk | Recommendation |
|---|---|---|---|
| **Fill gaps** | Propose LCC for the roughly 27M Open Library works without one (41.7M works in the September 2026 dump, a count not independently reproduced, minus about 14.7M with LCC) | Many unclassed works have only a title; Open Library has descriptions for under 5% of works (R05 dump count, not independently reproduced) | Do it, with retrieval and a confidence threshold; leave low-confidence works on the cart |
| **Add secondary placements** | Put *The Signal and the Noise* on QA279.2 (prediction analysis) as well as CB158 | Shelf bloat; diluted adjacency | Cap at two or three extra placements per work, visibly marked |
| **Personal schedules** | Re-shelve your own 2,000 books under headings you define ("scoring rules", "track records", "institutions") | Label drift between runs | Fix the schema first, classify siblings together, keep "Back to LC" one click away |
| **Learned shelf orders** | Fit a new hierarchy to an embedding space while keeping classes contiguous on one shelf | Circularity if fitted and scored on the same embedding | Treat as research |

**The evidence on accuracy is indirect.** No study we found measures LLM accuracy at assigning full LCC numbers. The nearest results:

- **Before LLMs**, automated category assignment was "about 75% correct on average" ([Hearst 2009, ch. 8](http://searchuserinterfaces.com/book/sui_ch8_navigation_and_search.html), citing Sebastiani 2002).
- **OpenAlex topics, October 2026.** OpenAlex now assigns its 4,516 topics with a fine-tuned Qwen3-8B, trained on 2M works labelled by Claude Opus 5.5. It is right 94.5% of the time on the ~64% of works where it is at least 90% confident. Its primary topic matched two AI judges' blind choices 81.7% of the time, and about 10% of works get no topic ([OpenAlex Topics](https://help.openalex.org/hc/en-us/articles/24736129405719-Topics); R06). This is topics for papers from title and abstract, an easier task than call numbers for books.
- **SemEval-2025 LLMs4Subjects.** Systems assigned German GND subject headings to records from the catalog of TIB, Germany's national library for science and technology ([D'Souza et al. 2025](https://arxiv.org/abs/2504.07199)). Records carry about five librarian-assigned subjects; the best systems recovered about half in their top five (recall@5 of 0.49). TIB's subject specialists, reviewing 122 records, judged the best system's top five correct 53% of the time strictly, or 74% if "irrelevant but technically correct" counted. The leaders were hybrids: [Annif](https://arxiv.org/abs/2504.19675)'s traditional classifiers plus LLMs for translation and synthetic data (first on recall), a few-shot [LLM ensemble](https://arxiv.org/abs/2504.21589) mapped to the vocabulary (best with the specialists), and retrieval of similar records' subjects as candidates.
- **A learned, shelf-compatible classification.** A single-author preprint posted on 2026-10-14 fits a class tree to an embedding-similarity graph. Each class must be a contiguous run of one fixed shelf order, and new works only split leaf classes, so existing codes never change ([Awad 2026](https://arxiv.org/abs/2610.19547)). On 10,000 arXiv papers its 110-class prototype scored 0.1722 on its cost objective, against 0.3333 for arXiv's own categories and 0.6414 for the best existing scheme reached through a lexical classifier (the abstract does not name the scheme). Filing 500 library books created 16 classes and changed no existing identifier. The author notes that "fit, filing and scoring share one embedding"; scored on other models' similarity graphs, held-out skill on books falls from 0.806 to 0.731. We read the comparison as tilted toward the fitted scheme [~80%]. The constraints are still the right ones for a shelf: contiguous classes and identifiers that never break.

**A workable pipeline** [inference; not yet tested on Open Library]:

1. Embed the work's title, subjects and any description or table of contents.
2. Retrieve its 20–50 nearest LCC-classed neighbours and collect their class numbers with schedule captions. This is the candidate list, mirroring the retrieval approach that did well at SemEval.
3. Ask the model to pick a primary class and up to two secondary ones from the candidates or the outline, with a confidence and a one-line reason.
4. Validate on 5,000 works that already have LoC numbers, with those numbers hidden. Report agreement at main class, subclass, outline range and full class number. Set the confidence threshold from the curve.
5. Store model, prompt version and date with every machine placement. Never overwrite a cataloger's number. Regenerate when models improve.

**Cost** (Anthropic prices as of October 2026 from the [pricing page](https://platform.claude.com/docs/en/about-claude/pricing), Batch API at half price; our token assumptions: about 1,000 input and 80 output tokens per work, ±50%):

| Scope | Claude Haiku 5.5 batch (\$0.05 / \$0.25 per MTok) | Claude Sonnet 5.5 batch (\$1 / \$5) | Claude Opus 5.5 batch (\$2 / \$10) |
|---|---|---|---|
| Validation set, 5,000 works | \$0.35 | \$7 | \$14 |
| Personal library, 10,000 works | \$0.70 | \$14 | \$28 |
| 1M works | \$70 | \$1,400 | \$2,800 |
| All ~27M unclassed Open Library works | ~\$1,900 | ~\$38,000 | ~\$76,000 |

Opus 5.5's tokenizer produces about 1.0–1.35× as many tokens as older Claude tokenizers, so its column could run up to a third higher. The decision rule follows from the table. For a personal library, use the strongest model; the cost is trivial. For catalog-scale gap filling, run Haiku with retrieved candidates and send low-confidence cases to a stronger model. Either way, the validation run costs \$14 or less. Embedding costs are small by comparison (see [Costs and Effort](/building/costs-and-effort/)).

**What not to do.** Do not let an LLM invent a new classification and lay it over the whole catalog without a fixed schema. Hearst's warning about clusters, that users "dislike organizations that show inconsistent levels of description", applies to LLM labels generated one cluster at a time (R06). LCC's value as a shelf is its stability. A machine layer should add routes to a work, not move it.

## Open questions

- **Does semantic adjacency beat LCC adjacency?** Compare neighbour uptake under LCC order and under an embedding-based order (LoC embeddings, ordered by nearest-neighbour chains) with the same users and works. No published study does this (R05).
- **What is the neighbour effect on a virtual shelf?** Instrument SearchWorks-style browsing, or your own tool, with impression logs and compute the analogue of McKay et al.'s ratio. Is it above or below 9×?
- **How accurately can current LLMs assign LCC?** Run the held-out test above at four levels of the hierarchy, and find a published estimate of agreement between human catalogers to compare it with.
- **How big should the window be?** Physical shelves show hundreds of spines; widgets show 1 to 50. Does uptake rise with visible spines, and where does it saturate on a laptop and on a phone?
- **Do extra placements help or hurt?** Multi-placement adds routes (multi-reachability) but may weaken the stable adjacency that spatial memory relies on. Test one placement against up to three.
- **Is Open Library Explorer maintained, and how much is it used?** Its code activity and usage are not public in anything we found.
- **What exactly is in LoC's embeddings?** Which fields were embedded, how many records, and does the id.loc.gov public-domain statement explicitly cover them?
- **Does a front table outperform a ranked list for discovery?** Compare twelve curated, explained, cross-class picks with a top-12 list from the same candidates, measured by opens and by reader ratings a week later.

## Related pages

- [Catalogs and Metadata](/finding/catalogs-and-metadata/): Open Library, LoC, HathiTrust and WorldCat as data sources
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): page-level signals for shelf hover cards
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): Open Syllabus co-assignment and expert lists
- [AI Research Assistants](/finding/ai-research-assistants/): why AI tools serve papers better than books
- [Foraging and Exploratory Search](/interfaces/exploratory-search/): area scanning among Bates's moves; information scent
- [Maps of Knowledge](/interfaces/maps-of-knowledge/): embedding maps, and why 3D failed
- [Building a Virtual Reading Room](/environments/virtual-reading-room/): shelves in VR
- [A Reference Architecture](/building/reference-architecture/): ingestion, LCC normalization and the best-free-copy resolver
- [The Design Space](/building/design-space/) and [Prototype Gallery](/building/prototype-gallery/): interface mockups built on the same LC outline data
- [The Access Ladder](/access/access-ladder/): what each spine's access badge should point to
- [Costs and Effort](/building/costs-and-effort/): model and embedding costs in more detail
