# Stacks Browser — instructions for coding agents

A local web app for reading open books, papers, posts and wikis fast: a Node
server (no framework, `server.mjs` + `server/`) and a browser client of plain
ES modules (`ui/`, no build step). The README says how to run and use it,
ARCHITECTURE.md how the pieces fit, STATUS.md what is finished and what is
not. Read ARCHITECTURE.md before adding anything.

## Where things go

- A client feature is one file in `ui/js/features/` (plus, optionally, one
  stylesheet in `ui/features/`), found through `/features.json`. Prefer a
  feature and the hooks in `ui/js/util.js` over editing core modules.
- A server feature is one file in `server/routes/NN-name.mjs`, loaded in
  name order; logic that tests import lives beside it in `server/*.mjs`.
- Every `STACKS_*` setting is read in the module that owns it and described
  in the README, ARCHITECTURE.md or STATUS.md § Settings. Design notes go
  in `docs/<topic>/`.
- Data the app ships: `seeds.json` → `node build-corpus.mjs` → `corpus.json`;
  `data/tags.json` (`node tag-corpus.mjs`). Everything a reader does (cache,
  notes, memory, summaries, profiles, Local-folder metadata) lives in
  `$STACKS_CACHE` (default `~/.cache/open-stacks`), never in the repository.

## Rules

- **Open, legal sources only.** Publisher, author, arXiv, Internet Archive
  public-domain scans, openly licensed rulebooks. Never a shadow library,
  never a way around a paywall. `server/cache.mjs` `allowed()` is the
  allowlist; adding a host means checking its terms.
- **Nothing private in the repository.** The Local lane reads the reader's
  own folders in place; no file from them, no title, path or count, goes
  into code, tests, fixtures, docs or commit messages. Tests use
  `test/local-fixtures.mjs`. Agent job files (`jobs/open/*.md`) are public:
  they may name corpus items and pages, never reading history.
- **A test server never writes into the repository.** Start one with
  `STACKS_CACHE=<scratch> STACKS_JOBS_DIR=<scratch> node server.mjs --port N`;
  without `STACKS_JOBS_DIR` a server files jobs into `jobs/open/`.
- **Speed is the product.** A change on the reading path (`feed.js`,
  `render.js`, `prefetch.js`, `docs.js`, `riffle.js`) is checked against the
  numbers in README § Why it is fast; no layout reads in hot loops, no work
  for items the reader only passes.
- **The reader uses Firefox on macOS** (a 14-inch MacBook Pro and a 32-inch
  4K screen). Test layouts at 1512 × 982 and 2560 × 1440; macOS-only
  helpers (Quartz, `textutil`, Spotlight) are fine with a fallback.
- Keys are registered with `registerKey` (`util.js`) so `?` lists them;
  check `grep -rn "registerKey('X'"` before taking one.

## Checks

```bash
node --test test/*.test.mjs                # server and core logic
for f in ui/js/*.js ui/js/features/*.js; do node --check "$f"; done
node test/local-ui.mjs                     # Playwright scripts (*-ui.mjs) drive a real browser
```

Playwright runs against a test server as above. Screenshots go to a scratch
folder, never the repository.
