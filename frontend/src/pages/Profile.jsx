import React, { useEffect, useState } from "react";
import api from "../api";

const initial = {
  age: "",
  gender: "male",
  heightCm: "",
  weightKg: "",
  targetWeightKg: "",
  goal: "maintain",
  activityLevel: "moderate",
  dietPreference: "vegetarian",
  wakeTime: "07:00",
  sleepTime: "23:00",
  allergies: "",
  healthConditions: "",
};

export default function Profile() {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api
      .get("/health/profile")
      .then(({ data }) => {
        console.log("PROFILE DATA:", data);

        if (data && data.userId) {
          setForm({
            age: data.age ?? "",
            gender: data.gender ?? "male",
            heightCm: data.heightCm ?? "",
            weightKg: data.weightKg ?? "",
            targetWeightKg: data.targetWeightKg ?? "",
            goal: data.goal ?? "maintain",
            activityLevel: data.activityLevel ?? "moderate",
            dietPreference: data.dietPreference ?? "vegetarian",
            wakeTime: data.wakeTime ?? "07:00",
            sleepTime: data.sleepTime ?? "23:00",
            allergies: Array.isArray(data.allergies)
              ? data.allergies.join(", ")
              : "",
            healthConditions: Array.isArray(data.healthConditions)
              ? data.healthConditions.join(", ")
              : "",
          });

          setMetrics(data.calculated);
        }
      })
      .catch((err) => {
        console.error("PROFILE LOAD ERROR:", err.response?.data || err);
      });
  }, []);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      targetWeightKg: form.targetWeightKg ? Number(form.targetWeightKg) : null,
      allergies: form.allergies
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      healthConditions: form.healthConditions
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    };

    const { data } = await api.put("/health/profile", payload);
    setMetrics(data.calculated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Your health profile</p>
          <h1>Personalize your plan</h1>
        </div>
        {saved && <span className="success">Saved ✓</span>}
      </div>

      <form className="card form-grid" onSubmit={submit}>
        <label>
          Age
          <input
            type="number"
            min="13"
            max="100"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
            required
          />
        </label>

        <label>
          Gender
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          Height (cm)
          <input
            type="number"
            value={form.heightCm}
            onChange={(e) => update("heightCm", e.target.value)}
            required
          />
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
            required
          />
        </label>

        <label>
          Target Weight (kg)
          <input
            type="number"
            step="0.1"
            min="1"
            placeholder="e.g. 55"
            value={form.targetWeightKg}
            onChange={(e) => update("targetWeightKg", e.target.value)}
          />
        </label>

        <label>
          Goal
          <select
            value={form.goal}
            onChange={(e) => update("goal", e.target.value)}
          >
            <option value="gain">Gain weight</option>
            <option value="lose">Lose weight</option>
            <option value="maintain">Maintain weight</option>
          </select>
        </label>

        <label>
          Activity
          <select
            value={form.activityLevel}
            onChange={(e) => update("activityLevel", e.target.value)}
          >
            <option value="sedentary">Sedentary</option>
            <option value="light">Light</option>
            <option value="moderate">Moderate</option>
            <option value="very_active">Very active</option>
          </select>
        </label>

        <label>
          Diet preference
          <select
            value={form.dietPreference}
            onChange={(e) => update("dietPreference", e.target.value)}
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="eggetarian">Eggetarian</option>
            <option value="non_vegetarian">Non-vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </label>

        <label>
          Wake time
          <input
            type="time"
            value={form.wakeTime}
            onChange={(e) => update("wakeTime", e.target.value)}
          />
        </label>

        <label>
          Sleep time
          <input
            type="time"
            value={form.sleepTime}
            onChange={(e) => update("sleepTime", e.target.value)}
          />
        </label>

        <label>
          Allergies
          <input
            placeholder="e.g. peanuts, lactose"
            value={form.allergies}
            onChange={(e) => update("allergies", e.target.value)}
          />
        </label>

        <label className="wide">
          Health conditions
          <input
            placeholder="e.g. diabetes, hypertension; leave blank if none"
            value={form.healthConditions}
            onChange={(e) => update("healthConditions", e.target.value)}
          />
        </label>

        <div className="wide">
          <button className="primary">Save health profile</button>
        </div>
      </form>

      {metrics && (
        <div className="metrics">
          <Metric title="BMI" value={metrics.bmi ?? "—"} />
          <Metric title="Estimated BMR" value={`${metrics.bmr ?? "—"} kcal`} />
          <Metric title="Estimated TDEE" value={`${metrics.tdee ?? "—"} kcal`} />
        </div>
      )}
    </section>
  );
}

function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}