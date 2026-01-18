"use client"

import * as React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"
import { pages, entities, getEntityHref, type Page } from "../../data"
import { getImportanceScoreColor, getQualityScoreColor, contentCategoryColors } from "./shared/style-config"

interface SimilarPage {
  id: string
  title: string
  path: string
  similarity: number
}

interface Attachment {
  id: string
  title: string
  type: string
  href: string
}

interface PageRow {
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

interface PageIndexProps {
  showSearch?: boolean
  filterCategory?: string
  maxItems?: number
  title?: string
}

// Filter presets for quick filtering
const filterPresets = [
  { id: "all", label: "All", filter: () => true },
  { id: "ai-transition-model", label: "AI Transition Model", filter: (p: PageRow) =>
    p.path.startsWith("/ai-transition-model/") || p.path.startsWith("/knowledge-base/research-reports/")
  },
  { id: "risks", label: "Risks", filter: (p: PageRow) => p.path.includes("/risks/") },
  { id: "responses", label: "Responses", filter: (p: PageRow) => p.path.includes("/responses/") },
  { id: "models", label: "Models", filter: (p: PageRow) => p.category === "models" && !p.path.startsWith("/ai-transition-model/") },
  { id: "knowledge-base", label: "Knowledge Base", filter: (p: PageRow) => p.path.startsWith("/knowledge-base/") },
] as const

function QualityCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", getQualityScoreColor(value))}>
      {Math.round(value)}
    </span>
  )
}

function ImportanceCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", getImportanceScoreColor(value))}>
      {Math.round(value)}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const colorClass = contentCategoryColors[category as keyof typeof contentCategoryColors] || contentCategoryColors.history
  const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')
  return (
    <span className={cn("inline-block px-2 py-0.5 rounded text-xs font-medium", colorClass)}>
      {displayName}
    </span>
  )
}

function GapScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>

  // Gap = importance - quality (both 0-100)
  // Positive = underdeveloped (needs work), Negative = over-developed
  const colorClass = value >= 20
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    : value >= 10
    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    : value >= 0
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {Math.round(value)}
    </span>
  )
}

function AgeDaysCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>

  // Color based on staleness
  const colorClass = value > 180
    ? "text-red-600 dark:text-red-400"
    : value > 90
    ? "text-orange-600 dark:text-orange-400"
    : value > 30
    ? "text-amber-600 dark:text-amber-400"
    : "text-muted-foreground"

  // Format: show days, or weeks/months for larger values
  let display: string
  if (value <= 14) {
    display = `${value}d`
  } else if (value <= 60) {
    display = `${Math.round(value / 7)}w`
  } else {
    display = `${Math.round(value / 30)}mo`
  }

  return (
    <span className={cn("text-sm tabular-nums", colorClass)}>
      {display}
    </span>
  )
}

function StructuralScoreCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>

  // Score out of 15: 10+ high, 6-9 medium, <6 low
  const colorClass = value >= 10
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    : value >= 6
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2.5rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {value}/15
    </span>
  )
}

function ConvertedLinksCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>

  // Green tones - more is better
  const colorClass = value >= 10
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
    : value >= 5
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {value}
    </span>
  )
}

function UnconvertedLinksCell({ value }: { value: number }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>

  // Color based on count: more links = more urgent
  const colorClass = value >= 10
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    : value >= 5
    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    : value >= 1
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "text-muted-foreground"

  return (
    <span className={cn("inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium", colorClass)}>
      {value}
    </span>
  )
}

