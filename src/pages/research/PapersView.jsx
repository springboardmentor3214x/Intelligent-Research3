import { useState, useEffect } from 'react';
import { fetchResearchPapers } from '../../services/researchService';
import PaperCard from '../../components/research/PaperCard';
import { Filter, SortAsc, RefreshCw, FileText, Search } from 'lucide-react';

export default function PapersView({
  onSelectPaper,
  onOpenAiSummary,
  onToggleSave,
  savedPaperIds = new Set(),
}) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('citations');
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadAllPapers();
  }, []);

  const loadAllPapers = async () => {
    setLoading(true);
    try {
      const results = await fetchResearchPapers('Artificial Intelligence Machine Learning Technology', { limit: 16 });
      setPapers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = papers
    .filter((p) => {
      if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchAuthor = Array.isArray(p.authors) ? p.authors.some((a) => a.toLowerCase().includes(q)) : false;
        return matchTitle || matchAuthor;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'citations') return (b.citations_count || 0) - (a.citations_count || 0);
      if (sortBy === 'year') return (b.year || 0) - (a.year || 0);
      return 0;
    });

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Research Papers Repository</h1>
        <p className="ri-page-subtitle">
          Explore normalized scientific papers from OpenAlex, Semantic Scholar, and indexed academic databases.
        </p>
      </div>

      {/* Control Bar */}
      <div className="ri-selector-card" style={{ padding: '16px 20px', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--ri-text-muted)" />
          <input
            type="text"
            placeholder="Filter by title or author in list..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: '13.5px',
              color: 'var(--ri-text-primary)',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ri-text-muted)' }}>
            <Filter size={14} />
            <span>Source:</span>
          </div>
          <select
            className="ri-filter-select"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            <option value="OpenAlex">OpenAlex</option>
            <option value="Semantic Scholar">Semantic Scholar</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--ri-text-muted)' }}>
            <SortAsc size={14} />
            <span>Sort:</span>
          </div>
          <select
            className="ri-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="citations">Most Cited</option>
            <option value="year">Newest First</option>
          </select>

          <button
            className="ri-btn-action"
            onClick={loadAllPapers}
            title="Refresh"
            style={{ padding: '8px', background: 'var(--ri-bg-hover)', borderRadius: '6px' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ri-papers-grid">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} style={{ background: '#fff', padding: 20, borderRadius: 10, border: '1px solid var(--ri-border-subtle)', height: 210 }}>
              <div className="ri-skeleton" style={{ height: 20, width: '30%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 24, width: '85%', marginBottom: 12 }} />
              <div className="ri-skeleton" style={{ height: 16, width: '50%', marginBottom: 16 }} />
              <div className="ri-skeleton" style={{ height: 40, width: '100%', marginBottom: 16 }} />
              <div className="ri-skeleton" style={{ height: 28, width: '60%' }} />
            </div>
          ))}
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="ri-empty-state">
          <FileText size={32} className="ri-empty-icon" />
          <h3 className="ri-empty-title">No Papers Found</h3>
          <p className="ri-empty-desc">No indexed publications match your source or search criteria.</p>
        </div>
      ) : (
        <div className="ri-papers-grid">
          {filteredPapers.map((paper) => (
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
      )}
    </div>
  );
}
