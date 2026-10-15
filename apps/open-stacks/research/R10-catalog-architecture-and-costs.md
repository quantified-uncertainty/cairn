# Catalog architecture and costs: building a personal "catalog of everything" explorer with Claude Code (research dossier)

- **Date:** 2026-10-15
- **Track:** R10, the architecture and costs of a personal literature explorer.
- **Scope:** Data sources and their 2026 sizes, access terms and rate limits. Parsing pipelines (PDF/EPUB/OCR). Embeddings and vector search. Static-site search options. LLM enrichment costs at October 2026 prices. Open projects worth reusing. A reference architecture, a cost table at three scales (1k, 100k and 10M works), effort tiers for building with Claude Code, and the main failure modes.
- **Method:**
  - **Web research.** About 45 web searches, then direct fetches of official pages: pricing pages, documentation, GitHub READMEs and Hugging Face model and dataset cards.
  - **Live measurements.** Several numbers here were measured on 2026-10-15 against primary endpoints rather than read from secondary sources:
    - HTTP HEAD requests on the Open Library dump files.
    - The Wikidata dump directory listing.
    - The Semantic Scholar Datasets API release manifest.
    - A full streaming count of the October 2026 HathiTrust Hathifile.
    - `completeListSize` from the DOAB and OAPEN OAI-PMH endpoints.
    - Internet Archive `advancedsearch` counts.
    - The OpenStax CMS API.
    - The Kiwix OPDS catalog.
    - The Project Gutenberg `pg_catalog.csv`.
  - **Search budget.** The shared web-search budget ran out partway through, so some secondary items (LibraryThing APIs, BASE, Podcast Index, Turbopuffer per-GB rates, Cohere and Mistral OCR per-unit prices) could not be re-verified. Each is flagged where it appears.
- **Key primary sources:**
  - Pricing pages: Anthropic, OpenAI, Google Gemini, Voyage.
  - OpenAlex help center: pricing, snapshot, full text.
  - Crossref data-file page; arXiv bulk-data page; Semantic Scholar Datasets API; HathiTrust file list; Wikimedia dumps.
  - READMEs and benchmarks: OmniDocBench, olmOCR, Marker, MinerU, Docling, GROBID, pgvector, sqlite-vec, LanceDB, Pagefind, DuckDB-Wasm.
- **Labels used:**
  - **[V]** verified on a primary source in this session.
  - **[S]** reported by a secondary source.
  - **[I]** my inference or calculation.
  - **[P]** prior knowledge, not re-verified this session.
  - Confidence is marked as high, medium or low, or as a probability such as [~70%].

---

## Executive summary

1. **Bulk metadata for "everything" is free and fits on one workstation, at about 1.2–2.4 TB raw** (≈1.24 TB for the core files below; ≈2.3 TB with S2 citations and SPECTER2) [corrected in verification]. All figures [V]:
   - The OpenAlex snapshot is still free on S3, at ~745 GB JSONL or ~770 GB Parquet, with ~626M records. It is released quarterly.
   - The Crossref 2026 public data file is 208 GB and holds ~180M records.
   - The Wikidata JSON dump is 156.5 GB gz (13 Oct 2026).
   - The Open Library dump of 2026-09-30 is 18.2 GB for all types (12.6 GB editions, 4.1 GB works).
   - The HathiTrust Hathifile of 2026-10-01 is 1.23 GB and lists 19.70M items.
   - The Semantic Scholar release of 2026-10-06 ships 200M papers, 100M abstracts, 58M TLDRs and 120M SPECTER2 embeddings. It needs a free key.
2. **The OpenAlex API is no longer "free and unlimited"** [V, high].
   - **Free allowance:** keys are free, and a free key gets $1/day of usage. Without a key you get $0.10/day.
   - **Per-call prices:** list/filter costs $0.10 per 1,000 calls, search and semantic search $1 per 1,000, and PDF downloads $10 per 1,000. Single-entity lookups are free.
   - **Daily snapshots** come only with the $10,000/yr Member+ plan.
   - **Design consequence:** bulk-load from the snapshot and use the API only for deltas and lookups.
3. **LLM enrichment is now cheap enough to "summarize everything"** [V prices, I totals].
   - Claude Haiku 5.5 costs $0.10/$0.50 per MTok, or $0.05/$0.25 in batch, for prompts up to 100k tokens. Above 100k tokens it costs 5× more.
   - gpt-5-nano batch is $0.025/$0.20. Gemini 3.5 Flash-Lite batch is $0.15/$1.25.
   - **100k books from metadata plus TOC:** about $10–60 with a small model, or ~$300 with Sonnet 5.5 batch.
   - **10k books from full text:** about $50–300 small, or ~$1,800 with Sonnet 5.5.
   - **1M paper abstracts:** about $40–260 small, or ~$1,250 with Sonnet 5.5.
   - Add about 30% for Claude 4.7+ tokenizer inflation, plus any thinking or reasoning tokens.
4. **Chunk long books below 100k tokens when using Claude Haiku 5.5** [V price tiers, I tactic]. A typical scanned library volume is ~250k tokens. Map-reduce in ≤100k chunks keeps you on the $0.05/MTok batch tier instead of $0.25/MTok, a 5× saving.
5. **Embeddings cost little next to everything else** [V]:
   - OpenAI text-embedding-3-small costs $0.02/MTok.
   - voyage-4-lite costs $0.02/MTok, and every Voyage-4 model comes with 200M free tokens.
   - Gemini Embedding 2 costs $0.20/MTok, or $0.10 in batch.
   - Strong open models run locally: Qwen3-Embedding 0.6B/4B/8B (Apache-2.0, 32k context) and EmbeddingGemma-300M.
   - Embedding 1.5B tokens of full text costs ~$30 with the cheapest API models.
6. **For papers, a lot is precomputed** [V]. Semantic Scholar gives you SPECTER2 vectors for 120M papers and TLDRs for 58M. OpenAlex holds GROBID TEI for ~43M OA works, about 20 TB. Reuse these before paying to generate your own, and check each dataset's license.
7. **Parsing quality has shifted to small specialized VLMs** [V]. On OmniDocBench v1.6 the top scores are TeleOCR at 1.2B (96.91), OvisOCR2 at 0.8B (96.47) and PaddleOCR-VL-1.6 at 0.9B (96.34), with MinerU2.5-Pro at 1.2B fourth (95.75) [corrected in verification]. Gemini 3 Pro scores 92.91 and Marker 78.44. On the separate olmOCR-Bench, olmOCR v0.4.0 scores 82.4 and Marker 76.1. olmOCR claims under $200 per million pages. For born-digital EPUB/HTML (Gutenberg, OpenStax, LibreTexts), skip PDF parsing entirely.
8. **Static hosting can now carry a surprisingly large catalog** [V capabilities, I design]:
   - Pagefind handles tens of thousands of pages with roughly 100–300 kB per search.
   - DuckDB-Wasm reads Parquet over HTTP range requests, within a 4 GB Wasm memory cap.
   - sql.js-httpvfs serves SQLite over HTTP range requests.
   - transformers.js embeds queries in the browser.
   - A 10M-work index is feasible as sharded Parquet plus quantized vectors on a CDN. A server is needed only for heavy semantic search or writes.
9. **Rate limits push you toward bulk-first designs.** All [V] except where noted:
   - Open Library: 1 req/s, or 3 req/s with an identifying User-Agent. It explicitly bans bulk metadata harvesting via the API.
   - Crossref: public pool 5 with concurrency 1, polite pool 10 with concurrency 3, Plus 150.
   - Semantic Scholar keys start at 1 RPS.
   - YouTube: 10,000 units/day, plus a separate cap of 100 `search.list` calls/day.
   - The Internet Archive publishes no limits [S].
10. **Licensing traps are the hidden cost** [V]:
    - **OpenStax:** 70 of the 84 live books with a stated license are CC BY-NC-SA. The CC BY books are mostly retired.
    - **MIT OCW** is CC BY-NC-SA 4.0.
    - **arXiv's default license** doesn't let you redistribute, and tools built on its full text must link back to arXiv.
    - **Institutional Books** (983k PD volumes) is noncommercial and bans redistribution.
    - **US-PD-Books:** the Internet Archive asked for its texts to be removed because IA metadata is "too unreliable" to determine public-domain status.
    - **Model weights:** Marker's are free only under $5M in funding or revenue. Nougat's are CC-BY-NC.
11. **Deduplication (FRBR work clustering) is the hardest engineering problem, not search** [I, high confidence]:
    - HathiTrust is item-level: 19.7M items, with many duplicate volumes per title.
    - Open Library separates works from editions but has duplicates.
    - Crossref mints DOIs per chapter.
    - OpenAlex leaves XPAC records out of the API by default: 327M works vs ~476M with `corpus=all`.
    - Budget about a third of build effort for ID crosswalks and clustering.
12. **What is actually free to read, measured 2026-10-15** [V]:
    - HathiTrust: 8.29M full-view items (pd 5.87M, pdus 2.30M, CC ~0.10M, plus ~29k `ic-world`/`und-world`) [corrected in verification].
    - Open Library: 1.86M works with public ebooks and 2.91M borrowable.
    - Project Gutenberg: 78,325 texts.
    - DOAB: 128,285 OAI records. OAPEN: 59,193.
    - arXiv: 3.21M submissions.
13. **Effort with Claude Code** [I]:
    - A weekend prototype gets one or two sources, ~10k works, summaries, embeddings and a static site.
    - A month gets eight to ten source adapters, a unified work record, basic clustering, hybrid search and a topic map.
    - A quarter gets 10M works with incremental updates, an evaluated entity resolution set, a rights engine, multiple UIs and an MCP server.
    - The big risks are dedup quality, OCR noise, and license or rights determination.
14. **Several prices change soon** [V]. Gemini 3.8 Flash's introductory $0.75/$3.75 doubles to $1.50/$7.50 on 2027-01-01. Re-price any long-running job after year-end.

---

## Detailed findings

### 1. Data sources: sizes, access and terms (October 2026)

#### 1.1 Scholarly metadata

| Source | What you get | Size / count (date) | Access | Rate limits / price | License | Status 2026 |
|---|---|---|---|---|---|---|
| **OpenAlex snapshot** | Works, authors, sources, institutions, topics, funders; JSONL and (new) Parquet | ~745 GB JSONL gz (works ~615 GB); ~770 GB Parquet; ~626M records per format (Sept 2026 release) [V][4] | `s3://openalex` with `--no-sign-request`; AWS Open Data pays the ~$70 transfer per download [V][4] | Free; **quarterly** (second Wednesday of Jan/Apr/Jul/Oct) [V][4] | CC0 [P, high] (bucket has LICENSE.txt [V]) | Active. Pre-2026 layout moved to frozen `legacy-data/`; n-grams retired; `deleted_ids.csv.gz` added 2026-09-23 [V][4] |
| **OpenAlex API** | Same entities, live | API default ~327M works; ~476M with `corpus=all` (includes XPAC expansion works) [V][4] | Free key required for real use; 10/30/50 req/s for no key / key / annual plan; semantic search 1 req/s [V][1] | $0.10/day without a key, $1/day with a free key; list $0.10 per 1k calls; search $1 per 1k; PDF $10 per 1k; singleton lookups free [V][2][3] | CC0 data [P] | Usage-based pricing is new (2025–26). Annual plans are Member at $5k/yr, Member+ at $10k/yr (daily snapshot), Partner from $20k [V][2] |
| **OpenAlex full text** | Cached OA PDFs plus GROBID TEI | 50M+ PDFs (~250 TB); ~43M TEI XML (~20 TB) [V][5] | `content.openalex.org` (counts against daily budget); bulk sync is a paid add-on on Cloudflare R2 [V][5] | $10 per 1,000 PDFs via API [V][3] | PDFs keep original copyright; filter on `best_oa_location.license` [V][5] | New and important |
| **Crossref public data file** | All Crossref DOIs' metadata | 2026 file: 208 GB, ~180M records (through part of Mar 2026) [V][6]. 2025 file: 197 GB, 165M+ records [S][7] | Download via DOI 10.13003/nggf-vt1j [V][6] | Free (annual) | Metadata mostly free to reuse [P] | Annual cadence |
| **Crossref REST API** | Live queries, deltas | — | No sign-up; `mailto=` puts you in the polite pool [V][8] | Public 5 (concurrency 1); polite 10 (concurrency 3); Metadata Plus 150 (no concurrency cap) [V][8] | — | Page updated 2025-10-16 |
| **Semantic Scholar datasets** | papers 200M; abstracts 100M (30×1.8 GB); authors 75M; citations 2.4B (30×8.5 GB); SPECTER2 embeddings 120M (30×28 GB = ~840 GB); s2orc_v2 full text 16M (30×6 GB); TLDRs 58M (30×200 MB); paper-ids 450M [V][27] | Release `2026-10-06` [V][27] | S3 download links need a free API key; samples are public [V][27] | API keys start at 1 RPS; unauthenticated traffic shares 1,000 req/s [V][28] | Abstracts: ODC-BY; the manifest describes them as "Paper abstract text, where available" [V][27] [corrected in verification]; others per-dataset README (SPECTER embeddings are Apache-2.0) | Releases roughly weekly since 2022 [V][27] |
| **arXiv bulk** | PDFs plus LaTeX source | ~9.2 TB total as of Apr 2025, +~100 GB/month; ~500 MB tar chunks [V][24] | Requester-pays S3 in us-east-1 [V][24] | You pay AWS egress. In-region processing avoids it [I] | Default arXiv license doesn't permit redistribution; "you must link back to arXiv" [V][24] | 3,213,484 total submissions as of 2026-10-15 [V][25] |
| **arXiv metadata** | Kaggle `arxiv-metadata-oai-snapshot.json`; OAI-PMH | Kaggle page unreadable by fetch; 2020 launch figure was 1.7M articles [S] | Kaggle (free account) or OAI-PMH | — | CC0 metadata [P, medium] | Kaggle snapshot believed to update weekly [S, low] |

