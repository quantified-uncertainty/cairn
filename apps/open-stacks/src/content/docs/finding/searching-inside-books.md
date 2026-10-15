---
title: Searching Inside Books You Don't Have
description: Page-level search for in-copyright books you cannot read, as of October 2026. Covers what HathiTrust, Internet Archive and Open Library, Google Books, Amazon, HTRC Extracted Features and the Ngram Viewer each return; a workflow, run live, that finds which books discuss proper scoring rules and on which pages; and how to turn the hits into a borrow, buy or subscribe plan.
---

*Status: draft, October 2026. Collection sizes, API behaviour and service statuses are as of 2026-10-15 unless another date is given. The worked example was run live on 2026-10-15 against the Open Library, Internet Archive, HathiTrust catalog, HTRC and Ngram endpoints, and its numbers come from those runs. An independent editorial check the same day re-ran the candidate search, the Lad Extracted Features analysis, the `page_num` test (6 hits) and three of the five Ngram series, and reproduced every figure checked; the HathiTrust matching and the EF page ranges for rows 2–20 were not re-run. HathiTrust's full-text search and Amazon's Look Inside could not be queried by script; they are described from court opinions, help pages and library guides. Sources: the [R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md), the [R04 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md), and primary sources linked inline.*

## The short version

- **Several services tell you where a term occurs in an in-copyright book; none reliably shows you the page.** HathiTrust shows no text, the Internet Archive and Google show snippets, and previews show only what the publisher allows. Choose by what comes back: page numbers, snippets, token counts, or a list of matching books.
- **Default workflow:** Internet Archive search-inside to find candidate books, the HathiTrust catalog API to map them to HathiTrust IDs, HTRC Extracted Features to place the topic on pages, HathiTrust's web search to verify by hand, then [The Access Ladder](/access/access-ladder/) to get the pages. For books from after about 2010, go straight to Google Books and Amazon previews.
- **HathiTrust returns page numbers and per-page counts, with no text,** for 11.4M search-only volumes. It is the most precise "which page" answer, but it is interactive only: scripted requests were refused (HTTP 403) on 2026-10-15.
- **Internet Archive search-inside is the best scriptable way to find candidates.** One JSON call returns the matching scanned books, up to five highlighted snippets each, and facets by subject and year. It does *not* say which page matched: the `page_num` field equalled the scan's total image count in all 20 hits checked.
- **HTRC Extracted Features (EF) 2.5 is the largest openly licensed page-level dataset that covers in-copyright books.** It gives per-page token counts for 18.7M volumes, 9.97M of them in copyright, under CC BY 4.0 (April 2025 snapshot). HTRC's services shut down on 2026-09-30; the files were still downloadable on 2026-10-15. If you depend on them, mirror your subset now.
- **A worked run took about 15 minutes and cost nothing.** The question: which books discuss proper scoring rules, and on which pages? 179 candidate books → 52 in HathiTrust → printed page locations for 43, of which 17 show a section of three or more pages. The best hit was Lad (1996), pp. 334–357, Chapter 6, "Proper Scoring Rules".
- **Recency is the main cliff.** Of the candidates published before 1990, 82% could be borrowed from the Internet Archive or page-searched in HathiTrust. Of those from 2010 on, 4 of 31 could. For recent books, page-finding falls to Google Books and Amazon previews, and the plan usually ends in buying or a subscription.
- **The legal footing for search is settled; the footing for reading is not.** *Authors Guild v. HathiTrust* (2014) and *Authors Guild v. Google* (2015) held search and limited snippets to be fair use. *Hachette v. Internet Archive* (2024) went the other way on lending scans. See [The Legal Map](/building/legal-map/).

## What each service returns

