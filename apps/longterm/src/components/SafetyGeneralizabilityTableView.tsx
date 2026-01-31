// Table view for Safety Research Generalizability Model
// Refactored to use TanStack Table and shared infrastructure
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { TableViewHeader, ColumnToggleControls } from "./tables/shared";
import {
  createSafetyGeneralizabilityColumns,
  SAFETY_GENERALIZABILITY_COLUMNS,
  SAFETY_GENERALIZABILITY_PRESETS,
  type SafetyGeneralizabilityColumnKey,
} from "./tables/safety-generalizability-columns";
import { useColumnVisibility } from "./tables/shared/useColumnVisibility";
import { getSafetyApproaches } from "@data/safety-generalizability-graph-data";

export default function SafetyGeneralizabilityTableView() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "generalizationLevel", desc: false },
  ]);

  const { visibleColumns, toggleColumn, applyPreset } = useColumnVisibility({
    columns: SAFETY_GENERALIZABILITY_COLUMNS,
    presets: SAFETY_GENERALIZABILITY_PRESETS,
  });

  // Convert Set to VisibilityState for TanStack Table
  const columnVisibility = useMemo(() => {
    const visibility: VisibilityState = { label: true };
    Object.keys(SAFETY_GENERALIZABILITY_COLUMNS).forEach((key) => {
      visibility[key] = visibleColumns.has(key as SafetyGeneralizabilityColumnKey);
    });
    return visibility;
  }, [visibleColumns]);

  const columns = useMemo(() => createSafetyGeneralizabilityColumns(), []);

  const approaches = useMemo(() => getSafetyApproaches(), []);

  const table = useReactTable({
    data: approaches,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TableViewHeader
        title="Safety Research Generalizability"
        breadcrumbs={[
          { label: "Models", href: "/knowledge-base/models/" },
        ]}
        navLinks={[
          {
            label: "Graph",
            href: "/knowledge-base/responses/safety-generalizability/graph",
          },
          {
            label: "Table",
            href: "/knowledge-base/responses/safety-generalizability/table",
            active: true,
          },
          {
            label: "Matrix",
            href: "/knowledge-base/responses/safety-generalizability/matrix",
          },
        ]}
      />

      <div className="p-4 space-y-4 max-w-6xl mx-auto">
        <ColumnToggleControls
          columns={SAFETY_GENERALIZABILITY_COLUMNS}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          presets={SAFETY_GENERALIZABILITY_PRESETS}
          applyPreset={applyPreset}
        />

        <p className="text-sm text-muted-foreground">
          This table summarizes which AI safety research approaches are likely to
          generalize to future AI architectures, and what conditions they depend
          on. Approaches are ordered from lowest to highest expected
          generalization.
        </p>

        <div className="overflow-x-auto">
          <DataTable table={table} />
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          {approaches.length} safety approaches
        </div>
      </div>
    </div>
  );
}
