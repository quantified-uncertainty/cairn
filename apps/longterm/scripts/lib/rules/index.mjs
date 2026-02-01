/**
 * Validation Rules Index
 *
 * Central export for all validation rules.
 * Add new rules here to make them available to the validation engine.
 */

// Content validation rules
export { entityLinkIdsRule } from './entitylink-ids.mjs';
export { dollarSignsRule } from './dollar-signs.mjs';
export { tildeDollarRule } from './tilde-dollar.mjs';
export { comparisonOperatorsRule } from './comparison-operators.mjs';
export { estimateBoxesRule } from './estimate-boxes.mjs';
export { placeholdersRule } from './placeholders.mjs';
export { internalLinksRule } from './internal-links.mjs';
export { componentRefsRule } from './component-refs.mjs';
export { preferEntityLinkRule } from './prefer-entitylink.mjs';
export { entityMentionsRule } from './entity-mentions.mjs';

// Sidebar/structure rules
export { sidebarCoverageRule } from './sidebar-coverage.mjs';
export { sidebarIndexRule } from './sidebar-index.mjs';

// File-level rules
export { jsxInMdRule } from './jsx-in-md.mjs';
export { cruftFilesRule } from './cruft-files.mjs';

// Markdown formatting rules
export { markdownListsRule } from './markdown-lists.mjs';
export { consecutiveBoldLabelsRule } from './consecutive-bold-labels.mjs';

// Schema validation rules
export { frontmatterSchemaRule } from './frontmatter-schema.mjs';

// Quality validation rules
export { qualitySourceRule } from './quality-source.mjs';

// Collect all rules for easy registration
import { entityLinkIdsRule } from './entitylink-ids.mjs';
import { dollarSignsRule } from './dollar-signs.mjs';
import { tildeDollarRule } from './tilde-dollar.mjs';
import { comparisonOperatorsRule } from './comparison-operators.mjs';
import { estimateBoxesRule } from './estimate-boxes.mjs';
import { placeholdersRule } from './placeholders.mjs';
import { internalLinksRule } from './internal-links.mjs';
import { componentRefsRule } from './component-refs.mjs';
import { preferEntityLinkRule } from './prefer-entitylink.mjs';
import { entityMentionsRule } from './entity-mentions.mjs';
import { sidebarCoverageRule } from './sidebar-coverage.mjs';
import { sidebarIndexRule } from './sidebar-index.mjs';
import { jsxInMdRule } from './jsx-in-md.mjs';
import { cruftFilesRule } from './cruft-files.mjs';
import { markdownListsRule } from './markdown-lists.mjs';
import { consecutiveBoldLabelsRule } from './consecutive-bold-labels.mjs';
import { frontmatterSchemaRule } from './frontmatter-schema.mjs';
import { qualitySourceRule } from './quality-source.mjs';

export const allRules = [
  // Content validation
  entityLinkIdsRule,
  dollarSignsRule,
  tildeDollarRule,
  comparisonOperatorsRule,
  estimateBoxesRule,
  placeholdersRule,
  internalLinksRule,
  componentRefsRule,
  preferEntityLinkRule,
  entityMentionsRule,

  // Sidebar/structure
  sidebarCoverageRule,
  sidebarIndexRule,

  // File-level
  jsxInMdRule,
  cruftFilesRule,

  // Markdown formatting
  markdownListsRule,
  consecutiveBoldLabelsRule,

  // Schema validation
  frontmatterSchemaRule,

  // Quality validation
  qualitySourceRule,
];

export default allRules;
