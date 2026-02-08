import Link from "next/link";
import { getBacklinksFor, getEntityById, getEntityHref, getPageById } from "@/data";
import type { Entity } from "@/data";

interface RelatedPageItem {
  id: string;
  title: string;
  href: string;
  type: string;
  relationship?: string;
}

function dedup(items: RelatedPageItem[]): RelatedPageItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function RelatedPages({
  entityId,
  entity,
}: {
  entityId: string;
  entity?: Entity | null;
}) {
  const items: RelatedPageItem[] = [];

  // From entity relatedEntries
  if (entity?.relatedEntries) {
    for (const entry of entity.relatedEntries) {
      const related = getEntityById(entry.id);
      items.push({
        id: entry.id,
        title: related?.title || entry.id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        href: getEntityHref(entry.id, entry.type),
        type: entry.type,
        relationship: entry.relationship,
      });
    }
  }

  // From backlinks
  const backlinks = getBacklinksFor(entityId);
  for (const bl of backlinks) {
    items.push({
      id: bl.id,
      title: bl.title,
      href: bl.href,
      type: bl.type,
      relationship: bl.relationship,
    });
  }

  const unique = dedup(items);
  if (unique.length === 0) return null;

  // Group by type
  const grouped = new Map<string, RelatedPageItem[]>();
  for (const item of unique) {
    const group = grouped.get(item.type) || [];
    group.push(item);
    grouped.set(item.type, group);
  }

  return (
    <section className="mt-12 pt-6 border-t border-border">
      <h2 className="text-lg font-semibold mb-4">Related Pages</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
        {unique.slice(0, 20).map((item) => (
          <div key={item.id} className="flex items-center gap-2 py-1.5">
            <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              {item.type.replace("-", " ")}
            </span>
            <Link
              href={item.href}
              className="text-sm text-accent-foreground no-underline hover:underline truncate"
            >
              {item.title}
            </Link>
          </div>
        ))}
      </div>
      {unique.length > 20 && (
        <p className="text-sm text-muted-foreground mt-2">
          and {unique.length - 20} more...
        </p>
      )}
    </section>
  );
}
