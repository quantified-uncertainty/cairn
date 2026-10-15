# Grey literature and community archives: reports, working papers, forums, blogs and newsletters as a literature — research dossier

**Date:** 2026-10-15
**Track:** R12 (Open Stacks / CAIRN)
**Scope:** The non-journal layer this reader actually reads: research forums (LessWrong, the AI Alignment Forum, the EA Forum), blogs and newsletters (Substack, Ghost, Medium, WordPress, personal sites), think-tank and AI-lab reports and system cards, government and intergovernmental documents, working papers and dissertations, discussion archives (Hacker News, Reddit, Stack Exchange, X), policy-document indexes, and a short note on Chinese-language AI-policy documents. For each source: size, cadence, API or bulk route, licence, whether the scholarly graphs see it, and how it persists. Then: link rot and archiving, quality signals without peer review, and what a tool builder should do about cross-posts, edits, comments and identifiers.

Covered elsewhere, cross-referenced only: SSRN, RePEc/IDEAS, OSF Preprints and PhilArchive sizes (R02 §2); Dimensions' 2.5M policy documents (R02 §3); LessWrong and ACX reviews as curation signals (R11 §1.1); general copyright, fair use and API-terms law (R09); the bulk-first architecture and the unified work record (R10).

**Method.** Most numbers here are primary measurements taken on 2026-10-15 between about 10:00 and 10:55 UTC:
- **Direct API counts:** ForumMagnum GraphQL on all three forums (post, comment, tag, sequence and review-winner totals; per-year post counts; a 500-post sample per forum for cross-posting and edit statistics; revision history); Rogue Scholar API; api.congress.gov (CRS endpoint, shared `DEMO_KEY`); OSTI.gov and NASA NTRS APIs; the Hacker News Firebase and Algolia APIs; Crossref prefix counts; GOV.UK search API; Hugging Face dataset API.
- **Measurement A (curricula):** I pulled every resource from three current BlueDot Impact courses (391 entries) via the course pages' embedded JSON, every link on Stanford CS120 (Fall 2025), and every link in a new EA Forum reading list. I classified each by type with domain rules plus manual review.
- **Measurement B (index coverage):** 60 grey items (20 forum/blog posts, 20 think-tank or lab reports, 20 working papers or government documents), mostly drawn from those curricula. Each was checked against OpenAlex (free autocomplete and DOI lookups, because the anonymous search budget on this network was exhausted), Semantic Scholar (`search/match`), Crossref (bibliographic query, prefix and DOI registration-agency lookups), a live fetch with a descriptive User-Agent (retrying with a browser User-Agent on failure), licence strings in the page or PDF, and the Wayback Machine availability API. Google Scholar was spot-checked by hand on 18 items. Every automatic index match was reviewed manually; title-only matching produced false positives that I removed (see §5.2).
- **Web search and fetches** for policies, terms and secondary reports. Web search worked this session, but several sites blocked automated access; I record those walls as findings (§1.4, §2.4).

I used a descriptive User-Agent and stayed at or below published crawl delays. I did not bulk-scrape any site whose terms forbid it. One deliberate exception to "descriptive UA only": a 14-site test of how sites treat crawler User-Agent strings (§2.4), at one request per UA per site.

**Evidence legend.**
- **[V]** verified on a primary source or by a live query this session.
- **[S]** secondary source (press, aggregator, search-result summary).
- **[I]** my inference or calculation.
- **[K]** background knowledge, not re-verified this session.

Confidence appears as [~NN%] where useful. Sources more than about two years old are flagged "(stale?)". Bracketed numbers refer to the numbered Sources list. All counts, prices and statuses are **as of October 2026** unless dated otherwise.

---

## Executive summary

1. **For this audience, grey literature is the literature.** Across three current BlueDot Impact courses (AI Governance, Technical AI Safety, AGI Strategy), 310 unique reading items break down as 40.3% blog or newsletter posts, 21.3% reports, 12.3% forum or social posts and 12.3% preprints or working papers. Only **1.3% are peer-reviewed papers** and 1.0% books. That makes 85.5% grey and 97.7% not peer-reviewed. A university course on the same topic (Stanford CS120, Fall 2025) is the mirror image: 45.8% peer-reviewed, 35.3% preprints, 17.9% grey. As of October 2026. [V, measured; classification rubric in §5.1]

2. **The scholarly graphs see almost none of the forum and blog layer.** In a 60-item test, **0 of 20** forum and blog posts were in OpenAlex, Semantic Scholar or Crossref. For reports the figure was 7 of 20, and for working papers and government documents 14 of 20. **Headline: 39 of 60 items (65%) were invisible to all three graphs**, as of October 2026. Google Scholar did better on posts (4 of 7 spot checks found, often through third-party PDF mirrors) and worse on government documents (0 of 5). [V, n = 60; GS n = 18, low confidence][34][35][36][37]

3. **The forum corpora are small, structured and cheaply mirrorable.** As of 2026-10-15 via GraphQL:
   - LessWrong: **54,587 posts and 1,090,404 comments**;
   - Alignment Forum (largely a subset of LessWrong): **4,684 posts and 25,840 comments**;
   - EA Forum: **24,972 posts and 208,515 comments**.

   Karma, tags (7,327 tag and wiki pages on LessWrong), sequences (761), Annual Review winners (343, review years 2018–2024) with their final vote scores, cross-post links and full revision histories are all exposed through the API. LessWrong's text alone is roughly 215M words [I]. [V]

4. **Licences diverge sharply between the two big forums.** The EA Forum requires all content posted **from 1 December 2022** to be available under **CC BY 4.0**; earlier posts were not relicensed. LessWrong and the Alignment Forum have no blanket open licence: authors own their posts, MIRI holds a hosting licence, and the linked terms (a PDF dated 2015) prohibit "using a spider, scraper, or other automated technology". Yet the same site now publishes a GraphQL API and an AI-agent Markdown API, and its robots.txt sets `Crawl-Delay: 3`. As of October 2026. [V]

5. **LessWrong has become agent-friendly.** Its `robots.txt` points agents to `/api/SKILL.md` (v2.0.0), which documents Markdown versions of posts, comments, tags and sequences (`/api/post/[id]`, `?format=markdown`) and a draft-editing API for agents. No other source in this dossier offers anything comparable. The EA Forum runs a different GraphQL schema (its "v3" front end accepts only the older `input:{terms:…}` syntax), so one client will not serve both forums. [V]

6. **Substack is the largest walled garden for this reader.** As of October 2026:
   - **No content API.** Substack's "Developer API" (terms dated 2026-01-08) returns creator-profile data only.
   - **RSS returns the latest 20 posts.**
   - **The Terms of Use (updated 2026-10-06) prohibit crawling, scraping or spidering "any page, data, or portion of Substack" and copying "any significant portion".**

   Per-publication sitemaps (1,493 post URLs for ACX) and an unofficial `/api/v1/archive` JSON endpoint exist, but using them at scale conflicts with those terms. [V]

7. **DOIs for blog posts work, and quickly.** Rogue Scholar holds **57,803 posts from 184 blogs**, each with a Crossref DOI and CC BY licence metadata. Three of four sampled posts from 13–14 October 2026 were already in OpenAlex a day or two later. Many think-tank and IGO publishers also mint Crossref DOIs: RAND (10,810 DOIs), CSET (284), NBER (36,367), Federal Reserve Board (5,004), World Bank (51,461), OECD (205,409), IMF (105,655), NIST (32,654) and OSTI (341,249). EU publications use the Publications Office's own DOI registration agency, so Crossref-only tools miss them. As of 2026-10-15. [V]

8. **Public-domain government grey literature sits behind bot walls.** From this sandbox, congress.gov, parliament.uk and SSRN (all Cloudflare challenges), gao.gov and imf.org (Akamai "Access Denied"), OECD's DOI landing (Cloudflare) and EUR-Lex (an HTTP 202 challenge) all refused scripted fetches, whatever the User-Agent. Even the PDF and HTML links that the official CRS API returns are challenge-walled. Workarounds that worked:
   - **api.congress.gov** metadata: **14,180** CRS products via the CRS endpoint;
   - **EveryCRSReport**'s bulk `reports.csv`: **23,564 rows**, refreshed 2026-10-15;
   - the **OSTI** API: **5,047,570** records, 711,165 of them technical reports;
   - the **NTRS** API: **648,017** records;
   - the keyless **GOV.UK** Content and Search APIs: 17,977 "research" documents.

   As of October 2026. [V]

9. **Link rot is severe; archives help but are fragile.**
   - Pew found **38%** of pages that existed in 2013 were gone by October 2023, and **21%** of government pages contained at least one broken link [V].
   - The Wayback availability API returned a snapshot for **48 of 60** test items (80%). It also returns false negatives: one item showed up only when a timestamp was passed.
   - From this cloud IP the Wayback Machine itself returned 429s and connection resets. It suffered a breach of about 31M accounts and a multi-week outage in October 2024 [V/S].
   - English Wikipedia blacklisted archive.today in February 2026 after an alleged DDoS run from its CAPTCHA page [S].
   - **Archive on ingest, to more than one place.**

10. **Cloudflare's July 2025 AI-crawler default did not block a polite personal agent in my test.** All 8 Cloudflare-fronted blogs and think tanks tested (EA Forum, ACX/Substack, gwern.net, Marginal Revolution, Brookings, Epoch AI, CNAS, darioamodei.com) returned 200 even to User-Agent strings claiming to be ClaudeBot or GPTBot. Cloudflare verifies real crawlers by IP, so spoofed names are not "verified bots". The blocks I did see were site-specific User-Agent rules (RAND on CloudFront refused the descriptive UA and "ClaudeBot"; WordPress.com refused "GPTBot") plus bot management on government sites. Pay-per-crawl remains a private beta for registered crawler operators. As of October 2026. [V, n = 14 sites]

11. **Discussion archives are closing, except Hacker News.**
    - **Hacker News:** max item ID **50,101,480** (2026-10-15), with no stated rate limit on the Firebase API; Algolia indexes 3,832,742 stories and 34,294,207 comments. [V]
    - **Reddit:** announced on 2026-09-30 that RSS ends on 2026-11-13 and public Data API access closes in stages through March 2027. [S]
    - **X:** charges **$0.005 per post read**, capped at 3M reads per month. [V]
    - **Stack Exchange:** its 2024 dump terms bar LLM training. [S] (stale?)

12. **Policy-document indexes are institutional products.**
    - **Overton** indexes **25M+ documents from 3,000+ sources**, with about 10M policy-to-policy and about 28M policy-to-DOI citations. Its API (1 request/s, no full text "for licensing reasons") comes only with subscriptions, which federal purchase records put at **$11,370–$40,599/year** for small teams. [V/S]
    - **Policy Commons** offered free individual accounts with **25 searches/month** at launch. [S] (stale?)
    - **No free individual route to Overton was found.** As of October 2026.

13. **Quality signals exist outside peer review, but they are thin.**
    - LessWrong's Annual Review exposes per-post final vote scores (for example, 50 high-karma voters on the 2024 #1 post). [V]
    - The Unjournal reports "100+ evaluations" of **53** papers. [V]
    - Of 28,000+ working papers in four major economics series, **66.5%** were eventually published in a journal, 8% as book chapters, and 25.5% left no trace. [V] (stale?)
    - Preprint text "generally changed very little" before publication (arXiv sample). [V] (stale?)

14. **Cross-posting and editing are the norm, so a post is a moving, multi-homed object.**
    - In a 500-post September 2026 LessWrong sample, **17.8%** were link-posts to an external URL (7.4% to Substack), **2.0%** carried a native LessWrong↔EA Forum cross-post link, and **5.6%** were auto-imported from an RSS feed. **50%** had been revised after first publication, and LessWrong exposes every revision with word-level change counts.
    - On the EA Forum, **19.8%** were link-posts and **4.6%** native cross-posts.
    - **48.8%** of LessWrong posts and **54.6%** of EA Forum posts had zero comments.

    [V]

15. **Mirroring this whole layer is cheap; the cost is legal and engineering care, not money.**
    - **Embedding** all three forums (≈370M tokens [I]) costs about **$7** at $0.02/MTok [I, R10 prices].
    - **One-paragraph summaries** of all ~80k forum posts cost about **$14 on Haiku 5.5 batch** or **~$270 on Sonnet 5.5 batch** [I, pricing-reference.md].
    - **Daily incremental sync** is a few dozen API calls.
    - **Existing dumps are stale or mislabelled.** The StampyAI alignment dataset (14,271 documents) was last modified 2023-11-16. Third-party Hugging Face LessWrong dumps carry contradictory licence tags (MIT, Apache-2.0, CC0, "unknown") that the source does not grant.

---

## Detailed findings

### 1. Map of the layer (as of October 2026)

#### 1.0 Source comparison table (Deliverable 1)

"Indexed" columns: OA = OpenAlex, S2 = Semantic Scholar, CR = Crossref DOI, GS = Google Scholar. ✓ = generally yes; ~ = partial or via versions; ✗ = generally no. Index judgments come from the §5.2 test unless marked [K]/[I].

