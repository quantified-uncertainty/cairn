/**
 * OpenRouter API Integration
 *
 * Provides access to various models including Perplexity Sonar for research.
 *
 * Pricing (as of Jan 2025):
 * - perplexity/sonar: $1/M input, $1/M output (includes web search)
 * - perplexity/sonar-pro: $3/M input, $15/M output (better reasoning)
 * - google/gemini-flash-1.5: $0.075/M input, $0.30/M output
 * - deepseek/deepseek-chat: $0.14/M input, $0.28/M output
 */

import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Available models for different use cases
 */
export const MODELS = {
  // Research (with web search built-in)
  PERPLEXITY_SONAR: 'perplexity/sonar',
  PERPLEXITY_SONAR_PRO: 'perplexity/sonar-pro',

  // Cheap general purpose
  GEMINI_FLASH: 'google/gemini-flash-1.5',
  DEEPSEEK_CHAT: 'deepseek/deepseek-chat',

  // Quality general purpose
  GEMINI_PRO: 'google/gemini-pro-1.5',
  GPT4O_MINI: 'openai/gpt-4o-mini',
};

/**
 * Call OpenRouter API
 */
export async function callOpenRouter(prompt, options = {}) {
  const {
    model = MODELS.PERPLEXITY_SONAR,
    maxTokens = 2000,
    temperature = 0.7,
    systemPrompt = null,
  } = options;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not set in environment');
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://longtermwiki.vercel.app',
      'X-Title': 'LongtermWiki Page Creator'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  // Perplexity includes citations in the response - extract them
  const citations = data.citations || data.choices[0]?.message?.citations || [];

  return {
    content: data.choices[0].message.content,
    citations,  // Array of source URLs that [1], [2], etc. refer to
    model: data.model,
    usage: data.usage,
    cost: data.usage?.cost || 0,
  };
}

/**
 * Perplexity research query - returns structured research with citations
 */
export async function perplexityResearch(query, options = {}) {
  const {
    maxTokens = 2000,
    detailed = false,
  } = options;

  const model = detailed ? MODELS.PERPLEXITY_SONAR_PRO : MODELS.PERPLEXITY_SONAR;

  const systemPrompt = `You are a research assistant gathering information for a wiki article.
For each piece of information, note the source if available.
Focus on:
- Factual claims with dates and numbers
- Key people and their roles
- Funding amounts and sources
- Criticisms and controversies
- Recent developments

Format your response with clear sections and bullet points.`;

  return callOpenRouter(query, {
    model,
    maxTokens,
    systemPrompt,
  });
}

/**
 * Batch research - run multiple queries in parallel
 */
export async function batchResearch(queries, options = {}) {
  const {
    concurrency = 3,
    delayMs = 500,
  } = options;

  const results = [];

  // Process in batches to avoid rate limits
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(q => perplexityResearch(q.query, { detailed: q.detailed }))
    );

    results.push(...batchResults.map((r, idx) => ({
      query: batch[idx].query,
      category: batch[idx].category,
      ...r
    })));

    // Small delay between batches
    if (i + concurrency < queries.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Generate research queries for a topic
 */
export function generateResearchQueries(topic) {
  return [
    // Core information
    { query: `What is ${topic}? Overview, mission, and key facts`, category: 'overview' },
    { query: `${topic} history founding story timeline key events`, category: 'history' },
    { query: `${topic} team leadership founders key people backgrounds`, category: 'people' },

    // Funding and resources
    { query: `${topic} funding grants investors revenue financial information`, category: 'funding' },
    { query: `${topic} Open Philanthropy grants funding`, category: 'funding-op' },

    // Work and impact
    { query: `${topic} projects research publications major work output`, category: 'work' },
    { query: `${topic} impact effectiveness results achievements`, category: 'impact' },

    // External perspectives - skeptical/adversarial
    { query: `${topic} criticism concerns controversies problems limitations`, category: 'criticism' },
    { query: `${topic} skepticism overhyped exaggerated misleading`, category: 'skepticism' },
    { query: `${topic} conflicts of interest incentives bias motivations`, category: 'incentives' },
    { query: `${topic} news articles recent developments 2024 2025`, category: 'news' },

    // Relationships
    { query: `${topic} partnerships collaborations relationships other organizations`, category: 'relationships' },

    // AI Safety specific (if relevant)
    { query: `${topic} AI safety alignment existential risk connection`, category: 'ai-safety' },

    // Community perspective
    { query: `${topic} EA Forum LessWrong discussion community opinion`, category: 'community' },
  ];
}

/**
 * Quick single research call (for testing)
 */
export async function quickResearch(topic) {
  const query = `Give me a comprehensive overview of "${topic}" including:
- What it is and its mission
- Key people and leadership
- Funding sources and amounts
- Major projects or research
- Criticisms or controversies
- Recent news and developments

Include specific facts, dates, and numbers where available.`;

  return perplexityResearch(query, { detailed: true });
}
