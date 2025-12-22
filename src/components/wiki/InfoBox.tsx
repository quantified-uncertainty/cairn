import React from 'react';
import './wiki.css';

export type EntityType =
  | 'lab-frontier'
  | 'lab-research'
  | 'lab-startup'
  | 'lab-academic'
  | 'lab'
  | 'capability'
  | 'risk'
  | 'safety-agenda'
  | 'policy'
  | 'crux'
  | 'case-study'
  | 'researcher'
  | 'scenario'
  | 'resource'
  | 'funder'
  | 'intervention';

interface InfoBoxProps {
  type: EntityType;
  // Common fields
  title?: string;
  image?: string;
  website?: string;

  // Lab-specific
  founded?: string;
  location?: string;
  headcount?: string;
  funding?: string;

  // Risk-specific
  severity?: 'low' | 'medium' | 'high' | 'catastrophic';
  likelihood?: string;
  timeframe?: string;

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

  // Custom fields
  customFields?: { label: string; value: string }[];
}

const typeLabels: Record<EntityType, { label: string; color: string }> = {
  'lab-frontier': { label: 'Frontier Lab', color: '#dc2626' },
  'lab-research': { label: 'Research Lab', color: '#2563eb' },
  'lab-startup': { label: 'Startup', color: '#7c3aed' },
  'lab-academic': { label: 'Academic', color: '#059669' },
  'lab': { label: 'Organization', color: '#dc2626' },
  'capability': { label: 'Capability', color: '#0891b2' },
  'risk': { label: 'Risk', color: '#dc2626' },
  'safety-agenda': { label: 'Safety Agenda', color: '#7c3aed' },
  'policy': { label: 'Policy', color: '#0d9488' },
  'crux': { label: 'Key Crux', color: '#ea580c' },
  'case-study': { label: 'Historical Case Study', color: '#78716c' },
  'researcher': { label: 'Researcher', color: '#475569' },
  'scenario': { label: 'Scenario', color: '#9333ea' },
  'resource': { label: 'Resource', color: '#4f46e5' },
  'funder': { label: 'Funder', color: '#16a34a' },
  'intervention': { label: 'Intervention', color: '#0891b2' },
};

const defaultTypeInfo = { label: 'Entry', color: '#6b7280' };

const severityColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  catastrophic: '#dc2626',
};

export function InfoBox({
  type,
  title,
  image,
  website,
  founded,
  location,
  headcount,
  funding,
  severity,
  likelihood,
  timeframe,
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
}: InfoBoxProps) {
  const typeInfo = typeLabels[type] || defaultTypeInfo;

  const fields: { label: string; value: string }[] = [];

  // Add fields based on type
  if (founded) fields.push({ label: 'Founded', value: founded });
  if (location) fields.push({ label: 'Location', value: location });
  if (headcount) fields.push({ label: 'Employees', value: headcount });
  if (funding) fields.push({ label: 'Funding', value: funding });
  if (severity) fields.push({ label: 'Severity', value: severity.charAt(0).toUpperCase() + severity.slice(1) });
  if (likelihood) fields.push({ label: 'Likelihood', value: likelihood });
  if (timeframe) fields.push({ label: 'Timeframe', value: timeframe });
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
        {fields.map((field, index) => (
          <div key={index} className="wiki-infobox__row">
            <span className="wiki-infobox__label">{field.label}</span>
            <span
              className="wiki-infobox__value"
              style={
                field.label === 'Severity' && severity
                  ? { color: severityColors[severity] || 'inherit', fontWeight: 600 }
                  : undefined
              }
            >
              {field.label === 'Website' ? (
                <a href={field.value} target="_blank" rel="noopener noreferrer">
                  {new URL(field.value).hostname.replace('www.', '')}
                </a>
              ) : (
                field.value
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfoBox;
