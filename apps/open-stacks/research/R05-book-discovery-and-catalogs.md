# Book discovery, catalog metadata, and shelf browsing: research dossier

**Track:** R05 · **Compiled:** 2026-10-15 · **For:** Open Stacks (QURI / CAIRN)

**Scope.** This dossier covers how a researcher can *find* books, and find the right *pages* inside them, using open or cheap metadata. Reading the full text is covered by other tracks. Topics:

- **Catalogs:** Open Library (scale, APIs, dumps, Explorer shelf browser, lists), WorldCat (OCLC terms), and the Library of Congress classification and subject headings used as a navigation structure.
- **"Inside the book" signals:** HathiTrust full-text search for search-only volumes; HTRC Extracted Features (page-level token counts); Internet Archive / Open Library search-inside; Google Books (search inside, API terms, Ngram Viewer).
- **Table-of-contents (TOC) data:** LoC, ONIX and Open Library.
- **Social and curated discovery:** Goodreads, LibraryThing, The StoryGraph, Literal, Five Books, Shepherd, Bookshop.org.
- **Curriculum signals:** Open Syllabus.
- **Summaries:** Blinkist, Shortform, getAbstract.
- **Other metadata:** Wikidata; paid metadata (ISBNdb and others); a factual legal note on Anna's Archive metadata.
- **Virtual shelf browsers:** Harvard StackLife/LibraryCloud, Stanford SearchWorks, Open Library Explorer, The Online Books Page.
- **Research:** physical-stack browsing, serendipity, and why bookstore curation works.

**Method.**

- About ten web searches were run before the shared web-search budget for this session ran out.
- After that, verification relied on direct fetches of known primary pages and on **live queries against public APIs and bulk files**:
  - the Open Library search, search-inside and dump endpoints;
  - the Internet Archive metadata and advanced-search APIs;
  - the HathiTrust Hathifiles bulk file (streamed in full and tabulated);
  - the HTRC documentation through its Confluence REST API;
  - id.loc.gov bulk-download listings, plus a byte-range sample of a LoC embeddings file;
  - Wikidata SPARQL counts;
  - Crossref and Semantic Scholar lookups to resolve known citations.
- The court opinion in *OCLC v. Anna's Archive* was read in full.
- **Several discovery sites now block scripted access.** I recorded this as a finding (see "Surprises"): LibraryThing, The StoryGraph, Literal, Shepherd, Blinkist, HathiTrust's `babel` reader, Stanford SearchWorks, Harvard's LibraryCloud API, and Open Library's `/explore` page. Where a primary page could not be read, I say so.

**Evidence labels.**

| Label | Meaning |
|---|---|
| **[V]** | Verified on a primary source or by a live query/HTTP check on 2026-10-15 (or the date stated) |
| **[S]** | Reported by a secondary source (Wikipedia, trade press, library guide) |
| **[I]** | My inference or calculation |
| **[K]** | My background knowledge, not re-verified in this session (treat as lower confidence) |

Confidence is marked as high/medium/low or as "[~70%]". Sources dated before ~2024 are flagged **(stale?)**.

---

## Executive summary

1. **Open Library (OL) is the most builder-friendly open catalog spine, and it is current.**
   - **Dumps:** monthly; the latest is dated 2026-09-30 [V]. Sizes (gzip): editions 12.6 GB, works 4.07 GB, authors 0.78 GB, all-types 18.2 GB, plus reading-log, lists, ratings, covers metadata and a Wikidata crosswalk [V].
   - **Licence:** the Internet Archive "does not assert any new copyright" over the database. This is a no-rights-claimed statement, not a formal CC0 licence [V].
   - **API limits:** 1 request/s for anonymous clients, 3 requests/s with an identifying User-Agent. Bulk-harvesting through the API is explicitly discouraged [V].
2. **OL's search index already holds a usable shelf order.** 14,734,568 works carry an LCC (Library of Congress Classification) number and 5,855,209 carry a DDC (Dewey) number. They are queryable and sortable with `lcc:`/`lcc_sort`. 15,467,818 author records exist [V, live API, 2026-10-15]. A virtual LoC-order shelf over ~15M works is therefore buildable without touching WorldCat.
3. **"Which book / which page discusses X" is answerable for free for modern, in-copyright books, via two routes.**
   - **Route A, snippets:** OL's `search/inside.json` returns page numbers and highlighted snippets from the Internet Archive full-text index, including in-copyright lending and print-disabled scans. A test query for "base rate neglect" hit 472 volumes [V].
   - **Route B, counts only:** HTRC Extracted Features 2.5 gives per-page part-of-speech token counts for **18,725,868 volumes / 6,867,699,164 pages / 3.26 trillion tokens**. That includes **9,969,251 in-copyright volumes**, under **CC BY 4.0**, 4.4 TB compressed, from an April 2025 snapshot [V].
4. **HathiTrust is larger than most summaries say.** The 2026-10-01 Hathifiles list **19,701,406 volumes** under **9,745,536 distinct bibliographic records**. Of these, **8,293,334 (42.1%)** are "allow" (full view) and 11,408,072 are "deny" (search-only) [V, my tabulation of the full file]. Its full-text search reports, for search-only volumes, the pages where a term occurs and how often [S]. However, `babel.hathitrust.org` now serves a Cloudflare challenge to scripted clients [V].
5. **The Library of Congress gives the navigation layer away.** Free resources [V]:
   - bulk LCSH, LCNAF and other vocabularies in RDF/JSON-LD (LCSH: 141 MB MADS JSON-LD; LCNAF: 5 GB);
   - LCC schedule PDFs (data selected May 2024; page updated 2026-02-10);
   - ~25M MARC records (2016 retrospective) through MDSConnect.

   **Surprise:** id.loc.gov now publishes **experimental 1024-dimension embeddings** (Amazon Titan Text Embeddings V2) of LoC bibliographic records, split by LCC class letter. There are 22 files totalling ~190 GB gzip, each record carrying LCCN, title, creator and LCC code [V]. I estimate ~19–20M records [I].
6. **WorldCat is the biggest catalog but legally closed to builders.** It holds 609,755,407 bibliographic records and 3.58B holdings (October 2025) [V]. APIs are for OCLC member institutions [V]. On **2026-01-15** a federal court granted OCLC a default judgment and permanent injunction against Anna's Archive for scraping WorldCat.org, on **breach of the browsewrap terms** (which forbid harvesting "material amounts of data" and storing it) and **trespass to chattels** [V, opinion].
7. **Social reading sites are closed or unreachable for tools.**
   - **Goodreads:** stopped issuing API keys on 2020-12-08 [S], and `goodreads.com/api` now redirects to the homepage [V].
   - **LibraryThing:** was blocking non-signed-in visitors for "high traffic" on the check date [V].
   - **The StoryGraph** (5M sign-ups by January 2026 [S]) and **Literal:** sit behind Cloudflare challenges [V].
   - **Shepherd.com:** produced a domain-for-sale redirect on one fetch path [V]; its service status is unclear.
   - **Bottom line:** do not plan on scraping these.
8. **Open Syllabus is the best "what do experts assign together" signal, but the useful parts are paywalled.**
   - **Scale (v2.14):** 32.9M syllabi, 147M extracted citations, 4.4M unique works, 69 fields [V].
   - **Free tier:** capped at 2019 data [V].
   - **Subscriptions:** institutional only [V].
   - **Raw co-assignment graph:** not openly downloadable. Anonymized data is available through research-use agreements or commercial licence [V].
9. **Google Books is a lookup service, not a dataset.** It has 40M+ books in 400+ languages (2019) [V]. The API returns at most 40 results per call [V]. Anonymous calls share an already-exhausted global daily quota (HTTP 429 observed), so bring your own key [V]. The 2012 ToS bars charging users without Google's permission [V]. The **Ngram Viewer added a new dataset in July 2024**, and its data is free to use with acknowledgement [V].
10. **Wikidata is a crosswalk, not a catalog.** It has ~523k items typed "literary work", 370k items with an ISBN-13, 497k with an Open Library ID, and only ~5.8k with an LCC property. Scholarly articles (46.0M) now live in a **separate query service** [V, SPARQL 2026-10-15]. Use it to join IDs and to pull "main subject" and genre for canonical works.
11. **Paid metadata is cheap but thin on TOCs.**
    - **ISBNdb:** ~122M books, 19 fields, synopsis included, no TOC. Plans run $14.99/mo (5,000 calls/day, 1 call/s) to $99.99/mo (50,000/day, 5 calls/s) [V].
    - **Library-grade enrichment** (TOCs, summaries, reviews): Syndetics Unbound, sourced from Books in Print and LibraryThing [V]. Sold to libraries, not individuals.
12. **TOC data is the weakest link in open metadata.**
    - **OL:** a `table_of_contents` field exists but is sparse (measured coverage in the table below) [V].
    - **LoC's BEAT program:** produced only tens of thousands of web TOCs (2005-era counts, stale) [V].
    - **ONIX TOCs:** exist in publisher feeds but are not public [K].
    - **Implication:** an LLM pass that detects TOC pages in scans (or in HTRC page features) is a high-leverage build.
13. **Browsing works, and it can be measured.** In OhioLINK circulation data, a book whose shelf neighbour was borrowed is **≥9× more likely to be borrowed** [V, McKay, Smith & Chang 2014]. The authors propose this as the benchmark any virtual browser should match. Björneborn's studies give design levers: 10 serendipity dimensions (2008) and 3 affordances (2017) [V]. Hinze et al. (2012; 65 readers) found readers triage via cover, back cover, TOC and flicking [V].
14. **Virtual shelf browsers are decaying.**
    - Harvard's **StackLife no longer resolves in DNS** [V].
    - **Open Library Explorer** (beta since December 2020: LCC/DDC toggle, 3D shelves with spine thickness from page count) is still linked from OL's navigation [V].
    - Stanford SearchWorks still has call-number "browse related items" [V].
    - **The opportunity:** a modern, LLM-augmented virtual stack is open territory.
