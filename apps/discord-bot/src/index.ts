import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  QueryLog,
  logQuery,
  calculateCost,
  formatLogSummary,
  ensureLogsDir,
} from "./logger.js";

const REPO_PATH = "/Users/ozziegooen/Documents/GitHub.nosync/cairn";
const TIMEOUT_MS = 60000; // 60 seconds

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Bot is ready! Logged in as ${c.user.tag}`);
  ensureLogsDir();
});

interface QueryResult {
  result: string;
  toolCalls: string[];
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  model?: string;
}

async function queryWithTimeout(question: string): Promise<QueryResult> {
  let result = "";
  let lastResult = "";
  const toolCalls: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheCreationTokens = 0;
  let model: string | undefined;

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

      // Track token usage from assistant messages
      if (msgType === "assistant" && "message" in msg) {
        const message = (msg as any).message;
        if (message?.usage) {
          inputTokens += message.usage.input_tokens || 0;
          outputTokens += message.usage.output_tokens || 0;
          cacheReadTokens += message.usage.cache_read_input_tokens || 0;
          cacheCreationTokens += message.usage.cache_creation_input_tokens || 0;
        }
        if (message?.model) {
          model = message.model;
        }

        const content = message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_use") {
              const toolInfo = `${block.name}: ${block.input?.pattern || block.input?.file_path || block.input?.command || ""}`;
              toolCalls.push(toolInfo);
              console.log(`${elapsed()} 🔧 Tool: ${block.name}`, block.input?.pattern || block.input?.file_path || block.input?.command || "");
            } else if (block.type === "text" && block.text) {
              console.log(`${elapsed()} 💬 Text: ${block.text.slice(0, 100)}...`);
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
        lastResult = result;
      }
    }
    return { result, toolCalls, inputTokens, outputTokens, cacheReadTokens, cacheCreationTokens, model };
  })();

  const timeoutPromise = new Promise<QueryResult>((_, reject) => {
    setTimeout(() => {
      reject(new Error("TIMEOUT"));
    }, TIMEOUT_MS);
  });

  try {
    return await Promise.race([queryPromise, timeoutPromise]);
  } catch (error) {
    if (error instanceof Error && error.message === "TIMEOUT") {
      if (lastResult) {
        return {
          result: lastResult + "\n\n*(Response truncated due to timeout)*",
          toolCalls,
          inputTokens,
          outputTokens,
          cacheReadTokens,
          cacheCreationTokens,
          model,
        };
      }
      throw new Error("Query timed out after 60 seconds");
    }
    throw error;
  }
}

client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Only respond when @mentioned
  if (!client.user || !message.mentions.has(client.user)) return;

  // Extract the question (remove the @mention)
  const question = message.content.replace(/<@!?\d+>/g, "").trim();

  if (!question) {
    await message.reply(
      "Please ask a question! Example: @bot What is this project about?"
    );
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Question from ${message.author.tag}: ${question}`);
  console.log("=".repeat(60));

  // Show typing indicator
  await message.channel.sendTyping();

  const startTime = Date.now();
  let queryLog: QueryLog;

  try {
    console.log("Starting Claude Agent SDK query (60s timeout)...");
    const queryResult = await queryWithTimeout(question);
    const durationMs = Date.now() - startTime;

    const estimatedCostUsd = calculateCost(
      queryResult.inputTokens,
      queryResult.outputTokens,
      queryResult.model
    );

    queryLog = {
      timestamp: new Date().toISOString(),
      question,
      userId: message.author.id,
      userName: message.author.tag,
      responseLength: queryResult.result.length,
      durationMs,
      toolCalls: queryResult.toolCalls,
      inputTokens: queryResult.inputTokens,
      outputTokens: queryResult.outputTokens,
      cacheReadTokens: queryResult.cacheReadTokens,
      cacheCreationTokens: queryResult.cacheCreationTokens,
      model: queryResult.model,
      estimatedCostUsd,
      success: true,
    };

    // Log to file
    logQuery(queryLog);

    // Print summary to console
    console.log("\n" + formatLogSummary(queryLog));

    // Discord has a 2000 character limit
    let result = queryResult.result;
    if (result.length > 1900) {
      result = result.slice(0, 1900) + "\n\n... (truncated)";
    }

    await message.reply(result || "I couldn't find an answer to that question.");
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    queryLog = {
      timestamp: new Date().toISOString(),
      question,
      userId: message.author.id,
      userName: message.author.tag,
      responseLength: 0,
      durationMs,
      toolCalls: [],
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0,
      success: false,
      error: errorMessage,
    };

    logQuery(queryLog);
    console.error("Error querying Claude:", error);
    await message.reply(`Sorry, I encountered an error: ${errorMessage}`);
  }
});

// Validate environment
if (!process.env.DISCORD_TOKEN) {
  console.error("Missing DISCORD_TOKEN in .env file");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY in .env file");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
