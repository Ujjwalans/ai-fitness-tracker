import HealthProfile from "../models/HealthProfile.js";
import NutritionLog from "../models/NutritionLog.js";
import { generateNutritionSuggestions } from "../services/llmService.js";

/*
=========================================================
GET TODAY'S NUTRITION TOTALS
=========================================================
*/

async function getTodayNutrition(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const logs = await NutritionLog.find({
    userId,
    loggedAt: {
      $gte: start,
      $lt: end,
    },
  })
    .sort({ loggedAt: -1 })
    .lean();

  const totals = logs.reduce(
    (result, item) => {
      result.calories += Number(item.calories) || 0;
      result.protein += Number(item.protein) || 0;
      result.carbs += Number(item.carbs) || 0;
      result.fats += Number(item.fats) || 0;

      return result;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    }
  );

  return {
    logs,
    totals,
  };
}

/*
=========================================================
CALCULATE ESTIMATED CALORIE TARGET
=========================================================
*/

function calculateCalorieTarget(profile) {
  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);
  const age = Number(profile.age);

  if (!weight || !height || !age) {
    return null;
  }

  let bmr;

  if (profile.gender === "female") {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age -
      161;
  } else if (profile.gender === "other") {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age -
      78;
  } else {
    bmr =
      10 * weight +
      6.25 * height -
      5 * age +
      5;
  }

  const activityFactors = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };

  const factor =
    activityFactors[profile.activityLevel] ||
    1.55;

  const tdee = bmr * factor;

  let targetCalories = tdee;

  if (profile.goal === "lose") {
    targetCalories = tdee - 300;
  }

  if (profile.goal === "gain") {
    targetCalories = tdee + 300;
  }

  return Math.round(targetCalories);
}

/*
=========================================================
GET SMART NUTRITION SUGGESTIONS
=========================================================
*/

export async function getNutritionSuggestions(
  req,
  res,
  next
) {
  try {
    const profile = await HealthProfile.findOne({
      userId: req.userId,
    }).lean();

    if (!profile) {
      return res.status(400).json({
        message:
          "Complete your health profile first.",
      });
    }

    const {
      logs,
      totals,
    } = await getTodayNutrition(req.userId);

    const calorieTarget =
      calculateCalorieTarget(profile);

    const remainingCalories =
      calorieTarget !== null
        ? Math.max(
            calorieTarget - totals.calories,
            0
          )
        : null;

    const result =
      await generateNutritionSuggestions({
        profile,
        todayNutrition: totals,
        recentMeals: logs.slice(0, 10),
        calorieTarget,
        remainingCalories,
      });

    return res.json({
      suggestions: result,
      nutrition: {
        today: totals,
        calorieTarget,
        remainingCalories,
      },
    });
  } catch (error) {
    next(error);
  }
}