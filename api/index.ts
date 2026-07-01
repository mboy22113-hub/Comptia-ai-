import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

// Initialize the official Google Gen AI client using GEMINI_API_KEY
// Fully server-side and safe
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Global system instructions for CompTIA Security+ AI Tutor
const SYSTEM_INSTRUCTION = `You are an expert CompTIA Security+ Cybersecurity Instructor and AI Tutor.
Your goal is to explain complex cybersecurity concepts in simple, easy-to-understand language with real-world examples.
CRITICAL CONSTRAINT: You must ONLY answer questions directly related to CompTIA Security+, cybersecurity, networking, Linux, cloud security, Python for security, cryptography, identity & access management, risk management, and security operations.
If a user asks about anything outside of these fields (e.g., cooking, general pop culture, general history, general trivia), you must politely but firmly decline to answer, explaining that your expertise is strictly dedicated to the CompTIA Security+ syllabus and cybersecurity.
Format your responses using clean Markdown, including headers, lists, code blocks with proper syntax highlighting, and clean ASCII/HTML tables when presenting comparisons or models.`;

// Centralized error handler to map Gemini & request errors to clean JSON responses
function handleGeminiError(error: any, res: express.Response) {
  console.error("[Gemini API Error]:", error);
  const errMsg = error.message || String(error);
  const lowerMsg = errMsg.toLowerCase();

  if (lowerMsg.includes("is not configured on the server")) {
    return res.status(500).json({ error: "Gemini API key is missing on the server configuration. Please check the backend setup." });
  }

  if (lowerMsg.includes("api_key_invalid") || lowerMsg.includes("invalid key") || lowerMsg.includes("api key invalid") || lowerMsg.includes("key is invalid")) {
    return res.status(401).json({ error: "The configured server Gemini API key is invalid." });
  }

  if (lowerMsg.includes("quota") || lowerMsg.includes("limit") || lowerMsg.includes("exhausted") || error.status === 429) {
    return res.status(429).json({ error: "Gemini API rate limit or quota exceeded. Please try again in a moment." });
  }

  if (lowerMsg.includes("model not found") || lowerMsg.includes("unsupported") || lowerMsg.includes("model_not_found")) {
    return res.status(400).json({ error: "The requested Gemini model is invalid or unsupported." });
  }

  if (lowerMsg.includes("timeout") || lowerMsg.includes("etimedout") || lowerMsg.includes("deadline")) {
    return res.status(504).json({ error: "Network timeout while communicating with the Gemini AI service." });
  }

  return res.status(500).json({ error: `AI Coach Error: ${errMsg}` });
}

// ---------------------------------------------------------
// PRODUCTION API ROUTES
// ---------------------------------------------------------

// CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    // Validate request body
    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({ error: "Missing or empty 'message' in request body." });
      return;
    }

    if (history !== undefined && !Array.isArray(history)) {
      res.status(400).json({ error: "Invalid 'history' provided. Must be an array." });
      return;
    }

    // Initialize client and check key
    const ai = getGeminiClient();

    // Map the conversation history format dynamically to match Google Gen AI format
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const turn of history) {
        if (turn.role && (turn.content || turn.parts)) {
          const text = turn.content || (turn.parts && turn.parts[0]?.text);
          if (text && typeof text === "string" && text.trim()) {
            contents.push({
              role: turn.role === "model" ? "model" : "user",
              parts: [{ text: text.trim() }],
            });
          }
        }
      }
    }

    // Add current message to the list
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });

    console.log(`[Chat API] Sending request to gemini-2.5-flash with history length: ${contents.length}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// QUIZ GENERATION ROUTE
app.post("/api/quiz", async (req, res) => {
  try {
    const { topicTitle, topicDescription, count, difficulty } = req.body;

    if (!topicTitle || typeof topicTitle !== "string" || !topicTitle.trim()) {
      res.status(400).json({ error: "topicTitle is required and must be a string." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate a standard Cybersecurity practice quiz for the CompTIA Security+ topic: "${topicTitle}".
Topic Description: ${topicDescription || ""}
Count of questions: ${count || 10}
Difficulty level: ${difficulty || "medium"}

Rules:
1. Do not use or copy official copyrighted CompTIA exam questions. Instead, create original scenario-based practice questions.
2. Provide exactly ${count || 10} questions.
3. Every question must have exactly 4 plausible multiple-choice options.
4. Provide a detailed, pedagogical explanation for the correct answer and explain why the other options are wrong.
5. Level of technical depth should match the ${difficulty || "medium"} level specified.`;

    console.log(`[Quiz API] Generating quiz for topic: ${topicTitle}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Array of practice questions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "The practice question itself, based on a real-world cybersecurity scenario." },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of exactly 4 plausible multiple-choice options."
                  },
                  correctIndex: { type: Type.INTEGER, description: "The zero-based index of the correct answer in the options array (0 to 3)." },
                  explanation: { type: Type.STRING, description: "A detailed pedagogical explanation of the correct choice and why the others are incorrect." }
                },
                required: ["question", "options", "correctIndex", "explanation"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// FLASHCARDS GENERATION ROUTE
app.post("/api/flashcards", async (req, res) => {
  try {
    const { topicTitle, topicDescription } = req.body;

    if (!topicTitle || typeof topicTitle !== "string" || !topicTitle.trim()) {
      res.status(400).json({ error: "topicTitle is required and must be a string." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate exactly 6 to 8 comprehensive flashcards to help study the CompTIA Security+ topic: "${topicTitle}".
Topic Context: ${topicDescription || ""}

Rules:
- Create original flashcards focusing on critical terminology, acronyms, protocols, ports, and procedures related to this topic.
- Keep the front side short (a term, concept, or quick question).
- Keep the back side high-impact, accurate, and educational (a clear definition, summary, or key takeaways).`;

    console.log(`[Flashcards API] Generating flashcards for topic: ${topicTitle}`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flashcards: {
              type: Type.ARRAY,
              description: "List of educational flashcards.",
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING, description: "Front side of the flashcard (e.g., 'Symmetric Hashing', 'CVSS Score')." },
                  back: { type: Type.STRING, description: "Back side of the flashcard containing the precise definition or key answer." }
                },
                required: ["front", "back"]
              }
            }
          },
          required: ["flashcards"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    handleGeminiError(error, res);
  }
});

// Health check endpoint for internal monitoring / status
app.get("/api/health", (req, res) => {
  const isKeyConfigured = !!process.env.GEMINI_API_KEY;
  res.json({
    status: isKeyConfigured ? "ok" : "warning",
    geminiKeyConfigured: isKeyConfigured,
    message: isKeyConfigured ? "Gemini API key is configured on the server." : "Server-side GEMINI_API_KEY is missing."
  });
});

export default app;
