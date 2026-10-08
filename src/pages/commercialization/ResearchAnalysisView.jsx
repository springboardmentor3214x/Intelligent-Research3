import { useState, useEffect } from 'react';
import { Layers, Lightbulb, ShieldCheck, CheckCircle2, Award, FileText } from 'lucide-react';
import { getCommercializationOverview } from '../../services/commercializationApi';

export default function ResearchAnalysisView({ innovationId }) {
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
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  const potentialApps = [
    {
      title: 'High-Throughput Electronics Assembly Retooling',
      industry: 'Semiconductor & Consumer Electronics Assembly',
      evidence: 'Proven peer-to-peer collision avoidance eliminating physical stops during multi-arm component insertion.',
      benefit: 'Reduces line changeover downtime from 18 hours to 25 minutes.',
    },
    {
      title: 'Autonomous Mobile Robot (AMR) Swarm Warehousing',
      industry: 'Supply Chain & Intralogistics',
      evidence: 'Decentralized auction algorithms preventing intersection deadlocks in dynamic fulfillment corridors.',
      benefit: '34% higher parcel throughput during peak e-commerce demand shifts.',
    },
    {
      title: 'Adaptive Robotic Surgical Assistance',
      industry: 'Medical Devices & Healthcare',
      evidence: 'Sub-millisecond sensor arbitration bounds supporting dual surgeon-robot collaborative manipulation.',
      benefit: 'Eliminates instrument tremor while respecting dynamic anatomical boundary zones.',
    },
  ];

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Research Commercialization Analysis</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>Translational Feasibility</span>
            </span>
          </div>
          <p>
            Evaluate foundational research discoveries for practical applications, target industries, and intellectual property defensibility.
          </p>
        </div>
      </div>

      {/* Synthesis Matrix Card */}
      <div className="ent-card" style={{ marginBottom: 24 }}>
        <div className="ent-card-header">
          <h2 className="ent-card-title">
            <Layers size={17} color="var(--ent-accent-tech)" />
            <span>Research &amp; Patent Landscape Profile</span>
          </h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
            Innovation Score: {data.innovation_score} / 100
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Core Technology
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ent-text-primary)', marginTop: 4 }}>
              {data.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 2 }}>
              Domain: {data.domain}
            </div>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Technology Maturity
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0284C7', marginTop: 4 }}>
              {data.technology_stage}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 2 }}>
              Adoption: {data.adoption_level}
            </div>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Patent Landscape
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#7C3AED', marginTop: 4 }}>
              {data.patent_activity}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 2 }}>
              Freedom-to-operate verified in decentralized routing.
            </div>
          </div>

          <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-text-muted)', textTransform: 'uppercase' }}>
              Funding Pipeline
            </span>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginTop: 4 }}>
              {data.funding_relevance}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 2 }}>
              NSF &amp; Horizon Europe non-dilutive translation.
            </div>
          </div>
        </div>
      </div>

      {/* Potential Applications List with Evidence */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h2 className="ent-card-title">
            <Lightbulb size={17} color="#D97706" />
            <span>Target Potential Applications &amp; Supporting Evidence</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Evidence-Backed Analysis</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {potentialApps.map((app, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                background: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid var(--ent-border-light)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ent-text-primary)', margin: 0 }}>
                  {app.title}
                </h3>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                  }}
                >
                  {app.industry}
                </span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--ent-text-secondary)', marginBottom: 6 }}>
                <strong>Evidence: </strong>{app.evidence}
              </div>

              <div style={{ fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                Translational Value: {app.benefit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
