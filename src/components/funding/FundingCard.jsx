import { Eye, Bookmark, BookmarkCheck, Calendar, DollarSign, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { evaluateEligibility, getProfileMatchReasons } from '../../services/fundingService';
import { useAuth } from '../../context/AuthContext';

export default function FundingCard({
  opportunity,
  onSelectDetails,
  onToggleSave,
  isSaved = false,
}) {
  const { profile } = useAuth();
  if (!opportunity) return null;

  const eligibility = evaluateEligibility(profile, opportunity);
  const matchReasons = getProfileMatchReasons(profile, opportunity);

  return (
    <div className="ri-funding-card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
        <span className="ri-paper-source-badge" style={{ background: '#ECFDF5', color: '#047857' }}>
          {opportunity.source || 'Grants.gov'}
        </span>
        <span className={eligibility.badgeClass}>
          {eligibility.status === 'Potentially Eligible' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>{eligibility.status}</span>
        </span>
      </div>

      {/* Opportunity Title */}
      <h3
        className="ri-paper-title"
        onClick={() => onSelectDetails(opportunity)}
        title={opportunity.title}
        style={{ fontSize: 16 }}
      >
        {opportunity.title}
      </h3>

      {/* Agency & Amount */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--ri-text-secondary)', marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
          <Building2 size={14} color="var(--ri-navy-primary)" />
          {opportunity.agency}
        </span>
      </div>

      <div className="ri-funding-amount-tag">
        {opportunity.funding_amount}
      </div>

      {/* Excerpt */}
      <p className="ri-paper-abstract" style={{ WebkitLineClamp: 2, marginBottom: 10 }}>
        {opportunity.description}
      </p>

      {/* Why This Opportunity Matches */}
      {matchReasons.length > 0 && (
        <div className="ri-match-reason-box">
          <div className="ri-match-reason-title">
            <span>Why this opportunity matches:</span>
          </div>
          <div>
            {matchReasons.map((m, i) => (
              <span key={i} className="ri-match-tag">
                ✓ {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--ri-text-muted)', marginBottom: 14, paddingTop: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={13} /> Close: {opportunity.close_date}
        </span>
        <span className="ri-meta-pill">{opportunity.funding_type}</span>
      </div>

      {/* Card Actions */}
      <div className="ri-paper-footer">
        <span style={{ fontSize: 11.5, color: 'var(--ri-text-light)' }}>
          ID: {opportunity.external_id}
        </span>

        <div className="ri-paper-actions">
          <button
            className="ri-btn-card-action"
            onClick={() => onSelectDetails(opportunity)}
            title="View Full Opportunity Details"
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>

          <button
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(opportunity)}
            title={isSaved ? 'Saved in My Opportunities' : 'Save Opportunity'}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
