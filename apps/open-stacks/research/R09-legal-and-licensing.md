# Legal and licensing landscape for tools that index, summarize, link to, or display literature (research dossier)

- **Date:** 2026-10-15
- **Track:** R09, the legal and licensing rules for building literature-exploration tools. The focus is the US, with notes on the EU, UK and Japan.
- **Scope:**
  - Copyright status of metadata, tables of contents (TOCs) and abstracts.
  - The fair-use cases that matter: Google Books, HathiTrust, Internet Archive, ROSS, Bartz, Kadrey, and the OpenAI MDL.
  - Whether LLM summaries are derivative works.
  - Text-and-data-mining (TDM) exceptions in the EU, UK and Japan.
  - Library e-resource license terms and publisher TDM routes.
  - API and data-license terms for about a dozen services.
  - Creative Commons NC/ND, linking and deep-linking, and DMCA safe harbor for tools that accept uploads.
  - A green/yellow/red table of concrete tool behaviors.
- **Not legal advice.** This is a research map for builders. A real product decision, especially anything commercial or public-facing involving in-copyright text, needs a lawyer.
- **Method:**
  - **No web search.** The shared WebSearch budget for this run was already used up before this track started, so I could not run any web searches.
  - **Direct primary-source fetches instead.** I worked from URLs I could reach directly:
    - Court opinions, downloaded as PDFs and grepped locally: the Bartz fair-use order, the Bartz final approval order and class notice, the Kadrey order, the Second Circuit Hachette opinion, the Third Circuit ROSS opinion, Judge Stein's October 2025 output ruling, and the UK *Getty v Stability* judgment.
    - Statute and regulation text: 17 U.S.C. §§101 and 512, and 37 C.F.R. §§201.40 and 202.1.
    - UK legislation.gov.uk, for CDPA s.29A and the EU DSM Directive Articles 3, 4 and 7.
    - Japanese statute and guidance.
    - Official API, terms and pricing pages for OpenAlex, Open Library, Crossref, Semantic Scholar, Google, YouTube, HTRC, Wikidata, LoC, Open Syllabus, JSTOR and Elsevier.
    - The internal site search of the litigation tracker *ChatGPT Is Eating the World*, for case status.
  - **Gaps.** A few items could not be re-verified and are flagged where they appear:
    - HathiTrust's own terms pages returned HTTP 403.
    - The CJEU docket, EUR-Lex, The Verge, Reuters and Ars Technica were blocked.
- **Labels used:**
  - **[V]** verified on a primary source this session.
  - **[S]** reported by a secondary source.
  - **[I]** my inference or calculation.
  - **[P]** prior knowledge, not re-verified this session.
  - Confidence is high, medium or low, or a probability such as [~70%].
- **Key sources:** Bartz Dkt. 231 and Dkt. 680 [1][2]; Kadrey Dkt. 598 [7]; *Thomson Reuters v. ROSS*, 3d Cir. No. 25-2153 (filed 2026-09-29) [10]; *Authors Guild v. OpenAI* Dkt. 716 (2025-10-27) [13]; *Hachette v. Internet Archive*, 2d Cir. (2024-09-04) [22]; USCO Part 3 report [29]; UK Report on Copyright and AI (2026-03-18) [32][33]; Japan ACA General Understanding [40]; OpenAlex pricing and docs [45–47][89]; Elsevier and JSTOR terms [78][79].

---

## Executive summary

- **Training LLMs on books has won twice in district court (Bartz; and Kadrey, although Meta's copies came from shadow libraries such as LibGen and Anna's Archive), but training a non-generative competitor on copied editorial text lost on appeal in ROSS.** [corrected in verification]
  - On 2025-06-23 Judge Alsup held that training Claude on books was "exceedingly transformative" and fair use [V][1].
  - He also held that scanning print books Anthropic had *bought* into a digital library was fair use. Pirated library copies were not [V][1].
  - On 2026-09-29 the Third Circuit affirmed in *Thomson Reuters v. ROSS* [V][10]:
    - Westlaw headnotes, which are short editorial summaries of judicial opinions, are copyrightable.
    - Copying them to train a **non-generative** competing legal-search AI was **not** fair use.
  - Both rulings matter for anyone building summary or search tools.
- **Provenance is the main liability driver, not "AI."**
  - Bartz settled for **$1.5 billion** covering **482,460 works**, about **$3,000 per work** before fees [V][2][3].
  - The settlement got final approval on **2026-07-20** [V][2][4]. 91.3% of works had been claimed by 2026-04-16 [V][2].
  - The liability came from downloading LibGen and PiLiMi, not from training. Anthropic must destroy those copies [V][3].
  - The release covers **past conduct only** and **no AI-output claims** [V][3].
  - Practical rule: never let a tool touch shadow-library files.
- **Detailed plot summaries of in-copyright fiction can infringe.**
  - On 2025-10-27 Judge Stein (S.D.N.Y.) held that ChatGPT's detailed *A Game of Thrones* summary plausibly infringes [V][13]. A "more discerning observer could easily conclude" it is substantially similar.
  - He called such outputs "attempts at abridgment or condensation" of plot, characters and setting, citing *Twin Peaks* (2d Cir. 1993) and *Penguin Random House v. Colting* (S.D.N.Y. 2017) [V][13].
  - He contrasted these with the news-fact summaries held *not* similar in *NYT v. Microsoft* (2025) [V][13].
  - The US Copyright Office says RAG used "to generate outputs that summarize or provide abridged versions of retrieved copyrighted works" is "less likely to be transformative" [V][29].
- **The US government now argues training is fair use.**
  - The United States filed a Statement of Interest in the OpenAI MDL on 2026-09-01 [S][16][15]. It argues LLM training is fair use and calls "market dilution" a "deeply flawed" theory.
  - Summary-judgment briefs in the MDL were filed on 2026-09-04. No hearing date has been set [S][15].
  - The Third Circuit expressly distinguished that filing in ROSS: ROSS's tool "cannot generate original expression" [V][10].
- **Kadrey v. Meta is a narrow win for Meta.**
  - Judge Chhabria granted Meta summary judgment on 2025-06-25 only because the 13 plaintiffs "made the wrong arguments" [V][7]. He wrote that in most cases unlicensed training "will likely be" illegal because of market dilution [V][7].
  - The torrenting and distribution claim survives. Summary judgment on it will not be heard until **2027-02-25** [S][8].
- **Controlled digital lending (CDL) is dead in the Second Circuit.**
  - The court held on 2024-09-04 that scanning print books and lending them one-to-one is not transformative and not fair use, even though the Internet Archive's use was non-commercial [V][22].
  - The court refused to narrow its holding to books the Internet Archive owns itself [V][22].
  - The Internet Archive did not seek Supreme Court review [S][23]. About 500,000 books left CDL [S][23].
  - *Google Books* (2015) and *HathiTrust* (2014) still protect full-text search, snippets, and page-number-only hit lists [S][24][25].
- **Metadata is the safe foundation.**
  - Facts are not copyrightable (*Feist*) [S][87], and titles and short phrases are not registrable [V][74].
  - Wikidata (CC0) [V][60] and OpenAlex (CC0) [V][46] can be redistributed.
  - Abstracts are different. Crossref warns abstracts "may be subject to copyright" [V][51]. OpenAlex "does not ship plaintext abstracts for legal reasons" and ships an inverted index instead [V][89].
  - The EU and UK add a 15-year *sui generis* database right that the US lacks [S][82].
- **Contracts and terms of service, not copyright, are the binding constraint on licensed content.**
  - Elsevier's website terms (updated 2026-03-12) forbid using content "in combination with an artificial intelligence tool," including to "analyse" or "generate output," unless an institutional license or Elsevier authorizes it [V][78].
  - JSTOR's terms (updated 2026-04-24) ban LLM training, scraping and automated downloading. JSTOR can suspend access by IP address [V][79].
  - So uploading a ScienceDirect PDF into a cloud LLM tool may breach contract even where it would be fair use.
- **The UK has dropped its plan for a commercial TDM exception with opt-out.**
  - The March 2026 statutory report says "a broad copyright exception with opt-out is no longer the government's preferred way forward" [V][33].
  - The UK keeps only s.29A: non-commercial research, lawful access, and contract override void [V][30].
- **The EU and Japan are more permissive, with conditions.**
  - EU DSM Art. 4 permits TDM by anyone unless rights are reserved "in an appropriate manner, such as machine-readable means" [V][35].
  - Art. 3 serves research organisations and cannot be overridden by contract (Art. 7) [V][34][36].
  - Japan Art. 30-4 allows non-"enjoyment" uses, including data analysis [V][39].
  - Japan's Copyright Office says RAG built to output protected expression falls outside Art. 30-4 and must instead fit the "minor exploitation" rule of Art. 47-5 [V][40].
- **API terms bite harder than copyright for several key sources.**
  - Google's API terms forbid "build[ing] databases, or otherwise creat[ing] permanent copies" of returned content [V][57].
  - Google Books API apps may not "charge users any fee" without Google's permission [V][56].
  - YouTube forbids scraping and storing audiovisual content [V][65]. Captions can be downloaded via the API only by users with "permission to edit the video" [V][66].
  - Open Library caps the API at 1 request/s, or 3 request/s if identified, and asks bulk users to use the dumps [V][49].
- **OpenAlex is now metered.**
  - Free: **$1/day** with a key, or $0.10/day without [V][46][47].
  - Costs per 1,000 calls: search **$1**, list or filter **$0.10**, PDF download **$10**. Single-entity lookups are free [V][47].
  - Annual plans cost **$5,000, $10,000, or $20,000+** [V][46].
  - The data stays CC0 [V][46].
- **HTRC services shut down on 2026-09-30.**
  - HathiTrust Research Center accounts and Data Capsules are gone [V][58][59].
  - The CC BY 4.0 **Extracted Features 2.0** dataset is still listed for rsync download: 17,123,746 volumes, 10,550,952 of them in-copyright, 6.2 billion pages [V][59].
  - Mirror it now.
- **Linking is mostly safe; linking to piracy is not.**
  - In the US the "server test" (*Perfect 10*, *Hunley*) protects embedding [S][83]. The Fifth Circuit's 2026-08-27 *Emmerich* decision reframed the question as "who transmits" [S][83].
  - In the EU, a for-profit linker to illegal content is *presumed* to know it is illegal (*GS Media*, CJEU 2016-09-08) [V][84].
  - Anna's Archive lost default judgments in 2026: **$322M** (Spotify), **$19.5M** plus a global domain takedown (publishers), and an OCLC order to delete scraped WorldCat data [S][81].
- **Accepting user PDFs is manageable.**
  - A local-only design needs no safe harbor [I].
  - A hosted, shareable design needs §512(c) compliance [V][70][71][73]: a designated agent registered with the Copyright Office ($6, renewed every 3 years), expeditious takedown, and a repeat-infringer policy.

---

## Detailed findings

### 1. What in a bibliographic record is copyrightable?

**US baseline.**

- *Feist v. Rural* (1991) held that "originality is the sine qua non of copyright." Facts are free. A compilation is protected only in its creative selection and arrangement, and "sweat of the brow" is rejected [S][87].
- The Copyright Office will not register "words and short phrases such as names, titles, and slogans" [V][74].
- A "compilation" is protected only where data are "selected, coordinated, or arranged" in an original way [V][72].

