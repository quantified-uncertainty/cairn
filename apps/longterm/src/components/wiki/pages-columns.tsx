"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { SortableHeader } from "@/components/ui/sortable-header"
import { cn } from "@/lib/utils"
import { getImportanceScoreColor, getQualityScoreColor, contentCategoryColors } from "./shared/style-config"

// Types
export interface SimilarPage {
  id: string
  title: string
  path: string
  similarity: number
}

export interface Attachment {
  id: string
  title: string
  type: string
  href: string
}

export interface PageRow {
  id: string
  path: string
  title: string
  category: string
  quality: number | null
  importance: number | null
  lastUpdated: string | null
  wordCount: number
  backlinkCount: number
  gapScore: number | null
  ageDays: number | null
  structuralScore: number | null
  convertedLinkCount: number
  unconvertedLinkCount: number
  redundancyScore: number
  similarPages: SimilarPage[]
  attachments: Attachment[]
}

// Filter presets for quick filtering
export const filterPresets = [
  { id: "all", label: "All", filter: () => true },
  { id: "ai-transition-model", label: "AI Transition Model", filter: (p: PageRow) =>
    p.path.startsWith("/ai-transition-model/") || p.path.startsWith("/knowledge-base/research-reports/")
  },
  { id: "risks", label: "Risks", filter: (p: PageRow) => p.path.includes("/risks/") },
  { id: "responses", label: "Responses", filter: (p: PageRow) => p.path.includes("/responses/") },
  { id: "models", label: "Models", filter: (p: PageRow) => p.category === "models" && !p.path.startsWith("/ai-transition-model/") },
  { id: "knowledge-base", label: "Knowledge Base", filter: (p: PageRow) => p.path.startsWith("/knowledge-base/") },
] as const

// Helper: format age display
function formatAge(days: number): string {
  if (days <= 14) return `${days}d`
  if (days <= 60) return `${Math.round(days / 7)}w`
  return `${Math.round(days / 30)}mo`
}

// Helper: format word count
function formatWordCount(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
}

