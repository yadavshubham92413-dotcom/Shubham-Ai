require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "Hello SHUBHAM AI! Reply in one short friendly sentence."
  });

  console.log(response.text);
}

main().catch(err => console.error("ERROR:", err.message));
