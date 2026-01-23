"use client";

import * as React from "react";
import { ExternalLink, Lightbulb, Copy, Check, Filter } from "lucide-react";
import {
  getSafetyApproachCandidates,
  getAccidentRiskCandidates,
  type TableCandidate,
} from "@/lib/insight-hunting";

type SourceType = "all" | "safety-approaches" | "accident-risks";

function CriteriaBadge({ criterion }: { criterion: string }) {
  // Color based on criterion type
  let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (criterion.includes("Capability-dominant") || criterion.includes("questionable")) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
  } else if (criterion.includes("Defund") || criterion.includes("harmful")) {
    colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  } else if (criterion.includes("Prioritize") || criterion.includes("High priority")) {
    colorClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  } else if (criterion.includes("Severe") || criterion.includes("catastrophic")) {
    colorClass = "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
  } else if (criterion.includes("deception") || criterion.includes("scale")) {
    colorClass = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {criterion}
    </span>
  );
}

function RatingBadge({ label, value }: { label: string; value: string }) {
  let colorClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  // Color coding based on value
  const lowerValue = value.toLowerCase();
  if (
    lowerValue.includes("dominant") ||
    lowerValue.includes("defund") ||
    lowerValue.includes("existential") ||
    lowerValue.includes("catastrophic") ||
    lowerValue.includes("very_difficult")
  ) {
    colorClass = "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300";
  } else if (
    lowerValue.includes("prioritize") ||
    lowerValue.includes("strong") ||
    lowerValue.includes("high")
  ) {
    colorClass = "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300";
  } else if (
    lowerValue.includes("reduce") ||
    lowerValue.includes("weak") ||
    lowerValue.includes("none") ||
    lowerValue.includes("breaks")
  ) {
    colorClass = "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${colorClass}`}>
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function SourceBadge({ source }: { source: TableCandidate["source"] }) {
  const config: Record<TableCandidate["source"], { label: string; color: string }> = {
    "safety-approaches": {
      label: "Safety Approaches",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    "accident-risks": {
      label: "Accident Risks",
      color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    },
    "eval-types": {
      label: "Eval Types",
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
  };

  const { label, color } = config[source];

  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>;
}

function CandidateCard({ candidate }: { candidate: TableCandidate }) {
  const [copied, setCopied] = React.useState(false);

  const copyTemplate = () => {
    navigator.clipboard.writeText(candidate.potentialInsightTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTableLink = () => {
    if (candidate.source === "safety-approaches") {
      return `/knowledge-base/responses/safety-approaches/table#${candidate.id}`;
    }
    if (candidate.source === "accident-risks") {
      return `/knowledge-base/risks/accident/${candidate.pageSlug || candidate.id}/`;
    }
    return "#";
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-base">{candidate.name}</h3>
          <SourceBadge source={candidate.source} />
        </div>
        <a
          href={getTableLink()}
          className="text-primary hover:underline flex items-center gap-1 text-sm"
        >
          View
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Matched Criteria */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground uppercase">Matched Criteria</div>
        <div className="flex flex-wrap gap-1">
          {candidate.matchedCriteria.map((criterion, i) => (
            <CriteriaBadge key={i} criterion={criterion} />
          ))}
        </div>
      </div>

      {/* Key Ratings */}
      <div className="space-y-1">
        <div className="text-xs font-medium text-muted-foreground uppercase">Key Ratings</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(candidate.keyRatings).map(([label, value]) => (
            <RatingBadge key={label} label={label} value={value} />
          ))}
        </div>
      </div>

      {/* Potential Insight Template */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Potential Insight
          </div>
          <button
            onClick={copyTemplate}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="text-sm bg-muted/50 rounded p-2 text-muted-foreground italic">
          "{candidate.potentialInsightTemplate}"
        </div>
      </div>
    </div>
  );
}

export function TableCandidatesView() {
  const [sourceFilter, setSourceFilter] = React.useState<SourceType>("all");

  const safetyApproachCandidates = React.useMemo(() => getSafetyApproachCandidates(), []);
  const accidentRiskCandidates = React.useMemo(() => getAccidentRiskCandidates(), []);

  const allCandidates = React.useMemo(() => {
    if (sourceFilter === "safety-approaches") return safetyApproachCandidates;
    if (sourceFilter === "accident-risks") return accidentRiskCandidates;
    return [...safetyApproachCandidates, ...accidentRiskCandidates];
  }, [sourceFilter, safetyApproachCandidates, accidentRiskCandidates]);

  const stats = {
    total: safetyApproachCandidates.length + accidentRiskCandidates.length,
    safetyApproaches: safetyApproachCandidates.length,
    accidentRisks: accidentRiskCandidates.length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg text-sm">
        <div className="flex flex-col">
          <span className="text-xl font-bold">{stats.total}</span>
          <span className="text-xs text-muted-foreground uppercase">Total Candidates</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{stats.safetyApproaches}</span>
          <span className="text-xs text-muted-foreground uppercase">Safety Approaches</span>
        </div>
        <div className="flex flex-col border-l pl-3">
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.accidentRisks}</span>
          <span className="text-xs text-muted-foreground uppercase">Accident Risks</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter by source:</span>
        <div className="flex gap-1">
          {(["all", "safety-approaches", "accident-risks"] as SourceType[]).map((source) => (
            <button
              key={source}
              onClick={() => setSourceFilter(source)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                sourceFilter === source
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {source === "all"
                ? "All"
                : source === "safety-approaches"
                ? "Safety Approaches"
                : "Accident Risks"}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
        <strong>What makes a table row insight-worthy?</strong>
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          <li>
            <strong>Safety Approaches:</strong> Capability-dominant differential progress, weak/no deception robustness,
            PRIORITIZE/DEFUND recommendations, unclear net safety
          </li>
          <li>
            <strong>Accident Risks:</strong> Catastrophic/existential severity combined with difficult detectability,
            lab-demonstrated evidence of severe risks
          </li>
        </ul>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {allCandidates.map((candidate) => (
          <CandidateCard key={`${candidate.source}-${candidate.id}`} candidate={candidate} />
        ))}
      </div>

      {allCandidates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No candidates match the current filter.
        </div>
      )}
    </div>
  );
}

export default TableCandidatesView;
