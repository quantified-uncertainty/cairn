---
title: The Legal Map
description: What a builder of literature tools may store, summarize, search, cache, scrape and link as of October 2026, rated green, yellow or red separately for a personal tool and a public service, with the cases, TDM exceptions, license terms and API terms behind each rating. US focus, with EU, UK and Japan notes; not legal advice.
---

*Status: draft, October 2026. Case statuses, terms text and API prices are as of 2026-10-15 unless dated otherwise; this area changes monthly. The ratings are risk judgments, not holdings, and the personal/public split is my inference. [I] marks inference; bracketed probabilities are mine unless attributed to the R09 author. "(secondary)" marks facts from press, a litigation tracker or Wikipedia. Not legal advice; see the [note below](#not-legal-advice). Sources: the [R09 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md) (its independent verification pass confirmed all 20 load-bearing claims and corrected four others), an editorial re-check of the key quotes against the opinions and terms pages on 2026-10-15, and primary sources linked inline.*

## The short version

- **Provenance drives liability, not "AI".** In *Bartz v. Anthropic* the court held that training on books was fair use, and so was scanning purchased print books whose originals were then destroyed. Downloading pirated copies was not excused ([order, 2025-06-23](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)). The case settled for **\$1.5B covering 482,460 works**, about **\$3,000 per work** before fees, approved on 2026-07-20 ([settlement documents](https://www.anthropiccopyrightsettlement.com/documents)). Rule: no shadow-library file enters your pipeline, even in a private tool.
- **The catalog layer is green almost everywhere.** Facts, titles and identifiers are not copyrightable, and OpenAlex and Wikidata are CC0. The exceptions: abstracts, the EU and UK database right, and Open Library, whose licensing page does not say CC0.
- **Summaries have two modes.** A private summary from a copy you lawfully hold is green. A published one should be short, original and idea-level. Detailed plot summaries of in-copyright fiction are red at scale: in October 2025 a federal judge held that ChatGPT's detailed *Game of Thrones* summaries plausibly infringe ([Stein, Dkt. 716](https://chatgptiseatingtheworld.com/wp-content/uploads/2025/10/JUDGE-STEIN-ORDER-DENYING-MTD-Authors-Guild-et-al-v.-OpenAI-Inc.-et-al-Entry-716.pdf)).
- **Contracts, not copyright, bind licensed content.** Elsevier's terms (2026-03-12) bar using content "in combination with an artificial intelligence tool", including to "analyse", unless a license allows it; O'Reilly's (2024-10-09) bar using it "as input or a prompt to a machine learning or AI system"; JSTOR's (2026-04-24) ban automated downloading and LLM training. Pasting a licensed PDF into a cloud LLM can breach contract even where the use would be fair use.
- **API terms are hard constraints.** Google forbids building databases from API responses; YouTube forbids scraping; Open Library sends bulk users to its dumps; OpenAlex has metered its API since 2026-02-24 (see [Open Papers and Preprints](/access/open-papers/)), though its data stays CC0.
- **Link out; don't host out.** Deep links to lawful copies are green. Re-serving a PDF is green only when the item carries an open license. "Free to read" is not a license.
- **Most activities change color when they go public.** The same feature can be green on your laptop and yellow or red as a hosted, shared or paid service; see the [deployment-mode table](#personal-tool-or-public-service).
- **Mirror HTRC Extracted Features now.** HathiTrust Research Center services shut down on 2026-09-30. The CC BY 4.0 Extracted Features dataset (page-level token counts for 17.1M volumes, 10.6M of them in copyright) is still listed for rsync download ([HTRC](https://analytics.hathitrust.org/deriveddatasets)). It supports page-level search over in-copyright books without touching their text.

## Not legal advice

This is a research map assembled by research agents, none of them lawyers, from court opinions, statutes and terms pages. The ratings estimate risk; they do not predict how a court would rule on your facts. Before launching anything commercial or public-facing that touches in-copyright text, talk to a lawyer licensed where you operate. For a personal tool, the practical risk sits in a few red actions (piracy, bulk proxy downloads, breaching API terms), not in the many gray ones.

## Personal tool or public service

The same feature carries different risk depending on who receives its output. I use four deployment modes throughout.

| Mode | Example | Who sees outputs | What changes legally |
|---|---|---|---|
| **Local personal** | A Claude Code project on your laptop. Files never leave the machine except in calls to a model API | You | No distribution and no public display. The private-research fair-use case is strongest here [I]. Contract terms still apply, and sending licensed text to a cloud model can breach them |
| **Hosted for yourself** | A private server or cloud locker with one user | You | Same as local in copyright terms [I]. Contract terms may not be: O'Reilly, for example, permits downloading "Sections" for personal use only, which rules out mirroring its books to a server [I] |
| **Shared with a group** | A lab wiki, reading group or team tool | A named group | Summaries and excerpts now reach other people, which strengthens a rightsholder's distribution and market-harm arguments [I]. Personal-use licenses (O'Reilly Individual, Perlego, Springer+) cannot be pooled. NC-licensed material is still usable if the group is non-commercial |
| **Public service** | A website, app or MCP server anyone can use, possibly paid | Anyone | Distribution and display; liability for outputs (Stein; *Cohere*); §512 duties for uploads; NC licenses bar paid or ad-supported use; EU for-profit linkers are presumed to know a linked copy is unauthorized; API terms aimed at third-party services apply |

Three questions move an activity down that table [I]:

1. **Does any copy or derived text leave your control?** Distribution and display are exclusive rights a public service exercises and a personal tool mostly does not.
2. **Does anyone pay, directly or through ads?** Payment weighs on fair-use factor 1, triggers NC licenses and the Google Books API's fee ban, and raises the EU presumption of knowledge for linkers.
3. **Could the output substitute for the work, or for a market the rightsholder could license?** That is fair-use factor 4; it counted against the Internet Archive and ROSS, and it is what makes detailed summaries risky.

## The green/yellow/red map

- **Green:** low legal risk if done as described.
- **Yellow:** defensible but contested, or it depends on a contract, a license or the implementation. Get advice before you commercialize it.
- **Red:** likely infringing or in breach. Don't.

The R09 dossier rated most rows once, US-centric. Wherever the Personal and Public columns differ, the split is my inference.

### Catalog layer

| # | Activity | Personal | Public | Why | Safer variant |
|---|---|---|---|---|---|
| 1 | Store and redistribute bibliographic metadata (title, author, IDs, subjects, dates) from Wikidata, OpenAlex, Crossref, LoC | **Green** | **Green** | Facts are unprotectable (*Feist*, 1991); titles and short phrases are not registrable ([37 C.F.R. 202.1](https://www.law.cornell.edu/cfr/text/37/202.1)); OpenAlex and Wikidata are CC0 | Keep per-field provenance. In the EU and UK, do not extract a substantial part of any single European database |
| 2 | Bulk-ingest the Open Library dumps | **Green** | **Green** | The dumps exist for bulk use. The Internet Archive "does not assert any new copyright or other proprietary rights" but warns of "existing rights issues on some contributions" ([licensing page](https://openlibrary.org/developers/licensing)) | Attribute. Use the dumps, not the API |
| 3 | Store tables of contents (chapter titles) | **Green** | **Green/yellow** | Mostly short phrases; long or annotated TOCs carry expression [I] | Store titles only. Don't make full TOCs for a whole catalog the product; link to the publisher's TOC |
| 4 | Display abstracts | **Green** | **Yellow** | Abstracts are protected expression; Crossref warns some "may be subject to copyright" ([Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)); OpenAlex "does not ship plaintext abstracts for legal reasons" ([work object](https://help.openalex.org/api-entities/works/work-object)) | Prefer CC BY or I4OA abstracts with a DOI link, or write your own one-line description |
| 5 | Cover thumbnails | **Green** | **Green/yellow** | Thumbnails in a search context are fair use under *Perfect 10* (secondary) | Small size, link to the source, use the Open Library Covers API |
| 6 | Query or scrape public library catalogs (OPACs) | **Green** for occasional Z39.50, SRU or API lookups; **yellow** for scraping web pages [I] | **Yellow** | Facts are free and *Van Buren* narrowed the CFAA (secondary), but terms of use bind: OCLC beat Anna's Archive on browsewrap contract and trespass to chattels, not copyright ([S.D. Ohio, 2026-01-15](https://librarytechnology.org/docs/32142.pdf)) | Use Z39.50, SRU or an official API; rate-limit; honor robots.txt |
| 7 | Bulk-scrape WorldCat | **Red** | **Red** | OCLC's terms; the same default judgment ordered Anna's Archive to delete its scraped WorldCat data | Use Open Library, LoC MARC, Wikidata and OpenAlex instead |

### Summaries and derived text

| # | Activity | Personal | Public | Why | Safer variant |
|---|---|---|---|---|---|
| 8 | Full text, search and summaries of **public-domain** books | **Green** | **Green** | No copyright | Watch for in-copyright introductions and translations in "PD" editions. Terms differ: US rules turn on publication date; the EU, UK and Japan use life plus 70 (prior knowledge) |
| 9 | Summaries of **CC BY / BY-SA** open-access books | **Green** | **Green** | The license permits adaptations with attribution; ShareAlike attaches to adaptations you publish ([CC FAQ](https://creativecommons.org/faq/)) | Attribute and link; tag SA outputs |
| 10 | Summaries of **CC BY-ND** books | **Green** | **Yellow** | A condensation may be an "adaptation" | Publish idea-level descriptions and short quotes; keep detailed summaries private |
| 11 | Summaries of **CC BY-NC** books | **Green** | **Green** if non-commercial; **yellow/red** in a paid or ad-supported product | NC bars uses "primarily intended for or directed toward commercial advantage or monetary compensation" | Metadata plus link in a paid product |
| 12 | Short (1–3 sentence) original descriptions of **in-copyright** books | **Green** | **Green** | Ideas and facts; review-like use [I] | Human-edited; no plot spoilers for fiction |
| 13 | Idea-level argument maps of in-copyright **non-fiction** | **Green** | **Yellow-green** | Ideas are unprotected; structure-tracking condensations are gray [I] | Limit detail, cite pages, add commentary, measure overlap |
| 14 | Detailed chapter or plot summaries of in-copyright **fiction** | **Green** (private, ephemeral) | **Red** at scale | Stein 2025; *Twin Peaks*; *Colting*; USCO on abridgments | Brief, spoiler-free descriptions in public |
| 15 | On-the-fly summaries, each from a copy that user lawfully holds | **Green** | **Yellow** as a hosted service | Private research use [I]; a host faces output-liability questions (Stein; *Cohere*) | Run locally; never cache or share outputs across users |
| 16 | Copy another service's summaries, headnotes or abstracts to seed or train your tool | **Yellow** [I]: private copying is a stronger fair-use case than ROSS's, but scraping the source usually breaches its terms | **Red** | *ROSS* (3d Cir. 2026): even short editorial summaries are original, and copying them to build a competitor is not fair use | Write your own or license them; use openly licensed abstracts |

### Search, caching and ingestion

| # | Activity | Personal | Public | Why | Safer variant |
|---|---|---|---|---|---|
| 17 | Page-level search with **HTRC Extracted Features** (token counts per page) | **Green** | **Green** | CC BY 4.0; non-expressive features; *HathiTrust* logic | Mirror it now; services ended 2026-09-30 |
| 18 | Full-text search over books you bought and scanned | **Green/yellow** [I] | **Yellow-green** if output is locations only | *Bartz* (N.D. Cal.): scanning purchased print copies is fair use, on facts where each print original was destroyed and the scans stayed in-house. *Hachette* (2d Cir.): digitization is not transformative per se | Keep scans private; no lending; public output limited to page numbers and hit counts, as in *HathiTrust*. Keeping the print copy too is outside the *Bartz* facts [I] |
| 19 | Show snippets from in-copyright books | n/a | **Yellow** | *Google Books* allowed tightly limited snippets | Copy Google's limits (see the [cases table](#the-cases-and-what-they-decided)); no reconstructable text |
| 20 | Cache and re-serve PDFs of **CC-licensed** OA books and articles | **Green** | **Green** | The license permits redistribution with conditions | Check the license per item. OpenAlex's `oa_status` is not a license |
| 21 | Cache PDFs that are free to read but **not openly licensed** (bronze OA, arXiv's default license, publisher-hosted) | **Green** (a private copy for your own reading) [I] | **Red** to re-serve | Free to read is not a license. arXiv's bulk-data page says tools built on its full text "must link back to arXiv for downloads" ([arXiv](https://info.arxiv.org/help/bulk_data_s3.html)) | Link to the publisher or repository copy |
| 22 | Ingest your own PDFs locally, with no upload | **Green** | n/a | No distribution; private use [I] | Local models, or explicit consent per document before a cloud call |
| 23 | Accept user uploads in a hosted library | **Green** (private locker) | **Yellow** (shareable) | Needs full §512(c) and (i) compliance ([17 U.S.C. §512](https://www.law.cornell.edu/uscode/text/17/512)) | See [Hosting uploads](#hosting-uploads-dmca-512) |
| 24 | Fine-tune or train a model on books you bought and scanned | **Green/yellow** [I] | **Yellow** | *Bartz*: training is fair use; DOJ supportive. *ROSS*: a competing substitute is not; *Kadrey*: market dilution | Generative, non-substitutive purpose; output filters |

### Access and acquisition

| # | Activity | Personal | Public | Why | Safer variant |
|---|---|---|---|---|---|
| 25 | Bulk-download papers through an employer or university subscription | **Red** | **Red** | Licenses bar "systematic" downloading; publishers suspend whole IP ranges ([JSTOR terms](https://about.jstor.org/terms)) | The publisher's TDM API with your institution's key, or the OA copy |
| 26 | Text-mine through a publisher TDM API with an institutional key | **Green** (non-commercial research) | **Yellow** (commercial: negotiate) | Elsevier allows non-commercial TDM by researchers at subscribing institutions ([policy](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining)) | Keep outputs to statistics and short quotes |
| 27 | Send institution-licensed or O'Reilly content to a cloud LLM | **Yellow/red** (contract); **red** for O'Reilly | **Yellow/red** (contract); **red** for O'Reilly | Elsevier, JSTOR and O'Reilly terms ([below](#library-and-publisher-licenses-the-contract-layer)) | The institution's AI-approved tool, a local model, or the TDM API |
| 28 | Circumvent e-book DRM to text-mine | **Red** (yellow for a qualifying university researcher) | **Red** | The §1201 exemption covers only researchers at nonprofit higher-education institutions, with security measures ([37 C.F.R. 201.40](https://www.law.cornell.edu/cfr/text/37/201.40)) | DRM-free and OA sources |
| 29 | Build a stored database from the **Google Books API** | **Red** (contract) | **Red** (contract) | Google APIs ToS §5(e)(1): you may not "scrape, build databases, or otherwise create permanent copies" of API content ([terms](https://developers.google.com/terms)) | Live lookups and link-outs only |
| 30 | Pull and store **YouTube** transcripts at scale | **Red** (contract) | **Red** (contract) | No scraping; 30-day refresh rule; `captions.download` only for a video's editors | Timestamped links; CC-licensed lecture sources |

### Linking

| # | Activity | Personal | Public | Why | Safer variant |
|---|---|---|---|---|---|
| 31 | Deep-link to lawful copies (publisher, arXiv, repositories, Internet Archive PD, HathiTrust PD) | **Green** | **Green** | Server test (*Perfect 10*, *Hunley*); *Emmerich* (all secondary); *Svensson* in the EU | Don't frame a page in a way that hides its source |
| 32 | Link to shadow libraries (LibGen, Sci-Hub, Anna's Archive, Z-Library) | **Red** | **Red** | Contributory risk; 2026 judgments and domain seizures; EU profit presumption | Never. Build a [lawful-copy resolver](/building/reference-architecture/) instead |
| 33 | Train, index or RAG on shadow-library copies | **Red** | **Red** | The *Bartz* facts; USCO's bad-faith factor; Japan's guidance: "should be strictly avoided" | Never |

**What this means for a personal tool.** Almost every Personal cell is green. The reds that survive are the ones that create liability at the moment of acquisition or contract: rows 7, 25, 28, 29, 30, 32 and 33, plus row 27 for O'Reilly. A personal build that never touches those rows, and keeps licensed PDFs away from cloud models unless the license allows it, carries little legal risk [~90%, my estimate].

**What this means for a public service.** Build the shareable layer from metadata (rows 1–5), links (31), short original descriptions (12), openly licensed full text (8, 9, 20) and HTRC features (17). Keep in-copyright full text and detailed summaries per-user and uncached. [A Reference Architecture](/building/reference-architecture/) follows this split.

## The cases and what they decided

| Case | Court and date | What it decided | What it means for a builder | Status (2026-10-15) |
|---|---|---|---|---|
| *Feist v. Rural Telephone* | US Supreme Court, 1991 | "Originality is the sine qua non of copyright." Facts are free; a compilation is protected only in its original selection and arrangement (secondary) | The catalog layer is free to copy; a curated list copied wholesale is not | Final |
| *Authors Guild v. HathiTrust*, 755 F.3d 87 | 2d Cir., 2014-06-10 | A full-text searchable database of scanned in-copyright books is "quintessentially transformative" fair use; so is access for print-disabled readers ([USCO summary](https://www.copyright.gov/fair-use/summaries/authorsguild-hathitrust-2dcir2014.pdf)). Public search results showed "only the page numbers on which the search term is found" and the number of hits per page, and no text ([opinion](https://cases.justia.com/federal/appellate-courts/ca2/12-4547/12-4547-2014-06-10.pdf)) | Search that returns locations, not text, is the safest way to work with in-copyright books | Final; settled 2015 (secondary) |
| *Authors Guild v. Google*, 804 F.3d 202 | 2d Cir., 2015-10-16; cert. denied 2016-04-18 | Scanning, search and snippet display are fair use; the "cumbersome, disjointed, and incomplete" snippet aggregation is unlikely to substitute for the book ([USCO summary](https://www.copyright.gov/fair-use/summaries/authorsguild-google-2dcir2015.pdf)). Commercial motive did not defeat it | Snippets are defensible only with hard limits. Google's: a snippet is about an eighth of a page; a search shows at most three per term; one snippet on every page and one page in ten are never shown, which blocks about 22% of a book's text ([opinion](https://cases.justia.com/federal/appellate-courts/ca2/13-4829/13-4829-2015-10-16.pdf)) | Final |
| *Hachette v. Internet Archive* | S.D.N.Y. 2023-03-24; 2d Cir. 2024-09-04 | Controlled digital lending of scanned in-copyright books is not transformative and not fair use, even though the use is non-commercial. Footnote 12 declines to narrow the holding to books the Internet Archive owns ([opinion](https://storage.courtlistener.com/recap/gov.uscourts.ca2.60988/gov.uscourts.ca2.60988.306.1.pdf)) | Lending or serving full copies is red, whoever owns the print book | Final. No cert petition was filed, and about 500,000 books left lending (both secondary) |
| *Thomson Reuters v. ROSS* | D. Del. Feb. 2025; 3d Cir. filed **2026-09-29** | 2,243 Westlaw headnotes are original expression. Copying them to train a **non-generative** competing legal-search tool was "minimally transformative, at best". The "rapidly developing" market for licensing headnotes as AI training data counts under factor 4. Footnote 7 sets aside generative LLMs and the DOJ's position ([opinion](https://www2.ca3.uscourts.gov/opinarch/252153p.pdf)) | The first US appellate ruling on AI and fair use. Don't build on someone else's summaries or abstracts | ROSS's counsel said on 2026-09-30: "We intend to seek review by the Supreme Court" ([Courthouse News](https://www.courthousenews.com/ai-training-of-copyrighted-material-not-fair-use-third-circuit/)) |
| *Bartz v. Anthropic* | N.D. Cal. (Alsup), **2025-06-23** | Training was "exceedingly transformative" and fair use. Scanning purchased print books was fair use: each print original was destroyed, "One replaced the other", and the scans were not shared outside the company. The pirated library copies (over 7 million from LibGen and PiLiMi, plus Books3) were not excused ([order](https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf)) | Buy-and-scan is defensible in this district on those facts; piracy is not, whatever you later do with it | Settled: \$1.5B, 482,460 works, final approval 2026-07-20 (Judge Martínez-Olguín). The release covers past conduct only and no output claims. First payments expected "on or before November 15, 2026" ([settlement site](https://www.anthropiccopyrightsettlement.com/)) |
| *Kadrey v. Meta* | N.D. Cal. (Chhabria), **2025-06-25** | Summary judgment for Meta on training, but only because the 13 plaintiffs "made the wrong arguments". Meta's copies came from shadow libraries. The judge wrote that "in most cases" unlicensed training will likely be illegal, mainly through market dilution ([order](https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf)) | A narrow win that does not bless shadow-library sourcing | The torrenting and distribution claim survives; summary-judgment hearing set for **2027-02-25** ([tracker](https://chatgptiseatingtheworld.com/2026/03/27/kadrey-v-meta-gets-scheduling-order-summary-judgment-motion-hearing-for-distribution-claim-wont-be-heard-until-feb-25-2027/), secondary) |
| *Authors Guild v. OpenAI* (OpenAI MDL, No. 1:25-md-3143) | S.D.N.Y. (Stein), **2025-10-27** | Output claims survive a motion to dismiss. Detailed ChatGPT plot summaries are "most certainly attempts at abridgment or condensation" of setting, plot and characters. "This opinion makes no conclusions regarding fair use" ([Dkt. 716](https://chatgptiseatingtheworld.com/wp-content/uploads/2025/10/JUDGE-STEIN-ORDER-DENYING-MTD-Authors-Guild-et-al-v.-OpenAI-Inc.-et-al-Entry-716.pdf)) | Detailed fiction summaries are the danger zone for a public service | Summary-judgment motions filed 2026-09-04; briefing ongoing; hearing date not set ([tracker](https://chatgptiseatingtheworld.com/in-re-openai-copyright-inf-ltgn/), secondary) |
| *NYT v. Microsoft and OpenAI*, 777 F. Supp. 3d 283 | S.D.N.Y. 2025 | Motion to dismiss largely denied (secondary). Summaries of news *facts* that differed "in style, tone, length, and sentence structure" were not substantially similar (as described in Stein's footnote 3) | Fact-level summaries of non-fiction are much safer than plot summaries | Part of the MDL; summary judgment pending |
| *Advance Local Media v. Cohere* | S.D.N.Y. (McMahon), November 2025 | The "substitutive summaries" theory survived a partial motion to dismiss; the alleged outputs included 50 verbatim copies and 25 verbatim-plus-paraphrase copies ([tracker](https://chatgptiseatingtheworld.com/2025/11/18/reflections-on-judge-mcmahons-denial-of-partial-motion-to-dismiss-advance-local-medias-complaint-v-cohere/), secondary) | A hosted summarizer can be sued over its outputs | Ongoing |
| *Twin Peaks* (2d Cir. 1993); *Castle Rock v. Carol* (2d Cir. 1998); *Penguin Random House v. Colting* (S.D.N.Y. 2017) | — | Detailed episode recaps, a trivia book and children's condensations of novels infringed | Detailed human-written summaries already lost; Stein, citing all three, applied that line to AI outputs at the pleading stage | Final |

Two government positions frame these cases:

- **The US Copyright Office** ([Part 3, pre-publication, 2025-05-09](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf)) says RAG is "less likely to be transformative" where the purpose is "to generate outputs that summarize or provide abridged versions of retrieved copyrighted works". It also says "knowing use of a dataset that consists of pirated or illegally accessed works should weigh against fair use without being determinative". No final version has been issued.
- **The Department of Justice** filed a Statement of Interest in the OpenAI MDL on 2026-09-01 arguing that training is fair use and that market dilution is a "deeply flawed" theory ([tracker](https://chatgptiseatingtheworld.com/2026/09/02/united-states-files-statement-of-interest-in-openai-lawsuits-ai-training-is-fair-use-dilution-is-deeply-flawed-theory-in-the-view-of-the-united-states/), secondary); the news plaintiffs asked for it to get "little weight" (secondary). The Third Circuit wrote in *ROSS* that "the concerns raised in that separate case do not apply here".

Beyond "acquisition matters" and "fiction plot detail is the danger zone", the cases sort uses into two piles. **Non-expressive uses are strong:** indexing, search, statistics, training a generative model. **Substitutive uses are weak:** lending full copies, a competitor built on copied editorial text, summaries that replace the book.

### Where the cases conflict

- **Is generative training fair use?** Two district courts said yes (*Bartz*; *Kadrey* on its record), and the DOJ agrees. The USCO says it depends on context, and the Third Circuit held non-generative, substitutive training unfair. The R09 author put **[~55%]** on at least partial fair-use wins for training in the S.D.N.Y. MDL by the end of 2027 (low-to-medium confidence), and **[~40%]** on the Supreme Court taking *ROSS* or another AI-training case by the end of 2027 (low confidence). I lean the same way. For tool builders the question matters less than it seems, because most literature tools retrieve and summarize rather than train [I].
- **Format-shifting.** *Bartz* says scanning purchased print books for a central library is fair use. *Hachette* says digitization alone "is not transformative". A circuit split is plausible [I]. Until one is resolved, keep scans of bought books private and expose only locations.
- **Market dilution.** Chhabria endorsed it in principle; the DOJ rejects it. Unresolved.
- **Summaries.** No court has ruled on fair use of AI summaries; Stein's ruling came at the pleading stage. The fiction/non-fiction line in this chapter is an inference from the contrast between *NYT* (facts) and *Game of Thrones* (plot).

## When a summary is a derivative work

The statute lists "abridgment, condensation, or any other form in which a work may be recast, transformed, or adapted" as a derivative work ([17 U.S.C. §101](https://www.law.cornell.edu/uscode/text/17/101)), so a summary can infringe. The test is substantial similarity in protected expression (plot sequence, characters, setting, selection of detail, wording), not in ideas, facts or arguments. Fair use then asks what the summary is for (factor 1), how much expression it takes (factor 3, with length and detail as the proxy), and whether it substitutes for the book or a licensable market (factor 4). Study guides, abridgments, key-idea summary apps and AI-training licenses are all real markets; *ROSS* credited the last one.

The R09 author's calibrated read, with the personal column added:

| Summary type | Public: likely status | Confidence | Personal use |
|---|---|---|---|
| 1–3 sentence description or "why read this" note in your own words | Not substantially similar; fair use even if it were | High [~90%] | Green |
| Argument map or key-claims list for **non-fiction**, with short attributed quotes | Mostly unprotected ideas plus fair-use quotation | Medium-high [~75%] | Green |
| Chapter-by-chapter condensation of non-fiction that closely tracks structure and examples | Gray: the selection and arrangement of detail is expression | Medium [~50% infringing if published at scale] | Green |
| Detailed plot summary of in-copyright **fiction** | Plausibly infringing per Stein; fair use undecided | Medium [~60–65% infringing if published as a substitute] | Green if private and not shared |
| Private, ephemeral summary for one user from a copy that user owns | Technically a derivative; strong fair-use case and negligible enforcement risk | High that it is low-risk [~90%] | Green |

Outside the US the margin is thinner. The EU has no open-ended fair use, and the CJEU's *Infopaq* (2009) held that an 11-word extract can reproduce protected expression (prior knowledge). The UK has fair dealing for criticism, review and quotation (CDPA s.30; prior knowledge). Japan's Art. 47-5 permits "minor exploitation" incidental to information-analysis services, judged by "the percentage it constitutes" of the work, the volume used and "the accuracy of indications made" about the source ([CRIC translation](https://www.cric.or.jp/english/clj/cl2.html)). A public summary service aimed at European users should sit further toward the top of the table than a US one [I, medium confidence].

**A publishing gate makes this operational.** Before any summary of an in-copyright work becomes public, compute n-gram overlap with the source (if you have it), named-character and scene density, and whether it reveals the ending. Downgrade fiction summaries that exceed thresholds to a spoiler-free description. No court has endorsed specific thresholds; start strict and log what you block.

### Creative Commons NC and ND

NC and ND are common in open-access books. In the Directory of Open Access Books, the first-listed license is CC BY for 34.1% of books and CC BY-NC-ND for 33.4%; 12.6% record none, and only 37.8% (CC BY, BY-SA or PD) allow commercial reuse (DOAB export analyzed 2026-10-15 in the [R01 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R01-open-books.md)). By my arithmetic from the same table, about 34% carry an ND term and about 42% an NC term. OpenStax moved to CC BY-NC-SA on 2026-04-22; 70 of its 84 live titles now carry it (R01). Four points from the [CC FAQ](https://creativecommons.org/faq/) decide what you may do with summaries:

- **Exceptions come first.** "CC licenses do not reduce, limit, or restrict any rights under exceptions and limitations to copyright", and their terms "are not triggered by uses permitted under any applicable exceptions and limitations". If a summary is not an adaptation under copyright law, or is fair use, ND and NC do not apply.
- **Adaptation depends on copyright law.** Whether a modification is an adaptation "depends primarily on the applicable copyright law". An excerpt used "to illuminate an idea or provide an example" generally creates no derivative work; excerpts combined "in a way that creates some new version of the original" may. A short idea-level description of an ND book is probably not an adaptation [I]. A chapter-by-chapter condensation may be.
- **NC means "primarily intended for or directed toward commercial advantage or monetary compensation".** It "does not turn on the type of user": a nonprofit can violate it, and a for-profit is not automatically in breach.
- **TDM is expressly licensed:** "All six of the 4.0 licenses allow for text and data mining" where permission is needed at all. Mining NC material for a commercial purpose is the exception to avoid.

CC's [AI guidance](https://creativecommons.org/using-cc-licensed-works-for-ai-training/) (2025-05-28) is stricter, and says following it "will almost certainly lead to overcompliance": NC "applies to all uses requiring permission", and ND works "should not be used as training data".

**Builder rules [I]:**

- **PD, CC BY, CC BY-SA:** store, summarize, display and redistribute with attribution. ShareAlike carries over to adaptations you publish.
- **BY-ND:** store and index the full text, show quotes, and publish only short, idea-level descriptions. Keep condensations private.
- **BY-NC (-ND, -SA):** fine in a personal or non-commercial research tool. A paid or ad-supported product should treat NC texts as metadata plus a link.

## The catalog layer: what in a record is protected

The wiki's organizing idea, separating the catalog from the content, is also the legally safe split. Rows 1–5 cover the basics: facts and short phrases are free, and a catalog's selection and arrangement carries at most a thin compilation copyright ([17 U.S.C. §101](https://www.law.cornell.edu/uscode/text/17/101)), so copy the facts but not a curated "best 100" list wholesale. The edge cases:

- **Publisher-written annotated TOCs, chapter summaries and jacket copy are protected expression.** *ROSS* shows that even short editorial summaries clear the originality bar. Jacket copy is widely tolerated when quoted with attribution [I].
- **LoC MARC records are probably public domain** as US-government works [~85%]. LoC offers "nearly 25 million MARC records" free "primarily for research and development usage" and states no license ([LoC](https://www.loc.gov/cds/products/marcDist.php)).
- **The EU and UK add a 15-year *sui generis* database right.** It protects a database built with "substantial investment", and extracting a substantial part infringes even when each fact is free ([Wikipedia](https://en.wikipedia.org/wiki/Database_right), secondary). From Europe, do not wholesale-extract any single European database.

Abstracts are the sharp edge for paper tools. The Initiative for Open Abstracts says abstracts are submitted for only "~7%" of Crossref records (undated; 6.6% at its 2020 launch) ([I4OA](https://i4oa.org/)). OpenAlex ships an inverted index instead of plaintext "for legal reasons". When a well-lawyered open-data project reads the risk that way, a public tool should too. For papers without an open abstract, a generated one-line description is the safer public field.

## Text-and-data-mining exceptions outside the US

The US has no TDM statute; fair use carries the load. The only TDM-specific provision is a narrow DMCA §1201 exemption for circumventing e-book DRM. It covers a "researcher affiliated with a nonprofit institution of higher education" using copies "lawfully acquired and owned by the institution" under "effective security measures" ([37 C.F.R. 201.40](https://www.law.cornell.edu/cfr/text/37/201.40)). It was renewed in the 2024 rulemaking ([final rule 2024-10-28](https://www.copyright.gov/1201/2024/)) and on the three-year cycle should run to about October 2027 [I].

| Jurisdiction | Provision | Who | Commercial use? | Opt-out? | Can a contract override it? | Status (2026) |
|---|---|---|---|---|---|---|
| EU | DSM Directive [Art. 3](https://www.legislation.gov.uk/eudr/2019/790/article/3) | Research organisations and cultural heritage institutions with lawful access | Scientific research only | No | No: contrary terms are unenforceable under [Art. 7(1)](https://www.legislation.gov.uk/eudr/2019/790/article/7) | In force |
| EU | DSM [Art. 4](https://www.legislation.gov.uk/eudr/2019/790/article/4) | Anyone with lawful access | Yes | Yes, if rights are reserved "in an appropriate manner, such as machine-readable means" | Not protected by Art. 7 | In force |
| EU | AI Act [Art. 53(1)(c)–(d)](https://artificialintelligenceact.eu/article/53/) | Providers of general-purpose AI models | — | Must have a policy to respect Art. 4 reservations and publish a training-content summary | — | Applies from 2025-08-02 |
| UK | CDPA [s.29A](https://www.legislation.gov.uk/ukpga/1988/48/section/29A) | Anyone with lawful access | **Non-commercial research only** | n/a | No: restricting terms are "unenforceable" (s.29A(5)) | In force since 2014-06-01 |
| UK | Proposed commercial TDM exception with opt-out | — | — | — | — | **Dropped as the preferred option.** The 2026-03-18 report says "a broad copyright exception with opt-out is no longer the government's preferred way forward" ([report](https://www.gov.uk/government/publications/report-and-impact-assessment-on-copyright-and-artificial-intelligence/report-on-copyright-and-artificial-intelligence)) |
| Japan | [Art. 30-4](https://www.cric.or.jp/english/clj/cl2.html) | Anyone | Yes | No formal opt-out; a proviso applies if the use would "unreasonably prejudice" the owner | — | In force |
| Japan | Art. 47-5 | Information-analysis and search services | Yes | — | — | Permits "minor exploitation" in search or analysis results |

Japan's Agency for Cultural Affairs guidance ([May 2024 overview](https://www.bunka.go.jp/english/policy/copyright/pdf/94055801_01.pdf), "not legally binding") matters for RAG tools. RAG that aims "to output the creative expression (wholly or partially)" of a work has an "enjoyment" purpose, so it falls outside Art. 30-4 and must fit Art. 47-5. Avoiding technical measures such as robots.txt to reproduce copyrighted *database* works triggers the Art. 30-4 proviso. Collecting training data from sites known to distribute pirated content "should be strictly avoided".

European case law is thin and split on whether a model contains copies:

- *Kneschke v. LAION* (LG Hamburg, 2024-09-27): downloading a photo to build a free research dataset fell within the research exception; the ruling covers the download step only ([Kluwer](https://legalblogs.wolterskluwer.com/copyright-blog/kneschke-vs-laion-landmark-ruling-on-tdm-exceptions-for-ai-training-data-part-1/), secondary). The appeal outcome was not verified.
- *GEMA v. OpenAI* (LG München I, 2025-11-11): lyrics memorized in a model are a reproduction; not final ([heise](https://www.heise.de/news/GEMA-vs-OpenAI-Niederlage-fuer-ChatGPT-vor-Muenchner-Gericht-11073532.html), secondary).
- *Getty v. Stability* ([2025] EWHC 2863 (Ch), 2025-11-04): a model which "does not store or reproduce any Copyright Works (and has never done so) is not an 'infringing copy'" ([judgment](https://www.judiciary.uk/wp-content/uploads/2025/11/Getty-Images-v-Stability-AI.pdf)). The training claim had been dropped because training happened outside the UK.

**Decisions by jurisdiction:**

- **EU users:** honor robots.txt and TDM-reservation signals in any crawler; under Art. 4 they are legally operative. EU academics have a statutory floor that US academics lack: Art. 3 research TDM cannot be contracted away.
- **UK users:** non-commercial research TDM with lawful access is protected and cannot be overridden by contract. Commercial TDM has no exception, and the March 2026 report makes one unlikely soon [I].
- **Japan:** the most permissive regime for analysis, but output-oriented RAG must fit the "minor exploitation" limits of Art. 47-5.

## Library and publisher licenses: the contract layer

For licensed content the binding question is not "is this fair use?" but "does the license permit this?", and many 2025–26 terms say no to AI processing unless negotiated.

| License or terms | What it prohibits | What it allows or routes you to | Date |
|---|---|---|---|
| [JSTOR Terms and Conditions](https://about.jstor.org/terms) | "Systematically print out, download, reproduce or distribute" content, for example "substantial portions of a run of a journal"; any activity that "automatically downloads or exports Content", including web scraping; using content "to train large language models or other generative AI technologies" | Reading and normal research use. JSTOR may suspend or terminate access for "a specific user, IP address(es)"; it will contact the institution first "if reasonably possible" | Updated 2026-04-24 |
| [Elsevier website terms](https://www.elsevier.com/legal/elsevier-website-terms-and-conditions) | "Systematic retrieval"; "robots, spiders, crawlers or other automated downloading programs"; using content "in combination with an artificial intelligence tool (including to train an algorithm, test, process, analyse, generate output …)" | Uses permitted by a "relevant license or subscription agreement or authorization by us". Institutional license terms "shall control" in a conflict | Revised 2026-03-12 |
| [Elsevier TDM policy](https://www.elsevier.com/about/policies-and-standards/text-and-data-mining) | — | Researchers at subscribing academic institutions may text-mine ScienceDirect for non-commercial research with a personal API key, including bulk full-text XML. Corporate users negotiate | Undated page, read 2026-10-15 |
| [O'Reilly membership agreement](https://www.oreilly.com/membership-agreement/) | Storing or transmitting content "as input or a prompt to a machine learning or AI system" without the copyright owner's written permission; "Web spiders" and other automated retrieval; using content to train AI; sharing accounts | "Personal use only"; quotes of "up to an aggregate of 250 words from any single text", with attribution | Updated 2024-10-09 (checked 2026-10-15) |

**What happens when access is cut.** The standard remedy for "systematic downloading" is to block an IP range, often a whole campus proxy; the institution then turns to the individual, through loss of library privileges or an employer's disciplinary process [I]. The Swartz case shows the tail: bulk JSTOR downloads over MIT's network in 2010–11 led to 13 federal felony counts (wire fraud and Computer Fraud and Abuse Act) even though JSTOR had settled civilly in June 2011 ([Wikipedia](https://en.wikipedia.org/wiki/Aaron_Swartz), secondary).

**Criminal exposure has narrowed; contract exposure has not.** *Van Buren* (2021) adopted a "gates-up-or-down" reading of "exceeds authorized access" under the CFAA ([Wikipedia](https://en.wikipedia.org/wiki/Van_Buren_v._United_States), secondary). In *hiQ v. LinkedIn*, scraping public data did not violate the CFAA, but hiQ was still found in breach of LinkedIn's User Agreement ([Wikipedia](https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn), secondary). On 2026-08-04 the Ninth Circuit vacated an injunction against Perplexity's Comet agent, reasoning that the *user*, not the agent, accesses Amazon ([tracker](https://chatgptiseatingtheworld.com/2026/08/04/9th-circuit-reverses-injunction-and-holds/), secondary). None of these rulings narrows liability for breaching terms of use.

**Rules for builders:**

- **Never automate bulk retrieval through an employer or university proxy session.** Use the publisher's TDM API with your institution's key, or the open-access copy. See [University and Employer Access](/access/academic-and-employer/).
- **Before a tool sends a ScienceDirect, JSTOR or O'Reilly text to a cloud model, check the license.** The safe routes are an institution-approved AI service, a local model, or the TDM API. Under O'Reilly's agreement, "paste the chapter into Claude" is a breach unless the copyright owner has given written permission.
- **Personal licenses do not pool.** A team tool cannot share one person's O'Reilly Individual, Perlego or Springer+ subscription. Employer licenses are the legitimate team path, and even those usually exclude AI processing unless negotiated ([R03 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md)).
- **Assume US contract terms bind you.** They are generally enforceable against users who accept them [I]. Whether a ban on AI processing is preempted by copyright, or unconscionable for an individual researcher, is unsettled. The EU and UK research exceptions override contracts by statute.

## API and data licenses

For several key sources, the terms of service bind harder than copyright.

| Source | Data license | Key terms and limits | Cost (Oct 2026) | Personal tool | Public service |
|---|---|---|---|---|---|
| [OpenAlex](https://help.openalex.org/access/pricing) | **CC0** | 10 requests/s without a key, 30 with a free key, 50 on annual plans ([rate limits](https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication), 2026-10-14). No plaintext abstracts. PDFs for over 50M works, API only | Free budget \$1/day with a key, \$0.10/day without. Per 1,000 calls: single entity free, list or filter \$0.10, search \$1, content download \$10 ([example costs](https://help.openalex.org/access/example-costs), 2026-10-09). Annual plans \$5,000, \$10,000, from \$20,000 | Green. Use the snapshot for bulk work | Green for metadata. Redistributing OpenAlex-served PDFs depends on each work's own license, not on CC0 [I] |
| [Open Library](https://openlibrary.org/developers/api) | Not stated as CC0. The Internet Archive "does not assert any new copyright or other proprietary rights" ([licensing](https://openlibrary.org/developers/licensing)) | 1 request/s anonymous, 3 with an identifying User-Agent. "Please do not use our APIs to bulk download metadata"; the APIs are "not intended to serve as a data backend for third-party services" | Free. Monthly dumps: editions ~9.2 GB, works ~2.9 GB, all types ~12.4 GB compressed ([dumps](https://openlibrary.org/developers/dumps)) | Green | Green from the dumps; do not proxy live traffic to the API |
| [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | "Almost none of the metadata is subject to copyright, and you may use it for any purpose." Some abstracts may be copyrighted | No sign-up; polite pool via `mailto` | Free. [Metadata Plus](https://www.crossref.org/services/metadata-retrieval/metadata-plus/) is paid | Green | Green for metadata, yellow for abstracts |
| [Semantic Scholar](https://www.semanticscholar.org/product/api/license) | Each dataset under its own license, for example CC BY-NC or ODC-BY | Non-transferable license; attribution to "Semantic Scholar" required; AI2 may terminate "any time for any reason". Keys start at 1 request/s ([API](https://www.semanticscholar.org/product/api)) | Free. 214M papers, 2.49B citations | Green with attribution | Check each dataset's license (NC fields) before commercial use |
| [Google Books API](https://developers.google.com/books/terms) | Content belongs to rightsholders | Remove content on request; no charging users "any fee for the use of your application" without a Google agreement (terms dated 2012-04-25). [Google APIs ToS](https://developers.google.com/terms) §5(e)(1): no "scrape, build databases, or otherwise create permanent copies" | Free | Live lookups only | **Red** for a stored catalog; red for a paid app without an agreement |
| [HathiTrust / HTRC](https://analytics.hathitrust.org/deriveddatasets) | Extracted Features 2.0: **CC BY 4.0** | [HTRC services discontinued 2026-09-30](https://analytics.hathitrust.org/); the HathiTrust Digital Library remains open. No date is given for how long downloads stay up | EF 2.0 via rsync: 17,123,746 volumes (10,550,952 in-copyright), 6.22B pages, 2.9T tokens | Green | Green |
| [Wikidata](https://www.wikidata.org/wiki/Wikidata:Licensing) | Structured data **CC0**; text in other namespaces CC BY-SA 4.0 | — | Free | Green | Green |
| [LoC MARC Open-Access](https://www.loc.gov/cds/products/marcDist.php) | No license stated; probably public domain [~85%] | "Primarily for research and development usage" | Free; ~25M records | Green | Green |
| [Open Syllabus](https://blog.opensyllabus.org/terms-and-policies) | Proprietary; "does not license access to the original documents" | Analytics requires an account; free tier capped at 2019 data; institutional subscriptions only | 32.9M syllabi | Link to its Galaxy | **Yellow:** negotiate for data |
| [YouTube](https://developers.google.com/youtube/terms/developer-policies) | Videos and captions belong to uploaders | No downloading or caching audiovisual content; delete or refresh stored API data after 30 days; no scraping (policies updated 2026-09-14). [`captions.download`](https://developers.google.com/youtube/v3/docs/captions/download) requires permission to edit the video and costs 200 quota units | Free quota | Store titles, your own chapter notes and `t=` links | **Red** for bulk third-party transcripts |
| [arXiv](https://info.arxiv.org/help/bulk_data_s3.html) | Metadata CC0; most full text under arXiv's default license, a non-exclusive license to distribute that arXiv cannot pass on to others (R02, R10 dossiers) | API limited to 1 request per 3 s on a single connection; bulk data (~9.2 TB as of April 2025) in a requester-pays S3 bucket | You pay AWS egress | Green to read and index privately | Link back to arXiv; re-serve only CC-licensed e-prints |

**OpenAlex budget arithmetic** [I]: \$1/day buys about 10,000 list calls, 1,000 searches, or 100 PDF downloads. That covers daily freshness checks on a personal catalog. For a bulk build, use the free CC0 snapshot instead. See [Costs and Effort](/building/costs-and-effort/) and [Catalogs and Metadata](/finding/catalogs-and-metadata/).

**Which HTRC version to mirror.** The derived-datasets page lists only EF 2.0, a 2020 snapshot. HTRC's wiki also documents EF 2.5 (April 2025 snapshot: 18.7M volumes, 9.97M in copyright, CC BY 4.0, 4.4 TB compressed) with its own rsync instructions ([R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md)); whether that endpoint survived the shutdown was not checked. Try EF 2.5 first, fall back to EF 2.0, and pull only the subset you need.

**For lectures:** store the title, chapter markers you write yourself and timestamped deep links. Pull full transcripts only from CC-licensed channels or with the creator's permission. See [Lectures, Talks and Other Media](/finding/lectures-and-media/).

## Linking and deep-linking

**United States.** The Ninth Circuit's "server test" (*Perfect 10 v. Amazon*, 2007; *Hunley v. Instagram*, 2023) holds that you do not "display" what you do not store and transmit; several S.D.N.Y. judges have rejected it. On 2026-08-27 the Fifth Circuit's *Emmerich Newspapers v. Particle Media* asked instead "who transmitted the copy" and found no infringement where the rightsholder's server did the transmitting. It also held that URLs are not categorically excluded from DMCA copyright management information, remanding those claims as fact-specific (all from [Wikipedia, "Server test"](https://en.wikipedia.org/wiki/Server_test), secondary). Plain hyperlinks and deep links to lawful copies are low-risk [I, high confidence]. Linking to *infringing* copies can create contributory liability.

**European Union.** *Svensson* (C-466/12, 2014) permits links to freely available, authorized content. *GS Media* (C-160/15, 2016-09-08) holds that linking to unauthorized content without profit and without knowledge is not a communication to the public, but "if those hyperlinks are provided for profit, knowledge of the illegality of the publication on the other website must be presumed" ([CJEU press release](https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf)).

**Shadow libraries.** In 2026 courts went after Anna's Archive and the intermediaries around it. A federal court in Ohio ordered deletion of its scraped WorldCat data in January. Spotify won a **\$322M** default judgment on 2026-04-15. Thirteen publishers won **\$19.5M** plus a global domain takedown on 2026-05-19 ([Wikipedia](https://en.wikipedia.org/wiki/Anna%27s_Archive), secondary; details in [The Shadow Libraries](/access/shadow-libraries/)). A tool that surfaces LibGen, Sci-Hub or Anna's Archive links is red, especially when commercial or used in the EU.

**Decision:** resolve each work to its best lawful copy (publisher, repository, arXiv, HathiTrust or Internet Archive public domain, the reader's library via Libby) and show the source and license next to the link. Report "no lawful copy found" instead of filling the gap. The ordered workflow is in [The Access Ladder](/access/access-ladder/).

## Hosting uploads: DMCA §512

A tool that ingests the reader's PDFs has three possible designs [I]:

- **Local-first.** Files never leave the device. There is no hosting, so §512 is not at issue. This is the cleanest design for "ingest my PDFs".
- **A private cloud locker per user, with no sharing.** Low risk. Register an agent anyway; it costs \$6.
- **A shared library or public collections.** Full compliance with [§512](https://www.law.cornell.edu/uscode/text/17/512) is required: no actual or "red flag" knowledge, expeditious takedown, no direct financial benefit from infringement you have the "right and ability to control", a designated agent, and a reasonably implemented repeat-infringer policy (§512(i)). Registration is online and costs **\$6** per designation, which "will expire and become invalid three years after it is registered" unless renewed; a lapse risks the safe harbor ([USCO FAQ](https://www.copyright.gov/dmca-directory/faq.html)). Avoid features that look like distribution, such as public download links or "popular PDFs" pages.

§512(d) gives a parallel safe harbor for "referring or linking users" through an index or directory, which covers a public catalog that links out.

## Encoding the map: a rights ledger

The ratings become code once every item and every derived artifact carries a rights state, and every operation checks it.

| Rights state | Store full text | Summarize privately | Publish summary | Show snippet | Re-serve file |
|---|---|---|---|---|---|
| Public domain (in the reader's jurisdiction) | Yes | Yes | Yes | Yes | Yes |
| CC BY / BY-SA | Yes | Yes | Yes (attribute; SA) | Yes | Yes |
| CC BY-ND | Yes | Yes | Idea-level only | Yes | Yes |
| CC BY-NC (any) | Yes | Yes | Non-commercial only | Yes | Non-commercial only |
| In copyright, owned by the reader | Locally | Yes | Short original description only | Locations only | No |
| In copyright, licensed (with license ID) | Per license | Per license (check AI clauses) | Short original description only | No | No |
| Free to read, no license | Private copy | Yes | Short original description only | No | No (link) |
| Unknown | No | No | Metadata only | No | No (link) |

Three implementation notes, all inference:

- **Default unknown rights to "link only".** Classify from CC license metadata, Crossref license URLs, HathiTrust rights codes and publication-date rules; OpenAlex `oa_status` describes access, not a license.
- **Keep acquisition logs.** Provenance decided *Bartz*. Store source URL, license, retrieval date and route for every file.
- **Make rights re-runnable.** US public-domain status changes every 1 January, and the Hathifiles that carry HathiTrust's rights codes get daily updates (R05). [A Reference Architecture](/building/reference-architecture/) puts the resolver in its own stage for this reason.

## What could change the map

| Event | Expected date | Rows it could flip | Estimate |
|---|---|---|---|
| OpenAI MDL summary-judgment ruling (S.D.N.Y.) | Hearing not set as of 2026-10-15 | 14, 15, 24; any ruling on output summaries would reshape the summary table | [~55%] at least a partial fair-use win on training by end-2027 (R09). A fair-use ruling on *summaries* specifically in that window is less likely [~25%, my estimate] |
| *ROSS* cert petition | Counsel said they will file. Under the Supreme Court's 90-day rule, a petition would be due around 2026-12-28 unless rehearing is sought or the time is extended [I] | 16, 24 | [~40%] that the Court takes *ROSS* or another AI-training case by end-2027 (R09) |
| *Kadrey* distribution claim | Hearing 2027-02-25 (secondary) | 33, and any tool that fetches files over BitTorrent (whether torrenting is itself distribution) | — |
| Publishers v. Google over Gemini (S.D.N.Y., filed July 2026, secondary) | Early stages | 24 | — |
| CJEU *Like Company v. Google* (C-250/25) and EU national courts on Art. 4 opt-outs | Pending; status not verified | EU notes on crawling and TDM | — |
| USCO Part 3 final version | Not announced | 14, 15, 33 | — |
| §1201 exemption renewal | Next triennial rule around October 2027 [I] | 28 | — |
| HTRC Extracted Features hosting | Unknown | 17 | Mirror before it matters |

The tracker's map counted **148** AI copyright suits in the US as of 2026-10-08 ([ChatGPT Is Eating the World](https://chatgptiseatingtheworld.com/), secondary). Few bear on literature tools; the ones above do.

## Open questions

- **Does the OpenAI MDL summary-judgment ruling reach fair use for output summaries, or only training?** It would decide rows 13–15. When the order issues, check whether it discusses the *Game of Thrones* outputs.
- **What do specific university licenses say about AI processing?** Elsevier's website terms defer to the "relevant license or subscription agreement". Pull a published consortium agreement and check whether it permits analysis with cloud LLMs.
- **What download rate triggers a JSTOR or Elsevier IP block?** No public threshold exists; librarians who handle suspensions could give a usable number for "systematic".
- **Is Open Library's data formally licensed?** A request to the Internet Archive could settle whether CC0 can be stated for the dumps, which matters for anyone redistributing a derived catalog.
- **Are the HTRC Extracted Features rsync endpoints (2.0 and 2.5) still serving, and for how long?** Test an rsync of a small subset, recheck the [derived datasets page](https://analytics.hathitrust.org/deriveddatasets) monthly, and ask whether any institution will host a mirror.
- **Can plot-density and overlap thresholds be calibrated against case facts?** Score the summaries at issue in *Twin Peaks*, *Colting* and the Stein exhibits against short descriptions known to be safe, and report the separation.
- **Is a per-user, uncached summary service the user's private use or the provider's output?** Stein and *Cohere* point to provider liability; no case has addressed a service that summarizes only copies the user supplies.
- **Does a personal buy-and-scan library that keeps the print copies fall outside *Bartz*?** Alsup relied on each print original being destroyed; watch for a ruling that treats a retained copy as decisive.
- **Did the LAION appeal decide whether natural-language terms of service count as a "machine-readable" Art. 4 reservation?** The answer decides whether EU crawlers must parse terms pages as well as robots.txt.

## Related pages

- [The Shadow Libraries](/access/shadow-libraries/): the litigation against LibGen, Sci-Hub and Anna's Archive, and why Open Stacks never links to them
- [Open Papers and Preprints](/access/open-papers/): which free copies carry licenses that permit re-serving
- [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/): the green-row sources
- [University and Employer Access](/access/academic-and-employer/): what institutional licenses allow
- [The Access Ladder](/access/access-ladder/): the ordered legal workflow for getting any work
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the CC0 and open data the catalog layer is built from
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): HathiTrust-style and Extracted Features search
- [Lectures, Talks and Other Media](/finding/lectures-and-media/): linking lectures without hoarding transcripts
- [A Reference Architecture](/building/reference-architecture/): the rights resolver and provenance ledger in the pipeline
- [Costs and Effort](/building/costs-and-effort/): OpenAlex budgets and what licensed content a build may enrich from
- [Cruxes](/start-here/cruxes/): where the legal uncertainty changes what is worth building
