# Stacks Browser architecture

How the pieces fit, for anyone adding a feature. The README covers running and using it.

## Server (`server.mjs`, `server/`)

- `server/config.mjs` exports `HERE`, `PORT` (`--port N` or `STACKS_PORT`), `CACHE` (`STACKS_CACHE`, default `~/.cache/open-stacks`), `MODEL` (`STACKS_MODEL`), `UA` and `hasKey()`.
- `server/cache.mjs` is the disk cache for open sources: `allowed(url)`, `cached(url)`, `ensure(url)` (fetch once into the cache), `meta(url)`, `read(url)`, `paths(url)`, `key(str)` (sha1), `enqueue(urls, pri, group)` (the prefetch queue) and `stats`.
- `server/routes/*.mjs` load in name order. Each exports `default function (app)`; `app` has:
  - `route(method, pathOrRegExp, async (req, res, url, match) => {})`, where method is `'GET'`, `'POST'` or `'*'`;
  - `status(() => ({...}))` to add fields to `GET /status`;
  - `onStart(fn)` to run after the server starts listening;
  - helpers `json(res, obj, code)`, `send(res, code, body, type)` and `body(req)` (parsed JSON);
  - `cache`, `CACHE`, `HERE`, `MODEL`, `UA` and `hasKey`.
- Static files come from `ui/`. `/corpus.json` and `/enrich.json` (optional) come from the browser folder. `/features.json` lists `ui/js/features/*.js` and `ui/features/*.css`.

## Client (`ui/js/`)

`main.js` imports the core modules, then every feature module listed in `/features.json`, then calls `boot()`. A feature is one file in `ui/js/features/` plus, optionally, one stylesheet in `ui/features/`. Prefer adding a feature over editing core files.

| Module | Holds |
|---|---|
| `util.js` | `h()`, `$()`, `P(url)` (the proxy URL), `store`, `lru`, `fmtDate`, `toast`, `css()`, and the hooks below. `toast(text, ms?, {icon, sub, kind, fill})` is the HUD notice, low on the stage, one at a time: a big icon (a name from `hud-icons.js`, `'a+b'` for two), a short main line (2-5 words), an optional second line; `kind` is `mode`, `ok`, `edge`, `bad` or `busy`; `fill` (0-1) is the pull to the next item |
| `corpus.js` | `items` (merged with `enrich.json`), `LANES`, `COUNTS`, `LANE_WEIGHTS`, `LANE_COLORS`, `byId`, `tokens`, `related(i)` |
| `state.js` | `state` (view, lane, order, pos, `start` (Map item → page or column), `hist` (turn history), `per`, `zoom`, `crop`, `cols`, `font`, `panel`, `wheelMouse` / `wheelPad` / `wheelDevice` (the wheel map per device), `marks`, `status`, …), `current()`, `buildOrder`, `learn` |
| `docs.js` | `openDoc(it)`: scan → `{n}`, pdf → `{n, pdf}` (a pdf.js document), html/web/text → a *flow* doc `{flow: true, html, n, texts, outline}`; `isFlow(it)`, `scanUrl`, `pdfjs()`, `extractors` (per kind), `prepareFlow`, `pdfOutline` |
| `render.js` | `renderPage(it, k)` → panels `[{canvas, k, box, srcW, srcH, part?, pdfScale?}]` or `[{blank: true, k}]`; `box` is the crop in fractions of the source page |
| `flow.js` | live column layout of flow docs: `live` (`{flow, port, sheet, g: {cols, colw, gap, pitch, font}, n: columns, first/running: column → stable page, vpCol}`), `flowRange(s)`, `vpToCol(vp)`, `elToCol(el)` |
| `feed.js` | `showFeed()`, `paintHead`, `paintPos`, `paintScrub`, `layoutPanels` |
| `nav.js` | `go`, `jumpTo`, `goPage(k)`, `turn(dir)` (true if it moved), `advance(e)` and `back(e)` (the Advance and Back verbs), `forward(e)` (page forward, then the next item on a fresh press; nothing while the item is still opening), `before(label, extra)` (emits `nav:before`), `randomSpot`, `toggleZoom(on, k)`, the wheel map, and most keys |
| `gesture.js` | wheel and trackpad gestures: `attachWheel(el, {steps, pinch})` turns each notch or stroke into one `gesture:step`, and each pinch into one `gesture:pinch`; tells a notched mouse from a trackpad per gesture; `tune` (thresholds; `?wheel=debug` plots the events) |
| `prefetch.js` | `planAround`, `startOf(i)` (uses `it.best`), `serverPrefetch`, `velocity`, `reopeners` (hooks `fn(i, it)` → where an item not yet placed this session reopens, in `state.start` units; `features/memory.js` uses it) |
| `panel.js` | the side panel and the built-in sections (why, outline, related, today) |
| `summary.js` | the summary section, `summarizeItem`, `extractText` |
| `notes.js` | the note section, `appendQuote(it, text, page)` |
| `text.js` | words on screen: `registerTextSource`, `currentWords()`, `highlight(name, words)`, `reveal(word)` |
| `wall.js`, `search.js`, `chrome.js` | the wall view, search, and the top bar, keys overlay, key dispatcher and status line |
| `features/settings.js` | the Settings sheet (⌘, / Ctrl+,). Core options keep their own state fields and store keys; the rest live in store `settings` and act through CSS custom properties on `:root` (`--bg`… `--paper*`, `--flow-*`, `--page-gap`, `--panel-w`; `ui/features/settings.css` reads them), `data-st-*` attributes and `st-hide-*` classes on `<html>`, and `state.measure` (column width in em, `flow.js`), `state.cropPad` (`render.js`), `state.pageGap` and `state.fit` (`feed.js`). Emits `settings:changed {key, value}`. The daily AI budget is set through `server/routes/85-settings.mjs` |

