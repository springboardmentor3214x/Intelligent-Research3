import { useState, useEffect } from 'react';
import { Briefcase, Building2, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function CommercialViabilityView({ onCommercialize }) {
  const [assessments, setAssessments] = useState([]);
  const [activeId, setActiveId] = useState('inno-multi-agent-robotics');

  useEffect(() => {
    async function load() {
      const { data } = await getInnovationAssessments();
      setAssessments(data);
      if (data.length > 0) setActiveId(data[0].id);
    }
    load();
  }, []);

  const active = assessments.find((a) => a.id === activeId) || assessments[0];
  const viability = active?.commercial_viability || {};

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Commercial Viability Analysis</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Analytical Assessment</span>
            </span>
          </div>
          <p>
            Evidence-based analytical evaluation of industry demand, addressable markets, and adoption willingness without speculative claims of guaranteed commercial success.
          </p>
        </div>

        <select
          className="ent-select"
          value={active?.id}
          onChange={(e) => setActiveId(e.target.value)}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Left: Viability Criteria */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Briefcase size={17} color="var(--ent-accent-innovation)" />
              <span>Market Signals &amp; Problem Relevance</span>
            </h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-accent-innovation)' }}>
              Factor Score: {active?.market_potential} / 100
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ent-text-muted)' }}>Target Industries</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                {viability.target_industries?.map((ind, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px',
                      background: 'var(--ent-bg-subtle)',
                      borderRadius: 6,
                      border: '1px solid var(--ent-border-light)',
                      fontSize: 12.5,
                      fontWeight: 600,
                    }}
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)' }}>Problem Relevance:</span>
              <div style={{ fontSize: 13.5, color: 'var(--ent-text-primary)', marginTop: 2 }}>
                {viability.problem_relevance}
              </div>
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)' }}>Adoption Velocity Signal:</span>
              <div style={{ fontSize: 13.5, color: 'var(--ent-text-primary)', marginTop: 2 }}>
                {viability.adoption_signal}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Analytical Potential Assessment */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <TrendingUp size={17} color="#059669" />
              <span>Commercialization Potential</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>20% Factor Weight</span>
          </div>

          <div
            style={{
              padding: 16,
              background: '#FFFBEB',
              borderRadius: 8,
              border: '1px solid #FDE68A',
              marginBottom: 16,
              fontSize: 13,
              color: '#92400E',
              lineHeight: 1.5,
            }}
          >
            <strong>Analytical Disclaimer: </strong>
            This analytical assessment reflects current market indicators, industry capex trends, and customer willingness to pay. It does not constitute an endorsement or guarantee of commercial success.
          </div>

          <p style={{ fontSize: 13.5, color: 'var(--ent-text-secondary)', lineHeight: 1.55 }}>
            {viability.potential_assessment || 'High analytical potential contingent on industrial safety certification.'}
          </p>

          <div style={{ marginTop: 20 }}>
            <button
              className="ent-btn ent-btn-commercial"
              style={{ width: '100%' }}
              onClick={() => onCommercialize(active.id)}
            >
              <span>Explore Detailed Commercialization Pathways (Module 8)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
