import express from "express";
import protect from "../middleware/protect.js";
import HealthProfile from "../models/HealthProfile.js";

const router = express.Router();


// =========================================================
// CALCULATE BMI, BMR AND TDEE
// =========================================================

function calculateMetrics(profile) {
  const weight = Number(profile.weightKg);
  const height = Number(profile.heightCm);
  const age = Number(profile.age);

  let bmi = null;
  let bmr = null;
  let tdee = null;

  // BMI
  if (weight > 0 && height > 0) {
    bmi = Number(
      (weight / Math.pow(height / 100, 2)).toFixed(1)
    );
  }

  // BMR + TDEE
  if (weight > 0 && height > 0 && age > 0) {
    if (profile.gender === "female") {
      // Mifflin-St Jeor equation
      bmr = Math.round(
        10 * weight +
        6.25 * height -
        5 * age -
        161
      );
    } else if (profile.gender === "other") {
      // Neutral estimate
      bmr = Math.round(
        10 * weight +
        6.25 * height -
        5 * age -
        78
      );
    } else {
      // Male
      bmr = Math.round(
        10 * weight +
        6.25 * height -
        5 * age +
        5
      );
    }

    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    const factor =
      activityFactors[profile.activityLevel] || 1.55;

    tdee = Math.round(bmr * factor);
  }

  return {
    bmi,
    bmr,
    tdee,
  };
}


// =========================================================
// GET HEALTH PROFILE
// GET /api/health/profile
// =========================================================

router.get("/profile", protect, async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({
      userId: req.userId,
    });

    // User has not created a profile yet
    if (!profile) {
      return res.json(null);
    }

    const calculated = calculateMetrics(profile);

    return res.json({
      ...profile.toObject(),
      calculated,
    });
  } catch (error) {
    next(error);
  }
});


// =========================================================
// CREATE / UPDATE HEALTH PROFILE
// PUT /api/health/profile
// =========================================================

router.put("/profile", protect, async (req, res, next) => {
  try {
    const {
      age,
      gender,
      heightCm,
      weightKg,
      targetWeightKg,
      goal,
      activityLevel,
      dietPreference,
      wakeTime,
      sleepTime,
      allergies,
      healthConditions,
    } = req.body;


    // -----------------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------------

    if (
      age === undefined ||
      heightCm === undefined ||
      weightKg === undefined ||
      !gender ||
      !goal ||
      !activityLevel
    ) {
      return res.status(400).json({
        message: "Please complete all required health information",
      });
    }


    // -----------------------------------------------------
    // SAVE / UPDATE PROFILE
    // -----------------------------------------------------

    const profile = await HealthProfile.findOneAndUpdate(
      {
        userId: req.userId,
      },

      {
        userId: req.userId,

        age: Number(age),

        gender,

        heightCm: Number(heightCm),

        weightKg: Number(weightKg),

        targetWeightKg:
          targetWeightKg === "" ||
          targetWeightKg === null ||
          targetWeightKg === undefined
            ? null
            : Number(targetWeightKg),

        goal,

        activityLevel,

        dietPreference: dietPreference || "vegetarian",

        wakeTime: wakeTime || "07:00",

        sleepTime: sleepTime || "23:00",

        allergies: Array.isArray(allergies)
          ? allergies
          : [],

        healthConditions: Array.isArray(healthConditions)
          ? healthConditions
          : [],
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );


    // -----------------------------------------------------
    // CALCULATED HEALTH METRICS
    // -----------------------------------------------------

    const calculated = calculateMetrics(profile);


    return res.json({
      ...profile.toObject(),
      calculated,
    });

  } catch (error) {
    next(error);
  }
});


export default router;