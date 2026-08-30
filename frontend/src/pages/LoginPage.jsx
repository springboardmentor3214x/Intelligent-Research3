import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      navigate('/profile', { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="login-eyebrow">Research intelligence platform</p>
        <h1 id="login-title">Sign in</h1>
        <p className="login-description">Access your research profile and professional record.</p>
        {error ? <p className="login-error" role="alert">{error}</p> : null}
        <form className="login-form" onSubmit={handleSubmit}>
          <label><span>Email</span><input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" /></label>
          <label><span>Password</span><input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" /></label>
          <button className="login-submit" type="submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
        </form>
        <p className="login-footer">Need an account? <Link to="/register">Register</Link></p>
      </section>
    </main>
  );
}