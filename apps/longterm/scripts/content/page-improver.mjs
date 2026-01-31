#!/usr/bin/env node

/**
 * Page Improvement Helper
 *
 * Helps identify pages that need improvement and runs batch improvements.
 *
 * IMPORTANT: Batch mode uses Claude Code SDK with your ANTHROPIC_API_KEY,
 * NOT your Max subscription quota. This lets you run large batch jobs
 * without depleting your interactive Claude Code allowance.
 *
 * Usage:
 *   node scripts/content/page-improver.mjs --list              # List pages needing improvement
 *   node scripts/content/page-improver.mjs <page-id>           # Show improvement prompt for page
 *   node scripts/content/page-improver.mjs <page-id> --info    # Show page info only
 *   node scripts/content/page-improver.mjs --batch --limit 50  # Run batch improvement
 *   node scripts/content/page-improver.mjs --batch --model sonnet --budget 1.50 --limit 50
 */

import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');

// Load pages data
function loadPages() {
  const pagesPath = path.join(ROOT, 'src/data/pages.json');
  if (!fs.existsSync(pagesPath)) {
    console.error('Error: pages.json not found. Run `npm run build:data` first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(pagesPath, 'utf-8'));
}

// Find page by ID or partial match
function findPage(pages, query) {
  // Exact match
  let page = pages.find(p => p.id === query);
  if (page) return page;

  // Partial match
  const matches = pages.filter(p => p.id.includes(query) || p.title.toLowerCase().includes(query.toLowerCase()));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    console.log('Multiple matches found:');
    matches.slice(0, 10).forEach(p => console.log(`  - ${p.id} (${p.title})`));
    process.exit(1);
  }
  return null;
}

// Get file path from page path
function getFilePath(pagePath) {
  // Remove leading/trailing slashes
  const cleanPath = pagePath.replace(/^\/|\/$/g, '');
  return path.join(ROOT, 'src/content/docs', cleanPath + '.mdx');
}

// List pages that need improvement
function listPages(pages, options = {}) {
  const { limit = 20, maxQuality = 90, minImportance = 30 } = options;

  const candidates = pages
    .filter(p => p.quality && p.quality <= maxQuality)
    .filter(p => p.importance && p.importance >= minImportance)
    .filter(p => !p.path.includes('/models/')) // Exclude models (complex JSX)
    .map(p => ({
      id: p.id,
      title: p.title,
      path: p.path,
      quality: p.quality,
      importance: p.importance,
      gap: p.importance - p.quality  // Both on 1-100 scale now
    }))
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);

  console.log(`\n📊 Pages needing improvement (Q≤${maxQuality}, Imp≥${minImportance}):\n`);
  console.log('| # | Quality | Imp | Gap | Page |');
  console.log('|---|---------|-----|-----|------|');
  candidates.forEach((p, i) => {
    console.log(`| ${i + 1} | ${p.quality} | ${p.importance} | ${p.gap > 0 ? '+' : ''}${p.gap} | ${p.title} |`);
  });
  console.log(`\nRun: node scripts/page-improver.mjs <page-id> to get improvement prompt`);
}

// Show page info
function showPageInfo(page) {
  const filePath = getFilePath(page.path);
  const exists = fs.existsSync(filePath);
  const lines = exists ? fs.readFileSync(filePath, 'utf-8').split('\n').length : 0;

  console.log(`\n📄 ${page.title}`);
  console.log(`   ID: ${page.id}`);
  console.log(`   Path: ${page.path}`);
  console.log(`   File: ${filePath}`);
  console.log(`   Quality: ${page.quality || 'N/A'}`);
  console.log(`   Importance: ${page.importance || 'N/A'}`);
  console.log(`   Lines: ${lines}`);
  console.log(`   Gap: ${page.importance ? page.importance - (page.quality * 10) : 'N/A'}`);
}

// Calculate correct import depth based on page path
function getImportDepth(pagePath) {
  // Count directory levels from src/content/docs/
  const parts = pagePath.replace(/^\/|\/$/g, '').split('/');
  const depth = parts.length; // number of directories deep
  return '../'.repeat(depth) + 'components/wiki';
}