15. **Anna's Archive is not a safe dependency.** It lists 71,996,952 books and 239,545,528 papers (2026-10-01) [S]. Against it stand: the **$322M** Spotify/labels default judgment (April 2026), a **$19.5M** publishers' judgment with a global domain takedown (May 2026), and the OCLC injunction (January 2026) [S/V]. Its metadata collections include scraped WorldCat data that a US court ordered deleted [V].

---

## Detailed findings

### 1. Open Library: the open spine

**What it is.** Open Library (OL) is an Internet Archive (IA) project: a wiki-style catalog of *works* (abstract books), *editions* (manifestations) and *authors*, linked to IA scans for lending and reading.

**Scale, from live queries on 2026-10-15** [V unless marked]:

| Measure | Value | How obtained |
|---|---|---|
| Author records | 15,467,818 | `search/authors.json?q=*` |
| Works with an LCC number | 14,734,568 | `search.json?q=lcc:*` |
| Works with a DDC number | 5,855,209 | `search.json?q=ddc:*` |
| Works with any full text (`has_fulltext:true`) | 5,599,290 | search API |
| Works with a public (free) ebook | 1,861,679 | `ebook_access:public` |
| Works borrowable (controlled digital lending) | 2,907,228 | `ebook_access:borrowable` |
| Works print-disabled access only | 830,383 | `ebook_access:printdisabled` |
| Works with a `first_sentence` | 394,847 | search API |
| Works in LCC class Q (Science) | 880,841 | `lcc:Q*` |
| Works in LCC QA273 (probabilities) | 4,746 | `lcc:QA-0273*` |
| Edition records in the 2026-09-30 dump | **{{OL_EDITIONS}}** | full-file stream count (see TOC section) |

**Notes on the table.**

- Total *works* could not be counted via the API: wildcard queries return HTTP 500.
- Older public figures, all stale: "over 20 million records" (≈2015 [S]) and "nearly 38M editions" (2022 [S]).

**Bulk dumps** [V, archive.org item metadata for `ol_dump_2026-09-30`, files dated 2026-10-02]:

| File | Size (gzip) |
|---|---|
| all types, latest revisions | 18.18 GB |
| editions | 12.62 GB |
| works | 4.07 GB |
| authors | 0.78 GB |
| Wikidata crosswalk (new; "currently authors only" per docs) | 0.83 GB |
| reading-log | 0.12 GB |
| redirects | 0.08 GB |
| covers metadata | 0.08 GB |
| lists | 0.06 GB |
| ratings | 0.009 GB |

- **Format:** TSV of `type, key, revision, last_modified, JSON` [V, dumps page, last edited 2025-06-10].
- **Archive:** past dumps are kept at `archive.org/details/ol_exports`.
- **Covers:** bulk covers are on archive.org as tar files (`covers_0000`–`covers_0005` originals, plus S/M/L sizes) [V].

**Licence.** The licensing page states that the Internet Archive "does not assert any new copyright or other proprietary rights over any of the material in the Open Library database," with the caveat that "there may be existing rights issues on some contributions" [V].

- I could not find an explicit CC0 dedication [V: no licence statement on the dumps page].
- For practical purposes the bibliographic data is free to reuse [I, high].
- Cover images are publishers' artwork. Their reuse rests on display or fair-use norms, not on a licence [I].

**APIs and limits** [V, `openlibrary.org/developers/api`]:

- **Available APIs:** Book Search, Search Inside, Covers, Your Books (reading log), Lists, RESTful Work/Edition/Author/Subject/Recent-Changes, plus legacy APIs.
- **Rate limits:** anonymous requests 1/s; identified requests ("`User-Agent: AppName (contact@…)`") get 3×. "Violations may result in aggressive rate limiting or blocking."
- **No bulk harvesting:** "Please do not use our APIs to bulk download metadata." Use the dumps instead.
- **Covers by ISBN/OCLC/LCCN:** limited to "100 requests/IP … every 5 minutes," returning 403 beyond that. Lookups by cover ID or OLID are not limited this way [V, covers API page].
- **Search stack change:** search now returns FastAPI-style validation errors. For example, the query `the` is rejected as "not allowed" [V, live]. This matches Wikipedia's report that web.py components were rewritten in FastAPI in late 2025 [S].

**Classification data quality (an important caveat for shelf browsing)** [V, live API sample]:

- OL normalizes LCC into a sortable padded form, e.g. `QA-0273.00000000.L36 1995`.
- Because a *work* aggregates many editions, one work can carry several LCC numbers across different classes. One work, *Selections* (Leibniz), carries B2555, B2558, B2597, QA273 and QA611.
- `lcc_sort` picks one value, sometimes oddly: one record sorts under `AA-0007…`, a malformed value.
- **Consequence:** a naive "one book, one shelf position" browser built on OL inherits these artefacts. A better design shows a work on *every* shelf where any edition was classed. Section 11 argues this is a feature.

**Open Library Explorer (shelf-browse UI)** [V, OL blog 2020-12-16; S, IA help pages]:

- Built by Drini Cami et al. and launched in beta in December 2020.
- Renders tall shelves that scroll left–right by class and up–down by subclass.
- Toggles between **Dewey and LCC**.
- Supports filters, e.g. "Juvenile" or `subject:biography`, and an ebooks-only filter.
- Has 3D modes in which "each book has the correct thickness determined by its actual number of pages."
- On 2026-10-15, OL's site navigation still listed "Library Explorer: Browse the virtual shelves." My scripted fetch of `/explore` received a "Human Verification" interstitial [V]. I could not confirm whether it is still labelled beta.

**Reading lists.** OL has user Lists (API read/write) and a public Reading Log. Both are exported monthly: the lists dump is 57 MB and the reading-log dump 123 MB, gzipped [V]. These are an open, if noisy, co-reading signal, a weak substitute for Goodreads shelves [I].

**Legal context.**

- *Hachette v. Internet Archive* was affirmed by the Second Circuit on **2024-09-04**. IA did not seek Supreme Court review (December 2024). More than 500,000 books became unavailable for full controlled-digital-lending loans [S].
- This affects *reading access* through OL, not metadata.
- Wikipedia's Open Library article also mentions a "2025 settlement … removal of 500,000 books." That appears to conflate events [I]. See "Contested".

### 2. WorldCat (OCLC): the biggest catalog, closed to tools

**Scale** [V, "Inside WorldCat", figures dated October/November 2025]:

- 609,755,407 bibliographic records and 3,581,565,435 holdings (October 2025).
- 488 languages; English is 39% (236.22M records).
- Growth over July 2024–June 2025: +7.26% records.
- No 2026 figures were on the page on 2026-10-15 [V].

**Access terms.**

- OCLC web-service production access is "typically available to employees of qualifying institutions at no additional charge for non-commercial use." Qualifying institutions are OCLC member libraries that contribute to and are visible in WorldCat [V].
- WorldCat Search API v1 support ended 2024-12-31 [V]. The v2 API is likewise tied to institutional subscriptions [V for v1; v2 eligibility I, ~85%].
- OCLC's API catalogue lists 35 APIs (Dewey Linked Data, Entity APIs for "Meridian", etc.), none of which is an open public search API [V].
- OCLC Classify (free ISBN→DDC/LCC lookup) is gone. `classify.oclc.org/classify2/` now redirects to an OCLC "page not found" [V, 2026-10-15]. The retirement date was early 2024 [K, ~85%].

**Legal status of scraping (primary source: Opinion and Order, S.D. Ohio, No. 2:24-cv-144, Doc. 58, filed 2026-01-15)** [V]:

- **Allegations:**
  - Anna's Archive began "scraping and harvesting WorldCat.org" in October 2022, causing "persistent attacks for roughly a year."
  - It used bots that appeared to be "legitimate search engine bots from Bing and Google."
  - WorldCat.org's terms bar users from using "such data for commercial use, harvest material amounts of data, to distribute, display, or disclose the data, or store the data."
- **Rulings:**
  - Judge Michael H. Watson granted default judgment on **breach of contract**: a browsewrap agreement was enforceable because the defendant was a "sophisticated party" scraping daily.
  - Default judgment was also granted on **trespass to chattels**: the scraping "crashed its website, slowed it, and damaged the servers."
  - Unjust enrichment and tortious interference were denied.
- **Injunction:** a permanent injunction bars scraping, storing or distributing WorldCat data, and "encouraging others" to do so. It orders deletion of all copies "including all torrents." OCLC had dropped its damages claim.
- **Lesson for builders:** the court treated catalog *data* as within copyright subject matter for preemption purposes. Contract and trespass claims still survived. Scraping catalog sites with terms of use carries contract risk even when the facts are uncopyrightable [I].

### 3. Library of Congress: classification and subject headings as navigation

**Why LCC/LCSH matter.**

- **LCC** is a 21-class enumerative shelf order: A–H, J–N, P–V, Z, as confirmed by the file split in the id.loc.gov embeddings [V]. It is the de facto physical arrangement of US research libraries.
- **LCSH** (LC Subject Headings) is a thesaurus with broader, narrower and related links, i.e. a navigable graph.
- **Together** they give a pre-built, expert-curated "map of knowledge" with two complementary topologies:
  - a *linear* order (shelf adjacency);
  - a *graph* (subject relations).

**Free assets** [V]:

| Asset | What you get | Size / date | URL |
|---|---|---|---|
| id.loc.gov bulk downloads | LCSH, LCNAF (names), Children's SH, LCGFT (genre/form), LCDGT, LCMPT, BIBFRAME Hubs, MARC code lists, etc. Formats: MADS/RDF and SKOS in JSON-LD, N-Triples, Turtle, XML; weekly incrementals | LCSH MADS JSON-LD 141 MB gz; LCNAF MADS JSON-LD 5 GB gz; BIBFRAME Hubs JSON-LD 2 GB gz; incrementals through 2026-10-03 | https://id.loc.gov/download/ |
| LoC experimental embeddings (new) | Per-record 1024-d vectors (Amazon Titan Text Embeddings V2) + `{Title, Creator, LCCCode, LCCN}`; one file per LCC class + "no LCC" | 22 files, ≈190 GB gz total (P = 32 GB; H = 20 GB; no-LCC = 31 GB; V = 471 MB, last-modified 2026-09-22) | https://id.loc.gov/download/ |
| Free LCC schedules | Print-ready PDFs per class, plus outlines and tables | Data "selected in May 2024"; page updated 2026-02-10 | https://www.loc.gov/aba/publications/FreeLCC/freelcc.html |
| MDSConnect | ~25 million MARC records (Books All, Names, Subjects, Serials, …), UTF-8/XML | From the 2016 retrospective set (stale for post-2016 books) | https://www.loc.gov/cds/products/marcDist.php |
| Classification Web | Subscription; daily-updated LCC/LCSH/names, LC↔Dewey correlations; 30-day free trial; price on a separate page (not retrieved) | 2026 | https://www.loc.gov/cds/classweb/ |

