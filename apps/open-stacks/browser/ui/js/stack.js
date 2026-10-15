// The stack: the ordered list of items that j/k (↓ ↑, the wheel, Space after the
// last page) walk, which is state.order, and what it is.
//
// - state.stack = { kind: 'all' | 'lane' | 'folder' | 'tag', id, label, crumb: [strings], size }
//   describes it; state.scope (a Set of item indexes, or null) narrows it to a
//   folder or a tag (buildOrder in state.js reads it); state.sort orders it.
// - Sorts (SORTS): topic = the library tree's order (lanes in chip order, then the
//   folders and it.ord), ranked = the score() ranking (round-robin across lanes in
//   All), newest / oldest by date (it.d, else it.y; undated last). Chosen per lane
//   (store 'sort:<lane>'); All defaults to ranked, every single lane to topic.
// - Everything here keeps the current item on screen at its page, is recorded with
//   nav.js before() so Back undoes it, and ends with 'stack:changed' {stack}.
//   A narrowed stack persists (store 'stack'), so a reload keeps it.
// - When narrowed, the item header shows "› Folder 7/10 ✕" or "# Tag 3/4 ✕"; ✕ or
//   u leaves (the whole lane again, same item, same page). S cycles the sort.
//
// features/library.js draws the stack in the side panel (the tree in topic order,
// a flat list otherwise); other features build on stack(), upNext(), goTo().
import { $, h, on, emit, store, css, registerKey, toast } from './util.js';
import { items, LANES, byId } from './corpus.js';
import { state, current, buildOrder, SORT_KEYS } from './state.js';
import { before, go } from './nav.js';
import { showFeed, paintHead, paintPos } from './feed.js';
import { planAround } from './prefetch.js';
import { isFlow } from './docs.js';
import { live, flowRange } from './flow.js';
import { setView, refresh, paintLanes } from './chrome.js';

export const SORTS = { topic: 'By topic', ranked: 'For you', newest: 'Newest', oldest: 'Oldest' };

// ---------- the descriptor ----------
const laneStack = () => (state.lane === 'all'
  ? { kind: 'all', id: 'all', label: 'All', crumb: ['All'] }
  : { kind: 'lane', id: state.lane, label: LANES[state.lane] || state.lane, crumb: [LANES[state.lane] || state.lane] });
function sync() {
  state.stack = state.scope ? { ...state.stack, size: state.scope.size } : { ...laneStack(), size: state.order.length };
}
/** The stack as other modules see it. */
export function stack() {
  if (!state.stack) sync();
  return { ...state.stack, sort: state.sort, pos: state.pos, n: state.order.length };
}
/** True while the stack is narrowed to a folder or a tag. */
export const narrowed = () => !!state.scope;
function changed() { sync(); paintCrumb(); emit('stack:changed', { stack: stack() }); }

// Where leave() returns to in the ranking: the lane's order and place when you stayed in.
let ret = null;
function persist() {
  if (!state.scope) { store.set('stack', null); return; }
  const { kind, id, label, crumb } = state.stack;
  store.set('stack', { lane: state.lane, kind, id, label, crumb, ids: [...state.scope].map((i) => items[i].id) });
}

/** A library folder as a stayIn() descriptor: its lane, then folder names (it.path), outermost first. */
export function folderStack(lane, path) {
  const members = [];
  items.forEach((it, i) => { if (it.lane === lane && Array.isArray(it.path) && path.every((p, k) => it.path[k] === p)) members.push(i); });
  return { kind: 'folder', id: [lane, ...path].join('/'), label: path.at(-1) || LANES[lane] || lane, crumb: [LANES[lane] || lane, ...path], items: members, lane };
}

// ---------- showing the result ----------
/** After the order changed: the same item stays as it is (only the header, the
 *  position and the prefetch plan follow the new order); another item is shown. */
function show(prev) {
  const i = current(); if (i == null) return;
  if (state.view !== 'feed') { refresh(); return; }
  if (i !== prev) { state.zoom = false; showFeed(); emit('nav', { type: 'item', i, it: items[i] }); return; }
  const it = items[i], s = state.start.get(i) ?? 0;
  paintHead(it);
  if (isFlow(it)) { if (live?.id === it.id) { const [a, b] = flowRange(s); paintPos(it, a, b - a + 1, live.d?.n ?? it.n, true); } }
  else if (it.n) paintPos(it, s, Math.max(1, state.shown || state.per), it.n);
  planAround(i, s);
}

