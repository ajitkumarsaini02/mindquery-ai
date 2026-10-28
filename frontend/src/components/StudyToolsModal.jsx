import React, { useState } from "react";
import axios from "axios";
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileCheck,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Loader2,
  Lightbulb
} from "lucide-react";

export default function StudyToolsModal({ isOpen, onClose, activeDocId, token, activeDocName }) {
  const [activeTab, setActiveTab] = useState("mcqs"); // mcqs, flashcards, notes, simplify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toolData, setToolData] = useState(null);
  const [copied, setCopied] = useState(false);

  // MCQ state
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  if (!isOpen) return null;

  const handleGenerate = async (type = activeTab) => {
    if (!activeDocId) return;
    setLoading(true);
    setError("");
    setToolData(null);
    setUserAnswers({});
    setSubmittedQuiz(false);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const res = await axios.post(
        `${API_URL}/api/ai/study-tools`,
        { documentId: activeDocId, toolType: type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToolData(res.data.data);
    } catch (err) {
      console.error("Study tools error:", err);
      setError(err.response?.data?.details || err.message || "Failed to generate study tool.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setToolData(null);
    setError("");
  };

  const handleOptionSelect = (qId, option) => {
    if (submittedQuiz) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card study-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles className="icon-accent" size={20} />
            <div>
              <h3>AI Study Suite & Quiz Generator</h3>
              <p className="modal-doc-target">Target: {activeDocName || "Selected Document"}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-close-modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="study-tabs">
          <button
            className={`study-tab-btn ${activeTab === "mcqs" ? "active" : ""}`}
            onClick={() => switchTab("mcqs")}
          >
            <HelpCircle size={15} />
            <span>Practice MCQs</span>
          </button>
          <button
            className={`study-tab-btn ${activeTab === "flashcards" ? "active" : ""}`}
            onClick={() => switchTab("flashcards")}
          >
            <BookOpen size={15} />
            <span>Flashcards</span>
          </button>
          <button
            className={`study-tab-btn ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => switchTab("notes")}
          >
            <FileCheck size={15} />
            <span>Revision Notes</span>
          </button>
          <button
            className={`study-tab-btn ${activeTab === "simplify" ? "active" : ""}`}
            onClick={() => switchTab("simplify")}
          >
            <Lightbulb size={15} />
            <span>Explain Simply</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="modal-body">
          {!toolData && !loading && (
            <div className="study-empty-state">
              <Sparkles size={40} className="empty-icon-sparkle" />
              <h4>Generate {activeTab.toUpperCase()} from this Document</h4>
              <p>MindQuery AI extracts key concepts and generates tailored study material grounded in your PDF.</p>
              <button onClick={() => handleGenerate(activeTab)} className="btn btn-primary btn-md">
                <span>Generate Now</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="study-loading-state">
              <Loader2 size={36} className="spinner" />
              <p>Synthesizing study materials from document context...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <p>{error}</p>
            </div>
          )}

          {/* Tab 1: MCQs */}
          {toolData && activeTab === "mcqs" && (
            <div className="mcqs-container">
              <div className="study-results-header">
                <h4>{toolData.title || "Knowledge Quiz"}</h4>
                <button onClick={() => handleGenerate("mcqs")} className="btn btn-ghost btn-sm">
                  <RotateCw size={14} />
                  <span>Regenerate</span>
                </button>
              </div>

              {toolData.questions?.map((q, idx) => (
                <div key={q.id || idx} className="mcq-card">
                  <p className="mcq-question"><strong>Q{idx + 1}:</strong> {q.question}</p>
                  <div className="mcq-options-list">
                    {q.options?.map((opt, optIdx) => {
                      const isSelected = userAnswers[q.id || idx] === opt;
                      const isCorrect = submittedQuiz && opt.startsWith(q.answer?.[0] || q.answer);
                      const isWrong = submittedQuiz && isSelected && !isCorrect;

                      return (
                        <button
                          key={optIdx}
                          className={`mcq-option-btn ${isSelected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                          onClick={() => handleOptionSelect(q.id || idx, opt)}
                        >
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submittedQuiz && (
                    <div className="mcq-explanation">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              <div className="mcq-footer-actions">
                {!submittedQuiz ? (
                  <button
                    onClick={() => setSubmittedQuiz(true)}
                    className="btn btn-primary"
                    disabled={Object.keys(userAnswers).length === 0}
                  >
                    Check Answers
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmittedQuiz(false);
                      setUserAnswers({});
                    }}
                    className="btn btn-secondary"
                  >
                    Retry Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Flashcards */}
          {toolData && activeTab === "flashcards" && (
            <div className="flashcards-container">
              <div className="study-results-header">
                <h4>{toolData.title || "Key Concept Flashcards"}</h4>
                <span className="card-counter">
                  Card {currentCardIndex + 1} of {toolData.cards?.length || 1}
                </span>
              </div>

              {toolData.cards && toolData.cards.length > 0 && (
                <div
                  className={`flashcard-item ${isFlipped ? "flipped" : ""}`}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <span className="card-side-tag">QUESTION / CONCEPT</span>
                      <p>{toolData.cards[currentCardIndex].front}</p>
                      <span className="flip-hint">Click card to reveal answer</span>
                    </div>
                    <div className="flashcard-back">
                      <span className="card-side-tag">ANSWER / EXPLANATION</span>
                      <p>{toolData.cards[currentCardIndex].back}</p>
                      <span className="flip-hint">Click to flip back</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flashcard-controls">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentCardIndex === 0}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => prev - 1);
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <RotateCw size={14} />
                  <span>Flip</span>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={currentCardIndex >= (toolData.cards?.length || 1) - 1}
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => prev + 1);
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3 & 4: Notes and Simple Explanations */}
          {toolData && (activeTab === "notes" || activeTab === "simplify") && (
            <div className="notes-container">
              <div className="study-results-header">
                <h4>{activeTab === "notes" ? "Structured Revision Notes" : "Plain-Language Explanation"}</h4>
                <button
                  onClick={() => handleCopyText(toolData.content || toolData.rawContent)}
                  className="btn btn-outline btn-sm"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copied ? "Copied!" : "Copy Notes"}</span>
                </button>
              </div>

              <div className="markdown-notes-view">
                <pre className="notes-pre">{toolData.content || toolData.rawContent}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
