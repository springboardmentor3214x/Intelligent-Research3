import {
  Users, Search, TrendingUp, FileText, Lightbulb, Award,
  Rocket, Bell, PieChart, FileDown, Shield, Settings,
} from 'lucide-react';

const ICON_MAP = {
  Users, Search, TrendingUp, FileText, Lightbulb, Award,
  Rocket, Bell, PieChart, FileDown, Shield, Settings,
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Module ID → App route mapping (for implemented modules)
const MODULE_LAUNCH = {
  '03': { path: '/research', label: 'Launch Module 3 (Research) →' },
  '02': { path: '/funding', label: 'Launch Module 4 (Funding) →' },
  '04': { path: '/patents', label: 'Launch Module 5 (Patents) →' },
};

export default function ModuleCard({ module, index }) {
  const Icon = ICON_MAP[module.icon] || Settings;
  const delay = `${(index % 4) * 0.1}s`;
  const launch = MODULE_LAUNCH[module.id];

  return (
    <div
      className="module-card"
      style={{
        '--module-color': module.color,
        '--module-bg': hexToRgba(module.color, 0.08),
        '--module-shadow': hexToRgba(module.color, 0.2),
        animationDelay: delay,
      }}
    >
      <div className="module-card-header">
        <div className="module-icon-wrap">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <span className="module-num">{module.id}</span>
      </div>

      <div className="module-title">{module.title}</div>
      <div className="module-desc">{module.description}</div>

      <ul className="module-features">
        {module.features.map((f) => (
          <li key={f} className="module-feature">{f}</li>
        ))}
      </ul>

      {launch && (
        <a
          href={launch.path}
          style={{
            marginTop: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--module-color)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'var(--module-bg)',
            border: '1px solid var(--module-color)',
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = module.color;
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = hexToRgba(module.color, 0.08);
            e.currentTarget.style.color = module.color;
          }}
        >
          {launch.label}
        </a>
      )}
    </div>
  );
}
