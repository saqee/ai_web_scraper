import { Router } from "express";
import { runAgent } from "../agent/agent.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const result = await runAgent(message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
