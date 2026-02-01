# Claude Code Documentation Index

Reference documentation for working with the longterm wiki.

## Documentation Files

| File | Purpose | Use When |
|------|---------|----------|
| [page-types.md](page-types.md) | Page type system (content, stub, documentation) | Deciding what type a new page should be |
| [content-quality.md](content-quality.md) | Rating system, TODOs, template requirements | Assessing or improving page quality |
| [cause-effect-graphs.md](cause-effect-graphs.md) | causeEffectGraph YAML schema | Adding causal diagrams to ATM entities |
| [mermaid-diagrams.md](mermaid-diagrams.md) | Mermaid diagram syntax | Adding flowcharts, sequences to pages |
| [resource-linking.md](resource-linking.md) | External resource management | Working with `<R>` components and citations |
| [knowledge-base-system.md](knowledge-base-system.md) | SQLite cache architecture | Understanding the data layer |

## Related Skills

Skills provide workflow guidance:
- `/improving-pages` - Improve existing wiki pages
- `/generating-content` - Create new wiki pages
- `/managing-resources` - Manage external resource links

## Quick Commands

All tools accessible via the unified `crux` CLI:

```bash
# Discover available commands
npm run crux -- --help              # List all domains
npm run crux -- validate --help     # List validate commands

# Common operations
npm run validate                    # Full validation suite
npm run precommit                   # Quick pre-commit checks
npm run crux -- analyze             # Wiki health report
npm run crux -- resources list      # Pages with unconverted links
npm run crux -- fix escaping        # Auto-fix dollar signs, comparisons
```