### Hooks (`util.js`)

- `on(name, fn)` and `emit(name, detail)` drive an event bus. The events are:
  - `item:shown {i, it}`;
  - `spread:rendered {i, it, s, els, doc, flow?}`; for rasters, `els[j]._pnl` is the panel and `els[j].dataset.k` the page;
  - `summary:updated {id, summary}`;
  - `nav {type, i, it, ...}`; types: `item`, `turn`, `page`, `random`, `zoom`, `back`;
  - `nav:before {label, i, pos, s, hist, zoom, order?, aff?, saved?, lane?}`, where you were just before a move or judgment (`features/back.js` keeps them for Back);
  - `gesture:step {axis, dir, device, fresh}` and `gesture:pinch {dir, x, y}` (`gesture.js`); a step listener sets `stop` to end the gesture;
  - `view:changed {view}`;
  - `panel:painted`, `status`, `boot` and `flow:jump`;
  - `memory:updated {id}` (`features/memory.js`, which also exports `progressOf(id)` → `{seen, n, frac, far, at, done, ms, visits, …}` or null).
- `registerKey(keys, fn, {help: [label, text], view: 'feed' | null, order, repeat})`. The keys overlay is generated from these help entries. Key auto-repeat is ignored unless `repeat: true`.
- `registerStepper(fn, order)`: `fn(dir, e)` returns true when it handled an Advance (`dir` 1) or Back (`dir` -1) step. `features/back.js` answers Back from its undo stack; otherwise Advance turns the page and then moves to the next item, and Back turns back.
- `registerSection({id, title, order, render(it, i) → Node | null})` adds a side-panel section, rendered as `#sec-<id>`. Built-in orders: why 10, summary 20, outline 30, note 40, related 50, today 60.
- `registerView(name, {label, key, order, roots: () => [elements], show(), hide()})` adds a top-level view. Create its root element inside `#main`. Feed and Wall are views too.
- `registerTextSource(async ({i, it}) → {words, start} | null)` (`text.js`). A word is `{text, page, range?, el?}`.

### Units

- **Raster items (scan, pdf):** page `k` is 0-based. `state.start` holds the first page shown.
- **Flow items:** `state.start` holds a *column*. Stable pages (`data-vp` on blocks, about 280 words each) are what summaries cite, the strip shows and `goPage(k)` takes.

## Data

- `build-corpus.mjs` writes `corpus.json` from the LessWrong/Alignment Forum APIs, `data/lanes/*.json` (curated lane files) and `seeds.json`.
- `enrich.json` (optional) adds per-item `rel` (0–1 relevance), `hook` (one line) and `best` (0-based best pages).
- The library tree (built at the end of `build-corpus.mjs`; `--tree-only` redoes just this): every item has `path` (folder names under its lane, outermost first) and `ord` (its place in the lane's tree order, depth-first, so it also orders items within a folder). The QURI wikis follow each site's own Starlight sidebar; the other lanes get topic, year or era folders. `laneOrdered` (`corpus.js` `LANE_ORDERED`) names the lanes whose order matters; `buildOrder` follows `ord` there, and narrows the feed to `state.scope` (a Set of item indexes) while `features/library.js` browses one folder.
