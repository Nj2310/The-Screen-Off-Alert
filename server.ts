import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { AlertConfig } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialize Gemini API client securely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets workspace. Add it in AI Studio settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

app.use(express.json({ limit: "5mb" }));

// Post-Work Lock Neglect & Physical exposure assessment API
app.post("/api/assess-security", async (req, res) => {
  try {
    const configData: AlertConfig = req.body;
    if (!configData || !configData.os || !configData.environment) {
      res.status(400).json({ error: "Invalid parameters. Operating system, physical environment, and reason are required." });
      return;
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are "The Screen Off Alert" AI Cyber Defense Officer.
Your goal is to conduct realistic physical exposure evaluations of computers left unlocked or unmanaged by remote employees or office workers who step away for quick tasks like:
- Collecting a package
- Stepping into the kitchen for meal preparations
- Leaving for outdoor/indoor exercise
- Taking quick coffee/restroom breaks

Your target audience is an engineer or cybersecurity enthusiast. Give extremely precise, technically sound information.
Develop:
1. An overall risk severity grade ("Critical" | "High" | "Medium" | "Low") plus a security posture score (0 to 100, where 100 is completely safe/hardened and 0 is entirely exposed).
2. Probabilities (0-100) of a physical exfiltration breach, a shoulder-surfing screen observation, and malicious keystroke injections (e.g. BadUSB/RubberDucky).
3. A compelling, scenario-specific cybersecurity briefing detailing high-tempo physical hazards associated with their environment (e.g., in a coffee shop, co-working hub, or at home with guests/siblings/cats).
4. Realistic machine script/cmd setups to enable quick shortcuts or automated lock-on-idle timers specific to their OS (${configData.os}). Give real scripts, no placeholders!
5. A mock scenario simulation ("simulatedIntrusionPayload"). Create simulated command line scripts, retro hack terminal log lines, and attack methods based on a realistic threat actor suited to their physical environment.
6. A high-priority audible warning text to be spoken out loud immediately using TTS synthesized voice warnings. Ensure this text incorporates their specific reason: "${configData.reason}" and location: "${configData.environment}".

Crucial rules:
- Strictly output valid JSON matching responseSchema structure.
- Do NOT include any markdown code wrappers around the actual response.`;

    const userPrompt = `Carry out a physical endpoint threat vulnerability scan for the following state:
- Operating System: ${configData.os}
- Activity distraction reason: ${configData.reason} ${configData.customReason ? `(Specified as: "${configData.customReason}")` : ""}
- Estimated Unattended/Away Time: ${configData.awayTimeMinutes} minutes
- Physical Exposure Setting: ${configData.environment}
- Configured Alert Behavior style: ${configData.unattendedBehavior}`;

    // Define structural schema targets
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRiskGrade: {
              type: Type.STRING,
              description: "Must be exactly one of: 'Critical', 'High', 'Medium', 'Low'"
            },
            overallScore: {
              type: Type.INTEGER,
              description: "Overall security rating out of 100 (where 100 is lock-tight and 0 is heavily compromised)."
            },
            physicalDataBreachProbability: {
              type: Type.INTEGER,
              description: "Chance of physical exfiltration (0-100)"
            },
            shoulderSurfingRisk: {
              type: Type.INTEGER,
              description: "Chance of passive observation risks (0-100)"
            },
            maliciousActorInjectionOpportunity: {
              type: Type.INTEGER,
              description: "Chance of physical keyboard inject tools like Rubber Ducky (0-100)"
            },
            riskRationale: {
              type: Type.STRING,
              description: "Deep, paragraph-style penetration briefing detailing why this environment and time delay invites threat actors."
            },
            defenseHardeningTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable cybersecurity steps for physical hygiene specific to the scenario."
            },
            osLockInstructions: {
              type: Type.OBJECT,
              properties: {
                command: { type: Type.STRING, description: "A highly specific shell script, command prompt line, or registry quick fix to automate locking." },
                howToApply: { type: Type.STRING, description: "Short, bullet-style guide on how to configure or run this snippet." },
                shortcutKeys: { type: Type.STRING, description: "The default tactile physical locking hotkeys (e.g. Super+L, Ctrl+Shift+Power)." }
              },
              required: ["command", "howToApply", "shortcutKeys"]
            },
            simulatedIntrusionPayload: {
              type: Type.OBJECT,
              properties: {
                attackerName: { type: Type.STRING, description: "Threat actor label suited to environment, e.g. CoWorkingCreep, CuriousHouseGuest" },
                payloadDemoName: { type: Type.STRING, description: "Attack vector name, e.g., SSH Tunnel Exfiltration, Session Cookie Theft" },
                simulatedLogLines: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Realistic sequence lines replicating hacker console outputs, scripts, and logs showing immediate data compromise."
                }
              },
              required: ["attackerName", "payloadDemoName", "simulatedLogLines"]
            },
            verbalWarningText: {
              type: Type.STRING,
              description: "Spoken text notification incorporating user location and specific stepping-away reason to startle anyone nearby or remind the user to run back."
            }
          },
          required: [
            "overallRiskGrade",
            "overallScore",
            "physicalDataBreachProbability",
            "shoulderSurfingRisk",
            "maliciousActorInjectionOpportunity",
            "riskRationale",
            "defenseHardeningTips",
            "osLockInstructions",
            "simulatedIntrusionPayload",
            "verbalWarningText"
          ]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No payload returned from GenAI defensive model.");
    }

    const data = JSON.parse(responseText.trim());
    res.json(data);
  } catch (err: any) {
    console.error("AI assessment failed in back-of-house server:", err);
    res.status(500).json({ error: err?.message || "Internal server error occurred during AI analysis." });
  }
});

// Start express server with hot reload mechanism
async function bootstrapServer() {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Screen Off Alert Server reporting securely on http://localhost:${PORT}`);
  });
}

bootstrapServer().catch(err => {
  console.error("Endpoint server crash during startup initialization:", err);
});
