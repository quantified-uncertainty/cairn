import React from 'react';
import { Lightbulb, FlaskConical, Target, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import type { EntityType } from '../../data/schema';
import { EntityTypeIcon, entityTypeConfig } from './EntityTypeIcon';
import { severityColors, directionColors, maturityColors, riskCategoryColors } from './shared/style-config';

// Define LucideIcon type locally to avoid ESM/CJS issues
type LucideIcon = React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

// Re-export for consumers of this module
export type { EntityType };

export interface ModelRatingsData {
  novelty?: number;
  rigor?: number;
  actionability?: number;
  completeness?: number;
}

interface RelatedEntry {
  type: EntityType;
  title: string;
  href: string;
  description?: string;
}

interface RelatedSolution {
  id: string;
  title: string;
  type: string;
  href: string;
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
  severity?: 'low' | 'medium' | 'high' | 'catastrophic';
  likelihood?: string;
  timeframe?: string;
  category?: string;
  maturity?: string;
  relatedSolutions?: RelatedSolution[];
  jurisdiction?: string;
  status?: string;
  effectiveDate?: string;
  organization?: string;
  approach?: string;
  currentLevel?: string;
  projectedTimeline?: string;
  affiliation?: string;
  role?: string;
  knownFor?: string;
  customFields?: { label: string; value: string; link?: string }[];
  relatedTopics?: string[];
  relatedEntries?: RelatedEntry[];
  ratings?: ModelRatingsData;
}

// ============================================================================
// Sub-components for DRY code
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-border">
      <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children, noPadding }: { label: string; children: React.ReactNode; noPadding?: boolean }) {
  return (
    <div className={cn("flex py-1.5 border-b border-border last:border-b-0", noPadding ? "px-0" : "px-4")}>
      <span className="flex-shrink-0 w-[100px] min-w-[100px] text-muted-foreground font-medium pr-2">
        {label}
      </span>
      {children}
    </div>
  );
}

function Value({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <span className="flex-1 text-foreground break-words" style={style}>
      {children}
    </span>
  );
}

