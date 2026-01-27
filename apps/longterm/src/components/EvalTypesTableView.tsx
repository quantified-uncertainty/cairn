// Table view for AI Evaluation Types - Strategic Analysis
// Refactored to use TanStack Table and shared infrastructure
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type VisibilityState,
  type ColumnDef,
} from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  TableViewHeader,
  ColumnToggleControls,
  ViewModeToggle,
  type ViewMode,
} from "./tables/shared";
import {
  createEvalTypesColumns,
  EVAL_TYPES_COLUMNS,
  EVAL_TYPES_PRESETS,
  type EvalTypesColumnKey,
  type EvalType,
} from "./tables/eval-types-columns";
import { useColumnVisibility } from "./tables/shared/useColumnVisibility";
import { TableInsightsSummary } from "./tables/shared/TableInsightsSummary";
import { evalTypes, EVAL_CATEGORIES } from "../data/eval-types-table-data";
import { cn } from "@/lib/utils";

// Component for grouped category table
function GroupedCategoryTable({
  category,
  data,
  columns,
  columnVisibility,
}: {
  category: string;
  data: EvalType[];
  columns: ColumnDef<EvalType>[];
  columnVisibility: VisibilityState;
}) {
  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) return null;

  return (
    <div className="space-y-2 mb-8">
      <div className="flex items-center gap-3 pb-2 border-b-2 border-border">
        <div className="w-3 h-3 rounded-full shrink-0 bg-purple-500" />
        <div className="text-base font-semibold text-foreground uppercase tracking-wide">
          {category}
        </div>
      </div>
      <div className="overflow-x-auto">
        <DataTable table={table} />
      </div>
    </div>
  );
}

export default function EvalTypesTableView() {
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { visibleColumns, toggleColumn, applyPreset } = useColumnVisibility({
    columns: EVAL_TYPES_COLUMNS,
    presets: EVAL_TYPES_PRESETS,
  });

  // Convert Set to VisibilityState for TanStack Table
  const columnVisibility = useMemo(() => {
    const visibility: VisibilityState = { name: true };
    Object.keys(EVAL_TYPES_COLUMNS).forEach((key) => {
      visibility[key] = visibleColumns.has(key as EvalTypesColumnKey);
    });
    // Hide category column in grouped view
    if (viewMode === "grouped") {
      visibility.category = false;
    }
    return visibility;
  }, [visibleColumns, viewMode]);

  const columns = useMemo(() => createEvalTypesColumns(), []);

  // Filter data by category
  const filteredData = useMemo(() => {
    if (!categoryFilter) return evalTypes;
    return evalTypes.filter((e) => e.category === categoryFilter);
  }, [categoryFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Group evals by category for grouped view
  const groupedData = useMemo(() => {
    const dataToGroup = categoryFilter
      ? evalTypes.filter((e) => e.category === categoryFilter)
      : evalTypes;
    return EVAL_CATEGORIES.map((cat) => ({
      category: cat,
      data: dataToGroup.filter((e) => e.category === cat),
    })).filter((g) => g.data.length > 0);
  }, [categoryFilter]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TableViewHeader
        title="AI Evaluation Types - Strategic Analysis"
        breadcrumbs={[
          { label: "Knowledge Base", href: "/knowledge-base/" },
          { label: "All Tables", href: "/tables/" },
        ]}
        navLinks={[
          {
            label: "Eval Types",
            href: "/knowledge-base/models/eval-types/table",
            active: true,
          },
          {
            label: "Architectures",
            href: "/knowledge-base/architecture-scenarios/table",
          },
          {
            label: "Safety Approaches",
            href: "/knowledge-base/responses/safety-approaches/table",
          },
        ]}
      />

      <div className="p-4 space-y-4">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium mr-1">
            Filter by category:
          </span>
          <button
            className={cn(
              "px-2.5 py-1 rounded text-[11px] border transition-colors",
              !categoryFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
            onClick={() => setCategoryFilter(null)}
          >
            All
          </button>
          {EVAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] border transition-colors",
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <ColumnToggleControls
          columns={EVAL_TYPES_COLUMNS}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          presets={EVAL_TYPES_PRESETS}
          applyPreset={applyPreset}
        />

        <div className="max-w-4xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Comprehensive analysis of AI evaluation approaches and their
            strategic value for different risk scenarios.
            <strong className="text-foreground"> Key insight:</strong> No single
            eval approach is sufficient. Behavioral evals are gameable;
            interpretability isn't ready; human red teaming doesn't scale. A
            portfolio approach is required, with emphasis shifting based on
            which risks you prioritize.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Risk coverage:</strong> ● = strong signal, ◐ = partial
            signal, ○ = weak signal.
            <strong> Architecture dependence:</strong> LOW means works on any
            model; HIGH means needs specific access/architecture.
          </p>
        </div>

        <div className="max-w-4xl">
          <TableInsightsSummary
            tableId="eval-types"
            tags={[
              "evaluation",
              "benchmarks",
              "red-teaming",
              "interpretability",
              "evals",
            ]}
            maxItems={3}
          />
        </div>

        <ViewModeToggle
          viewMode={viewMode}
          setViewMode={setViewMode}
          unifiedLabel="Unified Table"
          groupedLabel="Grouped by Category"
        />

        {viewMode === "unified" ? (
          <div className="overflow-x-auto">
            <DataTable table={table} />
          </div>
        ) : (
          <div>
            {groupedData.map(({ category, data }) => (
              <GroupedCategoryTable
                key={category}
                category={category}
                data={data}
                columns={columns}
                columnVisibility={columnVisibility}
              />
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-4">
          {filteredData.length} evaluation types
          {categoryFilter && ` in ${categoryFilter}`}
          {!categoryFilter && ` across ${EVAL_CATEGORIES.length} categories`}
        </div>
      </div>
    </div>
  );
}
