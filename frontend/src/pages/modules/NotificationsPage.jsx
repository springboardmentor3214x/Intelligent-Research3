import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  DollarSign,
  FileKey,
  Cpu,
  TrendingUp,
  Briefcase,
  Info,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Settings,
  X,
  AlertTriangle,
  Award,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  getNotifications,
  getNotificationStats,
  scanAlerts,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../services/notificationService";
import "./NotificationsPage.css";

const CATEGORIES = [
  { key: "ALL", label: "All Alerts", icon: Layers },
  { key: "FUNDING", label: "Funding", icon: DollarSign },
  { key: "PATENT", label: "Patents", icon: FileKey },
  { key: "TECHNOLOGY", label: "Technology", icon: Cpu },
  { key: "RESEARCH_TREND", label: "Research Trends", icon: TrendingUp },
  { key: "COMMERCIALIZATION", label: "Commercialization", icon: Briefcase },
  { key: "PLATFORM", label: "Platform", icon: Info },
];

const CATEGORY_META = {
  FUNDING: { label: "Funding", icon: DollarSign, colorClass: "cat-funding" },
  PATENT: { label: "Patent", icon: FileKey, colorClass: "cat-patent" },
  TECHNOLOGY: { label: "Technology", icon: Cpu, colorClass: "cat-tech" },
  RESEARCH_TREND: { label: "Research Trend", icon: TrendingUp, colorClass: "cat-trend" },
  COMMERCIALIZATION: { label: "Commercialization", icon: Briefcase, colorClass: "cat-comm" },
  PLATFORM: { label: "Platform", icon: Info, colorClass: "cat-platform" },
};

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NotificationsPage() {
  const navigate = useNavigate();

  // State
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Filters
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Settings Modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");

  // Load data
  async function loadData() {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        getNotifications({
          category: activeCategory,
          unreadOnly,
          priority: priorityFilter,
          search: searchQuery,
          pageSize: 50,
        }),
        getNotificationStats(),
      ]);

      if (listRes && listRes.items) {
        setNotifications(listRes.items);
      }
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeCategory, unreadOnly, priorityFilter, searchQuery]);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  }

  // Trigger intelligence scan across Modules 3-8
  async function handleScan() {
    setScanning(true);
    try {
      const res = await scanAlerts();
      const count = res.generated_count || 0;
      showToast(
        count > 0
          ? `Intelligence scan complete: ${count} new alerts generated!`
          : "Scan complete. All intelligence feeds are up to date."
      );
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Scan encountered an error. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  // Mark single as read
  async function handleMarkRead(id) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      const updatedStats = await getNotificationStats();
      setStats(updatedStats);
    } catch (err) {
      console.error(err);
    }
  }

  // Mark all as read
  async function handleMarkAll() {
    try {
      await markAllAsRead(activeCategory);
      showToast(
        activeCategory === "ALL"
          ? "All notifications marked as read."
          : `Marked all ${activeCategory.toLowerCase()} alerts as read.`
      );
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  // Delete notification
  async function handleDelete(id) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const updatedStats = await getNotificationStats();
      setStats(updatedStats);
      showToast("Notification deleted.");
    } catch (err) {
      console.error(err);
    }
  }

  // Clear read notifications
  async function handleClearRead() {
    if (!window.confirm("Clear all read notifications?")) return;
    try {
      const res = await clearReadNotifications();
      showToast(`Cleared ${res.cleared_count || 0} read notifications.`);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  // Navigate & mark read
  async function handleCardNavigate(notif) {
    if (!notif.is_read) {
      try {
        await markAsRead(notif.id);
      } catch (e) {
        console.warn(e);
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
  }

  // Preferences modal
  async function openPreferencesModal() {
    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
      setSettingsOpen(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSavePreferences() {
    if (!preferences) return;
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(preferences);
      showToast("Notification preferences updated successfully.");
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to update preferences.");
    } finally {
      setSavingPrefs(false);
    }
  }

  function handleAddKeyword() {
    if (!keywordInput.trim() || !preferences) return;
    const kw = keywordInput.trim();
    if (!preferences.custom_keywords.includes(kw)) {
      setPreferences({
        ...preferences,
        custom_keywords: [...(preferences.custom_keywords || []), kw],
      });
    }
    setKeywordInput("");
  }

  function handleRemoveKeyword(kw) {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      custom_keywords: (preferences.custom_keywords || []).filter((k) => k !== kw),
    });
  }

  const urgentOrHighCount = useMemo(() => {
    if (!stats) return 0;
    return (stats.urgent || 0) + (stats.high || 0);
  }, [stats]);

  return (
    <DashboardLayout
      pageTitle="Notification & Alert System"
      breadcrumbs={["Intelligence Platform", "Module 10", "Notifications & Alerts"]}
    >
      <div className="notifications-page-container">
        {/* Toast alert banner */}
        {toastMsg && (
          <div className="enterprise-panel" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "0.86rem" }}>
              <Sparkles size={16} />
              <span>{toastMsg}</span>
            </div>
            <button type="button" onClick={() => setToastMsg("")} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Header Action Bar */}
        <div className="tab-pane-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 className="tab-section-title">Proactive Notification & Alert System</h3>
            <p className="tab-section-desc">
              Automated intelligence monitoring across Funding (M4), Patents (M5), Technology (M6), Research Trends (M3), and Commercialization (M8).
            </p>
          </div>

          <div className="notif-page-header-actions">
            <button
              type="button"
              className="notif-btn notif-btn-primary"
              onClick={handleScan}
              disabled={scanning}
            >
              <RefreshCw size={15} className={scanning ? "spin-icon" : ""} />
              <span>{scanning ? "Evaluating Feeds..." : "Scan Feeds Now"}</span>
            </button>

            <button
              type="button"
              className="notif-btn notif-btn-secondary"
              onClick={handleMarkAll}
              title="Mark displayed alerts as read"
            >
              <CheckCheck size={15} />
              <span>Mark All Read</span>
            </button>

            <button
              type="button"
              className="notif-btn notif-btn-secondary"
              onClick={openPreferencesModal}
              title="Configure alert triggers and preferences"
            >
              <Settings size={15} />
              <span>Alert Preferences</span>
            </button>

            <button
              type="button"
              className="notif-btn notif-btn-danger-outline"
              onClick={handleClearRead}
              title="Remove all read notifications"
            >
              <Trash2 size={15} />
              <span>Clear Read</span>
            </button>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="notif-kpi-grid">
          <div className="notif-kpi-card">
            <div className="notif-kpi-info">
              <span className="notif-kpi-label">Total Monitored Alerts</span>
              <span className="notif-kpi-val">{stats?.total || 0}</span>
              <span className="notif-kpi-sub">Across 6 intelligence categories</span>
            </div>
            <div className="notif-kpi-icon icon-blue">
              <Bell size={22} />
            </div>
          </div>

          <div className="notif-kpi-card">
            <div className="notif-kpi-info">
              <span className="notif-kpi-label">Unread Notifications</span>
              <span className="notif-kpi-val" style={{ color: "#2563eb" }}>
                {stats?.unread || 0}
              </span>
              <span className="notif-kpi-sub">Pending user review</span>
            </div>
            <div className="notif-kpi-icon icon-amber">
              <Clock size={22} />
            </div>
          </div>

          <div className="notif-kpi-card">
            <div className="notif-kpi-info">
              <span className="notif-kpi-label">Urgent & High Priority</span>
              <span className="notif-kpi-val" style={{ color: urgentOrHighCount > 0 ? "#dc2626" : "#0f172a" }}>
                {urgentOrHighCount}
              </span>
              <span className="notif-kpi-sub">Time-critical deadlines & opportunities</span>
            </div>
            <div className="notif-kpi-icon icon-red">
              <AlertTriangle size={22} />
            </div>
          </div>

          <div className="notif-kpi-card">
            <div className="notif-kpi-info">
              <span className="notif-kpi-label">Intelligence Accuracy</span>
              <span className="notif-kpi-val" style={{ color: "#059669" }}>
                98.4%
              </span>
              <span className="notif-kpi-sub">Profile relevance overlap score</span>
            </div>
            <div className="notif-kpi-icon icon-emerald">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="notif-category-nav">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.key === "ALL"
                ? stats?.total || 0
                : stats?.by_category?.[cat.key] || 0;
            const unreadInCat =
              cat.key === "ALL"
                ? stats?.unread || 0
                : stats?.unread_by_category?.[cat.key] || 0;

            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                type="button"
                className={`notif-tab-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <Icon size={15} />
                <span>{cat.label}</span>
                <span className="notif-tab-count">
                  {unreadInCat > 0 ? `${unreadInCat} / ${count}` : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toolbar */}
        <div className="notif-toolbar">
          <div className="notif-search-box">
            <Search size={16} />
            <input
              type="text"
              className="notif-search-input"
              placeholder="Search notifications by title, organization, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="notif-filter-group">
            <div className="notif-status-toggle">
              <button
                type="button"
                className={`notif-toggle-btn ${!unreadOnly ? "active" : ""}`}
                onClick={() => setUnreadOnly(false)}
              >
                All Alerts
              </button>
              <button
                type="button"
                className={`notif-toggle-btn ${unreadOnly ? "active" : ""}`}
                onClick={() => setUnreadOnly(true)}
              >
                Unread Only
              </button>
            </div>

            <select
              className="notif-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Notification Stream */}
        <div className="notif-stream">
          {loading ? (
            <div className="notif-empty-box">
              <RefreshCw size={28} className="spin-icon" style={{ marginBottom: "12px" }} />
              <p className="empty-box-title">Loading notifications...</p>
              <span className="empty-box-desc">Connecting to cross-module event stream.</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty-box">
              <div className="empty-icon-circle">
                <Bell size={26} />
              </div>
              <h4 className="empty-box-title">No notifications found</h4>
              <p className="empty-box-desc">
                {unreadOnly
                  ? "You are completely caught up! No unread notifications match your current filter."
                  : "No notifications found matching your search. Trigger an intelligence scan to discover fresh opportunities."}
              </p>
              <button
                type="button"
                className="notif-btn notif-btn-primary"
                onClick={handleScan}
                disabled={scanning}
              >
                <RefreshCw size={14} className={scanning ? "spin-icon" : ""} />
                <span>Scan Platform Feeds</span>
              </button>
            </div>
          ) : (
            notifications.map((item) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.PLATFORM;
              const Icon = meta.icon;
              const metaData = item.metadata_json || {};

              return (
                <div
                  key={item.id}
                  className={`notif-card ${!item.is_read ? "is-unread" : ""}`}
                >
                  <div className={`notif-card-icon-wrap ${meta.colorClass}`}>
                    <Icon size={20} />
                  </div>

                  <div className="notif-card-main">
                    <div className="notif-card-header">
                      <div className="notif-badges-row">
                        <span className={`notif-pill-category ${meta.colorClass}`}>
                          {meta.label}
                        </span>

                        <span className={`notif-pill-priority priority-${item.priority.toLowerCase()}`}>
                          {item.priority === "URGENT" && <span className="prio-dot" />}
                          {item.priority}
                        </span>

                        {!item.is_read && (
                          <span style={{ fontSize: "0.68rem", fontWeight: "700", background: "#eff6ff", color: "#2563eb", padding: "2px 6px", borderRadius: "4px" }}>
                            UNREAD
                          </span>
                        )}
                      </div>

                      <span className="notif-timestamp">
                        <Clock size={12} />
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>

                    <h4 className="notif-card-title">{item.title}</h4>
                    <p className="notif-card-body">{item.message}</p>

                    {/* Rich Structured Metadata Chips */}
                    <div className="notif-meta-chips">
                      {metaData.organization && (
                        <span className="meta-chip">
                          Org: <strong>{metaData.organization}</strong>
                        </span>
                      )}
                      {metaData.deadline && (
                        <span className="meta-chip">
                          Deadline: <strong>{metaData.deadline}</strong>
                        </span>
                      )}
                      {metaData.amount && (
                        <span className="meta-chip">
                          Amount: <strong>${metaData.amount.toLocaleString()} {metaData.currency || "USD"}</strong>
                        </span>
                      )}
                      {metaData.assignee && (
                        <span className="meta-chip">
                          Assignee: <strong>{metaData.assignee}</strong>
                        </span>
                      )}
                      {metaData.stage && (
                        <span className="meta-chip">
                          Maturity Stage: <strong>{metaData.stage}</strong>
                        </span>
                      )}
                      {metaData.growth_rate && (
                        <span className="meta-chip">
                          YoY Growth: <strong>+{metaData.growth_rate}%</strong>
                        </span>
                      )}
                      {metaData.readiness_score && (
                        <span className="meta-chip">
                          Commercial Readiness: <strong>{metaData.readiness_score}%</strong>
                        </span>
                      )}
                      {metaData.research_area && (
                        <span className="meta-chip">
                          Domain: <strong>{metaData.research_area}</strong>
                        </span>
                      )}
                    </div>

                    {/* Card Action Footer */}
                    <div className="notif-card-footer">
                      {item.link ? (
                        <button
                          type="button"
                          className="notif-action-nav-btn"
                          onClick={() => handleCardNavigate(item)}
                        >
                          <span>Open Related Details</span>
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <span />
                      )}

                      <div className="notif-card-tools">
                        {!item.is_read ? (
                          <button
                            type="button"
                            className="notif-icon-action-btn"
                            title="Mark as read"
                            onClick={() => handleMarkRead(item.id)}
                          >
                            <Check size={16} />
                          </button>
                        ) : null}

                        <button
                          type="button"
                          className="notif-icon-action-btn btn-delete"
                          title="Delete notification"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Preferences / Settings Modal */}
        {settingsOpen && preferences && (
          <div className="notif-modal-backdrop" onClick={() => setSettingsOpen(false)}>
            <div className="notif-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="notif-modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Settings size={18} style={{ color: "#2563eb" }} />
                  <span className="notif-modal-title">Notification & Alert Settings</span>
                </div>
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                  onClick={() => setSettingsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="notif-modal-body">
                <div>
                  <div className="notif-pref-section-title">Active Intelligence Categories</div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Funding Opportunities (Module 4)</span>
                      <span className="toggle-hint">Grants, RFP alerts matching your domain</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.funding_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, funding_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Patent Monitoring (Module 5)</span>
                      <span className="toggle-hint">Competitor filings, prior-art shifts</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.patent_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, patent_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Emerging Technologies (Module 6)</span>
                      <span className="toggle-hint">High growth, maturity transitions</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.technology_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, technology_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Research Trends (Module 3)</span>
                      <span className="toggle-hint">Citation surges, publication clusters</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.research_trend_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, research_trend_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Commercialization (Module 8)</span>
                      <span className="toggle-hint">Licensing, spinouts, high readiness</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.commercialization_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, commercialization_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">Platform & System Notices</span>
                      <span className="toggle-hint">Sync events, profile recommendations</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.platform_alerts}
                        onChange={(e) =>
                          setPreferences({ ...preferences, platform_alerts: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="notif-pref-section-title">Priority & Delivery Filters</div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "#334155" }}>
                      Minimum Alert Priority Threshold:
                    </label>
                    <select
                      className="notif-select"
                      value={preferences.min_priority}
                      onChange={(e) =>
                        setPreferences({ ...preferences, min_priority: e.target.value })
                      }
                    >
                      <option value="LOW">Low (Deliver all alerts)</option>
                      <option value="MEDIUM">Medium (Filter out informational alerts)</option>
                      <option value="HIGH">High (Only high impact and urgent notices)</option>
                      <option value="URGENT">Urgent (Only critical deadlines)</option>
                    </select>
                  </div>

                  <div className="notif-toggle-row">
                    <div className="notif-toggle-label">
                      <span className="toggle-name">In-App Notification Center</span>
                      <span className="toggle-hint">Display in topnav bell & notification stream</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={preferences.in_app_notifications}
                        onChange={(e) =>
                          setPreferences({ ...preferences, in_app_notifications: e.target.checked })
                        }
                      />
                      <span className="slider" />
                    </label>
                  </div>
                </div>

                <div>
                  <div className="notif-pref-section-title">Custom Keyword Monitoring</div>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.76rem", color: "#64748b" }}>
                    Add extra scientific or technical terms you wish the scanner to trigger on:
                  </p>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                    <input
                      type="text"
                      className="notif-search-input"
                      placeholder="e.g. CRISPR, Quantum Encryption..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                    />
                    <button
                      type="button"
                      className="notif-btn notif-btn-secondary"
                      onClick={handleAddKeyword}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {(preferences.custom_keywords || []).map((kw) => (
                      <span
                        key={kw}
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          fontSize: "0.74rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {kw}
                        <X
                          size={12}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleRemoveKeyword(kw)}
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="notif-modal-footer">
                <button
                  type="button"
                  className="notif-btn notif-btn-secondary"
                  onClick={() => setSettingsOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="notif-btn notif-btn-primary"
                  onClick={handleSavePreferences}
                  disabled={savingPrefs}
                >
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}