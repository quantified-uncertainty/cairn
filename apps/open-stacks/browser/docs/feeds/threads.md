# Threads: one model-written thread per item

*15 October 2026, revised the same day after an editorial pass; the build of 16 October is described in section 0, which says where it departs from the design. It builds on the block markers, quote checks and batch job in `docs/feeds/llm-highlights.md`. The six exemplar threads of section 1 are in `data/threads.json` with 32 more written the same way: every quote, number and figure id was checked against the full source. The editorial pass re-read every source, the cited figures and the scan page, changed 39 of the 42 exemplar posts (several only in a phrase) and changed the rules where they had failed (section 9). Paths are relative to `apps/open-stacks/browser/`.*

Files: `data/threads.json` (the threads), `threads.mjs` (the generator, the verifier of section 4, `verify` and `merge`), `server/routes/67-threads.mjs` (`GET /threads.json`), `ui/js/features/threads.js` and `ui/js/features/feeds.js` (the Threads feed and the side panel's Thread section), `test/threads-core.test.mjs`. The design's reference checker, `verify.py`, was a one-off; `verifyThread()` in `threads.mjs` replaces it.

## 0. What was built (16 October 2026)

- **Data.** `data/threads.json` holds 38 threads: the 6 exemplars and 32 more written by hand under the threads-v1 rules. `node threads.mjs merge` re-checked them against freshly fetched sources: all 255 quotes were found again (249 exactly, 3 with OCR hyphens joined, 3 only in the full text: two table cells and a footnote, which the paragraph blocks leave out), and the pages of PDF and arXiv cites were recomputed from where each quote starts in the PDF text the app shows; all 173 matched the writers' pages (two quotes run over a page break: the caveat of `arxiv:2305.15324` is placed on the page where it starts; the hook of `arxiv:2401.05566`, whose first four words sit at the foot of the page before a full-page figure, on the page that holds the rest; the peek and the dive mark the part on the cited page). No post was dropped. Flags (repeats, a hedge, `fig0` figures that do not resolve yet) are kept in `checks.flags`.
- **Serving.** `GET /threads.json` (whole file, `?lane=`, `?ids=`; 404 while there is no file) instead of a `threads` type in `/extract/feed` (section 7): threads are a small local file, not an extraction, and the panel needs one item at a time.
- **Generator.** `node threads.mjs` writes threads one call per item with Claude Haiku (`claude-haiku-5-5`), from the same marked blocks as the highlights plus non-arXiv PDFs as `pdftotext` pages, with the rules of section 5 and three exemplars (the CCS paper, Neyman's post, the Hitt scan) as a cached prefix. It is not merged with the highlights call (section 6's shared batch job is not built), it uses interactive calls rather than the Batches API, and the effort is the summaries' plumbing's `low`, not `medium`. Its estimate for the remaining 2,588 items is about $7.70 at Haiku prices (typical document sizes). The pilot of section 6 has not been run: no thread from the generator exists yet, only ones Claude Opus wrote in agent sessions ("hand-written" in their `model` field; the UI labels them AI-written, by Opus) and mock output.
- **Verifier.** Section 4's checks 1 to 9 in `verifyThread()`: quotes (exact, joined, skeleton; claimed block first, `loc` corrected), pages (from the PDF text: the page where the quote starts, by its longest prefix found when it runs over a page break), numbers and number words against the full text (block text plus the PDF's text for arXiv papers, the raw page with tables and `aria-label`s for posts and web pages), quoted phrases, figures, lengths and lead-ins, lost hedges and repeats (flags), and the whole-thread rules. `--mode quotes` (used by `merge`) drops only posts whose quote is not found.
- **Agent jobs.** A `thread` job type in `server/jobs.mjs`: up to 25 items of a lane without a thread; the agent writes them by these rules, runs `node threads.mjs verify --ids …`, and `node jobs.mjs check` requires every post's quote to have been found.
- **In the Feeds view.** Threads is the first feed (and the Board's feed, once, for a reader who used Feeds before). A closed card shows the hook, the figure, the finding and the caveat (the claim and what most weakens it), with "+N more" (or `t`) for the rest, numbered on a thread line. Each post ends with its place (`p. 19 · §5.3`, `¶ 52`) and a ✓ when its quote was found. Resting the pointer on a post opens the peek on the page it cites with the quote marked (OCR word boxes for scans, pdf.js text for PDFs, the stable page's text for posts and web pages); elsewhere on the card, the whole thread with every quote. A click on a post opens the item at that page and lights the quote. Items without a thread follow a divider with their Pictures cards. The lane picker in the Feeds header shows each lane's thread count. The side panel's Thread section (order 22) shows the hook and the same two posts, with "more". The Stack layout and the `o`-at-the-place of section 7 are not built.


The reader's request: *"the 'feeds' that we have now is also quite weak. maybe try using LLMs more. Think of great tweet threads, that hook you in with nice summaries of content and clear outputs."* Today each feed card is one extracted sentence, number or figure, with no hook and no takeaway.

**The proposal.**
- Add a **Threads** feed and make it the first feed. It shows one card per item: a thread of 4–7 short posts, written by a model that has read the whole text.
- **Post 1 is the hook**: the single most interesting true thing in the item, chosen for a reader who knows the field.
- **The other posts** give what was found, how, the figure that carries it, what it changes, the strongest caveat, and which pages are worth reading.
- **Every post cites one place**: a page, section or figure, and a quote of at most 25 words that software finds verbatim in the source. A post whose quote is not found is dropped.
- **Every number and number word** in a post must appear in the source, except values read off a chart, which are labelled as such.
- **Hedges travel with claims.** A post whose cited block hedges ("we expect", "illustrative") while the post does not is flagged for review.
- **One batch call per item** writes both the thread and the highlights of `llm-highlights.md`, so the input is paid for once. A Sonnet run over the reader's six main lanes costs about $54 at batch prices (section 6).

## 1. The six hooks

