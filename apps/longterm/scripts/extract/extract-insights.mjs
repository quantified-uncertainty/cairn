#!/usr/bin/env node

/**
 * Insight Extraction Script
 *
 * Uses Claude API to automatically extract insights from pages.
 * Proposes insights for human review before adding to insights.yaml.
 *
 * Usage:
 *   node scripts/extract-insights.mjs --limit 10 --dry-run     # Preview
 *   node scripts/extract-insights.mjs --limit 5 --apply        # Add to insights.yaml
 *   node scripts/extract-insights.mjs --page warning-signs-model  # Specific page
 *   node scripts/extract-insights.mjs --tier 1                  # Top tier only
 *
 * Options:
 *   --limit N        Process N pages (default: 5)
 *   --page ID        Process specific page by filename
 *   --tier N         Process tier 1-4 (1=highest priority)
 *   --dry-run        Preview without saving
 *   --apply          Save to insights.yaml
 *   --model MODEL    Claude model (haiku, sonnet, opus) default: haiku
 *   --output DIR     Output directory for proposals (default: .claude/temp/insights)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient, MODELS, resolveModel, parseYamlResponse } from '../lib/anthropic.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_ROOT = join(__dirname, '../..');
const PAGES_PATH = join(APP_ROOT, 'src', 'data', 'pages.json');
const INSIGHTS_DIR = join(APP_ROOT, 'src', 'data', 'insights');
const CONTENT_DIR = join(APP_ROOT, 'src', 'content', 'docs');
const OUTPUT_DIR = join(APP_ROOT, '.claude', 'temp', 'insights');

// Insight type to file mapping
const TYPE_FILES = {
  'claim': 'claim.yaml',
  'research-gap': 'research-gap.yaml',
  'counterintuitive': 'counterintuitive.yaml',
  'quantitative': 'quantitative.yaml',
  'disagreement': 'disagreement.yaml',
  'neglected': 'neglected.yaml',
};

// Note: MODELS imported from shared anthropic.mjs module

// Insight types
const INSIGHT_TYPES = ['claim', 'research-gap', 'counterintuitive', 'quantitative', 'disagreement', 'neglected'];

// Extraction prompt template
const EXTRACTION_PROMPT = `You are an AI safety researcher extracting key insights from documentation pages.

An "insight" is a discrete, compact claim that would update an informed AI safety researcher's beliefs. Good insights are:
- Surprising: Would this update an expert's beliefs?
- Important: Does this affect high-stakes decisions?
- Actionable: Does this suggest concrete work?
- Well-sourced: Does the page provide evidence?

For this page, extract 2-5 high-quality insights. Each insight should:
1. Be a single, self-contained claim
2. Include specific numbers or evidence when available
3. Be phrased as a statement, not a question
4. Be 1-2 sentences maximum

Insight types to consider:
- claim: A factual assertion or finding
- research-gap: An unexplored or under-researched area
- counterintuitive: Contradicts common assumptions
- quantitative: Specific numbers, estimates, or measurements
- disagreement: Where informed people substantively differ
- neglected: Important topic getting insufficient attention

Rate each insight on 5 dimensions (1-5 scale, calibrated for AI safety experts):
- surprising: Would this update an expert's beliefs? (3=somewhat, 4=notably, 5=very)
- important: Does this affect high-stakes decisions? (3=moderate, 4=significant, 5=critical)
- actionable: Does this suggest concrete work? (3=somewhat, 4=clearly, 5=directly)
- neglected: Is this getting less attention than deserved? (1=well-covered, 3=moderate, 5=highly neglected)
- compact: How briefly can the core claim be conveyed? (3=paragraph, 4=sentence, 5=phrase)

Output YAML format:
\`\`\`yaml
insights:
  - insight: "The core claim in 1-2 sentences."
    type: claim
    tags: [tag1, tag2, tag3]
    surprising: 3.5
    important: 4.0
    actionable: 3.5
    neglected: 3.0
    compact: 4.0
    evidence: "Brief note on what evidence supports this"
\`\`\`

PAGE CONTENT:
---
Title: {title}
Path: {path}
---

{content}

---
Extract 2-5 insights from this page. Focus on the most surprising, important, and actionable findings.`;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    limit: 5,
    page: null,
    tier: null,
    dryRun: false,
    apply: false,
    model: 'haiku',
    output: OUTPUT_DIR,
  };

  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--apply') options.apply = true;
    else if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--page=')) options.page = arg.split('=')[1];
    else if (arg.startsWith('--tier=')) options.tier = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--model=')) options.model = arg.split('=')[1];
    else if (arg.startsWith('--output=')) options.output = arg.split('=')[1];
  }

  return options;
}

/**
 * Load all insights from the insights directory
 */
