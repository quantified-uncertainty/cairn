/**
 * Centralized Style Configuration
 *
 * This file consolidates all repeated style mappings across wiki components.
 * Import from here instead of defining locally in each component.
 */

// ============================================================================
// BADGE VARIANTS - Reusable badge color schemes
// ============================================================================

export const badgeVariants = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  info: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

// ============================================================================
// RISK CATEGORIES - Colors and config for risk types
// ============================================================================

export const riskCategoryColors = {
  accident: {
    variant: "warning" as BadgeVariant,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-700",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    borderColor: "border-l-amber-500",
    hex: "#f59e0b",
  },
  misuse: {
    variant: "danger" as BadgeVariant,
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-300 dark:border-red-700",
    iconBg: "bg-red-100 dark:bg-red-900/50",
    borderColor: "border-l-red-500",
    hex: "#ef4444",
  },
  structural: {
    variant: "info" as BadgeVariant,
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-300 dark:border-indigo-700",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/50",
    borderColor: "border-l-indigo-500",
    hex: "#6366f1",
  },
  epistemic: {
    variant: "purple" as BadgeVariant,
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-300 dark:border-purple-700",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    borderColor: "border-l-slate-500",
    hex: "#a855f7",
  },
} as const;

export type RiskCategory = keyof typeof riskCategoryColors;

// ============================================================================
// PARAMETER CATEGORIES - Colors for parameter types
// ============================================================================

export const parameterCategoryColors = {
  alignment: {
    variant: "purple" as BadgeVariant,
    color: "border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300",
    activeColor: "bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/50 dark:border-purple-500 dark:text-purple-200",
    borderColor: "border-l-purple-500",
  },
  governance: {
    variant: "blue" as BadgeVariant,
    color: "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300",
    activeColor: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-200",
    borderColor: "border-l-blue-500",
  },
  societal: {
    variant: "success" as BadgeVariant,
    color: "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300",
    activeColor: "bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/50 dark:border-emerald-500 dark:text-emerald-200",
    borderColor: "border-l-emerald-500",
  },
  resilience: {
    variant: "warning" as BadgeVariant,
    color: "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300",
    activeColor: "bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/50 dark:border-amber-500 dark:text-amber-200",
    borderColor: "border-l-amber-500",
  },
} as const;

export type ParameterCategory = keyof typeof parameterCategoryColors;

// ============================================================================
// IMPORTANCE LEVELS - For cruxes and other ranked items
// ============================================================================

export const importanceColors = {
  critical: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-600",
    bgLight: "bg-red-100 dark:bg-red-900/30",
    label: "★★★",
  },
  high: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-600",
    bgLight: "bg-orange-100 dark:bg-orange-900/30",
    label: "★★☆",
  },
  medium: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500",
    bgLight: "bg-yellow-100 dark:bg-yellow-900/30",
    label: "★☆☆",
  },
  low: {
    color: "text-lime-600 dark:text-lime-400",
    bg: "bg-gray-500",
    bgLight: "bg-gray-100 dark:bg-gray-900/30",
    label: "☆☆☆",
  },
} as const;

export type ImportanceLevel = keyof typeof importanceColors;

// ============================================================================
// SEVERITY LEVELS - For risk severity ratings
// ============================================================================

export const severityColors = {
  low: { hex: "#22c55e", variant: "success" as BadgeVariant },
  medium: { hex: "#eab308", variant: "warning" as BadgeVariant },
  high: { hex: "#f97316", variant: "warning" as BadgeVariant },
  catastrophic: { hex: "#dc2626", variant: "danger" as BadgeVariant },
  critical: { hex: "#dc2626", variant: "danger" as BadgeVariant },
} as const;

export type SeverityLevel = keyof typeof severityColors;

// ============================================================================
// DIRECTION INDICATORS - For parameters showing higher/lower preference
// ============================================================================

export const directionColors = {
  higher: { icon: "▲", color: "#10b981", variant: "success" as BadgeVariant },
  lower: { icon: "▼", color: "#3b82f6", variant: "info" as BadgeVariant },
  context: { icon: "◆", color: "#f59e0b", variant: "warning" as BadgeVariant },
} as const;

export const directionLabels = {
  higher: {
    icon: "▲",
    text: "Higher is better",
    iconColor: "text-emerald-500 dark:text-emerald-400",
    textColor: "text-slate-600 dark:text-slate-400",
  },
  lower: {
    icon: "▼",
    text: "Lower is better",
    iconColor: "text-blue-500 dark:text-blue-400",
    textColor: "text-slate-600 dark:text-slate-400",
  },
  context: {
    icon: "◆",
    text: "Context-dependent",
    iconColor: "text-amber-500 dark:text-amber-400",
    textColor: "text-slate-600 dark:text-slate-400",
  },
} as const;

export type Direction = keyof typeof directionColors;

// ============================================================================
// MATURITY LEVELS - For response/intervention maturity
// ============================================================================

export const maturityColors = {
  neglected: { hex: "#ef4444", variant: "danger" as BadgeVariant },
  emerging: { hex: "#f59e0b", variant: "warning" as BadgeVariant },
  growing: { hex: "#3b82f6", variant: "info" as BadgeVariant },
  established: { hex: "#22c55e", variant: "success" as BadgeVariant },
} as const;

export type MaturityLevel = keyof typeof maturityColors;

// ============================================================================
// CAUSAL LEVELS - For risk causal classification
// ============================================================================

export const causalLevelColors = {
  outcome: { label: "Outcome", variant: "danger" as BadgeVariant },
  pathway: { label: "Pathway", variant: "warning" as BadgeVariant },
  amplifier: { label: "Amplifier", variant: "info" as BadgeVariant },
} as const;

export type CausalLevel = keyof typeof causalLevelColors;

