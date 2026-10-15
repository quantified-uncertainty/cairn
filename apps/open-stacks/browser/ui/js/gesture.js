// Wheel and trackpad gestures: one stroke, one step (docs/navigation-ergonomics.md, item 5).
//
// attachWheel(el, {steps(e), pinch(e)}) cuts the wheel events over `el` into
// gestures and emits at most one step per notch or stroke:
//   'gesture:step'  {axis: 'v' | 'h', dir: 1 | -1, device: 'mouse' | 'pad', fresh, x, y}
//     fresh: the first step of its gesture; only a fresh step may cross into
//     another item. A listener sets detail.stop to end the gesture (the rest of
//     it, queued or still to come, is dropped) and may set detail.glyph for the
//     chevron shown at the pointer ('' for none).
//   'gesture:pinch' {dir: 1 (out) | -1 (in), x, y, target}, once per pinch (ctrl+wheel).
//
// Which device? Firefox on macOS reports pixel deltas for notched wheels and
// trackpads alike, so each gesture is classified from deltaMode (read before
// any delta, so that Firefox keeps line deltas where it can), the cadence of its
// events and the size of its deltas:
//   - line or page deltas, or a pixel delta of `notch` px or more on one axis: a notch;
//   - deltas on both axes, or two events closer than `dense` ms: a trackpad (a
//     free-spinning wheel then behaves like one);
//   - a small delta with no stream after it within 60 ms: a notch after all (its
//     size is remembered, so the next one steps at once);
//   - varying deltas less than 50 ms apart that are not whole multiples of the
//     notch: a trackpad after all.
// state.wheelDevice ('auto' | 'mouse' | 'pad') fixes the answer instead.
//
// Mouse: each notch is a step, queued and paced at `rate` steps a second; a
// reversal drops what is queued, and starts a new spin even after a refused one.
// Notches less than `mouseGap` ms apart are one spin.
// Trackpad: the first `lock` px decide the axis (2:1); one step once the stroke
// passes `stroke` px, and the momentum tail is ignored. A new stroke starts after
// `padGap` ms of silence, on a reversal, or when the speed rises again after
// decaying (the mean of the last 3 is `rise` times the mean of the 3 before).
// Chrome merges the events queued while the page is busy (sums the deltas,
// keeps the last stamp): a merged pixel delta of k notches is k steps, and a
// trackpad event's speed is its delta over the frames since the last event.
// ?wheel=debug plots every event; window.__wheel.tune holds the thresholds and
// __wheel.save() keeps them (per device: the pad* and mouse* fields).
import { h, css, emit, store } from './util.js';
import { state } from './state.js';

export const tune = Object.assign({
  padGap: 120, mouseGap: 250, dense: 20, lock: 12, stroke: 40, notch: 15, rate: 14, rise: 1.4, pinch: 10,
}, store.get('wheelTune', {}));

let G = null; // the gesture in progress
let lastT = -1e9, gid = 0, notchPx = 0;
let ptr = { x: null, y: null };
// Chrome merges the wheel events queued while the page is busy into one (deltas
// summed, stamped with the last one's time). unit: a mouse notch's delta per
// deltaMode, from notches that arrived on time (kept once their gesture ends as
// a mouse's; else the spin's first notch), so that a merged event counts as the
// notches it holds. devStamps: events carry the device's time (some event has
// waited in the queue), so a gap between stamps is the reader's.
const unit = {};
const unitOf = (mode) => (G?.device === 'mouse' && G.u?.[0] === mode ? G.u[1] : unit[mode] || (G?.device === 'mouse' && !mode ? G.first : 0));
let devStamps = false;

