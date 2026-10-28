import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { processPdf, deleteDocumentVectorStore } from "../services/ragService.js";
import Document from "../models/Document.js";
import Chat from "../models/Chat.js";

const router = express.Router();

// Set up Multer for memory buffer storage (zero local file writing overhead, 10MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are supported at this time."));
    }
  },
});

// Route: POST /api/upload
// Accepts a PDF file, parses/chunks/embeds it, and registers metadata in MongoDB.
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
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
      charCount: stats.charCount,
    });

    await docMeta.save();

    res.status(200).json({
      message: "Document successfully parsed and indexed into MindQuery AI.",
      document: {
        id: docMeta.id,
        userId: docMeta.userId,
        filename: docMeta.filename,
        size: docMeta.size,
        chunkCount: docMeta.chunkCount,
        charCount: docMeta.charCount,
        uploadedAt: docMeta.uploadedAt.toISOString(),
      },
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

// Route: GET /api/documents/:documentId
// Fetches specific document details for the authenticated user.
router.get("/documents/:documentId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    const document = await Document.findOne({ id: documentId, userId });
    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    res.status(200).json({ document });
  } catch (error) {
    console.error("Get document error:", error);
    res.status(500).json({ error: "Failed to retrieve document details.", details: error.message });
  }
});

// Route: DELETE /api/documents/:documentId
// Safely deletes the document metadata, associated chats, and clears vector store memory.
router.delete("/documents/:documentId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    // Check ownership
    const doc = await Document.findOne({ id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found or unauthorized to delete." });
    }

    // Delete document record
    await Document.deleteOne({ id: documentId, userId });

    // Clean up associated chat messages
    const deleteChatsResult = await Chat.deleteMany({ documentId, userId });

    // Clear from in-memory / vector store cache
    await deleteDocumentVectorStore(documentId);

    console.log(`[Delete] Document ${documentId} deleted for user ${userId}. Cleaned ${deleteChatsResult.deletedCount} chat entries.`);

    res.status(200).json({
      message: "Document and related chat history deleted successfully.",
      documentId,
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Failed to delete document.", details: error.message });
  }
});

export default router;
