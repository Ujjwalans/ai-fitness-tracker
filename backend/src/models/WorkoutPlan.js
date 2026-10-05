import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sets: {
      type: Number,
      default: null,
      min: 0,
    },

    reps: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    rest: {
      type: String,
      default: "",
      trim: true,
    },

    instructions: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
    },

    focus: {
      type: String,
      required: true,
    },

    duration: {
      type: String,
      default: "",
    },

    exercises: {
      type: [exerciseSchema],
      default: [],
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const workoutPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    goal: {
      type: String,
      enum: ["gain", "lose", "maintain"],
      required: true,
    },

    summary: {
      type: String,
      default: "",
    },

    disclaimer: {
      type: String,
      default:
        "General wellness information only. Not medical diagnosis or treatment.",
    },

    warmup: {
      type: [String],
      default: [],
    },

    weeklySchedule: {
      type: [daySchema],
      default: [],
    },

    cooldown: {
      type: [String],
      default: [],
    },

    safetyNotes: {
      type: [String],
      default: [],
    },

    generatedBy: {
      type: String,
      default: "huggingface",
    },
  },

  {
    timestamps: true,
  }
);

export default mongoose.model("WorkoutPlan", workoutPlanSchema);