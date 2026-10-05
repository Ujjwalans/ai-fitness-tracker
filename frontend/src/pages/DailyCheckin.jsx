import React, { useEffect, useState } from "react";
import api from "../api";

// Static data definitions
const MOODS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "low", emoji: "😔", label: "Low" },
  { value: "stressed", emoji: "😫", label: "Stressed" },
];

export default function DailyCheckin() {
  const [form, setForm] = useState({
    mood: "",
    energyLevel: 0,
    sleepQuality: 0,
    exercised: false,
    waterIntake: 0,
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // DATA FETCHING
  // =====================================================

  useEffect(() => {
    loadCheckin();
  }, []);

  async function loadCheckin() {
    try {
      const { data } = await api.get("/checkin/today");

      if (data) {
        setForm({
          mood: data.mood || "",
          energyLevel: data.energyLevel || 0,
          sleepQuality: data.sleepQuality || 0,
          exercised: data.exercised || false,
          waterIntake: data.waterIntake || 0,
          notes: data.notes || "",
        });
      }
    } catch (err) {
      console.error("Check-in loading error:", err);
      setError(
        err.response?.data?.message || "Unable to load today's check-in"
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // FORM SUBMISSION & VALIDATION
  // =====================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.mood) {
      setError("Please select how you're feeling today.");
      return;
    }

    if (!form.energyLevel) {
      setError("Please rate your energy level.");
      return;
    }

    if (!form.sleepQuality) {
      setError("Please rate your sleep quality.");
      return;
    }

    setSaving(true);

    try {
      const { data } = await api.put("/checkin/today", {
        ...form,
        energyLevel: Number(form.energyLevel),
        sleepQuality: Number(form.sleepQuality),
        waterIntake: Number(form.waterIntake),
      });

      setMessage(data.message || "Check-in saved successfully!");
    } catch (err) {
      console.error("Check-in save error:", err);
      setError(
        err.response?.data?.message || "Unable to save today's check-in"
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="checkin-page">
        <div className="checkin-card">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading today's check-in...</p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN COMPONENT UI
  // =====================================================

  return (
    <div className="checkin-page">
      <div className="checkin-card">
        {/* Header Section */}
        <header className="checkin-header">
          <div className="checkin-header-icon" aria-hidden="true">
            🌿
          </div>
          <h1>Daily Wellness Check-in</h1>
          <p>
            Take a moment to check in with yourself. Your responses help Wellness
            AI understand your daily wellness journey.
          </p>
        </header>

        {/* Feedback Banners */}
        {error && (
          <div role="alert" className="form-message error-message">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div role="alert" className="form-message success-message">
            ✓ {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Mood Selector */}
          <fieldset className="checkin-section">
            <legend>How are you feeling today?</legend>
            <div className="mood-grid" role="radiogroup" aria-label="Mood options">
              {MOODS.map((mood) => (
                <button
                  type="button"
                  key={mood.value}
                  role="radio"
                  aria-checked={form.mood === mood.value}
                  className={`mood-option ${
                    form.mood === mood.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, mood: mood.value }))
                  }
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Energy Level Scale */}
          <fieldset className="checkin-section">
            <legend>⚡ Energy Level</legend>
            <p className="checkin-description">
              How energetic do you feel today?
            </p>

            <div
              className="rating-row"
              role="radiogroup"
              aria-label="Energy Level"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  role="radio"
                  aria-checked={form.energyLevel === value}
                  className={`rating-button ${
                    form.energyLevel === value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, energyLevel: value }))
                  }
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="rating-labels">
              <span>Very Low</span>
              <span>Excellent</span>
            </div>
          </fieldset>

          {/* Sleep Quality Scale */}
          <fieldset className="checkin-section">
            <legend>😴 Sleep Quality</legend>
            <p className="checkin-description">
              How well did you sleep last night?
            </p>

            <div
              className="rating-row"
              role="radiogroup"
              aria-label="Sleep Quality"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  role="radio"
                  aria-checked={form.sleepQuality === value}
                  className={`rating-button ${
                    form.sleepQuality === value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, sleepQuality: value }))
                  }
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </fieldset>

          {/* Exercise Toggle */}
          <fieldset className="checkin-section">
            <legend>🏃 Did you exercise today?</legend>
            <div className="yes-no-buttons">
              <button
                type="button"
                aria-pressed={form.exercised === true}
                className={`yes-no-button ${
                  form.exercised === true ? "selected" : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, exercised: true }))
                }
              >
                💪 Yes
              </button>

              <button
                type="button"
                aria-pressed={form.exercised === false}
                className={`yes-no-button ${
                  form.exercised === false ? "selected" : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, exercised: false }))
                }
              >
                🛋️ Not Yet
              </button>
            </div>
          </fieldset>

          {/* Water Intake Input */}
          <section className="checkin-section">
            <label htmlFor="waterIntake" className="section-label">
              💧 Water Intake
            </label>
            <p className="checkin-description">
              Approximately how much water have you had today?
            </p>

            <div className="water-input">
              <input
                id="waterIntake"
                type="number"
                min="0"
                max="20"
                step="0.1"
                value={form.waterIntake}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    waterIntake: e.target.value,
                  }))
                }
              />
              <span>litres</span>
            </div>
          </section>

          {/* Notes Field */}
          <section className="checkin-section">
            <label htmlFor="notes" className="section-label">
              📝 Anything you'd like to note?
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              maxLength="500"
              placeholder="How was your day? Anything you want Wellness AI to know?"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </section>

          {/* Submit CTA */}
          <button
            type="submit"
            className="save-checkin-btn"
            disabled={saving}
          >
            {saving ? "Saving Check-in..." : "Save Today's Check-in"}
          </button>
        </form>
      </div>
    </div>
  );
}