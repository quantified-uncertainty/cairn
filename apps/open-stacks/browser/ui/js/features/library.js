// Library: the whole corpus as a tree in the side panel — lanes, then folders
// (a wiki's own sidebar sections, topics, years, eras), then items.
//
// The side panel gets two tabs at its top, Item (the usual sections) and
// Library (this tree); L switches between them (and, while the tree is shown
// but not focused, puts the keyboard in it). In the tree: type to filter titles,
// ↑ ↓ move, → opens a folder (or steps into it), ← closes it (or steps out),
// Enter opens an item or browses a folder, Esc goes back to the page.
//
// Browsing a folder narrows the feed to it (state.scope, read by buildOrder in
// state.js): in tree order for lanes whose order matters (the QURI wikis, from
// corpus.json's laneOrdered), otherwise in the usual ranking. The lane chips
// stay; choosing a lane, or the ✕ by the folder's name, leaves the folder, and
// Back undoes either. Opening a wiki page from the tree browses its site, so
// Space goes on through the site in sidebar order.
//
// Data: build-corpus.mjs gives every item `path` (folder names under its lane)
// and `ord` (tree order); items without them sit directly under their lane.
// Scale: only the rows in view exist (a virtual list), lanes and folders start
// closed with the current item's branch open, and nothing here runs on a page
// turn or item switch except one tiny label in the header: the tree follows the
// current item on 'item:settled', and only while it is showing.
import { $, h, on, emit, store, registerKey, keyHelp } from '../util.js';
import { items, byId, LANES, COUNTS, LANE_COLORS, LANE_ORDERED } from '../corpus.js';
import { state, current, buildOrder } from '../state.js';
import { showFeed } from '../feed.js';
import { before, jumpTo } from '../nav.js';
import { setView, setLane, paintLanes, togglePanel } from '../chrome.js';

const RH = 24; // row height, px (matches library.css)
const SEP = '\u0001';

// ---------- the tree ----------
// node: { key, label, lane, depth, parent, kids: [{node} | {i}] in tree order, n, o, items: [i] (all below) }
let T = null; // { lanes: [lane nodes, in chip order], byKey: Map key → node }
const parentOf = new Map(); // item index → its folder node
function build() {
  if (T) return T;
  const byKey = new Map();
  const node = (key, label, lane, parent) => {
    const n = { key, label, lane, parent, depth: parent ? parent.depth + 1 : 0, kids: [], sub: new Map(), n: 0, o: Infinity, items: [] };
    byKey.set(key, n);
    if (parent) { parent.sub.set(label, n); parent.kids.push({ node: n }); }
    return n;
  };
  const lanes = Object.keys(LANES).filter((l) => COUNTS[l]).map((l) => node(l, LANES[l], l, null));
  const laneOf = new Map(lanes.map((n) => [n.lane, n]));
  items.forEach((it, i) => {
    let p = laneOf.get(it.lane);
    if (!p) { p = node(it.lane, LANES[it.lane] || it.lane, it.lane, null); lanes.push(p); laneOf.set(it.lane, p); }
    for (const name of Array.isArray(it.path) ? it.path : []) p = p.sub.get(name) || node(p.key + SEP + name, name, it.lane, p);
    p.kids.push({ i });
    parentOf.set(i, p);
    // Tree order; items without one (an older corpus.json) follow by quality.
    const o = it.ord ?? 1e6 + (1 - (it.q ?? 0.5)) * 1e4 + i * 1e-4;
    for (let a = p; a; a = a.parent) { a.n++; a.items.push(i); if (o < a.o) a.o = o; }
  });
  const ordOf = (k) => (k.node ? k.node.o : items[k.i].ord ?? 1e6 + (1 - (items[k.i].q ?? 0.5)) * 1e4 + k.i * 1e-4);
  for (const n of byKey.values()) n.kids.sort((a, b) => ordOf(a) - ordOf(b));
  T = { lanes, byKey };
  return T;
}
const ancestors = (i) => { const out = []; for (let a = parentOf.get(i); a; a = a.parent) out.push(a); return out; };
const crumbOf = (n) => { const out = []; for (let a = n; a; a = a.parent) out.unshift(a.label); return out; };

