import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goal: String,
    generatedBy: { type: String, default: "mock-llm" },
    plan: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
