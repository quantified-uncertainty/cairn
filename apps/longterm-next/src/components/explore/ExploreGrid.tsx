"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { ExploreItem } from "@/data";

// Human-readable type labels
const TYPE_LABELS: Record<string, string> = {
  risk: "Risk",
  capability: "Capability",
  "safety-agenda": "Safety Agenda",
  policy: "Policy",
  intervention: "Intervention",
  organization: "Organization",
  lab: "Lab",
  "lab-frontier": "Lab",
  "lab-research": "Safety Org",
  "lab-academic": "Academic",
  researcher: "Person",
  funder: "Funder",
  crux: "Crux",
  concept: "Concept",
  model: "Model",
  argument: "Argument",
  analysis: "Analysis",
  historical: "Historical",
};

// FIELD filter — based on page clusters
const FIELD_GROUPS: { label: string; cluster: string | null }[] = [
  { label: "All", cluster: null },
  { label: "AI Safety", cluster: "ai-safety" },
  { label: "Governance", cluster: "governance" },
  { label: "Epistemics", cluster: "epistemics" },
  { label: "Community", cluster: "community" },
  { label: "Cyber", cluster: "cyber" },
  { label: "Biorisks", cluster: "biorisks" },
];

// ENTITY type filter
const ENTITY_GROUPS: { label: string; types: string[] }[] = [
  { label: "All", types: [] },
  { label: "Risks", types: ["risk"] },
  { label: "Interventions", types: ["intervention", "safety-agenda", "policy"] },
  { label: "Organizations", types: ["organization", "lab", "lab-frontier", "lab-research", "lab-academic"] },
  { label: "People", types: ["researcher"] },
  { label: "Capabilities", types: ["capability"] },
  { label: "Models", types: ["model"] },
  { label: "Concepts", types: ["concept", "crux", "argument", "analysis", "historical"] },
];

// RISK CATEGORY filter
const RISK_CATEGORY_GROUPS: { label: string; value: string | null }[] = [
  { label: "All Risks", value: null },
  { label: "Accident", value: "accident" },
  { label: "Misuse", value: "misuse" },
  { label: "Structural", value: "structural" },
  { label: "Epistemic", value: "epistemic" },
];

type SortKey = "relevance" | "title" | "importance" | "quality" | "wordCount";

