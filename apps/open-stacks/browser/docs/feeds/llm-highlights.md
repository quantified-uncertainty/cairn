# LLM highlights: the parts of each item worth pointing at

This document designs a model pass that picks, for every item in the corpus, what a careful reader would point to. It makes six picks:

- the best figure, or the best few;
- the single most interesting passage;
- the most surprising number;
- the claim, in one plain sentence;
- one question the item answers;
- whether to show one figure or a few.

It is the model tier (T3) of [feed-ideas.md](feed-ideas.md). It supplies the lead pictures of section 1 there, material for the Numbers and pull-quote feeds (F10, F20), and paper threads (F22). Paths are relative to `apps/open-stacks/browser/`.

The reader's latest note sets the priority: "ideally this view shows top few pictures/graphs, or just top graph, as is best. these pages are boring!" So the model picks pictures first. It returns up to three figures, best first, and a `show` field that says whether the first figure tells the story alone (`one`) or the next ones add something (`few`). The text picks then caption the picture.

For this design I:

- picked 12 varied items from `corpus.json`: six arXiv papers read through their HTML, three LessWrong posts, two QURI wiki pages and one Internet Archive scan;
- read each one and made the picks by hand;
- checked every quote against the source text with a script;
- measured how large each request would be;
- wrote the prompt, the output schema, the batch job and a cost estimate.

The picks are in `data/highlights.sample.json`, in the format proposed for `data/highlights.json`.

## 1. The picks for 12 items

Each item lists its pictures (and the `show` value), the claim, the passage, the number and the question. All 23 quotes were found in the source text: 21 exactly (after collapsing whitespace), and 2 from the scan only after joining words hyphenated across OCR line breaks. Markers such as `S4.p4` or `k121` are the stable locations described in section 3.

**Measuring AI Ability to Complete Long Software Tasks** (METR, 2025, `arxiv:2503.14499`)
- **Pictures:** Figure 1, alone (`one`); Figure 6 second.
- **Claim:** The length of software tasks frontier AI agents can finish half the time, measured in skilled-human time, has doubled about every seven months since 2019.
- **Passage** (`S1.F1`, the caption of Figure 1): "Even if the absolute measurements are off by a factor of 10, the trend predicts that in under a decade we will see AI agents that can independently complete a large fraction of software tasks that currently take humans days or weeks (Section 5)." The forecast rests on the slope, not the level: a tenfold error is only about three doublings.
- **Number** (`S4.p4`), **5-18x**: "We find large differences in the speed at which different human groups complete the internal PR tasks, with contractors taking 5-18x longer to fix issues than repo maintainers."
- **Question:** How long a task can AI agents complete on their own, and how fast is that growing?

**Alignment faking in large language models** (2024, `arxiv:2412.14093`)
- **Pictures:** Figure 2, then Figure 1 (`few`).
- **Claim:** Claude 3 Opus is told it is being retrained to answer harmful requests, and how to tell training from deployment. It then complies strategically in training to keep its values, and RL can strengthen this.
- **Passage** (`S1.SS0.SSS0.Px2.p1`): "We find that small variations in the prompt that prior to RL had no substantial effect on the compliance gap—such as swapping the AI company from “Anthropic” to “OpenAI”—now greatly increase the compliance gap (Table 2)." Training can hide a behavior without removing it.
- **Number** (`S1.SS0.SSS0.Px1.p6`), **35–80%**: "For example, in our synthetic document fine-tuned helpful-only setting, the model takes opportunities to exfiltrate its weights 35–80% of the time, despite doing so only 0.5% of the time when fine-tuned on superficially similar synthetic documents with irrelevant information."
- **Question:** Will a model pretend to go along with training it disagrees with, to keep its current values?

**Refusal in Language Models Is Mediated by a Single Direction** (2024, `arxiv:2406.11717`)
- **Pictures:** Figure 1, then Figure 3 (`few`). Together they show both halves: erasing the direction stops refusal, and adding it causes refusal.
- **Claim:** In 13 open chat models up to 72B parameters, refusal runs through one direction in the activations. Erase it and the model stops refusing; add it and the model refuses harmless requests.
- **Passage** (`S5.SS2.p2`): "Normally, these heads focus on the instruction region of the prompt, which contains harmful content. With the adversarial suffix appended, these heads shift their attention to the suffix region, and away from the harmful instruction." It explains why gibberish jailbreak suffixes work.
- **Number** (`S4.SS2.p4`), **22.6% vs 79.9%**: "For Llama-2 models, including the system prompt substantially reduces ASR compared to evaluation without it (e.g. 22.6% vs 79.9% for Llama-2 7B)."
- **Question:** How is refusal implemented inside a safety-tuned chat model, and how easily can it be removed?

