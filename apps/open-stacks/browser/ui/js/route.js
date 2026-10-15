// Browser navigation: each item you settle on gets a history entry and a URL
// (?id=…&p=…), so Back/Forward move between documents and links can be
// bookmarked. Page turns within an item update the URL without adding
// entries; skipping quickly past items adds nothing (only 'item:settled').
import { on } from './util.js';
import { items, byId, LANES } from './corpus.js';
import { state, current } from './state.js';
import { isFlow } from './docs.js';
import { live, vpToCol, flowRange } from './flow.js';
import { showFeed } from './feed.js';
import { setView, setLane } from './chrome.js';

let restoring = false, booted = false;
const pageOf = (i) => {
  const it = items[i]; const s = state.start.get(i) ?? 0;
  if (isFlow(it)) return live?.id === it.id ? flowRange(s)[0] : 0; // stable page, not column
  return s;
};
function urlFor(i, view = state.view) {
  const u = new URL(location.href);
  u.search = '';
  if (view !== 'feed') u.searchParams.set('view', view);
  if (state.lane !== 'all') u.searchParams.set('lane', state.lane);
  if (i != null) { u.searchParams.set('id', items[i].id); const p = pageOf(i); if (p) u.searchParams.set('p', p + 1); }
  return u.pathname + u.search;
}
const entry = (i) => ({ id: i != null ? items[i].id : null, p: i != null ? pageOf(i) : 0, view: state.view, lane: state.lane });

on('item:settled', ({ i }) => {
  if (restoring || i !== current()) return;
  if (history.state?.id === items[i].id) return;
  history.pushState(entry(i), '', urlFor(i));
  document.title = `${items[i].t} · Stacks`;
});
on('spread:settled', ({ i }) => {
  if (restoring || i !== current() || history.state?.id !== items[i].id) return;
  history.replaceState(entry(i), '', urlFor(i));
});
on('view:changed', ({ view }) => {
  if (restoring || !booted || history.state?.view === view) return; // boot's setView('feed') must not replace the URL routeBoot reads
  history.pushState({ ...entry(current()), view }, '', urlFor(current(), view));
});

function open(st) {
  if (!st) return;
  restoring = true;
  try {
    if (st.lane && st.lane !== state.lane && (st.lane === 'all' || LANES[st.lane])) setLane(st.lane);
    const i = st.id != null ? byId.get(st.id) : null;
    if (i != null) {
      // Prefer the item's existing place in the order nearest to where you are.
      let pos = -1, best = Infinity;
      state.order.forEach((x, j) => { if (x === i && Math.abs(j - state.pos) < best) { best = Math.abs(j - state.pos); pos = j; } });
      if (pos < 0) { state.order.splice(state.pos + 1, 0, i); pos = state.pos + 1; }
      state.pos = pos; state.zoom = false;
      if (isFlow(items[i])) { if (st.p) state.pendingVp = st.p; state.start.set(i, 0); }
      else state.start.set(i, st.p || 0);
      state.hist.set(i, []);
    }
    setView(st.view || 'feed');
    if ((st.view || 'feed') === 'feed') showFeed();
  } finally { setTimeout(() => { restoring = false; }, 400); }
}
window.addEventListener('popstate', (e) => open(e.state || fromUrl()));
function fromUrl() {
  const q = new URL(location.href).searchParams;
  const id = q.get('id');
  if (!id && !q.get('view') && !q.get('lane')) return null;
  return { id, p: Math.max(0, Number(q.get('p') || 1) - 1), view: q.get('view') || 'feed', lane: q.get('lane') || state.lane };
}
/** Called once at boot: open the item the URL names, if any. */
export function routeBoot() {
  const st = fromUrl();
  booted = true;
  if (st) { open(st); history.replaceState(st, '', location.href); }
}
