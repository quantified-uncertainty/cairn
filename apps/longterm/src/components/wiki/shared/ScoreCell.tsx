"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getImportanceScoreColor, getQualityScoreColor } from "./style-config"

interface ScoreCellProps {
  value: number | null
  getColor?: (value: number) => string
  format?: (value: number) => string
  emptyText?: string
  className?: string
}

/**
 * Generic score cell for displaying numeric values with color coding
 */
export function ScoreCell({
  value,
  getColor = getImportanceScoreColor,
  format = (v) => Math.round(v).toString(),
  emptyText = "—",
  className,
}: ScoreCellProps) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">{emptyText}</span>
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[2rem] px-1 h-6 rounded text-sm font-medium",
        getColor(value),
        className
      )}
    >
      {format(value)}
    </span>
  )
}

/**
 * Pre-configured score cell for importance values (0-100)
 */
export function ImportanceScoreCell({ value, className }: { value: number | null; className?: string }) {
  return <ScoreCell value={value} getColor={getImportanceScoreColor} className={className} />
}

/**
 * Pre-configured score cell for quality values (0-100)
 */
export function QualityScoreCell({ value, className }: { value: number | null; className?: string }) {
  return <ScoreCell value={value} getColor={getQualityScoreColor} className={className} />
}

/**
 * Score cell with percentage display
 */
export function PercentScoreCell({ value, className }: { value: number | null; className?: string }) {
  return (
    <ScoreCell
      value={value}
      getColor={getImportanceScoreColor}
      format={(v) => `${Math.round(v)}%`}
      className={className}
    />
  )
}

export default ScoreCell