| Element | US status | Key authority | Practical risk | EU/UK difference |
|---|---|---|---|---|
| Title, author, ISBN, date, publisher, page count, LCC/DDC numbers, subject headings | Unprotectable facts or short phrases | *Feist* [S][87]; 37 C.F.R. 202.1(a) [V][74] | **Green** | The database right protects the *database* if there was substantial investment, for 15 years. Bulk extraction of a "substantial part" infringes even if each fact is free [S][82]. |
| A whole catalog's selection and arrangement | Thin compilation copyright at most | 17 U.S.C. §101 "compilation" [V][72] | Green to copy facts; avoid copying a curated list wholesale (e.g., "Best 100 X") | Database right as above |
| Table of contents (chapter titles only) | Mostly unprotectable short phrases; a long TOC may be a thin compilation [I] | 37 C.F.R. 202.1 [V][74] | **Green/yellow.** Store it; don't republish full TOCs of entire catalogs as a product [I] | As above |
| Annotated TOC or chapter summaries (publisher-written) | Protected expression | *ROSS*: even short editorial summaries of opinions (headnotes) clear the "creative spark" bar [V][10] | **Yellow.** Link, or paraphrase at the idea level | Same |
| Abstract (author- or publisher-written) | Protected expression | Crossref: "Some abstracts … may be subject to copyright by publishers or authors" [V][51]; I4OA: abstracts are authors' creative work [V][53]; OpenAlex withholds plaintext abstracts "for legal reasons" [V][89] | **Yellow.** Display with a link-back; prefer CC-licensed or I4OA abstracts; don't sell an abstracts database [I] | Same; plus quotation limits |
| Publisher blurb / jacket copy | Protected marketing text | [I] | Yellow-green. Widely tolerated; quote with attribution | Same |
| Cover image thumbnail | Protected image; thumbnails in a search context are fair use (*Perfect 10*) | [S][83] | Green/yellow. Use the Open Library Covers API, small size, link out [I] | Less clear (no fair use) |
| LoC MARC records | Probably public domain as US-government works (17 U.S.C. §105) [P]. LoC's page offers "nearly 25 million MARC records" free "primarily for research and development usage" and states no license [V][61] | — | Green [~85%] | n/a |

**Abstracts are the sharp edge for paper tools.**

- I4OA launched on 2020-09-24 [V][53].
- At launch, only **6.6%** of Crossref DOIs had abstracts in the metadata (25.5% of 2020 journal articles). Abstracts are currently deposited for about **7%** of records [V][53].
- OpenAlex's choice to ship an inverted index rather than plaintext [V][89] tells you how a well-lawyered open-data project reads the risk.

### 2. US fair-use precedents a literature tool will lean on

| Case | Court and date | Holding relevant to tools | Status (2026-10-15) | Verification |
|---|---|---|---|---|
| *Authors Guild v. HathiTrust*, 755 F.3d 87 | 2d Cir., 2014-06-10 | Full-text search over scanned in-copyright books is fair use; access for print-disabled users is fair use. In-copyright search results show page numbers and hit counts only | Final; settled 2015-01-06 | [S][25] |
| *Authors Guild v. Google*, 804 F.3d 202 | 2d Cir., 2015-10-16; cert. denied 2016-04-18 | Scanning, search and snippet display are "highly transformative" fair use. Commercial motive did not defeat it | Final | [S][24]. Snippet mechanics (one snippet per page, one in ten pages withheld): [P ~85%] |
| *Hachette v. Internet Archive* | S.D.N.Y. 2023-03-24; 2d Cir. 2024-09-04 | CDL of scanned in-copyright books is not transformative and not fair use. Internet Archive's use is non-commercial but that does not save it. Footnote 12 refuses to narrow the holding to books the Internet Archive owns | Final; no cert petition (deadline Dec. 2024) | [V][22]; [S][23] |
| *Thomson Reuters v. ROSS* | D. Del. Feb. 2025 (Bibas, by designation); 3d Cir. argued 2026-06-11, filed **2026-09-29** | 2,243 Westlaw headnotes are original. ROSS's use to train a non-generative legal-search AI was "minimally transformative, at best." Factor 4 counts harm to the "rapidly developing" market for licensing headnotes as AI training data. Footnote 7 distinguishes generative LLMs and the DOJ statement | ROSS's counsel (White & Case) told Courthouse News on 2026-09-30: "We intend to seek review by the Supreme Court." [corrected in verification] | [V][10]; [S][11] (the [12] case page does not mention cert) |
| *Bartz v. Anthropic* | N.D. Cal. (Alsup), **2025-06-23** | Training is "exceedingly transformative," fair use. Digitizing purchased print copies is fair use (a format-shift for a central library). Pirated library copies are not | Settled. $1.5B; final approval 2026-07-20 (Judge Martínez-Olguín); first payments expected by 2026-11-15 | [V][1][2][4] |
| *Kadrey v. Meta* | N.D. Cal. (Chhabria), **2025-06-25** | Summary judgment for Meta on training, limited to these 13 authors' arguments. The judge endorses "market dilution" as a potentially winning theory | Distribution and torrenting claim live; 4th Amended Complaint allowed 2026-03-25; summary-judgment hearing 2027-02-25 | [V][7]; [S][8][9] |
| *Authors Guild v. OpenAI* (in the OpenAI MDL, No. 1:25-md-3143) | S.D.N.Y. (Stein), **2025-10-27** | The output-infringement claim survives. Detailed plot summaries and sequel outlines are plausibly substantially similar. No fair-use ruling yet | Summary-judgment motions (Books and News) filed 2026-09-04; briefing ongoing; hearing "TBD" per tracker as of 2026-10-15 [corrected in verification] | [V][13]; [S][15] |
| *NYT v. Microsoft/OpenAI*, 777 F. Supp. 3d 283 | S.D.N.Y. 2025 | Motion to dismiss largely denied. Summaries of news *facts* that differ "in style, tone, length, and sentence structure" are not substantially similar | Part of the MDL; summary judgment pending | [V] via [13]; [S][26] |
| *Advance Local Media v. Cohere* | S.D.N.Y. (McMahon), 2025-11-13 | Partial motion to dismiss denied, including the "substitutive summaries" theory. The alleged outputs included 50 verbatim copies and 25 verbatim-plus-paraphrase copies | Ongoing | [S][18][19] |

**The emerging US rule of thumb, as of October 2026:**

1. **Acquisition matters.** Buying and scanning is defensible, at least in N.D. Cal. Piracy is not [V][1]. The USCO adds that "knowing use of a dataset that consists of pirated or illegally accessed works should weigh against fair use without being determinative" [V][29].
2. **Non-expressive uses are strong**: indexing, search, statistics, training a generative model. **Substitutive uses are weak**: lending full copies, a competing tool built on copied editorial text, summaries or abridgments that replace the book [V][1][10][22][29].
3. **Fiction plot detail is the danger zone** for summaries [V][13]. Fact-level summaries of news and non-fiction are much safer [V via 13].

**The US government is now a participant.**

- The DOJ Statement of Interest (2026-09-01) argues that training is "transformative—spectacularly so," borrowing Alsup's language. It calls dilution "deeply flawed" and warns that licensing mandates would give big tech an "oligopoly on LLM training" [S][16].
- The New York Times and the other news plaintiffs asked Judge Stein to give it "little weight" (2026-09-28) [S][16].
- The Third Circuit said the DOJ's concerns "do not apply here" [V][10].
- The USCO Part 3 report (pre-publication, 2025-05-09) remains the Office's view. No final version has been issued [V][28].

### 3. Are LLM-written summaries of copyrighted books infringing derivative works?

**Statute.**

- A "derivative work" includes an "abridgment, condensation, or any other form in which a work may be recast, transformed, or adapted" [V][72].
- So a summary is *legally capable* of being a derivative work. The test is substantial similarity in *protected expression*: plot sequence, characters, setting, selection of detail, and wording. Ideas, facts and arguments as such are not protected [I, high].

**Case law on summaries.**

- *Twin Peaks v. Publications International* (2d Cir. 1993) held detailed episode-by-episode plot recaps infringing. *Castle Rock v. Carol* (2d Cir. 1998) did the same for a Seinfeld trivia book. *Penguin Random House v. Colting* (S.D.N.Y. 2017) did the same for children's "KinderGuides" condensations of novels. All three are cited approvingly in the Stein opinion [V][13], and *Castle Rock* also appears in ROSS [V][10].
- **Stein, 2025-10-27** [V][13]:
  - ChatGPT summaries "include many specific details" and are "most certainly attempts at abridgment or condensation of some of the central copyrightable elements … such as setting, plot, and characters."
  - Generated sequel outlines were also plausibly infringing.
  - Footnote 3 distinguishes his own *NYT* ruling: summaries of news *facts* were not similar.
  - He made "no conclusions regarding fair use."
- *ROSS* shows that even *short* human summaries of factual material (headnotes summarizing judicial opinions) can be original expression [V][10]. Copying someone else's summaries is risky even when the underlying source is public domain.

**Fair-use analysis for a summary tool [I].**

- Factor 1 favors critical commentary, research notes, and short "what this book argues" descriptions. It cuts against summaries whose purpose is to let users skip the book.
- Factor 4 asks whether the summary substitutes for the book or for a licensable market. Study guides, abridgments, Blinkist-style key-idea summaries, and AI-training licenses are all real markets; ROSS credited the AI-licensing market [V][10].
- Factor 3 asks how much expression was taken. Length and detail of the summary are the proxy.

**My calibrated read [I].**

| Summary type | Likely status | Confidence |
|---|---|---|
| 1–3 sentence description or "why read this" note in your own words | Not substantially similar; even if it were, fair use | High [~90%] |
| Argument map or key-claims list for **non-fiction** (ideas, claims, evidence types), with short attributed quotes | Mostly unprotected ideas plus fair-use quotation | Medium-high [~75%] |
| Chapter-by-chapter condensation of non-fiction that tracks structure and examples closely | Gray. Selection and arrangement of detail is expression | Medium [~50% infringing if published at scale] |
| Detailed plot summary of in-copyright **fiction** (characters, scenes, ending) | Plausibly infringing per Stein; fair use undecided | Medium [~60–65% infringing if published as a substitute] |
| Private, ephemeral summary generated for one user from a copy they own, not redistributed | Technically creates a derivative; strong fair-use case and negligible enforcement risk | High that it is low-risk [~90%] |

**Other jurisdictions [P].**

- The EU has no open-ended fair use. The CJEU's *Infopaq* (2009) held that even 11-word extracts can reproduce protected expression [P, not re-verified].
- The UK has fair dealing for criticism, review and quotation (CDPA s.30) [P].
- In Japan, Art. 47-5 permits "minor" exploitation incidental to information-analysis services, judged partly by "the percentage of the work used" and the "accuracy of source indications" [V][39].
- Summaries for public display are therefore riskier in Europe than in the US [I, medium].

### 4. Text-and-data-mining exceptions outside the US

**United States.**

- There is no TDM-specific statute. Fair use carries the load (sections 2–3).
- There is a narrow DMCA §1201 exemption for circumventing DRM on e-books for TDM. It covers only a "researcher affiliated with a nonprofit institution of higher education," using copies "lawfully acquired and owned by the institution," with "effective security measures," and access limited to such researchers [V][75].
- It was renewed in the 2024 rulemaking (final rule 2024-10-28) [V][76]. On the three-year cycle it should run to about October 2027 [I].

