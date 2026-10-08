import { Router } from "express";
import { DocumentChunk } from "../models/DocumentChunk.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const docs = await DocumentChunk.aggregate([
      {
        $group: {
          _id: "$url",
          title: { $first: "$title" },
          chunks: { $sum: 1 },
          updatedAt: { $max: "$updatedAt" },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    res.json(
      docs.map((doc) => ({
        url: doc._id,
        title: doc.title,
        chunks: doc.chunks,
        updatedAt: doc.updatedAt,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
