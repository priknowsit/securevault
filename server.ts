import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize server-side Gemini client with recommended telemetry and options
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API endpoint for interactive interview design discussion
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Missing prompt parameter" });
        return;
      }

      if (!ai) {
        // Fallback response if API key is not configured in secrets panel yet
        res.json({ 
          text: `### SECUREVAULT AI System Architect Response (Local Simulation)
  
  The **GEMINI_API_KEY** is not yet detected in the active secrets environment. Please provide your key in **Settings > Secrets** to enable real-time conversational analysis.
  
  **Local advice regarding your query:**
  Evaluating SECUREVAULT under enterprise bounds requires managing standard operational scale.
  1. **AES-256-GCM** ensures integrity checks via MAC matching before decryption starts.
  2. **B-Tree nodes** sequences sequence sequentially matching sector blocks perfect.
  3. **Lock-Free Reads** prevents context-lock starvation on concurrent workers.
  
  *Configure your secrets key to activate fully qualified conversational reasoning.*`
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a Principal Storage Systems Architect from Google and a Senior Cryptography Engineer from Cloudflare. You designed SECUREVAULT, an enterprise high-performance encrypted storage engine. Provide deep, technically rich, concise answers regarding C++ systems engineering, cryptographic primitives, memory management, lock-free queues, B-Trees, and PostgreSQL scaling bounds. Frame answers to perfectly coach candidates during FAANG SDE interviews."
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API server thread failure:", error);
      res.status(500).json({ error: error.message || "Failed to contact Gemini API engine" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "up", environment: process.env.NODE_ENV || "development" });
  });

  // Vite static middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite standard development middleware mounting...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SECUREVAULT full-stack engine online at http://localhost:${PORT}`);
  });
}

startServer();
