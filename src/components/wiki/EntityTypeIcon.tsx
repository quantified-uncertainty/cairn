"use client"

import {
  Bug,
  User,
  Scale,
  Cpu,
  Wrench,
  Shield,
  Building2,
  FlaskConical,
  HelpCircle,
  Clock,
  BookOpen,
  GraduationCap,
  BarChart3,
  Rocket,
  ClipboardList,
  Route,
  Banknote,
  Microscope,
  Gauge,
  AlertTriangle,
  Lightbulb,
  Box,
  Activity,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type EntityType =
  | "risk"
  | "risk-factor"
  | "capability"
  | "safety-agenda"
  | "intervention"
  | "policy"
  | "organization"
  | "lab"
  | "lab-frontier"
  | "lab-research"
  | "lab-startup"
  | "lab-academic"
  | "crux"
  | "concept"
  | "case-study"
  | "researcher"
  | "scenario"
  | "resource"
  | "funder"
  | "historical"
  | "analysis"
  | "model"
  | "parameter"
  | "metric"

interface EntityTypeConfig {
  icon: LucideIcon
  label: string
  color: string
}

export const entityTypeConfig: Record<EntityType, EntityTypeConfig> = {
  risk: {
    icon: Bug,
    label: "Risk",
    color: "text-amber-600 dark:text-amber-400",
  },
  "risk-factor": {
    icon: AlertTriangle,
    label: "Risk Factor",
    color: "text-orange-600 dark:text-orange-400",
  },
  capability: {
    icon: Cpu,
    label: "Capability",
    color: "text-blue-600 dark:text-blue-400",
  },
  "safety-agenda": {
    icon: Shield,
    label: "Safety Agenda",
    color: "text-green-600 dark:text-green-400",
  },
  intervention: {
    icon: Wrench,
    label: "Intervention",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  policy: {
    icon: Scale,
    label: "Policy",
    color: "text-violet-600 dark:text-violet-400",
  },
  organization: {
    icon: Building2,
    label: "Organization",
    color: "text-slate-600 dark:text-slate-400",
  },
  lab: {
    icon: FlaskConical,
    label: "Lab",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  "lab-frontier": {
    icon: Rocket,
    label: "Frontier Lab",
    color: "text-orange-600 dark:text-orange-400",
  },
  "lab-research": {
    icon: Microscope,
    label: "Research Lab",
    color: "text-teal-600 dark:text-teal-400",
  },
  "lab-startup": {
    icon: Rocket,
    label: "Startup Lab",
    color: "text-pink-600 dark:text-pink-400",
  },
  "lab-academic": {
    icon: GraduationCap,
    label: "Academic Lab",
    color: "text-indigo-600 dark:text-indigo-400",
  },
  crux: {
    icon: HelpCircle,
    label: "Crux",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  concept: {
    icon: Lightbulb,
    label: "Concept",
    color: "text-amber-500 dark:text-amber-300",
  },
  "case-study": {
    icon: ClipboardList,
    label: "Case Study",
    color: "text-stone-600 dark:text-stone-400",
  },
  researcher: {
    icon: User,
    label: "Researcher",
    color: "text-sky-600 dark:text-sky-400",
  },
  scenario: {
    icon: Route,
    label: "Scenario",
    color: "text-purple-600 dark:text-purple-400",
  },
  resource: {
    icon: BookOpen,
    label: "Resource",
    color: "text-lime-600 dark:text-lime-400",
  },
  funder: {
    icon: Banknote,
    label: "Funder",
    color: "text-green-600 dark:text-green-400",
  },
  historical: {
    icon: Clock,
    label: "Historical",
    color: "text-amber-600 dark:text-amber-400",
  },
  analysis: {
    icon: BarChart3,
    label: "Analysis",
    color: "text-rose-600 dark:text-rose-400",
  },
  model: {
    icon: Box,
    label: "Model",
    color: "text-indigo-600 dark:text-indigo-400",
  },
  parameter: {
    icon: Gauge,
    label: "Parameter",
    color: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  metric: {
    icon: Activity,
    label: "Metric",
    color: "text-cyan-600 dark:text-cyan-400",
  },
}

interface EntityTypeIconProps {
  type: EntityType | string
  size?: "xs" | "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

export function EntityTypeIcon({
  type,
  size = "md",
  showLabel = false,
  className,
}: EntityTypeIconProps) {
  const config = entityTypeConfig[type as EntityType]
  if (!config) {
    return showLabel ? <span className="text-muted-foreground">{type}</span> : null
  }

  const Icon = config.icon

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className={cn(sizeClasses[size], config.color)} />
      {showLabel && (
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </span>
  )
}

interface EntityTypeBadgeProps {
  type: EntityType | string
  size?: "xs" | "sm" | "md"
  className?: string
}

export function EntityTypeBadge({ type, size = "sm", className }: EntityTypeBadgeProps) {
  const config = entityTypeConfig[type as EntityType]
  if (!config) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
        {type}
      </span>
    )
  }

  const Icon = config.icon
  const iconSize = size === "xs" ? "w-2.5 h-2.5" : size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"
  const textSize = size === "xs" ? "text-[10px]" : "text-xs"
  const padding = size === "xs" ? "px-1 py-0.5" : size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-medium bg-muted/50",
        padding,
        textSize,
        config.color,
        className
      )}
    >
      <Icon className={iconSize} />
      {config.label}
    </span>
  )
}

export function getEntityTypeIcon(type: EntityType | string): LucideIcon | null {
  const config = entityTypeConfig[type as EntityType]
  return config?.icon || null
}

export function getEntityTypeLabel(type: EntityType | string): string {
  const config = entityTypeConfig[type as EntityType]
  return config?.label || type
}

export default EntityTypeIcon
