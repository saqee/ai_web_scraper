# AI Web Scraper + RAG + MCP + Agent — MERN Beginner Project

This project is built so you can clearly see the difference between every layer.

## The one sentence to memorize

**Agent decides -> MCP connects/calls -> Cheerio scrapes -> RAG retrieves -> MongoDB stores -> Ollama reasons/answers.**

MCP does **not** replace Cheerio.

---

## Architecture

```text
React UI
   |
   v
Express API
   |
   v
Agent (Ollama)
   |
   v
MCP Client
   |
   v
MCP Server
   |-----------------------------|
   |                             |
   v                             v
scrape_and_store             search_knowledge
   |                             |
   v                             v
Cheerio                       RAG search
   |                             |
   v                             v
Website                      MongoDB chunks
                                 |
                                 v
                              Embeddings
```

---

## 1. Install requirements

You need:

- Node.js 20+
- MongoDB Community Server or MongoDB Atlas
- Ollama
- npm

Check:

```bash
node -v
npm -v
ollama --version
mongosh --version
```

---

## 2. Download Ollama models

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

Why two models?

```text
qwen3:4b
  -> chat
  -> reasoning
  -> agent tool calling

nomic-embed-text
  -> converts text into vectors
  -> used by RAG
```

---

## 3. Start MongoDB

Default URI:

```text
mongodb://127.0.0.1:27017/ai_scraper_agent
```

If you use Atlas, place your Atlas URI inside `.env`.

---

## 4. Backend setup

```bash
cd ai-web-scraper-rag-mcp-agent/server
npm install
cp .env.example .env
npm run dev
```

Expected output:

```text
✅ MongoDB connected
MCP: MongoDB connected
🚀 API running at http://localhost:5000
```

Why does MongoDB connect twice?

Because there are two Node processes:

```text
Process 1 = Express + Agent + MCP client
Process 2 = MCP server
```

The MCP client starts the MCP server as a child process.

---

## 5. Frontend setup

Open a second terminal:

```bash
cd ai-web-scraper-rag-mcp-agent/client
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 6. First test: direct scraping

Paste a public static webpage URL into the UI and click:

```text
Scrape + Store for RAG
```

Flow:

```text
URL
 -> Express /api/scrape
 -> ingestUrl()
 -> Axios downloads HTML
 -> Cheerio extracts text
 -> chunkText() splits text
 -> Ollama creates embeddings
 -> MongoDB stores chunks + vectors
```

This is the **RAG ingestion pipeline**.

---

## 7. Second test: ask stored knowledge

Ask:

```text
What does my stored page say about pricing?
```

Flow:

```text
React
 -> /api/chat
 -> Agent
 -> Ollama sees MCP tools
 -> Ollama chooses search_knowledge
 -> MCP client calls MCP server
 -> RAG embeds question
 -> cosine similarity finds top chunks
 -> chunks return to Ollama
 -> Ollama writes final answer
```

Open **See agent tool steps** in the UI to inspect what tool the agent chose.

---

## 8. Third test: let the agent scrape through MCP

Ask chat:

```text
Please learn this page and store it for later:
https://example.com
```

The agent can choose:

```text
scrape_and_store
```

Then:

```text
Agent
 -> MCP client
 -> MCP server
 -> ingestUrl()
 -> Cheerio
 -> chunks
 -> embeddings
 -> MongoDB
```

Again: **MCP itself did not scrape anything.**

MCP called your JavaScript tool, and that JavaScript tool used Cheerio.

---

# File-by-file explanation

## `server/src/services/scraper.js`

This is the real scraper.

```js
const response = await axios.get(url);
```

Meaning: download raw HTML.

Then:

```js
const $ = cheerio.load(response.data);
```

Meaning: give the HTML to Cheerio.

Then:

```js
$("body").text()
```

Meaning: pull text from the HTML body.

So:

```text
Axios = gets HTML
Cheerio = parses HTML
```

---

## `server/src/services/chunker.js`

A giant page is split into pieces.

```text
long page
 -> chunk 1
 -> chunk 2
 -> chunk 3
```

Overlap repeats a little text between chunks so sentence meaning is not easily cut off.

---

## `server/src/services/embedding.js`

This calls:

```js
ollama.embed(...)
```

Text:

```text
JavaScript is a programming language
```

becomes a vector like:

```text
[0.02, -0.31, 0.88, ...]
```

That vector represents semantic meaning mathematically.

---

## `server/src/services/rag.js`

This is the heart of RAG.

### `ingestUrl()`

```text
scrape
 -> chunk
 -> embed
 -> save
```

### `searchKnowledge()`

```text
question
 -> embedding
 -> compare against saved embeddings
 -> sort by similarity
 -> return top chunks
