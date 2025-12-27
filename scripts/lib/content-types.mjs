/**
 * Content Type Utilities for Scripts
 *
 * Centralized definitions for content types, their paths, and configurations.
 */

/**
 * Content type configurations
 */
export const CONTENT_TYPES = {
  model: {
    pathPattern: /\/models\//,
    directory: 'knowledge-base/models',
    requiredSections: [
      { pattern: /^##\s+overview/im, name: 'Overview' },
    ],
    recommendedSections: [
      { pattern: /^##\s+(quantitative|analysis|magnitude)/im, name: 'Quantitative Analysis' },
      { pattern: /^##\s+limitations?/im, name: 'Limitations' },
      { pattern: /^##\s+strategic\s+importance/im, name: 'Strategic Importance' },
      { pattern: /^###?\s+key\s+crux/im, name: 'Key Cruxes' },
    ],
    stalenessThreshold: 90,
  },
  risk: {
    pathPattern: /\/risks\//,
    directory: 'knowledge-base/risks',
    requiredSections: [
      { pattern: /^##\s+overview/im, name: 'Overview' },
    ],
    recommendedSections: [
      { pattern: /^###?\s+risk\s+assessment/im, name: 'Risk Assessment' },
      { pattern: /^###?\s+responses?\s+(that\s+)?address/im, name: 'Responses That Address This Risk' },
      { pattern: /^##\s+key\s+uncertainties/im, name: 'Key Uncertainties' },
    ],
    stalenessThreshold: 60,
  },
  response: {
    pathPattern: /\/responses\//,
    directory: 'knowledge-base/responses',
    requiredSections: [
      { pattern: /^##\s+overview/im, name: 'Overview' },
    ],
    recommendedSections: [
      { pattern: /^###?\s+quick\s+assessment/im, name: 'Quick Assessment' },
      { pattern: /^###?\s+risks?\s+addressed/im, name: 'Risks Addressed' },
      { pattern: /^##\s+how\s+it\s+works/im, name: 'How It Works' },
    ],
    stalenessThreshold: 120,
  },
};

/**
 * Default staleness threshold for unclassified content
 */
export const DEFAULT_STALENESS_THRESHOLD = 180;

/**
 * Determine content type from file path
 * @param {string} filePath - Path to content file
 * @returns {string|null} Content type name or null if no match
 */
export function getContentType(filePath) {
  for (const [type, config] of Object.entries(CONTENT_TYPES)) {
    if (config.pathPattern.test(filePath)) {
      return type;
    }
  }
  return null;
}

/**
 * Get content type configuration
 * @param {string} type - Content type name
 * @returns {object|null} Configuration object or null if not found
 */
export function getContentTypeConfig(type) {
  return CONTENT_TYPES[type] || null;
}

/**
 * Get staleness threshold for a content type
 * @param {string} type - Content type name
 * @returns {number} Threshold in days
 */
export function getStalenessThreshold(type) {
  const config = CONTENT_TYPES[type];
  return config?.stalenessThreshold || DEFAULT_STALENESS_THRESHOLD;
}

/**
 * Check if a file is an index/overview page
 * @param {string} filePath - Path to content file
 * @returns {boolean} True if file is an index page
 */
export function isIndexPage(filePath) {
  return filePath.endsWith('index.mdx') || filePath.endsWith('index.md');
}

/**
 * Check if a file is a style guide page
 * @param {string} filePath - Path to content file
 * @returns {boolean} True if file is in style-guides
 */
export function isStyleGuidePage(filePath) {
  return filePath.includes('/style-guides/');
}

/**
 * Check if a file is an internal page
 * @param {string} filePath - Path to content file
 * @returns {boolean} True if file is in internal section
 */
export function isInternalPage(filePath) {
  return filePath.includes('/internal/');
}

/**
 * Check if a file should be skipped for validation
 * @param {string} filePath - Path to content file
 * @returns {boolean} True if file should be skipped
 */
export function shouldSkipValidation(filePath) {
  return isIndexPage(filePath) || isStyleGuidePage(filePath) || isInternalPage(filePath);
}

/**
 * Extract entity ID from file path
 * @param {string} filePath - Path to content file
 * @returns {string|null} Entity ID or null
 */
export function extractEntityId(filePath) {
  // Extract the filename without extension
  const match = filePath.match(/([^/]+)\.(mdx?|md)$/);
  if (!match) return null;

  const filename = match[1];
  // Skip index files
  if (filename === 'index') return null;

  return filename;
}

/**
 * Get the base content directory
 */
export const CONTENT_DIR = 'src/content/docs';

/**
 * Get the data directory
 */
export const DATA_DIR = 'src/data';
