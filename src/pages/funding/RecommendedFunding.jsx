import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchFundingOpportunities } from '../../services/fundingService';
import FundingCard from '../../components/funding/FundingCard';
import { Sparkles, Layers, UserCheck } from 'lucide-react';

export default function RecommendedFunding({
  onSelectDetails,
  onToggleSave,
  savedOppIds = new Set(),
}) {
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeDomain = profile?.researchDomain || 'Artificial Intelligence & Machine Learning';

  useEffect(() => {
    loadRecommendations();
  }, [activeDomain]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const data = await fetchFundingOpportunities(activeDomain, { limit: 10 });
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Recommended Funding Opportunities</h1>
        <p className="ri-page-subtitle">
          Opportunities matched to your Module 2 research profile domain, keywords, and institutional eligibility.
        </p>
      </div>

      {/* Matching Rationale Banner */}
      <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '16px 20px', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Sparkles size={24} color="#047857" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#065F46', marginBottom: 2 }}>
            Module 2 Profile Flow Activated
          </div>
          <div style={{ fontSize: 13, color: '#047857' }}>
            Matching keywords: <strong>{(profile?.researchKeywords || ['Artificial Intelligence', 'Machine Learning']).join(', ')}</strong> | Domain: <strong>{activeDomain}</strong>
          </div>
        </div>
      </div>

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
      ) : (
        <div className="ri-papers-grid">
          {recommendations.map((opp) => (
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
