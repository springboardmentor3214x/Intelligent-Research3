import { useState, useEffect } from 'react';
import { Activity, Cpu, ShieldCheck, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { getTechnologies, getMaturityAnalysis } from '../../services/technologyApi';

export default function MaturityAnalysisView({ onSelectTechnology }) {
  const [techList, setTechList] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('tech-ai-agents');
  const [maturityData, setMaturityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await getTechnologies();
      setTechList(data);
      if (data.length > 0) {
        setSelectedTechId(data[0].id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadMaturity() {
      if (!selectedTechId) return;
      setLoading(true);
      try {
        const res = await getMaturityAnalysis(selectedTechId);
        setMaturityData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMaturity();
  }, [selectedTechId]);

  const STAGES = ['Research', 'Prototype', 'Developing', 'Adoption', 'Mature'];

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Technology Maturity Analysis</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Multi-Factor Assessment</span>
            </span>
          </div>
          <p>
            Evaluate progression across research, prototyping, enterprise adoption, and industrial standardization without opaque black-box scores.
          </p>
        </div>

        {/* Technology Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ent-text-secondary)' }}>Select Technology:</span>
          <select
            className="ent-select"
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            {techList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !maturityData ? (
        <div className="ent-skeleton" style={{ height: 380 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Progression Ladder */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Activity size={18} color="var(--ent-accent-tech)" />
                <span>Maturity Progression: {maturityData.technology_name}</span>
              </h2>
              <span className="ent-live-tag">
                Current: {maturityData.progression_stage}
              </span>
            </div>

            {/* Visual Step Progression */}
            <div style={{ padding: '20px 10px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`,
                  gap: 12,
                  position: 'relative',
                }}
              >
                {STAGES.map((stage, idx) => {
                  const currentIdx = STAGES.indexOf(maturityData.progression_stage);
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={stage}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: isCurrent
                            ? 'var(--ent-accent-tech)'
                            : isDone
                            ? '#059669'
                            : '#F1F5F9',
                          color: isCurrent || isDone ? '#FFFFFF' : '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none',
                          marginBottom: 8,
                          zIndex: 2,
                        }}
                      >
                        {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>

                      <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--ent-accent-tech)' : 'var(--ent-text-primary)' }}>
                        {stage}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--ent-text-muted)', marginTop: 2 }}>
                        {stage === 'Research' && 'Academic Preprints'}
                        {stage === 'Prototype' && 'Lab Benchmarks'}
                        {stage === 'Developing' && 'Industry Pilots'}
                        {stage === 'Adoption' && 'Commercial Scale'}
                        {stage === 'Mature' && 'Global Standards'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar line connecting them */}
              <div
                className="ent-factor-progress"
                style={{ height: 6, margin: '20px 40px 10px 40px', background: '#E2E8F0' }}
              >
                <div
                  className="ent-factor-fill"
                  style={{
                    width: `${((STAGES.indexOf(maturityData.progression_stage) + 1) / STAGES.length) * 100}%`,
                    background: 'linear-gradient(90deg, #059669, #0284C7)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 6 Explainable Factors Grid */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Info size={17} color="var(--ent-accent-research)" />
                <span>Explainable Basis Factors</span>
              </h2>
              <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>
                System-generated maturity assessment
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              {/* 1. Research Activity */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Research Activity</span>
                  <strong style={{ color: 'var(--ent-accent-research)' }}>
                    {maturityData.factors?.research_activity || 88} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.research_activity || 88}%`, background: 'var(--ent-accent-research)' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Velocity of peer-reviewed articles and preprints in leading scientific repositories.
                </div>
              </div>

              {/* 2. Patent Activity */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Patent Activity</span>
                  <strong style={{ color: 'var(--ent-accent-patent)' }}>
                    {maturityData.factors?.patent_activity || 64} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.patent_activity || 64}%`, background: 'var(--ent-accent-patent)' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Global IP filings across USPTO and EPO showing intellectual protection claims.
                </div>
              </div>

              {/* 3. Adoption Signals */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Adoption Signals</span>
                  <strong style={{ color: '#059669' }}>
                    {maturityData.factors?.adoption_signals || 72} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.adoption_signals || 72}%`, background: '#059669' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Active industry pilot implementations and open-source ecosystem downloads.
                </div>
              </div>

              {/* 4. Organization Activity */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Organization Activity</span>
                  <strong style={{ color: '#D97706' }}>
                    {maturityData.factors?.organization_activity || 85} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.organization_activity || 85}%`, background: '#D97706' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Number of multinational enterprise and university labs contributing.
                </div>
              </div>

              {/* 5. Technology Age */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Technology Age</span>
                  <strong style={{ color: 'var(--ent-text-primary)' }}>
                    {maturityData.factors?.technology_age || 55} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.technology_age || 55}%`, background: '#475569' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Duration since first foundational scientific disclosure.
                </div>
              </div>

              {/* 6. Industry Presence */}
              <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Industry Presence</span>
                  <strong style={{ color: '#0284C7' }}>
                    {maturityData.factors?.industry_presence || 70} / 100
                  </strong>
                </div>
                <div className="ent-factor-progress">
                  <div className="ent-factor-fill" style={{ width: `${maturityData.factors?.industry_presence || 70}%`, background: '#0284C7' }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 6 }}>
                  Standardization working groups and commercial product mentions.
                </div>
              </div>
            </div>

            {/* Explanation Note */}
            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 8,
                fontSize: 13,
                color: '#0369A1',
                lineHeight: 1.5,
              }}
            >
              <strong>System-Generated Assessment: </strong>
              {maturityData.explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
