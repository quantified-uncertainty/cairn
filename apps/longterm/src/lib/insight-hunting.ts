// Insight Hunting Library
// Tools for identifying high-potential insight sources

import { insights } from '@/data/insights-data';
import { SAFETY_APPROACHES, type SafetyApproach } from '@/data/safety-approaches-data';
import { accidentRisks, type AccidentRisk } from '@/data/accident-risks-data';

// Types
export interface PageInfo {
  id: string;
  path: string;
  filePath: string;
  title: string;
  quality: number | null;
  importance: number | null;
  category: string;
  wordCount: number;
  llmSummary?: string;
}

export interface InsightGap {
  page: PageInfo;
  insightCount: number;
  potentialScore: number; // importance * (1 + quality/100) - insightCount * 20
  gapReason: string;
}

export interface TableCandidate {
  id: string;
  name: string;
  source: 'safety-approaches' | 'accident-risks' | 'eval-types';
  matchedCriteria: string[];
  keyRatings: Record<string, string>;
  potentialInsightTemplate: string;
  pageSlug?: string;
}

export interface QuantitativeClaim {
  text: string;
  number: string;
  type: 'percentage' | 'dollar' | 'count' | 'timeline' | 'multiplier';
  filePath: string;
  lineNumber: number;
  context: string;
}

// Get insight counts by source page
export function getInsightCountsBySource(): Map<string, number> {
  const counts = new Map<string, number>();
  for (const insight of insights) {
    const current = counts.get(insight.source) || 0;
    counts.set(insight.source, current + 1);
  }
  return counts;
}

// Calculate insight gaps from pages data
export function getInsightGaps(pages: PageInfo[]): InsightGap[] {
  const insightCounts = getInsightCountsBySource();

  const gaps: InsightGap[] = pages
    .filter(page => page.importance !== null && page.importance > 0)
    .map(page => {
      const insightCount = insightCounts.get(page.path) || 0;
      const importance = page.importance || 0;
      const quality = page.quality || 50;

      // Score formula: prioritize high importance, adjust for quality, penalize existing insights
      const potentialScore = Math.round(importance * (1 + quality / 100) - insightCount * 20);

      let gapReason = '';
      if (insightCount === 0 && importance >= 70) {
        gapReason = 'High importance page with no insights';
      } else if (insightCount < 2 && importance >= 80) {
        gapReason = 'Very high importance page with few insights';
      } else if (quality >= 80 && insightCount < 3) {
        gapReason = 'High quality page under-extracted';
      } else if (importance >= 60 && insightCount === 0) {
        gapReason = 'Moderate importance page with no insights';
      }

      return {
        page,
        insightCount,
        potentialScore,
        gapReason,
      };
    })
    .filter(gap => gap.gapReason !== '' || gap.potentialScore > 50)
    .sort((a, b) => b.potentialScore - a.potentialScore);

  return gaps;
}

// Get table candidates from safety approaches
export function getSafetyApproachCandidates(): TableCandidate[] {
  const candidates: TableCandidate[] = [];

  for (const approach of SAFETY_APPROACHES) {
    const matchedCriteria: string[] = [];

    // Check for paradoxical/interesting combinations
    if (approach.differentialProgress?.level === 'CAPABILITY-DOMINANT') {
      matchedCriteria.push('Capability-dominant (questionable safety value)');
    }
    if (approach.deceptionRobust?.level === 'WEAK' || approach.deceptionRobust?.level === 'NONE') {
      matchedCriteria.push('Weak/no deception robustness');
    }
    if (approach.recommendation?.level === 'PRIORITIZE') {
      matchedCriteria.push('High priority recommendation');
    }
    if (approach.recommendation?.level === 'DEFUND') {
      matchedCriteria.push('Defund recommendation');
    }
    if (approach.recommendation?.level === 'REDUCE') {
      matchedCriteria.push('Reduce funding recommendation');
    }
    if (approach.netWorldSafety?.level === 'UNCLEAR' || approach.netWorldSafety?.level === 'HARMFUL') {
      matchedCriteria.push('Unclear/harmful net safety');
    }
    if (approach.scalability?.level === 'BREAKS' || approach.scalability?.level === 'NO') {
      matchedCriteria.push('Does not scale to superintelligence');
    }

    if (matchedCriteria.length > 0) {
      candidates.push({
        id: approach.id,
        name: approach.name,
        source: 'safety-approaches',
        matchedCriteria,
        keyRatings: {
          'Safety Uplift': approach.safetyUplift?.level || 'N/A',
          'Capability Uplift': approach.capabilityUplift?.level || 'N/A',
          'Differential Progress': approach.differentialProgress?.level || 'N/A',
          'Deception Robust': approach.deceptionRobust?.level || 'N/A',
          'Recommendation': approach.recommendation?.level || 'N/A',
        },
        potentialInsightTemplate: generateSafetyApproachInsightTemplate(approach),
      });
    }
  }

  return candidates;
}

// Get table candidates from accident risks
export function getAccidentRiskCandidates(): TableCandidate[] {
  const candidates: TableCandidate[] = [];

  for (const risk of accidentRisks) {
    const matchedCriteria: string[] = [];

    // Check for high-severity, hard-to-detect risks
    if (risk.severity === 'CATASTROPHIC' || risk.severity === 'EXISTENTIAL') {
      if (risk.detectability === 'VERY_DIFFICULT' || risk.detectability === 'DIFFICULT') {
        matchedCriteria.push('Severe + hard to detect');
      }
    }
    if (risk.evidenceLevel === 'DEMONSTRATED_LAB' && (risk.severity === 'CATASTROPHIC' || risk.severity === 'EXISTENTIAL')) {
      matchedCriteria.push('Lab-demonstrated catastrophic risk');
    }
    if (risk.timeline === 'CURRENT' && risk.severity !== 'LOW' && risk.severity !== 'MEDIUM') {
      matchedCriteria.push('Current timeline + severe');
    }

    if (matchedCriteria.length > 0) {
      candidates.push({
        id: risk.id,
        name: risk.name,
        source: 'accident-risks',
        matchedCriteria,
        keyRatings: {
          'Severity': risk.severity,
          'Detectability': risk.detectability,
          'Evidence': risk.evidenceLevel,
          'Timeline': risk.timeline,
        },
        potentialInsightTemplate: generateAccidentRiskInsightTemplate(risk),
        pageSlug: risk.pageSlug,
      });
    }
  }

  return candidates;
}

