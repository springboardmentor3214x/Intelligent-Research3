import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  X, CheckCheck, Trash2, ExternalLink, Sparkles,
  Clock, DollarSign, FileText, Cpu, TrendingUp,
  Rocket, FileBarChart2, ShieldCheck, Zap
} from 'lucide-react';

const CATEGORY_ICONS = {
  funding: DollarSign,
  patents: FileText,
  technology: Cpu,
  research: TrendingUp,
  commercialization: Rocket,
  reports: FileBarChart2,
  platform: ShieldCheck,
};

const CATEGORY_COLORS = {
  funding: { color: '#059669', bg: '#ECFDF5' },
  patents: { color: '#7C3AED', bg: '#F5F3FF' },
  technology: { color: '#0284C7', bg: '#E0F2FE' },
  research: { color: '#2563EB', bg: '#EFF6FF' },
  commercialization: { color: '#0D9488', bg: '#CCFBF1' },
  reports: { color: '#D97706', bg: '#FEF3C7' },
  platform: { color: '#4B5563', bg: '#F3F4F6' },
};

export default function NotificationDrawer({ onSelectNotification }) {
  const {
    notifications,
    unreadCount,
    isDrawerOpen,
    setIsDrawerOpen,
    markAsRead,
    markAllAsRead,
    clearRead,
    deleteNotification
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const filteredList = notifications.filter((item) => {
    if (activeTab === 'unread') return !item.is_read;
    if (activeTab !== 'all') return item.category === activeTab;
    return true;
  });

  const timeAgo = (dateStr) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'recent';
    }
  };

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    if (onSelectNotification) {
      onSelectNotification(notif);
    } else if (notif.action_url) {
      setIsDrawerOpen(false);
      navigate(notif.action_url);
    }
  };

  return (
    <div className="ri-drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
      <div className="ri-drawer-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="ri-drawer-header">
          <div className="ri-drawer-title-wrap">
            <h2 className="ri-drawer-title">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ri-drawer-badge">{unreadCount} unread</span>
            )}
          </div>
          <div className="ri-drawer-actions">
            {unreadCount > 0 && (
              <button className="ri-btn-subtle" onClick={markAllAsRead} title="Mark all read">
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button className="ri-btn-subtle" onClick={() => setIsDrawerOpen(false)} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="ri-drawer-tabs">
          <button
            className={`ri-drawer-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'funding' ? 'active' : ''}`}
            onClick={() => setActiveTab('funding')}
          >
            Funding
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'patents' ? 'active' : ''}`}
            onClick={() => setActiveTab('patents')}
          >
            Patents
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'technology' ? 'active' : ''}`}
            onClick={() => setActiveTab('technology')}
          >
            Technology
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            Research
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'commercialization' ? 'active' : ''}`}
            onClick={() => setActiveTab('commercialization')}
          >
            Commercial
          </button>
          <button
            className={`ri-drawer-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
        </div>

        {/* List Body */}
        <div className="ri-drawer-list">
          {filteredList.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <Zap size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: '0 0 4px' }}>
                No notifications to display
              </p>
              <p style={{ fontSize: 12.5, margin: 0 }}>
                {activeTab === 'unread' ? "You're all caught up!" : 'New alerts will appear here in real time.'}
              </p>
            </div>
          ) : (
            filteredList.map((notif) => {
              const IconComponent = CATEGORY_ICONS[notif.category] || ShieldCheck;
              const colorInfo = CATEGORY_COLORS[notif.category] || { color: '#4B5563', bg: '#F3F4F6' };
              
              return (
                <div
                  key={notif.id}
                  className={`ri-notif-card ${!notif.is_read ? 'unread' : ''} priority-${notif.priority || 'MEDIUM'}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className="ri-notif-icon-wrap" style={{ background: colorInfo.bg, color: colorInfo.color }}>
                    <IconComponent size={18} />
                  </div>

                  <div className="ri-notif-content">
                    <div className="ri-notif-meta-row">
                      <span
                        className="ri-notif-category-tag"
                        style={{ background: colorInfo.bg, color: colorInfo.color }}
                      >
                        {notif.category}
                      </span>
                      <span className="ri-notif-time">
                        <Clock size={11} />
                        {timeAgo(notif.created_at)}
                      </span>
                      {!notif.is_read && <span className="ri-notif-unread-dot" />}
                    </div>

                    <h4 className="ri-notif-title">{notif.title}</h4>
                    <p className="ri-notif-msg">{notif.message}</p>

                    {notif.relevance_reason && (
                      <div className="ri-notif-relevance-chip">
                        <Sparkles size={11} />
                        <span>{notif.relevance_reason.split(';')[0]}</span>
                      </div>
                    )}

                    <div className="ri-notif-card-actions">
                      {notif.action_url && (
                        <button
                          className="ri-notif-btn-action ri-notif-btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                            setIsDrawerOpen(false);
                            navigate(notif.action_url);
                          }}
                        >
                          <span>View Details</span>
                          <ExternalLink size={11} />
                        </button>
                      )}
                      <button
                        className="ri-notif-btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        title="Dismiss"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="ri-drawer-footer">
          <button
            className="ri-btn-subtle"
            onClick={clearRead}
            disabled={notifications.filter(n => n.is_read).length === 0}
          >
            Clear read
          </button>
          <button
            className="ri-notif-btn-action ri-notif-btn-primary"
            onClick={() => {
              setIsDrawerOpen(false);
              navigate('/alerts');
            }}
          >
            <span>Full Notification Center</span>
            <ExternalLink size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}
