import HealthProfile from "../models/HealthProfile.js";
import WorkoutPlan from "../models/WorkoutPlan.js";
import { generateWorkoutPlan } from "../services/llmService.js";


// ======================================================
// GENERATE WORKOUT
// ======================================================

export async function createWorkoutPlan(req, res, next) {
  try {
    const profile = await HealthProfile.findOne({
      userId: req.userId,
    }).lean();

    if (
      !profile ||
      !profile.age ||
      !profile.heightCm ||
      !profile.weightKg ||
      !profile.goal
    ) {
      return res.status(400).json({
        message:
          "Please complete your health profile first.",
      });
    }

    const workout =
      await generateWorkoutPlan(profile);

    const savedPlan =
      await WorkoutPlan.create({
        userId: req.userId,
        goal: profile.goal,
        summary: workout.summary,
        disclaimer: workout.disclaimer,
        warmup: workout.warmup,
        weeklySchedule:
          workout.weeklySchedule,
        cooldown: workout.cooldown,
        safetyNotes:
          workout.safetyNotes,
        generatedBy:
          process.env.LLM_PROVIDER || "huggingface",
      });

    return res.json(savedPlan);
  } catch (error) {
    next(error);
  }
}


// ======================================================
// GET LATEST WORKOUT
// ======================================================

export async function getLatestWorkout(
  req,
  res,
  next
) {
  try {
    const workout =
      await WorkoutPlan.findOne({
        userId: req.userId,
      }).sort({
        createdAt: -1,
      });

    return res.json(workout || null);
  } catch (error) {
    next(error);
  }
}