// Generate insight template for safety approach
function generateSafetyApproachInsightTemplate(approach: SafetyApproach): string {
  const parts: string[] = [];

  // Build a meaningful insight from the matched criteria
  if (approach.differentialProgress?.level === 'CAPABILITY-DOMINANT') {
    parts.push(`provides more capability uplift (${approach.capabilityUplift?.level}) than safety benefit (${approach.safetyUplift?.level})`);
  }

  if (approach.deceptionRobust?.level === 'NONE' || approach.deceptionRobust?.level === 'WEAK') {
    const note = approach.deceptionRobust?.note ? ` - ${approach.deceptionRobust.note}` : '';
    parts.push(`offers ${approach.deceptionRobust?.level?.toLowerCase() || 'no'} deception robustness${note}`);
  }

  if (approach.scalability?.level === 'BREAKS' || approach.scalability?.level === 'NO') {
    const note = approach.scalability?.note ? ` - ${approach.scalability.note}` : '';
    parts.push(`does not scale to superintelligence${note}`);
  }

  if (approach.recommendation?.level === 'DEFUND') {
    const note = approach.recommendation?.note ? ` (${approach.recommendation.note})` : '';
    parts.push(`is recommended to DEFUND${note}`);
  } else if (approach.recommendation?.level === 'REDUCE') {
    const note = approach.recommendation?.note ? ` (${approach.recommendation.note})` : '';
    parts.push(`is recommended to reduce funding${note}`);
  } else if (approach.recommendation?.level === 'PRIORITIZE') {
    const note = approach.recommendation?.note ? ` (${approach.recommendation.note})` : '';
    parts.push(`is rated PRIORITIZE${note}`);
  }

  if (approach.netWorldSafety?.level === 'HARMFUL') {
    parts.push(`may have net negative impact on world safety`);
  } else if (approach.netWorldSafety?.level === 'UNCLEAR') {
    parts.push(`has unclear net impact on world safety`);
  }

  if (parts.length === 0) {
    // No meaningful insight could be generated - should not happen if criteria matched
    return `[No insight template - review ${approach.name} manually]`;
  }

  // Combine parts into a coherent sentence
  return `${approach.name} ${parts.join(', ')}.`;
}

// Generate insight template for accident risk
function generateAccidentRiskInsightTemplate(risk: AccidentRisk): string {
  const parts: string[] = [];

  // Severity + detectability combination is the key concern
  if ((risk.severity === 'CATASTROPHIC' || risk.severity === 'EXISTENTIAL') &&
      (risk.detectability === 'VERY_DIFFICULT' || risk.detectability === 'DIFFICULT')) {
    parts.push(`${risk.severity.toLowerCase()} severity but ${risk.detectability.toLowerCase().replace('_', ' ')} to detect`);
  }

  // Evidence strengthens the claim
  if (risk.evidenceLevel === 'DEMONSTRATED_LAB') {
    parts.push(`already demonstrated in lab settings`);
  } else if (risk.evidenceLevel === 'STRONG_THEORETICAL') {
    parts.push(`has strong theoretical basis`);
  }

  // Timeline adds urgency
  if (risk.timeline === 'CURRENT') {
    parts.push(`relevant to current AI systems`);
  } else if (risk.timeline === 'NEAR') {
    parts.push(`expected in near-term systems`);
  }

  // Add evidence note if substantive
  const evidenceNote = risk.evidenceNote?.trim();
  if (evidenceNote && evidenceNote.length > 10 && !evidenceNote.startsWith('N/A')) {
    parts.push(evidenceNote);
  }

  if (parts.length === 0) {
    return `[No insight template - review ${risk.name} manually]`;
  }

  return `${risk.name}: ${parts.join('; ')}.`;
}

// Get all table candidates
export function getAllTableCandidates(): TableCandidate[] {
  return [
    ...getSafetyApproachCandidates(),
    ...getAccidentRiskCandidates(),
  ];
}

// Statistics
export function getInsightHuntingStats(pages: PageInfo[]) {
  const insightCounts = getInsightCountsBySource();
  const gaps = getInsightGaps(pages);
  const safetyApproachCandidates = getSafetyApproachCandidates();
  const accidentRiskCandidates = getAccidentRiskCandidates();

  const pagesWithInsights = new Set(insightCounts.keys());
  const highImportancePages = pages.filter(p => (p.importance || 0) >= 70);
  const highImportanceWithNoInsights = highImportancePages.filter(p => !pagesWithInsights.has(p.path));

  return {
    totalInsights: insights.length,
    totalPages: pages.length,
    pagesWithInsights: pagesWithInsights.size,
    pagesWithoutInsights: pages.length - pagesWithInsights.size,
    highImportanceWithNoInsights: highImportanceWithNoInsights.length,
    topGapCount: gaps.filter(g => g.potentialScore > 80).length,
    safetyApproachCandidates: safetyApproachCandidates.length,
    accidentRiskCandidates: accidentRiskCandidates.length,
    averageInsightsPerPage: (insights.length / pagesWithInsights.size).toFixed(1),
  };
}
