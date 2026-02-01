#!/usr/bin/env node

/**
 * Grade Content Script
 *
 * Uses Claude Sonnet API to automatically grade pages with:
 * - importance (0-100): How significant for understanding AI risk
 * - quality (0-100): How well-developed the content is (strict structural requirements)
 * - llmSummary: 1-2 sentence summary with key conclusions
 * - ratings (for models): novelty, rigor, actionability, completeness
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/content/grade-content.mjs [options]
 *
 * Options:
 *   --page ID       Grade a single page by ID or partial match
 *   --dry-run       Show what would be processed without calling API
 *   --limit N       Only process N pages (for testing)
 *   --parallel N    Process N pages concurrently (default: 1)
 *   --category X    Only process pages in category (models, risks, responses, etc.)
 *   --skip-graded   Skip pages that already have importance set
 *   --output FILE   Write results to JSON file (default: grades-output.json)
 *   --apply         Apply grades directly to frontmatter (use with caution)
 *
 * Cost estimate: ~$0.05 per page, ~$15 for all 300 pages (full content)
 */

import { createClient, parseJsonResponse } from '../lib/anthropic.mjs';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { CONTENT_DIR } from '../lib/content-types.mjs';

const OUTPUT_FILE = '.claude/temp/grades-output.json';

// Parse command line args
const args = process.argv.slice(2);
const options = {
  page: args.includes('--page') ? args[args.indexOf('--page') + 1] : null,
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
  category: args.includes('--category') ? args[args.indexOf('--category') + 1] : null,
  skipGraded: args.includes('--skip-graded'),
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : OUTPUT_FILE,
  apply: args.includes('--apply'),
  parallel: args.includes('--parallel') ? parseInt(args[args.indexOf('--parallel') + 1]) : 1,
};

const SYSTEM_PROMPT = `You are an expert evaluator of AI safety content for a resource aimed at **expert AI prioritization work** - helping researchers and funders identify and prioritize concrete interventions to reduce AI existential risk.

Score each page on importance (0-100, one decimal place). Be discriminating - use the full range.

Also score each page on four quality dimensions (0-10 scale, one decimal). BE EXTREMELY HARSH - a 7 is exceptional, 8+ is world-class. Most wiki content should score 3-5.

**NOVELTY (0-10)**: How original is the content?
- 9-10: Groundbreaking original research, creates new field or framework (academic publication level)
- 7-8: Significant original synthesis not found elsewhere, novel insights (exceptional)
- 5-6: Some original framing or connections, adds modest value beyond sources
- 3-4: Accurate summary of existing work with minimal original perspective
- 1-2: Mostly restates common knowledge, purely derivative
- 0: No content or completely plagiarized

**RIGOR (0-10)**: How well-evidenced and precise?
- 9-10: Every claim sourced to authoritative primary sources, all quantified with uncertainty ranges (journal-quality)
- 7-8: Nearly all claims well-sourced and quantified, minimal gaps (exceptional)
- 5-6: Most major claims sourced, some quantification, minor gaps
- 3-4: Mix of sourced and unsourced, vague claims common
- 1-2: Few sources, mostly assertions
- 0: No evidence

**ACTIONABILITY (0-10)**: How useful for decisions?
- 9-10: Provides specific decision procedures with quantified tradeoffs (consultant-ready)
- 7-8: Clear concrete recommendations with supporting analysis (exceptional)
- 5-6: Some actionable takeaways, general guidance
- 3-4: Mostly abstract, implications unclear
- 1-2: Purely descriptive, no practical application
- 0: No actionable content

**COMPLETENESS (0-10)**: How comprehensive?
- 9-10: Exhaustive authoritative reference, nothing significant missing (textbook-level)
- 7-8: Covers all major aspects thoroughly with depth (exceptional)
- 5-6: Covers main points, some gaps in depth or breadth
- 3-4: Notable gaps, missing important aspects
- 1-2: Very incomplete, barely started
- 0: Stub/placeholder

CALIBRATION: For typical wiki content, expect scores of 3-5. A score of 6+ means genuinely strong. A 7+ is rare and exceptional. 8+ should almost never be given.

**Scoring guidelines:**

90-100: Essential for prioritization decisions. Core intervention strategies, key risk mechanisms, or foundational capabilities that directly inform resource allocation. (Expect ~5-10 pages)

70-89: High value for practitioners. Concrete responses, major risk categories, critical capabilities. Directly actionable or necessary context for action. (Expect ~30-50 pages)

50-69: Useful context. Supporting analysis, secondary risks, background on actors/institutions. Helps round out understanding. (Expect ~80-100 pages)

30-49: Reference material. Historical context, individual profiles, niche topics. Useful for specialists, not core prioritization. (Expect ~60-80 pages)

0-29: Peripheral. Internal docs, tangential topics, stubs. (Expect ~30-50 pages)

**Category adjustments (apply to your base assessment):**
- Responses/interventions (technical safety, governance, policy): +10 (actionable)
- Capabilities (what AI can do): +5 (foundational for risk assessment)
- Core risks (accident, misuse): +5 (direct relevance)
- Risk factors: 0 (contributing factors)
- Models/analysis: -5 (meta-level, not direct prioritization)
- Arguments/debates: -10 (discourse, not action)
- People/organizations: -15 (reference material)
- Internal/infrastructure: -30

Also provide:
- **llmSummary**: 1-2 sentences with methodology AND conclusions (include numbers if available)

Respond with valid JSON only, no markdown.`;

