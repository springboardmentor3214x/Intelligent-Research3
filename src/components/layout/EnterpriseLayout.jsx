import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import NotificationDrawer from '../notifications/NotificationDrawer';
import ToastContainer from '../notifications/ToastContainer';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  FileText,
  Cpu,
  Award,
  Rocket,
  FileBarChart2,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Compass,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import '../../styles/enterprise.css';

export const MODULE_REGISTRY = [
  {
    num: '01',
    id: 'dashboard',
    label: 'Analytics Dashboard',
    shortLabel: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    color: '#6366F1',
    glow: 'rgba(99, 102, 241, 0.35)',
    border: '#A5B4FC',
    bg: '#EEF2FF',
    badge: 'Unified KPIs',
  },
  {
    num: '02',
    id: 'research',
    label: 'Research Intelligence',
    shortLabel: 'Research',
    icon: TrendingUp,
    path: '/research',
    color: '#2563EB',
    glow: 'rgba(37, 99, 235, 0.35)',
    border: '#93C5FD',
    bg: '#EFF6FF',
    badge: 'OpenAlex / S2',
  },
  {
    num: '03',
    id: 'funding',
    label: 'Funding Intelligence',
    shortLabel: 'Funding',
    icon: DollarSign,
    path: '/funding',
    color: '#059669',
    glow: 'rgba(5, 150, 105, 0.35)',
    border: '#6EE7B7',
    bg: '#ECFDF5',
    badge: 'Grants.gov',
  },
  {
    num: '04',
    id: 'patents',
    label: 'Patent Landscape',
    shortLabel: 'Patents',
    icon: FileText,
    path: '/patents',
    color: '#7C3AED',
    glow: 'rgba(124, 58, 237, 0.35)',
    border: '#C4B5FD',
    bg: '#F5F3FF',
    badge: 'EPO OPS',
  },
  {
    num: '05',
    id: 'technology',
    label: 'Technology Intelligence',
    shortLabel: 'Technology',
    icon: Cpu,
    path: '/technology',
    color: '#0284C7',
    glow: 'rgba(2, 132, 199, 0.35)',
    border: '#7DD3FC',
    bg: '#E0F2FE',
    badge: 'TRL & Maturity',
  },
  {
    num: '06',
    id: 'innovation',
    label: 'Innovation Scoring',
    shortLabel: 'Innovation',
    icon: Award,
    path: '/innovation',
    color: '#D97706',
    glow: 'rgba(217, 119, 6, 0.35)',
    border: '#FCD34D',
    bg: '#FEF3C7',
    badge: '0-100 Score',
  },
  {
    num: '07',
    id: 'commercialization',
    label: 'Commercialization',
    shortLabel: 'Commercial',
    icon: Rocket,
    path: '/commercialization',
    color: '#0D9488',
    glow: 'rgba(13, 148, 136, 0.35)',
    border: '#5EEAD4',
    bg: '#CCFBF1',
    badge: 'Licensing / Spin-off',
  },
  {
    num: '08',
    id: 'alerts',
    label: 'Alert Intelligence',
    shortLabel: 'Alerts',
    icon: Bell,
    path: '/alerts',
    color: '#DC2626',
    glow: 'rgba(220, 38, 38, 0.35)',
    border: '#FCA5A5',
    bg: '#FEE2E2',
    badge: 'Event-Driven',
  },
  {
    num: '09',
    id: 'reports',
    label: 'Reports & Export',
    shortLabel: 'Reports',
    icon: FileBarChart2,
    path: '/reports',
    color: '#8B5CF6',
    glow: 'rgba(139, 92, 246, 0.35)',
    border: '#C7D2FE',
    bg: '#EEF2FF',
    badge: 'PDF / Excel',
  },
];

