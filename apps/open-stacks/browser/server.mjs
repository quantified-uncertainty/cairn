#!/usr/bin/env node
/**
 * Stacks Browser: local caching proxy and prefetcher.
 *
 *   node server.mjs [--port 4747]      then open http://localhost:4747
 *
 * Open sources are slow to fetch (an Internet Archive page image takes ~1-3 s)
 * and several send no CORS headers, so the browser cannot fetch them directly.
 * This process fetches them, keeps a disk cache, and runs a prioritised
 * prefetch queue that the UI fills with whatever the reader is likely to open
 * next. Once something is cached it opens in milliseconds.
 *
 * No dependencies beyond Node 20+. Cache: $STACKS_CACHE or ~/.cache/open-stacks.
 */

import http from 'http';
import { createHash } from 'crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync, readdirSync, createReadStream } from 'fs';
import { join, dirname, extname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4747;
const CACHE = process.env.STACKS_CACHE || join(homedir(), '.cache', 'open-stacks');
const UA = 'OpenStacksBrowser/0.1 (personal research reader; https://github.com/quantified-uncertainty/cairn)';
mkdirSync(CACHE, { recursive: true });

// Only open sources; the proxy is not a general-purpose fetcher.
const ALLOW = [
  'archive.org', 'arxiv.org', 'gutenberg.org', 'standardebooks.org', 'openlibrary.org',
  'cdn.jsdelivr.net', 'inference.org.uk', 'microsoft.com', 'stanford.edu', 'incompleteideas.net',
  'illinois.edu', 'github.io', 'github.com', 'githubusercontent.com', 'google.com', 'googleusercontent.com',
];
const allowed = (u) => {
  try {
    const h = new URL(u).hostname;
    return ALLOW.some((d) => h === d || h.endsWith('.' + d));
  } catch { return false; }
};

const key = (u) => createHash('sha1').update(u).digest('hex');
const paths = (u) => { const k = key(u); const d = join(CACHE, k.slice(0, 2)); return { d, body: join(d, k), meta: join(d, k + '.json') }; };
const cached = (u) => existsSync(paths(u).meta);

const inflight = new Map(); // url -> Promise<void>
const stats = { hits: 0, misses: 0, fetched: 0, failed: 0, bytes: 0 };

/** Fetch a URL into the cache (deduplicated). Resolves when it is on disk. */
function ensure(u) {
  if (cached(u)) return Promise.resolve();
  if (inflight.has(u)) return inflight.get(u);
  const p = (async () => {
    const res = await fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { d, body, meta } = paths(u);
    mkdirSync(d, { recursive: true });
    writeFileSync(body, buf);
    writeFileSync(meta, JSON.stringify({ url: u, type: res.headers.get('content-type') || 'application/octet-stream', size: buf.length, at: Date.now() }));
    stats.fetched++; stats.bytes += buf.length;
  })().finally(() => inflight.delete(u));
  inflight.set(u, p);
  return p;
}

// Prefetch queue: highest priority first; a new request for a group replaces
// that group's older entries, so the queue tracks what the reader sees now.
let queue = []; // {u, pri, group}
const WORKERS = 12;
let active = 0;
function pump() {
  while (active < WORKERS && queue.length) {
    queue.sort((a, b) => b.pri - a.pri);
    const job = queue.shift();
    if (cached(job.u) || inflight.has(job.u)) continue;
    active++;
    ensure(job.u).catch(() => { stats.failed++; }).finally(() => { active--; pump(); });
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function send(res, code, body, type = 'text/plain') {
  res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/proxy') {
      const u = url.searchParams.get('u');
      if (!u || !allowed(u)) return send(res, 403, 'host not allowed');
      if (cached(u)) stats.hits++; else stats.misses++;
      await ensure(u);
      const { body, meta } = paths(u);
      const m = JSON.parse(readFileSync(meta, 'utf-8'));
      res.writeHead(200, {
        'Content-Type': m.type, 'Content-Length': m.size, 'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return createReadStream(body).pipe(res);
    }
    if (url.pathname === '/prefetch' && req.method === 'POST') {
      let raw = '';
      for await (const c of req) raw += c;
      const { urls = [], pri = 1, group = 'default' } = JSON.parse(raw || '{}');
      queue = queue.filter((j) => j.group !== group);
      urls.forEach((u, i) => { if (allowed(u) && !cached(u)) queue.push({ u, pri: pri - i * 0.001, group }); });
      pump();
      return send(res, 200, JSON.stringify({ queued: queue.length }), 'application/json');
    }
    if (url.pathname === '/status') {
      const q = url.searchParams.getAll('u');
      return send(res, 200, JSON.stringify({ ...stats, queue: queue.length, active, cached: Object.fromEntries(q.map((u) => [u, cached(u)])) }), 'application/json');
    }
    // Static UI and corpus.
    const file = url.pathname === '/' ? 'ui/index.html' : url.pathname === '/corpus.json' ? 'corpus.json' : join('ui', url.pathname.replace(/^\/+/, ''));
    const full = join(HERE, file);
    if (!full.startsWith(HERE) || !existsSync(full) || statSync(full).isDirectory()) return send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream' });
    createReadStream(full).pipe(res);
  } catch (e) {
    if (!res.headersSent) send(res, 502, String(e.message || e));
  }
});

server.listen(PORT, () => {
  const n = readdirSync(CACHE).length;
  console.log(`Stacks Browser on http://localhost:${PORT}  (cache: ${CACHE}, ${n} shards)`);
});
