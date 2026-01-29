#!/usr/bin/env node

/**
 * Page Improvement Helper
 *
 * Helps identify pages that need improvement and generates prompts for Claude Code.
 *
 * Usage:
 *   node scripts/content/page-improver.mjs --list              # List pages needing improvement
 *   node scripts/content/page-improver.mjs <page-id>           # Show improvement prompt for page
 *   node scripts/content/page-improver.mjs <page-id> --info    # Show page info only
 *   node scripts/content/page-improver.mjs --batch --limit 50  # Run batch improvement
 *   node scripts/content/page-improver.mjs --batch --parallel 10 --limit 50  # With parallelism
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

- NEVER use \`<NUMBER\` patterns (e.g., \`<30%\`, \`<$1M\`)
  - Use "less than 30%" or "under $1M" instead
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

// Run a single page improvement using claude CLI
function runClaudeImprovement(page, prompt) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const filePath = getFilePath(page.path);

    appendLog(`START: ${page.id} (${page.title})`);

    // Use claude CLI with --print flag to run non-interactively
    const claude = spawn('claude', [
      '--print',
      '--dangerously-skip-permissions',
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
        appendLog(`DONE: ${page.id} (${duration}s)`);
        resolve({
          success: true,
          page,
          duration,
          outputLength: stdout.length
        });
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
  const { limit = 50, parallel = 10, maxQuality = 90, minImportance = 30, resume = true, skipModified = true } = options;

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
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);

  if (candidates.length === 0) {
    console.log('\n✅ No pages to process (all done or none match criteria)');
    console.log(`   Completed: ${results.completed.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    return;
  }

  console.log(`\n📊 Batch Improvement`);
  console.log(`   Pages to process: ${candidates.length}`);
  console.log(`   Parallelism: ${parallel}`);
  console.log(`   Already completed: ${results.completed.length}`);
  console.log(`   Results file: ${RESULTS_FILE}`);
  console.log(`   Log file: ${LOG_FILE}`);
  console.log(`\n   Starting in 3 seconds... (Ctrl+C to cancel)\n`);

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
      return runClaudeImprovement(page, prompt);
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
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 BATCH COMPLETE`);
  console.log(`   Total processed: ${processed}`);
  console.log(`   Succeeded: ${results.completed.length}`);
  console.log(`   Failed: ${results.failed.length}`);
  console.log(`   Results: ${RESULTS_FILE}`);
  console.log(`   Log: ${LOG_FILE}`);
  console.log(`${'='.repeat(50)}\n`);
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

Usage:
  node scripts/content/page-improver.mjs --list              List pages needing improvement
  node scripts/content/page-improver.mjs <page-id>           Show improvement prompt for page
  node scripts/content/page-improver.mjs <page-id> --info    Show page info only
  node scripts/content/page-improver.mjs --batch             Run batch improvement via claude CLI

Options:
  --list          List candidate pages
  --info          Show page info only (no prompt)
  --batch         Run batch improvement (uses claude CLI)
  --parallel N    Number of parallel improvements (default: 10)
  --max-qual N    Max quality for listing/batch (default: 90, scale 1-100)
  --min-imp N     Min importance for listing/batch (default: 30)
  --limit N       Limit results (default: 20 for list, 50 for batch)
  --no-resume     Start fresh (ignore previous results)
  --no-skip-modified  Don't skip git-modified files
  --status        Show batch progress status

Examples:
  node scripts/content/page-improver.mjs --list --max-qual 70
  node scripts/content/page-improver.mjs economic-disruption
  node scripts/content/page-improver.mjs --batch --limit 50 --parallel 10
  node scripts/content/page-improver.mjs --status
`);
    return;
  }

  // Status mode
  if (opts.status) {
    const results = loadResults();
    console.log(`\n📊 Batch Progress`);
    console.log(`   Completed: ${results.completed.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    console.log(`   In Progress: ${results.inProgress.length}`);
    if (results.completed.length > 0) {
      console.log(`\n   Last 5 completed:`);
      results.completed.slice(-5).forEach(r => {
        console.log(`     ✅ ${r.page.id} (${r.duration}s)`);
      });
    }
    if (results.failed.length > 0) {
      console.log(`\n   Failed:`);
      results.failed.forEach(r => {
        console.log(`     ❌ ${r.page.id}: ${r.error?.slice(0, 60)}`);
      });
    }
    return;
  }

  // Batch mode
  if (opts.batch) {
    await runBatch({
      limit: opts.limit || 50,
      parallel: opts.parallel || 10,
      maxQuality: opts['max-qual'] || 90,
      minImportance: opts['min-imp'] || 30,
      resume: !opts['no-resume'],
      skipModified: !opts['no-skip-modified']
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
