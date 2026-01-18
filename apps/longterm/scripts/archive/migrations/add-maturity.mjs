import fs from 'fs';
import path from 'path';

// Maturity assessments based on AI safety literature review
const maturityAssessments = {
  // ACCIDENT RISKS
  'instrumental-convergence': 'Mature', // Omohundro 2008, Bostrom 2014, foundational concept
  'sycophancy': 'Growing', // Recent lab focus, active research at Anthropic/OpenAI
  'mesa-optimization': 'Growing', // Hubinger et al 2019, active research area
  'corrigibility-failure': 'Growing', // Soares et al 2015, ongoing MIRI work
  'deceptive-alignment': 'Growing', // Hubinger 2019, major research focus
  'sandbagging': 'Emerging', // Recent concern, limited formal research
  'reward-hacking': 'Mature', // Extensive documentation, classic RL problem
  'scheming': 'Emerging', // Newer framing from Carlsmith, limited empirical work
  'power-seeking': 'Mature', // Turner et al theoretical work, well-established
  'specification-gaming': 'Mature', // DeepMind list, extensive examples documented
  'goal-misgeneralization': 'Growing', // Shah et al 2022, active research
  'treacherous-turn': 'Mature', // Bostrom 2014, classic concept
  'distributional-shift': 'Mature', // Extensive ML robustness literature
  'sharp-left-turn': 'Emerging', // Nate Soares concept, debated
  'emergent-capabilities': 'Growing', // Post-GPT-3 focus, active research

  // EPISTEMIC RISKS
  'trust-erosion': 'Growing', // Increasing policy attention
  'historical-revisionism': 'Neglected', // Limited AI-specific research
  'consensus-manufacturing': 'Emerging', // Newer concern, some attention
  'legal-evidence-crisis': 'Neglected', // Very limited research
  'scientific-corruption': 'Emerging', // Growing concern, limited formal work
  'preference-manipulation': 'Emerging', // Some philosophical attention
  'expertise-atrophy': 'Neglected', // Under-researched
  'knowledge-monopoly': 'Neglected', // Limited formal research
  'trust-cascade': 'Neglected', // Limited research
  'reality-fragmentation': 'Emerging', // Growing concern post-deepfakes
  'authentication-collapse': 'Emerging', // Recent focus with generative AI
  'sycophancy-scale': 'Emerging', // Extension of sycophancy research
  'automation-bias': 'Mature', // Extensive HCI/aviation literature
  'epistemic-collapse': 'Neglected', // Newer framing, limited work
  'institutional-capture': 'Emerging', // Some governance attention
  'learned-helplessness': 'Neglected', // Limited AI-specific research
  'cyber-psychosis': 'Neglected', // Speculative, very limited research

  // MISUSE RISKS
  'autonomous-weapons': 'Mature', // Extensive LAWS debate, UN discussions
  'surveillance': 'Mature', // Extensive privacy/policy literature
  'bioweapons': 'Growing', // Increasing attention post-GPT-4 evals
  'disinformation': 'Mature', // Extensive misinformation research
  'deepfakes': 'Mature', // Significant detection/policy research
  'fraud': 'Growing', // Active concern, growing research
  'authoritarian-tools': 'Growing', // Active human rights research
  'cyberweapons': 'Growing', // Active security research

  // STRUCTURAL RISKS
  'multipolar-trap': 'Growing', // Bostrom, governance literature
  'enfeeblement': 'Neglected', // Limited formal research
  'erosion-of-agency': 'Neglected', // Philosophical concern, limited work
  'winner-take-all': 'Growing', // Economics/antitrust literature
  'proliferation': 'Growing', // Active policy concern
  'irreversibility': 'Growing', // Bostrom, policy focus
  'concentration-of-power': 'Growing', // Active concern in AI governance
  'flash-dynamics': 'Neglected', // Limited research
  'racing-dynamics': 'Growing', // Armstrong et al, policy focus
  'economic-disruption': 'Growing', // Automation/labor economics literature
  'lock-in': 'Growing', // Bostrom, significant discussion
};

const risksDir = 'src/content/docs/knowledge-base/risks';

function addMaturityToFile(filePath) {
  const filename = path.basename(filePath, '.mdx');

  // Skip index files
  if (filename === 'index') return null;

  const maturity = maturityAssessments[filename];
  if (!maturity) {
    console.log(`No maturity assessment for: ${filename}`);
    return null;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if maturity already exists
  if (content.includes('maturity:')) {
    console.log(`Maturity already exists in: ${filename}`);
    return null;
  }

  // Find the frontmatter and add maturity after timeframe or likelihood or severity
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    console.log(`No frontmatter found in: ${filename}`);
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  let newFrontmatter;

  // Try to add after timeframe, then likelihood, then severity, then at the end
  if (frontmatter.includes('timeframe:')) {
    newFrontmatter = frontmatter.replace(
      /(timeframe:.*?)(\n)/,
      `$1$2maturity: "${maturity}"$2`
    );
  } else if (frontmatter.includes('likelihood:')) {
    newFrontmatter = frontmatter.replace(
      /(likelihood:.*?)(\n)/,
      `$1$2maturity: "${maturity}"$2`
    );
  } else if (frontmatter.includes('severity:')) {
    newFrontmatter = frontmatter.replace(
      /(severity:.*?)(\n)/,
      `$1$2maturity: "${maturity}"$2`
    );
  } else {
    // Add before the closing ---
    newFrontmatter = frontmatter + `\nmaturity: "${maturity}"`;
  }

  content = content.replace(frontmatterMatch[1], newFrontmatter);
  fs.writeFileSync(filePath, content);
  console.log(`Added maturity "${maturity}" to: ${filename}`);
  return { filename, maturity };
}

// Process all risk files
const categories = ['accident', 'epistemic', 'misuse', 'structural'];
let updated = 0;

for (const category of categories) {
  const categoryDir = path.join(risksDir, category);
  if (!fs.existsSync(categoryDir)) continue;

  const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.mdx'));

  for (const file of files) {
    const result = addMaturityToFile(path.join(categoryDir, file));
    if (result) updated++;
  }
}

console.log(`\nUpdated ${updated} files with maturity values.`);

// Summary by maturity level
const summary = { Mature: 0, Growing: 0, Emerging: 0, Neglected: 0 };
for (const [_, maturity] of Object.entries(maturityAssessments)) {
  summary[maturity]++;
}
console.log('\nMaturity distribution:');
console.log(summary);
