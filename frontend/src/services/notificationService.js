import { apiRequest } from "./api";

/**
 * Module 10 - Notification & Alert Service
 * Communicates with backend endpoints at /api/notifications
 */

export async function getNotifications(params = {}) {
  const query = new URLSearchParams();
  if (params.category && params.category !== "ALL") query.append("category", params.category);
  if (params.unreadOnly) query.append("unread_only", "true");
  if (params.priority && params.priority !== "ALL") query.append("priority", params.priority);
  if (params.search) query.append("search", params.search);
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("page_size", params.pageSize);

  const qs = query.toString();
  return apiRequest(`/api/notifications${qs ? `?${qs}` : ""}`);
}

export async function getUnreadCount() {
  return apiRequest("/api/notifications/unread-count");
}

export async function getNotificationStats() {
  return apiRequest("/api/notifications/stats");
}

export async function scanAlerts() {
  return apiRequest("/api/notifications/scan", {
    method: "POST",
  });
}

export async function markAsRead(notificationId) {
  return apiRequest(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export async function markAllAsRead(category = null) {
  const query = category && category !== "ALL" ? `?category=${category}` : "";
  return apiRequest(`/api/notifications/mark-all-read${query}`, {
    method: "POST",
  });
}

export async function deleteNotification(notificationId) {
  return apiRequest(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function clearReadNotifications() {
  return apiRequest("/api/notifications/clear-read", {
    method: "DELETE",
  });
}

export async function getNotificationPreferences() {
  return apiRequest("/api/notifications/preferences");
}

export async function updateNotificationPreferences(payload) {
  return apiRequest("/api/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
