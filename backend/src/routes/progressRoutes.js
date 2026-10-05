import { Router } from "express";
import protect from "../middleware/authMiddleware.js";
import { addWeight, getWeights } from "../controllers/progressController.js";

const router = Router();

router.get("/weight", protect, getWeights);
router.post("/weight", protect, addWeight);

export default router;
