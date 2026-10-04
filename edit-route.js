const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { InferenceClient } = require("@huggingface/inference");

function setupEditRoute(app) {
  const hf = new InferenceClient(process.env.HF_TOKEN);

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
  });

  const outputDir = path.join(__dirname, "public", "generated");
  fs.mkdirSync(outputDir, { recursive: true });

  app.post("/api/edit-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Image required" });
      }

      const prompt = String(req.body.prompt || "Enhance this image naturally").trim();

      const result = await hf.imageToImage({
        inputs: new Blob([req.file.buffer], { type: req.file.mimetype }),
        parameters: {
          prompt
        },
        model: "black-forest-labs/FLUX.1-Kontext-dev"
      });

      const filename = `edit-${Date.now()}.png`;

      fs.writeFileSync(
        path.join(outputDir, filename),
        Buffer.from(await result.arrayBuffer())
      );

      res.json({
        ok: true,
        url: `/generated/${filename}`
      });
    } catch (error) {
      console.error("EDIT IMAGE ERROR:", error);
      res.status(500).json({
        error: error?.message || "Image editing failed"
      });
    }
  });
}

module.exports = { setupEditRoute };
