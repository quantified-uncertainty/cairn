#!/usr/bin/env node

/**
 * Page Improvement Helper
 *
 * Helps identify pages that need improvement and generates prompts for Claude Code.
 *
 * Usage:
 *   node scripts/page-improver.mjs --list              # List pages needing improvement
 *   node scripts/page-improver.mjs <page-id>           # Show improvement prompt for page
 *   node scripts/page-improver.mjs <page-id> --info    # Show page info only
 */

import fs from 'fs';
import path from 'path';
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

// Main
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Page Improvement Helper

Usage:
  node scripts/page-improver.mjs --list              List pages needing improvement
  node scripts/page-improver.mjs <page-id>           Show improvement prompt for page
  node scripts/page-improver.mjs <page-id> --info    Show page info only

Options:
  --list          List candidate pages
  --info          Show page info only (no prompt)
  --max-qual N    Max quality for listing (default: 90, scale 1-100)
  --min-imp N     Min importance for listing (default: 30)
  --limit N       Limit results (default: 20)

Examples:
  node scripts/page-improver.mjs --list --max-qual 3
  node scripts/page-improver.mjs economic-disruption
  node scripts/page-improver.mjs racing --info
`);
    return;
  }

  const pages = loadPages();

  // List mode
  if (args.includes('--list')) {
    const maxQualIdx = args.indexOf('--max-qual');
    const minImpIdx = args.indexOf('--min-imp');
    const limitIdx = args.indexOf('--limit');

    listPages(pages, {
      maxQuality: maxQualIdx >= 0 ? parseInt(args[maxQualIdx + 1]) : 90,
      minImportance: minImpIdx >= 0 ? parseInt(args[minImpIdx + 1]) : 30,
      limit: limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : 20
    });
    return;
  }

  // Page mode
  const pageQuery = args.find(a => !a.startsWith('--'));
  if (!pageQuery) {
    console.error('Error: No page ID provided');
    process.exit(1);
  }

  const page = findPage(pages, pageQuery);
  if (!page) {
    console.error(`Error: Page not found: ${pageQuery}`);
    console.log('Try: node scripts/page-improver.mjs --list');
    process.exit(1);
  }

  showPageInfo(page);

  if (args.includes('--info')) {
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
}

main();
