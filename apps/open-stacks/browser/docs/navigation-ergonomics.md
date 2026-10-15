# Navigation ergonomics

How to browse a lot of material in the Stacks Browser with as few motions as possible, each as cheap as possible, while keeping it easy to dive in. The design targets an RSI-conscious reader on a split Colemak-DH keyboard such as the Glove80, with a mouse or trackpad alongside. Notes about browser behaviour assume Firefox on macOS.

This document merges 54 brainstormed ideas, from keyboard, pointer, lean-back and prior-art angles, into one ranked plan. Press counts come from a model session and are estimates. The "Keys you use most" list on `/stats.html`, plus the counters added in item 1, can check them. Paths are under `ui/js/`; new features go in `ui/js/features/`, with optional CSS in `ui/features/`.

## Where the presses go today

The model session is a 10-minute skim of 30-40 items. It costs about 150 actions on about 13 distinct keys:

| Action | Per 10 min (est.) | Keys today |
|---|---|---|
| Page turns | ~65 | `l` `h` `Space` `→` `←` |
| Item moves | ~40 | `j` `k` `↓` `↑`, wheel |
| Zoom in and out | ~15 | `z`/`Enter`, `Esc`, click a page |
| Best or random jumps | ~10 | `r` |
| Judgments | ~10 | `s` `x` `m` |
| Other actions and corrections | ~10 | `t` `g` `a` `n` `w` `i`, Shift chords |

On Colemak-DH, `j`, `l`, `h` and `k` are the four keys around the right index finger's home key: `j` and `l` on the top row, `k` and `h` on the bottom. So about 100 of the 150 presses are off-home reaches by one finger, and the commonest pair, `j` then `l`, is two presses in a row by the same finger. Meanwhile the best home-row keys (`n` `e` `i` `o` `t` `g`) hold rare actions: note, export, panel, open original, first page and the go-to-page prompt.

These dead ends are confirmed in the code:

- `Shift+Space` turns forward. The dispatcher in `chrome.js` looks up `e.key` (`' '`) and ignores Shift.
- Holding a key repeats it at the OS rate. There is no `e.repeat` check, so each repeat starts a render that the next repeat throws away (`state.gen`), and prefetch falls behind.
- `PageDown`, `PageUp`, `Home` and `End` do nothing in the feed. Only `features/webview.js` binds PageDown and PageUp, and only for live web views. Foot pedals and keyboard navigation layers send these keys, so they do nothing either.
- Going forward on the last spread only shows the toast "End · j for the next item" (`turn()` in `nav.js`). That is a wasted press, and the next press is a reach.
- `Esc` does nothing in the feed when nothing is zoomed.
- One trackpad fling can make several steps. After the first step (30 px), every further 320 px within 140 ms makes another (`onWheel` in `nav.js`), so a momentum tail skips items. Mouse notches less than 140 ms apart merge, so a fast spin makes too few steps.
- `onWheel` reads `deltaX` before `deltaMode`. Firefox then reports notched mouse wheels in pixels too (a compatibility behaviour), so the app cannot tell the mouse from the trackpad. This is likely but unverified; the debug overlay in item 5 can check it.
- The app ignores a pinch (`ctrl`+wheel), so Firefox zooms the whole page.
- A single click on a page zooms it (`feed.js`). Zoom is the rarer action; turning a page, the commoner one, needs a key.
- `s` saves but leaves you on the item, so saving usually takes `s` then `j`.

## Principles

1. **The same few verbs on every input.** Advance, Back, Skip, Dive, Surface, Keep and Jump mean the same thing on the keys, the wheel, the trackpad, clicks and pedals, and later in every view.
2. **Thumbs and the home row carry the frequent verbs.** Nothing frequent needs Shift or a held modifier. Holds live only on thumb keys, and each has a tap alternative.
3. **Any move can be undone with one press.** Back makes cheap, imprecise and automatic inputs safe to use freely.
4. **Skip the press entirely where possible.** Pressing forward should usually be enough: the app walks the pages, then the good pages, then the next item, and judgments move on by themselves.
5. **One stroke, one step.** A gesture never makes more than one move unless the reader asks for more by holding.

## 1. Ranked shortlist

The list is ranked by motions saved per unit of build effort and risk. Items 1-3 and 6 together come to about 200 lines and could ship as one change.

