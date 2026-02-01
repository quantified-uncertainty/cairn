#!/usr/bin/env node

/**
 * Entity Mentions Validator
 *
 * Scans content for mentions of known entities that aren't wrapped in EntityLink.
 * This helps identify opportunities to improve cross-referencing.
 *
 * Usage:
 *   node scripts/validate/validate-entity-mentions.mjs           # Report unlinked mentions
 *   node scripts/validate/validate-entity-mentions.mjs --ci      # JSON output for CI
 *   node scripts/validate/validate-entity-mentions.mjs --verbose # Show more context
 *   node scripts/validate/validate-entity-mentions.mjs --strict  # Fail on unlinked mentions
 *
 * Exit codes:
 *   0 = No issues (or only INFO-level suggestions without --strict)
 *   1 = Issues found with --strict mode
 */

import { ValidationEngine, Severity } from '../lib/validation-engine.mjs';
import { entityMentionsRule } from '../lib/rules/entity-mentions.mjs';
import { getColors } from '../lib/output.mjs';

const args = process.argv.slice(2);
const CI_MODE = args.includes('--ci');
const VERBOSE = args.includes('--verbose');
const STRICT_MODE = args.includes('--strict');
const colors = getColors(CI_MODE);

async function main() {
  const engine = new ValidationEngine();
  engine.addRule(entityMentionsRule);

  if (!CI_MODE) {
    console.log(`${colors.blue}🔗 Scanning for unlinked entity mentions...${colors.reset}\n`);
  }

  await engine.load();
  const issues = await engine.validate({ ruleIds: ['entity-mentions'] });

  if (CI_MODE) {
    console.log(
      JSON.stringify(
        {
          rule: 'entity-mentions',
          issues: issues.map((i) => ({
            file: i.file,
            line: i.line,
            message: i.message,
            severity: i.severity,
          })),
          summary: engine.getSummary(issues),
        },
        null,
        2
      )
    );
  } else {
    if (issues.length === 0) {
      console.log(`${colors.green}✅ No unlinked entity mentions found${colors.reset}\n`);
    } else {
      // Group by file
      const byFile = new Map();
      for (const issue of issues) {
        const relPath = issue.file.replace(process.cwd() + '/src/content/docs/', '');
        if (!byFile.has(relPath)) {
          byFile.set(relPath, []);
        }
        byFile.get(relPath).push(issue);
      }

      console.log(
        `${colors.yellow}Found ${issues.length} unlinked entity mentions in ${byFile.size} files:${colors.reset}\n`
      );

      // Show results
      let filesShown = 0;
      for (const [file, fileIssues] of byFile) {
        if (!VERBOSE && filesShown >= 10) break;
        filesShown++;

        console.log(`${colors.cyan}${file}${colors.reset}`);
        for (const issue of fileIssues) {
          const lineInfo = issue.line ? `Line ${issue.line}: ` : '';
          console.log(`  ${colors.dim}${lineInfo}${colors.reset}${issue.message}`);
        }
        console.log();
      }

      if (!VERBOSE && byFile.size > 10) {
        console.log(
          `${colors.dim}... and ${byFile.size - 10} more files (use --verbose to see all)${colors.reset}\n`
        );
      }

      // Summary
      console.log(`${'─'.repeat(50)}`);
      console.log(`Total unlinked mentions: ${issues.length}`);
      console.log(`Files affected: ${byFile.size}`);

      if (!STRICT_MODE) {
        console.log(
          `\n${colors.dim}These are suggestions (INFO severity). Use --strict to treat as errors.${colors.reset}`
        );
      }
    }
  }

  // Exit with error only in strict mode with issues
  if (STRICT_MODE && issues.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
