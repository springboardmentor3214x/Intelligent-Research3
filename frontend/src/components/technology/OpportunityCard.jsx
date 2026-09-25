import React from 'react';
import { Zap, AlertCircle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

/**
 * Opportunity Card Component for Innovation Signals
 */
export default function OpportunityCard({ opportunity, onSelectTech }) {
  if (!opportunity) return null;

  const getSignalMeta = (type) => {
    switch (type) {
      case 'adoption_gap':
        return {
          icon: <AlertCircle size={16} color="#fbbf24" />,
          label: 'Adoption Gap',
          borderClass: 'strength-medium',
        };
      case 'growth_spike':
        return {
          icon: <TrendingUp size={16} color="#34d399" />,
          label: 'Growth Acceleration',
          borderClass: 'strength-high',
        };
      case 'research_application_gap':
        return {
          icon: <Zap size={16} color="#38bdf8" />,
          label: 'Research-Patent Transfer Gap',
          borderClass: 'strength-high',
        };
      case 'org_surge':
        return {
          icon: <Users size={16} color="#a855f7" />,
          label: 'Institutional Expansion',
          borderClass: 'strength-medium',
        };
      default:
        return {
          icon: <Zap size={16} color="#94a3b8" />,
          label: 'Innovation Signal',
          borderClass: 'strength-low',
        };
    }
  };

  const meta = getSignalMeta(opportunity.signal_type);
  const confidencePercent = Math.round((opportunity.confidence || 0.7) * 100);

  return (
    <div className={`opp-card ${meta.borderClass}`}>
      <div className="opp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {meta.icon}
          <span className="opp-type-badge">{meta.label}</span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--clr-text-muted)',
            fontWeight: 500,
          }}
        >
          {confidencePercent}% Confidence
        </span>
      </div>

      <div className="opp-title">{opportunity.title}</div>
      <div className="opp-desc">{opportunity.description}</div>

      {opportunity.recommended_action && (
        <div className="opp-action">
          <strong>Recommended Action:</strong> {opportunity.recommended_action}
        </div>
      )}

      {opportunity.technology_id && onSelectTech && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            className="tech-btn tech-btn-secondary"
            style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            onClick={() => onSelectTech(opportunity.technology_id)}
          >
            Investigate Tech <ArrowUpRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
