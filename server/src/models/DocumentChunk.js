import mongoose from "mongoose";

// One scraped webpage becomes many smaller chunks.
// Each chunk stores its own embedding vector for RAG retrieval.
const documentChunkSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true }
);

export const DocumentChunk = mongoose.model(
  "DocumentChunk",
  documentChunkSchema
);
