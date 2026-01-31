#!/usr/bin/env node
/**
 * Markdown List Validation Script
 *
 * Detects numbered lists that won't render correctly because they:
 * 1. Start with a number > 1
 * 2. Don't have a blank line before them
 *
 * In MDX/Markdown, lists starting with numbers other than 1 need a blank
 * line before them to be recognized as lists. Without it, they render
 * as inline text (all items on one line).
 *
 * Usage:
 *   node scripts/validate/validate-markdown-lists.mjs           # Check only
 *   node scripts/validate/validate-markdown-lists.mjs --verbose # Show context
 */

import { readFileSync, writeFileSync } from 'fs';
import { relative } from 'path';
import { ValidationEngine } from '../lib/validation-engine.mjs';
import { markdownListsRule } from '../lib/rules/markdown-lists.mjs';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const shouldFix = args.includes('--fix');
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

/**
 * Get the line number where frontmatter ends (0 if no frontmatter)
 */
function getFrontmatterEndLine(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return 0;

  let dashCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '---') {
      dashCount++;
      if (dashCount === 2) return i + 1; // Return 1-indexed line number
    }
  }
  return 0;
}

/**
 * Fix a file by adding blank lines before lists that need them
 */
function fixFile(filePath, issues) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // The validation engine reports line numbers relative to body (after frontmatter)
  // We need to add the frontmatter offset to get actual file line numbers
  const frontmatterEndLine = getFrontmatterEndLine(content);

  // Get line numbers that need a blank line inserted before them
  // Issues report body line numbers, so we add frontmatter offset
  const linesToFix = issues
    .map(i => i.line + frontmatterEndLine)
    .sort((a, b) => b - a); // Sort descending to fix from bottom

  for (const lineNum of linesToFix) {
    const index = lineNum - 1; // Convert to 0-indexed
    // Insert blank line before this line
    lines.splice(index, 0, '');
  }

  const fixedContent = lines.join('\n');
  if (fixedContent !== content) {
    writeFileSync(filePath, fixedContent);
    return true;
  }
  return false;
}

async function main() {
  console.log(`${colors.blue}Checking MDX files for markdown list issues...${colors.reset}\n`);

  // Use unified validation engine
  const engine = new ValidationEngine();
  engine.addRule(markdownListsRule);
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
      if (fixFile(file, fileIssues)) {
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
        console.log(`  ${colors.yellow}⚠ Line ${issue.line}${colors.reset}: ${issue.message.split('.')[0]}`);
        if (verbose) {
          console.log(`    ${colors.dim}${issue.message}${colors.reset}`);
        }
      }
      console.log();
    }

    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.yellow}${issues.length} markdown list issues in ${issuesByFile.size} files${colors.reset}`);
    console.log(`  ${colors.dim}These lists won't render correctly - they'll appear as inline text${colors.reset}`);
    console.log(`  ${colors.dim}Run with --fix to auto-fix by adding blank lines${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.bold}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ No markdown list issues found${colors.reset}`);
  }
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
