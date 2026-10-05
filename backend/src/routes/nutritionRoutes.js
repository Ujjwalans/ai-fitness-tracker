import express from "express";
import protect from "../middleware/protect.js";
import NutritionLog from "../models/NutritionLog.js";

const router = express.Router();


// =========================================
// GET TODAY'S NUTRITION LOGS
// =========================================

router.get("/", protect, async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await NutritionLog.find({
      userId: req.userId,
      loggedAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ loggedAt: -1 });

    const totals = logs.reduce(
      (total, item) => ({
        calories: total.calories + Number(item.calories || 0),
        protein: total.protein + Number(item.protein || 0),
        carbs: total.carbs + Number(item.carbs || 0),
        fats: total.fats + Number(item.fats || 0)
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      }
    );

    res.json({
      logs,
      totals
    });
  } catch (error) {
    next(error);
  }
});


// =========================================
// ADD NUTRITION LOG
// =========================================

router.post("/", protect, async (req, res, next) => {
  try {
    const {
      mealType,
      foodName,
      calories,
      protein,
      carbs,
      fats
    } = req.body;

    if (!mealType || !foodName || calories === undefined) {
      return res.status(400).json({
        message: "Meal type, food name and calories are required"
      });
    }

    const log = await NutritionLog.create({
      userId: req.userId,
      mealType,
      foodName,
      calories: Number(calories),
      protein: Number(protein || 0),
      carbs: Number(carbs || 0),
      fats: Number(fats || 0)
    });

    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});


// =========================================
// DELETE NUTRITION LOG
// =========================================

router.delete("/:id", protect, async (req, res, next) => {
  try {
    const deleted = await NutritionLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Nutrition entry not found"
      });
    }

    res.json({
      message: "Nutrition entry deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});


export default router;