import fs from "fs/promises";
import OpenAI from "openai";

const visionClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

const VISION_MODEL =
  process.env.STYLE_VISION_MODEL || "zai-org/GLM-4.5V";

function getMimeType(filePath) {
  const extension = filePath.toLowerCase().split(".").pop();

  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  return mimeTypes[extension] || "image/jpeg";
}

export async function analyzeStyleImage(filePath) {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured.");
  }

  console.log("Starting Style Vision Analysis...");
  console.log("Vision model:", VISION_MODEL);

  const imageBuffer = await fs.readFile(filePath);

  const mimeType = getMimeType(filePath);

  const base64Image = imageBuffer.toString("base64");

  const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

  const prompt = `
You are a professional AI fashion and personal styling assistant.

Analyze the uploaded full-body photo for fashion guidance.

IMPORTANT:
- Do not judge attractiveness.
- Do not make medical or health diagnoses.
- Do not infer sensitive personal attributes.
- Do not make exact claims about body measurements.
- Camera angle, lighting, clothing and image quality can make visual estimates uncertain.
- Describe only visible and reasonably inferable styling factors.
- If something cannot be determined reliably, say "uncertain".

Analyze these areas:

1. Visible body proportions
2. Apparent overall proportions useful for clothing selection
3. Clothing currently being worn
4. Visible clothing fit
5. Approximate apparent height/proportion impression
6. Visible color characteristics that may help clothing selection
7. Existing style/vibe
8. Clothing styles that could complement the visible proportions
9. Colors that may work well
10. Clothing styles that may be less suitable
11. Suitable shirt/T-shirt styles
12. Suitable jacket/layer styles
13. Suitable jeans/trouser styles
14. Suitable footwear
15. Complete outfit ideas

Return ONLY valid JSON.

Use exactly this structure:

{
  "visualSummary": "",
  "confidence": "high | medium | low",
  "visibleProportions": {
    "overall": "",
    "upperBody": "",
    "lowerBody": "",
    "heightProportion": ""
  },
  "currentStyle": {
    "description": "",
    "fit": "",
    "colors": []
  },
  "recommendedColors": [],
  "colorsToUseLessOften": [],
  "clothingRecommendations": {
    "shirts": [],
    "tshirts": [],
    "jackets": [],
    "trousers": [],
    "jeans": [],
    "footwear": []
  },
  "stylesToAvoidOrUseCarefully": [],
  "outfitIdeas": [
    {
      "name": "",
      "occasion": "",
      "top": "",
      "bottom": "",
      "footwear": "",
      "colors": []
    }
  ],
  "stylingTips": []
}
`;

  const completion =
    await visionClient.chat.completions.create({
      model: VISION_MODEL,

      messages: [
        {
          role: "user",

          content: [
            {
              type: "text",
              text: prompt,
            },

            {
              type: "image_url",

              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],

      temperature: 0.2,

      max_tokens: 3000,
    });

  const choice = completion.choices?.[0];

  if (!choice) {
    console.error(
      "Vision AI returned no choices:",
      completion
    );

    throw new Error(
      "Vision AI returned no response."
    );
  }

  let content = choice.message?.content;

  if (Array.isArray(content)) {
    content = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return item?.text || item?.content || "";
      })
      .join("");
  }

  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    console.error(
      "Vision AI returned empty content:"
    );

    console.error(
      JSON.stringify(
        choice,
        null,
        2
      )
    );

    throw new Error(
      "Vision AI returned an empty response."
    );
  }

  console.log(
    "Vision AI raw response received."
  );

  return parseVisionResponse(content);
}

function parseVisionResponse(content) {
  let cleaned = content.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(
      "Could not parse Vision AI JSON."
    );

    console.error(
      "Raw Vision AI response:"
    );

    console.error(content);

    throw new Error(
      "Vision AI returned an invalid response format."
    );
  }
}