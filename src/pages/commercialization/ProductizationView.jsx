import { useState, useEffect } from 'react';
import { Package, CheckCircle2, ArrowRight, ShieldCheck, Code, Layers, Wrench } from 'lucide-react';
import { getProductizationDetails } from '../../services/commercializationApi';

export default function ProductizationView({ innovationId }) {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getProductizationDetails(innovationId || 'inno-multi-agent-robotics');
        setProductData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading || !productData) {
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  const details = productData.details || {};

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Productization Blueprint</h1>
            <span className="ent-live-tag">
              <Package size={12} />
              <span>Translational Roadmap</span>
            </span>
          </div>
          <p>
            Structure foundational algorithms and laboratory prototypes into commercial software platforms, hardware SDKs, or enterprise services.
          </p>
        </div>
      </div>

      {/* Main Product Card */}
      <div className="ent-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-accent-tech)', textTransform: 'uppercase' }}>
              Potential Product Specification
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 8px 0', color: 'var(--ent-text-primary)' }}>
              {details.potential_product || 'Enterprise Multi-Agent Orchestration Suite'}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--ent-text-muted)' }}>
              Target Industry: <strong>{details.target_industry}</strong>
            </div>
          </div>

          <span
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              background: '#E0F2FE',
              color: '#0369A1',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            {productData.potential || 'High Analytical Potential'}
          </span>
        </div>

        {/* Problem Solved & Core Tech */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 18 }}>
          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Industrial Problem Solved:
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '6px 0 0 0' }}>
              {details.problem_solved}
            </p>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Core Proprietary Technology:
            </span>
            <p style={{ fontSize: 13.5, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '6px 0 0 0' }}>
              {details.core_technology}
            </p>
          </div>
        </div>

        {/* Target Users */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ent-border-light)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', display: 'block', marginBottom: 8 }}>
            Target Enterprise Users:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {details.target_users?.map((u, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 12px',
                  background: '#F1F5F9',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--ent-text-primary)',
                }}
              >
                {u}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Required Development & Next Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        {/* Required Engineering Development */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Wrench size={17} color="var(--ent-accent-tech)" />
              <span>Required Engineering Development</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Technical Milestones</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {details.required_development?.map((req, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: '#F8FAFC',
                  borderRadius: 6,
                  border: '1px solid var(--ent-border-light)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: '#E2E8F0',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 11,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ color: 'var(--ent-text-secondary)', lineHeight: 1.45 }}>{req}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Possible Commercial Next Steps */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <CheckCircle2 size={17} color="#059669" />
              <span>Commercialization Next Actions</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Actionable Roadmap</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {details.possible_next_steps?.map((step, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  background: '#ECFDF5',
                  borderRadius: 6,
                  border: '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 13,
                }}
              >
                <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: '#065F46', lineHeight: 1.45, fontWeight: 500 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
