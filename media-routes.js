const fs = require("fs");
const path = require("path");

function setupMediaRoutes(app, ai) {
  const outputDir = path.join(__dirname, "public", "generated");
  fs.mkdirSync(outputDir, { recursive: true });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const prompt = String(req.body.prompt || "").trim();

      if (!prompt) {
        return res.status(400).json({ error: "Image prompt required" });
      }

      const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-image",
        input: prompt,
        response_format: {
          type: "image",
          mime_type: "image/png",
          aspect_ratio: "1:1",
          image_size: "1K"
        }
      });

      if (!interaction.output_image?.data) {
        return res.status(500).json({
          error: "Image was not generated"
        });
      }

      const filename =
        `image-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

      fs.writeFileSync(
        path.join(outputDir, filename),
        Buffer.from(interaction.output_image.data, "base64")
      );

      res.json({
        ok: true,
        type: "image",
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

module.exports = { setupMediaRoutes };
