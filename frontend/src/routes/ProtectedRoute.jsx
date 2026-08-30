/**
 * routes/ProtectedRoute.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * A reusable route guard that:
 *   1. Shows a loading screen while auth state is being determined
 *   2. Redirects unauthenticated users to /login
 *   3. Redirects authenticated users with wrong role to /unauthorized
 *   4. Renders children for authorised users
 *
 * Usage:
 *   <ProtectedRoute>                          // any authenticated user
 *   <ProtectedRoute allowedRoles={['admin']}> // admin only
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
      background: 'var(--clr-bg-base)',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid var(--clr-border)',
        borderTopColor: 'var(--clr-primary)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
        Verifying session…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  /* Still resolving the stored token with the server */
  if (loading) return <LoadingScreen />;

  /* Not logged in → go to login */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /* Logged in but role not permitted → go to 403 page */
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    !allowedRoles.map((r) => r.toLowerCase()).includes((role || '').toLowerCase())
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  /* All checks passed */
  return children;
}
