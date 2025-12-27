#!/usr/bin/env node

/**
 * Generate Model Summaries
 *
 * Extracts key findings from model content and generates draft summaries.
 * Outputs to a JSON file that can be reviewed and applied.
 *
 * Usage:
 *   node scripts/generate-model-summaries.mjs           # Generate drafts
 *   node scripts/generate-model-summaries.mjs --apply   # Apply reviewed drafts
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const MODELS_DIR = 'src/content/docs/knowledge-base/models';
const DRAFTS_FILE = 'scripts/summary-drafts.json';
const APPLY_MODE = process.argv.includes('--apply');

// Patterns that indicate findings
const FINDING_PATTERNS = [
  /\b(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*%/g,  // "10-30%"
  /\b(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)x\b/g,   // "1.5-3x"
  /\bby\s+20\d{2}\b/gi,                                // "by 2030"
  /\b20\d{2}\s*[-–]\s*20\d{2}\b/g,                    // "2025-2030"
  /\bestimates?\s+(?:that\s+)?/gi,
  /\bprojects?\s+(?:that\s+)?/gi,
  /\bfinds?\s+(?:that\s+)?/gi,
  /\bsuggests?\s+(?:that\s+)?/gi,
  /\bkey\s+(?:variable|factor|driver|uncertainty)/gi,
  /\bcritical\s+(?:variable|factor|threshold)/gi,
  /\bhigh\s+(?:variance|uncertainty)/gi,
];

/**
 * Extract frontmatter from MDX content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  try {
    return parseYaml(match[1]);
  } catch {
    return null;
  }
}

/**
 * Get content body without frontmatter
 */
function getBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : content;
}

/**
 * Extract sentences containing findings
 */
function extractFindingSentences(text) {
  // Remove markdown formatting
  const clean = text
    .replace(/^import\s+.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  // Split into sentences
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [];

  // Find sentences with finding patterns
  const findings = [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 20 || trimmed.length > 300) continue;

    for (const pattern of FINDING_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex
      if (pattern.test(trimmed)) {
        findings.push(trimmed);
        break;
      }
    }
  }

  return findings.slice(0, 5); // Max 5 findings
}

/**
 * Check if description already has findings
 */
function hasFindings(description) {
  if (!description) return false;
  const patterns = [
    /\d+\s*[-–]\s*\d+\s*%/,
    /\d+(\.\d+)?x/,
    /\bestimates?\b/i,
    /\bprojects?\b/i,
    /\bfinds?\b/i,
    /\bkey\s+(variable|factor)/i,
    /\bby\s+20\d{2}/i,
  ];
  return patterns.some(p => p.test(description));
}

/**
 * Generate a draft summary from findings
 */
function generateDraft(title, currentDesc, findings, firstParagraph) {
  // If already has findings, keep it
  if (hasFindings(currentDesc)) {
    return { draft: currentDesc, status: 'ok', reason: 'Already has findings' };
  }

  // Try to construct from findings
  if (findings.length > 0) {
    // Take first finding that seems substantive
    const bestFinding = findings.find(f =>
      /\d/.test(f) || /key|critical|significant/i.test(f)
    ) || findings[0];

    // Construct draft
    const methodology = currentDesc || `This model analyzes ${title.toLowerCase().replace(' model', '')}`;
    const draft = `${methodology.replace(/\.$/, '')}. ${bestFinding}`;

    return {
      draft: draft.length > 300 ? draft.substring(0, 297) + '...' : draft,
      status: 'needs_review',
      reason: 'Auto-generated from content',
      findings
    };
  }

  // No findings found - needs manual review
  return {
    draft: currentDesc,
    status: 'needs_manual',
    reason: 'No quantified findings found in content',
    firstParagraph: firstParagraph?.substring(0, 200)
  };
}

/**
 * Find all model MDX files
 */
function findModelFiles(dir) {
  const results = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...findModelFiles(filePath));
    } else if (file.endsWith('.mdx') && file !== 'index.mdx') {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Get first paragraph from body
 */
function getFirstParagraph(body) {
  // Find content after first ## heading
  const match = body.match(/^##[^#].*?\n\n([\s\S]*?)(?=\n\n|$)/m);
  if (match) {
    return match[1].replace(/\n/g, ' ').trim();
  }
  return null;
}

/**
 * Generate drafts for all models
 */
function generateDrafts() {
  const modelFiles = findModelFiles(MODELS_DIR);
  const drafts = {};

  let ok = 0, needsReview = 0, needsManual = 0;

  for (const file of modelFiles) {
    const content = readFileSync(file, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    const body = getBody(content);
    const id = basename(file, '.mdx');

    if (!frontmatter) continue;

    const findings = extractFindingSentences(body);
    const firstPara = getFirstParagraph(body);
    const result = generateDraft(
      frontmatter.title || id,
      frontmatter.description,
      findings,
      firstPara
    );

    drafts[id] = {
      title: frontmatter.title,
      current: frontmatter.description,
      ...result
    };

    if (result.status === 'ok') ok++;
    else if (result.status === 'needs_review') needsReview++;
    else needsManual++;
  }

  writeFileSync(DRAFTS_FILE, JSON.stringify(drafts, null, 2));

  console.log(`Generated drafts for ${Object.keys(drafts).length} models`);
  console.log(`  ✓ Already good: ${ok}`);
  console.log(`  ⚠ Needs review: ${needsReview}`);
  console.log(`  ✗ Needs manual: ${needsManual}`);
  console.log(`\nDrafts written to: ${DRAFTS_FILE}`);
  console.log('Review and edit the file, then run with --apply');
}

/**
 * Apply reviewed drafts
 */
function applyDrafts() {
  if (!existsSync(DRAFTS_FILE)) {
    console.error(`No drafts file found: ${DRAFTS_FILE}`);
    process.exit(1);
  }

  const drafts = JSON.parse(readFileSync(DRAFTS_FILE, 'utf-8'));
  let updated = 0;

  for (const [id, data] of Object.entries(drafts)) {
    if (data.status === 'ok') continue;
    if (!data.draft || data.draft === data.current) continue;

    const filePath = join(MODELS_DIR, `${id}.mdx`);
    if (!existsSync(filePath)) {
      // Try subdirectories
      const found = findModelFiles(MODELS_DIR).find(f => basename(f, '.mdx') === id);
      if (!found) {
        console.log(`⚠ File not found: ${id}`);
        continue;
      }
    }

    const actualPath = existsSync(filePath) ? filePath :
      findModelFiles(MODELS_DIR).find(f => basename(f, '.mdx') === id);

    if (!actualPath) continue;

    const content = readFileSync(actualPath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (frontmatter.description === data.draft) continue;

    // Update frontmatter
    const oldDesc = frontmatter.description || '';
    const newContent = content.replace(
      /^(---\n[\s\S]*?description:\s*)(["']?)([^"'\n]*(?:\n(?!---)[^\n]*)*)(["']?)(\n[\s\S]*?---)$/m,
      (match, pre, q1, desc, q2, post) => {
        return `${pre}"${data.draft.replace(/"/g, '\\"')}"${post}`;
      }
    );

    if (newContent !== content) {
      writeFileSync(actualPath, newContent);
      console.log(`✓ ${id}`);
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} files`);
  console.log('Run npm run sync:descriptions && npm run build:data to sync');
}

// Main
if (APPLY_MODE) {
  applyDrafts();
} else {
  generateDrafts();
}
