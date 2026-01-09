"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StatBoxProps {
  value: string | number
  label: string
  borderColor?: string
  className?: string
}

/**
 * Stat display box with border accent
 * Used in table summary sections (RisksTable, ParametersTable, PageIndex)
 */
export function StatBox({
  value,
  label,
  borderColor = "border-l-slate-500",
  className,
}: StatBoxProps) {
  return (
    <div className={cn("flex flex-col border-l-2 pl-3", borderColor, className)}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  )
}

/**
 * Primary stat (no border, first in row)
 */
export function PrimaryStatBox({
  value,
  label,
  className,
}: Omit<StatBoxProps, "borderColor">) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  )
}

/**
 * Stats summary row container
 */
export function StatsSummary({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-6 p-4 bg-muted/30 rounded-lg", className)}>
      {children}
    </div>
  )
}

export default StatBox
