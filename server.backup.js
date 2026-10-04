require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "SHUBHAM AI",
    message: "Server is running"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Message is required"
      });
    }

    const contents = [
      ...history
        .filter(item =>
          item &&
          (item.role === "user" || item.role === "model") &&
          typeof item.text === "string"
        )
        .map(item => ({
          role: item.role,
          parts: [{ text: item.text }]
        })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: `
You are SHUBHAM AI.

Be friendly, natural, smart and helpful.
Understand the conversation context and follow-up questions.
Answer in the user's language when appropriate.
Use moderate emojis naturally, not excessively.
For coding questions, provide clear working code and explain important parts.
Do not pretend a feature works when it does not.
If you are uncertain about something, say so instead of inventing facts.
Keep answers useful and reasonably concise unless the user asks for detail.
        `.trim()
      }
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();

  } catch (error) {
    console.error("CHAT ERROR:", error);

    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: "AI response failed"
      });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SHUBHAM AI running on port ${PORT}`);
});
