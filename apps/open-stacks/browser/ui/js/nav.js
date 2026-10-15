// Moving around: items (j/k), pages (h/l), Advance and Back, jumps, zoom, the
// mouse wheel and the trackpad (docs/navigation-ergonomics.md, items 1-3 and 5).
import { $, h, css, store, emit, on, registerKey, steppers, toast } from './util.js';
import { items, related } from './corpus.js';
import { state, current, buildOrder, learn } from './state.js';
import { isFlow } from './docs.js';
import { startOf, randomTarget } from './prefetch.js';
import { showFeed, paintHead } from './feed.js';
import { live, vpToCol, elToCol } from './flow.js';
import { setView, paintSaved } from './chrome.js';
import { attachWheel } from './gesture.js';

/** Say where we are just before a move or judgment, so that Back (features/back.js) can return here exactly. */
export function before(label, extra) {
  const i = current(); if (i == null) return;
  emit('nav:before', { label, i, pos: state.pos, s: state.start.get(i), hist: [...(state.hist.get(i) || [])], zoom: state.zoom, ...extra });
}
const judged = () => ({ order: state.order.slice(), aff: structuredClone(state.aff), saved: state.saved.slice() });

export function go(pos) {
  const p = Math.max(0, Math.min(pos, state.order.length - 1));
  if (p === state.pos && state.view === 'feed') return false;
  if (p !== state.pos) before(p > state.pos ? 'next item' : 'previous item');
  state.pos = p; state.zoom = false; showFeed();
  emit('nav', { type: 'item', i: current(), it: items[current()] });
  return true;
}
/** Open item j. In a fixed sort (topic, newest, oldest: stack.js) an item already in the
 *  order opens in its place, so j/k go on in the order the Library shows; otherwise it comes next. */
export function jumpTo(j) {
  const at = state.sort && state.sort !== 'ranked' ? state.order.indexOf(j) : -1;
  if (at >= 0) { if (at !== state.pos || state.view !== 'feed') { before('open item'); setView('feed'); go(at); } return; }
  before('open item', { order: state.order.slice() }); state.order.splice(state.pos + 1, 0, j); setView('feed'); go(state.pos + 1);
}

const flowHere = (it) => isFlow(it) && live?.id === it.id;
/** The item's extent is known (a raster's page count, a flow document's columns), or it could not open. */
const ready = (it) => !!it && (!!it.err || (isFlow(it) ? live?.id === it.id : !!it.n));
/** Jump to a page (for flow documents, a stable page). Clears the turn history. */
export function goPage(k) {
  const i = current(); const it = items[i];
  before('go to page');
  state.hist.set(i, []);
  state.start.set(i, flowHere(it) ? vpToCol(k) : Math.max(0, k));
  showFeed();
  emit('nav', { type: 'page', i, it, k });
}
/** End: the last spread. */
function goEnd() {
  const i = current(); if (i == null) return;
  const it = items[i]; if (!ready(it)) return; // still opening: the end is not known
  const flow = flowHere(it);
  const s = flow ? Math.max(0, live.n - live.g.cols) : Math.max(0, (it.n || 1) - (state.zoom ? 1 : state.per));
  before('last spread');
  state.hist.set(i, []); state.start.set(i, s); showFeed();
  emit('nav', { type: 'page', i, it, k: flow ? live.first[s] ?? live.running[s] ?? 0 : s });
}
on('flow:jump', ({ col }) => {
  before('link jump');
  const i = current(); const hist = state.hist.get(i) || [];
  hist.push(state.start.get(i) ?? 0); state.hist.set(i, hist);
  state.start.set(i, col); showFeed();
});

/** Turn a spread; true if it moved, false at an edge. Going back returns to exactly the spread you came from. */
export function turn(dir) {
  const i = current(); if (i == null) return false;
  const it = items[i];
  if (!ready(it)) return false; // still opening
  const flow = flowHere(it);
  const s = state.start.get(i) ?? startOf(i);
  const n = flow ? live.n : (it.n || 1);
  const step = flow ? live.g.cols : Math.max(1, state.shown || state.per);
  const hist = state.hist.get(i) || [];
  let ns;
  if (dir > 0) {
    if (s + step >= n) return false;
    ns = s + step;
  } else {
    if (s <= 0) { toast('Start of document', { icon: 'arrow-up-to-line', kind: 'edge' }); return false; }
    ns = hist.length ? hist.at(-1) : Math.max(0, s - (flow ? step : state.per));
  }
  before(dir > 0 ? 'page turn' : 'page back');
  if (dir > 0) hist.push(s); else hist.pop();
  state.hist.set(i, hist);
  state.turns.push({ at: Date.now(), dir });
  state.start.set(i, ns);
  showFeed();
  emit('nav', { type: 'turn', i, it, s: ns, dir });
  return true;
}

