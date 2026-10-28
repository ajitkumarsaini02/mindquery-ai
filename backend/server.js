import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Route imports
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import chatRoutes from "./routes/chats.js";
import dashboardRoutes from "./routes/dashboard.js";
import aiToolsRoutes from "./routes/aiTools.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mindquery";

// CORS — allow all origins in development, or specific origins in production
const isDev = process.env.NODE_ENV !== "production";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,       // Set this on Render: your Vercel URL
].filter(Boolean);

app.use(
  cors({
    // In dev mode allow all; in production use the allowlist
    origin: isDev
      ? "*"
      : (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, Postman)
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) return callback(null, true);
          callback(new Error(`CORS blocked: ${origin}`));
        },
    credentials: !isDev, // credentials only work with explicit origin, not wildcard
  })
);

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log(`MongoDB successfully connected to: ${MONGODB_URI}`))
  .catch((err) => {
    console.error("MongoDB connection failure:", err.message);
    process.exit(1);
  });

// Root check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "MindQuery AI",
    version: "2.0.0",
    description: "Agentic RAG Document Assistant API",
    database: "MongoDB",
  });
});

// Bind API Routers
app.use("/api/auth", authRoutes);
app.use("/api", documentRoutes);
app.use("/api", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiToolsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error hook:", err);
  res.status(500).json({ error: "Internal server error.", details: err.message });
});

// Launch server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`MindQuery AI Backend Server running on http://localhost:${PORT}`);
  console.log(`Active Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`====================================================`);
});
