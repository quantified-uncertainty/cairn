// Search over titles, authors, lanes and reasons.
import { $, h, registerKey } from './util.js';
import { items, LANES } from './corpus.js';
import { state } from './state.js';
import { jumpTo, before } from './nav.js';
import { setView } from './chrome.js';

const hay = items.map((it) => [it.t, it.a, LANES[it.lane], it.why, it.y, (it.tags || []).join(' ')].join(' ').toLowerCase());
let results = []; let sel = 0;
function runSearch() {
  const q = $('#s-input').value.toLowerCase().split(/\s+/).filter(Boolean);
  results = q.length ? hay.map((x, i) => [x, i]).filter(([x]) => q.every((w) => x.includes(w))).map(([, i]) => i) : [];
  results.sort((a, b) => (items[b].score || 0) - (items[a].score || 0)); sel = 0; paintResults();
}
function paintResults() {
  $('#s-results').replaceChildren(...results.slice(0, 40).map((i, r) => h('li', { className: r === sel ? 'sel' : '', onclick: () => pick(i) },
    h('span', { className: 'st', textContent: items[i].t }), h('span', { className: 'sm', textContent: [LANES[items[i].lane], items[i].y].filter(Boolean).join(' · ') }))));
}
function pick(i, all = false) {
  $('#search').hidden = true;
  if (all && results.length) { before('browse results', { order: state.order.slice() }); state.order = results.slice(); state.pos = 0; setView('feed'); } else jumpTo(i);
}
export function openSearch() { $('#search').hidden = false; $('#s-input').select(); $('#s-input').focus(); }
$('#search-btn').onclick = openSearch;
$('#s-input').oninput = runSearch;
$('#s-input').onkeydown = (e) => {
  if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, Math.min(results.length, 40) - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paintResults(); e.preventDefault(); }
  else if (e.key === 'Enter' && results.length) pick(results[sel], e.shiftKey);
  else if (e.key === 'Escape') $('#search').hidden = true;
};
$('#search').onclick = (e) => { if (e.target.id === 'search') $('#search').hidden = true; };
registerKey('/', openSearch, { view: null, help: ['/', 'search (Shift+Enter: browse all results)'], order: 60 });