#### 1.2 Book and library metadata

| Source | What you get | Size / count (date) | Access | Limits / price | License | Notes |
|---|---|---|---|---|---|---|
| **Open Library dumps** | Editions, works, authors, redirects, reading log, ratings, Wikidata links | **2026-09-30 dump:** editions 12.62 GB, works 4.07 GB, authors 0.78 GB, all-types 18.18 GB (gz) [V, HEAD on archive.org][9]. The dumps page still lists older sizes (9.2/2.9/0.5/12.4 GB; last edited 2025-06-10) [V][9] | `openlibrary.org/data/ol_dump_*_latest.txt.gz` redirects to archive.org | Free, monthly [V][9] | Not stated on dumps page [V]; generally treated as open [P] | TSV of type, key, revision, last_modified and JSON [V][9] |
| **Open Library API** | Search, works, editions, covers, subjects, search-inside | 1,861,679 works with `ebook_access:public`; 2,907,228 borrowable (2026-10-15) [V][11] | Must send a User-Agent with app name and contact [V][10] | 1 req/s default, 3 req/s identified; **no bulk metadata via API**; no multi-IP spreading [V][10] | — | Violations may be blocked [V][10] |
| **Wikidata** | Entities incl. books, authors, identifiers (ISBN, OCLC, LCCN, OL, VIAF) | `latest-all.json.gz` 156.5 GB (13 Oct 2026); bz2 103.4 GB; truthy N-Triples gz 71.7 GB [V][12] | dumps.wikimedia.org, weekly | Free | CC0 [P, high] | Grew from 127 GB in June 2024 [S] |
| **Library of Congress MDSConnect** | ~25M unabridged MARC records (books, serials, maps, music, names and subject authorities) | Nearly 25M records from the **2016** retrospective file [V][13] | Free download, UTF8 and XML, zipped [V][13] | Free. Current-year MARC Distribution Services is paid (2026 price PDF) [V][13] | US gov work; free reuse [P] | **Stale:** the free set is frozen at 2016 [V] |
| **LoC APIs** | loc.gov JSON/YAML, Text Services (OCR, word coordinates), IIIF images, Chronicling America, Linked Data Service, SRU [V][14] | — | Public | Limits documented on a separate "Working Within Limits" page (not read) [V] | Mostly PD for digitized items [P] | — |
| **HathiTrust Hathifiles** | One row per digitized item: rights, access, bib IDs (OCLC, ISBN, LCCN), title, imprint, date | `hathi_full_20261001.txt.gz` = 1,226,768,096 bytes; **19,701,406 items**; access=allow 8,293,334, deny 11,408,072; rights pd 5,870,879, pdus 2,297,084, ic 10,366,655, und 964,698, CC variants 96,499 (~0.10M), with `ic-world` 7,654 and `und-world` 21,218 making up the rest of `allow` [V, streamed count][15] [corrected in verification] | Monthly full file plus daily updates [S][16] | Free | Metadata CC0 [S][16] | "Items" are volumes, not works. Expect several items per title [I] |
| **HTRC Extracted Features 2.0** | Per-page token counts (bag of words) for every volume, including in-copyright | 17,123,746 volumes (10.55M in-copyright); ~4 TB bz2 [V][17] | rsync (per docs) [S] | Free | CC BY 4.0 [V][17] | **Stale snapshot (Feb 2020)** [V]. The HTRC services page showed a "temporarily unavailable" banner [S] |
| **Project Gutenberg** | RDF (daily), CSV (weekly), MARC (weekly) catalogs | `pg_catalog.csv` (21.3 MB) = 79,576 rows: 78,325 Text (61,817 English), 1,114 Sound; max ID 79,763 (2026-10-15) [V][34] | Use catalog files and mirrors; don't crawl [V][34] | Free | US PD texts; PG trademark terms apply [P] | Clean HTML/EPUB; no OCR needed |
| **Internet Archive** | `advancedsearch.php` (Solr) and `/services/search/v1/scrape` (cursor bulk) | `mediatype:texts` = 52,719,428 items; not access-restricted = 46,758,854; `collection:inlibrary` (lending) = 4,418,208 (2026-10-15) [V][29] | No key for reads [S] | **No published rate limits** found [S]; be polite [I] | Item-specific. IA metadata is unreliable for PD status (see §5) [V][73] | "texts" includes microfilm, serials and government documents, so not all are books [I] |
| **Open Syllabus** | 32.9M syllabi; Analytics, Co-Assignment Galaxy, Course Matcher [V][62] | — | "Most tools free" [V]; data/API terms not read | — | — | Co-assignment counts are a strong "canon" signal [I] |
| **LibraryThing** | thingISBN (ISBN→work clustering), Common Knowledge, LTFL | — | Page returned 403 | Historically noncommercial, rate-limited [P, low] | — | **Not verified this session** |

#### 1.3 Open books and textbooks

| Source | Size (measured) | Access | License | Notes |
|---|---|---|---|---|
| **DOAB** | OAI-PMH `completeListSize` = **128,285** records (oai_dc, 2026-10-15) [V][19]; may include chapters as well as books [I, medium] | `directory.doabooks.org/oai/request`; xoai format exposes all fields [S][18] | Metadata CC0 [S][18] | DOAB says ONIX 3.0, MARCXML and RIS exports are "temporarily unavailable" (undated notice) [S][18]. Selective export is optimized for ≤500 titles [S] |
| **OAPEN Library** | OAI-PMH `completeListSize` = **59,193** (2026-10-15) [V][20] | `library.oapen.org/oai/request` | Mostly CC licenses (per title) [P] | Full-text PDFs and EPUBs hosted |
| **OpenStax** | CMS API lists 129 book pages: **live** = 70 CC BY-NC-SA, 4 CC BY, 10 no license field; **retired** = 33 CC BY, 1 none; unlisted 8 NC-SA; deprecated 2 NC-SA, 1 CC BY [V][21] | `openstax.org/apps/cms/api/v2/pages/?type=books.Book` (unauthenticated JSON) [V] | Mostly NC-SA now [V]; help center confirms NC-SA [S][22] | The CC BY books (attractive for commercial reuse) are mostly retired [V] |
| **LibreTexts** | Kiwix ZIMs by library: Humanities 4.43 GB (2026-07), Chemistry 2.18 GB, Biology 2.24 GB, Social Sciences 2.05 GB, Geosciences 1.19 GB, Medicine 1.19 GB, Business 0.84 GB, Math 0.83 GB … (2025-01 to 2026-07) [V][23] | Offline ZIMs via Kiwix; LibreTexts' own API was not verified | Mixed CC per page [P] | ZIM is a practical "bulk API" [I] |
| **MIT OCW** | "2,500+ MIT courses" [V][30] | Per-course "download files for later"; 440 mirror sites; no public API mentioned [V][30] | CC BY-NC-SA 4.0 [V][30] | Folded into **MIT Learn** with AI personalization on the 2026+ roadmap [V][30]. OCW YouTube channel has 6M+ subscribers [V] |
| **Kiwix** | `wikipedia_en_all` maxi 127.4 GB (2026-08-25, 21.67M entries), nopic 52.7 GB, mini 14.4 GB; `gutenberg_en_all` 221.3 GB (2025-11-25); `wikibooks_en_all` maxi 6.2 GB [V][23] | OPDS catalog at `opds.library.kiwix.org/catalog/v2/entries?name=…` [V] | Inherits source licenses | Offline, self-contained; good for air-gapped or VR readers [I] |

#### 1.4 Lectures, video and podcasts

| Source | Facts | Implication |
|---|---|---|
| **YouTube Data API v3** | Default **10,000 units/day**, plus separate daily allocations of **100 `search.list` calls** and 100 `videos.insert`. A search query now costs 1 unit; reads ~1 unit; writes ~50 (page updated 2026-09-14) [V][31] | You can list a channel's uploads cheaply (`playlistItems.list`), but discovery-by-search is capped at 100 calls a day |
| **Captions via the official API** | `captions.download` costs 200 units and "requires the user to have permission to edit the video" (2026-09-15) [V][32] | **There is no official way to get transcripts of other people's videos** [V/I] |
| **Unofficial transcript scraping** | `youtube-transcript-api` README: YouTube blocks most cloud-provider IPs (`RequestBlocked`/`IpBlocked`). The documented fix is paid residential proxies. Issue #593 reports free proxy tiers failing [S][33] | Fragile, against YouTube's ToS [P], and costly at scale. Prefer the channel owner's own transcripts (MIT OCW publishes transcripts on course pages [P, medium]) or transcribe audio you are allowed to process |
| **Transcription cost** | OpenAI: gpt-transcribe $0.0045/min; gpt-4o-mini-transcribe ~$0.003/min (est.); Whisper $0.006/min [V][45] | 10,000 hours of lectures costs ~$1,800–3,600 [I]. Local Whisper-class models on a GPU are cheaper still [I] |
| **Podcasts** | Podcast Index offers a free API with key and secret [S]. Its site was unreachable from this environment. Listen Notes is listed (directory, secondary) at 3.3M podcasts and 190M+ episodes [S, low] | RSS feeds are the open substrate. Audiobookshelf can subscribe and auto-download [V][67] |

### 2. Parsing pipelines: PDF, EPUB, OCR, TOC

#### 2.1 Benchmarks (2026)

**OmniDocBench v1.6 (end-to-end overall score, higher is better)** [V][36]. v1.6 was dated 2026-04-10, with models added on 2026-03-31 and 2026-09-11. The README's 2026-04-30 entry says the benchmark moved on to v1.7, but the main leaderboard is still captioned "v1.6_full"; the table below is a selection of that leaderboard, not the full ranking [corrected in verification].

| Tool / model | Type | Overall |
|---|---|---|
| TeleOCR (1.2B) | Specialized VLM | 96.91 |
| OvisOCR2 (0.8B) [corrected in verification: row was missing] | Specialized VLM | 96.47 |
| PaddleOCR-VL-1.6 (0.9B) | Specialized VLM | 96.34 |
| MinerU2.5-Pro (1.2B) | Specialized VLM | 95.75 |
| GLM-OCR (0.9B) [corrected in verification: row was missing] | Specialized VLM | 95.22 |
| PaddleOCR-VL-1.5 (0.9B) | Specialized VLM | 94.93 |
| MinerU-2.5 (1.2B) | Specialized VLM | 93.04 |
| Gemini 3 Pro | General VLM | 92.91 |
| Gemini 3 Flash | General VLM | 92.62 |
| dots.ocr (3B) | Specialized VLM | 90.77 |
| DeepSeek-OCR 2 (3B) | Specialized VLM | 90.25 |
| GPT-5.2 | General VLM | 86.59 |
| MinerU-Pipeline | Pipeline | 86.47 |
| olmOCR (7B) | Specialized VLM | 85.74 |
| Mistral OCR | Specialized VLM | 85.66 |
| Marker | Pipeline | 78.44 |
| Docling | Pipeline | listed, no overall score shown |

**olmOCR-Bench (overall)**, two views:

- **As run by AllenAI** [V][37]: Chandra OCR 0.1.0 83.1, Infinity-Parser 7B 82.5, **olmOCR v0.4.0 82.4**, PaddleOCR-VL 80.0, Marker 1.10.1 76.1, DeepSeek-OCR 75.7, MinerU 2.5.4 75.2, Mistral OCR API 72.0, Nanonets-OCR2-3B 69.5.
- **As reported by Marker's README** (vendor-run; 1,403 PDFs) [V][35]: Chandra 2 (hosted) 85.8, Gemini Flash 3.5 76.4, Marker balanced 76.0, MinerU pipeline 72.7, Marker fast 66.6, **docling 50.3**, Marker fast no-OCR 43.6.

**Throughput and cost:**