// ---------- open folders, filter, rows ----------
const userOpen = new Set(), userClosed = new Set();
let autoOpen = new Set(); // the current item's branch
let q = '', hay = null, match = null; // filter words; lowercase titles; Uint8Array of matching items
const fClosed = new Set(); // folders closed by hand while filtering
let rows = []; // { node, d } | { i, d }
let sel = null; // the cursor: 'n' + key or 'i' + index
const rowId = (r) => (r.node ? 'n' + r.node.key : 'i' + r.i);
const isOpen = (n) => (q ? !fClosed.has(n.key) : userOpen.has(n.key) || (autoOpen.has(n.key) && !userClosed.has(n.key)));

function setFilter(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  q = words.join(' ');
  fClosed.clear();
  if (!q) { match = null; flatten(); return; }
  build();
  hay ||= items.map((it) => `${it.t} ${it.a || ''}`.toLowerCase());
  match = new Uint8Array(items.length);
  // A folder whose name matches brings all its items along.
  const mark = (n, all) => {
    const hit = all || words.every((w) => n.label.toLowerCase().includes(w));
    n.m = 0;
    for (const k of n.kids) {
      if (k.node) n.m += mark(k.node, hit);
      else if (hit || words.every((w) => hay[k.i].includes(w))) { match[k.i] = 1; n.m++; }
    }
    return n.m;
  };
  for (const ln of T.lanes) mark(ln, false);
  flatten();
}
function flatten() {
  if (!T) return;
  const out = [];
  const walk = (n) => {
    for (const k of n.kids) {
      if (k.node) { if (q && !k.node.m) continue; out.push({ node: k.node, d: k.node.depth }); if (isOpen(k.node)) walk(k.node); }
      else if (!q || match[k.i]) out.push({ i: k.i, d: n.depth + 1 });
    }
  };
  for (const ln of T.lanes) { if (q && !ln.m) continue; out.push({ node: ln, d: 0 }); if (isOpen(ln)) walk(ln); }
  rows = out;
}
const selIndex = () => { if (sel == null) return -1; for (let r = 0; r < rows.length; r++) if (rowId(rows[r]) === sel) return r; return -1; };

// ---------- the scope: browsing one folder ----------
let scopeNode = null;
function setScope(n) {
  scopeNode = n || null;
  state.scope = n ? new Set(n.items) : null;
  store.set('libScope', n ? { lane: n.lane, path: crumbOf(n).slice(1) } : null);
  watchHead();
}
const findNode = (lane, path) => { build(); return T.byKey.get([lane, ...path].join(SEP)) || null; };
// Back: the lane switch or folder change it undoes also restores the folder.
const scopeUndo = [];
const SCOPED = /^(lane switch|browse folder|leave folder|browse results)$/;
on('nav:before', (s) => {
  if (!SCOPED.test(s.label)) return;
  scopeUndo.push(scopeNode); if (scopeUndo.length > 100) scopeUndo.shift();
  // A lane chip (or 0-9) or browsing search results leaves the folder.
  if (s.label === 'lane switch' || s.label === 'browse results') setScope(null);
});
on('nav', (d) => {
  if (d.type !== 'back' || !SCOPED.test(d.undone || '')) return;
  if (scopeUndo.length) setScope(scopeUndo.pop());
  paint();
});

