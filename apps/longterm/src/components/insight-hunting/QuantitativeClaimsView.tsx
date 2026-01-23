"use client";

import * as React from "react";
import { Search, ExternalLink, Sparkles, Filter, RefreshCw } from "lucide-react";

interface QuantitativeClaim {
  text: string;
  type: string;
  filePath: string;
  lineNumber: number;
  context: string;
  hasImportanceIndicator: boolean;
}

interface ClaimsData {
  generatedAt: string;
  totalClaims: number;
  byType: Record<string, number>;
  claims: QuantitativeClaim[];
}

interface Props {
  data: ClaimsData | null;
}

type ClaimType = "all" | "percentage" | "dollar" | "timeline" | "multiplier" | "researcher_count" | "probability" | "large_number";

const TYPE_LABELS: Record<string, string> = {
  percentage: "Percentages",
  dollar: "Dollar Amounts",
  timeline: "Timelines",
  multiplier: "Multipliers",
  researcher_count: "People Counts",
  probability: "Probabilities",
  large_number: "Large Numbers",
};

const TYPE_COLORS: Record<string, string> = {
  percentage: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  dollar: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  timeline: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  multiplier: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  researcher_count: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  probability: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  large_number: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[type] || "bg-slate-100"}`}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function ClaimCard({ claim }: { claim: QuantitativeClaim }) {
  const pagePath = "/" + claim.filePath.replace(/\.mdx$/, "/").replace(/\/index$/, "/");

  // Highlight the claim text in context
  const highlightedContext = claim.context.replace(
    new RegExp(`(${claim.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
    '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-0.5 rounded">$1</mark>'
  );

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg">{claim.text}</span>
          {claim.hasImportanceIndicator && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
              <Sparkles className="h-3 w-3" />
              Notable
            </span>
          )}
        </div>
        <TypeBadge type={claim.type} />
      </div>

      <div
        className="text-sm text-muted-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: highlightedContext }}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
        <a href={pagePath} className="text-primary hover:underline flex items-center gap-1">
          {claim.filePath.split("/").pop()?.replace(".mdx", "")}
          <ExternalLink className="h-3 w-3" />
        </a>
        <span>Line {claim.lineNumber}</span>
      </div>
    </div>
  );
}

export function QuantitativeClaimsView({ data }: Props) {
  const [typeFilter, setTypeFilter] = React.useState<ClaimType>("all");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showOnlyNotable, setShowOnlyNotable] = React.useState(false);
  const [limit, setLimit] = React.useState(50);

  if (!data) {
    return (
      <div className="text-center py-12 space-y-4">
        <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
        <div className="text-muted-foreground">
          <p>Quantitative claims data not yet generated.</p>
          <p className="text-sm mt-2">
            Run: <code className="bg-muted px-2 py-1 rounded">node scripts/find-quantitative-claims.mjs</code>
          </p>
        </div>
      </div>
    );
  }

  const filteredClaims = React.useMemo(() => {
    let claims = data.claims;

    if (typeFilter !== "all") {
      claims = claims.filter((c) => c.type === typeFilter);
    }

    if (showOnlyNotable) {
      claims = claims.filter((c) => c.hasImportanceIndicator);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      claims = claims.filter(
        (c) =>
          c.text.toLowerCase().includes(lower) ||
          c.context.toLowerCase().includes(lower) ||
          c.filePath.toLowerCase().includes(lower)
      );
    }

    return claims.slice(0, limit);
  }, [data.claims, typeFilter, showOnlyNotable, searchTerm, limit]);

  const types = Object.keys(data.byType).sort((a, b) => data.byType[b] - data.byType[a]);
  const notableCount = data.claims.filter((c) => c.hasImportanceIndicator).length;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg text-sm">
        <div className="flex flex-col">
          <span className="text-xl font-bold">{data.totalClaims.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground uppercase">Total Claims</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{notableCount}</span>
          <span className="text-xs text-muted-foreground uppercase">Notable</span>
        </div>
        {types.slice(0, 4).map((type) => (
          <div key={type} className="flex flex-col border-l pl-3">
            <span className="text-xl font-bold">{data.byType[type]}</span>
            <span className="text-xs text-muted-foreground uppercase">{TYPE_LABELS[type] || type}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ClaimType)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">All types ({data.totalClaims})</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type] || type} ({data.byType[type]})
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyNotable}
            onChange={(e) => setShowOnlyNotable(e.target.checked)}
            className="rounded"
          />
          <span>Only notable ({notableCount})</span>
        </label>

        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
        >
          <option value={25}>Show 25</option>
          <option value={50}>Show 50</option>
          <option value={100}>Show 100</option>
          <option value={250}>Show 250</option>
        </select>
      </div>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
        <strong>What are quantitative claims?</strong> Numbers, percentages, dollar amounts, and timeline predictions
        extracted from content. <strong>Notable</strong> claims have importance indicators like "catastrophic",
        "surprising", "only", etc. These are candidates for extraction as standalone insights.
      </div>

      {/* Claims Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {filteredClaims.map((claim, i) => (
          <ClaimCard key={`${claim.filePath}-${claim.lineNumber}-${i}`} claim={claim} />
        ))}
      </div>

      {filteredClaims.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No claims match the current filters.</div>
      )}

      {filteredClaims.length === limit && (
        <div className="text-center py-4">
          <button
            onClick={() => setLimit((l) => l + 50)}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-sm font-medium"
          >
            Load more
          </button>
        </div>
      )}

      {/* Generation info */}
      <div className="text-xs text-muted-foreground text-center">
        Data generated: {new Date(data.generatedAt).toLocaleString()}
      </div>
    </div>
  );
}

export default QuantitativeClaimsView;
