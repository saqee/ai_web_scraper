import { ollama, getEmbeddingModel } from "./ollama.js";

// Turn one string or many strings into embedding vectors.
export async function createEmbeddings(input) {
  const texts = Array.isArray(input) ? input : [input];

  const response = await ollama.embed({
    model: getEmbeddingModel(),
    input: texts,
  });

  return response.embeddings;
}
