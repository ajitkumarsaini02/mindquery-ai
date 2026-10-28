import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  chunkCount: {
    type: Number,
    required: true
  },
  charCount: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Document", DocumentSchema);
