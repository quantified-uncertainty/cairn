// Everything around the pages: views, lanes, the panel toggle, saved items,
// the keys overlay, the key dispatcher and the server status line.
import { $, h, on, emit, views, registerView, registerKey, keymap, keyHelp, store } from './util.js';
import { items, LANES, COUNTS, byId } from './corpus.js';
import { state, buildOrder, screenKey, loadScreenPrefs } from './state.js';
import { showFeed } from './feed.js';
import { jumpTo, paintWheel, wheelMenu, before } from './nav.js';

export function setView(v) {
  if (!views.has(v)) v = 'feed';
  const prev = state.view;
  state.view = v;
  for (const [name, view] of views) for (const r of view.roots?.() || []) if (r) r.hidden = name !== v;
  $('#main').dataset.view = v;
  paintViews();
  if (prev !== v) views.get(prev)?.hide?.();
  views.get(v).show?.();
  emit('view:changed', { view: v });
}
export const refresh = () => views.get(state.view)?.show?.();

// The view switcher, in every header layout: the views used most as icon buttons
// (the current one marked), then ▾ (#view-pick, header.js) with every view and its
// key. Line icons from Lucide (ISC licence, lucide.dev); a view may bring its own
// (registerView {icon: '<path …/>'}).
export const KEY_VIEWS = ['feed', 'wall', 'feeds'];
const VIEW_ICONS = {
  feed: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  wall: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  figures: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  feeds: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  dashboard: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>', // a gauge: Lucide's layout-dashboard looked like the Wall's grid beside it
};
/** A view's icon as SVG markup. */
export const viewIcon = (name) => `<svg class="vi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${views.get(name)?.icon || VIEW_ICONS[name] || '<rect width="18" height="18" x="3" y="3" rx="2"/>'}</svg>`;
export const viewList = () => [...views.entries()].sort((a, b) => (a[1].order ?? 50) - (b[1].order ?? 50));
function paintViews() {
  const btns = viewList().filter(([name]) => KEY_VIEWS.includes(name)).map(([name, v]) => {
    const b = h('button', { type: 'button', className: 'vw' + (state.view === name ? ' on' : ''), title: v.key ? `${v.label} (${v.key})` : v.label, innerHTML: viewIcon(name), onclick: () => setView(name) });
    b.setAttribute('aria-label', v.label); b.setAttribute('aria-pressed', String(state.view === name));
    return b;
  });
  $('#views').replaceChildren(...btns, $('#view-pick') || '');
}
on('views:changed', () => {
  paintViews();
  for (const [name, v] of views) if (v.key && !keymap.has(v.key)) registerKey(v.key, () => setView(name), { view: null });
});

registerView('feed', { label: 'Reader', key: 'f', order: 0, roots: () => [$('#stage'), $('#panel')], show: () => showFeed() });

export function paintLanes() {
  const all = [['all', 'All', items.length], ...Object.entries(LANES).map(([k, v]) => [k, v, COUNTS[k] || 0]).filter(([, , c]) => c)];
  $('#lanes').replaceChildren(...all.map(([k, label, c], d) => h('button', {
    className: state.lane === k ? 'on' : '', title: d < 10 ? `${label} · key ${d}` : label,
    onclick: () => setLane(k),
  }, label, h('span', { className: 'n', textContent: String(c) }))));
  // The chips scroll sideways when they do not fit; keep the current lane in view.
  requestAnimationFrame(showLane);
}
export function showLane() {
  const el = $('#lanes'), on = el?.querySelector('.on');
  if (!on || el.scrollWidth <= el.clientWidth) return;
  const l = on.offsetLeft - el.firstElementChild.offsetLeft, r = l + on.offsetWidth;
  if (l < el.scrollLeft + 16 || r > el.scrollLeft + el.clientWidth - 24) el.scrollLeft = l - (el.clientWidth - on.offsetWidth) / 2;
}
document.fonts?.ready.then(() => requestAnimationFrame(showLane));
addEventListener('resize', () => requestAnimationFrame(showLane));
// A vertical wheel over the lane chips scrolls them sideways.
$('#lanes')?.addEventListener('wheel', (e) => {
  const el = e.currentTarget;
  if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault(); e.stopPropagation();
  el.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 16 : 1);
}, { passive: false });
export function setLane(k) { before('lane switch', { lane: state.lane, order: state.order.slice() }); state.lane = k; store.set('lane', k); buildOrder(false); paintLanes(); refresh(); }

export function paintSaved() {
  $('#saved-n').textContent = state.saved.length;
  $('#saved-list').replaceChildren(...state.saved.map((id) => { const i = byId.get(id); return i == null ? null : h('li', { textContent: items[i].t, onclick: () => jumpTo(i) }); }));
}

