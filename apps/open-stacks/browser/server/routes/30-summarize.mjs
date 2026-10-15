// AI summaries and "ask about this item".
//
//   POST /summarize {id, model?, force?, laneId, kind, text, ...}  -> NDJSON stream:
//        {type:'partial', summary} … then {type:'final', summary} or {type:'error', error, code}
//   GET  /summary?id=&model=   cached summary or null (never calls the model)
//   POST /ask {id, model?, q, text, ...}  -> NDJSON: {type:'delta', text} … {type:'final', answer}
//   GET  /asks?id=             cached questions and answers for an item
//
// The UI extracts the text (with [p. N] page markers) and sends it. Summaries
// use per-lane prompts and schemas; each key point carries a verbatim quote,
// which is checked here against that text. Spend is metered per day against
// STACKS_DAILY_BUDGET (USD, default 3) in CACHE/spend.json. STACKS_MOCK_AI=1
// streams canned output built from the real text, for testing without a key.
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const MOCK = /^(1|true|yes)$/i.test(process.env.STACKS_MOCK_AI || '');
const MOCK_DELAY = Number(process.env.STACKS_MOCK_DELAY) || 28; // ms per streamed chunk
const BUDGET = Number.isFinite(parseFloat(process.env.STACKS_DAILY_BUDGET)) ? parseFloat(process.env.STACKS_DAILY_BUDGET) : 3;
// USD per million tokens [input, output].
const PRICES = { 'claude-haiku-5-5': [0.1, 0.5], 'claude-sonnet-5-5': [2, 10], 'claude-opus-5-5': [4, 20], 'claude-fable-5-1': [10, 50] };
// Models that take the server-side refusal fallback ("default" routing).
const FALLBACK = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1']);
const price = (m) => PRICES[m] || PRICES['claude-opus-5-5'];

let anthropic = null;
async function client(app) {
  if (anthropic) return anthropic;
  if (!app.hasKey()) throw Object.assign(new Error('Set ANTHROPIC_API_KEY to enable summaries'), { code: 'no_key' });
  let Anthropic;
  try { ({ default: Anthropic } = await import('@anthropic-ai/sdk')); } catch {
    throw Object.assign(new Error('Run `npm install` in the browser folder to enable summaries'), { code: 'no_sdk' });
  }
  anthropic = new Anthropic();
  return anthropic;
}

// ---- per-lane prompts and schema extras ----
const str = (description) => ({ type: 'string', description });
const page = { type: ['integer', 'null'], description: 'page number from the [p. N] markers, or null' };
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const list = (items, description) => ({ type: 'array', items, description });

