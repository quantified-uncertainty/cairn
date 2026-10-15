#!/usr/bin/env node
/**
 * Stacks Browser: local caching proxy, prefetcher and summarizer.
 *
 *   npm install          # once, for AI summaries (Anthropic SDK)
 *   node server.mjs      # then open http://localhost:4747
 *
 * - /proxy?u=URL     fetch an allowlisted open source once, then serve it from disk
 * - /prefetch        prioritised background queue the UI fills with what you will likely open
 * - /summarize       AI summary of an item from text the UI extracts (needs ANTHROPIC_API_KEY)
 * - /notes           your notes and highlights, saved to disk; /notes.md exports them
 *
 * Cache and notes live in $STACKS_CACHE or ~/.cache/open-stacks.
 * Summaries use $STACKS_MODEL (default claude-opus-5-5). claude-haiku-5-5 is ~40x cheaper.
 */

import http from 'http';
import { createHash } from 'crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, statSync, createReadStream } from 'fs';
import { join, dirname, extname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[process.argv.indexOf('--port') + 1]) || 4747;
const CACHE = process.env.STACKS_CACHE || join(homedir(), '.cache', 'open-stacks');
const MODEL = process.env.STACKS_MODEL || 'claude-opus-5-5';
const UA = 'OpenStacksBrowser/0.2 (personal research reader; https://github.com/quantified-uncertainty/cairn)';
for (const d of ['', 'summaries']) mkdirSync(join(CACHE, d), { recursive: true });

// Only open sources; the proxy is not a general-purpose fetcher. Hosts of every
// item in corpus.json are added at startup.
const ALLOW = new Set([
  'archive.org', 'arxiv.org', 'gutenberg.org', 'standardebooks.org', 'openlibrary.org', 'cdn.jsdelivr.net',
  'lesswrong.com', 'alignmentforum.org', 'forum.effectivealtruism.org',
]);
try {
  const { items } = JSON.parse(readFileSync(join(HERE, 'corpus.json'), 'utf-8'));
  for (const it of items) for (const u of [it.url, it.page]) {
    try { if (u) ALLOW.add(new URL(u).hostname.replace(/^www\./, '')); } catch { /* skip */ }
  }
} catch { console.warn('corpus.json not found: run node build-corpus.mjs'); }
const allowed = (u) => {
  try {
    const h = new URL(u).hostname.replace(/^www\./, '');
    return [...ALLOW].some((d) => h === d || h.endsWith('.' + d));
  } catch { return false; }
};

const key = (u) => createHash('sha1').update(u).digest('hex');
const paths = (u) => { const k = key(u); const d = join(CACHE, k.slice(0, 2)); return { d, body: join(d, k), meta: join(d, k + '.json') }; };
const cached = (u) => existsSync(paths(u).meta);

const inflight = new Map();
const stats = { hits: 0, misses: 0, fetched: 0, failed: 0, bytes: 0, summaries: 0 };

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

// ---------- summaries ----------
let anthropic = null;
async function client() {
  if (anthropic) return anthropic;
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) throw Object.assign(new Error('Set ANTHROPIC_API_KEY to enable summaries'), { code: 'no_key' });
  let Anthropic;
  try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); } catch {
    throw Object.assign(new Error('Run `npm install` in the browser folder to enable summaries'), { code: 'no_sdk' });
  }
  anthropic = new Anthropic();
  return anthropic;
}

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    why_care: { type: 'string', description: 'One sentence: why a researcher in forecasting, AI safety, rationality or decision theory might care. Plain and specific.' },
    gist: { type: 'string', description: '2-4 sentences: what the work argues or contains.' },
    key_points: {
      type: 'array',
      items: {
        type: 'object',
        properties: { point: { type: 'string' }, page: { type: ['integer', 'null'], description: 'page number from the [p. N] markers, or null' } },
        required: ['point', 'page'], additionalProperties: false,
      },
    },
    this_spread: { type: 'string', description: 'What is on the pages currently shown, in 1-2 sentences.' },
    verdict: { type: 'string', enum: ['skip', 'skim', 'read', 'study'] },
    minutes: { type: 'integer', description: 'Estimated minutes to read the whole thing carefully.' },
  },
  required: ['why_care', 'gist', 'key_points', 'this_spread', 'verdict', 'minutes'],
  additionalProperties: false,
};