export function applyChrome() {
  $('#main').classList.toggle('nopanel', !state.panel);
  $('#main').classList.toggle('panel-right', state.panelSide === 'right');
  $('#scrub').classList.toggle('pinned', state.pin);
  const b = $('#panel-btn');
  b.classList.toggle('on', state.panel);
  b.title = `${state.panel ? 'Hide' : 'Show'} the side panel (i) · I moves it to the ${state.panelSide === 'left' ? 'right' : 'left'}`;
}
export function togglePanel() { state.panel = !state.panel; store.set('panel', state.panel); applyChrome(); if (state.view === 'feed') showFeed(); }
function swapPanel() { state.panelSide = state.panelSide === 'left' ? 'right' : 'left'; store.set('panelSide', state.panelSide); applyChrome(); if (state.view === 'feed') showFeed(); }

function paintKeys() {
  const rows = [...keyHelp].sort((a, b) => a.order - b.order);
  $('#keys-dl').replaceChildren(...rows.flatMap((r) => [
    h('dt', {}, ...r.label.split(' ').map((k) => h('kbd', { textContent: k }))),
    h('dd', { textContent: r.text }),
  ]));
}
const toggleKeys = () => { const k = $('#keys'); if (k.hidden) paintKeys(); k.hidden = !k.hidden; };

$('#panel-btn').onclick = togglePanel;
$('#keys-btn').onclick = toggleKeys;
$('#keys').onclick = () => { $('#keys').hidden = true; };
$('#saved-btn').onclick = () => { $('#saved').hidden = !$('#saved').hidden; };
$('#wheel-btn').onclick = wheelMenu;

registerKey('i', togglePanel, { view: null, help: ['i I', 'hide/show the side panel / move it left or right'], order: 50 });
registerKey('I', swapPanel, { view: null });
registerKey('p', () => { state.pin = !state.pin; store.set('pin', state.pin); applyChrome(); if (state.view === 'feed') showFeed(); }, { help: ['p', 'pin the page strip'], order: 51 });
registerKey('b', () => { $('#saved').hidden = !$('#saved').hidden; }, { view: null, help: ['b', 'saved items and note export'], order: 61 });
registerKey('?', toggleKeys, { view: null });
keyHelp.push({ label: 'f w D', text: 'Reader / Wall / Feeds (the icons at the top left; ▾ beside them lists every view and its key)', order: 62 }, { label: '0 1 … 9', text: 'lanes', order: 63 });

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (!$('#keys').hidden && k === 'Escape') { $('#keys').hidden = true; return; }
  if (/^[0-9]$/.test(k)) { const lanes = ['all', ...Object.keys(LANES).filter((l) => COUNTS[l])]; if (lanes[Number(k)] && !e.repeat) setLane(lanes[Number(k)]); return; }
  let b = keymap.get(k);
  while (b && b.view && b.view !== state.view) b = b.else; // util.js registerKey: one key, two views
  if (!b) return;
  e.preventDefault();
  if (e.repeat && !b.repeat) return; // one press, one step
  b.fn(e);
});
// The gear is in the page from the start; features/settings.js takes it over. If that
// feature did not load, a click says so instead of doing nothing.
$('#st-btn')?.addEventListener('click', () => {
  if ($('#st-btn').dataset.ready) return;
  import('./util.js').then(({ toast }) => toast('Settings did not load', { icon: 'circle-alert', kind: 'bad', sub: 'Details are in the browser console (⌥⌘K in Firefox); restarting the server after a pull usually fixes it' }));
});
let rz = null;
// Moving the window to another screen brings that screen's page and column counts.
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (screenKey() !== state.screen) loadScreenPrefs(); refresh(); }, 150); });

async function pollStatus() {
  try {
    const s = state.status = await (await fetch('/status')).json();
    const hit = s.hits + s.misses ? Math.round((100 * s.hits) / (s.hits + s.misses)) : 0;
    $('#net').textContent = `${hit}% cached · q${(s.queue || 0) + (s.active || 0)}${s.summariesEnabled ? '' : ' · AI off'}`;
    $('#net').title = `cache hits ${hit}% · ${((s.bytes || 0) / 1e6).toFixed(0)} MB fetched · queue ${(s.queue || 0) + (s.active || 0)} · ${s.summariesEnabled ? (s.summaries || 0) + ' summaries (' + s.model + ')' : 'summaries off: set ANTHROPIC_API_KEY'}`;
    emit('status', s);
  } catch { $('#net').textContent = 'server offline'; }
}
setInterval(pollStatus, 2000);

export async function boot() {
  await pollStatus();
  for (const [name, v] of views) if (v.key && !keymap.has(v.key)) registerKey(v.key, () => setView(name), { view: null });
  applyChrome(); paintSaved(); paintLanes(); paintWheel(); buildOrder(false);
  setView('feed');
  (await import('./route.js')).routeBoot();
  emit('boot');
}