// ---------- Advance and Back ----------
const stepped = (dir, e) => steppers.some((x) => x.fn(dir, e));
// A title short enough for a notice's second line to stay one line, read at a glance.
const brief = (t, n = 44) => (t.length > n ? t.slice(0, n).replace(/[\s:,;.–—-]+\S*$/, '') + '…' : t);
// A narrowed stack (stack.js: a folder or a tag you stay in) is named.
const inStack = () => (state.scope && state.stack?.label ? state.stack.label : null);
const laneEnd = () => { const s = inStack(); toast(s ? `Last in ${s}` : 'Last item in this lane', { icon: 'arrow-down-to-line', kind: 'edge', sub: s ? 'u leaves it: the whole lane, from here · 0–9 other lanes' : 'Pick another lane at the top (keys 0–9)' }); };
const laneStart = () => { const s = inStack(); toast(s ? `First in ${s}` : 'First item in this lane', { icon: 'arrow-up-to-line', kind: 'edge' }); };
/** Page forward; on the last spread, the next item at its opening page, but only
 *  on a fresh press or stroke (not key repeat, not later in the same wheel gesture).
 *  Returns true when it turned, 'crossed' when it moved on, false when it stayed. */
export function forward(e) {
  if (turn(1)) return true;
  // The wheel never slides into the next item by accident: at the end you
  // keep scrolling on purpose (a bar fills) to move on.
  if (e?.device) {
    if (!ready(items[current()])) return false;
    if (state.pos >= state.order.length - 1) { laneEnd(); return false; }
    if (!pulled()) return 'pull';
    return go(state.pos + 1) && 'crossed';
  }
  // Not while the item is still opening: its last spread is not known yet, and
  // a quick second press would skip an item you have not seen.
  if (e?.repeat || e?.fresh === false || !ready(items[current()])) return false;
  if (state.pos >= state.order.length - 1) { laneEnd(); return false; }
  return go(state.pos + 1) && 'crossed';
}
// Pull to the next item. Scrolling that reaches the end stops there, and
// keeps stopping while it goes on (steps less than 0.7 s apart). After a
// pause, a new scroll fills a bar: three steps move on to the next item.
let pullN = 0, pullT = 0, pullHide = 0, endItem = null;
on('nav', () => { endItem = null; }); // any move away and back reaches the end anew: pause again
function pulled() {
  const now = performance.now();
  const here = items[current()]?.id;
  if (endItem !== here) { endItem = here; pullN = 0; pullT = now; showPull(0); return false; }
  const gap = now - pullT; pullT = now;
  if (pullN === 0 && gap < 700) { showPull(0); return false; }
  pullN = gap > 1600 ? 1 : pullN + 1;
  if (pullN >= 3) { pullN = 0; endItem = null; showPull(1); return true; }
  showPull(pullN / 3);
  return false;
}
/** The pull is a HUD notice (util.js toast) that fills from the left as you keep scrolling. */
function showPull(frac) {
  const nx = brief(items[state.order[state.pos + 1]]?.t || 'the next item');
  if (frac >= 1) toast('Next item', 700, { icon: 'skip-forward', kind: 'ok', sub: nx, fill: 1 });
  else if (frac > 0) toast('Keep scrolling', 1800, { icon: 'chevrons-down', kind: 'ok', sub: `Next: ${nx}`, fill: frac });
  else toast('End of document', 1800, { icon: 'arrow-down-to-line', kind: 'edge', sub: `Pause, then scroll again for: ${nx}`, fill: 0 });
  clearTimeout(pullHide); pullHide = setTimeout(() => { pullN = 0; }, frac >= 1 ? 500 : 1800);
}
/** Advance (Space, PageDown, F16, the wheel in continue mode): steppers, then the next spread, then the next item. */
export function advance(e) { return stepped(1, e) || forward(e); }
/** Back (Backspace, Shift+Space, PageUp, F17): undo the last move or judgment (features/back.js); else turn back. */
export function back(e) { return stepped(-1, e) || turn(-1); }
/** r: the item's best pages first (from enrichment), then random spots chosen in advance. */
export function randomSpot() {
  const i = current(); const it = items[i];
  if (!ready(it)) return; // still opening (a post's columns are not known yet)
  let k, say = 'Random spot', icon = 'dices', pg;
  if (flowHere(it)) { k = Math.floor(Math.random() * Math.max(1, live.n - live.g.cols)); pg = live.first[k] ?? live.running[k]; }
  else {
    const seen = (state.bestSeen ||= new Map()); const used = seen.get(i) || 0;
    if (it.best && used < it.best.length) { k = it.best[used]; seen.set(i, used + 1); say = `Best page ${used + 1} of ${it.best.length}`; icon = 'sparkles'; }
    else { const n = it.n || 1; k = randomTarget.get(i) ?? Math.floor(Math.random() * Math.max(1, n - state.per)); randomTarget.delete(i); }
    pg = k;
  }
  before('jump');
  state.hist.set(i, []);
  state.start.set(i, k); showFeed();
  emit('nav', { type: 'random', i, it, s: k });
  toast(say, { icon, sub: pg != null ? `p. ${pg + 1}` : '' });
}
/** Zoom to one page or column, or back to the spread; k: the page (column, for flow documents) to zoom into. */
export function toggleZoom(on, k) {
  const z = on ?? !state.zoom;
  if (z === state.zoom) return;
  before(z ? 'zoom' : 'unzoom');
  state.zoom = z;
  const i = current(); state.hist.set(i, []);
  if (k != null && k >= 0) state.start.set(i, k);
  if (isFlow(items[i]) && live?.id === items[i].id) {
    // keep the same text in view across the relayout
    const vp = live.first[state.start.get(i) ?? 0] ?? 0;
    state.pendingVp = vp;
  }
  showFeed();
  emit('nav', { type: 'zoom', i, it: items[i], zoom: z });
}
on('spread:rendered', ({ i, flow }) => {
  if (flow && state.pendingVp != null) { const vp = state.pendingVp; state.pendingVp = null; const c = vpToCol(vp); if (c !== state.start.get(i)) { state.start.set(i, c); showFeed(); } }
});
export function toggleSave() {
  const it = items[current()];
  const k = state.saved.indexOf(it.id);
  before(k >= 0 ? 'unsave' : 'save', judged());
  if (k >= 0) state.saved.splice(k, 1); else { state.saved.unshift(it.id); learn(it, 1); buildOrder(); }
  store.set('saved', state.saved); $('#saved-n').textContent = state.saved.length; paintSaved(); paintHead(it);
  if (k >= 0) toast('Removed from saved', { icon: 'star-off', kind: 'edge' }); else toast('Saved', { icon: 'star', kind: 'ok' });
}
export function lessLikeThis() {
  before('less like this', judged()); learn(items[current()], -1); buildOrder(); go(state.pos + 1);
  toast('Less like this', { icon: 'thumbs-down', sub: 'Fewer items like it from now on' });
}
export function moreLikeThis() {
  before('more like this', judged());
  const i = current(); learn(items[i], 0.7);
  const near = state.order.slice(state.pos, state.pos + 10);
  state.order.splice(state.pos + 1, 0, ...related(i).filter((j) => !near.includes(j)));
  go(state.pos + 1);
  toast('More like this', { icon: 'thumbs-up', kind: 'ok', sub: 'Related items come next' });
}
function setPer(d) {
  const i = current();
  if (flowHere(items[i])) {
    const cols = d === 0 ? 0 : Math.max(1, Math.min(8, (state.flowCols || live.g.cols) + d));
    state.flowCols = cols; store.set('flowCols', cols);
    if (cols) toast(`${cols} column${cols > 1 ? 's' : ''}`, { icon: 'columns-3', sub: 'Press = to fit the screen' }); else toast('Columns fit the screen', { icon: 'maximize' });
  } else if (d === 0) { state.perAuto = true; store.set('perAuto', true); toast('Pages fit the screen', { icon: 'maximize' }); }
  else { state.perAuto = false; store.set('perAuto', false); state.per = Math.max(1, Math.min(8, state.per + d)); store.set('per', state.per); toast(`${state.per} page${state.per > 1 ? 's' : ''}`, { icon: 'columns-3', sub: 'Press = to fit the screen' }); }
  state.hist.set(i, []); showFeed();
}
function setFont(d) {
  state.font = Math.max(11, Math.min(24, state.font + d)); store.set('font', state.font);
  toast(`Text ${state.font} px`, { icon: 'type', sub: isFlow(items[current()]) ? '' : 'Applies to posts and web pages' });
  state.hist.set(current(), []);
  const i = current(); if (live?.id === items[i].id) state.pendingVp = live.first[state.start.get(i) ?? 0] ?? 0;
  showFeed();
}