- Marker reports, on one B200 host: Marker balanced 2.9 pages/s, Marker fast 7.4 pg/s, docling 2.1 pg/s, MinerU 0.54 pg/s, and Marker fast no-OCR 23.7 pg/s on CPU [V][35].
- olmOCR claims **under $200 per million pages** and needs an NVIDIA GPU with ≥12 GB [V][37].
- GROBID: one user reports ~10.6 PDFs/s on 16 CPUs, about 915k PDFs/day [V][40].

#### 2.2 Tool comparison

| Tool | Best for | License | Inputs | Hardware | 2026 status | Caveats |
|---|---|---|---|---|---|---|
| **MinerU 4.0** | High-accuracy layout, tables, formulas; now also EPUB, Office, HTML | "MinerU Open Source License" = Apache 2.0 plus additional conditions [V][38] | PDF, images, DOC/PPT/XLS, EPUB, HTML, CSV, OFD [V][38] | CPU-only ONNX tiers (2 GB RAM min); GPU tier ≥8 GB VRAM [V][38] | Active. Four tiers (flash, basic, standard, advanced); local "document library" with search [V][38] | Read the extra license conditions. Slowest in Marker's throughput table [V][35] |
| **PaddleOCR-VL** | Top OmniDocBench at 0.9B params | Apache-2.0 [P, medium] | Images/PDF | Small GPU | Active | Not verified directly this session |
| **olmOCR v0.4.0** | Scanned books and long PDFs at scale; linearized text | Apache-2.0 code; weights not stated on README [V][37] | PDF/images | ≥12 GB GPU or remote OpenAI-compatible server [V][37] | v0.4.0, 2025-10-21 [V] | Output is linear text, not rich structure [P] |
| **Marker** | Fast born-digital PDF to Markdown/JSON | **Code Apache-2.0** now; weights under modified OpenRAIL-M, free below $5M funding or revenue [V][35] | PDF, images, office [P] | GPU or CPU | Active; hosted API (1B+ pages/week claimed) [V][35] | Weights license matters for commercial tools |
| **Docling** | Structured DoclingDocument; many formats; MCP server; LF AI & Data governance | MIT (models per own license) [V][39] | PDF, DOCX, PPTX, XLSX, HTML, **EPUB**, audio (ASR), video, LaTeX… [V][39] | CPU OK; GraniteDocling-258M VLM option [V][39] | Active (v2.139.0 on PyPI, Oct 2026) [corrected in verification] | Scores low on Marker's vendor-run benchmark (50.3) [V][35]. Treat that as contested |
| **GROBID** | Scholarly articles: header, references (≈0.87–0.90 F1 extraction; >0.90 parsing), TEI full text [V][40] | Apache-2.0 [V][40] | Born-digital PDFs | CPU | Mature | **No OCR**. Not designed for books [V][40][5] |
| **Nougat** | arXiv-like PDFs to LaTeX-ish Markdown | MIT code; **CC-BY-NC weights** [V][41] | Scientific PDFs | GPU | Low activity [V/I] | `[MISSING_PAGE]` false positives; English-centric [V][41]. Superseded [I] |
| **LlamaParse (LlamaCloud)** | Hosted, agentic parsing | Commercial | Many | Hosted | Active | 1,000 credits = $1.25; basic parsing "as low as 1 credit/page" (=$1.25 per 1,000 pages); agentic tiers cost more (not itemized); free plan 10k credits/month [V][42] |
| **Mistral OCR** | Hosted OCR | Commercial | PDF/images | Hosted | OCR 4.1 is current and OCR 3 (v25.12) remains available; OCR 4.0 was retired on 2026-09-30; OCR 2 retired 2026-05-31; original OCR retired 2025-12-31 [V][43] [corrected in verification] | Per-1,000-page price not shown on fetched pages [V]. Early-2025 price was ~$1 per 1,000 pages [P, low] |
| **General VLMs (Gemini Flash, etc.)** | Very good quality; easy | API | Images/PDF | Hosted | — | Costlier per page than ~1B specialist models run locally [I] |

#### 2.3 Practical guidance [I unless marked]

- **Don't parse what you can download clean.** Gutenberg HTML/EPUB, OpenStax and LibreTexts HTML (or ZIM), arXiv LaTeX source (9.2 TB requester-pays) and OpenAlex/Semantic Scholar s2orc full text all skip PDF parsing.
- **Scanned public-domain books.** IA and HathiTrust already provide OCR text. HathiTrust offers it for full-view volumes through its data services [P]. Re-OCR with a ~1B VLM only where OCR quality is poor. Institutional Books ships OCR-quality scores you can use as a router [V][71].
- **TOC extraction, in priority order:**
  1. EPUB `nav.xhtml`/NCX.
  2. PDF outline (bookmarks) via PyMuPDF.
  3. MARC 505 "formatted contents note" in LoC, HathiTrust or Open Library records [P].
  4. Open Library `table_of_contents` field [P].
  5. VLM over the first ~15 page images, where "contents" pages are detected by layout.
  6. Heading detection in parsed Markdown.
- **Chunking.** Chunk by structure (chapter, then section, then ~500–1,000-token windows with heading breadcrumbs). Store a `(work_id, chapter_idx, section_path, char_start, char_end, page)` locator so every summary or answer can cite a page.
- **Long-book LLM summarization.** Use map-reduce with chunks ≤100k tokens: chapter summaries first, then a book summary built from them. This also gives chapter-level summaries for free, which are the most useful unit for "find the best chapter on X".

### 3. Embeddings (prices and models, October 2026)

| Model | Price / MTok | Batch | Dims | Context | License / notes |
|---|---|---|---|---|---|
| OpenAI text-embedding-3-small | $0.02 [V][45] | not listed [V] | 1536 (shortenable) [P] | 8k [P] | Cheapest mainstream API |
| OpenAI text-embedding-3-large | $0.13 [V][45] | not listed | 3072 (shortenable) [P] | 8k [P] | — |
| Voyage voyage-4-lite | $0.02 [V][47] | −33% (12h window) [V] | — | — | 200M free tokens per model, per account; the free tokens don't apply to batch [V][47] [corrected in verification] |
| Voyage voyage-4 | $0.06 [V][47] | −33% | — | — | 200M free tokens [V] |
| Voyage voyage-4-large / voyage-context-4 | $0.12 [V][47] | −33% | — | — | Contextualized chunk embeddings (context-4) suit book chunks [I] |
| Google Gemini Embedding 2 | $0.20 text (free tier available) [V][46] | $0.10 [V][46] | — | — | Multimodal: image $0.45/MTok, audio, video [V][46] |
| Cohere Embed 5 (Fast/Pro) | Model Vault only: $3–5/hour per instance [V][48] | — | — | — | Per-token price not on fetched page [V] |
| **Qwen3-Embedding** 0.6B / 4B / 8B | Free (self-host) | — | 1024 / 2560 / up to 4096; MRL [V][49] | 32k [V][49] | Apache-2.0; 8B scored 70.58, #1 on MTEB multilingual as of **2025-06-05** [V][49] (now 16 months old; likely surpassed [I]) |
| **EmbeddingGemma-300M** | Free | — | 768, MRL to 512/256/128 [V][50] | 2048 [V][50] | Gemma license (terms gate). MTEB English v2 69.67 at 768d, 66.66 at 128d [V][50]. Good for in-browser or on-device use [I] |
| **nomic-embed-text-v2-moe** | Free | — | 768, MRL to 256 [V][51] | 512 [V][51] | Apache-2.0; ~100 languages; BEIR 52.86 [V][51] |
| SPECTER2 (Semantic Scholar) | Free precomputed for 120M papers [V][27] | — | 768 [P] | title+abstract | Use for papers instead of re-embedding [I] |

**What I'd pick** [I]:

- **Weekend build:** voyage-4-lite or text-embedding-3-small. Both are $0.02/MTok, and Voyage's 200M free tokens cover ~100k books of metadata plus TOC.
- **Privacy or offline:** Qwen3-Embedding-0.6B, or EmbeddingGemma-300M, which can also embed queries in the browser via transformers.js.
- **Papers:** SPECTER2 vectors as shipped.
- **Store at 256–512 dimensions with int8 or binary quantization plus rescoring.** Storage drops 8–32× at modest recall loss, which matters for static hosting.

### 4. Vector search and static-site search

| Option | Model | Scale | Key facts | Cost |
|---|---|---|---|---|
| **pgvector 0.8.7** | Postgres extension | Up to Postgres limits (32 TB per non-partitioned table) | HNSW and IVFFlat. Index dimension limits: vector 2,000, halfvec 4,000, bit 64,000. Binary quantization via expression index plus re-rank. Iterative index scans (since 0.8.0) fix filtered-ANN recall [V][52] | Free; VPS cost |
| **LanceDB** | Embedded, columnar (Lance format), object storage | Claims "billions of vectors in milliseconds" [V][53] | Vector, FTS and SQL; Apache-2.0 [V][53] | Free OSS; cloud tier |
| **sqlite-vec** | SQLite extension, pure C | "Fast enough". **Pre-v1, breaking changes expected** [V][54] | `vec0` tables with float, int8 and binary vectors; metadata and partition columns; runs in WASM; IVF and DiskANN files appear in the repo [V][54] | Free |
| **turbopuffer** | Serverless on object storage | Large | Launch plan $16/mo minimum; Scale $256/mo minimum; Enterprise ≥$4,096/mo [V][55] | Per-GB storage, write and query rates **not captured** [V] |
| **Qdrant Cloud** | Managed or OSS | Large | Free tier: 0.5 vCPU, 1 GB RAM, 4 GB disk [V][56] | Usage-based above that [V] |
| **Pagefind 1.5** | Static, chunked index built from HTML | "Tens of thousands of pages". 10k-page site ≈ under 300 kB total, ~100 kB typical [V][57] | Filters, metadata sort, multisite, multilingual; Component UI [V][57] | Free |
| **Orama** | In-memory JS search engine | Browser memory-bound [I] | Full-text, vector, hybrid; BM25; facets; persistence plugin; Apache-2.0; "<2 kB" claim [V][58] | Free |
| **sql.js-httpvfs** | SQLite over HTTP range requests | Large read-only DBs on static hosting | Needs good indexes; no cache eviction (RAM grows); "mainly written for small personal projects" [V][59] | Free (CDN egress) |
| **DuckDB-Wasm** | Analytical SQL in the browser | **4 GB Wasm memory limit** [V][60] | Reads only needed Parquet byte ranges via JS httpfs; single-threaded by default [V][60] | Free |
| **transformers.js** | ONNX models in browser | Model-size bound | `feature-extraction` pipeline; WASM (q8 default) or WebGPU (fp32 default, experimental); q4 and fp16 options [V][61] | Free |

**Static architecture for a big catalog** [I, medium-high confidence it works; untested at 10M]:

1. **Lexical search:** Pagefind over generated per-work pages, up to ~50k pages. Above that, an SQLite FTS5 database served through sql.js-httpvfs, or a Tantivy-WASM index [P].
2. **Facets and analytics:** Parquet partitioned by topic cluster or decade, queried with DuckDB-Wasm.
3. **Semantic search:**
   - Embed queries in the browser with transformers.js (EmbeddingGemma or a small Qwen/nomic model).
   - Do a coarse IVF lookup against ~1–4k centroid vectors (a few MB, loaded once).
   - Fetch only the 2–8 nearest cluster shards of binary or int8 vectors over HTTP range requests.
   - Rescore with int8 vectors.
   - **Footprint:** 10M works × 256-d binary = 32 bytes per vector = 320 MB total, so each query touches ~1–3 MB.
4. **Writes** (annotations, reading queue) go to localStorage or IndexedDB, or to a tiny server, or sync to Zotero or Readwise.

### 5. LLM enrichment costs (October 2026 prices)

#### 5.1 Price sheet used (USD per million tokens, input / output)

| Model | Standard | Batch | Source |
|---|---|---|---|
| Claude Haiku 5.5 (prompt ≤100k tokens) | $0.10 / $0.50 | $0.05 / $0.25 | [V][44] |
| Claude Haiku 5.5 (prompt >100k tokens) | $0.50 / $2.50 | $0.25 / $1.25 | [V][44] |
| Claude Haiku 4.5 | $1 / $5 | $0.50 / $2.50 | [V][44] |
| Claude Sonnet 5.5 | $2 / $10 (cache hit $0.10) | $1 / $5 | [V][44] |
| Claude Opus 5.5 | $4 / $20 (cache hit $0.20) | $2 / $10 | [V][44] |
| Claude Fable 5.1 | $10 / $50 | $5 / $25 | [V][44] |
| OpenAI gpt-5-nano | $0.05 / $0.40 | $0.025 / $0.20 | [V][45] |
| OpenAI gpt-5.6-luna | $0.20 / $1.20 | $0.10 / $0.60 | [V][45] |
| OpenAI gpt-5-mini | $0.25 / $2.00 | $0.125 / $1.00 | [V][45] |
| OpenAI gpt-5.4-mini | $0.75 / $4.50 | $0.375 / $2.25 | [V][45] |
| OpenAI gpt-5.6-terra | $2 / $12 | $1 / $6 | [V][45] |
| OpenAI gpt-5.6-sol | $4 / $20 | $2 / $10 | [V][45] |
| Gemini 3.5 Flash-Lite | $0.30 / $2.50 | $0.15 / $1.25 | [V][46] |
| Gemini 3.8 Flash (to 2026-12-31) | $0.75 / $3.75 | $0.375 / $1.875 | [V][46] |
| Gemini 3.8 Flash (from 2027-01-01) | $1.50 / $7.50 | $0.75 / $3.75 | [V][46] |
| Gemini 3.1 Pro Preview (≤200k) | $2 / $12 | $1 / $6 | [V][46] |