**The embeddings are a strategic asset for Open Stacks.**

- They let you compute "semantic neighbours" of any LoC-catalogued book without running your own embedding pipeline.
- They let you compare *semantic* adjacency with *classification* adjacency, i.e. "where does the shelf order put related books far apart?"
- **Licence:** the id.loc.gov "About" page states that LoC "has prepared this linked data system and is making it available as a **public domain data set**," provided "AS IS" [V]. The embeddings sit in the same service's download area, so the same terms probably apply [I, ~75%].
- **What I could not determine:** which text fields were embedded (title only, or title + subjects + summary) and the release announcement.
- **Size estimate:** sampling the first 300 KB of the class-V file gave 31 records, ≈9.7 KB per record compressed. That implies **~19–20M records in total** [I, ±20%].

**DDC vs LCC for builders.** Dewey is owned by OCLC, which offers paid and linked-data Dewey services [V, the OCLC API list includes "Dewey Linked Data" and "Dewey Lookup"]. LCC and LCSH are free from LoC. For an open tool, **LCC is the safer navigational spine** [I, high].

### 4. "Which page discusses X" without the text

#### 4a. HathiTrust full-text search (search-only volumes)

- HathiTrust indexes the full text of all digitized volumes, including in-copyright "Limited (search-only)" ones.
- For those, results show **the page numbers on which the term appears and how many times it appears**, without displaying the page [S, Vita Brevis 2014 (stale?); FSU guide updated 2024-10-09: "the full-text search will tell you which page(s) include your keywords"].
- The *Authors Guild v. HathiTrust* Second Circuit ruling (2014-06-10) treated full-text search as transformative fair use [S].

**Collection size, tabulated from the full Hathifiles (`hathi_full_20261001.txt.gz`, 1.23 GB, created 2026-10-01)** [V]:

| Measure | Count |
|---|---|
| Volume records (rows) | **19,701,406** |
| Distinct HathiTrust bibliographic records (≈ titles) | 9,745,536 |
| Access = allow (full view) | 8,293,334 (42.1%) |
| Access = deny (search-only / limited) | 11,408,072 (57.9%) |
| Rights `ic` (in copyright) | 10,366,655 |
| Rights `pd` (public domain worldwide) | 5,870,879 |
| Rights `pdus` (public domain in US only) | 2,297,084 |
| Rights `und` (undetermined) | 964,698 |
| Creative Commons (all CC codes) | ≈96,500 |
| Format BK (books) / SE (serials) | 12,836,413 / 6,628,971 |

Secondary sources lag. Wikipedia cites "more than 18 million volumes … 6.7 million in the US public domain" (September 2024) [S]. A June 2025 conference deck says ">18 million items, ~40% public domain" [S].

**Access caveat.**

- On 2026-10-15, a scripted request to `babel.hathitrust.org/cgi/ls` (full-text search) received a **Cloudflare managed challenge** (HTTP 403, "Just a moment…") [V].
- `www.hathitrust.org` pages also returned 403 to my fetchers. The Hathifiles bulk files remained downloadable [V].
- An interactive human user is unaffected. A tool that programmatically calls HathiTrust search should expect to be blocked, and should ask HathiTrust about sanctioned access [I].

#### 4b. HTRC Extracted Features 2.5: page-level "fingerprints" for 18.7M volumes

From the HTRC EF 2.5 documentation page and Confluence REST API [V]:

| Field | Value |
|---|---|
| Volumes | **18,725,868** (one JSON-LD file per volume) |
| Pages | **6,867,699,164** |
| Tokens | **3,255,304,293,468** |
| In-copyright volumes / pages / tokens | 9,969,251 / 3,561,896,776 / 1,656,479,697,589 |
| Public domain + Creative Commons volumes | 7,816,840 |
| Snapshot | HathiTrust corpus as of **April 2025**; announced 2025-07-24 [S, NDL Current Awareness] |
| Size | **4.4 TB** bzip2 (EF 2.0 was 4 TB / 17,123,746 volumes) |
| Licence | **Creative Commons Attribution 4.0** |
| Citation | Walsh et al. (2025), doi:10.13012/PXP0-F135; "accessed on" date required because EF 2.5 is "designed to be updated incrementally under the same version number" |
| Download | `rsync` from HTRC servers; per-volume paths ("stubbytree"); full path list in `htrc-ef-all-files.txt`; Python `htrc-feature-reader` (provides `htid2rsync`); or via HTRC Analytics worksets |

**Per-page fields (EF 2.0 schema, identical in 2.5)** [V]:

- **Page-level:** `seq` (scan sequence), a content hash `version`, `calculatedLanguage`, `tokenCount`, `lineCount`, `emptyLineCount`, `sentenceCount`.
- **Per section** (separate **header**, **body** and **footer**):
  - `beginCharCount` and `endCharCount` (first/last characters of lines with counts);
  - **`tokenPosCount`**: every token with its part-of-speech tag and count.
- **Tokenizer and tagger:** Stanford NLP, used for ar, zh, en, fr, de and es; other languages get a whitespace tokenizer.

**What this enables for an in-copyright book with no legal text access** [I]:

- **Exact term-frequency profiles per page.** E.g. "pages 212–219 of this 1987 statistics text use *calibration* 14 times."
- **TF-IDF/BM25 page ranking across 18.7M volumes.**
- **TOC/index page detection.** Lines ending in digits are visible in `endCharCount`, and number-dense pages stand out.
- **Chapter-boundary heuristics.**
- **Running-header capture.** Header tokens often hold chapter titles, giving a rough TOC proxy.
- **A real limitation:** EF counts are unigram bags. You cannot search phrases. You can intersect co-occurring tokens per page.

**Companion datasets** [V]:

- **HTRC BookNLP Dataset for English-Language Fiction (2023):** 201,527 volumes (90,857 in copyright), 451.2 GB, CC BY 4.0. Contains entities, characters and similar derived data.
- **"Word Frequencies in English-Language Literature, 1700–1922"** and **"Geographic Locations in English-Language Literature, 1701–2011"** are also published [V, titles only].

#### 4c. Internet Archive / Open Library search-inside

- **Endpoint:** `openlibrary.org/search/inside.json?q=…` returns Elasticsearch hits from index `fts_main` [V, live].
- **Per hit:**
  - the IA identifier, title, creator, publisher and year;
  - `page_num`;
  - highlighted passages, e.g. "is an example of {{{base-rate neglect}}}";
  - aggregations by year, language, creator and collection.
- **Coverage includes in-copyright scans.** For "base rate neglect", 469 of the 472 hits were in IA's `printdisabled` collection and 151 in `inlibrary` (lending) [V]. So the index spans modern books that cannot be read freely.
- A lower-level per-volume API (`fulltext/inside.php` on IA data nodes) returns paragraph text with page numbers and word bounding boxes for highlight overlays [V, OL docs; labelled experimental].
- **Corpus context** [V, IA advanced-search API, 2026-10-15]: IA holds 52,719,542 `texts` items; 5,456,210 are in `printdisabled` and 4,414,051 in `inlibrary`.
- **Practical note:** snippets are short. Using them to build a substantial text corpus would raise copyright and terms issues. Use them for *locating* passages, then read through legitimate access (borrowing, library, purchase) [I].

#### 4d. Google Books

- **Scale:** "more than 40 million books in over 400 languages" (Google blog, 2019-10-17) [V (stale?)].
- **Viewability modes:** full view, preview, snippet view (2–3 lines around the term) and no preview [S].
- **API** [V, docs updated 2025-08-28]:
  - `maxResults` default 10, maximum 40.
  - Filters: `partial`, `full`, `free-ebooks`, `paid-ebooks`, `ebooks`; `download=epub`.
  - An API key or OAuth is needed.
  - **On 2026-10-15 an anonymous call returned HTTP 429** "Quota exceeded … 'Queries per day'" for a shared consumer project [V]. Anonymous use is unreliable; register a key. The commonly cited default of 1,000 queries/day per project [K, ~60%] could not be confirmed on the docs page.
- **ToS** (last updated 2012-04-25): "You may not charge users any fee for the use of your application" without Google's agreement. You must honour removal requests [V].
- **Search inside:** Google's web UI exposes in-book search for preview and snippet books. The API exposes `searchInfo.textSnippet` for queries [K, high].
- **Ngram Viewer** [V, `books.google.com/ngrams/info`]:
  - Corpora: 2009, 2012, 2019 (February 2020) and **a new dataset added July 2024**. Older corpora are still reachable via suffixes such as `:eng_2019`.
  - Queries up to 7 words.
  - Downloadable n-gram files.
  - "Use of graphs and data is free for any purpose," with acknowledgement appreciated.
  - The page does not name the 2024 corpus or its year range.
- **Foundational paper:** Michel et al., *Science*, 2011-01-14 [V via Crossref].

### 5. Table-of-contents (TOC) data sources

