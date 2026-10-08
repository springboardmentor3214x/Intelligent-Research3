import { useState } from 'react';
import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import {
  Settings, ShieldCheck, Database, Sliders, Bell,
  CheckCircle2, AlertCircle, Wifi, Globe, Lock,
  ToggleLeft, ToggleRight, Server, Key, Eye
} from 'lucide-react';

const ToggleRow = ({ label, desc, initial = true }) => {
  const [on, setOn] = useState(initial);
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)',
      }}
    >
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ent-text-primary)' }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      <button
        onClick={() => setOn(!on)}
        style={{
          background: on ? '#2563EB' : '#CBD5E1', border: 'none', borderRadius: 20,
          width: 42, height: 24, cursor: 'pointer', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
        }}
        aria-label={on ? 'Turn off' : 'Turn on'}
      >
        <span style={{
          position: 'absolute', top: 3, left: on ? 20 : 3,
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s ease',
        }} />
      </button>
    </div>
  );
};

const StatusRow = ({ label, value, status = 'active' }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)',
    fontSize: 13,
  }}>
    <span style={{ color: 'var(--ent-text-secondary)' }}>{label}</span>
    <span style={{
      fontWeight: 600,
      color: status === 'active' ? '#059669' : status === 'warning' ? '#D97706' : 'var(--ent-text-primary)',
    }}>
      {status === 'active' && '✓ '}{value}
    </span>
  </div>
);

export default function SettingsPage() {
  return (
    <EnterpriseLayout
      activeModule="settings"
      moduleTitle="System Settings"
      breadcrumbs={['Configuration']}
    >
      <div className="fadeIn">
        <div className="ent-module-header">
          <div className="ent-module-title-group">
            <h1>Platform Settings & Preferences</h1>
            <p>Configure intelligence telemetry feeds, scoring methodologies, notification channels, and security policies.</p>
          </div>
          <button className="ent-btn ent-btn-primary">
            <CheckCircle2 size={14} />
            Save Changes
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

          {/* API & Backend */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Database size={17} color="var(--ent-accent-tech)" />
                <span>API & Backend Integrations</span>
              </h2>
              <span style={{ fontSize: 11, background: '#ECFDF5', color: '#047857', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
                All Active
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatusRow label="FastAPI Backend URL" value="127.0.0.1:8000" status="active" />
              <StatusRow label="Module 7 Innovation Router" value="/api/innovation (Active)" status="active" />
              <StatusRow label="OpenAlex Multi-Source Index" value="Connected" status="active" />
              <StatusRow label="Semantic Scholar API" value="Connected" status="active" />
              <StatusRow label="Supabase Authentication" value="Operational" status="active" />
            </div>
          </div>

          {/* Methodology Configuration */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Sliders size={17} color="var(--ent-accent-innovation)" />
                <span>Methodology Configuration</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Research Novelty', weight: 30, color: '#2563EB' },
                { label: 'Patent Strength', weight: 20, color: '#7C3AED' },
                { label: 'Market Potential', weight: 20, color: '#059669' },
                { label: 'Tech Maturity', weight: 15, color: '#0284C7' },
                { label: 'Funding Relevance', weight: 15, color: '#D97706' },
              ].map((w) => (
                <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--ent-text-secondary)', minWidth: 140 }}>{w.label}</span>
                  <div style={{ flex: 1, height: 6, background: 'var(--ent-bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${w.weight * 3.3}%`, height: '100%', background: w.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: w.color, minWidth: 30 }}>{w.weight}%</span>
                </div>
              ))}
              <div style={{ marginTop: 6, padding: '8px 12px', background: 'var(--ent-bg-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--ent-text-muted)' }}>
                Active formula: <strong style={{ color: 'var(--ent-text-primary)' }}>innovation_v1</strong> · Multi-factor weighted model
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Bell size={17} color="#D97706" />
                <span>Notification Preferences</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ToggleRow label="Patent cluster alerts" desc="Notify when 10+ new claims match your profile" initial={true} />
              <ToggleRow label="Funding deadline reminders" desc="Alert 14 and 7 days before close" initial={true} />
              <ToggleRow label="Technology maturity shifts" desc="Track TRL stage progression events" initial={true} />
              <ToggleRow label="Research citation bursts" desc="Papers gaining 20+ citations in 48h" initial={false} />
              <ToggleRow label="Weekly digest email" desc="Curated weekly intelligence summary" initial={true} />
            </div>
          </div>

          {/* Security & Access */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <ShieldCheck size={17} color="#059669" />
                <span>Security & Access Control</span>
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ToggleRow label="Two-Factor Authentication" desc="Enhanced login security via TOTP" initial={true} />
              <ToggleRow label="Single Sign-On (SSO)" desc="Enterprise SSO via Supabase OAuth" initial={false} />
              <ToggleRow label="API Rate Limiting" desc="Protect backend from request floods" initial={true} />
              <StatusRow label="Session timeout" value="30 minutes" status="default" />
              <StatusRow label="Data encryption" value="AES-256 at rest" status="active" />
            </div>
          </div>

        </div>
      </div>
    </EnterpriseLayout>
  );
}
