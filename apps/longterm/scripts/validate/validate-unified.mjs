#!/usr/bin/env node

/**
 * Unified Validation Runner
 *
 * A single-pass validation system that loads content once and runs multiple
 * validation rules efficiently. This is the recommended way to run validations.
 *
 * Usage:
 *   node scripts/validate/validate-unified.mjs              # Run all rules
 *   node scripts/validate/validate-unified.mjs --rules=entitylink-ids,jsx-in-md
 *   node scripts/validate/validate-unified.mjs --ci         # JSON output
 *   node scripts/validate/validate-unified.mjs --list       # List available rules
 *   node scripts/validate/validate-unified.mjs --errors-only # Only show errors
 *
 * Exit codes:
 *   0 = No errors (warnings don't fail by default)
 *   1 = One or more errors found
 */

import { ValidationEngine, Severity } from '../lib/validation-engine.mjs';
import { allRules } from '../lib/rules/index.mjs';
import { getColors } from '../lib/output.mjs';

const args = process.argv.slice(2);
const CI_MODE = args.includes('--ci');
const LIST_MODE = args.includes('--list');
const ERRORS_ONLY = args.includes('--errors-only');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// Parse --rules argument
const rulesArg = args.find(a => a.startsWith('--rules='));
const selectedRules = rulesArg ? rulesArg.replace('--rules=', '').split(',') : null;

const colors = getColors(CI_MODE);

async function main() {
  // List mode
  if (LIST_MODE) {
    console.log(`${colors.bold}Available validation rules:${colors.reset}\n`);
    for (const rule of allRules) {
      console.log(`  ${colors.cyan}${rule.id}${colors.reset}`);
      console.log(`    ${colors.dim}${rule.description}${colors.reset}`);
      console.log(`    Scope: ${rule.scope || 'file'}\n`);
    }
    process.exit(0);
  }

  const startTime = Date.now();

  // Create engine and register rules
  const engine = new ValidationEngine();

  if (!CI_MODE) {
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}  Unified Content Validation${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }

  // Register rules
  for (const rule of allRules) {
    if (!selectedRules || selectedRules.includes(rule.id)) {
      engine.addRule(rule);
    }
  }

  if (!CI_MODE) {
    console.log(`${colors.dim}Loading content...${colors.reset}`);
  }

  // Load content
  await engine.load();

  if (!CI_MODE) {
    console.log(`${colors.dim}Loaded ${engine.content.size} files${colors.reset}`);
    console.log(`${colors.dim}Running ${engine.rules.size} rules...${colors.reset}\n`);
  }

  // Run validation
  let issues = await engine.validate({
    ruleIds: selectedRules,
  });

  // Filter if errors only
  if (ERRORS_ONLY) {
    issues = issues.filter(i => i.severity === Severity.ERROR);
  }

  // Output results
  if (CI_MODE) {
    console.log(engine.formatOutput(issues, { ci: true }));
  } else {
    if (issues.length > 0) {
      console.log(engine.formatOutput(issues, { verbose: VERBOSE }));
    }

    const summary = engine.getSummary(issues);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    if (summary.hasErrors) {
      console.log(`${colors.red}${colors.bold}❌ Validation failed with ${summary.bySeverity.error} error(s)${colors.reset}`);
    } else if (summary.bySeverity.warning > 0) {
      console.log(`${colors.yellow}${colors.bold}⚠️  Validation passed with ${summary.bySeverity.warning} warning(s)${colors.reset}`);
    } else {
      console.log(`${colors.green}${colors.bold}✅ All checks passed!${colors.reset}`);
    }

    console.log(`${colors.dim}Duration: ${duration}s${colors.reset}\n`);

    // Show breakdown by rule
    if (issues.length > 0 && VERBOSE) {
      console.log(`${colors.bold}Issues by rule:${colors.reset}`);
      for (const [rule, count] of Object.entries(summary.byRule)) {
        console.log(`  ${rule}: ${count}`);
      }
      console.log();
    }
  }

  // Exit with error if there were errors
  const summary = engine.getSummary(issues);
  process.exit(summary.hasErrors ? 1 : 0);
}

main().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
