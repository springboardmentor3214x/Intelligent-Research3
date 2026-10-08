import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import {
  X, AlertTriangle, CheckCircle2, Info, AlertCircle,
  ExternalLink, Sparkles
} from 'lucide-react';

const SEVERITY_ICONS = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

const SEVERITY_COLORS = {
  warning: { color: '#D97706', bg: '#FEF3C7', border: '#F59E0B' },
  success: { color: '#059669', bg: '#ECFDF5', border: '#10B981' },
  info: { color: '#2563EB', bg: '#EFF6FF', border: '#3B82F6' },
  error: { color: '#DC2626', bg: '#FEF2F2', border: '#EF4444' },
};

export default function ToastContainer() {
  const { toasts, dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="ri-toast-container">
      {toasts.map((toast) => {
        const notif = toast.notification;
        const severity = notif.severity || 'info';
        const IconComponent = SEVERITY_ICONS[severity] || Info;
        const colorCfg = SEVERITY_COLORS[severity] || SEVERITY_COLORS.info;

        return (
          <div
            key={toast.id}
            className={`ri-toast-item priority-${notif.priority || 'MEDIUM'}`}
            style={{ borderLeftColor: colorCfg.border }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: colorCfg.bg,
                color: colorCfg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconComponent size={17} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: colorCfg.color,
                    letterSpacing: 0.4
                  }}
                >
                  {notif.category || 'Platform'} Alert
                </span>
                {notif.priority === 'HIGH' && (
                  <span style={{ fontSize: 9.5, background: '#FEF3C7', color: '#B45309', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    HIGH
                  </span>
                )}
                {notif.priority === 'CRITICAL' && (
                  <span style={{ fontSize: 9.5, background: '#FEE2E2', color: '#B91C1C', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                    CRITICAL
                  </span>
                )}
              </div>

              <h5 className="ri-toast-title">{notif.title}</h5>
              <p className="ri-toast-msg">{notif.message}</p>

              {notif.action_url && (
                <button
                  onClick={() => {
                    markAsRead(notif.id);
                    dismissToast(toast.id);
                    navigate(notif.action_url);
                  }}
                  style={{
                    marginTop: 6,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: '#2563EB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer'
                  }}
                >
                  <span>View Details</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>

            <button
              className="ri-toast-close"
              onClick={() => dismissToast(toast.id)}
              title="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