// ---------- mouse wheel and trackpad ----------
// gesture.js turns each notch or stroke into one step; what a step does depends
// on the device's map (state.wheelMouse, state.wheelPad):
//   continue: vertical = Advance / Back, sideways (or Shift) = pages
//   items, 2d: vertical = items, sideways = pages · pages: vertical = pages, sideways = items
// A step that would cross into the next item needs a fresh gesture, and ends it.
// A pinch over the stage dives into the page under the pointer, or surfaces
// (zoom → spread → wall); it never zooms the app itself.
on('gesture:step', (d) => {
  if (state.view !== 'feed') return;
  if (state.stepHook?.(d)) return; // a mode that owns the wheel took the step (features/readaloud.js: sentences)
  const map = d.device === 'mouse' ? state.wheelMouse : state.wheelPad;
  const v = d.axis === 'v';
  let r;
  if (map === 'continue' && v) { d.glyph = d.dir > 0 ? '▸' : '◂'; r = d.dir > 0 ? advance(d) : back(d); }
  else if (v === (map !== 'pages')) r = go(state.pos + d.dir);
  else r = d.dir > 0 ? forward(d) : turn(-1);
  if (r === 'crossed') d.glyph = '▸▸';
  if (r === 'crossed' || (r === false && d.dir > 0)) d.stop = true;
  if (r === false) d.glyph = '';
});
on('gesture:pinch', ({ dir, x, y }) => {
  if (state.view !== 'feed') return;
  if (dir < 0) { if (state.zoom) toggleZoom(false); else setView('wall'); return; }
  if (state.zoom) return;
  const el = document.elementFromPoint(x, y);
  const pg = el?.closest('#spread .pg[data-k]');
  toggleZoom(true, pg ? Number(pg.dataset.k) : el?.closest('#spread .flow') ? elToCol(el) : undefined);
});
attachWheel($('#stage'), {
  steps: (e) => state.view === 'feed' && !e.target.closest('#scrub, #panel, .fn-pop'),
  pinch: () => state.view === 'feed',
});

