/**
 * Unified Validation Engine
 *
 * A single-pass validation system that loads content once and runs multiple
 * validation rules against it. This replaces the pattern of having many
 * separate validator scripts that each re-read all files.
 *
 * Usage:
 *   import { ValidationEngine } from './validation-engine.mjs';
 *
 *   const engine = new ValidationEngine();
 *   await engine.load();
 *   engine.addRule(myRule);
 *   const issues = await engine.validate();
 */

import { readFileSync, existsSync } from 'fs';
import { join, relative, dirname, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import { findMdxFiles, findFiles } from './file-utils.mjs';
import { getColors } from './output.mjs';

// Base directories
const PROJECT_ROOT = process.cwd();
const CONTENT_DIR = join(PROJECT_ROOT, 'src/content/docs');
const DATA_DIR = join(PROJECT_ROOT, 'src/data');

/**
 * Parse frontmatter from MDX/MD content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  try {
    const frontmatter = parseYaml(match[1]);
    return { frontmatter: frontmatter || {}, body: match[2] };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Load JSON file safely
 */
function loadJSON(path) {
  const fullPath = join(PROJECT_ROOT, path);
  if (!existsSync(fullPath)) return null;
  try {
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Load YAML file safely
 */
function loadYAML(path) {
  const fullPath = join(PROJECT_ROOT, path);
  if (!existsSync(fullPath)) return null;
  try {
    return parseYaml(readFileSync(fullPath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Issue severity levels
 */
export const Severity = {
  ERROR: 'error',     // Must fix - will fail CI
  WARNING: 'warning', // Should fix - won't fail CI by default
  INFO: 'info',       // Informational - suggestions
};

/**
 * Validation issue structure
 */
export class Issue {
  constructor({ rule, file, line, message, severity = Severity.ERROR, fix = null }) {
    this.rule = rule;
    this.file = file;
    this.line = line;
    this.message = message;
    this.severity = severity;
    this.fix = fix; // Optional: { description, apply: () => void }
  }

  toString() {
    const loc = this.line ? `:${this.line}` : '';
    return `[${this.severity.toUpperCase()}] ${this.rule}: ${this.file}${loc} - ${this.message}`;
  }
}

/**
 * Content file representation
 */
export class ContentFile {
  constructor(filePath, raw) {
    this.path = filePath;
    this.relativePath = relative(CONTENT_DIR, filePath);
    this.raw = raw;

    const { frontmatter, body } = parseFrontmatter(raw);
    this.frontmatter = frontmatter;
    this.body = body;

    // Derived properties
    this.extension = filePath.split('.').pop();
    this.isIndex = basename(filePath).startsWith('index.');
    this.directory = dirname(this.relativePath);
    this.slug = this.relativePath.replace(/\.(mdx?|md)$/, '').replace(/\/index$/, '');
  }

  /**
   * Get URL path for this content
   */
  get urlPath() {
    let path = '/' + this.slug + '/';
    if (path === '//') path = '/';
    return path;
  }
}

/**
 * Main validation engine
 */
export class ValidationEngine {
  constructor(options = {}) {
    this.options = {
      contentDir: CONTENT_DIR,
      dataDir: DATA_DIR,
      ...options,
    };

    this.rules = new Map();
    this.content = new Map();
    this.loaded = false;

    // Shared data (loaded once)
    this.pathRegistry = null;
    this.entities = null;
    this.sidebarConfig = null;
  }

  /**
   * Load all content and shared data
   */
  async load() {
    if (this.loaded) return;

    // Load all MDX/MD files
    const files = findMdxFiles(this.options.contentDir);
    for (const filePath of files) {
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const contentFile = new ContentFile(filePath, raw);
        this.content.set(filePath, contentFile);
      } catch (err) {
        console.error(`Failed to load ${filePath}: ${err.message}`);
      }
    }

    // Load shared data
    this.pathRegistry = loadJSON('src/data/pathRegistry.json') || {};
    this.entities = loadYAML('src/data/entities.yaml') || {};

    // Build reverse path registry (path -> id)
    this.reversePathRegistry = {};
    for (const [id, path] of Object.entries(this.pathRegistry)) {
      const normalized = path.endsWith('/') ? path : path + '/';
      this.reversePathRegistry[normalized] = id;
      this.reversePathRegistry[path.replace(/\/$/, '')] = id;
    }

    // Parse sidebar from astro.config.mjs
    this.sidebarConfig = this._parseSidebarConfig();

    this.loaded = true;
  }

  /**
   * Parse sidebar configuration from astro.config.mjs
   */
  _parseSidebarConfig() {
    const configPath = join(PROJECT_ROOT, 'astro.config.mjs');
    if (!existsSync(configPath)) return { entries: [], directories: new Set() };

    try {
      const content = readFileSync(configPath, 'utf-8');
      const entries = [];
      const directories = new Set();

      // Extract slug entries
      const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = slugRegex.exec(content)) !== null) {
        entries.push(match[1]);
      }

      // Extract autogenerate directories
      const autoRegex = /autogenerate:\s*\{\s*directory:\s*['"]([^'"]+)['"]/g;
      while ((match = autoRegex.exec(content)) !== null) {
        directories.add(match[1]);
      }

      // Extract link entries
      const linkRegex = /link:\s*['"]([^'"]+)['"]/g;
      while ((match = linkRegex.exec(content)) !== null) {
        entries.push(match[1].replace(/^\//, '').replace(/\/$/, ''));
      }

      return { entries, directories };
    } catch {
      return { entries: [], directories: new Set() };
    }
  }

  /**
   * Register a validation rule
   */
  addRule(rule) {
    if (!rule.id || !rule.check) {
      throw new Error('Rule must have id and check function');
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules
   */
  addRules(rules) {
    for (const rule of rules) {
      this.addRule(rule);
    }
  }

  /**
   * Get a registered rule by ID
   */
  getRule(id) {
    return this.rules.get(id);
  }

  /**
   * Run validation
   * @param {Object} options - Validation options
   * @param {string[]} options.ruleIds - Specific rules to run (null = all)
   * @param {string[]} options.files - Specific files to check (null = all)
   * @returns {Issue[]} Array of issues found
   */
  async validate(options = {}) {
    if (!this.loaded) {
      await this.load();
    }

    const { ruleIds = null, files = null } = options;
    const issues = [];

    // Determine which rules to run
    const rulesToRun = ruleIds
      ? ruleIds.map(id => this.rules.get(id)).filter(Boolean)
      : [...this.rules.values()];

    // Determine which files to check
    const filesToCheck = files
      ? files.map(f => this.content.get(f)).filter(Boolean)
      : [...this.content.values()];

    // Run file-level rules
    for (const contentFile of filesToCheck) {
      for (const rule of rulesToRun) {
        if (rule.scope === 'global') continue; // Skip global rules in file loop

        try {
          const ruleIssues = await rule.check(contentFile, this);
          if (Array.isArray(ruleIssues)) {
            issues.push(...ruleIssues);
          }
        } catch (err) {
          issues.push(new Issue({
            rule: rule.id,
            file: contentFile.path,
            message: `Rule threw error: ${err.message}`,
            severity: Severity.ERROR,
          }));
        }
      }
    }

    // Run global rules (operate on all content at once)
    for (const rule of rulesToRun) {
      if (rule.scope !== 'global') continue;

      try {
        const ruleIssues = await rule.check(filesToCheck, this);
        if (Array.isArray(ruleIssues)) {
          issues.push(...ruleIssues);
        }
      } catch (err) {
        issues.push(new Issue({
          rule: rule.id,
          file: 'global',
          message: `Rule threw error: ${err.message}`,
          severity: Severity.ERROR,
        }));
      }
    }

    return issues;
  }

  /**
   * Get summary statistics
   */
  getSummary(issues) {
    const byRule = {};
    const bySeverity = { error: 0, warning: 0, info: 0 };

    for (const issue of issues) {
      byRule[issue.rule] = (byRule[issue.rule] || 0) + 1;
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
    }

    return {
      total: issues.length,
      byRule,
      bySeverity,
      hasErrors: bySeverity.error > 0,
    };
  }

  /**
   * Format issues for console output
   */
  formatOutput(issues, options = {}) {
    const { ci = false, verbose = false } = options;
    const colors = getColors(ci);

    if (ci) {
      return JSON.stringify({
        issues: issues.map(i => ({
          rule: i.rule,
          file: i.file,
          line: i.line,
          message: i.message,
          severity: i.severity,
        })),
        summary: this.getSummary(issues),
      }, null, 2);
    }

    const lines = [];
    const grouped = {};

    // Group by file
    for (const issue of issues) {
      const key = issue.file;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(issue);
    }

    // Output by file
    for (const [file, fileIssues] of Object.entries(grouped)) {
      const relPath = relative(PROJECT_ROOT, file);
      lines.push(`\n${colors.cyan}${relPath}${colors.reset}`);

      for (const issue of fileIssues) {
        const sevColor = issue.severity === 'error' ? colors.red
          : issue.severity === 'warning' ? colors.yellow
          : colors.dim;
        const line = issue.line ? `:${issue.line}` : '';
        lines.push(`  ${sevColor}${issue.severity}${colors.reset} [${issue.rule}]${line}: ${issue.message}`);
      }
    }

    // Summary
    const summary = this.getSummary(issues);
    lines.push(`\n${colors.bold}Summary:${colors.reset}`);
    lines.push(`  Errors: ${colors.red}${summary.bySeverity.error}${colors.reset}`);
    lines.push(`  Warnings: ${colors.yellow}${summary.bySeverity.warning}${colors.reset}`);
    lines.push(`  Info: ${colors.dim}${summary.bySeverity.info}${colors.reset}`);

    return lines.join('\n');
  }
}

/**
 * Create a simple rule helper
 */
export function createRule({ id, name, description, scope = 'file', check }) {
  return { id, name, description, scope, check };
}

// Export singletons for convenience
export const engine = new ValidationEngine();

export default ValidationEngine;