const USER_PROMPT_TEMPLATE = `Grade this content page:

**File path**: {{filePath}}
**Category**: {{category}}
**Title**: {{title}}
**Description**: {{description}}

---
FULL CONTENT:
{{content}}
---

Respond with JSON (keep reasoning SHORT - max 2-3 sentences total):
{
  "importance": <0-100, one decimal>,
  "ratings": {
    "novelty": <0-10, one decimal>,
    "rigor": <0-10, one decimal>,
    "actionability": <0-10, one decimal>,
    "completeness": <0-10, one decimal>
  },
  "llmSummary": "<1-2 sentences with conclusions>",
  "reasoning": "<2-3 sentences max explaining the scores>"
}`;

/**
 * Detect page type based on filename and frontmatter
 * - 'overview': index.mdx files (navigation pages)
 * - 'stub': explicitly marked in frontmatter (intentionally minimal)
 * - 'content': default (full quality criteria apply)
 */
function detectPageType(id, frontmatter) {
  // Auto-detect overview pages from filename
  if (id === 'index') return 'overview';

  // Explicit stub marking in frontmatter
  if (frontmatter.pageType === 'stub') return 'stub';

  // Default to content
  return 'content';
}

/**
 * Scan content directory and collect all pages
 */
function collectPages() {
  const pages = [];

  function scanDir(dir, urlPrefix = '') {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, `${urlPrefix}/${entry}`);
      } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
        const content = readFileSync(fullPath, 'utf-8');
        const fm = extractFrontmatter(content);
        const id = basename(entry, entry.endsWith('.mdx') ? '.mdx' : '.md');

        // Determine category from path
        const pathParts = urlPrefix.split('/').filter(Boolean);
        const category = pathParts[0] || 'other';
        const subcategory = pathParts[1] || null;

        // Check if it's a model page
        const isModel = urlPrefix.includes('/models') || fm.ratings !== undefined;

        // Detect page type
        const pageType = detectPageType(id, fm);

        pages.push({
          id,
          filePath: fullPath,
          relativePath: relative(CONTENT_DIR, fullPath),
          urlPath: id === 'index' ? `${urlPrefix}/` : `${urlPrefix}/${id}/`,
          title: fm.title || id.replace(/-/g, ' '),
          category,
          subcategory,
          isModel,
          pageType,
          currentImportance: fm.importance ?? null,
          currentQuality: fm.quality ?? null,
          currentRatings: fm.ratings ?? null,
          content,
          frontmatter: fm,
        });
      }
    }
  }

  scanDir(CONTENT_DIR);
  return pages;
}

/**
 * Extract frontmatter from content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) || {};
  } catch (e) {
    return {};
  }
}

/**
 * Get content without frontmatter, optionally truncated
 */
function getContent(text, maxWords = 10000) {
  // Remove frontmatter
  const withoutFm = text.replace(/^---[\s\S]*?---\n*/, '');
  const words = withoutFm.split(/\s+/);
  if (words.length <= maxWords) return withoutFm;
  return words.slice(0, maxWords).join(' ') + '\n\n[... truncated at ' + maxWords + ' words]';
}

/**
 * Compute automated metrics from content
 */
