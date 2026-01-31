# Resource Linking

Use the `<R>` component to link to external resources with hover tooltips and bidirectional tracking.

## Usage in MDX

```mdx
import {R} from '../../../../components/wiki';

<!-- Basic usage - auto-fetches title from resource database -->
<R id="11ac11c30d3ab901" />

<!-- With custom label -->
<R id="11ac11c30d3ab901">Accident reports</R>

<!-- In tables -->
| Finding | Source |
|---------|--------|
| Pilots struggle | <R id="a9d7143ed49b479f">FAA studies</R> |
```

## Benefits

- **Hover tooltips**: Shows title, authors, summary on hover
- **Bidirectional links**: Resource pages show "Cited By" articles
- **Stable IDs**: Links don't break when URLs change
- **View details link**: Each resource has a detail page at `/browse/resources/{id}/`

## Finding Resource IDs

Use the resource manager to find which URLs in an MDX file have matching resource IDs:

```bash
npm run resources list                        # List pages with unconverted links
npm run resources -- show expertise-atrophy   # Show unconverted links in specific file
```

Output shows convertible links that can be changed to `<R>` components.

## Adding Article Sources Section

To show all resources cited by an article, add at the end of the MDX:

```mdx
import {ArticleSources} from '../../../../components/wiki';

<ArticleSources entityId="expertise-atrophy" client:load />
```

## Workflow for AI Content Generation

1. When citing an external source, check if URL exists in `src/data/resources/`
2. If yes, use `<R id="{hash}">Label</R>` instead of markdown link
3. If no, use standard markdown link `[Label](url)` — it will be tracked by the scan script
4. Add `<ArticleSources entityId="..." />` at end of articles to show all cited resources

## Resource Manager Commands

```bash
npm run resources list                              # List pages with unconverted links
npm run resources -- show bioweapons               # Show unconverted links in file
npm run resources -- process lock-in --apply       # Convert links to <R> components
npm run resources -- metadata stats                # Show metadata coverage statistics
npm run resources -- metadata all                  # Extract metadata from all sources
npm run resources -- rebuild-citations             # Rebuild cited_by relationships
```
