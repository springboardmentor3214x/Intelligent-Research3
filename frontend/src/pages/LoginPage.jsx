/**
 * pages/LoginPage.jsx
 * ──────────────────────────────────────────────────────────────
 * NOTE: This is a stub page for Pair B (Kaviya — Member 4).
 * The full implementation belongs to Pair A (Member 2 — frontend).
 * Once Pair A's work is merged, this file should be replaced.
 *
 * This stub provides:
 *   - A functional login form that calls POST /auth/login
 *   - On success, calls AuthContext.login(token, user)
 *   - Basic form validation + error display
 * ──────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginRequest } from '../services/api';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginRequest(form.email, form.password);
      /* Expected response: { access_token, token_type, user } */
      login(data.access_token, data.user);
      /* AuthContext.login() triggers isAuthenticated → PublicRoute redirects to /dashboard */
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center">
      <div className="auth-card card animate-scale">
        {/* Brand */}
        <div className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to Intelligent Research Platform</p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 'var(--space-md)' }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" id="link-go-register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