| Jurisdiction | Provision | Who | Commercial? | Opt-out? | Contract override? | Status 2026 |
|---|---|---|---|---|---|---|
| EU | DSM Directive Art. 3 | Research organisations and cultural heritage institutions with "lawful access" | Scientific research | No opt-out; rightholders may secure networks only as "necessary" | Contract terms contrary to Art. 3 "shall be unenforceable" (Art. 7(1)) | In force (transposition deadline 2021-06-07) [V][34][36]; [S][37] |
| EU | DSM Art. 4 | Anyone with lawful access | Yes | Yes: rights "expressly reserved … in an appropriate manner, such as machine-readable means" for online content | Not protected by Art. 7 [V][36] | In force [V][35] |
| EU | AI Act Art. 53(1)(c)–(d) | Providers of general-purpose AI models | — | Must have a policy to respect Art. 4(3) reservations "including through state-of-the-art technologies" and publish a training-content summary | — | Applies from 2025-08-02 [V][41] |
| UK | CDPA s.29A | Anyone with lawful access | **Non-commercial research only** | n/a | Contract terms restricting it are "unenforceable" (s.29A(5)) | In force since 2014-06-01 [V][30] |
| UK | Proposed commercial TDM exception with opt-out (consultation 2024-12-17 to 2025-02-25) | — | — | — | — | **Dropped as the preferred option** in the report of 2026-03-18 (125 pp., made under Data (Use and Access) Act 2025 ss.135–136). The government will "not … intervene in the licensing market at this stage" [V][31][32][33] |
| Japan | Art. 30-4 | Anyone | Yes | No formal opt-out, but the proviso applies if the use would "unreasonably prejudice" the owner | — | In force [V][39] |
| Japan | Art. 47-5 | Information-analysis and search services | Yes | — | — | Permits "minor exploitation" in search or analysis results [V][39] |

**EU and German case law.**

- *Kneschke v. LAION* (LG Hamburg, 310 O 227/23, 2024-09-27) held that LAION's download of a photo to build a free research dataset fell within the Art. 3 research exception (German §60d). The ruling covered only the download step, not training or outputs [S][38].
- I could not verify the appeal outcome this session [open].
- *GEMA v. OpenAI* (LG München I, 2025-11-11) held that song lyrics "memorized" in a model are an unauthorized reproduction. It enjoined storage and output and ordered damages. The judgment was not yet final [S][42].
- That contrasts sharply with the UK *Getty v. Stability* ruling ([2025] EWHC 2863 (Ch), 2025-11-04). There a model that "does not store or reproduce any Copyright Works (and has never done so) is not an 'infringing copy'" [V][44]. The training claim had been abandoned because training took place outside the UK [V][44].

**Japanese guidance worth reading closely.** The ACA "General Understanding on AI and Copyright" (May 2024 overview) [V][40] says:

- RAG that "aim[s] to output the creative expression (wholly or partially) of a copyrighted work" has an "enjoyment" purpose, so Art. 30-4 does not apply. Such RAG may still be permitted "as long as the requirements of Article 47-5 … are" met.
- The Art. 30-4 proviso is triggered by reproducing databases offered for a fee for analysis, or by "avoiding … technical measures" such as **robots.txt** or ID and password gates.
- Knowingly collecting training data from piracy sites "should be strictly avoided" and creates a "high possibility" of liability.

### 5. Library e-resource licenses: the contract layer

**What the licenses say (verified examples).**

- **JSTOR** (terms updated 2026-04-24) [V][79]:
  - Prohibits users to "systematically print out, download, reproduce or distribute" Content.
  - Prohibits "downloading or printing substantial portions of a run of a journal."
  - Prohibits any activity that "automatically downloads or exports Content … web scraping, web harvesting."
  - Prohibits using Content "to train large language models or other generative AI technologies."
  - JSTOR may "suspend or terminate access to a specific user, IP address(es), or other authorization." It will contact the institutional licensee first where reasonably possible.
- **Elsevier website terms** (updated 2026-03-12) [V][78]:
  - No "systematic retrieval," and no "robots, spiders, crawlers or other automated downloading programs."
  - No use of Content "in combination with an artificial intelligence tool (including to train an algorithm, test, process, analyse, generate output …)" except as permitted by a "relevant license or subscription agreement or authorization by us."
  - Institutional license terms "shall control" in a conflict.
- **Elsevier TDM policy** [V][77]:
  - Researchers at subscribing academic institutions may text-mine ScienceDirect full text for non-commercial research.
  - They use a personal API key from the developer portal, including bulk full-text XML.
  - Corporate users must negotiate. Non-subscribers go case by case.

**Implications [I].**

- The fair-use question ("is analyzing this PDF with an LLM transformative?") is often moot for licensed content. The binding question is "does my institution's license permit AI processing?"
- Many 2025–26 publisher terms now say no unless negotiated. Contract claims in the US are generally enforceable against users who accept the terms. In hiQ, the court still found a User Agreement breach even after scraping public data was held not to be a CFAA violation [S][85].
- In the EU and UK the picture differs for research. Art. 3 TDM by research organisations (EU) and s.29A non-commercial research (UK) **cannot be contracted away** [V][30][36]. That gives European academic users a statutory floor that US users lack.

**What happens when access is cut.**

- Publishers' standard remedy for "systematic downloading" is to block the IP range, which is often a whole campus proxy. JSTOR's terms make this explicit [V][79].
- The institution then pressures the individual. Practical consequences: loss of library privileges, an employer disciplinary process, and in the extreme the history below [I].

**History: the Swartz/JSTOR case** [S][80].

- From 2010-09-25 into early 2011, a laptop on MIT's network bulk-downloaded JSTOR PDFs.
- Arrest: 2011-01-06. Federal indictment: 2011-07-11 (wire fraud and CFAA).
- JSTOR settled civilly in June 2011 and did not pursue a suit.
- The superseding indictment (2012-09-12) brought 13 felony counts, with exposure reported as up to 50 years and $1 million.
- Swartz died on 2013-01-11, and charges were dropped.
- The CFAA has since been narrowed: *Van Buren* (2021, 6–3) adopted a "gates-up-or-down" reading of "exceeds authorized access" [S][86]. Contract and terms-of-service liability is unaffected.

**Rule for builders.** Never automate bulk retrieval through an employer or university proxy session. Use the publisher's TDM API with your institution's key, or the open-access copy.

### 6. API terms and data licenses

| Source | Data license | Key API terms and limits (verified date) | Cost | What it means for a tool |
|---|---|---|---|---|
| **OpenAlex** | **CC0** [V][46] | Rate limits per second: 10 without a key, 30 with a free key or prepaid, 50 on annual plans. Semantic search 1/s. Cursor paging beyond page 1 needs a key (page updated 2026-10-14) [V][45]. Plaintext abstracts not shipped, only an inverted index. More than 50M works have `has_content.pdf`; content downloads are "available only through the API, not in the snapshot" [V][89] | Free budget $1/day with a key, $0.10/day without. Per 1,000 calls: single entity free; list or filter $0.10; search $1; semantic search $1; content download $10. Member $5,000/yr ($20/day); Member+ $10,000/yr ($100/day); Partner from $20,000/yr (page updated 2026-08-11) [V][46][47] | Green for metadata. Redistributing **OpenAlex-served PDFs** depends on each work's own license, not CC0 [I] |
| **Open Library** | No explicit license on the licensing page. The Internet Archive claims "no new rights" but warns "there may be existing rights issues on some contributions" [V][50] | 1 request/s unidentified; 3 request/s with a User-Agent and contact. "Don't use the APIs to bulk download metadata." Not "a data backend for third-party services" [V][49] | Free. Monthly dumps: editions ~9.2 GB, works ~2.9 GB, all types ~12.4 GB [V][48] | Green for metadata; use the dumps. The brief's assumption "CC0 dumps" is **not stated** on the official page [V] |
| **Crossref** | "Almost none of the metadata is subject to copyright, and you may use it for any purpose." Abstracts may be copyrighted [V][51] | No sign-up; a polite pool via `mailto` [V][51] | Free. Metadata Plus is paid, with snapshots and a 99.5% uptime target (fees on a separate page) [V][52] | Green for metadata; yellow for abstracts |
| **Semantic Scholar** | Datasets "separately governed by the licenses that accompany such S2 Data," for example CC BY-NC or ODC-BY [V][54] | Limited, non-transferable license. Must not "exceed or circumvent" limits. Attribution to "Semantic Scholar" required. AI2 may terminate "any time for any reason" [V][54]. Shared unauthenticated pool 1,000 request/s across all users; key starts at 1 request/s [V][55] | Free. 214M papers, 2.49B citations [V][55] | Green with attribution. Check each dataset's license (NC fields) before commercial use |
| **Google Books API** | Content belongs to rightsholders | Must remove content on request and provide a rightsholder contact. "You may not charge users any fee for the use of your application" without a Google agreement (terms dated 2012-04-25) [V][56]. Google APIs ToS §5(e): no "scrape, build databases, or otherwise create permanent copies," no caching beyond cache headers (2021-11-09) [V][57] | Free | **Red** for building a stored catalog from it; fine for live lookups and link-outs |
| **HathiTrust / HTRC** | **Extracted Features 2.0: CC BY 4.0** [V][59] | **HTRC services discontinued 2026-09-30**; accounts and Data Capsules gone; the HathiTrust Digital Library "remains open" [V][58][59]. HathiTrust's own terms pages returned 403 [open] | EF via rsync: 17,123,746 volumes (10,550,952 in-copyright; 6,572,794 public domain or CC); 6,221,631,336 pages; 2.9T tokens [V][59] | Green for page-level, token-count search. Mirror it while you can |
| **Wikidata** | Structured data **CC0**. Text in other namespaces is CC BY-SA 4.0 [V][60] | — | Free | Green |
| **LoC MARC Open-Access (MDSConnect)** | No license stated. Probably public domain as a federal work [P ~85%] | "Primarily for research and development usage" [V][61] | Free; ~25M records from the 2016 retrospective set [V][61] | Green |
| **Open Syllabus** | Proprietary. Licenses "portions of anonymized metadata" for commercial use on inquiry. "Does not license access to the original documents" [V][63] | Analytics requires an account and "logs user activity" [V][63]. Free tier capped at 2019 data; institutional subscriptions only, no individual plans [V][64] | 32.9M syllabi mapped [V][62] | Yellow. Link to Galaxy; negotiate for data |
| **YouTube** | Videos and captions belong to uploaders | No downloading or caching of audiovisual content without approval. Stored API data must be deleted or refreshed after 30 days. Scraping prohibited. No separating audio or video (policies updated 2026-09-14) [V][65]. `captions.download` "requires the user to have permission to edit the video" and costs 200 quota units [V][66]. ToS bans automated access except search engines following robots.txt (effective 2023-12-15) [V][67] | Free quota | **Red** to bulk-pull third-party transcripts. Link with timestamps instead; use CC-licensed lecture sources |

### 7. Creative Commons NC/ND and derived works

- **Exceptions come first.** CC licenses "do not reduce, limit, or restrict any rights under exceptions and limitations." License conditions "are not triggered by uses permitted under any applicable exceptions" [V][68].
  - If a summary is not an adaptation under copyright law, or is fair use, ND and NC do not bite.
- **What counts as an adaptation.** An adaptation "is a work based on one or more pre-existing works." Whether a use is one "depends primarily on the applicable copyright law" [V][68].
  - "Using an unaltered excerpt to illustrate an idea usually isn't an adaptation, but combining excerpts to create a new version of the original can be" [V][68].
- **NC** covers uses "primarily intended for or directed toward commercial advantage or monetary compensation." A nonprofit can violate it; a for-profit doesn't automatically do so [V][68].
- **TDM** is expressly licensed in all six 4.0 licenses. Avoid mining NC material for commercial purposes, and attribute if you share results [V][68].
- **CC's AI guidance** (May 2025) is deliberately conservative ("will almost certainly lead to overcompliance") [V][69]:
  - NC "applies to all uses requiring permission."
  - ND works "should not be used as training data."
  - SA suggests sharing outputs under the same license.
  - Attribution for RAG outputs should be tied to the specific work where possible.