function begin(now, device, final, big = 0) {
  if (G) { clearTimeout(G.chk); if (G.device === 'mouse' && G.u) unit[G.u[0]] = G.u[1]; }
  G = { id: ++gid, t0: now, device, final, first: big, n: 0, dense: 0, vary: 0, axis: null, ax: 0, ay: 0, acc: 0, dir: 0,
    made: 0, fired: 0, stop: false, peak: 0, prevA: 0, decl: 0, tail: false, ds: [], raw: [] };
  if (DEBUG) mark('begin', now);
  return G;
}

function onWheel(e, steps, pinches) {
  const mode = e.deltaMode; // first, before any delta
  let dx = e.deltaX, dy = e.deltaY;
  if (e.ctrlKey) { if (pinches(e)) { e.preventDefault(); pinch(e, mode, dy); } return; }
  if (!steps(e)) return;
  e.preventDefault();
  if (e.shiftKey && !dx) [dx, dy] = [dy, 0]; // Shift+wheel means sideways
  const now = e.timeStamp || performance.now();
  const dt = now - lastT; lastT = now;
  ptr = { x: e.clientX, y: e.clientY };
  const big = Math.max(Math.abs(dx), Math.abs(dy));
  if (DEBUG) record(now, dx, dy, mode, dt);
  if (!big) return;
  const forced = state.wheelDevice === 'mouse' || state.wheelDevice === 'pad' ? state.wheelDevice : null;
  const lag = performance.now() - now; // how long the event waited to be handled
  if (lag > 30) devStamps = true;
  const late = wasBusy();
  // A gap that ends right after a stall is the page's, not a pause by the reader:
  // where events are stamped when delivered, when this one was made just now (a
  // stream merged while the page was busy, still going), or in a trackpad stroke
  // (whose tail may have been merged; a new flick in it still shows as a rise).
  // A notch made during the stall that waited for it keeps its own time.
  const busy = late && (!devStamps || lag < 25 || G?.device === 'pad');
  // Frames this event covers: with device stamps, a merged event spans the time
  // since the last one; speed is then judged per 60 Hz frame.
  const frames = devStamps && dt > 25 ? Math.round(dt / 16.7) : 1, rate = big / frames;
  // Notches merged during a stall: a whole multiple of the notch size (pixel
  // deltas only: Chrome merges; Firefox's line deltas are accelerated on macOS).
  const r = unitOf(mode) ? big / unitOf(mode) : 0;
  const merged = !mode && (late || lag > 16) && r > 1.9 && Math.abs(r - Math.round(r)) < 0.12 ? Math.min(4, Math.round(r)) : 1;
  // A pause in a stepped trackpad stroke's tail (the page was busy, or events
  // were merged) continues the tail when its speed carries on from where it
  // was (a new stroke starts slow again); the rise test still catches a new flick.
  const resumes = G?.device === 'pad' && G.made && !mode && dt < 400 && rate <= Math.max(6, 1.5 * G.prevA) && rate >= 0.25 * G.prevA;
  if (!G || (dt > (G.device === 'mouse' ? tune.mouseGap : tune.padGap) && !resumes && !busy && !(merged > 1 && G.device === 'mouse'))) {
    const sure = forced || (mode ? 'mouse' : dx && dy ? 'pad' : null);
    begin(now, sure || (big >= tune.notch || (notchPx && Math.abs(big - notchPx) < 0.5) ? 'mouse' : 'pad'), !!sure, big);
  } else if (!forced && mode === 0) {
    // A quick stream of varying deltas: a trackpad, whatever the first event
    // looked like. Notches keep their size (or whole multiples of it, merged).
    // The step its first event made, if it already fired, stands for the whole stroke.
    if (dt < tune.dense) G.dense++;
    const q = big / (unitOf(mode) || G.first), whole = q > 0.9 && Math.abs(q - Math.round(q)) < 0.1;
    if (dt < 50 && !whole && Math.abs(big - G.first) > 0.5 && ++G.vary >= 2 && G.device === 'mouse' && !G.final) { G.device = 'pad'; G.final = true; dropQueued(G); }
  }
  G.n++; G.ax += dx; G.ay += dy;
  if (G.device === 'mouse') {
    // The rest of a stopped spin is dropped; turning the wheel back starts a new one.
    if (G.stop && Math.sign(Math.abs(dx) > Math.abs(dy) ? dx : dy) === G.dir) return;
    if (merged === 1 && !late && !(G.u?.[1] <= big)) G.u = [mode, big]; // the smallest notch on time
    notch(dx, dy, now, merged, big);
  } else stroke(dx, dy, now, frames);
}

