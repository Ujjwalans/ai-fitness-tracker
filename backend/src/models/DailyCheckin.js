import mongoose from "mongoose";

const dailyCheckinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
    },

    mood: {
      type: String,
      enum: ["great", "good", "okay", "low", "stressed"],
      required: true,
    },

    energyLevel: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    sleepQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    exercised: {
      type: Boolean,
      default: false,
    },

    waterIntake: {
      type: Number,
      min: 0,
      default: 0,
    },

    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// One check-in per user per day
dailyCheckinSchema.index(
  { userId: 1, date: 1 },
  { unique: true }
);

export default mongoose.model(
  "DailyCheckin",
  dailyCheckinSchema
);