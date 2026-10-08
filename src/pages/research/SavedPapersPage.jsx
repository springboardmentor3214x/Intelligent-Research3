import { Bookmark, Eye, Sparkles, Trash2, ExternalLink } from 'lucide-react';

export default function SavedPapersPage({
  savedPapers = [],
  onSelectPaper,
  onOpenAiSummary,
  onRemoveSaved,
}) {
  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Saved Papers &amp; Library</h1>
        <p className="ri-page-subtitle">
          Your curated collection of scientific publications, synchronized with your Research Intelligence account.
        </p>
      </div>

      {savedPapers.length === 0 ? (
        <div className="ri-empty-state">
          <Bookmark size={36} className="ri-empty-icon" />
          <h3 className="ri-empty-title">No Saved Papers Yet</h3>
          <p className="ri-empty-desc">
            When exploring recommended literature or search results, click "Save" on any paper card to bookmark it here for in-depth analysis.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {savedPapers.map((paper) => (
            <div
              key={paper.id || paper.external_id}
              style={{
                background: '#ffffff',
                border: '1px solid var(--ri-border-subtle)',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: 'var(--ri-shadow-sm)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`ri-paper-source-badge ${paper.source === 'Semantic Scholar' ? 'semantic' : ''}`}>
                    {paper.source}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ri-text-muted)', fontWeight: 600 }}>
                    {paper.year || '2026'} · {paper.journal || paper.conference || 'Academic Repository'}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--ri-navy-primary)',
                    marginBottom: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectPaper(paper)}
                >
                  {paper.title}
                </h3>

                <div style={{ fontSize: 13, color: 'var(--ri-text-secondary)', marginBottom: 10 }}>
                  By {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
                </div>

                <p style={{ fontSize: 13, color: 'var(--ri-text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {paper.abstract}
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  className="ri-btn-card-action"
                  onClick={() => onSelectPaper(paper)}
                  title="View Full Metadata"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Eye size={14} />
                  <span>View</span>
                </button>

                <button
                  className="ri-btn-card-action ai-btn"
                  onClick={() => onOpenAiSummary(paper)}
                  title="View AI Analysis"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={14} />
                  <span>AI Summary</span>
                </button>

                <button
                  className="ri-btn-card-action"
                  onClick={() => onRemoveSaved(paper.id || paper.external_id)}
                  title="Remove from Saved"
                  style={{ color: '#DC2626', borderColor: '#FCA5A5', width: '100%', justifyContent: 'center' }}
                >
                  <Trash2 size={14} />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
