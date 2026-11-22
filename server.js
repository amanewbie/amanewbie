
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Allow CHARA AI frontend to communicate with this server.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "120kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public(1)-1.html"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(client) });
});

app.post("/api/chat", async (req, res) => {
  if (!client) {
    return res.status(503).json({ error: "API key is not configured." });
  }

  try {
    const { character, messages } = req.body ?? {};

    if (!character || typeof character.name !== "string" ||
        !Array.isArray(messages) || messages.length < 1 ||
        messages.length > 24) {
      return res.status(400).json({ error: "Invalid character or messages." });
    }

    const cleanMessages = messages.map(m => {
      if (!m || !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string") {
        throw new Error("Invalid message format.");
      }
      return { role: m.role, content: m.content.slice(0, 4000) };
    });

    const instructions = `
You are ${String(character.name).slice(0,60)}, a fictional CHARA AI character.
Bio: ${String(character.bio || "").slice(0,1200)}
Personality: ${String(character.personality || "").slice(0,1600)}
Behaviour: ${String(character.behavior || "").slice(0,1200)}
Reactions: ${String(character.reactions || "").slice(0,1200)}

Respond to the user's actual message and use conversation context.
Maintain a consistent personality, opinions and speaking style.
Do not agree with everything automatically.
Remember details from this conversation.
Initiative: ${character.initiative || "balanced"}.

Keep all content appropriate for teenagers.
No sexual content, erotic roleplay or graphic violence.
Do not provide instructions for dangerous real-world activities.
You are an AI portraying a fictional character, not a conscious person.
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      instructions,
      input: cleanMessages
    });

    const reply = response.output_text?.trim();
    if (!reply) throw new Error("Empty AI response.");

    res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error?.message || error);
    res.status(502).json({ error: "AI response failed. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log("CHARA AI server running on port " + PORT);
});
