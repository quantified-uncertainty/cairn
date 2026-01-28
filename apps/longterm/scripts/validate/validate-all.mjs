#!/usr/bin/env node

/**
 * Master Validation Script
 *
 * Runs all validation checks and aggregates results.
 * Suitable for CI pipelines and local development.
 *
 * Usage:
 *   node scripts/validate-all.mjs [options]
 *
 * Options:
 *   --ci              Output JSON for CI pipelines
 *   --fail-fast       Stop on first failure
 *   --skip=<check>    Skip specific checks (comma-separated)
 *                     Available: data, links, entity-links, orphans, mdx, mermaid, style, staleness, consistency, sidebar, sidebar-labels, types, dollars, comparisons, schema, graph-sync, insights
 *
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 *
 * Examples:
 *   node scripts/validate-all.mjs
 *   node scripts/validate-all.mjs --ci
 *   node scripts/validate-all.mjs --skip=orphans
 *   node scripts/validate-all.mjs --fail-fast
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const CI_MODE = args.includes('--ci');
const FAIL_FAST = args.includes('--fail-fast');

// Parse --skip argument
const skipArg = args.find(a => a.startsWith('--skip='));
const skipChecks = skipArg ? skipArg.replace('--skip=', '').split(',') : [];

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

// Define all validation checks
const CHECKS = [
  {
    id: 'data',
    name: 'Data Integrity',
    script: 'validate-data.mjs',
    description: 'Entity references, required fields, DataInfoBox props',
  },
  {
    id: 'links',
    name: 'Internal Links',
    script: 'validate-internal-links.mjs',
    description: 'Markdown links resolve to existing content',
  },
  {
    id: 'entity-links',
    name: 'EntityLink Conversion',
    script: 'validate-entity-links.mjs',
    description: 'Markdown links that could use EntityLink components',
  },
  {
    id: 'orphans',
    name: 'Orphaned Files',
    script: 'validate-orphaned-files.mjs',
    description: 'Backup files, temp files, empty directories',
  },
  {
    id: 'mdx',
    name: 'MDX Syntax',
    script: 'validate-mdx-syntax.mjs',
    description: 'Mermaid components, escaped characters, common errors',
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagrams',
    script: 'validate-mermaid.mjs',
    description: 'Diagram syntax, subgraph IDs, comparison operators',
  },
  {
    id: 'style',
    name: 'Style Guide Compliance',
    script: 'validate-style-guide.mjs',
    description: 'Section structure, magnitude assessment, diagram conventions',
  },
  {
    id: 'staleness',
    name: 'Content Freshness',
    script: 'check-staleness.mjs',
    description: 'Review dates, dependency updates, age thresholds',
  },
  {
    id: 'consistency',
    name: 'Cross-Page Consistency',
    script: 'validate-consistency.mjs',
    description: 'Probability estimates, causal claims, terminology',
  },
  {
    id: 'sidebar',
    name: 'Sidebar Configuration',
    script: 'validate-sidebar.mjs',
    description: 'Index pages have label: Overview and order: 0',
  },
  {
    id: 'sidebar-labels',
    name: 'Sidebar Label Names',
    script: 'validate-sidebar-labels.mjs',
    description: 'Sidebar labels use proper English names, not kebab-case',
  },
  {
    id: 'types',
    name: 'Type Consistency',
    script: 'validate-types.mjs',
    description: 'UI components handle all entity types from schema',
  },
  {
    id: 'dollars',
    name: 'Dollar Sign Escaping',
    script: 'validate-dollar-signs.mjs',
    description: 'Currency values escaped to prevent LaTeX math parsing',
  },
  {
    id: 'comparisons',
    name: 'Comparison Operator Escaping',
    script: 'validate-comparison-operators.mjs',
    description: 'Less-than/greater-than before numbers escaped to prevent JSX parsing',
  },
  {
    id: 'schema',
    name: 'YAML Schema Validation',
    script: 'validate-yaml-schema.mjs',
    description: 'Entity/resource YAML files match Zod schemas',
    runner: 'tsx',
  },
  {
    id: 'graph-sync',
    name: 'Graph Node Sync',
    script: 'validate-graph-sync.mjs',
    description: 'Individual diagram nodes exist in master graph',
  },
  {
    id: 'insights',
    name: 'Insights Quality',
    script: 'validate-insights.mjs',
    description: 'Insight schema, ratings, and source paths',
  },
];

/**
 * Run a validation script and capture output
 */
