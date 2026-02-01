import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";

const REPO_PATH = "/Users/ozziegooen/Documents/GitHub.nosync/cairn";
const TIMEOUT_MS = 60000;

interface TestCase {
  name: string;
  question: string;
  expectedKeywords: string[]; // Result should contain at least one of these
  shouldFind: boolean; // Whether we expect to find relevant content
}

const TEST_CASES: TestCase[] = [
  {
    name: "Find risk categories",
    question: "What are the main risk categories in this wiki?",
    expectedKeywords: ["risk", "accident", "misuse", "structural"],
    shouldFind: true,
  },
  {
    name: "Find specific risk - scheming",
    question: "What is scheming in AI safety?",
    expectedKeywords: ["scheming", "deceptive", "alignment"],
    shouldFind: true,
  },
  {
    name: "Find responses/interventions",
    question: "What governance responses are discussed?",
    expectedKeywords: ["governance", "policy", "regulation", "intervention"],
    shouldFind: true,
  },
  {
    name: "Handle unknown topic gracefully",
    question: "What does the wiki say about quantum computing?",
    expectedKeywords: ["no mention", "no information", "couldn't find", "not covered", "no relevant", "no content", "not discuss", "not specifically"],
    shouldFind: false,
  },
  {
    name: "Find bioweapons risk",
    question: "What does the wiki say about bioweapons risk?",
    expectedKeywords: ["bioweapon", "biological", "pathogen", "biosecurity"],
    shouldFind: true,
  },
  {
    name: "Find compute governance",
    question: "What is compute governance?",
    expectedKeywords: ["compute", "hardware", "chip", "gpu", "governance"],
    shouldFind: true,
  },
  {
    name: "Find AI capabilities info",
    question: "What capabilities does the wiki discuss?",
    expectedKeywords: ["capability", "capabilities", "reasoning", "coding", "language"],
    shouldFind: true,
  },
  {
    name: "Short simple question",
    question: "What is lock-in?",
    expectedKeywords: ["lock-in", "locked", "irreversible", "path dependence"],
    shouldFind: true,
  },
  {
    name: "Multi-topic question",
    question: "How do racing dynamics relate to AI safety?",
    expectedKeywords: ["racing", "competition", "race", "dynamics", "safety"],
    shouldFind: true,
  },
  {
    name: "Typo resilience",
    question: "What is deceptve alignment?",
    expectedKeywords: ["deceptive", "alignment", "scheming"],
    shouldFind: true,
  },
  {
    name: "Very short question",
    question: "scheming",
    expectedKeywords: ["scheming", "deceptive", "AI"],
    shouldFind: true,
  },
  {
    name: "List request",
    question: "List the main AI safety responses",
    expectedKeywords: ["governance", "technical", "response", "intervention", "alignment"],
    shouldFind: true,
  },
  {
    name: "Includes full URL links",
    question: "What is scheming?",
    expectedKeywords: ["https://ea-crux-project.vercel.app/knowledge-base/"],
    shouldFind: true,
  },
  {
    name: "Links have correct format - scheming",
    question: "Tell me about scheming risk",
    expectedKeywords: ["](https://ea-crux-project.vercel.app/"],
    shouldFind: true,
  },
  {
    name: "Links have correct format - bioweapons",
    question: "What is the bioweapons page about?",
    expectedKeywords: ["](https://ea-crux-project.vercel.app/knowledge-base/risks/misuse/bioweapons"],
    shouldFind: true,
  },
  {
    name: "Multiple links in response",
    question: "What risks are in the structural category?",
    expectedKeywords: ["https://ea-crux-project.vercel.app/knowledge-base/risks/structural/"],
    shouldFind: true,
  },
];

