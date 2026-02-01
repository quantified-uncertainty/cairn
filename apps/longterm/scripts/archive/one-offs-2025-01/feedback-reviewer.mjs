#!/usr/bin/env node
/**
 * Feedback Reviewer Prototype
 *
 * Uses the Claude Code CLI to investigate user feedback/criticism
 * against the knowledge base content.
 *
 * Usage:
 *   node scripts/feedback-reviewer.mjs "Your criticism here"
 *   node scripts/feedback-reviewer.mjs --page scheming "Your criticism here"
 */

import { spawn } from "child_process";

const CONTENT_DIR = "src/content/docs/knowledge-base";

function runClaudeCode(prompt, options = {}) {
  const {
    model = "sonnet",
    maxBudget = 0.50,  // Default $0.50 max per review
  } = options;

  return new Promise((resolve, reject) => {
    const args = [
      "@anthropic-ai/claude-code",
      "--print",
      "--dangerously-skip-permissions",
      "--output-format", "json",
      "--allowedTools", "Read", "Glob", "Grep",
      "--model", model,
      "--max-budget-usd", String(maxBudget),
      prompt
    ];

    console.log("Running Claude Code...\n");

    const child = spawn("npx", args, {
      cwd: process.cwd(),
      stdio: ["inherit", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      // Filter out npm warnings
      if (!text.includes("npm warn") && !text.includes("ExperimentalWarning")) {
        stderr += text;
        process.stderr.write(text);
      }
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on("error", reject);
  });
}

async function reviewFeedback(feedback, targetPage = null, options = {}) {
  const { model = "sonnet", maxBudget = 0.50 } = options;

  console.log("\n🔍 Reviewing feedback...\n");
  console.log(`Feedback: "${feedback}"\n`);
  if (targetPage) {
    console.log(`Target page: ${targetPage}`);
  }
  console.log(`Model: ${model} | Max budget: $${maxBudget.toFixed(2)}`);
  console.log("─".repeat(60));
  console.log();

  const pageContext = targetPage
    ? `The user submitted this feedback specifically about the page: ${targetPage}`
    : `The user submitted general feedback about the wiki.`;

  const prompt = `
You are reviewing user feedback/criticism about an AI safety knowledge base wiki.

${pageContext}

USER FEEDBACK:
"${feedback}"

YOUR TASK:
1. Search the knowledge base in ${CONTENT_DIR}/ to find relevant content
2. Read the relevant pages to understand what we currently say
3. Assess the feedback:
   - Is the criticism valid? Does our content actually have this issue?
   - Is the criticism based on a misunderstanding of what we wrote?
   - Is this something we should update, or is the user mistaken?

Be thorough but concise. Search for relevant pages first, then read them.

Return ONLY a JSON object (no other text) in this exact format:
{
  "assessment": "valid" | "partially_valid" | "invalid" | "unclear",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your assessment",
  "relevant_pages": ["list", "of", "pages", "you", "found"],
  "current_content_summary": "What the wiki currently says about this topic",
  "suggested_action": "no_change" | "minor_update" | "major_update" | "needs_discussion",
  "suggested_changes": "If action needed, what specifically should change"
}
`;

  try {
    const result = await runClaudeCode(prompt, options);
    return parseResult(result);
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
}

function parseResult(rawOutput) {
  // Debug: show first 500 chars of raw output
  if (process.env.DEBUG) {
    console.log("\n[DEBUG] Raw output (first 500 chars):");
    console.log(rawOutput.substring(0, 500));
    console.log("...\n");
  }

  try {
    // The output format is JSON from Claude Code
    const output = JSON.parse(rawOutput);

    // Extract the result text from Claude Code's JSON output
    let resultText = "";
    if (output.result) {
      resultText = output.result;
    } else if (output.content) {
      resultText = output.content;
    } else if (typeof output === "string") {
      resultText = output;
    } else {
      // Return the whole output if no result field
      return { raw: JSON.stringify(output, null, 2) };
    }

    // Try to extract JSON from the result
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // JSON in result wasn't valid, return raw
        return { raw: resultText };
      }
    }

    return { raw: resultText };
  } catch (e) {
    // Maybe the raw output is the JSON we want
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        // Fall through
      }
    }
    return { raw: rawOutput || "(empty response)" };
  }
}

function formatResult(result) {
  if (!result) {
    console.log("\n❌ Failed to get assessment\n");
    return;
  }

  if (result.raw) {
    console.log("\n─ Raw Response ─");
    console.log(result.raw);
    return;
  }

  // Check if we have valid structured data
  if (!result.assessment) {
    console.log("\n─ Unstructured Response ─");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("\n" + "═".repeat(60));
  console.log("                    ASSESSMENT RESULT");
  console.log("═".repeat(60) + "\n");

  const assessmentEmoji = {
    valid: "✅",
    partially_valid: "⚠️",
    invalid: "❌",
    unclear: "❓"
  };

  const actionEmoji = {
    no_change: "👍",
    minor_update: "📝",
    major_update: "🔧",
    needs_discussion: "💬"
  };

  console.log(`Assessment: ${assessmentEmoji[result.assessment] || "?"} ${result.assessment?.toUpperCase()}`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  console.log(`Action: ${actionEmoji[result.suggested_action] || "?"} ${result.suggested_action}`);

  console.log("\n─ Reasoning ─");
  console.log(result.reasoning);

  if (result.relevant_pages?.length > 0) {
    console.log("\n─ Relevant Pages ─");
    result.relevant_pages.forEach(page => console.log(`  • ${page}`));
  }

  if (result.current_content_summary) {
    console.log("\n─ Current Content ─");
    console.log(result.current_content_summary);
  }

  if (result.suggested_changes && result.suggested_action !== "no_change") {
    console.log("\n─ Suggested Changes ─");
    console.log(result.suggested_changes);
  }

  console.log("\n" + "═".repeat(60) + "\n");
}

// CLI handling
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
Feedback Reviewer - Investigate user criticism of the wiki

Usage:
  node scripts/feedback-reviewer.mjs "Your feedback here"
  node scripts/feedback-reviewer.mjs --page scheming "Your feedback here"

Options:
  --page <name>       Target a specific page (optional)
  --model <model>     Model to use: sonnet (default), opus, haiku
  --budget <amount>   Max budget in USD (default: 0.50)
  --help, -h          Show this help

Examples:
  node scripts/feedback-reviewer.mjs "The deceptive alignment page doesn't mention gradient hacking"
  node scripts/feedback-reviewer.mjs --model opus --budget 2.00 "Complex criticism requiring deep analysis"
  node scripts/feedback-reviewer.mjs --page racing-dynamics "This understates the importance of compute governance"
`);
  process.exit(0);
}

let targetPage = null;
let feedback = "";
let model = "sonnet";
let maxBudget = 0.50;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--page" && args[i + 1]) {
    targetPage = args[i + 1];
    i++;
  } else if (args[i] === "--model" && args[i + 1]) {
    model = args[i + 1];
    i++;
  } else if (args[i] === "--budget" && args[i + 1]) {
    maxBudget = parseFloat(args[i + 1]);
    i++;
  } else if (!args[i].startsWith("--")) {
    feedback = args[i];
  }
}

if (!feedback) {
  console.error("Error: Please provide feedback to review");
  process.exit(1);
}

// Run the review
reviewFeedback(feedback, targetPage, { model, maxBudget }).then(formatResult);