const FAMILIES = {
  paper: {
    label: 'research paper',
    guide: 'Lead with the central claim or result as a specific finding (with numbers if the paper gives them). Describe the method in a sentence or two. Rate the strength of the evidence as weak, moderate or strong, judging the design, data, baselines and ablations rather than the authors\' confidence, and say why in one sentence. List the main limitations, including ones the authors do not state if they are evident from the text.',
    props: {
      claim: str('The central claim or result, as one specific sentence.'),
      method: str('How they got it: 1-2 sentences.'),
      evidence: obj({ strength: { type: 'string', enum: ['weak', 'moderate', 'strong'] }, why: str('One sentence on why.') }),
      limitations: list({ type: 'string' }, '1-4 short limitations.'),
    },
  },
  post: {
    label: 'essay or post',
    guide: 'State its central claim in one sentence. Give the strongest counterpoint a careful, informed critic would raise: steelman it in one or two sentences. List the key concepts it introduces or relies on, each with a short gloss.',
    props: {
      claim: str('The central claim, in one sentence.'),
      counterpoint: str('The strongest counterpoint a careful critic would raise, 1-2 sentences.'),
      concepts: list(obj({ term: str('The concept.'), gloss: str('What it means here, under 15 words.') }), '2-5 key concepts.'),
    },
  },
  textbook: {
    label: 'textbook or technical book',
    guide: 'Say what it teaches and to whom. List the prerequisites a reader needs. Name the best chapters or sections with their pages (from the [p. N] markers or the table of contents) and why each is worth reading.',
    props: {
      teaches: str('What it teaches and to whom, 1-2 sentences.'),
      prerequisites: list({ type: 'string' }, 'What a reader needs first; short phrases.'),
      best_chapters: list(obj({ title: str('Chapter or section.'), page, why: str('Why it is worth reading, under 20 words.') }), '1-4 best chapters or sections.'),
    },
  },
  ttrpg: {
    label: 'tabletop roleplaying game manual',
    guide: 'Describe the core mechanic precisely: what players roll or do, when, and how results are read. List its distinctive ideas, the things a designer or game master would not find in a typical game. List pages worth stealing (tables, procedures, subsystems) with their page numbers and what is there.',
    props: {
      mechanic: str('The core mechanic, precisely, 1-2 sentences.'),
      ideas: list({ type: 'string' }, '2-4 distinctive ideas.'),
      steal: list(obj({ page, what: str('What is on that page worth stealing, under 15 words.') }), '1-4 pages worth stealing.'),
    },
  },
  oddity: {
    label: 'old technical book or document',
    guide: 'Say plainly what it is: its genre, purpose and audience at the time. Say why it is interesting now, to a modern researcher or designer. Point to the best page or plate, with its page number, and what is on it.',
    props: {
      what_it_is: str('What it is, 1-2 sentences.'),
      why_now: str('Why it is interesting now, 1-2 sentences.'),
      best_page: obj({ page, what: str('What is on it, under 20 words.') }),
    },
  },
};
const LANE_FAMILY = {
  lesswrong: 'post', 'ai-safety': 'paper', 'deepmind-safety': 'paper', llm: 'paper', forecasting: 'paper',
  textbooks: 'textbook', 'information-theory': 'textbook', cybernetics: 'textbook', ttrpg: 'ttrpg', oddities: 'oddity',
};
export function familyOf({ laneId, kind }) {
  const fam = LANE_FAMILY[laneId];
  if (fam === 'paper' && kind === 'html') return 'post'; // Alignment Forum posts on the paper shelves
  return fam || { scan: 'oddity', text: 'textbook', html: 'post', web: 'post' }[kind] || 'paper';
}
function schemaFor(fam) {
  // Order matters: fields stream in this order, so the verdict arrives first.
  return obj({
    verdict: { type: 'string', enum: ['skip', 'skim', 'read', 'study'] },
    minutes: { type: 'integer', description: 'Estimated minutes to read the whole thing carefully.' },
    why_care: str('One sentence: why a researcher in forecasting, AI safety, rationality or decision theory might care. Plain and specific.'),
    gist: str('2-4 sentences: what the work argues or contains.'),
    ...FAMILIES[fam].props,
    key_points: list(obj({
      point: str('A specific finding, argument, procedure or number.'),
      page,
      quote: str('One sentence copied verbatim from the text that supports the point: no paraphrase, no ellipses, no [p. N] markers.'),
    }), '3-6 key points.'),
    this_spread: str('What is on the pages currently shown, in 1-2 sentences.'),
  });
}
const docBlock = (b) => `<document>\nTitle: ${b.title}\nAuthors: ${b.authors || 'unknown'}\nYear: ${b.year || 'unknown'}\nShelf: ${b.lane || b.laneId || 'unknown'}\n<text>\n${String(b.text || '').slice(0, 90000)}\n</text>\n</document>`;
function summaryPrompt(b, fam) {
  return `You are helping a researcher triage reading quickly: they skim many items and decide in seconds what deserves their time. Summarize the ${FAMILIES[fam].label} above for them. Pages currently on screen: ${b.spread || 'unknown'}.

${FAMILIES[fam].guide}

Key points: 3-6 of the most useful specifics (findings, arguments, procedures, numbers), each with its page from the [p. N] markers and a "quote": the one sentence from the text that best supports it, copied exactly, character for character. Never paraphrase, merge or shorten a quote, and leave out the [p. N] markers; the reader's software checks each quote against the text and flags any it cannot find.

Be concrete and faithful to the text; do not invent claims. Write plainly, without hype. If the text is front matter or OCR noise, say what you can and keep it short.`;
}
function askPrompt(b, fam) {
  return `Answer the reader's question about the ${FAMILIES[fam].label} above, from its text. Be brief: 2-6 sentences of plain prose, no headings or lists. Cite the page for each claim as (p. N) using the [p. N] markers. When a short exact quote settles the question, include it in quotation marks. If the text does not answer the question, say so, and say what it does cover.

Question: ${String(b.q).slice(0, 500)}`;
}

