---
title: Open Papers and Preprints
description: How much of the journal literature is legally free (about half of recent articles, about a third of cited pre-2001 work), where the free copies live, the 2025–2026 policy and OpenAlex pricing changes that matter, and an ordered legal workflow for getting any paper, with hit rates recomputed from the best recent coverage study.
---

*Status: draft, October 2026. Counts, prices and policy statuses are as of 2026-10-15 unless another date is given. Live counts (arXiv, bioRxiv/medRxiv, Europe PMC, DOAJ, OSF) come from API calls made that day. The legal-only coverage figures are this wiki's recomputation from the item-level data Walters (2025) published with his paper; the same method reproduces his own all-free-tools figure (94%, 89% final version) exactly. Unverified, and flagged where they come up: SSRN and PhilArchive sizes, the final status of the NIH publication-cost cap, Delta Think's methodology, and every author-request success rate. Sources: the [R02 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R02-open-papers-and-shadow-libraries.md) and primary sources linked inline.*

This chapter covers legal routes only. Shadow libraries appear here only as a benchmark, because the best recent coverage study measured them alongside the legal routes. They have [their own chapter](/access/shadow-libraries/).

## The short version

- **About half of recently published articles have a legal free copy somewhere. The backfile is much less open.** OpenAlex-based counts put the open-access (OA) share at 22% of 2015 articles and 59% of 2022 and 2023 articles ([Herb, May 2025](https://rogue-scholar.org/records/1t1dg-xha78)). Delta Think estimates that "just under 50%" of 2024 articles were published as paid-for OA ([October 2025](https://deltathink.com/news-views-market-sizing-update-2025-has-oa-recovered-its-mojo)).
- **What a reader actually finds is a different number, and it is the one to plan around.** In a hand-search of 875 works cited in 2023 review articles across seven fields, Google Scholar found free full text for **67%**, but only **48%** in the final published version. OpenAlex (the backend of Unpaywall) found 48% ([Walters, *PNAS*, July 2025](https://doi.org/10.1073/pnas.2503051122)).
- **All the free legal tools Walters tested, combined, reach 73% (58% in the final version).** Adding one university library's subscriptions raises that to **88%** (85%). Free tools including the pirate sites reach 94%. Walters does not report the legal-only figures; they are recomputed here from his [Dataset S1](https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12260569/supplementaryFiles).
- **The free routes fail on old work, books and some fields.** They reached 36% of works published before 2001, 1 of 37 cited books, and 51% of chemistry items (against 92% in cardiology). For those, go to a library.
- **If you do two things:** install the [Unpaywall](https://unpaywall.org/) extension, and when it finds nothing, open Google Scholar's "All versions" link. Together they reached 69% (51% final) of Walters' sample, at under a minute per paper. The [workflow below](#a-legal-workflow-for-getting-any-paper) gives the rest of the order.
- **For builders, OpenAlex is no longer free in the old sense.** Since February 2026 it has charged per call, with a \$1/day free allowance per API key. DOI lookups stay free, and so does the full CC0 snapshot ([OpenAlex, 2026-02-24](https://blog.openalex.org/?p=3953)).

## How much of the literature is legally free

### The colors

OA is sorted into "colors" by route. OpenAlex and Unpaywall assign each work its single best route, so in their statistics the colors are mutually exclusive.

| Color | What it means | Can it disappear? | Share of 2024 articles (OpenAlex, Herb) |
|---|---|---|---|
| **Gold** | Published in a fully OA journal, usually CC-licensed, usually with an article processing charge (APC) | No | 21% (excluding diamond) |
| **Diamond** | A fully OA journal that charges neither authors nor readers. A subset of gold, now tagged separately | No | 6% |
| **Hybrid** | An OA article in a subscription journal, usually paid by an APC or a transformative agreement | No | 11% |
| **Bronze** | Free to read on the publisher's site, with no open license | **Yes**: the publisher can close it | 6% |
| **Green** | A copy in a repository or on a preprint server (a preprint or the accepted manuscript) | Mostly no | 2% (undercounted; see below) |
| **Closed** | No legal free copy found by the indexer | — | 53% |

Two facts from this table matter in practice. **Diamond journals are numerous but small.** DOAJ lists 14,750 journals with no APC out of 23,611 (62%), as of 2026-10-15 ([DOAJ](https://doaj.org/)), yet diamond accounts for only about 6% of articles. **Bronze is the one color that can be taken back,** so an "OA share" can fall after the fact. If you need a bronze article, save a copy for personal use.

### Estimates over time

| Estimate | Population | OA share | Date |
|---|---|---|---|
| [Piwowar et al., *PeerJ*](https://doi.org/10.7717/peerj.4375) | All Crossref-DOI articles | **at least 28%** (19M articles) | 2018-02 |
| same | Articles published in 2015 | 45% | 2018-02 |
| same | Articles that Unpaywall users actually viewed | 47% | 2018-02 |
| [Piwowar, Priem & Orr](https://blog.openalex.org/?p=1670) | All articles; projection | 31% in 2019, projected 44% for 2025. Views landing on OA: 52% in 2019, projected 70% for 2025 | 2019-10 |
| [Herb, OpenAlex data pulled 2025-05-13](https://rogue-scholar.org/records/1t1dg-xha78) (single-author analysis; dataset on Zenodo) | OpenAlex "article" records by publication year | 2015 22%; 2018 34%; 2020 42%; 2021 49%; 2022 **59%**; 2023 **59%**; 2024 47% | 2025-05 |
| [Herb, by domain](https://rogue-scholar.org/records/wajg4-1gc80) | 2024 articles, books, chapters and reviews | Life sciences 52%; health 49%; social sciences 41%; physical sciences 38% | 2025-05 |
| [Delta Think market sizing](https://deltathink.com/news-views-market-sizing-update-2025-has-oa-recovered-its-mojo) | Journal output "for which money is likely to be paid, either to read or to publish"; counts only paid-for OA (excludes bronze and green) | "Just under 50%" in 2024; "hovered around 50% (± one percentage point) since 2022" | 2025-10-21 |

Herb's color breakdown, as a share of all OpenAlex articles in each year:

| Year | OA | Gold | Hybrid | Bronze | Green | Diamond |
|---|---|---|---|---|---|---|
| 2015 | 22% | 7% | 3% | 6% | 4% | 3% |
| 2020 | 42% | 19% | 5% | 8% | 5% | 5% |
| 2022 | 59% | 25% | 11% | 10% | 7% | 6% |
| 2023 | 59% | 24% | 13% | 11% | 5% | 7% |
| 2024 | 47% | 21% | 11% | 6% | 2% | 6% |

### Reading the numbers

- **Denominators drive the level.** Piwowar puts 2015 at 45% and Herb at 22%. Piwowar sampled Crossref DOIs. OpenAlex's "article" type also includes many non-DOI and regional records, and the two detect green and bronze differently. Delta Think counts only paid-for OA, yet its figure is higher than OpenAlex's gold plus hybrid (32% for 2024). Its stated scope, publications "for which money is likely to be paid", leaves out most no-fee and regional journals, which probably explains most of the gap [~75%]; the article does not describe its article universe. **Trends are robust; levels are model-dependent** [~75%]. For your own odds, use the reader-side numbers in the next section, not OA shares.
- **The 2024 dip is partly lag.** From 2023 to 2024, bronze and green, which arrive late (after embargoes or delayed opening), fell by 8 points. Gold, hybrid and diamond, which are open at publication, fell by 6 (components are rounded). Herb tentatively attributes part of the fall to policy shifts at "controversial Open Access publishers". Expect an upward revision of 2024 [~75%], but probably not all the way back to 59% [~60%].
- **Green is probably undercounted most in the reader's own fields.** Physical sciences show the lowest share (38%), even though arXiv makes much of physics, mathematics, statistics and CS free as preprints. If OpenAlex fails to link a preprint to its published version, the article counts as closed [~60% that this explains a meaningful part of the gap]. In arXiv-heavy fields, search arXiv directly instead of trusting an OA-status lookup.

### What a reader actually experiences

The figures above count articles. A researcher works through reference lists, which include books, working papers and older work. The best measurement of that experience is [Walters (*PNAS* 122(27), e2503051122, July 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12260569/). Walters drew 70 review articles from 2023 (10 per field in chemistry, materials science, cardiology, public health, economics, education and psychology), randomly sampled 875 of their 16,502 cited works, and searched for each one by hand, with title variants, DOI and author searches, in 15 discovery and access tools.

Walters publishes a yes/no result for every work in every tool (Dataset S1, Worksheet 3). The rows marked "recomputed" are unions calculated here from that file. The same calculation over all free tools gives 93.7% and 89.0%, matching the paper's 94% and 89%.

| Tool | Bibliographic record found | Free full text, any version | Free full text, final version |
|---|---|---|---|
| Google Scholar (no library links) | **97%** | **67%** | 48% |
| OpenAlex (= Unpaywall's data) | 95% | 48% | 35% |
| PubMed (cardiology sample only) | — | 84% | 78% |
| PubMed (public health sample only) | — | 42% | 33% |
| ResearchGate | 92% | 36% | 29% |
| Dimensions | 91% | 42% | 25% |
| Academia.edu | 31% | 29% | 23% |
| **All free legal tools above, plus ERIC (recomputed)** | — | **73%** | **58%** |
| *One university library's subscriptions (not free)* | 95% | 73% | 72% |
| **Free legal tools plus that library (recomputed)** | — | **88%** | **85%** |
| *Anna's Archive (pirate)* | 93% | 76% | 70% |
| *Sci-Hub (pirate)* | 73% | 72% | 67% |
| *All free tools, including the pirate sites (Walters)* | — | 94% | 89% |

Coverage differs sharply by what is being cited (recomputed; any version unless stated):

| Subset of the 875 works (n) | Free legal tools | Plus one university library | Free tools including pirate sites |
|---|---|---|---|
| Journal articles (763) | 78% (61% final) | 93% | 97% |
| Working papers (61) | 62% | 67% | 62% |
| Books (37) | 3% | 30% | 95% |
| Published before 2001 (64) | 36% | 67% | 92% |
| Published 2001–2012 (215) | 77% | 87% | 98% |
| Published 2013–2020 (444) | 77% | 91% | 95% |
| Published 2021–2024 (152) | 74% | 88% | 84% |
| Cardiology (125) | 92% | 97% | 97% |
| Economics (125) | 79% (43% final) | 86% | 93% |
| Chemistry (125) | 51% | 78% | 91% |

What this means for a reader:

- **Google Scholar dominates, but it is not the whole legal union.** Walters reports that it "includes at least 99% of the records available through each of the other" tools, and that the more comprehensive tools "tend to include the vast majority of the full-text documents" the smaller ones find. Still, the other legal tools add 6 points of any-version copies and 10 points of final-version copies to Google Scholar's 67% and 48%. ResearchGate and Academia.edu supply 7 of those 10 final-version points.
- **Version matters.** 19 of Google Scholar's 67 points are not the final version. Economics shows the gap at its widest, because the field circulates working papers: Google Scholar found some version of 72% of economics items, but the final version of only 33%.
- **Funder mandates show up clearly.** PubMed reached 84% free full text in cardiology, which Walters attributes to OA mandates of health-science funders, and the legal union reached 92% there.
- **A university library adds about 15 points.** Subscriptions alone gave 73%. Combined with the free legal routes they gave 88%. For 2021–2024 publications, legal routes plus the library (88%) beat the free tools including pirate sites (84%), because pirate coverage "drops off precipitously" for recent work. The library in the study is Manhattan University's, with subscriptions costing over \$500,000 a year; a large research library would probably do better [~80%]. See [University and Employer Access](/access/academic-and-employer/).
- **Old work and books are where the free routes fail.** Pre-2001 work was 36% legally free and cited books 3%. The pirate sites fill most of that gap, which is why they look strong overall. The legal routes for these are libraries, interlibrary loan and JSTOR; see [Public Libraries](/access/public-libraries/) and [Open-Access Books and Textbooks](/access/open-books/).
- **Limits of the recomputation.** Walters did not test arXiv, SSRN, RePEc, Europe PMC, CORE or author homepages separately; Google Scholar indexes many of them. His fields leave out ML, statistics, physics and philosophy. Some ResearchGate and Academia.edu copies are uploads that breach publisher policy (see [Asking the author](#asking-the-author)).

## Where the free versions live

Three kinds of service matter. **Resolvers** take a DOI and return the best legal copy. **Servers and repositories** hold the copies. **Directories** tell you which journals are open. All are free to read unless the table says otherwise. Sizes are as of 2026-10-15 unless dated otherwise.

| Service | Type and field | Size (date) | What you get | Catch | Link |
|---|---|---|---|---|---|
| **Unpaywall** | Resolver, all fields | Same database as OpenAlex | Free browser extension that shows a tab on article pages, linking to a legal copy when one exists. REST API (`api.unpaywall.org/v2/{doi}?email=`) | Since 2025-09-29 a subsystem of OpenAlex. The API still answered on 2026-10-15, with some legacy fields returning `"deprecated"` | [unpaywall.org](https://unpaywall.org/) |
| **OpenAlex** | Scholarly graph with OA status | About 586M records in the 2026-10-14 snapshot (464.8M works) | Free web app. API: free DOI lookups, then \$1/day free with a key. Free CC0 snapshot | Metered since February 2026 (see [below](#the-openalex-pricing-change)). Free full text for 48% of Walters' sample | [openalex.org](https://openalex.org/) |
| **Google Scholar** | Web-scale search, all fields | Not disclosed | Best recall: a record for 97% and free text for 67% of Walters' sample. "All versions" clusters preprints, accepted manuscripts and repository copies | No API, and scraping breaks Google's terms | [scholar.google.com](https://scholar.google.com/) |
| **CORE** (Open University) | Aggregator of repository and journal full text | 452M records from 16K providers, more than 40M full texts ([CORE](https://core.ac.uk/about), 2026-10) | Full-text search across institutional repositories. API free without registration; older data dumps free under ODC-By | Unregistered API: one batch or five single requests per 10 s. Recent dumps are paid | [core.ac.uk](https://core.ac.uk/) |
| **BASE** (Bielefeld) | OAI-PMH harvester | Over 315M documents from over 10,000 sources (2022, per [Wikipedia](https://en.wikipedia.org/wiki/BASE_%28search_engine%29); stale) | Search across repositories, with filters for OA status | Behind an anti-bot wall (observed 2026-10-15). API for non-commercial services only | [base-search.net](https://www.base-search.net/) |
| **arXiv** | Preprint server: physics, math, CS, stats, quantitative biology and finance, EESS, economics | 3,213,484 submissions; 284,486 in 2025; a record 40,363 in September 2026, about 1,300 a day ([stats](https://arxiv.org/stats/monthly_submissions)) | Free PDFs and source. Metadata CC0. Bulk files on S3 (about 9.2 TB in April 2025) | Mostly preprints, not the version of record. API limited to 1 request per 3 s on a single connection ([terms](https://info.arxiv.org/help/api/tou.html)) | [arxiv.org](https://arxiv.org/) |
| **bioRxiv / medRxiv** | Preprint servers: life and health sciences | 355,254 and 91,109 papers to date ([API](https://api.biorxiv.org/sum/y/json)) | Free PDFs and full text; public JSON API | Preprints, not peer reviewed; read medRxiv clinical claims with care. Run by the nonprofit [openRxiv](https://openrxiv.org/) | [biorxiv.org](https://www.biorxiv.org/), [medrxiv.org](https://www.medrxiv.org/) |
| **SSRN** | Working papers: economics, law, finance, social sciences | Not verified (the site blocks automated fetching) | Free downloads for most papers | Usually needs registration or a CAPTCHA, and some content is paid. Owned by Elsevier since 2016 | [ssrn.com](https://www.ssrn.com/) |
| **RePEc / IDEAS** | Index of economics working papers and articles | Over 5.5M items ([IDEAS](https://ideas.repec.org/)) | Links to working-paper versions across hundreds of series | IDEAS counts paywalled publisher links as "downloadable". Volunteer-run | [ideas.repec.org](https://ideas.repec.org/) |
| **PhilArchive / PhilPapers** | Philosophy repository and index | Not verified | PhilPapers indexes the field; PhilArchive holds the OA copies | Coverage unknown from this research | [philarchive.org](https://philarchive.org/) |
| **OSF Preprints** | Community servers (PsyArXiv, SocArXiv and others) | 203,770 public preprints across 32 providers ([API](https://api.osf.io/v2/preprints/)) | Free; open JSON:API | Mostly psychology and social science preprints | [osf.io/preprints](https://osf.io/preprints) |
| **PubMed Central (PMC)** | Biomedical full-text archive (NIH/NLM) | 11,327,616 articles (FY25; [About PMC](https://pmc.ncbi.nlm.nih.gov/about/intro/)) | Free full text; OA subset for bulk use | The deposit target for NIH's zero-embargo policy. Not all PMC articles are openly licensed | [pmc.ncbi.nlm.nih.gov](https://pmc.ncbi.nlm.nih.gov/) |
| **Europe PMC** | Life sciences search plus preprints (EMBL-EBI) | 49,018,570 records: 12,408,637 full text, 8,324,232 in the OA subset, 1,259,436 preprints ([REST API](https://www.ebi.ac.uk/europepmc/webservices/rest/search)) | One search across PubMed, PMC and preprints, with a free REST API that needs no key | Full text exists for about a quarter of its records | [europepmc.org](https://europepmc.org/) |
| **DOAJ** | Directory of vetted OA journals | 23,611 journals (14,750 with no APC); 13.8M article records | Tells you whether a venue is fully OA; open API | Covers only fully OA journals, not hybrid or green | [doaj.org](https://doaj.org/) |
| **US funder repositories** | NSF Public Access Repository; DOE's OSTI; CDC Stacks | Counts not checked | Accepted manuscripts from federally funded work | Agency coverage is uneven ([below](#the-nelson-memo-agency-by-agency)) | [par.nsf.gov](https://par.nsf.gov/), [osti.gov](https://www.osti.gov/) |
| **ResearchGate / Academia.edu** | Author-uploaded copies | — | Free text for 36% and 29% of Walters' sample. After Google Scholar and OpenAlex, together they add 3 points of any-version and 7 points of final-version copies (recomputed) | Many uploads breach publisher policy ([below](#what-is-measured)) | [researchgate.net](https://www.researchgate.net/) |

**Which repository for which field:**

- **ML, statistics, physics, mathematics:** arXiv first. In ML and much of theoretical CS a preprint posted to arXiv is the norm, so this step usually ends the search [~80%]. Check the latest version (v2, v3 and so on), which is often the camera-ready text.
- **Economics and decision theory:** RePEc/IDEAS and SSRN, then the author's homepage. Expect a working paper, not the published version: in Walters' economics sample, Google Scholar found some version of 72% of works but the final version of only 33% (recomputed).
- **Biomedicine and public health:** Europe PMC, which searches PMC and bioRxiv/medRxiv together. For NIH-funded work accepted on or after 2025-07-01, PMC should hold the accepted manuscript from the publication date.
- **Psychology and social science:** OSF (PsyArXiv, SocArXiv), then SSRN.
- **Philosophy:** PhilArchive, then PhilPapers to find other versions.
- **Anything else:** Google Scholar "All versions", then CORE's full-text search, which reaches institutional repositories that Google Scholar sometimes misses [~50%; untested].

**arXiv's 2025–2026 rule changes constrain authors, not readers:** tighter endorsement ([January 2026](https://blog.arxiv.org/2026/01/21/attention-authors-updated-endorsement-policy/)), one-year bans in CS for "incontrovertible evidence" of unchecked LLM output such as hallucinated references ([announced May 2026](https://techcrunch.com/2026/05/16/research-repository-arxiv-will-ban-authors-for-a-year-if-they-let-ai-do-all-the-work/)), and at most two submissions per submitter per calendar month ([from 2026-10-01](https://blog.arxiv.org/2026/10/01/updated-rate-limit-policy/)). arXiv became an independent nonprofit on 2026-07-01 and says it stays free to read and to submit ([arXiv](https://blog.arxiv.org/2026/06/30/arxivs-next-chapter/)). For a reader, the problem with arXiv is volume, not access: at about 1,300 submissions a day, triage tools are worth more than access tools. See [AI Research Assistants](/finding/ai-research-assistants/).

## The policy changes that matter

### NIH: zero embargo from July 2025

NIH requires that author accepted manuscripts "accepted for publication in a journal, on or after July 1, 2025" be in PMC "without embargo upon the Official Date of Publication" ([NIH](https://grants.nih.gov/policy-and-compliance/policy-topics/public-access)). SPARC lists the policy as covering new and existing awards. It was moved up from the originally planned 2025-12-31. The change is in timing, not coverage: the 2008 policy already put NIH-funded papers in PMC, but allowed an embargo of up to 12 months. Recent NIH-funded work is now free at publication instead of a year later.

**The publication-cost cap is unresolved.** On 2025-07-08 NIH said it "will introduce a cap on allowable publication costs starting in Fiscal Year (FY) 2026", noting that some publishers charge "as much as \$13,000 per article" for immediate OA ([NIH](https://www.nih.gov/news-events/news-releases/nih-crack-down-excessive-publisher-fees-publicly-funded-research); text checked via an [InfoDocket repost](https://www.infodocket.com/2025/07/08/statement-nih-to-crack-down-on-excessive-publisher-fees-for-publicly-funded-research/)). Its request for information, [NOT-OD-25-138](https://grants.nih.gov/grants/guide/notice-files/NOT-OD-25-138.html) (2025-07-30), proposed a start date of 2026-01-01 and five options:

1. Disallow all publication costs.
2. Cap at \$2,000 per paper.
3. Cap at \$2,000, or \$3,000 for journals that pay peer reviewers and publish the reviews.
4. Cap each award's total publication spending at the greater of \$20,000 or 0.8% of direct costs.
5. Cap at \$6,000 per paper, plus the award cap.

As of 2026-10-15, the NIH public-access page (last updated 2025-06-23) mentions no cap. A web search found no final notice. A secondary guide updated 2026-09-14 still describes the cap as not finalized ([CASRAI](https://www.casrai.org/guides/nih-open-access-publishing-fee-limits)). I put about 75% on no final per-article cap being in force as of October 2026. For readers the cap matters only indirectly: if APCs stop being allowable, more NIH authors will rely on the free green route through PMC, which the zero-embargo policy already guarantees.

### The Nelson memo, agency by agency

The 2022 OSTP memo told US agencies to require zero-embargo public access to funded publications by 2025-12-31. The memo was not rescinded, but not every agency met the deadline. SPARC lists the 2025-05-23 "Restoring Gold Standard Science" executive order among the White House guidance the current policies rest on. Status per SPARC's tracker, [updated 2026-05-04](https://sparcopen.org/our-work/2022-updated-ostp-policy-guidance/):

| Agency | Publications policy in effect | Applies to | Repository named |
|---|---|---|---|
| NIH | 2025-07-01 | New and existing awards | PMC |
| DOE | 2024-10-01 | New and existing awards | OSTI |
| NSF | 2026-01-22 | **New awards only** | NSF-PAR (per NSF's site) |
| USDA | 2026-04-07 | New and existing awards | — |
| NASA | 2022-12-02, Science Mission Directorate only | New awards; "the public access policy for all of NASA is not yet in effect" | — |
| CDC | 2024-04-08 | New awards only | CDC Stacks |
| EPA, FDA, IMLS, NEH, Ed, AHRQ, Smithsonian | 2024–2025 (various dates) | Mostly new awards (AHRQ: new and existing; Smithsonian: intramural only) | — |
| ACF, ACL, ASPR, Census, CMS, CPSC, USGS | 2025-12-31 | Varies | — |
| DOD, DOT, DHS, FWS, NIJ, NIST, NOAA, SSA, VA | **No updated policy published**; SPARC says "a small handful" of agencies have put policy development on hold pending administration guidance | — | — |

**What this means:** most of the large civilian research funders (NIH, NSF, DOE, USDA, NASA science) now attach free-reading conditions to their grants. "New awards only" policies, NSF's among them, take years to reach steady state, because papers from existing grants keep appearing for several years [~80%]. Defense-, NIST- and NOAA-funded work, which matters for some forecasting and risk research, is not yet covered.

### Plan S and Europe

[cOAlition S](https://www.coalition-s.org/) has required compliant OA for its funders' outputs since 2021. In January 2023 it confirmed that "as a principle, its members will no longer financially support" transformative arrangements after 2024, that individual funders may still do so as part of national strategies, and that support for Transformative Journals would "cease at the end of 2024" ([cOAlition S, 2023-01-26](https://www.coalition-s.org/coalition-s-confirms-the-end-of-its-financial-support-for-open-access-publishing-under-transformative-arrangements-after-2024/)). I found no primary document on how many funders took the national-strategy exception [~80% that most members stopped paying]. Its site now carries a 2026–2030 strategy and the [Bengaluru Roadmap on Diamond OA](https://www.coalition-s.org/bengaluru-roadmap-and-action-plan-on-diamond-open-access/) (2026-05-15), the output of the third Global Summit on Diamond OA. For readers the effect is steady: work funded by cOAlition S members should be free to read at publication [~85%].

US transformative deals continue. The [University of California–Elsevier agreement](https://osc.universityofcalifornia.edu/uc-publisher-relationships/elsevier-oa-agreement/) now runs from 2021-04-01 to 2027-12-31. It gives a 15% APC discount (10% for Cell Press and The Lancet), with UC libraries paying the first \$1,000 of each APC, so papers by UC authors in Elsevier journals are more likely to be hybrid OA.

### Decision rules from the policies

- **NIH-funded paper accepted on or after 2025-07-01, with no PMC copy:** either the deposit is late or the author is out of compliance. An email asking for the accepted manuscript has a strong rationale, and the author has a reason to act.
- **Older NIH-funded paper:** the 2008 policy allowed up to a 12-month embargo, so check PMC anyway.
- **DOE- or NSF-funded paper:** search OSTI or NSF-PAR by title before emailing anyone.
- **Funding unknown:** OpenAlex records funders for many works, and the funding statement on the landing page or in the PDF front matter usually names them.

## JSTOR for individuals

JSTOR matters most for humanities, social science, economics and statistics backfiles: 2,800+ journals, 12M+ articles and 158K+ books in total ([JSTOR](https://about.jstor.org/whats-in-jstor/)). Most of it is paywalled, so the free routes above rarely reach it, and it is strongest exactly where they are weakest: pre-2001 work.

| Route | Terms (as of October 2026) | Cost | Effective cost per article | Use it when |
|---|---|---|---|---|
| **Free personal account** | "Up to 10 free articles every 30 days", read online only ([JSTOR](https://about.jstor.org/oa-and-free/)) | \$0 | \$0, up to about 120 articles a year | You read fewer than 10 JSTOR articles a month and don't need the PDF |
| **JPASS, monthly** | Unlimited online reading plus 10 PDF downloads a month; 2,400+ journals ([JSTOR](https://about.jstor.org/products/jpass/)) | \$19.50/month | \$1.95 per PDF | A burst of reading on one project |
| **JPASS, annual** | Unlimited online reading plus 120 PDFs a year | \$199/year | \$1.66 per PDF | You regularly need JSTOR PDFs to annotate or keep |
| **Early Journal Content** | Free to everyone: US articles more than 95 years old, non-US more than 143 years old | \$0 | \$0 | Historical statistics, economics and philosophy |
| **Open content** | 13,000+ OA books, 80,000+ think-tank research reports, nearly 1M open images | \$0 | \$0 | Policy reports and OA monographs |
| **Alumni access** | Offered through some universities' alumni programs | Varies | — | Not verified; check your alma mater |

Before paying, check whether your public library or an alumni program includes JSTOR (some do; I did not survey which); see [Public Libraries](/access/public-libraries/) and [University and Employer Access](/access/academic-and-employer/). **One constraint matters for tool builders:** JSTOR's terms (updated 2026-04-24) prohibit activity that "automatically downloads or exports Content, including activities involving web scraping", and using content "to train large language models or other generative AI technologies". JSTOR may suspend access for a user or IP address ([JSTOR terms](https://about.jstor.org/terms)). JPASS PDFs are for reading, not for feeding a bulk pipeline. See [The Legal Map](/building/legal-map/).

## Asking the author

Emailing the corresponding author for a copy is a long-standing, legal norm. Authors can usually share at least their accepted manuscript: in a 2017 sample, 88.3% of journals allowed some form of self-archiving ([Jamali](https://doi.org/10.1007/s11192-017-2291-4)). Private sharing terms vary by publisher. Jisc's [Open Policy Finder](https://openpolicyfinder.jisc.ac.uk/), which replaced Sherpa Romeo and Sherpa Juliet in November 2024, lists each journal's sharing rules by version.

### What is measured

**No published study measures how often a request for a paper copy is fulfilled.** This is the largest evidence gap in the chapter. What exists:

| Evidence | Finding | Limits |
|---|---|---|
| #icanhazPDF on Twitter ([Gardner & Gardner, ACRL 2015](http://eprints.rclis.org/24847/2/gardner.pdf)) | 1,238 tweets archived, 824 of them requests, 674 of those for journal articles; the oldest request was for a 1921 paper | Measures demand only. Requesters delete fulfilled tweets, so fulfilment is unobservable |
| #icanhazPDF, health sciences ([Swab & Romme, JCHLA 2016](https://journals.library.ualberta.ca/jchla/index.php/jchla/article/viewFile/26060/20282)) | 302 requests in three months of 2015; 45% from academic users | Demand only |
| ResearchGate "request full-text" ([help page](https://help.researchgate.net/research-and-publications/discovering-and-requesting-research)) | Requests reach only authors who have confirmed authorship on ResearchGate. They can share publicly, send a private copy, or ignore the request | No fulfilment study found |
| ResearchGate uploads ([Jamali, *Scientometrics* 2017](https://doi.org/10.1007/s11192-017-2291-4)) | Of 500 full texts sampled, 392 were not OA. Of those, 201 (51.3%) breached the publisher's policy, and 97.5% of breaches involved the publisher PDF, though 88.3% of the journals allowed some self-archiving | Old, and about compliance, not fulfilment |
| **Closest analog:** covert requests to corresponding authors ([Teunis et al., *CORR* 2015](https://doi.org/10.1007/s11999-014-3868-3)) | 446 authors of 2003–2013 biomedical papers were asked, under a pretext, for data not reported in the paper. 43% replied; 53% of those with working addresses; 20% of addresses bounced. The odds of a reply fell 15% per year since publication (OR 0.85), and 49% of addresses from 2003 papers were dead | A request for *data*, which costs the author more than forwarding a PDF |
| Contact method ([Guevara et al., Cochrane Colloquium 2005](https://abstracts.cochrane.org/2005-melbourne/how-do-authors-respond-written-requests-additional-information)) | Email requests got a 62.5% response vs 27.3% by post (n=16 and 11), in a mean of 36 days | Tiny sample; requests for methods details or missing data |

### My estimate, and how to beat it

Forwarding a PDF costs an author about a minute, so fulfilment should beat the data-request analog [~75%]. My estimates, extrapolated from Teunis and Guevara [~55% that the true rates fall in these ranges]:

- **Paper under 5 years old, working address:** a copy arrives within two weeks 50–70% of the time.
- **Paper 5–10 years old:** 35–55%, mostly lost to dead addresses.
- **Paper over 10 years old:** under 30% using the printed address.

How to raise the odds:

- **Find a live address.** Use the author's current institution (from OpenAlex's author record, ORCID or a homepage), not the email printed on a paper from a decade ago. This is the biggest lever for older papers.
- **Write to the first and last authors as well as the corresponding author** if the paper is more than a few years old.
- **Ask for the accepted manuscript,** which the author can usually share. Say in one sentence why you want it.
- **Send one polite follow-up after a week,** then stop.

A request that works in practice:

> Subject: Request for a copy of "[title]" ([journal], [year])
>
> Dear Dr. [name], I'm working on [one line, e.g. "a review of calibration methods for ensemble forecasts"] and your paper looks directly relevant, but I don't have access to [journal]. Would you be willing to send me a copy, or the accepted manuscript? Many thanks, [name, affiliation if any]

For a tool builder, measuring this is cheap. A request helper that logs (opt-in) whether a copy arrived would produce the first real fulfilment rates by field and paper age. See [Open Problems](/reference/open-questions/).

## The OpenAlex pricing change

OpenAlex is the open scholarly graph that replaced Microsoft Academic Graph. Since 2025-09-29 it has also been the home of Unpaywall. On 2026-02-24 it switched from a free, rate-limited API to usage-based pricing in US dollars ([announcement](https://blog.openalex.org/?p=3953); [pricing](https://help.openalex.org/access/pricing/), updated 2026-08-11; [example costs](https://help.openalex.org/access/example-costs/)).

| Item | Terms as of October 2026 |
|---|---|
| Free API key | \$1/day of usage, reset at midnight UTC; no payment method needed |
| No key | \$0.10/day, **shared by everyone on your IP address** (documented on the example-costs page; observed in live API headers on 2026-10-15) |
| Lookup of one work by ID or DOI | Free |
| List or filter | \$0.10 per 1,000 calls |
| Search (keyword or semantic) | \$1 per 1,000; reranking adds \$1 per 1,000 |
| PDF or XML download | \$10 per 1,000 (\$0.01 each) |
| Rate limits | 10 requests/s with no key, 30 with a free key, 50 on annual plans ([docs](https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication)) |
| Annual plans | Member \$5,000/year (\$20/day budget); Member+ \$10,000/year (\$100/day, plus daily sync with a full daily snapshot); Partner from \$20,000/year (\$200+/day) |
| Full snapshot | Free, CC0, on S3. The stated schedule is quarterly (second Wednesday of January, April, July and October), but 2026 has had nine releases so far, roughly monthly to June, then 2026-09-23 and 2026-10-14 ([release notes](https://openalex.s3.amazonaws.com/RELEASE_NOTES.txt)). The 2026-10-14 release is about 755 GB as JSONL.gz or 801 GB as Parquet |
| AI integration | An official MCP server at `https://mcp.openalex.org/mcp` ([docs](https://help.openalex.org/how-to/ai-assistants/)); agent searches are reranked, so about 500 a day fit in the free \$1 |

**What it means for a reader:** nothing, if you use the web app or the Unpaywall extension.

**What it means for a builder** (see [Costs and Effort](/building/costs-and-effort/)):

- **Get a key, even for hobby scripts.** The documentation disagrees on whether keyless use is allowed: the announcement says "you'll need an API key for all requests" (with "a few calls" allowed "for demo purposes"), while the help page allows "basic queries with no key at all". The keyless budget is shared per IP, so on a cloud VM, a university network or a shared office it can be gone before your script starts.
- **OA lookups for a bibliography are free.** Resolving a 200-reference list by DOI costs \$0, because singleton lookups cost nothing. A reading-list monitor running 50 lookups and 20 searches a day costs about \$0.02/day, or \$0.04 with reranking.
- **Bulk work belongs on the snapshot.** \$1/day buys about 10,000 list calls or 1,000 searches. Anything corpus-scale (all works in a field, citation graphs, topic maps) is cheaper as DuckDB queries over the Parquet files, at the price of an 800 GB download and data that can be weeks to months old. See [A Reference Architecture](/building/reference-architecture/).
- **Freshness is the paid product.** Daily data comes with Member+ and above. A personal tool that needs this week's papers should take new arXiv and bioRxiv items from those servers' own free feeds and use OpenAlex for the backfile.
- **OpenAlex now sells content as well as metadata.** At \$0.01 per OA PDF, the free \$1 buys 100 PDFs a day. For a personal tool that needs a few dozen PDFs a day, that is simpler than writing your own fetcher across hundreds of repositories [~70%]. Check each PDF's license before redistributing it.

I read the change as part of a trend toward "open data, metered service": CORE charges for recent dumps, Semantic Scholar requires a key for bulk data, and Crossref's polite pool allows 3 requests per second. A heavy personal user should budget \$0–\$100 a year [~70%].

## A legal workflow for getting any paper

The steps are ordered by cost in time, not by coverage. Cumulative hit rates through step 4 and for the library in step 7 are measured or recomputed from Walters' sample (works cited in 2023 review articles across seven fields). The rest are my estimates, with confidence stated.

| Step | Action | Time | Cumulative chance of a legal copy (any version / final version) | Basis |
|---|---|---|---|---|
| 0 | **Pin down the identifier.** Get the DOI from the reference, [Crossref search](https://search.crossref.org/) or Google Scholar. For a preprint, get the arXiv/bioRxiv ID | Seconds | — | Google Scholar finds a record for 97% (measured) |
| 1 | **Unpaywall extension or an OpenAlex DOI lookup.** Click the extension's tab on the publisher page, or query `api.openalex.org/works/doi:...` and read `best_oa_location` | Seconds | 48% / 35% | Measured (OpenAlex) |
| 2 | **Google Scholar, then "All versions".** Open every PDF link in the cluster; prefer the latest repository copy | 1 minute | 69% / 51% | Recomputed |
| 3 | **ResearchGate and Academia.edu,** searched by title. Use ResearchGate's "request full-text" button if there is one | 1–2 minutes | 72% / 57% | Recomputed. Mostly adds final versions; some are uploads that breach publisher policy |
| 4 | **The field's own server or a funder repository,** searched by title: arXiv; Europe PMC/PMC; SSRN and RePEc; PhilArchive; OSF; OSTI or NSF-PAR | 2–3 minutes | 73% / 58% with the subject databases Walters tested (PubMed, ERIC); perhaps 74–76% with the servers he did not test [~50%]. Much higher in arXiv fields and NIH-funded biomedicine | Recomputed, plus inference |
| 5 | **The author's homepage or lab page** (many post accepted manuscripts outside indexed repositories), then CORE full-text search | 2–5 minutes | Perhaps 1–2 more points [~50%] | Inference |
| 6 | **JSTOR free account** for humanities, social science, economics and older statistics; Early Journal Content for anything old enough | Minutes; online reading only | Field-dependent. Adds most for pre-2001 work, where steps 1–4 reach only 36% [~60%] | Inference |
| 7 | **Library routes:** an institutional login if you have one; otherwise your public library's databases, then interlibrary loan | Same day to two weeks | With a university login, about 88% / 85% (measured for one university's subscriptions plus steps 1–4). Without, about 80% [~50%] | Recomputed; the no-login figure is inference. See [Public Libraries](/access/public-libraries/) and [University and Employer Access](/access/academic-and-employer/) |
| 8 | **Email the author** (template above) | 1–14 days | About 85–92% without institutional access [~45%] | Inference from data-request analogs; recent papers respond far more often |
| 9 | **Pay or wait.** JPASS (\$1.66–\$1.95 per PDF) if the paper is on JSTOR; the publisher's single-article price otherwise (not surveyed here); or wait if a green copy is due after an embargo | Minutes, or months | About 95–100% | Embargo periods are listed in Open Policy Finder |

**Worked example.** Take a 40-item reference list from a 2023 review in an applied field such as forecasting methods or health economics. Steps 1–2 should produce about 28 free copies within five minutes, 20 of them in the final version. Step 3 adds about one more copy and two or three final versions. Steps 4–6 add perhaps one or two more. With a university login, the library brings the total to about 35, leaving five for interlibrary loan or email. Without one, the last 10 or so split between the public library, author emails (perhaps half answered within two weeks) and one or two purchases [all inference beyond step 3]. If several of the missing papers are on JSTOR and you need them this week, a month of JPASS (\$19.50 for 10 PDFs) is likely cheaper than an afternoon of chasing them [~60%]. Books and pre-2001 items in the list will be the hard cases; route those to a library first.

**Two rules for the whole cascade:**

- **Record the version.** A preprint can differ materially from the published paper: changed tables, retracted claims, added robustness checks. When the free copy is not the version of record, compare the abstract and key tables with the publisher's landing page before citing a number. Check [Retraction Watch](https://retractionwatch.com/) for anything consequential.
- **For tools, record provenance.** If you automate this cascade, store each file's source URL, license, version and retrieval date. In *Bartz v. Anthropic* the court held training to be fair use but denied summary judgment on the pirated library copies and set that question for trial ([order, 2025-06-23](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)); the case then settled for \$1.5B, with final approval on 2026-07-20. How a copy was acquired matters. Link out to free copies rather than mirroring them, because much free full text (arXiv's default license, bronze, author uploads) does not permit redistribution. See [The Legal Map](/building/legal-map/).

## Open questions

- **Legal coverage beyond Walters' tools.** How much do arXiv, SSRN/RePEc, Europe PMC, CORE and author homepages add beyond the 73% reached by the legal tools Walters tested? His Dataset S1 lists all 875 works, so the test is a re-run of that list through those services.
- **The reader's own fields.** What is legal coverage for works cited in 2024 reviews in statistics, ML, physics or philosophy, which Walters did not sample? arXiv should push it well above 73% in the first three [~70%]; philosophy is unknown.
- **Author-request fulfilment.** What fraction of polite PDF requests are fulfilled within 14 days, by field, paper age and requester affiliation? An opt-in logging tool could measure this.
- **The NIH cap.** Has NIH issued a final notice on allowable publication costs following NOT-OD-25-138, and at what level?
- **NIH compliance.** What fraction of NIH-funded papers accepted after 2025-07-01 actually appear in PMC at publication? This is computable by joining OpenAlex funder data with PMC holdings.
- **arXiv linking.** How often does OpenAlex fail to link an arXiv preprint to its published version? The answer bears on whether the low physical-sciences OA share (38% for 2024) is an artifact.
- **Revisions to 2024.** Where does the 2024 OA share in OpenAlex settle once green and bronze copies arrive, and how much of the fall in gold and hybrid is real?
- **Bronze closures.** How often do publishers close bronze articles, and which publishers do it?
- **Plan S exceptions.** How many cOAlition S funders took the national-strategy exception and kept paying for transformative agreements after 2024?
- **Field coverage.** How large are SSRN and PhilArchive in 2026, and what share of recent philosophy and economics articles have a free version there?

## Related pages

- [The Access Ladder](/access/access-ladder/): where open papers sit among all access routes, by cost
- [The Shadow Libraries](/access/shadow-libraries/): the pirate benchmark in Walters' study, and the legal risk
- [Public Libraries](/access/public-libraries/) and [University and Employer Access](/access/academic-and-employer/): step 7 of the workflow
- [Cheap Subscriptions](/access/subscriptions/): paid routes beyond JPASS
- [Open-Access Books and Textbooks](/access/open-books/): the same question for books, where the free paper routes find almost nothing
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): OpenAlex, Crossref and Semantic Scholar as catalog sources
- [AI Research Assistants](/finding/ai-research-assistants/): triage for the arXiv firehose
- [The Legal Map](/building/legal-map/) and [Costs and Effort](/building/costs-and-effort/): building on these sources
- [Directory of Sources and Tools](/reference/directory/)
