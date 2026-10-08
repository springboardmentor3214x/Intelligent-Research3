import { X, ExternalLink, Bookmark, BookmarkCheck, Building2, Calendar, ShieldCheck, Info, FileText } from 'lucide-react';

export default function PatentDetailsModal({
  patent,
  onClose,
  onToggleSave,
  isSaved = false,
}) {
  if (!patent) return null;

  return (
    <div className="ri-modal-backdrop" onClick={onClose}>
      <div className="ri-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840 }}>
        {/* Header */}
        <div className="ri-modal-header" style={{ background: '#F5F3FF' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="ri-patent-num-tag">{patent.patent_number}</span>
              <span className="ri-status-pill" style={{ background: '#ffffff', color: 'var(--ri-purple)' }}>
                <ShieldCheck size={12} color="var(--ri-purple)" />
                <span>{patent.status}</span>
              </span>
            </div>
            <h2 className="ri-modal-title">{patent.title}</h2>
          </div>
          <button className="ri-btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ri-modal-body">
          {/* Metadata Grid */}
          <div className="ri-modal-meta-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div>
              <span className="ri-meta-item-label">Assignee / Owner: </span>
              <span className="ri-meta-item-val" style={{ fontWeight: 700 }}>{patent.assignee}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Inventors: </span>
              <span className="ri-meta-item-val">
                {Array.isArray(patent.inventors) ? patent.inventors.join(', ') : patent.inventors}
              </span>
            </div>
            <div>
              <span className="ri-meta-item-label">IPC Classification: </span>
              <span className="ri-meta-item-val" style={{ color: 'var(--ri-purple)', fontWeight: 700 }}>{patent.classification}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Filing Date: </span>
              <span className="ri-meta-item-val">{patent.filing_date}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Publication Date: </span>
              <span className="ri-meta-item-val">{patent.publication_date}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Forward Citations: </span>
              <span className="ri-meta-item-val">{patent.citations} citations</span>
            </div>
          </div>

          {/* Official Source Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid var(--ri-border-subtle)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="var(--ri-purple)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: 'var(--ri-text-secondary)' }}>
              <strong>Official Patent Data:</strong> Bibliographic specifications, IPC classifications, and claims are synchronized with EPO Open Patent Services (OPS) and USPTO registers.
            </div>
          </div>

          {/* Abstract */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
              Patent Abstract &amp; Technical Summary
            </h4>
            <p style={{ fontSize: 13.5, color: 'var(--ri-text-secondary)', lineHeight: 1.6, background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--ri-border-subtle)' }}>
              {patent.abstract}
            </p>
          </div>

          {/* Independent Claims */}
          {patent.claims && patent.claims.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
                Independent Claims Sample
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {patent.claims.map((claim, i) => (
                  <div key={i} style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '10px 14px', borderRadius: 6, fontSize: 13, color: '#5B21B6', lineHeight: 1.5 }}>
                    {claim}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ri-border-subtle)', background: '#FAFCFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onToggleSave(patent)}
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            style={{ padding: '8px 16px' }}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Saved in Patent Library' : 'Save Patent'}</span>
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            {patent.patent_url && (
              <a
                href={patent.patent_url}
                target="_blank"
                rel="noreferrer"
                className="ri-btn-refresh"
                style={{ textDecoration: 'none', padding: '8px 16px', background: 'var(--ri-purple)' }}
              >
                <ExternalLink size={15} />
                <span>Open Espacenet / Google Patent Official Register</span>
              </a>
            )}
            <button onClick={onClose} className="ri-btn-card-action" style={{ padding: '8px 16px' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
