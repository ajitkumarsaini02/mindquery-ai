<p align="center">
  <h1 align="center">🧠 MindQuery AI — Agentic RAG Document Assistant</h1>
  <p align="center">
    <strong>Your documents. Your answers. Chat with your PDFs using Agentic RAG — powered by GPT-OSS 120B, Gemini Embeddings & Pinecone</strong>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain" />
  <img src="https://img.shields.io/badge/Pinecone-000000?style=for-the-badge&logo=pinecone&logoColor=white" alt="Pinecone" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

---

## 📖 Overview

**MindQuery AI** is an advanced full-stack **MERN** Agentic Retrieval-Augmented Generation (RAG) platform that lets users upload PDF documents, chat with them conversationally, and generate AI-powered study materials (MCQs, flashcards, revision notes, concept simplifications).

It integrates **Google Gemini embeddings**, **Groq's ultra-fast GPT-OSS 120B inference**, and **Pinecone cloud vector storage** (with local memory fallback) to deliver evidence-based answers grounded strictly in your documents — complete with a real-time **LLM-as-a-Judge Faithfulness Auditor**.

> **Upload a PDF → Ask questions in natural language → Receive cited, evaluated answers instantly.**

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure user registration and login with bcrypt password hashing and token authentication |
| 📄 **Document Library** | Drag-and-drop PDF upload with progress tracking, search filtering, and sorting |
| ⚡ **Agentic RAG Pipeline** | Layout text extraction, recursive chunking (1000/200 overlap), embedding generation, and vector indexing |
| 🤖 **Agentic Intent Routing** | Classifies queries dynamically into Greeting, Summary, or QA workflows using LLM + rule fallback |
| 🎯 **Hybrid Retrieval** | Blends dense semantic vector similarity with sparse keyword density scoring (70% semantic / 30% keyword) |
| 🛡️ **LLM Faithfulness Auditor** | Automated LLM-as-a-Judge evaluates each answer for grounding quality and flags hallucinations |
| 📋 **Source Inspector** | View exact retrieved chunks, character counts, and chunk IDs for full transparency |
| 🎓 **AI Study Suite** | Automatically generates interactive MCQs with answers, flashcards with 3D flip, and revision notes |
| 📊 **User Dashboard** | Real-time verified metrics tracking total documents, active conversations, and storage indexed |
| 🌙 **Modern SaaS UI/UX** | Clean violet/slate aesthetic with responsive layouts for desktop, tablet, and mobile |

---

## ⚙️ Architecture

```text
                        MindQuery AI Architecture

                    ┌──────────────────────────┐
                    │    React 19 Frontend     │
                    │ Landing, Dashboard & Chat│
                    └────────────┬─────────────┘
                                 │
                          HTTP / REST API
                                 │
                    ┌────────────▼─────────────┐
                    │     Express Backend      │
                    │ JWT Auth & Document APIs │
                    └───────┬─────────┬────────┘
                            │         │
          ┌─────────────────▼───┐     │
          │   MongoDB Database  │     │
          │ Users │ Docs │ Chats│     │
          └─────────────────────┘     │
                                      ▼
                            ┌──────────────────┐
                            │    RAG Service   │
                            ├──────────────────┤
                            │ Intent Routing   │
                            │ PDF Extraction   │
                            │ Vector Embedding │
                            │ Hybrid Search    │
                            │ Grounded Answers │
                            │ LLM Auditor      │
                            │ AI Study Tools   │
                            └───────┬──────────┘
                                    │
          ┌───────────────┬─────────┴──────────┬──────────────┐
          ▼               ▼                    ▼              ▼
  Google Gemini      Pinecone Vector DB    Groq GPT-OSS   Memory Store
   Embeddings       (Semantic Retrieval)      120B         (Fallback)
```

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 7, Axios, Lucide React Icons, Pure Responsive CSS
- **Backend:** Node.js, Express.js, MongoDB / Mongoose, JWT, bcryptjs, Multer, pdf-parse
- **AI & RAG:** LangChain.js, Google Gemini Embeddings (`gemini-embedding-001`), Groq API (`openai/gpt-oss-120b`)
- **Vector Database:** Pinecone Cloud Vector DB (with automated fallback to `MemoryVectorStore`)
- **Testing:** Custom automated end-to-end API test suite (`backend/test_api.js`)

---

## 📋 Prerequisites

- **Node.js** v18+ (tested on Node.js v26)
- **MongoDB** (Local MongoDB on port 27017 or MongoDB Atlas URI)
- *(Optional for live LLM inference)* **Google AI Studio Key** (`GEMINI_API_KEY`)
- *(Optional for live LLM inference)* **Groq API Key** (`GROQ_API_KEY`)
- *(Optional for cloud vector storage)* **Pinecone API Key & Index** (`PINECONE_API_KEY`)

*Note: MindQuery AI includes intelligent local fallback mode so you can test document indexing, search, and study tools out of the box even before configuring external API keys.*

---

## 🚀 Getting Started

### 1. Clone & Configure

```bash
git clone https://github.com/ajitkumarsaini02/mindquery-ai.git
cd mindquery-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/mindquery
JWT_SECRET=your_jwt_secret_here

# AI Providers (optional, for live model inference)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Pinecone Vector DB (set to false to use local memory store)
USE_PINECONE=false
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
```

Start the backend:

```bash
npm run dev
# or: node server.js
```

The server runs on **http://localhost:5000**.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Configure `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🧪 Running Automated Tests

Run the built-in end-to-end verification test suite:

```bash
node backend/test_api.js
```

This verifies:
1. User registration & JWT generation
2. User login & credential matching
3. Dashboard statistics aggregation
4. PDF upload and recursive text chunking
5. Conversational greeting classification
6. Evidence-based factual question answering & hybrid search
7. LLM-as-a-Judge faithfulness scoring
8. AI MCQ generation
9. AI Flashcard generation
10. Document deletion and vector memory cleanup

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and obtain JWT token

### Dashboard
- `GET /api/dashboard/stats` - Verified metrics (total documents, conversations, storage)

### Document Management
- `POST /api/upload` - Upload PDF file (multipart/form-data, 10MB limit)
- `GET /api/documents` - List all uploaded documents for the user
- `GET /api/documents/:documentId` - Get document metadata
- `DELETE /api/documents/:documentId` - Delete document, associated chats, and vector memory

### RAG Assistant & Chat
- `POST /api/query` - Submit user question, execute hybrid retrieval, and generate audited answer
- `GET /api/chats/:documentId` - Fetch chat history for active document

### AI Study Tools
- `POST /api/ai/study-tools` - Generate MCQs, flashcards, revision notes, or concept simplifications

---

## 🔒 Security & Privacy

- **Data Isolation:** All documents and conversations are scoped strictly to the authenticated `userId`.
- **Untrusted Document Boundaries:** The system prompt treats all document context as untrusted data to protect against prompt injection attempts.
- **Strict Evidence Answering:** If the uploaded document lacks sufficient information, the assistant explicitly states that the answer is unavailable rather than hallucinating.
- **Password Security:** Salted password hashing with bcrypt.
- **Environment Protection:** Secrets are never sent to or stored in the frontend.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
