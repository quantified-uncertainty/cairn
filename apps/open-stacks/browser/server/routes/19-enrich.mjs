// /enrich.json: per-item relevance, hooks and best entry pages (rel, hook, best), which
// ui/js/corpus.js merges into the corpus items. enrich-batch.mjs writes CACHE/enrich.json
// (in the cache folder, because rel follows the reader's learned interests); without one,
// a hand-made enrich.json in the browser folder is served; else 404, as before.
// config.mjs enrichFile() is the same choice for the server's own readers (60-warm.mjs
// loadCorpus, profile.mjs).
import { createReadStream, existsSync } from 'fs';
import { enrichFile } from '../config.mjs';

export default function (app) {
  app.route('GET', '/enrich.json', (req, res) => {
    const f = enrichFile();
    if (!existsSync(f)) return app.send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    createReadStream(f).on('error', () => res.end()).pipe(res);
  });
}
