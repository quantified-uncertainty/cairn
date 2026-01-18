import React, { useState } from 'react';

interface Funder {
  id: string;
  name: string;
  keyFacts?: string[];
  overview?: string;
  focusAreas?: (string | { name: string; details: string })[];
  whatTheyLookFor?: string[];
  howToApply?: string[];
  applicationProcess?: string[];
  grantSizes?: Record<string, string>;
  commonGrantTypes?: { name: string; details: string }[];
  fundingApproach?: { description: string; details: string[] };
  website?: string;
}

interface OtherFunder {
  id: string;
  name: string;
  focus?: string;
  approach?: string;
  typicalGrants?: string;
  application?: string;
  description?: string;
  vehicles?: string[];
  interestAreas?: string;
  note?: string;
  grants?: string;
  services?: string;
}

interface GovernmentFunder {
  id: string;
  name: string;
  focus?: string;
  typicalSize?: string;
  application?: string;
  note?: string;
}

interface ComparisonItem {
  name: string;
  annualAmount: string;
  grantSize: string;
  speed: string;
  application: string;
  bestFor: string;
}

interface FundersData {
  overview: {
    totalFieldFunding: string;
    largestFunder: string;
    grantSizeRange: string;
    note: string;
  };
  majorFunders: Funder[];
  otherFunders: OtherFunder[];
  governmentFunding: GovernmentFunder[];
  comparisonTable: ComparisonItem[];
  fundingByCategory: Record<string, {
    wellFunded?: string[];
    underfunded?: string[];
    activitiesFunded?: string[];
    activities?: string[];
    majorFunders?: string[];
    typicalGrants?: string;
    note?: string;
  }>;
  grantSizeBreakdown: Record<string, {
    range: string;
    typicalUses: string[];
    primaryFunders: string[];
    difficulty: string;
  }>;
  applicationTips: {
    beforeApplying: string[];
    writingStrong: string[];
    commonMistakes: string[];
  };
  timelineExpectations: { funder: string; time: string }[];
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as React.CSSProperties,
  overviewBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  } as React.CSSProperties,
  overviewTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#166534',
  } as React.CSSProperties,
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,
  overviewItem: {
    fontSize: '0.9rem',
    color: '#374151',
  } as React.CSSProperties,
  overviewLabel: {
    fontWeight: 600,
    color: '#15803d',
  } as React.CSSProperties,
  funderCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '24px',
    overflow: 'hidden',
  } as React.CSSProperties,
  funderHeader: {
    backgroundColor: '#f9fafb',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  funderName: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
  } as React.CSSProperties,
  funderBody: {
    padding: '16px',
  } as React.CSSProperties,
  keyFactsList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  keyFact: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  } as React.CSSProperties,
  section: {
    marginTop: '16px',
  } as React.CSSProperties,
  sectionTitle: {
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  list: {
    margin: 0,
    paddingLeft: '20px',
    color: '#4b5563',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  websiteLink: {
    display: 'inline-block',
    marginTop: '16px',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: '0.9rem',
  } as React.CSSProperties,
  comparisonTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.875rem',
    marginTop: '16px',
  } as React.CSSProperties,
  th: {
    backgroundColor: '#f3f4f6',
    padding: '12px 8px',
    textAlign: 'left' as const,
    fontWeight: 600,
    borderBottom: '2px solid #e5e7eb',
  } as React.CSSProperties,
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #e5e7eb',
    verticalAlign: 'top' as const,
  } as React.CSSProperties,
  categoryBox: {
    backgroundColor: '#fefce8',
    border: '1px solid #fef08a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,
  categoryTitle: {
    fontWeight: 600,
    color: '#854d0e',
    marginBottom: '12px',
    fontSize: '1rem',
  } as React.CSSProperties,
  subSection: {
    marginBottom: '12px',
  } as React.CSSProperties,
  subLabel: {
    fontWeight: 500,
    color: '#713f12',
    fontSize: '0.85rem',
  } as React.CSSProperties,
  grantTier: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,
  tierHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,
  tierName: {
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#1f2937',
  } as React.CSSProperties,
  tierRange: {
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: 500,
  } as React.CSSProperties,
  difficultyBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    marginTop: '8px',
  } as React.CSSProperties,
  tipBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  } as React.CSSProperties,
  tipTitle: {
    fontWeight: 600,
    color: '#92400e',
    marginBottom: '8px',
  } as React.CSSProperties,
};

