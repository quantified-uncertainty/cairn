/**
 * Risk Category Configuration
 *
 * Maps risk entity IDs to their categories.
 * Used for categorizing risks in tables and info boxes.
 */

export type RiskCategoryType = 'epistemic' | 'misuse' | 'structural' | 'accident';

/**
 * Risk IDs by category
 */
export const RISK_CATEGORIES = {
  epistemic: [
    'authentication-collapse',
    'automation-bias',
    'consensus-manufacturing',
    'cyber-psychosis',
    'epistemic-collapse',
    'expertise-atrophy',
    'historical-revisionism',
    'institutional-capture',
    'knowledge-monopoly',
    'learned-helplessness',
    'legal-evidence-crisis',
    'preference-manipulation',
    'reality-fragmentation',
    'scientific-corruption',
    'epistemic-sycophancy',
    'trust-cascade',
    'trust-decline',
  ],
  misuse: [
    'authoritarian-tools',
    'autonomous-weapons',
    'bioweapons',
    'cyberweapons',
    'deepfakes',
    'disinformation',
    'fraud',
    'surveillance',
  ],
  structural: [
    'concentration-of-power',
    'economic-disruption',
    'enfeeblement',
    'erosion-of-agency',
    'flash-dynamics',
    'irreversibility',
    'lock-in',
    'multipolar-trap',
    'proliferation',
    'racing-dynamics',
    'winner-take-all',
  ],
} as const;

/**
 * Get the category for a risk ID
 * @param riskId - The risk entity ID
 * @returns The category or 'accident' as default
 */
export function getRiskCategory(riskId: string): RiskCategoryType {
  if (RISK_CATEGORIES.epistemic.includes(riskId as any)) return 'epistemic';
  if (RISK_CATEGORIES.misuse.includes(riskId as any)) return 'misuse';
  if (RISK_CATEGORIES.structural.includes(riskId as any)) return 'structural';
  return 'accident';
}
