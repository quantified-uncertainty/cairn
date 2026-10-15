# Item metadata schema

Each item in the corpus gets a small record that answers what a reader asks before opening it: what is it about, what kind of thing is it, how hard is it, what is it made of, who is it for, how new is it, how long will it take, and what is the point. The header's compact indicator, filters and the wall can all read the record. This document defines every field, gives anchors from the corpus for every scale level, and sets out the procedure the batch classifiers follow. It is written so that two classifiers given the same item agree.

## Files

| File | What it holds |
|---|---|
| `data/meta-schema.json` | JSON Schema (draft 2020-12) for `data/meta.json`, plus `x-*` blocks: genre, stance, audience and era definitions with display codes, scale labels, length classes, the reading-time rule, the maths-area vocabulary and the field taxonomy (`x-taxonomy`). It is the source of truth for every enum. |
| `data/meta.json` | `{"version": 1, "built": "YYYY-MM-DD", "taxonomy": {…copy of x-taxonomy…}, "items": {"<id>": {record}}}`. The server serves it at `/meta.json`, and `ui/js/corpus.js` merges each record as `it.meta`. |
| `data/meta/calibration.json` | 40 hand-classified items covering every lane and all 20 genres, in the same item format, with a `titles` map for human readers. Give it to the batch classifiers as examples. Each record's `note` explains its edge-case decisions. |

