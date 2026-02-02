'use client';

import { useEffect, useMemo, useState } from 'react';

import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { entities, type Page, pages } from '@data';
import { type Insight, insights } from '@data/insights-data';
import type { Entity } from '@data/schema';

// Shared tables data
const TABLES = [
  {
    id: 'safety-approaches',
    title: 'Safety Approaches',
    description: 'Safety research effectiveness vs capability uplift.',
    href: '/knowledge-base/responses/safety-approaches/table',
    path: '/knowledge-base/responses/safety-approaches',
    rows: 42,
    cols: 9,
  },
  {
    id: 'safety-generalizability',
    title: 'Safety Generalizability',
    description: 'Safety approaches across AI architectures.',
    href: '/knowledge-base/responses/safety-generalizability/table',
    path: '/knowledge-base/responses/safety-generalizability',
    rows: 42,
    cols: 8,
  },
  {
    id: 'safety-matrix',
    title: 'Safety × Architecture Matrix',
    description: 'Safety approaches vs architecture scenarios.',
    href: '/knowledge-base/responses/safety-generalizability/matrix',
    path: '/knowledge-base/responses/safety-generalizability',
    rows: 42,
    cols: 12,
  },
  {
    id: 'architecture-scenarios',
    title: 'Architecture Scenarios',
    description: 'Deployment patterns and base architectures.',
    href: '/knowledge-base/architecture-scenarios/table',
    path: '/knowledge-base/architecture-scenarios',
    rows: 12,
    cols: 7,
  },
  {
    id: 'deployment-architectures',
    title: 'Deployment Architectures',
    description: 'How AI systems are deployed.',
    href: '/knowledge-base/deployment-architectures/table',
    path: '/knowledge-base/deployment-architectures',
    rows: 8,
    cols: 6,
  },
  {
    id: 'accident-risks',
    title: 'Accident Risks',
    description: 'Accident and misalignment risks.',
    href: '/knowledge-base/risks/accident/table',
    path: '/knowledge-base/risks/accident',
    rows: 16,
    cols: 7,
  },
  {
    id: 'eval-types',
    title: 'Evaluation Types',
    description: 'Evaluation methodologies comparison.',
    href: '/knowledge-base/models/eval-types/table',
    path: '/knowledge-base/models/eval-types',
    rows: 18,
    cols: 8,
  },
  {
    id: 'transition-model',
    title: 'AI Transition Model Parameters',
    description: 'All AI Transition Model parameters.',
    href: '/ai-transition-model/table',
    path: '/ai-transition-model',
    rows: 45,
    cols: 6,
  },
];

// Content types
type ContentType = 'all' | 'wiki' | 'models' | 'insights' | 'tables' | 'diagrams';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  href: string;
  path: string;
  type: ContentType;
  meta: string;
  quality: number | null;
  importance: number | null;
  wordCount: number;
  clusters: string[]; // For cause filtering - inherited from parent page for insights
  sourceTitle?: string; // For insights - title of the source page
  entityType?: string; // Entity category derived from path
}

// Derive entity type from path
function getEntityType(path: string): string | undefined {
  if (path.includes('/risks/')) return 'Risks';
  if (path.includes('/responses/')) return 'Interventions';
  if (path.includes('/people/')) return 'People';
  if (path.includes('/organizations/')) return 'Organizations';
  if (path.includes('/capabilities/')) return 'Capabilities';
  if (path.includes('/models/')) return 'Models';
  if (path.includes('/debates/')) return 'Debates';
  if (path.includes('/worldviews/')) return 'Worldviews';
  if (path.includes('/forecasting/')) return 'Forecasting';
  if (path.includes('/cruxes/')) return 'Cruxes';
  if (path.includes('/history/')) return 'History';
  if (path.includes('/incidents/')) return 'Incidents';
  if (path.includes('/metrics/')) return 'Metrics';
  return undefined;
}

// Format cluster name for display
function formatCluster(cluster: string): string {
  const map: Record<string, string> = {
    'ai-safety': 'AI Safety',
    'biorisks': 'Biorisks',
    'cyber': 'Cyber',
    'epistemics': 'Epistemics',
    'governance': 'Governance',
    'community': 'Community',
  };
  return map[cluster] || cluster;
}

// Get color classes for cluster badges (subtle text-only style)
function getClusterColor(cluster: string): string {
  const colors: Record<string, string> = {
    'ai-safety': 'text-purple-500 dark:text-purple-400',
    'biorisks': 'text-red-500 dark:text-red-400',
    'cyber': 'text-orange-500 dark:text-orange-400',
    'epistemics': 'text-blue-500 dark:text-blue-400',
    'governance': 'text-green-600 dark:text-green-400',
    'community': 'text-yellow-600 dark:text-yellow-500',
  };
  return colors[cluster] || 'text-slate-400 dark:text-slate-500';
}

