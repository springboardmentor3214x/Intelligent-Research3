import { useState, useEffect } from 'react';
import { Activity, TrendingUp, ShieldCheck, FileText, Building2, Calendar } from 'lucide-react';
import { getTechnologies, getAdoptionSignals } from '../../services/technologyApi';

export default function AdoptionTrackingView() {
  const [techList, setTechList] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState('tech-ai-agents');
  const [timeRange, setTimeRange] = useState('5yr'); // 5yr, 10yr
  const [adoptionData, setAdoptionData] = useState(null);
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
    async function loadData() {
      if (!selectedTechId) return;
      setLoading(true);
      try {
        const res = await getAdoptionSignals(selectedTechId, timeRange);
        setAdoptionData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedTechId, timeRange]);

  const trends = adoptionData?.trends || [];
  const maxPub = Math.max(...trends.map((t) => t.publications), 100);
  const maxPat = Math.max(...trends.map((t) => t.patents), 50);
  const maxOrg = Math.max(...trends.map((t) => t.organizations), 20);

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Technology Adoption Tracking</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Multi-Source Longitudinal Signals</span>
            </span>
          </div>
          <p>
            Longitudinal telemetry tracking publication volume, patent filings, and industrial consortia growth across historical timeframes.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="ent-select"
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
          >
            {techList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 6 }}>
            <button
              className="ent-btn"
              style={{
                padding: '5px 12px',
                fontSize: 12,
                background: timeRange === '5yr' ? '#FFFFFF' : 'transparent',
                color: timeRange === '5yr' ? 'var(--ent-text-primary)' : 'var(--ent-text-muted)',
                boxShadow: timeRange === '5yr' ? 'var(--ent-shadow-sm)' : 'none',
              }}
              onClick={() => setTimeRange('5yr')}
            >
              5 Years
            </button>
            <button
              className="ent-btn"
              style={{
                padding: '5px 12px',
                fontSize: 12,
                background: timeRange === '10yr' ? '#FFFFFF' : 'transparent',
                color: timeRange === '10yr' ? 'var(--ent-text-primary)' : 'var(--ent-text-muted)',
                boxShadow: timeRange === '10yr' ? 'var(--ent-shadow-sm)' : 'none',
              }}
              onClick={() => setTimeRange('10yr')}
            >
              10 Years
            </button>
          </div>
        </div>
      </div>

      {loading || !adoptionData ? (
        <div className="ent-skeleton" style={{ height: 420 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Signal Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="ent-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ent-accent-research)', marginBottom: 6 }}>
                <TrendingUp size={16} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Research Velocity</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{adoptionData.signals?.research_velocity}</div>
            </div>

            <div className="ent-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ent-accent-patent)', marginBottom: 6 }}>
                <FileText size={16} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Patent Filings</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{adoptionData.signals?.patent_acceleration}</div>
            </div>

            <div className="ent-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', marginBottom: 6 }}>
                <Building2 size={16} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Active Organizations</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{adoptionData.signals?.organization_diversity}</div>
            </div>
          </div>

          {/* Combined SVG Area/Line Chart */}
          <div className="ent-card">
            <div className="ent-card-header">
              <h2 className="ent-card-title">
                <Activity size={17} color="var(--ent-accent-tech)" />
                <span>Multi-Signal Adoption Curves: {adoptionData.technology_name}</span>
              </h2>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ent-accent-research)' }} />
                  Publications
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ent-accent-patent)' }} />
                  Patents
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669' }} />
                  Organizations
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div style={{ padding: '20px 0' }}>
              <svg viewBox="0 0 600 240" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                {/* Horizontal Guide Lines */}
                {[40, 90, 140, 190].map((y) => (
                  <line key={y} x1="40" y1={y} x2="580" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                ))}

                {/* Plot Publications (Blue Line) */}
                <path
                  d={trends
                    .map((pt, idx) => {
                      const x = 50 + (idx / Math.max(1, trends.length - 1)) * 510;
                      const y = 190 - (pt.publications / maxPub) * 150;
                      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="var(--ent-accent-research)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Plot Patents (Purple Line) */}
                <path
                  d={trends
                    .map((pt, idx) => {
                      const x = 50 + (idx / Math.max(1, trends.length - 1)) * 510;
                      const y = 190 - (pt.patents / maxPat) * 120;
                      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="var(--ent-accent-patent)"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />

                {/* Plot Organizations (Green Line) */}
                <path
                  d={trends
                    .map((pt, idx) => {
                      const x = 50 + (idx / Math.max(1, trends.length - 1)) * 510;
                      const y = 190 - (pt.organizations / maxOrg) * 100;
                      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Data Points and X labels */}
                {trends.map((pt, idx) => {
                  const x = 50 + (idx / Math.max(1, trends.length - 1)) * 510;
                  const yPub = 190 - (pt.publications / maxPub) * 150;

                  return (
                    <g key={idx}>
                      <circle cx={x} cy={yPub} r="4" fill="#FFFFFF" stroke="var(--ent-accent-research)" strokeWidth="2" />
                      <text x={x} y={yPub - 8} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ent-accent-research)">
                        {pt.publications}
                      </text>
                      <text x={x} y="210" textAnchor="middle" fontSize="11" fill="#64748B">
                        {pt.year}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div
                style={{
                  marginTop: 20,
                  padding: 14,
                  background: '#F8FAFC',
                  borderRadius: 6,
                  border: '1px solid var(--ent-border-light)',
                  fontSize: 12.5,
                  color: 'var(--ent-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong>Trajectory Explanation: </strong>
                Research publication velocity ({adoptionData.signals?.research_velocity}) precedes commercial patent filings by approximately 18 to 24 months. Industrial organization participation expanded in lockstep with patent claim stabilization, indicating solid commercial translation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
