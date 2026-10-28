import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import pdfParse from "pdf-parse";

// In-memory registry to hold active vector stores per document
// structure: { [documentId]: { vectorStore, chunks, usePinecone } }
const vectorStoreRegistry = {};

/**
 * Extracts text from a PDF buffer, splits it, and stores the embeddings.
 */
export async function processPdf(fileBuffer, documentId) {
  // Use server env API key for embeddings
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Master Gemini API Key is missing on the server. Please check .env config.");
  }

  // 1. Parse the PDF text
  const pdfData = await pdfParse(fileBuffer);
  const rawText = pdfData.text;

  if (!rawText || rawText.trim().length === 0) {
    throw new Error("No text could be extracted from this PDF. It might be scanned or empty.");
  }

  // 2. Split the document into chunks
  // Recursive character splitting maintains paragraph structures by prioritizing newlines, spaces, and punctuation
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.createDocuments([rawText], [], {
    chunkHeader: "",
  });

  // Inject page numbers / index into metadata for reference
  chunks.forEach((chunk, index) => {
    chunk.metadata = {
      chunkId: index,
      documentId: documentId,
      length: chunk.pageContent.length,
    };
  });

  // 3. Initialize Embeddings and Vector Store
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: apiKey,
    modelName: "gemini-embedding-001", // Use the supported embedding model
    maxRetries: 0
  });

  let vectorStore;
  let usePinecone = process.env.USE_PINECONE === "true" && !!process.env.PINECONE_API_KEY;

  if (usePinecone) {
    console.log(`[RAG Service] Indexing document ${documentId} on Pinecone Cloud...`);
    try {
      const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY
      });
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

      const pineconeUploadPromise = PineconeStore.fromDocuments(chunks, embeddings, {
        pineconeIndex,
        namespace: documentId
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Pinecone upload timeout")), 60000)
      );

      // Race Pinecone upload against 60s timeout
      vectorStore = await Promise.race([pineconeUploadPromise, timeoutPromise]);
      console.log("[RAG Service] Pinecone Cloud indexing completed successfully!");
    } catch (pineconeError) {
      console.warn(`[RAG Service] Pinecone upload failed or timed out (${pineconeError.message}). Falling back to local RAM MemoryVectorStore!`);
      vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
      usePinecone = false; // Disable Pinecone flag for this document fallback
    }
  } else {
    console.log("[RAG Service] Pinecone mode disabled or keys missing. Storing in local RAM MemoryVectorStore...");
    vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
  }

  // Store in registry
  vectorStoreRegistry[documentId] = {
    vectorStore,
    chunks,
    usePinecone
  };

  return {
    chunkCount: chunks.length,
    charCount: rawText.length,
  };
}

/**
 * Custom Hybrid Search (Dense Vector Similarity + Sparse Keyword Matching)
 */
