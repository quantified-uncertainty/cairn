#!/usr/bin/env node
/**
 * Auto-fix script for prefer-entitylink rule
 *
 * Converts internal markdown links to EntityLink components:
 * [text](/knowledge-base/path/) → <EntityLink id="path">text</EntityLink>
 *
 * Usage:
 *   node scripts/validate/fix-prefer-entitylink.mjs           # Dry run
 *   node scripts/validate/fix-prefer-entitylink.mjs --apply   # Apply fixes
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const CONTENT_DIR = 'src/content/docs';
const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');
const verbose = args.includes('--verbose');

// Internal paths that should use EntityLink
const INTERNAL_PATH_PATTERNS = [
  /^\/knowledge-base\//,
  /^\/responses\//,
  /^\/risks\//,
  /^\/organizations\//,
  /^\/people\//,
  /^\/capabilities\//,
  /^\/metrics\//,
  /^\/debates\//,
];

// Colors for output
const colors = {
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
    } else if (entry.endsWith('.mdx') || entry.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function suggestEntityId(path) {
  // Remove leading slash and trailing slash
  let id = path.replace(/^\//, '').replace(/\/$/, '');
  // Remove knowledge-base prefix if present
  id = id.replace(/^knowledge-base\//, '');
  return id;
}

function isInCodeBlock(content, position) {
  const before = content.slice(0, position);
  const tripleBackticks = (before.match(/```/g) || []).length;
  return tripleBackticks % 2 === 1;
}

function shouldSkipFile(filePath) {
  // Skip internal documentation
  if (filePath.includes('/internal/')) return true;
  return false;
}

function hasEntityLinkImport(content) {
  return /import\s*\{[^}]*EntityLink[^}]*\}\s*from\s*['"][^'"]*wiki['"]/.test(content);
}

function addEntityLinkImport(content, filePath) {
  // Use path alias for clean imports
  const importPath = '@components/wiki';

  // Check if there's already a wiki import
  const wikiImportMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*wiki)['"]/);

  if (wikiImportMatch) {
    // Add EntityLink to existing import
    const existingImports = wikiImportMatch[1];
    if (!existingImports.includes('EntityLink')) {
      const newImports = existingImports.trim() + ', EntityLink';
      return content.replace(wikiImportMatch[0], `import {${newImports}} from '${wikiImportMatch[2]}'`);
    }
    return content;
  }

  // Add new import after frontmatter
  const frontmatterEnd = content.indexOf('---', 3);
  if (frontmatterEnd !== -1) {
    const afterFrontmatter = frontmatterEnd + 3;
    const importStatement = `\nimport {EntityLink} from '${importPath}';\n`;
    return content.slice(0, afterFrontmatter) + importStatement + content.slice(afterFrontmatter);
  }

  return content;
}

function fixFile(filePath) {
  if (shouldSkipFile(filePath)) return { fixed: 0, skipped: true };

  let content = readFileSync(filePath, 'utf-8');
  let fixCount = 0;
  let needsImport = false;

  // Match markdown links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const fixedContent = content.replace(linkRegex, (match, text, href, offset) => {
    // Skip if in code block
    if (isInCodeBlock(content, offset)) return match;

    // Check if this is an internal path
    const cleanHref = href.split('#')[0].split('?')[0];
    const isInternalPath = INTERNAL_PATH_PATTERNS.some(pattern => pattern.test(cleanHref));

    if (!isInternalPath) return match;

    const entityId = suggestEntityId(cleanHref);
    fixCount++;
    needsImport = true;

    return `<EntityLink id="${entityId}">${text}</EntityLink>`;
  });

  if (fixCount === 0) return { fixed: 0, skipped: false };

  // Add import if needed
  let finalContent = fixedContent;
  if (needsImport && !hasEntityLinkImport(fixedContent)) {
    finalContent = addEntityLinkImport(fixedContent, filePath);
  }

  if (shouldApply) {
    writeFileSync(filePath, finalContent);
  }

  return { fixed: fixCount, skipped: false, content: finalContent };
}

async function main() {
  console.log(`${colors.blue}Converting markdown links to EntityLink components...${colors.reset}\n`);

  if (!shouldApply) {
    console.log(`${colors.yellow}Dry run mode - use --apply to make changes${colors.reset}\n`);
  }

  const files = getAllMdxFiles(CONTENT_DIR);
  let totalFixed = 0;
  let filesModified = 0;
  let filesSkipped = 0;

  for (const file of files) {
    const result = fixFile(file);

    if (result.skipped) {
      filesSkipped++;
      continue;
    }

    if (result.fixed > 0) {
      totalFixed += result.fixed;
      filesModified++;
      const relPath = relative(process.cwd(), file);

      if (shouldApply) {
        console.log(`${colors.green}✓ Fixed:${colors.reset} ${relPath} (${result.fixed} links)`);
      } else {
        console.log(`${colors.yellow}Would fix:${colors.reset} ${relPath} (${result.fixed} links)`);
      }
    }
  }

  console.log(`\n${colors.bold}Summary:${colors.reset}`);
  console.log(`  Files scanned: ${files.length}`);
  console.log(`  Files skipped (internal): ${filesSkipped}`);
  console.log(`  Files ${shouldApply ? 'modified' : 'to modify'}: ${filesModified}`);
  console.log(`  Links ${shouldApply ? 'converted' : 'to convert'}: ${totalFixed}`);

  if (!shouldApply && totalFixed > 0) {
    console.log(`\n${colors.dim}Run with --apply to make changes${colors.reset}`);
  }
}

main().catch(err => {
  console.error('Fix failed:', err);
  process.exit(1);
});
