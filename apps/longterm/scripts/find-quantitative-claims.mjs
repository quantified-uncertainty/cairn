#!/usr/bin/env node

/**
 * Find Quantitative Claims Script
 *
 * Scans MDX content for numbers, percentages, dollar amounts, and other
 * quantitative claims that could be extracted as insights.
 *
 * Usage: node scripts/find-quantitative-claims.mjs [--output path]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple recursive file finder
function findFiles(dir, pattern, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      findFiles(filePath, pattern, results);
    } else if (file.name.endsWith(pattern)) {
      results.push(filePath);
    }
  }
  return results;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../src/content/docs');
const OUTPUT_PATH =
  process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : path.join(__dirname, '../src/data/generated/quantitative-claims.json');

// Patterns to search for quantitative claims
const PATTERNS = [
  {
    name: 'percentage',
    regex: /(\d{1,3}(?:\.\d+)?%|\d{1,3}(?:\.\d+)?(?:-\d{1,3}(?:\.\d+)?)?%)/g,
    description: 'Percentages (e.g., 40%, 30-50%)',
  },
  {
    name: 'dollar',
    regex: /\$[\d,]+(?:\.\d+)?(?:\s*(?:billion|million|trillion|B|M|K|T))?/gi,
    description: 'Dollar amounts (e.g., $1B, $10 million)',
  },
  {
    name: 'researcher_count',
    regex: /(\d{1,6})\s*(?:researchers|scientists|engineers|people|experts|workers|employees)/gi,
    description: 'Counts of people (e.g., 500 researchers)',
  },
  {
    name: 'timeline',
    regex: /(?:by |in |around |before |after |within )?(20[2-4]\d|2[1-9]\d{2}|in \d{1,3} years?)/gi,
    description: 'Timeline predictions (e.g., by 2030, in 5 years)',
  },
  {
    name: 'multiplier',
    regex: /(\d+(?:\.\d+)?[xX]|\d+(?:\.\d+)?-fold|\d+(?:\.\d+)? times)/g,
    description: 'Multipliers (e.g., 10x, 3-fold)',
  },
  {
    name: 'probability',
    regex: /(\d{1,3}(?:\.\d+)?%?\s*(?:probability|chance|likelihood|risk))/gi,
    description: 'Probability statements',
  },
  {
    name: 'large_number',
    regex: /(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?\s*(?:billion|million|trillion))/gi,
    description: 'Large numbers',
  },
];

// Words that indicate important context
const IMPORTANCE_INDICATORS = [
  'catastrophic',
  'existential',
  'critical',
  'significant',
  'majority',
  'most',
  'unprecedented',
  'surprising',
  'contrary',
  'unexpected',
  'only',
  'merely',
  'just',
  'as much as',
  'up to',
  'at least',
  'no more than',
  'fewer than',
];

function extractContext(content, match, matchIndex) {
  // Get surrounding context (sentence or nearby text)
  const beforeChars = 100;
  const afterChars = 100;

  const start = Math.max(0, matchIndex - beforeChars);
  const end = Math.min(content.length, matchIndex + match.length + afterChars);

  let context = content.slice(start, end);

  // Clean up context
  context = context
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Add ellipsis if truncated
  if (start > 0) context = '...' + context;
  if (end < content.length) context = context + '...';

  return context;
}

function hasImportanceIndicator(context) {
  const lowerContext = context.toLowerCase();
  return IMPORTANCE_INDICATORS.some((indicator) => lowerContext.includes(indicator));
}

function findClaimsInFile(filePath, content) {
  const claims = [];
  const relativePath = path.relative(CONTENT_DIR, filePath);

  // Skip files that are just tables or lists
  const lines = content.split('\n');

  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

    while ((match = regex.exec(content)) !== null) {
      const context = extractContext(content, match[0], match.index);

      // Calculate line number
      const lineNumber = content.slice(0, match.index).split('\n').length;

      // Skip if inside a code block or frontmatter
      const lineContent = lines[lineNumber - 1] || '';
      if (
        lineContent.trim().startsWith('```') ||
        lineContent.trim().startsWith('---') ||
        lineContent.trim().startsWith('import ') ||
        lineContent.trim().startsWith('export ')
      ) {
        continue;
      }

      // Skip very common/uninteresting patterns
      if (
        match[0] === '100%' ||
        match[0] === '0%' ||
        match[0] === '$0' ||
        /^\d{4}$/.test(match[0]) // Just a year alone
      ) {
        continue;
      }

      claims.push({
        text: match[0],
        type: pattern.name,
        filePath: relativePath,
        lineNumber,
        context,
        hasImportanceIndicator: hasImportanceIndicator(context),
      });
    }
  }

  return claims;
}

async function main() {
  console.log('Scanning for quantitative claims...\n');

  // Find all MDX files
  const allFiles = findFiles(CONTENT_DIR, '.mdx');
  const files = allFiles.map(f => path.relative(CONTENT_DIR, f));
  console.log(`Found ${files.length} MDX files\n`);

  const allClaims = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const claims = findClaimsInFile(filePath, content);
    allClaims.push(...claims);
  }

  // Sort by importance indicator, then by type
  allClaims.sort((a, b) => {
    if (a.hasImportanceIndicator !== b.hasImportanceIndicator) {
      return b.hasImportanceIndicator ? 1 : -1;
    }
    return a.type.localeCompare(b.type);
  });

  // Group by type for stats
  const byType = {};
  for (const claim of allClaims) {
    byType[claim.type] = (byType[claim.type] || 0) + 1;
  }

  console.log('Claims found by type:');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`\nTotal: ${allClaims.length}`);
  console.log(`With importance indicators: ${allClaims.filter((c) => c.hasImportanceIndicator).length}`);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  const output = {
    generatedAt: new Date().toISOString(),
    totalClaims: allClaims.length,
    byType,
    claims: allClaims,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWritten to: ${OUTPUT_PATH}`);
}

main().catch(console.error);