const MOUSE = { continue: '⇣ continue', items: '↕ items', pages: '↕ pages' };
const PAD = { '2d': '↕ items ↔ pages', continue: 'continue' };
// What each map does, in the words the notices and the keys overlay (?) both use:
// [main line, second line (one glance: what down and up do), more (the overlay only)].
// The end-of-document pause is told when it happens (showPull), not here.
const WHEEL_SAY = {
  wheelMouse: {
    continue: ['Wheel: continue', 'Down: next page, then next item · Up: go back', 'Shift+wheel: pages'],
    items: ['Wheel: items', 'Down: next item · Up: previous item', 'Shift+wheel: pages'],
    pages: ['Wheel: pages', 'Down: next page · Up: previous page', 'Shift+wheel: items'],
  },
  wheelPad: {
    '2d': ['Trackpad: items and pages', 'Up/down: items · Sideways: pages'],
    continue: ['Trackpad: continue', 'Down: next page, then next item · Up: go back', 'Sideways: pages'],
  },
  wheelDevice: {
    auto: ['Wheel: detect the device', 'Mouse or trackpad, for each gesture'],
    mouse: ['Wheel: always a mouse', ''], pad: ['Wheel: always a trackpad', ''],
  },
};
// Beside the device, what the wheel moves: on (an arrow), items (the next-item icon), pages (a book), or both ways.
const WHEEL_ICON = { continue: 'arrow-down', items: 'skip-forward', pages: 'book-open', '2d': 'move' };
/** A notice for the device map `k` that just changed: the device, what it moves, the mode in a few words. */
function sayWheel(k) {
  const v = state[k], [main, sub] = WHEEL_SAY[k]?.[v] || [];
  if (!main) return;
  const dev = k === 'wheelPad' || (k === 'wheelDevice' && v === 'pad') ? 'touchpad' : 'mouse';
  toast(main, { icon: k === 'wheelDevice' ? dev : `${dev}+${WHEEL_ICON[v]}`, sub, kind: 'mode' });
}
function setWheel(k, v) { state[k] = v; store.set(k, v); paintWheel(); }
/** W or a middle click: the mouse wheel's map, continue → items → pages. */
export function toggleWheel() {
  const ks = Object.keys(MOUSE);
  setWheel('wheelMouse', ks[(ks.indexOf(state.wheelMouse) + 1) % ks.length]);
  sayWheel('wheelMouse');
}
export function paintWheel() {
  const b = $('#wheel-btn'); if (!b) return;
  b.textContent = MOUSE[state.wheelMouse] || MOUSE.continue;
  b.title = `Mouse wheel: ${state.wheelMouse} (middle-click or W cycles) · trackpad: ${PAD[state.wheelPad]} · click to set each device`;
  const f = $('#keys .k-foot')?.firstChild;
  const [mName, mSays, mMore] = WHEEL_SAY.wheelMouse[state.wheelMouse] || WHEEL_SAY.wheelMouse.continue;
  const [pName, pSays, pMore] = WHEEL_SAY.wheelPad[state.wheelPad] || WHEEL_SAY.wheelPad.continue;
  const all = (says, more) => says + (more ? ' · ' + more : '');
  if (f?.nodeType === 3) f.textContent = `${mName.replace(/^Wheel: (.*)/, 'Mouse wheel ($1)')} — ${all(mSays, mMore)}. W or a middle click switches continue → items → pages. `
    + `${pName.replace(/^Trackpad: (.*)/, 'Trackpad ($1)')} — ${all(pSays, pMore)}; one step per stroke. At the end of a document the wheel stops: pause, then scroll again to go on. `
    + 'Pinch out to zoom into a page, pinch in to zoom back out. Click a page to zoom.';
}
/** The wheel button: the map for each device, and whether to detect the device. */
export function wheelMenu() {
  if ($('#wheel-menu')) { $('#wheel-menu').remove(); return; }
  const row = (label, k, opts) => h('div', { className: 'wm-row' }, h('span', { textContent: label }),
    ...Object.entries(opts).map(([v, t]) => h('button', { className: state[k] === v ? 'on' : '', textContent: t, onclick: () => { setWheel(k, v); wheelMenu(); wheelMenu(); sayWheel(k); } })));
  const m = h('div', { id: 'wheel-menu' },
    row('Mouse wheel', 'wheelMouse', MOUSE), row('Trackpad', 'wheelPad', PAD),
    row('Device', 'wheelDevice', { auto: 'detect', mouse: 'always mouse', pad: 'always trackpad' }),
    h('a', { href: '?wheel=debug', textContent: 'wheel debug overlay', title: 'Plots every wheel event, to tune the thresholds' }));
  const r = $('#wheel-btn').getBoundingClientRect();
  m.style.left = Math.max(8, Math.min(r.left, innerWidth - 380)) + 'px'; m.style.top = r.bottom + 4 + 'px';
  document.body.append(m);
  setTimeout(() => addEventListener('pointerdown', function off(e) { if (!e.target.closest('#wheel-menu, #wheel-btn')) { m.remove(); removeEventListener('pointerdown', off); } }), 0);
}
css(`#wheel-menu { position: fixed; z-index: 40; background: var(--bg-3); border: 1px solid var(--line); border-radius: 4px; padding: 8px 10px; display: grid; gap: 6px; box-shadow: 0 8px 24px #0008; font-size: 12px; }
#wheel-menu .wm-row { display: flex; gap: 4px; align-items: center; }
#wheel-menu .wm-row > span { width: 86px; color: var(--ink-2); }
#wheel-menu button { padding: 1px 7px; }
#wheel-menu a { font-size: 11px; color: var(--ink-3); }`);
$('#scrub').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); $('#scrub').scrollLeft += e.deltaY; } }, { passive: false });
$('#stage').addEventListener('mousedown', (e) => { if (e.button === 1 && !e.target.closest('a')) { e.preventDefault(); toggleWheel(); } });

