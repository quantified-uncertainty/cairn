// The leader key (docs/navigation-ergonomics.md, item 4): ' (or F19), then one
// home-row letter, for the commands used less often: lanes, views, sorts, staying
// in a tag, the export tray, flagging, find, the skim path, the Library. Every
// one keeps its own key; the leader is a way to reach them with no Shift and no
// number row. A card lists the second keys if none comes within 300 ms; Esc, the
// leader again, a click or another window cancels.
//
// ' is free in every view, unshifted, and on the home row of both of the reader's
// keyboards: the right pinky's outer key on a Colemak-DH laptop (as on QWERTY)
// and on a Glove80. F19 is for a keyboard layer or mouse software (nav.js binds
// F16-F18). Second keys are matched by e.key, so firmware layouts work; Settings ›
// Navigation picks the Colemak-DH home row (a r s t g · m n e i o, the default)
// or QWERTY's (a s d f g · h j k l ;): the same places, other letters.
//
// While the card is up, the keyboard goes to a read-only input inside it, so the
// views' own capture-phase key maps (wall.js, feeds.js…), which leave inputs
// alone, do not also act on the second key.
import { h, registerKey, keymap, keyHelp, store, toast, on } from '../util.js';
import { LANES, COUNTS } from '../corpus.js';
import { state } from '../state.js';
import { setLane, setView, viewList } from '../chrome.js';
import { SORTS, setSort } from '../stack.js';

