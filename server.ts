import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

declare var process: {
  env: {
    NODE_ENV?: string;
    GEMINI_API_KEY?: string;
    [key: string]: any;
  };
  cwd: () => string;
};

// Lazy initialize Google Gen AI to prevent startup crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("Warning: GEMINI_API_KEY environment variable is missing.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Deep resolver for template formatting, e.g. {{ $json.user.name }}
function compileTemplate(template: string, context: any): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expression) => {
    const cleanExpr = expression.trim();
    const parts = cleanExpr.split(".");
    
    // Pivot root variable
    // $json or any direct variable should resolve to context
    let current = context;
    const startIndex = (parts[0] === "$json" || parts[0] === "json") ? 1 : 0;
    
    for (let i = startIndex; i < parts.length; i++) {
      if (current === null || current === undefined) {
        return "";
      }
      current = current[parts[i]];
    }
    
    if (current === undefined || current === null) {
      return "";
    }
    if (typeof current === "object") {
      return JSON.stringify(current);
    }
    return String(current);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API 1: Execute Gemini AI steps from the workflow securely
  app.post("/api/execute-gemini", async (req, res) => {
    try {
      const { template, systemInstruction, inputJson, temperature } = req.body;
      
      // 1. Resolve prompt dynamic tags
      const compiledPrompt = compileTemplate(template || "", inputJson || {});
      
      // 2. Validate client
      const client = getGeminiClient();
      if (!client) {
        // Return simulated offline response if key is missing so user can still play and see full visual flow
        return res.json({
          status: "success",
          success: true,
          promptUsed: compiledPrompt,
          message: `[MOCK - No GEMINI_API_KEY configured in Secrets]
Here is a simulated response for your prompt: "${compiledPrompt}".
Please add GEMINI_API_KEY under settings to make live requests!`
        });
      }

      // 3. Request Gemini model (gemini-3.5-flash as recommended)
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: compiledPrompt,
        config: {
          systemInstruction: systemInstruction || "You are a helpful automation workflow agent.",
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        }
      });

      res.json({
        status: "success",
        success: true,
        promptUsed: compiledPrompt,
        message: response.text
      });
    } catch (error: any) {
      console.error("Gemini Route Error:", error);
      res.status(500).json({
        status: "error",
        success: false,
        error: error.message || "Failed to execute Gemini node"
      });
    }
  });

  // API 2: Standard workflow persistence server-side (simple local file fallback)
  const WORKFLOWS_FILE = path.join(process.cwd(), "workflows.json");

  // Load saved workflows
  app.get("/api/workflows", (req, res) => {
    try {
      if (fs.existsSync(WORKFLOWS_FILE)) {
        const raw = fs.readFileSync(WORKFLOWS_FILE, "utf-8");
        res.json(JSON.parse(raw));
      } else {
        res.json([]);
      }
    } catch (error) {
      res.json([]);
    }
  });

  // Save workflow
  app.post("/api/workflows", (req, res) => {
    try {
      const workflows = req.body;
      fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
