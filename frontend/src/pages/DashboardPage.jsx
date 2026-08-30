/**
 * pages/DashboardPage.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * The authenticated home page. Shows:
 *   - Welcome hero card with user's name + role
 *   - Stat / module cards (placeholders for future milestones)
 *   - Quick-action links
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card card card-sm animate-scale" style={{ '--accent': color }}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function ModuleCard({ icon, title, description, badge, link }) {
  return (
    <Link to={link} className="module-card card card-sm">
      <div className="module-card-header">
        <span className="module-card-icon">{icon}</span>
        {badge && <span className="badge badge-user">{badge}</span>}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="module-card-arrow">→</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, role } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName = user?.name || user?.email?.split('@')[0] || 'Researcher';

  return (
    <div className="page container animate-fade">
      {/* ── Hero welcome card ── */}
      <div className="dashboard-hero card">
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-text">
            <p className="dashboard-greeting">{greeting},</p>
            <h1 className="dashboard-name">{displayName} 👋</h1>
            <p className="dashboard-subtitle">
              Welcome to the Intelligent Research Platform. Explore your profile,
              manage publications, and connect with collaborators.
            </p>
            <div className="dashboard-hero-actions">
              <Link to="/profile" className="btn btn-primary" id="btn-go-to-profile">
                View Profile
              </Link>
              {role === 'admin' && (
                <Link to="/admin" className="btn btn-secondary" id="btn-go-to-admin">
                  ⚙ Admin Panel
                </Link>
              )}
            </div>
          </div>
          <div className="dashboard-hero-badge">
            <div className="avatar avatar-lg">{displayName[0]?.toUpperCase()}</div>
            <div
              className={`badge ${
                role === 'admin'
                  ? 'badge-admin'
                  : role === 'researcher'
                  ? 'badge-researcher'
                  : 'badge-user'
              }`}
              style={{ marginTop: '8px' }}
            >
              {role ?? 'user'}
            </div>
          </div>
        </div>
        <div className="dashboard-hero-glow" aria-hidden="true" />
      </div>

      {/* ── Stats row ── */}
      <section className="dashboard-section" aria-label="Quick stats">
        <h2 className="dashboard-section-title">Overview</h2>
        <div className="grid-3">
          <StatCard icon="📄" label="Publications" value="—" color="hsl(230,85%,60%)" />
          <StatCard icon="🔬" label="Research Areas" value="—" color="hsl(195,100%,50%)" />
          <StatCard icon="⚡" label="Patents" value="—" color="hsl(270,75%,65%)" />
        </div>
      </section>

      {/* ── Module cards ── */}
      <section className="dashboard-section" aria-label="Platform modules">
        <h2 className="dashboard-section-title">Modules</h2>
        <div className="grid-2">
          <ModuleCard
            icon="👤"
            title="Research Profile"
            description="View and edit your research areas, keywords, organization info, publications and patents."
            link="/profile"
          />
          <ModuleCard
            icon="🔒"
            title="Account Settings"
            description="Update your name, email, and security preferences."
            badge="Coming soon"
            link="/profile"
          />
        </div>
      </section>
    </div>
  );
}
