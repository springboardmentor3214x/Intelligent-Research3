import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('access_token');
    const authError = params.get('error');

    if (authError) {
      setError(decodeURIComponent(authError));
      return;
    }

    if (token) {
      setGoogleLoading(true);
      localStorage.setItem('auth_token', token);
      apiRequest('/users/me')
        .then((userData) => {
          login(token, userData);
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          setError(err.message || 'Google authentication failed.');
          setGoogleLoading(false);
        });
    }
  }, [login, navigate]);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const session = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      localStorage.setItem('auth_token', session.access_token);
      const user = await apiRequest('/users/me');
      login(session.access_token, user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    setGoogleLoading(true);
    const backendUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    window.location.href = `${backendUrl}/auth/google/login`;
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="login-eyebrow">Research intelligence platform</p>
        <h1 id="login-title">Sign in</h1>
        <p className="login-description">Access your research profile and professional record.</p>

        {error ? <p className="login-error" role="alert">{error}</p> : null}

        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignIn}
          disabled={submitting || googleLoading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. researcher@research.org"
              required
              autoComplete="email"
              disabled={submitting || googleLoading}
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={submitting || googleLoading}
            />
          </label>
          <button
            className="login-submit"
            type="submit"
            disabled={submitting || googleLoading}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            Quick Demo Accounts (1-Click Fill)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              style={{ flex: 1, padding: '6px 8px', fontSize: '0.76rem', fontWeight: '600', color: '#1e40af', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => setForm({ email: 'researcher@research.org', password: 'Password123!' })}
            >
              Researcher Account
            </button>
            <button
              type="button"
              style={{ flex: 1, padding: '6px 8px', fontSize: '0.76rem', fontWeight: '600', color: '#0f172a', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => setForm({ email: 'admin@research.org', password: 'Password123!' })}
            >
              Admin Account
            </button>
          </div>
        </div>

        <p className="login-footer">
          Need an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}