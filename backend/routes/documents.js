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
// Accepts single or multiple PDF files, parses/chunks/embeds them, and registers metadata in MongoDB.
router.post("/upload", authMiddleware, upload.any(), async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files were uploaded. Please select one or more PDF files." });
    }

    const userId = req.user.id;
    const processedDocs = [];
    const errors = [];

    console.log(`[Upload] Processing batch of ${files.length} document(s) for user ${userId}`);

    // Process each document sequentially to respect API rate limits and ensure clean indexing
    for (const file of files) {
      try {
        const documentId = (files.length === 1 && req.body.documentId)
          ? req.body.documentId
          : Math.random().toString(36).substring(7);

        console.log(`[Upload] Parsing & indexing: "${file.originalname}" (${file.size} bytes)...`);

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

        processedDocs.push({
          id: docMeta.id,
          userId: docMeta.userId,
          filename: docMeta.filename,
          size: docMeta.size,
          chunkCount: docMeta.chunkCount,
          charCount: docMeta.charCount,
          uploadedAt: docMeta.uploadedAt.toISOString(),
        });
      } catch (fileErr) {
        console.error(`[Upload] Failed to process "${file.originalname}":`, fileErr.message);
        errors.push({
          filename: file.originalname,
          error: fileErr.message,
        });
      }
    }

    if (processedDocs.length === 0) {
      return res.status(500).json({
        error: "Failed to process uploaded PDF(s).",
        details: errors.map((e) => `${e.filename}: ${e.error}`).join("; "),
        errors,
      });
    }

    const isMultiple = processedDocs.length > 1;
    res.status(200).json({
      message: isMultiple
        ? `${processedDocs.length} documents successfully parsed and indexed into MindQuery AI.`
        : "Document successfully parsed and indexed into MindQuery AI.",
      document: processedDocs[0],
      documents: processedDocs,
      totalUploaded: processedDocs.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to process PDF upload.", details: error.message });
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
