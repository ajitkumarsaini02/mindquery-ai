import React from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  FileText,
  Bot,
  Lock,
  Search,
  CheckCircle2,
  Brain,
} from "lucide-react";

export default function LandingPage({ onGetStarted }) {
  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-icon" />
            <span>Agentic RAG Document Assistant • Powered by GPT-OSS 120B</span>
          </div>

          <h1 className="hero-title">
            Your Documents. <br />
            <span className="gradient-text">Your Answers.</span>
          </h1>

          <p className="hero-subtitle">
            MindQuery AI transforms your PDFs into conversational knowledge bases.
            Upload any document, ask questions in plain English, and receive evidence-based answers
            with transparent source citations and automated grounding audits.
          </p>

          <div className="hero-actions">
            <button onClick={onGetStarted} className="btn btn-primary btn-lg">
              <span>Start Asking</span>
              <ArrowRight size={18} />
            </button>
            <button onClick={() => handleScrollTo("features")} className="btn btn-secondary btn-lg">
              <span>Explore Features</span>
            </button>
          </div>

          <div className="hero-metrics-pill">
            <div className="metric-item">
              <strong>100%</strong>
              <span>Grounded in Evidence</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <strong>Sub-Second</strong>
              <span>Hybrid Search</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <strong>Multi-Turn</strong>
              <span>Agentic Routing</span>
            </div>
          </div>
        </div>

        {/* 2. Product Preview Mockup */}
        <div className="product-preview-container">
          <div className="product-preview-window">
            <div className="preview-window-bar">
              <div className="window-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="preview-url-bar">
                <span>app.mindquery.ai/workspace/annual-report-2025.pdf</span>
              </div>
            </div>

            <div className="preview-grid">
              {/* Document Pane */}
              <div className="preview-doc-pane">
                <div className="doc-pane-header">
                  <FileText size={16} />
                  <span>Annual_Report_2025.pdf</span>
                  <span className="doc-page-badge">Page 4 of 28</span>
                </div>
                <div className="doc-pane-content">
                  <div className="doc-highlight-box">
                    <p className="doc-chunk-tag">[Chunk #14 - Cited]</p>
                    <p>
                      "...Net operating revenue reached <strong>\$4.28 billion</strong> for FY2025, representing a 
                      <strong> 24.6% year-over-year growth</strong>. The acceleration was predominantly driven 
                      by our enterprise AI assistant deployment and cloud service integrations..."
                    </p>
                  </div>
                  <div className="doc-blurred-lines">
                    <div className="blur-line w-90" />
                    <div className="blur-line w-75" />
                    <div className="blur-line w-85" />
                  </div>
                </div>
              </div>

              {/* Chat Pane */}
              <div className="preview-chat-pane">
                <div className="chat-preview-header">
                  <Bot size={18} className="icon-ai" />
                  <div>
                    <h4>MindQuery Assistant</h4>
                    <span className="status-online">● Ready for questions</span>
                  </div>
                </div>

                <div className="chat-preview-messages">
                  <div className="msg-preview user">
                    <p>What was the net revenue in FY2025 and what drove the growth?</p>
                  </div>

                  <div className="msg-preview ai">
                    <p>
                      According to the report, net operating revenue for FY2025 was <strong>\$4.28 billion</strong>, 
                      reflecting a <strong>24.6% year-over-year increase</strong>. 
                      This growth was primarily driven by:
                    </p>
                    <ul>
                      <li>Enterprise AI assistant adoption</li>
                      <li>Expanded cloud services integration</li>
                    </ul>
                    <div className="preview-citation-bar">
                      <span className="citation-pill">
                        <BookOpen size={11} /> Source Chunk #14 (Page 4)
                      </span>
                      <span className="grounding-pill">
                        <ShieldCheck size={11} /> 98% Grounded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-eyebrow">Capabilities</span>
          <h2 className="section-title">Engineered for Document Understanding</h2>
          <p className="section-subtitle">
            Combines high-density semantic retrieval, keyword indexing, and LLM-as-a-Judge audits.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper bg-indigo">
              <Brain size={24} />
            </div>
            <h3>Agentic Intent Routing</h3>
            <p>
              Automatically classifies user questions into conversational greetings, document summaries, 
              or deep factual QA to execute the right retrieval strategy.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-violet">
              <Zap size={24} />
            </div>
            <h3>Hybrid Vector & Keyword Search</h3>
            <p>
              Merges dense semantic embeddings with sparse keyword relevance scoring (70% semantic / 30% keyword) 
              to pinpoint obscure terms and high-level concepts.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-emerald">
              <ShieldCheck size={24} />
            </div>
            <h3>LLM Faithfulness Auditor</h3>
            <p>
              Every response is scored by an independent AI Judge that measures whether each fact 
              is grounded strictly in the source text, catching hallucinations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-amber">
              <BookOpen size={24} />
            </div>
            <h3>Study Tools & Concept Quizzes</h3>
            <p>
              Turn any technical document or textbook into interactive multiple-choice quizzes, 
              high-yield flashcards, and plain-language summaries in seconds.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-blue">
              <Search size={24} />
            </div>
            <h3>Transparent Source Inspector</h3>
            <p>
              Directly view the exact text chunks, character lengths, and chunk IDs retrieved from 
              your document so you can verify each assertion with your own eyes.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper bg-purple">
              <Lock size={24} />
            </div>
            <h3>Tenant-Isolated Security</h3>
            <p>
              User documents and vector stores are strictly isolated per account. 
              Your documents are never used for training external frontier models.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <span className="section-eyebrow">Workflow</span>
          <h2 className="section-title">How MindQuery AI Works</h2>
          <p className="section-subtitle">
            From raw PDF to verified answers in three streamlined steps.
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">01</div>
            <h4>Upload & Chunk</h4>
            <p>
              Upload your PDF. MindQuery extracts clean layout text and applies recursive character splitting 
              with 200-character overlaps to preserve context boundaries.
            </p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">02</div>
            <h4>Index & Embed</h4>
            <p>
              High-dimensional vector embeddings are generated and stored in Pinecone or local in-memory stores 
              for instant multi-document similarity queries.
            </p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">03</div>
            <h4>Synthesize & Audit</h4>
            <p>
              Groq GPT-OSS 120B synthesizes an evidence-backed answer citing source chunks, 
              which an LLM auditor evaluates for 100% faithfulness.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Accuracy & Citations Section */}
      <section className="accuracy-section">
        <div className="accuracy-container">
          <div className="accuracy-text">
            <span className="section-eyebrow">Zero Hallucinations</span>
            <h2>Evidence-Based Answering You Can Trust</h2>
            <p>
              Generic chatbots guess when they don't know the answer. MindQuery AI strictly enforces 
              evidence boundaries: if an uploaded document does not contain the answer, the assistant 
              clearly states that the evidence is unavailable.
            </p>
            <div className="accuracy-bullets">
              <div className="accuracy-bullet">
                <CheckCircle2 size={18} className="text-success" />
                <span>Prompt-injection hardened against adversarial documents</span>
              </div>
              <div className="accuracy-bullet">
                <CheckCircle2 size={18} className="text-success" />
                <span>Verbatim chunk citations with page and chunk identifiers</span>
              </div>
              <div className="accuracy-bullet">
                <CheckCircle2 size={18} className="text-success" />
                <span>Transparent scoring gauge with real-time audit reasoning</span>
              </div>
            </div>
          </div>
          <div className="accuracy-card">
            <div className="audit-card-sample">
              <div className="audit-sample-header">
                <ShieldCheck size={20} className="text-primary" />
                <span>Faithfulness Audit Report</span>
              </div>
              <div className="audit-sample-score">
                <span className="sample-number">98%</span>
                <span className="sample-label">Document Grounding Score</span>
              </div>
              <p className="audit-sample-reasoning">
                <strong>Auditor Verdict:</strong> "All figures and key claims regarding FY2025 revenue are explicitly supported by Chunk #14 of the uploaded PDF."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call To Action Footer Banner */}
      <section className="cta-banner-section">
        <div className="cta-card">
          <h2>Ready to Query Your Documents?</h2>
          <p>Create your free account today and start asking questions with sub-second verified answers.</p>
          <button onClick={onGetStarted} className="btn btn-primary btn-lg">
            <span>Get Started with MindQuery AI</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="brand-text">
              <span className="brand-name">Mind<span className="brand-accent">Query</span></span>
              <span className="brand-tag">AI</span>
            </div>
            <p className="footer-tagline">Your documents. Your answers.</p>
            <p className="footer-copy">© 2026 MindQuery AI. MIT License.</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h5>Product</h5>
              <button onClick={() => handleScrollTo("features")}>Features</button>
              <button onClick={onGetStarted}>Chat Assistant</button>
              <button onClick={onGetStarted}>Document Library</button>
            </div>
            <div className="footer-column">
              <h5>Technology</h5>
              <span>GPT-OSS 120B</span>
              <span>Gemini Embeddings</span>
              <span>Pinecone Vector DB</span>
            </div>
            <div className="footer-column">
              <h5>Security</h5>
              <span>Private Vector Stores</span>
              <span>JWT Authentication</span>
              <span>Zero Model Training</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