| # | Change | Effort | Saves per 10-min skim (est.) | Needs |
|---|---|---|---|---|
| 1 | Close the dead ends | S | 5-8 presses; pedals and nav layers start working | — |
| 2 | Back: one thumb key undoes any move or judgment | S | replaces `k` `h` `Esc` `t` with one key; ~15 presses move to a thumb | — |
| 3 | Continue: forward is always forward | S | 10-15 presses, and no choosing between `j` and `l` on ~100 more | 2 |
| 4 | Thumb and home-row keymap, with a leader for rare actions | S, then M | ~100 off-home reaches → 0; Shift chords → 0 | 3 |
| 5 | One stroke, one step on wheel and trackpad; pinch to dive | M | 6-10 corrections; 10-20 trips between keyboard and pointer; zoom keys on the trackpad | 2, 3 |
| 6 | Verbs that move on | S | 3-6 presses; long reads move to the tablet | 2 |
| 7 | Tap zones on the spread | S | while the hand is on the pointer, ~100 turns become taps that need no aim | 2, 3 |
| 8 | Tour stops: Advance walks the best pages | M | 10-25 presses per long item | 3 |
| 9 | Hold to riffle | M | 30-80 presses in scan-heavy sessions | 1, 2 |
| 10 | Conveyor: hands-off skimming at reading pace | M | ~150 → ~20-30 when only skimming | 2, 3, 8 |
| 11 | Learn from dwell | S | 4-5 `x`/`m` presses; fewer items to skip | — |
| 12 | Cull on the wall | M | about half the presses for the same items | 2 |

### 1. Close the dead ends (S, ~30 lines)

**What changes**
- `Shift+Space` goes back: one spread for now, and Back once item 2 lands.
- In the feed, `PageDown` is Advance, `PageUp` is Back, and `Home` and `End` go to the first and last spread.
- `Esc` opens the wall when nothing is zoomed. `wall.js` already focuses the current item's tile when you return to it, and `Esc` on the wall returns to the feed. So `Esc` means "up one level" everywhere: zoom → spread → wall.
- Key auto-repeat is ignored, so one press is one step. Item 9 gives holds a paced meaning.
- A pinch over the stage no longer zooms the whole app. Item 5 gives pinch a meaning.
- `overscroll-behavior-x: none` on `html`, so a sideways stroke can never trigger Firefox's swipe back or forward.
- Telemetry counts wheel steps and clicks per navigation type, not just keys, so before and after can be compared.

**Build**
- `util.js` `registerKey`: accept `{repeat: true}`. In the `chrome.js` dispatcher: `if (e.repeat && !b.repeat) { e.preventDefault(); return; }`.
- `nav.js`: the `' '` binding reads `e.shiftKey`. Add `K('PageDown', …)`, `K('PageUp', …)`, `K('Home', () => goPage(0))` and `K('End', …)`. `Escape` becomes `state.zoom ? toggleZoom(false) : setView('wall')`. In `onWheel`, replace the early return on `e.ctrlKey` with `preventDefault()` followed by a return.
- `style.css`: add the overscroll rule.
- `features/telemetry.js`: on `nav`, count `${type}:${input.k}`. The existing `input` already records `'wheel'`, `'mousedown'` or the key. Flush the counts with the `keys` batch, and have `stats.js` list them next to "Keys you use most".

**Risks** The first time, `Esc` going to the wall will surprise; say so in the keys overlay. The capture-phase `Esc` handlers in `export.js` and `textlayer.js` still run first, which is correct.

### 2. Back: one thumb key undoes any move or judgment (S, ~90 lines)

**What changes**
- `Backspace` (a thumb key on most split keyboards), `Shift+Space` and `PageUp` undo the last move of any kind and return to the exact place. Moves include a page turn, an item change, an `r` jump, an outline or key-point jump, zoom, a Continue step, a tour step, a conveyor step, a lane switch, and a whole riffle as one step.
- Judgments go on the same stack. Undoing `x` or `m` restores the learned preferences and the order exactly, and undoing a save removes it. A toast names what was undone, for example "Undone: less like this".
- Pressing again keeps going back, up to 100 steps.
- Going back in page order stays on its own keys (`n`, `h`, `←`), for reading backwards from where an item opened.

**Defaults** On. Backspace still edits text in the note, search and find boxes, because the dispatcher skips inputs.