// Was the page just busy (rendering the step before)? Events then arrive late
// and bunched; where their timestamps are delivery times, the gap is the
// page's doing, not a pause by the reader, so it does not end the gesture.
// A heartbeat runs only while the wheel is in use.
let beat = 0, beatT = 0, lastWheel = 0;
function wasBusy() {
  const now = performance.now();
  const busy = !!beatT && now - beat > 100;
  lastWheel = now;
  if (!beatT) {
    beat = now;
    beatT = setInterval(() => { beat = performance.now(); if (beat - lastWheel > 2000) { clearInterval(beatT); beatT = 0; } }, 40);
  }
  return busy;
}

// ---------- mouse: one notch, one step ----------
function notch(dx, dy, now, k = 1, big = 0) {
  const axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
  const dir = Math.sign(axis === 'h' ? dx : dy);
  if (G.dir && dir !== G.dir) { const f = G.final; dropQueued(G); begin(now, 'mouse', f, big).n = 1; } // a reversal: a new spin
  G.axis = axis; G.dir = dir;
  for (let j = 0; j < k; j++) push(G, axis, dir); // k: notches merged into one event
}

// ---------- trackpad: one stroke, one step ----------
function stroke(dx, dy, now, frames = 1) {
  // Judged by speed (px per frame), so that a tail merged into one big event
  // during a stall does not look like a new flick.
  const a = (Math.abs(dx) + Math.abs(dy)) / (G.n > 1 ? frames : 1);
  G.raw.push([dx, dy, frames]); if (G.raw.length > 6) G.raw.shift();
  if (!G.final && !G.dense && !G.made) armNotchCheck(G);
  if (!G.axis) {
    const ax = Math.abs(G.ax), ay = Math.abs(G.ay);
    if (ax + ay < tune.lock) return;
    if (ax >= 2 * ay) G.axis = 'h'; else if (ay >= 2 * ax) G.axis = 'v';
    else if (ax + ay >= tune.stroke) G.axis = ax > ay ? 'h' : 'v';
    else return;
    G.acc = G.axis === 'h' ? G.ax : G.ay;
  } else if (!G.made) G.acc += G.axis === 'h' ? dx : dy;
  G.peak = Math.max(G.peak, a);
  G.decl = a <= G.prevA ? G.decl + 1 : 0; G.prevA = a;
  G.ds.push(a); if (G.ds.length > 6) G.ds.shift();
  if (!G.made) {
    if (Math.abs(G.acc) >= tune.stroke) { G.dir = Math.sign(G.acc); push(G, G.axis, G.dir); }
    return;
  }
  // Stepped: the rest is the tail, unless a new stroke starts.
  const d = G.axis === 'h' ? dx : dy;
  if (Math.sign(d) === -G.dir && Math.abs(d) >= 2) return restart(now, [[dx, dy, frames]]); // a reversal
  if (!G.tail && G.decl >= 4 && a <= 0.7 * G.peak && G.peak >= 10) G.tail = true;
  if (G.tail && G.ds.length === 6) {
    const [a0, a1, a2, a3, a4, a5] = G.ds;
    const p3 = (a0 + a1 + a2) / 3, m3 = (a3 + a4 + a5) / 3;
    if (m3 > tune.rise * p3 && m3 - p3 >= 4) restart(now, G.raw.slice(-3)); // rising again: a new flick
  }
}
function restart(now, raw) {
  const g = begin(now, 'pad', true);
  for (const [dx, dy, f] of raw) { g.n++; g.ax += dx; g.ay += dy; if (G === g && !g.stop) stroke(dx, dy, now, f); }
}
// A small delta with nothing after it was a notch of a gentle wheel after all.
function armNotchCheck(g) {
  clearTimeout(g.chk);
  g.chk = setTimeout(() => {
    if (G !== g || g.made || g.dense || g.final || g.device !== 'pad' || g.first < 3) return;
    g.device = 'mouse'; notchPx = g.first;
    for (const [dx, dy] of g.raw) { const axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'; g.axis = axis; g.dir = Math.sign(axis === 'h' ? dx : dy); push(g, axis, g.dir); }
  }, 60);
}

// ---------- the step queue: at most `rate` steps a second ----------
const queue = [];
let lastStep = -1e9, pumpT = 0;
function push(g, axis, dir) {
  if (!dir || queue.length >= 2) return; // no backlog: the pages stop when the wheel stops
  queue.push({ g, axis, dir, fresh: !g.made, x: ptr.x, y: ptr.y });
  g.made++;
  pump();
}
function dropQueued(g) {
  for (let j = queue.length - 1; j >= 0; j--) if (queue[j].g === g) queue.splice(j, 1);
  g.made = g.fired;
}
function pump() {
  clearTimeout(pumpT);
  while (queue.length) {
    const wait = lastStep + 1000 / tune.rate - performance.now();
    if (wait > 0) { pumpT = setTimeout(pump, wait); return; }
    const s = queue.shift();
    if (s.g.stop) continue;
    lastStep = performance.now(); s.g.fired++;
    const d = { axis: s.axis, dir: s.dir, device: s.g.device, fresh: s.fresh, gesture: s.g.id, x: s.x, y: s.y, stop: false, glyph: null };
    emit('gesture:step', d);
    if (DEBUG) mark(d.stop ? 'stop' : 'step', lastStep, d);
    chevron(d);
    if (d.stop) { s.g.stop = true; dropQueued(s.g); }
  }
}

// ---------- pinch: ctrl+wheel, one commit per pinch ----------
let P = null, pT = -1e9;
function pinch(e, mode, dy) {
  const now = e.timeStamp || performance.now();
  if (!P || now - pT > 200) P = { acc: 0, done: false };
  pT = now;
  if (P.done) return;
  P.acc += dy * (mode === 1 ? 20 : mode === 2 ? 400 : 1);
  if (Math.abs(P.acc) < tune.pinch) return;
  P.done = true;
  emit('gesture:pinch', { dir: P.acc < 0 ? 1 : -1, x: e.clientX, y: e.clientY, target: e.target });
  swallow();
}
// After a pinch commits, the rest of it must not zoom the page, wherever the
// view change left the pointer. It ends 250 ms after the last event arrived (not
// after its stamp: a stall delivers the rest of the pinch late), and never on
// the first check after a stall, so the events queued behind it come first.
let swallowing = false, swT = 0;
function swallow() {
  swT = performance.now();
  if (swallowing) return;
  swallowing = true;
  const fn = (e) => { if (e.ctrlKey) { swT = performance.now(); e.preventDefault(); } };
  addEventListener('wheel', fn, { passive: false, capture: true });
  let t = performance.now();
  const check = () => {
    const now = performance.now(), stalled = now - t > 200; t = now;
    if (!stalled && now - swT > 250) { removeEventListener('wheel', fn, { capture: true }); swallowing = false; } else setTimeout(check, 100);
  };
  setTimeout(check, 100);
}

export function attachWheel(el, { steps = () => true, pinch: pinches = () => true } = {}) {
  el.addEventListener('wheel', (e) => onWheel(e, steps, pinches), { passive: false });
}

// ---------- a chevron at the pointer confirms each step ----------
css(`#gchev { position: fixed; z-index: 60; pointer-events: none; transform: translate(-50%, -50%); font: 600 28px/1 var(--sans); color: var(--accent); text-shadow: 0 1px 6px #000d; opacity: 0; transition: opacity .12s; }
#gchev.on { opacity: .95; transition: none; }`);
let chev = null, chevT = 0;
function chevron(d) {
  if (d.x == null || d.glyph === '') return;
  chev ||= document.body.appendChild(h('div', { id: 'gchev' }));
  chev.textContent = d.glyph || (d.axis === 'h' ? (d.dir > 0 ? '›' : '‹') : d.dir > 0 ? '⌄' : '⌃');
  chev.style.left = d.x + 'px'; chev.style.top = d.y + 'px';
  chev.classList.add('on');
  clearTimeout(chevT); chevT = setTimeout(() => chev.classList.remove('on'), 150);
}

// ---------- ?wheel=debug: plot every event, to tune the thresholds on real devices ----------
const DEBUG = /[?&]wheel=debug\b/.test(location.search);
const dlog = [];
function record(t, dx, dy, mode, dt) { dlog.push({ t, dx, dy, mode, dt: Math.round(dt) }); trim(); draw(); }
function mark(kind, t, d) { dlog.push({ t, kind, dev: G?.device, glyph: d?.glyph, dir: d?.dir, axis: d?.axis }); trim(); draw(); }
function trim() { while (dlog.length > 4000) dlog.shift(); }
let cv = null, info = null, raf = 0;
function draw() {
  if (!cv) {
    css(`#wdbg { position: fixed; right: 8px; bottom: 30px; z-index: 70; background: #000d; border: 1px solid var(--line); padding: 6px; font: 11px var(--mono); color: var(--ink-2); pointer-events: none; }
#wdbg canvas { display: block; width: 560px; height: 180px; }`);
    cv = h('canvas', { width: 1120, height: 360 });
    info = h('div');
    document.body.append(h('div', { id: 'wdbg' }, info, cv));
  }
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, now = performance.now(), span = 3000;
    const X = (t) => W - ((now - t) / span) * W, mid = H / 2, k = (H / 2 - 10) / 120;
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#ffffff22'; c.fillRect(0, mid, W, 1);
    c.fillStyle = '#ffffff44'; c.fillRect(0, mid - tune.stroke * k, W, 1); c.fillRect(0, mid + tune.stroke * k, W, 1);
    for (const r of dlog) {
      const x = X(r.t); if (x < 0) continue;
      if (r.kind) {
        c.fillStyle = r.kind === 'begin' ? '#888' : r.kind === 'stop' ? '#c9705f' : '#7fb37a';
        c.fillRect(x, 0, r.kind === 'begin' ? 1 : 3, H);
        c.font = '20px monospace';
        if (r.kind === 'begin') c.fillText(r.dev === 'mouse' ? 'M' : 'P', x + 3, 20);
        continue;
      }
      c.fillStyle = '#5b9bd5'; c.fillRect(x - 2, mid, 4, -Math.max(-mid, Math.min(mid, r.dy * k)));
      c.fillStyle = '#e2a54a'; c.fillRect(x + 1, mid, 2, -Math.max(-mid, Math.min(mid, r.dx * k)));
    }
    const last = dlog.filter((r) => !r.kind).at(-1);
    if (last) info.textContent = `mode ${last.mode} · dx ${+last.dx.toFixed(2)} dy ${+last.dy.toFixed(2)} · dt ${last.dt} ms · ${G?.device || '-'}${G?.final ? '' : '?'} (${state.wheelDevice}) · notch ${notchPx || '-'} px · stroke ${tune.stroke} gap ${tune.padGap}/${tune.mouseGap} rise ${tune.rise}`;
  });
}
if (DEBUG) window.__wheel = { tune, log: dlog, save: () => store.set('wheelTune', tune), reset: () => store.set('wheelTune', {}) };