function formatWordCount(count: number | null): string {
  if (!count) return "";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    risk: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    capability: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "safety-agenda": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    policy: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    intervention: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    organization: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    lab: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-frontier": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-research": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    "lab-academic": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    researcher: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    crux: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    concept: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
    model: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    argument: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    analysis: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    historical: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300",
    funder: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  };
  return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function FilterRow({
  label,
  options,
  active,
  onSelect,
  counts,
}: {
  label: string;
  options: string[];
  active: number;
  onSelect: (i: number) => void;
  counts: number[];
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-16 flex-shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => onSelect(i)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              active === i
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground border-border hover:bg-muted"
            }`}
          >
            {opt}{" "}
            <span className={active === i ? "text-background/70" : "text-muted-foreground"}>
              {counts[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExploreGrid({ items }: { items: ExploreItem[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial state from URL params
  const initialTag = searchParams.get("tag") || "";
  const initialRiskCat = searchParams.get("riskCategory") || null;
  const initialRiskCatIndex = initialRiskCat
    ? Math.max(0, RISK_CATEGORY_GROUPS.findIndex((g) => g.value === initialRiskCat))
    : 0;

  const [search, setSearch] = useState(initialTag);
  const [activeField, setActiveField] = useState(0);
  const [activeEntity, setActiveEntity] = useState(
    // Auto-select "Risks" entity filter when arriving with a riskCategory param
    initialRiskCat ? 1 : 0
  );
  const [activeRiskCat, setActiveRiskCat] = useState(initialRiskCatIndex);
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [visibleCount, setVisibleCount] = useState(60);

  // Debounced URL update for search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setVisibleCount(60);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrlParams({ tag: value || null });
    }, 300);
  }

  function handleFieldChange(index: number) {
    setActiveField(index);
    setVisibleCount(60);
  }

  function handleEntityChange(index: number) {
    setActiveEntity(index);
    setVisibleCount(60);
  }

  function handleRiskCatChange(index: number) {
    setActiveRiskCat(index);
    setVisibleCount(60);
    const value = RISK_CATEGORY_GROUPS[index].value;
    updateUrlParams({ riskCategory: value });
  }

  // Filter out AI transition model subitems (internal model data, not articles)
  const articleItems = useMemo(
    () => items.filter((item) => !item.type.startsWith("ai-transition-model")),
    [items]
  );

  // Compute field filter counts (against articleItems only)
  const fieldCounts = useMemo(() => {
    return FIELD_GROUPS.map((group) => {
      if (!group.cluster) return articleItems.length;
      return articleItems.filter((item) => item.clusters.includes(group.cluster!)).length;
    });
  }, [articleItems]);

  // Items after field filter
  const fieldFiltered = useMemo(() => {
    const group = FIELD_GROUPS[activeField];
    if (!group.cluster) return articleItems;
    return articleItems.filter((item) => item.clusters.includes(group.cluster!));
  }, [articleItems, activeField]);

  // Compute entity type counts (against field-filtered items)
  const entityCounts = useMemo(() => {
    return ENTITY_GROUPS.map((group) => {
      if (group.types.length === 0) return fieldFiltered.length;
      return fieldFiltered.filter((item) => group.types.includes(item.type)).length;
    });
  }, [fieldFiltered]);

  // Show risk category filter when viewing All or Risks
  const showRiskCatFilter = activeEntity === 0 || activeEntity === 1;

  // Compute risk category counts (against field-filtered risk items)
  const riskCatCounts = useMemo(() => {
    const riskItems = fieldFiltered.filter((item) => item.type === "risk");
    return RISK_CATEGORY_GROUPS.map((group) => {
      if (!group.value) return riskItems.length;
      return riskItems.filter((item) => item.riskCategory === group.value).length;
    });
  }, [fieldFiltered]);

  const filtered = useMemo(() => {
    let result = fieldFiltered;

    // Entity type filter
    const group = ENTITY_GROUPS[activeEntity];
    if (group.types.length > 0) {
      result = result.filter((item) => group.types.includes(item.type));
    }

    // Risk category filter
    const riskCatGroup = RISK_CATEGORY_GROUPS[activeRiskCat];
    if (riskCatGroup.value) {
      result = result.filter((item) => item.riskCategory === riskCatGroup.value);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "title":
          return a.title.localeCompare(b.title);
        case "importance":
          return (b.importance || 0) - (a.importance || 0);
        case "quality":
          return (b.quality || 0) - (a.quality || 0);
        case "wordCount":
          return (b.wordCount || 0) - (a.wordCount || 0);
        case "relevance":
        default: {
          const scoreA = (a.importance || 0) * 2 + (a.quality || 0);
          const scoreB = (b.importance || 0) * 2 + (b.quality || 0);
          return scoreB - scoreA;
        }
      }
    });

    return result;
  }, [fieldFiltered, activeEntity, activeRiskCat, search, sortKey]);

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search entities..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Filter rows */}
      <div className="mb-6">
        <FilterRow
          label="Field"
          options={FIELD_GROUPS.map((g) => g.label)}
          active={activeField}
          onSelect={handleFieldChange}
          counts={fieldCounts}
        />
        <FilterRow
          label="Entity"
          options={ENTITY_GROUPS.map((g) => g.label)}
          active={activeEntity}
          onSelect={handleEntityChange}
          counts={entityCounts}
        />
        {showRiskCatFilter && (
          <FilterRow
            label="Risk"
            options={RISK_CATEGORY_GROUPS.map((g) => g.label)}
            active={activeRiskCat}
            onSelect={handleRiskCatChange}
            counts={riskCatCounts}
          />
        )}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{filtered.length} items</span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-sm px-3 py-1.5 border border-border rounded-md bg-background text-foreground"
        >
          <option value="relevance">Relevance</option>
          <option value="importance">Importance</option>
          <option value="quality">Quality</option>
          <option value="wordCount">Word Count</option>
          <option value="title">Title (A-Z)</option>
        </select>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.slice(0, visibleCount).map((item) => (
          <Link
            key={item.id}
            href={`/explore/${item.numericId}`}
            className="group block p-4 border border-border rounded-lg hover:border-foreground/30 hover:shadow-sm transition-all no-underline bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${getTypeColor(item.type)}`}>
                {TYPE_LABELS[item.type] || item.type}
              </span>
              {item.wordCount && (
                <span className="text-xs text-muted-foreground">
                  {formatWordCount(item.wordCount)}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent-foreground">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                {truncate(item.description, 150)}
              </p>
            )}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-auto">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[0.65rem] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>

      {filtered.length > visibleCount && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((c) => c + 60)}
            className="px-6 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground hover:bg-muted transition-colors"
          >
            Show more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No entities found matching your criteria.
        </div>
      )}
    </div>
  );
}
