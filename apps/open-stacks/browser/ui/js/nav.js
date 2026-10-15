// Moving around: items (j/k), pages (h/l), jumps, zoom, the mouse wheel.
import { $, store, emit, on, registerKey, toast } from './util.js';
import { items, related } from './corpus.js';
import { state, current, buildOrder, learn } from './state.js';
import { isFlow } from './docs.js';
import { startOf, randomTarget } from './prefetch.js';
import { showFeed, paintHead } from './feed.js';
import { live, vpToCol } from './flow.js';
import { setView, paintSaved } from './chrome.js';

export function go(pos) {
  const p = Math.max(0, Math.min(pos, state.order.length - 1));
  if (p === state.pos && state.view === 'feed') return;
  state.pos = p; state.zoom = false; showFeed();
  emit('nav', { type: 'item', i: current(), it: items[current()] });
}
export function jumpTo(j) { state.order.splice(state.pos + 1, 0, j); setView('feed'); go(state.pos + 1); }

const flowHere = (it) => isFlow(it) && live?.id === it.id;
/** Jump to a page (for flow documents, a stable page). Clears the turn history. */
export function goPage(k) {
  const i = current(); const it = items[i];
  state.hist.set(i, []);
  state.start.set(i, flowHere(it) ? vpToCol(k) : Math.max(0, k));
  showFeed();
  emit('nav', { type: 'page', i, it, k });
}
on('flow:jump', ({ col }) => {
  const i = current(); const hist = state.hist.get(i) || [];
  hist.push(state.start.get(i) ?? 0); state.hist.set(i, hist);
  state.start.set(i, col); showFeed();
});

/** Turn a spread. Going back returns to exactly the spread you came from. */
export function turn(dir) {
  const i = current(); if (i == null) return;
  const it = items[i];
  const flow = flowHere(it);
  const s = state.start.get(i) ?? startOf(i);
  const n = flow ? live.n : (it.n || 1);
  const step = flow ? live.g.cols : Math.max(1, state.shown || state.per);
  const hist = state.hist.get(i) || [];
  let ns;
  if (dir > 0) {
    if (s + step >= n) { toast('End · j for the next item'); return; }
    hist.push(s); ns = s + step;
  } else {
    if (s <= 0) { toast('Start'); return; }
    ns = hist.length ? hist.pop() : Math.max(0, s - (flow ? step : state.per));
  }
  state.hist.set(i, hist);
  state.turns.push({ at: Date.now(), dir });
  state.start.set(i, ns);
  showFeed();
  emit('nav', { type: 'turn', i, it, s: ns, dir });
}
/** r: the item's best pages first (from enrichment), then random spots chosen in advance. */
export function randomSpot() {
  const i = current(); const it = items[i];
  let k;
  if (flowHere(it)) k = Math.floor(Math.random() * Math.max(1, live.n - live.g.cols));
  else {
    const seen = (state.bestSeen ||= new Map()); const used = seen.get(i) || 0;
    if (it.best && used < it.best.length) { k = it.best[used]; seen.set(i, used + 1); toast(`Best page ${used + 1} of ${it.best.length}`); }
    else { const n = it.n || 1; k = randomTarget.get(i) ?? Math.floor(Math.random() * Math.max(1, n - state.per)); randomTarget.delete(i); }
  }
  state.hist.set(i, []);
  state.start.set(i, k); showFeed();
  emit('nav', { type: 'random', i, it, s: k });
}
export function toggleZoom(on) {
  const z = on ?? !state.zoom;
  if (z === state.zoom) return;
  state.zoom = z;
  const i = current(); state.hist.set(i, []);
  if (isFlow(items[i]) && live?.id === items[i].id) {
    // keep the same text in view across the relayout
    const vp = live.first[state.start.get(i) ?? 0] ?? 0;
    state.pendingVp = vp;
  }
  showFeed();
}
on('spread:rendered', ({ i, flow }) => {
  if (flow && state.pendingVp != null) { const vp = state.pendingVp; state.pendingVp = null; const c = vpToCol(vp); if (c !== state.start.get(i)) { state.start.set(i, c); showFeed(); } }
});
export function toggleSave() {
  const it = items[current()];
  const k = state.saved.indexOf(it.id);
  if (k >= 0) state.saved.splice(k, 1); else { state.saved.unshift(it.id); learn(it, 1); buildOrder(); }
  store.set('saved', state.saved); $('#saved-n').textContent = state.saved.length; paintSaved(); paintHead(it);
  toast(k >= 0 ? 'Removed from saved' : 'Saved');
}
export function lessLikeThis() { learn(items[current()], -1); buildOrder(); go(state.pos + 1); }
export function moreLikeThis() {
  const i = current(); learn(items[i], 0.7);
  const near = state.order.slice(state.pos, state.pos + 10);
  state.order.splice(state.pos + 1, 0, ...related(i).filter((j) => !near.includes(j)));
  go(state.pos + 1);
}
function setPer(d) {
  const i = current();
  if (flowHere(items[i])) {
    const cols = Math.max(1, Math.min(8, (state.flowCols || live.g.cols) + d));
    state.flowCols = cols; store.set('flowCols', cols); toast(`${cols} column${cols > 1 ? 's' : ''}`);
  } else { state.per = Math.max(1, Math.min(8, state.per + d)); store.set('per', state.per); toast(`${state.per} page${state.per > 1 ? 's' : ''}`); }
  state.hist.set(i, []); showFeed();
}
function setFont(d) {
  state.font = Math.max(11, Math.min(24, state.font + d)); store.set('font', state.font);
  toast(`Text ${state.font}px${isFlow(items[current()]) ? '' : ' (applies to posts and web pages)'}`);
  state.hist.set(current(), []);
  const i = current(); if (live?.id === items[i].id) state.pendingVp = live.first[state.start.get(i) ?? 0] ?? 0;
  showFeed();
}

