# Learning, agent jobs and the Dashboard: build spec

*15 October 2026. This spec is for two builders working in parallel, SERVER and UI, and for two QA agents. It settles the learning model from the design note (`learn-design/model.md` in the session scratchpad, with its simulation `sim.mjs`). It turns the source research (`learn-design/sources.md`) into the agent playbook. It follows the reader's change of direction (`learn-design/OVERRIDE.md`, and ARCHITECTURE.md, "Finding new material"): new material comes from **open jobs that an outside agent does**, not from an in-app crawler. Everything a builder needs from those notes is copied here, because the scratchpad may not survive. Built on 15 October 2026 (the server side as specified; changes made while building are marked "built:" or "added in the build"). Paths are relative to `apps/open-stacks/browser/`. Confidence on judgment calls is marked [~NN%].*

## 0. What gets built

The reader asked for four things. This is how the build answers each:

| The reader asked | This build |
|---|---|
| "Keep track of how much people read the pages" | Reading memory already records this. Each record becomes an engagement score `y` from 0 to 1 (§2.1). The memory ops gain the two facts the score needs: how a visit ended, and undone judgments (§3) |
| "Reweight how valuable and how good things are" | A learned profile gives every feature (tag, folder, author, field, lane, title word…) an interest weight. It adds one bounded term to the For you ranking, sinks finished and skipped items, and tilts the lane mix in All (§2) |
| "Occasionally search for more information like that" | The app writes **open jobs**, one Markdown file each in `jobs/open/`, from the profile and from gaps in the library. An agent such as Claude Code follows `jobs/README.md`, adds open items to the data files, checks its work with `node jobs.mjs check`, and closes the job (§7) |
| "Obvious that this is new information… in some other dashboard" | Items added by jobs carry provenance and a **NEW** badge until really read. A NEW chip in the top bar walks them, a toast announces them, and a **Dashboard** view (`Y`) shows new items, reading, what it learned, how ranking moved, and open and done jobs (§8, §9) |

| Part | Builder | Files |
|---|---|---|
| Learning maths (pure) | SERVER | `server/learn.mjs` |
| Profile service and routes | SERVER | `server/routes/47-learn.mjs` |
| Memory additions, server side | SERVER | `server/routes/45-memory.mjs` (edit) |
| Memory additions, client side | UI | `ui/js/features/memory.js` (edit) |
| Jobs: format, generator, checker | SERVER | `server/jobs.mjs`, `server/routes/96-jobs.mjs` |
| Jobs CLI, playbook, folders | SERVER | `jobs.mjs`, `jobs/README.md`, `jobs/hosts.json`, `jobs/open/.gitkeep`, `jobs/done/.gitkeep`, `jobs/assets/.gitkeep` |
| Cheap rebuild, data files for fixes | SERVER | `build-corpus.mjs` (edit: `--merge`, `--root`, overrides), `data/overrides.json`, `data/media-fixes.json` |
| Core hooks | UI | `ui/js/state.js`, `ui/js/util.js`, `ui/js/panel.js`, `ui/js/feed.js` (small edits, §8.1) |
| Learning client: score term, why lines, NEW badges, New walk | UI | `ui/js/features/learn.js`, `ui/features/learn.css` |
| Flag for agent, open-error reports | UI | `ui/js/features/flag.js` (styles in `learn.css`) |
| Dashboard view | UI | `ui/js/features/dashboard.js`, `ui/features/dashboard.css` |
| Docs | SERVER: `ARCHITECTURE.md`; UI: `README.md` | |
| Tests | SERVER: `test/learn-*.test.mjs`, `test/jobs-*.test.mjs`, `test/learn-ops.mjs`; UI: `test/dashboard-ui.mjs`, `test/fixtures/learn-ui/` | |

**Not built, and why:**

