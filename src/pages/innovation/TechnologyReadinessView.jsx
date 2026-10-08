import { useState, useEffect } from 'react';
import { Cpu, Activity, ArrowRight, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';
import { getTechnologyById } from '../../services/technologyApi';

export default function TechnologyReadinessView({ onNavigateToModule6 }) {
  const [assessments, setAssessments] = useState([]);
  const [activeId, setActiveId] = useState('inno-multi-agent-robotics');
  const [sourceTech, setSourceTech] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await getInnovationAssessments();
      setAssessments(data);
      if (data.length > 0) {
        setActiveId(data[0].id);
        const techRes = await getTechnologyById(data[0].technology_id);
        setSourceTech(techRes.data);
      }
    }
    load();
  }, []);

  const active = assessments.find((a) => a.id === activeId) || assessments[0];

  const handleSelectInnovation = async (id) => {
    setActiveId(id);
    const found = assessments.find((a) => a.id === id);
    if (found) {
      const techRes = await getTechnologyById(found.technology_id);
      setSourceTech(techRes.data);
    }
  };

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Technology Readiness &amp; Maturity Pipeline</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>Unified Module 6 Integration</span>
            </span>
          </div>
          <p>
            Connected directly to Module 6 Technology Intelligence. Transparent provenance guarantees zero duplicate or diverging maturity scores.
          </p>
        </div>

        <select
          className="ent-select"
          value={active?.id}
          onChange={(e) => handleSelectInnovation(e.target.value)}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Cross-Module Provenance Flow Banner */}
      <div
        className="ent-card"
        style={{
          marginBottom: 20,
          background: '#F0F9FF',
          border: '1px solid #BAE6FD',
          padding: 18,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Cross-Module Data Flow
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: 6, border: '1px solid #BAE6FD', fontSize: 13, fontWeight: 600 }}>
            Module 6 Technology Intelligence: <strong>{sourceTech?.name || 'Autonomous AI Agents'}</strong>
          </div>
          <ArrowRight size={16} color="#0284C7" />
          <div style={{ padding: '8px 14px', background: '#FFFFFF', borderRadius: 6, border: '1px solid #BAE6FD', fontSize: 13, fontWeight: 600 }}>
            Stage: <strong>{sourceTech?.maturity_level || 'Developing'}</strong> (Score: {active?.technology_maturity}/100)
          </div>
          <ArrowRight size={16} color="#0284C7" />
          <div style={{ padding: '8px 14px', background: '#0284C7', color: '#FFFFFF', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>
            Module 7 Factor: <strong>{(active?.technology_maturity * 0.15).toFixed(1)} pts (15% Weight)</strong>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        {/* TRL & Maturity Rating */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Activity size={17} color="var(--ent-accent-tech)" />
              <span>Technology Readiness Level (TRL)</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Maturity: {active?.technology_maturity}/100</span>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ent-text-primary)' }}>
              {active?.technology_readiness?.trl_level || 'TRL 5: Validated in Relevant Environment'}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--ent-text-muted)', marginTop: 4 }}>
              Source: <strong>{active?.technology_readiness?.maturity_source}</strong>
            </div>
          </div>

          <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>Primary Scaling Gating Factors:</h3>
          <ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.6 }}>
            {active?.technology_readiness?.gating_factors?.map((f, i) => (
              <li key={i}>{f}</li>
            )) || <li>Fieldbus latency bounds</li>}
          </ul>
        </div>

        {/* Source Signals from Module 6 */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Cpu size={17} color="var(--ent-accent-tech)" />
              <span>Underlying Signal Telemetry</span>
            </h2>
            <span className="ent-live-tag">Direct Feed</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ent-bg-subtle)', borderRadius: 6, fontSize: 13 }}>
              <span>Research Citation Momentum:</span>
              <strong>{sourceTech?.growth_rate || 68}% YoY</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ent-bg-subtle)', borderRadius: 6, fontSize: 13 }}>
              <span>Patent Priority Claim Depth:</span>
              <strong>{sourceTech?.patent_activity || 620} Families</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--ent-bg-subtle)', borderRadius: 6, fontSize: 13 }}>
              <span>Enterprise Pilot Adoption:</span>
              <strong>{sourceTech?.adoption_level || 'Early Enterprise'}</strong>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              className="ent-btn ent-btn-secondary"
              style={{ width: '100%' }}
              onClick={() => onNavigateToModule6(sourceTech?.id)}
            >
              <span>Inspect Source Technology in Module 6</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
