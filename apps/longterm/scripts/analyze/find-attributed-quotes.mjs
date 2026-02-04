#!/usr/bin/env node
/**
 * Scan all MDX files for quotes attributed to specific people.
 * Flags potential hallucination risks for manual review.
 *
 * Usage: node scripts/analyze/find-attributed-quotes.mjs [--output json|csv]
 */

import fs from 'fs';
import path from 'path';

// Known EA/rationalist community members - quotes from these people need extra scrutiny
const HIGH_SCRUTINY_NAMES = [
  'Eliezer Yudkowsky', 'Paul Christiano', 'Holden Karnofsky', 'Dustin Moskovitz',
  'Ben Pace', 'Scott Alexander', 'Gwern', 'Wei Dai', 'Nick Bostrom', 'Toby Ord',
  'Will MacAskill', 'Rob Wiblin', 'Kelsey Piper', 'Dylan Matthews', 'Luke Muehlhauser',
  'Nate Soares', 'Rob Bensinger', 'Oliver Habryka', 'Kaj Sotala', 'Anna Salamon',
  'Carl Shulman', 'Daniel Kokotajlo', 'Ajeya Cotra', 'Joe Carlsmith', 'Evan Hubinger',
  'Buck Shlegeris', 'Ryan Greenblatt', 'Sam Bowman', 'Jan Leike', 'Chris Olah',
  'Dario Amodei', 'Daniela Amodei', 'Sam Altman', 'Ilya Sutskever', 'Stuart Russell',
  'Yoshua Bengio', 'Geoffrey Hinton', 'Demis Hassabis', 'Shane Legg',
];

// Patterns to find attributed quotes
const QUOTE_PATTERNS = [
  // Person said/wrote/argued/stated "quote"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:said|wrote|argued|stated|noted|observed|commented|claimed|explained|described|characterized|called(?:\s+it)?)\s*[:\s]*[""]([^""]+)[""]/gi,
  // According to Person, "quote"
  /[Aa]ccording to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)[,:\s]+[""]([^""]+)[""]/gi,
  // Person's view/argument/claim that "quote"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?:'s)?\s+(?:view|argument|claim|position|statement)\s+(?:that\s+)?[""]([^""]+)[""]/gi,
  // As Person put it, "quote"
  /[Aa]s\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+put it[,:\s]+[""]([^""]+)[""]/gi,
  // Person criticized/described X as "quote"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:criticized|described|characterized|labeled|called)\s+[^""]+\s+as\s+[""]([^""]+)[""]/gi,
];

function getAllMdxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllMdxFiles(filePath, fileList);
    } else if (file.endsWith('.mdx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function findAttributedQuotes() {
  const contentDir = path.join(process.cwd(), 'src/content/docs');
  const files = getAllMdxFiles(contentDir);

  const results = [];

  for (const filePath of files) {
    const relativePath = path.relative(contentDir, filePath);
    const content = fs.readFileSync(filePath, 'utf-8');

    for (const pattern of QUOTE_PATTERNS) {
      // Reset regex state
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(content)) !== null) {
        const person = match[1].trim();
        const quote = match[2].trim();

        // Skip very short quotes (likely not substantive)
        if (quote.length < 15) continue;

        // Determine risk level
        const isHighScrutiny = HIGH_SCRUTINY_NAMES.some(name =>
          person.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(person.toLowerCase())
        );

        // Find line number
        const beforeMatch = content.slice(0, match.index);
        const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

        // Check for nearby citation
        const afterMatch = content.slice(match.index, match.index + match[0].length + 50);
        const hasCitation = /\[\^\d+\]/.test(afterMatch);

        results.push({
          file: relativePath,
          lineNumber,
          person,
          quote: quote.length > 80 ? quote.slice(0, 80) + '...' : quote,
          fullQuote: quote,
          hasCitation,
          isHighScrutiny,
          riskLevel: isHighScrutiny ? 'HIGH' : (hasCitation ? 'MEDIUM' : 'HIGH'),
          context: match[0].slice(0, 120),
        });
      }
    }
  }

  return results;
}

async function main() {
  const outputFormat = process.argv.includes('--output')
    ? process.argv[process.argv.indexOf('--output') + 1]
    : 'table';

  console.log('Scanning for attributed quotes...\n');

  const quotes = await findAttributedQuotes();

  // Sort by risk level, then by file
  quotes.sort((a, b) => {
    if (a.riskLevel !== b.riskLevel) {
      return a.riskLevel === 'HIGH' ? -1 : 1;
    }
    return a.file.localeCompare(b.file);
  });

  if (outputFormat === 'json') {
    console.log(JSON.stringify(quotes, null, 2));
  } else if (outputFormat === 'csv') {
    console.log('file,line,person,quote,hasCitation,riskLevel');
    for (const q of quotes) {
      console.log(`"${q.file}",${q.lineNumber},"${q.person}","${q.quote.replace(/"/g, '""')}",${q.hasCitation},${q.riskLevel}`);
    }
  } else {
    // Table format
    const highRisk = quotes.filter(q => q.riskLevel === 'HIGH');
    const mediumRisk = quotes.filter(q => q.riskLevel === 'MEDIUM');

    console.log(`Found ${quotes.length} attributed quotes total\n`);
    console.log(`🔴 HIGH RISK (known community members or no citation): ${highRisk.length}`);
    console.log(`🟡 MEDIUM RISK (has citation but should verify): ${mediumRisk.length}\n`);

    if (highRisk.length > 0) {
      console.log('='.repeat(80));
      console.log('HIGH RISK QUOTES - Verify these manually:');
      console.log('='.repeat(80));

      for (const q of highRisk) {
        console.log(`\n📄 ${q.file}:${q.lineNumber}`);
        console.log(`   Person: ${q.person}${q.isHighScrutiny ? ' ⚠️  [KNOWN COMMUNITY MEMBER]' : ''}`);
        console.log(`   Quote: "${q.quote}"`);
        console.log(`   Citation: ${q.hasCitation ? 'Yes' : 'NO ❌'}`);
      }
    }

    // Summary by file
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY BY FILE:');
    console.log('='.repeat(80));

    const byFile = {};
    for (const q of quotes) {
      if (!byFile[q.file]) byFile[q.file] = { high: 0, medium: 0 };
      if (q.riskLevel === 'HIGH') byFile[q.file].high++;
      else byFile[q.file].medium++;
    }

    const sortedFiles = Object.entries(byFile)
      .sort((a, b) => b[1].high - a[1].high)
      .slice(0, 20);

    for (const [file, counts] of sortedFiles) {
      if (counts.high > 0) {
        console.log(`  ${file}: ${counts.high} high, ${counts.medium} medium`);
      }
    }
  }
}

main().catch(console.error);
