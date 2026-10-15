# Cheap paid and institutional access routes — research dossier

- **Date of research:** 2026-10-15. All "as of" figures are this date unless stated otherwise.
- **Track:** R03, Open Stacks (QURI / CAIRN).
- **Scope:** What a researcher living in the San Francisco Bay Area can actually get, and for how much, beyond the free and open web. Covers:
  - consumer subscriptions: O'Reilly, Perlego, Everand (formerly Scribd's book side), Kindle Unlimited, Kobo Plus, and the Google and Apple stores;
  - scholarly pay routes: JSTOR JPASS, DeepDyve, Springer+, publisher pay-per-view, Cambridge Core;
  - the used-book market (AbeBooks, ThriftBooks) and Internet Archive lending;
  - Bay Area public libraries (SFPL, Oakland, Berkeley, San José, Santa Clara County, plus Los Angeles), Link+ and interlibrary loan, and out-of-area fee cards;
  - academic routes: UC Berkeley, Stanford, SF State, visiting-scholar appointments, alumni programs;
  - how employers license this content, and the license terms that bind anyone building tools.
- **Method:**
  - **The shared web-search budget was already exhausted when this track started. I ran zero successful web searches.** Everything below comes from direct fetches of primary URLs I knew or found by following links, about 120 pages and endpoints.
  - Where pages were JavaScript-only, I used the site's own public machinery, the same calls its web pages make, at polite rates:
    - Zendesk help-center APIs for Everand/Scribd and Cambridge Core;
    - the Freshdesk help pages for Springer Nature;
    - Perlego's public plans endpoint and the public search index behind perlego.com's search box (about 80 queries);
    - OverDrive's public "Thunder" catalog API behind Libby, for about 400 title-by-library lookups across 9 library systems;
    - O'Reilly's public book sitemap (27 files, 66,609 title URLs);
    - Crossref's REST API;
    - AbeBooks and ThriftBooks search pages.
  - **Catalog spot-check:**
    - A technical set of 33 well-known books, checked against O'Reilly, Perlego, Libby at 9 library systems, free legal copies (from the sibling dossier R01) and used-book prices.
    - A second set of 20 humanities and social-science books, checked against Perlego, Libby and O'Reilly.
  - **Blocked:** Several sites block automated access (HTTP 403, a JavaScript challenge, or Cloudflare): Everand's catalog, Kobo, acm.org, IEEE, Brooklyn PL, Free Library of Philadelphia, CCSF, and O'Reilly title pages. Those gaps are flagged where they matter.
- **Evidence labels:**
  - **[P]** verified on a primary source this session (official page, API response, terms document);
  - **[S]** secondary source or a sibling dossier;
  - **[I]** my inference;
  - **[U]** unverified: from prior knowledge, could not be checked in 2026.
  - Confidence is given as high/med/low or as a percentage. Sources older than about 2 years are marked **(stale?)**.

---

## Executive summary