// Column definitions
export const columns: ColumnDef<PageRow>[] = [
  {
    accessorKey: "importance",
    header: ({ column }) => <SortableHeader column={column} title="Importance (0-100)">Imp</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number | null>("importance")
      if (value === null) return <span className="text-muted-foreground">—</span>
      return (
        <span className={cn("inline-flex items-center justify-center min-w-8 px-1 h-6 rounded text-sm font-medium", getImportanceScoreColor(value))}>
          {Math.round(value)}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("importance") as number | null
      const b = rowB.getValue("importance") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "quality",
    header: ({ column }) => <SortableHeader column={column} title="Quality (0-100)">Qual</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number | null>("quality")
      if (value === null) return <span className="text-muted-foreground">—</span>
      return (
        <span className={cn("inline-flex items-center justify-center min-w-8 px-1 h-6 rounded text-sm font-medium", getQualityScoreColor(value))}>
          {Math.round(value)}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("quality") as number | null
      const b = rowB.getValue("quality") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "structuralScore",
    header: ({ column }) => <SortableHeader column={column} title="Structural score (tables, diagrams, sections)">Struct</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number | null>("structuralScore")
      if (value === null) return <span className="text-muted-foreground">—</span>
      const colorClass = value >= 10
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        : value >= 6
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      return (
        <span className={cn("inline-flex items-center justify-center min-w-10 px-1 h-6 rounded text-sm font-medium", colorClass)}>
          {value}/15
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("structuralScore") as number | null
      const b = rowB.getValue("structuralScore") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column}>Title</SortableHeader>,
    cell: ({ row }) => (
      <a href={row.original.path} className="text-primary hover:underline font-medium">
        {row.getValue("title")}
      </a>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader column={column}>Category</SortableHeader>,
    cell: ({ row }) => {
      const category = row.getValue<string>("category")
      const colorClass = contentCategoryColors[category as keyof typeof contentCategoryColors] || contentCategoryColors.history
      const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
      return <Badge variant="secondary" className={colorClass}>{displayName}</Badge>
    },
    filterFn: (row, id, value) => {
      if (!value || value === "all") return true
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: "attachments",
    header: () => (
      <div className="group relative inline-flex">
        <span>Attach</span>
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
          Related models and research reports
        </span>
      </div>
    ),
    cell: ({ row }) => {
      const attachments = row.original.attachments
      if (attachments.length === 0) return <span className="text-muted-foreground">—</span>

      const models = attachments.filter(a => a.type === 'model')
      const reports = attachments.filter(a => a.type === 'research-report')

      const badge = (
        <span className="inline-flex items-center gap-1 cursor-help">
          {models.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
              📊 {models.length}
            </span>
          )}
          {reports.length > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
              📄 {reports.length}
            </span>
          )}
        </span>
      )

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
          <HoverCardContent className="w-72 p-0" align="start">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b">
              Attachments:
            </div>
            <div className="flex flex-col max-h-48 overflow-y-auto">
              {attachments.map((a, i) => (
                <a key={i} href={a.href} className="flex items-center gap-2 px-3 py-2 text-sm no-underline hover:bg-muted">
                  {a.type === 'model' ? '📊' : a.type === 'research-report' ? '📄' : '📎'}
                  <span className="truncate">{a.title}</span>
                </a>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
    sortingFn: (rowA, rowB) => rowA.original.attachments.length - rowB.original.attachments.length,
  },
  {
    accessorKey: "wordCount",
    header: ({ column }) => <SortableHeader column={column} title="Word count">Words</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatWordCount(row.getValue("wordCount"))}
      </span>
    ),
    sortingFn: (rowA, rowB) => (rowA.getValue("wordCount") as number) - (rowB.getValue("wordCount") as number),
  },
  {
    accessorKey: "backlinkCount",
    header: ({ column }) => <SortableHeader column={column} title="Backlinks from other pages">Links</SortableHeader>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {row.getValue("backlinkCount")}
      </span>
    ),
    sortingFn: (rowA, rowB) => (rowA.getValue("backlinkCount") as number) - (rowB.getValue("backlinkCount") as number),
  },
  {
    accessorKey: "gapScore",
    header: ({ column }) => <SortableHeader column={column} title="Priority: Importance - Quality">Gap</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number | null>("gapScore")
      if (value === null) return <span className="text-muted-foreground">—</span>
      const colorClass = value >= 20
        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        : value >= 10
        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
        : value >= 0
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      return (
        <span className={cn("inline-flex items-center justify-center min-w-8 px-1 h-6 rounded text-sm font-medium", colorClass)}>
          {Math.round(value)}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("gapScore") as number | null
      const b = rowB.getValue("gapScore") as number | null
      return (a ?? -999) - (b ?? -999)
    },
  },
  {
    accessorKey: "ageDays",
    header: ({ column }) => <SortableHeader column={column} title="Days since last edit">Age</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number | null>("ageDays")
      if (value === null) return <span className="text-muted-foreground">—</span>
      const colorClass = value > 180
        ? "text-red-600 dark:text-red-400"
        : value > 90
        ? "text-orange-600 dark:text-orange-400"
        : value > 30
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground"
      return <span className={cn("text-sm tabular-nums", colorClass)}>{formatAge(value)}</span>
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("ageDays") as number | null
      const b = rowB.getValue("ageDays") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "convertedLinkCount",
    header: ({ column }) => <SortableHeader column={column} title="Resource references with hover tooltips">Refs</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number>("convertedLinkCount")
      if (value === 0) return <span className="text-muted-foreground">—</span>
      const colorClass = value >= 10
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
        : value >= 5
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
      return (
        <span className={cn("inline-flex items-center justify-center min-w-8 px-1 h-6 rounded text-sm font-medium", colorClass)}>
          {value}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => (rowA.getValue("convertedLinkCount") as number) - (rowB.getValue("convertedLinkCount") as number),
  },
  {
    accessorKey: "unconvertedLinkCount",
    header: ({ column }) => <SortableHeader column={column} title="Unconverted links (could have hover tooltips)">Unconv</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number>("unconvertedLinkCount")
      if (value === 0) return <span className="text-muted-foreground">—</span>
      const colorClass = value >= 10
        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        : value >= 5
        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      return (
        <span className={cn("inline-flex items-center justify-center min-w-8 px-1 h-6 rounded text-sm font-medium", colorClass)}>
          {value}
        </span>
      )
    },
    sortingFn: (rowA, rowB) => (rowA.getValue("unconvertedLinkCount") as number) - (rowB.getValue("unconvertedLinkCount") as number),
  },
  {
    accessorKey: "redundancyScore",
    header: ({ column }) => <SortableHeader column={column} title="Max similarity to other pages (hover for list)">Dup</SortableHeader>,
    cell: ({ row }) => {
      const value = row.getValue<number>("redundancyScore")
      const similarPages = row.original.similarPages
      if (value === 0) return <span className="text-muted-foreground">—</span>

      const colorClass = value >= 40
        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        : value >= 30
        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
        : value >= 20
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

      const badge = (
        <span className={cn("inline-flex items-center justify-center min-w-10 px-1 h-6 rounded text-sm font-medium", similarPages.length > 0 && "cursor-help", colorClass)}>
          {value}%
        </span>
      )

      if (similarPages.length === 0) return badge

      return (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>{badge}</HoverCardTrigger>
          <HoverCardContent className="w-64 p-0" align="start">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b">
              Similar pages:
            </div>
            <div className="flex flex-col">
              {similarPages.map((p, i) => (
                <a key={i} href={p.path} className="flex items-center justify-between px-3 py-2 text-sm no-underline hover:bg-muted">
                  <span className="truncate mr-2">{p.title}</span>
                  <span className="font-semibold shrink-0">{p.similarity}%</span>
                </a>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
    sortingFn: (rowA, rowB) => (rowA.getValue("redundancyScore") as number) - (rowB.getValue("redundancyScore") as number),
  },
]
