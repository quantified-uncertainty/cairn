#!/usr/bin/env node

/**
 * Summary Generation Script
 *
 * Uses Anthropic API to generate summaries of articles and sources.
 * Stores results in the knowledge database.
 *
 * Usage:
 *   node scripts/generate-summaries.mjs [options]
 *
 * Options:
 *   --type <type>     Entity type to summarize: 'articles' or 'sources' (default: articles)
 *   --batch <n>       Number of items to process (default: 10)
 *   --model <model>   Model to use: 'haiku', 'sonnet', 'opus' (default: haiku)
 *   --resummary       Re-summarize items that have changed since last summary
 *   --id <id>         Summarize a specific entity by ID
 *   --dry-run         Show what would be summarized without making API calls
 *   --verbose         Show detailed output
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required API key (from .env file)
 */

import { config } from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { articles, sources, summaries } from './lib/knowledge-db.mjs';
import { getColors } from './lib/output.mjs';

// Load environment variables
config();

const args = process.argv.slice(2);

function getArg(name, defaultValue) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return defaultValue;
  return args[index + 1] || defaultValue;
}

const TYPE = getArg('type', 'articles');
const BATCH_SIZE = parseInt(getArg('batch', '10'));
const MODEL_NAME = getArg('model', 'haiku');
const RESUMMARY = args.includes('--resummary');
const SPECIFIC_ID = getArg('id', null);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

const MODEL_MAP = {
  'haiku': 'claude-3-5-haiku-20241022',
  'sonnet': 'claude-sonnet-4-20250514',
  'opus': 'claude-opus-4-20250514'
};

const MODEL_ID = MODEL_MAP[MODEL_NAME] || MODEL_MAP['haiku'];

const colors = getColors();

// =============================================================================
// ANTHROPIC CLIENT
// =============================================================================

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey && !DRY_RUN) {
  console.error(`${colors.red}Error: ANTHROPIC_API_KEY not found in environment${colors.reset}`);
  console.error('Make sure you have a .env file with ANTHROPIC_API_KEY=sk-...');
  process.exit(1);
}

const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

// =============================================================================
// PROMPTS
// =============================================================================

const ARTICLE_SUMMARY_PROMPT = `You are summarizing an article from an AI safety knowledge base.

Analyze the following article and provide:

1. ONE_LINER: A single sentence (max 25 words) capturing the main point
2. SUMMARY: A 2-3 paragraph summary (150-250 words) covering:
   - What the article is about
   - Key arguments or findings
   - Why it matters for AI safety
3. KEY_POINTS: 3-5 bullet points of the most important takeaways
4. KEY_CLAIMS: Extract any specific claims with numbers, probabilities, or timelines. Format as JSON array of objects with "claim" and "value" fields.

Respond in this exact JSON format:
{
  "oneLiner": "...",
  "summary": "...",
  "keyPoints": ["...", "..."],
  "keyClaims": [{"claim": "...", "value": "..."}, ...]
}

ARTICLE TITLE: {{TITLE}}

ARTICLE CONTENT:
{{CONTENT}}`;

const SOURCE_SUMMARY_PROMPT = `You are summarizing a source document referenced in an AI safety knowledge base.

Analyze the following source and provide:

1. ONE_LINER: A single sentence (max 25 words) capturing the main contribution
2. SUMMARY: A 1-2 paragraph summary (100-150 words) covering:
   - What the source is about
   - Key findings or arguments
   - Relevance to AI safety
3. KEY_POINTS: 2-4 bullet points of the most important takeaways
4. KEY_CLAIMS: Extract any specific claims with numbers, probabilities, or timelines. Format as JSON array.

Respond in this exact JSON format:
{
  "oneLiner": "...",
  "summary": "...",
  "keyPoints": ["...", "..."],
  "keyClaims": [{"claim": "...", "value": "..."}, ...]
}

SOURCE TITLE: {{TITLE}}
SOURCE TYPE: {{TYPE}}
AUTHORS: {{AUTHORS}}
YEAR: {{YEAR}}

CONTENT:
{{CONTENT}}`;

// =============================================================================
// SUMMARY GENERATION
// =============================================================================

/**
 * Call Anthropic API to generate summary
 */
async function generateSummary(prompt) {
  if (!anthropic) {
    throw new Error('Anthropic client not initialized');
  }

  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const text = response.content[0].text;
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return { ...parsed, tokensUsed };
  } catch (err) {
    console.error(`${colors.yellow}Warning: Could not parse response as JSON${colors.reset}`);
    if (VERBOSE) {
      console.error('Response:', text);
    }
    // Return a basic structure
    return {
      oneLiner: text.slice(0, 200),
      summary: text,
      keyPoints: [],
      keyClaims: [],
      tokensUsed
    };
  }
}

/**
 * Summarize an article
 */