function RedundancyCell({ value, similarPages }: { value: number, similarPages: SimilarPage[] }) {
  if (value === 0) return <span className="text-muted-foreground">—</span>

  // Color based on redundancy: higher = more concerning
  const colorClass = value >= 40
    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    : value >= 30
    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    : value >= 20
    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  const badge = (
    <span className={cn("inline-flex items-center justify-center min-w-[2.5rem] px-1 h-6 rounded text-sm font-medium", similarPages.length > 0 && "cursor-help", colorClass)}>
      {value}%
    </span>
  )

  if (similarPages.length === 0) {
    return badge
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {badge}
      </HoverCardTrigger>
      <HoverCardContent className="w-64 p-0" align="start">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b border-border">
          Similar pages:
        </div>
        <div className="flex flex-col">
          {similarPages.map((p, i) => (
            <a
              key={i}
              href={p.path}
              className="flex items-center justify-between px-3 py-2 text-sm no-underline hover:bg-muted transition-colors"
            >
              <span className="text-foreground truncate mr-2">{p.title}</span>
              <span className="font-semibold text-accent-foreground flex-shrink-0">{p.similarity}%</span>
            </a>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// Icon components for attachment types
function AttachmentIcon({ type }: { type: string }) {
  if (type === 'model') {
    return <span title="Model">📊</span>
  }
  if (type === 'research-report') {
    return <span title="Research Report">📄</span>
  }
  return <span title={type}>📎</span>
}

function AttachmentsCell({ attachments }: { attachments: Attachment[] }) {
  if (attachments.length === 0) return <span className="text-muted-foreground">—</span>

  // Group by type for display
  const models = attachments.filter(a => a.type === 'model')
  const reports = attachments.filter(a => a.type === 'research-report')
  const others = attachments.filter(a => a.type !== 'model' && a.type !== 'research-report')

  const badge = (
    <span className="inline-flex items-center gap-1 cursor-help">
      {models.length > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
          <AttachmentIcon type="model" />
          {models.length}
        </span>
      )}
      {reports.length > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
          <AttachmentIcon type="research-report" />
          {reports.length}
        </span>
      )}
      {others.length > 0 && (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs">
          <AttachmentIcon type="other" />
          {others.length}
        </span>
      )}
    </span>
  )

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {badge}
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-0" align="start">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-3 py-2 border-b border-border">
          Attachments:
        </div>
        <div className="flex flex-col max-h-48 overflow-y-auto">
          {attachments.map((a, i) => (
            <a
              key={i}
              href={a.href}
              className="flex items-center gap-2 px-3 py-2 text-sm no-underline hover:bg-muted transition-colors"
            >
              <AttachmentIcon type={a.type} />
              <span className="text-foreground truncate">{a.title}</span>
            </a>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const columns: ColumnDef<PageRow>[] = [
  {
    accessorKey: "importance",
    header: ({ column }) => <SortableHeader column={column}>Imp</SortableHeader>,
    cell: ({ row }) => <ImportanceCell value={row.getValue("importance")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("importance") as number | null
      const b = rowB.getValue("importance") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "quality",
    header: ({ column }) => <SortableHeader column={column}>Qual</SortableHeader>,
    cell: ({ row }) => <QualityCell value={row.getValue("quality")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("quality") as number | null
      const b = rowB.getValue("quality") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "structuralScore",
    header: ({ column }) => <SortableHeader column={column}>Struct</SortableHeader>,
    cell: ({ row }) => <StructuralScoreCell value={row.getValue("structuralScore")} />,
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
    cell: ({ row }) => <CategoryBadge category={row.getValue("category")} />,
  },
  {
    accessorKey: "attachments",
    header: () => <span>Attach</span>,
    cell: ({ row }) => <AttachmentsCell attachments={row.original.attachments} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.attachments.length
      const b = rowB.original.attachments.length
      return a - b
    },
  },
  {
    accessorKey: "wordCount",
    header: ({ column }) => <SortableHeader column={column}>Words</SortableHeader>,
    cell: ({ row }) => {
      const count = row.getValue("wordCount") as number
      // Format: show K for thousands
      const display = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toString()
      return <span className="text-sm text-muted-foreground tabular-nums">{display}</span>
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("wordCount") as number
      const b = rowB.getValue("wordCount") as number
      return a - b
    },
  },
  {
    accessorKey: "backlinkCount",
    header: ({ column }) => <SortableHeader column={column}>Links</SortableHeader>,
    cell: ({ row }) => {
      const count = row.getValue("backlinkCount") as number
      return <span className="text-sm text-muted-foreground tabular-nums">{count}</span>
    },
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("backlinkCount") as number
      const b = rowB.getValue("backlinkCount") as number
      return a - b
    },
  },
  {
    accessorKey: "gapScore",
    header: ({ column }) => <SortableHeader column={column}>Gap</SortableHeader>,
    cell: ({ row }) => <GapScoreCell value={row.getValue("gapScore")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("gapScore") as number | null
      const b = rowB.getValue("gapScore") as number | null
      return (a ?? -999) - (b ?? -999)
    },
  },
  {
    accessorKey: "ageDays",
    header: ({ column }) => <SortableHeader column={column}>Age</SortableHeader>,
    cell: ({ row }) => <AgeDaysCell value={row.getValue("ageDays")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("ageDays") as number | null
      const b = rowB.getValue("ageDays") as number | null
      return (a ?? -1) - (b ?? -1)
    },
  },
  {
    accessorKey: "convertedLinkCount",
    header: ({ column }) => <SortableHeader column={column}>Refs</SortableHeader>,
    cell: ({ row }) => <ConvertedLinksCell value={row.getValue("convertedLinkCount")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("convertedLinkCount") as number
      const b = rowB.getValue("convertedLinkCount") as number
      return a - b
    },
  },
  {
    accessorKey: "unconvertedLinkCount",
    header: ({ column }) => <SortableHeader column={column}>Unconv</SortableHeader>,
    cell: ({ row }) => <UnconvertedLinksCell value={row.getValue("unconvertedLinkCount")} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("unconvertedLinkCount") as number
      const b = rowB.getValue("unconvertedLinkCount") as number
      return a - b
    },
  },
  {
    accessorKey: "redundancyScore",
    header: ({ column }) => <SortableHeader column={column}>Dup</SortableHeader>,
    cell: ({ row }) => <RedundancyCell value={row.getValue("redundancyScore")} similarPages={row.original.similarPages} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.getValue("redundancyScore") as number
      const b = rowB.getValue("redundancyScore") as number
      return a - b
    },
  },
]

export function PageIndex({ showSearch = true, filterCategory, maxItems, title }: PageIndexProps) {
  const [activeFilter, setActiveFilter] = React.useState<string>("all")

  const data = React.useMemo(() => {
    const today = new Date()

    // Build lookup for entity relationships and research reports
    const entityMap = new Map(entities.map(e => [e.id, e]))
    const researchReportPages = pages.filter(p => p.path.startsWith("/knowledge-base/research-reports/"))
    const reportsByTopicId = new Map(researchReportPages.map(r => [r.id, r]))

    let result = pages.map(p => {
      const structuralScore = p.metrics?.structuralScore ?? null

      // Compute gap score: importance - quality (both 0-100 scale)
      // Higher = more important but lower quality = needs work
      // Positive gap = underdeveloped, negative gap = over-developed relative to importance
      const gapScore = (p.importance !== null && p.quality !== null)
        ? p.importance - p.quality
        : null

      // Compute age in days
      let ageDays: number | null = null
      if (p.lastUpdated) {
        const updated = new Date(p.lastUpdated)
        ageDays = Math.floor((today.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Compute attachments from entity relationships
      const attachments: Attachment[] = []
      const entity = entityMap.get(p.id)
      if (entity?.relatedEntries) {
        for (const rel of entity.relatedEntries) {
          if (rel.type === 'model') {
            const relatedEntity = entityMap.get(rel.id)
            attachments.push({
              id: rel.id,
              title: relatedEntity?.title || rel.id,
              type: 'model',
              href: getEntityHref(rel.id, rel.type),
            })
          }
        }
      }
      // Check if there's a research report for this page
      const report = reportsByTopicId.get(p.id)
      if (report && report.path !== p.path) {
        attachments.push({
          id: report.id,
          title: 'Research Report',
          type: 'research-report',
          href: report.path,
        })
      }

      return {
        id: p.id,
        path: p.path,
        title: p.title,
        category: p.category,
        quality: p.quality,
        importance: p.importance,
        lastUpdated: p.lastUpdated,
        wordCount: p.wordCount ?? 0,
        backlinkCount: p.backlinkCount ?? 0,
        gapScore,
        ageDays,
        structuralScore,
        convertedLinkCount: p.convertedLinkCount ?? 0,
        unconvertedLinkCount: p.unconvertedLinkCount ?? 0,
        redundancyScore: p.redundancy?.maxSimilarity ?? 0,
        similarPages: p.redundancy?.similarPages ?? [],
        attachments,
      }
    })

    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory)
    }

    // Apply preset filter
    const preset = filterPresets.find(f => f.id === activeFilter)
    if (preset && preset.id !== "all") {
      result = result.filter(preset.filter)
    }

    if (maxItems) {
      result = result.slice(0, maxItems)
    }

    return result
  }, [filterCategory, maxItems, activeFilter])

  const stats = React.useMemo(() => {
    // Quality ranges on 0-100 scale
    const byQualityRange = { "80+": 0, "60-79": 0, "40-59": 0, "20-39": 0, "<20": 0 }
    // Importance ranges: 90-100, 70-89, 50-69, 30-49, 0-29
    const byImportanceRange = { "90+": 0, "70-89": 0, "50-69": 0, "30-49": 0, "<30": 0 }
    let noQuality = 0
    let noImportance = 0
    let importanceSum = 0

    pages.forEach(p => {
      if (p.quality !== null && p.quality > 0) {
        if (p.quality >= 80) byQualityRange["80+"]++
        else if (p.quality >= 60) byQualityRange["60-79"]++
        else if (p.quality >= 40) byQualityRange["40-59"]++
        else if (p.quality >= 20) byQualityRange["20-39"]++
        else byQualityRange["<20"]++
      } else {
        noQuality++
      }
      if (p.importance !== null && p.importance >= 0) {
        importanceSum += p.importance
        if (p.importance >= 90) byImportanceRange["90+"]++
        else if (p.importance >= 70) byImportanceRange["70-89"]++
        else if (p.importance >= 50) byImportanceRange["50-69"]++
        else if (p.importance >= 30) byImportanceRange["30-49"]++
        else byImportanceRange["<30"]++
      } else {
        noImportance++
      }
    })

    const withImportance = pages.length - noImportance
    const avgImportance = withImportance > 0
      ? (importanceSum / withImportance).toFixed(1)
      : "—"

    return { total: pages.length, byQualityRange, byImportanceRange, noQuality, noImportance, withImportance, avgImportance }
  }, [])

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-bold">{title}</h2>}

      {/* Filter Presets */}
      <div className="flex flex-wrap gap-2">
        {filterPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setActiveFilter(preset.id)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
              activeFilter === preset.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-purple-500 pl-3">
          <span className="text-2xl font-bold">{stats.withImportance}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">With Importance</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-purple-400 pl-3">
          <span className="text-2xl font-bold">{stats.avgImportance}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg Importance</span>
        </div>
        <div className="flex flex-col border-l-2 border-l-emerald-500 pl-3">
          <span className="text-2xl font-bold">{stats.total - stats.noQuality}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">With Quality</span>
        </div>
      </div>

      {/* Column Legend */}
      <div className="text-sm text-muted-foreground bg-muted/20 rounded-lg px-4 py-3">
        <span className="font-medium text-foreground">Columns: </span>
        <span className="inline-flex flex-wrap gap-x-4 gap-y-1">
          <span><strong>Imp</strong> = Importance (0-100)</span>
          <span><strong>Qual</strong> = Quality (0-100)</span>
          <span><strong>Struct</strong> = Structural score (tables, diagrams, sections)</span>
          <span><strong>Attach</strong> = Related models and research reports</span>
          <span><strong>Words</strong> = Word count</span>
          <span><strong>Links</strong> = Backlinks from other pages</span>
          <span><strong>Gap</strong> = Priority score (high importance + low quality)</span>
          <span><strong>Age</strong> = Days since last edit</span>
          <span><strong>Refs</strong> = Resource references with hover tooltips</span>
          <span><strong>Unconv</strong> = Unconverted links (could have hover tooltips)</span>
          <span><strong>Dup</strong> = Max similarity to other pages (hover for list)</span>
        </span>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search pages..."
        defaultSorting={[{ id: "importance", desc: true }]}
      />
    </div>
  )
}

export default PageIndex
