import { useState } from 'react';
import { fetchPatents } from '../../services/patentService';
import PatentCard from '../../components/patents/PatentCard';
import { Search, Filter, Layers, Building2, Calendar, FileText, AlertCircle } from 'lucide-react';

const DOMAINS = ['All Domains', 'Artificial Intelligence & Machine Learning', 'Biotechnology & Life Sciences', 'Clean Energy & Environment', 'Cybersecurity & Data Privacy', 'Quantum Computing'];
const STATUSES = ['All Statuses', 'Granted', 'Published Application'];

export default function PatentSearch({
  onSelectDetails,
  onToggleSave,
  savedPatentIds = new Set(),
}) {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('All Domains');
  const [status, setStatus] = useState('All Statuses');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    setSearched(true);

    const q = [query.trim(), domain !== 'All Domains' ? domain : ''].filter(Boolean).join(' ');

    try {
      const pats = await fetchPatents(q || 'Artificial Intelligence', { limit: 12 });
      const filtered = pats.filter((p) => {
        if (status !== 'All Statuses' && p.status !== status) return false;
        return true;
      });
      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Patent Search Engine</h1>
        <p className="ri-page-subtitle">
          Search global patent literature by keywords, titles, IPC classifications, assignees, or inventors.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="ri-search-hero-card">
        <form onSubmit={handleSearch}>
          <div className="ri-search-input-group">
            <input
              type="text"
              className="ri-search-input"
              placeholder="Search by patent title, assignee (e.g. Google, IBM), IPC code (G06N), or inventor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="patent-search-input"
            />
            <button type="submit" className="ri-btn-search" style={{ background: 'var(--ri-purple)' }} id="patent-search-btn">
              <Search size={16} />
              <span>Search Patents</span>
            </button>
          </div>

          <div className="ri-search-filters-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Layers size={14} />
              <span>Technology Domain:</span>
              <select className="ri-filter-select" value={domain} onChange={(e) => setDomain(e.target.value)}>
                {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Filter size={14} />
              <span>Patent Status:</span>
              <select className="ri-filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {searched && (
        <div className="ri-section-head">
          <div>
            <h2 className="ri-section-title">
              Patent Results {results.length > 0 ? `(${results.length} specifications)` : ''}
            </h2>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ri-text-muted)' }}>
            EPO OPS Normalized Schema
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
      ) : searched && results.length === 0 ? (
        <div className="ri-empty-state">
          <FileText size={32} className="ri-empty-icon" color="var(--ri-purple)" />
          <h3 className="ri-empty-title">No matching patent specifications found</h3>
          <p className="ri-empty-desc">Try clearing filters or searching for alternative assignee names or IPC classifications.</p>
        </div>
      ) : results.length > 0 ? (
        <div className="ri-papers-grid">
          {results.map((pat) => (
            <PatentCard
              key={pat.id}
              patent={pat}
              onSelectDetails={onSelectDetails}
              onToggleSave={onToggleSave}
              isSaved={savedPatentIds.has(pat.id) || savedPatentIds.has(pat.external_id)}
            />
          ))}
        </div>
      ) : (
        <div className="ri-empty-state" style={{ background: 'transparent', border: '1px dashed var(--ri-border-subtle)' }}>
          <FileText size={32} color="var(--ri-purple)" className="ri-empty-icon" />
          <h3 className="ri-empty-title">Enter a Patent Search Query</h3>
          <p className="ri-empty-desc">
            Enter assignee names (e.g., "IBM", "Google"), IPC codes ("G06N"), or terms like "Diffusion Networks" to retrieve patent specifications.
          </p>
        </div>
      )}
    </div>
  );
}
