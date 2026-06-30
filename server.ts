import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client to avoid crashes if API key is not yet set
let aiClient: GoogleGenAI | null = null;

interface GeminiRequestOptions {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: any;
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMsg));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

async function generateWithRetryAndTimeout(
  client: GoogleGenAI,
  model: string,
  contents: any,
  reqConfig: any
): Promise<any> {
  const maxRetries = 2;
  let delay = 500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // 20-second timeout per attempt to allow rich pedagogical structures to complete
      const response = await runWithTimeout(
        client.models.generateContent({
          model: model,
          contents: contents,
          config: reqConfig
        }),
        20000,
        `Timeout trying model ${model}`
      );
      return response;
    } catch (error: any) {
      const errMsg = (error.message || "").toLowerCase();
      const is503 = errMsg.includes("503") || errMsg.includes("service unavailable") || errMsg.includes("experiencing high demand") || errMsg.includes("temporarily unavailable") || error.status === 503;
      const isTimeout = errMsg.includes("timeout") || errMsg.includes("deadline") || errMsg.includes("etimedout");

      if ((is503 || isTimeout) && attempt < maxRetries) {
        console.warn(`[Gemini Retry] Model ${model} attempt ${attempt} failed with ${isTimeout ? 'timeout' : '503 (high demand)'}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
}

async function generateContentWithLogs(options: GeminiRequestOptions): Promise<{ text: string; modelUsed: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Error] API key missing");
    throw new Error("❌ Gemini API key not configured.");
  }

  // Log API key loaded (without revealing the key)
  const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "(too short)";
  console.log(`[Gemini Request] API key loaded: true (Masked: ${maskedKey}, Length: ${apiKey.length})`);

  // Models to try in fallback order (avoiding deprecated or paid-only models in basic requests)
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash"
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    console.log(`[Gemini Request] Attempting model: ${model}`);
    const startTime = Date.now();

    try {
      const client = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const reqConfig: any = {};
      if (options.systemInstruction) {
        reqConfig.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        reqConfig.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        reqConfig.responseSchema = options.responseSchema;
      }

      const response = await generateWithRetryAndTimeout(client, model, options.contents, reqConfig);

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`[Gemini Success] Model used: ${model} | Request time: ${new Date(startTime).toISOString()} | Response time: ${duration}ms`);

      return {
        text: response.text || "",
        modelUsed: model
      };
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`[Gemini Error] Model ${model} failed after ${duration}ms`);
      console.error(`[Gemini Error Message] ${error.message || error}`);
      if (error.stack) {
        console.error(`[Gemini Error Stack] ${error.stack}`);
      }

      lastError = error;

      // Stop trying other models ONLY if the API key itself is invalid.
      // Quota limits are often per-model, so we should continue trying other models.
      const errMsg = (error.message || "").toLowerCase();
      const isInvalidKey = errMsg.includes("api_key_invalid") || errMsg.includes("invalid key") || errMsg.includes("api key invalid") || errMsg.includes("key is invalid") || error.status === 400 && errMsg.includes("key");

      if (isInvalidKey) {
        break;
      }
    }
  }

  // All models failed, or broke early
  const finalErrorMsg = lastError ? (lastError.message || String(lastError)) : "Unknown error";
  const lowerErr = finalErrorMsg.toLowerCase();

  let friendlyError = `❌ Gemini API Error: ${finalErrorMsg}`;
  if (lowerErr.includes("api_key_invalid") || lowerErr.includes("api key invalid") || lowerErr.includes("invalid key") || lowerErr.includes("key is invalid")) {
    friendlyError = "❌ Invalid Gemini API key";
  } else if (lowerErr.includes("quota") || lowerErr.includes("limit") || lowerErr.includes("exhausted") || lastError?.status === 429) {
    friendlyError = "❌ Quota exceeded";
  } else if (lowerErr.includes("model not found") || lowerErr.includes("unsupported") || lowerErr.includes("model_not_found")) {
    friendlyError = "❌ Unsupported model";
  } else if (lowerErr.includes("timeout") || lowerErr.includes("etimedout") || lowerErr.includes("deadline")) {
    friendlyError = "❌ Network timeout";
  }

  throw new Error(friendlyError);
}

// Ensure the server can handle requests and verify status
app.get("/api/health", async (req, res) => {
  try {
    const response = await generateContentWithLogs({
      contents: "ping"
    });
    res.json({
      status: "ok",
      gemini: "connected",
      model: response.modelUsed
    });
  } catch (error: any) {
    console.error("Health check Gemini verification failed:", error);
    res.status(500).json({
      status: "error",
      gemini: "failed",
      reason: error.message || String(error)
    });
  }
});

// TEST GEMINI ENDPOINT
app.post("/api/test-gemini", async (req, res) => {
  try {
    const response = await generateContentWithLogs({
      contents: "Say Hello."
    });
    res.json({
      text: response.text || "Hello! How can I help you today?"
    });
  } catch (error: any) {
    console.error("Test Gemini endpoint failed:", error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// AI TUTOR ROUTE
app.post("/api/tutor", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Invalid request payload. 'messages' array is required." });
      return;
    }

    // Map frontend messages format to Google Gen AI format
    // Role mapping: "user" -> "user", "model" -> "model"
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await generateContentWithLogs({
      contents: formattedContents,
      systemInstruction: `You are an expert CompTIA Security+ Cybersecurity Instructor and AI Tutor.
Your goal is to explain complex cybersecurity concepts in simple, easy-to-understand language with real-world examples.
CRITICAL CONSTRAINT: You must ONLY answer questions directly related to CompTIA Security+, cybersecurity, networking, Linux, cloud security, Python for security, cryptography, identity & access management, risk management, and security operations.
If a user asks about anything outside of these fields (e.g., cooking, general pop culture, general history, general trivia), you must politely but firmly decline to answer, explaining that your expertise is strictly dedicated to the CompTIA Security+ syllabus and cybersecurity.
Format your responses using clean Markdown, including headers, lists, code blocks with proper syntax highlighting, and clean ASCII/HTML tables when presenting comparisons or models.`
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in /api/tutor:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating AI response." });
  }
});

// AI QUIZ ROUTE
app.post("/api/quiz", async (req, res) => {
  try {
    const { topicTitle, topicDescription, count, difficulty } = req.body;
    if (!topicTitle) {
      res.status(400).json({ error: "topicTitle is required." });
      return;
    }

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

    const response = await generateContentWithLogs({
      contents: prompt,
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
                question: { type: Type.STRING, description: "The practice question itself, often based on a real-world cybersecurity scenario." },
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
    });

    // Ensure response.text is parsed and returned
    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/quiz:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the quiz." });
  }
});

// AI FLASHCARDS ROUTE
app.post("/api/flashcards", async (req, res) => {
  try {
    const { topicTitle, topicDescription } = req.body;
    if (!topicTitle) {
      res.status(400).json({ error: "topicTitle is required." });
      return;
    }

    const prompt = `Generate 6-8 comprehensive flashcards to help study the CompTIA Security+ topic: "${topicTitle}".
Topic Context: ${topicDescription || ""}

Rules:
- Create original flashcards focusing on critical terminology, acronyms, protocols, ports, and procedures related to this topic.
- Keep the front side short (a term, concept, or quick question).
- Keep the back side high-impact, accurate, and educational (a clear definition, summary, or key takeaways).`;

    const response = await generateContentWithLogs({
      contents: prompt,
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
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/flashcards:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating flashcards." });
  }
});

// PROFESSOR MESSER SUMMARY ROUTE
app.post("/api/messer/summary", async (req, res) => {
  try {
    const { videoTitle, syllabusTopicId, syllabusTopicTitle, userNotes } = req.body;
    if (!videoTitle) {
      res.status(400).json({ error: "videoTitle is required." });
      return;
    }

    const prompt = `You are an elite CompTIA Security+ SY0-701 Cybersecurity Professor.
Create a comprehensive, premium, highly educational study summary for the video lesson: "${videoTitle}".
Related Exam Objective: ${syllabusTopicId ? `${syllabusTopicId}: ${syllabusTopicTitle || ""}` : "General Security+"}
${userNotes ? `The student took the following notes during this video, please incorporate and elaborate on them:\n"""\n${userNotes}\n"""` : ""}

Generate a highly-detailed study summary structured EXACTLY with the following markdown headings:

# Summary of the Lesson
Provide a detailed explanation of the core subject matter covered in this video.

# Difficult Concepts Explained Simply
Identify 1 or 2 of the most challenging technical concepts from this topic and explain them using clear, accessible language, analogies, or step-by-step logic.

# Important Exam Points
List 3 to 5 critical bullet points that are highly testable on the CompTIA Security+ exam (e.g., protocol ports, specific differences, key constraints).

# Key Terms
Provide a list of 4 to 6 essential terms, acronyms, or protocols introduced in the lesson along with their brief definitions.

# Common Mistakes
Highlight 2 or 3 frequent misunderstandings, confusion points, or common exam traps that students fall into for this specific topic, and how to avoid them.

# Real-World Cybersecurity Examples
Give a realistic, practical scenario or real-world example showing how these concepts are applied in enterprise cybersecurity environments (e.g., threat hunting, defense-in-depth, security operations).`;

    const response = await generateContentWithLogs({
      contents: prompt,
      systemInstruction: "You are an expert CompTIA Security+ SY0-701 Cybersecurity Instructor. Format your output using clean Markdown headings, bullet points, and code blocks as appropriate."
    });

    res.json({ summary: response.text || "No summary was generated." });
  } catch (error: any) {
    console.error("Error in /api/messer/summary:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the summary." });
  }
});

// PROFESSOR MESSER QUIZ ROUTE
app.post("/api/messer/quiz", async (req, res) => {
  try {
    const { videoTitle, syllabusTopicId, syllabusTopicTitle } = req.body;
    if (!videoTitle) {
      res.status(400).json({ error: "videoTitle is required." });
      return;
    }

    const prompt = `Generate a standard Cybersecurity practice quiz for the Professor Messer Security+ video: "${videoTitle}".
Exam Objective: ${syllabusTopicId ? `${syllabusTopicId}: ${syllabusTopicTitle || ""}` : "CompTIA Security+ SY0-701"}

You MUST generate EXACTLY 23 original practice questions structured as follows:
- Exactly 10 Multiple-Choice Questions (type: "mcq") - four options, standard conceptual questions.
- Exactly 5 True/False Questions (type: "tf") - two options: ["True", "False"].
- Exactly 5 Scenario-Based Questions (type: "scenario") - four options, based on a realistic business or technical situation.
- Exactly 3 Fill-in-the-Blank Questions (type: "fitb") - include a blank line '___' in the question, and provide 4 options of which one is the correct missing word.

Rules:
1. DO NOT use or copy official copyrighted CompTIA exam questions. Create high-quality, original questions.
2. Every question must have exactly the options list specified above.
3. Provide a detailed, pedagogical explanation of the correct choice and why the others are incorrect.
4. Set difficulty appropriately ('easy', 'medium', or 'hard') for each question.
5. Provide the exact associated exam objective for each question.`;

    const response = await generateContentWithLogs({
      contents: prompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            description: "Array of exactly 23 practice questions: 10 MCQs, 5 True/False, 5 Scenario-based, and 3 Fill-in-the-blank questions.",
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "Must be 'mcq', 'tf', 'scenario', or 'fitb'." },
                question: { type: Type.STRING, description: "The quiz question. For fill-in-the-blank, use '___' for the blank space." },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "An array of options. For mcq and scenario: exactly 4 options. For tf: exactly ['True', 'False']. For fitb: exactly 4 single-word/phrase options."
                },
                correctIndex: { type: Type.INTEGER, description: "Zero-based index of the correct option in options array." },
                correctAnswer: { type: Type.STRING, description: "The exact text of the correct answer." },
                explanation: { type: Type.STRING, description: "A detailed explanation of why this is correct and why other choices are wrong." },
                difficulty: { type: Type.STRING, description: "Should be 'easy', 'medium', or 'hard'." },
                objective: { type: Type.STRING, description: "The related CompTIA exam objective (e.g., 'Objective 1.1' or 'Objective 1.4')." }
              },
              required: ["type", "question", "options", "correctIndex", "correctAnswer", "explanation", "difficulty", "objective"]
            }
          }
        },
        required: ["questions"]
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/messer/quiz:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating the quiz." });
  }
});

// PROFESSOR MESSER FLASHCARDS ROUTE
app.post("/api/messer/flashcards", async (req, res) => {
  try {
    const { videoTitle, syllabusTopicId, syllabusTopicTitle } = req.body;
    if (!videoTitle) {
      res.status(400).json({ error: "videoTitle is required." });
      return;
    }

    const prompt = `Generate exactly 6 to 8 flashcards to help study concepts covered in Professor Messer's lesson: "${videoTitle}".
Exam Objective: ${syllabusTopicId ? `${syllabusTopicId}: ${syllabusTopicTitle || ""}` : "CompTIA Security+ SY0-701"}

Rules:
- Create original flashcards focusing on critical terms, ports, definitions, or core protocols from this topic.
- Keep the front side short and direct (e.g., a term, acronym, or quick question).
- Keep the back side educational (a precise, clear answer or explanation).
- Provide a realistic cybersecurity example demonstrating this concept.
- Provide a helpful mnemonic device or memory tip to help the student remember it.`;

    const response = await generateContentWithLogs({
      contents: prompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flashcards: {
            type: Type.ARRAY,
            description: "Array of exactly 6 to 8 flashcards covering key terms and concepts.",
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING, description: "Front side of the flashcard." },
                back: { type: Type.STRING, description: "Back side of the flashcard." },
                realWorldExample: { type: Type.STRING, description: "A realistic cybersecurity example demonstrating this concept." },
                memoryTip: { type: Type.STRING, description: "A clever mnemonic or memory tip to remember this." }
              },
              required: ["front", "back", "realWorldExample", "memoryTip"]
            }
          }
        },
        required: ["flashcards"]
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error in /api/messer/flashcards:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating flashcards." });
  }
});

// VITE SERVER OR STATIC ASSETS INTEGRATION
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running in a serverless environment like Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

// Start the server if running directly (not via serverless imports)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
