import { X, ExternalLink, Bookmark, BookmarkCheck, Building2, Calendar, DollarSign, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
import { evaluateEligibility, getProfileMatchReasons } from '../../services/fundingService';
import { useAuth } from '../../context/AuthContext';

export default function FundingDetailsModal({
  opportunity,
  onClose,
  onToggleSave,
  isSaved = false,
}) {
  const { profile } = useAuth();
  if (!opportunity) return null;

  const eligibility = evaluateEligibility(profile, opportunity);
  const matchReasons = getProfileMatchReasons(profile, opportunity);

  return (
    <div className="ri-modal-backdrop" onClick={onClose}>
      <div className="ri-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
        {/* Header */}
        <div className="ri-modal-header" style={{ background: '#F4FBF7' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="ri-paper-source-badge" style={{ background: '#ECFDF5', color: '#047857' }}>
                {opportunity.source || 'Grants.gov'}
              </span>
              <span className={eligibility.badgeClass}>
                {eligibility.status}
              </span>
            </div>
            <h2 className="ri-modal-title">{opportunity.title}</h2>
          </div>
          <button className="ri-btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ri-modal-body">
          {/* Metadata Bar */}
          <div className="ri-modal-meta-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div>
              <span className="ri-meta-item-label">Funding Agency: </span>
              <span className="ri-meta-item-val" style={{ fontWeight: 700 }}>{opportunity.agency}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Award Ceiling: </span>
              <span className="ri-meta-item-val" style={{ color: '#047857', fontWeight: 800 }}>{opportunity.funding_amount}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Funding Type: </span>
              <span className="ri-meta-item-val">{opportunity.funding_type}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Post Date: </span>
              <span className="ri-meta-item-val">{opportunity.open_date}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Closing Date: </span>
              <span className="ri-meta-item-val" style={{ color: '#DC2626', fontWeight: 700 }}>{opportunity.close_date}</span>
            </div>
            <div>
              <span className="ri-meta-item-label">Opportunity ID: </span>
              <span className="ri-meta-item-val">{opportunity.external_id}</span>
            </div>
          </div>

          {/* Official Source Callout */}
          <div style={{ background: '#F8FAFC', border: '1px solid var(--ri-border-subtle)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="var(--ri-blue-accent)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12.5, color: 'var(--ri-text-secondary)' }}>
              <strong>Official Source Information:</strong> Opportunity details, closing dates, and guidelines are pulled directly from {opportunity.source}. Automated match scores represent platform analytics.
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
              Program Description &amp; Objectives
            </h4>
            <p style={{ fontSize: 13.5, color: 'var(--ri-text-secondary)', lineHeight: 1.6, background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid var(--ri-border-subtle)' }}>
              {opportunity.description}
            </p>
          </div>

          {/* Eligibility Breakdown */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
              Eligibility Requirements
            </h4>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '14px 16px', borderRadius: '8px', fontSize: 13, color: '#92400E' }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Official Eligibility Specification:</div>
              <div>{opportunity.eligibility}</div>
              <div style={{ marginTop: 8, fontSize: 12, borderTop: '1px solid #FCD34D', paddingTop: 6, color: '#78350F' }}>
                Automated Indication: <strong>{eligibility.status}</strong> — {eligibility.reason}
              </div>
            </div>
          </div>

          {/* Match Analysis */}
          {matchReasons.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
                Profile Alignment &amp; Match Rationale
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {matchReasons.map((m, i) => (
                  <span key={i} className="ri-tag-pill" style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE', fontWeight: 600 }}>
                    ✓ Matched Keyword: {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ri-border-subtle)', background: '#FAFCFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onToggleSave(opportunity)}
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            style={{ padding: '8px 16px' }}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Saved in My Opportunities' : 'Save Opportunity'}</span>
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            {opportunity.official_url && (
              <a
                href={opportunity.official_url}
                target="_blank"
                rel="noreferrer"
                className="ri-btn-refresh"
                style={{ textDecoration: 'none', padding: '8px 16px', background: '#047857' }}
              >
                <ExternalLink size={15} />
                <span>Apply on Grants.gov Official Portal</span>
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
