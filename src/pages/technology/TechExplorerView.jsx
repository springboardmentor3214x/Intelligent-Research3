import { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingUp,
  FileText,
  Activity,
  Building2,
  Lightbulb,
  Award,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { getTechnologyById } from '../../services/technologyApi';

export default function TechExplorerView({ technologyId, onBack, onAssessInModule7 }) {
  const [tech, setTech] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getTechnologyById(technologyId);
        setTech(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [technologyId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="ent-skeleton" style={{ height: 120 }} />
        <div className="ent-skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  if (!tech) {
    return (
      <div className="ent-empty-state">
        <h3 className="ent-empty-title">Technology not found</h3>
        <button className="ent-btn ent-btn-secondary" onClick={onBack}>
          <ChevronLeft size={14} />
          <span>Back to List</span>
        </button>
      </div>
    );
  }

  const TABS = [
    { id: 'overview', label: 'Technology Overview', icon: Cpu },
    { id: 'research', label: 'Research Activity', icon: TrendingUp },
    { id: 'patents', label: 'Patent Activity', icon: FileText },
    { id: 'adoption', label: 'Adoption Signals', icon: Activity },
    { id: 'maturity', label: 'Maturity Analysis', icon: Activity },
    { id: 'organizations', label: 'Key Organizations', icon: Building2 },
    { id: 'opportunities', label: 'Innovation Opportunities', icon: Lightbulb },
  ];

  return (
    <div className="fadeIn">
      {/* Top Navigation Back */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="ent-btn ent-btn-secondary" onClick={onBack}>
          <ChevronLeft size={14} />
          <span>Back to Technologies</span>
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="ent-btn ent-btn-innovation"
            onClick={() => onAssessInModule7(tech.id)}
            title="Transfer technology signals to Module 7 Innovation Scoring Engine"
          >
            <Award size={15} />
            <span>Assess in Innovation Engine</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Large Technology Header Banner */}
      <div
        className="ent-card"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #0B1527 0%, #142847 100%)',
          color: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 740 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(2, 132, 199, 0.25)',
                  color: '#38BDF8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                {tech.domain}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34D399',
                }}
              >
                +{tech.growth_rate}% YoY Acceleration
              </span>
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
              {tech.name}
            </h1>
            <p style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.55, margin: 0 }}>
              {tech.description}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 200 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Maturity Stage
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#38BDF8', marginTop: 2 }}>
                {tech.maturity_level}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                Adoption Level
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginTop: 2 }}>
                {tech.adoption_level}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Signal Badges */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: '#94A3B8' }}>Tracked Literature: </span>
            <strong style={{ color: '#FFFFFF' }}>{tech.research_activity} Publications</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Patent Portfolio: </span>
            <strong style={{ color: '#FFFFFF' }}>{tech.patent_activity} Patent Families</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8' }}>Active Consortia: </span>
            <strong style={{ color: '#FFFFFF' }}>{tech.organizations?.length || 5} Organizations</strong>
          </div>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="ent-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ent-border-light)', overflowX: 'auto', background: '#FAFAFA' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isTab = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: isTab ? 700 : 500,
                  color: isTab ? 'var(--ent-accent-tech)' : 'var(--ent-text-secondary)',
                  border: 'none',
                  background: isTab ? '#FFFFFF' : 'transparent',
                  borderBottom: isTab ? '2px solid var(--ent-accent-tech)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div style={{ padding: 24 }}>
          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0' }}>Why Emerging?</h3>
                <p style={{ fontSize: 14, color: 'var(--ent-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {tech.why_emerging}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px 0' }}>Related Technologies</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {tech.related_technologies?.map((rt, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--ent-bg-subtle)',
                        borderRadius: 6,
                        border: '1px solid var(--ent-border-light)',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {rt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px 0' }}>Leading Research Organizations</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {tech.organizations?.map((org, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: '#F8FAFC',
                        border: '1px solid var(--ent-border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      <Building2 size={15} color="var(--ent-accent-tech)" />
                      <span>{org}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. RESEARCH ACTIVITY */}
          {activeTab === 'research' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Academic Publication Velocity</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ent-text-muted)', marginBottom: 16 }}>
                Synthesized across OpenAlex, Semantic Scholar, and top tier conference proceedings.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                  <div style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Total Publications</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ent-accent-research)', marginTop: 4 }}>
                    {tech.research_activity}
                  </div>
                </div>
                <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                  <div style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Velocity Growth</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    +{tech.growth_rate}%
                  </div>
                </div>
                <div style={{ padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                  <div style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Citation Graph Multiplier</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>
                    3.8x
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. PATENT ACTIVITY */}
          {activeTab === 'patents' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Intellectual Property Activity</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ent-text-muted)', marginBottom: 16 }}>
                Priority filings and granted patent family analysis across EPO OPS and USPTO.
              </p>
              <div style={{ padding: 16, background: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#6D28D9' }}>
                  {tech.patent_activity} Core Patent Families Identified
                </div>
                <div style={{ fontSize: 12.5, color: '#4C1D95', marginTop: 4 }}>
                  Patent clustering shows intensive claims in automated control, algorithmic pipelines, and domain hardware acceleration.
                </div>
              </div>
            </div>
          )}

          {/* 4. ADOPTION */}
          {activeTab === 'adoption' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Enterprise Adoption Signals</h3>
              <p style={{ fontSize: 13.5, color: 'var(--ent-text-secondary)', lineHeight: 1.55 }}>
                Current adoption rating is <strong>{tech.adoption_level}</strong>. Evidence shows transitioning from isolated proof-of-concepts into structured enterprise pilot programs across Fortune 500 manufacturing, healthcare, and semiconductor consortia.
              </p>
            </div>
          )}

          {/* 5. MATURITY */}
          {activeTab === 'maturity' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>System-Generated Maturity Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
                {Object.entries(tech.maturity_factors || {})
                  .filter(([k]) => typeof tech.maturity_factors[k] === 'number')
                  .map(([key, val]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                        <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                        <strong>{val} / 100</strong>
                      </div>
                      <div className="ent-factor-progress">
                        <div className="ent-factor-fill" style={{ width: `${val}%`, background: 'var(--ent-accent-tech)' }} />
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ marginTop: 18, fontSize: 13, color: 'var(--ent-text-secondary)', background: 'var(--ent-bg-subtle)', padding: 12, borderRadius: 6 }}>
                <strong>Assessment Rationale: </strong>
                {tech.maturity_factors?.assessment}
              </div>
            </div>
          )}

          {/* 6. ORGANIZATIONS */}
          {activeTab === 'organizations' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Key Organizations &amp; Research Centers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {tech.organizations?.map((org, i) => (
                  <div key={i} style={{ padding: 14, background: '#FFFFFF', borderRadius: 8, border: '1px solid var(--ent-border-light)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{org}</div>
                    <div style={{ fontSize: 12, color: 'var(--ent-text-muted)', marginTop: 4 }}>
                      Active in publication submissions and standard working groups.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. OPPORTUNITIES */}
          {activeTab === 'opportunities' && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px 0' }}>Identified Innovation Opportunities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tech.opportunities?.map((opp) => (
                  <div key={opp.id} style={{ padding: 16, background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: 14, color: '#B45309' }}>{opp.title}</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>{opp.confidence} Confidence</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#78350F', margin: '0 0 8px 0' }}>{opp.evidence}</p>
                    <div style={{ fontSize: 12, color: '#92400E' }}>
                      Potential Application: <strong>{opp.potential_application}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
