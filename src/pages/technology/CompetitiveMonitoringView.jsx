import { useState, useEffect } from 'react';
import { Building2, TrendingUp, FileText, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getCompetitiveOrganizations, getOrganizationDetails } from '../../services/technologyApi';

export default function CompetitiveMonitoringView() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('org-openai');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await getCompetitiveOrganizations();
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrgId(data[0].id);
          setSelectedOrg(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectOrg = async (id) => {
    setSelectedOrgId(id);
    const { data } = await getOrganizationDetails(id);
    setSelectedOrg(data);
  };

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Competitive Technology Activity</h1>
            <span className="ent-demo-tag">
              <ShieldCheck size={12} />
              <span>Multi-Source R&amp;D Telemetry</span>
            </span>
          </div>
          <p>
            Monitor verified research publications, patent applications, and thematic focus areas across peer institutions and industrial research centers.
          </p>
        </div>
      </div>

      {loading || !selectedOrg ? (
        <div className="ent-skeleton" style={{ height: 420 }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          {/* Left Column: Organization List */}
          <div className="ent-card" style={{ padding: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px 6px', color: 'var(--ent-text-primary)' }}>
              Monitored Organizations
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {organizations.map((org) => {
                const isSelected = org.id === selectedOrgId;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--ent-accent-tech)' : 'var(--ent-border-light)',
                      background: isSelected ? '#F0F9FF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 14, color: isSelected ? 'var(--ent-accent-tech)' : 'var(--ent-text-primary)' }}>
                        {org.name}
                      </strong>
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>
                        {org.activity_trend}
                      </span>
                    </div>
                    <span style={{ fontSize: 11.5, color: 'var(--ent-text-muted)' }}>
                      {org.type} · {org.headquarters.split(',').pop()?.trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Organization Deep Dive */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Org Profile Header */}
            <div className="ent-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
                <div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-accent-tech)', textTransform: 'uppercase' }}>
                    {selectedOrg.type}
                  </span>
                  <h2 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 6px 0', color: 'var(--ent-text-primary)' }}>
                    {selectedOrg.name}
                  </h2>
                  <div style={{ fontSize: 13, color: 'var(--ent-text-muted)' }}>
                    Headquarters: {selectedOrg.headquarters}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ padding: '8px 16px', background: '#EFF6FF', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ent-accent-research)' }}>
                      {selectedOrg.research_activity}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>Papers Indexed</div>
                  </div>
                  <div style={{ padding: '8px 16px', background: '#F5F3FF', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ent-accent-patent)' }}>
                      {selectedOrg.patent_activity}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>Patent Portfolios</div>
                  </div>
                </div>
              </div>

              {/* Technology Focus Areas */}
              <div style={{ borderTop: '1px solid var(--ent-border-light)', paddingTop: 14, marginTop: 14 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ent-text-secondary)', display: 'block', marginBottom: 8 }}>
                  Core Technology Focus:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedOrg.technology_focus.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--ent-bg-subtle)',
                        borderRadius: 6,
                        border: '1px solid var(--ent-border-light)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--ent-text-primary)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Thematic Area Breakdown Table */}
            <div className="ent-card">
              <div className="ent-card-header">
                <h3 className="ent-card-title">
                  <Layers size={17} color="var(--ent-accent-tech)" />
                  <span>Thematic Focus Breakdown</span>
                </h3>
                <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>
                  Verified publications &amp; patent allocations
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ent-border-light)', color: 'var(--ent-text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px' }}>Research Domain Area</th>
                    <th style={{ padding: '8px 12px' }}>Publications</th>
                    <th style={{ padding: '8px 12px' }}>Patent Filings</th>
                    <th style={{ padding: '8px 12px' }}>Activity Share</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrg.technology_areas.map((area, idx) => {
                    const totalSignals = area.papers + area.patents;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--ent-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600, color: 'var(--ent-text-primary)' }}>
                          {area.area}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--ent-accent-research)' }}>
                          {area.papers} papers
                        </td>
                        <td style={{ padding: '12px', color: 'var(--ent-accent-patent)' }}>
                          {area.patents} patents
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="ent-factor-progress" style={{ width: 100, height: 6, margin: 0 }}>
                              <div
                                className="ent-factor-fill"
                                style={{ width: `${Math.min(100, (totalSignals / 400) * 100)}%`, background: 'var(--ent-accent-tech)' }}
                              />
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                              {totalSignals} total
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Related Organizations */}
            <div className="ent-card">
              <div className="ent-card-header">
                <h3 className="ent-card-title">
                  <Building2 size={17} color="#475569" />
                  <span>Frequent Research Co-Authors &amp; Consortia Partners</span>
                </h3>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {selectedOrg.related_organizations.map((rel, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 14px',
                      background: '#F8FAFC',
                      border: '1px solid var(--ent-border-light)',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <CheckCircle2 size={14} color="#059669" />
                    <span>{rel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