// ---------- mouse wheel ----------
// Vertical wheel moves between items (like j/k) and horizontal wheel or
// Shift+wheel turns pages; a middle click swaps the two. One gesture (events
// less than 140 ms apart) makes one step; a long fling can make a few.
let acc = 0, lastT = 0, steps = 0;
function onWheel(e) {
  if (e.ctrlKey || state.view !== 'feed' || e.target.closest('#scrub, #panel, .fn-pop')) return;
  e.preventDefault();
  const now = performance.now();
  const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
  let d = horiz ? e.deltaX : e.deltaY;
  if (e.deltaMode === 1) d *= 40; else if (e.deltaMode === 2) d *= 800;
  if (now - lastT > 140) { acc = 0; steps = 0; }
  lastT = now;
  if (acc && Math.sign(d) !== Math.sign(acc)) { acc = 0; steps = 0; }
  acc += d;
  if (Math.abs(acc) < (steps ? 320 : 30)) return;
  const dir = Math.sign(acc); acc = 0; steps++;
  const axis = horiz || e.shiftKey ? 'h' : 'v';
  if ((axis === 'v') === (state.wheel === 'items')) go(state.pos + dir); else turn(dir);
}
export function toggleWheel() {
  state.wheel = state.wheel === 'items' ? 'pages' : 'items'; store.set('wheel', state.wheel);
  paintWheel();
  toast(state.wheel === 'items' ? 'Wheel: up/down = items · Shift or sideways = pages' : 'Wheel: up/down = pages · Shift or sideways = items', 2400);
}
export function paintWheel() {
  const b = $('#wheel-btn'); if (!b) return;
  b.textContent = state.wheel === 'items' ? '↕ items' : '↔ pages';
  b.title = `Mouse wheel moves between ${state.wheel} (middle-click or W to switch; Shift+wheel does the other)`;
}
$('#stage').addEventListener('wheel', onWheel, { passive: false });
$('#scrub').addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); $('#scrub').scrollLeft += e.deltaY; } }, { passive: false });
$('#stage').addEventListener('mousedown', (e) => { if (e.button === 1 && !e.target.closest('a')) { e.preventDefault(); toggleWheel(); } });

// ---------- keys ----------
const K = (keys, fn, help, order) => registerKey(keys, fn, { help, order });
K(['j', 'ArrowDown'], () => go(state.pos + 1), ['j k', 'next / previous item (↓ ↑)'], 10);
K(['k', 'ArrowUp'], () => go(state.pos - 1));
K(['l', 'ArrowRight', ' '], () => turn(1), ['l h', 'turn pages (→ ← · Space)'], 11);
K(['h', 'ArrowLeft'], () => turn(-1));
K(['z', 'Enter'], () => toggleZoom(), ['z', 'zoom to one page or column; Esc back'], 12);
K('Escape', () => toggleZoom(false));
K('r', randomSpot, ['r', 'best pages, then random spots'], 13);
K('t', () => goPage(0), ['t g', 'first page / go to page'], 14);
K('g', () => { const it = items[current()]; const v = Number(window.prompt(`Go to page (1-${it.n})`)); if (v >= 1) goPage(v - 1); });
K('s', toggleSave, ['s x m', 'save / less like this / more like this'], 30);
K('x', lessLikeThis); K('m', moreLikeThis);
K(['+', '='], () => setPer(1), ['+ -', 'more / fewer pages or columns'], 20);
K('-', () => setPer(-1));
K(']', () => setFont(1), ['[ ]', 'smaller / larger text (posts and web pages)'], 21);
K('[', () => setFont(-1));
K('c', () => { state.cols = !state.cols; store.set('cols', state.cols); showFeed(); }, ['c C', 'split two-column pages / crop margins'], 22);
K('C', () => { state.crop = !state.crop; store.set('crop', state.crop); showFeed(); });
K('W', toggleWheel, ['W', 'mouse wheel: items ↔ pages (or middle-click)'], 23);
K('o', () => { const it = items[current()]; window.open(it.page || it.url, '_blank', 'noopener'); }, ['o', 'open the original'], 40);
