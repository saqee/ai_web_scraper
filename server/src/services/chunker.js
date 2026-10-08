// Split one long page into smaller overlapping pieces.
export function chunkText(text, chunkSize = 1000, overlap = 150) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);
    if (end === text.length) break;

    // Keep a little repeated text between chunks.
    start = end - overlap;
  }

  return chunks;
}