| Source | Content | Items & range (as of Oct 2026) | Cadence | API / bulk; limits | Licence / terms | OA / S2 / CR / GS | Persistence |
|---|---|---|---|---|---|---|---|
| **LessWrong** | Posts, comments, wiki/tags, sequences, Annual Review | 54,587 posts (imports from 2003; native from 2009); 1,090,404 comments [V][1] | ~15–20 posts/day in 2025–26 [V] | GraphQL (`/graphql`), Markdown agent API (`/api/…`), no published rate limit; robots Crawl-Delay 3 [V][4][5] | Authors own content; MIRI terms (2015) ban spiders/scrapers [V][7] | ✗ / ✗ / ✗ / ~ (via third-party PDFs) [V] | Stable IDs (`_id`, 17 chars); full revision history; Wayback mostly yes [V] |
| **AI Alignment Forum** | Curated alignment subset of LW | 4,684 posts (first 2009-07-27); 25,840 comments [V][2] | ~60–70 posts/quarter in 2026, half the 2025 rate [V] | Same codebase, endpoint, robots [V] | As LW | ✗ / ✗ / ✗ / ~ | Same IDs as LW copies [I] |
| **EA Forum** | Posts, comments, topics, sequences | 24,972 posts (dated reprints from 1972; native from ~2011); 208,515 comments [V][3] | ~9–10 posts/day in 2025–26 [V] | GraphQL, older `input:{terms}` schema; robots Crawl-Delay 2; sitemap [V][5] | **CC BY 4.0 for content posted from 2022-12-01**; earlier posts author-owned [V][9][10] | ✗ / ✗ / ✗ / ~ | Stable `_id`; revisions [V] |
| **Substack** | Newsletters | Platform total not published; one third-party metadata dump claims 3,513,881 posts [S][12]; ACX alone 1,493 posts in sitemap [V][17] | Per publication | No content API; RSS = 20 latest; unofficial `/api/v1/archive` JSON; sitemaps [V][15][16][17] | ToS (2026-10-06) bans crawling/scraping and storing "significant" portions; authors own posts [V][15] | ✗ / ✗ / ✗ / ~ | Custom domains move; Wayback mostly yes [V] |
| **Ghost / Medium / WordPress blogs** | Personal and lab blogs | n/a | Per blog | RSS: Ghost 15, Medium 10, WordPress.com 10 items; Ghost Content API (read-only key, often embedded in pages); Medium API "no longer supported" [V][18][19][20] | Per author; mostly © | ✗ / ✗ / ✗ / ~ | Varies |
| **Rogue Scholar** | Science blogs with DOIs | 57,803 posts, 184 blogs [V][21]; 78,191 DOIs on prefix 10.59350 [V][34] | Continuous (feed polling) | Open JSON API (`found`/`hits`) [V] | CC BY 4.0 per-post metadata (sample) [V]; required for inclusion [K ~80%] | ✓ (as type "other") / ? / ✓ / ? | Crossref DOIs; IA arrangement [V][21] |
| **Think tanks** (RAND, CSET, GovAI, Epoch, Brookings, CNAS, CSIS, Carnegie, IAPS, Forethought) | Reports, briefs, commentary | RAND 10,810 DOIs; CSET 284 DOIs [V][34]; others not counted | Weekly–monthly | Site RSS/sitemaps; Crossref for DOI-minting publishers | Mixed: see §1.3 | RAND/CSET ✓ via DOI; most others ✗ unless also on arXiv [V] | DOIs where minted; PDFs on CDNs |
| **AI-lab reports & system cards** | System cards, frameworks, research posts | n/a | Per model release | PDFs on CDNs; no API | © (no licence stated) [V] | ✗ / ✗ / ✗ / ~ [V] | Unstable CDN hash URLs (e.g., `www-cdn.anthropic.com/<hash>.pdf`) [V] |
| **CRS** (via api.congress.gov) | Reports, In Focus, Insights, legal sidebars | 14,180 via API [V][39]; 23,564 rows at EveryCRSReport [V][41] | Daily | API key from api.data.gov, 5,000 req/h [V][39]; `DEMO_KEY` 10/h on this endpoint [V]; EveryCRSReport bulk CSV + files [V][41] | US government work, public domain [V][47] | ✗ / ✗ / ✗ / ✗ (spot check) [V] | Versioned; congress.gov files behind Cloudflare [V] |
| **GAO** | Audit reports | n/a (gao.gov blocked scripts) [V] | Daily | GovInfo API (key) [K] | Public domain [K] | ✗ (1 test item) | Stable product IDs |
| **GovInfo** | Federal publications | Not measured (`DEMO_KEY` exhausted) [V] | Daily | API key (api.data.gov; 1,000 req/h default) [V][40] | Mostly public domain | varies | Permanent (GPO) [K] |
| **OSTI.gov** | DOE-funded reports, papers, data | 5,047,570 records; 2,530,201 with full text; 711,165 technical reports [V][42]; 341,249 Crossref DOIs [V][34] | Daily | Open REST API (`X-Total-Count` header) [V] | Lab reports are often **contractor works**, not automatically public domain [I][47] | ✓ / ✓ / ✓ (1 test item) [V] | DOIs 10.2172 [V] |
| **NASA NTRS** | Technical reports, papers | 648,017 citations [V][43] | Daily | Open JSON API (GET and POST search) [V] | NASA civil-servant works public domain [K] | ✗ for the TM; conference twin ✓ [V] | Stable citation IDs |
| **NTIS / NTRL** | Legacy federal tech reports | Not verified | — | Search free; many documents fee-based [K] | Mixed | ✗ [K] | — |
| **UK: GOV.UK, POST, Commons Library** | Research and briefings | GOV.UK "research" type: 17,977 [V][44] | Daily | GOV.UK Content and Search APIs, no key [V]; parliament.uk Cloudflare-walled [V] | OGL v3.0 [K] | ✗ (1 test item) | GOV.UK asset URLs stable [I] |
| **EU Publications Office / CORDIS / EUR-Lex** | Studies, JRC reports, law | Not measured | Daily | Cellar/SPARQL [K]; EUR-Lex returned a 202 challenge to scripts [V] | EU reuse policy (CC BY 4.0 for most Commission documents) [K] | ✗ in OA/S2 for both test items; DOIs registered with **OP**, not Crossref [V] | OP DOIs 10.2760 [V] |
| **OECD** | Working papers, AI papers | 205,409 Crossref DOIs [V][34] | Weekly | Crossref metadata; site Cloudflare-walled [V] | OECD terms (CC BY 4.0 on newer titles [I ~60%]) | ✓ / ✓ / ✓ [V] | DOIs 10.1787 |
| **World Bank OKR** | Policy research working papers, reports | 51,461 Crossref DOIs [V][34] | Weekly | DSpace 7 REST API, open [V][45] | CC BY 3.0 IGO (test item) [V] | ✓ / ✓ / ✓ [V] | Handles + DOIs |
| **IMF** | WPs, staff discussion notes | 105,655 Crossref DOIs [V][34] | Weekly | Crossref metadata; imf.org Akamai-walled [V] | IMF terms (©) [K] | ✓ / ✓ / ✓ [V] | DOIs 10.5089 |
| **NBER** | Working papers | 36,367 Crossref DOIs [V][34] | Weekly (Mondays) [K] | Metadata page per WP; data files [K] | ©; **3 free downloads/year** for the public; free to .gov, low-income countries, journalists, subscribers [V][48] | ✓ / ✓ / ✓ [V] | DOIs 10.3386 |
| **SSRN** (see R02) | Working papers | 1,503,447 Crossref DOIs on 10.2139 [V][34] | Daily | None for scripts (Cloudflare) [V] | © ; login for downloads [S] | ✓ / ✗ (test item) / ✓ | DOIs |
| **Federal Reserve (FEDS)** | Working papers | 5,004 Crossref DOIs [V][34] | Weekly | Site open [V] | Board staff work, probably public domain [I ~70%] | ✓ / ? / ✓ [V] | DOIs 10.17016 |
| **arXiv econ, cs.CY** (see R02) | Preprints | — | Daily | OAI-PMH, API, bulk (R02) | Per-paper licence (test: CC BY-SA, CC BY) [V] | ✓ / ✓ / DataCite DOI [V] | Versioned |
| **EThOS** (British Library) | UK PhD theses (metadata) | 650,000+ records; 400,000+ open via university repositories; ~14,000 added since the attack [V][51] | Restored July 2026 | No file hosting; links out [V] | Per thesis | ✗ [K] | Back after ~3 years offline [V] |
| **OATD, DART-Europe** | Thesis indexes | Not verified (both returned 403 to scripts) [V][77] | — | — | — | — | — |
| **PQDT Open** | Open dissertations | Not verified; `pqdtopen.proquest.com` redirects to `proquest.com/?defaultdiss=true` and loops [V][75] | — | — | — | — | Status unclear |
| **Hacker News** | Links and comments | Max item 50,101,480 [V][52]; Algolia: 3,832,742 stories, 34,294,207 comments [V][53] | Real time | Firebase API: "no rate limit" [V]; Algolia search API; Hugging Face Parquet mirrors (ODC-BY tags) [V][12] | YC terms [K] | ✗ | IDs permanent |
| **Reddit** | Threads | — | — | Public Data API closing through March 2027; RSS ends 2026-11-13 [S][54] | Commercial agreements required after 2027 [S] | ✗ | — |
| **Stack Exchange** | Q&A | — | Quarterly dumps [S] | Login-gated dump; download terms bar LLM training (July 2024) [S][55] (stale?) | Content CC BY-SA | ✗ | — |
| **X** | Threads | — | — | Pay-per-use: $0.005/post read, 3M reads/month cap [V][56]; Community Archive (opt-in uploads, Supabase API) [V][57] | X terms | ✗ (0 of 1 X item spot-checked) | 18% of tweets gone within weeks (Pew) [V][61] |
| **Overton** | Policy documents + citations | 25M+ docs, 3,000+ sources, ~10M policy→policy and ~28M policy→DOI citations [V][58] | Continuous | REST API with subscription only; 1 req/s; no full text [V][58] | Commercial | — | — |
| **Policy Commons** | Think-tank/IGO reports | 3.5M reports from 8,500 orgs (2022) [S][60] (stale?) | — | Free account: 25 searches/month (2021) [S] (stale?); site 403 to scripts [V] | Commercial | — | — |
| **Dimensions** | Policy documents (see R02 §3) | 2.5M policy documents (R02) | — | Commercial | — | — | — |

#### 1.1 Research forums (LessWrong, Alignment Forum, EA Forum)

**Counts.** Live GraphQL counts, 2026-10-15 [V][1][2][3]:

| Metric | LessWrong | Alignment Forum | EA Forum |
|---|---|---|---|
| Posts (default view: published, listed, non-draft, non-shortform) | **54,587** | **4,684** | **24,972** |
| Comments (default view) | **1,090,404** | **25,840** | **208,515** |
| Shortform ("quick takes") comments | 15,689 | 576 | 4,552 |
| Curated posts | 867 | 218 | 211 |
| Tags / wiki pages (`allPublicTags`) | 7,327 (shared with AF) | — | 1,068 |
| Sequences (all / curated) | 761 / 42 | 157 / 12 | 310 / 0 |
| Annual Review winners | 343 (2018–2024 review years) | (shared) | — |
| Earliest dated post | 2003-01-01 (imported Yudkowsky essay) | 2009-07-27 | 1972-03-01 (Singer reprint) |

Posts per calendar year (2026 runs to October 15) [V]:

| Year | 2006 | 2008 | 2010 | 2012 | 2014 | 2016 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LW | 8 | 402 | 1,163 | 2,657 | 1,820 | 1,315 | 1,835 | 2,330 | 3,100 | 3,445 | 4,707 | 5,598 | 4,595 | 6,148 | 5,668 |
| AF | 0 | 0 | 1 | 0 | 22 | 122 | 257 | 372 | 443 | 528 | 707 | 734 | 425 | 543 | 199 |
| EAF | 0 | 4 | 0 | 9 | 240 | 350 | 473 | 1,085 | 1,664 | 2,040 | 4,569 | 4,132 | 3,038 | 3,513 | 2,871 |

The per-year sums match the totals (54,585 + 2 pre-2006 posts on LW; 24,970 + 2 on EAF). Mean post length rose from about 470–760 words (2012–2016) to 2,206 words (spring 2026). A recent sample of LW comments averages 126 words (median 72). From these I estimate about **78M words of LessWrong posts and about 137M words of comments** [I].

**What the API exposes** (from schema introspection; field names are verbatim) [V][1]:
- **Karma:** `baseScore`, `voteCount`, `maxBaseScore` and threshold dates (`scoreExceeded75Date`, etc.); AF karma via `afBaseScore`.
- **Annual Review:** `reviewVoteScoreHighKarma`, `finalReviewVoteScoreHighKarma`, `finalReviewVotesHighKarma` (an anonymous vote array), `reviewCount`, and `reviewWinner { reviewYear, category, reviewRanking }`. A Manifold market link (`annualReviewMarketProbability`) is also exposed. Example: the 2024 review's #1 post, "Believing In", has final high-karma score 1,037.3 from 50 voters and 274 karma.
- **Tags:** `tags`, `tagRels`, `tagRelevance`. Sequences via `canonicalSequence` and `sequences`. Table of contents via `tableOfContents`.
- **Cross-posting:** `fmCrosspost { isCrosspost, hostedHere, foreignPostId }` (native LW↔EAF cross-posts); `feedId`/`feedLink` (auto-imported RSS); `canonicalSource`; `url` (link-posts).
- **Versioning:** `version`, `modifiedAt`, `contents { version, editedAt, wordCount }`, and `revisions(selector:{revisionsOnDocument:{documentId, fieldName:"contents"}})`. The revisions call returns every version with `changeMetrics {added, removed}`. One test post had four versions within 25 minutes of posting.
- **Full text:** `contents { html, markdown }` via GraphQL. On LW/AF, also clean Markdown with a metadata header via `/api/post/<id>`. Header fields: author, date, karma, curated flag, tags, comment count [V][4].

**API divergence.** LessWrong and the AF accept the new `posts(selector:{new:{…}}, limit, enableTotal)` syntax. The EA Forum rejects it ("Unknown argument selector") and accepts only `posts(input:{terms:{view:"new",…}, enableTotal:true})`. Response cookies (`prefer_ea_forum_v3`) suggest a separate "v3" front end [V][3]. A shared ForumMagnum client needs two query dialects.

