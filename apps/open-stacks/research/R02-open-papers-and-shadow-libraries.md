# Open scholarly papers: infrastructure, policy, and shadow libraries — research dossier

- **Date of research:** 2026-10-15 (all "as of" figures are this date unless stated otherwise)
- **Track:** R02, Open Stacks (QURI / CAIRN)
- **Scope:** How much of the journal and preprint literature is legally free to read, and through which routes. Covers: the open-access (OA) share and its colors (gold, green, hybrid, bronze, diamond); the main preprint servers and repositories; the aggregators and metadata graphs a tool builder would use (OpenAlex, Unpaywall, Crossref, Semantic Scholar, CORE, BASE, DOAJ, Europe PMC, PMC, Lens, Dimensions, Google Scholar); US and European OA policy (OSTP "Nelson memo", NIH, Plan S, UC–Elsevier); JSTOR's individual-access options; author-request norms; and shadow libraries (Sci-Hub, LibGen, Z-Library, Anna's Archive), including their role in AI-training litigation. Shadow libraries are described as landscape only. Nothing here is a recommendation to use them.
- **Method:**
  - About 8 web searches, after which the shared search budget for this run ran out. That is fewer than intended.
  - Most facts were therefore checked by fetching sources directly: about 60 pages and endpoints. These include official docs and pricing pages (OpenAlex, arXiv, JSTOR, NIH, SPARC, cOAlition S, UC), the court orders themselves (*Bartz v. Anthropic* Dkt. 231 and *Kadrey v. Meta* Dkt. 598, as PDF text), peer-reviewed papers (Himmelstein et al. 2018 *eLife*, Walters 2025 *PNAS*, Piwowar et al. 2018 *PeerJ*), trade press (TorrentFreak, Publishers Weekly) and Wikipedia wikitext (used as a secondary index to find primary references).
  - Several counts come from **live API calls on 2026-10-15**: arXiv monthly-submissions CSV, bioRxiv/medRxiv statistics API, Europe PMC REST API, DOAJ API, Crossref REST API, OSF API, Semantic Scholar datasets API, and OpenAlex response headers. These are the most current numbers in the dossier.
  - A few pages blocked automated fetching: Europe PMC "About", BASE, SSRN, PhilArchive/PhilPapers, eLife, Science, Ars Technica and The Hindu. For those I used an API or a secondary source, and the text says so.
- **Evidence labels used below:**
  - **[P]**: verified on a primary source (official page, API, court document, the paper itself).
  - **[S]**: reported by a secondary source (press, Wikipedia, blog).
  - **[I]**: my inference.
  - Confidence is marked as high/med/low or as a percentage.
  - Sources older than about 2 years are flagged **(stale?)**.

---

## Executive summary

1. **Roughly half of recently published articles are free to read somewhere. The backfile is much less open, and legal free routes alone reach about two-thirds of a typical citation list.**
   - OpenAlex-based counts (Herb, May 2025) put the OA share of journal articles at 22% for 2015, 59% for 2022 and 2023, and 47% for 2024. The 2024 dip is mostly lag: green copies and bronze reopenings arrive late. [S, med] [13]
   - The classic Piwowar et al. (2018) estimate: at least 28% of all literature is OA (19M articles), 45% of 2015 articles, and 47% of the articles Unpaywall users actually view. [P] [11] (stale? but still the canonical baseline)

2. **The best recent head-to-head test of access routes is Walters (PNAS, July 2025).** He hand-searched 875 cited works across 7 fields:
   - Google Scholar found a record for 97% of them, but free full text for only 67% (48% in the final published version). OpenAlex found free full text for 48%.
   - Anna's Archive had 76% and Sci-Hub 72%, about the same as a university library's subscriptions (73%).
   - All free mechanisms together reached 94%, but **that combined figure includes the pirate sites**. [P, high] [53]

3. **OpenAlex, the main open metadata backbone, switched to usage-based USD pricing in February 2026:**
   - Free API keys come with **$1/day** of usage. Keyless use shares a **$0.10/day budget per IP address**, observed live.
   - Prices per 1,000 calls: lookups by ID/DOI are free; list/filter $0.10; search $1; PDF downloads $10.
   - Annual plans: Member $5,000/yr, Member+ $10,000/yr, Partner from $20,000/yr.
   - The **full CC0 snapshot is still free on S3, but now quarterly** (about 626M records, ~745 GB compressed). Daily snapshots are paid. [P, high] [1][3][4][5][6][8]

4. **Unpaywall is now a subsystem of OpenAlex.**
   - OurResearch rebranded as OpenAlex on 2025-09-29. It describes Unpaywall as running "as a subroutine of the OpenAlex codebase". [P] [2]
   - The Unpaywall REST API still answered DOI queries on 2026-10-15, with legacy fields marked `"deprecated"`. [P] [8]

5. **arXiv is growing very fast and tightening its rules.**
   - 3,213,484 total submissions as of 2026-10-15. 284,486 new submissions in 2025, up 16.6% on 2024. 291,296 already in 2026 by mid-October. A record **40,363 in September 2026**, double September 2024. [P, high] [15][16]
   - New rules: tighter endorsement (Jan 2026); a full English text required (Feb 2026); CS review and position papers need prior peer review (Oct 2025); one-year bans for unchecked LLM content (May 2026); **max 2 submissions per submitter per month (from 2026-10-01)**. [P/S] [16][19][20][21][22]
   - arXiv **spun out of Cornell as an independent nonprofit on 2026-07-01**. It says it stays free to read and to submit. [P] [17]

6. **Big legal aggregators, live counts on 2026-10-15** [P, high]:
   - Crossref: **187.7M** DOIs, 124.5M of them journal articles. [34]
   - Europe PMC: **49.0M** records, **12.4M full texts**, 8.3M in its OA subset, 1.26M preprints. [30]
   - PMC: **11.33M** full-text articles (FY25). [29]
   - DOAJ: **23,611** journals (14,750 with no APC) and 13.8M article records. [33]
   - CORE: **452M** records from 16K providers, with ">40M" full texts. [31]
   - Semantic Scholar: 214M papers; the S2ORC v2 full-text dataset has 16M papers. [35]

7. **US federal policy, status as of 2026:**
   - **NIH's zero-embargo policy applies to manuscripts accepted on or after 2025-07-01.** [P] [40]
   - NIH proposed capping allowable publication costs from 2026-01-01. Its RFI options ranged from no publication costs at all to $2,000, $3,000 or $6,000 per paper. **I could not confirm that a final cap is in force** [~60% that no final per-article cap had taken effect by October 2026]. [P for the RFI] [42]
   - Under the Nelson memo, SPARC (May 2026) reports that **most agencies' policies are in effect** (for example NSF from 2026-01-22 and USDA from 2026-04-07). Some agencies, such as DOD, DOT, DHS and NOAA, had no updated policy published, and "a small handful" paused pending administration guidance. [P/S] [39]

8. **The University of California–Elsevier read-and-publish agreement now runs to 2027-12-31.** It started 2021-04-01. Terms: a 15% APC discount (10% for Cell Press and The Lancet), with UC libraries paying the first $1,000 of each APC. [P] [44]

9. **JSTOR, for individuals:**
   - A free account gives "up to 10 free articles every 30 days", read online. [P] [46]
   - **JPASS still exists**: $19.50/month (10 PDFs per month) or $199/year (120 PDFs per year), covering 2,400+ journals. [P] [45]
   - Early Journal Content (more than 95 years old in the US, more than 143 years old elsewhere) is free to all. [P] [46]

10. **Shadow libraries:** they are bigger than ever and under the heaviest legal fire so far.
    - Anna's Archive self-reports **71,996,952 books and 239,545,528 papers** (2026-10-01), with about 1.1 PB of torrents. [S] [58]
    - In 2026 it lost three US default judgments:
      - OCLC/WorldCat: deletion order, Jan 2026. [S] [58][59]
      - Spotify and the major labels: **$322.2M**, Apr 2026. [S] [61]
      - 13 publishers: **$19.5M**, 2026-05-19, with an order directing registries and registrars worldwide to disable its domains. [S] [62]
      - It also lost its .org domain in January 2026. [S] [58]
    - Sci-Hub's corpus has been largely frozen since about December 2020 (88.3M files reported in 2022). [S] [54]
    - On **2025-08-19 the Delhi High Court ordered Sci-Hub and its new request platform Sci-Net blocked across India** and held its founder in contempt. [S, high] [55]

11. **AI litigation turned on how the data was acquired.** In *Bartz v. Anthropic*, Judge Alsup held on 2025-06-23 that training was fair use but **pirated library copies were not** automatically excused. The record shows Anthropic downloaded 196,640 books (Books3), ≥5M (LibGen) and ≥2M (PiLiMi). [P] [65]
    - The **$1.5B class settlement** covers **482,460 works** (about $3,000 each) and got **final approval on 2026-07-20**. First payments were expected by about 2026-11-15. Appeals may delay them (sources conflict). [P/S] [69][70][72][73]

12. ***Kadrey v. Meta*:** On 2025-06-25 Judge Chhabria granted Meta summary judgment on fair use, but only for 13 authors and expressly "not … that Meta's use … is lawful". Meta's torrenting of LibGen and Anna's Archive is undisputed. The distribution claims are still open, with summary judgment set for a **2027-02-25** hearing. [P/S] [66][67]