// Generate improvement prompt
function generatePrompt(page) {
  const filePath = getFilePath(page.path);
  const relativePath = path.relative(ROOT, filePath);
  const importPath = getImportDepth(page.path);

  return `Improve the page at ${relativePath}

## CRITICAL: Quality 5 Requirements Checklist

A Q5 page MUST have ALL of these elements. Check each one:

□ **Quick Assessment Table** (at top, after DataInfoBox)
  - 5-7 rows minimum
  - Columns: Dimension | Assessment/Rating | Evidence
  - Include quantified metrics with sources

□ **At Least 2 Substantive Tables** (not counting Quick Assessment)
  - Each table: 3+ columns, 4+ rows
  - Include real data/statistics
  - Cite sources in table cells or footnotes

□ **1 Mermaid Diagram** showing key relationships
  - Use vertical flowchart (TD)
  - Max 15 nodes
  - Color-code: red for risks, green for solutions, blue for neutral
  - Import: import {Mermaid} from '${importPath}';

□ **10+ Real Citations with URLs** (use WebSearch)
  - Format: [Organization Name](https://actual-url)
  - Authoritative sources: government reports, academic papers, major research orgs
  - Include publication year when possible

□ **Quantified Claims** (replace ALL vague language)
  - "significant" → "25-40%"
  - "rapidly" → "3x growth since 2022"
  - "many" → "60-80% of..."
  - Always include uncertainty ranges

## MDX Syntax Rules (CRITICAL - builds will fail otherwise)

- **ALWAYS escape dollar signs**: Use \\\$100M not $100M
  - Unescaped $ triggers LaTeX parsing and breaks the build
  - Example: "funding of \\\$50M" not "funding of $50M"
- NEVER use \`<NUMBER\` patterns (e.g., \`<30%\`, \`<$1M\`)
  - Use "less than 30%" or "under \\$1M" instead
- NEVER use \`>NUMBER\` at start of line (becomes blockquote)
  - Use "greater than" or "more than" instead
- Escape special characters in tables if needed

## Process

1. **Read** the reference files:
   - src/content/docs/knowledge-base/risks/misuse/bioweapons.mdx (Q5 gold standard)
   - src/content/docs/knowledge-base/responses/technical/scalable-oversight.mdx (Q5 example with good tables)

2. **Read** the current page: ${relativePath}

3. **Audit** - identify what's missing from the checklist above

4. **WebSearch** for real sources relevant to the topic (5+ searches)

5. **Edit** - add each missing element one at a time:
   - Add Quick Assessment table after imports
   - Add comparison/data tables in relevant sections
   - Add Mermaid diagram showing key relationships
   - Add citations throughout (inline links)
   - Replace vague claims with quantified statements

6. **Update metadata**:
   - quality: 91 (scale is 1-100, target is 91+)
   - lastEdited: "${new Date().toISOString().split('T')[0]}"

## Verification

Before finishing, confirm:
- [ ] Quick Assessment table exists (5+ rows, 3 columns)
- [ ] At least 2 other substantive tables exist
- [ ] Mermaid diagram exists with proper import
- [ ] 10+ [linked citations](https://url) throughout
- [ ] No "<NUMBER" patterns anywhere in the file
- [ ] Metadata updated (quality: 91, lastEdited: today)

Use the Edit tool for each change. DO NOT rewrite the entire file.`;
}

// ============ Batch Processing ============

const RESULTS_FILE = path.join(ROOT, '.claude/temp/improvement-results.json');
const LOG_FILE = path.join(ROOT, '.claude/temp/improvement-log.txt');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadResults() {
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf-8'));
    } catch {
      return { completed: [], failed: [], inProgress: [] };
    }
  }
  return { completed: [], failed: [], inProgress: [] };
}

