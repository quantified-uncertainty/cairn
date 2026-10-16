// Peek: rest the pointer on a small card and a preview opens beside it, at
// most 420 px wide and only as tall as what it shows, so the rest of the view
// stays in sight. Pinned (z), or for a root attached with { panel: true } (the
// page overview), it is a panel the full height under the bar on the side away
// from the card. Over the content: nothing in the view moves when it opens,
// swaps or closes.
//
//   attachPeek(root, { selector, cardOf(el), render(card, body, ctx), delay, grace, width, panel, onOpen, onClose }) -> detach()
//     width: the hover preview's (default 420); render's ctx: { width, height (the most it may take), pinned, live() }
//   showPeek(root, card, el)  open or swap at once (keyboard selection while pinned)
//   closePeek()  ·  pinPeek(on)  ·  peekState() -> { open, pinned, card, side }
//
// Used by the Feeds view (features/feeds.js), the Figures river
// (features/figures.js) and the page overview (features/overview.js). Styles
// live in ui/features/feeds.css (#pk-panel, pk-; #pk-panel.card is the preview).
// Only real pointer movement counts: content scrolling under a still pointer
// (Chrome sends mouse events then) never opens or swaps anything. Scrolling closes
// an open panel (unless pinned) and keeps it shut for a moment, the pointer has to
// rest about half a second, and P turns hover previews off (Enter, the keyboard
// selection and pinning still work).
import { h, on, store, toast, registerKey } from '../util.js';

const panel = h('aside', { id: 'pk-panel', hidden: true });
panel.setAttribute('aria-label', 'Preview');
const pinMark = h('div', { className: 'pk-pin', textContent: 'Pinned · z to unpin' });
const body = h('div', { className: 'pk-body' });
panel.append(pinMark, body);
document.body.append(panel);

const P = { open: false, pinned: false, full: false, card: null, el: null, side: 'right', root: null, o: null, t0: 0, gen: 0, top: 0, w: 0, maxH: 0, anchor: 0, h: 0, inPanel: false };
const roots = new Map(); // root -> options
let restT = null, closeT = null, swapT = null;
let px = -1, py = -1, vx = 0; // last pointer position; smoothed horizontal speed

const panelW = () => Math.round(Math.max(380, Math.min(760, innerWidth * 0.34))); // pinned: a third of the window, the columns stay in view
const CARD_W = 420, GAP = 16, M = 8; // a hover preview: its width, its gap to the card, its margin to the window's edges
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const towardPanel = () => (P.side === 'right' ? vx > 2.5 : vx < -2.5);
/** A hover preview's top: level with the card, moved up as far as its height `hh` needs to stay on screen. */
const fitTop = (hh) => Math.round(Math.max(P.top, Math.min(P.anchor, innerHeight - M - (hh || 0))));