function loadAllInsights() {
  const allInsights = [];
  const files = readdirSync(INSIGHTS_DIR).filter(f => f.endsWith('.yaml'));
  for (const file of files) {
    const content = readFileSync(join(INSIGHTS_DIR, file), 'utf-8');
    const data = parseYaml(content);
    if (data?.insights) {
      allInsights.push(...data.insights);
    }
  }
  return allInsights;
}

/**
 * Load pages and calculate gaps
 */
function loadGaps() {
  const pages = JSON.parse(readFileSync(PAGES_PATH, 'utf-8'));
  const insights = loadAllInsights();

  // Count insights per source
  const insightCounts = new Map();
  for (const insight of insights || []) {
    const current = insightCounts.get(insight.source) || 0;
    insightCounts.set(insight.source, current + 1);
  }

  // Calculate gaps
  return pages
    .filter(page => page.importance != null && page.importance > 0)
    .map(page => {
      const insightCount = insightCounts.get(page.path) || 0;
      const importance = page.importance || 0;
      const quality = page.quality || 50;
      const potentialScore = Math.round(importance * (1 + quality / 100) - insightCount * 20);

      return {
        ...page,
        insightCount,
        potentialScore,
      };
    })
    .filter(g => g.insightCount === 0)
    .sort((a, b) => b.potentialScore - a.potentialScore);
}

/**
 * Get tier for a gap score
 */
function getTier(score) {
  if (score >= 160) return 1;
  if (score >= 140) return 2;
  if (score >= 100) return 3;
  return 4;
}

/**
 * Read page content
 */
