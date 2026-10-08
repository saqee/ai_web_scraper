import { Ollama } from "ollama";

export const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
});

export function getChatModel() {
  return process.env.CHAT_MODEL || "qwen3:4b";
}

export function getEmbeddingModel() {
  return process.env.EMBEDDING_MODEL || "nomic-embed-text";
}