1. **A free San Francisco Public Library card covers most of a working technical reading list.**
   - SFPL is free to every California resident; you apply online and show photo ID in person [P][37].
   - It unlocks Libby, **O'Reilly for Public Libraries** ("50,000+ business and technology titles, 30,000+ hours of video"), LinkedIn Learning, Udemy (via Gale), ProQuest eBook Central, EBSCO and Gale databases, JSTOR, Statista, IBISWorld, NYT, WSJ and the Washington Post [P][38].
   - In my 33-book technical spot-check, **SFPL alone (Libby + O'Reilly) plus legal free copies covered 28/33 (85%)** [P/I].
2. **O'Reilly's own catalog is narrower than people assume.**
   - Its public book sitemap lists **66,609 titles**. By ISBN prefix it has roughly 9,800 Packt, 9,200 Wiley, 8,300 O'Reilly, 5,000 Pearson, 4,000 Apress, 3,000 CRC/Taylor & Francis, 1,500 De Gruyter and 1,140 Manning [P][2].
   - It has **zero MIT Press, Cambridge, Oxford or core-Springer titles**. So no CLRS, no Goodfellow, no Sutton & Barto, no PRML.
   - The individual plan is **$49/month, $129/3 months or $499/year**; Teams is $499 per member per year [P][1].
3. **O'Reilly's membership agreement now forbids using its content as AI input.**
   - Content "may not be stored, reproduced, or transmitted in any form … including … as input or a prompt to a machine learning or AI system" without the copyright owner's written permission. It also bans "Web spiders" and using content to train AI. Quotes are capped at **250 words** (last updated 2024-10-09) [P][3].
   - This is the single most important constraint for anyone building Claude-powered reading tools on top of licensed content.
4. **Perlego is the humanities and social-science academic subscription, not a technical one.**
   - US prices: **Essential $15/month or $125/year; Complete $27/month, $79 per 4 months, or $199/year.** A/B-test variants run from $12 to $38 a month [P][7].
   - Its search index holds about 1.58M items, about 1.50M with US rights. Major publishers: Routledge (~153k), CRC (~34k), Wiley (~19k), Cambridge (~15.7k), Princeton (~9.8k), MIT Press (~1,000). It has only **33 O'Reilly titles and no Pearson** [P][8].
   - It covered 5/33 of my technical set but 8/20 of the humanities set.
5. **Everand ended "unlimited" reading.**
   - Plans are now **Standard $11.99/month (1 "unlock"), Plus $16.99 (3), Deluxe $28.99 (5)**. Most of its 1.5M+ catalog needs an unlock, and the old Legacy plan "has been discontinued" (help pages updated 2026-09) [P][9][10][11].
   - Scribd Inc. also acquired the social reading app **Fable** [P][12].
6. **Springer now sells individuals a token plan, Springer+.**
   - **Basic $39.99/month** buys 10 units. **Standard $299 per 6 months** buys 120 units.
   - One unit buys one article or chapter. A whole eBook costs at most 7 units.
   - After you spend a unit you have **12 hours to download**. Unused units expire [P][23][24][25][26].
   - Ordinary pay-per-view is **$39.95 per article and $29.95 per chapter** [P][27].
7. **For papers:**
   - **JPASS** is still sold: $19.50/month for 10 PDFs, or **$199/year for 120 PDFs** (about $1.66 per PDF), covering 2,400+ journals [P][17].
   - **DeepDyve** costs **$59/month or $499/year** for unlimited streaming of 35M+ paywalled papers, with printing capped at 40 pages a month [P][15].
   - **ACM's open-access flip is visible in Crossref.** About 66% of ACM's 2026 DOIs carry a CC license, against about 26% in 2024 [P][32].
8. **Bay Area universities sell cheap physical access and free walk-in e-access, but remote e-access is the hard part.**
   - **UC Berkeley:** a California-resident card costs **$100/year ($95 for seniors)** and includes **no remote e-resources**. Visitors can use licensed databases on library public computers [P][58][59].
   - **The best-value hack:** UC Berkeley Extension students in a 10+ week course can buy a **six-month card for $25 that *does* include remote access** to licensed journals, databases and e-books [P][58].
   - **Stanford** sells independent researchers access at **$35 for 2 weeks, $75/month or $450/year** (access and borrowing: $1,000/year). Licensed e-resources work only on designated library computers. Everyone gets 7 free day passes a year (14 for alumni). UC Berkeley grad students and faculty borrow there free [P][65].
   - **SF State:** $50/year community borrowing, plus no-login public research stations whose downloads can be saved to USB [P][69].
9. **Visiting-scholar status at Berkeley costs $750 for the first year ($1,500 for a consecutive second year), and you need a faculty sponsor** [P][62]. It is the cleanest route to full remote access for an unaffiliated researcher.
10. **The Libby "card stack" matters more than any single library.**
    - Across six Bay Area systems (SFPL, Oakland, Berkeley, San José, Santa Clara County, Peninsula), Libby held ebooks of **18/33 technical titles and 16/20 humanities titles**. SFPL alone had 10/33 and 10/20 [P][40].
    - Adding an **LA Public Library** card (free to Californians, issued in person in LA) raises this to 23/33 and 19/20. LAPL holds MIT Press texts (CLRS, Goodfellow, Sutton & Barto) that no Bay Area library had [P][40][41].
11. **Out-of-area e-access is shrinking.**
    - LAPL's instant e-card is now **"Los Angeles City Residents only"** because "licensing agreements with our digital content vendors require" it. LAPL's out-of-state fee card is **$50, in person only** [P][41][42].
    - Orlando's Orange County Library System **stopped issuing fee cards on 2026-07-31** [P][56].
    - San Antonio began charging **$30/year** to county residents outside city limits on 2026-10-01 [P][57].
    - **Counter-example:** Santa Clara County Library gives a **free full-access card to anyone with a US mailing address** who visits in person [P][54].
12. **JSTOR's public-library product is officially walk-in only.** ("Remote access for public libraries is not currently supported") [P][20]. Yet SFPL and Berkeley PL list JSTOR behind their remote EZproxy login, while LAPL marks it "Only available at LAPL Locations" [P][38][46][43]. Treat remote JSTOR via a public library as possible but not guaranteed.
13. **Used books close the last gap cheaply.** Cheapest AbeBooks listings, shipping included, on 2026-10-15 [P][33]:
    - *Gödel, Escher, Bach* $8.23; *Superforecasting* $9.38; CLRS 3e $16.25.
    - *Deep Learning* $35.99; PRML $38.19; DDIA $44.54.
    - *Statistical Rethinking* 2e $68.75; Jaynes $69.99; CLRS 4e $70.43.
14. **Corporate licensing is priced by usage and bound by restrictive terms.** JSTOR's Corporate Collection (800+ journals) runs from **$9,000 to $65,000 a year** in usage tiers [P][21]. Springer Nature and Elsevier license text and data mining (TDM) free to academic subscribers for non-commercial research but **charge or negotiate for commercial TDM** [P][28][29]. JSTOR's terms (2026-04-24) ban LLM training and automated downloading [P][22].

---

## Detailed findings

### 1. Consumer and individual subscriptions

#### 1.1 Comparison table (US prices, 2026-10-15)

| Option | Price (USD) | Catalog / coverage | Access requirements & limits | Status 2026 | Evidence |
|---|---|---|---|---|---|
| **O'Reilly Learning, Individual** | $49/mo; $129/3 mo; **$499/yr** | "Content from O'Reilly and nearly 200 providers". Public sitemap lists **66,609 book titles**. Strongest on Packt, Wiley, O'Reilly, Pearson/Addison-Wesley, Apress, Manning, CRC; **no MIT Press, CUP, OUP or core Springer** | Personal use only; no shared accounts; no spiders; **no AI input or training**; 250-word quote limit | Active. Agreement updated 2024-10-09 | [P][1][2][3] |
| O'Reilly Teams | $499 per member per year (2–25 seats) | Same plus cloud labs and admin | Sponsor terms apply | Active | [P][1] |
| **O'Reilly via a public library** | $0 with a card (SFPL, Oakland, Berkeley, San José, Santa Clara County) | SFPL blurb: "50,000+ business and technology titles, 30,000+ hours of video" | Library card; remote login through the library | Active | [P][38][46][50][53][55] |
| **Perlego Essential** | $15/mo; $45 per 4 mo; $125/yr | "800,000+ trusted titles and best-sellers" | Offline reading in app | Active; A/B prices from $12/mo | [P][5][7] |
| **Perlego Complete** | $27/mo; $79 per 4 mo; $199/yr (variants $22–$38/mo; $144/yr) | "1.5M+ books"; index ≈1.58M items, ≈1.50M with US rights | About 461k items flagged "restricted", probably Complete-only [I, low-med] | Active | [P][5][6][7][8] |
| **Everand Standard / Plus / Deluxe** | $11.99 / $16.99 / $28.99 per month | 1.5M+ ebooks and audiobooks; a rotating "unlimited" subset | 1 / 3 / 5 unlocks a month; unused unlocks expire after 6 months; 30-day trial on the web (7 days in-app) with 1 unlock | Legacy unlimited plan **discontinued** | [P][9][10][11][13] |
| **Kindle Unlimited** | **[U]** about $11.99/mo | "Unlimited access to over 5 million digital titles" | Amazon device or app; borrowing cap **[U]** | Active | [P for catalog claim][14]; price [U] |
| Kobo Plus (US) | **[U]** | **[U]** mostly trade, indie and Kobo Writing Life titles | — | Could not verify (kobo.com returned 403) | — |
| Google Play Books / Apple Books | Per-title purchase | Retail stores, no subscription | DRM; your own EPUB/PDF uploads supported **[U]** | — | [U] |
| **JSTOR JPASS** | $19.50/mo (10 PDFs); **$199/yr (120 PDFs)** | 2,400+ journals (JSTOR overall: 2,800+ journals, 12M+ articles, 158K+ books) | Unlimited online reading; download caps | Active; no end date announced | [P][17][19] |
| JSTOR free account | $0 | Read online "up to 10 free articles every 30 days"; Early Journal Content; 13,000+ OA books | Registration | Active | [P][18][19] |
| **DeepDyve Personal** | **$59/mo or $499/yr**; first month $0 | "35M+ full-text streaming papers" (paywalled), 25M+ OA, "150M+ research papers" overall | Streaming only; print 20–40 pages a month; PDF downloads bought separately "with no markup" | Active (© 2026) | [P][15][16] |
| **Springer+ Basic** | **$39.99/mo** | Chapters from 300,000+ eBooks and 10M articles on SpringerNatureLink | 10 units a month; 1 unit = 1 article or chapter; a full eBook costs at most 7 units; 12 hours to download; personal use only | Active (support pages 2024–25) | [P][23][24][25][26] |
| **Springer+ Standard** | **$299 per 6 months** | Same | 120 units per 6 months ($2.49 each); unused units expire | Active | [P][23][24] |
| Springer pay-per-view | **$39.95 per article; $29.95 per chapter** (Palgrave lists $39.99 per chapter) | All Springer Nature content | PDF download | Active | [P][27] |
| Springer MyCopy | **$39.99** softcover print-on-demand | Springer eBooks your *institution* licenses | Requires institutional eBook access | Active | [P][27] |
| Cambridge Core | Per item (prices not published) | Articles and whole eBooks | **"Chapter purchase or rental is not available"** | Active | [P][30][31] |
| De Gruyter, IEEE Xplore, ACM membership | **[U]** | — | — | Pages blocked (ACM/IEEE) or not checked | — |
| **Internet Archive lending** | $0 | Controlled digital lending (CDL) scans | 1-hour renewable loans; some 14-day loans; up to 10 books at a time; LCP DRM | Active but reduced since *Hachette* | [P][35][36] |

#### 1.2 O'Reilly: what the sitemap reveals

- **Method.**
  - O'Reilly's `robots.txt` points to a sitemap index. Its `book-sitemap.xml` lists 24 files of 2,500 URLs each, but files p25–p27 also exist (p27 has 1,609 entries).
  - Total: **66,609 unique `/library/view/<slug>/<id>/` URLs**. Of the identifiers, 59,908 are 13-digit ISBNs, 4,021 are 10-digit ISBNs and 1,337 are internal `0642572…` IDs (probably video or audio) [P][2].
  - `lastmod` dates fall in 2024 (27,436), 2025 (15,087) and 2026 (24,076).
- **Publisher composition by ISBN registrant prefix** [P][2]; the prefix-to-publisher mapping is mine [I, med]:

| Publisher (prefixes) | Titles in sitemap |
|---|---|
| Packt (978-1-78/80/83/84…) | ≈9,836 (the 978-1-80/-84 blocks also contain some other UK publishers) |
| Wiley (978-1-118/119, 0-470/471, 1-394) | ≈9,204 |
| O'Reilly Media (978-0-596, 1-4493, 1-4919, 1-4920, 1-0981, 979-8-3416) | ≈8,301 (also covers No Starch titles issued with O'Reilly e-ISBNs) |
| Pearson / Addison-Wesley / Prentice Hall (978-0-13, 0-321, 0-201) | ≈4,967 |
| Apress (978-1-4842, 1-4302, 979-8-8688) | ≈3,997 |
| CRC / Taylor & Francis (several) | ≈3,057 |
| Elsevier / Academic Press / Morgan Kaufmann | ≈1,675 |
| De Gruyter (978-3-11) | ≈1,502 |
| McGraw-Hill | ≈1,205 |
| Manning (978-1-617, 1-633) | ≈1,140 |
| Harvard Business Review Press | ≈619 |
| Microsoft Press | ≈522 |
| Pragmatic Bookshelf | ≈376 |
| **MIT Press (978-0-262)** | **0** |
| **Cambridge UP** | **0** |
| **Oxford UP** | **0** |
| **Springer core (978-3-030/031/319…, 0-387)** | **0** (Apress, a Springer Nature imprint, is present) |
| Princeton / Yale / Chicago / Harvard UP | 0 |
| Big-5 trade houses (PRH, HarperCollins, S&S, Hachette) | ≈62 |

- **Non-English titles.** About 4,000 identifiers carry German, Japanese, Spanish, French or Italian registrant prefixes. Some are translations (for example a German *Human Compatible*) [I, med].
- **Caveat.** The sitemap may not equal the subscribable catalog. Some titles may be missing, and the public-library edition may differ [I, med].

#### 1.3 Perlego: catalog composition

- **Prices.** The pricing page shows plan names but no prices; the prices load from `api.perlego.com/payment/v1/plans`. That endpoint lists the US default plans above plus experiment variants labelled "[SM 1.2] [VAR-…]" and "[CRO 6.7]". So the price a given visitor sees may differ [P][7].
- **Publisher counts.** These are exact-filter counts from the public search index on 2026-10-15. Facet counts run 30–45% higher and are approximate [P][8]:

| Publisher | Count | | Publisher | Count |
|---|---|---|---|---|
| Routledge | 153,104 | | Packt | 5,662 |
| CRC Press | 33,699 | | Springer | 4,472 |
| Wiley | 18,959 | | Chapman & Hall/CRC | 3,849 |
| Cambridge UP | 15,658 | | Harvard UP | 2,958 |
| Princeton UP | 9,762 | | Simon & Schuster | 2,361 |
| Elsevier | 5,598 | | HarperCollins | 1,986 |
| Stanford UP | 1,943 | | Yale UP | 1,558 |
| Apress | 1,165 | | Taylor & Francis (imprint) | 1,117 |
| **The MIT Press** | **1,003** | | Morgan Kaufmann | 755 |
| Manning | 688 | | W. W. Norton | 421 |
| Pragmatic Bookshelf | 200 | | **O'Reilly Media** | **33** |
| Pearson | 0 (under that name) | | No Starch | 0 |

