import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Clear any old token
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const response = await api.post("/auth/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = response.data;

      if (!token) {
        throw new Error("Login succeeded but no token was received.");
      }

      // Save new authentication token
      localStorage.setItem("token", token);

      // Save user information
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Go to dashboard
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back">
      <form onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p>
        New user? <Link to="/register">Create account</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🌿</div>

        <h1>{title}</h1>

        {children}
      </div>
    </div>
  );
}