const pendingSummaries = new Map();
async function summarize({ id, title, authors, year, lane, text, spread }) {
  const file = join(CACHE, 'summaries', key(id + '|' + MODEL) + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf-8'));
  if (pendingSummaries.has(file)) return pendingSummaries.get(file);
  const job = (async () => {
    const c = await client();
    const prompt = `You are helping a researcher triage reading quickly. Summarize this work for them.\n\nTitle: ${title}\nAuthors: ${authors || 'unknown'}\nYear: ${year || 'unknown'}\nShelf: ${lane}\nPages currently on screen: ${spread || 'unknown'}\n\nBe concrete and faithful to the text; do not invent claims. Cite pages using the [p. N] markers when you can. If the text is front matter or OCR noise, say what you can and keep it short.\n\n<text>\n${String(text).slice(0, 90000)}\n</text>`;
    const res = await c.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SUMMARY_SCHEMA } },
      messages: [{ role: 'user', content: prompt }],
    });
    if (res.stop_reason === 'refusal') throw Object.assign(new Error('The model declined to summarize this item'), { code: 'refusal' });
    const block = res.content.find((b) => b.type === 'text');
    if (!block) throw new Error('No summary returned');
    const out = { ...JSON.parse(block.text), model: res.model || MODEL, at: new Date().toISOString() };
    writeFileSync(file, JSON.stringify(out));
    stats.summaries++;
    return out;
  })().finally(() => pendingSummaries.delete(file));
  pendingSummaries.set(file, job);
  return job;
}

// ---------- notes ----------
const NOTES = join(CACHE, 'notes.json');
const loadNotes = () => { try { return JSON.parse(readFileSync(NOTES, 'utf-8')); } catch { return {}; } };

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const send = (res, code, body, type = 'text/plain') => { res.writeHead(code, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*' }); res.end(body); };
const json = (res, obj, code = 200) => send(res, code, JSON.stringify(obj), 'application/json');
async function body(req) { let raw = ''; for await (const c of req) raw += c; return JSON.parse(raw || '{}'); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/proxy') {
      const u = url.searchParams.get('u');
      if (!u || !allowed(u)) return send(res, 403, 'host not allowed');
      if (cached(u)) stats.hits++; else stats.misses++;
      await ensure(u);
      const { body: b, meta } = paths(u);
      const m = JSON.parse(readFileSync(meta, 'utf-8'));
      res.writeHead(200, { 'Content-Type': m.type, 'Content-Length': m.size, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=31536000, immutable' });
      return createReadStream(b).pipe(res);
    }
    if (url.pathname === '/prefetch' && req.method === 'POST') {
      const { urls = [], pri = 1, group = 'default' } = await body(req);
      queue = queue.filter((j) => j.group !== group);
      urls.forEach((u, i) => { if (allowed(u) && !cached(u)) queue.push({ u, pri: pri - i * 0.001, group }); });
      pump();
      return json(res, { queued: queue.length });
    }
    if (url.pathname === '/summarize' && req.method === 'POST') {
      try { return json(res, await summarize(await body(req))); } catch (e) { return json(res, { error: e.message, code: e.code || 'error' }, 200); }
    }
    if (url.pathname === '/summary') { // cached summary only, never calls the model
      const file = join(CACHE, 'summaries', key(url.searchParams.get('id') + '|' + MODEL) + '.json');
      return existsSync(file) ? send(res, 200, readFileSync(file), 'application/json') : json(res, null);
    }
    if (url.pathname === '/notes' && req.method === 'POST') {
      const { id, note } = await body(req);
      const all = loadNotes();
      if (note && (note.text || note.highlights?.length)) all[id] = { ...note, at: new Date().toISOString() }; else delete all[id];
      writeFileSync(NOTES, JSON.stringify(all, null, 1));
      return json(res, { ok: true });
    }
    if (url.pathname === '/notes') return json(res, loadNotes());
    if (url.pathname === '/notes.md') {
      const all = loadNotes();
      const md = Object.values(all).map((n) => `## ${n.title}\n${[n.authors, n.year].filter(Boolean).join(', ')}${n.link ? ` — ${n.link}` : ''}\n\n${n.text || ''}\n`).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': 'attachment; filename="stacks-notes.md"' });
      return res.end(md);
    }
    if (url.pathname === '/status') {
      return json(res, { ...stats, queue: queue.length, active, model: MODEL, summariesEnabled: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) });
    }
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
  const ai = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? `summaries on (${MODEL})` : 'summaries off (set ANTHROPIC_API_KEY)';
  console.log(`Stacks Browser on http://localhost:${PORT}  ·  cache ${CACHE}  ·  ${ai}`);
});
