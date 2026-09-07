import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

function Login() {
  document.title = "Login | Research Intelligence Platform";

  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Login API
      const session = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      // Store JWT temporarily so /users/me can use it
      localStorage.setItem("auth_token", session.access_token);

      // Get current user details
      const user = await apiRequest("/users/me");

      // Update global authentication state
      login(session.access_token, user);

      // Go to profile after successful login
      navigate("/profile", { replace: true });
    } catch (requestError) {
      console.error("Login error:", requestError);
      setError(
        requestError.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">

        {/* Left Section */}
        <div className="login-intro">
          <h1>
            Research Funding
            <br />
            &amp; Innovation
          </h1>

          <p>
            Intelligent insights for research,
            funding and innovation.
          </p>
        </div>

        {/* Right Section */}
        <div className="login-card">
          <h2>Welcome back</h2>

          <p className="login-subtitle">
            Sign in to continue to your account
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email">Email</label>

              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password">Password</label>

              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={() => setError("Google login is not available yet.")}
          >
            Continue with Google
          </button>

          <p className="register-text">
            Don't have an account?{" "}
            <Link to="/register" className="register-link">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;