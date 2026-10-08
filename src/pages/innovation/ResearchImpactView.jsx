import { useState, useEffect } from 'react';
import { TrendingUp, FileText, CheckCircle2, ShieldCheck, Award } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function ResearchImpactView() {
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
  const impact = active?.research_impact || {};

  return (
    <div className="fadeIn">
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Research Impact &amp; Novelty Indicators</h1>
            <span className="ent-live-tag">
              <TrendingUp size={12} />
              <span>Module 3 Literature Synthesis</span>
            </span>
          </div>
          <p>
            Synthesized indicators tracking academic publication momentum, citation signals, and novelty metrics from indexed literature.
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div className="ent-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
            Publication Velocity
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ent-accent-research)', marginTop: 6 }}>
            {impact.publication_velocity || '+74% over 24 months'}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ent-text-secondary)', marginTop: 6 }}>
            Substantial acceleration in peer-reviewed disclosures across leading academic venues.
          </p>
        </div>

        <div className="ent-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
            Citation Signals
          </span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ent-accent-patent)', marginTop: 6 }}>
            {impact.citation_signals || '1,240 citations'}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ent-text-secondary)', marginTop: 6 }}>
            High forward citation velocity with influential mentions across international research groups.
          </p>
        </div>

        <div className="ent-card">
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
            Primary Domain Match
          </span>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--ent-text-primary)', marginTop: 6 }}>
            {impact.domain_relevance || 'Robotics & Systems'}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--ent-text-secondary)', marginTop: 6 }}>
            Top indexed venue: <strong>{impact.top_venue || 'IEEE Transactions on Robotics'}</strong>
          </p>
        </div>
      </div>

      {/* Novelty Indicators Card */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h2 className="ent-card-title">
            <Award size={17} color="var(--ent-accent-research)" />
            <span>Novelty Indicators &amp; Qualitative Evidence</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Factor Weight: 30%</span>
        </div>

        <div style={{ padding: 14, background: '#EFF6FF', borderRadius: 8, border: '1px solid #BFDBFE', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: 14, marginBottom: 4 }}>
            Novelty Assessment: {impact.novelty_indicators}
          </div>
          <p style={{ fontSize: 13, color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
            {active?.factors?.research_novelty?.evidence}
          </p>
        </div>

        <div style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.6 }}>
          Research novelty score of <strong>{active?.research_novelty} / 100</strong> contributes <strong>{(active?.research_novelty * 0.3).toFixed(1)} points</strong> toward the total innovation score. This metric is computed from textual dissimilarity with prior art corpora, burst detection algorithms, and semantic distance from existing patented methods.
        </div>
      </div>
    </div>
  );
}