/** Browse a folder (or a lane) in the feed, optionally starting at item `at`. */
function browse(n, at) {
  if (!n.parent) { // a lane: the whole lane
    if (state.lane === n.lane && !scopeNode) { if (at != null) openItem(at); else done(); return; }
    setLane(n.lane);
    if (at != null) openItem(at);
    done(); return;
  }
  before('browse folder', { lane: state.lane, order: state.order.slice() });
  state.lane = n.lane; store.set('lane', n.lane);
  setScope(n);
  buildOrder(false);
  if (at != null) { const p = state.order.indexOf(at); if (p >= 0) state.pos = p; }
  state.zoom = false;
  paintLanes();
  if (state.view !== 'feed') setView('feed'); else showFeed();
  emit('nav', { type: 'item', i: current(), it: items[current()] });
  done();
}
function leaveFolder() {
  if (!scopeNode) return;
  before('leave folder', { lane: state.lane, order: state.order.slice() });
  setScope(null);
  buildOrder(true);
  paint();
}
/** Open an item: in the feed's own order when it is part of what you are browsing; a wiki page browses its site; otherwise it comes next. */
function openItem(i) {
  const it = items[i];
  const inView = state.scope ? state.scope.has(i) : state.lane === it.lane;
  const p = inView ? state.order.indexOf(i) : -1;
  if (p >= 0) {
    if (p !== state.pos || state.view !== 'feed') {
      before('open from library');
      state.pos = p; state.zoom = false;
      if (state.view !== 'feed') setView('feed'); else showFeed();
      emit('nav', { type: 'item', i, it });
    }
  } else if (LANE_ORDERED[it.lane] && parentOf.get(i)) {
    const site = ancestors(i).at(-2) || ancestors(i).at(-1); // the folder just below the lane
    browse(site, i); return;
  } else jumpTo(i);
  done();
}
/** After acting from the tree, keys go back to the page; the filter stays for arrowing on, but typing starts a new one. */
let stale = false;
function done() { stale = !!q; if (list?.contains(document.activeElement) || document.activeElement === input) document.activeElement.blur(); }

// ---------- the label in the item header while browsing a folder ----------
// feed.js repaints the header on every turn; this re-adds one span to it.
let headObs = null;
function headCrumb() {
  const meta = $('#item-head .meta');
  if (!meta || !scopeNode || meta.querySelector('.lib-crumb')) return;
  const lane = meta.querySelector('.lane');
  const el = h('button', { className: 'lib-crumb', type: 'button', title: 'Browsing this folder (Library, L) · click to show it', textContent: '› ' + crumbOf(scopeNode).slice(1).join(' › '),
    onclick: () => { setMode(true, true); revealNode(scopeNode); } });
  if (lane) lane.after(el); else meta.prepend(el);
}
function watchHead() {
  if (scopeNode && !headObs) { headObs = new MutationObserver(headCrumb); headObs.observe($('#item-head'), { childList: true }); }
  if (!scopeNode && headObs) { headObs.disconnect(); headObs = null; }
  $('#item-head .lib-crumb')?.remove();
  headCrumb();
}

// ---------- the pane ----------
const main = $('#main');
const tabs = h('div', { className: 'lib-tabs', role: 'tablist', ariaLabel: 'Side panel' },
  h('button', { type: 'button', role: 'tab', className: 'lt-item', textContent: 'Item', title: 'About this item (L switches)', onclick: () => setMode(false) }),
  h('button', { type: 'button', role: 'tab', className: 'lt-lib', textContent: 'Library', title: 'Every lane as a tree of folders (L)', onclick: () => setMode(true, true) }),
  h('kbd', { className: 'lt-key', textContent: 'L', title: 'L switches between Item and Library' }));
const input = h('input', { type: 'search', className: 'lib-q', placeholder: 'Filter titles…', autocomplete: 'off', spellcheck: false, ariaLabel: 'Filter the library by title' });
const qn = h('span', { className: 'lib-qn' });
const scopeBar = h('div', { className: 'lib-scope', hidden: true });
const pad = h('div', { className: 'lib-pad' });
const slice = h('div', { className: 'lib-slice' });
const list = h('div', { className: 'lib-list', tabIndex: 0, role: 'tree', ariaLabel: 'Library' }, pad, slice);
const pane = h('aside', { id: 'lib', ariaLabel: 'Library' }, h('div', { className: 'lib-top' }, h('div', { className: 'lib-qbox' }, input, qn), scopeBar), list);
$('#panel').after(pane);
let on_ = store.get('libOn', false);
const showing = () => on_ && state.view === 'feed' && state.panel;

on('panel:painted', () => { if (!on_) $('#panel').prepend(tabs); });
function placeTabs() { if (on_) pane.prepend(tabs); else $('#panel').prepend(tabs); tabs.querySelector('.lt-item').classList.toggle('on', !on_); tabs.querySelector('.lt-lib').classList.toggle('on', on_); }

