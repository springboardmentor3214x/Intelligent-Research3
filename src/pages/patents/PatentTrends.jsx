import { useState, useEffect } from 'react';
import { fetchPatents } from '../../services/patentService';
import { TrendingUp, Layers, Building2, BarChart3, Tag } from 'lucide-react';

export default function PatentTrends() {
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const data = await fetchPatents('Artificial Intelligence Quantum Energy Biotech Security', { limit: 20 });
      setPatents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Compute Year Activity
  const yearCounts = patents.reduce((acc, p) => {
    const yr = p.publication_date ? p.publication_date.slice(0, 4) : '2026';
    acc[yr] = (acc[yr] || 0) + 1;
    return acc;
  }, {});

  const sortedYears = Object.keys(yearCounts).sort();
  const maxYearVal = Math.max(...Object.values(yearCounts), 1);

  // Compute Assignee Counts
  const assigneeCounts = {};
  patents.forEach((p) => {
    const name = p.assignee.split('/')[0].trim();
    assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
  });
  const sortedAssignees = Object.entries(assigneeCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Patent Trends &amp; Landscape Analytics</h1>
        <p className="ri-page-subtitle">
          Empirical patent filing velocity, top assignee distributions, and IPC classification density.
        </p>
      </div>

      {loading ? (
        <div style={{ background: '#fff', padding: 32, borderRadius: 10, border: '1px solid var(--ri-border-subtle)' }}>
          <div className="ri-skeleton" style={{ height: 24, width: '40%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 160, width: '100%' }} />
        </div>
      ) : patents.length === 0 ? (
        <div className="ri-empty-state">
          <TrendingUp size={32} className="ri-empty-icon" color="var(--ri-purple)" />
          <h3 className="ri-empty-title">Not enough patent data for this analysis.</h3>
          <p className="ri-empty-desc">No verified patent specifications were returned to render trend metrics.</p>
        </div>
      ) : (
        <div className="ri-trends-grid">
          {/* Chart 1: Patent Activity by Publication Year */}
          <div className="ri-chart-card">
            <div className="ri-chart-title">
              <span>Patent Activity by Publication Year</span>
              <TrendingUp size={16} color="var(--ri-purple)" />
            </div>

            <div className="ri-bar-chart-wrap">
              {sortedYears.map((yr) => {
                const count = yearCounts[yr];
                const heightPercent = Math.max(20, (count / maxYearVal) * 100);
                return (
                  <div key={yr} className="ri-bar-col">
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ri-purple)', marginBottom: 4 }}>
                      {count}
                    </div>
                    <div className="ri-bar-fill" style={{ height: `${heightPercent}%`, background: 'linear-gradient(180deg, #8B5CF6 0%, #6D28D9 100%)' }} />
                    <div className="ri-bar-label">{yr}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--ri-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Source: EPO Open Patent Services</span>
              <span>Actual Indexed Filings</span>
            </div>
          </div>

          {/* Chart 2: Top Assignees Distribution */}
          <div className="ri-chart-card">
            <div className="ri-chart-title">
              <span>Top Corporate &amp; Academic Assignees</span>
              <Building2 size={16} color="var(--ri-navy-primary)" />
            </div>

            <div className="ri-topic-list">
              {sortedAssignees.map(([name, count]) => (
                <div key={name} className="ri-topic-row">
                  <div className="ri-topic-info">
                    <span>{name}</span>
                    <span style={{ color: 'var(--ri-purple)', fontWeight: 700 }}>{count} patents</span>
                  </div>
                  <div className="ri-progress-track">
                    <div className="ri-progress-fill" style={{ width: `${(count / sortedAssignees[0][1]) * 100}%`, backgroundColor: 'var(--ri-purple)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
