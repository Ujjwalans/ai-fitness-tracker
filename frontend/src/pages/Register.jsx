import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
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
      // Remove old authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const response = await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = response.data;

      if (!token) {
        throw new Error("Registration succeeded but no token was received.");
      }

      // Save authentication token
      localStorage.setItem("token", token);

      // Save user information
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Go to health profile
      navigate("/profile");
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">🌿</div>

        <h1>Create your account</h1>

        <form onSubmit={submit}>
          <label>
            Name
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

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
              placeholder="Create a password"
              minLength={6}
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            className="primary"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p>
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}