- **In-app discovery**: no scheduled querying of arXiv, Semantic Scholar, OpenAlex or the forums, no Haiku relevance judge, no Run now, no `server/discover.mjs`, no `routes/96-discover.mjs`. The reader asked for agent jobs instead. The source research becomes the playbook (§7.8). The app makes **no new outbound requests** in this build.
- **Client-side model maths** (the model note's optimistic update). The server recomputes within about 1 s of a judgment. `buildOrder(true)` keeps the next 3 items anyway, so a copy of the maths in the client would add a drift risk and a cross-builder dependency for no visible gain. [~75%]
- **Out of scope for now**: `o` (open the original) as a signal, an exploration slot, noise that shrinks as evidence grows, and per-lane trust in `q` (model §3.8). §11.5 lists them as tuning knobs.

## 1. Working in parallel

- **Each file has one owner** (table above). Make core edits surgical: use the Edit tool, never rewrite a whole file, and re-read a file right before editing it. Another workflow is editing `ui/js` at the same time (stack.js, `data/tags.json`, tag chips in the panel, an Up Next strip).
- **The contract** between the builders is §2.10 (the profile's fields), §4 (files), §5 (HTTP JSON) and §8.1 (hooks). If you must deviate, add fields and keep the old ones, and say so in your final report.
- **Before the server routes exist**, `learn.js` treats a 404 or a network error as "learning off": it registers no score term and shows no badges. The UI's Playwright script serves fixtures with `page.route` (§11.2).
- **Docs.** SERVER owns `ARCHITECTURE.md`, including the client hooks, documented with the text in §8.1. UI owns `README.md`.
- **The other workflow's pieces.** Use them when present, never depend on them:
  - `data/tags.json`: the server reads it from disk.
  - `stack.js` `stayIn`: already in core, so use it.
  - An Up Next strip: badges are applied through the DOM (§8.4).
- **Tests never write into the repo's `jobs/`.** Every test sets `STACKS_JOBS_DIR` and `STACKS_CACHE` to temp directories.

## 2. The learning model (`server/learn.mjs`)

This is a pure module: no `fs`, no timers and no app state, so tests import it directly. All numbers live in one exported `LEARN` object. Everything in this section is settled. The pass bands in §11.1 are what tuning aims at.

### 2.1 Engagement of one item

`r` is the server's memory record (§3.1). `it` is the corpus item, with `it.meta` from `data/meta.json` when present. "Flow" means `kind` is html, web or text.

```
n      = r.n || it.n                                (pages; stable pages for flow documents)
nBody  = body pages from the compiled profile (§6.3), else 0.85·(n || 14)            (pdf only)
T_exp  = minutes, first rule that applies:
           it.meta.mins
           flow: (it.words || (n || 8)·280) / 230
           pdf:  1.5·nBody
           scan: 0.5·(n || 200)
T_ref  = clamp(T_exp, 2, 40) minutes
A      = min(3·T_ref, Σ_visits min(a_v, 2·T_ref))      a_v = active ms of each row of r.v
T      = min(1, ln(1 + 4·A/T_ref) / ln 5)
τ      = 20 s per page (pdf) · 30 s per stable page (flow) · 6 s per page (scan)
p      = Σ over r.seq rows [k, c, sSec, ms] of min(c, ms/τ)            pages read at reading pace
body   = nBody (pdf) · n || 8 (flow) · n || 200 (scan)
den    = max(1, min(0.8·body, 40))
D      = min(1, max(p, 0.25·r.sc, 0.15·(r.far + 1)) / den)
days   = distinct local dates of r.v rows with a_v ≥ 30 s
R      = min(1, max(0, days − 1) / 2)
y0     = 0.50·T + 0.35·D + 0.15·R                      engagement before judgments
```

Special cases, first match wins:

| Case | Test | Effect |
|---|---|---|
| Glimpse | `nv = 0` and no judgment in `jl` | Not an exposure |
| Judged, never opened | `nv = 0` with a judgment (Keep or Dismiss in the Dashboard) | Exposure with `y0 = 0`. §2.2 sets `y`, but `w = 1` whatever the judgment: a verdict on a title alone is weaker than one after reading |
| Load failure | The item has an entry in `CACHE/jobs/errors.json` and `sc = 0`; or `n` unknown, `sc = 0` and `A ≥ 15 s` | Not an exposure (`w = 0`) |
| Quick exit | `A < 5 s`, or `sc = 0` and `A < 15 s` | `y0 = 0`. `w = 0.1` when the last visit's `via` is `jump`; else `0.35` when its `x` is `next`; else `0.2` |
| Otherwise | | `w = 1` |

### 2.2 Judgments

Replay `r.jl` in order:

| Op | Effect |
|---|---|
| `save` | S = t |
| `unsave` | S = null |
| `more` | M = t; L = null |
| `less` | L = t; M = null |
| `unmore` | M = null |
| `unless` | L = null |

Then apply:

```
if S: y = max(y, 0.9);  w = max(w, 1) + 1
if M: y = max(y, 0.8);  w = max(w, 1) + (S ? 0.5 : 1)
if L: y = 0;            w = 3
w = min(w, 3);  if nv = 0: w = 1          (judged, never opened: §2.1)
```

`y` starts at `y0`.

### 2.3 Time, labels and value

- **Time and half-life.** `t = r.last` and `H = 60` days. If S, M or L is set: `t = max(r.last, the latest of S, M, L)` (with L set, `t = L`) and `H = 180`. Decay is `d = 2^(−(now − t) / H days)`. An exposure counts `w·d` in every sum below.
- **Implicit label**, from `y0`, for the evidence counters: `skip` (quick exit), `deep` (`y0 ≥ 0.6`), `skim` (0.3 to 0.6), `glance` (under 0.3). The judgment counters `save`, `more` and `less` are kept separately, so a saved deep read counts in both `deep` and `save`.
- **Value** `V = y` after judgments, not decayed: the reader's value of an item they read. It is used for the "most valuable reads" list and for seeds.

### 2.4 Features

Membership `m` is 1 unless stated. When a feature arrives twice (for example `tag:x` from `tags.json` and from `it.tags`), keep the larger `m`. Group weights β are in brackets.

| Group (β) | Feature ids | From |
|---|---|---|
| tag (1.0) | `tag:<id>` | `data/tags.json` (`tags[].id` whose `items` include the item) and `it.tags` (lowercased, spaces to `-`). Drop tags equal to a lane id, `alignment-forum` and `advised` |
| field (1.0) | `field:A`, `field:A/B`, `field:A/B/C`, `field:A/B/C/D` with `m` 0.25 / 0.5 / 0.75 / 1 | `it.meta.field`. Each `it.meta.also` path the same, with `m` halved |
| path (0.8) | `path:<lane>/<p1>/…/<pk>`, k = 1…len | `it.path`. `m = 1` for the full path, 0.5 for each ancestor |
| author (0.6) | `au:<surname>` | `firstAuthor(it.a)` (below) |
| lane (0.6) | `lane:<lane>` | |
| tok (0.4) | `w:<word>` | Tokens of `it.t + ' ' + it.tags.join(' ')`, lowercased, matching `/[a-z][a-z-]{3,}/g`, minus the stop list below. Kept when the word's corpus document frequency is between 3 and `max(20, 0.08·N)` |
| style (0.4) | `genre:<g>`, `stance:<s>`, `aud:<audience>` | `it.meta.genre`, `.stance`, `.audience` |
| level (0.4) | `tech:<n>` (with `tech:<n±1>` at `m` 0.5, kept within 1-5), `math:<n>` (`±1` at 0.5, within 0-5), `ma:<area>` (0.5 each), `formal:<n>`, `emp:<n>`, `code:<n>` | `it.meta.tech`, `.math`, `.mathAreas`, `.formal`, `.empirical`, `.code` |
| form (0.3) | `kind:<kind>`; `src:<src>` (0.5); `len:<len>` (0.5) | `it.kind`, `it.src`, `it.meta.len` |
| era (0.3) | `yr:<band>`; `era:<era>` (0.5) | `it.y`, else the year of `it.d`; `it.meta.era` |

Year bands: `<1900`, `1900-49`, `1950-89`, `1990-2010`, `2011-19`, `2020-22`, `2023-24`, then each year (`2025`, `2026`…).

Stop list (`LEARN.stop`), copied from the simulation:

```
the and for with from that this into over under about their your what when where which while using towards toward between through against without within paper part book books volume introduction theory study notes edition more than less some most many much very also just only even does doing done have having been being were will would could should can cannot whose them they these those other others another each every such same here there then thus like make makes made making because after before during first second third new old one two three four five parts vol model models large language system systems approach approaches via based case use used learning research human method methods problems science
```

`firstAuthor(a)`:

1. Strip `(…)` groups, and anything from `b.`, `d.` or `fl.` followed by a year.
2. Cut at ` et al`, `;`, `&` or ` and `.
3. If what is left looks like `Last, First`, take `Last`. Otherwise take the part before the first comma, then its last word.
4. Lowercase the result. Single letters give null.

Org names come out as one token (`deepseek-ai`). That is fine.

Feature labels (`labelOf(f)`, for chips and the Dashboard):

| Feature | Label |
|---|---|
| `tag:x` | `tags.json` label, else `x` with `-` as spaces and the first letter capitalised |
| `field:A/B/C` | `C` (title `A › B › C`) |
| `path:llm/Reasoning` | `LLM papers › Reasoning`: the lane name, then at most the last two folders |
| `au:shah` | The commonest full first-author name among items with the feature, e.g. "Rohin Shah" |
| `lane:llm` | The lane name |
| `w:reasoning` | “reasoning” |
| Style and level | `Genre: empirical`, `Technicality 4/5`, `Maths 3/5`, `Maths: probability`, `Formal: central` (0 none, 1 some, 2 central; the same for `emp` and `code`), `For researchers`, `Stance: reports` |
| `kind:pdf`, `src:arXiv`, `len:l` | `PDFs`, `arXiv`, `Length: long` |
| `yr:2020-22`, `era:frontier` | `2020–22`, `Era: frontier` |

### 2.5 Interest weight per feature

Sums run over exposures `e` (§2.1), plus the one-time import's pseudo-exposures (§6.6):

```
μ0  = max(0.05, (Σ_e w·d·y + 5·0.25) / (Σ_e w·d + 5))       mean engagement (prior 0.25, worth 5 exposures)
W_f = Σ_e w·d·m_ef                                          exposure to f
Y_f = Σ_e w·d·m_ef·y_e                                      engagement with f
p_f = (Y_f + 4·μ0) / (W_f + 4)                              shrunk mean (κ = 4)
λ_f = clip(log2(p_f / μ0), −2, +2)
```

Features never exposed have no entry, and λ = 0. Sim values for reference: one deep read puts about +0.36 on each of its features; six TTRPG quick exits and one `less` put `lane:ttrpg` at −1.18.

### 2.6 Controls: boost, mute, ignore

The reader sets these in the Dashboard. They are stored in `CACHE/learn/controls.json` and applied after §2.5, before prediction:

| Control | λ becomes | Notes |
|---|---|---|
| boost | `min(2, max(λ, 0) + 1)` | A never-seen feature gets +1. Discover jobs may target it (§7.2) |
| mute | `max(−2, min(λ, 0) − 1.5)` | Excluded from job targets |
| ignore | `0` | Left out of chips and the interest lists. For spurious features ("title word: models") |
| none | as learned | |

A control on a `lane:` feature also moves that lane's factor (§2.7).

### 2.7 Predicted interest, the score term, familiarity, the lane factor

For an item with features `F`, grouped by `g`:

```
s_g = Σ_{f∈g} m_f·λ_f / √(Σ_{f∈g} m_f)
r   = Σ_g β_g·s_g / Σ_{g present} β_g
I   = tanh(r / 0.75)                         −1 < I < 1
term = B·I + Φ,   B = 0.8
```

Φ, familiarity, first match wins. The age is in days since `r.last`, except for new finds, where it is since `added`:

| Item | Φ |
|---|---|
| Marked less (L set) | −0.8 |
| Done: `y ≥ 0.75`, or `D ≥ 0.8`, or `n` known with `far ≥ n − 1` or `sc ≥ 0.9·n` | −0.8 |
| Quick exit | −0.4·2^(−age/30) |
| Glanced (`y < 0.3`) | −0.25·2^(−age/30) |
| In progress (0.3 ≤ y < 0.75, `D < 0.8`, age under 21 days) | +0.15 |
| New find (state `new`, §2.9, added at most 14 days ago) | +0.3·(1 − age/14) |
| Anything else | 0 |

So Φ lies in [−0.8, +0.3]. A saved item (y ≥ 0.9) counts as done and sinks: it lives in Saved.

**Lane factor** in All's round-robin: `factor(l) = 2^(0.6·λ_lane:l)`, which stays between 0.44× and 2.30×. The weight is `max(0.1, LANE_WEIGHTS[l]·factor(l))`.

**Cold start.** With no memory, every λ is 0, so I = 0 and Φ = 0. `score()` then equals today's score without the aff terms, bit for bit (S0, §11.1).

### 2.8 Explanations

Each feature's share adds up exactly to `B·I`:

```
c_f = β_g·m_f·λ_f / (√M_g · Σ_{g present} β_g)      where M_g = Σ_{f∈g} m_f;  r = Σ_f c_f
Δ_f = B·c_f·tanh(r/0.75)/r                           (B·c_f/0.75 when |r| < 1e-9)
```

- **Chips:** features with `|Δ_f| ≥ 0.05`, at most two positive and one negative, largest first. All `w:` features merge into one chip, "title words: reasoning, math", with the summed Δ.
- **Text** from the feature's counters: "+0.25 · Reasoning models: you read 3 deeply, saved 1". Use at most two phrases, from: read N deeply, skimmed N, saved N, marked N more like this, skipped N, marked N less like this. This wording is only ever shown locally.
- **Read items** get one more line: "You read this deeply · ★" (the label and the judgments).

### 2.9 Seeds, finds, calibration

- **Seeds** (for jobs): the top 30 items by `V·2^(−age/30 d)` with `V ≥ 0.6` and L not set, at most 3 per library folder (`lane` plus `path`).
- **Finds** are corpus items with an `added` date (YYYY-MM-DD, written by agent jobs, §7.5) at most 90 days old. Each has a state; the first match wins:

  | State | Test |
  |---|---|
  | `dismissed` | L is set |
  | `kept` | S is set |
  | (explicit mark) | `CACHE/learn/finds.json` `marks[id].st`: `seen` or `new` |
  | `seen` | `r.a ≥ 20 s`, or `r.sc ≥ 2`, or M is set |
  | `new` | Anything else |

  The client applies the same rule to `memoryOf(id)` (`a`, `sc`, `saved`, `less`, `more`) to clear a badge at once (§8.4).
- **Calibration.** `CACHE/learn/opens.jsonl` keeps `{id, t, I, via}` for the first visit of each item on each local day. Over the last 30 days, compute the Spearman correlation between I at open and the item's current `y`. Report it overall and per lane, and only with at least 10 opens. The target is ≥ 0.2. A value near 0 after 50 opens means §2.1's weights need refitting; the opens log is the dataset.

### 2.10 Exports of `server/learn.mjs`

```js
export const GEN = 1;                 // bump when a formula changes (stored profiles recompute)
export const LEARN = { B: 0.8, rho: 0.75, kappa: 4, kappa0: 5, mu0prior: 0.25, H: 60, Hj: 180,
  laneExp: 0.6, lamMax: 2, tau: { pdf: 20, flow: 30, scan: 6 }, Tmin: 2, Tmax: 40,
  quick: { a: 5e3, a0: 15e3 }, wQuick: { next: 0.35, other: 0.2, jump: 0.1 },
  beta: { tag: 1, field: 1, path: 0.8, author: 0.6, lane: 0.6, tok: 0.4, style: 0.4, level: 0.4, form: 0.3, era: 0.3 },
  phi: { done: -0.8, quick: -0.4, glance: -0.25, progress: 0.15, fresh: 0.3, half: 30, progressDays: 21, freshDays: 14 },
  findDays: 90, seen: { a: 20e3, sc: 2 }, seeds: { n: 30, minV: 0.6, perFolder: 3, half: 30 },
  tok: { minDf: 3, maxFrac: 0.08, maxAbs: 20 }, stop: [/* §2.4 */] };
export function firstAuthor(a)                   // → 'shah' | null
export function yearBand(y)                      // → '2020-22' | null
export function buildIndex(items, { tags, meta, lanes })   // tags: parsed tags.json or null; meta: {id: record} or null
  // → { feats: Array<Array<[g, f, m]>> by item index, labels: Map<f, string>, inv: Map<f, Int32Array of item indexes>, df: Map<word, n> }
export function replay(jl)                       // → { S, M, L } times or null
export function engagement(it, r, { nBody = null, err = false } = {})
  // → null (not an exposure) | { y, y0, w, T, D, R, A, t, H, quick, label: 'deep'|'skim'|'glance'|'skip', S, M, L }
export function computeProfile({ items, index, memory /* Map id → record */, now, controls = {}, pseudo = [],
  nBodyOf = (id) => null, errOf = (id) => false, marks = {} })
  // → the profile object of §4.1 (feat, items, pred, phi, lanes, laneFactor, seeds, new, mu0, …)
export function interestOf(feats, lam)           // feats: [[g, f, m]], lam: Map f → λ (controls applied) → { I, r }
export function phiOf(e, r, it, { now, state, added })    // → Φ
export function explainItem(feats, lam, labels, counters) // → { I, r, chips: [{ f, label, g, d, text }] }
export function findState(it, r, mark, now)      // → 'new' | 'seen' | 'kept' | 'dismissed' | null (not a find)
export function spearman(xs, ys)                 // → ρ, or null when n < 10
```

## 3. Memory additions

### 3.1 Server: `server/routes/45-memory.mjs` (SERVER)

1. **Visit rows grow two optional slots**: `v: [[s, e, a, x?, via?]]`. In `apply()` for `visit`:
   - if `op.x` is one of `next prev less more jump lane view`, set `v[3] = op.x`;
   - if `op.via` is `feed` or `jump` and `v[4]` is unset, set `v[4] = op.via`.

   Old rows stay `[s, e, a]`. Readers that destructure the first three are unaffected.
2. **Retractions.** `judge` already accepts any `j` of 12 characters or fewer. `brief()` must replay `jl` (§2.2) instead of reading `r.j`: `saved` when S is set, `less: L` when L is set, `more: M` when M is set. The CSV export uses the same replay.
3. **The hook.** After the index loads, set:

   ```js
   app.memory = { index, take, subscribe(fn) { subs.push(fn); } };
   ```

   `take(ops)` calls each subscriber with the ops it accepted, after applying them (ops held during compaction are passed once applied). Routes load in name order, so `47-learn` and `96-jobs` see `app.memory`.

### 3.2 Client: `ui/js/features/memory.js` (UI)

1. **Exit move.** Keep `lastBefore = {label, t}` from every `nav:before`. When a visit ends (`endVisit`), send a final `visit` op with `x`. If `lastBefore` is less than 2 s old, map its label:

   | `nav:before` label | `x` |
   |---|---|
   | `next item` | `next` |
   | `previous item` | `prev` |
   | `less like this` | `less` |
   | `more like this` | `more` |
   | `open item`, `browse results`, `stay in`, `leave stack`, `link jump` | `jump` |
   | `lane switch` | `lane` |

   A visit ended by `view:changed` sends `x: 'view'`. With no recent label, send `next`.
2. **How it was reached.** The first `visit` op of a visit (`!v.sent`) carries `via: 'jump'` when the label before the item was shown is in the `jump` row above; otherwise `via: 'feed'`.
3. **Retractions.** On `nav` with `type: 'back'`, map `d.undone` and send `judge` for `d.i`:

   | `d.undone` | Op sent |
   |---|---|
   | `save` | `unsave` |
   | `unsave` | `save` |
   | `less like this` | `unless` |
   | `more like this` | `unmore` |

   Update the local record to match (`saved`, `less`, `more`) and emit `memory:updated`. This also fixes a bug: today, undoing a save leaves memory's `saved` set.

## 4. Storage

All user data lives under the cache directory (`STACKS_CACHE`, default `~/.cache/open-stacks`) and never in the repository. Files are written atomically (a `.tmp` file, then a rename).

### 4.1 `CACHE/learn/` (SERVER)

| File | Holds | Size at 10k items and 5k exposures |
|---|---|---|
| `profile.json` | The last full profile (below), written after each recompute (at most once per 10 s) | about 0.8 MB |
| `history.jsonl` | One line per local day: `{d, at, mu0, exposures, lanes: {lane: λ}, top: {f: λ}}`, where `top` is the 80 features with the largest `\|λ\|·√W` | about 3 KB a day, 1 MB a year |
| `opens.jsonl` | `{id, t, I, via}`, the first visit of an item on each local day | about 80 B a line |
| `controls.json` | `{v: 1, feat: {f: {mode: 'boost'\|'mute'\|'ignore', at}}}` | < 10 KB |
| `finds.json` | `{v: 1, marks: {id: {st: 'seen'\|'new', at}}}` | < 50 KB |
| `import.json` | The one-time `state.aff` migration: `{at, saves, lanes: {lane: a}, toks: {word: a}}` | < 20 KB |

The profile, in memory and in `profile.json`:

```json
{
  "v": 1, "gen": 1, "at": 1792060800000, "memoryAt": 1792060795000, "corpusAt": 1792050000000, "ms": 142,
  "on": true,
  "params": {"B": 0.8, "rho": 0.75, "kappa": 4, "kappa0": 5, "mu0prior": 0.25, "H": 60, "Hj": 180, "laneExp": 0.6},
  "mu0": 0.275, "exposures": 41, "weight": 38.2,
  "feat": {
    "path:llm/Reasoning": {"l": 1.19, "l0": 1.19, "W": 6.0, "Y": 4.6, "g": "path", "label": "LLM papers › Reasoning",
      "c": {"deep": 5, "skim": 0, "glance": 0, "skip": 0, "save": 1, "more": 1, "less": 0},
      "ex": ["arxiv:2501.12948", "arxiv:2402.03300", "arxiv:2408.03314"], "ctl": null}
  },
  "items": {"arxiv:2501.12948": {"y": 0.92, "y0": 0.81, "T": 1, "D": 0.9, "R": 0.5, "w": 2, "label": "deep", "j": "save", "t": 1791980280000}},
  "pred": {"arxiv:2201.11903": 0.74},
  "phi": {"arxiv:2402.03300": -0.8},
  "lanes": {"llm": 1.02, "ttrpg": -1.18},
  "laneFactor": {"llm": 1.53, "ttrpg": 0.61},
  "seeds": ["arxiv:2501.12948", "arxiv:2408.03314"],
  "new": ["arxiv:2610.01995"],
  "calib": {"rho": 0.31, "n": 42, "byLane": {"llm": {"rho": 0.4, "n": 18}}}
}
```

- `feat` keeps features with `W ≥ 0.05` or a control. `l` is λ after controls, `l0` before them. `ex` holds up to 3 example ids, the highest `w·d·y` first. The counters cover the last 180 days.
- `items` holds every exposure.
- `pred` holds every corpus item with `|I| ≥ 0.01`, rounded to 0.01.
- `phi` holds every non-zero Φ, rounded to 0.01.
- `new` lists the finds in state `new`.

### 4.2 `CACHE/jobs/` (SERVER)

| File | Holds |
|---|---|
| `state.json` | `{lastRefresh, nextRefresh, written: {jobId: sha1 of the text written}, runs: [{at, ms, created: [ids], updated: [ids], skipped: [{key, why}]}]}` (last 50 runs) |
| `errors.json` | Open errors the reader's browser saw: `{items: {id: {n, days: ['2026-10-14', …] (up to 5), status, msg, last}}}`. Capped at 2,000 items, oldest dropped |

### 4.3 Repository files (SERVER creates them; agents edit them)

| Path | What |
|---|---|
| `jobs/README.md` | The agent playbook (§7.8) |
| `jobs/hosts.json` | `{"allow": {"host": "why it is open"}, "deny": ["host pattern", …]}`. `allow` starts from `cache.mjs`'s base list; agents add new open hosts with a reason. `deny` lists shadow libraries (§7.7) |
| `jobs/open/<id>.md` | One open job (§7.1). Written by the app (`STACKS_JOBS_DIR` overrides the `jobs/` root) |
| `jobs/done/<id>.md` | Closed jobs: status done, dropped or dismissed, with `## Result` |
| `jobs/assets/<id>.webp` | A picture attached to a reader flag, only when the reader ticked the box. At most 1.5 MB |
| `data/lanes/<lane>.added.json` | Items added by jobs, one file per lane (§7.5) |
| `data/overrides.json` | `{"v": 1, "items": {"<id>": {fields…, "why", "fixed", "job"}}}`: fixes to any item's fields, or `"drop": true` (§7.5) |
| `data/media-fixes.json` | `{"v": 1, "images": {"<image url>": {"from": "<working url>" \| null, "gone": true?, "why", "added", "job"}}}` |

## 5. HTTP API

All routes are JSON. Errors return `{error: "…"}` with a 4xx status. Times are epoch ms unless noted.

### 5.1 Learning (`47-learn.mjs`)

**`GET /learn/profile.json?part=rank[&since=<at>]`**: what the feed needs. About 270 KB at 10k items, served from memory.

```json
{"v": 1, "gen": 1, "at": 1792060800000, "on": true, "B": 0.8, "corpusAt": 1792050000000, "exposures": 41,
 "pred": {"arxiv:2201.11903": 0.74}, "phi": {"arxiv:2402.03300": -0.8},
 "lanes": {"llm": 1.02}, "laneFactor": {"llm": 1.53}, "new": ["arxiv:2610.01995"]}
```

When `since` equals the current `at`, the response is `{"same": true, "at": …}`. With `STACKS_LEARN=0`, it is `{"on": false}`.

**`GET /learn/profile.json`**: the full profile (§4.1). Only the Dashboard asks for it.

**`GET /learn/why?id=<id>`** or **`?ids=<id,id,…>`** (up to 30):

```json
{"id": "arxiv:2201.11903", "I": 0.74, "term": 0.59, "phi": 0, "state": "unread",
 "chips": [{"f": "path:llm/Reasoning", "label": "LLM papers › Reasoning", "g": "path", "d": 0.25, "text": "you read 5 deeply, saved 1"},
           {"f": "lane:llm", "label": "LLM papers", "g": "lane", "d": 0.13, "text": "you read 6 deeply"},
           {"f": "yr:2020-22", "label": "2020–22", "g": "era", "d": -0.05, "text": "skipped 4"}],
 "read": null,
 "find": {"added": "2026-10-16", "job": "discover-0007", "via": {"source": "semantic-scholar", "query": "…", "seeds": ["arxiv:2402.03300"]}, "st": "new"}}
```

- `state` is `unread` or the implicit label.
- `read` is `{label, y, j}` for read items.
- `find` is null unless the item came from a job.
- `rest` (added in the build) is the summed share of the features too small for a chip, so `Σ chips.d + rest = B·I`.
- With `ids`, the response is `{"items": {"<id>": {…}}}`.

**`GET /learn/features?q=<text>&limit=20`**: features whose id or label contains `q`, case-insensitive; with no `q`, the top features by `|l|·√W`. Returns `{"items": [{f, label, g, l, l0, W, c, ex, ctl}]}`.

**`GET /learn/history.json?days=30`**: `{"days": [{d, at, mu0, exposures, lanes, top}]}`, oldest first.

**`GET /learn/reading.json?days=90`**: computed from memory. Local days.

```json
{"days": [{"d": "2026-10-15", "ms": 1830000, "items": 7, "finished": 2, "pages": 31}],
 "lanes30": {"llm": 5400000, "forecasting": 1200000},
 "streak": {"current": 4, "best": 11, "minMs": 600000},
 "totals": {"week": {"ms": 9000000, "items": 23, "finished": 6, "pages": 140}, "month": {"ms": 41000000, "items": 88, "finished": 19, "pages": 610}},
 "best": [{"id": "arxiv:2501.12948", "t": "DeepSeek-R1: …", "lane": "llm", "V": 0.92, "label": "deep", "j": "save", "last": 1791980280000}]}
```

- `items` counts items with a visit of at least 30 s that day.
- `finished` counts items that are done now (the Φ "done" test), on the day of their last visit.
- `pages` is the pace-gated `p` of §2.1, summed by the day of each `seq` row.
- A day joins the streak with at least 10 minutes active. The current streak runs to today, or to yesterday when today is still under 10 minutes.
- `best` lists the top 8 by V over the last 90 days.

**`POST /learn/control`** `{"f": "tag:reasoning-models", "mode": "boost" | "mute" | "ignore" | null}` → `{"ok": true, "ctl": {…all controls…}}`. It recomputes 250 ms later. `null` clears the control.

**`POST /learn/import`** `{"aff": {"lane": {}, "tok": {}}, "saved": ["id", …]}` → `{"ok": true, "imported": {"saves": 3, "lanes": 2, "toks": 5}}`. The second call returns `{"ok": true, "already": true}`.

**`GET /learn/finds.json`** → all finds (§2.9), sorted by `added` (newest first), then I:

```json
{"at": 1792060800000, "corpusAt": 1792050000000,
 "items": [{"id": "arxiv:2610.01995", "t": "Can AI Oversight Be Zero Knowledge?", "a": "…", "lane": "ai-safety", "kind": "pdf",
            "added": "2026-10-16", "job": "discover-0007", "via": {"source": "arxiv", "query": "…", "seeds": ["arxiv:2402.03300"]},
            "why": "…", "st": "new", "I": 0.41}],
 "counts": {"new": 8, "seen": 3, "kept": 1, "dismissed": 0},
 "byJob": {"discover-0007": {"new": 5, "seen": 2, "kept": 1, "dismissed": 0}}}
```

**`POST /learn/finds/mark`** `{"ids": ["…"]}` or `{"all": true}`, with `"st": "seen" | "new"` → `{"ok": true, "n": 8}`.

### 5.2 Jobs (`96-jobs.mjs`)

**`GET /jobs`**:

```json
{"dir": "jobs", "repoPath": "apps/open-stacks/browser", "every": 24, "running": false,
 "lastRefresh": 1792060800000, "nextRefresh": 1792147200000,
 "prompt": "In the cairn repo, open apps/open-stacks/browser/jobs/README.md and do the open jobs…",
 "caps": {"total": 30, "discover": 4, "follow-author": 3, "grow-lane": 2, "fix-item": 3, "media": 2, "tag": 2, "metadata": 2},
 "open": [{"id": "discover-0007", "type": "discover", "title": "…", "priority": "high", "created": "2026-10-15", "key": "discover:path:llm/Reasoning",
           "target": {…}, "inputs": […], "wants": {…}, "output": […], "acceptance": […], "body": "## What to do\n…", "prompt": "In the cairn repo, do job discover-0007…"}],
 "done": [{"id": "fix-item-0002", "type": "fix-item", "title": "…", "status": "done", "done": "2026-10-14",
           "result": {"added": [], "changed": ["arxiv:1606.06565"], "files": ["data/overrides.json", "corpus.json"], "text": "…the Result section…"}}]}
```

- `repoPath` is the browser folder relative to the git root, found by walking up to `.git`; if there is none, `apps/open-stacks/browser`.
- `done` holds the last 50, newest first.
- Files are re-read when the folder's or a file's mtime changes, checked at most every 2 s.

**`POST /jobs/refresh`** → `{"created": ["discover-0008"], "updated": ["fix-item-0003"], "skipped": [{"key": "grow-lane:llm", "why": "cool-down until 2026-10-29"}], "ms": 84}`. A refresh already running returns that run's result. Only one runs at a time.

**`POST /jobs/flag`**:

```json
{"id": "arxiv:2402.03300", "page": 7, "kind": "garbled", "note": "Figure 3 renders as a black box",
 "view": {"zoom": false, "per": 2, "crop": true, "cols": false, "flow": false, "theme": "reading"},
 "shot": "data:image/webp;base64,…"}
```

- It returns `{"id": "flag-0003", "path": "jobs/open/flag-0003.md", "asset": "jobs/assets/flag-0003.webp"}`, with `asset` null when there is no picture.
- `kind` is one of `open` (doesn't open or wrong file), `garbled` (pages missing or garbled), `images`, `meta` (wrong title, author or date), `place` (wrong lane or folder), `duplicate`, `other`.
- `note` is at most 1,000 characters.
- `shot` is optional, at most 2 MB of base64, and written as WebP or PNG as sent.
- It answers 400 when the item is unknown.

**`POST /jobs/dismiss`** `{"id": "discover-0007"}` → `{"ok": true}`. The file moves to `jobs/done/` with `status: "dismissed"`. Its key cools down as if done (§7.3).

**`POST /jobs/report`** `{"id": "<item id>", "kind": "open", "msg": "HTTP 404", "status": 404, "t"?: epoch}` → `{"ok": true}`. It updates `errors.json`. `t` exists for tests; it sets the day.

**`GET /jobs/asset?name=flag-0003.webp`**: the picture, for the Dashboard. The name must match `^[a-z-]+-\d{4}\.(webp|png)$`.

### 5.3 `/status` additions

```json
{"learn": {"on": true, "at": 1792060800000, "ms": 142, "exposures": 41, "features": 2480},
 "corpusAt": 1792050000000,
 "jobs": {"open": 7, "high": 1, "done": 12, "lastRefresh": 1792060800000}}
```

These come from cached values; `/status` is polled every 2 s and must not stat files.

## 6. The profile service (`47-learn.mjs`)

### 6.1 Start

- Read `corpus.json`, `data/meta.json` and `data/tags.json` if present, and `buildIndex`. Run it in chunks of 2,000 items with `setImmediate` between them, so start-up never blocks the proxy for more than about 50 ms at a time.
- Load `controls.json`, `finds.json`, `import.json` and the last profile (served until the first recompute).
- Recompute once the index is built.

### 6.2 Triggers

| Trigger | Recompute |
|---|---|
| `judge` or `forget` ops (`app.memory.subscribe`) | 250 ms after the last such op |
| `visit`, `saw` or `at` ops | 10 s after the last one, at most 60 s after the first |
| `POST /learn/control`, `/learn/finds/mark` or `/learn/import` | 250 ms later |
| The mtime of `corpus.json`, `data/meta.json` or `data/tags.json` changed (stat every 30 s) | Rebuild the index, then recompute |
| Every 6 h, and the first recompute after local midnight | Recompute (decay); append the `history.jsonl` line for today if it is missing |

- At most one recompute runs at a time. A trigger during a run schedules exactly one more.
- **Online evaluation.** On a `visit` op whose `s` starts the first visit of that item on a local day, append `{id, t: s, I: pred[id] ?? 0, via}` to `opens.jsonl`.

### 6.3 Body pages

`nBodyOf(id)` reads `server/profile.mjs` `readProfile(id)` and counts the pages whose role is body. Results are cached in a Map per id with the profile's `rev`. A recompute reads at most 50 uncached profiles; the rest fall back (§2.1) until a later recompute. Reading every profile each time would cost seconds.

### 6.4 Cost targets

- `buildIndex` ≤ 1.5 s for 10k items.
- A recompute (`computeProfile` plus pred for every item) ≤ 300 ms at 10k items and 5k exposures (the sim measured 49 ms profile and 32 ms prediction at 1,948 items).
- `?part=rank` served in ≤ 20 ms (pre-serialized after each recompute).
- Memory ≤ 60 MB for the index and profile.

### 6.5 Corpus changes

When `corpus.json` changes (an agent merged new items):

1. Rebuild the index and recompute.
2. Update `corpusAt`.
3. **`96-jobs.mjs`** adds the URL and page hosts of every item to `app.cache.ALLOW` (an exported Set), so new open hosts work without a restart.

### 6.6 The one-time import from `state.aff`

`learn.js` POSTs `store.get('aff')` and `store.get('saved')` once (§8.2):

- **Saves.** Each saved id whose memory record lacks a save becomes a `judge save` op through `app.memory.take`, dated `max(r.first, now − 30 days)`, or `now − 30 days` without a record.
- **Lanes.** Each lane with affinity `a` becomes a pseudo-exposure on `lane:<l>`: `W = 0.5·min(3, |a|)`, `y = 0.8` when `a > 0`, else 0, dated at the import (so it fades with H = 60 days).
- **Words.** Each token with `|a| ≥ 0.5` gets the same on `w:<word>`, with `W = 0.5·min(1.5, |a|)`.
- The pseudo-exposures are stored in `import.json` and added to the sums of §2.5 (they also count in μ0).

## 7. Agent jobs

### 7.1 The job file

Each job is `jobs/open/<id>.md`. The frontmatter is YAML restricted to **one key per line with a JSON value** (`key: <JSON>`). That is valid YAML, readable, and parsed without a YAML library: split each line at the first `: `, `JSON.parse` the rest. `server/jobs.mjs` exports `parseJob(text)` and `formatJob(job)`, which both the server and `jobs.mjs` use; anything else is a format error that `check` reports. The body is Markdown, for the agent.

```markdown
---
id: "discover-0007"
type: "discover"
title: "Find 10 open papers on LLM papers › Reasoning"
priority: "high"
status: "open"
created: "2026-10-15"
key: "discover:path:llm/Reasoning"
target: {"feature": "path:llm/Reasoning", "label": "LLM papers › Reasoning", "lane": "llm"}
inputs: [{"id": "arxiv:2501.19393", "t": "s1: Simple test-time scaling"}, {"id": "arxiv:2501.12948", "t": "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"}, {"id": "arxiv:2408.03314", "t": "Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters"}, {"id": "arxiv:2402.03300", "t": "DeepSeekMath: Pushing the Limits of Mathematical Reasoning in Open Language Models"}]
wants: {"count": 10, "min": 6, "max": 15}
output: ["data/lanes/llm.added.json", "corpus.json"]
acceptance: ["6 to 15 new items with job discover-0007 in data/lanes/*.added.json", "each new item passes the item rules (jobs/README.md, section 3)", "no new item duplicates the corpus", "every URL is on an open host and answers (check --live)", "corpus.json rebuilt with node build-corpus.mjs --merge"]
gen: 1
---

## What to do

Find 10 open works (papers, reports or long posts) on **LLM papers › Reasoning** that sit close to the seed items below: the same questions, methods or debates, by other authors as well as the same ones. Prefer work from the last three years; at most two older classics the lane is missing. Each item must be free to read without a login and must not already be in the corpus (`node jobs.mjs lookup "<title or id>"`). Put each item in the lane where it fits best; most will fit `llm`.

## Seeds

- s1: Simple test-time scaling (arxiv:2501.19393)
- DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning (arxiv:2501.12948)
- …

## Where to look

1. Semantic Scholar recommendations with these seeds as positives (one call; README section 6.2).
2. arXiv phrase queries from the target and the seeds' titles, in the seeds' categories, last 24 months (6.1).
3. LessWrong and Alignment Forum: top posts in the nearest tag (6.4).

## Finish

`node build-corpus.mjs --merge`, then `node jobs.mjs check discover-0007 --live`, then `node jobs.mjs done discover-0007 --note "…"`, then commit the files `done` lists as "Stacks job discover-0007: Find 10 open papers on LLM papers › Reasoning".
```

| Field | Rules |
|---|---|
| `id` | `<type>-<NNNN>`: 4 digits, sequential per type, the highest id in `open/` and `done/` plus 1. Written with the `wx` flag; retry on a clash |
| `type` | `discover`, `follow-author`, `grow-lane`, `fix-item`, `media`, `tag`, `metadata`, `flag` |
| `priority` | `high`, `normal`, `low` |
| `status` | `open`, `done`, `dropped`, `dismissed` |
| `created`, `done` | Local dates, YYYY-MM-DD |
| `key` | `<type>:<target>`: the dedupe key, one open job per key |
| `target`, `inputs`, `wants`, `output`, `acceptance` | Per type, §7.2. `inputs` holds public ids and titles only |
| `gen` | The generator's version (1). A job the generator wrote and nobody touched may be rewritten (§7.3) |

`done` (the command) adds `status`, `done` and `by` to the frontmatter, and appends:

```markdown
## Result

Items added (8): arxiv:2610.11111 "…" (llm), …
Items changed: none
Files: data/lanes/llm.added.json, corpus.json
Sources and queries: semantic-scholar recommendations (positives arXiv:2501.19393, arXiv:2501.12948, arXiv:2408.03314); arxiv `(cat:cs.LG OR cat:cs.CL) AND abs:"test-time" AND submittedDate:[202410150000 TO 202610152359]`
Note: …the agent's --note…
```

The commit hash is not in the file: a file cannot contain the hash of the commit that adds it. The commit message names the job, so `git log --grep discover-0007` finds it.

### 7.2 Job types and the generator's rules (`server/jobs.mjs`)

Reading-based types need a profile with at least 10 exposures. Maintenance types do not depend on reading.

| Type | Fires when | Key | Inputs | Wants | Priority | Open cap | Cool-down after close |
|---|---|---|---|---|---|---|---|
| `discover` | A feature `f` in groups tag, field (depth ≥ 2) or path has `l ≥ 0.5` and `W ≥ 2`, and at least 2 seeds carry it; or `f` is boosted (seeds optional, otherwise up to 3 corpus items with `f`, best `q` first). Not muted, not ignored. Candidates are ranked by `l·√W`; one whose seed set overlaps a higher-ranked candidate's by 80% or more is skipped | `discover:<f>` | 2-5 seeds carrying `f`, newest first: `{id, t}`. Only a boosted `f` with fewer than 2 seeds is filled up to 3 with corpus items carrying it (best `q` first), marked `ex: true` and listed under "Examples already in the library": padding a read topic with unread items mixed topics (built: an RL-for-reasoning job got an AI-safety paper as a third seed) | high 10 (6-15); normal 8 (5-12); low 6 (3-10) | high: `l ≥ 1` and `W ≥ 4`, or boosted; normal: `l ≥ 0.75`; else low | 4 | 14 days, and at least one seed not in the last job with the key |
| `follow-author` | `au:x` has `l ≥ 0.7` and `W ≥ 2`, with at least 2 seeds whose first author is x | `follow-author:<x>` | `{name}` (the commonest full name in the seeds' `a`) and 2-3 seeds | 5 (1-10) | normal | 3 | 30 days |
| `grow-lane` | `lane:l` has `l ≥ 0.5` (or is boosted), and the lane has fewer than 20 unread items with I ≥ 0.3 | `grow-lane:<lane>` | Up to 5 anchors: the lane's seeds, else its top items by `q` | 15 (8-25) | normal | 2 | 21 days |
| `fix-item` | A corpus item fails to open: `rescue.S.docs[url].st === 'bad'` for its `url`, `page` or `pdf`; or `errors.json` has it with `n ≥ 2` on 2 or more days, or with status 404, 410 or 451 | `fix-item:<lane>` | Up to 10 `{id, t, url, problem}` (e.g. "HTTP 404", "dead page", "fails to open: <msg, ≤ 80 chars>") | Every input fixed or dropped | high with ≥ 5 inputs, else normal | 3 | An item in a closed fix-item job is not listed again for 14 days |
| `media` | `rescue.S.imgs[u].st === 'bad'` (not `big`) and `ctx.item` is a corpus item | `media:<lane>` | Up to 20 `{item, t, page, url, alt}` | Every image fixed or marked gone | low | 2 | 14 days per image |
| `tag` | `data/tags.json` exists, and items are in none of its tags and have no `it.tags` | `tag:<lane>` | Up to 60 `{id, t}`, in corpus order | Every input tagged | low | 2 | 14 days |
| `metadata` | Items with no `a`, or no `y` and no `d` (not lane quri, not arXiv, not marked `unknown` in overrides) | `metadata:<lane>` | Up to 40 `{id, t, missing: ['a', 'y']}` | Every input filled or marked unknown | low | 2 | 30 days |
| `flag` | `POST /jobs/flag` (§7.4) | `flag:<item id>:<job id>` (never deduped) | The flag | Resolved | high | None | None |

- **Topical folders only.** A `path:` feature is a discover target only when its last folder names a topic. Skip folders matching `/^(\d{4}([–-]\d{4})?|Undated|Before \d{4}|\d{4} and later|\d{4}–\d{4}|Other|Not in the sidebar|Posts|Papers & reports|Blog & posts)$/`: LessWrong's year folders, the oddities' eras and the split folders say nothing about topic. They still count in the model and show in the Dashboard.
- **Caps.** At most 30 open jobs, flags not counted (`STACKS_JOBS_MAX`).
- **Order.** Candidates are sorted by priority, then by type in this order: flag, fix-item, discover, follow-author, grow-lane, media, metadata, tag. They are written until a cap binds.
- **Body text templates**, one per type, are written in `server/jobs.mjs` in the style of §7.1. They name the target, the inputs, where to look (README section numbers), the output files and the finishing commands.
- **The fix-item body** says: "For each item, find a working legal open copy of the same work (the publisher's open PDF, the author's page, arXiv, the Internet Archive, the Wayback Machine). Record it in `data/overrides.json` (`url`, `page`, `kind`…), or, if none exists, set `drop: true` with `why`."
- **The flag body** includes the item, page, kind, note, view settings and the picture path. It says: "if the cause is an app bug, describe it in the Result; fix it in code only if the fix is small and clearly in scope, with a test."

### 7.3 Refresh, dedupe, updates

- **When.** `onStart`: 2 minutes after start, run a refresh if `lastRefresh` is more than `STACKS_JOBS_EVERY` hours old (default 24; 0 disables automatic refreshes, but flags still work). Then check hourly. `POST /jobs/refresh` runs one now.
- **Dedupe.** Skip a candidate when an open job has its key, or when a closed job with its key is inside the cool-down. Cool-downs run from that job's `done` date; dismissed jobs count as closed.
- **Updates.** An open `fix-item`, `media`, `tag` or `metadata` job may be rewritten to add new inputs (up to the batch size), but only if its text still has the sha1 recorded in `state.json` `written` (nobody has touched it). Discover-like jobs are never rewritten. The generator never deletes or closes jobs.
- **Cost.** A refresh reads the profile in memory, the corpus index, rescue state, `errors.json` and the job folders. Target: ≤ 1 s.

### 7.4 Reader flags

The UI posts `POST /jobs/flag` (§5.2). The server:

1. Writes `jobs/open/flag-NNNN.md`, with the title `Reader flag: <kind label> on p. <page> of <title (60 chars)>`.
2. Writes the picture, if any, to `jobs/assets/flag-NNNN.webp`.
3. Runs the privacy lint (§7.9) on everything except the reader's note. The note is shown to the reader with a public-repo warning before sending.

### 7.5 How agents add and fix items

**Added items** go in `data/lanes/<lane>.added.json`, one file per lane, created when missing:

```json
{"lane": "llm", "label": "Added by agent jobs", "notes": "Items added by agent jobs (jobs/README.md). Each has added, job, via and why.",
 "items": [
  {"id": "arxiv:2610.11111", "kind": "pdf", "t": "…", "a": "First Author, Second Author et al.", "y": 2026, "d": "2026-10-02",
   "url": "https://arxiv.org/pdf/2610.11111", "page": "https://arxiv.org/abs/2610.11111",
   "why": "A critic-free RL recipe for long reasoning chains; follows DeepSeekMath's GRPO.",
   "tags": ["reasoning", "rl"], "ab": "…abstract, at most 2,000 characters…",
   "added": "2026-10-16", "job": "discover-0007",
   "via": {"source": "semantic-scholar", "query": "recommendations positives=arXiv:2501.19393,arXiv:2501.12948", "seeds": ["arxiv:2501.19393"]}}
 ]}
```

The item rules, enforced by `check`:

| Field | Rule |
|---|---|
| `id` | `arxiv:<id without version>` (also old style `math/0406077`); `lw:<_id>`; `eaf:<_id>`; `ia:<identifier>`; `pdf:<host><path>` (host without `www.`); `web:<host><path>` (no trailing slash) |
| `kind` | `pdf`, `html` (forum posts), `web`, `scan`, `text` |
| `t`, `a` | Non-empty. Use the organisation as author when there is no person |
| `y` or `d` | At least one. `d` is YYYY-MM or YYYY-MM-DD |
| `url`, `page` | `https://`. arXiv: `https://arxiv.org/pdf/<id>` and `https://arxiv.org/abs/<id>`. LessWrong and the Alignment Forum: `url` is `https://www.lesswrong.com/graphql?query=` + `encodeURIComponent('{post(input:{selector:{_id:"<id>"}}){result{htmlBody}}}')`, and `page` is the post's page; for Alignment Forum posts also set `"src": "Alignment Forum"`. EA Forum: the same pattern on `forum.effectivealtruism.org`. Internet Archive scans: `ia`, `n` (imagecount), and both `url` and `page` set to `https://archive.org/details/<id>`. `url` is required for every kind, because the build skips lane-file items without one |
| `why` | 20-200 characters, one line, neutral (no "you", "your" or "I") |
| `tags` | 1-4 entries; ids from `data/tags.json` when it exists |
| `added`, `job`, `via` | `added` is the date; `job` is the job id; `via` is `{source, query, seeds?}` with `source` in `arxiv`, `semantic-scholar`, `openalex`, `lesswrong`, `alignment-forum`, `eaforum`, `internet-archive`, `quri`, `publisher`, `author-site`, `wayback`, `manual`, `other` |
| Optional | `ab`, `words` (posts), `license`, `xpost` (the crosspost's id: `eaf:…` for a LessWrong post, or `lw:…`), `doi`, `score` |

**Fixes** go in `data/overrides.json`. Each entry may set `t`, `a`, `y`, `d`, `url`, `page`, `pdf`, `kind`, `n`, `ia`, `tags`, `lane`, or `drop: true`, plus `why`, `fixed` (date) and `job`. For metadata jobs, `unknown: ["a"]` records that a field cannot be found. `build-corpus.mjs` applies overrides last, in the full build and in `--merge`.

**Image fixes** go in `data/media-fixes.json`. On start and when the file changes, `96-jobs.mjs` passes each entry with `from` and without an `applied` record to `rescue.mjs` `manualCopy(u, from)`, which checks the copy before using it. It records what it applied in `CACHE/jobs/state.json` `media`. Entries with `gone: true` are left alone; the reader keeps seeing "image unavailable".

### 7.6 `build-corpus.mjs --merge` (offline, about 1 s)

```
node build-corpus.mjs --merge [--root DIR]
```

1. Read `corpus.json` (it must exist) and every `data/lanes/*.json`.
2. **Append** each lane-file item whose id is not in the corpus. Apply the full build's filters (`id`, `url` and `t` present; a known lane) and its normalisation:
   - `lane`;
   - `src` via `srcOf`;
   - `score` (default 0);
   - `kind` html becomes web unless the URL is a GraphQL post URL;
   - arXiv `d` from the id when missing;
   - `q`: the item's percentile against the existing scores of its lane and family, or 0.5 when it has no score.

   Existing items keep their array positions, so their indexes do not change.
3. **Apply** `data/overrides.json`: assign the listed fields on existing items, then re-normalise `kind`. `drop: true` removes the item; indexes after it shift, which is acceptable because indexes are per session.
4. **Rebuild the library tree** (`path`, `ord`) for every lane that changed, except `quri`. New QURI pages get `path: [site, 'Not in the sidebar']` and the next `ord`; `--tree-only` (which fetches the sidebars) places them properly.
5. Recompute `counts`, keep `lanes`, `laneWeights` and `laneOrdered`, and set `merged` to the ISO date.
6. Write `corpus.json` atomically. Print the items appended per lane, updated, dropped, and skipped (with reasons).

**No network.** `--root DIR` reads and writes under DIR instead of the script's folder (for tests and QA copies). The full build also applies `overrides.json`, and picks up `*.added.json` because they are ordinary lane files.

### 7.7 `jobs.mjs` (the CLI) and the check rules

```
node jobs.mjs list [--all] [--json]
node jobs.mjs next [--json]                 the highest-priority open job, printed in full, with the files to edit
node jobs.mjs show <id>
node jobs.mjs lookup "<id | URL | DOI | title>" [--lane <lane>]   corpus and lane-file matches by every dedupe key; --lane lists a lane's folders and counts
node jobs.mjs check <id> [--live] [--json]  exit 0 when every criterion passes
node jobs.mjs done <id> [--note "…"] [--force]
node jobs.mjs drop <id> --why "…"
node jobs.mjs new --type <type> --title "…" [--lane l] [--inputs id,id] [--count N] [--body "…"] [--priority p]
Global options: --dir <jobs dir> (default $STACKS_JOBS_DIR or ./jobs) and --root <browser dir> (default the script's folder)
```

- **`next`.** Sorts by priority (high, normal, low), then the type order of §7.2, then `created`, then id.
- **`done`.** Runs `check` (it refuses on failure unless `--force`). It writes the frontmatter and `## Result` (§7.1) and moves the file to `jobs/done/`. It prints the exact `git add <files>` and `git commit -m "Stacks job <id>: <title>"` to run. The files are:
  - the new job path, plus the old one when git tracks it (`git ls-files --error-unmatch`; an untracked open job has nothing to remove);
  - the lane files and data files with entries for this job;
  - `corpus.json`;
  - the asset.

  It never uses `git add -A`.
- **`drop`.** Moves the job to `done/` with `status: "dropped"` and the reason in Result.

`check <id>`, every criterion printed ✓ or ✗:

| Applies to | Criterion |
|---|---|
| All | The job file parses (§7.1). Every data file it touches parses and has the right shape |
| discover, follow-author, grow-lane | Items with `job: <id>` in `data/lanes/*.json` number between `wants.min` and `wants.max` |
| Same | Each such item follows the item rules (§7.5) |
| Same | **No duplicates**, against `corpus.json` and every lane file (excluding this job's items) and within the job, by: id; arXiv id from any URL or DOI `10.48550/arXiv.<id>`; DOI (from `doi` or a `doi.org` page); `lw:` and `eaf:` ids including `xpost`; IA identifier and the work key (normalised title + creator surname + year); URL key (lowercase host without `www.`, path without trailing slash, no query or fragment; not for GraphQL URLs); normalised title (NFKD, lowercase, letters and digits) when it has at least 4 words, or fewer words plus the same first-author surname |
| Same | **Open hosts**: every `url` and `page` host is in `jobs/hosts.json` `allow` or already in the corpus, and matches no `deny` pattern (a hard failure). Hosts the job added to `allow` are listed for review |
| Same | Scans: `y ≤ 1930`, or a `license` that names an open licence |
| Same | `corpus.json` contains each item, with `path` and `ord` (the merge ran) |
| fix-item, metadata | Every input id has an override with this job's id: changed fields, `drop: true` with `why`, or `unknown` (metadata) |
| media | Every input URL has a `media-fixes.json` entry with this job's id: `from` on an open host (or `web.archive.org`), or `gone: true` with `why` |
| tag | Every input id is in at least one tag's `items`; new tags have `id`, `label`, `kind` and `desc` |
| flag | `done` requires `--note`. Data files it touched validate |
| All, with `--live` | Each new or changed URL answers: a GET with `Range: bytes=0-2047`, at most 1 request per host per second (1 per 3 s for `export.arxiv.org`), 20 s timeout. PDFs must start with `%PDF` or be `application/pdf`. GraphQL post URLs must return a non-empty `htmlBody`. IA identifiers: the metadata has `imagecount > 0` and no `access-restricted-item`, and the collections exclude `inlibrary`, `printdisabled` and `lendinglibrary` |
| All | The privacy lint (§7.9) passes on the job file and on the `why` and `via` of every item |

`jobs/hosts.json` `deny` (seed list; matched against the host and its parents):

```
libgen.* · library.lol · gen.lib.rus.ec · z-lib.* · zlibrary.* · z-library.* · 1lib.* · singlelogin.* · b-ok.* · bookfi.* · booksc.* · sci-hub.* · scihub.* · annas-archive.* · pdfdrive.* · vdoc.pub · dokumen.pub · ebin.pub · epdf.pub · pdfcoffee.com · oceanofpdf.com
```

### 7.8 `jobs/README.md`: the playbook (SERVER writes it; QA tests it)

It must stand alone: an agent that reads only this file and the job file can do any job. Required sections:

1. **What this is.** The loop in six commands: `node jobs.mjs next` → do it → `node build-corpus.mjs --merge` → `node jobs.mjs check <id> --live` → `node jobs.mjs done <id> --note "…"` → commit with the printed command. One commit per job. Work in `apps/open-stacks/browser`. Never push unless asked. Do at most 5 jobs or 60 minutes per session unless told otherwise.
2. **Hard rules.** Only legal, open sources: never shadow libraries (the deny list), never bypass logins or paywalls, no lending-library scans. Respect each source's rate limits (section 6). Never edit the reader's cache, settings or memory. Never write reading history or personal data: `why` and notes are neutral. Touch only the job you are doing. Keep commits to the files `done` lists.
3. **Item format.** §7.5's table, with one complete example per source (arXiv, LessWrong, EA Forum, IA scan, open PDF elsewhere, web article). How to choose the lane. Tags.
4. **Duplicates.** The dedupe keys, how to use `jobs.mjs lookup`, and what to do with "the same work in another form" (an arXiv paper and its LessWrong post): add the missing form only when it differs (the post is a summary); otherwise skip it.
5. **Is it open?** Per source:
   - arXiv: always readable; record `license` from the RSS `dc:rights` or OAI-PMH when easy.
   - Semantic Scholar: `externalIds.ArXiv` means open through arXiv (even when `isOpenAccess` is false); otherwise use `openAccessPdf.url` only when the status is GREEN, GOLD, HYBRID or BRONZE; drop CLOSED; map DOI `10.48550/arXiv.<id>` to arXiv.
   - OpenAlex: an index, not a source of truth. Check titles against the PDF. A "closed" there can be wrong, and so can a wrong title (seen on DeepSeekMath's DOI).
   - Forums: free to read; claim no licence.
   - IA: year ≤ 1930, or `NOT_IN_COPYRIGHT`; exclude `inlibrary`, `printdisabled` and `lendinglibrary`, and `access-restricted-item`.
   - QURI: the institute's own sites.
6. **Sources**, with endpoints, query shapes that work, limits and failure modes:
   1. **arXiv API** (`export.arxiv.org/api/query`):
      - `search_query` fields `ti: au: abs: cat: all:`, quoted phrases, `submittedDate:[YYYYMMDDHHMM TO …]`, `id_list`;
      - at most one request every 3 s;
      - single words explode ("strategy" matched 1,072 papers in a month), and phrases catch homonyms ("AI control" was 3 of 8 on topic), so read the abstracts;
      - strip `vN` from ids.
   2. **Semantic Scholar** (`api.semanticscholar.org`):
      - recommendations `POST /recommendations/v1/papers` with `positivePaperIds` (`arXiv:`, `DOI:`) and `negativePaperIds`, **one topic per call** (mixed seeds return generic RL papers);
      - `/graph/v1/paper/{id}/citations` for follow-up work (sort by `publicationDate` yourself), `/paper/batch`;
      - without a key, about two thirds of calls returned 429: back off from 4 s, capped at 30 s and about 3 minutes, and send at most 1 request/s;
      - keyword search ranks poorly;
      - take author ids from a paper's `authors`, not from author search (split profiles).
   3. **OpenAlex**:
      - single lookups are free; lists cost 1 credit, searches 10;
      - without a key, $0.10 a day is shared per IP; a free key gives $1 a day;
      - use it for DOI literature and OA URLs, and never register a key on anyone's behalf.
   4. **LessWrong, Alignment Forum, EA Forum GraphQL**:
      - `view:"top"` with `after:`, `tagRelevance`, `filterSettings` with a required tag, `userPosts`, and aliased batch lookups;
      - at least 1 s between calls, at most 2 at once;
      - AF posts are LessWrong ids;
      - crossposts have different ids, linked by `fmCrosspost.foreignPostId`;
      - skip tiny tags (nothing recent) and huge ones (`ai`, `rationality`, `community`);
      - the EA Forum's top-since is dominated by community posts, so filter by tag.
   5. **Internet Archive**:
      - `advancedsearch.php` with subject or title, `year:[1700 TO 1930]`, `mediatype:texts`, `imagecount:[40 TO 1500]` and `-collection:(inlibrary OR printdisabled OR lendinglibrary)`;
      - check the metadata of the top results;
      - one work often exists as several scans, so dedupe by work key;
      - 1 s between calls.
   6. **QURI wikis**: the sitemap set difference. The priors site has no sitemap, so use its home page links. Then run `node build-corpus.mjs --tree-only` (network) to place the pages.
   7. **Publisher and author pages**: OA PDFs only.
7. **Job types.** For each of the eight types: what "done" means, where to look first, the output files, and when to drop the job (nothing open exists, the job is wrong).
8. **Rebuild cheaply.** `--merge` only. The full build refetches every lane (about 15 minutes); never run it in a job unless the job says so.
9. **Check, done, drop, commit.** What each check line means and how to fix a failing one.
10. **Troubleshooting.** 429s, a check that will not pass, a host that is open but not yet in `hosts.json` (add it with a reason), merge conflicts in `corpus.json` (rerun `--merge`).

### 7.9 Privacy lint (`server/jobs.mjs` `privacyLint(text)`)

Job files are public. The generator builds them only from public data: ids, titles, authors, lane and tag labels, item counts wanted, and error statuses. The lint guards against mistakes in the templates.

**First mask the public strings.** Replace every input title, author name, target label, URL and id that appears in the job with `§`, so a seed titled "Attention Is All You Need" or "A History of Probability" never trips it. Then reject (the generator skips the job and logs why; `check` fails) any text matching, case-insensitive:

```
\byou(r|'re|'ve)?\b · \bminutes?\b · \bhours?\b · \bvisits?\b · \bpages? (seen|read)\b · \b(read|skimmed|skipped|saved) (it|this|these|\d)\b · \bengagement\b · \blambda\b · λ · \binterest(s|ed)?\b · \bhistory\b · \bdwell\b · \b\d+ ?(min|mins|h|hrs|s|sec|secs|seconds)\b
```

It applies to the job body and frontmatter, minus the reader's own flag note (the note is shown before sending, with "This note goes into the public repository"). `check` applies the same masking and patterns to each added item's `why` and `via`.

## 8. UI: hooks, the learning client, badges, flags

### 8.1 Core hooks (UI writes them; SERVER documents them in ARCHITECTURE.md)

**`ui/js/state.js`.** Add the following, then use `baseScore` inside `score` and the lane factor inside `buildOrder`:

```js
// ---------- learned ranking (features/learn.js registers these) ----------
/** fn(i, it) → a number added to score(i). With none registered, score() keeps the old
 *  state.aff terms (lane affinity clamped to ±1). */
export const scoreTerms = [];
export const registerScoreTerm = (fn) => { scoreTerms.push(fn); };
/** fn(lane) → a factor on the lane's share of All. With none registered: 1 + 0.5·clamp(aff.lane, ±1). */
export const laneFactors = [];
export const registerLaneFactor = (fn) => { laneFactors.push(fn); };
/** The ranking with nothing learned: variety (noise), quality, relevance, the PDF bonus. */
export function baseScore(i) {
  const it = items[i];
  const q = it.q ?? Math.log(1 + (it.score || 0)) / Math.log(1 + laneMax[it.lane]);
  const rel = it.rel ?? 0.5;
  const doc = it.kind === 'pdf' ? 0.35 : 0;
  return noise(i) * 0.9 + 0.8 * q + 0.8 * (rel - 0.5) + doc;
}
export function score(i) {
  if (scoreTerms.length) { const it = items[i]; let s = baseScore(i); for (const f of scoreTerms) s += f(i, it) || 0; return s; }
  // the old rule, unchanged except that lane affinity is clamped to ±1
}
```

In `buildOrder`, the round-robin weight becomes:

```js
const factor = (l) => (laneFactors.length ? laneFactors.reduce((p, f) => p * (f(l) ?? 1), 1)
  : 1 + Math.max(-1, Math.min(1, state.aff.lane[l] || 0)) * 0.5);
const weight = (l) => Math.max(0.1, (LANE_WEIGHTS[l] ?? 1) * factor(l));
```

Leave `learn()`, `state.aff` and `back.js` as they are: they feed the fallback and Back's snapshot.

**`ui/js/util.js`:**

```js
// ---- why lines ----
// registerWhyLine(fn): fn(it, i) → Node | null, added to the panel's "Why this" section
// after the why line. While any is registered, the section drops its "you liked …" line.
export const whyLines = [];
export function registerWhyLine(fn) { whyLines.push(fn); }
```

**`ui/js/panel.js`**, the `why` section:

- `render(it, i)`;
- `liked` is `[]` when `whyLines.length`;
- append `whyLines.map((f) => { try { return f(it, i); } catch (e) { console.error('why line', e); return null; } })` after the `.why` div.

**`ui/js/feed.js`** `showError(e)`: add `emit('item:error', { i: current(), it, msg: e.message })`. Add `item:error {i, it, msg}` to the event list in `util.js`'s comment.

**`ui/js/features/memory.js`**: §3.2.

No other core file changes. `corpus.js` needs nothing: items added by jobs are ordinary `corpus.json` items with extra fields. Badges need no core hook (§8.4).

### 8.2 `learn.js`: load, score term, refresh

1. **Load.** At module top:

   ```js
   await Promise.race([fetch('/learn/profile.json?part=rank').then(…), sleep(300)])
   ```

   Same pattern as `memory.js`. On `on: false`, a 404 or an error, do nothing more until the next `status` event shows `learn.on`.
2. **Register**, when `store.get('learnOn', true)`:
   - `registerScoreTerm((i, it) => B * (pred.get(it.id) || 0) + (phi.get(it.id) || 0))`
   - `registerLaneFactor((l) => laneFactor[l] ?? 1)`

   If the profile arrived after `boot`, call `buildOrder(true)` (the head stays). Turning learning off in the Dashboard splices both functions out of `scoreTerms` and `laneFactors`, then calls `buildOrder(true)`.
3. **Refresh.**
   - On `item:shown`, if more than 60 s have passed since the last fetch, `GET ?part=rank&since=<at>`.
   - 1.2 s after a `nav:before` with a judgment label (`save`, `unsave`, `less like this`, `more like this`), or a `nav` back that undid one; retry once at 3 s on `same`.
   - On a change, rebuild the Maps. If `max |ΔI|` over the next 50 items of `state.order` exceeds 0.1, or the new set changed, call `buildOrder(true)`.
   - Emit `learn:updated {at}`.
4. **Migration.** Once, if `!store.get('affImported')` and (`store.get('aff')` has entries or `store.get('saved')` is non-empty): `POST /learn/import`, then `store.set('affImported', true)`.
5. **Exports** for `dashboard.js` and `flag.js`:

   ```js
   export const learnState = () => ({ on, at, exposures, corpusAt, newIds })   // current rank part, summarised
   export function loadFull()                // Promise<the full profile> (cached by `at`)
   export function loadFinds(force)          // Promise<GET /learn/finds.json> (cached 30 s)
   export function whyOf(ids)                // Promise<{id: why}>, batched GET /learn/why?ids=
   export function isNew(id)                 // bool
   export function walkNew()                 // §8.5
   export function keep(id), dismiss(id)     // §8.6
   export function markSeen(ids | 'all')     // POST /learn/finds/mark, then refresh
   export function rankMoves()               // §8.3: {up: [{i, places, I}], down: […]}
   export function setLearnOn(on)
   ```

6. **Budget.** On `item:shown`, O(1) work: the header attribute, the badge timer, and maybe scheduling a fetch. On page turns: nothing.

### 8.3 Why lines and rank movement

`registerWhyLine((it, i) => …)` returns a `div.lw` filled asynchronously from `whyOf([it.id])` (cached per id and profile `at`):

- **Chips**: `+0.25 LLM papers › Reasoning` with the text in the title tooltip; positive chips in `--accent`, negative in `--ink-3`.
- **Rank movement**: "▲ 212 places in All". `rankMoves` keeps two sorted `Float64Array`s of all items' `baseScore` and `score` (built lazily in `requestIdleCallback`, at most once per 10 s after `learn:updated`). Places are `rank_base(i) − rank_full(i)`, found by binary search in O(log n). Omit the line when the arrays are not ready.
- **A find**: "New · added Oct 16 by job discover-0007 · via Semantic Scholar (like *s1*, *DeepSeek-R1*)", with Keep and Dismiss buttons (§8.6). Seed titles come from `byId`.
- **A read item**: "You read this deeply · ★".

The bold `it.why` line above it already shows the job's one-line reason.

### 8.4 NEW badges and how they clear

There is no core hook. All of this happens in `learn.js` and `learn.css`:

- **Item header.** On `item:shown`, set `#item-head`'s `data-badges` to `new` or remove it. `paintHead` replaces the children but never the element's attributes. CSS: `#item-head[data-badges~="new"] h1::after { content: "NEW"; … }`.
- **Wall tiles and library rows** (both carry `data-i`). Keep one generated `<style id="learn-new">` with one selector list for the unseen indexes:

  ```css
  :is(.tile, .lr-i):is([data-i="12"], [data-i="907"]) :is(.meta, .lr-t)::before { content: "NEW"; … }
  ```

  It is rebuilt when the set changes. A few hundred selectors cost nothing, and the library's virtual list picks the badge up as rows are created.
- **Up Next tiles** (another workflow; their markup is unknown). When an element matching `[id*="upnext" i], [class*="upnext" i], [id*="up-next" i], [class*="up-next" i]` exists, observe it with a MutationObserver. Append `<span class="new-pill">NEW</span>` to each child carrying a `data-i` or `data-id` of a new item, if absent. If the tiles carry neither attribute, the badge is skipped there; note it in the final report.
- **Pill style.** `font: 600 9px var(--mono)`, `letter-spacing: .08em`, `padding: 0 4px`, `border-radius: 2px`, `background: var(--accent)`, `color: var(--bg)`. Readable on light themes, since `settings.js` sets both tokens.
- **Clearing.** For the current item while it is new, check every 5 s and on `memory:updated {id}`: `r = memoryOf(id)` and `(r.a ≥ 20000 || r.sc ≥ 2 || r.saved || r.more || r.less)`. When true, remove the id from the set, regenerate the style, update the header, and update the chip count. The server applies the same rule on its next recompute. A flick past an item (under 20 s, fewer than 2 pages) leaves it new.

### 8.5 The New walk, the chip, the toast, the reload pill

- **Chip.** `<button id="new-chip">` inserted after `#views` in `#bar`, hidden when there are no new items: "NEW 8" in the pill style. Clicking it calls `walkNew()`; Shift+click opens the Dashboard.
- **`walkNew()`**: `stayIn({kind: 'new', id: 'new', label: 'New', crumb: ['New'], items: [indexes of new ids]}, {first: true})`. It uses the current sort (For you in All, so the strongest finds come first). It shows the feed if another view is up. Back undoes it, and `u` leaves (stack.js).
- **No "New finds" library folder.** An earlier plan put finds in a fixed folder with `fresh: true`. A folder would keep items there long after they were read. Here, each added item gets its topical folder from the tree builder, so it lives where it belongs. "New" is a stack that shrinks as you read. The earlier `fresh` flag and found date are the find state (§2.9) and `added`.
- **Toast**, once per batch: on load, when there are new items whose newest `added` is later than `store.get('learn:toasted')`, call `toast('8 new items', {icon: 'sparkles', kind: 'ok', sub: 'From agent jobs · Y: Dashboard · click NEW to walk them'})` and store the date. When all the new items come from one job, the sub line is `Like <first seed title, 32 chars> · Y: Dashboard`. Icons, all in `hud-icons.js`: `sparkles` for new items, `send` for "Flag written", `file-check` for "Copied", `circle-alert` for errors.
- **Reload pill.** On `status` events: if `s.corpusAt > corpusAt` (from the first rank response), fetch `/learn/finds.json`. If any find id is missing from `byId`, the chip turns into "NEW +5 · reload". Clicking it calls `location.reload()`; `route.js` and memory reopen the same item at the same page. Toast once: "New items arrived", sub "Reload to see them".

### 8.6 Keep and dismiss (Dashboard and panel)

- **Keep** = save:
  - add the id to `state.saved` (front) and `store.set('saved', state.saved)`;
  - `paintSaved()` from chrome.js;
  - `POST /memory {ops: [{o: 'judge', id, t: Date.now(), j: 'save'}]}`;
  - refresh 300 ms later.
- **Dismiss** = less like this: `POST /memory` with `j: 'less'`. The item becomes `dismissed` and sinks (Φ −0.8).
- **Undo**: both buttons turn into "Undo" for 6 s, which sends `unsave` or `unless`.
- These do not go through `nav:before`. They are not moves, so Back does not undo them.

### 8.7 `flag.js`: Flag for agent, open-error reports

- **Entry points.**
  - Key `!` (feed only): `registerKey('!', open, {help: ['!', 'flag a problem with this item for an agent job (writes a job file in the public repo)'], order: 41})`.
  - A small `⚑` button added to `#item-head .meta` by a MutationObserver, the same pattern `stack.js` uses for its crumb.
- **Dialog**, anchored top-right of `#stage`:
  - title "Flag for an agent";
  - the item's title and "p. 12";
  - a kind select: Doesn't open or wrong file · Pages missing or garbled · Images broken · Wrong title, author or date · Wrong lane or folder · Duplicate · Other;
  - a note textarea, placeholder "What's wrong? This goes into the public repository.";
  - a checkbox "Attach a picture of this page (goes into the public repository)", unchecked by default and disabled for flow documents;
  - buttons Write job (Ctrl/⌘+Enter) and Cancel (Esc).

  Keys typed in the dialog never reach the reader.
- **Picture.** Draw the visible panel canvases of `#spread` into one canvas, at most 1,600 px wide, and export `toBlob('image/webp', 0.85)`, at most 1.5 MB (lower the quality until it fits). Proxied images are same-origin, so the canvas is not tainted; if `toBlob` throws, send without a picture and say so.
- **Send** `POST /jobs/flag` (§5.2), where `view` is `{zoom: state.zoom, per: state.shown, crop: state.crop, cols: state.cols, flow: isFlow(it), theme: store.get('settings', {}).theme}`. Then toast "Flag written", sub "flag-0003 · Y: Dashboard".
- **Open errors.** On `item:error {it, msg}`, `POST /jobs/report {id: it.id, kind: 'open', msg: msg.slice(0, 120), status: /HTTP (\d{3})/ match or null}`, at most once per item per session.

## 9. The Dashboard (`dashboard.js`, `dashboard.css`)

`registerView('dashboard', {label: 'Dashboard', key: 'Y', order: 4, roots: () => [root], show, hide})`. The root is `section#dashboard` inside `#main`. `Y` is free; `y` is History. `?view=dashboard` opens it at boot through `route.js`. Add `keyHelp` `{label: 'Y', text: 'dashboard: new items, reading, what it learned, ranking, agent jobs', order: 64.5}`.

### 9.1 Layout and look

- **One scrolling page.** At the top, a sticky summary strip:

  > **8 new items** · 3 open jobs (1 high) · 4 h 10 min read this week · learned from 41 items · [Copy instructions for your agent]

  Below it, sections in a CSS grid, `grid-template-columns: repeat(auto-fill, minmax(min(100%, 560px), 1fr))`, gap 16 px, max width 1,600 px. Each section is a card (`--bg-2` background, 1 px `--line` border, 4 px radius) with an `h2` (13 px, 600, `--ink`) and a right-aligned row of small controls.
- **Order:** New items, Reading, What it learned, How ranking moved, Open jobs, Done jobs, then a footer with the privacy note (§10). New items comes first because it is what the reader asked to see.
- **Dense and calm.**
  - 12 px body, 11 px mono for numbers, 22 px rows.
  - No colour except `--accent` for new, positive and current; `--ink-3` for negatives and secondary text; `--bad` only for failures.
  - No animation except a 120 ms fade when a section's data arrives.
- **Themes.** Use only the tokens (`--bg`, `--bg-2`, `--bg-3`, `--line`, `--ink`, `--ink-2`, `--ink-3`, `--accent`, `--ok`, `--bad`). Check under `html[data-st-light]` (Light and Sepia in Settings); any fixed colour needs a light-theme override there.
- **Stable ids for QA:** `#db-new`, `#db-reading`, `#db-learned`, `#db-ranking`, `#db-jobs`, `#db-done`; rows `.db-row` with `data-id`; buttons with `data-act` (`open`, `keep`, `dismiss`, `walk`, `seen`, `boost`, `mute`, `ignore`, `reset`, `copy`, `copy-all`, `refresh`, `dismiss-job`).

### 9.2 Sections

**New items** (`/learn/finds.json`):

- Each row: the NEW pill (unseen), title (click opens), lane dot, `added` ("Oct 16"), via ("Semantic Scholar · like *s1*, *DeepSeek-R1*"), why (one line, ellipsis, full text in the title), the job id (click scrolls to it in Done jobs), and the actions Open · Keep ★ · Dismiss −.
- Controls: an "Unseen" / "All (90 days)" toggle (Unseen by default), "Walk all N" (`walkNew`), "Mark all seen".
- Empty state: "No new items. Agents add them by doing open jobs (below)."
- Up to 100 rows, then "Show more".

**Reading** (`/learn/reading.json`):

- KPI row, for this week and the last 30 days: time read, items opened, finished, pages, and the current and best streak.
- A 90-day bar chart of minutes per day: inline SVG, 90 bars, `--accent` for days of at least 10 minutes, `--ink-3` for the rest, a hover title with the date, minutes, items and pages, no axis except one baseline and the max label.
- Time per lane over 30 days as horizontal bars with lane colours (`LANE_COLORS`).
- "Most valuable reads": 8 rows with the label (deep or skimmed) and ★ + −.

**What it learned** (`/learn/profile.json` full and `/learn/history.json?days=8`):

- Two lists: **Interests**, the top 12 features by λ·√W with λ > 0 and not ignored; and **Less of**, the 6 most negative.
- Each row:
  - the label, with a group tag (tag, folder, field, author, lane, word, form);
  - a diverging λ bar from −2 to +2 around a centre line;
  - "2.3× your average" (`2^λ`);
  - the evidence ("4 deep · 1 skimmed · 1 ★");
  - examples (up to 3 titles, which open on click);
  - the change since a week ago (`▲ 0.31`, from the history line closest to 7 days ago; "new" when absent);
  - the controls `+` Boost, `−` Mute, `∅` Ignore, or Reset when a control is set (`POST /learn/control`, then refetch).
- **Lane mix**: chips such as "LLM papers ×1.53".
- **Search**: an input over every feature (`/learn/features?q=`) with the same rows, so the reader can boost something never read.
- **The ranking check**: "Predicted interest vs how much you read: ρ 0.31 over 42 opens (target ≥ 0.2)", or "Not enough opens yet (7 of 10)".
- A switch, "Use what it learned in For you" (`setLearnOn`, store `learnOn`).

**How ranking moved** (client-side, lazy):

- **Moved up for you**: the top 12 unread items by places gained in All (`rankMoves`), each with title, lane, "▲ 212", I, and the two chips from `whyOf`.
- **Moved down**: the top 8 by places lost.
- **Since last week**: lane factors now against 7 days ago, and the 5 features whose λ changed most.
- Computed in `requestIdleCallback` when the section first scrolls into view (IntersectionObserver), not on `show`.

**Open jobs** (`GET /jobs`):

- At the top:
  - **Copy instructions for your agent**, which copies `prompt` (below) and toasts "Copied";
  - **Refresh jobs** (`POST /jobs/refresh`; shows created, updated and skipped);
  - "Last refreshed 3 h ago · next in 21 h";
  - counts by type;
  - the hint: "Using an agent in the cloud? Commit and push `jobs/open/` first: `git add apps/open-stacks/browser/jobs/open && git commit -m "Stacks: open jobs" && git push`. The app never runs git."
- Rows: a priority dot (high `--accent`, normal `--ink-2`, low `--ink-3`), id, type, title, created, and inputs count or wants. Expanding a row shows the body, rendered with a minimal Markdown renderer (headings, paragraphs, lists, inline code, links; text escaped), plus Copy (the per-job prompt) and Dismiss (`POST /jobs/dismiss`, with a confirm). A flag shows its picture from `/jobs/asset`.

The prompts, generated by the server (`prompt` fields), are exactly:

> In the cairn repo, open apps/open-stacks/browser/jobs/README.md and do the open jobs in apps/open-stacks/browser/jobs/open/, highest priority first (node jobs.mjs next). For each job: follow the playbook, run node jobs.mjs check <id> --live, then node jobs.mjs done <id>, and commit with the command it prints (one commit per job). Stop after 5 jobs or 60 minutes and summarise what you did.

> In the cairn repo, do job discover-0007 (apps/open-stacks/browser/jobs/open/discover-0007.md) following apps/open-stacks/browser/jobs/README.md: check it with node jobs.mjs check discover-0007 --live, close it with node jobs.mjs done discover-0007, and commit with the command it prints.

`apps/open-stacks/browser` is `repoPath`.

**Done jobs**: the last 30.

- Each row: status (done, dropped, dismissed), done date, title, "8 added · 1 changed", files, and the outcomes of the items it added from `finds.byJob` ("5 new · 2 read · 1 kept · 0 dismissed").
- Expanding a row shows the Result text.

### 9.3 Behaviour and speed

- **Data.** `show()` starts all requests in parallel and paints each section as its data arrives, with a one-line skeleton until then. The first section paints within 150 ms on a warm local server.
- **Lifetime.** Data is cached while the Dashboard is open. `show()` refetches when older than 30 s, and the strip's `r` refetches now. Nothing runs while the view is hidden: no timers, no listeners doing work, and observers disconnected in `hide()`.
- **Keys**, in a capture-phase handler active only in this view:
  - `j`/`k` move the row focus;
  - `Enter` opens the focused row;
  - `s` keeps and `x` dismisses on a New row;
  - `Esc` returns to the feed;
  - `r` refreshes.

  Global keys (`/`, `f`, `w`, `y`, `?`) still work.
- **Opening an item** from the Dashboard uses `jumpTo(i)`. That is the 'open item' label, so memory records `via: 'jump'`.

## 10. Privacy

- **What leaves the machine.** Nothing new is sent by the app: it makes no discovery requests. Agents send search queries about public papers when they do jobs. Those queries are built from public titles, ids and author names, and are recorded in each job's Result.
- **What the public repository gets.** Job files with public ids, titles, authors, lane and tag labels, a coarse priority, item counts wanted and error statuses. Items agents add, with neutral provenance. Flag notes and pictures only when the reader writes or ticks them, with a warning in the dialog. Never: times, page counts, visit logs, judgments, notes from the note box, the learned weights, or wording such as "you read X deeply". The lint (§7.9) and the QA grep (§11.4) enforce this.
- **What stays local.** Reading memory, the profile, history, opens, controls, find marks, `errors.json` and the job run log, all under `CACHE/`. Explanations that mention your reading appear only in the panel and the Dashboard.
- **Residual exposure.** Discover and follow-author jobs name seed items, so a public job implies that someone was interested in those titles. The reader accepted this. Every job is visible in the Dashboard before anyone commits it, and Dismiss removes it.
- **Dashboard footer:** "The app sends nothing new over the network. Job files in jobs/ are part of the public repository: they list public titles and ids, never your reading history. Open any job above to see exactly what it says."

## 11. Tests and QA

Run with `node --test test/*.test.mjs`. Every test uses temp `STACKS_CACHE` and `STACKS_JOBS_DIR`, ports from 4800 up, and `STACKS_JOBS_EVERY=0`.

### 11.1 SERVER tests

`test/learn-ops.mjs` (a helper, not a test) exports `readOps(id, {mins, frac, days, at, judge, exit, via, n})` and `quickOps(id, {secs, at, exit, via, judge})`. They emit memory ops (`visit` with `x`/`via`, `at`, `saw` rows spread over the time, `judge`) equivalent to the simulation's `readRec`/`quickRec`. They also export `recordsOf(ops)`, which replays ops through `45-memory.mjs` `apply()` into records.

**`test/learn-core.test.mjs`:**

- **Engagement** on DeepSeekMath (12 pages), within ±0.03 of model §1.9:

  | Reading | y | w |
  |---|---|---|
  | 3 s then j | 0 | 0.35 |
  | 20 s, one spread | 0.06 | 1 |
  | 2 min skim | 0.33 | 1 |
  | 6 min, first half | 0.56 | 1 |
  | 18 min, 90% | 0.85 | 1 |
  | 18 min over 3 days | 1.00 | 1 |
  | 3 s then save | 0.90 | 2 |
  | 10 min then less | 0 | 3 |

  Plus an LW post of 5.4k words, 8 min, 70%: y 0.59. An old scan of 348 pages, 4 min over 40 pages: y 0.45. An idle window (3 h open, 60 s active): y ≤ 0.15.
- **Quick-exit weights** by `x` and `via`. Load failure excluded. A judged-unopened item has the weights of §2.1.
- **Replay** with every retraction. S6: `x` then `unless` gives a profile identical to the one before (λ bit for bit).
- **λ:** formula examples; one `less` alone is never below −0.85.
- **Controls:** boost, mute and ignore, applied as in §2.6.
- **S8, bounds:** |λ| ≤ 2; |I| < 1; lane factor in [0.44, 2.30]; Φ in [−0.8, 0.3]; the term `B·I + Φ` in (−1.6, 1.1).
- **S7, monotonicity** (property tests on 1,000 random records): more active time or more pages never lowers y. Adding a deep read of X never lowers I for an item with a superset of X's features.
- **Explanations:** the sum of Δ equals B·I within 1e-9.
- `firstAuthor` on the corpus's author formats; `findState` precedence; `spearman` against a known value.

**`test/learn-sim.test.mjs`**, on the real `corpus.json` with a fixed noise seed and noise identical to `state.js` (seed 12345). Two variants: corpus tags only, and a fixture `tags.json` (written to a temp dir) adding `reasoning-models`, `rl-training`, `tabletop-rpg` and `wargames` by the simulation's regexes. Ranking is All with round-robin, as in `state.js`. The scenarios and pass bands, from model §5.2 (the sim columns are the values to expect):

| # | Scenario | Sim, corpus tags | Sim, tags fixture | Pass if |
|---|---|---|---|---|
| S0 | Cold start | I ≡ 0 | same | Order identical to `baseScore` order |
| S1 | One deep read of DeepSeekMath (18 min, 90%) | biggest change +0.25 | +0.28 | Biggest change ≤ 0.30; unread top-50 Jaccard ≥ 0.75; the top 3 gainers are LLM › Reasoning items |
| S2 | Session A: deep reads of DeepSeekMath, DeepSeek-R1 (2 days, saved), s1, test-time compute (`m`) and *Monitoring Reasoning Models*; 6 TTRPG quick exits and 1 `less`; 25 quick exits from the head of the cold feed; 5 LessWrong skims | reasoning in top 20 / 50: 4 / 6; TTRPG in top 100: 3; Jaccard 0.52; sd of B·I 0.142 against 0.383 | 7 / 11; TTRPG 3; Jaccard 0.45; *Fate Core* I = −0.59 | Corpus tags: top 20 ≥ 3 and top 50 ≥ 5. Fixture: top 20 ≥ 5 and top 50 ≥ 9. TTRPG in top 100 ≤ 3. At least 8 lanes in the top 50. sd of B·I ≤ 0.5 × the rest. Jaccard 0.3-0.7 |
| S3 | S2 aged 90 days | top 20 / 50: 3 / 5; `path:llm/Reasoning` 1.19 → 0.91 | 5 / 10 | The top λ falls 15-40% and stays above cold |
| S4 | S2 aged 14 days, then 10 forecasting reads (8-17 min) and 4 reasoning quick exits | – | forecasting factor 0.76 → 1.30; llm 1.53 → 1.29 | Forecasting factor ≥ 1.2 and ≥ llm − 0.05 |
| S5 | Robustness: a save of *Blades in the Dark SRD* after the TTRPG skips | lane λ −1.18 → −0.18; its folder 0 → +0.71 | – | One save lifts the lane to ≥ −0.4 |
| S9 | Cost: the corpus ×5 (9,740 items), 5,000 exposures | profile 49 ms per 1,948 exposures; prediction 32 ms | – | Recompute ≤ 300 ms; `buildIndex` ≤ 1.5 s |
| S10 | New finds: 10 items given `added` today, never opened | – | – | Each gets Φ +0.3; after `readOps` of 30 s on one, it is `seen` and Φ 0 |

A failing S2 band means tuning, in this order: B (0.6-1.0), the 0.75 in the tanh, then κ (3-6). Record the final values in `LEARN` and in this spec.

**`test/learn-api.test.mjs`** (a server on a temp cache):

- POST session A's ops to `/memory`; within 2 s, `?part=rank` changes and `since` returns `same` when nothing changed.
- `/learn/why` chips sum to `B·I` within 0.01.
- Boost changes `pred` within 1 s. `/learn/import` is idempotent.
- `/learn/reading.json` days, totals and streak on synthetic visits across 5 days.
- `/memory`'s `brief()` honours `unless`.
- `/status.learn` is present.
- `STACKS_LEARN=0` gives `{on: false}`.

**`test/jobs-core.test.mjs`:**

- `parseJob`/`formatJob` round-trip; malformed lines are reported.
- `nextId` across `open/` and `done/`.
- The generator on a synthetic profile and corpus produces each type under its rule. Check caps, dedupe by key, cool-downs, rewrite only when the sha1 is unchanged, ordering, and no reading-based jobs below 10 exposures.
- `privacyLint` on every generated job of every type: zero hits. A planted "you read 3 deeply" is caught.

**`test/jobs-check.test.mjs`** (a temp copy of `corpus.json` and `data/` via `--root`). `check` fails on:

- a duplicate by each key: arXiv `v2`, DOI, `10.48550` DOI, title ≥ 4 words, short title plus surname, LW `xpost`, IA work key, URL key;
- a deny-listed host;
- an unknown host;
- each missing field;
- a `why` with "you";
- a count below `min`;
- a corpus not merged;
- a scan after 1930.

It passes a good fixture. Also: `done` writes Result and moves the file; `drop` likewise; `--live` is mocked with a local HTTP server.

**`test/jobs-merge.test.mjs`:**

- `build-corpus.mjs --merge --root <tmp>` appends the `.added.json` items with `path` and `ord`, keeps every existing item's index, applies overrides (field change and drop), and changes no quri `ord`.
- It makes no network call: run it with `--import` of a module that replaces `fetch` with a throwing stub.
- It takes ≤ 3 s.

**`test/jobs-api.test.mjs`:**

- `GET /jobs` shape and prompts.
- `POST /jobs/refresh` with session A in memory creates discover and fix-item jobs in the temp dir.
- `/jobs/flag` writes the file and the asset.
- `/jobs/dismiss` moves the file.
- Two `/jobs/report`s on two days (`t`) make a fix-item job on the next refresh.
- `media-fixes.json` entries reach `manualCopy` (stubbed).

### 11.2 UI tests (`test/dashboard-ui.mjs`, Playwright)

This is a script, not a `node --test` file. It uses the global Playwright (`createRequire('/opt/node22/lib/node_modules/')`; Chromium from `PLAYWRIGHT_CHROMIUM_EXECUTABLE` or Playwright's default). It runs the real server on a temp cache. Until the server routes exist, it serves `test/fixtures/learn-ui/*.json` (rank part, full profile, finds, why, reading, history, jobs) through `page.route`. It checks:

1. **Cold start.** With an empty cache, `state.order` is identical with learning on and off (S0 in the browser).
2. **The score term.** A fixture with `pred` for 20 items moves them up in All: the head (`pos + 3`) is unchanged, and the term is visible in `score(i) − baseScore(i)`.
3. **NEW badges** show in the header, a wall tile and a library row for a fixture find. A flick past (j after 2 s) leaves the badge. 25 s on the item, or 2 pages seen, clears it everywhere without a reload.
4. **The chip** walks the new items (`state.stack.kind === 'new'`), `u` leaves, and Back undoes.
5. **The why line** shows chips, the rank movement and the find provenance.
6. **The Dashboard** (`Y`) paints all six sections from fixtures:
   - in dark, Light and Sepia themes (screenshots saved for QA);
   - Keep, Dismiss and Undo send the right memory ops;
   - Boost sends `/learn/control`;
   - Copy instructions puts the exact prompt on the clipboard;
   - Esc returns to the feed.
7. **The flag dialog:** `!` opens it, keys typed in it do not move the reader, and Write job posts the expected JSON (the picture is under 1.5 MB).
8. **`memory.js` ops** carry `x` and `via`; Back after `x` sends `unless`.
9. **Speed:**
   - a page turn with learn.js loaded costs no more than without it (median of 30 turns, within 1 ms);
   - the Dashboard's first section paints ≤ 150 ms after `Y`;
   - no long task over 50 ms while it is open and idle.

### 11.3 QA: learning

1. Run the server tests and the UI script. Rerun the scratch simulation (`EXTRA=1 B=0.8 node sim.mjs corpus.json`, if the scratchpad still has it) and compare the S1-S5 numbers with `test/learn-sim.test.mjs`'s output; any difference over 10% needs a written reason.
2. Live: start the server on a temp cache and replay session A through `/memory` with `test/learn-ops.mjs`. In the browser:
   - For you in All shows reasoning items rising, while every lane still appears in the first 50;
   - the panel's why chips read sensibly on *Chain-of-Thought Prompting*, *Thought Anchors* and *Fate Core*;
   - x then Back restores the order exactly;
   - the Dashboard's interests, lane mix and ranking moves match `/learn/profile.json`.
3. Boost a never-read tag; its items rise and a discover job for it appears after Refresh jobs. Mute it; they sink and the job is not recreated. Ignore a title word; it leaves the chips.
4. Report the numbers, screenshots in both themes, and anything that read wrong to a reader.

### 11.4 QA: the jobs loop

1. **Generate.** Simulate reading (session A plus a few forecasting reads) on a temp cache and run Refresh jobs. **Privacy check:** grep every generated job file for times, page counts, visit counts, "you", judgments and note text (the §7.9 patterns plus the titles of items only skimmed or skipped). There must be no hits beyond the seed titles.
2. **Act as the outside agent** in a scratch **copy** of the browser folder (`cp -r` without `node_modules` and caches; never touch the real data files). Follow **only** `jobs/README.md`, with live APIs but few calls (at most about 15 per source). Do:
   - one `discover` job;
   - one `fix-item` or `flag` job (create the flag through the UI or `POST /jobs/flag`);

   all the way to `done` and a commit in the copy (`git init` there).
3. **Bad additions.** Deliberately add a duplicate (an arXiv `v2` of a corpus paper), a closed or deny-listed link, and an item missing `why`. Check that `jobs.mjs check` catches each with a clear message.
4. **In the reader.** Start the app on the copy. The new items appear with NEW badges, the chip, the toast, provenance in the why section, and rows in the Dashboard's New items and Done jobs. Reading one for 30 s clears its badge.
5. **Report** how clear the playbook was (where you hesitated, what you had to guess) and **fix `jobs/README.md`** accordingly. Commit only the playbook fix, in the real repo.

### 11.5 Tuning knobs (not built now)

- Noise that shrinks with evidence: `0.9 − 0.3·min(1, exposures/200)`.
- An exploration slot: 1 in 10 For you positions from items whose features have total W < 1.
- `o` (open the original) as a weak positive (w 0.3, y 0.5).
- Per-lane trust in `q` from the Spearman correlation of `q` with y (model §3.8).
- Refitting the §2.1 weights from `opens.jsonl` once it holds 200 opens.

## 12. Build order and handoff

**SERVER:**

1. `server/learn.mjs` with `learn-core` and `learn-sim` tests (tune until S2 passes).
2. `45-memory.mjs` additions.
3. `47-learn.mjs` and `learn-api` tests.
4. `server/jobs.mjs` (format, generator, lint, check), `jobs.mjs`, `build-corpus.mjs --merge`, with the `jobs-core`, `jobs-check` and `jobs-merge` tests.
5. `96-jobs.mjs` and `jobs-api` tests.
6. `jobs/README.md`, `jobs/hosts.json` and the folders.
7. `ARCHITECTURE.md`: the Learning section, the jobs section (replace "being written" with the real pointers), and the hooks of §8.1.

**UI:**

1. The core hooks (§8.1) and the `memory.js` additions.
2. `learn.js`: load, the term, refresh, the migration.
3. Badges, the chip, the New walk, the toast, the reload pill.
4. Why lines and rank movement.
5. `flag.js`.
6. The Dashboard.
7. `README.md`: `Y` Dashboard, `!` flag, NEW and the chip, and one paragraph on agent jobs pointing to `jobs/README.md`.
8. `test/dashboard-ui.mjs` with fixtures.

**Handoff.** Each builder's final report lists:

- every deviation from §2.10, §4, §5 or §8.1;
- the tuned constants;
- test results;
- anything left for the other builder.

The UI builder reruns `test/dashboard-ui.mjs` against the real server, without fixtures, once SERVER is done.

**Risks:**

- **Tags.** Without `data/tags.json`, cross-lane generalisation is weak: S2's corpus-tags band is the floor.
- **Seed titles are public.** Discover jobs reveal seed titles, a privacy trade-off the reader accepted (§10).
- **Corpus edits.** Agents editing `corpus.json` concurrently with the reader's app is safe: the app only reads it, and a reload picks up changes. Two agents merging at once can conflict; the playbook says to rerun `--merge`.
- **Up Next.** Its markup is unknown, so its badge may need a one-attribute change in that file at integration.
