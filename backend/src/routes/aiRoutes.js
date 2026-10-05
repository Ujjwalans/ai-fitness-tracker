import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { createPlan, latestPlan, chat } from "../controllers/aiController.js";

const router = Router();

router.post("/plan", protect, createPlan);
router.get("/plan/latest", protect, latestPlan);
router.post("/chat", protect, chat);

export default router;
