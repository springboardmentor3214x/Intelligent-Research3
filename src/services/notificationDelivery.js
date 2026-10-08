/**
 * MODULE 10: REAL-TIME NOTIFICATION DELIVERY MANAGER
 * Manages in-app real-time event distribution, active toasts, delivery state tracking, and retry management.
 */

class NotificationDeliveryManager {
  constructor() {
    this.toastListeners = new Set();
    this.deliveryLogs = [];
  }

  /**
   * Subscribe to real-time toast popups
   */
  onToast(callback) {
    this.toastListeners.add(callback);
    return () => this.toastListeners.delete(callback);
  }

  /**
   * Dispatches toast to all active UI subscribers
   */
  dispatchToast(notification) {
    // Only toast HIGH and CRITICAL priority or explicit interactive items
    const priority = (notification.priority || 'MEDIUM').toUpperCase();
    const shouldToast = ['HIGH', 'CRITICAL'].includes(priority) || notification.forceToast || notification.category === 'reports';

    if (shouldToast) {
      this.toastListeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (err) {
          console.error('[DeliveryManager] Toast listener error:', err);
        }
      });
    }
  }

  /**
   * Records delivery attempt
   */
  logDelivery(notificationId, channel, status, failureReason = null) {
    const entry = {
      id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      notificationId,
      channel,
      status,
      attemptedAt: new Date().toISOString(),
      deliveredAt: status === 'DELIVERED' ? new Date().toISOString() : null,
      failureReason,
      retryCount: 0
    };
    this.deliveryLogs.unshift(entry);
    if (this.deliveryLogs.length > 200) {
      this.deliveryLogs.pop();
    }
    return entry;
  }

  getDeliveryLogs() {
    return [...this.deliveryLogs];
  }
}

export const deliveryManager = new NotificationDeliveryManager();
