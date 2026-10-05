import express from "express";
import protect from "../middleware/protect.js";
import DailyCheckin from "../models/DailyCheckin.js";

const router = express.Router();


// =====================================================
// GET TODAY'S CHECK-IN
// GET /api/checkin/today
// =====================================================

router.get("/today", protect, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const checkin = await DailyCheckin.findOne({
      userId: req.userId,
      date: today,
    });

    res.json(checkin || null);
  } catch (error) {
    next(error);
  }
});


// =====================================================
// CREATE / UPDATE TODAY'S CHECK-IN
// PUT /api/checkin/today
// =====================================================

router.put("/today", protect, async (req, res, next) => {
  try {
    const {
      mood,
      energyLevel,
      sleepQuality,
      exercised,
      waterIntake,
      notes,
    } = req.body;

    // Validation
    if (!mood) {
      return res.status(400).json({
        message: "Please select your mood",
      });
    }

    if (!energyLevel || !sleepQuality) {
      return res.status(400).json({
        message: "Please provide your energy and sleep ratings",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const checkin = await DailyCheckin.findOneAndUpdate(
      {
        userId: req.userId,
        date: today,
      },

      {
        userId: req.userId,
        date: today,
        mood,
        energyLevel: Number(energyLevel),
        sleepQuality: Number(sleepQuality),
        exercised: Boolean(exercised),
        waterIntake: Number(waterIntake || 0),
        notes: notes || "",
      },

      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      message: "Daily check-in saved successfully",
      checkin,
    });
  } catch (error) {
    next(error);
  }
});


// =====================================================
// GET CHECK-IN HISTORY
// GET /api/checkin/history
// =====================================================

router.get("/history", protect, async (req, res, next) => {
  try {
    const limit = Math.min(
      Number(req.query.limit) || 30,
      90
    );

    const checkins = await DailyCheckin.find({
      userId: req.userId,
    })
      .sort({ date: -1 })
      .limit(limit);

    res.json(checkins);
  } catch (error) {
    next(error);
  }
});


export default router;