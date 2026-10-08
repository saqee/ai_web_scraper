import { DocumentChunk } from "../models/DocumentChunk.js";
import { createEmbeddings } from "./embedding.js";
import { chunkText } from "./chunker.js";
import { scrapeWebsite } from "./scraper.js";

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return -1;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return -1;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// RAG ingestion pipeline:
// scrape -> chunk -> embed -> store.
export async function ingestUrl(url) {
  const page = await scrapeWebsite(url);
  const chunks = chunkText(page.content, 1000, 150);
  const embeddings = await createEmbeddings(chunks);

  // Replace old chunks if the same URL is ingested again.
  await DocumentChunk.deleteMany({ url: page.url });

  const rows = chunks.map((text, index) => ({
    url: page.url,
    title: page.title,
    chunkIndex: index,
    text,
    embedding: embeddings[index],
  }));

  await DocumentChunk.insertMany(rows);

  return {
    url: page.url,
    title: page.title,
    chunksStored: rows.length,
  };
}

// RAG retrieval pipeline:
// question -> embedding -> cosine comparison -> top chunks.
export async function searchKnowledge(query, topK = 5) {
  const [queryEmbedding] = await createEmbeddings(query);

  // For teaching, we calculate vector similarity in JavaScript.
  // For production use Atlas Vector Search/Qdrant/Pinecone/pgvector.
  const candidates = await DocumentChunk.find({})
    .select("url title chunkIndex text embedding")
    .limit(3000)
    .lean();

  return candidates
    .map((doc) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ embedding, ...rest }) => rest);
}
