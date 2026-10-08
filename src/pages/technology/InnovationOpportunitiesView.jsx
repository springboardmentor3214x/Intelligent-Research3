import { useState, useEffect } from 'react';
import { Lightbulb, ShieldCheck, Cpu, ArrowUpRight, Search, Filter } from 'lucide-react';
import { getInnovationOpportunities } from '../../services/technologyApi';

export default function InnovationOpportunitiesView({ onSelectTechnology }) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('All');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getInnovationOpportunities();
        setOpportunities(res.opportunities);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredOpps = opportunities.filter((opp) => {
    const matchSearch =
      opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.technology_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.potential_application.toLowerCase().includes(searchTerm.toLowerCase());
    const matchConf = confidenceFilter === 'All' || opp.confidence === confidenceFilter;
    return matchSearch && matchConf;
  });

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Innovation Opportunities</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Evidence-Based Signals</span>
            </span>
          </div>
          <p>
            System-generated potential opportunities derived from intersecting research publication velocity, patent claim gaps, and industrial demand signals.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="ent-card"
        style={{
          marginBottom: 20,
          padding: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div className="ent-topbar-search" style={{ width: 340, background: '#FFFFFF' }}>
          <Search size={15} color="var(--ent-text-muted)" />
          <input
            type="text"
            placeholder="Search opportunity or technology..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ent-text-secondary)' }}>Confidence Level:</span>
          <select
            className="ent-select"
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
          >
            <option value="All">All Confidence Ratings</option>
            <option value="High">High Confidence</option>
            <option value="Moderate">Moderate Confidence</option>
            <option value="Analytical">Analytical Insight</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="ent-skeleton" style={{ height: 160 }} />
          ))}
        </div>
      ) : filteredOpps.length === 0 ? (
        <div className="ent-empty-state">
          <Lightbulb size={24} />
          <h3 className="ent-empty-title">No opportunities found</h3>
          <p className="ent-empty-desc">Try clearing your search query or confidence filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredOpps.map((opp) => (
            <div key={opp.id} className="ent-card cardHover" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#EFF6FF',
                        color: 'var(--ent-accent-research)',
                      }}
                    >
                      {opp.technology_name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>{opp.domain}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ent-text-primary)', margin: 0 }}>
                    {opp.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: opp.confidence === 'High' ? '#ECFDF5' : '#FFFBEB',
                      color: opp.confidence === 'High' ? '#047857' : '#B45309',
                      border: `1px solid ${opp.confidence === 'High' ? '#A7F3D0' : '#FDE68A'}`,
                    }}
                  >
                    Potential Opportunity · {opp.confidence} Confidence
                  </span>

                  <button
                    className="ent-btn ent-btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 12 }}
                    onClick={() => onSelectTechnology(opp.technology_id)}
                  >
                    <span>View Technology</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>

              {/* Evidence statement */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid var(--ent-border-light)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: 'var(--ent-text-secondary)',
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--ent-text-primary)' }}>Evidence: </strong>
                {opp.evidence}
              </div>

              {/* 3 Signal Pillars */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 12,
                  fontSize: 12,
                  paddingTop: 10,
                  borderTop: '1px solid var(--ent-border-light)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--ent-text-muted)', display: 'block', fontWeight: 600 }}>
                    Research Signal:
                  </span>
                  <span style={{ color: 'var(--ent-text-primary)' }}>{opp.research_signal}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ent-text-muted)', display: 'block', fontWeight: 600 }}>
                    Patent Signal:
                  </span>
                  <span style={{ color: 'var(--ent-text-primary)' }}>{opp.patent_signal}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ent-text-muted)', display: 'block', fontWeight: 600 }}>
                    Adoption Signal:
                  </span>
                  <span style={{ color: 'var(--ent-text-primary)' }}>{opp.adoption_signal}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ent-text-muted)', display: 'block', fontWeight: 600 }}>
                    Potential Application:
                  </span>
                  <strong style={{ color: 'var(--ent-accent-tech)' }}>{opp.potential_application}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