**Build**
- `nav.js`: emit `nav:before` with a snapshot `{i, pos, s, hist, zoom}` at the top of `go`, `goPage`, `turn`, `randomSpot`, `toggleZoom` and the `flow:jump` handler. `toggleSave`, `lessLikeThis` and `moreLikeThis` add `{order: Int32Array.from(state.order), aff: structuredClone(state.aff), saved: [...state.saved]}` to their snapshot. In `chrome.js`, `setLane` adds `{lane, order}`.
- New `features/back.js` holds the stack, plus a `restoring` flag so that restores do not push new entries. To restore:
  1. If the snapshot has `order`, `aff` or `saved`, put them back and `store.set` them.
  2. Set `state.pos = state.order.indexOf(i)`, re-inserting the item after `pos` if it is missing.
  3. Set `state.start.set(i, s)`, `state.hist.set(i, hist)` and `state.zoom = zoom`.
  4. Call `showFeed()` and emit `nav {type: 'back'}`.
- Snapshot `state.aff` rather than subtracting the learned weights. `buildOrder` reshuffles the order, so only a snapshot restores it exactly.

**Risks** There are now two stacks, the per-item `state.hist` and this one, and they must agree; restoring `hist` from the snapshot keeps them in step. Undoing a judgment made long ago may surprise, which is why the toast names it.

### 3. Continue: forward is always forward (S, ~40 lines)

**What changes**
- **Advance** comes from `Space`, `PageDown`, the mouse wheel turned down, and the right tap zone. It shows the next spread. On the last spread it moves to the next item, at that item's opening page. When zoomed, it shows the next page.
- The forward page keys (`i` in the new preset, `l`, `→`) cross into the next item the same way. Skip (`e` or `j`) still means "next item now".
- **Fresh-press guard:** crossing into another item needs a fresh press or stroke. Key repeat, a riffle and a momentum tail stop at the last spread.
- The position line shows what Advance will do. On the last spread it reads `… · ▸ next: <title>`.
- Back exactly reverses Advance, so going one step too far costs one press.

**Build**
- `nav.js`: `turn(dir)` returns `true` when it moved and `false` at an edge, with no toast at the end.
- `nav.js`: a new exported `advance(e)`:
  1. Ask the stepper registry (below).
  2. Then `if (turn(1)) return;`.
  3. Then call `go(state.pos + 1)`, unless `e?.repeat` is set or this is the same wheel gesture that reached the end.
- `util.js`: `registerStepper(fn)`, where `fn(dir, e)` returns `true` when it handled the step. Tour stops (item 8) and the conveyor (item 10) plug in here.
- `feed.js` `paintPos`: add the preview when `s + c >= n`. Flow docs reach `paintPos` through `flow.js` with column counts; for them, the same test uses `live.n`.
- `state.wheel` gains a `'continue'` setting, in which the vertical wheel means Advance and Back. Item 5 makes it the mouse default.

**Risks** Moving on when you meant to stay; the guard and Back cover it.

### 4. Thumb and home-row keymap, with a leader for rare actions (S, then M)

**What changes**
- **Thumbs:** `Space` is Advance, `Backspace` is Back, and `Enter` is Dive. Dive zooms the page under the pointer if the pointer is over a page, and otherwise the first page.
- **Right-hand inverted T** (Colemak-DH preset; on QWERTY positions it is `i` above `j k l`): `u` previous item, `e` next item (Skip), `n` previous page, `i` next page. Vertical means items and horizontal means pages, the same axes as the trackpad. `m` stays as More like this (right index finger, home row).
- **The left home row already fits Colemak-DH** and stays as it is: `a` summarize, `r` Jump (best pages, then random), `s` Keep, `t` first page. `x` (Less) sits on the left ring finger, bottom row.
- `j`, `k`, `h`, `l` and the arrows keep working, so the QWERTY-vim map still works. Only `n`, `e` and `i` change meaning, and `u` is new.
- **Leader key.** The displaced actions (note on `n`, export on `e`, panel on `i`) and every Shift chord move behind a leader: press `g` (left index finger, home row) or a thumb key, then one more key. If no second key comes within 400 ms, an overlay shows the choices, drawn as the home and top rows of both halves.
  - Leader bindings: `g n` note · `g e` add the spread to the export tray · `g t` open the tray · `g i` panel · `g o` move the panel to the other side · `g f` find · `g q` quote · `g v` read aloud (again: stop) · `g ,` / `g .` reading rate · `g a` regenerate summary · `g h` arXiv HTML · `g l` live web page · `g r` figure river · `g m` crop margins · `g g` go to page.
  - Single keys that are not displaced (`q`, `v`, `c`, `p`, `F`…) keep working directly.
