---
title: The Public Domain and Open Corpora
description: What is in the US public domain as of October 2026 (everything published before 1931, plus unrenewed US books to 1963), how Gutenberg, Standard Ebooks, Wikisource, HathiTrust, the Internet Archive and LibriVox differ for a technical reader, why Internet Archive rights flags cannot be trusted, which licence-clean corpora (Common Pile, Common Corpus, Institutional Books) are usable building material, and what pre-1931 books are good for.
---

*Status: draft, October 2026. Counts and statuses are as of 2026-10-15 unless another date is given. Gutenberg counts come from its catalogue CSV; HathiTrust rights codes and timestamps from the 2026-10-01 Hathifile and the Bib API; other item-level checks are this chapter's own queries of public APIs and pages, re-run in a fact-check pass the same day. Collection totals for HathiTrust, the Internet Archive and Open Library come from the R05 and R10 dossiers. US dates for works published after 1930 are computed upper bounds, not checked against renewal records. HathiTrust's policy pages and the Stanford Copyright Renewal Database blocked automated access. Not legal advice. Sources: the [R01 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R01-open-books.md), the [R09 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md) and primary sources linked inline.*

This chapter covers books that are free because their copyright has expired, and the large datasets built from them and from openly licensed books. Modern open-access books and author-hosted textbooks are in [Open-Access Books and Textbooks](/access/open-books/). Library lending, including the Internet Archive's controlled digital lending, is in [Public Libraries](/access/public-libraries/). The legal rules for building tools on any of this are in [The Legal Map](/building/legal-map/).

## The short version