function place(el, root) {
  // One layout read per open or swap: the bar, and where the card is.
  const bar = document.getElementById('bar');
  const top = bar ? Math.round(bar.getBoundingClientRect().bottom) : 0;
  const r = el?.isConnected ? el.getBoundingClientRect() : null;
  const s = panel.style;
  P.full = P.pinned || !!roots.get(root)?.panel;
  if (P.full) {
    const W = panelW();
    P.side = r && (r.left + r.right) / 2 > innerWidth - W ? 'left' : 'right';
    P.top = top; P.w = W; P.maxH = innerHeight - top;
    Object.assign(s, { top: top + 'px', left: '', width: W + 'px', maxHeight: '' });
  } else {
    // Beside the card: on its right when it fits there, else on its left, else on the roomier side over the card's edge.
    const W = Math.min(roots.get(root)?.width || CARD_W, innerWidth - 2 * M);
    let side = 'right', x = innerWidth - M - W;
    if (r) {
      const roomR = innerWidth - M - GAP - r.right, roomL = r.left - GAP - M;
      side = roomR >= W ? 'right' : roomL >= W ? 'left' : roomR >= roomL ? 'right' : 'left';
      x = Math.max(M, Math.min(innerWidth - M - W, side === 'right' ? r.right + GAP : r.left - GAP - W));
    }
    P.side = side; P.w = W; P.top = top + M; P.maxH = innerHeight - P.top - M;
    P.anchor = r ? Math.round(r.top) : P.top;
    // The last preview's height is the first guess; the ResizeObserver below corrects it before the frame is painted.
    Object.assign(s, { top: fitTop(P.h) + 'px', left: Math.round(x) + 'px', width: W + 'px', maxHeight: P.maxH + 'px' });
  }
  panel.classList.toggle('card', !P.full);
  panel.classList.toggle('left', P.full && P.side === 'left');
}
// A hover preview grows as it fills (pictures decode, a figure strip arrives): keep its bottom on
// screen. The observer runs after layout, so this reads nothing the browser has not just computed.
if (typeof ResizeObserver === 'function') new ResizeObserver((es) => {
  if (!P.open || P.full) return;
  const e = es[es.length - 1];
  const hh = e.borderBoxSize?.[0]?.blockSize ?? panel.offsetHeight;
  if (!hh) return;
  P.h = hh; panel.style.top = fitTop(hh) + 'px';
}).observe(panel);
function paint(card, el, root) {
  const o = roots.get(root); if (!o) return;
  const gen = ++P.gen;
  P.card = card; P.el = el; P.root = root; P.o = o;
  body.replaceChildren(); body.scrollTop = 0; body.onclick = null;
  const ctx = { width: P.w, height: P.maxH, pinned: P.pinned, live: () => gen === P.gen && P.open };
  try {
    const r = o.render(card, body, ctx);
    if (r?.catch) r.catch((e) => console.warn('peek render', e));
  } catch (e) { console.warn('peek render', e); }
}
function open(root, card, el) {
  clearTimeout(closeT); clearTimeout(swapT); clearTimeout(restT);
  const was = P.open;
  if (was && P.card === card) return;
  if (was) { endTiming(); }
  place(el, root);
  P.open = true; P.t0 = performance.now();
  panel.hidden = false;
  paint(card, el, root);
  if (!was) {
    const dx = (P.side === 'right' ? 1 : -1) * (P.full ? 16 : 8);
    panel.animate(reduced() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: 'none' }], { duration: 120, easing: 'ease-out' });
    addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
  }
  roots.get(root)?.onOpen?.(card, el);
}
function endTiming() {
  const o = P.o, card = P.card;
  if (o?.onClose && card) o.onClose(card, Math.round(performance.now() - P.t0));
}
/** Close the panel (Esc, a click outside, leaving, a view change). */
export function closePeek() {
  clearTimeout(restT); clearTimeout(closeT); clearTimeout(swapT);
  if (!P.open) return;
  endTiming();
  P.open = false; P.card = null; P.el = null; P.gen++;
  panel.hidden = true; body.replaceChildren();
  removeEventListener('keydown', onKey, true);
  document.removeEventListener('pointerdown', onDown, true);
}
/** Open or swap at once, without the rest delay. */
export function showPeek(root, card, el) { if (card && roots.has(root)) open(root, card, el); }
/** Pin (the panel stays when the pointer leaves) or unpin; no argument toggles. */
export function pinPeek(on) {
  P.pinned = on === undefined ? !P.pinned : !!on;
  panel.classList.toggle('pinned', P.pinned);
  // A hover preview that gets pinned grows into the full panel, drawn again at that size.
  if (P.pinned && P.open && !P.full && P.card) { place(P.el, P.root); paint(P.card, P.el, P.root); }
  return P.pinned;
}
export const peekState = () => ({ open: P.open, pinned: P.pinned, card: P.card, side: P.side, el: P.el, root: P.root });

