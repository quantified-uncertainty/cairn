"use client"

import { Bug, Crosshair, Building2, Brain, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type RiskCategory = "accident" | "misuse" | "structural" | "epistemic"

interface CategoryConfig {
  icon: LucideIcon
  label: string
  description: string
  colors: {
    bg: string
    text: string
    border: string
    iconBg: string
  }
}

export const categoryConfig: Record<RiskCategory, CategoryConfig> = {
  accident: {
    icon: Bug,
    label: "Accident",
    description: "Technical failures where AI systems behave in unintended ways",
    colors: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-300 dark:border-amber-700",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
    },
  },
  misuse: {
    icon: Crosshair,
    label: "Misuse",
    description: "Intentional harmful applications by malicious actors",
    colors: {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-700 dark:text-red-300",
      border: "border-red-300 dark:border-red-700",
      iconBg: "bg-red-100 dark:bg-red-900/50",
    },
  },
  structural: {
    icon: Building2,
    label: "Structural",
    description: "Systemic risks from how AI reshapes society and institutions",
    colors: {
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-300 dark:border-indigo-700",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    },
  },
  epistemic: {
    icon: Brain,
    label: "Epistemic",
    description: "Risks to knowledge, truth, and collective understanding",
    colors: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      text: "text-purple-700 dark:text-purple-300",
      border: "border-purple-300 dark:border-purple-700",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
    },
  },
}

interface RiskCategoryIconProps {
  category: RiskCategory
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

export function RiskCategoryIcon({
  category,
  size = "md",
  showLabel = false,
  className
}: RiskCategoryIconProps) {
  const config = categoryConfig[category]
  if (!config) return null

  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn(sizeClasses[size], config.colors.text)} />
      {showLabel && (
        <span className={cn("text-sm font-medium", config.colors.text)}>
          {config.label}
        </span>
      )}
    </span>
  )
}

interface RiskCategoryBadgeProps {
  category: RiskCategory
  size?: "sm" | "md"
  className?: string
}

export function RiskCategoryBadge({ category, size = "md", className }: RiskCategoryBadgeProps) {
  const config = categoryConfig[category]
  if (!config) return null

  const Icon = config.icon
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
  const textSize = size === "sm" ? "text-xs" : "text-xs"
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5"

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded border font-medium",
      padding,
      textSize,
      config.colors.bg,
      config.colors.text,
      config.colors.border,
      className
    )}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  )
}

interface RiskCategoryCardProps {
  category: RiskCategory
  count?: number
  href?: string
  className?: string
}

export function RiskCategoryCard({ category, count, href, className }: RiskCategoryCardProps) {
  const config = categoryConfig[category]
  if (!config) return null

  const Icon = config.icon

  const content = (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-colors",
      config.colors.bg,
      config.colors.border,
      href && "hover:opacity-80 cursor-pointer",
      className
    )}>
      <div className={cn(
        "flex-shrink-0 p-2 rounded-lg",
        config.colors.iconBg
      )}>
        <Icon className={cn("w-5 h-5", config.colors.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn("font-semibold", config.colors.text)}>
            {config.label}
          </h3>
          {count !== undefined && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              config.colors.iconBg,
              config.colors.text
            )}>
              {count}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {config.description}
        </p>
      </div>
    </div>
  )

  if (href) {
    return <a href={href}>{content}</a>
  }

  return content
}

export default RiskCategoryIcon
