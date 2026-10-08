import { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingUp,
  Activity,
  Layers,
  Building2,
  Lightbulb,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { getTechnologies, getInnovationOpportunities, getCompetitiveOrganizations } from '../../services/technologyApi';

export default function TechDashboardHome({ onSelectTechnology, onViewAllEmerging, onAssessInnovation }) {
  const [techList, setTechList] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechForPreview, setSelectedTechForPreview] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [techRes, oppRes, orgRes] = await Promise.all([
          getTechnologies(),
          getInnovationOpportunities(),
          getCompetitiveOrganizations(),
        ]);
        setTechList(techRes.data);
        setOpportunities(oppRes.opportunities.slice(0, 3));
        setOrganizations(orgRes.data.slice(0, 4));
        if (techRes.data.length > 0) {
          setSelectedTechForPreview(techRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ent-skeleton" style={{ height: 60, width: '40%' }} />
        <div className="ri-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ent-skeleton" style={{ height: 100 }} />
          ))}
        </div>
        <div className="ent-skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  // Calculate totals
  const totalEmerging = techList.length;
  const uniqueDomains = new Set(techList.map((t) => t.domain)).size;
  const highGrowthCount = techList.filter((t) => t.growth_rate >= 40).length;

  return (
    <div className="fadeIn">
      {/* 1. Header Banner */}
      <div className="ri-page-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1>Technology Intelligence</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Isolated Demo Dataset</span>
            </span>
          </div>
          <p>
            Discover emerging technologies, understand maturity, track adoption and identify innovation opportunities.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ri-btn-action ri-btn-action-secondary" onClick={onViewAllEmerging}>
            <span>Browse All Technologies</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="ri-stats-grid">
        <div className="ri-stat-card cardHover">
          <div className="ri-stat-info">
            <span className="ri-stat-label">Emerging Technologies</span>
            <span className="ri-stat-value">{totalEmerging}</span>
            <span className="ri-stat-desc" style={{ color: 'var(--ent-accent-tech)' }}>
              Actively monitored
            </span>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue" style={{ background: '#E0F2FE', color: '#0284C7' }}>
            <Cpu size={22} />
          </div>
        </div>

        <div className="ri-stat-card cardHover">
          <div className="ri-stat-info">
            <span className="ri-stat-label">Technology Areas</span>
            <span className="ri-stat-value">{uniqueDomains}</span>
            <span className="ri-stat-desc">Across AI, Robotics, Quantum</span>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <Layers size={22} />
          </div>
        </div>

        <div className="ri-stat-card cardHover">
          <div className="ri-stat-info">
            <span className="ri-stat-label">Growing Technologies</span>
            <span className="ri-stat-value">{highGrowthCount}</span>
            <span className="ri-stat-desc" style={{ color: '#059669' }}>
              &gt;40% YoY acceleration
            </span>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue" style={{ background: '#ECFDF5', color: '#059669' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="ri-stat-card cardHover">
          <div className="ri-stat-info">
            <span className="ri-stat-label">Organizations Tracked</span>
            <span className="ri-stat-value">{organizations.length * 3}+</span>
            <span className="ri-stat-desc">Global R&amp;D consortia</span>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* 3. Section 1: Emerging Technology Radar & Quick Select */}
      <div className="ri-profile-context-card" style={{ marginBottom: 24 }}>
        <div className="ri-profile-context-card-header">
          <h2 className="ri-profile-context-card-title">
            <Cpu size={18} color="var(--ent-accent-tech)" />
            <span>Emerging Technology Radar</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>
            Empirical multi-source tracking
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {techList.map((tech) => {
            const isSelected = selectedTechForPreview?.id === tech.id;
            return (
              <div
                key={tech.id}
                className="ri-profile-context-card cardHover"
                style={{
                  padding: 16,
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--ent-accent-tech)' : 'var(--ent-border-light)',
                  background: isSelected ? '#F0F9FF' : '#FFFFFF',
                }}
                onClick={() => setSelectedTechForPreview(tech)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 3px 0', color: 'var(--ent-text-primary)' }}>
                      {tech.name}
                    </h3>
                    <span style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>{tech.domain}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: tech.growth_rate >= 50 ? '#ECFDF5' : '#EFF6FF',
                      color: tech.growth_rate >= 50 ? '#047857' : '#1D4ED8',
                    }}
                  >
                    +{tech.growth_rate}%
                  </span>
                </div>

                <p style={{ fontSize: 12.5, color: 'var(--ent-text-secondary)', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                  {tech.description.slice(0, 110)}...
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: 'var(--ent-text-muted)', borderTop: '1px solid var(--ent-border-light)', paddingTop: 10 }}>
                  <span>Stage: <strong style={{ color: 'var(--ent-text-primary)' }}>{tech.maturity_level}</strong></span>
                  <button
                    className="ri-btn-action ri-btn-action-tech"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTechnology(tech.id);
                    }}
                  >
                    <span>Deep Dive</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Section 2 & 3: Technology Growth & Maturity Preview */}
      {selectedTechForPreview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20, marginBottom: 24 }}>
          {/* Growth Area Chart (SVG) */}
          <div className="ri-profile-context-card">
            <div className="ri-profile-context-card-header">
              <h2 className="ri-profile-context-card-title">
                <TrendingUp size={17} color="var(--ent-accent-tech)" />
                <span>Technology Growth: {selectedTechForPreview.name}</span>
              </h2>
              <span style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>5-Year Trajectory</span>
            </div>

            {/* SVG Line / Area Chart */}
            <div style={{ padding: '10px 0' }}>
              <svg viewBox="0 0 450 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[30, 70, 110, 150].map((y) => (
                  <line key={y} x1="30" y1={y} x2="430" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                ))}

                {/* Area path */}
                <path
                  d="M 50,150 L 130,130 L 210,95 L 310,50 L 410,25 L 410,160 L 50,160 Z"
                  fill="url(#growthGrad)"
                />

                {/* Line path */}
                <path
                  d="M 50,150 L 130,130 L 210,95 L 310,50 L 410,25"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Points & Data labels */}
                {[
                  { x: 50, y: 150, yr: '2022', val: '180' },
                  { x: 130, y: 130, yr: '2023', val: '420' },
                  { x: 210, y: 95, yr: '2024', val: '890' },
                  { x: 310, y: 50, yr: '2025', val: '1,350' },
                  { x: 410, y: 25, yr: '2026', val: `${selectedTechForPreview.research_activity}` },
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2.5" />
                    <text x={pt.x} y={pt.y - 9} textAnchor="middle" fontSize="10" fontWeight="700" fill="#0F172A">
                      {pt.val}
                    </text>
                    <text x={pt.x} y="174" textAnchor="middle" fontSize="10.5" fill="#64748B">
                      {pt.yr}
                    </text>
                  </g>
                ))}
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--ent-text-muted)' }}>
                <span>Indicator: Cumulative Published Research &amp; Preprints</span>
                <span style={{ fontWeight: 600, color: 'var(--ent-accent-tech)' }}>
                  +{selectedTechForPreview.growth_rate}% Compound Annual Growth
                </span>
              </div>
            </div>
          </div>

          {/* Technology Maturity Assessment */}
          <div className="ri-profile-context-card">
            <div className="ri-profile-context-card-header">
              <h2 className="ri-profile-context-card-title">
                <Activity size={17} color="#059669" />
                <span>Maturity Analysis &amp; Progression</span>
              </h2>
              <span className="ent-live-tag">System Assessment</span>
            </div>

            {/* Progression Bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
                {['Research', 'Prototype', 'Developing', 'Adoption', 'Mature'].map((stg) => {
                  const isActive = stg === selectedTechForPreview.progression_stage;
                  return (
                    <span
                      key={stg}
                      style={{
                        color: isActive ? 'var(--ent-accent-tech)' : 'var(--ent-text-muted)',
                        fontWeight: isActive ? 700 : 500,
                        borderBottom: isActive ? '2px solid var(--ent-accent-tech)' : 'none',
                        paddingBottom: 2,
                      }}
                    >
                      {stg}
                    </span>
                  );
                })}
              </div>
              <div className="ent-factor-progress" style={{ height: 6 }}>
                <div
                  className="ent-factor-fill"
                  style={{
                    width: `${selectedTechForPreview.maturity_factors?.overall_maturity_score || 70}%`,
                    background: 'linear-gradient(90deg, #0284C7, #059669)',
                  }}
                />
              </div>
            </div>

            {/* Factor breakdown bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ent-text-secondary)' }}>Research Signal Activity</span>
                <strong>{selectedTechForPreview.maturity_factors?.research_activity || 88} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ent-text-secondary)' }}>Patent Filing Concentration</span>
                <strong>{selectedTechForPreview.maturity_factors?.patent_activity || 64} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ent-text-secondary)' }}>Enterprise Adoption Signals</span>
                <strong>{selectedTechForPreview.maturity_factors?.adoption_signals || 72} / 100</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--ent-text-secondary)' }}>Global R&amp;D Organization Depth</span>
                <strong>{selectedTechForPreview.maturity_factors?.organization_activity || 85} / 100</strong>
              </div>
            </div>

            <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--ent-bg-subtle)', borderRadius: 6, fontSize: 12, color: 'var(--ent-text-secondary)', lineHeight: 1.45 }}>
              <strong>Basis: </strong>
              {selectedTechForPreview.maturity_factors?.assessment || 'Calculated from publication uniqueness and patent density.'}
            </div>
          </div>
        </div>
      )}

      {/* 5. Section 4 & 5: Opportunities & Competitive Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Innovation Opportunities Preview */}
        <div className="ri-profile-context-card">
          <div className="ri-profile-context-card-header">
            <h2 className="ri-profile-context-card-title">
              <Lightbulb size={17} color="#D97706" />
              <span>Innovation Opportunities</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Evidence-based Insights</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                style={{
                  padding: '12px 14px',
                  background: 'var(--ent-bg-subtle)',
                  borderRadius: 8,
                  border: '1px solid var(--ent-border-light)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <strong style={{ fontSize: 13.5, color: 'var(--ent-text-primary)' }}>{opp.title}</strong>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: opp.confidence === 'High' ? '#ECFDF5' : '#FFFBEB',
                      color: opp.confidence === 'High' ? '#047857' : '#B45309',
                    }}
                  >
                    {opp.confidence} Confidence
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ent-text-secondary)', marginBottom: 6 }}>
                  {opp.evidence}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>
                  Target Application: <span style={{ color: 'var(--ent-text-primary)', fontWeight: 500 }}>{opp.potential_application}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitive Technology Activity Snapshot */}
        <div className="ri-profile-context-card">
          <div className="ri-profile-context-card-header">
            <h2 className="ri-profile-context-card-title">
              <Building2 size={17} color="#475569" />
              <span>Competitive Activity Snapshot</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Top Active R&amp;D Labs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {organizations.map((org) => (
              <div
                key={org.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  border: '1px solid var(--ent-border-light)',
                  borderRadius: 6,
                }}
              >
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ent-text-primary)' }}>
                    {org.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>
                    Focus: {org.technology_focus.slice(0, 2).join(', ')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ent-accent-research)' }}>
                    {org.research_activity} Papers
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                    {org.patent_activity} Patents · {org.activity_trend}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
