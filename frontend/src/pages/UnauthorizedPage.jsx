/**
 * pages/UnauthorizedPage.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * 403 page shown when a user tries to access a route
 * they don't have the right role for.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UnauthorizedPage.css';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="page-center">
      <div className="unauthorized-card card animate-scale">
        <div className="unauthorized-icon" aria-hidden="true">🔒</div>
        <h1 className="unauthorized-code">403</h1>
        <h2 className="unauthorized-title">Access Denied</h2>
        <p className="unauthorized-msg">
          You don't have permission to view this page.
          If you believe this is a mistake, please contact your administrator.
        </p>
        <div className="unauthorized-actions">
          <button
            id="btn-go-back"
            className="btn btn-primary"
            onClick={() => navigate(-1)}
          >
            ← Go Back
          </button>
          <button
            id="btn-go-dashboard"
            className="btn btn-secondary"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            {isAuthenticated ? 'Dashboard' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
