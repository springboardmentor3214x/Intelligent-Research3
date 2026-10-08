import { useState, useEffect } from 'react';
import { Award, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function ScoreDetailsView({ onCommercialize }) {
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState('inno-multi-agent-robotics');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await getInnovationAssessments();
        setAssessments(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const active = assessments.find((a) => a.id === selectedId) || assessments[0];

  if (loading || !active) {
    return <div className="ent-skeleton" style={{ height: 400 }} />;
  }

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Score Details &amp; Mathematical Breakdown</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>Version: {active.methodology_version || 'innovation_v1'}</span>
            </span>
          </div>
          <p>
            Deterministic weighted factor breakdown and empirical evidence underlying the innovation score.
          </p>
        </div>

        <select
          className="ent-select"
          value={active.id}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ fontWeight: 600, maxWidth: 320 }}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Card */}
      <div className="ent-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-accent-innovation)', textTransform: 'uppercase' }}>
              Overall Calculated Score
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
                {active.overall_score}
              </span>
              <span style={{ fontSize: 15, color: 'var(--ent-text-muted)' }}>/ 100</span>
              <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 600, color: '#059669' }}>
                Status: {active.status}
              </span>
            </div>
          </div>

          <button
            className="ent-btn ent-btn-commercial"
            onClick={() => onCommercialize(active.id)}
          >
            <span>Proceed to Commercialization (Module 8)</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Factor Breakdown Table */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h2 className="ent-card-title">
            <Award size={17} color="var(--ent-accent-innovation)" />
            <span>Factor Mathematical Accounting</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Sum of (Score × Weight) = Innovation Score</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--ent-border-light)', color: 'var(--ent-text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Evaluation Factor</th>
              <th style={{ padding: '12px' }}>Normalized Score</th>
              <th style={{ padding: '12px' }}>Official Weight</th>
              <th style={{ padding: '12px' }}>Contribution</th>
              <th style={{ padding: '12px' }}>Calculation Basis &amp; Evidence</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(active.factors || {}).map(([key, item]) => (
              <tr key={key} style={{ borderBottom: '1px solid var(--ent-border-light)' }}>
                <td style={{ padding: '14px 12px', fontWeight: 700, textTransform: 'capitalize', color: 'var(--ent-text-primary)' }}>
                  {key.replace('_', ' ')}
                </td>
                <td style={{ padding: '14px 12px', fontWeight: 800 }}>
                  {item.score} / 100
                </td>
                <td style={{ padding: '14px 12px', color: 'var(--ent-text-muted)' }}>
                  {(item.weight * 100).toFixed(0)}%
                </td>
                <td style={{ padding: '14px 12px', fontWeight: 700, color: 'var(--ent-accent-tech)' }}>
                  +{item.contribution} pts
                </td>
                <td style={{ padding: '14px 12px', color: 'var(--ent-text-secondary)', lineHeight: 1.45, maxWidth: 440 }}>
                  <div style={{ marginBottom: 4 }}>{item.evidence}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>
                    <strong>Basis: </strong>{item.basis}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