/** Show the Library (true) or the Item sections (false); focus: put the keyboard in the tree. */
function setMode(lib, focus = false) {
  if (lib && state.view !== 'feed') setView('feed');
  if (lib && !state.panel) togglePanel();
  on_ = lib; store.set('libOn', lib);
  main.classList.toggle('lib-on', lib);
  placeTabs();
  if (lib) {
    build();
    revealItem(current(), true);
    if (focus) list.focus({ preventScroll: true });
  } else if (pane.contains(document.activeElement)) document.activeElement.blur();
}
registerKey('L', () => {
  if (!showing()) setMode(true, true);
  else if (!pane.contains(document.activeElement)) { list.focus({ preventScroll: true }); revealItem(current(), true); }
  else setMode(false);
}, { view: null, help: ['L', 'library: every lane as a tree of folders, in the side panel (again: back to the item) · type to filter · ↑↓ →← · Enter opens or browses a folder · Esc'], order: 52 });

// ---------- painting ----------
let raf = 0;
const paint = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paintNow(); }); };
let progressOf = null; // memory.js, when it is loaded
// Reading progress per item and read counts per folder, kept until memory.js says an item changed.
const prog = new Map(), readN = new Map();
const progress = (i) => { if (!progressOf) return null; if (!prog.has(i)) prog.set(i, progressOf(items[i].id)); return prog.get(i); };
const readCount = (n) => { if (!progressOf) return 0; if (!readN.has(n.key)) { let k = 0; for (const i of n.items) if (progress(i)?.done) k++; readN.set(n.key, k); } return readN.get(n.key); };
const icons = new Map(); // item -> its icon, cloned for each paint
const icon = (i) => { if (!itemIcon) return h('span', { className: 'lr-b' }); if (!icons.has(i)) icons.set(i, itemIcon(items[i], 12)); return icons.get(i).cloneNode(true); };
function paintNow() {
  if (!showing() || !T) return;
  paintScope();
  qn.textContent = q ? String(match.reduce((s, x) => s + x, 0)) : '';
  pad.style.height = rows.length * RH + 'px';
  const top = list.scrollTop, H = list.clientHeight || 600;
  const a = Math.max(0, Math.floor(top / RH) - 6), b = Math.min(rows.length, Math.ceil((top + H) / RH) + 6);
  slice.style.transform = `translateY(${a * RH}px)`;
  const cur = current(), s = sel;
  const els = [];
  for (let r = a; r < b; r++) els.push(rowEl(rows[r], r, cur, s));
  slice.replaceChildren(...els);
  list.setAttribute('aria-activedescendant', s ? 'lib-sel' : '');
}
function rowEl(row, r, cur, s) {
  const id = rowId(row);
  const el = h('div', { className: 'lr', role: 'treeitem' });
  el.dataset.r = r;
  el.style.setProperty('--d', row.d);
  el.setAttribute('aria-level', row.d + 1);
  if (id === s) { el.classList.add('sel'); el.id = 'lib-sel'; el.setAttribute('aria-selected', 'true'); }
  if (row.node) {
    const n = row.node, open = isOpen(n);
    el.classList.add(n.parent ? 'lr-f' : 'lr-l');
    if (n === scopeNode) el.classList.add('scoped');
    if (cur != null && !open && ancestors(cur).includes(n)) el.classList.add('has-cur');
    el.setAttribute('aria-expanded', String(open));
    el.append(h('span', { className: 'lr-c', textContent: open ? '▾' : '▸' }));
    if (!n.parent) el.append(h('span', { className: 'lr-dot', style: `background:${LANE_COLORS[n.lane] || 'var(--ink-3)'}` }));
    el.append(h('span', { className: 'lr-t', textContent: n.label }));
    const read = readCount(n);
    el.append(h('span', { className: 'lr-n', textContent: q ? `${n.m}/${n.n}` : read ? `${read}/${n.n}` : String(n.n), title: q ? `${n.m} of ${n.n} match` : read ? `${read} of ${n.n} read` : `${n.n} items` }));
    el.append(h('button', { type: 'button', className: 'lr-go', tabIndex: -1, textContent: '▶', title: n.parent ? `Browse “${n.label}” in the feed (Enter)` : `Browse the ${n.label} lane (Enter)` }));
    el.title = crumbOf(n).join(' › ');
  } else {
    const it = items[row.i];
    el.classList.add('lr-i');
    if (row.i === cur) el.classList.add('cur');
    el.append(icon(row.i));
    el.append(h('span', { className: 'lr-t', textContent: it.t }));
    const p = progress(row.i);
    if (p) el.append(p.done ? h('span', { className: 'lr-p done', textContent: '✓', title: 'Read' })
      : h('span', { className: 'lr-p', title: p.n ? `${Math.round(p.frac * 100)}% seen` : 'Opened' }, h('i', { style: `width:${Math.max(12, Math.round(p.frac * 100))}%` })));
    el.title = [it.t, [it.a, it.y].filter(Boolean).join(', ')].filter(Boolean).join('\n');
  }
  return el;
}
function paintScope() {
  scopeBar.hidden = !scopeNode;
  if (!scopeNode) return;
  scopeBar.replaceChildren(
    h('span', { className: 'ls-l', textContent: 'Browsing' }),
    h('button', { type: 'button', className: 'ls-t', textContent: crumbOf(scopeNode).join(' › '), title: 'Show this folder', onclick: () => revealNode(scopeNode) }),
    h('button', { type: 'button', className: 'ls-x', textContent: '✕', title: `Leave this folder: the whole ${LANES[scopeNode.lane]} lane again (Back undoes)`, onclick: leaveFolder }));
}

