#!/usr/bin/env node

/**
 * Validator: Discourage EstimateBox Component Usage
 *
 * EstimateBox components often result in incomplete, awkward presentations
 * with cryptic notes. This validator flags their usage and recommends
 * markdown tables instead.
 *
 * POLICY: New content should use markdown tables with detailed reasoning columns
 * instead of EstimateBox components.
 */

import { readFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { findMdxFiles } from '../lib/file-utils.mjs';
import { getColors, isCI } from '../lib/output.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '../..', 'src/content/docs');
const { red, yellow, green, bold, dim, reset } = getColors();

function validateEstimateBoxes() {
  const mdxFiles = findMdxFiles(CONTENT_DIR);
  const errors = [];
  const warnings = [];

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const relPath = relative(process.cwd(), filePath);

    // Skip internal documentation (these may have examples)
    if (relPath.includes('/internal/')) continue;

    // Check for EstimateBox usage
    if (content.includes('EstimateBox')) {
      const lines = content.split('\n');
      const usageLines = [];

      lines.forEach((line, idx) => {
        if (line.includes('EstimateBox')) {
          usageLines.push(idx + 1);
        }
      });

      warnings.push({
        file: relPath,
        lines: usageLines,
        message: 'EstimateBox component discouraged - use markdown tables instead'
      });
    }

    // Check for EstimateBox in imports (indicates usage even if component not visible)
    const importMatch = content.match(/import\s*\{[^}]*EstimateBox[^}]*\}/);
    if (importMatch && !content.includes('<EstimateBox')) {
      errors.push({
        file: relPath,
        message: 'EstimateBox imported but not used (dead import)'
      });
    }
  }

  // Report results
  console.log(`${bold}\n📊 EstimateBox Usage Validation\n${reset}`);

  if (errors.length > 0) {
    console.log(`${red}✗ ${errors.length} error(s) found:\n${reset}`);
    errors.forEach(err => {
      console.log(`${red}  ${err.file}${reset}`);
      console.log(`${dim}    ${err.message}${reset}`);
    });
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${yellow}⚠ ${warnings.length} warning(s) found:\n${reset}`);
    warnings.forEach(warn => {
      console.log(`${yellow}  ${warn.file}:${warn.lines.join(',')}${reset}`);
      console.log(`${dim}    ${warn.message}${reset}`);
      console.log(`${dim}    Recommendation: Convert to markdown table with | Expert | Estimate | Reasoning | columns${reset}`);
    });
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`${green}✓ No EstimateBox usage found\n${reset}`);
    return 0;
  }

  // Help text
  if (warnings.length > 0) {
    console.log(`${bold}WHY THIS MATTERS:${reset}`);
    console.log(`${dim}  EstimateBox components often result in:${reset}`);
    console.log(`${dim}  - Brief, cryptic notes instead of full explanations${reset}`);
    console.log(`${dim}  - Awkward UI presentation that feels incomplete${reset}`);
    console.log(`${dim}  - Difficult to maintain and extend${reset}`);
    console.log();
    console.log(`${bold}BETTER APPROACH:${reset}`);
    console.log(`${dim}  Use markdown tables with a "Reasoning" column:${reset}`);
    console.log();
    console.log(`${dim}  | Expert/Source | Estimate | Reasoning |${reset}`);
    console.log(`${dim}  |---------------|----------|-----------|${reset}`);
    console.log(`${dim}  | Joe Carlsmith | ~25% | Full explanation of the estimate... |${reset}`);
    console.log();
    console.log(`${dim}  See apps/longterm/src/content/docs/knowledge-base/risks/accident/scheming.mdx${reset}`);
    console.log(`${dim}  for examples of properly converted tables.${reset}`);
    console.log();
    console.log(`${bold}TO FIX:${reset}`);
    console.log(`${dim}  Run: node scripts/analyze-estimate-boxes.mjs${reset}`);
    console.log(`${dim}  Then convert EstimateBox components to tables manually or with LLM assistance.${reset}`);
    console.log();
  }

  // In CI, treat warnings as errors
  if (isCI() && warnings.length > 0) {
    console.log(`${red}⚠ Warnings treated as errors in CI environment\n${reset}`);
    return 1;
  }

  return errors.length > 0 ? 1 : 0;
}

const exitCode = validateEstimateBoxes();
process.exit(exitCode);