// ---------- the API ----------
/** Order the stack another way; the current item stays where it is on screen. */
export function setSort(sort) {
  if (!SORTS[sort] || !SORT_KEYS.includes(sort)) return false;
  if (sort === state.sort) return false;
  const cur = current();
  before('sort', { order: state.order.slice() });
  store.set('sort:' + state.lane, sort);
  buildOrder(false, cur);
  show(cur);
  changed();
  return true;
}

/** Narrow the stack to `items` (a Set or an array of item indexes), in the current sort.
 *  The current item stays (it joins the stack at its place if it is not a member).
 *  opts.at: move to this item instead; opts.first: to the stack's first item.
 *  desc.lane (folders): in a single lane, browsing another lane's folder switches to it. */
export function stayIn(desc, opts = {}) {
  const set = new Set(desc?.items instanceof Set ? desc.items : desc?.items || []);
  for (const i of set) if (!items[i]) set.delete(i);
  if (!set.size) return false;
  const cur = current();
  const lane = desc.lane && state.lane !== 'all' && desc.lane !== state.lane && LANES[desc.lane] ? desc.lane : null;
  before('stay in', { order: state.order.slice(), ...(lane ? { lane: state.lane } : {}) });
  if (!state.scope) ret = { lane: state.lane, sort: state.sort, order: state.order.slice(), pos: state.pos };
  if (lane) { state.lane = lane; store.set('lane', lane); ret = null; }
  state.scope = set;
  state.stack = { kind: desc.kind || 'tag', id: desc.id ?? desc.label, label: desc.label || String(desc.id), crumb: desc.crumb || [desc.label || String(desc.id)], size: set.size };
  if (opts.first) buildOrder(false);
  else buildOrder(false, opts.at ?? cur);
  persist();
  if (lane) paintLanes();
  show(cur);
  changed();
  return true;
}

/** Back to the whole lane, on the same item and page. */
export function leave() {
  if (!state.scope) return false;
  const cur = current();
  before('leave stack', { order: state.order.slice() });
  state.scope = null;
  const r = ret; ret = null;
  if (state.sort === 'ranked' && r && r.lane === state.lane && r.sort === state.sort && cur != null) {
    // The ranking goes on from where you stayed in, this item next.
    const order = r.order.slice(); let pos = Math.min(r.pos, order.length - 1);
    if (order[pos] !== cur) { const later = order.indexOf(cur, pos + 1); if (later > 0) order.splice(later, 1); order.splice(pos + 1, 0, cur); pos++; }
    state.order = order; state.pos = pos;
  } else buildOrder(false, cur);
  persist();
  show(cur);
  changed();
  toast(`All of ${LANES[state.lane] || 'the lanes'}`, { icon: 'maximize', sub: 'Left the stack · Back returns to it' });
  return true;
}

/** The next n items after the current one. */
export const upNext = (n = 5) => state.order.slice(state.pos + 1, state.pos + 1 + Math.max(0, n));
/** The previous n items, nearest first. */
export const upPrev = (n = 5) => state.order.slice(Math.max(0, state.pos - Math.max(0, n)), state.pos).reverse();

/** Where item i is in the order: here, else the nearest place ahead, else behind; -1 when absent. */
function findPos(i) {
  const o = state.order;
  for (let k = state.pos; k < o.length; k++) if (o[k] === i) return k;
  for (let k = state.pos - 1; k >= 0; k--) if (o[k] === i) return k;
  return -1;
}
/** Move to item i inside the stack (it comes next when it is not in it). */
export function goTo(i, label = 'up next') {
  if (i == null || !items[i]) return false;
  let p = findPos(i);
  if (p === state.pos && state.view === 'feed') return false;
  before(label, p < 0 ? { order: state.order.slice() } : undefined);
  if (p < 0) { state.order.splice(state.pos + 1, 0, i); p = state.pos + 1; }
  if (state.view !== 'feed') { state.pos = p; state.zoom = false; setView('feed'); emit('nav', { type: 'item', i, it: items[i] }); }
  else go(p);
  changed();
  return true;
}

