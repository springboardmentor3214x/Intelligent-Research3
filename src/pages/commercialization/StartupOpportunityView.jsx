import { useState, useEffect } from 'react';
import { Rocket, ShieldCheck, CheckCircle2, DollarSign, TrendingUp, Users } from 'lucide-react';
import { getStartupOpportunity } from '../../services/commercializationApi';

export default function StartupOpportunityView({ innovationId }) {
  const [startupData, setStartupData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getStartupOpportunity(innovationId || 'inno-multi-agent-robotics');
        setStartupData(res.details || {});
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading || !startupData) {
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Potential Startup Opportunity</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Venture Translation Feasibility</span>
            </span>
          </div>
          <p>
            Analytical evaluation of new venture spinout potential, business model hypotheses, and early non-dilutive capital pathways.
          </p>
        </div>
      </div>

      {/* Main Venture Card */}
      <div className="ent-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-accent-innovation)', textTransform: 'uppercase' }}>
              Venture Concept Hypothesis
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: '4px 0 8px 0', color: 'var(--ent-text-primary)' }}>
              {startupData.opportunity_title || 'Autonomous Swarm Intralogistics Platform'}
            </h2>
            <div style={{ fontSize: 13, color: 'var(--ent-text-muted)' }}>
              Technology Readiness: <strong>{startupData.technology_readiness}</strong> · Innovation Rating: <strong>{startupData.innovation_score}</strong>
            </div>
          </div>

          <div style={{ padding: '6px 14px', background: '#FEF3C7', color: '#B45309', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
            Potential Startup Opportunity
          </div>
        </div>

        {/* Problem vs Solution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 18 }}>
          <div style={{ padding: 14, background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
              Research Problem:
            </span>
            <p style={{ fontSize: 13.5, color: '#991B1B', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {startupData.research_problem}
            </p>
          </div>

          <div style={{ padding: 14, background: '#ECFDF5', borderRadius: 8, border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              Proposed Solution:
            </span>
            <p style={{ fontSize: 13.5, color: '#065F46', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {startupData.proposed_solution}
            </p>
          </div>
        </div>

        {/* Target Customers */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--ent-border-light)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', display: 'block', marginBottom: 8 }}>
            Initial Target Customer Segments:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {startupData.target_customers?.map((cust, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 12px',
                  background: 'var(--ent-bg-subtle)',
                  borderRadius: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--ent-text-primary)',
                }}
              >
                {cust}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Business Model, Competitors, Funding, Next Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Business Model & Financing */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <DollarSign size={17} color="#059669" />
              <span>Business Model &amp; Non-Dilutive Capital</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)' }}>Possible Business Model:</span>
              <p style={{ fontSize: 13, color: 'var(--ent-text-primary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {startupData.possible_business_model}
              </p>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)' }}>Matched Capital Sources:</span>
              <p style={{ fontSize: 13, color: '#047857', margin: '4px 0 0 0', lineHeight: 1.5, fontWeight: 500 }}>
                {startupData.funding_opportunities}
              </p>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)' }}>Competitive Dynamics:</span>
              <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                {startupData.competitive_landscape}
              </p>
            </div>
          </div>
        </div>

        {/* Spinout Roadmap Actions */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <CheckCircle2 size={17} color="var(--ent-accent-tech)" />
              <span>Spinout Roadmap Next Steps</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Recommended Sequence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {startupData.next_steps?.map((step, idx) => (
              <div
                key={idx}
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
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'var(--ent-accent-tech)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <span style={{ color: 'var(--ent-text-secondary)', lineHeight: 1.45 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