- **F16-F19** are bound by default to Advance, Back, Skip and the leader. A keyboard layer or mouse software can send them without colliding with typing. Avoid F13-F15, which macOS may use for screen brightness.
- **Suggested Glove80 layer** (documentation only): a "Stacks" layer, toggled on and off with a thumb tap.
  - Advance goes on both thumbs, so the reader can alternate thumbs and halve the presses per digit.
  - Back and Skip go on the other thumb keys, and the inverted T on the home row.
  - The layer also sends arrows, PageUp and PageDown, so it works in other readers too.
  - Never make Space, Enter or Backspace a hold-for-layer key: riffle needs their holds.

**Build**
- **Stage 1 (S, ~80 lines):** new `features/keymap.js`.
  - Apply the preset on `boot`, after every module has registered its keys, so later `keymap.set` calls cannot overwrite it.
  - If `store('preset') === 'colemak-dh'`, move the old `n`, `e` and `i` entries into a leader table. Then bind `n`, `e`, `i` and `u` to `turn(-1)`, `go(state.pos + 1)`, page forward and `go(state.pos - 1)`. Bind F16-F19.
  - The leader is a small armed state in the `chrome.js` dispatcher. It times out after 1.5 s and shows the overlay after 400 ms. `Esc` cancels it without unzooming.
  - On the wall, its own `g` (contact sheets) becomes `g s`.
  - A preset picker goes in the `?` overlay.
  - Match on `e.key`, not `e.code`. `e.code` gives the QWERTY position when Colemak-DH is a macOS input source, but not when the layout lives in keyboard firmware.
- **Stage 2 (M, ~250 lines):**
  - Named actions: `registerAction(id, fn, {label, view, hold})`, with `registerKey` kept as a wrapper.
  - User overrides kept in `store`.
  - A press-to-bind and calibrate flow.
  - Per-view action handlers, so Advance, Back, Dive and Keep mean the same on the wall, in the figure river and in live web views. These replace the private capture-phase key maps in `wall.js`, `figures.js` and `webview.js`.

**Risks** If the keyboard uses home-row mods, fast rolls over `n e i` can fire modifiers by mistake; in that case, put navigation on the F-key layer. Some readers expect "up" under the ring finger, as in the Miryoku arrows on `m n e i`, so offer that variant too.

### 5. One stroke, one step on wheel and trackpad; pinch to dive (M, ~150 lines)

**What changes**
- **Axis lock:** the first ~12 px of a gesture decide whether it is horizontal or vertical (a 2:1 ratio). The other axis is ignored until the gesture ends.
- **Trackpad:** one step per stroke, made once the stroke passes ~40 px; the momentum tail is ignored. A new stroke starts after a gap of more than 120 ms, or when the deltas rise again after decaying (the mean of the last 3 is more than 1.4× the mean of the 3 before). Vertical strokes move between items and horizontal strokes turn pages.
- **Mouse:**
  - One notch is one step. Fast spins are queued and capped at about 6 steps a second.
  - The wheel is Continue: down is Advance and up is Back. A mouse with a single wheel reads straight through the session with no mode switching.
  - The thumb buttons, mapped in the mouse's own software to F17 and F18, are Back (on the "back" button) and Skip.
- **Middle-click** on a page dives into that page. It no longer swaps wheel modes; the wheel button in the top bar sets the map for each device.
- **Pinch.** Firefox delivers a pinch as `ctrl`+wheel, which `preventDefault` can stop. Each pinch commits once:
  - pinch out over a page to dive into that page;
  - pinch in to go up a level (zoom → spread → wall);
  - pinch out over a wall tile to open it.
- A chevron at the pointer for 150 ms confirms each step.

**Build**
- New core module `gesture.js`, shared by `nav.js` and `wall.js`.
  - Each gesture moves through the states idle → active → tail and carries an axis and a device.
  - Read `e.deltaMode` before any delta, so that Firefox reports line mode for notched wheels. Pixel deltas that are fractional and arrive every 8-16 ms come from a trackpad.
  - Emits `gesture:step {axis, device, dir}` and `gesture:pinch {dir, x, y}`.
- `nav.js`:
  - `onWheel` becomes a consumer of these events.
  - `state.wheel` splits into `state.wheelPad` (`'2d'`) and `state.wheelMouse` (`'continue'`).
  - The existing middle-click handler calls Dive with the `.pg` under the pointer (`dataset.k`).
