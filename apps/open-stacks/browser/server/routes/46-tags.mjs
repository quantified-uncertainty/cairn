// Tags: clusters of items to stay in (ui/js/features/tags.js), made by a model
// from the corpus and written to data/tags.json (STACKS_TAGS points elsewhere,
// e.g. a sample for tests):
//   { built, source, tags: [{ id, label, kind, desc, items: [item ids] }] }
// kind: topic | method | org | series | benchmark | genre | era | community.
//
//   GET /tags.json -> the file, cleaned (404 while there is none)
//
// Read at startup and again whenever the file's mtime changes, so a new file
// is picked up without a restart.
import { readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const KINDS = new Set(['topic', 'method', 'org', 'series', 'benchmark', 'genre', 'era', 'community']);
const str = (x, n) => (typeof x === 'string' ? x.trim().slice(0, n) : '');

/** Keep well-formed tags only: an id, a label, a known kind (else topic), item ids as strings, each once. */
export function clean(raw) {
  const seen = new Set(), tags = [];
  for (const t of Array.isArray(raw?.tags) ? raw.tags : []) {
    const id = str(t?.id, 120) || str(t?.label, 120);
    const label = str(t?.label, 80) || id;
    if (!id || seen.has(id) || !Array.isArray(t.items)) continue;
    const items = [...new Set(t.items.filter((x) => typeof x === 'string' && x))];
    if (!items.length) continue;
    seen.add(id);
    tags.push({ id, label, kind: KINDS.has(t.kind) ? t.kind : 'topic', desc: str(t.desc, 400), items });
  }
  return { built: raw?.built ?? null, source: raw?.source ?? null, tags };
}

export default function (app) {
  const file = process.env.STACKS_TAGS ? resolve(process.env.STACKS_TAGS) : join(app.HERE, 'data', 'tags.json');
  let mtime = -1, bad = -1, body = null, n = 0;
  function load() {
    let m;
    try { m = statSync(file).mtimeMs; } catch { mtime = -1; body = null; n = 0; return null; }
    if (m === mtime || m === bad) return body;
    try {
      const data = clean(JSON.parse(readFileSync(file, 'utf8')));
      body = JSON.stringify(data); n = data.tags.length; mtime = m;
    } catch (e) {
      // Half-written or malformed: keep what was served before, and read it again once it changes.
      bad = m; console.warn('tags.json:', e.message);
    }
    return body;
  }
  load();

  app.route('GET', '/tags.json', async (req, res) => {
    const b = load();
    if (!b) return app.send(res, 404, 'no tags yet');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(b);
  });
  app.status(() => ({ tags: n }));
}
