import express from "express";

import protect from "../middleware/protect.js";

import {
  createWorkoutPlan,
  getLatestWorkout,
} from "../controllers/workoutController.js";

const router = express.Router();


// Generate a new AI workout
router.post(
  "/plan",
  protect,
  createWorkoutPlan
);


// Get latest saved workout
router.get(
  "/plan/latest",
  protect,
  getLatestWorkout
);


export default router;