- `wall.js`: a pinch out over a tile calls `openAt(T)`. Keep the exclusions for `#scrub`, `#panel` and `.fn-pop`.
- A `?wheel=debug` overlay plots the deltas of each event, so the thresholds can be tuned on the real devices and stored per device.

**Risks**
- The thresholds depend on macOS scroll settings; tune them with the overlay.
- A slow, deliberate scroll makes one step by design. Seeking far belongs to riffle and the page strip.
- Two very fast strokes can merge into one step. A missed step is visible and cheaper to fix than an overshoot.
- Without mouse software, Firefox navigates history on the thumb buttons. A history-sentinel trick can catch those presses: `pushState` around the current entry and read each `popstate` as a button. It is a fallback, not the default.

### 6. Verbs that move on (S, ~25 lines)

**What changes**
- `s` saves and moves to the next item; `S` saves and stays. The toast reads "Saved · ⌫ to return". `x` and `m` already move on.
- `y` ("yank to tablet") adds the item's key pages to the export tray and moves on. The key pages are the summary's key-point pages, else the enrichment best pages, else the spread on screen. The tray goes to the reMarkable in one send from `E` (or `g t`), so long reads happen on the tablet instead of as dozens of page turns.

**Defaults** Save-and-move-on is a setting, on by default. When you saved something to read it now, Back returns you to it.

**Build**
- `nav.js` `toggleSave`: when adding and `store.get('saveMoves', true)` is set, call `go(state.pos + 1)`. Register `S`.
- `features/export.js`: export a function that builds tray entries for given pages, as `spreadEntries` already does for the spread on screen, and pass them to `addPages`. Register `y` in that module.
- Sending whole items needs a small server route that copies the cached original into the export folder and runs `rmapi put`. Leave that for later, and cap its size: Internet Archive scans can be hundreds of MB.

### 7. Tap zones on the spread (S, ~70 lines)

**What changes**
- A plain click or tap on the stage turns: the right two-thirds is Advance and the left third is Back. A plain click moves less than 5 px, lasts under 350 ms, happens with no text selected and without Alt (Alt+click starts read-aloud at a word), and does not land on a link, button, footnote popup, the panel or the page strip.
- When zoomed, only the margins outside the page react, so reading and selecting are untouched.
- Zooming moves off the single click to `Enter` (the page under the pointer), middle-click and pinch.
- For the first few sessions, a faint chevron shows the boundary between the zones on hover. Settings: on or off, and swap the zones.

**Build**
- New `features/tapzones.js`: listen for `pointerdown` and `pointerup` on `#stage`. On `pointerup`, check `getSelection().isCollapsed`, `e.altKey` and `closest('a, button, .fn-pop, #scrub, #panel')`.
- Ignore taps for 250 ms after any `gesture:step`.
- `feed.js`: remove the zoom from the page `onclick`, or keep it when the zones are off.

**Risks**
- A resting thumb with tap-to-click turns a page; Back fixes it.
- Double-clicking a word to select it stops working in spread view; selecting by dragging still works.
- Word spans in the text layer (`.tl`) take clicks, so the selection test has to run on `pointerup`.

### 8. Tour stops: Advance walks the best pages (M, ~120 lines)

**What changes**
- On long raster items (more than about 5 spreads) that have best pages or a summary, Advance goes to the next **stop** instead of the next spread.
  - The stops are the opening spread, then the pages the summary marks (key points, best chapters, "steal" pages and the best page), then the enrichment best pages. They are sorted, and merged when they share a spread.
  - After the last stop, Advance goes to the next item.
- On arrival, the key point's quote lights up, as when you click it in the panel. The head shows `stop 3/5 · p. 88` and a bar of dots, one per stop.
- The first page turn in order, or a Dive, switches that item to **read** mode, and the bar becomes a line. Advance then turns pages in order to the end. Back walks back one stop at a time.
- Posts and short items stay sequential. `r` keeps its meaning: best pages first, then random spots.
- When the item's summary already exists as the item is shown, the item opens at its best page. Background summaries already cover the next two items.