**Builder rules [I].**

- **Public domain and CC BY / BY-SA:** store, summarize, display and redistribute with attribution. SA carries over to *adaptations* you publish.
- **BY-ND:** store and index the full text; show quotes; publish only short, idea-level descriptions. Do not publish condensed versions.
- **BY-NC (-ND/-SA):** fine for a personal or non-commercial research tool. A paid or ad-supported product should treat NC texts as "metadata plus link" only.

### 8. Linking, deep-linking and framing

**United States.**

- The Ninth Circuit's "server test" (*Perfect 10 v. Amazon*, 2007) holds that you don't "display" what you don't store and transmit. *Hunley v. Instagram* (2023-07-17) reaffirmed it beyond search engines [S][83].
- S.D.N.Y. judges have rejected it: *Goldman v. Breitbart* (2018), *Nicklen* (2021), *McGucken* (2022) [S][83].
- The Fifth Circuit's *Emmerich Newspapers v. Particle Media* (2026-08-27) called the server test "weak statutory footing." It asks "who transmitted the copy," finds no infringement where the rightsholder's server transmitted, and holds that URLs are not categorically excluded from DMCA copyright management information; whether a given URL qualifies is fact-specific, and the CMI claims were remanded [S][83]. [corrected in verification]
- Plain hyperlinks and deep links to lawful copies are low-risk everywhere in the US [S][88; I, high].
- Linking to *infringing* copies "can be sufficiently problematic to give rise to legal liability" through contributory infringement [S][88].

**European Union.**

- *Svensson* (C-466/12, 2014) allows links to freely available, authorized content.
- *GS Media* (C-160/15, 2016-09-08) holds that linking to unauthorized content without profit and without knowledge is not a communication to the public. But "if those hyperlinks are provided for profit, knowledge of the illegality … must be presumed" [V][84].

**Shadow libraries.** Courts in 2026 went after intermediaries [S][81]:

- *Spotify v. Anna's Archive* (S.D.N.Y.): a preliminary injunction on 2026-01-16 covering registries, hosts and Cloudflare, then a **$322M** default judgment on 2026-04-15.
- Thirteen publishers (S.D.N.Y.): **$19.5M** default judgment plus a global domain takedown on 2026-05-19.
- *OCLC* (S.D. Ohio): January 2026 default judgment ordering deletion of scraped WorldCat data.

A tool that surfaces LibGen, Sci-Hub or Anna's Archive links is in red territory. That is especially true commercially and in the EU [I, high].

### 9. DMCA safe harbor if users upload PDFs

- **§512(c)** covers material stored "at the direction of a user" if the provider [V][73]:
  - lacks actual or "red flag" knowledge;
  - acts "expeditiously" on notices;
  - gets no direct financial benefit from infringement it has the "right and ability to control";
  - designates an agent.
- **§512(i)** requires a reasonably implemented repeat-infringer termination policy [V][73].
- **§512(d)** covers "referring or linking users" via an index or directory, on parallel conditions [V][73].
- **Agent registration** is online only and costs **$6** per designation. It expires after **three years** unless renewed, and lapse "risks losing" safe harbor [V][70][71].

**Design implications [I].**

- **Local-first.** Files never leave the device, so there is no hosting and no §512 issue. This is the cleanest design for "ingest my PDFs."
- **Private cloud locker per user, no sharing.** Low risk, but register an agent anyway for $6.
- **Shared library or public collections.** Full §512 compliance is required. Avoid features that look like distribution (public download links, "popular PDFs" pages). Think hard about "right and ability to control" if you monetize per-document.

### 10. Recent changes, at a glance (2024–2026)

| Date | Event | Source |
|---|---|---|
| 2024-09-04 | 2d Cir. affirms against Internet Archive on CDL | [V][22] |
| 2024-09-27 | LG Hamburg: LAION dataset download covered by research TDM exception | [S][38] |
| 2024-10-28 | 1201 TDM exemptions renewed | [V][76] |
| 2025-05-09 | USCO Part 3 (pre-publication): RAG summaries "less likely to be transformative"; knowing use of pirated data weighs against fair use | [V][29] |
| 2025-06-23 / 06-25 | Bartz and Kadrey fair-use orders | [V][1][7] |
| 2025-08-02 | EU AI Act GPAI obligations (opt-out policy, training summary) apply | [V][41] |
| 2025-10-27 | Stein: plot summaries plausibly infringing | [V][13] |
| 2025-11-04 | UK *Getty v. Stability*: a model is not an "infringing copy" | [V][44] |
| 2025-11-11 | Munich *GEMA v. OpenAI*: memorized lyrics are reproductions | [S][42] |
| 2025-11-13 | *Cohere*: substitutive-summary theory survives | [S][18] |
| Jan–May 2026 | Anna's Archive judgments: OCLC, Spotify ($322M), publishers ($19.5M) | [S][81] |
| 2026-03-12 / 04-24 | Elsevier and JSTOR terms add explicit AI prohibitions | [V][78][79] |
| 2026-03-18 | UK drops the opt-out TDM exception as its preferred option | [V][32][33] |
| 2026-07-11 | Hachette, Cengage, Elsevier and others sue Google over Gemini (S.D.N.Y.) | [S][21] |
| 2026-07-20 | Bartz $1.5B settlement final approval | [V][2] |
| 2026-08-04 | 9th Cir. vacates injunction against Perplexity's Comet agent: the *user* "accesses" Amazon, not the agent (CFAA) | [S][20] |
| 2026-08-27 | 5th Cir. *Emmerich*: "who transmits" test for display | [S][83] |
| 2026-09-01 | DOJ Statement of Interest: training is fair use | [S][16] |
| 2026-09-29 | 3d Cir. affirms ROSS: headnotes copyrightable; training a competing non-generative tool is not fair use | [V][10] |
| 2026-09-30 | HTRC Analytics services end | [V][58] |
| 2026-10-08 | 148 AI copyright suits pending in the US, per tracker | [S][17] |

---

## Green / yellow / red: things a literature tool might do (US-centric)

How to read the ratings:

- **Green:** low legal risk if done as described.
- **Yellow:** defensible but contested, or depends on contract, license or implementation. Get advice before commercializing.
- **Red:** likely infringing or in breach. Don't.

