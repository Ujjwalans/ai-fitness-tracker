import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "../api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [weights, setWeights] = useState([]);

  const [newWeight, setNewWeight] = useState("");

  const [loading, setLoading] = useState(false);

  const [chat, setChat] = useState("");
  const [reply, setReply] = useState("");

  // =========================================
  // REMINDER STATE
  // =========================================

  const [completedReminders, setCompletedReminders] = useState(() => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const saved = JSON.parse(
        localStorage.getItem("completedReminders") || "{}"
      );

      if (saved.date !== today) {
        localStorage.removeItem("completedReminders");
        return {};
      }

      return saved.items || {};
    } catch {
      return {};
    }
  });

  // =========================================
  // LOAD DASHBOARD DATA
  // =========================================

  async function load() {
    try {
      const [profileResponse, planResponse, weightResponse] =
        await Promise.all([
          api.get("/health/profile"),
          api.get("/ai/plan/latest"),
          api.get("/progress/weight"),
        ]);

      setProfile(
        profileResponse.data?.userId ? profileResponse.data : null
      );

      setPlan(planResponse.data);

      setWeights(weightResponse.data || []);
    } catch (error) {
      console.error(
        "DASHBOARD LOAD ERROR:",
        error.response?.data || error
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  // =========================================
  // GENERATE AI PLAN
  // =========================================

  async function generate() {
    setLoading(true);

    try {
      const { data } = await api.post("/ai/plan");

      setPlan(data);
    } catch (error) {
      alert(
        error.response?.data?.message || "Could not generate plan"
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================
  // LOG WEIGHT
  // =========================================

  async function logWeight(e) {
    e.preventDefault();

    if (!newWeight) return;

    try {
      await api.post("/progress/weight", {
        weightKg: Number(newWeight),
      });

      setNewWeight("");

      await load();
    } catch (error) {
      alert(
        error.response?.data?.message || "Could not log weight"
      );
    }
  }

  // =========================================
  // ASK AI ASSISTANT
  // =========================================

  async function askAI(e) {
    e.preventDefault();

    if (!chat.trim()) return;

    try {
      const { data } = await api.post("/ai/chat", {
        message: chat,
      });

      setReply(data.reply);
    } catch (error) {
      alert(
        error.response?.data?.message || "Could not get AI response"
      );
    }
  }

  // =========================================
  // WEIGHT CHART DATA
  // =========================================

  const chart = weights.map((item) => ({
    name: new Date(item.loggedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    weight: item.weightKg,
  }));

  // =========================================
  // STARTING WEIGHT
  // =========================================

  const startingWeight =
    weights.length > 0
      ? Number(weights[0].weightKg)
      : Number(profile?.weightKg);

  // =========================================
  // CURRENT WEIGHT
  // =========================================

  const currentWeight =
    weights.length > 0
      ? Number(weights[weights.length - 1].weightKg)
      : Number(profile?.weightKg);

  // =========================================
  // WEIGHT CHANGE
  // =========================================

  const weightChange =
    startingWeight && currentWeight
      ? (currentWeight - startingWeight).toFixed(1)
      : null;

  // =========================================
  // TARGET WEIGHT
  // =========================================

  const targetWeight = Number(profile?.targetWeightKg);

  // =========================================
  // GOAL PROGRESS
  // =========================================

  let progressPercent = 0;
  let remainingWeight = null;

  let targetStatus = "Set a target weight to track your progress.";

  if (startingWeight > 0 && currentWeight > 0 && targetWeight > 0) {
    remainingWeight = Math.abs(targetWeight - currentWeight).toFixed(1);

    // GAIN
    if (profile?.goal === "gain" && targetWeight > startingWeight) {
      const totalDistance = targetWeight - startingWeight;
      const currentDistance = currentWeight - startingWeight;

      progressPercent = (currentDistance / totalDistance) * 100;
    }
    // LOSE
    else if (profile?.goal === "lose" && targetWeight < startingWeight) {
      const totalDistance = startingWeight - targetWeight;
      const currentDistance = startingWeight - currentWeight;

      progressPercent = (currentDistance / totalDistance) * 100;
    }
    // MAINTAIN
    else if (profile?.goal === "maintain") {
      progressPercent =
        Math.abs(currentWeight - targetWeight) <= 1
          ? 100
          : Math.max(
              0,
              100 -
                (Math.abs(currentWeight - targetWeight) /
                  Math.max(targetWeight, 1)) *
                  100
            );
    }

    progressPercent = Math.max(0, Math.min(100, progressPercent));

    // TARGET MESSAGE
    if (remainingWeight === "0.0") {
      targetStatus = "🎉 You have reached your target weight.";
    } else if (
      profile?.goal === "gain" &&
      targetWeight > startingWeight &&
      currentWeight < targetWeight
    ) {
      targetStatus = `${remainingWeight} kg remaining to reach your target.`;
    } else if (
      profile?.goal === "lose" &&
      targetWeight < startingWeight &&
      currentWeight > targetWeight
    ) {
      targetStatus = `${remainingWeight} kg remaining to reach your target.`;
    } else if (profile?.goal === "maintain") {
      targetStatus =
        Math.abs(currentWeight - targetWeight) <= 1
          ? "🎉 You are within 1 kg of your maintenance target."
          : `${remainingWeight} kg away from your maintenance target.`;
    } else {
      targetStatus =
        "Check that your target weight matches your selected goal.";
    }
  }

  // =========================================
  // PROGRESS MESSAGE
  // =========================================

  let progressMessage = "";

  if (profile && weightChange !== null) {
    if (profile.goal === "gain") {
      if (Number(weightChange) > 0) {
        progressMessage =
          "Great! Your weight is increasing toward your goal. 💪";
      } else if (Number(weightChange) < 0) {
        progressMessage =
          "Your weight is decreasing. Focus on consistent nutrition.";
      } else {
        progressMessage =
          "Your weight is stable. Keep following your plan.";
      }
    }

    if (profile.goal === "lose") {
      if (Number(weightChange) < 0) {
        progressMessage =
          "Great! Your weight is moving toward your goal. 🎯";
      } else if (Number(weightChange) > 0) {
        progressMessage =
          "Your weight is increasing. Review your meals and activity.";
      } else {
        progressMessage =
          "Your weight is stable. Keep following your plan.";
      }
    }

    if (profile.goal === "maintain") {
      if (Math.abs(Number(weightChange)) <= 1) {
        progressMessage = "Your weight is relatively stable. 👍";
      } else {
        progressMessage =
          "Your weight has changed. Keep monitoring your progress.";
      }
    }
  }

  // =========================================
  // QUICK STATS
  // =========================================

  const weightValues = weights.map((item) => Number(item.weightKg));

  const averageWeight =
    weightValues.length > 0
      ? (
          weightValues.reduce((sum, value) => sum + value, 0) /
          weightValues.length
        ).toFixed(1)
      : null;

  const highestWeight =
    weightValues.length > 0
      ? Math.max(...weightValues).toFixed(1)
      : null;

  const lowestWeight =
    weightValues.length > 0
      ? Math.min(...weightValues).toFixed(1)
      : null;

  // =========================================
  // SMART WELLNESS REMINDERS
  // =========================================

  const reminders = [];

  if (profile) {
    const wakeTime = profile.wakeTime || "07:00";
    const sleepTime = profile.sleepTime || "23:00";

    reminders.push({
      id: "hydration",
      time: wakeTime,
      icon: "💧",
      title: "Hydration",
      message: "Start your day with a glass of water.",
    });

    reminders.push({
      id: "breakfast",
      time: "09:00",
      icon: "🍳",
      title: "Breakfast",
      message: "It's a good time for your morning meal.",
    });

    reminders.push({
      id: "lunch",
      time: "13:00",
      icon: "🍛",
      title: "Lunch",
      message: "Time for a balanced lunch.",
    });

    reminders.push({
      id: "exercise",
      time: "18:00",
      icon: "🏃",
      title: "Exercise",
      message:
        profile.activityLevel === "sedentary"
          ? "Try some light physical activity today."
          : "Time for your planned physical activity.",
    });

    reminders.push({
      id: "dinner",
      time: "20:00",
      icon: "🥗",
      title: "Dinner",
      message: "Have a balanced evening meal.",
    });

    if (profile.goal !== "maintain") {
      reminders.push({
        id: "weight-check",
        time: "21:00",
        icon: "⚖️",
        title: "Weight Check",
        message:
          "Remember to log your weight if you haven't already.",
      });
    }

    reminders.push({
      id: "sleep",
      time: sleepTime,
      icon: "😴",
      title: "Sleep",
      message: "Start winding down and prepare for restful sleep.",
    });
  }

  // =========================================
  // REMINDER STATUS
  // =========================================

  function getReminderStatus(reminder) {
    if (completedReminders[reminder.id]) {
      return "completed";
    }

    const [hours, minutes] = reminder.time.split(":").map(Number);
    const now = new Date();
    const reminderDate = new Date();

    reminderDate.setHours(hours);
    reminderDate.setMinutes(minutes);
    reminderDate.setSeconds(0);
    reminderDate.setMilliseconds(0);

    const difference = reminderDate.getTime() - now.getTime();

    if (Math.abs(difference) <= 30 * 60 * 1000) {
      return "due";
    }

    if (difference > 0) {
      return "upcoming";
    }

    return "upcoming";
  }

  // =========================================
  // COMPLETE REMINDER
  // =========================================

  function completeReminder(id) {
    const today = new Date().toISOString().split("T")[0];

    const updated = {
      ...completedReminders,
      [id]: true,
    };

    setCompletedReminders(updated);

    localStorage.setItem(
      "completedReminders",
      JSON.stringify({
        date: today,
        items: updated,
      })
    );
  }

  // =========================================
  // REMINDER COUNTS
  // =========================================

  const completedCount = reminders.filter(
    (reminder) => getReminderStatus(reminder) === "completed"
  ).length;

  const dueCount = reminders.filter(
    (reminder) => getReminderStatus(reminder) === "due"
  ).length;

  // =========================================
  // USER NAME
  // =========================================

  let name = "there";

  try {
    name =
      JSON.parse(localStorage.getItem("user") || "{}").name || "there";
  } catch {
    name = "there";
  }

  // =========================================
  // DASHBOARD UI
  // =========================================

  return (
    <section>
      {/* HERO */}
      <div className="hero">
        <div>
          <p className="eyebrow">Personal wellness dashboard</p>
          <h1>Hello, {name} 👋</h1>
          <p>
            Track your progress and generate a plan based on your profile.
          </p>
        </div>

        <button
          className="primary"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating..." : "✨ Generate AI Plan"}
        </button>
      </div>

      {/* PROFILE METRICS */}
      {!profile ? (
        <div className="card empty">
          <h2>Complete your health profile</h2>
          <p>
            Add your height, weight and goal to unlock personalized
            planning.
          </p>
        </div>
      ) : (
        <div className="metrics">
          <Metric title="Goal" value={profile.goal} />
          <Metric title="Current Weight" value={`${profile.weightKg} kg`} />
          <Metric
            title="Weight Change"
            value={
              weightChange !== null
                ? `${Number(weightChange) > 0 ? "+" : ""}${weightChange} kg`
                : "—"
            }
          />
          <Metric
            title="BMI"
            value={profile.calculated?.bmi ?? "—"}
          />
        </div>
      )}

      {/* GOAL PROGRESS MESSAGE */}
      {profile && progressMessage && (
        <div className="card progress-message">
          <h2>🎯 Goal Progress</h2>
          <p>{progressMessage}</p>
        </div>
      )}

      {/* PROGRESS SUMMARY */}
      {profile && (
        <div className="card">
          <h2>📊 Progress Summary</h2>
          <p>
            Goal: <strong>{profile.goal}</strong>
          </p>
          <p>
            Starting weight:{" "}
            <strong>
              {startingWeight ? `${startingWeight} kg` : "—"}
            </strong>
          </p>
          <p>
            Current weight:{" "}
            <strong>{currentWeight ? `${currentWeight} kg` : "—"}</strong>
          </p>
          <p>
            Target weight:{" "}
            <strong>
              {targetWeight ? `${targetWeight} kg` : "Not set"}
            </strong>
          </p>
          <p>
            Total change:{" "}
            <strong>
              {weightChange !== null
                ? `${
                    Number(weightChange) > 0 ? "+" : ""
                  }${weightChange} kg`
                : "—"}
            </strong>
          </p>
          <p>
            Entries recorded: <strong>{weights.length}</strong>
          </p>
        </div>
      )}

      {/* TARGET WEIGHT PROGRESS */}
      {profile && targetWeight > 0 && (
        <div className="card goal-target-card">
          <div className="goal-target-header">
            <div>
              <p className="eyebrow">Goal Tracking</p>
              <h2>🎯 Goal Progress</h2>
            </div>
            <strong className="progress-percent">
              {progressPercent.toFixed(0)}%
            </strong>
          </div>

          <div className="weight-targets">
            <div>
              <span>Starting</span>
              <strong>{startingWeight} kg</strong>
            </div>
            <div>
              <span>Current</span>
              <strong>{currentWeight} kg</strong>
            </div>
            <div>
              <span>Target</span>
              <strong>{targetWeight} kg</strong>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="progress-description">{targetStatus}</p>
        </div>
      )}

      {/* QUICK STATS */}
      {profile && weights.length > 0 && (
        <div className="quick-stats">
          <div className="quick-stat">
            <span>📊 Average Weight</span>
            <strong>{averageWeight} kg</strong>
          </div>
          <div className="quick-stat">
            <span>📈 Highest Weight</span>
            <strong>{highestWeight} kg</strong>
          </div>
          <div className="quick-stat">
            <span>📉 Lowest Weight</span>
            <strong>{lowestWeight} kg</strong>
          </div>
          <div className="quick-stat">
            <span>📝 Weight Entries</span>
            <strong>{weights.length}</strong>
          </div>
        </div>
      )}

      {/* SMART WELLNESS REMINDERS */}
      {profile && reminders.length > 0 && (
        <div className="card reminders-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Daily guidance</p>
              <h2>🔔 Smart Wellness Reminders</h2>
            </div>
            <div className="reminder-summary">
              <strong>
                {completedCount}/{reminders.length}
              </strong>
              <span>completed</span>
            </div>
          </div>

          {/* DUE NOW NOTICE */}
          {dueCount > 0 && (
            <div className="reminder-alert">
              🔔 You have {dueCount} reminder
              {dueCount > 1 ? "s" : ""} due now.
            </div>
          )}

          <div className="reminders-list">
            {reminders.map((reminder) => {
              const status = getReminderStatus(reminder);

              return (
                <div className={`reminder-item ${status}`} key={reminder.id}>
                  <div className="reminder-icon">
                    {status === "completed" ? "✅" : reminder.icon}
                  </div>

                  <div className="reminder-content">
                    <div className="reminder-top">
                      <strong>{reminder.title}</strong>
                      <span>{formatReminderTime(reminder.time)}</span>
                    </div>

                    <p>
                      {status === "completed"
                        ? "Completed for today."
                        : reminder.message}
                    </p>

                    <div className="reminder-status-row">
                      {status === "completed" && (
                        <span className="reminder-status completed-status">
                          ✓ Completed
                        </span>
                      )}
                      {status === "due" && (
                        <span className="reminder-status due-status">
                          🔔 Due now
                        </span>
                      )}
                      {status === "upcoming" && (
                        <span className="reminder-status upcoming-status">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </div>

                  {status !== "completed" && (
                    <button
                      type="button"
                      className="reminder-done"
                      onClick={() => completeReminder(reminder.id)}
                    >
                      ✓ Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAILY CHECK-IN */}
      {profile && (
        <div className="card daily-checkin-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Daily wellness</p>
              <h2>📝 Daily Check-in</h2>
            </div>
            <button
              type="button"
              className="primary daily-checkin-button"
              onClick={() => navigate("/checkin")}
            >
              Complete Check-in
            </button>
          </div>
          <p className="daily-checkin-description">
            Take a moment to record how you're feeling today, your energy,
            sleep, exercise and water intake.
          </p>
        </div>
      )}

      {/* AI STYLE ADVISOR */}
      <div className="card style-advisor-dashboard-card">
        <div className="style-advisor-dashboard-content">
          <div>
            <p className="eyebrow">Personal style</p>
            <h2>👕 AI Style Advisor</h2>
            <p>
              Upload your photo and get personalized clothing, color,
              footwear and complete outfit recommendations.
            </p>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => navigate("/style-advisor")}
          >
            ✨ Try Style Advisor →
          </button>
        </div>
      </div>

      {/* WEEKLY WELLNESS REPORT */}
      <div className="card weekly-report-dashboard-card">
        <div className="weekly-report-dashboard-content">
          <div>
            <p className="eyebrow">Weekly analytics</p>
            <h2>📊 Weekly Wellness Report</h2>
            <p>
              Review your mood, sleep, exercise, hydration, nutrition and
              weight progress from this week.
            </p>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => navigate("/weekly-report")}
          >
            View Weekly Report →
          </button>
        </div>
      </div>

      {/* TWO COLUMN AREA */}
      <div className="two-col">
        {/* WEIGHT PROGRESS */}
        <div className="card">
          <div className="section-title">
            <h2>Weight Progress</h2>
            <form onSubmit={logWeight} className="inline-form">
              <input
                type="number"
                step="0.1"
                placeholder="kg"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
              <button>Log</button>
            </form>
          </div>

          {/* CHART */}
          {chart.length ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chart}>
                  <XAxis dataKey="name" />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">
              Log your weight to see a progress graph.
            </p>
          )}

          {/* RECENT ACTIVITY */}
          {weights.length > 0 && (
            <div className="recent-activity">
              <div className="recent-header">
                <h3>🕒 Recent Activity</h3>
                <span>{weights.length} entries</span>
              </div>

              <div className="activity-list">
                {[...weights]
                  .slice(-5)
                  .reverse()
                  .map((item, index) => (
                    <div
                      className="activity-item"
                      key={item._id || index}
                    >
                      <div>
                        <strong>{item.weightKg} kg</strong>
                        <span>
                          {new Date(item.loggedAt).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <span className="activity-label">
                        Weight logged
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* AI ASSISTANT */}
        <div className="card">
          <div className="section-title">
            <h2>AI Assistant</h2>
          </div>

          <form onSubmit={askAI}>
            <textarea
              rows="4"
              placeholder="Ask about your general wellness plan..."
              value={chat}
              onChange={(e) => setChat(e.target.value)}
            />
            <button className="primary">Ask AI</button>
          </form>

          {reply && <div className="ai-reply">{reply}</div>}
        </div>
      </div>

      {/* AI WELLNESS PLAN */}
      {plan && <Plan plan={plan.plan} />}
    </section>
  );
}

// ===========================================
// TIME FORMATTER
// ===========================================

function formatReminderTime(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();

  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ===========================================
// METRIC COMPONENT
// ===========================================

function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ===========================================
// AI PLAN COMPONENT
// ===========================================

function Plan({ plan }) {
  if (!plan) {
    return null;
  }

  return (
    <div className="card plan">
      <div className="section-title">
        <div>
          <p className="eyebrow">Personalized draft</p>
          <h2>Your Wellness Plan</h2>
        </div>
      </div>

      {/* SUMMARY */}
      <p>{plan.summary}</p>

      {/* MEAL SCHEDULE */}
      {plan.mealSchedule && plan.mealSchedule.length > 0 && (
        <div className="meal-grid">
          {plan.mealSchedule.map((meal, index) => (
            <div className="meal" key={index}>
              <span>{meal.time}</span>
              <h3>{meal.label}</h3>
              <ul>
                {meal.suggestions?.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* EXERCISE + PRECAUTIONS */}
      <div className="two-col plan-bottom">
        {/* EXERCISE */}
        <div>
          <h3>Exercise</h3>
          <ul>
            {plan.exercise?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* FOODS TO LIMIT */}
        <div>
          <h3>Limit / Precautions</h3>
          <ul>
            {[
              ...(plan.foodsToLimit || []),
              ...(plan.precautions || []),
            ].map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* DISCLAIMER */}
      {plan.disclaimer && (
        <p className="disclaimer">{plan.disclaimer}</p>
      )}
    </div>
  );
}