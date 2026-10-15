// The wall: the queue as a grid of covers that riffle through pages on hover.
import { $, h, P, registerView } from './util.js';
import { items, LANES, LANE_COLORS } from './corpus.js';
import { state } from './state.js';
import { openDoc, isFlow } from './docs.js';
import { renderPage } from './render.js';
import { setView } from './chrome.js';
import { showFeed } from './feed.js';

let wallShown = 0;
const wallObs = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) addTiles(48); }, { root: $('#wall'), rootMargin: '600px' });
export function showWall() { wallShown = 0; $('#grid').replaceChildren(); addTiles(72); wallObs.observe($('#grid-more')); }
export function typoFace(it) {
  return h('div', { className: 'typo', style: `--c:${LANE_COLORS[it.lane] || '#6b5a3a'}` },
    h('div', { className: 'tt', textContent: it.t }),
    h('div', { className: 'aa', textContent: [it.a, it.y].filter(Boolean).join(' · ') }),
    h('div', { className: 'xx', textContent: it.hook || it.why || '' }));
}
function addTiles(n) {
  const from = state.pos + wallShown;
  for (const i of state.order.slice(from, from + n)) {
    const it = items[i];
    const face = h('div', { className: 'face' });
    if (it.kind === 'scan') face.append(h('img', { loading: 'lazy', alt: it.t, src: P(`https://archive.org/services/img/${it.ia}`) }));
    else face.append(typoFace(it));
    const tile = h('div', { className: 'tile', tabIndex: 0 }, face, h('div', { className: 'cap', textContent: it.t }), h('div', { className: 'sub', textContent: [LANES[it.lane], it.y].filter(Boolean).join(' · ') }));
    tile.onclick = () => { state.pos = state.order.indexOf(i); setView('feed'); };
    let timer = null; let f = 0;
    tile.onmouseenter = async () => {
      if (timer || isFlow(it)) return;
      const d = it.kind === 'scan' ? { n: it.n } : await openDoc(it).catch(() => null);
      if (!d) return; it.n ||= d.n;
      const ks = [0, 0.1, 0.25, 0.4, 0.6, 0.8].map((x) => Math.min(d.n - 1, Math.floor(d.n * x)));
      const step = async () => {
        const k = ks[f++ % ks.length];
        const panels = await renderPage(it, k).catch(() => null);
        const pnl = panels?.find((x) => x.canvas);
        if (!pnl || !timer) return;
        face.querySelectorAll('.rf').forEach((x) => x.remove());
        const el = pnl.canvas.cloneNode(); el.getContext('2d').drawImage(pnl.canvas, 0, 0);
        el.classList.add('rf'); Object.assign(el.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover' });
        face.append(el);
      };
      timer = setInterval(step, 700); step();
    };
    tile.onmouseleave = () => { clearInterval(timer); timer = null; };
    $('#grid').append(tile);
  }
  wallShown += n;
}
registerView('wall', { label: 'Wall', key: 'w', order: 1, roots: () => [$('#wall')], show: showWall });
export { showFeed };