// ---------- following the current item ----------
function revealItem(i, center = false) {
  if (i == null || !T) return;
  const anc = ancestors(i);
  autoOpen = new Set(anc.map((n) => n.key));
  for (const n of anc) userClosed.delete(n.key);
  if (q && !match[i]) { flatten(); paint(); return; }
  flatten();
  if (!pane.contains(document.activeElement) || center) sel = 'i' + i;
  scrollTo(selIndex(), center);
  paint();
}
function revealNode(n) {
  if (q) { input.value = ''; setFilter(''); }
  for (let a = n.parent; a; a = a.parent) { userOpen.add(a.key); userClosed.delete(a.key); }
  flatten(); sel = 'n' + n.key; scrollTo(selIndex(), true); paint();
  list.focus({ preventScroll: true });
}
function scrollTo(r, center) {
  if (r < 0) return;
  const H = list.clientHeight || 600, y = r * RH;
  if (center) { if (y < list.scrollTop + RH || y > list.scrollTop + H - 2 * RH) list.scrollTop = Math.max(0, y - H / 2 + RH / 2); }
  else if (y < list.scrollTop) list.scrollTop = y;
  else if (y + RH > list.scrollTop + H) list.scrollTop = y + RH - H;
}
on('item:settled', ({ i }) => { if (showing()) revealItem(i); });
on('view:changed', () => { if (showing()) { flatten(); paint(); } });
on('memory:updated', ({ id } = {}) => { prog.delete(byId.get(id)); readN.clear(); if (showing()) paint(); });
list.addEventListener('scroll', paint, { passive: true });
addEventListener('resize', paint);

// ---------- acting on rows ----------
function toggle(n, open = !isOpen(n)) {
  if (q) { if (open) fClosed.delete(n.key); else fClosed.add(n.key); }
  else if (open) { userOpen.add(n.key); userClosed.delete(n.key); }
  else { userOpen.delete(n.key); if (autoOpen.has(n.key)) userClosed.add(n.key); }
  flatten(); paint();
}
function activate(r) {
  const row = rows[r]; if (!row) return;
  sel = rowId(row);
  if (row.node) browse(row.node); else openItem(row.i);
  paint();
}
function move(r) {
  if (!rows.length) return;
  r = Math.max(0, Math.min(rows.length - 1, r));
  sel = rowId(rows[r]); scrollTo(r, false); paint();
}
list.addEventListener('click', (e) => {
  const el = e.target.closest('.lr'); if (!el) return;
  const r = Number(el.dataset.r), row = rows[r]; if (!row) return;
  sel = rowId(row);
  if (e.target.closest('.lr-go')) { activate(r); return; }
  if (row.node) toggle(row.node); else activate(r);
});
list.addEventListener('dblclick', (e) => { const el = e.target.closest('.lr-f, .lr-l'); if (el) activate(Number(el.dataset.r)); });
list.addEventListener('focus', () => { if (selIndex() < 0) { const c = current(); sel = c != null && rows.some((x) => x.i === c) ? 'i' + c : rows[0] ? rowId(rows[0]) : null; } paint(); });
list.addEventListener('blur', paint);

