import { useState, useEffect } from 'react';
import { fetchFundingOpportunities } from '../../services/fundingService';
import { Scale, CheckCircle2, Building2, Calendar, DollarSign, Plus, X } from 'lucide-react';

export default function FundingComparison({ onSelectDetails }) {
  const [availableOpps, setAvailableOpps] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparisonOpps();
  }, []);

  const loadComparisonOpps = async () => {
    setLoading(true);
    try {
      const data = await fetchFundingOpportunities('Artificial Intelligence Healthcare Energy', { limit: 8 });
      setAvailableOpps(data);
      if (data.length >= 2) {
        setSelectedIds([data[0].id, data[1].id]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedOpps = availableOpps.filter((o) => selectedIds.includes(o.id));

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Funding Comparison Matrix</h1>
        <p className="ri-page-subtitle">
          Compare up to 3 funding opportunities side-by-side on award amounts, institutional eligibility, and agency requirements.
        </p>
      </div>

      {/* Opportunity Selector Cards Bar */}
      <div className="ri-selector-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <div className="ri-selector-label">
          <Scale size={18} color="#047857" />
          <span>Select Opportunities to Compare (Select 2 to 3):</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, width: '100%' }}>
          {availableOpps.map((opp) => {
            const isSelected = selectedIds.includes(opp.id);
            return (
              <button
                key={opp.id}
                onClick={() => toggleSelect(opp.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #047857' : '1px solid var(--ri-border-subtle)',
                  background: isSelected ? '#ECFDF5' : '#ffffff',
                  color: isSelected ? '#047857' : 'var(--ri-text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isSelected ? <CheckCircle2 size={14} color="#047857" /> : <Plus size={14} />}
                <span>{opp.agency.split(' ')[0]}: {opp.title.slice(0, 32)}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Matrix Table */}
      {loading ? (
        <div style={{ background: '#fff', padding: 32, borderRadius: 10, border: '1px solid var(--ri-border-subtle)' }}>
          <div className="ri-skeleton" style={{ height: 24, width: '40%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 180, width: '100%' }} />
        </div>
      ) : selectedOpps.length === 0 ? (
        <div className="ri-empty-state">
          <Scale size={32} className="ri-empty-icon" color="#047857" />
          <h3 className="ri-empty-title">Select opportunities to compare</h3>
          <p className="ri-empty-desc">Choose 2 or 3 opportunities above to generate an enterprise comparison table.</p>
        </div>
      ) : (
        <div className="ri-comparison-table-wrap">
          <table className="ri-comparison-table">
            <thead>
              <tr>
                <th className="ri-comparison-row-label">Feature / Metric</th>
                {selectedOpps.map((opp) => (
                  <th key={opp.id} style={{ minWidth: 240 }}>
                    <div style={{ fontSize: 11, color: '#047857', textTransform: 'uppercase', marginBottom: 4 }}>
                      {opp.source}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', lineHeight: 1.3 }}>
                      {opp.title}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ri-comparison-row-label">Funding Agency</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id}>
                    <strong>{opp.agency}</strong>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Funding Amount</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id} style={{ color: '#047857', fontWeight: 800, fontSize: 15 }}>
                    {opp.funding_amount}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Closing Date</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id} style={{ color: '#DC2626', fontWeight: 700 }}>
                    {opp.close_date}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Funding Type</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id}>
                    <span className="ri-meta-pill">{opp.funding_type}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Eligibility Criteria</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id} style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    {opp.eligibility}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Research Areas</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {opp.research_areas.map((ra, i) => (
                        <span key={i} className="ri-tag-pill" style={{ fontSize: 11 }}>
                          {ra}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="ri-comparison-row-label">Action</td>
                {selectedOpps.map((opp) => (
                  <td key={opp.id}>
                    <button
                      className="ri-btn-card-action ai-btn"
                      onClick={() => onSelectDetails(opp)}
                      style={{ padding: '6px 12px' }}
                    >
                      View Opportunity
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
