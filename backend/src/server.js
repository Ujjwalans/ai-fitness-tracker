import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import nutritionRoutes from "./routes/nutritionRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import weeklyReportRoutes from "./routes/weeklyReportRoutes.js";
import nutritionSuggestionRoutes from "./routes/nutritionSuggestionRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js";
import styleAdvisorRoutes from "./routes/styleAdvisorRoutes.js";
const app = express();
const PORT = process.env.PORT || 5000;

await connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-fitness-tracker-n8gd.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header
      // (useful for direct/server-to-server requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/reports", weeklyReportRoutes);
app.use("/api/nutrition",nutritionSuggestionRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/style", styleAdvisorRoutes);
app.use("/api/ai", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }), aiRoutes);
app.get("/", (req, res) => {
  res.json({ message: "AI Health & Wellness API is running" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error"
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
