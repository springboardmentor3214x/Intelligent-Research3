import { useState, useEffect } from 'react';
import { fetchResearchPapers } from '../../services/researchService';
import { TrendingUp, BarChart3, Activity, Tag, Layers, RefreshCw } from 'lucide-react';

export default function ResearchTrends() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('Artificial Intelligence & Machine Learning');

  useEffect(() => {
    loadTrendsData(selectedDomain);
  }, [selectedDomain]);

  const loadTrendsData = async (domain) => {
    setLoading(true);
    try {
      const results = await fetchResearchPapers(domain, { limit: 20 });
      setPapers(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Compute Year distribution
  const yearCounts = papers.reduce((acc, p) => {
    const yr = p.year || 2026;
    acc[yr] = (acc[yr] || 0) + 1;
    return acc;
  }, {});

  const sortedYears = Object.keys(yearCounts).sort((a, b) => a - b);
  const maxYearCount = Math.max(...Object.values(yearCounts), 1);

  // Compute Top Topics
  const topicCounts = {};
  papers.forEach((p) => {
    (p.keywords || []).forEach((kw) => {
      topicCounts[kw] = (topicCounts[kw] || 0) + 1;
    });
  });

  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxTopicCount = sortedTopics[0]?.[1] || 1;

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Research Trends &amp; Analytics</h1>
        <p className="ri-page-subtitle">
          Empirical publication velocity, topic evolution, and citation metrics computed across real indexed literature.
        </p>
      </div>

      {/* Domain Switcher */}
      <div className="ri-selector-card">
        <div className="ri-selector-label">
          <TrendingUp size={18} color="var(--ri-blue-accent)" />
          <span>Analyze Domain:</span>
        </div>
        <select
          className="ri-selector-dropdown"
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
        >
          <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence &amp; Machine Learning</option>
          <option value="Biotechnology & Life Sciences">Biotechnology &amp; Life Sciences</option>
          <option value="Clean Energy & Environment">Clean Energy &amp; Environment</option>
          <option value="Quantum Computing">Quantum Computing</option>
          <option value="Cybersecurity & Data Privacy">Cybersecurity &amp; Data Privacy</option>
        </select>
        <button className="ri-btn-refresh" onClick={() => loadTrendsData(selectedDomain)}>
          <RefreshCw size={15} />
          <span>Update Analytics</span>
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#fff', padding: 32, borderRadius: 10, border: '1px solid var(--ri-border-subtle)' }}>
          <div className="ri-skeleton" style={{ height: 24, width: '40%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 160, width: '100%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 80, width: '70%' }} />
        </div>
      ) : papers.length === 0 ? (
        <div className="ri-empty-state">
          <Activity size={32} className="ri-empty-icon" />
          <h3 className="ri-empty-title">Not enough data available for this analysis.</h3>
          <p className="ri-empty-desc">
            No verified indexed publications were returned to calculate statistical trends.
          </p>
        </div>
      ) : (
        <>
          {/* Main Trends Grid */}
          <div className="ri-trends-grid">
            {/* Chart 1: Publication Velocity Over Time */}
            <div className="ri-chart-card">
              <div className="ri-chart-title">
                <span>Publication Velocity Over Time</span>
                <span style={{ fontSize: 12, color: 'var(--ri-text-muted)', fontWeight: 500 }}>
                  Indexed Papers ({papers.length} samples)
                </span>
              </div>

              <div className="ri-bar-chart-wrap">
                {sortedYears.map((yr) => {
                  const count = yearCounts[yr];
                  const heightPercent = Math.max(15, (count / maxYearCount) * 100);
                  return (
                    <div key={yr} className="ri-bar-col">
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ri-blue-accent)', marginBottom: 4 }}>
                        {count}
                      </div>
                      <div className="ri-bar-fill" style={{ height: `${heightPercent}%` }} />
                      <div className="ri-bar-label">{yr}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12, color: 'var(--ri-text-muted)' }}>
                <span>Source: OpenAlex &amp; Semantic Scholar</span>
                <span>Calculated directly from real publications</span>
              </div>
            </div>

            {/* Chart 2: Top Topic Clusters */}
            <div className="ri-chart-card">
              <div className="ri-chart-title">
                <span>Top Topic Clusters</span>
                <Layers size={16} color="var(--ri-purple)" />
              </div>

              <div className="ri-topic-list">
                {sortedTopics.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--ri-text-muted)' }}>
                    Not enough data available for topic clustering.
                  </div>
                ) : (
                  sortedTopics.map(([topic, count]) => {
                    const widthPercent = (count / maxTopicCount) * 100;
                    return (
                      <div key={topic} className="ri-topic-row">
                        <div className="ri-topic-info">
                          <span>{topic}</span>
                          <span style={{ color: 'var(--ri-text-muted)' }}>{count} papers</span>
                        </div>
                        <div className="ri-progress-track">
                          <div className="ri-progress-fill" style={{ width: `${widthPercent}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Research Activity Timeline */}
          <div className="ri-chart-card">
            <div className="ri-chart-title">
              <span>Recent Research Activity &amp; Citations</span>
              <Activity size={16} color="var(--ri-success)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {papers.slice(0, 5).map((p, i) => (
                <div
                  key={p.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'var(--ri-bg-main)',
                    borderRadius: '8px',
                    border: '1px solid var(--ri-border-subtle)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ri-navy-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ri-text-muted)' }}>
                      By {Array.isArray(p.authors) ? p.authors[0] : p.authors} · {p.journal || p.conference || p.source}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className="ri-tag-pill">{p.year || '2026'}</span>
                    <span className="ri-meta-pill" style={{ fontWeight: 600, color: 'var(--ri-blue-accent)' }}>
                      ⭐ {p.citations_count || 0} citations
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
