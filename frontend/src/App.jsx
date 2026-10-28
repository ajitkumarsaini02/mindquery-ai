import React, { useState, useEffect } from "react";
import axios from "axios";
import { subscribeAuthState, logoutUser } from "./config/auth";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import DocumentManager from "./components/DocumentManager";
import ChatWindow from "./components/ChatWindow";
import SourceInspector from "./components/SourceInspector";
import StudyToolsModal from "./components/StudyToolsModal";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [activeView, setActiveView] = useState("landing"); // landing, dashboard, library, chat, login, register
  const [activeDocId, setActiveDocId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Study Tools Modal state
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [studyTargetDoc, setStudyTargetDoc] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Subscribe to auth state updates on mount
  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const jwtToken = await currentUser.getIdToken();
        setToken(jwtToken);
        // If current view was auth, navigate to dashboard
        setActiveView((prev) => (prev === "login" || prev === "register" ? "dashboard" : prev));
      } else {
        setUser(null);
        setToken("");
        setActiveView((prev) => (prev === "dashboard" || prev === "library" || prev === "chat" ? "landing" : prev));
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch documents whenever token changes
  useEffect(() => {
    if (token) {
      fetchDocumentsList();
    } else {
      setDocuments([]);
    }
  }, [token]);

  const fetchDocumentsList = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const docs = res.data.documents || [];
      setDocuments(docs);
      if (docs.length > 0 && !activeDocId) {
        setActiveDocId(docs[0].id);
      }
    } catch (err) {
      console.error("Failed to load user documents:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveDocId("");
      setSelectedMessage(null);
      setActiveView("landing");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleSelectDocAndChat = (docId) => {
    setActiveDocId(docId);
    setActiveView("chat");
  };

  const handleOpenStudyTools = (doc) => {
    setStudyTargetDoc(doc);
    setStudyModalOpen(true);
  };

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content-area">
        {/* View 1: Landing Page */}
        {activeView === "landing" && (
          <LandingPage
            onGetStarted={() => setActiveView(user ? "dashboard" : "register")}
            user={user}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {/* View 2: Login */}
        {activeView === "login" && (
          <Login
            onAuthSuccess={() => {
              setActiveView("dashboard");
              fetchDocumentsList();
            }}
            onSwitchToRegister={() => setActiveView("register")}
            onBackToLanding={() => setActiveView("landing")}
          />
        )}

        {/* View 3: Register */}
        {activeView === "register" && (
          <Register
            onAuthSuccess={() => {
              setActiveView("dashboard");
              fetchDocumentsList();
            }}
            onSwitchToLogin={() => setActiveView("login")}
            onBackToLanding={() => setActiveView("landing")}
          />
        )}

        {/* View 4: Dashboard */}
        {activeView === "dashboard" && user && (
          <div className="dashboard-container">
            <Dashboard
              token={token}
              user={user}
              onNavigateToChat={() => setActiveView("chat")}
              onNavigateToLibrary={() => setActiveView("library")}
              onSelectDocAndChat={handleSelectDocAndChat}
            />
          </div>
        )}

        {/* View 5: Document Library Full View */}
        {activeView === "library" && user && (
          <div className="library-view-container">
            <DocumentManager
              token={token}
              activeDocId={activeDocId}
              setActiveDocId={setActiveDocId}
              onOpenChat={(docId) => handleSelectDocAndChat(docId)}
              onOpenStudyTools={(doc) => handleOpenStudyTools(doc)}
            />
          </div>
        )}

        {/* View 6: Chat & Auditor Workspace */}
        {activeView === "chat" && user && (
          <div className="chat-workspace-grid">
            <div className="chat-main-column">
              <ChatWindow
                token={token}
                activeDocId={activeDocId}
                setActiveDocId={setActiveDocId}
                documents={documents}
                onSelectMessage={setSelectedMessage}
                onOpenStudyTools={(doc) => handleOpenStudyTools(doc)}
              />
            </div>
            <div className="auditor-side-column">
              <SourceInspector selectedMessage={selectedMessage} />
            </div>
          </div>
        )}
      </main>

      {/* Global Study Tools Modal */}
      {studyModalOpen && (
        <StudyToolsModal
          isOpen={studyModalOpen}
          onClose={() => setStudyModalOpen(false)}
          activeDocId={studyTargetDoc?.id || activeDocId}
          activeDocName={studyTargetDoc?.filename || documents.find((d) => d.id === activeDocId)?.filename}
          token={token}
        />
      )}
    </div>
  );
}
