import { Router } from "express";
import { ingestUrl } from "../services/rag.js";

const router = Router();

// Direct learning/testing endpoint.
// This bypasses the agent and runs the RAG ingestion pipeline directly.
router.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });

    const result = await ingestUrl(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
