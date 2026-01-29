/**
 * Rule: EntityLink ID Validation
 *
 * Checks that all <EntityLink id="..."> components reference valid IDs
 * that exist in either the pathRegistry or entities database.
 *
 * This catches the issue where EntityLink IDs don't resolve, causing
 * the component to display ugly fallback text like "__index__ Ai Transition Model".
 */

import { createRule, Issue, Severity } from '../validation-engine.mjs';

export const entityLinkIdsRule = createRule({
  id: 'entitylink-ids',
  name: 'EntityLink ID Validation',
  description: 'Verify EntityLink IDs resolve to valid paths or entities',

  check(content, engine) {
    const issues = [];

    // Match <EntityLink id="..."> patterns
    const regex = /<EntityLink\s+[^>]*id=["']([^"']+)["'][^>]*>/g;
    let match;
    let lineNum = 0;
    const lines = content.body.split('\n');

    for (const line of lines) {
      lineNum++;
      regex.lastIndex = 0;

      while ((match = regex.exec(line)) !== null) {
        const id = match[1];

        // Check if ID exists in pathRegistry or entities
        const inPathRegistry = engine.pathRegistry && engine.pathRegistry[id];
        const inEntities = engine.entities && engine.entities[id];

        if (!inPathRegistry && !inEntities) {
          issues.push(new Issue({
            rule: this.id,
            file: content.path,
            line: lineNum,
            message: `EntityLink id="${id}" does not resolve to any known path or entity`,
            severity: Severity.ERROR,
          }));
        }
      }
    }

    return issues;
  },
});

export default entityLinkIdsRule;