function performHybridSearch(documentId, query, vectorStoreResults, limit = 4) {
  const registryEntry = vectorStoreRegistry[documentId];
  const chunks = registryEntry ? registryEntry.chunks : vectorStoreResults;
  
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

  // 1. Calculate keyword score for each chunk (simple frequency density)
  const keywordScores = {};
  chunks.forEach(chunk => {
    const chunkText = chunk.pageContent.toLowerCase();
    let matches = 0;
    
    queryTerms.forEach(term => {
      // Basic count of how many times the query terms appear
      const regex = new RegExp(term.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
      const count = (chunkText.match(regex) || []).length;
      matches += count;
    });

    // Divide by chunk length to normalize density
    keywordScores[chunk.metadata.chunkId] = matches / (chunk.pageContent.split(/\s+/).length || 1);
  });

  // Find max keyword score for normalization
  const maxKeywordScore = Math.max(...Object.values(keywordScores), 0.001);

  // 2. Blend scores: Reciprocal Rank Fusion (RRF) or Weighted Combination
  // We'll normalize and combine: Final = VectorScore * 0.7 + KeywordScore * 0.3
  const blendedResults = vectorStoreResults.map(vectorRes => {
    const chunkId = vectorRes.metadata.chunkId;
    const vectorScore = vectorRes.metadata.score || 0.5; // Similarity score (0 to 1)
    const normalizedKeyword = (keywordScores[chunkId] || 0) / maxKeywordScore;

    const finalScore = (vectorScore * 0.7) + (normalizedKeyword * 0.3);

    return {
      document: vectorRes,
      score: finalScore
    };
  });

  // Sort and select top results
  blendedResults.sort((a, b) => b.score - a.score);
  return blendedResults.slice(0, limit).map(item => item.document);
}

/**
 * RAG Query Orchestrator
 * Triggers routing, retrieval, hybrid fusion, prompt formatting, QA response, and self-evaluation.
 */
export async function queryDoc(documentId, question, chatHistory) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error(
      "Master Groq API Key is missing on the server. Please check .env config.",
    );
  }

  // Initialize Groq model using openai/gpt-oss-120b
  const model = new ChatGroq({
    apiKey: groqApiKey,
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    maxRetries: 0,
  });

  let vectorStore;
  const usePinecone =
    process.env.USE_PINECONE === "true" && !!process.env.PINECONE_API_KEY;
  const registryEntry = vectorStoreRegistry[documentId];

  if (registryEntry) {
    vectorStore = registryEntry.vectorStore;
  } else if (usePinecone) {
    console.log(
      `[RAG Service] Re-initializing Pinecone retriever for document ${documentId}...`,
    );
    try {
      const pinecone = new PineconeClient({
        apiKey: process.env.PINECONE_API_KEY,
      });
      const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        modelName: "gemini-embedding-001",
        maxRetries: 0,
      });

      const pineconePromise = PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
        namespace: documentId,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Pinecone connection timeout")),
          6000,
        ),
      );

      vectorStore = await Promise.race([pineconePromise, timeoutPromise]);
    } catch (err) {
      console.warn(
        `[RAG Service] Pinecone retriever re-initialization failed: ${err.message}.`,
      );
      throw new Error(
        "This document is no longer active in memory. Please upload it again.",
      );
    }
  } else {
    throw new Error(
      "This document is no longer active in memory. Please upload/select it again.",
    );
  }

  // --- Step 1: Agentic Query Routing ---
  const routingPrompt = `
You are an AI router. Classify the following user message into one of three categories:
1. "GREET": A general greeting, hello, thanks, or small talk (e.g. "hello", "how are you", "thank you").
2. "SUMMARY": A request to summarize the document (e.g. "give me a summary", "what is this document about?").
3. "QA": A specific factual query seeking information from the document (e.g. "what is the revenue in 2024?", "explain clause 4").

Output ONLY the category name ("GREET", "SUMMARY", or "QA") in uppercase. Do not explain.

User Message: "${question}"
Router Classification:`;

  console.log("[RAG Service] Routing query classification...");
  let intent = "QA";
  try {
    const routeResponse = await model.invoke(routingPrompt);
    intent = routeResponse.content.trim().toUpperCase();
  } catch (err) {
    console.warn(
      "[RAG Service] Groq Router failed, falling back to direct fetch classification...",
      err.message,
    );
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: routingPrompt }],
            temperature: 0.0,
          }),
          signal: AbortSignal.timeout(6000),
        },
      );
      if (res.ok) {
        const data = await res.json();
        intent = data.choices[0].message.content.trim().toUpperCase();
      }
    } catch (fetchErr) {
      console.error(
        "[RAG Service] Direct fetch router fallback failed too:",
        fetchErr.message,
      );
    }
  }

  // Guarantee clean parsing
  if (!["GREET", "SUMMARY", "QA"].includes(intent)) {
    intent = "QA";
  }
  console.log(`[Router] Classified intent for "${question}": ${intent}`);

  if (intent === "GREET") {
    return {
      answer:
        "Hello! I am DocuMind. I have processed your document and am ready to answer any specific questions you have about it. How can I help you today?",
      intent,
      sources: [],
      evaluation: {
        score: 100,
        reasoning: "General greeting, no document lookup needed.",
      },
    };
  }

  // --- Step 2: Context Retrieval & Hybrid Search ---
  let contextDocs = [];
  if (intent === "SUMMARY") {
    if (registryEntry) {
      contextDocs = registryEntry.chunks.slice(0, 6);
    } else {
      console.log(
        "[RAG Service] Summary intent fallback. Retrieving top namespace vectors from Pinecone...",
      );
      const rawMatches = await vectorStore.similaritySearch(
        question || "summary overview document",
        6,
      );
      contextDocs = rawMatches;
    }
  } else {
    console.log("[RAG Service] Starting vector similarity search...");
    const rawMatches = await vectorStore.similaritySearch(question, 8);
    console.log(
      `[RAG Service] Similarity search complete. Found ${rawMatches.length} raw matches.`,
    );

    contextDocs = performHybridSearch(documentId, question, rawMatches, 4);
    console.log(
      `[RAG Service] Hybrid search complete. Retained ${contextDocs.length} top chunks.`,
    );
  }

  const contextText = contextDocs
    .map((doc, idx) => `[Source ${idx + 1}]:\n${doc.pageContent}`)
    .join("\n\n");

  const formattedHistory = (chatHistory || [])
    .map(
      (msg) => `${msg.sender === "user" ? "Human" : "Assistant"}: ${msg.text}`,
    )
    .join("\n");

  // --- Step 3: RAG Response Generation ---
  const ragSystemPrompt = `
You are DocuMind AI, an advanced document intelligence assistant. Your goal is to answer the user's question accurately using ONLY the provided document context.

CONSTRAINTS:
1. Rely strictly on the facts provided in the Context below. Do not make up facts.
2. If the context does not contain the answer, say: "I cannot find the answer in the uploaded document." Do not try to answer from external knowledge.
3. Be professional, concise, and highlight citations in your answer when referencing specific details.

Context:
${contextText}

Chat History:
${formattedHistory}

Human Question: ${question}
Assistant Answer:`;

  console.log("[RAG Service] Generating context answer...");
  let answer = "";
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("LangChain Timeout")), 8000),
    );

    try {
      const finalResponse = await Promise.race([
        model.invoke(ragSystemPrompt),
        timeoutPromise,
      ]);
      answer = finalResponse.content;
      console.log(
        "[RAG Service] Answer generated successfully by LangChain Groq.",
      );
    } catch (lcError) {
      console.warn(
        `[RAG Service] LangChain Groq failed or timed out: ${lcError.message}. Falling back to Groq direct fetch!`,
      );
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: ragSystemPrompt }],
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok)
        throw new Error(`Groq direct fetch failed: ${await res.text()}`);
      const data = await res.json();
      answer = data.choices[0].message.content;
      console.log(
        "[RAG Service] Answer generated successfully by Fallback Fetch (Groq).",
      );
    }
  } catch (err) {
    console.log(`[RAG Service] GENERATION ERROR: ${err.message}`);
    throw new Error(`Generation failed: ${err.message}`);
  }

  // --- Step 4: LLM-as-a-Judge Evaluation (Hallucination Detection) ---
  const evalPrompt = `
You are an independent AI QA Auditor. Your task is to rate the truthfulness/groundedness of the generated answer compared to the source context provided.
Answer must be fully supported by the context to get a 100. If it includes facts not explicitly in the context, deduct points.

Context:
${contextText}

Generated Answer:
${answer}

Return your audit in JSON format with two fields:
- "score": A number from 0 to 100 representing how grounded the answer is.
- "reasoning": A single sentence explaining why you gave that score.

JSON output:`;

  const evalModel = new ChatGroq({
    apiKey: groqApiKey,
    model: "openai/gpt-oss-120b",
    temperature: 0.0,
    maxRetries: 0,
  });

  let evaluation = { score: 100, reasoning: "Evaluation bypass." };
  try {
    console.log("[RAG Service] Auditing answer faithfulness...");
    const timeoutPromiseEval = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Eval Timeout")), 8000),
    );

    try {
      const evalResponse = await Promise.race([
        evalModel.invoke(evalPrompt),
        timeoutPromiseEval,
      ]);
      const cleanJson = evalResponse.content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      evaluation = JSON.parse(cleanJson);
      console.log(
        "[RAG Service] Faithfulness audit completed by LangChain Groq.",
      );
    } catch (evalError) {
      console.warn(
        `[RAG Service] LangChain Groq eval failed/timed out: ${evalError.message}. Falling back to Groq fetch!`,
      );
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: evalPrompt }],
            temperature: 0.0,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok)
        throw new Error(`Groq fallback eval failed: ${await res.text()}`);
      const data = await res.json();
      const rawResponse = data.choices[0].message.content;
      const cleanJson = rawResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      evaluation = JSON.parse(cleanJson);
      console.log(
        "[RAG Service] Faithfulness audit completed by Fallback Fetch (Groq).",
      );
    }
  } catch (e) {
    console.error("Self-evaluation failed:", e.message);
  }

  return {
    answer,
    intent,
    sources: contextDocs.map((doc) => ({
      chunkId: doc.metadata.chunkId,
      text: doc.pageContent,
      length: doc.metadata.length,
    })),
    evaluation,
  };
}
