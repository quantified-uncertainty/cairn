# Stacks Browser: status

*16 October 2026. What is built, what is half built, what was asked for and
not started, and how to move the browser into a directory of its own. The
README says how to use it, ARCHITECTURE.md how it fits together.*

## Built and checked

Each of these was built, then checked by a separate QA pass in headless
Chromium against a test server (**nothing has been run in Firefox**, the
reader's browser: Playwright's Firefox is not installed in the build
environment, so the checks read the code for Chromium-only APIs instead); the numbers are in the commit
messages and the design notes under `docs/`.

| Area | What | Where |
|---|---|---|
| Reader | spreads, crops (born-digital PDFs are never treated as scanner beds), two-column split, zoom, hold `l`/`h` to riffle and `j`/`k` to skim, wheel and trackpad maps, Back, notes, saves, read-aloud | `feed.js`, `render.js`, `riffle.js`, `nav.js` |
| Header | two bars, one bar, Focus (no bars), position line at the top or bottom, per-screen layout; links to the original in the item header; the views as icons (Reader, Wall, Feeds) and ▾ with every view; small cards on resting over the title, lane, author or site, stack crumb, date and ⚑ | `header.js`, `chrome.js`, `features/headpop.js` |
| Library (`L`) | the stack j/k walk, in its sort (By topic, For you, Newest, Oldest); stay in a folder or tag; position row with load marks; sections behind `§` | `stack.js`, `features/library.js` |
| Tags | 362 model-suggested clusters; every corpus item in at least two | `data/tags.json`, `tag-corpus.mjs` |
| Up Next | the next items as tiles in the empty band under the pages | `features/upnext.js` |
| Learning | reading time and judgments reweight For you; explanations; boost, mute, ignore | `server/learn.mjs`, `features/learn.js` |
| Dashboard (`Y`) | new items, reading, what it learned, how ranking moved, agent jobs | `features/dashboard.js` |
| Agent jobs | the app writes job files; an outside agent (Claude Code) does them by `jobs/README.md`; `node jobs.mjs check --live` guards sources | `server/jobs.mjs`, `jobs.mjs`, `jobs/` |
| Local folders | your own folders read in place (PDF, EPUB, Markdown, HTML, text, Word on a Mac, pictures, sound); iCloud placeholders; bundles (a `*.stack` folder or one with `index.md`/`index.html`: one item, pictures from inside it, metadata, cover; the format for agent-written material, `docs/authoring.md`) | `server/local.mjs`, `features/local.js` |
| Widgets | an interactive component on a web page is replaced by a note and a link to the live page | `docs.js` `markWidgets` |
| Corpus | 2,628 items in 11 lanes, including Technical books and the full DeepMind safety and Forecasting lanes (merged offline 16 October and tagged) | `corpus.json`, `data/lanes/` |
| Speed | disk cache and warm-up of every lane's opening spreads; `/ready` load marks; page images from a second origin (127.0.0.1 beside localhost) so they never take the app's six connections | `server/cache.mjs`, `routes/60-warm.mjs`, `util.js` `PI` |

## Built, first version (see the notes before relying on it)

- **Server-side PDF rendering** (`server/pdfnative.mjs`, `server/render.mjs`,
  `routes/16-render.mjs`; spec `docs/performance/prerender.md`). PDF pages
  are rendered on the server by native tools on all cores and the client
  shows them as it shows scans, falling back to pdf.js within about 0.7 s.
  Measured here with poppler: first spread 119 ms against 572 (p50), hops
  between PDFs 13 against 52, text layer within 0.7 px of pdf.js.
  Engines: Quartz (a Swift helper compiled on first run when the Xcode
  command-line tools are present; **never run yet: it can only be tested on
  the Mac**), then poppler (`brew install poppler`), then MuPDF, then none
  (pdf.js as before). `GET /render/state` says which engine runs, and
  `bin/stacks status` says it in a line, with why Quartz is not used.
- **"Wrong?" on summaries and reading guides** (`features/aitrust.js`,
  `routes/31-aitrust.mjs`): the report goes to `CACHE/ai-errors.jsonl`
  and the item's AI fields are dimmed until a new output is made.
  Checked by its builder in headless Chromium against a mock-AI server;
  nothing reads the reports yet (a prompt or model choice could).