async function runQuery(question: string): Promise<{ result: string; timeMs: number; toolCalls: string[] }> {
  let result = "";
  const toolCalls: string[] = [];
  const startTime = Date.now();

  const queryPromise = (async () => {
    for await (const msg of query({
      prompt: `Answer this question about LongtermWiki: "${question}"

The wiki content is at this ABSOLUTE path: ${REPO_PATH}/apps/longterm/src/content/docs/knowledge-base/

Instructions:
1. Use Grep with path="${REPO_PATH}/apps/longterm/src/content/docs/knowledge-base/" to search
2. Use Read to read specific .mdx files you find
3. If you can't find info after 2-3 searches, say "I couldn't find information about this topic"
4. Be concise (2-3 paragraphs max)
5. IMPORTANT: Include FULL links to relevant pages. Convert file paths to URLs:
   - Remove: apps/longterm/src/content/docs and .mdx
   - Prepend: https://ea-crux-project.vercel.app
   - Example: scheming.mdx → https://ea-crux-project.vercel.app/knowledge-base/risks/accident/scheming/
   - Format: [Page Title](https://ea-crux-project.vercel.app/knowledge-base/...)
   - ALWAYS use the full URL starting with https://`,
      options: {
        allowedTools: ["Read", "Glob", "Grep"],
        workingDirectory: REPO_PATH,
        permissionMode: "bypassPermissions",
      } as any,
    })) {
      if (msg.type === "assistant" && "message" in msg) {
        const content = (msg as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use") {
              toolCalls.push(`${block.name}: ${block.input?.pattern || block.input?.file_path || block.input?.path || ""}`);
            }
          }
        }
      }
      if ("result" in msg) {
        result = msg.result as string;
      }
    }
    return result;
  })();

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT")), TIMEOUT_MS);
  });

  const finalResult = await Promise.race([queryPromise, timeoutPromise]);
  return { result: finalResult, timeMs: Date.now() - startTime, toolCalls };
}

function checkKeywords(text: string, keywords: string[]): { found: boolean; matched: string[] } {
  const lowerText = text.toLowerCase();
  const matched = keywords.filter(kw => lowerText.includes(kw.toLowerCase()));
  return { found: matched.length > 0, matched };
}

async function runTest(test: TestCase): Promise<{ passed: boolean; details: string }> {
  console.log(`\n📋 Running: ${test.name}`);
  console.log(`   Question: "${test.question}"`);

  try {
    const { result, timeMs, toolCalls } = await runQuery(test.question);

    console.log(`   Time: ${(timeMs / 1000).toFixed(1)}s`);
    console.log(`   Tools used: ${toolCalls.length}`);
    toolCalls.slice(0, 5).forEach(tc => console.log(`     - ${tc}`));
    if (toolCalls.length > 5) console.log(`     ... and ${toolCalls.length - 5} more`);

    const { found, matched } = checkKeywords(result, test.expectedKeywords);

    if (test.shouldFind && found) {
      console.log(`   ✅ PASS - Found expected keywords: ${matched.join(", ")}`);
      return { passed: true, details: `Found: ${matched.join(", ")}` };
    } else if (!test.shouldFind && !found) {
      console.log(`   ✅ PASS - Correctly indicated no relevant content`);
      return { passed: true, details: "Correctly handled missing content" };
    } else if (test.shouldFind && !found) {
      console.log(`   ❌ FAIL - Expected keywords not found: ${test.expectedKeywords.join(", ")}`);
      console.log(`   Result preview: ${result.slice(0, 200)}...`);
      return { passed: false, details: `Missing keywords. Got: ${result.slice(0, 100)}...` };
    } else {
      console.log(`   ❌ FAIL - Should not have found content but did`);
      console.log(`   Result preview: ${result.slice(0, 200)}...`);
      return { passed: false, details: `Unexpected match: ${matched.join(", ")}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ FAIL - Error: ${msg}`);
    return { passed: false, details: `Error: ${msg}` };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const quickMode = args.includes("--quick");
  const testFilter = args.find(a => !a.startsWith("--"));

  let testsToRun = TEST_CASES;

  if (quickMode) {
    testsToRun = TEST_CASES.slice(0, 3);
    console.log("🚀 Quick mode: running first 3 tests only");
  } else if (testFilter) {
    testsToRun = TEST_CASES.filter(t =>
      t.name.toLowerCase().includes(testFilter.toLowerCase()) ||
      t.question.toLowerCase().includes(testFilter.toLowerCase())
    );
    console.log(`🔍 Filter: running tests matching "${testFilter}"`);
  }

  console.log("🧪 Claude Agent SDK Test Suite");
  console.log("=".repeat(60));
  console.log(`Running ${testsToRun.length} tests with ${TIMEOUT_MS / 1000}s timeout each`);

  const results: { name: string; passed: boolean; details: string }[] = [];

  for (const test of testsToRun) {
    const result = await runTest(test);
    results.push({ name: test.name, ...result });
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(r => {
    console.log(`${r.passed ? "✅" : "❌"} ${r.name}`);
    if (!r.passed) console.log(`   ${r.details}`);
  });

  console.log(`\nTotal: ${passed}/${results.length} passed, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
