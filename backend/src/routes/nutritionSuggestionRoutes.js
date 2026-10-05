import express from "express";

import protect from "../middleware/protect.js";

import {
  getNutritionSuggestions,
} from "../controllers/nutritionSuggestionController.js";

const router = express.Router();

router.get(
  "/suggestions",
  protect,
  getNutritionSuggestions
);

export default router;