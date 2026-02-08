import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@lib/utils";
import { Lightbulb, FlaskConical, Target, CheckCircle2 } from "lucide-react";
import { EntityTypeIcon, entityTypeConfig } from "./EntityTypeIcon";
import { severityColors, directionColors, maturityColors, riskCategoryColors } from "./shared/style-config";

type LucideIcon = React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

export type EntityType = string;

export interface ModelRatingsData {
  novelty?: number;
  rigor?: number;
  actionability?: number;
  completeness?: number;
}

interface InfoBoxProps {
  type: EntityType;
  title?: string;
  image?: string;
  website?: string;
  importance?: number;
  tractability?: number;
  neglectedness?: number;
  uncertainty?: number;
  founded?: string;
  location?: string;
  headcount?: string;
  funding?: string;
  severity?: string;
  likelihood?: string;
  timeframe?: string;
  category?: string;
  maturity?: string;
  relatedSolutions?: { id: string; title: string; type: string; href: string }[];
  affiliation?: string;
  role?: string;
  knownFor?: string;
  customFields?: { label: string; value: string; link?: string }[];
  relatedTopics?: string[];
  relatedEntries?: { type: string; title: string; href: string }[];
  ratings?: ModelRatingsData;
}

const typeLabels: Record<string, { label: string; color: string }> = {
  "lab-frontier": { label: "Frontier Lab", color: "#dc2626" },
  "lab-research": { label: "Research Lab", color: "#2563eb" },
  "lab-startup": { label: "Startup", color: "#7c3aed" },
  "lab-academic": { label: "Academic", color: "#059669" },
  lab: { label: "Organization", color: "#dc2626" },
  capability: { label: "Capability", color: "#0891b2" },
  risk: { label: "Risk", color: "#dc2626" },
  "risk-factor": { label: "Risk Factor", color: "#f97316" },
  "safety-agenda": { label: "Safety Agenda", color: "#7c3aed" },
  policy: { label: "Policy", color: "#0d9488" },
  crux: { label: "Key Crux", color: "#ea580c" },
  concept: { label: "Concept", color: "#6366f1" },
  researcher: { label: "Researcher", color: "#475569" },
  funder: { label: "Funder", color: "#16a34a" },
  intervention: { label: "Intervention", color: "#0891b2" },
  organization: { label: "Organization", color: "#64748b" },
  model: { label: "Model", color: "#8b5cf6" },
};

const defaultTypeInfo = { label: "Entry", color: "#6b7280" };

const categoryLabels: Record<string, string> = {
  accident: "Accident Risk",
  misuse: "Misuse Risk",
  structural: "Structural Risk",
  epistemic: "Epistemic Risk",
};

const maturityLabels: Record<string, string> = {
  neglected: "Neglected",
  emerging: "Emerging",
  growing: "Growing",
  mature: "Mature",
  established: "Established",
};

function getImportanceColor(value: number): string {
  if (value >= 90) return "#7c3aed";
  if (value >= 70) return "#8b5cf6";
  if (value >= 50) return "#6366f1";
  if (value >= 30) return "#3b82f6";
  return "#94a3b8";
}

function pluralize(label: string): string {
  return label.endsWith("y") ? label.slice(0, -1) + "ies" : label + "s";
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-sm relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[0.7rem] font-semibold text-muted-foreground min-w-[12px] text-right">{value}</span>
    </div>
  );
}

function RatingItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="grid grid-cols-[16px_1fr_60px] items-center gap-2">
      <Icon size={14} className="text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <RatingBar value={value} />
    </div>
  );
}

