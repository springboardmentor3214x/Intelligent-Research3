import { Navigate, Route, Routes } from 'react-router-dom';

import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResearchProfile from '../pages/ResearchProfile';
import FundingOpportunitiesPage from '../pages/modules/FundingOpportunitiesPage';
import ResearchTrendsPage from '../pages/modules/ResearchTrendsPage';
import PatentIntelligencePage from '../pages/modules/PatentIntelligencePage';
import TechnologyIntelligencePage from '../pages/modules/TechnologyIntelligencePage';
import InnovationScorePage from '../pages/modules/InnovationScorePage';
import CommercializationPage from '../pages/modules/CommercializationPage';
import NotificationsPage from '../pages/modules/NotificationsPage';
import ReportsExportPage from '../pages/modules/ReportsExportPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ProtectedRoute from './ProtectedRoute';

function AdminPage() {
  return (
    <DashboardLayout pageTitle="Admin Control Panel" breadcrumbs={["Platform Administration", "Control Panel"]}>
      <div className="enterprise-panel">
        <h2 style={{ margin: '0 0 8px', color: '#0f172a' }}>⚙ Platform Administration</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Manage user permissions, institutional access, API rate limits, and audit logs.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/research-profile"
        element={
          <ProtectedRoute>
            <ResearchProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Navigate to="/research-profile" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/funding"
        element={
          <ProtectedRoute>
            <FundingOpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/trends"
        element={
          <ProtectedRoute>
            <ResearchTrendsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patent-intel"
        element={
          <ProtectedRoute>
            <PatentIntelligencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech-intel"
        element={
          <ProtectedRoute>
            <TechnologyIntelligencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/innovation-score"
        element={
          <ProtectedRoute>
            <InnovationScorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/commercialization"
        element={
          <ProtectedRoute>
            <CommercializationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'administrator']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}