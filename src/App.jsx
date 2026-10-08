import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ResearchDashboard from './pages/research/ResearchDashboard';
import FundingDashboard from './pages/funding/FundingDashboard';
import PatentDashboard from './pages/patents/PatentDashboard';
import TechnologyDashboard from './pages/technology/TechnologyDashboard';
import InnovationDashboard from './pages/innovation/InnovationDashboard';
import CommercializationDashboard from './pages/commercialization/CommercializationDashboard';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import MainDashboard from './pages/dashboard/MainDashboard';
import CompleteProfilePage from './pages/CompleteProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* First-time Profile Completion Onboarding (requires auth, but not complete profile) */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute requireProfileComplete={false}>
                <CompleteProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Module 2: Research Profile Management */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireProfileComplete={false}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Module 3: Research Intelligence Dashboard */}
          <Route
            path="/research"
            element={
              <ProtectedRoute>
                <ResearchDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/research/*"
            element={
              <ProtectedRoute>
                <ResearchDashboard />
              </ProtectedRoute>
            }
          />
          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainDashboard />
              </ProtectedRoute>
            }
          />

          {/* Module 4: Funding Intelligence */}
          <Route
            path="/funding"
            element={
              <ProtectedRoute>
                <FundingDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding/*"
            element={
              <ProtectedRoute>
                <FundingDashboard />
              </ProtectedRoute>
            }
          />

          {/* Module 5: Patent Landscape */}
          <Route
            path="/patents"
            element={
              <ProtectedRoute>
                <PatentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patents/*"
            element={
              <ProtectedRoute>
                <PatentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Module 6: Technology Intelligence */}
          <Route
            path="/technology"
            element={
              <ProtectedRoute>
                <TechnologyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/technology/*"
            element={
              <ProtectedRoute>
                <TechnologyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Module 7: Innovation Scoring Engine */}
          <Route
            path="/innovation"
            element={
              <ProtectedRoute>
                <InnovationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/innovation/*"
            element={
              <ProtectedRoute>
                <InnovationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Module 8: Commercialization Recommendation */}
          <Route
            path="/commercialization"
            element={
              <ProtectedRoute>
                <CommercializationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/commercialization/*"
            element={
              <ProtectedRoute>
                <CommercializationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Platform Reports & Alerts */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
