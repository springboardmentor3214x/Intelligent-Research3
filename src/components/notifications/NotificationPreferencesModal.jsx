import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, Check, Sliders, Shield, Bell, Mail, Smartphone } from 'lucide-react';

export default function NotificationPreferencesModal({ isOpen, onClose }) {
  const { preferences, updatePreferences, categories } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState({ ...preferences });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggle = (category, channel) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel]
      }
    }));
  };

  const handlePriorityChange = (category, priority) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        min_priority: priority
      }
    }));
  };

  const handleSave = () => {
    updatePreferences(localPrefs);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="ri-modal-overlay" onClick={onClose}>
      <div className="ri-modal-dialog" style={{ width: 720 }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sliders size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Notification Preferences & Channels
              </h3>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Configure channel routing and threshold rules for each intelligence module
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Table */}
        <div style={{ padding: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                <th style={{ padding: '10px 8px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Module Category</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>In-App</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Email</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>Push</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Min Priority</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const p = localPrefs[cat.id] || { in_app: true, email: false, push: false, min_priority: 'LOW' };
                return (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{cat.label}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{cat.module}</div>
                    </td>
                    
                    {/* In-App Toggle */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={p.in_app !== false}
                        onChange={() => handleToggle(cat.id, 'in_app')}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                      />
                    </td>

                    {/* Email Toggle */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!p.email}
                        onChange={() => handleToggle(cat.id, 'email')}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                      />
                    </td>

                    {/* Push Toggle */}
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={!!p.push}
                        onChange={() => handleToggle(cat.id, 'push')}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2563EB' }}
                      />
                    </td>

                    {/* Minimum Priority Select */}
                    <td style={{ padding: '14px 8px' }}>
                      <select
                        value={p.min_priority || 'LOW'}
                        onChange={(e) => handlePriorityChange(cat.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#334155',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="LOW">All (Low+)</option>
                        <option value="MEDIUM">Medium+</option>
                        <option value="HIGH">High Only</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#475569', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: savedSuccess ? '#10B981' : '#2563EB', border: 'none', color: '#FFFFFF', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s ease'
            }}
          >
            {savedSuccess ? <Check size={14} /> : null}
            <span>{savedSuccess ? 'Preferences Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