| Source | Coverage | Access | Notes |
|---|---|---|---|
| Open Library `table_of_contents` (edition field) | **{{OL_TOC}}** of {{OL_EDITIONS}} editions (2026-09-30 dump) [V, my count] | Free dump/API | Free-text or structured entries with titles, sometimes page numbers; quality varies; edited by volunteers and imported from MARC 505 |
| Library of Congress MARC 505 (formatted contents note) | Unknown share of LoC records [I: substantial for multi-author volumes] | Free via MDSConnect (2016 snapshot) | BEAT's machine-generated TOC project enriched 505 fields [V] |
| LoC BEAT web TOCs | dTOC ≈30,000; ONIX TOC ≈50,000; ONIX descriptions ≈110,000; sample texts ≈17,000 (counts as of ~2005) [V (stale)] | Free web pages linked from LoC catalog | Program page appears frozen since ~2005 |
| ONIX for Books feeds (publisher → retailer) | Most trade books with active metadata [K] | Licensed (retailer/aggregator agreements) | ONIX 3.0/3.1 standard by EDItEUR [V]; carries descriptions, TOC text, contributor bios, Thema/BISAC subjects [K, high] |
| Syndetics Unbound (ProQuest) | Large (library-grade) | Library subscription | "Backed by … Books in Print and LibraryThing"; Look Inside, recommendations [V] |
| Google Books web "Contents" | Many preview books [K] | Web only; API does not expose TOC [K] | |
| Derived: TOC-page detection from scans or HTRC EF | All 18.7M HathiTrust volumes [I] | Build it | Numeric line endings in `endCharCount` + page position (first ~15 pages) → candidate TOC pages; text from full-view scans only |
| ISBNdb | Not offered [V: field list has no TOC] | Paid API | Synopsis yes |

### 6. Social and curated discovery sites

| Service | Scale (date) | API / data access (2026) | Status notes | Source |
|---|---|---|---|---|
| **Goodreads** (Amazon) | >150M members (September 2023) [S (stale?)] | **No public API.** New keys stopped 2020-12-08; old keys >30 days unused were deactivated [S]; `/api` now redirects to the homepage [V] | Data available only via personal CSV export [K] | Wikipedia; live check |
| **LibraryThing** | ~2.6M users, >155M books catalogued (February 2021) [S (stale)] | Historic APIs (thingISBN, Common Knowledge, JSON widgets) [K]; status could not be checked | On 2026-10-15 the site showed "we have temporarily turned off browsing for visitors who are not signed in" (high traffic) [V]. Free to all since 2020-03-08 [S]. Data feeds Syndetics Unbound [V] | Wikipedia; live check |
| **The StoryGraph** | 4M sign-ups (April 2025) → **5M (January 2026)** [S] | No public API known [K]; Cloudflare challenge on scripted access [V] | Plus was $50/yr in 2023 [S (stale?)]; Kobo reading-progress sync planned from June 2026 [S] | Wikipedia |
| **Literal** (literal.club) | Unknown | Formerly a public GraphQL API [K, ~60%] | Cloudflare challenge on 2026-10-15; operating status not verified [V for the challenge only] | live check |
| **Five Books** | >1,700 interviews, ~8,000 recommendations; ≥2 new per week [V] | No API | Expert-explained picks: high-signal curated lists [I] | fivebooks.com/about |
| **Shepherd** (shepherd.com) | Unknown | No API known | **Unclear:** one fetch path got a 302 to a domain broker listing "Shepherd.com is for sale" [V], while direct requests got a Cloudflare challenge [V]. Service may have closed or changed hands [~50%] | brannans.com; live check |
| **Bookshop.org** | >$35M generated for local stores (January 2025) [S] | Affiliate program (10% commission to affiliates; 30% off cover price for stores) [S]; no public catalog API known [K] | Ebooks launched January 2025; UK audiobook subscription July 2026 [S] | Wikipedia |

**Implication** [I]:

- For tools, the "social graph of reading" is now mostly locked away. The open substitutes are:
  - OL reading logs, lists and ratings (monthly dumps);
  - Open Syllabus co-assignment (licensed);
  - curated expert lists (Five Books);
  - a user's own exports (Goodreads/StoryGraph CSV).
- A personal tool should ingest the user's own CSV export rather than any platform API.

### 7. Open Syllabus

**Dataset v2.14** [V, docs.opensyllabus.org]:

- ~32.9M syllabi, ~48B words of full text.
- Collected from ~11,000 colleges and universities; the institution table holds 22,238 institutions.
- ~75% of syllabi are from the US, UK, Australia and Canada; mostly 2010 onward.
- **147M** extracted citations resolving to **4.4M unique works**, matched against ~100M bibliographic records.
- 750M document sections; 69 CIP-based fields.

**Tools** [V]:

- **Analytics** replaced the old "Syllabus Explorer."
- **Galaxy** is a "Co-Assignment Galaxy" map of the top ~1M titles, grouped by how often they are assigned together.
- **Course Matcher.**
- A print store.

**Access and pricing** [V, about-accounts]:

- **Free:** data capped at 2019, syllabi not shown, advanced features blocked.
- **30-day trial.**
- **Subscriptions:** annual and institutional only ("Individual subscriptions aren't offered"). US libraries can subscribe through Lyrasis.
- **Prices:** none published. Pricing "depends mainly on organization type, size, and location."
- **Research access:** "limited, anonymized versions of the dataset" for university-based researchers under a research-use agreement, with more requests than they can handle [V].
- **Commercial licensing:** anonymized metadata and book rankings are licensed to publishers [V].
- **Terms:** Open Syllabus "does not license access to the original documents" [V].

**Why it matters for Open Stacks** [I]: co-assignment is a strong, expert-generated similarity signal ("books professors teach together"). It also gives a *canon-ness* measure per field, which is useful for "what are the 30 books everyone in decision theory assigns?" The free 2019-capped tier is adequate for older canon. For a production tool, ask Open Syllabus about a research agreement.

### 8. Book summary services

| Service | Price (2026) | Coverage | Notes | Source |
|---|---|---|---|---|
| **Shortform** | $24.00/mo monthly, or $16.42/mo billed annually | "12,000+ books covered," 1,000+ article/topic guides; ~3 new book guides weekly | Calls its products "guides," not summaries; audio, highlights, PDF download | [V] shortform.com/pricing |
| **Blinkist** (Go1, acquired May 2023) | Not retrieved (site behind Cloudflare challenge) | "Over 6,500 titles" in English/German/Spanish [S, undated] | 15-minute "Blinks" | Wikipedia |
| **getAbstract** | Personal plans exist (not retrieved; old pricing URL 404s) | "100K+ verified knowledge pieces," 850+ publishers, 8 languages [V] | Repositioned as "the verified knowledge layer for enterprise AI": connectors for Microsoft 365 Copilot, **MCP**, API; "100% rights-cleared … no open-web scraping" [V] | getabstract.com |

**Assessment** [I]:

- Summary services cover the business and self-help bestseller head: roughly 10^4 titles, against ~10^7 works in OL.
- They have almost no coverage of textbooks, monographs or older scholarship. That limits their value for this reader's use case.
- getAbstract's pivot to licensed, MCP-delivered summaries for AI agents is a revealing market signal: *rights-cleared summaries are becoming an AI-input product*.
- **For Open Stacks**, LLM-generated "what this book argues + which chapters matter" briefs, grounded in TOC plus page-level features plus reviews, can cover the long tail these services ignore.

### 9. Wikidata for books

**Model** [V, WikiProject Books]:

- Two levels: **work** (instance of written work, Q47461344, or subclasses) and **edition** (Q3331189), linked by P629/P747.
- Key properties: P50 author, P921 main subject, P136 genre, P1036 Dewey, P1149 LCC, P648 Open Library ID, P212 ISBN-13, P243 OCLC number, P675 Google Books ID, P724 Internet Archive ID, P8383 Goodreads work ID.

**Counts** [V, SPARQL, 2026-10-15]:

| Measure | Count |
|---|---|
| Items with P31 = literary work (Q7725634), direct | 522,592 |
| Items with P31 = written work (Q47461344), direct | 168,853 |
| Items with P629 "edition of" | 243,359 |
| Items with ISBN-13 (P212) | 370,068 |
| Items with an Open Library ID (P648) | 496,710 |
| Items with LCC (P1149) | 5,754 |
| Scholarly articles (Q13442814) on the **main** endpoint | 0 (moved) |
| Scholarly articles on `query-scholarly.wikidata.org` | 46,008,748 |

**Use** [I]:

- An ID hub for canonical works: OL ↔ Goodreads ↔ OCLC ↔ IA ↔ Wikipedia.
- Rich "main subject" links for notable books.
- Author biographical data.
- Wikidata's data is CC0 [K, high].
- **Not** a catalog of the long tail.

### 10. Paid metadata

| Provider | Size | Fields | Price / limits | Source |
|---|---|---|---|---|
| **ISBNdb** | "nearly 122 million unique books" | Up to 19 fields: ISBN-10/13, title, author, publisher, date, pages, binding, edition, format, language, list price, cover thumbnail, subject, weight, dimensions, **synopsis**; no TOC | Basic $14.99/mo ($149/yr): 5,000 calls/day, 1 call/s, 100 results per bulk call. Premium $35.99/mo: 15,000/day, 3/s. Pro $99.99/mo: 50,000/day, 5/s. Academic/non-profit $7.50/mo: 2,000/day. Free account: no API | [V] isbndb.com/isbn-database |
| **Syndetics Unbound** (ProQuest/Clarivate) | Library-grade enrichment | TOCs, summaries, reviews, series, "Look Inside," recommendations | Library subscription only | [V] proquest.syndetics.com |
| **Bowker Books in Print**; NielsenIQ BookData; Baker & Taylor | Trade-wide | ONIX-derived descriptions, subjects, availability | Enterprise/library contracts | [K] |
| **OCLC WorldCat APIs** | 610M records | Full MARC/BIBFRAME, holdings | Member institutions | [V] |

### 11. Virtual shelf-browse implementations

