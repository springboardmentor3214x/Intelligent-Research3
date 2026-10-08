import { Eye, Bookmark, BookmarkCheck, Building2, Calendar, ShieldCheck, Tag } from 'lucide-react';

export default function PatentCard({
  patent,
  onSelectDetails,
  onToggleSave,
  isSaved = false,
}) {
  if (!patent) return null;

  return (
    <div className="ri-patent-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span className="ri-patent-num-tag">
          {patent.patent_number}
        </span>
        <span className="ri-status-pill" style={{ fontSize: 11, padding: '2px 8px' }}>
          <ShieldCheck size={12} color="var(--ri-purple)" />
          <span>{patent.status}</span>
        </span>
      </div>

      {/* Title */}
      <h3
        className="ri-paper-title"
        onClick={() => onSelectDetails(patent)}
        title={patent.title}
        style={{ fontSize: 15.5 }}
      >
        {patent.title}
      </h3>

      {/* Assignee & Inventors */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ri-navy-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Building2 size={14} color="var(--ri-purple)" />
        <span>Assignee: {patent.assignee}</span>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ri-text-muted)', marginBottom: 10 }}>
        Inventors: {Array.isArray(patent.inventors) ? patent.inventors.join(', ') : patent.inventors}
      </div>

      {/* Abstract Excerpt */}
      <p className="ri-paper-abstract" style={{ WebkitLineClamp: 2, marginBottom: 12 }}>
        {patent.abstract}
      </p>

      {/* Classifications & Domain */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <span className="ri-meta-pill" style={{ background: 'var(--ri-purple-bg)', color: 'var(--ri-purple)', fontWeight: 600 }}>
          IPC: {patent.classification}
        </span>
        <span className="ri-meta-pill">
          {patent.technology_domain}
        </span>
      </div>

      {/* Footer Bar */}
      <div className="ri-paper-footer">
        <span style={{ fontSize: 11.5, color: 'var(--ri-text-muted)' }}>
          Pub: {patent.publication_date}
        </span>

        <div className="ri-paper-actions">
          <button
            className="ri-btn-card-action"
            onClick={() => onSelectDetails(patent)}
            title="View Official Patent Specification"
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>

          <button
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(patent)}
            title={isSaved ? 'Saved in Patent Library' : 'Save Patent'}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