function readPageContent(filePath) {
  const fullPath = join(CONTENT_DIR, filePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Page not found: ${fullPath}`);
  }
  return readFileSync(fullPath, 'utf-8');
}

/**
 * Extract insights using Claude API
 */
async function extractInsights(page, content, model, client) {
  const prompt = EXTRACTION_PROMPT
    .replace('{title}', page.title)
    .replace('{path}', page.path)
    .replace('{content}', content);

  const response = await client.messages.create({
    model: resolveModel(model),
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  // Parse YAML from response
  const text = response.content[0].text;
  const parsed = parseYamlResponse(text, parseYaml);
  return parsed.insights || [];
}

/**
 * Generate unique ID for insight
 */
function generateId(page, index) {
  const slug = basename(page.filePath, '.mdx')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  return `${slug}-${index + 1}`;
}

/**
 * Format insights for output
 */
function formatInsights(insights, page, existingCount) {
  const today = new Date().toISOString().split('T')[0];

  return insights.map((insight, i) => ({
    id: generateId(page, existingCount + i),
    insight: insight.insight,
    source: page.path,
    tags: insight.tags || [],
    type: INSIGHT_TYPES.includes(insight.type) ? insight.type : 'claim',
    surprising: parseFloat(insight.surprising) || 3.0,
    important: parseFloat(insight.important) || 3.0,
    actionable: parseFloat(insight.actionable) || 3.0,
    neglected: parseFloat(insight.neglected) || 3.0,
    compact: parseFloat(insight.compact) || 4.0,
    added: today,
    _evidence: insight.evidence, // For review, not saved
    _fromPage: page.title, // For review, not saved
  }));
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  console.log('\x1b[1m\x1b[34mInsight Extraction\x1b[0m');
  console.log(`Model: ${options.model}, Limit: ${options.limit}\n`);

  // Create shared Anthropic client (handles API key validation)
  const client = createClient();

  // Load gaps
  let gaps = loadGaps();
  console.log(`Found ${gaps.length} pages with no insights\n`);

  // Filter by page name
  if (options.page) {
    gaps = gaps.filter(g =>
      g.filePath.includes(options.page) ||
      g.title.toLowerCase().includes(options.page.toLowerCase())
    );
    if (gaps.length === 0) {
      console.error(`\x1b[31mNo page found matching: ${options.page}\x1b[0m`);
      process.exit(1);
    }
  }

  // Filter by tier
  if (options.tier) {
    gaps = gaps.filter(g => getTier(g.potentialScore) === options.tier);
    console.log(`Tier ${options.tier}: ${gaps.length} pages`);
  }

  // Limit
  gaps = gaps.slice(0, options.limit);

  if (gaps.length === 0) {
    console.log('No pages to process.');
    process.exit(0);
  }

  console.log(`Processing ${gaps.length} pages...\n`);

  // Process each page
  const allInsights = [];
  const results = [];

  for (const page of gaps) {
    console.log(`\x1b[36m▶ ${page.title}\x1b[0m`);
    console.log(`  Score: ${page.potentialScore} | Tier: ${getTier(page.potentialScore)}`);

    try {
      const content = readPageContent(page.filePath);
      console.log(`  ${content.length.toLocaleString()} chars`);

      if (options.dryRun) {
        console.log('  \x1b[33m[DRY RUN - skipping API call]\x1b[0m\n');
        results.push({ page, status: 'dry-run' });
        continue;
      }

      const rawInsights = await extractInsights(page, content, options.model, client);
      const formatted = formatInsights(rawInsights, page, allInsights.length);

      console.log(`  \x1b[32m✓ Extracted ${formatted.length} insights\x1b[0m`);

      for (const ins of formatted) {
        console.log(`    • ${ins.insight.substring(0, 70)}...`);
      }
      console.log();

      allInsights.push(...formatted);
      results.push({ page, status: 'success', count: formatted.length });

    } catch (err) {
      console.log(`  \x1b[31m✗ Error: ${err.message}\x1b[0m\n`);
      results.push({ page, status: 'error', error: err.message });
    }
  }

  // Summary
  console.log('\x1b[1m\x1b[34m─────────────────────────────────────────\x1b[0m');
  console.log(`\x1b[1mExtracted ${allInsights.length} insights from ${results.filter(r => r.status === 'success').length} pages\x1b[0m\n`);

  if (allInsights.length === 0) {
    console.log('No insights to save.');
    process.exit(0);
  }

  // Create output directory
  if (!existsSync(options.output)) {
    mkdirSync(options.output, { recursive: true });
  }

  // Save proposals for review
  const proposalPath = join(options.output, `proposal-${Date.now()}.yaml`);
  const proposalContent = stringifyYaml({ insights: allInsights }, { lineWidth: 120 });
  writeFileSync(proposalPath, proposalContent);
  console.log(`Proposals saved to: ${proposalPath}`);

  // Apply if requested
  if (options.apply) {
    // Group insights by type
    const byType = new Map();
    for (const ins of allInsights) {
      const { _evidence, _fromPage, ...clean } = ins;
      const type = clean.type || 'claim';
      if (!byType.has(type)) {
        byType.set(type, []);
      }
      byType.get(type).push(clean);
    }

    // Add to each type-specific file
    let totalAdded = 0;
    for (const [type, newInsights] of byType.entries()) {
      const filename = TYPE_FILES[type] || 'claim.yaml';
      const filepath = join(INSIGHTS_DIR, filename);

      let existing = { insights: [] };
      if (existsSync(filepath)) {
        existing = parseYaml(readFileSync(filepath, 'utf-8')) || { insights: [] };
      }

      existing.insights = [...(existing.insights || []), ...newInsights];
      writeFileSync(filepath, stringifyYaml(existing, { lineWidth: 120 }));
      console.log(`  Added ${newInsights.length} insights to ${filename}`);
      totalAdded += newInsights.length;
    }

    console.log(`\x1b[32m✓ Added ${totalAdded} insights across ${byType.size} files\x1b[0m`);
  } else {
    console.log('\n\x1b[33mReview proposals, then run with --apply to add to insights/\x1b[0m');
  }
}

main().catch(err => {
  console.error(`\x1b[31mFatal error: ${err.message}\x1b[0m`);
  process.exit(1);
});
