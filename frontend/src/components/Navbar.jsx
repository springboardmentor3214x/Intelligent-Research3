/**
 * components/Navbar.jsx
 * Author: Kaviya (Member 4 — Pair B Frontend)
 *
 * Responsive top navigation bar with:
 *   - Brand logo / name
 *   - Role-based nav links (admin sees extra "Admin" link)
 *   - User avatar + name display
 *   - Logout button with hover animation
 *
 * Uses useAuth() to read user, role, and logout action.
 */

import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function RoleBadge({ role }) {
  const cls = role === 'admin'
    ? 'badge badge-admin'
    : role === 'researcher'
      ? 'badge badge-researcher'
      : 'badge badge-user';

  return <span className={cls}>{role ?? 'user'}</span>;
}

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  async function handleLogout() {
    setLoggingOut(true);
    // Small delay for visual feedback before navigation
    await new Promise((r) => setTimeout(r, 200));
    logout();
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '⬡' },
    { to: '/profile',   label: 'Profile',   icon: '◎' },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: '⚙' }] : []),
  ];

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-inner">
        {/* ── Brand ── */}
        <Link to="/dashboard" className="navbar-brand" id="navbar-brand-link">
          <span className="navbar-brand-icon">⬡</span>
          <span className="navbar-brand-text">IntelliResearch</span>
        </Link>

        {/* ── Desktop nav links ── */}
        <ul className="navbar-links" role="list">
          {navLinks.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                id={`nav-link-${label.toLowerCase()}`}
                className={({ isActive }) =>
                  `navbar-link ${isActive ? 'navbar-link--active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <span className="navbar-link-icon">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Right side: user info + logout ── */}
        <div className="navbar-user">
          <div className="navbar-user-info">
            <div className="avatar" aria-hidden="true">{initials}</div>
            <div className="navbar-user-details">
              <span className="navbar-user-name">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </span>
              <RoleBadge role={role} />
            </div>
          </div>

          <button
            id="btn-logout"
            className="btn btn-ghost btn-sm navbar-logout"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Log out"
          >
            {loggingOut ? <span className="spinner" /> : (
              <>
                <span>↪</span>
                <span>Logout</span>
              </>
            )}
          </button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className={`navbar-hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div className="navbar-mobile-menu animate-scale">
          <ul role="list">
            {navLinks.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `navbar-mobile-link ${isActive ? 'navbar-link--active' : ''}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  {icon} {label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="navbar-mobile-user">
            <div className="avatar">{initials}</div>
            <div>
              <div className="navbar-user-name">
                {user?.name || user?.email?.split('@')[0]}
              </div>
              <RoleBadge role={role} />
            </div>
          </div>
          <button
            className="btn btn-danger btn-full"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <span className="spinner" /> : '↪ Logout'}
          </button>
        </div>
      )}
    </nav>
  );
}
