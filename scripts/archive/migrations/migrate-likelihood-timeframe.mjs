/**
 * Migrate likelihood and timeframe fields from freetext to structured format
 */

import fs from 'fs';

const entitiesPath = 'src/data/entities.yaml';
let content = fs.readFileSync(entitiesPath, 'utf8');

// Parse likelihood strings into structured format
function parseLikelihood(str) {
  if (!str) return null;

  const lower = str.toLowerCase();
  let level, status, confidence, notes;

  // Extract level
  if (lower.includes('near-certain') || lower.includes('near certain')) {
    level = 'near-certain';
  } else if (lower.includes('very high')) {
    level = 'very-high';
  } else if (lower.includes('medium-high') || lower.includes('medium high')) {
    level = 'medium-high';
  } else if (lower.includes('high') && !lower.includes('medium')) {
    level = 'high';
  } else if (lower.includes('medium') || lower.includes('low-medium') || lower.includes('low medium')) {
    level = 'medium';
  } else if (lower.includes('low')) {
    level = 'low';
  } else {
    level = 'medium'; // default
  }

  // Extract status
  if (lower.includes('theoretical')) {
    status = 'theoretical';
  } else if (lower.includes('emerging') || lower.includes('increasing')) {
    status = 'emerging';
  } else if (lower.includes('occurring') || lower.includes('observed') || lower.includes('already') || lower.includes('deployed')) {
    status = 'occurring';
  } else if (lower.includes('established') || lower.includes('widespread')) {
    status = 'established';
  }

  // Extract confidence hints
  if (lower.includes('debated') || lower.includes('uncertain') || lower.includes('possible')) {
    confidence = 'low';
  }

  // Extract notes from parentheses
  const parenMatch = str.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const parenContent = parenMatch[1].toLowerCase();
    // Don't include status-related parenthetical as notes if we already extracted it
    if (!['occurring', 'observed', 'emerging', 'theoretical', 'established', 'increasing', 'already deployed'].some(s => parenContent.includes(s))) {
      notes = parenMatch[1];
    }
  }

  return { level, status, confidence, notes };
}

// Parse timeframe strings into structured format
function parseTimeframe(str) {
  if (!str) return null;

  const lower = str.toLowerCase();
  let median, earliest, latest, confidence, notes;

  // Handle "Current"
  if (lower === 'current' || lower.includes('current') && !lower.includes('to')) {
    return { median: 2025 };
  }

  // Handle "Advanced AI" type
  if (lower.includes('advanced ai') || lower.includes('agi')) {
    return { median: 2035, confidence: 'low' };
  }

  // Handle ranges like "Now - 2030", "2024-2035", "Near-term to Long-term"
  const rangeMatch = str.match(/(\d{4})\s*[-–—to]+\s*(\d{4})/i);
  if (rangeMatch) {
    earliest = parseInt(rangeMatch[1]);
    latest = parseInt(rangeMatch[2]);
    median = Math.round((earliest + latest) / 2);
    return { median, earliest, latest };
  }

  // Handle "Now - YEAR" pattern
  const nowToMatch = str.match(/now\s*[-–—to]+\s*(\d{4})/i);
  if (nowToMatch) {
    earliest = 2025;
    latest = parseInt(nowToMatch[1]);
    median = Math.round((earliest + latest) / 2);
    return { median, earliest, latest };
  }

  // Handle single year
  const yearMatch = str.match(/(\d{4})/);
  if (yearMatch) {
    median = parseInt(yearMatch[1]);
    return { median };
  }

  // Handle text descriptions
  if (lower.includes('near-term') || lower.includes('near term')) {
    if (lower.includes('long')) {
      // "Near-term to Long-term"
      return { median: 2030, earliest: 2025, latest: 2040 };
    }
    return { median: 2027, earliest: 2025, latest: 2030 };
  }

  if (lower.includes('long-term') || lower.includes('long term')) {
    return { median: 2035, earliest: 2030, latest: 2045 };
  }

  if (lower.includes('present')) {
    return { median: 2025 };
  }

  // Default fallback
  return { median: 2030 };
}

// Convert structured object to YAML string
function toYamlLikelihood(obj) {
  if (!obj) return null;

  let lines = [];
  lines.push(`    level: ${obj.level}`);
  if (obj.status) lines.push(`    status: ${obj.status}`);
  if (obj.confidence) lines.push(`    confidence: ${obj.confidence}`);
  if (obj.notes) lines.push(`    notes: "${obj.notes}"`);

  return `\n${lines.join('\n')}`;
}

function toYamlTimeframe(obj) {
  if (!obj) return null;

  let lines = [];
  lines.push(`    median: ${obj.median}`);
  if (obj.earliest) lines.push(`    earliest: ${obj.earliest}`);
  if (obj.latest) lines.push(`    latest: ${obj.latest}`);
  if (obj.confidence) lines.push(`    confidence: ${obj.confidence}`);
  if (obj.notes) lines.push(`    notes: "${obj.notes}"`);

  return `\n${lines.join('\n')}`;
}

// Process the file
// Find all likelihood: "..." patterns and replace with structured
const likelihoodRegex = /^(\s*)likelihood:\s*["']?([^"\n]+?)["']?\s*$/gm;
let likelihoodCount = 0;

content = content.replace(likelihoodRegex, (match, indent, value) => {
  // Skip if already structured (has nested properties)
  if (value.trim() === '' || value.includes('level:')) return match;

  const parsed = parseLikelihood(value.trim());
  if (parsed) {
    likelihoodCount++;
    const yaml = toYamlLikelihood(parsed);
    console.log(`Likelihood: "${value.trim()}" → level: ${parsed.level}, status: ${parsed.status || 'none'}`);
    return `${indent}likelihood:${yaml}`;
  }
  return match;
});

// Find all timeframe: "..." patterns and replace with structured
const timeframeRegex = /^(\s*)timeframe:\s*["']?([^"\n]+?)["']?\s*$/gm;
let timeframeCount = 0;

content = content.replace(timeframeRegex, (match, indent, value) => {
  // Skip if already structured
  if (value.trim() === '' || value.includes('median:')) return match;

  const parsed = parseTimeframe(value.trim());
  if (parsed) {
    timeframeCount++;
    const yaml = toYamlTimeframe(parsed);
    console.log(`Timeframe: "${value.trim()}" → median: ${parsed.median}, range: ${parsed.earliest || '?'}-${parsed.latest || '?'}`);
    return `${indent}timeframe:${yaml}`;
  }
  return match;
});

fs.writeFileSync(entitiesPath, content);
console.log(`\nMigrated ${likelihoodCount} likelihood fields and ${timeframeCount} timeframe fields.`);
