import express from "express";
import nodeFetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const fetchClient = globalThis.fetch || nodeFetch;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

function sendJsonError(res, statusCode, message) {
  return res.status(statusCode).json({ error: message });
}

async function readUpstreamError(response, fallbackMessage) {
  try {
    const text = await response.text();
    if (!text) {
      return fallbackMessage;
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && parsed.error) {
        if (typeof parsed.error === "string") {
          return parsed.error;
        }

        if (typeof parsed.error.message === "string") {
          return parsed.error.message;
        }
      }
    } catch {
      // Ignore JSON parse failure and use the plain text body instead.
    }

    return text.slice(0, 300);
  } catch {
    return fallbackMessage;
  }
}

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/health", (req, res) => {
  res.type("text/plain").send("OK");
});

app.post("/chat", async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return sendJsonError(res, 400, "Message is required");
    }

    if (!process.env.OPENAI_API_KEY) {
      return sendJsonError(res, 500, "OPENAI_API_KEY is not set");
    }

    const response = await fetchClient("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Nova Mind AI, a smart, friendly assistant. Reply naturally, clearly, and briefly. Sound warm and human, not robotic.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorMessage = await readUpstreamError(response, "Chat request failed");
      return sendJsonError(res, response.status, errorMessage);
    }

    const data = await response.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
        ? data.choices[0].message.content.trim()
        : "";

    if (!reply) {
      return sendJsonError(res, 500, "No reply received from upstream AI service");
    }

    res.json({ reply });
  } catch (error) {
    return sendJsonError(res, 500, error.message || "Chat request failed");
  }
});

app.post("/voice", async (req, res) => {
  try {
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return sendJsonError(res, 400, "Text is required");
    }

    if (!process.env.OPENAI_API_KEY) {
      return sendJsonError(res, 500, "OPENAI_API_KEY is not set");
    }

    const response = await fetchClient("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text,
        instructions: "Speak in a calm, natural, friendly tone with gentle warmth.",
      }),
    });

    if (!response.ok) {
      const errorMessage = await readUpstreamError(response, "Voice generation failed");
      return sendJsonError(res, response.status, errorMessage);
    }

    const audio = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(audio));
  } catch (error) {
    return sendJsonError(res, 500, error.message || "Voice generation failed");
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return sendJsonError(res, 400, "Invalid JSON request body");
  }

  return sendJsonError(res, 500, "Internal server error");
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error instanceof Error ? error.message : error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error instanceof Error ? error.message : error);
});

app.listen(PORT, () => {
  if (!isProduction) {
    console.log(`Nova Mind AI running on port ${PORT}`);
  }
});