| System | Approach | Status (2026-10-15) | Source |
|---|---|---|---|
| **Harvard StackLife / StackView / LibraryCloud** | Infinite vertical "stack" of spines sorted by call number; spine width/colour encode page count and "ShelfRank" (use) [K]; LibraryCloud as metadata backend [V, GitHub README; MIT/GPLv3 dual licence, 2012] | **`stacklife.harvard.edu` no longer resolves (DNS ENOTFOUND)** [V]. LibraryCloud Item API still documented (12.7M Alma bib records) but returned HTTP 403 to my scripted request [V]. Harvard offers **CC0 bulk MARC for 12.7M records** via Dataverse [V] | GitHub; Harvard Library APIs page |
| **Open Library Explorer** | 2D/3D shelves by LCC or DDC; filters; thickness from page count | Linked in OL nav; bot interstitial on scripted fetch | OL blog 2020; live check |
| **Stanford SearchWorks** (Blacklight) | "Browse related items": call-number-ordered list (~50 items/page) with previous/next shelf paging | Live [V]; scripted JSON access blocked by an F5 bot challenge [V] | searchworks.stanford.edu/browse |
| **The Online Books Page** (UPenn) | "Virtual shelves" by LC call number; each book currently has only one call number, so it appears in one place | Live [V] | onlinebooks.library.upenn.edu |
| **Ex Libris Primo "Virtual Browse"**, other discovery layers | Carousel of call-number neighbours on the record page | Widely deployed in academic libraries [K] | — |

**Lesson** [I]:

- Every implementation inherits single-classification placement.
- Every one is bound to a single library's holdings.
- **None exploits** usage signals (co-borrowing, co-assignment), semantic neighbours (embeddings) or page-level content (HTRC EF).
- A cross-library, multi-placement, semantically augmented virtual stack is unbuilt.

### 12. Research on browsing physical stacks and serendipity

**McKay, Smith & Chang (2014), "Lend me some sugar: Borrowing rates of neighbouring books as evidence for browsing," JCDL 2014** (doi:10.1109/jcdl.2014.6970161) [V, accepted manuscript]:

- **Data:** OCLC's public OhioLINK circulation dataset (2007–08 loans, mostly academic open-stack libraries). Each book was compared with its ten shelf neighbours.
- **Finding:** "a nearby book being loaned increases the probability of a loan by at least 9-fold." The effect is "independent of both book topic subject and time."
- **Benchmark proposed:** "less than a 9-fold increase in a pairwise comparison matched by location means a poorer return than a physical library."
- **Why it matters:** this is the cleanest quantitative evidence that shelf adjacency drives discovery. It also gives a **testable target** for any virtual-stack tool.

**Hinze, McKay, Vanderschantz, Timpany & Cunningham (2012), "Book selection behavior in the physical library: implications for ebook collections," JCDL 2012** (doi:10.1145/2232817.2232874) [V, full text]:

- **Participants:** 65 readers at three academic and government libraries, 51 of them observed in the stacks.
- **Shelf strategies:** "scanning a section," "sampling the shelf," standing and examining shelves above, at and below eye level, plus serendipitous display encounters.
- **Triage:** readers valued the **TOC**, the back cover, the index and flicking through. All observed participants interacted with books beyond the spine.
- **Contrast with digital libraries:** browsing "hundreds of books on a physical shelf in seconds has been reduced to slowly limping from one keyhole view to another."

**McKay, Chang & Smith (2017), "Manoeuvres in the dark," CHIIR 2017** (doi:10.1145/3020165.3020179) [V, metadata/TLDR only]: an empirical study of the mechanics of shelf browsing. It notes "the large number of books browsers consider."

**Björneborn (2008), "Serendipity dimensions and users' information behaviour in the physical library interface," *Information Research* 13(4)** [V (stale?, but foundational)]:

- **Method:** ten months of observation at two Danish public libraries, with 113 interviewees.
- **Ten dimensions:** unhampered access, diversity, display, contrasts, pointers, imperfection, cross contacts, multi-reachability, explorability, stopability.
- **Observations:**
  - About half of users were purely goal-directed.
  - Tilted, cover-out displays and "misshelved" adjacencies produced finds.
  - Material left on tables became social navigation.

**Björneborn (2017), "Three key affordances for serendipity," *Journal of Documentation* 73(5):1053–1081** [V, abstract]:

- **Three affordances:** diversifiability, traversability and sensoriability, paired with the personal factors curiosity, mobility and sensitivity.
- Serendipity cannot be engineered, only afforded.
- Physical spaces may excel at sensoriability, digital ones at traversability.

**Also foundational:**

- Foster & Ford (2003), "Serendipity and information seeking: an empirical study," *J. Documentation* [V via Crossref].
- Makri & Blandford (2012), "Coming across information serendipitously," Parts 1–2, *J. Documentation* [V via Semantic Scholar; 199 citations]: a process model of serendipity.

**Synthesis** [I]: three properties of physical stacks are routinely lost online.

1. **Bandwidth:** you scan hundreds of spines in seconds.
2. **Arbitrary but stable adjacency:** classification places a book among neighbours you would never have searched for.
3. **Sensory triage:** cover, heft, TOC, flicking.

LLM-era tools can restore (1) with dense spine walls, (2) with multiple overlaid adjacency orders, and (3) with instant TOC, "flick" and summary previews.

### 13. Why bookstore curation works

- **US independent bookstores** grew from **1,651 (2009) to 2,227 (2015)**, a 35% rise, per the ABA via Wikipedia [S (stale?)].
- **Raffaelli's HBS research** credits that growth to the buy-local movement, **curation of interesting titles**, and community events [S]. The "3 Cs" framing (community, curation, convening) is his [K, ~80%].
- **Barnes & Noble under James Daunt** (since 2019) moved buying and display decisions to stores, making them "more like independent shops." It opened ~60 stores in 2024 and announced ~60 more for 2026; CNN reported a 7% traffic increase attributed to store-level curation [S].
- **Interpretation** [I]: curation works because it does three things at once.
  - It is a **trusted, small, opinionated filter** (a table of 30 books, not 30,000).
  - It **signals local taste** (staff picks with handwritten reasons).
  - It **creates physical adjacency across categories** (front tables mix genres), which is Björneborn's "contrasts" and "cross contacts."
- **Design translation:** the right unit for an LLM curator is a "front table." A small, explained, cross-category set is better than an infinite ranked list.

### 14. Anna's Archive metadata: factual legal note

**Scale and formats** [S]:

- Anna's Archive aggregates shadow-library files and **metadata scraped from WorldCat (reported October 2023), Google Books, Open Library and others**.
- As of 2026-10-01 it listed 71,996,952 books and 239,545,528 papers, with ~1.1 PB of torrents.
- Metadata ships in "Anna's Archive Containers" (zstd-compressed JSONL; introduced August 2023).

**Litigation** [S/V]:

| Case | Status |
|---|---|
| OCLC (Ohio) | Permanent injunction and deletion order, 2026-01-15 [V] |
| Spotify and major labels (S.D.N.Y.) | $322M default judgment and service-provider injunction, ~2026-04-14/15 [S] |
| 13 publishers | $19.5M default judgment and global domain takedown, 2026-05-19 [S] |

- Domains `.org`, `.se` and `.li` were suspended or lost; mirrors continue [S].
- The site also reportedly sold high-speed bulk access to LLM-training groups [S].

**For Open Stacks:**

- Do not ingest or redistribute Anna's Archive metadata or files.
- In particular, its WorldCat-derived records are subject to a US court deletion order.
- Legal open equivalents exist for nearly everything a discovery tool needs: OL, LoC, HathiTrust, Harvard CC0 MARC, Wikidata [I, high].

### Deliverable: metadata sources compared

| Source | Size (date) | TOC? | Subjects/class | Descriptions | Covers | Page-level? | Licence | API rate limits | Bulk dump |
|---|---|---|---|---|---|---|---|---|---|
| **Open Library** | {{OL_EDITIONS}} editions; 15.47M authors; 14.73M works with LCC (2026-09/10) [V] | Sparse ({{OL_TOC_PCT}} of editions) [V] | Subjects; LCC (14.7M works); DDC (5.9M) | Yes, on many works/editions ({{OL_DESC_PCT}} of editions) | Yes (Covers API; bulk tars) | Via search-inside (snippets + page numbers) | No new rights asserted (≈public) | 1 req/s; 3 req/s identified; covers by ISBN 100/5 min | **Monthly** (12.6 GB editions gz) |
| **HathiTrust Hathifiles** | 19.70M volumes / 9.75M bib records (2026-10-01) [V] | No | None in Hathifiles (26 fields incl. OCLC/ISBN/LCCN/lang) [V]; LCC only in full MARC records [K] | No | No | Full-text search shows page hits (UI) [S] | Metadata freely downloadable [V] | babel UI behind Cloudflare [V] | Monthly full + daily updates (1.23 GB gz) |
| **HTRC Extracted Features 2.5** | 18.73M volumes; 6.87B pages; 3.26T tokens (April 2025 snapshot) [V] | Inferable (TOC-page detection) [I] | Volume metadata (JSON-LD, LoC/VIAF links) | No | No | **Yes:** per-page POS token counts, line/sentence counts, header/body/footer | **CC BY 4.0** | rsync (no API limit stated) | 4.4 TB bz2 |
| **LoC id.loc.gov vocabularies** | LCSH, LCNAF, LCGFT, … (weekly increments to 2026-10-03) [V] | — | **Is** the subject/name authority | Scope notes | — | — | **Public domain data set** [V] | Not stated | Yes (RDF/JSON-LD) |
| **LoC embeddings (experimental)** | ≈19–20M records [I]; ≈190 GB gz [V] | No | LCC code per record | No | No | No | Probably public domain, as id.loc.gov data [I, ~75%] | — | Yes, 22 JSONL files |
| **LoC MDSConnect MARC** | ~25M records (2016 retrospective) [V] | MARC 505 where present | LCC + LCSH | Some (520) | No | No | Free [V] | — | Yes (stale since 2016) |
| **Harvard Library bulk MARC** | 12.7M bib records [V] | 505 where present | LCC/LCSH | Some | No | No | **CC0** [V] | LibraryCloud API (403 to scripts) | Yes (Dataverse) |
| **WorldCat** | 609.8M records; 3.58B holdings (October 2025) [V] | Some (505) | Yes | Some | Some | No | OCLC terms; no harvesting | Members only | No (scraping enjoined) |
| **Google Books API** | 40M+ books (2019) [V] | No (API) [K] | `categories` (BISAC-ish) | Yes | Thumbnails | Snippet per query | ToS: no fee to users without agreement | Per-key daily quota; anonymous quota exhausted [V] | No |
| **IA advanced search / metadata** | 52.7M text items [V] | No | Subjects as tagged | Some | Yes | **Yes** (search-inside, page numbers) | IA terms | Not stated | Partial (OL dumps) |
| **Wikidata** | ~0.5M literary works; 370k ISBN-13 items [V] | No | P921 main subject; P1036/P1149 | Wikipedia links | Commons images (some) | No | **CC0** [K] | WDQS ~60 s query timeout [K] | Yes (weekly JSON dumps) [K] |
| **ISBNdb** | ~122M books [V] | **No** | Subjects | Synopsis | Thumbnail | No | Commercial | 1–5 calls/s; 2k–50k/day by plan [V] | No (bulk = 100–1,000 results/call) |
| **Open Syllabus** | 4.4M works; 147M citations; 32.9M syllabi (v2.14) [V] | No | 69 fields | No | No | No | Proprietary; research agreements | Analytics UI; free tier to 2019 | No (licence) |
| **Syndetics / Books in Print** | Trade-wide | **Yes** | Yes | Yes | Yes | "Look Inside" | Library licence | — | No |
| **ONIX (publisher feeds)** | All active trade titles [K] | **Yes** (TOC text type) [K] | Thema/BISAC | Yes | Yes | No | Trade licences | — | Via aggregators only |
| **Anna's Archive** | 72M books (2026-10-01) [S] | Partial | Mixed | Mixed | Mixed | No | **Legally encumbered** (injunctions) | — | Torrents (do not use) |

