import fs from 'fs';

// Same maturity assessments
const maturityAssessments = {
  // ACCIDENT RISKS
  'instrumental-convergence': 'Mature',
  'sycophancy': 'Growing',
  'mesa-optimization': 'Growing',
  'corrigibility-failure': 'Growing',
  'deceptive-alignment': 'Growing',
  'sandbagging': 'Emerging',
  'reward-hacking': 'Mature',
  'scheming': 'Emerging',
  'power-seeking': 'Mature',
  'specification-gaming': 'Mature',
  'goal-misgeneralization': 'Growing',
  'treacherous-turn': 'Mature',
  'distributional-shift': 'Mature',
  'sharp-left-turn': 'Emerging',
  'emergent-capabilities': 'Growing',
  // EPISTEMIC RISKS
  'trust-erosion': 'Growing',
  'historical-revisionism': 'Neglected',
  'consensus-manufacturing': 'Emerging',
  'legal-evidence-crisis': 'Neglected',
  'scientific-corruption': 'Emerging',
  'preference-manipulation': 'Emerging',
  'expertise-atrophy': 'Neglected',
  'knowledge-monopoly': 'Neglected',
  'trust-cascade': 'Neglected',
  'reality-fragmentation': 'Emerging',
  'authentication-collapse': 'Emerging',
  'sycophancy-scale': 'Emerging',
  'automation-bias': 'Mature',
  'epistemic-collapse': 'Neglected',
  'institutional-capture': 'Emerging',
  'learned-helplessness': 'Neglected',
  'cyber-psychosis': 'Neglected',
  // MISUSE RISKS
  'autonomous-weapons': 'Mature',
  'surveillance': 'Mature',
  'bioweapons': 'Growing',
  'disinformation': 'Mature',
  'deepfakes': 'Mature',
  'fraud': 'Growing',
  'authoritarian-tools': 'Growing',
  'cyberweapons': 'Growing',
  // STRUCTURAL RISKS
  'multipolar-trap': 'Growing',
  'enfeeblement': 'Neglected',
  'erosion-of-agency': 'Neglected',
  'winner-take-all': 'Growing',
  'proliferation': 'Growing',
  'irreversibility': 'Growing',
  'concentration-of-power': 'Growing',
  'flash-dynamics': 'Neglected',
  'racing-dynamics': 'Growing',
  'economic-disruption': 'Growing',
  'lock-in': 'Growing',
};

const entitiesPath = 'src/data/entities.yaml';
let content = fs.readFileSync(entitiesPath, 'utf8');

let updated = 0;

for (const [id, maturity] of Object.entries(maturityAssessments)) {
  // Look for pattern: - id: {id}\n  type: risk\n  title: ...\n  severity: ...
  // Add maturity after timeframe
  const pattern = new RegExp(
    `(- id: ${id}\\n\\s+type: risk\\n\\s+title: [^\\n]+\\n\\s+severity: [^\\n]+\\n\\s+likelihood: [^\\n]+\\n\\s+timeframe: [^\\n]+)(?!\\n\\s+maturity:)`,
    'g'
  );

  if (pattern.test(content)) {
    content = content.replace(pattern, `$1\n  maturity: ${maturity}`);
    console.log(`Added maturity "${maturity}" to entity: ${id}`);
    updated++;
  }
}

fs.writeFileSync(entitiesPath, content);
console.log(`\nUpdated ${updated} entities with maturity values.`);
