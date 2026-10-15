---
title: Catalogs and Metadata
description: The open and paid bibliographic metadata available to anyone building a catalog in October 2026 (Open Library, WorldCat, Library of Congress, HathiTrust, Wikidata, OpenAlex, Crossref, Semantic Scholar, DOAB/OAPEN, Google Books, ISBNdb, LibraryThing, Open Syllabus), compared on size, fields, licence, rate limits and bulk access. Also covers why work/edition clustering is the main engineering cost, where tables of contents and descriptions can be found, what a catalog built from metadata alone can do, and the legal facts about Anna's Archive metadata.
---

*Status: draft, October 2026. Catalog sizes, prices, rate limits and service statuses are as of October 2026. Most were measured against primary endpoints on 2026-10-15 by the R05 and R10 research passes. A few figures were measured for this chapter on the same day: Crossref abstract and chapter counts, DOAB/OAPEN field samples, the Open Library edition examples, and the LibraryThing block. An editorial pass, also on 2026-10-15, re-ran those queries and read the *OCLC v. Anna's Archive* opinion. R05's field counts from the full Open Library dump could not be reproduced by its verification pass, so they are treated as approximate. Cost figures for LLM extraction are our calculations. Sources: the [R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md), the [R10 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md), and primary sources linked inline.*

Open Stacks keeps the catalog separate from the content. This chapter covers the catalog side: the metadata from which a "catalog of everything" can be built, what each source holds, and where the gaps are. The pipeline that turns these sources into one record per work is in [A Reference Architecture](/building/reference-architecture/). What it costs is in [Costs and Effort](/building/costs-and-effort/).

## The short version

- **The open commons knows where a book sits much better than what is inside it.** In the Open Library (OL) dump of 2026-09-30, R05 counted about 34% of editions with a Library of Congress Classification (LCC) number and 49% with subject strings. Only about 2.5% had a table of contents (TOC) and 3.6% a description. These counts were not independently reproduced, so treat them as approximate. Plan to extract or generate the "inside the book" layer; do not expect to download it.
- **A complete open book catalog is free, bulk and small.** The core files are OL's monthly dumps (18.2 GB gzipped), HathiTrust's Hathifiles (1.23 GB) and the Library of Congress (LoC) subject headings (141 MB), about 20 GB in all. Harvard's CC0 MARC records, Wikidata's dump (156.5 GB) and LoC's record embeddings (≈190 GB) are optional additions. R10's full raw lake, which adds Wikidata and the paper sources (OpenAlex snapshot, Crossref, Semantic Scholar), is about 1.2–2.4 TB; the LoC embeddings add ≈0.19 TB (all sizes as of October 2026).
- **The largest catalogs are closed to builders.** WorldCat (610M records) is open only to OCLC member institutions, and in January 2026 a federal court enjoined Anna's Archive from scraping it. Goodreads stopped issuing API keys in 2020. LibraryThing served a "High traffic" block page to scripted requests on 2026-10-15. Open Syllabus data after 2019 needs an institutional subscription or a research agreement.
- **Paid metadata is cheap but does not fill the TOC gap.** ISBNdb's database of "nearly 122 million" books includes a synopsis field, from \$14.99/month, but has no TOC field. Library-grade TOCs (Syndetics, ONIX publisher feeds) are licensed to libraries and retailers, not to individuals.
- **The best TOC sources are not the obvious ones.** For scholarly books, Crossref's 24.9M book-chapter records amount to TOCs with page ranges, and the free OpenAlex snapshot links many chapters to their book. For other books, start with OL's 1.4M TOCs and MARC 505 contents notes. Then extract the rest with an LLM from open scans, at roughly \$600–1,000 per million volumes on Claude Haiku 5.5 batch pricing [I].
- **Work/edition clustering is the main engineering cost, not search.** Sources count different things (works, editions, scanned volumes, chapters), and page numbers belong to one edition. Budget about a third of the build for it ([R10](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md)).
- **Do not ingest Anna's Archive metadata.** Its WorldCat-derived records are under a US court deletion order, and legal open sources (OL, LoC, HathiTrust, Harvard, Wikidata) cover nearly everything else a discovery tool needs.

## Catalog versus content

A catalog record for Open Stacks has five layers. The open sources cover them very unevenly.

