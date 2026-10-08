import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 * 
 * Logic:
 *  1. No session       → /login
 *  2. Session + profile incomplete → /complete-profile
 *  3. Session + profile complete   → render children
 * 
 * Props:
 *  requireProfileComplete (bool, default true) — set false for /complete-profile itself
 */
export default function ProtectedRoute({ children, requireProfileComplete = true }) {
  const { user, profileComplete, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return; // still initialising auth

    if (!user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    if (requireProfileComplete && profileComplete === false) {
      navigate('/complete-profile', { replace: true });
      return;
    }

    setReady(true);
  }, [user, profileComplete, loading, requireProfileComplete]);

  if (loading || !ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#F8FAFC', flexDirection: 'column', gap: 16,
      }}>
        <Loader2 size={36} color="#2563EB" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748B', fontSize: 14, fontWeight: 500 }}>Loading your intelligence platform…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return children;
}
