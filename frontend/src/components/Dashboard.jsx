import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FileText,
  MessageSquare,
  HardDrive,
  Cpu,
  UploadCloud,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function Dashboard({
  token,
  user,
  onNavigateToChat,
  onNavigateToLibrary,
  onSelectDocAndChat,
}) {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalConversations: 0,
    totalStorageBytes: 0,
    activeEngine: "Agentic RAG (GPT-OSS 120B / Hybrid Search)",
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [_loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data) {
        setStats(res.data.stats || stats);
        setRecentDocs(res.data.recentDocuments || []);
        setRecentChats(res.data.recentConversations || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="dashboard-view">
      {/* 1. Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, <span className="highlight-name">{displayName}</span> 👋</h2>
          <p className="welcome-subtitle">
            Here is your MindQuery knowledge base activity and document intelligence metrics.
          </p>
        </div>
        <div className="welcome-actions">
          <button onClick={onNavigateToLibrary} className="btn btn-primary">
            <UploadCloud size={16} />
            <span>Upload Document</span>
          </button>
          <button onClick={onNavigateToChat} className="btn btn-secondary">
            <MessageSquare size={16} />
            <span>Start Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-indigo">
            <FileText size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Documents</span>
            <span className="stat-value">{stats.totalDocuments}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-violet">
            <MessageSquare size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Conversations</span>
            <span className="stat-value">{stats.totalConversations}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-emerald">
            <HardDrive size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Storage Indexed</span>
            <span className="stat-value">{formatSize(stats.totalStorageBytes)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-amber">
            <Cpu size={20} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Active Inference</span>
            <span className="stat-value-sm">GPT-OSS 120B</span>
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Panels */}
      <div className="dashboard-panels-grid">
        {/* Panel A: Recent Documents */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileText size={18} className="panel-icon" />
              <h3>Recent Documents</h3>
            </div>
            <button onClick={onNavigateToLibrary} className="panel-action-link">
              <span>View Library</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="panel-body">
            {recentDocs.length === 0 ? (
              <div className="panel-empty-state">
                <UploadCloud size={36} className="empty-state-icon" />
                <p>No documents uploaded yet.</p>
                <button onClick={onNavigateToLibrary} className="btn btn-outline btn-sm">
                  Upload your first PDF
                </button>
              </div>
            ) : (
              <div className="recent-docs-list">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="recent-doc-row">
                    <div className="doc-row-icon">
                      <FileText size={18} />
                    </div>
                    <div className="doc-row-info">
                      <span className="doc-row-name" title={doc.filename}>{doc.filename}</span>
                      <span className="doc-row-meta">
                        {formatSize(doc.size)} • {doc.chunkCount} chunks • {formatDate(doc.uploadedAt)}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectDocAndChat(doc.id)}
                      className="btn btn-ghost btn-sm"
                      title="Chat with this document"
                    >
                      <MessageSquare size={14} />
                      <span>Chat</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel B: Recent Conversations */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Clock size={18} className="panel-icon" />
              <h3>Recent Q&A Activity</h3>
            </div>
            <button onClick={onNavigateToChat} className="panel-action-link">
              <span>Open Chat</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="panel-body">
            {recentChats.length === 0 ? (
              <div className="panel-empty-state">
                <MessageSquare size={36} className="empty-state-icon" />
                <p>No questions asked yet.</p>
                <button onClick={onNavigateToChat} className="btn btn-outline btn-sm">
                  Ask a question
                </button>
              </div>
            ) : (
              <div className="recent-chats-list">
                {recentChats.map((chat, idx) => (
                  <div key={idx} className="recent-chat-row" onClick={() => onSelectDocAndChat(chat.documentId)}>
                    <div className="chat-row-header">
                      <span className="chat-row-question">Q: {chat.question}</span>
                      {chat.evaluation && (
                        <span className="eval-mini-badge">
                          <ShieldCheck size={11} /> {chat.evaluation.score}%
                        </span>
                      )}
                    </div>
                    <p className="chat-row-answer">
                      {chat.answer?.replace(/[*#_]/g, "").slice(0, 110)}...
                    </p>
                    <span className="chat-row-time">{formatDate(chat.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