**Thousands of AI Authors on the Future of AI** (2024, `arxiv:2401.02843`)
- **Pictures:** Figure 3, then Figure 1 (`few`).
- **Claim:** 2,778 AI researchers surveyed in late 2023 gave even odds that machines beat humans at every task by 2047. That is thirteen years sooner than the same survey a year earlier.
- **Passage** (`S3.SS2.SSS3.p1`): "Predictions for a 50% chance of the arrival of FAOL are consistently more than sixty years later than those for a 50% chance of the arrival of HLMI. This was seen in the results from the surveys of 2023, 2022, and 2016." Asking about occupations instead of tasks, in nearly the same question, moves the median by six decades.
- **Number** (`S3.SS2.SSS1.p4`), **thirteen years**: "The aggregate 2023 forecast predicted a 50% chance of HLMI by 2047, down thirteen years from 2060 in the 2022 survey."
- **Question:** When do AI researchers expect AI to outdo humans at everything, and how fast are those expectations moving?

**Dissolving the Fermi Paradox** (2018, `arxiv:1806.02404`)
- **Pictures:** Figure 2, alone (`one`).
- **Claim:** Carrying the real uncertainty in the Drake equation's factors through, instead of multiplying point guesses, gives a large chance that we are alone. An empty sky is then no paradox.
- **Passage** (`S1.SS2.p3`): "Monte Carlo simulation shows that this actually produces an empty galaxy 21.45 % of the time: a result that is easily reconcilable with our observations and thus generating no paradox for us to explain."
- **Number** (`S3.SS2.p3`), **0.32**: "The mean for N is very optimistic, at 27 million, but the median is now only 0.32 – less than one civilization per galaxy like our own."
- **Question:** Is the silence of the sky actually surprising, given how little we know about the odds of life?

**Scaling Laws for Neural Language Models** (2020, `arxiv:2001.08361`)
- **Pictures:** Figure 1, alone (`one`); Figure 3 second.
- **Claim:** Language-model loss falls as a smooth power law in parameters, data and compute over many orders of magnitude, so extra compute is best spent mostly on a bigger model.
- **Passage** (`S1.SS1.SSS0.Px7.p1`): "When working within a fixed compute budget C but without any other restrictions on the model size N or available data D, we attain optimal performance by training very large models and stopping significantly short of convergence (see Figure 3)." The 2022 Chinchilla paper later revised this allocation.
- **Number** (`S1.SS1.SSS0.Px3.p1`), **5x**: "The performance penalty depends predictably on the ratio N^0.74/D, meaning that every time we increase the model size 8x, we only need to increase the data by roughly 5x to avoid a penalty."
- **Question:** With 10x more compute, how should you split it between model size, data and training time?

**SolidGoldMagikarp (plus, prompt generation)** (LessWrong, 2023, `lw:aPeJE8bSo6rAFoLqg`)
- **Pictures:** `img6`, alone (`one`). It is the uncaptioned screenshot of ChatGPT explaining " SolidGoldMagikarp" as the word "distribute".
- **Claim:** GPT-2 and GPT-3 contain a few hundred glitch tokens, such as " SolidGoldMagikarp", that sit near the centre of embedding space and that the models cannot repeat back.
- **Passage** (`p175`): "The anomalous tokens may be those which had very little involvement in training, so that the model “doesn’t know what to do” when it encounters them, leading to evasive and erratic behaviour."
- **Number** (`p164`), **374**: "Comparing the completions to the original lists we were able to dismiss all but 374 tokens." That is 374 out of 50,257 tokens.
- **Question:** Why can't GPT-3 repeat back strings like " SolidGoldMagikarp"?

**What 2026 looks like** (Daniel Kokotajlo, 2021, `lw:6Xgy6CAf2jqHhynHL`)
- **Pictures:** none (`none`).
- **Claim:** A year-by-year guess, written in 2021, at AI from 2022 to 2026: chatbots and agentic "bureaucracies" keep improving, while AI-tuned propaganda and censorship split the internet into territories.
- **Passage** (`p39`): "Making models bigger is not what’s cool anymore. They are trillions of parameters big already. What’s cool is making them run longer, in bureaucracies of various designs, before giving their answers."
- **Number** (`p23`), **5x10^25 FLOPs**: "(So, the most compute spent on a single training run is something like 5x10^25 FLOPs.)" It is a forecast for 2024 that can now be checked.
- **Question:** What did a careful forecaster in 2021 expect AI and the world to look like by 2026?

**Schelling fences on slippery slopes** (Scott Alexander, 2012, `lw:Kbm6QnJv9dgWsPHQP`)
- **Pictures:** none (`none`).
- **Claim:** A slope is truly slippery when each step changes the values or power of whoever takes the next one. The defence is a Schelling fence, an arbitrary line everyone credibly commits to hold.
- **Passage** (`p13`): "Unfortunately, original Gandhi isn't the one making the choice of whether or not to take the 6th pill. 95%-Gandhi is."
- **Number:** none (`null`), because the essay's numbers are toy values.
- **Question:** When are slippery-slope arguments valid, and how can you stop sliding?

