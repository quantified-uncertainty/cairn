// Everything around the pages: views, lanes, the panel toggle, saved items,
// the keys overlay, the key dispatcher and the server status line.
import { $, h, on, emit, views, registerView, registerKey, keymap, keyHelp, store } from './util.js';
import { items, LANES, COUNTS, byId } from './corpus.js';
import { state, buildOrder } from './state.js';
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

function paintViews() {
  const list = [...views.entries()].sort((a, b) => (a[1].order ?? 50) - (b[1].order ?? 50));
  $('#views').replaceChildren(...list.map(([name, v]) => h('button', {
    className: state.view === name ? 'on' : '', title: v.key ? `${v.label} (${v.key})` : v.label,
    onclick: () => setView(name), textContent: v.label,
  })));
}
on('views:changed', () => {
  paintViews();
  for (const [name, v] of views) if (v.key && !keymap.has(v.key)) registerKey(v.key, () => setView(name), { view: null });
});

registerView('feed', { label: 'Feed', key: 'f', order: 0, roots: () => [$('#stage'), $('#panel')], show: () => showFeed() });

export function paintLanes() {
  const all = [['all', 'All', items.length], ...Object.entries(LANES).map(([k, v]) => [k, v, COUNTS[k] || 0]).filter(([, , c]) => c)];
  $('#lanes').replaceChildren(...all.map(([k, label, c], d) => h('button', {
    className: state.lane === k ? 'on' : '', title: d < 10 ? `${label} · key ${d}` : label,
    onclick: () => setLane(k),
  }, label, h('span', { className: 'n', textContent: String(c) }))));
}
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
keyHelp.push({ label: 'f w', text: 'feed / wall (other views have their own keys)', order: 62 }, { label: '0 1 … 9', text: 'lanes', order: 63 });

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (!$('#keys').hidden && k === 'Escape') { $('#keys').hidden = true; return; }
  if (/^[0-9]$/.test(k)) { const lanes = ['all', ...Object.keys(LANES).filter((l) => COUNTS[l])]; if (lanes[Number(k)] && !e.repeat) setLane(lanes[Number(k)]); return; }
  const b = keymap.get(k);
  if (!b || (b.view && b.view !== state.view)) return;
  e.preventDefault();
  if (e.repeat && !b.repeat) return; // one press, one step
  b.fn(e);
});
let rz = null;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(refresh, 150); });

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
  emit('boot');
}
