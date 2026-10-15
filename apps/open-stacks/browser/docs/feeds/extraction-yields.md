# What can be pulled out of the corpus for skimmable feeds: measured yields

Measured on 2026-10-15 against live sources, using samples from `corpus.json`. This is a research note: nothing in the app was changed. For the feed designs (Deck, Board, Peek and so on), see [feed-ideas.md](feed-ideas.md). This note gives the numbers those designs depend on: how many items yield a usable card of each type, how many cards each item gives, how to extract them, and what the cards look like.

## Bottom line

- **"Show the top graph" works for nearly every arXiv paper.** arXiv now serves LaTeXML HTML for about 96% of the corpus's arXiv items, old papers included. 28 of 30 sampled papers have at least one image figure, with 9.8 on average. Figure 1 sits in the first 15% of the document in 24 of 30 papers, which makes it the paper's teaser. In 18 of the 28 papers with figures, Figure 1 is a chart or a chart plus diagram, and 25 of 30 papers have a chart-like figure somewhere. The app's own `extract()` (`server/routes/65-figures.mjs`) already produces all of these figures, in about 40 ms a paper.
- **The other source types have far fewer pictures.** LessWrong and EA Forum posts: 63% have a `socialPreviewImageUrl` (289 of 460 checked), and 12 of 15 sampled posts have body images. QURI wikis have almost no images (9% of pages) and no `og:image`. Their visuals are tables (46% of pages) and Mermaid diagrams (9%). Scans rarely have separate plates (2 of 8 sampled books), but hOCR `ocr_photo` boxes find inline woodcuts in illustrated books. PDFs without HTML give figure captions with page numbers (9 of 12) but no crops.
- **Text cards are plentiful but need filtering.** From arXiv HTML, per paper:
  - result sentences with numbers: 4.0 (in 77% of papers, about 75% precision);
  - definitional sentences: 2.5 (in 83%, about 50% worth a glossary card);
  - HTML tables that fit on a card: 5.8;
  - numbered display equations: 3.1;
  - explicit contributions: in 30% of papers;
  - a limitations section: in 27%;
  - theorem, definition and proposition blocks: 2.8 on average, but concentrated in the 13% of papers that are theory papers.

  From posts: claim lists (67% of posts), blockquotes (47%), footnotes (33%, 5.3 a post), and TL;DR or epistemic-status lines (only 20% and 7%, so they cannot be relied on).
- **The papers without HTML are the policy papers.** 8 of the 205 probed arXiv items have no HTML. Their PDFs came from Word (2), Google Docs (3), Typst (1), a publisher's Distiller (1) and LaTeX printed through Quartz (1). They are governance and policy papers, so text cards (abstract, headings, captions) matter more for them than figures.

## Method and sample

