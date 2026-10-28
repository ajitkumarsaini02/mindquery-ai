import express from "express";
import authMiddleware from "../middleware/auth.js";
import Document from "../models/Document.js";
import Chat from "../models/Chat.js";

const router = express.Router();

/**
 * Route: GET /api/dashboard/stats
 * Provides verified metrics for the authenticated user's dashboard.
 */
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user documents count and total storage
    const documents = await Document.find({ userId }).sort({ uploadedAt: -1 });
    const totalDocuments = documents.length;
    const totalStorageBytes = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

    // Fetch conversations count
    const totalConversations = await Chat.countDocuments({ userId });

    // Recent conversations
    const recentConversations = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("question answer intent evaluation createdAt documentId");

    // Top recent documents
    const recentDocuments = documents.slice(0, 5);

    res.status(200).json({
      stats: {
        totalDocuments,
        totalConversations,
        totalStorageBytes,
        activeEngine: "Agentic RAG (GPT-OSS 120B / Hybrid Search)",
      },
      recentDocuments,
      recentConversations,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to load dashboard statistics.", details: err.message });
  }
});

export default router;