| # | Tool behavior | Rating | Why | Mitigation / safer variant | Non-US note |
|---|---|---|---|---|---|
| 1 | Store and redistribute bibliographic metadata (title, author, IDs, subjects, dates) from Wikidata, OpenAlex, Crossref and LoC | **Green** | Facts and short phrases unprotectable [S][87][V][74]; CC0 sources [V][46][60] | Keep provenance per field | EU/UK database right: don't wholesale-extract a single European database [S][82] |
| 2 | Bulk-ingest Open Library dumps | **Green** | Dumps provided for bulk use; Internet Archive claims no new rights [V][48][50] | Attribute; don't hammer the API (≤3/s) [V][49] | Same |
| 3 | Store tables of contents (chapter titles) | **Green/yellow** | Mostly short phrases; long or annotated TOCs carry expression [I] | Store titles only; link to publisher TOC | Database right if scraped wholesale |
| 4 | Display abstracts | **Yellow** | Abstracts are copyrighted [V][51][53]; OpenAlex avoids plaintext "for legal reasons" [V][89] | Prefer CC-BY or I4OA abstracts; show with DOI link; or generate your own one-line description | Same, with less fair-use cover |
| 5 | Cover thumbnails | **Green/yellow** | Thumbnail search display is fair use (*Perfect 10*) [S][83] | Small size, link to source, use the OL Covers API | Riskier |
| 6 | Full-text store, search and summary of **public-domain** books | **Green** | No copyright | Watch for in-copyright introductions and translations in "PD" editions [I] | PD terms differ: life+70 in EU/UK/Japan versus US publication-date rules [P] |
| 7 | Store and publish LLM summaries of **CC BY / BY-SA** OA books | **Green** | License permits adaptations with attribution; SA on published adaptations [V][68] | Attribute and link; tag SA outputs | Same |
| 8 | Same for **CC BY-ND** books | **Yellow** | A condensation may be an "adaptation" [V][68] | Publish idea-level descriptions and short quotes only; keep detailed summaries private | Same |
| 9 | Same for **CC BY-NC** books in a paid product | **Yellow/red** | NC bars commercial uses needing permission [V][68][69] | Metadata plus link only; or keep the tool non-commercial | Same |
| 10 | Store and publish short (≤3 sentence) original descriptions of **in-copyright** books | **Green** | Ideas and facts; review-like fair use [I] | Human-edited, no plot spoilers for fiction | Quotation/review exceptions; less certain |
| 11 | Publish idea-level argument maps of in-copyright **non-fiction** | **Yellow-green** | Ideas unprotected; structure-tracking condensations are gray [I][13] | Limit detail, cite pages, add commentary, measure overlap | Riskier in EU |
| 12 | Publish detailed chapter or plot summaries of in-copyright **fiction** | **Red** (at scale) | Stein 2025; *Twin Peaks*; *Colting* [V][13]; USCO on abridgments [V][29] | Keep private; or brief, spoiler-free descriptions | Red |
| 13 | Generate summaries on the fly, privately, for one user from a copy they lawfully own | **Green** (personal) / **yellow** (as a hosted service) | Private research use [I]; hosting raises output-liability questions (Stein, *Cohere*) [V][13][S][18] | Run locally; don't cache or share outputs across users | Japan Art. 30-4/47-5 friendlier; EU private-copy rules vary [P] |
| 14 | Page-level search using **HTRC Extracted Features** (token counts) | **Green** | CC BY 4.0, non-expressive features [V][59]; *HathiTrust* logic [S][25] | Mirror the dataset now (services ended 2026-09-30) [V][58] | Fine |
| 15 | Full-text search over books you bought and scanned, showing only page numbers and hit counts | **Yellow-green** | Bartz: digitizing purchased print copies is fair use (N.D. Cal.) [V][1]; *HathiTrust* search [S][25]; but *Hachette* says digitization is not transformative per se [V][22] | Keep the scans private; no lending; HathiTrust-style output | EU/UK: no general exception for format-shifting [P] |
| 16 | Show snippets from in-copyright books | **Yellow** | *Google Books* allowed tightly limited snippets [S][24] | Hard caps per page and per book; withhold some pages; no reconstructable text [P] | Riskier |
| 17 | Cache and re-serve PDFs of **CC-licensed** OA books and articles | **Green** | License permits redistribution with conditions [V][68] | Check the actual license per item (OpenAlex `oa_status` is not a license) [V][89] | Same |
| 18 | Cache and re-serve "free-to-read" (bronze OA) or publisher-hosted PDFs without an open license | **Red** | Free to read is not a license [I] | Link out to the publisher or repository copy | Red |
| 19 | Deep-link to lawful copies (publisher, arXiv, repositories, IA public domain, HathiTrust PD) | **Green** | *Perfect 10*, *Hunley*, *Emmerich* [S][83]; *Svensson* [V][84] | Avoid framing that hides the source | Green |
| 20 | Link to shadow libraries (LibGen, Sci-Hub, Anna's Archive, Z-Lib) | **Red** | Contributory risk; 2026 judgments and domain seizures [S][81]; EU profit presumption [V][84] | Never | Red |
| 21 | Ingest a user's own PDFs locally (no upload) | **Green** | No distribution; private use [I] | Local models or explicit consent for cloud calls | Fine |
| 22 | Send PDFs downloaded under an **institutional license** (Elsevier, JSTOR) to a cloud LLM | **Yellow/red** (contract) | Elsevier bars use "in combination with an artificial intelligence tool" unless licensed [V][78]; JSTOR bars LLM training [V][79] | Check the institution's license; use the institution's AI-approved tools or the publisher TDM API [V][77] | EU Art. 3 / UK s.29A research TDM can't be contracted away [V][30][36] |
| 23 | Accept user uploads in a hosted, shareable library | **Yellow** | Needs full §512(c)/(i) compliance [V][73] | Register an agent ($6, 3-year renewal) [V][71]; takedown flow; repeat-infringer policy; default-private | EU DSA / Art. 17 regimes differ [P] |
| 24 | Scrape public library catalogs (OPACs) | **Yellow** | Facts are free [S][87]; CFAA narrowed (*Van Buren*, hiQ) [S][85][86]; terms of service still bind [S][85] | Use Z39.50/SRU/APIs; rate-limit; honor robots.txt | EU/UK database right [S][82]; Japan proviso on avoiding technical measures [V][40] |
| 25 | Bulk-scrape WorldCat | **Red** | OCLC terms; Jan. 2026 default judgment against Anna's Archive [S][81] | Use Open Library, LoC, Wikidata, OpenAlex instead | Red |
| 26 | Bulk-download papers through an employer or university subscription | **Red** | "Systematic" downloading barred; IP-range suspensions [V][79][78]; Swartz history [S][80] | Publisher TDM API with a personal key [V][77]; OA copies | EU/UK research exceptions help only for non-commercial research with lawful access |
| 27 | Circumvent e-book DRM to text-mine | **Red** (individual) / **yellow** (qualifying university researcher) | §1201(b)(5) exemption is limited to nonprofit higher-ed researchers with security measures [V][75] | Use DRM-free and OA sources | Varies |
| 28 | Build a stored database from the **Google Books API** | **Red** (contract) | ToS §5(e) bars "build databases … permanent copies" [V][57]; no fees without permission [V][56] | Live lookups and link-outs only | Same |
| 29 | Pull and store YouTube lecture transcripts at scale | **Red** (contract) | No scraping; 30-day data rule; captions only for editors [V][65][66][67] | Link with timestamps; use CC-licensed lecture sources or ask creators | Same |
| 30 | Fine-tune or train a model on books you bought and scanned | **Yellow** | Bartz fair use [V][1]; DOJ supportive [S][16]; but ROSS (competing substitute) not fair use [V][10] and Kadrey dilution [V][7] | Generative, non-substitutive purpose; output filters | EU Art. 4 opt-outs [V][35]; UK has no commercial exception [V][33]; Japan permissive [V][39][40] |
| 31 | Train or RAG on shadow-library copies | **Red** | Bartz piracy liability; $1.5B settlement [V][1][2]; USCO bad-faith factor [V][29]; Japan guidance [V][40] | Never | Red |
| 32 | Copy another service's summaries, headnotes or abstracts to train or seed your tool | **Red** | *ROSS* (2026) [V][10] | Write your own or license | Red |

---

## Numbers that matter

| Quantity | Value | Date of information | Source |
|---|---|---|---|
| Bartz settlement fund | $1,500,000,000 (non-reversionary) | final approval 2026-07-20 | [V][2] |
| Works on the Bartz Works List | 482,460 | 2026 | [V][2] |
| Estimated payment per work | ≈$3,000 before fees and costs; ~4× the $750 statutory minimum | notice ordered 2025-11-18; order 2026-07-20 | [V][2][3] |
| Bartz claims rate | 91.3% of works (440,490 claimed) | as of 2026-04-16 | [V][2] |
| Bartz opt-outs and objections | 350 valid opt-outs covering 1,802 works; 54 objections or comments | 2026-07-20 | [V][2] |
| Bartz attorneys' fees | $101,561,111 (~6.8% of fund; 12.5% requested) plus $2.64M expenses and $18.22M cost reserve | 2026-07-20 | [V][2] |
| Default author/publisher split (trade books) | 50/50; education works excluded from the default | 2026 | [V][3] |
| First Bartz payments expected | on or before 2026-11-15 | as of 2026-10-15 | [V][4] |
| Pirated copies Anthropic downloaded | >7 million (≥5M LibGen, ≥2M PiLiMi, plus Books3) | 2025-06-23 | [V][1] |
| Statutory damages range per work | $200 (innocent) – $150,000 (willful) | 2026 | [V][2] |
| Theoretical Bartz statutory exposure | $361.8M (×$750) to $72.4B (×$150,000) | — | [I] calculation from 482,460 works |
| ROSS: headnotes at issue / training memos | 2,243 headnotes; ~25,000 memos | 2026-09-29 | [V][10] |
| Kadrey plaintiffs | 13 authors; distribution claim summary judgment set for 2027-02-25 | 2025-06-25 / 2026-03-27 | [V][7]; [S][8] |
| Hachette: works in suit / books pulled from CDL | 127 works; ~500,000 books | 2024 | [V][22]; [S][23] |
| US AI copyright suits pending | 148 | 2026-10-08 | [S][17] |
| Anna's Archive judgments | $322M (Spotify, 2026-04-15); $19.5M (publishers, 2026-05-19) | 2026 | [S][81] |
| HTRC EF 2.0 | 17,123,746 volumes (10,550,952 in-copyright); 6,221,631,336 pages; 2,906,819,723,689 tokens; CC BY 4.0 | 2026-10 | [V][59] |
| OpenAlex free budget | $1/day with key; $0.10/day without | updated 2026-08-11 | [V][46][47] |
| OpenAlex prices per 1,000 calls | List/filter $0.10; search $1; content download $10; single entity free | 2026 | [V][47] |
| OpenAlex annual plans | $5,000 / $10,000 / from $20,000 | 2026-08-11 | [V][46] |
| OpenAlex rate limits | 10 / 30 / 50 requests per second (no key / free key / annual) | 2026-10-14 | [V][45] |
| OpenAlex works with a PDF | >50 million | 2026 | [V][89] |
| Open Library API rate | 1 request/s (anonymous); 3 request/s (identified) | 2026 | [V][49] |
| Open Library dumps | editions ~9.2 GB; all types ~12.4 GB; full history ~29.6 GB (compressed) | 2026 | [V][48] |
| Crossref records with abstracts | ~7% (6.6% at I4OA launch, 2020) | — | [V][53] |
| Semantic Scholar corpus | 214M papers; 2.49B citations; 79M authors | 2026 | [V][55] |
| LoC MARC Open-Access | ~25 million records | 2026 | [V][61] |
| Open Syllabus | 32.9 million syllabi | 2026 | [V][62] |
| YouTube API stored-data refresh | 30 days; deletion on request within 7 days | updated 2026-09-14 | [V][65] |
| YouTube `captions.download` quota cost | 200 units; requires edit permission | 2026 | [V][66] |
| DMCA agent fee and term | $6; expires after 3 years | 2026 | [V][71] |
| UK AI copyright report | 125 pages, published 2026-03-18 | 2026 | [V][32] |
| Swartz superseding indictment | 13 felony counts; reported maximum 50 years and $1M | 2012-09-12 | [S][80] |

---

## Surprises and recent changes (2024–2026)

1. **The Third Circuit affirmed ROSS on 2026-09-29.** It is the first US appellate ruling on AI training and fair use, and it went against the AI company. The panel narrowed its reasoning to *non-generative* substitutes, and footnote 7 explicitly sets aside generative LLMs and the DOJ statement [V][10]. A cert petition is likely [S][11].
2. **The federal government filed for the AI side** in the OpenAI MDL on 2026-09-01 [S][16]. This was an unusual move, and the Third Circuit pointedly noted the DOJ "did not do so" in ROSS [V][10].
3. **Bartz claims ran at 91%**, far above typical class actions. Final approval came from a *different judge*: Alsup was replaced by Martínez-Olguín [V][2]; [S][27]. Alsup's September 2025 concerns about the deal (reported as a rejection [S][26]) were resolved, with a preliminary-approval memorandum on 2025-10-17 [V][5]. The fee award was cut from the 12.5% requested to about 6.8% of the fund [V][2].
4. **HTRC shut down on 2026-09-30** [V][58]. The court-blessed "non-consumptive research" infrastructure for in-copyright books lost its compute layer, and only the derived datasets remain listed.
5. **OpenAlex went metered** and started serving PDFs: over 50M works, at $10 per 1,000 downloads [V][46][47][89]. It also openly states it withholds plaintext abstracts for legal reasons [V][89].
6. **Open Library's official licensing page does not say CC0** [V][50], contrary to a common assumption.
7. **Publishers rewrote their terms against AI.** Elsevier's general website terms now bar using content with *any* AI tool, including analysis, unless licensed [V][78]. JSTOR bans LLM training [V][79]. The constraint is contract, and it applies even to "fair" uses.
8. **The UK did not liberalize.** The 2026-03-18 report abandoned the opt-out commercial TDM exception as its preferred option [V][33].
9. **Courts went after intermediaries.** Anna's Archive was hit through registries, Cloudflare and hosts [S][81]. A Ninth Circuit panel meanwhile protected *user-directed* AI agents under the CFAA (*Amazon v. Perplexity*, 2026-08-04) [S][20].
10. **US "display" doctrine shifted again.** The Fifth Circuit's *Emmerich* (2026-08-27) replaced the server test with "who transmitted" [S][83].
11. **Europe split on whether models contain copies.** Munich said memorized lyrics are reproductions [S][42]; London said Stable Diffusion is not an "infringing copy" [V][44].

---

## Contested or uncertain points

- **Is generative training fair use?**
  - The district-court votes are 2–0 for (Bartz, Kadrey on that record), and the DOJ supports that view.
  - The USCO says it is context-dependent, and the Third Circuit held non-generative substitutive training unfair.
  - The OpenAI MDL summary judgment (S.D.N.Y.) is the next big data point. I put **[~55%]** on at least partial fair-use wins for training in S.D.N.Y. by end-2027 [I, low-medium confidence], and **[~40%]** that the Supreme Court takes ROSS or an AI-training case by end-2027 [I, low].
- **Market dilution.** Chhabria endorsed it in principle [V][7]; the DOJ calls it "deeply flawed" [S][16]. Unresolved.
- **Summaries.** Stein's ruling is at the motion-to-dismiss stage only [V][13]. No court has yet ruled on *fair use* of AI summaries. The non-fiction versus fiction line is my inference, supported by the *NYT* (facts) and *Game of Thrones* (plot) contrast [V][13].
- **Format-shifting purchased books.** Bartz says scanning purchased print copies for a central library is fair use [V][1]. *Hachette*'s Second Circuit language says digitization alone "is not transformative" [V][22]. A circuit split is plausible [I].
- **Contract versus fair use.** Whether license and ToS bans on AI processing are preempted by copyright, or are unconscionable, for individual researchers is unsettled in the US. EU and UK research exceptions override contracts by statute [V][30][36].
- **EU opt-out form.** Whether natural-language ToS reservations count as "machine-readable" under Art. 4 was addressed obiter in *LAION* (LG Hamburg). I could not verify the appeal [open]. CJEU *Like Company v. Google* (C-250/25) is a pending reference; I could not reach the docket.
- **Do model weights contain copies?** UK (*Getty*) says no; Munich (*GEMA*) says yes for memorized content.
- **Open Library licensing.** Effectively open, but not formally CC0 on the official page [V][50].
- **HTRC EF longevity.** It is still listed for rsync after the shutdown [V][59]. How long it will stay hosted is unknown.

---

## Implications for someone building tools to explore literature

1. **Architect around a rights ledger.** Every item and every derived artifact carries a rights state, and operations are gated by policy.
   - Rights states: PD, CC-BY, CC-BY-SA, CC-ND, CC-NC, in-copyright-owned, in-copyright-licensed (with license ID), unknown.
   - Operations: store full text, summarize privately, publish summary, show snippet, link only.
   - Provenance was the decisive fact in Bartz [V][1]; keep acquisition logs.
2. **Metadata is your shareable backbone. Text is local and private.**
   - Wikidata, OpenAlex, Crossref, LoC and Open Library dumps give you a redistributable graph [V][46][48][51][60][61].
   - Full text of in-copyright works lives only on the user's machine, from sources they lawfully hold.
3. **Summaries have two modes.**
   - *Private*: anything goes for the user's own reading, generated on their device or session and not cached across users.
   - *Public*: short, original, idea-level descriptions only, with an automatic overlap and plot-density check before publishing. Treat fiction plot detail as red [V][13].
4. **Prefer link-out over host-out.** Resolve each work to its best *lawful* copy: publisher, repository, arXiv, HathiTrust PD, Internet Archive PD, or your public library's OverDrive. Never surface shadow libraries [S][81][V][84].
5. **Budget for OpenAlex.**
   - At $1/day free you get about 10,000 list calls or 1,000 searches per day [V][47]. Use the CC0 snapshot for bulk work and the API for freshness.
   - Treat OpenAlex-served PDFs as subject to each work's own license [I].
6. **Respect API terms as hard constraints.**
   - Google Books: live lookups only [V][57].
   - YouTube: link with timestamps; no transcript hoarding [V][65].
   - Semantic Scholar: attribution, plus per-dataset licenses [V][54].
   - Open Library: ≤3 request/s and use the dumps [V][49].
7. **Licensed scholarly content is a contract problem.**
   - Before a tool sends ScienceDirect or JSTOR PDFs to a cloud LLM, check the institution's license [V][78][79].
   - The safe path is the publisher TDM API [V][77], an institution-approved AI service, or local models.
8. **For EU users, honor opt-outs.** Read robots.txt and TDM-reservation signals. Under Art. 4 they are legally operative [V][35]. Japan's guidance treats avoiding robots.txt as a proviso trigger [V][40].
9. **If you host uploads, do §512 properly** [V][71][73]:
   - Register an agent ($6).
   - Set a 3-year renewal reminder.
   - Run takedown and counter-notice flows.
   - Enforce a repeat-infringer policy.
   - Make uploads private by default.
10. **Watch the pipeline.** Five things could change the map within about 12 months:
    - the OpenAI MDL summary-judgment ruling;
    - a ROSS cert petition;
    - the Kadrey distribution ruling (2027-02-25);
    - the publishers' suits against Google and Meta;
    - EU national courts and the CJEU on Art. 4 opt-outs.

---

## Ideas sparked

1. **Rights-aware ingestion router.** A small library, for example a Claude Code skill plus a Python package, that classifies each document's rights state.
   - Inputs: CC license metadata, OpenAlex `oa_status`, Crossref license URLs, PD date rules, and PDF provenance watermarks such as "Downloaded from ScienceDirect."
   - It emits an allowed-operations manifest that downstream code must consult.
   - Unknown-rights items default to "link only."
2. **Plot-density and overlap linter for summaries.** Before publishing any summary of an in-copyright work, compute:
   - n-gram overlap with the source;
   - named-character and scene density;
   - spoiler and ending detection.
   Fiction summaries that exceed thresholds are blocked or downgraded to "spoiler-free description." This turns the Stein, *Twin Peaks* and *Colting* line into code.
3. **HathiTrust-mode personal search.** Scan the books you own (Bartz-style format-shift [V][1]) and index them locally. The public or shared view shows only "page 143: 4 hits," as in *HathiTrust* [S][25]. The private view gives full RAG over your own shelf.
4. **EF Explorer.** A static, client-side explorer over the HTRC Extracted Features 2.0 dump (17M volumes, CC BY) [V][59].
   - Features: word-trend lines across 1700–2020, "which pages talk about X" heatmaps per volume, and topic fingerprints for in-copyright books.
   - It uses no expressive text and needs no license negotiation.
   - Build it now, before the rsync endpoint disappears.
5. **Lawful-copy resolver.** Given any title or DOI, rank access routes:
   - CC-licensed copy;
   - repository copy;
   - HathiTrust PD;
   - Internet Archive borrowable (non-CDL-restricted);
   - your library's Libby;
   - used-print price.
   It shows the license badge and what you may do with each. It replaces the temptation to link shadow libraries.
6. **Contract-aware PDF drop zone.** When a user drags in a PDF, detect publisher cover pages and watermarks, look up the institution's license terms where known, and route accordingly:
   - local model only;
   - institution-approved cloud tool;
   - "this publisher prohibits AI processing under your license; request TDM API access?" [V][78][79].
7. **Opt-out compliance shim for crawlers.** One function that checks robots.txt, TDM-reservation headers and site ToS flags before any fetch, and logs the decision. This creates an EU Art. 4 and Japan Art. 30-4 proviso audit trail [V][35][40].
8. **Snippet budgeter.** Enforces Google-Books-like display limits in code: one snippet per page, a per-book cap, and a fixed fraction of pages withheld. Any "show text" feature on in-copyright books then stays inside the precedent [S][24].
9. **Legal-risk forecast board** (fits a forecasting audience). Track pending decisions with probability estimates and resolution dates, and auto-update when the tracker posts:
   - OpenAI MDL summary judgment;
   - ROSS cert;
   - Kadrey distribution (2027-02-25);
   - Hachette v. Google;
   - CJEU C-250/25.
   Tie each to the green/yellow/red rows it would flip.
10. **Summary commons with clean provenance.** A shared wiki of human-edited, CC BY summaries of PD and CC-BY works, plus short original "why read this" notes for in-copyright works. Every entry links to its source and license, so the corpus is safe to train on and redistribute.
11. **Timestamped lecture index without transcripts.** For YouTube lectures, store only title, chapter markers you write yourself, and deep links with `t=` parameters. Pull full transcripts only for CC-licensed channels or creator-permitted sources [V][65][66].
12. **Pre-commit "ToS linter" for Claude Code projects.** Static checks that flag:
    - writes of Google Books API responses to a database [V][57];
    - YouTube transcript scrapers [V][65];
    - loops hitting publisher domains through a proxy [V][78][79];
    - requests to known shadow-library domains [S][81].
    It catches risky patterns before they ship.

---

## Sources

1. Bartz v. Anthropic, N.D. Cal. No. 3:24-cv-05417, Dkt. 231, "Order on Fair Use" — https://storage.courtlistener.com/recap/gov.uscourts.cand.434709/gov.uscourts.cand.434709.231.0.pdf — 2025-06-23
2. Bartz v. Anthropic, Dkt. 680, "Order Granting Final Approval of Class Action Settlement; Granting in Part Motion for Attorneys' Fees…; Judgment" — https://assets-us-01.kc-usercontent.com:443/1eeb16db-4934-006e-40a6-38fa91285ebb/36cce252-a32c-4cbb-a624-31dd8ac9574c/2026-07-20%20Order%20Granting%20Final%20_dckt%20680_0_.pdf — 2026-07-20
3. Bartz v. Anthropic, Long-Form Notice (ordered 2025-11-18; deadline update 2026-01-08) — https://assets-us-01.kc-usercontent.com:443/1eeb16db-4934-006e-40a6-38fa91285ebb/ce109a57-390c-4d76-ad65-5807d4830fe5/ANT%20-%20Long-Form%20Notice_Updated%20Deadline%201.8.2026.pdf — 2026-01
4. Anthropic Copyright Settlement website (key dates, payment status) — https://www.anthropiccopyrightsettlement.com/ — accessed 2026-10-15
5. Anthropic Copyright Settlement, Important Documents — https://www.anthropiccopyrightsettlement.com/documents — accessed 2026-10-15
6. Bloomberg Law, "Anthropic, Authors' $1.5 Billion Deal Earns Final Approval" — https://news.bloomberglaw.com/litigation/anthropic-authors-1-5-billion-deal-receives-final-approval — 2026-07-20
7. Kadrey v. Meta, N.D. Cal. No. 3:23-cv-03417, Dkt. 598, order on cross-motions for partial summary judgment — https://storage.courtlistener.com/recap/gov.uscourts.cand.415175/gov.uscourts.cand.415175.598.0.pdf — 2025-06-25
8. ChatGPT Is Eating the World, "Kadrey v. Meta gets scheduling order. Summary judgment motion hearing for distribution claim won't be heard until Feb. 25, 2027" — https://chatgptiseatingtheworld.com/2026/03/27/kadrey-v-meta-gets-scheduling-order-summary-judgment-motion-hearing-for-distribution-claim-wont-be-heard-until-feb-25-2027/ — 2026-03-27
9. ChatGPT Is Eating the World, "Judge Chhabria grants Kadrey's request to file 4th Amended Complaint…" — https://chatgptiseatingtheworld.com/2026/03/25/judge-chhabria-grants-kadreys-request-to-file-4th-amended-complaint-to-add-contributory-infringement-claim-related-to-torrenting-but-judge-strongly-rebukes-kadreys-lawyers-for-pattern-of-blam/ — 2026-03-25
10. Thomson Reuters v. ROSS Intelligence, 3d Cir. No. 25-2153, precedential opinion (argued 2026-06-11) — https://www2.ca3.uscourts.gov/opinarch/252153p.pdf — filed 2026-09-29
11. Courthouse News, "AI training of copyrighted material not fair use, Third Circuit" — https://www.courthousenews.com/ai-training-of-copyrighted-material-not-fair-use-third-circuit/ — 2026-09-30
12. ChatGPT Is Eating the World, Thomson Reuters v. ROSS case page — https://chatgptiseatingtheworld.com/thomson-reuters-v-ross-intelligence/ — accessed 2026-10-15
13. Authors Guild v. OpenAI (S.D.N.Y. No. 1:23-cv-08292), Dkt. 716, Opinion & Order denying motion to dismiss output claims (Stein, J.) — https://chatgptiseatingtheworld.com/wp-content/uploads/2025/10/JUDGE-STEIN-ORDER-DENYING-MTD-Authors-Guild-et-al-v.-OpenAI-Inc.-et-al-Entry-716.pdf — 2025-10-27
14. ChatGPT Is Eating the World, "Judge Stein issues opinion denying OpenAI's motion to dismiss claim based on allegations of some infringing outputs" — https://chatgptiseatingtheworld.com/2025/10/27/judge-stein-issues-opinion-denying-openais-motion-to-dismiss-claim-based-on-allegations-of-some-infringing-outputs/ — 2025-10-27
15. ChatGPT Is Eating the World, In re OpenAI Copyright Infringement Litigation summary-judgment page — https://chatgptiseatingtheworld.com/in-re-openai-copyright-inf-ltgn/ — accessed 2026-10-15
16. ChatGPT Is Eating the World, "United States files Statement of Interest in OpenAI lawsuits: AI training is fair use; 'dilution' is 'deeply flawed' theory…" — https://chatgptiseatingtheworld.com/2026/09/02/united-states-files-statement-of-interest-in-openai-lawsuits-ai-training-is-fair-use-dilution-is-deeply-flawed-theory-in-the-view-of-the-united-states/ — 2026-09-02 (related: News Plaintiffs ask for "little weight," https://chatgptiseatingtheworld.com/2026/09/28/new-york-times-news-plaintiffs-ask-judge-stein-to-give-little-weight-to-view-of-united-states-on-fair-use-and-rejection-of-dilution-theory/ — 2026-09-28)
17. ChatGPT Is Eating the World, homepage (148 US suits per map updated 2026-10-08) — https://chatgptiseatingtheworld.com/ — accessed 2026-10-15
18. ChatGPT Is Eating the World, "Reflections on Judge McMahon's denial of partial motion to dismiss Advance Local Media's Complaint v. Cohere" — https://chatgptiseatingtheworld.com/2025/11/18/reflections-on-judge-mcmahons-denial-of-partial-motion-to-dismiss-advance-local-medias-complaint-v-cohere/ — 2025-11-18
19. ChatGPT Is Eating the World, "Cohere loses its partial motion to dismiss Advance Local Media's direct copyright infringement claim" — https://chatgptiseatingtheworld.com/2025/11/14/cohere-loses-its-partial-motion-to-dismiss-advance-local-medias-direct-copyright-infringement-claim/ — 2025-11-14 (from site search results)
20. ChatGPT Is Eating the World, "9th Circuit reverses injunction and holds Perplexity agentic Assistant did not likely violate CFAA" — https://chatgptiseatingtheworld.com/2026/08/04/9th-circuit-reverses-injunction-and-holds/ — 2026-08-04
21. ChatGPT Is Eating the World, "Google hit with 2d AI copyright suit in 2 days. Publishers sue Google … Gemini" — https://chatgptiseatingtheworld.com/2026/07/11/google-hit-with-2d-ai-copyright-suit-in-2-days-publishers-sue-google-for-the-1st-time-for-alleged-infringement-in-its-ai-model-gemini/ — 2026-07-11
22. Hachette Book Group v. Internet Archive, 2d Cir. No. 23-1260, Doc. 306-1, opinion — https://storage.courtlistener.com/recap/gov.uscourts.ca2.60988/gov.uscourts.ca2.60988.306.1.pdf — 2024-09-04
23. Wikipedia, "Hachette v. Internet Archive" — https://en.wikipedia.org/wiki/Hachette_v._Internet_Archive — last edited 2026-04-06
24. Wikipedia, "Authors Guild, Inc. v. Google, Inc." — https://en.wikipedia.org/wiki/Authors_Guild,_Inc._v._Google,_Inc. — accessed 2026-10-15 (case 2015; stale-risk low, final)
25. Wikipedia, "Authors Guild, Inc. v. HathiTrust" — https://en.wikipedia.org/wiki/Authors_Guild,_Inc._v._HathiTrust — accessed 2026-10-15 (case 2014; final)
26. Wikipedia, "Artificial intelligence and copyright" — https://en.wikipedia.org/wiki/Artificial_intelligence_and_copyright — accessed 2026-10-15
27. Wikipedia, "Anthropic" (redirect target of "Bartz v. Anthropic") — https://en.wikipedia.org/wiki/Bartz_v._Anthropic — accessed 2026-10-15
28. U.S. Copyright Office, "Copyright and Artificial Intelligence" — https://www.copyright.gov/ai/ — accessed 2026-10-15
29. U.S. Copyright Office, "Copyright and Artificial Intelligence, Part 3: Generative AI Training" (pre-publication) — https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-3-Generative-AI-Training-Report-Pre-Publication-Version.pdf — 2025-05-09
30. UK Copyright, Designs and Patents Act 1988, s.29A — https://www.legislation.gov.uk/ukpga/1988/48/section/29A — in force 2014-06-01
31. UK Government, "Copyright and artificial intelligence" consultation — https://www.gov.uk/government/consultations/copyright-and-artificial-intelligence — 2024-12-17 to 2025-02-25
32. UK Government, "Report and impact assessment on copyright and artificial intelligence" — https://www.gov.uk/government/publications/report-and-impact-assessment-on-copyright-and-artificial-intelligence — 2026-03-18
33. UK Government, "Report on Copyright and Artificial Intelligence" (HTML) — https://www.gov.uk/government/publications/report-and-impact-assessment-on-copyright-and-artificial-intelligence/report-on-copyright-and-artificial-intelligence — 2026-03-18
34. Directive (EU) 2019/790, Article 3 (legislation.gov.uk) — https://www.legislation.gov.uk/eudr/2019/790/article/3 — 2019
35. Directive (EU) 2019/790, Article 4 — https://www.legislation.gov.uk/eudr/2019/790/article/4 — 2019
36. Directive (EU) 2019/790, Article 7 — https://www.legislation.gov.uk/eudr/2019/790/article/7 — 2019
37. Wikipedia, "Directive on Copyright in the Digital Single Market" — https://en.wikipedia.org/wiki/Directive_on_Copyright_in_the_Digital_Single_Market — accessed 2026-10-15
38. Kluwer Copyright Blog (Wolters Kluwer), "Kneschke vs. LAION – Landmark Ruling on TDM exceptions for AI training data – Part 1" — https://legalblogs.wolterskluwer.com/copyright-blog/kneschke-vs-laion-landmark-ruling-on-tdm-exceptions-for-ai-training-data-part-1/ — 2024-11-13 (possibly stale on appeal)
39. Copyright Research and Information Center (CRIC), Japan Copyright Act English translation (Arts. 30-4, 47-5) — https://www.cric.or.jp/english/clj/cl2.html — accessed 2026-10-15
40. Agency for Cultural Affairs / Japan Copyright Office, "General Understanding on AI and Copyright in Japan – Overview" — https://www.bunka.go.jp/english/policy/copyright/pdf/94055801_01.pdf — 2024-05
41. EU AI Act Article 53 (artificialintelligenceact.eu) — https://artificialintelligenceact.eu/article/53/ — applies 2025-08-02
42. heise online, "GEMA vs. OpenAI: Niederlage für ChatGPT vor Münchner Gericht" — https://www.heise.de/news/GEMA-vs-OpenAI-Niederlage-fuer-ChatGPT-vor-Muenchner-Gericht-11073532.html — 2025-11-11
43. Courts and Tribunals Judiciary, "Getty Images v Stability AI" judgment page — https://www.judiciary.uk/judgments/getty-images-v-stability-ai/ — 2025-11-04
44. Getty Images v Stability AI [2025] EWHC 2863 (Ch), approved judgment PDF — https://www.judiciary.uk/wp-content/uploads/2025/11/Getty-Images-v-Stability-AI.pdf — 2025-11-04
45. OpenAlex Help, "Rate limits and authentication" — https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication — updated 2026-10-14
46. OpenAlex Help, "Pricing" — https://help.openalex.org/access/pricing — updated 2026-08-11
47. OpenAlex Help, "Example costs" — https://help.openalex.org/access/example-costs — accessed 2026-10-15
48. Open Library, "Data Dumps" — https://openlibrary.org/developers/dumps — accessed 2026-10-15
49. Open Library, "APIs" (usage guidelines, rate limits) — https://openlibrary.org/developers/api — accessed 2026-10-15
50. Open Library, "Licensing" — https://openlibrary.org/developers/licensing — accessed 2026-10-15
51. Crossref, "REST API" documentation — https://www.crossref.org/documentation/retrieve-metadata/rest-api/ — accessed 2026-10-15
52. Crossref, "Metadata Plus" — https://www.crossref.org/services/metadata-retrieval/metadata-plus/ — accessed 2026-10-15
53. Initiative for Open Abstracts (I4OA) — https://i4oa.org/ — accessed 2026-10-15 (launch stats 2020; possibly stale)
54. Semantic Scholar, "API License Agreement" — https://www.semanticscholar.org/product/api/license — accessed 2026-10-15
55. Semantic Scholar, "Semantic Scholar API" product page — https://www.semanticscholar.org/product/api — accessed 2026-10-15
56. Google Books APIs, "Terms of Service" — https://developers.google.com/books/terms — last updated 2012-04-25 (stale but still posted)
57. Google APIs Terms of Service — https://developers.google.com/terms — last modified 2021-11-09
58. HathiTrust Research Center Analytics homepage (service discontinuation notice) — https://analytics.hathitrust.org/ — accessed 2026-10-15
59. HTRC Analytics, "Derived Datasets" (Extracted Features 2.0, etc.) — https://analytics.hathitrust.org/deriveddatasets — accessed 2026-10-15
60. Wikidata, "Licensing" — https://www.wikidata.org/wiki/Wikidata:Licensing — accessed 2026-10-15
61. Library of Congress, "MARC Open-Access (MDSConnect)" — https://www.loc.gov/cds/products/marcDist.php — accessed 2026-10-15
62. Open Syllabus homepage — https://www.opensyllabus.org/ — accessed 2026-10-15
63. Open Syllabus, "Terms and Policies" — https://blog.opensyllabus.org/terms-and-policies — accessed 2026-10-15
64. Open Syllabus, "Accounts and Subscriptions" — https://blog.opensyllabus.org/about-accounts — accessed 2026-10-15
65. YouTube API Services, "Developer Policies" — https://developers.google.com/youtube/terms/developer-policies — updated 2026-09-14
66. YouTube Data API, "Captions: download" — https://developers.google.com/youtube/v3/docs/captions/download — accessed 2026-10-15
67. YouTube Terms of Service — https://www.youtube.com/t/terms — effective 2023-12-15
68. Creative Commons, "Frequently Asked Questions" — https://creativecommons.org/faq/ — accessed 2026-10-15
69. Creative Commons, "Using CC-Licensed Works for AI Training" — https://creativecommons.org/using-cc-licensed-works-for-ai-training/ — 2025-05-28
70. U.S. Copyright Office, "DMCA Designated Agent Directory" — https://www.copyright.gov/dmca-directory/ — accessed 2026-10-15
71. U.S. Copyright Office, DMCA Designated Agent Directory FAQ — https://www.copyright.gov/dmca-directory/faq.html — accessed 2026-10-15
72. 17 U.S.C. §101 (definitions) via Cornell LII — https://www.law.cornell.edu/uscode/text/17/101 — accessed 2026-10-15
73. 17 U.S.C. §512 via Cornell LII — https://www.law.cornell.edu/uscode/text/17/512 — accessed 2026-10-15
74. 37 C.F.R. §202.1 via Cornell LII — https://www.law.cornell.edu/cfr/text/37/202.1 — accessed 2026-10-15
75. 37 C.F.R. §201.40 (1201 exemptions) via Cornell LII — https://www.law.cornell.edu/cfr/text/37/201.40 — accessed 2026-10-15
76. U.S. Copyright Office, "Section 1201 Rulemaking: Ninth Triennial Proceeding (2024)" — https://www.copyright.gov/1201/2024/ — final rule 2024-10-28
77. Elsevier, "Text and data mining" policy — https://www.elsevier.com/about/policies-and-standards/text-and-data-mining — accessed 2026-10-15 (undated page)
78. Elsevier, "Website Terms and Conditions" — https://www.elsevier.com/legal/elsevier-website-terms-and-conditions — last updated 2026-03-12
79. JSTOR, "Terms and Conditions of Use" — https://about.jstor.org/terms — last updated 2026-04-24
80. Wikipedia, "Aaron Swartz" — https://en.wikipedia.org/wiki/Aaron_Swartz — accessed 2026-10-15 (events 2010–2013)
81. Wikipedia, "Anna's Archive" (cites TorrentFreak, Ars Technica, Billboard, Publishers Weekly) — https://en.wikipedia.org/wiki/Anna%27s_Archive — accessed 2026-10-15
82. Wikipedia, "Database right" — https://en.wikipedia.org/wiki/Database_right — accessed 2026-10-15
83. Wikipedia, "Server test" — https://en.wikipedia.org/wiki/Server_test — accessed 2026-10-15
84. CJEU Press Release No 92/16, GS Media (C-160/15) — https://curia.europa.eu/jcms/upload/docs/application/pdf/2016-09/cp160092en.pdf — 2016-09-08 (older than 2 years; still good law [P])
85. Wikipedia, "hiQ Labs v. LinkedIn" — https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn — accessed 2026-10-15 (events 2019–2022)
86. Wikipedia, "Van Buren v. United States" — https://en.wikipedia.org/wiki/Van_Buren_v._United_States — accessed 2026-10-15 (2021)
87. Wikipedia, "Feist Publications, Inc., v. Rural Telephone Service Co." — https://en.wikipedia.org/wiki/Feist_Publications,_Inc.,_v._Rural_Telephone_Service_Co. — accessed 2026-10-15 (1991)
88. Wikipedia, "Hyperlink" (legal issues section) — https://en.wikipedia.org/wiki/Hyperlink — accessed 2026-10-15
89. OpenAlex Help, "Work object" (abstract_inverted_index, has_content, content_urls) — https://help.openalex.org/api-entities/works/work-object — accessed 2026-10-15

---

## Verification pass (independent)

- **Date:** 2026-10-15. An independent fact-checker re-opened every cited primary source for the 20 load-bearing claims. Court PDFs were downloaded and grepped locally (Bartz Dkt. 231 and 680, the long-form notice, the ROSS 3d Cir. opinion, Stein Dkt. 716, Kadrey Dkt. 598, the Hachette 2d Cir. opinion, USCO Part 3, and the Japan ACA overview). Terms and pricing pages were fetched live.
- **Limitation:** the shared WebSearch budget was exhausted, so no open-web searches ran. To look for newer developments I fetched the litigation tracker's homepage and case pages directly (*ChatGPT Is Eating the World*, posts through 2026-10-13), the settlement website, and copyright.gov/ai. A development reported only elsewhere could have been missed.
- **Result:** all 20 claims were confirmed. Four other statements in the body were corrected inline, marked "[corrected in verification]":
  - The executive-summary heading on Kadrey: Meta trained on shadow-library copies, not lawfully acquired ones.
  - The ROSS cert citation: the quote comes from [11], not [12].
  - The MDL summary-judgment status: motions were filed 2026-09-04, not fully briefed.
  - The *Emmerich* holding on URLs as copyright management information.

| # | Claim | Verdict | Correction / note | Source |
|---|---|---|---|---|
| 1 | Bartz fair-use order: training "exceedingly transformative"; purchased-print digitization fair use; >7M pirated copies not excused | confirmed | Order p.1: "over seven million copies" (≥5M LibGen, ≥2M PiLiMi, plus Books3); dated June 23, 2025 | [1] Dkt. 231 |
| 2 | Bartz settlement: $1.5B non-reversionary fund; 482,460 works; ~$3,000/work; final approval 2026-07-20 (Martínez-Olguín); 91.3% (440,490) claimed as of 2026-04-16; 350 opt-outs / 1,802 works; 54 objections; fees $101,561,111 (~6.8%; 12.5% requested) | confirmed | All figures appear verbatim in Dkt. 680. The 12.5% request was itself reduced from an original 20%. Expenses of $2,635,197.46 plus an $18.22M reserve; service awards of $15,000 each | [2] Dkt. 680 |
| 3 | Release covers past claims only and no AI outputs; not a license to train; LibGen/PiLiMi copies destroyed; 50/50 default split, education works excluded; first payments on or before 2026-11-15 | confirmed | The notice says the 50-50 default covers "trade books and university press books". The settlement site still reads "on or before November 15, 2026" | [3] notice; [4] site |
| 4 | ROSS (3d Cir. No. 25-2153, filed 2026-09-29): 2,243 headnotes original; "minimally transformative, at best"; AI-training licensing market counts; fn. 7 distinguishes generative LLMs and DOJ | confirmed | Opinion header "Argued: June 11, 2026; Filed: Sept. 29, 2026". Factor 4: the market "is rapidly developing" | [10] |
| 5 | Stein Dkt. 716 (2025-10-27): output claim survives; "attempts at abridgment or condensation"; contrast with NYT news-fact summaries (fn. 3); no fair-use ruling | confirmed | The opinion says "This opinion makes no conclusions regarding fair use." The tracker shows no fair-use ruling as of 2026-10-15 | [13]; [15] |
| 6 | Kadrey (2025-06-25): SJ for Meta limited to 13 authors who "made the wrong arguments"; unlicensed training "in most cases" likely illegal; distribution SJ hearing 2027-02-25 | confirmed | The order is verbatim. The 2027-02-25 date comes from the tracker's quotation of the docket ("Dispositive Motion Hearing set for 2/25/2027"), so it is secondary. No later rescheduling was found on the tracker, but no open-web search was possible | [7]; [8] |
| 7 | Hachette (2d Cir. 2024-09-04): CDL not transformative or fair use despite non-commercial use; refused to narrow to IA-owned books | confirmed | Footnote 12: "we decline IA's invitation to narrow the scope of our holding" | [22] |
| 8 | USCO Part 3 (pre-pub 2025-05-09): RAG summaries/abridgments "less likely to be transformative"; knowing use of pirated data weighs against fair use; no final version | confirmed | copyright.gov/ai lists only the pre-publication version: "A final version of Part 3 will be published in the future" | [29]; [28] |
| 9 | US Statement of Interest in OpenAI MDL (2026-09-01): training fair use, dilution "deeply flawed"; SJ motions filed 2026-09-04; no hearing date | confirmed | The tracker's SJ page lists all motions as of 09/04/2026, with the hearing "TBD". ROSS fn. 7 independently confirms the 2026-09-01 filing date and docket number | [16]; [15]; [10] fn. 7 |
| 10 | Elsevier terms (2026-03-12) bar AI-tool use, systematic retrieval and robots unless licensed | confirmed | Exact text: "in combination with an artificial intelligence tool, (including to train an algorithm, test, process, analyse, generate output and/or develop any form of artificial intelligence tool)". "Last revised: 12 March 2026" | [78] |
| 11 | JSTOR terms (2026-04-24) bar systematic or automated downloading, scraping and LLM training; may suspend users or IPs | confirmed | "Last updated on April 24, 2026"; §4 and §6.2 | [79] |
| 12 | OpenAlex: CC0; $1/day with key and $0.10/day without; list $0.10, search $1, content $10 per 1,000 calls, single entity free; plans $5k / $10k / from $20k; 10/30/50 req/s | confirmed | Example-costs page "Last updated October 9, 2026"; pricing page 2026-08-11; rate-limit page 2026-10-14 | [47]; [46]; [45] |
| 13 | OpenAlex does not ship plaintext abstracts "for legal reasons"; >50M works with PDFs, API-only, not in the snapshot | confirmed | Verbatim on the work-object page | [89] |
| 14 | HTRC services discontinued 2026-09-30; EF 2.0 (CC BY 4.0; 17,123,746 volumes; 10,550,952 in-copyright; 6.22B pages) still listed for rsync | confirmed | The Derived Datasets page is still live and "available without an HTRC Analytics account". How long it stays hosted is unknown | [58]; [59] |
| 15 | UK report 2026-03-18 (125 pp., DUA Act ss.135–136): opt-out exception "no longer the government's preferred way forward"; s.29A remains | confirmed | The PDF is 125 pages. The report is made under s.136 and the impact assessment under s.135. s.29A(5): contract terms "unenforceable" | [32]; [33]; [30] |
| 16 | EU DSM Art. 4 opt-out "in an appropriate manner, such as machine-readable means"; Art. 3 protected by Art. 7(1); AI Act Art. 53(1)(c) from 2025-08-02 | confirmed | Art. 7(1) covers Arts. 3, 5 and 6, not Art. 4 | [35]; [36]; [41] |
| 17 | Japan ACA guidance (May 2024): output-oriented RAG outside Art. 30-4 but possible under Art. 47-5; avoiding robots.txt to copy databases falls within the 30-4 proviso | confirmed | The robots.txt point is specific to reproducing "copyrighted database works". The overview says it "is not legally binding" | [40] |
| 18 | Google APIs ToS §5(e): no "scrape, build databases, or otherwise create permanent copies"; Books API: no fee without permission (2012-04-25) | confirmed | Google APIs ToS last modified 2021-11-09. Books terms "Last modified: April 25, 2012" | [57]; [56] |
| 19 | YouTube policies (2026-09-14): no downloading or caching of audiovisual content, no scraping, delete or refresh after 30 days; captions.download needs edit permission, 200 units | confirmed | Policies "Last updated 2026-09-14". The captions page was updated 2026-09-15 and its text is unchanged | [65]; [66] |
| 20 | DMCA agent: online, $6, expires after 3 years, lapse risks safe harbor; §512(i) repeat-infringer policy | confirmed | FAQ: "$6 per designation, amendment, or resubmission"; "expire and become invalid three years after" | [71]; [73] |
| A | Exec summary: "Training on lawfully acquired books has won twice in district court" | corrected | Kadrey's training win involved pirated copies: the order says "There is no dispute that Meta torrented LibGen and Anna's Archive" | [7] |
| B | ROSS row: counsel will seek Supreme Court review [S][12] | corrected (citation) | The quote is in Courthouse News [11] (2026-09-30). The tracker case page [12] does not mention it | [11] |
| C | OpenAI MDL row: SJ "briefed 2026-09-04" | corrected | Opening SJ motions were filed 2026-09-04; briefing is ongoing and the hearing is TBD | [15] |
| D | *Emmerich*: "holds that URLs can be CMI" | corrected (nuance) | URLs are not categorically excluded; the question is fact-specific and was remanded | [83] |
| E | Anna's Archive: $322M (Spotify, 2026-04-15), $19.5M (13 publishers, 2026-05-19), OCLC deletion order (Jan. 2026) | confirmed | Wikipedia's reference list misdates the Spotify judgment as 2025, but the body says 2026-04-15 | [81] |
| F | 9th Cir. *Amazon v. Perplexity* (2026-08-04) and the truncated tracker URL [20] | confirmed | The URL resolves. Title: "9th Circuit reverses injunction and holds Perplexity agentic Assistant did not likely violate CFAA" | [20] |
| G | 148 US AI copyright suits (map updated 2026-10-08) | confirmed | Tracker homepage | [17] |
| H | Bartz preliminary-approval memorandum 2025-10-17 | confirmed | Listed on the settlement documents page | [5] |
| I | I4OA: launched 2020-09-24; 6.6% at launch (25.5% of 2020 articles); ~7% now | confirmed | Verbatim on i4oa.org | [53] |
| J | Semantic Scholar: 214M papers, 2.49B citations, 79M authors; 1,000 req/s shared pool; key 1 RPS | confirmed | API product page | [55] |
| K | Open Library dump sizes (9.2 / 2.9 / 12.4 / 29.6 GB); no license statement | confirmed | Dumps page | [48] |
| L | *Cohere*: 50 verbatim plus 25 verbatim/paraphrase outputs; "substitutive summaries" theory survives | confirmed | The tracker post (2025-11-14) does not state the ruling day; 2025-11-13 is plausible but unconfirmed | [19] |
| M | GEMA v. OpenAI (LG München I, 2025-11-11): memorized lyrics are reproductions; not final | confirmed | heise: "Das Urteil ist noch nicht rechtskräftig" | [42] |
