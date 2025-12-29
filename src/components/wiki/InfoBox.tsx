import React from 'react';
import { Lightbulb, FlaskConical, Target, CheckCircle2 } from 'lucide-react';
import './wiki.css';
import type { EntityType } from '../../data/schema';
import { EntityTypeIcon, entityTypeConfig } from './EntityTypeIcon';

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
  // Common fields
  title?: string;
  image?: string;
  website?: string;
  importance?: number;
  // ITN framework (0-100 scale) - for parameters
  tractability?: number;
  neglectedness?: number;
  uncertainty?: number;

  // Lab-specific
  founded?: string;
  location?: string;
  headcount?: string;
  funding?: string;

  // Risk-specific
  severity?: 'low' | 'medium' | 'high' | 'catastrophic';
  likelihood?: string;
  timeframe?: string;
  category?: string;
  maturity?: string;
  relatedSolutions?: RelatedSolution[];

  // Policy-specific
  jurisdiction?: string;
  status?: string;
  effectiveDate?: string;

  // Safety agenda specific
  organization?: string;
  approach?: string;

  // Capability specific
  currentLevel?: string;
  projectedTimeline?: string;

  // Researcher-specific
  affiliation?: string;
  role?: string;
  knownFor?: string;

  // Custom fields (with optional link support)
  customFields?: { label: string; value: string; link?: string }[];

  // Related content
  relatedTopics?: string[];
  relatedEntries?: RelatedEntry[];

  // Model-specific ratings
  ratings?: ModelRatingsData;
}

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
};

const defaultTypeInfo = { label: 'Entry', color: '#6b7280' };

// Compact rating bar for sidebar display
function RatingBar({ value, max = 5 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100;
  return (
    <div className="wiki-infobox__rating-bar">
      <div className="wiki-infobox__rating-bar-track">
        <div
          className="wiki-infobox__rating-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="wiki-infobox__rating-value">{value}</span>
    </div>
  );
}

const severityColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  catastrophic: '#dc2626',
};

// Direction indicator config for parameters
const directionConfig: Record<string, { icon: string; color: string }> = {
  'higher': { icon: '▲', color: '#10b981' }, // emerald-500
  'lower': { icon: '▼', color: '#3b82f6' },  // blue-500
  'context': { icon: '◆', color: '#f59e0b' }, // amber-500
};

// Helper to detect direction type from text
function getDirectionType(value: string): 'higher' | 'lower' | 'context' | null {
  const lower = value.toLowerCase();
  if (lower.includes('higher is better') || lower.includes('higher')) return 'higher';
  if (lower.includes('lower is better') || lower.includes('lower')) return 'lower';
  if (lower.includes('context') || lower.includes('optimal') || lower.includes('depends')) return 'context';
  return null;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  accident: { label: 'Accident Risk', color: '#f59e0b' },
  misuse: { label: 'Misuse Risk', color: '#ef4444' },
  structural: { label: 'Structural Risk', color: '#6366f1' },
  epistemic: { label: 'Epistemic Risk', color: '#a855f7' },
};

const maturityConfig: Record<string, { label: string; color: string }> = {
  neglected: { label: 'Neglected', color: '#ef4444' },
  emerging: { label: 'Emerging', color: '#f59e0b' },
  growing: { label: 'Growing', color: '#3b82f6' },
  mature: { label: 'Mature', color: '#22c55e' },
};

