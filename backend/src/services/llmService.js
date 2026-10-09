import OpenAI from "openai";

const client = new OpenAI({
   baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_KEY,
});

// KEEP THIS MODEL
const MODEL =
   process.env.LLM_MODEL || "openrouter/free";


// ======================================================
// GOAL TEXT
// ======================================================

function goalText(goal) {
  return {
    gain: "gradual weight gain",
    lose: "gradual weight loss",
    maintain: "healthy weight maintenance",
  }[goal] || "balanced wellness";
}


// ======================================================
// BUILD WELLNESS PROMPT
// ======================================================

function buildPlanPrompt(profile) {

  return `
You are a professional general wellness planning assistant.

Create a practical, personalized GENERAL WELLNESS PLAN for the user.

USER PROFILE

Age: ${profile.age}
Gender: ${profile.gender}
Height: ${profile.heightCm} cm
Weight: ${profile.weightKg} kg
Goal: ${goalText(profile.goal)}
Activity level: ${profile.activityLevel}
Diet preference: ${profile.dietPreference}
Wake time: ${profile.wakeTime || "07:00"}
Sleep time: ${profile.sleepTime || "23:00"}

Allergies:
${(profile.allergies || []).join(", ") || "None reported"}

Health conditions:
${(profile.healthConditions || []).join(", ") || "None reported"}

The user is from India.

Create a practical plan using commonly available Indian foods.

IMPORTANT:

1. Do NOT diagnose diseases.
2. Do NOT prescribe medicines.
3. Do NOT claim to cure or treat diseases.
4. Respect allergies.
5. Respect diet preference.
6. If health conditions are present, include a recommendation to consult a qualified healthcare professional.
7. Give general wellness information only.
8. Do not provide extreme calorie restriction or extreme exercise.
9. Exercise suggestions should be reasonable and beginner-friendly unless the profile indicates otherwise.

OUTPUT RULES:

Return ONLY a JSON object.

DO NOT use Markdown.

DO NOT use:
- #
- ##
- ###
- **
- *
- bullet points
- explanations outside JSON
- introductory text
- concluding text

Every string must contain plain text only.

Use exactly this structure:

{
  "summary": "Short personalized summary.",
  "disclaimer": "General wellness information only; not medical diagnosis or treatment.",
  "mealSchedule": [
    {
      "time": "07:30",
      "label": "Breakfast",
      "suggestions": [
        "Food suggestion",
        "Food suggestion",
        "Food suggestion"
      ]
    },
    {
      "time": "11:00",
      "label": "Mid-morning",
      "suggestions": [
        "Food suggestion",
        "Food suggestion"
      ]
    },
    {
      "time": "13:30",
      "label": "Lunch",
      "suggestions": [
        "Food suggestion",
        "Food suggestion",
        "Food suggestion"
      ]
    },
    {
      "time": "17:00",
      "label": "Evening snack",
      "suggestions": [
        "Food suggestion",
        "Food suggestion"
      ]
    },
    {
      "time": "20:30",
      "label": "Dinner",
      "suggestions": [
        "Food suggestion",
        "Food suggestion",
        "Food suggestion"
      ]
    }
  ],
  "exercise": [
    "Exercise suggestion",
    "Exercise suggestion",
    "Exercise suggestion"
  ],
  "foodsToLimit": [
    "Food to limit",
    "Food to limit",
    "Food to limit"
  ],
  "precautions": [
    "Safety precaution",
    "Safety precaution"
  ]
}

IMPORTANT FINAL INSTRUCTION:

Return ONLY the JSON object above.

Do not add Markdown.
Do not add commentary.
Do not add headings.
Do not add text before or after the JSON.
`;
}


// ======================================================
// CLEAN MARKDOWN FROM AI TEXT
// ======================================================

function cleanText(value) {

  if (typeof value !== "string") {
    return value;
  }

  return value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}


// ======================================================
// CLEAN COMPLETE PLAN
// ======================================================