async function summarizeArticle(article) {
  // Truncate content if too long (roughly 100K chars = ~25K tokens)
  const maxContentLength = 100000;
  const content = article.content.length > maxContentLength
    ? article.content.slice(0, maxContentLength) + '\n\n[Content truncated...]'
    : article.content;

  const prompt = ARTICLE_SUMMARY_PROMPT
    .replace('{{TITLE}}', article.title || article.id)
    .replace('{{CONTENT}}', content);

  const result = await generateSummary(prompt);

  summaries.upsert(article.id, 'article', {
    ...result,
    model: MODEL_ID
  });

  return result;
}

/**
 * Summarize a source
 */
async function summarizeSource(source) {
  if (!source.content) {
    throw new Error('Source has no content');
  }

  // Truncate content if too long
  const maxContentLength = 50000;
  const content = source.content.length > maxContentLength
    ? source.content.slice(0, maxContentLength) + '\n\n[Content truncated...]'
    : source.content;

  const prompt = SOURCE_SUMMARY_PROMPT
    .replace('{{TITLE}}', source.title || 'Unknown')
    .replace('{{TYPE}}', source.source_type || 'unknown')
    .replace('{{AUTHORS}}', Array.isArray(source.authors) ? source.authors.join(', ') : (source.authors || 'Unknown'))
    .replace('{{YEAR}}', source.year || 'Unknown')
    .replace('{{CONTENT}}', content);

  const result = await generateSummary(prompt);

  summaries.upsert(source.id, 'source', {
    ...result,
    model: MODEL_ID
  });

  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log(`${colors.blue}📝 Summary Generator${colors.reset}`);
  console.log(`   Model: ${MODEL_NAME} (${MODEL_ID})`);
  console.log(`   Type: ${TYPE}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);
  if (DRY_RUN) console.log(`   ${colors.yellow}DRY RUN - no API calls${colors.reset}`);
  console.log();

  let items = [];

  if (SPECIFIC_ID) {
    // Get specific item
    if (TYPE === 'articles') {
      const article = articles.get(SPECIFIC_ID);
      if (!article) {
        console.error(`${colors.red}Article not found: ${SPECIFIC_ID}${colors.reset}`);
        process.exit(1);
      }
      items = [article];
    } else {
      const source = sources.get(SPECIFIC_ID);
      if (!source) {
        console.error(`${colors.red}Source not found: ${SPECIFIC_ID}${colors.reset}`);
        process.exit(1);
      }
      items = [source];
    }
  } else if (TYPE === 'articles') {
    // Get articles needing summaries
    items = RESUMMARY
      ? articles.needingResummary().slice(0, BATCH_SIZE)
      : articles.needingSummary().slice(0, BATCH_SIZE);
  } else if (TYPE === 'sources') {
    // Get sources needing summaries
    items = sources.needingSummary().slice(0, BATCH_SIZE);
  } else {
    console.error(`${colors.red}Unknown type: ${TYPE}. Use 'articles' or 'sources'${colors.reset}`);
    process.exit(1);
  }

  if (items.length === 0) {
    console.log(`${colors.green}✅ No ${TYPE} need summarization${colors.reset}`);
    process.exit(0);
  }

  console.log(`Found ${items.length} ${TYPE} to summarize\n`);

  if (DRY_RUN) {
    console.log('Would summarize:');
    for (const item of items) {
      console.log(`  - ${item.title || item.id}`);
    }
    process.exit(0);
  }

  // Process items
  let success = 0;
  let failed = 0;
  let totalTokens = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const progress = `[${i + 1}/${items.length}]`;

    try {
      console.log(`${colors.cyan}${progress}${colors.reset} Summarizing: ${item.title || item.id}`);

      const result = TYPE === 'articles'
        ? await summarizeArticle(item)
        : await summarizeSource(item);

      totalTokens += result.tokensUsed || 0;
      success++;

      if (VERBOSE) {
        console.log(`   ${colors.dim}One-liner: ${result.oneLiner}${colors.reset}`);
        console.log(`   ${colors.dim}Tokens: ${result.tokensUsed}${colors.reset}`);
      }

      console.log(`   ${colors.green}✓ Done${colors.reset}`);

      // Rate limiting - be nice to the API
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      failed++;
      console.log(`   ${colors.red}✗ Error: ${err.message}${colors.reset}`);
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${colors.green}✅ Summary generation complete${colors.reset}\n`);
  console.log(`  Successful: ${success}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total tokens used: ${totalTokens.toLocaleString()}`);

  // Estimate cost
  const inputCost = MODEL_NAME === 'haiku' ? 0.00025 : MODEL_NAME === 'sonnet' ? 0.003 : 0.015;
  const estimatedCost = (totalTokens / 1000000) * (inputCost + inputCost * 4); // Rough estimate
  console.log(`  Estimated cost: $${estimatedCost.toFixed(4)}`);

  // Show remaining
  const remainingArticles = articles.needingSummary().length;
  const remainingSources = sources.needingSummary().length;
  console.log(`\n${colors.blue}Remaining:${colors.reset}`);
  console.log(`  Articles without summaries: ${remainingArticles}`);
  console.log(`  Sources without summaries: ${remainingSources}`);
}

main().catch(err => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`);
  process.exit(1);
});
