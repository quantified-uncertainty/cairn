// Tap zones (docs/navigation-ergonomics.md, item 7): a plain click on the left or
// right part of the pages turns back or forward, so the hand on the mouse or the
// trackpad can read on without aiming or reaching for a key. The zones are the
// outer fifth of the pages on each side and the empty stage beyond them; the
// middle keeps what a click did before (zoom into a page). Zoomed, only the
// stage outside the page reacts. Right is Advance (Space: the next spread, then
// the next item); left turns back a spread, and on an item's first spread it is
// Back (Backspace: so a right click that moved on is undone by a left one).
//
// It never fires for a click that selects text or clears a selection, a double
// click (the first click turned), a drag, a modifier (Alt+click reads aloud),
// a link, a button (margin notes are buttons), the wide-table opener, or a figure
// peek: those stop the click before it reaches the window, where this listens.
// A faint chevron at the edge shows when the pointer is in a zone.
// Settings › Navigation turns it off (store 'tapzones').
import { $, h, on, store } from '../util.js';
import { state, current } from '../state.js';
import { advance, back, turn, clickHolds } from '../nav.js';

const EDGE = 0.2, SLOP = 6, TAP_MS = 600;
let enabled = store.get('tapzones', true) !== false;
on('settings:changed', ({ key }) => { if (key === 'tapzones' || key === '*') { enabled = store.get('tapzones', true) !== false; cue(0); } });

const spread = $('#spread');
// The pages' extent, read once after each render, on the first pointer move or click
// that needs it, so a page turn itself never waits for a layout read.
let box = null;
on('spread:rendered', () => { box = null; });
addEventListener('resize', () => { box = null; });
function measure() {
  if (box) return box;
  const kids = spread.querySelectorAll(':scope > .pg'); // pages, or a post's sheet of columns (.pg.sheet)
  if (!kids.length) return null;
  const a = kids[0].getBoundingClientRect(), b = kids[kids.length - 1].getBoundingClientRect(), s = spread.getBoundingClientRect();
  return (box = { l: a.left, r: b.right, t: Math.min(a.top, b.top), b: Math.max(a.bottom, b.bottom), sl: s.left, sr: s.right });
}
const SKIP = 'a, button, input, textarea, select, label, summary, [contenteditable], [role="button"], .aug-pop, .wt-open, .fp-over, #fn-pop';
/** -1 (left zone), 1 (right) or 0, for a pointer at x over `target`. */
function zoneAt(x, target) {
  if (!enabled || state.view !== 'feed' || !target?.closest?.('#spread') || target.closest(SKIP)) return 0;
  const b = measure(); if (!b) return 0;
  if (state.zoom) return target.closest('.pg') ? 0 : x < b.l ? -1 : x > b.r ? 1 : 0;
  const w = b.r - b.l;
  return x < b.l + EDGE * w ? -1 : x > b.r - EDGE * w ? 1 : 0;
}

// ---------- the click ----------
let down = null;
const selected = () => { const s = getSelection(); return !!s && !s.isCollapsed && !!String(s).trim(); };
addEventListener('pointerdown', (e) => { down = e.button === 0 ? { x: e.clientX, y: e.clientY, t: performance.now(), sel: selected() } : null; }, true);
const verdict = new WeakMap(); // one decision per click, shared by the zoom hook and the turn
function decide(e) {
  if (verdict.has(e)) return verdict.get(e);
  let z = 0;
  if (e.button === 0 && e.detail === 1 && !e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey && down && !down.sel
    && Math.hypot(e.clientX - down.x, e.clientY - down.y) <= SLOP && performance.now() - down.t < TAP_MS && !selected()) z = zoneAt(e.clientX, e.target);
  verdict.set(e, z);
  return z;
}
clickHolds.push((e) => decide(e) !== 0); // a click in a zone does not also zoom (feed.js)
addEventListener('click', (e) => {
  if (e.defaultPrevented) return;
  const z = decide(e); if (!z) return;
  if (z > 0) { advance(e); return; }
  if ((state.start.get(current()) ?? 0) > 0) turn(-1); else back(e);
});

// ---------- the cue ----------
const mk = (side) => h('div', { className: 'tz-cue ' + side, ariaHidden: 'true', innerHTML: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${side === 'l' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'}"/></svg>` });
const cues = { '-1': mk('l'), 1: mk('r') };
document.body.append(cues[-1], cues[1]);
let shown = 0;
function cue(z) {
  if (z === shown) return;
  shown = z;
  for (const k of [-1, 1]) cues[k].classList.toggle('on', z === k);
  if (!z) return;
  const b = measure(); if (!b) return;
  const el = cues[z], top = (b.t + b.b) / 2 - 22;
  // Just outside the pages when there is room beside them, else just inside their edge.
  const x = z < 0 ? (b.l - b.sl > 34 ? b.l - 30 : b.l + 4) : (b.sr - b.r > 34 ? b.r + 2 : b.r - 32);
  el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(top) + 'px';
}
spread.addEventListener('pointermove', (e) => { if (e.buttons) { cue(0); return; } cue(zoneAt(e.clientX, e.target)); }, { passive: true });
spread.addEventListener('pointerleave', () => cue(0));
on('view:changed', () => cue(0));
on('item:shown', () => { box = null; });
