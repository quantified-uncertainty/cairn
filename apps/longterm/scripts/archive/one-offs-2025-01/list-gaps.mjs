#!/usr/bin/env node

import fs from 'fs';
import yaml from 'js-yaml';

const pagesData = JSON.parse(fs.readFileSync('./src/data/pages.json', 'utf-8'));
const insightsYaml = fs.readFileSync('./src/data/insights.yaml', 'utf-8');
const insightsData = yaml.load(insightsYaml);

// Get insight counts by source
const insightCounts = new Map();
for (const insight of insightsData.insights || []) {
  const current = insightCounts.get(insight.source) || 0;
  insightCounts.set(insight.source, current + 1);
}

// Calculate gaps
const gaps = pagesData
  .filter(page => page.importance != null && page.importance > 0)
  .map(page => {
    const insightCount = insightCounts.get(page.path) || 0;
    const importance = page.importance || 0;
    const quality = page.quality || 50;
    const potentialScore = Math.round(importance * (1 + quality / 100) - insightCount * 20);
    return {
      title: page.title,
      path: page.path,
      filePath: page.filePath,
      importance,
      quality,
      insightCount,
      potentialScore,
      wordCount: page.wordCount || 0
    };
  })
  .filter(g => g.potentialScore > 60 && g.insightCount < 3)
  .sort((a, b) => b.potentialScore - a.potentialScore)
  .slice(0, 15);

console.log("Top 15 Gap Analysis Candidates:\n");
gaps.forEach((g, i) => {
  console.log(`${i+1}. ${g.title}`);
  console.log(`   Score: ${g.potentialScore} | Imp: ${g.importance} | Qual: ${g.quality} | Insights: ${g.insightCount} | Words: ${g.wordCount}`);
  console.log(`   File: src/content/docs/${g.filePath}\n`);
});

// Output JSON for parsing
console.log("\n--- JSON ---");
console.log(JSON.stringify(gaps.slice(0, 8), null, 2));
