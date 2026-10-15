// POST /cached {urls} -> "0101..." : which of these URLs are already in the
// disk cache, so the reader can show how much of an item is ready.
export default function (app) {
  app.route('POST', '/cached', async (req, res) => {
    const { urls = [] } = await app.body(req);
    app.send(res, 200, urls.slice(0, 5000).map((u) => (app.cache.cached(u) || app.local?.has(u) ? '1' : '0')).join(''), 'text/plain'); // local: your own files, on disk
  });
  // GET /progress?u= -> {done} | {got, total} | null, for a download in flight.
  app.route('GET', '/progress', (req, res, url) => app.json(res, app.cache.progressOf(url.searchParams.get('u') || '')));
}