---

## Numbers that matter

| Fact | Value | Date of info | Source | Label |
|---|---|---|---|---|
| WorldCat bibliographic records | 609,755,407 | October 2025 | oclc.org Inside WorldCat | V |
| WorldCat holdings | 3,581,565,435 | October 2025 | same | V |
| HathiTrust volume records | 19,701,406 | 2026-10-01 | Hathifiles (my count) | V |
| HathiTrust full-view share | 42.1% (8,293,334) | 2026-10-01 | Hathifiles (my count) | V |
| HathiTrust distinct bib records | 9,745,536 | 2026-10-01 | Hathifiles (my count) | V |
| HTRC EF 2.5 volumes / pages / tokens | 18,725,868 / 6,867,699,164 / 3.255 T | April 2025 snapshot | HTRC docs | V |
| HTRC EF 2.5 in-copyright volumes | 9,969,251 | April 2025 | HTRC docs | V |
| HTRC EF 2.5 compressed size | 4.4 TB | 2025 | HTRC docs | V |
| Mean pages per HathiTrust volume | ≈367 | derived | 6.87B / 18.73M | I |
| Mean tokens per page | ≈474 | derived | 3.255T / 6.87B | I |
| Open Library editions | {{OL_EDITIONS}} | dump 2026-09-30 | my count | V |
| Open Library authors | 15,467,818 | 2026-10-15 | OL API | V |
| OL works with LCC / DDC | 14,734,568 / 5,855,209 | 2026-10-15 | OL API | V |
| OL works with public ebook / borrowable | 1,861,679 / 2,907,228 | 2026-10-15 | OL API | V |
| OL editions dump size | 12.62 GB gz | 2026-09-30 | archive.org | V |
| OL API limit | 1 req/s anonymous; 3 req/s identified | 2026 | OL developers page | V |
| OL covers-by-ISBN limit | 100 requests / IP / 5 min | 2026 | OL covers docs | V |
| IA text items | 52,719,542 | 2026-10-15 | IA advanced search | V |
| IA print-disabled / lending texts | 5,456,210 / 4,414,051 | 2026-10-15 | IA advanced search | V |
| LoC embeddings total | ≈190 GB gz; 1024-d Titan V2 | files 2025 (V file modified 2026-09-22) | id.loc.gov | V |
| LoC embeddings records (est.) | ≈19–20M | — | sampling | I |
| LoC free MARC (MDSConnect) | ~25M records (2016) | 2016 snapshot | loc.gov | V |
| Harvard CC0 MARC | 12.7M bib records | 2026 page | library.harvard.edu | V |
| Google Books scanned | >40M, 400+ languages | 2019-10-17 | Google blog | V (stale?) |
| Google Books API max results/call | 40 | docs 2025-08-28 | Google developers | V |
| Open Syllabus | 32.9M syllabi; 147M citations; 4.4M works | v2.14 (2026) | docs.opensyllabus.org | V |
| Open Syllabus free tier | data through 2019 only | 2026 | blog.opensyllabus.org | V |
| Wikidata literary works (direct P31) | 522,592 | 2026-10-15 | SPARQL | V |
| Wikidata items with OL ID | 496,710 | 2026-10-15 | SPARQL | V |
| ISBNdb size | ~122M books | 2026 | isbndb.com | V |
| ISBNdb cheapest API plan | $14.99/mo, 5,000/day, 1 call/s | 2026 | isbndb.com | V |
| Shortform price | $24/mo, or $16.42/mo annual; 12,000+ books | 2026 | shortform.com | V |
| Neighbour-borrowing effect | ≥9× loan probability | 2014 (data 2007–08) | McKay et al. | V |
| Hinze et al. sample | 65 readers interviewed, 51 observed | 2012 | JCDL paper | V |
| US indie bookstores | 1,651 (2009) → 2,227 (2015) | 2015 | ABA via Wikipedia | S |
| StoryGraph sign-ups | 5M | January 2026 | Wikipedia | S |
| Goodreads members | >150M | September 2023 | Wikipedia | S |
| Anna's Archive holdings | 71,996,952 books; 239,545,528 papers | 2026-10-01 | Wikipedia | S |
| Anna's Archive Spotify judgment | $322M default | April 2026 | MBW / Wikipedia | S |
| OCLC v. Anna's Archive | Injunction + deletion; no damages | 2026-01-15 | court opinion | V |
| Hachette v. IA | 2nd Cir. affirmed; >500k books pulled from CDL | 2024-09-04 | Wikipedia | S |

---

## Surprises and recent changes (2024–2026)

1. **The Library of Congress published LLM embeddings of its catalog.** These are 1024-d Amazon Titan V2 vectors, by LCC class, ≈190 GB [V]. It is a quiet but major gift for semantic book discovery. It also signals that national libraries are now producing AI-ready derivatives.
2. **HTRC EF 2.5 (July 2025) added ~1.6M volumes and re-OCRed everything.** That is 18.7M volumes under CC BY, with ~10M in copyright. It remains the largest legal page-level dataset for in-copyright books.
3. **The discovery web is walling itself off from bots.** In one day of checks I hit:
   - **Cloudflare challenges:** HathiTrust babel, StoryGraph, Literal, Shepherd, Blinkist, Open Syllabus pricing, ProQuest;
   - **a sign-in wall:** LibraryThing ("browsing turned off for visitors who are not signed in");
   - **"Human Verification" interstitials:** Open Library `/explore`;
   - **an F5 bot challenge:** Stanford SearchWorks;
   - **a 403:** Harvard's LibraryCloud API.

   This is almost certainly a reaction to AI-crawler load [I, high]. Tools should use bulk dumps and official APIs and identify themselves.
4. **Goodreads' API documentation page is gone** (`/api` → homepage) [V].
5. **Harvard's StackLife, the canonical virtual-stack UI, is offline** (DNS no longer resolves) [V].
6. **The WorldCat scraping case produced a real precedent.** Browsewrap terms were enforced against a sophisticated scraper, and trespass to chattels was granted on server harm (2026-01-15) [V].
7. **Anna's Archive suffered compounding default judgments in 2026** ($322M; $19.5M; injunctions) and domain losses [S].
8. **Wikidata split scholarly articles into a separate query service.** A `Q13442814` count on the main endpoint returns 0; there are 46.0M on `query-scholarly` [V].
9. **getAbstract repositioned as an MCP/API "knowledge layer for enterprise AI"** [V]. Summary vendors are turning into AI-input vendors.
10. **Google Ngram Viewer got a new dataset (July 2024)**, its first since 2020 [V].
11. **Open Library's search backend moved toward FastAPI.** It now rejects some broad queries outright (`the` → "not allowed"; wildcard counts → HTTP 500) [V]. Do not rely on full-corpus wildcard queries; use dumps.
12. **Open Syllabus grew to 32.9M syllabi (v2.14)**, while its free tier stays frozen at 2019 data [V].

---

## Contested or uncertain points

- **Open Library licence.** The licensing page says IA asserts no new rights. That is not a formal CC0 dedication, and covers are not addressed [V]. Most reusers treat the data as public. Low legal risk [I, ~85%].
- **Open Library's "2025 settlement / 500,000 books."** Wikipedia's OL article attributes the removal of 500,000 books to a "2025 settlement" (citing Ars Technica, 2025-11-03). The *Hachette* article attributes the >500k removals to the 2023–24 injunction. These may conflate the *Hachette* outcome with IA's separate 2025 settlement in the record-labels (Great 78) case [I, ~65%]. Not resolved.
- **Open Syllabus corpus size.** The "about" page says "about 21 million English-language syllabi from 140 countries"; the v2.14 docs say 32.9M. The about page is likely outdated [I, ~85%].
- **HathiTrust search-only behaviour details.** Page numbers plus per-page counts are documented by secondary sources (2012–2014; library guides through 2024) [S]. I could not load HathiTrust's own help page (403) or run a search (Cloudflare). Confidence high [~85%] that this still works for interactive users.
- **LoC embeddings.** Unknown: which fields were embedded, whether the service-wide "public domain data set" statement explicitly covers them, whether the files are maintained, and the exact record count (my estimate ≈19–20M, ±20%).
- **Shepherd.com status.** The domain-for-sale redirect may reflect the service's closure, a domain dispute, or bot-specific routing. Confidence that the service is still operating is ~50%.
- **Literal status.** Unverified (Cloudflare). I am unsure whether its public GraphQL API still exists (~40%).
- **StoryGraph Plus price.** The $50/yr figure is from 2023; current pricing was not verified.
- **Blinkist catalogue size and price.** "6,500+ titles" is undated on Wikipedia; Blinkist's own site blocked my fetcher.
- **Google Books API quota.** The default per-project daily quota could not be confirmed on a primary page. The 429 for anonymous calls is verified.
- **Value of classification adjacency vs. semantic adjacency.** McKay et al. show adjacency drives borrowing. I found no study comparing LCC-shelf neighbours with embedding neighbours for discovery quality. That is an open empirical question, and testable with the LoC embeddings plus circulation data such as OhioLINK [I].

