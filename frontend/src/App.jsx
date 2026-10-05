import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import HealthProfile from "./pages/HealthProfile";
import Nutrition from "./pages/Nutrition";
import DailyCheckin from "./pages/DailyCheckin";
import WeeklyReport from "./pages/WeeklyReport";
import SmartNutrition from "./pages/SmartNutrition";
import WorkoutPlanner from "./pages/WorkoutPlanner";
import StyleAdvisor from "./pages/StyleAdvisor";
/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* =========================================================
   PUBLIC ROUTE
========================================================= */

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/* =========================================================
   NAVBAR
========================================================= */

function Navbar({ loggedIn, setLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setLoggedIn(false);
    navigate("/login");
  };

  /* Don't show application navbar on auth pages */
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <header className="app-navbar">
      <div className="navbar-inner">

        {/* LOGO */}
        <NavLink to={loggedIn ? "/dashboard" : "/"} className="brand">
          <div className="brand-icon">🌿</div>

          <div className="brand-text">
            <span className="brand-name">Wellness AI</span>
            <span className="brand-tagline">Your intelligent wellness companion</span>
          </div>
        </NavLink>

        {/* NAVIGATION */}
        <nav className="main-navigation">

          {loggedIn ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>📊</span>
                Dashboard
              </NavLink>

              <NavLink
                to="/health-profile"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>👤</span>
                Health Profile
              </NavLink>

              <NavLink
                to="/nutrition"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span>🥗</span>
                Nutrition
              </NavLink>
              <NavLink
  to="/workout"
  className="nav-link"
>
  🏋️ Workout
</NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="nav-link"
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="nav-signup"
              >
                Sign Up
              </NavLink>
            </>
          )}

        </nav>

        {/* RIGHT SIDE */}
        {loggedIn && (
          <div className="navbar-user">

            <div className="user-avatar">
              👋
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>
        )}

      </div>
    </header>
  );
}

/* =========================================================
   APP SHELL
========================================================= */

function AppContent() {
  const location = useLocation();

  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  /*
    Check token whenever route changes.
    This keeps navbar state synchronized after login/logout.
  */
  useEffect(() => {
    setLoggedIn(Boolean(localStorage.getItem("token")));
  }, [location.pathname]);

  return (
    <div className="app">

      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
      />

      <main className="app-content">
        <Routes>

          {/* =================================================
              DEFAULT
          ================================================= */}

          <Route
            path="/"
            element={
              loggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* =================================================
              AUTH
          ================================================= */}

          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* =================================================
              DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              PROFILE
          ================================================= */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              HEALTH PROFILE
          ================================================= */}

          <Route
            path="/health-profile"
            element={
              <ProtectedRoute>
                <HealthProfile />
              </ProtectedRoute>
            }
          />

          {/* =================================================
              NUTRITION
          ================================================= */}

          <Route
            path="/nutrition"
            element={
              <ProtectedRoute>
                <Nutrition />
              </ProtectedRoute>
            }
          />
          <Route
  path="/weekly-report"
  element={
    <ProtectedRoute>
      <WeeklyReport />
    </ProtectedRoute>
  }
/>
<Route
  path="/smart-nutrition"
  element={
    <ProtectedRoute>
      <SmartNutrition />
    </ProtectedRoute>
  }
/>
<Route
  path="/workout"
  element={
    <ProtectedRoute>
      <WorkoutPlanner />
    </ProtectedRoute>
  }
/>
<Route path="/style-advisor" element={<StyleAdvisor />} />
          {/* =================================================
              FALLBACK
          ================================================= */}

          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />
            <Route
  path="/checkin"
  element={
    <ProtectedRoute>
      <DailyCheckin />
    </ProtectedRoute>
  }
/>
        </Routes>
      </main>

    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;