```

That is the **Retrieval** part of RAG.

The LLM writing the final answer is the **Generation** part.

---

## Cosine similarity

Imagine embeddings are arrows.

Relevant text points in a similar direction.

Unrelated text points in a different direction.

Higher cosine similarity = more semantically related.

Do not memorize the math first. Memorize the idea:

```text
higher score = closer meaning
```

---

## `server/src/mcp/server.js`

This is the actual MCP server.

It announces tools:

```js
server.registerTool("scrape_and_store", ...)
```

Meaning:

```text
MCP clients, I have a tool named scrape_and_store.
```

Inside the tool handler:

```js
await ingestUrl(url)
```

So the MCP tool simply exposes your existing JavaScript function.

This is exactly why MCP does not replace Cheerio.

---

## `server/src/mcp/client.js`

This is the MCP client inside your AI host.

It starts the MCP server:

```js
new StdioClientTransport({
  command: "node",
  args: ["src/mcp/server.js"]
})
```

Then:

```js
client.listTools()
```

means:

```text
Tell me which tools you provide.
```

And:

```js
client.callTool(...)
```

means:

```text
Execute this MCP tool with these arguments.
```

---

## What is stdio?

stdio means standard input/output.

Conceptually:

```text
Express process
   |
   | JSON-RPC messages
   v
MCP child process
```

MCP stdio uses stdout for protocol messages.

That is why the MCP server uses:

```js
console.error(...)
```

for debug logs instead of random `console.log()` output.

---

## `server/src/agent/agent.js`

Normal LLM:

```text
question -> LLM -> answer
```

Agent:

```text
question
   |
   v
  LLM
   |
   +---- decides to call tool?
              |
              v
             MCP
              |
              v
           result
              |
              v
             LLM
              |
              v
           answer
```

The loop gives the LLM multiple rounds to use tools.

If the model returns no `tool_calls`, the final answer is ready.

---

## `client/src/App.jsx`

Two main features:

```text
URL form -> /api/scrape
Question form -> /api/chat -> Agent
```

The UI also shows `result.steps`, so you can inspect which MCP tool the agent used.

---

# MERN mapping

```text
M = MongoDB
E = Express
R = React
N = Node.js
```

This project adds:

```text
+ Cheerio
+ Ollama
+ RAG
+ MCP
+ Agent
```

---

# RAG is NOT a vector database

Wrong idea:

```text
RAG = vector DB
```

Correct:

```text
Question
 -> retrieve relevant knowledge
 -> add that knowledge to model context
 -> generate answer
```

A vector database is just one common retrieval component.

---

# MCP is NOT an agent

Wrong:

```text
MCP = agent
```

Correct:

```text
Agent = decides
MCP = exposes/connects/calls tools
Cheerio = scrapes
RAG = retrieves
LLM = reasons/generates
MongoDB = stores
```

---

# API endpoints

Health:

```http
GET /api/health
```

Direct scrape/RAG ingestion:

```http
POST /api/scrape
Content-Type: application/json

{
  "url": "https://example.com"
}
```

Agent chat:

```http
POST /api/chat
Content-Type: application/json

{
  "message": "What does my stored knowledge say about X?"
}
```

Stored pages:

```http
GET /api/documents
```

---

# Common errors

## `ECONNREFUSED 11434`

Ollama is not reachable.

Try:

```bash
ollama serve
```

On macOS, opening the Ollama app may already start it.

## Model not found

```bash
ollama pull qwen3:4b
ollama pull nomic-embed-text
```

## MongoDB connection refused

Start MongoDB or use your Atlas URI in `.env`.

## Agent does not call tools

Tool use is model-dependent. Use a tool-capable Ollama model and set it in:

```env
CHAT_MODEL=qwen3:4b
```

## Website gives 403

Many sites block simple scrapers.

Cheerio also does not execute browser JavaScript.

Later you can add Playwright as another MCP tool for JavaScript-heavy pages.

---

# Why this tutorial does NOT use Pinecone yet

To teach the concept clearly, embeddings are stored in ordinary MongoDB documents and JavaScript calculates cosine similarity.

That is not ideal for millions of chunks, but it makes the RAG mechanics visible.

After you understand this, replace the retrieval layer with:

- MongoDB Atlas Vector Search
- Qdrant
- Pinecone
- pgvector

The RAG idea stays the same.

---

# Production improvements

Before production, add:

- strong SSRF/private-IP protection
- robots.txt / site terms compliance
- rate limiting
- retries/backoff
- authentication
- per-user knowledge bases
- vector index / real vector DB
- source citations
- duplicate detection
- background job queue
- Playwright for JS-heavy pages
- observability
- prompt-injection defenses for scraped pages
- maximum page and chunk limits

---

# Recommended learning order

Day 1:

```text
scraper.js
```

Understand:

```text
Axios -> HTML -> Cheerio -> text
```

Day 2:

```text
chunker.js
embedding.js
rag.js
```

Understand:

```text
text -> chunks -> vectors -> retrieve
```

Day 3:

```text
mcp/server.js
mcp/client.js
```

Understand:

```text
normal function -> MCP tool
```

Day 4:

```text
agent/agent.js
```

Understand:

```text
LLM -> choose tool -> execute -> observe -> answer
```

Day 5:

React UI and cleanup.

---

# Final mental model

```text
                 USER
                   |
                   v
                 React
                   |
                   v
                Express
                   |
                   v
                 Agent
                   |
                   v
               MCP Client
                   |
                   v
               MCP Server
              /           \
             v             v
   scrape_and_store   search_knowledge
          |                 |
          v                 v
       Cheerio             RAG
          |                 |
          v                 v
       Website           MongoDB
                            |
                            v
                        Embeddings
```

**Agent decides, MCP connects/calls, Cheerio scrapes, RAG retrieves, MongoDB stores, and Ollama reasons/answers.**
