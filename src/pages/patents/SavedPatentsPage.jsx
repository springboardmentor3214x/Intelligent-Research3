import { Bookmark, Eye, Trash2, Building2, Calendar } from 'lucide-react';

export default function SavedPatentsPage({
  savedPatents = [],
  onSelectDetails,
  onRemoveSaved,
}) {
  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Saved Patent Specifications</h1>
        <p className="ri-page-subtitle">
          Your bookmarked patent specifications, synchronized with your Supabase account.
        </p>
      </div>

      {savedPatents.length === 0 ? (
        <div className="ri-empty-state">
          <Bookmark size={36} className="ri-empty-icon" color="var(--ri-purple)" />
          <h3 className="ri-empty-title">No Saved Patents Yet</h3>
          <p className="ri-empty-desc">
            Click "Save" on any patent card to bookmark it in your personal Patent Intelligence library.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {savedPatents.map((pat) => (
            <div
              key={pat.id || pat.external_id}
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
                  <span className="ri-patent-num-tag">{pat.patent_number}</span>
                  <span style={{ fontSize: 12, color: 'var(--ri-text-muted)', fontWeight: 600 }}>
                    Pub: {pat.publication_date}
                  </span>
                </div>

                <h3
                  style={{ fontSize: 16, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 6, cursor: 'pointer' }}
                  onClick={() => onSelectDetails(pat)}
                >
                  {pat.title}
                </h3>

                <div style={{ fontSize: 13, color: 'var(--ri-text-secondary)', marginBottom: 8 }}>
                  <Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Assignee: {pat.assignee}
                </div>

                <p style={{ fontSize: 13, color: 'var(--ri-text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {pat.abstract}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  className="ri-btn-card-action"
                  onClick={() => onSelectDetails(pat)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>

                <button
                  className="ri-btn-card-action"
                  onClick={() => onRemoveSaved(pat.id || pat.external_id)}
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
