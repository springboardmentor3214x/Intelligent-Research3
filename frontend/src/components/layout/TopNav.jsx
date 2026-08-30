import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  HelpCircle,
  Menu,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./TopNav.css";

export default function TopNav({ pageTitle = "Research Profile", breadcrumbs = ["Research Intelligence", "Research Profile"], onToggleSidebar }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const displayName = user?.name || user?.email?.split("@")[0] || "Dr. Priya Sharma";
  const userRole = role || "Researcher";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="enterprise-topnav">
      <div className="topnav-left">
        <button
          type="button"
          className="topnav-menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="topnav-breadcrumbs-wrap">
          <nav className="topnav-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <span className="breadcrumb-separator">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? "breadcrumb-current" : "breadcrumb-parent"}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <h1 className="topnav-page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="topnav-right">
        <button type="button" className="topnav-action-btn" title="Platform Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        <button type="button" className="topnav-action-btn" title="Documentation & Guidance">
          <HelpCircle size={18} />
        </button>

        <div className="topnav-user-menu" ref={dropdownRef}>
          <button
            type="button"
            className="user-profile-button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <div className="user-avatar-circle">{initials}</div>
            <div className="user-text-info">
              <span className="user-name-text">{displayName}</span>
              <span className="user-role-badge">{userRole}</span>
            </div>
            <ChevronDown size={14} className={`dropdown-caret ${dropdownOpen ? "caret-up" : ""}`} />
          </button>

          {dropdownOpen && (
            <div className="topnav-dropdown animate-fade-in">
              <div className="dropdown-user-header">
                <strong>{displayName}</strong>
                <small>{user?.email || "priya.sharma@research.org"}</small>
              </div>
              <div className="dropdown-divider" />
              <Link
                to="/research-profile"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={15} />
                <span>My Research Profile</span>
              </Link>
              <Link
                to="/dashboard"
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Sparkles size={15} />
                <span>Intelligence Dashboard</span>
              </Link>
              {userRole === "admin" || userRole === "Administrator" ? (
                <Link
                  to="/admin"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Shield size={15} />
                  <span>Admin Control Panel</span>
                </Link>
              ) : null}
              <div className="dropdown-divider" />
              <button
                type="button"
                className="dropdown-item dropdown-logout-btn"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}