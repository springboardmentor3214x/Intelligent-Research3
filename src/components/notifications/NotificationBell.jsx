import { Bell } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationBell() {
  const { unreadCount, setIsDrawerOpen, isDrawerOpen } = useNotifications();

  return (
    <button
      className="ri-notif-bell-btn"
      onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      title="Notifications & Intelligence Alerts"
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="ri-notif-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
