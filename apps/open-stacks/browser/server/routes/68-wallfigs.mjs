// The wall's figure covers for papers (ui/js/wall.js, Settings › Wall › Paper covers):
//
//   GET /extract/leads?ids=<id>,<id>…[&build=1][&wait=ms]
//     -> {leads: {<id>: {show, pics: [{img, w, h, c?, parts?, lay?}]} | null}, pending: [ids], failed: [ids]}
//
// Each arXiv id's Pictures lead (server/wallfigs.mjs: the cover's few fields of
// GET /extract's `lead`), read from the extract cache on disk when it is there.
// With build=1, ids not extracted yet are built in the background (fg: false: two at
// a time, behind the reader's page loads and arXiv's one-a-second gate, as Feeds'
// read-ahead is), at most 8 started per request; the answer waits up to `wait` ms
// (at most 4000) for the first of them to finish, and those still building come
// back in `pending` to ask about again. `null`: nothing to lead with (no HTML
// version, no figure), or not an arXiv paper. `failed`: a network failure, worth
// asking about another time.
import { wallFigs } from '../wallfigs.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tick = () => new Promise((r) => setImmediate(r));
const MAX_IDS = 60, MAX_BUILDS = 8;

export default function (app) {
  const cached = (u) => { try { return app.cache.allowed(u) && app.cache.cached(u); } catch { return false; } };
  app.route('GET', '/extract/leads', async (req, res, url) => {
    const X = app.extract; // routes/66-extract.mjs
    if (!X) return app.json(res, { error: 'extract is not loaded' }, 503);
    const q = url.searchParams;
    const ids = [...new Set((q.get('ids') || '').split(',').filter((s) => s && s.length <= 400))].slice(0, MAX_IDS);
    const build = q.get('build') === '1';
    const wait = Math.max(0, Math.min(4000, Math.floor(Number(q.get('wait')) || 0)));
    const corpus = X.loadCorpus();
    const leads = {}, pending = [], failed = [], building = [];
    const view = (ex, it) => wallFigs(X.viewOf(ex, it).lead, cached);
    let reads = 0;
    for (const id of ids) {
      const it = corpus.byId.get(id);
      if (!it || !/^arxiv:/.test(id)) { leads[id] = null; continue; }
      const ex = X.stored(id); // a file read and parse when it is not in memory: yield now and then
      if (++reads % 8 === 0) await tick();
      if (ex) { leads[id] = view(ex, it); continue; }
      if (!build || building.length >= MAX_BUILDS) { pending.push(id); continue; }
      building.push({ id, p: X.getExtract(it, { fg: false }).then((e) => { leads[id] = view(e, it); }, () => { failed.push(id); }) });
    }
    if (building.length && wait) await Promise.race([...building.map((b) => b.p), sleep(wait)]); // the first one done answers
    for (const b of building) if (!(b.id in leads) && !failed.includes(b.id)) pending.push(b.id);
    app.json(res, { leads, pending, failed });
  });
}
