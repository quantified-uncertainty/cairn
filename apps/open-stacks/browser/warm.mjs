#!/usr/bin/env node
/**
 * Overnight cache fill: fetch the opening pages of many items into the cache,
 * so tomorrow's browsing never waits on the network.
 *
 *   node warm.mjs                                   # top 50 items per lane, 12 pages each
 *   node warm.mjs --lanes oddities,llm --items 200  # more items, some lanes
 *   node warm.mjs --pages 30 --thumbs               # deeper, plus page-strip thumbnails
 *   node warm.mjs --mb 2000                         # stop after 2 GB of new data
 *   node warm.mjs --dry                             # just count the URLs
 *
 * With a server running (--port, default 4747) it sends batches through its
 * /prefetch queue, so the server's per-host politeness, its priority for what
 * you are reading and its eviction all apply; Ctrl-C clears what is queued.
 * With no server it loads server/cache.mjs and fetches directly. Either way
 * it never fills past 90% of STACKS_CACHE_MAX.
 */
import { planWarm, fill } from './server/routes/60-warm.mjs';

const arg = (name, d) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : d; };
const flag = (name) => process.argv.includes('--' + name);
if (flag('help') || flag('h')) { console.log((await import('fs')).readFileSync(new URL(import.meta.url), 'utf-8').split('*/')[0].replace(/^[\s\S]*?\/\*\*\n/, '').replace(/^ \* ?/gm, '')); process.exit(0); }

const PORT = Number(arg('port', process.env.STACKS_PORT || 4747));
const BASE = `http://localhost:${PORT}`;
const GROUP = 'overnight';
const opts = {
  lanes: arg('lanes') ? arg('lanes').split(',').map((s) => s.trim()).filter(Boolean) : null,
  items: Number(arg('items', 50)),
  pages: Number(arg('pages', 12)),
  widths: String(arg('widths', '400,1000')).split(',').map(Number).filter(Boolean),
  thumbs: flag('thumbs'),
};
const urls = planWarm(opts);
if (!urls.length) { console.log('Nothing to warm (check --lanes; lane ids are like "oddities", "llm", "lesswrong").'); process.exit(1); }
console.log(`${urls.length} URLs: ${opts.lanes ? opts.lanes.join(', ') : 'all lanes'}, top ${opts.items} items, ${opts.pages} pages at w${opts.widths.join('/w')}${opts.thumbs ? ' + thumbnails' : ''}`);
if (flag('dry')) process.exit(0);

// A running server, or the cache module in this process.
let server = false;
if (!flag('direct')) try { server = (await fetch(BASE + '/status', { signal: AbortSignal.timeout(1500) })).ok; } catch { /* not running */ }
const post = (path, body) => fetch(BASE + path, { method: 'POST', body: JSON.stringify(body) }).then((r) => r.json());
let api;
if (server) {
  const st = await (await fetch(BASE + '/status')).json();
  api = {
    room: (st.cacheMax || Infinity) * 0.9 - (st.cacheBytes || 0),
    enqueue: (b) => post('/prefetch', { urls: b, pri: 3, group: GROUP }),
    check: (b) => post('/warm/check', { urls: b }),
    stop: () => post('/prefetch', { urls: [], group: GROUP }).catch(() => {}),
  };
  console.log(`Using the server on ${BASE}.`);
} else {
  const cache = await import('./server/cache.mjs');
  api = {
    room: cache.MAX * 0.9 - cache.cacheState().cacheBytes,
    enqueue: async (b) => cache.enqueue(b, 3, GROUP),
    check: async (b) => cache.inspect(b),
    stop: async () => cache.enqueue([], 3, GROUP),
  };
  console.log('No server running: fetching directly into the cache.');
}

const budget = Math.min(arg('mb') ? Number(arg('mb')) * 1024 * 1024 : Infinity, Math.max(0, api.room));
if (budget <= 0) { console.log('The cache is already at 90% of STACKS_CACHE_MAX; raise it to warm more.'); process.exit(0); }

let stopping = false;
process.on('SIGINT', async () => { if (stopping) process.exit(130); stopping = true; console.log('\nStopping: clearing the queued batch…'); await api.stop(); process.exit(130); });

const tty = process.stdout.isTTY;
let lastLine = 0;
const t0 = Date.now();
function progress(p, final = false) {
  const s = (Date.now() - t0) / 1000;
  const rate = p.bytes / 1e6 / Math.max(1, s);
  const eta = p.done > 0 ? ((urls.length - p.done) * s) / p.done : 0;
  const line = `${String(p.done).padStart(String(urls.length).length)}/${urls.length} checked · ${p.fetched} fetched (${(p.bytes / 1e6).toFixed(1)} MB, ${rate.toFixed(2)} MB/s) · ${p.had} already cached · ${p.failed} failed${final ? ` · ${Math.round(s)} s` : eta ? ` · about ${eta < 90 ? Math.round(eta) + ' s' : Math.round(eta / 60) + ' min'} left` : ''}`;
  if (tty) process.stdout.write('\r' + line.padEnd(110));
  else if (final || Date.now() - lastLine > 10e3) { console.log(line); lastLine = Date.now(); }
}
const p = await fill(urls, { ...api, budget, window: 16, onProgress: (q) => progress(q), stop: () => stopping });
progress(p, true);
if (tty) process.stdout.write('\n');
if (p.bytes >= budget && p.done < urls.length) console.log(`Stopped at the ${(budget / 1e6).toFixed(0)} MB budget.`);
process.exit(0);