// ---- tolerant parsing of a JSON object that is still being written ----
/** Parse JSON cut off mid-stream: close the open string, arrays and objects,
 *  dropping a trailing key that has no value yet. Returns null if nothing parses. */
export function parsePartial(s) {
  try { return JSON.parse(s); } catch { /* partial */ }
  const stack = []; const keyMode = []; // closers; per level: expecting a key?
  let inStr = false, esc = false, strIsKey = false, cut = 0, cutStack = [];
  const mark = (at) => { cut = at; cutStack = stack.slice(); };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') { inStr = false; if (!strIsKey) mark(i + 1); }
      continue;
    }
    if (c === '"') { inStr = true; strIsKey = stack.at(-1) === '}' && keyMode.at(-1); }
    else if (c === '{' || c === '[') { stack.push(c === '{' ? '}' : ']'); keyMode.push(c === '{'); mark(i + 1); }
    else if (c === '}' || c === ']') { stack.pop(); keyMode.pop(); mark(i + 1); }
    else if (c === ':') keyMode[keyMode.length - 1] = false;
    else if (c === ',') { if (stack.at(-1) === '}') keyMode[keyMode.length - 1] = true; mark(i); }
  }
  const close = (st) => st.slice().reverse().join('');
  const tries = [];
  if (inStr && !strIsKey) tries.push(s.slice(0, esc ? -1 : undefined).replace(/\\u[0-9a-fA-F]{0,3}$/, '') + '"' + close(stack));
  tries.push(s.slice(0, cut) + close(cutStack));
  for (const t of tries) { try { return JSON.parse(t); } catch { /* next */ } }
  return null;
}

// ---- quote verification ----
// Compare on a skeleton: letters and digits only, lowercased, accents and
// ligatures decomposed. That absorbs whitespace, curly quotes, dashes and
// line-break hyphenation. The UI uses the same function to find the quote on the page.
export const skel = (s) => String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const MARK = /\[(?:p\. (\d+)|opening pages|around p\. \d+)\]/g;
function indexText(text) {
  let sk = '', last = 0, m;
  const pages = []; // [skeleton offset, page or null]
  MARK.lastIndex = 0;
  while ((m = MARK.exec(text))) {
    sk += skel(text.slice(last, m.index));
    pages.push([sk.length, m[1] ? Number(m[1]) : null]);
    last = m.index + m[0].length;
  }
  return { sk: sk + skel(text.slice(last)), pages };
}
function findQuote(ix, quote) {
  const frags = String(quote).split(/\[?(?:\.\s?){3}\]?|…/).map(skel).filter((f) => f.length >= 4);
  if (!frags.length || frags.reduce((a, f) => a + f.length, 0) < 15) return null;
  let from = 0, start = -1;
  for (const f of frags) {
    const at = ix.sk.indexOf(f, from);
    if (at < 0) return null;
    if (start < 0) start = at;
    from = at + f.length;
  }
  let pg = null;
  for (const [at, p] of ix.pages) { if (at > start) break; pg = p; }
  return { page: pg };
}
/** Mark key points' quotes as verified or not (the first `upto`), correcting the page from where the quote was found. */
function verify(ix, s, upto = Infinity) {
  (s.key_points || []).forEach((kp, j) => {
    if (j >= upto || !kp || typeof kp.quote !== 'string') return;
    const hit = findQuote(ix, kp.quote);
    kp.quote_ok = !!hit;
    if (hit?.page) kp.page = hit.page;
  });
  return s;
}

