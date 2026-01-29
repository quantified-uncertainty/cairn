#!/usr/bin/env node

/**
 * EstimateBox Batch Conversion Tool
 *
 * Helps convert EstimateBox components to markdown tables with proper reasoning columns.
 * Can generate prompts for LLM-assisted conversion or do simple automated fixes.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { findMdxFiles } from './lib/file-utils.mjs';
import { getColors } from './lib/output.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'src/content/docs');
const { green, yellow, dim, bold, reset } = getColors();

const CONVERSION_EXAMPLE = `
EXAMPLE CONVERSION:

Before:
<EstimateBox
  client:load
  variable="Probability of Catastrophic Scheming"
  estimates={[
    { source: "Joe Carlsmith (2023)", value: "~25%", notes: "P(scheming AND undetected AND catastrophe) by 2070" },
    { source: "Yudkowsky", value: "60-80%", notes: "In sufficiently capable systems" }
  ]}
/>

After:
### Expert Probability Estimates

Expert estimates for the probability of undetected scheming leading to catastrophe vary widely:

| Expert/Source | Estimate | Reasoning |
|---------------|----------|-----------|
| Joe Carlsmith (2023) | ~25% by 2070 | Probability of the conjunction: scheming emerges AND remains undetected AND leads to catastrophe. Based on analysis of training dynamics, instrumental convergence arguments, and feasibility of detection methods. |
| Eliezer Yudkowsky | 60-80% | In sufficiently capable systems, scheming is the default outcome due to instrumental convergence—self-preservation and goal stability are useful for almost any objective. Skeptical that gradient descent would select against deception if it's effective. |

Key changes:
1. Add a descriptive heading (###)
2. Add introductory prose before the table
3. Expand "notes" into full "Reasoning" column with proper context
4. Remove the EstimateBox import
`;

function generatePromptForFile(filePath) {
  const relPath = relative(process.cwd(), filePath);
  const content = readFileSync(filePath, 'utf-8');

  // Extract EstimateBox usage
  const estimateBoxRegex = /<EstimateBox[\s\S]*?\/>/g;
  const matches = content.match(estimateBoxRegex) || [];

  if (matches.length === 0) return null;

  return `
FILE: ${relPath}
FOUND: ${matches.length} EstimateBox component(s)

TASK: Convert EstimateBox components to markdown tables

INSTRUCTIONS:
1. Read the file: ${relPath}
2. For each EstimateBox:
   - Add a descriptive ### heading based on the variable name
   - Add 1-2 sentences of introductory prose
   - Create a markdown table with columns: Expert/Source | Estimate | Reasoning
   - Expand the brief "notes" into full reasoning (2-3 sentences minimum)
   - Use Edit tool for surgical replacements (don't rewrite the whole file)
3. Remove EstimateBox from the imports line
4. Update lastEdited date to today

${CONVERSION_EXAMPLE}

REFERENCE EXAMPLE:
See: apps/longterm/src/content/docs/knowledge-base/risks/accident/scheming.mdx
Lines 118-133, 147-156, and 322-330 show good conversions.
`.trim();
}

function fixDeadImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Check if EstimateBox is in imports but not used
  const importMatch = content.match(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*components\/wiki['"]/);
  if (!importMatch) return false;

  const imports = importMatch[1];
  if (!imports.includes('EstimateBox')) return false;
  if (content.includes('<EstimateBox')) return false; // Still used

  // Remove EstimateBox from imports
  const updatedImports = imports
    .split(',')
    .map(i => i.trim())
    .filter(i => i !== 'EstimateBox' && i !== '')
    .join(', ');

  const newImportLine = `import {${updatedImports}} from '${importMatch[0].match(/from\s*['"]([^'"]*)['"]/)[1]}';`;
  const updatedContent = content.replace(importMatch[0], newImportLine);

  writeFileSync(filePath, updatedContent);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`
${bold}EstimateBox Batch Conversion Tool${reset}

${bold}COMMANDS:${reset}
  ${green}prompts${reset}        Generate conversion prompts for LLM-assisted fixes
  ${green}fix-imports${reset}    Automatically remove dead EstimateBox imports
  ${green}list${reset}           List files that need conversion (with severity)
  ${green}help${reset}           Show this help message

${bold}USAGE:${reset}
  # Generate prompts for manual/LLM conversion
  node scripts/fix-estimate-boxes.mjs prompts > .claude/temp/estimate-box-prompts.txt

  # Automatically fix dead imports
  node scripts/fix-estimate-boxes.mjs fix-imports

  # List files by severity
  node scripts/fix-estimate-boxes.mjs list

${bold}WORKFLOW:${reset}
  1. Run: npm run validate:estimate-boxes (to see current state)
  2. Run: node scripts/analyze-estimate-boxes.mjs (for detailed analysis)
  3. Run: node scripts/fix-estimate-boxes.mjs fix-imports (clean up dead imports)
  4. Run: node scripts/fix-estimate-boxes.mjs prompts (generate conversion prompts)
  5. Use prompts with Task agents or manual conversion
  6. Run: npm run validate:estimate-boxes (verify completion)

${bold}REFERENCE:${reset}
  See apps/longterm/src/content/docs/knowledge-base/risks/accident/scheming.mdx
  for examples of properly converted tables.
    `.trim());
    return;
  }

  if (command === 'prompts') {
    const analysisPath = '.claude/temp/estimate-box-to-fix.json';
    let filesToFix;

    try {
      const analysis = JSON.parse(readFileSync(analysisPath, 'utf-8'));
      filesToFix = analysis.map(item => join(process.cwd(), item.file));
    } catch {
      console.error(`${yellow}Warning: Analysis file not found. Run: node scripts/analyze-estimate-boxes.mjs first${reset}`);
      console.error(`${dim}Scanning all files instead...${reset}\n`);
      filesToFix = findMdxFiles(CONTENT_DIR);
    }

    let promptCount = 0;
    for (const filePath of filesToFix) {
      const prompt = generatePromptForFile(filePath);
      if (prompt) {
        console.log(prompt);
        console.log('\n' + '='.repeat(80) + '\n');
        promptCount++;
      }
    }

    console.log(`${green}Generated ${promptCount} conversion prompts${reset}`);
    return;
  }

  if (command === 'fix-imports') {
    const mdxFiles = findMdxFiles(CONTENT_DIR);
    let fixedCount = 0;

    for (const filePath of mdxFiles) {
      const relPath = relative(process.cwd(), filePath);
      if (relPath.includes('/internal/')) continue; // Skip docs

      if (fixDeadImports(filePath)) {
        console.log(`${green}✓${reset} Fixed dead import: ${dim}${relPath}${reset}`);
        fixedCount++;
      }
    }

    console.log(`\n${green}Fixed ${fixedCount} dead EstimateBox imports${reset}`);
    return;
  }

  if (command === 'list') {
    const analysisPath = '.claude/temp/estimate-box-analysis.json';
    try {
      const analysis = JSON.parse(readFileSync(analysisPath, 'utf-8'));

      console.log(`\n${bold}Files Needing EstimateBox Conversion (by severity):${reset}\n`);

      const bySeverity = {
        missing: analysis.filter(r => r.severity === 'missing'),
        severe: analysis.filter(r => r.severity === 'severe'),
        moderate: analysis.filter(r => r.severity === 'moderate')
      };

      console.log(`${yellow}🔴 MISSING NOTES (${bySeverity.missing.length}):${reset}`);
      bySeverity.missing.forEach(r => {
        console.log(`  ${r.file}`);
      });

      console.log(`\n${yellow}🟠 SEVERE (${bySeverity.severe.length}):${reset}`);
      bySeverity.severe.forEach(r => {
        console.log(`  ${r.file} ${dim}(avg note length: ${r.avgNoteLength})${reset}`);
      });

      console.log(`\n${yellow}🟡 MODERATE (${bySeverity.moderate.length}):${reset}`);
      bySeverity.moderate.forEach(r => {
        console.log(`  ${r.file} ${dim}(avg note length: ${r.avgNoteLength})${reset}`);
      });

      console.log(`\n${bold}Total: ${analysis.length} components across ${new Set(analysis.map(r => r.file)).size} files${reset}\n`);
    } catch {
      console.error(`${yellow}Analysis file not found. Run: node scripts/analyze-estimate-boxes.mjs first${reset}`);
    }
    return;
  }

  console.error(`${yellow}Unknown command: ${command}${reset}`);
  console.error(`Run: node scripts/fix-estimate-boxes.mjs help`);
  process.exit(1);
}

main();
