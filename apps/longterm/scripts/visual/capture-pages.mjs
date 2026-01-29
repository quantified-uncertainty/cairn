#!/usr/bin/env node

/**
 * Visual Page Capture Script
 *
 * Uses Playwright to capture full-page screenshots of wiki pages for visual inspection.
 * Generates an HTML index for easy review of rendering issues.
 *
 * Usage:
 *   node scripts/visual/capture-pages.mjs                    # Capture top 20 by importance
 *   node scripts/visual/capture-pages.mjs --all              # Capture all pages
 *   node scripts/visual/capture-pages.mjs --limit 50         # Capture top 50
 *   node scripts/visual/capture-pages.mjs --path /risks/     # Filter by path pattern
 *   node scripts/visual/capture-pages.mjs --page scheming    # Capture specific page
 *   node scripts/visual/capture-pages.mjs --changed          # Only pages changed in git
 *   node scripts/visual/capture-pages.mjs --serve            # Start server and capture
 *
 * Output:
 *   .claude/temp/screenshots/          # Screenshot images
 *   .claude/temp/screenshots/index.html # Review index
 *
 * Requirements:
 *   npm install playwright (or pnpm add -D playwright)
 *   npx playwright install chromium
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const OUTPUT_DIR = join(ROOT, '.claude/temp/screenshots');
const PAGES_FILE = join(ROOT, 'src/data/pages.json');

// Parse arguments
const args = process.argv.slice(2);
const options = {
  all: args.includes('--all'),
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 20,
  path: args.includes('--path') ? args[args.indexOf('--path') + 1] : null,
  page: args.includes('--page') ? args[args.indexOf('--page') + 1] : null,
  changed: args.includes('--changed'),
  serve: args.includes('--serve'),
  port: args.includes('--port') ? parseInt(args[args.indexOf('--port') + 1]) : 4321,
  width: args.includes('--width') ? parseInt(args[args.indexOf('--width') + 1]) : 1400,
  noSidebar: args.includes('--no-sidebar'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Visual Page Capture Script

Captures full-page screenshots of wiki pages for visual review.

Usage:
  node scripts/visual/capture-pages.mjs [options]

Options:
  --all           Capture all pages (ignores --limit)
  --limit N       Number of pages to capture (default: 20, sorted by importance)
  --path PATTERN  Only capture pages matching path pattern (e.g., /risks/)
  --page ID       Capture a specific page by ID or partial match
  --changed       Only capture pages with uncommitted changes
  --serve         Start dev server before capturing (auto-detects if needed)
  --port N        Dev server port (default: 4321)
  --width N       Viewport width (default: 1400)
  --no-sidebar    Hide sidebar in screenshots
  --help          Show this help

Output:
  .claude/temp/screenshots/         Screenshot images
  .claude/temp/screenshots/index.html  Visual review index

Examples:
  node scripts/visual/capture-pages.mjs --limit 10
  node scripts/visual/capture-pages.mjs --path /risks/misuse/
  node scripts/visual/capture-pages.mjs --page bioweapons
  node scripts/visual/capture-pages.mjs --changed --serve
`);
  process.exit(0);
}

// Check for Playwright
async function checkPlaywright() {
  try {
    await import('playwright');
    return true;
  } catch {
    console.error('\x1b[31mError: Playwright not installed\x1b[0m');
    console.log('\nInstall with:');
    console.log('  pnpm add -D playwright');
    console.log('  npx playwright install chromium');
    process.exit(1);
  }
}

// Load pages data
function loadPages() {
  if (!existsSync(PAGES_FILE)) {
    console.error('Error: pages.json not found. Run `npm run build:data` first.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(PAGES_FILE, 'utf-8'));
}

// Get changed files from git
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD', { encoding: 'utf-8', cwd: ROOT });
    const stagedOutput = execSync('git diff --name-only --cached', { encoding: 'utf-8', cwd: ROOT });
    const files = [...output.split('\n'), ...stagedOutput.split('\n')]
      .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
      .map(f => f.replace('src/content/docs/', '').replace(/\.(mdx|md)$/, ''));
    return [...new Set(files)];
  } catch {
    return [];
  }
}

// Filter and sort pages
function selectPages(pages) {
  let selected = pages.filter(p => p.path && p.quality !== null);

  // Filter by path pattern
  if (options.path) {
    selected = selected.filter(p => p.path.includes(options.path));
  }

  // Filter by specific page
  if (options.page) {
    const query = options.page.toLowerCase();
    selected = selected.filter(p =>
      p.id?.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query) ||
      p.title?.toLowerCase().includes(query)
    );
  }

  // Filter by changed files
  if (options.changed) {
    const changed = getChangedFiles();
    selected = selected.filter(p => {
      const pagePath = p.path.replace(/^\/|\/$/g, '');
      return changed.some(c => c.includes(pagePath) || pagePath.includes(c));
    });
  }

  // Sort by importance (highest first)
  selected.sort((a, b) => (b.importance || 0) - (a.importance || 0));

  // Apply limit
  if (!options.all && !options.page) {
    selected = selected.slice(0, options.limit);
  }

  return selected;
}

// Check if server is running
async function isServerRunning(port) {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch {
    return false;
  }
}

// Start dev server
function startServer(port) {
  console.log(`\x1b[34mStarting dev server on port ${port}...\x1b[0m`);

  const server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  return new Promise((resolve, reject) => {
    let output = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Local') || output.includes('localhost')) {
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      output += data.toString();
    });

    server.on('error', reject);

    // Timeout after 60 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 60000);
  });
}

// Capture a single page
async function capturePage(browser, page, baseUrl, outputDir) {
  const url = `${baseUrl}${page.path}`;
  const filename = page.path.replace(/\//g, '_').replace(/^_|_$/g, '') + '.png';
  const filepath = join(outputDir, filename);

  const browserPage = await browser.newPage();

  try {
    // Set viewport
    await browserPage.setViewportSize({ width: options.width, height: 800 });

    // Navigate to page
    await browserPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for content to render
    await browserPage.waitForSelector('.sl-markdown-content', { timeout: 10000 }).catch(() => {});

    // Optionally hide sidebar
    if (options.noSidebar) {
      await browserPage.evaluate(() => {
        const sidebar = document.querySelector('nav.sidebar');
        if (sidebar) sidebar.style.display = 'none';
        const main = document.querySelector('main');
        if (main) main.style.marginLeft = '0';
      });
    }

    // Take full-page screenshot
    await browserPage.screenshot({
      path: filepath,
      fullPage: true,
    });

    return { success: true, filename, page };
  } catch (error) {
    return { success: false, error: error.message, page };
  } finally {
    await browserPage.close();
  }
}

// Generate HTML index
function generateIndex(results, outputDir) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Page Review - ${new Date().toLocaleDateString()}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { margin-bottom: 10px; }
    .summary {
      background: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .summary span { margin-right: 20px; }
    .filters {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .filters input, .filters select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    .filters input { width: 300px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card-header {
      padding: 12px 15px;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-weight: 600;
      font-size: 14px;
      color: #333;
      text-decoration: none;
    }
    .card-title:hover { color: #0066cc; }
    .card-meta {
      font-size: 12px;
      color: #666;
    }
    .card-meta .quality { color: #22c55e; }
    .card-meta .importance { color: #3b82f6; }
    .card-image {
      max-height: 600px;
      overflow-y: auto;
      background: #fafafa;
    }
    .card-image img {
      width: 100%;
      display: block;
    }
    .failed {
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .failed-title { color: #dc2626; font-weight: 600; }
    .toggle-size {
      background: #f0f0f0;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .expanded .card-image { max-height: none; }
  </style>
</head>
<body>
  <h1>Visual Page Review</h1>
  <p style="color: #666; margin-bottom: 20px;">Generated: ${new Date().toLocaleString()}</p>

  <div class="summary">
    <span><strong>${successful.length}</strong> captured</span>
    <span><strong>${failed.length}</strong> failed</span>
    <span>Viewport: <strong>${options.width}px</strong></span>
  </div>

  <div class="filters">
    <input type="text" id="search" placeholder="Search by title or path..." onkeyup="filterCards()">
    <select id="sort" onchange="sortCards()">
      <option value="importance">Sort by Importance</option>
      <option value="quality">Sort by Quality</option>
      <option value="title">Sort by Title</option>
    </select>
  </div>

  ${failed.length > 0 ? `
  <h2>Failed Captures</h2>
  ${failed.map(r => `
    <div class="failed">
      <div class="failed-title">${r.page.title || r.page.path}</div>
      <div>${r.page.path}</div>
      <div style="color: #666; font-size: 12px;">${r.error}</div>
    </div>
  `).join('')}
  ` : ''}

  <h2>Screenshots</h2>
  <div class="grid" id="grid">
    ${successful.map(r => `
    <div class="card" data-title="${r.page.title || ''}" data-path="${r.page.path}" data-quality="${r.page.quality || 0}" data-importance="${r.page.importance || 0}">
      <div class="card-header">
        <a class="card-title" href="http://localhost:${options.port}${r.page.path}" target="_blank">${r.page.title || r.page.path}</a>
        <div class="card-meta">
          <span class="quality">Q${r.page.quality || '?'}</span>
          <span class="importance">I${r.page.importance || '?'}</span>
        </div>
      </div>
      <div class="card-image">
        <img src="${r.filename}" alt="${r.page.title}" loading="lazy">
      </div>
    </div>
    `).join('')}
  </div>

  <script>
    function filterCards() {
      const query = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.card').forEach(card => {
        const title = card.dataset.title.toLowerCase();
        const path = card.dataset.path.toLowerCase();
        card.style.display = (title.includes(query) || path.includes(query)) ? '' : 'none';
      });
    }

    function sortCards() {
      const grid = document.getElementById('grid');
      const cards = [...grid.children];
      const sortBy = document.getElementById('sort').value;

      cards.sort((a, b) => {
        if (sortBy === 'title') return a.dataset.title.localeCompare(b.dataset.title);
        if (sortBy === 'quality') return parseInt(b.dataset.quality) - parseInt(a.dataset.quality);
        return parseInt(b.dataset.importance) - parseInt(a.dataset.importance);
      });

      cards.forEach(card => grid.appendChild(card));
    }

    // Click to expand/collapse
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') return;
        card.classList.toggle('expanded');
      });
    });
  </script>
</body>
</html>`;

  writeFileSync(join(outputDir, 'index.html'), html);
}

// Main
async function main() {
  await checkPlaywright();

  const { chromium } = await import('playwright');

  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Load and filter pages
  const allPages = loadPages();
  const pages = selectPages(allPages);

  if (pages.length === 0) {
    console.log('\x1b[33mNo pages match the criteria\x1b[0m');
    process.exit(0);
  }

  console.log(`\x1b[34mCapturing ${pages.length} pages...\x1b[0m\n`);

  // Check/start server
  const baseUrl = `http://localhost:${options.port}`;
  let serverProcess = null;

  if (!(await isServerRunning(options.port))) {
    if (options.serve) {
      serverProcess = await startServer(options.port);
      // Wait a bit for server to stabilize
      await new Promise(r => setTimeout(r, 3000));
    } else {
      console.error(`\x1b[31mError: Dev server not running on port ${options.port}\x1b[0m`);
      console.log('Start with: npm run dev');
      console.log('Or use: --serve to auto-start');
      process.exit(1);
    }
  }

  // Launch browser
  const browser = await chromium.launch();

  // Capture pages with concurrency
  const concurrency = 3;
  const results = [];

  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(page => capturePage(browser, page, baseUrl, OUTPUT_DIR))
    );

    for (const result of batchResults) {
      results.push(result);
      const icon = result.success ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      const title = result.page.title || result.page.path;
      console.log(`${icon} ${title}`);
    }
  }

  // Cleanup
  await browser.close();
  if (serverProcess) {
    process.kill(-serverProcess.pid);
  }

  // Generate index
  generateIndex(results, OUTPUT_DIR);

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n\x1b[1mSummary:\x1b[0m`);
  console.log(`  \x1b[32m${successful} captured\x1b[0m`);
  if (failed > 0) {
    console.log(`  \x1b[31m${failed} failed\x1b[0m`);
  }
  console.log(`\n  Output: ${relative(process.cwd(), OUTPUT_DIR)}/`);
  console.log(`  Review: open ${relative(process.cwd(), join(OUTPUT_DIR, 'index.html'))}`);
}

main().catch(console.error);
