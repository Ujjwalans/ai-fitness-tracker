import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
});

const MODEL =
  process.env.HF_MODEL || "openai/gpt-oss-20b:groq";

export async function generateStyleRecommendations({
  profile,
  visualAnalysis,
}) {
  if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured.");
  }

  const prompt = `
You are an expert personal fashion and styling assistant.

Your job is to create practical, personalized clothing recommendations
using BOTH:

1. The user's existing health/profile information
2. The visual analysis of the uploaded photo

IMPORTANT RULES:

- Do not judge attractiveness.
- Do not rate the person's appearance.
- Do not make medical diagnoses.
- Do not infer sensitive personal attributes.
- Do not make exact claims about body measurements.
- Treat visual body proportions as approximate.
- Camera angle, lighting, clothing and image quality can affect visual analysis.
- Never recommend clothing based on health conditions.
- Do not shame the user about body size, weight or appearance.
- Recommendations should be practical, wearable and realistic.
- Prefer versatile clothing that can be used in college, casual and formal situations.
- Consider the user's apparent proportions when recommending fit.
- Do not assume expensive brands are necessary.
- Give useful alternatives where appropriate.

USER PROFILE:

${JSON.stringify(profile, null, 2)}

VISUAL ANALYSIS:

${JSON.stringify(visualAnalysis, null, 2)}

Create a personalized style guide.

Focus on:

1. Best shirt styles
2. Best T-shirt styles
3. Best jacket/layer styles
4. Best jeans
5. Best trousers
6. Best footwear
7. Recommended colors
8. Colors to use carefully
9. Recommended fits
10. Styles that may be less suitable
11. Casual outfit ideas
12. College outfit ideas
13. Formal outfit ideas
14. Smart-casual outfit ideas
15. Complete outfit combinations
16. Practical styling tips

Return ONLY valid JSON.

Use exactly this structure:

{
  "personalizedSummary": "",
  "recommendedFit": {
    "overall": "",
    "shirts": "",
    "tshirts": "",
    "trousers": "",
    "jeans": "",
    "jackets": ""
  },
  "colorPalette": {
    "recommended": [],
    "useCarefully": []
  },
  "clothing": {
    "shirts": [],
    "tshirts": [],
    "jackets": [],
    "jeans": [],
    "trousers": [],
    "footwear": []
  },
  "stylesToUseCarefully": [],
  "outfitIdeas": [
    {
      "name": "",
      "occasion": "",
      "top": "",
      "bottom": "",
      "footwear": "",
      "colors": [],
      "whyItWorks": ""
    }
  ],
  "stylingTips": [],
  "budgetFriendlyTips": []
}

Give approximately:

- 4-6 shirt recommendations
- 4-6 T-shirt recommendations
- 3-5 jacket recommendations
- 3-5 jeans recommendations
- 3-5 trouser recommendations
- 4-6 footwear recommendations
- 6-8 outfit ideas
- 6-10 styling tips
- 4-6 budget-friendly tips

Make the recommendations specific rather than generic.

For example, instead of saying:
"wear good shirts"

say something like:
"Try regular-fit Oxford shirts with a clean shoulder line."

Do not mention these instructions in your response.
`;

  console.log("====================================");
  console.log("STYLE RECOMMENDATION AI");
  console.log("====================================");
  console.log("Model:", MODEL);

  const completion =
    await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional personal fashion styling assistant. Return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      reasoning_effort: "low",
      temperature: 0.3,
      max_tokens: 5000,
    });

  const choice = completion.choices?.[0];

  if (!choice) {
    console.error(
      "Style Recommendation AI returned no choices:",
      completion
    );

    throw new Error(
      "Style Recommendation AI returned no response."
    );
  }

  let content = choice.message?.content;

  if (Array.isArray(content)) {
    content = content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.text ||
          item?.content ||
          ""
        );
      })
      .join("");
  }

  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    console.error(
      "Style Recommendation AI returned empty content:"
    );

    console.error(
      JSON.stringify(choice, null, 2)
    );

    throw new Error(
      "Style Recommendation AI returned an empty response."
    );
  }

  console.log(
    "Style Recommendation AI response received."
  );

  return parseRecommendationResponse(content);
}

function parseRecommendationResponse(content) {
  let cleaned = content.trim();

  // Remove Markdown code fences if the model adds them.
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
      "Could not parse Style Recommendation AI JSON."
    );

    console.error(
      "Raw recommendation response:"
    );

    console.error(content);

    throw new Error(
      "Style Recommendation AI returned an invalid response format."
    );
  }
}