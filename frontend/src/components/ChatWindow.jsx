import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Bot,
  User,
  MessageSquare,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  BookOpen,
} from "lucide-react";
import axios from "axios";

export default function ChatWindow({
  token,
  activeDocId,
  documents = [],
  onSelectMessage,
  onOpenStudyTools,
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (activeDocId) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [activeDocId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      setError("");
      const response = await axios.get(`${API_URL}/api/chats/${activeDocId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      const loadedMsgs = [];
      data.chats.forEach((chat) => {
        loadedMsgs.push({
          id: `q-${chat.createdAt}`,
          text: chat.question,
          sender: "user",
          createdAt: chat.createdAt,
        });
        loadedMsgs.push({
          id: `a-${chat.createdAt}`,
          text: chat.answer,
          sender: "ai",
          intent: chat.intent,
          sources: chat.sources,
          evaluation: chat.evaluation,
          createdAt: chat.createdAt,
        });
      });
      setMessages(loadedMsgs);

      const lastAiMsg = loadedMsgs.filter((m) => m.sender === "ai").pop();
      if (lastAiMsg) {
        onSelectMessage(lastAiMsg);
      } else {
        onSelectMessage(null);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      const errorMsg = err.response?.data?.error || "Failed to load chat history.";
      setError(errorMsg);
    }
  };

  const handleSendQuery = async (queryText) => {
    const textToSend = queryText || inputValue;
    if (!textToSend.trim() || loading || !activeDocId) return;

    setInputValue("");
    setError("");
    setLastQuestion(textToSend);

    const userMsg = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const chatHistoryForRag = [];
      const aiMsgs = messages.filter((m) => m.sender === "ai");
      const userMsgs = messages.filter((m) => m.sender === "user");

      const lastTurns = Math.min(aiMsgs.length, 4);
      for (let i = aiMsgs.length - lastTurns; i < aiMsgs.length; i++) {
        if (userMsgs[i] && aiMsgs[i]) {
          chatHistoryForRag.push({ sender: "user", text: userMsgs[i].text });
          chatHistoryForRag.push({ sender: "ai", text: aiMsgs[i].text });
        }
      }

      const response = await axios.post(
        `${API_URL}/api/query`,
        {
          documentId: activeDocId,
          question: textToSend,
          chatHistory: chatHistoryForRag,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;
      const aiMsg = {
        id: `ai-${Date.now()}`,
        text: data.answer,
        sender: "ai",
        intent: data.intent,
        sources: data.sources,
        evaluation: data.evaluation,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      onSelectMessage(aiMsg);
    } catch (err) {
      console.error("Query submit error:", err);
      const errorMsg =
        err.response?.data?.details ||
        err.response?.data?.error ||
        "Failed to fetch response. Try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetryLast = () => {
    if (lastQuestion) {
      handleSendQuery(lastQuestion);
    }
  };

  const handleClearChatView = () => {
    setMessages([]);
    onSelectMessage(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Applies inline-only formatting: bold, italic, citations, inline code
  // Safe to call on table cell content (no block-level tags)
  const inlineFormat = (s) => {
    s = s.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    s = s.replace(/\*\*(.*?)\*\*/g,     "<strong>$1</strong>");
    s = s.replace(/\*(.*?)\*/g,         "<em>$1</em>");
    s = s.replace(/`([^`]+)`/g,         "<code class='md-inline-code'>$1</code>");
    s = s.replace(/【(Source\s*\d+\s*[-–]\s*Chunk\s*#?\d+)】/g, `<span class="md-citation">$1</span>`);
    s = s.replace(/\[(Source\s*\d+\s*[-–]\s*Chunk\s*#?\d+)\]/g, `<span class="md-citation">$1</span>`);
    // Bullet-like lines within a cell (• item) → line break + bullet
    s = s.replace(/•\s*/g, "<br/>• ");
    // Strip leading <br/> added by the above
    s = s.replace(/^<br\/>/, "");
    return s;
  };

  const formatMarkdown = (text) => {
    if (!text) return "";

    // ── 0. Pre-process: normalise literal <br> tags the LLM sometimes outputs ─
    let t = text.replace(/<br\s*\/?>/gi, "\n");

    // ── 1. Escape HTML special chars ──────────────────────────────────────────
    t = t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // ── 2. Fenced code blocks (``` ... ```) ───────────────────────────────────
    t = t.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
      return `<pre class="md-code-block"><code>${code.trim()}</code></pre>`;
    });

    // ── 3. Headings (### ## #) ────────────────────────────────────────────────
    t = t.replace(/^######\s+(.+)$/gm, "<h6 class='md-h6'>$1</h6>");
    t = t.replace(/^#####\s+(.+)$/gm,  "<h5 class='md-h5'>$1</h5>");
    t = t.replace(/^####\s+(.+)$/gm,   "<h4 class='md-h4'>$1</h4>");
    t = t.replace(/^###\s+(.+)$/gm,    "<h3 class='md-h3'>$1</h3>");
    t = t.replace(/^##\s+(.+)$/gm,     "<h2 class='md-h2'>$1</h2>");
    t = t.replace(/^#\s+(.+)$/gm,      "<h1 class='md-h1'>$1</h1>");

    // ── 4. Markdown tables ────────────────────────────────────────────────────
    t = t.replace(
      /((?:\|.+\|\n?)+)/g,
      (block) => {
        const rows = block.trim().split("\n").filter(Boolean);
        if (rows.length < 2) return block;

        const isSep = /^[\|\s\-:]+$/.test(rows[1]);
        if (!isSep) return block;

        const headerCells = rows[0].split("|").map((c) => c.trim()).filter(Boolean);
        const headerHtml  = headerCells.map((c) => `<th>${inlineFormat(c)}</th>`).join("");

        const bodyRows = rows.slice(2).map((row) => {
          const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
          return `<tr>${cells.map((c) => `<td>${inlineFormat(c)}</td>`).join("")}</tr>`;
        });

        return `<div class="md-table-wrap"><table class="md-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyRows.join("")}</tbody></table></div>`;
      }
    );

    // ── 5. Source citations 【Source N – Chunk #N】 ───────────────────────────
    t = t.replace(/【(Source\s*\d+\s*[-–]\s*Chunk\s*#?\d+)】/g, `<span class="md-citation">$1</span>`);
    t = t.replace(/\[(Source\s*\d+\s*[-–]\s*Chunk\s*#?\d+)\]/g, `<span class="md-citation">$1</span>`);

    // ── 6. Bold / Italic ──────────────────────────────────────────────────────
    t = t.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
    t = t.replace(/\*\*(.*?)\*\*/g,     "<strong>$1</strong>");
    t = t.replace(/\*(.*?)\*/g,         "<em>$1</em>");
    t = t.replace(/_(.*?)_/g,           "<em>$1</em>");

    // ── 7. Inline code ────────────────────────────────────────────────────────
    t = t.replace(/`([^`]+)`/g, "<code class='md-inline-code'>$1</code>");

    // ── 8. Blockquotes ────────────────────────────────────────────────────────
    t = t.replace(/^&gt;\s*(.+)$/gm, "<blockquote class='md-blockquote'>$1</blockquote>");

    // ── 9. Horizontal rules ───────────────────────────────────────────────────
    t = t.replace(/^(?:---|\*\*\*|___)\s*$/gm, "<hr class='md-hr'/>");

    // ── 10. Ordered lists ─────────────────────────────────────────────────────
    t = t.replace(/((?:^\d+\.\s+.+$\n?)+)/gm, (block) => {
      const items = block.trim().split("\n").map((line) =>
        `<li>${inlineFormat(line.replace(/^\d+\.\s+/, ""))}</li>`
      );
      return `<ol class="md-ol">${items.join("")}</ol>`;
    });

    // ── 11. Unordered lists ───────────────────────────────────────────────────
    t = t.replace(/((?:^[\s]*[-*+]\s+.+$\n?)+)/gm, (block) => {
      const items = block.trim().split("\n").map((line) =>
        `<li>${inlineFormat(line.replace(/^[\s]*[-*+]\s+/, ""))}</li>`
      );
      return `<ul class="md-ul">${items.join("")}</ul>`;
    });

    // ── 12. Paragraphs — double newlines → paragraph break ────────────────────
    t = t.replace(/\n{2,}/g, "</p><p class='md-p'>");
    t = `<p class='md-p'>${t}</p>`;

    // ── 13. Single newlines → line break (skip inside HTML tags) ─────────────
    t = t.replace(/([^>])\n([^<])/g, "$1<br/>$2");

    return <div className="md-body" dangerouslySetInnerHTML={{ __html: t }} />;
  };

  const activeDoc = documents.find((d) => d.id === activeDocId);

  const suggestedQuestions = [
    "Give me an executive summary of this document.",
    "What are the core conclusions and recommendations?",
    "List the top 3 key takeaways with source citations.",
    "Explain the methodology and key metrics mentioned.",
  ];

  return (
    <div className="card chat-window">
      {/* Chat Window Header with Document Switcher */}
      <div className="chat-window-header">
        <div className="chat-header-title">
          <Bot className="icon-accent" size={18} />
          <div>
            <h3>MindQuery Assistant</h3>
            {activeDoc && (
              <span className="active-doc-tag" title={activeDoc.filename}>
                Active: {activeDoc.filename} ({activeDoc.chunkCount} chunks)
              </span>
            )}
          </div>
        </div>

        <div className="chat-header-actions">
          {activeDoc && (
            <button
              onClick={() => onOpenStudyTools && onOpenStudyTools(activeDoc)}
              className="btn btn-outline btn-sm"
              title="Generate MCQs, Flashcards, or Notes"
            >
              <Sparkles size={14} className="icon-accent" />
              <span>Study Tools</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              onClick={handleClearChatView}
              className="btn btn-ghost btn-sm"
              title="Clear visible conversation view"
            >
              <RotateCw size={14} />
              <span>New Chat</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger chat-alert">
          <AlertCircle size={16} />
          <div className="alert-content">
            <span>{error}</span>
            {lastQuestion && (
              <button onClick={handleRetryLast} className="btn-alert-retry">
                Retry Query
              </button>
            )}
          </div>
        </div>
      )}

      {/* Message Log */}
      <div className="message-log">
        {!activeDocId ? (
          <div className="chat-empty">
            <MessageSquare size={44} className="empty-icon" />
            <h3>No Document Selected</h3>
            <p>Upload a PDF document or choose one from your library to start questioning.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <Bot size={44} className="empty-icon" />
            <h3>Ready to Query: {activeDoc?.filename}</h3>
            <p className="empty-hint-text">
              Ask any question, or select one of the suggested prompts below:
            </p>

            <div className="suggested-prompts-grid">
              {suggestedQuestions.map((prompt, idx) => (
                <button
                  key={idx}
                  className="suggested-prompt-chip"
                  onClick={() => handleSendQuery(prompt)}
                  disabled={loading}
                >
                  <Sparkles size={13} className="chip-icon" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${msg.sender} ${msg.sender === "ai" ? "clickable" : ""}`}
              onClick={() => msg.sender === "ai" && onSelectMessage(msg)}
            >
              <div className="message-avatar">
                {msg.sender === "user" ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="message-content">
                <div className="message-text">{formatMarkdown(msg.text)}</div>

                {msg.sender === "ai" && (
                  <div className="message-meta-bar">
                    <div className="meta-left">
                      <span className="intent-tag">Intent: {msg.intent}</span>
                      {msg.evaluation && (
                        <span className="grounding-badge">
                          Grounding: {msg.evaluation.score}%
                        </span>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <span className="sources-count-badge">
                          <BookOpen size={11} /> {msg.sources.length} Sources Cited
                        </span>
                      )}
                    </div>

                    <div className="meta-right">
                      <button
                        className="btn-msg-copy"
                        title="Copy answer to clipboard"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAnswer(msg.id, msg.text);
                        }}
                      >
                        {copiedId === msg.id ? (
                          <Check size={13} className="text-success" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="message-bubble ai loading">
            <div className="message-avatar">
              <Bot size={14} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
              <span className="loading-hint-text">Synthesizing evidence-backed answer...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuery();
        }}
        className="chat-input-tray"
      >
        <input
          type="text"
          placeholder={
            activeDocId
              ? `Ask anything about ${activeDoc?.filename || "this document"}...`
              : "Select a document to begin..."
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!activeDocId || loading}
          required
        />
        <button
          type="submit"
          className="btn btn-send"
          disabled={!activeDocId || loading || !inputValue.trim()}
          title="Send query"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