function cleanPlan(plan) {

  if (!plan || typeof plan !== "object") {
    throw new Error("Invalid AI plan");
  }

  return {
    summary: cleanText(plan.summary || ""),

    disclaimer: cleanText(
      plan.disclaimer ||
      "General wellness information only; not medical diagnosis or treatment."
    ),

    mealSchedule: Array.isArray(plan.mealSchedule)
      ? plan.mealSchedule.map((meal) => ({
          time: cleanText(meal.time || ""),
          label: cleanText(meal.label || ""),
          suggestions: Array.isArray(meal.suggestions)
            ? meal.suggestions
                .map(cleanText)
                .filter(Boolean)
            : [],
        }))
      : [],

    exercise: Array.isArray(plan.exercise)
      ? plan.exercise.map(cleanText).filter(Boolean)
      : [],

    foodsToLimit: Array.isArray(plan.foodsToLimit)
      ? plan.foodsToLimit.map(cleanText).filter(Boolean)
      : [],

    precautions: Array.isArray(plan.precautions)
      ? plan.precautions.map(cleanText).filter(Boolean)
      : [],
  };
}


// ======================================================
// EXTRACT JSON
// ======================================================

function parseAIJson(text) {

  if (!text) {
    throw new Error("AI returned an empty response");
  }

  let cleaned = text.trim();

  // Remove Markdown code fences
  cleaned = cleaned.replace(/^```json\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");

  cleaned = cleaned.trim();

  // First attempt
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.log("Direct JSON parsing failed.");
  }

  // Try extracting JSON from surrounding text
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start !== -1 && end !== -1) {

    const jsonText = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(jsonText);
    } catch (error) {

      console.error("Could not parse extracted JSON.");

      throw new Error(
        "AI returned invalid JSON."
      );
    }
  }

  throw new Error("AI returned invalid JSON.");
}


// ======================================================
// GENERATE WELLNESS PLAN
// ======================================================

export async function generateWellnessPlan(profile) {

  if (!process.env.LLM_API_KEY) {

    console.log("HF_TOKEN not found.");
    console.log("Using mock wellness plan.");

    return generateMockPlan(profile);
  }

  try {

    console.log("========================================");
    console.log("Calling Hugging Face AI...");
    console.log("Model:", MODEL);
    console.log("========================================");

    const completion =
      await client.chat.completions.create({

        model: MODEL,

        messages: [

          {
            role: "system",
            content:
              "You are a careful general wellness assistant. Return ONLY valid JSON. Never use Markdown.",
          },

          {
            role: "user",
            content: buildPlanPrompt(profile),
          },

        ],

        temperature: 0.2,

        max_tokens: 1800,
      });


    const content =
      completion.choices?.[0]?.message?.content;


    if (!content) {
      throw new Error(
        "AI returned an empty response."
      );
    }


    console.log("AI response received.");

    console.log("----------------------------------------");
    console.log(content);
    console.log("----------------------------------------");


    const parsed =
      parseAIJson(content);


    const cleaned =
      cleanPlan(parsed);


    return cleaned;

  } catch (error) {

    console.error("");
    console.error("========================================");
    console.error("HUGGING FACE ERROR");
    console.error("========================================");

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Type:",
      error?.type
    );

    console.error("========================================");


    throw new Error(
      error?.message ||
      "Unable to generate AI wellness plan"
    );
  }
}


// ======================================================
// AI CHAT ASSISTANT
// ======================================================

export async function chatWithAssistant(
  message,
  context = {}
) {

  if (!process.env.LLM_API_KEY) {

    return {
      reply:
        `I can help with general wellness planning. ` +
        `Your current goal is ${
          context.goal || "not set"
        }.`
    };
  }


  try {

    console.log("Calling AI assistant...");


    const completion =
      await client.chat.completions.create({

        model: MODEL,

        messages: [

          {
            role: "system",

            content: `
You are a general wellness AI assistant.

You can provide general information about:

- food
- exercise
- sleep
- hydration
- healthy habits
- weight management

Do not diagnose diseases.

Do not prescribe medication.

Do not claim to treat or cure medical conditions.

If the user has a medical condition or concerning symptoms,
recommend consulting a qualified healthcare professional.

Give concise and practical answers.
`,
          },

          {
            role: "user",

            content: `
User's goal:
${context.goal || "not specified"}

User's question:
${message}
`,
          },

        ],

        temperature: 0.3,

        max_tokens: 800,
      });


    const reply =
      completion.choices?.[0]?.message?.content;


    return {

      reply:
        cleanText(
          reply ||
          "I couldn't generate a response."
        )

    };

  } catch (error) {

    console.error(
      "AI chat error:",
      error?.message
    );


    throw new Error(
      "AI assistant is temporarily unavailable"
    );
  }
}


// ======================================================
// MOCK FALLBACK
// ======================================================

function generateMockPlan(profile) {

  const vegetarian =
    profile.dietPreference === "vegetarian" ||
    profile.dietPreference === "vegan";


  return {

    summary:
      `General wellness plan focused on ${goalText(
        profile.goal
      )}.`,

    disclaimer:
      "General wellness information only; not medical diagnosis or treatment.",

    mealSchedule: [

      {
        time: profile.wakeTime || "08:00",
        label: "Breakfast",

        suggestions: vegetarian
          ? [
              "Poha with vegetables",
              "Curd or suitable plant alternative",
              "Seasonal fruit",
            ]
          : [
              "Vegetable poha or eggs with whole-grain roti",
              "Seasonal fruit",
            ],
      },

      {
        time: "11:00",
        label: "Mid-morning",

        suggestions: [
          "Seasonal fruit",
          "Roasted chana or a small portion of nuts",
        ],
      },

      {
        time: "13:30",
        label: "Lunch",

        suggestions: [
          "Roti or rice",
          "Dal or legumes",
          "Seasonal vegetables",
          "Salad",
          "Curd if suitable",
        ],
      },

      {
        time: "17:00",
        label: "Evening snack",

        suggestions: [
          "Makhana or roasted chana",
          "Fruit or unsweetened beverage",
        ],
      },

      {
        time: "20:30",
        label: "Dinner",

        suggestions: [
          "Roti or another suitable grain",
          "Vegetables",
          "Dal, paneer or another protein source",
        ],
      },

    ],

    exercise: [
      "20–40 minutes of comfortable walking",
      "2–3 weekly sessions of basic strength exercises if appropriate",
      "Include warm-up and gradual progression",
    ],

    foodsToLimit: [
      "Highly processed foods eaten frequently",
      "Sugar-sweetened beverages",
      "Excessively fried foods",
    ],

    precautions: [
      "Do not make major diet or exercise changes solely from AI output.",
      "If a health condition affects diet or exercise, consult a qualified healthcare professional.",
    ],
  };
}
/*
=========================================================
SMART NUTRITION SUGGESTIONS
=========================================================
*/

export async function generateNutritionSuggestions(context) {
  const profile = context.profile || {};
  const nutrition = context.todayNutrition || {};

  const systemPrompt = `
You are Wellness AI's Smart Nutrition Assistant.

Your job is to provide practical GENERAL nutrition
suggestions based on the user's wellness profile and
today's food intake.

IMPORTANT SAFETY RULES:

- Do not diagnose medical conditions.
- Do not prescribe medication.
- Do not recommend extreme diets.
- Do not recommend starvation or dangerous calorie restriction.
- Do not make claims that a food will cure a disease.
- If the user has a health condition, keep suggestions
  general and recommend professional dietary guidance
  when appropriate.
- Respect allergies and dietary preferences.
- Never suggest foods listed as allergies.

Prefer practical Indian foods when appropriate.

The user may be trying to:
- gain weight
- lose weight
- maintain weight

Give realistic suggestions that are easy to understand.

Return ONLY valid JSON in this format:

{
  "summary": "short personalized summary",
  "nextMeal": {
    "name": "meal name",
    "reason": "why this meal fits",
    "foods": [
      "food 1",
      "food 2",
      "food 3"
    ]
  },
  "snacks": [
    {
      "name": "snack name",
      "reason": "short reason"
    },
    {
      "name": "snack name",
      "reason": "short reason"
    }
  ],
  "hydration": "simple hydration suggestion",
  "foodsToConsider": [
    "food 1",
    "food 2",
    "food 3"
  ],
  "foodsToLimit": [
    "food 1",
    "food 2"
  ],
  "tip": "one useful nutrition tip"
}

Do not include markdown.
Do not include \`\`\`json.
`;

  const userPrompt = `
USER PROFILE
------------

Age:
${profile.age ?? "Not available"}

Gender:
${profile.gender ?? "Not available"}

Height:
${profile.heightCm ?? "Not available"} cm

Weight:
${profile.weightKg ?? "Not available"} kg

Target weight:
${profile.targetWeightKg ?? "Not specified"} kg

Goal:
${profile.goal ?? "Not available"}

Activity level:
${profile.activityLevel ?? "Not available"}

Diet preference:
${profile.dietPreference ?? "Not available"}

Wake time:
${profile.wakeTime ?? "Not available"}

Sleep time:
${profile.sleepTime ?? "Not available"}

Allergies:
${profile.allergies?.join(", ") || "None provided"}

Health conditions:
${profile.healthConditions?.join(", ") || "None provided"}


TODAY'S NUTRITION
-----------------

Calories:
${nutrition.calories ?? 0}

Protein:
${nutrition.protein ?? 0} g

Carbohydrates:
${nutrition.carbs ?? 0} g

Fats:
${nutrition.fats ?? 0} g


ESTIMATED DAILY TARGET
----------------------

Calories:
${context.calorieTarget ?? "Not available"}

Remaining calories:
${context.remainingCalories ?? "Not available"}


RECENT MEALS
------------

${
  context.recentMeals?.length
    ? context.recentMeals
        .map(
          (meal) =>
            `- ${meal.mealType}: ${meal.foodName} (${meal.calories} kcal)`
        )
        .join("\n")
    : "No meals logged today."
}


TASK
----

Suggest what the user could eat next.

Focus on:

1. Their goal.
2. Their dietary preference.
3. Their allergies.
4. Their current nutrition intake.
5. Their remaining calorie budget when available.
6. Practical Indian food options.
7. Balanced nutrition.

Do not simply repeat the user's existing meals.
`;

  const rawResponse = await askAI([
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ]);

  /*
  =======================================================
  CLEAN AI JSON
  =======================================================
  */

  let cleaned = rawResponse.trim();

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
      "Nutrition AI JSON parsing failed:",
      error
    );

    return {
      summary:
        "Here are some general nutrition suggestions based on your current profile and food intake.",

      nextMeal: {
        name: "Balanced Indian meal",

        reason:
          "Choose a meal containing a protein source, vegetables and a suitable carbohydrate source.",

        foods: [
          "Dal",
          "Roti",
          "Vegetables",
        ],
      },

      snacks: [
        {
          name: "Fruit with curd",
          reason:
            "A simple snack option with carbohydrates and protein.",
        },
        {
          name: "Roasted chana",
          reason:
            "A convenient protein-containing snack.",
        },
      ],

      hydration:
        "Continue drinking water regularly throughout the day.",

      foodsToConsider: [
        "Dal",
        "Curd",
        "Seasonal fruits",
        "Vegetables",
      ],

      foodsToLimit: [
        "Highly processed snacks",
        "Excessively sugary drinks",
      ],

      tip:
        "Aim for balanced meals rather than focusing on a single nutrient.",
    };
  }
}
// ======================================================
// GENERIC AI REQUEST HELPER
// ======================================================
async function askAI(messages, options = {}) {
  if (!process.env.LLM_API_KEY) {
    throw new Error("HF_TOKEN is not configured");
  }

  console.log("Calling AI model:", MODEL);

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages,

    // Keep reasoning low for structured JSON tasks.
    reasoning_effort: options.reasoning_effort || "low",

    temperature:
      options.temperature ?? 0.2,

    max_tokens:
      options.max_tokens ?? 3000,
  });

  const choice = completion.choices?.[0];

  if (!choice) {
    console.error(
      "AI returned no choices:",
      completion
    );

    throw new Error(
      "AI returned no choices"
    );
  }

  const message = choice.message;

  console.log(
    "AI finish reason:",
    choice.finish_reason
  );

  console.log(
    "AI message:",
    message
  );

  let content =
    message?.content;

  /*
   * Some reasoning-model/provider responses can expose
   * useful output differently, so normalize content here.
   */

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
      "========================================"
    );

    console.error(
      "AI RETURNED EMPTY CONTENT"
    );

    console.error(
      "Choice:",
      JSON.stringify(
        choice,
        null,
        2
      )
    );

    console.error(
      "========================================"
    );

    throw new Error(
      "AI returned an empty response"
    );
  }

  return content.trim();
}
// ======================================================
// AI WORKOUT PLANNER
// ======================================================

