// /proxy serves an allowlisted URL from the disk cache, fetching it once;
// /prefetch fills the cache in the background.
import { createReadStream } from 'fs';

export default function (app) {
  const { cache } = app;
  app.route('GET', '/proxy', async (req, res, url) => {
    const u = url.searchParams.get('u');
    if (!u || !cache.allowed(u)) return app.send(res, 403, 'host not allowed');
    if (cache.cached(u)) cache.stats.hits++; else cache.stats.misses++;
    await cache.ensure(u);
    const m = cache.meta(u);
    res.writeHead(200, { 'Content-Type': m.type, 'Content-Length': m.size, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=31536000, immutable' });
    createReadStream(cache.paths(u).body).pipe(res);
  });
  app.route('POST', '/prefetch', async (req, res) => {
    const { urls = [], pri = 1, group = 'default' } = await app.body(req);
    app.json(res, { queued: cache.enqueue(urls, pri, group) });
  });
  app.status(() => ({ ...cache.stats, ...cache.queueState() }));
}
