---
title: "Curation: Syllabi, Experts and Reviews"
description: How serious readers decide what to read, compared across syllabi (Open Syllabus), expert interviews (Five Books), great-books canons, public bookshelves, long-form review communities, Goodreads/StoryGraph and curated newsletters; what the evidence says about recommenders versus expert curation; a four-hour method for building a reading list in a new field; and how to keep LLM-generated lists from inventing books.
---

*Status: draft, October 2026. Counts, prices and product statuses are as of October 15, 2026 unless another date is given. Some figures rest only on secondary sources and are marked that way: Goodreads and StoryGraph user counts, the Yeomans et al. percentages, the Danish library audit, and Shepherd's status. The Open Library lookups, the bookshelf count and the LCC spread in the worked example are my own checks, run on October 15, 2026. Sources: the [R11 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R11-reading-practice-curation-devices.md) and the [R05 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R05-book-discovery-and-catalogs.md). Fabrication rates come from the [R04 dossier](https://github.com/quantified-uncertainty/cairn/blob/main/apps/open-stacks/research/R04-ai-research-assistants.md). Primary sources are linked inline.*

## The short version

- **To enter a new field, use curation as your main filter.** Search needs vocabulary you don't have yet. Recommenders favor popular books: on book data, most of nine tested algorithms served "niche" and "diverse" readers worst ([Naghiaei et al. 2022](https://arxiv.org/abs/2202.13446v1)). I found no book-specific head-to-head test of expert lists against algorithms, so this is a lean [~75%], not a result.
- **Open Syllabus is the largest open curation signal.** Version 2.14 (May 22, 2026) holds 32.9 million syllabi and 4.4 million unique titles ([blog](https://blog.opensyllabus.org/Spring-2026-Update), [docs](https://docs.opensyllabus.org/)). The free tier stops at 2019 data, and there are no individual subscriptions ([accounts page](https://blog.opensyllabus.org/about-accounts)). Use it for a field's canon. Use current course pages for anything published since 2020.
- **Hand-curated lists are deep but often old.** Five Books has more than 1,700 expert interviews, but its statistics interviews with Andrew Gelman and David Spiegelhalter date from 2011. Patrick Collison's bookshelf says it has not been updated in about 10 years. The live part of curation is the review communities: the Astral Codex Ten (ACX) review contest, and 405 posts under LessWrong's Book Reviews tag.
- **The social reading platforms are closed to tools.** Goodreads stopped issuing API keys on December 8, 2020, and The StoryGraph sits behind a Cloudflare challenge. A personal tool should ingest your own CSV export.
- **A usable reading list for a new field takes about four hours.** Harvest candidates from at least three independent channels. Resolve every title to an identifier. Count how many channels name each title. Inspect the top 15. Keep 5–10 books for deep reading and 20–40 for shallow reading. That is close to the split [Michael Nielsen](http://augmentingcognition.com/ltm.html) describes for papers: the best 5–10 read thoroughly, "tens" more read shallowly.
- **LLM-generated lists invent books, and invented books have reached print.** A syndicated summer reading list that ran in the *Chicago Sun-Times* in May 2025 had only five real titles out of 15 ([NPR via KJZZ](https://www.kjzz.org/npr-top-stories/2025-05-20/how-an-ai-generated-summer-reading-list-got-published-in-major-newspapers)). The guards: resolve every title against a catalog, check the author and year, require a source link for every item, and never count the model as an independent channel. A zero-hit lookup means "check by hand", not "fake". In my test, two real books failed a naive Open Library lookup.

## Five ways to decide what to read

Each mechanism answers a different question, and each fails in its own way. The table summarizes evidence discussed [below](#what-the-evidence-says).

| Mechanism | Question it answers | Strength | Characteristic failure | Use it for |
|---|---|---|---|---|
| **Search** (catalogs, full text) | "Which book discusses X?" | Precise when you can name X | Useless before you know the field's vocabulary | Known-item lookup; checking what a candidate covers ([Searching Inside Books](/finding/searching-inside-books/)) |
| **Recommenders** (collaborative filtering) | "What do people like me like?" | Predicts taste well in dense domains: an algorithm beat spouses and friends at predicting joke ratings | Popularity bias; serves niche and diverse readers worst | "More like this" inside a field you already know |
| **Crowd signals** (ratings, counts, Listopia) | "What do many readers enjoy?" | Cheap; large samples | Amplifies early luck ([Salganik et al. 2006](https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf)); measures enjoyment by self-selected readers, not importance | Fiction; tie-breaking |
| **Curation** (syllabi, experts, reviews) | "What does someone who knows the field consider foundational?" | Costly signal with a stated reason; crosses shelf categories | Small, slow and idiosyncratic; canons lag the frontier | Entering a field; choosing the deep core |
| **Browsing** (shelf adjacency) | "What sits next to this?" | Serendipity: a borrowed shelf neighbor raises a book's loan odds at least 9-fold ([McKay et al. 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658)) | One classification per book, so interdisciplinary fields scatter | Exploring around a seed; see [Browsing the Stacks](/finding/browsing-the-stacks/) |

The reader this wiki is written for has research-driven, idiosyncratic tastes. Popularity-biased models handle that profile worst. Curation and syllabi are therefore the main tools here, with recommenders and crowd ratings in supporting roles.

## The curation sources, October 2026

| Source | What you get | Scale (date) | Cost / access (Oct 2026) | Status (Oct 15, 2026) | Catch | Link |
|---|---|---|---|---|---|---|
| **Open Syllabus Analytics** | Title rankings by field and by count of syllabi that assign the title | 32,941,092 syllabi; 4.4M unique titles; 69 fields (v2.14, May 22, 2026) | Free tier capped at 2019 data, with syllabi hidden; institutional subscriptions only | Active. Behind Cloudflare human verification since March 2026 | Nothing after 2019 on the free tier. Citation counts conflict between sources (94M vs 147M) | [analytics.opensyllabus.org](https://analytics.opensyllabus.org/) |
| **Open Syllabus Galaxy** | Map of about the top 1M titles, grouped by how often they are co-assigned | About 1M titles | Publicly reachable (HTTP 200 on Oct 15, 2026); what it shows without an account is unverified | Active | A visualization, not a downloadable graph | [galaxy.opensyllabus.org](https://galaxy.opensyllabus.org/) |
| **Five Books** | An expert recommends five books on a subject and explains each choice in an interview | 1,700+ interviews, about 8,000 recommendations, at least 2 new interviews a week | Free; funded by Amazon affiliate links | Active | Many interviews are a decade old; picks often target general readers | [fivebooks.com](https://fivebooks.com/interviews/) |
| **Shepherd** | Author-written "best books on X" lists [recollection, not re-verified] | Unknown | Free | **Unclear.** On Oct 15, 2026, `shepherd.com` redirected to a domain-for-sale page and `www.shepherd.com` served a Cloudflare challenge | May have closed or changed hands [~50%] | — |
| **Great-books canons** | A fixed curriculum of canonical texts | St. John's College: a four-year, all-required list since 1937. *Great Books of the Western World*: 54 volumes (1952), 60 (1990) | Mostly public-domain texts | Stable | Western, mostly pre-modern; little statistics or computing | [St. John's list](https://www.sjc.edu/academic-programs/undergraduate/great-books-reading-list) |
| **Patrick Collison's bookshelf** | A catalog of his physical books, with exceptional ones flagged | About 760 distinct titles by my count (R11 counted about 600); 20 flagged "particularly great", 71 "substantially above average" | Free | "As of mid 2026, this page has not been updated in around 10 years" | A snapshot from the mid-2010s | [patrickcollison.com/bookshelf](https://patrickcollison.com/bookshelf) |
| **Gwern's book reviews** | Star-rated reviews of books read since about 1997, sorted by rating | Not counted (a very long single page) | Free | Page created 2013-08-23, last modified 2022-10-13 | Stale since 2022 | [gwern.net/review/book](https://gwern.net/review/book) |
| **ACX review contest** | Reader-written long reviews, voted on by readers | Finalists often run 2,000–10,000 words; about 10 finalists a year | Free to read | Even years are book reviews; 2026 entries closed May 20 | Selects for interesting reviews, not representative books | [2026 rules](https://www.astralcodexten.com/p/book-review-contest-rules-2026) |
| **LessWrong Book Reviews tag** | Reviews that summarize, engage with and judge a book | 405 posts (Oct 2026) | Free | Active | Topic coverage follows community interests | [lesswrong.com/w/book-reviews](https://www.lesswrong.com/w/book-reviews) |
| **The Browser** | Five hand-picked articles a day, plus a daily podcast and video pick | Claims 150,000+ readers | Free daily newsletter; paid tier price not shown (last verified: \$5/month or \$49/year, Dec 2018, stale) | Active | Articles, not books | [thebrowser.com](https://thebrowser.com/about) |
| **Goodreads** | Crowd ratings, shelves, Listopia lists | >150M members (Sept 2023, secondary) | Free; **no API** | Added a DNF shelf and shopping from shelves in March 2026 [secondary] | Popularity signal; closed data | [goodreads.com](https://www.goodreads.com/) |
| **The StoryGraph** | Ratings, mood and pace tags, shelves | 5M sign-ups (Jan 2026, secondary) | Free; Plus tier (price unverified) | Behind Cloudflare to scripts | No public API known | [thestorygraph.com](https://app.thestorygraph.com/) |
| **Open Library lists and reading log** | User-made lists and want-to-read/read logs | Monthly dumps: lists 0.06 GB, reading log 0.12 GB gzip (Sept 30, 2026) | Free | Active | Noisy; small user base [inference] | [dumps](https://openlibrary.org/developers/dumps) |

Sources for the table: R11 §1.1 and R05 §§6–7, re-checked where noted. The Five Books figures come from its [contact page](https://fivebooks.com/contact-us/), which now carries the text of the old About page. The Collison count is mine: 778 list items and 760 distinct titles on the page as fetched on October 15, 2026. The gap from R11's figure is probably counting method.

## Syllabi: revealed preference by teachers

### What Open Syllabus holds

Open Syllabus extracts citations from college syllabi and resolves them to works. As of version 2.14 (May 22, 2026), its [documentation](https://docs.opensyllabus.org/) reports:

- 32,941,092 syllabi and about 48 billion words of text;
- about 75% from the US, UK, Australia and Canada, mostly from 2010 onward;
- 147 million extracted citations resolving to 4.4 million unique works;
- 69 fields based on the CIP classification.

The [release post](https://blog.opensyllabus.org/Spring-2026-Update) gives 94 million citations and 8,620 schools. The docs give 147 million citations and about 11,000 institutions. The two probably count different things: matched versus all extracted citations, and schools in this release versus all sources [inference]. Quote the source you use.

Access is tightening:

- The free Analytics tier "caps data at 2019," hides the syllabi themselves, and blocks advanced features. "Analytics does not offer individual subscriptions" ([accounts page](https://blog.opensyllabus.org/about-accounts), Oct 2026).
- Since March 2026, Analytics shows Cloudflare human-verification prompts. Scraping, including through spam trial accounts, nearly took the site down several times in the past year ([blog, May 2026](https://blog.opensyllabus.org/Spring-2026-Update)).
- Data requests rose from about one a month to several a week. Each needs legal review and engineering time and usually a payment. A large "CC-NC" open data release is promised, with no date.
- Researchers at universities can request a limited, anonymized dataset of about 7.5 million syllabi from 2010–2017. Premium access is routed through VitalSource ([2025 post](https://blog.opensyllabus.org/spring-2025-news)).

### What a syllabus count measures

A title on many syllabi has passed a costly filter: an instructor staked a semester of students' time on it. Co-assignment ("taught together") is a similarity measure that does not depend on popularity with casual readers. That is why it complements recommenders built on ratings [inference, medium-high confidence].

It has four biases, all inferences from how syllabi are produced:

1. **Teachability.** Syllabi favor books that fit a course: textbooks, short classics, edited readers. Long monographs that experts read but rarely assign are undercounted.
2. **Enrollment.** Introductory courses dominate the counts. In a technical field, the top-ranked titles are often undergraduate textbooks you have outgrown.
3. **Lag.** A book needs years to reach syllabi, and the free tier stops at 2019. In machine learning, a 2019 cutoff misses most of the textbooks now in use.
4. **Geography.** Three-quarters of the corpus is from four English-speaking countries.

### How to use it

- **For canon**, the free tier is enough. Rank a field's titles, then filter out undergraduate textbooks by eye.
- **For anything recent**, go to the syllabi themselves. Search the web for current graduate course pages in the field (for example "causal inference syllabus 2025 pdf"). Three to five recent syllabi from strong departments cover the post-2019 gap better than any aggregate [practice recommendation, ~70% confidence that it beats the alternatives for fast-moving fields].
- **For building a tool**, ask Open Syllabus about a research-use agreement. Don't scrape Analytics. It is the behavior the operators are fighting, and [The Legal Map](/building/legal-map/) covers the contract risk.

## Experts and public bookshelves

### Five Books

Five Books asks "experts to recommend the five best books in their subject and explain their selection in an interview" ([contact page](https://fivebooks.com/contact-us/), Oct 2026). As of October 2026 it has more than 1,700 interviews and about 8,000 recommendations, with at least two new interviews a week. It earns money through Amazon affiliate links. The page does not say how experts are chosen.

The value is in the explanations, and the dates matter. Two interviews in this wiki's core domain show both:

| Interview | Date | The five books |
|---|---|---|
| [Andrew Gelman on statistics](https://fivebooks.com/best-books/andrew-gelman-on-statistics/) | Jan 3, 2011 (updated Mar 28, 2024) | *The Bill James Historical Baseball Abstract*; *Judgment under Uncertainty* (Kahneman, Slovic & Tversky); *How Animals Work* (Schmidt-Nielsen); *The Honest Rainmaker* (Liebling); *How to Talk So Kids Will Listen and Listen So Kids Will Talk* (Faber & Mazlish) |
| [David Spiegelhalter on statistics and risk](https://fivebooks.com/best-books/david-spiegelhalter-on-statistics-and-risk/) | Sept 25, 2011 (updated Sept 23, 2021) | *The Drunkard's Walk* (Mlodinow); *Dicing with Death* (Senn); *How Risky Is It, Really?* (Ropeik); *Damned Lies and Statistics* (Best); *Do You Feel Lucky?* (Poskitt) |

A syllabus count or a recommender is very unlikely to put a baseball abstract and a parenting book on a statistics list. Gelman's choices only make sense with his reasons, which is the point of the format. Spiegelhalter's list is aimed at general readers, which is common on the site. For a technical reader, Five Books works best for adjacent fields (economics, history of science, philosophy) and for finding the one book an expert loves from outside their field [inference].

Five Books has also interviewed ChatGPT about AI books, in [January 2023](https://fivebooks.com/best-books/artificial-intelligence-gpt-3/) and [January 2025](https://fivebooks.com/best-books/the-best-ai-books-in-2025-chatgpt/). All nine distinct titles are real, widely discussed books, from *Artificial Intelligence: A Modern Approach* to *Superintelligence*. That is a small sample of what an LLM does on a popular topic: no inventions, and nothing beyond the most-discussed books in the area [inference from two lists of five].

### Shepherd

Shepherd (shepherd.com) built "best books" lists written by authors, each tied to the author's own book [recollection, not re-verified]. Its status is unclear. On October 15, 2026, the bare domain redirected to a domain broker's "for sale" page, and the `www` host served a Cloudflare challenge. Don't depend on it [~50% that it is still operating].

### Public shelves and the habits of prolific readers

The famous personal lists are snapshots from the 2010s:

- **[Collison's bookshelf](https://patrickcollison.com/bookshelf)** is "a fairly complete catalog of the physical books I own", of which he has read "about half". Flags are the useful layer. About 12% of entries carry one: 91 of 760 by my count, 20 green and 71 light blue. A page note says it is "kept around for posterity" and may be removed.
- **[Gwern's book reviews](https://gwern.net/review/book)** cover reading since about 1997, rated in stars and sorted by rating. The page was last modified October 13, 2022. Gwern stopped using Goodreads in 2020.

The durable lessons are about method, not lists:

| Reader | Method | Source |
|---|---|---|
| Tyler Cowen | Volume and triage: "I start ten or so books for every one I finish"; "I am ruthless in my discards"; regular scans of new-book shelves | [Marginal Revolution, Dec 2006](https://marginalrevolution.com/marginalrevolution/2006/12/how_to_read_fas.html) (stale, but later interviews repeat the theme [secondary]) |
| Michael Nielsen | Thorough reads of "the best 5-10 papers in the field", interspersed with shallow reads of "tens of papers" | [Augmenting Long-term Memory, 2018](http://augmentingcognition.com/ltm.html) |
| Holden Karnofsky | Reading a book once without active engagement has "awkwardly small" value. Reviews and critiques give more understanding per hour. He limits this to casual learning outside one's expertise | [Cold Takes, Oct 20, 2021](https://www.cold-takes.com/reading-books-vs-engaging-with-them/) |

These fit together once reading is split into modes, as in [Reading Modes and Devices](/environments/reading-modes-and-devices/): a cheap survey of many books (Cowen), deep study of a small core (Nielsen), and engagement through reviews and critiques (Karnofsky).

## Great-books canons

The great-books tradition is the oldest form of curation and the most rigid:

- **St. John's College** has required the same four-year [reading list](https://www.sjc.edu/academic-programs/undergraduate/great-books-reading-list) of all students since 1937.
- **Britannica's *Great Books of the Western World*** shipped 54 volumes in 1952 and 60 in 1990. It sold only 1,863 sets in 1952, 50,000 in 1961 after a switch to door-to-door sales, and about 1 million in total per Alex Beam ([Wikipedia summary](https://en.wikipedia.org/wiki/Great_Books_of_the_Western_World), secondary).
- **Mortimer Adler's *How to Read a Book*** was first published in 1940. The 1972 revision, co-authored with Charles Van Doren, ends with a recommended list of 137 entries.

For this wiki's reader, the canons matter in two ways:

1. **Most of the texts are public domain**, so they are free to read (see [The Public Domain and Open Corpora](/access/public-domain/)). For philosophy, political economy and the history of science, a canon is a reasonable spine.
2. **The *Syntopicon* is the design precedent.** It is a two-volume index of 102 "Great Ideas" in which indexers collated passages across the whole set, idea by idea. It is the closest historical analogue to an LLM-built cross-book idea index [inference]. [The Design Space](/building/design-space/) takes this further.

The canons offer little or nothing on statistics, machine learning or computing [inference from the published lists, ~85%]. Don't use them for those fields.

## Reviews and review contests

The review communities are the part of curation still growing in 2026.

- **[ACX contest](https://www.astralcodexten.com/p/book-review-contest-rules-2026).** The contest alternates between book reviews (even years) and non-book reviews (odd years). The 2026 rules:
  - entries were due May 20, 2026, with "no official word count requirement";
  - past finalists "were often 2,000 to 10,000 words";
  - readers vote for about 10 finalists, which are posted one a week through the summer;
  - prizes are at least \$2,500, \$1,000 and \$500.

  The 2021 prizes were \$5,000, \$2,500 and \$1,250, plus a \$1,250 readers' choice award ([2021 winners](https://www.astralcodexten.com/p/book-review-contest-winners)). I could not find a 2026 winners post as of October 15, 2026.
- **[LessWrong Book Reviews](https://www.lesswrong.com/w/book-reviews).** The tag holds 405 posts as of October 2026. Its description asks reviews to summarize and engage with the book's core ideas and then judge whether to read it. A good one can stand in for the book.

Why reviews belong in a reading workflow:

- **Triage.** A long review answers Adler's inspectional questions (what kind of book, what it argues, whether it succeeds) in 20–40 minutes, not 10 hours.
- **Calibration.** Karnofsky's own rough guesses, not measurements, put reading reviews and discussions at about 25% understanding of a book for 2 hours of effort, against 12–15% for reading it once without engagement ([Cold Takes](https://www.cold-takes.com/reading-books-vs-engaging-with-them/)). I lean toward agreeing for books outside your field [~65%], and away from it for books you will use professionally.
- **Selection bias.** Contest entries are chosen by reviewers and voted on by readers who reward interesting writing. A contest finalist tells you the reviewer found something worth 5,000 words. It does not tell you the book is the best in its field [inference].

Other review channels are worth checking for technical books: the book-review sections of journals in your field, and the reviews behind major prizes [practice note].

## Crowd platforms and newsletters

### Goodreads and The StoryGraph

- **Goodreads** reported more than 150 million members (September 2023, [Wikipedia](https://en.wikipedia.org/wiki/Goodreads), secondary). It stopped issuing API keys on December 8, 2020, and `goodreads.com/api` now redirects to the homepage (checked October 15, 2026). An aggregator reported a "did not finish" shelf and shopping from shelves in March 2026 [secondary].
- **The StoryGraph** reached 5 million sign-ups by January 2026 ([Wikipedia](https://en.wikipedia.org/wiki/The_StoryGraph), secondary, low reliability). It serves a Cloudflare challenge to scripted clients and has no public API that I know of.

**What the ratings measure.** They measure enjoyment among self-selected readers who chose to finish and rate a book. For a technical monograph, the raters are a small, unrepresentative group. In Salganik, Dodds and Watts's music-market experiment (14,341 participants), showing download counts made success both more unequal and less predictable: "the best songs rarely did poorly, and the worst rarely did well, but any other result was possible" ([*Science* 2006](https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf)). Treat rating counts as a tie-breaker, not a filter.

**What they are good for.** Your own history. Export your shelves as CSV and load them into your tools. That is the legal, durable way to bring the social layer into a personal catalog ([A Reference Architecture](/building/reference-architecture/)).

### The Browser and link newsletters

[The Browser](https://thebrowser.com/about) sends five articles a day, "hand-chosen by our editors", plus a daily podcast and video pick, and claims more than 150,000 readers. The about page shows no subscription price as of October 2026. The last price I could verify was \$5/month or \$49/year, from December 2018 (stale).

Newsletters like this curate articles, not books. Their use is breadth: exposure to fields you would never search. For book discovery they work indirectly, since a good essay often names the one book behind it [inference].

### Physical curation

Bookstore tables are curation too. Barnes & Noble under James Daunt (CEO since 2019) moved buying and display decisions to individual stores. CNN reported a 7% traffic increase. In September 2025 the company bought Books Inc., a Bay Area chain, for \$3.25 million ([Wikipedia](https://en.wikipedia.org/wiki/Barnes_%26_Noble), secondary). The design lesson is in [Browsing the Stacks](/finding/browsing-the-stacks/). The right unit is a "front table": a small, explained, cross-category set, not an endless ranked list.

## What the evidence says

| Study | Domain and design | Finding | Bearing on books |
|---|---|---|---|
| Yeomans, Shah, Mullainathan & Kleinberg 2019, *J. Behavioral Decision Making* | Jokes; 75 pairs of spouses and close friends vs a collaborative filter | The algorithm predicted preferences better than spouses and friends: 61% vs 57% per [Forbes coverage](https://recommender-systems.com/?p=1059). People still preferred recommendations they believed came from humans. Explaining the algorithm raised its ratings ([summary](https://www.psychologytoday.com/ca/blog/choice-matters/201905/why-ask-machine-recommendation)) | Weak: jokes, not books. The numbers come from press coverage and are unverified against the paper |
| [Naghiaei, Rahmani & Dehghan 2022](https://arxiv.org/abs/2202.13446v1) (Bias@ECIR) | Books (Book-Crossing); 9 algorithms plus 2 baselines; offline evaluation | Most algorithms show popularity bias and fail "Niche" and "Diverse" readers, despite their larger profiles. Bestseller-focused readers get the best recommendations | Direct, but offline and on one dataset |
| [CWI audit](https://ir.cwi.nl/pub/36328) (ECIR 2026) | A non-personalized item-to-item recommender in Danish public libraries | Strong popularity bias; exposure for less-popular author nationalities fell by up to 40% depending on settings | Direct, but known to me only from a search snippet (secondary) |
| [Salganik, Dodds & Watts 2006](https://www.princeton.edu/~mjs3/salganik_dodds_watts06_full.pdf) | Music; 14,341 participants; field experiment | Social-influence signals increased inequality and unpredictability of success | Indirect; foundational for crowd counts |
| [McKay, Smith & Chang 2014](https://figshare.com/articles/conference_contribution/Lend_me_some_sugar_Borrowing_rates_of_neighbouring_books_as_evidence_for_browsing/26289658) | OhioLINK circulation, 2007–08 | A borrowed shelf neighbor raises a book's loan probability "by at least 9-fold" | Direct evidence that adjacency (classification as curation) drives discovery |
| [Hinze et al. 2012](https://researchcommons.waikato.ac.nz/bitstreams/3876091c-69d5-44ff-b3e7-2a23aedd4fa6/download) | 65 readers in academic and government libraries; 51 observed | Readers triage by table of contents, back cover, index and flicking through | Direct: what to show next to any recommendation |

**What this supports** [inference, medium confidence]:

- Algorithms can predict taste well, so "humans curate better" is not the right claim. The defensible claim is narrower: on book data, standard recommenders push popular titles. Readers with niche and diverse tastes, which describes most researchers, get the worst results from them.
- People trust and use recommendations they understand (Yeomans et al.). Expert curation comes with a stated reason. A tool should show provenance with every suggestion, for example "assigned with X on 312 syllabi; recommended in two expert interviews" (an illustrative format, not a real count).
- Crowd counts amplify noise (Salganik et al.). Show them last, if at all.

**What is missing.** I found no study comparing expert lists, syllabus co-assignment and collaborative filtering on the outcome that matters: whether a researcher, a year later, rates the book as having changed what they know or do. That is the [first open question](#open-questions) below.

**My lean.** For a researcher entering a field, use curator- and syllabus-weighted signals as the primary filter [~75%]. Use recommenders for "more like this" once you have 10–20 seeds you trust. Use crowd ratings only to break ties. Evidence that would change my mind: a study on research readers in which collaborative filtering matched expert lists on later-rated value.

## Building a reading list for a new field in four hours

The method combines three ideas. Independent channels (syllabi, experts, reviews) cancel each other's biases. Every item must resolve to a real catalog record. A short inspectional pass, in Adler's sense, decides the core before you commit dozens of hours.

### The method

| Step | Time | What you do | Output |
|---|---|---|---|
| 1. Frame | 10 min | Write the question and what you want to be able to do afterward. Set a budget: 5–10 deep reads, 20–40 shallow reads (Nielsen), and an abandon rule (Cowen) | A one-paragraph brief |
| 2. Harvest syllabi | 25 min | Open Syllabus Analytics, free tier, for the field's canon (through 2019). Then 3–5 recent graduate syllabi from course pages, for post-2019 work | 20–40 candidates, each tagged "syllabus" |
| 3. Harvest experts | 20 min | Five Books search; the "further reading" sections of one recent survey article or handbook chapter; textbook prefaces that name rivals | 10–20 candidates tagged "expert" |
| 4. Harvest reviews | 15 min | LessWrong Book Reviews tag; ACX entries; book reviews in the field's journals | 5–15 candidates tagged "review" |
| 5. LLM brainstorm (optional) | 10 min | Ask a model for 20 candidates, each with a source URL. Tag each "LLM" | Candidates with claimed provenance |
| 6. Resolve | 25 min | Resolve every candidate to an Open Library work key, ISBN or DOI ([script below](#a-resolver-you-can-run)). Fetch each LLM-claimed source URL and confirm it names the book | A deduplicated list; unresolved items checked by hand |
| 7. Score | 15 min | Count **independent channels** per title, not mentions. Mark the traditions or schools each title belongs to | A ranked table |
| 8. Inspect the top 15 | 60–75 min | About 5 minutes per book: table of contents, preface, index, one review; [search inside](/finding/searching-inside-books/) for two terms you care about. Classify each as deep, shallow or drop | 5–10 deep, 20–40 shallow |
| 9. Route and write | 20 min | Find a legal copy for each through [The Access Ladder](/access/access-ladder/). Write one line per book: why it is on the list, which channels named it, and a forecast such as "P(changes my view on Q) = 0.2" | The list, with provenance |

The total is about 3.5–4 hours. Most of it is spent in steps 6 and 8, which are the ones people skip.

**Scoring rule.** A title enters the deep core only if (a) at least two independent channels name it, and (b) at least one of those is a syllabus or a named expert. LLM-only titles never enter the core. Independence matters. A LessWrong review of a book that a Five Books expert praised may have been prompted by that interview, and an LLM's list is largely a compression of the same popular web sources [~70%]. Count it as one channel, not two.

**Coverage rule.** If the field has rival schools, the core must contain at least one book from each. That is Adler's syntopical reading at the list level: you cannot "bring the authors to terms" if you only read one camp.

### Worked example: causal inference for a forecaster

A forecaster wants to judge causal claims in the questions they forecast (does this policy change the base rate?). Causal inference has three traditions with different vocabularies: graphical and structural models, potential outcomes, and design-based econometrics. That characterization is mine, though standard. The titles below are the kind a first harvest returns. I chose them from my own knowledge of the field, not by running the full method, so treat the list as illustrative. I resolved each against Open Library on October 15, 2026.

| Title | Tradition | LCC class in Open Library | Free legal full text (Oct 2026) |
|---|---|---|---|
| Pearl, *Causality* (2000; 2nd ed. 2009) | Graphical | BD541 (speculative philosophy) | No; Open Library lists print-disabled access only |
| Pearl & Mackenzie, *The Book of Why* (2018) | Graphical, popular | Q175.32 (philosophy of science) | No; print-disabled only |
| Pearl, Glymour & Jewell, *Causal Inference in Statistics: A Primer* (2016) | Graphical, textbook | QA276 (mathematical statistics) | No |
| Imbens & Rubin, *Causal Inference for Statistics, Social, and Biomedical Sciences* (2015) | Potential outcomes | H62 (social science methods) | No; print-disabled only |
| Hernán & Robins, *Causal Inference: What If* (2020) | Potential outcomes, epidemiology | Q175.32 | **Yes**: [free PDF](https://miguelhernan.org/whatifbook) from the authors |
| Morgan & Winship, *Counterfactuals and Causal Inference* (2007; 2nd ed. 2015) | Potential outcomes and graphs, sociology | H62 | No; print-disabled only |
| Angrist & Pischke, *Mostly Harmless Econometrics* (2009) | Design-based | HB139 (econometrics) | No free edition found |
| Cunningham, *Causal Inference: The Mixtape* (2021) | Design-based | H61.3 | **Yes**: [readable online](https://mixtape.scunning.com/) (2nd edition in progress) |
| Huntington-Klein, *The Effect* (2021) | Design-based | none returned | **Yes**: [free web edition](https://theeffectbook.net/) |

Three things follow:

1. **The field is scattered across the shelves.** Eight of the nine books have LCC numbers in Open Library, and they sit in five subclasses: BD, Q, QA, H and HB. A shelf browser opened at QA276 shows one of them. Co-assignment and expert lists pull them together, and that is why curation complements [browsing](/finding/browsing-the-stacks/). (Open Library's LCC values carry caveats: one work can hold several class numbers from different editions. See [Catalogs and Metadata](/finding/catalogs-and-metadata/).)
2. **The coverage rule bites.** A list built only from economics syllabi would likely skew design-based, and one built from a computer science reading group would likely skew toward Pearl [inference]. A forecaster needs at least one book from each tradition. The traditions use different notation and disagree about which assumptions to make explicit, and how.
3. **Access shapes the core.** Three of the nine are free and legal online. A reasonable deep core here is Hernán & Robins (free), Pearl, Glymour & Jewell (short), and one design-based text (*The Effect* is free). The rest go to the shallow list or to a library loan. That is my judgment, not a computed result.

The same method works for decision theory (rival schools: evidential, causal, functional), for forecasting itself (judgmental vs statistical), or for any field where a syllabus count alone would hand you one camp's textbook.

## LLM-generated reading lists

### How often models invent books

| Evidence | Setting | Result |
|---|---|---|
| *Chicago Sun-Times* / *Philadelphia Inquirer* "Heat Index" insert, May 2025 | Syndicated summer reading list, partly AI-generated, unchecked | "Only five of the 15 titles on the list are real" ([NPR via KJZZ](https://www.kjzz.org/npr-top-stories/2025-05-20/how-an-ai-generated-summer-reading-list-got-published-in-major-newspapers)). Real authors were credited with invented novels ([404 Media](https://404media.co/chicago-sun-times-prints-ai-generated-summer-reading-list-with-books-that-dont-exist/)) |
| [Walters & Wilder 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10484980/), *Sci Rep* | ChatGPT writing short literature reviews on 42 topics | 55% (GPT-3.5) and 18% (GPT-4) of cited works fabricated. **Books: 23% of 78 (GPT-3.5) and 8% of 126 (GPT-4). Book chapters: 70% for both** (n = 10 and 23). Many real citations had substantive errors (possibly stale) |
| [Chelli et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11153973/), *JMIR* | References for systematic reviews | 39.6% (GPT-3.5), 28.6% (GPT-4), 91.4% (Bard) hallucinated (possibly stale) |
| [OpenScholar study](https://arxiv.org/abs/2411.14199) (2024; *Nature*, Feb 2026) | GPT-4o with no retrieval | 78–90% of citations hallucinated |
| [Rao, Wong & Callison-Burch 2026](https://arxiv.org/abs/2604.03173) | 10 search-grounded and deep-research systems | 3–13% of URLs hallucinated; deep-research agents 10.7% vs 4.8% for search-augmented chat (pooled). A resolve-and-retry loop cut non-resolving links to under 1% |
| [DeepTRACE, Venkit et al. 2025](https://arxiv.org/abs/2509.04499) | Deep-research systems | Citation accuracy (does the source support the sentence?) of 40–80% |
| Lancet study reported by [STAT](https://www.statnews.com/2026/05/07/lancet-study-finds-steep-rise-fraudulent-citations-academic-papers/), May 2026 | Published papers | Papers with at least one fabricated reference rose from 1 in 2,828 (2023) to 1 in 277 (first 7 weeks of 2026) |

These studies are mostly about papers. The one book-specific breakdown, in Walters & Wilder, shows whole books fabricated less than half as often as journal articles (GPT-4: 8% vs 18%; GPT-3.5: 23% vs 73%), but book chapters far more often (70%, small n). None of these studies measures book recommendations from 2026 frontier models. My expectation is that fabrication rises as topics get narrower [~70%, untested]. Popular topics produce real, familiar books, as in the Five Books ChatGPT interviews. Niche topics such as "imprecise probability" or "proper scoring rules for interval forecasts" invite plausible inventions, and so do requests for specific chapters. The [AI Research Assistants](/finding/ai-research-assistants/) chapter covers the paper side.

### Failure modes

| Failure | Example | Caught by |
|---|---|---|
| Invented title by a real author | The 2025 insert credited invented novels to Isabel Allende and Andy Weir | Catalog resolution: zero hits |
| Real title, wrong author | 404 Media reported titles "written by other authors than the ones they are attributed to" | Match author as well as title |
| Real book, wrong year or edition | A 2nd edition cited with 1st-edition content | Compare year and edition with the record |
| Real book that doesn't cover the claim | The model says chapter 7 treats scoring rules; it doesn't | [Search inside](/finding/searching-inside-books/), or check the table of contents |
| Popularity collapse | The list repeats the most-discussed books and misses the field's working texts | The channel-count rule: the LLM never counts as independent |
| Staleness | Books after the training cutoff are missing | Recent syllabi and publisher catalogs |

### Guards

| Guard | What it catches | Cost |
|---|---|---|
| **Resolve every title to an identifier** (Open Library work key, ISBN, DOI) | Invented books | Seconds per item; free API |
| **Match author surname and year** as well as title | Misattribution; wrong edition | Same lookup |
| **Require a source URL per item** (a syllabus, interview or review), then fetch it and confirm the book is named | Items with no human curator behind them; invented provenance | 1–2 minutes per item |
| **Check one specific claim per book** against its table of contents or a search-inside hit | Real books that don't say what the model claims | 1–3 minutes per item |
| **Use retrieval-grounded tools**, not bare chat | Most existence errors: 3–13% of URLs in grounded systems vs 18–91% of references in ungrounded studies | None |
| **Ask for fewer items with reasons, twice**, and compare the runs | Tail inventions; run-to-run instability | Minutes |
| **Label LLM-originated items** and keep them out of the core unless a human channel confirms them | Correlated popularity error | None |

**Zero hits means "check by hand", not "fake".** In my October 15, 2026 test against the Open Library search API:

- The two invented 2025 titles (*Tidewater Dreams*, *The Last Algorithm*) returned zero hits under every query form I tried.
- Two real books also failed a naive exact-title lookup. Jaynes's *Probability Theory: The Logic of Science* returned zero with its subtitle. Huntington-Klein's *The Effect* returned zero because Open Library stores it as "Effect". The ISBN that the book's own website links to is not in the catalog either.
- Both real books resolved once the subtitle and leading article were dropped and the author surname was used. When Open Library misses, try the Google Books API (bring your own key; R05 found the anonymous quota exhausted), the Library of Congress catalog, or the publisher's page. Don't scrape WorldCat.org. Its terms forbid harvesting, and in January 2026 OCLC won a permanent injunction against a scraper on contract and trespass grounds ([The Legal Map](/building/legal-map/)).

### A resolver you can run

This is the function I ran on the titles above on October 15, 2026. Open Library allows about 1 request per second for anonymous clients and three times that with an identifying User-Agent ([API docs](https://openlibrary.org/developers/api)). Use the [monthly dumps](https://openlibrary.org/developers/dumps) for anything bulk.

```python
import re, time, requests

UA = {"User-Agent": "ReadingListCheck/0.1 (you@example.org)"}  # identify yourself: 3 req/s instead of 1
FIELDS = "key,title,author_name,first_publish_year,ebook_access"

def norm(s):
    s = s.split(":")[0].lower()                  # drop subtitles
    s = re.sub(r"^(the|a|an)\s+", "", s.strip())  # Open Library sometimes drops leading articles
    return re.sub(r"[^a-z0-9 ]", "", s).strip()

def search(**params):
    r = requests.get("https://openlibrary.org/search.json",
                     params={**params, "fields": FIELDS, "limit": 100}, headers=UA, timeout=30)
    time.sleep(0.4)
    return r.json().get("docs", [])

def resolve(title, author):
    """Open Library works matching title and author surname. [] means 'check by hand', not 'fake'."""
    surname, want = author.split()[-1], norm(title)
    for docs in (search(title=want, author=surname), search(author=surname)):
        hits = [d for d in docs if norm(d.get("title", "")) == want]
        if hits:
            return hits
    return []
```

Each hit's `ebook_access` field (`public`, `borrowable`, `printdisabled`, `no_ebook`) gives a first answer for step 9. For papers, resolve DOIs against Crossref instead. In a Claude Code workflow, make this check a mandatory step between "model proposes" and "list is saved", not an optional audit.

## Which signal to use when

| If you want to... | Use | Main obstacle |
|---|---|---|
| Enter a new technical field | The four-hour method: recent syllabi + one expert source + reviews, resolved and channel-counted | The free Open Syllabus tier stops at 2019 |
| Choose the 5–10 books to study deeply | At least two independent channels, one a syllabus or named expert, plus a 5-minute inspection | Rival schools; apply the coverage rule |
| Decide whether one specific book is worth 10 hours | Read 1–3 long reviews first (LessWrong, ACX, a journal review) | Reviews exist mostly for popular or contested books |
| Find great books outside your field | Five Books interviews in adjacent fields; flagged entries on public shelves | Many lists are 10+ years old |
| Keep up with articles across fields | One curated newsletter (The Browser style) | Articles, not books |
| Choose fiction | Goodreads or StoryGraph ratings, friends' shelves | Popularity bias, which matters less here |
| Build a tool on curation data | An Open Syllabus research agreement, Open Library list and reading-log dumps, the user's own CSV exports, expert-list links | No API at Goodreads or StoryGraph; anti-bot walls; store links and metadata, not copied reviews ([Legal Map](/building/legal-map/)) |
| Use an LLM to draft a list | Retrieval-grounded model; a source URL per item; resolve, then check a claim per book | Zero hits are sometimes real books |

## Open questions

- Does Open Syllabus co-assignment predict which books a researcher later rates as valuable better than collaborative filtering does? A study with about 100 researchers' reading exports and one-year follow-up ratings could test it.
- What share of book recommendations from late-2026 frontier models, with and without search, are fabricated or misattributed in niche technical topics, compared with popular ones? A 50-topic audit with catalog resolution would answer it.
- What is the Open Library false-negative rate for real books on a syllabus-derived list of about 200 technical titles, and how far do the subtitle and article normalizations above reduce it?
- When will Open Syllabus ship its promised CC-NC data release, and will it include co-assignment counts or only title rankings?
- How old is Five Books' coverage of statistics, machine learning and decision theory? What share of interviews in those categories predate 2015?
- Is Shepherd still operating, and under what domain?
- Do ACX contest finalists and well-received LessWrong reviews predict later syllabus adoption or citation of the reviewed book, or only reader interest?
- Who won the 2026 ACX book review contest, and was it announced after October 15, 2026?
- Which numbers in the 2019 Yeomans et al. paper (the reported 61% vs 57%) hold up on reading the paper itself?

## Related pages

- [Catalogs and Metadata](/finding/catalogs-and-metadata/): the identifiers and dumps used to verify a list
- [Browsing the Stacks](/finding/browsing-the-stacks/): shelf adjacency, serendipity and the "front table"
- [Searching Inside Books You Don't Have](/finding/searching-inside-books/): checking what a candidate covers before you read it
- [AI Research Assistants](/finding/ai-research-assistants/): paper-side discovery and citation fabrication in depth
- [Lectures, Talks and Other Media](/finding/lectures-and-media/): curation for non-text sources
- [The Access Ladder](/access/access-ladder/): routing each list item to a legal copy
- [Reading Modes and Devices](/environments/reading-modes-and-devices/): inspectional versus deep reading, and the tools for each
- [Foraging and Exploratory Search](/interfaces/exploratory-search/) and [Maps of Knowledge](/interfaces/maps-of-knowledge/): interface research behind curator-weighted browsing
- [The Legal Map](/building/legal-map/): scraping, terms of use and what a tool may store
- [The Design Space](/building/design-space/): curator graphs, review-first queues and a modern *Syntopicon*
- [Directory of Sources and Tools](/reference/directory/)
