// Agent jobs (docs/learning/spec.md §5.2, §7): the app writes open jobs, one Markdown
// file each in jobs/open/, from the learned profile (app.learn, 47-learn.mjs) and the
// library's gaps (items that fail to open, broken images, untagged items, missing
// metadata, reader flags). An outside agent does them (jobs/README.md). The app
// itself makes no new network requests and never runs git.
//
//   GET  /jobs                 open and done jobs, the prompts, caps, refresh times
//   POST /jobs/refresh         generate now → {created, updated, skipped, ms}
//   POST /jobs/flag            a reader flag → {id, path, asset}
//   POST /jobs/dismiss {id}    close as dismissed (its key cools down as if done)
//   POST /jobs/report {id, kind, msg, status, t?}   an item failed to open in the reader
//   GET  /jobs/asset?name=     a flag's picture
//
// STACKS_JOBS_DIR moves the jobs folder (tests); STACKS_JOBS_EVERY hours between
// automatic refreshes (24; 0 = only on request); STACKS_JOBS_MAX caps open jobs (30).
// Bookkeeping lives in CACHE/jobs/: state.json (runs, what was written) and
// errors.json (open errors the reader's browser saw), never in the repo.
import { readFileSync, writeFileSync, renameSync, mkdirSync, statSync, existsSync, createReadStream, unlinkSync, readdirSync } from 'fs';
import { join, resolve, relative, isAbsolute } from 'path';
import * as J from '../jobs.mjs';
import { localDay } from '../learn.mjs';

const DAY = 864e5;
const readJson = (f, dflt) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return dflt; } };
const writeJson = (f, o) => { writeFileSync(f + '.tmp', JSON.stringify(o)); renameSync(f + '.tmp', f); };
const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };

