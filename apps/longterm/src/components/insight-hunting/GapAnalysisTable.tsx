"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, ExternalLink, AlertTriangle, Target } from "lucide-react";

interface PageInfo {
  id: string;
  path: string;
  filePath: string;
  title: string;
  quality: number | null;
  importance: number | null;
  category: string;
  wordCount: number;
}

interface InsightGap {
  page: PageInfo;
  insightCount: number;
  potentialScore: number;
  gapReason: string;
}

interface Props {
  gaps: InsightGap[];
}

function ScoreCell({ value }: { value: number }) {
  const colorClass =
    value >= 100
      ? "bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200"
      : value >= 80
      ? "bg-orange-200 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200"
      : value >= 60
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span className={`inline-flex items-center justify-center w-12 h-6 rounded text-sm font-medium ${colorClass}`}>
      {value}
    </span>
  );
}

function RatingCell({ value, max = 100 }: { value: number | null; max?: number }) {
  if (value === null) return <span className="text-slate-400">-</span>;

  const normalized = max === 5 ? value * 20 : value;
  const colorClass =
    normalized >= 80
      ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200"
      : normalized >= 60
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : normalized >= 40
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

  return (
    <span className={`inline-flex items-center justify-center w-10 h-6 rounded text-sm font-medium ${colorClass}`}>
      {value}
    </span>
  );
}

function InsightCountCell({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-xs font-medium">
        <AlertTriangle className="h-3 w-3" />
        None
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-slate-100 dark:bg-slate-700 text-sm">
      {count}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    capabilities: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    risks: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    responses: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    organizations: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    forecasting: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    metrics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${colors[category] || "bg-slate-100 dark:bg-slate-800"}`}>
      {category}
    </span>
  );
}

function SortButton({ label, sorted, onClick }: { label: string; sorted: false | "asc" | "desc"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 hover:text-foreground text-muted-foreground font-medium text-sm"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sorted ? "text-foreground" : ""}`} />
    </button>
  );
}

const columns: ColumnDef<InsightGap>[] = [
  { accessorKey: "potentialScore", header: "Score" },
  { accessorKey: "page.title", header: "Page" },
  { accessorKey: "page.importance", header: "Importance" },
  { accessorKey: "page.quality", header: "Quality" },
  { accessorKey: "insightCount", header: "Insights" },
  { accessorKey: "page.category", header: "Category" },
  { accessorKey: "gapReason", header: "Reason" },
];

export function GapAnalysisTable({ gaps }: Props) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "potentialScore", desc: true }]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [minImportance, setMinImportance] = React.useState(0);

  const categories = React.useMemo(() => {
    const cats = new Set(gaps.map((g) => g.page.category));
    return Array.from(cats).sort();
  }, [gaps]);

  const filteredData = React.useMemo(() => {
    let filtered = gaps;

    if (categoryFilter !== "all") {
      filtered = filtered.filter((g) => g.page.category === categoryFilter);
    }

    if (minImportance > 0) {
      filtered = filtered.filter((g) => (g.page.importance || 0) >= minImportance);
    }

    return filtered;
  }, [gaps, categoryFilter, minImportance]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: { sorting, globalFilter },
  });

  const handleSort = (field: string) => {
    setSorting([{ id: field, desc: sorting[0]?.id === field ? !sorting[0].desc : true }]);
  };

  // Stats
  const stats = React.useMemo(() => {
    return {
      totalGaps: gaps.length,
      noInsights: gaps.filter((g) => g.insightCount === 0).length,
      highPriority: gaps.filter((g) => g.potentialScore >= 80).length,
      filtered: filteredData.length,
    };
  }, [gaps, filteredData]);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg text-sm">
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.totalGaps}</span>
          <span className="text-xs text-muted-foreground uppercase">Total Gaps</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.noInsights}</span>
          <span className="text-xs text-muted-foreground uppercase">No Insights</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.highPriority}</span>
          <span className="text-xs text-muted-foreground uppercase">High Priority</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold">{stats.filtered}</span>
          <span className="text-xs text-muted-foreground uppercase">Showing</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search pages..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Min importance:</label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={minImportance}
            onChange={(e) => setMinImportance(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-medium w-8">{minImportance}</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left w-16">
                <SortButton
                  label="Score"
                  sorted={sorting[0]?.id === "potentialScore" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("potentialScore")}
                />
              </th>
              <th className="px-3 py-2 text-left">
                <span className="text-muted-foreground font-medium text-sm">Page</span>
              </th>
              <th className="px-3 py-2 text-left w-20">
                <SortButton
                  label="Imp"
                  sorted={sorting[0]?.id === "page.importance" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("page.importance")}
                />
              </th>
              <th className="px-3 py-2 text-left w-20">
                <SortButton
                  label="Qual"
                  sorted={sorting[0]?.id === "page.quality" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("page.quality")}
                />
              </th>
              <th className="px-3 py-2 text-left w-20">
                <SortButton
                  label="Insights"
                  sorted={sorting[0]?.id === "insightCount" ? (sorting[0].desc ? "desc" : "asc") : false}
                  onClick={() => handleSort("insightCount")}
                />
              </th>
              <th className="px-3 py-2 text-left w-28">
                <span className="text-muted-foreground font-medium text-sm">Category</span>
              </th>
              <th className="px-3 py-2 text-left">
                <span className="text-muted-foreground font-medium text-sm">Gap Reason</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 align-top">
                  <ScoreCell value={row.original.potentialScore} />
                </td>
                <td className="px-3 py-2 align-top">
                  <div>
                    <a
                      href={row.original.page.path}
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {row.original.page.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {row.original.page.wordCount.toLocaleString()} words
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 align-top">
                  <RatingCell value={row.original.page.importance} />
                </td>
                <td className="px-3 py-2 align-top">
                  <RatingCell value={row.original.page.quality} />
                </td>
                <td className="px-3 py-2 align-top">
                  <InsightCountCell count={row.original.insightCount} />
                </td>
                <td className="px-3 py-2 align-top">
                  <CategoryBadge category={row.original.page.category} />
                </td>
                <td className="px-3 py-2 align-top">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {row.original.gapReason && <Target className="h-3 w-3 text-amber-500" />}
                    {row.original.gapReason || "-"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No gaps match the current filters. Try adjusting your criteria.
        </div>
      )}
    </div>
  );
}

export default GapAnalysisTable;
