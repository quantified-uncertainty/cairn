// Local telemetry: what you looked at, for how long, and how fast pages came
// up. Events go in batches to POST /events and are appended to
// CACHE/events.jsonl on this machine; nothing leaves it. /stats.html reads
// them back. Also sends the server a warm-up hint: your feed's first items
// per lane, so the next start warms what you will actually see first.
import { on, h, $, keymap } from '../util.js';
import { items } from '../corpus.js';
import { state, score } from '../state.js';
import { startOf } from '../prefetch.js';
import { isFlow } from '../docs.js';

const buf = [];
let keyCounts = {}; // key -> presses since the last batch
const push = (type, o = {}) => { buf.push({ t: Date.now(), type, ...o }); if (buf.length >= 50) flush(); };
function flush(beacon = false) {
  if (Object.keys(keyCounts).length) { buf.push({ t: Date.now(), type: 'keys', counts: keyCounts }); keyCounts = {}; }
  if (!buf.length) return;
  const body = JSON.stringify(buf.splice(0));
  if (beacon && navigator.sendBeacon) navigator.sendBeacon('/events', new Blob([body], { type: 'text/plain' }));
  else fetch('/events', { method: 'POST', body, keepalive: true }).catch(() => {});
}
setInterval(flush, 15000);
push('session', { vw: innerWidth, vh: innerHeight });

// ---- dwell: active seconds per item (tab visible, feed view, some input in the last 5 minutes)
let cur = null; // { id, lane, ms, turns }
let lastInput = Date.now();
for (const ev of ['keydown', 'wheel', 'mousemove', 'mousedown']) addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true });
setInterval(() => { if (cur && !document.hidden && state.view === 'feed' && Date.now() - lastInput < 300e3) cur.ms += 1000; }, 1000);
function endDwell() { if (cur?.ms) { push('dwell', { id: cur.id, lane: cur.lane, ms: cur.ms, turns: cur.turns }); cur.ms = 0; cur.turns = 0; } }
document.addEventListener('visibilitychange', () => { if (document.hidden) { endDwell(); flush(true); } });
addEventListener('pagehide', () => { endDwell(); flush(true); });

// ---- latency: from the key press or click that caused a navigation to the spread being on screen
let input = { t: 0, k: '' }; // event timestamps share performance.now()'s clock
document.addEventListener('keydown', (e) => {
  input = { t: e.timeStamp, k: e.key };
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
  if (keymap.has(e.key) || /^[0-9]$/.test(e.key)) keyCounts[e.key] = (keyCounts[e.key] || 0) + 1;
}, true);
for (const ev of ['mousedown', 'wheel']) document.addEventListener(ev, (e) => { input = { t: e.timeStamp, k: ev }; }, { passive: true, capture: true });
let pending = null; // { nav, i, t0 }
const startT = () => { const now = performance.now(); return now - input.t < 500 ? input.t : now; };

on('nav', ({ type, i }) => { pending = { nav: type, i, t0: startT() }; });
on('item:shown', ({ i, it }) => {
  endDwell();
  cur = { id: it.id, lane: it.lane, ms: 0, turns: 0 };
  push('shown', { id: it.id, lane: it.lane, kind: it.kind });
  // Lane switches and other re-orders show a new item without a nav event.
  if (!pending || pending.i !== i) pending = { nav: /^[0-9]$/.test(input.k) && performance.now() - input.t < 500 ? 'lane' : 'item', i, t0: startT() };
});
let booted = false;
on('spread:rendered', ({ i, it }) => {
  const now = performance.now();
  if (!booted) { booted = true; push('boot', { ms: Math.round(now) }); pending = null; return; }
  if (!pending || pending.i !== i) return;
  if (pending.nav === 'turn' && cur) cur.turns++;
  push('lat', { nav: pending.nav, id: it.id, kind: it.kind, ms: Math.round(now - pending.t0) });
  pending = null;
});
on('view:changed', ({ view }) => push('view', { view }));
on('summary:updated', ({ id }) => push('summary', { id }));

// ---- warm-up hint: the first 20 items of each lane in your order, with the page each opens at
function sendHint() {
  const byLane = {};
  items.forEach((it, i) => (byLane[it.lane] ||= []).push(i));
  const lanes = {};
  for (const [lane, list] of Object.entries(byLane)) {
    lanes[lane] = list.map((i) => [i, score(i)]).sort((a, b) => b[1] - a[1]).slice(0, 20)
      .map(([i]) => [items[i].id, isFlow(items[i]) ? 0 : startOf(i), state.per]);
  }
  fetch('/warm/hint', { method: 'POST', body: JSON.stringify({ lanes }) }).catch(() => {});
}
on('boot', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(sendHint), 8000));

// ---- links to the stats page: Saved panel (b) and the keys overlay (?)
const link = () => h('a', { href: '/stats.html', target: '_blank', textContent: 'Reading stats', title: 'Time spent, items viewed and page-turn speed (local only)' });
$('#saved')?.append(h('p', { className: 'tm-stats' }, link()));
$('#keys .k-foot')?.append(' ', link(), ' (local only).');