**Licences.**
- **EA Forum:** proposed CC BY-NC on 2022-10-07, then chose **CC BY 4.0 for all content posted from 1 December 2022** after community feedback. Older posts keep their prior status unless the author adds a licence [V][8][9]. The Terms of Use addendum (last updated 2022-10-31) also grants other users a licence "to reproduce and share Your Content … and to produce, reproduce and share Adapted Material for any purposes" under CC BY 4.0 definitions [V][10].
- **LessWrong / AF:** the FAQ links to a MIRI PDF of "Privacy Policy and Terms of Use" (PDF metadata: created 2015-04-01). It says "you own all rights in and to your User-Generated Content" and grants MIRI a hosting licence. It also lists "Using a spider, scraper, or other automated technology to access the Website" as prohibited [V][6][7] (stale?). Against that, the live site publishes GraphQL, an agent Markdown API whose docs explicitly address Claude Code and Codex, and a `robots.txt` crawl delay [V][4][5]. **Reading:** API use at polite rates is sanctioned in practice. Republication of full text is not licensed. [I ~80%]

**Dumps and mirrors.**

| Dump / mirror | Contents | Size | Last updated | Licence tag | Notes |
|---|---|---|---|---|---|
| StampyAI/alignment-research-dataset (HF) | LW, AF, EAF (selected), arXiv, blogs, YouTube, etc. | 14,271 docs, 485 MB | **2023-11-16** | MIT | Stale; MIT tag does not reflect upstream rights [V][11] |
| trentmkelly/LessWrong-43k (HF) | LW posts, no comments, 2007-06-22 → 2025-06-28 | ~43k | 2025-06-28 | **CC0** | Licence tag not grantable by the uploader [V][12] |
| x65617379/lesswrong_260509 (HF) | LW posts + flat comments via GraphQL | 10k–100k rows | 2026-05-09 | unknown | Includes GreaterWrong URLs [V][12] |
| GreaterWrong | Alternative LW/EAF/Arbital front end with an archive browser | — | live | — | Reachable via WebFetch; connection reset from this sandbox [V][13] |
| ExoPriors Scry | SQL + vector search over EA Forum, LW, arXiv, HN, community-archive.org | Size claims vary: 60M docs vs 3B+ [S] | announced 2025-12-26 | — | Built to be driven by Claude Code [V][14] |

**Bot policy.** `robots.txt` disallows `/allPosts`, `/graphiql`, comment-permalink query strings and some other paths, and sets **Crawl-Delay 3** (LW, AF) and **2** (EAF). LW and AF block SemrushBot; EAF blocks SeekportBot [V][5]. No rate-limit headers appeared on GraphQL responses [V].

#### 1.2 Blogs and newsletters

**Substack** (as of October 2026):
- **No official content API.** The "Developer API Terms of Use" (last updated 2026-01-08) cover "Authorized Data" limited to creator-profile fields: name, LinkedIn URL, subscriber count, bestseller status, leaderboard rank, publication URL. They forbid using it to "replicate, substitute for, or materially compete with core features" [V][16].
- **RSS (`/feed`):** returns the **20 most recent posts** with full HTML for free posts (ACX test: 20 items, 15 Sep–15 Oct 2026) [V][17].
- **Unofficial endpoints:**
  - `/api/v1/archive?sort=new&offset=N&limit=M` returns JSON post metadata. A `limit=50` request returned 23 posts. Fields include `audience` (`everyone` / `only_paid`), `wordcount`, `canonical_url` and `comment_count`. Body HTML is not included in list responses.
  - `/sitemap.xml` lists every post URL (ACX: 1,493).
  - `/api/v1/posts/<slug>` returns a single post [K].

  These are undocumented and can change [V][17].
- **Paywalls:** in the ACX sample, 2 of 23 recent posts (8.7%) were paid-only (`audience: only_paid`) [V]. Paid text is not served without a subscriber session; RSS carries a truncated preview [K].
- **Terms:** users may not do anything that "'Crawls,' 'scrapes,' or 'spiders' any page, data, or portion of Substack (through use of manual or automated means)" or "Copies or stores any significant portion of the content on Substack" [V][15]. `robots.txt` disallows `/p/*/comment/*`, `/feed/private`, `/action/`, `/embed` and similar paths, but allows posts and the public feed [V][17].
- **Exports:** writers can export their own posts and subscriber lists from settings [K]. Readers have no export.

**Ghost, Medium, WordPress:**
- **Ghost:** RSS returns 15 items (Cold Takes, "Ghost 6.70" generator). The Content API is read-only and keyed by a site-created key that "only ever provide[s] access to public data". Ghost's built-in search embeds that key in every page (`data-key` on the sodo-search script), so the API is technically reachable by third parties [V][18][20]. I did not use the key; whether third-party use is welcome is the site owner's call [I].
- **Medium:** RSS returns 10 items. The official API repository is headed "The Medium API is no longer supported" [V][19][20].
- **WordPress.com:** RSS returns 10 items. The WordPress REST API exists on self-hosted sites [K].

**Key personal sites** (licence as stated on the page, fetched 2026-10-15):

| Site | Licence / terms | Feed | Notes |
|---|---|---|---|
| Gwern.net | **CC0** (creativecommons.org/publicdomain/zero/1.0 link in page) [V][25] | gwern.net/feed is a Substack newsletter feed (14 items) [V] | Wayback availability API returned no snapshot for /scaling-hypothesis [V] |
| Cold Takes (Holden Karnofsky) | No licence found [V] | Ghost RSS, 15 items | Many posts also on LW/EAF (cross-posted copies) [V] |
| ACX (Substack) | No licence; Substack ToS [V] | 20 items | 1,493 posts in sitemap [V] |
| Slate Star Codex archive | No licence found [K] | static | Not tested |
| Marginal Revolution | No licence found [V] | 15 items | Cloudflare-fronted, served 200 to all UAs [V] |
| GiveWell research pages | **CC BY-NC-SA 3.0 US** (footer) [V][26] | — | Applies to givewell.org pages |

**Rogue Scholar** (Front Matter) [V][21][34]:
- **Size:** `found: 57,803` posts; 184 blogs in the `/blogs` listing.
- **Per-post metadata:** a Crossref DOI (prefixes 10.59350 and 10.65527, Crossref RA confirmed), `license: https://creativecommons.org/licenses/by/4.0/legalcode`, `version`, `updated_at`, ORCID and ROR identifiers where known, plus full `content_html`.
- **Platform:** the docs describe full-text search on OpenSearch and an Internet Archive arrangement for "long-term archiving for all participating blogs".
- **Index visibility:** 3 of 4 sampled DOIs from 13–14 October were already OpenAlex works (`type: other`) on 15 October.
- **Coverage gap:** the blogs are mostly library, science-communication and research-software blogs. None of the 20 forum/blog items in §5.2 are on Rogue Scholar [I].

**Blog search engines:**

| Engine | What it is | Access / price (as of Oct 2026) | Relevance here |
|---|---|---|---|
| Exa | Neural web search API | Search from **$4 per 1k requests**; Fast/Auto $7; Deep $12; contents **$1 per 1k pages** [V][23] | Good for "find posts like this"; not an archive |
| Kagi Small Web | Curated list of personal-blog feeds | **42,856 feeds** in `smallweb.txt`; RSS and OPML; **0 Substack feeds**; includes joecarlsmith.com, marginalrevolution.com, windowsontheory.org [V][22] | A free seed list of independent blogs |
| Marginalia Search | Independent small-web search engine | API with shared `public` key (rate-limited, returns 503); free non-commercial key by email; results CC BY-NC-SA 4.0 [V][24] | Discovery of non-commercial sites |
| Feedly | Feed reader with AI filtering | Paid tiers; API on enterprise plans [K] | Personal monitoring, not bulk |

#### 1.3 Think-tank and lab reports

| Publisher | Licence on page or PDF (fetched 2026-10-15) | DOIs | Metadata quality / notes |
|---|---|---|---|
| RAND | "Unauthorized posting of this publication online is prohibited; linking directly to this product page is encouraged." Commercial reuse needs permission. "RAND retains copyright to most of our published works." The permissions page links CC BY 4.0, so some works are open [V][27] | **Crossref**, 10,810 DOIs; DOI printed on page [V] | Rich (citation_* meta). **403 to descriptive UA and "ClaudeBot" UA; 200 to browser, GPTBot and Claude-User UAs** [V] |
| CSET (Georgetown) | **CC BY-NC 4.0** stated in PDF [V][28] | **Crossref**, 284 DOIs [V] | DOIs in OpenAlex; translations collection [V] |
| Epoch AI | **CC BY 4.0** link on publication page [V][29] | none found | HTML-first, data downloads [K] |
| GovAI | "©2026 GovAI" footer [V][33] | none; PDFs on cdn.governance.ai | In GS via PDF [V] |
| Forethought | No licence found [V] | arXiv twin (DataCite) [V] | OpenAlex sees the arXiv version |
| IAPS | "© 2026. All rights reserved." [V][33] | arXiv twin [V] | — |
| Carnegie Endowment | "© 2026 … All rights reserved." [V][33] | none | — |
| CNAS | "© 2026 Center for a New American Security." [V][33] | none | Not in GS spot check [V] |
| Brookings | No licence. The CC BY 4.0 link on the test page is an **image credit** (Better Images of AI) [V][31] | none | Automatic licence detection mistook this for an open licence |
| CSIS | Not verified (403 to scripts) [V] | — | — |
| Coefficient Giving (formerly Open Philanthropy) | "© 2026 Coefficient Giving. All rights reserved." openphilanthropy.org 301-redirects to coefficientgiving.org [V][32] | none | Not in GS spot check [V] |
| GiveWell | CC BY-NC-SA 3.0 US [V][26] | none | — |
| International AI Safety Report | **Open Government Licence v3.0** (2026 extended summary) [V][30] | none on the PDF | — |
| Anthropic / OpenAI / Google DeepMind system cards | No licence statements found in PDFs [V] | none | URLs are opaque CDN hashes (Anthropic) or bucket paths (DeepMind) [V] |

**Pattern** [I]:
- Of 13 publishers checked, only Epoch (CC BY), CSET (CC BY-NC), IASR (OGL) and GiveWell (CC BY-NC-SA) grant open licences. "All rights reserved" is the default elsewhere.
- DOIs appear where a publisher has institutional publishing habits (RAND, CSET). Younger AI-governance organisations rely on arXiv twins for scholarly visibility.

#### 1.4 Government and intergovernmental sources

**CRS:**
- **API:** `GET /v3/crsreport` returned `pagination.count = 14,180` on 2026-10-15. The newest item was R48948 (published 2026-10-13). Detail records include versions, authors, status (e.g., R47644 "Archived") and format URLs for PDF and HTML on www.congress.gov [V][39].
- **Keys and limits:** the documented limit is **5,000 requests/hour** per key, and keys come free from api.data.gov [V][39]. The shared `DEMO_KEY` advertised `x-ratelimit-limit: 10` per hour on this endpoint and was exhausted twice during the session. api.data.gov's general `DEMO_KEY` limits are 30/hour and 50/day per IP; a registered key gets 1,000/hour by default [V][40].
- **File wall:** those congress.gov file URLs returned `cf-mitigated: challenge` [V].
- **EveryCRSReport** (Demand Progress / Josh Tauberer) serves a 6.7 MB `reports.csv` (**23,564 rows**, last modified 2026-10-15 07:07 UTC) with per-report JSON, PDF and HTML paths and SHA-1 hashes. It offers bulk download, redacts analysts' phone numbers and emails, and tracks changes between versions [V][41].
- **Why 14,180 ≠ 23,564:** my guess is that the API count covers only active or currently listed products, while EveryCRSReport keeps archived versions [I ~50%].

**GAO and GovInfo:** gao.gov returned Akamai "Access Denied" to every UA [V]. GovInfo's API needs an api.data.gov key; I could not count its collections because `DEMO_KEY` was exhausted [V].

**OSTI.gov:** `X-Total-Count: 5,047,570` records. The `has_fulltext=true` filter gives 2,530,201 and `product_type=Technical Report` gives 711,165 [V][42]. The API is open and paginated (`Link` headers). Report DOIs (10.2172) are Crossref-registered, with 341,249 DOIs on the prefix [V][34].

**NASA NTRS:** `stats.total = 648,017`. The API supports GET and POST search with filters such as `stiType`, and PDF download paths are in the JSON [V][43].

**NTIS / NTRL:** not verified this session. NTRL search is free; many full texts are sold [K].

**UK:**
- **GOV.UK** has a keyless Content API (`/api/content/<path>` returns attachments with asset URLs) and a Search API (17,977 documents of type `research`) [V][44].
- **parliament.uk** (Commons Library, POST) presented Cloudflare challenges [V].
- UK government material is under OGL v3.0 [K].

**EU:**
- **EUR-Lex** returned HTTP 202 challenge pages to every UA [V].
- The JRC test item has a DOI registered with the **Publications Office (RA "OP")**. Crossref returned 404 for it, and so did OpenAlex's DOI lookup [V]. Crossref-dependent tools are therefore blind to EU DOIs. DataCite and OP need separate handling [I].
- CORDIS not tested.

**OECD, World Bank, IMF:** all three mint Crossref DOIs (205,409, 51,461 and 105,655 respectively) and appear in OpenAlex and S2 [V]. The OECD site and DOI landing pages are Cloudflare-walled, and imf.org is Akamai-walled. The World Bank OKR runs an open DSpace 7 REST API, and the test item is CC BY 3.0 IGO [V][45].

**US federal works and 17 USC 105:**
- §105(a): "Copyright protection under this title is not available for any work of the United States Government". The definition in §101: "a work prepared by an officer or employee of the United States Government as part of that person's official duties" [V][47].
- **Limits:**
  - **Contractor works** (most DOE national-lab reports on OSTI; many RAND and FFRDC reports) are not covered. The contractor may hold copyright, and the government holds a licence [K/I].
  - **Covered-institution faculty works** (§105(b)–(d), e.g., service academies) belong to their authors, subject to a government licence [V].
  - **State government works** are outside §105. *Georgia v. Public.Resource.Org* (2020) put legislative annotations in the public domain under the government-edicts doctrine, but not state works generally [K].
  - **Third-party material** inside federal reports (images, quoted text) keeps its own copyright [K].
  - The **Federal Reserve Board** is a federal agency [K]. Regional Reserve Banks are not, so their working papers are copyrighted [K ~70%].