function computeMetrics(content) {
  const withoutFm = content.replace(/^---[\s\S]*?---\n*/, '');

  // Remove table content for prose word count
  const withoutTables = withoutFm.replace(/\|[^\n]+\|/g, '');
  const withoutCodeBlocks = withoutTables.replace(/```[\s\S]*?```/g, '');
  const withoutImports = withoutCodeBlocks.replace(/^import\s+.*$/gm, '');
  const withoutComponents = withoutImports.replace(/<[^>]+\/>/g, '').replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, '');
  const proseWords = withoutComponents.split(/\s+/).filter(w => w.length > 0).length;

  // Count citations: <R id="..."> and markdown links [text](url)
  const rComponents = (withoutFm.match(/<R\s+id=/g) || []).length;
  const mdLinks = (withoutFm.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) || []).length;
  const citations = rComponents + mdLinks;

  // Count tables (markdown tables with |---|)
  const tables = (withoutFm.match(/\|[-:]+\|/g) || []).length;

  // Count diagrams (Mermaid components and images)
  const mermaid = (withoutFm.match(/<Mermaid/g) || []).length;
  const images = (withoutFm.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const diagrams = mermaid + images;

  return { wordCount: proseWords, citations, tables, diagrams };
}

/**
 * Compute derived quality score from ratings, metrics, and frontmatter
 *
 * Formula: avgSubscore × 8 + min(10, words/500) + min(10, citations × 0.5)
 * - Subscores drive 0-80 (primary factor)
 * - Length bonus: 0-10 (5000 words = max)
 * - Evidence bonus: 0-10 (20 citations = max)
 * - Caps: stub pages at 35, very short pages at 40
 * - Total range: 0-100
 */
function computeQuality(ratings, metrics, frontmatter = {}) {
  // Subscores contribute 0-80 points (primary driver)
  const avgSubscore = (ratings.novelty + ratings.rigor + ratings.actionability + ratings.completeness) / 4;
  const baseScore = avgSubscore * 8;  // Maps 0-10 → 0-80

  // Length contributes 0-10 points (5000 words = max)
  const lengthScore = Math.min(10, metrics.wordCount / 500);

  // Evidence contributes 0-10 points (20 citations = max)
  const evidenceScore = Math.min(10, metrics.citations * 0.5);

  // Compute base quality
  let quality = baseScore + lengthScore + evidenceScore;

  // Stub pages should never exceed 35 (explicitly marked as minimal)
  if (frontmatter.pageType === 'stub') {
    quality = Math.min(quality, 35);
  }

  // Very short pages (<100 words) capped at 40
  if (metrics.wordCount < 100) {
    quality = Math.min(quality, 40);
  }

  return Math.round(Math.max(0, quality));
}

/**
 * Call Claude API to grade a page
 */
async function gradePage(client, page) {
  const fullContent = getContent(page.content);

  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{{filePath}}', page.relativePath)
    .replace('{{category}}', page.category)
    .replace('{{title}}', page.title)
    .replace('{{description}}', page.frontmatter.description || '(none)')
    .replace('{{content}}', fullContent);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: SYSTEM_PROMPT,
  });

  const text = response.content[0].text;

  // Parse JSON response
  try {
    // Handle potential markdown code blocks
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      // Remove opening ```json or ``` and closing ```
      jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(jsonText);
  } catch (e) {
    console.error(`Failed to parse response for ${page.id}:`, text);
    return null;
  }
}

/**
 * Apply grades to frontmatter
 */
function applyGradesToFile(page, grades, metrics, derivedQuality) {
  const content = readFileSync(page.filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!fmMatch) {
    console.warn(`No frontmatter found in ${page.filePath}`);
    return false;
  }

  const fm = parseYaml(fmMatch[1]) || {};

  // Update fields
  fm.importance = grades.importance;
  fm.quality = derivedQuality;
  if (grades.llmSummary) {
    fm.llmSummary = grades.llmSummary;
  }
  // Always apply ratings now (not just for model pages)
  if (grades.ratings) {
    fm.ratings = grades.ratings;
  }
  // Save metrics
  fm.metrics = metrics;

  // Ensure lastEdited is a string (not Date object)
  if (fm.lastEdited instanceof Date) {
    fm.lastEdited = fm.lastEdited.toISOString().split('T')[0];
  }

  // Reconstruct file with proper quoting for date strings
  let newFm = stringifyYaml(fm, {
    defaultStringType: 'QUOTE_DOUBLE',
    defaultKeyType: 'PLAIN',
    lineWidth: 0  // Don't wrap lines
  });

  // Ensure frontmatter ends with newline
  if (!newFm.endsWith('\n')) {
    newFm += '\n';
  }

  const bodyStart = content.indexOf('---', 4) + 3; // Skip past '---' only, not the newline
  let body = content.slice(bodyStart);
  // Ensure body starts with exactly one newline
  body = '\n' + body.replace(/^\n+/, '');
  const newContent = `---\n${newFm}---${body}`;

  // Validation: ensure file structure is correct
  const fmTest = newContent.match(/^---\n[\s\S]*?\n---\n/);
  if (!fmTest) {
    console.error(`ERROR: Invalid frontmatter structure in ${page.filePath}`);
    console.error('Frontmatter must end with ---\\n');
    return false;
  }

  // Validation: ensure no corrupted imports (e.g., "mport" instead of "import")
  const afterFm = newContent.slice(fmTest[0].length);
  if (/^[a-z]/.test(afterFm.trim()) && !/^(import|export|const|let|var|function|class|\/\/)/.test(afterFm.trim())) {
    console.error(`ERROR: Suspicious content after frontmatter in ${page.filePath}`);
    console.error(`First chars: "${afterFm.slice(0, 50)}..."`);
    return false;
  }

  writeFileSync(page.filePath, newContent);
  return true;
}

