import { useState } from 'react';
import { fetchFundingOpportunities } from '../../services/fundingService';
import FundingCard from '../../components/funding/FundingCard';
import { Search, Filter, Building2, Layers, DollarSign, Calendar, AlertCircle } from 'lucide-react';

const FUNDING_TYPES = ['All Funding Types', 'Standard Grant', 'Cooperative Agreement', 'Research Project Grant (R01)', 'Broad Agency Announcement (BAA)', 'Blended Finance / Grant + Equity'];
const RESEARCH_DOMAINS = ['All Domains', 'Artificial Intelligence & Machine Learning', 'Biotechnology & Life Sciences', 'Clean Energy & Environment', 'Cybersecurity & Data Privacy', 'Quantum Computing'];

export default function FundingSearch({
  onSelectDetails,
  onToggleSave,
  savedOppIds = new Set(),
}) {
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [typeFilter, setTypeFilter] = useState('All Funding Types');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    setError(null);
    setSearched(true);

    const searchQuery = [query.trim(), domainFilter !== 'All Domains' ? domainFilter : ''].filter(Boolean).join(' ');

    try {
      const opps = await fetchFundingOpportunities(searchQuery || 'Technology Grant', { limit: 12 });
      const filtered = opps.filter((o) => {
        if (typeFilter !== 'All Funding Types' && o.funding_type !== typeFilter) return false;
        return true;
      });
      setResults(filtered);
    } catch (err) {
      console.error(err);
      setError('Search service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Funding Opportunity Search</h1>
        <p className="ri-page-subtitle">
          Query Grants.gov, Horizon Europe, and agency databases for research funding and commercialization grants.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="ri-search-hero-card">
        <form onSubmit={handleSearch}>
          <div className="ri-search-input-group">
            <input
              type="text"
              className="ri-search-input"
              placeholder="Search funding opportunities by keyword, agency, grant number, or eligibility..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="funding-search-input"
            />
            <button type="submit" className="ri-btn-search" style={{ background: '#047857' }} id="funding-search-btn">
              <Search size={16} />
              <span>Search Grants</span>
            </button>
          </div>

          <div className="ri-search-filters-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Layers size={14} />
              <span>Domain:</span>
              <select
                className="ri-filter-select"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                {RESEARCH_DOMAINS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Filter size={14} />
              <span>Funding Type:</span>
              <select
                className="ri-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {FUNDING_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {searched && (
        <div className="ri-section-head">
          <div>
            <h2 className="ri-section-title">
              Search Results {results.length > 0 ? `(${results.length} opportunities)` : ''}
            </h2>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ri-text-muted)' }}>
            Grants.gov API Search
          </div>
        </div>
      )}

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
          <h3 className="ri-empty-title">Search Error</h3>
          <p className="ri-empty-desc">{error}</p>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="ri-empty-state">
          <DollarSign size={32} className="ri-empty-icon" />
          <h3 className="ri-empty-title">No matching opportunities found</h3>
          <p className="ri-empty-desc">
            Try broadening your search keywords or clearing funding type filters.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="ri-papers-grid">
          {results.map((opp) => (
            <FundingCard
              key={opp.id}
              opportunity={opp}
              onSelectDetails={onSelectDetails}
              onToggleSave={onToggleSave}
              isSaved={savedOppIds.has(opp.id) || savedOppIds.has(opp.external_id)}
            />
          ))}
        </div>
      ) : (
        <div className="ri-empty-state" style={{ background: 'transparent', border: '1px dashed var(--ri-border-subtle)' }}>
          <DollarSign size={32} color="#047857" className="ri-empty-icon" />
          <h3 className="ri-empty-title">Enter a Funding Search Term</h3>
          <p className="ri-empty-desc">
            Search terms like "AI Medical", "Clean Energy Grant", "Quantum Systems", or "NSF" to discover active agency opportunities.
          </p>
        </div>
      )}
    </div>
  );
}
