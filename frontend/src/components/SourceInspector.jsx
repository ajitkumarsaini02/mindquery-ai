import React from "react";
import { ShieldCheck, Layers, HelpCircle, Activity, BookOpen } from "lucide-react";

export default function SourceInspector({ selectedMessage }) {
  if (!selectedMessage) {
    return (
      <div className="card source-inspector empty">
        <Layers className="empty-icon" size={32} />
        <h3>RAG Auditor</h3>
        <p>Click on any AI assistant message bubble in the chat to audit retrieved document context, query routing, and grounding evaluations.</p>
      </div>
    );
  }

  const { intent, sources, evaluation } = selectedMessage;
  const score = evaluation ? evaluation.score : 100;
  const reasoning = evaluation ? evaluation.reasoning : "N/A";

  // Score styling color class helper
  const getScoreColorClass = (val) => {
    if (val >= 80) return "score-high";
    if (val >= 50) return "score-mid";
    return "score-low";
  };

  return (
    <div className="card source-inspector">
      <div className="card-header">
        <ShieldCheck className="icon-accent" size={18} />
        <h3>RAG Execution Auditor</h3>
      </div>

      <div className="inspector-content">
        {/* Section 1: Query Router */}
        <div className="inspector-section">
          <div className="section-title">
            <Activity size={14} />
            <span>Agentic Query Routing</span>
          </div>
          <div className="router-badge-container">
            <span className="info-label">Detected Intent:</span>
            <span className={`intent-badge ${intent?.toLowerCase()}`}>{intent || "UNKNOWN"}</span>
          </div>
          <p className="intent-desc">
            {intent === "GREET" && "The system routed this as chit-chat, generating a greeting response immediately without file database queries."}
            {intent === "SUMMARY" && "The system recognized a summarization command and loaded the leading segments of the PDF to compile an overview."}
            {intent === "QA" && "This was classified as a factual search query, triggering semantic and keyword retrieval across the index."}
          </p>
        </div>

        {/* Section 2: LLM-as-a-Judge Evaluation */}
        <div className="inspector-section">
          <div className="section-title">
            <ShieldCheck size={14} />
            <span>LLM-as-a-Judge Faithfulness Audit</span>
          </div>
          
          <div className="eval-results-container">
            <div className={`eval-gauge-ring ${getScoreColorClass(score)}`}>
              <span className="gauge-value">{score}%</span>
              <span className="gauge-label">Faithful</span>
            </div>
            
            <div className="eval-details">
              <div className="eval-status-label">
                Grounding Quality:{" "}
                <span className={`status-text ${getScoreColorClass(score)}`}>
                  {score >= 80 ? "Excellent (Grounded)" : score >= 50 ? "Moderate (Partial Info)" : "Low (Potential Hallucination)"}
                </span>
              </div>
              <p className="eval-reasoning">
                <strong>Evaluator Reasoning:</strong> <br />
                {reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Retrieved Context Chunks */}
        <div className="inspector-section last">
          <div className="section-title">
            <BookOpen size={14} />
            <span>Hybrid Search Retained Chunks ({sources?.length || 0})</span>
          </div>

          {(!sources || sources.length === 0) ? (
            <p className="no-sources-text">No document context was loaded for this response.</p>
          ) : (
            <div className="source-chunks-list">
              {sources.map((src, index) => (
                <div key={src.chunkId || index} className="source-chunk-card">
                  <div className="chunk-card-header">
                    <span className="chunk-badge">Source Chunk #{index + 1}</span>
                    <span className="chunk-meta">ID: {src.chunkId} • Size: {src.length} chars</span>
                  </div>
                  <div className="chunk-text-box">
                    {src.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
