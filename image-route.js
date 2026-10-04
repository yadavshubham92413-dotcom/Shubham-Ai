const fs = require("fs");
const path = require("path");
const { InferenceClient } = require("@huggingface/inference");

function setupImageRoute(app) {
  const client = new InferenceClient(process.env.HF_TOKEN);
  const outputDir = path.join(__dirname, "public", "generated");
  fs.mkdirSync(outputDir, { recursive: true });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const prompt = String(req.body.prompt || "").trim();

      if (!prompt) {
        return res.status(400).json({ error: "Image prompt required" });
      }

      const image = await client.textToImage({
        provider: "auto",
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: prompt
      });

      const filename = `image-${Date.now()}.png`;
      const filePath = path.join(outputDir, filename);

      fs.writeFileSync(
        filePath,
        Buffer.from(await image.arrayBuffer())
      );

      res.json({
        ok: true,
        url: `/generated/${filename}`
      });
    } catch (error) {
      console.error("IMAGE ERROR:", error);
      res.status(500).json({
        error: error?.message || "Image generation failed"
      });
    }
  });
}

module.exports = { setupImageRoute };