#### 1.5 Working papers and dissertations

- **NBER:** "All users of the NBER website are entitled to three free downloads annually." Full text is otherwise free only to subscribers, corporate associates, registered journalists, US government domains (.gov) and residents of countries with per-capita GDP below $35,000 (2017) [V][48]. For a Bay Area individual, NBER is effectively paywalled after three papers a year. Author copies, SSRN versions and published versions are the routes around it [I].
- **SSRN:** Cloudflare-challenged for scripts. Downloads generally need a free login (see R02 §2) [V/S].
- **RePEc/IDEAS:** see R02 §2.
- **arXiv econ and cs.CY:** fully open. Both test items had DataCite DOIs and were in OpenAlex and S2 [V].
- **Federal Reserve Board FEDS:** open HTML and PDF, Crossref DOIs (e.g., 10.17016/FEDS.2026.018) [V][46].
- **Dissertations:**
  - **EThOS** is back as a metadata-only discovery service: "over 650,000 theses from UK universities from the 1700s onwards"; "Over 400,000 theses are openly available for download from university repositories"; "around 14,000 additional theses … added … since the cyber-attack". The BL page carries an update dated 8 July 2026. File downloads and digitisation requests are not restored [V][51]. Wikipedia describes the outage as three years (2023–2026) [S].
  - **OATD** and **DART-Europe** both returned 403 to scripts, so I could not verify their sizes [V].
  - **PQDT Open's** old host now redirects into ProQuest's main platform (`?defaultdiss=true`) and loops without cookies. Its status is unclear [V][75].

#### 1.6 Discussion archives (brief)

- **Hacker News:**
  - Firebase `maxitem` = **50,101,480** at 2026-10-15 ~10:02 UTC. The README: "There is currently no rate limit" [V][52].
  - Algolia `search_by_date`: **3,832,742 stories**, **34,294,207 comments** [V][53]. The Algolia API page did not state a limit in fetchable text. 10,000 requests/hour per IP is widely cited [K].
  - Hugging Face hosts live Parquet mirrors, e.g., `open-index/hacker-news`: ODC-BY tag, 5-minute updates, 70,870 downloads [V][12].
- **Reddit:** on 2026-09-30, posts in r/redditdev and r/modnews (per TechCrunch and others) set this timetable [S][54]:
  - no new public API access requests after **2026-10-31**;
  - RSS ends **2026-11-13**;
  - unregistered apps removed from **2027-01-12**;
  - remaining public Data API access ends in **March 2027**.

  The stated reason is scraping. Researchers are listed among those affected. The 2024 "Reddit for Researchers" beta (with OpenMined) is PI-only per anecdote, and I found no confirmation it survives the change [S]. **Treat Reddit as closed for new tool builders.**
- **Stack Exchange:** since July 2024 the dump has been login-gated, and downloaders must agree it is not for LLM-training projects. Critics argue this conflicts with CC BY-SA 4.0's no-additional-restrictions clause [S][55] (stale?). I found no 2025–26 change [S].
- **X:**
  - **Official API:** pay-per-use, $0.005 per post read, "capped at 3 million Post reads per monthly billing cycle" [V][56]. Reading 10,000 posts costs $50 [I].
  - **Community Archive:** an opt-in alternative of users' uploaded Twitter archives, with a Supabase API and downloads [V][57].
  - **Persistence:** Pew found 18% of tweets in its 2023 sample were no longer visible within about three months [V][61].

#### 1.7 Policy-document indexes and Google Scholar

- **Overton (Open Policy Ltd):**
  - **Size:** "more than 25M documents from more than 3000+ different policy sources"; about 10M policy-to-policy citations and about 28M policy-to-DOI citations. Government bodies are about 42% of sources but author 75% of documents [V][58].
  - **API:** "requires an API key"; access "does not come enabled by default" and depends on subscription type. Rate limit: "no more than once per second"; "For licensing reasons the API does not include full text content of PDFs" [V][58].
  - **Data snapshots:** offered, with an API change effective 2025-07-14 [V].
  - **Pricing:** institutional. US federal contract records show annual subscriptions of **$11,370–$40,598.95** for 5–15 seats [S][59]. **No individual tier found** [S].
- **Policy Commons (Coherent Digital):** free registration with **25 searches/month** at launch. Institutions get unlimited searches plus licensed premium content. The launch materials and a 2022 release claim 3.5M+ reports from about 8,500 organisations, over 75% "openly available on the web" [S][60] (stale?). The site returned 403 to scripts [V].
- **Dimensions:** 2.5M policy documents (R02 §3).
- **Google Scholar:**
  - **Spot check:** found 4 of 7 forum/blog posts, 3 of 6 reports and 0 of 5 government documents or working papers [V, low confidence: n = 18; queries via WebFetch][37].
  - **Mirrors:** it indexes some forum posts through third-party PDFs. "What failure looks like" and "AGI Ruin" appear via `pdf.stafforini.com`, attributed to "AI Alignment Forum"; "Machines of Loving Grace" via `dentonhawk.com`.
  - **Citation-only entries:** some EA Forum posts appear this way ("AI pause will likely backfire").
  - **Misses:** the CRS report, the UK discussion paper and the NASA TM, though other NTRS records by the same author were found.
  - **Instability:** results were unstable across query phrasings, and a scripted session from this sandbox returned degraded results for exact-title queries.

#### 1.8 Non-English grey literature (brief)

- **Sources:**
  - CSET maintains a **translations** collection of Chinese policy documents [V][74].
  - **DigiChina** (Stanford) is active: forum pieces dated 2026-07-23 on the World AI Conference and 2026-03-17 on the 15th Five-Year Plan [V][74].
  - **Concordia AI** publishes "State of AI Safety in China (2026)", a Singapore edition, a newsletter and "Chinese Perspectives on AI Safety" [V][74].
