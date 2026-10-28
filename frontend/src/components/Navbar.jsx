import React from "react";
import { LogOut, LayoutDashboard, FileText, MessageSquare, LogIn, UserPlus } from "lucide-react";

export default function Navbar({ activeView, setActiveView, user, onLogout }) {
  return (
    <header className="main-navbar">
      <div className="navbar-container">
        {/* Brand Logo & Title */}
        <div className="navbar-brand" onClick={() => setActiveView(user ? "dashboard" : "landing")}>
          <div className="brand-logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
          <div className="brand-text">
            <span className="brand-name">Mind<span className="brand-accent">Query</span></span>
            <span className="brand-tag">AI</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar-nav">
          <button
            className={`nav-link ${activeView === "landing" ? "active" : ""}`}
            onClick={() => setActiveView("landing")}
          >
            Overview
          </button>

          {user && (
            <>
              <button
                className={`nav-link ${activeView === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveView("dashboard")}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </button>
              <button
                className={`nav-link ${activeView === "library" ? "active" : ""}`}
                onClick={() => setActiveView("library")}
              >
                <FileText size={15} />
                <span>Documents</span>
              </button>
              <button
                className={`nav-link ${activeView === "chat" ? "active" : ""}`}
                onClick={() => setActiveView("chat")}
              >
                <MessageSquare size={15} />
                <span>Chat Assistant</span>
              </button>
            </>
          )}
        </nav>

        {/* User / Auth Action Controls */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-profile-menu">
              <div className="user-badge" title={user.email}>
                <div className="user-avatar-dot" />
                <span className="user-email-text">{user.email?.split("@")[0]}</span>
              </div>
              <button onClick={onLogout} className="btn btn-outline btn-sm btn-logout" title="Log Out">
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="auth-nav-buttons">
              <button onClick={() => setActiveView("login")} className="btn btn-ghost btn-sm">
                <LogIn size={14} />
                <span>Log In</span>
              </button>
              <button onClick={() => setActiveView("register")} className="btn btn-primary btn-sm">
                <UserPlus size={14} />
                <span>Sign Up Free</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