---

## Implications for someone building tools to explore literature

1. **Use bulk dumps, not scraping.** The legal and practical stack for a personal or wiki-scale tool:
   - OL monthly dumps (works, editions, authors, lists, reading log);
   - HathiTrust Hathifiles (monthly, with HathiTrust IDs and access rights);
   - HTRC EF 2.5 (page features; download only the subset you need, e.g. by LCC range or by OCLC/ISBN match);
   - LoC vocabularies and embeddings;
   - Harvard CC0 MARC (LCC/LCSH-rich records);
   - Wikidata for ID crosswalks.

   All of this fits in **DuckDB/Parquet on a laptop**, except EF in full (4.4 TB). A Claude Code agent can build the joins over a weekend [I].
2. **The join keys are OCLC numbers, ISBNs, LCCNs and HathiTrust IDs.** Hathifiles carry 26 tab-separated fields, including `htid, access, rights, ht_bib_key, oclc_num, isbn, issn, lccn, title, imprint, rights_date_used, lang, bib_fmt, author` [V, `hathi_field_list.txt`]. They have **no LCC field**; class numbers require HathiTrust's MARC records or a join to OL, LoC or Harvard. OL editions carry `oclc_numbers`, `lccn` and `isbn_*` (coverage in the table above). The LoC embeddings carry LCCN.
3. **Build the shelf from LCC, but allow multiple placements.**
   - Use OL's normalized `lcc` arrays: every edition's class number.
   - Show a work on every shelf it belongs to. That turns cataloguing inconsistency into Björneborn's "multi-reachability."
   - Overlay a second adjacency, such as embedding nearest neighbours or Open Syllabus co-assignment, as "wormholes."
4. **Answer "which page" in two tiers.**
   - **Tier 1, counts:** HTRC EF page-level term counts (works for 18.7M volumes, including in-copyright), e.g. "pp. 211–224 are where *proper scoring rule* concentrates."
   - **Tier 2, verify:** confirm with IA/OL search-inside snippets, or with HathiTrust's search-only page hits (interactively).
   - Then route the user to legitimate reading: a full-view link, OL borrow, a library holding, or purchase.
5. **Measure the browser.** Instrument "neighbour uptake": when a user opens book A, how much more likely is it that they open a shelf neighbour of A? McKay's ≥9× physical-library baseline is the bar to beat [I].
6. **Respect bot walls and terms.**
   - Identify your client (OL gives 3× limits).
   - Never scrape WorldCat.org; it is enjoined and contract risk applies.
   - Treat HathiTrust/babel as interactive-only unless you get permission.
   - Do not touch Anna's Archive data.
7. **TOCs are the highest-value missing layer.** An LLM pipeline can produce a large open TOC corpus:
   - detect TOC pages, using EF features or OCR of full-view scans;
   - extract chapter titles and page numbers;
   - reconcile them with OL `table_of_contents`, MARC 505 and EF running headers.

   This would be novel and directly useful for "chapter-level shelves" [I].
