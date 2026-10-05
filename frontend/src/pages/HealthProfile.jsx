import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const CONDITIONS = [
  "Diabetes",
  "High Blood Pressure",
  "Heart Disease",
  "Asthma",
  "Thyroid",
  "PCOS",
  "High Cholesterol",
  "Obesity",
  "Arthritis",
  "None",
];

const INITIAL_FORM = {
  goal: "",
  heightCm: "",
  weightKg: "",
  targetWeightKg: "",
  age: "",
  gender: "",
  activityLevel: "",
  dietPreference: "vegetarian",
  healthConditions: [],
  allergies: "",
  wakeTime: "07:00",
  sleepTime: "23:00",
};

export default function HealthProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  // =========================================================
  // LOAD EXISTING PROFILE
  // =========================================================

  async function loadProfile() {
    try {
      setLoadingProfile(true);
      setError("");

      const { data } = await api.get("/health/profile");

      // No profile created yet
      if (!data) {
        setForm(INITIAL_FORM);
        return;
      }

      setForm({
        goal: data.goal || "",
        heightCm: data.heightCm ?? "",
        weightKg: data.weightKg ?? "",
        targetWeightKg: data.targetWeightKg ?? "",
        age: data.age ?? "",
        gender: data.gender || "",
        activityLevel: data.activityLevel || "",
        dietPreference: data.dietPreference || "vegetarian",
        healthConditions: Array.isArray(data.healthConditions)
          ? data.healthConditions
          : [],
        allergies: Array.isArray(data.allergies)
          ? data.allergies.join(", ")
          : "",
        wakeTime: data.wakeTime || "07:00",
        sleepTime: data.sleepTime || "23:00",
      });
    } catch (err) {
      console.error("Profile loading error:", err);

      if (err.response?.status === 404) {
        setForm(INITIAL_FORM);
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your health profile."
        );
      }
    } finally {
      setLoadingProfile(false);
    }
  }

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // HANDLE GOAL
  // =========================================================

  function handleGoal(goal) {
    setForm((previous) => ({
      ...previous,
      goal,
    }));
  }

  // =========================================================
  // HANDLE HEALTH CONDITIONS
  // =========================================================

  function handleCondition(condition) {
    setForm((previous) => {
      let conditions = [...previous.healthConditions];

      // "None" removes all other conditions
      if (condition === "None") {
        return {
          ...previous,
          healthConditions: ["None"],
        };
      }

      // Remove "None" when selecting an actual condition
      conditions = conditions.filter(
        (item) => item !== "None"
      );

      // Toggle condition
      if (conditions.includes(condition)) {
        conditions = conditions.filter(
          (item) => item !== condition
        );
      } else {
        conditions.push(condition);
      }

      return {
        ...previous,
        healthConditions: conditions,
      };
    });
  }

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setMessage("");

    // Basic frontend validation
    if (!form.goal) {
      setError("Please select your wellness goal.");
      return;
    }

    if (!form.gender) {
      setError("Please select your gender.");
      return;
    }

    if (!form.activityLevel) {
      setError("Please select your activity level.");
      return;
    }

    if (!form.heightCm || !form.weightKg || !form.age) {
      setError(
        "Please complete your height, weight and age."
      );
      return;
    }

    setLoading(true);

    try {
      const allergies = form.allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        age: Number(form.age),

        gender: form.gender,

        heightCm: Number(form.heightCm),

        weightKg: Number(form.weightKg),

        targetWeightKg:
          form.targetWeightKg === ""
            ? null
            : Number(form.targetWeightKg),

        goal: form.goal,

        activityLevel: form.activityLevel,

        dietPreference: form.dietPreference,

        wakeTime: form.wakeTime || "07:00",

        sleepTime: form.sleepTime || "23:00",

        allergies,

        healthConditions: form.healthConditions,
      };

      console.log("Saving health profile:", payload);

      const { data } = await api.put(
        "/health/profile",
        payload
      );

      setMessage(
        data?.message ||
          "Health profile saved successfully!"
      );

      // Give user a moment to see success message
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      console.error(
        "Health profile save error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to save health profile."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <div className="logo">🌿</div>

            <h1>Health Profile</h1>

            <p>
              Loading your wellness profile...
            </p>
          </div>

          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="profile-header">
          <div className="logo">🌿</div>

          <h1>
            Complete your health profile
          </h1>

          <p>
            Tell us about yourself so WellnessAI
            can create a personalized wellness plan.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* =================================================
              GOAL
          ================================================= */}

          <section className="form-section">
            <h2>What is your goal?</h2>

            <div className="goal-grid">

              <button
                type="button"
                className={
                  form.goal === "gain"
                    ? "goal-card selected"
                    : "goal-card"
                }
                onClick={() =>
                  handleGoal("gain")
                }
              >
                <span>💪</span>

                <strong>
                  Gain Weight
                </strong>

                <small>
                  Build healthy weight and muscle
                </small>
              </button>

              <button
                type="button"
                className={
                  form.goal === "lose"
                    ? "goal-card selected"
                    : "goal-card"
                }
                onClick={() =>
                  handleGoal("lose")
                }
              >
                <span>🏃</span>

                <strong>
                  Lose Weight
                </strong>

                <small>
                  Work toward a healthy weight
                </small>
              </button>

              <button
                type="button"
                className={
                  form.goal === "maintain"
                    ? "goal-card selected"
                    : "goal-card"
                }
                onClick={() =>
                  handleGoal("maintain")
                }
              >
                <span>⚖️</span>

                <strong>
                  Maintain Weight
                </strong>

                <small>
                  Maintain your current weight
                </small>
              </button>

            </div>
          </section>

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="form-section">
            <h2>Basic information</h2>

            <div className="form-grid">

              <label>
                Height (cm)

                <input
                  type="number"
                  name="heightCm"
                  min="50"
                  max="250"
                  value={form.heightCm}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                  required
                />
              </label>

              <label>
                Weight (kg)

                <input
                  type="number"
                  name="weightKg"
                  min="20"
                  max="300"
                  value={form.weightKg}
                  onChange={handleChange}
                  placeholder="e.g. 70"
                  required
                />
              </label>

              <label>
                Age

                <input
                  type="number"
                  name="age"
                  min="13"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 21"
                  required
                />
              </label>

              <label>
                Gender

                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="male">
                    Male
                  </option>

                  <option value="female">
                    Female
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </label>

            </div>
          </section>

          {/* =================================================
              TARGET WEIGHT
          ================================================= */}

          <section className="form-section">
            <h2>Target weight</h2>

            <label>
              Target Weight (kg)

              <input
                type="number"
                name="targetWeightKg"
                min="20"
                max="300"
                value={form.targetWeightKg}
                onChange={handleChange}
                placeholder="e.g. 60"
              />
            </label>

            <p className="help-text">
              Optional. This helps WellnessAI
              personalize your progress recommendations.
            </p>
          </section>

          {/* =================================================
              ACTIVITY LEVEL
          ================================================= */}

          <section className="form-section">
            <h2>Activity level</h2>

            <select
              name="activityLevel"
              value={form.activityLevel}
              onChange={handleChange}
              required
            >
              <option value="">
                Select your activity level
              </option>

              <option value="sedentary">
                Sedentary — little or no exercise
              </option>

              <option value="light">
                Light — exercise 1–3 days/week
              </option>

              <option value="moderate">
                Moderate — exercise 3–5 days/week
              </option>

              <option value="very_active">
                Active — exercise 6–7 days/week
              </option>
            </select>
          </section>

          {/* =================================================
              DIET
          ================================================= */}

          <section className="form-section">
            <h2>Diet preference</h2>

            <select
              name="dietPreference"
              value={form.dietPreference}
              onChange={handleChange}
            >
              <option value="vegetarian">
                Vegetarian
              </option>

              <option value="non_vegetarian">
                Non-Vegetarian
              </option>

              <option value="eggetarian">
                Eggetarian
              </option>

              <option value="vegan">
                Vegan
              </option>
            </select>
          </section>

          {/* =================================================
              HEALTH CONDITIONS
          ================================================= */}

          <section className="form-section">
            <h2>Health conditions</h2>

            <p className="help-text">
              Select any conditions that apply to you.
            </p>

            <div className="condition-grid">

              {CONDITIONS.map((condition) => (
                <label
                  className="condition-option"
                  key={condition}
                >
                  <input
                    type="checkbox"
                    checked={form.healthConditions.includes(
                      condition
                    )}
                    onChange={() =>
                      handleCondition(condition)
                    }
                  />

                  <span>
                    {condition}
                  </span>
                </label>
              ))}

            </div>
          </section>

          {/* =================================================
              ALLERGIES
          ================================================= */}

          <section className="form-section">
            <h2>Food allergies</h2>

            <input
              type="text"
              name="allergies"
              value={form.allergies}
              onChange={handleChange}
              placeholder="Example: peanuts, milk"
            />

            <p className="help-text">
              Separate multiple allergies with commas.
            </p>
          </section>

          {/* =================================================
              SLEEP SCHEDULE
          ================================================= */}

          <section className="form-section">
            <h2>Daily schedule</h2>

            <div className="form-grid">

              <label>
                Wake time

                <input
                  type="time"
                  name="wakeTime"
                  value={form.wakeTime}
                  onChange={handleChange}
                />
              </label>

              <label>
                Sleep time

                <input
                  type="time"
                  name="sleepTime"
                  value={form.sleepTime}
                  onChange={handleChange}
                />
              </label>

            </div>
          </section>

          {/* =================================================
              MESSAGES
          ================================================= */}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {message && (
            <div className="success">
              {message}
            </div>
          )}

          {/* =================================================
              SAVE
          ================================================= */}

          <button
            type="submit"
            className="primary save-profile"
            disabled={loading}
          >
            {loading
              ? "Saving profile..."
              : "Save Health Profile"}
          </button>

        </form>
      </div>
    </div>
  );
}