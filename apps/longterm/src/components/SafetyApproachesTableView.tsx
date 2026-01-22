// Safety Approaches Comparison Table
// Evaluates safety techniques on whether they actually make the world safer
// vs. primarily enabling more capable (potentially dangerous) systems

import { SAFETY_APPROACHES, CATEGORIES, type SafetyApproach, type RatedProperty } from '../data/safety-approaches-data';

const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
  .sa-page { min-height: 100vh; display: flex; flex-direction: column; }
  .sa-header {
    padding: 12px 24px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    gap: 16px;
    background: #fafafa;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .sa-header a {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
  }
  .sa-header a:hover { color: #374151; }
  .sa-header h1 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    flex: 1;
  }
  .sa-content {
    flex: 1;
    padding: 24px;
    overflow-x: auto;
  }
  .sa-intro {
    margin-bottom: 16px;
    color: #4b5563;
    line-height: 1.6;
    max-width: 1000px;
  }
  .sa-key-insight {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    max-width: 1000px;
  }
  .sa-key-insight strong {
    color: #92400e;
  }
  .sa-category-section {
    margin-bottom: 32px;
  }
  .sa-category-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e5e7eb;
  }
  .sa-category-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .sa-category-name {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
  }
  .sa-table-wrapper {
    overflow-x: auto;
    margin: 0 -24px;
    padding: 0 24px;
  }
  .sa-table {
    border-collapse: collapse;
    font-size: 11px;
    min-width: 2000px;
    width: 100%;
  }
  .sa-table th {
    text-align: left;
    padding: 8px 10px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
    font-size: 11px;
    white-space: nowrap;
    border-bottom: 2px solid #d1d5db;
  }
  .sa-table th.sticky-col {
    position: sticky;
    left: 0;
    z-index: 20;
    background: linear-gradient(to right, #fef3c7, #fefce8);
    color: #92400e;
    font-size: 12px;
    font-weight: 700;
    border-right: 2px solid #fcd34d;
    min-width: 180px;
  }
  .sa-table th.tradeoff-col {
    background: #fee2e2;
    color: #991b1b;
  }
  .sa-table th.mechanism-col {
    background: #e0e7ff;
    color: #3730a3;
  }
  .sa-table th.assessment-col {
    background: #dcfce7;
    color: #166534;
  }
  .sa-table th.context-col {
    background: #f3f4f6;
    color: #374151;
  }
  .sa-table td {
    padding: 10px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .sa-table td.sticky-col {
    position: sticky;
    left: 0;
    background: #fffbeb;
    z-index: 5;
    border-right: 2px solid #fef3c7;
  }
  .sa-table tr:hover td {
    background: #f9fafb;
  }
  .sa-table tr:hover td.sticky-col {
    background: #fef9c3;
  }
  .sa-approach-name {
    font-weight: 600;
    color: #111827;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .sa-approach-desc {
    color: #6b7280;
    font-size: 10px;
    line-height: 1.4;
    max-width: 180px;
  }
  .sa-badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 9px;
    font-weight: 600;
    white-space: nowrap;
  }
  /* Safety uplift colors */
  .sa-badge.critical { background: #166534; color: white; }
  .sa-badge.high { background: #22c55e; color: white; }
  .sa-badge.medium { background: #84cc16; color: #1a2e05; }
  .sa-badge.low { background: #fef08a; color: #713f12; }
  .sa-badge.negligible { background: #fecaca; color: #7f1d1d; }
  /* Capability uplift colors (reversed - high is bad) */
  .sa-badge.dominant { background: #7f1d1d; color: white; }
  .sa-badge.significant-cap { background: #dc2626; color: white; }
  .sa-badge.some { background: #fb923c; color: #7c2d12; }
  .sa-badge.neutral { background: #e5e7eb; color: #374151; }
  .sa-badge.tax { background: #86efac; color: #14532d; }
  .sa-badge.negative { background: #22c55e; color: white; }
  /* Net effect colors */
  .sa-badge.harmful { background: #7f1d1d; color: white; }
  .sa-badge.unclear { background: #fef08a; color: #713f12; }
  .sa-badge.helpful { background: #86efac; color: #14532d; }
  /* General levels */
  .sa-badge.none { background: #fecaca; color: #7f1d1d; }
  .sa-badge.weak { background: #fed7aa; color: #9a3412; }
  .sa-badge.partial { background: #fef08a; color: #713f12; }
  .sa-badge.strong { background: #86efac; color: #14532d; }
  /* Scalability */
  .sa-badge.breaks { background: #7f1d1d; color: white; }
  .sa-badge.unknown { background: #d1d5db; color: #374151; }
  .sa-badge.maybe { background: #bfdbfe; color: #1e40af; }
  .sa-badge.yes { background: #22c55e; color: white; }
  .sa-badge.no { background: #ef4444; color: white; }
  .sa-badge.unlikely { background: #fca5a5; color: #7f1d1d; }
  /* Adoption */
  .sa-badge.experimental { background: #c4b5fd; color: #4c1d95; }
  .sa-badge.widespread { background: #60a5fa; color: #1e3a8a; }
  .sa-badge.universal { background: #2563eb; color: white; }
  /* Incentive */
  .sa-badge.core { background: #2563eb; color: white; }
  .sa-badge.moderate { background: #60a5fa; color: #1e3a8a; }
  /* Special */
  .sa-badge.na { background: #f3f4f6; color: #6b7280; }
  /* Differential Progress */
  .sa-badge.safety-dominant { background: #166534; color: white; }
  .sa-badge.safety-leaning { background: #22c55e; color: white; }
  .sa-badge.balanced { background: #fef08a; color: #713f12; }
  .sa-badge.capability-leaning { background: #fb923c; color: #7c2d12; }
  .sa-badge.capability-dominant { background: #dc2626; color: white; }
  /* Recommendation */
  .sa-badge.defund { background: #7f1d1d; color: white; }
  .sa-badge.reduce { background: #fca5a5; color: #7f1d1d; }
  .sa-badge.maintain { background: #e5e7eb; color: #374151; }
  .sa-badge.increase { background: #86efac; color: #14532d; }
  .sa-badge.prioritize { background: #166534; color: white; font-weight: 700; }
  .sa-cell-note {
    font-size: 9px;
    color: #9ca3af;
    margin-top: 3px;
    line-height: 1.3;
    max-width: 120px;
  }
  .sa-mechanism {
    font-size: 10px;
    padding: 2px 6px;
    background: #e0e7ff;
    border-radius: 4px;
    color: #3730a3;
    display: inline-block;
  }
  .sa-failure-modes {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .sa-failure-mode {
    font-size: 9px;
    padding: 1px 4px;
    background: #fef3c7;
    border-radius: 3px;
    color: #92400e;
  }
  .sa-labs {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }
  .sa-lab {
    font-size: 9px;
    padding: 1px 4px;
    background: #f3f4f6;
    border-radius: 3px;
    color: #374151;
  }
  .sa-papers {
    font-size: 9px;
    color: #6b7280;
  }
  .sa-paper {
    margin-bottom: 2px;
  }
  .sa-critiques {
    font-size: 9px;
    color: #991b1b;
  }
  .sa-critique {
    margin-bottom: 2px;
  }
  .sa-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 24px;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    max-width: 1200px;
  }
  .sa-legend-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sa-legend-title {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  .sa-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: #6b7280;
  }
`;

function getBadgeClass(level: string): string {
  const l = level.toLowerCase();
  // Recommendation levels
  if (l === 'defund') return 'defund';
  if (l === 'reduce') return 'reduce';
  if (l === 'maintain') return 'maintain';
  if (l === 'increase') return 'increase';
  if (l === 'prioritize') return 'prioritize';
  // Differential progress levels
  if (l === 'safety-dominant') return 'safety-dominant';
  if (l === 'safety-leaning') return 'safety-leaning';
  if (l === 'balanced') return 'balanced';
  if (l === 'capability-leaning') return 'capability-leaning';
  if (l === 'capability-dominant') return 'capability-dominant';
  // Existing levels
  if (l.includes('critical')) return 'critical';
  if (l.includes('dominant')) return 'dominant';
  if (l.includes('significant') && !l.includes('cap')) return 'high';
  if (l.includes('significant')) return 'significant-cap';
  if (l.includes('high')) return 'high';
  if (l.includes('medium')) return 'medium';
  if (l.includes('low')) return 'low';
  if (l.includes('negligible')) return 'negligible';
  if (l.includes('some')) return 'some';
  if (l.includes('neutral')) return 'neutral';
  if (l.includes('tax') || l.includes('negative')) return 'tax';
  if (l.includes('harmful')) return 'harmful';
  if (l.includes('unclear')) return 'unclear';
  if (l.includes('helpful')) return 'helpful';
  if (l.includes('none')) return 'none';
  if (l.includes('weak')) return 'weak';
  if (l.includes('partial')) return 'partial';
  if (l.includes('strong')) return 'strong';
  if (l.includes('breaks')) return 'breaks';
  if (l.includes('unknown') || l === '???') return 'unknown';
  if (l.includes('maybe')) return 'maybe';
  if (l.includes('yes')) return 'yes';
  if (l.includes('no')) return 'no';
  if (l.includes('unlikely')) return 'unlikely';
  if (l.includes('experimental')) return 'experimental';
  if (l.includes('widespread')) return 'widespread';
  if (l.includes('universal')) return 'universal';
  if (l.includes('core')) return 'core';
  if (l.includes('moderate')) return 'moderate';
  if (l.includes('n/a')) return 'na';
  return 'unknown';
}

function Badge({ level }: { level: string }) {
  return <span className={`sa-badge ${getBadgeClass(level)}`}>{level}</span>;
}

function RatingCell({ rating }: { rating: RatedProperty }) {
  return (
    <div>
      <Badge level={rating.level} />
      <div className="sa-cell-note">{rating.note}</div>
    </div>
  );
}

function ApproachRow({ approach }: { approach: SafetyApproach }) {
  return (
    <tr>
      <td className="sticky-col">
        <div className="sa-approach-name">{approach.name}</div>
        <div className="sa-approach-desc">{approach.description}</div>
      </td>
      {/* NEW: Research Investment */}
      <td>
        <div style={{ fontWeight: 600, fontSize: '10px', color: '#374151' }}>{approach.researchInvestment.amount}</div>
        <div className="sa-cell-note">{approach.researchInvestment.note}</div>
      </td>
      {/* NEW: Differential Progress */}
      <td>
        <Badge level={approach.differentialProgress.level} />
        <div className="sa-cell-note">{approach.differentialProgress.note}</div>
      </td>
      {/* NEW: Recommendation */}
      <td>
        <Badge level={approach.recommendation.level} />
        <div className="sa-cell-note">{approach.recommendation.note}</div>
      </td>
      <td><RatingCell rating={approach.safetyUplift} /></td>
      <td><RatingCell rating={approach.capabilityUplift} /></td>
      <td><RatingCell rating={approach.netWorldSafety} /></td>
      <td><RatingCell rating={approach.scalability} /></td>
      <td><RatingCell rating={approach.deceptionRobust} /></td>
      <td><RatingCell rating={approach.siReady} /></td>
      <td><RatingCell rating={approach.currentAdoption} /></td>
      <td>
        <div className="sa-labs">
          {approach.keyLabs.slice(0, 4).map(lab => (
            <span key={lab} className="sa-lab">{lab}</span>
          ))}
        </div>
      </td>
      <td>
        <div className="sa-critiques">
          {approach.mainCritiques.slice(0, 2).map(critique => (
            <div key={critique} className="sa-critique">- {critique}</div>
          ))}
        </div>
      </td>
    </tr>
  );
}

export default function SafetyApproachesTableView() {
  return (
    <>
      <style>{styles}</style>
      <div className="sa-page">
        <div className="sa-header">
          <a href="/knowledge-base/models/">← Models</a>
          <h1>AI Safety Approaches: Safety vs Capability Tradeoffs</h1>
        </div>
        <div className="sa-content">
          <p className="sa-intro">
            Comparative analysis of AI safety approaches, with particular attention to the question:
            <strong> Does this technique actually make the world safer, or does it primarily enable more capable systems?</strong>
          </p>

          <div className="sa-key-insight">
            <strong>Key insight:</strong> Many "safety" techniques have <em>capability uplift</em> as their primary effect.
            RLHF, for example, is what makes ChatGPT useful - its safety benefit is secondary to its capability benefit.
            A technique that provides DOMINANT capability uplift with only LOW safety uplift may be net negative for world safety,
            even if it reduces obvious harms.
          </div>

          <div className="sa-legend">
            <div className="sa-legend-group">
              <div className="sa-legend-title">Safety Uplift</div>
              <div className="sa-legend-item"><Badge level="CRITICAL" /> Transformative if works</div>
              <div className="sa-legend-item"><Badge level="HIGH" /> Significant risk reduction</div>
              <div className="sa-legend-item"><Badge level="MEDIUM" /> Meaningful but limited</div>
              <div className="sa-legend-item"><Badge level="LOW" /> Marginal benefit</div>
            </div>
            <div className="sa-legend-group">
              <div className="sa-legend-title">Capability Uplift</div>
              <div className="sa-legend-item"><Badge level="DOMINANT" /> Primary capability driver</div>
              <div className="sa-legend-item"><Badge level="SIGNIFICANT" /> Major capability boost</div>
              <div className="sa-legend-item"><Badge level="SOME" /> Some capability benefit</div>
              <div className="sa-legend-item"><Badge level="NEUTRAL" /> No capability effect</div>
              <div className="sa-legend-item"><Badge level="TAX" /> Reduces capabilities</div>
            </div>
            <div className="sa-legend-group">
              <div className="sa-legend-title">Net World Safety</div>
              <div className="sa-legend-item"><Badge level="HELPFUL" /> Probably net positive</div>
              <div className="sa-legend-item"><Badge level="UNCLEAR" /> Could go either way</div>
              <div className="sa-legend-item"><Badge level="HARMFUL" /> Likely net negative</div>
            </div>
            <div className="sa-legend-group">
              <div className="sa-legend-title">Scales to SI?</div>
              <div className="sa-legend-item"><Badge level="YES" /> Works at superintelligence</div>
              <div className="sa-legend-item"><Badge level="MAYBE" /> Might work</div>
              <div className="sa-legend-item"><Badge level="UNLIKELY" /> Probably breaks</div>
              <div className="sa-legend-item"><Badge level="NO" /> Fundamentally limited</div>
            </div>
            <div className="sa-legend-group">
              <div className="sa-legend-title">Differential Progress</div>
              <div className="sa-legend-item"><Badge level="SAFETY-DOMINANT" /> Safety &gt;&gt; capability</div>
              <div className="sa-legend-item"><Badge level="SAFETY-LEANING" /> Safety &gt; capability</div>
              <div className="sa-legend-item"><Badge level="BALANCED" /> Roughly equal</div>
              <div className="sa-legend-item"><Badge level="CAPABILITY-LEANING" /> Capability &gt; safety</div>
              <div className="sa-legend-item"><Badge level="CAPABILITY-DOMINANT" /> Capability &gt;&gt; safety</div>
            </div>
            <div className="sa-legend-group">
              <div className="sa-legend-title">Recommendation</div>
              <div className="sa-legend-item"><Badge level="PRIORITIZE" /> Needs much more funding</div>
              <div className="sa-legend-item"><Badge level="INCREASE" /> Should grow</div>
              <div className="sa-legend-item"><Badge level="MAINTAIN" /> About right</div>
              <div className="sa-legend-item"><Badge level="REDUCE" /> Overfunded for safety</div>
              <div className="sa-legend-item"><Badge level="DEFUND" /> Counterproductive</div>
            </div>
          </div>

          {CATEGORIES.map(category => {
            const approaches = SAFETY_APPROACHES.filter(a => a.category === category.id);
            if (approaches.length === 0) return null;

            return (
              <div key={category.id} className="sa-category-section">
                <div className="sa-category-header">
                  <div className="sa-category-dot" style={{ background: category.color }} />
                  <div className="sa-category-name">{category.label}</div>
                </div>

                <div className="sa-table-wrapper">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th className="sticky-col">Approach</th>
                        <th className="context-col" style={{ background: '#dbeafe', color: '#1e40af' }}>Investment</th>
                        <th className="context-col" style={{ background: '#dcfce7', color: '#166534' }}>Differential</th>
                        <th className="context-col" style={{ background: '#fef3c7', color: '#92400e' }}>Recommend</th>
                        <th className="tradeoff-col">Safety Uplift</th>
                        <th className="tradeoff-col">Cap Uplift</th>
                        <th className="tradeoff-col">Net Safety</th>
                        <th className="assessment-col">Scalability</th>
                        <th className="assessment-col">Deception</th>
                        <th className="assessment-col">SI Ready</th>
                        <th className="context-col">Adoption</th>
                        <th className="context-col">Labs</th>
                        <th className="context-col">Critiques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approaches.map(approach => (
                        <ApproachRow key={approach.id} approach={approach} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
