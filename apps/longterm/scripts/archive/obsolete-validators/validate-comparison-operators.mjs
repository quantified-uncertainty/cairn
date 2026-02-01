#!/usr/bin/env node
/**
 * Comparison Operators Validation Script
 *
 * Thin wrapper around the unified validation engine's comparison-operators rule.
 * Provides backwards compatibility with existing npm scripts and --fix mode.
 *
 * Less-than (<) followed by numbers/letters gets parsed as JSX tags in MDX,
 * causing build failures. These need to be escaped as &lt;
 *
 * Usage:
 *   node scripts/validate-comparison-operators.mjs           # Check only
 *   node scripts/validate-comparison-operators.mjs --fix     # Fix issues
 *   node scripts/validate-comparison-operators.mjs --verbose # Show all matches
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ValidationEngine } from '../lib/validation-engine.mjs';
import { comparisonOperatorsRule } from '../lib/rules/comparison-operators.mjs';
import { getFrontmatterEndLine } from '../lib/mdx-utils.mjs';

const CONTENT_DIR = 'src/content/docs';
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const verbose = args.includes('--verbose');
const CI_MODE = args.includes('--ci');

// Color codes (disabled in CI mode)
const colors = CI_MODE ? {
  red: '', green: '', yellow: '', blue: '', cyan: '', reset: '', dim: '', bold: ''
} : {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function getAllMdxFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllMdxFiles(fullPath));
    } else if (entry.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const frontmatterEnd = getFrontmatterEndLine(content);

  let fixCount = 0;
  const fixedLines = lines.map((line, i) => {
    // Skip frontmatter
    if (i <= frontmatterEnd) return line;

    // Replace < before digits/dollar signs, but not in code blocks or valid tags
    // This is a simplified fix - complex cases may need manual review
    let fixed = line;

    // Replace <NUMBER patterns (not already &lt; and not valid HTML tags)
    fixed = fixed.replace(/(?<!&lt)(?<![a-zA-Z])<(\d)/g, (match, digit) => {
      fixCount++;
      return '&lt;' + digit;
    });

    // Replace <\$NUMBER patterns (escaped dollar signs)
    fixed = fixed.replace(/(?<!&lt)<(\\?\$\d)/g, (match, rest) => {
      fixCount++;
      return '&lt;' + rest;
    });

    return fixed;
  });

  const fixedContent = fixedLines.join('\n');

  if (fixedContent !== content) {
    writeFileSync(filePath, fixedContent);
    return fixCount;
  }
  return 0;
}

async function main() {
  console.log(`${colors.blue}Checking MDX files for unescaped comparison operators...${colors.reset}\n`);

  // Use unified validation engine for detection
  const engine = new ValidationEngine();
  engine.addRule(comparisonOperatorsRule);
  await engine.load();

  const issues = await engine.validate();

  // Group issues by file
  const issuesByFile = new Map();
  for (const issue of issues) {
    if (!issuesByFile.has(issue.file)) {
      issuesByFile.set(issue.file, []);
    }
    issuesByFile.get(issue.file).push(issue);
  }

  let totalFixed = 0;

  if (shouldFix && issues.length > 0) {
    // Fix mode
    for (const [file, fileIssues] of issuesByFile) {
      const fixed = fixFile(file);
      if (fixed > 0) {
        totalFixed += fixed;
        const relPath = relative(process.cwd(), file);
        console.log(`${colors.green}✓ Fixed:${colors.reset} ${relPath} (${fixed} issues)`);
      }
    }

    console.log(`\n${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ Fixed ${totalFixed} issues across ${issuesByFile.size} files${colors.reset}`);
  } else if (issues.length > 0) {
    // Report mode
    for (const [file, fileIssues] of issuesByFile) {
      const relPath = relative(process.cwd(), file);
      console.log(`${colors.bold}${relPath}${colors.reset}`);

      for (const issue of fileIssues) {
        console.log(`  ${colors.yellow}⚠ Line ${issue.line}${colors.reset}`);
        if (verbose) {
          console.log(`    ${colors.dim}${issue.message}${colors.reset}`);
        }
      }
      console.log();
    }

    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.yellow}${issues.length} unescaped comparison operators in ${issuesByFile.size} files${colors.reset}`);
    console.log(`  ${colors.dim}Run with --fix to auto-fix${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ No unescaped comparison operators found${colors.reset}`);
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
