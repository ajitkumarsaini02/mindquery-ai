import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, Sparkles, AlertCircle } from "lucide-react";
import axios from "axios";

export default function DocumentManager({ token, activeDocId, setActiveDocId }) {
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, processing, success, error
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch documents list on mount
  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(response.data.documents || []);
      // Automatically select the most recently uploaded document if none selected
      if (response.data.documents && response.data.documents.length > 0 && !activeDocId) {
        setActiveDocId(response.data.documents[0].id);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const uploadFile = async (file) => {
    if (file.type !== "application/pdf") {
      setUploadStatus("error");
      setStatusMessage("Only PDF files are supported.");
      return;
    }

    setUploadStatus("uploading");
    setStatusMessage("Uploading PDF to server...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentId", Math.random().toString(36).substring(7));

    // Simulated parsing step updates to give a premium progressive loading visual
    const statusSequence = [
      { delay: 1500, status: "processing", msg: "Extracting plain text layout..." },
      { delay: 3000, status: "processing", msg: "Chunking content using RecursiveCharacterSplitter..." },
      { delay: 4500, status: "processing", msg: "Generating vector embeddings (Gemini Embedding-001)..." }
    ];

    statusSequence.forEach(item => {
      setTimeout(() => {
        setUploadStatus((currentStatus) => {
          if (currentStatus === "uploading" || currentStatus === "processing") {
            setStatusMessage(item.msg);
            return item.status;
          }
          return currentStatus;
        });
      }, item.delay);
    });

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadStatus("success");
      setStatusMessage("Document parsed, chunked & indexed successfully!");
      fetchDocuments();
      setActiveDocId(response.data.document.id);

      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage("");
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      const errorMsg = error.response?.data?.error || "Failed to upload.";
      setStatusMessage(errorMsg);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="card doc-manager">
      <div className="card-header">
        <Sparkles className="icon-accent" size={18} />
        <h3>Knowledge Base Docs</h3>
      </div>

      {/* Upload Zone */}
      <div 
        className={`upload-zone ${isDragOver ? "dragover" : ""} status-${uploadStatus}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={uploadStatus === "idle" || uploadStatus === "error" || uploadStatus === "success" ? triggerFileSelect : null}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf" 
          style={{ display: "none" }}
        />

        {uploadStatus === "idle" && (
          <div className="upload-prompt">
            <UploadCloud size={32} className="upload-icon" />
            <p>Drag & drop a PDF here, or <span>browse files</span></p>
            <span className="file-hint">Maximum file size: 10MB</span>
          </div>
        )}

        {(uploadStatus === "uploading" || uploadStatus === "processing") && (
          <div className="upload-progress">
            <Loader2 size={32} className="spinner" />
            <p>{statusMessage}</p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="upload-success">
            <CheckCircle2 size={32} className="success-icon" />
            <p>{statusMessage}</p>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="upload-error">
            <AlertCircle size={32} className="error-icon" />
            <p>{statusMessage}</p>
            <span className="retry-hint">Click to try again</span>
          </div>
        )}
      </div>

      {/* Document Library */}
      <div className="doc-list-container">
        <h4>Indexed Library ({documents.length})</h4>
        {documents.length === 0 ? (
          <div className="empty-docs">
            <p>No documents uploaded yet. Upload a PDF to start query indexing.</p>
          </div>
        ) : (
          <div className="doc-list">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className={`doc-item ${activeDocId === doc.id ? "active" : ""}`}
                onClick={() => setActiveDocId(doc.id)}
              >
                <FileText className="doc-icon" size={18} />
                <div className="doc-info">
                  <span className="doc-name" title={doc.filename}>{doc.filename}</span>
                  <span className="doc-meta">
                    {formatSize(doc.size)} • {doc.chunkCount} chunks
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
