// Peek: rest the pointer on a small card and it opens large in a panel on the
// right (or on the left when the card lies under that side), over the
// content. Nothing in the view moves when it opens, swaps or closes.
//
//   attachPeek(root, { selector, cardOf(el), render(card, body, ctx), delay, grace, onOpen, onClose }) -> detach()
//   showPeek(root, card, el)  open or swap at once (keyboard selection while pinned)
//   closePeek()  ·  pinPeek(on)  ·  peekState() -> { open, pinned, card, side }
//
// Used by the Feeds view (features/feeds.js) and the Figures river
// (features/figures.js). Styles live in ui/features/feeds.css (#pk-panel, pk-).
// Only real pointer movement counts: content scrolling under a still pointer
// (Chrome sends mouse events then) never opens or swaps anything.
import { h, on } from '../util.js';

const panel = h('aside', { id: 'pk-panel', hidden: true });
panel.setAttribute('aria-label', 'Preview');
const pinMark = h('div', { className: 'pk-pin', textContent: 'Pinned · z to unpin' });
const body = h('div', { className: 'pk-body' });
panel.append(pinMark, body);
document.body.append(panel);

const P = { open: false, pinned: false, card: null, el: null, side: 'right', root: null, o: null, t0: 0, gen: 0, top: 0, w: 0, inPanel: false };
const roots = new Map(); // root -> options
let restT = null, closeT = null, swapT = null;
let px = -1, py = -1, vx = 0; // last pointer position; smoothed horizontal speed

const panelW = () => Math.round(Math.max(480, Math.min(1400, innerWidth * 0.42)));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const towardPanel = () => (P.side === 'right' ? vx > 2.5 : vx < -2.5);

function place(el) {
  // One layout read per open or swap: which side keeps the card visible.
  const W = panelW();
  const bar = document.getElementById('bar');
  const top = bar ? Math.round(bar.getBoundingClientRect().bottom) : 0;
  let side = 'right';
  if (el?.isConnected) { const r = el.getBoundingClientRect(); if ((r.left + r.right) / 2 > innerWidth - W) side = 'left'; }
  P.side = side; P.top = top; P.w = W;
  panel.style.top = top + 'px';
  panel.style.width = W + 'px';
  panel.classList.toggle('left', side === 'left');
}
function paint(card, el, root) {
  const o = roots.get(root); if (!o) return;
  const gen = ++P.gen;
  P.card = card; P.el = el; P.root = root; P.o = o;
  body.replaceChildren(); body.scrollTop = 0; body.onclick = null;
  const ctx = { width: P.w, height: innerHeight - P.top, pinned: P.pinned, live: () => gen === P.gen && P.open };
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
  place(el);
  P.open = true; P.t0 = performance.now();
  panel.hidden = false;
  paint(card, el, root);
  if (!was) {
    const dx = P.side === 'right' ? 16 : -16;
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

/** Watch `root` for cards to peek at. Returns a function that stops watching. */
export function attachPeek(root, { selector, cardOf, render, delay = 200, grace = 250, onOpen, onClose } = {}) {
  const o = { selector, cardOf, render, delay, grace, onOpen, onClose };
  roots.set(root, o);
  let restEl = null, ax = 0, ay = 0;
  const move = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    if (e.clientX === px && e.clientY === py) return; // content scrolled under a still pointer
    vx = vx * 0.6 + (e.clientX - (px < 0 ? e.clientX : px)) * 0.4;
    px = e.clientX; py = e.clientY;
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