export async function generateWorkoutPlan(profile) {
  const systemPrompt = `
You are Wellness AI's general workout planning assistant.

Create a practical and beginner-friendly GENERAL FITNESS
WORKOUT PLAN based on the user's wellness profile.

IMPORTANT SAFETY RULES:

1. Do not diagnose medical conditions.
2. Do not prescribe medication.
3. Do not claim to treat or cure diseases.
4. Do not recommend dangerous or extreme exercise.
5. Do not recommend extreme calorie burning.
6. Avoid unsafe intensity.
7. Respect the user's activity level.
8. If health conditions are present, recommend consulting
   a qualified healthcare professional before starting or
   changing an exercise program.
9. Prefer simple exercises that can reasonably be performed
   at home or in a basic gym.
10. Include rest or recovery days.
11. Do not assume advanced fitness experience.
12. Give general wellness information only.

The user is from India.

Return ONLY valid JSON.

Do not use Markdown.

Use exactly this structure:

{
  "summary": "Short personalized workout summary.",
  "disclaimer": "General wellness information only; not medical diagnosis or treatment.",
  "warmup": [
    "Warm-up activity",
    "Warm-up activity",
    "Warm-up activity"
  ],
  "weeklySchedule": [
    {
      "day": "Monday",
      "focus": "Full Body",
      "duration": "30 minutes",
      "exercises": [
        {
          "name": "Bodyweight Squat",
          "sets": 3,
          "reps": "10-12",
          "duration": "",
          "rest": "60 seconds",
          "instructions": "Simple exercise instruction."
        }
      ],
      "notes": "Short recovery or technique note."
    }
  ],
  "cooldown": [
    "Cooldown activity",
    "Cooldown activity",
    "Cooldown activity"
  ],
  "safetyNotes": [
    "Safety recommendation",
    "Safety recommendation"
  ]
}

The weeklySchedule must contain exactly 7 days:

Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday

Include appropriate recovery/rest days.

For rest days, exercises can be empty.

Keep exercise volume reasonable.

Do not use Markdown or text outside the JSON object.
`;

  const userPrompt = `
USER PROFILE
------------

Age:
${profile.age ?? "Not available"}

Gender:
${profile.gender ?? "Not available"}

Height:
${profile.heightCm ?? "Not available"} cm

Weight:
${profile.weightKg ?? "Not available"} kg

Target weight:
${profile.targetWeightKg ?? "Not specified"} kg

Goal:
${goalText(profile.goal)}

Activity level:
${profile.activityLevel ?? "Not available"}

Diet preference:
${profile.dietPreference ?? "Not available"}

Wake time:
${profile.wakeTime ?? "Not available"}

Sleep time:
${profile.sleepTime ?? "Not available"}

Allergies:
${profile.allergies?.join(", ") || "None reported"}

Health conditions:
${profile.healthConditions?.join(", ") || "None reported"}

TASK
----

Create a personalized general fitness plan.

Consider:

- user's goal
- current activity level
- age
- current weight
- target weight if available
- health conditions
- gradual progression
- recovery
- beginner-friendly movements

The workout should be realistic and sustainable.

Return ONLY valid JSON.
`;

  const rawResponse = await askAI([
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userPrompt,
    },
  ]);

  let cleaned = rawResponse.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    return {
      summary:
        parsed.summary ||
        "A personalized general fitness plan based on your wellness profile.",

      disclaimer:
        parsed.disclaimer ||
        "General wellness information only; not medical diagnosis or treatment.",

      warmup: Array.isArray(parsed.warmup)
        ? parsed.warmup.filter(Boolean)
        : [],

      weeklySchedule: Array.isArray(parsed.weeklySchedule)
        ? parsed.weeklySchedule.map((day) => ({
            day: day.day || "",
            focus: day.focus || "General Fitness",
            duration: day.duration || "",
            exercises: Array.isArray(day.exercises)
              ? day.exercises.map((exercise) => ({
                  name: exercise.name || "",
                  sets: exercise.sets ?? null,
                  reps: exercise.reps || "",
                  duration: exercise.duration || "",
                  rest: exercise.rest || "",
                  instructions: exercise.instructions || "",
                }))
              : [],
            notes: day.notes || "",
          }))
        : [],

      cooldown: Array.isArray(parsed.cooldown)
        ? parsed.cooldown.filter(Boolean)
        : [],

      safetyNotes: Array.isArray(parsed.safetyNotes)
        ? parsed.safetyNotes.filter(Boolean)
        : [],
    };
  } catch (error) {
    console.error(
      "Workout AI JSON parsing failed:",
      error
    );

    throw new Error(
      "AI returned an invalid workout plan"
    );
  }
}