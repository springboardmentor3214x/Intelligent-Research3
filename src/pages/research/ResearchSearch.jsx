import { useState } from 'react';
import { fetchResearchPapers } from '../../services/researchService';
import PaperCard from '../../components/research/PaperCard';
import { Search, Filter, Calendar, BookOpen, Layers, Sparkles, AlertCircle } from 'lucide-react';

const RESEARCH_AREAS = [
  'All Domains',
  'Artificial Intelligence & Machine Learning',
  'Biotechnology & Life Sciences',
  'Clean Energy & Environment',
  'Cybersecurity & Data Privacy',
  'Healthcare & Medical Research',
  'Materials Science & Engineering',
  'Quantum Computing',
  'Robotics & Automation',
];

export default function ResearchSearch({
  onSelectPaper,
  onOpenAiSummary,
  onToggleSave,
  savedPaperIds = new Set(),
}) {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [area, setArea] = useState('All Domains');
  const [yearFilter, setYearFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() && area === 'All Domains') return;

    setLoading(true);
    setError(null);
    setSearched(true);

    const searchQuery = [query.trim(), area !== 'All Domains' ? area : ''].filter(Boolean).join(' ');

    try {
      const papers = await fetchResearchPapers(searchQuery || 'Computer Science Research', {
        source: source,
        limit: 14,
      });

      const filtered = papers.filter((p) => {
        if (yearFilter === '2026' && p.year !== 2026) return false;
        if (yearFilter === '2025-2026' && (p.year < 2025 || p.year > 2026)) return false;
        if (yearFilter === '2020-2024' && (p.year < 2020 || p.year > 2024)) return false;
        return true;
      });

      setResults(filtered);
    } catch (err) {
      console.error(err);
      setError('Search service encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Research Search Engine</h1>
        <p className="ri-page-subtitle">
          Query cross-disciplinary scientific repositories with support for keywords, titles, authors, and domains.
        </p>
      </div>

      {/* Search Bar & Filters Card */}
      <div className="ri-search-hero-card">
        <form onSubmit={handleSearch}>
          <div className="ri-search-input-group">
            <input
              type="text"
              className="ri-search-input"
              placeholder="Search research papers by keyword, title, author, or methodology..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              id="research-search-input"
            />
            <button type="submit" className="ri-btn-search" id="research-search-btn">
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>

          <div className="ri-search-filters-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Filter size={14} />
              <span>Source:</span>
              <select
                className="ri-filter-select"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="all">All Sources (OpenAlex + Semantic Scholar)</option>
                <option value="OpenAlex">OpenAlex Only</option>
                <option value="Semantic Scholar">Semantic Scholar Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Layers size={14} />
              <span>Domain:</span>
              <select
                className="ri-filter-select"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                {RESEARCH_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ri-text-muted)' }}>
              <Calendar size={14} />
              <span>Year:</span>
              <select
                className="ri-filter-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                <option value="2026">2026 (Latest)</option>
                <option value="2025-2026">2025 - 2026</option>
                <option value="2020-2024">2020 - 2024</option>
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
              Search Results {results.length > 0 ? `(${results.length} papers)` : ''}
            </h2>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--ri-text-muted)' }}>
            Normalized API schema active
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="ri-papers-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid var(--ri-border-subtle)', height: 210 }}>
              <div className="ri-skeleton" style={{ height: 20, width: '30%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 24, width: '85%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 16, width: '50%', marginBottom: 16 }} />
              <div className="ri-skeleton" style={{ height: 40, width: '100%', marginBottom: 16 }} />
              <div className="ri-skeleton" style={{ height: 28, width: '60%' }} />
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
          <BookOpen size={32} className="ri-empty-icon" />
          <h3 className="ri-empty-title">No matching publications found</h3>
          <p className="ri-empty-desc">
            Try adjusting your search terms, changing the source filter, or broadening the publication year range.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="ri-papers-grid">
          {results.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onSelectPaper={onSelectPaper}
              onOpenAiSummary={onOpenAiSummary}
              onToggleSave={onToggleSave}
              isSaved={savedPaperIds.has(paper.id) || savedPaperIds.has(paper.external_id)}
            />
          ))}
        </div>
      ) : (
        <div className="ri-empty-state" style={{ background: 'transparent', border: '1px dashed var(--ri-border-subtle)' }}>
          <Sparkles size={32} color="var(--ri-blue-accent)" className="ri-empty-icon" />
          <h3 className="ri-empty-title">Enter a Search Query</h3>
          <p className="ri-empty-desc">
            Type keywords such as "Transformer models", "CRISPR delivery", or "Perovskite solar cells" to discover relevant research literature.
          </p>
        </div>
      )}
    </div>
  );
}
