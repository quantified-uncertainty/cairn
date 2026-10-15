// Back: one key undoes any move or judgment (docs/navigation-ergonomics.md, item 2).
//
// nav.js says where you were just before each move or judgment ('nav:before':
// a page turn, an item change, a jump, a link, zoom, a lane switch, a save, less
// or more like this); this keeps the last 100 of those places. Back
// (Backspace, Shift+Space, PageUp, F17, the wheel up in continue mode) pops one
// and returns there exactly: the item, its spread, its turn history (so h still
// retraces your turns), the zoom, and for judgments the learned preferences, the
// order and the saved list. One user action is one entry: a judgment's own move
// to the next item belongs to it, and a move that went nowhere (Home on the first
// page) is dropped. Item changes made by other modules without 'nav:before'
// (opening a wall tile or a figure) are recorded from where the feed last was.
// With nothing left to undo, Back turns back a spread, unrecorded.
import { on, emit, store, toast, registerStepper } from '../util.js';
import { items } from '../corpus.js';
import { state, current } from '../state.js';
import { showFeed } from '../feed.js';
import { paintSaved, paintLanes } from '../chrome.js';

const MAX = 100;
const stack = [];
let restoring = false, tick = false, seen = null;

/** The snapshot is where the feed is now (a move that went nowhere, like Home on the first page). */
const here = (s) => !s.order && !s.aff && !s.saved && s.lane == null && s.i === current() && s.pos === state.pos && s.zoom === state.zoom
  && (s.s ?? null) === (state.start.get(s.i) ?? null) && s.hist.join() === (state.hist.get(s.i) || []).join();
function push(snap) {
  if (restoring || tick) return;
  tick = true;
  stack.push(snap);
  if (stack.length > MAX) stack.shift();
  // Moves set their place synchronously; one that went nowhere is not worth a Back.
  queueMicrotask(() => { tick = false; if (stack.at(-1) === snap && here(snap)) stack.pop(); });
}
// A move made outside the feed (a lane switch on the wall) is what changes the
// item the feed shows next, so that change is not recorded a second time.
on('nav:before', (snap) => { push(snap); if (state.view !== 'feed') seen = null; });

// Where the feed is now, for item changes that come without 'nav:before'.
on('spread:rendered', ({ i }) => {
  if (state.view !== 'feed' || restoring) return;
  seen = { label: 'item change', i, pos: state.pos, s: state.start.get(i), hist: [...(state.hist.get(i) || [])], zoom: state.zoom };
});
on('item:shown', ({ i }) => { if (seen && seen.i !== i) { push(seen); seen = null; } }); // once: the next place is set when it renders

export function undo() {
  const snap = stack.pop();
  if (!snap) return false;
  restoring = true;
  try {
    if (snap.lane != null) { state.lane = snap.lane; store.set('lane', snap.lane); }
    if (snap.order) state.order = snap.order;
    if (snap.aff) { state.aff.lane = snap.aff.lane; state.aff.tok = snap.aff.tok; store.set('aff', state.aff); }
    if (snap.saved) { state.saved.splice(0, Infinity, ...snap.saved); store.set('saved', state.saved); }
    let pos = state.order[snap.pos] === snap.i ? snap.pos : state.order.indexOf(snap.i);
    if (pos < 0) { pos = Math.min(state.pos + 1, state.order.length); state.order.splice(pos, 0, snap.i); }
    state.pos = pos;
    if (snap.s == null) state.start.delete(snap.i); else state.start.set(snap.i, snap.s);
    state.hist.set(snap.i, snap.hist);
    state.zoom = snap.zoom; state.pendingVp = null;
    if (snap.lane != null) paintLanes();
    if (snap.saved) paintSaved();
    showFeed();
    emit('nav', { type: 'back', i: snap.i, it: items[snap.i], s: snap.s, undone: snap.label });
  } finally { restoring = false; }
  toast(`Undone: ${snap.label}`);
  return true;
}
registerStepper((dir) => {
  if (dir > 0 || state.view !== 'feed') return false;
  if (undo()) return true;
  // Nothing left to undo: Back turns back a spread, and that turn is not
  // recorded either, or the next Back would undo it and the two would alternate.
  tick = true; queueMicrotask(() => { tick = false; });
  return false;
}, 10);

/** For tests and other modules: the labels on the stack, oldest first. */
export const backStack = () => stack.map((s) => s.label);
