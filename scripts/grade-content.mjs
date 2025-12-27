#!/usr/bin/env node
/**
 * Grade Content Script
 *
 * Uses Claude Sonnet API to automatically grade pages with:
 * - importance (1-5): How significant for understanding AI risk
 * - quality (1-5): How well-developed the content is
 * - llmSummary: 1-2 sentence summary with key conclusions
 * - ratings (for models): novelty, rigor, actionability, completeness
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/grade-content.mjs [options]
 *
 * Options:
 *   --dry-run       Show what would be processed without calling API
 *   --limit N       Only process N pages (for testing)
 *   --category X    Only process pages in category (models, risks, responses, etc.)
 *   --skip-graded   Skip pages that already have importance set
 *   --output FILE   Write results to JSON file (default: grades-output.json)
 *   --apply         Apply grades directly to frontmatter (use with caution)
 *
 * Cost estimate: ~$6 for all 329 pages
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const CONTENT_DIR = 'src/content/docs';
const OUTPUT_FILE = 'grades-output.json';

// Parse command line args
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
  category: args.includes('--category') ? args[args.indexOf('--category') + 1] : null,
  skipGraded: args.includes('--skip-graded'),
  output: args.includes('--output') ? args[args.indexOf('--output') + 1] : OUTPUT_FILE,
  apply: args.includes('--apply'),
};

const SYSTEM_PROMPT = `You are an expert evaluator of AI safety content. Your task is to grade educational/analytical content about AI risks and safety.

For each page, provide:

1. **importance** (1-5): How significant is this topic for understanding AI existential risk?
   - 5: Core concept essential for anyone in the field
   - 4: Important topic that significantly affects risk assessment
   - 3: Useful context or moderate relevance
   - 2: Peripheral topic with limited direct relevance
   - 1: Tangential or very niche

2. **quality** (1-5): How well-developed and useful is this content?
   - 5: Comprehensive, well-sourced, publication-ready
   - 4: Solid content with good depth
   - 3: Adequate overview, could use more depth
   - 2: Stub or underdeveloped
   - 1: Placeholder or minimal content

3. **llmSummary**: A 1-2 sentence summary that includes:
   - What the page covers (methodology/approach)
   - Key conclusions or findings (with numbers if available)
   - Example: "This model estimates AI's contribution to bioweapons risk. It finds current LLMs provide 1.3-2.5x uplift for non-experts."

4. **For model pages only**, also provide ratings:
   - novelty (1-5): How much does this add beyond existing frameworks?
   - rigor (1-5): How well-supported and internally consistent?
   - actionability (1-5): How useful for decision-making?
   - completeness (1-5): How thoroughly does it cover its domain?

Respond with valid JSON only, no markdown formatting.`;

const USER_PROMPT_TEMPLATE = `Grade this content page:

**File path**: {{filePath}}
**Category**: {{category}}
**Current title**: {{title}}
**Is a model page**: {{isModel}}

---
CONTENT:
{{content}}
---

Respond with JSON in this exact format:
{
  "importance": <1-5>,
  "quality": <1-5>,
  "llmSummary": "<1-2 sentences>",
  "ratings": { // only if isModel is true
    "novelty": <1-5>,
    "rigor": <1-5>,
    "actionability": <1-5>,
    "completeness": <1-5>
  },
  "reasoning": "<brief explanation of grades>"
}`;

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

        pages.push({
          id,
          filePath: fullPath,
          relativePath: relative(CONTENT_DIR, fullPath),
          urlPath: id === 'index' ? `${urlPrefix}/` : `${urlPrefix}/${id}/`,
          title: fm.title || id.replace(/-/g, ' '),
          category,
          subcategory,
          isModel,
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
 * Call Claude API to grade a page
 */
