import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../../services/notificationService";
import "./NotificationDropdown.css";

const CATEGORY_META = {
  FUNDING: { label: "Funding", icon: DollarSign, colorClass: "cat-funding" },
  PATENT: { label: "Patent", icon: FileKey, colorClass: "cat-patent" },
  TECHNOLOGY: { label: "Tech", icon: Cpu, colorClass: "cat-tech" },
  RESEARCH_TREND: { label: "Research", icon: TrendingUp, colorClass: "cat-trend" },
  COMMERCIALIZATION: { label: "Commercial", icon: Briefcase, colorClass: "cat-comm" },
  PLATFORM: { label: "System", icon: Info, colorClass: "cat-platform" },
};

function formatTimeAgo(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentList, setRecentList] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch unread count on mount & every 45s
  async function fetchCount() {
    try {
      const res = await getUnreadCount();
      if (res && typeof res.unread_count === "number") {
        setUnreadCount(res.unread_count);
      }
    } catch {
      // Ignore background poll errors
    }
  }

  // Fetch recent notifications when dropdown opens
  async function fetchRecent() {
    setLoading(true);
    try {
      const res = await getNotifications({ page: 1, pageSize: 5 });
      if (res && res.items) {
        setRecentList(res.items);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (e) {
      console.warn("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRecent();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAll() {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setRecentList((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleItemClick(notif) {
    if (!notif.is_read) {
      try {
        await markAsRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setRecentList((prev) =>
          prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
        );
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate("/notifications");
    }
  }

  return (
    <div className="notif-dropdown-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className={`topnav-action-btn notif-bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
        title="Platform Notifications"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Platform Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="notif-badge-counter">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : (
          <span className="notification-dot" />
        )}
      </button>

      {isOpen && (
        <div className="notif-popover animate-fade-in">
          <div className="notif-popover-header">
            <div className="notif-header-title">
              <span className="notif-title-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="notif-unread-pill">{unreadCount} new</span>
              )}
            </div>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-mark-all-btn"
                  onClick={handleMarkAll}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          <div className="notif-popover-body">
            {loading && recentList.length === 0 ? (
              <div className="notif-loading-state">
                <RefreshCw size={18} className="spin-icon" />
                <span>Checking intelligence feeds...</span>
              </div>
            ) : recentList.length === 0 ? (
              <div className="notif-empty-state">
                <Bell size={24} className="notif-empty-icon" />
                <p className="notif-empty-text">No notifications yet</p>
                <span className="notif-empty-hint">
                  New alerts will appear here as intelligence updates arrive.
                </span>
              </div>
            ) : (
              <div className="notif-items-list">
                {recentList.map((item) => {
                  const meta = CATEGORY_META[item.category] || CATEGORY_META.PLATFORM;
                  const Icon = meta.icon;

                  return (
                    <div
                      key={item.id}
                      className={`notif-dropdown-item ${!item.is_read ? "is-unread" : ""}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className={`notif-icon-circle ${meta.colorClass}`}>
                        <Icon size={14} />
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-topline">
                          <span className={`notif-category-chip ${meta.colorClass}`}>
                            {meta.label}
                          </span>
                          <span className="notif-time-ago">
                            <Clock size={11} />
                            {formatTimeAgo(item.created_at)}
                          </span>
                        </div>
                        <h5 className="notif-item-title">{item.title}</h5>
                        <p className="notif-item-desc">{item.message}</p>
                      </div>
                      {!item.is_read && <span className="notif-unread-indicator" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="notif-popover-footer">
            <Link
              to="/notifications"
              className="notif-view-all-link"
              onClick={() => setIsOpen(false)}
            >
              <span>View full notification center</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
