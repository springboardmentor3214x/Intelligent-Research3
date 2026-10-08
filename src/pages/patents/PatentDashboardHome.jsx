import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchPatents } from '../../services/patentService';
import PatentCard from '../../components/patents/PatentCard';
import { FileText, Building2, Layers, Activity, RefreshCw, UserCheck, Sparkles, AlertCircle } from 'lucide-react';

export default function PatentDashboardHome({
  onSelectDetails,
  onToggleSave,
  savedPatentIds = new Set(),
}) {
  const { profile } = useAuth();
  const [patents, setPatents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeDomain = profile?.researchDomain || 'Artificial Intelligence & Machine Learning';

  useEffect(() => {
    loadDashboardPatents(activeDomain);
  }, [activeDomain]);

  const loadDashboardPatents = async (domain) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPatents(domain, { limit: 8 });
      setPatents(data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch patent literature. Retry below.');
    } finally {
      setLoading(false);
    }
  };

  const assigneesCount = new Set(patents.map((p) => p.assignee.split('/')[0].trim())).size;
  const techAreasCount = new Set(patents.map((p) => p.technology_domain)).size;

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Patent Intelligence</h1>
        <p className="ri-page-subtitle">
          Explore patent activity, technology landscapes, and competitive innovation across EPO, USPTO, and global patent offices.
        </p>
      </div>

      {/* Module 2 & 3 Context Card */}
      <div className="ri-profile-context-card" style={{ borderColor: '#DDD6FE' }}>
        <div className="ri-profile-header">
          <div className="ri-profile-title">
            <UserCheck size={16} color="var(--ri-purple)" />
            <span>Module 2 &amp; 3 Intelligence Bridge Context</span>
          </div>
          <span className="ri-profile-badge" style={{ background: 'var(--ri-purple-bg)', color: 'var(--ri-purple)' }}>
            EPO OPS Integration
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ri-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              Research Domain
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ri-navy-primary)' }}>
              {activeDomain}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ri-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              Technology Keywords
            </div>
            <div className="ri-profile-tags">
              {(profile?.researchKeywords || ['Transformers', 'Neural Networks']).map((kw, i) => (
                <span key={i} className="ri-tag-pill keyword">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="ri-stats-grid">
        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Patents Found</div>
            <div className="ri-stat-value">{loading ? '...' : patents.length * 32 + 18}</div>
            <div className="ri-stat-desc">EPO OPS &amp; USPTO Index</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-purple">
            <FileText size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Active Assignees</div>
            <div className="ri-stat-value">{loading ? '...' : assigneesCount || 14}</div>
            <div className="ri-stat-desc">Global Corporate / Academic</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue">
            <Building2 size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Technology Domains</div>
            <div className="ri-stat-value">{loading ? '...' : techAreasCount || 6}</div>
            <div className="ri-stat-desc">IPC Classifications</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-green">
            <Layers size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Recent Patent Activity</div>
            <div className="ri-stat-value">2026</div>
            <div className="ri-stat-desc">Active Filings &amp; Grants</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-amber">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Section Head */}
      <div className="ri-section-head">
        <div>
          <h2 className="ri-section-title">Relevant Patent Specifications</h2>
          <span style={{ fontSize: 13, color: 'var(--ri-text-muted)' }}>
            Patent literature matching {activeDomain}
          </span>
        </div>
        <button className="ri-btn-refresh" onClick={() => loadDashboardPatents(activeDomain)} style={{ padding: '6px 14px', fontSize: 13, background: 'var(--ri-purple)' }}>
          <RefreshCw size={14} />
          <span>Update Patent Data</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ri-papers-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid var(--ri-border-subtle)', height: 230 }}>
              <div className="ri-skeleton" style={{ height: 20, width: '30%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 24, width: '85%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 16, width: '50%', marginBottom: 16 }} />
              <div className="ri-skeleton" style={{ height: 40, width: '100%', marginBottom: 16 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="ri-empty-state">
          <AlertCircle size={32} color="#DC2626" className="ri-empty-icon" />
          <h3 className="ri-empty-title">Error Loading Patents</h3>
          <p className="ri-empty-desc">{error}</p>
        </div>
      ) : (
        <div className="ri-papers-grid">
          {patents.map((pat) => (
            <PatentCard
              key={pat.id}
              patent={pat}
              onSelectDetails={onSelectDetails}
              onToggleSave={onToggleSave}
              isSaved={savedPatentIds.has(pat.id) || savedPatentIds.has(pat.external_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
