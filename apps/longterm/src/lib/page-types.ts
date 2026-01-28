/**
 * Centralized page type detection and metadata
 *
 * Single source of truth for determining page types across:
 * - PageStatus component
 * - MarkdownContent component
 * - Validation scripts (via shouldSkipValidation)
 */

/**
 * Content page types supported by the system
 */
export type PageType =
  | 'content'
  | 'risk'
  | 'response'
  | 'stub'
  | 'documentation'
  | 'ai-transition-model'
  | 'overview';

/**
 * Metadata about each page type
 */
export interface PageTypeInfo {
  label: string;
  description: string;
  styleGuideUrl?: string;
  color: string;
}

/**
 * Page type metadata - labels, descriptions, colors, and style guide URLs
 */
export const PAGE_TYPE_INFO: Record<PageType, PageTypeInfo> = {
  content: {
    label: 'Content',
    description: 'Standard knowledge base article',
    styleGuideUrl: '/internal/models-style-guide/',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  },
  risk: {
    label: 'Risk',
    description: 'Risk analysis page',
    styleGuideUrl: '/internal/risk-style-guide/',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
  },
  response: {
    label: 'Response',
    description: 'Intervention/response page',
    styleGuideUrl: '/internal/response-style-guide/',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
  },
  stub: {
    label: 'Stub',
    description: 'Minimal placeholder page',
    styleGuideUrl: '/internal/stub-style-guide/',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  },
  documentation: {
    label: 'Documentation',
    description: 'Internal docs, style guides, examples',
    styleGuideUrl: '/internal/page-types/',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  },
  'ai-transition-model': {
    label: 'AI Transition Model',
    description: 'Structured factor/scenario/parameter page',
    styleGuideUrl: '/internal/ai-transition-model-style-guide/',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
  overview: {
    label: 'Overview',
    description: 'Section navigation page',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
};

/**
 * Detect page type from pathname and/or frontmatter type
 *
 * Priority:
 * 1. Explicit frontmatter type (stub, documentation)
 * 2. Path-based detection (ai-transition-model, risk, response)
 * 3. Default to 'content'
 *
 * @param pathname - URL pathname (e.g., '/knowledge-base/risks/bioweapons/')
 * @param frontmatterType - Explicit type from frontmatter (optional)
 * @returns Detected page type
 */
export function detectPageType(
  pathname: string,
  frontmatterType?: string
): PageType {
  // Explicit frontmatter type takes priority
  if (frontmatterType === 'stub') return 'stub';
  if (frontmatterType === 'documentation') return 'documentation';

  // Detect from pathname
  if (pathname) {
    // AI Transition Model pages
    if (pathname.includes('/ai-transition-model/')) {
      return 'ai-transition-model';
    }

    // Risk pages
    if (pathname.includes('/knowledge-base/risks/')) {
      return 'risk';
    }

    // Response pages
    if (pathname.includes('/knowledge-base/responses/')) {
      return 'response';
    }
  }

  // Return explicit type if valid, otherwise default to content
  if (
    frontmatterType &&
    Object.keys(PAGE_TYPE_INFO).includes(frontmatterType)
  ) {
    return frontmatterType as PageType;
  }

  return 'content';
}

/**
 * Check if a page is an AI Transition Model page
 */
export function isAITransitionModelPage(pathname: string): boolean {
  return pathname.includes('/ai-transition-model/');
}

/**
 * Check if a page is a Knowledge Base page (risks or responses)
 */
export function isKnowledgeBasePage(pathname: string): boolean {
  return pathname.includes('/knowledge-base/');
}

/**
 * Check if validation should be skipped for this page type
 *
 * Skip validation for:
 * - Stubs (intentionally minimal)
 * - Overviews (index/navigation pages)
 * - Documentation (internal docs, not content)
 *
 * @param pageType - The detected page type
 * @returns true if validation should be skipped
 */
export function shouldSkipValidation(pageType: PageType): boolean {
  return pageType === 'stub' || pageType === 'overview' || pageType === 'documentation';
}

/**
 * Check if PageStatus should be shown for this page
 *
 * Show for:
 * - AI Transition Model pages with editorial metadata
 * - Knowledge Base pages (risk, response) with editorial metadata
 * - Any page with insights
 *
 * @param pageType - The detected page type
 * @param hasEditorialMeta - Whether page has quality/importance/etc
 * @param hasInsights - Whether page has associated insights
 * @returns true if PageStatus should be displayed
 */
export function shouldShowPageStatus(
  pageType: PageType,
  hasEditorialMeta: boolean,
  hasInsights: boolean
): boolean {
  const isContentPage =
    pageType === 'ai-transition-model' ||
    pageType === 'risk' ||
    pageType === 'response';
  return (hasEditorialMeta && isContentPage) || hasInsights;
}
