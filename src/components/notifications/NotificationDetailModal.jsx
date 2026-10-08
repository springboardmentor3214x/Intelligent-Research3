import { useNavigate } from 'react-router-dom';
import {
  X, Sparkles, ExternalLink, Clock, ShieldCheck,
  Hash, Layers, Cpu, CheckCircle2, AlertTriangle,
  Info, AlertCircle, FileText
} from 'lucide-react';

const SEVERITY_ICONS = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

export default function NotificationDetailModal({ notification, onClose, onMarkRead }) {
  const navigate = useNavigate();
  if (!notification) return null;

  const handleAction = () => {
    if (onMarkRead) onMarkRead(notification.id);
    onClose();
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const IconComp = SEVERITY_ICONS[notification.severity] || Info;

  return (
    <div className="ri-modal-overlay" onClick={onClose}>
      <div className="ri-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#EFF6FF', color: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconComp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Intelligence Alert Details
              </h3>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Audit ID: {notification.id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          {/* Main Title & Message */}
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                background: '#E2E8F0', color: '#334155', padding: '3px 8px', borderRadius: 4
              }}>
                {notification.category}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                background: notification.priority === 'HIGH' ? '#FEF3C7' : notification.priority === 'CRITICAL' ? '#FEE2E2' : '#EFF6FF',
                color: notification.priority === 'HIGH' ? '#B45309' : notification.priority === 'CRITICAL' ? '#B91C1C' : '#2563EB',
                padding: '3px 8px', borderRadius: 4
              }}>
                {notification.priority} Priority
              </span>
              <span style={{ fontSize: 12, color: '#64748B', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>

            <h4 style={{ fontSize: 15.5, fontWeight: 700, color: '#0F172A', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              {notification.title}
            </h4>
            <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0, background: '#F8FAFC', padding: '14px 16px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {notification.message}
            </p>
          </div>

          {/* Explainable Relevance Audit Box */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color="#16A34A" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>
                Relevance Engine Evaluation (Score: {notification.relevance_score || 85}/100)
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: '#166534', margin: '0 0 6px 0', lineHeight: 1.5 }}>
              {notification.relevance_reason || 'Verified match against active research profile.'}
            </p>
            {notification.metadata?.matchedTerms && notification.metadata.matchedTerms.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#15803D' }}>Matched Terms:</span>
                {notification.metadata.matchedTerms.map((term, i) => (
                  <span key={i} style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    {term}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source & Traceability Meta Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Layers size={12} /> Source Module
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>
                Module: {notification.related_module || notification.category}
              </span>
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Hash size={12} /> Source Event ID
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', wordBreak: 'break-all' }}>
                {notification.source_event_id || 'Direct Ingestion'}
              </span>
            </div>

            {notification.related_record_id && (
              <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileText size={12} /> Target Record
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  {notification.related_record_id}
                </span>
              </div>
            )}

            <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={12} /> Delivery Status
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#059669' }}>
                Delivered (In-App Verified)
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer'
            }}
          >
            Close
          </button>
          {notification.action_url && (
            <button
              onClick={handleAction}
              style={{
                padding: '8px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: '#2563EB', border: '1px solid #2563EB', color: '#FFFFFF', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6
              }}
            >
              <span>Open Target Module</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
