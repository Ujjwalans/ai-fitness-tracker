import mongoose from "mongoose";

const nutritionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "snack", "dinner"],
      required: true
    },

    foodName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    calories: {
      type: Number,
      required: true,
      min: 0
    },

    protein: {
      type: Number,
      default: 0,
      min: 0
    },

    carbs: {
      type: Number,
      default: 0,
      min: 0
    },

    fats: {
      type: Number,
      default: 0,
      min: 0
    },

    loggedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "NutritionLog",
  nutritionLogSchema
);