13. **Author-request norms are widespread but almost unmeasured.**
    - #icanhazPDF studies counted requests (824 requests among 1,238 tweets in one study; 302 health-science requests over three months in another). Neither measured how many requests were fulfilled. [P] [48][49]
    - **I found no rigorous published success rate for emailing authors or for ResearchGate requests.** This is a real evidence gap.

14. **Legal risk, stated plainly.** In the US, downloading copyrighted papers or books from shadow libraries is copyright infringement. Torrenting adds distribution exposure. Statutory damages run up to $150,000 per work for willful infringement; the 2026 default judgments used exactly that figure. [P for the per-work rate] [61][62]
    - Enforcement has fallen mainly on operators, intermediaries such as registrars and CDNs, and large-scale corporate downloaders, not individual readers. [I, med]
    - For a tool builder, sourcing from shadow libraries is the single largest legal hazard in this space. The Bartz ruling shows that a transformative *use* does not cure an infringing *acquisition*. [P] [65]

---

## Detailed findings

### 1. How much of the literature is open access?

#### 1.1 Definitions (the "colors")

| Color | Meaning | Reversible? | Notes |
|---|---|---|---|
| **Gold** | Published OA in a fully OA journal, usually CC-licensed. Often has an APC. | No | Includes APC-funded megajournals. |
| **Diamond** | Fully OA journal with **no fee to authors or readers**. | No | A subset of gold. OpenAlex now tags it separately (the Herb tables below). DOAJ lists 14,750 journals with `has_apc:false` [33]. |
| **Hybrid** | OA article in a subscription journal, usually after an APC paid under a transformative agreement. | No | Grew fastest 2020–2023 [13]. |
| **Bronze** | Free to read on the publisher site with **no open license**. | **Yes**: the publisher can close it. | Piwowar 2018 found this the single most common OA route [11]. |
| **Green** | A copy in a repository or preprint server (accepted manuscript or preprint). | Mostly no | Often arrives after an embargo, so recent years are undercounted. |
| **Closed** | No free legal copy found. | n/a | The free copy may still exist somewhere OpenAlex/Unpaywall don't index, such as author homepages. |

