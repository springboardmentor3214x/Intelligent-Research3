/**
 * routes/AppRoutes.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * Central route configuration for the application.
 *
 * Route map:
 *   /               → redirect to /dashboard (if logged in) or /login
 *   /login          → LoginPage  (public; redirect to /dashboard if already logged in)
 *   /register       → RegisterPage (public; redirect to /dashboard if already logged in)
 *   /dashboard      → DashboardPage (protected: any authenticated role)
 *   /profile        → ProfilePage   (protected: any authenticated role)
 *   /admin          → AdminPage     (protected: role=admin only)
 *   /unauthorized   → UnauthorizedPage (public 403 page)
 *   *               → redirect to /dashboard or /login
 */

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Navbar from '../components/Navbar';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

/* ── Lazy-loaded public pages (Pair A's work — stubs until merged) ── */
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

/* ── Authenticated layout wrapper (adds Navbar) ── */
function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '70px' }}>
        {children}
      </main>
    </>
  );
}

/* ── Guard for public routes: redirect to /dashboard if already logged in ── */
function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Wait for auth resolution
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* ── Root redirect ── */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />

      {/* ── Public routes ── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ── Protected routes (any authenticated user) ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthLayout>
              <DashboardPage />
            </AuthLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AuthLayout>
              <ProfilePage />
            </AuthLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Admin-only route ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuthLayout>
              <div className="page container animate-fade">
                <div className="page-header">
                  <h1>Admin Panel</h1>
                  <p>Manage users, roles, and system settings.</p>
                </div>
                <div className="card">
                  <p style={{ color: 'var(--clr-text-muted)' }}>
                    Admin features will be added in a future milestone.
                  </p>
                </div>
              </div>
            </AuthLayout>
          </ProtectedRoute>
        }
      />

      {/* ── Catch-all ── */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
