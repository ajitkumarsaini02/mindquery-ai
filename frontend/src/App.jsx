import React, { useState, useEffect } from "react";
import { subscribeAuthState, logoutUser } from "./config/auth";
import Login from "./components/Login";
import Register from "./components/Register";
import DocumentManager from "./components/DocumentManager";
import ChatWindow from "./components/ChatWindow";
import SourceInspector from "./components/SourceInspector";
import { LogOut, Key, Sparkles } from "lucide-react";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [activeView, setActiveView] = useState("login"); // login, register, dashboard
  const [activeDocId, setActiveDocId] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Subscribe to auth state updates on mount
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Get JWT token from auth session
        const jwtToken = await currentUser.getIdToken();
        setToken(jwtToken);
        setActiveView("dashboard");
      } else {
        setUser(null);
        setToken("");
        setActiveView("login");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveDocId("");
      setSelectedMessage(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="app-shell">
      {/* 1. Auth Page Views */}
      {activeView === "login" && (
        <Login 
          onAuthSuccess={() => setActiveView("dashboard")} 
          onSwitchToRegister={() => setActiveView("register")} 
        />
      )}
      
      {activeView === "register" && (
        <Register 
          onAuthSuccess={() => setActiveView("dashboard")} 
          onSwitchToLogin={() => setActiveView("login")} 
        />
      )}

      {/* 2. Main Dashboard View */}
      {activeView === "dashboard" && user && (
        <div className="dashboard-layout">
          {/* Main Top Header */}
          <header className="main-header">
            <div className="header-brand">
              <div className="brand-logo">DM</div>
              <h1>DocuMind AI</h1>
              <span className="brand-tag">RAG Platform</span>
            </div>

            <div className="header-controls">
              <div className="user-profile">
                <span className="user-email" title={user.email}>{user.email}</span>
                <button onClick={handleLogout} className="btn btn-logout" title="Log Out">
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </header>

          {/* Three-Column Dashboard Grid */}
          <main className="dashboard-grid">
            {/* Column 1: Document Manager */}
            <DocumentManager 
              token={token} 
              activeDocId={activeDocId} 
              setActiveDocId={setActiveDocId} 
            />

            {/* Column 2: Conversational Chat */}
            <ChatWindow 
              token={token} 
              activeDocId={activeDocId} 
              onSelectMessage={setSelectedMessage} 
            />

            {/* Column 3: RAG Execution Auditor */}
            <SourceInspector 
              selectedMessage={selectedMessage} 
            />
          </main>
        </div>
      )}
    </div>
  );
}
