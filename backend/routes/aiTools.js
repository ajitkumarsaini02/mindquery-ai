import express from "express";
import authMiddleware from "../middleware/auth.js";
import { generateStudyTools } from "../services/ragService.js";
import Document from "../models/Document.js";

const router = express.Router();

/**
 * Route: POST /api/ai/study-tools
 * Generates MCQs, Flashcards, Revision Notes, or Concept Simplifications.
 */
router.post("/study-tools", authMiddleware, async (req, res) => {
  try {
    const { documentId, toolType, topic } = req.body;
    const userId = req.user.id;

    if (!documentId) {
      return res.status(400).json({ error: "Missing documentId." });
    }

    // Verify document ownership
    const doc = await Document.findOne({ id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found or unauthorized access." });
    }

    const validTypes = ["mcqs", "flashcards", "notes", "simplify", "summary"];
    const selectedType = validTypes.includes(toolType) ? toolType : "notes";

    console.log(`[AI Tools] Generating ${selectedType} for document ${documentId} (user: ${userId})`);

    const result = await generateStudyTools(documentId, selectedType, topic);
    res.status(200).json({ success: true, toolType: selectedType, data: result });
  } catch (err) {
    console.error("AI Study Tools error:", err);
    res.status(500).json({ error: "Failed to generate AI study tools.", details: err.message });
  }
});

export default router;
