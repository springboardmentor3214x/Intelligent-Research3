import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { getTechnologies } from '../../services/technologyApi';

export default function EmergingTechView({ onSelectTechnology }) {
  const [technologies, setTechnologies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedMaturity, setSelectedMaturity] = useState('All Stages');
  const [selectedGrowth, setSelectedGrowth] = useState('All');

  const DOMAINS = [
    'All Domains',
    'Artificial Intelligence & Autonomous Systems',
    'Machine Learning & Natural Language Processing',
    'Robotics & Spatial Perception',
    'Cyber-Physical Systems & IoT',
    'Semiconductor & Edge Computing',
    'Quantum Information Technologies',
  ];

  const MATURITY_STAGES = ['All Stages', 'Early Stage', 'Developing', 'Maturing', 'Mature'];

  const fetchTech = async () => {
    setLoading(true);
    try {
      const res = await getTechnologies({
        search: searchTerm,
        domain: selectedDomain,
        maturity: selectedMaturity,
        growth: selectedGrowth,
      });
      setTechnologies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTech();
  }, [searchTerm, selectedDomain, selectedMaturity, selectedGrowth]);

  return (
    <div className="fadeIn">
      {/* Page Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Emerging Technologies</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Verified Horizon Index</span>
            </span>
          </div>
          <p>
            Filter and discover frontier technologies exhibiting statistically anomalous research velocity and intellectual property clustering.
          </p>
        </div>
      </div>

      {/* Top Filter & Search Controls */}
      <div
        className="ent-card"
        style={{
          marginBottom: 24,
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260 }}>
          <div className="ent-topbar-search" style={{ width: '100%', maxWidth: 360, background: '#FFFFFF' }}>
            <Search size={15} color="var(--ent-text-muted)" />
            <input
              type="text"
              placeholder="Search by technology name or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <select
            className="ent-select"
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            style={{ maxWidth: 220 }}
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="ent-select"
            value={selectedMaturity}
            onChange={(e) => setSelectedMaturity(e.target.value)}
          >
            {MATURITY_STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="ent-select"
            value={selectedGrowth}
            onChange={(e) => setSelectedGrowth(e.target.value)}
          >
            <option value="All">All Growth Rates</option>
            <option value="high">&gt; 50% YoY High Growth</option>
            <option value="medium">30% - 50% YoY Growth</option>
          </select>

          <button className="ent-btn ent-btn-secondary" onClick={fetchTech} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Technology Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="ent-skeleton" style={{ height: 260 }} />
          ))}
        </div>
      ) : technologies.length === 0 ? (
        <div className="ent-empty-state">
          <div className="ent-empty-icon">
            <Cpu size={24} />
          </div>
          <h3 className="ent-empty-title">No emerging technologies match your filters</h3>
          <p className="ent-empty-desc">
            Try adjusting your search query, domain selection, or growth threshold.
          </p>
          <button
            className="ent-btn ent-btn-primary"
            onClick={() => {
              setSearchTerm('');
              setSelectedDomain('All Domains');
              setSelectedMaturity('All Stages');
              setSelectedGrowth('All');
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {technologies.map((tech) => (
            <div key={tech.id} className="ent-card cardHover" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0', color: 'var(--ent-text-primary)' }}>
                    {tech.name}
                  </h3>
                  <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>{tech.domain}</span>
                </div>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: '#ECFDF5',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <TrendingUp size={12} />
                  +{tech.growth_rate}% YoY
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: 'var(--ent-text-secondary)', lineHeight: 1.5, margin: '0 0 14px 0', flex: 1 }}>
                {tech.description}
              </p>

              {/* "Why Emerging?" Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--ent-border-light)',
                  borderLeft: '3px solid var(--ent-accent-tech)',
                  borderRadius: 4,
                  padding: '8px 12px',
                  marginBottom: 14,
                  fontSize: 12,
                }}
              >
                <strong style={{ color: 'var(--ent-text-primary)', display: 'block', marginBottom: 2 }}>
                  Why Emerging?
                </strong>
                <span style={{ color: 'var(--ent-text-secondary)', lineHeight: 1.4 }}>
                  {tech.why_emerging}
                </span>
              </div>

              {/* Signal Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  padding: '10px 0',
                  borderTop: '1px solid var(--ent-border-light)',
                  borderBottom: '1px solid var(--ent-border-light)',
                  marginBottom: 14,
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ent-accent-research)' }}>
                    {tech.research_activity}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>Papers Tracked</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ent-accent-patent)' }}>
                    {tech.patent_activity}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>Patent Families</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ent-accent-tech)' }}>
                    {tech.maturity_level}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>Maturity Stage</div>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--ent-text-muted)' }}>
                  <Building2 size={13} />
                  <span>{tech.organizations?.slice(0, 2).join(', ')} +more</span>
                </div>

                <button
                  className="ent-btn ent-btn-tech"
                  onClick={() => onSelectTechnology(tech.id)}
                >
                  <span>View Technology</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