export function InfoBox({
  type,
  title,
  image,
  website,
  importance,
  tractability,
  neglectedness,
  uncertainty,
  founded,
  location,
  headcount,
  funding,
  severity,
  likelihood,
  timeframe,
  category,
  maturity,
  relatedSolutions,
  affiliation,
  role,
  knownFor,
  customFields,
  relatedTopics,
  relatedEntries,
  ratings,
}: InfoBoxProps) {
  const typeInfo = typeLabels[type] || defaultTypeInfo;

  const fields: { label: string; value: string; link?: string }[] = [];
  if (importance !== undefined) fields.push({ label: "Importance", value: Math.round(importance).toString() });
  if (founded) fields.push({ label: "Founded", value: founded });
  if (location) fields.push({ label: "Location", value: location });
  if (headcount) fields.push({ label: "Employees", value: headcount });
  if (funding) fields.push({ label: "Funding", value: funding });
  if (category) fields.push({ label: "Category", value: categoryLabels[category] || category, link: `/explore?riskCategory=${category}` });
  if (severity) fields.push({ label: "Severity", value: severity.charAt(0).toUpperCase() + severity.slice(1) });
  if (likelihood) fields.push({ label: "Likelihood", value: likelihood });
  if (timeframe) fields.push({ label: "Timeframe", value: timeframe });
  if (maturity) fields.push({ label: "Maturity", value: maturityLabels[maturity.toLowerCase()] || maturity });
  if (affiliation) fields.push({ label: "Affiliation", value: affiliation });
  if (role) fields.push({ label: "Role", value: role });
  if (knownFor) fields.push({ label: "Known For", value: knownFor });
  if (website) fields.push({ label: "Website", value: website });
  if (customFields) fields.push(...customFields);

  const catColor = category ? (riskCategoryColors as any)[category]?.hex : undefined;
  const matColor = maturity ? (maturityColors as any)[maturity.toLowerCase()]?.hex : undefined;

  const getValueStyle = (label: string): React.CSSProperties | undefined => {
    if (label === "Importance" && importance !== undefined) return { color: getImportanceColor(importance), fontWeight: 600 };
    if (label === "Severity" && severity) return { color: (severityColors as any)[severity]?.hex || "inherit", fontWeight: 600 };
    if (label === "Category" && catColor) return { color: catColor, fontWeight: 500 };
    if (label === "Maturity" && matColor) return { color: matColor, fontWeight: 500 };
    return undefined;
  };

  // Group related entries by type
  const groupedEntries = relatedEntries?.reduce(
    (acc, entry) => {
      if (!acc[entry.type]) acc[entry.type] = [];
      acc[entry.type].push(entry);
      return acc;
    },
    {} as Record<string, typeof relatedEntries>
  );

  const sortedTypes = groupedEntries ? Object.keys(groupedEntries) : [];
  const hasITN = tractability !== undefined || neglectedness !== undefined || uncertainty !== undefined;

  return (
    <Card className="wiki-infobox float-right w-[280px] mb-4 ml-6 overflow-hidden text-sm max-md:float-none max-md:w-full max-md:ml-0 max-md:mb-6">
      {/* Header */}
      <div className="px-3 py-2.5 text-white" style={{ backgroundColor: typeInfo.color }}>
        <span className="block text-[10px] uppercase tracking-wide opacity-90 mb-0.5">{typeInfo.label}</span>
        {title && <h3 className="m-0 text-sm font-semibold leading-tight text-white">{title}</h3>}
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div className="py-2">
          {fields.map((field, index) => {
            const href = field.link || customFields?.find((cf) => cf.label === field.label)?.link;
            return (
              <div key={index} className="flex py-1.5 border-b border-border last:border-b-0 px-4">
                <span className="flex-shrink-0 w-[100px] min-w-[100px] text-muted-foreground font-medium pr-2">
                  {field.label}
                </span>
                <span className="flex-1 text-foreground break-words" style={!href ? getValueStyle(field.label) : undefined}>
                  {field.label === "Website" ? (
                    <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-accent-foreground no-underline hover:underline">
                      {new URL(field.value).hostname.replace("www.", "")}
                    </a>
                  ) : href ? (
                    <Link href={href} className="no-underline hover:underline" style={getValueStyle(field.label)}>{field.value}</Link>
                  ) : (
                    field.value
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Solutions */}
      {relatedSolutions && relatedSolutions.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Solutions</div>
          <div className="flex flex-wrap gap-1.5">
            {relatedSolutions.map((s, i) => (
              <Link key={i} href={s.href} className="inline-block px-2 py-1 bg-emerald-500/15 rounded text-xs text-emerald-500 no-underline hover:bg-emerald-500/25">
                {s.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Topics */}
      {relatedTopics && relatedTopics.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Related Topics</div>
          <div className="flex flex-wrap gap-1.5">
            {relatedTopics.map((topic, i) => (
              <Link
                key={i}
                href={`/explore?tag=${encodeURIComponent(topic)}`}
                className="inline-block px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground no-underline hover:bg-muted/80 hover:text-foreground transition-colors"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Entries */}
      {groupedEntries && sortedTypes.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Related</div>
          <div className="flex flex-col gap-2">
            {sortedTypes.map((t) => {
              const entries = groupedEntries![t]!;
              const config = entityTypeConfig[t as keyof typeof entityTypeConfig];
              const info = typeLabels[t] || defaultTypeInfo;
              return (
                <div key={t} className="flex flex-col gap-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {config && <EntityTypeIcon type={t} size="xs" />}
                    <span className="text-muted-foreground font-medium text-[0.7rem] uppercase tracking-tight">
                      {pluralize(info.label)}
                    </span>
                  </div>
                  <ul className="list-none m-0 p-0 pl-[1.125rem] flex flex-col">
                    {entries.map((entry, i) => (
                      <li key={i} className="list-none m-0 p-0 leading-snug">
                        <Link href={entry.href} className="text-accent-foreground no-underline hover:underline">{entry.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ratings */}
      {ratings && Object.values(ratings).some((v) => v !== undefined) && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Model Quality</div>
          <div className="flex flex-col gap-2">
            {ratings.novelty !== undefined && <RatingItem icon={Lightbulb} label="Novelty" value={ratings.novelty} />}
            {ratings.rigor !== undefined && <RatingItem icon={FlaskConical} label="Rigor" value={ratings.rigor} />}
            {ratings.actionability !== undefined && <RatingItem icon={Target} label="Actionability" value={ratings.actionability} />}
            {ratings.completeness !== undefined && <RatingItem icon={CheckCircle2} label="Completeness" value={ratings.completeness} />}
          </div>
        </div>
      )}

      {/* ITN Framework */}
      {hasITN && (
        <div className="px-4 py-3 border-t border-border">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Prioritization</div>
          <div className="py-2">
            {importance !== undefined && (
              <div className="flex py-1.5 border-b border-border last:border-b-0">
                <span className="flex-shrink-0 w-[100px] text-muted-foreground font-medium pr-2">Importance</span>
                <span className="flex-1 text-foreground font-semibold">{importance}</span>
              </div>
            )}
            {tractability !== undefined && (
              <div className="flex py-1.5 border-b border-border last:border-b-0">
                <span className="flex-shrink-0 w-[100px] text-muted-foreground font-medium pr-2">Tractability</span>
                <span className="flex-1 text-foreground font-semibold">{tractability}</span>
              </div>
            )}
            {neglectedness !== undefined && (
              <div className="flex py-1.5 border-b border-border last:border-b-0">
                <span className="flex-shrink-0 w-[100px] text-muted-foreground font-medium pr-2">Neglectedness</span>
                <span className="flex-1 text-foreground font-semibold">{neglectedness}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default InfoBox;