// ============================================================================
// PAGE/CONTENT CATEGORIES - For PageIndex and similar
// ============================================================================

export const contentCategoryColors = {
  risks: badgeVariants.danger,
  responses: badgeVariants.success,
  models: badgeVariants.info,
  capabilities: badgeVariants.purple,
  cruxes: badgeVariants.warning,
  history: badgeVariants.default,
  organizations: badgeVariants.blue,
  people: badgeVariants.cyan,
} as const;

export type ContentCategory = keyof typeof contentCategoryColors;

// ============================================================================
// RESOLVABILITY LABELS - For crux resolvability
// ============================================================================

export const resolvabilityLabels = {
  soon: "< 2 years",
  years: "2-10 years",
  decades: "10+ years",
  unclear: "Unclear",
  never: "May never resolve",
} as const;

export type Resolvability = keyof typeof resolvabilityLabels;

// ============================================================================
// NUMERIC SCALE COLORS - For importance and quality scores (0-100)
// ============================================================================

export function getImportanceScoreColor(value: number): string {
  if (value >= 90) return "bg-purple-200 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200";
  if (value >= 70) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
  if (value >= 50) return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
  if (value >= 30) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function getQualityScoreColor(value: number): string {
  // 0-100 scale: 80+ comprehensive, 60-79 good, 40-59 adequate, 20-39 draft, <20 stub
  if (value >= 80) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (value >= 60) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  if (value >= 40) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  if (value >= 20) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

// ============================================================================
// SHARED LAYOUT CLASSES - Common Tailwind patterns
// ============================================================================

export const layoutClasses = {
  cardHeader: "flex items-center gap-2 px-4 py-3 bg-muted border-b border-border",
  cardHeaderAccent: "flex items-center gap-2 px-4 py-3 bg-gradient-to-r text-white",
  section: "px-4 py-3 border-b border-border",
  row: "flex items-center justify-between py-2",
  tableCell: "px-3 py-2 text-sm",
} as const;

// ============================================================================
// RESOURCE TYPES - Labels, icons, and colors for resource types
// ============================================================================

export const resourceTypeLabels: Record<string, string> = {
  paper: 'Paper',
  book: 'Book',
  blog: 'Blog Post',
  report: 'Report',
  talk: 'Talk',
  podcast: 'Podcast',
  government: 'Government',
  reference: 'Reference',
  web: 'Web',
};

export const resourceTypeIcons: Record<string, string> = {
  paper: '📄',
  book: '📚',
  blog: '✏️',
  report: '📋',
  talk: '🎤',
  podcast: '🎧',
  government: '🏛️',
  reference: '📖',
  web: '🔗',
};

export const resourceTypeBadgeColors: Record<string, string> = {
  paper: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  book: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  blog: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  report: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  government: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export function getResourceTypeLabel(type: string): string {
  return resourceTypeLabels[type] || 'Link';
}

export function getResourceTypeIcon(type: string): string {
  return resourceTypeIcons[type] || '🔗';
}

// ============================================================================
// SORTING ORDER CONFIGS - For table sorting functions
// ============================================================================

export const severitySortOrder: Record<string, number> = {
  low: 1, medium: 2, "medium-high": 3, high: 4, critical: 5, catastrophic: 6,
};

export const maturitySortOrder: Record<string, number> = {
  neglected: 1, "under-researched": 1, minimal: 1,
  emerging: 2, early: 2, nascent: 2,
  growing: 3, developing: 3, active: 3,
  mature: 4, established: 4, "well-studied": 4,
};

export const likelihoodSortOrder: Record<string, number> = {
  low: 1, medium: 2, "medium-high": 3, high: 4, "very-high": 5, "near-certain": 6,
};

export const trendSortOrder: Record<string, number> = {
  declining: 1, widening: 1, accelerating: 1, stressed: 1,
  mixed: 2, fragile: 2,
  improving: 3, stable: 3,
};

export const causalLevelSortOrder: Record<string, number> = {
  outcome: 3, pathway: 2, amplifier: 1,
};

// Helper to create sorting function from order map
export function createOrderedSortFn<T>(
  orderMap: Record<string, number>,
  getValue: (item: T) => string | undefined | null,
  defaultOrder = 0
): (a: T, b: T) => number {
  return (a, b) => {
    const aVal = getValue(a);
    const bVal = getValue(b);
    const aOrder = aVal ? (orderMap[aVal.toLowerCase()] ?? defaultOrder) : defaultOrder;
    const bOrder = bVal ? (orderMap[bVal.toLowerCase()] ?? defaultOrder) : defaultOrder;
    return aOrder - bOrder;
  };
}

// ============================================================================
// TREND TEXT COLORS - For parameter trend display
// ============================================================================

export const trendTextColors = {
  negative: "text-red-600 dark:text-red-400",
  positive: "text-emerald-600 dark:text-emerald-400",
  mixed: "text-amber-600 dark:text-amber-400",
  neutral: "text-slate-600 dark:text-slate-400",
} as const;

// Keywords that map to each trend category
export const trendKeywords: Record<keyof typeof trendTextColors, string[]> = {
  negative: ["declining", "widening", "accelerating", "stressed", "worsening"],
  positive: ["improving", "stable", "strengthening"],
  mixed: ["mixed", "fragile", "uncertain"],
  neutral: [],
};

export function getTrendTextColor(trend: string): string {
  const normalized = trend.toLowerCase();
  for (const [category, keywords] of Object.entries(trendKeywords)) {
    if (keywords.some(keyword => normalized.includes(keyword))) {
      return trendTextColors[category as keyof typeof trendTextColors];
    }
  }
  return trendTextColors.neutral;
}

// ============================================================================
// TEXT UTILITIES
// ============================================================================

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