// ---- spend ----
const day = () => new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
function costOf(model, u = {}) {
  const parts = Array.isArray(u.iterations) && u.iterations.some((x) => x.type === 'message' || x.type === 'fallback_message')
    ? u.iterations.filter((x) => x.type === 'message' || x.type === 'fallback_message') : [u];
  return parts.reduce((usd, x) => {
    const [pi, po] = price(x.model || model);
    const inTok = (x.input_tokens || 0) + 1.25 * (x.cache_creation_input_tokens || 0) + 0.1 * (x.cache_read_input_tokens || 0);
    return usd + (inTok * pi + (x.output_tokens || 0) * po) / 1e6;
  }, 0);
}

export default function (app) {
  const { MODEL, CACHE, cache } = app;
  mkdirSync(join(CACHE, 'asks'), { recursive: true });
  const SPEND = join(CACHE, 'spend.json');
  let spend = {}; try { spend = JSON.parse(readFileSync(SPEND, 'utf-8')); } catch { /* new */ }
  let reserved = 0; // estimates of calls in flight
  const todayRec = () => (spend[day()] ||= { usd: 0, calls: 0, models: {} });
  const spendInfo = () => ({ today: +todayRec().usd.toFixed(4), budget: BUDGET, calls: todayRec().calls });
  function charge(model, usd) {
    const t = todayRec();
    t.usd += usd; t.calls++;
    const m = (t.models[model] ||= { usd: 0, calls: 0 }); m.usd += usd; m.calls++;
    const keep = Object.keys(spend).sort().slice(-90); // three months of history
    spend = Object.fromEntries(keep.map((d) => [d, spend[d]]));
    writeFileSync(SPEND, JSON.stringify(spend, null, 1));
  }
  /** Refuse before calling when today's spend plus this call's estimate would pass the cap. */
  function reserve(model, chars, outTok) {
    const [pi, po] = price(model);
    const est = ((chars / 3.5) * pi + outTok * po) / 1e6;
    const spent = todayRec().usd + reserved;
    if (spent + est > BUDGET) {
      const msg = spent >= BUDGET
        ? `Daily AI budget reached: $${spent.toFixed(2)} of $${BUDGET.toFixed(2)} spent today.`
        : `Daily AI budget nearly used: $${spent.toFixed(2)} of $${BUDGET.toFixed(2)} spent today, and this call would cost about $${est.toFixed(2)}.`;
      throw Object.assign(new Error(msg + ' Raise STACKS_DAILY_BUDGET (USD) to continue, or pick a cheaper model.'), { code: 'budget' });
    }
    reserved += est;
    return () => { reserved = Math.max(0, reserved - est); };
  }

  const pickModel = (m) => (m && (PRICES[m] || m === MODEL) ? m : MODEL);
  const file = (id, model) => join(CACHE, 'summaries', cache.key(id + '|' + model) + '.json');
  const askFile = (id) => join(CACHE, 'asks', cache.key(id) + '.json');
  const readJson = (f, d) => { try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return d; } };

  /** One model call, streamed. onText(textSoFar) on every delta. Real SDK or mock. */
  async function generate({ model, content, schema, maxTokens, mock }, onText) {
    if (MOCK) return mockStream(model, content, mock(), onText);
    const c = await client(app);
    const params = {
      model, max_tokens: maxTokens,
      output_config: { effort: 'low', ...(schema && { format: { type: 'json_schema', schema } }) },
      messages: [{ role: 'user', content }],
    };
    if (FALLBACK.has(model)) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    const stream = c.beta.messages.stream(params);
    let text = '';
    for await (const ev of stream) {
      // A refusal fallback restarts the answer on another model: start over.
      if (ev.type === 'content_block_start' && ev.content_block.type === 'fallback') { text = ''; onText(text); }
      else if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { text += ev.delta.text; onText(text); }
    }
    const msg = await stream.finalMessage();
    return { text, model: msg.model || model, usage: msg.usage, stop: msg.stop_reason };
  }
  async function mockStream(model, content, out, onText) {
    let text = '';
    for (let i = 0; i < out.length;) {
      const n = 8 + Math.floor(Math.random() * 24);
      text += out.slice(i, i + n); i += n;
      onText(text);
      await new Promise((r) => setTimeout(r, MOCK_DELAY));
    }
    const chars = content.reduce((a, b) => a + b.text.length, 0);
    return { text, model, mock: true, usage: { input_tokens: Math.round(chars / 3.6), output_tokens: Math.round(out.length / 3.2) + 180 }, stop: 'end_turn' };
  }

  // ---- summaries ----
  const jobs = new Map(); // cache file -> { listeners, last, promise }
  let made = 0, asked = 0;

  function summarize(b, onPartial) {
    const model = pickModel(b.model);
    const f = file(b.id, model);
    if (!b.force && !jobs.has(f) && existsSync(f)) return Promise.resolve(readJson(f, null));
    let job = jobs.get(f);
    if (!job) {
      job = { listeners: new Set(), last: null };
      job.promise = runSummary(b, model, f, job).finally(() => jobs.delete(f));
      jobs.set(f, job);
    }
    if (onPartial) { job.listeners.add(onPartial); if (job.last) onPartial(job.last); }
    return job.promise.finally(() => job.listeners.delete(onPartial));
  }

  async function runSummary(b, model, f, job) {
    const fam = familyOf(b);
    const text = String(b.text || '');
    const release = reserve(model, text.length + 2000, 1800);
    const ix = indexText(text);
    let lastSent = 0, lastJson = '';
    const push = (s, force) => {
      if (!force && Date.now() - lastSent < 90) return;
      const j = JSON.stringify(s);
      if (j === lastJson) return;
      lastSent = Date.now(); lastJson = j;
      job.last = s;
      for (const fn of job.listeners) fn(s);
    };
    try {
      const r = await generate({
        model, schema: schemaFor(fam), maxTokens: 8000,
        content: [{ type: 'text', text: docBlock(b) }, { type: 'text', text: summaryPrompt(b, fam) }],
        mock: () => mockSummary(b, fam),
      }, (t) => {
        if (Date.now() - lastSent < 90) return; // parse at most ~11 times a second
        const p = parsePartial(t);
        if (p && typeof p === 'object') push(verify(ix, { ...p, family: fam, model, partial: true }, (p.key_points?.length || 1) - 1));
      });
      const cost = costOf(r.model, r.usage);
      charge(r.model, cost);
      if (r.stop === 'refusal') throw Object.assign(new Error('The model declined to summarize this item'), { code: 'refusal' });
      let parsed, complete = true;
      try { parsed = JSON.parse(r.text); } catch { parsed = parsePartial(r.text); complete = false; }
      if (!parsed) throw new Error(r.stop === 'max_tokens' ? 'The summary was cut off' : 'No summary returned');
      const out = verify(ix, { ...parsed, family: fam, model: r.model + (r.mock ? ' (mock)' : ''), cost: +cost.toFixed(4), at: new Date().toISOString() });
      if (complete) { writeFileSync(f, JSON.stringify(out)); made++; } else out.truncated = true;
      push(out, true);
      return out;
    } finally { release(); }
  }

  /** Stream NDJSON lines to the client; tolerate it going away. */
  function ndjson(res) {
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' });
    return (o) => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(o) + '\n'); };
  }
  const fail = (e) => ({ type: 'error', error: e.message, code: e.code || (e.status ? 'api_' + e.status : 'error'), spend: spendInfo() });

  app.route('POST', '/summarize', async (req, res) => {
    const b = await app.body(req);
    const send = ndjson(res);
    try {
      const out = await summarize(b, (s) => send({ type: 'partial', summary: s }));
      send({ type: 'final', summary: out, spend: spendInfo() });
    } catch (e) { send(fail(e)); }
    res.end();
  });
  app.route('GET', '/summary', (req, res, url) => {
    const f = file(url.searchParams.get('id'), pickModel(url.searchParams.get('model')));
    return existsSync(f) ? app.send(res, 200, readFileSync(f), 'application/json') : app.json(res, null);
  });
  app.route('POST', '/summary/forget', async (req, res) => {
    const b = await app.body(req);
    const f = file(b.id, pickModel(b.model));
    if (existsSync(f)) unlinkSync(f);
    app.json(res, { ok: true });
  });

  // ---- ask ----
  const qkey = (model, q) => model + '|' + String(q).toLowerCase().replace(/\s+/g, ' ').replace(/[?.!\s]+$/, '').trim();
  const asking = new Map(); // id|qkey -> promise (dedupe double submits)

  app.route('POST', '/ask', async (req, res) => {
    const b = await app.body(req);
    const send = ndjson(res);
    const model = pickModel(b.model);
    const q = String(b.q || '').trim();
    if (!q) { send({ type: 'error', error: 'Empty question', code: 'empty' }); return res.end(); }
    const f = askFile(b.id); const k = qkey(model, q);
    const hit = readJson(f, {})[k];
    if (hit && !b.force) { send({ type: 'final', answer: hit, cached: true, spend: spendInfo() }); return res.end(); }
    try {
      const run = asking.get(b.id + '|' + k) || (async () => {
        const fam = familyOf(b);
        const release = reserve(model, String(b.text || '').length + 1500, 600);
        try {
          // The document block is cached so follow-up questions read it at a tenth of the price.
          const r = await generate({
            model, maxTokens: 3000,
            content: [{ type: 'text', text: docBlock(b), cache_control: { type: 'ephemeral' } }, { type: 'text', text: askPrompt(b, fam) }],
            mock: () => mockAnswer(b),
          }, (t) => send({ type: 'delta', text: t }));
          const cost = costOf(r.model, r.usage);
          charge(r.model, cost);
          if (r.stop === 'refusal') throw Object.assign(new Error('The model declined to answer'), { code: 'refusal' });
          const ans = { q, answer: r.text.trim(), model: r.model + (r.mock ? ' (mock)' : ''), cost: +cost.toFixed(4), at: new Date().toISOString() };
          const all = readJson(f, {}); all[k] = ans; writeFileSync(f, JSON.stringify(all));
          asked++;
          return ans;
        } finally { release(); }
      })().finally(() => asking.delete(b.id + '|' + k));
      asking.set(b.id + '|' + k, run);
      send({ type: 'final', answer: await run, spend: spendInfo() });
    } catch (e) { send(fail(e)); }
    res.end();
  });
  app.route('GET', '/asks', (req, res, url) => {
    const all = Object.values(readJson(askFile(url.searchParams.get('id')), {}));
    app.json(res, all.sort((a, b) => (a.at < b.at ? 1 : -1)));
  });

  app.status(() => ({ summaries: made, asks: asked, spend: spendInfo(), mockAI: MOCK, summariesEnabled: MOCK || app.hasKey(), models: Object.keys(PRICES) }));
  if (MOCK) app.onStart(() => console.log(`AI mock mode (STACKS_MOCK_AI): canned summaries, no API calls · budget $${BUDGET}/day`));
}