// Sort options
type SortOption = 'relevance' | 'importance' | 'quality' | 'wordCount' | 'alphabetical';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'importance', label: 'Importance' },
  { value: 'quality', label: 'Quality' },
  { value: 'wordCount', label: 'Word Count' },
  { value: 'alphabetical', label: 'A-Z' },
];

// Field options (ordered by popularity)
const CAUSE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ai-safety', label: 'AI Safety' },
  { value: 'governance', label: 'Governance' },
  { value: 'epistemics', label: 'Epistemics' },
  { value: 'community', label: 'Community' },
  { value: 'cyber', label: 'Cyber' },
  { value: 'biorisks', label: 'Biorisks' },
];

// Entity/Category options (ordered by popularity)
const ENTITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'responses', label: 'Interventions' },
  { value: 'risks', label: 'Risks' },
  { value: 'organizations', label: 'Organizations' },
  { value: 'capabilities', label: 'Capabilities' },
  { value: 'people', label: 'People' },
];

// Type options
const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'wiki', label: 'Wiki' },
  { value: 'tables', label: 'Tables' },
  { value: 'diagrams', label: 'Diagrams' },
  { value: 'models', label: 'Models' },
  { value: 'insights', label: 'Insights' },
];

// Format word count
function formatWordCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

function isModelPage(page: Page): boolean {
  return page.category === 'models' || page.path.includes('/models/');
}

// Build content list
function buildContentList(): ContentItem[] {
  const items: ContentItem[] = [];

  // Build maps for page data lookup
  const pageClusterMap = new Map<string, string[]>();
  const pageTitleMap = new Map<string, string>();
  pages.forEach((page: Page) => {
    pageClusterMap.set(
      page.path,
      (page as Page & { clusters?: string[] }).clusters || ['ai-safety']
    );
    pageTitleMap.set(page.path, page.title);
  });

  pages
    .filter((p: Page) => !p.path.includes('/internal/') && !p.path.includes('/meta/') && p.title)
    .forEach((page: Page) => {
      let type: ContentType = 'wiki';
      if (isModelPage(page)) type = 'models';

      items.push({
        id: page.path,
        title: page.title,
        description: page.description || page.llmSummary || '',
        href: page.path,
        path: page.path,
        type,
        meta: page.wordCount ? formatWordCount(page.wordCount) : '',
        quality: page.quality,
        importance: page.importance,
        wordCount: page.wordCount || 0,
        clusters: (page as Page & { clusters?: string[] }).clusters || ['ai-safety'],
        entityType: getEntityType(page.path),
      });
    });

  insights.forEach((insight: Insight) => {
    const sourcePath = insight.source || '/insight-hunting';
    // Normalize path (add trailing slash if needed) for lookup
    const normalizedPath = sourcePath.endsWith('/') ? sourcePath : `${sourcePath}/`;
    // Look up the parent page's clusters and title
    const parentClusters = pageClusterMap.get(normalizedPath) || pageClusterMap.get(sourcePath) || ['ai-safety'];
    const sourceTitle = pageTitleMap.get(normalizedPath) || pageTitleMap.get(sourcePath) || 'Source';

    items.push({
      id: `insight-${insight.id}`,
      title: insight.insight,
      description: insight.insight,
      href: sourcePath,
      path: sourcePath,
      type: 'insights',
      meta: insight.composite?.toFixed(1) || '?',
      quality: insight.composite || 0,
      importance: insight.composite || 0,
      wordCount: insight.insight.split(/\s+/).length,
      clusters: parentClusters,
      sourceTitle,
    });
  });

  TABLES.forEach((table) => {
    // Look up clusters from the page at table.path if available
    const tableClusters = pageClusterMap.get(table.path) || ['ai-safety'];
    items.push({
      id: `table-${table.id}`,
      title: table.title,
      description: table.description,
      href: table.href,
      path: table.path,
      type: 'tables',
      meta: `${table.rows} × ${table.cols}`,
      quality: null,
      importance: null,
      wordCount: 0,
      clusters: tableClusters,
    });
  });

  entities
    .filter((e: Entity) => {
      const graph = (e as Entity & { causeEffectGraph?: { nodes?: unknown[] } }).causeEffectGraph;
      return graph?.nodes && graph.nodes.length > 0;
    })
    .forEach((e: Entity) => {
      const graph = (
        e as Entity & {
          causeEffectGraph?: { nodes?: unknown[]; title?: string; description?: string };
        }
      ).causeEffectGraph!;
      const nodeCount = graph.nodes?.length || 0;
      items.push({
        id: `diagram-${e.id}`,
        title: graph.title || e.title,
        description: graph.description || `Cause-effect diagram for ${e.title}`,
        href: `/diagrams/${e.id}`,
        path: `/diagrams`,
        type: 'diagrams',
        meta: `${nodeCount} nodes`,
        quality: null,
        importance: null,
        wordCount: 0,
        clusters: ['ai-safety'], // Default for diagrams
      });
    });

  return items;
}

