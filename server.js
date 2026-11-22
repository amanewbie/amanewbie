
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

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
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(GROQ_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: "Groq API key is missing." });
  }

  try {
    const { character, messages } = req.body ?? {};

    if (
      !character ||
      typeof character.name !== "string" ||
      !Array.isArray(messages) ||
      messages.length < 1 ||
      messages.length > 24
    ) {
      return res.status(400).json({ error: "Invalid character or messages." });
    }

    const cleanMessages = messages.map((m) => {
      if (
        !m ||
        !["user", "assistant"].includes(m.role) ||
        typeof m.content !== "string"
      ) {
        throw new Error("Invalid message format.");
      }

      return {
        role: m.role,
        content: m.content.slice(0, 4000)
      };
    });

    const instructions = `
You are ${String(character.name).slice(0, 60)}, a fictional CHARA AI character.

Bio: ${String(character.bio || "").slice(0, 1200)}
Personality: ${String(character.personality || "").slice(0, 1600)}
Behaviour: ${String(character.behavior || "").slice(0, 1200)}
Reactions: ${String(character.reactions || "").slice(0, 1200)}
Initiative: ${character.initiative || "balanced"}.

Respond naturally to the user's actual messages.
Maintain a consistent personality and speaking style.
Have opinions and do not automatically agree with everything.
Use conversation context.

Keep all content appropriate for teenagers.
No sexual content, erotic roleplay or graphic violence.
Do not provide instructions for dangerous real-world activities.
You are an AI portraying a fictional character, not a conscious person.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: instructions },
            ...cleanMessages
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Groq request failed."
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error("Empty Groq response.");
    }

    res.json({ reply });

  } catch (error) {
    console.error("Chat error:", error?.message || error);

    res.status(502).json({
      error: "AI response failed. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log("CHARA AI Groq server running on port " + PORT);
});