- **Feed threads**: 38 threads (6 exemplars and 32 more) written by agents
  that read the sources, every quote re-checked against fresh copies; the
  first feed in Feeds and a Thread section in the side panel; a generator
  for the rest with Claude Haiku (`node threads.mjs`; needs
  `ANTHROPIC_API_KEY`; `--dry-run` prints the cost first, about $7.70 for
  the corpus; tested only in mock mode). Threads are labeled AI-written in
  the UI. Independent checks of all 38 against fresh sources found 27 of
  255 posts wrong (8 material, mostly figure posts reading values off a
  chart; 19 minor: dropped hedges and qualifiers, a page off by one) and
  fixed them. The quote verifier cannot catch this kind of error, so expect
  about one post in ten to need fixing in what the generator writes.
- **Header popovers and the icon view switcher** (`features/headpop.js`,
  `header.js`): Reader, Wall and Feeds as icons with a ▾ menu of every view;
  small popovers on the title, lane, author or site, crumb, date and flag
  after a 350 ms rest; Auto picks one bar on the 14-inch MacBook (window
  under 1600 px wide). Checked by its builder's 95-check script and an
  item-switch A/B (no slower), then by a separate reviewer at four window
  sizes (fixed: authors hidden or cut at laptop widths, a dismissed card
  reopening on a pointer twitch; Esc no longer leaves for the Wall just
  after a card closed by itself or while the pointer is on the header).
  Left: keyboard focus on a header part is lost on a page turn (the header
  is rebuilt).

## Asked for, not done

- Read-aloud voices: ordering and a local engine (Kokoro) wait on a
  decision about adding that dependency.
- Google Docs import inside the app (no Drive connection; today a Docs
  web-page export unzipped into a Local folder is a bundle as it is, and
  many Docs come in as the zip of Word files Drive downloads:
  `docs/authoring.md`), wiki sources as a Local lane. Bundles have been
  checked only in headless Chromium, not in Firefox.
- Metadata indicators (`docs/meta/`): designed, not built.
- The learning simulation (`test/learn-sim.test.mjs`) runs on the first 1,948
  corpus items, the set its scenarios were calibrated on; on the whole corpus
  scenario S4 (drift to forecasting) misses its band. Recalibrate it.
- PDFs in Local folders are drawn by pdf.js in the browser; the server
  renders only web PDFs (`routes/16-render.mjs`).

## Open items from the request audit (16 October)

Every request the reader made in the first two days (188, from their own
messages) was checked against the code: 124 done, 5 answered, 38 partly
done, 3 not done; the 14 small gaps were fixed the same day. What is left,
by area (effort: M a day or less, L more):

- **Reader.** Real highlights (marked on the page, kept) and one Markdown
  file per item with front matter for Bear or Obsidian (M). Two-column
  split that ignores running heads and full-width figures (M). Tighter
  crops for Google-digitized scans in compiled profiles (M). Placeholders
  of the right shape before a profile exists: done (`GET /shapes`,
  `shapes.js`; quiet and page-coloured, not white; size error of the first
  placeholder over 15 mixed items, median 14.1% → 9.5%, mean 25.9% →
  17.4%; covers and pages a lane does not usually crop like are still
  off; checked in headless Chromium only). Running headers cropped
  across a PDF's pages (in progress). The brainstorm's last navigation ideas
  are built (16 October; checked in headless Chromium only, not Firefox):
  a leader key (`'` or F19, then a home-row letter), save-and-advance
  (`.`) and tap zones on the pages (`features/leader.js`,
  `features/tapzones.js`; a second check found no key clashes and no
  turn on a drag, a selection, a modifier or a link; a double click on a
  word in the outer fifths turns rather than selects, by design); left:
  the doc's Colemak-DH preset for the frequent keys (`n e i u`) and
  named, rebindable actions.
- **Library.** A "Later" queue prefetched and summarized overnight (M).
  Topic folders inside DeepMind safety › Blog & posts, 344 items (M).
- **Header and chrome.** The metadata indicators of `docs/meta/` (M;
  `data/meta/part-*.json` to merge and 874 items to fill). The current
  section's name beside the page numbers (M). A local read-aloud engine
  (L; see voices above).
