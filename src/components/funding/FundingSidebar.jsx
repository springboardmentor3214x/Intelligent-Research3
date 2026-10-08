import {
  LayoutDashboard, Search, Sparkles, Bookmark, Clock, Scale,
  User, LogOut, TrendingUp, FlaskConical, Home, ChevronRight, Cpu, Award, Rocket,
  BarChart3, Bell, FileBarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Funding Dashboard', icon: LayoutDashboard },
  { id: 'search', label: 'Funding Search', icon: Search },
  { id: 'recommended', label: 'Recommended Funding', icon: Sparkles },
  { id: 'deadlines', label: 'Deadline Tracker', icon: Clock },
  { id: 'comparison', label: 'Funding Comparison', icon: Scale },
  { id: 'saved', label: 'Saved Funding', icon: Bookmark, showCount: true },
];

const MODULE_LINKS = [
  { label: 'Module 3: Research Intelligence', icon: TrendingUp, path: '/research', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Module 5: Patent Landscape', icon: FlaskConical, path: '/patents', color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Module 6: Technology Intelligence', icon: Cpu, path: '/technology', color: '#0284C7', bg: '#E0F2FE' },
  { label: 'Module 7: Innovation Scoring', icon: Award, path: '/innovation', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Module 8: Commercialization', icon: Rocket, path: '/commercialization', color: '#0D9488', bg: '#CCFBF1' },
  { label: 'Module 9: Analytics Dashboard', icon: BarChart3, path: '/dashboard', color: '#1E293B', bg: '#F1F5F9' },
  { label: 'Module 10: Intelligence Alerts', icon: Bell, path: '/alerts', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Module 11: Reports & Export', icon: FileBarChart2, path: '/reports', color: '#4F46E5', bg: '#EEF2FF' },
  { label: 'Back to Portal', icon: Home, path: '/', color: '#475569', bg: '#F1F5F9' },
];

export default function FundingSidebar({ currentView, setCurrentView, savedCount = 0 }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FI';

  return (
    <aside className="ri-sidebar">
      {/* Brand Header */}
      <div className="ri-sidebar-brand">
        <div className="ri-brand-badge" style={{ background: 'linear-gradient(135deg, #0F2744 0%, #047857 100%)' }}>
          FI
        </div>
        <div className="ri-brand-info">
          <span className="ri-brand-title">Funding Intelligence</span>
          <span className="ri-brand-subtitle">Module 4 · Grants.gov API</span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="ri-sidebar-nav">
        <div className="ri-nav-section-title">Navigation</div>

        {NAV_ITEMS.map(({ id, label, icon: Icon, showCount }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              className={`ri-nav-item${isActive ? ' fi-nav-active' : ''}`}
              onClick={() => setCurrentView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {showCount && savedCount > 0 && (
                <span className="ri-nav-badge" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>
                  {savedCount}
                </span>
              )}
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6, color: '#047857' }} />}
            </button>
          );
        })}

        {/* Cross-Module Navigation */}
        <div style={{ marginTop: '12px' }}>
          <div className="ri-nav-section-title">Other Modules</div>
          {MODULE_LINKS.map(({ label, icon: Icon, path, color, bg }) => (
            <button
              key={path}
              className="ri-nav-item ri-nav-module-link"
              onClick={() => navigate(path)}
              style={{ '--module-link-color': color, '--module-link-bg': bg }}
            >
              <Icon size={16} />
              <span>{label}</span>
              <ChevronRight size={13} style={{ marginLeft: 'auto' }} />
            </button>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer User Widget */}
      <div className="ri-sidebar-footer">
        <div className="ri-user-profile-widget">
          <div className="ri-user-avatar" style={{ background: 'linear-gradient(135deg, #047857, #0F2744)' }}>
            {initials}
          </div>
          <div className="ri-user-meta">
            <div className="ri-user-name" title={profile?.fullName || 'User'}>
              {profile?.fullName || 'Research Fellow'}
            </div>
            <div className="ri-user-role" title={profile?.organization || 'Institution'}>
              {profile?.role || 'Researcher'}
            </div>
          </div>
        </div>

        <div className="ri-footer-actions">
          <button
            className="ri-btn-action"
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            <User size={13} />
            <span>Profile</span>
          </button>
          <button
            className="ri-btn-action ri-btn-logout"
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