| Layer | Question it answers | Best open sources (October 2026) | How well covered |
|---|---|---|---|
| **Identity** | Which book is this, and is it the same as that one? | OL works and editions, Hathifiles, Wikidata, Crossref and OpenAlex IDs | Good for identifiers; hard for clustering (see [below](#the-work-and-edition-problem)) |
| **Placement** | Where does it sit among other books? | LCC and Library of Congress Subject Headings (LCSH) from OL, LoC and Harvard; LoC record embeddings; OpenAlex topics | Good: 14.7M OL works carry an LCC |
| **Interior** | What is in it, and on which pages? | OL TOCs, MARC 505, Crossref chapter records, HTRC page features, search-inside | Poor for books; good for papers (abstracts, TLDRs) |
| **Signals** | Who reads, cites or teaches it? | OL reading logs and lists, Open Syllabus (free tier to 2019), OpenAlex and Semantic Scholar citations | Good for papers; thin and noisy for books |
| **Access** | Where can I read it legally, and at which page? | Hathifiles rights codes, OL `ebook_access`, Gutenberg, DOAB/OAPEN, OpenAlex OA locations | Good for public domain and open access; see [The Access Ladder](/access/access-ladder/) |

The interior layer is the gap that matters most for this wiki. A reader triaging books in a physical library looks at the TOC, the back cover, the index, and flicks through ([Hinze et al., JCDL 2012](https://researchcommons.waikato.ac.nz/bitstreams/3876091c-69d5-44ff-b3e7-2a23aedd4fa6/download), 65 readers interviewed, 51 observed). Open metadata supplies the spine label but rarely the TOC.

## The sources, October 2026

### What each source holds

| Source | Scale (date) | TOCs | Subjects and classification | Descriptions | Covers | Page-level data |
|---|---|---|---|---|---|---|
| [Open Library](https://openlibrary.org/developers/dumps) | ~56.8M editions, ~41.7M works (2026-09-30 dump, R05 count, not reproduced); 15.5M authors | 1.41M editions (2.5% at most) | Subjects on ~49% of editions; LCC on ~34%; 14.7M works with LCC and 5.9M with Dewey (DDC) | ~3.6% of editions, ~4.7% of works | ~23% of editions; bulk cover archives | Search-inside snippets with page numbers from Internet Archive scans |
| [WorldCat](https://oclc.org/en/worldcat/inside-worldcat.html) (OCLC) | 609,755,407 records; 3.58B holdings (October 2025) | MARC 505 where catalogued | LCC, DDC, LCSH | MARC 520 where catalogued | Some | No |
| [LoC MARC (MDSConnect)](https://www.loc.gov/cds/products/marcDist.php) | ~25M records, frozen at the 2016 retrospective file | MARC 505, share unknown | LCC and LCSH | MARC 520, share unknown | No | No |
| [LoC id.loc.gov](https://id.loc.gov/download/) | LCSH 141 MB, name authorities 5 GB, BIBFRAME Hubs 2 GB; experimental embeddings in 22 files, ≈190 GB (≈19–20M records, estimated) | No | *Is* the subject and name authority; embeddings carry an LCC per record | Scope notes | No | No |
| [Harvard Library MARC](https://library.harvard.edu/services-tools/harvard-library-apis-datasets) | 12.7M records | MARC 505 where present | LCC and LCSH | MARC 520 where present | No | No |
| [HathiTrust Hathifiles](https://www.hathitrust.org/hathifiles) | 19,701,406 scanned volumes under 9,745,536 records (2026-10-01) | No | None: 26 fields with no LCC ([field list](https://www.hathitrust.org/files/hathifiles/hathi_field_list.txt)) | No | No | Not in the file. Full-text search reports page hits for search-only volumes (interactive use) |
| [HTRC Extracted Features 2.5](https://htrc.atlassian.net/wiki/spaces/COM/pages/975306753/Extracted+Features+v.2.5) | 18,725,868 volumes; 6.87B pages; 9.97M volumes in copyright (April 2025 snapshot) | Inferable from page features [I] | Volume metadata | No | No | **Yes**: per-page token counts with part-of-speech tags, split into header, body and footer |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:WikiProject_Books) | 522,592 literary works; 334,900 items with an ISBN-13; 241,104 edition items (2026-10-15) | No | Main subject (P921), genre; LCC on only 5,754 items | Through Wikipedia links | Some Commons images | No |
| [OpenAlex](https://help.openalex.org/access/snapshot/) | ~626M records per format in the snapshot (September 2026); API 327M works by default, 476M with `corpus=all` | Chapters linked to their book through the `volume` field, where the Crossref records share an ISBN or nested DOIs ([work object](https://help.openalex.org/api-entities/works/work-object)) | Up to three ranked topics per work, plus keywords; concepts are "legacy" | Abstracts only as an inverted index (over 60% of 2022 works, ~45% of pre-2000 works) | No | No. Cached open-access PDFs cost \$10 per 1,000 through the API ([example costs](https://help.openalex.org/access/example-costs/)) |
| [Crossref](https://crossref.org/services/metadata-retrieval/public-data-file/) | 187.7M works via the live API (2026-10-15); 2026 data file 208 GB, ~180M records | **Yes, for scholarly books**: 24.9M book-chapter records, usually with page ranges | Sparse | Abstracts on 24.3% of works (31.5% of journal articles, 4.7% of chapters) | No | Chapter page ranges |
| [Semantic Scholar](https://api.semanticscholar.org/datasets/v1/release/latest) | 200M papers; 100M abstracts; 58M TLDRs; 120M SPECTER2 vectors (release 2026-10-06) | No | Fields of study [K] | Abstracts and one-sentence TLDRs | No | Parsed full text for 16M open-access papers |
| [DOAB](https://directory.doabooks.org/oai/request?verb=ListRecords&metadataPrefix=oai_dc) | 128,285 OAI records (2026-10-15); the count includes deletion stubs and may include chapters | Through the open full text | ~13 subject terms per record on the first page | 90 of the 92 live records on the first page carry an abstract (8 of 100 were deletion stubs) | Not checked | No |
| [OAPEN](https://library.oapen.org/oai/request?verb=ListRecords&metadataPrefix=oai_dc) | 59,193 OAI records (2026-10-15), including deletion stubs | Through the hosted full text | ~8 subject terms per record on the first page | All 88 live records on the first page (12 of 100 were deletion stubs) | Not checked | Full text hosted |
| [Google Books API](https://developers.google.com/books/docs/v1/reference/volumes) | "More than 40 million books" ([2019](https://blog.google/products/search/15-years-google-books/)) | Not in the API | `categories`, `mainCategory` | `description`: "A synopsis of the volume" | Thumbnails | `textSnippet` around a query match |
| [ISBNdb](https://isbndb.com/isbn-database) | "Nearly 122 million unique books" | **No** | Subjects | Synopsis | Thumbnail | No |
| LibraryThing | >155M books catalogued (February 2021, stale) [S] | Not verified | Tags, classification | Some | Yes | No |
| [Open Syllabus](https://docs.opensyllabus.org/) | 32.9M syllabi; 147M citations to 4.4M works (v2.14) | No | 69 fields of study | No | No | No, but assignment counts and co-assignment |
| Syndetics Unbound; ONIX publisher feeds | Trade-wide | **Yes** | Yes (BISAC/Thema in ONIX) | Yes | Yes | "Look Inside" (Syndetics) |

Figures are from R05 and R10 unless marked. The Crossref, DOAB and OAPEN field figures are our live queries of 2026-10-15. The DOAB and OAPEN samples are the first page of each OAI-PMH feed (100 records), which is not a random sample. Because OAI-PMH lists deleted records as headers, `completeListSize` overstates the live record count; on the first page the overstatement was 8% (DOAB) and 12% (OAPEN), though the oldest page is likely the worst case [I, ~70%].

### How you get it

| Source | Licence or terms | Rate limits | Bulk route | Status, October 2026 |
|---|---|---|---|---|
| Open Library | Internet Archive "does not assert any new copyright" ([licensing](https://openlibrary.org/developers/licensing)). Not a formal CC0 dedication | 1 req/s anonymous, 3 req/s with an identifying `User-Agent`; cover lookups by ISBN capped at 100 per IP per 5 minutes; "Please do not use our APIs to bulk download metadata" ([API](https://openlibrary.org/developers/api)) | Monthly dumps (editions 12.6 GB, works 4.1 GB, authors 0.8 GB, gzipped); reading-log, lists and ratings dumps; cover archives | Active. Search rejects broad queries (`the` is "not allowed"; `lcc:*` returns HTTP 500). `/explore` shows a human-verification page to scripts |
| WorldCat | OCLC terms bar harvesting "material amounts of data" | API access for OCLC member institutions only ([eligibility](https://oclc.org/developer/support/eligibility.en.html)) | None | Search API v1 ended 2024-12-31; v2 needs both a cataloguing and a FirstSearch/Discovery subscription. OCLC Classify is retired. Anna's Archive enjoined from scraping it, 2026-01-15 |
| LoC MARC | Free download | n/a | Zipped MARC (UTF-8 and XML) | Frozen at 2016. Current MARC distribution is paid |
| LoC id.loc.gov | "A public domain data set" ([about](https://id.loc.gov/about/)); the embeddings probably fall under the same terms [~75%] | Not stated | RDF and JSON-LD; weekly increments (latest 2026-10-03) | Active; the embeddings are labelled experimental |
| Harvard MARC | CC0 | LibraryCloud API returned 403 to scripts | MARC XML on Dataverse | Active. Harvard's StackLife browser no longer resolves in DNS |
| Hathifiles | Metadata CC0, per HathiTrust [S] | Bulk file. Full-text search (`babel`) shows a Cloudflare challenge to scripts | Monthly full file plus daily updates | Active |
| HTRC EF 2.5 | CC BY 4.0 | None stated | rsync per volume; 4.4 TB in full | Active; updated incrementally under one version number |
| Wikidata | CC0 | Query service has a ~60 s timeout [K] | Weekly JSON dump, 156.5 GB gzipped (2026-10-13) | Active. Scholarly articles (46.0M) moved to a separate query service |
| OpenAlex | CC0 data | Free key buys \$1/day of usage, keyless \$0.10/day; list calls \$0.10 per 1,000, search \$1 per 1,000, single lookups free ([pricing](https://help.openalex.org/access/pricing)) | Free snapshot on S3, ~745 GB JSONL or ~770 GB Parquet, quarterly | Active; now metered. The keyless daily budget was already exhausted when we queried on 2026-10-15 |
| Crossref | "Almost none of the metadata is subject to copyright" and it may be used for "any purpose", but "some abstracts … may be subject to copyright by publishers or authors" ([REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)) | Public pool 5 req/s at concurrency 1; polite pool (`mailto=`) 10 at concurrency 3; Metadata Plus 150 ([Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/)) | Annual public data file (208 GB, 2026) | Active. Expect intermittent empty responses even in the polite pool: most of our count queries on 2026-10-15 needed one or more retries |
| Semantic Scholar | Per dataset: abstracts ODC-BY, SPECTER embeddings Apache-2.0 | Keys start at 1 req/s | Dataset downloads with a free key | Releases roughly weekly |
| DOAB / OAPEN | DOAB metadata CC0 [S]; OAPEN content under per-title licences | OAI-PMH, 100 records per page | OAI-PMH harvest; skip `status="deleted"` headers | Active. DOAB's ONIX, MARC and RIS exports were marked "temporarily unavailable" [S] |
| Google Books API | [ToS](https://developers.google.com/books/terms) (2012-04-25): you may not charge users without Google's agreement, and you must honour removal requests | Per-key daily quota; at most 40 results per call ([docs](https://developers.google.com/books/docs/v1/using)) | None | Active. Anonymous calls returned HTTP 429 (shared quota exhausted) on 2026-10-15, so bring a key |
| ISBNdb | Commercial subscription | \$14.99/month: 5,000 calls/day at 1/s; \$35.99: 15,000/day at 3/s; \$99.99: 50,000/day at 5/s; academic \$7.50: 2,000/day | Up to 100 results per bulk call (Basic) | Active |
| LibraryThing | Historically noncommercial APIs [P, low] | n/a | None | `thingISBN` returned a 403 "High traffic" block page to our request on 2026-10-15; the site had turned off browsing for visitors not signed in |
| Open Syllabus | Proprietary. Research-use agreements; commercial licences for publishers | Analytics web app | None public | Active. Free tier capped at 2019 data; subscriptions are institutional only ([accounts](https://blog.opensyllabus.org/about-accounts)) |
| Syndetics; ONIX | Library or trade licences | n/a | Via aggregators | Active; not sold to individuals |

### Notes on the main sources

**Open Library is the spine.** It is current (monthly dumps), large, links works to editions, carries LCC and DDC, and sits on top of the Internet Archive's scans and search-inside index. Its weaknesses are the interior layer and the quality of its clusters (next section). One correction to a common belief: OL's licence page does not dedicate the data to CC0. It says the Internet Archive asserts no new rights and warns that "there may be existing rights issues on some contributions". For reuse that is low-risk [~85%], but say "no rights asserted", not "CC0". Cover images are publishers' artwork. Displaying them rests on display norms, not on any licence [I].

**HathiTrust is the rights oracle, not a descriptive catalog.** The Hathifiles carry an access code and a rights code for each of 19.7M scanned volumes. As of 2026-10-01, 8,293,334 volumes (42.1%) were full view. They carry no LCC, subjects, descriptions or TOCs. Class numbers come from joining on OCLC number, ISBN or LCCN to OL, LoC or Harvard records. Note that `pdus` (2.3M volumes) means public domain in the US only.

**The Library of Congress gives away the navigation layer.** LCSH and the name authorities are free bulk downloads, and the classification schedules are free PDFs ([FreeLCC](https://www.loc.gov/aba/publications/FreeLCC/freelcc.html), data selected May 2024). The free MARC set stops in 2016, so for post-2016 books LCC has to come from OL or Harvard. The experimental embeddings are 1024-dimension Amazon Titan V2 vectors with title, creator, LCC and LCCN per record. They are the cheapest route to "semantic neighbours" for about 20M LoC catalogue records [I]. Which fields were embedded is undocumented.

**WorldCat is the biggest catalog, and builders cannot use it.** WorldCat has 610M records and 3.58B holdings. It is the only source that answers "which library near me has this" at scale. Use it as a link target (a WorldCat search URL built from an OCLC number), not as a data source.

**For papers, three sources overlap and each adds something.** OpenAlex is the broadest graph, with topics and open-access locations. It is now metered: a full API harvest of 327M works through list calls at 100 results per call would cost about \$327, so load the quarterly snapshot instead ([A Reference Architecture](/building/reference-architecture/) works the numbers). It ships abstracts only as an inverted index. Its documentation says "OpenAlex does not ship plaintext abstracts for legal reasons" ([work object](https://help.openalex.org/api-entities/works/work-object)). Semantic Scholar adds 58M TLDRs and 120M precomputed SPECTER2 vectors. Crossref is the registry of record, and its chapter records matter for books (below). The paper side is covered in more depth in [Open Papers and Preprints](/access/open-papers/).

**Google Books and ISBNdb are lookup services, not datasets.** Each answers "give me the description and cover for this ISBN" well. Neither lets you download a catalog. Google's 2012 terms forbid charging users without permission. ISBNdb's cheapest plan allows 5,000 calls/day, so enriching 100,000 ISBNs one at a time takes 20 days. Its bulk endpoint returns up to 100 results per call, which cuts that to under a day if your ISBNs batch cleanly [I].

**Open Syllabus is the best "what experts assign together" signal, and mostly closed.** The free tier stops at 2019, which is adequate for older canon in statistics, decision theory or philosophy. Co-assignment data comes only under a research agreement or a commercial licence. Curated signals in general are covered in [Curation: Syllabi, Experts and Reviews](/finding/curation/).

## The work and edition problem

### Four levels, and every source picks a different one

Library cataloguing distinguishes four levels, following IFLA's *Functional Requirements for Bibliographic Records* ([FRBR final report](https://repository.ifla.org/handle/20.500.14598/811), 1998; amended 2009), which IFLA has superseded with the [IFLA Library Reference Model](https://repository.ifla.org/handle/20.500.14598/40) (LRM, 2017):

- **Work:** the abstract creation (Jaynes's *Probability Theory*).
- **Expression:** a particular realization: the English text, a translation, a revised edition.
- **Manifestation:** a published embodiment: the 2003 Cambridge hardback, with its own ISBN and page numbering.
- **Item:** one copy: the scan of that hardback held at one library.

LoC's BIBFRAME model collapses this to Work, Instance and Item ([BIBFRAME 2.0](https://www.loc.gov/bibframe/docs/bibframe2-model.html)). The problem is that every source counts a different level and draws the boundaries differently:

| Source | Unit it counts | Count (date) | Ratio |
|---|---|---|---|
| HathiTrust | Items (scanned volumes) under bibliographic records | 19.70M items, 9.75M records (2026-10-01) | ≈2.0 items per record; a record is still not a work |
| Open Library | Editions under works | ~56.8M editions, ~41.7M works (2026-09-30 dump, approximate) | ≈1.4 editions per work on average |
| Crossref | DOIs, including one per book chapter | 24.9M book chapters vs 0.86M `book` and 0.82M `monograph` records (2026-10-15) | ≈15 chapter records per book-level record [I, rough] |
| OpenAlex | Works, with a hidden expansion set | 327M by default, 476M with `corpus=all` | 1.46× depending on one flag |
| Wikidata | Separate work and edition items, linked by P629 | 241,104 edition items | Covers only notable books |
| WorldCat | Manifestation-level records, with duplicates | 610M (October 2025) | OCLC's own work clustering is not publicly accessible |

The averages hide the skew that matters. Across OL, 1.4 editions per work implies that most works have a single edition [I, ~85%]. The works a researcher cares about look different. The dataset behind the [Prototype Gallery](/building/prototype-gallery/) holds 7,127 works: the 200 most-logged OL works for each of 50 subject queries in this wiki's areas, deduplicated (fetched 2026-10-15). It is a sample of popular works, not a random draw. There, only 25% of works had a single edition; the median had 3 and the mean 12. The Bible had 6,109. Clustering errors therefore concentrate on the books that matter most [I].

### What goes wrong, with live examples

All examples are from Open Library queries on 2026-10-15.

- **Under-merging: one book, several works.** *Bayesian Data Analysis* has a work with 14 editions covering the first through third editions (526, 668 and 675 pages). It also has a separate one-edition work titled "Bayesian Data Analysis Third Edition 3rd Edition", where an edition statement leaked into the title. *Thinking, Fast and Slow* has its main work (36 editions) plus a stray one-edition work dated 2001, ten years before the book appeared.
- **Derivative works credited to the original author.** "Thinking, Fast and Slow... in 30 Minutes" and "Signal and the Noise... in 30 Minutes" are separate works that list Kahneman and Silver among their authors. A naive title-plus-author key merges summaries into the original.
- **Title collisions.** Searching for *Judgment under Uncertainty: Heuristics and Biases* returns the original collection (6 editions) and also a 2017 analysis of it by other authors, catalogued under the same main title. A key built on title alone merges them; a key built on title plus author splits them correctly only if the author field is right.
- **Over-merging by uniform title.** One OL work titled "Laws, etc." (Great Britain) holds 3,456 editions, because cataloguers file many different statute collections under that conventional heading [K]. Every statute book in it shares one "work".
- **Translations collapsed into one work.** OL's Homer work, titled "Ἰλιάς", holds 1,084 editions, almost certainly including translations [I]. Ovid's *Metamorphoses* appears under the Italian title "Metamorfosi". The work's display title is whichever form the record happened to get, and the translation, which matters a great deal to a reader, sits one level down.
- **One work, several shelves.** *Superforecasting* carries LCC numbers in both HB3730 (economic forecasting) and CB158 (forecasting the future of civilization). This is a clustering artefact, and it is also useful: [Browsing the Stacks](/finding/browsing-the-stacks/) argues for showing a work on every shelf it was classed under.

### Why it is the main engineering pain

1. **Every join goes through it.** Rights come from HathiTrust volumes, classification from OL or LoC records, descriptions from ISBN lookups, citations from OpenAlex works, and teaching signals from Open Syllabus works. Each join crosses levels. Until the clusters are right, the answer to "is this book free to read?" is attached to the wrong record some fraction of the time.
2. **Page numbers live at the manifestation level.** Open Stacks wants to route a reader to the right *page*. But page numbers belong to one manifestation. Across the 22 editions of *Thinking, Fast and Slow* in OL that report a page count, counts range from 230 to 706. Jaynes's book appears at 727, 753 and 759 pages. A TOC entry like "Chapter 1, p. 19" is true of one edition. So the catalog needs two levels at once: the work for browsing and counting, and the manifestation for page anchors. The scan a reader can open may be a different manifestation from the one whose TOC you hold [I].
3. **Errors in both directions cost something, and the costs are asymmetric.** An over-merge hides a distinct book: many different textbooks are titled *Introduction to Probability*. An under-merge shows a duplicate card. The [reference architecture](/building/reference-architecture/) therefore favours precision over recall [~75%].
4. **Textbook editions differ in substance.** A third edition of a statistics text can add chapters and renumber everything. For a reader, "which edition" changes the content, not only the pagination. FRBR handles this as a new expression of the same work. Most sources do not record expressions at all.
5. **Chapters and anthologies cut the other way.** Crossref mints chapter DOIs, anthologies contain works, and multi-volume sets split one work across several items. The unit is sometimes smaller than a book and sometimes larger.

### What to do

The full pipeline (hard links over shared IDs, blocking, pairwise scoring, LLM adjudication of the middle band, typed relations, a labelled evaluation set) is in [A Reference Architecture](/building/reference-architecture/). Decisions specific to the metadata:

- **Start from existing clusters and treat them as priors, not truth.** OL works, Wikidata P629 links and OpenAlex works are free. LoC's BIBFRAME Hubs (2 GB bulk download) are "abstract resources that function as bridges between BIBFRAME Works", generated mainly from name/title and title authority records ([LoC training transcript](https://www.loc.gov/catworkshop/bibframe/bfprod/10-Hubs-Transcript.pdf), March 2025). They should therefore cover mainly classics, translated works and other works with many expressions, not the long tail [I, ~70%]. OCLC's work clusters and LibraryThing's `thingISBN` are not reachable.
- **Keep translations, editions and volumes as typed members of a work cluster.** Never merge them silently.
- **Anchor on chapters, not pages.** Store each TOC with the manifestation it came from. To route a reader into a different edition, match the chapter title in that edition's TOC or in its search-inside index, and only then resolve a page [I].
- **Measure it.** Build 300–500 labelled pairs stratified by source pair before scaling up. R10 puts LLM adjudication at about \$0.0002 per ambiguous pair on Claude Haiku 5.5, so 100,000 pairs cost about \$20 [I]. The bottleneck is labelling and checking, not model cost.

## Where tables of contents come from

TOCs are the highest-value missing field. They are what readers use to triage. They are the cheapest grounding for an LLM blurb (a one-paragraph blurb from metadata plus TOC costs \$15 per 100,000 books on Haiku 5.5 batch; see [Costs and Effort](/building/costs-and-effort/)). And they turn a book into a set of chapters you can shelve and search.

| Source | Coverage (October 2026) | Page numbers | Access | Use it for |
|---|---|---|---|---|
| **Crossref book-chapter records** | 24,911,542 chapter records (live API, 2026-10-15). In two random samples (140 records): 93% had page ranges, 87% an ISBN, all the parent book's title | Usually | Free API and annual data file; also in the OpenAlex snapshot, where a chapter's `volume` field points to its book when the two share an ISBN or the chapter's DOI extends the book's | Scholarly monographs and edited volumes from publishers that register chapter DOIs (in our sample: Springer, Routledge, Elsevier, Brill, IGI Global, Edinburgh UP and others). Group by `volume.id` in OpenAlex, or by parent ISBN in Crossref, to rebuild the TOC |
| **Open Library `table_of_contents`** | 1,407,705 editions carry the field (≤2.5%; an upper bound, since empty arrays count) | Sometimes. Entries are structured as level, label, title and page number. The *Thinking, Fast and Slow* TOC has page numbers; the Jaynes TOC (30 entries) has none | Dumps and API | Free structured TOCs, partly imported from MARC 505 |
| **MARC 505 (formatted contents note)** | Share unknown in LoC (~25M, 2016), Harvard (12.7M) and WorldCat records | Rarely | LoC and Harvard free; WorldCat closed | Edited volumes and multi-author books, where cataloguers most often record contents [I] |
| **LoC BEAT web TOCs** | ~30,000 machine-generated TOCs and ~50,000 publisher (ONIX) TOCs ([BEAT](https://www.loc.gov/catdir/beat/), counts from about 2005) | Some | Free web pages | A frozen, small set |
| **ONIX publisher feeds** | Most active trade titles [K] | Some | Licensed to retailers and aggregators ([ONIX](https://www.editeur.org/83/Overview/)) | Not available to individuals |
| **Syndetics Unbound** | Library-grade enrichment | Yes | Library subscription ([ProQuest](https://proquest.syndetics.com/)) | Shown in many library catalogues; not licensable for a personal tool |
| **Google Books** | Many preview books show "Contents" on the web [K] | Yes | Web only; the API has no TOC field | Manual lookup |
| **EPUB navigation and PDF outlines** | Most born-digital open books: Gutenberg EPUBs, OpenStax, many DOAB/OAPEN files [I] | Logical locations; printed page numbers only if the file carries them | Download the file | The best TOCs available, at zero cost |
| **LLM extraction from open scans** | 8.29M HathiTrust full-view volumes; Internet Archive public scans | Yes (printed page numbers) | OCR text of public-domain scans: HathiTrust datasets on request [P], IA per-item text files [K]; bulk access not verified | Everything public domain without a born-digital file |
| **HTRC page features (in-copyright books)** | 9.97M in-copyright volumes | Chapter boundaries, not titles [I] | CC BY 4.0 bulk | Approximate chapter structure without the text |

**Notes:**

- **The Crossref route is underused** [I, ~70%]. For a researcher's shelf of academic monographs and handbooks, chapter records give titles, authors and page ranges per chapter, and sometimes abstracts (1,169,831 chapter records, 4.7%). They do not cover trade books, older books, or publishers that do not register chapter DOIs.
- **LLM extraction from public-domain OCR is cheap.** Assume the first 15 pages hold the TOC. HTRC's average is ~474 tokens per page, about 7,100 for 15 pages, but HTRC counts word-level tokens, not model tokens. At ≈1.3 model tokens per word [K], plus the pricing reference's 1.35× allowance for Claude's newer tokenizer, input could reach ~12,000 tokens; short front-matter pages pull the other way. Add a 500-token prompt and ~1,000 tokens out. On Claude Haiku 5.5 batch (\$0.05/\$0.25 per MTok, October 2026) that is \$0.0006–0.001 per volume, or about \$600–1,000 per million volumes. All 8.29M HathiTrust full-view volumes, serials included, would cost about \$5,000–8,000 [I]. Sonnet 5.5 batch would cost 20× more. Cost is not the constraint. The open questions are parse quality on noisy OCR and whether you can get the OCR text in bulk at all.
- **For in-copyright books without text, HTRC page features give structure, not titles.** The features are bags of words per page, so you cannot read a TOC page back in order. You can detect a TOC page (short lines ending in numbers early in the volume), and you can find chapter boundaries where the running-header vocabulary changes [I]. This gives "chapter 4 spans pages 88–121 and its headers say *calibration*, *scoring*", not the chapter's title. Do not try to reconstruct TOCs from search-inside snippets. That would turn a location service into a text-extraction service, and the terms and copyright position would be much weaker [I].

**Priority order for a builder** (adapted from R10): EPUB nav or NCX → PDF outline → Crossref chapter records → OL `table_of_contents` → MARC 505 → LLM over the first ~15 pages of an open scan → heading detection in parsed text → HTRC-derived chapter boundaries for in-copyright books.

## Where descriptions come from

| Source | Coverage | Terms | Notes |
|---|---|---|---|
| Open Library | ~3.6% of editions, ~4.7% of works | No rights asserted by IA; the text itself may belong to publishers | Volunteer- and import-sourced |
| Google Books API `description` | Likely most in-print trade books [K, ~70%] | API ToS; you need a key | Publisher synopses. The best free description source for modern trade books |
| ISBNdb synopsis | Part of ~122M ISBNs; share with a synopsis not published | Commercial subscription | \$14.99/month buys 150,000 lookups a month |
| MARC 520 summary notes | Unknown share of LoC and Harvard records | Free / CC0 | Cataloguer summaries, often terse |
| Crossref abstracts | 45,645,061 of 187.7M works (24.3%); journal articles 31.5%; book chapters 4.7% (2026-10-15) | Metadata reusable for "any purpose"; "some abstracts … may be subject to copyright by publishers or authors" ([Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)) | Depends on publishers depositing abstracts |
| Semantic Scholar | 100M abstracts and 58M TLDRs over 200M papers | Abstracts ODC-BY | TLDRs work well as one-line descriptions on a shelf view [I] |
| OpenAlex | Abstracts as an inverted index only; over 60% of 2022 works have one, ~45% of pre-2000 works ([work object](https://help.openalex.org/api-entities/works/work-object)) | "OpenAlex does not ship plaintext abstracts for legal reasons" | Reconstructable, but the licensing signal is clear |
| DOAB / OAPEN | 98–100% of live records on the first page of each feed (not a random sample) | DOAB metadata CC0 [S] | Author or publisher abstracts for open-access monographs |
| Wikidata → Wikipedia | Notable works only (~0.5M literary works) | CC0 / CC BY-SA | Good for canonical books, absent for monographs |
| LLM-generated blurb | Any book with metadata plus TOC | Yours, labelled as generated | \$15 per 100,000 books on Haiku 5.5 batch |

**Decision.** For a personal tool, fetch publisher descriptions from Google Books (with your own key) or ISBNdb for the books you actually shelve. For anything published to others, prefer generated blurbs grounded in the TOC and labelled as AI-generated, with a link to the publisher's page. Publisher synopses and abstracts are copyrighted text even when the surrounding metadata is not. OpenAlex's decision not to ship plaintext abstracts shows how a large open-data project reads that risk [I].

## What you can build from metadata alone

A catalog that never touches in-copyright full text can still do most of what a reader needs before opening a book. Coverage figures are as of October 2026.

| Capability | Data | Coverage | Main limit |
|---|---|---|---|
| **Virtual shelf in LoC order** | OL `lcc` and `lcc_sort`; LCC outline for labels | 14.7M OL works with an LCC | Multiple and malformed class numbers per work; show a work on every shelf it has |
| **Subject graph** (broader, narrower, related) | LCSH bulk download | Every LCSH-headed record | LCSH strings in OL are not always linked to LCSH IDs [I] |
| **Semantic neighbours** | LoC embeddings (books); SPECTER2 (papers) | ≈19–20M LoC records [I]; 120M papers | Unknown embedded fields; LoC records only |
| **"Where can I read it"** | Hathifiles rights, OL `ebook_access`, Gutenberg, DOAB/OAPEN, OpenAlex OA locations | 8.29M HathiTrust full-view volumes; 1.86M OL works public and 2.91M borrowable | `pdus` is US-only; Internet Archive public-domain flags are unreliable ([R10](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md)) |
| **"Which pages discuss X" without the text** | HTRC page features; OL search-inside snippets | 18.7M volumes, 9.97M of them in copyright; a test query for "base rate neglect" hit 472 IA volumes | Single words, not phrases, in HTRC; see [Searching Inside Books You Don't Have](/finding/searching-inside-books/) |
| **Chapter-level shelf** | Crossref chapters, OL TOCs, extracted TOCs | 24.9M chapter records; 1.4M OL TOCs | Thin for trade and pre-2000 books |
| **Canon and co-reading signals** | Open Syllabus (to 2019 free), OL reading logs and lists, citation counts | 4.4M taught works; OL reading-log dump 123 MB | Post-2019 syllabus data is licensed; OL logs are noisy |
| **Blurbs, levels, prerequisites** | LLM over metadata plus TOC | Any book with a TOC | Quality falls without a TOC; label as generated |

What metadata alone cannot do: summarize an argument chapter by chapter, judge whether a book is good, quote it, or check a claim against it. Those need the content, which is routed through [The Access Ladder](/access/access-ladder/). Coverage is also skewed toward the popular head. In the prototype's 7,127 popular works, 91.5% had an LCC and 92.6% a cover. Across all OL editions the figures are about 34% and 23%. Those two numbers are not directly comparable: one is work-level search data, the other edition-level dump data. But the direction is clear [I, ~90%]: the long tail of monographs, older and non-English books is where metadata is thinnest.

## Anna's Archive metadata: the legal facts

**What it holds.** Anna's Archive aggregates shadow-library files and metadata. Its metadata collections include records scraped from WorldCat (reported October 2023), Google Books and Open Library, distributed as zstd-compressed JSON-lines "containers" by torrent. As of 2026-10-01 it listed 71,996,952 books and 239,545,528 papers ([Wikipedia](https://en.wikipedia.org/wiki/Anna%27s_Archive), secondary).

**The WorldCat ruling.** In *OCLC, Inc. v. Anna's Archive* (S.D. Ohio, No. 2:24-cv-144), Judge Michael H. Watson issued an Opinion and Order on 2026-01-15 ([Doc. 58](https://librarytechnology.org/docs/32142.pdf)). Anna's Archive never appeared, so these are default judgments on facts it was deemed to admit. The court:

- held that WorldCat.org and its underlying data are "the subject matter of federal copyright law" for preemption purposes, but that the contract and trespass claims are not preempted;
- granted default judgment on **breach of contract**. Ohio law on browsewrap is unsettled, but Anna's Archive had constructive notice of the terms because it is "a sophisticated party that scraped data from Plaintiff's website daily". The terms bar users from using "such data for commercial use, harvest material amounts of data, to distribute, display, or disclose the data, or store the data";
- granted default judgment on **trespass to chattels**, because OCLC established that the defendant "crashed its website, slowed it, and damaged the servers";
- denied unjust enrichment (preempted by copyright) and tortious interference (OCLC alleged no third-party breach);
- permanently enjoined Anna's Archive "and all persons in active concert and participation with them" from scraping WorldCat data, from "using, storing, or distributing the WorldCat data on Anna's Archive's websites", and from "encouraging others to scrape, harvest, use, store, or distribute WorldCat data". It ordered deletion of "all copies of WorldCat data in possession of or easily accessible to it, including all torrents". OCLC sought no damages.

**Other judgments in 2026.** A \$322M default judgment for Spotify and the major labels (S.D.N.Y., April 2026; reported by [Music Business Worldwide](https://www.musicbusinessworldwide.com/spotify-and-record-labels-win-322m-default-judgment-against-pirate-site-annas-archive/)). A \$19.5M default judgment for publishers with a global domain takedown (May 2026; reported only by Wikipedia in our sources). Several of its domains were suspended [S]. The litigation history is in [The Shadow Libraries](/access/shadow-libraries/).

**What follows for a builder.** These are our inferences, not legal advice. The detailed analysis is in [The Legal Map](/building/legal-map/).

- The injunction binds Anna's Archive and those acting "in active concert and participation" with it. Whether an unaffiliated third party who downloads the WorldCat-derived records is exposed has not been decided [I]. A default judgment from one district court carries little precedential weight [I, ~80%]. But the records are under a deletion order, contract and trespass claims survived preemption, and redistributing the records in a public tool would be hard to defend [~85% that doing so is a bad idea].
- The rest of its metadata is either open elsewhere (it mirrors Open Library) or scraped from services with terms (Google Books). The provenance of book data is now a cost item: *Bartz v. Anthropic*, over books downloaded from pirate libraries, settled with final approval on 2026-07-20 ([settlement site](https://www.anthropiccopyrightsettlement.com/)). R10 recommends not ingesting LibGen, Anna's Archive or Z-Library data, even "just metadata", without legal review.
- Little is lost by abstaining. The part of its metadata with no open equivalent is mostly the WorldCat-derived records, which is the enjoined part [I, ~70%]. For everything else a discovery tool needs, OL, LoC, HathiTrust, Harvard's CC0 MARC and Wikidata are legal substitutes.

## What to use, by goal

| If you want | Use | Cost (October 2026) | Main obstacle |
|---|---|---|---|
| A browsable book catalog with shelf order | OL works and editions dumps; LCC outline; Harvard CC0 MARC to fill LCC and LCSH | \$0; ~20 GB plus the Harvard MARC | Work clustering; malformed and multiple LCCs |
| To know what is free to read | Hathifiles (monthly plus daily), OL `ebook_access`, Gutenberg catalog, DOAB/OAPEN OAI | \$0 | US-only `pdus`; joins across levels |
| Papers with summaries and vectors | OpenAlex snapshot; Semantic Scholar abstracts, TLDRs and SPECTER2 | \$0, ~1–2 TB of disk | Licence differences between datasets |
| TOCs for scholarly books | OpenAlex chapters grouped by `volume.id` (snapshot), or Crossref chapter records grouped by ISBN | \$0 | Only publishers that register chapter DOIs; OpenAlex links only chapters it can match to a book |
| TOCs for public-domain books | EPUB/PDF structure, else LLM over the first ~15 OCR pages | ~\$600–1,000 per million volumes on Haiku 5.5 batch [I] | OCR noise; bulk access to the OCR text is unverified |
| Descriptions for a personal shelf | Google Books API (own key) or ISBNdb | \$0–15/month | Quotas; copyrighted text if republished |
| Identifier crosswalks | Wikidata dump; OL's Wikidata crosswalk (authors only for now) | \$0; 156.5 GB | Covers only notable works |
| Semantic neighbours for books | LoC experimental embeddings | \$0; ≈190 GB | Experimental, undocumented fields |
| "What experts teach together" | Open Syllabus free tier (to 2019); ask about a research agreement | \$0 or institutional | Post-2019 data closed |
| Library holdings near you | Link out to WorldCat by OCLC number | \$0 | No data access; never scrape |

## Open questions

- **What share of LoC (2016) and Harvard MARC records carry a 505 contents note or a 520 summary?** Streaming Harvard's 12.7M CC0 records and counting tags would settle how much TOC coverage MARC adds beyond OL's 1.4M.
- **Are R05's Open Library dump field counts right?** The verification pass could not finish re-streaming the 12.6 GB editions file. A second full count (TOC 2.5%, description 3.6%, LCC 34.4%) would firm up this chapter's headline numbers.
- **What share of scholarly monographs have chapter DOIs in Crossref?** Join Crossref chapter records by ISBN to OL editions with LCC in class Q or H, and report coverage by publisher and decade.
- **How accurate is LLM TOC extraction from noisy public-domain OCR?** Compare Haiku 5.5 and Sonnet 5.5 extractions against 200 volumes with known TOCs, reporting title and page-number accuracy. Count the input tokens of the first 15 pages with `count_tokens` to replace the word-to-token guess in the cost estimate.
- **Can an individual get bulk OCR text for HathiTrust's 8.29M full-view volumes, and on what terms?** The TOC-extraction plan depends on it. Ask HathiTrust's research data services, and compare with per-item text downloads from the Internet Archive.
- **How many of DOAB's 128,285 OAI records are live books?** Harvest the full feed and count records that are not deletion stubs, split by `dc:type` into books and chapters.
- **Can HTRC running-header features recover chapter titles, not just boundaries?** Test on full-view volumes where the true TOC is known.
- **How good is Open Library's own work clustering?** Label 500 random edition pairs within and across works and estimate precision and recall. The examples above show both error types but not their rates.
- **Which fields did LoC embed, and do the "public domain data set" terms explicitly cover the embeddings?** A question to the id.loc.gov team would settle both.
- **Does any court extend the *OCLC v. Anna's Archive* reasoning to downstream users of scraped catalog data?** Watch the docket and any related actions.
- **What is Google Books' current default per-key daily quota, and does its 2012 "no fee" clause cover a free tool with a paid tier?** Neither is stated on the current documentation pages.
- **Are LibraryThing's APIs (`thingISBN`, Common Knowledge) still available to signed-in or keyed clients?** They returned a block page to anonymous scripted requests on 2026-10-15.

## Related pages

- [A Reference Architecture](/building/reference-architecture/): the adapters, ID crosswalk and clustering pipeline that consume these sources
- [Costs and Effort](/building/costs-and-effort/): what enrichment, embeddings and storage cost at three scales
- [The Legal Map](/building/legal-map/): scraping, terms of service and the shadow-library cases
- [Browsing the Stacks](/finding/browsing-the-stacks/): shelf order, LCC and serendipity
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): HTRC page features, search-inside and HathiTrust full-text search
- [Curation: Syllabi, Experts and Reviews](/finding/curation/): Open Syllabus and other curated signals
- [Open Papers and Preprints](/access/open-papers/): OpenAlex, Crossref and the paper side in depth
- [The Shadow Libraries](/access/shadow-libraries/): Anna's Archive and the litigation
- [The Access Ladder](/access/access-ladder/): routing a catalog entry to a readable copy
- [Directory of Sources and Tools](/reference/directory/)
