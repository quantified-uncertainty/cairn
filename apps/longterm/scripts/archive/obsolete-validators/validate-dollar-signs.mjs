#!/usr/bin/env node
/**
 * Dollar Sign Validation Script
 *
 * Thin wrapper around the unified validation engine's dollar-signs rule.
 * Provides backwards compatibility with existing npm scripts.
 *
 * Detects:
 * 1. Unescaped $ before numbers - parsed as LaTeX math by KaTeX
 * 2. Double-escaped \\$ in body - renders as \$ with visible backslash
 *
 * Usage:
 *   node scripts/validate/validate-dollar-signs.mjs           # Check only
 *   node scripts/validate/validate-dollar-signs.mjs --fix     # Fix issues
 *   node scripts/validate/validate-dollar-signs.mjs --verbose # Show all matches
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { ValidationEngine } from '../lib/validation-engine.mjs';
import { dollarSignsRule } from '../lib/rules/dollar-signs.mjs';

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

function getFrontmatterEndLine(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return 0;

  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      dashCount++;
      if (dashCount === 2) return i;
    }
  }
  return 0;
}

function fixFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const frontmatterEnd = getFrontmatterEndLine(content);

  const fixedLines = lines.map((line, i) => {
    // Skip frontmatter
    if (i <= frontmatterEnd) return line;

    let fixed = line;

    // Replace unescaped $ before numbers
    fixed = fixed.replace(/(?<!\\)(?<!`[^`]*)\$(\d)/g, '\\$$1');

    // Replace double-escaped \\$ with single-escaped \$
    fixed = fixed.replace(/\\\\\$/g, '\\$');

    return fixed;
  });

  const fixedContent = fixedLines.join('\n');

  if (fixedContent !== content) {
    writeFileSync(filePath, fixedContent);
    return true;
  }
  return false;
}

async function main() {
  console.log(`${colors.blue}Checking MDX files for dollar sign issues...${colors.reset}\n`);

  // Use unified validation engine
  const engine = new ValidationEngine();
  engine.addRule(dollarSignsRule);
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

  let filesFixed = 0;

  if (shouldFix && issues.length > 0) {
    // Fix mode
    for (const [file, fileIssues] of issuesByFile) {
      if (fixFile(file)) {
        filesFixed++;
        const relPath = relative(process.cwd(), file);
        console.log(`${colors.green}✓ Fixed:${colors.reset} ${relPath} (${fileIssues.length} issues)`);
      }
    }

    console.log(`\n${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ Fixed ${issues.length} issues in ${filesFixed} files${colors.reset}`);
  } else if (issues.length > 0) {
    // Report mode
    for (const [file, fileIssues] of issuesByFile) {
      const relPath = relative(process.cwd(), file);
      console.log(`${colors.bold}${relPath}${colors.reset}`);

      for (const issue of fileIssues) {
        const isDoubleEscaped = issue.message.includes('Double-escaped');
        const typeLabel = isDoubleEscaped ? 'double-escaped \\\\$' : 'unescaped $';
        console.log(`  ${colors.yellow}⚠ Line ${issue.line} (${typeLabel})${colors.reset}`);
        if (verbose) {
          console.log(`    ${colors.dim}${issue.message}${colors.reset}`);
        }
      }
      console.log();
    }

    const unescapedCount = issues.filter(i => !i.message.includes('Double-escaped')).length;
    const doubleEscapedCount = issues.filter(i => i.message.includes('Double-escaped')).length;

    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.yellow}${issues.length} dollar sign issues in ${issuesByFile.size} files${colors.reset}`);
    if (unescapedCount > 0) console.log(`    - ${unescapedCount} unescaped (renders as LaTeX)`);
    if (doubleEscapedCount > 0) console.log(`    - ${doubleEscapedCount} double-escaped (renders with visible backslash)`);
    console.log(`  ${colors.dim}Run with --fix to auto-fix${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ No dollar sign issues found${colors.reset}`);
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