- **Sales rights matter.** *The Alignment Problem* is in Perlego only as the UK Atlantic Books edition, and **"US" is not in its sales-rights list**, so a US subscriber cannot read it [P][8].
- **Restricted titles.** Some technical CRC and Wiley titles carry `is_restricted=1, dtc_only=1`: *Statistical Rethinking*, BDA3, *How to Measure Anything*. My reading is that these are Complete-tier and individual-subscriber-only [I, low-med].

#### 1.4 Everand

- **Plans:** Standard $11.99 (1 unlock a month), Plus $16.99 (3), Deluxe $28.99 (5) [P][9].
- **How unlocks work:**
  - An unlocked book stays readable while you remain subscribed, and comes back if you resubscribe with the same email.
  - Unlocks roll over for up to 6 months, then expire [P][10].
  - "Most" of the 1.5M+ catalog requires an unlock. A rotating "unlimited" subset (podcasts, Everand Originals, some books) does not [P][11].
- **Effective cost:** $5.66–$5.80 per book on Plus or Deluxe; $11.99 on Standard [I].
- **Catalog coverage for technical books could not be checked**, because Everand serves a JavaScript bot challenge [P, blocked].

#### 1.5 Used and print markets

AbeBooks ISBN searches sorted by price plus shipping, 2026-10-15 [P][33]. "Total" includes US shipping.

| ISBN / book | Results | Cheapest total | Cheapest *used* |
|---|---|---|---|
| 9780465026562 *Gödel, Escher, Bach* | 95 | $8.23 | $8.23 |
| 9780804136716 *Superforecasting* | 35 | $9.38 | $9.38 |
| 9780262033848 CLRS 3e | 38 | $16.25 | $16.25 |
| 9781098125974 *Hands-On ML* 3e | 52 | $32.74 | $32.74 |
| 9780134610993 AIMA 4e | 44 | $33.15 ("New", probably an international edition [I]) | $127.80 |
| 9780134092669 CS:APP 3e | 23 | $31.54 (New) | $93.00 |
| 9780262510875 SICP 2e | 54 | $34.61 | $34.61 |
| 9780262035613 Goodfellow *Deep Learning* | 75 | $35.99 | $35.99 |
| 9780387310732 Bishop PRML | 41 | $38.19 | $38.19 |
| 9780387848570 ESL 2e | 32 | $42.14 | $42.14 |
| 9781449373320 DDIA 1e | 72 | $44.54 | $44.54 |
| 9781439840955 BDA 3e | 39 | $54.39 | $54.39 |
| 9780521642989 MacKay | 37 | $56.21 | $56.21 |
| 9780367139919 *Statistical Rethinking* 2e | 37 | $68.75 | $68.75 |
| 9780521592710 Jaynes | 32 | $69.99 | $69.99 |
| 9780262046305 CLRS 4e | 63 | $70.43 | $70.43 |
| 9780262039246 Sutton & Barto 2e | 39 | $77.74 | $77.74 |

- **ThriftBooks** reports work-level "from" prices that can mix editions, for example "Deep Learning" hardcover $42.09–$100.00, PRML from $66.39, Jaynes $146.94 [P][34]. It is less useful than AbeBooks for exact-edition shopping [I].
- **Bookshop.org** sells new books at list price. It supports independent stores but is not a cheap route [I].

#### 1.6 Internet Archive lending

- **Terms:** 1-hour renewable loans in the BookReader; some titles also offer 14-day loans with LCP-encrypted EPUB/PDF downloads (Thorium on desktop, Cantook on mobile); up to 10 books at a time [P][35].
- **Legal history:** IA "decided not to pursue Supreme Court review" after the Second Circuit's *Hachette* ruling (blog post 2024-12-04) [P][36].
- **Further detail** (500,000+ titles removed from lending; CDL coverage of canonical books): see R01 [S].

---

### 2. Public libraries

#### 2.1 Bay Area (and LA) public libraries

| Library | Eligibility & cost | How to get it | Notable e-resources for researchers | Evidence |
|---|---|---|---|---|
| **San Francisco PL** | **Free to all California residents** | Apply online, then show photo ID in person | Libby/OverDrive, Hoopla, Palace Project, Kanopy; **O'Reilly for Public Libraries**; **LinkedIn Learning** (16,000+ courses); **Udemy (Gale Presents)** (4,000+ courses); Treehouse; **ProQuest eBook Central**; EBSCO eBook Collection (Main Library only); **JSTOR** (EZproxy link, "1838 – 3 years ago"); Academic Search Complete; Gale Academic OneFile; OED; Statista (card and PIN needed from 2026-04-01); IBISWorld; Morningstar; NYT, WSJ and Washington Post; PressReader; WorldCat. 268 headings on the A–Z list | [P][37][38] |
| **Oakland PL** | Free to California residents | Online cards must be **verified with ID within 30 days**; Oakland, Emeryville and Piedmont residents can verify by phone or email | Libby, Hoopla, Kanopy, Palace; **O'Reilly for Public Libraries**; **American Physical Society** journals; Gale Academic OneFile; NYT; WSJ; Pressbooks | [P][49][50] |
| **Berkeley PL** | "Free to all California residents"; "applicants must be present" | In person (a 120-day temporary eCard dates from COVID) | Libby, Hoopla, Kanopy; **O'Reilly Technical Books**; **JSTOR/Artstor** (EZproxy); **Physical Review journals**; OED; NYT, WSJ, Washington Post; Udemy. **From 2026-10-15, Libby and Kanopy logins require card number plus PIN** | [P][45][46][48] |
| **San José PL** | Full card for California residents (4 years) | Apply online, then pick up in person with proof of a California address and photo ID | **O'Reilly**, **LinkedIn Learning** (16,000+ courses), Hoopla, Libby (incl. 250+ Great Courses) | [P][52][53] |
| **Santa Clara County Library** | **Instant eCard for county residents; free full card in person for anyone with a US mailing address** | Online eCard (county) or in person | **O'Reilly**, **LinkedIn Learning**, Treehouse, The Great Courses, Academic Search Complete, EBSCO and Gale reference eBooks | [P][54][55] |
| **LA Public Library** | Free to California residents; **e-card for LA City residents only**; **$50 non-resident card (outside California), in person only** | In person with ID; online pre-registration | 1.5M+ ebooks and audiobooks; 200+ databases including **ProQuest Central**, Research Library, ABI/Inform, **OECD iLibrary**, **HeinOnline**, Lexis Advance, Westlaw, Oxford Reference, Gale eBooks, LinkedIn Learning, Great Courses (via Hoopla); **JSTOR in-library only**. **No O'Reilly** | [P][41][42][43][44] |

#### 2.2 Libby availability: the card-stack effect

- **Method.** OverDrive's catalog API was queried for each title and library. Counts below are ebook editions with owned copies above zero [P][40].
- **Technical set (33 titles):**
  - SFPL 10.
  - Union of SFPL, Oakland, Berkeley, San José, Santa Clara County and Peninsula: **18**.
  - **+ LAPL: 23**. NYPL and Brooklyn add nothing beyond that.
- **Humanities and social science (20 titles):**
  - SFPL 10.
  - Bay Area union **16**.
  - **+ LAPL 19**. Only Hacking's *The Emergence of Probability* is missing everywhere.
- **Library-specific holdings:**
  - San José and Santa Clara hold O'Reilly titles SFPL lacks (*Hands-On ML*, *Designing ML Systems*, *AI Engineering*).
  - **LAPL holds MIT Press ebooks** (CLRS 3 copies; Goodfellow 3; Sutton & Barto 1) and Pearson's *Clean Code*.
- **Holds queues, snapshot of 2026-10-15** [P][40]:
  - *Thinking, Fast and Slow*: SFPL 13 copies / 51 holds; LAPL 16 / 87.
  - *AI Engineering*: LAPL 6 / 16; San José 5 / 9.
  - *Build a Large Language Model (From Scratch)*: LAPL 3 / 20.
  - *The Alignment Problem*: SFPL 7 / 8.
  - *Human Compatible*: SFPL 2 / 9.
- **Odd case.** Santa Clara lists **334 copies** of the *AI Engineering* audiobook (Ascent Audio), 333 available. That pattern suggests a cost-per-circulation or simultaneous-use license [I, med].
- **OverDrive library keys found:**
  - `sfpl`, `oakland`, `berkeleypubliclibrary`, `sanjose`, `santaclara`, `pls`, `lapl`, `nypl`, `brooklyn`.
  - `berkeley` is Berkeley Law's library, not Berkeley PL.

#### 2.3 Link+ and interlibrary loan in California

- **Link+.**
  - "A combined catalog of over 11 million items from 64 libraries throughout California and Nevada"; most requests arrive in under a week [P][51].
  - At Berkeley PL: up to **25 Link+ items** at once; loans of **21 days, renewable once** [P][47].
  - SFPL participates: its FAQ covers Link+ renewals (once, 3 weeks) [P][39].
- **Oakland PL interlibrary loan (ILL)** [P][51]:
  - Covers books and journal articles; **maximum 3 requests per month**.
  - Excludes books published in the current year and anything available via Link+. Some loans carry a cost, and the library checks with you first.
  - $115 minimum charge for a lost ILL item.
