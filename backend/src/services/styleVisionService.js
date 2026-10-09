
import fs from "fs/promises";
import OpenAI from "openai";

const visionClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_KEY,
});

const VISION_MODEL =
  process.env.STYLE_VISION_MODEL ||
  "google/gemma-4-26b-a4b-it:free";

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
  if (!process.env.LLM_API_KEY) {
    throw new Error("LLM_API_KEY is not configured.");
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

Return ONLY valid JSON. Do not use Markdown fences or explanatory text.

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

  try {
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
      throw new Error("Vision AI returned no response.");
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

    if (typeof content !== "string" || !content.trim()) {
      console.error("Vision AI returned empty content:", choice);

      throw new Error("Vision AI returned an empty response.");
    }

    console.log("Vision AI raw response received.");

    return parseVisionResponse(content);
  } catch (error) {
    console.error("Style vision request failed:", {
      status: error.status,
      message: error.message,
      model: VISION_MODEL,
    });

    // Keep useful diagnostic information for the controller,
    // without exposing the API key or full request payload.
    if (error.status === 400) {
      throw new Error(
        `Vision model request rejected (400). Check STYLE_VISION_MODEL and image input support. Details: ${error.message}`
      );
    }

    if (error.status === 401 || error.status === 403) {
      throw new Error(
        `OpenRouter authentication or permission error (${error.status}). Check LLM_API_KEY and model access.`
      );
    }

    if (error.status === 429) {
      throw new Error(
        "Vision model rate limit or quota exceeded. Try again later or check your OpenRouter limits."
      );
    }

    throw error;
  }
}

function parseVisionResponse(content) {
  let cleaned = content.trim();

  // Remove optional Markdown code fences.
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Handle models that include extra text around the JSON object.
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("Expected a JSON object.");
    }

    return parsed;
  } catch (error) {
    console.error("Could not parse Vision AI JSON:", error.message);
    console.error("Raw Vision AI response:", content);

    throw new Error(
      "Vision AI returned an invalid response format. Please try again."
    );
  }
}
