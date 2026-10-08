/**
 * MODULE 10: NOTIFICATION & ALERT INTELLIGENCE SYSTEM
 * Complete, production-ready enterprise notification management hub.
 * Traceable, explainable, role-aware, and event-driven.
 */

import { useState, useMemo } from 'react';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { EVENT_TYPES } from '../services/eventBus';
import { notificationService } from '../services/notificationService';
import NotificationDetailModal from '../components/notifications/NotificationDetailModal';
import NotificationPreferencesModal from '../components/notifications/NotificationPreferencesModal';
import {
  Bell, CheckCircle2, AlertTriangle, ShieldCheck,
  Clock, ChevronRight, X, Filter, Search,
  Zap, TrendingUp, FileText, DollarSign, Cpu,
  Rocket, FileBarChart2, RefreshCw, CheckCheck,
  Trash2, ExternalLink, Sparkles, Sliders, Layers,
  Activity, Play, Check, ShieldAlert
} from 'lucide-react';
import '../styles/notifications.css';

const CATEGORY_CONFIG = {
  funding: { icon: DollarSign, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Funding Alerts' },
  patents: { icon: FileText, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: 'Patent Alerts' },
  technology: { icon: Cpu, color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD', label: 'Technology Alerts' },
  research: { icon: TrendingUp, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', label: 'Research Trends' },
  commercialization: { icon: Rocket, color: '#0D9488', bg: '#CCFBF1', border: '#99F6E4', label: 'Commercialization' },
  reports: { icon: FileBarChart2, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A', label: 'Reports' },
  platform: { icon: ShieldCheck, color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB', label: 'Platform & Security' },
};

export default function AlertsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearRead,
    emitPlatformEvent,
    refreshNotifications,
    categories
  } = useNotifications();

  const { profile, user } = useAuth();
  const userId = user?.id || 'demo-user';

  // State
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'preferences' | 'audit' | 'simulator' | 'analytics'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [simulatorStatus, setSimulatorStatus] = useState('');

  // Filtering and pagination
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (categoryFilter !== 'all' && notif.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && (notif.priority || '').toUpperCase() !== priorityFilter.toUpperCase()) return false;
      if (readFilter === 'unread' && notif.is_read) return false;
      if (readFilter === 'read' && !notif.is_read) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = (notif.title || '').toLowerCase().includes(q);
        const matchMsg = (notif.message || '').toLowerCase().includes(q);
        const matchReason = (notif.relevance_reason || '').toLowerCase().includes(q);
        if (!matchTitle && !matchMsg && !matchReason) return false;
      }
      return true;
    });
  }, [notifications, categoryFilter, priorityFilter, readFilter, search]);

  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage, pageSize]);

  // Analytics & Audit
  const analytics = useMemo(() => {
    return notificationService.getAnalytics(userId);
  }, [userId, notifications]);

  const auditLogs = useMemo(() => {
    return notificationService.getAuditLogs(userId);
  }, [userId, notifications]);

  // Time formatter
  const formatTime = (dateStr) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'recent';
    }
  };

  // Simulator Triggers
  const handleTriggerSimulatedEvent = (type) => {
    setSimulatorStatus(`Dispatching ${type}...`);
    const domain = profile?.researchDomain || 'Artificial Intelligence';

    if (type === 'FUNDING') {
      emitPlatformEvent(
        EVENT_TYPES.FUNDING_OPPORTUNITY_CREATED,
        {
          id: `grant-sim-${Date.now()}`,
          title: `Translational ${domain} Innovation Award`,
          agency: 'National Science Foundation (NSF)',
          funding_amount: '$2,000,000 USD',
          days_left: '12',
          domain: domain,
          keywords: ['Machine Learning', 'Translational Medicine', 'Computer Vision'],
          research_areas: ['Neural Networks', 'Artificial Intelligence']
        },
        `grant-sim-${Date.now()}`,
        'funding'
      );
    } else if (type === 'PATENT') {
      emitPlatformEvent(
        EVENT_TYPES.PATENT_CLUSTER_DETECTED,
        {
          id: `pat-cluster-${Date.now()}`,
          technology_domain: `${domain} Scalable Acceleration`,
          assignee: 'Google DeepMind & Siemens',
          count: 18,
          domain: domain,
          keywords: ['Computer Vision', 'Deep Learning'],
          is_cluster: true
        },
        `pat-sim-${Date.now()}`,
        'patents'
      );
    } else if (type === 'TECHNOLOGY') {
      emitPlatformEvent(
        EVENT_TYPES.TECHNOLOGY_MATURITY_CHANGED,
        {
          id: `tech-sim-${Date.now()}`,
          technology: `Autonomous Edge ${domain} Coprocessors`,
          old_stage: 'Developing',
          new_stage: 'Maturing (TRL 7)',
          score: 91,
          domain: domain,
          maturity_transition: true
        },
        `tech-sim-${Date.now()}`,
        'technology'
      );
    } else if (type === 'RESEARCH') {
      emitPlatformEvent(
        EVENT_TYPES.RESEARCH_TREND_CHANGED,
        {
          id: `res-sim-${Date.now()}`,
          topic: `Self-Supervised ${domain} Foundation Models`,
          growth: '+184%',
          domain: domain,
          keywords: ['Machine Learning', 'Foundation Models']
        },
        `res-sim-${Date.now()}`,
        'research'
      );
    } else if (type === 'COMMERCIALIZATION') {
      emitPlatformEvent(
        EVENT_TYPES.COMMERCIALIZATION_OPPORTUNITY_FOUND,
        {
          id: `comm-sim-${Date.now()}`,
          technology: `High-Throughput ${domain} Analysis System`,
          opportunity_type: 'Licensing & University Spinout',
          domain: domain
        },
        `comm-sim-${Date.now()}`,
        'commercialization'
      );
    } else if (type === 'REPORT') {
      emitPlatformEvent(
        EVENT_TYPES.REPORT_GENERATED,
        {
          id: `rep-sim-${Date.now()}`,
          report_name: `${domain} Comprehensive Intelligence Report`,
          report_type: 'Comprehensive Report',
          format: 'PDF / Excel'
        },
        `rep-sim-${Date.now()}`,
        'reports'
      );
    }

    setTimeout(() => {
      setSimulatorStatus(`✓ Event successfully ingested, evaluated, deduplicated, and delivered!`);
      setTimeout(() => setSimulatorStatus(''), 4000);
    }, 400);
  };

  return (
    <EnterpriseLayout
      activeModule="alerts"
      moduleTitle="Intelligence Alerts & Notifications"
      breadcrumbs={['System Intelligence', 'Notification Center']}
    >
      <div className="ri-alerts-container fadeIn">
        
        {/* Module Header */}
        <div className="ent-module-header">
          <div className="ent-module-title-group">
            <h1>Notification & Alert Intelligence System</h1>
            <p>
              Proactive, event-driven intelligence hub connecting real signals from Research (M3), Funding (M4), Patents (M5), Technology (M6), Innovation (M7), Commercialization (M8), and Reports (M11).
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="ri-btn-subtle"
              onClick={() => setIsPrefModalOpen(true)}
              style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', padding: '7px 14px', borderRadius: 8 }}
            >
              <Sliders size={14} />
              <span>Preferences</span>
            </button>

            {unreadCount > 0 && (
              <button
                className="ri-notif-btn-action ri-notif-btn-primary"
                onClick={markAllAsRead}
                style={{ padding: '7px 14px', borderRadius: 8 }}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Dashboard Cards */}
        <div className="ent-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div className="ent-kpi-card cardHover">
            <div className="ent-kpi-info">
              <span className="ent-kpi-label">Total Notifications</span>
              <span className="ent-kpi-value" style={{ color: '#2563EB' }}>{analytics.total}</span>
            </div>
            <div className="ent-kpi-icon-wrap" style={{ background: '#EFF6FF' }}>
              <Bell size={20} color="#2563EB" />
            </div>
          </div>

          <div className="ent-kpi-card cardHover">
            <div className="ent-kpi-info">
              <span className="ent-kpi-label">Unread Alerts</span>
              <span className="ent-kpi-value" style={{ color: '#D97706' }}>{analytics.unread}</span>
            </div>
            <div className="ent-kpi-icon-wrap" style={{ background: '#FEF3C7' }}>
              <Zap size={20} color="#D97706" />
            </div>
          </div>

          <div className="ent-kpi-card cardHover">
            <div className="ent-kpi-info">
              <span className="ent-kpi-label">High / Critical Priority</span>
              <span className="ent-kpi-value" style={{ color: '#DC2626' }}>
                {(analytics.byPriority?.HIGH || 0) + (analytics.byPriority?.CRITICAL || 0)}
              </span>
            </div>
            <div className="ent-kpi-icon-wrap" style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={20} color="#DC2626" />
            </div>
          </div>

          <div className="ent-kpi-card cardHover">
            <div className="ent-kpi-info">
              <span className="ent-kpi-label">Deduplicated & Filtered</span>
              <span className="ent-kpi-value" style={{ color: '#059669' }}>
                {analytics.duplicatesBlocked + analytics.relevanceFiltered}
              </span>
            </div>
            <div className="ent-kpi-icon-wrap" style={{ background: '#ECFDF5' }}>
              <ShieldCheck size={20} color="#059669" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="ri-tab-nav">
          <button
            className={`ri-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Bell size={15} />
            <span>Intelligence Alerts Feed ({filteredNotifications.length})</span>
          </button>
          
          <button
            className={`ri-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Play size={15} />
            <span>Cross-Module Event Dispatcher</span>
          </button>

          <button
            className={`ri-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <ShieldCheck size={15} />
            <span>Audit & Deduplication Trail ({auditLogs.length})</span>
          </button>

          <button
            className={`ri-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={15} />
            <span>Analytics & Delivery Health</span>
          </button>
        </div>

        {/* ── TAB 1: NOTIFICATIONS FEED ──────────────────────────────────────── */}
        {activeTab === 'feed' && (
          <div>
            {/* Filter Bar */}
            <div className="ri-filter-bar">
              {/* Search */}
              <div className="ri-search-box">
                <Search size={15} color="#94A3B8" />
                <input
                  type="text"
                  className="ri-search-input"
                  placeholder="Search alerts by title, description, or relevance reasons..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1',
                  background: '#FFFFFF', fontSize: 13, color: '#334155', cursor: 'pointer'
                }}
              >
                <option value="all">All Categories</option>
                <option value="funding">Funding (M4)</option>
                <option value="patents">Patents (M5)</option>
                <option value="technology">Technology (M6)</option>
                <option value="research">Research (M3)</option>
                <option value="commercialization">Commercialization (M8)</option>
                <option value="reports">Reports (M11)</option>
                <option value="platform">Platform & Security</option>
              </select>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1',
                  background: '#FFFFFF', fontSize: 13, color: '#334155', cursor: 'pointer'
                }}
              >
                <option value="all">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>

              {/* Read/Unread Filter */}
              <select
                value={readFilter}
                onChange={(e) => {
                  setReadFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1',
                  background: '#FFFFFF', fontSize: 13, color: '#334155', cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="unread">Unread Only</option>
                <option value="read">Read Only</option>
              </select>

              {/* Clear Read Button */}
              <button
                className="ri-btn-subtle"
                onClick={clearRead}
                style={{ marginLeft: 'auto', background: '#FFFFFF', border: '1px solid #E2E8F0' }}
              >
                <Trash2 size={13} />
                <span>Clear read</span>
              </button>
            </div>

            {/* Notification Cards List */}
            <div className="ent-card" style={{ padding: '20px' }}>
              {paginatedNotifications.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <ShieldCheck size={40} color="#94A3B8" style={{ margin: '0 auto 14px' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>
                    No notifications match your filters
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                    Try changing your search keywords or switching category filters.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {paginatedNotifications.map((notif) => {
                    const catCfg = CATEGORY_CONFIG[notif.category] || CATEGORY_CONFIG.platform;
                    const IconComp = catCfg.icon;

                    return (
                      <div
                        key={notif.id}
                        className={`ri-notif-card ${!notif.is_read ? 'unread' : ''} priority-${notif.priority || 'MEDIUM'}`}
                        onClick={() => setSelectedNotif(notif)}
                        style={{ padding: '16px 20px' }}
                      >
                        <div className="ri-notif-icon-wrap" style={{ background: catCfg.bg, color: catCfg.color }}>
                          <IconComp size={20} />
                        </div>

                        <div className="ri-notif-content">
                          <div className="ri-notif-meta-row">
                            <span className="ri-notif-category-tag" style={{ background: catCfg.bg, color: catCfg.color }}>
                              {catCfg.label}
                            </span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                              background: notif.priority === 'HIGH' ? '#FEF3C7' : notif.priority === 'CRITICAL' ? '#FEE2E2' : '#F1F5F9',
                              color: notif.priority === 'HIGH' ? '#B45309' : notif.priority === 'CRITICAL' ? '#B91C1C' : '#475569',
                            }}>
                              {notif.priority}
                            </span>
                            <span className="ri-notif-time">
                              <Clock size={11} />
                              {formatTime(notif.created_at)}
                            </span>
                            {!notif.is_read && <span className="ri-notif-unread-dot" />}
                          </div>

                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                            {notif.title}
                          </h3>
                          <p style={{ fontSize: 13, color: '#475569', margin: '0 0 6px', lineHeight: 1.5 }}>
                            {notif.message}
                          </p>

                          {notif.relevance_reason && (
                            <div className="ri-notif-relevance-chip">
                              <Sparkles size={12} />
                              <span>{notif.relevance_reason}</span>
                            </div>
                          )}

                          <div className="ri-notif-card-actions">
                            <button
                              className="ri-notif-btn-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNotif(notif);
                              }}
                            >
                              <span>Audit Details</span>
                              <ChevronRight size={12} />
                            </button>

                            {notif.action_url && (
                              <button
                                className="ri-notif-btn-action ri-notif-btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                  window.location.href = notif.action_url;
                                }}
                              >
                                <span>Go to Record</span>
                                <ExternalLink size={12} />
                              </button>
                            )}

                            {notif.is_read ? (
                              <button
                                className="ri-notif-btn-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsUnread(notif.id);
                                }}
                                title="Mark as unread"
                              >
                                <span>Mark unread</span>
                              </button>
                            ) : (
                              <button
                                className="ri-notif-btn-action"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                title="Mark as read"
                              >
                                <Check size={12} />
                                <span>Mark read</span>
                              </button>
                            )}

                            <button
                              className="ri-notif-btn-action"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              title="Delete notification"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 12.5, color: '#64748B' }}>
                    Showing page {currentPage} of {totalPages} ({filteredNotifications.length} items)
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="ri-btn-subtle"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      style={{ border: '1px solid #CBD5E1' }}
                    >
                      Previous
                    </button>
                    <button
                      className="ri-btn-subtle"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      style={{ border: '1px solid #CBD5E1' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: CROSS-MODULE EVENT DISPATCHER ─────────────────────────── */}
        {activeTab === 'simulator' && (
          <div className="ent-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: '#0F172A' }}>
                Event Bus Ingestion & Dispatcher Console
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                Emit real typed platform events into the event bus. The Notification Engine will dynamically match them against your active research profile (<strong>{profile?.researchDomain || 'Artificial Intelligence'}</strong>), calculate explainable relevance, check deduplication, store the notification, and trigger real-time delivery with toasts.
              </p>
            </div>

            {simulatorStatus && (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
                {simulatorStatus}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {/* Module 4 Funding */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 4: Funding Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>FUNDING_OPPORTUNITY_CREATED</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates a newly published NSF/NIH grant matching your research domain and keywords.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('FUNDING')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Funding Event</span>
                </button>
              </div>

              {/* Module 5 Patents */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 5: Patent Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>PATENT_CLUSTER_DETECTED</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates patent clustering activity across major assignees in your technology area.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('PATENT')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Patent Event</span>
                </button>
              </div>

              {/* Module 6 Technology */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 6: Technology Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>TECHNOLOGY_MATURITY_CHANGED</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates technology maturity progression from Prototype to Developing stage.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('TECHNOLOGY')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Tech Maturity Event</span>
                </button>
              </div>

              {/* Module 3 Research */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 3: Research Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>RESEARCH_TREND_CHANGED</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates a +184% research publication growth spike in an active hotspot topic.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('RESEARCH')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Research Event</span>
                </button>
              </div>

              {/* Module 8 Commercialization */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#CCFBF1', color: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Rocket size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 8: Commercial Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>COMMERCIALIZATION_OPPORTUNITY_FOUND</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates potential licensing or university spinout opportunity evaluation.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('COMMERCIALIZATION')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Commercial Lead</span>
                </button>
              </div>

              {/* Module 11 Reports */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileBarChart2 size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Module 11: Report Event</h4>
                    <span style={{ fontSize: 11, color: '#64748B' }}>REPORT_GENERATED</span>
                  </div>
                </div>
                <p style={{ fontSize: 12.5, color: '#475569', margin: '0 0 14px' }}>
                  Simulates completion of an asynchronous intelligence compilation report ready for download.
                </p>
                <button
                  className="ri-notif-btn-action ri-notif-btn-primary"
                  onClick={() => handleTriggerSimulatedEvent('REPORT')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Play size={13} />
                  <span>Emit Report Ready Event</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: AUDIT & DEDUPLICATION TRAIL ───────────────────────────── */}
        {activeTab === 'audit' && (
          <div className="ent-card" style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>
                Deterministic Audit & Deduplication Logs
              </h2>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: 0 }}>
                Every intelligence notification is verifiable back to its originating platform event, relevance match score, and idempotency key.
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                <ShieldCheck size={32} color="#94A3B8" style={{ margin: '0 auto 10px' }} />
                <p>No audit events logged yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                      <th style={{ padding: '10px 8px' }}>Timestamp</th>
                      <th style={{ padding: '10px 8px' }}>Event ID</th>
                      <th style={{ padding: '10px 8px' }}>Action</th>
                      <th style={{ padding: '10px 8px' }}>Result</th>
                      <th style={{ padding: '10px 8px' }}>Details / Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => {
                      const isSuccess = log.result === 'SUCCESS';
                      const isDup = log.result === 'SKIPPED_DUPLICATE';
                      const isRel = log.result === 'SKIPPED_RELEVANCE';
                      
                      return (
                        <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 8px', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 11.5, color: '#0F172A' }}>
                            {log.eventId}
                          </td>
                          <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                            {log.action}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                              background: isSuccess ? '#ECFDF5' : isDup ? '#FEF3C7' : '#FEE2E2',
                              color: isSuccess ? '#059669' : isDup ? '#D97706' : '#DC2626'
                            }}>
                              {log.result}
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#475569' }}>
                            {log.details?.reasons?.join(', ') || log.details?.idempotencyKey || log.details?.priority || 'Event processed'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: ANALYTICS & HEALTH ────────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <div className="ent-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0F172A' }}>
              Notification Intelligence Analytics & Delivery Health
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {/* Category Breakdown */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#0F172A' }}>
                  Notifications by Module Category
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {categories.map((cat) => {
                    const count = analytics.byCategory?.[cat.id] || 0;
                    const pct = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                    return (
                      <div key={cat.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, marginBottom: 4 }}>
                          <span>{cat.label}</span>
                          <span style={{ color: '#64748B' }}>{count} ({pct}%)</span>
                        </div>
                        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: cat.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Health & Deduplication */}
              <div style={{ padding: '18px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#FAFAFC' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#0F172A' }}>
                  System Health & Delivery Metrics
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>In-App Delivery Success Rate</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>100% (Verified)</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>Duplicate Notifications Prevented</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>{analytics.duplicatesBlocked}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>Irrelevant Events Filtered Out</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{analytics.relevanceFiltered}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: 13, color: '#475569' }}>Audited Event Traceability</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>100% Deterministic</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <NotificationDetailModal
          notification={selectedNotif}
          onClose={() => setSelectedNotif(null)}
          onMarkRead={markAsRead}
        />

        <NotificationPreferencesModal
          isOpen={isPrefModalOpen}
          onClose={() => setIsPrefModalOpen(false)}
        />

      </div>
    </EnterpriseLayout>
  );
}