- **Views and learning.** Feeds ordered by For you with an exploration
  slot, and Feeds signals (saves, hides, dwell) sent to the learning
  model (M). Paper covers on the wall showing their top figure: done
  for arXiv papers (`wall.js` `showFig`, `GET /extract/leads`; Settings ›
  Wall › Paper covers, default Top figure; checked in headless Chromium
  only: 56 of the LLM lane's first 60 papers have one; frame times over
  60 tiles, steady scroll p95 33-50 ms with figures against 17-50 without,
  after drawing each figure once into a tile-sized canvas off the scroll
  (plain `<img>`s had made it 83-250 ms); a scroll-and-rest run still
  shows an occasional single long task of 0.5-0.7 s, not the drawing
  (at most 52 ms): probably a large SVG parsed when it arrives; Up next's
  covers do not use them yet). Figures from non-arXiv PDFs (L).
  Threads for the rest of the corpus (`node threads.mjs`, needs a key).
- **Data and speed.** The Haiku pass for relevance, hooks and best entry
  pages is built (`enrich-batch.mjs`, into `CACHE/enrich.json`; best pages
  only from an outline, never front matter; about $0.15-0.35 for the
  corpus; tested in mock mode only, never against the API), and so is the
  whole-corpus run as one command (`bin/stacks overnight`: warm, compile
  `--assets full`, enrich, guides, threads, one `--max-usd`; checked in
  mock mode on 2-6 items here, and again by a second check: a run killed
  mid-way resumes, and a mock night on a server not in mock mode skips
  the guide batch; not yet run on the Mac). Left: posts' best
  pages are written but nothing opens or jumps to them (`nav.js` `r`
  walks best pages only for PDFs and scans). Citation-following lane
  growth and syllabus readings (M), deeper prefetch for large scans
  and the byte-capped caches of `docs/performance/prerender.md` §5.4 and
  §6 (L), the Quartz self-test on the Mac (S).
- **The Open Stacks wiki.** Two prototypes never built (Front Table,
  Epoch Slider) and eight chapters still marked planned.

## Moving the browser to its own directory or repository

The folder is self-contained: no code reads anything outside it (checked
with a search for `../` paths), it has its own `package.json`
(`@anthropic-ai/sdk` is its only dependency), and everything a reader
creates lives in `$STACKS_CACHE`.

1. Keep the history: `git subtree split --prefix=apps/open-stacks/browser -b stacks-browser`
   in the cairn checkout, then push that branch to the new repository.
2. Add a `.gitignore` (cairn's root one covers it today):
   `node_modules/`, `.env*`, `.cache/`, `*.log`, `arxiv-*.pdf`.
3. Links that point into the wiki: the README's "Part of Open Stacks"
   (`../`) and mentions of `apps/open-stacks/browser` in docs and job
   prompts (`git grep -n "apps/open-stacks/browser"`) become the new path.
4. `CLAUDE.md` here carries the rules agents need; cairn's root
   `CLAUDE.md` does not apply in the new place.
5. Nothing in `~/.cache/open-stacks` needs to move.

## Settings not described elsewhere

The README and ARCHITECTURE.md describe the main `STACKS_*` settings
(port, cache, warm-up, Local folders, jobs, learning, rendering). These are
read in one place each:

| Setting | Default | What |
|---|---|---|
| `STACKS_EXPORT_DIR` | `~/Documents/Stacks` | where exports are saved (`routes/75-export.mjs`) |
| `STACKS_RMAPI`, `STACKS_RM_FOLDER` | `rmapi`, `/Stacks` | send an export to a reMarkable with the `rmapi` CLI |
| `STACKS_HL_MODEL` | `claude-haiku-5-5` | model for `highlights-batch.mjs` |
| `STACKS_JOBS_DELAY` | 120000 | ms after start before the first job refresh |
| `STACKS_LOG_HOSTS` | off | log every upstream host the cache fetches from |
| `STACKS_RESCUE_EVERY`, `STACKS_RESCUE_MODEL`, `STACKS_RESCUE_AI_MAX` | 4 h, `claude-haiku-5-5`, 4 | the dead-link scavenger (`server/rescue.mjs`) |
| `STACKS_WAYBACK`, `STACKS_WAYBACK_API` | web.archive.org | the Wayback Machine endpoints the scavenger uses |
| `STACKS_TTS_URL`, `STACKS_TTS_MODEL`, `STACKS_TTS_HOURLY_CHARS` | Google's API | read-aloud through a cloud voice (`routes/55-tts.mjs`; needs `GEMINI_API_KEY`) |
