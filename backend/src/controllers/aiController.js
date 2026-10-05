import HealthProfile from "../models/HealthProfile.js";
import Plan from "../models/Plan.js";
import { generateWellnessPlan, chatWithAssistant } from "../services/llmService.js";

export async function createPlan(req, res, next) {
  try {
    const profile = await HealthProfile.findOne({ userId: req.userId });
    if (!profile?.goal || !profile?.heightCm || !profile?.weightKg) {
      return res.status(400).json({ message: "Complete your health profile first" });
    }

    const plan = await generateWellnessPlan(profile.toObject());

    const saved = await Plan.create({
      userId: req.userId,
      goal: profile.goal,
      generatedBy: process.env.LLM_PROVIDER || "mock",
      plan
    });

    res.json(saved);
  } catch (error) {
    next(error);
  }
}

export async function latestPlan(req, res, next) {
  try {
    const plan = await Plan.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(plan || null);
  } catch (error) {
    next(error);
  }
}

export async function chat(req, res, next) {
  try {
    if (!req.body.message || req.body.message.length > 2000) {
      return res.status(400).json({ message: "Message is required and must be <= 2000 characters" });
    }

    const profile = await HealthProfile.findOne({ userId: req.userId }).lean();
    const result = await chatWithAssistant(req.body.message, {
      goal: profile?.goal
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}
