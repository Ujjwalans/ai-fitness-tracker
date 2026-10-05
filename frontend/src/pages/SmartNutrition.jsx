import React, { useEffect, useState } from "react";
import api from "../api";

export default function SmartNutrition() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSuggestions() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/nutrition/suggestions");
      setData(response.data);
    } catch (err) {
      console.error("Smart nutrition error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to generate nutrition suggestions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="smart-nutrition-page">
        <div className="smart-nutrition-card loading-card">
          <div className="loading-spinner"></div>
          <h2>Analyzing your nutrition...</h2>
          <p>
            Wellness AI is looking at your profile and today's nutrition.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="smart-nutrition-page">
        <div className="smart-nutrition-card">
          <div className="nutrition-error">⚠️</div>
          <h2>Unable to load suggestions</h2>
          <p>{error}</p>
          <button className="primary" onClick={loadSuggestions}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const suggestions = data?.suggestions || {};
  const nutrition = data?.nutrition || {};
  const today = nutrition.today || {};

  return (
    <div className="smart-nutrition-page">
      {/* HEADER */}
      <div className="smart-nutrition-header">
        <div>
          <p className="eyebrow">AI-powered nutrition</p>
          <h1>Smart Nutrition Suggestions</h1>
          <p>
            Personalized food suggestions based on your wellness profile and
            today's nutrition.
          </p>
        </div>

        <button className="secondary" onClick={loadSuggestions}>
          ↻ Refresh Suggestions
        </button>
      </div>

      {/* DISCLAIMER */}
      <div className="nutrition-ai-disclaimer">
        <span>ℹ️</span>
        <p>
          These are general wellness suggestions, not medical or
          individualized clinical dietary advice.
        </p>
      </div>

      {/* NUTRITION SUMMARY */}
      <div className="nutrition-summary-grid">
        <div className="nutrition-stat-card">
          <span>🔥</span>
          <div>
            <small>Calories Today</small>
            <strong>{Math.round(today.calories || 0)} kcal</strong>
          </div>
        </div>

        <div className="nutrition-stat-card">
          <span>🥩</span>
          <div>
            <small>Protein</small>
            <strong>{Math.round(today.protein || 0)} g</strong>
          </div>
        </div>

        <div className="nutrition-stat-card">
          <span>🍚</span>
          <div>
            <small>Carbohydrates</small>
            <strong>{Math.round(today.carbs || 0)} g</strong>
          </div>
        </div>

        <div className="nutrition-stat-card">
          <span>🥑</span>
          <div>
            <small>Fats</small>
            <strong>{Math.round(today.fats || 0)} g</strong>
          </div>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="smart-nutrition-card nutrition-ai-summary">
        <div className="card-icon">🧠</div>
        <div>
          <p className="eyebrow">Wellness AI insight</p>
          <h2>Today's Recommendation</h2>
          <p>
            {suggestions.summary ||
              "Here are some suggestions based on your current nutrition."}
          </p>
        </div>
      </div>

      {/* NEXT MEAL */}
      {suggestions.nextMeal && (
        <div className="smart-nutrition-card next-meal-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Recommended next meal</p>
              <h2>🍽️ {suggestions.nextMeal.name}</h2>
            </div>
          </div>

          <p className="meal-reason">{suggestions.nextMeal.reason}</p>

          <div className="food-chip-list">
            {suggestions.nextMeal.foods?.map((food, index) => (
              <span className="food-chip" key={index}>
                ✓ {food}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SNACKS & FOODS TO CONSIDER */}
      <div className="nutrition-columns">
        <div className="smart-nutrition-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Smart choices</p>
              <h2>🍎 Snack Ideas</h2>
            </div>
          </div>

          <div className="suggestion-list">
            {suggestions.snacks?.map((snack, index) => (
              <div className="suggestion-item" key={index}>
                <div className="suggestion-number">{index + 1}</div>
                <div>
                  <strong>{snack.name}</strong>
                  <p>{snack.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="smart-nutrition-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Nutrition</p>
              <h2>🥗 Foods to Consider</h2>
            </div>
          </div>

          <div className="simple-food-list">
            {suggestions.foodsToConsider?.map((food, index) => (
              <div key={index} className="simple-food-item">
                <span>✓</span>
                <p>{food}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOODS TO LIMIT + HYDRATION */}
      <div className="nutrition-columns">
        <div className="smart-nutrition-card">
          <p className="eyebrow">Keep an eye on</p>
          <h2>⚠️ Foods to Limit</h2>

          <div className="simple-food-list">
            {suggestions.foodsToLimit?.map((food, index) => (
              <div key={index} className="simple-food-item limit-item">
                <span>•</span>
                <p>{food}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="smart-nutrition-card">
          <p className="eyebrow">Stay hydrated</p>
          <h2>💧 Hydration</h2>
          <p className="hydration-text">
            {suggestions.hydration ||
              "Drink water regularly throughout the day."}
          </p>
        </div>
      </div>

      {/* TIP */}
      <div className="smart-nutrition-card nutrition-tip-card">
        <span>💡</span>
        <div>
          <p className="eyebrow">Wellness tip</p>
          <p>
            {suggestions.tip ||
              "Focus on balanced meals and consistent eating habits."}
          </p>
        </div>
      </div>
    </div>
  );
}