"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Resource } from "@/data/schema"
import { getResourceCredibility, getResourcePublication } from "@/data"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CredibilityBadge } from "./CredibilityBadge"
import { ResourceTags } from "./ResourceTags"
import { cn } from "@/lib/utils"
import {
  getResourceTypeLabel,
  getResourceTypeIcon,
  resourceTypeBadgeColors,
} from "./shared/style-config"

/**
 * Get content status for a resource
 */
export function getContentStatus(resource: Resource): {
  level: "full" | "partial" | "metadata" | "none"
  label: string
  variant: "default" | "secondary" | "outline"
} {
  const hasLocalFile = !!resource.local_filename
  const hasSummary = !!resource.summary
  const hasReview = !!resource.review
  const hasAbstract = !!resource.abstract
  const hasKeyPoints = resource.key_points && resource.key_points.length > 0

  if (hasLocalFile && hasReview && hasKeyPoints) {
    return { level: "full", label: "Full", variant: "default" }
  }
  if (hasSummary || hasAbstract) {
    return { level: "partial", label: "Summary", variant: "secondary" }
  }
  if (resource.authors?.length || resource.published_date) {
    return { level: "metadata", label: "Metadata", variant: "outline" }
  }
  return { level: "none", label: "None", variant: "outline" }
}

// Column definitions
export const columns: ColumnDef<Resource>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column}>Type</SortableHeader>,
    cell: ({ row }) => {
      const type = row.getValue<string>("type")
      return (
        <Badge
          variant="secondary"
          className={cn(
            "gap-1",
            resourceTypeBadgeColors[type] || "bg-muted text-foreground"
          )}
        >
          {getResourceTypeIcon(type)} {getResourceTypeLabel(type)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
    cell: ({ row }) => {
      const resource = row.original
      const publication = getResourcePublication(resource)
      return (
        <div className="max-w-md">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            {resource.title}
          </a>
          {publication && (
            <span className="block text-[11px] text-muted-foreground italic">
              {publication.name}
            </span>
          )}
          {resource.summary && (
            <p className="mt-1 mb-0 text-xs text-muted-foreground line-clamp-2">
              {resource.summary}
            </p>
          )}
        </div>
      )
    },
  },
  {
    id: "credibility",
    accessorFn: (row) => getResourceCredibility(row),
    header: ({ column }) => <SortableHeader column={column}>Credibility</SortableHeader>,
    cell: ({ row }) => {
      const credibility = getResourceCredibility(row.original)
      return credibility ? (
        <CredibilityBadge level={credibility} size="sm" />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      return getResourceCredibility(row.original) === Number(value)
    },
  },
  {
    id: "content",
    accessorFn: (row) => getContentStatus(row).level,
    header: ({ column }) => <SortableHeader column={column}>Content</SortableHeader>,
    cell: ({ row }) => {
      const status = getContentStatus(row.original)
      return <Badge variant={status.variant}>{status.label}</Badge>
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      return getContentStatus(row.original).level === value
    },
    sortingFn: (rowA, rowB) => {
      const order = { full: 0, partial: 1, metadata: 2, none: 3 }
      return order[getContentStatus(rowA.original).level] - order[getContentStatus(rowB.original).level]
    },
  },
  {
    accessorKey: "authors",
    header: "Authors",
    cell: ({ row }) => {
      const authors = row.getValue<string[] | undefined>("authors")
      return authors?.length ? (
        <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
          {authors.join(", ")}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "published_date",
    header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {row.getValue<string>("published_date") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue<string[] | undefined>("tags")
      return tags?.length ? (
        <ResourceTags tags={tags} limit={2} size="sm" />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "cited_by",
    header: "Cited By",
    cell: ({ row }) => {
      const citedBy = row.getValue<string[] | null>("cited_by")
      return citedBy?.length ? (
        <span title={citedBy.join(", ")}>
          {citedBy.length} article{citedBy.length !== 1 ? "s" : ""}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const aLen = (rowA.getValue("cited_by") as string[] | null)?.length ?? 0
      const bLen = (rowB.getValue("cited_by") as string[] | null)?.length ?? 0
      return aLen - bLen
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button variant="outline" size="sm" asChild>
        <a href={`/browse/resources/${row.original.id}/`}>View</a>
      </Button>
    ),
    enableSorting: false,
  },
]
