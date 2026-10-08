import { Bookmark, Eye, Trash2, Calendar, Building2, ExternalLink } from 'lucide-react';

export default function SavedFundingPage({
  savedFunding = [],
  onSelectDetails,
  onRemoveSaved,
}) {
  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Saved Funding Opportunities</h1>
        <p className="ri-page-subtitle">
          Your bookmarked grants and awards, stored securely in Supabase.
        </p>
      </div>

      {savedFunding.length === 0 ? (
        <div className="ri-empty-state">
          <Bookmark size={36} className="ri-empty-icon" color="#047857" />
          <h3 className="ri-empty-title">No Saved Opportunities</h3>
          <p className="ri-empty-desc">
            Click "Save" on any opportunity card to bookmark it in your personal funding library.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {savedFunding.map((opp) => (
            <div
              key={opp.id || opp.external_id}
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
                  <span className="ri-paper-source-badge" style={{ background: '#ECFDF5', color: '#047857' }}>
                    {opp.source || 'Grants.gov'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ri-text-muted)', fontWeight: 600 }}>
                    ID: {opp.external_id}
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
                  onClick={() => onSelectDetails(opp)}
                >
                  {opp.title}
                </h3>

                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ri-text-secondary)', marginBottom: 8 }}>
                  <span><Building2 size={13} style={{ display: 'inline', marginRight: 4 }} />{opp.agency}</span>
                  <span style={{ color: '#047857', fontWeight: 700 }}>{opp.funding_amount}</span>
                  <span><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Closing: {opp.close_date}</span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--ri-text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {opp.description}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                  className="ri-btn-card-action"
                  onClick={() => onSelectDetails(opp)}
                  title="View Full Details"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>

                <button
                  className="ri-btn-card-action"
                  onClick={() => onRemoveSaved(opp.id || opp.external_id)}
                  title="Remove Opportunity"
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
