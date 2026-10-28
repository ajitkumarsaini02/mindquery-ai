import React, { useState } from "react";
import { registerUser } from "../config/auth";

export default function Register({ onAuthSuccess, onSwitchToLogin, onBackToLanding }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    setLoading(true);

    try {
      await registerUser(email, password, name);
      onAuthSuccess();
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Failed to create account.");
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
          <h2>Create your Account</h2>
          <p className="auth-subtitle">Get started with MindQuery AI document intelligence</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              placeholder="Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up Free"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <button type="button" className="btn-link" onClick={onSwitchToLogin}>
            Log in instead
          </button>
        </div>
      </div>
    </div>
  );
}
