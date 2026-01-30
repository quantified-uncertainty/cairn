import "dotenv/config";
import { query } from "@anthropic-ai/claude-agent-sdk";

const REPO_PATH = "/Users/ozziegooen/Documents/GitHub.nosync/cairn";
const TIMEOUT_MS = 60000;

async function testQuery(question: string): Promise<void> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing question: "${question}"`);
  console.log("=".repeat(60));

  let result = "";
  const startTime = Date.now();
  const elapsed = () => `[${((Date.now() - startTime) / 1000).toFixed(1)}s]`;

  const queryPromise = (async () => {
    for await (const msg of query({
      prompt: `Answer this question about the cairn wiki: "${question}"

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
      const msgType = msg.type;
      const subtype = "subtype" in msg ? msg.subtype : "";

      if (msgType === "assistant" && "message" in msg) {
        const content = (msg as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use") {
              console.log(`${elapsed()} 🔧 Tool: ${block.name}`, block.input?.pattern || block.input?.file_path || block.input?.path || "");
            } else if (block.type === "text" && block.text) {
              const preview = block.text.slice(0, 80).replace(/\n/g, " ");
              console.log(`${elapsed()} 💬 ${preview}...`);
            }
          }
        }
      } else if (msgType === "result") {
        console.log(`${elapsed()} ✅ Got result`);
      } else {
        console.log(`${elapsed()} ${msgType} ${subtype}`);
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

  try {
    const finalResult = await Promise.race([queryPromise, timeoutPromise]);
    console.log(`\n${"-".repeat(60)}`);
    console.log("RESULT:");
    console.log("-".repeat(60));
    console.log(finalResult);
  } catch (error) {
    console.error("\nERROR:", error instanceof Error ? error.message : error);
  }

  console.log(`\nTotal time: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
}

// Run test queries
async function main() {
  const testQuestions = process.argv.slice(2);

  if (testQuestions.length === 0) {
    // Default test questions
    await testQuery("What are the main risk categories covered in this wiki?");
  } else {
    for (const q of testQuestions) {
      await testQuery(q);
    }
  }
}

main().catch(console.error);
