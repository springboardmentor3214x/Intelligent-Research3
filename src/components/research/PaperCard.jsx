import { Eye, Sparkles, Bookmark, BookmarkCheck, ExternalLink } from 'lucide-react';

export default function PaperCard({ paper, onSelectPaper, onOpenAiSummary, onToggleSave, isSaved = false }) {
  if (!paper) return null;

  const isSemantic = paper.source === 'Semantic Scholar';

  return (
    <div className={`ri-paper-card ${isSemantic ? 'source-semantic' : ''}`}>
      {/* Header */}
      <div className="ri-paper-header">
        <span className={`ri-paper-source-badge ${isSemantic ? 'semantic' : ''}`}>
          {paper.source}
        </span>
        <span className="ri-paper-year">
          {paper.year || (paper.publication_date ? paper.publication_date.slice(0, 4) : '2026')}
        </span>
      </div>

      {/* Title */}
      <h3
        className="ri-paper-title"
        onClick={() => onSelectPaper(paper)}
        title={paper.title}
      >
        {paper.title}
      </h3>

      {/* Authors */}
      <div className="ri-paper-authors">
        <span>By {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}</span>
      </div>

      {/* Compact Abstract Excerpt */}
      <p className="ri-paper-abstract" title={paper.abstract}>
        {paper.abstract}
      </p>

      {/* Footer & Actions */}
      <div className="ri-paper-footer">
        <div className="ri-paper-meta-pills">
          {paper.doi && (
            <span className="ri-meta-pill" title={`DOI: ${paper.doi}`}>
              DOI: {paper.doi.length > 18 ? `${paper.doi.slice(0, 15)}...` : paper.doi}
            </span>
          )}
          {paper.citations_count > 0 && (
            <span className="ri-meta-pill">
              ⭐ {paper.citations_count} cites
            </span>
          )}
        </div>

        <div className="ri-paper-actions">
          <button
            className="ri-btn-card-action"
            onClick={() => onSelectPaper(paper)}
            title="View Full Metadata & Abstract"
          >
            <Eye size={14} />
            <span>View</span>
          </button>

          <button
            className="ri-btn-card-action ai-btn"
            onClick={() => onOpenAiSummary(paper)}
            title="Generate AI Research Summary"
          >
            <Sparkles size={14} />
            <span>AI Summary</span>
          </button>

          <button
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(paper)}
            title={isSaved ? 'Saved in Library' : 'Save to Library'}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
