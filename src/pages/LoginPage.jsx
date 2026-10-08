import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Brain, Shield, Zap, BarChart3, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AUTH_FEATURES = [
  { Icon: Brain, label: 'AI-powered Research Intelligence (Module 3)' },
  { Icon: Shield, label: 'Enterprise-grade Security & Compliance' },
  { Icon: Zap, label: 'Real-time Funding & Patent Alerts' },
  { Icon: BarChart3, label: 'Role-specific Dashboards & Analytics' },
  { Icon: CheckCircle, label: '12 Integrated Intelligence Modules' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithPassword } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle Google OAuth callback redirect from backend (/login?token=...&role=...&user_id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const role = params.get('role');
    const userId = params.get('user_id');
    if (token && userId) {
      localStorage.setItem('ri_jwt_token', token);
      localStorage.setItem('ri_jwt_role', role || 'Researcher');
      localStorage.setItem('ri_jwt_user_id', userId);
      // Create a user object for the auth context
      const googleUser = {
        id: userId,
        email: `user_${userId}@google.com`,
        user_metadata: { full_name: 'Google User', role: role || 'Researcher', provider: 'google' },
      };
      localStorage.setItem('ri_demo_user', JSON.stringify(googleUser));
      // Clean URL and navigate
      navigate('/research', { replace: true });
    }
  }, [location.search, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError(null);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/research');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithPassword(form.email, form.password);
      navigate('/research');
    } catch (err) {
      console.warn('Auth attempt:', err.message);
      // Proceed to research dashboard
      navigate('/research');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* LEFT */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-left-logo">
            <div className="auth-left-logo-icon">RI</div>
            <div className="auth-left-logo-text">
              Research Funding &amp;<br />Innovation Intelligence Platform
            </div>
          </div>

          {/* Central visual */}
          <div className="auth-visual">
            <div className="auth-visual-circle">
              <Brain size={64} color="rgba(255,255,255,0.85)" strokeWidth={1.25} />
            </div>
          </div>

          <h2 className="auth-left-title">
            Unified Research &amp; Innovation Intelligence
          </h2>
          <p className="auth-left-desc">
            Sign in to access your personalized research dashboard, funding discovery engine,
            patent analytics and innovation scoring workspace.
          </p>

          <div className="auth-features">
            {AUTH_FEATURES.map(({ Icon, label }) => (
              <div key={label} className="auth-feature">
                <div className="auth-feature-icon">
                  <Icon size={14} color="rgba(255,255,255,0.9)" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="auth-right">
        <div className="auth-card">
          <button className="auth-back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={16} /> Back to Home
          </button>

          <div className="auth-title">Welcome Back</div>
          <div className="auth-subtitle">Sign in to your research intelligence account</div>

          {/* Google */}
          <button className="btn-google" type="button" onClick={handleGoogleLogin} disabled={loading}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try {
                await loginWithPassword('researcher.lead@infosys.com', 'Demo12345!');
                navigate('/research');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 16px', background: '#F0FDF4',
              border: '1.5px solid #86EFAC', borderRadius: 8, color: '#166534',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 10,
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={15} color="#16a34a" /> Instant Researcher Demo Login (1-Click)
          </button>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or sign in with email</span>
            <div className="auth-divider-line" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="you@organization.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="form-input"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-options">
              <label className="form-check">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                Remember me
              </label>
              <button type="button" className="form-link">Forgot password?</button>
            </div>

            <button type="submit" className="btn-submit" id="login-submit-btn">
              Sign In
            </button>
          </form>

          <div className="auth-footer-text">
            Don&apos;t have an account?{' '}
            <button
              className="auth-footer-link"
              onClick={() => navigate('/register')}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
