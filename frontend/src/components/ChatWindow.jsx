import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, MessageSquare, AlertCircle } from "lucide-react";
import axios from "axios";

export default function ChatWindow({ token, activeDocId, onSelectMessage }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Load chat history when active document changes
  useEffect(() => {
    if (activeDocId) {
      loadChatHistory();
    } else {
      setMessages([]);
    }
  }, [activeDocId, token]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadChatHistory = async () => {
    try {
      setError("");
      const response = await axios.get(`${API_URL}/api/chats/${activeDocId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      // Convert API chat log schema to frontend chat message schema
      const loadedMsgs = [];
      data.chats.forEach(chat => {
        loadedMsgs.push({
          id: `q-${chat.createdAt}`,
          text: chat.question,
          sender: "user",
          createdAt: chat.createdAt
        });
        loadedMsgs.push({
          id: `a-${chat.createdAt}`,
          text: chat.answer,
          sender: "ai",
          intent: chat.intent,
          sources: chat.sources,
          evaluation: chat.evaluation,
          createdAt: chat.createdAt
        });
      });
      setMessages(loadedMsgs);
      
      // Select the last AI response by default to load inside inspector
      const lastAiMsg = loadedMsgs.filter(m => m.sender === "ai").pop();
      if (lastAiMsg) {
        onSelectMessage(lastAiMsg);
      } else {
        onSelectMessage(null);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      const errorMsg = err.response?.data?.error || "Failed to load chat history. Check server logs.";
      setError(errorMsg);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading || !activeDocId) return;

    const userText = inputValue;
    setInputValue("");
    setError("");

    // Add user message to UI immediately
    const userMsg = {
      id: `user-${Date.now()}`,
      text: userText,
      sender: "user",
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build brief context history for RAG (last 4 QA turns)
      const chatHistoryForRag = [];
      const aiMsgs = messages.filter(m => m.sender === "ai");
      const userMsgs = messages.filter(m => m.sender === "user");
      
      const lastTurns = Math.min(aiMsgs.length, 4);
      for (let i = aiMsgs.length - lastTurns; i < aiMsgs.length; i++) {
        if (userMsgs[i] && aiMsgs[i]) {
          chatHistoryForRag.push({ sender: "user", text: userMsgs[i].text });
          chatHistoryForRag.push({ sender: "ai", text: aiMsgs[i].text });
        }
      }

      const response = await axios.post(`${API_URL}/api/query`, 
        {
          documentId: activeDocId,
          question: userText,
          chatHistory: chatHistoryForRag
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
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
        createdAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
      onSelectMessage(aiMsg); // Auto-focus in Source Inspector
    } catch (err) {
      console.error("Query submit error:", err);
      const errorMsg = err.response?.data?.error || "Failed to fetch response. Try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Safe client-side markdown formatter (headings, bold, lists, code snippets)
  const formatMarkdown = (text) => {
    if (!text) return "";
    
    // Escape HTML tags to prevent XSS
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bullet points
    formatted = formatted.replace(/^\s*-\s+(.+)$/gm, "<li>$1</li>");
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Code blocks
    formatted = formatted.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
    // Inline code
    formatted = formatted.replace(/`(.*?)`/g, "<code>$1</code>");

    // Line breaks
    formatted = formatted.replace(/\n/g, "<br />");

    return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="card chat-window">
      <div className="card-header">
        <Bot className="icon-accent" size={18} />
        <h3>DocuMind Chat Assistant</h3>
      </div>

      {error && (
        <div className="alert alert-danger chat-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Message Log */}
      <div className="message-log">
        {!activeDocId ? (
          <div className="chat-empty">
            <MessageSquare size={48} className="empty-icon" />
            <h3>No Document Selected</h3>
            <p>Upload a PDF document or select one from your indexed library to start chatting with it.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <Bot size={48} className="empty-icon" />
            <h3>Chat with your PDF</h3>
            <p>Type a question below. The routing engine will decide whether to look up answers or compile a summary.</p>
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
                  <div className="message-meta-tag">
                    <span>Intent: {msg.intent}</span>
                    {msg.evaluation && (
                      <span className={`eval-pill score-${Math.floor(msg.evaluation.score / 10) * 10}`}>
                        Grounding: {msg.evaluation.score}%
                      </span>
                    )}
                    <span className="info-tip">Click bubble to inspect RAG sources</span>
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
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} className="chat-input-tray">
        <input
          type="text"
          placeholder={activeDocId ? "Ask a question about the document..." : "Select a document to begin..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!activeDocId || loading}
          required
        />
        <button type="submit" disabled={!activeDocId || loading || !inputValue.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
