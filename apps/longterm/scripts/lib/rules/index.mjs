/**
 * Validation Rules Index
 *
 * Central export for all validation rules.
 * Add new rules here to make them available to the validation engine.
 */

// New rules (from recent session findings)
export { entityLinkIdsRule } from './entitylink-ids.mjs';
export { sidebarCoverageRule } from './sidebar-coverage.mjs';
export { jsxInMdRule } from './jsx-in-md.mjs';
export { cruftFilesRule } from './cruft-files.mjs';

// Collect all rules for easy registration
import { entityLinkIdsRule } from './entitylink-ids.mjs';
import { sidebarCoverageRule } from './sidebar-coverage.mjs';
import { jsxInMdRule } from './jsx-in-md.mjs';
import { cruftFilesRule } from './cruft-files.mjs';

export const allRules = [
  entityLinkIdsRule,
  sidebarCoverageRule,
  jsxInMdRule,
  cruftFilesRule,
];

export default allRules;
