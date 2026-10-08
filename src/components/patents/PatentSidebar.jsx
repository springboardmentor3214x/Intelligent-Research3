import {
  LayoutDashboard, Search, Network, TrendingUp, Building2, GitMerge, Bookmark,
  User, LogOut, DollarSign, FlaskConical, Home, ChevronRight, Cpu, Award, Rocket,
  BarChart3, Bell, FileBarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Patent Dashboard', icon: LayoutDashboard },
  { id: 'search', label: 'Patent Search', icon: Search },
  { id: 'clustering', label: 'Patent Clustering', icon: Network },
  { id: 'trends', label: 'Patent Trends', icon: TrendingUp },
  { id: 'competitors', label: 'Competitor Analysis', icon: Building2 },
  { id: 'mapping', label: 'Innovation Mapping', icon: GitMerge },
  { id: 'saved', label: 'Saved Patents', icon: Bookmark, showCount: true },
];

const MODULE_LINKS = [
  { label: 'Module 3: Research Intelligence', icon: TrendingUp, path: '/research', color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Module 4: Funding Intelligence', icon: DollarSign, path: '/funding', color: '#047857', bg: '#ECFDF5' },
  { label: 'Module 6: Technology Intelligence', icon: Cpu, path: '/technology', color: '#0284C7', bg: '#E0F2FE' },
  { label: 'Module 7: Innovation Scoring', icon: Award, path: '/innovation', color: '#D97706', bg: '#FEF3C7' },
  { label: 'Module 8: Commercialization', icon: Rocket, path: '/commercialization', color: '#0D9488', bg: '#CCFBF1' },
  { label: 'Module 9: Analytics Dashboard', icon: BarChart3, path: '/dashboard', color: '#1E293B', bg: '#F1F5F9' },
  { label: 'Module 10: Intelligence Alerts', icon: Bell, path: '/alerts', color: '#DC2626', bg: '#FEE2E2' },
  { label: 'Module 11: Reports & Export', icon: FileBarChart2, path: '/reports', color: '#4F46E5', bg: '#EEF2FF' },
  { label: 'Back to Portal', icon: Home, path: '/', color: '#475569', bg: '#F1F5F9' },
];

export default function PatentSidebar({ currentView, setCurrentView, savedCount = 0 }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PI';

  return (
    <aside className="ri-sidebar">
      {/* Brand Header */}
      <div className="ri-sidebar-brand">
        <div className="ri-brand-badge" style={{ background: 'linear-gradient(135deg, #0F2744 0%, #8B5CF6 100%)' }}>
          PI
        </div>
        <div className="ri-brand-info">
          <span className="ri-brand-title">Patent Intelligence</span>
          <span className="ri-brand-subtitle">Module 5 · EPO OPS Engine</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="ri-sidebar-nav">
        <div className="ri-nav-section-title">Navigation</div>

        {NAV_ITEMS.map(({ id, label, icon: Icon, showCount }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              className={`ri-nav-item${isActive ? ' pi-nav-active' : ''}`}
              onClick={() => setCurrentView(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {showCount && savedCount > 0 && (
                <span className="ri-nav-badge" style={{ backgroundColor: 'var(--ri-purple-bg)', color: 'var(--ri-purple)' }}>
                  {savedCount}
                </span>
              )}
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6, color: 'var(--ri-purple)' }} />}
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
          <div className="ri-user-avatar" style={{ background: 'linear-gradient(135deg, #8B5CF6, #0F2744)' }}>
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
          <button className="ri-btn-action" onClick={() => navigate('/profile')}>
            <User size={13} />
            <span>Profile</span>
          </button>
          <button className="ri-btn-action ri-btn-logout" onClick={handleLogout}>
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