- **UC Berkeley and Stanford** exclude interlibrary borrowing from their paid community cards [P][58][65].

#### 2.4 National out-of-area fee cards

| Library | 2026 status | Evidence |
|---|---|---|
| LA Public Library | $50 non-resident card for applicants outside California; in person; e-card restricted to LA City residents "per licensing agreements" | [P][42] |
| Orange County Library System (Orlando) | **Fee cards "no longer being issued or renewed, as of July 31, 2026"** (they had included remote database access and ebook holds) | [P][56] |
| San Antonio PL | New **$30/yr** fee from 2026-10-01 for Bexar County residents outside city limits; paid in person | [P][57] |
| Santa Clara County Library | Free full-access card for any US mailing address, issued in person | [P][54] |
| Houston PL | No non-resident card fee appears on its fee schedule page | [P][70] (absence only) |
| Brooklyn PL, Free Library of Philadelphia, Fairfax County | **Could not verify** (403/404). Historically about $50/yr cards were reported for Brooklyn and Philadelphia **[U, low]** | — |

**Pattern [I, med]:** vendors (OverDrive, database aggregators) increasingly tie licenses to the population served. Libraries are closing remote-only, out-of-area routes: LAPL's e-card restriction, OCLS's discontinuation, and JSTOR's walk-in-only public-library model. Plan on cards that need an in-person visit.

---

### 3. Academic routes

#### 3.1 UC Berkeley Library (non-affiliates)

| Category | Price | Remote licensed e-resources? | Notes | Evidence |
|---|---|---|---|---|
| Visitor, no card | Free | **No** (free basic Wi-Fi "does **not** include access to Library-licensed resources") | **Databases on library public computers**; Main Stacks by day pass or longer request | [P][59] |
| **California resident card** | **$100/yr ($95 seniors)** | **No** | 20 books; Main (Gardner) Stacks; no interlibrary borrowing; set up by email, pick up in person | [P][58][59] |
| **UC Berkeley Extension student** (10+ week course) | **$25 for 6 months** | **Yes** | Needs proof of current registration. The course fee is extra [U] | [P][58] |
| CSU / community-college student | $25 for 6 months | No | | [P][58] |
| California private-school K-12 teacher | $100/yr | No | | [P][58] |
| UC alumni association member (any of 10 UC associations; California resident) | Membership dues; card fee not stated | **No** | Cal Alumni Association: "membership is open to all", **Standard $75/yr**; the library page says "Alumni of any University of California campus" | [P][58][60][63] |
| **Visiting scholar** (department appointment + VSPA) | **University Services Fee $750 first year; $1,500 consecutive second year** (Visiting Student Researcher $1,000 / $2,500) | **Yes** | Needs a faculty sponsor; the department may charge its own fee | [P][58][61][62] |
| Retired UC Berkeley employee; Extension faculty | Free | Yes | | [P][58] |

- The Cal Alumni Association also gives **$50 off each eligible UC Berkeley Extension course** [P][64]. That stacks with the $25 Extension card [I].

#### 3.2 Stanford Libraries (non-affiliates)

| Category | Access card | Access + borrowing | Licensed e-resources | Evidence |
|---|---|---|---|---|
| Anyone (day pass) | **Free, 7 days a year** (14 for alumni) | — | On **designated public computers** in the libraries | [P][65] |
| **Independent researchers / visitors** | **$35 / 2 weeks; $75 / month; $150 / 3 months; $450 / year** | $325 / 3 months; $500 / 5 months; $1,000 / year | On-site only; "access from personal devices or off campus requires a SUNet ID" | [P][65] |
| Stanford alumni | $10 / 2 weeks; $15 / month; $40 / 3 months; $100 / year | $125 / 3 months; $175 / 5 months; $400 / year | On-site; SAA alumni also get "free access to searchable databases containing thousands of journals" with SAA credentials | [P][65][66] |
| **UC Berkeley grad students, faculty, academic staff** | — | **Free** (other UC campuses $10) | — | [P][65] |
| Short-term scholar hosted by a department | — | Free for 90 days | — | [P][65] |
| Continuing Studies students | **No library privileges** | — | — | [P][65] |

- Excluded from these cards: the Law, Lane Medical, Hoover and GSB libraries, and interlibrary loan [P][65].
- Stanford Alumni Association lifetime membership: $795 for alumni; "Friend of Stanford" $1,195 [P][67].

#### 3.3 SF State (J. Paul Leonard Library) and other walk-in options

- **Community Borrowers:** **$50/year** for physical borrowing. It **excludes** off-campus or wireless e-resource access, ILL, and computers and printers [P][69].
- **Public research stations** (floors 1, 3 and 4) give "on-site access to many research databases". **No account or login is required.** You can save downloads to a personal USB drive [P][68][69].
- Special borrower cards are free for CSU students and faculty, OLLI and ElderCollege members, and Alumni Association members [P][68].
- **Leads I could not verify:**
  - San José State's King Library is shared with SJPL, which suggests on-site database access for SJPL cardholders [U].
  - Enrolling in a California community college course (historically $46/unit for residents; SF residents may qualify for Free City College) could give student database access [U, med]. The CCSF and De Anza pages returned 403.

#### 3.4 Alumni e-resource programs

- **Stanford:** "Access to online databases with thousands of publications … free access" for all alumni through SAA credentials [P][66].
- **UC Berkeley:** gives alumni no remote licensed resources, and points them to "freely available resources" and the Friends of the Library [P][60].
- **JSTOR alumni access:** the program page and any mention in JSTOR's current sitemap could not be found. **Status unknown** [U].
- **EBSCO and ProQuest alumni editions** exist at some universities **[U]**. Check your own alma mater.

---

### 4. Employer and corporate access

#### 4.1 How organizations license (what is visible from primary sources)

- **O'Reilly.**
  - Teams costs $499 per member per year (2–25 seats). Enterprise is quoted, and adds SSO/SCIM, **Search and Insights APIs** and Slack/Teams apps [P][1].
  - Content use for sponsored users is governed by the same membership agreement plus any "additional terms" the sponsor sets [P][3].
- **JSTOR corporate.**
  - The "Corporate Collection" covers 800+ archive journals. The annual fee is set by "significantly accessed journals". Everyone starts at Tier 1, $9,000.
  - Tiers run to $65,000 (Tier 14, 251–300 journals). A worked example goes from $9,000 to $11,000 to $15,000 to $12,500 over years 1–4 [P][21].
- **Springer Nature.** Academic and government subscribers get TDM rights "at no additional cost" for non-commercial research. "For TDM in the context of commercial research, Springer Nature offers standard TDM terms as well as the TDM API **for a fee**." Non-subscribers to paywalled content go case by case. The open-access API covers 900,000+ documents [P][28].
- **Elsevier.** Researchers at *subscribing academic institutions* get TDM with a personal API key for non-commercial research. Corporate subscribers must "contact your Elsevier Account Manager" [P][29].
- **IEEE Xplore and the ACM Digital Library.**
  - Pricing pages were blocked [U].
  - **ACM's open-access transition shows in Crossref data** [P][32]:
    - 2026 DOIs: ≈24,780 of 37,502 carry a CC license (21,561 CC BY).
    - 2024 DOIs: about 12,100 of 45,892.
    - The 1990s backfile is still recorded under ACM's copyright policy. ACM's free-to-read backfile is a reading permission, not a license [I].

#### 4.2 Typical restrictions that bind individuals (verified texts)

| License | Key restrictions | Evidence |
|---|---|---|
| **O'Reilly membership agreement** (2024-10-09) | "Provided for your personal use only. Sharing … accounts is prohibited." You may print or download "Sections" (what the platform shows at one time) for personal use only. Quotes capped at 250 words. **"Any use of 'Web spiders,' or any other automated retrieval mechanisms … is strictly prohibited."** No extracting content "to develop any software program, including … training a machine learning or artificial intelligence ('AI') system". **No storing or transmitting content "as input or a prompt to a machine learning or AI system"** without the copyright owner's written permission | [P][3] |
| **JSTOR terms** (2026-04-24) | No using Content "to train large language models or other generative AI technologies"; no automatic downloading or scraping; no "systematically print[ing] out, download[ing]…"; JSTOR may suspend access per user or IP | [P][22] |
| **Springer+** | "Not licensed for use by companies or organizations"; personal email and payment only | [P][24] |
| **Elsevier TDM** | Academic, non-commercial TDM via API key; corporate TDM negotiated | [P][29] |

**Implication [I, high].** An employer's O'Reilly, JSTOR or Elsevier license typically:
- covers personal reading by named employees;
- forbids bulk or automated retrieval;
- and increasingly forbids AI processing unless a separate AI or TDM addendum is negotiated.

Proxy-based bulk downloads trigger IP blocks that hit the whole organization. See R09 for the legal background.

---

### 5. Catalog spot-check (33 technical + 20 humanities titles)

Legend:
- **Y** = available. **–** = not found.
- "Free": a legal full text, per R01 (verified there) or [I] where marked.
- O'Reilly: present in the public book sitemap. This is also the probable content of the public-library edition [I].
- Perlego: present **with US sales rights**.
- Libby: ebook with copies above zero.
- "Bay" = OPL, BPL, SJPL, SCCLD or PLS.
- Prices: cheapest AbeBooks total.

