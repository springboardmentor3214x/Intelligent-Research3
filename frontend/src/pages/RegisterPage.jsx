/**
 * pages/RegisterPage.jsx
 * Full User Registration implementation matching Module 1 requirements:
 * Fields: Name, Email, Password, Role, Phone, Organization, Designation, Country, Research Domain.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerRequest } from '../services/api';
import './AuthPage.css';

const ROLES = [
  { value: 'Researcher', label: 'Researcher' },
  { value: 'Startup Founder', label: 'Startup Founder' },
  { value: 'Innovation Manager', label: 'Innovation Manager' },
  { value: 'Administrator', label: 'Administrator' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Researcher',
    phone_number: '',
    organization: '',
    designation: '',
    country: '',
    research_domain: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, Email, and Password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await registerRequest({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      });
      navigate('/login?registered=true');
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
        err?.message ||
        'Registration failed. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-center" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card card animate-scale" style={{ maxWidth: '640px' }}>
        <div className="auth-brand">
          <span className="auth-brand-icon">⬡</span>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the Research Funding & Innovation Platform</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          className="google-auth-btn"
          onClick={() => {
            const backendUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
            window.location.href = `${backendUrl}/auth/google/login`;
          }}
          disabled={loading}
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
          Continue with Google
        </button>

        <div className="auth-or-divider">
          <span>or register with details</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full Name *</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="Dr. Alan Turing"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email Address *</label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="alan@institution.edu"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password * (Min. 8 chars)</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-role" className="form-label">Platform Role *</label>
              <select
                id="reg-role"
                name="role"
                className="form-input"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
                style={{ background: 'var(--clr-surface)', color: 'var(--clr-text)' }}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">Phone Number</label>
              <input
                id="reg-phone"
                name="phone_number"
                type="tel"
                className="form-input"
                placeholder="+1 (555) 019-2834"
                value={form.phone_number}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-org" className="form-label">Organization / University</label>
              <input
                id="reg-org"
                name="organization"
                type="text"
                className="form-input"
                placeholder="MIT / DeepMind Research"
                value={form.organization}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-desig" className="form-label">Designation / Title</label>
              <input
                id="reg-desig"
                name="designation"
                type="text"
                className="form-input"
                placeholder="Principal Investigator / Founder"
                value={form.designation}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-country" className="form-label">Country</label>
              <input
                id="reg-country"
                name="country"
                type="text"
                className="form-input"
                placeholder="United States / India / UK"
                value={form.country}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="reg-domain" className="form-label">Primary Research Domain</label>
            <input
              id="reg-domain"
              name="research_domain"
              type="text"
              className="form-input"
              placeholder="Artificial Intelligence, Quantum Computing, Biotechnology..."
              value={form.research_domain}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '1.5rem', padding: '0.85rem' }}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Complete Registration'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" id="link-go-login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