// ---------- keys ----------
// Auto-repeat is ignored (util.js), so one press is one step.
const K = (keys, fn, help, order) => registerKey(keys, fn, { help, order });
K([' ', 'PageDown', 'F16'], (e) => (e.key === ' ' && e.shiftKey ? back(e) : advance(e)), ['Space PgDn', 'next page; after the last page, the next item'], 8);
K(['Backspace', 'PageUp', 'F17'], back, ['⌫ ⇧Space PgUp', 'go back: undo the last move, save or skip, to the exact place'], 9);
K('F18', () => go(state.pos + 1), ['F16 F17 F18', 'next page / go back / next item (pedals, mouse buttons, a keyboard layer)'], 9);
K(['j', 'ArrowDown'], () => go(state.pos + 1), ['j k', 'next / previous item (↓ ↑)'], 10);
K(['k', 'ArrowUp'], () => go(state.pos - 1));
// → and ← turn pages. At the end of an item, → once only says what is next;
// a second → within 1.5 s moves on. At the start, ← twice goes back to the
// previous item, where you left it. So stepping across items is deliberate,
// and works the same in both directions.
let edgePress = null; // { dir, id, at }
let lastTurnAt = 0; // presses still in a quick run of page turns never count at an edge
function edgeTwice(dir, label) {
  const it = items[current()]; const now = performance.now();
  if (now - lastTurnAt < 600) { lastTurnAt = now; toast(dir > 0 ? 'End of document' : 'Start of document', 1200, { icon: dir > 0 ? 'arrow-down-to-line' : 'arrow-up-to-line', kind: 'edge', sub: `Pause, then press ${dir > 0 ? '→' : '←'} twice to go on` }); return false; }
  if (edgePress && edgePress.dir === dir && edgePress.id === it?.id && now - edgePress.at < 1500) { edgePress = null; return true; }
  edgePress = { dir, id: it?.id, at: now };
  const other = items[state.order[state.pos + dir]];
  if (other) toast(dir > 0 ? 'Next item' : 'Previous item', 1500, { icon: dir > 0 ? 'skip-forward' : 'skip-back', sub: `Press ${dir > 0 ? '→' : '←'} again for: ${brief(other.t)}` });
  else if (dir > 0) laneEnd(); else laneStart();
  return false;
}
function pageRight(e) {
  if (turn(1)) { edgePress = null; lastTurnAt = performance.now(); return; }
  const it = items[current()];
  if (!it || !ready(it) || e?.repeat) return;
  if (state.pos >= state.order.length - 1) { laneEnd(); return; }
  if (edgeTwice(1, 'Next')) go(state.pos + 1);
}
function pageLeft(e) {
  const i = current(); const it = items[i];
  if ((state.start.get(i) ?? 0) > 0) { edgePress = null; turn(-1); lastTurnAt = performance.now(); return; }
  if (!it || e?.repeat || state.pos <= 0) { if (state.pos <= 0) laneStart(); return; }
  if (edgeTwice(-1, 'Back to')) go(state.pos - 1); // opens where you left it
}
K(['l', 'ArrowRight'], pageRight, ['l h', 'turn pages (→ ←); at the end or start, press twice for the next or previous item'], 11);
K(['h', 'ArrowLeft'], pageLeft);
K(['z', 'Enter'], () => toggleZoom(), ['z Esc', 'zoom to one page or column / up a level: unzoom, then the wall'], 12);
K('Escape', () => {
  if ($('#wheel-menu')) $('#wheel-menu').remove();
  else if (state.zoom) toggleZoom(false);
  else if (!$('#saved').hidden) $('#saved').hidden = true;
  else setView('wall');
});
K('r', randomSpot, ['r', 'best pages, then random spots'], 13);
K('t', () => goPage(0), ['t g', 'first page / go to page'], 14);
K('Home', () => goPage(0), ['Home End', 'first / last page'], 14);
K('End', goEnd);
K('g', () => { const it = items[current()]; const v = Number(window.prompt(`Go to page (1-${it.n})`)); if (v >= 1) goPage(v - 1); });
K('s', toggleSave, ['s x m', 'save / less like this / more like this'], 30);
K('x', lessLikeThis); K('m', moreLikeThis);
K('+', () => setPer(1), ['+ - =', 'more / fewer pages or columns; = fits pages to the screen'], 20);
K('=', () => setPer(0));
K('-', () => setPer(-1));
K(']', () => setFont(1), ['[ ]', 'smaller / larger text (posts and web pages)'], 21);
K('[', () => setFont(-1));
K('c', () => { state.cols = !state.cols; store.set('cols', state.cols); showFeed(); }, ['c C', 'split two-column pages / crop margins'], 22);
K('C', () => { state.crop = !state.crop; store.set('crop', state.crop); showFeed(); });
K('W', toggleWheel, ['W', 'mouse wheel: continue → items → pages (or middle-click)'], 23);
K('o', () => { const it = items[current()]; window.open(it.page || it.url, '_blank', 'noopener'); }, ['o', 'open the original'], 40);
