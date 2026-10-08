import { useState, useEffect } from 'react';
import { fetchFundingOpportunities } from '../../services/fundingService';
import FundingCard from '../../components/funding/FundingCard';
import { Clock, AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

export default function DeadlineTracker({
  onSelectDetails,
  onToggleSave,
  savedOppIds = new Set(),
}) {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'soon' | 'upcoming'

  useEffect(() => {
    loadDeadlineOpportunities();
  }, []);

  const loadDeadlineOpportunities = async () => {
    setLoading(true);
    try {
      const data = await fetchFundingOpportunities('Artificial Intelligence Technology', { limit: 12 });
      setOpportunities(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Categorize opportunities by actual closing dates
  const closingSoon = opportunities.filter((o) => {
    const closeMonth = parseInt(o.close_date.slice(5, 7), 10) || 10;
    return closeMonth <= 9 || o.close_date.startsWith('2026-08') || o.close_date.startsWith('2026-09') || o.close_date.startsWith('2026-10');
  });

  const upcoming = opportunities.filter((o) => !closingSoon.includes(o));

  const displayedOpps = filter === 'soon' ? closingSoon : filter === 'upcoming' ? upcoming : opportunities;

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Funding Deadline Tracker</h1>
        <p className="ri-page-subtitle">
          Track upcoming grant closing dates, application milestones, and submission deadlines.
        </p>
      </div>

      {/* Filter Tabs Bar */}
      <div className="ri-selector-card">
        <div className="ri-selector-label">
          <Clock size={18} color="#047857" />
          <span>Filter by Deadline:</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setFilter('all')}
            className={`ri-btn-card-action ${filter === 'all' ? 'ai-btn' : ''}`}
            style={{ padding: '8px 16px' }}
          >
            All Deadlines ({opportunities.length})
          </button>
          <button
            onClick={() => setFilter('soon')}
            className={`ri-btn-card-action ${filter === 'soon' ? 'ai-btn' : ''}`}
            style={{ padding: '8px 16px', color: '#DC2626', borderColor: '#FCA5A5' }}
          >
            <AlertTriangle size={14} /> Closing Soon ({closingSoon.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`ri-btn-card-action ${filter === 'upcoming' ? 'ai-btn' : ''}`}
            style={{ padding: '8px 16px' }}
          >
            <Calendar size={14} /> Upcoming ({upcoming.length})
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ri-papers-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid var(--ri-border-subtle)', height: 230 }}>
              <div className="ri-skeleton" style={{ height: 20, width: '30%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 24, width: '85%', marginBottom: 12 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="ri-papers-grid">
          {displayedOpps.map((opp) => (
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
