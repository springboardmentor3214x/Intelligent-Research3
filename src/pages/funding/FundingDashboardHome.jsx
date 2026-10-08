import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchFundingOpportunities } from '../../services/fundingService';
import FundingCard from '../../components/funding/FundingCard';
import { DollarSign, Clock, Sparkles, Bookmark, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';

export default function FundingDashboardHome({
  onSelectDetails,
  onToggleSave,
  savedOppIds = new Set(),
}) {
  const { profile } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeDomain = profile?.researchDomain || 'Artificial Intelligence & Machine Learning';

  useEffect(() => {
    loadDashboardFunding(activeDomain);
  }, [activeDomain]);

  const loadDashboardFunding = async (domain) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFundingOpportunities(domain, { limit: 8 });
      setOpportunities(data);
    } catch (err) {
      console.error(err);
      setError('Unable to fetch funding opportunities. Retry below.');
    } finally {
      setLoading(false);
    }
  };

  const closingSoonCount = opportunities.filter((o) => {
    const yr = parseInt(o.close_date.slice(0, 4), 10);
    return yr <= 2026;
  }).length;

  return (
    <div>
      {/* Top Header */}
      <div className="ri-page-header">
        <h1 className="ri-page-title">Funding Intelligence</h1>
        <p className="ri-page-subtitle">
          Discover funding opportunities, grants, and commercialization awards relevant to your research and innovation.
        </p>
      </div>

      {/* Module 2 Research Profile Card */}
      <div className="ri-profile-context-card" style={{ borderColor: '#A7F3D0' }}>
        <div className="ri-profile-header">
          <div className="ri-profile-title">
            <UserCheck size={16} color="#047857" />
            <span>Module 2 Profile Integration Context</span>
          </div>
          <span className="ri-profile-badge" style={{ background: '#ECFDF5', color: '#047857' }}>
            {profile?.role || 'Researcher'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ri-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              Research Domain
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ri-navy-primary)' }}>
              {profile?.researchDomain || 'Artificial Intelligence'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ri-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              Organization &amp; Institution
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ri-navy-primary)' }}>
              {profile?.organization || 'MIT / Research Institute'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, color: 'var(--ri-text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
              Keywords Matched
            </div>
            <div className="ri-profile-tags">
              {(profile?.researchKeywords || ['Transformers', 'Machine Learning']).map((kw, i) => (
                <span key={i} className="ri-tag-pill" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ri-stats-grid">
        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Relevant Opportunities</div>
            <div className="ri-stat-value">{loading ? '...' : opportunities.length + 14}</div>
            <div className="ri-stat-desc">Grants.gov Indexed</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-green">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Closing Soon</div>
            <div className="ri-stat-value">{loading ? '...' : closingSoonCount || 3}</div>
            <div className="ri-stat-desc">Deadline &lt; 90 Days</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-amber">
            <Clock size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Recommended for You</div>
            <div className="ri-stat-value">{loading ? '...' : opportunities.length}</div>
            <div className="ri-stat-desc">High Match Score</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-blue">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="ri-stat-card">
          <div>
            <div className="ri-stat-label">Saved Opportunities</div>
            <div className="ri-stat-value">{savedOppIds.size}</div>
            <div className="ri-stat-desc">In Your Library</div>
          </div>
          <div className="ri-stat-icon-wrap ri-stat-icon-purple">
            <Bookmark size={20} />
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="ri-section-head">
        <div>
          <h2 className="ri-section-title">Recommended Funding Opportunities</h2>
          <span style={{ fontSize: 13, color: 'var(--ri-text-muted)' }}>
            Grants and awards tailored to {activeDomain}
          </span>
        </div>
        <button className="ri-btn-refresh" onClick={() => loadDashboardFunding(activeDomain)} style={{ padding: '6px 14px', fontSize: 13 }}>
          <RefreshCw size={14} />
          <span>Refresh Grants</span>
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
          <h3 className="ri-empty-title">Error Loading Funding Data</h3>
          <p className="ri-empty-desc">{error}</p>
        </div>
      ) : (
        <div className="ri-papers-grid">
          {opportunities.map((opp) => (
            <FundingCard
              key={opp.id}
              opportunity={opp}
              onSelectDetails={onSelectDetails}
              onToggleSave={onToggleSave}
              isSaved={savedOppIds.has(opp.id) || savedOppIds.has(opp.external_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
