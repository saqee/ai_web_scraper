import "dotenv/config";
import mongoose from "mongoose";
import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { ingestUrl, searchKnowledge } from "../services/rag.js";

async function connectMcpDatabase() {
  const uri =
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_scraper_agent";

  await mongoose.connect(uri);

  // MCP stdio uses stdout for protocol data.
  // Debug logs must go to stderr instead.
  console.error("MCP: MongoDB connected");
}

await connectMcpDatabase();

serveStdio(() => {
  const server = new McpServer({
    name: "ai-web-scraper-tools",
    version: "1.0.0",
  });

  // MCP TOOL 1: scrape a public page and save it for RAG.
  server.registerTool(
    "scrape_and_store",
    {
      description:
        "Scrape a public webpage with Cheerio, split it into chunks, create embeddings, and store them in MongoDB for RAG.",
      inputSchema: z.object({
        url: z.string().url(),
      }),
    },
    async ({ url }) => {
      try {
        const result = await ingestUrl(url);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error.message }],
        };
      }
    }
  );

  // MCP TOOL 2: retrieve semantically relevant stored chunks.
  server.registerTool(
    "search_knowledge",
    {
      description:
        "Search the local RAG knowledge base and return the most semantically relevant webpage chunks.",
      inputSchema: z.object({
        query: z.string().min(1),
        topK: z.number().int().min(1).max(10).default(5),
      }),
    },
    async ({ query, topK }) => {
      try {
        const results = await searchKnowledge(query, topK);
        return {
          content: [{ type: "text", text: JSON.stringify(results) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: error.message }],
        };
      }
    }
  );

  return server;
});
