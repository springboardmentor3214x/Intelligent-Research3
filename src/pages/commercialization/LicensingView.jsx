import { useState, useEffect } from 'react';
import { FileCheck, Building2, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { getLicensingCandidates } from '../../services/commercializationApi';

export default function LicensingView({ innovationId, onNavigateToPatent }) {
  const [licensingData, setLicensingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getLicensingCandidates(innovationId || 'inno-multi-agent-robotics');
        setLicensingData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading || !licensingData) {
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  const candidates = licensingData.candidates || [];

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Intellectual Property Licensing Pathways</h1>
            <span className="ent-live-tag">
              <FileCheck size={12} />
              <span>Module 5 Patent Intelligence Linkage</span>
            </span>
          </div>
          <p>
            Connect identified patents, patent claim boundaries, and corporate patent portfolios to potential non-exclusive or exclusive technology licensing candidates.
          </p>
        </div>
      </div>

      {/* Cross-Module Flow Indicator */}
      <div
        className="ent-card"
        style={{
          marginBottom: 20,
          background: '#F5F3FF',
          border: '1px solid #DDD6FE',
          padding: 16,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Module 5 Patent Licensing Chain
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap', fontSize: 12.5, fontWeight: 600 }}>
          <span>Core Technology</span>
          <ArrowRight size={14} color="#7C3AED" />
          <span>Related Patent Portfolio</span>
          <ArrowRight size={14} color="#7C3AED" />
          <span>Portfolio Assignee</span>
          <ArrowRight size={14} color="#7C3AED" />
          <span>Relevant Industry</span>
          <ArrowRight size={14} color="#7C3AED" />
          <span style={{ color: '#6D28D9', fontWeight: 800 }}>Potential Licensing Candidate</span>
        </div>
      </div>

      {/* Candidates List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {candidates.map((cand, idx) => (
          <div key={idx} className="ent-card cardHover" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#EDE9FE',
                      color: '#6D28D9',
                    }}
                  >
                    {cand.patent_id}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>{cand.industry}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ent-text-primary)', margin: 0 }}>
                  {cand.patent_title}
                </h3>
              </div>

              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#F5F3FF',
                  color: '#6D28D9',
                  border: '1px solid #DDD6FE',
                }}
              >
                {cand.readiness_level}
              </span>
            </div>

            {/* Candidate Organization & Relevance */}
            <div style={{ padding: '12px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Building2 size={16} color="var(--ent-accent-tech)" />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ent-text-primary)' }}>
                  Candidate Organization: {cand.owner_candidate}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                <strong>Reason for Relevance: </strong>
                {cand.reason_for_relevance}
              </p>
            </div>

            {/* Language Notice */}
            <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Assessment: <em>Identified as a potential licensing candidate based on patent claim overlap.</em>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