| Service | Coverage (date) | What a query returns for an in-copyright book | Scriptable? | Catch | Best use |
|---|---|---|---|---|---|
| [HathiTrust full-text search](https://babel.hathitrust.org/cgi/ls) | 19,701,406 volumes; 11,408,072 search-only (Hathifiles, 2026-10-01) | Page numbers where the term occurs and the count on each page; no text | No. `babel.hathitrust.org` returned 403 to scripts on 2026-10-15. The catalog API and Hathifiles are open | Few recent books (1 of 31 post-2010 candidates in the worked example) | Hand-checking pages in one volume |
| [Internet Archive / Open Library search-inside](https://openlibrary.org/search/inside) | 52.7M IA text items; 5.46M print-disabled and 4.41M lendable (2026-10-15) | Matching volumes, a total, up to 5 highlighted snippets per volume, facets by year, subject and collection. For restricted books, no hit page | Yes: `search/inside.json`, 1 request/s (3 with an identifying User-Agent) | No page numbers; snippets are for locating, not for building a corpus | Candidate generation across scanned 20th-century books |
| [Google Books](https://books.google.com/) | "More than 40 million books" (Google, 2019); "more than 20 million" scanned by 2015 (Second Circuit) | Snippet view: hit count plus at most 3 snippets of about an eighth of a page. Preview books show some full pages | API needs a key; anonymous quota was 0 on 2026-10-15 | API terms forbid charging users without Google's agreement and building databases from responses | Spot checks; recent books |
| Amazon Look Inside ("Search Inside the Book") | Only titles with both a print and a Kindle edition (help page, undated) | Search across the whole text; some pages only for signed-in buyers | No public API [~85%] | Retail preview; limits not published | Checking contents and index pages before buying |
| [HTRC Extracted Features 2.5](https://htrc.atlassian.net/wiki/spaces/COM/pages/975306753/Extracted+Features+v.2.5) | 18,725,868 volumes; 9,969,251 in copyright (April 2025 snapshot) | Per-page token counts with part-of-speech tags; header, body and footer counted separately | Yes: bulk files (rsync; HTTPS worked on 2026-10-15) | Unigrams only, so no phrase search; host's future unclear after HTRC closes | Page localization at scale; table-of-contents detection |
| [Google Books Ngram Viewer](https://books.google.com/ngrams/info) | Unstated for the July 2024 dataset | Yearly frequency of a phrase of up to 7 words | Yes: downloadable data | Not page-level | Choosing search terms and eras |

## HathiTrust full-text search

**What it returns.** The Second Circuit described the output precisely in [*Authors Guild v. HathiTrust*](https://cases.justia.com/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.pdf) (2014-06-10). Unless the rights holder allows more, "the search results show only the page numbers on which the search term is found within the work and the number of times the term appears on each page." The library "does not display to the user any text from the underlying copyrighted work (either in 'snippet' form or otherwise)." A 2024 library guide describes the same behaviour: "the full-text search will tell you which page(s) include your keywords" ([FSU Libraries, updated 2024-10-09](https://guides.lib.fsu.edu/hathitrust/search)). HathiTrust's own help pages returned 403 to every fetcher, so this rests on the opinion and library guides [~85% that it still works this way for interactive users]. You get every page with a hit and a count for each, so you can tell a three-page treatment from a passing mention without seeing any text.

**What it covers.** The 2026-10-01 Hathifiles (HathiTrust's monthly bulk metadata) list **19,701,406 volumes** under **9,745,536 bibliographic records**. Of these, 8,293,334 (42.1%) are full view and 11,408,072 (57.9%) are search-only. Rights codes put 10,366,655 volumes in copyright (R05's tabulation of the [full file](https://www.hathitrust.org/files/hathifiles/hathi_file_list.json), confirmed in its verification pass). The search-only part is what this chapter is about: digitized, indexed and unreadable.

**Access in practice.** On 2026-10-15, scripted requests to both the collection search (`/cgi/ls`) and the within-volume search (`/cgi/pt/search`) returned HTTP 403, a Cloudflare challenge. A person in a browser is unaffected. Two programmatic doors remain open:

- the **Bib API** (`catalog.hathitrust.org/api/volumes/brief/isbn/<ISBN>.json`), which returned records with HathiTrust IDs and rights strings such as "Limited (search-only)" on 2026-10-15;
- the **[Hathifiles](https://www.hathitrust.org/files/hathifiles/hathi_file_list.json)**, a monthly 1.23 GB tab-separated file with `htid`, `access`, `rights`, OCLC, ISBN and LCCN columns.

Use these to find out *whether* a book is in HathiTrust and under which ID. Then do the page search by hand.

**Decision.** Use HathiTrust search as the verification step, once you have a short list. For a search-only volume, it is the cheapest way to confirm which pages to request from a library.

## Internet Archive and Open Library search-inside

**What it returns.** `openlibrary.org/search/inside.json?q=...` queries the Internet Archive's full-text index (`fts_main`). Each hit is a scanned volume with:

- its IA identifier, title, creator, publisher and year;
- up to five highlighted passages, marked like `{{{proper scoring rule}}}`;
- aggregations by year, language, creator, collection and subject.

The index includes in-copyright books in IA's lending (`inlibrary`) and print-disabled (`printdisabled`) collections, which is why it reaches modern scholarship. A test for "base rate neglect" returned 472 volumes, 469 of them print-disabled (R05, verified). For "proper scoring rule" on 2026-10-15 it returned 97 volumes, all in `printdisabled` and 34 in `inlibrary`.

**What it does not return: the page of the hit.** Each hit carries a `page_num` field, and earlier notes (including the R05 dossier) read it as the page of the match. It is not. For all 20 hits on the first page of the "proper scoring rule" results, `page_num` equalled the item's `imagecount` in the Internet Archive metadata API. Lad's *Operational Subjective Statistical Methods* returned 522 for a 522-image scan; Cooke's *Experts in Uncertainty* returned 346 for 346 images (2026-10-15). So `page_num` is the length of the scan. The JSON API tells you *which* book and *what the passage says*, not *where* it is.

**The per-page API refuses restricted books.** The documented lower-level endpoint, `fulltext/inside.php` on the item's data node, returns each match with its page and word bounding boxes. Its own [documentation](https://openlibrary.org/dev/docs/api/search_inside) labels it "experimental". On 2026-10-15 it returned 104 page-located matches for a public-domain test item. For Cooke's book, which is print-disabled only, it returned an "Item not available" page. For in-copyright books, the page comes only from reading the book: through a loan if it is lendable, or through print-disabled access if you qualify.

**Limits and etiquette.**

- **Rate:** 1 request/s anonymously, 3 requests/s with a User-Agent naming your app and a contact ([OL API page](https://openlibrary.org/developers/api)).
- **Paging:** 20 hits per page, via `&page=N`.
- **Web interface:** the search-inside page served a "Human Verification" interstitial to my scripted fetch, so treat it as a human interface.
- **Snippets:** use them to *locate* passages. Harvesting them into a text corpus would raise copyright and terms-of-use problems.

**Decision.** Make this your first call for any concept in 20th-century scholarship. It is free, scriptable and phrase-aware, and its subject facets show which fields discuss the term.

## Google Books: snippets, previews and the API

**What snippet view shows.** The Second Circuit's opinion in [*Authors Guild v. Google*](https://cases.justia.com/federal/appellate-courts/ca2/13-4829/13-4829-2015-10-16.pdf) (2015-10-16) is the best public description of the mechanics:

- Search tells you "the number of times the word or term selected by the searcher appears in the book."
- It displays "a maximum of three 'snippets'," each "ordinarily an eighth of a page."
- Repeating a search returns the same three snippets. Only the first use of the term on a page is shown.
- Google "blacklists" one snippet on every page and one page in every ten, permanently blocking about 22% of the text.
- Snippet view is disabled for books where one snippet would satisfy the need, such as dictionaries, cookbooks and books of short poems. Rights holders can opt out entirely.
- Researchers hired by the plaintiffs, searching for weeks, never reached as much as 16% of any book's text, and what they got was scattered fragments.

Preview books, where the publisher agreed, also show some full pages [~85% that this two-tier description still matches the 2026 interface; I did not test the web UI].

**What it covers.** The last official figure is "more than 40 million books in over 400 languages" ([Google, 2019-10-17](https://blog.google/products/search/15-years-google-books/)). That is twice HathiTrust's volume count, and probably still the largest book full-text index anyone can search free [~80%; the figure is seven years old]. It is not mainly an in-print index: of the scanned books, the Second Circuit noted in 2015, "the vast majority … are non-fiction, and most are out of print."

**The API.**

- **Requests:** need an API key or OAuth. `maxResults` defaults to 10 and caps at 40 ([docs, updated 2025-08-28](https://developers.google.com/books/docs/v1/using)).
- **No key:** an anonymous call on 2026-10-15 returned HTTP 429 with `quota_limit_value: "0"` for the shared default project. Without a key you get nothing.
- **Within-volume search:** the "Using the API" page documents volume search and volume lookup, but no search inside a single volume. Full-text queries do return a per-result `searchInfo.textSnippet` [~80%, background knowledge, not re-tested].
- **Terms:** the [Books API terms](https://developers.google.com/books/terms) (2012-04-25) forbid charging users "any fee for the use of your application" without Google's agreement and require honouring removal requests. Google's [general API terms](https://developers.google.com/terms) (2021-11-09) forbid using responses to "build databases, or otherwise create permanent copies."

**Decision.** Use the Google Books web interface by hand for spot checks and for books published after 2010, which the other indexes cover poorly (see below). Use the API only for live lookups with your own key. Do not build a stored index from it.

## Amazon Look Inside

Amazon's help article "What Is Search Inside the Book?" (undated; read on an Amazon-hosted [copy](https://digprjsurvey.amazon.com/csad/help/node/GFUKUP5925ED8MN4) because the main help URL returned 503) says three things:

- Search Inside the Book "lets you view, search, and browse books," and "search results include matches based on every word inside a book."
- This "works as long as there's both a print and a Kindle edition of the book."
- Because of publisher agreements, some features and pages are "only available if you're logged into your Amazon account and have made a prior purchase."

A distributor's guide adds that publishers submit a PDF of the whole book and that "Amazon will only display the front cover and a number of pages," in sequence from the front ([Bookmobile](https://info.bookmobile.com/knowledge/how-do-i-do-amazons-search-inside-the-book), undated). Search results list the page of each match with a short excerpt [~75%; background knowledge, not tested here]. I found no published page quota and no API for in-book search [~85% that none exists].

**Decision.** Use Look Inside on recent, in-print books, just before buying. Search your term, then read the table of contents and, if it is visible, the back-of-book index. For a recent textbook, an index entry for "scoring rules" is often the most reliable "which pages" answer available.

## HTRC Extracted Features 2.5 and the September 2026 shutdown

### What the dataset is

EF is the HathiTrust Research Center's derived dataset: one JSON-LD file per volume, with per-page features computed from the full text.

| Field | EF 2.5 (current) |
|---|---|
| Volumes | **18,725,868** |
| Pages | 6,867,699,164 |
| Tokens | 3,255,304,293,468 |
| In-copyright volumes / pages | **9,969,251** / 3,561,896,776 |
| Public-domain and CC volumes | 7,816,840 |
| Snapshot | HathiTrust corpus as of **April 2025**; announced 2025-07-24 (R05) |
| Size | **4.4 TB** bzip2 |
| License | **CC BY 4.0** |
| Citation | Walsh et al. (2025), [doi:10.13012/PXP0-F135](https://doi.org/10.13012/PXP0-F135), with an "accessed on" date, because EF 2.5 "is designed to be updated incrementally under the same version number" |

Source: the [EF 2.5 documentation](https://htrc.atlassian.net/wiki/spaces/COM/pages/975306753/Extracted+Features+v.2.5) (page last edited 2026-02-27), re-read 2026-10-15. EF 2.5 adds about 1.6M volumes to EF 2.0 and reprocesses all texts, citing "substantial improvements in OCR quality since 2020." HTRC's [Derived Datasets page](https://analytics.hathitrust.org/deriveddatasets) still lists only the 2020 **EF 2.0** (17,123,746 volumes, 10,550,952 in copyright); a 17.1M figure elsewhere means that release. Not every HathiTrust volume has a file: EF 2.5's 9.97M in-copyright volumes compare with 11.4M search-only volumes in the October 2026 Hathifiles.

**Per page you get** (schema shared with EF 2.0):

- `seq` (scan sequence), token, line and sentence counts, and a detected language;
- for each of header, body and footer: `tokenPosCount` (every token with its part-of-speech tag and count), plus `beginCharCount` and `endCharCount` (the first and last characters of lines).

That is enough to:

- **Rank pages by a term profile**, e.g. BM25 over pages.
- **Read the running heads**, which usually carry chapter titles and printed page numbers.
- **Detect table-of-contents pages.** These are front-matter pages where many lines end in a digit.

It is not enough for phrase search: "proper scoring rule" becomes three unordered unigrams on a page.

### What it looks like on a real book

Frank Lad's *Operational Subjective Statistical Methods* (Wiley, 1996) is HathiTrust volume `mdp.39015038140094`, "Limited (search-only)". Its EF 2.5 file is 328 KB of bzip2 for 516 pages.

- **Concentration.** "Scoring" appears on 50 pages. It concentrates on scan pages 356–379, where it occurs up to 14 times per page.
- **Chapter and printed pages.** The header tokens on those pages are "PROPER", "SCORING" and "RULES", next to the numerals 334, 336, … 356. EF stores header words as a bag, so the running head "Proper Scoring Rules" is reconstructed, not read. Printed page = scan page − 22, an offset supported by 243 header numerals across the book. Scan page 355 carries "CHAPTER", "6" and the same three words, so Chapter 6 runs from printed p. 333 to about p. 370. The heaviest page is printed p. 336. Later headers carry the words of "distinguishing properties of various scoring rules" and "the calibration question".
- **Table of contents.** Front-matter scan pages 9–15 have 35–46% of their lines ending in a digit, against 0–4% on the preface pages that follow. Pages 12, 13 and 15 contain "scoring", so the table of contents itself lists the topic.

Producing all of that took one 328 KB download and about 40 lines of Python. No text of the book was involved.

### The shutdown

The [HTRC Analytics homepage](https://analytics.hathitrust.org/) (read 2026-10-15) says:

- "HTRC has discontinued its services as of September 30, 2026." "HTRC accounts and logins are no longer available."
- "HTRC Algorithms and Data Capsule services have also been discontinued."
- In October 2024 HathiTrust announced that "funding for the Research Center would cease at the end of 2026, at which time the center will be formally closed."
- What remains "without an HTRC Analytics account" is HathiTrust+Bookworm, the Derived Datasets, and one visualization (Gendered Characterizations). "Access to the HathiTrust Digital Library remains open."

The Data Capsules were the sanctioned way to run your own code over in-copyright HathiTrust full text, under HathiTrust's "non-consumptive research" policy. That route is gone. No replacement was announced [~80% that none exists as of October 2026]. Two things survive: the derived datasets, and HathiTrust's interactive search.

**Downloading EF after the shutdown.** The documented route is rsync from `data.analytics.hathitrust.org::features-2025.04/` ([download docs](https://htrc.atlassian.net/wiki/spaces/COM/pages/43288147), updated 2025-07-11). I could not test rsync from this environment. The same host over HTTPS did work on 2026-10-15:

- it served directory listings under `https://data.analytics.hathitrust.org/features-2025.04/`;
- it returned the 52 files used in the worked example below (20 MB in total);
- in the one directory listing I inspected, some files carry modification dates as late as 2026-10-06, consistent with the incremental-update note.

The HTTPS route is not documented, so do not assume it will last. The Extracted Features Download Helper, which turned a workset into an rsync script, ran on HTRC Analytics and is gone. Compute file paths yourself (the "stubbytree" rule below) or with `htid2rsync` from the [HTRC Feature Reader](https://github.com/htrc/htrc-feature-reader) Python package.

```python
# Stubbytree path for an EF 2.5 file (rule from HTRC's download docs)
def ef_path(htid: str) -> str:
    prefix, rest = htid.split(".", 1)
    clean = rest.replace(":", "+").replace("/", "=")
    return f"{prefix}/{clean[0::3]}/{prefix}.{clean}.json.bz2"

ef_path("mdp.39015038140094")
# 'mdp/31349/mdp.39015038140094.json.bz2'
```

**How long will it stay up?** I put **[~60%]** on EF 2.5 still being downloadable from an official HathiTrust or HTRC host on 2027-06-30.

- *For:* the Derived Datasets page was explicitly kept alive past the shutdown, and HathiTrust has kept other bulk files public.
- *Against:* the center itself closes at the end of 2026, and nothing on the site promises hosting.

**Decision.** If page-level search over in-copyright books matters to your tool, mirror your subset now. The 52 files in the worked example averaged 387 KB, for books averaging 599 pages. The dataset-wide mean is about 235 KB per volume (4.4 TB over 18.7M volumes). So 10,000 volumes come to roughly 2.4–3.9 GB, and the full set is 4.4 TB. The license is CC BY 4.0, so a mirror can be shared with attribution.

## Google Books Ngram Viewer: which words, which decades

The [Ngram Viewer](https://books.google.com/ngrams/info) charts how often a phrase of up to 7 words appears in Google's scanned books, year by year. It added "a new Ngram Viewer dataset" in July 2024, the first since the corpora generated in February 2020, and its "graphs and data may be freely used for any purpose." It says nothing about pages. It settles two earlier choices: which words to search for, and which decades to expect books from.

I queried the viewer's undocumented JSON endpoint (`books.google.com/ngrams/json`) on 2026-10-15 with `corpus=en`, which returned data through 2022. The info page does not give the July 2024 dataset's year range or say which corpus `en` maps to; I assume it is the 2024 dataset [~85%].

| Phrase | First non-zero year | Frequency 1970 | Frequency 2000 | Frequency 2022 |
|---|---|---|---|---|
| "proper scoring rule" | 1954 (every year from 1969) | 2.7 × 10⁻⁹ | 3.6 × 10⁻¹⁰ | 6.0 × 10⁻⁹ (series peak) |
| "Brier score" | 1954 | 1.2 × 10⁻⁹ | 1.6 × 10⁻⁹ | 2.3 × 10⁻⁸ |
| "quadratic scoring rule" | 1954 | 1.3 × 10⁻⁹ | 5.2 × 10⁻¹⁰ | 2.3 × 10⁻⁹ (series peak 2018) |
| "logarithmic scoring rule" | 1961 | 7.9 × 10⁻¹⁰ | 3.1 × 10⁻¹⁰ | 1.5 × 10⁻⁹ (series peak 1993) |
| "spherical scoring rule" | 1968 | 2.2 × 10⁻¹⁰ | 0 | 0 (series peak 1993) |

**What this tells you about scoring rules.** The literature has two eras:

- a 1960s–1970s decision-analysis and subjective-probability era, which the worked example below confirms;
- a post-2010 forecasting and machine-learning era, in which "Brier score" grew about 19-fold from its 1970 level.

A complete search therefore covers the singular and plural phrase, the named rules (quadratic, logarithmic, spherical, Brier) and "strictly proper"; the worked example below searched only the singular and plural phrase. Expect the older books to be in HathiTrust and the newer ones not.

## Worked example: locating proper scoring rules in 179 books

Everything below ran on 2026-10-15. The scripts made about 700 polite API calls and downloaded 20 MB. Wall-clock time was about 15 minutes, nearly all of it rate-limit sleeps.

| Step | Call | What it returned | Time, cost |
|---|---|---|---|
| 1. Vocabulary | Ngram JSON for the phrases above | The two eras; a list of variant phrasings | 2 calls |
| 2. Candidates | `search/inside.json` for `"proper scoring rule"` and `"proper scoring rules"`, all pages | 97 and 140 volumes; **179 distinct** (58 matched both). 177 in `printdisabled`, 73 in `inlibrary`. Top subject facets for the singular phrase: "Decision making" (11), "Bayesian statistical decision theory" (8), "Probabilities" (6), "Economic forecasting" (5). All 97 singular-phrase hits were English | 14 calls, under a minute, \$0 |
| 3. Triage | Read the snippets (1–5 per volume per query; 85 of the 179 volumes yielded only one) | Sorts textbooks that define proper scoring rules from passing mentions and from catalog errors. One hit catalogued as *St. John's Pentateuch: An Interpretation of the Fourth Gospel* has scanned text that is a glossary of decision-analysis terms. Claude can do this in one pass: about 80k input tokens, under \$0.25 on Sonnet 5.5 at \$2/\$10 per million input/output tokens (October 2026) [estimate] | Minutes by eye |
| 4. Map to HathiTrust | IA metadata API for ISBN and OCLC, then the HathiTrust Bib API | 178 of 179 had an ISBN, 54 an OCLC number. **52 matched a HathiTrust record (29%), all "Limited (search-only)"**, none full view | About 5 minutes |
| 5. Locate pages | EF 2.5 file per matched volume. Count pages where "scoring" co-occurs with "proper", "strictly" or "rule(s)" in the body. Cluster adjacent pages. Read running-head numerals to convert scan pages to printed pages | 52 files, 20 MB, 49 distinct volumes. 45 had at least one co-occurrence page. A running-head page offset was recoverable (10 or more supporting numerals) for 43. **17 had a cluster of 3 or more pages**, the signature of a section rather than a mention | About 2 minutes |
| 6. Verify | HathiTrust full-text search inside each short-listed volume, by hand. Google Books search for the rest | Page numbers and per-page counts (HathiTrust) or 3 snippets (Google). Not scripted; 403 to bots | About 1–2 minutes per book [estimate] |
| 7. Route | The [Access Ladder](/access/access-ladder/) | See the next section | — |

**The result.** The table lists 14 books located to pages through HathiTrust and EF, then 6 strong candidates with no HathiTrust record by ISBN. For those six, the snippets confirm the topic, but pages require a loan, a preview or a purchase. "Pages" are printed page numbers inferred from running-head numerals. Where the running heads carry no numerals, scan pages are given. Running-head wording is reconstructed from EF's bag of header words. First authors and years come from IA metadata; co-authors and co-editors (rows 2, 6, 8, 16, 17, 20) and the edition in row 18 are from background knowledge. "Lendable" means the IA copy is in the `inlibrary` collection; "print-disabled only" means IA serves it only to certified print-disabled readers.

| # | Book (year) | Where | Evidence | Free route on 2026-10-15 |
|---|---|---|---|---|
| 1 | Lad, *Operational Subjective Statistical Methods* (1996) | pp. 334–357 and 367–370 (ch. 6, "Proper Scoring Rules"); peak p. 336 | 37 co-occurrence pages; TOC lists the topic | HathiTrust search-only; IA print-disabled only |
| 2 | Kyburg and Smokler (eds.), *Studies in Subjective Probability* (1980) | pp. 177–191; peak p. 187 | Running head "The Elicitation of Personal Probabilities and Expectations", the title of [Savage's 1971 JASA paper](https://doi.org/10.1080/01621459.1971.10482346), so probably a reprint [~90%] | Search-only. The JASA original is the easier read |
| 3 | *Studies in Bayesian Econometrics and Statistics in Honor of Leonard J. Savage* (1975) | pp. 140–152; peak p. 151 | Running heads "Elicitation of personal probabilities", "Savage" | Search-only; IA lendable |
| 4 | *Computing with Social Trust* (2009) | pp. 190–212; peak p. 190 | Chapter running head "Eliciting Informative Feedback" (Miller et al.), i.e. peer prediction | Search-only |
| 5 | *Machine Learning Challenges* (PASCAL workshop, 2006) | pp. 95–108; peak p. 106 | Running heads "Kohonen and Suomela", "Predictions"; 22 co-occurrence pages | Search-only |
| 6 | Brown et al., *Decision Analysis for the Manager* (1974) | pp. 425–438; peak p. 425 | Running heads "Veridicality of Probability Assessments", "Calibration" | Search-only; IA lendable |
| 7 | *New Developments in the Applications of Bayesian Methods* (1977) | pp. 78–85; peak p. 85 | Running heads "Hogarth", "Cognitive Processes … Probability Assessment" | Search-only; IA lendable |
| 8 | Hardaker et al., *Coping with Risk in Agriculture* (1997) | pp. 62–66 | Chapter running head "Making Better Probability Judgements" | Search-only; IA lendable |
| 9 | *Risk Evaluation and Management* (1986) | pp. 300–308; peak p. 307 | Part running head "Improving Risk Evaluation Methods" | Search-only; IA lendable |
| 10 | *Handbook of Agricultural Economics* (2001) | pp. 185–204 | Running heads "Expectations, Information and Dynamics", "Nerlove", "Bessler" | Search-only |
| 11 | *A Science of Decision Making: The Legacy of Ward Edwards* (2009) | pp. 223–233 | 15 co-occurrence pages | Search-only; IA lendable |
| 12 | Walley, *Statistical Reasoning with Imprecise Probabilities* (1991) | pp. 247–248; Appendix H, pp. 630–631 | 19 scattered co-occurrence pages: a recurring tool, not one section | Search-only; IA lendable |
| 13 | Lindley, *Making Decisions* (1985) | Scan pp. 177–182 (no page numerals in running heads) | 19 co-occurrence pages | Search-only |
| 14 | *Probability, Statistics, and Decision Making in the Atmospheric Sciences* (1985) | Scan pp. 405–407 and 437–441 | 23 co-occurrence pages | Search-only |
| 15 | Cooke, *Experts in Uncertainty* (1991) | Not located | 10 snippets across both phrasings | IA print-disabled only; no HathiTrust match |
| 16 | von Winterfeldt and Edwards, *Decision Analysis and Behavioral Research* (1986) | Not located | 10 snippets | IA lendable |
| 17 | Bernardo and Smith, *Bayesian Theory* (1994) | Not located | 4 snippets | IA print-disabled only; check a library |
| 18 | Wilks, *Statistical Methods in the Atmospheric Sciences* (3rd ed., 2011) | Not located | 6 snippets | IA print-disabled only; check Google Books preview |
| 19 | Abramowicz, *Predictocracy* (2007) | Not located | 10 snippets | IA print-disabled only |
| 20 | Reich and Cotter, *Probabilistic Forecasting and Bayesian Data Assimilation* (2015) | Not located | 2 snippets | IA print-disabled only; recent, so likely buy or subscription |

**How much to trust it.**

- **The co-occurrence rule is a proxy.** "Scoring" next to "proper" or "rule" on the same page is not the phrase. It can fire on sports scoring or test scoring. Rows 1–10 rest on running heads that name the topic or on clusters of three or more dense pages, so their page ranges are probably right [~85%]. Rows 11–14 are weaker: short clusters, scattered hits or no page numerals. The single-page hits further down the full list (an index page, a bibliography) are not worth a library request.
- **ISBN matching misfires on multi-volume works.** Four matched volumes had zero co-occurrence pages, including two encyclopedias whose set ISBN pointed to the wrong volume. Check the volume number before trusting a "no hits" result.
- **Recall is unknown.** The list holds only what IA's index found under two phrasings. Books that say "strictly proper" or "quadratic score" without the exact phrase are missing. A second index gives a rough check. Run the same phrase in Google Books or HathiTrust, count the overlap with IA, and apply a Lincoln–Petersen estimate (N ≈ n₁n₂/m). Both indexes scan the same libraries' books, so independence fails and the estimate is a lower bound [inference].

## Limits and coverage

**The recency cliff.** The worked example's 179 candidates, split by publication year:

| Published | Candidates | IA lendable | In HathiTrust (search-only) | Lendable or in HathiTrust |
|---|---|---|---|---|
| Before 1990 | 56 | 37 | 26 | 46 (82%) |
| 1990–2009 | 85 | 30 | 22 | 46 (54%) |
| 2010 onward | 31 | 3 | 1 | 4 (13%) |
| Unknown | 7 | 3 | 3 | 5 |

HathiTrust match rates by decade fall from 21 of 42 (1980s) to 9 of 46 (2000s) and 1 of 30 (2010s). This is one query in one field. The direction matches how both collections were built, from research-library scanning that peaked before 2010 and from lending scans [~85% that the pattern generalizes to other technical topics]. For books from the last 15 years, Google Books and Amazon are the realistic page-level sources, and they ration what they show.

**Other limits, by service.**

| Limit | Affects | What to do |
|---|---|---|
| No phrase search | EF (unigram counts) | Use IA or HathiTrust for phrases; use EF to place them on pages |
| OCR and catalog errors | All scan-based indexes | Expect misses on equations and hyphenated line breaks, and mislabeled scans (a record titled *St. John's Pentateuch* in the worked example holds a decision-analysis glossary) |
| Snippet caps | IA (5 per volume per query), Google (3 per term) | Treat snippets as evidence of topic, not of extent; use per-page counts for extent |
| Bot walls | HathiTrust search, OL web UI, Google Books API without a key | Script the candidate and EF steps; verify by hand |
| Snapshot lag | EF (April 2025); Hathifiles monthly; IA continuous | Newer scans will be in IA before EF |
| Language | All; all 97 singular-phrase hits were English | Search each language's own term; facets show the language mix |
| Edition drift | All | Page numbers belong to one edition. Carry the HathiTrust ID or IA identifier with every page reference |

## From hits to a reading plan

The output of search is a list of (book, page range) pairs. The plan is to get each range in front of you at the lowest cost.

| What the hit tells you | Do this | Cost (Oct 2026) | Catch |
|---|---|---|---|
| HathiTrust full view | Read it on HathiTrust now | Free | Rare for anything in copyright; none of the 52 matches here |
| IA lendable (`inlibrary`) | Borrow on Open Library and go straight to the pages | Free with an account | Limited copies, and the pool shrinks: more than 500,000 books were withdrawn from lending as a result of the *Hachette* suit ([Wikipedia](https://en.wikipedia.org/wiki/Hachette_v._Internet_Archive), secondary) |
| Search-only in HathiTrust, older book, a short range | Ask a [university or employer library](/access/academic-and-employer/) for a chapter scan, or borrow the book by interlibrary loan through your [public library](/access/public-libraries/). Use the Hathifiles OCLC number to find holders through [WorldCat](https://search.worldcat.org/) by hand | Usually free [~70%; varies by library]. Oakland Public Library, for example, allows 3 interlibrary-loan requests a month and some loans carry a fee ([R03 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md), 2026) | Days to weeks; do not scrape WorldCat ([Catalogs and Metadata](/finding/catalogs-and-metadata/)) |
| An edited-volume chapter | Look for the original article or a preprint (row 2's chapter is Savage's 1971 JASA paper) | Often free | Reprints may be revised |
| Recent book, in print | Confirm pages in Google Books preview or Amazon Look Inside, then check [subscriptions](/access/subscriptions/) or buy used | Varies | Previews may withhold exactly the pages you need |
| You will reread it, or the range is over about 50 pages | Buy it | Varies | The decision is about reuse, not one lookup |
| You have a qualifying print disability | IA's print-disabled program and HathiTrust's accessible-text service cover the search-only books [~85%] | Free | Eligibility must be certified. HathiTrust's service is, to my knowledge, open only to users at its member institutions [~80%; its pages returned 403] |

**Batch by route, not by rank.** In the worked example, all 14 located books are search-only in HathiTrust, and 7 of them (rows 3, 6–9, 11, 12) are also lendable on IA. A sensible plan:

1. Borrow the lendable ones in one sitting, using the page ranges to read only the relevant sections.
2. Send one library request covering the remaining older chapters.
3. Spend money only on the two or three post-2005 books whose previews confirm substantial treatment.

The full routing logic, including the cases where the answer is a subscription or an institutional login, is in [The Access Ladder](/access/access-ladder/).

## The legal basis, briefly

| Case | Holding relevant here | Status |
|---|---|---|
| [*Authors Guild v. HathiTrust*](https://cases.justia.com/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.pdf), 755 F.3d 87 (2d Cir., 2014-06-10) | Full-text search over scanned in-copyright books, returning page numbers and per-page counts only, is fair use. Access for print-disabled readers is fair use | Final; remaining claims settled 2015-01-06 ([summary](https://en.wikipedia.org/wiki/Authors_Guild,_Inc._v._HathiTrust)) |
| [*Authors Guild v. Google*](https://cases.justia.com/federal/appellate-courts/ca2/13-4829/13-4829-2015-10-16.pdf), 804 F.3d 202 (2d Cir., 2015-10-16) | Scanning, search and snippet display are fair use. The snippet limits above (three per term, an eighth of a page, blacklisting) were central to the holding | Final; certiorari denied 2016-04-18 ([summary](https://en.wikipedia.org/wiki/Authors_Guild,_Inc._v._Google,_Inc.)) |
| [*Hachette v. Internet Archive*](https://storage.courtlistener.com/recap/gov.uscourts.ca2.60988/gov.uscourts.ca2.60988.306.1.pdf) (2d Cir., 2024-09-04) | Lending scans of in-copyright books under controlled digital lending is not fair use | Final; the Internet Archive did not seek Supreme Court review. Affects reading, not search |

**For people building tools** (the Legal Map's risk ratings):

- Page-level search over EF token counts is green: CC BY 4.0 data and non-expressive features.
- HathiTrust-style output (page numbers and counts) over books you bought and scanned yourself is yellow-green.
- Showing snippets from in-copyright books is yellow. If you do it, copy Google's caps: few snippets per term and per page, some pages withheld, nothing reconstructable.
- The API terms of Google Books and Open Library constrain caching and bulk use more tightly than copyright does.

None of this is legal advice. See [The Legal Map](/building/legal-map/).

## Open questions

- **Who will host EF 2.5 after HTRC formally closes at the end of 2026?** Will the HTTPS listing at `data.analytics.hathitrust.org/features-2025.04/` stay up? Watch the Derived Datasets page and the rsync module in January 2027.
- **Is there now any sanctioned programmatic route to HathiTrust full-text search for search-only volumes?** Data Capsules were the old answer. Ask HathiTrust whether an API key or allow-listing exists for non-consumptive research.
- **Does Open Library expose the hit page anywhere for restricted books?** For example, through BookReader search during a loan. Could `page_num` be renamed or documented to stop the misreading? A short exchange on the Open Library GitHub would settle it.
- **How do IA search-inside and HathiTrust full-text search compare on recall for the same phrase?** Take 20 known books on scoring rules, run both, and measure the overlap. That also calibrates the Lincoln–Petersen estimate above.
- **What fraction of EF co-occurrence clusters of 3 or more pages are real treatments rather than mentions?** Hand-label 100 clusters against HathiTrust search results. If precision is high, EF alone can drive a "chapter shelf".
- **How accurate is running-head page-offset recovery across the 9.97M in-copyright EF volumes?** It worked for 43 of 49 here. Front-matter roman numerals, unnumbered plates and multi-part volumes are the likely failure modes.
- **What daily quota does a new Google Books API key get in 2026?** The documentation page does not say. Create a key and read the Cloud console quota page.
- **What share of post-2015 technical books has Look Inside with search enabled, do its results give page numbers, and how many pages can a signed-out user see?** Sample 50 recent statistics and ML titles.

## Related pages

- [Catalogs and Metadata](/finding/catalogs-and-metadata/): Open Library dumps, Hathifiles and the join keys this workflow uses
- [Browsing the Stacks](/finding/browsing-the-stacks/): finding books by shelf position rather than by term
- [AI Research Assistants](/finding/ai-research-assistants/): why paper-centric AI tools miss books, and where this chapter fills in
- [The Access Ladder](/access/access-ladder/): routing each hit to the cheapest legal copy
- [Public Libraries](/access/public-libraries/) and [University and Employer Access](/access/academic-and-employer/): where search-only pages usually end up being read
- [Cheap Subscriptions](/access/subscriptions/): for recent books with no free route
- [The Legal Map](/building/legal-map/): the fair-use cases and API terms in full
- [A Reference Architecture](/building/reference-architecture/): how EF page counts and search-inside fit into a personal catalog
