/**
 * MDX Utilities for Scripts
 *
 * Common functions for parsing and manipulating MDX content files.
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

/**
 * Parse YAML frontmatter from MDX content
 * @param {string} content - Full MDX file content
 * @returns {object} Parsed frontmatter object (empty if none/invalid)
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return parseYaml(match[1]) || {};
  } catch {
    return {};
  }
}

/**
 * Get content body (without frontmatter)
 * @param {string} content - Full MDX file content
 * @returns {string} Content without frontmatter
 */
export function getContentBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : content;
}

/**
 * Get raw frontmatter string (without delimiters)
 * @param {string} content - Full MDX file content
 * @returns {string|null} Raw frontmatter YAML or null if none
 */
export function getRawFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Update frontmatter fields while preserving existing content
 * @param {string} content - Full MDX file content
 * @param {object} updates - Fields to add/update in frontmatter
 * @returns {string} Updated content with modified frontmatter
 */
export function updateFrontmatter(content, updates) {
  const frontmatter = parseFrontmatter(content);
  const body = getContentBody(content);

  const newFrontmatter = { ...frontmatter, ...updates };
  const yamlString = stringifyYaml(newFrontmatter, { lineWidth: 0 }).trim();

  return `---\n${yamlString}\n---\n${body}`;
}

/**
 * Replace frontmatter entirely
 * @param {string} content - Full MDX file content
 * @param {object} newFrontmatter - New frontmatter object
 * @returns {string} Content with replaced frontmatter
 */
export function replaceFrontmatter(content, newFrontmatter) {
  const body = getContentBody(content);
  const yamlString = stringifyYaml(newFrontmatter, { lineWidth: 0 }).trim();

  return `---\n${yamlString}\n---\n${body}`;
}

/**
 * Check if content has valid frontmatter
 * @param {string} content - Full MDX file content
 * @returns {boolean} True if content has valid frontmatter
 */
export function hasFrontmatter(content) {
  return /^---\n[\s\S]*?\n---/.test(content);
}

/**
 * Extract all h2 sections from content body
 * @param {string} body - Content body (without frontmatter)
 * @returns {Array<{title: string, line: number}>} Array of section objects
 */
export function extractH2Sections(body) {
  const sections = [];
  const regex = /^##\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const lineNum = body.substring(0, match.index).split('\n').length;
    sections.push({
      title: match[1].trim(),
      line: lineNum,
    });
  }
  return sections;
}

/**
 * Extract all headings from content body
 * @param {string} body - Content body (without frontmatter)
 * @returns {Array<{level: number, title: string, line: number}>} Array of heading objects
 */
export function extractHeadings(body) {
  const headings = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const lineNum = body.substring(0, match.index).split('\n').length;
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      line: lineNum,
    });
  }
  return headings;
}

/**
 * Count words in content (excluding code blocks and frontmatter)
 * @param {string} body - Content body (without frontmatter)
 * @returns {number} Word count
 */
export function countWords(body) {
  // Remove code blocks
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  // Remove inline code
  const withoutInline = withoutCode.replace(/`[^`]+`/g, '');
  // Count words
  return withoutInline.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Extract links from MDX content
 * @param {string} body - Content body
 * @returns {Array<{text: string, url: string, line: number}>} Array of link objects
 */
export function extractLinks(body) {
  const links = [];
  const regex = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const lineNum = body.substring(0, match.index).split('\n').length;
    links.push({
      text: match[1],
      url: match[2],
      line: lineNum,
    });
  }
  return links;
}

/**
 * Page types that should skip content validation
 * These pages contain examples/documentation that would trigger false positives
 */
const SKIP_VALIDATION_PAGE_TYPES = ['stub', 'documentation'];

/**
 * File path patterns that should skip validation
 */
const SKIP_VALIDATION_PATHS = [
  /\/index\.(mdx?|md)$/,        // Index/overview pages
  /\/_[^/]+\.(mdx?|md)$/,       // Files starting with underscore
  /\/internal\//,               // Internal docs directory
];

/**
 * Check if a page should skip validation based on frontmatter
 * @param {object} frontmatter - Parsed frontmatter object
 * @returns {boolean} True if validation should be skipped
 */
export function shouldSkipValidation(frontmatter) {
  return SKIP_VALIDATION_PAGE_TYPES.includes(frontmatter.pageType);
}

/**
 * Check if a file should skip validation based on path
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if validation should be skipped
 */
export function shouldSkipValidationByPath(filePath) {
  return SKIP_VALIDATION_PATHS.some(pattern => pattern.test(filePath));
}

/**
 * Combined check: skip validation if either frontmatter or path matches
 * @param {object} frontmatter - Parsed frontmatter object
 * @param {string} filePath - Path to the file
 * @returns {boolean} True if validation should be skipped
 */
export function shouldSkipValidationFull(frontmatter, filePath) {
  return shouldSkipValidation(frontmatter) || shouldSkipValidationByPath(filePath);
}
