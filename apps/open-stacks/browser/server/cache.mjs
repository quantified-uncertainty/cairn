// Disk cache for open sources, and the prioritised prefetch queue that fills it.
import { createHash } from 'crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { HERE, CACHE, UA } from './config.mjs';

// Only open sources; the proxy is not a general-purpose fetcher. Hosts of every
// item in corpus.json are added at startup.
export const ALLOW = new Set([
  'archive.org', 'arxiv.org', 'gutenberg.org', 'standardebooks.org', 'openlibrary.org', 'cdn.jsdelivr.net',
  'lesswrong.com', 'alignmentforum.org', 'forum.effectivealtruism.org',
]);
try {
  const { items } = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  for (const it of items) for (const u of [it.url, it.page]) {
    try { if (u) ALLOW.add(new URL(u).hostname.replace(/^www\./, '')); } catch { /* skip */ }
  }
} catch { console.warn('corpus.json not found: run node build-corpus.mjs'); }
export const allowed = (u) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '');
    return [...ALLOW].some((d) => h === d || h.endsWith('.' + d));
  } catch { return false; }
};

export const key = (u) => createHash('sha1').update(u).digest('hex');
export const paths = (u) => { const k = key(u); const d = join(CACHE, k.slice(0, 2)); return { d, body: join(d, k), meta: join(d, k + '.json') }; };
export const cached = (u) => existsSync(paths(u).meta);
export const meta = (u) => JSON.parse(readFileSync(paths(u).meta, 'utf-8'));
export const read = (u) => readFileSync(paths(u).body);

export const stats = { hits: 0, misses: 0, fetched: 0, failed: 0, bytes: 0 };
const inflight = new Map();

/** Fetch a URL into the cache unless it is already there. */
export function ensure(u) {
  if (cached(u)) return Promise.resolve();
  if (inflight.has(u)) return inflight.get(u);
  const p = (async () => {
    const res = await fetch(u, { headers: { 'User-Agent': UA }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { d, body, meta: m } = paths(u);
    mkdirSync(d, { recursive: true });
    writeFileSync(body, buf);
    writeFileSync(m, JSON.stringify({ url: u, type: res.headers.get('content-type') || 'application/octet-stream', size: buf.length, at: Date.now() }));
    stats.fetched++; stats.bytes += buf.length;
  })().finally(() => inflight.delete(u));
  inflight.set(u, p);
  return p;
}

// Prefetch queue: highest priority first; a new request for a group replaces
// that group's older entries, so the queue follows what the reader sees now.
let queue = [];
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
/** Replace a group's queued URLs; earlier URLs in the list go first. */
export function enqueue(urls, pri = 1, group = 'default') {
  queue = queue.filter((j) => j.group !== group);
  urls.forEach((u, i) => { if (allowed(u) && !cached(u)) queue.push({ u, pri: pri - i * 0.001, group }); });
  pump();
  return queue.length;
}
export const queueState = () => ({ queue: queue.length, active });