| Source type | Sample | Fetched from |
|---|---|---|
| arXiv with HTML | 30 papers: ai-safety 10, deepmind-safety 9, llm 8, forecasting 3 (all 3 of that lane's arXiv items); half from 2024 or later | `https://arxiv.org/html/<id>` (29), ar5iv fallback (1: `2602.04899`, a 404 on arxiv.org/html) |
| arXiv HTML coverage | 205 more arXiv items, probed with HEAD requests | 197 had arxiv.org/html, **8 did not (3.9%)** |
| arXiv without HTML | those 8 | `https://arxiv.org/pdf/<id>` → `pdftotext -raw` (content-stream order, no layout, as pdf.js `getTextContent` gives it) |
| Other PDFs | 4: UAI 2016 *Safely Interruptible Agents*, Hanson *Combinatorial Information Market Design*, DeepMind FSF v1, *Situational Awareness* | as above |
| LessWrong / EA Forum posts | 15: 7 from the LessWrong lane, 5 from AI safety (Alignment Forum), 3 from forecasting (2 EA Forum) | the corpus GraphQL URL (`htmlBody`); preview images for **all 500 posts** in batched GraphQL queries (460 answered; one batch of 40 failed on a TLS reset) |
| QURI wikis | 10 sampled (3 Delegation Risk, 3 Priors, 2 Evaluation Engineering, 2 Reasoning Processes); **all 155 pages** for lane-wide rates | page HTML, `.sl-markdown-content` |
| Other web | 6 (danluu, anthropic.com, apolloresearch, epoch.ai, transformer-circuits, alignment.anthropic.com) | page HTML |
| Internet Archive scans | 8 (Venn 1866, Bradley 1922, Maxwell vol. 2 1873, De Morgan 1847, Cayley vol. 13, *Chess Player's Chronicle* 1868, *Tractatus* 1922/1971, Whitworth 1870) | `/metadata`, `_hocr_pageindex.json.gz` + `_hocr_searchtext.txt.gz` (or `_djvu.xml`), `_hocr.html` (streamed, not stored), `page/n<k>_w200.jpg` thumbnails |

Every request was polite: about 1 request a second to arXiv, with TLS checks on throughout. The counting scripts were Python (lxml) for structure and the app's own `extract()` from `65-figures.mjs`, run in Node, for figures and tables. "Usable" means a card that stands alone at a glance; the length thresholds are given in each table. Precision figures come from hand-labelling random samples and are approximate.

## 1. The lead visual: "top few pictures, or just the top graph"

| Source type (corpus count) | Items with a lead visual | What the lead visual is | How to pick it |
|---|---|---|---|
| arXiv with HTML (~650 of 677) | **28/30 (93%)** with at least one image figure; 27/30 with one in the main text | Figure 1 in 28/28. Captions classified as chart 9, chart plus diagram 9, diagram 2, other 8 (screenshots, examples, causal graphs) | Figure 1 if `at` < 0.15 (24/30 papers). For "top few", take the first 3 figures with `at` < 0.7. Prefer the first chart-class figure if Figure 1 is "other" and a chart comes within the first 3 (25/30 papers have a chart) |
| arXiv without HTML / other PDFs (~27 + 100) | Figure or Table captions with page numbers in **9/12**; embedded raster images (≥150 px) in 5/12 | Vector plots are invisible to `pdfimages`. A caption line and its page are what you get | Render the caption's page. The app already locates a figure's PDF page by caption text (`figures.js`). Cropping needs pdf.js text positions (caption y, then the block above it) |
| LessWrong / EA Forum (500) | **63%** have `socialPreviewImageUrl` (lesswrong lane 156/249, ai-safety 59/100, forecasting 73/110); 80% of sampled posts have body images (2.9 a post) | 4 of 15 previews are the first body image. 8 are separately chosen images, often LessWrong's art for review winners (e.g. *The Rocket Alignment Problem*, which has no body images). 3 posts have none | `socialPreviewImageUrl` (one batched GraphQL call per ~40 posts), then the first body `<img>`, then a text card |
| QURI wikis (155) | images on **9%** (all on Priors), Mermaid on 9% (about 25 diagrams), tables on **46%** (158 tables) | No `og:image` on any page. The tables are small (median 6×3; 77% within 3-12 rows × 2-5 cols) | The first table or Mermaid diagram (render the `pre.mermaid` source with mermaid.js); otherwise a text card |
| Other web (62) | `og:image` on 3/6 sampled pages, body images on 4/6 | Lab-blog hero images and figure PNG/WebP files. transformer-circuits embeds `data:` images, making the page 5.5 MB | `og:image`/`twitter:image`, then the first body image |
| Scans (437) | separate plates in **2/8** books (Maxwell, Cayley); inline figures in illustrated books through hOCR | Plates: the end-matter plates in Maxwell vol. 2 (Fig. XV, XVIII), a fold-out of circles in Cayley vol. 13. Inline: Maxwell's numbered woodcuts | Section 6 gives the plate rule and the `ocr_photo` + "Fig." rule. Otherwise the title page or the `best` page |

## 2. arXiv HTML (LaTeXML)

arXiv's converter is now "LaTeXML oxide 0.7.6" for every sampled paper, back to 2016. HTML is median 318 KB and up to 2.6 MB a paper. A Python structure pass takes about 0.1 s a paper. The app's `extract()` handled all 30 papers in 1.35 s, Node startup included. Of the 302 image figures, 92 are multi-panel (`parts`) and 15 are inline SVG. Most figure images are `.svg` (171) or `.png` (115).

### Yields (30 papers)

| Card type | Items with at least 1 | Mean per item | Median | Max |
|---|---|---|---|---|
| Abstract (200-3,000 chars) | 30/30 (100%) | 1.0 | 1 | 1 |
| Figure (image, caption at least 40 chars) | 28/30 (93%) | 9.8 | 7 | 31 |
| Figure, main text only (`at` < 0.7, at most 12) | 27/30 (90%) | 6.0 | 6 | 12 |
| Table (HTML, 2-25 rows, 2-10 cols) | 27/30 (90%) | 5.8 | 3 | 25 |
| Display equation (numbered, MathML, 15-400 chars of TeX) | 16/30 (53%) | 3.1 | 1 | 14 |
| Theorem-like block (40-900 chars) | 4/30 (13%) | 2.8 | 0 | 46 |
| ... of which definitions | 4/30 (13%) | 0.9 | 0 | 13 |
| Algorithm float | 6/30 (20%) | 0.6 | 0 | 11 |
| Code listing (`.ltx_listing`) | 11/30 (37%) | 3.8 | 0 | 26 |
| Contributions (explicit) | 9/30 (30%) | 0.3 | 0 | 1 |
| Intro bullet list (2-8 items) | 9/30 (30%) | 0.3 | 0 | 1 |
| Bold-led bullet list (main text) | 12/30 (40%) | 1.0 | 0 | 6 |
| Limitations section (strict) | 8/30 (27%) | 0.3 | 0 | 1 |
| Future work / open problems section | 8/30 (27%) | 0.3 | 0 | 1 |
| Conclusion or discussion (at least 40 words) | 27/30 (90%) | 0.9 | 1 | 1 |
| Result sentence with a number, abstract | 5/30 (17%) | 0.2 | 0 | 2 |
| Result sentence with a number, main text | 23/30 (77%) | 4.0 | 2.5 | 14 |
| Definitional sentence, main text | 25/30 (83%) | 2.5 | 1.5 | 12 |

That comes to roughly 15-20 good cards a paper once each type is capped: say 3 figures, 2 tables, 2 equations, 3 claims, 1 contributions, 1 limitations, 1 abstract and 2 definitions. Uncapped, it is over 30. Projected over the ~650 papers with HTML (rough, since per-paper counts are heavy-tailed): about 6,400 figures (3,900 in the main text), 3,800 card-sized tables, 2,600 result sentences, 1,600 definitional sentences, 2,000 equations, about 200 contributions blocks and about 175 limitations sections. Theorem-like blocks (about 1,800) cluster in the forecasting-aggregation and agent-foundations papers.

Precision, hand-labelled:
- Result sentences: about 15 of 20 are real findings. The misses are setup ("we calibrate the threshold to achieve 5% FPR"), trivia ("93.4% of the time was spent performing TPU computations") and cited background.
- Definitional sentences: about 7 of 15 are worth a glossary card. The rest are notation ("we denote …") or casual uses of "we call" and "refers to".
- Abstracts: only 6 of 30 contain a headline number (`%`, `×`). Safety papers are less benchmark-heavy than LLM papers.
- Contributions detector: it found all 9 papers whose introductions name contributions, by phrase or by a "Contributions" paragraph heading. A plain grep found no others.

### Recipes (LaTeXML class names)

The app's dependency-free `parse()`, `walk()`, `text()` and `clean()` in `65-figures.mjs` already cover everything below. Exporting them and adding a sibling `/cards?id=` route, cached as JSON under `CACHE/cards/` with a `VER` bump, would reuse the same fetched HTML.

- **Abstract:** `div.ltx_abstract`. In 2 of 30 papers there is none; fall back to the `section` whose `h2`/`h3` reads "Abstract" (e.g. ZeRO, and *Ethical and social risks*, where it is an `h3`).
- **Sections:** `section.ltx_section > h2.ltx_title_section`, then `section.ltx_subsection > h3`, then `section.ltx_paragraph > h5` (run-in headings such as "Our contributions."), and `section.ltx_appendix`. Strip `span.ltx_tag` when reading titles: a naive regex that strips leading numbers turned "Frontier Safety: Summary" into "rontier Safety".
- **Figures and tables:** use the existing `extract()`. Fields `at` (position, 0-1), `w`/`h` (an aspect ratio for masonry; Figure 1 ranges 0.5-4.0, median about 2), `caption`, and `table` + `html`/`rows`/`cols`. All 215 "tables" in the sample came back as sanitized HTML; none were images.
- **Display equations:** `table.ltx_equation`, `table.ltx_equationgroup` (skip equations nested in a group). Keep the ones with `<math>` and a `span.ltx_tag_equation` (numbered). TeX is in `math@alttext`. Render the MathML itself: Chromium has supported MathML Core since 109. Show it with the sentence that precedes it in the same `ltx_para`.
- **Theorem-like blocks:** `div.ltx_theorem`. The kind is a class suffix that varies by author macro: `ltx_theorem_defin` / `_definition`, `_prop`, `_theorem`, `_lemma`, `_corollary`, `_remark`, `_example`, `_claim`, and even `_myalgorithm` and `_nonothm`. Match by prefix, and take the title from `h6.ltx_title_theorem` ("Definition 3.2 (Bregman divergence).").
- **Algorithms:** `figure.ltx_float_algorithm`. `extract()` already skips them. The pseudo-code is in `div.ltx_listing` / `.ltx_listingline`, and the caption begins "Algorithm N …".
- **Contributions:** search the first section titled `/intro|overview|motivation/`. Within its top-level `div.ltx_para`, find the sentence matching
  `/\b((our|main|key|primary|two|three|four|several|following|this paper.s|this work.s|the) (\w+ )?contributions|contributions (are|of this|include)|we (make|offer) the following|we summari[sz]e our (main |key )?(findings|results)|in summary, (we|our)|this paper makes)/i`,
  excluding "equal/author contribution". Items come from `ul.ltx_itemize` / `ol.ltx_enumerate` inside the same para or leading the next one. Often there is no list, and the items are inline "First, … Second, …" or a semicolon run (s1). Also accept a non-appendix heading matching `/contributions|key (findings|takeaways)|summary of results/`.
- **Bold-led lists** (claim lists): `ul.ltx_itemize` / `ol.ltx_enumerate` outside appendix, bibliography and figures, with 2-10 items, nearly all of which start with `span.ltx_font_bold` or a `Label:` of 3-60 characters.
- **Limitations, future work, conclusion:** match section and subsection titles against `/limitation|threats to validity/`, `/future work|future direction|open (problem|question)/` and `/conclu|summary|discussion/`. Combined titles such as "Conclusion and Future Work" or "Limitation and Conclusion" are common (4 of 30). Card text: the first 2-3 sentences of the section (sections run 130-770 words).
- **Sentences:** take `p.ltx_p` not inside `figure`, `figcaption`, `.ltx_bibliography`, `.ltx_note`, `.ltx_abstract` or `.ltx_theorem`, and mark those inside `.ltx_appendix`. Split on `(?<=[.!?])\s+(?=[A-Z(\["“])`, guarding e.g., i.e., et al., Fig., Eq., Sec., vs., cf. and Tab. Keep sentences of 50-360 chars.
  - Results: `/\b(improv|reduc|increas|outperform|achiev|boost|decreas|gain|drop|exceed|surpass|match|cut|lower|rais|speed|accelerat|beat|recover|halv|doubl)\w*\b[^.;]{0,90}?(\d+(\.\d+)?\s?(%|×|x\b|-fold|fold|points?|pp|percentage points)|by (a factor of|an order of magnitude))|\d+(\.\d+)?\s?% of\b|\b\d+(\.\d+)?\s?[×x]\s+(faster|more|fewer|larger|smaller|less|cheaper|higher|lower)\b/i`.
  - Definitions: `/\b(we define|we call|is defined as|are defined as|we refer to [^.]{1,60}? as|we term|we say that|we introduce the (notion|concept|term)|we use the term|refers to|we denote|is called|are called|which we call|we coin)\b/i`. For a glossary feed, require an emphasized term (`em.ltx_emph`) or quotes, and drop "we denote".
  - Inline math reaches the text as TeX (`\pi_{\text{rlhf}}`). For cards, keep the `<math>` elements (`clean()` already keeps MathML) rather than the alttext.

### Example cards

**Figure** (lead visuals)
- *s1: Simple test-time scaling*, Figure 1 (476×224, `at` 0.003): "Test-time scaling with s1-32B. We benchmark s1-32B on reasoning-intensive tasks and vary test-time compute."
- *Gemini 2.5*, Figure 1 (471×277): "Cost-performance plot. Gemini 2.5 Pro is a marked improvement over Gemini 1.5 Pro, and has an LMArena score that is over 120 points higher …"
- *Natural emergent misalignment from reward hacking*, Figure 1 (279×559, tall): "Learning reward hacks on production coding environments generalizes to a range of misaligned behaviors …"

**Table**
- *Chinchilla*, Table 1, 7×3: "Current LLMs. We show five of the current largest dense transformer models, their size, and the number of training tokens."
- *ImpossibleBench*, Table 1, 5×2: "Different prompt variants tested on Conflicting-LiveCodeBench …"

**Equation**
- *Chinchilla*: `\hat{L}(N,D) \triangleq E + A/N^{\alpha} + B/D^{\beta}`
- *Causal mediation analysis*: `TE(set-gender, null; y) = E_u[ y_set-gender(u) / y_null(u) − 1 ]`
- *Preferences Implicit in the State of the World*: `p(s_0 | θ) = Σ_{s_{−T}, a_{−T}, …, a_0} p(τ_0 | θ)`

**Theorem / definition**
- *Proper Scoring Rules to Max-Min Optimal Forecast Aggregation*, Definition 3.2 (Bregman divergence): "Given a differentiable, strictly convex function G: S → ℝ … the Bregman divergence between p and q with respect to G is D_G(p ∥ q) …"
- *Are You Smarter Than a Random Expert?*, Definition 2.2: "We say that 𝓘 = (Ω, ℙ, S, Y) for k experts satisfies weak informational substitutes if for all A ⊆ B ⊆ [k] and i ∈ [k], v(Y_{A∪{i}}) − v(Y_A) ≥ v(Y_{B∪{i}}) − v(Y_B)."

**Algorithm**
- *AutoDAN*, Algorithm 2, AutoDAN-HGA: "Input: prototype jailbreak prompt J_p, keyword list L_refuse … Initialize population with LLM-based Diversification …"
- *Learning to Understand Goal Specifications*, Algorithm 1: "AGILE Discriminator Training"

**Contributions**
- *Deep Ignorance*: "We make four key contributions: 1. **Knowledge Prevention:** … filtering pipeline that accounts for less than 1% of total training FLOPS … 2. **Tamper-Resistance:** … up to 10,000 steps and 300M tokens of adversarial fine-tuning … 3. **Defense-in-Depth** … 4. **Model Suite** …"
- *Preferences Implicit in the State of the World*: "Our contributions are threefold. First, we identify the state of the world at initialization as a source of information about human preferences. Second, …"

**Claim list** (bold-led)
- *Causal Mediation Analysis*: "**Gender bias is sparse:** Much of the effect is concentrated in relatively few model components. · **synergistic:** … · **decomposable:** …"
- *Natural emergent misalignment*: "1. **Code sabotage.** When we place models into an unmodified Claude Code agent scaffold … 2. **Unprompted alignment faking.** …"

**Limitations**
- *Codex* (427 words): "While Codex is able to sample correct solutions for the majority of HumanEval problems, we find that it has a number of limitations. First, Codex is not sample efficient to train …"
- *Deep Ignorance* (318 words): "Our experiments here are limited to a particular set of models … We only study unimodal 6.9B parameter language models without instruction fine-tuning."

**Result sentence**
- *s1* (abstract): "… our model s1-32B exceeds o1-preview on competition math questions by up to 27% (MATH and AIME24)."
- *Language Models Learn to Mislead Humans via RLHF*: "RLHF also makes the model harder to evaluate: our subjects' false positive rate increases by 24.1% on QuALITY and 18.3% on APPS."
- *ImpossibleBench*: "LLM-based monitors can detect 86-89% of cheating attempts on Impossible-LiveCodeBench, but struggle more with the more complex Impossible-SWEbench (42-65% detection rate)."

**Definitional sentence**
- *Limitations of Agents Simulated by Predictive Models*: "We use the term 'predictor-policy incoherence' to refer to the distinction between the predictive model's prediction of the performance of an average agent, and the performance of its own simulated agent."
- *ZeRO*: "Besides these model states, the rest of the memory is consumed by activations, temporary buffers and fragmented memory which we call residual states."

### Notes for the existing Figures view

- The ar5iv fallback still helps occasionally: `2602.04899` is a 404 on arxiv.org/html but ar5iv has it. Where neither has the paper, ar5iv answers **200 after redirecting to `arxiv.org/abs/<id>`** (4 of 5 checked), or with a "No content available" page (1 of 5). `build()` then caches an empty list with `src` set to the ar5iv URL instead of taking the 404 branch. The result is correct (no figures), but those papers can be recognised as "no HTML" by checking for `ltx_document`.
- "Tables" include figures typeset as tables (prompt examples and the like). In *Limitations of Agents Simulated by Predictive Models*, "Figure 2" comes back as a 5×3 HTML table. That is the intended behaviour, but a picture feed should filter on `!f.table`.

## 3. arXiv items without HTML, and other PDFs (12 documents)

| Card type | Docs with at least 1 | Notes |
|---|---|---|
| Abstract by regex | about 8-9/12 | `\bAbstract\b[\s.:—–-]*\n?(.{150,2500}?)(?=\n\s*(\d\.?\s*\|I\.\s*)?Introduction\b\|\n\s*Keywords?\b\|\n\s*1\s+[A-Z])` with dotall. Misses: no "Abstract" heading (Gabriel 2021, FSF v1, *Situational Awareness*). One false hit inside a 71-page report (*Release Strategies*). Hyphenation ("un- likely") needs `-\n(?=[a-z])` joined first. Fallback: the first paragraph after "Executive summary", "Summary" or "Introduction" |
| Section headings | 12/12, noisy | A line of 3-90 chars matching `^\d{1,2}(\.\d{1,2}){0,2}\.?\s+[A-Z].{2,80}$`, a roman-numeral or ALL-CAPS heading, or a known name (Introduction … Conclusion, References, Appendix). Noise: running heads ("I. Gabriel" ×10), numbered list items, reference entries, TOC lines with page numbers ("Future work 6"). Known-name headings: at least 2 in 12/12 docs. pdf.js `getOutline()` is better where the PDF has bookmarks (LaTeX + hyperref) |
| Figure/Table captions with page | 9/12 (78 captions; *Situational Awareness* 44, *specification gaming* 19) | `^(Figure\|Fig\.\|Table\|Exhibit\|Chart)\s*(\d+\|[IVX]+)\s*[:.\|—–-]\s*(.{10,400})` per page, deduplicated by kind and number. Raw text cuts captions at the first line break ("Rough estimates of past and"), so join lines up to the next blank line or a line starting with a capital after a full stop. Lost when the page number runs into the label ("Table 39 1:") |
| Embedded raster images (≥150 px) | 5/12 | `pdfimages -list`. Vector charts (most LaTeX and Google Docs plots) do not count, so this underestimates figures |
| Result sentences | 4/12 (26) | Same regex as for arXiv. *Situational Awareness* has 21 |
| Definitional sentences | 4/12 | e.g. FSF v1: "… capability levels at which models may pose severe risks (which we call 'Critical Capability Levels (CCLs)') …" |
| Limitations / future work heading | 2/12 | *specification gaming* ("6. Limitations", "7. Future work") and FSF v1. A third hit was a line fragment, not a heading |

Example cards:
- **Caption with page** (*Demonstrating specification gaming in reasoning models*, p. 3): "Figure 1: Different kinds of unexpected behaviors over all …", which links to the rendered page. Hanson, p. 7: "Fig. 2. Sawtooth asset representation."
- **Abstract** (*Structured access*, a Word PDF): "Structured access is an emerging paradigm for the safe deployment of artificial intelligence (AI). Instead of openly disseminating AI systems, developers facilitate controlled, arm's length interactions …"
- **Result** (*Can LLMs democratize access to dual-use biotechnology?*): "A preliminary assessment suggests that removing under 1% of all publications in PubMed … would suffice to eliminate nearly all of the risk."

## 4. LessWrong / Alignment Forum / EA Forum posts (15 sampled; preview images for 460)

### Yields

| Card type | Items with at least 1 | Mean per item | Median | Max |
|---|---|---|---|---|
| Headings (an outline of at least 3) | 11/15 (73%) | 6.5 | 6 | 22 |
| TL;DR / summary block | 3/15 (20%) | 0.2 | 0 | 1 |
| Epistemic status / confidence line | 1/15 (7%) | 0.1 | 0 | 1 |
| Bold one-liner paragraph | 4/15 (27%) | 0.9 | 0 | 8 |
| Bold lead-in (paragraph starts bold) | 4/15 (27%) | 0.5 | 0 | 4 |
| Blockquote (at least 40 chars) | 7/15 (47%) | 2.5 | 0 | 24 |
| Footnote | 5/15 (33%) | 5.3 | 0 | 33 |
| Body image | 12/15 (80%) | 2.9 | 2 | 13 |
| Table | 2/15 (13%) | 0.6 | 0 | 6 |
| Math | 2/15 (13%) | - | - | - |
| Claim list (3-12 items, mostly 30-350 chars) | 10/15 (67%) | 1.9 | 1 | 8 |
| Result or probability sentence with a number | 8/15 (53%) | 1.9 | 1 | 10 |
| Definitional sentence | 3/15 (20%) | 0.3 | 0 | 2 |

Four of 15 posts have no headings at all: *The Rocket Alignment Problem*, *Expecting Short Inferential Distances*, *Feature Selection* and *Morality is Scary*. Those give only pull-quote and sentence cards. About 10-15 usable cards a post, of which footnotes make up a third.

### Recipes (`htmlBody`, CKEditor markup)

- **Preview image:** batch the GraphQL query `{p0: post(input:{selector:{_id:"…"}}){result{socialPreviewImageUrl}} p1: …}`, about 40 aliases a request, one request a second, sent to `www.lesswrong.com/graphql` or `forum.effectivealtruism.org/graphql`. Images are on `res.cloudinary.com` (254 of 289), `39669.cdn.cke-cs.com` (15) and a few third-party hosts. The same query returns `tableOfContents` (sections with ids) and `contents.wordCount`.
- **Headings:** `h1`-`h4` (posts use `h1` freely; 23 in the sample).
- **TL;DR:** a paragraph matching `^\W{0,3}(tl;?dr|tldr|summary|in short|short version|bottom line|key takeaways?|executive summary|abstract|overview)\b\W` in the first 40 paragraphs, **or** a heading of that name. Take the following siblings until the next heading, up to about 900 chars. When the matching paragraph is only a label ("Tl;dr:", "Overview:"), the content is the next `ul` or `p`. This happened in 2 of 3 cases.
- **Epistemic status:** `^\W{0,3}(epistemic (status|state|effort)|confidence)\b` in the first 30 paragraphs.
- **Bold one-liner:** a `p` of 20-250 chars whose `strong`/`b` children make up at least 80% of its text. In EA posts these are often chart captions ("Figure 2: The Optimizer's Curse (illustrative)"), which belong with the image. **Bold lead-in:** `p > strong:first-child` of 15-200 chars.
- **Blockquote:** top-level `blockquote` of at least 40 chars. Linkposts quote the paper's abstract this way (`fJtELFKddJPfAxwKS`), and *Did Claude 3 Opus align itself via gradient hacking?* has 24 quoted model transcripts.
- **Footnotes:** `.footnote-item` (with `.footnote-content`; references are `.footnote-reference`). Strip the leading `^`.
- **Images:** `figure.image img` (with `figcaption` when present). Width hints are in `figure@style` (`width:51.02%`) and `image_resized`. Skip images with emoji, icon, avatar or logo in the URL.
- **Math:** `.math-tex` / `.mjx-chtml` (pre-rendered MathJax CHTML); display math is `.mjpage__block` / `.mjx-block`.
- **Claim list:** top-level `ul`/`ol` not inside footnotes, with 3-12 `li`, at least 70% of them 30-350 chars.
- **Result or probability sentence:** the arXiv results regex plus `\b\d+(\.\d+)?\s?% (chance|probability|likely|confiden)`, `\bp\s?=\s?0?\.\d+` and `(probability|chance|odds) (of|that)[^.]{0,60}\d+\s?%`.

### Example cards

- **TL;DR** (*Natural emergent misalignment*, linkpost): "[Abstract] We show that when large language models learn to reward hack on production RL environments, this can result in egregious emergent misalignment …"
- **Epistemic status** (*What does it take to defend the world against out-of-control AGIs?*): "Confidence level: What I currently believe and why. I mainly work on technical alignment and don't consider myself an expert on AGI deployment / governance issues. Interested in feedback and pushback."
- **Bold lead-in** (*Models Don't "Get Reward"*): "**I claim this is actually NOT how vanilla reinforcement learning works.**"
- **Claim list** (*Models Don't "Get Reward"*): "A model takes some actions. → If a human approves of these actions, the human gives the model some reward. → Humans can be deceived … → Models will take advantage of this … → Models will therefore become deceptive."
- **Pull quote** (*Did Claude 3 Opus align itself via gradient hacking?*): "Claude 3 Opus is unusually aligned because it's a friendly gradient hacker. It's definitely way more aligned than any explicit optimization targets Anthropic set …"
- **Number** (*Social Dark Matter*): "These days, somewhere between 10% and 25% of my social circle wears that label as part of their identity."
- **Footnote** (*What does it take …*): "You shouldn't think too hard about the fact that I wrote '90%+' here. After all, I didn't think too hard about it! …"

## 5. QURI wikis (10 sampled; rates for all 155 pages)

Starlight sites. The content is `.sl-markdown-content`; remove `.sr-only`, `.sl-anchor-link` and `.pagination-links`.

| Card type | Sample of 10 | All 155 pages | Notes |
|---|---|---|---|
| Headings (at least 3) | 8/10 | 132/155 (85%) | `h2.level-h2` etc. |
| **Table** | 8/10 (1.1 a page) | **72/155 (46%)**, 158 tables | Median 6 rows × 3 cols; 77% fit 3-12 × 2-5, so they are card-sized. Delegation Risk 41/66 pages, Reasoning Processes 17/27 |
| **Mermaid diagram** | 1/10 | 14/155 (9%), about 25 diagrams | `pre.mermaid` holds the source text (`flowchart TB …`), rendered in the browser with mermaid.js. Delegation Risk 9, Reasoning Processes 3, Evaluation Engineering 2 |
| Callout (`aside.starlight-aside`) | 5/10 | 73/155 (47%) | **On Priors (39 pages), every callout is boilerplate** ("Note · author · date · Completeness ★★☆"); skip it. The rest are real content ("Canonical definition", tips) |
| Claim list | 7/10 | 128/155 (83%) | Many are definition lists ("**Least Privilege**: minimum permissions …") |
| "Open questions" section | - | at least 25/155 (16%) | A recurring heading; a list of 3-5 crisp research questions |
| Bold lead-in / one-liner | 5/10, 4/10 | 51 (33%), 36 (23%) | |
| KaTeX math | 3/10 | 52/155 (34%) | `.katex` (MathML in `.katex-mathml`) |
| Result sentence with a number | 4/10 | 47/155 (30%) | |
| Image | 2/10 | 14/155 (9%), all on Priors | Imported Google Docs images |
| `og:image` | 0 | 0/155 | |

Example cards:
- **Table** (*Delegation Risk: Concepts*): "Harm mode | Probability | Damage | Contribution", 4×4. *The Funding Effect*: "Domain | Metric | Estimate (95% CI) | Source", 9×4. *Naive Rationalism …*: "Naive Rationalism / Modern Thought | Anti-rationalism | Mature Rationalism", 10×4.
- **Definition list** (*Concepts*): "**Harm surface**: the set of distinct ways a delegation can go wrong … **Exposure**: the worst-case loss across that surface … **Delegation risk**: the expected loss, probability times damage summed over the surface."
- **Open question** (*Hardening: Calibration*): "How do you estimate tail calibration when the high-confidence regime is, by design, the rarest, and therefore the least-sampled?"
- **Diagram** (a Delegation Risk case study): `flowchart TB subgraph Perceived["What Each Actor Sees"] A1["Country A"] -->|"treaty"| B1["Country B"] … subgraph Reality["Actual Network"] …`

Other web pages (6) have more headings (21.7 a page), claim lists (83%) and images (4/6), and rarely have callouts or tables. Epoch's literature review is the exception, with 23 tables. Lab blogs (Anthropic, Apollo) have `og:image`, a TL;DR-like lead paragraph, and figure images named after the figure (`Figure_1_overview.webp`).

## 6. Internet Archive scans (8 books)

### OCR text and quality

Per-page text costs almost nothing: `<id>_hocr_pageindex.json.gz` (3-8 KB) is a list of `[textStart, textEnd, hocrStart, hocrEnd]`, one per hOCR page, indexing into `<id>_hocr_searchtext.txt.gz` (100-900 KB). Seven of the 8 books have these files. The 2007-era ABBYY scan (Venn) has only `_djvu.xml`, which gives 5.6 MB of `<OBJECT>` and `<WORD>` elements.

| Book | Pages | Median words a page | Alphabetic tokens | English-vocabulary hits* | Garbage tokens | Comment |
|---|---|---|---|---|---|---|
| Venn, *Logic of Chance* (1866) | 413 | 263 | 0.95 | 0.90 | 0.2% | clean |
| Bradley, *Principles of Logic* (1922) | 428 | 439 | 0.96 | 0.91 | 0.0% | clean |
| Maxwell, *Treatise* vol. 2 (1873) | 502 | 334 | 0.90 | 0.86 | 0.6% | math garbles ("with respect to ^") |
| De Morgan, *Formal Logic* (1847) | 365 | 437 | 0.91 | **0.74** | 1.1% | long s read as f ("Firft", "cafe", "feen") |
| Cayley, *Papers* vol. 13 | 598 | 326 | **0.63** | 0.81 | 1.2% | formula-heavy; prose is fine |
| *Chess Player's Chronicle* (1868) | 635 | 747 | 0.83 | 0.80 | 0.9% | game notation |
| Wittgenstein, *Tractatus* (1971 printing) | 232 | 265 | 0.88 | 0.62 | 1.1% | German facing pages (the vocabulary list is English only) |
| Whitworth, *Choice and Chance* (1870) | 278 | 211 | 0.85 | 0.91 | 0.8% | fractions garble ("10 ^ 1 1 X -;r") |

\*The share of 3+ letter words found in a 14k-word vocabulary built from this study's modern texts. It is a rough proxy, not a spell-checker.

So sentence and quote cards from scans are viable for prose books: 6 of 8 have at least 0.8 vocabulary hits. Quotes should be shown as a crop of the page image with the OCR text kept for search, because OCR errors are visible in plain text (long s, math). hOCR word bounding boxes make such crops exact.

### Finding plates and figures cheaply

1. **Plates (whole-page illustrations).** Take candidate leaves with fewer than 25 OCR words, excluding the first 4 and last 3 leaves. That gave 6-29 a book, 99 in all, of which 69 were measured. Fetch a `page/n<k>_w200.jpg` thumbnail (about 15 KB) for each and measure it inside a 6%/8% margin crop: background as the 90th-percentile grey; `dark` as the share of pixels more than 60 levels below the background; `mid` as the share 25-60 below (grey tone); and `rows_ink` as the share of rows that are more than 2% dark.
   - Blank: `dark` < 0.005 and `rows_ink` < 0.02. 34 of 69 candidates.
   - **Plate: `rows_ink` ≥ 0.2, `dark` < 0.6 (solid black filler pages in the De Morgan scan measure 0.83-0.86), `mid` < 0.2 (covers and boards are grey-toned), and not among the last 8 leaves (a back pastedown with a library label in Cayley).** This found 3 true plates: Maxwell n480 (Fig. XV, "Cylinder magnetized transversely …") and n486 (Fig. XVIII, "Circular Current"), and Cayley n544 (a fold-out of circle constructions). The thin line drawings in Cayley have `dark` of only 0.019, so "ink variance" thresholds must be low and driven by `rows_ink`. Title pages fall below the threshold (`rows_ink` 0.03-0.18).
   - The text pages used as controls have `dark` 0.05-0.22 and `rows_ink` 0.44-0.88, but they also have hundreds of words, so the word count separates them first.
   - **Pitfall: hOCR page index is not the same as the BookReader `n` index.** In the *Tractatus*, `_scandata.xml` marks 6 leaves `Delete` (plus 2 color cards and 2 covers): 232 hOCR pages against 226 viewer pages. Every "plate" the rule found there (7) was a text page shifted by the offset. Map hOCR pages to leaves through `_scandata.xml` (skip `pageType` Delete, or use `addToAccessFormats`) or `_page_numbers.json` (`leafNum`) before fetching `n<k>` images. Without the *Tractatus*, the rule had no false positives in this sample.
   - `_scandata.xml` `pageType` is no help for plates: it says only Normal, Title, Cover, Color Card, Copyright or Delete.
2. **Inline figures.** In `_hocr.html` (9-72 MB, so stream it and do not store it), Tesseract marks non-text blocks as `div.ocr_photo` with a `bbox`.
   - Maxwell: 95 blocks on 78 of 502 pages. In 8 checked pages, 6 boxed real figures (Fig. 25's three right-handed screws, Fig. 37, coil diagrams, a helix, the end plates; one box covered only part of a plot). One boxed an equation and one the back cover.
   - Whitworth: 9 blocks. Five are on covers and end leaves, and the 2 checked on text pages boxed a library stamp and an ink mark.
   - **Require a line starting `Fig.`, `FIG.` or `Plate` within about 5% of the page height below or above the box.** That removes the stamps and equations and gives the caption text. Crop from `page/n<k>_w<width>.jpg` using `bbox × width / pageWidth`; the page size is in the `ocr_page` title.
   - Books with pictures typeset into text pages (*Chess Player's Chronicle* diagrams, Cayley's inline figures) are only found this way.

Example cards:
- **Plate** (Maxwell vol. 2, n486): "Fig. XVIII · Art. 487, 702 · *Circular Current*". A full-page line drawing of field lines.
- **Inline figure** (Maxwell vol. 2, n176): "Fig. 25. Relations between the positive directions of three right-handed screws." A woodcut found by `ocr_photo` with its caption line.
- **Quote** (Venn): an hOCR line crop plus text, e.g. from "LOGIC OF CHANCE. [chap. vii.] such generalizations as those spoken of above, and for testing their correctness …"

## 7. Which feeds the yields support

| Feed | Main sources | Rough corpus volume | Card size | Ready? |
|---|---|---|---|---|
| Pictures / "top graph" (Board, masonry) | arXiv figures (`extract()`), LessWrong preview and body images, web `og:image`, Maxwell-style plates | About 6,400 arXiv figures (650 lead figures), about 315 post previews and about 1,450 post body images, plus a few hundred web images | Known aspect ratio (`w`/`h`); median about 2:1, some tall | Yes: the data path exists |
| Tables | arXiv HTML tables, QURI tables, Epoch | About 3,800 + 158 | 2-25 rows; sanitized HTML | Yes (`extract()` has `html`) |
| Claims (Deck, Twitter-like) | result sentences, contributions, bold-led lists, post claim lists, numbers in posts | About 2,600 arXiv sentences + about 950 post lists | 50-360 chars | Needs the sentence filter (about 75% precision) |
| Definitions / glossary | `ltx_theorem_defin*`, definitional sentences, QURI definition lists | About 1,600 sentences (about half good) + theorem blocks in about 13% of papers | Short | Needs the emphasized-term filter |
| Equations | numbered MathML equations | About 2,000 | One line plus context | Yes, with MathML rendering |
| Limitations / open questions | arXiv limitations and future-work sections, QURI "Open questions" | About 175 + about 25 pages of question lists | Paragraph or list | Yes |
| Quotes and footnotes | post blockquotes and footnotes, scan text crops | About 1,250 + about 2,600 (posts) | Paragraph | Yes for posts |

## Caveats

- These are small samples (30, 15, 10, 12 and 8 items). Per-item counts are heavy-tailed: *Causal Mediation* has 33 figures and *Phantom Transfer* 36 tables. Treat the corpus projections as order-of-magnitude.
- Caption classes (chart, diagram, other) come from keyword regexes on captions, not from looking at the images.
- Precision was hand-labelled on 20 result sentences and 15 definitional sentences only.
- The plate rule was checked by eye on contact sheets for 3 of the 8 books (Maxwell, *Tractatus*, Cayley). `ocr_photo` was checked on 8 Maxwell pages and 2 Whitworth pages.
- The study's scripts and intermediate JSON are in the session scratchpad, not in the repo. The recipes above are written out so they can be rebuilt as a `/cards` route.
