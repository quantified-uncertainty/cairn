// The side panel: sections registered by modules (why, summary, outline,
// note, related, today), repainted when the item changes.
import { $, h, on, emit, sections, registerSection, store, today, fmtDate } from './util.js';
import { items, LANES, byId, tokens, related } from './corpus.js';
import { state, current, learn } from './state.js';
import { openDoc, pdfOutline } from './docs.js';
import { goPage, jumpTo } from './nav.js';

export function paintPanel(i) {
  const it = items[i];
  const secs = sections.map((s) => {
    let body = null;
    try { body = s.render(it, i); } catch (e) { console.error('section', s.id, e); }
    return body ? h('section', { id: 'sec-' + s.id }, s.title ? h('h3', { textContent: s.title }) : null, body) : null;
  });
  $('#panel').replaceChildren(...secs.filter(Boolean));
  emit('panel:painted', { i, it });
}
// The panel follows where you stop: while skipping quickly it only dims, and
// it paints once you have been on an item for 300 ms.
on('item:shown', ({ it }) => { trailTick(it); $('#panel').classList.add('stale'); });
on('item:settled', ({ i, it }) => { if (state.panelItem !== it.id) return; paintPanel(i); $('#panel').classList.remove('stale'); });

registerSection({
  id: 'why', title: 'Why this', order: 10,
  render(it) {
    const liked = tokens(it).filter((w) => (state.aff.tok[w] || 0) >= 1).slice(0, 2);
    const links = [['Original', it.page || it.url]];
    if (it.kind === 'pdf') links.push(['PDF', it.url]);
    if (it.id.startsWith('arxiv:')) links.push(['HTML', `https://arxiv.org/html/${it.id.slice(6)}`]);
    return h('div', {},
      it.hook ? h('div', { className: 'hook', textContent: it.hook }) : null,
      h('div', { className: 'why' }, h('b', { textContent: it.why || LANES[it.lane] || '' }), liked.length ? ` · you liked “${liked.join('”, “')}”` : ''),
      h('div', { className: 'byline', textContent: [it.a, fmtDate(it), it.src].filter(Boolean).join(' · ') }),
      h('div', { className: 'links' }, ...links.map(([l, u]) => h('a', { href: u, target: '_blank', rel: 'noopener', textContent: l + ' ↗' }))));
  },
});

registerSection({
  id: 'outline', title: 'Outline', order: 30,
  render(it) {
    const box = h('ol', { className: 'outline' });
    (async () => {
      let ol = [];
      if (it.kind !== 'scan') { try { const d = await openDoc(it); ol = d.pdf ? await pdfOutline(d) : d.outline; } catch { /* none */ } }
      if (state.panelItem !== it.id) return;
      const sec = document.getElementById('sec-outline');
      if (sec) sec.hidden = !ol.length;
      box.replaceChildren(...ol.map((o) => {
        const li = h('li', { style: `--d:${o.depth}`, onclick: () => o.page != null && goPage(o.page) }, o.title, o.page != null ? h('span', { className: 'op', textContent: String(o.page + 1) }) : null);
        li.dataset.page = o.page ?? '';
        return li;
      }));
    })();
    return box;
  },
});
// Light the outline entries for the pages on screen.
on('spread:rendered', ({ s }) => {
  const shown = state.shown || 1;
  let lit = null;
  for (const li of document.querySelectorAll('#sec-outline li')) {
    const p = li.dataset.page === '' ? -1 : Number(li.dataset.page);
    li.classList.remove('cur');
    if (p >= 0 && p < s + shown) lit = li;
  }
  lit?.classList.add('cur');
});

registerSection({
  id: 'related', title: 'Related', order: 50,
  render(it, i) {
    const rel = related(i);
    if (!rel.length) return null;
    return h('ol', { className: 'rel' }, ...rel.map((j) => h('li', { onclick: () => jumpTo(j) }, items[j].t, h('span', { className: 'l', textContent: (LANES[items[j].lane] || '').split(' ')[0] }))));
  },
});

// Session trail: what you looked at today and for how long.
let trailCur = null;
function trailTick(it) {
  const trail = store.get('trail:' + today, []);
  if (trailCur) { const e = trail.find((x) => x.id === trailCur.id); if (e) e.sec += Math.round((Date.now() - trailCur.at) / 1000); }
  if (!trail.find((x) => x.id === it.id)) trail.unshift({ id: it.id, sec: 0 });
  store.set('trail:' + today, trail.slice(0, 200));
  trailCur = { id: it.id, at: Date.now() };
}
registerSection({
  id: 'today', title: 'Today', order: 60,
  render() {
    const trail = store.get('trail:' + today, []);
    return h('ol', { className: 'trail' }, ...trail.slice(0, 12).map((e) => {
      const j = byId.get(e.id); if (j == null) return null;
      return h('li', { onclick: () => jumpTo(j) }, items[j].t, h('span', { className: 's', textContent: e.sec >= 60 ? Math.round(e.sec / 60) + 'm' : e.sec + 's' }));
    }));
  },
});
// Dwell: lingering on an item is a signal of interest.
setInterval(() => {
  if (state.view !== 'feed' || document.hidden) return;
  const i = current(); if (i == null) return;
  if (trailCur && trailCur.id === items[i].id && Date.now() - trailCur.at > 8000 && !trailCur.learned) { trailCur.learned = true; learn(items[i], 0.2); }
}, 2000);
