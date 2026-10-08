import { useState, useEffect } from 'react';
import {
  Rocket,
  Package,
  FileCheck,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { getCommercializationOverview } from '../../services/commercializationApi';

export default function CommercializationHome({ innovationId, onSelectPathway, onViewRecommendations }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getCommercializationOverview(innovationId || 'inno-multi-agent-robotics');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ent-skeleton" style={{ height: 60, width: '40%' }} />
        <div className="ent-skeleton" style={{ height: 160 }} />
        <div className="ent-skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const { pathways = {} } = data;

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Commercialization Intelligence</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>Cross-Module Synthesis (Mod 2–7)</span>
            </span>
          </div>
          <p>
            Explore evidence-based pathways for taking research and technology toward practical use.
          </p>
        </div>

        <button className="ent-btn ent-btn-secondary" onClick={onViewRecommendations}>
          <span>View All Recommendations</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Top Multi-Module Provenance Summary */}
      <div
        className="ent-card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #070D17 0%, #0F1F38 100%)',
          color: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.1)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ maxWidth: 650 }}>
            <span style={{ fontSize: 11.5, color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Active Research &amp; Technology Portfolio
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 8px 0', letterSpacing: '-0.4px' }}>
              {data.title}
            </h2>
            <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5, margin: 0 }}>
              {data.summary}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: 'rgba(255,255,255,0.06)',
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Innovation Score
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#34D399', letterSpacing: -0.5 }}>
                {data.innovation_score}
              </div>
            </div>
            <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.12)' }} />
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Readiness Stage
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                {data.technology_stage}
              </div>
            </div>
          </div>
        </div>

        {/* Cross Module Badges Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: 12.5,
          }}
        >
          <div>
            <span style={{ color: '#94A3B8' }}>Adoption Signal: </span>
            <strong style={{ color: '#FFFFFF' }}>{data.adoption_level}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Patent Activity: </span>
            <strong style={{ color: '#FFFFFF' }}>{data.patent_activity}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Funding Relevance: </span>
            <strong style={{ color: '#34D399' }}>{data.funding_relevance}</strong>
          </div>
        </div>
      </div>

      {/* 4 Main Pathway Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Pathway 1: PRODUCTIZATION */}
        <div
          className="ent-card cardHover"
          style={{ borderTop: '4px solid #0284C7', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#0284C7' }}>
              Productization
            </span>
            <Package size={18} color="#0284C7" />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ent-text-primary)' }}>
            {pathways.productization?.title}
          </h3>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: '#E0F2FE',
                color: '#0369A1',
              }}
            >
              {pathways.productization?.potential}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', flex: 1 }}>
            {pathways.productization?.evidence}
          </p>

          <div
            style={{
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid var(--ent-border-light)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--ent-text-primary)' }}>Recommended Next Step: </strong>
            <span style={{ color: 'var(--ent-text-secondary)' }}>
              {pathways.productization?.recommended_next_step}
            </span>
          </div>

          <button
            className="ent-btn ent-btn-tech"
            style={{ width: '100%' }}
            onClick={() => onSelectPathway('productization')}
          >
            <span>Explore Productization</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Pathway 2: LICENSING */}
        <div
          className="ent-card cardHover"
          style={{ borderTop: '4px solid #7C3AED', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#7C3AED' }}>
              IP Licensing
            </span>
            <FileCheck size={18} color="#7C3AED" />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ent-text-primary)' }}>
            {pathways.licensing?.title}
          </h3>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: '#F5F3FF',
                color: '#6D28D9',
              }}
            >
              {pathways.licensing?.potential}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', flex: 1 }}>
            {pathways.licensing?.evidence}
          </p>

          <div
            style={{
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid var(--ent-border-light)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--ent-text-primary)' }}>Recommended Next Step: </strong>
            <span style={{ color: 'var(--ent-text-secondary)' }}>
              {pathways.licensing?.recommended_next_step}
            </span>
          </div>

          <button
            className="ent-btn ent-btn-secondary"
            style={{ width: '100%', borderColor: '#DDD6FE', color: '#6D28D9' }}
            onClick={() => onSelectPathway('licensing')}
          >
            <span>View Licensing Candidates</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Pathway 3: STARTUP OPPORTUNITY */}
        <div
          className="ent-card cardHover"
          style={{ borderTop: '4px solid #D97706', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#D97706' }}>
              Startup Creation
            </span>
            <Rocket size={18} color="#D97706" />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ent-text-primary)' }}>
            {pathways.startup?.title}
          </h3>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: '#FEF3C7',
                color: '#B45309',
              }}
            >
              {pathways.startup?.potential}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', flex: 1 }}>
            {pathways.startup?.evidence}
          </p>

          <div
            style={{
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid var(--ent-border-light)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--ent-text-primary)' }}>Recommended Next Step: </strong>
            <span style={{ color: 'var(--ent-text-secondary)' }}>
              {pathways.startup?.recommended_next_step}
            </span>
          </div>

          <button
            className="ent-btn ent-btn-innovation"
            style={{ width: '100%' }}
            onClick={() => onSelectPathway('startup')}
          >
            <span>Inspect Startup Venture</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Pathway 4: INDUSTRY PARTNERSHIP */}
        <div
          className="ent-card cardHover"
          style={{ borderTop: '4px solid #059669', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: '#059669' }}>
              Industry Partnership
            </span>
            <Building2 size={18} color="#059669" />
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ent-text-primary)' }}>
            {pathways.industry_partnership?.title}
          </h3>

          <div style={{ marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: '#ECFDF5',
                color: '#047857',
              }}
            >
              {pathways.industry_partnership?.potential}
            </span>
          </div>

          <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', flex: 1 }}>
            {pathways.industry_partnership?.evidence}
          </p>

          <div
            style={{
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: 6,
              border: '1px solid var(--ent-border-light)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--ent-text-primary)' }}>Recommended Next Step: </strong>
            <span style={{ color: 'var(--ent-text-secondary)' }}>
              {pathways.industry_partnership?.recommended_next_step}
            </span>
          </div>

          <button
            className="ent-btn ent-btn-commercial"
            style={{ width: '100%', background: '#059669' }}
            onClick={() => onSelectPathway('partnerships')}
          >
            <span>View Industry Partners</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
