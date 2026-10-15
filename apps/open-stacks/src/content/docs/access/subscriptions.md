---
title: Cheap Subscriptions
description: What an individual can buy without an institution as of October 2026 (O'Reilly, Perlego, Everand, Kindle Unlimited, Kobo Plus, Springer+, JPASS, DeepDyve and used books), with catalog composition, a 53-title coverage spot-check, the AI-use clauses that bind tool builders, which subscription (if any) suits which reader, and a one-hour test against your own reading list.
---

*Status: draft, October 2026. Prices, catalog sizes and product statuses are as of 2026-10-15 unless another date is given. On that date the O'Reilly sitemap count (66,609 title URLs) and the 14 O'Reilly hits in the spot-check were reproduced, and the O'Reilly, Perlego, Everand, Springer+, JPASS, JSTOR, DeepDyve, Kobo and Cambridge pages were re-checked. Unverified, and flagged where they come up: Kindle Unlimited's price and borrowing cap (amazon.com returned 503), Kobo Plus's US price, Everand's coverage of technical books, and the AI-use terms of Perlego, Everand, Kindle Unlimited, Kobo Plus and DeepDyve. The coverage spot-check uses small, hand-picked samples (33 technical and 20 humanities titles). Sources: the [R03 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R03-paid-and-institutional-access.md) and primary sources linked inline.*

This chapter covers what an individual can buy without an institution: book subscriptions, pay-per-item routes for papers and chapters, and used books. The useful question is not catalog size but how many books on *your* list a subscription adds beyond legal free copies and a library card. In the spot-check below, the answer for most subscriptions is "few". Libraries and institutional routes have their own chapters ([Public Libraries](/access/public-libraries/), [University and Employer Access](/access/academic-and-employer/)); this one states the free baseline wherever it changes the decision.

## The short version

- **Get a library card before you pay for anything.** SFPL, Oakland, Berkeley, San José and Santa Clara County all license O'Reilly's platform for cardholders (October 2026). In a 33-title technical spot-check, **one SFPL card (Libby plus O'Reilly) plus legal free copies covered 28 titles (85%)**. Any subscription has to beat that baseline, and most don't.
- **O'Reilly (\$499/year) is a library for practitioners, not theorists.** Its public sitemap lists 66,609 titles, led by Wiley (about 9,200), O'Reilly itself (about 9,000), Pearson (about 6,200), Packt (at most 6,400) and Apress (about 4,000). It has **zero titles from MIT Press, Cambridge, Oxford or core Springer**. It covered 14 of 33 technical titles and 0 of 20 humanities titles.
- **Perlego (\$199/year for Complete) is the humanities and social-science subscription.** About 1.52M of its items carry US rights. Routledge has about 153,000, Cambridge 15,700, Princeton 9,800 and MIT Press 1,000. O'Reilly has only 33 and Pearson none. Perlego covered 8 of 20 humanities titles and 5 of 33 technical ones, and all 5 were already available from O'Reilly or a free copy.
- **O'Reilly and Perlego split the publishers between them, and neither has been shown to permit AI use.** O'Reilly's membership agreement forbids using its content "as input or a prompt to a machine learning or AI system". On a plain reading, pasting a chapter into Claude breaches it [not legal advice]. Perlego's terms could not be found.
- **The trade-book subscriptions have changed.** Everand no longer offers unlimited reading to new subscribers: \$11.99–\$28.99 a month buys 1–5 "unlocks", or \$5.66–\$11.99 per book. Kindle Unlimited claims "over 5 million digital titles", which I infer are mostly self-published [~80%]. Libraries already cover popular nonfiction: SFPL's Libby had 7 of the 8 such titles in the sample.
- **For papers and chapters, pay per item.** JPASS gives 120 JSTOR PDFs a year for \$199 (\$1.66 each). Springer+ costs \$2.49–\$3.99 per Springer chapter or article, against \$29.95–\$39.95 pay-per-view. DeepDyve streams 35M+ paywalled papers for \$499 a year.
- **Used books close the gap that remains.** For 17 ISBNs (16 books) from the technical list, the cheapest AbeBooks listings ran from \$8.23 to \$77.74, median \$38.19. An older edition can be much cheaper: CLRS 3rd edition was \$16.25, the 4th \$70.43.
- **If you buy one subscription,** buy none if a library gives you O'Reilly. Otherwise buy O'Reilly in monthly bursts for practitioner ML and systems books, Perlego Complete for work heavy in humanities or social-science monographs, or JPASS for papers in the JSTOR backfile. Run the [one-hour test](#test-coverage-against-your-own-list-in-an-hour) on your own list before paying.

## The options at a glance

US prices as of 2026-10-15. "Spot-check" counts titles found in the 33-title technical set and the 20-title humanities set described [below](#what-the-spot-check-found).

| Option | What you get | Cost (Oct 2026) | Catalog | Spot-check (tech / hum) | Catch | Source |
|---|---|---|---|---|---|---|
| **O'Reilly Individual** | Books, video and live events from O'Reilly and "nearly 200 providers" | \$49/month; \$129 per 3 months; \$499/year. A free trial is offered; its length is not stated on the pricing page | 66,609 title URLs in the public book sitemap | 14/33 · 0/20 | No MIT Press, Cambridge, Oxford or core Springer. Personal use only. AI input banned. Quotes capped at 250 words | [pricing](https://www.oreilly.com/pricing/), [sitemap](https://www.oreilly.com/book-sitemap.xml), [agreement](https://www.oreilly.com/membership-agreement/) |
| **O'Reilly via a public library** | The same platform. SFPL describes it as "50,000+ business and technology titles, 30,000+ hours of video" | \$0 with a card | Probably close to the full book catalog [~70%] | Same as above [inferred] | Most cards need one in-person visit. LAPL does not offer it | [SFPL databases](https://sfpl.org/articles-databases) |
| **Perlego Essential** | "800,000+ trusted titles and best-sellers" | \$15/month; \$45 per 4 months; \$125/year. A test variant charges \$12/month | A subset of Complete | Not tested separately | Some technical titles are flagged "restricted", probably Complete-only [low–medium confidence] | [pricing](https://www.perlego.com/pricing/) |
| **Perlego Complete** | "1.5M+ books" | \$27/month; \$79 per 4 months; \$199/year. Test variants run \$22–\$38/month | 1,584,988 items indexed, 1,521,208 with US rights | 5/33 · 8/20 | Sales rights: some indexed titles cannot be read in the US. The price you see may be a test variant | [pricing](https://www.perlego.com/pricing/) |
| **Everand Standard / Plus / Deluxe** | Ebooks and audiobooks: 1, 3 or 5 unlocks a month, plus a rotating "unlimited" subset | \$11.99 / \$16.99 / \$28.99 a month | 1.5M+ | Not testable (bot challenge) | "Most" titles need an unlock. Unused unlocks expire after 6 months. The Legacy unlimited plan is closed to new sign-ups | [plans](https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe) |
| **Kindle Unlimited** | Borrowing from the KU catalog | About \$11.99/month [unverified] | "Over 5 million digital titles" | Not tested | Kindle device or app. Mostly self-published titles [inferred, ~80%]. Borrowing cap unverified | [Amazon](https://www.amazon.com/kindle-dbs/hz/subscribe/ku) |
| **Kobo Plus (US)** | Ebook subscription | Not verified; Kobo says the price depends "on where you live" | "Hundreds of thousands of eBooks" | Not tested | Kobo e-reader or app. 14-day US trial | [Kobo help](https://help.kobo.com/hc/en-us/articles/360018976153-Kobo-Plus-Common-questions) |
| **Springer+ Basic** | 10 units a month. One unit buys one chapter or article; a whole ebook costs at most 7 units | \$39.99/month before VAT (\$3.99 per unit) | "Chapters and articles from 300k books and 2,500 journals" (Springer, Apress, Palgrave) | n/a | A 12-hour window to download each item. Unused units expire. Personal use only | [Springer+](https://link.springer.com/product/springer-plus) |
| **Springer+ Standard** | 120 units per 6 months | \$299 per 6 months (\$2.49 per unit) | Same | n/a | Same | [Springer+](https://link.springer.com/product/springer-plus) |
| Springer pay-per-view | One PDF | \$39.95 per article; \$29.95 per chapter (page modified 2024-11-29) | All Springer Nature content | n/a | 7.5–16 times the Springer+ unit price | [Springer Nature](https://support.springernature.com/en/support/solutions/articles/6000230449-springer-nature-products) |
| Cambridge Core | Buy an article or a whole ebook | Per item; prices not published | n/a | n/a | "Chapter purchase or rental is not available" | [Cambridge help](https://corehelp.cambridge.org/hc/en-gb/articles/17013941015314-Can-I-purchase-or-rent-individual-access-to-a-book-chapter) |
| JSTOR free account | Online reading | \$0 | "Up to 10 free articles every 30 days" | n/a | Online only | [JSTOR](https://about.jstor.org/oa-and-free/) |
| **JPASS** | Unlimited online reading plus PDF downloads | \$19.50/month (10 PDFs); \$199/year (120 PDFs) | 2,400+ journals (the same page also says 2,000+) | n/a | Download cap. Bulk downloading and LLM training banned | [JPASS](https://about.jstor.org/products/jpass/) |
| **DeepDyve Personal** | Streaming access to paywalled papers | \$59/month or \$499/year; first month \$0 | "35M+ full-text streaming papers" | n/a | Streaming only. Printing capped at 40 pages a month. PDFs are bought separately "with no markup" | [DeepDyve](https://www.deepdyve.com/pricing) |
| **AbeBooks (used)** | A copy you own | \$8.23–\$77.74 for 17 ISBNs from the technical list, shipping included; median \$38.19 | n/a | Covers every gap left in the sample | Shipping time. Prices are a one-day snapshot | [AbeBooks](https://www.abebooks.com/servlet/SearchResults?isbn=9780387310732&sortby=17) |
| ThriftBooks (used) | Same | Work-level "from" prices that mix editions | n/a | n/a | Higher than AbeBooks for all three books checked | [ThriftBooks](https://www.thriftbooks.com/browse/?b.search=9780262035613) |

What one item costs on each route:

| Route | Unit | Price per unit (Oct 2026) |
|---|---|---|
| JPASS annual / monthly | One JSTOR PDF | \$1.66 / \$1.95 |
| Springer+ Standard / Basic | One Springer chapter or article | \$2.49 / \$3.99 |
| Springer+ Standard / Basic | One whole Springer ebook (at most 7 units) | at most \$17.43 / \$27.93 |
| Everand Plus or Deluxe / Standard | One unlocked book, rented while you subscribe | \$5.66–\$5.80 / \$11.99 |
| Springer pay-per-view | One chapter / one article | \$29.95 / \$39.95 |
| AbeBooks, cheapest copy | One owned technical book | median \$38.19 (n = 17) |
| O'Reilly Individual, annual | One book read | \$499 divided by books read; \$38 if you read 13 |

## What the spot-check found

### Method and limits

The dossier's author checked two hand-picked lists on 2026-10-15. The first has 33 well-known technical books in ML, statistics, CS, forecasting and AI. The second has 20 humanities and social-science books. Each title was checked against:

- O'Reilly's public book sitemap;
- Perlego's public search index, counting a title only if its sales rights include the US;
- Libby at seven library systems, through OverDrive's catalog API: SFPL, Oakland, Berkeley, San José, Santa Clara County, the Peninsula Library System and LAPL;
- legal free copies (from the [Open-Access Books](/access/open-books/) research);
- AbeBooks prices.

The O'Reilly column was re-run by title match against the sitemap on 2026-10-15 and reproduced all 14 hits.

Read the results as coarse. The books are famous, which favors libraries. The results come from one day, without a logged-in account on O'Reilly or Perlego. And the samples are small: a 42% hit rate on 33 titles has a 95% Wilson interval of about 27–59% before any selection bias.

### Technical set, title by title

"Libby" gives the best library route: SFPL; another Bay Area system ("Bay"); or LAPL only. "R" means flagged "restricted" in Perlego. The free copies for rows 3 and 9 are the dossier's inference (high confidence); the rest were verified in the Open-Access Books research.

| # | Book (publisher) | Free legal copy | O'Reilly | Perlego (US) | Libby | Cheapest used |
|---|---|---|---|---|---|---|
| 1 | Kleppmann, *Designing Data-Intensive Applications* (O'Reilly) | – | Y | – | SFPL | \$44.54 |
| 2 | Géron, *Hands-On Machine Learning* (O'Reilly) | – | Y | – | Bay | \$32.74 |
| 3 | McKinney, *Python for Data Analysis* 3e (O'Reilly) | Y (author site) | Y | – | SFPL | – |
| 4 | Huyen, *Designing Machine Learning Systems* (O'Reilly) | – | Y | – | Bay | – |
| 5 | Huyen, *AI Engineering* (O'Reilly) | – | Y | – | Bay | – |
| 6 | Beyer et al., *Site Reliability Engineering* (O'Reilly) | Y (1st ed. only) | Y | – | SFPL | – |
| 7 | Chollet, *Deep Learning with Python* (Manning) | – | Y | Y | LAPL only | – |
| 8 | Raschka, *Build a Large Language Model (From Scratch)* (Manning) | – (code only) | Y | – | Bay | – |
| 9 | Klabnik & Nichols, *The Rust Programming Language* (No Starch) | Y | Y | – | Bay | – |
| 10 | Thomas & Hunt, *The Pragmatic Programmer* (Addison-Wesley) | – | Y | – | Bay | – |
| 11 | Martin, *Clean Code* (Pearson) | – | Y | – | LAPL only | – |
| 12 | Cormen et al., *Introduction to Algorithms* (MIT) | – | – | – | LAPL only | \$16.25 (3e); \$70.43 (4e) |
| 13 | Goodfellow et al., *Deep Learning* (MIT) | Y (HTML) | – | Y | LAPL only | \$35.99 |
| 14 | Sutton & Barto, *Reinforcement Learning* (MIT) | Y | – | – | LAPL only | \$77.74 |
| 15 | Russell & Norvig, *AIMA* 4e (Pearson) | – | – | – | – | \$33.15 "new" (probably an international edition); \$127.80 used |
| 16 | Bryant & O'Hallaron, *CS:APP* 3e (Pearson) | – | – | – | – | \$31.54 new; \$93.00 used |
| 17 | Abelson & Sussman, *SICP* (MIT) | Y (CC BY-SA) | – | – | Bay | \$34.61 |
| 18 | McElreath, *Statistical Rethinking* 2e (CRC) | – | Y | Y (R) | – | \$68.75 |
| 19 | Gelman et al., *Bayesian Data Analysis* 3e (CRC) | Y (non-commercial PDF) | Y | Y (R) | – | \$54.39 |
| 20 | Bishop, *Pattern Recognition and ML* (Springer) | Y | – | – | – | \$38.19 |
| 21 | Hastie et al., *Elements of Statistical Learning* (Springer) | Y [~90%] | – | – | – | \$42.14 |
| 22 | Deisenroth et al., *Mathematics for ML* (CUP) | Y | – | – | – | – |
| 23 | MacKay, *Information Theory, Inference…* (CUP) | Y (on-screen) | – | – | – | \$56.21 |
| 24 | Jaynes, *Probability Theory* (CUP) | Partial (ch. 1–3) | – | – | – | \$69.99 |
| 25 | Hubbard, *How to Measure Anything* (Wiley) | – | Y | Y (R) | Bay (SFPL: audio only) | – |
| 26 | Tetlock & Gardner, *Superforecasting* (Crown) | – | – | – | SFPL | \$9.38 |
| 27 | Kahneman, *Thinking, Fast and Slow* (FSG) | Internet Archive loan only | – | – | SFPL (13 copies, 51 holds) | – |
| 28 | Pearl & Mackenzie, *The Book of Why* (Basic) | – | – | – | SFPL | – |
| 29 | Hofstadter, *Gödel, Escher, Bach* (Basic) | – | – | – | – | \$8.23 |
| 30 | Christian, *The Alignment Problem* (Norton) | – | – | – (UK rights only) | SFPL | – |
| 31 | Ord, *The Precipice* (Hachette) | – | – | – | SFPL | – |
| 32 | Russell, *Human Compatible* (Viking) | – | – (German ed. only) | – | SFPL | – |
| 33 | Silver, *The Signal and the Noise* (Penguin) | – | – | – | SFPL | – |

The table splits into three blocks, and each block has a different best route:

- **Practitioner books** (rows 1–11 and 25: O'Reilly, Manning, No Starch, Pearson's professional lines, Wiley) are O'Reilly's territory: 12 of 12.
- **Academic textbooks** (rows 12–24: MIT Press, Cambridge, Springer, CRC, Pearson's higher-education lines) are covered by O'Reilly in 2 of 13 cases (the two CRC books) and by Perlego in 3. Free author copies cover 8, plus a partial Jaynes. Used copies cover the rest.
- **Trade nonfiction** (rows 26–33) is library territory. SFPL's Libby had 7 of 8. O'Reilly had none, and Perlego had none with US rights.

### Technical set: what each route adds

| Route | Titles (n = 33) | Share | Adds beyond free copies | Adds beyond an SFPL card plus free copies |
|---|---|---|---|---|
| Legal free copies | 11, plus 1 partial | 33% | n/a | n/a |
| O'Reilly | 14 | 42% | +10 (to 21, 64%) | 0, if the library edition carries the same books [~70%] |
| Perlego, US rights | 5 | 15% | +3 (Chollet, McElreath, Hubbard) | 0 |
| SFPL Libby | 10 | 30% | +8 | n/a |
| **SFPL card (Libby + O'Reilly) + free copies** | **28** | **85%** | n/a | n/a |
| + five other Bay Area Libby collections | 28 | 85% | n/a | 0 (their extra titles are all on O'Reilly or free) |
| + LAPL Libby | 29 | 88% | n/a | +1 (CLRS) |
| Remainder | 4: AIMA, CS:APP, *GEB*, the full Jaynes | n/a | n/a | Cheapest listings \$8.23–\$69.99. AIMA's \$33.15 is probably an international edition; its cheapest used copy is \$127.80 |

### Humanities and social-science set

The 20 titles: Kuhn, *Structure*; Parfit, *Reasons and Persons*; Scott, *Seeing Like a State*; Diamond, *Guns, Germs, and Steel*; Polanyi, *The Great Transformation*; Anderson, *Imagined Communities*; Rawls, *A Theory of Justice*; Gordon, *The Rise and Fall of American Growth*; Arendt, *The Origins of Totalitarianism*; Meadows, *Thinking in Systems*; Simler & Hanson, *The Elephant in the Brain*; Galef, *The Scout Mindset*; Foucault, *Discipline and Punish*; Weber, *The Protestant Ethic*; Said, *Orientalism*; Henrich, *The Secret of Our Success*; MacAskill, *What We Owe the Future*; Mokyr, *A Culture of Growth*; Hacking, *The Emergence of Probability*; Popper, *The Logic of Scientific Discovery*.

| Route | Titles (n = 20) | Notes |
|---|---|---|
| O'Reilly | **0** | As expected from its publisher mix |
| Perlego, US rights | **8** | Kuhn (Chicago), Scott (Yale), Gordon, Henrich and Mokyr (Princeton), Arendt (Mariner), Weber and Popper (Routledge). Anderson (Verso) and MacAskill (Oneworld) are indexed but without US rights |
| SFPL Libby | 10 | Holds on popular titles. *Thinking in Systems*: 26 copies, 14 holds |
| Six Bay Area Libby collections | 16 | |
| + LAPL | 19 | Only Hacking's *The Emergence of Probability* was missing everywhere |
| Six Bay Area collections + Perlego | 18 | Perlego adds 2 titles beyond six free cards |

Two readings pull in different directions. On famous books, six free library cards beat Perlego (16 against 8), and Perlego adds only 2 titles on top of them. But famous books are exactly where libraries are strongest. Perlego's depth is in the long tail of academic monographs (153,000 Routledge titles), which public-library ebook collections probably carry far less of [inferred]. For a reader of specialist monographs I expect Perlego's marginal value to be much higher than this sample shows [~70%; untested]. Test it on your own list.

## O'Reilly

### Price and plans

The Individual plan costs **\$49 a month, \$129 for three months or \$499 a year**. Teams costs \$499 per member per year for 2–25 seats and adds cloud labs and admin tools. Enterprise pricing is quoted on request ([O'Reilly pricing](https://www.oreilly.com/pricing/), checked 2026-10-15). The page advertises the annual plan as saving 15% over monthly, but the 3-month plan already costs \$43 a month. Eleven months bought as three quarters plus two months cost \$485, less than the \$499 annual plan. **Buy annual only if you will use all 12 months**; otherwise buy quarters or single months.

### What is in the catalog

O'Reilly's `robots.txt` points to a public book sitemap. The sitemap index names 24 files, but files up to p27 exist. Together they hold **66,609 title URLs** (dossier count, reproduced for this chapter on 2026-10-15). Most identifiers are ISBNs, usually of the e-book edition, so the registrant prefix identifies the publisher. The counts below use the dossier's prefix-to-publisher mapping, with the corrections from its verification pass:

| Publisher (ISBN prefixes) | Titles in the sitemap, Oct 2026 |
|---|---|
| Wiley | about 9,200 |
| O'Reilly Media (includes No Starch titles issued with O'Reilly e-ISBNs, and about 2,900 translations) | about 9,000 |
| Pearson / Addison-Wesley / Prentice Hall | about 6,200 |
| Packt | at most 6,443 across its prefix range, which also holds other UK publishers; about 4,700 in identifiable Packt blocks |
| Apress | about 4,000 |
| CRC / Taylor & Francis | about 3,100 |
| Elsevier / Academic Press / Morgan Kaufmann | about 1,700 |
| De Gruyter | about 1,500 |
| McGraw-Hill | about 1,200 |
| Manning | about 1,100 |
| Harvard Business Review Press / Microsoft Press / Pragmatic Bookshelf | about 620 / 520 / 380 |
| Big-5 trade houses (PRH, HarperCollins, S&S, Hachette) | about 62 |
| **MIT Press, Cambridge UP, Oxford UP, core Springer** | **0** (prefixes re-checked 2026-10-15; Apress, a Springer Nature imprint, is present) |
| Princeton, Yale, Chicago, Harvard UP | 0 |

The gap is structural: no O'Reilly subscription gets you CLRS, Goodfellow, Sutton & Barto, Bishop, ESL, MacKay or Jaynes. Two caveats apply. The sitemap is not guaranteed to match the subscribable catalog; the dossier puts [~80%] on it capturing at least 90% of book titles. About 4,000 identifiers are German, Japanese, Spanish, French or Italian editions, some of them translations of English titles. *Human Compatible*, for example, appears only in German.

### The library edition

SFPL's listing describes "O'Reilly for Public Libraries" as "50,000+ business and technology titles, 30,000+ hours of video" ([SFPL](https://sfpl.org/articles-databases)). The sitemap has 66,609 titles. The difference may be early-release books and translations, or a rounded, stale blurb [inferred]. I put [~70%] on nearly all *books* in the sitemap being readable through library access; no one has logged in to check. Oakland, Berkeley, San José and Santa Clara County also carry it; LAPL does not ([Public Libraries](/access/public-libraries/) covers card eligibility). Pay for the Individual plan only if no library near you carries O'Reilly, or if you need early-release titles and live events, which the library edition may not include [inferred].

### The membership agreement and AI

O'Reilly's [membership agreement](https://www.oreilly.com/membership-agreement/) (last updated 2024-10-09) says:

- Content is "provided for your personal use only", and "sharing … accounts is prohibited".
- "Any use of 'Web spiders,' or any other automated retrieval mechanisms … is strictly prohibited."
- Content may not be extracted "to develop any software program, including … training a machine learning or artificial intelligence ('AI') system".
- Content "may not be stored, reproduced, or transmitted in any form … including … as input or a prompt to a machine learning or AI system" without the copyright owner's written permission.
- Quotations are capped at 250 words.

The plain reading is that pasting an O'Reilly chapter into Claude, or pointing an agent at your logged-in session, breaches the contract. The clause has no exception for short passages. Users sponsored by an employer are bound by the same agreement plus any terms the sponsor adds. The agreement does not mention public-library users; I expect the library edition's terms to carry the same clause [~75%]. Your own notes, and a book's title and table of contents from public metadata, are not the licensed content [inferred, not legal advice]. That is the boundary a tool should respect; see [The Legal Map](/building/legal-map/).

### Break-even against buying

If no library route exists, compare the subscription with buying. Of the 10 O'Reilly titles in the technical set without a free copy, the three with checked used prices cost \$32.74, \$44.54 and \$68.75 (*Hands-On ML*, DDIA, *Statistical Rethinking*). At the sample's median used price of \$38.19, the annual plan breaks even at about 13 books a year. A one-month burst (\$49) beats buying if you read two or more of its books that month, but you lose access when you stop paying. Buying keeps the book and allows resale.

## Perlego

### Price

US prices as of 2026-10-15 come from the plans endpoint that Perlego's [pricing page](https://www.perlego.com/pricing/) loads:

| Plan | Monthly | 4 months | Annual |
|---|---|---|---|
| Essential ("800,000+ trusted titles and best-sellers") | \$15 | \$45 | \$125 |
| Complete ("1.5M+ books") | \$27 | \$79 | \$199 |

The same endpoint lists test variants (\$12 a month for Essential; \$22–\$38 a month for Complete) and older US plans at \$22 a month, \$60 per 4 months and \$144 a year, so the price you see may not be the price someone else sees. The 4-month Complete plan (\$79, about \$20 a month) fits a semester-length project.

### Catalog

Perlego's public search index held **1,584,988 items, 1,521,208 of them with US sales rights**, on 2026-10-15. The counts below use exact publisher filters. Faceted counts run 30–45% higher and are approximate, so treat all of these as orders of magnitude.

| Publisher | Items | | Publisher | Items |
|---|---|---|---|---|
| Routledge | 153,106 | | Packt | 5,662 |
| CRC Press | 33,701 | | Springer | 4,472 |
| Wiley | 18,959 | | Chapman & Hall/CRC | 3,849 |
| Cambridge UP | 15,658 | | Harvard UP | 2,958 |
| Princeton UP | 9,762 | | Simon & Schuster | 2,361 |
| Elsevier | 5,598 | | HarperCollins | 1,986 |
| Stanford UP | 1,943 | | Yale UP | 1,558 |
| Apress | 1,165 | | **MIT Press** | **1,003** |
| Morgan Kaufmann | 755 | | Manning | 688 |
| W. W. Norton | 421 | | Pragmatic Bookshelf | 200 |
| **O'Reilly Media** | **33** | | **Pearson** (under that name) / No Starch | **0 / 0** |

Set this against O'Reilly's table. Perlego has the university presses O'Reilly lacks (Cambridge, Princeton, Harvard, Yale, and a thin 1,003 from MIT Press) and lacks the publishers O'Reilly is built on (O'Reilly, Pearson, No Starch). Both carry Wiley, CRC, Packt and Apress. A reader who wants both kinds of book needs both routes, or a library card for the O'Reilly half.

### Sales rights and the "restricted" flag

- **Indexed is not readable.** *The Alignment Problem* is in Perlego only as the UK Atlantic Books edition, and "US" is not in its sales-rights list. Anderson's *Imagined Communities* and MacAskill's *What We Owe the Future* are likewise indexed without US rights. Check each title on its book page from a US connection.
- **Essential versus Complete.** About 507,000 items carry a "restricted" flag (an approximate index count). They include *Statistical Rethinking*, *Bayesian Data Analysis* and *How to Measure Anything*. My reading, with low-to-medium confidence, is that these are Complete-only. The flag might instead mark titles excluded from institutional plans. If the technical CRC and Wiley books are why you're subscribing, assume you need Complete.
- **AI terms.** I could not find Perlego's terms of service on its public site, so its rules on AI input are unverified. Assume they are no more permissive than O'Reilly's until you have read them.

## Everand, Kindle Unlimited and Kobo Plus

These are trade-book services. For this audience their main use is popular nonfiction.

**Everand** (formerly Scribd's book side) moved to an unlock model. As of its help pages (plans page updated 2026-09-27):

- **Plans:** Standard \$11.99 a month (1 unlock), Plus \$16.99 (3), Deluxe \$28.99 (5) ([plans](https://support.scribd.com/hc/en-us/articles/40678839226644-Everand-plans-Standard-Plus-and-Deluxe)).
- **Unlocks:** "Most" of the 1.5M+ catalog requires an unlock. A rotating "unlimited" subset of podcasts, Everand Originals and some books does not ([which books](https://support.scribd.com/hc/en-us/articles/47040289862420-Which-books-require-an-unlock)). An unlocked book stays readable while you remain subscribed, and comes back if you resubscribe with the same email. Unused unlocks roll over for up to 6 months, then expire ([unlocks](https://support.scribd.com/hc/en-us/articles/40677287041684-How-unlocks-work-on-Everand)).
- **The old plan:** the Legacy unlimited plan is closed to new sign-ups. Existing Legacy subscribers are told "Your plan is still active and hasn't changed". If you have one, don't cancel it casually.
- **Trial:** 30 days on the web (7 days in the app), with 1 unlock ([trial](https://support.scribd.com/hc/en-us/articles/46956976809236-About-your-free-trial-on-Everand)).
- **Coverage:** Everand's catalog serves a bot challenge, so its coverage of technical books is unknown.

The effective price is \$5.66–\$5.80 per book on Plus or Deluxe and \$11.99 on Standard, for a rental, not a purchase.

**Kindle Unlimited.** When the dossier fetched Amazon's page on 2026-10-15 it promised "unlimited access to over 5 million digital titles", while its navigation menu said "over 4 million digital books, audiobooks, comics, and magazines" ([Amazon](https://www.amazon.com/kindle-dbs/hz/subscribe/ku)). The page showed no price to a logged-out request, and it returned 503 to both later checks. The last list price I know of is \$11.99 a month [unverified; ~75% still current]; the borrowing cap is also unverified. I infer that the catalog is dominated by self-published titles enrolled through KDP Select, and that the academic and technical publishers in this chapter are mostly absent [~80%]. Nothing in the spot-check was tested against it. If you read on a Kindle, US Libby loans can be sent to it, which covers most of the same trade titles for free; see [Reading Modes and Devices](/environments/reading-modes-and-devices/).

**Kobo Plus.** Kobo's help center lists the US among 34 countries and says "there are hundreds of thousands of eBooks currently available through Kobo Plus" ([Kobo help](https://help.kobo.com/hc/en-us/articles/360018976153-Kobo-Plus-Common-questions), updated 2026-09-10). US customers get a 14-day trial, during which offline reading is capped at 15 books. The page gives no prices ("depending on where you live, your monthly Kobo Plus subscription price will be different"), and kobo.com returned 403, so the US price is unverified. In past years it was about \$8–\$10 a month [prior knowledge, unverified].

**Verdict.** Libraries already cover this ground: SFPL's Libby had 7 of the 8 popular nonfiction titles in the technical sample, and six Bay Area collections had 16 of 20 humanities titles. The library route's cost is the wait: *Thinking, Fast and Slow* had 51 holds on 13 SFPL copies, and *Guns, Germs, and Steel* 35 holds on 7 LAPL copies. Buy Everand Plus only when holds queues are what limits your reading and the trial confirms your books are in its catalog. Skip Kindle Unlimited and Kobo Plus for research reading unless a trial shows otherwise.

## Paying per paper or chapter

Start with the free workflow in [Open Papers and Preprints](/access/open-papers/). That chapter estimates that free, instant legal routes reach roughly 70% of a typical reference list [~65% there; an inference, not a measured figure]. The routes below are for the rest.

**Springer+** is a token subscription for individuals ([product page](https://link.springer.com/product/springer-plus); [support](https://support.springernature.com/en/support/solutions/articles/6000273908-what-is-springer-)):

- **Plans:** Basic costs \$39.99 a month for 10 units (\$3.99 each). Standard costs \$299 per 6 months for 120 units (\$2.49 each). Prices exclude VAT.
- **Units:** one unit buys one chapter or article. A whole ebook costs at most 7 units ([units](https://support.springernature.com/en/support/solutions/articles/6000273891-what-is-a-unit-)).
- **Access window:** the product page says "online access to content for 12 hours". The support pages say you have 12 hours to download, and unused units expire ([access](https://support.springernature.com/en/support/solutions/articles/6000273890-how-long-do-i-have-access-to-the-content-and-what-can-i-do-to-ensure-unlimited-access-)).
- **Content:** "chapters and articles from 300k books and 2,500 journals", from "Springer, Apress, and Palgrave imprints". Nature Portfolio appears on the page only in the site-wide brand footer, so I infer that Nature-branded journals are not included [~70%].
- **License:** personal use only, and "not licensed for use by companies or organizations".

Compared with pay-per-view (\$29.95 per chapter, \$39.95 per article), one Basic month is cheaper once you need two items. A whole Springer monograph costs at most \$27.93 on Basic, less than one pay-per-view chapter. **To use it well,** queue your list first, subscribe for one month, download everything inside each 12-hour window, then cancel. Many famous Springer texts in statistics and ML are free from their authors (PRML, ESL), so check before spending units.

**Cambridge Core** sells individuals whole articles and ebooks, but "chapter purchase or rental is not available" ([Cambridge help](https://corehelp.cambridge.org/hc/en-gb/articles/17013941015314-Can-I-purchase-or-rent-individual-access-to-a-book-chapter)). For a single chapter of a Cambridge book, a library or a used copy is usually the better route.

**JSTOR and JPASS.** A free account reads 10 articles every 30 days online. JPASS adds PDF downloads: 10 a month for \$19.50, or 120 a year for \$199, across 2,400+ journals ([JPASS](https://about.jstor.org/products/jpass/)). [Open Papers and Preprints](/access/open-papers/) has the full comparison. JSTOR's terms (updated 2026-04-24) ban systematic or automated downloading and using content "to train large language models or other generative AI technologies" ([terms](https://about.jstor.org/terms/)).

**DeepDyve** streams "35M+" paywalled papers for \$59 a month or \$499 a year, with the first month free. Printing is capped at 40 pages a month, and PDFs cost extra "with no markup" ([pricing](https://www.deepdyve.com/pricing)). At \$39.95 per pay-per-view article, the annual plan breaks even at about 12.5 paywalled articles a year that no free or library route reaches; the monthly plan breaks even at two in a month. Below that, pay per item or use walk-in access ([University and Employer Access](/access/academic-and-employer/)). That chapter also covers the UC Berkeley Extension library card: \$25 for six months with remote access to the university's licensed journals, but only while you are enrolled in a 10-week-plus course, which it prices at about \$810 or more (October 2026). It beats DeepDyve only if you want the course anyway.

**ACM and new CS papers.** In Crossref, 24,784 of ACM's 37,502 DOIs from 2026 (66%) carry a Creative Commons license, against 26% for 2024 ([Crossref API](https://api.crossref.org/members/320/works?filter=from-pub-date:2026-01-01&rows=0&facet=license:30), queried 2026-10-15). Don't pay for access to recent ACM papers before checking the DOI. ACM and IEEE membership prices could not be checked.

**AI research assistants are not an access route.** Elicit, Consensus and similar tools find and summarize papers, but they do not license full text to you. Elicit, for example, reads full text only for open-access papers, or through its browser extension when you hold "a journal subscription". Otherwise it works from title and abstract ([Elicit help](https://support.elicit.com/en/articles/553025)). Prices and measured recall are in [AI Research Assistants](/finding/ai-research-assistants/).

## Used books

On 2026-10-15 the dossier ran AbeBooks ISBN searches sorted by price plus shipping. The cheapest US totals:

| Book (ISBN searched) | Listings | Cheapest total | Cheapest used |
|---|---|---|---|
| *Gödel, Escher, Bach* | 95 | \$8.23 | \$8.23 |
| *Superforecasting* | 35 | \$9.38 | \$9.38 |
| CLRS 3e | 38 | \$16.25 | \$16.25 |
| *Hands-On ML* 3e | 52 | \$32.74 | \$32.74 |
| AIMA 4e | 44 | \$33.15 ("new", probably an international edition) | \$127.80 |
| CS:APP 3e | 23 | \$31.54 (new) | \$93.00 |
| SICP 2e | 54 | \$34.61 | \$34.61 |
| Goodfellow, *Deep Learning* | 75 | \$35.99 | \$35.99 |
| Bishop, PRML | 41 | \$38.19 | \$38.19 |
| ESL 2e | 32 | \$42.14 | \$42.14 |
| DDIA 1e | 72 | \$44.54 | \$44.54 |
| BDA 3e | 39 | \$54.39 | \$54.39 |
| MacKay | 37 | \$56.21 | \$56.21 |
| *Statistical Rethinking* 2e | 37 | \$68.75 | \$68.75 |
| Jaynes | 32 | \$69.99 | \$69.99 |
| CLRS 4e | 63 | \$70.43 | \$70.43 |
| Sutton & Barto 2e | 39 | \$77.74 | \$77.74 |

What follows from these prices:

- **Older editions are the cheapest lever.** CLRS 3e costs 23% of the 4e price. For a reference text where the changes are minor, buy the older edition.
- **Cheap "new" textbooks are often international editions.** AIMA's \$33.15 listing against \$127.80 for the cheapest used copy fits that pattern [inferred]. The text is usually the same, but check exercises and page numbering if you are following a course.
- **AbeBooks beats ThriftBooks for exact editions.** ThriftBooks shows work-level "from" prices that can mix editions. On the same day it showed Goodfellow hardcovers from \$42.09 to \$100.00, PRML from \$66.39 and Jaynes at \$146.94, all above AbeBooks.
- **Bookshop.org sells new books, generally at list price [inferred].** It is a way to support independent stores, not a cheap route.
- **A copy you own works with any reading setup.** It is the one route here with no subscription to lapse and no platform terms on top. What you may do with it in an AI tool is a copyright question, covered in [The Legal Map](/building/legal-map/).

## What these licenses let you do with Claude

For anyone building reading tools, this table is the binding constraint.

| Service | Personal use only | Automated retrieval | AI input or prompting | AI training | Source |
|---|---|---|---|---|---|
| O'Reilly (Individual, Teams, sponsored) | Yes; account sharing banned | Banned ("Web spiders … strictly prohibited") | **Banned** without the copyright owner's written permission | Banned | [Agreement, 2024-10-09](https://www.oreilly.com/membership-agreement/) |
| JSTOR (free account and JPASS) | Yes | Banned (no automated or systematic downloading) | Not addressed for outside tools; its AI-input clause covers JSTOR's own AI feature [unverified] | Banned ("to train large language models") | [Terms, 2026-04-24](https://about.jstor.org/terms/) |
| Springer+ | Yes; "not licensed for use by companies or organizations" | Not checked | Not checked | Not checked | [Springer+ support](https://support.springernature.com/en/support/solutions/articles/6000273908-what-is-springer-) |
| Perlego, Everand, Kindle Unlimited, Kobo Plus, DeepDyve | Personal subscriptions [inferred] | Not checked | Not checked | Not checked | n/a |

Three rules follow:

- **Treat every subscription as a reading license, not a corpus.** Build tools on catalog data (titles, tables of contents, subject placement), your own notes and highlights, and openly licensed text. Route the user to the licensed page; don't pipe the page into the model. [A Reference Architecture](/building/reference-architecture/) builds this in: its rights resolver ranks each access route, and only open or licensed items are fetched and parsed.
- **Personal licenses cannot be pooled.** A shared team tool cannot sit on one person's Springer+, O'Reilly Individual, Perlego or Everand account. The legitimate team path is an organizational license such as O'Reilly Teams or Enterprise. Even those probably exclude AI processing unless an addendum is negotiated, because sponsored users accept the same agreement [inferred, ~80%].
- **Bulk access gets noticed.** JSTOR reserves the right to suspend access per user or per IP address. Automated retrieval through an employer's proxy can cut off the whole organization.

## Which subscription to buy

| If you mainly read… | Buy | Skip | Why | Main obstacle |
|---|---|---|---|---|
| Practitioner ML, data and systems books, and a nearby library offers O'Reilly | **Nothing.** Get the card | O'Reilly Individual | The same platform at \$0. In the sample, the SFPL card plus free copies reached 28/33 | One in-person visit. Early releases and live events may be missing [inferred] |
| Practitioner books, with no library route | **O'Reilly** in monthly (\$49) or quarterly (\$129) bursts; annual (\$499) only if you will use all 12 months | Perlego | 14/33 against 5/33. O'Reilly, Pearson, Manning and Packt live there | Access ends when you stop paying. AI input banned |
| Theory texts in ML, statistics and CS (MIT Press, Cambridge, Springer, Pearson textbooks) | **No subscription.** Author PDFs, used copies, LAPL's Libby for MIT Press, and a Springer+ month for Springer monographs | O'Reilly, Perlego | Of 11 such texts in the sample, O'Reilly had 0 and Perlego 1. Free copies covered 7 (plus Jaynes in part); the cheapest listings for the other 4 were \$16–\$70 | Used shipping time. AIMA (\$128) and CS:APP (\$93) are expensive used |
| Monographs in humanities, social science, philosophy or economics | **Perlego Complete**: \$79 for 4 months for a project, \$199 a year if continuous | O'Reilly | 8/20 against 0/20, and deep Routledge, Cambridge and Princeton lists | US sales rights. Libraries had 16/20 of the famous titles anyway |
| Papers from the JSTOR backfile (economic history, philosophy, older statistics) | **Free JSTOR account**, then **JPASS** annual (\$199) once you need more than 10 a month or PDFs | DeepDyve | \$1.66 per PDF | Cap of 120 PDFs. No bulk or AI use |
| Paywalled STEM papers outside JSTOR, with no institution | The free workflow first. Then a **DeepDyve** month (\$59) for a heavy month, or a **Springer+ Basic** month for a Springer-heavy one | Pay-per-view | \$29.95–\$39.95 per item against \$59 flat | Streaming only, 40 printed pages a month. The \$25 Extension card beats both only if you want the course (about \$810+) anyway |
| Popular nonfiction (Kahneman, Tetlock, Ord) | **Library cards** through Libby | Everand, Kindle Unlimited | SFPL's Libby had 7 of 8 | Holds queues of weeks on bestsellers |
| Popular nonfiction, when holds queues are what limits you | **Everand Plus** (\$16.99 for 3 unlocks) | Everand Standard | \$5.66 against \$11.99 per book | Coverage unverified. A rental, not a purchase |
| Material for an AI reading tool | Whatever you would read anyway | Any subscription as a corpus | O'Reilly bans AI input; JSTOR bans LLM training and automated downloading | n/a |

**If you can buy only one:** if your library licenses O'Reilly, buy none and spend the money on used books. In the technical sample, the five titles the SFPL route missed (CLRS, AIMA, CS:APP, *GEB*, Jaynes) cost \$159 at the cheapest AbeBooks listings, or \$315 if AIMA and CS:APP are bought used rather than as cheap "new" copies: less than one year of O'Reilly, paid once, for books you keep. Without library O'Reilly, buy O'Reilly if your list is mostly practitioner books and Perlego Complete if it is mostly monographs. For a mixed list, use a library card for the O'Reilly half and a 4-month Perlego plan for each monograph-heavy project. No single subscription in the sample covered more than 42% of either list.

## Test coverage against your own list in an hour

The spot-check above is biased toward famous books. Your list is the only sample that matters. This protocol takes about an hour for 20–40 titles.

**Minutes 0–10: write the list.** Write 20–40 titles you expect to read in the next 12 months, one per line, as a distinctive title fragment ("Statistical Rethinking", "Seeing Like a State"). Include the obscure monographs you actually need; those are where libraries are weakest and subscriptions earn their price. Save the list as `my-list.txt`.

**Minutes 10–20: free copies.** Mark every title with a legal free copy, using the routes in [Open-Access Books and Textbooks](/access/open-books/) and [The Public Domain and Open Corpora](/access/public-domain/): author sites, open-access publisher editions, Open Library. In the technical sample this step alone covered a third of the list.

**Minutes 20–30: O'Reilly.** Download the public sitemap and match titles. The script takes about two minutes and makes about 30 requests. It reads only the public sitemap, not member content.

```bash
mkdir -p oreilly && cd oreilly
i=1; fails=0
while [ "$fails" -lt 2 ]; do      # the server sometimes returns 503; retry, stop after 2 misses
  if curl -sf --retry 4 --retry-delay 5 -o "p$i.xml" \
       "https://www.oreilly.com/epubs-books-p$i.xml"; then fails=0
  else rm -f "p$i.xml"; fails=$((fails+1)); fi
  i=$((i+1)); sleep 2
done
cat p*.xml | python3 -c '
import re, sys, html
t = sys.stdin.read()
pat = r"<loc>https://www\.oreilly\.com/library/view/[^/]+/([^/]+)/</loc>.*?<image:title>(.*?)</image:title>"
for id_, title in re.findall(pat, t):
    print(id_ + "\t" + html.unescape(title))' > titles.tsv
wc -l titles.tsv                          # 66,609 lines on 2026-10-15
# drop blank lines first: an empty pattern would match every title
grep -i -F -f <(grep -v '^[[:space:]]*$' ../my-list.txt) titles.tsv   # id <TAB> title per hit
```

Check every hit by hand, because title matches give false positives. In the run for this chapter:

- "Pattern Recognition and Machine Learning" matched a 1992 Academic Press book (ID 9780120588305), not Bishop's.
- "Introduction to Algorithms" matched a Packt title (9781836203872), not CLRS.
- "Human Compatible" matched only the German edition.

The ID's ISBN prefix tells you the publisher. Don't match on print ISBNs. The sitemap uses e-book IDs, and none of the four print ISBNs tried appeared (DDIA, *Hands-On ML* 3e, *Statistical Rethinking* 2e and BDA3), although all four books are there.

**Minutes 30–40: your library cards.** In the Libby app, add every card you hold or could get, then search each remaining title, noting copies and holds. To script it, Libby's back end answers unauthenticated catalog queries such as `https://thunder.api.overdrive.com/v2/libraries/sfpl/media?query=designing%20data-intensive%20applications`. The response gives `ownedCopies`, `availableCopies` and `holdsCount` per title. On 2026-10-15 that query returned 10 owned copies, 2 available and 0 holds. The API is undocumented and may change, so rate-limit politely. Library keys and card eligibility are in [Public Libraries](/access/public-libraries/).

**Minutes 40–50: the paid catalogs.** For each remaining title:

- **Perlego:** search perlego.com from a US connection, open each hit's book page, and confirm it is readable in the US.
- **Everand:** use the 30-day web trial, which includes one unlock.
- **Kobo Plus:** use the 14-day US trial.
- **Springer and Cambridge:** search their sites. Springer, Apress and Palgrave chapters cost one Springer+ unit each. Cambridge sells only whole books and articles.
- **Papers:** search JSTOR (a hit there is not a guarantee of JPASS coverage), and use DeepDyve's free first month.

**Minutes 50–60: decide.** For each paid option S, count M(S): the titles S covers that free copies and your cards do not. Divide what S costs over the months you would actually read by M(S). Compare that with the used price of the same titles. Buy S only if its cost per marginal title is lower and you don't need to keep the books. Two worked examples from the technical sample:

- **O'Reilly Individual with an SFPL card:** M = 0 if the library edition carries the same books [~70%], so don't buy.
- **O'Reilly Individual without a library:** M = 10 over free copies. \$499 ÷ 10 is about \$50 per title, against \$32.74–\$68.75 used (mean \$48.68) for the three titles with checked prices. So the annual plan costs about the same as buying used and leaves you nothing to keep, while a two-month burst (\$98) to read three of them is cheaper than either.

Re-run the test yearly. Catalogs, sales rights and card rules changed repeatedly between 2024 and 2026.

## Open questions

- **O'Reilly's library edition.** Does "O'Reilly for Public Libraries" carry every book in the 66,609-title sitemap? Log in through an SFPL card and check a random sample of 50 sitemap titles, including early releases and translations.
- **Terms for library users.** Do library users accept the same membership agreement, AI-input clause included? Read the terms page shown at first library login.
- **Perlego's tiers.** Is the "restricted" flag (about 507,000 items) the Essential/Complete boundary? Search *Statistical Rethinking* and BDA3 from an Essential account.
- **AI clauses elsewhere.** What do the Perlego, Everand, Kindle Unlimited, Kobo Plus and DeepDyve terms say about AI input and automated access? Each is one careful read of a terms page.
- **Everand on a technical list.** What share of the 33-title technical list and the 20-title humanities list can Everand supply, and how many need unlocks? Run both lists during a 30-day web trial.
- **Kindle Unlimited and Kobo Plus.** What are the current US prices, plan names and borrowing caps, and how many titles from the 53-title lists does each carry? A logged-in browser session on each site answers the first part.
- **Perlego's long tail.** On a list of 30 recent specialist monographs (not famous books), how do Perlego and six Bay Area Libby collections compare? This tests the claim that Perlego's value lies outside the famous-book sample [~70%].
- **ACM membership.** Does it still bundle O'Reilly or other book access, a route widely cited around 2019–2024 [unverified]? What does it cost in 2026?
- **Springer+ scope.** Are Nature-branded journals unit-eligible? Search one Nature article while subscribed.
- **Holds against unlocks.** For the 10 most-held nonfiction titles at SFPL, what is the median wait? At what wait does an Everand unlock (\$5.66) become worth it for a reader who values time? Libby holds data polled daily would answer the first part.

## Related pages

- [The Access Ladder](/access/access-ladder/): where subscriptions sit between free and institutional routes
- [Public Libraries](/access/public-libraries/): the card stack that sets the baseline every subscription must beat
- [University and Employer Access](/access/academic-and-employer/): the \$25 Extension card, walk-in access and employer licenses
- [Open Papers and Preprints](/access/open-papers/): the free paper workflow to run before JPASS or DeepDyve
- [Open-Access Books and Textbooks](/access/open-books/): the free copies that covered a third of the technical sample
- [The Shadow Libraries](/access/shadow-libraries/): the unauthorized benchmark, and why this wiki routes only to legal sources
- [AI Research Assistants](/finding/ai-research-assistants/): Elicit, Consensus and similar discovery tools
- [The Legal Map](/building/legal-map/) and [A Reference Architecture](/building/reference-architecture/): building tools that respect these licenses
- [Costs and Effort](/building/costs-and-effort/): why a self-built catalog competes with discovery subscriptions, not content ones
- [Reading Modes and Devices](/environments/reading-modes-and-devices/): which devices run Libby, O'Reilly and Kindle
