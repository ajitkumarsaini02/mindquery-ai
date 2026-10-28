import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  Trash2,
  Search,
  ArrowUpDown,
  MessageSquare,
  BookOpen
} from "lucide-react";
import axios from "axios";

export default function DocumentManager({
  token,
  activeDocId,
  setActiveDocId,
  onOpenChat,
  onOpenStudyTools,
  onDocumentsUpdated,
}) {
  const [documents, setDocuments] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, oldest, name, size
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docs = response.data.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !activeDocId) {
        setActiveDocId(docs[0].id);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = "";
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const uploadFiles = async (files) => {
    if (!files || files.length === 0) return;

    // Validate files
    const validPdfs = [];
    const invalidNames = [];
    const oversizedNames = [];

    files.forEach((file) => {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        invalidNames.push(file.name);
      } else if (file.size > 10 * 1024 * 1024) {
        oversizedNames.push(file.name);
      } else {
        validPdfs.push(file);
      }
    });

    if (validPdfs.length === 0) {
      setUploadStatus("error");
      if (invalidNames.length > 0) {
        setStatusMessage(`Only PDF documents are supported. Invalid: ${invalidNames.join(", ")}`);
      } else {
        setStatusMessage("Files exceed 10MB limit. Please upload smaller PDFs.");
      }
      return;
    }

    const count = validPdfs.length;
    setUploadStatus("uploading");
    setStatusMessage(
      count === 1
        ? `Uploading "${validPdfs[0].name}"...`
        : `Uploading ${count} PDF documents simultaneously...`
    );

    const formData = new FormData();
    validPdfs.forEach((file) => {
      formData.append("files", file);
    });

    const statusSequence = [
      {
        delay: 1200,
        status: "processing",
        msg:
          count === 1
            ? "Parsing document layout and typography..."
            : `Parsing layouts for ${count} documents...`,
      },
      {
        delay: 2400,
        status: "processing",
        msg:
          count === 1
            ? "Chunking text with recursive paragraph boundaries..."
            : `Splitting ${count} files into contextual chunks...`,
      },
      {
        delay: 3800,
        status: "processing",
        msg:
          count === 1
            ? "Generating high-dimensional embeddings & indexing..."
            : `Generating vector embeddings & indexing ${count} files...`,
      },
    ];

    statusSequence.forEach((item) => {
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
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadStatus("success");
      const uploadedDocs =
        response.data.documents ||
        (response.data.document ? [response.data.document] : []);

      const successMsg =
        count === 1
          ? `"${uploadedDocs[0]?.filename || "Document"}" parsed, chunked, and indexed successfully!`
          : `All ${uploadedDocs.length} documents successfully parsed, chunked, and indexed!`;

      setStatusMessage(successMsg);
      await fetchDocuments();
      if (onDocumentsUpdated) {
        onDocumentsUpdated();
      }

      if (uploadedDocs.length > 0) {
        setActiveDocId(uploadedDocs[0].id);
      }

      setTimeout(() => {
        setUploadStatus("idle");
        setStatusMessage("");
      }, 3500);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
      const errorMsg =
        error.response?.data?.details ||
        error.response?.data?.error ||
        "Failed to process PDF upload.";
      setStatusMessage(errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      await axios.delete(`${API_URL}/api/documents/${docToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeDocId === docToDelete.id) {
        setActiveDocId("");
      }
      setDocToDelete(null);
      fetchDocuments();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.error || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const filteredDocs = documents
    .filter((doc) => doc.filename.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      if (sortBy === "oldest") return new Date(a.uploadedAt) - new Date(b.uploadedAt);
      if (sortBy === "name") return a.filename.localeCompare(b.filename);
      if (sortBy === "size") return b.size - a.size;
      return 0;
    });

  return (
    <div className="card doc-manager">
      <div className="card-header">
        <div className="header-title-flex">
          <Sparkles className="icon-accent" size={18} />
          <h3>Document Library</h3>
        </div>
        <span className="doc-count-pill">{documents.length} Files</span>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${isDragOver ? "dragover" : ""} status-${uploadStatus}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={
          uploadStatus === "idle" || uploadStatus === "error" || uploadStatus === "success"
            ? () => fileInputRef.current?.click()
            : null
        }
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
          style={{ display: "none" }}
        />

        {uploadStatus === "idle" && (
          <div className="upload-prompt">
            <UploadCloud size={32} className="upload-icon" />
            <p>Drag & drop PDF files here (select multiple), or <span>browse files</span></p>
            <span className="file-hint">Select 1 or multiple PDFs (up to 10MB each) • Batch indexing supported</span>
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
            <span className="retry-hint">Click anywhere to try again</span>
          </div>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="doc-toolbar">
        <div className="search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-control">
          <ArrowUpDown size={14} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      {/* Document Library List */}
      <div className="doc-list-container">
        {filteredDocs.length === 0 ? (
          <div className="empty-docs">
            <FileText size={32} className="empty-docs-icon" />
            <p>No documents found.</p>
            <span className="empty-hint">Upload a PDF above to begin indexing.</span>
          </div>
        ) : (
          <div className="doc-list">
            {filteredDocs.map((doc) => {
              const isSelected = activeDocId === doc.id;
              return (
                <div
                  key={doc.id}
                  className={`doc-card ${isSelected ? "active" : ""}`}
                >
                  <div className="doc-card-main" onClick={() => setActiveDocId(doc.id)}>
                    <div className="doc-icon-badge">
                      <FileText size={18} />
                    </div>
                    <div className="doc-card-info">
                      <span className="doc-card-name" title={doc.filename}>{doc.filename}</span>
                      <span className="doc-card-meta">
                        {formatSize(doc.size)} • {doc.chunkCount} chunks
                      </span>
                    </div>
                  </div>

                  <div className="doc-card-actions">
                    <button
                      className="btn-action"
                      title="Chat with this document"
                      onClick={() => {
                        setActiveDocId(doc.id);
                        if (onOpenChat) onOpenChat(doc.id);
                      }}
                    >
                      <MessageSquare size={14} />
                    </button>
                    <button
                      className="btn-action"
                      title="Generate Study Tools / Quiz"
                      onClick={() => {
                        setActiveDocId(doc.id);
                        if (onOpenStudyTools) onOpenStudyTools(doc);
                      }}
                    >
                      <BookOpen size={14} />
                    </button>
                    <button
                      className="btn-action btn-action-delete"
                      title="Delete document"
                      onClick={() => setDocToDelete(doc)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="modal-backdrop" onClick={() => setDocToDelete(null)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Document</h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>"{docToDelete.filename}"</strong>?
              </p>
              <p className="delete-warning">
                This will remove the document, its chunks from vector search, and all associated chat logs.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setDocToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
