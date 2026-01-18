#!/usr/bin/env node

/**
 * Content Schema Validation Script
 *
 * Validates that MDX content follows expected schema rules:
 * - No duplicate PageStatus components (frontmatter auto-generates one)
 * - Required frontmatter fields
 * - Valid frontmatter values
 *
 * Usage: node scripts/validate-content-schema.mjs [--ci]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const CONTENT_DIR = 'src/content/docs';
const CI_MODE = process.argv.includes('--ci');

const colors = CI_MODE ? {
  red: '', green: '', yellow: '', blue: '', dim: '', bold: '', reset: ''
} : {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function findMdxFiles(dir, results = []) {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        findMdxFiles(filePath, results);
      } else if (file.endsWith('.mdx')) {
        results.push(filePath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const issues = [];
  const isKnowledgeBase = filePath.includes('/knowledge-base/');

  // Check 1: Duplicate PageStatus (explicit component + frontmatter quality)
  const frontmatter = parseFrontmatter(content);
  const hasExplicitPageStatus = /<PageStatus\s/.test(content);
  const hasFrontmatterQuality = frontmatter.quality !== undefined;

  if (hasExplicitPageStatus && hasFrontmatterQuality && isKnowledgeBase) {
    const lineMatch = content.match(/<PageStatus\s/);
    const lineNum = lineMatch ? content.substring(0, lineMatch.index).split('\n').length : 0;
    issues.push({
      id: 'duplicate-page-status',
      description: 'Both explicit <PageStatus> and frontmatter quality defined (causes duplicate display)',
      severity: 'error',
      fix: 'Remove explicit <PageStatus> component and use frontmatter for all metadata',
      line: lineNum,
      lineContent: '<PageStatus ...>',
    });
  }

  // Check 2: PageStatus without devOnly in knowledge base (will show always, not just dev mode)
  if (hasExplicitPageStatus && isKnowledgeBase) {
    const explicitMatch = content.match(/<PageStatus[^>]*>/);
    if (explicitMatch && !explicitMatch[0].includes('devOnly')) {
      const lineNum = content.substring(0, explicitMatch.index).split('\n').length;
      issues.push({
        id: 'page-status-always-visible',
        description: 'Explicit <PageStatus> without devOnly will always show (not dev mode only)',
        severity: 'warning',
        fix: 'Add devOnly={true} or remove explicit component and use frontmatter',
        line: lineNum,
        lineContent: explicitMatch[0].substring(0, 60) + '...',
      });
    }
  }

  // Check 3: Knowledge base page without quality rating
  if (isKnowledgeBase && !hasFrontmatterQuality && !hasExplicitPageStatus) {
    // Skip style guides and index pages
    const isStyleGuide = filePath.includes('/style-guides/');
    const isIndex = filePath.endsWith('index.mdx');
    if (!isStyleGuide && !isIndex) {
      issues.push({
        id: 'missing-quality',
        description: 'Knowledge base page without quality rating',
        severity: 'info',
        fix: 'Add quality: N (1-5) to frontmatter',
        line: 1,
        lineContent: 'frontmatter',
      });
    }
  }

  // Check 4: Invalid quality value
  if (hasFrontmatterQuality) {
    const quality = parseInt(frontmatter.quality);
    if (isNaN(quality) || quality < 1 || quality > 5) {
      issues.push({
        id: 'invalid-quality',
        description: `Invalid quality value: ${frontmatter.quality} (must be 1-5)`,
        severity: 'error',
        fix: 'Set quality to a number between 1 and 5',
        line: 1,
        lineContent: `quality: ${frontmatter.quality}`,
      });
    }
  }

  return issues;
}

function main() {
  const files = findMdxFiles(CONTENT_DIR);
  const allIssues = [];
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  if (!CI_MODE) {
    console.log(`${colors.blue}Checking ${files.length} MDX files for schema compliance...${colors.reset}\n`);
  }

  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
      for (const issue of issues) {
        if (issue.severity === 'error') errorCount++;
        else if (issue.severity === 'warning') warningCount++;
        else infoCount++;
      }
    }
  }

  if (CI_MODE) {
    console.log(JSON.stringify({
      files: files.length,
      errors: errorCount,
      warnings: warningCount,
      infos: infoCount,
      issues: allIssues,
    }, null, 2));
  } else {
    if (allIssues.length === 0) {
      console.log(`${colors.green}✓ All files pass schema validation${colors.reset}\n`);
    } else {
      for (const { file, issues } of allIssues) {
        const relPath = file.replace(process.cwd() + '/', '');
        console.log(`${colors.bold}${relPath}${colors.reset}`);

        for (const issue of issues) {
          let icon;
          if (issue.severity === 'error') icon = `${colors.red}✗`;
          else if (issue.severity === 'warning') icon = `${colors.yellow}⚠`;
          else icon = `${colors.blue}ℹ`;
          console.log(`  ${icon} Line ${issue.line}: ${issue.description}${colors.reset}`);
          console.log(`    ${colors.dim}${issue.lineContent}${colors.reset}`);
          console.log(`    ${colors.blue}Fix: ${issue.fix}${colors.reset}`);
        }
        console.log();
      }

      console.log(`${colors.bold}Summary:${colors.reset}`);
      if (errorCount > 0) {
        console.log(`  ${colors.red}${errorCount} error(s)${colors.reset}`);
      }
      if (warningCount > 0) {
        console.log(`  ${colors.yellow}${warningCount} warning(s)${colors.reset}`);
      }
      if (infoCount > 0) {
        console.log(`  ${colors.blue}${infoCount} info(s)${colors.reset}`);
      }
      console.log();
    }
  }

  // Exit with error code if there are errors
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