| Item | Kind | Hook (characters) |
|---|---|---|
| *Language Models (Mostly) Know What They Know* (2022, `arxiv:2207.05221`) | arXiv paper with figures | A 52B model fine-tuned on bare trivia questions to predict whether it knows the answer gave 18% for one obscure question, and 78% once the relevant Wikipedia article was pasted in front of it. Across TriviaQA, adding the article raised its average estimate. (257) |
| *Challenges with unsupervised LLM knowledge discovery* (Google DeepMind, 2023, `arxiv:2312.10029`) | DeepMind safety paper | Tell Chinchilla-70B that an expert, Alice, rated each movie review, her verdict assigned at random. Unsupervised probes for what the model knows (CCS, PCA, k-means) then predict Alice's verdict, not the review's sentiment. A supervised probe does not. (251) |
| *Identifying and Cultivating Superforecasters* (Mellers et al., 2015; a PDF without HTML) | forecasting paper | Sixty of the best forecasters from year 1 of a geopolitical forecasting tournament were put on elite teams. Instead of regressing to the mean, they did even better relative to the field in years 2 and 3, while the next-best forecasters slid back. (246) |
| *How much do you believe your results?* (Eric Neyman, 2023, `lw:nnDTgmzRrzDMiPF9B`) | LessWrong post | In a toy Bayesian model where each trial's noise is unknown, a bigger result stops being better news past about 2.8: the best estimate of true quality peaks there, then falls. No measured result makes the estimate land in the top quartile. (239) |
| *The Funding Effect* (Robust Reasoning Processes wiki) | QURI wiki page | Industry-funded drug and device studies reach favorable conclusions more often (RR 1.34). In this page's model, spin alone weakens such a conclusion but never turns it against the claim. With illustrative inputs it keeps about 44% of its weight. (245) |
| *Manual for the Solution of Military Ciphers* (Parker Hitt, 1916, `ia:manualforsolutio00hittrich`) | old scanned book | In 1916 an Army captain wrote that of the hundreds of real cipher messages he had examined, at least nine-tenths were solved by the methods in this manual. The usual failures were very short messages. (200) |

**What the exemplars measure.**
- **Length.** Every thread has 7 posts. They average 306 words and 1,823 characters, so a whole thread takes about 75 seconds at 240 words a minute. The hook alone is about 40 words, or 10 seconds.
- **Quotes.** All 42 quotes were found: 40 exactly after collapsing whitespace, and 2 only after joining words hyphenated across OCR line breaks. The letters-and-digits fallback was never needed.
- **Numbers.** All 83 numbers in posts without `approx` appear in their source. The count leaves out section and page references, which are checked as places, not as numbers.

## 2. The thread

### Posts

| # | `kind` | Required | What it says | Lead-in |
|---|---|---|---|---|
| 1 | `hook` | always | The single most interesting true thing for a reader who knows the field: a result with its number, a sharp question the item answers, or a surprising contrast. It names the condition the result depends on (model, sample, assumption, "in a toy model", "in one example"). | none |
| 2 | `finding` | always | What they found, with numbers and conditions; a pooled or overall estimate before a subgroup's | none, or "Why:" when it gives the reason for the hook |
| 3 | `method` | when there is one | How, in one or two sentences; "a model, not data" when it is | "How:" |
| 4 | `figure` | when a figure, table or plate carries the result | The figure's id and a one-line reading of what to see in it | the figure's label |
| 5 | `implication` | usually | The decision, practice or belief that should change, and when | "What it changes:" |
| 6 | `caveat` | always | One caveat: the one that, if true, most weakens the hook or the finding, preferably one the item itself states | "Caveat:" or "Limits:" |
| 7 | `read` | always (not with `basis: 'abstract'`) | "Read it if…" for a specific reader: which sections or pages are worth the time, and what to skip | "Read it if" |

