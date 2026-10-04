require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.static("public"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: "SHUBHAM AI" });
});

app.post("/api/chat", upload.single("file"), async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    let history = [];
    try {
      history = JSON.parse(req.body.history || "[]");
    } catch {}

    if (!message && !req.file) {
      return res.status(400).send("Message or file required");
    }

    const contents = [];

    for (const item of history.slice(-20)) {
      if (
        item &&
        (item.role === "user" || item.role === "model") &&
        typeof item.text === "string"
      ) {
        contents.push({
          role: item.role,
          parts: [{ text: item.text }]
        });
      }
    }

    const parts = [];

    parts.push({
      text: message || "Please analyze the attached file/image."
    });

    if (req.file) {
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64")
        }
      });
    }

    contents.push({
      role: "user",
      parts
    });

    const stream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents
    });

    res.status(200);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }

    res.end();

  } catch (error) {
    console.error("CHAT ERROR:", error);

    if (!res.headersSent) {
      res.status(500).send(
        "AI server error: " + (error?.message || "Unknown error")
      );
    } else {
      res.end();
    }
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SHUBHAM AI running on port ${PORT}`);
});