function saveResults(results) {
  ensureDir(RESULTS_FILE);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

function appendLog(message) {
  ensureDir(LOG_FILE);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

// Validate a file after improvement
function validateFile(filePath) {
  const errors = [];

  if (!fs.existsSync(filePath)) {
    return { valid: false, errors: ['File does not exist'] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    errors.push('No frontmatter found');
  } else {
    // Try to parse YAML
    try {
      // Dynamic import would be cleaner but we'll use a simple check
      const yaml = frontmatterMatch[1];

      // Check for common YAML issues
      // Unquoted values with colons (e.g., "key: value: more" without quotes)
      const lines = yaml.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip if line is empty, a comment, or starts with whitespace (nested)
        if (!line.trim() || line.trim().startsWith('#')) continue;

        // Check for unquoted multi-colon values (common LLM mistake)
        const colonMatch = line.match(/^(\w+):\s*(.+)$/);
        if (colonMatch) {
          const value = colonMatch[2];
          // If value contains ": " and isn't quoted, it's likely broken
          if (value.includes(': ') && !value.startsWith('"') && !value.startsWith("'")) {
            errors.push(`Line ${i + 1}: Unquoted value with colon - "${line.slice(0, 60)}..."`);
          }
        }
      }

      // Use execSync to validate YAML with node
      try {
        execSync(`node -e "require('js-yaml').load(require('fs').readFileSync('${filePath}', 'utf-8').match(/^---\\n([\\s\\S]*?)\\n---/)[1])"`, {
          cwd: ROOT,
          stdio: 'pipe'
        });
      } catch (e) {
        errors.push(`YAML parse error: ${e.message.split('\n')[0]}`);
      }
    } catch (e) {
      errors.push(`Frontmatter validation error: ${e.message}`);
    }
  }

  // Check for unescaped < followed by numbers (JSX issue)
  const ltNumberPattern = /<(\d+|[$€£]?\d)/g;
  let match;
  while ((match = ltNumberPattern.exec(content)) !== null) {
    const lineNum = content.slice(0, match.index).split('\n').length;
    errors.push(`Line ${lineNum}: Unescaped "<${match[1]}" - will break JSX parsing`);
  }

  // Check for unescaped $ that might trigger LaTeX
  const dollarPattern = /\$\d+[,.\d]*[BMKbmk]?\b/g;
  while ((match = dollarPattern.exec(content)) !== null) {
    // Skip if inside code block or inline code
    const before = content.slice(0, match.index);
    const inCode = (before.match(/```/g) || []).length % 2 === 1;
    const inInlineCode = (before.match(/`/g) || []).length % 2 === 1;
    if (!inCode && !inInlineCode) {
      const lineNum = before.split('\n').length;
      errors.push(`Line ${lineNum}: Unescaped "${match[0]}" - may trigger LaTeX`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Run a single page improvement using Claude Code SDK (via npx)
// This uses your ANTHROPIC_API_KEY instead of Max subscription quota
function runClaudeImprovement(page, prompt, options = {}) {
  const {
    model = 'sonnet',
    maxBudget = 2.00,  // Default $2 per page for improvements with web search
  } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();
    const filePath = getFilePath(page.path);

    appendLog(`START: ${page.id} (${page.title}) [model=${model}, budget=$${maxBudget}]`);

    // Use Claude Code SDK via npx - this uses ANTHROPIC_API_KEY from .env
    // instead of your Max subscription quota
    const claude = spawn('npx', [
      '@anthropic-ai/claude-code',
      '--print',
      '--dangerously-skip-permissions',
      '--model', model,
      '--max-budget-usd', String(maxBudget),
      '--allowedTools', 'Read,Edit,Glob,Grep,WebSearch',
      prompt
    ], {
      cwd: ROOT,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code === 0) {
        // Validate the file after improvement
        const validation = validateFile(filePath);
        if (validation.valid) {
          appendLog(`DONE: ${page.id} (${duration}s)`);
          resolve({
            success: true,
            page,
            duration,
            outputLength: stdout.length
          });
        } else {
          appendLog(`VALIDATION_FAIL: ${page.id} - ${validation.errors.join('; ')}`);
          resolve({
            success: false,
            page,
            duration,
            error: `Validation failed: ${validation.errors.join('; ')}`,
            validationErrors: validation.errors
          });
        }
      } else {
        appendLog(`FAIL: ${page.id} - exit code ${code}`);
        resolve({
          success: false,
          page,
          duration,
          error: stderr.slice(0, 500) || `Exit code: ${code}`
        });
      }
    });

    claude.on('error', (err) => {
      appendLog(`ERROR: ${page.id} - ${err.message}`);
      resolve({
        success: false,
        page,
        duration: ((Date.now() - startTime) / 1000).toFixed(1),
        error: err.message
      });
    });
  });
}

// Get list of recently modified MDX files from git
function getRecentlyModifiedFiles() {
  try {
    const stdout = execSync('git diff --name-only HEAD 2>/dev/null || true', { cwd: ROOT, encoding: 'utf-8' });
    const staged = execSync('git diff --cached --name-only 2>/dev/null || true', { cwd: ROOT, encoding: 'utf-8' });
    const files = new Set([...stdout.split('\n'), ...staged.split('\n')].filter(f => f.endsWith('.mdx')));
    return files;
  } catch {
    return new Set();
  }
}

// Process pages in parallel batches
async function runBatch(options = {}) {
  const {
    limit = 50,
    parallel = 10,
    maxQuality = 90,
    minImportance = 30,
    minGap = 0,
    resume = true,
    skipModified = true,
    model = 'sonnet',      // Default to Sonnet (cheaper than Opus)
    maxBudget = 2.00       // Default $2 per page
  } = options;

  const pages = loadPages();
  const results = resume ? loadResults() : { completed: [], failed: [], inProgress: [] };

  // Get already processed IDs
  const processedIds = new Set([
    ...results.completed.map(r => r.page.id),
    ...results.failed.map(r => r.page.id)
  ]);

  // Get recently modified files to skip
  const modifiedFiles = skipModified ? getRecentlyModifiedFiles() : new Set();
  if (modifiedFiles.size > 0) {
    console.log(`\n⏭️  Skipping ${modifiedFiles.size} recently modified files`);
  }

  // Get candidates sorted by gap
  const candidates = pages
    .filter(p => p.quality && p.quality <= maxQuality)
    .filter(p => p.importance && p.importance >= minImportance)
    .filter(p => !p.path.includes('/models/')) // Exclude models (complex JSX)
    .filter(p => !processedIds.has(p.id)) // Skip already processed
    .filter(p => {
      // Skip recently modified files
      const filePath = getFilePath(p.path);
      if (!filePath) return true;
      const relativePath = path.relative(ROOT, filePath);
      return !modifiedFiles.has(relativePath);
    })
    .map(p => ({
      id: p.id,
      title: p.title,
      path: p.path,
      quality: p.quality,
      importance: p.importance,
      gap: p.importance - p.quality
    }))
    .filter(p => p.gap >= minGap) // Filter by minimum gap
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);

  if (candidates.length === 0) {
    console.log('\n✅ No pages to process (all done or none match criteria)');
    console.log(`   Completed: ${results.completed.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    return;
  }

  console.log(`\n📊 Batch Improvement (using Claude Code SDK - API key billing)`);
  console.log(`   Pages to process: ${candidates.length}`);
  console.log(`   Parallelism: ${parallel}`);
  console.log(`   Model: ${model}`);
  console.log(`   Max budget per page: $${maxBudget.toFixed(2)}`);
  console.log(`   Est. max total cost: $${(candidates.length * maxBudget).toFixed(2)}`);
  console.log(`   Min gap filter: ${minGap > 0 ? `>= ${minGap}` : 'none'}`);
  console.log(`   Already completed: ${results.completed.length}`);
  console.log(`   Results file: ${RESULTS_FILE}`);
  console.log(`   Log file: ${LOG_FILE}`);
  console.log(`\n   ⚠️  This uses your ANTHROPIC_API_KEY, not Max subscription`);
  console.log(`   Starting in 3 seconds... (Ctrl+C to cancel)\n`);

  await new Promise(r => setTimeout(r, 3000));

  // Clear log file for this run
  ensureDir(LOG_FILE);
  fs.writeFileSync(LOG_FILE, `=== Batch run started at ${new Date().toISOString()} ===\n`);
  fs.appendFileSync(LOG_FILE, `Pages: ${candidates.length}, Parallel: ${parallel}\n\n`);

  // Process in parallel batches
  let processed = 0;

  for (let i = 0; i < candidates.length; i += parallel) {
    const batch = candidates.slice(i, i + parallel);

    console.log(`\n📦 Batch ${Math.floor(i / parallel) + 1}/${Math.ceil(candidates.length / parallel)}`);
    batch.forEach(p => console.log(`   ⏳ ${p.id} (Q${p.quality}, gap +${p.gap})`));

    // Mark as in progress
    results.inProgress = batch.map(p => ({ page: p, startTime: Date.now() }));
    saveResults(results);

    // Run batch in parallel
    const batchPromises = batch.map(page => {
      const prompt = generatePrompt(page);
      return runClaudeImprovement(page, prompt, { model, maxBudget });
    });

    const batchResults = await Promise.all(batchPromises);

    // Update results
    results.inProgress = [];
    for (const result of batchResults) {
      if (result.success) {
        results.completed.push(result);
        console.log(`   ✅ ${result.page.id} (${result.duration}s)`);
      } else {
        results.failed.push(result);
        console.log(`   ❌ ${result.page.id}: ${result.error?.slice(0, 100)}`);
      }
      processed++;
    }

    saveResults(results);
    console.log(`   Progress: ${processed}/${candidates.length}`);
  }

  // Final summary
  const validationFailures = results.failed.filter(r => r.validationErrors);
  const otherFailures = results.failed.filter(r => !r.validationErrors);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 BATCH COMPLETE`);
  console.log(`   Total processed: ${processed}`);
  console.log(`   Succeeded: ${results.completed.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  if (validationFailures.length > 0) {
    console.log(`      - Validation failures: ${validationFailures.length}`);
    validationFailures.forEach(r => {
      console.log(`        ⚠️  ${r.page.id}: ${r.validationErrors.slice(0, 2).join('; ')}`);
    });
  }
  if (otherFailures.length > 0) {
    console.log(`      - Other failures: ${otherFailures.length}`);
  }
  console.log(`   Results: ${RESULTS_FILE}`);
  console.log(`   Log: ${LOG_FILE}`);
  console.log(`${'='.repeat(50)}\n`);

  // Auto-run post-improvement fixes if there were validation failures
  if (validationFailures.length > 0) {
    console.log('🔧 Running post-improvement fixes...\n');
    try {
      const { execSync } = await import('child_process');
      execSync('node scripts/content/post-improve.mjs --fix-only', {
        cwd: ROOT,
        stdio: 'inherit'
      });
    } catch (e) {
      console.log('   ⚠️  Post-improvement fixes failed, run manually: npm run improve:post');
    }
  }
}

// Parse command line arguments
function parseArgs(args) {
  const opts = { _positional: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        opts[key] = isNaN(next) ? next : parseInt(next);
        i++;
      } else {
        opts[key] = true;
      }
    } else {
      opts._positional.push(args[i]);
    }
  }
  return opts;
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  if (args.length === 0 || opts.help || opts.h) {
    console.log(`
Page Improvement Helper

Uses Claude Code SDK with your ANTHROPIC_API_KEY (not Max subscription quota).

Usage:
  node scripts/content/page-improver.mjs --list              List pages needing improvement
  node scripts/content/page-improver.mjs <page-id>           Show improvement prompt for page
  node scripts/content/page-improver.mjs <page-id> --info    Show page info only
  node scripts/content/page-improver.mjs --batch             Run batch improvement via SDK

Options:
  --list          List candidate pages
  --info          Show page info only (no prompt)
  --batch         Run batch improvement (uses Claude Code SDK + API key)
  --parallel N    Number of parallel improvements (default: 10)
  --model M       Model to use: haiku, sonnet (default), opus
  --budget N      Max budget per page in USD (default: 2.00)
  --max-qual N    Max quality for listing/batch (default: 90, scale 1-100)
  --min-imp N     Min importance for listing/batch (default: 30)
  --min-gap N     Min gap (importance - quality) for batch (default: 0)
  --limit N       Limit results (default: 20 for list, 200 for batch)
  --no-resume     Start fresh (ignore previous results)
  --no-skip-modified  Don't skip git-modified files
  --status        Show batch progress status

Examples:
  node scripts/content/page-improver.mjs --list --max-qual 70
  node scripts/content/page-improver.mjs economic-disruption
  node scripts/content/page-improver.mjs --batch --limit 50 --parallel 5
  node scripts/content/page-improver.mjs --batch --model haiku --budget 0.50 --limit 10
  node scripts/content/page-improver.mjs --status

Cost estimates (per page):
  haiku:  ~$0.10-0.30 (fast, good for simple improvements)
  sonnet: ~$0.50-1.50 (balanced, recommended for most pages)
  opus:   ~$2.00-5.00 (best quality, use for complex pages)
`);
    return;
  }

  // Status mode
  if (opts.status) {
    const results = loadResults();
    const validationFailures = results.failed.filter(r => r.validationErrors);
    const otherFailures = results.failed.filter(r => !r.validationErrors);

    console.log(`\n📊 Batch Progress`);
    console.log(`   Completed: ${results.completed.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    if (validationFailures.length > 0) {
      console.log(`      - Validation failures: ${validationFailures.length}`);
    }
    if (otherFailures.length > 0) {
      console.log(`      - Other failures: ${otherFailures.length}`);
    }
    console.log(`   In Progress: ${results.inProgress.length}`);
    if (results.completed.length > 0) {
      console.log(`\n   Last 5 completed:`);
      results.completed.slice(-5).forEach(r => {
        console.log(`     ✅ ${r.page.id} (${r.duration}s)`);
      });
    }
    if (validationFailures.length > 0) {
      console.log(`\n   Validation failures (need manual fix):`);
      validationFailures.forEach(r => {
        console.log(`     ⚠️  ${r.page.id}:`);
        r.validationErrors.slice(0, 3).forEach(e => console.log(`        - ${e}`));
      });
    }
    if (otherFailures.length > 0) {
      console.log(`\n   Other failures:`);
      otherFailures.forEach(r => {
        console.log(`     ❌ ${r.page.id}: ${r.error?.slice(0, 60)}`);
      });
    }
    return;
  }

  // Batch mode
  if (opts.batch) {
    await runBatch({
      limit: opts.limit || 200,
      parallel: opts.parallel || 10,
      maxQuality: opts['max-qual'] || 90,
      minImportance: opts['min-imp'] || 30,
      minGap: opts['min-gap'] || 0,
      resume: !opts['no-resume'],
      skipModified: !opts['no-skip-modified'],
      model: opts.model || 'sonnet',
      maxBudget: opts.budget ? parseFloat(opts.budget) : 2.00
    });
    return;
  }

  const pages = loadPages();

  // List mode
  if (opts.list) {
    listPages(pages, {
      maxQuality: opts['max-qual'] || 90,
      minImportance: opts['min-imp'] || 30,
      limit: opts.limit || 20
    });
    return;
  }

  // Page mode
  const pageQuery = opts._positional[0];
  if (!pageQuery) {
    console.error('Error: No page ID provided');
    console.error('Try: node scripts/content/page-improver.mjs --list');
    process.exit(1);
  }

  const page = findPage(pages, pageQuery);
  if (!page) {
    console.error(`Error: Page not found: ${pageQuery}`);
    console.log('Try: node scripts/content/page-improver.mjs --list');
    process.exit(1);
  }

  showPageInfo(page);

  if (opts.info) {
    return;
  }

  // Generate and display prompt
  console.log('\n' + '='.repeat(60));
  console.log('📝 IMPROVEMENT PROMPT (copy to Claude Code Task tool):');
  console.log('='.repeat(60) + '\n');
  console.log(generatePrompt(page));
  console.log('\n' + '='.repeat(60));
  console.log('\nTo use: Copy the prompt above and run in Claude Code with:');
  console.log('Task({ subagent_type: "general-purpose", prompt: `<paste prompt>` })');
  console.log('\nOr run batch mode:');
  console.log('node scripts/content/page-improver.mjs --batch --limit 50 --parallel 10');
}

main().catch(console.error);
