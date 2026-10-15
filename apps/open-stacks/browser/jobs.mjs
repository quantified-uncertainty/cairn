#!/usr/bin/env node
/**
 * Agent jobs, from the command line. The Stacks Browser writes open jobs to
 * jobs/open/ from what it learned and from gaps in the library; an agent does
 * them by following jobs/README.md (the playbook).
 *
 *   node jobs.mjs list [--all] [--json]
 *   node jobs.mjs next [--json]                 the highest-priority open job, in full, with the files to edit
 *   node jobs.mjs show <id>
 *   node jobs.mjs lookup "<id | URL | DOI | title>" [--lane <lane>]   corpus and lane-file matches
 *   node jobs.mjs lookup --lane <lane>          a lane's folders and counts
 *   node jobs.mjs check <id> [--live] [--json]  exit 0 when every criterion passes
 *   node jobs.mjs done <id> [--note "…"] [--force] [--live]
 *   node jobs.mjs drop <id> --why "…"
 *   node jobs.mjs new --type <type> --title "…" [--lane l] [--inputs id,id] [--count N] [--body "…"] [--priority p]
 *   node jobs.mjs skeleton <arxiv|lw|af|eaf|ia|pdf|web> <id or URL> --job <id>   an item to fill in
 *
 * Global options: --dir <jobs dir> (default $STACKS_JOBS_DIR or ./jobs) and
 * --root <browser dir> (default this folder).
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import * as J from './server/jobs.mjs';
import { localDay } from './server/learn.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flags = new Map(), pos = [];
for (let k = 0; k < argv.length; k++) {
  const a = argv[k];
  if (a.startsWith('--')) { const v = argv[k + 1]; if (v != null && !v.startsWith('--') && !['--all', '--json', '--live', '--force'].includes(a)) { flags.set(a.slice(2), v); k++; } else flags.set(a.slice(2), true); }
  else pos.push(a);
}
const ROOT = resolve(flags.get('root') || HERE);
const DIR = resolve(flags.get('dir') || process.env.STACKS_JOBS_DIR || join(ROOT, 'jobs'));
const json = flags.has('json');
const [cmd, arg] = pos;
const out = (s = '') => process.stdout.write(s + '\n');
const fail = (s, code = 1) => { process.stderr.write(s + '\n'); process.exit(code); };
const pr = (p) => J.PRIORITIES.indexOf(p), ty = (t) => J.TYPES.indexOf(t);
const sorted = (jobs) => jobs.slice().sort((a, b) => pr(a.priority) - pr(b.priority) || ty(a.type) - ty(b.type) || String(a.created).localeCompare(String(b.created)) || a.id.localeCompare(b.id));
const openJobs = () => J.listJobs(DIR).open.filter((x) => x.job).map((x) => x.job);
const findFile = (id) => [join(DIR, 'open', id + '.md'), join(DIR, 'done', id + '.md')].find((f) => existsSync(f));
const wantsText = (j) => (j.wants?.count != null && j.wants?.min != null ? `${j.wants.min}-${j.wants.max} items` : `${(j.inputs || []).length} inputs`);

function printJob(file) {
  out(readFileSync(file, 'utf-8').trimEnd());
}
function printCheck(r) {
  for (const l of r.lines) out(`${l.ok ? '✓' : '✗'} ${l.text}`);
  out(r.ok ? `\n${r.job?.id}: every check passes.` : `\n${r.job?.id || arg}: ${r.lines.filter((l) => !l.ok).length} check(s) failed.`);
}

switch (cmd) {
  case 'list': {
    const all = J.listJobs(DIR);
    const rows = [...all.open, ...(flags.has('all') ? all.done : [])].filter((x) => x.job).map((x) => x.job);
    if (json) { out(JSON.stringify(rows.map(({ body, ...j }) => j), null, 1)); break; }
    const open = sorted(rows.filter((j) => j.status === 'open'));
    if (!open.length && !flags.has('all')) out('No open jobs. (The app writes them; Refresh jobs in its Dashboard, or node jobs.mjs new.)');
    for (const j of open) out(`${j.priority.padEnd(6)} ${j.id.padEnd(20)} ${j.title}  [${wantsText(j)}; created ${j.created}]`);
    if (flags.has('all')) for (const j of rows.filter((x) => x.status !== 'open').sort((a, b) => String(b.done).localeCompare(String(a.done)))) out(`${j.status.padEnd(9)} ${j.id.padEnd(20)} ${j.title}  [${j.done}]`);
    const bad = [...all.open, ...all.done].filter((x) => x.errors.length);
    for (const x of bad) out(`! ${x.name}: ${x.errors.join('; ')}`);
    break;
  }
  case 'next': {
    const j = sorted(openJobs())[0];
    if (!j) { out('No open jobs.'); break; }
    if (json) { out(JSON.stringify(j, null, 1)); break; }
    printJob(join(DIR, 'open', j.id + '.md'));
    out(`\n# Files to edit: ${(j.output || []).join(', ')}`);
    out(`# Then: node jobs.mjs check ${j.id} --live  ·  node jobs.mjs done ${j.id} --note "…"`);
    break;
  }
  case 'show': {
    if (!arg) fail('usage: node jobs.mjs show <id>');
    const f = findFile(arg);
    if (!f) fail(`no job ${arg} in ${DIR}/open or ${DIR}/done`);
    printJob(f);
    break;
  }
  case 'lookup': {
    const data = J.loadData(ROOT);
    const corpus = data.corpus.items || [];
    const lane = flags.get('lane');
    if (lane && (!arg || lane === true)) {
      const its = corpus.filter((it) => it.lane === lane);
      if (!its.length) fail(`no items in lane ${lane}; lanes: ${[...new Set(corpus.map((it) => it.lane))].join(', ')}`);
      const folders = new Map();
      for (const it of its) { const k = (it.path || []).join(' › ') || '(no folder)'; folders.set(k, (folders.get(k) || 0) + 1); }
      out(`${lane}: ${its.length} items`);
      for (const [k, n] of [...folders].sort((a, b) => b[1] - a[1])) out(`  ${String(n).padStart(4)}  ${k}`);
      break;
    }
    if (!arg) fail('usage: node jobs.mjs lookup "<id | URL | DOI | title>" [--lane <lane>]');
    const q = String(arg).trim();
    const probe = /^https?:\/\//.test(q) ? { url: q, page: q } : /^10\.\d{4,}\//.test(q) ? { doi: q } : /^(arxiv|lw|eaf|ia|pdf|web):/i.test(q) ? { id: q.replace(/^arxiv:/i, 'arxiv:').replace(/v\d+$/, '') } : /^\d{4}\.\d{4,5}(v\d+)?$/.test(q) ? { id: 'arxiv:' + q.replace(/v\d+$/, '') } : { t: q };
    const pool = [...corpus.map((it) => ({ ...it, _in: 'corpus.json' })), ...data.lanes.flatMap((lf) => lf.data.items.map((it) => ({ ...it, lane: it.lane || lf.data.lane, _in: lf.file })))];
    const idx = J.keyIndex(pool);
    const hits = new Map();
    for (const k of J.dedupeKeys(probe)) for (const id of idx.get(k) || []) hits.set(id, k.split(':')[0]);
    // A plain title also matches by words, for near misses.
    if (probe.t) { const nt = J.normTitle(q); if (nt.length >= 6) for (const it of pool) if (J.normTitle(it.t).includes(nt)) hits.set(it.id, hits.get(it.id) || 'title words'); }
    const rows = pool.filter((it) => hits.has(it.id) && (!lane || lane === true || it.lane === lane));
    if (!rows.length) { out(`No match for ${JSON.stringify(q)}: not in the corpus or the lane files.`); break; }
    const seen = new Set();
    for (const it of rows) { const k = it.id + it._in; if (seen.has(k)) continue; seen.add(k); out(`${it.id}  [${it.lane}${it.path ? ' › ' + it.path.join(' › ') : ''}]  ${it.t}${it.a ? ' · ' + it.a : ''}${it.y ? ' · ' + it.y : ''}  (match: ${hits.get(it.id)}; in ${it._in})`); }
    break;
  }
  case 'check': {
    if (!arg) fail('usage: node jobs.mjs check <id> [--live] [--json]');
    const r = await J.checkJob(arg, { root: ROOT, dir: DIR, live: flags.has('live') });
    if (json) out(JSON.stringify({ ok: r.ok, lines: r.lines, files: r.files, added: r.added.map((x) => x.id), changed: r.changed, hostsAdded: r.hostsAdded }, null, 1));
    else printCheck(r);
    process.exit(r.ok ? 0 : 1);
    break;
  }
  case 'done': {
    if (!arg) fail('usage: node jobs.mjs done <id> [--note "…"] [--force]');
    const note = typeof flags.get('note') === 'string' ? flags.get('note') : '';
    const r = await J.doneJob(arg, { root: ROOT, dir: DIR, note, force: flags.has('force'), live: flags.has('live'), by: typeof flags.get('by') === 'string' ? flags.get('by') : 'agent' });
    if (!r.ok) { if (r.check?.lines?.length) printCheck(r.check); fail(`\nNot closed: ${r.why}.`); }
    out(`${arg} is done: ${r.file}`);
    out('\nCommit exactly these files (run from the browser folder):');
    out(`  ${r.add}`);
    out(`  ${r.commit}`);
    break;
  }
  case 'drop': {
    if (!arg || typeof flags.get('why') !== 'string') fail('usage: node jobs.mjs drop <id> --why "…"');
    try {
      const r = J.dropJob(arg, { root: ROOT, dir: DIR, why: flags.get('why') });
      out(`${arg} dropped: ${r.file}\n\nCommit:\n  ${r.add}\n  ${r.commit}`);
    } catch (e) { fail(e.message); }
    break;
  }
  case 'skeleton': {
    // A correctly shaped item to fill in: node jobs.mjs skeleton arxiv 2610.01995 --job discover-0001 [--lane llm]
    const [, src, raw] = pos;
    const job = typeof flags.get('job') === 'string' ? flags.get('job') : '<job id>';
    const today = localDay(Date.now());
    const gql = (host, id) => `https://${host}/graphql?query=${encodeURIComponent(`{post(input:{selector:{_id:"${id}"}}){result{htmlBody}}}`)}`;
    const base = { t: '', a: '', y: null, why: '', tags: [], added: today, job, via: { source: '', query: '', seeds: [] } };
    let it;
    if (src === 'arxiv' && raw) { const a = raw.replace(/^arxiv:/i, '').replace(/v\d+$/, ''); it = { id: `arxiv:${a}`, kind: 'pdf', ...base, d: `20${a.slice(0, 2)}-${a.slice(2, 4)}`, url: `https://arxiv.org/pdf/${a}`, page: `https://arxiv.org/abs/${a}`, via: { ...base.via, source: 'arxiv' } }; }
    else if ((src === 'lw' || src === 'af') && raw) it = { id: `lw:${raw}`, kind: 'html', ...base, d: '', url: gql('www.lesswrong.com', raw), page: `https://www.lesswrong.com/posts/${raw}/<slug>`, words: 0, ...(src === 'af' ? { src: 'Alignment Forum' } : {}), via: { ...base.via, source: src === 'af' ? 'alignment-forum' : 'lesswrong' } };
    else if (src === 'eaf' && raw) it = { id: `eaf:${raw}`, kind: 'html', ...base, d: '', url: gql('forum.effectivealtruism.org', raw), page: `https://forum.effectivealtruism.org/posts/${raw}/<slug>`, words: 0, via: { ...base.via, source: 'eaforum' } };
    else if (src === 'ia' && raw) it = { id: `ia:${raw}`, kind: 'scan', ...base, ia: raw, n: 0, url: `https://archive.org/details/${raw}`, page: `https://archive.org/details/${raw}`, license: 'Public domain (published before 1931)', via: { ...base.via, source: 'internet-archive' } };
    else if ((src === 'pdf' || src === 'web') && raw && /^https:\/\//.test(raw)) { const u = new URL(raw); const id = `${src}:${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`; it = { id, kind: src, ...base, url: raw, page: raw, via: { ...base.via, source: 'author-site' } }; }
    else fail('usage: node jobs.mjs skeleton <arxiv|lw|af|eaf|ia|pdf|web> <arXiv id | post _id | IA identifier | https URL> --job <id> [--lane <lane>]');
    if (typeof flags.get('lane') === 'string') it.lane = flags.get('lane');
    out(JSON.stringify(it, null, 1));
    break;
  }
  case 'new': {
    const type = flags.get('type'), title = flags.get('title');
    if (!J.TYPES.includes(type) || type === 'flag' || typeof title !== 'string') fail(`usage: node jobs.mjs new --type <${J.TYPES.filter((t) => t !== 'flag').join('|')}> --title "…" [--lane l] [--inputs id,id] [--count N] [--body "…"] [--priority high|normal|low]`);
    const data = J.loadData(ROOT);
    const byId = new Map((data.corpus.items || []).map((it) => [it.id, it]));
    const ids = typeof flags.get('inputs') === 'string' ? flags.get('inputs').split(',').map((s) => s.trim()).filter(Boolean) : [];
    const unknown = ids.filter((id) => !byId.has(id));
    if (unknown.length) fail(`not in the corpus: ${unknown.join(', ')}`);
    const lane = typeof flags.get('lane') === 'string' ? flags.get('lane') : byId.get(ids[0])?.lane || 'ai-safety';
    const count = Number(flags.get('count')) || 8;
    const priority = J.PRIORITIES.includes(flags.get('priority')) ? flags.get('priority') : 'normal';
    const laneName = data.corpus.lanes?.[lane] || lane;
    const w = J.writeNew(DIR, type, (id) => {
      const job = {
        id, type, title, priority, status: 'open', created: localDay(Date.now()), key: `${type}:manual:${id}`,
        target: { lane, laneName, label: title, ...(type === 'follow-author' ? { name: title } : {}) },
        inputs: ids.map((x) => ({ id: x, t: byId.get(x).t, ...(type === 'fix-item' ? { url: byId.get(x).url || byId.get(x).page || '', problem: 'flagged by hand' } : {}), ...(type === 'metadata' ? { missing: ['a', 'y'] } : {}) })),
        wants: ['discover', 'follow-author', 'grow-lane'].includes(type) ? { count, min: Math.max(1, Math.round(count * 0.6)), max: Math.round(count * 1.5) } : { all: true, count: ids.length },
        gen: J.GEN,
      };
      J.finish(job);
      if (typeof flags.get('body') === 'string') job.body = `## What to do\n\n${flags.get('body')}\n\n${job.body.slice(job.body.indexOf('## Finish'))}`;
      return job;
    });
    const hits = J.lintJob(w.job, w.text);
    out(`Wrote ${w.file}`);
    if (hits.length) out(`Warning: the job reads like reading history (${hits.map((h) => h.match).join(', ')}); job files are public.`);
    break;
  }
  default:
    out(readFileSync(fileURLToPath(import.meta.url), 'utf-8').split('\n').slice(2, 20).map((l) => l.replace(/^ \*\/?\s?/, '')).join('\n').trim());
    if (cmd && cmd !== 'help') process.exit(1);
}
