"use client"

import { cn } from "@/lib/utils"
import { getTrendTextColor } from "./style-config"
import { EmptyCell } from "./EmptyCell"

interface TrendCellProps {
  trend: string | undefined | null
  className?: string
}

/**
 * Displays a trend value with color-coded text
 * Red for negative trends, green for positive, amber for mixed
 */
export function TrendCell({ trend, className }: TrendCellProps) {
  if (!trend) return <EmptyCell />

  return (
    <span className={cn("text-sm", getTrendTextColor(trend), className)}>
      {trend}
    </span>
  )
}

export default TrendCell
