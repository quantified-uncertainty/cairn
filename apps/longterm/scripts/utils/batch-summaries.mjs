#!/usr/bin/env node

/**
 * Batch Summary Helper
 *
 * Outputs condensed info for N models at a time for manual summary writing.
 *
 * Usage:
 *   node scripts/batch-summaries.mjs 0      # Models 0-9
 *   node scripts/batch-summaries.mjs 1      # Models 10-19
 *   node scripts/batch-summaries.mjs 0 5    # Models 0-4 (batch size 5)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';

const MODELS_DIR = 'src/content/docs/knowledge-base/models';
const BATCH_NUM = parseInt(process.argv[2] || '0');
const BATCH_SIZE = parseInt(process.argv[3] || '10');

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try { return parseYaml(match[1]); } catch { return null; }
}

function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : content;
}

function findModelFiles(dir) {
  const results = [];
  for (const file of readdirSync(dir)) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    if (stat.isDirectory()) results.push(...findModelFiles(filePath));
    else if (file.endsWith('.mdx') && file !== 'index.mdx') results.push(filePath);
  }
  return results.sort();
}

function hasFindings(desc) {
  if (!desc) return false;
  return /(\d+\s*[-–]\s*\d+\s*%|\d+(\.\d+)?x|estimates?|projects?|finds?|by\s+20\d{2})/i.test(desc);
}

function extractKeyContent(body) {
  // Get Overview section
  const overviewMatch = body.match(/##\s+Overview\s*\n\n([\s\S]*?)(?=\n##\s|\n<|\n\n\n|$)/i);
  const overview = overviewMatch ? overviewMatch[1].slice(0, 600) : '';

  // Get any quantitative findings
  const findings = [];
  const patterns = [
    /(\d+\s*[-–]\s*\d+\s*%[^.]*\.)/g,
    /(\d+(\.\d+)?x\s+[^.]*\.)/g,
    /(estimates?\s+[^.]{20,80}\.)/gi,
    /(projects?\s+[^.]{20,80}\.)/gi,
  ];

  for (const p of patterns) {
    const matches = body.match(p);
    if (matches) findings.push(...matches.slice(0, 2));
  }

  return { overview: overview.replace(/\n/g, ' ').trim(), findings: [...new Set(findings)].slice(0, 3) };
}

// Main
const allFiles = findModelFiles(MODELS_DIR);
const needsUpdate = allFiles.filter(f => {
  const content = readFileSync(f, 'utf-8');
  const fm = extractFrontmatter(content);
  return fm && !hasFindings(fm.description);
});

const start = BATCH_NUM * BATCH_SIZE;
const batch = needsUpdate.slice(start, start + BATCH_SIZE);

console.log(`\n=== BATCH ${BATCH_NUM} (${start}-${start + batch.length - 1} of ${needsUpdate.length} needing updates) ===\n`);

for (const file of batch) {
  const content = readFileSync(file, 'utf-8');
  const fm = extractFrontmatter(content);
  const body = getBody(content);
  const { overview, findings } = extractKeyContent(body);
  const id = basename(file, '.mdx');

  console.log(`### ${id}`);
  console.log(`Title: ${fm.title}`);
  console.log(`Current: ${fm.description || '(none)'}`);
  console.log(`Overview: ${overview.slice(0, 300)}...`);
  if (findings.length) console.log(`Findings: ${findings.join(' | ')}`);
  console.log(`New: \n`);
  console.log('---\n');
}

console.log(`\nRemaining batches: ${Math.ceil((needsUpdate.length - start - BATCH_SIZE) / BATCH_SIZE)}`);
