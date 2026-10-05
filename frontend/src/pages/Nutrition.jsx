import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

function Nutrition() {
  const [logs, setLogs] = useState([]);
  const [totals, setTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [form, setForm] = useState({
    mealType: "breakfast",
    foodName: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedMeal, setSelectedMeal] = useState("all");
  const navigate = useNavigate();

  const loadNutrition = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/nutrition");

      setLogs(response.data.logs || []);

      setTotals({
        calories: response.data.totals?.calories || 0,
        protein: response.data.totals?.protein || 0,
        carbs: response.data.totals?.carbs || 0,
        fats: response.data.totals?.fats || 0,
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Unable to load today's nutrition data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNutrition();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.foodName.trim()) {
      setError("Please enter the food name.");
      return;
    }

    if (!form.calories || Number(form.calories) < 0) {
      setError("Please enter valid calories.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/nutrition", {
        mealType: form.mealType,
        foodName: form.foodName.trim(),
        calories: Number(form.calories),
        protein: form.protein ? Number(form.protein) : 0,
        carbs: form.carbs ? Number(form.carbs) : 0,
        fats: form.fats ? Number(form.fats) : 0,
      });

      setForm({
        mealType: "breakfast",
        foodName: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
      });

      setSuccess("Meal added successfully.");

      await loadNutrition();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to save the meal. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this meal?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(`/nutrition/${id}`);

      await loadNutrition();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message || "Unable to delete this meal."
      );
    }
  };

  const filteredLogs = useMemo(() => {
    if (selectedMeal === "all") {
      return logs;
    }

    return logs.filter((log) => log.mealType === selectedMeal);
  }, [logs, selectedMeal]);

  const mealLabel = (mealType) => {
    const labels = {
      breakfast: "Breakfast",
      lunch: "Lunch",
      snack: "Snack",
      dinner: "Dinner",
    };

    return labels[mealType] || mealType;
  };

  const mealIcon = (mealType) => {
    const icons = {
      breakfast: "🍳",
      lunch: "🍛",
      snack: "🍎",
      dinner: "🥗",
    };

    return icons[mealType] || "🍽️";
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const caloriesPercentage = Math.min(
    Math.round((totals.calories / 2500) * 100),
    100
  );

  return (
    <div className="nutrition-page">
      <div className="nutrition-header">
        <div>
          <span className="nutrition-eyebrow">DAILY WELLNESS</span>

          <h1>Nutrition Tracker</h1>

          <p>
            Track your meals and understand your daily nutrition at a glance.
          </p>
        </div>
        <div className="nutrition-actions">
          <button
            type="button"
            className="primary"
            onClick={() => navigate("/smart-nutrition")}
          >
            🧠 Get Smart Suggestions
          </button>
        </div>

        <div className="nutrition-date">
          <span>Today</span>
          <strong>
            {new Date().toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </strong>
        </div>
      </div>

      {error && (
        <div className="nutrition-alert nutrition-error">⚠️ {error}</div>
      )}

      {success && (
        <div className="nutrition-alert nutrition-success">✓ {success}</div>
      )}

      <section className="nutrition-summary">
        <div className="nutrition-summary-card calories-card">
          <div className="summary-icon">🔥</div>

          <div>
            <span>Calories</span>
            <strong>{Math.round(totals.calories)}</strong>
            <small>kcal today</small>
          </div>
        </div>

        <div className="nutrition-summary-card">
          <div className="summary-icon">💪</div>

          <div>
            <span>Protein</span>
            <strong>{Math.round(totals.protein)}g</strong>
            <small>today</small>
          </div>
        </div>

        <div className="nutrition-summary-card">
          <div className="summary-icon">🌾</div>

          <div>
            <span>Carbs</span>
            <strong>{Math.round(totals.carbs)}g</strong>
            <small>today</small>
          </div>
        </div>

        <div className="nutrition-summary-card">
          <div className="summary-icon">🥑</div>

          <div>
            <span>Fats</span>
            <strong>{Math.round(totals.fats)}g</strong>
            <small>today</small>
          </div>
        </div>
      </section>

      <section className="nutrition-main-grid">
        <div className="nutrition-form-card">
          <div className="section-heading">
            <div>
              <h2>Log a Meal</h2>
              <p>Add what you have eaten today.</p>
            </div>

            <span className="heading-icon">➕</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="mealType">Meal Type</label>

              <select
                id="mealType"
                name="mealType"
                value={form.mealType}
                onChange={handleChange}
              >
                <option value="breakfast">🍳 Breakfast</option>
                <option value="lunch">🍛 Lunch</option>
                <option value="snack">🍎 Snack</option>
                <option value="dinner">🥗 Dinner</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="foodName">Food Name</label>

              <input
                id="foodName"
                name="foodName"
                type="text"
                placeholder="e.g. Paneer sandwich"
                value={form.foodName}
                onChange={handleChange}
                maxLength={200}
              />
            </div>

            <div className="nutrition-form-row">
              <div className="form-group">
                <label htmlFor="calories">Calories</label>

                <div className="input-with-unit">
                  <input
                    id="calories"
                    name="calories"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="350"
                    value={form.calories}
                    onChange={handleChange}
                  />

                  <span>kcal</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="protein">Protein</label>

                <div className="input-with-unit">
                  <input
                    id="protein"
                    name="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="20"
                    value={form.protein}
                    onChange={handleChange}
                  />

                  <span>g</span>
                </div>
              </div>
            </div>

            <div className="nutrition-form-row">
              <div className="form-group">
                <label htmlFor="carbs">Carbs</label>

                <div className="input-with-unit">
                  <input
                    id="carbs"
                    name="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="40"
                    value={form.carbs}
                    onChange={handleChange}
                  />

                  <span>g</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="fats">Fats</label>

                <div className="input-with-unit">
                  <input
                    id="fats"
                    name="fats"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="12"
                    value={form.fats}
                    onChange={handleChange}
                  />

                  <span>g</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="nutrition-submit-btn"
              disabled={saving}
            >
              {saving ? "Adding Meal..." : "Add Meal"}
            </button>
          </form>
        </div>

        <div className="nutrition-overview-card">
          <div className="section-heading">
            <div>
              <h2>Daily Overview</h2>
              <p>Your nutrition progress today.</p>
            </div>

            <span className="heading-icon">📊</span>
          </div>

          <div className="calorie-circle-wrapper">
            <div
              className="calorie-circle"
              style={{
                "--progress": `${caloriesPercentage * 3.6}deg`,
              }}
            >
              <div className="calorie-circle-inner">
                <strong>{Math.round(totals.calories)}</strong>

                <span>kcal</span>
              </div>
            </div>
          </div>

          <div className="calorie-overview-text">
            <strong>Today's calories</strong>

            <p>
              Keep tracking your meals to get a clearer picture of your daily
              nutrition.
            </p>
          </div>

          <div className="macro-bars">
            <div className="macro-row">
              <div>
                <span>Protein</span>
                <strong>{Math.round(totals.protein)}g</strong>
              </div>

              <div className="macro-track">
                <div
                  className="macro-fill protein-fill"
                  style={{
                    width: `${Math.min((totals.protein / 150) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="macro-row">
              <div>
                <span>Carbs</span>
                <strong>{Math.round(totals.carbs)}g</strong>
              </div>

              <div className="macro-track">
                <div
                  className="macro-fill carbs-fill"
                  style={{
                    width: `${Math.min((totals.carbs / 300) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="macro-row">
              <div>
                <span>Fats</span>
                <strong>{Math.round(totals.fats)}g</strong>
              </div>

              <div className="macro-track">
                <div
                  className="macro-fill fats-fill"
                  style={{
                    width: `${Math.min((totals.fats / 80) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="nutrition-note">
            💡 Nutrition values are estimates and are intended for general
            tracking purposes.
          </div>
        </div>
      </section>

      <section className="meals-section">
        <div className="meals-section-header">
          <div>
            <h2>Today's Meals</h2>

            <p>
              {logs.length === 0
                ? "No meals logged yet."
                : `${logs.length} meal${
                    logs.length === 1 ? "" : "s"
                  } logged today.`}
            </p>
          </div>

          <div className="meal-filters">
            <button
              type="button"
              className={
                selectedMeal === "all"
                  ? "meal-filter active"
                  : "meal-filter"
              }
              onClick={() => setSelectedMeal("all")}
            >
              All
            </button>

            <button
              type="button"
              className={
                selectedMeal === "breakfast"
                  ? "meal-filter active"
                  : "meal-filter"
              }
              onClick={() => setSelectedMeal("breakfast")}
            >
              Breakfast
            </button>

            <button
              type="button"
              className={
                selectedMeal === "lunch"
                  ? "meal-filter active"
                  : "meal-filter"
              }
              onClick={() => setSelectedMeal("lunch")}
            >
              Lunch
            </button>

            <button
              type="button"
              className={
                selectedMeal === "snack"
                  ? "meal-filter active"
                  : "meal-filter"
              }
              onClick={() => setSelectedMeal("snack")}
            >
              Snacks
            </button>

            <button
              type="button"
              className={
                selectedMeal === "dinner"
                  ? "meal-filter active"
                  : "meal-filter"
              }
              onClick={() => setSelectedMeal("dinner")}
            >
              Dinner
            </button>
          </div>
        </div>

        {loading ? (
          <div className="nutrition-empty">
            <div className="loading-spinner" />
            <p>Loading your meals...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="nutrition-empty">
            <div className="empty-food-icon">🍽️</div>

            <h3>No meals found</h3>

            <p>Add your first meal using the form above.</p>
          </div>
        ) : (
          <div className="meal-list">
            {filteredLogs.map((log) => (
              <div className="meal-card" key={log._id}>
                <div className="meal-icon">{mealIcon(log.mealType)}</div>

                <div className="meal-information">
                  <div className="meal-title-row">
                    <div>
                      <span className="meal-type">
                        {mealLabel(log.mealType)}
                      </span>

                      <h3>{log.foodName}</h3>
                    </div>

                    <div className="meal-calories">
                      <strong>{Math.round(log.calories)}</strong>

                      <span>kcal</span>
                    </div>
                  </div>

                  <div className="meal-meta">
                    <span>
                      💪 {Math.round(log.protein || 0)}g protein
                    </span>

                    <span>
                      🌾 {Math.round(log.carbs || 0)}g carbs
                    </span>

                    <span>
                      🥑 {Math.round(log.fats || 0)}g fats
                    </span>

                    <span>🕒 {formatTime(log.loggedAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="delete-meal-btn"
                  onClick={() => handleDelete(log._id)}
                  title="Delete meal"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Nutrition;