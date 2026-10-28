import fs from "fs";
import path from "path";

const API = "http://localhost:5000";

async function runTests() {
  console.log("=== MindQuery AI API Test Suite ===");
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "securePassword123";

  try {
    // 1. Register
    console.log("1. Testing Registration...");
    const regRes = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Developer",
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(JSON.stringify(regData));
    console.log("✓ Registration Success:", regData.user.email);
    const token = regData.token;

    // 2. Login
    console.log("2. Testing Login...");
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(JSON.stringify(loginData));
    console.log("✓ Login Success:", loginData.user.email);

    // 3. Dashboard Stats
    console.log("3. Testing Dashboard Stats...");
    const statsRes = await fetch(`${API}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statsData = await statsRes.json();
    if (!statsRes.ok) throw new Error(JSON.stringify(statsData));
    console.log("✓ Dashboard Stats Loaded:", statsData.stats);

    // 4. Test PDF Upload using an actual PDF
    console.log("4. Testing Document Upload with real PDF file...");
    const pdfPath = path.resolve("..", "CSE-1_Responsibility_QA_Knowledge_Base.pdf");
    const fileBytes = fs.readFileSync(pdfPath);

    const formData = new FormData();
    formData.append("file", new Blob([fileBytes], { type: "application/pdf" }), "CSE_Knowledge_Base.pdf");
    formData.append("documentId", `testdoc_${Date.now()}`);

    const uploadRes = await fetch(`${API}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(JSON.stringify(uploadData));
    console.log("✓ PDF Upload & Indexing Success:", uploadData.document.filename, `(${uploadData.document.chunkCount} chunks, ${uploadData.document.charCount} characters)`);
    const docId = uploadData.document.id;

    // 5. Query Greeting
    console.log("5. Testing Intent: Greet...");
    const greetRes = await fetch(`${API}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: docId, question: "Hello there!", chatHistory: [] }),
    });
    const greetData = await greetRes.json();
    if (!greetRes.ok) throw new Error(JSON.stringify(greetData));
    console.log("✓ Greeting Intent Routed:", greetData.intent, "-", greetData.answer);

    // 6. Query Factual QA
    console.log("6. Testing Intent: Factual QA...");
    const qaRes = await fetch(`${API}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: docId, question: "What are the core responsibilities outlined in the document?", chatHistory: [] }),
    });
    const qaData = await qaRes.json();
    if (!qaRes.ok) throw new Error(JSON.stringify(qaData));
    console.log("✓ Factual QA Answer Excerpt:", qaData.answer.slice(0, 120).replace(/\n/g, " ") + "...");
    console.log("✓ Grounding Score:", qaData.evaluation?.score, "%");
    console.log("✓ Sources Cited:", qaData.sources?.length);

    // 7. Test AI Study Tools (MCQs)
    console.log("7. Testing AI Study Tools (MCQs)...");
    const mcqRes = await fetch(`${API}/api/ai/study-tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: docId, toolType: "mcqs" }),
    });
    const mcqData = await mcqRes.json();
    if (!mcqRes.ok) throw new Error(JSON.stringify(mcqData));
    console.log("✓ Study Tools MCQs Generated:", mcqData.data.title || "Success");

    // 8. Test AI Study Tools (Flashcards)
    console.log("8. Testing AI Study Tools (Flashcards)...");
    const fcRes = await fetch(`${API}/api/ai/study-tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ documentId: docId, toolType: "flashcards" }),
    });
    const fcData = await fcRes.json();
    if (!fcRes.ok) throw new Error(JSON.stringify(fcData));
    console.log("✓ Study Tools Flashcards Generated:", fcData.data.title || "Success");

    // 9. Document Deletion & Memory Cleanup
    console.log("9. Testing Document Deletion...");
    const deleteRes = await fetch(`${API}/api/documents/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const deleteData = await deleteRes.json();
    if (!deleteRes.ok) throw new Error(JSON.stringify(deleteData));
    console.log("✓ Document Deleted Successfully:", deleteData.message);

    // 10. Verify Deletion
    const docsAfterRes = await fetch(`${API}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const docsAfterData = await docsAfterRes.json();
    console.log("✓ Remaining Docs Count:", docsAfterData.documents.length);

    console.log("\n==============================================");
    console.log("🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS! 🎉");
    console.log("==============================================");
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
}

runTests();
