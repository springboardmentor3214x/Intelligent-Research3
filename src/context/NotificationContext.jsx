/**
 * MODULE 10: NOTIFICATION CONTEXT
 * Provides real-time reactive notification state, unread counts, active toasts, and event dispatching.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, NOTIFICATION_CATEGORIES } from '../services/notificationService';
import { platformEventBus } from '../services/eventBus';
import { deliveryManager } from '../services/notificationDelivery';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user, profile } = useAuth();
  const userId = user?.id || 'demo-user';

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState(notificationService.getPreferences(userId));
  const [toasts, setToasts] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Refresh notifications list from storage/service
  const refreshNotifications = useCallback(() => {
    try {
      const res = notificationService.getNotifications({
        userId,
        pageSize: 50,
        userProfile: profile || {}
      });
      setNotifications(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.error('Failed to refresh notifications:', err);
    }
  }, [userId, profile]);

  // Initial Load & Profile Sync
  useEffect(() => {
    refreshNotifications();
    setPreferences(notificationService.getPreferences(userId));
  }, [userId, profile, refreshNotifications]);

  // Subscribe to Real-Time Toasts from Delivery Manager
  useEffect(() => {
    const unsubToast = deliveryManager.onToast((notif) => {
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const toastItem = {
        id: toastId,
        notification: notif,
        timestamp: Date.now()
      };
      setToasts((prev) => [toastItem, ...prev.slice(0, 4)]); // max 5 concurrent toasts

      // Auto dismiss after 6 seconds (unless CRITICAL priority)
      if (notif.priority !== 'CRITICAL') {
        setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== toastId));
        }, 6000);
      }
    });

    return () => unsubToast();
  }, []);

  // Subscribe to Platform Event Bus for Ingesting Cross-Module Events
  useEffect(() => {
    const unsubBus = platformEventBus.subscribeAll((event) => {
      // Process through Notification Service
      const result = notificationService.processEvent(event, profile || {}, userId);
      if (result.created) {
        refreshNotifications();
      }
    });

    return () => unsubBus();
  }, [profile, userId, refreshNotifications]);

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const markAsRead = async (notificationId) => {
    notificationService.markAsRead(userId, notificationId);
    refreshNotifications();
  };

  const markAsUnread = async (notificationId) => {
    notificationService.markAsUnread(userId, notificationId);
    refreshNotifications();
  };

  const markAllAsRead = async () => {
    notificationService.markAllAsRead(userId);
    refreshNotifications();
  };

  const deleteNotification = async (notificationId) => {
    notificationService.deleteNotification(userId, notificationId);
    refreshNotifications();
  };

  const clearRead = async () => {
    notificationService.clearReadNotifications(userId);
    refreshNotifications();
  };

  const updatePreferences = (newPrefs) => {
    const saved = notificationService.savePreferences(userId, newPrefs);
    setPreferences(saved);
  };

  /**
   * Helper to dispatch an event from any module into the intelligence event bus
   */
  const emitPlatformEvent = (eventType, payload, entityId = '', sourceModule = 'platform') => {
    return platformEventBus.publish(eventType, {
      source_module: sourceModule,
      entity_id: entityId,
      payload
    });
  };

  const value = {
    notifications,
    unreadCount,
    preferences,
    toasts,
    isDrawerOpen,
    loading,
    setIsDrawerOpen,
    refreshNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    clearRead,
    updatePreferences,
    dismissToast,
    emitPlatformEvent,
    categories: NOTIFICATION_CATEGORIES
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
