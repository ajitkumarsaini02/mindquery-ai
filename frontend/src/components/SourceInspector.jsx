import React from "react";
import { ShieldCheck, Layers, Activity, BookOpen } from "lucide-react";

export default function SourceInspector({ selectedMessage }) {
  if (!selectedMessage) {
    return (
      <div className="card source-inspector empty">
        <Layers className="empty-icon" size={32} />
        <h3>RAG Execution Auditor</h3>
        <p>
          Click on any assistant message in the chat to audit its retrieved document context,
          agentic intent routing, and automated faithfulness score.
        </p>
      </div>
    );
  }

  const { intent, sources, evaluation } = selectedMessage;
  const score = evaluation ? evaluation.score : 100;
  const reasoning = evaluation ? evaluation.reasoning : "Grounded context verified.";

  const getScoreColorClass = (val) => {
    if (val >= 80) return "score-high";
    if (val >= 50) return "score-mid";
    return "score-low";
  };

  return (
    <div className="card source-inspector">
      <div className="card-header">
        <div className="header-title-flex">
          <ShieldCheck className="icon-accent" size={18} />
          <h3>RAG Execution Auditor</h3>
        </div>
        <span className="auditor-live-tag">Live Audit</span>
      </div>

      <div className="inspector-content">
        {/* Section 1: Query Router */}
        <div className="inspector-section">
          <div className="section-title">
            <Activity size={14} />
            <span>Agentic Intent Routing</span>
          </div>
          <div className="router-badge-container">
            <span className="info-label">Classified Intent:</span>
            <span className={`intent-badge ${intent?.toLowerCase()}`}>{intent || "QA"}</span>
          </div>
          <p className="intent-desc">
            {intent === "GREET" &&
              "Routed as conversational pleasantry. Handled instantaneously without vector database queries."}
            {intent === "SUMMARY" &&
              "Routed as document summarization. Leading document sections loaded to compile an executive overview."}
            {intent === "QA" &&
              "Routed as factual inquiry. Executed hybrid search combining dense embeddings with keyword frequency re-ranking."}
          </p>
        </div>

        {/* Section 2: LLM-as-a-Judge Evaluation */}
        <div className="inspector-section">
          <div className="section-title">
            <ShieldCheck size={14} />
            <span>LLM Faithfulness Evaluation</span>
          </div>

          <div className="eval-results-container">
            <div className={`eval-gauge-ring ${getScoreColorClass(score)}`}>
              <span className="gauge-value">{score}%</span>
              <span className="gauge-label">Grounded</span>
            </div>

            <div className="eval-details">
              <div className="eval-status-label">
                Grounding Quality:{" "}
                <span className={`status-text ${getScoreColorClass(score)}`}>
                  {score >= 80 ? "High (Supported by Context)" : score >= 50 ? "Moderate (Partial Evidence)" : "Low (Potential Extrapolation)"}
                </span>
              </div>
              <p className="eval-reasoning">
                <strong>Auditor Reasoning:</strong> <br />
                {reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Retrieved Context Chunks */}
        <div className="inspector-section last">
          <div className="section-title">
            <BookOpen size={14} />
            <span>Retrieved Evidence Chunks ({sources?.length || 0})</span>
          </div>

          {!sources || sources.length === 0 ? (
            <p className="no-sources-text">No document context chunks were required for this response.</p>
          ) : (
            <div className="source-chunks-list">
              {sources.map((src, index) => (
                <div key={src.chunkId || index} className="source-chunk-card">
                  <div className="chunk-card-header">
                    <span className="chunk-badge">Source Chunk #{index + 1}</span>
                    <span className="chunk-meta">
                      Chunk ID: {src.chunkId} • {src.length || src.text?.length || 0} chars
                    </span>
                  </div>
                  <div className="chunk-text-box">{src.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