function FunderCard({ funder }: { funder: Funder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={styles.funderCard}>
      <div style={styles.funderHeader} onClick={() => setExpanded(!expanded)}>
        <span style={styles.funderName}>{funder.name}</span>
        <span>{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div style={styles.funderBody}>
          {funder.keyFacts && (
            <div style={styles.keyFactsList}>
              {funder.keyFacts.map((fact, idx) => (
                <span key={idx} style={styles.keyFact}>{fact}</span>
              ))}
            </div>
          )}

          {funder.overview && (
            <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '16px' }}>
              {funder.overview}
            </p>
          )}

          {funder.focusAreas && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Focus Areas</div>
              <ul style={styles.list}>
                {funder.focusAreas.map((area, idx) => (
                  <li key={idx}>
                    {typeof area === 'string' ? area : `${area.name}: ${area.details}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {funder.whatTheyLookFor && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>What They Look For</div>
              <ul style={styles.list}>
                {funder.whatTheyLookFor.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(funder.howToApply || funder.applicationProcess) && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>How to Apply</div>
              <ul style={styles.list}>
                {(funder.howToApply || funder.applicationProcess)?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {funder.grantSizes && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Grant Sizes</div>
              <ul style={styles.list}>
                {Object.entries(funder.grantSizes).map(([tier, amount]) => (
                  <li key={tier}><strong>{tier.charAt(0).toUpperCase() + tier.slice(1)}:</strong> {amount}</li>
                ))}
              </ul>
            </div>
          )}

          {funder.website && (
            <a href={funder.website} target="_blank" rel="noopener noreferrer" style={styles.websiteLink}>
              Visit Website →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function FundersOverview({ data }: { data: FundersData }) {
  return (
    <div style={styles.overviewBox}>
      <div style={styles.overviewTitle}>AI Safety Funding Overview</div>
      <div style={styles.overviewGrid}>
        <div style={styles.overviewItem}>
          <span style={styles.overviewLabel}>Total Field: </span>
          {data.overview.totalFieldFunding}
        </div>
        <div style={styles.overviewItem}>
          <span style={styles.overviewLabel}>Largest Funder: </span>
          {data.overview.largestFunder}
        </div>
        <div style={styles.overviewItem}>
          <span style={styles.overviewLabel}>Grant Range: </span>
          {data.overview.grantSizeRange}
        </div>
        <div style={styles.overviewItem}>
          <span style={styles.overviewLabel}>Note: </span>
          {data.overview.note}
        </div>
      </div>
    </div>
  );
}

export function MajorFundersList({ funders }: { funders: Funder[] }) {
  return (
    <div style={styles.container}>
      {funders.map(funder => (
        <FunderCard key={funder.id} funder={funder} />
      ))}
    </div>
  );
}

export function FundersComparisonTable({ items }: { items: ComparisonItem[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.comparisonTable}>
        <thead>
          <tr>
            <th style={styles.th}>Funder</th>
            <th style={styles.th}>Annual Amount</th>
            <th style={styles.th}>Grant Size</th>
            <th style={styles.th}>Speed</th>
            <th style={styles.th}>Application</th>
            <th style={styles.th}>Best For</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={styles.td}><strong>{item.name}</strong></td>
              <td style={styles.td}>{item.annualAmount}</td>
              <td style={styles.td}>{item.grantSize}</td>
              <td style={styles.td}>{item.speed}</td>
              <td style={styles.td}>{item.application}</td>
              <td style={styles.td}>{item.bestFor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FundingByCategory({ categories }: { categories: FundersData['fundingByCategory'] }) {
  const categoryNames: Record<string, string> = {
    technicalResearch: 'Technical Research',
    governanceAndPolicy: 'Governance and Policy',
    fieldBuilding: 'Field-Building',
    communicationsAndEducation: 'Communications and Education',
  };

  return (
    <div>
      {Object.entries(categories).map(([key, category]) => (
        <div key={key} style={styles.categoryBox}>
          <div style={styles.categoryTitle}>{categoryNames[key] || key}</div>

          {category.wellFunded && (
            <div style={styles.subSection}>
              <span style={styles.subLabel}>Well-funded: </span>
              {category.wellFunded.join(', ')}
            </div>
          )}

          {category.underfunded && (
            <div style={styles.subSection}>
              <span style={styles.subLabel}>Underfunded: </span>
              {category.underfunded.join(', ')}
            </div>
          )}

          {(category.activitiesFunded || category.activities) && (
            <div style={styles.subSection}>
              <span style={styles.subLabel}>Activities: </span>
              {(category.activitiesFunded || category.activities)?.join(', ')}
            </div>
          )}

          {category.majorFunders && (
            <div style={styles.subSection}>
              <span style={styles.subLabel}>Major Funders: </span>
              {category.majorFunders.join(', ')}
            </div>
          )}

          {category.typicalGrants && (
            <div style={styles.subSection}>
              <span style={styles.subLabel}>Typical Grants: </span>
              {category.typicalGrants}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function GrantSizeBreakdown({ tiers }: { tiers: FundersData['grantSizeBreakdown'] }) {
  const tierNames: Record<string, string> = {
    small: 'Small Grants',
    medium: 'Medium Grants',
    large: 'Large Grants',
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty.toLowerCase().includes('easy')) return { backgroundColor: '#dcfce7', color: '#166534' };
    if (difficulty.toLowerCase().includes('moderate')) return { backgroundColor: '#fef3c7', color: '#92400e' };
    return { backgroundColor: '#fee2e2', color: '#991b1b' };
  };

  return (
    <div>
      {Object.entries(tiers).map(([key, tier]) => (
        <div key={key} style={styles.grantTier}>
          <div style={styles.tierHeader}>
            <span style={styles.tierName}>{tierNames[key] || key}</span>
            <span style={styles.tierRange}>{tier.range}</span>
          </div>

          <div style={styles.subSection}>
            <span style={styles.subLabel}>Typical Uses:</span>
            <ul style={{ ...styles.list, marginTop: '4px' }}>
              {tier.typicalUses.map((use, idx) => (
                <li key={idx}>{use}</li>
              ))}
            </ul>
          </div>

          <div style={styles.subSection}>
            <span style={styles.subLabel}>Primary Funders: </span>
            {tier.primaryFunders.join(', ')}
          </div>

          <span style={{ ...styles.difficultyBadge, ...getDifficultyColor(tier.difficulty) }}>
            {tier.difficulty}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ApplicationTips({ tips }: { tips: FundersData['applicationTips'] }) {
  return (
    <div>
      <div style={styles.tipBox}>
        <div style={styles.tipTitle}>Before Applying</div>
        <ul style={styles.list}>
          {tips.beforeApplying.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      <div style={styles.tipBox}>
        <div style={styles.tipTitle}>Writing Strong Applications</div>
        <ul style={styles.list}>
          {tips.writingStrong.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      <div style={{ ...styles.tipBox, backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
        <div style={{ ...styles.tipTitle, color: '#991b1b' }}>Common Mistakes</div>
        <ul style={styles.list}>
          {tips.commonMistakes.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function TimelineExpectations({ timelines }: { timelines: FundersData['timelineExpectations'] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.comparisonTable}>
        <thead>
          <tr>
            <th style={styles.th}>Funder</th>
            <th style={styles.th}>Expected Timeline</th>
          </tr>
        </thead>
        <tbody>
          {timelines.map((item, idx) => (
            <tr key={idx}>
              <td style={styles.td}><strong>{item.funder}</strong></td>
              <td style={styles.td}>{item.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FundersList({ data }: { data: FundersData }) {
  return (
    <div style={styles.container}>
      <FundersOverview data={data} />
      <h2>Major Funders</h2>
      <MajorFundersList funders={data.majorFunders} />
    </div>
  );
}
