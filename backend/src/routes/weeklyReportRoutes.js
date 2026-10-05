import express from "express";
import protect from "../middleware/protect.js";
import DailyCheckin from "../models/DailyCheckin.js";
import NutritionLog from "../models/NutritionLog.js";

const router = express.Router();

/*
=========================================================
GET LOCAL DATE
=========================================================
*/

function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
=========================================================
START OF WEEK
=========================================================
*/

function getWeekStart(date) {
  const result = new Date(date);
  const day = result.getDay();

  // Monday = start of week
  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

/*
=========================================================
GET END OF WEEK
=========================================================
*/

function getWeekEnd(startDate) {
  const result = new Date(startDate);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

/*
=========================================================
MOOD SCORE
=========================================================
*/

function moodScore(mood) {
  const scores = {
    great: 5,
    good: 4,
    okay: 3,
    low: 2,
    stressed: 1,
  };

  return scores[mood] || 0;
}

/*
=========================================================
MOOD LABEL
=========================================================
*/

function moodLabel(score) {
  if (score >= 4.5) return "Great";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Okay";
  if (score >= 1.5) return "Low";

  return "Needs attention";
}

/*
=========================================================
GENERATE WELLNESS INSIGHTS
=========================================================
*/

function generateInsights({
  checkins,
  averageEnergy,
  averageSleep,
  averageWater,
  exerciseDays,
  averageMoodScore,
  weightChange,
}) {
  const insights = [];

  /*
  MOOD
  */

  if (averageMoodScore >= 4) {
    insights.push(
      "Your overall mood was positive this week. Keep maintaining the routines that support your wellbeing."
    );
  } else if (averageMoodScore >= 3) {
    insights.push(
      "Your mood was fairly balanced this week. Consistent sleep, movement and hydration may help support your routine."
    );
  } else if (averageMoodScore > 0) {
    insights.push(
      "Your mood scores were lower this week. Consider paying attention to rest, routine and activities that help you feel better."
    );
  }

  /*
  ENERGY
  */

  if (averageEnergy >= 4) {
    insights.push(
      "Your average energy level was strong this week."
    );
  } else if (averageEnergy > 0 && averageEnergy < 3) {
    insights.push(
      "Your energy levels were relatively low. Review your sleep, hydration and daily routine."
    );
  }

  /*
  SLEEP
  */

  if (averageSleep >= 4) {
    insights.push(
      "Your reported sleep quality was consistently good."
    );
  } else if (averageSleep > 0 && averageSleep < 3) {
    insights.push(
      "Sleep quality was one area that could use more attention this week."
    );
  }

  /*
  WATER
  */

  if (averageWater >= 2) {
    insights.push(
      "Your recorded water intake averaged around 2 litres or more per day."
    );
  } else if (averageWater > 0 && averageWater < 1.5) {
    insights.push(
      "Your recorded water intake was relatively low. Consider keeping water accessible throughout the day."
    );
  }

  /*
  EXERCISE
  */

  if (exerciseDays >= 5) {
    insights.push(
      "You recorded exercise on most days this week. Great consistency."
    );
  } else if (exerciseDays >= 3) {
    insights.push(
      "You recorded exercise on several days this week. Maintaining consistency can help build a sustainable routine."
    );
  } else if (checkins.length > 0) {
    insights.push(
      "Exercise was recorded on fewer days this week. Try gradually building consistent movement into your routine."
    );
  }

  /*
  WEIGHT
  */

  if (weightChange !== null) {
    if (Math.abs(weightChange) < 0.2) {
      insights.push(
        "Your recorded weight remained relatively stable during this period."
      );
    } else if (weightChange > 0) {
      insights.push(
        `Your recorded weight increased by ${weightChange.toFixed(
          1
        )} kg during this period.`
      );
    } else {
      insights.push(
        `Your recorded weight decreased by ${Math.abs(
          weightChange
        ).toFixed(1)} kg during this period.`
      );
    }
  }

  /*
  FALLBACK
  */

  if (insights.length === 0) {
    insights.push(
      "Complete more daily check-ins to receive a more useful weekly wellness summary."
    );
  }

  return insights.slice(0, 6);
}

/*
=========================================================
WEEKLY REPORT
=========================================================
*/

router.get("/weekly", protect, async (req, res, next) => {
  try {
    const today = new Date();

    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(weekStart);

    const startDate = getDateString(weekStart);
    const endDate = getDateString(weekEnd);

    /*
    =====================================================
    CHECK-INS
    =====================================================
    */

    const checkins = await DailyCheckin.find({
      userId: req.userId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ date: 1 })
      .lean();

    /*
    =====================================================
    NUTRITION
    =====================================================
    */

    const nutritionLogs = await NutritionLog.find({
      userId: req.userId,
      loggedAt: {
        $gte: weekStart,
        $lte: weekEnd,
      },
    })
      .sort({ loggedAt: 1 })
      .lean();

    /*
    =====================================================
    CHECK-IN STATISTICS
    =====================================================
    */

    const checkinCount = checkins.length;

    const energyValues = checkins
      .map((item) => Number(item.energyLevel))
      .filter((value) => value > 0);

    const sleepValues = checkins
      .map((item) => Number(item.sleepQuality))
      .filter((value) => value > 0);

    const waterValues = checkins
      .map((item) => Number(item.waterIntake))
      .filter((value) => value >= 0);

    const moodValues = checkins
      .map((item) => moodScore(item.mood))
      .filter((value) => value > 0);

    const averageEnergy =
      energyValues.length > 0
        ? energyValues.reduce((sum, value) => sum + value, 0) /
          energyValues.length
        : 0;

    const averageSleep =
      sleepValues.length > 0
        ? sleepValues.reduce((sum, value) => sum + value, 0) /
          sleepValues.length
        : 0;

    const averageWater =
      waterValues.length > 0
        ? waterValues.reduce((sum, value) => sum + value, 0) /
          waterValues.length
        : 0;

    const averageMoodScore =
      moodValues.length > 0
        ? moodValues.reduce((sum, value) => sum + value, 0) /
          moodValues.length
        : 0;

    /*
    =====================================================
    EXERCISE
    =====================================================
    */

    const exerciseDays = checkins.filter(
      (item) => item.exercised === true
    ).length;

    /*
    =====================================================
    NUTRITION TOTALS
    =====================================================
    */

    const nutritionTotals = nutritionLogs.reduce(
      (totals, item) => {
        totals.calories += Number(item.calories) || 0;
        totals.protein += Number(item.protein) || 0;
        totals.carbs += Number(item.carbs) || 0;
        totals.fats += Number(item.fats) || 0;

        return totals;
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }
    );

    /*
    =====================================================
    DAILY NUTRITION
    =====================================================
    */

    const dailyNutrition = {};

    nutritionLogs.forEach((item) => {
      const date = getDateString(new Date(item.loggedAt));

      if (!dailyNutrition[date]) {
        dailyNutrition[date] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };
      }

      dailyNutrition[date].calories += Number(item.calories) || 0;
      dailyNutrition[date].protein += Number(item.protein) || 0;
      dailyNutrition[date].carbs += Number(item.carbs) || 0;
      dailyNutrition[date].fats += Number(item.fats) || 0;
    });

    /*
    =====================================================
    DAILY CHECK-IN DATA
    =====================================================
    */

    const dailyCheckins = checkins.map((item) => ({
      date: item.date,
      mood: item.mood,
      moodScore: moodScore(item.mood),
      energyLevel: Number(item.energyLevel) || 0,
      sleepQuality: Number(item.sleepQuality) || 0,
      exercised: Boolean(item.exercised),
      waterIntake: Number(item.waterIntake) || 0,
      notes: item.notes || "",
    }));

    /*
    =====================================================
    WEIGHT DATA
    =====================================================

    We use the existing progress endpoint internally instead
    of duplicating its database/model implementation here.
    =====================================================
    */

    let weightEntries = [];

    try {
      const WeightLog =
        (await import("../models/WeightLog.js")).default;

      weightEntries = await WeightLog.find({
        userId: req.userId,
        loggedAt: {
          $gte: weekStart,
          $lte: weekEnd,
        },
      })
        .sort({ loggedAt: 1 })
        .lean();
    } catch (weightError) {
      console.log(
        "Weekly report weight model unavailable:",
        weightError.message
      );
    }

    const weights = weightEntries.map((item) => ({
      date: item.loggedAt,
      weightKg: Number(item.weightKg),
    }));

    let weightChange = null;

    if (weights.length >= 2) {
      weightChange =
        weights[weights.length - 1].weightKg -
        weights[0].weightKg;
    }

    /*
    =====================================================
    WEEK DAYS
    =====================================================
    */

    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);

      date.setDate(date.getDate() + i);

      const dateString = getDateString(date);

      const checkin = dailyCheckins.find(
        (item) => item.date === dateString
      );

      days.push({
        date: dateString,
        day: date.toLocaleDateString("en-IN", {
          weekday: "short",
        }),
        checkin: checkin || null,
        nutrition: dailyNutrition[dateString] || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        },
      });
    }

    /*
    =====================================================
    INSIGHTS
    =====================================================
    */

    const insights = generateInsights({
      checkins,
      averageEnergy,
      averageSleep,
      averageWater,
      exerciseDays,
      averageMoodScore,
      weightChange,
    });

    /*
    =====================================================
    RESPONSE
    =====================================================
    */

    return res.json({
      period: {
        start: startDate,
        end: endDate,
      },

      summary: {
        checkinsCompleted: checkinCount,
        checkinsPossible: 7,

        averageMoodScore: Number(
          averageMoodScore.toFixed(1)
        ),

        averageMood:
          averageMoodScore > 0
            ? moodLabel(averageMoodScore)
            : "No data",

        averageEnergy: Number(
          averageEnergy.toFixed(1)
        ),

        averageSleepQuality: Number(
          averageSleep.toFixed(1)
        ),

        averageWaterLitres: Number(
          averageWater.toFixed(1)
        ),

        exerciseDays,

        nutritionLogs: nutritionLogs.length,

        calories: Math.round(
          nutritionTotals.calories
        ),

        protein: Number(
          nutritionTotals.protein.toFixed(1)
        ),

        carbs: Number(
          nutritionTotals.carbs.toFixed(1)
        ),

        fats: Number(
          nutritionTotals.fats.toFixed(1)
        ),

        weightChange:
          weightChange !== null
            ? Number(weightChange.toFixed(1))
            : null,
      },

      weights,

      daily: days,

      insights,

      disclaimer:
        "This report is for general wellness tracking and does not provide medical diagnosis or treatment advice.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;