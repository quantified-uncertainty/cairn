// AI summaries: POST /summarize with text extracted by the UI; GET /summary
// returns a cached summary only (never calls the model).
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

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

export default function (app) {
  const { MODEL, CACHE, cache } = app;
  const file = (id) => join(CACHE, 'summaries', cache.key(id + '|' + MODEL) + '.json');
  const pending = new Map();
  let made = 0;

  async function summarize({ id, title, authors, year, lane, text, spread }) {
    const f = file(id);
    if (existsSync(f)) return JSON.parse(readFileSync(f, 'utf-8'));
    if (pending.has(f)) return pending.get(f);
    const job = (async () => {
      const c = await client(app);
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
      writeFileSync(f, JSON.stringify(out));
      made++;
      return out;
    })().finally(() => pending.delete(f));
    pending.set(f, job);
    return job;
  }

  app.route('POST', '/summarize', async (req, res) => {
    try { app.json(res, await summarize(await app.body(req))); } catch (e) { app.json(res, { error: e.message, code: e.code || 'error' }); }
  });
  app.route('GET', '/summary', (req, res, url) => {
    const f = file(url.searchParams.get('id'));
    return existsSync(f) ? app.send(res, 200, readFileSync(f), 'application/json') : app.json(res, null);
  });
  app.status(() => ({ summaries: made }));
}
