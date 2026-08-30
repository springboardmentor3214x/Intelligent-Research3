import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<h2>Welcome to the Platform</h2>} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <h2>Register Page</h2>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <h2>Dashboard</h2>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}