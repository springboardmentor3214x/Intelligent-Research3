import { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, Scale, TrendingUp, ArrowRight } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function CompareInnovationsView({ onCommercialize }) {
  const [innovations, setInnovations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await getInnovationAssessments();
        setInnovations(data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="ent-skeleton" style={{ height: 400 }} />;
  }

  const FACTORS = [
    { key: 'research_novelty', label: 'Research Novelty', weight: '30%' },
    { key: 'patent_strength', label: 'Patent Strength', weight: '20%' },
    { key: 'technology_maturity', label: 'Technology Maturity', weight: '15%' },
    { key: 'market_potential', label: 'Market Potential', weight: '20%' },
    { key: 'funding_relevance', label: 'Funding Relevance', weight: '15%' },
    { key: 'overall_score', label: 'Overall Innovation Score', isTotal: true },
  ];

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Compare Innovations</h1>
            <span className="ent-live-tag">
              <Scale size={12} />
              <span>Side-by-Side Factor Benchmarking</span>
            </span>
          </div>
          <p>
            Comparative analysis of multiple evaluated innovations across all five weighted dimensions.
          </p>
        </div>
      </div>

      {/* Comparison Table Card */}
      <div className="ent-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: '#0B1527', color: '#FFFFFF' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', width: '25%' }}>
                Evaluation Factor &amp; Weight
              </th>
              {innovations.map((inv) => (
                <th key={inv.id} style={{ padding: '16px 20px', textAlign: 'center', width: '25%' }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{inv.title}</div>
                  <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
                    {inv.domain}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FACTORS.map((f, rowIdx) => {
              // Find max score among innovations for this factor to highlight strength
              const values = innovations.map((inv) => inv[f.key]);
              const maxVal = Math.max(...values);
              const minVal = Math.min(...values);

              return (
                <tr
                  key={f.key}
                  style={{
                    borderBottom: '1px solid var(--ent-border-light)',
                    background: f.isTotal ? '#F8FAFC' : rowIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  }}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--ent-text-primary)' }}>
                    <div>{f.label}</div>
                    {f.weight && (
                      <span style={{ fontSize: 11, color: 'var(--ent-text-muted)', fontWeight: 500 }}>
                        Weight: {f.weight}
                      </span>
                    )}
                  </td>

                  {innovations.map((inv) => {
                    const val = inv[f.key];
                    const isStrongest = val === maxVal && maxVal !== minVal;
                    const isWeakest = val === minVal && maxVal !== minVal;

                    return (
                      <td
                        key={inv.id}
                        style={{
                          padding: '14px 20px',
                          textAlign: 'center',
                          fontWeight: f.isTotal ? 800 : 700,
                          fontSize: f.isTotal ? 18 : 14.5,
                          color: f.isTotal ? 'var(--ent-accent-tech)' : 'var(--ent-text-primary)',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{val}</span>
                          {isStrongest && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: '#ECFDF5',
                                color: '#047857',
                                padding: '2px 6px',
                                borderRadius: 4,
                              }}
                            >
                              Top
                            </span>
                          )}
                          {isWeakest && !f.isTotal && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                background: '#FFFBEB',
                                color: '#B45309',
                                padding: '2px 6px',
                                borderRadius: 4,
                              }}
                            >
                              Gap
                            </span>
                          )}
                        </div>

                        {!f.isTotal && (
                          <div className="ent-factor-progress" style={{ height: 4, width: 90, margin: '6px auto 0 auto' }}>
                            <div
                              className="ent-factor-fill"
                              style={{
                                width: `${val}%`,
                                background: isStrongest ? '#059669' : 'var(--ent-accent-tech)',
                              }}
                            />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Commercialize Action Row */}
            <tr style={{ background: '#FFFFFF' }}>
              <td style={{ padding: '16px 20px', fontWeight: 700 }}>Recommended Next Step</td>
              {innovations.map((inv) => (
                <td key={inv.id} style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <button
                    className="ent-btn ent-btn-commercial"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => onCommercialize(inv.id)}
                  >
                    <span>View Pathways (Mod 8)</span>
                    <ArrowRight size={12} />
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
