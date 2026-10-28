import React, { useState } from "react";
import { signInUser } from "../config/auth";

export default function Login({ onAuthSuccess, onSwitchToRegister, onBackToLanding }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInUser(email, password);
      onAuthSuccess();
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-badge" onClick={onBackToLanding} title="Back to overview">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" fill="#6366f1" />
              <path d="M14 2v6a1 1 0 0 0 1 1h6" fill="#4338ca" opacity="0.4" />
              <circle cx="9" cy="11" r="1.5" fill="#ffffff" />
              <circle cx="15" cy="11" r="1.5" fill="#ffffff" />
              <circle cx="12" cy="16" r="1.8" fill="#ffffff" />
              <line x1="9" y1="11" x2="15" y2="11" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="9" y1="11" x2="12" y2="16" stroke="#ffffff" strokeWidth="1.2" />
              <line x1="15" y1="11" x2="12" y2="16" stroke="#ffffff" strokeWidth="1.2" />
            </svg>
          </div>
          <h2>Welcome to MindQuery AI</h2>
          <p className="auth-subtitle">Log in to chat with your documents and access your knowledge base</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Authenticating..." : "Log In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <button type="button" className="btn-link" onClick={onSwitchToRegister}>
            Sign up free
          </button>
        </div>
      </div>
    </div>
  );
}
