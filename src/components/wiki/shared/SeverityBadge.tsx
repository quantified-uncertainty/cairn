"use client"

import { Badge } from "./Badge"
import { EmptyCell } from "./EmptyCell"
import type { BadgeVariant } from "./style-config"

interface SeverityBadgeProps {
  severity: string | undefined | null
}

/**
 * Gets badge variant based on severity level
 */
function getSeverityVariant(severity: string): BadgeVariant {
  const normalized = severity.toLowerCase()
  if (normalized.includes("catastrophic") || normalized.includes("critical")) return "danger"
  if (normalized.includes("high") && !normalized.includes("medium")) return "warning"
  if (normalized.includes("medium")) return "info"
  if (normalized.includes("low")) return "success"
  return "default"
}

/**
 * Displays a severity badge with color-coded variant
 */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (!severity) return <EmptyCell />

  return <Badge variant={getSeverityVariant(severity)}>{severity}</Badge>
}

export default SeverityBadge