const ALL_CONTENT = buildContentList();

const COUNTS: Record<ContentType, number> = {
  all: ALL_CONTENT.length,
  wiki: ALL_CONTENT.filter((i) => i.type === 'wiki').length,
  models: ALL_CONTENT.filter((i) => i.type === 'models').length,
  insights: ALL_CONTENT.filter((i) => i.type === 'insights').length,
  tables: ALL_CONTENT.filter((i) => i.type === 'tables').length,
  diagrams: ALL_CONTENT.filter((i) => i.type === 'diagrams').length,
};

function sortItems(items: ContentItem[], sortBy: SortOption): ContentItem[] {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'relevance': {
        const scoreA = ((a.quality || 0) + (a.importance || 0)) / 2;
        const scoreB = ((b.quality || 0) + (b.importance || 0)) / 2;
        return scoreB - scoreA;
      }
      case 'importance':
        return (b.importance || 0) - (a.importance || 0);
      case 'quality':
        return (b.quality || 0) - (a.quality || 0);
      case 'wordCount':
        return b.wordCount - a.wordCount;
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

function ContentCard({ item }: { item: ContentItem }) {
  const isInsight = item.type === 'insights';
  const typeLabel =
    item.type === 'wiki'
      ? 'Wiki'
      : item.type === 'models'
        ? 'Model'
        : item.type === 'insights'
          ? 'Insight'
          : item.type === 'tables'
            ? 'Table'
            : 'Diagram';

  // Insight card - simpler, smaller text, no truncation
  if (isInsight) {
    return (
      <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
          <span className="text-blue-600 dark:text-blue-400 font-medium">{typeLabel}</span>
          {item.meta && (
            <span className="text-slate-400 dark:text-slate-500">{item.meta}</span>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed !mb-2">{item.title}</p>
        {item.sourceTitle && item.sourceTitle !== 'Source' && item.href && (
          <a
            href={item.href}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            → {item.sourceTitle}
          </a>
        )}
      </div>
    );
  }

  // Get display clusters (show all, limit to 3)
  const displayClusters = item.clusters.slice(0, 3);

  // Regular content card
  const content = (
    <div
      className={cn(
        'p-4 rounded-lg border border-slate-200 dark:border-slate-800 h-full',
        'bg-white dark:bg-slate-900',
        'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all group'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2 text-sm">
        <span className="text-blue-600 dark:text-blue-400 font-medium">{typeLabel}</span>
        <div className="flex items-center gap-2">
          {item.meta && (
            <span className="text-slate-400 dark:text-slate-500 text-xs">{item.meta}</span>
          )}
          <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        </div>
      </div>
      <div className="font-semibold mb-1.5 line-clamp-2 transition-colors text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {item.title}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{item.description}</p>
      {/* Cause and Entity labels */}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-3 text-[10px]">
        {displayClusters.map((cluster) => (
          <span key={cluster} className={getClusterColor(cluster)}>
            {formatCluster(cluster)}
          </span>
        ))}
        {item.entityType && (
          <span className="text-slate-400 dark:text-slate-500">
            {item.entityType}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <a href={item.href} className="block no-underline">
      {content}
    </a>
  );
}

// Filter button component
function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 px-3 text-sm font-medium rounded-lg',
        active
          ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'ml-1.5 tabular-nums text-slate-400 dark:text-slate-500 inline-block min-w-[2.5rem] text-right'
          )}
        >
          {count}
        </span>
      )}
    </Button>
  );
}

export default function ContentHub() {
  const [search, setSearch] = useState('');
  const [activeCause, setActiveCause] = useState('all');
  const [activeEntity, setActiveEntity] = useState('all');
  const [activeType, setActiveType] = useState<ContentType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setSearch(params.get('q')!);
    if (params.get('type')) setActiveType(params.get('type') as ContentType);
    if (params.get('sort')) setSortBy(params.get('sort') as SortOption);
    if (params.get('entity')) setActiveEntity(params.get('entity')!);
    if (params.get('cause')) setActiveCause(params.get('cause')!);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (activeType !== 'all') params.set('type', activeType);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (activeEntity !== 'all') params.set('entity', activeEntity);
    if (activeCause !== 'all') params.set('cause', activeCause);
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [search, activeType, sortBy, activeEntity, activeCause]);

  // Cause filtering helper - checks both clusters and text content
  const matchesCause = (item: ContentItem, cause: string): boolean => {
    // Check clusters first
    const hasCluster = item.clusters && item.clusters.includes(cause);
    if (hasCluster) return true;

    // Also check text content for additional matches
    const text = `${item.path} ${item.title} ${item.description}`.toLowerCase();
    switch (cause) {
      case 'ai-safety':
        return true; // Most content is AI safety related
      case 'biorisks':
        return text.includes('bio') || text.includes('pathogen') || text.includes('pandemic');
      case 'cyber':
        return text.includes('cyber');
      case 'epistemics':
        return (
          text.includes('epistemic') || text.includes('forecasting') || text.includes('reasoning')
        );
      case 'governance':
        return (
          text.includes('governance') || text.includes('policy') || text.includes('regulation')
        );
      case 'community':
        return (
          text.includes('community') || text.includes('effective altruism') || text.includes('ea ')
        );
      default:
        return true;
    }
  };

  const causeFilteredItems = useMemo(() => {
    if (activeCause === 'all') return ALL_CONTENT;
    return ALL_CONTENT.filter((item) => matchesCause(item, activeCause));
  }, [activeCause]);

  const entityFilteredItems = useMemo(() => {
    if (activeEntity === 'all') return causeFilteredItems;
    return causeFilteredItems.filter(
      (item) =>
        item.path.includes(`/${activeEntity}/`) ||
        item.path.includes(`/${activeEntity.replace('-', '-')}/`)
    );
  }, [causeFilteredItems, activeEntity]);

  const typeFilteredItems = useMemo(() => {
    if (activeType === 'all') return entityFilteredItems;
    return entityFilteredItems.filter((item) => item.type === activeType);
  }, [entityFilteredItems, activeType]);

  const typeCounts = useMemo(
    () => ({
      all: entityFilteredItems.length,
      wiki: entityFilteredItems.filter((i) => i.type === 'wiki').length,
      models: entityFilteredItems.filter((i) => i.type === 'models').length,
      insights: entityFilteredItems.filter((i) => i.type === 'insights').length,
      tables: entityFilteredItems.filter((i) => i.type === 'tables').length,
      diagrams: entityFilteredItems.filter((i) => i.type === 'diagrams').length,
    }),
    [entityFilteredItems]
  );

  const causeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALL_CONTENT.length };
    CAUSE_OPTIONS.filter((c) => c.value !== 'all').forEach(({ value }) => {
      counts[value] = ALL_CONTENT.filter((item) => matchesCause(item, value)).length;
    });
    return counts;
  }, []);

  const entityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: causeFilteredItems.length };
    ENTITY_OPTIONS.filter((e) => e.value !== 'all').forEach(({ value }) => {
      counts[value] = causeFilteredItems.filter(
        (item) =>
          item.path.includes(`/${value}/`) || item.path.includes(`/${value.replace('-', '-')}/`)
      ).length;
    });
    return counts;
  }, [causeFilteredItems]);

  const filtered = useMemo(() => {
    const results = typeFilteredItems.filter((item) => {
      if (search) {
        const s = search.toLowerCase();
        if (!item.title.toLowerCase().includes(s) && !item.description.toLowerCase().includes(s))
          return false;
      }
      return true;
    });
    return sortItems(results, sortBy);
  }, [typeFilteredItems, search, sortBy]);

  return (
    <div className="not-content">
      {/* Search */}
      <div className="relative mb-6!">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <Input
          type="search"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-12 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
      </div>

      {/* Filter rows */}
      <div className="not-content mb-6!">
        {/* Field filter */}
        <div className="flex items-center gap-4 mb-2!">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 shrink-0">
            Field
          </span>
          <div className="flex flex-wrap gap-1">
            {CAUSE_OPTIONS.map(({ value, label }) => (
              <FilterButton
                key={value}
                active={activeCause === value}
                onClick={() => setActiveCause(value)}
                count={causeCounts[value]}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Entity filter */}
        <div className="flex items-center gap-4 mb-2!">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 shrink-0">
            Entity
          </span>
          <div className="flex flex-wrap gap-1">
            {ENTITY_OPTIONS.map(({ value, label }) => (
              <FilterButton
                key={value}
                active={activeEntity === value}
                onClick={() => setActiveEntity(value)}
                count={entityCounts[value]}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Format filter */}
        <div className="flex items-center gap-4!">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 shrink-0">
            Format
          </span>
          <div className="flex flex-wrap gap-1">
            {TYPE_OPTIONS.map(({ value, label }) => (
              <FilterButton
                key={value}
                active={activeType === value}
                onClick={() => setActiveType(value)}
                count={typeCounts[value]}
              >
                {label}
              </FilterButton>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200 dark:border-slate-800 mb-6!" />

      {/* Results header */}
      <div className="flex items-center justify-between mb-4!">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {filtered.length.toLocaleString()}
          </span>{' '}
          items
        </span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results grid - 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((item) => (
          <ContentCard key={item.id} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <p className="mb-2">No content found.</p>
          <button
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            onClick={() => {
              setSearch('');
              setActiveType('all');
              setActiveEntity('all');
              setSortBy('relevance');
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