**Build**
- New `features/tour.js` and `ui/features/tour.css`.
- Take the stops from `state.marks.get(it.id)` (1-based pages, already computed by `pagesOf` in `summary.js`), from `it.best` and from `startOf(i)`. Clamp them to `n - state.per`.
- Register a stepper (item 3).
- Move with `state.start.set` and `showFeed()`, not `goPage`, which clears the turn history. Emit `nav {type: 'tour'}` so that Back records the step.
- Recompute the stops on `summary:updated` and `item:shown`. Once the first stop has been shown, only add new stops further ahead.
- Export the key-point highlight (`findSpan` and `highlight('quote')`) from `summary.js`.
- `prefetch.js` `startOf`: for items not yet shown, prefer `summaries.get(it.id)?.best_page`.

**Risks** Summaries arrive about 5 s after you reach an item, so the tour can appear partway through it; show `stop n/m` only once stops exist. Key-point pages can be wrong; the quote check already flags those.

### 9. Hold to riffle (M, ~130 lines)

**What changes**
- A tap on Advance or Back is one step. Holding for more than 300 ms riffles through the item, like thumbing the pages of a book.
  - The pace starts at 4 spreads a second and rises to 12 over 2 s.
  - Low-resolution frames are shown, with a large page number and the current outline heading over them.
- Releasing stops the riffle and renders the pages sharp. It lands on the spread that was showing about 150 ms before release, to allow for reaction time. Back returns to where the riffle started. A riffle stops at the end of the item.
- Holds belong on thumb keys. If the thumb key is a hold-tap on the keyboard, a double tap starts the riffle instead, and any key stops it.

**Build**
- New `features/riffle.js`, with capture-phase `keydown` and `keyup` listeners for the Advance and Back keys while the feed shows. Item 1 already keeps taps from repeating.
- Frames:
  - scans: `scanUrl(it, k, 400)`. The prefetch `mid` band already loads pages s-10 … s+40 at 400 px.
  - PDFs: a low-scale `page.render`, which needs a small low-resolution path in `render.js`.
  - posts: a CSS transform of the column strip.
- Draw into one overlay canvas over `#spread`, and never step faster than frames decode.
- Push to `state.turns`, so that `velocity()` prefetches further ahead.
- Stop on `blur` and `visibilitychange`.

**Risks** The threshold between a tap and a hold needs tuning. Under `prefers-reduced-motion`, cap the frame rate.

### 10. Conveyor: hands-off skimming at reading pace (M, ~150 lines)

**What changes**
- `d`, or a play button in the top bar, starts and stops the conveyor. It calls Advance by itself, so it follows the tour stops. After at most 3 stops (a setting) it moves to the next item.
- **Pace:**
  - The timer starts only once the spread has rendered (`spread:rendered`), so slow loads never eat reading time.
  - Each spread stays up for the number of words on screen divided by a skim rate, clamped to 3-20 s. Spreads with no text layer get 6 s.
  - A 2 px line along the page strip fills up toward the next step.
- **Holding costs nothing.** Any of these holds the conveyor on the current item:
  - a wheel stroke, a click, or any key other than Advance, Back and Keep;
  - moving the pointer more than 30 px within 300 ms over a page;
  - a text selection, a focused input or a hidden tab;
  - read-aloud playing.

  Moving to another item resumes it.
- **It calibrates itself.** Back within 3 s of an automatic step goes back and slows the pace by 8%. Advance before the timer runs out speeds it up by 4%. The pace is kept per kind of item: paper, post or scan.
- **Presence check:** after 3 minutes with no input, it pauses on a "Still reading? Space" card.
- **Stage 2 (opt-in): it follows the summary's verdict.**
  - An item with a `skip` verdict passes in 1.5 s with a ticker; Back brings it back.
  - A `read` or `study` verdict stops on a decision card: Space keeps going, `s` saves, and `e` moves on.

**Build**
- New `features/conveyor.js` and `ui/features/conveyor.css`.
- Words on screen come from `currentWords()` in `text.js`.
- Listen to `spread:rendered`, `nav`, `view:changed`, `visibilitychange`, `selectionchange` and pointer moves on `#stage .pg`.
- Keep the rate in `store('skimRate')`.
- While the conveyor runs, limit summaries, so that passing 30 items does not buy 30 of them:
  - `summary.js` runs its automatic 5 s summary only for items that were held, or stayed on for 10 s;
  - background summaries are off, or use a cheap model.

**Risks** A moving belt can feel like pressure, so default to slow, pause on any touch, and show the state clearly. The verdict prompt in `server/routes/30-summarize.mjs` is written for research reading, so check verdicts in lanes like TTRPG manuals before stage 2 skips on them.