function runCheck(check) {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, check.script);
    const childArgs = CI_MODE ? ['--ci'] : [];

    // Support alternative runners for TypeScript scripts
    // Use tsx/esm loader to avoid IPC pipe issues in sandboxed environments
    const runner = 'node';
    const runnerArgs = check.runner === 'tsx'
      ? ['--import', 'tsx/esm', '--no-warnings', scriptPath, ...childArgs]
      : [scriptPath, ...childArgs];

    const child = spawn(runner, runnerArgs, {
      cwd: process.cwd(),
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (!CI_MODE) {
        process.stdout.write(data);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (!CI_MODE) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code) => {
      resolve({
        check: check.id,
        name: check.name,
        passed: code === 0,
        exitCode: code,
        stdout,
        stderr,
      });
    });

    child.on('error', (err) => {
      resolve({
        check: check.id,
        name: check.name,
        passed: false,
        exitCode: 1,
        error: err.message,
        stdout,
        stderr,
      });
    });
  });
}

async function main() {
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    },
  };

  if (!CI_MODE) {
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}  Content Validation Suite${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
  }

  // Run each check
  for (const check of CHECKS) {
    results.summary.total++;

    // Skip if requested
    if (skipChecks.includes(check.id)) {
      results.summary.skipped++;
      results.checks.push({
        check: check.id,
        name: check.name,
        skipped: true,
      });
      if (!CI_MODE) {
        console.log(`${colors.dim}⊘ ${check.name} (skipped)${colors.reset}\n`);
      }
      continue;
    }

    if (!CI_MODE) {
      console.log(`${colors.cyan}▶ ${check.name}${colors.reset}`);
      console.log(`${colors.dim}  ${check.description}${colors.reset}\n`);
    }

    const result = await runCheck(check);
    results.checks.push(result);

    if (result.passed) {
      results.summary.passed++;
      if (!CI_MODE) {
        console.log(`\n${colors.green}✓ ${check.name} passed${colors.reset}\n`);
      }
    } else {
      results.summary.failed++;
      if (!CI_MODE) {
        console.log(`\n${colors.red}✗ ${check.name} failed${colors.reset}\n`);
      }

      if (FAIL_FAST) {
        if (!CI_MODE) {
          console.log(`${colors.yellow}Stopping due to --fail-fast${colors.reset}\n`);
        }
        break;
      }
    }

    if (!CI_MODE && check !== CHECKS[CHECKS.length - 1]) {
      console.log(`${colors.dim}${'─'.repeat(50)}${colors.reset}\n`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  results.duration = `${duration}s`;

  // Output results
  if (CI_MODE) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}  Summary${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`  Total:   ${results.summary.total}`);
    console.log(`  ${colors.green}Passed:  ${results.summary.passed}${colors.reset}`);
    if (results.summary.failed > 0) {
      console.log(`  ${colors.red}Failed:  ${results.summary.failed}${colors.reset}`);
    }
    if (results.summary.skipped > 0) {
      console.log(`  ${colors.dim}Skipped: ${results.summary.skipped}${colors.reset}`);
    }
    console.log(`\n  Duration: ${duration}s\n`);

    if (results.summary.failed === 0) {
      console.log(`${colors.green}${colors.bold}✅ All checks passed!${colors.reset}\n`);
    } else {
      console.log(`${colors.red}${colors.bold}❌ ${results.summary.failed} check(s) failed${colors.reset}\n`);

      // List failed checks
      for (const check of results.checks) {
        if (!check.passed && !check.skipped) {
          console.log(`  ${colors.red}• ${check.name}${colors.reset}`);
        }
      }
      console.log();
    }
  }

  process.exit(results.summary.failed > 0 ? 1 : 0);
}

main();
