#!/usr/bin/env node

/**
 * Crux Project CLI
 *
 * Unified command-line interface for project tools.
 *
 * Usage:
 *   crux <domain> <command> [options]
 *   crux <domain> [options]          # Runs default command
 *
 * Domains:
 *   insights    Insight quality management
 *   resources   External resource links (coming soon)
 *   content     Page quality management (coming soon)
 *   gaps        Insight gap analysis (coming soon)
 *   validate    Run validators (coming soon)
 *
 * Global Options:
 *   --ci        JSON output for CI pipelines
 *   --help      Show help
 *
 * Examples:
 *   crux insights check
 *   crux insights duplicates --threshold 0.5
 *   crux insights stats --json
 *   crux resources list
 *   crux validate --only insights,links
 */

import { parseArgs } from 'node:util';
import { createLogger } from './lib/output.mjs';

// Domain handlers
import * as insightsCommands from './commands/insights.mjs';
import * as gapsCommands from './commands/gaps.mjs';

const domains = {
  insights: insightsCommands,
  gaps: gapsCommands,
  // Future domains:
  // resources: resourcesCommands,
  // content: contentCommands,
  // validate: validateCommands,
};

/**
 * Parse command-line arguments
 */
function parseCliArgs() {
  const args = process.argv.slice(2);

  // Extract domain and command
  let domain = null;
  let command = null;
  const remaining = [];

  for (const arg of args) {
    if (!arg.startsWith('-')) {
      if (!domain) {
        domain = arg;
      } else if (!command) {
        command = arg;
      } else {
        remaining.push(arg);
      }
    } else {
      remaining.push(arg);
    }
  }

  // Parse options from remaining args
  const options = {};
  for (const arg of remaining) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      // Convert kebab-case to camelCase
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      options[camelKey] = value === undefined ? true : value;
    }
  }

  return { domain, command, args: remaining, options };
}

/**
 * Show main help
 */
function showHelp() {
  console.log(`
${'\x1b[1m'}Crux Project CLI${'\x1b[0m'}

Unified command-line interface for project tools.

${'\x1b[1m'}Usage:${'\x1b[0m'}
  crux <domain> <command> [options]
  crux <domain> [options]          # Runs default command

${'\x1b[1m'}Domains:${'\x1b[0m'}
  insights    Insight quality management
  resources   External resource links (coming soon)
  content     Page quality management (coming soon)
  gaps        Insight gap analysis (coming soon)
  validate    Run validators (coming soon)

${'\x1b[1m'}Global Options:${'\x1b[0m'}
  --ci        JSON output for CI pipelines
  --help      Show help

${'\x1b[1m'}Examples:${'\x1b[0m'}
  crux insights check
  crux insights duplicates --threshold 0.5
  crux insights stats --json

${'\x1b[1m'}Domain Help:${'\x1b[0m'}
  crux <domain> --help
`);
}

/**
 * Main entry point
 */
async function main() {
  const { domain, command, args, options } = parseCliArgs();
  const log = createLogger(options.ci);

  // Show help if requested or no domain specified
  if (options.help && !domain) {
    showHelp();
    process.exit(0);
  }

  if (!domain) {
    showHelp();
    process.exit(1);
  }

  // Check if domain exists
  const domainHandler = domains[domain];
  if (!domainHandler) {
    log.error(`Unknown domain: ${domain}`);
    log.dim(`Available domains: ${Object.keys(domains).join(', ')}`);
    process.exit(1);
  }

  // Show domain help if requested
  if (options.help) {
    if (domainHandler.getHelp) {
      console.log(domainHandler.getHelp());
    } else {
      console.log(`No help available for domain: ${domain}`);
    }
    process.exit(0);
  }

  // Determine which command to run
  const commandName = command || 'check'; // Default command
  const commandHandler = domainHandler.commands?.[commandName];

  if (!commandHandler) {
    log.error(`Unknown command: ${commandName}`);
    if (domainHandler.commands) {
      log.dim(`Available commands: ${Object.keys(domainHandler.commands).join(', ')}`);
    }
    process.exit(1);
  }

  // Run the command
  try {
    const result = await commandHandler(args, options);

    if (result.output) {
      console.log(result.output);
    }

    process.exit(result.exitCode || 0);
  } catch (err) {
    log.error(`Error: ${err.message}`);
    if (!options.ci) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
