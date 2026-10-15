// Hold to riffle: holding a page key (l h, the arrows, Space) for a moment
// thumbs through the item like a real book, faster the longer you hold;
// releasing settles on that page. A tap still turns one spread (nav.js).
import { state } from './state.js';
import { riffleStart, riffleStep, riffleEnd } from './feed.js';

const FWD = new Set(['l', 'ArrowRight', ' ']), BACK = new Set(['h', 'ArrowLeft']);
let held = null; // { key, dir, t0, raf, last, on }
function loop(now) {
  if (!held) return;
  if (!held.on) {
    if (now - held.t0 < 280) { held.raf = requestAnimationFrame(loop); return; }
    held.on = riffleStart();
    if (!held.on) { held = null; return; }
    held.last = now;
  }
  // 6 pages a second at first, up to 24 after two seconds of holding.
  const rate = Math.min(24, 6 + 9 * ((now - held.t0) / 1000));
  if (now - held.last >= 1000 / rate) { held.last = now; riffleStep(held.dir); }
  held.raf = requestAnimationFrame(loop);
}
document.addEventListener('keydown', (e) => {
  if (state.view !== 'feed' || e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const dir = FWD.has(e.key) ? (e.shiftKey && e.key === ' ' ? -1 : 1) : BACK.has(e.key) ? -1 : 0;
  if (!dir) return;
  if (!e.repeat) { if (held) { cancelAnimationFrame(held.raf); if (held.on) riffleEnd(); } held = { key: e.key, dir, t0: performance.now(), on: false }; held.raf = requestAnimationFrame(loop); }
});
document.addEventListener('keyup', (e) => {
  if (!held || e.key !== held.key) return;
  cancelAnimationFrame(held.raf);
  const was = held.on; held = null;
  if (was) riffleEnd();
});
window.addEventListener('blur', () => { if (held) { cancelAnimationFrame(held.raf); const was = held.on; held = null; if (was) riffleEnd(); } });