**Gotchas:**

- **Claude tokenizer.** Anthropic says Claude 4.7-and-later models use a tokenizer that produces **~30% more tokens** for the same text [V][44]. Multiply the Claude rows below by ~1.3 if your token counts come from another tokenizer.
- **Thinking and reasoning tokens.**
  - Gemini prices are "output incl. thinking" [V][46].
  - On current Claude models thinking is adaptive by default. Per Anthropic's API reference (bundled with Claude Code, cached 2026-10-06), Haiku 5.5 accepts `thinking: disabled` only at effort `high` or below. Disable it or use `low` effort for bulk summarization [V, medium].
  - GPT-5-family reasoning tokens are billed as output [P]. Set the minimal reasoning effort.
- **Prompt caching** gives little benefit for very short per-item prompts, because a minimum cacheable prefix applies [P]. **Packing 10–50 items per request** amortizes the instruction prefix instead [I].

#### 5.2 Scenario costs (batch pricing; [I] calculations)

**Assumptions:**

- **A. 100k books from metadata plus TOC:** 1,500 input and 300 output tokens each. Totals 150M in, 30M out.
- **B. 10k books from full text:** 155k input tokens each (a ~115k-word book plus prompts) and 5k output (chapter and book summaries). Totals 1.55B in, 50M out. Scanned 19th-century library volumes average ~246k tokens (Institutional Books: 242B tokens over 983k volumes [V][71]). The sensitivity column uses 255k in and 6k out.
- **C. 1M papers from abstracts:** 500 input and 150 output tokens each. Totals 500M in, 150M out.
- **D. 10M works at abstract or blurb level:** the same per-item figures as C.

| Model (batch) | A: 100k books meta+TOC | B: 10k books full text | B at 250k tok/book | C: 1M abstracts | D: 10M works |
|---|---|---|---|---|---|
| Claude Haiku 5.5, chunked ≤100k | **$15** | **$90** | $142 | **$62.50** | **$625** |
| Claude Haiku 5.5, unchunked >100k | n/a | $450 | $712 | n/a | n/a |
| Claude Sonnet 5.5 | $300 | $1,800 | $2,850 | $1,250 | $12,500 |
| Claude Opus 5.5 | $600 | $3,600 | $5,700 | $2,500 | $25,000 |
| OpenAI gpt-5-nano | $9.75 | $48.75 | $76 | $42.50 | $425 |
| OpenAI gpt-5.6-luna | $33 | $185 | $291 | $140 | $1,400 |
| OpenAI gpt-5-mini | $48.75 | $243.75 | $379 | $212.50 | $2,125 |
| Gemini 3.5 Flash-Lite | $60 | $295 | $458 | $262.50 | $2,625 |
| Gemini 3.8 Flash (2026 intro) | $112.50 | $675 | $1,069 | $468.75 | $4,688 |
| Gemini 3.8 Flash (2027) | $225 | $1,350 | $2,138 | $937.50 | $9,375 |
| Gemini 3.1 Pro (≤200k) | $330 | $1,850 | $2,910 | $1,400 | $14,000 |

**Per full-text book (batch, 155k in / 5k out):**

| Model | Per book |
|---|---|
| Haiku 5.5, chunked | $0.009 |
| gpt-5-nano | $0.005 |
| Gemini 3.5 Flash-Lite | $0.03 |
| Sonnet 5.5 | $0.18 |
| Opus 5.5 | $0.36 |

**Practical reading** [I]:

- Whole-catalog enrichment with a small model costs less than one month of a mid-tier SaaS subscription.
- Quality, not cost, should decide the model. A sensible pattern is a small model for the 100k–10M tier and Sonnet or Opus for a curated 1k–10k "core shelf".
- Check a stratified sample of 200 items by hand or with an LLM judge before scaling up.

#### 5.3 Embedding costs (same corpora)

| Corpus (tokens) | 3-small / voyage-4-lite ($0.02) | voyage-4 ($0.06) | 3-large ($0.13) | Gemini Emb. 2 ($0.20; batch $0.10) |
|---|---|---|---|---|
| 100k books meta+TOC (~100M) | $2 (Voyage: $0 within 200M free) | $6 ($0 within free) | $13 | $20 / $10 |
| 10k books full text (~1.5B) | $30 | $90 (~$60 batch) | $195 | $300 / $150 |
| 1M abstracts (~300M) | $6 | $18 | $39 | $60 / $30 |
| 10M works (~3B) | $60 | $180 | $390 | $600 / $300 |

Prices are [V][45][46][47]; totals are [I]. A self-hosted Qwen3-Embedding-0.6B on one rented GPU would likely process 1.5B tokens in a day or two for tens of dollars [I, low-medium; throughput not benchmarked here].

#### 5.4 Storage sizes [I unless marked]

| Item | Size |
|---|---|
| One 1024-d vector | fp32 4 KB; fp16 2 KB; int8 1 KB; binary 128 B. At 256-d: int8 256 B, binary 32 B |
| 10M works × 1 vector | fp32 1024-d = 41 GB; int8 256-d = 2.6 GB; binary 256-d = 320 MB |
| 10k books × ~300 chunks (3M chunks) | fp32 1024-d = 12.3 GB; int8 = 3.1 GB; binary = 0.4 GB |
| Full text, 10k books × ~150k tokens | ~6 GB plain UTF-8, ~2 GB compressed |
| SPECTER2 for 120M papers | 30 × 28 GB ≈ 840 GB [V][27] |
| Raw lake for the 10M tier | ~1.2–2.4 TB: ≈1.24 TB for the core files listed here, ≈1.5 TB with citations, ≈2.3 TB with citations and SPECTER2 [corrected in verification]. OpenAlex 0.75 TB, Crossref 0.21 TB, Wikidata 0.16 TB, Semantic Scholar core (papers, abstracts, TLDRs) ~0.1 TB, Open Library 0.02 TB, Hathifile 0.001 TB. Citations add 0.26 TB and SPECTER2 0.84 TB if wanted [V sizes][4][6][12][27][9][15] |
| arXiv full PDFs and sources | 9.2 TB (Apr 2025) [V][24] |
| OpenAlex OA PDFs | ~250 TB. Not a personal-scale download [V][5] |

### 6. Existing open projects to reuse or learn from

