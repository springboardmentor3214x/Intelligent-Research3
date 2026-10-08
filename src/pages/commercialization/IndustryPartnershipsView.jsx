import { useState, useEffect } from 'react';
import { Building2, Handshake, CheckCircle2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { getIndustryPartnerships } from '../../services/commercializationApi';

export default function IndustryPartnershipsView({ innovationId }) {
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getIndustryPartnerships(innovationId || 'inno-multi-agent-robotics');
        setPartnerData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading || !partnerData) {
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  const organizations = partnerData.organizations || [];

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Industry R&amp;D Partnerships</h1>
            <span className="ent-live-tag">
              <Building2 size={12} />
              <span>Multi-Source Alignment Index</span>
            </span>
          </div>
          <p>
            Evidence-based matching of research innovations with industrial conglomerates based on patent portfolios, active solicitations, and technological focus.
          </p>
        </div>
      </div>

      {/* Partnership Types Explanatory Pills */}
      <div
        className="ent-card"
        style={{
          marginBottom: 20,
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          padding: 14,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Available Partnership Structures
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {[
            'Research Collaboration',
            'Joint Development Agreement (JDA)',
            'Technology Validation & Pilot',
            'Product Integration',
            'Industry Testing & Benchmarking',
            'Technology Transfer',
          ].map((type) => (
            <span
              key={type}
              style={{
                padding: '4px 10px',
                background: '#FFFFFF',
                borderRadius: 4,
                border: '1px solid #A7F3D0',
                fontSize: 12,
                fontWeight: 600,
                color: '#065F46',
              }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Organizations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {organizations.map((org, idx) => (
          <div key={idx} className="ent-card cardHover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Building2 size={18} color="var(--ent-accent-tech)" />
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ent-text-primary)' }}>
                    {org.name}
                  </h3>
                </div>
                <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>
                  Domain: {org.technology_domain}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  {org.alignment_score} Alignment
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: '#F1F5F9',
                    color: '#334155',
                  }}
                >
                  {org.partnership_type}
                </span>
              </div>
            </div>

            {/* Rationale & Activity */}
            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)', marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--ent-text-primary)', display: 'block', marginBottom: 4 }}>
                Why This Organization Is Relevant:
              </strong>
              <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {org.relevance_rationale}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ent-text-muted)' }}>
              <span>Historical R&amp;D Activity: <strong>{org.research_activity}</strong></span>
              <span style={{ color: '#047857', fontWeight: 600 }}>Synergistic Technology Transfer Fit</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
