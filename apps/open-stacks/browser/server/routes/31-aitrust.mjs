// "This is wrong": the reader's reports on AI output (a summary, a reading guide) and the lower
// trust an item's AI fields get after one (ui/js/features/aitrust.js). Kept in the cache folder,
// never in the repository: one line per report in CACHE/ai-errors.jsonl, the open flags in
// CACHE/ai-trust.json ({id: [{what, model, at, when}]}).
//
//   GET  /ai/trust                                         -> {id: [flag]}: every item's open flags
//   POST /ai/wrong {id, what, model, at, note?, page?, title?} -> {ok, flags}: record it, flag that output
//   POST /ai/trust {id, what?}                             -> {ok, flags}: trust it again (all, or one kind)
//
// A flag names the output it is about (`what`: summary | guide, with its `model` and `at`). The
// client lowers trust in the item's AI fields while a flagged output is the one it shows, so a
// summary or guide made again, or by another model, is trusted as before.
import { appendFileSync, readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';

const KINDS = ['summary', 'guide'];
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : null);

export default function (app) {
  const FILE = join(app.CACHE, 'ai-trust.json'), LOG = join(app.CACHE, 'ai-errors.jsonl');
  let flags = null;
  const load = () => (flags ||= (() => { try { return JSON.parse(readFileSync(FILE, 'utf-8')) || {}; } catch { return {}; } })());
  const save = () => { const tmp = FILE + '.part'; writeFileSync(tmp, JSON.stringify(flags)); renameSync(tmp, FILE); };
  let reports = 0;

  app.route('GET', '/ai/trust', (req, res) => app.json(res, load()));

  app.route('POST', '/ai/wrong', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad json' }, 400); }
    const id = str(b?.id, 300), what = KINDS.includes(b?.what) ? b.what : null;
    if (!id || !what) return app.json(res, { error: 'id and what (summary or guide) are needed' }, 400);
    const when = new Date().toISOString();
    const flag = { what, model: str(b.model, 80), at: str(b.at, 40), when };
    const rec = { ...flag, id, title: str(b.title, 300), note: str(b.note, 2000) || '', page: Number.isInteger(b.page) ? b.page : null };
    appendFileSync(LOG, JSON.stringify(rec) + '\n');
    reports++;
    const all = load();
    all[id] = [...(all[id] || []).filter((f) => !(f.what === what && f.model === flag.model && f.at === flag.at)), flag].slice(-10);
    save();
    app.json(res, { ok: true, flags: all[id] });
  });

  app.route('POST', '/ai/trust', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad json' }, 400); }
    const id = str(b?.id, 300); if (!id) return app.json(res, { error: 'id is needed' }, 400);
    const all = load();
    const left = KINDS.includes(b.what) ? (all[id] || []).filter((f) => f.what !== b.what) : [];
    if (left.length) all[id] = left; else delete all[id];
    save();
    app.json(res, { ok: true, flags: all[id] || [] });
  });

  app.status(() => ({ aiTrust: { flagged: Object.keys(load()).length, reports } }));
}