function Link({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-accent-foreground no-underline hover:underline"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-muted rounded-sm relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-sm transition-[width] duration-300"
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

function TagList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Tag({ href, variant = 'default', children }: { href?: string; variant?: 'default' | 'success'; children: React.ReactNode }) {
  const baseClass = variant === 'success'
    ? "inline-block px-2 py-1 bg-emerald-500/15 rounded text-xs text-emerald-500 no-underline transition-colors hover:bg-emerald-500/25"
    : "inline-block px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground transition-colors hover:bg-muted/80";

  if (href) {
    return <a href={href} className={baseClass}>{children}</a>;
  }
  return <span className={baseClass}>{children}</span>;
}

// ============================================================================
// Config
// ============================================================================

const typeLabels: Record<EntityType, { label: string; color: string }> = {
  'lab-frontier': { label: 'Frontier Lab', color: '#dc2626' },
  'lab-research': { label: 'Research Lab', color: '#2563eb' },
  'lab-startup': { label: 'Startup', color: '#7c3aed' },
  'lab-academic': { label: 'Academic', color: '#059669' },
  'lab': { label: 'Organization', color: '#dc2626' },
  'capability': { label: 'Capability', color: '#0891b2' },
  'risk': { label: 'Risk', color: '#dc2626' },
  'risk-factor': { label: 'Risk Factor', color: '#f97316' },
  'safety-agenda': { label: 'Safety Agenda', color: '#7c3aed' },
  'policy': { label: 'Policy', color: '#0d9488' },
  'crux': { label: 'Key Crux', color: '#ea580c' },
  'concept': { label: 'Concept', color: '#6366f1' },
  'case-study': { label: 'Historical Case Study', color: '#78716c' },
  'researcher': { label: 'Researcher', color: '#475569' },
  'scenario': { label: 'Scenario', color: '#9333ea' },
  'resource': { label: 'Resource', color: '#4f46e5' },
  'funder': { label: 'Funder', color: '#16a34a' },
  'intervention': { label: 'Intervention', color: '#0891b2' },
  'organization': { label: 'Organization', color: '#64748b' },
  'historical': { label: 'Historical', color: '#78716c' },
  'analysis': { label: 'Analysis', color: '#0ea5e9' },
  'model': { label: 'Model', color: '#8b5cf6' },
  'parameter': { label: 'Parameter', color: '#d946ef' },
  'metric': { label: 'Metric', color: '#2563eb' },
  'safety-approaches': { label: 'Safety Approach', color: '#10b981' },
  'policies': { label: 'Policies', color: '#0d9488' },
  'concepts': { label: 'Concepts', color: '#6366f1' },
  'events': { label: 'Event', color: '#f59e0b' },
  'models': { label: 'Models', color: '#8b5cf6' },
  'argument': { label: 'Argument', color: '#ef4444' },
  'ai-transition-model-parameter': { label: 'ATM Parameter', color: '#d946ef' },
  'ai-transition-model-metric': { label: 'ATM Metric', color: '#2563eb' },
  'ai-transition-model-scenario': { label: 'ATM Scenario', color: '#9333ea' },
  'ai-transition-model-factor': { label: 'ATM Factor', color: '#f97316' },
  'ai-transition-model-subitem': { label: 'ATM Sub-item', color: '#64748b' },
};

const defaultTypeInfo = { label: 'Entry', color: '#6b7280' };

// Category display labels (using hex colors from shared config)
const categoryLabels: Record<string, string> = {
  accident: 'Accident Risk',
  misuse: 'Misuse Risk',
  structural: 'Structural Risk',
  epistemic: 'Epistemic Risk',
};

const maturityLabels: Record<string, string> = {
  neglected: 'Neglected',
  emerging: 'Emerging',
  growing: 'Growing',
  mature: 'Mature',
  established: 'Established',
};

function getImportanceColor(value: number): string {
  if (value >= 90) return '#7c3aed';
  if (value >= 70) return '#8b5cf6';
  if (value >= 50) return '#6366f1';
  if (value >= 30) return '#3b82f6';
  return '#94a3b8';
}

function getDirectionType(value: string): 'higher' | 'lower' | 'context' | null {
  const lower = value.toLowerCase();
  if (lower.includes('higher is better') || lower.includes('higher')) return 'higher';
  if (lower.includes('lower is better') || lower.includes('lower')) return 'lower';
  if (lower.includes('context') || lower.includes('optimal') || lower.includes('depends')) return 'context';
  return null;
}

function pluralize(label: string): string {
  return label.endsWith('y') ? label.slice(0, -1) + 'ies' : label + 's';
}

// ============================================================================
// Main Component
// ============================================================================

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
  jurisdiction,
  status,
  effectiveDate,
  organization,
  approach,
  currentLevel,
  projectedTimeline,
  affiliation,
  role,
  knownFor,
  customFields,
  relatedTopics,
  relatedEntries,
  ratings,
}: InfoBoxProps) {
  const typeInfo = typeLabels[type] || defaultTypeInfo;

  // Build fields array
  const fields: { label: string; value: string }[] = [];
  if (importance !== undefined) fields.push({ label: 'Importance', value: Math.round(importance).toString() });
  if (founded) fields.push({ label: 'Founded', value: founded });
  if (location) fields.push({ label: 'Location', value: location });
  if (headcount) fields.push({ label: 'Employees', value: headcount });
  if (funding) fields.push({ label: 'Funding', value: funding });
  if (category) fields.push({ label: 'Category', value: categoryLabels[category] || category });
  if (severity) fields.push({ label: 'Severity', value: severity.charAt(0).toUpperCase() + severity.slice(1) });
  if (likelihood) fields.push({ label: 'Likelihood', value: likelihood });
  if (timeframe) fields.push({ label: 'Timeframe', value: timeframe });
  if (maturity) fields.push({ label: 'Maturity', value: maturityLabels[maturity.toLowerCase()] || maturity });
  if (jurisdiction) fields.push({ label: 'Jurisdiction', value: jurisdiction });
  if (status) fields.push({ label: 'Status', value: status });
  if (effectiveDate) fields.push({ label: 'Effective', value: effectiveDate });
  if (organization) fields.push({ label: 'Organization', value: organization });
  if (approach) fields.push({ label: 'Approach', value: approach });
  if (currentLevel) fields.push({ label: 'Current Level', value: currentLevel });
  if (projectedTimeline) fields.push({ label: 'Timeline', value: projectedTimeline });
  if (affiliation) fields.push({ label: 'Affiliation', value: affiliation });
  if (role) fields.push({ label: 'Role', value: role });
  if (knownFor) fields.push({ label: 'Known For', value: knownFor });
  if (website) fields.push({ label: 'Website', value: website });
  if (customFields) fields.push(...customFields);

  const catColor = category ? riskCategoryColors[category as keyof typeof riskCategoryColors]?.hex : undefined;
  const matColor = maturity ? maturityColors[maturity.toLowerCase() as keyof typeof maturityColors]?.hex : undefined;

  const getValueStyle = (label: string): React.CSSProperties | undefined => {
    if (label === 'Importance' && importance !== undefined) return { color: getImportanceColor(importance), fontWeight: 600 };
    if (label === 'Severity' && severity) return { color: severityColors[severity as keyof typeof severityColors]?.hex || 'inherit', fontWeight: 600 };
    if (label === 'Category' && catColor) return { color: catColor, fontWeight: 500 };
    if (label === 'Maturity' && matColor) return { color: matColor, fontWeight: 500 };
    return undefined;
  };

  // Group related entries by type
  const groupedEntries = relatedEntries?.reduce((acc, entry) => {
    if (!acc[entry.type]) acc[entry.type] = [];
    acc[entry.type].push(entry);
    return acc;
  }, {} as Record<string, RelatedEntry[]>);

  const typeOrder: EntityType[] = [
    'metric', 'parameter', 'risk', 'risk-factor', 'intervention', 'safety-agenda',
    'policy', 'capability', 'model', 'concept', 'crux', 'organization',
    'lab', 'lab-frontier', 'lab-research', 'lab-startup', 'lab-academic',
    'researcher', 'funder', 'resource', 'analysis', 'case-study', 'scenario', 'historical'
  ];

  const sortedTypes = groupedEntries
    ? Object.keys(groupedEntries).sort((a, b) => {
        const aIdx = typeOrder.indexOf(a as EntityType);
        const bIdx = typeOrder.indexOf(b as EntityType);
        if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      })
    : [];

  const hasITN = tractability !== undefined || neglectedness !== undefined || uncertainty !== undefined;

  return (
    <Card className="wiki-infobox float-right w-[280px] mb-4 ml-6 overflow-hidden text-sm max-md:float-none max-md:w-full max-md:ml-0 max-md:mb-6">
      {/* Header */}
      <div className="px-3 py-2.5 text-white" style={{ backgroundColor: typeInfo.color }}>
        <span className="block text-[10px] uppercase tracking-wide opacity-90 mb-0.5">{typeInfo.label}</span>
        {title && <h3 className="m-0 text-sm font-semibold leading-tight text-white">{title}</h3>}
      </div>

      {/* Image */}
      {image && (
        <div className="p-4 bg-muted flex justify-center">
          <img src={image} alt={title || 'Entity image'} className="max-w-full max-h-[150px] object-contain" />
        </div>
      )}

      {/* Fields */}
      {fields.length > 0 && (
        <div className="py-2">
          {fields.map((field, index) => {
            const fieldLink = customFields?.find(cf => cf.label === field.label)?.link;

            if (field.label === 'Direction') {
              const dirType = getDirectionType(field.value);
              const config = dirType ? directionColors[dirType] : null;
              return (
                <Row key={index} label={field.label}>
                  <span className="flex-1 text-foreground break-words flex items-center gap-1.5">
                    {config && <span style={{ color: config.color, fontSize: '1rem', lineHeight: 1 }}>{config.icon}</span>}
                    <span>{field.value}</span>
                  </span>
                </Row>
              );
            }

            return (
              <Row key={index} label={field.label}>
                <Value style={getValueStyle(field.label)}>
                  {field.label === 'Website' ? (
                    <Link href={field.value} external>{new URL(field.value).hostname.replace('www.', '')}</Link>
                  ) : fieldLink ? (
                    <Link href={fieldLink}>{field.value}</Link>
                  ) : (
                    field.value
                  )}
                </Value>
              </Row>
            );
          })}
        </div>
      )}

      {/* Solutions */}
      {relatedSolutions && relatedSolutions.length > 0 && (
        <Section title="Solutions">
          <TagList>
            {relatedSolutions.map((solution, i) => (
              <Tag key={i} href={solution.href} variant="success">{solution.title}</Tag>
            ))}
          </TagList>
        </Section>
      )}

      {/* Related Topics */}
      {relatedTopics && relatedTopics.length > 0 && (
        <Section title="Related Topics">
          <TagList>
            {relatedTopics.map((topic, i) => <Tag key={i}>{topic}</Tag>)}
          </TagList>
        </Section>
      )}

      {/* Related Entries */}
      {groupedEntries && sortedTypes.length > 0 && (
        <Section title="Related">
          <div className="flex flex-col gap-2">
            {sortedTypes.map((t) => {
              const entries = groupedEntries[t];
              const config = entityTypeConfig[t as keyof typeof entityTypeConfig];
              const info = typeLabels[t as EntityType] || defaultTypeInfo;
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
                        <Link href={entry.href}>{entry.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Ratings */}
      {ratings && Object.values(ratings).some(v => v !== undefined) && (
        <Section title="Model Quality">
          <div className="flex flex-col gap-2">
            {ratings.novelty !== undefined && <RatingItem icon={Lightbulb} label="Novelty" value={ratings.novelty} />}
            {ratings.rigor !== undefined && <RatingItem icon={FlaskConical} label="Rigor" value={ratings.rigor} />}
            {ratings.actionability !== undefined && <RatingItem icon={Target} label="Actionability" value={ratings.actionability} />}
            {ratings.completeness !== undefined && <RatingItem icon={CheckCircle2} label="Completeness" value={ratings.completeness} />}
          </div>
        </Section>
      )}

      {/* ITN Framework */}
      {hasITN && (
        <Section title="Prioritization">
          <div className="py-2">
            {importance !== undefined && (
              <Row label="Importance" noPadding><Value style={{ fontWeight: 600 }}>{importance}</Value></Row>
            )}
            {tractability !== undefined && (
              <Row label="Tractability" noPadding><Value style={{ fontWeight: 600 }}>{tractability}</Value></Row>
            )}
            {neglectedness !== undefined && (
              <Row label="Neglectedness" noPadding><Value style={{ fontWeight: 600 }}>{neglectedness}</Value></Row>
            )}
            {uncertainty !== undefined && (
              <Row label="Uncertainty" noPadding><Value style={{ fontWeight: 600 }}>{uncertainty}</Value></Row>
            )}
          </div>
        </Section>
      )}
    </Card>
  );
}

export default InfoBox;
