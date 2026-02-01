# Archived Obsolete Validators

These validators have been replaced by the unified validation engine rules in `scripts/lib/rules/`.

## Replaced by Rules

| Archived Script | Replaced By Rule |
|-----------------|------------------|
| validate-dollar-signs.mjs | `dollar-signs` |
| validate-comparison-operators.mjs | `comparison-operators` |
| validate-tilde-dollar.mjs | `tilde-dollar` |
| validate-markdown-lists.mjs | `markdown-lists` |
| validate-consecutive-bold-labels.mjs | `consecutive-bold-labels` |
| validate-estimate-boxes.mjs | `estimate-boxes` |
| validate-placeholders.mjs | `placeholders` |
| validate-frontmatter-schema.mjs | `frontmatter-schema` |
| validate-entity-mentions.mjs | `entity-mentions` |

## Other Archived

| Script | Reason |
|--------|--------|
| validate-diagrams.mjs | Validates .mmd files - no longer used |
| validate-content-schema.mjs | Covered by frontmatter-schema rule |
| fix-prefer-entitylink.mjs | Replaced by validate-entity-links.mjs --fix |

## Using Unified Rules Instead

```bash
# Run specific rules via crux
npm run crux -- validate unified --rules=dollar-signs,markdown-lists

# Auto-fix
npm run crux -- validate unified --rules=dollar-signs --fix

# List all available rules
npm run crux -- validate unified --list
```
