#!/usr/bin/env node
/**
 * Stacks Browser: local caching proxy, prefetcher, summarizer and notes.
 *
 *   npm install          # once, for AI summaries (Anthropic SDK)
 *   node server.mjs      # then open http://localhost:4747   (--port N to change)
 *
 * It listens on this machine only (127.0.0.1 and ::1). --host H or
 * STACKS_HOST=H (e.g. 0.0.0.0) makes it reachable from the network.
 *
 * Routes live in server/routes/*.mjs, loaded in name order. Each exports
 * `default function (app)` and registers handlers with app.route(); see the
 * `app` object below for what they get. Static files come from ui/;
 * /features.json lists ui/js/features/*.js and ui/features/*.css so feature
 * modules load without editing the core.
 *
 * Cache, notes and summaries live in $STACKS_CACHE or ~/.cache/open-stacks.
 */

import http from 'http';
import { existsSync, readdirSync, statSync, createReadStream } from 'fs';
import { join, extname } from 'path';
import { networkInterfaces } from 'os';
import { HERE, HOST, isLoopback, PORT, CACHE, MODEL, UA, hasKey } from './server/config.mjs';
import * as cache from './server/cache.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.md': 'text/markdown; charset=utf-8',
};
// No Access-Control-Allow-Origin: only the app's own pages read these
// responses, and they include notes, summaries and reading history.
const send = (res, code, body, type = 'text/plain') => { res.writeHead(code, { 'Content-Type': type }); res.end(body); };
const json = (res, obj, code = 200) => send(res, code, JSON.stringify(obj), 'application/json');
async function body(req) { let raw = ''; for await (const c of req) raw += c; return JSON.parse(raw || '{}'); }

const routes = [];
const statusParts = [];
const startHooks = [];
export const app = {
  HERE, CACHE, MODEL, UA, PORT, hasKey, cache, send, json, body,
  /** app.route('GET'|'POST'|'*', '/path' or RegExp, async (req, res, url, match) => {}) */
  route(method, path, fn) { routes.push({ method, path, fn }); },
  /** app.status(() => ({ field: value })) adds fields to /status. */
  status(fn) { statusParts.push(fn); },
  /** app.onStart(fn) runs after the server is listening. */
  onStart(fn) { startHooks.push(fn); },
};

const dir = join(HERE, 'server', 'routes');
for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) {
  const m = await import(join(dir, f));
  await m.default(app);
}

function features() {
  const list = (d, ext) => { const p = join(HERE, 'ui', d); return existsSync(p) ? readdirSync(p).filter((x) => x.endsWith(ext)).sort().map((x) => `${d}/${x}`) : []; };
  return { js: list('js/features', '.js'), css: list('features', '.css') };
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  try {
    for (const r of routes) {
      if (r.method !== '*' && r.method !== req.method) continue;
      const m = typeof r.path === 'string' ? url.pathname === r.path : url.pathname.match(r.path);
      if (m) return await r.fn(req, res, url, m);
    }
    if (url.pathname === '/status') {
      const out = { model: MODEL, summariesEnabled: hasKey() };
      for (const fn of statusParts) Object.assign(out, fn());
      return json(res, out);
    }
    if (url.pathname === '/features.json') return json(res, features());
    const data = { '/corpus.json': 'corpus.json', '/enrich.json': 'enrich.json' }[url.pathname];
    const file = url.pathname === '/' ? 'ui/index.html' : data || join('ui', url.pathname.replace(/^\/+/, ''));
    const full = join(HERE, file);
    if (!full.startsWith(HERE) || !existsSync(full) || statSync(full).isDirectory()) return send(res, 404, 'not found');
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    createReadStream(full).pipe(res);
  } catch (e) {
    if (!res.headersSent) send(res, 502, String(e.message || e));
    else res.end();
  }
}

// localhost is both loopback addresses: browsers and Node may try ::1 first
// (macOS does), and webview.js loads live pages from the other loopback name.
const hosts = HOST === 'localhost' ? ['127.0.0.1', '::1'] : [HOST];
const wildcard = HOST === '0.0.0.0' || HOST === '::';
const at = (h) => `http://${h.includes(':') ? `[${h}]` : h}:${PORT}`;
const APP_URL = at(HOST === 'localhost' || wildcard ? 'localhost' : HOST);

// --open: open the app in the default browser once listening (npm start).
const openApp = () => process.argv.includes('--open') && import('child_process').then(({ spawn }) =>
  spawn({ darwin: 'open', win32: 'explorer' }[process.platform] || 'xdg-open', [APP_URL], { stdio: 'ignore', detached: true }).on('error', () => {}).unref());
const listen = (host) => new Promise((resolve, reject) => {
  const s = http.createServer(handle).once('error', reject);
  s.listen(PORT, host, () => { s.off('error', reject); resolve(s); });
});

async function start() {
  try { await listen(hosts[0]); } catch (e) {
    if (e.code !== 'EADDRINUSE') throw e;
    console.log(`Port ${PORT} is in use (already running?). Try --port N.`);
    openApp(); setTimeout(() => process.exit(1), 300);
    return;
  }
  for (const h of hosts.slice(1)) {
    await listen(h).catch((e) => {
      if (e.code === 'EAFNOSUPPORT' || e.code === 'EADDRNOTAVAIL') return; // no IPv6 here
      console.warn(e.code === 'EADDRINUSE' ? `${at(h)} is in use by another program; open ${at(hosts[0])} instead of localhost.` : `Not listening on ${h}: ${e.message}`);
    });
  }
  const ai = hasKey() ? `summaries on (${MODEL})` : 'summaries off (set ANTHROPIC_API_KEY)';
  console.log(`Stacks Browser on ${APP_URL}  ·  cache ${CACHE}  ·  ${ai}`);
  if (!isLoopback(HOST)) {
    const lan = wildcard ? Object.values(networkInterfaces()).flat().filter((a) => !a.internal && a.family === 'IPv4').map((a) => at(a.address)) : [at(HOST)];
    console.warn(`WARNING: listening on ${HOST}, so other machines can reach this server${lan.length ? ` (${lan.join(', ')})` : ''}. Anyone on the network can use the proxy, read and change your notes, save exports and spend your API budget on summaries. Use --host only on a network you trust.`);
  }
  for (const fn of startHooks) Promise.resolve().then(() => fn()).catch((e) => console.warn('start hook:', e.message));
  openApp();
}
await start();