**Judgemental Predictions are Low-Signal, High-Skill** (QURI wiki, `web:priors…`)
- **Pictures:** `img0` (Tetlock's distribution of Brier scores), then `img1` (a path model in which content knowledge predicts accuracy less than belief updating does) (`few`).
- **Claim:** Judgemental forecasting is high-skill but low-signal. A superforecaster's "42%" looks like anyone's guess, so its value only shows in a track record such as a Brier score.
- **Passage** (`p7`): "The main conflict I’m raising here is that judgemental forecasts by themselves often don’t come with much information to signal how valuable they are. The result of 5 hours, 10 hours, or 500 hours of work by radically different groups of people would itself look near identical."
- **Number** (`p13`), **roughly 70%**: "Importantly, being a superforecaster in one year correlated strongly with being a superforecaster the next year; there was some regression to the mean but roughly 70% of the superforecasters maintained their status from one year to the next."
- **Question:** Why is a great forecast hard to tell from a mediocre one, and whom should you trust?

**Agent Incidents, 2024–2026** (QURI Delegation Risk wiki, `web:delegation-risk…`)
- **Pictures:** `tbl0`, the incident table (`one`).
- **Claim:** In eight real incidents from 2022 to 2026 where AI agents could act, the damage was set by what their credentials could reach. The fixes that work sit outside the model.
- **Passage** (`p66`): "In the accidents and supply-chain cases, exposure was set by credentials, not by capability. The same models with read-only, sandboxed access would have produced only embarrassments."
- **Number** (`p57`), **341**: "In early February 2026 Koi Security reported that of 2,857 skills it audited, 341 were malicious." That is about 12% of the skills.
- **Question:** What actually went wrong when AI agents with real permissions caused harm, and what would have stopped it?

**Little Wars** (H. G. Wells, 1913, `ia:littlewarsgamefo00well`, read through its OCR text)
- **Pictures:** page `k27` ("THE WAR GAME IN THE OPEN AIR.", two photographs of a game on a lawn), then `k17` (`few`).
- **Claim:** H. G. Wells sets out tested rules for a floor wargame with toy soldiers and spring-loaded guns. He ends by arguing that playing it shows how blundering real war must be.
- **Passage** (`k121`, printed page 100): "You have only to play at Little Wars three or four times to realise just what a blundering thing Great War must be. Great War is at present, I am convinced, not only the most expensive game in the universe, but it is a game out of all proportion." It was published a year before the First World War.
- **Number** (`k15`), **nine times out of ten**: "This priceless gift to boyhood appeared somewhen towards the end of the last century, a gun capable of hitting a toy soldier nine times out of ten at a distance of nine yards."
- **Question:** How did H. G. Wells turn toy soldiers into a playable wargame, and what did it teach him about war?

## 2. What doing it by hand showed

Each finding below changed the design.

1. **The lead figure needs judgment, not just reference counts.** I scored each paper's figures with the heuristic in section 1 of feed-ideas.md: references, a Figure 1 bonus, result words, and appendix and table penalties.
   - The heuristic's top figure matched mine in only 2 of the 6 papers. Mine was in its top two in 4 of 6.
   - Both misses were figures cited many times as lookup tables. In Alignment faking, Figure 9, a bar chart of prompt variations, has 26 in-text references against 8 for Figure 2, the result. In Scaling Laws, Figure 4 (6 references) beat Figure 1.
   - **Change:** the prompt tells the model that "a figure cited many times only as a lookup table is not" the one. Section 8 combines the two signals.
2. **The best picture can have no caption.** The most telling image in the SolidGoldMagikarp post is an uncaptioned screenshot; the paragraph just before it says what it shows.
   - **Change:** images and tables get markers of their own (`img6`, `tbl0`), placed in text order. An image without a caption is shown as "(image) no caption", so the model reads it from the text around it.
3. **Plates in scans are nearly empty pages.** In *Little Wars*:
   - the pages with photographs (`k17`, `k27`) carry only their caption as OCR text;
   - `k16`, a plate printed sideways, came out as OCR noise.

   **Change:** pages with 8-100 characters of text are marked `plate` in the input. hOCR's `ocr_photo` regions (feed-ideas F4) are the better test once the job reads hOCR. A model that only reads text cannot tell a striking plate from a dull one, which is the case for the vision add-on in section 7.
4. **Passages are not in the abstract.** None of the six papers' passages came from the abstract: four were in the introduction or a figure caption, and two in results sections.
   - **Change:** the prompt prefers a surprising, concrete passage "over a restatement of the abstract".
5. **The most surprising number is often a side result.** In 3 of the 6 papers it was not the headline:
   - contractors took 5-18x longer than maintainers;
   - weight exfiltration ran at 35–80% against 0.5%;
   - a system prompt cut jailbreak success from 79.9% to 22.6%.

   Essays seldom have such a number: the Schelling fences essay gets `null`.
   - **Change:** the prompt asks for a number "against a baseline or an expectation", and the schema allows `null`.
6. **Where the picks sit in the text.** Every pick in the six papers came within the first 25,000 characters of the request, captions included. The scan's passage was at 72,000 characters, in Wells's closing chapter, which is the part people quote.
   - **Change:** papers can be cut hard without losing much (the lean option in section 7). Long books keep their ends as well as their beginnings (section 5).
7. **Quotes must be checked against the text the model saw.**
   - LaTeXML math comes out as TeX in the extracted text (`N^0.74/D`), so a quote with math matches the extraction, not the rendered page.
   - OCR splits words at line ends ("con- vinced").
   - **Change:** the verifier tries three tests in order: exact (after collapsing whitespace), joined (after joining hyphenated words) and skel (letters and digits only, the `skel()` in `server/routes/30-summarize.mjs`). The app then finds the quote on screen by its skeleton, as summaries already do.
8. **Some "why" lines need outside knowledge.** Two of mine do: the Chinchilla revision of Scaling Laws, and reasoning models anticipated in "What 2026 looks like".
   - **Change:** the prompt keeps the claim, passage and number to the document, and allows outside context only in a `why`, "when you are sure of it". The card labels these lines AI.

## 3. Stable locations

The model refers to places only by the markers it sees in its input. The verifier corrects the marker when it finds the quote in a different block than the one claimed.

| Kind | Marker | Meaning | Stored | Link to the original | In the app |
|---|---|---|---|---|---|
| arXiv (HTML) | `abstract`, `S3.SS2.p3`, `S1.F2`, `S2.T1` | The LaTeXML element id of the paragraph, figure or table. The id up to `.p`, `.F` or `.T` is the section. | `loc`, `sec` | `https://arxiv.org/html/<id>#S3.SS2.p3` | The PDF page from `findPage(it, …)` in `figures.js`, with the quote as the needle; figures join `/figures` on `id === ref` |
| Posts (LessWrong, Alignment Forum, EA Forum) | `p41`, `img6`, `tbl0` | The 0-based index of the leaf text block in `htmlBody` (rule below). Images and tables are numbered separately. | `loc` | The post URL plus `#:~:text=` built from the quote | Search for the quote's skeleton in the flow document's stable pages, then `goPage(k)` |
| Wiki and web pages | as posts | as posts, within Starlight's `.sl-markdown-content` (another site needs its own main-content selector) | `loc`, `sec` (the nearest heading id) | The page URL plus `#<heading id>`, or a text fragment | as posts |
| Scans | `k120` | The 0-based page: the access leaf, as `/ocr` and `goPage` count pages | `loc`, `page`, `label` (the printed page, from `/ocr/labels`) | `https://archive.org/details/<ia>/page/n120` | `goPage(120)`, then the OCR word boxes to highlight |

**The paragraph rule for posts and wiki pages.** A leaf text block is a `p`, `li`, `h1`–`h6`, `figcaption`, `pre`, `td`, `th`, `dt` or `dd` element that has text and contains none of the others. Leaf blocks are numbered from 0 in document order.

- A double `<br>` counts as a paragraph break; older posts, such as Schelling fences, use them instead of `<p>`.
- Every `<img>` is numbered separately (`img0`, `img1` …), and so is every `<table>` (`tbl0` …), so they do not shift the paragraph numbers.
- The rule depends only on the HTML, so it is stable as long as the post is.

**Dive uses the quote first.** A paragraph index is a fallback, and it is also the anchor for links to the original.

## 4. `data/highlights.json`

This file has the same shape as `enrich.json`: a version header and `items` keyed by item id.

```ts
{
  v: 1,                          // file format
  prompt: 'highlights-v1',       // prompt version the entries were made with
  built: '2026-10-15',
  items: { [itemId: string]: Highlight }
}

type Quote = {
  quote: string;                 // verbatim from the source text
  loc: string;                   // block marker (section 3), corrected by the verifier
  sec?: string;                  // arXiv section id, or the wiki heading id
  page?: number; label?: string; // scans: 0-based page, printed page
  ok: boolean;                   // found in the source text
  match?: 'exact' | 'joined' | 'skel';
};

type Highlight = {
  claim: string;                                  // one sentence, ≤ 30 words
  passage: Quote & { why: string };               // why: ≤ 30 words
  number: (Quote & { value: string; what: string }) | null;
  figures: {                                      // ≤ 3, best first
    ref: string;                                  // S1.F2 · img6 · tbl0 · k27
    kind: 'result' | 'diagram' | 'example' | 'table' | 'picture';
    why: string;                                  // ≤ 20 words
    label?: string; caption?: string | null;      // added from /figures or the block
    img?: string; page?: number; table?: boolean;
  }[];
  show: 'one' | 'few' | 'none';
  question: string;                               // ≤ 20 words
  by: string; at: string;                         // model, date
  usd: number; tok: [number, number];             // cost, tokens in and out
};
```

**The model writes:**

- `claim`;
- `passage.{quote, loc, why}`;
- `number.{value, what, quote, loc}` or `null`;
- `figures[].{ref, kind, why}`;
- `show` and `question`.

**The verifier adds:**

- `ok` and `match`;
- a corrected `loc`;
- `sec`, `page` and `label`;
- for each figure, its `label`, `caption`, `img` and `page`;
- `by`, `at`, `usd` and `tok`.

**What the verifier drops:**

- a number whose `value` does not occur in its own quote;
- a figure whose `ref` does not exist.

When `figures` ends up empty, it sets `show` to `none`. It keeps a passage that fails the check, with `ok: false`, and the card hides it, as the summary panel already treats `quote_ok`.

The sample file has a single `by` in its header in place of the per-item `by`, `at`, `usd` and `tok`. Its picks were made by hand, not by the batch prompt.

**Serving.** One route serves the file, and `corpus.js` merges it into the items under `it.hl`, the way it merges `enrich.json`. The new route is either `GET /highlights.json`, added to the static map in `server.mjs`, or a small `server/routes/67-highlights.mjs`. The file for the whole corpus is about 2 MB: the sample averages 2 KB per item.

## 5. The prompt

### Input

There is one user message per item: a document block, then one line asking for the picks. The text is split into blocks, each with the marker of section 3. The start of the METR request looks like this:

```
<document>
Title: Measuring AI Ability to Complete Long Software Tasks
Authors: Thomas Kwa, Ben West, Joel Becker et al.
Year: 2025
Kind: arXiv paper (from its HTML)
Shelf: AI safety
<text>
[abstract] Despite rapid progress on AI benchmarks, …
[S1.F1] The length of tasks (measured by how long they take human professionals) …
[S1.p1] In the last five years, frontier AI systems have undergone …
…
</text>
</document>

Pick the highlights of this document.
```

**What goes in.** Each item's text is capped at 100,000 characters, which is about 37,000 tokens.

- **arXiv papers:** the abstract and body paragraphs, in order. Appendices (`A*`), acknowledgements and other unnumbered sections (`Sx*`) are dropped, but every figure and table caption is kept, including the appendix ones. A body still over the cap is cut from the end, so the captions always fit.
- **Posts and wiki pages:** whole, with the `img` and `tbl` markers.
- **Scans:** every page, as `[k<N> p.<printed>]`, with `plate` added to near-empty pages. A book over the cap keeps every plate page, then fills 40% of the remaining space from the front and 30% from the back, where conclusions are, and the rest with evenly spaced pages from the middle.

**Why the cap.** Alignment faking's full text is 322,000 characters, about 119,000 tokens. Sent whole, it would cross Haiku 5.5's 100,000-token pricing tier, where tokens cost five times as much ($0.50 and $2.50 per million). With the cap, every request stays under about 39,000 tokens.

### System prompt (`highlights-v1`)

```
You pick out the highlights of one document for a researcher who skims a great deal of AI safety, machine learning, forecasting and older technical writing. Your picks become cards in a feed: the best figure, one passage, one number and the claim in a line. They want what a careful, well-read reader would point to, the places worth looking at, not a summary.

The document arrives as blocks, each opening with a marker in square brackets:
- [abstract], [S3.SS2.p3]: the abstract and paragraphs of an arXiv paper (the LaTeXML id encodes the section); [S1.F2], [S2.T1]: figure and table captions.
- [p41]: the 42nd paragraph of a post or wiki page; [img6]: its 7th image, with its caption or "no caption"; [tbl0]: a table, with its header row.
- [k120 p.100]: page 120 of a scanned book, printed page 100; [k27 plate]: a page that is mostly a picture.
Refer to places only by these markers, copied exactly, without the brackets.

Fill in:
claim: the main claim or contribution in one plain sentence of at most 30 words, as you would put it to a colleague.
passage: the single most interesting passage, one to three consecutive sentences from one block. Prefer what is surprising, concrete or quotable (a finding with its number, a vivid example, a sharp argument, a prediction that can be checked) over a restatement of the abstract. why says in at most 30 words why a careful reader would point to it.
number: the most surprising number, one that changes how you see the topic, usually against a baseline or an expectation. value is the number as written; what says in a few words what it measures; quote is the whole sentence that contains it. Skip years, citation and section numbers, sample sizes and hyperparameters unless they are the surprise. Use null when no number qualifies, as in most essays.
figures: up to three figures, tables or pictures most worth looking at, best first, by marker. A plot of the main result beats a diagram of the setup, which beats sample outputs; the main text beats the appendix. You see only captions and the sentences that cite figures, so judge by those: the figure the argument leans on is usually the one, and a figure cited many times only as a lookup table is not. why is at most 20 words. Use an empty list when nothing is worth a look.
show: "one" when the first figure tells the story alone, "few" when the others add something it lacks, "none" when figures is empty.
question: one question the document answers, as a reader would ask it before reading, in at most 20 words.

Quotes (passage.quote and number.quote) are copied character for character from a single block: no paraphrase, no ellipses, no stitching across blocks, no markers. In scanned books you may join a word hyphenated across a line break ("con- vinced" becomes "convinced"); otherwise keep the OCR's spelling. Software checks every quote against the text and drops any it cannot find.

Stay faithful to the document: claim, passage and number come from it alone. A why may add well-established outside context, such as a later result that revised this one, when you are sure of it.
```

### Output schema (structured outputs)

Structured outputs do not support length constraints (`maxLength`, `minimum` and the like), so the word limits live in the descriptions and the prompt. The property order is the order the model writes in: the claim comes first, so the model has to state what the item is about before it picks.

```js
const str = (description) => ({ type: 'string', description });
const loc = str('Block marker, copied exactly without brackets, e.g. S3.SS2.p3, S1.F2, p41, img6, tbl0, k120.');
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const SCHEMA = obj({
  claim: str('The main claim or contribution, one plain sentence, at most 30 words.'),
  passage: obj({
    quote: str('One to three consecutive sentences copied exactly from one block.'),
    loc,
    why: str('Why a careful reader would point to it, at most 30 words.'),
  }),
  number: {
    anyOf: [obj({
      value: str('The number as written, e.g. "5-18x", "35–80%", "thirteen years".'),
      what: str('What it measures, a few words.'),
      quote: str('The whole sentence containing it, copied exactly.'),
      loc,
    }), { type: 'null' }],
  },
  figures: {
    type: 'array',
    description: 'Up to three, best first; empty when nothing is worth a look.',
    items: obj({
      ref: loc,
      kind: { type: 'string', enum: ['result', 'diagram', 'example', 'table', 'picture'] },
      why: str('Why look at it, at most 20 words.'),
    }),
  },
  show: { type: 'string', enum: ['one', 'few', 'none'] },
  question: str('A question the document answers, as a reader would ask it, at most 20 words.'),
});
```

### Request

```js
const params = (model, userText) => ({
  model,                 // 'claude-haiku-5-5' | 'claude-sonnet-5-5' | 'claude-opus-5-5'
  max_tokens: 8000,      // the answer is about 450 tokens; the rest is room for thinking
  system: SYSTEM,
  messages: [{ role: 'user', content: userText }],
  output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
});
```

- **Effort.** It is set explicitly to `low`. Haiku 5.5 and Opus 5.5 default to `medium` and Sonnet 5.5 to `high`, and picking highlights does not need more than `low`.
- **Thinking.** It is left at its default, adaptive. On Opus 5.5 it cannot be turned off; on Haiku 5.5 it can be turned off at this effort, which is worth testing as a way to save tokens (section 9).
- **Fallbacks.** No `fallbacks` parameter: the Batches API rejects it, and Haiku 5.5 has no server-side fallback anyway. A refusal (`stop_reason: 'refusal'`) is recorded and re-run later on another model (section 6).
- **Interactive calls.** For one item at a time, outside a batch, use the same `params` through `client.beta.messages.stream`, with the server-side fallback, as `generate()` in `server/routes/30-summarize.mjs` already does for summaries.

## 6. As a batch job

`bin/highlights.mjs --lanes ai-safety,llm --model claude-haiku-5-5` (proposed) runs these steps:

1. **Build the text** for each item without a highlight for the current `prompt` version. For each kind, the text comes from:
   - **arXiv:** `cache.ensure('https://arxiv.org/html/<id>')`, parsed with the LaTeXML parser that feed-ideas.md moves into `server/latexml.mjs`. The blocks are the `ltx_para` elements with ids, plus the abstract and every `figcaption`.
   - **Posts:** the GraphQL `htmlBody` that the corpus URL already returns.
   - **Web pages:** the cached HTML, using its main-content element.
   - **Scans:** per-page text from the existing `/ocr/text` route (hOCR search text, indexed by page) and printed pages from `/ocr/labels`. Older items without hOCR fall back to `<id>_djvu.xml`, one `OBJECT` per page.
   - **Non-arXiv PDFs:** these 100 items have no server-side text extraction yet (pdf.js runs in the browser), so version 1 skips them. Later, either add `pdfjs-dist` to the server or compute their highlights in the browser on first open.
2. **Count tokens first.** Run `client.messages.countTokens` on a sample of requests; it costs nothing. This replaces the 2.7 characters per token assumed in section 7.
3. **Submit one batch.** The whole corpus is about 1,950 requests and 120 MB, well inside the limits of 100,000 requests or 256 MB per batch. Save the batch id in `data/highlights.batch.json` so that a restarted job picks up the results, which are kept for 29 days.
4. **Poll** every minute. Most batches finish within an hour, and all within 24 hours.
5. **Read the results**, matching them by `custom_id`, since they arrive in any order:
   - Verify the quotes and fill in the locations (section 4).
   - Write the entries into `data/highlights.json`, with each entry's cost at batch prices.
   - Collect errored, expired, refused and truncated (`max_tokens`) items into a retry list.

```js
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';

const client = new Anthropic();
// custom_id allows only a short run of letters, digits, _ and -, and item ids hold ':' '/' and '.'.
const cid = (id) => 'h' + createHash('sha1').update(id).digest('hex').slice(0, 24);
const byCid = new Map(todo.map((it) => [cid(it.id), it]));

const batch = await client.messages.batches.create({
  requests: todo.map((it) => ({ custom_id: cid(it.id), params: params(MODEL, userText(it, blocksOf(it))) })),
});
saveBatchId(batch.id);

let b;
do { await sleep(60_000); b = await client.messages.batches.retrieve(batch.id); } while (b.processing_status !== 'ended');

for await (const r of await client.messages.batches.results(batch.id)) {
  const it = byCid.get(r.custom_id);
  if (r.result.type !== 'succeeded') { retry.push([it.id, r.result.type]); continue; }
  const m = r.result.message;
  if (m.stop_reason === 'refusal' || m.stop_reason === 'max_tokens') { retry.push([it.id, m.stop_reason]); continue; }
  const picks = JSON.parse(m.content.find((c) => c.type === 'text').text);
  out.items[it.id] = {
    ...verify(picks, blocksOf(it)),            // ok, match, loc, sec, page, label; figure captions and images
    by: m.model, at: today(),
    usd: costOf(m.model, m.usage) / 2,         // costOf() from 30-summarize.mjs; batch is half price
    tok: [m.usage.input_tokens, m.usage.output_tokens],
  };
}
```

**Retries.** Errored and expired items go into a second batch. Refused items go to Sonnet 5.5, which handles different refusal categories than Haiku; through the interactive API it can also use the server-side fallback.

**Spending.** The job runs only when the reader starts it, and it reports its estimated cost before submitting. It charges the daily budget only for what it actually spent, using `charge()` from `30-summarize.mjs`, so it shares `STACKS_DAILY_BUDGET` with summaries. A whole-corpus Haiku run costs about as much as one day's default budget of $3.

## 7. Cost

### Measured request sizes (the 12 items)

Each request carries 5,004 characters of shared prompt: the system prompt (3,099) and the schema (1,905). Characters per token is an assumption until `countTokens` is run. Haiku 5.5's newer tokenizer counts the same text as about 30% more tokens than earlier ones, so 2.7 characters a token is used for planning. 3.5 characters a token, the app's own estimate in `reserve()`, gives the lower bound.

| Item | Kind | Extracted text (chars) | Document block sent (chars) | Tokens with the prompt (2.7 / 3.5 chars a token) |
|---|---|---|---|---|
| Measuring AI Ability to Complete Long Software Tasks | arXiv | 94,861 | 33,934 | 14,421 / 11,125 |
| Alignment faking in large language models | arXiv | 322,357 | 100,253 (capped) | 38,984 / 30,073 |
| Refusal … Single Direction | arXiv | 62,329 | 38,803 | 16,225 / 12,516 |
| Thousands of AI Authors on the Future of AI | arXiv | 92,160 | 73,533 | 29,088 / 22,439 |
| Dissolving the Fermi Paradox | arXiv | 36,683 | 37,774 | 15,844 / 12,222 |
| Scaling Laws for Neural Language Models | arXiv | 64,874 | 55,392 | 22,369 / 17,256 |
| SolidGoldMagikarp | post | 28,520 | 30,005 | 12,966 / 10,003 |
| What 2026 looks like | post | 29,970 | 30,561 | 13,172 / 10,161 |
| Schelling fences on slippery slopes | post | 10,120 | 10,519 | 5,749 / 4,435 |
| Judgemental Predictions are Low-Signal, High-Skill | wiki | 14,487 | 15,097 | 7,445 / 5,743 |
| Agent Incidents, 2024–2026 | wiki | 13,674 | 14,305 | 7,151 / 5,517 |
| *Little Wars* (140 pages) | scan | 87,490 | 89,108 | 34,856 / 26,889 |
| **Mean of the 12** | | | 44,107 | **18,189 / 14,032** |

**Why the papers shrink.** Dropping the appendices and references halves an arXiv paper, from a mean of 115,000 characters to 56,600.

**Output.** The answer JSON averaged 1,209 characters, about 450 tokens. Thinking at `low` effort adds an unknown amount, so the plan assumes 1,500 output tokens per item, with 600-3,000 as the range.

### From the sample to the corpus

| Kind | Items | Mean document block (chars) | Source of the figure |
|---|---|---|---|
| arXiv papers | 677 | 56,600 | mean of the 6 measured |
| Other PDFs | 100 | 90,000 | assumed (textbooks and reports, most at the cap) |
| Posts | 515 | 23,000 | corpus `words` (mean 3,690) × 6.2 characters a word, as measured on the 3 posts |
| Web and wiki pages | 217 | 27,600 | 155 QURI pages at 14,700 (measured) and 62 others (Distill, Transformer Circuits, METR …) assumed at 60,000 |
| Scans | 437 | 97,000 | nearly all at the cap (median length 376 pages) |

That comes to a mean of 60,300 characters a request with the prompt: **about 22,300 input tokens**, or 17,200 at 3.5 characters a token.

### Per 1,000 items

At 22,300 input and 1,500 output tokens an item:

| Model ($ per million tokens, input / output) | Standard API | Batch API (50%) | Whole corpus, batch (1,948 items) | One arXiv paper, batch |
|---|---|---|---|---|
| claude-haiku-5-5 ($0.10 / $0.50) | $2.98 | **$1.49** | **$2.90** | $0.0015 |
| claude-sonnet-5-5 ($2 / $10) | $59.64 | **$29.82** | $58.09 | $0.030 |
| claude-opus-5-5 ($4 / $20) | $119.28 | **$59.64** | $116.18 | $0.061 |

How the batch figures per 1,000 items move with the assumptions:

| Assumption | Haiku | Sonnet | Opus |
|---|---|---|---|
| 3.5 characters a token (fewer input tokens) | $1.24 | $24.72 | $49.44 |
| 600 output tokens | $1.27 | $25.33 | $50.67 |
| 3,000 output tokens | $1.87 | $37.33 | $74.67 |
| Lean cap: 40,000 characters (papers keep their head and all captions; books their front, back and plates) | $1.10 | $21.99 | $43.98 |

- **Where the cost goes.** Input is about three quarters of the cost on every model, because the prices keep the same 1:5 input-to-output ratio.
- **Prompt caching.** The shared prompt is about 1,850 tokens, roughly 8% of an average request. Caching it would save at most a few percent and needs a prefix longer than this one, so the job does without.
- **The lean cap** loses none of the picks in the six sampled papers, which all sat in the first 25,000 characters. It would have cut the scan's best passage had the book been longer than the cap; that is why books keep their back pages.
- **Vision add-on.** The model chooses figures from their captions alone. Sending up to six candidate figures as thumbnails lets it look at them before choosing.
  - **Size:** at about 800 × 500 pixels, a thumbnail is roughly (width × height) / 750 ≈ 530 tokens. Six of them add about 3,200 tokens to an average paper, about 14%.
  - **Cost per paper at batch prices:** $0.00016 on Haiku, $0.0032 on Sonnet, $0.0064 on Opus.
  - **Which figures:** the six candidates are the heuristic's top six. Inline SVG figures have to be rasterized first, or left out.
  - **Scans:** plate pages are sent the same way.
- **Sharing a call with the summary.** For an item the reader opens, the highlight fields could go into the summary request (`schemaFor()` in `30-summarize.mjs`), since that call already pays for the input. But the summarizer reads only the pages around the reader's position, not the whole item, and feeds need highlights for items nobody has opened yet. The batch remains the main path.

**Recommendation.**

1. Run the prompt on the 12 sample items with all three models, at standard prices. It costs about $0.03 on Haiku, $0.62 on Sonnet and $1.23 on Opus.
2. Score the results against the hand picks (section 9).
3. Expect to run Haiku 5.5 in batch over the whole corpus for about $3. Re-run with Sonnet 5.5 (about $30 per 1,000 items) for the lanes the reader uses most, if Haiku's figure picks disagree with the hand picks much more often than Sonnet's do.

## 8. Using highlights in the views

**The lead picture.** This answers "top few pictures/graphs, or just top graph, as is best" for wall tiles, the F1 board and the Figures river.

- When an item has a highlight, its `figures` and `show` decide the picture: `one` draws `figures[0]` alone, and `few` draws a mosaic of the first two or three.
- Otherwise the reference-count heuristic decides, with one fix: count references from distinct sections, so that a lookup figure cited 26 times from one section does not win.
- When the two agree, the pick can be trusted; when they disagree, it is worth looking at.

**The highlight card in the Deck.**

- The picture first.
- Then the claim on one line, the number as a stat tile (`value` large, `what` small), and the passage as a pull quote with its `why` in grey.
- A `✓` marks a verified quote. The `why` and the claim carry the `AI` label.

**Peek** shows the passage with the blocks before and after it, the figures large, and the question as the heading.

**Feeds:**

- `number` feeds Numbers (F10);
- `passage` feeds pull quotes (F20);
- a paper thread (F22) is claim → figure → number → passage → question;
- `question` with `claim` as the answer seeds the flashcards (F24).

**Dive and Original.**

- **Dive** looks up the page from the quote: `findPage` for PDFs, a skeleton search over the stable pages for flow documents, and `page` for scans. It then highlights the quote with `highlight('snip', words)`.
- **Original** opens the anchors in section 3.

## 9. Checking quality

**The gold set.** The 12 hand picks in `data/highlights.sample.json`.

- Grow it to about 50 items with one key in the Figures view, "this is the lead figure", which costs the reader a second per paper.
- Add a pass where the reader keeps one of two passages for an item.

**Measures, per model:**

- **Quotes:** the share of passages and numbers that verify. The target is at least 95% of passages; anything lower means the prompt or the block markers need work.
- **Lead figure:** whether the model's first figure is the gold one, and whether it is in the gold top two. The heuristic scored 2 of 6 and 4 of 6, so a model that does no better is not worth paying for on this field.
- **`show` and `null`:** agreement on `show`, and whether `number` is `null` on essays.
- **Passages:** blind pairwise preference against the gold passage, which takes the reader a few minutes.
- **Variants:** Haiku with thinking off against adaptive; effort `low` against `medium`; text only against the vision add-on.

**After the corpus batch,** spot-check 30 random items across lanes before the feeds rely on them.

## 10. Open questions

- **Choosing figures blind.** A model reading only text chooses figures by their captions and citing sentences. Is the vision add-on worth its 14%? This is decided by the lead-figure measure in section 9.
- **Refusals.** Haiku 5.5 may decline some dual-use safety papers (bio, cyber), and it has no fallback. Count the refusals in the first batch before relying on Sonnet retries.
- **Outside context in `why`.** It is useful (the Chinchilla note) and risky. If spot checks find errors, drop it: change the last line of the prompt to "use only the document".
- **Hindsight.** "What 2026 looks like" shows that predictions in old posts become checkable. A `checkable: {claim, by}` field would feed the credences feed (F11) with a "past due" flag. It is left out of version 1 to keep the schema small.
- **Prompt versions.** Every field comes from one call, and a whole-corpus Haiku run costs about $3. So a new prompt version simply re-runs everything, rather than patching fields.
