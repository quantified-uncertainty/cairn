# Stacks Browser: status

*16 October 2026. What is built, what is half built, what was asked for and
not started, and how to move the browser into a directory of its own. The
README says how to use it, ARCHITECTURE.md how it fits together.*

## Built and checked

Each of these was built, then checked by a separate QA pass in headless
Chromium (not Firefox) against a test server; the numbers are in the commit
messages and the design notes under `docs/`.

| Area | What | Where |
|---|---|---|
| Reader | spreads, crops (born-digital PDFs are never treated as scanner beds), two-column split, zoom, hold `l`/`h` to riffle and `j`/`k` to skim, wheel and trackpad maps, Back, notes, saves, read-aloud | `feed.js`, `render.js`, `riffle.js`, `nav.js` |
| Header | two bars, one bar, Focus (no bars), position line at the top or bottom, per-screen layout; links to the original in the item header | `header.js`, `chrome.js` |
| Library (`L`) | the stack j/k walk, in its sort (By topic, For you, Newest, Oldest); stay in a folder or tag; position row with load marks; sections behind `§` | `stack.js`, `features/library.js` |
| Tags | 336 model-suggested clusters; every corpus item in at least two | `data/tags.json`, `tag-corpus.mjs` |
| Up Next | the next items as tiles in the empty band under the pages | `features/upnext.js` |
| Learning | reading time and judgments reweight For you; explanations; boost, mute, ignore | `server/learn.mjs`, `features/learn.js` |
| Dashboard (`Y`) | new items, reading, what it learned, how ranking moved, agent jobs | `features/dashboard.js` |
| Agent jobs | the app writes job files; an outside agent (Claude Code) does them by `jobs/README.md`; `node jobs.mjs check --live` guards sources | `server/jobs.mjs`, `jobs.mjs`, `jobs/` |
| Local folders | your own folders read in place (PDF, EPUB, Markdown, HTML, text, Word on a Mac, pictures, sound); iCloud placeholders | `server/local.mjs`, `features/local.js` |
| Widgets | an interactive component on a web page is replaced by a note and a link to the live page | `docs.js` `markWidgets` |
| Speed | disk cache and warm-up of every lane's opening spreads; `/ready` load marks; page images from a second origin (127.0.0.1 beside localhost) so they never take the app's six connections | `server/cache.mjs`, `routes/60-warm.mjs`, `util.js` `PI` |

## Built, first version (see the notes before relying on it)

- **Server-side PDF rendering** (`server/pdfnative.mjs`, `server/render.mjs`,
  `routes/16-render.mjs`; spec `docs/performance/prerender.md`). PDF pages
  are rendered on the server by native tools on all cores and the client
  shows them as it shows scans, falling back to pdf.js within about 0.7 s.
  Engines: Quartz (a Swift helper compiled on first run when the Xcode
  command-line tools are present; **never run yet: it can only be tested on
  the Mac**), then poppler (`brew install poppler`), then MuPDF, then none
  (pdf.js as before). `GET /render/state` says which engine runs.
- **Feed threads**: 32 thread digests written by agents that read the
  sources, a generator for the rest with Claude Haiku (needs
  `ANTHROPIC_API_KEY`; `--dry-run` prints the cost first).

## Asked for, not done

- Header: view tabs as a few icons plus a menu; hover popovers on the
  title, lane, author or folder, date and flag.
- Corpus rebuild with the new lanes (DeepMind safety posts, forecasting
  papers, textbooks).
- Read-aloud voices: ordering and a local engine (Kokoro) wait on a
  decision about adding that dependency.
- Google Docs import (export as `.docx` or HTML into a Local folder works
  today), a documented bundle format for agent-written HTML with images
  (`docs/authoring.md`), wiki sources as a Local lane.
- Metadata indicators (`docs/meta/`): designed, not built.
- Known small bugs: the load-percentage tooltip wording on posts; Back on a
  post that reflowed after a font change can land a page off.

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
