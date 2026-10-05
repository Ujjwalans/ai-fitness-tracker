import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function WeeklyReport() {
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/reports/weekly");

      setReport(data);
    } catch (err) {
      console.error("Weekly report error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your weekly wellness report."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatShortDate(date) {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  }

  function getMoodEmoji(mood) {
    const moods = {
      great: "😄",
      good: "🙂",
      okay: "😐",
      low: "😔",
      stressed: "😫",
    };

    return moods[mood] || "—";
  }

  if (loading) {
    return (
      <div className="weekly-report-page">
        <div className="weekly-report-loading">
          <div className="weekly-report-spinner"></div>

          <h2>Preparing your weekly report...</h2>

          <p>We're reviewing your wellness activity from this week.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-report-page">
        <div className="weekly-report-error">
          <div className="weekly-report-error-icon">⚠️</div>

          <h2>Unable to load report</h2>

          <p>{error}</p>

          <button className="weekly-primary-btn" onClick={loadReport}>
            Try Again
          </button>

          <button
            className="weekly-secondary-btn"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const summary = report.summary || {};

  const chartData = (report.weights || []).map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    weight: item.weightKg,
  }));

  const completionPercent =
    summary.checkinsPossible > 0
      ? Math.round(
          (summary.checkinsCompleted / summary.checkinsPossible) * 100
        )
      : 0;

  return (
    <div className="weekly-report-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="weekly-report-container">
        <div className="weekly-report-header">
          <div>
            <p className="weekly-report-eyebrow">Wellness Analytics</p>

            <h1>📊 Weekly Wellness Report</h1>

            <p>
              Your personal wellness summary for{" "}
              <strong>{formatDate(report.period.start)}</strong> to{" "}
              <strong>{formatDate(report.period.end)}</strong>
            </p>
          </div>

          <button
            className="weekly-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {/* =================================================
            WEEK OVERVIEW
        ================================================= */}

        <section className="weekly-overview-card">
          <div className="weekly-overview-header">
            <div>
              <p className="weekly-report-eyebrow">Your week at a glance</p>

              <h2>{completionPercent}% of your week tracked</h2>
            </div>

            <div className="weekly-completion-circle">
              <strong>{completionPercent}%</strong>
              <span>tracked</span>
            </div>
          </div>

          <div className="weekly-progress-track">
            <div
              className="weekly-progress-fill"
              style={{
                width: `${completionPercent}%`,
              }}
            />
          </div>
        </section>

        {/* =================================================
            KEY METRICS
        ================================================= */}

        <section className="weekly-metrics-grid">
          <ReportMetric
            icon="📝"
            label="Check-ins"
            value={`${summary.checkinsCompleted}/7`}
            helper="days tracked"
          />

          <ReportMetric
            icon="😊"
            label="Average Mood"
            value={summary.averageMood}
            helper={`${summary.averageMoodScore || "—"}/5`}
          />

          <ReportMetric
            icon="⚡"
            label="Energy"
            value={
              summary.averageEnergy ? `${summary.averageEnergy}/5` : "—"
            }
            helper="average"
          />

          <ReportMetric
            icon="😴"
            label="Sleep Quality"
            value={
              summary.averageSleepQuality
                ? `${summary.averageSleepQuality}/5`
                : "—"
            }
            helper="average"
          />

          <ReportMetric
            icon="💧"
            label="Water"
            value={
              summary.averageWaterLitres
                ? `${summary.averageWaterLitres} L`
                : "—"
            }
            helper="per recorded day"
          />

          <ReportMetric
            icon="🏃"
            label="Exercise"
            value={`${summary.exerciseDays}`}
            helper="active days"
          />
        </section>

        {/* =================================================
            WEIGHT + NUTRITION
        ================================================= */}

        <div className="weekly-two-column">
          {/* WEIGHT */}

          <section className="weekly-report-card">
            <div className="weekly-card-heading">
              <div>
                <p className="weekly-report-eyebrow">Progress</p>

                <h2>⚖️ Weight This Week</h2>
              </div>

              <div className="weekly-heading-value">
                {summary.weightChange !== null
                  ? `${
                      summary.weightChange > 0 ? "+" : ""
                    }${summary.weightChange} kg`
                  : "No data"}
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="weekly-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" />

                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="weight"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="weekly-empty-state">
                <span>⚖️</span>

                <p>
                  Log your weight during the week to see your progress here.
                </p>
              </div>
            )}
          </section>

          {/* NUTRITION */}

          <section className="weekly-report-card">
            <div className="weekly-card-heading">
              <div>
                <p className="weekly-report-eyebrow">Nutrition</p>

                <h2>🍎 Nutrition Summary</h2>
              </div>
            </div>

            <div className="nutrition-report-main">
              <div className="nutrition-calorie-total">
                <span>Calories logged</span>

                <strong>{summary.calories || 0}</strong>

                <small>{summary.nutritionLogs || 0} food entries</small>
              </div>
            </div>

            <div className="weekly-macro-grid">
              <MacroItem
                label="Protein"
                value={summary.protein}
                unit="g"
                icon="🥩"
              />

              <MacroItem
                label="Carbs"
                value={summary.carbs}
                unit="g"
                icon="🌾"
              />

              <MacroItem
                label="Fats"
                value={summary.fats}
                unit="g"
                icon="🥑"
              />
            </div>

            <p className="weekly-small-note">
              Nutrition values are based on the foods you logged and are intended
              for general tracking.
            </p>
          </section>
        </div>

        {/* =================================================
            DAILY BREAKDOWN
        ================================================= */}

        <section className="weekly-report-card">
          <div className="weekly-card-heading">
            <div>
              <p className="weekly-report-eyebrow">Daily activity</p>

              <h2>📅 Your Week Day by Day</h2>
            </div>
          </div>

          <div className="weekly-days-grid">
            {report.daily.map((day) => (
              <div
                className={`weekly-day ${
                  day.checkin ? "has-checkin" : "no-checkin"
                }`}
                key={day.date}
              >
                <div className="weekly-day-top">
                  <strong>{day.day}</strong>

                  <span>{formatShortDate(day.date)}</span>
                </div>

                {day.checkin ? (
                  <>
                    <div className="weekly-day-mood">
                      <span>{getMoodEmoji(day.checkin.mood)}</span>

                      <strong>{day.checkin.mood}</strong>
                    </div>

                    <div className="weekly-day-stats">
                      <span>⚡ {day.checkin.energyLevel}/5</span>

                      <span>😴 {day.checkin.sleepQuality}/5</span>

                      <span>💧 {day.checkin.waterIntake} L</span>

                      <span>
                        🏃{" "}
                        {day.checkin.exercised ? "Exercise" : "No exercise"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="weekly-day-missing">
                    <span>○</span>
                    <p>No check-in</p>
                  </div>
                )}

                <div className="weekly-day-calories">
                  🍎{" "}
                  {day.nutrition.calories
                    ? `${Math.round(day.nutrition.calories)} kcal`
                    : "No food logged"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================
            INSIGHTS
        ================================================= */}

        <section className="weekly-insights-card">
          <div className="weekly-insights-header">
            <div className="weekly-insights-icon">💡</div>

            <div>
              <p className="weekly-report-eyebrow">Automatic observations</p>

              <h2>Your Wellness Insights</h2>
            </div>
          </div>

          <div className="weekly-insights-list">
            {(report.insights || []).map((insight, index) => (
              <div className="weekly-insight" key={index}>
                <span>✓</span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <div className="weekly-report-disclaimer">
          <strong>⚕️ Wellness Disclaimer</strong>

          <p>{report.disclaimer}</p>
        </div>

        {/* =================================================
            FOOTER ACTION
        ================================================= */}

        <div className="weekly-report-footer">
          <button
            className="weekly-primary-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REPORT METRIC
========================================================= */

function ReportMetric({ icon, label, value, helper }) {
  return (
    <div className="weekly-metric-card">
      <div className="weekly-metric-icon">{icon}</div>

      <div className="weekly-metric-content">
        <span>{label}</span>

        <strong>{value}</strong>

        <small>{helper}</small>
      </div>
    </div>
  );
}

/* =========================================================
   MACRO ITEM
========================================================= */

function MacroItem({ label, value, unit, icon }) {
  return (
    <div className="weekly-macro-item">
      <span className="weekly-macro-icon">{icon}</span>

      <div>
        <span>{label}</span>

        <strong>
          {value || 0}
          {unit}
        </strong>
      </div>
    </div>
  );
}