// Get importance color based on 0-100 scale
function getImportanceColor(value: number): string {
  if (value >= 90) return '#7c3aed'; // purple-600 - essential
  if (value >= 70) return '#8b5cf6'; // purple-500 - high
  if (value >= 50) return '#6366f1'; // indigo-500 - useful
  if (value >= 30) return '#3b82f6'; // blue-500 - reference
  return '#94a3b8'; // slate-400 - peripheral
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

  const fields: { label: string; value: string }[] = [];

  // Add importance first if present (universal field) - now 0-100 scale
  if (importance !== undefined) {
    fields.push({ label: 'Importance', value: Math.round(importance).toString() });
  }

  // Add fields based on type
  if (founded) fields.push({ label: 'Founded', value: founded });
  if (location) fields.push({ label: 'Location', value: location });
  if (headcount) fields.push({ label: 'Employees', value: headcount });
  if (funding) fields.push({ label: 'Funding', value: funding });
  if (category) {
    const catConfig = categoryConfig[category];
    fields.push({ label: 'Category', value: catConfig?.label || category });
  }
  if (severity) fields.push({ label: 'Severity', value: severity.charAt(0).toUpperCase() + severity.slice(1) });
  if (likelihood) fields.push({ label: 'Likelihood', value: likelihood });
  if (timeframe) fields.push({ label: 'Timeframe', value: timeframe });
  if (maturity) {
    const matConfig = maturityConfig[maturity.toLowerCase()];
    fields.push({ label: 'Maturity', value: matConfig?.label || maturity });
  }
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

  // Add custom fields
  if (customFields) {
    fields.push(...customFields);
  }

  // Get category color for styling
  const catColor = category ? categoryConfig[category]?.color : undefined;
  const matColor = maturity ? maturityConfig[maturity.toLowerCase()]?.color : undefined;

  return (
    <div className="wiki-infobox">
      <div
        className="wiki-infobox__header"
        style={{ backgroundColor: typeInfo.color }}
      >
        <span className="wiki-infobox__type">{typeInfo.label}</span>
        {title && <h3 className="wiki-infobox__title">{title}</h3>}
      </div>

      {image && (
        <div className="wiki-infobox__image">
          <img src={image} alt={title || 'Entity image'} />
        </div>
      )}

      <div className="wiki-infobox__content">
        {fields.map((field, index) => {
          // Determine styling based on field type
          let valueStyle: React.CSSProperties | undefined;
          if (field.label === 'Importance' && importance !== undefined) {
            valueStyle = { color: getImportanceColor(importance), fontWeight: 600 };
          } else if (field.label === 'Severity' && severity) {
            valueStyle = { color: severityColors[severity] || 'inherit', fontWeight: 600 };
          } else if (field.label === 'Category' && catColor) {
            valueStyle = { color: catColor, fontWeight: 500 };
          } else if (field.label === 'Maturity' && matColor) {
            valueStyle = { color: matColor, fontWeight: 500 };
          }

          // Check if this field has a link (from customFields)
          const fieldLink = customFields?.find(cf => cf.label === field.label)?.link;

          // Special rendering for Direction field
          if (field.label === 'Direction') {
            const dirType = getDirectionType(field.value);
            const config = dirType ? directionConfig[dirType] : null;
            return (
              <div key={index} className="wiki-infobox__row">
                <span className="wiki-infobox__label">{field.label}</span>
                <span className="wiki-infobox__value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {config && (
                    <span style={{ color: config.color, fontSize: '1rem', lineHeight: 1 }}>{config.icon}</span>
                  )}
                  <span>{field.value}</span>
                </span>
              </div>
            );
          }

          return (
            <div key={index} className="wiki-infobox__row">
              <span className="wiki-infobox__label">{field.label}</span>
              <span className="wiki-infobox__value" style={valueStyle}>
                {field.label === 'Website' ? (
                  <a href={field.value} target="_blank" rel="noopener noreferrer">
                    {new URL(field.value).hostname.replace('www.', '')}
                  </a>
                ) : fieldLink ? (
                  <a href={fieldLink}>{field.value}</a>
                ) : (
                  field.value
                )}
              </span>
            </div>
          );
        })}
      </div>

      {relatedSolutions && relatedSolutions.length > 0 && (
        <div className="wiki-infobox__section">
          <div className="wiki-infobox__section-title">Solutions</div>
          <div className="wiki-infobox__solutions">
            {relatedSolutions.map((solution, index) => (
              <a key={index} href={solution.href} className="wiki-infobox__solution-tag">
                {solution.title}
              </a>
            ))}
          </div>
        </div>
      )}

      {relatedTopics && relatedTopics.length > 0 && (
        <div className="wiki-infobox__section">
          <div className="wiki-infobox__section-title">Related Topics</div>
          <div className="wiki-infobox__topics">
            {relatedTopics.map((topic, index) => (
              <span key={index} className="wiki-infobox__topic-tag">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {relatedEntries && relatedEntries.length > 0 && (() => {
        // Group entries by type
        const groupedEntries = relatedEntries.reduce((acc, entry) => {
          const type = entry.type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(entry);
          return acc;
        }, {} as Record<string, typeof relatedEntries>);

        // Define display order for types (most important first)
        const typeOrder: EntityType[] = [
          'metric', 'parameter', 'risk', 'risk-factor', 'intervention', 'safety-agenda',
          'policy', 'capability', 'model', 'concept', 'crux', 'organization',
          'lab', 'lab-frontier', 'lab-research', 'lab-startup', 'lab-academic',
          'researcher', 'funder', 'resource', 'analysis', 'case-study', 'scenario', 'historical'
        ];

        // Sort types by defined order, unknown types at end
        const sortedTypes = Object.keys(groupedEntries).sort((a, b) => {
          const aIdx = typeOrder.indexOf(a as EntityType);
          const bIdx = typeOrder.indexOf(b as EntityType);
          if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
          if (aIdx === -1) return 1;
          if (bIdx === -1) return -1;
          return aIdx - bIdx;
        });

        return (
          <div className="wiki-infobox__section">
            <div className="wiki-infobox__section-title">Related</div>
            <div className="wiki-infobox__grouped-entries">
              {sortedTypes.map((type) => {
                const entries = groupedEntries[type];
                const config = entityTypeConfig[type as keyof typeof entityTypeConfig];
                const typeInfo = typeLabels[type as EntityType] || defaultTypeInfo;
                // Always use plural for section headers
                const label = typeInfo.label.endsWith('y')
                  ? typeInfo.label.slice(0, -1) + 'ies'
                  : typeInfo.label + 's';

                return (
                  <div key={type} className="wiki-infobox__entry-group">
                    <div className="wiki-infobox__entry-group-header">
                      {config && <EntityTypeIcon type={type} size="xs" />}
                      <span className="wiki-infobox__entry-group-label">
                        {label}
                      </span>
                    </div>
                    <ul className="wiki-infobox__entry-list">
                      {entries.map((entry, index) => (
                        <li key={index}>
                          <a href={entry.href} className="wiki-infobox__entry-link">
                            {entry.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {ratings && Object.values(ratings).some(v => v !== undefined) && (
        <div className="wiki-infobox__section wiki-infobox__ratings">
          <div className="wiki-infobox__section-title">Model Quality</div>
          <div className="wiki-infobox__ratings-grid">
            {ratings.novelty !== undefined && (
              <div className="wiki-infobox__rating-item">
                <Lightbulb size={14} className="wiki-infobox__rating-icon" />
                <span className="wiki-infobox__rating-label">Novelty</span>
                <RatingBar value={ratings.novelty} />
              </div>
            )}
            {ratings.rigor !== undefined && (
              <div className="wiki-infobox__rating-item">
                <FlaskConical size={14} className="wiki-infobox__rating-icon" />
                <span className="wiki-infobox__rating-label">Rigor</span>
                <RatingBar value={ratings.rigor} />
              </div>
            )}
            {ratings.actionability !== undefined && (
              <div className="wiki-infobox__rating-item">
                <Target size={14} className="wiki-infobox__rating-icon" />
                <span className="wiki-infobox__rating-label">Actionability</span>
                <RatingBar value={ratings.actionability} />
              </div>
            )}
            {ratings.completeness !== undefined && (
              <div className="wiki-infobox__rating-item">
                <CheckCircle2 size={14} className="wiki-infobox__rating-icon" />
                <span className="wiki-infobox__rating-label">Completeness</span>
                <RatingBar value={ratings.completeness} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ITN Framework section for parameters */}
      {(tractability !== undefined || neglectedness !== undefined || uncertainty !== undefined) && (
        <div className="wiki-infobox__section">
          <div className="wiki-infobox__section-title">Prioritization</div>
          <div className="wiki-infobox__content">
            {importance !== undefined && (
              <div className="wiki-infobox__row">
                <span className="wiki-infobox__label">Importance</span>
                <span className="wiki-infobox__value" style={{ fontWeight: 600 }}>{importance}</span>
              </div>
            )}
            {tractability !== undefined && (
              <div className="wiki-infobox__row">
                <span className="wiki-infobox__label">Tractability</span>
                <span className="wiki-infobox__value" style={{ fontWeight: 600 }}>{tractability}</span>
              </div>
            )}
            {neglectedness !== undefined && (
              <div className="wiki-infobox__row">
                <span className="wiki-infobox__label">Neglectedness</span>
                <span className="wiki-infobox__value" style={{ fontWeight: 600 }}>{neglectedness}</span>
              </div>
            )}
            {uncertainty !== undefined && (
              <div className="wiki-infobox__row">
                <span className="wiki-infobox__label">Uncertainty</span>
                <span className="wiki-infobox__value" style={{ fontWeight: 600 }}>{uncertainty}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoBox;
