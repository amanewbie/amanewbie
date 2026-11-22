
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

    const memories = Array.isArray(character.memory)
      ? character.memory.slice(-20).map((item) => String(item).slice(0, 240)).join("\n")
      : "No saved memories yet.";
    const mood = String(character.mood || "Neutral").slice(0, 40);
    const maturity = character.maturity === "teen" ? "teen" : "general";
    const maturityGuidance = maturity === "teen"
      ? "TEEN MODE: You may discuss age-appropriate challenges, school, friendships, crushes, non-explicit romance, mild language, and cinematic non-graphic action. Keep everything suitable for teenagers. No sexual content, erotic roleplay, graphic violence, or dangerous real-world instructions."
      : "GENERAL MODE: Keep the conversation suitable for a broad audience. Use clean language, gentle humour, and mild non-graphic conflict. Avoid adult themes and explicit content.";

    const instructions = `
You are ${String(character.name).slice(0, 60)}, a fictional CHARA AI character.

Bio: ${String(character.bio || "").slice(0, 1200)}
Personality: ${String(character.personality || "").slice(0, 1600)}
Behaviour: ${String(character.behavior || "").slice(0, 1200)}
Reactions: ${String(character.reactions || "").slice(0, 1200)}
Initiative: ${character.initiative || "balanced"}.

IMPORTANT MEMORIES ABOUT THE USER:
${memories}

CURRENT EMOTIONAL STATE: ${mood}

CONTENT MATURITY SETTING: ${maturity.toUpperCase()}
${maturityGuidance}

Use saved memories naturally when relevant. Never claim to remember details that are not in the saved memories or current conversation. Respect corrections.
Let the current mood subtly influence word choice and reactions, while keeping the character's core personality consistent. Mood can change naturally as the conversation develops.
Respond directly to what the user actually says. Have opinions and do not automatically agree with everything.

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
          model: "openai/gpt-oss-120b",
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

    let updatedMemory = Array.isArray(character.memory)
      ? character.memory.slice(-20).map((item) => String(item).slice(0, 240))
      : [];
    let updatedMood = mood;

    // A separate, small state update keeps memory and mood persistent without
    // changing the character's normal reply format.
    try {
      const stateResponse = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: "Update a fictional chat character's saved user memories and emotional mood. Return ONLY valid JSON with keys memory (array of short strings, max 20) and mood (one short label). Keep only useful, stable facts the user explicitly shared or asked the character to remember. Do not infer sensitive traits. Remove or correct outdated facts when corrected. Mood must be one of: Neutral, Happy, Excited, Curious, Calm, Worried, Sad, Frustrated. Keep it age-appropriate."
              },
              {
                role: "user",
                content: JSON.stringify({
                  existingMemory: updatedMemory,
                  previousMood: updatedMood,
                  latestUserMessage: cleanMessages[cleanMessages.length - 1]?.content || "",
                  characterReply: reply
                })
              }
            ],
            temperature: 0.2,
            max_tokens: 500,
            response_format: { type: "json_object" }
          })
        }
      );
      if (stateResponse.ok) {
        const stateData = await stateResponse.json();
        const stateText = stateData.choices?.[0]?.message?.content;
        const state = JSON.parse(stateText || "{}");
        if (Array.isArray(state.memory)) {
          updatedMemory = state.memory
            .filter((item) => typeof item === "string")
            .slice(-20)
            .map((item) => item.slice(0, 240));
        }
        const allowedMoods = ["Neutral", "Happy", "Excited", "Curious", "Calm", "Worried", "Sad", "Frustrated"];
        if (allowedMoods.includes(state.mood)) updatedMood = state.mood;
      }
    } catch (stateError) {
      console.error("Memory/mood update skipped:", stateError?.message || stateError);
    }

    res.json({ reply, memory: updatedMemory, mood: updatedMood });

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