| Project | What it is / why it matters | License / price | 2026 status |
|---|---|---|---|
| **Open Library Explorer** | "Browse the virtual shelves" by classification (DDC/LCC). The model for shelf-adjacency browsing [V tagline][75]; feature details [P] | Free | Live |
| **Open Syllabus** | 32.9M syllabi; Co-Assignment Galaxy; Analytics [V][62] | Most tools free [V]; data licensing via accounts [V] | Live. Best "what is taught together" signal [I] |
| **Semantic Scholar** | API plus weekly dataset releases (TLDRs, SPECTER2, citations with intent and influence) [V][27] | Free key; per-dataset licenses | Release 2026-10-06 |
| **OpenAlex** | Open scholarly graph; topics; OA locations; now usage-priced API and full-text archive [V][2][5] | CC0 data; API pay-as-you-go | Active |
| **BASE (Bielefeld)** | Large OA aggregator (OAI-based) | — | Site blocked by bot protection; counts not verified |
| **Calibre + Calibre-Web** | Local library DB; Calibre-Web adds OPDS, Kobo sync, metadata fetch, in-browser reader [V][63] | GPL-3.0; 18.4k stars [V] | Active-ish (no release date shown) |
| **BookLore** | Self-hosted multi-user library: metadata from Google Books, Open Library and Amazon; Kobo, OPDS and KOReader sync; reader with annotations [V][64] | AGPL-3.0 | **Entering maintenance mode; successor "BookOrbit"** [V][64] |
| **Kavita** | Reading server (EPUB, PDF, comics); OPDS topics; Kavita+ paid add-on [V][65] | GPL-3.0; 11.9k stars | Active, "beta until 1.0" [V] |
| **Komga** | Media server; OPDS v1/v2; Kobo and KOReader sync [V][66] | MIT; 6.7k stars | Active |
| **Audiobookshelf** | Audiobooks and **podcasts** (search, subscribe, auto-download, RSS); basic ebook reader [V][67] | GPL-3.0; 14.6k stars | Active |
| **Paperless-ngx** | Document management with OCR [V][68] | GPL-3.0; 46.7k stars | Active |
| **Zotero** | Reference manager; sync storage 300 MB free, 2 GB $20/yr, 6 GB $60/yr, unlimited $120/yr [V][69] | AGPL [P] | Active. Natural "my library" layer; has a web API [P] |
| **Readwise / Reader** | Highlights plus read-later; Lite $5.59/mo, Full $9.99/mo annual ($12.99 monthly) [V][70] | Commercial | Active; API exists (not detailed) [V] |
| **Kiwix** | Offline ZIMs (Wikipedia 127 GB maxi; Gutenberg 221 GB; LibreTexts per subject) [V][23] | Free | Active |
| **LoC Labs / LoC APIs** | JSON API, Text Services with word coordinates, IIIF [V][14] | Free | labs.loc.gov fetch failed (stream aborted) |
| **LibraryThing** | thingISBN work-clustering, Common Knowledge | — | **Not verified** (403) |
| **HF datasets** | **Institutional Books** (983,004 PD volumes, 242B tokens, 386M pages, 254 languages, OCR-quality scores, likely-duplicate flags; gated, noncommercial, no redistribution) [V][71]. **Common Corpus** (2.27T tokens; OpenCulture 967B; "uncopyrighted or freely licensed") [V][72]. **US-PD-Books** (653,983 IA books, **texts removed at IA's request**) [V][73] | Varies | See §5 traps |

---

## Reference architecture

```
┌───────────────────────────── 1. SOURCE ADAPTERS (bulk-first) ─────────────────────────────┐
│ OpenAlex snapshot (S3, quarterly)   Crossref data file (annual) + REST deltas (polite)     │
│ Semantic Scholar datasets (weekly)  arXiv OAI/Kaggle meta (+ S3 sources, opt.)             │
│ Open Library dumps (monthly)        Wikidata JSON (weekly)   LoC MDSConnect (2016, frozen) │
│ Hathifiles (monthly + daily)        HTRC EF 2.0 (2020)       Gutenberg RDF/CSV (daily/wk)  │
│ DOAB/OAPEN OAI-PMH                  OpenStax CMS API         LibreTexts/Wikibooks ZIMs     │
│ IA scrape API (texts)               MIT OCW pages            YouTube (own-channel lists)   │
│ Podcast RSS / Podcast Index         Open Syllabus (if licensed)                            │
│  each adapter: fetch → raw/ (immutable, dated) → normalize() → edition-level records       │
└───────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                ▼
┌────────────── 2. RAW LAKE + NORMALIZED LAYER (Parquet on local NVMe or R2/S3; DuckDB) ────┐
│ manifestation/edition records with: source, source_id, ids{}, title, creators, date,      │
│ language, subjects{}, rights{}, access_urls[], raw_ref, fetched_at, license_of_metadata    │
└───────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                ▼
┌──────────────── 3. ENTITY RESOLUTION → UNIFIED WORK RECORD (FRBR-ish) ────────────────────┐
│ ID crosswalk graph (DOI, ISBN-10/13, OCLC, LCCN, OL work/edition, QID, HT id, IA ocaid,     │
│ OpenAlex W-id, S2 corpusId, arXiv id, Gutenberg #, DOAB/OAPEN handle)                       │
│ → connected components (hard links) → blocking (normalized title+author surname+lang) →    │
│ pairwise scorer (string sims + date window + embedding cosine + LLM tie-break) →            │
│ clusters = works; editions/translations/volumes as members; confidence + provenance        │
└───────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                ▼
┌─────────── 4. ACCESS & RIGHTS RESOLVER ───────────┐   ┌──── 5. CONTENT ACQUISITION ───────┐
│ per work: best legal free copy (PD/CC/OA/borrow), │──▶│ only open/PD/licensed items:      │
│ rights basis (HT rights code, CC URL, PD-by-date  │   │ EPUB/HTML direct; born-digital    │
│ rule, OA license), jurisdiction caveats, checked_at│   │ PDF → Marker/Docling/MinerU;      │
└───────────────────────────────────────────────────┘   │ scans → existing OCR or olmOCR/   │
                                                        │ PaddleOCR-VL; papers → GROBID TEI │
                                                        │ → TOC + structured chunks + pages │
                                                        └────────────────┬──────────────────┘
                                                                         ▼
┌──────────────────────────────── 6. ENRICHMENT (batch, versioned) ─────────────────────────┐
│ LLM: blurb, chapter summaries, level, prerequisites, key questions, "why read", genre,    │
│      quality/confidence flags (prompt_version, model, cost logged per item)               │
│ Embeddings: work-level (meta+TOC+summary), chapter-level, chunk-level (open texts only)   │
│ Topic placement: UMAP/PCA → HDBSCAN/k-means hierarchy → LLM cluster labels → map coords    │
│ Signals: citations (OpenAlex/S2), syllabus co-assignment, Wikipedia links, OA status       │
└───────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                ▼
┌───────────────────────────────────── 7. INDEXES ──────────────────────────────────────────┐
│ FTS (SQLite FTS5 / Tantivy / Pagefind) · ANN (LanceDB | pgvector | sqlite-vec | turbopuffer)│
│ facets/analytics (Parquet+DuckDB) · graphs (citation, co-assignment, prerequisite)        │
│ static shards: IVF centroids + binary/int8 vector shards + per-cluster Parquet             │
└───────────────────────────────────────────────┬────────────────────────────────────────────┘
                                                ▼
┌─────────────────────────────────────── 8. UIs ────────────────────────────────────────────┐
│ static site (Astro/Starlight) · map/galaxy view · shelf browser (LCC/topic adjacency) ·    │
│ reading queue + reader (EPUB.js/PDF.js) · MCP server so Claude can query the catalog ·     │
│ OPDS feed → KOReader/Kobo · Zotero/Readwise sync · VR "stacks" (WebXR)                     │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Unified work record (sketch) [I]

```jsonc
{
  "work_id": "osw_01J...",                 // own stable ULID; never reuse a source ID as primary key
  "kind": "book|textbook|paper|chapter|lecture|course|episode|video",
  "title": "...", "subtitle": "...", "orig_language": "en",
  "first_pub_year": 1934, "first_pub_year_basis": "wikidata|marc008|min(edition dates)",
  "creators": [{"name": "...", "role": "author", "ids": {"wikidata": "Q..", "viaf": "...", "ol": "OL..A", "orcid": null}}],
  "ids": {"doi": [], "isbn13": [], "oclc": [], "lccn": [], "ol_work": "OL..W", "ol_editions": [],
          "wikidata": "Q..", "openalex": "W..", "s2": 123, "arxiv": null, "hathitrust": ["mdp.39015..."],
          "ia": ["ocaid"], "gutenberg": 1342, "doab": null, "oapen": null, "openstax": null},
  "cluster": {"members": [{"source": "ol", "id": "OL..M", "relation": "edition|translation|volume|reprint"}],
              "method": "hardlink+scorer-v3", "confidence": 0.93},
  "subjects": {"lcc": "QA273", "ddc": "519.2", "lcsh": [], "openalex_topics": [], "arxiv": [], "llm_tags": []},
  "access": [{"source": "hathitrust", "url": "...", "format": "pdf|epub|html|txt|audio|video",
              "rights": "pd|pdus|cc-by-4.0|oa|borrow|restricted", "license_url": null,
              "jurisdiction_note": "pdus = public domain in US only", "checked_at": "2026-10-15"}],
  "content": {"toc": [{"level": 1, "title": "...", "page": 12}], "abstract": "...", "fulltext_ref": "s3://...",
              "pages": 412, "tokens_est": 162000, "ocr_quality": 0.91},
  "enrichment": {"blurb": "...", "chapter_summaries_ref": "...", "level": "intro|intermediate|advanced",
                 "prerequisites": [], "model": "claude-haiku-5-5", "prompt_version": "v7",
                 "generated_at": "2026-10-15", "self_confidence": 0.7, "grounding": "toc+meta|fulltext"},
  "vectors": {"work": {"model": "voyage-4-lite", "dims": 512, "ref": "..."}, "chapters_ref": "...", "chunks_ref": "..."},
  "signals": {"cited_by": 1234, "syllabus_count": null, "wikipedia_sitelinks": 12},
  "provenance": {"title": "ol@2026-09-30", "first_pub_year": "wikidata@2026-10-13"}
}
```

**Design rules** [I]:

1. Make every adapter **idempotent and snapshot-dated**, and keep raw files immutable.
2. Track provenance per field.
3. Give LLM-generated fields a model, prompt version, grounding level and date, so they can be regenerated cheaply when prices drop.
4. Keep rights determination separate from metadata and make it re-runnable. Rights change, for example every 1 January under US PD-by-date rules.

---

## Cost table at three scales [I, built from the [V] prices above]

| Line item | **1k works** (curated core shelf, all full text) | **100k works** (metadata+TOC for all; full text for a 10k open subset) | **10M works** (metadata and abstract level; precomputed vectors where possible) |
|---|---|---|---|
| Data acquisition | ~$0 (Gutenberg, OpenStax, DOAB, HathiTrust PD, arXiv API) | ~$0 (dumps and OAI). Optional: OpenAlex API under the $1/day free budget | ~$0 for snapshots. Disk for 1.2–2.4 TB (≈$100–300 of NVMe or HDD [I, unverified prices]) [corrected in verification]. arXiv full text requester-pays (or skip) |
| Parsing / OCR (assume 300 pp/book) | 300k pages: $0 for EPUB/HTML; ≈$60 if all scanned (olmOCR's <$200/M pages); LlamaParse basic ≈$375 | 10k-book subset = 3M pages: ≈$0–600 self-hosted; ≈$3,750 LlamaParse basic | Not parsed. Use OpenAlex TEI / s2orc for papers where licensed |
| LLM enrichment (batch) | Full text: Haiku 5.5 ≈$9 (×1.3 tokenizer ≈$12); Sonnet 5.5 ≈$180–235; Opus 5.5 ≈$360–470 | Meta+TOC: Haiku $15–20; gpt-5-nano $10; Sonnet $300. Plus 10k full text: Haiku $90–120; Sonnet $1,800 | Haiku 5.5 ≈$625–815; gpt-5-nano ≈$425; Flash-Lite ≈$2,625; Sonnet ≈$12,500. Papers: reuse 58M S2 TLDRs (free) where licensing permits |
| Embeddings | ~150M tokens: $0–3 | Meta: $0–13. Full-text subset (1.5B): $30–195 | 3B tokens: $60 (3-small / voyage-4-lite) to $600 (Gemini std). Or $0 using SPECTER2 for papers |
| Vector + text storage | ~1–10 GB | ~20–200 GB | Index 0.3–41 GB depending on dims and quantization; lake 1.2–2.4 TB [corrected in verification] |
| Hosting / month | $0 (static: GitHub Pages / Cloudflare Pages) | $0–20 (static plus range-request DBs) or $16+ turbopuffer | $0–50 static shards on R2/S3, or $16–256 turbopuffer minimums, or a $40–150 VPS with pgvector [I] |
| **One-time total (typical)** | **≈$15–300** | **≈$150–2,800** | **≈$600–15,000** (dominated by the model choice for 10M items) |
| Main cost risk | Over-using frontier models | Unchunked >100k-token prompts (5× on Haiku 5.5); reasoning tokens | Model choice; 2027 Gemini price doubling; re-runs after prompt changes |

---

## Effort estimate: build tiers with Claude Code [I]

These assume one technically strong developer driving Claude Code. Hours are wall-clock focused work, not calendar time.

| Tier | Scope | Hours (est.) | Deliverable | Main risks |
|---|---|---|---|---|
| **Weekend (~12–20 h)** | 2–3 clean sources (Gutenberg CSV/RDF, OpenStax API, DOAB OAI or the Open Library works dump filtered to `ebook_access:public`); DuckDB ETL to one Parquet/SQLite; Haiku 5.5 batch blurbs for ≤10k works (~$1–5); voyage-4-lite or local embeddings; Astro static site with Pagefind and a client-side semantic search over a ≤50 MB vector file; UMAP topic map | 12–20 | Browsable, searchable "free shelf" of ~10k works, with summaries and a map | Batch API learning curve; Pagefind index size; messy subjects |
| **Month (~80–120 h)** | 8–10 adapters (add OpenAlex, Wikidata, Hathifiles, OAPEN, arXiv, Semantic Scholar, IA); ID crosswalk and FRBR clustering v1 with a 300–500-pair labeled eval set; access/rights resolver; full-text pipeline for ~1–10k open books (EPUB direct, Marker/MinerU for PDFs, existing OCR for scans); chapter-level summaries; hybrid search (FTS5 + LanceDB/pgvector); reading queue; OPDS feed; MCP server | 80–120 | 100k-work catalog with a "best free copy" link, chapter-level search and a topic galaxy | Clustering precision/recall; OCR noise; rate limits (OL 1–3 rps; Crossref polite pool); license tagging |
| **Quarter (~300–450 h)** | 10M works; incremental pipelines (OpenAlex quarterly diffs plus `deleted_ids`, OL monthly, Hathifile dailies, S2 weekly); scalable ER (blocking + learned scorer + LLM adjudication on ambiguous pairs); a rights engine with jurisdiction rules; static sharded semantic index (IVF + binary vectors); multiple UIs (map, shelf, syllabus builder, prerequisite graph, VR stacks); quality dashboards; cost ledger; tests | 300–450 | Personal "catalog of everything" with monthly refresh and measured quality | Scale bugs; drift between sources; keeping LLM fields fresh; storage and egress; maintenance burden |

### Main failure modes and mitigations

1. **Edition dedup and FRBR work clustering** [I, high confidence it is the #1 problem].
   - **Symptoms:**
     - The same book appears 5–40 times: HathiTrust volumes, OL editions, reprints, translations, multi-volume sets.
     - Chapter DOIs swamp book DOIs.
     - Anthologies are merged with their contents.
     - Different works with the same title get merged (e.g., many books titled "Introduction to Probability").
   - **Mitigations:**
     - Hard-link via shared IDs first, then block on normalized title, author surname and language.
     - Score with string similarity, publication-year window, subject overlap and embedding cosine.
     - Send uncertain pairs to an LLM with both records, at ~$0.0002 per pair with Haiku 5.5 [I].
     - Keep a labeled pair set and track precision and recall.
     - Never collapse translations without a flag.
     - Institutional Books ships "likely duplicates" fields that can seed training data [V][71].
2. **Messy metadata** [I/P].
   - **Symptoms:**
     - Dates are reprint dates rather than first publication.
     - Author names vary in form.
     - OCR'd titles in IA and HathiTrust are noisy.
     - Subjects are inconsistent (LCSH strings vs. OpenAlex topics vs. arXiv categories).
     - Languages are mis-tagged.
   - **Mitigations:**
     - Take `first_pub_year` from Wikidata or MARC, else the minimum edition date.
     - Normalize authors via Wikidata/VIAF crosswalks.
     - Store the source of every field.
3. **Rate limits and terms** [V].
   - Open Library: 1–3 rps, and bulk via the API is forbidden, so use dumps [10].
   - Crossref: public pool 5/1, polite pool 10/3 [8].
   - OpenAlex: $1/day free, and cursor paging needs a key [1][2].
   - Semantic Scholar: 1 RPS [28].
   - YouTube: 10k units plus 100 searches a day [31].
   - **Mitigation:** design every adapter around bulk dumps plus small delta calls, with caching and exponential backoff.
4. **License traps** [V/P].
   - OpenStax NC-SA [21]; MIT OCW NC-SA [30]; arXiv's default license and its link-back requirement [24].
   - HathiTrust `pdus` is public domain **in the US only** [I].
   - Institutional Books is noncommercial with no redistribution [71].
   - IA metadata is unreliable for PD status [73].
   - Semantic Scholar abstracts are ODC-BY, and the manifest says they are included only "where available" [27] [corrected in verification].
   - Model weights: Marker restricts use above $5M [35]; Nougat is CC-BY-NC [41]; EmbeddingGemma uses the Gemma terms [50].
   - YouTube transcript scraping breaks its ToS [P].
   - **Shadow libraries:** *Bartz v. Anthropic* reached a settlement, and the court granted final approval on **2026-07-20** [V][74]. The suit was over books from pirated libraries; the court-ordered long-form class notice gives a $1.5B settlement fund and approximately $3,000 per work before fees and costs [V, notice linked from the settlement site] [corrected in verification]. Don't ingest LibGen, Anna's Archive or Z-Library data, even "just metadata", without legal review. **R09** covers this in depth.
5. **Cost blowups** [V/I].
   - Haiku 5.5 charges 5× for prompts over 100k tokens [44].
   - Claude 4.7+ tokens run ~30% higher [44].
   - Thinking and reasoning tokens are billed as output.
   - Gemini 3.8 Flash doubles on 2027-01-01 [46].
   - Re-running everything after a prompt tweak costs the full amount again.
   - **Mitigations:** keep a per-item cost ledger, run small pilot batches, version prompts and only regenerate deltas.
6. **Parsing failures** [V/I].
   - GROBID has no OCR [5][40]; Nougat produces `[MISSING_PAGE]` [41].
   - Tables, math and footnotes break chunkers.
   - Two-column scans scramble reading order.
   - **Mitigations:** route by document type (born-digital vs. scanned vs. scholarly), keep page anchors, and measure output with a handful of gold pages per source.
7. **Static-hosting limits** [V].
   - DuckDB-Wasm is capped at 4 GB [60].
   - sql.js-httpvfs never evicts its cache [59].
   - Pagefind is claimed for "tens of thousands" of pages [57].
   - **Mitigation:** shard by topic and decade, and keep the hot set small.
8. **Source drift and churn** [V/I].
   - OpenAlex retired n-grams and moved its legacy layout [4].
   - BookLore went into maintenance [64].
   - Mistral retired OCR model versions [43].
   - HTRC services showed outage banners [S].
   - **Mitigation:** pin snapshot dates and write adapter contract tests.

---

## Numbers that matter

| Fact | Value | Date | Source | Conf. |
|---|---|---|---|---|
| OpenAlex snapshot size | ~745 GB JSONL gz / ~770 GB Parquet; ~626M records | Sept 2026 release | [4] | High |
| OpenAlex free API budget | $0.10/day without a key; $1/day with a free key | 2026 | [2][3] | High |
| OpenAlex per-call prices | list $0.10/1k; search $1/1k; semantic $1/1k; PDF $10/1k; singleton free | 2026 | [3] | High |
| OpenAlex annual plans | $5k (Member), $10k (Member+, daily snapshot), from $20k (Partner) | 2026-08-11 | [2] | High |
| OpenAlex full-text archive | 50M+ PDFs ~250 TB; ~43M TEI ~20 TB | 2026 | [5] | High |
| OpenAlex API vs full corpus | ~327M works default vs ~476M with `corpus=all` | 2026 | [4] | Medium-high |
| Crossref public data file | 208 GB, ~180M records | 2026 | [6] | High |
| Crossref API pools | public 5/conc 1; polite 10/conc 3; Plus 150 | 2025-10-16 | [8] | High |
| Semantic Scholar release | 200M papers; 100M abstracts; 58M TLDRs; 120M SPECTER2; 16M s2orc_v2; 2.4B citations | 2026-10-06 | [27] | High |
| arXiv submissions | 3,213,484 | 2026-10-15 | [25] | High |
| arXiv S3 bulk | ~9.2 TB, +~100 GB/month | Apr 2025 | [24] | High (aging) |
| Open Library dumps | editions 12.62 GB; works 4.07 GB; authors 0.78 GB; all 18.18 GB | 2026-09-30 | [9] | High |
| Open Library public / borrowable works | 1,861,679 / 2,907,228 | 2026-10-15 | [11] | High |
| Open Library API limits | 1 rps; 3 rps identified | 2026-10 | [10] | High |
| Wikidata JSON dump | 156.5 GB gz; 103.4 GB bz2 | 2026-10-13 | [12] | High |
| HathiTrust items | 19,701,406 total; 8,293,334 full view; pd 5.87M; pdus 2.30M; ic 10.37M | 2026-10-01 | [15] | High |
| HTRC EF 2.0 | 17.12M volumes, ~4 TB, CC BY 4.0 | Feb 2020 snapshot | [17] | High (stale) |
| LoC MDSConnect | ~25M MARC records, free, frozen at 2016 | — | [13] | High |
| Project Gutenberg | 78,325 texts (61,817 English) | 2026-10-15 | [34] | High |
| DOAB / OAPEN OAI records | 128,285 / 59,193 | 2026-10-15 | [19][20] | Medium (record ≠ book) |
| Internet Archive texts | 52.72M items; 46.76M not access-restricted; 4.42M lending | 2026-10-15 | [29] | High |
| OpenStax licenses (live) | 70 NC-SA, 4 CC BY, 10 unstated | 2026-10-15 | [21] | High |
| MIT OCW | 2,500+ courses; CC BY-NC-SA 4.0 | 2026 | [30] | High |
| Kiwix English Wikipedia | maxi 127.4 GB; nopic 52.7 GB; mini 14.4 GB | 2026-08/09 | [23] | High |
| YouTube Data API default | 10,000 units/day plus 100 search.list/day; captions.download 200 units, edit permission required | 2026-09 | [31][32] | High |
| Claude Haiku 5.5 | $0.10/$0.50 (≤100k); $0.50/$2.50 (>100k); batch 50% off | 2026-10 | [44] | High |
| Claude Sonnet 5.5 / Opus 5.5 | $2/$10 and $4/$20; batch $1/$5 and $2/$10 | 2026-10 | [44] | High |
| Claude tokenizer inflation | ~30% more tokens (4.7+ models) | 2026-10 | [44] | High |
| gpt-5-nano / gpt-5.6-luna (batch) | $0.025/$0.20 and $0.10/$0.60 | 2026-10 | [45] | High |
| Gemini 3.5 Flash-Lite (batch) | $0.15/$1.25 | 2026-10 | [46] | High |
| Gemini 3.8 Flash | $0.75/$3.75 through 2026-12-31, then $1.50/$7.50 | 2026-10 | [46] | High |
| Embeddings | 3-small $0.02; 3-large $0.13; voyage-4-lite $0.02; voyage-4 $0.06 (200M free); Gemini Emb 2 $0.20 ($0.10 batch) | 2026-10 | [45][46][47] | High |
| OmniDocBench v1.6 top | TeleOCR 96.91; OvisOCR2 96.47; PaddleOCR-VL-1.6 96.34; MinerU2.5-Pro 95.75; Marker 78.44 [corrected in verification] | 2026-09-11 update | [36] | High |
| olmOCR cost claim | under $200 per 1M pages | v0.4.0 (2025-10) | [37] | Medium (self-reported) |
| LlamaParse | $1.25 per 1,000 credits; ≥1 credit/page; 10k free credits/month | 2026 | [42] | Medium-high |
| Transcription | gpt-transcribe $0.0045/min; Whisper $0.006/min | 2026-10 | [45] | High |
| Institutional Books | 983,004 vols; 242B tokens; 386M pages | June 2025 paper | [71] | High |
| pgvector | v0.8.7; HNSW 2,000 dims (vector) / 4,000 (halfvec) | 2026 | [52] | High |
| turbopuffer minimums | $16 / $256 / ≥$4,096 per month | 2026 | [55] | High |
| Zotero storage | 2 GB $20/yr; 6 GB $60/yr; unlimited $120/yr | 2026 | [69] | High |

---

## Surprises and recent changes (2024–2026)

1. **OpenAlex moved to usage-based pricing** with mandatory keys for real use. It now charges per list, search and PDF call. The free snapshot stays but is quarterly, and the daily snapshot is a $10k/yr feature [V][1][2][3][4]. In 2024 the API was free with a polite-pool email [P].
2. **OpenAlex became a full-text host**, with 50M+ OA PDFs (~250 TB) and ~43M GROBID TEI files. Downloads are priced at $10 per 1,000 [V][3][5].
3. **The OpenAlex snapshot changed layout and format.** It now ships Parquet, moved the pre-2026 layout to `legacy-data/`, retired n-grams, and added a works deletion log from 2026-09-23 [V][4].
4. **Claude Haiku 5.5 costs $0.10/$0.50**, a tenth of Haiku 4.5's $1/$5. It has a 5× price cliff above 100k-token prompts [V][44]. Sonnet 5's introductory $2/$10 became permanent; the increase to $3/$15 scheduled for 2026-09-01 was cancelled [V][44].
5. **Specialized ~1B-parameter document VLMs now beat frontier general VLMs** on OmniDocBench. PaddleOCR-VL-1.6 at 0.9B scores 96.34 against Gemini 3 Pro's 92.91 [V][36]. The cheapest high-quality OCR is now self-hostable.
6. **Marker's code license is now Apache-2.0** (weights are still restricted) [V][35]. I recall it as GPL-3.0 in 2024 [P, medium]. **MinerU** now ships a custom license, "Apache 2.0 plus conditions", along with EPUB, Office and HTML parsing and CPU-only tiers in v4.0 [V][38]. I recall it as AGPL earlier [P, medium].
7. **Internet Archive asked for the US-PD-Books texts (653,983 books) to be deleted** because "its metadata [is] too unreliable for determining public domain status" [V][73]. Public-domain inference from IA flags is not safe on its own.
8. **OpenStax has drifted toward NC-SA.** Of the live books, 70 are NC-SA and 4 are CC BY, while 33 CC BY editions are retired [V][21]. Many people still believe "OpenStax = CC BY".
9. **YouTube changed its quota model.** A search costs 1 unit, but `search.list` is capped separately at 100 calls a day [V][31]. Older guides say "100 units per search".
10. **BookLore entered maintenance mode**, with a successor called BookOrbit [V][64]. Self-hosted reading apps churn.
11. **Semantic Scholar now ships 58M TLDRs and 120M SPECTER2 embeddings in weekly releases** [V][27]. This is free enrichment that many builders overlook.
12. **The Wikidata JSON dump grew from 127 GB (June 2024) to 156.5 GB (Oct 2026)** [S][V][12].
13. **Gemini 3.8 Flash has an end date on its introductory price** (2026-12-31), after which it doubles [V][46].
14. **The *Bartz v. Anthropic* settlement got final approval** on 2026-07-20, with first payments expected by 2026-11-15 [V][74]. Provenance of book corpora is now a concrete legal and cost issue.
15. **Mistral retired three OCR generations in 12 months**: the original, OCR 2 and OCR 4.0 [V][43].

---

## Contested or uncertain points

- **OpenAlex record counts.** The snapshot page says ~626M records per format (Sept 2026) [V][4]. A search summary of an earlier version said ~649M (June 2026) [S]. The API corpus is 327M by default vs ~476M including XPAC [V][4]. The counts depend on entity types and on the XPAC inclusion policy. Use the `manifest.json` in each release.
- **Snapshot cadence.** The help center says quarterly [V][4]. Some older or secondary pages said monthly [S]. Trust quarterly.
- **Parser rankings depend on the benchmark and who ran it.**
  - Marker ranks low on OmniDocBench (78.44) [V][36] but near the top in its own olmOCR-bench table (76.0) [V][35].
  - Docling scores 50.3 in Marker's table [V][35], which is a vendor comparison.
  - AllenAI's table shows olmOCR at 82.4 vs Marker 76.1 [V][37].
  - Build your own 50-page gold set per source type [I].
- **MTEB leadership.** The Qwen3-Embedding-8B claim of #1 at 70.58 is dated 2025-06-05 [V][49]. I could not re-check the live leaderboard. Assume newer models lead and treat API vs open-model gaps as small at personal scale [I, ~70%].
- **Book token lengths.** Modern nonfiction runs ~100–150k tokens. Scanned library volumes average ~246k (Institutional Books) [V][71]. Cost estimates swing ~1.6× on this assumption.
- **Static search at 100k+ pages.** Pagefind only claims "tens of thousands" [V][57]. Beyond that I rely on range-request SQLite or DuckDB designs [I, medium]. They have no published benchmarks at 10M works.
- **Turbopuffer per-GB pricing, Cohere per-token Embed pricing, Mistral OCR per-page pricing and LlamaParse per-mode credits** were not visible on the fetched pages and remain unverified.
- **DOAB's 128,285 OAI records** may include chapter-level records. The book count is likely lower [I, medium].
- **HathiTrust "allow" (8.29M)** reflects US access. Non-US users see fewer full-view volumes, because `pdus` items are not open outside the US [I, high].
- **Podcast Index scale and dump availability** could not be verified (site unreachable). The Listen Notes figures come from a directory listing [S, low].
- **The legality of YouTube transcript scraping** is not a settled "yes". It breaches the ToS [P], even where fair use might cover analysis. R09 covers this.

---

## Implications for someone building tools to explore literature

1. **Go bulk-first and API-second.** Download snapshots and dumps, and use APIs only for deltas, lookups and user-triggered actions. At personal scale this keeps you inside the free tiers: OpenAlex at $1/day, OL at 3 rps, Crossref's polite pool.
2. **The work record and the crosswalk are the product.** Search and LLM features are commodities in 2026. Clean clustering and a "best legal free copy" resolver are what no existing tool does well across books, papers and lectures together [I].
3. **Spend LLM money on the curated core, not the long tail.** Run a small model (Haiku 5.5, gpt-5-nano, Flash-Lite) over 100k–10M items for blurbs and tags. Use Sonnet 5.5 or Opus 5.5 for a 1k–10k core where you want chapter-level guidance, prerequisites and critiques. The whole thing costs hundreds of dollars, not tens of thousands.
4. **Reuse before you generate.** Use S2 TLDRs and SPECTER2, OpenAlex topics and TEI, the HTRC EF word counts, Institutional Books OCR-quality and duplicate fields, and Open Syllabus co-assignment, all subject to their licenses.
5. **Keep rights as data.** Record a rights basis per access URL with a `checked_at` date. Refresh on 1 January (US public-domain day) and whenever HathiTrust rights codes change, which the daily Hathifiles report [S][16].
6. **Static by default.** For a personal or team explorer, a static site plus range-request databases plus in-browser query embeddings gives zero hosting cost, privacy, and easy sharing via the wiki. Add a server (pgvector or LanceDB) only for heavy semantic search over chunk-level full text.
7. **Expose the catalog to Claude via MCP.** The cheapest "reading assistant" is Claude querying your own clean index (`search_works`, `get_toc`, `find_free_copy`, `similar_chapters`) rather than browsing the web [I].
8. **Measure quality early.** Build gold sets for dedup pairs, OCR pages and summary faithfulness before scaling, because costs are low enough that the bottleneck is correctness.

---

## Ideas sparked

1. **"Best free copy" resolver.** Given any citation, ISBN, DOI or title, return the best legal free copy:
   - HathiTrust full view (with a US-only flag for `pdus`).
   - IA public or borrowable.
   - Gutenberg, DOAB/OAPEN, arXiv, the OpenAlex OA location, OpenStax or LibreTexts.

   Each result carries format, OCR quality and rights basis. Ship it as a browser extension, a CLI, and an MCP tool.
2. **Chapter Atlas.** Embed every chapter title plus a short summary from the TOCs of 100k textbooks to make a map of human knowledge at chapter granularity. The query "best intro chapter on Bayesian model comparison" returns the five best chapters across all free books, each with a page link.
3. **Prerequisite graph from TOCs.** Have an LLM extract "assumes X / teaches Y" for each chapter and stitch the results into a cross-book prerequisite DAG. "Reading paths" become shortest paths from what you know to what you want.
4. **Pagefind for vectors.** An open-source static semantic index: IVF centroids plus binary 256-d shards plus int8 rescoring, with transformers.js query embedding. It should handle 10M items at about 1–3 MB per query on free static hosting. It could be a reusable npm package, and it fits the CAIRN/Starlight stack.
5. **Edition collapser UI.** One card per work, expandable to editions, translations and volumes, with a "why we think these are the same" explanation (shared IDs, similarity scores, LLM verdict). Users can split or merge, and their corrections become training data.
6. **Canon-vs-free diff.** Cross Open Syllabus top-assigned titles (if licensing allows) with free-copy availability: "Of the 1,000 most-taught statistics texts, these 140 are legally free today, and these 60 become US public domain in the next five years."
7. **Public Domain Day watcher.** Each 1 January, compute which works entered the US public domain (95-year rule for published works [P]) and are in HathiTrust or IA. Auto-generate a "new on the free shelf" page.
8. **Calibrated enrichment.** Every LLM field carries a self-reported confidence plus an evidence pointer (TOC line or page). Give the reader a slider: "only show summaries grounded in full text". This fits a forecasting audience's taste for calibration.
9. **Lecture ↔ chapter linker.** Align MIT OCW lecture notes and transcripts (from the owner's pages) with textbook chapters through embeddings. "Watch this 20-minute segment, then read pages 112–130."
10. **Cost-ledger CLI for Claude Code.** `stacks plan --corpus 100k --model haiku-5.5 --batch` prints the projected tokens and dollars, including the 100k-token tier cliff and tokenizer inflation, before any batch is submitted.
11. **Walk the stacks (WebXR).** Lay out shelves in 3D by topic-map coordinates (or LCC as a familiar fallback). Spine color shows free vs. borrow vs. paid, and spine height shows citation or syllabus signal. Pulling a book opens its TOC Atlas entry. It could run from Kiwix ZIMs offline.
12. **Citation-context reader for papers.** Use S2 citation intents plus OpenAlex TEI to show, in the margin, how later papers characterized each claim: supported, contrasted or extended.
13. **Duplicate-aware reading log.** Sync from KOReader or Kobo (via Calibre-Web, Komga or BookLore-style OPDS) into the work-level record, so reading one edition marks the whole work as read and suggests the "next chapter elsewhere".
14. **Rights-change alerts.** Subscribe to the HathiTrust daily `hathi_upd` files and notify when a watched work flips to full view.

---

## Sources

1. OpenAlex Help: API authentication (keys, rate limits) — https://help.openalex.org/api-reference/authentication — updated 2026-10-14
2. OpenAlex Help: Pricing (free $1/day, plans) — https://help.openalex.org/access/pricing — updated 2026-08-11
3. OpenAlex Help: Example costs (per-call prices) — https://help.openalex.org/access/example-costs/ — accessed 2026-10-15
4. OpenAlex Help: Snapshot (S3, sizes, cadence, layout changes) — https://help.openalex.org/access/snapshot/ — updated 2026-09-24
5. OpenAlex Help: Fulltext (PDF and TEI archive) — https://help.openalex.org/access/fulltext/ — accessed 2026-10-15
6. Crossref: Public Data File (2026 file 208 GB, ~180M records) — https://crossref.org/services/metadata-retrieval/public-data-file/ — accessed 2026-10-15
7. Crossref blog: 2025 public data file now available (search result) — https://www.crossref.org/blog/2025-public-data-file-now-available — 2025-03-12
8. Crossref: REST API access and authentication (pools) — https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/ — updated 2025-10-16
9. Open Library: Data dumps page — https://openlibrary.org/developers/dumps — edited 2025-06-10. Live dump file sizes via HEAD at https://archive.org/download/ol_dump_2026-09-30/ — measured 2026-10-15
10. Open Library: Developer API docs (rate limits, bulk policy) — https://openlibrary.org/developers/api — edited 2026-10-09
11. Open Library search API counts (`ebook_access:public` / `borrowable`) — https://openlibrary.org/search.json?q=ebook_access:public — measured 2026-10-15
12. Wikimedia dumps: Wikidata entities directory — https://dumps.wikimedia.org/wikidatawiki/entities/ — files dated 2026-10-09 to 10-15
13. Library of Congress: MARC Distribution Services and MDSConnect — https://www.loc.gov/cds/products/marcDist.php — accessed 2026-10-15 (free data frozen at 2016; stale)
14. Library of Congress: APIs — https://www.loc.gov/apis/ — accessed 2026-10-15
15. HathiTrust: Hathifiles file list JSON (hathi_full_20261001) and streamed count — https://www.hathitrust.org/files/hathifiles/hathi_file_list.json — 2026-10-01
16. HathiTrust: Hathifiles page (search result; CC0, monthly and daily files) — https://www.hathitrust.org/hathifiles — accessed via search 2026-10-15
17. HTRC: Extracted Features v2.0 documentation — https://htrc.atlassian.net/wiki/spaces/COM/pages/43295914/Extracted+Features+v.2.0 — snapshot Feb 2020 (stale)
18. DOAB: Metadata harvesting and content dissemination (search result; fetch 403) — https://www.doabooks.org/en/doab/metadata-harvesting-and-content-dissemination — undated
19. DOAB OAI-PMH endpoint (completeListSize) — https://directory.doabooks.org/oai/request?verb=ListRecords&metadataPrefix=oai_dc — measured 2026-10-15
20. OAPEN OAI-PMH endpoint (completeListSize) — https://library.oapen.org/oai/request?verb=ListRecords&metadataPrefix=oai_dc — measured 2026-10-15
21. OpenStax CMS API (books, licenses, states) — https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&fields=title,license_name,book_state&limit=200 — measured 2026-10-15
22. OpenStax Help: Licensing information (search result) — https://help.openstax.org/s/article/Licensing-information-of-OpenStax-textbooks — undated
23. Kiwix OPDS catalog (ZIM sizes) — https://opds.library.kiwix.org/catalog/v2/entries?name=wikipedia_en_all — measured 2026-10-15
24. arXiv: Bulk data access via S3 — https://info.arxiv.org/help/bulk_data_s3.html — figures Mar 2023 / Apr 2025
25. arXiv: Monthly submissions statistics — https://arxiv.org/stats/monthly_submissions — 2026-10-15
26. Kaggle: arXiv dataset (page not machine-readable) — https://www.kaggle.com/datasets/Cornell-University/arxiv — accessed 2026-10-15
27. Semantic Scholar Datasets API: latest release manifest — https://api.semanticscholar.org/datasets/v1/release/latest — release 2026-10-06
28. Semantic Scholar: API product page — https://www.semanticscholar.org/product/api — accessed 2026-10-15
29. Internet Archive advancedsearch / scrape API counts — https://archive.org/advancedsearch.php?q=mediatype%3Atexts&rows=0&output=json and https://archive.org/services/search/v1/scrape — measured 2026-10-15
30. MIT OpenCourseWare: About — https://ocw.mit.edu/about/ — accessed 2026-10-15
31. Google: YouTube Data API v3 Getting Started (quota) — https://developers.google.com/youtube/v3/getting-started — updated 2026-09-14
32. Google: YouTube captions.download — https://developers.google.com/youtube/v3/docs/captions/download — updated 2026-09-15
33. jdepoix/youtube-transcript-api (README and issue #593; search results) — https://github.com/jdepoix/youtube-transcript-api and https://github.com/jdepoix/youtube-transcript-api/issues/593 — 2025–2026
34. Project Gutenberg: Offline catalogs, plus `pg_catalog.csv` count — https://www.gutenberg.org/ebooks/offline_catalogs.html ; https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv — measured 2026-10-15
35. datalab-to/marker README (license, benchmarks, throughput) — https://github.com/datalab-to/marker — accessed 2026-10-15
36. opendatalab/OmniDocBench README (v1.6 leaderboard) — https://github.com/opendatalab/OmniDocBench — updates 2026-03-31 to 2026-09-11
37. allenai/olmocr README (v0.4.0, olmOCR-Bench, cost) — https://github.com/allenai/olmocr — v0.4.0 2025-10-21
38. opendatalab/MinerU README (v4.0, license, hardware) — https://github.com/opendatalab/MinerU — accessed 2026-10-15
39. docling-project/docling README — https://github.com/docling-project/docling — accessed 2026-10-15
40. GROBID README — https://github.com/kermitt2/grobid — accessed 2026-10-15
41. facebookresearch/nougat README — https://github.com/facebookresearch/nougat — accessed 2026-10-15
42. LlamaIndex: Pricing (LlamaParse credits) — https://www.llamaindex.ai/pricing — accessed 2026-10-15
43. Mistral docs: Models overview (OCR versions, retirements) — https://docs.mistral.ai/getting-started/models/models_overview/ — accessed 2026-10-15
44. Anthropic: Claude API pricing (models, batch, tokenizer note) — https://platform.claude.com/docs/en/about-claude/pricing — accessed 2026-10-15
45. OpenAI: API pricing (GPT-5.x, embeddings, transcription) — https://developers.openai.com/api/docs/pricing — accessed 2026-10-15
46. Google: Gemini API pricing — https://ai.google.dev/gemini-api/docs/pricing — accessed 2026-10-15
47. Voyage AI: Pricing — https://docs.voyageai.com/docs/pricing — accessed 2026-10-15
48. Cohere: Pricing (Model Vault) — https://cohere.com/pricing — accessed 2026-10-15
49. Hugging Face: Qwen/Qwen3-Embedding-8B model card — https://huggingface.co/Qwen/Qwen3-Embedding-8B — MTEB claim dated 2025-06-05
50. Hugging Face: google/embeddinggemma-300m model card — https://huggingface.co/google/embeddinggemma-300m — paper 2025-09-24
51. Hugging Face: nomic-ai/nomic-embed-text-v2-moe model card — https://huggingface.co/nomic-ai/nomic-embed-text-v2-moe — paper 2025-02-11
52. pgvector README (v0.8.7) — https://github.com/pgvector/pgvector — accessed 2026-10-15
53. LanceDB README — https://github.com/lancedb/lancedb — accessed 2026-10-15
54. sqlite-vec README — https://github.com/asg017/sqlite-vec — accessed 2026-10-15
55. turbopuffer: Pricing (plan minimums) — https://turbopuffer.com/pricing — accessed 2026-10-15
56. Qdrant: Pricing — https://qdrant.tech/pricing/ — accessed 2026-10-15
57. Pagefind homepage (v1.5) — https://pagefind.app/ — accessed 2026-10-15
58. Orama README — https://github.com/oramasearch/orama — accessed 2026-10-15
59. phiresky/sql.js-httpvfs README — https://github.com/phiresky/sql.js-httpvfs — accessed 2026-10-15 (project from 2021; possibly stale)
60. DuckDB-Wasm overview — https://duckdb.org/docs/current/clients/wasm/overview.html — accessed 2026-10-15
61. Hugging Face: Transformers.js docs — https://huggingface.co/docs/transformers.js/index — accessed 2026-10-15
62. Open Syllabus homepage — https://www.opensyllabus.org/ — accessed 2026-10-15
63. janeczku/calibre-web README — https://github.com/janeczku/calibre-web — accessed 2026-10-15
64. booklore-app/booklore README (maintenance mode) — https://github.com/booklore-app/booklore — accessed 2026-10-15
65. Kareadita/Kavita README — https://github.com/Kareadita/Kavita — accessed 2026-10-15
66. gotson/komga README — https://github.com/gotson/komga — accessed 2026-10-15
67. advplyr/audiobookshelf README — https://github.com/advplyr/audiobookshelf — accessed 2026-10-15
68. paperless-ngx README — https://github.com/paperless-ngx/paperless-ngx — accessed 2026-10-15
69. Zotero: Storage plans — https://www.zotero.org/storage — accessed 2026-10-15
70. Readwise: Pricing — https://readwise.io/pricing — accessed 2026-10-15
71. Hugging Face: Institutional Books dataset card — https://huggingface.co/datasets/institutional/institutional-books-1.0 — paper 2025-06-10
72. Hugging Face: PleIAs/common_corpus dataset card — https://huggingface.co/datasets/PleIAs/common_corpus — v1 Nov 2024, later versions 2025–26
73. Hugging Face: storytracer/US-PD-Books dataset card (texts removed at IA's request) — https://huggingface.co/datasets/storytracer/US-PD-Books — accessed 2026-10-15
74. Anthropic copyright settlement website (final approval 2026-07-20) — https://www.anthropiccopyrightsettlement.com/ — accessed 2026-10-15
75. Open Library: Library Explorer — https://openlibrary.org/explore — accessed 2026-10-15

---

## Verification pass (independent)

An independent fact-check on 2026-10-15. Each load-bearing claim was re-checked against its cited primary source by direct fetch or by a fresh measurement: a HEAD request, a manifest download, a full streamed recount of the Hathifile, the OpenStax CMS API and the Gutenberg CSV. The shared web-search budget was exhausted early in this pass, so independent *searches* for newer or contradicting coverage were not possible. Where a claim rests only on its cited page, that is noted. Inline fixes above carry "[corrected in verification]".

| Claim | Verdict | Correction / note | Source |
|---|---|---|---|
| 1. OpenAlex snapshot is free on `s3://openalex` with no AWS account: ~745 GB JSONL / ~770 GB Parquet, ~626M records per format, quarterly on the 2nd Wednesday of Jan/Apr/Jul/Oct, Parquet and new layout in 2026 | Confirmed | Page (updated 2026-09-24) matches. Works alone ~615 GB. `deleted_ids.csv.gz` has been in the public bucket since the 2026-09-23 release. AWS Open Data pays ~$70 per download | https://help.openalex.org/access/snapshot/ |
| 2. OpenAlex API: $1/day with a free key, $0.10/day keyless; list $0.10/1k, search and semantic $1/1k, PDF $10/1k, singletons free | Confirmed | Live check: keyless calls from this environment already return "Insufficient budget … $0 remaining", which is consistent with the shared keyless budget | https://help.openalex.org/access/example-costs/ |
| 3. OpenAlex plans: Member $5k ($20/day), Member+ $10k ($100/day, daily sync), Partner from $20k; 50M+ PDFs (~250 TB), ~43M TEI (~20 TB) | Confirmed | Plan figures are on the pricing page (updated 2026-08-11). The TB and TEI figures are on the fulltext page, not the pricing page. PDF sync is a paid add-on on Cloudflare R2 | https://help.openalex.org/access/pricing ; https://help.openalex.org/access/fulltext/ |
| 4. Crossref 2026 file is 208 GB with ~180M records; REST pools public 5/c1, polite 10/c3, Plus 150 | Confirmed | 180M records cover registrations through part of March 2026. The API page was updated 2025-10-16 | https://crossref.org/services/metadata-retrieval/public-data-file/ ; https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/ |
| 5. Semantic Scholar 2026-10-06: 200M papers, 100M abstracts (ODC-BY "where licensing allows"), 58M TLDRs, 120M SPECTER2 (30×28 GB), 16M s2orc_v2, 2.4B citations; full download needs a free key | Corrected (minor) | All counts and sizes match the live manifest. The quoted license phrase is not in the source: the manifest says "Paper abstract text, where available", and the abstracts README says plain ODC-BY. SPECTER embeddings are Apache-2.0 | https://api.semanticscholar.org/datasets/v1/release/latest |
| 6. Hathifile 20261001: 19,701,406 items; allow 8,293,334; pd 5,870,879; pdus 2,297,084; ic 10,366,655 | Confirmed | Re-streamed independently and every figure matched exactly. Side fix: CC-licensed items total 96,499 (~0.10M), not ~0.12M. The rest of `allow` is ic-world 7,654 and und-world 21,218 | https://www.hathitrust.org/files/hathifiles/hathi_file_list.json |
| 7. Open Library 2026-09-30 dumps: editions 12.62 GB, works 4.07 GB, authors 0.78 GB, all 18.18 GB; 1 rps, or 3 rps identified; no bulk harvesting via the API | Confirmed | HEAD content-lengths match: 12,617,475,043; 4,073,320,823; 782,352,949; 18,182,728,275. The API page (edited 2026-10-09) words the bulk rule as "Please do not use our APIs to bulk download metadata" | https://openlibrary.org/developers/api ; https://archive.org/download/ol_dump_2026-09-30/ |
| 8. Wikidata `latest-all.json.gz` is 156.5 GB (2026-10-13); bz2 103.4 GB | Confirmed | 156,496,041,475 bytes and 103,409,622,204 bytes. Truthy N-Triples gz is 71.7 GB (2026-10-09) | https://dumps.wikimedia.org/wikidatawiki/entities/ |
| 9. arXiv S3 is ~9.2 TB (Apr 2025), +~100 GB/month, requester-pays in us-east-1; no redistribution; link-back required; 3,213,484 submissions | Confirmed | The stats page also gives 3,215,915 articles available, counting migrated articles | https://info.arxiv.org/help/bulk_data_s3.html ; https://arxiv.org/stats/monthly_submissions |
| 10. Claude Haiku 5.5 is $0.10/$0.50 (≤100k) and $0.50/$2.50 (>100k), batch $0.05/$0.25; Sonnet 5.5 $2/$10; Opus 5.5 $4/$20; 4.7+ tokenizer gives ~30% more tokens | Confirmed | The Sonnet 5 $2/$10 price is now permanent, and the planned 2026-09-01 increase was cancelled. Fable 5.1 batch is $5/$25. Separately, Haiku 5.5 accepts `thinking: disabled` only at effort `high` or below, per the thinking-troubleshooting page | https://platform.claude.com/docs/en/about-claude/pricing ; https://platform.claude.com/docs/en/build-with-claude/thinking-troubleshooting |
| 11. OpenAI batch: gpt-5-nano $0.025/$0.20, gpt-5.6-luna $0.10/$0.60, gpt-5-mini $0.125/$1.00; text-embedding-3-small $0.02, -large $0.13 | Confirmed | The page lists no batch price for embeddings. Transcription prices also match | https://developers.openai.com/api/docs/pricing |
| 12. Gemini 3.5 Flash-Lite batch $0.15/$1.25; 3.8 Flash $0.75/$3.75 through 2026-12-31, then $1.50/$7.50; Embedding 2 $0.20 ($0.10 batch) | Confirmed | Output prices include thinking tokens | https://ai.google.dev/gemini-api/docs/pricing |
| 13. Voyage-4: lite $0.02, base $0.06, large $0.12; 200M free tokens; batch 33% off | Confirmed | The free tokens are 200M **per model** (not per family), and they don't apply to batch usage. Fixed inline | https://docs.voyageai.com/docs/pricing |
| 14. OmniDocBench v1.6: TeleOCR 96.91, PaddleOCR-VL-1.6 96.34, MinerU2.5-Pro 95.75, Gemini 3 Pro 92.91, olmOCR 85.74, Mistral OCR 85.66, Marker 78.44 | Corrected | Every listed score is right, but the ranking omitted **OvisOCR2 (0.8B) at 96.47**, which is #2, and GLM-OCR (0.9B) at 95.22. TeleOCR is 1.2B. The README says the benchmark moved to v1.7 on 2026-04-30, though the main table is still captioned "v1.6_full" | https://github.com/opendatalab/OmniDocBench |
| 15. olmOCR v0.4.0 (2025-10-21) scores 82.4 on olmOCR-Bench, under $200 per 1M pages, ≥12 GB GPU | Confirmed (self-reported) | The PyPI package has since reached 0.4.27 (2026-03-12). The README news list still ends at v0.4.0 | https://github.com/allenai/olmocr ; https://pypi.org/pypi/olmocr/json |
| 16. YouTube: 10,000 units/day plus 100 `search.list` and 100 `videos.insert` per day; `captions.download` costs 200 units and needs edit permission | Confirmed | Pages updated 2026-09-14 and 2026-09-15 | https://developers.google.com/youtube/v3/getting-started ; https://developers.google.com/youtube/v3/docs/captions/download |
| 17. OpenStax live: 70 CC BY-NC-SA, 4 CC BY, 10 no license; 33 CC BY retired | Confirmed | Re-measured, and the 129 books match exactly. `license_url` points to by-nc-sa/4.0 for, e.g., Biology 2e and University Physics Vol. 1 | https://openstax.org/apps/cms/api/v2/pages/?type=books.Book&fields=title,license_name,book_state&limit=200 |
| 18. IA asked that US-PD-Books (653,983 books) be deleted over unreliable PD metadata; texts removed | Confirmed | The card says "The Internet Archive has requested that this dataset be deleted"; texts removed, metadata kept | https://huggingface.co/datasets/storytracer/US-PD-Books |
| 19. Institutional Books: 983,004 PD volumes, 242B tokens, 386M pages, 254 languages; gated, noncommercial, no redistribution | Confirmed | Tokens are counted with `o200k_base`. The terms are labeled early-access and provisional | https://huggingface.co/datasets/institutional/institutional-books-1.0 |
| 20. Bartz v. Anthropic: final approval 2026-07-20; first payments expected by 2026-11-15 | Confirmed | The settlement site says "assuming that no late-filed appeal is permitted to go forward". The $1.5B fund and ~$3,000 per work (before fees and costs) are now verified from the court-ordered long-form notice, so the label was upgraded from [P] | https://www.anthropiccopyrightsettlement.com/ |
| Other: raw-lake total "1.5–2.5 TB" | Corrected | The listed components sum to ≈1.24 TB (core), ≈1.5 TB with citations, and ≈2.3 TB with SPECTER2. Changed to 1.2–2.4 TB | Internal arithmetic on [4][6][9][12][15][27] |
| Other: Mistral OCR status | Corrected (tense and completeness) | OCR 4.0 was already retired on 2026-09-30. OCR 3 (v25.12) is still available alongside OCR 4.1 | https://docs.mistral.ai/getting-started/models/models_overview/ |
| Other: Docling "v2.70+" | Corrected (stale) | PyPI shows docling 2.139.0 | https://pypi.org/pypi/docling/json |
| Other: EmbeddingGemma MTEB English v2 69.67 (768d) / 66.66 (128d) | Confirmed | Matches the model card's full-precision table | https://huggingface.co/google/embeddinggemma-300m |
| Other: turbopuffer minimums $16 / $256 / ≥$4,096 | Confirmed | Per-GB rates are still not shown | https://turbopuffer.com/pricing |
| Other: OpenAlex 10/30/50 req/s, semantic search 1 req/s, ~327M vs ~476M works | Confirmed | The auth page (updated 2026-10-14) says cursor paging past page 1 needs a key. The 327M/476M figures are on the snapshot page | https://help.openalex.org/api-reference/authentication |
| Other: Crossref 2025 file "197 GB, 165M+" [S][7] | Confirmed | Blog post dated 2025-03-12. The data-file page itself labels a 197 GB file "2024 March", which is a Crossref-side inconsistency | https://www.crossref.org/blog/2025-public-data-file-now-available/ |
| Other: Gutenberg 78,325 texts (61,817 English), 79,576 rows, max ID 79,763 | Confirmed | Re-counted from `pg_catalog.csv` (21.25 MB) | https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv |
| Other: Marker code Apache-2.0, weights OpenRAIL-M free under $5M; olmocr-bench table (Chandra 2 85.8 … docling 50.3); pgvector 0.8.7 limits; Pagefind 1.5 "under 300kB, ~100kB" | Confirmed | All match the cited READMEs and pages. Kiwix maxi 127.4 GB (2026-08-25) also matches | Cited READMEs [35][52][57][23] |
| Not re-checked: Wikidata "127 GB in June 2024" [S]; Listen Notes figures; IA/DOAB/OAPEN live counts | Unverifiable here | The search budget was exhausted. These are labeled [S] or measured counts in the dossier and were not re-measured | — |
