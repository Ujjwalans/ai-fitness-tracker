import React, { useEffect, useState } from "react";
import api from "../api";

function WorkoutPlanner() {
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadLatestWorkout() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/workout/plan/latest");

      setWorkout(response.data);
    } catch (err) {
      console.error("Unable to load workout:", err);

      setError(
        err.response?.data?.message || "Unable to load workout plan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateWorkout() {
    try {
      setGenerating(true);
      setError("");

      const response = await api.post("/workout/plan");

      setWorkout(response.data);
    } catch (err) {
      console.error("Workout generation error:", err);

      setError(
        err.response?.data?.message || "Unable to generate workout plan."
      );
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadLatestWorkout();
  }, []);

  if (loading) {
    return (
      <main className="workout-page">
        <div className="workout-loading">
          <div className="workout-spinner"></div>

          <h2>Loading your workout...</h2>

          <p>Preparing your personalized wellness workout.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="workout-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <section className="workout-hero">
        <div>
          <div className="workout-eyebrow">AI-POWERED FITNESS</div>

          <h1>AI Workout Planner</h1>

          <p>
            Get a personalized weekly workout plan based on your wellness
            profile, activity level and goal.
          </p>
        </div>

        <button
          type="button"
          className="workout-generate-btn"
          onClick={generateWorkout}
          disabled={generating}
        >
          <span className="workout-btn-icon">
            {generating ? "⏳" : "✨"}
          </span>

          {generating
            ? "Generating..."
            : workout
            ? "Regenerate Workout"
            : "Generate Workout"}
        </button>
      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="workout-error">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!workout && !error && (
        <section className="workout-empty">
          <div className="workout-empty-icon">🏋️</div>

          <h2>Your personalized workout is ready to be created</h2>

          <p>
            Generate an AI-powered workout plan using the information from your
            Health Profile.
          </p>

          <button
            type="button"
            className="workout-primary-btn"
            onClick={generateWorkout}
            disabled={generating}
          >
            {generating ? "Creating Workout..." : "Create My Workout"}
          </button>
        </section>
      )}

      {workout && (
        <>
          {/* =================================================
              DISCLAIMER
          ================================================= */}

          <section className="workout-disclaimer">
            <div className="workout-info-icon">ℹ️</div>

            <div>
              <strong>General wellness guidance</strong>

              <p>{workout.disclaimer}</p>
            </div>
          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="workout-summary-card">
            <div className="workout-summary-icon">🧠</div>

            <div>
              <div className="workout-section-label">WELLNESS AI INSIGHT</div>

              <h2>Your Workout Strategy</h2>

              <p>{workout.summary}</p>
            </div>
          </section>

          {/* =================================================
              WARM UP
          ================================================= */}

          <section className="workout-section">
            <div className="workout-section-heading">
              <div className="workout-heading-icon">🔥</div>

              <div>
                <span>PREPARE YOUR BODY</span>

                <h2>Warm-up</h2>
              </div>
            </div>

            <div className="workout-simple-grid">
              {(workout.warmup || []).map((item, index) => (
                <div className="workout-simple-card" key={index}>
                  <span className="workout-number">{index + 1}</span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================
              WEEKLY SCHEDULE
          ================================================= */}

          <section className="workout-section">
            <div className="workout-section-heading">
              <div className="workout-heading-icon">📅</div>

              <div>
                <span>YOUR WEEK</span>

                <h2>Weekly Workout Schedule</h2>
              </div>
            </div>

            <div className="workout-week">
              {(workout.weeklySchedule || []).map((day, index) => (
                <article
                  className="workout-day-card"
                  key={`${day.day}-${index}`}
                >
                  <div className="workout-day-header">
                    <div>
                      <span className="workout-day-label">
                        DAY {index + 1}
                      </span>

                      <h3>{day.day}</h3>
                    </div>

                    <div className="workout-duration">
                      ⏱️ {day.duration || "Flexible"}
                    </div>
                  </div>

                  <div className="workout-focus">
                    <span>FOCUS</span>

                    <strong>{day.focus}</strong>
                  </div>

                  {day.exercises?.length > 0 ? (
                    <div className="workout-exercises">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div
                          className="workout-exercise"
                          key={exerciseIndex}
                        >
                          <div className="exercise-top">
                            <div className="exercise-name">
                              <span>{exerciseIndex + 1}</span>

                              <strong>{exercise.name}</strong>
                            </div>

                            {exercise.sets && (
                              <span className="exercise-sets">
                                {exercise.sets} sets
                              </span>
                            )}
                          </div>

                          <div className="exercise-details">
                            {exercise.reps && (
                              <div>
                                <small>REPS</small>

                                <strong>{exercise.reps}</strong>
                              </div>
                            )}

                            {exercise.duration && (
                              <div>
                                <small>DURATION</small>

                                <strong>{exercise.duration}</strong>
                              </div>
                            )}

                            {exercise.rest && (
                              <div>
                                <small>REST</small>

                                <strong>{exercise.rest}</strong>
                              </div>
                            )}
                          </div>

                          {exercise.instructions && (
                            <p className="exercise-instructions">
                              {exercise.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="workout-rest-day">
                      <span>🧘</span>

                      <div>
                        <strong>Recovery Day</strong>

                        <p>
                          Focus on recovery, comfortable movement and
                          hydration.
                        </p>
                      </div>
                    </div>
                  )}

                  {day.notes && (
                    <div className="workout-day-note">💡 {day.notes}</div>
                  )}
                </article>
              ))}
            </div>
          </section>

          {/* =================================================
              COOL DOWN
          ================================================= */}

          <section className="workout-section">
            <div className="workout-section-heading">
              <div className="workout-heading-icon">🧘</div>

              <div>
                <span>RECOVERY</span>

                <h2>Cool-down</h2>
              </div>
            </div>

            <div className="workout-simple-grid">
              {(workout.cooldown || []).map((item, index) => (
                <div className="workout-simple-card" key={index}>
                  <span className="workout-number">{index + 1}</span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================
              SAFETY
          ================================================= */}

          <section className="workout-safety">
            <div className="workout-safety-icon">🛡️</div>

            <div>
              <h3>Workout Safety</h3>

              <ul>
                {(workout.safetyNotes || []).map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* =================================================
              BOTTOM CTA
          ================================================= */}

          <section className="workout-bottom-cta">
            <div>
              <span>WANT A DIFFERENT ROUTINE?</span>

              <h2>Generate a fresh workout plan</h2>

              <p>
                Your AI planner can create another routine using your current
                profile.
              </p>
            </div>

            <button
              type="button"
              className="workout-generate-btn"
              onClick={generateWorkout}
              disabled={generating}
            >
              {generating ? "Generating..." : "✨ Regenerate"}
            </button>
          </section>
        </>
      )}
    </main>
  );
}

export default WorkoutPlanner;