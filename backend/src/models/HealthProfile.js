import mongoose from "mongoose";

const healthProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    age: {
      type: Number,
      required: true
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male"
    },

    heightCm: {
      type: Number,
      required: true
    },

    weightKg: {
      type: Number,
      required: true
    },
    targetWeightKg: {
  type: Number,
  default: null
},

    goal: {
      type: String,
      enum: ["gain", "lose", "maintain"],
      default: "maintain"
    },

    activityLevel: {
      type: String,
      enum: ["sedentary", "light", "moderate", "very_active"],
      default: "moderate"
    },

    dietPreference: {
      type: String,
      enum: [
        "vegetarian",
        "eggetarian",
        "non_vegetarian",
        "vegan"
      ],
      default: "vegetarian"
    },

    wakeTime: {
      type: String,
      default: "07:00"
    },

    sleepTime: {
      type: String,
      default: "23:00"
    },

    allergies: {
      type: [String],
      default: []
    },

    healthConditions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "HealthProfile",
  healthProfileSchema
);