const ROWS = { 'colemak-dh': ['a', 'r', 's', 't', 'g', 'm', 'n', 'e', 'i', 'o'], qwerty: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'] };
let row = ROWS[store.get('leaderRow', 'colemak-dh')] || ROWS['colemak-dh'];
on('settings:changed', ({ key }) => { if (key === 'leaderRow' || key === '*') row = ROWS[store.get('leaderRow', 'colemak-dh')] || ROWS['colemak-dh']; });
const SHOW_MS = 300, IDLE_MS = 10000;

/** Run what key `k` does in this view; a Reader-only key from another view opens the Reader first. */
function press(k) {
  let b = keymap.get(k);
  const find = () => { let x = keymap.get(k); while (x && x.view && x.view !== state.view) x = x.else; return x; };
  b = find();
  if (!b) {
    let r = keymap.get(k); while (r && r.view !== 'feed') r = r.else;
    if (!r) { toast('Not available here', { icon: 'info', kind: 'edge', sub: `the ${k} key is not bound` }); return; }
    setView('feed'); b = r;
  }
  b.fn({ key: k, shiftKey: false, repeat: false, leader: true, preventDefault() {}, stopPropagation() {}, target: document.body });
}
const has = (k) => keymap.has(k);
const lanes = () => ['all', ...Object.keys(LANES).filter((l) => COUNTS[l])];
function stepLane(d) {
  const ls = lanes(), j = ls.indexOf(state.lane), n = ls[(j + d + ls.length) % ls.length];
  setLane(n);
  toast(n === 'all' ? 'All lanes' : LANES[n] || n, { icon: d > 0 ? 'skip-forward' : 'skip-back', kind: 'mode', sub: `lane ${ls.indexOf(n) + 1} of ${ls.length} · ' ${row[d > 0 ? 6 : 5]} again for the ${d > 0 ? 'next' : 'previous'}` });
}

// Slots are places on the home row, left hand then right; the letters come from `row`.
// [slot, label, run, available?]; a run that returns a menu opens it as a second card.
const MAIN = () => [
  [0, 'Library: the stack', () => press('L'), () => has('L')],
  [1, 'report a problem (flag ⚑)', () => press('!'), () => has('!')],
  [2, 'sort ▸', () => sortMenu()],
  [3, 'stay in the next tag', () => press(';'), () => has(';')],
  [4, 'guide: skim path on/off', () => press('T'), () => has('T')],
  [5, 'previous lane', () => stepLane(-1)],
  [6, 'next lane', () => stepLane(1)],
  [7, 'export tray', () => press('E'), () => has('E')],
  [8, 'find in this item', () => press('F'), () => has('F')],
  [9, 'views ▸', () => viewMenu()],
];
function sortMenu() {
  return { title: 'Sort', items: Object.entries(SORTS).map(([k, label], j) => [j, label + (state.sort === k ? ' ✓' : ''), () => {
    if (setSort(k)) toast(label, { icon: 'arrow-down-up', kind: 'mode', sub: `${state.pos + 1} of ${state.order.length}` });
    else toast(state.sort === k ? `Already ${label}` : `${label}: not for this stack`, { icon: 'arrow-down-up', kind: 'edge' });
  }]) };
}
function viewMenu() {
  const vs = viewList().map(([name, v]) => [v.label + (state.view === name ? ' ✓' : ''), () => setView(name)]);
  if (has('O')) vs.push(['every page of this item', () => press('O')]);
  return { title: 'Views', items: vs.slice(0, 10).map(([label, fn], j) => [j, label, fn]) };
}

// ---------- the card ----------
let card = null, sink = null, menu = null, prev = null, showT = 0, idleT = 0;
function build() {
  sink = h('input', { className: 'ld-sink', readOnly: true, tabIndex: -1, ariaLabel: 'Leader key: press a letter, Esc cancels' });
  card = h('div', { id: 'leader', role: 'menu', hidden: true });
  document.body.append(card);
  sink.addEventListener('keydown', onKey);
  sink.addEventListener('blur', () => { if (menu) disarm(false); });
}
function paint() {
  const live = menu.items.filter((x) => !x[3] || x[3]());
  const cell = (slot) => { const x = live.find((y) => y[0] === slot); return h('div', { className: 'ld-k' + (x ? '' : ' off') }, h('kbd', { textContent: row[slot] }), h('span', { textContent: x ? x[1] : '' })); };
  card.replaceChildren(
    h('div', { className: 'ld-h' }, h('kbd', { textContent: "'" }), ' ', menu.title || 'then', h('span', { className: 'ld-x', textContent: menu.title ? '⌫ back · Esc cancels' : 'Esc cancels' })),
    h('div', { className: 'ld-hands' }, h('div', { className: 'ld-half' }, ...[0, 1, 2, 3, 4].map(cell)), h('div', { className: 'ld-half' }, ...[5, 6, 7, 8, 9].map(cell))),
    sink);
}
function arm() {
  if (menu) { disarm(); return; } // the leader again cancels
  if (!card) build();
  prev = document.activeElement;
  menu = { items: MAIN() };
  paint();
  card.hidden = false; card.classList.remove('show');
  sink.focus({ preventScroll: true });
  clearTimeout(showT); showT = setTimeout(() => card.classList.add('show'), SHOW_MS);
  clearTimeout(idleT); idleT = setTimeout(() => disarm(), IDLE_MS);
}
function disarm(refocus = true) {
  if (!menu) return;
  menu = null; clearTimeout(showT); clearTimeout(idleT);
  card.hidden = true; card.classList.remove('show');
  if (document.activeElement === sink) {
    if (refocus && prev?.isConnected && prev !== document.body) prev.focus({ preventScroll: true }); else sink.blur();
  }
}
function onKey(e) {
  if (/^(Shift|Control|Alt|Meta|CapsLock|Fn|OS)$/.test(e.key)) return;
  if (e.metaKey || e.ctrlKey) { disarm(); return; } // ⌘ shortcuts work as always
  e.preventDefault(); e.stopPropagation();
  if (e.repeat) return;
  if (e.key === 'Escape' || e.key === "'" || e.key === 'F19') { disarm(); return; }
  if (e.key === 'Backspace' && menu.title) { menu = { items: MAIN() }; paint(); return; }
  const slot = row.indexOf(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const x = menu.items.find((y) => y[0] === slot && (!y[3] || y[3]()));
  if (!x) { disarm(); toast(e.key.length === 1 ? `No ' ${e.key} command` : 'Leader cancelled', { icon: 'keyboard', kind: 'edge', sub: "' then wait a moment: a card lists them" }); return; }
  disarm();
  const sub = x[2]();
  if (sub?.items) { // a second card: same places, same letters
    prev = document.activeElement; menu = sub; paint();
    card.hidden = false; card.classList.add('show'); sink.focus({ preventScroll: true });
    clearTimeout(idleT); idleT = setTimeout(() => disarm(), IDLE_MS);
  }
}
document.addEventListener('pointerdown', (e) => { if (menu && !card.contains(e.target)) disarm(false); }, true);
on('view:changed', () => { if (menu && !menu.title) disarm(false); });

registerKey(["'", 'F19'], arm, { view: null });
// The ? overlay reads `text` when it opens, so it names the letters of the row in use.
keyHelp.push({ label: "' F19", order: 7, get text() {
  const L = (j) => row[j];
  return `leader, then one home-row letter (a card lists them after a moment; Esc cancels): ${L(0)} Library · ${L(1)} flag · ${L(2)} sort… · ${L(3)} next tag · ${L(4)} skim path · ${L(5)} ${L(6)} previous / next lane · ${L(7)} export tray · ${L(8)} find · ${L(9)} views… (Settings › Navigation: Colemak-DH or QWERTY letters)`;
} });
