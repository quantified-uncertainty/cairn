#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { findMdxFiles } from './lib/file-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, '..', 'src/content/docs');

/**
 * Analyze EstimateBox usage across all MDX files
 * Categorizes by note quality and provides actionable report
 */
function analyzeEstimateBoxes() {
  console.log('🔍 Scanning for EstimateBox usage...\n');

  const mdxFiles = findMdxFiles(CONTENT_DIR);
  const results = [];

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf-8');

    // Check if file uses EstimateBox
    if (!content.includes('EstimateBox')) continue;

    // Extract all EstimateBox components (simplified regex - may need refinement)
    const estimateBoxRegex = /<EstimateBox[\s\S]*?\/>/g;
    const matches = content.match(estimateBoxRegex) || [];

    for (const match of matches) {
      // Extract variable name
      const variableMatch = match.match(/variable=["']([^"']+)["']/);
      const variable = variableMatch ? variableMatch[1] : 'Unknown';

      // Extract estimates array
      const estimatesMatch = match.match(/estimates=\{(\[[\s\S]*?\])\}/);
      if (!estimatesMatch) continue;

      const estimatesStr = estimatesMatch[1];

      // Count estimates
      const estimateCount = (estimatesStr.match(/\{\s*source:/g) || []).length;

      // Extract all notes to measure quality
      const notesRegex = /notes:\s*["']([^"']*)["']/g;
      const notes = [];
      let noteMatch;
      while ((noteMatch = notesRegex.exec(estimatesStr)) !== null) {
        notes.push(noteMatch[1]);
      }

      // Calculate average note length
      const avgNoteLength = notes.length > 0
        ? notes.reduce((sum, note) => sum + note.length, 0) / notes.length
        : 0;

      // Categorize severity
      let severity = 'unknown';
      if (avgNoteLength === 0) {
        severity = 'missing'; // No notes at all
      } else if (avgNoteLength < 50) {
        severity = 'severe'; // Very brief notes
      } else if (avgNoteLength < 100) {
        severity = 'moderate'; // Somewhat brief
      } else {
        severity = 'okay'; // Decent length
      }

      results.push({
        file: relative(process.cwd(), filePath),
        variable,
        estimateCount,
        avgNoteLength: Math.round(avgNoteLength),
        notes,
        severity,
        componentText: match.substring(0, 200) + '...' // Preview
      });
    }
  }

  // Sort by severity then by note length
  const severityOrder = { missing: 0, severe: 1, moderate: 2, okay: 3 };
  results.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.avgNoteLength - b.avgNoteLength;
  });

  // Generate report
  console.log('📊 ESTIMATE BOX ANALYSIS REPORT\n');
  console.log('=' .repeat(80));

  const bySeverity = {
    missing: results.filter(r => r.severity === 'missing'),
    severe: results.filter(r => r.severity === 'severe'),
    moderate: results.filter(r => r.severity === 'moderate'),
    okay: results.filter(r => r.severity === 'okay')
  };

  console.log(`\n🔴 MISSING NOTES (${bySeverity.missing.length}): No explanation provided`);
  bySeverity.missing.forEach(r => {
    console.log(`  ${r.file}`);
    console.log(`    Variable: "${r.variable}" | Estimates: ${r.estimateCount}`);
  });

  console.log(`\n🟠 SEVERE (${bySeverity.severe.length}): Average note length < 50 chars`);
  bySeverity.severe.slice(0, 10).forEach(r => {
    console.log(`  ${r.file}`);
    console.log(`    Variable: "${r.variable}" | Avg note length: ${r.avgNoteLength} | Estimates: ${r.estimateCount}`);
    console.log(`    Sample note: "${r.notes[0]?.substring(0, 60)}..."`);
  });
  if (bySeverity.severe.length > 10) {
    console.log(`  ... and ${bySeverity.severe.length - 10} more`);
  }

  console.log(`\n🟡 MODERATE (${bySeverity.moderate.length}): Average note length 50-100 chars`);
  bySeverity.moderate.slice(0, 5).forEach(r => {
    console.log(`  ${r.file}`);
    console.log(`    Variable: "${r.variable}" | Avg note length: ${r.avgNoteLength}`);
  });
  if (bySeverity.moderate.length > 5) {
    console.log(`  ... and ${bySeverity.moderate.length - 5} more`);
  }

  console.log(`\n🟢 OKAY (${bySeverity.okay.length}): Average note length > 100 chars`);
  console.log('  These may still benefit from table format but have adequate context.');

  // Summary statistics
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY:');
  console.log(`  Total files with EstimateBox: ${new Set(results.map(r => r.file)).size}`);
  console.log(`  Total EstimateBox components: ${results.length}`);
  console.log(`  Needs immediate attention: ${bySeverity.missing.length + bySeverity.severe.length}`);
  console.log(`  Could be improved: ${bySeverity.moderate.length}`);
  console.log(`  Acceptable quality: ${bySeverity.okay.length}`);

  // Save detailed results
  const outputPath = '.claude/temp/estimate-box-analysis.json';
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);

  // Generate actionable list for batch processing
  const needsWork = results.filter(r =>
    r.severity === 'missing' || r.severity === 'severe' || r.severity === 'moderate'
  );

  const actionableList = needsWork.map(r => ({
    file: r.file,
    variable: r.variable,
    severity: r.severity,
    priority: r.severity === 'missing' ? 1 : r.severity === 'severe' ? 2 : 3
  }));

  const actionablePath = '.claude/temp/estimate-box-to-fix.json';
  writeFileSync(actionablePath, JSON.stringify(actionableList, null, 2));
  console.log(`📋 Actionable fix list saved to: ${actionablePath}\n`);
}

analyzeEstimateBoxes();