export default function EnterpriseLayout({
  activeModule = 'technology',
  moduleTitle = 'Intelligence Platform',
  activeView = 'dashboard',
  onViewChange = () => {},
  tabs = [],
  breadcrumbs = [],
  children,
}) {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RI';

  const roleName = profile?.role || 'Researcher';
  const orgName = profile?.organization || 'Institution';

  // Determine current active module object
  const currentModuleObj = MODULE_REGISTRY.find(
    (m) => m.id === activeModule || location.pathname.startsWith(m.path)
  ) || MODULE_REGISTRY[0];

  const activeTabObj = tabs.find((t) => t.id === activeView) || tabs[0];

  return (
    <div
      className="ri-layout themed-layout"
      style={{
        '--theme-active-color': currentModuleObj.color,
        '--theme-active-glow': currentModuleObj.glow,
        '--theme-active-border': currentModuleObj.border,
        '--theme-active-bg': currentModuleObj.bg,
      }}
    >
      {/* ==================================================================== */}
      {/* 1. LEFT SIDEBAR (Numbered Feature Modules: 01 - 09)                   */}
      {/* ==================================================================== */}
      <aside className="ri-sidebar themed-sidebar">
        <div className="ri-sidebar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <div
            className="ri-brand-badge"
            style={{
              background: `linear-gradient(135deg, #7C3AED 0%, #4338CA 50%, #0F172A 100%)`,
              boxShadow: `0 0 16px rgba(124, 58, 237, 0.45)`,
            }}
          >
            RI
          </div>
          <div className="ri-brand-info">
            <span className="ri-brand-title">SYSTEM MODULES</span>
            <span className="ri-brand-subtitle">Intelligence Platform</span>
          </div>
        </div>

        <nav className="ri-sidebar-nav">
          <div className="ri-nav-section-title">Core Platform Features</div>

          {MODULE_REGISTRY.map((mod) => {
            const Icon = mod.icon;
            const isCurrentModule =
              activeModule === mod.id || location.pathname.startsWith(mod.path);

            return (
              <button
                key={mod.path}
                className={`ri-module-btn ${isCurrentModule ? 'active-module' : ''}`}
                onClick={() => navigate(mod.path)}
                style={{
                  '--mod-color': mod.color,
                  '--mod-glow': mod.glow,
                  '--mod-border': mod.border,
                }}
              >
                <span className="ri-mod-number">{mod.num}</span>
                <div className="ri-mod-icon-wrap">
                  <Icon size={16} />
                </div>
                <div className="ri-mod-text">
                  <span className="ri-mod-label">{mod.shortLabel}</span>
                  <span className="ri-mod-sub">{mod.badge}</span>
                </div>
                {isCurrentModule && (
                  <div className="ri-mod-active-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Profile */}
        <div className="ri-sidebar-footer">
          <div className="ri-user-profile-widget">
            <div
              className="ri-user-avatar"
              style={{
                background: `linear-gradient(135deg, ${currentModuleObj.color} 0%, #1E293B 100%)`,
              }}
            >
              {initials}
            </div>
            <div className="ri-user-meta">
              <div className="ri-user-name" title={profile?.fullName || 'User'}>
                {profile?.fullName || 'Dr. Researcher'}
              </div>
              <div className="ri-user-role" title={orgName}>
                {roleName}
              </div>
            </div>
          </div>
          <div className="ri-footer-actions">
            <button className="ri-btn-action" onClick={() => navigate('/profile')} title="Profile Settings">
              <User size={13} />
              <span>Profile</span>
            </button>
            <button className="ri-btn-action ri-btn-logout" onClick={handleLogout} title="Sign Out">
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================================== */}
      {/* 2. MAIN CONTAINER WITH FLOATING VIOLET-INDIGO HEADER                  */}
      {/* ==================================================================== */}
      <div className="ri-main-container">
        {/* Floating Antigravity-Style Header */}
        <header className="ri-topbar elevated-antigravity-topbar">
          <div className="ri-topbar-left">
            <div className="ri-module-title-box">
              <span className="ri-module-num-badge">{currentModuleObj.num}</span>
              <span className="ri-module-title-text">{moduleTitle}</span>
            </div>

            {/* TOP SUB-FEATURES DROPDOWN (Kompact AI Community Reference Style) */}
            {tabs.length > 0 && (
              <div className="ri-subfeature-dropdown-wrapper" ref={dropdownRef}>
                <button
                  className={`ri-subfeature-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    borderColor: dropdownOpen ? '#C084FC' : 'rgba(255, 255, 255, 0.16)',
                    boxShadow: dropdownOpen ? `0 0 16px rgba(192, 132, 252, 0.4)` : undefined,
                  }}
                >
                  <Sparkles size={15} style={{ color: '#C084FC' }} />
                  <span className="ri-subfeature-trigger-text">
                    {activeTabObj?.label || 'Select Sub-Feature'}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`ri-dropdown-chevron ${dropdownOpen ? 'rotate' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="ri-subfeature-menu-popover popover-elevated fadeIn">
                    <div className="ri-menu-popover-header">
                      <span>{moduleTitle} Sub-Features</span>
                      <span className="ri-menu-count-pill">{tabs.length} Features</span>
                    </div>

                    <div className="ri-menu-items-list">
                      {tabs.map((tab) => {
                        const Icon = tab.icon || LayoutDashboard;
                        const isTabActive = activeView === tab.id;
                        return (
                          <button
                            key={tab.id}
                            className={`ri-menu-item-row ${isTabActive ? 'active' : ''}`}
                            onClick={() => {
                              onViewChange(tab.id);
                              setDropdownOpen(false);
                            }}
                          >
                            <div className="ri-menu-item-icon">
                              <Icon size={16} />
                            </div>
                            <div className="ri-menu-item-info">
                              <div className="ri-menu-item-title">{tab.label}</div>
                              {tab.description && (
                                <div className="ri-menu-item-desc">{tab.description}</div>
                              )}
                            </div>
                            {isTabActive && (
                              <CheckCircle size={14} className="ri-menu-item-check" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Status, Notification, and User Pill */}
          <div className="ri-topbar-right">
            <div className="ri-status-pill elevated-status-pill">
              <span className="ri-status-dot pulseSoft" style={{ background: '#34D399' }} />
              <span>Live Multi-Source Index</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            <div className="ri-top-user-chip">
              <span className="ri-top-user-name">
                {profile?.fullName || 'Dr. Researcher'}
              </span>
              <span
                className="ri-top-role-badge elevated-role-badge"
              >
                {roleName}
              </span>
            </div>
          </div>
        </header>

        {/* ================================================================== */}
        {/* 3. DYNAMIC CONTENT BODY WITH THEMED GLOWING BORDER                 */}
        {/* ================================================================== */}
        <main className="ri-content-body themed-content-card">
          {children}
        </main>
      </div>

      {/* Global Notification Slide-Over Drawer */}
      <NotificationDrawer />

      {/* Global Toast Alert Banner */}
      <ToastContainer />
    </div>
  );
}