**Order and counts.**
- The posts appear in the order of the table.
- **Every post adds a fact no earlier post gave.** Cut a post rather than pad it. A short or thin item gets four posts: hook, finding, caveat and read.
- A number may come back in a later post only to add its interval or condition (the Funding Effect's RR 1.34 and its CI), or in the caveat that qualifies it (its 44%).
- A kind may appear twice only to stay within 7 posts. No exemplar needed to.

**Lengths.** The hook is at most 260 characters and three sentences; every other post is at most 280 characters. The exemplar hooks run from 200 to 257 characters and the other posts from 208 to 280.

### Rules for the words

Rules marked *(new)* or *(tightened)* come from the editorial pass; section 9 gives the failure behind each.

- **Plain words and short sentences.** No hype words ("groundbreaking", "game-changing", "revolutionary", "huge", "stunning", "breakthrough"). No emoji, hashtags, "a thread", or "1/". The UI numbers the posts.
- **No clickbait.** No question the thread does not answer and no cliffhangers. The hook states the thing itself.
- **The hook is the result an expert would not have predicted** *(new)*. A known result the item builds on (shrinkage, regression to the mean) is setup, not the hook.
- **One example is one example** *(new)*. A single illustrative case (one question, one message, one worked example) is called that, and the post gives the aggregate result when the source has one.
- **Numbers come from the document** *(tightened)*. Every number in a post must appear in the source text, and so must every number word (half, twice, a tenth, dozens, hundreds, thousands, nine-tenths), as the word or its value. Size words with no source ("a short manual", "a large pool") are left out. Do not compute new numbers (12% from 341 of 2,857, for example).
- **Pooled before subgroup** *(new)*. When the source gives an overall or pooled estimate and a subgroup or single-study one for the same question, the pooled one comes first, or the post says the one it gives is a subgroup. "Not significant" is kept when the source says it.
- **Paraphrase may shorten, never strengthen** *(new)*. Keep the direction of a rule ("if not A, then B" does not become "if A, then not B"), its units ("within 5%" does not become "within 5 points"), its scope ("in this dataset", "for binary questions") and its comparisons ("stayed ahead" is not "the same gap"). Describe a selection as it was done ("the top 5 from each of 12 conditions" is not "the top 60").
- **Hedges stay in the sentence that makes the claim** *(tightened)*. What the authors expect, hypothesise, speculate or illustrate is not what they showed. Keep the document's own word ("we expect", "illustrative", "suggests", "in one analysis") in the same sentence as the claim, including in figure and implication posts.
- **Chart readings are labelled.** A figure post may give values read off a chart. It says "about", ends with "Values read off the chart.", and sets `approx: true`. *(tightened)* When a reading disagrees with a number the text states, the post says so.
- **Two values, both or neither** *(tightened)*. When the source gives two values for the same thing, give both, each with where it comes from, or neither. Prefer neither when the post does not need the value: the Hitt method post now gives the vowel and LNRST shares, on which his table and his rule agree, and leaves out the JKQXZ share, on which they do not.
- **Quotation marks mean verbatim.** Words inside quotation marks in a post must be copied from the source, like the post's own quote. The verifier checks any quoted phrase of three or more words.
- **No outside knowledge.** Who did the work is said only as the source says it, and names are spelled as the source spells them ("the Abbe Tritheme", not "Trithemius") *(tightened)*. This is stricter than the highlights' `why`, which allows sure outside context. Thread posts are read as claims about the document.
- **The implication names a change, not an audience** *(new)*. It starts "What it changes:" and names the decision, practice or belief, and when it applies. "Anyone who…" is not a post.
- **The caveat is the real one** *(new)*. One caveat, the one that most weakens the hook. Look first at the item's limitations section, its footnotes and any sentence offering an alternative explanation. No asides: a caveat post is not a place for a leftover fact.
- **Pages in prose.** Write the page numbers the reader sees: printed pages, which for arXiv PDFs equal the 1-based PDF page. Chips render the exact place from `cite`, not from the prose. `spans` hold only recommended ranges, never the ones to skip *(tightened)*.

### Citations

Each post has one `cite`, the place a checker opens to confirm the post:

| Field | Meaning |
|---|---|
| `quote` | Required. At most 25 words, copied character for character from one block. It must be contiguous: no ellipses and no stitching. In scans a word hyphenated across a line may be joined. A fragment of a longer sentence is allowed. |
| `loc` | The block marker of `llm-highlights.md` section 3: an arXiv LaTeXML id (`S5.SS3.p1`, `S1.F4`, `S5.T2`), a post or web block `p<N>`, `img<N>`, `tbl<N>`, the new `fig<N>` (section 8), or a scan page `k<N>`. For PDFs without HTML the model answers with the `[p. N]` marker and the verifier stores `page`. A LaTeXML footnote is cited by the paragraph that holds it (`S6.SS0.SSS0.Px1.p1` for the CCS caveat). |
| `page` | 0-based: the PDF page index (arXiv items are PDFs in the app, so they get one too), or the scan's page `k` (the IA BookReader `n<k>` index). Flow documents (posts, web pages) leave it out, because their stable pages are computed in the browser and `loc` is the anchor. **The verifier sets it, never the model.** |
| `label` | The printed page, when it differs from `page + 1` (scans, journal PDFs: `"271"`, `"vi"`). |
| `sec` | The section: the LaTeXML section id (`S5.SS3`) or the web page's heading id (`from-odds-ratios-to-a-likelihood-ratio-discount`). It drives "§5.3" chips and `#anchor` links to the original. |
| `fig` | Figure posts: the figure's id. This is the LaTeXML id, `img<N>`/`fig<N>`/`tbl<N>` for posts and web pages, the profile figure id `<k>.<j>` (`figureList()` in `server/augment.mjs`) for PDFs without HTML, or `k<N>` for a scan page. |
| `spans` | Read posts: the recommended ranges as `[from, to]` pairs, 0-based pages or block markers. They become track bands and chips ("pp. 18–21"). |
| `ok`, `match` | Added by the verifier: whether the quote was found, and how (`exact`, `joined` or `skel`). |

**Departures from the requested schema.** The request listed `cite: { page?, sec?, fig?, quote? }`. This note adds four fields:
- `loc`, because a section is too coarse an anchor for posts and wiki pages;
- `label`, so scans show their printed pages;
- `spans`, for read posts;
- `ok` and `match`, for the verifier.

### Basis

| `basis` | Text the model read | Rules |
|---|---|---|
| `html` | arXiv LaTeXML, a post's `htmlBody`, or a web page's main content | All post kinds |
| `fulltext` | PDF text (profile `text.txt` or `pdftotext`) or scan OCR | All post kinds. Figures are page boxes or profile figures. |
| `abstract` | Abstract only, because no text could be read | At most 4 posts: hook, finding, method and a caveat that names what the abstract leaves out. No figure post, no read post, no page cites (`loc: "abstract"`). The card says "from the abstract". |

## 3. `data/threads.json`

```ts
{
  built: '2026-10-15',
  version: 'threads-v1',          // the prompt and schema version; a new version re-runs everything
  items: { [itemId: string]: Thread }
}

type Kind = 'hook' | 'finding' | 'method' | 'figure' | 'implication' | 'caveat' | 'read';

type Cite = {
  quote: string;                    // ≤ 25 words, verbatim from one block
  loc?: string;                     // block marker (S5.SS3.p1, p52, img20, fig0, k72)
  page?: number;                    // 0-based PDF page or scan page; set by the verifier
  label?: string;                   // printed page
  sec?: string;                     // LaTeXML section id or web heading id
  fig?: string;                     // figure posts: S1.F4, img20, fig0, tbl0, '4.0' (profile fid), k15
  spans?: [number | string, number | string][];   // read posts; recommended ranges only
  ok?: boolean; match?: 'exact' | 'joined' | 'skel';  // verifier
};

type Post = {
  kind: Kind;
  t: string;                        // hook ≤ 260 characters, others ≤ 280
  cite: Cite;
  approx?: true;                    // figure post with values read off a chart
};

type Thread = {
  title?: string;                   // for people reading the file; the app uses corpus.json
  posts: Post[];                    // 4–7, hook first
  figure?: {                        // the thread's picture: a figure id, or a page box
    fig?: string; part?: number;    // part: one panel of a multi-panel arXiv figure (index into /figures parts)
    img?: string;
    page?: number; label?: string;
    box?: [number, number, number, number];   // x0, y0, x1, y1 as fractions of the page
  };
  tags?: string[];                  // 3–5, lowercase
  model: string;                    // e.g. 'claude-sonnet-5-5'
  basis: 'fulltext' | 'abstract' | 'html';
  written: string;                  // date
  checks?: { quotes: [number, number]; numbers: [number, number]; flags?: string[] };  // verifier: found / total, review flags
  usd?: number; tok?: [number, number];                              // as in highlights.json
};
```

**Size.** An exemplar item is about 3.8 KB of compact JSON, or 1.7 KB gzipped on its own. For all 1,948 items that comes to about 7.4 MB. Serve threads through the feed route (section 7), not as one static file.

**One complete item from `exemplars.json`:**

```json
"web:reasoning-processes.quantifieduncertainty.org/case-studies/the-funding-effect": {
  "posts": [
    {"kind": "hook", "t": "Industry-funded drug and device studies reach favorable conclusions more often (RR 1.34). In this page's model, spin alone weakens such a conclusion but never turns it against the claim. With illustrative inputs it keeps about 44% of its weight.", "cite": {"loc": "p0", "quote": "funding bias can weaken a favorable conclusion toward worthlessness; turning it into evidence against the claim takes a second mechanism, selection on the truth", "ok": true, "match": "exact"}},
    {"kind": "finding", "t": "The data, quoted from reviews: for drugs and devices, RR 1.34 (95% CI 1.19–1.51), and funded studies' conclusions match their own results less often (RR 0.83). In nutrition and tobacco, ORs reach 7.6 and 88, but pooled nutrition studies give RR 1.31, not significant.", "cite": {"loc": "p43", "sec": "the-numbers", "quote": "the effect is modest and tight (RR ~1.3; pooled OR ~3.6); in nutrition and tobacco it is much larger (OR 7–88)", "ok": true, "match": "exact"}},
    {"kind": "method", "t": "How: a funder who makes favorable conclusions k times likelier, whether or not the claim is true, leaves the likelihood ratio unchanged. Spin, reporting unfavorable conclusions as favorable at rate s, pulls it toward 1, never past. Only selection on the truth can flip the sign.", "cite": {"loc": "p50", "sec": "from-odds-ratios-to-a-likelihood-ratio-discount", "quote": "Under any bias applied regardless of the truth, a funded favorable conclusion stays (weak) evidence for H.", "ok": true, "match": "exact"}},
    {"kind": "figure", "t": "Chart (fig0): a funded favorable conclusion's likelihood ratio against spin rate s, falling from 4 toward 1, never below. Lundh's estimate sits at s ≈ 0.34, ratio ≈ 1.8. If funders of failing products were twice as likely to produce such a study (illustrative), it is 0.92.", "cite": {"loc": "p51", "sec": "from-odds-ratios-to-a-likelihood-ratio-discount", "fig": "fig0", "quote": "Spin alone weakens a funded favorable conclusion toward worthless but never past it; only selection on the truth can make it count against H.", "ok": true, "match": "exact"}},
    {"kind": "implication", "t": "What it changes: discount a sponsored favorable conclusion; invert it only if funders plausibly select on the truth. The discount belongs to the funding arrangement, not the source's character, and the result–conclusion gap is a candidate spin signal that needs no ground truth.", "cite": {"loc": "p63", "sec": "open-questions", "quote": "It needs no ground truth, only consistency between a study’s data and its conclusion.", "ok": true, "match": "exact"}},
    {"kind": "caveat", "t": "Caveat: the 44% assumes the whole effect is spin and uses illustrative inputs (an independent likelihood ratio of 4). The reviews' ratios cannot separate spin from selection, and if sponsors simply fund products likely to work, the conversion overstates spin.", "cite": {"loc": "p50", "sec": "from-odds-ratios-to-a-likelihood-ratio-discount", "quote": "The ratios in the table cannot separate these.", "ok": true, "match": "exact"}},
    {"kind": "read", "t": "Read it if you assess sponsored research: the table and the derivation ('The numbers' and 'From odds ratios to a likelihood-ratio discount') are the core. 'Open questions' lists four next steps, each a measurement.", "cite": {"loc": "p61", "sec": "open-questions", "spans": [["p5", "p53"], ["p59", "p63"]], "quote": "Is the gap between the tight drug estimates (~1.3×) and the large, wide nutrition/tobacco ones real, or an artifact of sample size and coding latitude?", "ok": true, "match": "exact"}}
  ],
  "figure": {"fig": "fig0"},
  "tags": ["conflicts of interest", "likelihood ratios", "meta-science", "evidence"],
  "model": "claude-opus-5-5 (hand-written exemplar, editor revision)",
  "basis": "html",
  "written": "2026-10-15",
  "checks": {"quotes": [7, 7], "numbers": [18, 18]}
}
```

**The other five exemplars show the other source kinds:**
- arXiv cites carry the LaTeXML id and the 0-based PDF page;
- the Mellers PDF uses a profile figure id (`"4.0"`) and a page box;
- the scan cites `page: 72, label: "63"`;
- the read posts use page `spans`;
- four figure posts set `approx` (2207.05221 Figure 4, 2312.10029 Figure 3, Mellers Figure 1, and Neyman's two charts).

## 4. Checking a thread

The verifier runs on the batch results before anything is written. A proposed `server/lib/threads-verify.mjs` reuses `findQuote()` and `skel()` from `server/routes/30-summarize.mjs`. The exemplars were checked with `verify.py` next to this file, which implements checks 1, 3, 4, 8 and 9, and the length and lead-in parts of 6.

1. **Quotes.** Each quote is matched in three tiers, in order: exact (after collapsing whitespace), joined (after also joining `word- word` across OCR lines), then skeleton (letters and digits only).
   - It is matched first in the block that `loc` names, then anywhere. A quote found elsewhere gets its `loc` corrected.
   - **A post whose quote is not found is dropped.** It is not shown with `ok: false`. The highlights keep failed passages; a thread post makes a claim, so it needs its anchor.
   - Quotes longer than 25 words are dropped.
2. **Pages.** For PDFs and arXiv items, `page` comes from where the quote sits in the page-marked text: the profile's `text.txt`, else `pdftotext`, as in `textFor()` in `server/augment.mjs`. For scans it comes from the OCR page.
   - Writing the arXiv exemplar by hand, 4 of the 7 pages I guessed for `arxiv:2207.05221` were one page off. Pages are always computed. The revised pages of both arXiv exemplars were recomputed from the PDFs and all match.
3. **Numbers.** Every number in `t` must occur in the source's full text, after removing thousands separators and mapping `−` to `-`. "§5.3"-style section numbers and "p. 271"-style page numbers are skipped, and so are `approx` figure posts.
   - **A post with an unmatched number is dropped.** All 83 numbers in the exemplars matched.
   - **Number words** *(new)*: half, third, quarter, tenth, twice, double, triple, dozen, hundred, thousand, million, billion and fractions like "nine-tenths" must occur as the word or its value ("a tenth" passes on "10 percent"). A miss drops the post. The check matches anywhere in the document, so it is weak: it would not have caught the original Mellers hook's "a pool of thousands", because the paper says "thousands of lives" in another context. The prompt rule carries that case.
   - For web pages the full text includes figure `aria-label`s and SVG `<text>`. The Funding Effect's "0.92" appears only in its chart.
4. **Inline quotations.** A quoted phrase of three or more words inside `t` must be found in the source, or the post is dropped.
5. **Figures.**
   - `fig` and `figure.fig` must resolve: a LaTeXML id in `/figures`, a block marker of the item, a profile figure id, or a page within the scan.
   - A figure post whose figure does not resolve is dropped.
   - `figure.part` must index the figure's `parts`.
6. **Shape and words.**
   - Lengths, the post count (4–7, hook first), banned words and emoji are flagged.
   - An over-length post is kept up to 320 characters, and dropped beyond that.
   - **Lead-ins** *(new)*: `method` starts "How", `implication` "What it changes:", `caveat` "Caveat:" or "Limits:", `read` "Read it if". A miss is flagged. The original CCS read post had none.
7. **The whole thread.** A thread is written only if all of these hold:
   - its hook survives;
   - at least 4 posts remain;
   - at least one remaining post is not the hook, the method or the read post.

   Otherwise the item goes on the retry list with its reasons.
8. **Lost hedges** *(new, a flag, not a drop)*. If the cited block contains "we/they/the authors expect", "hypothesise", "speculate", "suspect", "illustrative", "suggest(s)" or "candidate", and the post contains no hedge (expect, hypothesise, illustrative, suggest, may, might, probably, candidate, "the authors say/call/report", "in a toy model", "example"), the post is flagged in `checks.flags` for the pilot's reader review. Flow documents use the `p<N>` block; LaTeXML and PDF text use 400 characters on either side of the quote.
   - On the original exemplars it flagged two posts, and both were real failures: the CCS implication (the paper "expects" what the post asserted) and the Funding Effect figure post (it dropped "an illustrative value"). On the revised exemplars it flags none. Six threads are too few to trust its false-positive rate; count flags against reader verdicts in the pilot.
   - "likely" is not on the post's list: "twice as likely" is a number, not a hedge, and counting it hid the Funding Effect failure.
9. **Repeats** *(new, a flag)*. A number of two or more characters that appears in two posts, other than the figure and read posts, is flagged; a number attached to a unit letter ("52B", "70B") is skipped. A repeat is allowed when the later post adds the number's interval or is the caveat qualifying it. On the original exemplars it flagged three threads: Mellers' AUC pair (96% and 75% in both the hook and the finding), which was padding; Mellers' 60 and the Funding Effect's 1.34 and 44, which are allowed; and Neyman's 10, a coincidence ("10%" and "top 10").
10. **Hooks of one example.** No check catches a hook built on one illustrative case or on the textbook point. The pilot's reader review looks for both.

## 5. The prompt (`threads-v1`)

**Input.** The input is the highlights request of `llm-highlights.md` section 5: the same marked blocks, the same 100,000-character cap and the same caption budget. One addition: `fig<N>` blocks carry a web figure's `aria-label` and drawn text.

**Shared call.** The thread fields join the highlights schema in one call:
- the request pays for the ~22,000 input tokens once;
- the job writes `data/highlights.json` and `data/threads.json` from the same response.

**Examples.** Two exemplars from `exemplars.json` go in as worked examples:
- for papers: the CCS paper and the LessWrong post, because their hooks show the two judgments the review found hardest (a contrast, and the unpredicted result over the textbook one) and their caveats come from the item's own footnote and open questions;
- for scans: the Hitt manual and the CCS paper.

They add about 2,500 tokens, about 11% more input, which raises the costs in section 6 by about 7%. The revised system prompt is about 350 tokens longer than the first draft, under 2% more input.

**System prompt (the part after the highlights instructions):**

```
Then write a thread about the document: 4 to 7 posts that let this reader decide in seconds whether to open it, and leave them with the result if they don't. The reader runs a forecasting and epistemics research institute and reads AI safety, machine learning, forecasting, rationality and old technical books. They know these fields, dislike hype, and want precise, checkable statements with uncertainty stated.

Before writing, find in the document: (a) the result a reader who knows the field would not have predicted; (b) every hedge attached to it ("we expect", "we hypothesise", "illustrative", "suggests", "in one example"); (c) its own limitations, footnotes and alternative explanations.

Posts, in this order:
1. hook (always): the single most interesting true thing, which is (a), not the known result the document builds on. State the result itself, with the condition it depends on (the model, the sample, the assumption, "in a toy model"). If it rests on one example, call it one example and give the aggregate if the document has one. At most 3 sentences and 260 characters.
2. finding (always): what they found, with numbers and conditions. Give an overall or pooled estimate before a subgroup's, and keep "not significant" when the document says it.
3. method: how, in one or two sentences, starting "How:". Say "a model, not data" when it is one.
4. figure: the figure, table or plate that carries the result, cited by its marker, and what to see in it. Values you read off a chart rather than from the text: say "about", end with "Values read off the chart.", and set approx to true. If a reading disagrees with a number the text states, say so. Leave this post out when nothing is worth looking at.
5. implication: start "What it changes:" and name the decision, practice or belief that should change, and when. Never "anyone who".
6. caveat (always): start "Caveat:" or "Limits:". One caveat: the one that, if true, most weakens the hook. Prefer one from (c). No asides.
7. read (always): "Read it if" and a specific reader, then which sections or pages are worth the time, and what to skip; give spans as marker pairs for the recommended ranges only.
Every post adds a fact no earlier post gave; a number comes back only to add its interval, or in the caveat that qualifies it. Cut a post rather than pad one: four posts (hook, finding, caveat, read) are fine. Posts after the hook: at most 280 characters.

Every post cites one place: loc, the marker of the block its quote comes from; fig, for the figure post; quote, a contiguous piece of that one block of at most 25 words, copied character for character (no ellipses, no stitching, no markers; in scans you may join a word hyphenated across a line). Choose the quote that best supports the post's main claim.

Words:
- Plain words, short sentences. No hype words, emoji, hashtags or "a thread". No questions you don't answer, no cliffhangers.
- Every number, and every number word (half, twice, a tenth, hundreds, thousands, nine-tenths), must appear in the document, except chart readings in the figure post. No size words the document does not use ("short", "large pool"). Do not compute new numbers. If the document gives two values for the same thing, give both, each with where it comes from, or neither; prefer neither when the post does not need it.
- Paraphrase may shorten, never strengthen. Keep the direction of a rule ("if not A then B" is not "if A then not B"), its units, its scope and its comparisons. Describe a selection as it was done.
- Keep every hedge from (b) in the sentence that makes the claim, in the document's own word. What the authors expect, hypothesise or illustrate is not what they showed.
- Put words in quotation marks only when they are copied exactly from the document.
- Use only the document; say who did the work, and spell names, only as it does.
- Write for someone who knows the field but not this document; define a term in a few words the first time it appears.
Software checks every quote, number, number word and quoted phrase against the document and deletes any post that fails. It flags any post whose cited block hedges when the post does not.
```

**Output schema** (added to the highlights schema as `thread`). It uses the `str`, `obj` and `loc` helpers of `llm-highlights.md` section 5. Structured outputs require every field, so optional ones are `""` or `[]`:

```js
thread: obj({
  posts: {
    type: 'array',
    description: '4 to 7 posts in order, hook first.',
    items: obj({
      kind: { type: 'string', enum: ['hook', 'finding', 'method', 'figure', 'implication', 'caveat', 'read'] },
      t: str('One paragraph. Hook at most 260 characters, others at most 280.'),
      approx: { type: 'boolean', description: 'True only for a figure post giving values read off a chart.' },
      cite: obj({
        loc,
        fig: str('Figure post: the figure marker (S1.F4, img6, fig0, tbl0, k27); otherwise "".'),
        quote: str('At most 25 words copied exactly from the block named by loc.'),
        spans: { type: 'array', description: 'Read post: [from, to] marker pairs of recommended ranges; otherwise [].', items: { type: 'array', items: { type: 'string' } } },
      }),
    }),
  },
  tags: { type: 'array', items: { type: 'string' }, description: '3 to 5 lowercase topic tags.' },
}),
```

**Request.** The request is the highlights `params()`, with two changes:
- `max_tokens` goes from 8,000 to 12,000;
- effort goes from `low` to `medium`, because the hook and the caveat are judgment calls.

The pilot (section 6) decides whether `medium` earns its cost on Haiku.

## 6. Generating them, and the cost

**The job.** `bin/highlights.mjs` (proposed in `llm-highlights.md` section 6) becomes `bin/picks.mjs`: build the text, count tokens, submit one batch, poll, verify, write both files.
- **Non-arXiv PDFs.** `llm-highlights.md` skips the 100 PDFs without HTML because the server cannot read them. But `textFor()` in `server/augment.mjs` already runs `pdftotext` on a cached PDF, so threads can cover those PDFs wherever poppler is installed. The Mellers exemplar was written from exactly that text.

**Cost assumptions.** Prices and request sizes come from `llm-highlights.md` section 7:
- 22,300 input tokens per item;
- 3,000 output tokens per item, covering the thread (about 1,100 tokens of JSON), the highlights (450) and thinking. The range is 1,500–4,500.

| Model | Per item, batch | Reader's lanes (AI safety, DeepMind safety, LLM, forecasting, LessWrong, QURI: 1,436 items) | Whole corpus (1,948) |
|---|---|---|---|
| claude-haiku-5-5 | $0.0019 | $2.70 | $3.60 |
| claude-sonnet-5-5 | $0.037 | $54 | $73 |
| claude-opus-5-5 | $0.075 | $107 | $145 |

**Recommendation.**
1. **Pilot.** Run the 18 items that already have hand picks on all three models at standard prices. These are the 6 exemplars and the 12 items in `data/highlights.sample.json`; the pilot costs about $0.07 on Haiku, $1.34 on Sonnet and $2.69 on Opus.
2. **Score the pilot two ways:**
   - **mechanically:** the share of posts the verifier keeps, the share of threads it rejects, and the flags of checks 8 and 9;
   - **by the reader:** a blind pairwise choice between the model's hook and the hand-written one, for the 6 exemplars, and between models for the other 12. For each thread the reader also answers two yes/no questions: is the caveat the real one, and does any post claim more than its source? This takes about 15 minutes.
3. **Main run.** Sonnet over the reader's six lanes (about $54 at batch prices), and Haiku for the oddities, TTRPG, information theory and cybernetics lanes (about $1).
   - Use Opus for the reader's lanes only if its hooks win the blind comparison clearly.
   - The job states its estimate and asks first, as `augment-batch.mjs` does. Like the highlights job, it charges `spend.json` for what it spent, so a $54 run uses up many days of the default $3 daily budget. The reader starts it deliberately.

**Measured on the exemplars.** Writing six threads by hand took a full reading of each source. For the papers, it also took the pages that carry the figures. Four of the six figure posts needed values read off charts the text does not state (2207.05221 Figure 4, 2312.10029 Figure 3, Mellers Figure 1, Neyman's two charts).
- A text-only model can write those figure posts only from captions and citing sentences.
- The vision add-on of `llm-highlights.md` section 7 (six figure thumbnails, about 14% more input) is what lets it read the chart. The pilot should run with and without it.

## 7. In the Feeds view

**Server.**
- In `server/lib/extract.mjs`: add `FEEDS.threads = { types: ['thread'], per: 1 }`. `cardsFor('threads')` builds `{cid: id + '#th', id, type: 'thread', posts, figure, basis, model, checks}`. The figure resolves through `hlPics()` and the cites through `locOf()`, as highlight cards already do.
- In `server/routes/66-extract.mjs`: a `threads()` loader, a copy of `highlights()` that re-reads `data/threads.json` when its mtime changes. The `threads` feed lists only items that have a thread.
- `GET /threads?id=` serves one item for the side panel.

**Cards.** Threads becomes the first feed, and the default first stream in Columns. Pictures stays the Board's default.
- **Collapsed card** (Columns and Board):
  - **Head:** the 48 px avatar, the title (italic, one line), the year and the lane.
  - **Body:** the hook in 17 px type, then the thread's picture at column width, at most 260 px tall.
  - **Footer:** "7 posts · 1 min · ✓ 7/7 · AI", plus "from the abstract" when `basis` says so.
- **Expanded card** (click, `t`, or Space on a focused card): posts 2–7 open in place.
  - Each post shows its number ("2/7") and its text.
  - Under the text, its quote in smaller grey serif with ✓ and a place chip: "p. 19 · §5.3", "¶ 52" or "p. 63". A click dives there with `findPage` and `highlight('snip', …)`, as `feed-ideas.md` section 2 describes.
  - A figure post shows its figure, or the one panel `part` names, inline.
  - When `approx` is set, the chip reads "≈ read off the chart".
- **Stack layout:** three expanded threads side by side, snapping one row at a time.
- **Peek:** the whole thread on the right, with the picture large.

**Keys.**
- `t`: expand or collapse.
- Space: next post, then the next thread.
- Enter: dive to the focused post's place.
- `o`: the original at that place, through `href` from `locOf()`.
- `q`: put the post's quote and page into the item's note, with `appendQuote()`.
- `s`, `x` and `m` work as on every card.

**Item view.** An optional "Thread" section in the side panel (`registerSection`, order 22) shows the same thread beside the pages. Its chips move the reader to each cited place.

**Signals.** Telemetry records expands, posts reached, dives and time per thread. The learned profile can treat a dive from a thread like opening the item.

## 8. What writing the exemplars showed

Each finding changed the format or names a fix outside it.

1. **Good hooks name a result and its condition.**
   - Four of the six hooks carry a quantity (18%→78%; about 2.8 and the top quartile; RR 1.34 and 44%; nine-tenths). CCS and Mellers are contrasts whose surprise is the direction; their numbers follow in post 2.
   - Two first drafts were true only under a condition they left out:
     - **Mellers.** The draft said "75% for all other forecasters", but 75% is the "all others" group; the next-best group scored 84%.
     - **Funding Effect.** The 44% exists only in the page's worked example, with an illustrative likelihood ratio of 4.
   - **Change:** the prompt says "name the condition the result depends on". No check catches this, so the pilot's reader review looks for it.
2. **Figure posts need chart readings.**
   - Four of six figure posts give values only a chart shows (calibration error about 0.14 → 0.02; probe accuracy about 95% → 50%; Brier bars about −0.34 → −0.40; Neyman's peaks about 0.64 and 0.57).
   - **Change:** `approx: true`, the fixed phrase "Values read off the chart.", and an exemption from the number check.
   - The other two used numbers the source states: the QURI chart's labels and Hitt's table.
3. **Sources contradict themselves.**
   - Hitt gives the rare letters JKQXZ as 2% of English text in Table I and as 3% in the rule on p. 24.
   - Mellers' Table 1 gives superforecasters an average standardized Brier score of −0.34 over years 2 and 3, while Figure 1's bars read about −0.40 and −0.38.
   - **Change:** "give both, with where each comes from, or neither; prefer neither". The Hitt method post now leaves JKQXZ out; the Mellers figure post states the disagreement, since the chart is the post's subject.
4. **Quotes.** A 25-word limit means fragments: many quotes are a contiguous piece of a longer sentence. `findQuote()` matches these as substrings, so fragments are allowed and stitching is not.
5. **Pages must be computed.** As section 4 notes, 4 of my 7 hand-guessed PDF pages for `arxiv:2207.05221` were one off. The arXiv items are PDFs in the app (`kind: 'pdf'`), so every arXiv cite needs a PDF page as well as its LaTeXML id.
6. **The paragraph rule drops nested list items.**
   - The leaf-block rule (`blocksOf()` in `server/lib/extract.mjs`, `llm-highlights.md` section 3) gives no block to the text of an `li` that contains a nested list.
   - In Neyman's post, three such texts are in no block, including the main takeaway: "When you encounter a study, always ask yourself how much you believe their results." No quote from them can get a `p<N>` marker, and the model never sees them as blocks. (Rerunning `postBlocks()` from `highlights-batch.mjs` on the post confirms it: block `p96` is followed by the second takeaway, `p97`.)
   - **Fix:** make the direct text of such an `li`, up to its nested list, a block. To keep existing markers stable, number these blocks with a suffix such as `p96a`, rather than renumbering.
7. **QURI wikis draw their charts as inline SVG.**
   - The Funding Effect's chart is an `<svg role="img">` inside a `<figure>`. Its `aria-label` states the chart's numbers. It has no `img` marker, so neither the Pictures feed nor the model sees it.
   - A copy of the page fetched at 18:35 today, kept in the session scratchpad, has no chart at all: the page gained it later. A cached web page can lag the page the reader sees, so the thread job should fetch fresh or record the fetch time.
   - `extraction-yields.md` counted QURI images at 9% of pages without counting inline SVG figures, so that count should be redone.
   - **Change:** a `fig<N>` marker for `<figure>` elements and `role="img"` SVGs, numbered separately like `img<N>` and `tbl<N>` so no other marker moves. Its block text is the `aria-label` plus the drawn `<text>`.
8. **Scan pages may be one off in `/ocr/text`.**
   - **The evidence, for the Hitt scan:**
     - In the Internet Archive viewer, page `n0` is the cover and `n10` is "Chapter I". These are hOCR pages 0 and 10, so the viewer's index and the hOCR index agree.
     - `_page_numbers.json` lists 118 leaves numbered 1–118, while the hOCR has 122 pages and there is no `_djvu.xml`.
     - With no printed labels and no `_djvu.xml`, `leafOffset()` in `server/routes/50-ocr.mjs` falls back to `d = 0`. So `hocrPage(k) = leafNum[k] = k + 1`, and `n` is 118 rather than the corpus's 122.
   - **The consequence:** if this reading of the code is right, the app shows the OCR text of page k + 1 beside the image of page k for books like this one.
   - The exemplar cites the viewer index (`k`), which the image URLs use; the page image `n15` does show Table I under the printed "—6—". Check this in the running app before scan cites rely on `/ocr/text`.
9. **Seven posts invite padding.** Every exemplar has seven posts, and the first drafts filled all seven kinds, but four posts were padding or a misfiled fact: Hitt's caveat ended on an aside about a rotary cipher machine, Neyman's method ended on "The post works it through with plots and a little algebra", the 2207.05221 finding opened on "Main result:", and the Hitt "implication" was an anecdote with no implication. **Change:** "every post adds a fact no earlier post gave; cut a post rather than pad one", and the lead-in "What it changes:" makes a misfiled post visible. Seven is still the natural length for a full paper; the hook alone carries the card, and the other six are about a minute of reading.

## 9. What the editorial pass found

A second reading of every source, with the figures and the scan page in front of me, judged each post on five questions: is the hook the most interesting true thing, would a busy researcher stop, is every claim accurate and cited, are numbers given with their conditions, and is the caveat the real one. All 42 original posts had passed every mechanical check. 39 were changed, several only in a phrase; the 11 failures below each changed a rule.

| Failure | Where | Rule now |
|---|---|---|
| The hook was the textbook point, not the surprise | Neyman: the hook was shrinkage ("only 10% of your belief"); the post's own novel result is that with unknown noise the estimate peaks at a result of about 2.8 and no result reaches the top quartile | The hook is the result an expert would not have predicted |
| One example presented as a result | 2207.05221: 18% → 78% is one hand-picked question; the paper also shows the effect across TriviaQA (Figure 18) | One example is one example; give the aggregate |
| Invented or misdescribed quantities | Mellers: "a pool of thousands" (no such sentence about forecasters); "60 top forecasters" (they were the top 5 of each of 12 conditions); Hitt: "this short manual" | Number words and size words need a source; describe a selection as it was done |
| A hedge was dropped | CCS implication: "Capable models represent other agents' beliefs", where the paper says "we expect"; Funding Effect figure: the 2× selection lost "an illustrative value" | Hedge in the same sentence; block-level hedge flag (check 8), which catches both |
| A subgroup stood in for the field | Funding Effect finding: nutrition's OR 7.6 (one study of interventional articles), without the pooled nutrition RR 1.31, not significant | Pooled before subgroup; keep "not significant" |
| Paraphrase strengthened the source | Hitt method: "if the shares do not hold within 5%, certainly substitution" became its converse, with "5 points" for "5%"; Mellers: "the same gap" for quick forecasts, where the paper says the advantage was not eroded | Paraphrase may shorten, never strengthen |
| The caveat was not the real one | CCS: missed the paper's own footnote that the probe may only detect whether two "positive"/"negative" words match; 2207.05221: three numbers, but not the paper's own worry that P(IK) tracks question difficulty (its model-specific signal is "only around 6%"); Hitt: an aside that also overstated him ("he already expected machines", for a machine he proposed only for enciphering message headers) | One caveat, the one that most weakens the hook, from the limitations, footnotes or alternative explanations |
| The implication was boilerplate | All six began "Who should care: anyone…" | "What it changes:" plus a decision, practice or belief |
| A number was said twice | Mellers: AUC 96% vs 75% in both the hook and the finding | Every post adds a fact; repeat flag (check 9) |
| Conflicting values were hidden or explained awkwardly | Mellers figure post: chart readings that disagree with Table 1, unremarked; Hitt: "2–3% (he gives both figures)" | State a chart-text conflict; prefer neither value when not needed |
| Form slips | CCS read post had no "Read it if"; Hitt read spans included a range to skip; "Trithemius" for the book's "Abbe Tritheme" | Lead-in check; spans are recommended ranges only; names as the source spells them |

**What the review left alone.** The quotes, pages and figure ids were right; the chart readings in the original figure posts match the rendered charts; and three caveats (Mellers' confound, the Funding Effect's illustrative inputs, Neyman's assumed priors) were already the real ones.

**Two cautions about the rules.** Checks 8 and 9 are tuned on six threads, and only the pilot can say how often they cry wolf. And the rules that matter most here (the unpredicted result, the real caveat, the dropped hedge, the strengthened paraphrase) are judgments no check fully makes: they live in the prompt and in the reader's 15-minute review.

## 10. Open questions

- **Can Haiku write the hook and the caveat?** The other posts are close to extraction, but the hook is a judgment of what an expert would not have predicted, and the caveat a judgment of what most weakens it. The pilot's blind comparison decides the model per lane.
- **Should the hook come from the highlights' `claim` and `number`?** A two-step design would pick first and write second, which costs a second call. The one-call design asks for both at once. If the pilot's hooks are weak, try putting the picks, and the prompt's (a), (b) and (c), before the posts in the same schema, since fields stream in order.
- **A thread for every item, or only for papers and posts?** Scans with poor OCR (`ocr-poor` in the profile hints) may yield threads the verifier mostly rejects. Count rejections by lane in the first batch.
- **Refusals.** The highlights note expects Haiku to refuse some dual-use papers. A thread is longer and more assertive, so count refusals separately.
- **Staleness.** Threads are about documents, not the world. Even so, a 2021 forecast post's thread would read better with a "now checkable" line. That needs outside knowledge, which this format forbids. It belongs in a separate, labelled field if it is wanted.
