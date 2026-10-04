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
import AnalyticsDashboard from '../pages/modules/AnalyticsDashboard';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import ProtectedRoute from './ProtectedRoute';
import AdminPage from '../pages/AdminPage';

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
        path="/tech-intel/:techId"
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
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
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