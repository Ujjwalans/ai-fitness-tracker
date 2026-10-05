import HealthProfile from "../models/HealthProfile.js";

function calculateBMI(weight, height) {
  const heightInMeters = height / 100;

  return weight / (heightInMeters * heightInMeters);
}

function calculateBMR(weight, height, age, gender) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }

  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // Neutral estimate for "other"
  return 10 * weight + 6.25 * height - 5 * age - 78;
}

function getActivityMultiplier(activityLevel) {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return multipliers[activityLevel] || 1.2;
}

export async function getProfile(req, res, next) {
  try {
    const profile = await HealthProfile.findOne({
      user: req.userId,
    });

    if (!profile) {
      return res.status(404).json({
        message: "Health profile not found",
      });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
}

export async function saveProfile(req, res, next) {
  try {
    const {
      goal,
      height,
      weight,
      age,
      gender,
      activityLevel,
      dietPreference,
      conditions,
      allergies,
    } = req.body;

    if (
      !goal ||
      !height ||
      !weight ||
      !age ||
      !gender ||
      !activityLevel
    ) {
      return res.status(400).json({
        message: "Please complete all required health information",
      });
    }

    const bmi = calculateBMI(
      Number(weight),
      Number(height)
    );

    const bmr = calculateBMR(
      Number(weight),
      Number(height),
      Number(age),
      gender
    );

    const tdee =
      bmr * getActivityMultiplier(activityLevel);

    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.userId },
      {
        user: req.userId,
        goal,
        height: Number(height),
        weight: Number(weight),
        age: Number(age),
        gender,
        activityLevel,
        dietPreference,
        conditions: conditions || [],
        allergies: allergies || [],
        bmi: Number(bmi.toFixed(2)),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      message: "Health profile saved successfully",
      profile,
    });
  } catch (error) {
    next(error);
  }
}