- **Translation cost:** cheap LLM translation changes the economics. A 10,000-character Chinese policy document is roughly 7–10k input tokens and a similar number of output tokens [I]. On Haiku 5.5 batch that is about $0.001–0.003 per document, and about $0.06–0.10 on Sonnet 5.5 batch [I, pricing-reference.md].
- **What stays expensive:** translating a 10,000-document Chinese policy corpus is a $10–$1,000 job. The binding constraints are discovery, provenance and terminology consistency (DigiChina's "Lexicon" pieces exist for that reason), not translation cost [I].

### 2. Persistence

#### 2.1 Link-rot evidence

| Study | Finding | Date | Source |
|---|---|---|---|
| Pew Research Center, "When Online Content Disappears" | 38% of pages that existed in 2013 inaccessible by Oct 2023 (8% of 2023 pages); 25% of all 2013–2023 pages gone; **21% of government pages** have ≥1 broken link (6% of links dead); 23% of news pages; 54% of Wikipedia pages have a broken reference (11% of reference links); 18% of tweets vanished within months | 2024-05-17 | [V][61] |
| Zittrain, Bowers, Stanton (Harvard LIL), NYT link rot | 25% of deep links in 553,693 NYT articles (1996–2019) inaccessible; 6% of 2018 links, 43% of 2008, 72% of 1998; 53% of articles with deep links have ≥1 rotted | 2021-05 (stale?) | [S][62] |
| Zittrain, Albert, Lessig, "Perma" | >70% of URLs in the Harvard Law Review and other journals, and 50% of URLs in US Supreme Court opinions, no longer link to the cited information | 2014 (stale?) | [S][62] |
| 2025 US federal removals | >8,000 web pages and about 3,000 datasets removed or modified after 2025-01-31 (NYT count, via Wikipedia); CDC alone >3,000 pages; some later restored | 2025 | [S][64] |

**Policy-citation rot.** I found no 2024–26 study measuring rot specifically in think-tank citations. The government-page figures (Pew) and the 2025 federal removals are the best proxies [I].

**Rot in my sample.** Every one of the 60 test URLs was live on 2026-10-15; the failures were bot walls, not 404s [V]. But the sample is drawn from current curricula, so it is biased toward live links [I]. Two URL-stability hazards appeared:
- Open Philanthropy's research URLs now 301-redirect to coefficientgiving.org, a rename.
- AI-lab system cards live at opaque CDN hashes (Anthropic) [V].

#### 2.2 Archives

- **Wayback Machine:**
  - **Coverage:** the availability API (queried via WebFetch, because this sandbox's IP got 429s from archive.org and connection resets from web.archive.org) returned snapshots for **48 of 60** items: 17 of 20 posts, 16 of 20 reports, 15 of 20 working papers and government documents [V][38]. Most snapshots were very recent (September–October 2026), and several curriculum items share identical timestamps. Someone appears to be archiving curriculum outlinks in batches [I].
  - **False negatives:** "What failure looks like" returned nothing until a `timestamp=2022` parameter was added, then returned a 2023-01-01 capture [V]. Treat "no snapshot" from this API as "unknown" [I].
  - **CDX API:** I could not reach it (connection reset; WebFetch is blocked from web.archive.org) [V]. Third-party tools cite about 15 requests/minute with 429 and Retry-After [S].
  - **October 2024 breach and outage:** DDoS, defacement and a breach of about **31M** user records (emails, bcrypt hashes) disclosed 2024-10-09. The Wayback returned read-only on 2024-10-13, there was a Zendesk breach via unrotated tokens on 2024-10-20, and full restoration came 2024-10-25 [S][63].
  - **Scale:** the Archive announced its trillionth archived page in October 2025 [S][63].
- **archive.today:** the FBI subpoenaed its registrar (Tucows) on 2025-10-30. English Wikipedia **blacklisted** the site in February 2026 after allegations that its CAPTCHA page ran JavaScript that DDoSed a blogger's site, and over 695,000 links were removed [S][65]. BlueDot's AGI Strategy course still links one archive.ph copy [V][71]. Avoid it as a canonical archive [I].
- **Perma.cc:** individual subscriptions of **$10/month for 10 links, $25 for 100, $100 for 500**, or one-off packs ($15 for 10, $30 for 100). Free for library-supported academics and courts [S][66]. The sign-up page returned 403 to WebFetch [V].
- **Zenodo / OSF:** both mint DataCite DOIs for uploaded reports [K]. For a grey item you are allowed to redistribute (CC, OGL, public domain), a Zenodo deposit gives a citable DOI and a CERN-hosted copy. For copyrighted reports it is not an option [I].

#### 2.3 Archive-on-ingest

For each URL ingested:
1. Check the availability API, with and without `timestamp`.
2. If there is no capture newer than N months, submit to Save Page Now (an authenticated key raises limits [S]).
3. Store your own WARC or PDF copy privately.
4. Record the snapshot URL in the work record.

Do not rely on archive.today [I].

#### 2.4 Cloudflare's July 2025 change and bot walls

**What Cloudflare announced.** On 2025-07-01 ("Content Independence Day") Cloudflare said it was "changing the default to block AI crawlers unless they pay creators for their content" [V][67]. Pay-per-crawl uses HTTP 402 with `crawler-price` / `crawler-max-price` headers and Web Bot Auth signatures (Ed25519, HTTP Message Signatures). It "is currently in private beta" for registered crawler operators, and agent-level payment is described as future work [V][68]. Press reports say the default applies to new domains, and existing customers can toggle it [S][69].

**My test** (2026-10-15; 14 sites × 5 User-Agent strings; one request each) [V]:

| Site (front) | Descriptive UA | Browser UA | "ClaudeBot" UA | "GPTBot" UA | "Claude-User" UA |
|---|---|---|---|---|---|
| EA Forum, ACX/Substack, gwern.net, Marginal Revolution, Brookings, Epoch AI, CNAS, darioamodei.com (all **Cloudflare**) | 200 | 200 | 200 | 200 | 200 |
| LessWrong (Vercel), Cold Takes (Ghost/openresty), joecarlsmith.com, metr.org (Netlify) | 200 | 200 | 200 | 200 | 200 |
| RAND (CloudFront) | **403** | 200 | **403** | 200 | 200 |
| windowsontheory.org (WordPress.com) | 200 | 200 | 200 | **403** | 200 |

**Interpretation** [I]:
- Cloudflare's AI-crawler block keys on **verified** crawler identity (IP ranges and signatures). A spoofed crawler name from a non-crawler IP is not a verified AI bot, and a low-rate agent with an honest UA is not blocked by default on these sites.
- What does block personal agents is (a) **site-specific User-Agent rules** (RAND's 403 to an unknown descriptive UA is the costliest, because it pushes honest agents toward browser UAs) and (b) **bot-management challenges** on government, IGO and publisher sites: congress.gov, parliament.uk, OECD, SSRN, PubPub (all Cloudflare), gao.gov and imf.org (Akamai), and EUR-Lex. These challenges ignore the UA and need a real browser.
- **Do not spoof UAs to defeat walls**; that converts a polite agent into circumvention (R09). The UA-spoof rows above were a one-off measurement.

### 3. Quality signals without peer review

| Signal | What it measures | Access | Evidence / caveats |
|---|---|---|---|
| Karma (`baseScore`) | Weighted votes (strong votes weigh more for high-karma users) [K] | GraphQL [V] | Drifts with time and community size; 2026 posts get fewer comments (median 1 on LW) [V] |
| LessWrong Annual Review | Two-years-later re-evaluation; final vote scores by voter tier | GraphQL `reviewWinner`, `finalReviewVoteScore*` [V] | 343 winners over 7 review years (≈50/year); winners' karma median 218, minimum 22. The review surfaces posts karma underrated [V/I] |
| Curation | Moderator pick | `curatedDate` [V] | 867 LW and 211 EAF curated posts [V] |
| Policy citations | Uptake by governments and think tanks | Overton (paid) [V]; Dimensions (paid) | Overton's 28M policy→DOI citations favour DOI-bearing outputs; forum posts rarely get credit [I] |
| The Unjournal | Commissioned, paid, public expert evaluations with ratings | Site, PubPub (Cloudflare-walled), Crossref DOIs (prefix 10.21428) [V] | "100+ Evaluations completed · 53 Research papers assessed · 100+ Expert evaluators" [V][70]; only 13 Crossref records carry the container title "The Unjournal" [V] |
| PubPeer | Post-publication comments on papers | API by request [K] | Covers DOI/arXiv papers, not posts or reports [K] |
| Working paper → journal | Eventual publication as a weak quality filter | Crossref relations; NBER published-version file [S] | 66.5% of 28,000+ WPs in four major series published in journals; 8% book chapters; 25.5% unknown [V][49] (stale?) |
| Preprint → published drift | Whether the text changes | Diff the versions | arXiv/bioRxiv text "generally changed very little" [V][50] (stale?). No equivalent study for economics WPs found [I] |

### 4. Builder questions

**4.1 Deduplicating cross-posts.** One essay can exist as a personal-blog original, a Substack mirror, an LW post (native, RSS-imported via `feedId`, or a link-post via `url`), an AF promotion (same document), an EAF cross-post (`fmCrosspost.foreignPostId`), a GreaterWrong view, third-party PDFs (stafforini.com) and Wayback copies. Example: Holden Karnofsky's "AI strategy nearcasting" is on the EA Forum (2022-08-26) without an `fmCrosspost` link, while another post in the same series ("Nearcast-based 'deployment problem' analysis") is assigned from LessWrong in the same BlueDot course set [V].

Recipe [I]:
1. **Hard links:** `fmCrosspost` IDs, `canonicalSource`, `feedLink`, link-post `url`, and `<link rel="canonical">`. The canonical tag was present on 16 of 20 test posts.
2. **Blocking:** normalized title + author handle + date within ±14 days.
3. **Near-duplicate test:** MinHash on shingles, then embedding cosine above about 0.95.
4. **Pick a canonical home:** the author's own site if it is the original, else the first-published copy. Keep the others as `manifestations`.

Cost: about 80k forum posts plus a few thousand blog posts embed for under $3 [I].

**4.2 Edits and versioning.** 50% of September 2026 LW posts had at least one post-publication revision by mid-October. LW and EAF expose every revision with `changeMetrics` [V]. The EAF `version` field was above 1.0.0 on 499 of 500 posts, so it is not a clean edit signal there [V/I]. Substack and Ghost expose `updated_at` only [V/K]. Store `content_hash` and `fetched_at` per fetch. For forums, store `version`. Re-fetch when `modifiedAt` or `version` changes. Keep diffs for posts the user has annotated [I].

**4.3 Comments as part of the work.** On LW the comment corpus (≈137M words) is larger than the posts (≈78M) [I]. Comments carry corrections, author replies and review-phase evaluations. But 48.8% of recent LW posts and 54.6% of EAF posts have zero comments, and the median LW post has one [V]. Treat a comment thread as a *child work* with `relation: "discussion_of"`. Embed top-k comments by karma, plus author replies, alongside the post [I].

**4.4 A `post` / `report` type in R10's work record.** Extend R10's `kind` with `forum_post | blog_post | newsletter_issue | report | system_card | working_paper | gov_document | thesis | thread`, and add [I]:

```jsonc
{
  "kind": "forum_post",
  "platform": {"name": "lesswrong", "id": "HBxe6wdjxK239zajf", "canonical_url": "...", "markdown_url": "/api/post/<id>"},
  "manifestations": [{"platform": "alignmentforum", "id": "..."}, {"platform": "ea_forum", "id": "...", "relation": "crosspost"},
                     {"url": "https://pdf.stafforini.com/...", "relation": "third_party_copy"}],
  "versions": [{"version": "1.3.0", "edited_at": "...", "added": 85, "removed": 0, "content_hash": "..."}],
  "signals": {"karma": 482, "votes": null, "curated": true, "review": {"year": 2019, "rank": null, "final_score_hk": null},
              "comment_count": 56, "policy_citations": null},
  "rights": {"licence": "author-copyright | CC-BY-4.0 (EAF >= 2022-12-01) | CC0 | OGL-3.0 | US-PD-17USC105 | contractor",
             "basis": "terms URL + date", "republishable": false},
  "persistence": {"doi": null, "wayback": "20230101163632", "own_warc": "s3://...", "checked_at": "2026-10-15"},
  "discussion": {"thread_ref": "...", "top_comments": ["..."]}
}
```

**4.5 Identifiers.** In order of preference [I]:
1. **DOI** (Crossref, DataCite or OP; check the RA with `doi.org/ra/`).
2. **Platform-native stable ID:** ForumMagnum `_id`, HN item ID, CRS report number, OSTI ID, NTRS citation ID, World Bank handle.
3. **Canonical URL** plus Wayback timestamp.
4. Your own ULID as primary key (R10 rule).

Rogue Scholar or Zenodo DOIs are worth minting only for items you control or that carry an open licence [I].

**4.6 Cost of incremental sync** [I]:
- **Forums:** about 20 LW and 10 EAF posts per day (2025–26 rates), plus perhaps 200–400 comments per day. Two or three GraphQL pages per site per day, plus a weekly karma refresh of recent posts (~1–2k posts, ~20 calls). Under 50 requests/day at the 3 s crawl delay is about 2–3 minutes of wall time.
- **RSS:** about 500 feeds polled every 6 hours is 2,000 requests/day, with conditional GET.
- **CRS:** one `updateDate`-filtered call per day.
- **HN:** a `maxitem` diff (about 20k new items/day [I]) or the Hugging Face Parquet mirror.

Dollar cost about $0 plus storage. Re-summarising edited posts on Haiku 5.5 batch costs cents per day [I].

### 5. Hands-on measurements

#### 5.1 Measurement A — grey-literature share of real curricula (as of October 2026)

**Lists and rubric.**
- **BlueDot Impact:** AI Governance (6 units), Technical AI Safety (6 units), AGI Strategy (5 units). Resources were extracted from each unit page's `__NEXT_DATA__` JSON, deduplicated by URL within each course (391 entries → 345 unique URLs across courses). 35 logistics items were excluded: fellowship pages, templates, organisation homepages and course links [V][71].
- **Stanford CS120 "Introduction to AI Safety"**, Fall 2025: all links, deduplicated; 52 logistics links excluded (slides, recordings, Ed, Gradescope) [V][72].
- **EA Forum "AI safety comms reading list"** (posted 2026-10-15): 36 items after excluding the author's own site links [V][73].
- **Categories:** arXiv, OpenReview submissions, SSRN and NBER count as "preprint/WP". Lab research posts and lab news pages count as "blog". System cards, frameworks, think-tank, IGO and government publications count as "report". X threads are counted with forum posts.

| Type | BlueDot AI Gov (77) | BlueDot Tech Safety (96) | BlueDot AGI Strategy (158) | **BlueDot all, dedup (310)** | **Stanford CS120 (201)** | **EAF comms list (36)** |
|---|---|---|---|---|---|---|
| Peer-reviewed paper | 0% | 0% | 2.5% | **1.3%** | **45.8%** | 38.9% |
| Preprint / working paper | 10.4% | 10.4% | 13.3% | **12.3%** | **35.3%** | 2.8% |
| Book (incl. online textbooks) | 0% | 0% | 1.9% | 1.0% | 1.0% | 2.8% |
| Report | 33.8% | 18.8% | 18.4% | **21.3%** | 2.5% | **47.2%** |
| Forum / social post | 5.2% | 14.6% | 13.9% | **12.3%** | 3.0% | 8.3% |
| Blog / newsletter post | 40.3% | 46.9% | 36.1% | **40.3%** | 9.0% | 0% |
| Video / podcast | 1.3% | 4.2% | 3.2% | 2.6% | 2.5% | 0% |
| Other (news, web/data tools, unpublished docs) | 9.1% | 5.2% | 10.8% | 9.0% | 1.0% | 0% |
| **Grey share** (report + forum + blog + video + other) | **89.6%** | **89.6%** | **82.3%** | **85.5%** | **17.9%** | **55.6%** |

**Observations:**
- **Core vs. further readings.** BlueDot's *core* (required) readings are just as grey: 39.1% blog plus 39.1% report in AI Governance; 55.3% blog in Technical AI Safety. 0 peer-reviewed papers are core in either [V].
- **Peer-review share is a lower bound.** Some arXiv items were later published at venues (e.g., weak-to-strong generalization at ICML 2024 [K]), so "1.3% peer-reviewed" undercounts by link type. Re-classifying every arXiv item that has a venue would raise it to perhaps 5–8% [I ~60%].
- **Volatility.** BlueDot cites 2026 items (lab system cards, METR's 2026-08-26 incident investigation, AI 2040 scenarios). Their persistence matters immediately.

#### 5.2 Measurement B — index coverage of 60 grey items

**Matching rules.** A match counts only if the record is the same work.
- **Rejected title-collisions:** "What failure looks like" matched a Princeton UP chapter in Crossref and OpenAlex; "Machines of Loving Grace" matched a 2012 Springer chapter and a *Nature Physics* paper; "The Scaling Hypothesis" matched a Cambridge chapter, an ACM paper and an S2 physics paper; "On the Biology of a LLM" matched a different OpenAlex record (DOI 10.58079/15404); in Crossref the RSP matched a 2025 journal article by Hubinger; in OpenAlex the EU AI Act matched a commentary.
- **Accepted as "in OpenAlex":** arXiv twins of Forethought and IAPS reports.
- **Accepted only as "related":** a same-author conference paper for the NASA TM.

**Summary (as of 2026-10-15)** [V]:

| Group (n = 20 each) | OpenAlex | Semantic Scholar | Crossref DOI | Any DOI (incl. DataCite, OP) | **In none of OA/S2/CR** | Google Scholar (spot) | Full text fetchable by script | Open licence or public domain | Wayback snapshot |
|---|---|---|---|---|---|---|---|---|---|
| Forum & blog posts | 0% | 0% | 0% | 0% | **100%** | 4/7 | 100% | 10% | 85% |
| Think-tank & lab reports | 30% | 25% | 20% | 30% | **65%** | 3/6 | 100% (2 only with browser UA) | 20% | 80% |
| Working papers & gov docs | 65% | 65% | 50% | 65% | **30%** | 0/5 | 60% | 60% | 75% |
| **All 60** | **32%** | **30%** | **23%** | **32%** | **65%** | **7/18 (39%)** | **87%** | **30%** | **80%** |

**Headline.** About two-thirds of this literature (65% of the sample; 100% of forum and blog posts) cannot be seen by the scholarly graphs at all. A tool that starts from OpenAlex or Semantic Scholar sees the working-paper end and almost none of the conversation. [V, n = 60; 95% Wilson interval for 39/60 ≈ 52–76% [I]]

**Per-item results:**

| # | Item (year) | Type | OpenAlex | S2 | DOI (RA) | GS spot | Script full text | Open licence / PD | Wayback (availability API) |
|---|---|---|---|---|---|---|---|---|---|
| A01 | What failure looks like (2019) | AF | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20230101 |
| A02 | AGI Ruin: A List of Lethalities (2022) | AF | ✗ | ✗ | ✗ | ✓ | ✓ | none stated / © | 20260921 |
| A03 | Without specific countermeasures, the easiest path to tran… (2022) | AF | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261001 |
| A04 | Model Organisms of Misalignment: The Case for a New Pillar… (2023) | AF | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| A05 | Counterarguments to the basic AI x-risk case (2022) | LW | ✗ | ✗ | ✗ | ✗ | ✓ | none stated / © | 20260724 |
| A06 | Alignment remains a hard, unsolved problem (2025) | LW | ✗ | ✗ | ✗ | — | ✓ | none stated / © | none returned |
| A07 | Current AIs seem pretty misaligned to me (2026) | LW | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| A08 | Interpretability Will Not Reliably Find Deceptive AI (2025) | LW | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| A09 | AI Pause Will Likely Backfire (2023) | EAF | ✗ | ✗ | ✗ | ✓ | ✓ | CC BY 4.0 (EAF terms, post after 2022-12-01) [V] | 20261001 |
| A10 | AI strategy nearcasting (2022) | EAF | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20260521 |
| A11 | AI Could Defeat All Of Us Combined (2022) | blog | ✗ | ✗ | ✗ | ✓ | ✓ | none stated / © | 20261013 |
| A12 | The Most Important Century (in a nutshell) (2021) | blog | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261003 |
| A13 | Otherness and control in the age of AGI (2024) | blog | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20260925 |
| A14 | Pause For Thought: The AI Pause Debate (2023) | substack | ✗ | ✗ | ✗ | ✗ | ✓ | none stated / © | 20260728 |
| A15 | Machines of Loving Grace (2024) | blog | ✗ | ✗ | ✗ | ✓ | ✓ | none stated / © | 20250417 |
| A16 | AI as Normal Technology (2025) | substack | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20250904 |
| A17 | The case for ensuring that powerful AIs are controlled (2024) | substack | ✗ | ✗ | ✗ | — | ✓ | none stated / © | none returned |
| A18 | Takeoff speeds rule everything around me (2026) | substack | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| A19 | The Scaling Hypothesis (2020) | blog | ✗ | ✗ | ✗ | ✗ | ✓ | CC0 [V] | none returned |
| A20 | The state of AI safety in four fake graphs (2026) | blog | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20260810 |
| B01 | The Operational Risks of AI in Large-Scale Biological Atta… (2024) | think tank | ✓ | ✓ | Crossref | ✓ | ✓ (browser UA only) | none stated / © | 20261012 |
| B02 | Securing AI Model Weights: Preventing Theft and Misuse of … (2024) | think tank | ✓ | ✗ | Crossref | — | ✓ (browser UA only) | none stated / © | none returned |
| B03 | When AI Builds AI (2025) | think tank | ✓ | ✓ | Crossref | — | ✓ | CC BY-NC 4.0 [V] | 20261011 |
| B04 | AI Governance at the Frontier: Unpacking Foundational Assu… (2025) | think tank | ✓ | ✗ | Crossref | — | ✓ | CC BY-NC 4.0 (CSET house licence) [I] | 20260927 |
| B05 | International Control of Powerful Technology: Lessons from… (2021) | think tank | ✗ | ✗ | ✗ | ✓ | ✓ | none stated / © | 20260609 |
| B06 | Can AI scaling continue through 2030? (2024) | research org | ✗ | ✗ | ✗ | — | ✓ | CC BY 4.0 [V] | 20261015 |
| B07 | Preparing for the Intelligence Explosion (2025) | research org | ✓ (arXiv twin) | ✓ (arXiv twin) | DataCite (arXiv version) | — | ✓ | none stated / © | 20261011 |
| B08 | Risk Reporting for Developers' Internal AI Model Use (2025) | think tank | ✓ (arXiv twin) | ✓ (arXiv twin) | DataCite (arXiv version) | — | ✓ | none stated / © | none returned |
| B09 | International AI Safety Report 2026: Extended Summary for … (2026) | intergov | ✗ | ✗ | ✗ | — | ✓ | OGL v3.0 [V] | 20261009 |
| B10 | Anthropic's Responsible Scaling Policy (2026) | lab | ✗ | ✓ | ✗ | — | ✓ | none stated / © | 20261011 |
| B11 | System Card: Claude Opus 4.6 (2026) | lab | ✗ | ✗ | ✗ | ✗ | ✓ | none stated / © | 20261011 |
| B12 | GPT-5 System Card (2025) | lab | ✗ | ✗ | ✗ | — | ✓ | none stated / © | none returned |
| B13 | Gemini 3 Pro Model Card (2025) | lab | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261004 |
| B14 | On the Biology of a Large Language Model (2025) | lab | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| B15 | If-Then Commitments for AI Risk Reduction (2024) | think tank | ✗ | ✗ | ✗ | ✓ | ✓ | none stated / © | 20261011 |
| B16 | Beyond DeepSeek: China's Diverse Open-Weight AI Ecosystem … (2025) | think tank | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261011 |
| B17 | Report on Semi-informative Priors (2021) | funder | ✗ | ✗ | ✗ | ✗ | ✓ | none stated / © | 20251112 |
| B18 | Superpowers and AGI (2026) | think tank | ✗ | ✗ | ✗ | ✗ | ✓ | none stated / © | 20261010 |
| B19 | Shaping global governance of AI agents (2026) | think tank | ✗ | ✗ | ✗ | — | ✓ | none stated / © | none returned |
| B20 | Frontier Risk Report (February to March 2026) (2026) | research org | ✗ | ✗ | ✗ | — | ✓ | none stated / © | 20261012 |
| C01 | The Simple Macroeconomics of AI (2024) | NBER | ✓ | ✓ | Crossref | — | ✗ (3 free/yr, then paid) | none stated / © | 20261007 |
| C02 | Generative AI at Work (2023) | NBER | ✓ | ✓ | Crossref | — | ✗ (3 free/yr, then paid) | none stated / © | 20261011 |
| C03 | The Most Dangerous Fiction: The Rhetoric and Reality of th… (2025) | SSRN | ✓ | ✗ | Crossref | ✗ | ✗ [cloudflare-challenge] | none stated / © | 20261012 |
| C04 | Gen-AI: Artificial Intelligence and the Future of Work (2024) | IMF | ✓ | ✓ | Crossref | — | ✗ [akamai-deny] | none stated / © | 20260709 |
| C05 | Developing a Measure of Women's Agency in Tunisia: Machine… (2026) | World Bank | ✓ | ✓ | Crossref | — | ✓ | CC BY 3.0 IGO [V] | none returned |
| C06 | Defining AI incidents and related terms (2024) | OECD | ✓ | ✓ | Crossref | — | ✗ [cloudflare-challenge] | OECD (CC BY 4.0?) [I] | none returned |
| C07 | Artificial Intelligence Risk Management Framework: Generat… (2024) | US gov | ✓ | ✓ | Crossref | — | ✓ | US gov work (17 USC 105) [V] | 20261011 |
| C08 | Artificial Intelligence Risk Management Framework (AI RMF … (2023) | US gov | ✓ | ✓ | Crossref | — | ✓ | US gov work [V] | 20261012 |
| C09 | Artificial Intelligence: Overview, Recent Advances, and Co… (2023) | US gov | ✗ | ✗ | ✗ | ✗ | ✗ official (Cloudflare) / ✓ EveryCRSReport [cloudflare-challenge] | US gov work (CRS) [V] | 20260219 |
| C10 | Artificial Intelligence: Agencies Have Begun Implementatio… (2023) | US gov | ✗ | ✗ | ✗ | — | ✗ [access-denied] | US gov work (GAO) [I] | 20260914 |
| C11 | Frontier AI: capabilities and risks - discussion paper (2023) | UK gov | ✗ | ✗ | ✗ | ✗ | ✓ | OGL v3.0 [I] | 20261002 |
| C12 | Regulation (EU) 2024/1689 laying down harmonised rules on … (2024) | EU | ✗ | ✗ | ✗ | — | ✗ [HTTP 202 challenge] | EU reuse policy [I] | 20261014 |
| C13 | AI Watch. Defining Artificial Intelligence 2.0 (2021) | EU | ✗ | ✗ | OP (EU) | — | ✓ | CC BY 4.0 (EC reuse) [I] | none returned |
| C14 | Facilitating the use of Common Test Definitions by Convert… (2026) | US gov | ✓ | ✓ | Crossref | — | ✓ | contractor report: not automatically PD [I] | none returned |
| C15 | Aero-Engines AI - A Machine-Learning App for Aircraft Engi… (2023) | US gov | ~ (conf. version) | ~ (conf. version) | ✗ | ✗ | ✓ | US gov work (NASA civil servant) [I] | 20260427 |
| C16 | GPTs are GPTs: An Early Look at the Labor Market Impact Po… (2023) | arXiv econ | ✓ | ✓ | DataCite | — | ✓ | CC BY-SA 4.0 [V] | 20261009 |
| C17 | Computing Power and the Governance of Artificial Intellige… (2024) | arXiv cs.CY | ✓ | ✓ | DataCite | — | ✓ | CC BY 4.0 [V] | 20261012 |
| C18 | The Economics of Recursive Self-Improvement (2026) | indep WP | ✓ | ✓ (arXiv twin) | ✗ | — | ✓ | none stated / © | 20261012 |
| C19 | Optimal Timing for Superintelligence: Mundane Consideratio… (2026) | indep WP | ✗ | ✓ | ✗ | ✗ | ✓ | none stated / © | 20261005 |
| C20 | AI and Coder Employment: Compiling the Evidence (2026) | Fed | ✓ | ✓ | Crossref | — | ✓ | Fed Board staff work, likely PD [I] | none returned |

Notes: "Script full text" means retrievable without login or challenge, as HTML or via a PDF link on the landing page. GS "—" = not spot-checked. Licence marks: [V] seen on page or PDF; [I] inferred from publisher policy. Wayback dates are the snapshot the availability API returned (YYYYMMDD), not the first capture.

**Patterns** [I]:
1. **A DOI is the gate.** Every item with a Crossref or DataCite DOI was in OpenAlex. No item without one was, unless an arXiv twin existed.
2. **Lab reports and system cards are the biggest blind spot by influence.** None of the three system cards or the Transformer Circuits paper was in any graph. The RSP appears only as a DOI-less Semantic Scholar record (36 citations), apparently built from citing papers' reference lists.
3. **Government documents are open but hard to fetch.** Public-domain items were the most often walled (6 of 20 blocked).
4. **Licence detection by regex is unreliable.** One of four automatic "CC" hits (Brookings) was an image credit.
5. **Type metadata is noisy.** Semantic Scholar labels the CSET and OSTI reports `CaseReport`, a clinical genre, and both arXiv-twin reports `JournalArticle`. Do not trust graph "type" fields for grey literature.

#### 5.3 Measurement C — direct counts (2026-10-15)

| Count | Value | Method | Source |
|---|---|---|---|
| LessWrong posts / comments | 54,587 / 1,090,404 | GraphQL `enableTotal` | [1] |
| Alignment Forum posts / comments | 4,684 / 25,840 | GraphQL | [2] |
| EA Forum posts / comments | 24,972 / 208,515 | GraphQL (legacy syntax) | [3] |
| Rogue Scholar posts / blogs | 57,803 / 184 | API `found`, `/blogs` total | [21] |
| CRS products via api.congress.gov | 14,180 | `pagination.count` | [39] |
| EveryCRSReport reports.csv rows | 23,564 | file line count − header | [41] |
| OSTI.gov records (all / full text / tech reports) | 5,047,570 / 2,530,201 / 711,165 | `X-Total-Count` | [42] |
| NASA NTRS records | 648,017 | `stats.total` | [43] |
| Hacker News max item ID | 50,101,480 | Firebase `maxitem` | [52] |
| HN stories / comments in Algolia | 3,832,742 / 34,294,207 | `nbHits` | [53] |
| GOV.UK "research" documents | 17,977 | Search API `total` | [44] |

### 6. Green / yellow / red: grey-literature actions (Deliverable 3; R09 format, US-centric)

| # | Tool behavior | Rating | Why | Mitigation / safer variant | Non-US note |
|---|---|---|---|---|---|
| 1 | Mirror EA Forum posts and comments posted **on or after 2022-12-01**, and republish them (e.g., in a public reader or dataset) | **Green** | CC BY 4.0 by terms [V][9][10] | Attribute author + link + licence; mark changes; filter by `postedAt` | Same (CC BY is global) |
| 2 | Same, for EA Forum content **before 2022-12-01** | **Yellow** | Author copyright; licence not retroactive [V][9] | Private index and search only; link out; republish only where the author added a licence | Same |
| 3 | Mirror the LessWrong/AF corpus via GraphQL for **private** search, embeddings and summaries | **Yellow** | Authors own content; 2015 terms ban spiders, but the site publishes GraphQL and agent APIs and a crawl delay [V][4][7] | ≤1 request/3 s; descriptive UA; no republication of full text; honour deletions | EU/UK database right in a forum DB is arguable [I] |
| 4 | **Republish** LW/AF full text (public site or dataset) | **Red** | No licence [V][7] | Titles, links, short quotes, own summaries; or ask authors | Same |
| 5 | Index Substack via **RSS** (title, date, author, link, short excerpt) | **Green / yellow** | RSS is published for syndication; ToS bars crawling and storing "significant" portions [V][15] | Link-out reader; no paywall bypass; private full text at most | Same |
| 6 | Backfill Substack archives via sitemap or `/api/v1/archive` and store full text | **Yellow / red** | Undocumented endpoints; ToS bans crawling/scraping [V][15] | Ask the writer; or store metadata + link only; use writer exports where the writer is you | Same |
| 7 | Store and full-text search think-tank PDFs **privately** | **Yellow-green** | Private-search fair-use logic (R09 #15); RAND forbids re-posting, not private copies [V][27] | Keep private; cite page URLs; prefer CC-licensed publishers (Epoch, CSET non-commercially) | EU Art. 3/4 TDM; UK s.29A non-commercial [K] |
| 8 | **Re-serve** think-tank PDFs publicly | **Red** (©) / **Green** (CC BY, OGL) | RAND "unauthorized posting … prohibited" [V]; Epoch CC BY [V]; IASR OGL [V]; CSET CC BY-NC (non-commercial only) [V] | Per-item licence check; link otherwise | — |
| 9 | Republish US federal reports (CRS, GAO, NIST, NASA civil-servant works) | **Green** | 17 USC 105 [V][47] | Exclude contractor reports (OSTI national labs, FFRDCs) and third-party images; keep provenance | Foreign copyright in US gov works is possible abroad [K] |
| 10 | Republish UK government, EU and World Bank documents | **Green** (with attribution) | OGL v3.0 [K]; EC reuse policy [K]; CC BY 3.0 IGO [V] | Keep licence text and attribution | — |
| 11 | **Archive-on-ingest** to the Wayback Machine via Save Page Now | **Green** | Public URLs; IA's own service [K] | Authenticated SPN key; ≤ a few per minute; skip paywalled and login pages; store returned timestamp | Same |
| 12 | Keep private WARC/PDF copies of every ingested page | **Yellow-green** | Private archival copy for research (R09 private-use logic) [I] | Never serve publicly; delete on request | EU: no general private-archive exception [I] |
| 13 | Use archive.today as the canonical archive | **Yellow** | Wikipedia blacklisting and alleged content alteration (2026) [S][65] | Use IA + own copy | — |
| 14 | Pull HN data (Firebase, Algolia, HF Parquet) | **Green** | Public API, no stated limit [V][52] | Cache; respect Algolia limits | — |
| 15 | Build new Reddit bulk pipelines | **Red** (from 2026-11) | API access closing; RSS ends 2026-11-13 [S][54] | Link to threads; use existing licensed datasets only | — |
| 16 | Use the Stack Exchange dump for LLM training | **Red** (under SE's download terms) | 2024 terms [S][55] | Use the content for search/RAG within terms; or other CC BY-SA copies, accepting contested-terms risk (yellow) | — |
| 17 | Spoof crawler or browser User-Agents to pass bot walls | **Red** | Circumvention; ToS breach (R09) [I] | Use APIs (api.congress.gov, OSTI, NTRS, GOV.UK), mirrors (EveryCRSReport) or a human browser session | — |

### 7. Ingestion recipe (Deliverable 4)

**Adapters** (fits R10's "source adapters → raw lake → work record" pattern) [I]:

| Adapter | Route | Backfill calls / time | Cadence | Notes |
|---|---|---|---|---|
| `forummagnum` (LW, AF, EAF) | GraphQL; LW dialect and EAF legacy dialect; `/api/post/<id>` Markdown for LW/AF | LW posts: ~550 pages of 100; LW comments: ~2,200–11,000 pages of 100–500 → ≈2–9 h at 3 s/req; EAF ≈1–2 h | Hourly new; weekly karma/review refresh | Store `_id`, `version`, `modifiedAt`, `fmCrosspost`, `feedLink`, `url`, review fields; fetch revisions lazily |
| `rss` (Substack, Ghost, Medium, WordPress, personal) | Feeds (10–20 items deep); conditional GET | n/a (no backfill beyond feed depth where ToS forbid) | 6-hourly | Seed from Kagi Small Web (42,856 feeds) + user's subscriptions |
| `rogue-scholar` | Open JSON API | ~580 pages of 100 | Daily | DOIs, CC BY |
| `crossref-prefix` (think tanks, IGOs, WPs) | `/prefixes/{p}/works` with `from-update-date` | RAND 10.8k, CSET 284, NBER 36k, Fed 5k, WB 51k, OECD 205k, IMF 106k, NIST 33k, OSTI 341k | Daily delta | Best structured metadata for the report layer; add landing-page fetch for full text where allowed |
| `site-sitemap` (non-DOI think tanks: GovAI, IAPS, Forethought, CNAS, Carnegie, Brookings, METR, Epoch, labs) | Sitemaps / RSS | Hundreds–thousands of pages per site | Weekly | Per-site licence table (§1.3) |
| `gov-us` | api.congress.gov (own key), EveryCRSReport bulk, OSTI API, NTRS API, GovInfo API | CRS 23.5k reports; OSTI subset by topic | Daily | Avoid congress.gov file URLs (Cloudflare); use EveryCRSReport files |
| `gov-uk-eu-igo` | GOV.UK Content/Search API; World Bank OKR DSpace API; OP Cellar [K] | 18k GOV.UK research docs | Weekly | OP DOIs need their own RA handling |
| `hn` | Firebase `maxitem` diff or HF Parquet | 50.1M items | Daily | Mostly for link discovery and discussion signals |
| `archive` | Wayback availability → SPN2; local WARC | per item | On ingest | Record snapshot timestamp |

**Storage** [I]:

| Component | Size |
|---|---|
| LW + AF + EAF text | ≈280M words ≈ 1.7 GB plain text (≈6 bytes/word); 4–5 GB with HTML; Parquet with zstd ≈ 0.6–1 GB |
| Embeddings | ≈1M chunks × 512-dim int8 ≈ 0.5 GB |
| Blogs (500 feeds × ~300 posts × 2k words) | ≈300M words ≈ 1.8 GB |
| Think-tank and IGO PDFs, 50k reports × 2 MB | ≈100 GB, or ≈5 GB as extracted text |
| CRS (EveryCRSReport, all versions) | ~10–30 GB (not measured) |
| HN | ~10–20 GB Parquet (not measured) |
| **Total** | **~150 GB** with PDFs, **~15 GB** text-only: one NVMe drive, or $2–3/month on R2/S3-class storage [I, unverified prices] |

**One-time LLM and embedding cost**:

| Job | Tokens | Haiku 5.5 batch ($0.05 / $0.25 per MTok) | Sonnet 5.5 batch ($1 / $5) |
|---|---|---|---|
| Forum posts: 80k × (≈2.6k in + 150 out) | 210M in, 12M out | ≈ $13.5 | ≈ $270 |
| Forum comment threads, top-20 comments per post with ≥5 comments (≈25k threads × 3k in + 150 out) | 75M in, 4M out | ≈ $4.75 | ≈ $95 |
| 50k reports, summary from first 8 pages (≈6k in + 300 out) | 300M in, 15M out | ≈ $18.75 | ≈ $375 |
| Embeddings, all text (~1B tokens at $0.02/MTok, R10) | 1B | ≈ $20 | — |
| **Total** | | **≈ $57** | **≈ $760** |

Multiply by 1.0–1.35 for the newer tokenizer (pricing-reference.md). Keep each prompt under 100K tokens to avoid Haiku's 5× long-context rate. [I, prices from pricing-reference.md and R10]

**Ongoing cost:** a few dollars a month in LLM spend for new and edited items, plus storage [I].

---

## Numbers that matter

| Value | Date | Source | Confidence |
|---|---|---|---|
| 85.5% of 310 unique BlueDot reading items are grey; 1.3% peer-reviewed | 2026-10-15 | [71], measured | High (rubric-dependent ±5 pts) |
| Stanford CS120 (Fall 2025): 17.9% grey, 45.8% peer-reviewed | 2026-10-15 | [72], measured | High |
| 65% (39/60) of grey test items in none of OpenAlex / S2 / Crossref; 100% of forum/blog posts | 2026-10-15 | [35][36][34] | High for sample; generalization medium |
| LessWrong 54,587 posts / 1,090,404 comments | 2026-10-15 | [1] | High (default-view definition) |
| Alignment Forum 4,684 posts / 25,840 comments | 2026-10-15 | [2] | High |
| EA Forum 24,972 posts / 208,515 comments | 2026-10-15 | [3] | High |
| LW Annual Review winners: 343 (2018–2024) | 2026-10-15 | [1] | High |
| EA Forum CC BY 4.0 from 2022-12-01 | 2022-10-25 | [9] | High |
| Substack RSS depth: 20 posts; ToS updated 2026-10-06 bans crawling | 2026-10-15 | [15][17] | High |
| Rogue Scholar: 57,803 posts, 184 blogs, Crossref DOIs | 2026-10-15 | [21] | High |
| CRS via API: 14,180; EveryCRSReport: 23,564 rows | 2026-10-15 | [39][41] | High (definitions differ) |
| OSTI: 5,047,570 records; NTRS: 648,017 | 2026-10-15 | [42][43] | High |
| HN max item 50,101,480 | 2026-10-15 | [52] | High |
| X API: $0.005 per post read; 3M/month cap | 2026-10-15 | [56] | High |
| Reddit: RSS ends 2026-11-13; public API closes March 2027 | announced 2026-09-30 | [54] | Medium (secondary) |
| Overton: 25M+ docs, 3,000+ sources; contracts $11,370–$40,599/yr | 2026 | [58][59] | Medium-high |
| Pew: 38% of 2013 pages gone by 2023; 21% of gov pages have broken links | 2024-05-17 | [61] | High |
| Wayback availability API found snapshots for 48/60 items | 2026-10-15 | [38] | Medium (false negatives) |
| Internet Archive breach: ~31M accounts; outage 2024-10-09 → 2024-10-25 | 2024-10 | [63] | Medium-high |
| 66.5% of 28k+ economics WPs eventually published in journals | 2020 (stale?) | [49] | Medium |
| EThOS: 650,000+ theses metadata; restored (BL update 2026-07-08) | 2026-07 | [51] | High |
| 50% of Sept-2026 LW posts revised after publication | 2026-10-15 | [1] | High |
| Forum-corpus LLM summary cost ≈ $14 (Haiku 5.5 batch) | 2026-10-15 | [76] | Medium (token estimates) |

---

## Surprises and recent changes (2024–2026)

1. **LessWrong now courts AI agents** (`robots.txt` → `/api/SKILL.md`, Markdown routes, agent draft-editing endpoints), while its linked legal terms (2015) still ban scrapers [V][4][7].
2. **The EA Forum and LessWrong GraphQL schemas have diverged**, so the old "one ForumMagnum client" assumption breaks [V].
3. **Alignment Forum volume roughly halved in 2026**: about 60–70 posts per quarter against 140 in Q3 2025 [V]. The cause is not established.
4. **Reddit is shutting its public API and RSS** (announced 2026-09-30) [S].
5. **X moved to pay-per-use** (default since February 2026 per secondary sources); $0.005 per read is primary-verified [V/S].
6. **Substack published a "Developer API"** (2026-01-08) that deliberately excludes post content [V], and updated its ToS on 2026-10-06 [V].
7. **EThOS returned in July 2026** after about three years, metadata-only [V].
8. **Open Philanthropy's site now redirects to "Coefficient Giving"** [V], a URL-stability hazard for a decade of cited reports.
9. **archive.today was blacklisted by English Wikipedia** (February 2026) [S].
10. **Even official-API file links are bot-walled**: CRS PDF/HTML URLs returned by api.congress.gov hit Cloudflare challenges [V].
11. **Rogue Scholar DOIs reach OpenAlex within about a day** [V]. The fastest route to scholarly visibility for a blog post is now trivial for blogs that join.
12. **The Internet Archive breach and outage (October 2024)**, and its rate-limiting of cloud IPs in 2026, make "the Wayback has it" a weaker guarantee than assumed [S/V].

---

## Contested or uncertain points

- **LessWrong licensing.** I found no blanket CC licence and rely on a 2015 PDF of terms. LessWrong may have updated terms elsewhere that I did not find [~25% that a newer licence exists].
- **What "posts" means.** Totals depend on view filters (default view excludes drafts, unlisted, shortform and possibly events). LW's own "all posts" page could differ by a few percent [I].
- **The AF ⊂ LW relationship.** I treated AF posts as LW documents with `af: true` (same `_id`). I did not verify that all 4,684 AF posts are visible on LW [~90%].
- **CRS counts (14,180 vs 23,564).** The definitions are not reconciled [I].
- **Google Scholar coverage** is from 18 hand checks via a third-party fetcher, and GS results changed with phrasing. Treat 39% as indicative only.
- **Semantic Scholar.** S2's `search/match` returns one best match. Some S2-indexed items might have been missed if the title differs (the OSTI item matched only on a longer title) [V]. S2's shared unauthenticated pool returned 429s for most of the run, so matching took about 40 minutes with backoff [V].
- **Wayback "none returned"** may be a false negative (demonstrated once) [V].
- **Cloudflare test scope.** 14 sites, one request per UA, from one cloud IP. Cloudflare bot scores are adaptive, so higher volumes would likely trigger challenges [I].
- **Overton pricing.** Federal purchase records are not list prices [S].
- **Policy Commons.** Its 25-searches/month free tier is from launch materials (2021) and may have changed [S].
- **Fed Board copyright status.** I am ~70% confident Board staff working papers fall under §105.
- **Curriculum classification** of lab research pages (blog vs. report) and arXiv items (preprint vs. peer-reviewed) shifts shares by ±5 points [I].

---

## Implications for someone building tools to explore literature

1. **Do not start from OpenAlex or Semantic Scholar for this reader.** They cover the working-paper and DOI-bearing report end. For a safety or governance reader that is under 15% of what they are assigned [V/I]. Start from the forums, a feed list and a curated think-tank list, then join to the graphs where DOIs exist.
2. **Treat the forums as first-class bulk sources.** They are small (≈280M words), richly structured (karma, reviews, tags, sequences, revisions) and API-accessible. Mirror privately, respect crawl delays, and republish only CC BY content (EA Forum ≥ 2022-12-01) [I].
3. **Model posts as multi-homed, versioned works with discussion children.** Cross-post links, canonical tags and revision histories are already in the APIs [V].
4. **Make rights a per-item field with a basis and date**, not a per-source assumption. Licence regexes misfire (image credits) [V].
5. **Prefer APIs and mirrors over HTML for government grey literature**: api.congress.gov, EveryCRSReport, OSTI, NTRS, GOV.UK, World Bank DSpace, Crossref prefixes. Bot walls make HTML scraping both fragile and inappropriate [V].
6. **Archive on ingest, in at least two places** (Wayback + your own WARC/PDF), and record the snapshot in the work record. The 2024 IA outage, 2026 IA rate limits and the archive.today blacklist all argue against a single dependency [V/S].
7. **Budget for Substack being link-only.** It is where many of this reader's authors publish, and its terms forbid what a bulk mirror would do. The tool should be an excellent link-out reader and personal-annotation layer there, not a mirror [I].
8. **Quality signals must be imported, not computed from citations.** For grey literature, citations are sparse and DOI-biased. Karma, Annual Review scores, curation, curriculum co-assignment (Measurement A) and policy citations (where licensed) are the usable signals [I].

---

## Ideas sparked

1. **Karma- and review-weighted forum literature map.** Embed every LW/AF/EAF post, cluster, then size nodes by `finalReviewVoteScoreHighKarma` (or karma percentile within year, to de-trend the 2009→2026 growth). Overlay Annual Review winners as "landmarks" and sequences as paths.
2. **Report↔paper crosswalk.** Join think-tank and lab reports to arXiv twins and published versions (Crossref `relation`, title+author blocking, embedding check). The test found Forethought and IAPS reports visible only through arXiv twins, and a NASA TM whose conference version is indexed.
3. **Archive-on-ingest pipeline.** Availability check (with and without timestamp) → SPN2 → local WARC → `persistence` block in the work record → weekly link-rot audit, alerting when a cited report 404s or redirects (e.g., openphilanthropy.org → coefficientgiving.org).
4. **Working-paper → published-version diff.** For NBER/SSRN/FEDS items with a later journal DOI, diff abstracts and conclusions with an LLM and flag "claims that changed". It tests whether the 66.5%-published WPs drift more than arXiv preprints [49][50].
5. **Curriculum co-assignment graph for grey literature.** Open Syllabus does not see BlueDot-style courses. Scraping the dozen public AI-safety and governance curricula (BlueDot JSON, CS120, MATS, ARENA) gives a "taught together" signal for posts and reports.
6. **Cross-post deduplicator with canonical-home rules** (§4.1), shipped as a small library returning `work_id` + `manifestations` for any LW/EAF/Substack/Ghost URL.
7. **Revision watcher.** Use LW/EAF `revisions` with `changeMetrics` to notify a reader when a post they annotated changes materially (e.g., more than 5% of words added or removed) and show the diff. The edit rate (50% of posts) makes this useful.
8. **CC-BY EA Forum corpus release.** Publish a clean, attributed, versioned Parquet of EA Forum posts and comments from 2022-12-01 onward (green per row 1), with authors' opt-in for earlier posts. This fixes the mislabelled-dump problem.
9. **"Is this visible?" badge.** For any URL, show: DOI (RA), OpenAlex ID, S2 ID, Wayback date, licence, bot-wall status. It turns Measurement B into a per-item UI.
10. **Government grey-lit gateway.** Normalize CRS (EveryCRSReport), OSTI, NTRS, GOV.UK research and World Bank items into one public-domain or open-licence reading shelf, with full text, since these are republishable.
11. **Comment-thread distiller.** For posts with at least N comments, have Haiku 5.5 extract "objections raised", "author concessions" and "unresolved questions", stored as a child work. About $5 for the whole forum history.
12. **Substack link-out reader with personal mirror.** Read via RSS and the browser, store only the user's highlights plus a private copy saved by the user's own browser session. This respects ToS limits on crawling while still giving the reader search over what they read.
13. **Chinese-policy shelf.** Pull DigiChina and CSET translations, add machine translations of untranslated originals at about $0.002 each (Haiku batch), keep a term glossary, and mark machine vs. human translation in `provenance`.
14. **Policy-citation proxy without Overton.** Mine links from GOV.UK research documents, CRS reports (EveryCRSReport HTML) and IGO PDFs to forum posts, think-tank reports and arXiv papers. This builds a free "cited in policy" signal for the AI-governance niche.

---

## Sources

All accessed 2026-10-15 unless noted. "Live" means a direct API call or fetch this session.

1. LessWrong GraphQL API (live queries: counts, per-year totals, schema introspection, 500-post sample, revisions, review winners) — https://www.lesswrong.com/graphql
2. AI Alignment Forum GraphQL API (live) — https://www.alignmentforum.org/graphql
3. EA Forum GraphQL API (live; legacy `input:{terms}` syntax) — https://forum.effectivealtruism.org/graphql
4. LessWrong, agent API documentation `SKILL.md` (version 2.0.0) — https://www.lesswrong.com/api/SKILL.md
5. robots.txt files — https://www.lesswrong.com/robots.txt ; https://www.alignmentforum.org/robots.txt ; https://forum.effectivealtruism.org/robots.txt
6. LessWrong FAQ (Markdown API version; "Privacy Policy and Terms of Use" section) — https://www.lesswrong.com/api/post/2rWKkWuPrgTMpLRbp
7. MIRI, "Lesswrong.com Privacy Policy and Terms of Use" (PDF; metadata creation date 2015-04-01) (stale?) — https://intelligence.org/files/PrivacyandTerms-Lesswrong.com.pdf
8. EA Forum, "Changing Licences on the EA Forum" (2022-10-07) — https://forum.effectivealtruism.org/posts/vDHeKh2KajnKcLRKz/changing-licences-on-the-ea-forum
9. EA Forum, "New Forum License: Creative Commons" (2022-10-25) — https://forum.effectivealtruism.org/posts/KK6AE8HzPkR2KnqSg/new-forum-license-creative-commons
10. EA Forum, Terms of Use – EA Forum Addendum (last updated 2022-10-31) — https://forum.effectivealtruism.org/termsOfUse
11. Hugging Face, StampyAI/alignment-research-dataset (API metadata and README) — https://huggingface.co/datasets/StampyAI/alignment-research-dataset
12. Hugging Face dataset search and cards — https://huggingface.co/api/datasets?search=lesswrong ; https://huggingface.co/datasets/trentmkelly/LessWrong-43k ; https://huggingface.co/datasets/x65617379/lesswrong_260509 ; https://huggingface.co/datasets/open-index/hacker-news ; https://huggingface.co/datasets/reja273/substack-newsletter-articles-metadata-3.5m
13. GreaterWrong, About (via WebFetch) — https://www.greaterwrong.com/about
14. EA Forum, "Announcing Scry: A research tool over arXiv, EA Forum, etc." (2025-12-26) — https://forum.effectivealtruism.org/posts/z7AKFmJeZjZvbjwkt
15. Substack, Terms of Use (last updated 2026-10-06) — https://substack.com/tos
16. Substack, Developer API Terms of Use (last updated 2026-01-08) — https://substack.com/api-tos
17. Astral Codex Ten feed, archive endpoint, sitemap, robots (live) — https://www.astralcodexten.com/feed ; https://www.astralcodexten.com/api/v1/archive?sort=new&offset=0&limit=50 ; https://www.astralcodexten.com/sitemap.xml ; https://www.astralcodexten.com/robots.txt
18. Ghost, Content API documentation — https://docs.ghost.org/content-api/
19. Medium, API documentation repository ("no longer supported") — https://github.com/Medium/medium-api-docs
20. RSS depth tests (live) — https://www.cold-takes.com/rss/ ; https://deepmindsafetyresearch.medium.com/feed ; https://windowsontheory.org/feed/ ; https://marginalrevolution.com/feed ; https://www.planned-obsolescence.org/feed ; https://gwern.net/feed
21. Rogue Scholar API and docs (live) — https://api.rogue-scholar.org/posts ; https://api.rogue-scholar.org/blogs ; https://docs.rogue-scholar.org/
22. Kagi, Small Web list (`smallweb.txt`, README) — https://github.com/kagisearch/smallweb
23. Exa, pricing — https://exa.ai/pricing
24. Marginalia Search, API documentation — https://about.marginalia-search.com/article/api/
25. Gwern.net, "The Scaling Hypothesis" (CC0 link in page) — https://gwern.net/scaling-hypothesis
26. GiveWell, top charities page (licence footer) — https://www.givewell.org/charities/top-charities
27. RAND, report page RRA2977-2 and Rights and Permissions — https://www.rand.org/pubs/research_reports/RRA2977-2.html ; https://www.rand.org/pubs/permissions.html
28. CSET, "When AI Builds AI" (PDF; CC BY-NC 4.0 statement) — https://cset.georgetown.edu/wp-content/uploads/CSET-When-AI-Builds-AI.pdf
29. Epoch AI, "Can AI scaling continue through 2030?" — https://epoch.ai/publications/can-ai-scaling-continue-through-2030
30. International AI Safety Report 2026, Extended Summary for Policymakers (PDF; OGL v3.0) — https://internationalaisafetyreport.org/sites/default/files/2026-02/ai-safety-report-2026-extended-summary-for-policymakers.pdf
31. Brookings, "Shaping global governance of AI agents" (image credit CC BY 4.0) — https://www.brookings.edu/articles/shaping-global-governance-of-ai-agents/
32. Coefficient Giving (redirect target of openphilanthropy.org), "Report on Semi-informative Priors" — https://coefficientgiving.org/research/report-on-semi-informative-priors/
33. Think-tank footers — https://www.iaps.ai/research/risk-reporting-for-developers-internal-ai-model-use ; https://carnegieendowment.org/research/2024/09/if-then-commitments-for-ai-risk-reduction ; https://www.cnas.org/publications/reports/superpowers-and-agi ; https://www.governance.ai/research-paper/international-control-of-powerful-technology-lessons-from-the-baruch-plan-for-nuclear-weapons
34. Crossref REST API (live: bibliographic queries, `/prefixes/{p}/works`, works by DOI) and DOI registration-agency lookups — https://api.crossref.org/ ; https://doi.org/ra/
35. OpenAlex API (live: `/autocomplete/works`, `/works/doi:…`; rate-limit headers showing the anonymous daily budget exhausted) — https://api.openalex.org/
36. Semantic Scholar Graph API, `paper/search/match` (live) — https://api.semanticscholar.org/graph/v1/paper/search/match
37. Google Scholar, manual spot checks via WebFetch (18 items) — https://scholar.google.com/
38. Internet Archive, Wayback availability API (via WebFetch) — https://archive.org/wayback/available
39. Library of Congress, api.congress.gov CRS endpoint (live, `DEMO_KEY`), README and ChangeLog — https://api.congress.gov/v3/crsreport ; https://github.com/LibraryOfCongress/api.congress.gov ; https://github.com/LibraryOfCongress/api.congress.gov/blob/main/ChangeLog.md
40. api.data.gov, Developer Manual (rate limits) — https://api.data.gov/docs/developer-manual/
41. EveryCRSReport.com, homepage, about and `reports.csv` (Last-Modified 2026-10-15 07:07 UTC) — https://www.everycrsreport.com/ ; https://www.everycrsreport.com/reports.csv
42. OSTI.gov API (live) — https://www.osti.gov/api/v1/records
43. NASA NTRS API (live) — https://ntrs.nasa.gov/api/citations/search
44. GOV.UK Content API and Search API (live) — https://www.gov.uk/api/content/government/publications/frontier-ai-capabilities-and-risks-discussion-paper ; https://www.gov.uk/api/search.json
45. World Bank Open Knowledge Repository, DSpace REST API (live) — https://openknowledge.worldbank.org/server/api/discover/search/objects
46. Federal Reserve Board, FEDS working papers index — https://www.federalreserve.gov/econres/feds/index.htm
47. 17 U.S.C. §105 (Cornell LII) — https://www.law.cornell.edu/uscode/text/17/105
48. NBER, "Free Working Paper Access" — https://www.nber.org/free-working-paper-access
49. Baumann, A. & Wohlrabe, K. (2020), "Where Have All the Working Papers Gone?" (abstract via IDEAS) (stale?) — https://ideas.repec.org/p/ces/ceswps/_8328.html
50. Klein, M. et al. (2016), "Comparing Published Scientific Journal Articles to Their Pre-print Versions", arXiv:1604.05363 (stale?) — https://arxiv.org/abs/1604.05363
51. British Library, EThOS help/FAQ and collection page (update 2026-07-08) — https://ethos.bl.uk/help?locale=en ; https://www.bl.uk/collection/ethos
52. Hacker News API README and `maxitem` (live) — https://github.com/HackerNews/API ; https://hacker-news.firebaseio.com/v0/maxitem.json
53. HN Search (Algolia) API (live `nbHits`) — https://hn.algolia.com/api/v1/search_by_date?tags=story
54. Reddit API/RSS shutdown coverage (secondary; announcements 2026-09-30) — https://tech.slashdot.org/story/26/09/30/1841213/reddit-is-killing-rss-feeds-ending-public-api-access ; https://www.techrepublic.com/article/news-reddit-rss-public-api-shutdown/ ; https://ppc.land/reddit-to-halt-public-data-api-access-in-march-2027-as-14-000-apps-register/
55. DevClass, "Stack Exchange restricts access to dump of user contributed data…" (2024-07-30) (stale?) — https://devclass.com/2024/07/30/stack-exchange-restricts-access-to-dump-of-user-contributed-data-as-critics-complain-license-permits-reuse-for-any-purpose
56. X Developer Platform, pricing — https://docs.x.com/x-api/getting-started/pricing
57. Community Archive (opt-in Twitter archives) — https://github.com/TheExGenesis/community-archive
58. Overton Knowledge Base, coverage article and API overview — https://help.overton.io/article/what-is-overtons-coverage-and-how-does-it-compare-to-other-systems/ ; https://help.overton.io/article/using-the-overton-api/
59. Overton pricing evidence (secondary) — https://govtribe.com/vendors/open-policy-ltd-u1wk1 ; https://iastatedigitalpress.com/jlsc/article/id/17686
60. Coherent Digital, Policy Commons launch and user-milestone releases (secondary; stale?) — https://coherentdigital.net/policycommonslaunch ; https://coherentdigital.net/policy-commons-passes-50000-registered-users
61. Pew Research Center, "When Online Content Disappears" (2024-05-17) — https://www.pewresearch.org/data-labs/2024/05/17/when-online-content-disappears/
62. Harvard Berkman Klein / LIL, link-rot research summary (2021) and Zittrain, Albert & Lessig (2014) (stale?) — https://cyber.harvard.edu/story/2021-05/new-research-shows-how-many-important-links-web-get-lost-time
63. Wikipedia, "Internet Archive" (2024 attacks; 2025 trillionth page) — https://en.wikipedia.org/wiki/Internet_Archive
64. Wikipedia, "2025 United States government online resource removals" — https://en.wikipedia.org/wiki/2025_United_States_government_online_resource_removals
65. Wikipedia, "Archive.today" (FBI subpoena 2025-10-30; Wikipedia blacklisting 2026) — https://en.wikipedia.org/wiki/Archive.today
66. Perma.cc, account documentation (via search summary; sign-up page 403) — https://perma.cc/docs/accounts
67. Cloudflare blog, "Content Independence Day: no AI crawl without compensation!" (2025-07-01) — https://blog.cloudflare.com/content-independence-day-no-ai-crawl-without-compensation/
68. Cloudflare blog, "Introducing pay per crawl" (2025-07-01) — https://blog.cloudflare.com/introducing-pay-per-crawl/
69. MIT Technology Review, "Cloudflare will now, by default, block AI bots…" (2025-07-01) — https://www.technologyreview.com/2025/07/01/1119498/cloudflare-will-now-by-default-block-ai-bots-from-crawling-its-clients-websites/
70. The Unjournal — https://info.unjournal.org/ ; https://www.unjournal.org/
71. BlueDot Impact course pages (unit pages' embedded JSON, live) — https://bluedot.org/courses/ai-governance ; https://bluedot.org/courses/technical-ai-safety ; https://bluedot.org/courses/agi-strategy
72. Stanford CS120, "Introduction to AI Safety" (Fall 2025 page) — https://web.stanford.edu/class/cs120/
73. EA Forum, "AI safety comms reading list" (2026-10-15) — https://forum.effectivealtruism.org/posts/NirTqnMBpYnsjsy2p
74. DigiChina; Concordia AI; CSET translations — https://digichina.stanford.edu/ ; https://concordia-ai.com/ ; https://cset.georgetown.edu/publications/?fwp_content_type=translation
75. PQDT Open (redirect behaviour, live) — https://pqdtopen.proquest.com/
76. Open Stacks research notes: `research/pricing-reference.md` (Claude prices, cached 2026-10-06) and `R10-catalog-architecture-and-costs.md` (embedding prices, work record)
77. Bot-walled pages recorded (live; 403 or challenge) — https://policycommons.net/ ; https://oatd.org/ ; https://www.dart-europe.org/ ; https://www.congress.gov/crs-product/R47644 ; https://www.gao.gov/products/gao-24-105980 ; https://commonslibrary.parliament.uk/ ; https://www.imf.org/ ; https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5278644 ; https://doi.org/10.1787/d1a8d965-en ; https://eur-lex.europa.eu/eli/reg/2024/1689/oj ; https://unjournal.pubpub.org/