OpenAlex/Unpaywall assign each work its single "best" OA status, so the categories are mutually exclusive in those statistics [I, high; consistent with Herb's tables summing to the OA total] [13].

#### 1.2 Estimates over time

| Estimate | Population | OA share | Source and date | Status |
|---|---|---|---|---|
| Piwowar et al. | All Crossref-DOI journal articles (100k sample; oaDOI checked 67M) | **≥28%** of all literature (19M articles) | PeerJ, 2018-02-13 [11] | [P] (stale?) |
| Piwowar et al. | Articles published in 2015 | **45%** | same [11] | [P] (stale?) |
| Piwowar et al. | Articles viewed by Unpaywall users | **47%** | same [11] | [P] (stale?) |
| Piwowar, Priem & Orr | All articles, 2019; projected 2025 | 31% in 2019, projected **44%** in 2025. Views to OA: 52% in 2019, projected 70% in 2025 | OpenAlex/Our Research blog, 2019-10-09 [12] | [P] (stale?) |
| Herb (OpenAlex, "article" type, pulled 2025-05-13) | Articles by publication year | 2015 **22%**; 2018 34%; 2020 42%; 2021 49%; 2022 **59%**; 2023 **59%**; 2024 **47%** | Rogue Scholar, 2025-05-15 [13] | [S] (a single-author blog, but its dataset is on Zenodo) |
| Herb (OpenAlex, 2024 output, all document types) | 2024 publications by domain | Life Sci 52%; Health 49%; Social Sci 41%; Physical Sci 38% | Rogue Scholar, 2025-05-20 [14] | [S] |

Herb's colour breakdown, as a share of *all* articles in each year [13]:

| Year | OA | Gold | Hybrid | Bronze | Green | Diamond |
|---|---|---|---|---|---|---|
| 2015 | 22% | 7% | 3% | 6% | 4% | 3% |
| 2020 | 42% | 19% | 5% | 8% | 5% | 5% |
| 2022 | 59% | 25% | 11% | 10% | 7% | 6% |
| 2023 | 59% | 24% | 13% | 11% | 5% | 7% |
| 2024 | 47% | 21% | 11% | 6% | 2% | 6% |

**Interpretation [I]:**
- The 2024 drop is mostly green and bronze, which are exactly the categories that arrive late (embargoed manuscripts, delayed publisher opening). Expect 2024 to be revised upward toward 55–60% as the data matures [~70%].
- For a reader, a "paper from the last five years" has roughly a 50–60% chance of a legal free copy by OA status. A random paper from a 1990s reference list has a much lower chance.

**Why the Piwowar and Herb numbers differ so much for 2015 (45% vs 22%):** different denominators. Piwowar sampled Crossref DOIs; OpenAlex "articles" include many non-DOI and regional records. Green and bronze detection also differ. Treat absolute levels as model-dependent and trends as more robust. [I, med]

#### 1.3 What a reader actually experiences: Walters 2025

Walters, *PNAS* 122(27), e2503051122, issue date 2025-07-08 [53] [P, high]:
- **Sample:** 875 works cited in 2023 review articles, 125 each from chemistry, materials science, cardiology, public health, economics, education and psychology. Each was searched by hand in 15 discovery or access mechanisms.

| Mechanism | Bibliographic record found | Free full text, any version / final version |
|---|---|---|
| Google Scholar (without library links) | **97%** | **67% / 48%** |
| OpenAlex | 95% | 48% / 35% |
| University library catalog (subscriptions, so not free) | 95% | 73% / 72% |
| Anna's Archive (pirate) | 93% | 76% / 70% |
| ResearchGate | 92% | 36% / 29% |
| Dimensions | 91% | 42% / 25% |
| Scopus | 87% | 38% / 27% |
| Sci-Hub (pirate) | 73% | 72% / 67% |
| Academia.edu | 31% | 29% / 23% |
| PubMed (cardiology only) | — | 84% / 78% |

- All mechanisms with URLs together reached **94% (89% final version)**. The pirate sites are included in that figure, and the paper reports **no legal-only combined figure** [53].
- Walters also notes that full-text coverage drops sharply for 2021–2024 publications in some mechanisms, and that Anna's Archive's interface is clumsy (two search boxes, up to five result lists).

**[I] Implication:**
- A **legal-only cascade** (Google Scholar "All versions" + Unpaywall/OpenAlex + PMC/Europe PMC + arXiv/SSRN/RePEc + author pages) plausibly reaches **~70–80%** of a cited-literature sample. This is my estimate, not a measured figure [~60%].
- An institutional subscription (73% in Walters) plus the legal free routes likely gets close to the 94% that the pirate-inclusive combination reaches.

---

### 2. Preprint servers and subject repositories

| Service | Field | Size (date) | Access, API and bulk | Owner / status 2026 | URL |
|---|---|---|---|---|---|
| **arXiv** | Physics, math, CS, quantitative bio and finance, stats, EESS, econ | **3,213,484** submissions (2026-10-15). 284,486 in 2025; 291,296 in 2026 to mid-Oct [P] [15] | Free to read. API, RSS and OAI-PMH limited to **1 request per 3 s, single connection** [P] [23]. Bulk PDFs and sources in the S3 requester-pays bucket `arxiv`: **~9.2 TB (Apr 2025)**, growing ~100 GB/month [P] [24]. Metadata **CC0**; most full text under arXiv's non-exclusive license, which bars redistribution [P] [23] | **Independent nonprofit since 2026-07-01** (spun out of Cornell), with multiyear philanthropic commitments announced 2026-09-23 [P] [17][18] | arxiv.org |
| **bioRxiv** | Life sciences | **355,254** new papers cumulative. 49,318 in 2025; 43,033 in 2026 so far [P, API] [25] | Free. Public JSON API (api.biorxiv.org) | Run by **openRxiv**, an independent nonprofit (with medRxiv). Funders include CZI and the Sergey Brin Family Foundation. An "automated feedback" option added 2026-08-27 [P] [26] | biorxiv.org |
| **medRxiv** | Health sciences | **91,109** cumulative. 15,027 in 2025; 13,916 in 2026 so far [P, API] [25] | Free; same API family | openRxiv [26] | medrxiv.org |
| **SSRN** | Social sciences, law, economics, humanities | Not verified (the site blocked automated fetch) | Free downloads, generally behind registration or a reCAPTCHA. Some content is paid [S] [74] | **Owned by Elsevier since May 2016** [S] [74] | ssrn.com |
| **PhilArchive / PhilPapers** | Philosophy | PhilPapers had 394,867 registered users (2022) [S] [74]. Archive size not verified | PhilArchive is the OA repository; PhilPapers is the index | Centre for Digital Philosophy, Western Ontario [S] | philarchive.org |
| **OSF Preprints** | Multi-disciplinary community servers (PsyArXiv, SocArXiv and others) | **203,770** public preprints across **32** providers [P, API] [27] | Free; open JSON:API | Center for Open Science | osf.io/preprints |
| **RePEc / IDEAS** | Economics | IDEAS indexes **>5.5M items**, ">5,000,000 that can be downloaded in full text". Note that "downloadable" includes paywalled publisher links [P] [28] | Free index; volunteer-run | Volunteer, St. Louis Fed (IDEAS) | ideas.repec.org |
| **PubMed Central (PMC)** | Biomedical full text | **11,327,616** articles (FY25), up from 10,307,502 in FY24 [P] [29] | Free to read. OA subset for bulk use via FTP, cloud and OAI-PMH [P] [29] | NIH/NLM; the deposit target for NIH's policy | pmc.ncbi.nlm.nih.gov |
| **Europe PMC** | Life sciences + preprints | **49,018,570** records: 41.2M from PubMed, **12,408,637 full text**, **8,324,232 OA**, 1,259,436 preprints [P, live API 2026-10-15] [30] | Free REST API, no key, used for these counts | EMBL-EBI | europepmc.org |

**arXiv's 2025–2026 rule changes**, a response to an AI-generated submission flood [16][19][20][21][22]:

| Date | Change | Evidence |
|---|---|---|
| ~2025-10-31 | CS category rejects review/survey and position papers unless they have documented prior peer review (exception: societal-impact papers) | [S] 404 Media, CASRAI [20][21] |
| 2025-12 / 2026-01-21 | Endorsement: an institutional email alone is no longer enough. A new submitter needs an institutional email **plus** prior authorship in the domain, **or** a personal endorsement. Piloted in math in December 2025 | [P] [19] |
| 2026-02-11 | Every submission needs a full English version (faithful machine translation accepted) | [S] CASRAI, citing an arXiv blog post of 2025-11-21 [20] |
| ~2026-05 | CS: clear evidence of unverified LLM content (for example hallucinated citations) can bring a **one-year ban**, followed by a requirement of prior peer-reviewed acceptance | [S] TechCrunch 2026-05-16 [22] |
| 2026-10-01 | **≤2 submissions per submitter per calendar month**, and ≤3 active at a time. Rejections count. September 2026 had 40,363 submissions vs 20,569 in September 2024 | [P] [16] |

**[I]** For a reader, arXiv's volume (~1,000+ papers/day in 2026) makes **triage tools more valuable than access tools**. arXiv is already free; the bottleneck is attention.

---

### 3. Aggregators, metadata graphs, and discovery services

| Service | What it is | Size (date) | Price / access for individuals | API terms (2026) | Bulk data | Status notes |
|---|---|---|---|---|---|---|
| **OpenAlex** | Open scholarly graph (successor to Microsoft Academic Graph) with OA status from Unpaywall | Snapshot of ~**626M records** (Sept 2026 release). The Walden rewrite (2025-11) added "190 million new works" [P] [2][6] | Web app free. API: **free key gives $1/day** [P] [1][3] | Prices per 1,000 calls: lookup by ID/DOI **free**; list/filter **$0.10**; search **$1**; semantic search **$1**; rerank +$1; **PDF download $10** [P] [4]. Keyless budget **$0.10/day, shared by everyone on your IP** [P, observed live] [8]. Rate: 10 req/s without a key, 30 with a free key, 50 on annual plans [P] [5] | **Free CC0 snapshot on S3, quarterly** (2nd Wednesday of Jan/Apr/Jul/Oct). ~745 GB JSONL.gz or ~770 GB Parquet. **Daily** snapshots for paid plans [P] [6] | Plans: Member $5k/yr ($20/day budget); Member+ $10k/yr ($100/day); Partner from $20k/yr [P] [3]. Official **MCP server** at `https://mcp.openalex.org/mcp`, listed in Claude's connector directory [P] [7] |
| **Unpaywall** | DOI to best legal OA copy | Same backend as OpenAlex | Browser extension free | REST API (`api.unpaywall.org/v2/{doi}?email=`) still answering on 2026-10-15. Some fields now return `"deprecated"` [P] [8] | Through OpenAlex [I] | Absorbed into OpenAlex (2025-09-29 rebrand) [P] [2] |
| **Crossref** | DOI registration agency; publisher-deposited metadata | **187,686,167** works; 124,490,631 journal articles; 4,135,598 posted-content/preprints [P, live API] [34] | Free | Polite pool (with `mailto`): observed `x-rate-limit-limit: 3` per `1s`, `x-concurrency-limit: 3` [P, observed headers]. Crossref says "almost none of the metadata is subject to copyright… use it for any purpose", though some abstracts may be copyrighted [P] [34] | Annual public data file. Paid "Metadata Plus" for SLAs [S] | "Over two billion" API calls/month (2026-10-06 blog) [P] [34] |
| **Semantic Scholar (Ai2)** | Paper graph + AI features (TLDRs, SPECTER2 embeddings) | **214M papers, 2.49B citations, 79M authors** [P] [35] | Web free | Unauthenticated: a pool of 1,000 req/s shared by all users. With a key, the "introductory" limit is **1 req/s** [P] [35] | Release `2026-10-06`: papers 200M; abstracts 100M; citations 2.4B; SPECTER2 embeddings 120M (30 × 28 GB files); TLDRs 58M; **S2ORC v2 full text 16M** (parsed from OA PDFs). **Full download needs an API key**; samples are free [P, API] [35] | Licenses per dataset README (I could not read them without a key) |
| **CORE** (Open University, UK) | Aggregator of OA repository and journal full text | **452M** records, **16K** data providers, ">40 million full text" [P] [31] | Free search | API **free without registration**; unregistered rate is "one batch request or five single requests per 10 seconds". Commercial use allowed under its T&Cs [P] [31] | **Older dumps free under ODC-By**; recent dumps licensed (paid) or included with membership [P] [31] | Partners include Consensus (AI search) [P] [31] |
| **BASE** (Bielefeld) | OAI-PMH harvester | ">315 million documents from over 10,000 sources" (2022) [S] [32] (stale?) | Free search | Free API for non-commercial services; EBSCO pays [S] [32] | n/a | Site now behind an Anubis anti-bot wall (observed 2026-10-15) [P] |
| **DOAJ** | Directory of vetted OA journals | **23,611** journals; **14,750** with no APC; **13,796,305** article records [P, live API] [33] | Free | Open JSON API (v4) [P] | Data dumps available [S] | — |
| **Europe PMC** | See §2 | 49.0M records; 12.4M full text | Free | Free REST API | OA subset bulk | — |
| **Lens.org** (Cambia) | Patents + scholarly works | Not verified | Free for search [S] [36] | Scholarly API by request from your Lens profile. Plans not described on the docs page (updated 2026-04-17) [P] [36] | — | Not verified further [low] |
| **Dimensions** (Digital Science) | Commercial research graph | **164M publications**, 8.1M grants, 170M patents, 938k trials, 2.5M policy documents, 42M datasets. ">70% of publications with full-text indexing" [P] [37] | No individual free tier advertised on the homepage. Historically a free web version existed [I, low] | Quote-based | — | Commercial |
| **Google Scholar** | Web-scale academic search | Not disclosed. A 2014 capture-recapture estimate put coverage at 79–90% of English-language articles [S] [38] (stale?) | Free | **No public API**. Scraping is against Google's terms [I, high] | None | Best bibliographic recall in Walters (97%) [53] |

**Key point for builders [I, high]:** "free" now has three tiers.
1. **Truly free bulk:** the OpenAlex quarterly snapshot (CC0), arXiv metadata (CC0) via OAI-PMH, Crossref, DOAJ, older CORE dumps, the PMC OA subset, Europe PMC.
2. **Free but metered APIs:** OpenAlex at $1/day, about 10,000 list calls or 1,000 searches [4]; Semantic Scholar at 1 req/s with a key; CORE throttled.
3. **Paid freshness:** daily OpenAlex sync, recent CORE dumps, Dimensions.

A personal "catalog of everything" is cheapest when built **locally from snapshots** (DuckDB over the OpenAlex Parquet files) and topped up with free singleton lookups.

---

### 4. Policy

#### 4.1 US: OSTP "Nelson memo" (2022-08-25) status

- **Requirement:** agency public-access policies must deliver zero-embargo access to federally funded publications, effective by **2025-12-31**. Persistent-identifier and metadata implementation plans are due by the end of 2026, and in force by the end of 2027 [S] (university guides surfaced in search).
- **Status per SPARC's tracker (page updated 2026-05-04)** [P] [39]:
  - **In effect:** NIH (manuscripts accepted from 2025-07-01); DOE publications (2024-10-01); EPA (2025-01-02); Smithsonian (2025-01-01); NASA SMD only (2022-12-02); FDA (2025-08-15); IMLS and NEH (2025-10-01); **NSF (2026-01-22)**; **USDA (2026-04-07)**; and ACF, ACL, ASPR, Census, CMS, CPSC and USGS (2025-12-31).
  - **Without published updated policies:** DOD (plan December 2024), DOT, DHS, FWS, NIJ, NIST, NOAA, SSA, VA. "A small handful" paused development "pending additional administration guidance".
  - Agencies framed their compliance using the **2025-05-23 "Gold Standard Science" executive order**.
- **[I]** The memo was not rescinded, but the 2025-12-31 deadline was **not uniformly met**. Most big research funders by dollar volume (NIH, NSF, DOE, USDA, NASA SMD) are live.

#### 4.2 NIH

- **Zero embargo:** Author Accepted Manuscripts "accepted for publication in a journal, on or after July 1, 2025" must be in PMC "without embargo upon the Official Date of Publication" [P] [40].
  - That date was pulled forward from the originally scheduled 2025-12-31 (NOT-OD-25-101, listed by SPARC [39]).
- **Publication-cost cap:**
  - NIH's statement of 2025-07-08 announced a cap "starting in Fiscal Year (FY) 2026". It cited publishers charging "up to $13,000" for immediate OA [P] [41].
  - The RFI **NOT-OD-25-138** (2025-07-30) proposed an effective date of **2026-01-01** and five options [P] [42]:
    1. Disallow all publication costs.
    2. $2,000 per paper.
    3. $2,000, or **$3,000** for journals that pay reviewers and publish reviews.
    4. An award cap of the greater of $20,000 or 0.8% of direct costs.
    5. $6,000 per paper plus the award cap.
  - **Final status unverified** (§8).
- **[I]** For readers this is a large structural win: from mid-2025, essentially all new NIH-funded papers (NIH is the largest public funder of biomedical research) should have a free PMC copy at publication.

#### 4.3 Plan S / cOAlition S (Europe-led)

- Plan S launched in September 2018 and has required compliant OA for funded outputs since 2021 [P] [43].
- cOAlition S said in 2021 that support for transformative journals and arrangements was "scheduled to cease at the end of 2024", after which it would "only fund 'pure publishing' agreements" [P] [43]. I did not verify that the end date was kept [~80% it was].
- **2026:** a new **2026–2030 strategy**; Curt Rice appointed Director (2026-05-13); OPERAS made host secretariat (2026-05-12). The **Bengaluru Roadmap on Diamond OA** (2026-05-15) came out of the 3rd Global Diamond OA Summit (2026-02-02 to 06), with 347 participants from 36 countries [P] [43].
- "Towards Responsible Publishing" (consultation November 2023 to April 2024) remains a proposal. I found no adoption notice [P] [43].

#### 4.4 University of California–Elsevier

- UC cancelled its Elsevier subscriptions in 2019. A transformative agreement took effect **2021-04-01** and **now runs to 2027-12-31** [P] [44]. The UC page calls it "four-year" while giving 2021–2027 dates; I read that as an extension [I].
- Terms: 15% APC discount (10% for Cell Press and The Lancet); UC libraries pay the first $1,000 of each APC; full coverage for authors without grants; ~2,300 journals; read access to previously subscribed titles [P] [44].

#### 4.5 JSTOR (individual access, 2026)

| Route | Terms | Status | Evidence |
|---|---|---|---|
| **Free personal account** (formerly "Register & Read") | "Up to 10 free articles every 30 days", read online; Workspace | Active | [P] [46] |
| **JPASS** | **$19.50/month** with 10 PDF downloads, or **$199/year** with 120 PDFs. 2,400+ journals (another page says 2,000+). Unlimited online reading | Active, no discontinuation notice | [P] [45][47] |
| **Early Journal Content / public domain** | Free to everyone: US articles more than 95 years old; non-US more than 143 years old | Active | [P] [46] |
| **Open content** | 13,000+ OA books; 80,000+ research reports from 187 think tanks; nearly 1M open images | Active | [P] [46][47] |
| **Alumni access** | Offered via some institutions' alumni programs | **Not verified** in this pass | [low] |

JSTOR as a whole: 2,800+ journals, 12M+ articles, 158K+ books [P] [47].

---

### 5. Author-request norms

| Practice | What is known | Evidence quality |
|---|---|---|
| **#icanhazPDF** (since 2011) | Tweet the citation plus #icanhazPDF; someone with access emails the PDF; the requester deletes the tweet [S] [50]. **Gardner & Gardner (ACRL 2015):** 1,238 tweets archived, 824 of them requests. ~90% of requests (674) were for journal articles from 493 titles. Overwhelmingly Anglophone (US and UK lead). Most requests are for recent papers, but the oldest was from 1921 [P] [48]. **Swab & Romme (JCHLA 2016):** 302 health-science requests between 2015-02-01 and 04-30; 45% from academic users [P] [49] | Both describe demand only. **Neither measures fulfilment**, because deleted tweets make fulfilment unobservable (stale?) |
| **ResearchGate** "request full text" | Elsevier, ACS and ResearchGate **settled their lawsuit on 2023-09-15** [S] [51]. In Walters 2025, ResearchGate had free full text for 36% of the sample [P] [53] | No fulfilment-rate study found |
| **Emailing the corresponding author** | A long-standing, legal norm. Under typical publishing contracts and green-OA policies, authors may share their accepted manuscript for scholarly purposes [I, med] | **No rigorous success-rate estimate found in this pass** [gap] |
| **Repository "request a copy" buttons** | Common in DSpace and EPrints repositories | Not studied here [gap] |

**[I]** With X/Twitter's decline as a scholarly hub after 2023, #icanhazPDF has probably shrunk. Request-sharing has partly moved to Sci-Net (§6) and to private chats. The absence of good fulfilment data is a measurement opportunity (see Ideas).

---

### 6. Shadow libraries (landscape only)

#### 6.1 Overview table

| Library | Founded | Content | Size (date) | Status Oct 2026 | Key legal actions |
|---|---|---|---|---|---|
| **Sci-Hub** | 2011 | Journal articles, by DOI | **88,343,822 files** (self-reported 2022-07-15) [S] [54] | Corpus largely frozen since about December 2020. Uploads paused under an undertaking to the Delhi High Court. The court found post-2022 articles present in 2025 [S] [54][55]. Elbakyan posted on 2026-01-16 that sci-hub.se was DNS-blocked [S] [54]. An AI chatbot, "Sci-Bot", was reported in April 2026 [S, low-med] [54] | US: Elsevier default judgment of **$15M** (SDNY, June 2017); ACS default of **$4.8M** with ISP/search injunction (E.D. Va., 2017-11-06) [S] [54] (stale?). Blocked in Russia, France, Belgium, Sweden, the UK and India [S] [54]. **India: decided 2025-08-19** (below) |
| **Sci-Net** | **Launched 2025-04-15** | Peer request/upload network for papers | n/a | Rewards uploads with a "$Sci-Hub token" (SCI) on Solana. Strips personal data from uploaded PDFs [S] [54]. Ordered blocked in India [P-ish] [55] | Treated by the Delhi High Court as the same enterprise as Sci-Hub [55] |
| **Library Genesis (LibGen)** | ~2008 | Books, articles (Sci-Hub mirror), comics, fiction | 2.4M non-fiction books, 80M articles, 2.2M fiction, 2M comics, 0.4M magazine issues (2024-02-04) [S] [56] | Fragmented. Lead programmer reported "inactive" in August 2024. Most domains taken offline in December 2024 [S] [56] | **SDNY default judgment of ~$30M (2024-09-26)** for Pearson, McGraw Hill, Macmillan and Cengage, with operators unidentified [S] [56]. December 2024 domain seizures; German CUII block [S] [56] |
| **Z-Library** | ~2009 | Books, articles | ~13.35M books and 84.8M articles (February 2023 data) [S] [57] | Still operating through personal domains, Tor/I2P and apps [S] [57] | **2022-11-03:** 240+ domains seized; two Russian nationals put under house arrest in Argentina; EDNY indictment unsealed 2022-11-16 (criminal copyright infringement, wire fraud, money laundering). **July 2024:** the pair **escaped house arrest** after extradition was approved; an Interpol warrant is out [S] [57]. More seizures in 2023–2024; France ordered 98 more domains blocked (September 2024) [S] [57] |
| **Anna's Archive** | **November 2022** (after the Z-Library seizures; grew out of the "Pirate Library Mirror", PiLiMi) | Metasearch and mirror of LibGen, Sci-Hub, Z-Library, Internet Archive lending scans, DuXiu, HathiTrust and more, plus metadata from WorldCat, Open Library and Google Books | **71,996,952 books and 239,545,528 papers; ~1.1 PB of torrents (2026-10-01, self-reported)** [S] [58]. **>650,000 downloads/day** (March 2025) [S] [58] | Lost .org (January 2026) and the .se and .li domains. Cloudflare stopped serving several domains after the January 2026 court orders; some moved to DDoS-Guard [S] [58]. Still reachable on other TLDs per Wikipedia [S] | See §6.3 |

#### 6.2 Coverage and usage studies

- **Himmelstein et al., *eLife* 2018** (data 2017-03; published 2018-03-01) [P] [52] (stale?): Sci-Hub held **68.9%** of 81.6M Crossref scholarly articles (56.2M). It held **85.1%** of articles in toll-access journals and **96.9% of Elsevier's** 13.1M articles. Because Sci-Hub has been mostly frozen since 2020, its coverage of post-2020 literature is far lower [I, high].
- **Walters, *PNAS* 2025** [P] [53]: on 2023-cited literature, free full text was available for **76%** via Anna's Archive and **72%** via Sci-Hub, against 73% via a university's subscriptions.
- **Usage:** about 400,000 Sci-Hub requests/day (September 2019). Cumulative downloads passed 1 billion in July 2020. China (~25M), the US (~10M) and France (~6M) were the top countries in a 2022 *Nature* analysis [S] [54] (stale?).
- **Bohannon, *Science*, 2016-04-28:** six months of Sci-Hub logs (September 2015 to February 2016) showed heavy use from rich-country campuses as well as from developing countries [S] [54] (stale?).

#### 6.3 Legal actions, 2024–2026 (chronological)

| Date | Action | Outcome | Evidence |
|---|---|---|---|
| 2024-01 | **OCLC v. Anna's Archive** filed (S.D. Ohio) over the scrape of ~1B+ WorldCat records (October 2023) | 2025-11: OCLC dropped its $5.3M damages demand and 8 of 12 claims to pursue a default-judgment injunction [S] [59]. **2026-01:** Judge Michael H. Watson entered a default judgment ordering deletion of WorldCat data and barring scraping [S] [58][60] | [S] |
| 2024-09-26 | Textbook publishers v. LibGen (SDNY) | ~$30M default judgment; domain actions in December 2024 [S] [56] | [S] |
| 2025-04-15 | Sci-Net launches | — | [S] [54][55] |
| **2025-08-19** | **Elsevier Ltd. & Ors. v. Alexandra Elbakyan & Ors., CS(COMM) 572/2020, Delhi High Court** (Justice Manmeet Pritam Singh Arora) | The Department of Telecommunications and MeitY were to direct ISPs within 72 hours to block Sci-Hub (including sci-hub.ru, .se and .st) and Sci-Net (sci-net.xyz). Held to be "rogue websites". **Contempt** found for breaching the 2020-12-24 undertaking not to upload plaintiffs' articles. Elbakyan's 2025-08-15 email calling the uploads a "technical error" was treated as an admission | [S, high; law-firm summary of the judgment] [55] |
| 2025-12 | Anna's Archive announces a Spotify "backup": ~300 TB, 256M metadata rows, 86M audio files planned | Spotify plus UMG, Sony and Warner sue in SDNY; TRO, then a preliminary injunction (2026-01-16, Judge Rakoff) [S] [58] | [S] |
| 2026-01 | annas-archive.org suspended (Public Interest Registry), as were .se and .li | The site at first wrongly attributed the suspension to something other than the Spotify case [S] [58] | [S] |
| 2026-01 (amended complaint) | **Authors v. NVIDIA** (N.D. Cal.) | Alleges NVIDIA's data-strategy team contacted Anna's Archive about "high-speed access" to ~500 TB, including Internet Archive lending books. Anna's Archive allegedly warned that the data was illegally acquired, and NVIDIA management allegedly approved within a week. The complaint does not say NVIDIA paid. Anna's Archive says it never dealt with NVIDIA directly [S] [63] | [S] |
| **2026-04-14/15** | Spotify et al. v. Anna's Archive, default judgment (SDNY, Rakoff) | **$322.2M**: $150,000 statutory maximum × 148 recordings for the labels, plus $2,500 × 120,000 files under DMCA §1203 for Spotify. A worldwide injunction on 10 domains, binding registries, registrars and hosts (PIR, Cloudflare, Njalla, Tucows and others) [S] [61] | [S] |
| **2026-05-19** | 13 publishers v. Anna's Archive (SDNY, Rakoff), filed March 2026 | **Default judgment of $19.5M** ($150,000 × 130 works). All registries and registrars ordered to disable the domains and international hosts to stop hosting [S] [62] | [S] |

**[I] Pattern:** US plaintiffs now routinely obtain default judgments with **global intermediary injunctions** (registries, registrars, CDNs, hosts). These cannot be collected against anonymous operators, but they steadily degrade access. Shadow libraries respond by spreading out (torrents, more TLDs, Tor, Russian CDNs). Their *corpora* are effectively permanent, because they are mirrored as torrents.

#### 6.4 Shadow libraries and AI-training litigation

| Case | Shadow-library facts | Holding / status | Evidence |
|---|---|---|---|
| **Bartz v. Anthropic**, N.D. Cal. No. 3:24-cv-05417 | Anthropic downloaded **196,640 books via Books3** (2021), **≥5M from LibGen** (June 2021) and **≥2M from PiLiMi** (July 2022), building a "central library" of "all the books in the world". It also bought and scanned print books | **Order on Fair Use, 2025-06-23 (Alsup):** training = fair use; print-to-digital format change = fair use; but summary judgment **denied** on whether "pirated library copies must be treated as training copies", so a trial was set on piracy damages. Quote: buying a book later "will not absolve it of liability for the theft" | [P] court PDF [65] |
| Bartz settlement | **482,460 works**; **$1.5B** (~$3,000/work; ~$3,127 by a later calculation); Anthropic must **destroy the LibGen/PiLiMi files**; the release covers only past conduct to 2025-08-25 and **excludes output claims** | **Final approval 2026-07-20** (Judge Araceli Martínez-Olguín, who has presided since 2026-01-01 after Alsup). All objections overruled. **91.3%** of works claimed (440,490 of 482,460). Fees cut to ~$101.5M (~6.8%); service awards cut to $15k. First payments expected by about 2026-11-15 for undisputed works; Anthropic pays in installments through September 2027 | [P] settlement site [69]; [S] [70][71][72][73] |
| **Kadrey v. Meta**, N.D. Cal. No. 3:23-cv-03417 | Meta began using LibGen in October 2022 and abandoned licensing talks once it found LibGen covered most target works. "No dispute that Meta torrented LibGen and Anna's Archive". It disputes how much it uploaded while torrenting [P] [66]. Unsealed emails cite **81.7 TB** torrented, 35.7 TB of it from Z-Library and LibGen [S] [57][58] | **2025-06-25 (Chhabria):** partial summary judgment for Meta on fair use for 13 authors, who "made the wrong arguments". The ruling "does not stand for the proposition that Meta's use… is lawful", and market dilution could win on a better record [P] [66]. A fourth amended complaint adding **contributory infringement for torrenting** was allowed (2026-03). **Summary-judgment hearing on the distribution claims: 2027-02-25** [S] [67][68] | [P]/[S] |
| **Authors v. NVIDIA** | Books3 plus the alleged Anna's Archive approach (above) | Motion to dismiss filed 2026-01-29 [S] [58]; pending [low] | [S] |
| AI firms and Anna's Archive generally | Anna's Archive offered SFTP "high-speed access" to LLM developers in exchange for large donations or datasets; "~20–30 companies or teams" had it as of January 2025 [S] [64]. A DeepSeek VL paper reportedly used its ebook data [S] [58] | — | [S] |

**[I, high] Takeaway:** In the leading US decisions so far, *training* can be fair use, but *acquiring* works from pirate sources, and especially distributing them via BitTorrent, is the liability that cost $1.5B. For anyone building literature tools, provenance of the corpus is the legal crux.

#### 6.5 Legal risk, stated plainly (US-focused; not legal advice)

- **For individual readers** [I, med-high]: downloading a copyrighted article or book from a shadow library without authorization infringes the reproduction right. Statutory damages run from $750 to $30,000 per work, and up to **$150,000 per work** if willful (17 U.S.C. §504(c); courts applied the $150,000 figure in [61][62]).
  - **BitTorrent** downloads usually also upload (leeching or seeding), which adds a distribution claim. That is the live claim against Meta [66][67].
  - Reported US enforcement has targeted operators, intermediaries and large corporate downloaders. I found **no** US suits against individual researchers for reading Sci-Hub papers [I, med; absence of evidence within limited search].
  - Some universities treat Sci-Hub use as a network-security risk (credential phishing) [S] [54].
  - Other jurisdictions block sites at the ISP level: India, the UK, France, Germany, Russia, Belgium, Sweden, the Netherlands and Italy [S] [54][58].
- **For tool builders** [I, high]:
  - Linking to, mirroring, scraping or integrating shadow libraries creates contributory and inducement exposure, and repeats the facts in Bartz and Kadrey.
  - Using shadow-library *metadata* (for example Anna's Archive's WorldCat scrape) has its own risk. OCLC won an injunction based on contract and trespass-type claims, not copyright [59].
  - A "legal-first" design is both the ethical and the commercially defensible choice.

---

## Numbers that matter

| Quantity | Value | Date | Source | Label / confidence |
|---|---|---|---|---|
| OA share of all literature (Crossref sample) | ≥28% (19M articles) | 2018 pub. (data 2017) | [11] | [P] high (stale?) |
| OA share of 2015 articles (Piwowar) | 45% | 2018 | [11] | [P] high (stale?) |
| OA share of articles viewed by Unpaywall users | 47% | 2018 | [11] | [P] high (stale?) |
| OA share of 2022 / 2023 / 2024 articles (OpenAlex) | 59% / 59% / 47% | data pulled 2025-05-13 | [13] | [S] med |
| Free full text, any legal or pirate route combined (Walters) | 94% (89% final version) | 2025-07 | [53] | [P] high |
| Google Scholar free full text (no library links) | 67% (48% final) | 2025-07 | [53] | [P] high |
| Sci-Hub coverage of toll-access articles | 85.1% (Elsevier 96.9%) | data 2017 | [52] | [P] high (stale?) |
| OpenAlex free API budget with key / keyless | $1.00/day / $0.10/day per IP | 2026-02 onward; observed 2026-10-15 | [1][3][8] | [P] high |
| OpenAlex cost per 1,000: list / search / PDF | $0.10 / $1 / $10 (lookups free) | 2026 | [4] | [P] high |
| OpenAlex annual plans | $5k / $10k / from $20k | page updated 2026-08-11 | [3] | [P] high |
| OpenAlex snapshot | ~626M records; ~745 GB JSONL.gz; quarterly free | Sept 2026 release | [6] | [P] high |
| arXiv total submissions | 3,213,484 | 2026-10-15 | [15] | [P] high |
| arXiv submissions 2024 / 2025 / 2026 YTD | 244,031 / 284,486 / 291,296 | CSV 2026-10-15 | [15] | [P] high |
| arXiv September 2026 submissions | 40,363 (vs 20,569 in Sept 2024) | 2026-10-01 | [16] | [P] high |
| arXiv API rate limit | 1 request per 3 s, single connection | current | [23] | [P] high |
| arXiv bulk S3 size | ~9.2 TB (+~100 GB/month) | 2025-04 | [24] | [P] high |
| bioRxiv / medRxiv cumulative | 355,254 / 91,109 | 2026-10-15 | [25] | [P] high |
| PMC full-text articles | 11,327,616 | FY25 | [29] | [P] high |
| Europe PMC records / full text / OA | 49.0M / 12.4M / 8.3M | 2026-10-15 | [30] | [P] high |
| Crossref works / journal articles | 187.7M / 124.5M | 2026-10-15 | [34] | [P] high |
| DOAJ journals / no-APC / articles | 23,611 / 14,750 / 13.8M | 2026-10-15 | [33] | [P] high |
| CORE records / providers / full texts | 452M / 16K / >40M | 2026-10 | [31] | [P] high |
| Semantic Scholar papers / S2ORC v2 full texts | 214M / 16M | release 2026-10-06 | [35] | [P] high |
| Dimensions publications | 164M | 2026 | [37] | [P] high |
| OSF preprints | 203,770 across 32 providers | 2026-10-15 | [27] | [P] high |
| JSTOR free reading | 10 articles per 30 days | 2026 | [46] | [P] high |
| JPASS price | $19.50/mo (10 PDFs) or $199/yr (120 PDFs) | 2026 | [45] | [P] high |
| NIH zero-embargo start | AAMs accepted on or after 2025-07-01 | — | [40] | [P] high |
| NIH proposed publication-cost caps | $2,000; $3,000; $6,000 per paper; or award cap max($20k, 0.8%) | RFI 2025-07-30 | [42] | [P] high (final status unknown) |
| UC–Elsevier agreement term | 2021-04-01 to 2027-12-31 | 2026 | [44] | [P] high |
| Anna's Archive size | 71,996,952 books; 239,545,528 papers; ~1.1 PB | 2026-10-01 | [58] | [S] med (self-reported) |
| Sci-Hub size | 88,343,822 files | 2022-07-15 | [54] | [S] med (stale?) |
| Anthropic downloads (Books3 / LibGen / PiLiMi) | 196,640 / ≥5M / ≥2M | order 2025-06-23 | [65] | [P] high |
| Bartz settlement | $1.5B; 482,460 works; ~$3,000/work; 91.3% claimed | final approval 2026-07-20 | [69][70][73] | [P]/[S] high |
| Spotify v. Anna's Archive default | $322.2M | 2026-04 | [61] | [S] high |
| Publishers v. Anna's Archive default | $19.5M (130 works × $150k) | 2026-05-19 | [62] | [S] high |
| LibGen default judgment | ~$30M | 2024-09-26 | [56] | [S] med |
| Meta torrented volume | 81.7 TB (35.7 TB from Z-Lib/LibGen) | unsealed 2025-02 | [57][58] | [S] med |

---

## Surprises and recent changes (2024–2026)

1. **OpenAlex went freemium in USD** (announced January 2026, priced 2026-02-24). Credits were briefly planned and then replaced with dollar prices. The keyless allowance ($0.10/day) is **shared per IP**, so on a shared or cloud network it can be exhausted before you start. I hit exactly that on 2026-10-15; singleton lookups still worked at $0 [8]. The free snapshot became **quarterly** rather than more frequent; daily freshness is now paid [6]. **Earlier OpenAlex marketing ("no key needed, 100k calls/day") is obsolete** [I, high].
2. **OpenAlex sells OA PDFs** at $0.01 each ($10 per 1,000) and offers a "PDF sync" add-on [4][6]. A metadata graph is turning into a content distributor.
3. **An official OpenAlex MCP server** (`mcp.openalex.org/mcp`) is in Claude's connector directory. Agent searches use reranking, costing 20 credits instead of 10 (~500 searches/day on the free $1) [7].
4. **Unpaywall lost its separate identity** (2025-09-29) [2].
5. **arXiv doubled its monthly submissions in two years** and is rationing: two submissions a month per person, tighter endorsement, English required, peer-review gates for CS surveys, and one-year bans for unchecked LLM output [16][19][20][22]. arXiv also **left Cornell** (2026-07-01) [17].
6. **NIH moved its public-access deadline up six months** to 2025-07-01 and opened a fight over APCs, floating caps as low as $2,000 per paper [40][42].
7. **The Delhi High Court ended a five-year case by blocking Sci-Hub and Sci-Net** and holding Elbakyan in contempt (2025-08-19) [55]. Sci-Hub's comeback strategy (Sci-Net, token bounties, a reported chatbot) is crowd-sourcing new papers rather than scraping them [54].
8. **Anna's Archive went from books to music** (Spotify, December 2025) and drew **$341M+** in default judgments within about five weeks of 2026 [61][62]. It openly sold "high-speed access" to AI companies [64].
9. **The largest US copyright settlement on record ($1.5B) came from shadow-library downloads, not from training itself** [65][69].
10. **A rigorous 2025 PNAS study found Anna's Archive's full-text coverage (76%) exceeded a university library's subscriptions (73%)** [53]. This is evidence that the legal access system still leaves big gaps for older and paywalled works.
11. **The UC–Elsevier deal was extended to the end of 2027** [44]. Transformative agreements are being extended, not abandoned, in the US, even as cOAlition S stopped funding them.
12. **JSTOR's free tier is 10 articles per 30 days** [46], more generous than the 6/month I remembered [I, low on the old figure], and JPASS survives [45].

---

## Contested or uncertain points

1. **OA share levels.** The Piwowar (45% for 2015) and OpenAlex-based (22% for 2015) figures differ by about 2×, because of different denominators and detection methods. The 2024 figure (47%) is almost certainly revised upward later. Bronze is reversible, so "OA share" can *fall* retroactively. Diamond tagging is new and method-dependent [11][13].
2. **OpenAlex keyless access.** The 2026-02-24 blog says keys are required "for all requests" [1]. The help page says you can "make basic queries with no key" at a tenth of the key budget [5]. The live API enforces a $0.10/day shared-IP keyless budget [8]. Treat a key as practically required.
3. **NIH publication-cost cap.** RFI options are verified [42]. Whether a final cap took effect on 2026-01-01, and at what level, is **unverified**. A search snippet said a June 2026 analysis found no final rule; I did not open it [~60% no final cap in force].
4. **Bartz appeals and payment timing.** The settlement site says the parties told the court the Effective Date has passed, "assuming no late-filed appeal goes forward", with first payments by about 2026-11-15 [69]. Writer Beware reports a notice of appeal filed 2026-08-31 that could delay payouts [72]. Unresolved.
5. **Shadow-library sizes.** All are self-reported, with duplicates, multiple formats and metadata-only records mixed in. Anna's "239.5M papers" exceeds Crossref's 124.5M journal articles, so it must include non-DOI items, duplicates or non-journal documents [I, high].
6. **Is Sci-Hub still frozen?** It is officially paused, but the Delhi court found post-2022 articles and Sci-Net supplies new papers [55]. Real coverage of 2021+ literature is unknown.
7. **Walters' 94%.** The combined figure includes pirate sites and possibly the subscription catalog. There is no legal-only number [53]. My ~70–80% legal-only estimate is inference.
8. **Kadrey's reach.** The June 2025 ruling is narrow (13 plaintiffs, a weak market-harm record) and explicitly not a general license. The distribution claim could still produce liability in 2027 [66][67].
9. **Plan S.** I could not confirm that the planned end of transformative-arrangement support in 2024 was actually implemented, or the current number of members [43].
10. **Semantic Scholar rate limits for keyed users** beyond the "introductory" 1 RPS, and S2ORC licensing terms, were not verified (the README needs a key) [35].
11. **Lens.org API pricing** and **Dimensions' free tier** were not verified in this pass [36][37].
12. **Author-request success rates.** No credible estimate found [48][49].

---

## Implications for someone building tools to explore literature

1. **Build on CC0 snapshots, not metered APIs.**
   - Download the OpenAlex Parquet snapshot (~770 GB) once per quarter and query it locally with DuckDB.
   - Use free singleton lookups for freshness on individual works. Spend the $1/day budget on search and list calls only when needed.
   - **Cost example** [I, from [4]]: pulling 1M works via list calls costs ~$1. A personal reading-list monitor of ~50 lookups and 20 searches a day costs ~$0.04/day.
2. **Resolve legal full text in a cascade, and record provenance.** Suggested order:
   1. OpenAlex `best_oa_location` (equivalent to Unpaywall).
   2. arXiv, bioRxiv/medRxiv, PMC and Europe PMC by identifier.
   3. CORE (one batch request per 10 s unregistered).
   4. DOAJ for diamond and gold venues.
   5. Google Scholar "All versions", manually only, since there is no API.
   6. An author email draft.

   Store the source URL, license, version (submitted/accepted/published) and retrieval date with each PDF. Bartz shows that provenance is the legal hinge [65].
3. **Respect redistribution limits.**
   - Metadata is open: OpenAlex is CC0, arXiv metadata is CC0, and Crossref facts are free to use.
   - Most full text is not: arXiv's default license bars re-serving e-prints, so tools must link back [23][24]. Bronze OA has no license at all.
   - A personal tool can cache for "personal or research use" [23]. A *shared* tool should link, not mirror.
4. **The scarce resource is attention.** With 30–40k arXiv submissions a month [15][16], ~1,000/day of new preprints and tens of millions of OA full texts, the high-value tools rank, triage, summarize and track. Semantic Scholar's SPECTER2 embeddings (120M papers) and TLDRs (58M) are ready-made inputs [35].
5. **Policy tailwinds are real but uneven.** NIH-funded work from mid-2025 should be in PMC at publication. NSF, DOE and USDA are live; DOD and several others lag [39][40]. A tool could exploit funder metadata (OpenAlex has funder links) to predict where a free copy *should* exist.
6. **Do not touch shadow libraries in a product.** Their coverage is impressive (Walters [53]), but default judgments in 2026 targeted registrars, CDNs and hosts, and AI companies paid dearly for acquisition. A tool that links to them invites contributory claims, and building corpora from them repeats the Bartz facts [I, high].
7. **Agent integration is cheap now.** OpenAlex's MCP server plus Claude Code means a researcher can prototype a literature agent in an afternoon, but it will burn the $1/day budget quickly through reranked searches (~500/day) [7]. Use local snapshot queries for bulk work.
8. **Expect the commons to keep getting more expensive at the margins.** OpenAlex usage pricing, CORE's licensed recent dumps, Semantic Scholar's keyed bulk access, and Crossref's tight rate headers all point to "open data, metered service". Budget for ~$0–$100/year for a heavy personal user; institutional plans start at $5k [3] [I, med].

---

## Ideas sparked

1. **"Legal Reachability Score" for any reading list.** Paste a bibliography or a review article's DOI. The tool resolves every reference through the legal cascade and reports what fraction you can read legally right now, by year and publisher, with one-click access where possible. Replicating Walters' metric per user would also produce the **missing legal-only coverage statistic** [53].
2. **Calibrated OA-arrival forecaster.** For a closed paper, predict *P(a legal free copy appears within N months)* and the likely route (green after embargo, bronze opening, author deposit, NIH PMC mandate). Train on OpenAlex OA-date histories. Show a calibration plot; this suits a forecasting-minded audience. Add an "alert me when it becomes free" watch list, refreshed with free singleton lookups.
3. **Author-request concierge with measured outcomes.** Draft a short, polite request to the corresponding author, track replies (opt-in), and publish **aggregate fulfilment rates by field, seniority and time since publication**. That fills the evidence gap on author-request success.
4. **Budget-aware OpenAlex client.** A tiny library or MCP wrapper that (a) routes bulk queries to a local DuckDB snapshot, (b) uses free singletons wherever possible, (c) displays the dollar cost of each query before it runs, and (d) caches aggressively. "This query costs $0.12; run against the local snapshot instead?"
5. **Preprint-to-version-of-record diff.** For papers whose only free copy is a preprint or accepted manuscript, align it with the published abstract and figures (where available), and with errata and retractions (Crossref/Retraction Watch). Flag material differences: "free version is v2; published version changed Table 3".
6. **arXiv firehose triage.** At 1,000+ papers a day, a personal ranker using SPECTER2 embeddings, your reading history and LLM screening that flags hallucinated citations (arXiv's own ban criterion [22]). Output a daily digest of 10 papers with "why this one" explanations.
7. **Funder-mandate gap finder.** Join OpenAlex funder data with PMC holdings: "this NIH-funded paper accepted after 2025-07-01 has no PMC copy". Readers get pointers to where a copy should be; authors get a compliance nudge.
8. **Provenance ledger for a personal library.** Every PDF in the library carries a signed record: source URL, license, version and date. Export a "clean corpus" manifest before using the library for RAG or fine-tuning; the lesson from Bartz is that acquisition matters.
9. **Field map of openness.** A treemap or zoomable map of a field (OpenAlex topics) coloured by OA color and closed share, by year. It shows where the paywalls are densest and where diamond venues thrive. Useful for choosing *where to publish* as well as what to read.
10. **"Cheapest legal route" planner.** For a closed paper, compare the routes: JSTOR's free 10 per 30 days, JPASS ($199/yr for 120 PDFs, about $1.66/PDF), public-library databases, interlibrary loan via an affiliation, publisher pay-per-view, or waiting for the forecast OA date. Recommend by price and wait time.
11. **Spatial "citation neighbourhood" reader.** In VR or on a large display, put the paper you are reading at the centre, its references and citers around it, colour-coded by legal availability (readable now / soon / request needed). Clicking a node runs the cascade.
12. **Bulk-download etiquette checker.** A linter for scripts written with Claude Code that warns when code would break the arXiv API terms (more than 1 request per 3 s), Crossref's concurrency headers or OpenAlex budgets, or would re-serve non-licensed full text.

---

## Sources

1. OpenAlex blog, "New Features and Usage-Based Pricing" — https://blog.openalex.org/?p=3953 — 2026-02-24
2. OpenAlex blog, author archive (post listing incl. "We're now OpenAlex" 2025-09-29, Walden beta 2025-10-01, Walden launch 2025-11-03, 2026 roadmap 2026-01-16) — https://blog.openalex.org/author/jason — accessed 2026-10-15
3. OpenAlex Help, Pricing — https://help.openalex.org/access/pricing/ — updated 2026-08-11
4. OpenAlex Help, Example costs — https://help.openalex.org/access/example-costs/ — accessed 2026-10-15
5. OpenAlex Help, Rate limits and authentication — https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication — accessed 2026-10-15
6. OpenAlex Help, Snapshot — https://help.openalex.org/access/snapshot/ — Sept 2026 release info, accessed 2026-10-15
7. OpenAlex Help, Using OpenAlex with an AI assistant (MCP) — https://help.openalex.org/how-to/ai-assistants/ — accessed 2026-10-15
8. OpenAlex API and Unpaywall API live responses and headers (observed by the author) — https://api.openalex.org/works ; https://api.unpaywall.org/v2/ — 2026-10-15
9. OpenAlex blog, page 2 (Q2 2026 Town Hall listing: Member/Member+/Partner tiers, Unpaywall migration) — https://blog.openalex.org/page/2/ — accessed 2026-10-15
10. CASRAI, "OpenAlex API Key Now Required: Usage-Based Pricing" (secondary) — https://casrai.org/news/openalex-api-keys-mandatory-usage-based-pricing-2026 — 2026-07-29
11. Piwowar H. et al., "The state of OA…", PeerJ 6:e4375 (abstract retrieved via the Europe PMC API) — https://pubmed.ncbi.nlm.nih.gov/29456894/ — 2018-02-13 (stale?)
12. Piwowar, Priem & Orr, "The Future of OA" (blog summary) — https://blog.openalex.org/?p=1670 — 2019-10-09 (stale?)
13. Herb U., "Open Access Trends in Scholarly Publishing 2015–2024" — https://rogue-scholar.org/records/1t1dg-xha78 — 2025-05-15
14. Herb U., "Snapshot 2024: Open Access by Academic Discipline" — https://rogue-scholar.org/records/wajg4-1gc80 — 2025-05-20
15. arXiv, Monthly submissions statistics (page and CSV) — https://arxiv.org/stats/monthly_submissions — 2026-10-15
16. arXiv blog, "Fair Moderation, Equitable Access, and AI: arXiv's Updated Rate Limit Policy" — https://blog.arxiv.org/2026/10/01/updated-rate-limit-policy/ — 2026-10-01
17. arXiv blog, "arXiv's next chapter: Updates on our spin out from Cornell University" — https://blog.arxiv.org/2026/06/30/arxivs-next-chapter/ — 2026-06-30
18. arXiv blog index (3M articles 2026-07-09; philanthropic commitments 2026-09-23; CEO/Board 2026-07-30) — https://blog.arxiv.org/ — accessed 2026-10-15
19. arXiv blog, "Attention Authors: Updated Endorsement Policy" — https://blog.arxiv.org/2026/01/21/attention-authors-updated-endorsement-policy/ — 2026-01-21
20. CASRAI, "arXiv 2026 Rules: Endorsement, English, AI Surveys" (secondary) — https://casrai.org/news/arxiv-2026-endorsement-english-ai-policy-changes — 2026
21. 404 Media, "arXiv Changes Rules After Getting Spammed With AI-Generated 'Research' Papers" (search result; not opened) — https://www.404media.co/arxiv-changes-rules-after-getting-spammed-with-ai-generated-research-papers/ — ~2025-10/11
22. TechCrunch, "Research repository ArXiv will ban authors for a year if they let AI do all the work" (search result; not opened) — https://techcrunch.com/2026/05/16/research-repository-arxiv-will-ban-authors-for-a-year-if-they-let-ai-do-all-the-work/ — 2026-05-16
23. arXiv, Terms of Use for arXiv APIs — https://info.arxiv.org/help/api/tou.html — accessed 2026-10-15
24. arXiv, Bulk data access on Amazon S3 — https://info.arxiv.org/help/bulk_data_s3.html — size as of 2025-04
25. bioRxiv and medRxiv statistics APIs — https://api.biorxiv.org/sum/y/json ; https://api.medrxiv.org/sum/y/json — 2026-10-15
26. openRxiv homepage — https://openrxiv.org/ — accessed 2026-10-15
27. OSF API, preprints and providers — https://api.osf.io/v2/preprints/ — 2026-10-15
28. IDEAS/RePEc homepage — https://ideas.repec.org/ — accessed 2026-10-15
29. PubMed Central, About PMC — https://pmc.ncbi.nlm.nih.gov/about/intro/ — last modified 2026-03-09
30. Europe PMC REST API (search hit counts) — https://www.ebi.ac.uk/europepmc/webservices/rest/search — 2026-10-15
31. CORE, About / API / Dataset pages — https://core.ac.uk/about ; https://core.ac.uk/services/api ; https://core.ac.uk/services/dataset — accessed 2026-10-15
32. Wikipedia, "BASE (search engine)" (secondary) — https://en.wikipedia.org/wiki/BASE_(search_engine) — accessed 2026-10-15 (figures 2022, stale?)
33. DOAJ API v4 (journal and article totals) — https://doaj.org/api/v4/search/journals/* — 2026-10-15
34. Crossref REST API (live totals and headers); Crossref REST API docs; Crossref blog — https://api.crossref.org/works ; https://www.crossref.org/documentation/retrieve-metadata/rest-api/ ; https://www.crossref.org/blog/ — 2026-10-15
35. Semantic Scholar API product page; Datasets API release `2026-10-06` — https://www.semanticscholar.org/product/api ; https://api.semanticscholar.org/datasets/v1/release/latest — 2026-10-15
36. Lens API docs; Wikipedia "The Lens" — https://docs.api.lens.org/ ; https://en.wikipedia.org/wiki/The_Lens — updated 2026-04-17
37. Dimensions homepage — https://www.dimensions.ai/ — accessed 2026-10-15
38. Google Scholar About; Wikipedia "Google Scholar" — https://scholar.google.com/intl/en/scholar/about.html ; https://en.wikipedia.org/wiki/Google_Scholar — accessed 2026-10-15
39. SPARC, "2022 Updated OSTP Policy Guidance" agency tracker — https://sparcopen.org/our-work/2022-updated-ostp-policy-guidance/ — updated 2026-05-04
40. NIH Grants & Funding, Public Access policy topic — https://grants.nih.gov/policy-and-compliance/policy-topics/public-access — accessed 2026-10-15
41. NIH statement "NIH to crack down on excessive publisher fees…" (reposted by InfoDocket) — https://www.infodocket.com/2025/07/08/statement-nih-to-crack-down-on-excessive-publisher-fees-for-publicly-funded-research/ — 2025-07-08
42. NIH Guide NOT-OD-25-138, RFI on limiting allowable publishing costs — https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-138.html — 2025-07-30
43. cOAlition S homepage, Annual Review 2025, Bengaluru Roadmap, Transformative Journals, Towards Responsible Publishing — https://www.coalition-s.org/ ; https://www.coalition-s.org/plan-s-annual-review-2025/ ; https://www.coalition-s.org/bengaluru-roadmap-and-action-plan-on-diamond-open-access/ ; https://www.coalition-s.org/transformative-journals/ ; https://www.coalition-s.org/towards-responsible-publishing/ — 2021–2026
44. UC Office of Scholarly Communication, Elsevier OA agreement — https://osc.universityofcalifornia.edu/uc-publisher-relationships/elsevier-oa-agreement/ — accessed 2026-10-15
45. JSTOR, JPASS product page — https://about.jstor.org/products/jpass/ — accessed 2026-10-15
46. JSTOR, Open and free content — https://about.jstor.org/oa-and-free/ — accessed 2026-10-15
47. JSTOR, What's in JSTOR — https://about.jstor.org/whats-in-jstor/ — accessed 2026-10-15
48. Gardner C.C. & Gardner G.J., "Bypassing Interlibrary Loan via Twitter: An Exploration of #icanhazpdf Requests," ACRL 2015 — http://eprints.rclis.org/24847/2/gardner.pdf — 2015 (stale?)
49. Swab M. & Romme K., "Scholarly Sharing via Twitter: #icanhazpdf Requests for Health Sciences Literature," JCHLA — https://journals.library.ualberta.ca/jchla/index.php/jchla/article/viewFile/26060/20282 — 2016 (stale?)
50. Wikipedia, "ICanHazPDF" (secondary) — https://en.wikipedia.org/wiki/ICanHazPDF — accessed 2026-10-15
51. Wikipedia, "ResearchGate" (secondary; 2023-09-15 settlement) — https://en.wikipedia.org/wiki/ResearchGate — accessed 2026-10-15
52. Himmelstein D.S. et al., "Sci-Hub provides access to nearly all scholarly literature," eLife 7:e32822 — https://pmc.ncbi.nlm.nih.gov/articles/PMC5832410/ — 2018-03-01 (stale?)
53. Walters W.H., "Comparing conventional and alternative mechanisms of discovering and accessing the scientific literature," PNAS 122(27) e2503051122 — https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/ — 2025-07-08
54. Wikipedia, "Sci-Hub" (secondary; incl. Sci-Net, usage, lawsuits, 2026 developments) — https://en.wikipedia.org/wiki/Sci-Hub — accessed 2026-10-15
55. SUNS Legal, "Delhi High Court Orders Blocking of Sci-Hub and Sci-Net for Copyright Infringement" — https://sunslegal.com/2025/09/03/delhi-high-court-orders-blocking-of-sci-hub-and-sci-net-for-copyright-infringement/ — 2025-09-03
56. Wikipedia, "Library Genesis" (secondary) — https://en.wikipedia.org/wiki/Library_Genesis — accessed 2026-10-15
57. Wikipedia, "Z-Library" (secondary) — https://en.wikipedia.org/wiki/Z-Library — accessed 2026-10-15
58. Wikipedia, "Anna's Archive" (secondary; size as of 2026-10-01; 2026 legal events) — https://en.wikipedia.org/wiki/Anna%27s_Archive — last edited 2026-10-15
59. TorrentFreak, "Anna's Archive WorldCat Scrape Lawsuit Drops $5M Claim, Pivots to Takedown Tactic" — https://torrentfreak.com/annas-archive-worldcat-scrape-lawsuit-drops-5m-claim-pivots-to-takedown-tactic/ — 2025-11-22
60. Ars Technica, "Judge orders Anna's Archive to delete scraped data; no one thinks it will comply" (cited via Wikipedia; fetch blocked) — https://arstechnica.com/tech-policy/2026/01/judge-orders-annas-archive-to-delete-scraped-data-no-one-thinks-it-will-comply/ — 2026-01
61. TorrentFreak, "Anna's Archive Loses $322 Million Spotify Piracy Case Without a Fight" — https://torrentfreak.com/annas-archive-loses-322-million-spotify-piracy-case-without-a-fight/ — 2026-04-15
62. Publishers Weekly, "Court Rules Against Anna's Archive in Copyright Lawsuit" — https://www.publishersweekly.com/pw/by-topic/digital/copyright/article/100463-court-rules-against-anna-s-archive-in-copyright-lawsuit.html — 2026-05-21
63. TorrentFreak, "NVIDIA Contacted Anna's Archive to Secure Access to Millions of Pirated Books" — https://torrentfreak.com/nvidia-contacted-annas-archive-to-secure-access-to-millions-of-pirated-books/ — 2026-01-19 (updated 2026-02-03)
64. TorrentFreak, "Pirate Libraries Are Forbidden Fruit for AI Companies. But at What Cost?" — https://torrentfreak.com/pirate-libraries-are-forbidden-fruit-for-ai-companies-but-at-what-cost-250131/ — 2025-01-31
65. *Bartz v. Anthropic PBC*, No. C 24-05417 WHA, Order on Fair Use, Dkt. 231 (N.D. Cal.) — https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf — 2025-06-23
66. *Kadrey v. Meta Platforms, Inc.*, No. 23-cv-03417-VC, Order on cross-motions for partial summary judgment, Dkt. 598 (N.D. Cal.) — https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf — 2025-06-25
67. ChatGPT Is Eating the World, "Kadrey v. Meta gets scheduling order; summary judgment hearing for distribution claim won't be heard until Feb. 25, 2027" — https://chatgptiseatingtheworld.com/2026/03/27/kadrey-v-meta-gets-scheduling-order-summary-judgment-motion-hearing-for-distribution-claim-wont-be-heard-until-feb-25-2027/ — 2026-03-27
68. ChatGPT Is Eating the World, "Judge Chhabria grants Kadrey's request to file 4th amended complaint…" (search result) — https://chatgptiseatingtheworld.com/2026/03/25/judge-chhabria-grants-kadreys-request-to-file-4th-amended-complaint-to-add-contributory-infringement-claim-related-to-torrenting-but-judge-strongly-rebukes-kadreys-lawyers-for-pattern-of-blam/ — 2026-03-25
69. Anthropic Copyright Settlement (official settlement website) — https://www.anthropiccopyrightsettlement.com/ — accessed 2026-10-15
70. Authors Guild, "Court Grants Final Approval of Anthropic Copyright Settlement" — https://authorsguild.org/news/court-grants-final-approval-anthropic-copyright-settlement/ — 2026-07-21
71. Authors Alliance, "Bartz v. Anthropic Settlement Receives Final Approval" — https://www.authorsalliance.org/2026/07/21/bartz-v-anthropic-settlement-receives-final-approval/ — 2026-07-21
72. Writer Beware, "Anthropic Settlement Update: Final Settlement Approved" — https://writerbeware.blog/2026/07/23/anthropic-settlement-update-final-settlement-approved/ — 2026-07-23 (updated later)
73. Pearl Cohen, "Federal Court Approves $1.5 Billion Anthropic Copyright Settlement, Largest in History" — https://pearlcohen.com/federal-court-approves-1-5-billion-anthropic-copyright-settlement-largest-in-history — 2026-07
74. Wikipedia, "PhilPapers", "Social Science Research Network", "OpenAlex" (secondary) — https://en.wikipedia.org/wiki/PhilPapers ; https://en.wikipedia.org/wiki/Social_Science_Research_Network ; https://en.wikipedia.org/wiki/OpenAlex — accessed 2026-10-15