JSON Schema cannot check that a field path exists in the taxonomy, or that `len` agrees with `mins`. The batch pipeline must check both (see [Checking](#checking)).

## The record

```json
"web:transformer-circuits.pub/2024/scaling-monosemanticity/index.html": {
  "field": ["AI", "Alignment", "Interpretability", "Sparse autoencoders"],
  "genre": "empirical", "stance": "reports",
  "tech": 4, "math": 2, "mathAreas": ["linear algebra", "optimisation"],
  "formal": 0, "empirical": 2, "code": 0,
  "prereqs": ["transformer internals", "sparse dictionary learning"],
  "audience": "researcher", "era": "recent",
  "len": "l", "mins": 165,
  "gist": "Sparse autoencoders scale to Claude 3 Sonnet, finding millions of interpretable features.",
  "basis": "text", "by": "calibration"
}
```

| Key | Type | Req. | Answers |
|---|---|---|---|
| `field` | path of 2–4 names | yes | What is it about? |
| `also` | 0–2 paths | no | What else is it substantially about? |
| `genre` | enum (20) | yes | What kind of document is it? |
| `stance` | enum (9) | yes | What is it trying to do: argue, report, teach…? |
| `tech` | 1–5 | yes | How much field background does it assume? |
| `math` | 0–5 | yes | How advanced is the mathematics you must work through? |
| `mathAreas` | 1–4 from a vocabulary | if `math` ≥ 2 | Which mathematics? |
| `formal` | 0–2 | yes | Are there proofs or derivations? |
| `empirical` | 0–2 | yes | Is there evidence from the world: data, experiments? |
| `code` | 0–2 | yes | Is there program code or pseudocode? |
| `prereqs` | ≤3 phrases of ≤4 words | no | What should I already know? |
| `audience` | enum (6) | yes | Who was it written for? |
| `era` | enum (5) | yes | How new is it, or how important, relative to its field? |
| `len` | xs…xxl | yes | Size class, derived from `mins`. |
| `mins` | integer | yes | Minutes to read the main body carefully. |
| `gist` | ≤12 words | yes | What is the point? |
| `lang` | ISO 639-1 | if not English | What language is it in? |
| `basis` | enum | yes | What did the classifier actually see? |
| `by` | string | no | Who classified it (`calibration` or a model id). |
| `note` | ≤240 chars | no | Why an edge case went the way it did (for audits; the UI ignores it). |

How this refines the brief:

- **Formality, evidence and code have three levels, not two.** Whether proofs, data or code are *central* or only *present* tells a reader what the document is made of. A yes/no flag would mark half the corpus "has some numbers".
- **Era gained `historical`.** A landmark such as Shannon's 1948 paper (`classic`) needs telling apart from an ordinary 1908 slide-rule manual (`historical`): one is still read for its content, the other for its period.
- **Stance applies to every item and is independent of genre.** A survey can argue a thesis, and an essay can merely report. For `argues` and `critiques`, the gist states the thesis, so no separate thesis field is needed.
- **`basis`, `lang`, `by` and `note` were added for trust and audits.** A record classified from a title alone should be easy to find and redo.
- **`len` is derived from `mins`**, so the two never disagree.

## 1. Field

The field is a path from broad to specific: `["AI", "Alignment", "Interpretability", "Sparse autoencoders"]`.

1. **Subject, not venue, lane or method.** A LessWrong post about interpretability goes under AI; a story satirising AI labs goes under AI › Governance › Labs & industry, with literature as `also`.
2. **Two to four levels.** Levels 1–3 must be names from `x-taxonomy`, spelled exactly. Level 4 is a specific free term: up to 4 words, sentence case, no repeat of level 3. Reuse a suggested leaf (`leaves` under each level-3 node) when it fits, so the vocabulary stays small. Leave level 4 out when nothing more specific is true. A broad work stops at the deepest level that covers most of it: MacKay's textbook is `["Information theory", "Coding"]`.
3. **`also`: 0–2 paths**, for a second subject that takes at least a quarter of the content or is the item's key link to another field. Never repeat an ancestor of the primary path.

**Where to put items that could go in two places:**

| Case | Home |
|---|---|
| Forecasts about AI (timelines, benchmark trends, scenarios) | Forecasting › AI forecasting. Strategy given those forecasts: AI › Governance › Strategy & macrostrategy |
| Decision theory | About AI agents (MIRI/Alignment Forum): AI › Alignment › Agent foundations. Philosophical: Philosophy › Decision theory. Mathematical: Mathematics › Game & decision theory |
| Logic | Symbolic or mathematical: Mathematics › Logic & foundations. Traditional, inductive, reasoning manuals: Philosophy › Logic & reasoning |
| Biases | Practical rationality (LessWrong style): Epistemics › Rationality. Academic psychology: Psychology & self › Cognition |
| Catastrophic risk not specific to AI | Social science › Global catastrophic risk |
| Training for safety (harmlessness RLHF, Constitutional AI) | AI › Alignment › Training methods. General post-training: AI › Language models › Post-training |
| Ciphers of any era | Computing › Cryptography. Commercial telegraph codes, which save cost and are not secret: Engineering › Telecommunications › Telegraphic codes |
| Squiggle, Guesstimate, Fermi and cost-effectiveness models | Forecasting › Quantitative estimation |
| QURI wikis | Delegation Risk: AI › Alignment › Safety engineering. Evaluation Engineering: Epistemics › Evaluation. Robust Reasoning Processes: Epistemics › Reasoning processes, except pages about AI oversight protocols (AI › Alignment › Oversight & honesty). QURI Priors: by topic |
| History of a field | That field's own history node (Mathematics › Historical mathematics, Probability › History of probability, Physics › Mechanics › History of mechanics). General history: Humanities › History |
| Internet Archive shelf labels ("shelved under mechanics") | Hints only. *The works of Archimedes* is Mathematics › Historical mathematics › Greek mathematics |

**Domains (level 1, with display code) and their level-2 nodes.** The 362 level-3 nodes, with abbreviations, scope notes and suggested leaves, are in `x-taxonomy`.

| Code | Domain | Level 2 |
|---|---|---|
| AI | AI | Alignment · Governance · Language models · Machine learning |
| FC | Forecasting | Judgmental forecasting · Calibration & track records · Scoring & evaluation · Prediction markets · Quantitative estimation · AI forecasting · Risk forecasting · Forecasting infrastructure |
| EP | Epistemics | Rationality · Evaluation · Reasoning processes · Institutional epistemics · Argument & discourse |
| MA | Mathematics | Probability · Statistics · Logic & foundations · Analysis · Algebra & geometry · Optimisation · Game & decision theory · Combinatorics & number theory · Recreational mathematics · Calculation & numerical methods · Historical mathematics |
| IT | Information theory | Foundations · Coding · Compression & rate-distortion · Algorithmic information · Information & learning · Information & statistics · Information & gambling · Network & quantum information |
| CS | Computing | Cryptography · Formal methods · Software & security · Programming languages · Algorithms & complexity · History of computing |
| SC | Systems & control | Cybernetics · Control theory · Systems theory · Living systems · Information & control |
| PH | Physics | Mechanics · Electromagnetism · Optics · Thermodynamics & statistical mechanics · Quantum physics |
| EN | Engineering | Telecommunications · Electrical engineering · Mechanical engineering · Civil & transport · Navigation & seafaring · Printing & typography · Patents & invention |
| LS | Life sciences | Medicine & health · Genetics · Biology · Neuroscience · Physiology |
| SS | Social science | Economics · Politics & law · Global catastrophic risk · Effective altruism · Communities · Sociology & culture · Education · Military science |
| PS | Psychology & self | Cognition · Emotion & motivation · Self-improvement · Relationships & family · Personal experience |
| PL | Philosophy | Ethics · Epistemology · Logic & reasoning · Mind · Decision theory |
| GM | Games | Tabletop RPGs · Wargames · Chess & board games · Card & parlour games · Game design |
| HU | Humanities | History · Literature · Linguistics · Religion · Arts & music |

AI › Alignment has 13 level-3 nodes: Interpretability, Evaluations, Control & monitoring, Oversight & honesty, Deception & scheming, Reward & generalisation, Training methods, Robustness & security, Agent foundations, Multi-agent safety, Safety engineering, Threat models, and Agendas & strategy. The taxonomy was built from all ten lanes. It also covers the planned Technical books lane (mathematics, statistics, ML, control and computing texts).

## 2. Genre

Genre is the kind of document, judged from its content. Venue never decides it: a LessWrong post that reports experiments is `empirical`, and an arXiv paper that only argues is `position`.

**Decision order.** Take the first rule that fits:

1. **Form:** `rules`, `periodical`, `collection`, `fiction`, `news`, `puzzles`, `reference`.
2. **Book-length:** `textbook` teaches established material, `monograph` is original work, `handbook` shows how to do something.
3. **Research:** `benchmark` if the dataset is the contribution. Otherwise `empirical`, `method` or `theory`, by the main contribution. Then `survey` if it maps a literature, `position` if it argues in paper form, `policy` if it lays down rules, and `report` if it is an organisation's account of its own system or assessment.
4. **Informal:** `essay` argues or reflects; `explainer` teaches.

| Genre | Code | Definition | Anchors (calibration items unless an id is given) |
|---|---|---|---|
| empirical | Em | New observations, experiments or data analysis are the main contribution | *Scaling Monosemanticity*; *Calibration of a thousand predictions* |
| method | Me | Proposes a technique, architecture or system and shows it works | *Attention Is All You Need*; *Constitutional AI* |
| theory | Th | Formal analysis is the contribution: definitions, derivations, theorems | *Equilibrium Refinements for MAIDs*; Shannon, *A Mathematical Theory of Communication (Part I)* |
| benchmark | Bm | Introduces a benchmark, dataset or eval suite | *SWE-bench*; *Humanity's Last Exam* (`arxiv:2501.14249`) |
| survey | Sv | Review, taxonomy, synthesis or overview | *What Grounds an Oversight Protocol?*; *Cybernetics and Second-Order Cybernetics* (`paper:heylighen-joslyn-cybernetics`) |
| position | Po | Paper-form argument, agenda or proposal | *The Vulnerable World Hypothesis*; Hanson, *Shall We Vote on Values, But Bet on Beliefs?* |
| policy | Pl | Lays down governance rules: lab frameworks, standards, draft treaties | *Frontier Safety Framework (Version 1.0)*; *An International Agreement to Prevent the Premature Creation of ASI* (`arxiv:2511.10783`) |
| report | Rp | An organisation's account of its own system or assessment: model reports and cards, eval and risk reports | *GPT-4 Technical Report*; *Anthropic's Summer 2025 Pilot Sabotage Risk Report* (`pdf:alignment.anthropic.com/2025/sabotage-risk-report/2025_pilot_risk_report.pdf`) |
| essay | Es | Informal argument or reflection, including dialogues and transcripts | *The Importance of Saying "Oops"*; *Ngo and Yudkowsky on alignment difficulty* |
| explainer | Ex | Teaches existing ideas or a practice in one sitting | *How to use and interpret activation patching*; *Delegation Risk in 5 Minutes* |
| textbook | Tb | Book-length systematic teaching of established material | MacKay, *Information Theory, Inference, and Learning Algorithms*; Ashby, *An Introduction to Cybernetics* |
| monograph | Mo | Book-length original work or treatise | Boole, *An Investigation of the Laws of Thought*; Turchin, *The Phenomenon of Science* (`book:turchin-phenomenon-of-science`) |
| handbook | Hb | Practical manual: how-to, field or trade handbook | Pickworth, *The Slide Rule: A Practical Manual*; *The New Practical Navigator* (`ia:newpracticalnav01moorgoog`) |
| reference | Rf | Material to look things up in: reference pages, glossaries, code books, catalogues, indexes | *Western Union Telegraphic Code*; Delegation Risk *Quick Reference* |
| rules | Ru | Game rules and system reference documents | *Lasers & Feelings*; Reisswitz, *Anleitung … des Kriegs-Spieles* |
| periodical | Pe | A journal, magazine, almanac or proceedings volume | *The British Chess Magazine*; *Journal of the Telegraph*, vol. 7 (`ia:JournalOfTheTelegraph1874V07`) |
| collection | Co | Several independent works bound together | *The Works of Archimedes* (Heath); Hertz, *Miscellaneous Papers* (`ia:cu31924012500306`) |
| puzzles | Pz | Problems, puzzles or exercises are the substance | Rouse Ball, *Mathematical Recreations and Essays*; Carroll, *A Tangled Tale* (`ia:tangledtale00carrrich`) |
| fiction | Fi | Stories, parables, satire | *The Company Man*; *Frog and Toad and the Increasingly Capable Machines* (`lw:7NZ6ZWjenzzCbCJ5b`) |
| news | Nw | Announces a launch, release, organisation or event | *Announcing Squiggle: Early Access*; *Announcing Apollo Research* (`lw:FG6icLPKizEaWHex5`) |

## 3. Stance

| Stance | Use when the document… | Anchors |
|---|---|---|
| argues | advocates a thesis; the gist states it | *Vulnerable World Hypothesis*; *geometric mean of odds* |
| critiques | argues against a specific claim, method, tool or work | *A critical look at Lean4* |
| proposes | puts forward a new method, design, framework, institution or theory | *Attention*; Hanson's futarchy paper |
| reports | presents findings, results or events with modest interpretation | *Scaling laws*; *Calibration of a thousand predictions* |
| explains | teaches established ideas or practice | MacKay; *activation patching* tutorial |
| surveys | maps a body of work without a strong thesis | (most surveys) |
| specifies | lays down rules, protocols or procedures | *Frontier Safety Framework*; *Lasers & Feelings* |
| narrates | tells a story: fiction, memoir, narrative history | *The Company Man* |
| records | compiles material to look up: codes, tables, periodical runs, quick references | *Western Union code*; *British Chess Magazine* |

Stance is independent of genre: *What Grounds an Oversight Protocol?* is a survey that argues.

## 4. Technicality: `tech` 1–5

How much background in the item's field does a reader need to follow its main line? Judge for a reader today, and ignore appendices.

| Level | Label | Definition | Anchors |
|---|---|---|---|
| 1 | General | No background; everyday language | *The Importance of Saying "Oops"*; *Ways to be More Cooperative in Everyday Life* |
| 2 | Informed | Some field vocabulary, explained or guessable; a curious member of the community follows it | *Calibration of a thousand predictions*; *The Vulnerable World Hypothesis* |
| 3 | Technical | A STEM-literate reader from the broad area follows it with effort; jargon used freely | *Ngo and Yudkowsky on alignment difficulty*; Shannon 1948 (Part I) |
| 4 | Specialist | Assumes working knowledge of the field, at graduate or practitioner level | *Attention Is All You Need*; *Measuring an Evaluator* |
| 5 | Expert | Assumes the subfield's recent literature and formal machinery | *Equilibrium Refinements for MAIDs*; Gray, *Entropy and Information Theory* |

Old texts get their tech from today's reader: archaic notation raises it (Maxwell's *On Governors* is 4), and unusually clear writing lowers it (Shannon is 3).

## 5. Mathematics: `math` 0–5 and `mathAreas`

`math` is the most advanced mathematics a reader must work through to follow the main line. A skippable appendix doesn't count, and neither do concepts that are only named. For example, *A critical look at Lean4* names ZFC and large cardinals but never uses them, so it is a 2.

| Level | Label | Definition | Anchors |
|---|---|---|---|
| 0 | None | Nothing beyond counting | *Ngo and Yudkowsky*; *Frontier Safety Framework* |
| 1 | Arithmetic | Percentages, simple probabilities, tables, dice, back-of-envelope numbers | *Calibration of a thousand predictions*; *Lasers & Feelings* |
| 2 | School | Algebraic formulas, logs, odds and expected value, power laws on log-log plots, vectors as arrows | *Scaling Laws for Neural Language Models*; *geometric mean of odds* |
| 3 | Undergraduate | Calculus, linear algebra, distributions, ODEs, standard ML maths; derivations to follow | *Attention Is All You Need*; *A time-invariant version of Laplace's rule* |
| 4 | Graduate | Advanced or measure-theoretic probability, functional and convex analysis, equilibrium refinements, research-grade proofs | *Equilibrium Refinements for MAIDs*; Xu and Raginsky, *Information-theoretic analysis of generalization* (`arxiv:1705.07809`) |
| 5 | Research | The mathematics is the content; proof-dense throughout | Gray, *Entropy and Information Theory*; Shen, Uspensky and Vereshchagin, *Kolmogorov Complexity and Algorithmic Randomness* (`book:shen-kolmogorov`) |

`mathAreas` lists 1–4 areas, most important first. It is required when `math` ≥ 2, optional at 1 and empty at 0. Use only this vocabulary:

arithmetic, algebra, logarithms, trigonometry, geometry, calculus, differential equations, linear algebra, abstract algebra, number theory, combinatorics, graph theory, probability, statistics, Bayesian inference, stochastic processes, causal inference, measure theory, real analysis, functional analysis, ergodic theory, information theory, coding theory, algorithmic information, optimisation, convex optimisation, control theory, dynamical systems, game theory, decision theory, mechanism design, social choice, logic, proof theory, set theory, type theory, computability, complexity theory, learning theory, statistical mechanics, quantum information, numerical methods, topology, category theory.

## 6. What it is made of: `formal`, `empirical`, `code` (0 none · 1 some · 2 central)

| | 0 | 1 | 2 |
|---|---|---|---|
| `formal`: proofs and derivations | None. *Scaling Monosemanticity*; *GPT-4 Technical Report* | Derivations, proof sketches, or proofs confined to an appendix. *Toy Models of Superposition*; *time-invariant Laplace* | Theorem-proof is the structure. Shannon 1948; Boole, *Laws of Thought* |
| `empirical`: evidence from the world | Purely conceptual, formal or fictional; illustrations don't count. *Vulnerable World Hypothesis*; Gray | Cited studies, case studies, incident reports, small or second-hand data. *geometric mean of odds*; *A critical look at Lean4* | Original data, experiments or measurements are central. *Calibration of a thousand predictions*; *Training on Documents About Monitoring Leads to CoT Obfuscation* |
| `code`: program code or pseudocode | None; a repository link alone doesn't count. *Attention*; *Toy Models* | Snippets, pseudocode or algorithm boxes. *SWE-bench* (patches); *Measuring an Evaluator* | Code carries the document: software docs, programming tutorials, tool announcements with examples throughout. *Announcing Squiggle*; *Squiggle: Technical Overview* (`lw:Drs8XNr52Ybqa57v5`) |

`code` means program code. The codewords in a telegraph code book are not code in this sense.

## 7. Audience

The audience is the reader the text was written for, not everyone who might enjoy it.

| Audience | Who | Anchors |
|---|---|---|
| general | Any curious reader | *Saying "Oops"*; Rouse Ball |
| enthusiast | Informed amateurs and community insiders: LessWrong/EA readers, hobbyist players | *Ngo and Yudkowsky*; *British Chess Magazine* |
| student | Learners working through a subject | MacKay; Ashby |
| practitioner | People applying it: engineers, forecasters, analysts, officers, clerks | *geometric mean of odds*; *Western Union code* |
| researcher | Specialists in the field or a neighbouring one | *Toy Models*; Gray |
| policymaker | Decision-makers and policy staff in governments, labs and funders | *Frontier Safety Framework*; *Vulnerable World Hypothesis* |

## 8. Era

The date bands are fixed so they are reproducible. The two status overrides carry the judgment relative to the field. Check the overrides first:

| Era | Code | Rule | Anchors |
|---|---|---|---|
| classic | Cl | A landmark: founded or defined a field or subfield and is still cited as the origin. Any age, but rarely under 3 years. A field's reading list would start with it | *Attention*; Shannon 1948 |
| historical | Hi | An ordinary period piece read today for its period: superseded manuals, code books, old magazines. Never a landmark (Boole is `classic`) | *Western Union code*; Pickworth's slide rule |
| established | Es | Dated before 2022 and still read for content | *Vulnerable World Hypothesis* (2019); *MAIDs* (2021) |
| recent | Re | Dated 2022-01 to 2025-09 | *Scaling Monosemanticity* (2024); *GPT-4 report* (2023) |
| frontier | Fr | Dated 2025-10 or later (the last 12 months before 2026-10), on an open question. Fiction and announcements are never frontier | *CoT obfuscation* (2026-05); *A critical look at Lean4* (2026-10) |

Undated QURI wiki pages are 2025–26 work: `frontier`, or `recent` for drafts that carry an earlier date. When the corpus is rebuilt, move the bands forward.

## 9. Length and reading time: `mins`, `len`

`mins` is the time to read the **main body carefully**. It leaves out references, appendices, indexes, front matter and attached system cards. Compute it as words ÷ pace, using the slowest pace that applies:

| Pace | Applies when | Words/min |
|---|---|---|
| P1 | tech ≤ 2 and math ≤ 1 (fiction always) | 230 |
| P2 | tech 3 or math 2 | 180 |
| P3 | tech 4 or math 3 | 130 |
| P4 | tech 5 or math 4 | 90 |
| P5 | math 5 | 60 |

`formal` 2 drops one more step, down to P5 at most. Tables, code books and catalogues count 1 minute per page.

**Words.** Use the corpus `words` field when it is there (posts, wiki pages). Otherwise multiply main-body pages by words per page: 550 for a single-column paper, 900 for a two-column paper, 400 for a modern book, 300 for an old octavo scan, and 450 for a large-page journal scan such as BSTJ. Scans have `n` (total pages); take about 90% of it as main body. When an arXiv PDF's page count is unknown, assume a 9–15 page main body for conference papers and read the length from the abstract for reports.

**Rounding.** Under 10 minutes, whole minutes; 10–120, the nearest 5; 120–600, the nearest 15; over 600, the nearest 60.

| `len` | Minutes | Anchors |
|---|---|---|
| xs | under 5 | *Saying "Oops"* (3); *Quick Reference* (4) |
| s | 5–19 | *Calibration of a thousand predictions* (6); *Frontier Safety Framework* (15) |
| m | 20–59 | *The Company Man* (25); *Attention* (35) |
| l | 60–239 | *Constitutional AI* (75); Shannon 1948 (225) |
| xl | 240–899 | Ashby (555); *Western Union code* (840) |
| xxl | 900 and over | Boole (1560); MacKay (2160) |

Worked example: Shannon's Part I has 46 scanned BSTJ pages, about 44 of them main body. At 450 words a page that is about 20,000 words. Tech 3 and math 3 give P3, and formal 2 drops it to P4 (90 words a minute). 20,000 ÷ 90 = 222, which rounds to 225 minutes, so `len` is `l`.

## 10. Prereqs, gist, language, basis

- **`prereqs`:** up to 3 concrete things the reader should already know, each at most 4 words. Never just the item's own field name. Leave it empty when nothing is needed. Good: `["hidden Markov models", "linear probes"]`. Bad: `["interpretability"]` for an interpretability paper.
- **`gist`:** at most 12 words in plain language; what the reader gets from it. For `argues` and `critiques`, state the thesis ("Pool forecasts with the geometric mean of odds, not averaged probabilities."). No hype words, and no starting with "This paper".
- **`lang`:** add it only when the item is not in English (Reisswitz: `de`). `mins` assumes a fluent reader of that language.
- **`basis`:** what the classifier relied on: `title`, `blurb` (`why` and tags), `abstract`, `known` (it knows the work well) or `text` (it read part of the item). Be honest; records based only on a title get redone first.

## 11. Classifier procedure

For each item:

1. **Read what the corpus provides:** `t`, `a`, `y`/`d`, `lane`, `path` (the library folder), `kind`, `src`, `url`, `why`, `tags`, `ab`, `words` and `n`. If a text sample is supplied (the first pages), read it.
2. **Find the nearest calibration items** in `data/meta/calibration.json` (same lane, same genre) and match their judgments unless this item clearly differs.
3. **Choose `genre`** by the decision order in section 2, then `stance`.
4. **Choose `field`:** the deepest level-3 node that fits, a specific level-4 term, and `also` only when it earns its place.
5. **Rate `tech` and `math`** against the anchors. Between two adjacent levels, pick the one whose anchors the item most resembles; if it is still a tie, pick the lower. Then add `mathAreas` and `formal`/`empirical`/`code`.
6. **Choose `audience` and `era`** (overrides first).
7. **Estimate words, compute `mins` by the rule, and derive `len`.**
8. **Write `prereqs` and `gist`, then set `basis`.** Add a `note` only for a real edge case.
9. **Output JSON only**, keyed by item id, using exactly the enums in `data/meta-schema.json`.

Lane-specific hints:

- **Oddities lane (scans with titles only):** most items are `historical` period manuals, codes or magazines. The landmarks are `classic`: Boole, Maxwell, Mach, Archimedes, Principia Mathematica, Rouse Ball. Use the IA shelf only as a hint. Estimate words from `n`.
- **LessWrong lane:** `why` holds only karma and reading time, so judge from the title and the author's known work, and set `basis` to `title` unless you know the post. LessWrong's "N min" reading time assumes about 230 words per minute; use `words` and the pace rule instead.
- **QURI lane:** the `path` gives the wiki and section, which maps to a field (section 1). "Getting Started" pages are usually `explainer`. "Reference" sections mix true `reference` pages (bibliographies, quick references, glossaries) with surveys of related work, so judge each page.

### Checking

A batch result must pass three checks:

- **JSON Schema:** validate against `data/meta-schema.json`. This also enforces the gist and prereq word limits, and the `mathAreas`/`math` rules.
- **Taxonomy:** levels 1–3 of `field` and of every `also` path must exist in `x-taxonomy`, and no `also` path may repeat the primary path or its ancestors.
- **Length:** `len` must match the `mins` bounds in `x-len`.

`data/meta/calibration.json` passes all three. To measure agreement, classify 100 items twice with different classifiers. Exact agreement is the target for genre and era. For tech and math, the levels should differ by at most 1 on 90% of items.

## 12. Compact codes for the header indicator

The schema carries short codes so that a dense indicator can show a whole record on one line. Domain codes are in `x-taxonomy.<L1>.code`, level 2 and 3 abbreviations in `abbr`, genre and era codes in `x-genres` and `x-eras`, and scale labels in `x-scales`. One textual rendering of the Scaling Monosemanticity record:

```
AI›Align›Interp›Sparse autoencoders   Em·rep   T4 M2(lin)   ◇data●  ⊢○  ‹›○   2h45 · '24 Re
```

Designing the indicator (glyphs, colour, layout in the top-left corner) is the next step and is not specified here.

## Left out, and why

- **Venue and peer review:** derivable from `src`, `url` and the id prefix.
- **Quality and importance:** the corpus already has `score` and `q`, and `enrich.json` adds `rel`.
- **Figure density:** the figures feature measures it directly.
- **Position in a series:** rare outside the wikis and LessWrong sequences. When it matters, a prereq ("Part 1 of the series") covers it.
- **Best pages and hooks:** these live in `enrich.json`.

## Open questions

- Are `tech` and `math` correlated so strongly in practice that one glyph could carry both? Check on the first full batch.
- Is one 4-year "recent" band right for slow fields? A 2019 information-theory paper is new for its field, but here it is `established`.
- Should `audience` allow two values? Many lab reports serve researchers and policymakers alike.
- Should a summary of the full text replace `basis: title` records in the oddities lane, where titles say little about the content?
