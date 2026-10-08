import { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, ArrowRight, Layers, ExternalLink } from 'lucide-react';
import { getRecommendationDetails } from '../../services/commercializationApi';

export default function RecommendationDetailsView({ innovationId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getRecommendationDetails(innovationId || 'inno-multi-agent-robotics');
        setRecommendations(res.recommendations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [innovationId]);

  if (loading) {
    return <div className="ent-skeleton" style={{ height: 420 }} />;
  }

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Actionable Commercialization Recommendations</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>Multi-Source Provenance</span>
            </span>
          </div>
          <p>
            Structured strategic next actions synthesized across patent intelligence, technology readiness, grant matches, and innovation scoring.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {recommendations.map((rec, idx) => (
          <div key={rec.id || idx} className="ent-card cardHover" style={{ padding: 22 }}>
            {/* Top Bar: Recommendation & Confidence */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--ent-accent-commercial)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {idx + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ent-text-primary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {rec.recommendation}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rec.source_modules?.map((sm, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: '#F1F5F9',
                          color: '#334155',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        Source: {sm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: rec.confidence === 'Very High' || rec.confidence === 'High' ? '#ECFDF5' : '#FFFBEB',
                  color: rec.confidence === 'Very High' || rec.confidence === 'High' ? '#047857' : '#B45309',
                  border: `1px solid ${rec.confidence === 'Very High' || rec.confidence === 'High' ? '#A7F3D0' : '#FDE68A'}`,
                }}
              >
                {rec.confidence} Confidence
              </span>
            </div>

            {/* Evidence & Supporting Data Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12, margin: '14px 0' }}>
              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <strong style={{ fontSize: 12, color: 'var(--ent-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Empirical Evidence:
                </strong>
                <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {rec.evidence}
                </p>
              </div>

              <div style={{ padding: 12, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                <strong style={{ fontSize: 12, color: 'var(--ent-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  Supporting Platform Data:
                </strong>
                <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {rec.supporting_data}
                </p>
              </div>
            </div>

            {/* Next Action Pill */}
            <div
              style={{
                padding: '10px 14px',
                background: '#ECFDF5',
                borderRadius: 6,
                border: '1px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: '#065F46',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>Immediate Next Action: {rec.next_action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
