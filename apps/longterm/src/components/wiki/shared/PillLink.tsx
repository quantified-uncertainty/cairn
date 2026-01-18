"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { badgeVariants, type BadgeVariant } from "./style-config"

interface PillLinkProps {
  href: string
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

/**
 * Styled pill/badge link for tables and lists
 * Used in RisksTable, ParametersTable for related items
 */
export function PillLink({
  href,
  variant = "default",
  className,
  children,
}: PillLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors hover:opacity-80",
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Risk pill (red theme)
 */
export function RiskPillLink({ href, children, className }: Omit<PillLinkProps, "variant">) {
  return (
    <a
      href={href}
      className={cn(
        "inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors",
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50",
        className
      )}
    >
      {children}
    </a>
  )
}

/**
 * Intervention/solution pill (green theme)
 */
export function InterventionPillLink({ href, children, className }: Omit<PillLinkProps, "variant">) {
  return (
    <a
      href={href}
      className={cn(
        "inline-block px-2 py-0.5 rounded text-xs font-medium transition-colors",
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50",
        className
      )}
    >
      {children}
    </a>
  )
}

export default PillLink
