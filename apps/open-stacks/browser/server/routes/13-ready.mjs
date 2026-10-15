// GET /ready?ids=a,b,c -> { id: [first, frac] }: how much of each item is on disk, for the
// Library's marks (features/library.js). first: 1 when the spread it opens at is on disk
// (scans: those pages at the sharp width; anything else: the document); frac: the share
// of the item on disk (scans: their pages, sampled for long books; anything else 0 or 1).
import { statSync } from 'fs';
import { join } from 'path';
import { HERE } from '../config.mjs';
import { loadCorpus, startOf } from './60-warm.mjs';

const W = 1000; // the width the feed shows scans at (render.js)
const page = (it, k) => `https://archive.org/download/${it.ia}/page/n${k}_w${W}.jpg`;
let byId = null, at = 0;
function corpus() {
  const m = statSync(join(HERE, 'corpus.json')).mtimeMs;
  if (!byId || m !== at) { byId = new Map(loadCorpus().map((it) => [it.id, it])); at = m; }
  return byId;
}

export default function (app) {
  const has = (u) => { try { return app.cache.cached(u); } catch { return false; } };
  app.route('GET', '/ready', (req, res, url) => {
    const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).slice(0, 200);
    const all = corpus(), out = {};
    for (const id of ids) {
      const it = all.get(id); if (!it) continue;
      if (it.kind === 'scan' && it.ia && it.n) {
        const s = Math.max(0, Math.min(startOf(it), it.n - 1));
        let first = 1;
        for (let k = s; k < Math.min(it.n, s + 3); k++) if (!has(page(it, k))) { first = 0; break; }
        const step = Math.max(1, Math.ceil(it.n / 200));
        let got = 0, seen = 0;
        for (let k = 0; k < it.n; k += step) { seen++; if (has(page(it, k))) got++; }
        out[id] = [first, +(got / seen).toFixed(3)];
      } else if (it.url) { const c = has(it.url) ? 1 : 0; out[id] = [c, c]; }
    }
    app.json(res, out);
  });
}