| # | Book (publisher) | Free | O'Reilly | Perlego (US) | SFPL Libby | Other Bay Libby | LAPL Libby | Cheapest used |
|---|---|---|---|---|---|---|---|---|
| 1 | Kleppmann, *Designing Data-Intensive Applications* (O'Reilly) | – | Y (1e, 2e) | – | Y (10 copies) | OPL, SJPL, SCCLD | Y | $44.54 |
| 2 | Géron, *Hands-On ML* (O'Reilly) | – | Y | – | – | SJPL, SCCLD | Y | $32.74 |
| 3 | McKinney, *Python for Data Analysis* 3e (O'Reilly) | Y, author site [I, high] | Y | – (German ed. only) | Y | SJPL, SCCLD | Y | — |
| 4 | Huyen, *Designing ML Systems* (O'Reilly) | – | Y | – | – | SJPL | Y | — |
| 5 | Huyen, *AI Engineering* (O'Reilly 2025) | – | Y | – | – | SJPL, PLS | Y (6 copies / 16 holds) | — |
| 6 | Beyer et al., *Site Reliability Engineering* (O'Reilly) | Y (1st ed. only) | Y | – | Y | SCCLD | Y | — |
| 7 | Chollet, *Deep Learning with Python* (Manning) | – | Y | Y (1e–3e) | – | – | Y | — |
| 8 | Raschka, *Build a Large Language Model (From Scratch)* (Manning) | – (code only) | Y | – | – | PLS | Y (3 / 20 holds) | — |
| 9 | Klabnik & Nichols, *The Rust Programming Language* (No Starch) | Y [I, high] | Y [med] | – | – | SJPL | Y | — |
| 10 | Thomas & Hunt, *The Pragmatic Programmer* (Addison-Wesley) | – | Y | – (Italian only) | – | SJPL | Y | — |
| 11 | Martin, *Clean Code* (Pearson) | – | Y | – (de/it only) | – | – | Y | — |
| 12 | Cormen et al., *Introduction to Algorithms* (MIT) | – | – | – | – | – | Y | $16.25 (3e) / $70.43 (4e) |
| 13 | Goodfellow et al., *Deep Learning* (MIT) | Y (HTML) | – | Y | – | – | Y | $35.99 |
| 14 | Sutton & Barto, *Reinforcement Learning* (MIT) | Y | – | – | – | – | Y | $77.74 |
| 15 | Russell & Norvig, *AIMA* 4e (Pearson) | – | – | – | – | – | – | $33.15 new / $127.80 used |
| 16 | Bryant & O'Hallaron, *CS:APP* 3e (Pearson) | – | – | – | – | – | – | $31.54 new / $93 used |
| 17 | Abelson & Sussman, *SICP* (MIT) | Y (CC BY-SA) | – | – | – | SJPL | Y | $34.61 |
| 18 | McElreath, *Statistical Rethinking* 2e (CRC) | – | Y (1e, 2e) | Y (restricted) | – | – | – | $68.75 |
| 19 | Gelman et al., *BDA3* (CRC) | Y (non-commercial PDF) | Y | Y (restricted) | – | – | – | $54.39 |
| 20 | Bishop, *PRML* (Springer) | Y | – | – | – | – | – | $38.19 |
| 21 | Hastie et al., *ESL* 2e (Springer) | Y [~90%] | – | – | – | – | – | $42.14 |
| 22 | Deisenroth et al., *Mathematics for ML* (CUP) | Y | – | – | – | – | – | — |
| 23 | MacKay, *Information Theory…* (CUP) | Y (on-screen) | – | – | – | – | – | $56.21 |
| 24 | Jaynes, *Probability Theory* (CUP) | Partial (ch. 1–3) | – | – | – | – | – | $69.99 |
| 25 | Hubbard, *How to Measure Anything* (Wiley) | – | Y | Y (restricted) | audio only | SCCLD | Y | — |
| 26 | Tetlock & Gardner, *Superforecasting* (Crown) | – | – | – | Y | SJPL, SCCLD, PLS | Y | $9.38 |
| 27 | Kahneman, *Thinking, Fast and Slow* (FSG) | IA CDL (per R01) | – | – | Y (13 / 51 holds) | all six | Y | — |
| 28 | Pearl & Mackenzie, *The Book of Why* (Basic) | – | – | – | Y | BPL, SCCLD, PLS | Y | — |
| 29 | Hofstadter, *Gödel, Escher, Bach* (Basic) | – | – | – | – | – | – | $8.23 |
| 30 | Christian, *The Alignment Problem* (Norton) | – | – | – (UK rights only) | Y | SCCLD, PLS | Y | — |
| 31 | Ord, *The Precipice* (Hachette) | – | – | – | Y | (audio at BPL, SJPL) | Y | — |
| 32 | Russell, *Human Compatible* (Viking) | – | – (German ed.) | – | Y | SCCLD, PLS | Y | — |
| 33 | Silver, *The Signal and the Noise* (Penguin) | – | – | – | Y | BPL, SJPL, SCCLD, PLS | Y | — |

**Tallies, technical set (n = 33)** [P counts; I for unions]:

| Route | Count |
|---|---|
| Free legal full text | 11 (+1 partial) |
| O'Reilly | 14 |
| Perlego | 5, all already covered by O'Reilly or free copies |
| SFPL Libby | 10 |
| Bay Area Libby union | 18 |
| + LAPL | 23 |
| **SFPL card (Libby + O'Reilly) + free web** | **28 (85%)** |
| + LAPL | **29 (88%)** |
| Residual | AIMA, CS:APP, GEB, full Jaynes, all available used for $8–$70 |

**Humanities and social science (n = 20)**, checked on Perlego, Libby and O'Reilly [P][8][40][2]. Titles:

- Kuhn, *Structure*; Parfit, *Reasons and Persons*; Scott, *Seeing Like a State*; Diamond, *Guns, Germs, and Steel*.
- Polanyi, *Great Transformation*; Anderson, *Imagined Communities*; Rawls, *A Theory of Justice*; Gordon, *Rise and Fall of American Growth*.
- Arendt, *Origins of Totalitarianism*; Meadows, *Thinking in Systems*; Simler & Hanson, *The Elephant in the Brain*; Galef, *The Scout Mindset*.
- Foucault, *Discipline and Punish*; Weber, *Protestant Ethic*; Said, *Orientalism*; Henrich, *The Secret of Our Success*.
- MacAskill, *What We Owe the Future*; Mokyr, *A Culture of Growth*; Hacking, *The Emergence of Probability*; Popper, *Logic of Scientific Discovery*.

| Route | Count |
|---|---|
| O'Reilly | **0/20** |
| Perlego with US rights | **8/20**: Kuhn (Chicago), Scott (Yale), Gordon, Henrich, Mokyr (Princeton), Arendt (Mariner), Weber, Popper (Routledge). Anderson (Verso) and MacAskill (Oneworld) are present but without US rights |
| SFPL Libby | **10/20** |
| Bay Area Libby union | **16/20** |
| + LAPL | **19/20** |
| Bay union + Perlego | 18/20 |

Holds are heavier for popular trade titles: *Thinking in Systems*: SFPL 26 copies / 14 holds, LAPL 18 / 30; *Guns, Germs, and Steel*: LAPL 7 / 35.

**Caveats.** These are small, hand-picked samples biased toward famous books. Libby counts change daily. O'Reilly presence is taken from the sitemap, not from logging in. Perlego results come from its public index and US-rights field, not from a logged-in US account [I].

---

### 6. Cost and coverage comparison, and the access ladder

#### 6.1 Cost and coverage summary

| Route | Annual cost | Technical coverage (my set) | Humanities coverage (my set) | Papers | Friction |
|---|---|---|---|---|---|
| Free web (OA, author PDFs, arXiv) | $0 | 33% | low [I] | ≈50% of recent articles (R02) | Findability |
| **SFPL card** | $0 | 64% via Libby + O'Reilly; **85% with free web** | 50% | JSTOR (remote status disputed), EBSCO, Gale, ProQuest eBook Central | One in-person visit; holds |
| Bay Area card stack (6 cards) | $0 | adds SJPL/SCCLD O'Reilly-adjacent titles | 80% | Adds APS journals (OPL, BPL) | Several visits |
| + LAPL card | $0 + trip to LA | 88% with free web | 95% | ProQuest Central, OECD, HeinOnline | In person in LA |
| O'Reilly Individual | $499 | 42% | 0% | – | Only worth it without a library route |
| Perlego Complete | $199 (or $27/mo) | 15% | 40% | – | Sales-rights gaps |
| Everand Plus | $204 ($16.99 × 12) for 36 unlocks | unknown (blocked) | trade-focused [I] | – | Unlock budgeting |
| JPASS annual | $199 for 120 PDFs | – | JSTOR backfile | 2,400+ journals | Download cap |
| DeepDyve | $499/yr ($59/mo) | – | – | 35M+ papers, streamed | Print cap of 40 pp/mo |
| Springer+ Standard | $598/yr (2 × $299) | Springer chapters/books at ≤7 units each | Palgrave/Springer | Springer journals | 12-hour download window |
| UCB CA-resident card | $100 | physical books only | physical | on-site terminals only | Visit Berkeley |
| **UCB Extension card** | $50/yr (2 × $25) + course fees | **full UC Berkeley e-collections remotely** | same | same | Must stay enrolled in 10+ week courses |
| Stanford access (independent) | $35–$450 | on-site e-resources | on-site | on-site | Day trips |
| SFSU community | $50 (stations free) | physical + on-site databases | same | on-site | USB downloads allowed |
| Visiting scholar (UCB) | $750 + sponsor | full remote | full remote | full | Needs an appointment |

#### 6.2 The access ladder (free, then cheap, then institutional)

1. **Rung 0: no card.**
   - Open-access and author-hosted texts (R01, R02); JSTOR's 10 free articles per 30 days; IA one-hour loans; Springer and Elsevier open-access APIs.
   - Expected: about **one-third of a technical canon**, much less of recent humanities monographs [P/I].
2. **Rung 1: one free SFPL card.**
   - Adds Libby, O'Reilly, LinkedIn Learning, Udemy, ProQuest eBook Central, EBSCO and Gale article databases, and possibly JSTOR. Link+ and ILL for print.
   - Expected: **about 85% of a technical list** (counting free copies) and **about 50% of a humanities list** as ebooks, with holds queues on popular trade books [P/I].
3. **Rung 2: the free card stack.**
   - Oakland (online, then verify within 30 days; APS journals), Berkeley (APS journals, JSTOR), San José and Santa Clara County (O'Reilly, LinkedIn Learning; SCCLD in person for any US address), Peninsula Library System, and **LAPL on any trip to LA**.
   - Expected: **about 88% technical and about 95% humanities** as ebooks. Holds spread across systems [P/I].
4. **Rung 3: free walk-in academic access.**
   - UC Berkeley public computers (databases, no login); SFSU research stations (download to USB); Stanford day passes (7 a year).
   - Good for **batched paper retrieval**. Respect "no systematic downloading" [P].
5. **Rung 4: cheap targeted purchases.**
   - Used books ($8–$70 for the residue); JPASS ($1.66 per PDF); Springer+ for a month when you need a burst of Springer chapters (about $4 each); Perlego Complete for a semester of Routledge, CUP or Princeton monographs; DeepDyve for heavy paper reading outside JSTOR.
6. **Rung 5: cheap institutional borrowing.** SFSU $50; UCB $100 (or via CAA membership); Stanford $35 for 2 weeks to $450 a year (on-site e-resources).
7. **Rung 6: institutional remote access.**
   - **UC Berkeley Extension ($25 card + course)**, a visiting-scholar appointment ($750 + sponsor), or employer licenses (subject to their AI and TDM restrictions).

---

## Numbers that matter

| Fact | Value | Date | Source | Confidence |
|---|---|---|---|---|
| O'Reilly Individual price | $49/mo; $129/3 mo; $499/yr | 2026-10-15 | [1] | P, high |
| O'Reilly Teams | $499 per member per year (2–25) | 2026-10-15 | [1] | P, high |
| O'Reilly book sitemap size | 66,609 title URLs | 2026-10-15 | [2] | P, high (sitemap ≠ catalog: med) |
| O'Reilly MIT Press / CUP / OUP / core-Springer titles | 0 / 0 / 0 / 0 | 2026-10-15 | [2] | P (prefix method), med-high |
| O'Reilly quote limit | 250 words | agreement 2024-10-09 | [3] | P, high |
| Perlego US Essential | $15/mo; $45/4 mo; $125/yr | 2026-10-15 | [7] | P, high (A/B variants exist) |
| Perlego US Complete | $27/mo; $79/4 mo; $199/yr | 2026-10-15 | [7] | P, high |
| Perlego index size | ≈1.58M (≈1.50M with US rights) | 2026-10-15 | [8] | P, med (non-exhaustive count) |
| Perlego O'Reilly titles | 33 | 2026-10-15 | [8] | P, med |
| Everand plans | $11.99 / $16.99 / $28.99 for 1 / 3 / 5 unlocks | updated 2026-09-27 | [9] | P, high |
| Everand catalog | 1.5M+ | 2026-08-17 | [11] | P, high |
| Kindle Unlimited catalog claim | "over 5 million digital titles" | 2026-10-15 | [14] | P, high |
| JPASS | $19.50/mo for 10 PDFs; $199/yr for 120 | 2026-10-15 | [17] | P, high |
| JSTOR free reading | 10 articles per 30 days | 2026-10-15 | [18] | P, high |
| DeepDyve Personal | $59/mo or $499/yr; 35M+ streamable papers | 2026-10-15 | [15] | P, high |
| Springer+ | $39.99/mo for 10 units; $299 per 6 mo for 120 units; ≤7 units per eBook; 12-hour window | 2024–2026 | [23][25][26] | P, high |
| Springer pay-per-view | $39.95 per article; $29.95 per chapter | 2024-11-29 | [27] | P, med (may have changed) |
| ACM DOIs with CC licenses | ≈66% of 2026 DOIs vs ≈26% of 2024 | 2026-10-15 | [32] | P, high (data); I (interpretation) |
| JSTOR Corporate Collection | 800+ journals; $9,000–$65,000/yr by tier | 2026-10-15 | [21] | P, high |
| UC Berkeley CA-resident card | $100/yr ($95 seniors), no remote e-resources | 2026-10-15 | [58][59] | P, high |
| UC Berkeley Extension student card | $25 for 6 months, **remote e-resources yes** | 2026-10-15 | [58] | P, high |
| UC Berkeley visiting scholar fee | $750 first year; $1,500 second year | 2026-10-15 | [62] | P, high |
| Cal Alumni Association Standard | $75/yr; "open to all" | 2026-10-15 | [63] | P, high |
| Stanford independent researcher access | $35/2 wk; $75/mo; $150/3 mo; $450/yr | 2026-10-15 | [65] | P, high |
| Stanford day passes | 7 per year (14 for alumni per the library; "14 days for SAA members" per SAA) | 2026-10-15 | [65][66] | P, high |
| SFSU Community Borrowers | $50/yr; public stations need no login | 2026-10-15 | [68][69] | P, high |
| LAPL non-resident (outside California) | $50, in person | 2026-10-15 | [42] | P, high |
| LAPL e-card eligibility | LA City residents only | 2026-10-15 | [41][42] | P, high |
| OCLS fee card discontinued | 2026-07-31 | 2026-10-15 | [56] | P, high |
| Link+ | 64 libraries, 11M+ items; Berkeley allows 25 items, 21 days + 1 renewal | 2026-10-15 | [47][51] | P, high |
| SFPL A–Z database headings | 268 | 2026-10-15 | [38] | P, high |
| Spot-check: SFPL + free web, technical | 28/33 (85%) | 2026-10-15 | [2][40] + R01 | P/I, med |
| Spot-check: Bay Libby union, humanities | 16/20 (80%); +LAPL 19/20 | 2026-10-15 | [40] | P, med |
| IA lending | 1-hour loans; some 14-day; 10 books at a time | 2026-10-15 | [35] | P, high |

---

## Surprises and recent changes (2024–2026)

1. **Everand abandoned unlimited reading.** It now has a three-tier unlock model, and the Legacy plan was discontinued (help pages updated September 2026). It also absorbed Fable [P][9][12]. *Before:* Scribd/Everand was the cheapest "all-you-can-read" option. *Now:* $5.66–$11.99 per book.
2. **O'Reilly's agreement (2024-10-09) bans using its content as AI prompts**, not just for training [P][3]. Most readers do not know this. It makes "paste the chapter into Claude" a breach of contract.
3. **O'Reilly has zero MIT Press, Cambridge, Oxford or core-Springer books** [P][2]. Many researchers assume "O'Reilly = all technical books".
4. **Perlego carries MIT Press (~1,000), Cambridge (~15.7k) and Princeton (~9.8k) but almost no O'Reilly or Pearson** [P][8]. The two subscriptions complement each other almost perfectly.
5. **UC Berkeley Extension's $25 six-month card includes remote e-resources** [P][58]. The California-resident card at four times the price ($100) does not.
6. **LAPL closed its instant e-card to non-LA-City residents**, citing vendor licensing [P][42]. For years this was the standard tip for any Californian. *(I could not date the change; it is at most a few years old [U].)*
7. **Orange County Library System (FL), a well-known national fee card with remote databases, stopped issuing fee cards on 2026-07-31** [P][56].
8. **Springer+ exists:** a personal token subscription at $2.49–$3.99 per chapter or article, against $29.95–$39.95 pay-per-view [P][23][27].
9. **About two-thirds of ACM's 2026 output carries a CC license in Crossref, against a quarter in 2024** [P][32]. This is consistent with ACM's announced full-OA transition [I].
10. **JSTOR officially offers public libraries walk-in access only** [P][20]. Yet Bay Area libraries list remote EZproxy links [P][38][46].
11. **Berkeley PL Libby and Kanopy logins need a PIN from 2026-10-15**, the date of this research [P][48]. SFPL's Statista needs card and PIN from 2026-04-01 [P][38].
12. **DeepDyve now costs $59/month** [P][15]. My prior expectation was about $40–$50 [U].
13. **Two Bay Area public libraries (Oakland, Berkeley) offer American Physical Society journals** [P][46][50]. This is a little-known free physics route.
14. **Santa Clara County's Libby shows 334 copies of the *AI Engineering* audiobook**, nearly all available [P][40]. This is evidence of cost-per-circulation-style licensing for some technical audiobooks [I].
15. **Google's *Site Reliability Engineering* 2nd edition (2026) is not free online, unlike the 1st** (per R01) [S]. Free technical books may be closing on new editions.

---

## Contested or uncertain points

1. **Remote JSTOR through public libraries.** SFPL and Berkeley PL show EZproxy links [P]. JSTOR says remote public-library access "is not currently supported" [P]. LAPL marks it in-library only [P]. Possibilities: legacy agreements, IP-restricted EZproxy, or stale web listings. **[~50%]** that an SFPL cardholder can actually use JSTOR from home today.
2. **Is "O'Reilly for Public Libraries" the full O'Reilly catalog?**
   - SFPL's blurb says 50,000+ titles; the sitemap has 66,609 identifiers, and early-release books and live events may be excluded.
   - **[~70%]** that nearly all *books* in the sitemap are readable via library access. I could not log in to check.
3. **Is the O'Reilly sitemap complete?** The sitemap index lists only 24 of at least 27 files, so the index itself is stale. Some catalog titles may lack sitemap entries **[~80%] the sitemap captures ≥90% of book titles**.
4. **Perlego's "restricted" flag** (≈461k items). I infer it marks Complete-tier-only content [I, low-med]. It might instead mark institution-excluded titles.
5. **Perlego counts** differ between facet (approximate) and filter queries by 30–45% (Routledge 221k vs 153k). Use them as orders of magnitude.
6. **Kindle Unlimited price and caps; Kobo Plus availability and prices; IEEE and ACM membership benefits** (including whether ACM membership still bundles O'Reilly access, a well-known route around 2019–2024): **all unverified in 2026** because pages were blocked [U].
7. **National fee cards** (Brooklyn, Philadelphia, Fairfax, Houston) are unverified. Treat older blog lists as stale.
8. **Cal Alumni Association route.** The library says UC *alumni* who are paid association members get a card. CAA membership is "open to all", but the library likely requires alumni status. Whether the card itself is free is not stated [I, med].
9. **UC Berkeley Extension course costs** were not verifiable (JavaScript catalog). The $25 card's value depends on the cheapest qualifying 10+ week course [U].
10. **Used-book prices** are a single-day snapshot. "New" listings at low prices are probably international editions [I].
11. **Libby matching.** Matching was automatic (title substring plus author regex). I hand-checked surprising hits (LAPL MIT Press titles, the Santa Clara audiobooks) [P], but a few false negatives are possible (for example *Gödel, Escher, Bach*, which may simply have no ebook edition) [I].

---

## Implications for someone building tools to explore literature

1. **Build around "where can I legally read this, soonest and cheapest?"** The best answer for most books is a *combination*: free copy, then O'Reilly via library, then Libby across all your cards, then Perlego, then used. No single subscription wins. The data sources:

| Need | Source | Notes |
|---|---|---|
| Free copies | OpenAlex, Unpaywall, Open Library `ebook_access` | Per R02 and R01 |
| O'Reilly presence | O'Reilly's public book sitemap | Diff it weekly |
| Libby availability | OverDrive's undocumented Thunder API | Gives ownedCopies, availableCopies and holdsCount per library. Undocumented and may change; rate-limit politely |
| Perlego presence | Its public search index | Respect its terms; don't redistribute its key |
| Used prices | AbeBooks | HTML scraping is brittle. Prefer affiliate APIs if available [U] |

2. **Separate metadata from content.** Every licensed route above restricts AI processing of *content*:
   - O'Reilly forbids AI input outright.
   - JSTOR forbids LLM training and automated downloading.
   - Elsevier gates AI use behind licenses (R09).
   - Design the tool so Claude sees metadata, tables of contents, your own notes and highlights, and open-licensed text. It should never see paywalled full text from subscription platforms unless a license explicitly permits it. A "license firewall" layer is a core component, not a nicety.
3. **Model time, not just cost.** Holds queues are the real price of free library ebooks: 51 holds on 13 copies means weeks. Combine Libby's numbers with loan length and auto-renew rules to forecast wait times. A forecasting-minded user will appreciate calibrated estimates.
4. **Exploit walk-in access with batching.** SFSU's public stations allow USB downloads and Berkeley's public computers reach licensed databases. A tool that prepares a "visit list" (DOIs, search strings, chapter targets) turns a library trip into an efficient, license-respecting session. It must avoid anything that looks like systematic downloading.
5. **Track the decay of access routes.** E-card restrictions, fee-card closures, login changes and new editions closing free copies are moving quickly (2024–2026). An "access route registry" with last-verified dates (this dossier is a seed) is more valuable than any static list.
6. **Personal-use limits are real constraints for team tools.** Springer+, O'Reilly Individual, Perlego and Everand are personal licenses. A shared team tool cannot pool them. Employer licenses (O'Reilly Teams/Enterprise, JSTOR Corporate) are the legitimate team path, and even those exclude AI processing unless negotiated.

---

## Ideas sparked

1. **"Read-Route" resolver (CLI plus browser button).**
   - Input: an ISBN, DOI or title.
   - It queries free sources, the O'Reilly sitemap cache, Libby at each of *your* libraries, Perlego (US rights), IA borrowability and AbeBooks.
   - Output: a ranked list such as "Read now: O'Reilly via SFPL" / "Free PDF (personal use)" / "Libby SJPL, 0 holds" / "Used $16.25, 3–5 days".
   - It includes a calibrated ETA for each route.
2. **Card-stack optimizer.**
   - Given a reading list, solve the set-cover problem: which library cards (SFPL, OPL, BPL, SJPL, SCCLD, PLS, LAPL) and which month-long subscription bursts maximize coverage per dollar and per in-person visit.
   - Example output: "Get SCCLD and LAPL cards; one month of Perlego Complete covers the remaining 4 Routledge titles."
3. **Holds-queue forecaster.**
   - Poll Thunder daily for owned, available and holds counts. Fit a simple queueing model using 14- or 21-day loans and auto-renew rates.
   - Publish "P(available within 7 days)" per title per library, and score yourself with Brier scores against actual pickup dates.
4. **Subscription pulse planner.** Batch reading into short bursts:
   - one Perlego month for a humanities project;
   - one Springer+ Basic month to grab 10 chapters (12-hour download windows, so pre-queue them);
   - JPASS for a year of JSTOR-heavy work.
   - A calendar view shows unlock and unit expiries (Everand 6 months; Springer+ end of period).
5. **License firewall for LLM reading assistants.**
   - Every text chunk carries a provenance tag: open (CC BY), gratis-personal, O'Reilly, JSTOR, Libby, and so on.
   - The assistant may summarize only chunks whose license permits it. For licensed sources it works from your own notes, tables of contents and public metadata, and says so in the UI.
   - Include a "why can't Claude read this?" explainer that quotes the clause.
6. **Walk-in session kit.**
   - Before a trip to SFSU, Berkeley or Stanford, generate a printable or phone-friendly list of paywalled items: DOIs, exact database paths, and the institution's link resolver patterns.
   - Afterwards, a USB-import tool files the PDFs into Zotero with "obtained on-site, personal use" provenance.
7. **Publisher-coverage map.**
   - A treemap of ISBN registrant prefixes across O'Reilly, Perlego and Libby holdings, showing gaps at a glance (O'Reilly has no MIT, CUP or OUP; Perlego has no O'Reilly or Pearson).
   - Hovering a gap shows the cheapest alternative route.
8. **Edition-aware used-book watcher.** Track AbeBooks price floors for specific ISBNs, alert on drops below a threshold, and suggest older editions when content differences are minor (CLRS 3e $16 vs 4e $70).
9. **Syllabus coverage heatmap.** Paste a course syllabus (or pull one from Open Syllabus). Each reading is colored by best legal route and cost, with a "total cost to complete this course legally" figure.
10. **Access-route registry with change detection.** A small database of every route in this dossier (eligibility, price, remote yes/no, last-verified date, source URL), re-verified by a scheduled agent that diffs pages. Changes such as "LAPL e-card now city-only" or "OCLS fee cards ended" go to a changelog page on the wiki.
11. **"Springer+ unit optimizer".** For a list of Springer or Palgrave books and chapters, compute whether buying whole books (≤7 units each) or individual chapters is cheaper. Batch the downloads inside the 12-hour windows.

---

## Sources

All accessed 2026-10-15 unless noted. "Updated" dates are the page's own.

1. O'Reilly, "Plans and pricing" — https://www.oreilly.com/pricing/ — 2026-10-15
2. O'Reilly, book sitemap index and pages (`epubs-books-p1.xml` … `p27.xml`) — https://www.oreilly.com/book-sitemap.xml — lastmod 2024–2026
3. O'Reilly, "Membership Agreement" — https://www.oreilly.com/membership-agreement/ — last updated 2024-10-09
4. O'Reilly, "Terms of Service" — https://www.oreilly.com/terms/ — last updated 2019-12-19 **(stale?)**
5. Perlego, "Pricing" — https://www.perlego.com/pricing/ — 2026-10-15
6. Perlego, homepage — https://www.perlego.com/ — 2026-10-15
7. Perlego, public plans endpoint used by the pricing page — https://api.perlego.com/payment/v1/plans — 2026-10-15
8. Perlego, public catalog search index (Algolia `prod_BOOKS`, configured in the page source of https://www.perlego.com/pricing/) — queried 2026-10-15
9. Everand Help, "Everand plans: Standard, Plus, and Deluxe" — https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe — updated 2026-09-27
10. Everand Help, "How unlocks work on Everand" — https://support.scribd.com/hc/en-us/articles/40677287041684-How-unlocks-work-on-Everand — updated 2026-09-22
11. Everand Help, "Which books require an unlock?" — https://support.scribd.com/hc/en-us/articles/47040289862420-Which-books-require-an-unlock — updated 2026-08-17
12. Everand Help, "Everand & Fable: What You Need to Know" — https://support.scribd.com/hc/en-us/articles/38205474518164-Everand-Fable-What-You-Need-to-Know — updated 2026-05-21
13. Everand Help, "About your free trial on Everand" — https://support.scribd.com/hc/en-us/articles/46956976809236-About-your-free-trial-on-Everand — updated 2026-09-01
14. Amazon, Kindle Unlimited landing page — https://www.amazon.com/kindle-dbs/hz/subscribe/ku — 2026-10-15
15. DeepDyve, "Pricing" — https://www.deepdyve.com/pricing — 2026-10-15
16. DeepDyve, homepage — https://www.deepdyve.com/ — © 2026
17. JSTOR, "JPASS" — https://about.jstor.org/products/jpass/ — 2026-10-15
18. JSTOR, "Open and free content" — https://about.jstor.org/oa-and-free/ — 2026-10-15
19. JSTOR, "What's in JSTOR" — https://about.jstor.org/whats-in-jstor/ — 2026-10-15
20. JSTOR, "Fees for public libraries" — https://about.jstor.org/products/fees/public-libraries/ — 2026-10-15
21. JSTOR, "Fees for corporate and for-profit research institutions" — https://about.jstor.org/products/fees/corporate-and-for-profit/ — 2026-10-15
22. JSTOR, "Terms and Conditions of Use" — https://about.jstor.org/terms/ — last updated 2026-04-24
23. Springer Nature Link, "Springer+" product page — https://link.springer.com/product/springer-plus — 2026-10-15
24. Springer Nature Support, "What is Springer+?" — https://support.springernature.com/en/support/solutions/articles/6000273908-what-is-springer- — modified 2025-12-09
25. Springer Nature Support, "What is a unit?" — https://support.springernature.com/en/support/solutions/articles/6000273891-what-is-a-unit- — modified 2024-09-04
26. Springer Nature Support, "How long do I have access to the content…" — https://support.springernature.com/en/support/solutions/articles/6000273890-how-long-do-i-have-access-to-the-content-and-what-can-i-do-to-ensure-unlimited-access- — modified 2024-09-09
27. Springer Nature Support, "Springer Nature Products" (chapter and article prices; MyCopy) — https://support.springernature.com/en/support/solutions/articles/6000230449-springer-nature-products — modified 2024-11-29
28. Springer Nature, "Text and data mining" — https://www.springernature.com/gp/researchers/text-and-data-mining — 2026-10-15
29. Elsevier, "Text and data mining" policy — https://www.elsevier.com/about/policies-and-standards/text-and-data-mining — 2026-10-15
30. Cambridge Core Help, "How can I access content as an individual?" — https://corehelp.cambridge.org/hc/en-gb/articles/17013970242962-How-can-I-access-content-as-an-individual — updated 2026-04-23
31. Cambridge Core Help, "Can I purchase or rent individual access to a book chapter?" — https://corehelp.cambridge.org/hc/en-gb/articles/17013941015314-Can-I-purchase-or-rent-individual-access-to-a-book-chapter — updated 2025-09-10
32. Crossref REST API, ACM (member 320) works with license facets — https://api.crossref.org/members/320/works?filter=from-pub-date:2026-01-01&rows=0&facet=license:10 (also 2024 and 1990s ranges) — 2026-10-15
33. AbeBooks, ISBN search sorted by price plus shipping (example) — https://www.abebooks.com/servlet/SearchResults?isbn=9780387310732&sortby=17 (same pattern for 17 ISBNs) — 2026-10-15
34. ThriftBooks, ISBN search (example) — https://www.thriftbooks.com/browse/?b.search=9780262035613 — 2026-10-15
35. Internet Archive Help, "Borrowing From The Lending Library" — https://help.archive.org/help/borrowing-from-the-lending-library/ — 2026-10-15
36. Internet Archive Blog, "End of Hachette v. Internet Archive" — https://blog.archive.org/2024/12/04/end-of-hachette-v-internet-archive/ — 2024-12-04
37. SFPL, "Get Your Free Library Card" — https://sfpl.org/welcome-new-cardholders — 2026-10-15
38. SFPL, "Articles & Databases" (A–Z, 23 pages) — https://sfpl.org/articles-databases — 2026-10-15
39. SFPL FAQ, renewals including LINK+ and ILL — https://sfpl.libanswers.com/faq/85266 — updated 2026-04-02
40. OverDrive Thunder catalog API (Libby back end), e.g. — https://thunder.api.overdrive.com/v2/libraries/sfpl/media?query=designing%20data-intensive%20applications (same pattern for `oakland`, `berkeleypubliclibrary`, `sanjose`, `santaclara`, `pls`, `lapl`, `nypl`, `brooklyn`) — 2026-10-15
41. LAPL, "Get a Library Card" — https://lapl.org/library-card — 2026-10-15
42. LAPL, "Borrowing Policies and Information" — https://lapl.org/library-card/borrowing-policies-and-information — 2026-10-15
43. LAPL, "Digital Library: View All Resources" — https://lapl.org/digital-library/search — 2026-10-15
44. LAPL, "Research" databases — https://lapl.org/digital-library/research — 2026-10-15
45. Berkeley PL, "Your Card" — https://www.berkeleypubliclibrary.org/library/your-card — 2026-10-15
46. Berkeley PL, "Alphabetical List of Online Resources" — https://www.berkeleypubliclibrary.org/explore/elibrary/alphabetical-list — 2026-10-15
47. Berkeley PL, "Link+" — https://www.berkeleypubliclibrary.org/explore/linkplus — 2026-10-15
48. Berkeley PL, homepage (Libby/Kanopy PIN notice) — https://www.berkeleypubliclibrary.org/ — 2026-10-15
49. Oakland PL, "Get a Library Card" — https://oaklandlibrary.org/get-a-library-card/ — 2026-10-15
50. Oakland PL, "A-Z Online Resources" — https://oaklandlibrary.org/resource/ — 2026-10-15
51. Oakland PL, "Borrow From Another Library (Link+ & ILL)" — https://oaklandlibrary.org/borrow-from-another-library/ — 2026-10-15
52. San José PL, "Membership" — https://www.sjpl.org/membership/ — 2026-10-15
53. San José PL, "eResources" — https://www.sjpl.org/eresources/ — 2026-10-15
54. Santa Clara County Library District, "Library Card" — https://sccld.org/card/ — 2026-10-15
55. Santa Clara County Library District, "Online Library" and "Research" — https://sccld.org/online-library/ ; https://sccld.org/research — 2026-10-15
56. Orange County Library System, "What Are The Types of Cards?" — https://ocls.org/using-library/types-cards/what-are-types-cards/ — 2026-10-15
57. San Antonio PL, "Library Cards" guide — https://guides.mysapl.org/librarycards — 2026-10-15
58. UC Berkeley Library, "Borrow & renew" (library cards for non-UC Berkeley patrons) — https://www.lib.berkeley.edu/find/borrow-renew — 2026-10-15
59. UC Berkeley Library, "Information for visitors" — https://www.lib.berkeley.edu/help/visitors — 2026-10-15
60. UC Berkeley Library, "Information for alumni" — https://www.lib.berkeley.edu/help/alumni — 2026-10-15
61. UC Berkeley Library, "Information for visiting scholars" — https://www.lib.berkeley.edu/help/visiting-scholars — 2026-10-15
62. UC Berkeley VSPA, "University Services Fee" — https://vspa.berkeley.edu/about/university-services-fee — 2026-10-15
63. Cal Alumni Association, "Join" — https://alumni.berkeley.edu/join/ — 2026-10-15
64. Cal Alumni Association, "Member Benefits" — https://alumni.berkeley.edu/join/alumni-member-benefits/ — 2026-10-15
65. Stanford Libraries, "Visitor access" — https://library.stanford.edu/about-stanford-libraries/visitor-access — 2026-10-15
66. Stanford Alumni Association, "Perks for All Alumni" — https://alumni.stanford.edu/perks/ — 2026-10-15
67. Stanford Alumni Association, "Membership" — https://alumni.stanford.edu/membership/ — 2026-10-15
68. SF State J. Paul Leonard Library, "Library Accounts & Cards" — https://library.sfsu.edu/accounts — 2026-10-15
69. SF State J. Paul Leonard Library, "Community Borrowers" — https://library.sfsu.edu/community-borrowers — 2026-10-15
70. Houston PL, "Policies & Fees" — https://houstonlibrary.org/policies-fees — 2026-10-15

**Sibling dossiers cited:**
- R01: free legal copies, CDL and *Hachette* details.
- R02: OA share, JPASS cross-check.
- R09: license terms and TDM law.
- R11: devices; Libby on e-ink.
