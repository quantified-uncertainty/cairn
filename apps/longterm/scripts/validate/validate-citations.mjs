#!/usr/bin/env node

/**
 * Citation Validator
 *
 * Flags pages with low citation counts relative to their importance.
 * High-importance pages should have more citations to be credible.
 *
 * Usage:
 *   node scripts/validate/validate-citations.mjs
 *   node scripts/validate/validate-citations.mjs --min-importance 60
 *   node scripts/validate/validate-citations.mjs --min-citations 5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const CONTENT_DIR = path.join(ROOT, 'src/content/docs/knowledge-base');

// Parse args
const args = process.argv.slice(2);
const minImportance = args.includes('--min-importance')
  ? parseInt(args[args.indexOf('--min-importance') + 1])
  : 60;
const minCitations = args.includes('--min-citations')
  ? parseInt(args[args.indexOf('--min-citations') + 1])
  : 5;
const showAll = args.includes('--all');

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    // Simple YAML parsing for our needs
    const yaml = match[1];
    const result = {};

    // Extract importance
    const impMatch = yaml.match(/^importance:\s*([\d.]+)/m);
    if (impMatch) result.importance = parseFloat(impMatch[1]);

    // Extract quality
    const qualMatch = yaml.match(/^quality:\s*([\d.]+)/m);
    if (qualMatch) result.quality = parseFloat(qualMatch[1]);

    // Extract title
    const titleMatch = yaml.match(/^title:\s*["']?([^"'\n]+)["']?/m);
    if (titleMatch) result.title = titleMatch[1].trim();

    // Extract metrics.citations
    const citMatch = yaml.match(/citations:\s*(\d+)/);
    if (citMatch) result.citations = parseInt(citMatch[1]);

    return result;
  } catch {
    return {};
  }
}

function countCitations(content) {
  // Count <R id="..."> components
  const rComponents = (content.match(/<R\s+id=/g) || []).length;

  // Count markdown links [text](https://...)
  const mdLinks = (content.match(/\[[^\]]+\]\(https?:\/\/[^)]+\)/g) || []).length;

  return rComponents + mdLinks;
}

function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.endsWith('.mdx') && entry !== 'index.mdx') {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const fm = extractFrontmatter(content);
      const actualCitations = countCitations(content);

      // Use metrics.citations if available, otherwise count
      const citations = fm.citations ?? actualCitations;

      results.push({
        path: path.relative(ROOT, fullPath),
        title: fm.title || entry.replace('.mdx', ''),
        importance: fm.importance || 0,
        quality: fm.quality || 0,
        citations,
        actualCitations
      });
    }
  }

  return results;
}

function main() {
  console.log('\n📚 Citation Validator\n');
  console.log(`   Min importance: ${minImportance}`);
  console.log(`   Min citations required: ${minCitations}\n`);

  const pages = scanDirectory(CONTENT_DIR);

  // Filter to high-importance pages with low citations
  const lowCitation = pages
    .filter(p => p.importance >= minImportance)
    .filter(p => p.citations < minCitations)
    .sort((a, b) => b.importance - a.importance);

  if (lowCitation.length === 0) {
    console.log('✅ All high-importance pages have sufficient citations\n');
    return;
  }

  console.log(`⚠️  ${lowCitation.length} high-importance pages with <${minCitations} citations:\n`);
  console.log('| Imp | Cit | Title |');
  console.log('|-----|-----|-------|');

  const toShow = showAll ? lowCitation : lowCitation.slice(0, 20);

  for (const page of toShow) {
    console.log(`| ${page.importance.toFixed(0).padStart(3)} | ${String(page.citations).padStart(3)} | ${page.title.slice(0, 50)} |`);
  }

  if (!showAll && lowCitation.length > 20) {
    console.log(`\n   ... and ${lowCitation.length - 20} more (use --all to see all)`);
  }

  // Summary stats
  const avgCitations = pages.reduce((sum, p) => sum + p.citations, 0) / pages.length;
  const zeroCitations = pages.filter(p => p.citations === 0).length;

  console.log('\n📊 Summary:');
  console.log(`   Total pages: ${pages.length}`);
  console.log(`   Avg citations: ${avgCitations.toFixed(1)}`);
  console.log(`   Zero citations: ${zeroCitations}`);
  console.log(`   High-imp, low-cit: ${lowCitation.length}\n`);

  // Exit with error if there are issues
  if (lowCitation.length > 0) {
    process.exit(1);
  }
}

main();