export default function (app) {
  const ROOT = process.env.STACKS_JOBS_DIR ? resolve(process.env.STACKS_JOBS_DIR) : join(app.HERE, 'jobs');
  const STATE_DIR = join(app.CACHE, 'jobs');
  mkdirSync(STATE_DIR, { recursive: true });
  try { J.ensureDirs(ROOT); } catch (e) { console.warn('jobs: cannot create the jobs folder:', e.message); }
  const EVERY = Number.isFinite(Number(process.env.STACKS_JOBS_EVERY)) && process.env.STACKS_JOBS_EVERY !== '' ? Number(process.env.STACKS_JOBS_EVERY) : 24;
  const caps = { ...J.CAPS, total: Number(process.env.STACKS_JOBS_MAX) || J.CAPS.total };
  const REPO = J.repoPathOf(app.HERE);
  const rel = (f) => { const r = relative(app.HERE, f); return r && !r.startsWith('..') && !isAbsolute(r) ? r.split('\\').join('/') : f; };
  const DIR_REL = rel(ROOT);
  const STATE = join(STATE_DIR, 'state.json'), ERRORS = join(STATE_DIR, 'errors.json');
  const state = { lastRefresh: 0, nextRefresh: 0, written: {}, runs: [], media: {}, ...readJson(STATE, {}) };
  const errors = { items: {}, ...readJson(ERRORS, {}) };
  const saveState = () => { try { writeJson(STATE, state); } catch (e) { console.warn('jobs: state:', e.message); } };
  let errT = null;
  const saveErrors = () => { clearTimeout(errT); errT = setTimeout(() => { try { writeJson(ERRORS, errors); } catch (e) { console.warn('jobs: errors:', e.message); } }, 500); errT.unref?.(); };

  /** For 47-learn: an item that failed to open is not an exposure. */
  app.jobs = { errorOf: (id) => errors.items[id] || null, dir: ROOT };

  // ---- the listing, re-read when a folder or file changes (checked at most every 2 s)
  let listing = null, listedAt = 0, listSig = '';
  const counts = { open: 0, high: 0, done: 0 };
  function list(force = false) {
    if (!force && listing && Date.now() - listedAt < 2000) return listing;
    listedAt = Date.now();
    // The folders' mtimes catch added, moved and removed jobs; the files' catch an edit in place.
    const sig = ['open', 'done'].map((d) => { const p = join(ROOT, d); let s = String(mtime(p)); try { for (const f of readdirSync(p)) if (f.endsWith('.md')) s += ',' + mtime(join(p, f)); } catch { /* no folder */ } return s; }).join('|');
    if (!force && listing && sig === listSig) return listing;
    listing = J.listJobs(ROOT); listSig = sig;
    const open = listing.open.filter((x) => x.job);
    counts.open = open.length; counts.high = open.filter((x) => x.job.priority === 'high').length; counts.done = listing.done.length;
    return listing;
  }
  try { list(true); } catch { /* no folder yet */ }
  const countT = setInterval(() => { try { list(); } catch { /* gone */ } }, 30e3);
  countT.unref?.();

  // ---- data files an agent edits
  const dataFile = (f) => join(app.HERE, 'data', f);
  const tagsFile = () => (process.env.STACKS_TAGS ? resolve(process.env.STACKS_TAGS) : dataFile('tags.json'));
  let rescue = null;
  import('../rescue.mjs').then((m) => { rescue = m; }).catch(() => {});

  // ---- generate
  let running = null;
  async function refresh(reason = 'request') {
    if (running) return running;
    running = (async () => {
      const t0 = Date.now();
      if (app.learn?.ready && !app.learn.index) await app.learn.ready();
      const ctx = {
        profile: app.learn?.profile || null, index: app.learn?.index || null, items: app.learn?.items || readJson(join(app.HERE, 'corpus.json'), { items: [] }).items,
        lanes: app.learn?.lanes || {}, rescue: rescue?.S || { docs: {}, imgs: {} }, errors, tags: readJson(tagsFile(), null),
        overrides: readJson(dataFile('overrides.json'), { items: {} }), mediaFixes: readJson(dataFile('media-fixes.json'), { images: {} }),
      };
      const r = J.refresh(ROOT, ctx, state, { caps, now: Date.now() });
      const ms = Date.now() - t0;
      state.lastRefresh = Date.now();
      state.nextRefresh = EVERY > 0 ? state.lastRefresh + EVERY * 3600e3 : 0;
      state.runs = [...(state.runs || []), { at: state.lastRefresh, ms, reason, created: r.created, updated: r.updated, skipped: r.skipped }].slice(-50);
      saveState();
      list(true);
      if (r.created.length || r.updated.length) console.log(`jobs: ${r.created.length} created, ${r.updated.length} updated (${reason})`);
      return { ...r, ms };
    })().finally(() => { running = null; });
    return running;
  }

  // ---- routes
  const view = (x) => {
    const { body, ...j } = x.job;
    return { ...j, body, file: rel(x.file), errors: x.errors.length ? x.errors : undefined, prompt: x.job.status === 'open' ? J.jobPrompt(x.job.id, REPO) : undefined };
  };
  const resultOf = (x) => {
    const m = /\n## Result\n+([\s\S]*)$/.exec(x.job.body || '');
    const r = x.job.result || {};
    return { added: r.added || [], changed: r.changed || [], files: r.files || [], text: m ? m[1].trim() : '' };
  };
  app.route('GET', '/jobs', (req, res) => {
    const l = list();
    const open = l.open.filter((x) => x.job).map(view)
      .sort((a, b) => J.PRIORITIES.indexOf(a.priority) - J.PRIORITIES.indexOf(b.priority) || J.TYPES.indexOf(a.type) - J.TYPES.indexOf(b.type) || String(a.created).localeCompare(String(b.created)) || a.id.localeCompare(b.id));
    const done = l.done.filter((x) => x.job).sort((a, b) => String(b.job.done).localeCompare(String(a.job.done)) || b.mtime - a.mtime).slice(0, 50)
      .map((x) => ({ id: x.job.id, type: x.job.type, title: x.job.title, status: x.job.status, done: x.job.done, created: x.job.created, priority: x.job.priority, key: x.job.key, target: x.job.target, inputs: x.job.inputs, file: rel(x.file), result: resultOf(x) }));
    const broken = [...l.open, ...l.done].filter((x) => x.errors.length).map((x) => ({ file: rel(x.file), errors: x.errors }));
    app.json(res, { dir: DIR_REL, repoPath: REPO, every: EVERY, running: !!running, lastRefresh: state.lastRefresh || 0, nextRefresh: EVERY > 0 && state.lastRefresh ? state.lastRefresh + EVERY * 3600e3 : 0, prompt: J.allPrompt(REPO), caps, open, done, broken });
  });
  app.route('POST', '/jobs/refresh', async (req, res) => {
    try { app.json(res, await refresh('request')); } catch (e) { app.json(res, { error: e.message }, 500); }
  });
  app.route('POST', '/jobs/flag', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON (or a picture over the size limit)' }, 400); }
    const items = app.learn?.items?.length ? app.learn.items : readJson(join(app.HERE, 'corpus.json'), { items: [] }).items;
    const it = items.find((x) => x.id === b?.id);
    if (!it) return app.json(res, { error: 'unknown item' }, 400);
    if (b.kind != null && !J.FLAG_KINDS[b.kind]) return app.json(res, { error: `kind must be one of ${Object.keys(J.FLAG_KINDS).join(', ')}` }, 400);
    const note = String(b.note || '').replace(/\r/g, '').slice(0, 1000);
    let shot = null;
    if (b.shot) {
      const m = /^data:image\/(webp|png);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.shot));
      if (!m) return app.json(res, { error: 'shot must be a data:image/webp or data:image/png base64 URL' }, 400);
      if (m[2].length > 2 * 1024 * 1024) return app.json(res, { error: 'shot is over 2 MB' }, 400);
      shot = { ext: m[1], buf: Buffer.from(m[2], 'base64') };
    }
    const page = Number.isFinite(Number(b.page)) ? Math.max(1, Math.round(Number(b.page))) : null;
    const v = b.view && typeof b.view === 'object' ? b.view : {};
    const viewSafe = { zoom: !!v.zoom, per: Number.isFinite(Number(v.per)) ? Number(v.per) : null, crop: !!v.crop, cols: !!v.cols, flow: !!v.flow, theme: typeof v.theme === 'string' ? v.theme.slice(0, 20) : null };
    let w;
    try { w = J.makeFlag(ROOT, { item: it, page, kind: b.kind || 'other', note, view: viewSafe, asset: shot ? `{id}.${shot.ext}` : null }); } catch (e) { return app.json(res, { error: e.message }, 500); }
    const hits = J.lintJob(w.job, w.text);
    if (hits.length) { try { unlinkSync(w.file); } catch { /* gone */ } return app.json(res, { error: 'the flag reads like reading history', hits }, 400); }
    let asset = null;
    if (shot) { asset = join(ROOT, 'assets', `${w.id}.${shot.ext}`); writeFileSync(asset, shot.buf); }
    state.written[w.id] = null;
    list(true);
    app.json(res, { id: w.id, path: rel(w.file), asset: asset ? rel(asset) : null });
  });
  app.route('POST', '/jobs/dismiss', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    if (!/^[a-z-]+-\d{4,}$/.test(b?.id || '')) return app.json(res, { error: 'id must be a job id' }, 400);
    try { J.dismissJob(ROOT, b.id); } catch (e) { return app.json(res, { error: e.message }, 404); }
    list(true);
    app.json(res, { ok: true });
  });
  app.route('POST', '/jobs/report', async (req, res) => {
    let b; try { b = await app.body(req); } catch { return app.json(res, { error: 'bad JSON' }, 400); }
    if (typeof b?.id !== 'string' || !b.id || b.id.length > 300) return app.json(res, { error: 'id' }, 400);
    const t = Number.isFinite(Number(b.t)) ? Number(b.t) : Date.now();
    const d = localDay(t);
    const e = errors.items[b.id] || { n: 0, days: [], status: null, msg: '', last: 0 };
    e.n++;
    if (!e.days.includes(d)) e.days = [...e.days, d].sort().slice(-5);
    const st = Number(b.status);
    if (Number.isFinite(st) && st >= 100 && st < 600) e.status = st;
    if (b.msg) e.msg = String(b.msg).slice(0, 200);
    e.kind = String(b.kind || 'open').slice(0, 20);
    e.last = Math.max(e.last || 0, t);
    errors.items[b.id] = e;
    const ids = Object.keys(errors.items);
    if (ids.length > 2000) for (const id of ids.sort((a, c) => errors.items[a].last - errors.items[c].last).slice(0, ids.length - 2000)) delete errors.items[id];
    saveErrors();
    app.json(res, { ok: true });
  });
  app.route('GET', '/jobs/asset', (req, res, url) => {
    const name = url.searchParams.get('name') || '';
    if (!/^[a-z-]+-\d{4}\.(webp|png)$/.test(name)) return app.json(res, { error: 'bad name' }, 400);
    const f = join(ROOT, 'assets', name);
    if (!existsSync(f)) return app.json(res, { error: 'not found' }, 404);
    res.writeHead(200, { 'Content-Type': name.endsWith('.png') ? 'image/png' : 'image/webp', 'Cache-Control': 'no-cache' });
    createReadStream(f).pipe(res);
  });
  app.status(() => ({ jobs: { open: counts.open, high: counts.high, done: counts.done, lastRefresh: state.lastRefresh || 0 } }));

  // ---- when the corpus changes: new items' hosts are open hosts; their documents get the archive fallback
  const allow = (items) => {
    // Never proxy a shadow library (jobs/hosts.json "deny"), even if an item on one got into corpus.json.
    const hosts = J.loadHosts(ROOT, app.HERE);
    for (const h of [...app.cache.ALLOW]) if (J.denied(h, hosts)) app.cache.ALLOW.delete(h);
    for (const it of items) {
      if ([it.url, it.page, it.pdf].some((u) => u && J.deniedUrl(u, hosts))) continue;
      for (const u of [it.url, it.page, it.pdf]) { try { if (u) app.cache.ALLOW.add(new URL(u).hostname.replace(/^www\./, '')); } catch { /* not a URL */ } }
      if (it.added && rescue?.addDoc && (it.kind === 'web' || it.kind === 'pdf') && it.url) rescue.addDoc(it.url, { kind: it.kind, t: it.t, a: it.a, id: it.id });
    }
  };
  app.learn?.onCorpus?.(allow);

  // ---- image fixes from agents (data/media-fixes.json), applied through the rescue's manual copy
  let mediaSig = -1;
  async function media() {
    const m = mtime(dataFile('media-fixes.json'));
    if (m === mediaSig || !rescue?.manualCopy) return;
    mediaSig = m;
    const fixes = readJson(dataFile('media-fixes.json'), null);
    if (!fixes) return;
    state.media ||= {};
    const done = await J.applyMediaFixes(fixes, state.media, rescue.manualCopy);
    if (done.length) { saveState(); console.log(`jobs: applied ${done.length} image fix(es) from data/media-fixes.json`); }
  }

  app.onStart(() => {
    const first = setTimeout(() => {
      media().catch((e) => console.warn('jobs: media fixes:', e.message));
      if (EVERY > 0 && Date.now() - (state.lastRefresh || 0) > EVERY * 3600e3) refresh('daily').catch((e) => console.warn('jobs: refresh:', e.message));
    }, Number(process.env.STACKS_JOBS_DELAY) || 120e3);
    first.unref?.();
    const hourly = setInterval(() => {
      media().catch(() => {});
      if (EVERY > 0 && Date.now() - (state.lastRefresh || 0) > EVERY * 3600e3) refresh('daily').catch((e) => console.warn('jobs: refresh:', e.message));
    }, 3600e3);
    hourly.unref?.();
    const watch = setInterval(() => media().catch(() => {}), 60e3);
    watch.unref?.();
  });
}