// ---------- Back, lane switches, search results ----------
// Every recorded place carries the stack it was in (features/back.js keeps the
// snapshot and hands it back in 'nav' {type: 'back', snap}), so Back restores it.
on('nav:before', (s) => {
  s.stk = { lane: state.lane, sort: state.sort, scope: state.scope, stack: state.stack, ret };
  // A lane chip (or 0-9) and browsing search results leave a narrowed stack.
  if (s.label === 'lane switch' || s.label === 'browse results') {
    if (state.scope) { state.scope = null; ret = null; persist(); }
    queueMicrotask(changed);
  }
});
on('nav', (d) => {
  if (d.type !== 'back') return;
  const k = d.snap?.stk;
  if (!k) return;
  if (k.scope === state.scope && k.sort === state.sort && k.lane === state.lane) return;
  if (k.lane !== state.lane) { state.lane = k.lane; store.set('lane', k.lane); paintLanes(); }
  state.sort = k.sort; store.set('sort:' + state.lane, k.sort);
  state.scope = k.scope; state.stack = k.stack; ret = k.ret;
  persist();
  changed();
});

// ---------- the header crumb ----------
// feed.js repaints the header on every turn; an observer re-adds one small button.
css(`#item-head .stk-crumb { display: inline-flex; align-items: baseline; gap: 5px; min-width: 0; max-width: 48ch; font: 10px var(--mono); text-transform: uppercase; letter-spacing: .07em; color: var(--accent); }
#item-head .stk-crumb button { border: 0; padding: 0; background: none; font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit; cursor: pointer; }
#item-head .stk-crumb .sc-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
#item-head .stk-crumb .sc-n { color: var(--ink-3); flex: none; }
#item-head .stk-crumb .sc-x { color: var(--ink-3); padding: 0 2px; flex: none; }
#item-head .stk-crumb .sc-x:hover, #item-head .stk-crumb .sc-t:hover { color: var(--ink); }`);
const mark = (kind) => (kind === 'tag' ? '#' : '›');
function paintCrumb() {
  const meta = $('#item-head .meta');
  let el = meta?.querySelector('.stk-crumb');
  if (!state.scope || !meta) { el?.remove(); return; }
  const st = state.stack;
  const text = `${mark(st.kind)} ${st.label}`, n = `${state.pos + 1}/${state.order.length}`;
  if (el && el.dataset.v === text + n) return;
  const lane = LANES[state.lane] || 'All';
  const next = h('span', { className: 'stk-crumb' },
    h('button', { type: 'button', className: 'sc-t', textContent: text, title: `Staying in ${st.crumb.join(' › ')} · click to show it in the Library`, onclick: () => emit('stack:show', { stack: stack() }) }),
    h('span', { className: 'sc-n', textContent: n }),
    h('button', { type: 'button', className: 'sc-x', textContent: '✕', title: `Leave: the whole ${lane} lane again, same item (u) · Back undoes`, onclick: () => leave() }));
  next.dataset.v = text + n;
  if (el) { el.replaceWith(next); return; }
  const l = meta.querySelector('.lane');
  if (l) l.after(next); else meta.prepend(next);
}
new MutationObserver(() => { if (state.scope) paintCrumb(); }).observe($('#item-head'), { childList: true });

// ---------- keys ----------
registerKey('u', () => { if (!leave()) toast('Not in a stack', { icon: 'info', kind: 'edge', sub: 'Enter on a library folder stays in it' }); },
  { view: null, help: ['u S', 'leave the folder or tag you are staying in (the whole lane again) / sort: by topic → for you → newest → oldest'], order: 52.5 });
registerKey('S', () => {
  const next = SORT_KEYS[(SORT_KEYS.indexOf(state.sort) + 1) % SORT_KEYS.length];
  if (setSort(next)) toast(SORTS[next], { icon: 'arrow-down-up', kind: 'mode', sub: `${state.pos + 1} of ${state.order.length} · S sorts again` });
}, { view: null });

// ---------- a stack from an earlier session ----------
// The lane is restored by state.js; boot builds the order (chrome.js).
{
  let s = store.get('stack', null);
  const old = store.get('libScope', null); // the library's folder, before the stack existed
  if (!s && old?.lane && old.path?.length) { const f = folderStack(old.lane, old.path); s = { ...f, ids: f.items.map((i) => items[i].id), lane: old.lane }; }
  if (old) store.set('libScope', null);
  if (s && s.lane === state.lane && Array.isArray(s.ids)) {
    const set = new Set(s.ids.map((id) => byId.get(id)).filter((i) => i != null));
    if (set.size) {
      state.scope = set;
      state.stack = { kind: s.kind, id: s.id, label: s.label, crumb: s.crumb || [s.label], size: set.size };
      store.set('stack', { lane: s.lane, kind: s.kind, id: s.id, label: s.label, crumb: state.stack.crumb, ids: s.ids });
    } else store.set('stack', null);
  }
}
on('boot', () => changed());
