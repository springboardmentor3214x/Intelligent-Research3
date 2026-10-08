import { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  FileText,
  Activity,
  DollarSign,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function ScoringDashboardHome({ onSelectAssessment, onNewAssessment, onCommercialize }) {
  const [assessments, setAssessments] = useState([]);
  const [activeInnovation, setActiveInnovation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getInnovationAssessments();
        setAssessments(res.data);
        if (res.data.length > 0) {
          setActiveInnovation(res.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !activeInnovation) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ent-skeleton" style={{ height: 60, width: '40%' }} />
        <div className="ent-skeleton" style={{ height: 160 }} />
        <div className="ent-skeleton" style={{ height: 380 }} />
      </div>
    );
  }

  const {
    research_novelty = 88,
    patent_strength = 75,
    technology_maturity = 70,
    market_potential = 85,
    funding_relevance = 90,
    overall_score = 82.4,
  } = activeInnovation;

  // Radar polygon points calculation (Center at 150, 150; radius 100)
  const radarFactors = [
    { label: 'Research Novelty', score: research_novelty, weight: '30%', angle: -90, color: 'var(--ent-accent-research)' },
    { label: 'Patent Strength', score: patent_strength, weight: '20%', angle: -18, color: 'var(--ent-accent-patent)' },
    { label: 'Tech Maturity', score: technology_maturity, weight: '15%', angle: 54, color: 'var(--ent-accent-tech)' },
    { label: 'Market Potential', score: market_potential, weight: '20%', angle: 126, color: 'var(--ent-accent-innovation)' },
    { label: 'Funding Relevance', score: funding_relevance, weight: '15%', angle: 198, color: 'var(--ent-accent-funding)' },
  ];

  const radarPoints = radarFactors
    .map((f) => {
      const rad = (f.angle * Math.PI) / 180;
      const r = (f.score / 100) * 95;
      const x = 150 + r * Math.cos(rad);
      const y = 150 + r * Math.sin(rad);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Innovation Scoring Engine</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>FastAPI Backend · innovation_v1</span>
            </span>
          </div>
          <p>
            Evaluate innovation potential using transparent evidence-based factors.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Innovation Switcher */}
          <select
            className="ent-select"
            value={activeInnovation.id}
            onChange={(e) => {
              const found = assessments.find((a) => a.id === e.target.value);
              if (found) setActiveInnovation(found);
            }}
            style={{ fontWeight: 600, maxWidth: 300 }}
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          <button className="ent-btn ent-btn-primary" onClick={onNewAssessment}>
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Top Banner: Innovation Profile & Overall Score Ring */}
      <div
        className="ent-card"
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #0B1527 0%, #152238 100%)',
          color: '#FFFFFF',
          padding: 24,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          {/* Left summary */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <span style={{ fontSize: 11.5, color: '#38BDF8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Evaluated Innovation Assessment
            </span>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 10px 0', letterSpacing: '-0.4px' }}>
              {activeInnovation.title}
            </h2>
            <p style={{ fontSize: 13.5, color: '#CBD5E1', lineHeight: 1.5, margin: '0 0 16px 0', maxWidth: 640 }}>
              {activeInnovation.summary}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                className="ent-btn ent-btn-commercial"
                onClick={() => onCommercialize(activeInnovation.id)}
                style={{ background: '#0D9488', color: '#FFFFFF' }}
              >
                <span>Generate Commercialization Pathways (Module 8)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right: Overall Score Display */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              background: 'rgba(255,255,255,0.06)',
              padding: '18px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* SVG Score Ring */}
            <div style={{ position: 'relative', width: 96, height: 96 }}>
              <svg width="96" height="96" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="8"
                  strokeDasharray={`${(overall_score / 100) * 264} 264`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>
                  {overall_score}
                </span>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>
                Innovation Score
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginTop: 2 }}>
                High Innovation Potential
              </div>
              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4 }}>
                Strongest: <strong>{activeInnovation.strongest_factor || 'Funding Relevance'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Weighted Factor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Factor 1: Research Novelty (30%) */}
        <div className="ent-card cardHover" style={{ borderLeft: '4px solid var(--ent-accent-research)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-secondary)' }}>Research Novelty</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ent-accent-research)' }}>Weight: 30%</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
            {research_novelty}
          </div>
          <div className="ent-factor-progress">
            <div className="ent-factor-fill" style={{ width: `${research_novelty}%`, background: 'var(--ent-accent-research)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 8 }}>
            Contribution: <strong>{(research_novelty * 0.3).toFixed(1)} pts</strong>
          </div>
        </div>

        {/* Factor 2: Patent Strength (20%) */}
        <div className="ent-card cardHover" style={{ borderLeft: '4px solid var(--ent-accent-patent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-secondary)' }}>Patent Strength</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ent-accent-patent)' }}>Weight: 20%</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
            {patent_strength}
          </div>
          <div className="ent-factor-progress">
            <div className="ent-factor-fill" style={{ width: `${patent_strength}%`, background: 'var(--ent-accent-patent)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 8 }}>
            Contribution: <strong>{(patent_strength * 0.2).toFixed(1)} pts</strong>
          </div>
        </div>

        {/* Factor 3: Technology Maturity (15%) */}
        <div className="ent-card cardHover" style={{ borderLeft: '4px solid var(--ent-accent-tech)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-secondary)' }}>Tech Maturity</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ent-accent-tech)' }}>Weight: 15%</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
            {technology_maturity}
          </div>
          <div className="ent-factor-progress">
            <div className="ent-factor-fill" style={{ width: `${technology_maturity}%`, background: 'var(--ent-accent-tech)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 8 }}>
            Contribution: <strong>{(technology_maturity * 0.15).toFixed(1)} pts</strong>
          </div>
        </div>

        {/* Factor 4: Market Potential (20%) */}
        <div className="ent-card cardHover" style={{ borderLeft: '4px solid var(--ent-accent-innovation)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-secondary)' }}>Market Potential</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ent-accent-innovation)' }}>Weight: 20%</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
            {market_potential}
          </div>
          <div className="ent-factor-progress">
            <div className="ent-factor-fill" style={{ width: `${market_potential}%`, background: 'var(--ent-accent-innovation)' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 8 }}>
            Contribution: <strong>{(market_potential * 0.2).toFixed(1)} pts</strong>
          </div>
        </div>

        {/* Factor 5: Funding Relevance (15%) */}
        <div className="ent-card cardHover" style={{ borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ent-text-secondary)' }}>Funding Relevance</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Weight: 15%</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
            {funding_relevance}
          </div>
          <div className="ent-factor-progress">
            <div className="ent-factor-fill" style={{ width: `${funding_relevance}%`, background: '#059669' }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)', marginTop: 8 }}>
            Contribution: <strong>{(funding_relevance * 0.15).toFixed(1)} pts</strong>
          </div>
        </div>
      </div>

      {/* Radar Visualization + Accessible Factor Evidence Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Professional Radar Chart */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Award size={17} color="var(--ent-accent-innovation)" />
              <span>Factor Radar Profile</span>
            </h2>
            <span style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>Normalized 5-Signal Diamond</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0' }}>
            <svg width="340" height="300" viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
              {/* Concentric Polygons */}
              {[25, 50, 75, 100].map((level) => {
                const r = (level / 100) * 95;
                const pts = [-90, -18, 54, 126, 198]
                  .map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    return `${150 + r * Math.cos(rad)},${150 + r * Math.sin(rad)}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={level}
                    points={pts}
                    fill={level === 100 ? '#F8FAFC' : 'none'}
                    stroke="#E2E8F0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axis lines */}
              {[-90, -18, 54, 126, 198].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1="150"
                    y1="150"
                    x2={150 + 95 * Math.cos(rad)}
                    y2={150 + 95 * Math.sin(rad)}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                );
              })}

              {/* Filled Innovation Polygon */}
              <polygon
                points={radarPoints}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Factor Labels & Points */}
              {radarFactors.map((f, i) => {
                const rad = (f.angle * Math.PI) / 180;
                const r = (f.score / 100) * 95;
                const labelR = 120;
                const x = 150 + r * Math.cos(rad);
                const y = 150 + r * Math.sin(rad);
                const labelX = 150 + labelR * Math.cos(rad);
                const labelY = 150 + labelR * Math.sin(rad);

                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill="#0F172A"
                    >
                      {f.label}
                    </text>
                    <text
                      x={labelX}
                      y={labelY + 13}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748B"
                    >
                      {f.score} ({f.weight})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Textual Factor Evidence Breakdown */}
        <div className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <CheckCircle2 size={17} color="#059669" />
              <span>Factor Evidence Breakdown</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Formula Weights</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(activeInnovation.factors || {}).map(([key, item]) => (
              <div
                key={key}
                style={{
                  padding: '10px 12px',
                  background: 'var(--ent-bg-subtle)',
                  borderRadius: 6,
                  border: '1px solid var(--ent-border-light)',
                  fontSize: 12.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <strong style={{ textTransform: 'capitalize', color: 'var(--ent-text-primary)' }}>
                    {key.replace('_', ' ')}
                  </strong>
                  <span>
                    Score: <strong>{item.score}</strong> | Weight: <strong>{(item.weight * 100).toFixed(0)}%</strong> | +<strong>{item.contribution}</strong>
                  </span>
                </div>
                <div style={{ color: 'var(--ent-text-secondary)', lineHeight: 1.4 }}>
                  {item.evidence}
                </div>
              </div>
            ))}
          </div>

          {/* Formula Wording */}
          <div
            style={{
              marginTop: 14,
              padding: '8px 12px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 6,
              fontSize: 11.5,
              color: '#047857',
              textAlign: 'center',
            }}
          >
            <strong>Weighted Formula: </strong>
            Score = Novelty×0.30 + Patent×0.20 + Maturity×0.15 + Market×0.20 + Funding×0.15
          </div>
        </div>
      </div>
    </div>
  );
}
