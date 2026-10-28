import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { processPdf } from "../services/ragService.js";
import Document from "../models/Document.js";

const router = express.Router();

// Set up Multer for memory buffer storage (zero local file writing overhead)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route: POST /api/upload
// Accepts a PDF file, parses/chunks/embeds it, and registers metadata in MongoDB.
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF documents are supported." });
    }

    const documentId = req.body.documentId || Math.random().toString(36).substring(7);
    const userId = req.user.id;

    console.log(`[Upload] Processing document "${file.originalname}" (${file.size} bytes) for user ${userId}`);

    // Process PDF and index it in the vector store
    const stats = await processPdf(file.buffer, documentId);

    // Save document metadata to MongoDB
    const docMeta = new Document({
      id: documentId,
      userId: userId,
      filename: file.originalname,
      size: file.size,
      chunkCount: stats.chunkCount,
      charCount: stats.charCount
    });

    await docMeta.save();

    res.status(200).json({
      message: "Document successfully parsed and indexed.",
      document: {
        id: docMeta.id,
        userId: docMeta.userId,
        filename: docMeta.filename,
        size: docMeta.size,
        chunkCount: docMeta.chunkCount,
        charCount: docMeta.charCount,
        uploadedAt: docMeta.uploadedAt.toISOString()
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process PDF.", details: error.message });
  }
});

// Route: GET /api/documents
// Fetches all document metadata uploaded by the authenticated user.
router.get("/documents", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const documents = await Document.find({ userId }).sort({ uploadedAt: -1 });

    res.status(200).json({ documents });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Failed to retrieve documents.", details: error.message });
  }
});

export default router;