// ---- mock output: canned but shaped like the real thing, built from the real text ----
function sentences(text) {
  const out = []; let pg = null, last = 0, m;
  const push = (chunk) => {
    for (const s of chunk.split(/(?<=[.!?])["”’)]?\s+(?=["“(]?[A-Z])/)) {
      const t = s.replace(/\s+/g, ' ').trim();
      const w = t.split(' ').length;
      if (w >= 9 && w <= 38 && /^[“"(]?[A-Z]/.test(t) && /[.!?]["”’)]?$/.test(t) && !/https?:|\[|\]|\|/.test(t)) out.push({ t, page: pg });
    }
  };
  MARK.lastIndex = 0;
  while ((m = MARK.exec(text))) { push(text.slice(last, m.index)); pg = m[1] ? Number(m[1]) : pg; last = m.index + m[0].length; }
  push(text.slice(last));
  return out;
}
const words = (s, n) => s.split(' ').slice(0, n).join(' ').replace(/[,;:.]$/, '');
const lc = (s) => (/^(I\b|I'|[A-Z]{2})/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
function mockSummary(b, fam) {
  const ss = sentences(String(b.text || ''));
  const pick = (k) => ss[Math.min(ss.length - 1, Math.floor((k * ss.length) / 6))];
  const chosen = [0.2, 1.1, 2.3, 3.4, 4.6].map(pick).filter(Boolean);
  const key_points = chosen.map((s, j) => ({
    point: `${['Argues', 'Shows', 'Notes', 'Claims', 'Concludes'][j % 5]} that ${lc(words(s.t.replace(/^[“"(]/, ''), 13))}…`,
    page: s.page,
    // The fourth quote is deliberately altered so the UI's "unverified" state can be seen.
    quote: j === 3 ? s.t.replace(/\b(\w{5,})\b/, 'notably') : s.t,
  }));
  const first = ss[0]?.t || b.title;
  const p = (k) => pick(k)?.page ?? null;
  const extra = {
    paper: { claim: first, method: 'The authors train and evaluate models on the tasks described, comparing against baselines (mock text).', evidence: { strength: 'moderate', why: 'Several experiments agree, but on narrow settings without independent replication (mock).' }, limitations: ['Results on a small set of models (mock)', 'No human baseline (mock)'] },
    post: { claim: first, counterpoint: 'A careful critic would say the argument generalizes from a few vivid cases and underrates how often the opposite holds (mock counterpoint).', concepts: [{ term: words(b.title, 3), gloss: 'The post\'s central idea, as it uses the term (mock).' }, { term: 'Steelmanning', gloss: 'Arguing against the strongest version of a view (mock).' }] },
    textbook: { teaches: `Teaches the material of ${b.title} to motivated readers (mock).`, prerequisites: ['Calculus', 'Basic probability'], best_chapters: [{ title: 'Opening chapter', page: p(0.5), why: 'Sets up the core definitions (mock).' }, { title: 'Middle chapter', page: p(3), why: 'The central results, worked through (mock).' }] },
    ttrpg: { mechanic: 'Roll 2d6 and add a stat; 10+ succeeds, 7-9 succeeds at a cost (mock).', ideas: ['Fail forward on every roll (mock)', 'Players make the maps (mock)'], steal: [{ page: p(1), what: 'Random encounter table (mock)' }, { page: p(3), what: 'Downtime procedure (mock)' }] },
    oddity: { what_it_is: `A period technical work: ${b.title} (mock).`, why_now: 'Shows how practitioners reasoned before the modern toolkit, which is useful for comparison (mock).', best_page: { page: p(2), what: 'A fold-out plate with the full diagram (mock).' } },
  }[fam];
  return JSON.stringify({
    verdict: ['skim', 'read', 'study'][String(b.title).length % 3],
    minutes: Math.max(5, Math.round(String(b.text || '').length / 1500)),
    why_care: `Mock summary: ${an(FAMILIES[fam].label)} about ${lc(words(String(b.title), 10))}, relevant if you track this area.`,
    gist: `${first} This is canned mock text built from the item's own sentences (STACKS_MOCK_AI=1); the real model writes a faithful 2-4 sentence gist here.`,
    ...extra,
    key_points,
    this_spread: `Pages ${b.spread || '?'} continue the main argument (mock).`,
  });
}
function mockAnswer(b) {
  const ss = sentences(String(b.text || ''));
  const qw = new Set(String(b.q).toLowerCase().match(/[a-z]{4,}/g) || []);
  const scored = ss.map((s) => [s, (s.t.toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => qw.has(w)).length]).sort((a, z) => z[1] - a[1]);
  const [a, c] = [scored[0]?.[0], scored[1]?.[0]];
  if (!a) return 'The text does not say (mock answer).';
  return `Mock answer: the text comes closest on p. ${a.page ?? '?'}, where it says “${a.t}” (p. ${a.page ?? '?'}).${c ? ` It returns to this later (p. ${c.page ?? '?'}): ${lc(words(c.t, 18))}…` : ''} A real model would answer the question directly from these passages.`;
}
