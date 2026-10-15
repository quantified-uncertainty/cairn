// Notes per item, saved to notes.json in the cache folder; /notes.md exports them.
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export default function (app) {
  const NOTES = join(app.CACHE, 'notes.json');
  const load = () => { try { return JSON.parse(readFileSync(NOTES, 'utf-8')); } catch { return {}; } };
  app.route('POST', '/notes', async (req, res) => {
    const { id, note } = await app.body(req);
    const all = load();
    if (note && (note.text || note.highlights?.length)) all[id] = { ...note, at: new Date().toISOString() }; else delete all[id];
    writeFileSync(NOTES, JSON.stringify(all, null, 1));
    app.json(res, { ok: true });
  });
  app.route('GET', '/notes', (req, res) => app.json(res, load()));
  app.route('GET', '/notes.md', (req, res) => {
    const md = Object.values(load()).map((n) => `## ${n.title}\n${[n.authors, n.year].filter(Boolean).join(', ')}${n.link ? ` — ${n.link}` : ''}\n\n${n.text || ''}\n`).join('\n');
    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="stacks-notes.md"' });
    res.end(md);
  });
}