const page = () => Math.max(1, Math.floor((list.clientHeight || 600) / RH) - 1);
function treeKey(e) {
  const r = selIndex(), row = rows[r];
  switch (e.key) {
    case 'ArrowDown': move(r + 1); break;
    case 'ArrowUp': move(r < 0 ? 0 : r - 1); break;
    case 'PageDown': move(r + page()); break;
    case 'PageUp': move(r - page()); break;
    case 'Home': move(0); break;
    case 'End': move(rows.length - 1); break;
    case 'ArrowRight':
      if (row?.node) { if (!isOpen(row.node)) toggle(row.node, true); else move(r + 1); }
      break;
    case 'ArrowLeft':
      if (row?.node && isOpen(row.node)) toggle(row.node, false);
      else { const p = row?.node ? row.node.parent : row ? parentOf.get(row.i) : null; if (p) { const k = rows.findIndex((x) => x.node === p); if (k >= 0) move(k); } }
      break;
    case 'Enter': activate(r); break;
    case 'Escape': // clear the filter, then give the keys back to the page
      if (q) { input.value = ''; setFilter(''); revealItem(current(), true); } else done();
      break;
    default: return false;
  }
  return true;
}
list.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (treeKey(e)) { e.preventDefault(); e.stopPropagation(); return; }
  // Type to filter. Space still reaches the page (it is Advance), and so do Shift+letter
  // commands (L back to the item, I moves the panel…).
  if (e.key.length === 1 && e.key !== ' ' && !/[A-Z]/.test(e.key)) { e.preventDefault(); e.stopPropagation(); input.focus(); input.value = (stale ? '' : input.value) + e.key; onInput(); }
  else if (e.key === 'Backspace' && q) { e.preventDefault(); e.stopPropagation(); input.focus(); input.value = input.value.slice(0, -1); onInput(); }
});
function onInput() {
  stale = false;
  setFilter(input.value);
  // The cursor goes to the first matching item.
  const k = q ? rows.findIndex((x) => x.i != null) : -1;
  if (k >= 0) sel = rowId(rows[k]);
  list.scrollTop = 0;
  if (!q) revealItem(current(), true); else paint();
}
input.addEventListener('input', onInput);
input.addEventListener('keydown', (e) => {
  const r = selIndex();
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'PageDown' || e.key === 'PageUp') { treeKey(e); e.preventDefault(); }
  else if (e.key === 'Enter') { e.preventDefault(); activate(r < 0 ? rows.findIndex((x) => x.i != null) : r); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ''; onInput(); list.focus({ preventScroll: true }); } else done(); }
  else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); list.focus(); }
});

// ---------- optional helpers from other modules ----------
let itemIcon = null; // icons.js: a small type icon per item
async function helpers() {
  try { ({ itemIcon } = await import('../icons.js')); } catch { /* no icons */ }
  try {
    const f = await (await fetch('/features.json')).json();
    if ((f.js || []).some((m) => /\/memory\.js$/.test(m))) ({ progressOf } = await import('./memory.js'));
  } catch { /* no reading memory */ }
  paint();
}

// A folder chosen in an earlier session (the lane is restored by state.js; boot builds the order).
{
  const s = store.get('libScope', null);
  if (s && s.lane === state.lane && s.path?.length) { const n = findNode(s.lane, s.path); if (n) setScope(n); else store.set('libScope', null); }
}

on('boot', () => {
  main.classList.toggle('lib-on', on_);
  placeTabs();
  // Build when the browser is idle, so the first Library press is instant.
  (window.requestIdleCallback || ((f) => setTimeout(f, 200)))(() => { build(); flatten(); helpers().then(() => { if (showing()) revealItem(current(), true); }); });
});
keyHelp.push({ label: '→ ← ↵', text: 'library tree: open / close a folder · Enter opens an item or browses a folder in the feed', order: 53 });