async function gradePage(client, page) {
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{{filePath}}', page.relativePath)
    .replace('{{category}}', page.category)
    .replace('{{title}}', page.title)
    .replace('{{isModel}}', page.isModel.toString())
    .replace('{{content}}', page.content.slice(0, 50000)); // Truncate very long content

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: SYSTEM_PROMPT,
  });

  const text = response.content[0].text;

  // Parse JSON response
  try {
    // Handle potential markdown code blocks
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || [null, text];
    return JSON.parse(jsonMatch[1] || text);
  } catch (e) {
    console.error(`Failed to parse response for ${page.id}:`, text);
    return null;
  }
}

/**
 * Apply grades to frontmatter
 */
function applyGradesToFile(page, grades) {
  const content = readFileSync(page.filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!fmMatch) {
    console.warn(`No frontmatter found in ${page.filePath}`);
    return false;
  }

  const fm = parseYaml(fmMatch[1]) || {};

  // Update fields
  fm.importance = grades.importance;
  if (grades.quality && !fm.quality) {
    fm.quality = grades.quality;
  }
  if (grades.llmSummary) {
    fm.llmSummary = grades.llmSummary;
  }
  if (grades.ratings && page.isModel) {
    fm.ratings = { ...fm.ratings, ...grades.ratings };
  }

  // Reconstruct file
  const newFm = stringifyYaml(fm);
  const bodyStart = content.indexOf('---', 4) + 4;
  const body = content.slice(bodyStart);
  const newContent = `---\n${newFm}---${body}`;

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
  if (options.category) {
    pages = pages.filter(p => p.category === options.category || p.subcategory === options.category);
    console.log(`Filtered to ${pages.length} pages in category: ${options.category}`);
  }

  if (options.skipGraded) {
    pages = pages.filter(p => p.currentImportance === null);
    console.log(`Filtered to ${pages.length} pages without importance`);
  }

  // Skip index files and internal files (starting with _)
  pages = pages.filter(p => p.id !== 'index' && !p.id.startsWith('_'));
  console.log(`Filtered to ${pages.length} content pages`);

  if (options.limit) {
    pages = pages.slice(0, options.limit);
    console.log(`Limited to ${pages.length} pages`);
  }

  // Cost estimate
  const avgTokens = 4500; // input per page
  const outputTokens = 300; // output per page
  const inputCost = (pages.length * avgTokens / 1_000_000) * 3;
  const outputCost = (pages.length * outputTokens / 1_000_000) * 15;
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

  // Initialize API client
  const client = new Anthropic();

  // Process pages
  const results = [];
  let processed = 0;
  let errors = 0;

  console.log('Processing pages...\n');

  for (const page of pages) {
    process.stdout.write(`[${processed + 1}/${pages.length}] ${page.id}... `);

    try {
      const grades = await gradePage(client, page);

      if (grades) {
        results.push({
          id: page.id,
          filePath: page.relativePath,
          category: page.category,
          isModel: page.isModel,
          title: page.title,
          grades,
        });

        if (options.apply) {
          applyGradesToFile(page, grades);
          console.log(`applied (imp=${grades.importance}, qual=${grades.quality})`);
        } else {
          console.log(`graded (imp=${grades.importance}, qual=${grades.quality})`);
        }
      } else {
        errors++;
        console.log('FAILED');
      }
    } catch (e) {
      errors++;
      console.log(`ERROR: ${e.message}`);
    }

    processed++;

    // Rate limiting - be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  // Write results
  writeFileSync(options.output, JSON.stringify(results, null, 2));
  console.log(`\nResults written to ${options.output}`);
  console.log(`Processed: ${processed}, Errors: ${errors}`);

  // Summary statistics
  const importanceDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const qualityDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const r of results) {
    if (r.grades.importance) importanceDistribution[r.grades.importance]++;
    if (r.grades.quality) qualityDistribution[r.grades.quality]++;
  }

  console.log('\nImportance Distribution:');
  for (const [k, v] of Object.entries(importanceDistribution)) {
    console.log(`  ${k}: ${'█'.repeat(v)} (${v})`);
  }

  console.log('\nQuality Distribution:');
  for (const [k, v] of Object.entries(qualityDistribution)) {
    console.log(`  ${k}: ${'█'.repeat(v)} (${v})`);
  }
}

main().catch(console.error);