/** Close after `grace` outside both the card and the panel; longer while the pointer heads for the panel. */
function scheduleClose(fromPanel = false) {
  if (P.pinned || !P.open) return;
  clearTimeout(closeT);
  const g = P.o?.grace ?? 250;
  closeT = setTimeout(() => { if (!P.inPanel && !P.pinned) closePeek(); }, !fromPanel && towardPanel() ? Math.max(450, g) : g);
}
function onKey(e) {
  if (e.key !== 'Escape' || !P.open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (!document.getElementById('keys')?.hidden || document.getElementById('search')?.hidden === false) return;
  e.preventDefault(); e.stopImmediatePropagation();
  pinPeek(false); closePeek();
}
function onDown(e) {
  if (!P.open || panel.contains(e.target)) return;
  const o = P.o; const el = o && e.target.closest?.(o.selector);
  if (el && P.root?.contains(el)) return; // a click on a card is the card's own business
  pinPeek(false); closePeek();
}

panel.addEventListener('pointerenter', () => { P.inPanel = true; clearTimeout(closeT); clearTimeout(swapT); clearTimeout(restT); });
panel.addEventListener('pointerleave', () => { P.inPanel = false; vx = 0; scheduleClose(true); });

// Hover previews on or off (P); scrolling shuts them for a moment.
let hoverOn = store.get('peekHover', true), lastScroll = 0;
const SCROLL_QUIET = 700;
registerKey('P', () => {
  hoverOn = !hoverOn; store.set('peekHover', hoverOn);
  if (!hoverOn && !P.pinned) closePeek();
  toast(hoverOn ? 'Previews on hover' : 'No previews on hover', { icon: hoverOn ? 'app-window' : 'search-x', kind: 'mode', sub: hoverOn ? 'Rest the pointer on a card · P turns them off' : 'Enter or z still opens one · P turns them back on' });
}, { help: ['P', 'hover previews in Feeds and Figures on or off'], order: 56, view: null });

/** Watch `root` for cards to peek at. Returns a function that stops watching. */
export function attachPeek(root, { selector, cardOf, render, delay = 450, grace = 250, width = CARD_W, panel: full = false, onOpen, onClose } = {}) {
  delay = Math.max(delay, 450); // a deliberate rest, not a pass on the way somewhere else
  const o = { selector, cardOf, render, delay, grace, width, panel: full, onOpen, onClose };
  roots.set(root, o);
  let restEl = null, ax = 0, ay = 0;
  // Scrolling (wheel or trackpad, the columns or the page) closes an unpinned panel and
  // keeps previews shut until the scrolling has stopped for a moment.
  const scrolled = () => {
    lastScroll = performance.now();
    clearTimeout(restT); clearTimeout(swapT); restEl = null;
    if (P.open && !P.pinned && P.root === root) closePeek();
  };
  root.addEventListener('wheel', scrolled, { passive: true });
  root.addEventListener('scroll', scrolled, { passive: true, capture: true });
  const move = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (e.clientX === px && e.clientY === py) return; // content scrolled under a still pointer
    vx = vx * 0.6 + (e.clientX - (px < 0 ? e.clientX : px)) * 0.4;
    px = e.clientX; py = e.clientY;
    if (!hoverOn || performance.now() - lastScroll < SCROLL_QUIET) { clearTimeout(restT); restEl = null; return; }
    let el = e.target.closest?.(selector);
    if (el && !root.contains(el)) el = null;
    const card = el ? cardOf(el) : null;
    if (!card) el = null;
    if (P.open && P.root === root) {
      if (el === P.el) { clearTimeout(closeT); clearTimeout(swapT); return; }
      if (!el) { clearTimeout(swapT); scheduleClose(); return; }
      clearTimeout(closeT);
      // Another card. Swap at once, unless the pointer is on its way to the
      // panel across other cards (then only if it rests), or the panel is pinned.
      clearTimeout(swapT);
      const wait = P.pinned ? delay : towardPanel() ? 140 : 0;
      if (!wait) open(root, card, el);
      else swapT = setTimeout(() => { if (cardOf(el) === card && el.isConnected) open(root, card, el); }, wait);
      return;
    }
    // Closed: open once the pointer rests on a card. Small jitters count as rest.
    if (!el) { clearTimeout(restT); restEl = null; return; }
    if (el !== restEl || Math.abs(e.clientX - ax) > 6 || Math.abs(e.clientY - ay) > 6) {
      restEl = el; ax = e.clientX; ay = e.clientY;
      clearTimeout(restT);
      restT = setTimeout(() => { if (restEl === el && el.isConnected) { const c = cardOf(el); if (c) open(root, c, el); } }, delay);
    }
  };
  const leave = () => { clearTimeout(restT); restEl = null; if (P.open && P.root === root) scheduleClose(); };
  root.addEventListener('pointermove', move, { passive: true });
  root.addEventListener('pointerleave', leave);
  return () => {
    root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave);
    root.removeEventListener('wheel', scrolled); root.removeEventListener('scroll', scrolled, { capture: true });
    roots.delete(root); if (P.root === root) closePeek();
  };
}

/** An image that starts from an already loaded (smaller) source and swaps in
 *  a sharper one once decoded. */
export function sharpImg(src, hi, { alt = '', cls = '', referrer = false } = {}) {
  const im = h('img', { src, alt, className: cls, decoding: 'async', draggable: false });
  if (referrer) im.referrerPolicy = 'no-referrer';
  if (hi && hi !== src) {
    const big = new Image();
    if (referrer) big.referrerPolicy = 'no-referrer';
    big.src = hi;
    big.decode().then(() => { if (im.isConnected) im.src = hi; }).catch(() => {});
  }
  return im;
}

on('view:changed', () => { pinPeek(false); closePeek(); });
