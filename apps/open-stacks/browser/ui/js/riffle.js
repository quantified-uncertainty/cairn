// Hold to riffle: holding a page key (l h, the arrows, Space) for a moment
// thumbs through the item like a real book, faster the longer you hold;
// releasing settles on that page. A tap still turns one spread (nav.js).
//
// Hold to skim: holding an item key (j k, ↓ ↑) does the same through the items
// in the stack (state.order, what the Library shows), 5 a second at first and up
// to 14. Each shows its title and, when one is already at hand, its first page
// (a finished render, else a profile sprite cell); nothing is loaded for the
// items you pass, and they are not visits (no 'item:shown'): only the item you
// release on opens. Back returns to where the skim began. Steps emit
// 'item:skim' {i, it} (the Library follows it).
import { $, h, on, emit, css, fmtDate } from './util.js';
import { items, LANES, LANE_COLORS } from './corpus.js';
import { state, current } from './state.js';
import { riffleStart, riffleStep, riffleEnd, showFeed, paintHead } from './feed.js';
import { before, laneEnd, laneStart } from './nav.js';
import { renderedNow } from './render.js';
import { startOf } from './prefetch.js';
import { profileOf, loadProfiles, spriteCell, spriteAspect } from './profile.js';

const FWD = new Set(['l', 'ArrowRight', ' ']), BACK = new Set(['h', 'ArrowLeft']);
const DOWN = new Set(['j', 'ArrowDown']), UP = new Set(['k', 'ArrowUp']);
let held = null; // { key, dir, items, t0, raf, last, on, edge }
function loop(now) {
  if (!held) return;
  if (!held.on) {
    if (now - held.t0 < (held.items ? 350 : 280)) { held.raf = requestAnimationFrame(loop); return; }
    held.on = held.items ? skimStart(held.dir) : riffleStart();
    if (!held.on) { held = null; return; }
    held.last = now;
  }
  const t = (now - held.t0) / 1000;
  // Pages: 6 a second at first, up to 24 after two seconds. Items: 5, up to 14.
  const rate = held.items ? Math.min(14, 5 + 6 * (t - 0.35)) : Math.min(24, 6 + 9 * t);
  if (now - held.last >= 1000 / rate) {
    held.last = now;
    if (!held.items) riffleStep(held.dir);
    else if (!held.edge && !skimStep(held.dir)) { held.edge = true; (held.dir > 0 ? laneEnd : laneStart)(); }
  }
  held.raf = requestAnimationFrame(loop);
}
function release() {
  if (!held) return;
  cancelAnimationFrame(held.raf);
  const { on: was, items: it } = held; held = null;
  if (was) (it ? skimEnd : riffleEnd)();
}
document.addEventListener('keydown', (e) => {
  if (state.view !== 'feed' || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const page = FWD.has(e.key) ? (e.shiftKey && e.key === ' ' ? -1 : 1) : BACK.has(e.key) ? -1 : 0;
  const item = DOWN.has(e.key) ? 1 : UP.has(e.key) ? -1 : 0;
  if (!page && !item) return;
  if (!e.repeat) { release(); held = { key: e.key, dir: page || item, items: !!item, t0: performance.now(), on: false }; held.raf = requestAnimationFrame(loop); }
});
document.addEventListener('keyup', (e) => { if (held && e.key === held.key) release(); });
window.addEventListener('blur', release);

// ---------- the skim card ----------
css(`
#skim { position: absolute; z-index: 6; display: flex; align-items: center; justify-content: center; gap: 4%; padding: 2% 4%; background: var(--bg, #141210); box-sizing: border-box; }
#skim[hidden] { display: none; }
#skim .sk-pic { flex: none; height: 82%; display: grid; place-items: center; }
#skim .sk-pic > canvas, #skim .sk-pic > div { height: 100%; box-shadow: 0 2px 18px #0006; background-color: #fff; }
#skim .sk-text { flex: 0 1 34em; min-width: 14em; color: var(--ink, #e8e2d6); }
#skim .sk-lane { font: 600 12px/1 var(--mono, monospace); letter-spacing: .08em; text-transform: uppercase; display: flex; align-items: center; gap: .6em; opacity: .85; }
#skim .sk-lane i { width: .7em; height: .7em; border-radius: 50%; background: var(--c); }
#skim .sk-t { font: 600 clamp(22px, 2.4vw, 40px)/1.15 var(--serif, Georgia, serif); margin: .45em 0 .35em; }
#skim .sk-a { font-size: 15px; opacity: .75; }
#skim .sk-x { font-size: 15px; opacity: .6; margin-top: .9em; line-height: 1.45; }
#skim .sk-n { position: absolute; right: 18px; bottom: 12px; font: 600 13px var(--mono, monospace); opacity: .6; }
`);
const box = h('div', { id: 'skim', hidden: true, ariaLive: 'polite' });
$('#stage').append(box);
let landing = null; // the item the skim ended on, until its first spread is drawn

/** Its first page, when one is at hand without loading anything: a finished render, else a sprite cell. */
function picture(i, H) {
  const it = items[i], k = startOf(i);
  const r = renderedNow(it, k), p = Array.isArray(r) ? r.find((x) => x?.canvas) : r?.canvas ? r : null;
  if (p) {
    const c = h('canvas'), s = H / p.canvas.height;
    c.width = Math.max(1, Math.round(p.canvas.width * s)); c.height = H;
    c.getContext('2d').drawImage(p.canvas, 0, 0, c.width, c.height);
    return c;
  }
  const P = profileOf(it), cell = P && spriteCell(P, k, H), a = P && spriteAspect(P);
  if (cell && a) { const d = h('div', { className: 'spr' }); Object.assign(d.style, cell, { width: Math.round(H * a) + 'px', height: H + 'px' }); return d; }
  return null;
}
function paintSkim(i) {
  const it = items[i];
  paintHead(it);
  const pic = picture(i, Math.round(box.clientHeight * 0.82) || 600);
  box.replaceChildren(...[
    pic ? h('div', { className: 'sk-pic' }, pic) : null,
    h('div', { className: 'sk-text' },
      h('div', { className: 'sk-lane', style: `--c:${LANE_COLORS[it.lane] || '#888'}` }, h('i'), LANES[it.lane] || it.lane),
      h('div', { className: 'sk-t', textContent: it.t }),
      h('div', { className: 'sk-a', textContent: [it.a, fmtDate(it)].filter(Boolean).join(' · ') }),
      it.hook || it.why ? h('div', { className: 'sk-x', textContent: it.hook || it.why }) : null),
    h('div', { className: 'sk-n', textContent: `${state.pos + 1} / ${state.order.length}` })].filter(Boolean));
}
/** Profiles (for sprite cells) of the items ahead, a batch at a time. */
function ahead(dir) {
  const list = [];
  for (let j = 1; j <= 40; j++) { const x = state.order[state.pos + dir * j]; if (x != null) list.push(items[x]); }
  loadProfiles(list).catch(() => {});
}
function skimStart(dir) {
  if (state.order.length < 2 || !$('#spread')) return false;
  before('skim items'); // Back: where the skim began
  state.gen++; // the item the first tap opened stops loading
  state.zoom = false;
  const R = $('#spread').getBoundingClientRect(), S = $('#stage').getBoundingClientRect();
  Object.assign(box.style, { left: R.left - S.left + 'px', top: R.top - S.top + 'px', width: R.width + 'px', height: R.height + 'px' });
  box.hidden = false; landing = null;
  ahead(dir);
  paintSkim(current());
  return true;
}
function skimStep(dir) {
  const p = state.pos + dir;
  if (p < 0 || p >= state.order.length) return false;
  state.pos = p;
  paintSkim(current());
  emit('item:skim', { i: current(), it: items[current()] });
  if (p % 20 === 0) ahead(dir);
  return true;
}
function skimEnd() {
  const i = current();
  landing = i;
  showFeed();
  emit('nav', { type: 'item', i, it: items[i] });
  setTimeout(() => { if (landing === i) { landing = null; box.hidden = true; } }, 900);
}
// The card stays until the item you landed on has drawn its first spread, so the old item does not flash.
on('spread:rendered', ({ i }) => { if (landing === i) { landing = null; box.hidden = true; } });
on('view:changed', () => { if (!held) box.hidden = true; });