- **In the US, everything published before 1931 is public domain as of 2026.** Works published in 1930 entered the public domain on 2026-01-01; works from 1931 follow on 2027-01-01 ([Duke Center for the Study of the Public Domain](https://cspd.law.duke.edu/publicdomainday/2026/)). In probability the line falls just before the modern foundations: Ramsey, de Finetti and Gödel (all 1931) are public domain in the US by 2027-01-01 at the latest, Kolmogorov (1933) by 2029-01-01.
- **For US books, 1930 is a floor, not the frontier.** A US book published 1931–1963 stayed in copyright only if it was renewed in its 28th year. A Copyright Office study prepared for the Senate in 1960 found that only about 7% of books were being renewed ([Ringer, Study No. 31](https://www.copyright.gov/history/studies/study31.pdf), Appendix C). Non-renewal does not free foreign works: a 1996 provision restored their copyrights.
- **Project Gutenberg is clean but literary.** It has 78,325 texts. By first-listed Library of Congress class, 57% are language and literature and 3.5% science; 187 texts carry a mathematics (QA) class and 6 the subject heading "Probabilities" (catalogue CSV, 2026-10-15). Basic statistics classics are missing, including Fisher's *Statistical Methods for Research Workers*, whose 1925 first edition has been public domain since 2021.
- **HathiTrust is the deepest public-domain shelf for scholarship, and the first to open each new year.** It has 8.29M full-view volumes out of 19.7M (Hathifile, 2026-10-01). Of eleven pre-1931 probability, statistics and economics classics checked here, HathiTrust had full view for all eleven and Gutenberg for five. Its rights timestamps show 1930 volumes opening on 2026-01-01 itself.
- **Do not use Internet Archive metadata to decide copyright status.** IA asked a dataset builder to remove 653,983 book texts because it considers its metadata "too unreliable to determine whether a book is in the public domain" ([US-PD-Books card](https://huggingface.co/datasets/storytracer/US-PD-Books)). This chapter's spot checks found in-copyright editions served as open downloads, and pre-1930 items restricted to lending.
- **Licence-clean corpora are usable building material.** Common Pile v0.1 (8 TB) and Common Corpus (2.27T tokens) are ungated and carry per-document licence fields. Harvard's Institutional Books (983,004 volumes that HathiTrust marks public domain) is gated and non-commercial, and bars redistribution, although the texts themselves are public domain.
- **Old books are for** the history of ideas, original statements of concepts now taught in caricature, and a legally clean sandbox for reading tools. **They are not for** current methods: nothing published before 1931 has Kolmogorov's axioms, Neyman–Pearson testing or modern computing.

## What is public domain in the US

### The rules that matter for books

US public-domain status for published works depends mainly on the publication date, not on the author's death. The table condenses [Cornell's public-domain chart](https://guides.library.cornell.edu/copyright/publicdomain), the [Duke Public Domain Day 2026 page](https://cspd.law.duke.edu/publicdomainday/2026/) and [Project Gutenberg's copyright rules](https://www.gutenberg.org/help/copyright.html).

| Published | US status as of October 2026 | How to check | Notes |
|---|---|---|---|
| Before 1931 | Public domain | Publication date of *that edition* | A 1930 translation is public domain; a 1961 retranslation is not |
| 1931–1963, US work | Public domain if published without a copyright notice or not renewed in its 28th year; if renewed, 95 years from publication | [Stanford Copyright Renewal Database](https://exhibits.stanford.edu/copyrightrenewals) (book renewals received 1950–1992 [~85%; the site served a bot challenge to this check]) | About 7% of books were being renewed ([Ringer 1960](https://www.copyright.gov/history/studies/study31.pdf), Appendix C). Renewals concentrate on commercially valuable books, so famous titles renew more often [I, high] |
| 1931–1977, foreign work | 95 years from publication, regardless of notice or renewal, if still protected at home in 1996 | Publication year + 96 | Restored by a 1996 provision (Duke page). A foreign book also published in the US within 30 days counts as a US work |
| 1964–1977, US work | 95 years from publication (renewal automatic) | Publication year + 96 | A work published without a notice may be public domain |
| 1978 onward | Life of the author + 70 years; corporate works 95 years from publication or 120 from creation, whichever ends first | Author's death year | US works distributed before March 1989 without a notice may be public domain ([Gutenberg Rule 5](https://www.gutenberg.org/help/copyright.html)) |
| Any year, US federal government work | Public domain | Author is a federal agency or employee | Covers many technical reports and statistical publications |

Two consequences for a reader:

- **For a work published in 1931–1977, "publication year + 96" is an upper bound.** By that January 1 it is public domain in the US whatever its renewal or restoration history. It may be public domain already.
- **Other countries count from the author's death.** In the EU and UK the usual term is life + 70. Keynes died in 1946, so his *General Theory* (1936) is public domain in the UK [I, computed] but not in the US until 2032-01-01 ([Standard Ebooks](https://standardebooks.org/ebooks/john-maynard-keynes/the-general-theory-of-employment-interest-and-money)). The libraries below apply US rules; HathiTrust marks US-only public domain as `pdus`. A tool serving several countries needs a jurisdiction field, not one public-domain flag (see [A Reference Architecture](/building/reference-architecture/)).

### What happened on 2026-01-01

Works published in 1930 entered the US public domain, together with sound recordings from 1925 ([Duke](https://cspd.law.duke.edu/publicdomainday/2026/)). Duke's highlights include Freud's *Civilization and Its Discontents* "in the original German" and Russell's *The Conquest of Happiness*, and it notes that "the vast majority of works from that year are not commercially available."

Gutenberg added famous titles within weeks and has not added the technical ones. HathiTrust opened its scans on Public Domain Day itself:

| 1930 work | Gutenberg | HathiTrust | Internet Archive |
|---|---|---|---|
| Hammett, *The Maltese Falcon* | [#77600](https://www.gutenberg.org/ebooks/77600), added 2026-01-01 | Not checked | Not checked |
| Russell, *The Conquest of Happiness* | [#77894](https://www.gutenberg.org/ebooks/77894), added 2026-02-09 | Not checked | Not checked |
| Freud, *Civilization and Its Discontents* (Joan Riviere's 1930 English translation) | [#78221](https://www.gutenberg.org/ebooks/78221), added 2026-03-16 | Not checked | Not checked |
| Fisher, *The Genetical Theory of Natural Selection* | Not present | First edition in full view as "public domain in the US" (`pdus`), rights set 2026-01-01 ([Bib API](https://catalog.hathitrust.org/api/volumes/brief/oclc/18500548.json); Hathifile) | Open downloads since 2006–2007 (see [below](#the-internet-archive-and-open-library)) |
| Keynes, *A Treatise on Money* (2 vols.) | Not present | Five items of the 1930 Harcourt, Brace printing, covering both volumes, in full view as `pd`, rights set 2026-01-01 to 2026-01-08 ([Bib API](https://catalog.hathitrust.org/api/volumes/brief/oclc/721781.json); Hathifile) | Only a [1958 printing](https://archive.org/details/treatiseonmoney0001keyn), lending-only |

"Rights set" is the `rights_timestamp` field of the [2026-10-01 Hathifile](https://www.hathitrust.org/files/hathifiles/hathi_full_20261001.txt.gz). Earlier years follow the same pattern: the three full-view copies of the 1928 edition of Fisher's *Statistical Methods for Research Workers* were set on 2024-01-01. Gutenberg added 2,580 texts in 2025 and 2,170 in 2026 to 2026-10-15; its pace is set by volunteer proofreading, not by the legal calendar.

### The January calendar

Each January 1 a new publication year opens. That matters most in fields that took their modern form in the 1930s–1950s: probability, statistics, decision theory, computing. The US dates below are computed upper bounds. The life + 70 column is computed from death years [I]. It ignores the EU's "rule of the shorter term" for non-EU works and the separate terms of translations.

| Work | Published | US public domain no later than | Life + 70 (EU/UK) |
|---|---|---|---|
| Ramsey, "Truth and Probability" in *The Foundations of Mathematics* | 1931 | 2027-01-01 | Already (d. 1930) |
| Gödel, "Über formal unentscheidbare Sätze…" | 1931 | 2027-01-01 | 2049 |
| de Finetti, "Sul significato soggettivo della probabilità" | 1931 | 2027-01-01 | 2056 |
| Jeffreys, *Scientific Inference* | 1931 | 2027-01-01 | 2060 |
| Kolmogorov, *Grundbegriffe der Wahrscheinlichkeitsrechnung* | 1933 | 2029-01-01 | 2058 |
| Neyman & Pearson, "On the Problem of the Most Efficient Tests of Statistical Hypotheses" | 1933 | 2029-01-01 | 2052 |
| Fisher, *The Design of Experiments* | 1935 | 2031-01-01 | 2033 |
| Keynes, *The General Theory of Employment, Interest and Money* | 1936 | 2032-01-01 | Already (d. 1946) |
| Jeffreys, *Theory of Probability* | 1939 | 2035-01-01 | 2060 |
| von Neumann & Morgenstern, *Theory of Games and Economic Behavior* | 1944 | 2040-01-01, earlier if not renewed | 2048 |
| Shannon, "A Mathematical Theory of Communication" | 1948 | 2044-01-01, earlier if not renewed | 2072 |
| Savage, *The Foundations of Statistics* | 1954 | 2050-01-01, earlier if not renewed | 2042 |

The 2026-10-01 Hathifile lists six items of Ramsey's *Foundations of Mathematics* and five of Jeffreys's *Scientific Inference*, across editions, all search-only; Open Library had no open scan of either. Each has a 1931 printing in HathiTrust. Jeffreys's is coded `ic` (in copyright) and should open on 2027-01-01 if HathiTrust repeats its January pattern [~85%]. Ramsey's is coded `und` (undetermined) and may need a review first [I]. Across the file, 48,766 items with a 1931 rights date are `ic`, 4,972 are `und`, and 23,006 are already full view. To be told when a book opens, watch the daily Hathifile updates for its HathiTrust IDs or OCLC numbers; the [R10 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R10-catalog-architecture-and-costs.md) sketches this as a "rights-change alert".

**If you want a 1931–1963 US book now,** search its title in the Stanford Copyright Renewal Database. If no renewal is listed for the right year window, it is probably already public domain [~80%; the database covers book renewals only, and misses variant titles]. HathiTrust's full-view flag on the same edition is a second, independent signal.

## The libraries

**Routine for a book you believe is public domain in the US:**

1. **Standard Ebooks**, if it has the book: the best reading copy.
2. **Project Gutenberg** for clean text.
3. **HathiTrust full view**, matched by OCLC number, for anything technical, for page images, and as the rights check.
4. **Wikisource** when you need clean text linked to the printed page.
5. **The Internet Archive** for other editions and scans, after the rights check in step 3.

| Library | What you get | Size (2026-10-15 unless noted) | Strength for a technical reader | Catch | Link |
|---|---|---|---|---|---|
| **Project Gutenberg** | Proofread plain text, HTML and EPUB | 79,598 ebooks; catalogue lists 78,325 texts (61,817 in English) | Philosophy, political economy, history; a few probability classics | 57% literature, 3.5% science; math rendered approximately; blocked in Italy since 2020 [secondary, R01] | [gutenberg.org](https://www.gutenberg.org/) |
| **Standard Ebooks** | Typeset, proofread EPUBs, CC0 | About 1,530 listed titles (R01 count; the listing includes placeholder pages for some not-yet-free books, such as Keynes's *General Theory*) | Best reading copies of famous non-fiction (Hume, Smith, Mill, Russell, Veblen) | No mathematics or probability; bulk OPDS feed requires a paid Patrons Circle membership (returned 401, R01) | [standardebooks.org](https://standardebooks.org/ebooks) |
| **Wikisource (English)** | Transcriptions proofread against page scans | 1,134,425 content pages ([API](https://en.wikisource.org/w/api.php?action=query&meta=siteinfo&siprop=statistics&format=json)) | Periodicals and essays, linked to scans | Uneven coverage of books; the API rate-limits bulk clients, so use the dumps | [en.wikisource.org](https://en.wikisource.org/) |
| **HathiTrust** | Page scans with OCR; full-text search over all volumes | 19,701,406 items; 8,293,334 full view (42.1%): 5.87M `pd`, 2.30M `pdus` (Hathifile 2026-10-01, R05/R10) | Deepest shelf of pre-1931 scholarship, government documents and journals; reliable rights codes, updated on January 1 | Scans, not reflowable text; `pdus` volumes are not full view outside the US [I, high; R10]; the reading site serves a bot challenge to scripts (R05) | [hathitrust.org](https://www.hathitrust.org/) |
| **Internet Archive / Open Library** | Scans with OCR, EPUB and PDF; lending for in-copyright books | 52.7M text items, 4.42M in lending (R10); Open Library: 1.86M works with a public scan, 2.91M borrowable (R10) | Largest raw supply; many later editions and reprints | Rights metadata unreliable (next section); controlled lending curtailed after *Hachette* | [archive.org](https://archive.org/details/texts) |
| **LibriVox** | Volunteer-read audiobooks, dedicated to the public domain | 21,838 cataloged works; 2,727 non-English; 49 languages; 14,943 readers (homepage) | Philosophy and political economy by ear | Follows US law only; listeners elsewhere must check local status; mathematical texts read poorly | [librivox.org](https://librivox.org/) |

### Project Gutenberg

Gutenberg is the cleanest source of public-domain text. Volunteers transcribe and proofread the books, and the whole catalogue is one 21 MB CSV ([pg_catalog.csv](https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv)).

Its subject mix is the main limitation for this reader. Counts from the catalogue CSV, 2026-10-15, by each text's first-listed class unless noted:

| Library of Congress class | Texts | Share |
|---|---|---|
| P: language and literature | 44,388 | 56.7% |
| D: world history | 8,136 | 10.4% |
| B: philosophy, psychology, religion | 4,802 | 6.1% |
| Q: science | 2,750 | 3.5% |
| H: social sciences | 1,977 | 2.5% |
| T: technology | 1,622 | 2.1% |
| Any QA (mathematics) class | 187 | 0.24% |
| Any HB (economic theory) class | 101 | 0.13% |

Six texts carry the subject heading "Probabilities": Boole's *Laws of Thought*, Proctor's *Chance and Luck*, Keynes's *A Treatise on Probability*, Venn's *The Logic of Chance*, Laplace's *Philosophical Essay on Probabilities* (the 1902 Truscott and Emory translation), and Timerding's *Die Analyse des Zufalls*. Gutenberg has the core of the history-of-probability shelf and very little around it.

**For anything technical, check HathiTrust before concluding a pre-1931 book is not online.**

### Standard Ebooks

Standard Ebooks re-typesets public-domain books to a high standard and dedicates its own work to the public domain under CC0. It describes its texts as "thought to be in the public domain in the United States" ([policy page](https://standardebooks.org/about/standard-ebooks-and-the-public-domain)). Its [philosophy subject](https://standardebooks.org/subjects/philosophy) lists 87 titles, including Hume's *Enquiry* and *Treatise*, Smith's *Wealth of Nations*, Mill's *On Liberty*, Moore's *Principia Ethica*, Russell's *The Problems of Philosophy*, and Dewey and James. Searches for Laplace, Venn, Jevons, Poincaré and "probability" returned nothing (2026-10-15).

**Read the Standard Ebooks edition when there is one, especially on e-ink** (see [Reading Modes and Devices](/environments/reading-modes-and-devices/)). The catalogue also lists placeholder pages for books not yet free; the Keynes *General Theory* page says it "will therefore enter the U.S. public domain in 6 years on January 1, 2032."

### Wikisource

English Wikisource holds transcriptions proofread page by page against scans, so passages link back to the printed page. It is strongest for periodicals and short works. For example, Peirce's January 1901 review of Pearson's *Grammar of Science* in *Popular Science Monthly* is [transcribed there](https://en.wikisource.org/wiki/Popular_Science_Monthly/Volume_58/January_1901/Pearson%27s_Grammar_of_Science). Wikisource text is part of Common Corpus (below). Use it when you need a citable page image beside clean text.

### HathiTrust full view

HathiTrust is the shared digital library of research libraries, built largely from Google Books scans. Each volume carries a rights code from HathiTrust's own determination process. `pd` means public domain worldwide; `pdus` means public domain in the US only; `ic` is in copyright and `und` undetermined. Its full-text search covers all 19.7M items, including in-copyright ones: for those it returns page numbers and hit counts, not text (R05, secondary; see [Searching Inside Books You Don't Have](/finding/searching-inside-books/)).

For eleven classics, the chapter looked up each title's OCLC numbers in Open Library, queried the Bib API with them, and searched the Gutenberg catalogue (2026-10-15). HathiTrust counts are lower bounds, because only the OCLC numbers on Open Library's top-matching work records were queried; the two Fisher rows match a count over the full Hathifile.

| Work (first edition) | Gutenberg | HathiTrust full-view items | Open Library |
|---|---|---|---|
| Laplace, *A Philosophical Essay on Probabilities* (tr. 1902) | Yes | 3 (1902 translation) | Public scan |
| Venn, *The Logic of Chance* (1866; 3rd ed. 1888) | Yes | 4 | Public scan |
| Jevons, *The Principles of Science* (1874) | Yes (added 2024) | 12 | Public scan |
| Todhunter, *A History of the Mathematical Theory of Probability* (1865) | No | 8 | Public scan |
| Pearson, *The Grammar of Science* (1892) | No | 13 | Public scan |
| Keynes, *A Treatise on Probability* (1921) | Yes | 7 | Public scan |
| Knight, *Risk, Uncertainty and Profit* (1921) | No | 9 | Public scan |
| Peirce, *Chance, Love, and Logic* (1923) | Yes | 2 | Public scan |
| Fisher, *Statistical Methods for Research Workers* (1925) | No | 8 (1925, 1928 and 1930 editions; later ones search-only) | Public scan |
| Fisher, *The Genetical Theory of Natural Selection* (1930) | No | 1 | Public scan |
| Keynes, *A Treatise on Money* (1930) | No | 5 | 1958 printing, lending only |

Open Library links a public scan for ten of the eleven, but see the next section on what its "public" means.

**Practical notes.**

- **For builders,** the monthly Hathifile (1.23 GB; metadata reported as CC0 in R10, secondary) is the best rights oracle for scanned books. Its `rights_timestamp` field says when each code was set. The [Bib API](https://catalog.hathitrust.org/api/volumes/brief/oclc/721781.json) answered unauthenticated lookups by OCLC number from a cloud IP on 2026-10-15. The reading site `babel.hathitrust.org` returned HTTP 403 to scripts, so plan to link users there, not to fetch pages.
- **HathiTrust Research Center services closed on 2026-09-30.** The CC BY 4.0 Extracted Features 2.0 dataset (17,123,746 volumes, 6.57M public-domain or CC, 6.22B pages of per-page token counts) is still listed for rsync ([HTRC derived datasets](https://analytics.hathitrust.org/deriveddatasets); R09). Mirror it if you plan page-level search or topic maps over in-copyright books.
- **Whole-volume PDF download rules** were not verified (HathiTrust's policy pages returned 403); check them in a browser before building a workflow on downloads.

### The Internet Archive and Open Library

The Internet Archive (IA) holds the largest supply of scanned books. Its catalogue front end, Open Library, marks each work `public`, `borrowable`, `printdisabled` or `no_ebook`. Open Library's lending side, and the *Hachette v. Internet Archive* ruling that constrained it (Second Circuit, 2024-09-04), are covered in [Public Libraries](/access/public-libraries/).

**IA's rights metadata is not a copyright determination.** The item field is called `possible-copyright-status`, and is often empty. Four kinds of evidence point the same way.

1. **IA says so.** The 653,983-book [US-PD-Books](https://huggingface.co/datasets/storytracer/US-PD-Books) dataset selected books partly by searching for `NOT_IN_COPYRIGHT`. Its card now says IA asked for it to be deleted "because they consider the IA's metadata too unreliable to determine whether a book is in the public domain." The full texts were removed and the metadata kept.
2. **In-copyright editions are served as open downloads.** The 1930 first edition of Fisher's *Genetical Theory* has been openly downloadable on IA since 2006-11-12 ([Universal Library upload](https://archive.org/details/geneticaltheoryo031631mbp)) and 2007-11-02 ([University of Toronto upload](https://archive.org/details/geneticaltheoryo00fishuoft)). Under the rules above it was in US copyright until 2026-01-01 [~75%: a British work, restored in 1996 unless it was also published in the US within 30 days]. HathiTrust treated it that way: it set the same edition's `pdus` code on 2026-01-01 (Hathifile rights timestamp). IA also serves the [11th edition (1950)](https://archive.org/details/dli.ernet.233797) of Fisher's *Statistical Methods for Research Workers* as an open PDF and EPUB from its Digital Library of India collection, uploaded 2020-10-12. The material new in that edition stays in US copyright until 2046-01-01 [I, computed]. None of these items carries a copyright-status value.
3. **The flag is common on recent items.** IA's search API returns about 1.54M text items with `possible-copyright-status:NOT_IN_COPYRIGHT`, of which about 61,000 are dated 1931–2025 (2026-10-15). This chapter classified the 40 most-downloaded such items dated 1965–2025, excluding two federal-document collections (34,086 items): 10 US federal documents, 11 Smithsonian or university self-publications, 10 reprints of older public-domain texts, 4 unclassified, and 5 very likely still in copyright, all unrestricted downloads: Smelser's *Theory of Collective Behavior* (Free Press, 1965), Brown's *Rockefeller Medicine Men* (University of California Press, 1979), Mauss's *The Gift* in Cunnison's English translation (1966 printing), a 1966 *Playboy* interview, and a 1985 reprint of the Diels–Kranz *Fragmente der Vorsokratiker* [I; firmest for the two US books, weaker for the Cunnison translation and the Diels–Kranz reprint, which depend on restored foreign copyrights]. That is 5 of 40 (13%) in a small, download-weighted sample. Treat it as proof that the errors exist, not as an error rate.
4. **Errors also run the other way, and editions get mixed.** About 1,800 text items in IA's lending collection and about 4,100 in its print-disabled collection are dated 1929 or earlier. Open Library's work-level "public" can come from a different edition than the one you want. The two libraries also disagree on single editions. The 1951/52 Dover printing of Laplace's *Essay* is an [open download on IA](https://archive.org/details/philosophicaless00lapl) and search-only (`ic`) in HathiTrust. The 1902 translation, which both treat as public domain, is the safe copy.

Some of this may have a legitimate explanation: collections scanned under another country's rules, or post-1930 US books that were never renewed [I]. The point is narrower: a tool cannot tell which explanation applies from IA's metadata.

**Decision rule:** use IA as a scan and OCR source, not as a rights source. Decide public-domain status from the edition's publication date and place, then confirm it with HathiTrust's rights code for the same edition, matched by OCLC number, or with the Library of Congress's [Selected Digitized Books](https://www.loc.gov/collections/selected-digitized-books/), whose rights page states that "the books in this collection are in the public domain and are free to use and reuse." For a public or commercial tool, an "unknown" rights state should default to link-only (see [The Legal Map](/building/legal-map/)).

### LibriVox

LibriVox volunteers record public-domain books and dedicate the recordings to the public domain. It [follows US copyright law](https://wiki.librivox.org/index.php/Copyright_and_Public_Domain) because "all of our files are hosted with Archive.org whose servers are located in the US," and leaves listeners elsewhere to check local status. The catalogue includes Poincaré's *Science and Hypothesis* (7 h 11 min), Russell's *The Problems of Philosophy* (4 h 51 min), Hume's *Enquiry Concerning Human Understanding* (5 h 54 min) and Mill's *On Liberty* (5 h 22 min) (LibriVox API, 2026-10-15).

**Use LibriVox for argument-driven books you would otherwise not get to** (philosophy, political economy, history of science). Books whose content lives in equations and tables (Venn's later chapters, Jevons, Fisher) lose most of it in audio [I, high]. [Lectures, Talks and Other Media](/finding/lectures-and-media/) covers other audio sources.

## Licence-clean corpora as building material

Three large datasets package public-domain and openly licensed books for machine use. The legal backdrop makes provenance the deciding question. In *Bartz v. Anthropic* (N.D. Cal., 2025-06-23) the court found training on books, and scanning purchased print copies, to be fair use, but did not excuse more than seven million pirated library copies. The case then settled for \$1.5B, with final approval on 2026-07-20 ([R09](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md); [settlement site](https://www.anthropiccopyrightsettlement.com/)). A corpus that records each document's source and licence answers that question in advance.

| Corpus | Size | Book content | Terms and access | Use it for | Catch |
|---|---|---|---|---|---|
| **[Common Pile v0.1](https://arxiv.org/abs/2506.05209)** (EleutherAI and others, June 2025) | 8 TB from 30 sources | [Pre-1929 books](https://huggingface.co/datasets/common-pile/pre_1929_books): 137,127 docs, 73.8 GB of US books published before 1929, chosen with Hathifiles and taken from IA's OCR. [Library of Congress](https://huggingface.co/datasets/common-pile/library_of_congress): 135,500 docs, 47.8 GB. [Gutenberg](https://huggingface.co/datasets/common-pile/project_gutenberg): 71,810 docs. [DOAB](https://huggingface.co/datasets/common-pile/doab): 474,445 docs, 12.5 GB, English CC BY and BY-SA only. Also LibreTexts and PressBooks | Ungated. Public domain or open licence per document. Raw and filtered versions | A redistributable full-text base for search, embeddings or fine-tuning | Cards warn of "license laundering and inaccurate metadata". DOAB "documents" are not books: the subset covers roughly 24,000 books (R01 verification) |
| **[Common Corpus](https://huggingface.co/datasets/PleIAs/common_corpus)** (Pleias; last modified 2026-05-06) | 2,267,302,720,836 tokens | OpenCulture collection: 967B tokens of public-domain books, newspapers, Wikisource and Gutenberg, with OCR correction | Ungated. The card says it "contains only data that is either uncopyrighted or freely licensed". Per-document `license` and `date` fields | Multilingual historical text; can be filtered to public domain only or to a date range | Curated for training: toxic texts and "content with low educational content" were removed, so it is not a faithful archive |
| **[Institutional Books](https://huggingface.co/datasets/institutional/institutional-books-hl)** (Harvard Law School Library, Institutional Data Initiative; [paper](https://arxiv.org/abs/2506.08300) 2025-06-10) | 983,004 volumes; ~242B tokens; 386M pages; 254 languages | Harvard's Google Books scans, kept only where HathiTrust marks the volume public domain, public domain in the US, or CC0. OCR-quality scores, topic labels, likely-duplicate flags, HathiTrust rights fields | Gated. Early-access terms: non-commercial only; commercial use "(including AI model training)" requires contacting IDI first; no redistribution; derivatives may be shared only if they "cannot substitute for the original"; terms called provisional | 19th- and early-20th-century scholarship at scale for non-commercial research; its metadata as a catalog seed | Now served as `institutional-books-hl` (the original URL redirects; last modified 2026-08-19). A [metadata-only version](https://huggingface.co/datasets/institutional/institutional-books-hl-metadata) is ungated but carries the same terms |

Two things to know before building on these:

- **A dataset of public-domain texts can come with contract terms.** Institutional Books' texts are public domain. The terms bind the dataset as delivered, with its cleaning, OCR and metadata. The same volumes mostly sit in HathiTrust, but re-deriving them at scale is not trivial [I]. If a project may become commercial, start from Common Pile or Common Corpus.
- **Training filters distort the record for history-of-ideas work.** Common Corpus drops toxic and low-"educational" texts. For research on, say, the eugenics of early statistics (Galton's *Essays in Eugenics* is Gutenberg #73802), go back to the unfiltered libraries [I, high].

**Which corpus to use:**

| If you want | Use | Main obstacle |
|---|---|---|
| Full text you can redistribute or use commercially | Common Pile (pre-1929, LoC, Gutenberg subsets) or Common Corpus filtered to public domain | Spot-check licences; OCR noise in scans |
| Openly licensed modern scholarship | Common Pile DOAB subset (CC BY and BY-SA only) | Only about 24k books; see [Open-Access Books and Textbooks](/access/open-books/) for the rest of DOAB |
| The largest clean set of 19th–20th-century academic books, for non-commercial research | Institutional Books | Gated; no redistribution |
| Page-level features of in-copyright books | HTRC Extracted Features 2.0 (CC BY 4.0) | Token counts only, no running text; hosting after the 2026-09-30 shutdown is uncertain |
| Training or retrieval over books from shadow libraries | Nothing | Red in every jurisdiction ([The Legal Map](/building/legal-map/); [The Shadow Libraries](/access/shadow-libraries/)) |

## What old books are good for, and what they are not

### Good for: the history of ideas

The Open Stacks prototypes use one public-domain shelf built around a single question: what is probability, and how should we reason under uncertainty? The texts come from Gutenberg ([fetch script](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/scripts/fetch-texts.mjs)).

| Book | Edition on the shelf | Words | What it gives a modern reader |
|---|---|---|---|
| Laplace, *A Philosophical Essay on Probabilities* ([#58881](https://www.gutenberg.org/ebooks/58881)) | 1902 Truscott and Emory translation of the 6th French edition | 52,790 | The classical interpretation stated by its author, including the sunrise example for the rule of succession |
| Venn, *The Logic of Chance* ([#57359](https://www.gutenberg.org/ebooks/57359)) | 3rd edition, 1888 | 169,190 | Probability as the frequency in a "series", and with it the problem of choosing the series: the reference-class problem in an early form [I, standard attribution] |
| Jevons, *The Principles of Science* ([#74864](https://www.gutenberg.org/ebooks/74864)) | 2nd edition (1877), 1883 printing; Gutenberg text added 2024 | 292,116 | Induction framed as the "inverse method of probabilities": scientific method as inverse probability, which a modern reader would call Bayesian [I] |
| Peirce, *Chance, Love, and Logic* ([#65274](https://www.gutenberg.org/ebooks/65274)) | 1923 collection | 96,721 | "The Fixation of Belief", "How to Make Our Ideas Clear", "The Doctrine of Chances", "The Probability of Induction" |
| Poincaré, *The Foundations of Science* ([#39713](https://www.gutenberg.org/ebooks/39713)) | 1913 Halsted translation | 198,515 | A working mathematician on conventions and hypotheses; chapters on "The Calculus of Probabilities" and "Chance" |

The five books total about 810,000 words (4.8M characters). Read in sequence, they cover the argument that still divides Bayesian and frequentist practice, before either label existed [I]. The next books in the sequence are Keynes (1921), free now, and Ramsey and de Finetti (1931), free in the US by 2027-01-01.

Old books are good for three kinds of work.

1. **Genealogy of a concept.** When a modern debate has old roots (the reference class, the principle of indifference, what a probability of a single event means), the originals show which arguments were made, and answered, long ago. This is cheap insurance against reinventing a known objection.
2. **Original statements instead of textbook caricatures.** Textbooks tend to compress Laplace to "the principle of insufficient reason" and Venn to "frequentism". The originals are more hedged and more interesting [I].
3. **A legally clean sandbox for reading tools.** The R09 legal map rates storing, searching and summarising public-domain full text green ([R09](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R09-legal-and-licensing.md), row 6), with two caveats: "public-domain" editions can contain in-copyright introductions or translations, and status differs by country. The [Prototype Gallery](/building/prototype-gallery/) demos run on this shelf for that reason, and because these books are the hard case for summarisation and concept search: long, cross-referenced and built on arguments. They are also cheap to process: at roughly 4 characters per token the five books are about 1.2M tokens, or up to 1.6M with newer tokenizers [I]. One pass of the whole shelf through Claude Sonnet 5.5 costs about \$2.40–3.20 in input at \$2 per million tokens (standard pricing, October 2026).

### Not good for

- **Current methods.** The public-domain line falls just before the axiomatic and inferential foundations of modern statistics (Kolmogorov 1933, Neyman–Pearson 1933, Fisher's *Design of Experiments* 1935). It also predates decision theory in its modern form (von Neumann–Morgenstern 1944, Wald 1950, Savage 1954) and modern computing (Turing 1936, Shannon 1948). For methods, use the modern open canon in [Open-Access Books and Textbooks](/access/open-books/).
- **Mathematics as data.** Plain-text transcription of nineteenth-century notation is lossy. The Gutenberg transcriber of Jevons notes that the author's "unusual symbols" were replaced with "Unicode characters with similar appearance … disregarding their official meaning." For formulas, read the page scan in HathiTrust or Wikisource.
- **Terminology without a gloss.** "Probable error", "inverse probability", "chance" and "the law of error" do not mean what a modern reader expects. An LLM reading assistant helps here if it is told the period [I].
- **The mid-century gap.** In the R01 coverage test, none of six 1930–1989 classics (Feller, Savage, Kuhn, Popper, Parfit, Brooks) was free. Four had an English edition borrowable through Open Library. The public domain closes that gap by one publication year per calendar year.
- **Neutral background reading.** The wider pre-1931 statistics shelf includes eugenics (Galton, Pearson, Fisher) and period views on race and sex. Read it as evidence about its time.

**Decision:** read old books when the question is "where did this idea come from and what was it answering?" Read modern open textbooks when the question is "how do I do this?" For a mixed reading list, the [Access Ladder](/access/access-ladder/) orders the routes.

## Open questions

- **What share of US books published 1931–1963 that a researcher would actually want were renewed?** Ringer's 7% covers all registered books, and renewals favour valuable ones. Sampling 200 titles from a probability or economics syllabus against the Stanford database would give a field-specific rate.
- **How large is the "public domain but not on Gutenberg" technical shelf?** Cross the Hathifile's `pd`/`pdus` volumes in LoC classes QA, HA and HB against the Gutenberg catalogue to size it, and rank by Open Syllabus or citation counts to choose what to proofread first.
- **What is the error rate of IA's `NOT_IN_COPYRIGHT` flag in a random sample,** rather than the download-weighted 40 here? Draw 300 items dated 1931–2000 at random, excluding federal collections, and classify them against HathiTrust rights codes and renewal records.
- **Does HathiTrust's January rollover reach `und` volumes?** Rights timestamps show `ic` volumes from 1928 and 1930 opening on January 1. Check on 2027-01-02 whether the 1931 Ramsey printing (coded `und`) opened with the 1931 Jeffreys printing (coded `ic`), and what happened to the 4,972 items with a 1931 rights date coded `und`.
- **Will Institutional Books move from early-access to permanent terms, and will they permit commercial use?** The card calls its terms "provisional".
- **How much does Common Corpus's toxicity and "educational value" filtering remove from pre-1931 social science?** Compare its OpenCulture book list with the Hathifile for the same years and LoC classes.
- **Does HTRC Extracted Features 2.0 stay hosted after the 2026-09-30 service shutdown,** and does anyone mirror it?

## Related pages

- [Open-Access Books and Textbooks](/access/open-books/): modern free books, the 55-book coverage test and the 1930–1989 gap
- [Public Libraries](/access/public-libraries/): Open Library lending and library e-books for the mid-century gap
- [The Shadow Libraries](/access/shadow-libraries/): why they are irrelevant for public-domain books
- [The Access Ladder](/access/access-ladder/): the order in which to try routes
- [Catalogs and Metadata](/finding/catalogs-and-metadata/): Hathifiles, Open Library dumps and other metadata sources
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): HathiTrust search-only and Extracted Features
- [The Legal Map](/building/legal-map/): green, yellow and red uses of public-domain and licensed text
- [A Reference Architecture](/building/reference-architecture/): rights fields, jurisdiction and edition clustering
- [Prototype Gallery](/building/prototype-gallery/): tools built on the probability shelf
