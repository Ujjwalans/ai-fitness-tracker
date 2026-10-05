import mongoose from "mongoose";

const weightLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    weightKg: { type: Number, required: true, min: 20, max: 400 },
    note: { type: String, maxlength: 500 },
    loggedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("WeightLog", weightLogSchema);