/**
 * Main execution
 */
async function main() {
  console.log('Content Grading Script');
  console.log('======================\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY && !options.dryRun) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    console.error('Usage: ANTHROPIC_API_KEY=sk-... node scripts/grade-content.mjs');
    process.exit(1);
  }

  // Collect pages
  let pages = collectPages();
  console.log(`Found ${pages.length} total pages\n`);

  // Apply filters
  if (options.page) {
    const query = options.page.toLowerCase();
    pages = pages.filter(p =>
      p.id.toLowerCase().includes(query) ||
      p.title.toLowerCase().includes(query) ||
      p.relativePath.toLowerCase().includes(query)
    );
    if (pages.length === 0) {
      console.error(`No pages found matching: ${options.page}`);
      process.exit(1);
    }
    if (pages.length > 1) {
      console.log(`Found ${pages.length} matching pages:`);
      pages.forEach(p => console.log(`  - ${p.id}: ${p.title}`));
      console.log(`\nUse a more specific query or the full ID.`);
      process.exit(1);
    }
    console.log(`Grading single page: ${pages[0].title}`);
  }

  if (options.category) {
    pages = pages.filter(p => p.category === options.category || p.subcategory === options.category);
    console.log(`Filtered to ${pages.length} pages in category: ${options.category}`);
  }

  if (options.skipGraded) {
    pages = pages.filter(p => p.currentImportance === null);
    console.log(`Filtered to ${pages.length} pages without importance`);
  }

  // Skip overview pages (index.mdx), stub pages, and internal files (starting with _)
  const skippedOverview = pages.filter(p => p.pageType === 'overview').length;
  const skippedStub = pages.filter(p => p.pageType === 'stub').length;
  pages = pages.filter(p => p.pageType === 'content' && !p.id.startsWith('_'));
  console.log(`Filtered to ${pages.length} content pages (skipped ${skippedOverview} overview, ${skippedStub} stub)`);

  if (options.limit) {
    pages = pages.slice(0, options.limit);
    console.log(`Limited to ${pages.length} pages`);
  }

  // Cost estimate (with full content)
  const avgTokens = 4000; // input per page (~2500 words avg + metadata)
  const outputTokens = 200; // output per page
  const inputCost = (pages.length * avgTokens / 1_000_000) * 3; // Sonnet input
  const outputCost = (pages.length * outputTokens / 1_000_000) * 15; // Sonnet output
  const totalCost = inputCost + outputCost;

  console.log(`\nCost Estimate:`);
  console.log(`  Input:  ${(pages.length * avgTokens / 1000).toFixed(0)}K tokens → $${inputCost.toFixed(2)}`);
  console.log(`  Output: ${(pages.length * outputTokens / 1000).toFixed(0)}K tokens → $${outputCost.toFixed(2)}`);
  console.log(`  Total:  $${totalCost.toFixed(2)}\n`);

  if (options.dryRun) {
    console.log('Dry run - pages that would be processed:');
    for (const page of pages.slice(0, 20)) {
      console.log(`  - ${page.relativePath} (${page.category}${page.isModel ? ', model' : ''})`);
    }
    if (pages.length > 20) {
      console.log(`  ... and ${pages.length - 20} more`);
    }
    return;
  }

  // Initialize API client (handles API key validation)
  const client = createClient();

  // Process pages
  const results = [];
  let processed = 0;
  let errors = 0;

  const concurrency = options.parallel;
  console.log(`Processing ${pages.length} pages with concurrency ${concurrency}...\n`);

  // Process in batches for parallel execution
  async function processPage(page, index) {
    try {
      const grades = await gradePage(client, page);

      if (grades && grades.ratings) {
        // Compute automated metrics
        const metrics = computeMetrics(page.content);

        // Compute derived quality score
        const derivedQuality = computeQuality(grades.ratings, metrics, page.frontmatter);

        const result = {
          id: page.id,
          filePath: page.relativePath,
          category: page.category,
          isModel: page.isModel,
          title: page.title,
          importance: grades.importance,
          ratings: grades.ratings,
          metrics,
          quality: derivedQuality,
          llmSummary: grades.llmSummary,
        };

        let applied = false;
        if (options.apply) {
          applied = applyGradesToFile(page, grades, metrics, derivedQuality);
          if (!applied) {
            console.error(`  Failed to apply grades to ${page.filePath}`);
          }
        }

        const r = grades.ratings;
        console.log(`[${index + 1}/${pages.length}] ${page.id}: imp=${grades.importance.toFixed(1)}, n=${r.novelty} r=${r.rigor} a=${r.actionability} c=${r.completeness} → qual=${derivedQuality} (${metrics.wordCount}w, ${metrics.citations}cit)${options.apply ? (applied ? ' ✓' : ' ✗') : ''}`);
        return { success: true, result };
      } else {
        console.log(`[${index + 1}/${pages.length}] ${page.id}: FAILED (no ratings in response)`);
        return { success: false };
      }
    } catch (e) {
      console.log(`[${index + 1}/${pages.length}] ${page.id}: ERROR - ${e.message}`);
      return { success: false, error: e.message };
    }
  }

  // Process in parallel batches
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchPromises = batch.map((page, batchIndex) =>
      processPage(page, i + batchIndex)
    );

    const batchResults = await Promise.all(batchPromises);

    for (const br of batchResults) {
      if (br.success) {
        results.push(br.result);
        processed++;
      } else {
        errors++;
      }
    }

    // Rate limiting - be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  // Write results
  writeFileSync(options.output, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${options.output}`);
  console.log(`Processed: ${processed}, Errors: ${errors}`);

  // Summary statistics
  const importanceScores = results.map(r => r.importance).filter(x => x != null).sort((a, b) => b - a);
  const qualityScores = results.map(r => r.quality).filter(x => x != null).sort((a, b) => b - a);

  // Importance distribution by range
  const impRanges = {
    '90-100': importanceScores.filter(x => x >= 90).length,
    '70-89': importanceScores.filter(x => x >= 70 && x < 90).length,
    '50-69': importanceScores.filter(x => x >= 50 && x < 70).length,
    '30-49': importanceScores.filter(x => x >= 30 && x < 50).length,
    '0-29': importanceScores.filter(x => x < 30).length,
  };

  console.log('\nImportance Distribution (0-100):');
  for (const [range, count] of Object.entries(impRanges)) {
    const bar = '█'.repeat(Math.ceil(count / 3));
    console.log(`  ${range}: ${bar} (${count})`);
  }

  const impAvg = importanceScores.reduce((a, b) => a + b, 0) / importanceScores.length;
  const impMedian = importanceScores[Math.floor(importanceScores.length / 2)];
  console.log(`\n  Avg: ${impAvg.toFixed(1)}, Median: ${impMedian.toFixed(1)}`);
  console.log(`  Top 5: ${importanceScores.slice(0, 5).map(x => x.toFixed(1)).join(', ')}`);
  console.log(`  Bottom 5: ${importanceScores.slice(-5).map(x => x.toFixed(1)).join(', ')}`);

  // Quality distribution by range (0-100 scale)
  const qualRanges = {
    '80-100 (Comprehensive)': qualityScores.filter(x => x >= 80).length,
    '60-79 (Good)': qualityScores.filter(x => x >= 60 && x < 80).length,
    '40-59 (Adequate)': qualityScores.filter(x => x >= 40 && x < 60).length,
    '20-39 (Draft)': qualityScores.filter(x => x >= 20 && x < 40).length,
    '0-19 (Stub)': qualityScores.filter(x => x < 20).length,
  };

  console.log('\nQuality Distribution (0-100):');
  for (const [range, count] of Object.entries(qualRanges)) {
    const bar = '█'.repeat(Math.ceil(count / 3));
    console.log(`  ${range}: ${bar} (${count})`);
  }

  const qualAvg = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  const qualMedian = qualityScores[Math.floor(qualityScores.length / 2)];
  console.log(`\n  Avg: ${qualAvg.toFixed(1)}, Median: ${qualMedian.toFixed(1)}`)
}

main().catch(console.error);