### 11. Learn from dwell (S, ~40 lines)

**What changes** Leaving an item ranks it:
- **A small "more like this" (+0.25, against `m`'s 0.7)** when you stayed more than twice the lane's median time, turned 3 or more pages, or zoomed, quoted or wrote a note.
- **A small "less like this" (−0.1, against `x`'s −1)** when you left within 2 s, with no turn, by an explicit Skip.
- **Nothing** when the conveyor passed the item.

A line in the panel's "Why" section shows what was learned, with an off switch.

**Build** New `features/implicit.js`. On `item:shown`, it scores the previous item from its own dwell timer and from `nav` events. It then calls `learn(it, w)` from `state.js`, followed by `buildOrder(true)`, which keeps the head of the order in place. Cap the weight per lane per session.

**Risks** Skipping something already known reads as dislike, so keep the weights small. Ignore time while the tab is hidden, and cap dwell at 2 minutes.

### 12. Cull on the wall (M, ~100 lines)

**What changes** On the wall (`w` or `Esc`), the verbs act on the focused tile, or on the hovered tile if the pointer moved more recently:
- `s` keeps the tile;
- `x` fades it, and the gap closes on the next scroll so tiles never move under the pointer;
- `m` adds related tiles beside it;
- `y` sends its key pages to the export tray;
- `Enter`, or a pinch out, opens it.

A "Keepers" button then opens the feed with only this pass's keepers, in order, ready for Continue or the conveyor.

**Saves** Judging 30 items in the feed costs ~100 presses. A large monitor shows 20-40 tiles at once, so dropping 20 items costs ~20 presses and reading the 10 keepers about 35.

**Build**
- `wall.js`: add `s`, `x`, `m` and `y` to the capture-phase `KEYS`, and track the hovered tile on `pointerenter`.
- `nav.js`: let `toggleSave`, `lessLikeThis` and `moreLikeThis` take an item index, defaulting to `current()`.
- The Keepers button sets a temporary `state.order` and calls `setView('feed')`.

**Risks** Keys aimed by hover can hit the wrong tile, so draw a clear ring around the target.

## 2. Proposed default controls

This assumes a split Colemak-DH keyboard with Space, Backspace and Enter on thumb keys. The current bindings stay available.

| Action | Today | Keyboard (proposed) | Mouse | Trackpad |
|---|---|---|---|---|
| Advance: next spread, then next stop, then next item | `Space` `l` `→` (stop at the end of an item) | `Space` (thumb), `PageDown`, F16 | wheel down, one step per notch; click the right ⅔ | tap the right ⅔ |
| Back: undo the last move or judgment | no single key (`k` `h` `Esc` `t` each cover one case) | `Backspace` (thumb), `Shift+Space`, `PageUp`, F17 | wheel up; click the left ⅓; thumb "back" button | tap the left ⅓ |
| Next / previous page | `l` / `h`, Shift+wheel | `i` / `n` (`l`, `h` and the arrows still work) | — | horizontal stroke, one page per stroke |
| Next / previous item (Skip) | `j` / `k`, wheel | `e` / `u` (`j` and `k` still work), F18 | thumb "forward" button = Skip | vertical stroke, one item per stroke |
| Dive (zoom) | `z` / `Enter`, click a page | `Enter` (thumb): the page under the pointer | middle-click a page | pinch out |
| Surface: zoom → spread → wall | `Esc` (zoom only), `w` | `Esc` | — | pinch in |
| Jump: best pages, then random | `r` | `r` (left ring finger, home row) | — | — |
| Keep | `s` (stays) | `s` saves and moves on; `S` saves and stays | — | — |
| Less / more like this (both move on) | `x` / `m` | `x` / `m` | — | — |
| Send key pages to the reMarkable tray and move on | `e` adds the spread | `y` | — | — |
| Riffle | holding a key repeats at the OS rate | hold `Space` or `Backspace` for more than 300 ms | — | — |
| Conveyor | — | `d` toggles it; any touch holds it | play button | play button |
| Rare actions (note, export, panel, find, read aloud, web modes, figures, crop…) | `n` `e` `i` plus 14 Shift chords | `g` then a key (overlay after 0.4 s), or F19 | — | — |
| Wheel map | middle-click or `W` swaps items and pages | set per device; no swapping | wheel = Continue | vertical = items, horizontal = pages |
| Foot pedal (optional) | does nothing | `PageDown` / `PageUp` = Advance / Back | — | — |

The core to learn is **Space, Backspace, Enter and Esc**, on or near the thumbs, plus **e** (Skip), **r** (Jump) and **s** (Keep) on the home row. That is 7 keys instead of about 13, with no off-home reaches and no Shift chords in a normal session.

Estimated cost of a 10-minute skim:

| Stage | Actions | Off-home reaches | Distinct keys |
|---|---|---|---|
| Today | ~150 | ~100 | ~13, with 3-5 Shift chords |
| After items 1-4 | ~130 | ~0 | ~7, no Shift chords |
| After items 1-11, in a scan-heavy lane | ~90-110 | ~0 | ~7 |
| Conveyor on, skimming only | ~20-30 | ~0 | ~4 |

## 3. What not to do

- **No holds on home-row letters.** Home-row-mod firmware turns held letters into modifiers, and a sustained hold is static muscle load. Holds go on thumb keys, and each has a tap alternative.
- **No frequent verb behind Shift, Cmd or a command palette.** A palette (Cmd+K) is fine later for finding rare actions, never as the way to common ones.
- **No item change from momentum, key repeat or a riffle**, and no multi-step trackpad flings.
- **No binding by `e.code`.** `e.code` gives the QWERTY position under a macOS Colemak input source, but not when the layout lives in keyboard firmware. Bind by `e.key`, with a calibrate flow for anything else.
- **No removing the current map.** `j k h l`, the arrows and the existing letters stay; presets add to them.
- **No dwell-to-act by default**, meaning parking the pointer to turn or click: a parked pointer would fire it. The conveyor gives the same hands-off reading with an explicit start and stop.
- **No automatic skipping on AI verdicts by default.** Skips stay visible and one Back away, and verdicts need checking per lane first.
- **No ranking from passive time, and no summaries for it.** The conveyor passing an item, or a riffle, is not a sign of interest, and neither should trigger a summary.
- **No new mode without a visible indicator**, an off switch, and Back to undo what it did.
- **No Space, Enter or Backspace as a hold-for-layer key on the keyboard**, and no F13-F15 for app bindings (macOS may use them for brightness).
- **No phone or tablet remote yet.** The server listens on loopback only. `--host 0.0.0.0` opens every route to the local network without any login, including the proxy, notes and paid summaries. A remote needs a token first.
- **No continuous vertical "dive mode" for now.** It is a large change, because every feature assumes a single spread, and items 3, 8 and 9 cover most of what it would offer.

## Deferred

These ideas from the brainstorm were merged or left out of the shortlist:

- A progressive pinch with a half-pinch peek, and horizontal strokes that flip a wall tile's pages.
- Home-row hint labels (Vimium-style) for the panel, the page strip and the wall. Also home-row seek: `g` then one of `a r s t g m n e i o` jumps to 0%, 10% … 90% of the item. Tours and riffle cover most of this first.
- A right-click marking menu for the verbs while the hand is on the pointer. With `a r s t x` already on the left home row, it matters less.
- The page strip as a map of the whole item that previews pages on hover; a panel that slides in from the left edge with an "Up next" rail.
- Triage ahead: cheap-model verdicts 20 items out, with a "Skipped" tray. Worth it once the conveyor has proved itself.
- Radio: spoken summaries of each item as a way to navigate, with read-aloud to dive in.
- A tablet remote at `/remote`, once the server has a token (it listens only on localhost by default).
- A pedal scheme with tap, double tap and hold.
- A macOS Voice Control command pack, and BetterTouchTool presets as experiments that need no code.
- Energy-budget sessions (a time budget with a rest card), and a lean-back mode where any key on one half of the keyboard advances.
- A per-finger heat map in `/stats.html`.

## 4. Open questions

1. **Keyboard firmware:** does the keyboard use home-row mods, or hold-taps on Space, Enter or Backspace? And which thumb keys send those three? The answer decides whether riffle can live on Space, and whether the F16-F19 layer should be the main route.
2. **Pointer hand:** while browsing, which hand rests on the pointer, and is it mostly on the mouse or the trackpad? The answer sets the default wheel map and which side the tap zones favour. It also decides whether the right-hand inverted T or the pointer carries most of the navigation.
3. **How hands-off:** would a self-pacing conveyor feel restful or pushy, and is a two-pedal foot switch (about $70-100 as of October 2026) worth trying? These are the only two changes that cut the number of actions by around 80%; every other change makes each action cheaper.