8. **The social layer must be user-supplied.** Ingest the user's Goodreads/StoryGraph CSV exports and OL reading logs. Combine them with Five Books and Open Syllabus (licensed) to get expert signal without platform APIs.
9. **Summaries: generate rather than license**, for the long tail. Ground the LLM in TOC, page-feature profiles, publisher descriptions and reviews, and label the result as model-generated. Licensed summary vendors cover only ~10^4 trade titles.
10. **Expect fragility.** Five of the services examined changed status in 2024–26 (Goodreads `/api` gone, StackLife offline, LibraryThing walled, Shepherd uncertain, Anna's Archive domains seized). Prefer sources with **bulk downloads and institutional backing** (LoC, HathiTrust/HTRC, IA/OL, Harvard).

---

## Ideas sparked

1. **Infinite Stacks (multi-order shelf).** A spine wall you can re-sort live:
   - by LCC (the library order);
   - by "semantic order" (a 1-D ordering of LoC embeddings via a space-filling curve or TSP over nearest neighbours);
   - by co-assignment (Open Syllabus);
   - by publication year within a class.

   Books that move far between orders get highlighted as "misshelved by the catalog," a serendipity generator built on Björneborn's "imperfection."
2. **Page Heat Strip.** For any book and query, draw a thin bar of per-page relevance computed from HTRC EF `tokenPosCount` (TF-IDF across the book). Clicking a hot band fetches OL search-inside snippets for that page range or opens the HathiTrust full view. It answers "which 12 pages of this 500-page monograph matter to me?" for 18.7M books without the text.
3. **Chapter Shelf.** An LLM-extracted open TOC corpus that lets you browse *chapters*, not books. E.g. a shelf of every chapter titled with "calibration" or "scoring rules" across statistics, meteorology and psychology, ordered by LCC of the parent book.
4. **Neighbour-uptake dashboard.** A personal analytics view that reports your own browsing "neighbour effect" against the 9× physical baseline. It suggests which shelf orders work best for you, and calibrates the tool's recommendations (a forecasting-flavoured loop).
5. **Front Table generator.** A weekly 12-book "bookstore table," cross-category by construction (Björneborn's "contrasts"). Each book gets a two-sentence staff-pick rationale grounded in the user's reading history and the book's TOC. One "wildcard" slot comes from a distant LCC class with a semantic bridge.
6. **Wormhole links.** On each book page, show the 3 nearest neighbours that sit in a *different* LCC main class (embedding-near, shelf-far). For example, a book on Bayesian epistemology (B) linked to a meteorology forecasting text (QC) and an insurance actuarial text (HG).
7. **Syllabus lens.** Toggle any shelf to "as taught": size spines by assignment frequency, and draw arcs for co-assignment. Use the free 2019-capped data now and a licensed upgrade later.
8. **Search-only reader's map.** For a HathiTrust search-only book, show the user a "where my terms live" map from page hit counts (interactive, human-driven). Pair it with a "get this book" panel: nearest library holding via Hathifiles OCLC number → WorldCat link, OL borrow, used-copy price.
9. **3D/VR stacks with real physicality.** Following OL Explorer's page-count thickness, render spines with true thickness, height and cover colour, in a walkable VR aisle laid out by LCC. Add "tilted cover-out" displays for high-signal books (Björneborn's display dimension). Let the user pull a book to see its TOC and page-heat strip.
10. **Catalog-error harvester.** Use multi-LCC works, semantic outliers and EF language mismatches to flag catalog errors. File them back to Open Library as edits: a give-back loop that improves the commons the tool depends on.
11. **"Flick-through" preview.** Simulate Hinze et al.'s "flicking" by sampling five pages' token profiles plus the TOC plus the first sentence into a 20-second card. Use full-view scans where legal, otherwise EF-derived keyword clouds per chapter.
12. **Shelf-adjacency experiment kit.** A small open-source harness: an OhioLINK-style circulation-like log from tool usage, plus LCC and embedding adjacency, to test whether semantic neighbours beat shelf neighbours. This is publishable research and a design guide.

---

## Sources

1. Open Library — Data dumps (page last edited 2025-06-10) — https://openlibrary.org/developers/dumps — accessed 2026-10-15
2. Internet Archive metadata for Open Library dump item `ol_dump_2026-09-30` (files dated 2026-10-02) — https://archive.org/metadata/ol_dump_2026-09-30 — 2026-10-15
3. Open Library — Developers / API (rate limits, bulk policy) — https://openlibrary.org/developers/api — 2026
4. Open Library — Licensing — https://openlibrary.org/developers/licensing — 2026
5. Open Library — Covers API — https://openlibrary.org/dev/docs/api/covers — 2026
6. Open Library — Search API docs — https://openlibrary.org/dev/docs/api/search — 2026
7. Open Library — Search Inside API docs — https://openlibrary.org/dev/docs/api/search_inside — 2026
8. Open Library — live search API queries (`search.json`, `search/authors.json`) — https://openlibrary.org/search.json — run 2026-10-15
9. Open Library — live full-text search query — https://openlibrary.org/search/inside.json?q=%22base%20rate%20neglect%22 — run 2026-10-15
10. Open Library blog — "Introducing the Open Library Explorer" — https://blog.openlibrary.org/2020/12/16/introducing-the-open-library-explorer/ — 2020-12-16 (stale?)
11. Internet Archive Help — Browse the book shelves with Open Library Explorer — https://help.archive.org/help/browse-the-book-shelves-with-open-library-explorer/ — undated (search result)
12. Internet Archive blog — "What if you could wander the library stacks online?" — https://blog.archive.org/2020/12/21/what-if-you-could-wander-the-library-stacks-online/ — 2020-12-21 (search result)
13. HTRC — Extracted Features v.2.5 documentation — https://htrc.atlassian.net/wiki/spaces/COM/pages/975306753/Extracted+Features+v.2.5 (also via REST: https://htrc.atlassian.net/wiki/rest/api/content/975306753?expand=body.storage) — 2025/2026
14. HTRC — Extracted Features v.2.0 documentation (schema) — https://htrc.atlassian.net/wiki/spaces/COM/pages/43295914/Extracted+Features+v.2.0 — 2020
15. HTRC — Downloading Extracted Features (updated 2025-07-11) — https://htrc.atlassian.net/wiki/rest/api/content/43288147?expand=body.storage,version — 2025
16. HTRC — BookNLP Dataset for English-Language Fiction — https://htrc.atlassian.net/wiki/rest/api/content/43300179?expand=body.storage,version — 2023-12-08
17. HTRC — Derived Datasets index — https://htrc.atlassian.net/wiki/spaces/COM/pages/43287791/HTRC+Derived+Datasets — 2026
18. NDL Current Awareness Portal — EF 2.5 release note — https://current.ndl.go.jp/car/256225 — 2025-07-30
19. HathiTrust — EF 1.0 announcement (CC-BY) — https://old.www.hathitrust.org/extracted-features-announcement.html — 2016 (stale; search result)
20. HathiTrust — Hathifiles listing — https://www.hathitrust.org/files/hathifiles/hathi_file_list.json — 2026-10-15
21. HathiTrust — Hathifiles full file — https://www.hathitrust.org/files/hathifiles/hathi_full_20261001.txt.gz — 2026-10-01
22. Wikipedia — HathiTrust — https://en.wikipedia.org/wiki/HathiTrust — revised 2026-09-22
23. GALILEO Annual Conference 2025 — "HathiTrust: Spotlight on a Portal to Millions of Volumes" — https://about.galileo.usg.edu/assets/conference/presentations/HathiTrust_Spotlight_on_a_Portal_to_Millions_of_Volumes__GAC_2025.pdf — 2025 (search result)
24. Vita Brevis — "Using the HathiTrust Digital Library" — https://vitabrevis.americanancestors.org/2014/05/using-hathitrust-digital-library — 2014-05 (stale)
25. Florida State University Libraries — HathiTrust search guide — https://guides.lib.fsu.edu/hathitrust/search — updated 2024-10-09
26. OCLC — Inside WorldCat — https://oclc.org/en/worldcat/inside-worldcat.html — figures October/November 2025
27. OCLC — WorldCat Search API page — https://www.oclc.org/developer/api/oclc-apis/worldcat-search-api.en.html — 2026
28. OCLC — Developer eligibility — https://oclc.org/developer/support/eligibility.en.html — 2026
29. OCLC — API catalogue — https://www.oclc.org/developer/api/oclc-apis.en.html — 2026
30. *OCLC, Inc. v. Anna's Archive*, S.D. Ohio No. 2:24-cv-144, Doc. 58, Opinion and Order — https://librarytechnology.org/docs/32142.pdf — filed 2026-01-15
31. CourtListener docket copy of the same order — https://storage.courtlistener.com/recap/gov.uscourts.ohsd.287709/gov.uscourts.ohsd.287709.58.0.pdf — 2026-01-15 (search result)
32. TorrentFreak — "U.S. Court Order Against Anna's Archive…" — https://torrentfreak.com/?p=276158 — 2026-01-16
33. Wikipedia — Anna's Archive — https://en.wikipedia.org/wiki/Anna%27s_Archive — figures as of 2026-10-01
34. Music Business Worldwide — $322M default judgment — https://www.musicbusinessworldwide.com/spotify-and-record-labels-win-322m-default-judgment-against-pirate-site-annas-archive/ — April 2026 (search result)
35. Wikipedia — Goodreads — https://en.wikipedia.org/wiki/Goodreads — 2026
36. Goodreads developer forum — API deprecation thread — https://www.goodreads.com/topic/show/21788520-api-deprecation — 2020 (search result; stale)
37. Wikipedia — LibraryThing — https://en.wikipedia.org/wiki/LibraryThing — revised 2026-09 (figures 2021)
38. Wikipedia — The StoryGraph — https://en.wikipedia.org/wiki/The_StoryGraph — 2026
39. Five Books — About — https://fivebooks.com/about/ — 2026
40. Wikipedia — Bookshop.org — https://en.wikipedia.org/wiki/Bookshop.org — 2026
41. Brannans — "Shepherd.com" domain listing — https://www.brannans.com/domain/shepherd-com/ — 2026-10-15
42. Open Syllabus — Dataset documentation (v2.14) — https://docs.opensyllabus.org/ — 2026
43. Open Syllabus — About accounts — https://blog.opensyllabus.org/about-accounts — 2026
44. Open Syllabus — About — https://blog.opensyllabus.org/about-os — undated
45. Open Syllabus — Terms and policies — https://blog.opensyllabus.org/terms-and-policies — 2026
46. Open Syllabus — Home — https://www.opensyllabus.org/ — 2026
47. Harzing — Open Syllabus white paper — https://harzing.com/publications/white-papers/open-syllabus — undated (search result)
48. Library of Congress — Linked Data Service bulk downloads (incl. experimental embeddings) — https://id.loc.gov/download/ — 2026-10-15
49. LoC embeddings sample file (class V) — https://lds-downloads.s3.amazonaws.com/embeddings/V_embeddings_2025.jsonl.gz — last modified 2026-09-22
50. Library of Congress — MARC Distribution Services / MDSConnect — https://www.loc.gov/cds/products/marcDist.php — 2026
51. Library of Congress — Free LCC PDFs — https://www.loc.gov/aba/publications/FreeLCC/freelcc.html — updated 2026-02-10
52. Library of Congress — Classification Web — https://www.loc.gov/cds/classweb/ — 2026
53. Library of Congress — BEAT (Bibliographic Enrichment Advisory Team) — https://www.loc.gov/catdir/beat/ — ~2005 content (stale)
54. The Online Books Page — Subjects / LC call-number browse — https://onlinebooks.library.upenn.edu/subjects.html — 2026
55. Stanford SearchWorks — Browse — https://searchworks.stanford.edu/browse — 2026
56. GitHub — harvard-lil/stacklife README — https://github.com/harvard-lil/stacklife — 2012 code
57. Harvard Library — APIs & Datasets — https://library.harvard.edu/services-tools/harvard-library-apis-datasets — 2026
58. Google — Books API Terms of Service — https://developers.google.com/books/terms — last updated 2012-04-25
59. Google — Books API "Using the API" — https://developers.google.com/books/docs/v1/using — updated 2025-08-28
60. Google — Ngram Viewer info — https://books.google.com/ngrams/info — 2026 (notes July 2024 dataset)
61. Google blog — "15 years of Google Books" — https://blog.google/products/search/15-years-google-books/ — 2019-10-17 (stale)
62. Wikipedia — Google Books — https://en.wikipedia.org/wiki/Google_Books — 2026
63. Crossref record — Michel et al., "Quantitative Analysis of Culture Using Millions of Digitized Books," *Science* — https://api.crossref.org/works/10.1126/science.1199644 — 2011-01-14
64. Internet Archive — advanced search API (counts) — https://archive.org/advancedsearch.php — run 2026-10-15
65. Wikidata — WikiProject Books — https://www.wikidata.org/wiki/Wikidata:WikiProject_Books — 2026
66. Wikidata Query Service (main) — https://query.wikidata.org/sparql — queried 2026-10-15
67. Wikidata Query Service (scholarly) — https://query-scholarly.wikidata.org/sparql — queried 2026-10-15
68. ISBNdb — ISBN database and plans — https://isbndb.com/isbn-database — 2026
69. Shortform — Pricing — https://www.shortform.com/pricing — 2026
70. Wikipedia — Blinkist — https://en.wikipedia.org/wiki/Blinkist — revised 2026-08-29
71. getAbstract — Home ("Knowledge for Enterprise AI") — https://www.getabstract.com/en/ — 2026
72. ProQuest Syndetics Unbound — https://proquest.syndetics.com/ — 2026
73. EDItEUR — ONIX for Books overview (Release 3.0 and 3.1) — https://www.editeur.org/83/Overview/ — 2026
74. Björneborn, L. (2008). "Serendipity dimensions and users' information behaviour in the physical library interface." *Information Research* 13(4), paper 370 — http://informationr.net/ir/13-4/paper370.html — 2008 (stale; foundational)
75. Björneborn, L. (2017). "Three key affordances for serendipity." *Journal of Documentation* 73(5):1053–1081 — http://www.emerald.com/jd/article/73/5/1053-1081/198223 — 2017
76. Foster, A. & Ford, N. (2003). "Serendipity and information seeking: an empirical study." *J. Documentation* — https://api.crossref.org/works/10.1108/00220410310472518 — 2003
77. McKay, D., Smith, W. & Chang, S. (2014). "Lend me some sugar: Borrowing rates of neighbouring books as evidence for browsing." JCDL 2014 — https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658 (PDF: https://ndownloader.figshare.com/files/47655661) — 2014
78. Hinze, A., McKay, D., Vanderschantz, N., Timpany, C. & Cunningham, S.J. (2012). "Book selection behavior in the physical library: implications for ebook collections." JCDL 2012 — https://researchcommons.waikato.ac.nz/bitstreams/3876091c-69d5-44ff-b3e7-2a23aedd4fa6/download — 2012
79. McKay, D., Chang, S. & Smith, W. (2017). "Manoeuvres in the Dark." CHIIR 2017 — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1145/3020165.3020179 — 2017
80. Makri, S. & Blandford, A. (2012). "Coming across information serendipitously – Part 1." *J. Documentation* — https://api.semanticscholar.org/graph/v1/paper/DOI:10.1108/00220411211256030 — 2012
81. Wikipedia — Independent bookstore — https://en.wikipedia.org/wiki/Independent_bookstore — 2026
82. Wikipedia — Barnes & Noble — https://en.wikipedia.org/wiki/Barnes_%26_Noble — 2026
83. Wikipedia — Hachette v. Internet Archive — https://en.wikipedia.org/wiki/Hachette_v._Internet_Archive — 2026
84. Wikipedia — Open Library — https://en.wikipedia.org/wiki/Open_Library — revised 2026-09
85. HathiTrust — Hathifiles field list — https://www.hathitrust.org/files/hathifiles/hathi_field_list.txt — 2026-10-15
86. Open Library editions dump (streamed and tabulated for field coverage) — https://openlibrary.org/data/ol_dump_editions_latest.txt.gz (→ archive.org `ol_dump_2026-09-30`) — 2026-09-30
87. Library of Congress — id.loc.gov About ("public domain data set") — https://id.loc.gov/about/ — 2026-10-15
88. OCLC Classify (retired; redirects to 404) — https://classify.oclc.org/classify2/ — checked 2026-10-15
