import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<h2>Welcome to the Platform</h2>} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <h2>Login Page</h2>} />
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
            <h2>Profile</h2>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
